"""Frozen command/pagination gates for the matched actual-route campaign.

Pure analysis only. The caller supplies the common analysis functions in ``core``.
Cold command loading is never silently substituted for same-code construction.
Missing measurements, controls, policies, blocks or diagnostics remain pending.
"""
from collections import Counter, defaultdict
import random

FAMILIES = ('command', 'pagination')
ARMS = ('reference', 'candidate', 'rollback')
CONFIGS = tuple((engine, profile) for engine in ('chromium', 'firefox', 'webkit')
                for profile in ('desktop', 'phone')) + (('chromium', 'constrained'),)
ACTIONS = ('keyboard', 'pointer')
COMPARISONS = (('candidate-reference', 'reference', 'candidate'),
               ('candidate-rollback', 'rollback', 'candidate'),
               ('rollback-reference', 'reference', 'rollback'))
PAGER_IDS = ('api-pagination', 'api-pagination-intermediate', 'api-pagination-mobile',
             'pagination-start', 'pagination-distributed', 'api-pagination-slotted',
             'pagination-text-slotted', 'api-pagination-unknown')
ADOPTED_PAGERS = tuple(name for name in PAGER_IDS if name not in
                      ('api-pagination-slotted', 'api-pagination-unknown'))
COMMAND_POLICIES = ('cold', 'same-code', 'prepared-0', 'prepared-50', 'prepared-200',
                    'unused')
CONSTRAINED = {'cpuRate': 4, 'latencyMs': 150, 'downloadBitsPerSecond': 1600000,
               'uploadBitsPerSecond': 750000}


def _helpers(core):
    return core['get'], core['numeric'], core['check']


def _policy(job):
    return job.get('deliveryPolicy', 'cold' if job.get('family') == 'command' else 'same-code')


def _timing_matrix(run, family, core, policy=None):
    get, numeric, _ = _helpers(core)
    manifest, raw = run['manifest'], run['raw']
    n = manifest.get('n')
    n = n if type(n) is int and n > 0 else 30
    policy = policy or ('cold' if family == 'command' else 'same-code')
    required_actions = ('none',) if policy == 'unused' else ACTIONS
    expected = {(browser, profile, action, arm, block) for browser, profile in CONFIGS
                for action in required_actions for arm in ARMS for block in range(n)}
    key = lambda job: tuple(job.get(name) for name in ('browser', 'profile', 'action', 'arm', 'block'))
    scoped = lambda job: job.get('family') == family and _policy(job) == policy
    jobs = [job for job in manifest.get('jobs', []) if scoped(job)]
    declared = Counter(key(job) for job in jobs)
    plans = {key(job): job for job in jobs}
    records = [row for row in raw if isinstance(row, dict) and isinstance(row.get('job'), dict) and scoped(row['job'])]
    starts = Counter(key(row['job']) for row in records if row.get('status') == 'started')
    terminals = [row for row in records if row.get('status') != 'started']
    counts = Counter(key(row['job']) for row in terminals)
    groups, diagnostics = defaultdict(dict), []
    if type(manifest.get('n')) is not int or manifest['n'] < 30:
        diagnostics.append('A declared integer n≥30 is required; a fallback shape cannot qualify')
    if manifest.get('deliveryPolicies', {}).get(family) != (list(COMMAND_POLICIES) if family == 'command' else ['same-code']):
        diagnostics.append('Exact frozen delivery policies must be declared explicitly')
    all_family_jobs = [job for job in manifest.get('jobs', []) if job.get('family') == family] + [row.get('job', {}) for row in raw if isinstance(row, dict) and get(row, 'job.family') == family]
    if any(job.get('deliveryPolicy') not in (COMMAND_POLICIES if family == 'command' else ('same-code',)) for job in all_family_jobs):
        diagnostics.append('Unknown or missing policy attempts cannot disappear from family completeness')
    if any(not isinstance(row, dict) or get(row, 'job.family') not in ('media', 'combobox', *FAMILIES) for row in raw):
        diagnostics.append('Unknown/unassigned raw attempts cannot disappear from completeness')
    if any(get(row, 'job.family') == 'command' and _policy(row.get('job', {})) not in COMMAND_POLICIES for row in raw):
        diagnostics.append('Unknown command delivery policy')
    if set(manifest.get('actions', [])) != set(ACTIONS) or {(c.get('browser'), c.get('profile')) for c in manifest.get('configs', [])} != set(CONFIGS):
        diagnostics.append('Required seven configurations and both input actions missing')
    if manifest.get('constrained') != CONSTRAINED or manifest.get('motion') != 'no-preference':
        diagnostics.append('Frozen CPU/network/motion profile differs')
    if set(declared) != expected or any(value != 1 for value in declared.values()):
        diagnostics.append('Each configuration/input/arm/block must be planned exactly once for ' + policy)
    if set(starts) != expected or any(value != 1 for value in starts.values()):
        diagnostics.append('Each planned job requires exactly one retained start')
    if set(counts) != expected or any(value != 1 for value in counts.values()):
        diagnostics.append('Every planned job requires exactly one retained terminal; failures are not replaced')
    for row in records:
        if row['job'] != plans.get(key(row['job'])):
            diagnostics.append('Raw job differs from its declared plan')
    for row in terminals:
        job = row['job']; identity = key(job); problems = []
        if identity not in expected or counts[identity] != 1 or starts[identity] != 1:
            problems.append('Unexpected, duplicate or orphan terminal')
        if row.get('status') != 'ok' or row.get('errors') or row.get('failures'):
            problems.append('Failed/aborted terminal or browser/network error')
        if job.get('requestedRegistry') != 'production-default':
            problems.append('Actual production-default request must be recorded')
        if family == 'command':
            if get(row, 'startup.snapshot.actualRegistry') != 'unregistered' or get(row, 'startup.snapshot.routeRegistry') != 'global' or get(row, 'startup.snapshot.workload.hostRegistered') is not False:
                problems.append('Actual cold startup must retain the global owner and unregistered palette topology')
            if policy != 'unused' and (get(row, 'first.snapshot.actualRegistry') != 'global' or get(row, 'second.snapshot.actualRegistry') != 'global'):
                problems.append('Endpoint owning registry must be observed global after activation')
        elif row.get('actualRegistry') != 'global':
            problems.append('Actual production-global owner must be observed')
        if not row.get('browserVersion') or job.get('viewport') != ({'width': 390, 'height': 844} if job.get('profile') == 'phone' else {'width': 1280, 'height': 900}):
            problems.append('Browser version or actual viewport missing/different')
        for metric in core['METRICS']:
            if policy == 'unused' and metric in ('firstReadyMs', 'repeatReadyMs', 'recreatedNodes'):
                continue
            if not numeric(get(row, 'metrics.' + metric)) or get(row, 'metrics.' + metric) < 0:
                problems.append('Missing/invalid metric: ' + metric)
        if policy != 'unused' and (not get(row, 'first.trusted') or not get(row, 'second.trusted')):
            problems.append('First and repeat require trusted input')
        if family == 'command':
            if get(row, 'startup.snapshot.workload.items') != 4 or get(row, 'startup.snapshot.workload.disabledItems') != 2 or get(row, 'startup.snapshot.workload.catalogMatches') is not True:
                problems.append('Exact four-command settings catalog missing')
            if get(row, 'startup.snapshot.workload.contentRendering') != ('on-demand' if job['arm'] == 'candidate' else 'eager'):
                problems.append('Wrong pre-authored command policy')
            if policy == 'same-code' and get(row, 'preparation.sameCodeReady') is not True:
                problems.append('Same-code first use lacks recorded code/registration completion before activation')
            for phase in (() if policy == 'unused' else ('first', 'second')):
                if any(get(row, phase + '.endpoint.' + flag) is not True for flag in ('modality', 'searchFocused', 'currentCatalog', 'ariaValid')):
                    problems.append('Command usable endpoint missing: ' + phase)
        else:
            pagers = get(row, 'startup.snapshot.workload.pagers', [])
            by_id = {p.get('id'): p for p in pagers if isinstance(p, dict)}
            if len(pagers) != 8 or set(by_id) != set(PAGER_IDS):
                problems.append('Exact eight-pager route missing, duplicated or inflated')
            for name in PAGER_IDS:
                pager = by_id.get(name, {})
                selected, known = name in ADOPTED_PAGERS, name != 'api-pagination-unknown'
                if pager.get('eligible') is not selected or pager.get('knownTotal') is not known:
                    problems.append('Pager adoption/control identity differs: ' + name)
                if pager.get('contentRendering') != ('on-demand' if selected and job['arm'] == 'candidate' else 'eager'):
                    problems.append('Wrong authored pager policy: ' + name)
                if not numeric(pager.get('componentNodes')) or pager['componentNodes'] <= 0:
                    problems.append('Missing recursive per-pager count: ' + name)
                if pager.get('pageCount') != (12 if name == 'api-pagination' else 0 if not known else 40) or pager.get('page') != (1 if name in ('api-pagination', 'api-pagination-unknown') else 6):
                    problems.append('Known page-count workload changed: ' + name)
            for phase in ('first', 'second'):
                if any(get(row, phase + '.endpoint.' + flag) is not True for flag in ('inputFocused', 'inputEnabled', 'inputValid', 'positionUsable', 'nativePopoverOpen', 'firstPresentation.ready', 'shellSame', 'nativeClickTrusted')) or get(row, phase + '.endpoint.bodyElements') != 5 or get(row, phase + '.endpoint.defaultPrevented') is not False or get(row, phase + '.endpoint.openingEvents') != 1 or get(row, phase + '.endpoint.nativeClicks') != 1 or get(row, phase + '.endpoint.keydownDefaultPrevented') is not False or get(row, phase + '.endpoint.inputValue') != ('1' if phase == 'first' else '9'):
                    problems.append('Complete native first-presentation endpoint missing: ' + phase)
        if problems:
            diagnostics.append({'job': job, 'problems': problems})
        else:
            groups[identity[:4]][job['block']] = row
    complete = not diagnostics and n >= 30 and run['integrity']['verified'] and not manifest.get('qualification')
    return groups, {'complete': complete, 'deliveryPolicy': policy, 'nPlannedPerCell': n,
                    'successful': sum(map(len, groups.values())), 'required': len(expected),
                    'diagnostics': diagnostics, 'integrity': run['integrity']}


