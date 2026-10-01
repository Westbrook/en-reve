/**
 * SOURCE DRAFT — not executed. Full color timing is a fresh acquisition after
 * source/static/cold qualification, never a continuation of candidate.mjs data.
 */
import assert from 'node:assert/strict';
import {appendFile, readFile, realpath, writeFile} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, relative} from 'node:path';
import {chromium, firefox, webkit} from '@playwright/test';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {openFullInputs, startFullServers} from './full-common.mjs';
import {route, installFullProbe, waitRouteReady, snapshot, prepare,
  awaitPreparation, setupAction, action, close, verifyUsability, ensureSameCode, markFocus, assertMarkedFocus} from './full-probe.mjs';

const root = resolve(import.meta.dirname, '../..');
const arg = (key, fallback) => process.argv.find(value => value.startsWith('--' + key + '='))?.slice(key.length + 3) ?? fallback;
const qualification = process.argv.includes('--qualification');
const n = Number(arg('n', qualification ? '1' : '30'));
assert(Number.isSafeInteger(n) && (qualification ? n === 1 : n >= 30), 'Qualification is exactly one block; full timing needs at least thirty fixed blocks.');
const seed = Number(arg('seed', '2026092901'));
assert(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff);
const inputsArg = arg('inputs'), controlledArg = arg('controlled'), coldArg = arg('cold');
const outArg = arg('out', process.env.EN_EXECUTION_OUTPUT);
assert(inputsArg && controlledArg && coldArg && outArg, 'Supply --inputs, --controlled, --cold, and fresh --out.');
if (process.env.EN_EXECUTION_OUTPUT) assert.equal(resolve(outArg), resolve(process.env.EN_EXECUTION_OUTPUT), 'Output aliases differ.');
const configs = ['chromium', 'firefox', 'webkit'].flatMap(browser => [
  {browser, profile: 'desktop', viewport: {width: 1280, height: 900}},
  {browser, profile: 'phone', viewport: {width: 390, height: 844}},
]).concat([{browser: 'chromium', profile: 'constrained', viewport: {width: 1280, height: 900}}]);
const policies = ['cold', 'prepared', 'immediate', 'unused', 'prepared-unused', 'abandoned', 'same-code'];
const activePolicies = new Set(['cold', 'prepared', 'immediate', 'same-code']);
const preparationPolicies = new Set(['prepared', 'immediate', 'prepared-unused', 'abandoned']);
const at = () => new Date().toISOString();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async path => sha(await readFile(path));
const failure = error => ({message: String(error), stack: error?.stack ?? null});
const writeNew = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
function randomizer(initial) {
  let state = initial >>> 0;
  return values => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const other = Math.floor(state / 4294967296 * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };
}
const shuffled = randomizer(seed), jobs = [];
for (let block = 0; block < n; block++) for (const config of shuffled(configs)) {
  for (const policy of shuffled(policies)) for (const input of shuffled(activePolicies.has(policy) ? ['keyboard', 'pointer'] : ['none'])) {
    for (const arm of shuffled(['reference', 'candidate'])) {
      const pairGroup = policy === 'same-code' ? 'controlled' : 'production';
      jobs.push({id: 'timing-' + String(jobs.length + 1).padStart(6, '0'), block, pairGroup, sourceKind: pairGroup,
        arm, policy, input, pointerType: input === 'pointer' ? config.profile === 'phone' ? 'touch' : 'mouse' : null,
        config: config.browser + '/' + config.profile, ...config, requestedRegistry: 'production-default'});
    }
  }
}

