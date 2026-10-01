"""Fresh receipts for direct Node/Python/custom/campaign commands; never reuses outcomes."""
import argparse
import datetime
import hashlib
import json
import os
import platform
import re
import signal
import subprocess
import time
from pathlib import Path


class OwnedCommand:
    def __init__(self, child, group_owned):
        self.child = child
        self.group_owned = group_owned
        self.signal_authority = True

    def completed(self):
        if self.group_owned:
            # WNOWAIT retains the leader's PID even when it has exited. No other
            # process group can acquire that numeric identity before we reap it.
            try:
                return os.waitid(os.P_PID, self.child.pid, os.WEXITED | os.WNOHANG | os.WNOWAIT) is not None
            except ChildProcessError:
                self.group_owned = False
                self.signal_authority = False
                raise
        return self.child.poll() is not None

    def reap(self, receipt):
        if self.group_owned:
            try:
                _, status, usage = os.wait4(self.child.pid, 0)
            except ChildProcessError:
                self.group_owned = False
                self.signal_authority = False
                raise
            self.group_owned = False
            self.signal_authority = False
            self.child.returncode = os.waitstatus_to_exitcode(status)
            receipt['resourceUsage'] = dict(
                maximumProcessRSS=usage.ru_maxrss,
                rssUnits='bytes' if platform.system() == 'Darwin' else 'KiB',
                userSeconds=usage.ru_utime, systemSeconds=usage.ru_stime,
                limitation='OS child usage; not a sampled aggregate process-tree memory peak.')
        else:
            self.child.wait()

    def cleanup(self, receipt, grace_seconds=10):
        if self.group_owned:
            receipt['interruptedProcessOwnership'] = 'new-session process group'
            try:
                os.killpg(self.child.pid, signal.SIGTERM)
                deadline = time.monotonic() + grace_seconds
                while time.monotonic() < deadline:
                    # Never poll/reap here: the unreaped leader anchors the group
                    # through the last possible escalation, including after exit.
                    os.killpg(self.child.pid, 0)
                    time.sleep(.05)
                os.killpg(self.child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            except OSError as error:
                receipt.setdefault('cleanupErrors', []).append(repr(error))
        elif self.signal_authority and self.child.returncode is None:
            receipt['interruptedProcessOwnership'] = 'direct child only; descendant ownership unavailable'
            self.child.terminate()
        else:
            receipt['interruptedProcessOwnership'] = 'reaped or unproven child; no remaining signal authority'
        try:
            self.child.wait(timeout=10)
            self.group_owned = False
            self.signal_authority = False
        except subprocess.TimeoutExpired as error:
            # Keep the outcome bounded and honest. Do not reap then signal an
            # old group identifier, or wait indefinitely after a failed cleanup.
            receipt.setdefault('cleanupErrors', []).append(repr(error))


def measure(command, cwd, output, label):
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=False)
    receipt = dict(schemaVersion=1, label=label, command=command, cwd=str(Path(cwd).resolve()),
                   startedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                   platform=platform.platform(),
                   environmentDigest=hashlib.sha256(json.dumps(dict(os.environ), sort_keys=True).encode()).hexdigest(),
                   status='running', reused=False)
    cancelled = []
    published = False

    def persist():
        (output / 'receipt.tmp').write_text(json.dumps(receipt, indent=2) + '\n')
        (output / 'receipt.tmp').replace(output / 'receipt.json')

    def apply_cancellation():
        if cancelled:
            receipt.update(exitCode=1, status='failed', error='Interrupted by signal ' + str(cancelled[0]),
                           failurePhase=receipt.get('failurePhase', 'command-or-terminal-publication'))

    def interrupted(signum, frame):
        # The handler must never unwind log hashing or atomic publication. Keep
        # recording cancellation after a successful command and after publication.
        if not cancelled:
            cancelled.append(signum)
            if published:
                apply_cancellation()
                persist()

    previous = {s: signal.signal(s, interrupted) for s in (signal.SIGINT, signal.SIGTERM)}
    persist()
    start = time.monotonic()
    owned = None
    try:
        with (output / 'command.log').open('w') as log:
            group_owned = os.name != 'nt' and all(hasattr(os, key) for key in ('waitid', 'WNOWAIT', 'wait4'))
            child = subprocess.Popen(command, cwd=cwd, stdout=log, stderr=subprocess.STDOUT,
                                     start_new_session=group_owned)
            owned = OwnedCommand(child, group_owned)
            while not owned.completed():
                if cancelled:
                    raise KeyboardInterrupt('Interrupted by signal ' + str(cancelled[0]))
                time.sleep(.01)
            if cancelled:
                raise KeyboardInterrupt('Interrupted by signal ' + str(cancelled[0]))
            owned.reap(receipt)
        receipt.update(exitCode=child.returncode, status='passed' if child.returncode == 0 else 'failed')
    except BaseException as error:
        receipt.update(exitCode=1, status='failed', error=repr(error), failurePhase='command-launch-or-wait')
        if owned is not None:
            try:
                owned.cleanup(receipt)
            except BaseException as cleanup_error:
                receipt.setdefault('cleanupErrors', []).append(repr(cleanup_error))
    finally:
        receipt.update(wallSeconds=time.monotonic() - start,
                       finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
        try:
            text = (output / 'command.log').read_text() if (output / 'command.log').exists() else ''
            receipt['logDigest'] = hashlib.sha256(text.encode()).hexdigest()
            receipt['nodeOutcomes'] = {k: int(v) for k, v in re.findall(r'^# (tests|pass|fail|skipped|cancelled|todo) (\d+)', text, re.M)}
            receipt['selectedCaseNames'] = re.findall(r'^# Subtest: (.+)', text, re.M)
            durations = [float(v) for v in re.findall(r'^\s+duration_ms: ([0-9.]+)', text, re.M)]
            receipt['maximumReportedCaseMs'] = max(durations, default=None)
        except BaseException as error:
            receipt.update(exitCode=1, status='failed', error=repr(error), failurePhase='terminal-log-processing')
        cancellation_published = bool(cancelled)
        apply_cancellation()
        persist()
        published = True
        # A first cancellation during persist() was recorded, not raised; repeat
        # publication once with the failed outcome. Later signals use the handler.
        if cancelled and not cancellation_published:
            apply_cancellation()
            persist()
    def commit_terminal():
        # Freeze signal-driven outcome changes before choosing the CLI status.
        # Cancellation observed before this boundary is failed; signals after
        # commitment cannot rewrite the receipt behind an already-chosen exit.
        signals = {signal.SIGINT, signal.SIGTERM}
        if hasattr(signal, 'pthread_sigmask'):
            signal.pthread_sigmask(signal.SIG_BLOCK, signals)
            pending_signals = signal.sigpending() & signals
            if pending_signals:
                interrupted(min(pending_signals), None)
        for signum in signals:
            signal.signal(signum, signal.SIG_IGN)
        apply_cancellation()
        persist()
        return receipt['exitCode'] if receipt['exitCode'] >= 0 else 128 - receipt['exitCode']

    # The CLI commits before returning an exit status. Regression callers which
    # only inspect measure() restore the returned previous handlers themselves.
    return receipt, previous, commit_terminal


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    parser.add_argument('--cwd', default='.')
    parser.add_argument('--label', required=True)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('supply a command after --')
    receipt, _, commit_terminal = measure(command, args.cwd, args.out, args.label)
    exit_code = commit_terminal()
    print(json.dumps({key: receipt[key] for key in ['label', 'status', 'exitCode', 'wallSeconds']}))
    return exit_code


if __name__ == '__main__':
    raise SystemExit(main())
