"""Synthetic negative gate regressions. This file does not acquire browser evidence."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

core = load('family_analysis_core', Path(__file__).with_name('analyze-performance.py'))
extra = load('additional_family_gates', Path(__file__).with_name('analyze_additional_families.py'))
DESIGNS = json.loads((ROOT / 'plans/lazy-delivery/family-designs.json').read_text())


def timing(family='pagination', policies=None):
    policies = policies or (('cold', 'same-code') if family == 'command' else ('same-code',))
    jobs, raw = [], []
    for policy in policies:
        for browser, profile in extra.CONFIGS:
            for action in extra.ACTIONS:
                for arm in extra.ARMS:
                    for block in range(30):
                        candidate = arm == 'candidate'
                        job = {'family': family, 'deliveryPolicy': policy, 'browser': browser, 'profile': profile,
                               'action': action, 'arm': arm, 'block': block, 'requestedRegistry': 'production-default',
                               'viewport': {'width': 390, 'height': 844} if profile == 'phone' else {'width': 1280, 'height': 900}}
                        metrics = dict.fromkeys(core.METRICS, 0)
                        metrics.update(startupReadyMs=90 if candidate and family == 'command' else 100,
                                       startupDocumentNodes=850 if candidate else 1000, startupDocumentElements=400,
                                       startupComponentNodes=60 if candidate else 100, startupComponentElements=40,
                                       startupGeneratedNodes=0 if candidate else 30, startupGeneratedElements=0 if candidate else 5,
                                       firstReadyMs=20 if candidate else 18, repeatReadyMs=10, entryGzipBytes=1000,
                                       settledGzipBytes=1000, entryRequests=1, settledRequests=1, encodedBodyBytes=1000, transferBytes=1100)
                        snapshot = {'actualRegistry': 'global', 'workload': {}}
                        if family == 'pagination':
                            pagers = []
                            for name in extra.PAGER_IDS:
                                selected, known = name in extra.ADOPTED_PAGERS, name != 'api-pagination-unknown'
                                count = 0 if not known or selected and candidate else 5
                                pagers.append({'id': name, 'eligible': selected, 'knownTotal': known,
                                               'componentNodes': 80 if candidate and selected else 100,
                                               'contentRendering': 'on-demand' if candidate and selected else 'eager',
                                               'generatedElements': count, 'inputPresent': bool(count), 'shellPresent': known,
                                               'pageCount': 12 if name == 'api-pagination' else 0 if not known else 40,
                                               'page': 1 if name in ('api-pagination', 'api-pagination-unknown') else 6})
                            snapshot['workload'] = {'pagers': pagers, 'items': 7, 'chooserElements': 5 if candidate else 35, 'inputIdentityFailures': 0}
                            endpoint = {name: True for name in ('inputFocused', 'inputEnabled', 'inputValid', 'positionUsable', 'nativePopoverOpen', 'shellSame')}
                            endpoint.update(firstPresentation={'ready': True}, bodyElements=5, defaultPrevented=False, openingEvents=1, nativeClicks=1,
                                            nativeClickTrusted=True, keydownDefaultPrevented=False, inputValue='1')
                        else:
                            snapshot.update(actualRegistry='unregistered', routeRegistry='global')
                            snapshot['workload'] = {'items': 4, 'disabledItems': 2, 'catalogMatches': True, 'hostRegistered': False, 'contentRendering': 'on-demand' if candidate else 'eager',
                                                     'generatedComboboxes': 0 if candidate else 1, 'generatedListboxes': 0 if candidate else 1,
                                                     'generatedRows': 0 if candidate else 4, 'generatedSearchStatuses': 0 if candidate else 1, 'inputSame': True}
                            endpoint = {name: True for name in ('modality', 'searchFocused', 'currentCatalog', 'ariaValid')}
                        opened = copy.deepcopy(snapshot)
                        opened['actualRegistry'] = 'global'
                        if family == 'command':
                            opened['workload'].update(generatedComboboxes=1, generatedListboxes=1, generatedRows=4, generatedSearchStatuses=1, inputSame=True)
                        row = {'status': 'ok', 'job': job, 'browserVersion': 'fixture-browser', 'actualRegistry': 'global', 'metrics': metrics,
                               'startup': {'snapshot': snapshot}, 'first': {'trusted': True, 'snapshot': opened, 'endpoint': endpoint},
                               'second': {'trusted': True, 'snapshot': copy.deepcopy(opened), 'endpoint': copy.deepcopy(endpoint)},
                               'preparation': {'sameCodeReady': policy == 'same-code'}, 'errors': [], 'failures': []}
                        if family == 'pagination':
                            row['second']['endpoint']['inputValue'] = '9'
                        jobs.append(job); raw.extend([{'status': 'started', 'job': job}, row])
    return {'manifest': {'n': 30, 'jobs': jobs, 'actions': list(extra.ACTIONS),
                         'configs': [{'browser': b, 'profile': p} for b, p in extra.CONFIGS],
                         'deliveryPolicies': {family: list(extra.COMMAND_POLICIES) if family == 'command' else ['same-code']},
                         'constrained': extra.CONSTRAINED, 'motion': 'no-preference', 'qualification': False},
            'raw': raw, 'summary': {}, 'integrity': {'verified': True, 'errors': []}}


def retention(family='pagination'):
    jobs, raw = [], []
    for arm in extra.ARMS:
        for lifecycle in ('retained', 'disposed'):
            for block in range(5):
                job = {'family': family, 'arm': arm, 'lifecycle': lifecycle, 'block': block, 'requestedRegistry': 'production-default'}
                points = [{'cycle': cycle, 'heapBytes': 1000000, 'dom': {'jsEventListeners': 10},
                           'connected': {'document': {'nodes': 1000}, 'workload': {'chooserElements': 35, 'inputIdentityFailures': 0}},
                           'detached': {'reportedNodes': 0, 'reportedHostNodes': 0}, 'detachedUnsupported': None, 'commandInstrumentation': {'recordOperations': False, 'operations': [], 'routeEntrySuppressed': False}} for cycle in (0, 10, 50, 100)]
                jobs.append(job); raw.extend([{'status': 'started', 'job': job}, {'status': 'ok', 'job': job, 'actualRegistry': 'global', 'checkpoints': points, 'errors': [], 'failures': []}])
    return {'manifest': {'jobs': jobs, 'repetitions': 5, 'cycles': 100, 'qualification': False}, 'raw': raw,
            'summary': {}, 'integrity': {'verified': True, 'errors': []}}


class AdditionalFamilyGates(unittest.TestCase):
    def test_missing_timing_metric_cannot_qualify(self):
        run = timing()
        next(row for row in run['raw'] if row['status'] == 'ok')['metrics']['firstReadyMs'] = None
        _, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        self.assertFalse(matrix['complete'])

    def test_missing_declared_n_is_not_a_qualifying_default(self):
        run = timing()
        del run['manifest']['n']
        _, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        self.assertFalse(matrix['complete'])

    def test_unknown_pagination_policy_failure_cannot_disappear(self):
        run = timing()
        invalid = copy.deepcopy(next(row for row in run['raw'] if row['status'] == 'ok'))
        invalid['job']['deliveryPolicy'] = 'unexpected'
        invalid['status'] = 'failed'
        run['raw'].append(invalid)
        _, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        self.assertFalse(matrix['complete'])

    def test_duplicate_start_cannot_replace_missing_block(self):
        run = timing()
        run['raw'].append(copy.deepcopy(run['raw'][0]))
        _, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        self.assertFalse(matrix['complete'])

    def test_one_pager_failing_ten_percent_blocks_component_benefit(self):
        run = timing()
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'candidate':
                row['startup']['snapshot']['workload']['pagers'][0]['componentNodes'] = 95
        groups, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        checks = extra._structure_checks('pagination', groups, matrix, vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and 'api-pagination/component-all-nodes-percent' in c['id'] for c in checks))

    def test_component_pass_cannot_hide_whole_route_failure(self):
        run = timing()
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'candidate':
                row['metrics']['startupDocumentNodes'] = 980
        groups, matrix = extra._timing_matrix(run, 'pagination', vars(core))
        rows = extra._rows(groups, 'pagination', 'same-code', vars(core), 5)
        checks = extra._timing_checks('pagination', groups, matrix, rows, vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and 'route-all-nodes' in c['id'] for c in checks))

    def test_cold_command_cannot_substitute_for_same_code(self):
        run = timing('command', ('cold',))
        _, cold = extra._timing_matrix(run, 'command', vars(core), 'cold')
        _, same = extra._timing_matrix(run, 'command', vars(core), 'same-code')
        self.assertTrue(cold['complete'])
        self.assertFalse(same['complete'])

    def test_unregistered_startup_is_required_for_production_cold(self):
        run = timing('command', ('cold',))
        next(row for row in run['raw'] if row['status'] == 'ok')['startup']['snapshot']['workload']['hostRegistered'] = True
        _, matrix = extra._timing_matrix(run, 'command', vars(core), 'cold')
        self.assertFalse(matrix['complete'])

    def test_cold_repeat_regression_cannot_hide_behind_same_code(self):
        run = timing('command', ('cold',))
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'candidate':
                row['metrics']['repeatReadyMs'] = 20
        groups, matrix = extra._timing_matrix(run, 'command', vars(core), 'cold')
        rows = extra._rows(groups, 'command', 'cold', vars(core), 5)
        checks = extra._timing_checks('command', groups, matrix, rows, vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and 'repeat-p75-regression-margin' in c['id'] for c in checks))

    def test_uncertain_max_margin_is_not_passed(self):
        pairs = tuple([(100, 90)] * 15 + [(100, 99)] * 15)
        value, bounds = extra._margin(pairs, .5, 2, .03, vars(core), 1000, improvement=True)
        checks = []
        core.check(checks, 'uncertain-benefit', 'benefit', value, minimum=0, bounds=bounds)
        self.assertEqual(checks[0]['status'], 'uncertain')

    def test_each_arm_pagination_heap_ceiling_is_independent(self):
        run = retention()
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'rollback':
                row['checkpoints'][-1]['heapBytes'] += 40000
        _, _, checks = extra._retention(run, 'pagination', vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and '/rollback/median-post-GC-growth' in c['id'] for c in checks))

    def test_command_retention_cannot_record_observer_operation_history(self):
        run = retention('command')
        next(row for row in run['raw'] if row['status'] == 'ok')['checkpoints'][2]['commandInstrumentation']['recordOperations'] = True
        _, _, checks = extra._retention(run, 'command', vars(core), 5)
        self.assertEqual(next(c for c in checks if c['id'] == 'complete-retention-matrix')['status'], 'pending')

    def test_first_disposed_host_retained_before_cycle_ten_is_detected(self):
        run = retention('command')
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'candidate' and row['job']['lifecycle'] == 'disposed':
                for point in row['checkpoints'][1:]:
                    point['detached']['reportedHostNodes'] = 1
        _, _, checks = extra._retention(run, 'command', vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and 'reported-removed-host-from-zero' in c['id'] for c in checks))

    def test_rollback_heap_growth_uses_the_same_candidate_bound(self):
        run = retention('command')
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'rollback':
                row['checkpoints'][-1]['heapBytes'] += 70000
        _, _, checks = extra._retention(run, 'command', vars(core), 5)
        self.assertTrue(any(c['status'] == 'failed' and c['id'].startswith('rollback/') and 'post-GC-heap-growth' in c['id'] for c in checks))

    def test_missing_detached_diagnostic_cannot_qualify_command(self):
        run = retention('command')
        for row in run['raw']:
            if row['status'] == 'ok' and row['job']['arm'] == 'candidate':
                row['checkpoints'][-1]['detached'] = None
                row['checkpoints'][-1]['detachedUnsupported'] = 'CDP unsupported'
        _, _, checks = extra._retention(run, 'command', vars(core), 5)
        self.assertTrue(any(c['status'] == 'pending' and 'additional-detached-growth' in c['id'] for c in checks))

    def test_repeated_context_or_missing_checkpoint_is_not_complete(self):
        run = retention()
        next(row for row in run['raw'] if row['status'] == 'ok')['checkpoints'].pop(2)
        _, _, checks = extra._retention(run, 'pagination', vars(core), 5)
        self.assertEqual(next(c for c in checks if c['id'] == 'complete-retention-matrix')['status'], 'pending')

    def test_changed_frozen_numeric_clause_does_not_silently_pass(self):
        designs = copy.deepcopy(DESIGNS)
        designs['designs']['command-palette-design']['proposedAcceptanceGates']['bytes'] = 'Adds1025 gzip bytes'
        checks = extra._frozen_contract(designs, 'command', vars(core))
        self.assertEqual(checks[0]['status'], 'pending')


if __name__ == '__main__':
    unittest.main()
