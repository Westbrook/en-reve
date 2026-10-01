import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const baseURL = process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4196/';
const results = [];
for (const [engine, browserType] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await browserType.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(baseURL);
    await page.waitForFunction(() => document.querySelector('en-sticker-app')?.hasUpdated);
    const specimen = page.locator('[data-specimen="swatches"]');
    const group = specimen.getByRole('group', { name: 'Action color', exact: true });
    const swatch = group.locator('en-swatch');
    const button = swatch.getByRole('button', { name: 'Copy Action color CSS reference', exact: true });
    const status = group.getByRole('status');
    const code = group.locator('.token-sample-reference');
    await expect(button).toBeVisible();
    await expect(code).toHaveText('var(--en-color-action)');
    const geometry = await swatch.evaluate(host => {
      const native = host.shadowRoot.querySelector('button');
      return { host: host.getBoundingClientRect().toJSON(), button: native.getBoundingClientRect().toJSON() };
    });
    assert.equal(geometry.host.height, geometry.button.height);
    assert.equal(geometry.host.width, geometry.button.width);
    if (engine === 'chromium') await context.grantPermissions(['clipboard-write']);
    await page.evaluate(() => {
      window.copyCalls = [];
      const native = navigator.clipboard.writeText.bind(navigator.clipboard);
      Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value(text) {
        window.copyCalls.push({ text, active: navigator.userActivation.isActive });
        return native(text);
      } });
    });
    for (const method of ['pointer', 'Enter', 'Space']) {
      if (method === 'pointer') await button.click();
      else { await button.focus(); await button.press(method); }
      await expect(status).toHaveText('CSS reference copied.');
      await expect(button).toHaveAccessibleName('Copy Action color CSS reference');
      if (method !== 'pointer') await expect(button).toBeFocused();
    }
    const nativeCopies = await page.evaluate(() => window.copyCalls);
    assert.deepEqual(nativeCopies, Array.from({ length: 3 }, () => ({ text: 'var(--en-color-action)', active: true })));
    if (engine === 'chromium') {
      await context.grantPermissions(['clipboard-write', 'clipboard-read']);
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'var(--en-color-action)');
    }
    // Even a later ancestor's action veto must precede the consumer's clipboard effect.
    await group.evaluate(element => element.addEventListener('en-action', event => event.preventDefault(), { once: true }));
    await button.press('Enter');
    assert.equal(await page.evaluate(() => window.copyCalls.length), 3);
    await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value() { return Promise.reject(new DOMException('Denied', 'NotAllowedError')); } }));
    await button.press('Enter');
    await expect(status).toHaveText('Could not copy. Select and copy the CSS reference.');
    await code.scrollIntoViewIfNeeded();
    const box = await code.evaluate(element => { const range = new Range(); range.selectNodeContents(element); return range.getBoundingClientRect().toJSON(); });
    await page.mouse.move(box.x - 1, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width + 1, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
    assert.ok((await page.evaluate(() => getSelection().toString())).includes('var(--en-color-action)'));
    await page.evaluate(() => {
      getSelection().removeAllRanges(); window.pendingCopies = [];
      Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value() {
        return new Promise(resolve => window.pendingCopies.push(resolve));
      } });
    });
    await button.focus(); await button.press('Enter'); await button.press('Enter');
    assert.equal(await page.evaluate(() => window.pendingCopies.length), 1);
    await expect(group).toHaveAttribute('aria-busy', 'true');
    await page.getByRole('button', { name: 'Reset Token swatches', exact: true }).click();
    await page.evaluate(() => window.pendingCopies[0]());
    await expect(status).toBeEmpty();
    await expect(group).not.toHaveAttribute('aria-busy');
    await button.focus(); await button.press('Enter');
    await swatch.evaluate(host => { host.token = '--en-color-danger-text'; });
    await page.evaluate(() => window.pendingCopies[1]());
    await expect(group).toHaveAttribute('data-copy-state', 'idle');
    await expect(status).toBeEmpty();
    await page.getByRole('button', { name: 'Reset Token swatches', exact: true }).click();

    const colorSpecimen = page.locator('[data-specimen="color-field"]');
    const color = colorSpecimen.getByLabel('Project accent color', { exact: true });
    const trigger = colorSpecimen.getByRole('button', { name: 'Choose project accent color', exact: true });
    await color.evaluate(input => {
      window.pickerAttempts = [];
      Object.defineProperty(input, 'showPicker', { configurable: true, value() { window.pickerAttempts.push(navigator.userActivation.isActive); } });
    });
    for (const method of ['pointer', 'Enter', 'Space']) {
      if (method === 'pointer') await trigger.click();
      else { await trigger.focus(); await trigger.press(method); }
    }
    assert.deepEqual(await page.evaluate(() => window.pickerAttempts), [true, true, true]);
    await expect(color).toBeVisible();
    await expect(color).toHaveValue('#2457d6');
    // Native input editing exercises the value adapter, not an OS picker interaction.
    await color.fill('#7c3aed');
    await expect(colorSpecimen.locator('output')).toHaveText('#7c3aed');
    assert.equal(await colorSpecimen.locator('en-swatch').evaluate(host => host.color), '#7c3aed');
    await colorSpecimen.locator('en-color-field').evaluate(field => field.addEventListener('en-change', event => event.preventDefault()));
    await color.fill('#aabbcc');
    await expect(colorSpecimen.locator('output')).toHaveText('#7c3aed');
    await page.getByRole('button', { name: 'Reset Color selection', exact: true }).click();
    await expect(color).toHaveValue('#2457d6');
    assert.equal(await colorSpecimen.locator('en-swatch').evaluate(host => host.color), '#2457d6');
    for (const sample of [specimen, colorSpecimen]) {
      await sample.locator('.code-disclosure').getByRole('button').click();
      await expect(sample.locator('.code-disclosure')).toHaveAttribute('data-highlighted', 'true');
      const source = sample.locator('pre > code');
      await expect(source).toBeVisible();
      assert.ok(await source.evaluate(element => [...CSS.highlights.values()].some(highlight => [...highlight].some(range => element.contains(range.startContainer)))));
      await sample.locator('.code-disclosure').getByRole('button').click();
    }
    const violations = [];
    for (const mode of ['Light', 'Dark']) {
      await page.locator('en-segmented-control').getByText(mode, { exact: true }).click();
      const scan = await new AxeBuilder({ page }).include('#foundations').include('[data-specimen="color-field"]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      violations.push(...scan.violations.map(item => ({ mode, id: item.id, targets: item.nodes.map(node => node.target) })));
    }
    await page.getByLabel('Direction', { exact: true }).selectOption('rtl');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await expect(button).toBeVisible(); await expect(trigger).toBeVisible();
    assert.deepEqual(errors, []); assert.deepEqual(violations, []);
    results.push({ engine, status: 'passed', nativeCopies, geometry, violations, errors, pickerScope: 'Trusted activation to instrumented native method; real native input value edits separately. OS picker display/selection not verified.' });
  } catch (error) {
    results.push({ engine, status: 'failed', error: String(error), errors });
  } finally { await browser.close(); }
  console.log(JSON.stringify(results.at(-1)));
}
await fs.mkdir(new URL('./evidence/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('./evidence/swatch-consumption.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
if (results.some(result => result.status !== 'passed')) process.exitCode = 1;
