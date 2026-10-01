"""Analyze one immutable campaign; never pool runs or remove failed attempts."""
from pathlib import Path
from collections import defaultdict
import argparse, hashlib, json, math, random, statistics

parser = argparse.ArgumentParser()
parser.add_argument('--run', required=True)
parser.add_argument('--bootstrap', type=int, default=3000)
args = parser.parse_args()
assert args.bootstrap >= 1000, 'Use at least 1,000 uncertainty resamples'
run = Path(args.run).resolve()
input_bytes = {name: (run / name).read_bytes() for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
input_hashes = {name: hashlib.sha256(value).hexdigest() for name, value in input_bytes.items()}
manifest = json.loads(input_bytes['manifest.json'])
summary = json.loads(input_bytes['summary.json'])
raw = [json.loads(line) for line in input_bytes['samples.jsonl'].decode().splitlines() if line.strip()]
budgets = manifest['budgets']['values']
okay = [row for row in raw if row['status'] == 'ok']
failed = [row for row in raw if row['status'] in ('failed', 'aborted')]
groups = defaultdict(list)
for sample in okay:
    job = sample['job']
    if job['kind'] == 'timing':
        groups[(job['variant'], job['browser'], job['profile'], job['input'], job['requestedMode'], sample['actualMode'])].append(sample)

required_configurations = {('chromium', 'desktop', 'keyboard'), ('firefox', 'desktop', 'keyboard'), ('webkit', 'desktop', 'keyboard'), ('chromium', 'constrained', 'keyboard'), ('chromium', 'constrained-mobile', 'touch')}
required_modes = {'global', 'scoped'}
api_arms = {'reference/api-selective', 'reference/api-canonical', 'candidate/api-selective', 'candidate/api-canonical', 'candidate/api-profile'}
variant_by_id = {variant['id']: variant for variant in manifest['preparation']['identity']['variants']}
variant_by_id.update({variant['id']: variant for variant in manifest['variants']})

def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)

def required_metrics(variant_id):
    variant = variant_by_id.get(variant_id, {})
    if variant.get('family') == 'api' or variant_id in api_arms:
        return {'shellReadyMs', 'startupJSRequests', 'loadMs', 'ensureMs'}
    metrics = {'shellReadyMs', 'startupNodes', 'startupJSBytes'}
    policy = variant.get('policy', variant_id.rsplit('date-', 1)[-1])
    if policy in ('unused', 'abandoned'):
        metrics.update({policy + 'Bytes', policy + 'Nodes'})
    else:
        metrics.update({'firstReadyMs', 'repeatReadyMs'})
    return metrics

def comparison_identity(comparison):
    return comparison['kind'], comparison['reference'], comparison['candidate']

def percentile(values, p):
    values = sorted(values)
    if not values: return None
    index = (len(values) - 1) * p
    lo, hi = math.floor(index), math.ceil(index)
    return values[lo] + (values[hi] - values[lo]) * (index - lo)

def stats(values):
    return {'n': len(values), 'median': statistics.median(values), 'p75': percentile(values, .75),
            'p95': percentile(values, .95) if len(values) >= budgets['minimumSamplesForP95'] else None,
            'minimum': min(values), 'maximum': max(values)}

def paired_intervals(pairs, identity):
    def estimates(sample):
        reference = statistics.median(p[0] for p in sample)
        candidate = statistics.median(p[1] for p in sample)
        return candidate - reference, (reference - candidate) / reference * 100 if reference > 0 else None
    if len(set(pairs)) == 1:
        delta, reduction = estimates(pairs)
        return [delta, delta], [reduction, reduction] if reduction is not None else None
    rng = random.Random(hashlib.sha256(identity.encode()).hexdigest())
    deltas, reductions = [], []
    for _ in range(args.bootstrap):
        sample = [pairs[rng.randrange(len(pairs))] for _ in pairs]
        delta, reduction = estimates(sample)
        deltas.append(delta)
        reductions.append(reduction)
    reduction_interval = [percentile(reductions, .025), percentile(reductions, .975)] if all(numeric(value) for value in reductions) else None
    return [percentile(deltas, .025), percentile(deltas, .975)], reduction_interval

