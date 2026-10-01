"""Synthetic, complete command-policy receipts; never browser/performance evidence.

These fixtures exercise the exact six-policy matrix and serialized public-loader
receipts. They deliberately use constant matched timings, so a positive contract
fixture does not depend on bootstrap noise or imply measured performance.
"""
import copy
import importlib.util
from pathlib import Path
import unittest


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fixtures = load('additional_family_fixture_source', Path(__file__).with_name('analyze_additional_families.test.py'))
core, extra = fixtures.core, fixtures.extra
REVISION = 'settings-public-loader-policy-v1'
TAGS = ('en-command-palette', 'en-button', 'en-icon')
BYTE_METRICS = ('entryGzipBytes', 'entryRequests', 'settledGzipBytes',
                'settledRequests', 'encodedBodyBytes', 'transferBytes')


def registrations(upgraded=False):
    return {'en-command-palette': upgraded, 'en-button': True, 'en-icon': True}


def operation(identifier, kind, started, completed, before=False, after=False):
    return {'id': identifier, 'kind': kind, 'startedAt': started,
            'completedAt': completed, 'status': 'fulfilled', 'error': None,
            'registrationBefore': registrations(before),
            'registrationAfter': registrations(after),
            'focusBefore': {'tag': 'body', 'id': '', 'name': None},
            'focusAfter': {'tag': 'body', 'id': '', 'name': None},
            'focusUnchanged': True, 'focusUnchangedAtSnapshot': True}


def status(policy, operations, at, *, upgraded=False):
    observed = copy.deepcopy(operations)
    for item in observed:
        if item['completedAt'] > at:
            item.update(completedAt=None, status='pending', registrationAfter=None,
                        focusAfter=None, focusUnchanged=None)
    return {'revision': REVISION, 'deliveryPolicy': policy, 'registry': 'global',
            'expectedTags': list(TAGS), 'recordOperations': True,
            'routeEntrySuppressed': policy not in ('cold', 'same-code'),
            'registrations': registrations(upgraded), 'at': at,
            'operations': observed}


def snapshot(base, *, upgraded=False, opened=False):
    result = copy.deepcopy(base)
    result.update(hostRegistered=upgraded, hostUpgraded=upgraded,
                  actualRegistry='global' if upgraded else 'unregistered',
                  generated={'nodes': 30 if opened or base['workload']['contentRendering'] == 'eager' else 0})
    result['workload']['hostRegistered'] = upgraded
    return result


