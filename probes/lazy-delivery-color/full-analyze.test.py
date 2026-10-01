"""Synthetic parser/statistical contracts, never timing or retention evidence.

Run separately through the pinned recorded Python entry. No browser is started.
The production main still verifies both complete source/runtime preparations;
these pure tests exercise its real validation helpers with authored fixtures.
"""
from pathlib import Path
import copy
import hashlib
import importlib.util
import json
import tempfile
import unittest
import sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('color_full_analysis', Path(__file__).with_name('full-analyze.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)


def owner(actual='global'):
    native = actual != 'unavailable'
    return {'actualRegistry': actual, 'nativeAssociationAvailable': native,
            'definitionRegistrySource': 'native-root-association' if native else 'document-global-api-unavailable',
            'documentGlobalMatchesWindow': True, 'editorOwnedByCurrentDocument': True,
            'editorConstructorMatchesRegistry': True, 'registryIdentityMatchesStartup': True}


def optional_receipt(end, actual='global'):
    observation = owner(actual)
    native = observation['nativeAssociationAvailable']
    entries = []
    for index, tag in enumerate(a.OPTIONAL_TAGS):
        entry = {'index': index, 'tag': tag, 'declaredOptionalRoot': True}
        entry.update({field: True for field in ('connected', 'ownerDocumentMatches', 'constructorMatchesDefinitionRegistry',
                     'renderRootPresent', 'renderRootIsNativeShadow', 'renderRootIsLitRoot', 'renderRootHostMatches',
                     'renderRootDocumentMatches', 'containerDocumentMatches', 'valid')})
        entry.update({field: {'available': native, 'actualRegistry': actual if native else 'unavailable',
                              'matchesOwner': True if native else None}
                      for field in ('hostAssociation', 'containerAssociation', 'renderRootAssociation')})
        entries.append(entry)
    return {'phase': 'after-frozen-ready-endpoint', 'checkedAt': end + 1, 'valid': True,
            **{name: observation[name] for name in ('actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource', 'registryIdentityMatchesStartup')},
            'nativeAssociationQualification': 'verified' if native else 'unsupported',
            'retainedEditorIdentity': {'editorSame': True, 'rootSame': True, 'textboxSame': True},
            'checkedElementCount': len(entries), 'tagCounts': dict.fromkeys(a.OPTIONAL_TAGS, 1), 'entries': entries}


def timing(n=30):
    jobs, rows = [], []
    for index, values in enumerate(sorted(a.expected_timing_keys(n))):
        browser, profile, source, policy, action, arm, block = values
        job = dict(zip(('browser', 'profile', 'sourceKind', 'policy', 'input', 'arm', 'block'), values))
        job.update(id='timing-' + str(index), requestedRegistry='production-default', pairGroup=source,
                   viewport={'width': 390, 'height': 844} if profile == 'phone' else {'width': 1280, 'height': 900},
                   pointerType=('touch' if profile == 'phone' else 'mouse') if action == 'pointer' else None)
        inactive = policy in a.INACTIVE
        startup = 50000 if arm == 'reference' else 44000
        jobs.append(job)
        rows.append({'status': 'ok', 'job': job, 'actualRegistry': 'global', 'errors': [], 'failures': [],
                     'ownership': {'unchanged': True, 'before': owner(), 'after': owner()},
                     'metrics': {'startupReadyMs': 100, 'startupGzipBytes': startup, 'firstReadyMs': None if inactive else 50,
                                 'repeatReadyMs': None if inactive else 20, 'unusedGzipBytes': startup if inactive else None},
                     'snapshots': {'beforePolicy': {'traffic': {'gzipBytes': startup}}, 'final': {'traffic': {'gzipBytes': startup}}},
                     'preparation': {'start': 750, 'activationAt': 1000, 'actualLeadMs': 250, 'verified': True, 'preparationPendingAtActivation': True},
                     'startup': {'state': 'ready', 'beforeInputSetup': True, 'start': 0, 'end': 100, 'durationMs': 100},
                     'first': None if inactive else {'state': 'ready', 'trusted': True, 'start': 1000, 'end': 1050, 'durationMs': 50, 'optionalOwnership': optional_receipt(1050)},
                     'repeat': None if inactive else {'state': 'ready', 'trusted': True, 'start': 2000, 'end': 2020, 'durationMs': 20, 'optionalOwnership': optional_receipt(2020)}})
    return {'manifest': {'jobs': jobs, 'n': n, 'qualification': n == 1}, 'rows': rows, 'summary': {'status': 'complete'}}


def retention():
    jobs, rows = [], []
    for source, arm, policy in [('production', 'reference', 'eager'), ('production', 'candidate', 'cold'),
                                 ('production', 'candidate', 'prepared'), ('controlled', 'reference', 'eager'),
                                 ('controlled', 'candidate', 'same-code')]:
        for block in range(5):
            job = {'id': '-'.join((source, arm, policy, str(block))), 'sourceKind': source, 'arm': arm, 'policy': policy,
                   'browser': 'chromium', 'profile': 'desktop', 'block': block}
            points = [{'cycle': cycle, 'heapBytes': 1000000 + cycle * 100,
                       'dom': {'nodes': 1000, 'jsEventListeners': 50, 'documents': 1},
                       'connected': {**owner(), 'lifecycleCycles': cycle, 'editorSame': True, 'rootSame': True, 'textboxSame': True,
                                     'popupOpen': False, 'optionalConstructed': False, 'sessionElements': 0,
                                     'document': {'nodes': 100, 'elements': 50, 'shadowRoots': 3},
                                     'component': {'nodes': 30, 'elements': 20, 'shadowRoots': 2}}}
                      for cycle in (0, 10, 50, 100)]
            rows.append({'job': job, 'status': 'ok', 'completedCycles': 100, 'actualRegistry': 'global',
                         'ownership': {'unchanged': True, 'before': owner(), 'after': owner()}, 'checkpoints': points,
                         'finalDetached': None, 'finalDetachedUnsupported': 'Synthetic CDP unsupported'})
            jobs.append(job)
    return {'manifest': {'jobs': jobs, 'repetitions': 5, 'cycles': 100, 'qualification': False},
            'rows': rows, 'summary': {'status': 'complete'}}


def write_run(root, events=None, kind='composable-chat-color-full-timing', terminal='ok', complete=True):
    job = {'id': 'original-1'}
    events = events if events is not None else [{'status': 'planned', 'job': job}, {'status': 'started', 'job': job}, {'status': terminal, 'job': job}]
    bindings = {'kind': 'test-byte-identity-only'}
    manifest = {'schemaVersion': 1, 'kind': kind, 'route': a.ROUTE, 'jobs': [job], 'inputBindings': bindings}
    raw = ''.join(json.dumps(row) + '\n' for row in events).encode()
    manifest_bytes = json.dumps(manifest).encode()
    summary = {'schemaVersion': 1, 'kind': kind, 'status': 'complete' if complete else 'aborted' if terminal == 'aborted' else 'incomplete',
               'planned': 1, 'succeeded': int(terminal == 'ok'), 'failed': int(terminal == 'failed'),
               'aborted': int(terminal == 'aborted'), 'notRun': int(terminal == 'not-run'),
               'verification': {'before': a.digest(bindings), 'after': {'verified': True, 'identitySha256': a.digest(bindings)}, 'unchanged': True},
               'manifestSha256': hashlib.sha256(manifest_bytes).hexdigest(), 'samplesSha256': hashlib.sha256(raw).hexdigest()}
    prewarm = [{'key': source + '/' + arm, 'url': 'https://127.0.0.1:10000', 'prewarm': {'path': a.ROUTE, 'bytes': 1, 'sha256': 'a' * 64, 'protocol': 'h2', 'encoding': 'gzip'}}
               for source in ('production', 'controlled') for arm in ('reference', 'candidate')]
    prewarm_bytes = json.dumps(prewarm).encode()
    (root / 'server-prewarm.json').write_bytes(prewarm_bytes)
    summary['serverPrewarmSha256'] = hashlib.sha256(prewarm_bytes).hexdigest()
    (root / 'manifest.json').write_bytes(manifest_bytes)
    (root / 'samples.jsonl').write_bytes(raw)
    (root / 'summary.json').write_text(json.dumps(summary))
    return manifest, summary


def cold_fixture():
    protocol = {'blocks': 30, 'orderSeed': 2026092803, 'bootstrapSeed': 2026092804, 'bootstrapDraws': 10000,
        'confidence': .95, 'maximumAddedReadyMs': 50, 'cpuRate': 4, 'latencyMs': 150, 'downloadBitsPerSecond': 1600000,
        'uploadBitsPerSecond': 750000, 'viewport': {'width': 1280, 'height': 900}, 'reducedMotion': 'reduce'}
    value = {'protocol': protocol, 'schedule': a.cold_schedule(), 'attempts': [], 'coldAssets': ['color.js']}
    events = []
    for block in value['schedule']:
        for ordinal, arm in enumerate(block['order'], 1):
            duration = 100 if arm == 'reference' else 120
            row = {'block': block['block'], 'arm': arm, 'ordinal': ordinal, 'status': 'pass', 'pageErrors': [], 'failedRequests': [],
                   'measurement': {'state': 'ready', 'trusted': True, 'start': 1000, 'end': 1000 + duration, 'durationMs': duration},
                   'editingVerifiedAfterMeasurement': True, 'cancelPreservedDraft': True, 'resourceTimingBufferFull': False,
                   'coldDelivery': {'verified': True, 'assets': ['color.js']}}
            value['attempts'].append(row)
            events.extend([{'event': 'started', **{key: row[key] for key in ('block', 'arm', 'ordinal')}}, {'event': 'terminal', **row}])
    def statistics(v):
        return {'n': 30, 'medianMs': v, 'p75Ms': v, 'minimumMs': v, 'maximumMs': v}
    # Closed-form constant values are authored independently of analyzer math.
    value['summary'] = {'pairs': [{'block': block, 'referenceMs': 100, 'candidateMs': 120, 'differenceMs': 20} for block in range(1, 31)],
        'arms': {'reference': statistics(100), 'candidate': statistics(120)}, 'primaryDifferenceOfArmMediansMs': 20,
        'supportingPairedDifferences': statistics(20),
        'uncertainty': {'lowerMs': 20, 'upperMs': 20, 'confidence': .95, 'draws': 10000, 'seed': 2026092804,
                       'method': 'Paired-block percentile bootstrap; resample common block indices and recompute candidate median minus reference median in every draw.'},
        'decision': 'this cold diagnostic passes; full frozen matrix is still required before any promotion'}
    return value, events


class FullColorContracts(unittest.TestCase):
    def test_full_authored_matrix_is_valid(self):
        run = timing()
        self.assertEqual(a.validate_timing(run), 30)
        self.assertEqual(len(run['rows']), 4620)

    def test_missing_or_duplicate_cell_rejected(self):
        for change in ('missing', 'duplicate', 'different-policy'):
            run = timing()
            if change == 'missing': run['manifest']['jobs'].pop()
            elif change == 'duplicate': run['manifest']['jobs'].append(copy.deepcopy(run['manifest']['jobs'][0]))
            else: run['manifest']['jobs'][0]['policy'] = 'preloaded-replacement'
            with self.subTest(change=change), self.assertRaises(ValueError): a.validate_timing(run)

    def test_negative_metric_and_unsupported_registry_rejected(self):
        for metric in ('startupReadyMs', 'startupGzipBytes'):
            run = timing(); run['rows'][0]['metrics'][metric] = -1
            with self.subTest(metric=metric), self.assertRaises(ValueError): a.validate_timing(run)
        run = timing(); run['rows'][0]['actualRegistry'] = 'unknown'
        with self.assertRaises(ValueError): a.validate_timing(run)

    def test_native_api_unavailable_is_explicit_not_global_inference(self):
        run = timing()
        row = run['rows'][0]; row['actualRegistry'] = 'unavailable'
        row['ownership']['before'] = owner('unavailable'); row['ownership']['after'] = owner('unavailable')
        for phase in ('first', 'repeat'):
            if row.get(phase): row[phase]['optionalOwnership'] = optional_receipt(row[phase]['end'], 'unavailable')
        self.assertEqual(a.validate_timing(run), 30)
        self.assertEqual(row['actualRegistry'], 'unavailable')

    def test_prepared_lead_and_immediate_pending_require_real_evidence(self):
        for policy in ('prepared', 'immediate'):
            run = timing()
            row = next(row for row in run['rows'] if row['job']['arm'] == 'candidate' and row['job']['policy'] == policy and row['job']['profile'] == 'constrained')
            row['preparation']['actualLeadMs'] = 249
            row['preparation']['preparationPendingAtActivation'] = False
            with self.subTest(policy=policy), self.assertRaises(ValueError): a.validate_timing(run)

    def test_matching_median_and_uncertainty_sign(self):
        value = a.compare(tuple((100 + block, 116 + block) for block in range(30)), 100)
        self.assertEqual(value['differenceOfMedians'], 16)
        self.assertEqual(value['upper95'], 16)
        self.assertIsNone(value['candidate']['p95'])
        value = a.compare(tuple((50000, 44000) for _ in range(30)), 100)
        self.assertEqual(value['differenceOfMedians'], -6000)
        self.assertEqual(value['fractionOfReferenceMedian'], -.12)
        self.assertEqual(value['fractionUpper95'], -.12)

    def test_frozen_timing_limit_mapping(self):
        for profile, first, repeat in [('desktop', 16, 4), ('phone', 16, 4), ('constrained', 50, 10)]:
            self.assertEqual(a.timing_limit(profile, 'startupReadyMs'), first)
            self.assertEqual(a.timing_limit(profile, 'firstReadyMs'), first)
            self.assertEqual(a.timing_limit(profile, 'repeatReadyMs'), repeat)
            self.assertEqual(a.timing_limit(profile, 'unusedGzipBytes'), 4096)
        with self.assertRaises(ValueError): a.timing_limit('pooled', 'firstReadyMs')

    def test_fewer_than_thirty_has_no_qualification_bound(self):
        value = a.compare(tuple((10, 11) for _ in range(29)), 100)
        self.assertEqual(value['n'], 29)
        self.assertIsNone(value['upper95'])
        self.assertIsNone(value['pairedBootstrap95'])
        self.assertIsNone(a.describe(list(range(99)))['p95'])
        self.assertIsNotNone(a.describe(list(range(100)))['p95'])

    def test_static_both_thresholds_unchanged(self):
        producer = {'eligibility': {'referenceStartup': {'files': 2, 'rawBytes': 100000, 'gzipBytes': 50000},
            'candidateStartup': {'files': 1, 'rawBytes': 90000, 'gzipBytes': 45000},
            'matchedSavingBytes': 5000, 'matchedSavingFraction': .1, 'coldProbeApplicable': True,
            'gatePlan': {'minimumMatchedStartupGzipSavingBytes': 4096, 'minimumMatchedStartupGzipSavingFraction': .1}}}
        self.assertTrue(a.static_analysis(producer)['qualified'])
        producer['eligibility']['candidateStartup']['gzipBytes'] = 45904
        producer['eligibility'].update(matchedSavingBytes=4096, matchedSavingFraction=4096 / 50000)
        self.assertFalse(a.static_analysis(producer)['qualified'])
        producer['eligibility']['gatePlan']['minimumMatchedStartupGzipSavingBytes'] = 4000
        with self.assertRaises(ValueError): a.static_analysis(producer)

    def test_retention_real_five_by_hundred_baseline(self):
        result = a.retention_analysis(retention())
        self.assertTrue(result['qualified'])
        self.assertEqual(len(result['rows']), 25)
        self.assertTrue(all(row['additionalMedianHeapBytes'] == 0 for row in result['heapComparisons']))

    def test_retention_each_repetition_node_listener_gate(self):
        for metric, value in [('nodes', 1021), ('jsEventListeners', 61)]:
            run = retention(); run['rows'][0]['checkpoints'][-1]['dom'][metric] = value
            result = a.retention_analysis(run)
            self.assertFalse(result['qualified']); self.assertFalse(result['rows'][0]['pass'])

    def test_retention_heap_uses_difference_of_arm_medians(self):
        run = retention()
        for row in run['rows']:
            if row['job']['arm'] == 'candidate' and row['job']['policy'] == 'cold':
                row['checkpoints'][-1]['heapBytes'] += 262144
        self.assertTrue(a.retention_analysis(run)['qualified'])
        for row in run['rows']:
            if row['job']['arm'] == 'candidate' and row['job']['policy'] == 'cold':
                row['checkpoints'][-1]['heapBytes'] += 1
        self.assertFalse(a.retention_analysis(run)['qualified'])

    def test_owner_receipts_require_exact_capability_source_and_predicates(self):
        for actual in ('global', 'scoped', 'unavailable'):
            receipt = {'actualRegistry': actual, 'ownership': {'unchanged': True, 'before': owner(actual), 'after': owner(actual)}}
            self.assertEqual(a.validate_row_owner(receipt), owner(actual))
        for actual in (None, 'null', 'undefined', 'arbitrary'):
            receipt = {'actualRegistry': actual, 'ownership': {'unchanged': True, 'before': owner(), 'after': owner()}}
            receipt['ownership']['before']['actualRegistry'] = receipt['ownership']['after']['actualRegistry'] = actual
            with self.subTest(actual=actual), self.assertRaises(ValueError): a.validate_row_owner(receipt)
        for field in ('nativeAssociationAvailable', 'definitionRegistrySource', *a.OWNER_PREDICATES):
            for mutation in ('missing', 'false'):
                receipt = {'actualRegistry': 'global', 'ownership': {'unchanged': True, 'before': owner(), 'after': owner()}}
                if mutation == 'missing': receipt['ownership']['after'].pop(field)
                else: receipt['ownership']['after'][field] = False
                with self.subTest(field=field, mutation=mutation), self.assertRaises(ValueError): a.validate_row_owner(receipt)

    def test_optional_constructor_receipt_rejects_forged_aggregate_success(self):
        operation = {'end': 1050, 'optionalOwnership': optional_receipt(1050)}
        a.validate_optional_ownership(operation, owner())
        for mutation in ('missing', 'constructor', 'document', 'root', 'count', 'tag', 'before-end', 'retained-editor'):
            changed = copy.deepcopy(operation)
            receipt = changed['optionalOwnership']
            if mutation == 'missing': changed.pop('optionalOwnership')
            elif mutation == 'constructor': receipt['entries'][0]['constructorMatchesDefinitionRegistry'] = False
            elif mutation == 'document': receipt['entries'][0]['ownerDocumentMatches'] = False
            elif mutation == 'root': receipt['entries'][0]['renderRootIsLitRoot'] = False
            elif mutation == 'count': receipt['checkedElementCount'] += 1
            elif mutation == 'tag': receipt['tagCounts']['en-tabs'] = 0
            elif mutation == 'before-end': receipt['checkedAt'] = 1049
            else: receipt['retainedEditorIdentity']['editorSame'] = False
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): a.validate_optional_ownership(changed, owner())

    def test_optional_native_affiliation_capability_is_explicit(self):
        operation = {'end': 1050, 'optionalOwnership': optional_receipt(1050)}
        # Node-level affiliation APIs can be absent even when ShadowRoot's API
        # exists; the recorded supported root association remains mandatory.
        for entry in operation['optionalOwnership']['entries']:
            for field in ('hostAssociation', 'containerAssociation'):
                entry[field] = {'available': False, 'actualRegistry': 'unavailable', 'matchesOwner': None}
        a.validate_optional_ownership(operation, owner())
        unavailable = {'end': 1050, 'optionalOwnership': optional_receipt(1050, 'unavailable')}
        a.validate_optional_ownership(unavailable, owner('unavailable'))
        for mutation in ('missing-root-api', 'foreign-owner', 'invented-native-success'):
            changed = copy.deepcopy(operation)
            affiliation = changed['optionalOwnership']['entries'][0]['renderRootAssociation']
            if mutation == 'missing-root-api': affiliation.update(available=False, actualRegistry='unavailable', matchesOwner=None)
            elif mutation == 'foreign-owner': affiliation.update(actualRegistry='scoped', matchesOwner=True)
            else: changed['optionalOwnership']['nativeAssociationQualification'] = 'unsupported'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): a.validate_optional_ownership(changed, owner())

    def test_retention_preserves_final_detached_diagnostic_without_new_gate(self):
        run = retention()
        observed = {'reportedNodes': 999, 'reportedEditorNodes': 1, 'reportedPickerNodes': 2,
                    'treeRoots': 1, 'raw': [{'synthetic': True}], 'scope': 'Synthetic final diagnostic only'}
        run['rows'][0].update(finalDetached=observed, finalDetachedUnsupported=None)
        result = a.retention_analysis(run)
        self.assertTrue(result['qualified'], 'Detached diagnostic introduces no new numeric limit')
        self.assertEqual(result['rows'][0]['finalDetached'], observed)
        self.assertIsNone(result['rows'][0]['finalDetachedUnsupported'])
        self.assertEqual(result['rows'][1]['finalDetachedUnsupported'], 'Synthetic CDP unsupported')
        self.assertIsNone(result['rows'][1]['finalDetached'])
        run['rows'][0]['checkpoints'][1]['connected']['editorConstructorMatchesRegistry'] = False
        with self.assertRaises(ValueError): a.retention_analysis(run)

    def test_retention_missing_negative_and_unsupported_counters(self):
        for value in (None, -1, 'unsupported'):
            run = retention(); run['rows'][0]['checkpoints'][1]['heapBytes'] = value
            with self.subTest(value=value), self.assertRaises(ValueError): a.retention_analysis(run)
        run = retention(); run['manifest']['jobs'].pop()
        with self.assertRaises(ValueError): a.retention_analysis(run)

    def test_original_traffic_is_rederived_and_negative_counters_rejected(self):
        asset = {'path': 'main.js', 'bytes': 100, 'gzipBytes': 50, 'sha256': 'a' * 64}
        resource = {'name': 'https://127.0.0.1:10000/main.js', 'decodedBodySize': 100, 'encodedBodySize': 50,
                    'transferSize': 70, 'startTime': 1, 'responseEnd': 2, 'nextHopProtocol': 'h2'}
        traffic = {'resources': [{**resource, 'path': 'main.js', 'frozenFileSha256': 'a' * 64}], 'assets': [asset],
                   'requests': 1, 'uniqueRequests': 1, 'rawBytes': 100, 'gzipBytes': 50,
                   'decodedBodyBytes': 100, 'encodedBodyBytes': 50, 'transferBytes': 70}
        run = {'rows': [{'status': 'ok', 'job': {'sourceKind': 'production', 'arm': 'candidate'},
                        'snapshots': {'beforePolicy': {'resources': [resource], 'traffic': traffic}}}],
               'serverPrewarm': [{'key': 'production/candidate', 'url': 'https://127.0.0.1:10000'}]}
        receipts = {'production': {'candidate': {'assets': [asset]}}}
        a.verify_traffic(run, receipts)
        for changed in ('negative', 'total', 'origin'):
            candidate = copy.deepcopy(run)
            snapshot = candidate['rows'][0]['snapshots']['beforePolicy']
            if changed == 'negative': snapshot['resources'][0]['encodedBodySize'] = -1
            elif changed == 'total': snapshot['traffic']['gzipBytes'] = 0
            else: snapshot['resources'][0]['name'] = 'https://elsewhere.invalid/main.js'
            with self.subTest(changed=changed), self.assertRaises(ValueError): a.verify_traffic(candidate, receipts)

    def test_original_input_hashes_and_object_types(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); write_run(root)
            result = a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')
            self.assertEqual(result['counts'], {'ok': 1})
            (root / 'samples.jsonl').write_text('{}\n')
            with self.assertRaisesRegex(ValueError, 'fingerprint'): a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')
            write_run(root); (root / 'summary.json').write_text('[]')
            with self.assertRaisesRegex(ValueError, 'JSON object'): a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')

    def test_failed_aborted_and_unstarted_are_retained(self):
        for terminal in ('failed', 'aborted', 'not-run'):
            with self.subTest(terminal=terminal), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                events = [{'status': 'planned', 'job': {'id': 'original-1'}}]
                if terminal != 'not-run': events.append({'status': 'started', 'job': {'id': 'original-1'}})
                events.append({'status': terminal, 'job': {'id': 'original-1'}, 'reason': 'Retained test failure'})
                write_run(root, events=events, terminal=terminal, complete=False)
                result = a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')
                self.assertEqual(result['rows'][0]['status'], terminal)
                self.assertNotEqual(result['summary']['status'], 'complete')

    def test_duplicate_terminal_and_orphan_checkpoint_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); job = {'id': 'original-1'}
            events = [{'status': 'started', 'job': job}, {'status': 'ok', 'job': job}, {'status': 'ok', 'job': job}]
            write_run(root, events=events)
            with self.assertRaisesRegex(ValueError, 'Duplicate terminal'): a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')
            events = [{'status': 'checkpoint', 'job': job, 'checkpoint': {'cycle': 0}}, {'status': 'not-run', 'job': job}]
            write_run(root, events=events, terminal='not-run', complete=False, kind='composable-chat-color-full-retention')
            with self.assertRaisesRegex(ValueError, 'Orphan'): a.load_run(a.Captured(), root, 'composable-chat-color-full-retention')

    def test_retained_campaign_failure_cannot_be_relabelled_complete(self):
        for status in ('signal', 'campaign-error'):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as folder:
                root = Path(folder); job = {'id': 'original-1'}
                events = [{'status': 'started', 'job': job}, {'status': 'ok', 'job': job}, {'status': status, 'error': 'retained'}]
                write_run(root, events=events)
                with self.assertRaisesRegex(ValueError, 'Complete acquisition'):
                    a.load_run(a.Captured(), root, 'composable-chat-color-full-timing')

    def test_metrics_cannot_replace_actual_trusted_ready_operations(self):
        for change in ('clock', 'trusted', 'startup', 'lead'):
            run = timing()
            row = next(row for row in run['rows'] if row['job']['policy'] == 'prepared')
            if change == 'clock': row['first']['durationMs'] = -1
            elif change == 'trusted': row['first']['trusted'] = False
            elif change == 'startup': row['startup']['beforeInputSetup'] = False
            else: row['preparation']['start'] = 999
            with self.subTest(change=change), self.assertRaises(ValueError): a.validate_timing(run)

    def test_capture_recheck_and_output_disjointness(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); source = root / 'source'; source.mkdir(); file = source / 'input.json'; file.write_text('{}')
            capture = a.Captured(); capture.take(file)
            with self.assertRaisesRegex(ValueError, 'overlaps'): capture.guard_output(source / 'new')
            file.write_text('{"changed":true}')
            with self.assertRaisesRegex(ValueError, 'changed'): capture.recheck()

    def test_capture_output_symlink_alias_is_canonical_and_does_not_write(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            source = base / 'source'; source.mkdir()
            original = source / 'input.json'; original.write_bytes(b'{"synthetic":"immutable"}\n')
            alias = base / 'source-alias'
            try:
                alias.symlink_to(source.name, target_is_directory=True)
            except (OSError, NotImplementedError) as error:
                self.skipTest('This filesystem cannot create the explicit symbolic-link fixture: ' + str(error))
            capture = a.Captured(); capture.take(original)

            def snapshot():
                values = {}
                for path in base.rglob('*'):
                    name = path.relative_to(base).as_posix()
                    if path.is_symlink():
                        values[name] = ('symlink', str(path.readlink()))
                    elif path.is_dir():
                        values[name] = ('directory',)
                    else:
                        values[name] = ('file', path.read_bytes())
                return values

            before = snapshot()
            for candidate in (source / 'new-report', alias / 'new-report', str(alias / 'new-string-report')):
                with self.subTest(candidate=str(candidate)), self.assertRaisesRegex(ValueError, 'overlaps'):
                    capture.guard_output(candidate)
                self.assertEqual(snapshot(), before, 'A rejected path alias must not create or mutate files, directories or links')
            # An alias naming the existing protected root remains an existing
            # output; checking it must not dereference into a new output tree.
            with self.assertRaisesRegex(ValueError, 'Output must be fresh'):
                capture.guard_output(alias)
            self.assertEqual(snapshot(), before)
            capture.guard_output(base / 'allowed-sibling-report')
            self.assertEqual(snapshot(), before, 'A successful guard check must also perform no writes')
            self.assertEqual(original.read_bytes(), b'{"synthetic":"immutable"}\n')
            self.assertEqual(alias.readlink(), Path(source.name))


    def test_recorded_runtime_distribution_and_standalone_file_protect_output(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder).resolve()
            checkout = base / 'checkout'; checkout.mkdir()
            runtime = base / 'browser-distribution'; runtime.mkdir()
            nested = runtime / 'resources'; nested.mkdir()
            executable = runtime / 'browser'; executable.write_text('Synthetic browser identity, never executed')
            standalone_parent = base / 'separate-runtime'; standalone_parent.mkdir()
            standalone = standalone_parent / 'node'; standalone.write_text('Synthetic Node identity, never executed')
            bindings = {'executingRoot': str(checkout), 'runtime': {'files': {
                '../browser-distribution/': {'type': 'directory'},
                '../browser-distribution/resources/': {'type': 'directory'},
                '../browser-distribution/browser': {'digest': 'synthetic'},
                '../separate-runtime/node': {'digest': 'synthetic'}}}}
            before = {path: path.read_bytes() for path in (executable, standalone)}
            capture = a.Captured(); a.protect_bindings(capture, bindings)
            with self.assertRaisesRegex(ValueError, 'overlaps'):
                capture.guard_output(nested / 'new-analysis')
            self.assertIn(standalone, capture.protected)
            self.assertNotIn(standalone_parent, capture.protected, 'A standalone runtime file does not protect unrelated sibling outputs')
            capture.guard_output(standalone_parent / 'allowed-sibling-analysis')
            self.assertFalse((nested / 'new-analysis').exists())
            self.assertFalse((standalone_parent / 'allowed-sibling-analysis').exists())
            self.assertEqual({path: path.read_bytes() for path in before}, before)

    def test_sibling_control_source_and_runtime_rejection(self):
        baseline = {name: {'sha256': 'original'} for name in ('production', 'controlled', 'producer', 'cold', 'harness')}
        baseline.update(executingRoot='/original', runtime={'files': {'node': {'digest': 'node'}, 'chromium': {'digest': 'browser'}}},
                        installation={'lockSha256': 'lock', 'installedLockSha256': 'installed', 'packages': ['exact']})
        a.verify_siblings(baseline, copy.deepcopy(baseline))
        for field in ('controlled', 'runtime', 'installation'):
            other = copy.deepcopy(baseline)
            if field == 'controlled': other[field]['sha256'] = 'different-build'
            elif field == 'runtime': other[field]['files']['chromium']['digest'] = 'different-browser'
            else: other[field]['packages'] = ['different-package']
            with self.subTest(field=field), self.assertRaises(ValueError): a.verify_siblings(baseline, other)

    def test_cold_valid_raw_replays_original_fixed_statistics(self):
        value, events = cold_fixture()
        a.validate_cold_records(value, events)

    def test_cold_forged_summary_or_raw_readiness_cannot_pass(self):
        for field in ('summary', 'trusted', 'order', 'duration', 'failure'):
            value, events = cold_fixture()
            if field == 'summary': value['summary']['primaryDifferenceOfArmMediansMs'] = 0
            elif field == 'trusted': value['attempts'][0]['measurement']['trusted'] = False
            elif field == 'order': value['schedule'][0]['order'].reverse()
            elif field == 'duration': value['attempts'][0]['measurement']['durationMs'] = -1
            else: value['abortRequested'] = {'signal': 'SIGINT'}
            with self.subTest(field=field), self.assertRaises(ValueError): a.validate_cold_records(value, events)


if __name__ == '__main__':
    unittest.main()