rows, missing = [], []
comparisons = manifest.get('comparisons', [])
assert len({comparison['id'] for comparison in comparisons}) == len(comparisons), 'Duplicate comparison IDs cannot replace gates'
assert len({comparison_identity(comparison) for comparison in comparisons}) == len(comparisons), 'Duplicate comparisons cannot replace gates'
expected_comparisons = {('api-overhead', 'reference/api-selective', 'candidate/api-selective'),
                        ('api-overhead', 'reference/api-canonical', 'candidate/api-canonical'),
                        ('api-overhead', 'reference/api-selective', 'candidate/api-profile')}
for variant in manifest['variants']:
    if variant['family'] != 'date': continue
    if variant['policy'] != 'eager': expected_comparisons.add(('date-benefit', variant['subject'] + '/date-eager', variant['id']))
    if variant['subject'] == 'candidate': expected_comparisons.add(('migration', variant['id'].replace('candidate/', 'reference/', 1), variant['id']))
present_comparisons = {comparison_identity(comparison) for comparison in comparisons}
for kind, reference, candidate in sorted(expected_comparisons - present_comparisons):
    missing.append({'comparison': None, 'kind': kind, 'reference': reference, 'candidate': candidate, 'reason': 'Required comparison not declared'})
for comparison in comparisons:
    reference, candidate = comparison['reference'], comparison['candidate']
    required = required_metrics(candidate)
    candidate_groups = [(key, samples) for key, samples in groups.items() if key[0] == candidate]
    for configuration in sorted(required_configurations):
        for requested in sorted(required_modes):
            candidate_cells = [key for key, _ in candidate_groups if key[1:5] == (*configuration, requested)]
            if len(candidate_cells) != 1:
                missing.append({'comparison': comparison['id'], 'configuration': [*configuration, requested], 'reason': 'Required candidate timing configuration must contain exactly one actual registry mode'})
    for key, candidate_samples in candidate_groups:
        reference_samples = groups.get((reference, *key[1:]))
        if not reference_samples:
            missing.append({'comparison': comparison['id'], 'configuration': list(key[1:]), 'reason': 'Matched reference including actual registry mode not present'})
            continue
        refs = {sample['job']['block']: sample for sample in reference_samples}
        candidates = {sample['job']['block']: sample for sample in candidate_samples}
        assert len(refs) == len(reference_samples) and len(candidates) == len(candidate_samples), 'Duplicate block observations cannot replace samples'
        if refs.keys() != candidates.keys():
            missing.append({'comparison': comparison['id'], 'configuration': list(key[1:]), 'reason': 'Reference and candidate block sets differ'})
        for metric in sorted(required | set().union(*(sample['metrics'] for sample in candidate_samples))):
            reference_metric = {'unusedBytes': 'startupJSBytes', 'abandonedBytes': 'startupJSBytes', 'unusedNodes': 'startupNodes', 'abandonedNodes': 'startupNodes'}.get(metric, metric) if comparison['kind'] == 'date-benefit' else metric
            blocks = [block for block in sorted(refs.keys() & candidates.keys()) if numeric(refs[block]['metrics'].get(reference_metric)) and numeric(candidates[block]['metrics'].get(metric))]
            pairs = [(refs[block]['metrics'][reference_metric], candidates[block]['metrics'][metric]) for block in blocks]
            metric_complete = len(pairs) == len(refs) == len(candidates)
            if metric in required and (not metric_complete or len(pairs) < budgets['minimumSuccessfulTimingSamplesPerCell']):
                missing.append({'comparison': comparison['id'], 'configuration': list(key[1:]), 'metric': metric, 'n': len(pairs),
                                'reason': 'Required metric has absent/non-finite observations or insufficient matched blocks'})
            if not pairs: continue
            a, b = [p[0] for p in pairs], [p[1] for p in pairs]
            ref_stats, candidate_stats = stats(a), stats(b)
            change = candidate_stats['median'] - ref_stats['median']
            interval, reduction_interval = paired_intervals(pairs, comparison['id'] + str(key) + metric)
            row = {'comparison': comparison['id'], 'kind': comparison['kind'], 'reference': reference, 'candidate': candidate,
                   'browser': key[1], 'profile': key[2], 'input': key[3], 'requestedMode': key[4], 'actualMode': key[5], 'metric': metric,
                   **candidate_stats, 'referenceMedian': ref_stats['median'], 'referenceP75': ref_stats['p75'],
                   'delta': change, 'deltaPercent': change / ref_stats['median'] * 100 if ref_stats['median'] else None,
                   'interval': interval, 'reductionPercent': -change / ref_stats['median'] * 100 if ref_stats['median'] > 0 else None,
                   'reductionInterval': reduction_interval, 'metricComplete': metric_complete, 'blocks': blocks}
            rows.append(row)

