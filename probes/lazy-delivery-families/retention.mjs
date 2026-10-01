import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {appendFile} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {installProbe, actionTarget, assertInitialWorkload} from './family-adapters.mjs';
import {installCommandPolicyConfig} from './command-policy-controls.mjs';
import {arg, openInputs, randomizer, routeAdapters, startServers, receiptBytes, writeManifest, finalizeAcquisition} from './performance-common.mjs';
const qualification = process.argv.includes('--qualification'), repetitions = Number(arg('repetitions', qualification ? '1' : '5')), cycles = Number(arg('cycles', qualification ? '2' : '100'));
assert(Number.isInteger(repetitions) && repetitions >= (qualification ? 1 : 5)); assert(Number.isInteger(cycles) && cycles >= (qualification ? 1 : 100));
await exclusiveBrowserWork(async () => {
const input = await openInputs('retention.mjs', ['chromium']), shuffle = randomizer(2026092802), jobs = [];
for (let block = 0; block < repetitions; block++) for (const family of shuffle(input.families)) for (const lifecycle of shuffle(['retained', 'disposed'])) for (const arm of shuffle(input.arms)) jobs.push({block, family, lifecycle, arm: arm.id, browser: 'chromium', requestedRegistry: 'production-default'});
const raw = resolve(input.out, 'samples.jsonl'); let browser, activeJob, successful = 0, aborted = false, acquisitionError;
const interrupt = signal => {aborted = true; appendFileSync(raw, JSON.stringify({status: 'aborted', at: new Date().toISOString(), signal, job: activeJob}) + '\n'); void browser?.close();}; process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
function detachedSummary(result) {
  const ids = new Set(), hosts = new Set(), inputs = new Set();
  const validId = id => {assert(Number.isSafeInteger(id) && id > 0, 'Detached DOM diagnostic returned an unmeasured/invalid frontend node ID'); return id;};
  const visit = node => {const id = validId(node.nodeId); ids.add(id); if (['EN-MEDIA-VIEWER', 'EN-COMBOBOX', 'EN-COMMAND-PALETTE', 'EN-PAGINATION'].includes(node.nodeName)) hosts.add(id); if (node.nodeName === 'INPUT') inputs.add(id); for (const child of node.children ?? []) visit(child); for (const shadow of node.shadowRoots ?? []) visit(shadow);};
  assert(Array.isArray(result.detachedNodes), 'Detached DOM result is incomplete');
  for (const entry of result.detachedNodes) {visit(entry.treeNode); assert(Array.isArray(entry.retainedNodeIds), 'Detached DOM retained IDs are missing'); for (const id of entry.retainedNodeIds) ids.add(validId(id));}
  return {reportedNodes: ids.size, reportedHostNodes: hosts.size, reportedInputNodes: inputs.size, treeRoots: result.detachedNodes.length, raw: result.detachedNodes, scope: 'Distinct node IDs reported by CDP DOM.getDetachedDomNodes; not a complete heap graph or leak-free claim.'};
}
try {
  await writeManifest(input, {kind: 'actual-route-family-retention', qualification, repetitions, cycles, jobs, checkpointCycles: [0, 10, 50, 100], lifecyclePolicy: 'Independent fresh contexts for retained-host open/close and disposed-host mount/open/close/remove. The unchanged real route and catalog remain in each document. Lifecycle-only programmatic native actions are not trusted timing or human acceptance.', instrumentationPolicy: 'Command cold production loading remains unchanged; the symmetric bridge operation/promise diagnostic log is disabled before navigation to avoid measurement-owned retained growth.', collectionPolicy: '300ms settling then two explicit collections. DOM counters plus connected census and Chromium reported detached DOM trees/retained IDs; unsupported detached diagnostics remain null, never zero.'});
  {
    const servers = await startServers(input);
    try {
      for (const job of jobs) {
        assert(!aborted); activeJob = job; await appendFile(raw, JSON.stringify({status: 'started', at: new Date().toISOString(), job}) + '\n');
        const errors = [], failures = []; let page;
        try {
          browser = await chromium.launch(); const context = await browser.newContext({viewport: {width: 1280, height: 900}, ignoreHTTPSErrors: true, serviceWorkers: 'block', reducedMotion: 'no-preference'});
          if (job.family === 'command') await context.addInitScript(installCommandPolicyConfig, {deliveryPolicy: 'cold', recordOperations: false});
          await installProbe(context, job.family, input.arms.find(arm => arm.id === job.arm).policy); page = await context.newPage(); page.setDefaultTimeout(20000);
          page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failures.push({url: request.url(), error: request.failure()?.errorText})); page.on('response', response => {if (response.status() >= 400) failures.push({url: response.url(), status: response.status()});});
          const cdp = await context.newCDPSession(page), adapter = routeAdapters[job.family], origin = new URL(servers.get(job.arm).url).origin;
          await page.goto(origin + adapter.path + adapter.query, {waitUntil: 'domcontentloaded'}); await page.waitForFunction(() => window.__enFamilyProbe?.state.ready);
          const startup = await page.evaluate(() => __enFamilyProbe.state.startup); assertInitialWorkload(startup, job.family, input.arms.find(arm => arm.id === job.arm).policy);
          // The real field may be below the fold. This is outside retention checkpoints and does not open it.
          const trigger = actionTarget(page, job.family, 'keyboard'); await trigger.scrollIntoViewIfNeeded();
          const checkpoints = [];
          for (let cycle = 0; cycle <= cycles; cycle++) {
            if (cycle) await page.evaluate(lifecycle => __enFamilyProbe.lifecycleCycle(lifecycle), job.lifecycle);
            if ([0, 10, 50, 100, cycles].includes(cycle)) {
              await page.waitForTimeout(300); await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
              const heap = await cdp.send('Runtime.getHeapUsage'), dom = await cdp.send('Memory.getDOMCounters'), connected = await page.evaluate(() => __enFamilyProbe.snapshot());
              let detached = null, detachedUnsupported = null;
              try {detached = detachedSummary(await cdp.send('DOM.getDetachedDomNodes'));} catch (error) {detachedUnsupported = String(error);}
              const bytes = receiptBytes(input.receipts.get(job.arm), adapter.path, connected.resources, origin); assert(connected.resources.every(resource => resource.protocol === 'h2'), 'Required H2 executable resources not observed');
              const commandInstrumentation = job.family === 'command' ? await page.evaluate(() => __enCommandPolicyTest.status()) : null;
              if (commandInstrumentation) {assert.equal(commandInstrumentation.recordOperations, false); assert.deepEqual(commandInstrumentation.operations, []); assert.equal(commandInstrumentation.routeEntrySuppressed, false);}
              checkpoints.push({cycle, commandInstrumentation, bytes, heapBytes: heap.usedSize, dom, connected, detached, detachedUnsupported});
            }
          }
          errors.push(...await page.evaluate(() => __enFamilyProbe.state.errors)); assert.deepEqual(errors, []); assert.deepEqual(failures, []);
          await appendFile(raw, JSON.stringify({status: 'ok', at: new Date().toISOString(), job, browserVersion: browser.version(), actualRegistry: checkpoints.at(-1).connected.actualRegistry, startup, checkpoints, errors, failures}) + '\n'); successful++;
        } catch (error) {await appendFile(raw, JSON.stringify({status: aborted ? 'aborted' : 'failed', at: new Date().toISOString(), job, error: String(error), stack: error.stack, errors, failures}) + '\n'); if (page) await page.screenshot({path: resolve(input.out, 'failure.png')}).catch(() => {}); throw error;}
        finally {await browser?.close(); browser = null; activeJob = null;}
      }
    } finally {for (const server of servers.values()) await server.close();}
  }
  assert(!aborted, 'Campaign aborted');
} catch (error) {acquisitionError = error; await appendFile(raw, JSON.stringify({status: aborted ? 'aborted' : 'failed', phase: 'campaign', at: new Date().toISOString(), error: String(error), stack: error.stack}) + '\n');}
finally {process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);}
await finalizeAcquisition(input, {qualification, aborted, successful, planned: jobs.length}, acquisitionError);
});
