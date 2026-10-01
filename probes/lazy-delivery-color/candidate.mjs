/**
 * Source-only diagnostic until explicitly acquired by the validation owner.
 * Run through tooling/test-pipeline/with-toolchain.sh with:
 * EN_COLOR_REFERENCE_SITE and EN_COLOR_CANDIDATE_SITE = frozen site directories;
 * each directory's parent must contain its assets.json and receipt.json.
 * EN_COLOR_CANDIDATE_COLD_ASSETS = frozen JSON array of candidate unique optional
 * JS paths relative to site (for example assets/color-picker-<hash>.js).
 * EN_COLOR_CANDIDATE_COLD_PRODUCER = the source-graph producer's JSON receipt.
 * EN_EXECUTION_OUTPUT = fresh, non-existing result directory.
 * EN_COLOR_CANDIDATE_OUTPUT is an optional alias; if both are set they must agree.
 * No baseline receipt is read as a sample, amended, pooled, or overwritten.
 */
import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFile, mkdir, readFile, readdir, realpath, symlink, writeFile} from 'node:fs/promises';
import {connect} from 'node:http2';
import {cpus, platform, release, totalmem} from 'node:os';
import {createRequire} from 'node:module';
import {resolve, dirname, relative, isAbsolute, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {serve} from '../scoped-hydration/production/server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const route = '/api-examples/composable-chat.html';
const output = process.env.EN_COLOR_CANDIDATE_OUTPUT ?? process.env.EN_EXECUTION_OUTPUT;
if (!process.env.EN_COLOR_REFERENCE_SITE || !process.env.EN_COLOR_CANDIDATE_SITE || !process.env.EN_COLOR_CANDIDATE_COLD_ASSETS || !process.env.EN_COLOR_CANDIDATE_COLD_PRODUCER || !output) {
  throw new Error('Set EN_COLOR_REFERENCE_SITE, EN_COLOR_CANDIDATE_SITE, EN_COLOR_CANDIDATE_COLD_ASSETS, EN_COLOR_CANDIDATE_COLD_PRODUCER, and a fresh EN_EXECUTION_OUTPUT.');
}
const out = resolve(output);
const coldAssetsPath = resolve(process.env.EN_COLOR_CANDIDATE_COLD_ASSETS);
const coldProducerPath = resolve(process.env.EN_COLOR_CANDIDATE_COLD_PRODUCER);
if (process.env.EN_COLOR_CANDIDATE_OUTPUT && process.env.EN_EXECUTION_OUTPUT) {
  assert.equal(resolve(process.env.EN_COLOR_CANDIDATE_OUTPUT), resolve(process.env.EN_EXECUTION_OUTPUT), 'Output aliases must agree.');
}
const arms = ['reference', 'candidate'];
const distributions = {
  reference: resolve(process.env.EN_COLOR_REFERENCE_SITE),
  candidate: resolve(process.env.EN_COLOR_CANDIDATE_SITE),
};
assert.notEqual(distributions.reference, distributions.candidate, 'Arms require distinct frozen distributions.');
for (const distribution of Object.values(distributions)) {
  assert(out !== distribution && !out.startsWith(distribution + sep), 'Results must not alter a frozen distribution.');
}
const protocol = Object.freeze({
  blocks: 30, orderSeed: 2026092803, bootstrapSeed: 2026092804, bootstrapDraws: 10000,
  confidence: .95, maximumAddedReadyMs: 50,
  cpuRate: 4, latencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000,
  viewport: {width: 1280, height: 900}, reducedMotion: 'reduce',
});
const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve('@playwright/test/package.json');
const playwrightCorePath = require.resolve('playwright-core/package.json');
const cdpProtocolPath = resolve(dirname(playwrightCorePath), 'types/protocol.d.ts');
const browsersPath = resolve(dirname(playwrightCorePath), 'browsers.json');
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const failure = error => ({message: String(error), stack: error?.stack});
const same = (before, after) => JSON.stringify(before) === JSON.stringify(after);
const sourceFiles = [
  'probes/lazy-delivery-color/candidate.mjs', 'probes/lazy-delivery-color/baseline.mjs',
  'probes/lazy-delivery-color/README.md', 'plans/lazy-delivery/color-popup.md',
  'plans/lazy-delivery/budgets.json', 'package.json', 'package-lock.json', '.node-version',
  'apps/docs/src/api-example/main.ts', 'apps/docs/src/composable-chat-demo.definition.ts',
  'apps/docs/src/composable-chat-color-delivery.ts', 'apps/docs/src/composable-chat-color-ownership.mjs',
  'packages/elements/src/token-editor/element.ts', 'packages/elements/src/color-picker/element.ts',
  'probes/scoped-hydration/production/server.mjs', 'showcases/performance/src/lock.mjs',
  'showcases/performance/src/config.mjs', 'showcases/performance/registry/systems.json',
  'showcases/performance/profiles/profiles.json', 'tooling/testing/execution-owner.mjs',
  'tooling/testing/machine-owner.mjs', 'tooling/test-pipeline/with-toolchain.sh',
];
const identity = async paths => Object.fromEntries(await Promise.all(paths.map(async path => [path, await hash(path)])));
const sourceIdentity = () => identity(sourceFiles.map(name => resolve(root, name)));
const supportIdentity = () => identity([playwrightPackagePath, playwrightCorePath, cdpProtocolPath, browsersPath, process.execPath]);
const coldIdentity = () => identity([coldAssetsPath, coldProducerPath]);
function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296;};
}
const orderRandom = randomGenerator(protocol.orderSeed);
const schedule = Array.from({length: protocol.blocks}, (_, index) => ({block: index + 1, order: orderRandom() < .5 ? [...arms] : [...arms].reverse()}));
function quantile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), index = (sorted.length - 1) * p;
  const lo = Math.floor(index), hi = Math.ceil(index);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}