retention = []
invalid_retention = []
for sample in okay:
    job = sample['job']
    if job['kind'] != 'retention': continue
    observed_checkpoints = sample.get('checkpoints', [])
    checkpoints = {value['cycle']: value for value in observed_checkpoints}
    if (len(checkpoints) != len(observed_checkpoints) or not set(budgets['retention']['checkpoints']).issubset(checkpoints)
        or any(not numeric(checkpoints[cycle].get('heapBytes'))
               or any(not numeric(checkpoints[cycle].get('dom', {}).get(metric)) for metric in ('nodes', 'jsEventListeners', 'documents'))
               for cycle in budgets['retention']['checkpoints'] if cycle in checkpoints)):
        invalid_retention.append({'variant': job['variant'], 'requestedMode': job['requestedMode'], 'actualMode': sample['actualMode'], 'block': job['block'], 'reason': 'Required retention checkpoints or finite counters missing'})
        continue
    a, b = checkpoints[10], checkpoints[100]
    retention.append({'variant': job['variant'], 'block': job['block'], 'requestedMode': job['requestedMode'], 'actualMode': sample['actualMode'],
                      'heapDelta': b['heapBytes'] - a['heapBytes'], 'nodeDelta': b['dom']['nodes'] - a['dom']['nodes'],
                      'listenerDelta': b['dom']['jsEventListeners'] - a['dom']['jsEventListeners'],
                      'documentDelta': b['dom']['documents'] - a['dom']['documents'], 'documentsAt100': b['dom']['documents']})

checks = []
def check(identity, value, maximum=None, minimum=None, interval=None, n=None, *, complete=True, alternative=False):
    passed = numeric(value) and (maximum is None or value <= maximum) and (minimum is None or value >= minimum)
    status = 'pass' if passed else 'fail'
    if not complete or not numeric(value): status = 'missing-metric'
    elif n is not None and n < budgets['minimumSuccessfulTimingSamplesPerCell']: status = 'insufficient-samples'
    elif n is not None and (interval is None or len(interval) != 2 or not all(numeric(value) for value in interval)): status = 'missing-uncertainty'
    elif passed and interval is not None and ((maximum is not None and interval[1] > maximum) or (minimum is not None and interval[0] < minimum)): status = 'uncertain'
    result = {'id': identity, 'value': value, 'maximum': maximum, 'minimum': minimum, 'interval': interval, 'n': n, 'status': status}
    if alternative: result['alternative'] = 'OR: either node or JavaScript reduction must satisfy its own minimum and uncertainty bound'
    checks.append(result)
    return result