def _margin(pairs, fraction, absolute, relative, core, bootstrap, *, improvement=False):
    """CI for delta minus max(absolute, relative comparator), resampling its bound too."""
    quantile, numeric = core['quantile'], core['numeric']
    def value(sample):
        before = quantile([p[0] for p in sample], fraction)
        after = quantile([p[1] for p in sample], fraction)
        if not numeric(before) or not numeric(after):
            return None
        delta = before - after if improvement else after - before
        return delta - max(absolute, relative * before)
    point = value(pairs)
    if not pairs:
        return point, None
    if len(set(pairs)) == 1:
        return point, [point, point]
    rng = random.Random(core['digest']([pairs, fraction, absolute, relative, improvement, 20260928]))
    estimates = [value([pairs[rng.randrange(len(pairs))] for _ in pairs]) for _ in range(bootstrap)]
    return point, [quantile(estimates, .025), quantile(estimates, .975)]


def _rows(groups, family, policy, core, bootstrap):
    rows = core['compare_metrics'](groups, family, bootstrap)
    for row in rows:
        row['deliveryPolicy'] = policy
    return rows


def _timing_checks(family, groups, matrix, rows, core, bootstrap):
    get, numeric, check = _helpers(core)
    checks = []
    check(checks, 'complete-' + matrix['deliveryPolicy'] + '-timing-matrix', 'coverage', int(matrix['complete']), minimum=1,
          complete=matrix['complete'], reason='Seven configurations × two trusted input methods × three exact arms × n≥30; every attempt retained')
    for row in rows:
        prefix = '/'.join([row['deliveryPolicy'], row['comparison'], row['browser'], row['profile'], row['action']])
        complete = matrix['complete'] and row['paired'] and row['n'] >= 30
        metric, primary = row['metric'], row['after'] == 'candidate'
        def delta(label, maximum, fraction='p75', percent=False, category='latency'):
            ci = row[fraction + 'Uncertainty']['percent' if percent else 'delta']
            check(checks, prefix + '/' + label, category, row[fraction + ('Percent' if percent else 'Delta')],
                  maximum=maximum, bounds=ci, complete=complete and ci is not None, n=row['n'])
        def maximum_margin(label, absolute, relative, fraction='.75', improvement=False, category='latency'):
            left = groups.get((row['browser'], row['profile'], row['action'], row['before']), {})
            right = groups.get((row['browser'], row['profile'], row['action'], row['after']), {})
            pairs = tuple((left[b]['metrics'][metric], right[b]['metrics'][metric]) for b in row['blocks'])
            point, bounds = _margin(pairs, float(fraction), absolute, relative, core, bootstrap, improvement=improvement)
            check(checks, prefix + '/' + label, category, point, minimum=0 if improvement else None,
                  maximum=None if improvement else 0, bounds=bounds, complete=complete and bounds is not None, n=row['n'],
                  reason='Margin against frozen max(' + str(absolute) + 'ms, ' + str(relative * 100) + '% comparator); bound is recomputed within each paired resample')
        if metric in ('entryRequests', 'settledRequests'):
            check(checks, prefix + '/' + metric + '-additional', 'packaging', row['maximumPairedDelta'], maximum=0, complete=complete, n=row['n'])
        if family == 'command':
            cold = row['deliveryPolicy'] == 'cold'
            if metric in ('entryGzipBytes', 'settledGzipBytes'):
                check(checks, prefix + '/' + metric + '-overhead', 'packaging', row['maximumPairedDelta'], maximum=1024, complete=complete, n=row['n'],
                      reason='Frozen whole-route implementation overhead ceiling; no optional-code saving is claimed')
            if cold and primary and metric == 'startupComponentNodes':
                delta('component-nodes', -20, fraction='median', category='benefit')
                delta('component-nodes-percent', -20, fraction='median', percent=True, category='benefit')
            if cold and primary and metric == 'startupDocumentNodes':
                delta('route-nodes-percent', -2, fraction='median', percent=True, category='benefit')
            if cold and primary and metric == 'startupReadyMs':
                maximum_margin('startup-median-improvement-margin', 2, .03, '.5', improvement=True, category='benefit')
            if row['deliveryPolicy'] == 'same-code' and metric == 'firstReadyMs':
                if primary:
                    constrained = row['profile'] == 'constrained'
                    check(checks, prefix + '/first-p75-absolute', 'latency', row['candidate']['p75'], maximum=200 if constrained else 100,
                          bounds=[None, row['candidateP75UpperBound']['upper']], complete=complete and row['candidateP75UpperBound']['upper'] is not None, n=row['n'])
                    maximum_margin('first-p75-regression-margin', 16 if constrained else 8, .10)
                if row['comparison'] == 'rollback-reference':
                    maximum_margin('eager-profile-median-overhead-margin', 1, .02, '.5')
            if primary and metric == 'repeatReadyMs':
                maximum_margin('repeat-p75-regression-margin', 2, .05)
        else:
            if metric == 'startupReadyMs':
                delta('startup-median-percent', 5, fraction='median', percent=True)
                delta('startup-p75-percent', 5, percent=True)
            if metric == 'firstReadyMs':
                delta('first-p75-added-ms', 8)
                if primary:
                    check(checks, prefix + '/first-p75-absolute-ms', 'latency', row['candidate']['p75'], maximum=50,
                          bounds=[None, row['candidateP75UpperBound']['upper']], complete=complete and row['candidateP75UpperBound']['upper'] is not None, n=row['n'])
            if metric == 'repeatReadyMs':
                delta('repeat-p75-added-ms', 4)
            if primary and metric == 'startupDocumentNodes':
                delta('route-all-nodes', -32, fraction='median', category='benefit')
                delta('route-all-nodes-percent', -5, fraction='median', percent=True, category='benefit')
    return checks


