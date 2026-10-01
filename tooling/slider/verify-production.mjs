import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

const baseURL = process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4196/';
const evidenceDir = evidenceDirectory(import.meta.url, new URL('./results/', import.meta.url));
const artifactPath = new URL('../../dist/index.html', import.meta.url);
const artifact = await fs.readFile(artifactPath);
const digest = value => createHash('sha256').update(value).digest('hex');
const buildFingerprint = digest(artifact);
const specimenSelector = '[data-specimen="opacity"]';
const results = [];
await fs.mkdir(evidenceDir, { recursive: true });

function controls(page) {
  const specimen = page.locator(specimenSelector);
  const slider = specimen.locator('en-slider');
  return {
    specimen,
    slider,
    range: slider.locator('input[type="range"][part~="control"]'),
    editor: slider.locator('input[type="number"][part~="editor"]'),
    sample: specimen.locator('.opacity-sample'),
  };
}

async function assertInitial(view) {
  await expect(view.slider).toHaveAttribute('editable', '');
  await expect(view.range).toBeVisible();
  await expect(view.editor).toBeVisible();
  await expect(view.range).toHaveAccessibleName('Layer opacity');
  await expect(view.editor).toHaveAccessibleName('Layer opacity Exact value');
  for (const control of [view.range, view.editor]) {
    await expect(control).toHaveValue('64');
    await expect(control).toHaveAttribute('min', '0');
    await expect(control).toHaveAttribute('max', '100');
    await expect(control).toHaveAttribute('step', '1');
  }
  await expect(view.slider.locator('[part~="output"]')).toHaveCount(0);
  await expect(view.sample).toHaveCSS('opacity', '0.64');
}

async function assertAccepted(view, value, draft = String(value)) {
  await expect(view.slider).toHaveJSProperty('value', value);
  await expect(view.range).toHaveValue(String(value));
  await expect(view.editor).toHaveValue(draft);
  await expect(view.sample).toHaveCSS('opacity', String(value / 100));
}