cell_fields = ('comparison', 'browser', 'profile', 'input', 'requestedMode', 'actualMode')
by_cell = defaultdict(dict)
for row in rows: by_cell[tuple(row[k] for k in cell_fields)][row['metric']] = row
for comparison in comparisons:
    required = required_metrics(comparison['candidate'])
    for configuration in sorted(required_configurations):
        for requested in sorted(required_modes):
            actual_modes = {key[5] for key in groups if key[:5] == (comparison['candidate'], *configuration, requested)}
            for actual in sorted(actual_modes or {'missing'}):
                key = (comparison['id'], *configuration, requested, actual)
                metrics, identity = by_cell[key], ':'.join(key)
                profile = 'desktop' if configuration[1] == 'desktop' else 'constrained'
                if comparison['kind'] == 'api-overhead':
                    limits = {metric: budgets['apiOverhead'][budget][profile] for metric, budget in
                              [('shellReadyMs', 'maximumAddedStartupReadyMs'), ('loadMs', 'maximumAddedLoadMs'), ('ensureMs', 'maximumAddedEnsureMs')]}
                    limits['startupJSRequests'] = budgets['apiOverhead']['maximumAddedStartupJSRequests']
                else:
                    limits = {metric: budgets['dateFeature'][budget][profile] for metric, budget in
                              [('shellReadyMs', 'maximumAddedShellReadyMs'), ('firstReadyMs', 'maximumAddedFirstReadyMs'), ('repeatReadyMs', 'maximumAddedRepeatReadyMs')] if metric in required}
                    if comparison['kind'] == 'date-benefit':
                        limits.update({metric: budgets['dateFeature']['maximumAddedUnusedDeliveryBytes'] for metric in ('unusedBytes', 'abandonedBytes') if metric in required})
                for metric, limit in limits.items():
                    row = metrics.get(metric, {})
                    check(identity + ':' + metric, row.get('delta'), maximum=limit, interval=row.get('interval'), n=row.get('n', 0), complete=row.get('metricComplete', False))
                if comparison['kind'] != 'date-benefit': continue
                alternatives = []
                for metric, label, threshold in [('startupNodes', 'nodes', budgets['dateFeature']['minimumUnusedConnectedNodeReductionPercent']),
                                                 ('startupJSBytes', 'js', budgets['dateFeature']['orMinimumStartupJSReductionPercent'])]:
                    row = metrics.get(metric, {})
                    alternatives.append(check(identity + ':component-benefit-' + label, row.get('reductionPercent'), minimum=threshold,
                                              interval=row.get('reductionInterval'), n=row.get('n', 0), complete=row.get('metricComplete', False), alternative=True))
                # Normalize the frozen OR alternatives only for the aggregate display.
                # Its lower bound passes exactly when one alternative's lower bound passes.
                available = all(numeric(item['value']) and item['interval'] is not None for item in alternatives)
                value = max(item['value'] / item['minimum'] for item in alternatives) if available else None
                interval = [max(item['interval'][bound] / item['minimum'] for item in alternatives) for bound in (0, 1)] if available else None
                benefit = check(identity + ':component-benefit', value, minimum=1, interval=interval, n=min(item['n'] for item in alternatives),
                                complete=available and all(item['status'] != 'missing-metric' for item in alternatives))
                benefit.update({'unit': 'Maximum fraction of the frozen node or JavaScript reduction minimum', 'alternatives': [item['id'] for item in alternatives],
                                'scope': 'Single-date fixture only; no route claim'})

for row in retention:
    identity = f"{row['variant']}:{row['requestedMode']}:{row['actualMode']}:{row['block']}"
    check(identity + ':nodes10to100', row['nodeDelta'], maximum=budgets['retention']['maximumGrowth10To100NodesEveryRepetition'])
    check(identity + ':listeners10to100', row['listenerDelta'], maximum=budgets['retention']['maximumGrowth10To100ListenersEveryRepetition'])
for comparison in comparisons:
    for requested in ('global', 'scoped'):
        for actual in ('global', 'scoped'):
            reference = [r for r in retention if r['variant'] == comparison['reference'] and r['requestedMode'] == requested and r['actualMode'] == actual]
            candidate = [r for r in retention if r['variant'] == comparison['candidate'] and r['requestedMode'] == requested and r['actualMode'] == actual]
            if not reference and not candidate: continue
            identity = comparison['id'] + ':' + requested + ':' + actual + ':retention-heap'
            reference_blocks, candidate_blocks = {r['block'] for r in reference}, {r['block'] for r in candidate}
            if (reference_blocks != candidate_blocks or len(reference_blocks) != len(reference) or len(candidate_blocks) != len(candidate)
                or min(len(reference), len(candidate)) < budgets['retention']['freshContextsPerArm']):
                checks.append({'id': identity, 'status': 'insufficient-retention', 'referenceN': len(reference), 'candidateN': len(candidate)})
            else:
                delta = statistics.median(r['heapDelta'] for r in candidate) - statistics.median(r['heapDelta'] for r in reference)
                check(identity, delta, maximum=budgets['retention']['maximumAdditionalMedianHeapGrowthVersusPairedEagerBytes'])