def _structure_checks(family, groups, matrix, core, bootstrap):
    get, numeric, check = _helpers(core)
    checks = []
    for browser, profile in CONFIGS:
        for action in (('none',) if matrix['deliveryPolicy'] == 'unused' else ACTIONS):
            for arm in ARMS:
                samples = list(groups.get((browser, profile, action, arm), {}).values())
                prefix = '/'.join([matrix['deliveryPolicy'], arm, browser, profile, action])
                complete = matrix['complete'] and len(samples) >= 30
                def exact(path, expected, label=None):
                    values = [get(sample, path) for sample in samples]
                    valid = bool(values) and all(numeric(value) for value in values)
                    check(checks, prefix + '/' + (label or path), 'structure', max(abs(value - expected) for value in values) if valid else None,
                          maximum=0, complete=complete and valid, n=len(samples))
                if matrix['deliveryPolicy'] != 'unused':
                    exact('metrics.recreatedNodes', 0, 'retained-generated-identity')
                if family == 'command':
                    for name, expected in (('generatedComboboxes', 1), ('generatedListboxes', 1), ('generatedRows', 4), ('generatedSearchStatuses', 1)):
                        exact('startup.snapshot.workload.' + name, 0 if arm == 'candidate' else expected, 'unused-' + name)
                        if matrix['deliveryPolicy'] != 'unused':
                            exact('first.snapshot.workload.' + name, expected, 'first-' + name)
                    # First candidate construction creates the editor; identity begins there.
                    if matrix['deliveryPolicy'] != 'unused':
                        values = [get(sample, 'second.snapshot.workload.inputSame') for sample in samples]
                        check(checks, prefix + '/native-input-retained', 'identity', int(all(value is True for value in values)) if values else None,
                              minimum=1, complete=complete, n=len(samples))
                else:
                    exact('startup.snapshot.workload.chooserElements', 5 if arm == 'candidate' else 35)
                    for name in PAGER_IDS:
                        selected, known = name in ADOPTED_PAGERS, name != 'api-pagination-unknown'
                        expected = 0 if not known or selected and arm == 'candidate' else 5
                        values = [next((p for p in get(sample, 'startup.snapshot.workload.pagers', []) if p.get('id') == name), {}) for sample in samples]
                        count_values = [p.get('generatedElements') for p in values]
                        valid = bool(values) and all(numeric(v) for v in count_values)
                        check(checks, prefix + '/' + name + '/unused-chooser-elements', 'structure',
                              max(abs(v - expected) for v in count_values) if valid else None, maximum=0, complete=complete and valid, n=len(samples))
                        shell = [p.get('shellPresent') is known and p.get('inputPresent') is bool(expected) for p in values]
                        check(checks, prefix + '/' + name + '/shell-and-input-preserved', 'structure', int(all(shell)) if shell else None,
                              minimum=1, complete=complete, n=len(samples))
                    values = [get(sample, 'second.snapshot.workload.inputIdentityFailures') for sample in samples]
                    valid = bool(values) and all(numeric(v) for v in values)
                    check(checks, prefix + '/native-input-retained', 'identity', max(values) if valid else None, maximum=0, complete=complete and valid, n=len(samples))
            if family == 'pagination':
                for comparison, before, after in COMPARISONS[:2]:
                    left = groups.get((browser, profile, action, before), {})
                    right = groups.get((browser, profile, action, after), {})
                    blocks = sorted(left.keys() & right.keys())
                    for name in ADOPTED_PAGERS:
                        def count(sample):
                            return next(p['componentNodes'] for p in get(sample, 'startup.snapshot.workload.pagers', []) if p['id'] == name)
                        pairs = tuple((count(left[b]), count(right[b])) for b in blocks)
                        ci = core['interval'](pairs, .5, bootstrap)
                        a, b = core['stats']([p[0] for p in pairs]), core['stats']([p[1] for p in pairs])
                        value = (b['median'] - a['median']) / a['median'] * 100 if pairs and a['median'] > 0 else None
                        check(checks, '/'.join([comparison, browser, profile, action, name, 'component-all-nodes-percent']), 'benefit', value,
                              maximum=-10, bounds=ci['percent'], complete=matrix['complete'] and left.keys() == right.keys() and len(pairs) >= 30 and ci['percent'] is not None,
                              n=len(pairs), reason='Each of the six adopted real pagers must independently meet 10%; icon-slotted and unknown remain controls')
    return checks


