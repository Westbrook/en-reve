/** Shared input binding for separate full color timing and retention acquisitions.
 * This file does not implement application delivery, caching or scheduling.
 * Every caller holds exclusiveBrowserWork before calling any function here.
 */
import assert from 'node:assert/strict';
import {mkdir, readFile, readlink, realpath, readdir, lstat} from 'node:fs/promises';
import {resolve, dirname, relative, isAbsolute, sep} from 'node:path';
import {connect} from 'node:http2';
import {createRequire} from 'node:module';
import {digest, digestFile, inventory} from '../lazy-delivery-performance/source-seal.mjs';
import {loadPreparation} from '../lazy-delivery-editor/common.mjs';
import {acquisitionInstallation, inside} from '../lazy-delivery-families/performance-common.mjs';
import {executionRuntimeIdentity} from '../../tooling/testing/runtime-identity.mjs';
import {serve} from '../scoped-hydration/production/server.mjs';
import {colorPolicyOverlay} from './color-policy-controls.mjs';
import {runtimeInventory, runtimeExclusions} from '../lazy-delivery-families/route-build-contract.mjs';
import {validateColdRecords, coldSourcePaths} from './full-cold.mjs';

export const root = resolve(import.meta.dirname, '../..');
export const route = '/api-examples/composable-chat.html';
export const colorRevision = 'composable-chat-native-registry-control-v1';
const roles = ['reference', 'candidate'];
const within = (base, path) => {const name = relative(base, path); return name === '' || name !== '..' && !name.startsWith('..' + sep) && !isAbsolute(name);};
const object = (value, label) => {assert(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object'); return value;};
async function captured(path) {const bytes = await readFile(path); return {path, sha256: digest(bytes), bytes: bytes.length, value: JSON.parse(bytes)};}
async function prospective(path) {
  try {return await realpath(path);} catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = dirname(path); assert.notEqual(parent, path);
    return resolve(await prospective(parent), path.slice(parent.length + 1));
  }
}
async function recheckCapture(item) {assert.equal(await digestFile(item.path), item.sha256, 'Captured input changed: ' + item.path);}
async function leafNames(directory, prefix = '') {
  const names = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) names.push(...await leafNames(resolve(directory, entry.name), name + '/'));
    else {assert(entry.isFile() || entry.isSymbolicLink(), 'Unsupported producer output kind'); names.push(name);}
  }
  return names.sort();
}
function sourceEquality(production, controlled) {
  for (const role of roles) for (const field of ['sourceSha256', 'sealSha256', 'rootLockSha256', 'performanceLockSha256']) {
    assert.equal(production.sources[role][field], controlled.sources[role][field], 'Controlled build changes source or lock identity: ' + role + '/' + field);
  }
  for (const role of roles) assert.deepEqual(production.sources[role].git, controlled.sources[role].git, 'Controlled source commit/tree differs');
  assert.deepEqual(production.harness, controlled.harness, 'Controlled build changes the frozen executing harness');
}

