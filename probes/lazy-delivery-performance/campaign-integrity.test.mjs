import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile, cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, relative, resolve} from 'node:path';
import test from 'node:test';
import {digest, inventory, inventoryFiles, verifySource} from './source-seal.mjs';

// Exercise the actual acquisition verifier without importing the campaign's
// Playwright entry point, starting a server, or running a timing sample.
const campaign = await readFile(new URL('./campaign.mjs', import.meta.url), 'utf8');
const start = campaign.indexOf('async function verify() {');
const end = campaign.indexOf('\n// The shared historical server', start);
assert(start >= 0 && end > start, 'Campaign verifier must remain available for isolated provenance checks');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const inputs = ['assert', 'digest', 'readFile', 'resolve', 'relative', 'inventoryFiles', 'verifySource', 'prepared',
  'sourceManifestBytes', 'preparation', 'qualification', 'root', 'budgetsPath', 'budgetsBytes', 'harness', 'support', 'harnessDirectory'];
const verify = new AsyncFunction(...inputs, campaign.slice(start, end).replaceAll('import.meta.dirname', 'harnessDirectory') + '\nreturn verify();');

async function fixture(t, {dirty = false} = {}) {
  const temporary = await mkdtemp(resolve(tmpdir(), 'en-delivery-campaign-integrity-'));
  t.after(() => rm(temporary, {recursive: true, force: true}));
  const root = resolve(temporary, 'live'), prepared = resolve(temporary, 'prepared');
  await mkdir(root); await mkdir(prepared);
  const contents = {
    'package-lock.json': '{"lockfileVersion":3}\n',
    'showcases/performance/package-lock.json': '{"lockfileVersion":3}\n',
    'plans/lazy-delivery/budgets.json': '{"minimumSuccessfulTimingSamplesPerCell":30}\n',
    'probes/lazy-delivery-performance/campaign.mjs': 'export const capture = 1;\n',
    'probes/lazy-delivery-performance/app/date.mjs': 'export const fixture = 1;\n',
    'tooling/support.mjs': 'export const owner = 1;\n',
  };
  for (const [path, bytes] of Object.entries(contents)) {
    await mkdir(dirname(resolve(root, path)), {recursive: true});
    await writeFile(resolve(root, path), bytes);
  }
  const sources = {};
  for (const subject of ['reference', 'candidate']) {
    const snapshot = resolve(temporary, subject), source = resolve(snapshot, 'source');
    await mkdir(snapshot); await cp(root, source, {recursive: true});
    const files = await inventory(source);
    const seal = {schemaVersion: 1, kind: 'en-reve-lazy-delivery-source',
      selection: {id: 'en-reve-production-build-source-v1'}, git: {head: '1'.repeat(40), tree: '2'.repeat(40), dirty: subject === 'candidate' && dirty},
      files, sourceSha256: digest(files), rootLockSha256: files.find(file => file.path === 'package-lock.json').sha256,
      performanceLockSha256: files.find(file => file.path === 'showcases/performance/package-lock.json').sha256};
    seal.sealSha256 = digest(seal);
    await writeFile(resolve(snapshot, 'source-seal.json'), JSON.stringify(seal));
    sources[subject] = {snapshot, ...seal};
  }
  const harnessDirectory = resolve(root, 'probes/lazy-delivery-performance'), harness = await inventory(harnessDirectory);
  const budgetsPath = resolve(root, 'plans/lazy-delivery/budgets.json'), budgetsBytes = await readFile(budgetsPath);
  const support = [{path: 'tooling/support.mjs', sha256: digest(await readFile(resolve(root, 'tooling/support.mjs')))}];
  const preparation = {sources, variants: [], harness: {files: harness, sha256: digest(harness)},
    budgets: {path: relative(root, budgetsPath), sha256: digest(budgetsBytes)}};
  const context = {assert, digest, readFile, resolve, relative, inventoryFiles, verifySource, prepared, preparation,
    qualification: false, root, budgetsPath, budgetsBytes, harness, support, harnessDirectory};
  async function savePreparation() {
    context.sourceManifestBytes = Buffer.from(JSON.stringify(preparation));
    await writeFile(resolve(prepared, 'manifest.json'), context.sourceManifestBytes);
  }
  await savePreparation();
  return {context, savePreparation, run: () => verify(...inputs.map(name => context[name]))};
}

