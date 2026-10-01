import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {inside, uniqueBindings, entryBytes, receiptBytes, verifyAssetTree, acquisitionInstallation, finalizeAcquisition, validateArms, validateArmReceipt, sha} from './performance-common.mjs';

const asset = {path: 'entry.js', bytes: 4, gzipBytes: 24, sha256: sha('code')};
const entry = {roots: ['entry.js'], assets: ['entry.js'], gzipBytes: 24, requests: 1};
const receipt = {assets: [asset], routes: {'/fixture.html': {entry}}};
const origin = 'https://localhost:1234';
const resource = {name: origin + '/entry.js', origin, path: '/entry.js', encodedBodySize: 24, transferSize: 64, protocol: 'h2'};
async function temporary(t) {const directory = await mkdtemp(resolve(tmpdir(), 'en-family-provenance-')); t.after(() => rm(directory, {recursive: true, force: true})); return directory;}

test('unsafe and duplicate frozen receipt paths are rejected', () => {
  for (const path of ['../entry.js', '/entry.js', 'nested/../entry.js', '']) assert.throws(() => inside('/tmp/fixture', path));
  assert.throws(() => uniqueBindings([asset, asset], 'fixture'), /duplicate/);
  assert.throws(() => uniqueBindings([{...asset, sha256: ''}], 'fixture'), /invalid hash/);
});

test('deterministic entry metrics cannot conceal missing, duplicate or nonfinite bytes', () => {
  assert.deepEqual(entryBytes(receipt, entry, 'fixture'), {gzipBytes: 24, requests: 1});
  assert.throws(() => entryBytes(receipt, {...entry, assets: ['entry.js', 'entry.js']}, 'fixture'), /duplicate/);
  assert.throws(() => entryBytes(receipt, {...entry, gzipBytes: 23}, 'fixture'), /sum mismatch/);
  assert.throws(() => entryBytes({assets: [{...asset, gzipBytes: null}]}, entry, 'fixture'), /gzip/);
});

test('observed executable resources must be local, fully attributed and complete', () => {
  assert.equal(receiptBytes(receipt, '/fixture.html', [resource], origin).settledGzipBytes, 24);
  assert.throws(() => receiptBytes(receipt, '/fixture.html', [{...resource, name: 'https://foreign.invalid/entry.js'}], origin), /external/);
  assert.throws(() => receiptBytes(receipt, '/fixture.html', [{...resource, origin: 'https://foreign.invalid'}], origin), /origin annotation/);
  assert.throws(() => receiptBytes(receipt, '/fixture.html', [{...resource, encodedBodySize: null}], origin), /byte metric/);
  assert.throws(() => receiptBytes(receipt, '/fixture.html', [], origin), /Missing observed/);
  assert.throws(() => receiptBytes(receipt, '/fixture.html', [{...resource, path: '/other.js'}], origin), /path annotation/);
});

test('asset inventories reject extra files and missing files, not just changed hashes', async t => {
  const directory = await temporary(t); await writeFile(resolve(directory, 'entry.js'), 'code');
  await verifyAssetTree(directory, [asset], 'fixture');
  await writeFile(resolve(directory, 'injected.js'), 'extra');
  await assert.rejects(verifyAssetTree(directory, [asset], 'fixture'), /asset set changed/);
  await rm(resolve(directory, 'injected.js')); await rm(resolve(directory, 'entry.js'));
  await assert.rejects(verifyAssetTree(directory, [asset], 'fixture'), /asset set changed/);
});