/** Uses the existing full preparation verifier; color adds its own exact bindings. */
export async function openFullInputs({inputs, controlled, cold, out, script, engines, requireCold = true}) {
  assert(inputs && controlled && out && script && Array.isArray(engines) && engines.length, 'Missing full color acquisition inputs');
  assert(/^full-(timing|retention)\.mjs$/.test(script), 'Unknown full color acquisition entry');
  assert(engines.every(value => ['chromium', 'firefox', 'webkit'].includes(value)) && new Set(engines).size === engines.length, 'Unknown/repeated browser');
  assert(requireCold === true, 'Full acquisition cannot bypass the necessary cold gate');
  assert(cold, 'Supply the complete exact production cold diagnostic candidate.json');
  const inputsRoot = await realpath(resolve(inputs)), controlledRoot = await realpath(resolve(controlled));
  const outputRoot = await prospective(resolve(out));
  const producerCapture = await captured(resolve(inputsRoot, 'producer.json'));
  const sidecarCapture = await captured(resolve(inputsRoot, 'producer.sha256.json'));
  const producer = object(producerCapture.value, 'Color producer');
  assert.equal(producer.schemaVersion, 1); assert.equal(producer.kind, 'en-reve-color-cold-assets'); assert.equal(producer.status, 'complete');
  assert.equal(sidecarCapture.value.path, 'producer.json'); assert.equal(sidecarCapture.value.sha256, producerCapture.sha256);
  const {producerSha256, ...producerPayload} = producer; assert.equal(digest(producerPayload), producerSha256, 'Producer self-seal changed');
  assert.equal(producer.inputsUnchanged, true); assert.equal(producer.outputsReadbackVerified, true);
  assert.equal(producer.route, route); assert.equal(producer.eligibility?.staticByteGatePass, true); assert.equal(producer.eligibility?.coldProbeApplicable, true);
  assert.equal(producer.eligibility.gatePlan?.minimumMatchedStartupGzipSavingBytes ?? producer.eligibility.minimumMatchedStartupGzipSavingBytes, 4096, 'Missing frozen minimum startup gzip saving');
  assert.equal(producer.eligibility.gatePlan?.minimumMatchedStartupGzipSavingFraction ?? producer.eligibility.minimumMatchedStartupGzipSavingFraction, .10, 'Missing frozen minimum startup fraction');
  assert(producer.eligibility.referenceStartup.gzipBytes > 0);
  const staticSaving = producer.eligibility.referenceStartup.gzipBytes - producer.eligibility.candidateStartup.gzipBytes;
  assert.equal(producer.eligibility.matchedSavingBytes, staticSaving);
  assert.equal(producer.eligibility.matchedSavingFraction, staticSaving / producer.eligibility.referenceStartup.gzipBytes);
  assert(staticSaving >= 4096 && producer.eligibility.matchedSavingFraction >= .10, 'Necessary static byte gate did not pass');
  const productionRoot = await realpath(producer.prepared);
  assert.notEqual(productionRoot, controlledRoot, 'Construction control must have a separate transformed preparation');
  const productionCapture = await captured(resolve(productionRoot, 'manifest.json'));
  const controlledCapture = await captured(resolve(controlledRoot, 'manifest.json'));
  const protectedRoots = [root, inputsRoot, productionRoot, controlledRoot,
    ...roles.flatMap(role => [productionCapture.value.sources?.[role]?.snapshot, controlledCapture.value.sources?.[role]?.snapshot]).filter(Boolean)];
  for (const path of protectedRoots) {
    const canonical = await realpath(path);
    assert(!within(canonical, outputRoot) && !within(outputRoot, canonical), 'Output overlaps an immutable input or executing source: ' + canonical);
  }
  const production = await loadPreparation(productionRoot);
  const control = await loadPreparation(controlledRoot, {allowColorControls: true});
  assert.equal(production.preparation.build?.colorControls?.enabled, false, 'Production color measurements require the uninstrumented color preparation');
  assert.equal(control.preparation.build?.colorControls?.enabled, true, 'Construction control requires the declared transformed preparation');
  assert.equal(control.preparation.build.colorControls.revision, colorRevision);
  sourceEquality(production.preparation, control.preparation);
  const snapshots = new Map(roles.map(role => [role, production.preparation.sources[role]]));
  assert.equal(producer.eligibility.gatePlan.path, resolve(snapshots.get('candidate').snapshot, 'source/plans/lazy-delivery/color-popup.md'));
  assert.equal(producer.eligibility.gatePlan.sha256, snapshots.get('candidate').files.find(item => item.path === 'plans/lazy-delivery/color-popup.md')?.sha256);
  const coldCapture = await captured(await realpath(resolve(cold)));
  const coldRawPath = resolve(dirname(coldCapture.path), 'attempts.jsonl');
  assert((await lstat(coldCapture.path)).isFile() && (await lstat(coldRawPath)).isFile(), 'Cold result and original journal must be regular files');
  const coldRaw = await capturedRaw(coldRawPath);
  const coldRoot = await realpath(dirname(coldCapture.path));
  assert(!within(coldRoot, outputRoot) && !within(outputRoot, coldRoot), 'Output overlaps the immutable cold acquisition');
  const coldValue = object(coldCapture.value, 'Necessary cold result');
  assert.equal(coldValue.schemaVersion, 1); assert.equal(coldValue.kind, 'composable-chat-matched-cold-color-diagnostic');
  assert.equal(coldValue.summary?.valid, true, 'Necessary cold diagnostic is not valid');
  assert.equal(coldValue.summary.completePairs, 30); assert.equal(coldValue.summary.attempts, 60); assert.equal(coldValue.summary.notRun, 0);
  assert.equal(coldValue.summary.failedOrAborted, 0); assert.equal(coldValue.protocol?.blocks, 30); assert.equal(coldValue.protocol?.maximumAddedReadyMs, 50);
  assert(Number.isFinite(coldValue.summary.primaryDifferenceOfArmMediansMs) && coldValue.summary.primaryDifferenceOfArmMediansMs <= 50, 'Necessary cold median gate did not pass');
  assert(Number.isFinite(coldValue.summary.uncertainty?.upperMs) && coldValue.summary.uncertainty.upperMs <= 50, 'Necessary cold uncertainty gate did not pass');
  assert.equal(coldValue.runnerSourceCommit, snapshots.get('candidate').git.head, 'Necessary cold acquisition used a different candidate commit');
  assert.equal(coldValue.runnerSourceTree, snapshots.get('candidate').git.tree, 'Necessary cold acquisition used a different candidate tree');
  assert.equal(coldValue.runnerWorkingStatus, '', 'Necessary cold acquisition did not use clean committed source');
  assert.equal(coldValue.coldProducerPath, producerCapture.path); assert.equal(coldValue.coldInputsBefore?.[producerCapture.path], producerCapture.sha256);
  assert.deepEqual(coldValue.coldInputsBefore, coldValue.coldInputsAfter, 'Necessary cold inputs changed');
  assert.deepEqual(coldValue.coldAssets, producer.arms.candidate.optionalUnique, 'Necessary cold asset list differs from producer');
  const coldEvents = coldRaw.text.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  validateColdRecords(coldValue, coldEvents);
  const coldStarts = coldEvents.filter(row => row.event === 'started'), coldTerminals = coldEvents.filter(row => row.event === 'terminal');
  assert.equal(coldEvents.length, 120); assert.equal(coldStarts.length, 60); assert.equal(coldTerminals.length, 60);
  assert.equal(coldValue.attempts.length, 60); assert(coldValue.attempts.every(row => row.status === 'pass'));
  for (let index = 0; index < 60; index++) {
    const {event, ...terminal} = coldTerminals[index]; assert.deepEqual(terminal, coldValue.attempts[index], 'Necessary cold raw differs from final attempts');
    assert.equal(coldStarts[index].block, terminal.block); assert.equal(coldStarts[index].arm, terminal.arm); assert.equal(coldStarts[index].ordinal, terminal.ordinal);
  }
  for (const role of roles) {
    assert.equal(producer.arms[role].source.sourceSha256, snapshots.get(role).sourceSha256); assert.equal(producer.arms[role].source.sealSha256, snapshots.get(role).sealSha256);
    assert.deepEqual(producer.arms[role].source.git, snapshots.get(role).git);
    const receipt = production.receiptFor(role), site = coldValue.sitesBefore?.[role];
    assert.equal(site?.matchesFrozenInventory, true); assert.deepEqual(site.inventory, receipt.assets);
    assert.equal(site.receiptSha256, producer.arms[role].receipt.sha256); assert.deepEqual(site.receipt, receipt);
    assert.equal(await realpath(site.distribution), await realpath(resolve(productionRoot, role, 'site')));
    const controlReceipt = control.receiptFor(role);
    const overlayRows = JSON.parse(await readFile(resolve(controlledRoot, role, controlReceipt.overlays), 'utf8'));
    const overlays = overlayRows.filter(item => item.kind === 'color-native-registry-registration-control');
    assert.equal(overlays.length, 1, 'Controlled color preparation requires exactly one color bridge');
    const overlay = overlays[0], original = await readFile(resolve(controlledRoot, role, 'overlays/original', overlay.path), 'utf8');
    const replay = colorPolicyOverlay(original, {subject: role});
    assert.equal(digest(replay.source), overlay.executedSha256, 'Controlled color bridge does not reproduce from its exact source');
  }
  assert.deepEqual(coldValue.sitesBefore, coldValue.sitesAfter, 'Necessary cold frozen sites changed');
  assert.deepEqual(Object.keys(coldValue.sourceBefore ?? {}).sort(), coldSourcePaths.map(path => resolve(root, path)).sort(), 'Necessary cold source closure is incomplete');
  for (const [path, expected] of Object.entries(coldValue.sourceBefore ?? {})) {
    const name = relative(root, path); inside(root, name);
    assert.equal(snapshots.get('candidate').files.find(item => item.path === name)?.sha256, expected, 'Cold source not bound to candidate seal');
    assert.equal(await digestFile(path), expected, 'Necessary cold source changed');
  }
  assert.deepEqual(coldValue.sourceBefore, coldValue.sourceAfter);
  assert.equal(coldValue.sourceUnchanged, true); assert.equal(coldValue.supportUnchanged, true); assert.equal(coldValue.sitesUnchanged, true); assert.equal(coldValue.browserUnchanged, true);
  const require = createRequire(import.meta.url), corePackage = require.resolve('playwright-core/package.json');
  const coldSupport = [require.resolve('@playwright/test/package.json'), corePackage,
    resolve(dirname(corePackage), 'types/protocol.d.ts'), resolve(dirname(corePackage), 'browsers.json'), process.execPath];
  assert.deepEqual(Object.keys(coldValue.supportBefore ?? {}).sort(), coldSupport.sort(), 'Necessary cold support closure is incomplete');
  assert.deepEqual(coldValue.supportBefore, coldValue.supportAfter, 'Necessary cold support changed');
  const harnessTree = await inventory(resolve(root, 'probes/lazy-delivery-color'));
  assert(harnessTree.length && harnessTree.every(item => item.type === 'file'), 'Color harness must consist of regular source files');
  const harness = {files: harnessTree.map(item => ({...item, path: 'probes/lazy-delivery-color/' + item.path}))}; harness.sha256 = digest(harness.files);
  for (const item of harness.files) {
    assert.equal(snapshots.get('candidate').files.find(file => file.path === item.path)?.sha256, item.sha256, 'Executing color harness is not the sealed candidate source');
    assert.equal(production.preparation.harness.files.find(file => file.path === item.path)?.sha256, item.sha256, 'Color harness absent from complete prepared binding');
  }
  const configuredRuntime = [{config: 'probes/lazy-delivery-color/' + script, discovery: {projects: engines.map(browserName => ({use: {browserName}}))}}];
  const runtime = await executionRuntimeIdentity(root, configuredRuntime);
  // Protect the recorded external browser trees before creating output. A late
  // identity rejection must not be the first defense against writing into them.
  const runtimeEntries = Object.entries(object(runtime.files, 'Runtime inventory'));
  const runtimeRoots = [];
  for (const [name] of runtimeEntries.filter(([name, value]) => name.endsWith('/') || value?.type === 'directory').sort((a, b) => a[0].length - b[0].length)) {
    const path = await realpath(resolve(root, name));
    if (!runtimeRoots.some(parent => within(parent, path))) runtimeRoots.push(path);
  }
  for (const [name] of runtimeEntries) {
    if (name.endsWith('@link')) continue;
    const path = resolve(root, name);
    if (!runtimeRoots.some(parent => within(parent, path))) runtimeRoots.push(await realpath(path));
  }
  for (const path of runtimeRoots) assert(!within(path, outputRoot) && !within(outputRoot, path), 'Output overlaps immutable runtime input: ' + path);
  const installation = await acquisitionInstallation('probes/lazy-delivery-color/' + script, root);
  await production.verifyInstallation(installation); await control.verifyInstallation(installation);
  const bindings = {schemaVersion: 1, kind: 'en-reve-color-full-input-bindings', executingRoot: root,
    production: {path: productionRoot, sha256: productionCapture.sha256, identity: production.preparation},
    controlled: {path: controlledRoot, sha256: controlledCapture.sha256, identity: control.preparation},
    producer: {path: producerCapture.path, sha256: producerCapture.sha256, sidecarPath: sidecarCapture.path, sidecarSha256: sidecarCapture.sha256, identity: producer},
    cold: {path: coldCapture.path, sha256: coldCapture.sha256, rawPath: coldRaw.path, rawSha256: coldRaw.sha256, identity: coldValue}, harness, runtime, installation};
  const identity = digest(bindings);
  async function verifyPreparedRuntimes() {
    const checked = new Map();
    for (const [base, prepared] of [[productionRoot, production], [controlledRoot, control]]) for (const role of roles) {
      const descriptor = prepared.receiptFor(role).ssr;
      const runtimePath = inside(base, descriptor.runtimeReceipt), bytes = await readFile(runtimePath);
      assert.equal(digest(bytes), descriptor.runtimeReceiptSha256, 'Prepared runtime receipt changed');
      const retained = JSON.parse(bytes), directory = await realpath(inside(base, retained.root));
      assert(within(base, directory), 'Prepared runtime escapes its preparation');
      assert.deepEqual(retained.exclusions, runtimeExclusions, 'Prepared runtime exclusions changed');
      assert.equal(retained.exactLockSha256, snapshots.get(role).rootLockSha256);
      assert.equal(digest(retained.files), retained.sha256, 'Prepared runtime self-seal changed');
      assert.equal(await digestFile(resolve(directory, '.package-lock.json')), retained.installedLockSha256, 'Prepared installed lock changed');
      if (checked.has(directory)) assert.equal(checked.get(directory), retained.sha256, 'Conflicting runtime receipts');
      else {assert.equal(digest(await runtimeInventory(directory)), retained.sha256, 'Prepared runtime bytes or membership changed'); checked.set(directory, retained.sha256);}
    }
  }
  async function verify() {
    await Promise.all([production.verify(), control.verify()]);
    await verifyPreparedRuntimes();
    sourceEquality(production.preparation, control.preparation);
    for (const item of [producerCapture, sidecarCapture, productionCapture, controlledCapture, coldCapture, coldRaw]) await recheckCapture(item);
    assert((await lstat(coldCapture.path)).isFile() && (await lstat(coldRaw.path)).isFile(), 'Cold result/journal type changed');
    const inputPaths = new Set();
    assert(Array.isArray(producer.inputs) && producer.inputs.length, 'Producer input inventory is absent');
    for (const item of producer.inputs) {
      assert(!inputPaths.has(item.path), 'Duplicate producer input'); inputPaths.add(item.path);
      assert(isAbsolute(item.path) && /^[a-f0-9]{64}$/.test(item.sha256), 'Malformed producer input');
      const bytes = await readFile(item.path); assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.sha256, 'Producer input changed: ' + item.path);
    }
    for (const item of producer.inputLinks ?? []) {
      assert.equal(await realpath(item.path), item.realpath, 'Producer input link target changed');
      if (item.target !== undefined) assert.equal(await readlink(item.path), item.target);
    }
    const expectedOutputs = ['reference/receipt.json', 'reference/assets.json', 'reference/site', 'candidate/receipt.json', 'candidate/assets.json', 'candidate/site', 'optional-assets.json'];
    assert.deepEqual(producer.outputs.map(item => item.path).sort(), expectedOutputs.sort(), 'Producer output schema changed');
    assert.deepEqual((await readdir(inputsRoot)).sort(), ['candidate', 'optional-assets.json', 'producer.json', 'producer.sha256.json', 'reference'].sort(), 'Producer top-level membership changed');
    for (const role of roles) {assert((await lstat(resolve(inputsRoot, role))).isDirectory()); assert.deepEqual((await readdir(resolve(inputsRoot, role))).sort(), ['assets.json', 'receipt.json', 'site']);}
    const outputs = new Set();
    for (const item of producer.outputs) {
      const path = inside(inputsRoot, item.path); assert(!outputs.has(item.path), 'Duplicate producer output'); outputs.add(item.path);
      if (item.path.endsWith('/site')) {assert.equal(item.type, 'symlink'); assert((await lstat(path)).isSymbolicLink()); assert.equal(item.target, await realpath(resolve(productionRoot, item.path))); assert.equal(await readlink(path), item.target); assert.equal(digest(item.target), item.sha256);}
      else {assert(item.type === undefined && (await lstat(path)).isFile(), 'Producer JSON must be a regular file'); const bytes = await readFile(path); assert.equal(bytes.length, item.bytes); assert.equal(digest(bytes), item.sha256, 'Producer output changed');}
    }
    for (const path of [producerCapture.path, sidecarCapture.path]) assert((await lstat(path)).isFile(), 'Producer and sidecar must be regular files');
    // The producer owns these leaves; its final self-seal and sidecar are separate.
    assert.deepEqual(await leafNames(inputsRoot), [...outputs, 'producer.json', 'producer.sha256.json'].sort(), 'Producer output membership changed');
    for (const role of roles) assert.equal(await realpath(resolve(inputsRoot, role, 'site')), await realpath(resolve(productionRoot, role, 'site')));
    assert.deepEqual((await inventory(resolve(root, 'probes/lazy-delivery-color'))), harnessTree, 'Color harness file set or bytes changed');
    assert.equal((await executionRuntimeIdentity(root, configuredRuntime)).digest, runtime.digest, 'Runtime/browser distribution changed');
    assert.equal((await acquisitionInstallation('probes/lazy-delivery-color/' + script, root)).digest, installation.digest, 'Acquisition package closure changed');
    for (const [path, expected] of Object.entries(coldValue.supportBefore)) assert.equal(await digestFile(path), expected, 'Necessary cold support changed');
    assert.equal(await digestFile(coldValue.browser.executable), coldValue.browser.executableSha256, 'Necessary cold Chromium executable changed');
    return {verified: true, identitySha256: identity, at: new Date().toISOString()};
  }
  await verify();
  await mkdir(outputRoot, {recursive: false});
  const receipts = {production: new Map(roles.map(role => [role, production.receiptFor(role)])), controlled: new Map(roles.map(role => [role, control.receiptFor(role)]))};
  return {out: outputRoot, preparation: production.preparation, controlledPreparation: control.preparation, producer, receipts, verify,
    identity, identityBefore: identity, manifest: bindings, runtime, installation,
    sourceSite: (kind, arm) => resolve(kind === 'production' ? productionRoot : controlledRoot, arm, 'site'),
    receipt: (kind, arm) => {assert(['production', 'controlled'].includes(kind) && roles.includes(arm)); return receipts[kind].get(arm);},
    assets: (kind, arm) => {assert(['production', 'controlled'].includes(kind) && roles.includes(arm)); return receipts[kind].get(arm).assets;},
    productionRoot, controlledRoot};
}
async function capturedRaw(path) {const bytes = await readFile(path); return {path, bytes: bytes.length, sha256: digest(bytes), text: bytes.toString('utf8')};}

