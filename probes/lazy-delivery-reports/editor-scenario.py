"""Descriptive sample-mean editor scenario index; no gates or uncertainty added.

Inputs are one complete analyzer-validated, hash-bound timing campaign. This
output never changes or replaces any timing, benefit, retention or review gate.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math

USAGE = (0, .25, .5, 1)
ARMS = ('reference', 'candidate', 'rollback')
CONFIGS = {(engine, profile) for engine in ('chromium', 'firefox', 'webkit') for profile in ('desktop', 'phone')} | {('chromium', 'constrained')}
COMPARISONS = (('candidateMinusReference', 'candidate', 'reference'),
               ('candidateMinusRollback', 'candidate', 'rollback'),
               ('rollbackMinusReference', 'rollback', 'reference'))


def digest(value):
    return hashlib.sha256(value).hexdigest()


def calculate(analysis, events):
    result = {'schemaVersion': 1, 'kind': 'editor-descriptive-scenario-index', 'status': 'unavailable',
              'formula': 'J_arm,block(u) = startupMs_arm,block + u * firstSelectionMs_arm,block',
              'units': 'Milliseconds of scenario readiness-cost index, not page duration, INP or observed session time',
              'usage': list(USAGE), 'declaredScenarioUsage': .25,
              'assumptions': ['Every hypothetical visit pays startup; fraction u pays one first contextual-selection interval.',
                              'Usage is an assumption independent of measured latency, not observed adoption or telemetry.',
                              'The measured route/workload and original matched browser/profile cells are unchanged.'],
              'exclusions': ['500 ms observation waits', 'Text/focus/scroll setup', 'repeatSelectionMs', 'focusMs from a separate fresh page'],
              'uncertainty': 'No new confidence interval or gate. Original p95 and confidence gates remain authoritative.',
              'originalQualifiedForMeasuredGates': analysis.get('qualifiedForMeasuredGates'), 'issues': [], 'arms': [], 'comparisons': [], 'blocks': []}
    issues = result['issues']
    if analysis.get('schemaVersion') != 1 or analysis.get('subject') != 'editor-contextual-toolbar':
        issues.append('Wrong analyzer schema/subject')
    if analysis.get('validation', {}).get('valid') is not True:
        issues.append('Timing campaign is not analyzer-validated; no scenario numbers produced')
    inputs = analysis.get('inputs', {}); manifest = inputs.get('manifest', {}); summary = inputs.get('summary', {})
    if manifest.get('qualification') is not False or summary.get('status') != 'complete' or summary.get('qualification') is not False:
        issues.append('Qualification, failed, aborted or incomplete acquisitions cannot produce scenario numbers')
    cells = analysis.get('cells', [])
    if len(cells) != len(CONFIGS) or {(cell.get('browser'), cell.get('profile')) for cell in cells} != CONFIGS:
        issues.append('Required original seven cells are absent or duplicated')
    if issues:
        return result
    planned = {job.get('id'): job for job in manifest.get('jobs', [])}
    if not planned or len(planned) != len(manifest.get('jobs', [])):
        issues.append('Declared acquisition jobs absent or duplicated')
    started, terminal = {}, {}
    for row in events:
        job = row.get('job', {}); identity = job.get('id'); status = row.get('status')
        if identity not in planned or job != planned.get(identity) or status not in ('started', 'ok'):
            issues.append('Unknown, failed, aborted, unplanned or changed raw job')
            continue
        target = started if status == 'started' else terminal
        if identity in target:
            issues.append('Duplicate raw acquisition event')
        target[identity] = row
        if status == 'ok':
            if row.get('requestedRegistry') != 'production-global' or row.get('actualRegistry') != 'global' or row.get('errors') != [] or row.get('failures') != []:
                issues.append('Original registry or clean-success conditions absent')
            for metric in ('startupMs', 'firstSelectionMs'):
                value = row.get('metrics', {}).get(metric)
                if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
                    issues.append('Missing/nonfinite/negative required original measurement')
    if set(started) != set(planned) or set(terminal) != set(planned):
        issues.append('Raw starts/terminal events do not cover the entire original acquisition')
    prepared = []
    for cell in cells:
        browser, profile = cell.get('browser'), cell.get('profile')
        blocks = cell.get('matchedSuccessfulBlocks', [])
        if len(blocks) < 100 or len(set(blocks)) != len(blocks):
            issues.append('Cell lacks 100 unique complete original matched blocks')
        records = {(row['job']['arm'], row['job']['block']): row for row in terminal.values()
                   if row['job'].get('browser') == browser and row['job'].get('profile') == profile}
        if set(records) != {(arm, block) for arm in ARMS for block in blocks}:
            issues.append('Matched block/arm evidence differs from the validated cell')
        prepared.append((browser, profile, blocks, records))
    if issues:
        result['issues'] = list(dict.fromkeys(issues))
        return result
    for browser, profile, blocks, records in prepared:
        for usage in USAGE:
            values = {arm: [] for arm in ARMS}
            for block in blocks:
                indices = {}
                for arm in ARMS:
                    metrics = records[arm, block]['metrics']
                    index = metrics['startupMs'] + usage * metrics['firstSelectionMs']
                    indices[arm] = index; values[arm].append(index)
                    result['blocks'].append({'browser': browser, 'profile': profile, 'usage': usage, 'block': block, 'arm': arm,
                                             'startupMs': metrics['startupMs'], 'firstSelectionMs': metrics['firstSelectionMs'], 'indexMs': index})
            means = {arm: math.fsum(values[arm]) / len(blocks) for arm in ARMS}
            result['arms'].extend({'browser': browser, 'profile': profile, 'usage': usage, 'arm': arm, 'n': len(blocks), 'meanIndexMs': means[arm]} for arm in ARMS)
            for comparison, left, right in COMPARISONS:
                paired = [a - b for a, b in zip(values[left], values[right])]
                delta = math.fsum(paired) / len(blocks)
                result['comparisons'].append({'browser': browser, 'profile': profile, 'usage': usage, 'comparison': comparison,
                                             'n': len(blocks), 'beforeMeanIndexMs': means[right], 'afterMeanIndexMs': means[left],
                                             'meanPairedDeltaMs': delta, 'changePercent': delta / means[right] * 100 if means[right] > 0 else None})
    result['status'] = 'descriptive-complete'
    return result


def load_bound(analysis_path):
    analysis_path = Path(analysis_path).resolve(strict=True)
    analysis_bytes = analysis_path.read_bytes(); analysis = json.loads(analysis_bytes)
    root = Path(analysis['inputDirectory']).resolve(strict=True)
    expected = analysis.get('inputSha256', {})
    if set(expected) != {'manifest.json', 'samples.jsonl', 'summary.json'}:
        raise ValueError('Missing exact analyzer-attested input hashes')
    raw = {}; bindings = []
    for name, expected_hash in expected.items():
        path = root / name; value = path.read_bytes()
        if digest(value) != expected_hash:
            raise ValueError('Analyzer-attested timing input changed: ' + name)
        raw[name] = value; bindings.append({'path': str(path), 'sha256': expected_hash})
    if json.loads(raw['manifest.json']) != analysis.get('inputs', {}).get('manifest') or json.loads(raw['summary.json']) != analysis.get('inputs', {}).get('summary'):
        raise ValueError('Analyzer embedded acquisition identities differ from original raw inputs')
    events = [json.loads(line) for line in raw['samples.jsonl'].splitlines() if line.strip()]
    result = calculate(analysis, events)
    result['analysis'] = {'path': str(analysis_path), 'sha256': digest(analysis_bytes)}
    result['rawInputs'] = bindings
    result['preparation'] = analysis.get('inputs', {}).get('manifest', {}).get('preparation')
    for binding in bindings:
        if digest(Path(binding['path']).read_bytes()) != binding['sha256']:
            raise ValueError('Raw input changed during scenario calculation')
    if digest(analysis_path.read_bytes()) != digest(analysis_bytes):
        raise ValueError('Analysis changed during scenario calculation')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--analysis', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    out = Path(args.out).resolve()
    if out.exists():
        raise ValueError('Output must be a fresh file')
    result = load_bound(args.analysis)
    protected = [Path(args.analysis).resolve().parent, *(Path(binding['path']).parent for binding in result['rawInputs'])]
    preparation = result.get('preparation') or {}
    if preparation.get('path'):
        protected.append(Path(preparation['path']).resolve())
    for source in preparation.get('sources', {}).values():
        for key in ('snapshot', 'origin'):
            if source.get(key):
                protected.append(Path(source[key]).resolve())
    if any(out.is_relative_to(path) for path in protected):
        raise ValueError('Scenario output must be outside its original evidence and preparation')
    result['methodSourceSha256'] = digest(Path(__file__).read_bytes())
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open('x') as target:
        target.write(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(out)


if __name__ == '__main__':
    main()
