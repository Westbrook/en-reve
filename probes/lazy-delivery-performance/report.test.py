"""Synthetic report provenance regressions; never performance or browser evidence.

Run only through the validation owner's pinned Python entry point. These tests
exercise presenters as subprocesses against isolated temporary source-bound
receipts. They do not build assets, acquire measurements, or open browsers.
"""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value) + '\n')
    return sha(path)


def inventory(root):
    result = {}
    for path in root.rglob('*'):
        name = str(path.relative_to(root))
        if path.is_symlink():
            result[name] = {'kind': 'symlink', 'target': str(path.readlink())}
        elif path.is_dir():
            result[name] = {'kind': 'directory'}
        else:
            result[name] = {'kind': 'file', 'sha256': sha(path)}
    return result


def asset(root):
    root.mkdir(parents=True, exist_ok=True)
    (root / 'boot.js').write_text('// Synthetic presentation dependency; never run in a browser.\n')
    return [{'path': 'boot.js', 'sha256': sha(root / 'boot.js'), 'bytes': (root / 'boot.js').stat().st_size}]


def packed_fixture(base):
    prepared = base / 'packed'; prepared.mkdir()
    source = base / 'snapshot'; source.mkdir()
    origin = base / 'origin'; origin.mkdir()
    assets = asset(prepared / 'report/site')
    receipt_hash = write_json(prepared / 'report/receipt.json', {'assets': assets})
    manifest = {'status': 'complete', 'sources': {'candidate': {'snapshot': str(source), 'origin': str(origin)}},
                'arms': [], 'reportAssets': {'root': 'report', 'receipt': 'report/receipt.json',
                    'receiptSha256': receipt_hash, 'specifier': '@en-reve/elements/define/table.js', 'entry': 'boot.js', 'assets': assets}}
    write_json(prepared / 'manifest.json', manifest)
    return prepared, source, origin


