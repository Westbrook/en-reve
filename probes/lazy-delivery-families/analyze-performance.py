"""Independent media/Selection evidence analysis; never acquire or pool observations.

Usage: python analyze-performance.py --run=/timing --retention=/retention
       [--ssr=/selection-ssr] --out=/new-analysis
All input attempts remain immutable. Missing evidence is pending, never zero/pass.
"""
from collections import Counter, defaultdict
from pathlib import Path
import argparse
import functools
import hashlib
import json
import math
import os
import random
import statistics
import importlib.util
import sys

sys.dont_write_bytecode = True

FAMILIES = ('media', 'combobox')
KNOWN_FAMILIES = (*FAMILIES, 'command', 'pagination')
ARMS = ('reference', 'candidate', 'rollback')
CONFIGS = tuple((engine, profile) for engine in ('chromium', 'firefox', 'webkit')
                for profile in ('desktop', 'phone')) + (('chromium', 'constrained'),)
ACTIONS = ('keyboard', 'pointer')
COMPARISONS = (('candidate-reference', 'reference', 'candidate'),
               ('candidate-rollback', 'rollback', 'candidate'),
               ('rollback-reference', 'reference', 'rollback'))
METRICS = ('startupReadyMs', 'startupDocumentNodes', 'startupDocumentElements',
           'startupComponentNodes', 'startupComponentElements', 'startupGeneratedNodes',
           'startupGeneratedElements', 'firstReadyMs', 'repeatReadyMs', 'recreatedNodes',
           'entryGzipBytes', 'entryRequests', 'settledGzipBytes', 'settledRequests',
           'encodedBodyBytes', 'transferBytes')
DESIGN_PATH = 'plans/lazy-delivery/family-designs.json'
HARNESS_PATH = 'probes/lazy-delivery-families'
ROOT = Path(__file__).resolve().parents[2]
HISTORICAL_REFERENCE = 'fba5ec19b58606cf1776df44862a38a3898f4c72'
ACCEPTED_REFERENCE = '806886d104febb0b3deb4aef2b3e4dad7947ae87'
ACTIVE_FAMILIES = ('combobox', 'command')


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def get(value, path, default=None):
    for key in path.split('.'):
        if not isinstance(value, dict) or key not in value:
            return default
        value = value[key]
    return value


def digest(value):
    if not isinstance(value, (str, bytes)):
        value = json.dumps(value, separators=(',', ':'), ensure_ascii=False)
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def file_digest(path):
    hasher = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(block)
    return hasher.hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text())


def within(root, name):
    root = Path(root).resolve()
    if not isinstance(name, str) or not name or Path(name).is_absolute():
        raise ValueError('Expected relative receipt path: ' + str(name))
    path = (root / name).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Receipt path escapes root: ' + name)
    return path


def expect(condition, message):
    if not condition:
        raise ValueError(message)


def verify_inventory(root, files, *, exact=False, exclusions=()):
    """Verify source-seal file identities, including modes and symlink referents."""
    expect(isinstance(files, list) and files, 'Missing file inventory')
    names = set()
    root = Path(root).resolve()
    for item in files:
        name = item['path']
        expect(name not in names, 'Duplicate inventory path: ' + name)
        names.add(name)
        resolved = within(root, name)
        lexical = root / name
        if item.get('type') == 'symlink':
            expect(lexical.is_symlink() and os.readlink(lexical) == item['target'], 'Changed symlink: ' + name)
            expect(resolved.exists() and digest(item['target']) == item['sha256'], 'Invalid symlink: ' + name)
        else:
            expect(not lexical.is_symlink() and resolved.is_file(), 'Expected ordinary sealed file: ' + name)
            expect(file_digest(resolved) == item['sha256'], 'Changed file: ' + name)
            if 'bytes' in item:
                expect(resolved.stat().st_size == item['bytes'], 'Changed file length: ' + name)
            if 'executable' in item:
                expect(bool(resolved.stat().st_mode & 0o111) == item['executable'], 'Changed executable mode: ' + name)
    if exact:
        actual = set()
        for directory, directories, files_here in os.walk(root, followlinks=False):
            for name in list(directories):
                path = Path(directory) / name
                if any(path.relative_to(root).as_posix() == excluded or path.relative_to(root).as_posix().startswith(excluded + '/') for excluded in exclusions):
                    directories.remove(name)
                    continue
                if path.is_symlink():
                    actual.add(path.relative_to(root).as_posix())
                    directories.remove(name)
            actual.update((Path(directory) / name).relative_to(root).as_posix() for name in files_here
                          if not any((Path(directory) / name).relative_to(root).as_posix() == excluded or
                                     (Path(directory) / name).relative_to(root).as_posix().startswith(excluded + '/') for excluded in exclusions))
        expect(actual == names, 'Inventory additions/deletions: ' + str(root))