/** Gzip sums are receipt attribution for observed unique JS, never wire bytes. */
function traffic(resources, receipt, origin) {
  assert(Array.isArray(resources), 'Timing resource observations are absent.');
  const inventory = new Map(receipt.assets.map(asset => [asset.path, asset]));
  assert.equal(inventory.size, receipt.assets.length, 'Duplicate receipt assets.');
  const entries = [], selected = new Map();
  for (const resource of resources) {
    const url = new URL(resource.name);
    if (!/\.m?js$/.test(url.pathname)) continue;
    assert.equal(url.origin, origin, 'External executable resource in measured route.');
    const path = decodeURIComponent(url.pathname).slice(1), asset = inventory.get(path);
    assert(asset && Number.isSafeInteger(asset.bytes) && asset.bytes >= 0
      && Number.isSafeInteger(asset.gzipBytes) && asset.gzipBytes >= 0 && /^[a-f0-9]{64}$/.test(asset.sha256), 'Unsealed executable resource: ' + path);
    for (const field of ['decodedBodySize', 'encodedBodySize', 'transferSize', 'startTime', 'responseEnd']) {
      assert(Number.isFinite(resource[field]) && resource[field] >= 0, 'Missing observed resource field: ' + field);
    }
    assert.equal(resource.nextHopProtocol, 'h2', 'Executable resource did not use HTTP/2.');
    entries.push({...resource, path, frozenFileSha256: asset.sha256}); selected.set(path, asset);
  }
  assert(entries.length, 'No complete executable resources observed.');
  const assets = [...selected.values()].sort((a, b) => a.path.localeCompare(b.path));
  return {resources: entries, assets, requests: entries.length, uniqueRequests: assets.length,
    rawBytes: assets.reduce((sum, item) => sum + item.bytes, 0), gzipBytes: assets.reduce((sum, item) => sum + item.gzipBytes, 0),
    decodedBodyBytes: entries.reduce((sum, item) => sum + item.decodedBodySize, 0),
    encodedBodyBytes: entries.reduce((sum, item) => sum + item.encodedBodySize, 0), transferBytes: entries.reduce((sum, item) => sum + item.transferSize, 0),
    accounting: 'Unique observed JS receipt raw/gzip-6 sizes are attribution; ResourceTiming encoded/decoded/transfer sizes and request counts remain separate.'};
}
const ownerFields = ['actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource',
  'documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup'];
