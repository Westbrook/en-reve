import {chromium, firefox, webkit} from '@playwright/test';
import assert from 'node:assert/strict';
import {appendFile} from 'node:fs/promises';
import {appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {installProbe, actionTarget, assertInitialWorkload, beforeRepeatClose} from './family-adapters.mjs';
import {commandDeliveryPolicies, installCommandPolicyConfig, beginCommandPolicy, commandPreActivation, finishCommandPolicy, summarizeCommandPolicy} from './command-policy-controls.mjs';
import {arg, openInputs, randomizer, routeAdapters, startServers, receiptBytes, writeManifest, finalizeAcquisition} from './performance-common.mjs';
const qualification = process.argv.includes('--qualification'), n = Number(arg('n', qualification ? '1' : '30'));
assert(Number.isInteger(n) && n >= (qualification ? 1 : 30), 'At least30 successful samples/cell required');
const allConfigs = [...['chromium', 'firefox', 'webkit'].flatMap(browser => [{browser, profile: 'desktop', viewport: {width: 1280, height: 900}}, {browser, profile: 'phone', viewport: {width: 390, height: 844}}]), {browser: 'chromium', profile: 'constrained', viewport: {width: 1280, height: 900}}];
const configArg = arg('configs', 'all'), configs = allConfigs.filter(config => configArg === 'all' || configArg.split(',').includes(config.browser + ':' + config.profile));
assert(configs.length); if (configArg !== 'all') assert.equal(configs.length, new Set(configArg.split(',')).size, 'Unknown configuration');
const actions = arg('actions', 'keyboard,pointer').split(','); assert(actions.length && actions.every(action => ['keyboard', 'pointer'].includes(action)) && new Set(actions).size === actions.length);
const seed = Number(arg('seed', '2026092801')); assert(Number.isSafeInteger(seed)); const shuffle = randomizer(seed);
await exclusiveBrowserWork(async () => {
const input = await openInputs('performance.mjs', [...new Set(configs.map(config => config.browser))]), jobs = [];
for (let block = 0; block < n; block++) for (const config of shuffle(configs)) for (const family of shuffle(input.families)) {
  for (const deliveryPolicy of shuffle(family === 'command' ? commandDeliveryPolicies : ['same-code'])) {
    for (const action of shuffle(deliveryPolicy === 'unused' ? ['none'] : actions)) for (const arm of shuffle(input.arms)) jobs.push({block, family, deliveryPolicy, action, pointerType: action === 'pointer' ? config.profile === 'phone' ? 'touch' : 'mouse' : null, arm: arm.id, ...config, requestedRegistry: 'production-default'});
  }
}
const raw = resolve(input.out, 'samples.jsonl'); let browser, activeJob, aborted = false, successful = 0, acquisitionError;
const interrupt = signal => {aborted = true; appendFileSync(raw, JSON.stringify({status: 'aborted', at: new Date().toISOString(), signal, job: activeJob}) + '\n'); void browser?.close();};
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
try {
  await writeManifest(input, {kind: 'actual-route-family-timing', qualification, n, seed, configs, actions, jobs, minimumP95Samples: 100, preparation: 'Combobox retains production eager code. Command cold preserves the production route-entry load; same-code explicitly ensures after initial snapshot; prepared leads0/50/200 and unused suppress only route-entry load in symmetric sealed instrumentation and cannot establish actual-route benefit.', deliveryPolicies: Object.fromEntries(input.families.map(family => [family, family === 'command' ? [...commandDeliveryPolicies] : ['same-code']])), policyApplicability: 'Every active command policy covers all declared engine/profile/input configurations. Unused preparation has no activation and therefore action:none, once per engine/profile/arm/block; keyboard versus pointer is structurally inapplicable.', constrained: {cpuRate: 4, latencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000}, motion: 'no-preference', pointerPolicy: 'Phone pointer cells use trusted touchscreen taps in hasTouch contexts; desktop/constrained pointer cells use trusted mouse clicks. Keyboard cells retain native key input.', startup: 'Browser-observed stable essential route host and descendants before action/focus/scroll; traffic snapshot500ms later remains separate.'});
  {
    const servers = await startServers(input);
    try {
      for (const job of jobs) {
        assert(!aborted, 'Campaign aborted'); activeJob = job; const errors = [], failures = [];
        await appendFile(raw, JSON.stringify({status: 'started', at: new Date().toISOString(), job}) + '\n');
        let page;
        try {
          browser = await ({chromium, firefox, webkit})[job.browser].launch();
          const context = await browser.newContext({viewport: job.viewport, hasTouch: job.profile === 'phone', serviceWorkers: 'block', ignoreHTTPSErrors: true, reducedMotion: 'no-preference'});
          if (job.family === 'command') await context.addInitScript(installCommandPolicyConfig, {deliveryPolicy: job.deliveryPolicy});
          await installProbe(context, job.family, input.arms.find(arm => arm.id === job.arm).policy); page = await context.newPage(); page.setDefaultTimeout(20000);
          page.on('pageerror', error => errors.push(error.message)); page.on('requestfailed', request => failures.push({url: request.url(), error: request.failure()?.errorText})); page.on('response', response => {if (response.status() >= 400) failures.push({url: response.url(), status: response.status()});});
          if (job.profile === 'constrained') {const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4}); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8});}
          const adapter = routeAdapters[job.family], origin = new URL(servers.get(job.arm).url).origin; await page.goto(origin + adapter.path + adapter.query, {waitUntil: 'domcontentloaded'});
          await page.waitForFunction(() => window.__enFamilyProbe?.state.ready);
          const startup = await page.evaluate(() => ({readyMs: __enFamilyProbe.state.startupReadyMs, snapshot: __enFamilyProbe.state.startup}));
          assertInitialWorkload(startup.snapshot, job.family, input.arms.find(arm => arm.id === job.arm).policy);
          await page.waitForTimeout(500); const settled = await page.evaluate(() => __enFamilyProbe.snapshot());
          const bytes = receiptBytes(input.receipts.get(job.arm), adapter.path, settled.resources, origin);
          const control = job.family === 'command' ? await beginCommandPolicy(page, job.deliveryPolicy) : null;
          let first = null, second = null, preparation = null, preparationTraffic = null, preActivation = null;
          if (job.deliveryPolicy !== 'unused') {
            const target = actionTarget(page, job.family, job.action); await target.scrollIntoViewIfNeeded();
            if (control?.descriptor.requestedLeadMs) await page.waitForTimeout(control.descriptor.requestedLeadMs);
            if (control) preActivation = await commandPreActivation(page, control);
            const use = async () => {
              await page.evaluate(action => __enFamilyProbe.arm(action), job.action);
              if (job.action === 'pointer') {if (job.pointerType === 'touch') await target.tap(); else await target.click();} else await target.press(adapter.keyboardKey);
              return page.evaluate(() => __enFamilyProbe.action);
            };
            first = await use(); assert(first.trusted, 'Primary action must be a real trusted input');
            await beforeRepeatClose(page, job.family); await page.keyboard.press('Escape');
            await page.waitForFunction(() => __enFamilyProbe.isClosed());
            second = await use(); assert(second.trusted); assert.equal(second.recreatedNodes, 0, 'Generated body recreated on repeat');
            if (['combobox', 'command'].includes(job.family)) assert(first.snapshot.workload.inputSame && second.snapshot.workload.inputSame, 'Native input replaced');
          }
          if (control) {
            const completion = await finishCommandPolicy(page, control, {activated: Boolean(first)});
            preparation = summarizeCommandPolicy(control, preActivation, completion, first);
            if (job.deliveryPolicy === 'prepared-0' && job.profile === 'constrained') assert.equal(preparation.preparationPendingAtActivation, true, 'Constrained immediate activation must occur while preparation is actually pending');
            const completedBytes = receiptBytes(input.receipts.get(job.arm), adapter.path, completion.snapshot.resources, origin);
            preparationTraffic = {before: bytes, completion: completedBytes, additionalGzipBytes: completedBytes.settledGzipBytes - bytes.settledGzipBytes, additionalRequests: completedBytes.settledRequests - bytes.settledRequests};
            if (!first) await page.waitForTimeout(500);
          }
          const final = await page.evaluate(() => ({snapshot: __enFamilyProbe.snapshot(), errors: __enFamilyProbe.state.errors})); errors.push(...final.errors);
          const finalBytes = receiptBytes(input.receipts.get(job.arm), adapter.path, final.snapshot.resources, origin);
          if (preparationTraffic) preparationTraffic.final = finalBytes;
          assert.deepEqual(errors, []); assert.deepEqual(failures, []); assert(final.snapshot.resources.every(resource => resource.protocol === 'h2'), 'Required H2 assets not observed');
          if (first) assert.equal(first.snapshot.actualRegistry, 'global', 'Activated actual route must use its production-global registry');
          else assert.equal(final.snapshot.actualRegistry, 'unregistered', 'Unused load-only preparation must leave the command tag unregistered');
          const metrics = {startupReadyMs: startup.readyMs, startupDocumentNodes: startup.snapshot.document.nodes, startupDocumentElements: startup.snapshot.document.elements, startupComponentNodes: startup.snapshot.component.nodes, startupComponentElements: startup.snapshot.component.elements, startupGeneratedNodes: startup.snapshot.generated.nodes, startupGeneratedElements: startup.snapshot.generated.elements, firstReadyMs: first?.readyMs ?? null, repeatReadyMs: second?.readyMs ?? null, recreatedNodes: second?.recreatedNodes ?? null, ...bytes};
          await appendFile(raw, JSON.stringify({status: 'ok', at: new Date().toISOString(), job, browserVersion: browser.version(), actualRegistry: first?.snapshot.actualRegistry ?? final.snapshot.actualRegistry, metrics, startup, settled, first, second, final, preparation, preparationTraffic, errors, failures}) + '\n');
          successful++; console.log(successful + '/' + jobs.length + ' ' + job.family + '/' + job.arm + ' ' + job.browser + '/' + job.profile + '/' + job.action);
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