class ReportMarkup(HTMLParser):
    """Inspect emitted semantics without executing the synthetic asset or JS."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections = {}
        self.links = []
        self.current = None
        self.row = None
        self.direction = False

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'section' and attrs.get('id'):
            self.current = {'rows': [], 'tables': 0, 'direction': '', 'order': []}
            self.sections[attrs['id']] = self.current
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if self.current is None:
            return
        if tag == 'en-table':
            self.current['tables'] += 1
        elif tag == 'tr':
            self.row = []
        elif tag == 'td' and self.row is not None:
            self.row.append(attrs.get('data-value', ''))
        elif tag == 'p' and 'direction' in attrs.get('class', '').split():
            self.direction = True
            self.current['order'].append('direction')

    def handle_endtag(self, tag):
        if self.current is None:
            return
        if tag == 'tr' and self.row is not None:
            if self.row:
                self.current['rows'].append(self.row)
            self.row = None
        elif tag == 'en-table':
            self.current['order'].append('table-end')
        elif tag == 'p':
            self.direction = False
        elif tag == 'section':
            self.current = None
            self.direction = False

    def handle_data(self, text):
        if self.current is not None and self.direction:
            self.current['direction'] += text


def full_color_fixture(base):
    """Populated presentation contract, deliberately unqualified and synthetic."""
    packed, snapshot, origin = packed_fixture(base)
    source = base / 'full-color-inputs'; source.mkdir()
    production = base / 'production-preparation'; production.mkdir()
    controlled = base / 'controlled-preparation'; controlled.mkdir()
    identities = {'sources': {'candidate': {'snapshot': str(snapshot), 'origin': str(origin)}}}
    for root in (production, controlled):
        write_json(root / 'manifest.json', identities)
    raw_files = []
    provenance = {}
    for phase in ('timing', 'retention'):
        directory = source / phase; directory.mkdir()
        write_json(directory / 'manifest.json', {'kind': 'synthetic-' + phase, 'qualification': True})
        write_json(directory / 'summary.json', {'status': 'incomplete', 'qualification': True})
        (directory / 'samples.jsonl').write_bytes((
            '{"status":"started","job":{"id":"synthetic-' + phase + '"}}\n'
            '{"status":"failed","job":{"id":"synthetic-' + phase + '"},"error":"Retained synthetic failure"}\n'
        ).encode())
        write_json(directory / 'server-prewarm.json', [{'key': 'production/reference', 'synthetic': True}])
        names = ('manifest.json', 'summary.json', 'samples.jsonl', 'server-prewarm.json')
        provenance[phase] = {'path': str(directory), 'files': {name: sha(directory / name) for name in names}}
        raw_files.extend(directory / name for name in names)
    producer = source / 'producer.json'
    write_json(producer, {'schemaVersion': 1, 'kind': 'en-reve-color-cold-assets', 'status': 'complete',
                         'prepared': str(production), 'eligibility': {}, 'claim': 'Synthetic fixture, never byte evidence'})
    producer_sidecar = source / 'producer.sha256.json'
    write_json(producer_sidecar, {'path': 'producer.json', 'sha256': sha(producer)})
    cold = source / 'candidate.json'
    write_json(cold, {'schemaVersion': 1, 'kind': 'composable-chat-matched-cold-color-diagnostic',
                     'summary': {'valid': False, 'decision': 'Synthetic fixture; never qualification'}, 'attempts': []})
    cold_raw = source / 'attempts.jsonl'
    cold_raw.write_bytes(b'{"event":"terminal","status":"fail","error":"Retained original synthetic cold failure"}\n')
    raw_files.extend((producer, producer_sidecar, cold, cold_raw))
    raw_files.extend((production / 'manifest.json', controlled / 'manifest.json'))
    cells = []
    for kind, policy, delta in (('production', 'cold', 7), ('controlled', 'same-code', 3)):
        stats = {'n': 30, 'median': 50, 'p75': 55, 'min': 40, 'max': 80, 'p95': None}
        cells.append({'browser': 'chromium', 'profile': 'desktop', 'sourceKind': kind, 'policy': policy, 'input': 'pointer',
                      'plannedPairs': 30, 'completePairs': 30, 'complete': True, 'actualRegistries': ['unavailable'],
                      'metrics': {'firstReadyMs': {'n': 30, 'reference': stats, 'candidate': {**stats, 'median': 50 + delta},
                           'differenceOfMedians': delta, 'upper95': delta + 2, 'pairedBootstrap95': [delta - 2, delta + 2]}}})
    preparation = []
    for kind, policy, gzip in (('production', 'prepared-unused', 51000), ('controlled', 'same-code', 90000)):
        preparation.append({'id': 'synthetic-' + kind, 'block': 0, 'sourceKind': kind, 'arm': 'candidate', 'policy': policy,
            'input': 'none' if kind == 'production' else 'pointer', 'browser': 'chromium', 'profile': 'desktop', 'status': 'ok',
            'preparation': {'applicable': kind == 'production', 'requestedLeadMs': 250, 'actualLeadMs': None,
                            'verified': True, 'result': {'state': 'ready', 'durationMs': 600}},
            'snapshots': {'observation500': {'traffic': {'rawBytes': 180000, 'gzipBytes': gzip - 1000, 'encodedBodyBytes': 49000,
                              'decodedBodyBytes': 180000, 'transferBytes': 51000, 'requests': 4, 'uniqueRequests': 4}},
                          'final': {'traffic': {'rawBytes': 190000, 'gzipBytes': gzip, 'encodedBodyBytes': 50000,
                              'decodedBodyBytes': 190000, 'transferBytes': 52000, 'requests': 5, 'uniqueRequests': 5}}}})
    analysis = {'schemaVersion': 1, 'kind': 'composable-chat-color-full-analysis', 'status': 'unqualified',
        'validationErrors': [], 'qualifiedForMeasuredGates': False,
        'rolloutAcceptance': 'Synthetic only; review and qualification are not inferred.',
        'provenance': provenance, 'acquisitionStatuses': {'timing': 'incomplete', 'retention': 'incomplete'},
        'rawInputs': [{'path': str(path), 'sha256': sha(path), 'bytes': path.stat().st_size} for path in raw_files],
        'protectedRoots': [str(path) for path in (production, controlled, snapshot, origin, source / 'timing', source / 'retention')],
        'inputBindings': {'production': {'path': str(production), 'sha256': sha(production / 'manifest.json'), 'identity': identities},
                          'controlled': {'path': str(controlled), 'sha256': sha(controlled / 'manifest.json'), 'identity': identities},
                          'producer': {'path': str(producer), 'sha256': sha(producer), 'sidecarPath': str(producer_sidecar), 'sidecarSha256': sha(producer_sidecar)},
                          'cold': {'path': str(cold), 'sha256': sha(cold), 'rawPath': str(cold_raw), 'rawSha256': sha(cold_raw)}},
        'static': {'reference': {'files': 5, 'rawBytes': 200000, 'gzipBytes': 50000},
                   'candidate': {'files': 4, 'rawBytes': 180000, 'gzipBytes': 44000},
                   'gates': [{'metric': 'full-route-startup-gzip-saving', 'point': 6000, 'minimum': 4096, 'pass': True}]},
        'timing': {'cells': cells, 'gates': [{'sourceKind': 'production', 'metric': 'firstReadyMs', 'point': 7, 'upper95': 9, 'limit': 16,
                                            'complete': False, 'pass': False}], 'preparationAndTraffic': preparation,
                   'scenario': [{'sourceKind': 'production', 'policy': 'cold', 'usageFraction': .25,
                                 'referenceMedianIndexMs': 100, 'candidateMedianIndexMs': 102, 'medianIndexChangeMs': 2,
                                 'claim': 'Synthetic descriptive median index, not expected session duration'}]},
        'retention': {'status': 'incomplete', 'qualified': False, 'scope': 'Synthetic separate retained DOM/heap evidence',
            'rows': [{'id': 'synthetic-retention', 'block': 0, 'sourceKind': 'production', 'arm': 'candidate', 'policy': 'prepared',
                      'browser': 'chromium', 'profile': 'desktop', 'status': 'ok', 'completedCycles': 100, 'actualRegistry': 'unavailable',
                      'growth': {'nodes': 2, 'listeners': 1, 'heapBytes': 100, 'connected': {'document.nodes': 0}}, 'pass': True,
                      'finalDetached': None, 'finalDetachedUnsupported': 'Final-only synthetic CDP unavailable',
                      'checkpoints': [{'cycle': 10, 'heapBytes': 1000, 'dom': {'nodes': 100, 'jsEventListeners': 10},
                                       'connected': {'document': {'nodes': 50}}},
                                      {'cycle': 100, 'heapBytes': 1100, 'dom': {'nodes': 102, 'jsEventListeners': 11},
                                       'connected': {'document': {'nodes': 50}}}]}],
            'heapComparisons': [{'sourceKind': 'production', 'policy': 'prepared', 'additionalMedianHeapBytes': 100, 'limit': 262144,
                                 'pass': False, 'pairs': [{'block': 0, 'referenceGrowthBytes': 0, 'candidateGrowthBytes': 100, 'pairedAdditionalBytes': 100}]}]},
        'failures': {'timing': [{'status': 'failed', 'error': 'Retained synthetic timing failure'}],
                     'retention': [{'status': 'not-run', 'reason': 'Retained synthetic retention omission'}]},
        'campaignEvents': {'timing': [{'status': 'signal', 'signal': 'SIGINT'}]}}
    analysis_path = source / 'analysis.json'
    write_json(analysis_path, analysis)
    return {'packed': packed, 'analysis': analysis_path, 'data': analysis, 'raw': raw_files,
            'copied': raw_files[:12], 'producer': producer, 'candidate': cold,
            'protected': (production, controlled, snapshot, origin, source / 'timing', source / 'retention')}


class ReportProvenance(unittest.TestCase):
    def invoke(self, name, *args):
        return subprocess.run([sys.executable, '-B', str(ROOT / 'probes' / name), *map(str, args)], capture_output=True, text=True)

    def rejected_without_writes(self, base, name, *args, reason):
        before = inventory(base)
        result = self.invoke(name, *args)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn(reason, result.stderr)
        self.assertEqual(inventory(base), before, 'Rejected provenance must not create or overwrite files, directories, or links')

    def stage_b_fixture(self, base, *, inside=None):
        prepared = base / 'prepared'; prepared.mkdir()
        snapshot = base / 'source'; snapshot.mkdir()
        origin = base / 'origin'; origin.mkdir()
        run_parent = {'prepared': prepared, 'snapshot': snapshot, 'origin': origin}.get(inside, base)
        run = run_parent / 'run'; run.mkdir()
        variants, analyzed_assets = [], []
        for subject, family in [('reference', 'api'), ('candidate', 'report')]:
            variant_id = subject + '/' + family
            package_name = subject + '/packages.json'
            package_hash = write_json(prepared / package_name, {'synthetic': True, 'subject': subject})
            assets = asset(prepared / variant_id / 'site')
            receipt_name = variant_id + '/receipt.json'
            receipt_hash = write_json(prepared / receipt_name, {'packagesReceipt': package_name, 'packagesReceiptSha256': package_hash, 'assets': assets})
            variants.append({'id': variant_id, 'root': variant_id, 'family': family, 'receipt': receipt_name, 'receiptSha256': receipt_hash})
            analyzed_assets.append({'variant': variant_id, 'family': family, 'receiptSha256': receipt_hash,
                'expectedReceiptSha256': receipt_hash, 'receiptVerified': True, 'startupGzipBytes': None})
        preparation = {'status': 'complete', 'sources': {'candidate': {'snapshot': str(snapshot), 'origin': str(origin)}}, 'variants': variants}
        prepared_hash = write_json(prepared / 'manifest.json', preparation)
        manifest_hash = write_json(run / 'manifest.json', {'preparation': {'path': str(prepared), 'sha256': prepared_hash, 'identity': preparation}, 'host': 'synthetic', 'environment': 'synthetic'})
        summary_hash = write_json(run / 'summary.json', {'status': 'synthetic'})
        (run / 'samples.jsonl').write_text('{"status":"failed","error":"synthetic only"}\n')
        data = {'sourceManifestSha256': manifest_hash, 'rawSha256': sha(run / 'samples.jsonl'), 'summarySha256': summary_hash,
                'assets': analyzed_assets, 'rows': [], 'retention': [], 'checks': [], 'limits': ['Synthetic report contract, never evidence.'],
                'automatedGate': 'not-qualified', 'complete': False, 'fullStageBMatrix': False, 'qualification': True,
                'successfulTiming': 0, 'successfulRetention': 0, 'failedOrAborted': [{'status': 'failed'}]}
        write_json(run / 'analysis.json', data)
        return run, prepared, data

    def test_stage_b_valid_exact_copies_and_analyzed_receipt_hash_mismatch(self):
        for invalid_receipt in (False, True):
            with self.subTest(invalid_receipt=invalid_receipt), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); run, prepared, data = self.stage_b_fixture(base)
                if invalid_receipt:
                    receipt = prepared / 'reference/api/receipt.json'
                    receipt.write_text(receipt.read_text() + ' ')
                    data['assets'][0].update(receiptSha256=sha(receipt), receiptVerified=False)
                    write_json(run / 'analysis.json', data)
                originals = {name: (run / name).read_bytes() for name in ('analysis.json', 'manifest.json', 'summary.json', 'samples.jsonl')}
                result = self.invoke('lazy-delivery-performance/report.py', '--run=' + str(run))
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn('not-qualified', (run / 'report.html').read_text())
                for name, value in originals.items():
                    self.assertEqual((run / name).read_bytes(), value)
                for path in prepared.rglob('receipt.json'):
                    self.assertEqual((run / 'prepared-evidence' / path.relative_to(prepared)).read_bytes(), path.read_bytes())
                self.assertEqual((run / 'report-assets/boot.js').read_bytes(), (prepared / 'candidate/report/site/boot.js').read_bytes())
                receipt = json.loads((run / 'report-receipt.json').read_text())
                summary_path = (run / 'summary.json').resolve()
                self.assertEqual(receipt['inputs'][str(summary_path)], sha(summary_path))
                self.assertEqual(receipt['sha256'], sha(run / 'report.html'))

    def test_stage_b_missing_wrong_or_null_summary_binding(self):
        for state in ('missing', 'wrong', 'null'):
            with self.subTest(state=state), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); run, _, data = self.stage_b_fixture(base)
                if state == 'missing':
                    data.pop('summarySha256')
                else:
                    data['summarySha256'] = None if state == 'null' else '0' * 64
                write_json(run / 'analysis.json', data)
                self.rejected_without_writes(base, 'lazy-delivery-performance/report.py', '--run=' + str(run),
                    reason='summarySha256' if state == 'missing' else 'Original evidence changed')

    def test_stage_b_explicit_invalid_required_bindings(self):
        for key in ('sourceManifestSha256', 'rawSha256', 'receiptSha256'):
            for value in (None, [], 42):
                with self.subTest(key=key, value=value), tempfile.TemporaryDirectory() as temporary:
                    base = Path(temporary); run, _, data = self.stage_b_fixture(base)
                    if key == 'receiptSha256':
                        data['assets'][0][key] = value
                    else:
                        data[key] = value
                    write_json(run / 'analysis.json', data)
                    self.rejected_without_writes(base, 'lazy-delivery-performance/report.py', '--run=' + str(run), reason='Original evidence changed')

    def test_stage_b_changed_attested_inputs_are_rejected(self):
        paths = ('manifest.json', 'summary.json', 'samples.jsonl', 'prepared/manifest.json',
                 'prepared/reference/api/receipt.json', 'prepared/candidate/report/site/boot.js')
        for name in paths:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); run, _, _ = self.stage_b_fixture(base)
                path = base / name if name.startswith('prepared/') else run / name
                path.write_bytes(path.read_bytes() + b' ')
                self.rejected_without_writes(base, 'lazy-delivery-performance/report.py', '--run=' + str(run),
                    reason='Report asset changed' if name.endswith('boot.js') else 'Original evidence changed')

    def test_stage_b_fresh_output_leaves(self):
        for name in ('report-assets', 'prepared-evidence', 'report.html', 'report-receipt.json'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); run, _, _ = self.stage_b_fixture(base)
                (run / name).write_text('Existing immutable artifact')
                self.rejected_without_writes(base, 'lazy-delivery-performance/report.py', '--run=' + str(run), reason='Report output is immutable')

    def test_stage_b_preserves_prepared_and_source_trees(self):
        for location in ('prepared', 'snapshot', 'origin'):
            with self.subTest(location=location), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); run, _, _ = self.stage_b_fixture(base, inside=location)
                self.rejected_without_writes(base, 'lazy-delivery-performance/report.py', '--run=' + str(run), reason='Report output cannot alter')

    def family_fixture(self, base):
        prepared, snapshot, origin = packed_fixture(base)
        run = base / 'acquisition'; run.mkdir()
        analysis_root = base / 'analysis'; analysis_root.mkdir()
        files = {name: write_json(run / name, {'synthetic': name}) for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
        data = {'kind': 'actual-route-family-performance-analysis', 'prepared': str(prepared), 'preparedManifestSha256': sha(prepared / 'manifest.json'),
                'provenance': {'timing': {'path': str(run), 'files': files}}, 'families': {}, 'rolloutAcceptance': 'Synthetic only; not qualified.',
                'frozenBudgetSha256': 'synthetic', 'limits': ['Never performance evidence.'], 'uncertainty': {}}
        digest = write_json(analysis_root / 'analysis.json', data)
        write_json(analysis_root / 'analysis-receipt.json', {'analysisSha256': digest, 'analyzerSha256': sha(ROOT / 'probes/lazy-delivery-families/analyze-performance.py')})
        return analysis_root, prepared, snapshot, origin, run

    def test_family_copies_exact_original_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary); analysis_root, prepared, _, _, run = self.family_fixture(base)
            output = base / 'report'
            result = self.invoke('lazy-delivery-families/report-performance.py', '--analysis=' + str(analysis_root), '--out=' + str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            for path in run.iterdir():
                self.assertEqual((output / 'evidence/timing' / path.name).read_bytes(), path.read_bytes())
            receipt = json.loads((output / 'report-receipt.json').read_text())
            for item in receipt['evidence']:
                self.assertEqual(sha(output / item['copy']), item['sha256'])

    def test_family_rejects_changed_raw_and_analysis(self):
        for changed in ('raw', 'analysis'):
            with self.subTest(changed=changed), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); analysis_root, _, _, _, run = self.family_fixture(base)
                target = run / 'samples.jsonl' if changed == 'raw' else analysis_root / 'analysis.json'
                target.write_bytes(target.read_bytes() + b' ')
                self.rejected_without_writes(base, 'lazy-delivery-families/report-performance.py', '--analysis=' + str(analysis_root), '--out=' + str(base / 'report'), reason='Original evidence changed')

    def test_family_explicit_invalid_analysis_binding(self):
        for value in (None, [], 42, '0' * 64):
            with self.subTest(value=value), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); inputs = self.family_fixture(base)
                receipt_path = inputs[0] / 'analysis-receipt.json'
                receipt = json.loads(receipt_path.read_text()); receipt['analysisSha256'] = value
                write_json(receipt_path, receipt)
                self.rejected_without_writes(base, 'lazy-delivery-families/report-performance.py', '--analysis=' + str(inputs[0]), '--out=' + str(base / 'report'), reason='Original evidence changed')

    def test_family_preserves_every_input_root(self):
        for position in range(5):
            with self.subTest(position=position), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); inputs = self.family_fixture(base)
                output = inputs[position] / 'fresh-report-output'
                self.assertFalse(output.exists())
                self.assertFalse(output.is_symlink())
                self.rejected_without_writes(base, 'lazy-delivery-families/report-performance.py', '--analysis=' + str(inputs[0]), '--out=' + str(output), reason='Report cannot alter')

    def test_wave_color_protects_measured_preparation_and_sources(self):
        for position in range(3):
            with self.subTest(position=position), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); packed, _, _ = packed_fixture(base)
                actual_base = base / 'measured'; actual_base.mkdir()
                actual = packed_fixture(actual_base)
                inputs = base / 'inputs'; inputs.mkdir()
                producer = inputs / 'producer.json'
                write_json(producer, {'schemaVersion': 1, 'kind': 'en-reve-color-cold-assets', 'status': 'complete', 'prepared': str(actual[0]), 'eligibility': {}})
                args = ('--kind=color', '--input=producer=' + str(producer), '--packed=' + str(packed))
                valid = self.invoke('lazy-delivery-reports/report-wave.py', *args, '--out=' + str(base / 'valid-report'))
                self.assertEqual(valid.returncode, 0, valid.stderr)
                self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', *args, '--out=' + str(actual[position] / 'report'), reason='Output must be fresh and outside')

    def test_wave_color_without_producer_protects_direct_measured_roots(self):
        for kind, field in (('candidate', 'distributions'), ('candidate', 'inventoryPath'), ('candidate', 'receiptPath'),
                            ('baseline', 'distribution'), ('baseline', 'frozenReceiptPath'), ('baseline', 'graphPath')):
            with self.subTest(kind=kind, field=field), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); packed, _, _ = packed_fixture(base)
                measured = base / 'measured'; measured.mkdir()
                inputs = base / 'inputs'; inputs.mkdir()
                path = inputs / (kind + '.json')
                if kind == 'candidate':
                    value = {'schemaVersion': 1, 'kind': 'composable-chat-matched-cold-color-diagnostic'}
                    if field == 'distributions':
                        value[field] = {'candidate': str(measured)}
                    else:
                        value['sitesBefore'] = {'candidate': {field: str(measured / 'receipt.json')}}
                else:
                    value = {'schemaVersion': 2, 'route': '/api-examples/composable-chat.html',
                             field: str(measured if field == 'distribution' else measured / 'receipt.json')}
                write_json(path, value)
                args = ('--kind=color', '--input=' + kind + '=' + str(path), '--packed=' + str(packed))
                valid = self.invoke('lazy-delivery-reports/report-wave.py', *args, '--out=' + str(base / 'valid-report'))
                self.assertEqual(valid.returncode, 0, valid.stderr)
                self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', *args, '--out=' + str(measured / 'report'), reason='Output must be fresh and outside')

    def test_wave_retention_protects_its_own_source_roots(self):
        for key in ('snapshot', 'origin'):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary); packed, _, _ = packed_fixture(base)
                retention_source = base / 'retention-source'; retention_source.mkdir()
                inputs = base / 'inputs'; inputs.mkdir()
                timing = inputs / 'analysis.json'; retention = inputs / 'retention.json'
                write_json(timing, {'schemaVersion': 1, 'subject': 'editor-contextual-toolbar', 'cells': []})
                write_json(retention, {'schemaVersion': 1, 'kind': 'en-editor-toolbar-retention-v1', 'preparation': {'sources': {'candidate': {key: str(retention_source)}}}})
                args = ('--kind=editor', '--input=analysis=' + str(timing), '--input=retention=' + str(retention), '--packed=' + str(packed))
                valid = self.invoke('lazy-delivery-reports/report-wave.py', *args, '--out=' + str(base / 'valid-report'))
                self.assertEqual(valid.returncode, 0, valid.stderr)
                self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', *args, '--out=' + str(retention_source / 'report'), reason='Output must be fresh and outside')


    def test_wave_full_color_populated_tables_and_exact_original_copies(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve(); fixture = full_color_fixture(base); output = base / 'report'
            originals = {path: path.read_bytes() for path in [fixture['analysis'], *fixture['raw']]}
            result = self.invoke('lazy-delivery-reports/report-wave.py', '--kind=color', '--input=analysis=' + str(fixture['analysis']),
                                 '--packed=' + str(fixture['packed']), '--out=' + str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            document = (output / 'index.html').read_text(); markup = ReportMarkup(); markup.feed(document)
            sections = markup.sections
            required = ('color-full-static', 'color-full-cells', 'color-full-absolute', 'color-full-changes', 'color-full-gates',
                        'color-full-preparation', 'color-full-traffic', 'color-full-scenario', 'color-full-retention',
                        'color-full-checkpoints', 'color-full-heap', 'color-full-heap-pairs')
            for name in required:
                self.assertIn(name, sections)
                section = sections[name]
                self.assertEqual(section['tables'], 1, name)
                self.assertTrue(section['rows'], name + ' must contain actual synthetic observations')
                self.assertIn('Better sign:', section['direction'], name)
                self.assertLess(section['order'].index('table-end'), section['order'].index('direction'), name)
            for name in ('color-full-cells', 'color-full-changes', 'color-full-traffic'):
                rows = sections[name]['rows']
                self.assertTrue(any('production' in row for row in rows), name)
                self.assertTrue(any('controlled' in row and 'same-code' in row for row in rows), name)
            self.assertFalse(any('controlled' in row for row in sections['color-full-static']['rows']))
            self.assertTrue(any('prepared-unused' in row for row in sections['color-full-preparation']['rows']))
            self.assertTrue(any('final' in row and '51000' in row for row in sections['color-full-traffic']['rows']))
            self.assertTrue(any('100' in row for row in sections['color-full-checkpoints']['rows']))
            self.assertTrue(any('Final-only synthetic CDP unavailable' in row for row in sections['color-full-retention']['rows']))
            self.assertFalse(any('Final-only synthetic CDP unavailable' in cell for row in sections['color-full-checkpoints']['rows'] for cell in row))
            self.assertIn('unqualified', document)
            self.assertIn('Retained synthetic timing failure', document)
            self.assertIn('Retained synthetic retention omission', document)
            self.assertIn('SIGINT', document)
            receipt = json.loads((output / 'report-receipt.json').read_text())
            by_source = {Path(item['source']).resolve(): item for item in receipt['inputs']}
            for path in [fixture['analysis'], *fixture['copied']]:
                item = by_source[path.resolve()]
                self.assertEqual(item['sha256'], hashlib.sha256(originals[path]).hexdigest())
                self.assertEqual((output / item['copy']).read_bytes(), originals[path])
                self.assertIn(item['copy'], markup.links, 'Original evidence must have a usable local report link')
            for path, original in originals.items():
                self.assertEqual(path.read_bytes(), original)
            self.assertEqual((output / 'report-assets/boot.js').read_bytes(), (fixture['packed'] / 'report/site/boot.js').read_bytes())

    def test_wave_full_color_rejects_changed_missing_duplicate_raw_bindings(self):
        for changed in ('timing-raw', 'retention-summary', 'server-prewarm', 'missing-binding', 'duplicate-binding', 'wrong-acquisition-hash'):
            with self.subTest(changed=changed), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary).resolve(); fixture = full_color_fixture(base); data = fixture['data']
                reason = 'Duplicate/changed analyzer-attested full color input'
                if changed in ('timing-raw', 'retention-summary', 'server-prewarm'):
                    phase, name = {'timing-raw': ('timing', 'samples.jsonl'), 'retention-summary': ('retention', 'summary.json'),
                                   'server-prewarm': ('timing', 'server-prewarm.json')}[changed]
                    target = Path(data['provenance'][phase]['path']) / name
                    target.write_bytes(target.read_bytes() + b' ')
                elif changed == 'missing-binding':
                    data['rawInputs'].pop(0); reason = 'Full color acquisition differs from captured analyzer input'
                elif changed == 'duplicate-binding':
                    data['rawInputs'].append(dict(data['rawInputs'][0]))
                else:
                    data['provenance']['retention']['files']['samples.jsonl'] = '0' * 64
                    reason = 'Full color acquisition differs from captured analyzer input'
                write_json(fixture['analysis'], data)
                self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', '--kind=color',
                    '--input=analysis=' + str(fixture['analysis']), '--packed=' + str(fixture['packed']),
                    '--out=' + str(base / 'report'), reason=reason)

    def test_wave_full_color_binds_optional_producer_and_candidate_before_writes(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve(); fixture = full_color_fixture(base)
            args = ('--kind=color', '--input=analysis=' + str(fixture['analysis']), '--packed=' + str(fixture['packed']))
            exact = self.invoke('lazy-delivery-reports/report-wave.py', *args,
                                '--input=producer=' + str(fixture['producer']), '--input=candidate=' + str(fixture['candidate']),
                                '--out=' + str(base / 'exact-report'))
            self.assertEqual(exact.returncode, 0, exact.stderr)
            for label in ('producer', 'candidate'):
                foreign = base / ('foreign-' + label + '.json')
                value = json.loads(fixture[label].read_text()); value['foreignCampaign'] = 'Different original acquisition'
                write_json(foreign, value)
                with self.subTest(label=label):
                    self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', *args,
                        '--input=' + label + '=' + str(foreign), '--out=' + str(base / ('rejected-' + label)),
                        reason='Additional color evidence is from a different full campaign: ' + label)

    def test_wave_full_color_preserves_original_preparation_source_and_retention_roots(self):
        for position in range(6):
            with self.subTest(position=position), tempfile.TemporaryDirectory() as temporary:
                base = Path(temporary).resolve(); fixture = full_color_fixture(base)
                output = fixture['protected'][position] / 'fresh-report'
                self.rejected_without_writes(base, 'lazy-delivery-reports/report-wave.py', '--kind=color',
                    '--input=analysis=' + str(fixture['analysis']), '--packed=' + str(fixture['packed']),
                    '--out=' + str(output), reason='Output must be fresh and outside sealed/evidence inputs')


if __name__ == '__main__':
    unittest.main()
