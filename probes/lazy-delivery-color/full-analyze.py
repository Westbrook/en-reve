"""Analyze a separate immutable full color campaign; never acquire or pool samples.

python -B probes/lazy-delivery-color/full-analyze.py --run=/timing
  --retention=/separate-retention --out=/fresh-analysis

The application candidate and its frozen numeric gates are unchanged. Production
and bridge-bearing same-code controls remain separate build/acquisition domains.
"""
from collections import Counter, defaultdict
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import os
import random
import statistics
import sys
from urllib.parse import unquote, urlsplit

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
ROUTE = '/api-examples/composable-chat.html'
CONFIGS = tuple((browser, profile) for browser in ('chromium', 'firefox', 'webkit')
                for profile in ('desktop', 'phone')) + (('chromium', 'constrained'),)
ACTIVE = ('cold', 'prepared', 'immediate')
INACTIVE = ('unused', 'prepared-unused', 'abandoned')
TERMINAL = ('ok', 'failed', 'aborted', 'not-run')
REQUIRED_SUPPORT = {'plans/lazy-delivery/color-popup.md', 'plans/lazy-delivery/budgets.json',
                    'probes/lazy-delivery-families/analyze-performance.py',
                    'probes/lazy-delivery-color/full-analyze.py'}


def expect(condition, message):
    if not condition:
        raise ValueError(message)


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def nonnegative(value):
    return numeric(value) and value >= 0


def get(value, path, default=None):
    for part in path.split('.'):
        if not isinstance(value, dict) or part not in value:
            return default
        value = value[part]
    return value