# Emitted size is deterministic and separate from measured transferred bodies.
prepared = Path(manifest['preparation']['path'])
assets = []
for variant in manifest['preparation']['identity']['variants']:
    receipt_path = prepared / variant.get('receipt', variant.get('root', variant['id']) + '/receipt.json')
    receipt_bytes = receipt_path.read_bytes()
    receipt_sha256 = hashlib.sha256(receipt_bytes).hexdigest()
    receipt_verified = receipt_sha256 == variant.get('receiptSha256')
    receipt = json.loads(receipt_bytes)
    js_assets = [asset for asset in receipt['assets'] if asset['path'].endswith(('.js', '.mjs'))]
    assets.append({'variant': variant['id'], 'family': variant['family'], 'startupGzipBytes': receipt.get('startupGzipBytes') if receipt_verified else None,
                   'declaredShellGzipBytes': receipt.get('declaredShellGzipBytes') if receipt_verified else None,
                   'declaredShellFiles': receipt.get('declaredShellFiles') if receipt_verified else None,
                   'allEmittedGzipBytes': sum(asset['gzipBytes'] for asset in js_assets) if receipt_verified and js_assets and all(numeric(asset.get('gzipBytes')) for asset in js_assets) else None, 'receipt': str(receipt_path),
                   'receiptSha256': receipt_sha256, 'expectedReceiptSha256': variant.get('receiptSha256'), 'receiptVerified': receipt_verified})
asset_by_id = {a['variant']: a for a in assets}
for candidate, reference in [('candidate/api-selective', 'reference/api-selective'), ('candidate/api-profile', 'reference/api-selective')]:
    a, b = asset_by_id.get(reference), asset_by_id.get(candidate)
    valid = a and b and numeric(a['startupGzipBytes']) and numeric(b['startupGzipBytes'])
    check(candidate + ':selective-gzip', b['startupGzipBytes'] - a['startupGzipBytes'] if valid else None, maximum=budgets['apiOverhead']['maximumAddedSelectiveGzipBytes'])
metadata = asset_by_id.get('candidate/metadata')
check('candidate/metadata:descriptor-gzip', metadata['allEmittedGzipBytes'] if metadata else None, maximum=budgets['apiOverhead']['maximumDescriptorGzipBytes'])

selected = {v['id'] for v in manifest['variants']}
expected = {v['id'] for v in manifest['preparation']['identity']['variants'] if v['family'] in ('api', 'date')}
required_stage_b_arms = api_arms | {subject + '/date-' + policy for subject in ('reference', 'candidate') for policy in ('eager', 'construction', 'cold', 'prepared', 'immediate', 'unused', 'abandoned')}
declared_configurations = {(item['browser'], item['profile'], item['input']) for item in manifest['configs']}
full_matrix = (selected == expected and required_stage_b_arms.issubset(selected) and declared_configurations == required_configurations
               and len(manifest['configs']) == len(required_configurations) and set(manifest['modes']) == required_modes and len(manifest['modes']) == len(required_modes))
def job_identity(job):
    return tuple(job.get(field) for field in ('kind', 'variant', 'browser', 'profile', 'input', 'requestedMode', 'block'))
planned_jobs = [job_identity(job) for job in manifest.get('jobs', [])]
successful_jobs = [job_identity(sample['job']) for sample in okay]
started_jobs = [job_identity(sample['job']) for sample in raw if sample['status'] == 'started']
job_coverage_complete = (bool(planned_jobs) and len(set(successful_jobs)) == len(successful_jobs)
                         and len(set(planned_jobs)) == len(planned_jobs) and len(set(started_jobs)) == len(started_jobs)
                         and set(planned_jobs) == set(started_jobs) == set(successful_jobs))
