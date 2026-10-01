import { evidenceDirectory } from '../test-pipeline/evidence-output.mjs';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const baseURL = process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4196/';
const evidenceDir = evidenceDirectory(import.meta.url, new URL('./results/', import.meta.url));
await fs.mkdir(evidenceDir, { recursive: true });
const buildFingerprint = createHash('sha256').update(await fs.readFile(new URL('../../dist/index.html', import.meta.url))).digest('hex');
const reports = [];
for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let release;
  const hydration = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/**', async route => { if (new URL(route.request().url()).pathname.endsWith('.js')) await hydration; await route.continue(); });
  const specimen = page.locator('[data-specimen=typography]');
  const metrics = () => specimen.locator('en-stack > p').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { className: node.className, size: style.fontSize, height: style.lineHeight, weight: style.fontWeight, margin: style.marginBlockStart, family: style.fontFamily };
  }));
  try {
    await page.goto(baseURL, { waitUntil: 'commit' });
    await expect(specimen.locator('en-stack > p')).toHaveCount(4);
    await expect(specimen.locator('.en-heading-large')).toHaveCSS('font-size', '32px');
    assert.equal(await page.evaluate(() => Boolean(customElements.get('en-sticker-app'))), false, 'Typography metrics must be observed before hydration.');
    const ssr = await metrics();
    assert.deepEqual(ssr.map(x => x.size), ['32px', '18px', '16px', '13px']);
    assert.ok(ssr.every(x => x.margin === '0px'));
    release();
    await page.waitForFunction(() => customElements.get('en-sticker-app') && !document.querySelector('en-sticker-app').hasAttribute('data-ssr'));
    assert.deepEqual(await metrics(), ssr);
    for (const density of ['compact', 'spacious', 'comfortable']) {
      await page.getByLabel('Density', { exact: true }).selectOption(density);
      assert.deepEqual(await metrics(), ssr);
    }
    const disclosure = specimen.locator('.code-disclosure');
    await disclosure.locator(':scope > summary').click();
    await expect(disclosure).toHaveAttribute('data-highlighted', 'true');
    assert.equal(await disclosure.locator('pre > code').evaluate(node => [...CSS.highlights.values()].some(h => [...h].some(range => node.contains(range.startContainer)))), true);
    await disclosure.locator(':scope > summary').click();
    await specimen.screenshot({ path: new URL(`${engineName}-typography.png`, evidenceDir).pathname });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await specimen.screenshot({ path: new URL(`${engineName}-mobile.png`, evidenceDir).pathname });
    // Typography is also used for overlay headings; exercise the unchanged import path.
    await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Invite to this project', exact: true })).toBeVisible();
    await expect(page.locator('en-dialog').getByRole('heading', { name: 'Invite to this project', level: 2 })).toHaveCSS('font-size', '18px');
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
    reports.push({ engine: engineName, status: 'passed', buildFingerprint, ssr, hydration: 'same typography metrics', density: 'unchanged metrics', source: 'highlighted', narrowOverflow: false, overlayHeading: 'preserved', errors });
  } catch (error) {
    release();
    reports.push({ engine: engineName, status: 'failed', buildFingerprint, error: String(error), errors });
  } finally { release(); await browser.close(); }
  console.log(JSON.stringify(reports.at(-1)));
}
await fs.writeFile(new URL('production.json', evidenceDir), JSON.stringify(reports, null, 2) + '\n');
if (reports.some(x => x.status !== 'passed')) process.exitCode = 1;
