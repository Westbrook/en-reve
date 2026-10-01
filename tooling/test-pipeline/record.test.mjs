import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

test('command recording preserves failures and refuses to replace their evidence', () => {
  const temporary = mkdtempSync(resolve(tmpdir(), 'en-record-test-'));
  const out = resolve(temporary, 'failure');
  try {
    const command = ['tooling/test-pipeline/record.py', '--out', out, '--', process.execPath,
      '-e', 'console.log("retained failure"); process.exit(7)'];
    const first = spawnSync('python3', command, { encoding: 'utf8' });
    assert.equal(first.status, 7, first.stderr);
    const receiptBytes = readFileSync(resolve(out, 'receipt.json'));
    const logBytes = readFileSync(resolve(out, 'command.log'));
    const receipt = JSON.parse(receiptBytes);
    assert.equal(receipt.exitCode, 7);
    assert.equal(receipt.command[0], process.execPath);
    assert.ok(receipt.wallSeconds >= 0);
    assert.ok(receipt.recordingPython.executable);
    assert.match(logBytes.toString(), /retained failure/);
    const second = spawnSync('python3', command, { encoding: 'utf8' });
    assert.notEqual(second.status, 0);
    assert.deepEqual(readFileSync(resolve(out, 'receipt.json')), receiptBytes);
    assert.deepEqual(readFileSync(resolve(out, 'command.log')), logBytes);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
