import { chromium } from '@playwright/test';
import { parse } from 'parse5';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { cpus, platform, release, arch } from 'node:os';
import { resolve } from 'node:path';
import { navigationBodyCapture } from './response-body.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const output = resolve(process.env.EN_REVE_PERF_OUTPUT ?? resolve(root, 'probes/performance-review/evidence'));
const baseURL = process.env.EN_REVE_PERF_URL ?? 'http://127.0.0.1:4196/';
const label = process.env.EN_REVE_PERF_LABEL ?? 'candidate';
const cpuRate = Number(process.env.EN_REVE_PERF_CPU_RATE ?? 1);
const gated = process.env.EN_REVE_PERF_GATED !== 'false';
const allDisclosures = process.env.EN_REVE_PERF_ALL_DISCLOSURES === 'true';
if (!Number.isFinite(cpuRate) || cpuRate < 1) throw new Error('CPU rate must be at least 1.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { label, at: new Date().toISOString(), baseURL, environment: { platform: platform(), osRelease: release(), arch: arch(), cpu: cpus()[0]?.model, node: process.version, syntheticCPUThrottleRate: cpuRate, viewport: { width: 1440, height: 1000 }, network: 'unthrottled loopback' }, scenario: { gated, allDisclosures }, caveats: ['Local diagnostic samples during concurrent development; not field data or a performance budget.', 'Encoded sizes computed offline rather than observed production transfer.', 'CPU throttle is a synthetic multiplier on this host, not a named mobile device.', 'Click-to-two-frames and client-release-to-app-update are diagnostic intervals, not INP or isolated hydration CPU.'], assets: [], styles: {}, browser: null, runs: [] };
await mkdir(output, { recursive: true });
const htmlBytes = await readFile(resolve(root, 'dist/index.html'));
const paths = ['index.html', ...(await readdir(resolve(root, 'dist/assets'))).filter(n => n.endsWith('.js') || n.endsWith('.css')).map(n => `assets/${n}`)];
for (const path of paths) {
  const bytes = await readFile(resolve(root, 'dist', path));
  report.assets.push({ path, raw: bytes.length, gzip9: gzipSync(bytes, { level: 9 }).length, brotli11: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length, sha256: hash(bytes) });
}
const groups = new Map();
let dsdRoots = 0;
function walk(node, host = 'document') {
  if (node.tagName?.startsWith('en-')) host = node.tagName;
  if (node.tagName === 'template' && node.attrs?.some(a => a.name === 'shadowrootmode')) dsdRoots++;
  if (node.tagName === 'style') {
    const css = (node.childNodes ?? []).map(x => x.value ?? '').join('');
    const identity = hash(css);
    const item = groups.get(identity) ?? { sha256: identity, bytes: Buffer.byteLength(css), count: 0, hosts: {} };
    item.count++; item.hosts[host] = (item.hosts[host] ?? 0) + 1; groups.set(identity, item);
  }
  for (const child of node.childNodes ?? []) walk(child, host);
  if (node.content) walk(node.content, host);
}
walk(parse(htmlBytes.toString('utf8')));
report.styles = { dsdRoots, count: [...groups.values()].reduce((n, g) => n + g.count, 0), rawBytes: [...groups.values()].reduce((n, g) => n + g.bytes * g.count, 0), uniqueBytes: [...groups.values()].reduce((n, g) => n + g.bytes, 0), groups: [...groups.values()].sort((a, b) => b.bytes * b.count - a.bytes * a.count) };
const browser = await chromium.launch();
report.browser = browser.version();
const frames = async page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const snapshot = page => page.evaluate(() => {
  const visit = root => [...root.querySelectorAll('*')].flatMap(el => [el, ...(el.shadowRoot ? visit(el.shadowRoot) : [])]);
  const all = visit(document);
  return { at: performance.now(), readyState: document.readyState, navigation: performance.getEntriesByType('navigation').map(x => x.toJSON()), paints: performance.getEntriesByType('paint').map(x => x.toJSON()), elements: all.length, shadowRoots: all.filter(x => x.shadowRoot).length, styles: all.filter(x => x.localName === 'style').length, resources: performance.getEntriesByType('resource').map(x => ({ name: x.name, initiatorType: x.initiatorType, duration: x.duration, transferSize: x.transferSize, encodedBodySize: x.encodedBodySize, decodedBodySize: x.decodedBodySize })), observations: globalThis.__enPerf ?? null };
});

try {
  for (let sample = 0; sample < 3; sample++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    if (cpuRate > 1) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
    }
    const bodyCapture = await navigationBodyCapture(cdp, page, htmlBytes.length);
    report.responseBodyCapture = bodyCapture.policy;
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      globalThis.__enPerf = { longtasks: [], shifts: [], lcp: [], resizeObserverCalls: 0, themeMutations: 0, clicks: [], highlightReady: [] };
      document.addEventListener('click', () => {
        const item = { at: performance.now(), toTwoFramesMs: null };
        globalThis.__enPerf.clicks.push(item);
        requestAnimationFrame(() => requestAnimationFrame(() => { item.toTwoFramesMs = performance.now() - item.at; }));
      }, true);
      for (const [type, key] of [['longtask', 'longtasks'], ['layout-shift', 'shifts']]) {
        if (PerformanceObserver.supportedEntryTypes.includes(type)) new PerformanceObserver(list => {
          for (const x of list.getEntries()) globalThis.__enPerf[key].push(type === 'layout-shift'
            ? { startTime: x.startTime, value: x.value, hadRecentInput: x.hadRecentInput }
            : { startTime: x.startTime, duration: x.duration, name: x.name });
        }).observe({ type, buffered: true });
      }
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) new PerformanceObserver(list => {
        for (const x of list.getEntries()) globalThis.__enPerf.lcp.push({ startTime: x.startTime, renderTime: x.renderTime, loadTime: x.loadTime, size: x.size, tagName: x.element?.localName ?? null });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      const NativeRO = ResizeObserver;
      globalThis.ResizeObserver = class extends NativeRO {
        constructor(callback) { super((...args) => { globalThis.__enPerf.resizeObserverCalls++; callback(...args); }); }
      };
    });
    const run = { sample, errors };
    try {
      let unblock;
      const gate = new Promise(r => { unblock = r; });
      if (gated) await page.route('**/*', async route => { if (route.request().resourceType() === 'script') await gate; await route.continue(); });
      const response = await page.goto(baseURL, { waitUntil: 'commit' });
      await page.getByRole('heading', { level: 1, name: 'Component sticker sheet' }).waitFor();
      await page.waitForFunction(() => document.readyState !== 'loading');
      await frames(page);
      const documentResponse = await bodyCapture.read(response);
      run.htmlSha256 = hash(documentResponse.bytes);
      run.htmlResponse = { requestId: documentResponse.requestId, url: documentResponse.url, status: documentResponse.status, bytes: documentResponse.bytes.length };
      if (run.htmlSha256 !== report.assets[0].sha256) throw new Error('Served document bytes differ from the measured build.');
      if (gated) {
        run.serverRendered = await snapshot(page);
        run.serverRendered.button = await page.locator('#actions en-button').first().getByRole('button').evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, background: getComputedStyle(el).backgroundColor }));
      }
      await page.evaluate(() => performance.mark('en-client-release'));
      unblock();
      await page.waitForFunction(() => !!customElements.get('en-sticker-app'), null, { timeout: 20000 });
      await page.locator('en-sticker-app').evaluate(async el => { await el.updateComplete; performance.mark('en-app-updated'); });
      await frames(page);
      // Let buffered paint entries arrive before the first user interaction ends LCP observation.
      await page.waitForTimeout(500);
      run.clientReady = await snapshot(page);
      if (gated) run.clientReleaseToAppUpdatedMs = await page.evaluate(() => performance.getEntriesByName('en-app-updated').at(-1).startTime - performance.getEntriesByName('en-client-release').at(-1).startTime);
      else run.navigationToObservedAppUpdatedMs = await page.evaluate(() => performance.getEntriesByName('en-app-updated').at(-1).startTime);
      run.initialHighlights = await page.evaluate(() => CSS.highlights?.size ?? null);
      await page.evaluate(() => {
        const style = document.querySelector('#en-preview-theme');
        new MutationObserver(list => { globalThis.__enPerf.themeMutations += list.length; }).observe(style, { childList: true, characterData: true, subtree: true });
        new MutationObserver(list => {
          for (const mutation of list) if (mutation.attributeName === 'data-highlighted' && mutation.target.matches('.code-disclosure')) globalThis.__enPerf.highlightReady.push({ id: mutation.target.closest('[data-specimen]').dataset.specimen, afterClickMs: performance.now() - globalThis.__enPerf.clicks.at(-1).at });
        }).observe(document.querySelector('en-sticker-app'), { attributes: true, subtree: true, attributeFilter: ['data-highlighted'] });
      });
      run.themes = [];
      for (const mode of ['dark', 'light', 'dark']) {
        await page.evaluate(() => performance.mark('en-theme-start'));
        await page.locator('.theme-controls en-segmented-control').getByText(mode === 'dark' ? 'Dark' : 'Light', { exact: true }).click();
        await page.locator('en-sticker-app').evaluate(el => el.updateComplete);
        await frames(page);
        run.themes.push(await page.evaluate(mode => ({ mode, elapsedIncludingDriverAndFramesMs: performance.now() - performance.getEntriesByName('en-theme-start').at(-1).startTime, observations: structuredClone(globalThis.__enPerf) }), mode));
      }
      run.disclosures = [];
      const disclosureIds = allDisclosures ? await page.locator('[data-specimen]:has(.code-disclosure)').evaluateAll(els => els.map(el => el.dataset.specimen)) : ['typography', 'structured-values', 'dialog-drawer'];
      for (const id of disclosureIds) {
        const disclosure = page.locator(`[data-specimen="${id}"] .code-disclosure`);
        await page.evaluate(() => performance.mark('en-code-start'));
        await disclosure.locator(':scope > summary').click();
        await disclosure.waitFor({ state: 'visible' });
        await page.waitForFunction(id => document.querySelector(`[data-specimen="${id}"] .code-disclosure`)?.dataset.highlighted === 'true', id, { timeout: 20000 });
        await frames(page);
        run.disclosures.push(await page.evaluate(id => {
          const code = document.querySelector(`[data-specimen="${id}"] .code-disclosure pre > code`);
          return { id, elapsedIncludingDriverAndFramesMs: performance.now() - performance.getEntriesByName('en-code-start').at(-1).startTime, highlights: CSS.highlights.size, actualCodeHasRanges: [...CSS.highlights.values()].some(highlight => [...highlight].some(range => code.contains(range.startContainer))), observations: structuredClone(globalThis.__enPerf) };
        }, id));
      }
      const before = await page.evaluate(() => structuredClone(globalThis.__enPerf));
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => structuredClone(globalThis.__enPerf));
      run.idleHalfSecond = { observerCallbacks: after.resizeObserverCalls - before.resizeObserverCalls, themeMutations: after.themeMutations - before.themeMutations, longtasks: after.longtasks.slice(before.longtasks.length) };
      run.end = await snapshot(page);
    } catch (e) { run.failure = String(e); }
    report.runs.push(run);
    console.log(JSON.stringify({ sample, failure: run.failure, clientReleaseToAppUpdatedMs: run.clientReleaseToAppUpdatedMs, themeMs: run.themes?.map(x => x.elapsedIncludingDriverAndFramesMs), disclosureMs: run.disclosures?.map(x => x.elapsedIncludingDriverAndFramesMs), idle: run.idleHalfSecond, errors }));
    await context.close();
  }
} finally {
  await browser.close();
  report.finalHtmlSha256 = hash(await readFile(resolve(root, 'dist/index.html')));
  report.buildChangedDuringProbe = report.finalHtmlSha256 !== report.assets[0].sha256;
  await writeFile(resolve(output, `${label}.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ label, report: resolve(output, `${label}.json`), html: report.assets[0], styles: { roots: report.styles.dsdRoots, count: report.styles.count, raw: report.styles.rawBytes, unique: report.styles.uniqueBytes }, buildChanged: report.buildChangedDuringProbe }));
}