receipts_verified = bool(assets) and all(asset['receiptVerified'] for asset in assets)
complete = (summary['status'] == 'complete' and summary['succeeded'] == summary['planned'] == summary.get('terminal') == len(okay)
            and not failed and job_coverage_complete and receipts_verified)
def decision(selected_checks, *, applicable=True):
    if not applicable: return {'status': 'not-applicable', 'checks': []}
    if not selected_checks: return {'status': 'not-qualified', 'checks': []}
    statuses = {item['status'] for item in selected_checks}
    status = 'fail' if 'fail' in statuses else 'uncertain' if 'uncertain' in statuses else 'pass' if statuses == {'pass'} else 'not-qualified'
    return {'status': status, 'checks': [item['id'] for item in selected_checks]}

def arms_complete(arm_ids):
    if (declared_configurations != required_configurations or len(manifest['configs']) != len(required_configurations)
        or set(manifest['modes']) != required_modes or len(manifest['modes']) != len(required_modes)): return False
    if (type(manifest.get('n')) is not int or manifest['n'] < budgets['minimumSuccessfulTimingSamplesPerCell']
        or type(manifest.get('repetitions')) is not int or manifest['repetitions'] < budgets['retention']['freshContextsPerArm']): return False
    for arm in arm_ids:
        if arm not in selected: return False
        for browser, profile, interaction in required_configurations:
            for requested in ('global', 'scoped'):
                cells = [(key, samples) for key, samples in groups.items() if key[:5] == (arm, browser, profile, interaction, requested)]
                if len(cells) != 1: return False
                key, samples = cells[0]
                if key[5] not in required_modes: return False
                blocks = {sample['job']['block'] for sample in samples}
                if len(blocks) != len(samples) or len(samples) < budgets['minimumSuccessfulTimingSamplesPerCell']: return False
                if blocks != set(range(manifest['n'])): return False
                if any(not numeric(sample['metrics'].get(metric)) for sample in samples for metric in required_metrics(arm)): return False
        for requested in ('global', 'scoped'):
            cells = [row for row in retention if row['variant'] == arm and row['requestedMode'] == requested]
            blocks = {row['block'] for row in cells}
            actual_modes = {row['actualMode'] for row in cells}
            timing_modes = {key[5] for key in groups if key[:5] == (arm, 'chromium', 'desktop', 'keyboard', requested)}
            if (len(blocks) != len(cells) or len(cells) < budgets['retention']['freshContextsPerArm'] or len(actual_modes) != 1
                or actual_modes != timing_modes or not actual_modes.issubset(required_modes)): return False
            if blocks != set(range(manifest['repetitions'])): return False
            if any(row['variant'] == arm and row['requestedMode'] == requested for row in invalid_retention): return False
    return True

api_ids = {comparison['id'] for comparison in comparisons if comparison['kind'] == 'api-overhead'}
api_checks = [item for item in checks if any(item['id'].startswith(identity + ':') for identity in api_ids)
              or any(item['id'].startswith(arm + ':') and item['id'].endswith((':nodes10to100', ':listeners10to100')) for arm in api_arms)
              or item['id'].endswith(':selective-gzip') or item['id'] == 'candidate/metadata:descriptor-gzip']
