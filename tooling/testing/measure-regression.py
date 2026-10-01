"""Focused negative controls, launched by interruption.test.mjs on each Node runtime."""
import importlib.util
import json
import os
import signal
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('measurement', Path(__file__).with_name('measure.py'))
measurement = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measurement)


class OwnershipTests(unittest.TestCase):
    def test_group_escalation_precedes_reaping(self):
        child = Mock(pid=12345, returncode=None)
        events = []
        child.wait.side_effect = lambda **kwargs: events.append('reap')
        owned = measurement.OwnedCommand(child, True)
        with patch.object(measurement.os, 'killpg', side_effect=lambda pid, sig: events.append(sig)), \
             patch.object(measurement.time, 'monotonic', side_effect=[0, 0, 11]), \
             patch.object(measurement.time, 'sleep'):
            owned.cleanup({})
        self.assertEqual(events, [signal.SIGTERM, 0, signal.SIGKILL, 'reap'])
        child.poll.assert_not_called()
        self.assertFalse(owned.group_owned)

    def test_reaped_leader_has_no_late_group_signal_authority(self):
        child = Mock(pid=12345, returncode=None)
        owned = measurement.OwnedCommand(child, True)
        usage = Mock(ru_maxrss=1, ru_utime=0, ru_stime=0)
        with patch.object(measurement.os, 'wait4', return_value=(child.pid, 0, usage)):
            owned.reap({})
        with patch.object(measurement.os, 'killpg') as killpg:
            owned.cleanup({})
            killpg.assert_not_called()
        child.terminate.assert_not_called()

    def test_lost_child_ownership_does_not_signal_stale_identity(self):
        child = Mock(pid=12345, returncode=None)
        owned = measurement.OwnedCommand(child, True)
        with patch.object(measurement.os, 'waitid', side_effect=ChildProcessError):
            with self.assertRaises(ChildProcessError):
                owned.completed()
        with patch.object(measurement.os, 'killpg') as killpg:
            owned.cleanup({})
            killpg.assert_not_called()
        child.terminate.assert_not_called()