def add_policy_receipts(row):
    policy = row['job']['deliveryPolicy']
    active = policy != 'unused'
    same_code = policy == 'same-code'
    suppressed = policy not in ('cold', 'same-code')
    lead = int(policy.removeprefix('prepared-')) if policy.startswith('prepared-') else None
    descriptor = {'deliveryPolicy': policy, 'requestedLeadMs': lead,
                  'routeEntrySuppressed': suppressed, 'constructionOnly': same_code,
                  'unused': not active, 'activationRequired': active}
    before = snapshot(row['startup']['snapshot'])
    row['startup']['snapshot'] = copy.deepcopy(before)
    ops = []
    if not suppressed:
        ops.append(operation(0, 'route-entry', 10, 110))
    if same_code:
        controlled = operation(len(ops), 'ensure', 600, 620, after=True)
        ops.append(controlled)
    elif suppressed:
        controlled = operation(len(ops), 'prepare', 600, 700)
        ops.append(controlled)
    else:
        controlled = None
    load = ops[0]
    controlled_id = controlled['id'] if controlled else None
    event_at = (600 + max(10, lead)) if lead is not None else 650
    before_ops = [item for item in ops if item['kind'] == 'route-entry']
    control_at = 621 if same_code else 601
    after = snapshot(before, upgraded=same_code)
    control = {'descriptor': descriptor, 'before': before, 'beforeClosed': True,
               'beforeStatus': status(policy, before_ops, 599), 'after': after,
               'afterClosed': True, 'status': status(policy, ops, control_at, upgraded=same_code),
               'preparationStartedAt': 600 if suppressed else None,
               'operationId': controlled_id}
    activation_status = status(policy, ops, event_at, upgraded=same_code) if active else None
    preactivation = {'at': event_at - 1, 'snapshot': copy.deepcopy(after), 'closed': True,
                     'focusUnchanged': None if policy == 'cold' else True,
                     'status': status(policy, ops, event_at - 1, upgraded=same_code),
                     'preparationPending': bool(controlled and controlled['completedAt'] > event_at - 1),
                     'preparationCompletedAt': controlled['completedAt'] if controlled and controlled['completedAt'] <= event_at - 1 else None} if active else None
    if active:
        # The workflow ensures only an unupgraded first-use host. Once upgraded,
        # its own trigger handles opening; same-code and repeats add no ensure.
        if same_code:
            first_ensure = controlled
            first_ready = event_at + 4
        else:
            first_ensure = operation(len(ops), 'activation-ensure', event_at + 1,
                                     max(event_at + 3, load['completedAt'] + 3),
                                     before=False, after=True)
            ops.append(first_ensure)
            first_ready = first_ensure['completedAt'] + 1
        row['first'].update(started=event_at, readyAt=first_ready,
                            readyMs=first_ready - event_at,
                            deliveryStatus=copy.deepcopy(activation_status))
        row['first']['snapshot'].update(hostRegistered=True, hostUpgraded=True)
        row['first']['snapshot']['workload']['hostRegistered'] = True
        repeat_event = first_ready + 100
        repeat_status = status(policy, ops, repeat_event, upgraded=True)
        row['second'].update(started=repeat_event, readyAt=repeat_event + 10,
                             readyMs=10, deliveryStatus=repeat_status)
        row['second']['snapshot'].update(hostRegistered=True, hostUpgraded=True)
        row['second']['snapshot']['workload']['hostRegistered'] = True
        row['metrics']['firstReadyMs'] = first_ready - event_at
        row['metrics']['repeatReadyMs'] = 10
        completed_at = repeat_event + 15
        measured_ensure = controlled if same_code else first_ensure
    else:
        row['first'] = row['second'] = None
        for name in ('firstReadyMs', 'repeatReadyMs', 'recreatedNodes'):
            row['metrics'][name] = None
        row['actualRegistry'] = 'unregistered'
        completed_at, measured_ensure = 705, None
    completion_snapshot = snapshot(before, upgraded=active, opened=active)
    completion = {'at': completed_at, 'snapshot': completion_snapshot,
                  'closed': not active, 'status': status(policy, ops, completed_at, upgraded=active),
                  'preparationCompletedAt': controlled['completedAt'] if controlled else None,
                  'preparationDurationMs': controlled['completedAt'] - controlled['startedAt'] if controlled else None,
                  'focusChangeDuringActivationIsDescriptive': active}
    observed_control = next((item for item in activation_status['operations'] if item['id'] == controlled_id), None) if activation_status else None
    row['preparation'] = {'revision': REVISION, **descriptor, 'descriptor': copy.deepcopy(descriptor),
                          'sameCodeReady': same_code, 'loadOperationId': load['id'],
                          'loadMs': load['completedAt'] - load['startedAt'],
                          'ensureOperationId': measured_ensure['id'] if measured_ensure else None,
                          'ensureMs': measured_ensure['completedAt'] - measured_ensure['startedAt'] if measured_ensure else None,
                          'actualLeadMs': event_at - 600 if lead is not None else None,
                          'activated': active,
                          'preparationPendingAtActivation': observed_control['status'] == 'pending' if observed_control else None,
                          'preparationCompletedAtActivation': observed_control['completedAt'] if observed_control else None,
                          'preparationCompletedAt': completion['preparationCompletedAt'],
                          'preparationDurationMs': completion['preparationDurationMs'],
                          'actualRouteBenefitEligible': policy == 'cold',
                          'inputApplicability': 'trusted-activation' if active else 'not-applicable-no-activation',
                          'invariantPhase': 'before-activation-and-observed-during-activation' if active else 'actual-completion-without-activation',
                          'control': control, 'preActivation': preactivation,
                          'completion': completion, 'activationStatus': activation_status}
    before_bytes = {name: row['metrics'][name] for name in BYTE_METRICS}
    completed_bytes = copy.deepcopy(before_bytes)
    if suppressed:
        completed_bytes['settledGzipBytes'] += 1000
        completed_bytes['settledRequests'] += 1
        completed_bytes['encodedBodyBytes'] += 1000
        completed_bytes['transferBytes'] += 1100
    row['preparationTraffic'] = {'before': before_bytes, 'completion': completed_bytes,
                                 'final': copy.deepcopy(completed_bytes),
                                 'additionalGzipBytes': completed_bytes['settledGzipBytes'] - before_bytes['settledGzipBytes'],
                                 'additionalRequests': completed_bytes['settledRequests'] - before_bytes['settledRequests']}
    row['final'] = {'snapshot': copy.deepcopy(completion_snapshot), 'errors': []}