api_decision = decision(api_checks)
api_matrix = arms_complete(api_arms)
api_decision['matrixComplete'] = api_matrix
policy_decisions = []
for variant in manifest['variants']:
    if variant['family'] != 'date': continue
    own_comparisons = [comparison for comparison in comparisons if comparison['candidate'] == variant['id']]
    benefit_ids = [comparison['id'] for comparison in own_comparisons if comparison['kind'] == 'date-benefit']
    migration_ids = [comparison['id'] for comparison in own_comparisons if comparison['kind'] == 'migration']
    def selected_checks(ids): return [item for item in checks if any(item['id'].startswith(identity + ':') for identity in ids)]
    benefit_checks = selected_checks(benefit_ids)
    benefit = decision([item for item in benefit_checks if item['id'].endswith(':component-benefit')], applicable=variant['policy'] != 'eager')
    latency = decision([item for item in benefit_checks if item['id'].endswith((':shellReadyMs', ':firstReadyMs', ':repeatReadyMs'))], applicable=variant['policy'] != 'eager')
    delivery = decision([item for item in benefit_checks if item['id'].endswith((':unusedBytes', ':abandonedBytes'))], applicable=variant['policy'] in ('unused', 'abandoned'))
    migration = decision([item for item in selected_checks(migration_ids) if not item['id'].endswith(':retention-heap')], applicable=variant['subject'] == 'candidate')
    required_arms = {variant['id'], variant['subject'] + '/date-eager'}
    if variant['subject'] == 'candidate': required_arms.add(variant['id'].replace('candidate/', 'reference/', 1))
    retention_checks = [item for item in checks if any(item['id'].startswith(arm + ':') for arm in required_arms) and item['id'].endswith((':nodes10to100', ':listeners10to100'))]
    retention_checks += [item for item in benefit_checks + selected_checks(migration_ids) if item['id'].endswith(':retention-heap')]
    retained = decision(retention_checks)
    applicable_statuses = [part['status'] for part in (benefit, latency, delivery, migration, retained) if part['status'] != 'not-applicable']
    matrix_complete = arms_complete(required_arms)
    own_missing = any(item['comparison'] in benefit_ids + migration_ids or item.get('candidate') == variant['id'] for item in missing)
    qualifies = complete and matrix_complete and not manifest['qualification'] and not own_missing and applicable_statuses and all(status == 'pass' for status in applicable_statuses)
    policy_decisions.append({'variant': variant['id'], 'policy': variant['policy'], 'matrixComplete': matrix_complete, 'comparisonsComplete': not own_missing, 'benefit': benefit, 'latency': latency, 'delivery': delivery, 'migration': migration, 'retention': retained,
                             'recommendation': 'qualified-for-this-fixture' if qualifies else 'diagnostic-only' if variant['policy'] in ('cold', 'immediate') else 'not-qualified',
                             'limits': 'No real-route adoption, manual acceptance or other-family conclusion follows.'})
api_missing = any(item['comparison'] in api_ids or item.get('kind') == 'api-overhead' for item in missing)
api_decision['comparisonsComplete'] = not api_missing
if not complete or not api_matrix or manifest['qualification'] or api_missing:
    if api_decision['status'] == 'pass': api_decision['status'] = 'not-qualified'
decisions = {'apiOverhead': api_decision, 'datePolicies': policy_decisions,
             'rolloutAcceptance': 'Not decided by this harness; other families, integration and user review remain separate.'}
result = {'schemaVersion': 1, 'run': str(run), 'qualification': manifest['qualification'], 'complete': complete, 'fullStageBMatrix': full_matrix,
          'sourceManifestSha256': input_hashes['manifest.json'], 'rawSha256': input_hashes['samples.jsonl'],
          'summarySha256': input_hashes['summary.json'],
          'successfulTiming': sum(r['job']['kind'] == 'timing' for r in okay), 'successfulRetention': len(retention), 'failedOrAborted': failed,
          'missingComparisons': missing, 'invalidRetention': invalid_retention, 'jobCoverageComplete': job_coverage_complete, 'assetReceiptsVerified': receipts_verified, 'rows': rows, 'retention': retention, 'assets': assets, 'checks': checks,
          'automatedGate': 'independent-policy-decisions' if complete and full_matrix and not manifest['qualification'] and not missing else 'not-qualified',
          'allNumericChecksPass': bool(checks) and all(c['status'] == 'pass' for c in checks if not c.get('alternative')), 'decisions': decisions,
          'limits': ['No previous manual or performance acceptance inherited.', 'No route-benefit or universal-feature claim.', 'P95 omitted below 100 successful observations.', 'Bootstrap uncertainty is exploratory; no multiple-comparison correction.', 'Cold-policy failure remains diagnostic and cannot qualify a latency recommendation.']}
for name, expected in input_hashes.items():
    if hashlib.sha256((run / name).read_bytes()).hexdigest() != expected:
        raise ValueError('Original input changed during analysis: ' + name)
(run / 'analysis.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['complete', 'fullStageBMatrix', 'successfulTiming', 'successfulRetention', 'automatedGate']}, indent=2))
