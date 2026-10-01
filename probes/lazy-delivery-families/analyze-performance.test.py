"""Synthetic negative regressions; no browser/build/timing acquisition.

Run only through the validation owner's supported serialized Python entry point.
The synthetic observations are test inputs, never performance evidence.
"""
from copy import deepcopy
from contextlib import ExitStack, contextmanager, redirect_stdout
from pathlib import Path
import importlib.util
import io
import json
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest import mock
from unittest.mock import patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('family_analysis', Path(__file__).with_name('analyze-performance.py'))
analysis = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analysis)
DESIGNS = json.loads((Path(__file__).resolve().parents[2] / 'plans/lazy-delivery/family-designs.json').read_text())


def timing_fixture(families=analysis.FAMILIES):
    jobs, raw = [], []
    for family in families:
        for browser, profile in analysis.CONFIGS:
            for action in analysis.ACTIONS:
                for arm in analysis.ARMS:
                    for block in range(30):
                        candidate = arm == 'candidate'
                        media = family == 'media'
                        job = {'family': family, 'browser': browser, 'profile': profile, 'action': action,
                               'arm': arm, 'block': block, 'requestedRegistry': 'production-default',
                               'viewport': {'width': 390, 'height': 844} if profile == 'phone' else {'width': 1280, 'height': 900}}
                        jobs.append(job)
                        metrics = {'startupReadyMs': 100, 'startupDocumentNodes': 1600 if candidate else 2000,
                                   'startupDocumentElements': 800 if candidate else 1000,
                                   'startupComponentNodes': 50 if candidate else 400,
                                   'startupComponentElements': 25 if candidate else 180,
                                   'startupGeneratedNodes': 0 if candidate else 240,
                                   'startupGeneratedElements': 0 if candidate else 160,
                                   'firstReadyMs': 55 if candidate else 50, 'repeatReadyMs': 20, 'recreatedNodes': 0,
                                   'entryGzipBytes': 10000, 'entryRequests': 3, 'settledGzipBytes': 10000,
                                   'settledRequests': 3, 'encodedBodyBytes': 10000, 'transferBytes': 11000}
                        workload = {'items': 2 if media else 40, 'contentRendering': 'on-demand' if candidate else 'eager',
                                    'generatedRows': 0 if candidate or media else 40,
                                    'generatedCarousels': 0 if candidate else 1,
                                    'generatedImages': 0 if candidate else 2}
                        snapshot = {'workload': workload, 'generatedSlides': 0 if candidate else 2,
                                    'imageViewToolNodes': 0 if candidate else 5}
                        row = {'status': 'ok', 'job': job, 'browserVersion': 'synthetic-test-only', 'actualRegistry': 'global',
                               'metrics': metrics, 'startup': {'snapshot': snapshot},
                               'first': {'trusted': True, 'snapshot': {'workload': {'inputSame': True}}},
                               'second': {'trusted': True, 'snapshot': {'workload': {'inputSame': True}}}, 'errors': [], 'failures': []}
                        raw.extend([{'status': 'started', 'job': job}, row])
    return {'manifest': {'n': 30, 'qualification': False, 'families': list(families), 'jobs': jobs,
                         'configs': [{'browser': browser, 'profile': profile} for browser, profile in analysis.CONFIGS],
                         'actions': list(analysis.ACTIONS), 'constrained': {'cpuRate': 4, 'latencyMs': 150, 'downloadBitsPerSecond': 1600000, 'uploadBitsPerSecond': 750000}, 'motion': 'no-preference'},
            'raw': raw, 'integrity': {'verified': True, 'errors': []}, 'summary': {'status': 'complete'}}


def retention_fixture():
    jobs, raw = [], []
    for family in analysis.FAMILIES:
        for arm in analysis.ARMS:
            for lifecycle in ('retained', 'disposed'):
                for block in range(5):
                    job = {'family': family, 'arm': arm, 'lifecycle': lifecycle, 'block': block,
                           'browser': 'chromium', 'requestedRegistry': 'production-default'}
                    jobs.append(job)
                    checkpoints = [{'cycle': cycle, 'heapBytes': 1000000,
                                    'dom': {'jsEventListeners': 20},
                                    'connected': {'document': {'nodes': 1000}, 'generated': {'nodes': 200, 'elements': 160 if lifecycle == 'retained' or arm != 'candidate' else 0},
                                                  'workload': {'generatedRows': 40 if lifecycle == 'retained' or arm != 'candidate' else 0, 'items': 40,
                                                               'contentRendering': 'on-demand' if arm == 'candidate' else 'eager'}},
                                    'detached': {'reportedNodes': 0, 'reportedHostNodes': 0, 'reportedInputNodes': 0},
                                    'detachedUnsupported': None} for cycle in (0, 10, 50, 100)]
                    raw.extend([{'status': 'started', 'job': job}, {'status': 'ok', 'job': job, 'actualRegistry': 'global', 'browserVersion': 'synthetic-test-only',
                                                                'checkpoints': checkpoints, 'errors': [], 'failures': []}])
    return {'manifest': {'jobs': jobs, 'qualification': False, 'repetitions': 5, 'cycles': 100},
            'raw': raw, 'integrity': {'verified': True, 'errors': []}, 'summary': {'status': 'complete'}}


def packaging_fixture():
    return {family: ([], [{'id': 'synthetic-packaging-only', 'category': 'packaging', 'status': 'passed'}]) for family in analysis.FAMILIES}


