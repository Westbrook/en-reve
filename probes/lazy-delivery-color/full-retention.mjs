/** SOURCE DRAFT — separate retention acquisition; not executed. */
import assert from 'node:assert/strict';
import {appendFile, readFile, realpath, writeFile} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, relative} from 'node:path';
import {chromium} from '@playwright/test';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {openFullInputs, startFullServers} from './full-common.mjs';
import {route, installFullProbe, waitRouteReady, snapshot, prepare, awaitPreparation, ensureSameCode, retentionCycle} from './full-probe.mjs';

const root = resolve(import.meta.dirname, '../..');
const arg = (key, fallback) => process.argv.find(value => value.startsWith('--' + key + '='))?.slice(key.length + 3) ?? fallback;
const qualification = process.argv.includes('--qualification');
const repetitions = Number(arg('repetitions', qualification ? '1' : '5'));
const cycles = Number(arg('cycles', qualification ? '2' : '100'));
assert.equal(repetitions, qualification ? 1 : 5, 'The full declared retention matrix has exactly five fresh contexts per arm.');
assert.equal(cycles, qualification ? 2 : 100, 'Retention cycle counts are frozen; qualification is a separate two-cycle smoke.');
const seed = Number(arg('seed', '2026092902')); assert(Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xffffffff);
const inputsArg = arg('inputs'), controlledArg = arg('controlled'), coldArg = arg('cold'), outArg = arg('out', process.env.EN_EXECUTION_OUTPUT);
assert(inputsArg && controlledArg && coldArg && outArg, 'Supply --inputs, --controlled, --cold and fresh --out.');
if (process.env.EN_EXECUTION_OUTPUT) assert.equal(resolve(outArg), resolve(process.env.EN_EXECUTION_OUTPUT), 'Output aliases differ.');
const at = () => new Date().toISOString(), hashFile = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const failure = error => ({message: String(error), stack: error?.stack ?? null});
const writeNew = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
function randomizer(initial) {
  let state = initial >>> 0;
  return values => {const result = [...values]; for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0; const other = Math.floor(state / 4294967296 * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  } return result;};
}
const shuffled = randomizer(seed), jobs = [];
const arms = [
  {pairGroup: 'production', arm: 'reference', policy: 'eager'},
  {pairGroup: 'production', arm: 'candidate', policy: 'cold'},
  {pairGroup: 'production', arm: 'candidate', policy: 'prepared'},
  {pairGroup: 'controlled', arm: 'reference', policy: 'eager'},
  {pairGroup: 'controlled', arm: 'candidate', policy: 'same-code'},
];
for (let block = 0; block < repetitions; block++) for (const arm of shuffled(arms)) jobs.push({
  id: 'retention-' + String(jobs.length + 1).padStart(6, '0'), block, ...arm, sourceKind: arm.pairGroup,
  browser: 'chromium', profile: 'desktop', config: 'chromium/desktop', viewport: {width: 1280, height: 900},
  input: 'pointer', pointerType: 'mouse', requestedRegistry: 'production-default', lifecycle: 'retained-demo-disposed-color-session'});
const ownerFields = ['actualRegistry', 'nativeAssociationAvailable', 'definitionRegistrySource',
  'documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup'];
const owner = value => Object.fromEntries(ownerFields.map(key => [key, value[key]]));
function assertIdentity(before, after) {
  assert.deepEqual(owner(after), owner(before), 'Actual route ownership changed during lifecycle.');
  for (const key of ['documentGlobalMatchesWindow', 'editorOwnedByCurrentDocument', 'editorConstructorMatchesRegistry', 'registryIdentityMatchesStartup']) {
    assert.equal(before[key], true, 'Invalid initial route ownership: ' + key); assert.equal(after[key], true, 'Invalid current route ownership: ' + key);
  }
  assert(after.editorSame && after.rootSame && after.textboxSame, 'Original editor/root/textbox was replaced.');
  for (const key of ['value', 'draftValue', 'documentJSON', 'revision', 'mode']) assert.deepEqual(after[key], before[key], 'Accepted editor state changed: ' + key);
  assert(!after.popupOpen && !after.optionalConstructed && after.sessionElements === 0, 'Color session DOM is still connected.');
  assert.equal(after.instrumentation.recordOperations, false); assert.equal(after.instrumentation.operationHistoryLength, 0);
  assert(after.instrumentation.retainedOperationRecords <= 2, 'Instrumentation retained an unbounded operation log.');
  assert.equal(after.resources, null, 'Retention must not retain ResourceTiming arrays in browser snapshots.');
}
function detachedSummary(result) {
  assert(Array.isArray(result.detachedNodes), 'Detached DOM response is incomplete.');
  const ids = new Set(), editorIds = new Set(), pickerIds = new Set();
  const add = id => {assert(Number.isSafeInteger(id) && id > 0, 'Invalid detached frontend node ID.'); ids.add(id);};
  const visit = node => {
    add(node.nodeId); if (node.nodeName === 'EN-TOKEN-EDITOR') editorIds.add(node.nodeId);
    if (node.nodeName === 'EN-COLOR-PICKER') pickerIds.add(node.nodeId);
    for (const child of node.children ?? []) visit(child); for (const root of node.shadowRoots ?? []) visit(root);
  };
  for (const entry of result.detachedNodes) {
    visit(entry.treeNode); assert(Array.isArray(entry.retainedNodeIds)); for (const id of entry.retainedNodeIds) add(id);
  }
  return {reportedNodes: ids.size, reportedEditorNodes: editorIds.size, reportedPickerNodes: pickerIds.size,
    treeRoots: result.detachedNodes.length, raw: result.detachedNodes,
    scope: 'Chromium reported detached frontend node IDs; not a complete heap graph or absence-of-leaks proof.'};
}

