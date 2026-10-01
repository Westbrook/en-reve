import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { calibrate } from '../src/calibrate.mjs';
import { functional } from '../src/functional.mjs';

test('calibration rejects an occupied explicit receipt before acquiring browser resources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'calibration-output-'));
  try {
    const output = join(directory, 'receipt.json');
    await writeFile(output, 'retained calibration\n');
    await assert.rejects(calibrate({ output }), /already exists/);
    assert.equal(await readFile(output, 'utf8'), 'retained calibration\n');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('functional qualification rejects path traversal run ids before creating artifacts', async () => {
  await assert.rejects(functional({ id: '../previous-run' }), /Invalid functional run id/);
});
