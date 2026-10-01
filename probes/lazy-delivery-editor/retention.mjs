// Independent retention qualification of the unchanged production rich-text route.
// Run only after the deterministic route gate passes. Never import into timed code.
import assert from 'node:assert/strict';
import {chromium, firefox, webkit, expect} from '@playwright/test';
import {mkdir, open, writeFile} from 'node:fs/promises';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {executionRuntimeIdentity} from '../../tooling/testing/runtime-identity.mjs';
import {serve} from '../scoped-hydration/production/server.mjs';
import {digest, digestFile} from '../lazy-delivery-performance/source-seal.mjs';
import {route, waitUntilReady, selectText, settle, census, loadPreparation, requiredHarnessPaths} from './common.mjs';
import {acquisitionInstallation} from '../lazy-delivery-families/performance-common.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const engineTypes = {chromium, firefox, webkit};
const viewportSizes = {desktop: {width: 1280, height: 900}, phone: {width: 390, height: 844}};
const armIds = ['reference', 'candidate', 'rollback'];
const protocol = Object.freeze({
  id: 'en-editor-toolbar-retention-v1', repetitions: 5, cycles: 100,
  checkpoints: [0, 10, 50, 100], seed: 'en-editor-toolbar-retention-v1',
  registry: 'existing-production-global',
  cycle: 'Select real rich-editor text, open contextual Link with normal pointer hit testing, edit its native URL draft, dismiss with Escape, and collapse the restored selection with ArrowRight.',
  collection: 'At each checkpoint: settled UI, a fixed 300 ms settlement period, settled UI again, then two explicit Chromium garbage collections. Firefox/WebKit heap and listener counts are unsupported; never substitute zero.',
  gates: {maximumConnectedNodeGrowth: 0, maximumRetainedDOMNodeGrowth: 0, maximumListenerGrowth: 0, maximumAdditionalMedianHeapGrowthBytes: 262144},
  heapAggregation: 'Within each engine/viewport, median candidate heap growth from cycle 10 to 100 minus the median growth of each matched eager arm. All per-repetition paired deltas and outliers remain in the result.',
  limits: 'Retention evidence only; no latency result, physical touch, native picker, IME or assistive-technology acceptance. Generated controls retained after first use are intentional one-time allocation.',
});