def _retention(run, family, core, bootstrap):
    get, numeric, check = _helpers(core)
    checks, rows, comparisons = [], [], []
    if not run:
        check(checks, 'retention-evidence', 'retention', reason='Independent five-context ×100-cycle retained and disposed lifecycle evidence missing')
        return rows, comparisons, checks
    manifest, raw = run['manifest'], run['raw']
    repetitions = manifest.get('repetitions', 0)
    repetitions = repetitions if type(repetitions) is int and repetitions >= 0 else 0
    expected = {(arm, lifecycle, block) for arm in ARMS for lifecycle in ('retained', 'disposed') for block in range(repetitions)}
    key = lambda job: tuple(job.get(name) for name in ('arm', 'lifecycle', 'block'))
    jobs = [job for job in manifest.get('jobs', []) if job.get('family') == family]
    plans = {key(job): job for job in jobs}
    records = [r for r in raw if isinstance(r, dict) and get(r, 'job.family') == family]
    terminals = [r for r in records if r.get('status') != 'started']
    starts, counts = Counter(key(r['job']) for r in records if r.get('status') == 'started'), Counter(key(r['job']) for r in terminals)
    complete = bool(run['integrity']['verified'] and not manifest.get('qualification') and repetitions >= 5 and
                    manifest.get('cycles', 0) >= 100 and len(plans) == len(jobs) and set(plans) == expected and
                    set(starts) == expected and set(counts) == expected and all(v == 1 for v in (*starts.values(), *counts.values())) and
                    all(r['job'] == plans.get(key(r['job'])) for r in records) and
                    all(isinstance(r, dict) and get(r, 'job.family') in ('media', 'combobox', *FAMILIES) for r in raw))
    for sample in terminals:
        job = sample['job']; points = sample.get('checkpoints', [])
        checkpoints = {p.get('cycle'): p for p in points if isinstance(p, dict)}
        valid = (sample.get('status') == 'ok' and sample.get('actualRegistry') == 'global' and
                 job.get('requestedRegistry') == 'production-default' and not sample.get('errors') and not sample.get('failures') and
                 {0, 10, 50, 100} <= checkpoints.keys() and len(checkpoints) == len(points))
        if family == 'command':
            valid = valid and all(get(point, 'commandInstrumentation.recordOperations') is False and get(point, 'commandInstrumentation.operations') == [] and get(point, 'commandInstrumentation.routeEntrySuppressed') is False for point in points)
        complete = complete and valid
        a, b = checkpoints.get(10, {}), checkpoints.get(100, {})
        row = {'family': family, **job, 'valid': valid, 'actualRegistry': sample.get('actualRegistry')}
        for name, path in {'heap': 'heapBytes', 'connected': 'connected.document.nodes', 'listeners': 'dom.jsEventListeners',
                           'detached': 'detached.reportedNodes', 'detachedHosts': 'detached.reportedHostNodes',
                           'chooserElements': 'connected.workload.chooserElements', 'identityFailures': 'connected.workload.inputIdentityFailures'}.items():
            before, after = get(a, path), get(b, path)
            if not (numeric(before) and numeric(after) and min(before, after) >= 0) or name.startswith('detached') and (a.get('detachedUnsupported') or b.get('detachedUnsupported')):
                before = after = None
            row[name + 'Before'], row[name + 'After'] = before, after
            row[name + 'Delta'] = after - before if numeric(before) and numeric(after) else None
        initial_hosts = get(checkpoints.get(0, {}), 'detached.reportedHostNodes')
        if checkpoints.get(0, {}).get('detachedUnsupported') or not numeric(initial_hosts):
            initial_hosts = None
        row['detachedHostsAtZero'] = initial_hosts
        row['detachedHostsFromZero'] = row['detachedHostsAfter'] - initial_hosts if numeric(initial_hosts) and numeric(row['detachedHostsAfter']) else None
        row['heapPercent'] = row['heapDelta'] / row['heapBefore'] * 100 if numeric(row['heapDelta']) and numeric(row['heapBefore']) and row['heapBefore'] > 0 else None
        row['detachedUnsupported'] = [point.get('detachedUnsupported') for point in (a, b) if point.get('detachedUnsupported')]
        rows.append(row)
    check(checks, 'complete-retention-matrix', 'retention', int(complete), minimum=1, complete=complete,
          reason='All three arms, both lifecycles, every five+ repetition and0/10/50/100 checkpoint required without replacement')
    for row in rows:
        prefix = '/'.join([row['arm'], row['lifecycle'], str(row['block'])])
        metrics = ['listenersDelta', 'connectedDelta'] if family == 'command' else ['listenersDelta', 'chooserElementsDelta']
        for metric in metrics:
            check(checks, prefix + '/' + metric, 'retention', row[metric], maximum=0, complete=complete)
        if row['lifecycle'] == 'retained':
            check(checks, prefix + '/input-identity-failures', 'identity', row['identityFailuresAfter'], maximum=0, complete=complete)
        if family == 'command':
            check(checks, prefix + '/detached-host-growth', 'retention', row['detachedHostsDelta'], maximum=0, complete=complete,
                  reason='No added reported removed host; CDP coverage is not a complete heap proof')
            if row['lifecycle'] == 'disposed':
                check(checks, prefix + '/reported-removed-host-from-zero', 'retention', row['detachedHostsFromZero'], maximum=0, complete=complete,
                      reason='Cycle0→100 additionally catches a first removed host retained before cycle10; reported CDP host types are diagnostic, not a full shared-state attribution proof')
            candidate = next((item for item in rows if item['arm'] == 'candidate' and item['lifecycle'] == row['lifecycle'] and item['block'] == row['block']), {})
            baseline = candidate.get('heapBefore')
            maximum = max(65536, .01 * baseline) if numeric(baseline) else None
            row['candidateHeapBaseline'], row['heapMaximum'] = baseline, maximum
            check(checks, prefix + '/post-GC-heap-growth', 'retention', row['heapDelta'], maximum=maximum,
                  complete=complete and maximum is not None, reason='Each matched arm/repetition uses max(64KiB,1% of the same candidate cycle10 heap); reference/rollback establish baseline validity')
    for lifecycle in ('retained', 'disposed'):
        if family == 'pagination':
            for arm in ARMS:
                selected = [r for r in rows if r['lifecycle'] == lifecycle and r['arm'] == arm]
                values = [r['heapDelta'] for r in selected if numeric(r['heapDelta'])]
                pairs = tuple((0, v) for v in values)
                uncertainty = core['interval'](pairs, .5, bootstrap)
                statistic = core['stats'](values)
                comparisons.append({'family': family, 'lifecycle': lifecycle, 'comparison': arm + '-cycle100-minus10',
                                    'before': arm + '-cycle10', 'after': arm + '-cycle100', 'n': len(values),
                                    'reference': core['stats']([0] * len(values)), 'candidate': statistic,
                                    'medianDelta': statistic['median'], 'uncertainty': uncertainty})
                check(checks, lifecycle + '/' + arm + '/median-post-GC-growth', 'retention', statistic['median'], maximum=32768,
                      bounds=uncertainty['after'], complete=complete and len(values) == repetitions and len(values) >= 5 and uncertainty['after'] is not None, n=len(values))
        else:
            for comparison, before, after in COMPARISONS[:2]:
                left = {r['block']: r for r in rows if r['arm'] == before and r['lifecycle'] == lifecycle}
                right = {r['block']: r for r in rows if r['arm'] == after and r['lifecycle'] == lifecycle}
                for block in sorted(set(left) | set(right)):
                    a, b = left.get(block, {}).get('detachedDelta'), right.get(block, {}).get('detachedDelta')
                    check(checks, '/'.join([lifecycle, comparison, str(block), 'additional-detached-growth']), 'retention', b - a if numeric(a) and numeric(b) else None,
                          maximum=2, complete=complete, reason='Each candidate repetition is paired with the same eager block; missing CDP diagnostics stay pending')
    return rows, comparisons, checks