const describe = values => ({n: values.length, medianMs: quantile(values, .5), p75Ms: quantile(values, .75), minimumMs: values.length ? Math.min(...values) : null, maximumMs: values.length ? Math.max(...values) : null});
function pairedBootstrap(pairs) {
  const random = randomGenerator(protocol.bootstrapSeed), draws = [];
  for (let draw = 0; draw < protocol.bootstrapDraws; draw++) {
    const reference = [], candidate = [];
    for (let index = 0; index < pairs.length; index++) {
      const selected = pairs[Math.floor(random() * pairs.length)];
      reference.push(selected.referenceMs); candidate.push(selected.candidateMs);
    }
    draws.push(quantile(candidate, .5) - quantile(reference, .5));
  }
  return {lowerMs: quantile(draws, .025), upperMs: quantile(draws, .975), confidence: protocol.confidence, draws: protocol.bootstrapDraws, seed: protocol.bootstrapSeed,
    method: 'Paired-block percentile bootstrap; resample common block indices and recompute candidate median minus reference median in every draw.'};
}
function contained(base, name) {
  assert(typeof name === 'string' && name && !isAbsolute(name), 'Inventory paths must be relative.');
  const path = resolve(base, name), local = relative(base, path);
  assert(local && local !== '..' && !local.startsWith('..' + sep) && !isAbsolute(local), 'Inventory path escapes frozen site.');
  return path;
}
async function fileNames(directory, prefix = '') {
  const names = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) names.push(...await fileNames(resolve(directory, entry.name), name + '/'));
    else {assert(entry.isFile(), 'Frozen distributions must contain regular files only: ' + name); names.push(name);}
  }
  return names.sort();
}
async function frozenIdentity(arm) {
  const distribution = distributions[arm], inventoryPath = resolve(dirname(distribution), 'assets.json');
  const receiptPath = resolve(dirname(distribution), 'receipt.json');
  const inventoryBytes = await readFile(inventoryPath), receiptBytes = await readFile(receiptPath);
  const inventory = JSON.parse(inventoryBytes), receipt = JSON.parse(receiptBytes);
  assert(Array.isArray(inventory) && inventory.length, 'Frozen assets.json must be a nonempty file inventory.');
  const names = inventory.map(item => item.path).sort();
  assert.equal(new Set(names).size, names.length, 'Duplicate frozen asset paths.');
  assert(names.includes(route.slice(1)), 'Frozen route is absent from inventory.');
  const actualNames = await fileNames(distribution), files = [];
  for (const item of [...inventory].sort((a, b) => a.path.localeCompare(b.path))) {
    assert(Number.isSafeInteger(item.bytes) && item.bytes >= 0 && /^[a-f0-9]{64}$/.test(item.sha256), 'Malformed frozen asset identity.');
    const bytes = await readFile(contained(distribution, item.path));
    files.push({path: item.path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), expectedBytes: item.bytes, expectedSha256: item.sha256});
  }
  return {distribution, inventoryPath, inventorySha256: createHash('sha256').update(inventoryBytes).digest('hex'), receiptPath,
    receiptSha256: createHash('sha256').update(receiptBytes).digest('hex'), receipt, inventory,
    matchesFrozenInventory: same(names, actualNames) && files.every(item => item.bytes === item.expectedBytes && item.sha256 === item.expectedSha256), actualNames, files};
}
function traffic(resources, site, origin) {
  const files = new Map(site.inventory.map(item => [item.path, item]));
  const entries = resources.map(resource => {
    const url = new URL(resource.name), path = decodeURIComponent(url.pathname).slice(1);
    return {...resource, frozenRawFileBytes: url.origin === origin ? files.get(path)?.bytes ?? null : null,
      frozenFileSha256: url.origin === origin ? files.get(path)?.sha256 ?? null : null};
  });
  return {entries, requests: entries.length, decodedBodyBytes: entries.reduce((sum, item) => sum + item.decodedBodySize, 0),
    encodedBodyBytes: entries.reduce((sum, item) => sum + item.encodedBodySize, 0), transferBytes: entries.reduce((sum, item) => sum + item.transferSize, 0),
    missingFrozenFiles: entries.filter(item => item.frozenRawFileBytes === null).map(item => item.name),
    accounting: 'ResourceTiming decoded body, encoded body, and transfer sizes are separate observed metrics; frozen raw file sizes are provenance, not an inferred gzip or wire saving.'};
}
function networkRecord(event, data, phase) {
  const common = {event, phase, requestId: data.requestId, timestamp: data.timestamp};
  if (event === 'Network.requestWillBeSent') return {...common, type: data.type, url: data.request.url, method: data.request.method, initiatorType: data.initiator.type, wallTime: data.wallTime};
  if (event === 'Network.responseReceived') return {...common, type: data.type, url: data.response.url, status: data.response.status, protocol: data.response.protocol, encodedDataLength: data.response.encodedDataLength,
    contentEncoding: data.response.headers['content-encoding'] ?? data.response.headers['Content-Encoding'] ?? 'identity', fromDiskCache: data.response.fromDiskCache, fromServiceWorker: data.response.fromServiceWorker};
  if (event === 'Network.dataReceived') return {...common, dataLength: data.dataLength, encodedDataLength: data.encodedDataLength};
  if (event === 'Network.loadingFinished') return {...common, encodedDataLength: data.encodedDataLength};
  return {...common, type: data.type, errorText: data.errorText, canceled: data.canceled};
}
function verifyColdDelivery(row, origin, assets) {
  const isAsset = (url, asset) => {const parsed = new URL(url); return parsed.origin === origin && decodeURIComponent(parsed.pathname).slice(1) === asset;};
  const evidence = [];
  for (const asset of assets) {
    assert(!row.beforeAction.navigationResources.some(resource => isAsset(resource.name, asset)), 'Optional code was already loaded before action: ' + asset);
    assert(!row.preActionCDPRequests.some(request => isAsset(request.url, asset)), 'Optional code was requested before action: ' + asset);
    const resource = row.measurement.actionResources.find(resource => isAsset(resource.name, asset));
    assert(resource && resource.startTime >= row.measurement.start && resource.responseEnd <= row.measurement.end
      && resource.encodedBodySize > 0 && resource.decodedBodySize > 0 && resource.transferSize > 0, 'Missing complete post-action optional transfer: ' + asset);
    const request = row.cdpNetwork.find(event => event.event === 'Network.requestWillBeSent' && isAsset(event.url, asset));
    const response = request && row.cdpNetwork.find(event => event.event === 'Network.responseReceived' && event.requestId === request.requestId);
    const complete = request && row.cdpNetwork.find(event => event.event === 'Network.loadingFinished' && event.requestId === request.requestId);
    assert(request && response && complete && response.status === 200 && response.protocol === 'h2' && response.contentEncoding === 'gzip'
      && response.fromDiskCache !== true && response.fromServiceWorker !== true && complete.encodedDataLength > 0
      && !row.cdpNetwork.some(event => event.event === 'Network.requestServedFromCache' && event.requestId === request.requestId), 'Optional transfer lacks uncached h2/gzip CDP evidence: ' + asset);
    evidence.push({asset, resource, request, response, complete});
  }
  return {assets, evidence, verified: true, policy: 'Every frozen unique optional JS asset must be absent from completed navigation resources and pre-action CDP requests, then transfer uncached after the click and complete by full readiness.'};
}
// The shared server precompresses JS/CSS. Prime this route's HTML before any
// browser sample as well, using the existing production campaign convention.
async function prewarmDocument(url) {
  const session = connect(url, {rejectUnauthorized: false});
  try {
    return await new Promise((resolve, reject) => {
      session.once('error', reject);
      const request = session.request({':path': route, 'accept-encoding': 'gzip'});
      request.setTimeout(20000, () => request.destroy(new Error('Document prewarm timed out: ' + route)));
      let headers; const chunks = [];
      request.once('response', value => {headers = value;});
      request.on('data', value => chunks.push(value)); request.once('error', reject);
      request.once('end', () => {
        try {
          assert.equal(headers?.[':status'], 200, 'Document prewarm failed.');
          assert.equal(headers['content-encoding'], 'gzip', 'Document prewarm must use gzip.');
          const bytes = Buffer.concat(chunks);
          resolve({path: route, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), protocol: 'h2', encoding: 'gzip'});
        } catch (error) {reject(error);}
      });
      request.end();
    });
  } finally {session.destroy();}
}
const readHostState = args => {try {return {args, output: execFileSync('pmset', args, {encoding: 'utf8', timeout: 3000})};} catch (error) {return {args, unavailable: String(error)};}};
const manifest = {
  schemaVersion: 1, kind: 'composable-chat-matched-cold-color-diagnostic', startedAt: new Date().toISOString(), route, protocol, schedule, distributions,
  runnerSourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  runnerSourceTree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {cwd: root, encoding: 'utf8'}).trim(),
  runnerWorkingStatus: execFileSync('git', ['status', '--short'], {cwd: root, encoding: 'utf8'}).trim(),
  node: {version: process.version, executable: process.execPath, versions: process.versions},
  host: {platform: platform(), release: release(), cpus: cpus(), totalmem: totalmem(), operatorDeclaredContention: process.env.EN_COLOR_CANDIDATE_CONTENTION ?? 'not supplied'},
  processPolicy: 'One explicit full Chromium process, headless; fresh isolated context for every arm in every block. HTTP cache disabled, service workers blocked, no preparation. Fresh contexts do not establish independence or stationarity.',
  method: 'Thirty fixed paired blocks in seeded random arm order. CPU 4x before each route navigation, as baseline02; networking is unshaped during route startup. Apply 150ms/1.6Mbps/750Kbps shaping after route settlement, before the same trusted Colors click. Reuse baseline full readiness and two frame opportunities, then verify Hex edit/Enter/Cancel and unchanged draft. Stop on first functional failure or abort; retain incomplete blocks without replacements or pooling.',
  primaryStatistic: 'Candidate arm median action-to-ready minus reference arm median action-to-ready. Median of per-block differences is supporting only.',
  decisionPolicy: 'Only 30 complete successful pairs with unchanged identities can decide. Primary difference >50ms rejects this cold mechanism. Otherwise upper 95% paired-bootstrap bound >50ms is unqualified. Upper bound <=50ms passes only this diagnostic; full frozen matrix, benefit and retention gates remain required for promotion.',
  trafficPolicy: 'Both frozen sites use the unchanged shared production HTTP/2 server and gzip level 6. It precompresses JS/CSS before launch; prewarm the actual composable-chat HTML before every sample batch. Assert actual JS h2/gzip. Raw frozen-file sizes, ResourceTiming decoded/encoded/transfer sizes, and CDP observations remain separate. This action diagnostic makes no startup gzip-saving claim.',
  coldAssetsPath, coldProducerPath,
  limitations: ['Local Chromium CDP shaping is not a physical-device or field measurement.', 'Two frame opportunities do not prove presented pixels.', 'Bootstrap uncertainty is descriptive under paired-block sampling assumptions; it does not establish stationarity.', 'This cold action cell does not measure startup regression, preparation, repeat use, retention, or promotion eligibility.'],
  attempts: [],
};
let abortRequested = false, activeContext;
const stop = signal => {abortRequested = true; manifest.abortRequested = {signal, at: new Date().toISOString()}; void activeContext?.close().catch(() => {});};
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
await mkdir(out, {recursive: false});
const save = (name, value) => writeFile(resolve(out, name), JSON.stringify(value, null, 2) + '\n');
await save('started.json', manifest);