function options() {
  const accepted = new Set(['prepared', 'out', 'engines', 'viewports']);
  const result = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--([^=]+)=(.+)$/.exec(arg);
    if (!match || !accepted.has(match[1]) || match[1] in result) throw new Error('Usage: node retention.mjs --prepared=<frozen-arms-base> --out=<fresh-directory> [--engines=chromium,firefox,webkit] [--viewports=desktop,phone]');
    result[match[1]] = match[2];
  }
  const subset = (name, allowed) => {
    const selected = (result[name] ?? allowed.join(',')).split(',');
    if (!selected.length || new Set(selected).size !== selected.length || selected.some(item => !allowed.includes(item))) throw new Error(`Invalid --${name} selection`);
    return selected;
  };
  const output = result.out ?? process.env.EN_EXECUTION_OUTPUT;
  if (!result.prepared || !output) throw new Error('--prepared and --out (or EN_EXECUTION_OUTPUT) are required; output must not exist.');
  return {prepared: resolve(result.prepared), out: resolve(output), engines: subset('engines', Object.keys(engineTypes)), viewports: subset('viewports', Object.keys(viewportSizes))};
}
// Source/assets, driver packages, browser distributions and failure receipts all
// belong to the same acquisition lease; none may race an unrelated campaign.
await exclusiveBrowserWork(async () => {
const config = options();
await mkdir(config.out, {recursive: false});
const events = await open(resolve(config.out, 'events.jsonl'), 'wx');
const record = async value => events.write(JSON.stringify({at: new Date().toISOString(), ...value}) + '\n');
const writeNew = (name, value) => writeFile(resolve(config.out, name), JSON.stringify(value, null, 2) + '\n', {flag: 'wx'});
const errorData = error => ({name: error?.name ?? 'Error', message: String(error?.message ?? error), stack: String(error?.stack ?? '')});
const median = values => {const sorted = [...values].sort((a, b) => a - b), at = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[at] : (sorted[at - 1] + sorted[at]) / 2;};
const configuredRuntime = [{config: relative(root, fileURLToPath(import.meta.url)), discovery: {projects: config.engines.map(browserName => ({name: browserName, use: {browserName}}))}}];
const harnessPaths = [...new Set([...requiredHarnessPaths,
  'probes/lazy-delivery-editor/retention.mjs', 'probes/lazy-delivery-editor/common.mjs',
  'probes/lazy-delivery-families/performance-common.mjs', 'probes/lazy-delivery-families/route-build-contract.mjs', 'probes/lazy-delivery-families/family-adapters.mjs',
  'probes/lazy-delivery-families/browser-probe.mjs', 'probes/lazy-delivery-families/command-probe.mjs', 'probes/lazy-delivery-families/pagination-probe.mjs',
  'probes/lazy-delivery-performance/source-seal.mjs', 'probes/scoped-hydration/production/server.mjs',
  'showcases/performance/src/lock.mjs', 'showcases/performance/src/config.mjs',
  'showcases/performance/registry/systems.json', 'showcases/performance/profiles/profiles.json',
  'tooling/testing/runtime-identity.mjs', 'tooling/evidence/setup.mjs', 'tooling/evidence/identity.ts',
  'tooling/testing/execution-owner.mjs', 'tooling/testing/machine-owner.mjs',
  'plans/lazy-delivery/editor.md', 'plans/lazy-delivery/budgets.json', 'plans/lazy-delivery/validation.md',
  'package-lock.json', 'showcases/performance/package-lock.json',
])];
const harnessIdentity = async () => Object.fromEntries(await Promise.all(harnessPaths.map(async path => [path, await digestFile(resolve(root, path))])));
const rows = [], planned = [];
for (const engine of config.engines) for (const viewport of config.viewports) for (let repetition = 1; repetition <= protocol.repetitions; repetition++) {
  const ordered = [...armIds].sort((a, b) => digest(`${protocol.seed}/${engine}/${viewport}/${repetition}/${a}`).localeCompare(digest(`${protocol.seed}/${engine}/${viewport}/${repetition}/${b}`)));
  for (const arm of ordered) planned.push({id: `${engine}-${viewport}-${repetition}-${arm}`, engine, viewport, repetition, arm});
}
const result = {schemaVersion: 1, kind: protocol.id, status: 'started', startedAt: new Date().toISOString(), protocol, config, selectedMatrix: {complete: config.engines.length === 3 && config.viewports.length === 2, evidence: config.engines.length === 3 && config.viewports.length === 2 ? 'complete declared engine/viewport selection' : 'explicit subset; not complete promotion evidence'}, planned, rows, verification: {}};
await writeNew('started.json', result);
await record({kind: 'run', status: 'started', plannedRepetitions: planned.length});
let abortSignal, activeContext, preparation, beforeRuntime, beforeHarness, beforeInstallation, failure;
const onSignal = signal => {
  abortSignal ??= signal;
  // Closing this run's context interrupts a pending Playwright operation. No
  // unrelated browser or owner process is touched, and all rows are retained.
  void activeContext?.close().catch(() => {});
};
const sigint = () => onSignal('SIGINT'), sigterm = () => onSignal('SIGTERM');
process.on('SIGINT', sigint); process.on('SIGTERM', sigterm);
function checkAbort() {if (abortSignal) throw Object.assign(new Error(`Run aborted by ${abortSignal}`), {aborted: true});}
function assertNoPageErrors(row) {
  assert.deepEqual(row.pageErrors, [], 'Production page emitted an uncaught error');
  assert.deepEqual(row.requestFailures, [], 'Production route or asset request failed');
}
function unsupported(reason) {return {status: 'unsupported', reason};}
function methodUnsupported(error) {return /(?:method (?:was )?not found|wasn't found|unknown method|not supported)/i.test(String(error?.message ?? error));}

async function checkpoint(page, cdp, cycle) {
  await settle(page);
  await page.waitForTimeout(300);
  await settle(page);
  let memory = unsupported('This engine has no supported Playwright CDP session for retained DOM listeners and explicit-GC heap measurement.');
  if (cdp) {
    try {
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.collectGarbage');
      const dom = await cdp.send('Memory.getDOMCounters');
      const heap = await cdp.send('Runtime.getHeapUsage');
      assert(Number.isFinite(dom.nodes) && Number.isFinite(dom.jsEventListeners) && Number.isFinite(heap.usedSize), 'CDP retention counters must be finite');
      memory = {status: 'supported', method: 'Chromium CDP after two explicit garbage collections', dom, heap};
    } catch (error) {
      if (!methodUnsupported(error)) throw error;
      memory = unsupported(`Installed Chromium protocol does not support the required counters: ${error.message}`);
    }
  }
  const connected = await census(page);
  assert(Number.isInteger(connected.routeNodes) && connected.routeNodes > 0, 'Whole-document connected node census is required');
  return {cycle, connected, memory};
}

async function installIdentity(page, arm) {
  return page.evaluate(arm => {
    const editor = document.querySelector('#rich-brief'), toolbar = document.querySelector('#selection-toolbar');
    const native = editor?.shadowRoot?.querySelector('[contenteditable="true"]');
    const commands = toolbar?.shadowRoot?.querySelector('en-toolbar');
    if (!editor || !toolbar || !native) throw new Error('Production editor and toolbar are not ready');
    if (editor.constructor !== customElements.get('en-rich-text-editor') || toolbar.constructor !== customElements.get('en-editor-toolbar')) throw new Error('The actual production route is no longer globally registered; do not relabel this cell');
    if (arm === 'candidate' && (commands || toolbar.contentRendering !== 'on-demand')) throw new Error('Candidate must begin with unconstructed on-demand contextual controls');
    if (arm !== 'candidate' && !commands) throw new Error('Both eager arms must begin with generated contextual controls');
    if (arm === 'rollback' && toolbar.contentRendering !== 'eager') throw new Error('Rollback must exercise the candidate implementation with its eager policy');
    if (toolbar.shadowRoot.querySelector('.base').matches(':popover-open')) throw new Error('Initial contextual toolbar must be closed');
    window.__enEditorRetention = {editor: new WeakRef(editor), native: new WeakRef(native), toolbar: new WeakRef(toolbar), commands: commands ? new WeakRef(commands) : undefined};
    return {contentRendering: toolbar.contentRendering ?? 'unimplemented eager baseline', generatedPresent: !!commands, registry: 'global', initialValue: editor.value};
  }, arm);
}

async function assertIdentity(page, {captureCommands = false} = {}) {
  await page.evaluate(captureCommands => {
    const probe = window.__enEditorRetention, editor = document.querySelector('#rich-brief'), toolbar = document.querySelector('#selection-toolbar');
    const native = editor?.shadowRoot?.querySelector('[contenteditable="true"]'), commands = toolbar?.shadowRoot?.querySelector('en-toolbar');
    if (!probe || probe.editor.deref() !== editor || probe.native.deref() !== native || probe.toolbar.deref() !== toolbar) throw new Error('Existing production editor, native editing node or toolbar was replaced');
    if (captureCommands && !probe.commands && commands) probe.commands = new WeakRef(commands);
    if (!commands || probe.commands?.deref() !== commands) throw new Error('Generated contextual controls were absent or replaced after first use');
  }, captureCommands);
}

async function cycle(page, cycleNumber) {
  const editor = page.locator('#rich-brief'), textbox = editor.getByRole('textbox');
  const contextual = page.locator('#selection-toolbar');
  await selectText(page, 'Alpha beta', cycleNumber % 2 === 0);
  await expect(textbox).toBeFocused();
  await expect(contextual.getByRole('button', {name: 'Link', exact: true})).toBeEnabled();
  await assertIdentity(page, {captureCommands: cycleNumber === 1});
  // This is the real production command, including its normal hit testing.
  await contextual.getByRole('button', {name: 'Link', exact: true}).click();
  const field = contextual.getByRole('textbox', {name: 'Link URL', exact: true});
  await expect(field).toBeFocused();
  await field.evaluate(element => {window.__enEditorRetention.draft = new WeakRef(element);});
  await field.fill('https://example.com/uncommitted');
  await settle(page);
  await expect(field).toHaveValue('https://example.com/uncommitted');
  await field.evaluate(element => {if (window.__enEditorRetention.draft.deref() !== element) throw new Error('The native link draft input was replaced while editing');});
  await field.press('Escape');
  await expect(contextual.locator('en-text-field')).toHaveCount(0);
  await expect(contextual.locator('.base')).not.toBeVisible();
  await expect(textbox).toBeFocused();
  await expect(editor).toHaveJSProperty('value', 'Alpha beta');
  await expect(editor.locator('a')).toHaveCount(0);
  await page.evaluate(() => {delete window.__enEditorRetention.draft;});
  await assertIdentity(page);
  // Escape restores the selected bookmark. Collapse it through a real native
  // key so the next cycle creates a fresh eligible selection even when the
  // authoritative text value is unchanged.
  await textbox.press('ArrowRight');
  await expect(editor).toHaveJSProperty('hasSelection', false);
  await expect(contextual.locator('.base')).not.toBeVisible();
  await settle(page);
}

function evaluateRepetition(row) {
  const from = row.checkpoints.find(point => point.cycle === 10), to = row.checkpoints.find(point => point.cycle === 100);
  const connectedNodeGrowth = to.connected.routeNodes - from.connected.routeNodes;
  const memorySupported = from.memory.status === 'supported' && to.memory.status === 'supported';
  const listenerGrowth = memorySupported ? to.memory.dom.jsEventListeners - from.memory.dom.jsEventListeners : null;
  const retainedDOMCounterGrowth = memorySupported ? to.memory.dom.nodes - from.memory.dom.nodes : null;
  return {
    connectedNodeGrowth, connectedNodes: connectedNodeGrowth <= protocol.gates.maximumConnectedNodeGrowth ? 'pass' : 'fail',
    listenerGrowth, listeners: memorySupported ? listenerGrowth <= protocol.gates.maximumListenerGrowth ? 'pass' : 'fail' : 'unsupported',
    heapGrowthBytes: memorySupported ? to.memory.heap.usedSize - from.memory.heap.usedSize : null,
    retainedDOMCounterGrowth, retainedNodes: memorySupported ? retainedDOMCounterGrowth <= protocol.gates.maximumRetainedDOMNodeGrowth ? 'pass' : 'fail' : 'unsupported',
    retainedDOMCounterScope: 'CDP includes detached nodes and browser-internal DOM. Its zero-positive-growth gate applies alongside the connected whole-document gate; a positive counter remains unqualified rather than being exempted as noise.',
  };
}

function heapComparisons() {
  const comparisons = [];
  for (const engine of config.engines) for (const viewport of config.viewports) for (const eager of ['reference', 'rollback']) {
    const pairs = Array.from({length: protocol.repetitions}, (_, index) => {
      const repetition = index + 1;
      const find = arm => rows.find(row => row.engine === engine && row.viewport === viewport && row.repetition === repetition && row.arm === arm);
      const candidate = find('candidate'), comparison = find(eager);
      const candidateGrowth = candidate?.growth?.heapGrowthBytes, eagerGrowth = comparison?.growth?.heapGrowthBytes;
      const supported = candidate?.status === 'ok' && comparison?.status === 'ok' && Number.isFinite(candidateGrowth) && Number.isFinite(eagerGrowth);
      return {repetition, candidate: candidate?.id ?? null, eager: comparison?.id ?? null, status: supported ? 'supported' : candidate?.status === 'ok' && comparison?.status === 'ok' ? 'unsupported' : 'incomplete', candidateGrowthBytes: candidateGrowth ?? null, eagerGrowthBytes: eagerGrowth ?? null, additionalGrowthBytes: supported ? candidateGrowth - eagerGrowth : null};
    });
    const supported = pairs.every(pair => pair.status === 'supported');
    const candidateMedian = supported ? median(pairs.map(pair => pair.candidateGrowthBytes)) : null;
    const eagerMedian = supported ? median(pairs.map(pair => pair.eagerGrowthBytes)) : null;
    const additionalMedian = supported ? candidateMedian - eagerMedian : null;
    comparisons.push({engine, viewport, eager, pairs, candidateMedianGrowthBytes: candidateMedian, eagerMedianGrowthBytes: eagerMedian, additionalMedianGrowthBytes: additionalMedian, medianPairedAdditionalGrowthBytes: supported ? median(pairs.map(pair => pair.additionalGrowthBytes)) : null, outliers: pairs.filter(pair => pair.additionalGrowthBytes > protocol.gates.maximumAdditionalMedianHeapGrowthBytes), status: supported ? additionalMedian <= protocol.gates.maximumAdditionalMedianHeapGrowthBytes ? 'pass' : 'fail' : pairs.every(pair => pair.status === 'unsupported') ? 'unsupported' : 'incomplete'});
  }
  return comparisons;
}

try {
  const checks = [
    ['preparation', async () => {
      preparation = await loadPreparation(config.prepared);
      assert.deepEqual([...preparation.arms.map(arm => arm.id)].sort(), [...armIds].sort(), 'Exactly the three frozen editor arms are required');
      result.preparation = preparation.identity;
    }],
    ['harness', async () => {beforeHarness = await harnessIdentity(); result.harnessBefore = beforeHarness;}],
    ['runtime', async () => {beforeRuntime = await executionRuntimeIdentity(root, configuredRuntime); result.runtimeBefore = beforeRuntime;}],
    ['installation', async () => {beforeInstallation = await acquisitionInstallation('probes/lazy-delivery-editor/retention.mjs', root); result.installation = beforeInstallation;}],
  ];
  const checked = await Promise.allSettled(checks.map(([, run]) => run()));
  const preflightErrors = checked.flatMap((item, index) => item.status === 'rejected' ? [{check: checks[index][0], error: errorData(item.reason)}] : []);
  if (preparation && beforeInstallation) {
    try {await preparation.verifyInstallation(beforeInstallation); result.verification.installationPreparedBefore = true;}
    catch (error) {preflightErrors.push({check: 'prepared-installation', error: errorData(error)});}
  }
  await writeNew('identity-before.json', {preparation: result.preparation, harness: beforeHarness, runtime: beforeRuntime, installation: beforeInstallation, errors: preflightErrors});
  if (preflightErrors.length) {result.preflightErrors = preflightErrors; throw new Error('Retention preflight verification failed');}
  checkAbort();
    const servers = new Map();
    try {
      for (const arm of preparation.arms) servers.set(arm.id, await serve(arm.root ?? arm.id, 0, config.prepared));
      for (const engine of config.engines) {
        checkAbort();
        const browser = await engineTypes[engine].launch();
        try {
          for (const item of planned.filter(item => item.engine === engine)) {
            checkAbort();
            const row = {...item, version: browser.version(), status: 'started', startedAt: new Date().toISOString(), pageErrors: [], requestFailures: [], checkpoints: [], completedCycles: 0};
            rows.push(row);
            await record({kind: 'repetition', status: 'started', ...item});
            let context, page, cdp, repetitionFailure;
            try {
              context = await browser.newContext({viewport: viewportSizes[item.viewport], reducedMotion: 'reduce', serviceWorkers: 'block', ignoreHTTPSErrors: true});
              activeContext = context;
              page = await context.newPage();
              page.setDefaultTimeout(8000); page.setDefaultNavigationTimeout(30000);
              page.on('pageerror', error => row.pageErrors.push(errorData(error)));
              page.on('requestfailed', request => row.requestFailures.push({url: request.url(), failure: request.failure()?.errorText}));
              page.on('response', response => {if (response.status() >= 400) row.requestFailures.push({url: response.url(), status: response.status()});});
              checkAbort();
              await page.goto(servers.get(item.arm).url + route);
              await waitUntilReady(page);
              row.initial = await installIdentity(page, item.arm);
              assertNoPageErrors(row);
              if (engine === 'chromium') cdp = await context.newCDPSession(page);
              row.checkpoints.push(await checkpoint(page, cdp, 0));
              assertNoPageErrors(row);
              await record({kind: 'checkpoint', status: 'ok', id: item.id, observation: row.checkpoints.at(-1)});
              for (let count = 1; count <= protocol.cycles; count++) {
                checkAbort();
                await record({kind: 'cycle', status: 'started', id: item.id, cycle: count});
                try {
                  await cycle(page, count);
                  assertNoPageErrors(row);
                  row.completedCycles = count;
                  await record({kind: 'cycle', status: 'ok', id: item.id, cycle: count});
                } catch (error) {
                  await record({kind: 'cycle', status: abortSignal ? 'aborted' : 'failed', id: item.id, cycle: count, error: errorData(error)});
                  throw error;
                }
                if (protocol.checkpoints.includes(count)) {
                  row.checkpoints.push(await checkpoint(page, cdp, count));
                  assertNoPageErrors(row);
                  await record({kind: 'checkpoint', status: 'ok', id: item.id, observation: row.checkpoints.at(-1)});
                }
              }
              row.growth = evaluateRepetition(row);
              row.status = 'ok';
            } catch (error) {
              repetitionFailure = error;
              row.status = abortSignal ? 'aborted' : 'failed'; row.error = errorData(error);
              if (page && !page.isClosed()) {
                row.screenshot = item.id + '-failure.png';
                await page.screenshot({path: resolve(config.out, row.screenshot), fullPage: true}).catch(error => {row.screenshotError = errorData(error);});
              }
            } finally {
              const cleanupErrors = [];
              if (cdp) await cdp.detach().catch(error => cleanupErrors.push(error));
              if (context) await context.close().catch(error => cleanupErrors.push(error));
              activeContext = undefined;
              if (cleanupErrors.length) {
                row.cleanupErrors = cleanupErrors.map(errorData);
                row.status = abortSignal ? 'aborted' : 'failed';
                repetitionFailure ??= new AggregateError(cleanupErrors, 'This repetition did not cleanly release its browser resources');
              }
              row.finishedAt = new Date().toISOString();
              await record({kind: 'repetition', status: row.status, row});
            }
            if (repetitionFailure) throw repetitionFailure;
          }
        } finally {await browser.close();}
      }
    } finally {
      const cleanup = await Promise.allSettled([...servers.values()].map(server => server.close()));
      const cleanupErrors = cleanup.filter(item => item.status === 'rejected').map(item => item.reason);
      if (cleanupErrors.length) result.serverCleanupErrors = cleanupErrors.map(errorData);
      if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Retention server cleanup failed');
    }
} catch (error) {failure = error; result.error = errorData(error);}
finally {
  // Every post-run inventory is attempted, even when preflight, acquisition or
  // cleanup failed. Independent errors cannot suppress the remaining evidence.
  let preparationAfter;
  const checks = [
    ['preparation', async () => {
      if (preparation) {await preparation.verify(); result.preparationUnchanged = true;}
      else {preparationAfter = await loadPreparation(config.prepared); result.preparationAfter = preparationAfter.identity;}
    }],
    ['harness', async () => {
      result.harnessAfter = await harnessIdentity();
      if (beforeHarness) {
        result.harnessUnchanged = digest(beforeHarness) === digest(result.harnessAfter);
        assert(result.harnessUnchanged, 'Retention harness or dependency locks changed during acquisition');
      }
    }],
    ['runtime', async () => {
      result.runtimeAfter = await executionRuntimeIdentity(root, configuredRuntime);
      if (beforeRuntime) {
        result.runtimeUnchanged = result.runtimeAfter.digest === beforeRuntime.digest;
        assert(result.runtimeUnchanged, 'Browser/runtime executable identity changed during retention');
      }
    }],
    ['installation', async () => {
      result.verification.installationAfter = await acquisitionInstallation('probes/lazy-delivery-editor/retention.mjs', root);
      if (beforeInstallation) {
        result.verification.installationUnchanged = result.verification.installationAfter.digest === beforeInstallation.digest;
        assert(result.verification.installationUnchanged, 'Installed acquisition driver closure changed during retention');
      }
    }],
  ];
  const checked = await Promise.allSettled(checks.map(([, run]) => run()));
  const verificationErrors = checked.flatMap((item, index) => item.status === 'rejected' ? [{check: checks[index][0], error: errorData(item.reason)}] : []);
  const preparedAfter = preparation ?? preparationAfter;
  if (preparedAfter && result.verification.installationAfter) {
    try {
      await preparedAfter.verifyInstallation(result.verification.installationAfter);
      result.verification.installationPreparedAfter = true;
      result.verification.installationPreparedMatch = result.verification.installationPreparedBefore === true;
    } catch (error) {verificationErrors.push({check: 'prepared-installation', error: errorData(error)});}
  }
  if (verificationErrors.length) {result.verificationErrors = verificationErrors; failure ??= new Error('Post-run integrity verification failed');}
  for (const item of planned.filter(item => !rows.some(row => row.id === item.id))) await record({kind: 'repetition', status: 'aborted', ...item, reason: abortSignal ? `Run interrupted by ${abortSignal}` : 'Not started because an earlier operation failed; no replacement or resume is allowed.'});
  result.heapComparisons = heapComparisons();
  result.completedRepetitions = rows.filter(row => row.status === 'ok').length;
  const retentionFailure = rows.some(row => row.growth?.connectedNodes === 'fail' || row.growth?.retainedNodes === 'fail' || row.growth?.listeners === 'fail') || result.heapComparisons.some(comparison => comparison.status === 'fail');
  const chromiumCountersUnavailable = rows.some(row => row.engine === 'chromium' && row.checkpoints.some(point => point.memory.status !== 'supported'));
  result.status = abortSignal ? 'aborted' : failure ? 'failed' : retentionFailure ? 'failed-retention-gate' : chromiumCountersUnavailable ? 'incomplete-retention-coverage' : 'ok';
  result.promotionDecision = 'Not evaluated by this retention lane. Timing, marginal route benefit, other correctness and manual acceptance gates remain separate.';
  result.listenerAndHeapCoverage = config.engines.includes('chromium')
    ? chromiumCountersUnavailable ? 'Required Chromium CDP counters were unavailable; their unsupported observations do not satisfy the retention gates. Other engines remain unsupported.' : 'Chromium CDP only; other selected engines remain unsupported for listener/heap gates.'
    : 'Unsupported for all selected engines; connected DOM evidence only.';
  result.finishedAt = new Date().toISOString();
  await writeNew('result.json', result);
  await record({kind: 'run', status: result.status, completedRepetitions: result.completedRepetitions, plannedRepetitions: planned.length});
  await events.close();
  process.off('SIGINT', sigint); process.off('SIGTERM', sigterm);
  console.log(JSON.stringify({output: config.out, status: result.status, completedRepetitions: result.completedRepetitions, plannedRepetitions: planned.length, fullMatrix: result.selectedMatrix.complete}, null, 2));
  if (result.status !== 'ok') process.exitCode = 1;
}
}, {workspaceRoot: root});