test('acquisition accepts matching preparation and rechecks both source snapshots', async t => {
  const f = await fixture(t);
  await f.run();
  await writeFile(resolve(f.context.preparation.sources.reference.snapshot, 'source/package-lock.json'), '{}\n');
  await assert.rejects(f.run(), /Sealed source changed/);
});

test('self-hashing a changed live harness cannot replace preparation identity', async t => {
  const f = await fixture(t);
  await writeFile(resolve(f.context.harnessDirectory, 'campaign.mjs'), 'export const capture = 2;\n');
  f.context.harness = await inventory(f.context.harnessDirectory);
  await assert.rejects(f.run(), /Executing harness differs from preparation/);
});

test('a rewritten preparation harness still must match candidate sealed source', async t => {
  const f = await fixture(t);
  await writeFile(resolve(f.context.harnessDirectory, 'campaign.mjs'), 'export const capture = 2;\n');
  f.context.harness = await inventory(f.context.harnessDirectory);
  f.context.preparation.harness = {files: f.context.harness, sha256: digest(f.context.harness)};
  await f.savePreparation();
  await assert.rejects(f.run(), /Harness differs from candidate sealed source/);
});

test('preparation cannot omit an executing harness file from sealed inventory', async t => {
  const f = await fixture(t);
  f.context.preparation.harness.files = f.context.preparation.harness.files.filter(file => file.path !== 'campaign.mjs');
  f.context.preparation.harness.sha256 = digest(f.context.preparation.harness.files);
  await f.savePreparation();
  await assert.rejects(f.run(), /Preparation harness paths differ from candidate sealed inventory/);
});

test('capturing new live budgets does not conceal a mismatch with preparation', async t => {
  const f = await fixture(t);
  await writeFile(f.context.budgetsPath, '{"minimumSuccessfulTimingSamplesPerCell":1}\n');
  f.context.budgetsBytes = await readFile(f.context.budgetsPath);
  await assert.rejects(f.run(), /Executing budgets differ from preparation/);
});

test('rewritten preparation budgets cannot replace candidate sealed budgets', async t => {
  const f = await fixture(t);
  await writeFile(f.context.budgetsPath, '{"minimumSuccessfulTimingSamplesPerCell":1}\n');
  f.context.budgetsBytes = await readFile(f.context.budgetsPath);
  f.context.preparation.budgets.sha256 = digest(f.context.budgetsBytes);
  await f.savePreparation();
  await assert.rejects(f.run(), /Budgets differ from candidate sealed source/);
});

test('support self-hashes remain bound to the candidate sealed support', async t => {
  const f = await fixture(t), path = f.context.support[0].path;
  await writeFile(resolve(f.context.root, path), 'export const owner = 2;\n');
  f.context.support[0].sha256 = digest(await readFile(resolve(f.context.root, path)));
  await assert.rejects(f.run(), /Support differs from candidate sealed source/);
});

test('dirty candidate seals are diagnostic qualification inputs only', async t => {
  const f = await fixture(t, {dirty: true});
  await assert.rejects(f.run(), /dirty exploratory candidate/);
  f.context.qualification = true;
  await f.run();
});

test('recorded source identities cannot disagree with the verified snapshot', async t => {
  const f = await fixture(t);
  f.context.preparation.sources.candidate.git = {...f.context.preparation.sources.candidate.git, head: '3'.repeat(40)};
  await f.savePreparation();
  await assert.rejects(f.run(), /candidate source seal differs from preparation/);
});