async function measure(browser, server, arm, block, ordinal) {
  const row = {block, arm, ordinal, startedAt: new Date().toISOString(), status: 'running', phase: 'startup', pageErrors: [], failedRequests: [], requests: [], responses: [], cdpNetwork: []};
  manifest.attempts.push(row);
  await appendFile(resolve(out, 'attempts.jsonl'), JSON.stringify({event: 'started', block, arm, ordinal, at: row.startedAt}) + '\n');
  let context, page;
  try {
    assert(!abortRequested, 'Batch aborted before arm acquisition.');
    context = await browser.newContext({viewport: protocol.viewport, reducedMotion: protocol.reducedMotion, serviceWorkers: 'block', ignoreHTTPSErrors: true});
    activeContext = context;
    await context.addInitScript(() => {performance.setResourceTimingBufferSize(10000); window.__colorResourceBufferFull = false; performance.addEventListener('resourcetimingbufferfull', () => {window.__colorResourceBufferFull = true;});});
    page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => row.pageErrors.push(failure(error)));
    page.on('requestfailed', request => row.failedRequests.push({url: request.url(), failure: request.failure(), phase: row.phase}));
    page.on('request', request => row.requests.push({url: request.url(), resourceType: request.resourceType(), phase: row.phase}));
    page.on('response', response => row.responses.push({url: response.url(), status: response.status(), contentEncoding: response.headers()['content-encoding'] ?? 'identity', phase: row.phase}));
    const cdp = await context.newCDPSession(page);
    for (const event of ['Network.requestWillBeSent', 'Network.requestServedFromCache', 'Network.responseReceived', 'Network.dataReceived', 'Network.loadingFinished', 'Network.loadingFailed']) {
      cdp.on(event, data => row.cdpNetwork.push(networkRecord(event, data, row.phase)));
    }
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: protocol.cpuRate});
    row.cpuShapingAppliedBeforeNavigation = true;
    await page.goto(server.url + route, {waitUntil: 'load', timeout: 45000});
    await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-example-standalone'));
    const colors = page.getByRole('button', {name: 'Colors', exact: true});
    await colors.scrollIntoViewIfNeeded();
    await colors.click({trial: true});
    row.beforeAction = await page.evaluate(async () => {
      const demo = document.querySelector('en-composable-chat-demo'), editor = demo.shadowRoot.querySelector('en-token-editor');
      await Promise.all([demo, editor, ...demo.shadowRoot.querySelectorAll('*')].map(element => element.updateComplete).filter(Boolean));
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
      const root = editor.shadowRoot, registry = 'customElementRegistry' in root ? root.customElementRegistry : window.customElements;
      const tags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
      return {value: editor.value, mode: demo.colorMode, optionalConstructed: !!root.querySelector(tags.join(',')),
        registry: registry === window.customElements ? 'global' : registry ? 'scoped' : 'null',
        definedTags: tags.filter(tag => !!registry?.get(tag)), navigationResources: performance.getEntriesByType('resource').map(entry => entry.toJSON())};
    });
    assert.equal(row.beforeAction.registry, 'global', 'Production route registry changed.');
    assert.equal(row.beforeAction.mode, 'picker', 'Production route must use inline picker mode.');
    assert.equal(row.beforeAction.optionalConstructed, false, 'Optional controls must be absent before first use.');
    assert.equal(row.beforeAction.definedTags.length, arm === 'reference' ? 5 : 0, 'Reference must be eager; candidate definitions must be cold before first use.');
    await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: protocol.latencyMs, downloadThroughput: protocol.downloadBitsPerSecond / 8, uploadThroughput: protocol.uploadBitsPerSecond / 8});
    row.shapingAppliedAt = new Date().toISOString(); row.phase = 'action';
    // Action/readiness/usability behavior is copied from baseline02. The CDP
    // snapshot before the click qualifies cold delivery outside its predicate.
    await colors.evaluate(button => {
      const w = window;
      w.__colorEligibility = {state: 'armed'};
      button.addEventListener('click', event => {
        const start = performance.now();
        w.__colorEligibility = {state: 'running', start, eventTimeStamp: event.timeStamp, trusted: event.isTrusted};
        const demo = document.querySelector('en-composable-chat-demo');
        const editor = demo.shadowRoot.querySelector('en-token-editor');
        const visible = node => !!node && node.isConnected && node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0 && node.checkVisibility({visibilityProperty: true});
        const controls = () => {
          const dialog = editor.shadowRoot.querySelector('[part="popup"]');
          const picker = dialog?.querySelector('en-color-picker');
          const hex = picker?.shadowRoot?.querySelector('#hex')?.shadowRoot?.querySelector('input');
          const sliders = [...picker?.shadowRoot?.querySelectorAll('en-color-slider') ?? []];
          const ranges = sliders.map(slider => slider.shadowRoot?.querySelector('input[type="range"]'));
          const exactFields = sliders.map(slider => slider.shadowRoot?.querySelector('#exact-field'));
          const exactInputs = exactFields.map(field => field?.shadowRoot?.querySelector('input'));
          const formatHost = picker?.shadowRoot?.querySelector('en-select[part="format"]');
          const format = formatHost?.shadowRoot?.querySelector('select');
          const alphaHost = picker?.shadowRoot?.querySelector('en-switch[part="alpha-toggle"]');
          const alpha = alphaHost?.shadowRoot?.querySelector('input');
          const tabs = dialog?.querySelector('en-tabs');
          const tabHosts = [...tabs?.querySelectorAll('en-tab') ?? []];
          const panels = [...tabs?.querySelectorAll('en-tab-panel') ?? []];
          const swatches = [...tabs?.querySelectorAll('en-swatch') ?? []];
          const actions = [...dialog?.querySelector('[part="color-actions"]')?.querySelectorAll('en-button') ?? []];
          const buttons = actions.map(host => host.shadowRoot?.querySelector('button'));
          const complete = dialog?.matches(':popover-open') && visible(picker) && picker.value === '#5577cc'
            && visible(hex) && !hex.disabled && !hex.readOnly && hex.value === '#5577cc'
            && visible(format) && !format.disabled && format.value === 'hex' && JSON.stringify([...format.options].filter(option => !option.disabled && !option.hidden).map(option => option.value)) === JSON.stringify(['hex', 'rgb', 'hsl'])
            && visible(alpha) && !alpha.disabled && !alpha.checked && alpha.getAttribute('role') === 'switch'
            && ranges.length === 3 && ranges.every((range, index) => visible(range) && !range.disabled && Number(range.value) === [85, 119, 204][index])
            && exactInputs.every((input, index) => visible(input) && !input.disabled && !input.readOnly && input.value === String([85, 119, 204][index]))
            && tabs.value === 'picker' && tabHosts.length === 2 && tabHosts.every((tab, index) => visible(tab) && !tab.disabled && tab.getAttribute('role') === 'tab'
              && tab.getAttribute('aria-selected') === String(index === 0) && tab.getAttribute('aria-disabled') === 'false' && tab.tabIndex === (index === 0 ? 0 : -1))
            && panels.length === 2 && panels.every((panel, index) => panel.matches(':defined') && panel.getAttribute('role') === 'tabpanel' && panel.hidden === (index === 1)
              && panel.getAttribute('aria-labelledby') === tabHosts[index].id && tabHosts[index].getAttribute('aria-controls') === panel.id)
            && swatches.length > 0 && swatches.every(swatch => swatch.matches(':defined') && !!swatch.shadowRoot)
            && buttons.length === 2 && buttons.every(native => visible(native) && !native.disabled)
            && picker.checkValidity();
          return {complete, dialog, picker, hex, sliders, tabs, actions, exactFields, formatHost, alphaHost, tabHosts, panels, swatches};
        };
        const observe = async () => {
          try {
            let found;
            do {
              if (performance.now() - start > 5000) throw new Error('Picker full-readiness deadline exceeded.');
              await new Promise(requestAnimationFrame);
              found = controls();
            } while (!found.complete);
            const nodes = [found.picker, found.tabs, found.formatHost, found.alphaHost, ...found.exactFields, ...found.sliders, ...found.actions, ...found.tabHosts, ...found.panels, ...found.swatches, found.picker.shadowRoot.querySelector('#hex')];
            await Promise.all(nodes.map(node => node.updateComplete));
            await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
            found = controls();
            if (!found.complete) throw new Error('Picker lost readiness during frame opportunities.');
            const end = performance.now();
            w.__colorEligibility = {...w.__colorEligibility, state: 'ready', end, durationMs: end - start,
              pickerValue: found.picker.value, hexValue: found.hex.value, sliderCount: found.sliders.length,
              popupRect: found.dialog.getBoundingClientRect().toJSON(),
              actionResources: performance.getEntriesByType('resource').filter(entry => entry.startTime >= start && entry.startTime <= end).map(entry => entry.toJSON())};
          } catch (error) { w.__colorEligibility = {...w.__colorEligibility, state: 'error', error: String(error), stack: error.stack}; }
        };
        void observe();
      }, {capture: true, once: true});
    });
    row.preActionCDPRequests = row.cdpNetwork.filter(event => event.event === 'Network.requestWillBeSent');
    await colors.click();
    await page.waitForFunction(() => ['ready', 'error'].includes(window.__colorEligibility?.state), null, {timeout: 6500});
    row.measurement = await page.evaluate(() => window.__colorEligibility);
    if (row.measurement.state !== 'ready' || !row.measurement.trusted) throw new Error(row.measurement.error ?? 'Action was not a trusted ready interaction.');
    const dialog = page.getByRole('dialog', {name: 'Color picker', exact: true});
    const hex = dialog.getByRole('textbox', {name: 'Hex color', exact: true});
    await hex.fill('#abcdef');
    await hex.press('Enter');
    await expect(dialog.locator('en-color-picker')).toHaveJSProperty('value', '#abcdef');
    row.editingVerifiedAfterMeasurement = true;
    await dialog.getByRole('button', {name: 'Cancel', exact: true}).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('en-token-editor')).toHaveJSProperty('value', row.beforeAction.value);

    row.phase = 'verified';
    const final = await page.evaluate(() => ({resources: performance.getEntriesByType('resource').map(entry => entry.toJSON()), bufferFull: window.__colorResourceBufferFull}));
    row.traffic = {navigation: traffic(row.beforeAction.navigationResources, manifest.sitesBefore[arm], server.url),
      actionToReady: traffic(row.measurement.actionResources, manifest.sitesBefore[arm], server.url), all: traffic(final.resources, manifest.sitesBefore[arm], server.url)};
    row.resourceTimingBufferFull = final.bufferFull;
    assert(!row.resourceTimingBufferFull, 'ResourceTiming buffer overflowed.');
    assert.equal(row.failedRequests.length, 0, 'Failed network requests were recorded.');
    assert.equal(row.pageErrors.length, 0, 'Browser page errors were recorded.');
    assert(row.responses.every(response => response.status < 400), 'HTTP failure responses were recorded.');
    if (arm === 'candidate') row.coldDelivery = verifyColdDelivery(row, server.url, manifest.coldAssets);
    const scripts = row.traffic.all.entries.filter(resource => new URL(resource.name).pathname.endsWith('.js'));
    assert(scripts.length && scripts.every(resource => resource.nextHopProtocol === 'h2'), 'All actual JS resources must use HTTP/2.');
    const scriptResponses = row.responses.filter(response => new URL(response.url).pathname.endsWith('.js'));
    assert(scriptResponses.length && scriptResponses.every(response => response.contentEncoding === 'gzip'), 'All actual JS responses must use gzip.');
    assert.equal(row.traffic.all.missingFrozenFiles.length, 0, 'Route fetched assets outside its frozen inventory.');
    assert(Number.isFinite(row.measurement.durationMs) && row.measurement.durationMs >= 0, 'Invalid action-ready timing.');
    assert(!abortRequested, 'Batch aborted during arm acquisition.');
    row.cancelPreservedDraft = true; row.status = 'pass';
  } catch (error) {
    row.status = abortRequested ? 'aborted' : 'fail'; row.error = failure(error);
    if (page) {
      row.measurement ??= await page.evaluate(() => window.__colorEligibility).catch(() => null);
      row.failureResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.toJSON())).catch(() => null);
      await page.screenshot({path: resolve(out, `block-${block}-${arm}-failure.png`), fullPage: true}).catch(error => {row.screenshotError = failure(error);});
    }
  } finally {
    try {await context?.close();} catch (error) {row.cleanupError = failure(error); row.status = abortRequested ? 'aborted' : 'fail';}
    if (row.status === 'pass' && (row.pageErrors.length || row.failedRequests.length)) {
      row.status = 'fail'; row.error = failure(new Error('Browser errors or failed requests appeared during final cleanup.'));
    }
    if (activeContext === context) activeContext = undefined;
    row.finishedAt = new Date().toISOString();
    await appendFile(resolve(out, 'attempts.jsonl'), JSON.stringify({event: 'terminal', ...row}) + '\n');
    await save('attempts.json', manifest);
    console.log(JSON.stringify({block, arm, status: row.status, readyMs: row.measurement?.durationMs}));
  }
  return row;
}