await exclusiveBrowserWork(async () => {
  const input = await openFullInputs({inputs: inputsArg, controlled: controlledArg, cold: coldArg, out: outArg,
    script: 'full-retention.mjs', engines: ['chromium'], requireCold: true});
  const raw = resolve(input.out, 'samples.jsonl');
  let rawCreated = false, manifestCreated = false;
  const record = row => {assert(rawCreated, 'Cannot append to an unowned raw result.'); return appendFile(raw, JSON.stringify({...row, at: row.at ?? at()}) + '\n');};
  const checkpointCycles = qualification ? [0, 2] : [0, 10, 50, 100];
  const manifest = {schemaVersion: 1, kind: 'composable-chat-color-full-retention', startedAt: at(), qualification,
    repetitions, cycles, seed, route, jobs, planned: jobs.length, checkpointCycles,
    inputBindings: input.manifest, identity: input.identityBefore ?? input.identity, runtime: input.runtime, installation: input.installation,
    protocol: {motion: 'no-preference', collectionSettleMs: 300, forcedCollections: 2, lifecycle: 'retained-demo-disposed-color-session',
      population: 'Five independent fresh Chromium desktop contexts for each production reference/candidate-cold/candidate-prepared and controlled reference/candidate-same-code;25 full contexts.',
      controlPairing: 'Separate controlled reference is mandatory because its assets differ from the production reference. Controlled outcomes never establish production startup benefit.',
      cycle: 'Existing actual route editor; trusted Colors open, native Hex edit/Enter, trusted Cancel, session disposal. Cached modules/definitions remain after first use; no reload/cache-busting between cycles.',
      metrics: 'Primary CDP Memory.getDOMCounters nodes/listeners and Runtime.getHeapUsage. Connected deep node/element/shadow census is diagnostic. Optional detached-DOM response runs only after the final primary checkpoint, avoiding frontend handles between checkpoints.',
      growth: 'Analyzer uses cycle10→100 separately per repetition, then paired reference/candidate median heap-growth difference. No timing samples or thresholds are decided here.',
      instrumentation: 'No resource/operation history arrays in browser probe; bounded latest operation records and weak references to the unchanged connected editor. Driver retains only scalar cycle records.',
      qualification: 'Separate two-cycle smoke does not supply100-cycle or five-repetition retention evidence.',
      limitations: ['Local Chromium is not physical-phone retention.', 'Disposed host lifecycle is correctness coverage outside this retained-demo measurement.', 'Connected census is not heap ownership; unsupported counters are never zero.'],
      failurePolicy: 'Fixed seeded fail-stop; all started/failed/aborted/unstarted rows retained, no reruns pooled.'}};
  let servers, browser, context, activeJob, aborted = false, successful = 0, prewarmSha256 = null;
  const terminals = new Map(), errors = [], verification = {before: input.identityBefore ?? input.identity, after: null, unchanged: false};
  const stop = signal => {aborted = true; appendFileSync(raw, JSON.stringify({status: 'signal', at: at(), signal, job: activeJob ?? null}) + '\n'); void context?.close().catch(() => {});};
  const sigint = () => stop('SIGINT'), sigterm = () => stop('SIGTERM');
  try {
    await writeFile(raw, '', {flag: 'wx'}); rawCreated = true;
    process.once('SIGINT', sigint); process.once('SIGTERM', sigterm);
    const executablePath = chromium.executablePath(), canonical = await realpath(executablePath);
    const executableEntry = input.runtime.files?.[relative(root, canonical).replaceAll('\\', '/')];
    assert(executableEntry && /^sha256:[a-f0-9]{64}$/.test(executableEntry.digest), 'Explicit Chromium executable is absent from verified runtime.');
    const browserExecutable = {executablePath, canonical, sha256: executableEntry.digest};
    manifest.launchExecutables = {chromium: browserExecutable};
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
    for (const job of jobs) {
      assert(!aborted, 'Retention acquisition aborted.'); activeJob = job; await record({status: 'started', job});
      const row = {job, errors: [], failures: [], checkpoints: [], completedCycles: 0};
      let page;
      try {
        row.browserExecutable = browserExecutable;
        browser = await chromium.launch({executablePath}); row.browserVersion = browser.version();
        context = await browser.newContext({viewport: job.viewport, ignoreHTTPSErrors: true, serviceWorkers: 'block', reducedMotion: 'no-preference'});
        await installFullProbe(context, {recordOperations: false}); page = await context.newPage(); page.setDefaultTimeout(20000);
        page.on('pageerror', error => row.errors.push(failure(error)));
        page.on('requestfailed', request => row.failures.push({url: request.url(), error: request.failure()?.errorText}));
        page.on('response', response => {if (response.status() >= 400) row.failures.push({url: response.url(), status: response.status()});});
        const cdp = await context.newCDPSession(page), server = servers.get(job.sourceKind + '/' + job.arm); assert(server);
        await page.goto(new URL(server.url).origin + route, {waitUntil: 'domcontentloaded'});
        row.startup = await waitRouteReady(page); const baseline = row.startup.snapshot;
        // Preparation precedes cycle0; modules/definitions remain cached, while
        // cycle10→100 excludes initial code/registration setup from growth.
        if (job.policy === 'prepared') {
          const started = await prepare(page);
          await page.waitForFunction(start => performance.now() - start >= 250, started.start);
          row.preparation = {started, result: await awaitPreparation(page), requestedLeadMs: 250};
          const prepared = await snapshot(page); assertIdentity(baseline, prepared);
          assert.deepEqual(prepared.selection, baseline.selection, 'Code-only preparation moved editor selection.');
          assert.deepEqual(prepared.definedTags, baseline.definedTags, 'Code-only preparation registered definitions.');
          assert.deepEqual(prepared.focus, baseline.focus, 'Code-only preparation moved focus.');
          assert.equal(row.preparation.result.focusUnchangedAtCompletion, true, 'Preparation moved exact focus at completion.');
          assert.equal(prepared.preparationFocusUnchanged, true, 'Preparation changed the exact focused node.');
        }
        if (job.sourceKind === 'controlled') {
          row.control = await ensureSameCode(page);
          const controlled = await snapshot(page); assertIdentity(baseline, controlled);
          assert.deepEqual(controlled.focus, baseline.focus, 'Same-code control moved focus.');
        }
        for (let cycle = 0; cycle <= cycles; cycle++) {
          assert(!aborted, 'Retention aborted within lifecycle.');
          if (cycle) {
            const result = await retentionCycle(page);
            assert.equal(result.cycle, cycle); assert(result.completed && result.trusted, 'Lifecycle lacks trusted complete action.');
            row.completedCycles = cycle;
            // No browser references/operation arrays retained for previous cycles.
          }
          if (checkpointCycles.includes(cycle)) {
            await page.waitForTimeout(300); await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
            const heap = await cdp.send('Runtime.getHeapUsage'), dom = await cdp.send('Memory.getDOMCounters');
            assert(Number.isFinite(heap.usedSize) && heap.usedSize >= 0, 'Heap measurement unsupported or malformed.');
            for (const key of ['documents', 'nodes', 'jsEventListeners']) assert(Number.isSafeInteger(dom[key]) && dom[key] >= 0, 'DOM counter unsupported or malformed: ' + key);
            const connected = await snapshot(page); assertIdentity(baseline, connected); assert.equal(connected.lifecycleCycles, cycle);
            row.checkpoints.push({cycle, heapBytes: heap.usedSize, dom, connected});
            await record({status: 'checkpoint', job, checkpoint: row.checkpoints.at(-1)});
          }
        }
        const final = row.checkpoints.at(-1).connected;
        row.actualRegistry = final.actualRegistry; row.ownership = {before: owner(baseline), after: owner(final), unchanged: true};
        row.finalDetached = null; row.finalDetachedUnsupported = null;
        try {row.finalDetached = detachedSummary(await cdp.send('DOM.getDetachedDomNodes'));}
        catch (error) {row.finalDetachedUnsupported = String(error);}
        finally {await cdp.send('DOM.disable').catch(() => {});}
        assert.deepEqual(row.errors, [], 'Browser error.'); assert.deepEqual(row.failures, [], 'Request failure.');
        assert(!aborted, 'Aborted before retention terminal success.');
        await record({...row, status: 'ok'}); terminals.set(job.id, 'ok'); successful++;
        console.log(successful + '/' + jobs.length + ' ' + job.sourceKind + '/' + job.arm + ' ' + job.policy + ' block' + job.block);
      } catch (error) {
        const status = aborted ? 'aborted' : 'failed';
        if (page && !page.isClosed()) {
          row.partialProbe = await page.evaluate(() => {
            const probe = window.__enColorFullProbe;
            return probe ? {startup: probe.state.startup, action: probe.state.action, preparation: probe.state.preparation, snapshot: probe.snapshot()} : null;
          }).catch(probeError => ({unavailable: String(probeError)}));
        }
        await record({...row, status, error: failure(error)}); terminals.set(job.id, status);
        if (page) await page.screenshot({path: resolve(input.out, job.id + '-failure.png')}).catch(() => {}); throw error;
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
