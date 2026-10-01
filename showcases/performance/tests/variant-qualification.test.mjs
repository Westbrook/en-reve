import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { variantQualification } from '../src/variant-qualification.mjs';
import { run } from '../src/runner.mjs';
import { root as labRoot } from '../src/config.mjs';
import { specializedPathways } from '../../../tooling/testing/specialized.mjs';

const variant = { id: 'current-en-reve', fingerprint: 'exact-current-variant' };
const good = { passed: true, engine: 'chromium', variantFingerprint: variant.fingerprint };
async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), 'en-variant-receipt-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, 'reports'));
  const defaultPath = resolve(root, 'reports/functional-current-en-reve.json');
  await writeFile(defaultPath, JSON.stringify(good));
  return { root, defaultPath, explicitPath: resolve(root, 'reports/functional-owned-current-en-reve.json') };
}

test('standalone variant qualification keeps its default path and legacy engine omission', async t => {
  const f = await fixture(t);
  const legacy = { passed: true, variantFingerprint: variant.fingerprint };
  await writeFile(f.defaultPath, JSON.stringify(legacy));
  const result = await variantQualification({ root: f.root, variant });
  assert.deepEqual(result.receipt, legacy);
  assert.equal(result.source.path, f.defaultPath);
  assert.equal(result.source.sha256, createHash('sha256').update(await readFile(f.defaultPath)).digest('hex'));
});

test('explicit qualification selects the owned receipt and leaves a stale default unchanged', async t => {
  const f = await fixture(t), stale = JSON.stringify({ ...good, passed: false });
  await writeFile(f.defaultPath, stale);
  await writeFile(f.explicitPath, JSON.stringify(good));
  const result = await variantQualification({ root: f.root, variant, functionalReceipt: f.explicitPath });
  assert.deepEqual(result.receipt, good);
  assert.equal(result.source.path, f.explicitPath);
  assert.equal(result.source.sha256, createHash('sha256').update(await readFile(f.explicitPath)).digest('hex'));
  assert.equal(await readFile(f.defaultPath, 'utf8'), stale);
});

test('missing, malformed, failed, wrong-variant and wrong-engine owned receipts cannot fall back', async t => {
  const f = await fixture(t);
  const selected = () => variantQualification({ root: f.root, variant, functionalReceipt: f.explicitPath });
  await assert.rejects(selected(), { code: 'ENOENT' });
  await writeFile(f.explicitPath, '{');
  await assert.rejects(selected(), SyntaxError);
  for (const receipt of [
    { ...good, passed: false }, { ...good, passed: 'true' },
    { ...good, variantFingerprint: 'stale' }, { ...good, engine: 'firefox' },
    { passed: true, variantFingerprint: variant.fingerprint },
  ]) {
    await writeFile(f.explicitPath, JSON.stringify(receipt));
    await assert.rejects(selected(), /passing Chromium functional qualification/);
  }
  assert.deepEqual(JSON.parse(await readFile(f.defaultPath)), good);
});

test('functional receipt option requires a variant before creating a run', async () => {
  const id = 'receipt-negative-' + randomUUID();
  await assert.rejects(run({ suite: 'load', id, 'functional-receipt': 'unused.json' }), /requires a consumer variant/);
  await assert.rejects(access(resolve(labRoot, 'runs', id)), { code: 'ENOENT' });
});

test('every specialized current measurement binds its own Chromium producer receipt', async () => {
  const graph = await specializedPathways();
  const producer = graph.tasks.find(task => task.id === 'native:current-functional');
  const id = producer.command[producer.command.indexOf('--id') + 1];
  const name = producer.command[producer.command.indexOf('--variant') + 1];
  const expected = resolve(labRoot, 'reports', `functional-${id}-${name}.json`);
  const runs = graph.tasks.filter(task => /^native:(sentinel|full):current:(load|interactions)$/.test(task.id));
  assert.equal(runs.length, 4);
  for (const task of runs) {
    assert.equal(task.command.filter(arg => arg === '--functional-receipt').length, 1);
    assert.equal(task.command[task.command.indexOf('--functional-receipt') + 1], expected);
    assert.equal(task.command[task.command.indexOf('--samples') + 1], '30');
    assert(task.command.includes('--id'));
  }
});
