import {chromium, expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {cpus, platform, release, totalmem} from 'node:os';
import {createRequire} from 'node:module';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {startDocsServer} from '../../apps/docs/tests/static-server.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const distribution = resolve(process.env.EN_COLOR_BASELINE_SITE ?? '');
const graphPath = resolve(process.env.EN_COLOR_BASELINE_GRAPH ?? '');
const output = process.env.EN_COLOR_BASELINE_OUTPUT;
const excludedDiagnosticPath = process.env.EN_COLOR_BASELINE_EXCLUDED_DIAGNOSTIC && resolve(process.env.EN_COLOR_BASELINE_EXCLUDED_DIAGNOSTIC);
if (!process.env.EN_COLOR_BASELINE_SITE || !process.env.EN_COLOR_BASELINE_GRAPH || !output) {
  throw new Error('Set EN_COLOR_BASELINE_SITE, EN_COLOR_BASELINE_GRAPH and fresh EN_COLOR_BASELINE_OUTPUT.');
}
const out = resolve(output);
await mkdir(out, {recursive: false});
const graph = JSON.parse(await readFile(graphPath, 'utf8'));
const inventoryPath = resolve(dirname(distribution), 'assets.json');
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const frozenReceiptPath = resolve(dirname(distribution), 'receipt.json');
const frozenReceipt = JSON.parse(await readFile(frozenReceiptPath, 'utf8'));
const require = createRequire(import.meta.url);
const playwrightPackagePath = require.resolve('@playwright/test/package.json');
const protocolPath = resolve(dirname(require.resolve('playwright-core/package.json')), 'types/protocol.d.ts');
const route = '/api-examples/composable-chat.html';
const calibrationAsset = graph.optional.find(item => item.tag === 'color-picker')?.chunk;
if (!calibrationAsset || /[^a-zA-Z0-9_.-]/.test(calibrationAsset)) throw new Error('Invalid frozen calibration asset.');
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const sourceFiles = [
  'probes/lazy-delivery-color/baseline.mjs', 'probes/lazy-delivery-color/README.md',
  'plans/lazy-delivery/color-popup.md', 'package-lock.json', '.node-version',
  'apps/docs/src/api-example/main.ts', 'apps/docs/src/composable-chat-demo.definition.ts',
  'packages/elements/src/token-editor/element.ts', 'packages/elements/src/color-picker/element.ts',
  'apps/docs/tests/static-server.mjs', 'showcases/performance/src/lock.mjs',
];
const controlIdentity = async () => Object.fromEntries(await Promise.all([graphPath, inventoryPath, frozenReceiptPath, playwrightPackagePath, protocolPath].map(async path => [path, await hash(path)])));
const sourceIdentity = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async name => [name, await hash(resolve(root, name))])));
const relevantAssets = inventory.filter(item => item.path === route.slice(1) || /\.(?:js|css)$/.test(item.path));
const siteIdentity = async () => {
  const files = await Promise.all(relevantAssets.map(async item => ({path: item.path, expected: item.sha256, actual: await hash(resolve(distribution, item.path))})));
  return {matchesFrozenInventory: files.every(item => item.expected === item.actual), files};
};
const manifest = {
  schemaVersion: 2, runnerSourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  startedAt: new Date().toISOString(), node: process.version, distribution, graphPath, graphSha256: await hash(graphPath),
  frozenInventorySha256: await hash(inventoryPath), frozenReceiptPath, frozenReceipt, route, attemptsPlanned: 30,
  playwright: {version: JSON.parse(await readFile(playwrightPackagePath, 'utf8')).version, packagePath: playwrightPackagePath, protocolPath},
  host: {platform: platform(), release: release(), cpus: cpus(), totalmem: totalmem(), operatorDeclaredContention: process.env.EN_COLOR_BASELINE_CONTENTION ?? 'not supplied'},
  processPolicy: 'One shared browser process; a fresh isolated context for every action. Independence/stationarity are assumptions, not established by fresh contexts.',
  profile: {cpuRate: 4, latencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000, viewport: {width: 1280, height: 900}},
  method: 'Thirty fresh Chromium contexts; real Colors click captured inside the page to complete visible/enabled picker and two frame opportunities. Network shaping starts after unchanged route readiness, before the action. Action-only diagnostic; not startup/preparation/retention measurement or a candidate benchmark.',
  bound: {configuredNetworkFloorMs: 150, timestampToleranceMs: 1, conservativeColdFloorMs: 149, maximumAddedReadyMs: 50, confidence: 0.975, method: 'One-sided distribution-free order-statistic upper confidence bound for the eager population median; n=30, rank selected from Binomial(n,.5) tail. Necessary cold mechanism rejection only if conservative floor minus eager upper bound exceeds 50ms. Zero payload/parse/render allowance favors candidate.'},
  limitations: ['Chromium CDP shaping only; local workstation, not field or physical device.', 'Independent-context median uncertainty is exploratory; no candidate or paired timing campaign.', 'The lower bound assumes configured CDP minimum latency and a mandatory uncached request starting no earlier than action. Chromium raw header ResourceTiming did not include observed delivery delay in excluded failed run01; complete-body ResourceTiming and script-visible fetch completion are checked. Calibration can falsify this model; samples do not establish a universal minimum.', 'Baseline full-readiness time includes two animation-frame opportunities; these do not prove presented pixels.', 'No optional code is delayed or removed in this unchanged baseline.'],
  controlBefore: await controlIdentity(), excludedDiagnostic: {path: excludedDiagnosticPath ?? null, harnessSha256: 'bf8bbfbfcd53d7f3042bedf07e599bfebcdda5d0e028ceec24b0d65373371bbf', reason: 'Original header-only calibration predicate failed on first attempt; zero eligible observations, 29 not run. Fresh full batch, no pooling.', receiptSha256: excludedDiagnosticPath ? await hash(excludedDiagnosticPath) : null}, sourceBefore: await sourceIdentity(), siteBefore: await siteIdentity(), attempts: [],
};
const failure = error => ({message: String(error), stack: error?.stack});
let abortRequested = false;
const stop = signal => {abortRequested = true; manifest.abortRequested = {signal, at: new Date().toISOString()};};
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
await writeFile(resolve(out, 'started.json'), JSON.stringify(manifest, null, 2) + '\n');
const checkpoint = () => writeFile(resolve(out, 'attempts.json'), JSON.stringify(manifest, null, 2) + '\n');