const owner = value => Object.fromEntries(ownerFields.map(key => [key, value[key]]));
function sameOwner(before, after) {
  assert.deepEqual(owner(after), owner(before), 'Actual route editor registry/ownership changed.');
  for (const key of ['documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup']) {
    assert.equal(before[key], true, 'Invalid initial route ownership: ' + key); assert.equal(after[key], true, 'Invalid current route ownership: ' + key);
  }
  assert(after.editorSame && after.rootSame && after.textboxSame, 'Route editor identity changed.');
}
function sameClosed(before, after, {definitionsMayChange = false} = {}) {
  sameOwner(before, after);
  for (const key of ['value', 'draftValue', 'documentJSON', 'revision', 'selection', 'mode']) assert.deepEqual(after[key], before[key], 'Closed preparation mutated ' + key);
  assert.equal(after.popupOpen, false, 'Preparation opened a popup.');
  assert.equal(after.optionalConstructed, false, 'Preparation constructed optional controls.');
  assert.equal(after.sessionElements, 0, 'Preparation constructed a color session.');
  if (!definitionsMayChange) assert.deepEqual(after.definedTags, before.definedTags, 'Code-only preparation registered definitions.');
}
function trackNetwork(page, cdp, row, phase) {
  page.on('pageerror', error => row.errors.push(failure(error)));
  page.on('request', request => row.requests.push({at: at(), phase: phase(), url: request.url(), method: request.method(), resourceType: request.resourceType()}));
  page.on('requestfailed', request => row.failures.push({phase: phase(), url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    const headers = response.headers();
    row.responses.push({phase: phase(), url: response.url(), status: response.status(), headers: {
      'content-encoding': headers['content-encoding'] ?? null, 'content-type': headers['content-type'] ?? null}});
    if (response.status() >= 400) row.failures.push({phase: phase(), url: response.url(), status: response.status()});
  });
  if (cdp) for (const event of ['requestWillBeSent', 'responseReceived', 'dataReceived', 'loadingFinished', 'loadingFailed', 'requestServedFromCache']) {
    cdp.on('Network.' + event, value => {
      const record = {event, phase: phase(), requestId: value.requestId, timestamp: value.timestamp ?? null};
      if (event === 'requestWillBeSent') Object.assign(record, {url: value.request.url, type: value.type, method: value.request.method});
      if (event === 'responseReceived') Object.assign(record, {url: value.response.url, status: value.response.status, protocol: value.response.protocol,
        fromDiskCache: value.response.fromDiskCache, fromServiceWorker: value.response.fromServiceWorker,
        contentEncoding: value.response.headers['content-encoding'] ?? value.response.headers['Content-Encoding'] ?? 'identity'});
      if (event === 'dataReceived') Object.assign(record, {dataLength: value.dataLength, encodedDataLength: value.encodedDataLength});
      if (event === 'loadingFinished') record.encodedDataLength = value.encodedDataLength;
      if (event === 'loadingFailed') Object.assign(record, {errorText: value.errorText, canceled: value.canceled});
      row.cdpNetwork.push(record);
    });
  }
}
function verifyCold(row, optionalAssets, origin) {
  if (row.job.arm !== 'candidate' || row.job.policy !== 'cold') return null;
  assert(optionalAssets.length, 'Cold optional asset inventory is empty.');
  const pathOf = name => {const url = new URL(name); return url.origin === origin ? decodeURIComponent(url.pathname).slice(1) : null;};
  const evidence = [];
  for (const path of optionalAssets) {
    assert(!row.snapshots.beforePolicy.resources.some(resource => pathOf(resource.name) === path), 'Cold optional script already completed before activation: ' + path);
    const resource = row.snapshots.afterFirst.resources.find(resource => pathOf(resource.name) === path);
    assert(resource && resource.startTime >= row.first.start && resource.responseEnd <= row.first.end
      && resource.encodedBodySize > 0 && resource.decodedBodySize > 0 && resource.transferSize > 0, 'Missing uncached complete cold optional transfer: ' + path);
    const response = row.responses.find(item => pathOf(item.url) === path);
    assert(response && response.status === 200 && response.headers['content-encoding'] === 'gzip', 'Cold optional response is not HTTP 200 gzip: ' + path);
    const observed = {path, resource, response};
    if (row.job.browser === 'chromium') {
      const request = row.cdpNetwork.find(item => item.event === 'requestWillBeSent' && pathOf(item.url) === path);
      const received = request && row.cdpNetwork.find(item => item.event === 'responseReceived' && item.requestId === request.requestId);
      const finished = request && row.cdpNetwork.find(item => item.event === 'loadingFinished' && item.requestId === request.requestId);
      assert(request && request.phase === 'first-action' && received && finished && received.status === 200 && received.protocol === 'h2'
        && received.contentEncoding === 'gzip' && !received.fromDiskCache && !received.fromServiceWorker && finished.encodedDataLength > 0
        && !row.cdpNetwork.some(item => item.event === 'requestServedFromCache' && item.requestId === request.requestId), 'Missing CDP cold optional evidence: ' + path);
      Object.assign(observed, {request, received, finished});
    }
    evidence.push(observed);
  }
  return {verified: true, optionalAssets, evidence,
    cacheEvidence: row.job.browser === 'chromium' ? 'Fresh context plus ResourceTiming/HTTP/CDP no-cache evidence.' : 'Fresh isolated context, blocked service workers, positive ResourceTiming transfer and HTTP response; Chromium-only CDP cache fields are unavailable.'};
}

await exclusiveBrowserWork(async () => {
  const input = await openFullInputs({inputs: inputsArg, controlled: controlledArg, cold: coldArg, out: outArg,
    script: 'full-timing.mjs', engines: ['chromium', 'firefox', 'webkit'], requireCold: true});
  const raw = resolve(input.out, 'samples.jsonl');
  let rawCreated = false, manifestCreated = false;
  const record = row => {assert(rawCreated, 'Cannot append to an unowned raw result.'); return appendFile(raw, JSON.stringify({...row, at: row.at ?? at()}) + '\n');};
  const manifest = {schemaVersion: 1, kind: 'composable-chat-color-full-timing', startedAt: at(), qualification, n, seed, route, configs, policies,
    jobs, expectedCells: configs.length * 22, planned: jobs.length, inputBindings: input.manifest,
    identity: input.identityBefore ?? input.identity, runtime: input.runtime, installation: input.installation,
    protocol: {minimumSuccessfulBlocks: 30, qualificationBlocks: 1, minimumP95Samples: 100, motion: 'no-preference',
      preparationLeadMs: 250, unusedObservationMs: 500, bootstrapDraws: 10000, bootstrapConfidence: 0.95,
      constrained: {cpuRate: 4, latencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000},
      unsupported: ['firefox/constrained', 'webkit/constrained'],
      networkPolicy: 'CPU and network shaping apply before navigation in the full constrained cell. Historical action-only cold samples are not reused.',
      timingPolicy: 'Essential startup precedes input setup; trusted Enter keydown or pointer Colors click to complete native controls plus nested updates/two frames. Cancel then same trusted activation measures repeat.',
      preparedPolicy: 'Measure minimum250ms from preparation start to trusted activation, without awaiting preparation before starting that clock. Immediate has no deliberate lead; constrained candidate must be pending at activation.',
      referencePreparation: 'Original eager reference has an explicit not-applicable no-op start clock; no fabricated prepareColorControls API.',
      sameCode: 'Separate symmetric controlled builds ensure the existing definition loader in the editor actual registry while closed. Their assets and costs never enter production benefit.',
      inactivePolicy: 'Unused500ms; prepared-unused500ms and actual completion; abandoned additionally shifts focus with a trusted Tab after preparation. No popup/session is opened; this does not qualify stale-session cancellation.',
      matrix: 'Seven environments; four active policies each keyboard/pointer and three inactive policies input:none; two matched arms per block. Phone pointer uses trusted touch.',
      failurePolicy: 'Fixed seeded fail-stop batch. Every planned job receives exactly one terminal record. No retry, replacement, pooling, or analyzer verdict in acquisition.'}};
  let servers, browser, context, activeJob, aborted = false, successful = 0, prewarmSha256 = null;
  const terminals = new Map(), errors = [], verification = {before: input.identityBefore ?? input.identity, after: null, unchanged: false};
  const stop = signal => {
    aborted = true; appendFileSync(raw, JSON.stringify({status: 'signal', at: at(), signal, job: activeJob ?? null}) + '\n');
    void context?.close().catch(() => {});
  };
  const sigint = () => stop('SIGINT'), sigterm = () => stop('SIGTERM');
  try {
    await writeFile(raw, '', {flag: 'wx'}); rawCreated = true;
    process.once('SIGINT', sigint); process.once('SIGTERM', sigterm);
    const launchExecutables = {};
    for (const [engine, browserType] of Object.entries({chromium, firefox, webkit})) {
      const executablePath = browserType.executablePath(), canonical = await realpath(executablePath);
      const entry = input.runtime.files?.[relative(root, canonical).replaceAll('\\', '/')];
      assert(entry && /^sha256:[a-f0-9]{64}$/.test(entry.digest), 'Explicit browser executable is absent from the verified runtime: ' + engine);
      launchExecutables[engine] = {executablePath, canonical, sha256: entry.digest};
    }
    manifest.launchExecutables = launchExecutables;
    await writeNew(resolve(input.out, 'manifest.json'), manifest); manifestCreated = true;
    for (const job of jobs) await record({status: 'planned', job});
    assert(!aborted, 'Aborted while declaring the fixed job plan.');
    servers = await startFullServers(input);
    const prewarm = [...servers].map(([key, server]) => {
      assert(server.prewarm, 'Server did not retain its before-acquisition document prewarm.');
      return {key, url: server.url, prewarm: server.prewarm};
    });
    await writeNew(resolve(input.out, 'server-prewarm.json'), prewarm);
    prewarmSha256 = await hashFile(resolve(input.out, 'server-prewarm.json'));
    const optionalAssets = input.producer.arms.candidate.optionalUnique;
    assert(Array.isArray(optionalAssets) && optionalAssets.length);
    for (const job of jobs) {
      assert(!aborted, 'Acquisition aborted.'); activeJob = job;
      await record({status: 'started', job});
      const row = {job, errors: [], failures: [], requests: [], responses: [], cdpNetwork: [], snapshots: {}};
      let page, phase = 'startup';
      try {
        row.browserExecutable = launchExecutables[job.browser];
        browser = await ({chromium, firefox, webkit})[job.browser].launch({executablePath: row.browserExecutable.executablePath});
        row.browserVersion = browser.version();
        context = await browser.newContext({viewport: job.viewport, hasTouch: job.profile === 'phone', ignoreHTTPSErrors: true,
          serviceWorkers: 'block', reducedMotion: 'no-preference'});
        await installFullProbe(context, {recordOperations: true});
        page = await context.newPage(); page.setDefaultTimeout(20000);
        const cdp = job.browser === 'chromium' ? await context.newCDPSession(page) : null;
        trackNetwork(page, cdp, row, () => phase);
        if (cdp) {await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});}
        if (job.profile === 'constrained') {
          assert(cdp, 'No fake non-Chromium constrained cell.');
          await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
          await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8});
        }
        const server = servers.get(job.sourceKind + '/' + job.arm); assert(server);
        const origin = new URL(server.url).origin, receipt = input.receipt(job.sourceKind, job.arm);
        const capture = async () => {const value = await snapshot(page); return {...value, traffic: traffic(value.resources, receipt, origin)};};
        await page.goto(origin + route, {waitUntil: 'domcontentloaded'});
        row.startup = await waitRouteReady(page);
        assert(row.startup.beforeInputSetup && Number.isFinite(row.startup.readyMs ?? row.startup.durationMs));
        phase = 'startup-settle'; await page.waitForTimeout(500);
        row.snapshots.beforePolicy = await capture(); sameClosed(row.startup.snapshot, row.snapshots.beforePolicy);
        const active = activePolicies.has(job.policy);
        if (active) await setupAction(page, {input: job.input, touch: job.pointerType === 'touch'});
        if (job.policy === 'abandoned') await page.getByRole('textbox', {name: 'Structured message', exact: true}).focus();
        row.snapshots.beforePreparation = await capture();
        let prep = null;
        phase = 'preparation';
        if (job.policy === 'same-code') {
          row.control = await ensureSameCode(page);
          row.snapshots.afterControl = await capture();
          sameClosed(row.snapshots.beforePreparation, row.snapshots.afterControl, {definitionsMayChange: true});
          assert.deepEqual(row.snapshots.afterControl.focus, row.snapshots.beforePreparation.focus, 'Same-code control moved focus.');
        } else if (preparationPolicies.has(job.policy)) {
          prep = job.arm === 'candidate' ? {...await prepare(page), applicable: true} : await page.evaluate(() => ({
            id: null, applicable: false, status: 'not-applicable', state: 'not-applicable', start: performance.now(),
            reason: 'Unchanged eager reference has no code-only preparation API.'}));
          row.preparation = {...prep, requestedLeadMs: job.policy === 'prepared' ? 250 : 0,
            actualLeadMs: null, activationAt: null, preparationPendingAtActivation: null};
          if (job.policy === 'prepared') {
            await page.waitForFunction(start => performance.now() - start >= 250, prep.start);
          }
          if (job.policy === 'abandoned') {
            await page.getByRole('textbox', {name: 'Structured message', exact: true}).press('Tab');
            row.abandonedFocus = await markFocus(page);
            row.snapshots.afterAbandonment = await capture();
            assert.notDeepEqual(row.snapshots.afterAbandonment.focus, row.snapshots.beforePreparation.focus, 'Trusted Tab did not abandon prepared control focus.');
          }
        }
        row.snapshots.preActivation = await capture();
        sameClosed(row.snapshots.beforePreparation, row.snapshots.preActivation, {definitionsMayChange: job.policy === 'same-code'});
        if (job.policy !== 'abandoned') assert.deepEqual(row.snapshots.preActivation.focus, row.snapshots.beforePreparation.focus, 'Preparation moved focus.');
        if (prep?.applicable && job.policy !== 'abandoned') assert.equal(row.snapshots.preActivation.preparationFocusUnchanged, true, 'Code-only preparation changed the exact focused node before activation.');
        if (active) {
          phase = 'first-action'; row.first = await action(page, {input: job.input, touch: job.pointerType === 'touch', preparedTarget: true});
          assert(row.first.trusted); row.snapshots.afterFirst = await capture();
          if (prep) {
            row.preparation.activationAt = row.first.start;
            row.preparation.actualLeadMs = row.first.start - prep.start;
            assert(row.preparation.actualLeadMs >= 0);
            if (job.policy === 'prepared') assert(row.preparation.actualLeadMs >= 250, 'Prepared activation did not receive its declared lead.');
          }
          row.coldDelivery = verifyCold(row, optionalAssets, origin);
          phase = 'first-close'; row.firstClosed = await close(page);
          phase = 'repeat-action'; row.repeat = await action(page, {input: job.input, touch: job.pointerType === 'touch'});
          assert(row.repeat.trusted); row.snapshots.afterRepeat = await capture();
          phase = 'post-measurement-usability'; row.usability = await verifyUsability(page);
        } else {
          phase = 'unused-observation';
          const began = prep?.start ?? row.snapshots.preActivation.at;
          await page.waitForFunction(start => performance.now() - start >= 500, began);
          row.snapshots.observation500 = await capture();
          sameClosed(row.snapshots.beforePreparation, row.snapshots.observation500);
          if (job.policy === 'abandoned') row.abandonedFocusAtObservation = await assertMarkedFocus(page, row.abandonedFocus.id);
        }
        if (prep) {
          phase = 'preparation-completion';
          row.preparation.result = prep.applicable ? await awaitPreparation(page) : {...prep, end: null, durationMs: null};
          row.preparation.verified = prep.applicable ? row.preparation.result.state === 'ready' : true;
          if (active && prep.applicable) {
            row.preparation.preparationPendingAtActivation = row.preparation.result.end > row.first.start;
            // Pointerdown may legitimately move focus before the frozen click
            // clock begins. Attribute that focus move to real user input.
            const earliestInputAt = job.input === 'pointer' ? row.first.pointerdown?.at : row.first.keydown?.at;
            assert(Number.isFinite(earliestInputAt), 'Missing earliest trusted input boundary.');
            row.preparation.earliestInputAt = earliestInputAt;
            if (row.preparation.result.end <= earliestInputAt) assert.equal(row.preparation.result.focusUnchangedAtCompletion, true, 'Completed preparation moved focus before user input.');
            if (job.policy === 'immediate' && job.profile === 'constrained') assert(row.preparation.preparationPendingAtActivation, 'Immediate constrained preparation completed before activation; cell is not pending.');
          }
        }
        phase = 'final'; row.snapshots.final = await capture();
        sameOwner(row.startup.snapshot, row.snapshots.final);
        if (!active) sameClosed(row.snapshots.beforePreparation, row.snapshots.final);
        if (!active && prep?.applicable && job.policy !== 'abandoned') {
          assert.equal(row.preparation.result.focusUnchangedAtCompletion, true, 'Unused preparation changed exact focus at completion.');
          assert.equal(row.snapshots.final.preparationFocusUnchanged, true, 'Unused preparation changed the exact focused node.');
        }
        if (job.policy === 'abandoned') {
          row.abandonedFocusAtCompletion = await assertMarkedFocus(page, row.abandonedFocus.id);
          assert.deepEqual(row.snapshots.final.focus, row.snapshots.afterAbandonment.focus, 'Abandoned preparation moved focus after trusted Tab.');
          if (prep?.applicable) assert.equal(row.snapshots.final.preparationFocusUnchanged, false, 'Abandoned preparation restored its original focused node.');
        }
        row.actualRegistry = row.snapshots.final.actualRegistry;
        row.ownership = {before: owner(row.startup.snapshot), after: owner(row.snapshots.final), unchanged: true};
        row.metrics = {startupReadyMs: row.startup.readyMs ?? row.startup.durationMs,
          firstReadyMs: row.first?.readyMs ?? row.first?.durationMs ?? null, repeatReadyMs: row.repeat?.readyMs ?? row.repeat?.durationMs ?? null,
          startupGzipBytes: row.snapshots.beforePolicy.traffic.gzipBytes,
          unusedGzipBytes: active ? null : row.snapshots.final.traffic.gzipBytes,
          unusedObservedGzipBytes: row.snapshots.observation500?.traffic.gzipBytes ?? null,
          finalGzipBytes: row.snapshots.final.traffic.gzipBytes};
        row.preparationTraffic = prep || row.control ? {
          before: row.snapshots.beforePreparation.traffic, final: row.snapshots.final.traffic,
          additionalGzipBytes: row.snapshots.final.traffic.gzipBytes - row.snapshots.beforePreparation.traffic.gzipBytes,
          additionalRequests: row.snapshots.final.traffic.requests - row.snapshots.beforePreparation.traffic.requests,
          includesActivation: active, note: active ? 'Total includes first/repeat actions; individual resource start/end clocks identify preparation traffic.' : 'Full completion traffic retained even if preparation outlives the500ms observation.'} : null;
        assert.deepEqual(row.errors, [], 'Browser error.'); assert.deepEqual(row.failures, [], 'Request failure.');
        assert(!aborted, 'Aborted before terminal success.');
        await record({...row, status: 'ok'}); terminals.set(job.id, 'ok'); successful++;
        console.log(successful + '/' + jobs.length + ' ' + job.sourceKind + '/' + job.arm + ' ' + job.policy + ' ' + job.config + '/' + job.input);
      } catch (error) {
        const status = aborted ? 'aborted' : 'failed';
        if (page && !page.isClosed()) {
          row.partialProbe = await page.evaluate(() => {
            const probe = window.__enColorFullProbe;
            return probe ? {startup: probe.state.startup, action: probe.state.action, preparation: probe.state.preparation, snapshot: probe.snapshot()} : null;
          }).catch(probeError => ({unavailable: String(probeError)}));
        }
        await record({...row, status, phase, error: failure(error)}); terminals.set(job.id, status);
        if (page) await page.screenshot({path: resolve(input.out, job.id + '-failure.png')}).catch(() => {});
        throw error;
      } finally {
        try {await context?.close();} finally {context = null; await browser?.close(); browser = null; activeJob = null;}
      }
    }
  } catch (error) {
    errors.push({phase: 'acquisition', ...failure(error)});
    if (rawCreated) await record({status: 'campaign-error', phase: 'acquisition', error: failure(error)});
  }
  finally {
    if (servers) try {await servers.closeAll();} catch (error) {
      errors.push({phase: 'server-cleanup', ...failure(error)}); await record({status: 'campaign-error', phase: 'server-cleanup', error: failure(error)});
    }
    try {
      verification.after = await input.verify(); assert.equal(verification.after.verified, true);
      assert.equal(verification.after.identitySha256, input.identityBefore, 'Post-acquisition identity differs from verified pre-acquisition identity.');
      verification.unchanged = true;
    }
    catch (error) {
      verification.error = failure(error); errors.push({phase: 'post-acquisition-integrity', ...failure(error)});
      if (rawCreated) await record({status: 'campaign-error', phase: 'post-acquisition-integrity', error: failure(error)});
    }
    for (const job of rawCreated ? jobs : []) if (!terminals.has(job.id)) {
      await record({status: 'not-run', job, reason: aborted ? 'Batch aborted before this job.' : 'Fail-stop batch ended before this job.'}); terminals.set(job.id, 'not-run');
    }
    process.removeListener('SIGINT', sigint); process.removeListener('SIGTERM', sigterm);
    if (!rawCreated) throw new AggregateError(errors.map(value => new Error(value.message)), 'Raw result could not be exclusively created; colliding output was not modified. Post-input verification was still attempted.');
    const count = status => [...terminals.values()].filter(value => value === status).length;
    const status = aborted ? 'aborted' : errors.length || successful !== jobs.length ? 'incomplete' : 'complete';
    await writeNew(resolve(input.out, 'summary.json'), {schemaVersion: 1, kind: manifest.kind, status, qualification,
      planned: jobs.length, succeeded: successful, failed: count('failed'), aborted: count('aborted'), notRun: count('not-run'), terminal: terminals.size,
      verification, errors, finishedAt: at(), manifestSha256: manifestCreated ? await hashFile(resolve(input.out, 'manifest.json')) : null,
      samplesSha256: await hashFile(raw), rawSha256: await hashFile(raw), serverPrewarmSha256: prewarmSha256});
    if (status !== 'complete') process.exitCode = 1;
  }
}, {workspaceRoot: root});