async function eventCounts(page) {
  return page.evaluate(() => ({
    requests: window.__enSliderProduction.requests.length,
    changes: window.__enSliderProduction.changes.length,
  }));
}

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  let browser;
  let page;
  let phase = 'launch';
  let release = () => {};
  const errors = [];
  const record = { engine: name, buildFingerprint, status: 'running' };
  try {
    browser = await engine.launch();
    record.browserVersion = browser.version();

    phase = 'JavaScript-disabled initial HTML';
    const noScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const noScriptPage = await noScriptContext.newPage();
    noScriptPage.setDefaultTimeout(10_000);
    const noScriptResponse = await noScriptPage.goto(baseURL, { waitUntil: 'domcontentloaded' });
    assert(noScriptResponse?.ok(), 'The production document must load successfully.');
    // A large document can be evicted from the browser inspector cache while its assets load.
    // Fetch the same immutable production URL through the context request client.
    const served = await noScriptContext.request.get(baseURL);
    assert(served.ok());
    record.servedFingerprint = digest(await served.body());
    record.documentBodySource = 'Independent HTTP response for the same production navigation URL';
    assert.equal(record.servedFingerprint, buildFingerprint, 'The served document must match the recorded dist/index.html.');
    await assertInitial(controls(noScriptPage));
    record.javaScriptDisabled = { bothNativeControlsVisible: true, labelsAndDefaults: true };
    await noScriptContext.close();

    phase = 'deferred hydration';
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page = await context.newPage();
    page.setDefaultTimeout(10_000);
    page.on('pageerror', error => errors.push(error.message));
    let openGate;
    const gate = new Promise(resolve => { openGate = resolve; });
    release = openGate;
    const blockedScripts = new Set();
    await page.route('**/assets/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('.js')) {
        blockedScripts.add(route.request().url());
        await gate;
      }
      await route.continue();
    });
    await page.goto(baseURL, { waitUntil: 'commit' });
    const view = controls(page);
    await assertInitial(view);
    assert.equal(await page.evaluate(() => Boolean(customElements.get('en-slider'))), false, 'Inspect actual SSR before the component definition loads.');
    const originalEditor = await view.editor.elementHandle();
    const originalRange = await view.range.elementHandle();
    await view.slider.evaluate(host => {
      window.__enSliderProduction = { requests: [], changes: [], canceled: 0 };
      host.addEventListener('en-change', event => {
        const detail = { previous: event.detail.previous, proposed: event.detail.proposed, reason: event.detail.reason };
        window.__enSliderProduction.requests.push(detail);
        queueMicrotask(() => {
          if (!event.defaultPrevented && host.value === detail.proposed) window.__enSliderProduction.changes.push(detail);
        });
      });
    });
    await view.editor.fill('73');
    await expect(view.range).toHaveValue('64');
    release();
    await page.waitForFunction(() => {
      const app = document.querySelector('en-sticker-app');
      return customElements.get('en-sticker-app') && app?.hasUpdated && !app.hasAttribute('data-ssr');
    });
    await view.slider.evaluate(host => host.updateComplete);
    assert(blockedScripts.size > 0, 'At least one production script must have been deferred.');
    assert.equal(await view.editor.evaluate((node, original) => node === original, originalEditor), true);
    assert.equal(await view.range.evaluate((node, original) => node === original, originalRange), true);
    assert.equal(await view.editor.evaluate(node => node.getRootNode().activeElement === node), true, 'Hydration must preserve focus in the number editor.');
    await assertAccepted(view, 64, '73');
    assert.deepEqual(await eventCounts(page), { requests: 0, changes: 0 }, 'Adopting an unfinished native draft must not propose or commit a numeric value.');
    record.hydration = { editorIdentity: true, rangeIdentity: true, editorFocus: true, draft: '73', acceptedValue: 64, draftUncommitted: true };

    phase = 'Enter accepts an exact value';
    await view.editor.press('Enter');
    await assertAccepted(view, 73);
    assert.deepEqual(await eventCounts(page), { requests: 1, changes: 1 });

    phase = 'invalid draft and Escape';
    await view.editor.fill('101');
    await view.editor.press('Enter');
    await assertAccepted(view, 73, '101');
    assert.equal(await view.editor.evaluate(node => node.validity.rangeOverflow), true);
    assert.equal((await eventCounts(page)).changes, 1);
    await view.editor.press('Escape');
    await assertAccepted(view, 73);
    assert.equal(await view.editor.evaluate(node => node.validity.valid), true);

    phase = 'canceled request and explicit author reconciliation';
    await view.slider.evaluate(host => host.addEventListener('en-change', event => {
      event.preventDefault();
      window.__enSliderProduction.canceled++;
    }, { once: true }));
    await view.editor.fill('82');
    await view.editor.press('Enter');
    await assertAccepted(view, 73, '82');
    assert.equal(await page.evaluate(() => window.__enSliderProduction.canceled), 1);
    assert.equal((await eventCounts(page)).changes, 1);
    await view.slider.evaluate(host => { host.value = host.value; });
    await assertAccepted(view, 73);
    assert.equal((await eventCounts(page)).changes, 1, 'An application write must not fabricate a user commit.');

    phase = 'blur commits once and range reconciles the editor';
    const beforeBlur = await eventCounts(page);
    await view.editor.fill('68');
    await view.editor.press('Tab');
    await assertAccepted(view, 68);
    assert.equal((await eventCounts(page)).changes, beforeBlur.changes + 1, 'Native change and blur must not duplicate the accepted commit.');
    await view.range.focus();
    await view.range.press('ArrowRight');
    await assertAccepted(view, 69);
    record.editing = { enter: true, invalidDraftRetained: true, escapeRestores: true, cancellationRetainsDraft: true, sameValueAuthorWriteReconciles: true, blurCommitsOnce: true, rangeReconcilesEditor: true };
    record.events = await page.evaluate(() => window.__enSliderProduction);

    phase = 'specimen Reset';
    await view.editor.fill('101');
    await view.specimen.getByRole('button', { name: 'Reset Continuous adjustment', exact: true }).click();
    await assertAccepted(view, 64);
    assert.equal(await originalEditor.evaluate(node => node.isConnected), false, 'The specimen reset replaces its example instance.');
    record.reset = { acceptedValue: 64, nativeDraft: '64', previewOpacity: 0.64 };

    phase = 'selectable highlighted source';
    const disclosure = view.specimen.locator('.code-disclosure');
    await disclosure.locator(':scope > summary').click();
    await expect(disclosure).toHaveAttribute('data-highlighted', 'true');
    record.source = await disclosure.locator('pre > code').evaluate(node => ({
      selectable: getComputedStyle(node).userSelect !== 'none',
      highlighted: [...CSS.highlights.values()].some(highlight => [...highlight].some(range => node.contains(range.startContainer))),
      containsMarkup: node.children.length > 0,
    }));
    assert.deepEqual(record.source, { selectable: true, highlighted: true, containsMarkup: false });
    await disclosure.locator(':scope > summary').click();

    phase = 'responsive, RTL and shared size geometry';
    record.geometry = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const direction of ['ltr', 'rtl']) {
        for (const size of ['small', 'medium', 'large']) {
          await view.slider.evaluate(async (host, options) => {
            host.dir = options.direction;
            host.setAttribute('size', options.size);
            await host.updateComplete;
          }, { direction, size });
          const geometry = await view.slider.evaluate(host => {
            const rectangle = node => {
              const box = node.getBoundingClientRect();
              return { left: box.left, right: box.right, width: box.width, height: box.height };
            };
            const range = host.shadowRoot.querySelector('input[type="range"]');
            const editor = host.shadowRoot.querySelector('input[type="number"]');
            return {
              host: rectangle(host), range: rectangle(range), editor: rectangle(editor),
              direction: getComputedStyle(editor).direction,
              pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            };
          });
          assert.equal(geometry.direction, direction);
          assert.equal(geometry.pageOverflow, false, `Page overflow at ${width}px, ${direction}, ${size}.`);
          for (const [part, box] of Object.entries({ range: geometry.range, editor: geometry.editor })) {
            assert(box.width > 0 && box.height > 0, `${part} must retain visible geometry.`);
            assert(box.left >= geometry.host.left - 1 && box.right <= geometry.host.right + 1, `${part} must fit the slider at ${width}px, ${direction}, ${size}.`);
          }
          record.geometry.push({ width, direction, size, ...geometry });
        }
      }
    }
    await view.specimen.screenshot({ path: new URL(`${name}-mobile-rtl-large.png`, evidenceDir).pathname });
    await view.slider.evaluate(async host => { host.removeAttribute('dir'); host.removeAttribute('size'); await host.updateComplete; });
    await page.setViewportSize({ width: 1440, height: 1000 });

    phase = 'focused accessibility scan';
    record.violations = [];
    for (const mode of ['Light', 'Dark']) {
      await page.locator('.theme-controls en-segmented-control').getByText(mode, { exact: true }).click();
      const axe = await new AxeBuilder({ page }).include(specimenSelector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      record.violations.push(...axe.violations.map(violation => ({ mode, id: violation.id, targets: violation.nodes.map(node => node.target) })));
    }
    assert.deepEqual(record.violations, []);
    await view.specimen.screenshot({ path: new URL(`${name}-desktop-dark.png`, evidenceDir).pathname });
    assert.deepEqual(errors, []);
    record.status = 'passed';
  } catch (error) {
    record.status = 'failed';
    record.phase = phase;
    record.error = String(error);
    release();
    if (page) {
      try { await page.screenshot({ path: new URL(`${name}-failure.png`, evidenceDir).pathname, timeout: 5000 }); }
      catch (screenshotError) { record.screenshotError = String(screenshotError); }
    }
  } finally {
    release();
    record.errors = errors;
    if (browser) await browser.close();
    results.push(record);
    console.log(JSON.stringify(record));
  }
}

const finalFingerprint = digest(await fs.readFile(artifactPath));
const report = {
  checkedAt: new Date().toISOString(), baseURL,
  artifact: { path: 'dist/index.html', sha256: buildFingerprint, bytes: artifact.length, unchangedAfterRun: finalFingerprint === buildFingerprint },
  scope: 'Focused production opacity specimen in three Playwright engines: native SSR, deferred hydration, exact numeric editing, composition with range/preview, reset, source highlighting, geometry and axe. No complete-library, retail browser-matrix, physical IME or manual assistive-technology acceptance claim.',
  results,
};
await fs.writeFile(new URL('production.json', evidenceDir), JSON.stringify(report, null, 2) + '\n');
if (finalFingerprint !== buildFingerprint || results.some(result => result.status !== 'passed')) process.exitCode = 1;
