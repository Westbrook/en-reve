"""Synthetic analysis contracts only; these fixtures are never performance evidence."""
from pathlib import Path
import hashlib, json, subprocess, sys, tempfile, unittest

ROOT = Path(__file__).resolve().parents[2]
CONFIGURATIONS = [('chromium', 'desktop', 'keyboard'), ('firefox', 'desktop', 'keyboard'), ('webkit', 'desktop', 'keyboard'), ('chromium', 'constrained', 'keyboard'), ('chromium', 'constrained-mobile', 'touch')]
class AnalysisContracts(unittest.TestCase):
    def analyze(self, run, manifest, raw, *, failed=False):
        (run / 'manifest.json').write_text(json.dumps(manifest))
        terminal = sum(row['status'] in ('ok', 'failed', 'aborted') for row in raw)
        (run / 'summary.json').write_text(json.dumps({'status': 'incomplete' if failed else 'complete', 'succeeded': sum(row['status'] == 'ok' for row in raw), 'terminal': terminal, 'planned': len(manifest.get('jobs', [])) or terminal}))
        (run / 'samples.jsonl').write_text(''.join(json.dumps(row) + '\n' for row in raw))
        subprocess.run([sys.executable, str(ROOT / 'probes/lazy-delivery-performance/analyze.py'), '--run=' + str(run), '--bootstrap=1000'], check=True, capture_output=True, text=True)
        result = json.loads((run / 'analysis.json').read_text())
        self.assertEqual(result['summarySha256'], hashlib.sha256((run / 'summary.json').read_bytes()).hexdigest())
        return result

    def complete_fixture(self, base, *, policy=None, date_fixture=None, mutate=None):
        """All API cells, optionally one independent date-policy matrix; never real evidence."""
        run = Path(base) / 'run'; run.mkdir()
        prepared = Path(base) / 'prepared'; prepared.mkdir()
        variants = [{'id': subject + '/api-' + name, 'subject': subject, 'family': 'api', 'policy': name}
                    for subject, name in [('reference', 'selective'), ('reference', 'canonical'), ('candidate', 'selective'), ('candidate', 'canonical'), ('candidate', 'profile')]]
        comparisons = [{'id': variant['id'] + '-overhead', 'reference': 'reference/api-' + ('selective' if variant['policy'] == 'profile' else variant['policy']),
                        'candidate': variant['id'], 'kind': 'api-overhead'} for variant in variants if variant['subject'] == 'candidate']
        if policy:
            for subject in ('reference', 'candidate'):
                for name in ('eager', policy):
                    fixture = date_fixture if date_fixture and name != 'eager' else name
                    variant = {'id': subject + '/date-' + fixture, 'subject': subject, 'family': 'date', 'policy': name}
                    variants.append(variant)
                    if name != 'eager': comparisons.append({'id': variant['id'] + '-benefit', 'reference': subject + '/date-eager', 'candidate': variant['id'], 'kind': 'date-benefit'})
                    if subject == 'candidate': comparisons.append({'id': variant['id'] + '-migration', 'reference': 'reference/date-' + fixture, 'candidate': variant['id'], 'kind': 'migration'})
        prepared_variants = variants + [{'id': 'candidate/metadata', 'family': 'metadata'}]
        for variant in prepared_variants:
            out = prepared / variant['id']; out.mkdir(parents=True)
            (out / 'receipt.json').write_text(json.dumps({'assets': [{'path': 'boot.js', 'gzipBytes': 100}], 'startupGzipBytes': 100}))
            variant['receiptSha256'] = hashlib.sha256((out / 'receipt.json').read_bytes()).hexdigest()
        budgets = json.loads((ROOT / 'plans/lazy-delivery/budgets.json').read_text())
        n, repetitions = budgets['minimumSuccessfulTimingSamplesPerCell'], budgets['retention']['freshContextsPerArm']
        manifest = {'qualification': False, 'n': n, 'repetitions': repetitions, 'comparisons': comparisons, 'variants': variants, 'budgets': {'values': budgets},
                    'configs': [dict(zip(('browser', 'profile', 'input'), configuration)) for configuration in CONFIGURATIONS], 'modes': ['global', 'scoped'],
                    'preparation': {'path': str(prepared), 'identity': {'variants': prepared_variants}}}
        raw = []
        for variant in variants:
            metrics = {'shellReadyMs': 10, 'startupNodes': 1000, 'startupJSBytes': 10000}
            if variant['family'] == 'api': metrics.update({'startupJSRequests': 1, 'loadMs': 1, 'ensureMs': 1})
            elif variant['policy'] in ('unused', 'abandoned'): metrics.update({variant['policy'] + 'Bytes': 9000, variant['policy'] + 'Nodes': 500})
            else: metrics.update({'firstReadyMs': 10, 'repeatReadyMs': 10})
            if variant['family'] == 'date' and variant['policy'] != 'eager': metrics['startupNodes'] = 500
            for browser, profile, interaction in CONFIGURATIONS:
                for mode in ('global', 'scoped'):
                    for block in range(n):
                        raw.append({'status': 'ok', 'job': {'kind': 'timing', 'variant': variant['id'], 'browser': browser, 'profile': profile, 'input': interaction, 'requestedMode': mode, 'block': block}, 'actualMode': mode, 'metrics': dict(metrics)})
            for mode in ('global', 'scoped'):
                for block in range(repetitions):
                    raw.append({'status': 'ok', 'job': {'kind': 'retention', 'variant': variant['id'], 'browser': 'chromium', 'profile': 'desktop', 'input': 'keyboard', 'requestedMode': mode, 'block': block},
                                'actualMode': mode, 'checkpoints': [{'cycle': cycle, 'heapBytes': 100000, 'dom': {'nodes': 100, 'jsEventListeners': 10, 'documents': 1}} for cycle in budgets['retention']['checkpoints']]})
        # Freeze the actual planned job identities before deliberate damage.
        manifest['jobs'] = [dict(row['job']) for row in raw]
        started = [{'status': 'started', 'job': dict(job)} for job in manifest['jobs']]
        if mutate: mutate(manifest, raw)
        return self.analyze(run, manifest, started + raw)

    def policy(self, data, name):
        return next(item for item in data['decisions']['datePolicies'] if item['variant'] == 'candidate/date-' + name)

    def fixture(self, base, *, mismatch=False, failed=False):
        run = Path(base) / 'run'; run.mkdir()
        prepared = Path(base) / 'prepared'; prepared.mkdir()
        variants = [{'id': arm + '/api-selective', 'subject': arm, 'fixture': 'api-selective', 'family': 'api', 'policy': 'selective'} for arm in ('reference', 'candidate')]
        comparison = {'id': 'candidate-versus-reference', 'reference': variants[0]['id'], 'candidate': variants[1]['id'], 'kind': 'api-overhead'}
        for variant in variants:
            out = prepared / variant['id']; out.mkdir(parents=True)
            (out / 'receipt.json').write_text(json.dumps({'assets': [{'path': 'boot.js', 'gzipBytes': 100}], 'startupGzipBytes': 100}))
        manifest = {'qualification': True, 'comparisons': [comparison], 'variants': variants,
                    'budgets': {'values': json.loads((ROOT / 'plans/lazy-delivery/budgets.json').read_text())},
                    'configs': [{'browser': 'chromium', 'profile': 'desktop', 'input': 'keyboard'}], 'modes': ['global'],
                    'preparation': {'path': str(prepared), 'identity': {'variants': variants}}}
        raw = []
        for block in range(2):
            for arm in ('reference', 'candidate'):
                raw.append({'status': 'ok', 'job': {'kind': 'timing', 'variant': arm + '/api-selective', 'browser': 'chromium', 'profile': 'desktop', 'input': 'keyboard', 'requestedMode': 'global', 'block': block},
                            'actualMode': 'scoped' if mismatch and arm == 'candidate' else 'global',
                            'metrics': {'shellReadyMs': 10 + block + (2 if arm == 'candidate' else 0), 'startupJSRequests': 1}})
        if failed: raw.append({'status': 'failed', 'job': {'kind': 'timing'}, 'error': 'Retained deliberate failure'})
        return self.analyze(run, manifest, raw, failed=failed)

    def test_paired_deltas_and_tail_limit(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.fixture(base)
        row = next(row for row in data['rows'] if row['metric'] == 'shellReadyMs')
        self.assertEqual(row['delta'], 2)
        self.assertEqual(row['interval'], [2, 2])
        self.assertEqual(row['n'], 2)
        self.assertIsNone(row['p95'])
        self.assertEqual(data['automatedGate'], 'not-qualified')
        self.assertFalse(data['fullStageBMatrix'])

    def test_actual_registry_modes_never_pool(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.fixture(base, mismatch=True)
        self.assertEqual(data['rows'], [])
        self.assertTrue(any('Matched reference including actual registry mode' in item['reason'] for item in data['missingComparisons']))
        self.assertEqual(data['automatedGate'], 'not-qualified')

    def test_failures_are_retained_and_prevent_qualification(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.fixture(base, failed=True)
        self.assertFalse(data['complete'])
        self.assertEqual(len(data['failedOrAborted']), 1)
        self.assertEqual(data['failedOrAborted'][0]['error'], 'Retained deliberate failure')
        self.assertEqual(data['automatedGate'], 'not-qualified')

    def test_complete_api_is_independent_of_missing_date_matrix(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base)
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'pass')
        self.assertTrue(data['decisions']['apiOverhead']['matrixComplete'])
        self.assertFalse(data['fullStageBMatrix'])
        self.assertEqual(data['automatedGate'], 'not-qualified')

    def test_static_shell_control_uses_its_matching_fixture_baseline(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, policy='cold', date_fixture='shell-static')
        decision = self.policy(data, 'shell-static')
        self.assertTrue(decision['matrixComplete'])
        self.assertTrue(decision['comparisonsComplete'])
        self.assertEqual(decision['migration']['status'], 'pass')
        self.assertEqual(decision['recommendation'], 'qualified-for-this-fixture')
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'pass')

    def test_null_and_absent_required_metrics_cannot_qualify(self):
        def damage(manifest, raw):
            for row in raw:
                if row['job']['kind'] == 'timing' and row['job']['variant'] == 'candidate/api-selective':
                    row['metrics']['loadMs'] = None
                    del row['metrics']['ensureMs']
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        decision = data['decisions']['apiOverhead']
        self.assertEqual(decision['status'], 'not-qualified')
        self.assertFalse(decision['matrixComplete'])
        for metric in ('loadMs', 'ensureMs'):
            gate = next(item for item in data['checks'] if item['id'].startswith('candidate/api-selective-overhead:') and item['id'].endswith(':' + metric))
            self.assertEqual(gate['status'], 'missing-metric')
            self.assertEqual(gate['n'], 0)
            self.assertTrue(any(item.get('metric') == metric for item in data['missingComparisons']))

    def test_missing_comparison_cannot_qualify_from_remaining_gates(self):
        def damage(manifest, raw):
            manifest['comparisons'] = [item for item in manifest['comparisons'] if item['candidate'] != 'candidate/api-profile']
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        self.assertTrue(data['decisions']['apiOverhead']['matrixComplete'])
        self.assertFalse(data['decisions']['apiOverhead']['comparisonsComplete'])
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'not-qualified')

    def test_missing_acquisition_declarations_cannot_qualify(self):
        for field in ('jobs', 'n', 'repetitions'):
            with self.subTest(field=field):
                def damage(manifest, raw): del manifest[field]
                with tempfile.TemporaryDirectory() as base:
                    data = self.complete_fixture(base, mutate=damage)
                self.assertEqual(data['decisions']['apiOverhead']['status'], 'not-qualified')

    def test_modified_prepared_size_receipt_cannot_qualify(self):
        def damage(manifest, raw):
            receipt = Path(manifest['preparation']['path']) / 'candidate/metadata/receipt.json'
            receipt.write_text(json.dumps({'assets': [{'path': 'boot.js', 'gzipBytes': 1}], 'startupGzipBytes': 1}))
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        self.assertFalse(data['complete'])
        self.assertFalse(data['assetReceiptsVerified'])
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'not-qualified')
        gate = next(item for item in data['checks'] if item['id'] == 'candidate/metadata:descriptor-gzip')
        self.assertEqual(gate['status'], 'missing-metric')

    def test_mismatched_block_and_config_cannot_count_as_complete(self):
        def damage(manifest, raw):
            row = next(row for row in raw if row['job']['kind'] == 'timing' and row['job']['variant'] == 'candidate/api-profile')
            row['job']['block'] = manifest['n']
            manifest['configs'][-1] = manifest['configs'][0]
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        self.assertFalse(data['complete'])
        self.assertFalse(data['jobCoverageComplete'])
        self.assertFalse(data['decisions']['apiOverhead']['matrixComplete'])
        self.assertFalse(data['fullStageBMatrix'])
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'not-qualified')

    def test_unused_and_abandoned_byte_overage_blocks_only_own_policy(self):
        for policy in ('unused', 'abandoned'):
            with self.subTest(policy=policy):
                def damage(manifest, raw):
                    for row in raw:
                        if row['job']['kind'] == 'timing' and row['job']['variant'] == 'candidate/date-' + policy:
                            row['metrics'][policy + 'Bytes'] = 15000
                with tempfile.TemporaryDirectory() as base:
                    data = self.complete_fixture(base, policy=policy, mutate=damage)
                decision = self.policy(data, policy)
                self.assertTrue(decision['matrixComplete'])
                self.assertEqual(decision['benefit']['status'], 'pass')
                self.assertEqual(decision['delivery']['status'], 'fail')
                self.assertEqual(decision['recommendation'], 'not-qualified')
                self.assertEqual(data['decisions']['apiOverhead']['status'], 'pass')

    def test_api_node_and_listener_retention_failures_reach_decision(self):
        def damage(manifest, raw):
            row = next(row for row in raw if row['job']['kind'] == 'retention' and row['job']['variant'] == 'candidate/api-profile')
            checkpoint = next(item for item in row['checkpoints'] if item['cycle'] == 100)
            checkpoint['dom']['nodes'] += 21
            checkpoint['dom']['jsEventListeners'] += 11
            checkpoint['dom']['documents'] += 1
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        decision = data['decisions']['apiOverhead']
        self.assertEqual(decision['status'], 'fail')
        for suffix in (':nodes10to100', ':listeners10to100'):
            gate = next(item for item in data['checks'] if item['status'] == 'fail' and item['id'].endswith(suffix))
            self.assertIn(gate['id'], decision['checks'])
        self.assertTrue(any(row['documentDelta'] == 1 for row in data['retention']))

    def test_retention_requires_unique_blocks_and_every_checkpoint(self):
        def damage(manifest, raw):
            rows = [row for row in raw if row['job']['kind'] == 'retention' and row['job']['variant'] == 'candidate/api-profile' and row['job']['requestedMode'] == 'global']
            rows[1]['job']['block'] = rows[0]['job']['block']
            rows[2]['checkpoints'] = [item for item in rows[2]['checkpoints'] if item['cycle'] != 50]
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, mutate=damage)
        self.assertFalse(data['complete'])
        self.assertFalse(data['decisions']['apiOverhead']['matrixComplete'])
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'not-qualified')
        self.assertEqual(len(data['invalidRetention']), 1)

    def test_benefit_uncertainty_crossing_minimum_is_not_pass(self):
        def damage(manifest, raw):
            for row in raw:
                job = row['job']
                if job['kind'] == 'timing' and job['variant'] == 'candidate/date-prepared' and (job['browser'], job['profile'], job['requestedMode']) == ('chromium', 'desktop', 'global'):
                    row['metrics']['startupNodes'] = 550 if job['block'] < 16 else 900
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, policy='prepared', mutate=damage)
        decision = self.policy(data, 'prepared')
        self.assertEqual(decision['benefit']['status'], 'uncertain')
        self.assertEqual(decision['recommendation'], 'not-qualified')
        gate = next(item for item in data['checks'] if item['id'] == 'candidate/date-prepared-benefit:chromium:desktop:keyboard:global:global:component-benefit-nodes')
        self.assertGreaterEqual(gate['value'], gate['minimum'])
        self.assertLess(gate['interval'][0], gate['minimum'])
        self.assertEqual(gate['minimum'], 40)
        self.assertEqual(gate['n'], 30)

    def test_benefit_or_alternative_preserves_original_thresholds(self):
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, policy='prepared')
        decision = self.policy(data, 'prepared')
        self.assertEqual(decision['benefit']['status'], 'pass')
        self.assertEqual(decision['recommendation'], 'qualified-for-this-fixture')
        self.assertTrue(any(item.get('alternative') and item['status'] == 'fail' for item in data['checks']))
        self.assertTrue(data['allNumericChecksPass'])

    def test_cold_latency_failure_remains_diagnostic(self):
        def damage(manifest, raw):
            for row in raw:
                if row['job']['kind'] == 'timing' and row['job']['variant'] == 'candidate/date-cold': row['metrics']['firstReadyMs'] = 100
        with tempfile.TemporaryDirectory() as base:
            data = self.complete_fixture(base, policy='cold', mutate=damage)
        self.assertEqual(self.policy(data, 'cold')['latency']['status'], 'fail')
        self.assertEqual(self.policy(data, 'cold')['recommendation'], 'diagnostic-only')
        self.assertEqual(data['decisions']['apiOverhead']['status'], 'pass')

if __name__ == '__main__': unittest.main()