def _frozen_contract(designs, family, core):
    """Fail closed if a future protocol changes numbers without updating this translation."""
    _, _, check = _helpers(core)
    checks = []
    frozen = designs.get('budgetDecision', {}).get('status') == 'frozen-before-runtime-edits-and-measurements'
    if family == 'command':
        gates = designs.get('designs', {}).get('command-palette-design', {}).get('proposedAcceptanceGates', {})
        expected = {'componentBenefit': ('>=20 nodes', '>=20%'), 'routeBenefit': ('>=2%', 'max(2 ms, 3%'),
                    'firstUse': ('<=100 ms', 'max(8 ms, 10%', '<=200 ms', 'max(16 ms, 10%', 'max(1 ms, 2%'),
                    'repeat': ('max(2 ms, 5%',), 'bytes': ('0 requests', '<=1024 gzip bytes'),
                    'retention': ('growth is 0', '+ 2 nodes', 'max(64 KiB, 1%'),
                    'trafficPreparation': ('0/50/200 ms', 'never-used')}
    else:
        candidates = designs.get('designs', {}).get('compact-overlay-design', {}).get('candidates', [])
        gates = next((c.get('proposed_numeric_gates', {}) for c in candidates if c.get('tag') == 'en-pagination'), {})
        expected = {'component_never_used': ('>=10%', 'five elements', 'zero code bytes'),
                    'whole_route': ('5%', '>=32', '<=eager*1.05'), 'first_use': ('<=50 ms', '+8 ms'),
                    'repeat': ('+4 ms',), 'retention': ('Zero additional chooser elements/listeners', '<=32 KiB')}
    matches = frozen and all(all(fragment in gates.get(key, '') for fragment in fragments) for key, fragments in expected.items())
    check(checks, 'frozen-numeric-contract', 'coverage', int(matches), minimum=1, complete=matches,
          reason='Numerical translation is bound to adopted family-designs.json clauses; changed/missing clauses require explicit protocol review')
    return checks


def _command_traffic_checks(policy_groups, policy_matrices, core):
    get, numeric, check = _helpers(core)
    checks = []
    for policy in COMMAND_POLICIES:
        groups, matrix = policy_groups[policy], policy_matrices[policy]
        for browser, profile in CONFIGS:
            for action in (('none',) if policy == 'unused' else ACTIONS):
                for comparison, before, after in COMPARISONS:
                    left = groups.get((browser, profile, action, before), {})
                    right = groups.get((browser, profile, action, after), {})
                    blocks = sorted(left.keys() & right.keys())
                    for phase in ('completion', 'final'):
                        for metric, maximum in (('settledGzipBytes', 1024), ('settledRequests', 0)):
                            pairs = [(get(left[b], 'preparationTraffic.' + phase + '.' + metric), get(right[b], 'preparationTraffic.' + phase + '.' + metric)) for b in blocks]
                            valid = bool(pairs) and all(numeric(a) and numeric(b) and min(a, b) >= 0 for a, b in pairs)
                            check(checks, '/'.join([policy, comparison, browser, profile, action, phase, metric + '-overhead']), 'packaging',
                                  max(b - a for a, b in pairs) if valid else None, maximum=maximum,
                                  complete=matrix['complete'] and len(pairs) >= 30 and len(pairs) == matrix['nPlannedPerCell'] and left.keys() == right.keys() and valid,
                                  n=len(pairs), reason='Actual cumulative post-preparation traffic, including unused and later settled delivery; startup bytes cannot substitute')
    return checks