def digest(value):
    if not isinstance(value, bytes):
        value = json.dumps(value, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()
    return hashlib.sha256(value).hexdigest()


def read_object(value, label):
    result = json.loads(value)
    expect(isinstance(result, dict), label + ' must be a JSON object')
    return result


def helper_module():
    # Reuse the existing pure exact-inventory, source and runtime verifier. This
    # imports no acquisition runner and never invokes a build or browser.
    path = ROOT / 'probes/lazy-delivery-families/analyze-performance.py'
    spec = importlib.util.spec_from_file_location('en_color_family_verification', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Captured:
    """One byte capture supplies both parsing and hashes; every input rechecked."""
    def __init__(self):
        self.files = {}
        self.protected = {ROOT.resolve()}

    def take(self, path, expected=None):
        path = Path(path).resolve(strict=True)
        expect(path.is_file(), 'Expected file: ' + str(path))
        value = path.read_bytes()
        fingerprint = digest(value)
        if expected is not None:
            expect(isinstance(expected, str) and len(expected) == 64 and fingerprint == expected,
                   'Mandatory input hash mismatch: ' + str(path))
        prior = self.files.get(str(path))
        expect(prior is None or prior['sha256'] == fingerprint, 'Input changed between captures: ' + str(path))
        self.files[str(path)] = {'path': str(path), 'sha256': fingerprint, 'bytes': len(value)}
        self.protected.add(path.parent)
        return value

    def object(self, path, expected=None):
        return read_object(self.take(path, expected), str(path))

    def recheck(self):
        for item in self.files.values():
            expect(digest(Path(item['path']).read_bytes()) == item['sha256'], 'Input changed during analysis: ' + item['path'])

    def guard_output(self, out):
        out = Path(out).resolve()
        expect(not out.exists(), 'Output must be fresh, never overwrite evidence')
        for root in self.protected:
            expect(not out.is_relative_to(root) and not root.is_relative_to(out),
                   'Output overlaps protected input/source root: ' + str(root))


def protect_bindings(capture, bindings):
    """Containment remains effective even when later validation rejects identity."""
    if not isinstance(bindings, dict):
        return
    if isinstance(bindings.get('executingRoot'), str):
        capture.protected.add(Path(bindings['executingRoot']).resolve())
    # Browser distributions and standalone runtime files are immutable inputs
    # even when they live outside source/preparation roots. Protect their actual
    # canonical roots before any fresh output can be created beneath them.
    runtime_files = get(bindings, 'runtime.files')
    if isinstance(runtime_files, dict) and isinstance(bindings.get('executingRoot'), str):
        runtime_base = Path(bindings['executingRoot'])
        directories, leaves = set(), set()
        for name, value in runtime_files.items():
            if not isinstance(name, str):
                continue
            path = (runtime_base / name.removesuffix('@link').rstrip('/')).resolve()
            if name.endswith('/') or isinstance(value, dict) and value.get('type') == 'directory':
                directories.add(path)
            else:
                leaves.add(path)
        roots = {path for path in directories if not any(path != other and path.is_relative_to(other) for other in directories)}
        capture.protected.update(roots)
        capture.protected.update(path for path in leaves if not any(path.is_relative_to(root) for root in roots))

    for name in ('production', 'controlled', 'producer', 'cold'):
        declaration = bindings.get(name)
        if not isinstance(declaration, dict):
            continue
        for key in ('path', 'sidecarPath', 'rawPath'):
            if isinstance(declaration.get(key), str):
                path = Path(declaration[key]).resolve()
                capture.protected.add(path if name in ('production', 'controlled') and key == 'path' else path.parent)
        identity = declaration.get('identity')
        if not isinstance(identity, dict):
            continue
        for source in (identity.get('sources') or {}).values():
            if isinstance(source, dict):
                for key in ('origin', 'snapshot'):
                    if isinstance(source.get(key), str):
                        capture.protected.add(Path(source[key]).resolve())


def cold_schedule():
    state, result = 2026092803, []
    for block in range(1, 31):
        state = (1664525 * state + 1013904223) & 0xffffffff
        result.append({'block': block, 'order': ['reference', 'candidate'] if state / 4294967296 < .5 else ['candidate', 'reference']})
    return result


def cold_statistics(pairs):
    def described(values):
        return {'n': len(values), 'medianMs': quantile(values, .5), 'p75Ms': quantile(values, .75),
                'minimumMs': min(values), 'maximumMs': max(values)}
    state, draws = 2026092804, []
    for _ in range(10000):
        sample = []
        for _ in pairs:
            state = (1664525 * state + 1013904223) & 0xffffffff
            sample.append(pairs[math.floor(state / 4294967296 * len(pairs))])
        draws.append(quantile([p['candidateMs'] for p in sample], .5) - quantile([p['referenceMs'] for p in sample], .5))
    return {'arms': {arm: described([p[arm + 'Ms'] for p in pairs]) for arm in ('reference', 'candidate')},
            'primaryDifferenceOfArmMediansMs': quantile([p['candidateMs'] for p in pairs], .5) - quantile([p['referenceMs'] for p in pairs], .5),
            'supportingPairedDifferences': described([p['differenceMs'] for p in pairs]),
            'uncertainty': {'lowerMs': quantile(draws, .025), 'upperMs': quantile(draws, .975), 'confidence': .95,
                'draws': 10000, 'seed': 2026092804,
                'method': 'Paired-block percentile bootstrap; resample common block indices and recompute candidate median minus reference median in every draw.'}}


def validate_cold_records(cold, events):
    expected_protocol = {'blocks': 30, 'orderSeed': 2026092803, 'bootstrapSeed': 2026092804, 'bootstrapDraws': 10000,
        'confidence': .95, 'maximumAddedReadyMs': 50, 'cpuRate': 4, 'latencyMs': 150,
        'downloadBitsPerSecond': 1600000, 'uploadBitsPerSecond': 750000,
        'viewport': {'width': 1280, 'height': 900}, 'reducedMotion': 'reduce'}
    expect(cold.get('protocol') == expected_protocol and cold.get('schedule') == cold_schedule(), 'Original cold protocol/seeded plan changed')
    expect(not cold.get('error') and not cold.get('abortRequested') and not cold.get('finalizationErrors'), 'Original cold campaign failed or aborted')
    expected_jobs = [{'block': row['block'], 'arm': arm, 'ordinal': index + 1}
                     for row in cold_schedule() for index, arm in enumerate(row['order'])]
    attempts = cold.get('attempts')
    expect(isinstance(attempts, list) and len(attempts) == 60 and len(events) == 120, 'Original cold fixed journal incomplete')
    for index, expected in enumerate(expected_jobs):
        row = attempts[index]
        expect({key: row.get(key) for key in expected} == expected, 'Original cold duplicate/reordered arm')
        start, terminal = events[index * 2:index * 2 + 2]
        expect(start.get('event') == 'started' and terminal.get('event') == 'terminal'
               and {key: start.get(key) for key in expected} == expected
               and {key: value for key, value in terminal.items() if key != 'event'} == row, 'Original cold raw lifecycle differs')
        expect(row.get('status') == 'pass' and not row.get('error') and not row.get('cleanupError')
               and row.get('pageErrors') == [] and row.get('failedRequests') == [], 'Original cold raw failure')
        measurement = row.get('measurement') or {}
        expect(measurement.get('state') == 'ready' and measurement.get('trusted') is True
               and nonnegative(measurement.get('durationMs')) and numeric(measurement.get('end')) and numeric(measurement.get('start'))
               and measurement['durationMs'] == measurement['end'] - measurement['start'], 'Invalid cold raw timing/trust')
        expect(row.get('editingVerifiedAfterMeasurement') is True and row.get('cancelPreservedDraft') is True
               and row.get('resourceTimingBufferFull') is False, 'Missing cold usability evidence')
        if row['arm'] == 'candidate':
            expect(get(row, 'coldDelivery.verified') is True and get(row, 'coldDelivery.assets') == cold.get('coldAssets'), 'Missing actual cold delivery proof')
    pairs = []
    for block in range(1, 31):
        rows = {row['arm']: row for row in attempts if row['block'] == block}
        reference, candidate = (rows[arm]['measurement']['durationMs'] for arm in ('reference', 'candidate'))
        pairs.append({'block': block, 'referenceMs': reference, 'candidateMs': candidate, 'differenceMs': candidate - reference})
    expected = cold_statistics(pairs)
    summary = cold.get('summary') or {}
    expect(summary.get('pairs') == pairs, 'Original cold summary pairs differ from actual records')
    for key, value in expected.items():
        expect(summary.get(key) == value, 'Original cold statistic does not reproduce from raw: ' + key)
    expect(expected['primaryDifferenceOfArmMediansMs'] <= 50 and expected['uncertainty']['upperMs'] <= 50,
           'Original cold raw observations do not pass unchanged gates')
    expect(summary.get('decision') == 'this cold diagnostic passes; full frozen matrix is still required before any promotion',
           'Original cold decision differs from recomputed evidence')


def verify_bindings(capture, bindings, helpers):
    expect(bindings.get('kind') == 'en-reve-color-full-input-bindings' and bindings.get('schemaVersion') == 1,
           'Unexpected full-color input bindings')
    execution_root = Path(bindings['executingRoot']).resolve(strict=True)
    expect(execution_root == ROOT.resolve(), 'Analyzer must execute from the bound acquisition source')
    prepared = {}
    receipts = {}
    for name in ('production', 'controlled'):
        item = bindings[name]
        path = Path(item['path']).resolve(strict=True)
        manifest = capture.object(path / 'manifest.json', item['sha256'])
        expect(manifest == item['identity'], 'Embedded preparation differs: ' + name)
        prepared[name], _, receipts[name] = helpers.verify_prepared(path, item['sha256'], executing_root=ROOT)
        capture.protected.add(path)
    for subject in ('reference', 'candidate'):
        production = prepared['production']['sources'][subject]
        controlled = prepared['controlled']['sources'][subject]
        for key in ('git', 'sealSha256', 'sourceSha256', 'rootLockSha256', 'performanceLockSha256'):
            expect(production[key] == controlled[key], 'Controlled preparation uses different source/lock: ' + subject + '/' + key)
    expect(Path(bindings['production']['path']).resolve() != Path(bindings['controlled']['path']).resolve(),
           'Controlled and production preparations must be separate')
    expect(get(prepared['production'], 'build.colorControls.enabled') is False,
           'Production preparation must explicitly exclude the color control bridge')
    expect(get(prepared['controlled'], 'build.colorControls.enabled') is True,
           'Controlled preparation must explicitly declare the color control bridge')
    expect(get(prepared['controlled'], 'build.colorControls.revision') == 'composable-chat-native-registry-control-v1',
           'Unknown controlled bridge revision')
    expect(prepared['production']['harness'] == prepared['controlled']['harness'], 'Controlled harness changed')
    expect(REQUIRED_SUPPORT <= {item['path'] for item in prepared['production']['harness']['files']},
           'Frozen gates/analyzer/helper missing from complete prepared harness')
    for arm in ('reference', 'candidate'):
        for name in ('production', 'controlled'):
            receipt = receipts[name][arm]
            arm_root = Path(bindings[name]['path']) / arm
            runtime_declaration = receipt['ssr']
            runtime_receipt = capture.object(helpers.within(Path(bindings[name]['path']), runtime_declaration['runtimeReceipt']),
                                             runtime_declaration['runtimeReceiptSha256'])
            expect(digest(runtime_receipt['files']) == runtime_receipt['sha256'], 'Prepared runtime self-seal differs')
            expect(runtime_receipt['exclusions'] == ['.cache', '.bin', '.vite', '.vite-temp', '@en-reve/docs'],
                   'Unknown prepared runtime exclusions')
            runtime_root = helpers.within(Path(bindings[name]['path']), runtime_receipt['root'])
            helpers.verify_inventory(runtime_root, runtime_receipt['files'], exact=True, exclusions=runtime_receipt['exclusions'])
            expect(runtime_receipt['exactLockSha256'] == prepared[name]['sources'][arm]['rootLockSha256'], 'Prepared runtime root lock changed')
            capture.take(runtime_root / '.package-lock.json', runtime_receipt['installedLockSha256'])
            expect((arm_root / 'node_modules').resolve(strict=True) == runtime_root.resolve(strict=True), 'Prepared runtime link points elsewhere')
            overlays = json.loads(capture.take(arm_root / receipt['overlays'], receipt['overlaysSha256']))
            bridge = [row for row in overlays if row.get('kind') == 'color-native-registry-registration-control']
            expect(len(bridge) == (1 if name == 'controlled' else 0), 'Unexpected controlled color bridge membership')
            for row in bridge:
                for phase, field in [('original', 'originalSha256'), ('executed', 'executedSha256')]:
                    capture.take(helpers.within(arm_root / 'overlays' / phase, row['path']), row[field])
    producer_binding = bindings['producer']
    producer = capture.object(producer_binding['path'], producer_binding['sha256'])
    expect(producer == producer_binding['identity'], 'Embedded producer differs')
    sidecar = capture.object(producer_binding['sidecarPath'], producer_binding['sidecarSha256'])
    expect(sidecar == {'path': 'producer.json', 'sha256': producer_binding['sha256']}, 'Producer sidecar mismatch')
    expect(producer.get('schemaVersion') == 1 and producer.get('kind') == 'en-reve-color-cold-assets'
           and producer.get('status') == 'complete' and producer.get('inputsUnchanged') is True
           and producer.get('outputsReadbackVerified') is True, 'Incomplete or wrong static color producer')
    expect(digest({key: value for key, value in producer.items() if key != 'producerSha256'}) == producer.get('producerSha256'),
           'Producer self-seal mismatch')
    expect(Path(producer['prepared']).resolve() == Path(bindings['production']['path']).resolve(),
           'Static saving must use the original production preparation')
    expect(isinstance(producer.get('inputs'), list) and producer['inputs'], 'Missing producer input fingerprints')
    for item in producer['inputs']:
        value = capture.take(item['path'], item['sha256'])
        expect(len(value) == item['bytes'], 'Producer input size changed')
    for item in producer.get('inputLinks', []):
        path = Path(item['path'])
        expect(str(path.resolve(strict=True)) == item['realpath'], 'Producer input link target changed')
        if 'target' in item:
            expect(path.is_symlink() and os.readlink(path) == item['target'], 'Producer input link changed')
    producer_root = Path(producer_binding['path']).resolve().parent
    outputs = producer.get('outputs')
    expect(isinstance(outputs, list) and len(outputs) == 7 and len({item['path'] for item in outputs}) == 7, 'Missing/duplicate producer output inventory')
    for item in outputs:
        expect((item.get('type') == 'symlink') == (item['path'] in ('reference/site', 'candidate/site')), 'Unexpected producer output type')
    # These two intentional links leave the producer wrapper for already sealed
    # production sites. Check them lexically; generic source containment remains
    # strict for every ordinary producer file.
    helpers.verify_inventory(producer_root, [*[item for item in outputs if item.get('type') != 'symlink'],
        {'path': 'producer.json', 'sha256': producer_binding['sha256']},
        {'path': 'producer.sha256.json', 'sha256': producer_binding['sidecarSha256']}])
    expect({path.name for path in producer_root.iterdir()} == {'reference', 'candidate', 'optional-assets.json', 'producer.json', 'producer.sha256.json'},
           'Producer wrapper root membership differs')
    expected_leaves = {'reference/receipt.json', 'reference/assets.json', 'reference/site',
                       'candidate/receipt.json', 'candidate/assets.json', 'candidate/site', 'optional-assets.json'}
    expect({item['path'] for item in outputs} == expected_leaves, 'Unexpected producer output membership')
    expect({path.relative_to(producer_root).as_posix() for path in producer_root.iterdir() if path.is_dir() and not path.is_symlink()}
           == {'reference', 'candidate'}, 'Producer output gained an unexpected directory')
    for arm in ('reference', 'candidate'):
        link = producer_root / arm / 'site'
        declared_link = next(item for item in outputs if item['path'] == arm + '/site')
        expect(declared_link.get('type') == 'symlink' and declared_link.get('target') == os.readlink(link)
               and declared_link.get('sha256') == hashlib.sha256(os.readlink(link).encode()).hexdigest(), 'Producer link self-seal differs')
        expect({path.name for path in (producer_root / arm).iterdir()} == {'receipt.json', 'assets.json', 'site'},
               'Producer arm gained files or empty directories')
        expect((producer_root / arm / 'site').is_symlink() and os.path.isabs(os.readlink(producer_root / arm / 'site'))
               and (producer_root / arm / 'site').resolve(strict=True) == (Path(bindings['production']['path']) / arm / 'site').resolve(strict=True),
               'Producer site must retain its exact absolute production link')

    cold_binding = bindings['cold']
    cold = capture.object(cold_binding['path'], cold_binding['sha256'])
    raw = capture.take(cold_binding['rawPath'], cold_binding['rawSha256'])
    expect(cold == cold_binding['identity'] and cold.get('kind') == 'composable-chat-matched-cold-color-diagnostic',
           'Wrong original cold diagnostic')
    cold_rows = [read_object(line, 'Cold original raw') for line in raw.splitlines() if line.strip()]
    validate_cold_records(cold, cold_rows)
    starts = [row for row in cold_rows if row.get('event') == 'started']
    terminals = [{key: value for key, value in row.items() if key != 'event'}
                 for row in cold_rows if row.get('event') == 'terminal']
    expect(len(cold_rows) == 120 and len(starts) == len(terminals) == 60 and terminals == cold.get('attempts'),
           'Original cold raw and summary attempts differ')
    for start, terminal in zip(starts, terminals):
        expect(all(start.get(key) == terminal.get(key) for key in ('block', 'arm', 'ordinal')) and terminal.get('status') == 'pass',
               'Original cold lifecycle mismatch')
    candidate_source = prepared['production']['sources']['candidate']
    expect(cold.get('runnerSourceCommit') == candidate_source['git']['head']
           and cold.get('runnerSourceTree') == candidate_source['git']['tree'] and cold.get('runnerWorkingStatus') == '',
           'Original cold diagnostic uses a different or dirty source')
    expect(cold.get('coldProducerPath') == producer_binding['path']
           and get(cold, 'coldInputsBefore', {}).get(producer_binding['path']) == producer_binding['sha256']
           and cold.get('coldInputsBefore') == cold.get('coldInputsAfter'), 'Original cold producer fingerprints changed')
    expect(cold.get('coldProducer') == producer, 'Cold diagnostic and full matrix use different producer')
    expect(cold.get('coldAssets') == producer['arms']['candidate']['optionalUnique'], 'Original cold optional assets differ')
    for field in ('sourceUnchanged', 'supportUnchanged', 'coldInputsUnchanged', 'sitesUnchanged', 'browserUnchanged'):
        expect(cold.get(field) is True, 'Original cold final verification missing: ' + field)
    for group in ('source', 'support'):
        expect(cold.get(group + 'Before') == cold.get(group + 'After'), 'Original cold input identities differ: ' + group)
        expect(isinstance(cold.get(group + 'Before'), dict) and cold[group + 'Before'], 'Missing original cold identity: ' + group)
        for path, expected in cold[group + 'Before'].items():
            capture.take(path, expected)
    capture.take(cold['browser']['executable'], cold['browser']['executableSha256'])
    expect(cold.get('sitesBefore') == cold.get('sitesAfter'), 'Original cold frozen sites changed')
    for arm in ('reference', 'candidate'):
        site = cold['sitesBefore'][arm]
        expect(site.get('matchesFrozenInventory') is True and site['inventory'] == receipts['production'][arm]['assets']
               and site['receipt'] == receipts['production'][arm], 'Original cold site differs from production preparation')
    summary = cold.get('summary')
    expect(isinstance(summary, dict) and summary.get('valid') is True and summary.get('completePairs') == 30
           and summary.get('notRun') == 0 and summary.get('failedOrAborted') == 0,
           'Full matrix requires the complete valid original cold diagnostic')
    expect(numeric(summary.get('primaryDifferenceOfArmMediansMs')),
           'Missing original cold comparison')
    expect(summary['primaryDifferenceOfArmMediansMs'] <= 50 and numeric(get(summary, 'uncertainty.upperMs'))
           and summary['uncertainty']['upperMs'] <= 50, 'Original cold diagnostic did not qualify')
    harness = bindings['harness']
    expect(digest(harness['files']) == harness['sha256'], 'Harness inventory seal mismatch')
    names = {item['path'] for item in harness['files']}
    expect('probes/lazy-delivery-color/full-analyze.py' in names and all(name.startswith('probes/lazy-delivery-color/') for name in names), 'Missing or unexpected color harness binding')
    helpers.verify_inventory(ROOT, harness['files'])
    local_harness = [{**item, 'path': item['path'].removeprefix('probes/lazy-delivery-color/')} for item in harness['files']]
    helpers.verify_inventory(ROOT / 'probes/lazy-delivery-color', local_harness, exact=True)
    candidate_root = Path(prepared['production']['sources']['candidate']['snapshot']) / 'source'
    helpers.verify_inventory(candidate_root, harness['files'])
    helpers.verify_inventory(candidate_root / 'probes/lazy-delivery-color', local_harness, exact=True)
    helpers.verify_runtime(ROOT, bindings['runtime'])
    helpers.verify_installation(ROOT, bindings['installation'], prepared['production']['sources']['candidate']['rootLockSha256'])
    return producer, prepared, receipts



def verify_siblings(timing, retention):
    for name in ('executingRoot', 'production', 'controlled', 'producer', 'cold', 'harness'):
        expect(timing.get(name) == retention.get(name), 'Timing/retention immutable binding differs: ' + name)
    # Retention deliberately observes only Chromium. Its complete distribution
    # must be an exact subset of the timing runtime, not a fabricated equal hash.
    for name, value in retention['runtime']['files'].items():
        expect(timing['runtime']['files'].get(name) == value, 'Retention runtime differs: ' + name)
    for name in ('lockSha256', 'installedLockSha256', 'packages'):
        expect(timing['installation'].get(name) == retention['installation'].get(name),
               'Timing/retention acquisition installation differs: ' + name)


def load_run(capture, path, kind):
    path = Path(path).resolve(strict=True)
    capture.protected.add(path)
    manifest_bytes = capture.take(path / 'manifest.json')
    summary_bytes = capture.take(path / 'summary.json')
    raw_bytes = capture.take(path / 'samples.jsonl')
    manifest = read_object(manifest_bytes, 'Acquisition manifest')
    summary = read_object(summary_bytes, 'Acquisition summary')
    protect_bindings(capture, manifest.get('inputBindings'))
    expect(manifest.get('schemaVersion') == 1 and manifest.get('kind') == kind and manifest.get('route') == ROUTE,
           'Wrong acquisition schema/kind/route')
    expect(summary.get('schemaVersion') == 1 and summary.get('kind') == kind, 'Wrong summary schema/kind')
    expect(summary.get('manifestSha256') == digest(manifest_bytes), 'Summary manifest fingerprint differs')
    expect(summary.get('samplesSha256') == digest(raw_bytes), 'Summary raw fingerprint differs')
    expect(summary.get('status') in ('complete', 'incomplete', 'aborted'), 'Unknown completion status')
    expect(get(summary, 'verification.unchanged') is True, 'Before/after source/runtime verification failed')
    identity = digest(manifest['inputBindings'])
    expect(get(summary, 'verification.before') == identity, 'Initial identity fingerprint differs')
    verification = get(summary, 'verification.after')
    expect(isinstance(verification, dict) and verification.get('verified') is True
           and verification.get('identitySha256') == identity, 'Incomplete final identity verification')
    jobs = manifest.get('jobs')
    expect(isinstance(jobs, list) and jobs and all(isinstance(job, dict) for job in jobs), 'Missing planned jobs')
    by_id = {job['id']: job for job in jobs}
    expect(len(by_id) == len(jobs), 'Duplicate planned job IDs')
    raw, terminals, starts, plans, checkpoints = [], {}, Counter(), Counter(), defaultdict(list)
    campaign_events = []
    for number, line in enumerate(raw_bytes.splitlines(), 1):
        if not line.strip():
            continue
        row = read_object(line, 'Raw line ' + str(number))
        raw.append(row)
        job = row.get('job')
        if row.get('status') in ('signal', 'campaign-error'):
            campaign_events.append(row)
            expect(job is None or isinstance(job, dict) and job.get('id') in by_id and job == by_id[job['id']], 'Signal refers to an unplanned job')
            continue
        expect(isinstance(job, dict) and job.get('id') in by_id and job == by_id[job['id']],
               'Raw job differs from the immutable planned job')
        status = row.get('status')
        expect(status in (*TERMINAL, 'planned', 'started', 'checkpoint'), 'Unknown raw lifecycle status')
        if status == 'planned':
            plans[job['id']] += 1
            expect(plans[job['id']] == 1 and not starts[job['id']] and job['id'] not in terminals, 'Duplicate/out-of-order planned row')
        elif status == 'started':
            starts[job['id']] += 1
            expect(starts[job['id']] == 1 and job['id'] not in terminals, 'Duplicate/out-of-order start')
        elif status == 'checkpoint':
            expect(kind.endswith('-retention') and starts[job['id']] == 1 and job['id'] not in terminals, 'Orphan or misplaced retention checkpoint')
            expect(isinstance(row.get('checkpoint'), dict), 'Malformed retention checkpoint')
            checkpoints[job['id']].append(row['checkpoint'])
        else:
            expect(job['id'] not in terminals, 'Duplicate terminal job; no replacement samples')
            expect(status == 'not-run' or starts[job['id']] == 1, 'Executed job lacks its original start')
            expect(status != 'not-run' or starts[job['id']] == 0, 'Started job cannot be marked not-run')
            if kind.endswith('-retention'):
                expect(checkpoints[job['id']] == row.get('checkpoints', []), 'Terminal retention checkpoints differ from raw events')
            terminals[job['id']] = row
    expect(set(terminals) == set(by_id), 'Every planned job needs one retained terminal result')
    counts = Counter(row['status'] for row in terminals.values())
    for key, value in {'planned': len(jobs), 'succeeded': counts['ok'], 'failed': counts['failed'],
                       'aborted': counts['aborted'], 'notRun': counts['not-run']}.items():
        expect(summary.get(key) == value, 'Summary terminal count differs: ' + key)
    expect(summary['status'] != 'complete' or counts['ok'] == len(jobs) and not summary.get('errors') and not campaign_events, 'Complete acquisition has failed/unstarted jobs or errors')
    prewarm = None
    if summary.get('serverPrewarmSha256') is not None:
        prewarm = json.loads(capture.take(path / 'server-prewarm.json', summary['serverPrewarmSha256']))
    expect(summary['status'] != 'complete' or prewarm is not None, 'Complete acquisition lacks bound server prewarm')
    return {'path': str(path), 'manifest': manifest, 'summary': summary, 'raw': raw, 'serverPrewarm': prewarm,
            'rows': list(terminals.values()), 'campaignEvents': campaign_events, 'counts': dict(counts), 'inputBindingsSha256': identity,
            'files': {name: digest(value) for name, value in [('manifest.json', manifest_bytes),
                      ('summary.json', summary_bytes), ('samples.jsonl', raw_bytes)]} |
                     ({'server-prewarm.json': summary['serverPrewarmSha256']} if prewarm is not None else {})}


def expected_timing_keys(n):
    return {(browser, profile, source, policy, action, arm, block)
            for browser, profile in CONFIGS
            for source, policies in [('production', (*ACTIVE, *INACTIVE)), ('controlled', ('same-code',))]
            for policy in policies
            for action in (('none',) if policy in INACTIVE else ('keyboard', 'pointer'))
            for arm in ('reference', 'candidate') for block in range(n)}


def key(job):
    return tuple(job[name] for name in ('browser', 'profile', 'sourceKind', 'policy', 'input', 'arm', 'block'))



OPTIONAL_TAGS = ('en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs')
OWNER_PREDICATES = ('documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument',
                    'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup')
OWNER_FIELDS = ('actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource', *OWNER_PREDICATES)


def validate_owner(value, expected=None):
    """Mirror recorded native capability and the actual document/registry owner."""
    expect(isinstance(value, dict), 'Missing actual owner receipt')
    actual = value.get('actualRegistry')
    expect(actual in ('global', 'scoped', 'unavailable'), 'Null, undefined or unknown actual registry owner')
    native = actual != 'unavailable'
    expect(value.get('nativeAssociationAvailable') is native, 'Native registry capability contradicts actual owner')
    source = 'native-root-association' if native else 'document-global-api-unavailable'
    expect(value.get('definitionRegistrySource') == source, 'Definition registry source contradicts native capability')
    expect(all(value.get(name) is True for name in OWNER_PREDICATES), 'Actual document/constructor/registry owner predicate failed')
    result = {name: value[name] for name in OWNER_FIELDS}
    if expected is not None:
        expect(result == expected, 'Actual owner changed during the recorded lifecycle')
    return result


def validate_row_owner(row):
    before = validate_owner(get(row, 'ownership.before'))
    validate_owner(get(row, 'ownership.after'), before)
    expect(get(row, 'ownership.unchanged') is True and row.get('actualRegistry') == before['actualRegistry'],
           'Terminal owner summary differs from exact before/after ownership')
    return before


def validate_optional_ownership(operation, owner):
    """Qualify the untimed post-endpoint constructor receipt, never extend time."""
    receipt = operation.get('optionalOwnership')
    expect(isinstance(receipt, dict) and receipt.get('valid') is True, 'Missing/failed optional constructor ownership receipt')
    expect(receipt.get('phase') == 'after-frozen-ready-endpoint' and numeric(receipt.get('checkedAt'))
           and receipt['checkedAt'] >= operation['end'], 'Optional constructor qualification preceded the frozen timing endpoint')
    for name in ('actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource', 'registryIdentityMatchesStartup'):
        expect(receipt.get(name) == owner[name] and type(receipt.get(name)) is type(owner[name]),
               'Optional constructor receipt names a different actual owner: ' + name)
    expect(receipt.get('nativeAssociationQualification') == ('verified' if owner['nativeAssociationAvailable'] else 'unsupported'),
           'Optional native affiliation qualification contradicts capability')
    expect(all(get(receipt, 'retainedEditorIdentity.' + name) is True for name in ('editorSame', 'rootSame', 'textboxSame')),
           'Optional construction replaced the original editor/root/textbox')
    entries = receipt.get('entries')
    expect(isinstance(entries, list) and entries and type(receipt.get('checkedElementCount')) is int
           and receipt['checkedElementCount'] == len(entries), 'Optional constructor entry count mismatch')
    counts = dict.fromkeys(OPTIONAL_TAGS, 0)
    predicates = ('connected', 'ownerDocumentMatches', 'constructorMatchesDefinitionRegistry', 'renderRootPresent',
                  'renderRootIsNativeShadow', 'renderRootIsLitRoot', 'renderRootHostMatches',
                  'renderRootDocumentMatches', 'containerDocumentMatches', 'valid')
    expected_association = owner['actualRegistry'] if owner['nativeAssociationAvailable'] else 'global'
    for index, entry in enumerate(entries):
        expect(isinstance(entry, dict) and type(entry.get('index')) is int and entry['index'] == index
               and isinstance(entry.get('tag'), str) and entry['tag'].startswith('en-'), 'Malformed optional constructor entry')
        optional = entry['tag'] in OPTIONAL_TAGS
        expect(entry.get('declaredOptionalRoot') is optional, 'Optional root declaration does not match actual tag')
        expect(all(entry.get(name) is True for name in predicates), 'An optional element failed exact constructor/document/render-root ownership')
        for name in ('hostAssociation', 'containerAssociation', 'renderRootAssociation'):
            association = entry.get(name)
            expect(isinstance(association, dict) and type(association.get('available')) is bool,
                   'Missing explicit native affiliation capability: ' + name)
            if association['available']:
                expect(association.get('matchesOwner') is True and association.get('actualRegistry') == expected_association,
                       'Available native affiliation belongs to another owner: ' + name)
            else:
                expect(association.get('actualRegistry') == 'unavailable' and association.get('matchesOwner') is None,
                       'Unavailable native affiliation was relabeled as observed ownership')
            if name == 'renderRootAssociation' and owner['nativeAssociationAvailable']:
                expect(association['available'], 'Native render-root affiliation missing for optional element')
        if optional:
            counts[entry['tag']] += 1
    observed = receipt.get('tagCounts')
    expect(isinstance(observed, dict) and set(observed) == set(OPTIONAL_TAGS)
           and all(type(value) is int and value > 0 for value in observed.values()) and observed == counts,
           'Required optional roots are absent or constructor counts disagree')


def validate_readiness(row, inactive, owner):
    startup = row.get('startup') or {}
    expect(startup.get('state') == 'ready' and startup.get('beforeInputSetup') is True,
           'Missing untouched complete essential readiness')
    for phase, operation in [('startup', startup), *([] if inactive else [('first', row.get('first') or {}), ('repeat', row.get('repeat') or {})])]:
        expect(numeric(operation.get('start')) and numeric(operation.get('end')) and operation['end'] >= operation['start'],
               'Invalid original readiness clocks: ' + phase)
        duration = operation['end'] - operation['start']
        expect(nonnegative(operation.get('durationMs')) and operation['durationMs'] == duration
               and operation.get('readyMs', duration) == duration, 'Original readiness duration differs: ' + phase)
        metric = {'startup': 'startupReadyMs', 'first': 'firstReadyMs', 'repeat': 'repeatReadyMs'}[phase]
        expect(row['metrics'][metric] == duration, 'Readiness metric differs from original operation: ' + phase)
        if phase != 'startup':
            expect(operation.get('state') == 'ready' and operation.get('trusted') is True,
                   'Action lacks trusted complete readiness: ' + phase)
            validate_optional_ownership(operation, owner)
    if inactive:
        expect(row.get('first') is None and row.get('repeat') is None, 'Inactive policy unexpectedly activated controls')
    if row['job']['policy'] == 'prepared':
        prep = row.get('preparation') or {}
        expect(numeric(prep.get('start')) and prep.get('activationAt') == row['first']['start']
               and prep.get('actualLeadMs') == row['first']['start'] - prep['start'], 'Prepared lead differs from original operation clocks')


def validate_timing(run):
    manifest = run['manifest']
    n = manifest.get('n')
    expect(type(n) is int and n >= 1, 'Invalid fixed sample count')
    for job in manifest['jobs']:
        expected_viewport = {'width': 390, 'height': 844} if job['profile'] == 'phone' else {'width': 1280, 'height': 900}
        expected_pointer = ('touch' if job['profile'] == 'phone' else 'mouse') if job['input'] == 'pointer' else None
        expect(job.get('viewport') == expected_viewport and job.get('pointerType') == expected_pointer
               and job.get('pairGroup') == job['sourceKind'], 'Actual viewport/input/control axis differs from frozen matrix')
    keys = [key(job) for job in manifest['jobs']]
    expect(len(keys) == len(set(keys)) and set(keys) == expected_timing_keys(n), 'Timing matrix is incomplete, duplicated or changed')
    for row in run['rows']:
        if row['status'] != 'ok':
            continue
        job = row['job']
        expect(job.get('requestedRegistry') == 'production-default', 'Unexpected requested registry')
        owner = validate_row_owner(row)
        for metric in ('startupReadyMs', 'startupGzipBytes'):
            expect(nonnegative(get(row, 'metrics.' + metric)), 'Invalid successful metric: ' + metric)
        inactive = job['policy'] in INACTIVE
        validate_readiness(row, inactive, owner)
        for metric in ('firstReadyMs', 'repeatReadyMs'):
            expect(get(row, 'metrics.' + metric) is None if inactive else nonnegative(get(row, 'metrics.' + metric)),
                   'Invalid inactive/active action metric: ' + metric)
        if inactive:
            expect(nonnegative(get(row, 'metrics.unusedGzipBytes')), 'Missing complete unused/preparation delivery cost')
        expect(get(row, 'snapshots.beforePolicy.traffic.gzipBytes') == row['metrics']['startupGzipBytes'],
               'Startup metric differs from original pre-policy traffic')
        if inactive:
            expect(get(row, 'snapshots.final.traffic.gzipBytes') == row['metrics']['unusedGzipBytes'],
                   'Unused metric must include final preparation delivery')
        if job['arm'] == 'candidate' and job['policy'] == 'prepared':
            expect(numeric(get(row, 'preparation.actualLeadMs')) and row['preparation']['actualLeadMs'] >= 250,
                   'Prepared activation lacks frozen 250ms actual lead')
        expect(not row.get('errors') and not row.get('failures'), 'Successful row contains browser failures')
        if job['policy'] in ('prepared', 'immediate', 'prepared-unused', 'abandoned'):
            expect(get(row, 'preparation.verified') is True, 'Preparation completion unverified')
        if job['arm'] == 'candidate' and job['policy'] == 'immediate' and job['profile'] == 'constrained':
            expect(get(row, 'preparation.preparationPendingAtActivation') is True, 'Immediate constrained action was not pending at activation')
    return n



def verify_traffic(run, receipts):
    """Recompute attribution and wire counters from original observations."""
    for row in run['rows']:
        if row['status'] != 'ok':
            continue
        job = row['job']
        inventory = {item['path']: item for item in receipts[job['sourceKind']][job['arm']]['assets']}
        server = next(item for item in run['serverPrewarm'] if item['key'] == job['sourceKind'] + '/' + job['arm'])
        origin = urlsplit(server['url'])
        for label, snapshot in row['snapshots'].items():
            traffic = snapshot.get('traffic')
            expect(isinstance(traffic, dict) and isinstance(traffic.get('resources'), list) and traffic['resources'],
                   'Missing observed executable traffic: ' + label)
            selected = {}
            observed = []
            for resource in snapshot['resources']:
                parsed = urlsplit(resource['name'])
                if parsed.path.endswith(('.js', '.mjs')):
                    expect((parsed.scheme, parsed.netloc) == (origin.scheme, origin.netloc), 'External executable resource in actual route')
                    path = unquote(parsed.path).lstrip('/')
                    expect(path in inventory, 'Observed executable absent from sealed arm: ' + path)
                    asset = inventory[path]
                    for metric in ('decodedBodySize', 'encodedBodySize', 'transferSize', 'startTime', 'responseEnd'):
                        expect(nonnegative(resource.get(metric)), 'Negative/missing raw traffic counter: ' + metric)
                    expect(resource.get('nextHopProtocol') == 'h2', 'Observed executable is not HTTP/2')
                    selected[path] = asset
                    observed.append({**resource, 'path': path, 'frozenFileSha256': asset['sha256']})
            expect(traffic['resources'] == observed, 'Attributed resource rows differ from original observation')
            assets = sorted(selected.values(), key=lambda item: item['path'])
            expect(traffic.get('assets') == assets, 'Observed asset attribution differs from exact production/control receipt')
            expected = {'requests': len(observed), 'uniqueRequests': len(assets),
                        'gzipBytes': sum(item['gzipBytes'] for item in assets), 'rawBytes': sum(item['bytes'] for item in assets),
                        'decodedBodyBytes': sum(item['decodedBodySize'] for item in observed),
                        'encodedBodyBytes': sum(item['encodedBodySize'] for item in observed),
                        'transferBytes': sum(item['transferSize'] for item in observed)}
            for metric, value in expected.items():
                expect(nonnegative(traffic.get(metric)) and traffic[metric] == value,
                       'Original traffic total differs: ' + label + '/' + metric)


def quantile(values, fraction):
    if not values:
        return None
    values = sorted(values)
    index = (len(values) - 1) * fraction
    lo, hi = math.floor(index), math.ceil(index)
    return values[lo] + (values[hi] - values[lo]) * (index - lo)


def describe(values):
    return {'n': len(values), 'median': quantile(values, .5), 'p75': quantile(values, .75),
            'min': min(values) if values else None, 'max': max(values) if values else None,
            'p95': quantile(values, .95) if len(values) >= 100 else None}


def compare(pairs, repetitions=10000):
    before, after = [x[0] for x in pairs], [x[1] for x in pairs]
    difference = quantile(after, .5) - quantile(before, .5) if pairs else None
    rng = random.Random(digest({'pairs': pairs, 'seed': 20260929}))
    estimates, percentages = [], []
    if len(pairs) >= 30:
        for _ in range(repetitions):
            sampled = [pairs[rng.randrange(len(pairs))] for _ in pairs]
            left = quantile([x[0] for x in sampled], .5)
            delta = quantile([x[1] for x in sampled], .5) - left
            estimates.append(delta)
            percentages.append(delta / left if left > 0 else None)
    return {'n': len(pairs), 'reference': describe(before), 'candidate': describe(after),
            'differenceOfMedians': difference,
            'supportingPairedDifferences': describe([right - left for left, right in pairs]),
            'pairedBootstrap95': [quantile(estimates, .025), quantile(estimates, .975)] if estimates else None,
            'upper95': quantile(estimates, .975) if estimates else None,
            'fractionOfReferenceMedian': difference / quantile(before, .5) if before and quantile(before, .5) > 0 else None,
            'fractionUpper95': quantile(percentages, .975) if percentages and all(numeric(x) for x in percentages) else None}



def timing_limit(profile, metric):
    expect(profile in ('desktop', 'phone', 'constrained'), 'Unknown timing profile')
    expect(metric in ('startupReadyMs', 'firstReadyMs', 'repeatReadyMs', 'unusedGzipBytes'), 'Unknown measured gate metric')
    return (4096 if metric == 'unusedGzipBytes' else (10 if profile == 'constrained' else 4)
            if metric == 'repeatReadyMs' else (50 if profile == 'constrained' else 16))


def verify_launch_and_prewarm(run):
    bindings = run['manifest']['inputBindings']
    executables = run['manifest'].get('launchExecutables')
    engines = {'chromium', 'firefox', 'webkit'} if run['manifest']['kind'].endswith('-timing') else {'chromium'}
    expect(isinstance(executables, dict) and set(executables) == engines, 'Incomplete explicit browser launch matrix')
    for value in executables.values():
        canonical = Path(value['executablePath']).resolve(strict=True)
        expect(str(canonical) == value['canonical'], 'Explicit browser launch resolves elsewhere')
        name = os.path.relpath(canonical, bindings['executingRoot'])
        expect(get(bindings, 'runtime.files', {}).get(name, {}).get('digest') == value['sha256'], 'Explicit browser executable not in complete runtime binding')
    prewarm = run.get('serverPrewarm')
    if prewarm is None:
        expect(run['summary']['status'] != 'complete', 'Complete acquisition omitted original prewarm')
        return
    expect(isinstance(prewarm, list) and len(prewarm) == 4, 'Expected all four separate prewarmed sites')
    expected = {source + '/' + arm for source in ('production', 'controlled') for arm in ('reference', 'candidate')}
    expect({row.get('key') for row in prewarm} == expected, 'Prewarm server ownership is missing/duplicated')
    for row in prewarm:
        value = row.get('prewarm') or {}
        expect(value.get('path') == ROUTE and value.get('protocol') == 'h2' and value.get('encoding') == 'gzip'
               and nonnegative(value.get('bytes')) and value['bytes'] > 0 and isinstance(value.get('sha256'), str)
               and len(value['sha256']) == 64, 'Incomplete full-body production document prewarm')
        url = urlsplit(row['url'])
        expect(url.scheme == 'https' and url.hostname in ('127.0.0.1', 'localhost', '::1') and url.port, 'Unexpected measured server origin')
    for row in run['rows']:
        if row['status'] == 'ok':
            expect(row.get('browserExecutable') == executables[row['job']['browser']], 'Actual row did not use the bound explicit executable')


def timing_analysis(run, repetitions):
    n = validate_timing(run)
    grouped = defaultdict(dict)
    for row in run['rows']:
        job = row['job']
        grouped[key(job)[:5]][(job['arm'], job['block'])] = row
    cells, gates, assumptions = [], [], []
    for context, rows in sorted(grouped.items()):
        browser, profile, source, policy, action = context
        label = dict(zip(('browser', 'profile', 'sourceKind', 'policy', 'input'), context))
        pairs = []
        for block in range(n):
            left, right = rows[('reference', block)], rows[('candidate', block)]
            if left['status'] == right['status'] == 'ok':
                expect(left['actualRegistry'] == right['actualRegistry'], 'Matched arms use different actual registries')
                pairs.append((left, right))
        complete = len(pairs) == n and n >= 30 and run['summary']['status'] == 'complete' and run['manifest'].get('qualification') is not True
        cell = {**label, 'plannedPairs': n, 'completePairs': len(pairs), 'complete': complete,
                'actualRegistries': sorted({row['actualRegistry'] for pair in pairs for row in pair}), 'metrics': {}}
        metrics = ['startupReadyMs'] + (['unusedGzipBytes'] if policy in INACTIVE else ['firstReadyMs', 'repeatReadyMs'])
        for metric in metrics:
            comparator = 'startupGzipBytes' if metric == 'unusedGzipBytes' else metric
            result = compare(tuple((left['metrics'][comparator], right['metrics'][metric]) for left, right in pairs), repetitions)
            result['referenceMetric'] = comparator
            cell['metrics'][metric] = result
            ceiling = timing_limit(profile, metric)
            point = result['differenceOfMedians']
            point_pass = numeric(point) and point <= ceiling
            uncertainty_pass = numeric(result['upper95']) and result['upper95'] <= ceiling
            gate = {**label, 'metric': metric, 'comparison': 'candidate-minus-reference', 'limit': ceiling,
                    'point': point, 'upper95': result['upper95'], 'empiricalPass': point_pass,
                    'uncertaintyQualified': uncertainty_pass, 'complete': complete,
                    'pass': complete and point_pass and uncertainty_pass}
            gates.append(gate)
        if source == 'production':
            # Observed startup includes the whole route and preparation has not
            # begun. Saving minima are negative cost ceilings with the same
            # paired median/upper-bound rule, never new per-block thresholds.
            result = compare(tuple((left['metrics']['startupGzipBytes'], right['metrics']['startupGzipBytes'])
                                   for left, right in pairs), repetitions)
            cell['metrics']['observedStartupGzipBytes'] = result
            for metric, point, upper, limit in (
                    ('observedStartupGzipBytes', result['differenceOfMedians'], result['upper95'], -4096),
                    ('observedStartupGzipFraction', result['fractionOfReferenceMedian'], result['fractionUpper95'], -.10)):
                gates.append({**label, 'metric': metric, 'comparison': 'candidate-minus-reference', 'limit': limit,
                              'point': point, 'upper95': upper, 'empiricalPass': numeric(point) and point <= limit,
                              'uncertaintyQualified': numeric(upper) and upper <= limit, 'complete': complete,
                              'pass': complete and numeric(point) and point <= limit and numeric(upper) and upper <= limit})
        if policy in (*ACTIVE, 'same-code'):
            # This explicitly defined median index is descriptive, not expected
            # session duration or a population expectation.
            for usage in (0, .25, .5, 1):
                left_start = quantile([left['metrics']['startupReadyMs'] for left, _ in pairs], .5)
                right_start = quantile([right['metrics']['startupReadyMs'] for _, right in pairs], .5)
                left_first = quantile([left['metrics']['firstReadyMs'] for left, _ in pairs], .5)
                right_first = quantile([right['metrics']['firstReadyMs'] for _, right in pairs], .5)
                before = left_start + usage * left_first if pairs else None
                after = right_start + usage * right_first if pairs else None
                assumptions.append({**label, 'usageFraction': usage, 'basis': 'Frozen assumption, not telemetry',
                    'n': len(pairs), 'referenceMedianIndexMs': before, 'candidateMedianIndexMs': after,
                    'medianIndexChangeMs': after - before if pairs else None,
                    'claim': 'J(u)=median(startup)+u*median(first-ready); descriptive index, not expected session duration; cannot rescue any gate'})
        cells.append(cell)
    preparation = [{**row['job'], 'status': row['status'], 'preparation': row.get('preparation'),
                    'phases': row.get('phases'), 'snapshots': row.get('snapshots')} for row in run['rows']]
    return {'cells': cells, 'gates': gates, 'scenario': assumptions, 'preparationAndTraffic': preparation,
            'qualified': bool(gates) and all(row['pass'] for row in gates)}


def static_analysis(producer):
    eligibility = producer['eligibility']
    reference, candidate = eligibility['referenceStartup'], eligibility['candidateStartup']
    for arm in (reference, candidate):
        expect(all(nonnegative(arm.get(name)) for name in ('files', 'rawBytes', 'gzipBytes')), 'Invalid static startup totals')
    expect(reference['gzipBytes'] > 0, 'Reference full route gzip denominator is empty')
    saving = reference['gzipBytes'] - candidate['gzipBytes']
    fraction = saving / reference['gzipBytes']
    expect(saving == eligibility['matchedSavingBytes'] and fraction == eligibility['matchedSavingFraction'], 'Static producer arithmetic differs')
    expect(get(eligibility, 'gatePlan.minimumMatchedStartupGzipSavingBytes') == 4096
           and get(eligibility, 'gatePlan.minimumMatchedStartupGzipSavingFraction') == .10, 'Frozen static gates changed')
    return {'reference': reference, 'candidate': candidate, 'savingBytes': saving, 'savingFraction': fraction,
            'gates': [{'metric': 'full-route-startup-gzip-saving', 'point': saving, 'minimum': 4096, 'pass': saving >= 4096},
                      {'metric': 'full-route-startup-gzip-saving-fraction', 'point': fraction, 'minimum': .10, 'pass': fraction >= .10}],
            'qualified': saving >= 4096 and fraction >= .10 and eligibility.get('coldProbeApplicable') is True,
            'claim': 'Production emitted per-file gzip-6 attribution. Controlled bridge assets never enter this benefit.'}


def retention_analysis(run):
    manifest = run['manifest']
    qualification = manifest.get('qualification') is True
    repetitions, cycles = (1, 2) if qualification else (5, 100)
    expect(manifest.get('repetitions') == repetitions and manifest.get('cycles') == cycles, 'Retention requires separate fixed 5x100 plan (qualification1x2)')
    combinations = {('production', 'reference', 'eager'), ('production', 'candidate', 'cold'),
                    ('production', 'candidate', 'prepared'), ('controlled', 'reference', 'eager'),
                    ('controlled', 'candidate', 'same-code')}
    expected = {(source, arm, policy, block) for source, arm, policy in combinations for block in range(repetitions)}
    actual = [(j['sourceKind'], j['arm'], j['policy'], j['block']) for j in manifest['jobs']]
    expect(len(actual) == len(set(actual)) and set(actual) == expected, 'Retention matrix differs from 25 fresh contexts')
    rows, growth = [], {}
    for row in run['rows']:
        job = row['job']
        expect(job['browser'] == 'chromium' and job['profile'] == 'desktop', 'Retention counter matrix is Chromium desktop only')
        current = {**job, 'status': row['status'], 'error': row.get('error'), 'completedCycles': row.get('completedCycles'),
                   'checkpoints': row.get('checkpoints'), 'growth': None, 'pass': False,
                   'finalDetached': row.get('finalDetached'), 'finalDetachedUnsupported': row.get('finalDetachedUnsupported')}
        if row['status'] == 'ok':
            expect(row.get('completedCycles') == cycles, 'Successful retention repetition omits cycles')
            points = row.get('checkpoints')
            expect(isinstance(points, list) and [p.get('cycle') for p in points] == ([0, 2] if qualification else [0, 10, 50, 100]), 'Missing/duplicate retention checkpoints')
            owner = validate_row_owner(row)
            expect(not row.get('errors') and not row.get('failures'), 'Successful retention row contains browser errors')
            for point in points:
                validate_owner(point.get('connected'), owner)
                expect(get(point, 'connected.lifecycleCycles') == point['cycle']
                       and all(get(point, 'connected.' + name) is True for name in ('editorSame', 'rootSame', 'textboxSame'))
                       and get(point, 'connected.popupOpen') is False and get(point, 'connected.optionalConstructed') is False
                       and get(point, 'connected.sessionElements') == 0, 'Retention checkpoint lost owner identity or retained an open session')
                expect(all(nonnegative(value) for value in (point.get('heapBytes'), get(point, 'dom.nodes'), get(point, 'dom.jsEventListeners'))),
                       'Unsupported/invalid retention counters are not zero')
                expect(all(nonnegative(get(point, 'connected.' + scope + '.' + field))
                           for scope in ('document', 'component') for field in ('nodes', 'elements', 'shadowRoots')),
                       'Missing/invalid connected census')
            if qualification:
                rows.append(current)
                continue
            before, after = points[1], points[3]
            delta = {'nodes': after['dom']['nodes'] - before['dom']['nodes'],
                     'listeners': after['dom']['jsEventListeners'] - before['dom']['jsEventListeners'],
                     'heapBytes': after['heapBytes'] - before['heapBytes'],
                     'connected': {scope + '.' + field: get(after, 'connected.' + scope + '.' + field) - get(before, 'connected.' + scope + '.' + field)
                                   for scope in ('document', 'component') for field in ('nodes', 'elements', 'shadowRoots')}}
            current.update(growth=delta, actualRegistry=row['actualRegistry'],
                           pass_=delta['nodes'] <= 20 and delta['listeners'] <= 10)
            current['pass'] = current.pop('pass_')
            growth[(job['sourceKind'], job['arm'], job['policy'], job['block'])] = (delta, row['actualRegistry'])
        rows.append(current)
    comparisons = []
    for source, policy in (('production', 'cold'), ('production', 'prepared'), ('controlled', 'same-code')):
        pairs = []
        for block in range(5):
            reference = growth.get((source, 'reference', 'eager', block))
            candidate = growth.get((source, 'candidate', policy, block))
            if reference and candidate:
                expect(reference[1] == candidate[1], 'Retention paired actual registries differ')
                pairs.append({'block': block, 'referenceGrowthBytes': reference[0]['heapBytes'],
                              'candidateGrowthBytes': candidate[0]['heapBytes'],
                              'pairedAdditionalBytes': candidate[0]['heapBytes'] - reference[0]['heapBytes']})
        additional = (statistics.median(p['candidateGrowthBytes'] for p in pairs) -
                      statistics.median(p['referenceGrowthBytes'] for p in pairs)) if len(pairs) == 5 else None
        comparisons.append({'sourceKind': source, 'policy': policy, 'pairs': pairs,
                            'additionalMedianHeapBytes': additional, 'limit': 262144,
                            'pass': len(pairs) == 5 and additional <= 262144})
    complete = run['summary']['status'] == 'complete' and manifest.get('qualification') is not True
    return {'status': run['summary']['status'], 'rows': rows, 'heapComparisons': comparisons,
            'qualified': complete and len(rows) == 25 and all(row['pass'] for row in rows) and all(row['pass'] for row in comparisons),
            'scope': 'Separate Chromium desktop CDP collection; no unsupported counters are replaced with zero. Five fresh contexts per arm, cycle100-minus-cycle10.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True)
    parser.add_argument('--retention', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--bootstrap', type=int, default=10000)
    args = parser.parse_args()
    expect(args.bootstrap == 10000, 'Use the fixed 10,000 paired bootstrap resamples')
    out = Path(args.out).resolve()
    capture = Captured()
    capture.protected.update((Path(args.run).resolve(), Path(args.retention).resolve()))
    capture.guard_output(out)
    result = {'schemaVersion': 1, 'kind': 'composable-chat-color-full-analysis', 'status': 'invalid', 'route': ROUTE,
              'validationErrors': [], 'qualifiedForMeasuredGates': False, 'static': None, 'timing': None, 'retention': None,
              'rolloutAcceptance': 'Not inferred: correctness, physical phone, native OS chooser and assistive-technology/user review remain separate.'}
    runs = {}
    helpers = helper_module()
    try:
        runs['timing'] = load_run(capture, args.run, 'composable-chat-color-full-timing')
        runs['retention'] = load_run(capture, args.retention, 'composable-chat-color-full-retention')
        verify_siblings(runs['timing']['manifest']['inputBindings'], runs['retention']['manifest']['inputBindings'])
        bindings = runs['timing']['manifest']['inputBindings']
        producer, _, receipts = verify_bindings(capture, bindings, helpers)
        verify_bindings(capture, runs['retention']['manifest']['inputBindings'], helpers)
        capture.guard_output(out)
        result['static'] = static_analysis(producer)
        for run in runs.values():
            verify_launch_and_prewarm(run)
        verify_traffic(runs['timing'], receipts)
        result['timing'] = timing_analysis(runs['timing'], args.bootstrap)
        result['retention'] = retention_analysis(runs['retention'])
        complete = all(run['summary']['status'] == 'complete' for run in runs.values())
        qualified = complete and all(result[key]['qualified'] for key in ('static', 'timing', 'retention'))
        result['qualifiedForMeasuredGates'] = qualified
        result['status'] = 'qualified-for-measured-gates' if qualified else 'incomplete' if not complete else 'unqualified'
        # Reverify complete inventories, not just their early manifest hashes.
        verify_bindings(capture, bindings, helpers)
        verify_bindings(capture, runs['retention']['manifest']['inputBindings'], helpers)
    except (OSError, ValueError, KeyError, TypeError, IndexError, StopIteration) as error:
        result['validationErrors'].append(str(error))
        result['status'] = 'invalid'
        result['qualifiedForMeasuredGates'] = False
        for section in ('static', 'timing', 'retention'):
            if result[section] is not None:
                result[section]['qualified'] = False
    result['provenance'] = {name: {key: run[key] for key in ('path', 'files', 'counts', 'inputBindingsSha256')}
                            for name, run in runs.items()}
    result['campaignEvents'] = {name: run['campaignEvents'] for name, run in runs.items()}
    result['acquisitionStatuses'] = {name: run['summary']['status'] for name, run in runs.items()}
    result['failures'] = {name: [row for row in run['rows'] if row['status'] != 'ok'] for name, run in runs.items()}
    result['inputBindings'] = runs.get('timing', {}).get('manifest', {}).get('inputBindings')
    result['protectedRoots'] = sorted(str(path) for path in capture.protected)
    result['rawInputs'] = list(capture.files.values())
    result['uncertainty'] = {'method': 'Paired-block percentile bootstrap of difference of arm medians; 10,000 seeded resamples; central95% interval upper endpoint. No pooling, trimming or replacement.',
        'confidence': .95, 'upperEndpointQuantile': .975, 'resamples': args.bootstrap, 'seed': 20260929,
        'seedMethod': 'Python Random receives SHA256 of ordered numeric pairs plus seed20260929; identical exact records reproduce resampling.',
        'decision': 'Both complete matched median and upper95 must meet every original ceiling. Incomplete/qualification acquisitions cannot pass.',
        'limits': 'Per-cell uncertainty assumes exchangeable paired blocks. No simultaneous coverage or stationarity is established; p95 omitted below100.'}
    capture.guard_output(out)
    capture.recheck()
    out.mkdir()
    payload = (json.dumps(result, indent=2, allow_nan=False) + '\n').encode()
    (out / 'analysis.json').write_bytes(payload)
    (out / 'analysis-receipt.json').write_text(json.dumps({'analysisSha256': digest(payload),
        'analyzerSha256': digest(Path(__file__).read_bytes()), 'inputSha256': {item['path']: item['sha256'] for item in capture.files.values()},
        'status': result['status']}, indent=2) + '\n')
    print(out / 'analysis.json')


if __name__ == '__main__':
    main()