try {
  if (!manifest.siteBefore.matchesFrozenInventory) throw new Error('Frozen site does not match its asset inventory.');
  await exclusiveBrowserWork(async () => {
    const server = await startDocsServer({distribution, port: 0});
    manifest.origin = server.url;
    try {
      const executablePath = chromium.executablePath();
      manifest.browser = {name: 'chromium', executable: executablePath, executableSha256: await hash(executablePath), launchPolicy: 'Explicit bundled Chromium executable; headless default, no channel substitution.'};
      const readHostState = args => {try {return {args, output: execFileSync('pmset', args, {encoding: 'utf8', timeout: 3000})};} catch (error) {return {args, unavailable: String(error)};}};
      manifest.host.powerBefore = readHostState(['-g', 'batt']);
      manifest.host.thermalBefore = readHostState(['-g', 'therm']);
      const browser = await chromium.launch({executablePath});
      try {
        manifest.browser.version = browser.version();
        for (let attempt = 1; attempt <= 30 && !abortRequested; attempt++) {
          const row = {attempt, startedAt: new Date().toISOString(), pageErrors: [], requests: [], responses: []};
          manifest.attempts.push(row);
          const context = await browser.newContext({viewport: manifest.profile.viewport, reducedMotion: 'reduce', serviceWorkers: 'block'});
          const page = await context.newPage();
          page.setDefaultTimeout(10000);
          page.on('pageerror', error => row.pageErrors.push(failure(error)));
          page.on('requestfailed', request => {row.failedRequests ??= []; row.failedRequests.push({url: request.url(), failure: request.failure()});});
          page.on('request', request => row.requests.push({url: request.url(), resourceType: request.resourceType()}));
          page.on('response', response => row.responses.push({url: response.url(), status: response.status(), contentEncoding: response.headers()['content-encoding'] ?? 'identity'}));
          try {
            const cdp = await context.newCDPSession(page);
            await cdp.send('Network.enable');
            await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
            await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
            await page.goto(server.url + route, {waitUntil: 'load', timeout: 45000});
            await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
            await page.waitForFunction(() => document.documentElement.hasAttribute('data-example-standalone'));
            const colors = page.getByRole('button', {name: 'Colors', exact: true});
            await colors.scrollIntoViewIfNeeded();
            await colors.click({trial: true});
            row.beforeAction = await page.evaluate(async () => {
              const demo = document.querySelector('en-composable-chat-demo');
              const editor = demo.shadowRoot.querySelector('en-token-editor');
              const pending = [demo, editor, ...demo.shadowRoot.querySelectorAll('*')].map(element => element.updateComplete).filter(Boolean);
              await Promise.all(pending);
              await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
              const root = editor.shadowRoot;
              const registry = 'customElementRegistry' in root ? root.customElementRegistry : window.customElements;
              const tags = ['en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs'];
              return {value: editor.value, mode: demo.colorMode, optionalConstructed: !!root.querySelector('en-color-picker'),
                registry: registry === window.customElements ? 'global' : registry ? 'scoped' : 'null',
                definitionsReady: tags.every(tag => !!registry?.get(tag)), navigationResources: performance.getEntriesByType('resource').map(entry => entry.toJSON())};
            });
            if (row.beforeAction.mode !== 'picker' || row.beforeAction.optionalConstructed || !row.beforeAction.definitionsReady) throw new Error('Unchanged baseline must have eager definitions and absent inline controls before first use.');
            await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8});
            row.shapingAppliedAt = new Date().toISOString();
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
            row.calibration = await page.evaluate(async ({asset, attempt}) => {
              const url = new URL(`/assets/${asset}?color-eligibility=${attempt}`, location.origin).href;
              const start = performance.now();
              const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.timeout(5000)});
              const headersAvailableMs = performance.now() - start;
              const encoding = response.headers.get('content-encoding') ?? 'identity';
              const bytes = (await response.arrayBuffer()).byteLength;
              const end = performance.now();
              const resource = performance.getEntriesByName(url).at(-1)?.toJSON();
              return {url, status: response.status, encoding, bytes, durationMs: end - start, resource,
                responseWaitMs: resource ? resource.responseStart - resource.requestStart : null,
                responseCompletionMs: resource ? resource.responseEnd - resource.requestStart : null, headersAvailableMs,
                timingOrdered: !!resource && [resource.requestStart, resource.responseStart, resource.responseEnd].every(Number.isFinite)
                  && resource.requestStart <= resource.responseStart && resource.responseStart <= resource.responseEnd};
            }, {asset: calibrationAsset, attempt});
            if (row.calibration.status !== 200 || !row.calibration.timingOrdered || !Number.isFinite(row.calibration.responseCompletionMs) || row.calibration.responseCompletionMs < 149 || row.calibration.durationMs < 149) throw new Error('Complete-body calibration contradicts the declared CDP minimum-latency model or lacks timing.');
            if (row.failedRequests?.length) throw new Error('Failed network requests were recorded.');
            if (row.pageErrors.length) throw new Error('Browser page errors were recorded.');
            row.status = 'pass';
          } catch (error) {
            row.status = abortRequested ? 'aborted' : 'fail'; row.error = failure(error);
            await page.screenshot({path: resolve(out, `attempt-${attempt}-failure.png`), fullPage: true}).catch(error => {row.screenshotError = failure(error);});
          } finally {
            row.finishedAt = new Date().toISOString();
            await context.close();
            await appendFile(resolve(out, 'attempts.jsonl'), JSON.stringify(row) + '\n');
            await checkpoint();
            console.log(JSON.stringify({attempt, status: row.status, readyMs: row.measurement?.durationMs, responseWaitMs: row.calibration?.responseWaitMs, responseCompletionMs: row.calibration?.responseCompletionMs}));
          }
          if (row.status !== 'pass') break;
        }
      } finally {
        manifest.host.powerAfter = readHostState(['-g', 'batt']);
        manifest.host.thermalAfter = readHostState(['-g', 'therm']);
        try { manifest.browser.executableSha256After = await hash(executablePath); }
        finally { await browser.close(); }
      }
    } finally { await server.close(); }
  });
} catch (error) { manifest.error = failure(error); }
finally {
  manifest.finishedAt = new Date().toISOString();
  manifest.controlAfter = await controlIdentity(); manifest.sourceAfter = await sourceIdentity(); manifest.siteAfter = await siteIdentity();
  manifest.controlsUnchanged = JSON.stringify(manifest.controlBefore) === JSON.stringify(manifest.controlAfter);
  manifest.browserUnchanged = !!manifest.browser && manifest.browser.executableSha256 === manifest.browser.executableSha256After;
  manifest.sourceUnchanged = JSON.stringify(manifest.sourceBefore) === JSON.stringify(manifest.sourceAfter);
  manifest.siteUnchanged = JSON.stringify(manifest.siteBefore) === JSON.stringify(manifest.siteAfter);
  const values = manifest.attempts.filter(row => row.status === 'pass').map(row => row.measurement.durationMs).sort((a, b) => a - b);
  const n = values.length;
  const quantile = p => {const index = (n - 1) * p, lo = Math.floor(index), hi = Math.ceil(index); return values[lo] + (values[hi] - values[lo]) * (index - lo);};
  const tail = rank => {let coefficient = 1, sum = 0; for (let k = 0; k <= n; k++) {if (k >= rank) sum += coefficient / 2 ** n; coefficient *= (n - k) / (k + 1);} return sum;};
  let rank = 1; while (rank <= n && tail(rank) > 1 - manifest.bound.confidence) rank++;
  const upper = rank <= n ? values[rank - 1] : null;
  const valid = n === 30 && manifest.attempts.length === 30 && !manifest.error && !abortRequested
    && manifest.controlsUnchanged && manifest.browserUnchanged && manifest.sourceUnchanged && manifest.siteUnchanged && manifest.siteAfter.matchesFrozenInventory;
  manifest.summary = {n, attempts: manifest.attempts.length, notRun: 30 - manifest.attempts.length, failedOrAborted: manifest.attempts.filter(row => row.status !== 'pass').length,
    medianMs: n ? quantile(.5) : null, p75Ms: n ? quantile(.75) : null, minimumMs: values[0] ?? null, maximumMs: values.at(-1) ?? null,
    p95: 'Not reported: fewer than 100 samples.', eagerMedianUpperMs: upper, upperOrderStatisticRank: rank, achievedCoverage: rank <= n ? 1 - tail(rank) : null,
    conservativeColdMinusEagerUpperMs: upper === null ? null : 149 - upper,
    decision: !valid ? 'incomplete: no eligibility decision' : 149 - upper > 50 ? 'reject this cold-code mechanism under the declared network model: necessary latency gate fails' : 'inconclusive necessary bound: implement and measure the actual candidate',
    claim: 'A necessary-condition diagnostic, not observed candidate performance or a route speedup.'};
  await writeFile(resolve(out, 'baseline.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({output: out, ...manifest.summary, error: manifest.error}, null, 2));
  if (!valid) process.exitCode = 1;
}