class FamilyEvidenceRegressions(unittest.TestCase):
    def analyze(self, timing=None, retention=None, packaging=None, ssr=None):
        return analysis.analyze_family_data(timing if timing is not None else timing_fixture(),
                                            retention if retention is not None else retention_fixture(),
                                            DESIGNS, bootstrap=1000,
                                            packaging=packaging if packaging is not None else packaging_fixture(), ssr=ssr)

    def test_complete_browser_data_cannot_claim_missing_ssr_or_human_acceptance(self):
        result = self.analyze()
        self.assertEqual(result['media']['decision']['automatedStatus'], 'passed')
        self.assertEqual(result['media']['decision']['status'], 'pending-human-review')
        self.assertEqual(result['combobox']['decision']['categories']['server'], 'pending')
        self.assertEqual(result['combobox']['decision']['humanReview'], 'pending')
        self.assertNotEqual(result['combobox']['decision']['automatedStatus'], 'passed')

    def test_missing_metric_is_not_a_zero_cost_observation(self):
        timing = timing_fixture()
        row = next(row for row in timing['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'media')
        del row['metrics']['firstReadyMs']
        result = self.analyze(timing=timing)
        self.assertFalse(result['media']['matrix']['complete'])
        self.assertNotEqual(result['media']['decision']['automatedStatus'], 'passed')
        self.assertIn('Missing/invalid metrics: firstReadyMs', str(result['media']['matrix']['diagnostics']))

    def test_single_family_or_partial_engine_matrix_cannot_certify_omitted_family(self):
        timing = timing_fixture(('media',))
        timing['raw'] = [row for row in timing['raw'] if row['job']['browser'] != 'webkit']
        result = self.analyze(timing=timing)
        self.assertEqual(result['combobox']['decision']['automatedStatus'], 'pending')
        self.assertFalse(result['media']['matrix']['complete'])
        self.assertNotEqual(result['media']['decision']['automatedStatus'], 'passed')

    def test_failed_retention_repetition_cannot_be_averaged_away(self):
        retention = retention_fixture()
        row = next(row for row in retention['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'media' and row['job']['arm'] == 'candidate')
        row['checkpoints'][-1]['dom']['jsEventListeners'] += 1
        result = self.analyze(retention=retention)
        self.assertEqual(result['media']['decision']['categories']['retention'], 'failed')
        self.assertTrue(any(check['status'] == 'failed' and check['id'].endswith('listenersDelta') for check in result['media']['checks']))

    def test_unsupported_detached_diagnostic_never_means_zero(self):
        retention = retention_fixture()
        row = next(row for row in retention['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'combobox')
        row['checkpoints'][-1]['detachedUnsupported'] = 'Synthetic unsupported CDP diagnostic'
        result = self.analyze(retention=retention)
        self.assertEqual(result['combobox']['decision']['categories']['retention'], 'pending')
        self.assertIsNone(result['combobox']['retention'][0]['detachedHostsDelta'])

    def test_uncertain_benefit_does_not_pass_a_favorable_point_estimate(self):
        timing = timing_fixture()
        for row in timing['raw']:
            if row.get('status') == 'ok' and row['job']['family'] == 'media' and row['job']['arm'] == 'candidate':
                row['metrics']['startupComponentElements'] = 25 if row['job']['block'] < 16 else 180
        result = self.analyze(timing=timing)
        gates = [check for check in result['media']['checks'] if check['id'].endswith('component-elements-percent')]
        self.assertTrue(all(check['value'] <= check['maximum'] for check in gates))
        self.assertTrue(any(check['status'] == 'uncertain' for check in gates))
        self.assertEqual(result['media']['decision']['categories']['benefit'], 'uncertain')

    def test_favorable_median_does_not_hide_one_additional_request(self):
        timing = timing_fixture()
        row = next(row for row in timing['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'media' and row['job']['arm'] == 'candidate')
        row['metrics']['settledRequests'] += 1
        result = self.analyze(timing=timing)
        self.assertEqual(result['media']['decision']['categories']['packaging'], 'failed')

    def test_route_byte_growth_cannot_hide_behind_selective_entry_pass(self):
        timing = timing_fixture()
        for row in timing['raw']:
            if row.get('status') == 'ok' and row['job']['family'] == 'media' and row['job']['arm'] == 'candidate':
                row['metrics']['entryGzipBytes'] += 513
        result = self.analyze(timing=timing)
        self.assertEqual(result['media']['decision']['categories']['packaging'], 'failed')

    def test_actual_global_ownership_and_unique_complete_block_pairing_are_required(self):
        timing = timing_fixture()
        target = next(row for row in timing['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'media')
        target['actualRegistry'] = 'scoped'
        timing['raw'].append(deepcopy(target))
        groups, matrix = analysis.timing_matrix(timing, 'media')
        self.assertFalse(matrix['complete'])
        self.assertIn('duplicate', str(matrix['diagnostics']))
        self.assertIn('production-global', str(matrix['diagnostics']))

    def test_extra_start_or_orphan_abort_is_retained_as_incomplete(self):
        timing = timing_fixture()
        timing['raw'].append({'status': 'aborted', 'job': None, 'signal': 'SIGTERM'})
        _, matrix = analysis.timing_matrix(timing, 'media')
        self.assertFalse(matrix['complete'])
        self.assertIn('Unassigned', str(matrix['diagnostics']))

    def test_p95_is_absent_below_100_and_spread_remains_visible(self):
        low = analysis.stats(list(range(30)))
        self.assertIsNone(low['p95'])
        self.assertEqual(low['min'], 0)
        self.assertEqual(low['max'], 29)
        self.assertIsNotNone(analysis.stats(list(range(100)))['p95'])

    def test_absolute_quantile_bound_uses_finite_sample_order_statistic(self):
        result = analysis.quantile_upper_bound(list(range(30)))
        self.assertEqual(result['n'], 30)
        self.assertEqual(result['rank'], 27)
        self.assertEqual(result['upper'], 26)
        self.assertGreaterEqual(result['achievedCoverage'], .95)
        self.assertIsNone(analysis.quantile_upper_bound(list(range(3)))['upper'])
        checks = []
        analysis.check(checks, 'absolute', 'latency', 20, maximum=25, bounds=[None, result['upper']])
        self.assertEqual(checks[0]['status'], 'uncertain')

    def test_missing_separate_entry_evidence_never_uses_route_entry_bytes(self):
        result = self.analyze(packaging={})
        self.assertEqual(result['media']['decision']['categories']['packaging'], 'pending')
        self.assertEqual(result['combobox']['decision']['categories']['packaging'], 'pending')

    def test_negative_heap_does_not_satisfy_retention_gate(self):
        retention = retention_fixture()
        row = next(row for row in retention['raw'] if row.get('status') == 'ok' and row['job']['family'] == 'media')
        row['checkpoints'][-1]['heapBytes'] = -1
        result = self.analyze(retention=retention)
        self.assertIsNone(result['media']['retention'][0]['heapDelta'])
        self.assertNotEqual(result['media']['decision']['categories']['retention'], 'passed')


def write_fixture_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')


class TimingReceiptFixture:
    """Real receipt/JSONL boundary; expensive unrelated source/runtime trees are mocked.

    These synthetic samples reuse the existing accepted 30-cell fixture. File bytes,
    seals, parsed raw records, main's raw loop, decisions and immutability checks are
    real. Only source/build verification, installed driver/browser verification and
    selective-entry packaging are outside this regression's scope.
    """
    def __init__(self, root):
        self.root = root
        self.run = root / 'timing'
        self.prepared = root / 'prepared'
        self.raw = timing_fixture()['raw']
        fixture = timing_fixture()
        write_fixture_json(root / analysis.DESIGN_PATH, DESIGNS)
        budget_sha = analysis.file_digest(root / analysis.DESIGN_PATH)
        self.preparation = {
            'budgets': [{'path': analysis.DESIGN_PATH, 'sha256': budget_sha}],
            'acceptedReferenceHead': analysis.HISTORICAL_REFERENCE,
            'sources': {'reference': {'git': {'head': analysis.HISTORICAL_REFERENCE}}, 'candidate': {'snapshot': str(root / 'candidate'), 'rootLockSha256': 'synthetic-lock'}},
        }
        write_fixture_json(self.prepared / 'manifest.json', self.preparation)
        self.receipts = {arm: {'routes': {route: {'entry': {'gzipBytes': 10000, 'requests': 3}}
                                        for route in ('/component-patterns.html', '/workflows/selection.html')}}
                         for arm in analysis.ARMS}
        self.manifest = {
            **fixture['manifest'], 'kind': 'actual-route-family-timing', 'prepared': str(self.prepared),
            'preparedManifest': self.preparation,
            'preparedManifestSha256': analysis.file_digest(self.prepared / 'manifest.json'),
            'budgets': {'path': analysis.DESIGN_PATH, 'sha256': budget_sha, 'values': DESIGNS},
            'harness': [], 'support': [], 'runtime': {}, 'installation': {},
            'verifiedBefore': '2026-09-28T00:00:00.000Z', 'verifiedAfter': '2026-09-28T00:01:00.000Z',
            'status': 'complete', 'integrityVerified': True,
        }
        self.reseal()

    def reseal(self):
        self.run.mkdir(exist_ok=True)
        (self.run / 'samples.jsonl').write_text(''.join(json.dumps(row, allow_nan=False) + '\n' for row in self.raw))
        summary = {'status': 'complete', 'integrityVerified': True, 'qualification': False,
                   'planned': len(self.manifest['jobs']),
                   'successful': sum(isinstance(row, dict) and row.get('status') == 'ok' for row in self.raw)}
        write_fixture_json(self.run / 'summary.json', summary)
        self.manifest['rawSha256'] = analysis.file_digest(self.run / 'samples.jsonl')
        self.manifest['summarySha256'] = analysis.file_digest(self.run / 'summary.json')
        self.manifest.pop('manifestSha256', None)
        self.manifest['manifestSha256'] = analysis.digest(self.manifest)
        write_fixture_json(self.run / 'manifest.json', self.manifest)

    @contextmanager
    def unrelated_provenance(self):
        with ExitStack() as stack:
            stack.enter_context(mock.patch.object(analysis, 'ROOT', self.root))
            for name in ('verify_inventory', 'verify_runtime', 'verify_installation'):
                stack.enter_context(mock.patch.object(analysis, name))
            stack.enter_context(mock.patch.object(analysis, 'verify_prepared',
                                                 return_value=(self.preparation, DESIGNS, self.receipts)))
            stack.enter_context(mock.patch.object(analysis, 'selective_checks', return_value=([], [
                {'id': 'unrelated-synthetic-packaging', 'category': 'packaging', 'status': 'passed'}])))
            yield

    def load(self):
        with self.unrelated_provenance():
            return analysis.load_run(self.run, 'actual-route-family-timing', executing_root=self.root)

    def main(self, output_name, *, output_root=None, retention=None):
        output = (output_root or self.root) / output_name
        output.parent.mkdir(parents=True, exist_ok=True)
        original_load = analysis.load_run
        def load_with_fixture_root(*args, **kwargs):
            return original_load(*args, **kwargs, executing_root=self.root)
        with self.unrelated_provenance(), mock.patch.object(analysis, 'load_run', side_effect=load_with_fixture_root), \
                mock.patch.object(sys, 'argv', ['analyze-performance.py', '--run=' + str(self.run),
                                              '--out=' + str(output), '--bootstrap=1000'] +
                                              (['--retention=' + str(retention)] if retention else [])), redirect_stdout(io.StringIO()):
            analysis.main()
        return json.loads((output / 'analysis.json').read_text())


class RawJSONLBoundaryRegressions(unittest.TestCase):
    def test_null_and_array_records_remain_invalid_through_load_run_and_main(self):
        for malformed in (None, []):
            with self.subTest(record=malformed), TemporaryDirectory() as temporary:
                fixture = TimingReceiptFixture(Path(temporary))
                positive = fixture.load()
                self.assertTrue(positive['integrity']['verified'], positive['integrity']['errors'])
                self.assertTrue(analysis.timing_matrix(positive, 'media')[1]['complete'])
                accepted = fixture.main('accepted-analysis')
                self.assertTrue(accepted['provenance']['timing']['integrity']['verified'])
                self.assertEqual(accepted['provenance']['preparedErrors'], [])
                self.assertTrue(accepted['families']['media']['matrix']['complete'])
                timing_categories = {'coverage', 'structure', 'benefit', 'latency', 'identity'}
                self.assertTrue(all(check['status'] == 'passed' for check in accepted['families']['media']['checks']
                                    if check['category'] in timing_categories))
                fixture.raw.append(malformed)
                fixture.reseal()  # Keep valid hashes; the raw object-shape guard must reject the new record.
                raw_before = (fixture.run / 'samples.jsonl').read_bytes()
                invalid = fixture.load()
                self.assertEqual(invalid['raw'][-1], malformed)
                self.assertFalse(invalid['integrity']['verified'])
                self.assertEqual(len(invalid['integrity']['errors']), 1, invalid['integrity']['errors'])
                self.assertIn('Non-object raw record at line ', invalid['integrity']['errors'][0])
                self.assertFalse(analysis.timing_matrix(invalid, 'media')[1]['complete'])
                result = fixture.main('invalid-analysis')  # Regression: no AttributeError from .get on null/list.
                self.assertIn('Raw acquisition contains a non-object record', result['provenance']['preparedErrors'])
                self.assertFalse(result['provenance']['timing']['integrity']['verified'])
                self.assertFalse(result['families']['media']['matrix']['complete'])
                self.assertNotEqual(result['families']['media']['decision']['automatedStatus'], 'passed')
                self.assertEqual((fixture.run / 'samples.jsonl').read_bytes(), raw_before)
                self.assertEqual(result['provenance']['timing']['files']['samples.jsonl'], analysis.digest(raw_before))

    def test_nonobject_timing_manifest_or_summary_has_only_an_invalid_diagnostic(self):
        for filename, malformed in ((name, value) for name in ('manifest.json', 'summary.json') for value in (None, [])):
            with self.subTest(file=filename, value=malformed), TemporaryDirectory() as temporary:
                root = Path(temporary)
                fixture = TimingReceiptFixture(root / 'fixture-source')
                accepted = fixture.main('accepted-analysis')
                self.assertTrue(accepted['provenance']['timing']['integrity']['verified'])
                self.assertTrue(accepted['families']['media']['matrix']['complete'])
                write_fixture_json(fixture.run / filename, malformed)
                before = {name: (fixture.run / name).read_bytes() for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
                loaded = fixture.load()
                self.assertFalse(loaded['integrity']['verified'])
                expected = 'Acquisition ' + ('manifest' if filename == 'manifest.json' else 'summary') + ' must be a JSON object'
                self.assertEqual(loaded['integrity']['errors'], [expected])
                result = fixture.main('diagnostic', output_root=root / 'diagnostics')
                self.assertEqual(result['kind'], 'actual-route-family-performance-invalid-evidence')
                self.assertEqual(result['status'], 'invalid')
                self.assertEqual(result['diagnostics'], [expected])
                self.assertEqual(result['invalidInputValues'], {'timing': {filename.removesuffix('.json'): malformed}})
                self.assertTrue(all(value == {'status': 'not-evaluated'} for value in result['families'].values()))
                for key in ('prepared', 'preparedManifestSha256', 'frozenBudgetSha256'):
                    self.assertNotIn(key, result)
                for name, original in before.items():
                    self.assertEqual((fixture.run / name).read_bytes(), original)
                    self.assertEqual(result['provenance']['timing']['files'][name], analysis.digest(original))

    def test_invalid_manifest_diagnostic_cannot_be_written_inside_an_input_or_source(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            fixture = TimingReceiptFixture(root / 'fixture-source')
            self.assertTrue(fixture.load()['integrity']['verified'])
            write_fixture_json(fixture.run / 'manifest.json', None)
            before = {name: (fixture.run / name).read_bytes() for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
            for protected in (fixture.run, fixture.root, root / 'retention-input', root / 'ssr-input'):
                with self.subTest(protected=protected):
                    protected.mkdir(parents=True, exist_ok=True)
                    output = protected / 'forbidden-diagnostic'
                    original_load = analysis.load_run
                    def load_with_fixture_root(*args, **kwargs):
                        return original_load(*args, **kwargs, executing_root=fixture.root)
                    with fixture.unrelated_provenance(), mock.patch.object(analysis, 'load_run', side_effect=load_with_fixture_root), \
                            mock.patch.object(sys, 'argv', ['analyze-performance.py', '--run=' + str(fixture.run),
                                                          '--retention=' + str(root / 'retention-input'), '--ssr=' + str(root / 'ssr-input'),
                                                          '--out=' + str(output), '--bootstrap=1000']):
                        with self.assertRaisesRegex(ValueError, 'outside source, preparation and acquisition input directories'):
                            analysis.main()
                    self.assertFalse(output.exists())
            for name, original in before.items():
                self.assertEqual((fixture.run / name).read_bytes(), original)

    def test_invalid_diagnostic_rechecks_input_bytes_before_writing(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            fixture = TimingReceiptFixture(root / 'fixture-source')
            self.assertTrue(fixture.load()['integrity']['verified'])
            write_fixture_json(fixture.run / 'manifest.json', None)
            output = root / 'diagnostic'
            original_load = analysis.load_run
            def change_after_load(*args, **kwargs):
                loaded = original_load(*args, **kwargs, executing_root=fixture.root)
                with (fixture.run / 'samples.jsonl').open('a') as stream:
                    stream.write('\n')
                return loaded
            with fixture.unrelated_provenance(), mock.patch.object(analysis, 'load_run', side_effect=change_after_load), \
                    mock.patch.object(sys, 'argv', ['analyze-performance.py', '--run=' + str(fixture.run),
                                                  '--out=' + str(output), '--bootstrap=1000']):
                with self.assertRaisesRegex(ValueError, 'Acquisition changed before invalid-evidence diagnostic: samples.jsonl'):
                    analysis.main()
            self.assertFalse(output.exists())

    def test_invalid_summary_protects_declared_preparation_and_source_snapshot_paths(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            fixture = TimingReceiptFixture(root / 'fixture-source')
            # Put the declared paths outside patched ROOT so the new declaration
            # containment checks, rather than the general source guard, reject output.
            fixture.prepared = root / 'external-preparation'
            fixture.preparation['sources']['candidate']['snapshot'] = str(root / 'external-candidate')
            fixture.preparation['sources']['reference']['snapshot'] = str(root / 'external-reference')
            write_fixture_json(fixture.prepared / 'manifest.json', fixture.preparation)
            fixture.manifest['prepared'] = str(fixture.prepared)
            fixture.manifest['preparedManifestSha256'] = analysis.file_digest(fixture.prepared / 'manifest.json')
            fixture.reseal()
            self.assertTrue(fixture.load()['integrity']['verified'])
            accepted = fixture.main('accepted-analysis')
            self.assertTrue(accepted['provenance']['timing']['integrity']['verified'])
            self.assertTrue(accepted['families']['media']['matrix']['complete'])
            write_fixture_json(fixture.run / 'summary.json', [])
            before = {name: (fixture.run / name).read_bytes() for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
            protected = [fixture.prepared, root / 'external-candidate', root / 'external-reference']
            for directory in protected:
                with self.subTest(protected=directory):
                    with self.assertRaisesRegex(ValueError, 'outside source, preparation and acquisition input directories'):
                        fixture.main('forbidden-diagnostic', output_root=directory)
                    self.assertFalse((directory / 'forbidden-diagnostic').exists())
            for name, original in before.items():
                self.assertEqual((fixture.run / name).read_bytes(), original)


class StructuralClosureRegressions(unittest.TestCase):
    def test_media_invalid_snapshot_subtype_counters_do_not_claim_absence(self):
        baseline = timing_fixture(('media',))
        groups, matrix = analysis.timing_matrix(baseline, 'media')
        self.assertTrue(matrix['complete'])
        rows = analysis.compare_metrics(groups, 'media', 1000)
        design = DESIGNS['designs']['media-design']
        accepted = analysis.timing_checks('media', rows, groups, matrix, design)
        self.assertTrue(all(check['status'] == 'passed' for check in accepted))
        absent = object()
        for counter in ('generatedCarousels', 'generatedSlides', 'generatedImages', 'imageViewToolNodes'):
            for invalid in (-1, .5, False, None, absent):
                with self.subTest(counter=counter, invalid='missing' if invalid is absent else invalid):
                    mutated = deepcopy(baseline)
                    sample = next(row for row in mutated['raw'] if row.get('status') == 'ok'
                                  and row['job']['arm'] == 'candidate' and row['job']['browser'] == 'chromium'
                                  and row['job']['profile'] == 'desktop' and row['job']['action'] == 'keyboard'
                                  and row['job']['block'] == 0)
                    snapshot = sample['startup']['snapshot']
                    owner = snapshot if counter in ('generatedSlides', 'imageViewToolNodes') else snapshot['workload']
                    if invalid is absent:
                        del owner[counter]
                    else:
                        owner[counter] = invalid
                    changed_groups, changed_matrix = analysis.timing_matrix(mutated, 'media')
                    self.assertTrue(changed_matrix['complete'])  # No unrelated acquisition/metric failure explains rejection.
                    checks = analysis.timing_checks('media', rows, changed_groups, changed_matrix, design)
                    identifier = 'candidate/chromium/desktop/keyboard/unused-' + counter
                    affected = [check for check in checks if check['id'] == identifier]
                    self.assertEqual(len(affected), 1)
                    self.assertEqual(affected[0]['status'], 'pending')
                    self.assertIsNone(affected[0]['value'])
                    self.assertTrue(all(check['status'] == 'passed' for check in checks if check['id'] != identifier))

    def test_selection_missing_checkpoint_structure_never_inherits_zero_or_catalog(self):
        baseline = retention_fixture()
        design = DESIGNS['designs']['selection-design']
        rows, _, accepted = analysis.retention_analysis(baseline, 'combobox', design, 1000)
        self.assertTrue(all(check['status'] == 'passed' for check in accepted))
        for lifecycle, expected_rows in (('retained', 40), ('disposed', 0)):
            original = next(row for row in rows if row['arm'] == 'candidate' and row['lifecycle'] == lifecycle and row['block'] == 0)
            self.assertEqual(original['generatedRowsAt10'], expected_rows)
            self.assertEqual(original['generatedRowsAt100'], expected_rows)
            self.assertEqual(original['generatedElementsAt10'], expected_rows * 4)
            self.assertEqual(original['generatedElementsAt100'], expected_rows * 4)
            for cycle in (10, 100):
                for path, suffix in ((('workload', 'generatedRows'), 'bounded-generated-rows'),
                                     (('generated', 'elements'), 'bounded-generated-elements'),
                                     (('workload', 'items'), 'unchanged-catalog-policy'),
                                     (('workload', 'contentRendering'), 'unchanged-catalog-policy'),
                                     (('workload',), 'unchanged-catalog-policy')):
                    with self.subTest(lifecycle=lifecycle, cycle=cycle, missing=path):
                        mutated = deepcopy(baseline)
                        sample = next(row for row in mutated['raw'] if row.get('status') == 'ok'
                                      and row['job']['family'] == 'combobox' and row['job']['arm'] == 'candidate'
                                      and row['job']['lifecycle'] == lifecycle and row['job']['block'] == 0)
                        point = next(point for point in sample['checkpoints'] if point['cycle'] == cycle)
                        owner = point['connected']
                        for key in path[:-1]:
                            owner = owner[key]
                        del owner[path[-1]]
                        _, _, checks = analysis.retention_analysis(mutated, 'combobox', design, 1000)
                        matrix = next(check for check in checks if check['id'] == 'complete-retention-matrix')
                        self.assertEqual(matrix['status'], 'passed')
                        identifier = 'candidate/' + lifecycle + '/0/' + suffix
                        affected = next(check for check in checks if check['id'] == identifier)
                        self.assertEqual(affected['status'], 'pending')
                        self.assertIsNone(affected['value'])
                        self.assertEqual(analysis.result_status(checks), 'pending')
                        self.assertTrue(all(check['status'] == 'passed' for check in checks if not check['id'].startswith('candidate/' + lifecycle + '/0/')))


def ssr_regression_write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding='utf-8')


def ssr_regression_json(path, value):
    ssr_regression_write(path, json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + '\n')


def ssr_regression_seal(value, key='manifestSha256'):
    value[key] = analysis.digest({name: item for name, item in value.items() if name != key})


def ssr_regression_inventory(root, names):
    """Real small files: preserve names, hashes, lengths, kinds and executable modes."""
    root = Path(root)
    return [{'path': name, 'type': 'file', 'sha256': analysis.file_digest(root / name),
             'bytes': (root / name).stat().st_size,
             'executable': bool((root / name).stat().st_mode & 0o111)}
            for name in sorted(names)]


class SSRDiskFixture:
    """Synthetic files for every check performed by the real ssr_analysis path.

    No production build, runtime, source or performance observation is claimed.
    The Node stand-in is hashed as an ordinary file and is never executed.
    Source/preparation self-seals are retained even though ssr_analysis does not
    invoke the separate full verify_prepared browser/build provenance boundary.
    """

    def __init__(self, directory):
        self.root = Path(directory).resolve()
        self.executing = self.root / 'executing-source'
        self.prepared = self.root / 'prepared'
        self.run = self.root / 'acquisition'
        support_names = ['probes/lazy-delivery-performance/source-seal.mjs',
                         'tooling/testing/machine-owner.mjs',
                         'tooling/testing/execution-owner.mjs']
        harness_name = 'probes/lazy-delivery-families/ssr-performance.mjs'
        source_names = [*support_names, harness_name, analysis.DESIGN_PATH, 'package-lock.json']
        for name in [*support_names, harness_name]:
            ssr_regression_write(self.executing / name, '// Synthetic SSR receipt fixture: ' + name + '\n')
        ssr_regression_json(self.executing / analysis.DESIGN_PATH, DESIGNS)
        ssr_regression_json(self.executing / 'package-lock.json', {'lockfileVersion': 3, 'packages': {}})
        self.support = ssr_regression_inventory(self.executing, support_names)
        harness_files = ssr_regression_inventory(self.executing, [harness_name])
        harness = {'files': harness_files, 'sha256': analysis.digest(harness_files)}
        budget = {'path': analysis.DESIGN_PATH, 'sha256': analysis.file_digest(self.executing / analysis.DESIGN_PATH)}
        lock_sha = analysis.file_digest(self.executing / 'package-lock.json')
        sources = {}
        for subject in ('reference', 'candidate'):
            snapshot = self.root / 'snapshots' / subject
            for name in source_names:
                ssr_regression_write(snapshot / 'source' / name, (self.executing / name).read_text(encoding='utf-8'))
            files = ssr_regression_inventory(snapshot / 'source', source_names)
            seal = {'schemaVersion': 1, 'synthetic': True, 'files': files,
                    'sourceSha256': analysis.digest(files), 'rootLockSha256': lock_sha}
            ssr_regression_seal(seal, 'sealSha256')
            ssr_regression_json(snapshot / 'source-seal.json', seal)
            sources[subject] = {'snapshot': str(snapshot), 'sourceSha256': seal['sourceSha256'],
                                'sealSha256': seal['sealSha256'], 'rootLockSha256': lock_sha}
        node = self.root / 'runtime' / 'node-stand-in'
        ssr_regression_write(node, 'Synthetic Node identity bytes; this file is never executed.\n')
        self.node_identity = {'path': str(node), 'sha256': analysis.file_digest(node),
                              'version': 'synthetic-test-only'}
        self.receipts = {}
        arms = []
        for arm, subject, policy in [('reference', 'reference', 'eager'),
                                     ('candidate', 'candidate', 'on-demand'),
                                     ('rollback', 'candidate', 'eager')]:
            arm_root = 'arms/' + arm
            runtime_root = arm_root + '/node_modules'
            installed_lock = self.prepared / runtime_root / '.package-lock.json'
            ssr_regression_json(installed_lock, {'lockfileVersion': 3, 'packages': {}})
            ssr_regression_json(self.prepared / runtime_root / 'synthetic-runtime/package.json',
                                {'name': 'synthetic-runtime', 'version': '0.0.0'})
            runtime_files = ssr_regression_inventory(self.prepared / runtime_root,
                                                     ['.package-lock.json', 'synthetic-runtime/package.json'])
            runtime_receipt = arm_root + '/runtime-receipt.json'
            runtime = {'root': runtime_root, 'files': runtime_files,
                       'sha256': analysis.digest(runtime_files), 'exactLockSha256': lock_sha,
                       'installedLockSha256': analysis.file_digest(installed_lock),
                       'exclusions': ['.cache', '.bin', '.vite', '.vite-temp', '@en-reve/docs']}
            ssr_regression_json(self.prepared / runtime_receipt, runtime)
            output_root = arm_root + '/ssr'
            entry = output_root + '/entry.mjs'
            sibling = output_root + '/chunk.mjs'
            ssr_regression_write(self.prepared / entry, '// Synthetic compiled route entry.\n')
            ssr_regression_write(self.prepared / sibling, '// Synthetic ordinary sibling compiled chunk.\n')
            self.receipts[arm] = {'registry': 'production-global', 'policy': policy,
                                  'ssr': {'exportName': 'renderWorkflows', 'args': ['selection'],
                                          'sourceSealSha256': sources[subject]['sealSha256'],
                                          'sourceSha256': sources[subject]['sourceSha256'],
                                          'runtimeLockSha256': lock_sha,
                                          'runtimeReceipt': runtime_receipt,
                                          'runtimeReceiptSha256': analysis.file_digest(self.prepared / runtime_receipt),
                                          'outputRoot': output_root, 'entry': entry,
                                          'assets': ssr_regression_inventory(self.prepared, [entry, sibling])}}
            arms.append({'id': arm, 'subject': subject, 'policy': policy, 'root': arm_root,
                         'receipt': arm_root + '/receipt.json'})
        self.preparation = {'schemaVersion': 1, 'kind': 'en-reve-lazy-delivery-actual-docs-build',
                            'status': 'complete', 'synthetic': True, 'sources': sources, 'arms': arms,
                            'harness': harness, 'budgets': [budget],
                            'runtime': {'node': deepcopy(self.node_identity)}}
        jobs, self.raw = [], []
        for block in range(30):
            for arm in arms:
                job = {'id': 'block-' + str(block).zfill(4) + '-' + arm['id'],
                       'block': block, 'arm': arm['id'], 'policy': arm['policy'],
                       'registry': 'production-global', 'route': '/workflows/selection.html'}
                jobs.append(job)
                metrics = {'renderMs': 100, 'startupMs': 1, 'importMs': 1,
                           'workerBootMs': 1, 'spawnToExitMs': 102}
                artifacts = 'attempts/' + job['id']
                ssr_regression_write(self.run / artifacts / 'stdout.txt', '')
                ssr_regression_json(self.run / artifacts / 'result.json',
                                    {'synthetic': True, 'job': job, 'metrics': metrics})
                self.raw.extend([{'event': 'started', 'job': deepcopy(job)},
                                 {'event': 'terminal', 'job': deepcopy(job), 'status': 'succeeded',
                                  'metrics': metrics, 'artifacts': artifacts,
                                  'artifactsInventory': ssr_regression_inventory(self.run / artifacts,
                                                                                ['stdout.txt', 'result.json'])}])
        self.summary = {'kind': 'selection-production-ssr-summary', 'integrityVerified': True,
                        'complete': True, 'sufficient': True, 'qualification': False,
                        'scheduled': len(jobs), 'terminal': len(jobs), 'invalidRows': [], 'missing': [],
                        'passed': False}
        # Deliberately false summary.passed proves terminal metrics are recomputed.
        self.manifest = {'schemaVersion': 1, 'kind': 'selection-production-ssr-acquisition',
                         'status': 'complete', 'synthetic': True, 'n': 30, 'seed': 20260928,
                         'qualification': False, 'verifiedBefore': True, 'verifiedAfter': True,
                         'jobs': jobs,
                         'protocol': {'id': 'selection-production-ssr-fresh-process-v1',
                                      'actualRegistry': 'production-global',
                                      'uncertainty': {'repetitions': 10000, 'seed': 20260929, 'confidence': .95}},
                         'gates': {'maximumSSRRenderP75RegressionMs': 5,
                                   'maximumSSRRenderP75RegressionPercent': 5},
                         'harness': deepcopy(harness), 'support': deepcopy(self.support),
                         'runtime': deepcopy(self.node_identity), 'budgets': deepcopy(budget)}
        self.reseal_preparation()

    def reseal_preparation(self):
        """Propagate arm bytes through preparation and its acquisition binding."""
        for arm in self.preparation['arms']:
            receipt_path = self.prepared / arm['receipt']
            ssr_regression_json(receipt_path, self.receipts[arm['id']])
            arm['receiptSha256'] = analysis.file_digest(receipt_path)
        ssr_regression_seal(self.preparation)
        ssr_regression_json(self.prepared / 'manifest.json', self.preparation)
        self.prepared_sha = analysis.file_digest(self.prepared / 'manifest.json')
        self.manifest['preparation'] = {'path': str(self.prepared), 'sha256': self.prepared_sha,
                                        'identity': deepcopy(self.preparation)}
        self.reseal_acquisition()

    def reseal_acquisition(self):
        """Keep raw and summary bytes independently sealed, then seal the manifest."""
        ssr_regression_write(self.run / 'samples.jsonl',
                             ''.join(json.dumps(row, ensure_ascii=False, allow_nan=False) + '\n' for row in self.raw))
        ssr_regression_json(self.run / 'summary.json', self.summary)
        self.manifest['rawSha256'] = analysis.file_digest(self.run / 'samples.jsonl')
        self.manifest['summarySha256'] = analysis.file_digest(self.run / 'summary.json')
        ssr_regression_seal(self.manifest)
        ssr_regression_json(self.run / 'manifest.json', self.manifest)


class SSROnDiskEvidenceRegressions(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory(prefix='en-reve-ssr-analyzer-regression-')
        self.addCleanup(directory.cleanup)
        self.fixture = SSRDiskFixture(directory.name)

    @staticmethod
    def constant_ssr_interval(pairs):
        # Only the expensive numerical resampling is substituted. Every fixture
        # pair is exactly (100, 100), so all 10,000 frozen resamples have these
        # same zero bounds. This is not a test of ssr_interval's implementation.
        if pairs != ((100, 100),) * 30:
            raise AssertionError('SSR receipt regression unexpectedly changed numerical inputs')
        return {'delta': [0, 0], 'percent': [0, 0], 'seed': 20260929, 'repetitions': 10000,
                'method': 'Exact constant-pair result for synthetic provenance test only'}

    def analyze_ssr(self):
        # All provenance, runtime, inventory, hash, matrix and check functions
        # remain real. No analyzer verification target is mocked.
        with patch.object(analysis, 'ROOT', self.fixture.executing), \
                patch.object(analysis, 'ssr_interval', side_effect=self.constant_ssr_interval):
            return analysis.ssr_analysis(self.fixture.run, self.fixture.prepared_sha, 1000)

    def assert_accepted_ssr(self):
        rows, checks, provenance = self.analyze_ssr()
        self.assertEqual({row['comparison'] for row in rows},
                         {'candidate-reference', 'candidate-rollback', 'rollback-reference'})
        self.assertEqual(len(rows), 3)
        self.assertTrue(all(row['n'] == 30 and row['p75Delta'] == 0 and row['p75Percent'] == 0 for row in rows))
        self.assertEqual({check['id'] for check in checks},
                         {comparison + '/SSR-p75-' + unit
                          for comparison in ('candidate-reference', 'rollback-reference')
                          for unit in ('ms', 'percent')})
        self.assertEqual(len(checks), 4)
        self.assertTrue(all(check['category'] == 'server' and check['status'] == 'passed' for check in checks))
        self.assertEqual(analysis.result_status(checks), 'passed')
        self.assertEqual(provenance['path'], str(self.fixture.run))
        for field, name in [('manifestSha256', 'manifest.json'), ('summarySha256', 'summary.json'),
                            ('rawSha256', 'samples.jsonl')]:
            self.assertEqual(provenance[field], analysis.file_digest(self.fixture.run / name))

    def assert_pending_ssr(self, diagnostic):
        rows, checks, provenance = self.analyze_ssr()
        self.assertEqual(rows, [])
        self.assertEqual(len(checks), 1)
        self.assertEqual(checks[0]['id'], 'selection-production-SSR')
        self.assertEqual(checks[0]['category'], 'server')
        self.assertEqual(checks[0]['status'], 'pending')
        self.assertEqual(analysis.result_status(checks), 'pending')
        self.assertIn('Invalid/incomplete SSR receipt:', checks[0]['reason'])
        self.assertIn(diagnostic, checks[0]['reason'])
        self.assertIsNotNone(provenance)
        for field, name in [('manifestSha256', 'manifest.json'), ('summarySha256', 'summary.json'),
                            ('rawSha256', 'samples.jsonl')]:
            self.assertEqual(provenance[field], analysis.file_digest(self.fixture.run / name))

    def test_complete_on_disk_ssr_fixture_passes_actual_verification(self):
        for value in (self.fixture.preparation, self.fixture.manifest):
            self.assertEqual(value['manifestSha256'],
                             analysis.digest({key: item for key, item in value.items() if key != 'manifestSha256'}))
        self.assertEqual(len(self.fixture.manifest['jobs']), 90)
        self.assertEqual(len(self.fixture.raw), 180)
        self.assertFalse(self.fixture.summary['passed'])
        self.assert_accepted_ssr()

    def test_ssr_acquisition_manifest_self_seal_rejects_single_field_tampering(self):
        self.assert_accepted_ssr()
        original_raw = analysis.file_digest(self.fixture.run / 'samples.jsonl')
        original_summary = analysis.file_digest(self.fixture.run / 'summary.json')
        self.fixture.manifest['seed'] += 1
        ssr_regression_json(self.fixture.run / 'manifest.json', self.fixture.manifest)
        self.assertEqual(analysis.file_digest(self.fixture.run / 'samples.jsonl'), original_raw)
        self.assertEqual(analysis.file_digest(self.fixture.run / 'summary.json'), original_summary)
        self.assert_pending_ssr('SSR manifest self-seal missing/changed')

    def test_ssr_compiled_output_rejects_unlisted_added_file(self):
        self.assert_accepted_ssr()
        ssr = self.fixture.receipts['candidate']['ssr']
        ssr_regression_write(self.fixture.prepared / ssr['outputRoot'] / 'unlisted.mjs',
                             '// Undeclared ordinary compiled output.\n')
        self.assert_pending_ssr('Inventory additions/deletions:')

    def test_ssr_compiled_output_rejects_removed_sealed_file(self):
        self.assert_accepted_ssr()
        ssr = self.fixture.receipts['candidate']['ssr']
        (self.fixture.prepared / ssr['outputRoot'] / 'chunk.mjs').unlink()
        self.assert_pending_ssr('Expected ordinary sealed file: chunk.mjs')

    def test_ssr_entry_must_belong_to_otherwise_exact_output_inventory(self):
        self.assert_accepted_ssr()
        ssr = self.fixture.receipts['candidate']['ssr']
        entry = ssr['entry']
        (self.fixture.prepared / entry).unlink()
        ssr['assets'] = [asset for asset in ssr['assets'] if asset['path'] != entry]
        self.assertEqual(len(ssr['assets']), 1)
        self.assertTrue((self.fixture.prepared / ssr['assets'][0]['path']).is_file())
        self.fixture.reseal_preparation()
        # The sibling ordinary output remains valid and exactly inventoried.
        # Fully resealed outer receipts expose the explicit entry membership guard.
        self.assert_pending_ssr('Production SSR entry absent from sealed output')

    def test_ssr_null_and_array_raw_records_return_pending_without_attribute_error(self):
        original_raw = deepcopy(self.fixture.raw)
        for bad_record in (None, []):
            with self.subTest(raw_record=bad_record):
                self.fixture.raw = deepcopy(original_raw)
                self.fixture.reseal_acquisition()
                self.assert_accepted_ssr()
                self.fixture.raw = [*deepcopy(original_raw), bad_record]
                self.fixture.reseal_acquisition()
                self.assertEqual(self.fixture.manifest['rawSha256'],
                                 analysis.file_digest(self.fixture.run / 'samples.jsonl'))
                self.assertEqual(self.fixture.manifest['summarySha256'],
                                 analysis.file_digest(self.fixture.run / 'summary.json'))
                self.assertEqual(self.fixture.manifest['manifestSha256'],
                                 analysis.digest({key: item for key, item in self.fixture.manifest.items()
                                                  if key != 'manifestSha256'}))
                self.assert_pending_ssr('SSR raw records must be objects')

    def test_ssr_nonobject_manifest_or_summary_returns_pending_with_input_hashes(self):
        for filename, malformed in ((name, value) for name in ('manifest.json', 'summary.json') for value in (None, [])):
            with self.subTest(file=filename, value=malformed):
                self.fixture.reseal_acquisition()
                self.assert_accepted_ssr()
                ssr_regression_json(self.fixture.run / filename, malformed)
                before = {name: (self.fixture.run / name).read_bytes() for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
                kind = 'manifest' if filename == 'manifest.json' else 'summary'
                self.assert_pending_ssr('SSR acquisition ' + kind + ' must be a JSON object')
                for name, original in before.items():
                    self.assertEqual((self.fixture.run / name).read_bytes(), original)


class RetentionReceiptFixture:
    """Real retention JSON/JSONL/seals sharing the timing fixture's preparation.

    Uses only TimingReceiptFixture.unrelated_provenance's documented substitutes
    for unrelated expensive source/build/driver/browser/packaging verification.
    The actual load_run, main, shape guards, retention decisions, byte seals and
    invalid-input diagnostic writer remain under test.
    """

    def __init__(self, timing):
        self.timing = timing
        self.run = timing.root / 'retention'
        fixture = retention_fixture()
        self.raw = fixture['raw']
        provenance_keys = ('prepared', 'preparedManifest', 'preparedManifestSha256',
                           'budgets', 'harness', 'support', 'runtime', 'installation',
                           'verifiedBefore', 'verifiedAfter', 'status', 'integrityVerified')
        self.manifest = {key: deepcopy(timing.manifest[key]) for key in provenance_keys}
        self.manifest.update(deepcopy(fixture['manifest']))
        self.manifest['kind'] = 'actual-route-family-retention'
        self.reseal()

    def reseal(self):
        self.run.mkdir(parents=True, exist_ok=True)
        (self.run / 'samples.jsonl').write_text(''.join(json.dumps(row, allow_nan=False) + '\n' for row in self.raw))
        summary = {'status': 'complete', 'integrityVerified': True, 'qualification': False,
                   'planned': len(self.manifest['jobs']),
                   'successful': sum(isinstance(row, dict) and row.get('status') == 'ok' for row in self.raw)}
        write_fixture_json(self.run / 'summary.json', summary)
        self.manifest['rawSha256'] = analysis.file_digest(self.run / 'samples.jsonl')
        self.manifest['summarySha256'] = analysis.file_digest(self.run / 'summary.json')
        self.manifest.pop('manifestSha256', None)
        self.manifest['manifestSha256'] = analysis.digest(self.manifest)
        write_fixture_json(self.run / 'manifest.json', self.manifest)

    def load(self):
        with self.timing.unrelated_provenance():
            return analysis.load_run(self.run, 'actual-route-family-retention',
                                     self.timing.manifest['preparedManifestSha256'],
                                     executing_root=self.timing.root)


class RetentionTopLevelShapeRegressions(unittest.TestCase):
    def assert_valid_retention_baseline(self, timing, retention):
        loaded = retention.load()
        self.assertTrue(loaded['integrity']['verified'], loaded['integrity']['errors'])
        self.assertEqual(loaded['manifest']['kind'], 'actual-route-family-retention')
        self.assertEqual(loaded['manifest']['preparedManifestSha256'], timing.manifest['preparedManifestSha256'])
        self.assertEqual(loaded['manifest']['preparedManifest'], timing.preparation)
        self.assertEqual(loaded['manifest']['jobs'], retention.manifest['jobs'])
        self.assertEqual(loaded['raw'], retention.raw)
        self.assertEqual(loaded['summary']['planned'], 60)
        self.assertEqual(loaded['summary']['successful'], 60)
        self.assertEqual(len(loaded['raw']), 120)
        accepted = timing.main('accepted-retention-analysis', retention=retention.run)
        self.assertEqual(accepted['kind'], 'actual-route-family-performance-analysis')
        self.assertTrue(accepted['provenance']['timing']['integrity']['verified'])
        self.assertTrue(accepted['provenance']['retention']['integrity']['verified'])
        self.assertEqual(accepted['provenance']['preparedErrors'], [])
        self.assertTrue(accepted['families']['media']['matrix']['complete'])
        self.assertEqual(accepted['families']['media']['decision']['categories']['retention'], 'passed')
        self.assertEqual(accepted['families']['media']['decision']['automatedStatus'], 'passed')
        self.assertTrue(all(check['status'] == 'passed'
                            for check in accepted['families']['media']['checks']
                            if check['category'] == 'retention'))

    def test_nonobject_retention_manifest_or_summary_preserves_both_input_provenances(self):
        for filename, malformed in ((name, value) for name in ('manifest.json', 'summary.json') for value in (None, [])):
            with self.subTest(file=filename, value=malformed), TemporaryDirectory() as temporary:
                root = Path(temporary)
                timing = TimingReceiptFixture(root / 'fixture-source')
                retention = RetentionReceiptFixture(timing)
                self.assert_valid_retention_baseline(timing, retention)
                write_fixture_json(retention.run / filename, malformed)
                before = {kind: {name: (directory / name).read_bytes()
                                 for name in ('manifest.json', 'summary.json', 'samples.jsonl')}
                          for kind, directory in [('timing', timing.run), ('retention', retention.run)]}
                loaded_timing, loaded_retention = timing.load(), retention.load()
                self.assertTrue(loaded_timing['integrity']['verified'])
                self.assertFalse(loaded_retention['integrity']['verified'])
                invalid_key = filename.removesuffix('.json')
                expected = 'Acquisition ' + invalid_key + ' must be a JSON object'
                self.assertEqual(loaded_retention[invalid_key], malformed)
                self.assertEqual(loaded_retention['integrity']['errors'], [expected])
                result = timing.main('retention-shape-diagnostic', retention=retention.run,
                                     output_root=root / 'diagnostics')
                self.assertEqual(result['kind'], 'actual-route-family-performance-invalid-evidence')
                self.assertEqual(result['status'], 'invalid')
                self.assertTrue(any(expected in diagnostic for diagnostic in result['diagnostics']))
                self.assertEqual(result['invalidInputValues'], {'retention': {invalid_key: malformed}})
                self.assertEqual(set(result['families']), set(analysis.KNOWN_FAMILIES))
                self.assertTrue(all(value == {'status': 'not-evaluated'} for value in result['families'].values()))
                self.assertEqual(set(result['provenance']), {'timing', 'retention'})
                for kind, directory, loaded in [('timing', timing.run, loaded_timing),
                                                ('retention', retention.run, loaded_retention)]:
                    self.assertEqual(result['provenance'][kind]['path'], str(directory.resolve()))
                    self.assertEqual(result['provenance'][kind]['integrity'], loaded['integrity'])
                    self.assertEqual(set(result['provenance'][kind]['files']), set(before[kind]))
                    for name, original in before[kind].items():
                        self.assertEqual((directory / name).read_bytes(), original)
                        self.assertEqual(result['provenance'][kind]['files'][name], analysis.digest(original))
                receipt = json.loads((root / 'diagnostics/retention-shape-diagnostic/analysis-receipt.json').read_text())
                self.assertEqual(receipt['kind'], 'actual-route-family-invalid-evidence-receipt')
                self.assertEqual(receipt['analysisSha256'],
                                 analysis.file_digest(root / 'diagnostics/retention-shape-diagnostic/analysis.json'))
                for key in ('prepared', 'preparedManifestSha256', 'frozenBudgetSha256'):
                    self.assertNotIn(key, result)
                    self.assertNotIn(key, receipt)

    def test_retention_bytes_changed_after_load_prevent_invalid_diagnostic_write(self):
        with TemporaryDirectory() as temporary:
            root = Path(temporary)
            timing = TimingReceiptFixture(root / 'fixture-source')
            retention = RetentionReceiptFixture(timing)
            self.assert_valid_retention_baseline(timing, retention)
            write_fixture_json(retention.run / 'manifest.json', None)
            output = root / 'retention-changed-diagnostic'
            original_load = analysis.load_run
            mutations = []
            original_retention_raw = (retention.run / 'samples.jsonl').read_bytes()
            original_timing = {name: (timing.run / name).read_bytes()
                               for name in ('manifest.json', 'summary.json', 'samples.jsonl')}

            def change_retention_after_load(*args, **kwargs):
                loaded = original_load(*args, **kwargs, executing_root=timing.root)
                if Path(args[0]).resolve() == retention.run.resolve():
                    self.assertFalse(loaded['integrity']['verified'])
                    self.assertEqual(loaded['integrity']['errors'], ['Acquisition manifest must be a JSON object'])
                    with (retention.run / 'samples.jsonl').open('a') as stream:
                        stream.write('\n')
                    mutations.append('retention')
                return loaded

            with timing.unrelated_provenance(), mock.patch.object(analysis, 'load_run', side_effect=change_retention_after_load), \
                    mock.patch.object(sys, 'argv', ['analyze-performance.py', '--run=' + str(timing.run),
                                                  '--retention=' + str(retention.run), '--out=' + str(output),
                                                  '--bootstrap=1000']), redirect_stdout(io.StringIO()):
                with self.assertRaisesRegex(ValueError, 'Acquisition changed before invalid-evidence diagnostic: samples.jsonl'):
                    analysis.main()
            self.assertEqual(mutations, ['retention'])
            self.assertEqual((retention.run / 'samples.jsonl').read_bytes(), original_retention_raw + b'\n')
            self.assertFalse(output.exists())
            for name, original in original_timing.items():
                self.assertEqual((timing.run / name).read_bytes(), original)


class SuccessorScopeRegressions(unittest.TestCase):
    def manifest(self, reference, families):
        return {'families': families, 'preparedManifest': {'acceptedReferenceHead': reference,
                'sources': {'reference': {'git': {'head': reference}}}}}

    def test_current_scope_is_exact_and_historical_interpretation_is_preserved(self):
        self.assertEqual(analysis.analysis_scope(self.manifest(analysis.ACCEPTED_REFERENCE, ['combobox', 'command'])), analysis.ACTIVE_FAMILIES)
        self.assertEqual(analysis.analysis_scope(self.manifest(analysis.HISTORICAL_REFERENCE, ['media', 'combobox', 'command', 'pagination'])), analysis.KNOWN_FAMILIES)
        for families in [[], ['combobox'], ['command'], ['combobox', 'command', 'pagination'], ['media', 'combobox', 'command']]:
            with self.assertRaises(ValueError):
                analysis.analysis_scope(self.manifest(analysis.ACCEPTED_REFERENCE, families))

    def test_scoped_analysis_keeps_budgets_and_combobox_gates_without_retired_results(self):
        before = deepcopy(DESIGNS)
        timing = timing_fixture(analysis.ACTIVE_FAMILIES)
        scoped = analysis.analyze_family_data(timing, None, DESIGNS, bootstrap=1000, families=analysis.ACTIVE_FAMILIES)
        historical = analysis.analyze_family_data(timing, None, DESIGNS, bootstrap=1000)
        self.assertEqual(list(scoped), ['combobox', 'command'])
        self.assertEqual(scoped['combobox'], historical['combobox'])
        self.assertEqual(scoped['command'], historical['command'])
        self.assertEqual(DESIGNS, before)
        self.assertNotEqual(scoped['command']['decision']['automatedStatus'], 'passed', 'incomplete command policy matrix cannot qualify')

    def test_missing_family_jobs_and_retired_observations_cannot_be_projected_away(self):
        timing = timing_fixture(analysis.ACTIVE_FAMILIES)
        missing = deepcopy(timing)
        missing['manifest']['jobs'] = [job for job in missing['manifest']['jobs'] if job['family'] != 'command']
        unexpected = deepcopy(timing)
        unexpected['raw'].append({'status': 'failed', 'job': {'family': 'media'}})
        for invalid in [missing, unexpected]:
            with self.assertRaises(ValueError):
                analysis.analyze_family_data(invalid, None, DESIGNS, bootstrap=1000, families=analysis.ACTIVE_FAMILIES)


if __name__ == '__main__':
    unittest.main()