def _command_delivery_analysis(timing, policy_groups, policy_matrices, core, bootstrap, traffic):
    """Validate every explicit load policy without calling suppressed entry loading production."""
    get, numeric, check = _helpers(core)
    checks, rows, observations = [], [], []
    budget_valid, budget_reason = False, 'Verified shared loader budget binding missing'
    try:
        budgets = core['read_json'](core['ROOT'] / 'plans/lazy-delivery/budgets.json')
        public = budgets['apiOverhead']
        budget_valid = bool(traffic and traffic.get('integrityVerified') and
                            public['maximumAddedLoadMs'] == {'desktop': 4, 'constrained': 12} and
                            public['maximumAddedEnsureMs'] == {'desktop': 4, 'constrained': 12})
        budget_reason = 'Shared API added-median load/ensure ceilings, independently applied to matched command calls'
    except (KeyError, OSError, TypeError, ValueError) as error:
        budget_reason = str(error)
    check(checks, 'shared-loader-budget-binding', 'preparation', int(budget_valid), minimum=1, complete=budget_valid, reason=budget_reason)
    values = defaultdict(dict)
    for policy in COMMAND_POLICIES:
        groups, matrix = policy_groups[policy], policy_matrices[policy]
        actions = ('none',) if policy == 'unused' else ACTIONS
        for browser, profile in CONFIGS:
            for action in actions:
                for arm in ARMS:
                    samples = groups.get((browser, profile, action, arm), {})
                    for block, sample in samples.items():
                        preparation = sample.get('preparation', {})
                        control = preparation.get('control', {})
                        completion = preparation.get('completion', {})
                        preactivation = preparation.get('preActivation') or {}
                        final_status = completion.get('status', {})
                        operations = final_status.get('operations', [])
                        lookup = {op.get('id'): op for op in operations if isinstance(op, dict)}
                        prefix = '/'.join([policy, browser, profile, action, arm, str(block)])
                        problems = []
                        suppressed = policy not in ('cold', 'same-code')
                        expected_descriptor = {'deliveryPolicy': policy, 'requestedLeadMs': int(policy.removeprefix('prepared-')) if policy.startswith('prepared-') else None,
                                               'routeEntrySuppressed': suppressed, 'constructionOnly': policy == 'same-code',
                                               'unused': policy == 'unused', 'activationRequired': policy != 'unused'}
                        if preparation.get('revision') != 'settings-public-loader-policy-v1' or control.get('descriptor') != expected_descriptor or preparation.get('descriptor') != expected_descriptor:
                            problems.append('Explicit policy descriptor/revision missing or changed')
                        if control.get('beforeClosed') is not True or control.get('afterClosed') is not True:
                            problems.append('Public loading or registration did not preserve observed closed state')
                        if any(preparation.get(k) != v for k, v in expected_descriptor.items()):
                            problems.append('Normalized policy differs from declared policy')
                        if preparation.get('actualRouteBenefitEligible') is not (policy == 'cold'):
                            problems.append('Controlled entry-load suppression cannot claim actual route benefit')
                        if not operations or len(lookup) != len(operations):
                            problems.append('Missing or duplicated public-loader operation receipts')
                        expected_tags = {'en-command-palette', 'en-button', 'en-icon'}
                        for op in operations:
                            if type(op.get('id')) is not int or op['id'] < 0 or op.get('kind') not in ('route-entry', 'prepare', 'ensure', 'intent-load', 'activation-ensure'):
                                problems.append('Unknown or malformed original operation identity')
                            if op.get('status') != 'fulfilled' or op.get('error') is not None or not numeric(op.get('startedAt')) or not numeric(op.get('completedAt')) or op['completedAt'] < op['startedAt']:
                                problems.append('Public-loader operation did not actually finish successfully')
                            for field in ('registrationBefore', 'registrationAfter'):
                                registration = op.get(field)
                                if not isinstance(registration, dict) or set(registration) != expected_tags or any(type(v) is not bool for v in registration.values()):
                                    problems.append('Public-loader registry observation missing')
                        observed_statuses = [control.get('beforeStatus', {}), control.get('status', {}), final_status]
                        if policy != 'unused':
                            observed_statuses.extend([preactivation.get('status', {}), preparation.get('activationStatus', {})])
                        for status in observed_statuses:
                            if status.get('revision') != 'settings-public-loader-policy-v1' or status.get('deliveryPolicy') != policy or status.get('registry') != 'global' or status.get('routeEntrySuppressed') is not suppressed or status.get('recordOperations') is not True or not numeric(status.get('at')):
                                problems.append('Policy bridge/registry/suppression identity differs')
                            for observed in status.get('operations', []):
                                original = lookup.get(observed.get('id'))
                                if not original or observed.get('kind') != original.get('kind') or observed.get('startedAt') != original.get('startedAt') or not numeric(observed.get('startedAt')) or not numeric(status.get('at')) or observed['startedAt'] > status['at']:
                                    problems.append('Original public operation identity/chronology differs across observations')
                                    continue
                                if observed.get('status') == 'pending':
                                    if observed.get('completedAt') is not None or not numeric(original.get('completedAt')) or original['completedAt'] < status['at']:
                                        problems.append('Operation reported pending after real completion')
                                elif observed.get('status') != original.get('status') or observed.get('completedAt') != original.get('completedAt') or not numeric(observed.get('completedAt')) or observed['completedAt'] > status['at']:
                                    problems.append('Observed operation completion differs from real completion')
                        route_loads = [op for op in operations if op.get('kind') == 'route-entry']
                        if len(route_loads) != (0 if suppressed else 1):
                            problems.append('Unchanged cold/same-code requires exactly one actual route-entry load; suppressed policies require none')
                        controlled = lookup.get(control.get('operationId'))
                        load = controlled if suppressed else (route_loads[0] if len(route_loads) == 1 else None)
                        if len([op for op in operations if op.get('kind') == ('prepare' if suppressed else 'route-entry')]) != 1:
                            problems.append('Exactly one applicable primary public load is required')
                        if suppressed and (not controlled or controlled.get('kind') != 'prepare'):
                            problems.append('Explicit preparation public load is missing')
                        before_registration = get(control, 'beforeStatus.registrations')
                        if get(control, 'before.hostRegistered') is not False or get(control, 'before.hostUpgraded') is not False:
                            problems.append('Initial startup was silently registered before control')
                        if policy == 'same-code':
                            ensure = controlled
                            if not ensure or ensure.get('kind') != 'ensure' or ensure.get('focusUnchanged') is not True or preparation.get('sameCodeReady') is not True:
                                problems.append('Explicit completed closed/focus-preserving same-code ensure is missing')
                        elif policy == 'unused':
                            ensure = None
                            if sample.get('first') is not None or sample.get('second') is not None or preparation.get('activated') is not False or preparation.get('inputApplicability') != 'not-applicable-no-activation':
                                problems.append('Unused preparation must remain an explicitly non-activated cell')
                            if get(completion, 'snapshot.hostRegistered') is not False or get(completion, 'snapshot.hostUpgraded') is not False or get(completion, 'status.registrations') != before_registration:
                                problems.append('Unused code preparation changed registrations')
                            if get(completion, 'snapshot.generated.nodes') != get(control, 'before.generated.nodes') or not numeric(get(control, 'before.generated.nodes')):
                                problems.append('Unused code preparation changed generated content')
                            if not controlled or controlled.get('focusUnchanged') is not True or completion.get('closed') is not True:
                                problems.append('Unused completion lacks unchanged-focus/closed proof')
                        else:
                            # The bridge must instrument the existing application's first ensure.
                            ensures = [op for op in operations if op.get('kind') == 'activation-ensure']
                            first_started = get(sample, 'first.started')
                            ensure = next((op for op in ensures if numeric(first_started) and op.get('startedAt', -1) >= first_started), None)
                            if ensure is None or len(ensures) != 1:
                                problems.append('Exactly one actual first activation public ensure duration is required')
                        if policy == 'same-code' and len([op for op in operations if op.get('kind') == 'ensure']) != 1 or policy == 'unused' and any(op.get('kind') in ('ensure', 'activation-ensure') for op in operations):
                            problems.append('Explicit same-code ensure or unused no-registration operation applicability differs')
                        if policy != 'unused':
                            activation = preparation.get('activationStatus', {})
                            if preactivation.get('closed') is not True or policy != 'cold' and preactivation.get('focusUnchanged') is not True:
                                problems.append('Observed pre-activation preparation changed opening or focus')
                            if activation != get(sample, 'first.deliveryStatus') or activation.get('deliveryPolicy') != policy or activation.get('revision') != 'settings-public-loader-policy-v1':
                                problems.append('Actual trusted activation policy observation missing')
                            if policy != 'same-code' and (get(preactivation, 'snapshot.hostRegistered') is not False or get(preactivation, 'snapshot.hostUpgraded') is not False or get(preactivation, 'status.registrations') != before_registration):
                                problems.append('Load-only pre-activation registered or upgraded the palette')
                        if policy.startswith('prepared-'):
                            lead, requested = preparation.get('actualLeadMs'), expected_descriptor['requestedLeadMs']
                            started, event_at = control.get('preparationStartedAt'), get(sample, 'first.started')
                            if not all(numeric(v) for v in (lead, started, event_at)) or lead < requested or abs(lead - (event_at - started)) > .001:
                                problems.append('Actual requested preparation lead missing/inconsistent')
                            activated_op = next((op for op in preparation.get('activationStatus', {}).get('operations', []) if op.get('id') == control.get('operationId')), None)
                            if not activated_op or preparation.get('preparationPendingAtActivation') is not (activated_op.get('status') == 'pending'):
                                problems.append('Pending state was not observed at the real activation event')
                            if policy == 'prepared-0' and profile == 'constrained' and preparation.get('preparationPendingAtActivation') is not True:
                                problems.append('Constrained immediate activation failed to overlap pending preparation')
                        def duration(op):
                            return op['completedAt'] - op['startedAt'] if op and numeric(op.get('completedAt')) and numeric(op.get('startedAt')) and op['completedAt'] >= op['startedAt'] else None
                        traffic_record = sample.get('preparationTraffic', {})
                        for phase in ('before', 'completion', 'final'):
                            for metric in ('entryGzipBytes', 'entryRequests', 'settledGzipBytes', 'settledRequests', 'encodedBodyBytes', 'transferBytes'):
                                value = get(traffic_record, phase + '.' + metric)
                                if not numeric(value) or value < 0:
                                    problems.append('Missing/invalid actual traffic observation: ' + phase + '/' + metric)
                                if phase == 'before' and value != get(sample, 'metrics.' + metric):
                                    problems.append('Preparation traffic preimage differs from startup settled observation')
                        for key, metric in (('additionalGzipBytes', 'settledGzipBytes'), ('additionalRequests', 'settledRequests')):
                            before_bytes, after_bytes = get(traffic_record, 'before.' + metric), get(traffic_record, 'completion.' + metric)
                            if not numeric(before_bytes) or not numeric(after_bytes) or traffic_record.get(key) != after_bytes - before_bytes:
                                problems.append('Preparation delivered-traffic delta is inconsistent')
                        measures = {'publicLoadMs': duration(load), 'publicEnsureMs': duration(ensure), 'actualLeadMs': preparation.get('actualLeadMs')}
                        if preparation.get('loadOperationId') != (load or {}).get('id') or preparation.get('loadMs') != measures['publicLoadMs'] or not numeric(measures['publicLoadMs']):
                            problems.append('Normalized load measurement differs from the original public operation')
                        if preparation.get('ensureOperationId') != (ensure or {}).get('id') or preparation.get('ensureMs') != measures['publicEnsureMs'] or policy != 'unused' and not numeric(measures['publicEnsureMs']):
                            problems.append('Normalized ensure measurement differs from the original applicable public operation')
                        valid = not problems and matrix['complete']
                        check(checks, prefix + '/policy-invariants', 'preparation', int(not problems), minimum=1, complete=valid,
                              reason='; '.join(problems) or 'Observed source-symmetric public operations, actual lead/completion, owning registration and exact policy invariants')
                        observations.append({'deliveryPolicy': policy, 'browser': browser, 'profile': profile, 'action': action, 'arm': arm, 'block': block,
                                             'valid': valid, 'problems': problems, **measures,
                                             'preparationPendingAtActivation': preparation.get('preparationPendingAtActivation'),
                                             'inputApplicability': preparation.get('inputApplicability'),
                                             'operations': operations, 'traffic': traffic_record})
                        if valid:
                            values[(policy, browser, profile, action, arm)][block] = measures
                for comparison, before, after in COMPARISONS:
                    left = values.get((policy, browser, profile, action, before), {})
                    right = values.get((policy, browser, profile, action, after), {})
                    blocks = sorted(left.keys() & right.keys())
                    for metric in ('publicLoadMs', 'publicEnsureMs'):
                        if policy == 'unused' and metric == 'publicEnsureMs':
                            continue  # Structurally absent, explicitly shown by inputApplicability and policy.
                        pairs = tuple((left[b][metric], right[b][metric]) for b in blocks if numeric(left[b][metric]) and numeric(right[b][metric]))
                        a, b = core['stats']([p[0] for p in pairs]), core['stats']([p[1] for p in pairs])
                        median_ci, p75_ci = core['interval'](pairs, .5, bootstrap), core['interval'](pairs, .75, bootstrap)
                        median_delta = b['median'] - a['median'] if pairs else None
                        p75_delta = b['p75'] - a['p75'] if pairs else None
                        rows.append({'family': 'command', 'deliveryPolicy': policy, 'browser': browser, 'profile': profile, 'action': action,
                                     'comparison': comparison, 'before': before, 'after': after, 'metric': metric, 'actualRegistry': 'production-global',
                                     'n': len(pairs), 'paired': left.keys() == right.keys(), 'blocks': blocks, 'reference': a, 'candidate': b,
                                     'medianDelta': median_delta, 'medianPercent': median_delta / a['median'] * 100 if pairs and a['median'] > 0 else None,
                                     'p75Delta': p75_delta, 'p75Percent': p75_delta / a['p75'] * 100 if pairs and a['p75'] > 0 else None,
                                     'medianUncertainty': median_ci, 'p75Uncertainty': p75_ci,
                                     'candidateP75UpperBound': core['quantile_upper_bound']([p[1] for p in pairs])})
                        if comparison != 'candidate-rollback':
                            check(checks, '/'.join([policy, comparison, browser, profile, action, metric + '-median-added']), 'preparation', median_delta,
                                  maximum=12 if profile == 'constrained' else 4, bounds=median_ci['delta'],
                                  complete=matrix['complete'] and budget_valid and len(pairs) >= 30 and len(pairs) == matrix['nPlannedPerCell'] and left.keys() == right.keys() and median_ci['delta'] is not None,
                                  n=len(pairs), reason='Same policy public operation; added median and paired 95% interval satisfy the separately frozen shared loader budget')
    return rows, observations, checks