try {
  await exclusiveBrowserWork(async () => {
    const servers = new Map(); let browser;
    try {
      manifest.sourceBefore = await sourceIdentity(); manifest.supportBefore = await supportIdentity();
      manifest.coldInputsBefore = await coldIdentity();
      manifest.sitesBefore = {};
      for (const arm of arms) {
        manifest.sitesBefore[arm] = await frozenIdentity(arm);
        assert(manifest.sitesBefore[arm].matchesFrozenInventory, arm + ' site differs from its frozen inventory.');
      }
      manifest.coldAssets = JSON.parse(await readFile(coldAssetsPath, 'utf8'));
      manifest.coldProducer = JSON.parse(await readFile(coldProducerPath, 'utf8'));
      assert(Array.isArray(manifest.coldAssets) && manifest.coldAssets.length, 'Cold assets must be a nonempty frozen JSON array.');
      assert.equal(new Set(manifest.coldAssets).size, manifest.coldAssets.length, 'Cold asset paths must be unique.');
      for (const asset of manifest.coldAssets) {
        const path = contained(distributions.candidate, asset);
        assert(relative(distributions.candidate, path).replaceAll(sep, '/') === asset && asset.endsWith('.js'), 'Cold asset paths must be canonical site-relative JS paths.');
        assert(manifest.sitesBefore.candidate.inventory.some(item => item.path === asset), 'Cold asset is missing from the frozen candidate inventory: ' + asset);
      }
      manifest.playwright = {version: JSON.parse(await readFile(playwrightPackagePath, 'utf8')).version, packagePath: playwrightPackagePath, corePackagePath: playwrightCorePath, protocolPath: cdpProtocolPath, browsersPath};
      const executablePath = chromium.executablePath();
      assert(!/headless[_-]shell/i.test(executablePath), 'Use full bundled Chromium, not the headless-shell binary.');
      manifest.browser = {name: 'chromium', executable: executablePath, executableSha256: await hash(executablePath), headless: true, launchPolicy: 'Explicit bundled full Chromium executable with headless:true; no channel substitution.'};
      manifest.leases = {policy: 'exclusiveBrowserWork holds machine, checkout execution, and browser leases across identity checks, servers, acquisition, and final identity checks.',
        machineLock: process.env.EN_TEST_MACHINE_LOCK ?? process.env.EN_GATE_MACHINE_LOCK ?? null,
        machineOwner: process.env.EN_TEST_MACHINE_OWNER ?? process.env.EN_GATE_MACHINE_OWNER ?? null,
        executionOwner: process.env.EN_TEST_EXECUTION_OWNER ?? null, inheritedBrowserOwner: process.env.EN_GATE_BROWSER_OWNER ?? null};
      manifest.host.powerBefore = readHostState(['-g', 'batt']); manifest.host.thermalBefore = readHostState(['-g', 'therm']);
      const serverBase = resolve(out, 'server-input');
      manifest.serverInputs = {};
      for (const arm of arms) {
        const directory = resolve(serverBase, arm), receiptPath = resolve(directory, 'receipt.json'), sitePath = resolve(directory, 'site');
        await mkdir(directory, {recursive: true});
        const site = manifest.sitesBefore[arm];
        await writeFile(receiptPath, JSON.stringify({kind: 'color-diagnostic-server-input', sourceInventorySha256: site.inventorySha256, sourceReceiptSha256: site.receiptSha256, assets: site.inventory}, null, 2) + '\n', {flag: 'wx'});
        await symlink(distributions[arm], sitePath, 'dir');
        manifest.serverInputs[arm] = {receiptPath, receiptSha256: await hash(receiptPath), sitePath, resolvedSite: await realpath(sitePath)};
        servers.set(arm, await serve(arm, 0, serverBase));
      }
      manifest.origins = Object.fromEntries([...servers].map(([arm, server]) => [arm, server.url]));
      manifest.documentPrewarm = {};
      for (const [arm, server] of servers) manifest.documentPrewarm[arm] = await prewarmDocument(server.url);
      await save('acquisition.json', manifest);
      assert(!abortRequested, 'Batch aborted before browser launch.');
      browser = await chromium.launch({executablePath, headless: true}); manifest.browser.version = browser.version();
      acquisition: for (const job of schedule) {
        for (const [index, arm] of job.order.entries()) {
          if (abortRequested) break acquisition;
          const row = await measure(browser, servers.get(arm), arm, job.block, index + 1);
          if (row.status !== 'pass') break acquisition;
        }
      }
    } catch (error) {manifest.error = failure(error);}
    finally {
      // Final identity checks remain inside the ownership leases, including failures.
      const finalize = async (name, work) => {try {await work();} catch (error) {(manifest.finalizationErrors ??= []).push({name, ...failure(error)});}};
      await finalize('browser close', async () => {await browser?.close();});
      for (const [arm, server] of servers) await finalize(arm + ' server close', () => server.close());
      manifest.host.powerAfter = readHostState(['-g', 'batt']); manifest.host.thermalAfter = readHostState(['-g', 'therm']);
      await finalize('source identity', async () => {manifest.sourceAfter = await sourceIdentity(); manifest.sourceUnchanged = same(manifest.sourceBefore, manifest.sourceAfter);});
      await finalize('support identity', async () => {manifest.supportAfter = await supportIdentity(); manifest.supportUnchanged = same(manifest.supportBefore, manifest.supportAfter);});
      await finalize('cold asset inputs', async () => {manifest.coldInputsAfter = await coldIdentity(); manifest.coldInputsUnchanged = same(manifest.coldInputsBefore, manifest.coldInputsAfter);});
      manifest.sitesAfter = {};
      for (const arm of arms) await finalize(arm + ' frozen identity', async () => {manifest.sitesAfter[arm] = await frozenIdentity(arm);});
      manifest.sitesUnchanged = same(manifest.sitesBefore, manifest.sitesAfter) && arms.every(arm => manifest.sitesAfter[arm]?.matchesFrozenInventory);
      for (const arm of arms) if (manifest.serverInputs?.[arm]) await finalize(arm + ' server input identity', async () => {
        const input = manifest.serverInputs[arm];
        input.receiptSha256After = await hash(input.receiptPath); input.resolvedSiteAfter = await realpath(input.sitePath);
        assert.equal(input.receiptSha256After, input.receiptSha256, 'Server input receipt changed.');
        assert.equal(input.resolvedSiteAfter, input.resolvedSite, 'Server input site target changed.');
      });
      if (manifest.browser) await finalize('browser identity', async () => {manifest.browser.executableSha256After = await hash(manifest.browser.executable); manifest.browserUnchanged = manifest.browser.executableSha256 === manifest.browser.executableSha256After;});
    }
  }, {workspaceRoot: root});
} catch (error) {manifest.error ??= failure(error);}
finally {
  manifest.finishedAt = new Date().toISOString();
  const pairs = schedule.flatMap(job => {
    const rows = manifest.attempts.filter(row => row.block === job.block);
    const reference = rows.find(row => row.arm === 'reference' && row.status === 'pass');
    const candidate = rows.find(row => row.arm === 'candidate' && row.status === 'pass');
    return reference && candidate ? [{block: job.block, referenceMs: reference.measurement.durationMs, candidateMs: candidate.measurement.durationMs, differenceMs: candidate.measurement.durationMs - reference.measurement.durationMs}] : [];
  });
  const armSummaries = Object.fromEntries(arms.map(arm => [arm, describe(manifest.attempts.filter(row => row.arm === arm && row.status === 'pass').map(row => row.measurement.durationMs))]));
  const valid = pairs.length === protocol.blocks && manifest.attempts.length === protocol.blocks * 2
    && manifest.attempts.every(row => row.status === 'pass') && !abortRequested && !manifest.error && !manifest.finalizationErrors?.length
    && manifest.sourceUnchanged && manifest.supportUnchanged && manifest.coldInputsUnchanged && manifest.sitesUnchanged && manifest.browserUnchanged;
  const differenceMs = pairs.length ? quantile(pairs.map(pair => pair.candidateMs), .5) - quantile(pairs.map(pair => pair.referenceMs), .5) : null;
  const uncertainty = valid ? pairedBootstrap(pairs) : null;
  const decision = !valid ? 'incomplete or invalid: no timing decision'
    : differenceMs > protocol.maximumAddedReadyMs ? 'reject: cold action median regression exceeds +50ms'
    : uncertainty.upperMs > protocol.maximumAddedReadyMs ? 'unqualified: paired-bootstrap upper bound exceeds +50ms'
    : 'this cold diagnostic passes; full frozen matrix is still required before any promotion';
  manifest.summary = {valid, completePairs: pairs.length, plannedPairs: protocol.blocks, attempts: manifest.attempts.length,
    notRun: protocol.blocks * 2 - manifest.attempts.length, failedOrAborted: manifest.attempts.filter(row => row.status !== 'pass').length,
    arms: armSummaries, pairs, primaryDifferenceOfArmMediansMs: differenceMs, supportingPairedDifferences: describe(pairs.map(pair => pair.differenceMs)),
    uncertainty, p95: 'Not reported: fewer than 100 observations per arm.', decision,
    claim: 'Observed matched reference/candidate cold action timings only. No floor-based inference, preparation claim, byte-saving claim, or promotion.'};
  await save('candidate.json', manifest);
  console.log(JSON.stringify({output: out, ...manifest.summary, error: manifest.error}, null, 2));
  if (!valid) process.exitCode = 1;
}