class PublicationTests(unittest.TestCase):
    def run_measure(self, directory):
        return measurement.measure([sys.executable, '-c', 'print("terminal output")'], directory,
                                   Path(directory) / 'receipt', 'publication-regression')[0]

    def setUp(self):
        self.handlers = {s: signal.getsignal(s) for s in (signal.SIGINT, signal.SIGTERM)}

    def tearDown(self):
        for sig, handler in self.handlers.items():
            signal.signal(sig, handler)

    def assert_failed(self, directory):
        receipt = json.loads((Path(directory) / 'receipt/receipt.json').read_text())
        self.assertEqual(receipt['status'], 'failed')
        self.assertEqual(receipt['exitCode'], 1)
        self.assertIn('Interrupted by signal', receipt['error'])
        self.assertEqual(len(receipt['logDigest']), 64)

    def test_cancellation_during_log_processing_publishes_failure(self):
        original = Path.read_text
        def interrupted_read(path, *args, **kwargs):
            if path.name == 'command.log':
                os.kill(os.getpid(), signal.SIGTERM)
            return original(path, *args, **kwargs)
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(Path, 'read_text', interrupted_read):
                self.run_measure(directory)
            self.assert_failed(directory)

    def test_cancellation_during_publication_replaces_running_or_passed_receipt(self):
        original = Path.write_text
        writes = []
        def interrupted_write(path, text, *args, **kwargs):
            result = original(path, text, *args, **kwargs)
            if path.name == 'receipt.tmp':
                writes.append(text)
                if len(writes) == 2:
                    os.kill(os.getpid(), signal.SIGTERM)
                    os.kill(os.getpid(), signal.SIGINT)
            return result
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(Path, 'write_text', interrupted_write):
                self.run_measure(directory)
            self.assert_failed(directory)
            self.assertGreaterEqual(len(writes), 3)

    def test_late_cancellation_republishes_terminal_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(self.run_measure(directory)['status'], 'passed')
            os.kill(os.getpid(), signal.SIGTERM)
            self.assert_failed(directory)

    def cli_boundary(self, boundary):
        # Execute the real __main__ entry in a separate process. The trace sends
        # a real signal at the former return-value/exit race, not a mocked status.
        harness = r'''
import os, runpy, signal, sys
path, boundary, directory = sys.argv[1:]
if boundary == 'pending-at-commit':
    original = signal.pthread_sigmask
    def mask(how, signals):
        result = original(how, signals)
        os.kill(os.getpid(), signal.SIGTERM)
        sys.stderr.write('signal injected\n')
        return result
    signal.pthread_sigmask = mask
else:
    def trace(frame, event, arg):
        if frame.f_code.co_filename == path and (
            (boundary == 'before-commit' and frame.f_code.co_name == 'commit_terminal' and event == 'call') or
            (boundary == 'after-exit-selected' and frame.f_code.co_name == 'main' and event == 'return')
        ):
            sys.settrace(None)
            os.kill(os.getpid(), signal.SIGTERM)
            sys.stderr.write('signal injected\n')
        return trace
    sys.settrace(trace)
sys.argv = [path, '--out', directory, '--label', 'cli-boundary', '--', sys.executable, '-c', 'print("complete")']
runpy.run_path(path, run_name='__main__')
'''
        with tempfile.TemporaryDirectory() as directory:
            output = str(Path(directory) / 'receipt')
            result = subprocess.run([sys.executable, '-c', harness, str(Path(__file__).with_name('measure.py')),
                                     boundary, output], capture_output=True, text=True, timeout=10)
            self.assertIn('signal injected', result.stderr)
            receipt = json.loads((Path(output) / 'receipt.json').read_text())
            self.assertEqual(result.returncode, receipt['exitCode'], (result, receipt))
            return receipt

    def test_cli_cancellation_before_commit_fails_receipt_and_exit(self):
        receipt = self.cli_boundary('before-commit')
        self.assertEqual(receipt['status'], 'failed')
        self.assertEqual(receipt['exitCode'], 1)

    def test_cli_pending_cancellation_at_commit_fails_receipt_and_exit(self):
        receipt = self.cli_boundary('pending-at-commit')
        self.assertEqual(receipt['status'], 'failed')
        self.assertEqual(receipt['exitCode'], 1)

    def test_cli_signal_after_exit_selected_cannot_rewrite_committed_receipt(self):
        receipt = self.cli_boundary('after-exit-selected')
        self.assertEqual(receipt['status'], 'passed')
        self.assertEqual(receipt['exitCode'], 0)


class NativeFailureTests(unittest.TestCase):
    def test_stream_handles_partial_records_and_expected_todo(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'events.jsonl'
            monitor = measurement.NativeFailureMonitor(path)
            self.assertIsNone(monitor.failure())
            path.write_text('{"type":"test:fail","data":{"todo":true}}\n{"type":')
            self.assertIsNone(monitor.failure())
            with path.open('a') as stream:
                stream.write('"test:fail","data":{"name":"seeded"}}\n')
            self.assertEqual(monitor.failure()['data']['name'], 'seeded')
            self.assertIsNone(monitor.failure())

    def test_failure_stops_owned_long_running_command_and_retains_marker(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'events.jsonl'
            output = Path(directory) / 'output'
            program = "import pathlib,time; pathlib.Path(" + repr(str(path)) + ").write_text('" + '{"type":"test:fail","data":{"name":"seeded"}}' + "\\n'); time.sleep(90)"
            result = subprocess.run([sys.executable, str(Path(measurement.__file__)), '--out', str(output), '--label', 'native-failure', '--node-fail-fast-events', str(path), '--', sys.executable, '-c', program], capture_output=True, text=True, timeout=25)
            self.assertEqual(result.returncode, 1, result.stderr)
            receipt = json.loads((output / 'receipt.json').read_text())
            self.assertEqual(receipt['failurePhase'], 'native-node-failure')
            self.assertEqual(receipt['nativeFailure']['data']['name'], 'seeded')
            self.assertLess(receipt['firstFailureSeconds'], 5)
            self.assertLess(receipt['wallSeconds'], 20)


if __name__ == '__main__':
    unittest.main()