def verify_runtime(root, runtime):
    """Rehash the complete observed Node/browser distribution, not just a version."""
    files = runtime.get('files')
    expect(isinstance(files, dict) and files, 'Missing complete browser/runtime identity')
    # identity.ts canonicalJson sorts object keys recursively and prefixes its digests.
    canonical = json.dumps(files, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    expect('sha256:' + digest(canonical) == runtime.get('digest'), 'Runtime inventory digest differs')
    directories = set()
    for name, value in files.items():
        # Runtime paths intentionally reach the recorded external browser distributions.
        path = Path(root) / name.removesuffix('@link').rstrip('/')
        expect(value is not None, 'Missing runtime inventory item: ' + name)
        if name.endswith('@link'):
            expect(path.is_symlink() and os.readlink(path) == value, 'Runtime link changed: ' + name)
        elif name.endswith('/'):
            expect(path.is_dir() and isinstance(value, dict) and value.get('type') == 'directory', 'Invalid runtime directory: ' + name)
            expect(path.stat().st_mode & 0o777 == value['mode'], 'Runtime directory mode changed')
            directories.add(name.rstrip('/'))
        else:
            expect(path.is_file() and not path.is_symlink(), 'Runtime executable/library absent: ' + name)
            expect('sha256:' + file_digest(path) == value['digest'] and path.stat().st_mode & 0o777 == value['mode'], 'Runtime file changed: ' + name)
    for directory in directories:
        for child in (Path(root) / directory).iterdir():
            name = directory + '/' + child.name
            expected = name + '@link' if child.is_symlink() else name + '/' if child.is_dir() else name
            expect(expected in files, 'Unrecorded runtime addition: ' + expected)


def verify_installation(root, installation, expected_lock):
    expect(digest({key: value for key, value in installation.items() if key != 'digest'}) == installation.get('digest'), 'Acquisition driver identity changed')
    expect(installation['lockSha256'] == expected_lock == file_digest(Path(root) / 'package-lock.json'), 'Acquisition driver exact root lock changed')
    expect(installation['installedLockSha256'] == file_digest(Path(root) / 'node_modules/.package-lock.json'), 'Acquisition driver installed lock changed')
    lock, installed = read_json(Path(root) / 'package-lock.json'), read_json(Path(root) / 'node_modules/.package-lock.json')
    packages = installation['packages']
    expect(packages and len({item['path'] for item in packages}) == len(packages), 'Missing/duplicate acquisition driver package')
    for package in packages:
        directory = within(root, package['path'])
        expect(package['path'].startswith('node_modules/') and digest(package['files']) == package['sha256'], 'Invalid driver package identity')
        verify_inventory(directory, package['files'], exact=True)
        expect(file_digest(directory / 'package.json') == package['manifestSha256'], 'Driver manifest changed')
        actual = read_json(directory / 'package.json')
        expect(actual['name'] == package['name'] and actual['version'] == package['version'], 'Driver version mismatch')
        for identity in (lock, installed):
            entry = identity['packages'][package['path']]
            expect(not entry.get('link') and entry['version'] == package['version'] and entry['integrity'] == package['integrity'], 'Driver differs from exact dependency locks')
    def resolved_package(name, from_path):
        directory = within(root, from_path).parent
        while directory.is_relative_to(Path(root).resolve()):
            candidate = directory / 'node_modules' / name / 'package.json'
            if candidate.is_file():
                return candidate.parent.resolve()
            directory = directory.parent
        return None
    for edge in installation['edges']:
        expect(resolved_package(edge['name'], edge['from']) == within(root, edge['path']), 'Acquisition package resolution owner changed')
    for optional in installation['absentOptional']:
        expect(resolved_package(optional['name'], optional['from']) is None, 'Previously absent optional acquisition dependency appeared')


def verify_prepared(prepared, expected_sha, *, executing_root=ROOT):
    """Bind both sources, complete harness, frozen gates, archives and emitted assets."""
    prepared = Path(prepared).resolve()
    expect(file_digest(prepared / 'manifest.json') == expected_sha, 'Prepared manifest changed')
    manifest = read_json(prepared / 'manifest.json')
    payload = {key: value for key, value in manifest.items() if key != 'manifestSha256'}
    expect(digest(payload) == manifest.get('manifestSha256'), 'Prepared self-seal invalid')
    expect(manifest.get('status') == 'complete' and manifest.get('kind') == 'en-reve-lazy-delivery-actual-docs-build', 'Incomplete/wrong production preparation')
    expect([(a['id'], a['subject'], a['policy']) for a in manifest['arms']] ==
           [('reference', 'reference', 'eager'), ('candidate', 'candidate', 'on-demand'), ('rollback', 'candidate', 'eager')], 'Exact three matched arms required')
    sources = manifest['sources']
    expect(set(sources) == {'reference', 'candidate'}, 'Two exact source subjects required')
    for name, declared in sources.items():
        snapshot = Path(declared['snapshot'])
        seal = read_json(snapshot / 'source-seal.json')
        expect(digest({k: v for k, v in seal.items() if k != 'sealSha256'}) == seal['sealSha256'] == declared['sealSha256'], 'Source self-seal changed: ' + name)
        expect(declared['git'] == seal['git'], 'Declared Git identity differs from source seal: ' + name)
        expect(not seal['git']['dirty'] and not seal['git'].get('status') and seal['git']['head'] and seal['git']['tree'], 'Clean committed sources required')
        expect(seal['sourceSha256'] == declared['sourceSha256'] == digest(seal['files']), 'Source inventory identity changed')
        verify_inventory(snapshot / 'source', seal['files'], exact=True)
        for lock, key in [('package-lock.json', 'rootLockSha256'), ('showcases/performance/package-lock.json', 'performanceLockSha256')]:
            expect(file_digest(snapshot / 'source' / lock) == seal[key] == declared[key], 'Exact lock changed')
        selection = declared['selection']
        expect(selection.get('id') == 'en-reve-production-build-source-v1' and
               digest(selection['excludedPaths']) == selection['excludedPathsSha256'] and
               len(selection['excludedPaths']) == selection['excludedFileCount'], 'Missing source omission identity')
    expect(sources['reference']['rootLockSha256'] == sources['candidate']['rootLockSha256'], 'Matched root locks differ')
    expect(sources['reference']['performanceLockSha256'] == sources['candidate']['performanceLockSha256'], 'Matched performance locks differ')
    expect(sources['reference']['git']['head'] in (HISTORICAL_REFERENCE, ACCEPTED_REFERENCE), 'Reference is not a declared accepted Git commit')
    expect(manifest.get('acceptedReferenceHead') == sources['reference']['git']['head'], 'Prepared reference declaration differs from its source')
    candidate = Path(sources['candidate']['snapshot']) / 'source'
    harness = manifest['harness']
    expect(digest(harness['files']) == harness['sha256'], 'Harness seal invalid')
    verify_inventory(candidate, harness['files'])
    verify_inventory(executing_root, harness['files'])
    required_budgets = {DESIGN_PATH, 'plans/lazy-delivery/editor.md', 'plans/lazy-delivery/budgets.json',
                        'plans/lazy-delivery/validation.md', 'plans/lazy-delivery/pagination.md'}
    expect(required_budgets <= {item['path'] for item in manifest['budgets']}, 'Required frozen family protocols missing from prepared budget binding')
    for item in manifest['budgets']:
        expect(file_digest(within(candidate, item['path'])) == item['sha256'] == file_digest(within(executing_root, item['path'])), 'Frozen protocol changed')
    budgets = read_json(candidate / DESIGN_PATH)
    expect(budgets['budgetDecision']['status'] == 'frozen-before-runtime-edits-and-measurements', 'Unfrozen family numeric gates')
    node = manifest['runtime']['node']
    expect(file_digest(node['path']) == node['sha256'], 'Prepared Node bytes changed')
    receipts = {}
    for arm in manifest['arms']:
        path = within(prepared, arm['receipt'])
        expect(file_digest(path) == arm['receiptSha256'], 'Production receipt changed')
        receipt = read_json(path)
        expect(receipt['registry'] == 'production-global' and receipt['policy'] == arm['policy'], 'Wrong actual route policy/registry')
        expect(receipt['sourceSha256'] == sources[arm['subject']]['sourceSha256'] and receipt['sealSha256'] == sources[arm['subject']]['sealSha256'], 'Build/source binding changed')
        root = within(prepared, arm['root'])
        verify_inventory(root / 'site', receipt['assets'], exact=True)
        for package in receipt['packages']:
            expect(file_digest(within(prepared, package['path'])) == package['sha256'], 'Packed archive changed')
        expect(file_digest(within(prepared, receipt['packagesReceipt'])) == receipt['packagesReceiptSha256'], 'Package receipt changed')
        expect(file_digest(within(root, receipt['overlays'])) == receipt['overlaysSha256'], 'Authored overlay receipt changed')
        for graph in receipt['graphs'].values():
            expect(file_digest(within(root, graph['path'])) == graph['sha256'], 'Production dependency graph changed')
        receipts[arm['id']] = receipt
    expect(receipts['candidate']['packages'] == receipts['rollback']['packages'] and receipts['candidate']['packedGraph'] == receipts['rollback']['packedGraph'], 'Rollback must use identical production packages/graphs')
    return manifest, budgets, receipts


def load_run(path, kind, prepared_sha=None, *, executing_root=ROOT):
    path = Path(path).resolve()
    manifest, summary = read_json(path / 'manifest.json'), read_json(path / 'summary.json')
    errors = []
    raw = []
    for number, line in enumerate((path / 'samples.jsonl').read_text().splitlines(), 1):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
            raw.append(record)
            if not isinstance(record, dict):
                errors.append('Non-object raw record at line ' + str(number))
        except (ValueError, TypeError):
            errors.append('Malformed raw line ' + str(number))
    try:
        expect(isinstance(manifest, dict), 'Acquisition manifest must be a JSON object')
        expect(isinstance(summary, dict), 'Acquisition summary must be a JSON object')
        expect(manifest.get('kind') == kind, 'Wrong acquisition kind')
        if prepared_sha:
            expect(manifest['preparedManifestSha256'] == prepared_sha, 'Sibling campaign uses different prepared builds')
        expect(digest(manifest['preparedManifest']) == digest(read_json(Path(manifest['prepared']) / 'manifest.json')), 'Embedded preparation changed')
        expected_budget = next(item for item in manifest['preparedManifest']['budgets'] if item['path'] == DESIGN_PATH)
        expect(manifest['budgets']['sha256'] == expected_budget['sha256'] == file_digest(executing_root / DESIGN_PATH), 'Acquired budgets differ')
        expect(manifest['budgets']['values'] == read_json(executing_root / DESIGN_PATH), 'Embedded numeric gates differ')
        verify_inventory(executing_root / HARNESS_PATH, manifest['harness'], exact=True)
        candidate = Path(manifest['preparedManifest']['sources']['candidate']['snapshot']) / 'source'
        verify_inventory(candidate / HARNESS_PATH, manifest['harness'], exact=True)
        verify_inventory(executing_root, manifest['support'])
        verify_inventory(candidate, manifest['support'])
        verify_runtime(executing_root, manifest['runtime'])
        verify_installation(executing_root, manifest['installation'], manifest['preparedManifest']['sources']['candidate']['rootLockSha256'])
        expect(digest({key: value for key, value in manifest.items() if key != 'manifestSha256'}) == manifest.get('manifestSha256'), 'Acquisition manifest self-seal missing/changed')
        expect(manifest.get('rawSha256') == file_digest(path / 'samples.jsonl'), 'Raw acquisition seal missing/changed')
        expect(manifest.get('summarySha256') == file_digest(path / 'summary.json'), 'Acquisition summary seal missing/changed')
        expect(manifest.get('verifiedBefore') and manifest.get('verifiedAfter'), 'Before/after integrity verification missing')
        expect(manifest.get('integrityVerified') and summary.get('integrityVerified'), 'Global source/runtime integrity is unverified')
        expect(summary.get('status') == manifest.get('status') and summary.get('status') in ('complete', 'incomplete', 'aborted'), 'Inconsistent/unknown acquisition completion')
        expect(summary.get('planned') == len(manifest['jobs']) and summary.get('successful') == sum(row.get('status') == 'ok' for row in raw if isinstance(row, dict)), 'Completion counts differ from declared/terminal jobs')
        if summary['status'] == 'complete':
            expect(summary['successful'] == len(manifest['jobs']), 'Complete acquisition omits planned jobs')
        else:
            expect(any(isinstance(row, dict) and row.get('status') in ('failed', 'aborted') and get(row, 'job.family') in KNOWN_FAMILIES for row in raw), 'Global acquisition failure is not attributed to a retained family attempt')
    except (OSError, ValueError, KeyError, TypeError, StopIteration) as error:
        errors.append(str(error))
    return {'path': str(path), 'manifest': manifest, 'summary': summary, 'raw': raw,
            'integrity': {'verified': not errors, 'errors': errors},
            'files': {name: file_digest(path / name) for name in ('manifest.json', 'summary.json', 'samples.jsonl')}}


def quantile(values, fraction):
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * fraction
    lower = math.floor(index)
    return ordered[lower] + (ordered[math.ceil(index)] - ordered[lower]) * (index - lower)


def stats(values):
    values = [value for value in values if numeric(value)]
    return {'n': len(values), 'median': quantile(values, .5), 'p75': quantile(values, .75),
            'p25': quantile(values, .25), 'p95': quantile(values, .95) if len(values) >= 100 else None,
            'min': min(values) if values else None, 'max': max(values) if values else None,
            'standardDeviation': statistics.stdev(values) if len(values) > 1 else None,
            'iqr': quantile(values, .75) - quantile(values, .25) if values else None}


def quantile_upper_bound(values, fraction=.75, confidence=.95):
    """One-sided distribution-free upper confidence bound for a population quantile.

    For independent observations, X_(k) covers q_p when at most k-1 of n values
    fall below q_p. Pick the smallest k with Binomial(n,p) CDF(k-1) >= confidence.
    Ties make coverage conservative. No attainable order statistic means pending,
    not a made-up finite upper bound. This is a per-cell, not simultaneous, bound.
    """
    values = sorted(value for value in values if numeric(value))
    n, rank = len(values), None
    expect(0 < fraction < 1 and 0 < confidence < 1, 'Quantile/confidence must lie inside (0,1)')
    probabilities = []
    for count in range(n):
        log_probability = (math.lgamma(n + 1) - math.lgamma(count + 1) - math.lgamma(n - count + 1)
                           + count * math.log(fraction) + (n - count) * math.log1p(-fraction))
        probabilities.append(math.exp(log_probability))
        if math.fsum(probabilities) >= confidence:
            rank = count + 1
            break
    return {'method': 'One-sided exact-binomial order-statistic quantile upper bound',
            'quantile': fraction, 'confidence': confidence, 'n': n, 'rank': rank,
            'upper': values[rank - 1] if rank is not None else None,
            'achievedCoverage': math.fsum(probabilities) if rank is not None else (1 - fraction ** n if n else 0),
            'assumption': 'Independent observations per cell; no multiple-comparison adjustment'}


@functools.lru_cache(maxsize=4096)
def interval(pairs, fraction, repetitions=10000):
    """Paired type-7 quantile bootstrap; percentage uses that resample's comparator."""
    if not pairs:
        return {'delta': None, 'percent': None, 'after': None}
    def estimate(sample):
        before = quantile([x[0] for x in sample], fraction)
        after = quantile([x[1] for x in sample], fraction)
        delta = after - before
        return delta, delta / before * 100 if before > 0 else None, after
    if len(set(pairs)) == 1:
        result = estimate(pairs)
        return dict(zip(('delta', 'percent', 'after'), ([x, x] if x is not None else None for x in result)))
    rng = random.Random(digest([pairs, fraction, 20260928]))
    estimates = [estimate([pairs[rng.randrange(len(pairs))] for _ in pairs]) for _ in range(repetitions)]
    return {key: [quantile(values, .025), quantile(values, .975)] if all(numeric(x) for x in values) else None
            for key, values in zip(('delta', 'percent', 'after'), zip(*estimates))}


def ssr_interval(pairs):
    """Exact frozen ssr-performance.mjs LCG: seed 20260929, 10,000 resamples."""
    state = 20260929
    deltas, percentages = [], []
    for _ in range(10000):
        sample = []
        for _ in pairs:
            state = (1664525 * state + 1013904223) & 0xffffffff
            sample.append(pairs[math.floor(state / 4294967296 * len(pairs))])
        before = quantile([pair[0] for pair in sample], .75)
        delta = quantile([pair[1] for pair in sample], .75) - before
        deltas.append(delta)
        if before > 0:
            percentages.append(delta / before * 100)
    return {'delta': [quantile(deltas, .025), quantile(deltas, .975)],
            'percent': [quantile(percentages, .025), quantile(percentages, .975)] if len(percentages) == 10000 else None,
            'seed': 20260929, 'repetitions': 10000, 'method': 'Frozen SSR LCG paired p75 percentile bootstrap'}


def result_status(checks):
    statuses = [check['status'] for check in checks]
    if 'failed' in statuses:
        return 'failed'
    if 'invalid' in statuses:
        return 'invalid'
    if 'uncertain' in statuses:
        return 'uncertain'
    if not statuses or any(status != 'passed' for status in statuses):
        return 'pending'
    return 'passed'


def check(checks, identifier, category, value=None, *, maximum=None, minimum=None,
          bounds=None, complete=True, n=None, reason=None):
    observed = numeric(value)
    point = observed and (maximum is None or value <= maximum) and (minimum is None or value >= minimum)
    bound_pass = bounds is None or ((maximum is None or numeric(bounds[1]) and bounds[1] <= maximum) and
                                   (minimum is None or numeric(bounds[0]) and bounds[0] >= minimum))
    status = 'pending' if not observed or not complete else 'failed' if not point else 'uncertain' if not bound_pass else 'passed'
    row = {'id': identifier, 'category': category, 'value': value, 'minimum': minimum, 'maximum': maximum,
           'interval': bounds, 'n': n, 'status': status, 'reason': reason}
    checks.append(row)
    return row


def timing_matrix(run, family):
    manifest, raw = run['manifest'], run['raw']
    declared_n = manifest.get('n')
    n = declared_n if type(declared_n) is int and declared_n > 0 else 30
    expected = {(family, browser, profile, action, arm, block)
                for browser, profile in CONFIGS for action in ACTIONS for arm in ARMS for block in range(n)}
    def key(job):
        return tuple(job.get(name) for name in ('family', 'browser', 'profile', 'action', 'arm', 'block'))
    declared = [job for job in manifest.get('jobs', []) if job.get('family') == family]
    declarations = Counter(key(job) for job in declared)
    plan = {key(job): job for job in declared}
    records = [row for row in raw if get(row, 'job.family') == family]
    starts = Counter(key(row['job']) for row in records if row.get('status') == 'started')
    terminals = [row for row in records if row.get('status') != 'started']
    counts = Counter(key(row['job']) for row in terminals)
    diagnostics, groups = [], defaultdict(dict)
    if type(declared_n) is not int or declared_n < 30:
        diagnostics.append('Declared timing samples per cell must be an integer ≥30')
    if any(not isinstance(row, dict) or get(row, 'job.family') not in KNOWN_FAMILIES for row in raw):
        diagnostics.append('Unassigned or unknown-family raw attempt/integrity failure is retained and invalidates completeness')
    if set(manifest.get('actions', [])) != set(ACTIONS) or {(item.get('browser'), item.get('profile')) for item in manifest.get('configs', [])} != set(CONFIGS):
        diagnostics.append('Declared browser/profile/input matrix is incomplete')
    if manifest.get('constrained') != {'cpuRate': 4, 'latencyMs': 150, 'downloadBitsPerSecond': 1600000, 'uploadBitsPerSecond': 750000} or manifest.get('motion') != 'no-preference':
        diagnostics.append('Frozen constrained network/CPU or motion profile differs')
    if set(declarations) != expected or any(count != 1 for count in declarations.values()):
        diagnostics.append('Required 7 configurations × 2 inputs × 3 arms × every declared block is not scheduled exactly once')
    if set(starts) != expected or any(count != 1 for count in starts.values()) or any(row['job'] != plan.get(key(row['job'])) for row in records if row.get('status') == 'started'):
        diagnostics.append('Every start must match exactly one scheduled job; extra/orphan starts cannot disappear')
    for row in terminals:
        job = row['job']; identity = key(job)
        problems = []
        if identity not in expected or counts[identity] != 1 or starts[identity] != 1 or job != plan.get(identity):
            problems.append('Unexpected, duplicate, missing-start or mismatched planned job')
        if job.get('viewport') != ({'width': 390, 'height': 844} if job.get('profile') == 'phone' else {'width': 1280, 'height': 900}):
            problems.append('Declared actual viewport does not match frozen profile')
        if row.get('status') != 'ok' or row.get('errors') or row.get('failures'):
            problems.append('Failed/aborted/invalid terminal observation')
        if row.get('actualRegistry') != 'global' or job.get('requestedRegistry') != 'production-default':
            problems.append('Only actual production-global ownership qualifies')
        if not row.get('browserVersion'):
            problems.append('Missing observed browser version')
        missing = [metric for metric in METRICS if not numeric(get(row, 'metrics.' + metric)) or get(row, 'metrics.' + metric) < 0]
        if missing:
            problems.append('Missing/invalid metrics: ' + ', '.join(missing))
        if get(row, 'startup.snapshot.workload.items') != (2 if family == 'media' else 40):
            problems.append('Actual production catalog changed/missing')
        if get(row, 'startup.snapshot.workload.contentRendering') != ('on-demand' if job.get('arm') == 'candidate' else 'eager'):
            problems.append('Wrong authored production policy')
        if not get(row, 'first.trusted') or not get(row, 'second.trusted'):
            problems.append('First/repeat action is not trusted input')
        if family == 'combobox' and (not get(row, 'first.snapshot.workload.inputSame') or not get(row, 'second.snapshot.workload.inputSame')):
            problems.append('Persistent native input identity absent')
        if problems:
            diagnostics.append({'job': job, 'problems': problems})
        else:
            groups[identity[1:5]][job['block']] = row
    missing = expected - set(counts)
    if missing:
        diagnostics.append({'missingTerminalJobs': [list(value) for value in sorted(missing)]})
    successful = sum(len(group) for group in groups.values())
    complete = not diagnostics and n >= 30 and run['integrity']['verified'] and not manifest.get('qualification')
    return groups, {'complete': complete, 'nPlannedPerCell': n, 'successful': successful,
                    'required': len(expected), 'diagnostics': diagnostics, 'integrity': run['integrity']}


def compare_metrics(groups, family, bootstrap):
    rows = []
    for browser, profile in CONFIGS:
        for action in ACTIONS:
            for identifier, before, after in COMPARISONS:
                left, right = groups.get((browser, profile, action, before), {}), groups.get((browser, profile, action, after), {})
                blocks = sorted(left.keys() & right.keys())
                for metric in METRICS:
                    pairs = tuple((left[block]['metrics'][metric], right[block]['metrics'][metric]) for block in blocks)
                    a, b = stats([pair[0] for pair in pairs]), stats([pair[1] for pair in pairs])
                    median_ci, p75_ci = interval(pairs, .5, bootstrap), interval(pairs, .75, bootstrap)
                    delta = b['median'] - a['median'] if pairs else None
                    p75_delta = b['p75'] - a['p75'] if pairs else None
                    rows.append({'family': family, 'browser': browser, 'profile': profile, 'action': action,
                                 'comparison': identifier, 'before': before, 'after': after, 'metric': metric,
                                 'actualRegistry': 'production-global', 'n': len(pairs),
                                 'paired': bool(blocks) and left.keys() == right.keys(), 'blocks': blocks,
                                 'reference': a, 'candidate': b, 'medianDelta': delta,
                                 'candidateP75UpperBound': quantile_upper_bound([pair[1] for pair in pairs]),
                                 'maximumPairedDelta': max((pair[1] - pair[0] for pair in pairs), default=None),
                                 'medianPercent': delta / a['median'] * 100 if pairs and a['median'] > 0 else None,
                                 'p75Delta': p75_delta, 'p75Percent': p75_delta / a['p75'] * 100 if pairs and a['p75'] > 0 else None,
                                 'medianUncertainty': median_ci, 'p75Uncertainty': p75_ci})
    return rows


def timing_checks(family, rows, groups, matrix, design):
    checks = []
    check(checks, 'complete-timing-matrix', 'coverage', int(matrix['complete']), minimum=1, complete=matrix['complete'],
          reason='30+ complete matched blocks in every 7 browser/profile × 2 input × 3 arm cell; no failed/aborted replacement')
    media = family == 'media'
    gates = design['proposedBudgets' if media else 'proposedPromotionGates']
    for row in rows:
        prefix = '/'.join([row['comparison'], row['browser'], row['profile'], row['action']])
        complete = matrix['complete'] and row['paired'] and row['n'] >= 30
        constrained, metric = row['profile'] == 'constrained', row['metric']
        candidate = row['after'] == 'candidate'
        def delta(label, maximum, *, fraction='p75', percent=False, category='latency'):
            suffix = 'Percent' if percent else 'Delta'
            uncertainty = row[fraction + 'Uncertainty']['percent' if percent else 'delta']
            check(checks, prefix + '/' + label, category, row[fraction + suffix], maximum=maximum,
                  bounds=uncertainty, complete=complete and uncertainty is not None, n=row['n'])
        def reduction(label, minimum, *, percent=False):
            delta(label, -minimum, fraction='median', percent=percent, category='benefit')
        if metric == 'startupReadyMs':
            delta('startup-p75-ms', gates['deliveryOverhead']['startupP75RegressionThrottledMsMax' if constrained else 'startupP75RegressionMsMax'] if media else gates['realRouteBenefit']['maximumStartupReadyP75RegressionMs'])
            if not media:
                delta('startup-p75-percent', gates['realRouteBenefit']['maximumStartupReadyP75RegressionPercent'], percent=True)
        if metric == 'firstReadyMs':
            delta('first-p75-delta-ms', gates['firstUse'][('throttled' if constrained else 'normal') + 'P75AddedVsEagerMsMax'] if media else gates['firstUse']['maxAddedFirstUseP75At4xCPUThrottleMs' if constrained else 'maxAddedFirstUseP75Ms'])
            if candidate:
                maximum = gates['firstUse'][('throttled' if constrained else 'normal') + 'P75ReadyMsMax'] if media else gates['firstUse']['maxActionToUsableOptionsP75At4xCPUThrottleMs' if constrained else 'maxActionToUsableOptionsP75Ms']
                check(checks, prefix + '/first-p75-absolute-ms', 'latency', row['candidate']['p75'], maximum=maximum,
                      bounds=[None, row['candidateP75UpperBound']['upper']],
                      complete=complete and row['candidateP75UpperBound']['upper'] is not None, n=row['n'],
                      reason='Absolute p75 uses the one-sided 95% exact-binomial order-statistic upper bound; paired delta bootstrap is separate')
        if metric == 'repeatReadyMs':
            delta('repeat-p75-ms', gates['repeatUse'][('throttled' if constrained else 'normal') + 'P75AddedVsEagerMsMax'] if media else gates['firstUse']['maxRepeatP75RegressionMs'])
            if not media:
                delta('repeat-p75-percent', gates['firstUse']['maxRepeatP75RegressionPercent'], percent=True)
        if metric in ('entryRequests', 'settledRequests'):
            check(checks, prefix + '/' + metric + '-maximum-paired-delta', 'packaging', row['maximumPairedDelta'],
                  maximum=gates['deliveryOverhead']['initialUnexpectedRequestsMax'] if media else gates['packaging']['maxAdditionalRequestsForConstructionOnlyPolicy'], complete=complete, n=row['n'])
        if media and metric in ('entryGzipBytes', 'settledGzipBytes'):
            check(checks, prefix + '/' + metric + '-maximum-paired-delta', 'packaging', row['maximumPairedDelta'],
                  maximum=gates['deliveryOverhead']['incrementalPackedEntryGzipBytesMax'], complete=complete, n=row['n'],
                  reason='Whole-route bytes may add only the frozen 512-byte API overhead; selective entries are checked separately')
        if not candidate:
            continue
        if media and metric == 'startupComponentElements':
            reduction('component-elements', gates['componentUnused']['connectedElementReductionAbsoluteMin'])
            reduction('component-elements-percent', gates['componentUnused']['connectedElementReductionPercentMin'], percent=True)
        if media and metric == 'startupDocumentElements':
            reduction('route-elements', gates['routeBenefit']['deepConnectedElementReductionAbsoluteMin'])
            reduction('route-elements-percent', gates['routeBenefit']['deepConnectedElementReductionPercentMin'], percent=True)
        if not media and metric == 'startupGeneratedElements':
            reduction('deferred-elements', gates['structuralEligibility']['minimumInitiallyDeferredGeneratedElements'])
        if not media and metric == 'startupComponentNodes':
            reduction('component-all-nodes-percent', gates['structuralEligibility']['minimumComponentAllNodeReductionPercent'], percent=True)
        if not media and metric == 'startupDocumentNodes':
            reduction('route-all-nodes-percent', gates['realRouteBenefit']['minimumRouteAllNodeReductionPercent'], percent=True)
        if not media and metric == 'startupDocumentElements':
            reduction('route-elements', gates['realRouteBenefit']['minimumRouteElementsRemoved'])
    # Exact absent surfaces and repeat identity are per observation, never hidden by a median.
    for browser, profile in CONFIGS:
        for action in ACTIONS:
            for arm in ARMS:
                samples = list(groups.get((browser, profile, action, arm), {}).values())
                prefix = '/'.join([arm, browser, profile, action])
                ready = matrix['complete'] and len(samples) >= 30
                repeated = [row['metrics']['recreatedNodes'] for row in samples]
                check(checks, prefix + '/maximum-recreated-nodes', 'identity', max(repeated) if repeated else None,
                      maximum=0, complete=ready, n=len(samples))
                if media and arm == 'candidate':
                    for name in ('generatedCarousels', 'generatedSlides', 'generatedImages', 'imageViewToolNodes'):
                        location = 'startup.snapshot.' if name in ('generatedSlides', 'imageViewToolNodes') else 'startup.snapshot.workload.'
                        values = [get(row, location + name) for row in samples]
                        valid = bool(values) and all(type(value) is int and value >= 0 for value in values)
                        check(checks, prefix + '/unused-' + name, 'structure', max(values) if valid else None,
                              maximum=0, complete=ready and valid, n=len(samples), reason='Missing structural counters remain unmeasured')
                if not media:
                    for name, expected in [('generatedRows', 0 if arm == 'candidate' else 40)]:
                        values = [get(row, 'startup.snapshot.workload.' + name) for row in samples]
                        valid = bool(values) and all(numeric(value) for value in values)
                        check(checks, prefix + '/' + name, 'structure', max(abs(value - expected) for value in values) if valid else None,
                              maximum=0, complete=ready and valid, n=len(samples), reason='Exact unchanged 40-project consumer')
                    values = [row['metrics']['startupGeneratedElements'] for row in samples]
                    expected = 0 if arm == 'candidate' else 160
                    check(checks, prefix + '/generated-row-elements', 'structure', max(abs(value - expected) for value in values) if values else None,
                          maximum=0, complete=ready, n=len(samples), reason='Source accounting expects four elements × 40 unchanged option rows; browser counts must confirm it')
    return checks


def retention_analysis(run, family, design, bootstrap):
    checks, rows, comparisons = [], [], []
    if not run:
        check(checks, 'retention-evidence', 'retention', reason='Separate 5-context × 100-cycle acquisition is missing')
        return rows, comparisons, checks
    manifest, raw = run['manifest'], run['raw']
    repetitions = manifest.get('repetitions', 0)
    expected = {(arm, lifecycle, block) for arm in ARMS for lifecycle in ('retained', 'disposed') for block in range(repetitions)}
    key = lambda job: (job.get('arm'), job.get('lifecycle'), job.get('block'))
    jobs = [job for job in manifest.get('jobs', []) if job.get('family') == family]
    plans = {key(job): job for job in jobs}
    terminals = [row for row in raw if get(row, 'job.family') == family and row.get('status') != 'started']
    counts = Counter(key(row['job']) for row in terminals)
    starts = Counter(key(row['job']) for row in raw if get(row, 'job.family') == family and row.get('status') == 'started')
    complete = (run['integrity']['verified'] and not manifest.get('qualification') and repetitions >= 5 and
                manifest.get('cycles', 0) >= 100 and set(plans) == expected and len(jobs) == len(expected) and
                set(counts) == expected and all(value == 1 for value in counts.values()) and
                set(starts) == expected and all(starts[item] == 1 for item in expected) and
                all(row['job'] == plans.get(key(row['job'])) for row in raw if get(row, 'job.family') == family and row.get('status') == 'started'))
    complete = complete and all(isinstance(row, dict) and get(row, 'job.family') in KNOWN_FAMILIES for row in raw)
    for sample in terminals:
        job = sample['job']
        checkpoints = {point['cycle']: point for point in sample.get('checkpoints', [])}
        valid = (sample.get('status') == 'ok' and sample.get('actualRegistry') == 'global' and
                 job.get('requestedRegistry') == 'production-default' and job == plans.get(key(job)) and
                 job.get('browser') == 'chromium' and sample.get('browserVersion') and
                 not sample.get('errors') and not sample.get('failures') and {0, 10, 50, 100} <= checkpoints.keys() and
                 len(checkpoints) == len(sample.get('checkpoints', [])))
        complete = complete and valid
        a, b = checkpoints.get(10, {}), checkpoints.get(100, {})
        row = {'family': family, **job, 'valid': valid, 'actualRegistry': sample.get('actualRegistry')}
        paths = {'heap': 'heapBytes', 'connected': 'connected.document.nodes', 'listeners': 'dom.jsEventListeners',
                 'detached': 'detached.reportedNodes', 'detachedHosts': 'detached.reportedHostNodes',
                 'detachedInputs': 'detached.reportedInputNodes', 'generated': 'connected.generated.nodes'}
        for name, path in paths.items():
            before, after = get(a, path), get(b, path)
            if not (numeric(before) and numeric(after) and before >= 0 and after >= 0):
                before = after = None
            if name.startswith('detached') and (a.get('detachedUnsupported') or b.get('detachedUnsupported')):
                before = after = None
            row[name + 'Before'], row[name + 'After'] = before, after
            row[name + 'Delta'] = after - before if numeric(before) and numeric(after) else None
        row['heapPercent'] = row['heapDelta'] / row['heapBefore'] * 100 if numeric(row['heapDelta']) and numeric(row['heapBefore']) and row['heapBefore'] > 0 else None
        row['detachedUnsupported'] = [point.get('detachedUnsupported') for point in (a, b) if point.get('detachedUnsupported')]
        row['generatedRowsAt10'] = get(a, 'connected.workload.generatedRows')
        row['generatedRowsAt100'] = get(b, 'connected.workload.generatedRows')
        row['generatedElementsAt10'] = get(a, 'connected.generated.elements')
        row['generatedElementsAt100'] = get(b, 'connected.generated.elements')
        row['workloadAt10'] = get(a, 'connected.workload')
        row['workloadAt100'] = get(b, 'connected.workload')
        rows.append(row)
    check(checks, 'complete-retention-matrix', 'retention', int(complete), minimum=1, complete=complete,
          reason='Both retained and disposed lifecycles; every reference/candidate/rollback context and checkpoint required')
    media = family == 'media'
    gates = design['proposedBudgets' if media else 'proposedPromotionGates']['retention']
    for row in rows:
        prefix = '/'.join([row['arm'], row['lifecycle'], str(row['block'])])
        thresholds = {'connectedDelta': gates['connectedNodeGrowthMax' if media else 'maximumUnexplainedConnectedNodeGrowth'],
                      'listenersDelta': gates['listenerGrowthMax' if media else 'maximumPersistentListenerGrowth']}
        if media:
            thresholds.update(detachedDelta=gates['detachedNodeGrowthMax'], heapDelta=gates['postGcHeapGrowthBytesMax'], heapPercent=gates['postGcHeapGrowthPercentMax'])
        else:
            thresholds.update(detachedHostsDelta=gates['maximumDetachedHostOrNativeInputGrowth'], detachedInputsDelta=gates['maximumDetachedHostOrNativeInputGrowth'])
        for name, maximum in thresholds.items():
            check(checks, prefix + '/' + name, 'retention', row[name], maximum=maximum, complete=complete)
        if not media:
            expected_rows = 40 if row['lifecycle'] == 'retained' or row['arm'] != 'candidate' else 0
            values = [row['generatedRowsAt10'], row['generatedRowsAt100']]
            valid = all(numeric(value) and value >= 0 for value in values)
            check(checks, prefix + '/bounded-generated-rows', 'retention', max(abs(value - expected_rows) for value in values) if valid else None,
                  maximum=0, complete=complete, reason='Intentional retained rows must match the unchanged 40-item catalog; disposed candidate original stays unused')
            values = [row['generatedElementsAt10'], row['generatedElementsAt100']]
            valid = all(type(value) is int and value >= 0 for value in values)
            check(checks, prefix + '/bounded-generated-elements', 'retention', max(abs(value - expected_rows * 4) for value in values) if valid else None,
                  maximum=0, complete=complete, reason='Exactly four original elements per generated option row')
            workloads = [row['workloadAt10'], row['workloadAt100']]
            present = all(isinstance(workload, dict) and 'items' in workload and 'contentRendering' in workload for workload in workloads)
            consistent = present and all(workload['items'] == 40 and workload['contentRendering'] == ('on-demand' if row['arm'] == 'candidate' else 'eager') for workload in workloads)
            check(checks, prefix + '/unchanged-catalog-policy', 'retention', int(consistent) if present else None,
                  minimum=1, complete=complete, reason='Checkpoint workload and authored policy remain bound to the original route')
    for lifecycle in ('retained', 'disposed'):
        for identifier, before, after in COMPARISONS:
            left = {row['block']: row for row in rows if row['arm'] == before and row['lifecycle'] == lifecycle}
            right = {row['block']: row for row in rows if row['arm'] == after and row['lifecycle'] == lifecycle}
            blocks = sorted(left.keys() & right.keys())
            pairs = tuple((left[block]['heapDelta'], right[block]['heapDelta']) for block in blocks
                          if numeric(left[block]['heapDelta']) and numeric(right[block]['heapDelta']))
            uncertainty = interval(pairs, .5, bootstrap)
            a, b = stats([pair[0] for pair in pairs]), stats([pair[1] for pair in pairs])
            value = b['median'] - a['median'] if pairs else None
            comparisons.append({'family': family, 'lifecycle': lifecycle, 'comparison': identifier, 'before': before, 'after': after,
                                'n': len(pairs), 'reference': a, 'candidate': b, 'medianDelta': value, 'uncertainty': uncertainty})
            if not media and after == 'candidate':
                check(checks, lifecycle + '/' + identifier + '/median-heap-growth', 'retention', value,
                      maximum=gates['maximumCandidateMinusReferenceMedianHeapGrowthBytes'], bounds=uncertainty['delta'],
                      complete=complete and len(pairs) >= 5 and len(pairs) == repetitions and left.keys() == right.keys(), n=len(pairs),
                      reason='Paired median growth with supported heap measurements and 95% uncertainty')
    return rows, comparisons, checks


def selective_checks(prepared, manifest, family, design):
    checks, rows = [], []
    media = family == 'media'
    maximum = design['proposedBudgets']['deliveryOverhead']['incrementalPackedEntryGzipBytesMax'] if media else design['proposedPromotionGates']['packaging']['maxAddedGzipBytesPerChangedSelectiveEntry']
    for kind in ('class', 'definition'):
        values, error = {}, None
        try:
            for subject in ('reference', 'candidate'):
                descriptor = manifest['selectiveEntries'][subject][family][kind]
                path = within(prepared, descriptor['receipt'])
                expect(file_digest(path) == descriptor['receiptSha256'], 'Selective entry receipt changed')
                receipt = read_json(path)
                expect(receipt['subject'] == subject and receipt['family'] == family and receipt['kind'] == kind and receipt['specifier'] == descriptor['specifier'], 'Wrong selective entry identity')
                expect(receipt['sourceSha256'] == manifest['sources'][subject]['sourceSha256'] and receipt['sealSha256'] == manifest['sources'][subject]['sealSha256'], 'Selective entry source binding differs')
                expect(file_digest(within(prepared, receipt['packagesReceipt'])) == receipt['packagesReceiptSha256'], 'Selective packed package receipt changed')
                expect(file_digest(within(prepared, receipt['entrySource']['path'])) == receipt['entrySource']['sha256'], 'Selective entry source changed')
                expect(file_digest(within(path.parent, receipt['graph']['path'])) == receipt['graph']['sha256'], 'Selective dependency graph changed')
                verify_inventory(path.parent / 'site', receipt['assets'], exact=True)
                expect(receipt['entry'] == descriptor['entry'], 'Selective entry closure differs from receipt')
                entry = receipt['entry']; assets = {asset['path']: asset for asset in receipt['assets']}
                expect(len(set(entry['assets'])) == len(entry['assets']) and all(name in assets for name in entry['assets']), 'Invalid selective static closure')
                expect(entry['gzipBytes'] == sum(assets[name]['gzipBytes'] for name in entry['assets']) and entry['requests'] == len(entry['assets']), 'Selective closure totals differ')
                values[subject] = entry
            delta = values['candidate']['gzipBytes'] - values['reference']['gzipBytes']
            requests = values['candidate']['requests'] - values['reference']['requests']
        except (KeyError, ValueError, OSError, TypeError) as issue:
            error = str(issue); delta = requests = None
        rows.append({'kind': kind, 'family': family, 'reference': values.get('reference'), 'candidate': values.get('candidate'),
                     'gzipDelta': delta, 'requestDelta': requests, 'reason': error})
        check(checks, 'selective-' + kind + '-gzip', 'packaging', delta, maximum=maximum, reason=error or 'Separately packed selective closure; actual-route entry bytes cannot substitute')
        check(checks, 'selective-' + kind + '-requests', 'packaging', requests, maximum=0, reason=error)
    return rows, checks


def ssr_analysis(path, prepared_sha, bootstrap):
    """Recompute the SSR gate from terminal renderMs, never trust summary.passed alone."""
    checks, rows, provenance = [], [], None
    if not path:
        check(checks, 'selection-production-SSR', 'server', reason='Separate n≥30 fresh-process production render acquisition missing; static serving/build time does not measure SSR')
        return rows, checks, provenance
    path = Path(path).resolve()
    try:
        manifest, summary = read_json(path / 'manifest.json'), read_json(path / 'summary.json')
        provenance = {'path': str(path), 'manifestSha256': file_digest(path / 'manifest.json'), 'summarySha256': file_digest(path / 'summary.json'), 'rawSha256': file_digest(path / 'samples.jsonl')}
        expect(isinstance(manifest, dict), 'SSR acquisition manifest must be a JSON object')
        expect(isinstance(summary, dict), 'SSR acquisition summary must be a JSON object')
        expect(digest({key: value for key, value in manifest.items() if key != 'manifestSha256'}) == manifest.get('manifestSha256'), 'SSR manifest self-seal missing/changed')
        raw = [json.loads(line) for line in (path / 'samples.jsonl').read_text().splitlines() if line.strip()]
        expect(all(isinstance(row, dict) for row in raw), 'SSR raw records must be objects; malformed record retained')
        expect(manifest['kind'] == 'selection-production-ssr-acquisition' and summary['kind'] == 'selection-production-ssr-summary', 'Wrong SSR boundary')
        expect(manifest['preparation']['sha256'] == prepared_sha, 'SSR uses different prepared builds')
        preparation = read_json(Path(manifest['preparation']['path']) / 'manifest.json')
        expect(file_digest(Path(manifest['preparation']['path']) / 'manifest.json') == prepared_sha and preparation == manifest['preparation']['identity'], 'SSR embedded prepared identity differs')
        expect(manifest['rawSha256'] == provenance['rawSha256'] and manifest['summarySha256'] == provenance['summarySha256'], 'SSR raw/summary seal changed')
        expect(summary['integrityVerified'] and summary['complete'] and summary['sufficient'] and not summary['qualification'] and not manifest['qualification'] and manifest.get('verifiedBefore') and manifest.get('verifiedAfter'), 'SSR incomplete/unverified/qualification-only')
        expect(manifest['protocol']['id'] == 'selection-production-ssr-fresh-process-v1' and manifest['protocol']['actualRegistry'] == 'production-global', 'Wrong SSR production protocol')
        uncertainty_policy = manifest['protocol']['uncertainty']
        expect(uncertainty_policy['repetitions'] == 10000 and uncertainty_policy['seed'] == 20260929 and uncertainty_policy['confidence'] == .95, 'Frozen SSR uncertainty policy changed')
        expect(manifest['harness'] == preparation['harness'], 'SSR harness differs from frozen preparation')
        verify_inventory(ROOT, manifest['support'])
        verify_inventory(Path(preparation['sources']['candidate']['snapshot']) / 'source', manifest['support'])
        expect(file_digest(manifest['runtime']['path']) == manifest['runtime']['sha256'] == preparation['runtime']['node']['sha256'] and
               manifest['runtime']['version'] == preparation['runtime']['node']['version'] and
               Path(manifest['runtime']['path']).resolve() == Path(preparation['runtime']['node']['path']).resolve(), 'SSR Node runtime changed')
        expected_budget = next(item for item in preparation['budgets'] if item['path'] == DESIGN_PATH)
        expect(manifest['budgets'] == expected_budget, 'SSR family budget binding changed')
        for arm in preparation['arms']:
            receipt_path = within(manifest['preparation']['path'], arm['receipt'])
            expect(file_digest(receipt_path) == arm['receiptSha256'], 'SSR arm receipt changed')
            ssr = read_json(receipt_path)['ssr']
            expect(ssr['exportName'] == 'renderWorkflows' and ssr['args'] == ['selection'] and ssr['sourceSealSha256'] == preparation['sources'][arm['subject']]['sealSha256'], 'Wrong compiled production SSR owner')
            expect(ssr['sourceSha256'] == preparation['sources'][arm['subject']]['sourceSha256'] and
                   ssr['runtimeLockSha256'] == preparation['sources'][arm['subject']]['rootLockSha256'], 'SSR source or exact runtime lock differs')
            runtime_path = within(manifest['preparation']['path'], ssr['runtimeReceipt'])
            expect(file_digest(runtime_path) == ssr['runtimeReceiptSha256'], 'SSR runtime receipt changed')
            runtime = read_json(runtime_path)
            expect(runtime['sha256'] == digest(runtime['files']) and runtime['exactLockSha256'] == ssr['runtimeLockSha256'], 'SSR runtime inventory/lock changed')
            expect(runtime['exclusions'] == ['.cache', '.bin', '.vite', '.vite-temp', '@en-reve/docs'], 'Undeclared SSR runtime exclusions')
            runtime_root = within(manifest['preparation']['path'], runtime['root'])
            verify_inventory(runtime_root, runtime['files'], exact=True, exclusions=runtime['exclusions'])
            expect(file_digest(runtime_root / '.package-lock.json') == runtime['installedLockSha256'], 'SSR installed lock changed')
            output_root = within(manifest['preparation']['path'], ssr['outputRoot'])
            output_assets = []
            for asset in ssr['assets']:
                asset_path = within(manifest['preparation']['path'], asset['path'])
                expect(asset_path.is_relative_to(output_root), 'Compiled SSR asset escapes frozen output')
                output_assets.append({**asset, 'path': asset_path.relative_to(output_root).as_posix()})
            verify_inventory(output_root, output_assets, exact=True)
            expect(ssr['entry'] in {asset['path'] for asset in ssr['assets']}, 'Production SSR entry absent from sealed output')
            expect((within(manifest['preparation']['path'], arm['root']) / 'node_modules').resolve() == runtime_root, 'SSR external module owner changed')
        expect(manifest['gates']['maximumSSRRenderP75RegressionMs'] == 5 and manifest['gates']['maximumSSRRenderP75RegressionPercent'] == 5, 'Frozen SSR gates changed')
        expect(manifest['n'] >= 30 and len(manifest['jobs']) == manifest['n'] * 3, 'Missing SSR matrix')
        jobs = {job['id']: job for job in manifest['jobs']}
        expect(len(jobs) == len(manifest['jobs']), 'Duplicate SSR planned job')
        terminals = [row for row in raw if row.get('event') == 'terminal']
        expect(len(terminals) == len(jobs) and len({get(row, 'job.id') for row in terminals}) == len(jobs), 'Missing/duplicate SSR terminal')
        expect(not any(row.get('event') == 'abort' for row in raw), 'SSR abort retained')
        starts = Counter(get(row, 'job.id') for row in raw if row.get('event') == 'started')
        expect(set(starts) == set(jobs) and all(count == 1 for count in starts.values()), 'Unexpected or duplicate SSR start')
        expect(all(row.get('event') in ('started', 'terminal') and row['job'] == jobs.get(get(row, 'job.id')) for row in raw), 'Unassigned/unplanned SSR raw record')
        groups = defaultdict(dict)
        for row in terminals:
            job = row['job']
            expect(job == jobs.get(job['id']) and starts[job['id']] == 1 and row['status'] == 'succeeded' and
                   all(numeric(get(row, 'metrics.' + name)) and get(row, 'metrics.' + name) >= 0 for name in ('renderMs', 'importMs', 'workerBootMs', 'spawnToExitMs')), 'Invalid SSR attempt')
            expect(job['registry'] == 'production-global' and job['route'] == '/workflows/selection.html', 'Wrong SSR route/registry')
            expect(job['block'] not in groups[job['arm']], 'Duplicate SSR arm/block')
            verify_inventory(within(path, row['artifacts']), row['artifactsInventory'], exact=True)
            groups[job['arm']][job['block']] = row['metrics']['renderMs']
        expect(set(groups) == set(ARMS) and all(set(group) == set(range(manifest['n'])) for group in groups.values()), 'Missing SSR matched blocks')
        for identifier, before, after in COMPARISONS:
            pairs = tuple((groups[before][block], groups[after][block]) for block in range(manifest['n']))
            a, b = stats([p[0] for p in pairs]), stats([p[1] for p in pairs])
            uncertainty = ssr_interval(pairs)
            delta = b['p75'] - a['p75']; percent = delta / a['p75'] * 100 if a['p75'] > 0 else None
            rows.append({'comparison': identifier, 'before': before, 'after': after, 'n': len(pairs), 'reference': a, 'candidate': b, 'p75Delta': delta, 'p75Percent': percent, 'uncertainty': uncertainty})
            if identifier != 'candidate-rollback':
                check(checks, identifier + '/SSR-p75-ms', 'server', delta, maximum=5, bounds=uncertainty['delta'], n=len(pairs))
                check(checks, identifier + '/SSR-p75-percent', 'server', percent, maximum=5, bounds=uncertainty['percent'], n=len(pairs), complete=uncertainty['percent'] is not None)
    except (KeyError, ValueError, OSError, TypeError, StopIteration) as error:
        check(checks, 'selection-production-SSR', 'server', reason='Invalid/incomplete SSR receipt: ' + str(error))
    return rows, checks, provenance


def analysis_scope(manifest):
    """Historical interpretation is retained; current acquisition requires the complete declared successor."""
    preparation = manifest['preparedManifest']
    reference = preparation['sources']['reference']['git']['head']
    expect(preparation.get('acceptedReferenceHead') == reference, 'Prepared reference declaration differs from its source')
    if reference == HISTORICAL_REFERENCE:
        return KNOWN_FAMILIES
    expect(reference == ACCEPTED_REFERENCE, 'Unknown accepted reference')
    expect(manifest.get('families') == list(ACTIVE_FAMILIES), 'Current full analysis requires exactly combobox and command')
    return ACTIVE_FAMILIES


def assert_analysis_scope(run, families):
    expect(run['manifest'].get('families') == list(families), 'Acquisition family declaration differs from analysis scope')
    jobs = run['manifest'].get('jobs', [])
    expect({get(job, 'family') for job in jobs} == set(families), 'Missing configured or unexpected family jobs')
    expect(all(get(row, 'job.family') in families for row in run['raw'] if isinstance(row, dict) and 'job' in row), 'Unexpected family observation cannot be projected away')


def analyze_family_data(timing, retention, designs, *, bootstrap=10000, packaging=None, ssr=None, traffic=None, families=None):
    """Pure decision core used by synthetic regressions; provenance is supplied separately."""
    selected = KNOWN_FAMILIES if families is None else tuple(families)
    if families is not None:
        expect(selected == ACTIVE_FAMILIES, 'Explicit analysis scope must be the complete active successor')
        assert_analysis_scope(timing, selected)
        if retention is not None:
            assert_analysis_scope(retention, selected)
    result = {}
    for family in (family for family in FAMILIES if family in selected):
        design = designs['designs']['media-design' if family == 'media' else 'selection-design']
        groups, matrix = timing_matrix(timing, family)
        rows = compare_metrics(groups, family, bootstrap)
        checks = timing_checks(family, rows, groups, matrix, design)
        retained, retention_comparisons, retention_checks = retention_analysis(retention, family, design, bootstrap)
        checks.extend(retention_checks)
        asset_rows, asset_checks = (packaging or {}).get(family, ([], []))
        checks.extend(asset_checks or [{'id': 'separately-packed-entry-evidence', 'category': 'packaging', 'status': 'pending', 'reason': 'Selective entry receipts missing'}])
        server_rows, server_checks = (ssr or ([], [{'id': 'selection-production-SSR', 'category': 'server', 'status': 'pending', 'reason': 'Separate SSR acquisition missing'}]))
        if family == 'combobox':
            checks.extend(server_checks)
        categories = {category: result_status([item for item in checks if item['category'] == category])
                      for category in sorted({item['category'] for item in checks})}
        automated = result_status(checks)
        result[family] = {'matrix': matrix, 'rows': rows, 'retention': retained, 'retentionComparisons': retention_comparisons,
                          'assets': asset_rows, 'server': server_rows if family == 'combobox' else [], 'checks': checks,
                          'decision': {'automatedStatus': automated, 'categories': categories, 'humanReview': 'pending',
                                       'status': 'pending-human-review' if automated == 'passed' else automated,
                                       'scope': 'Actual production-global ' + ('two-image component-patterns route' if family == 'media' else '40-project Selection route'),
                                       'conclusion': 'No route adoption or full rollout acceptance is inferred. Human keyboard/AT and separate correctness acceptance remain required.'}}
    extension_path = Path(__file__).with_name('analyze_additional_families.py')
    if extension_path.exists():
        spec = importlib.util.spec_from_file_location('additional_family_analysis', extension_path)
        extension = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(extension)
        result.update(extension.analyze_additional_family_data(timing, retention, designs, core=globals(), bootstrap=bootstrap, packaging=packaging, traffic=traffic, families=tuple(family for family in selected if family not in FAMILIES)))
    else:
        # A partial source integration must stay visible rather than silently narrowing scope.
        for family in (family for family in ('command', 'pagination') if family in selected):
            result[family] = {'matrix': {'complete': False, 'successful': 0, 'required': 6930 if family == 'command' else 1260, 'diagnostics': ['Required family analyzer extension unavailable']},
                              'rows': [], 'retention': [], 'retentionComparisons': [], 'assets': [], 'server': [],
                              'checks': [{'id': 'family-analysis-integration', 'category': 'coverage', 'status': 'pending', 'reason': 'Required family analyzer extension unavailable'}],
                              'decision': {'automatedStatus': 'pending', 'categories': {'coverage': 'pending'}, 'humanReview': 'pending', 'status': 'pending', 'scope': family + ' actual route', 'conclusion': 'Unintegrated family has no acceptance.'}}
    return result


def write_invalid_input_diagnostic(output, args, runs):
    """Retain non-object top-level evidence without adopting a prepared identity."""
    invalid = {name: {key: run[key] for key in ('manifest', 'summary') if not isinstance(run[key], dict)}
               for name, run in runs.items()}
    invalid = {name: values for name, values in invalid.items() if values}
    if not invalid:
        return False
    protected = [ROOT.resolve(), Path(args.run).resolve()]
    protected.extend(Path(path).resolve() for path in (args.retention, args.ssr) if path)
    for run in runs.values():
        # Syntactically valid declared paths are containment boundaries only.
        # Their presence is not authentication of the preparation or its sources.
        declared = [get(run, 'manifest.prepared')]
        sources = get(run, 'manifest.preparedManifest.sources')
        if isinstance(sources, dict):
            declared.extend(get(source, 'snapshot') for source in sources.values())
        for value in declared:
            if isinstance(value, str) and value:
                try:
                    protected.append(Path(value).resolve())
                except (OSError, ValueError):
                    pass
    expect(not any(output.is_relative_to(path) for path in protected),
           'Invalid-evidence diagnostic must be outside source, preparation and acquisition input directories')
    for run in runs.values():
        for name, expected in run['files'].items():
            expect(file_digest(Path(run['path']) / name) == expected,
                   'Acquisition changed before invalid-evidence diagnostic: ' + name)
    diagnostic = {'schemaVersion': 1, 'kind': 'actual-route-family-performance-invalid-evidence',
                  'status': 'invalid', 'families': {family: {'status': 'not-evaluated'} for family in KNOWN_FAMILIES},
                  'provenance': {name: {key: run[key] for key in ('path', 'files', 'integrity')} for name, run in runs.items()},
                  'invalidInputValues': invalid,
                  'diagnostics': [error for run in runs.values() for error in run['integrity']['errors']],
                  'scope': 'Input-shape diagnostic only. No prepared identity, family gate result or rollout acceptance is inferred.'}
    output.mkdir()
    (output / 'analysis.json').write_text(json.dumps(diagnostic, indent=2, allow_nan=False) + '\n')
    (output / 'analysis-receipt.json').write_text(json.dumps({'kind': 'actual-route-family-invalid-evidence-receipt',
                                                            'analysisSha256': file_digest(output / 'analysis.json'),
                                                            'analyzerSha256': file_digest(__file__)}, indent=2) + '\n')
    print(output / 'analysis.json')
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--retention')
    parser.add_argument('--ssr')
    parser.add_argument('--out', required=True)
    parser.add_argument('--bootstrap', type=int, default=10000)
    args = parser.parse_args()
    expect(args.bootstrap >= 1000, 'At least 1,000 fixed bootstrap resamples required')
    output = Path(args.out).resolve()
    expect(not output.exists(), 'Analysis output must be fresh; never overwrite prior evidence')
    timing = load_run(args.run, 'actual-route-family-timing')
    if write_invalid_input_diagnostic(output, args, {'timing': timing}):
        return
    manifest = timing['manifest']; prepared = Path(manifest['prepared']).resolve()
    expect(not output.is_relative_to(prepared), 'Analysis cannot alter frozen preparation')
    provenance_errors = []
    try:
        preparation, budgets, receipts = verify_prepared(prepared, manifest['preparedManifestSha256'])
        for row in timing['raw']:
            expect(isinstance(row, dict), 'Raw acquisition contains a non-object record')
            if row.get('status') != 'ok':
                continue
            route = {'media': '/component-patterns.html', 'combobox': '/workflows/selection.html', 'command': '/workflows/settings.html', 'pagination': '/api-examples/pagination.html'}[row['job']['family']]
            entry = receipts[row['job']['arm']]['routes'][route]['entry']
            expect(row['metrics']['entryGzipBytes'] == entry['gzipBytes'] and row['metrics']['entryRequests'] == entry['requests'], 'Observed static entry differs from sealed route receipt')
    except (ValueError, KeyError, OSError, TypeError) as error:
        provenance_errors.append(str(error))
        preparation = manifest['preparedManifest']; budgets = read_json(ROOT / DESIGN_PATH); receipts = {}
        timing['integrity']['verified'] = False; timing['integrity']['errors'].extend(provenance_errors)
    retention = load_run(args.retention, 'actual-route-family-retention', manifest['preparedManifestSha256']) if args.retention else None
    if retention and write_invalid_input_diagnostic(output, args, {'timing': timing, 'retention': retention}):
        return
    if retention and provenance_errors:
        retention['integrity']['verified'] = False; retention['integrity']['errors'].extend(provenance_errors)
    selected = analysis_scope(manifest)
    scoped = selected == ACTIVE_FAMILIES
    packaging = {family: selective_checks(prepared, preparation, family, budgets['designs']['media-design' if family == 'media' else 'selection-design']) for family in FAMILIES if family in selected}
    server_rows, server_checks, server_provenance = ssr_analysis(args.ssr, manifest['preparedManifestSha256'], args.bootstrap)
    families = analyze_family_data(timing, retention, budgets, bootstrap=args.bootstrap, packaging=packaging, ssr=(server_rows, server_checks),
                                   traffic={'prepared': str(prepared), 'preparation': preparation, 'receipts': receipts, 'integrityVerified': not provenance_errors}, families=selected if scoped else None)
    # Reverify immutable inputs after analysis so concurrent edits cannot hide behind an early check.
    for run in [timing, *([retention] if retention else [])]:
        for name, expected in run['files'].items():
            expect(file_digest(Path(run['path']) / name) == expected, 'Acquisition changed during analysis: ' + name)
    data = {'schemaVersion': 1, 'kind': 'actual-route-family-performance-analysis', 'families': families,
            'analysisScope': {'families': list(selected), 'acceptedReferenceHead': manifest['preparedManifest']['acceptedReferenceHead'], 'historical': not scoped},
            'prepared': str(prepared), 'preparedManifestSha256': manifest['preparedManifestSha256'],
            'provenance': {'timing': {**{k: timing[k] for k in ('path', 'files', 'integrity')}, 'acquisitionStatus': timing['summary'].get('status')},
                           'retention': {**{k: retention[k] for k in ('path', 'files', 'integrity')}, 'acquisitionStatus': retention['summary'].get('status')} if retention else None,
                           'ssr': server_provenance, 'preparedErrors': provenance_errors},
            'frozenBudgetSha256': manifest['budgets']['sha256'],
            'uncertainty': {'method': 'Paired matched-block percentile bootstrap of type-7 median and p75; same block indices resampled in both arms',
                            'confidence': .95, 'repetitions': args.bootstrap, 'seed': 20260928,
                            'absoluteQuantiles': 'Absolute p75 limits use a one-sided 95% exact-binomial order-statistic upper confidence bound, not the bootstrap quantile endpoint. Independent per-cell observations assumed.',
                            'serverBootstrap': 'SSR follows its own frozen LCG seed20260929 and10000 resamples exactly.',
                            'gatePolicy': 'Both point and applicable 95% bound must satisfy each ceiling/minimum; crossing a gate is uncertain, never passed. No multiple-comparison adjustment.'},
            'rolloutAcceptance': 'Not inferred. Each family has an independent decision; manual review and correctness are separate evidence.',
            'limits': ['Actual production-global routes only; no native scoped-registry coverage is inferred.',
                       'No p95 is reported for fewer than 100 observations per cell; n≥30 does not certify a tail.',
                       'Cold optional-code and feature preparation are not applicable to these same-code construction boundaries.',
                       'Static serving, browser startup and builds cannot satisfy production SSR timing gates.',
                       'Connected census, detached diagnostics and double-GC heap are distinct; unsupported diagnostics are unmeasured.',
                       'Every failed/aborted/start record is retained; no pooling, trimming, replacement cells or historical acceptance.',
                       'Browser focus, emulated viewports and DOM/AX checks do not establish human speech or physical-device acceptance.']}
    output.mkdir()
    (output / 'analysis.json').write_text(json.dumps(data, indent=2, allow_nan=False) + '\n')
    (output / 'analysis-receipt.json').write_text(json.dumps({'analysisSha256': file_digest(output / 'analysis.json'),
                                                            'analyzerSha256': file_digest(__file__),
                                                            'preparedManifestSha256': manifest['preparedManifestSha256']}, indent=2) + '\n')
    print(output / 'analysis.json')


if __name__ == '__main__':
    main()
