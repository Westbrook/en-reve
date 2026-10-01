import assert from 'node:assert/strict';
import {readFile, writeFile, appendFile, mkdir, realpath} from 'node:fs/promises';
import {resolve, relative, dirname, isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import {get as httpsGet} from 'node:https';
import {createHash} from 'node:crypto';
import {executionRuntimeIdentity} from '../../tooling/testing/runtime-identity.mjs';
import {serve} from '../scoped-hydration/production/server.mjs';
import {inventory, digest, digestFile, verifySource} from '../lazy-delivery-performance/source-seal.mjs';
export const root = resolve(import.meta.dirname, '../..');
import {routeAdapters} from './family-adapters.mjs';
import {acceptedReferenceHead, activeFamilies, assertActiveFamilies, assertSourceSubjects} from './route-build-contract.mjs';
export {routeAdapters};
export const arg = (name, fallback) => process.argv.find(value => value.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
export const sha = value => createHash('sha256').update(value).digest('hex');
export function randomizer(seed) {let state = seed >>> 0; return values => {const out = [...values]; for (let i = out.length - 1; i > 0; i--) {state = (Math.imul(1664525, state) + 1013904223) >>> 0; const j = Math.floor(state / 4294967296 * (i + 1)); [out[i], out[j]] = [out[j], out[i]];} return out;};}
export function inside(base, path) {assert(typeof path === 'string' && path.length && !isAbsolute(path), 'Expected relative receipt path'); const target = resolve(base, path), name = relative(base, target); assert(name && name !== '..' && !name.startsWith('../') && !isAbsolute(name) && name.replaceAll('\\', '/') === path, 'Unsafe or noncanonical receipt path: ' + path); return target;}
export function uniqueBindings(files, label) {assert(Array.isArray(files) && files.length, label + ' missing'); const result = new Map(); for (const item of files) {inside(root, item.path); assert(!result.has(item.path), label + ' contains duplicate path: ' + item.path); assert(/^[a-f0-9]{64}$/.test(item.sha256), label + ' has invalid hash: ' + item.path); result.set(item.path, item);} return result;}
export const budgetPaths = ['plans/lazy-delivery/family-designs.json', 'plans/lazy-delivery/editor.md', 'plans/lazy-delivery/budgets.json', 'plans/lazy-delivery/validation.md', 'plans/lazy-delivery/pagination.md', 'plans/lazy-delivery/color-popup.md'];
export const supportPaths = ['probes/lazy-delivery-performance/source-seal.mjs', 'probes/scoped-hydration/production/server.mjs', 'showcases/performance/src/lock.mjs', 'showcases/performance/src/config.mjs', 'showcases/performance/registry/systems.json', 'showcases/performance/profiles/profiles.json', 'tooling/testing/machine-owner.mjs', 'tooling/testing/execution-owner.mjs', 'tooling/testing/runtime-identity.mjs', 'tooling/evidence/setup.mjs', 'tooling/evidence/identity.ts', 'tooling/test-pipeline/npm-pack.mjs', 'apps/docs/tests/static-server.mjs', ...budgetPaths, 'package-lock.json', 'showcases/performance/package-lock.json'];

/** Bind the resolved driver code as well as the separately inventoried browser binaries. */
export async function acquisitionInstallation(script, workspace = root) {
  workspace = await realpath(workspace);
  const lockBytes = await readFile(resolve(workspace, 'package-lock.json')), installedBytes = await readFile(resolve(workspace, 'node_modules/.package-lock.json'));
  const lock = JSON.parse(lockBytes), installed = JSON.parse(installedBytes), packages = new Map(), edges = [], absentOptional = [];
  async function visit(name, from, optional = false) {
    const require = createRequire(from); let manifestPath;
    try {manifestPath = require.resolve(name + '/package.json');} catch (error) {if (optional && error.code === 'MODULE_NOT_FOUND') {absentOptional.push({from: relative(workspace, from), name}); return;} throw error;}
    const directory = await realpath(dirname(manifestPath)), path = relative(workspace, directory).replaceAll('\\', '/'); inside(workspace, path);
    assert(path.startsWith('node_modules/'), 'Acquisition package is outside the exact-lock installation: ' + name);
    edges.push({from: relative(workspace, from).replaceAll('\\', '/'), name, path, optional});
    if (packages.has(path)) return;
    const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'))), expected = lock.packages?.[path], actual = installed.packages?.[path];
    assert(expected && actual && !expected.link && !actual.link, 'Resolved acquisition package missing from exact locks: ' + path);
    assert.equal(pkg.name, name); assert.equal(pkg.version, expected.version); assert.equal(actual.version, expected.version);
    assert(expected.integrity && actual.integrity === expected.integrity, 'Installed acquisition integrity differs from exact lock: ' + path);
    const files = await inventory(directory), entry = {path, name, version: pkg.version, integrity: expected.integrity, manifestSha256: await digestFile(resolve(directory, 'package.json')), files, sha256: digest(files)}; packages.set(path, entry);
    const dependencies = {...pkg.dependencies, ...pkg.optionalDependencies};
    for (const dependency of Object.keys(dependencies).sort()) await visit(dependency, resolve(directory, 'package.json'), Object.hasOwn(pkg.optionalDependencies ?? {}, dependency));
  }
  await visit('@playwright/test', inside(workspace, script));
  const identity = {lockSha256: digest(lockBytes), installedLockSha256: digest(installedBytes), packages: [...packages.values()].sort((a, b) => a.path.localeCompare(b.path)), edges, absentOptional, policy: 'Resolved Playwright package manifests, complete package file trees and declared runtime/optional dependency closure; exact root and installed lock identities. Browser distributions are bound separately.'};
  return {...identity, digest: digest(identity)};
}

export async function verifyAssetTree(directory, assets, label) {
  const expected = uniqueBindings(assets, label), actual = await inventory(directory);
  assert.deepEqual(actual.map(item => item.path).sort(), [...expected.keys()].sort(), label + ' asset set changed');
  for (const item of actual) {const frozen = expected.get(item.path); assert.equal(item.type, 'file', label + ' must contain ordinary assets'); assert.equal(item.sha256, frozen.sha256, label + ' changed: ' + item.path); assert.equal(item.bytes, frozen.bytes, label + ' byte length changed: ' + item.path); assert(Number.isSafeInteger(frozen.gzipBytes) && frozen.gzipBytes >= 0, label + ' missing gzip bytes: ' + item.path);}
}
export function entryBytes(receipt, entry, label) {
  const assets = uniqueBindings(receipt.assets, label + ' assets'); assert(Array.isArray(entry?.assets) && entry.assets.length, label + ' entry closure missing');
  assert.equal(new Set(entry.assets).size, entry.assets.length, label + ' duplicate entry asset');
  const gzipBytes = entry.assets.reduce((sum, path) => {const asset = assets.get(path); assert(asset && Number.isSafeInteger(asset.gzipBytes) && asset.gzipBytes >= 0, label + ' missing entry gzip: ' + path); return sum + asset.gzipBytes;}, 0);
  assert.equal(entry.gzipBytes, gzipBytes, label + ' entry gzip sum mismatch'); assert.equal(entry.requests, entry.assets.length, label + ' entry request count mismatch');
  return {gzipBytes, requests: entry.assets.length};
}

export function validateArms(arms) {
  const expected = {reference: {subject: 'reference', policy: 'eager'}, candidate: {subject: 'candidate', policy: 'on-demand'}, rollback: {subject: 'candidate', policy: 'eager'}};
  assert(Array.isArray(arms)); assert.deepEqual(arms.map(arm => arm.id).sort(), Object.keys(expected).sort(), 'Three exact matched arms required');
  for (const arm of arms) {assert.deepEqual({subject: arm.subject, policy: arm.policy}, expected[arm.id], 'Arm identity mismatch'); assert.equal(arm.root, arm.id, 'Arm root mismatch'); assert.equal(arm.receipt, arm.id + '/receipt.json', 'Arm receipt path mismatch');}
}
export function validateArmReceipt(arm, receipt, source) {
  for (const key of ['id', 'subject', 'policy', 'root']) assert.equal(receipt[key], arm[key], 'Arm receipt mismatch: ' + key);
  assert.equal(receipt.sourceSha256, source.sourceSha256, 'Arm source identity mismatch'); assert.equal(receipt.sealSha256, source.sealSha256, 'Arm seal identity mismatch'); assert.equal(receipt.registry, 'production-global'); assert.deepEqual(receipt.routeSubjects, arm.routeSubjects);
}

/** Call under the same machine/execution/browser lease that owns the acquisition. */
export async function openInputs(script, browsers) {
  assert(!process.env.NODE_OPTIONS && !process.env.NODE_PATH && !process.env.ESBUILD_BINARY_PATH, 'Unset Node/bundler overrides before acquiring exact-source evidence');
  const preparedArg = arg('prepared'), outArg = arg('out', process.env.EN_EXECUTION_OUTPUT); assert(preparedArg && outArg, 'Supply --prepared and a fresh --out or EN_EXECUTION_OUTPUT');
  const prepared = resolve(preparedArg), out = resolve(outArg); await mkdir(out, {recursive: false});
  try {
    const manifestBytes = await readFile(resolve(prepared, 'manifest.json')), preparedManifest = JSON.parse(manifestBytes), {manifestSha256, ...payload} = preparedManifest;
    assert.equal(preparedManifest.schemaVersion, 1); assert.equal(preparedManifest.kind, 'en-reve-lazy-delivery-actual-docs-build');
    assert.equal(preparedManifest.status, 'complete', 'Incomplete actual-route preparation'); assert.equal(digest(payload), manifestSha256, 'Prepared manifest digest mismatch');
    assert.equal(preparedManifest.build?.colorControls?.enabled, false, 'Separate color construction controls cannot supply production family evidence');
    const arms = preparedManifest.arms; validateArms(arms);
    const requestedFamilies = arg('families', activeFamilies.join(',')).split(','); assertActiveFamilies(requestedFamilies);
    const families = activeFamilies.filter(family => requestedFamilies.includes(family));
    assert(process.argv.includes('--qualification') || families.length === activeFamilies.length, 'Family subsets require explicit qualification; full acquisition requires combobox and command');
    assert.equal(preparedManifest.acceptedReferenceHead, acceptedReferenceHead, 'Prepared reference is retired or undeclared');
    const binding = uniqueBindings(preparedManifest.harness?.files, 'Frozen acquisition harness'); assert.equal(digest(preparedManifest.harness.files), preparedManifest.harness.sha256, 'Harness digest mismatch');
    const harness = await inventory(import.meta.dirname), editorHarness = await inventory(resolve(root, 'probes/lazy-delivery-editor')), colorHarness = await inventory(resolve(root, 'probes/lazy-delivery-color'));
    const required = [...harness.map(item => 'probes/lazy-delivery-families/' + item.path), ...editorHarness.map(item => 'probes/lazy-delivery-editor/' + item.path), ...colorHarness.map(item => 'probes/lazy-delivery-color/' + item.path), ...supportPaths];
    for (const path of required) assert(binding.has(path), 'Missing complete prepared harness binding: ' + path);
    const budgetBinding = uniqueBindings(preparedManifest.budgets?.files ?? preparedManifest.budgets, 'Frozen budgets'); assert.deepEqual([...budgetBinding.keys()].sort(), [...budgetPaths].sort(), 'Missing frozen plan/budget binding');
    for (const item of budgetBinding.values()) assert.equal(binding.get(item.path)?.sha256, item.sha256, 'Budget not included in frozen harness: ' + item.path);
    const budgetFile = resolve(root, budgetPaths[0]), budgetBytes = await readFile(budgetFile), budgets = JSON.parse(budgetBytes); assert.equal(budgets.budgetDecision.status, 'frozen-before-runtime-edits-and-measurements');
    const receipts = new Map();
    for (const arm of arms) {
      assert(families.every(family => arm.routeSubjects?.includes(family)), 'Prepared arm lacks requested actual route');
      const bytes = await readFile(inside(prepared, arm.receipt)); assert.equal(digest(bytes), arm.receiptSha256, 'Missing exact build receipt fingerprint'); receipts.set(arm.id, JSON.parse(bytes));
    }
    const runtimeConfig = [{config: 'probes/lazy-delivery-families/' + script, discovery: {projects: browsers.map(browserName => ({use: {browserName}}))}}];
    const runtime = await executionRuntimeIdentity(root, runtimeConfig), installation = await acquisitionInstallation('probes/lazy-delivery-families/' + script);
    assert.equal(process.version, preparedManifest.runtime?.node?.version, 'Acquisition Node version differs from the prepared private runtime'); assert.equal(await digestFile(process.execPath), preparedManifest.runtime?.node?.sha256, 'Acquisition Node bytes differ from the prepared private runtime');
    const readReceipt = async (path, expected, label) => {const bytes = await readFile(inside(prepared, path)); assert(/^[a-f0-9]{64}$/.test(expected), label + ' missing receipt hash'); assert.equal(digest(bytes), expected, label + ' receipt changed'); return JSON.parse(bytes);};
    async function verify({runtimeAfter = false} = {}) {
      assert.equal(await digestFile(resolve(prepared, 'manifest.json')), digest(manifestBytes), 'Prepared manifest changed');
      const sources = {};
      for (const role of ['reference', 'candidate']) {
        const declared = preparedManifest.sources?.[role]; assert(declared?.snapshot && declared.sourceSha256 && declared.sealSha256, 'Missing exact ' + role + ' source identity');
        const source = await verifySource(declared.snapshot, {reference: true}); sources[role] = source;
        assert.equal(source.seal.sourceSha256, declared.sourceSha256, role + ' source differs from build'); assert.equal(source.seal.sealSha256, declared.sealSha256, role + ' seal provenance differs from build'); assert.equal(source.seal.git.dirty, false, 'Promotion requires clean exact source subjects');
        assert.deepEqual(declared.git, source.seal.git, role + ' declared Git provenance differs from seal'); assert.equal(digest(declared.files), source.seal.sourceSha256, role + ' declared source inventory differs from seal');
        for (const key of ['rootLockSha256', 'performanceLockSha256']) assert.equal(declared[key], source.seal[key], role + ' declared lock identity differs from seal');
      }
      assertSourceSubjects(sources);
      assert.equal(sources.reference.seal.rootLockSha256, sources.candidate.seal.rootLockSha256, 'Matched root dependency locks differ');
      assert.equal(sources.reference.seal.performanceLockSha256, sources.candidate.seal.performanceLockSha256, 'Matched performance dependency locks differ');
      const sourceFiles = uniqueBindings(sources.candidate.seal.files, 'Candidate source');
      for (const item of binding.values()) {assert.equal(sourceFiles.get(item.path)?.sha256, item.sha256, 'Harness not bound to sealed candidate: ' + item.path); assert.equal(await digestFile(inside(root, item.path)), item.sha256, 'Executing harness differs from sealed candidate: ' + item.path);}
      assert.equal(digest(await inventory(import.meta.dirname)), digest(harness), 'Family harness file set changed'); assert.equal(digest(await inventory(resolve(root, 'probes/lazy-delivery-editor'))), digest(editorHarness), 'Editor harness file set changed'); assert.equal(digest(await inventory(resolve(root, 'probes/lazy-delivery-color'))), digest(colorHarness), 'Color harness file set changed');
      assert.equal(installation.lockSha256, sources.candidate.seal.rootLockSha256, 'Executing installation lock differs from candidate');
      const packageReceipts = new Map();
      for (const arm of arms) {
        const receipt = await readReceipt(arm.receipt, arm.receiptSha256, arm.id), source = sources[arm.subject].seal;
        validateArmReceipt(arm, receipt, source);
        await verifyAssetTree(inside(prepared, arm.root + '/site'), receipt.assets, arm.id);
        for (const family of families) entryBytes(receipt, receipt.routes?.[routeAdapters[family].path]?.entry, arm.id + '/' + family);
        const packages = await readReceipt(receipt.packagesReceipt, receipt.packagesReceiptSha256, arm.id + ' packages');
        assert.equal(packages.subject, arm.subject); assert.equal(packages.sourceSha256, source.sourceSha256); assert.equal(packages.sealSha256, source.sealSha256);
        const projected = packages.packages.map(({name, version, path, sha256, integrity}) => ({name, version, path, sha256, integrity})); assert.deepEqual(receipt.packages, projected, 'Arm archives differ from build package receipt');
        assert.deepEqual(projected.map(item => item.name).sort(), ['tokens', 'styles', 'primitives', 'elements', 'ssr'].map(name => '@en-reve/' + name).sort(), 'Exact five production package archives required');
        if (packageReceipts.has(arm.subject)) assert.equal(packageReceipts.get(arm.subject), receipt.packagesReceiptSha256, 'Same-subject arms use different production archives');
        else {packageReceipts.set(arm.subject, receipt.packagesReceiptSha256); for (const item of projected) {const bytes = await readFile(inside(prepared, item.path)); assert.equal(digest(bytes), item.sha256, 'Packed archive changed'); assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), item.integrity, 'Packed archive integrity changed');}}
      }
      const candidateReceipt = receipts.get('candidate'), driverRuntime = await readReceipt(candidateReceipt.ssr?.runtimeReceipt, candidateReceipt.ssr?.runtimeReceiptSha256, 'Prepared acquisition package runtime');
      assert.equal(driverRuntime.exactLockSha256, installation.lockSha256, 'Prepared driver runtime lock mismatch'); assert.equal(digest(driverRuntime.files), driverRuntime.sha256, 'Prepared driver runtime inventory digest mismatch'); uniqueBindings(driverRuntime.files, 'Prepared runtime');
      for (const pkg of installation.packages) {
        const prefix = pkg.path.slice('node_modules/'.length) + '/', preparedFiles = driverRuntime.files.filter(file => file.path.startsWith(prefix)).map(file => ({...file, path: file.path.slice(prefix.length)}));
        assert.equal(digest(preparedFiles), pkg.sha256, 'Acquisition driver bytes differ from fresh exact-lock prepared installation: ' + pkg.name);
      }
      for (const subject of ['reference', 'candidate']) for (const family of activeFamilies) for (const kind of ['class', 'definition']) {
        const declared = preparedManifest.selectiveEntries?.[subject]?.[family]?.[kind]; assert(declared, 'Missing deterministic selective entry receipt');
        const receipt = await readReceipt(declared.receipt, declared.receiptSha256, subject + '/' + family + '/' + kind);
        assert.equal(receipt.subject, subject); assert.equal(receipt.family, family); assert.equal(receipt.kind, kind); assert.equal(receipt.root, declared.root); assert.equal(receipt.specifier, declared.specifier); assert.equal(receipt.sourceSha256, sources[subject].seal.sourceSha256); assert.equal(receipt.sealSha256, sources[subject].seal.sealSha256); assert.equal(receipt.packagesReceiptSha256, packageReceipts.get(subject)); assert.deepEqual(receipt.entry, declared.entry); assert.deepEqual(receipt.assets, declared.assets);
        await verifyAssetTree(inside(prepared, declared.root + '/site'), receipt.assets, subject + '/' + family + '/' + kind); entryBytes(receipt, receipt.entry, family + '/' + kind);
      }
      const report = preparedManifest.reportAssets; assert(report, 'Missing report component asset binding'); const reportReceipt = await readReceipt(report.receipt, report.receiptSha256, 'Report assets');
      assert.equal(reportReceipt.subject, 'candidate'); assert.equal(reportReceipt.sourceSha256, sources.candidate.seal.sourceSha256); assert.equal(reportReceipt.sealSha256, sources.candidate.seal.sealSha256); assert.equal(reportReceipt.packagesReceiptSha256, packageReceipts.get('candidate')); assert.equal(reportReceipt.root, report.root); assert.deepEqual(reportReceipt.assets, report.assets); assert.deepEqual(reportReceipt.entry, report.entryClosure); assert.equal(reportReceipt.entry.path, report.entry);
      await verifyAssetTree(inside(prepared, report.root + '/site'), reportReceipt.assets, 'Report assets'); entryBytes(reportReceipt, reportReceipt.entry, 'Report assets');
      if (runtimeAfter) {assert.equal((await executionRuntimeIdentity(root, runtimeConfig)).digest, runtime.digest, 'Pinned runtime/browser distribution changed'); assert.equal((await acquisitionInstallation('probes/lazy-delivery-families/' + script)).digest, installation.digest, 'Installed acquisition driver closure changed');}
    }
    await verify();
    const manifest = {schemaVersion: 1, verifiedBefore: new Date().toISOString(), startedAt: new Date().toISOString(), script, prepared, preparedManifestSha256: digest(manifestBytes), preparedManifest, families, arms, budgets: {path: relative(root, budgetFile), sha256: digest(budgetBytes), values: budgets}, harness, support: supportPaths.map(path => binding.get(path)), runtime, installation,
      registryPolicy: 'Actual production route defaults only. Requested production-default does not claim native scoped coverage; separate packed correctness owns scoped cells.', serverClientPolicy: 'Browser route startup/action timings exclude server rendering. Static HTTP serving and Vite build wall time never satisfy SSR p75 gates.', contention: arg('contention', 'Active desktop permitted; no additional operator observation supplied')};
    return {out, prepared, manifest, receipts, arms, families, verify};
  } catch (error) {
    await appendFile(resolve(out, 'samples.jsonl'), JSON.stringify({status: 'integrity-failed', phase: 'before-acquisition', at: new Date().toISOString(), error: String(error), stack: error.stack}) + '\n');
    const failed = {schemaVersion: 1, script, prepared, status: 'incomplete', integrityVerified: false, verifiedBefore: null, verifiedAfter: null, successful: 0, phase: 'before-acquisition', error: String(error), finishedAt: new Date().toISOString(), rawSha256: await digestFile(resolve(out, 'samples.jsonl'))};
    await writeFile(resolve(out, 'summary.json'), JSON.stringify(failed, null, 2) + '\n', {flag: 'wx'});
    const manifest = {...failed, summarySha256: await digestFile(resolve(out, 'summary.json'))}; manifest.manifestSha256 = digest(manifest);
    await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'}); throw error;
  }
}
export async function finalizeAcquisition(input, summary, acquisitionError) {
  let integrityError, verifiedAfter = null;
  try {await input.verify({runtimeAfter: true}); verifiedAfter = new Date().toISOString();} catch (error) {integrityError = error; await appendFile(resolve(input.out, 'samples.jsonl'), JSON.stringify({status: 'integrity-failed', phase: 'after-acquisition', at: new Date().toISOString(), error: String(error), stack: error.stack}) + '\n');}
  const errors = [acquisitionError, integrityError].filter(Boolean), finished = {...summary, status: errors.length ? (summary.aborted ? 'aborted' : 'incomplete') : 'complete', integrityVerified: !integrityError, verifiedBefore: input.manifest.verifiedBefore, verifiedAfter, errors: errors.map(error => String(error)), finishedAt: new Date().toISOString(), rawSha256: await digestFile(resolve(input.out, 'samples.jsonl'))};
  await writeFile(resolve(input.out, 'summary.json'), JSON.stringify(finished, null, 2) + '\n', {flag: 'wx'});
  Object.assign(input.manifest, finished, {summarySha256: await digestFile(resolve(input.out, 'summary.json'))}); delete input.manifest.manifestSha256; input.manifest.manifestSha256 = digest(input.manifest);
  await writeFile(resolve(input.out, 'manifest.json'), JSON.stringify(input.manifest, null, 2) + '\n');
  if (errors.length) throw new AggregateError(errors, 'Acquisition or its final integrity verification failed; all raw evidence retained');
}
export async function startServers(input) {
  const servers = new Map();
  try {
    for (const arm of input.arms) {
      const server = await serve(arm.root, 0, input.prepared); servers.set(arm.id, server);
      for (const family of input.families) await new Promise((resolveReady, reject) => {
        // Precompress actual HTML before browser timing; no browser HTTP cache is seeded.
        httpsGet(server.url + routeAdapters[family].path, {rejectUnauthorized: false, headers: {'accept-encoding': 'gzip'}}, response => {if (response.statusCode !== 200) {response.resume(); reject(new Error('Route prewarm failed: ' + response.statusCode)); return;} response.resume(); response.on('end', resolveReady);}).on('error', reject);
      });
    }
    return servers;
  } catch (error) {for (const server of servers.values()) await server.close(); throw error;}
}
export function receiptBytes(receipt, routePath, resources, expectedOrigin) {
  assert(typeof expectedOrigin === 'string' && new URL(expectedOrigin).origin === expectedOrigin, 'Explicit serving origin required');
  const assets = uniqueBindings(receipt.assets, 'Executable assets'), selected = new Set();
  for (const resource of resources) {
    const url = new URL(resource.name); assert.equal(url.origin, expectedOrigin, 'Unexpected external executable resource'); assert.equal(resource.origin, expectedOrigin, 'Resource origin annotation mismatch'); assert.equal(resource.path, url.pathname, 'Resource path annotation mismatch');
    const path = decodeURIComponent(url.pathname.slice(1)); inside(root, path); const asset = assets.get(path); assert(asset && Number.isSafeInteger(asset.gzipBytes) && asset.gzipBytes >= 0, 'Unsealed executable resource or missing gzip receipt: ' + path); selected.add(path);
    for (const key of ['encodedBodySize', 'transferSize']) assert(Number.isFinite(resource[key]) && resource[key] >= 0, 'Missing browser resource byte metric: ' + key);
  }
  const routeEntry = receipt.routes?.[routePath]?.entry, entry = entryBytes(receipt, routeEntry, routePath);
  assert(resources.length, 'Missing observed executable resource timings');
  for (const path of routeEntry.roots ?? routeEntry.assets) assert(selected.has(path), 'Declared entry absent from executable resource observations: ' + path);
  return {entryGzipBytes: entry.gzipBytes, entryRequests: entry.requests, settledGzipBytes: [...selected].reduce((sum, path) => sum + assets.get(path).gzipBytes, 0), settledRequests: selected.size, encodedBodyBytes: resources.reduce((sum, item) => sum + item.encodedBodySize, 0), transferBytes: resources.reduce((sum, item) => sum + item.transferSize, 0)};
}
export async function writeManifest(input, extra) {Object.assign(input.manifest, extra); await writeFile(resolve(input.out, 'manifest.json'), JSON.stringify(input.manifest, null, 2) + '\n', {flag: 'wx'});}