test('installed driver code changes alter acquisition identity despite unchanged versions', async t => {
  const directory = await temporary(t), packages = {};
  const manifests = {'@playwright/test': {dependencies: {playwright: '1.0.0'}}, playwright: {dependencies: {'playwright-core': '1.0.0'}}, 'playwright-core': {}};
  for (const [name, properties] of Object.entries(manifests)) {
    const path = 'node_modules/' + name; await mkdir(resolve(directory, path), {recursive: true});
    await writeFile(resolve(directory, path, 'package.json'), JSON.stringify({name, version: '1.0.0', main: 'index.js', ...properties})); await writeFile(resolve(directory, path, 'index.js'), 'module.exports = {};');
    packages[path] = {version: '1.0.0', integrity: 'sha512-synthetic-fixture'};
  }
  await writeFile(resolve(directory, 'package-lock.json'), JSON.stringify({lockfileVersion: 3, packages})); await writeFile(resolve(directory, 'node_modules/.package-lock.json'), JSON.stringify({lockfileVersion: 3, packages}));
  const before = await acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', directory);
  await writeFile(resolve(directory, 'node_modules/playwright-core/index.js'), 'module.exports = {changed: true};');
  const after = await acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', directory); assert.notEqual(after.digest, before.digest); assert.equal(after.packages.length, 3);
  packages['node_modules/playwright-core'].integrity = 'sha512-changed'; await writeFile(resolve(directory, 'node_modules/.package-lock.json'), JSON.stringify({lockfileVersion: 3, packages}));
  await assert.rejects(acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', directory), /integrity differs/);
});

async function syntheticDriverInstallation(directory) {
  const path = 'node_modules/@playwright/test', packages = {[path]: {version: '1.0.0', integrity: 'sha512-synthetic-fixture'}};
  await mkdir(resolve(directory, path), {recursive: true});
  await writeFile(resolve(directory, path, 'package.json'), JSON.stringify({name: '@playwright/test', version: '1.0.0', main: 'index.js'}));
  await writeFile(resolve(directory, path, 'index.js'), 'module.exports = {};');
  const lock = JSON.stringify({lockfileVersion: 3, packages});
  await writeFile(resolve(directory, 'package-lock.json'), lock); await writeFile(resolve(directory, 'node_modules/.package-lock.json'), lock);
}

test('an explicit workspace symlink alias preserves canonical acquisition identity', async t => {
  const directory = await temporary(t), workspace = resolve(directory, 'workspace'), alias = resolve(directory, 'workspace-alias');
  await syntheticDriverInstallation(workspace); await symlink(workspace, alias, 'junction');
  const direct = await acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', workspace);
  const aliased = await acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', alias);
  assert.equal(aliased.digest, direct.digest); assert.deepEqual(aliased, direct);
  assert.deepEqual(aliased.packages.map(pkg => pkg.path), ['node_modules/@playwright/test']);
});

test('an external package symlink is rejected despite matching exact locks', async t => {
  const directory = await temporary(t), workspace = resolve(directory, 'workspace'), external = resolve(directory, 'external');
  await syntheticDriverInstallation(workspace); await syntheticDriverInstallation(external);
  const packagePath = 'node_modules/@playwright/test';
  await rm(resolve(workspace, packagePath), {recursive: true}); await symlink(resolve(external, packagePath), resolve(workspace, packagePath), 'junction');
  await assert.rejects(acquisitionInstallation('probes/lazy-delivery-families/performance.mjs', workspace), /Unsafe or noncanonical receipt path/);
});

test('final verification runs after acquisition failure and preserves both failures', async t => {
  const directory = await temporary(t), raw = resolve(directory, 'samples.jsonl'); let calls = 0;
  await writeFile(raw, JSON.stringify({status: 'failed', error: 'original attempt'}) + '\n');
  await assert.rejects(finalizeAcquisition({out: directory, manifest: {verifiedBefore: '2026-09-28T00:00:00.000Z'}, verify: async () => {calls++; throw new Error('changed source');}}, {successful: 0, planned: 3}, new Error('browser failure')), AggregateError);
  assert.equal(calls, 1); const rows = (await readFile(raw, 'utf8')).trim().split('\n').map(line => JSON.parse(line)); assert.equal(rows[0].error, 'original attempt'); assert.equal(rows[1].status, 'integrity-failed');
  const summary = JSON.parse(await readFile(resolve(directory, 'summary.json'))); assert.equal(summary.integrityVerified, false); assert.equal(summary.status, 'incomplete'); assert.equal(summary.errors.length, 2);
  const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'))), {manifestSha256, ...payload} = manifest;
  assert.equal(manifestSha256, sha(JSON.stringify(payload))); assert.equal(manifest.rawSha256, sha(await readFile(raw))); assert.equal(manifest.summarySha256, sha(await readFile(resolve(directory, 'summary.json')))); assert.equal(manifest.verifiedAfter, null);
});

test('arm role, route path, source bytes and source seal cannot be substituted', () => {
  const arms = [{id: 'reference', subject: 'reference', policy: 'eager'}, {id: 'candidate', subject: 'candidate', policy: 'on-demand'}, {id: 'rollback', subject: 'candidate', policy: 'eager'}].map(arm => ({...arm, root: arm.id, receipt: arm.id + '/receipt.json', routeSubjects: ['media', 'combobox']}));
  validateArms(arms);
  assert.throws(() => validateArms([...arms, arms[1]]), /Three exact/);
  assert.throws(() => validateArms(arms.map(arm => arm.id === 'candidate' ? {...arm, subject: 'reference'} : arm)), /identity mismatch/);
  assert.throws(() => validateArms(arms.map(arm => arm.id === 'candidate' ? {...arm, receipt: 'reference/receipt.json'} : arm)), /receipt path mismatch/);
  const source = {sourceSha256: sha('source'), sealSha256: sha('seal')}, armReceipt = {...arms[1], ...source, registry: 'production-global'};
  validateArmReceipt(arms[1], armReceipt, source);
  assert.throws(() => validateArmReceipt(arms[1], {...armReceipt, sourceSha256: sha('other source')}, source), /source identity/);
  assert.throws(() => validateArmReceipt(arms[1], {...armReceipt, sealSha256: sha('other provenance')}, source), /seal identity/);
});