def complete_command_run():
    run = fixtures.timing('command', extra.COMMAND_POLICIES)
    # Never-used preparation has one action:none cell, not fake input actions.
    run['manifest']['jobs'] = [job for job in run['manifest']['jobs']
                               if job['deliveryPolicy'] != 'unused' or job['action'] == 'keyboard']
    run['raw'] = [row for row in run['raw']
                  if row['job']['deliveryPolicy'] != 'unused' or row['job']['action'] == 'keyboard']
    for job in run['manifest']['jobs']:
        if job['deliveryPolicy'] == 'unused':
            job['action'] = 'none'
        job['pointerType'] = ('touch' if job['profile'] == 'phone' else 'mouse') if job['action'] == 'pointer' else None
    run['manifest']['deliveryPolicies'] = {'command': list(extra.COMMAND_POLICIES)}
    for row in run['raw']:
        if row['status'] == 'ok':
            add_policy_receipts(row)
    return run


def policy_analysis(run):
    groups, matrices = {}, {}
    for policy in extra.COMMAND_POLICIES:
        groups[policy], matrices[policy] = extra._timing_matrix(run, 'command', vars(core), policy)
    rows, observations, checks = extra._command_delivery_analysis(
        run, groups, matrices, vars(core), 5, {'integrityVerified': True})
    return groups, matrices, rows, observations, checks


def terminal(run, policy, *, arm='candidate', browser='chromium', profile='desktop'):
    return next(row for row in run['raw'] if row['status'] == 'ok' and
                all(row['job'][key] == value for key, value in
                    {'deliveryPolicy': policy, 'arm': arm, 'browser': browser, 'profile': profile}.items()))


class CompleteCommandPolicyContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.valid_run = complete_command_run()

    def mutable_run(self):
        return copy.deepcopy(self.valid_run)

    def assert_blocked(self, run, policy):
        _, _, _, observations, checks = policy_analysis(run)
        invalid = [item for item in observations if item['deliveryPolicy'] == policy and not item['valid']]
        self.assertTrue(invalid, 'Corruption must produce an invalid retained policy observation')
        self.assertNotEqual(core.result_status(checks), 'passed')
        return invalid

    def test_complete_six_policy_public_operation_fixture_passes(self):
        groups, matrices, rows, observations, checks = policy_analysis(self.valid_run)
        self.assertTrue(all(matrix['complete'] for matrix in matrices.values()), matrices)
        self.assertEqual(len(self.valid_run['manifest']['jobs']), 6930)
        self.assertEqual(len(observations), 6930)
        self.assertTrue(all(item['valid'] for item in observations))
        self.assertTrue(rows)
        self.assertEqual(core.result_status(checks), 'passed', [c for c in checks if c['status'] != 'passed'])
        self.assertEqual(core.result_status(extra._command_traffic_checks(groups, matrices, vars(core))), 'passed')
        self.assertEqual({item['action'] for item in observations if item['deliveryPolicy'] == 'unused'}, {'none'})

    def test_cold_no_explicit_operation_accepts_structurally_null_focus(self):
        row = terminal(self.valid_run, 'cold')
        self.assertIsNone(row['preparation']['control']['operationId'])
        self.assertIsNone(row['preparation']['preActivation']['focusUnchanged'])
        _, _, _, observations, _ = policy_analysis(self.valid_run)
        cold = [item for item in observations if item['deliveryPolicy'] == 'cold']
        self.assertEqual(len(cold), 1260)
        self.assertTrue(all(item['valid'] for item in cold))

    def test_missing_unused_policy_never_qualifies(self):
        run = self.mutable_run()
        run['manifest']['jobs'] = [job for job in run['manifest']['jobs'] if job['deliveryPolicy'] != 'unused']
        run['raw'] = [row for row in run['raw'] if row['job']['deliveryPolicy'] != 'unused']
        _, matrices, _, _, checks = policy_analysis(run)
        self.assertFalse(matrices['unused']['complete'])
        self.assertNotEqual(core.result_status(checks), 'passed')

    def test_missing_prepared_engine_cannot_be_covered_by_other_policies(self):
        run = self.mutable_run()
        keep = lambda job: not (job['deliveryPolicy'] == 'prepared-50' and job['browser'] == 'webkit')
        run['manifest']['jobs'] = [job for job in run['manifest']['jobs'] if keep(job)]
        run['raw'] = [row for row in run['raw'] if keep(row['job'])]
        _, matrices, _, _, checks = policy_analysis(run)
        self.assertFalse(matrices['prepared-50']['complete'])
        self.assertTrue(matrices['cold']['complete'])
        self.assertNotEqual(core.result_status(checks), 'passed')

    def test_unused_final_traffic_cannot_hide_behind_startup_bytes(self):
        run = self.mutable_run()
        row = terminal(run, 'unused')
        row['preparationTraffic']['final']['settledGzipBytes'] += 1025
        row['preparationTraffic']['final']['settledRequests'] += 1
        groups, matrices, _, _, _ = policy_analysis(run)
        checks = extra._command_traffic_checks(groups, matrices, vars(core))
        failed = [item for item in checks if item['status'] == 'failed' and item['id'].startswith('unused/')]
        self.assertTrue(any('/final/settledGzipBytes-' in item['id'] for item in failed))
        self.assertTrue(any('/final/settledRequests-' in item['id'] for item in failed))

    def test_missing_final_preparation_traffic_stays_pending(self):
        run = self.mutable_run()
        del terminal(run, 'prepared-200')['preparationTraffic']['final']
        self.assert_blocked(run, 'prepared-200')

    def test_reported_lead_must_match_actual_trusted_activation(self):
        run = self.mutable_run()
        terminal(run, 'prepared-200')['preparation']['actualLeadMs'] += 1
        invalid = self.assert_blocked(run, 'prepared-200')
        self.assertTrue(any('lead' in problem.lower() for item in invalid for problem in item['problems']))

    def test_first_ensure_cannot_be_replaced_by_a_normalized_duration(self):
        run = self.mutable_run()
        preparation = terminal(run, 'cold')['preparation']
        preparation['completion']['status']['operations'] = [
            op for op in preparation['completion']['status']['operations'] if op['kind'] != 'activation-ensure']
        invalid = self.assert_blocked(run, 'cold')
        self.assertTrue(any('ensure' in problem.lower() for item in invalid for problem in item['problems']))

    def test_timing_requires_recorded_public_operations_enabled(self):
        run = self.mutable_run()
        terminal(run, 'prepared-0')['preparation']['completion']['status']['recordOperations'] = False
        self.assert_blocked(run, 'prepared-0')

    def test_immediate_constrained_policy_requires_observed_pending_preparation(self):
        run = self.mutable_run()
        terminal(run, 'prepared-0', profile='constrained')['preparation']['preparationPendingAtActivation'] = False
        self.assert_blocked(run, 'prepared-0')

    def test_retention_requires_disabled_operation_log_at_every_checkpoint(self):
        run = fixtures.retention('command')
        for row in run['raw']:
            if row['status'] != 'ok':
                continue
            for point in row['checkpoints']:
                point['commandInstrumentation'] = {'revision': REVISION, 'deliveryPolicy': 'cold',
                                                    'recordOperations': False, 'operations': [],
                                                    'routeEntrySuppressed': False, 'registry': 'global'}
        _, _, valid_checks = extra._retention(run, 'command', vars(core), 5)
        matrix = next(item for item in valid_checks if item['id'] == 'complete-retention-matrix')
        self.assertEqual(matrix['status'], 'passed')
        row = next(item for item in run['raw'] if item['status'] == 'ok' and item['job']['arm'] == 'candidate')
        row['checkpoints'][2]['commandInstrumentation']['recordOperations'] = True
        _, _, checks = extra._retention(run, 'command', vars(core), 5)
        matrix = next(item for item in checks if item['id'] == 'complete-retention-matrix')
        self.assertNotEqual(matrix['status'], 'passed')


if __name__ == '__main__':
    unittest.main()
