import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

const baseURL = process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4196/';
const evidenceDir = evidenceDirectory(import.meta.url, new URL('./results/', import.meta.url));
await fs.mkdir(evidenceDir, { recursive: true });
const artifact = await fs.readFile(new URL('../../dist/index.html', import.meta.url));
const buildFingerprint = createHash('sha256').update(artifact).digest('hex');
const countSwatches = node => Number(node.tagName === 'en-swatch') + (node.childNodes ?? []).reduce((sum, child) => sum + countSwatches(child), 0) + (node.content ? countSwatches(node.content) : 0);
const expectedSwatches = countSwatches(parse(artifact.toString()));
assert(expectedSwatches > 0, 'The built document must contain its authored swatches.');
const results = [];
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  // Chromium's headless permission policy requires an explicit clipboard grant.
  if (name === 'chromium') await context.grantPermissions(['clipboard-write'], { origin: new URL(baseURL).origin });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let release;
  const hydration = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/**', async route => { if (new URL(route.request().url()).pathname.endsWith('.js')) await hydration; await route.continue(); });
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    const swatches = page.locator('en-swatch');
    await expect(swatches).toHaveCount(expectedSwatches);
    const specimen = page.locator('[data-specimen=swatches]');
    const swatch = specimen.locator('en-swatch');
    await expect(swatch).toHaveCount(1);
    const button = swatch.getByRole('button', { name: 'Copy Action color CSS reference', exact: true });
    await expect(button).toBeVisible();
    const before = await button.elementHandle();
    assert.equal(await swatch.evaluate(el => el.constructor === HTMLElement), true);
    const ssrColor = await swatch.locator('[part=color]').evaluate(el => getComputedStyle(el).backgroundColor);
    release();
    await page.waitForFunction(() => customElements.get('en-sticker-app') && !document.querySelector('en-sticker-app').hasAttribute('data-ssr'));
    await swatch.evaluate(el => el.updateComplete);
    assert.equal(await button.evaluate((el, original) => el === original, before), true);
    assert.equal(await swatch.locator('[part=color]').evaluate(el => getComputedStyle(el).backgroundColor), ssrColor);
    await button.click();
    await expect(specimen.locator('[data-token-sample]').getByRole('status')).toHaveText('CSS reference copied.');
    const statusAfterCopy = await specimen.locator('[data-token-sample]').getByRole('status').textContent();
    await specimen.getByRole('button', { name: 'Reset Token swatches', exact: true }).click();
    await expect(specimen.locator('[data-token-sample]').getByRole('status')).toHaveText('');
    const disclosure = specimen.locator('.code-disclosure');
    await disclosure.locator(':scope > summary').click();
    await expect(disclosure).toHaveAttribute('data-highlighted', 'true');
    const source = await disclosure.locator('pre > code').evaluate(el => ({
      selectable: getComputedStyle(el).userSelect !== 'none',
      highlighted: [...CSS.highlights.values()].some(h => [...h].some(r => el.contains(r.startContainer))),
      containsMarkup: el.children.length > 0,
    }));
    assert.deepEqual(source, { selectable: true, highlighted: true, containsMarkup: false });
    await disclosure.locator(':scope > summary').click();
    const colors = [];
    const violations = [];
    for (const mode of ['Light', 'Dark']) {
      await page.locator('.theme-controls en-segmented-control').getByText(mode, { exact: true }).click();
      colors.push(await page.locator('.palette en-swatch[token="--en-color-action"] [part=color]').evaluate(el => getComputedStyle(el).backgroundColor));
      const axe = await new AxeBuilder({ page }).include('#foundations').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      violations.push(...axe.violations.map(x => ({ mode, id: x.id, targets: x.nodes.map(n => n.target) })));
    }
    assert.notEqual(colors[0], colors[1]);
    assert.deepEqual(violations, []);
    await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
    await expect(page.getByRole('navigation', { name: 'Sticker sheet sections', exact: true })).toBeVisible();
    // The native anchors are light-DOM children assigned to the navigation slot.
    await page.locator('en-navigation[label="Sticker sheet sections"]').getByRole('link', { name: 'Foundations', exact: true }).click();
    await page.locator('#foundations').screenshot({ path: new URL(`${name}-foundations.png`, evidenceDir).pathname });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#foundations').screenshot({ path: new URL(`${name}-mobile.png`, evidenceDir).pathname });
    assert.equal(await page.getByRole('link', { name: 'Progress Report', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    results.push({ engine: name, status: 'passed', buildFingerprint, swatches: expectedSwatches, ssrNativeButtonPreserved: true, statusAfterCopy, source, colors, violations, errors });
  } catch (error) {
    release();
    results.push({ engine: name, status: 'failed', buildFingerprint, error: String(error), errors });
    await page.screenshot({ path: new URL(`${name}-failure.png`, evidenceDir).pathname });
  } finally { release(); await browser.close(); }
  console.log(JSON.stringify(results.at(-1)));
}
await fs.writeFile(new URL('production.json', evidenceDir), JSON.stringify(results, null, 2) + '\n');
if (results.some(x => x.status !== 'passed')) process.exitCode = 1;
