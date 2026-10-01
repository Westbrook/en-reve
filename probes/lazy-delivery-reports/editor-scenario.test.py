"""Synthetic identity/formula contracts, never performance evidence."""
from pathlib import Path
import copy
import importlib.util
import json
import sys
import tempfile
import unittest
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('scenario', Path(__file__).with_name('editor-scenario.py'))
scenario = importlib.util.module_from_spec(spec); spec.loader.exec_module(scenario)


def fixture():
    jobs, events, cells = [], [], []
    for browser, profile in sorted(scenario.CONFIGS):
        cells.append({'browser': browser, 'profile': profile, 'matchedSuccessfulBlocks': list(range(100))})
        for block in range(100):
            for arm in scenario.ARMS:
                job = {'id': f'{browser}-{profile}-{block}-{arm}', 'browser': browser, 'profile': profile, 'block': block, 'arm': arm}
                jobs.append(job)
                events.extend([{'status': 'started', 'job': job}, {'status': 'ok', 'job': job, 'requestedRegistry': 'production-global', 'actualRegistry': 'global', 'errors': [], 'failures': [],
                    'metrics': {'startupMs': 100 + block + (10 if arm == 'candidate' else 0), 'firstSelectionMs': 20 + block + (4 if arm == 'candidate' else 0)}}])
    return {'schemaVersion': 1, 'subject': 'editor-contextual-toolbar', 'validation': {'valid': True}, 'qualifiedForMeasuredGates': False,
            'inputs': {'manifest': {'qualification': False, 'jobs': jobs}, 'summary': {'status': 'complete', 'qualification': False}}, 'cells': cells}, events


class ScenarioContracts(unittest.TestCase):
    def test_linearity_and_same_block_changes(self):
        analysis, events = fixture(); result = scenario.calculate(analysis, events)
        self.assertEqual(result['status'], 'descriptive-complete')
        rows = [row for row in result['comparisons'] if row['comparison'] == 'candidateMinusReference']
        for row in rows:
            self.assertAlmostEqual(row['meanPairedDeltaMs'], 10 + 4 * row['usage'])
            self.assertAlmostEqual(row['beforeMeanIndexMs'], 149.5 + row['usage'] * 69.5)
        self.assertFalse(result['originalQualifiedForMeasuredGates'], 'Descriptive index cannot rescue failed original gates')

    def test_incomplete_or_missing_metric_produces_no_numbers(self):
        for mutation in ('invalid', 'missing', 'duplicate', 'qualify'):
            analysis, events = fixture()
            if mutation == 'invalid': analysis['validation']['valid'] = False
            elif mutation == 'missing': del events[1]['metrics']['firstSelectionMs']
            elif mutation == 'duplicate': events.append(copy.deepcopy(events[1]))
            else: analysis['inputs']['manifest']['qualification'] = True
            result = scenario.calculate(analysis, events)
            self.assertEqual(result['status'], 'unavailable')
            self.assertEqual(result['arms'], []); self.assertEqual(result['comparisons'], [])

    def test_hash_bound_raw_identity(self):
        analysis, events = fixture()
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            inputs = {'manifest.json': json.dumps(analysis['inputs']['manifest']).encode(), 'summary.json': json.dumps(analysis['inputs']['summary']).encode(),
                      'samples.jsonl': ''.join(json.dumps(row) + '\n' for row in events).encode()}
            for name, value in inputs.items(): (root / name).write_bytes(value)
            analysis['inputDirectory'] = str(root); analysis['inputSha256'] = {name: scenario.digest(value) for name, value in inputs.items()}
            path = root / 'comparison.json'; path.write_text(json.dumps(analysis))
            self.assertEqual(scenario.load_bound(path)['status'], 'descriptive-complete')
            (root / 'samples.jsonl').write_text('changed')
            with self.assertRaisesRegex(ValueError, 'changed'): scenario.load_bound(path)


if __name__ == '__main__': unittest.main()