export async function startFullServers(input) {
  const servers = new Map();
  servers.closeAll = async () => {
    const results = await Promise.allSettled([...servers.values()].map(server => server.close()));
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
    if (errors.length) throw new AggregateError(errors, 'Color servers did not all close');
  };
  try {
    for (const kind of ['production', 'controlled']) for (const role of roles) {
      const server = await serve(role, 0, kind === 'production' ? input.productionRoot : input.controlledRoot);
      servers.set(kind + '/' + role, server); server.prewarm = await prewarm(server.url);
    }
  } catch (error) {await servers.closeAll(); throw error;}
  return servers;
}
async function prewarm(origin) {
  const session = connect(origin, {rejectUnauthorized: false});
  try {
    return await new Promise((resolve, reject) => {
      session.once('error', reject); const request = session.request({':path': route, 'accept-encoding': 'gzip'});
      request.setTimeout(20000, () => request.destroy(new Error('Color HTML prewarm deadline exceeded')));
      const chunks = []; let headers;
      request.once('response', value => {headers = value;}); request.on('data', value => chunks.push(value)); request.once('error', reject);
      request.once('end', () => {try {assert.equal(headers?.[':status'], 200); assert.equal(headers['content-encoding'], 'gzip'); const bytes = Buffer.concat(chunks); resolve({path: route, bytes: bytes.length, sha256: digest(bytes), protocol: 'h2', encoding: 'gzip'});} catch (error) {reject(error);}}); request.end();
    });
  } finally {session.destroy();}
}