def analyze_additional_family_data(timing, retention, designs, *, core, bootstrap=10000, packaging=None, traffic=None, families=FAMILIES):
    result = {}
    for family in families:
        core['expect'](family in FAMILIES, 'Unknown additional family')
        groups, matrix = _timing_matrix(timing, family, core)
        rows = _rows(groups, family, matrix['deliveryPolicy'], core, bootstrap)
        checks = _frozen_contract(designs, family, core)
        checks.extend(_timing_checks(family, groups, matrix, rows, core, bootstrap))
        checks.extend(_structure_checks(family, groups, matrix, core, bootstrap))
        preparation_observations = []
        if family == 'command':
            policy_groups, policy_matrices = {'cold': groups}, {'cold': matrix.copy()}
            for policy in COMMAND_POLICIES[1:]:
                extra_groups, extra_matrix = _timing_matrix(timing, family, core, policy)
                policy_groups[policy], policy_matrices[policy] = extra_groups, extra_matrix
                if policy == 'unused':
                    core['check'](checks, 'complete-unused-preparation-matrix', 'coverage', int(extra_matrix['complete']), minimum=1,
                                  complete=extra_matrix['complete'], reason='All seven configurations × three arms × n≥30; action none is structurally not applicable, never omitted engine evidence')
                    checks.extend(_structure_checks(family, extra_groups, extra_matrix, core, bootstrap))
                else:
                    extra_rows = _rows(extra_groups, family, policy, core, bootstrap)
                    checks.extend(_timing_checks(family, extra_groups, extra_matrix, extra_rows, core, bootstrap))
                    checks.extend(_structure_checks(family, extra_groups, extra_matrix, core, bootstrap))
                    rows.extend(extra_rows)
            preparation_rows, preparation_observations, preparation_checks = _command_delivery_analysis(timing, policy_groups, policy_matrices, core, bootstrap, traffic)
            rows.extend(preparation_rows); checks.extend(preparation_checks)
            checks.extend(_command_traffic_checks(policy_groups, policy_matrices, core))
            matrix = {'complete': all(value['complete'] for value in policy_matrices.values()),
                      'nPlannedPerCell': matrix['nPlannedPerCell'], 'successful': sum(value['successful'] for value in policy_matrices.values()),
                      'required': sum(value['required'] for value in policy_matrices.values()), 'policies': policy_matrices,
                      'integrity': timing['integrity'], 'diagnostics': 'Cold alone supplies actual-route benefit. Same-code alone supplies construction latency. All controlled preparation and unused cells remain mandatory and separate.'}
        retained, retention_comparisons, retention_checks = _retention(retention, family, core, bootstrap)
        checks.extend(retention_checks)
        categories = {category: core['result_status']([c for c in checks if c['category'] == category])
                      for category in sorted({c['category'] for c in checks})}
        automated = core['result_status'](checks)
        result[family] = {'matrix': matrix, 'rows': rows, 'retention': retained,
                          'retentionComparisons': retention_comparisons, 'assets': (packaging or {}).get(family, ([], []))[0],
                          'server': [], 'checks': checks, 'preparationObservations': preparation_observations, 'optionalCodeSavings': {'applicable': False, 'reason': 'Construction only; no unique optional module or code-savings claim'},
                          'controls': [{'id': 'api-pagination-slotted', 'status': 'eager-rejected-opportunity', 'reason': '20-node source opportunity /215 observed reference nodes=9.30%, below10%; actual new measurements remain authoritative'},
                                       {'id': 'api-pagination-unknown', 'status': 'already-conditional', 'reason': 'Unknown totals have no chooser'}] if family == 'pagination' else [],
                          'decision': {'automatedStatus': automated, 'categories': categories, 'humanReview': 'pending',
                                       'status': 'pending-human-review' if automated == 'passed' else automated,
                                       'scope': 'Actual production-global ' + ('four-command settings route' if family == 'command' else 'eight-pager docs route; exactly six adopted known-total pagers'),
                                       'conclusion': 'No full rollout acceptance. Separate SSR/correctness and human keyboard/assistive-technology acceptance remain required; no numeric SSR-render gate is specified for this family.'}}
    return result
