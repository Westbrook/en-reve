import {chromium, firefox, webkit} from '@playwright/test';
import {readFile, writeFile, mkdir, appendFile} from 'node:fs/promises';
import {appendFileSync, existsSync} from 'node:fs';
import {resolve, relative, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import assert from 'node:assert/strict';
import {connect} from 'node:http2';
import {digestFile, inventory, inventoryFiles, verifySource} from './source-seal.mjs';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {executionRuntimeIdentity} from '../../tooling/testing/runtime-identity.mjs';
const arg = (name, fallback) => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const digest = value => createHash('sha256').update(value).digest('hex');
const root = resolve(import.meta.dirname, '../..');
// Source/package/browser inventories are substantial I/O. Keep preflight,
// acquisition and every success/failure final check within the same lease.
await exclusiveBrowserWork(async () => {
const prepared = resolve(arg('prepared', '')), outArg = arg('out', process.env.EN_EXECUTION_OUTPUT);
assert(arg('prepared'), '--prepared must name a fresh matched preparation'); assert(outArg, 'Supply a fresh --out or EN_EXECUTION_OUTPUT');
const out = resolve(outArg), qualification = process.argv.includes('--qualification');
const budgetsPath = resolve(root, 'plans/lazy-delivery/budgets.json');
const budgetsBytes = await readFile(budgetsPath), budgets = JSON.parse(budgetsBytes);
const n = Number(arg('n', qualification ? '1' : String(budgets.minimumSuccessfulTimingSamplesPerCell)));
const repetitions = Number(arg('retention', qualification ? '0' : String(budgets.retention.freshContextsPerArm)));
assert(Number.isInteger(n) && n > 0 && (qualification || n >= budgets.minimumSuccessfulTimingSamplesPerCell), 'A promoted timing cell needs at least 30 samples');
assert(Number.isInteger(repetitions) && repetitions >= 0 && (qualification || repetitions >= budgets.retention.freshContextsPerArm), 'A promoted run needs five retention contexts per arm');
assert(!existsSync(out), 'Output must be a fresh, non-existing directory'); await mkdir(out, {recursive: true});
const sourceManifestBytes = await readFile(resolve(prepared, 'manifest.json')), preparation = JSON.parse(sourceManifestBytes);
assert.equal(preparation.status, 'complete', 'A partial preparation cannot produce timing evidence');
const {manifestSha256, ...preparedManifestPayload} = preparation;
assert.equal(digest(JSON.stringify(preparedManifestPayload)), manifestSha256, 'Preparation manifest digest mismatch');
const selectedIds = arg('variants', 'all');
const variants = preparation.variants.filter(v => ['api', 'date'].includes(v.family) && (selectedIds === 'all' || selectedIds.split(',').includes(v.id)));
assert(variants.length > 0, 'No timing variants selected');
if (selectedIds !== 'all') assert.equal(variants.length, new Set(selectedIds.split(',')).size, 'Unknown or repeated variant');
const allConfigs = [
  ...['chromium', 'firefox', 'webkit'].map(browser => ({browser, profile: 'desktop', input: 'keyboard'})),
  {browser: 'chromium', profile: 'constrained', input: 'keyboard'},
  {browser: 'chromium', profile: 'constrained-mobile', input: 'touch'},
];
const configurationIds = arg('configs', 'all');
const configs = allConfigs.filter(c => configurationIds === 'all' || configurationIds.split(',').includes(`${c.browser}:${c.profile}:${c.input}`));
assert(configs.length > 0); if (configurationIds !== 'all') assert.equal(configs.length, new Set(configurationIds.split(',')).size, 'Unknown configuration');
const modes = arg('modes', 'global,scoped').split(','); assert(modes.length && modes.every(m => ['global', 'scoped'].includes(m)) && new Set(modes).size === modes.length);
const seed = Number(arg('seed', '20260928')); assert(Number.isSafeInteger(seed));
let randomState = seed >>> 0;
const random = () => {randomState = (1664525 * randomState + 1013904223) >>> 0; return randomState / 4294967296;};
function shuffled(items) {const list = [...items]; for (let i = list.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]];} return list;}
const jobs = [];
for (let block = 0; block < n; block++) for (const config of shuffled(configs)) for (const mode of shuffled(modes)) {
  // Every arm in one matched configuration is interleaved before the next block.
  jobs.push(...shuffled(variants).map(variant => ({id: jobs.length + '-' + variant.id, kind: 'timing', variant: variant.id, family: variant.family, policy: variant.policy, block, requestedMode: mode, ...config})));
}
for (let block = 0; block < repetitions; block++) for (const mode of shuffled(modes)) jobs.push(...shuffled(variants).map(variant => ({id: `retention-${block}-${mode}-${variant.id}`, kind: 'retention', variant: variant.id, family: variant.family, policy: variant.policy, block, requestedMode: mode, browser: 'chromium', profile: 'desktop', input: 'keyboard'})));
assert(Array.isArray(preparation.harness?.files), 'Missing preparation harness inventory');
const harness = await inventoryFiles(import.meta.dirname, preparation.harness.files.map(file => file.path));
const support = await Promise.all(['probes/scoped-hydration/production/server.mjs', 'showcases/performance/src/lock.mjs', 'showcases/performance/src/config.mjs', 'showcases/performance/registry/systems.json', 'showcases/performance/profiles/profiles.json', 'tooling/testing/execution-owner.mjs', 'tooling/testing/machine-owner.mjs', 'tooling/testing/runtime-identity.mjs', 'tooling/evidence/setup.mjs', 'tooling/evidence/identity.ts', 'plans/lazy-delivery/validation.md', 'package-lock.json', '.node-version'].map(async path => ({path, sha256: digest(await readFile(resolve(root, path)))})));
const browserIdentities = await Promise.all(Object.entries({chromium, firefox, webkit}).map(async ([name, engine]) => {
  const path = engine.executablePath(); return {name, executable: path, sha256: digest(await readFile(path))};
}));
const runtimeConfigurations = [{config: 'probes/lazy-delivery-performance/campaign.mjs', discovery: {projects: [...new Set(configs.map(c => c.browser))].map(browserName => ({use: {browserName}}))}}];
const runtimeIdentity = await executionRuntimeIdentity(root, runtimeConfigurations);
async function runtimePins() {
  const node = {version: process.version, sha256: await digestFile(process.execPath)};
  assert.equal(node.version, preparation.runtime.node.version, 'Acquisition Node version differs from preparation');
  assert.equal(node.sha256, preparation.runtime.node.sha256, 'Acquisition Node binary differs from preparation');
  assert.equal(node.version, 'v' + (await readFile(resolve(root, '.node-version'), 'utf8')).trim(), 'Acquisition Node differs from the exact pin');
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json')));
  const require = createRequire(import.meta.url), testRequire = createRequire(require.resolve('@playwright/test'));
  const playwrightRequire = createRequire(testRequire.resolve('playwright'));
  const packages = [];
  for (const [name, resolver] of [['@playwright/test', require], ['playwright', testRequire], ['playwright-core', playwrightRequire]]) {
    const path = dirname(resolver.resolve(name + '/package.json'));
    const pkg = JSON.parse(await readFile(resolve(path, 'package.json')));
    assert.equal(pkg.version, lock.packages?.['node_modules/' + name]?.version, `Acquisition ${name} differs from the exact root lock`);
    const files = await inventory(path);
    packages.push({name, version: pkg.version, path, sha256: digest(JSON.stringify(files))});
  }
  return {node, packages};
}
const acquisitionRuntime = await runtimePins();
const environment = {power: null, thermal: null, contention: arg('contention', 'Active desktop permitted; no additional operator observation supplied')};
try {environment.power = execFileSync('pmset', ['-g', 'batt'], {encoding: 'utf8'}); environment.thermal = execFileSync('pmset', ['-g', 'therm'], {encoding: 'utf8'});} catch { /* Explicit null means unavailable. */ }
async function verify() {
  assert.equal(digest(await readFile(resolve(prepared, 'manifest.json'))), digest(sourceManifestBytes), 'Preparation manifest changed');
  const seals = {};
  for (const name of ['reference', 'candidate']) {
    const declared = preparation.sources?.[name];
    assert(declared?.snapshot, `Missing ${name} source seal`);
    const {snapshot, ...expected} = declared;
    const actual = await verifySource(snapshot, {reference: name === 'reference'});
    assert.deepEqual(actual.seal, expected, `${name} source seal differs from preparation`);
    seals[name] = actual.seal;
  }
  assert(qualification || !seals.candidate.git.dirty, 'A dirty exploratory candidate cannot produce qualifying timing evidence');
  const candidateFiles = new Map(seals.candidate.files.map(file => [file.path, file]));
  assert(Array.isArray(preparation.harness?.files), 'Missing preparation harness inventory');
  const harnessPrefix = 'probes/lazy-delivery-performance/';
  assert.deepEqual(preparation.harness.files.map(file => file.path), seals.candidate.files.filter(file => file.path.startsWith(harnessPrefix)).map(file => file.path.slice(harnessPrefix.length)), 'Preparation harness paths differ from candidate sealed inventory');
  assert.equal(digest(JSON.stringify(preparation.harness.files)), preparation.harness.sha256, 'Invalid preparation harness digest');
  assert.deepEqual(await inventoryFiles(import.meta.dirname, preparation.harness.files.map(file => file.path)), preparation.harness.files, 'Executing harness differs from preparation');
  for (const item of preparation.harness.files) {
    const path = `probes/lazy-delivery-performance/${item.path}`;
    assert.deepEqual(candidateFiles.get(path), {...item, path}, `Harness differs from candidate sealed source: ${path}`);
  }
  assert.equal(preparation.budgets?.path, relative(root, budgetsPath), 'Unexpected preparation budgets path');
  assert.equal(digest(await readFile(budgetsPath)), preparation.budgets.sha256, 'Executing budgets differ from preparation');
  assert.equal(digest(budgetsBytes), preparation.budgets.sha256, 'Captured budgets differ from preparation');
  assert.equal(candidateFiles.get(preparation.budgets.path)?.sha256, preparation.budgets.sha256, 'Budgets differ from candidate sealed source');
  for (const item of support) assert.equal(candidateFiles.get(item.path)?.sha256, item.sha256, `Support differs from candidate sealed source: ${item.path}`);
  for (const variant of preparation.variants) {
    const base = resolve(prepared, variant.root ?? variant.id), receiptPath = resolve(prepared, variant.receipt ?? `${variant.root ?? variant.id}/receipt.json`);
    const receiptBytes = await readFile(receiptPath), receipt = JSON.parse(receiptBytes);
    if (variant.receiptSha256) assert.equal(digest(receiptBytes), variant.receiptSha256, `${variant.id} receipt changed`);
    for (const asset of receipt.assets) assert.equal(digest(await readFile(resolve(base, 'site', asset.path))), asset.sha256, `${variant.id}/${asset.path} changed`);
    for (const archive of receipt.packages ?? []) {
      const path = archive.path ?? archive.archive; if (path && archive.sha256) assert.equal(digest(await readFile(resolve(prepared, path))), archive.sha256, 'Packed archive changed');
    }
  }
  for (const item of harness) assert.equal(digest(await readFile(resolve(import.meta.dirname, item.path))), item.sha256, `Harness changed: ${item.path}`);
  for (const item of support) assert.equal(digest(await readFile(resolve(root, item.path))), item.sha256, `Support changed: ${item.path}`);
}
// The shared historical server lazily compresses index.html. Prime every fixture
// document through HTTP/2 before any browser/sample clock; do not change that server.
async function prewarmDocument(url, path) {
  const session = connect(url, {rejectUnauthorized: false});
  try {
    return await new Promise((resolve, reject) => {
      session.once('error', reject);
      const request = session.request({':path': '/' + path, 'accept-encoding': 'gzip'});
      request.setTimeout(20000, () => request.destroy(new Error(`Document prewarm timed out: ${path}`)));
      let headers; const chunks = [];
      request.once('response', value => {headers = value;});
      request.on('data', value => chunks.push(value));
      request.once('error', reject);
      request.once('end', () => {
        try {
          assert.equal(headers?.[':status'], 200, `Document prewarm failed: ${path}`);
          assert.equal(headers['content-encoding'], 'gzip', `Document prewarm was not gzip: ${path}`);
          const bytes = Buffer.concat(chunks);
          resolve({path, bytes: bytes.length, sha256: digest(bytes), protocol: 'h2', encoding: 'gzip'});
        } catch (error) {reject(error);}
      });
      request.end();
    });
  } finally {session.destroy();}
}
async function verifyCompletion() {
  await verify();
  assert.deepEqual(await runtimePins(), acquisitionRuntime, 'Pinned Node or Playwright package bytes changed');
  assert.equal((await executionRuntimeIdentity(root, runtimeConfigurations)).digest, runtimeIdentity.digest, 'Pinned browser distribution or runtime bytes changed');
}
await verify();
const manifest = {schemaVersion: 1, startedAt: new Date().toISOString(), qualification, n, repetitions, seed, variants, comparisons: preparation.comparisons ?? [], configs, modes, jobs, preparation: {path: prepared, sha256: digest(sourceManifestBytes), identity: preparation}, budgets: {path: relative(root, budgetsPath), sha256: digest(budgetsBytes), values: budgets}, harness, support, browserIdentities, runtimeIdentity, acquisitionRuntime, environment, host: {cpu: os.cpus()[0]?.model, platform: os.platform(), release: os.release(), arch: os.arch(), node: process.version}, protocol: await readFile(resolve(root, 'plans/lazy-delivery/validation.md'), 'utf8')};
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
const raw = resolve(out, 'samples.jsonl'); let activeJob = null, activeBrowser = null, aborted = false, terminal = 0, succeeded = 0;
function signalHandler(signal) {aborted = true; appendFileSync(raw, JSON.stringify({at: new Date().toISOString(), status: 'aborted', signal, job: activeJob}) + '\n'); void activeBrowser?.close();}
process.once('SIGINT', signalHandler); process.once('SIGTERM', signalHandler);
try {
    const servers = new Map();
    try {
      const serverPrewarm = [];
      for (const variant of variants) {
        const server = await serve(variant.root ?? variant.id, 0, prepared);
        servers.set(variant.id, server);
        const receipt = JSON.parse(await readFile(resolve(prepared, variant.receipt ?? `${variant.root ?? variant.id}/receipt.json`)));
        const documents = receipt.assets.filter(asset => asset.path.endsWith('.html'));
        assert(documents.some(asset => asset.path === 'index.html'), `${variant.id} has no measured document`);
        for (const asset of documents) {
          const warmed = await prewarmDocument(server.url, asset.path);
          assert.equal(warmed.bytes, asset.gzipBytes, `Prewarmed document differs from receipt: ${variant.id}/${asset.path}`);
          serverPrewarm.push({variant: variant.id, ...warmed});
        }
      }
      await writeFile(resolve(out, 'server-prewarm.json'), JSON.stringify({completedAt: new Date().toISOString(), documents: serverPrewarm}, null, 2) + '\n', {flag: 'wx'});
      for (const job of jobs) {
        assert(!aborted, 'Campaign aborted'); activeJob = job;
        await appendFile(raw, JSON.stringify({at: new Date().toISOString(), status: 'started', job}) + '\n');
        let page; const errors = [], failures = [];
        try {
          const browser = activeBrowser = await ({chromium, firefox, webkit})[job.browser].launch();
          const touch = job.input === 'touch';
          const context = await browser.newContext({ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: touch ? {width: 390, height: 844} : {width: 1280, height: 900}, ...(touch ? {hasTouch: true, isMobile: true} : {})});
          page = await context.newPage(); page.setDefaultTimeout(20000);
          page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failures.push({url: request.url(), error: request.failure()?.errorText})); page.on('response', response => {if (response.status() >= 400) failures.push({url: response.url(), status: response.status()});});
          const cdp = job.browser === 'chromium' ? await context.newCDPSession(page) : null;
          if (job.profile.startsWith('constrained')) {
            await cdp.send('Emulation.setCPUThrottlingRate', {rate: budgets.constrained.cpuRate}); await cdp.send('Network.enable');
            await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: budgets.constrained.latencyMs, downloadThroughput: budgets.constrained.downloadBitsPerSecond / 8, uploadThroughput: budgets.constrained.uploadBitsPerSecond / 8});
          }
          await page.goto(`${servers.get(job.variant).url}/?mode=${job.requestedMode}`, {waitUntil: 'domcontentloaded'});
          await page.waitForFunction(() => !!window.deliveryStudy);
          const initial = await page.evaluate(() => ({startup: deliveryStudy.startup, shellReadyMs: deliveryStudy.shellReadyMs, actualMode: deliveryStudy.actualMode}));
          let first = null, second = null, unused = null, abandoned = null, abandonedObservation = null;
          const trigger = job.family === 'date' ? page.locator('en-date-picker #picker-trigger').getByRole('button') : page.locator('#trigger');
          if (['prepared', 'immediate', 'abandoned'].includes(job.policy)) {
            // This symmetric fixture precondition also applies to emulated touch:
            // the tap measures opening from a focused native trigger.
            await trigger.focus();
            await page.evaluate(() => {window.pendingDeliveryPreparation = deliveryStudy.prepare(); pendingDeliveryPreparation.catch(error => deliveryStudy.errors.push(String(error)));});
            if (job.policy === 'prepared') await page.waitForTimeout(budgets.preparedLeadMs);
          }
          if (['unused', 'abandoned'].includes(job.policy)) {
            if (job.policy === 'abandoned') {
              await page.evaluate(() => deliveryStudy.abandon());
              // Keep the predeclared observation receipt even when the import is still pending.
              await page.waitForTimeout(budgets.unusedObservationMs);
              abandonedObservation = await page.evaluate(() => deliveryStudy.snapshot());
              await page.evaluate(() => Promise.race([pendingDeliveryPreparation, new Promise((_, reject) => setTimeout(() => reject(new Error('Abandoned preparation timeout')), 20000))]));
              await page.evaluate(() => deliveryStudy.assertPreparationInert('abandoned-completion'));
              abandoned = await page.evaluate(() => deliveryStudy.snapshot());
            } else await page.waitForTimeout(budgets.unusedObservationMs);
            if (job.policy !== 'abandoned') unused = await page.evaluate(() => deliveryStudy.snapshot());
          } else {
            const use = async () => {
              if (touch) await trigger.tap(); else await trigger.press('Enter');
              return page.evaluate(() => Promise.race([deliveryStudy.action, new Promise((_, reject) => setTimeout(() => reject(new Error('Action readiness timeout')), 20000))]));
            };
            first = await use(); assert(first && Number.isFinite(first.firstReadyMs), 'Missing full first-use readiness');
            if (job.family === 'date') assert(first.focusInside && first.open, 'Calendar not open and focused');
            if (job.policy === 'immediate' && job.profile.startsWith('constrained')) assert.equal(first.preparationPendingAtActivation, true, 'Immediate throttled first use did not activate while preparation was pending');
            await page.evaluate(() => deliveryStudy.close()); second = await use();
            if (job.family === 'date') assert(second.focusInside && second.open, 'Repeat calendar not open and focused');
            await page.evaluate(() => deliveryStudy.close());
          }
          const checkpoints = [];
          if (job.kind === 'retention') {
            for (let cycle = 0; cycle <= budgets.retention.cyclesPerContext; cycle++) {
              if (cycle) await page.evaluate(() => deliveryStudy.cycle());
              if (budgets.retention.checkpoints.includes(cycle)) {
                await page.waitForTimeout(300); await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
                checkpoints.push({cycle, heapBytes: (await cdp.send('Runtime.getHeapUsage')).usedSize, dom: await cdp.send('Memory.getDOMCounters')});
              }
            }
          }
          if (['prepared', 'immediate'].includes(job.policy)) await page.evaluate(() => Promise.race([pendingDeliveryPreparation, new Promise((_, reject) => setTimeout(() => reject(new Error('Preparation completion timeout')), 20000))]));
          const final = await page.evaluate(() => ({after: deliveryStudy.snapshot(), preparation: deliveryStudy.preparation, errors: deliveryStudy.errors})); errors.push(...final.errors);
          assert.deepEqual(errors, [], 'Browser errors'); assert.deepEqual(failures, [], 'Failed network requests');
          assert(final.after.resources.every(resource => resource.protocol === 'h2'), 'Expected HTTP/2 asset delivery');
          const metrics = {shellReadyMs: initial.shellReadyMs, startupNodes: initial.startup.nodes, startupComponentNodes: initial.startup.componentNodes, startupJSBytes: initial.startup.jsBytes, startupJSRequests: initial.startup.jsRequests,
            firstReadyMs: first?.firstReadyMs ?? null, repeatReadyMs: second?.firstReadyMs ?? null, firstFrameMs: first?.nextFrameMs ?? null, loadMs: first?.loadMs ?? null, ensureMs: first?.ensureMs ?? null,
            navigationToReadyMs: first ? first.start + first.firstReadyMs : null, preparationLeadMs: first && final.preparation?.start != null ? first.start - final.preparation.start : null,
            afterJSBytes: final.after.jsBytes, afterNodes: final.after.nodes, unusedBytes: unused?.jsBytes ?? null, unusedNodes: unused?.nodes ?? null, abandonedBytes: abandoned?.jsBytes ?? null, abandonedNodes: abandoned?.nodes ?? null};
          await appendFile(raw, JSON.stringify({at: new Date().toISOString(), status: 'ok', job, actualMode: initial.actualMode, browserVersion: browser.version(), metrics, initial, first, second, unused, abandoned, abandonedObservation, ...final, checkpoints}) + '\n');
          succeeded++; terminal++; console.log(`${succeeded}/${jobs.length} ${job.variant} ${job.browser}/${job.profile}/${job.requestedMode} ${job.kind}`);
        } catch (error) {
          terminal++;
          await appendFile(raw, JSON.stringify({at: new Date().toISOString(), status: aborted ? 'aborted' : 'failed', job, error: String(error), stack: error.stack, errors, failures}) + '\n');
          if (page) await page.screenshot({path: resolve(out, 'failure.png')}).catch(() => {});
          throw error;
        } finally {await activeBrowser?.close(); activeBrowser = null; activeJob = null;}
      }
    } finally {for (const server of servers.values()) await server.close();}
  await verifyCompletion();
  await writeFile(resolve(out, 'summary.json'), JSON.stringify({status: 'complete', qualification, succeeded, terminal, planned: jobs.length, finishedAt: new Date().toISOString()}, null, 2) + '\n');
} catch (error) {
  // Failed and aborted campaigns retain the final source check too; they cannot
  // accidentally appear to have preserved provenance just because no rows passed.
  let integrityError = null;
  try {await verifyCompletion();} catch (failure) {integrityError = failure;}
  await writeFile(resolve(out, 'summary.json'), JSON.stringify({status: aborted ? 'aborted' : 'incomplete', qualification, succeeded, terminal, planned: jobs.length, error: String(error), integrityError: integrityError ? String(integrityError) : null, finishedAt: new Date().toISOString()}, null, 2) + '\n');
  if (integrityError) throw new AggregateError([error, integrityError], 'Acquisition failed and final provenance verification failed');
  throw error;
} finally {process.removeListener('SIGINT', signalHandler); process.removeListener('SIGTERM', signalHandler);}
});
