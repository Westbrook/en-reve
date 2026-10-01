import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS } from '../../../../tokens/dist/index.js';

const fixture = '/packages/elements/src/internal/tests/control-rhythm-fixture.html';
const ids = ['button', 'text', 'select', 'color', 'number', 'date', 'search', 'segmented'];
const part = (id: string) => id === 'number' ? 'stepper' : id === 'segmented' ? 'options' : 'control';

test.beforeEach(async ({ page }) => {
  await page.goto(fixture);
  await page.waitForFunction(() => typeof (window as any).configureControlRhythm === 'function');
});

for (const coarse of [false, true]) test.describe(coarse ? 'coarse family geometry' : 'fine family geometry', () => {
  test.use({ hasTouch: coarse });
  test('segmented frame pins stay local and preserve actual option targets', async ({ page }) => {
    for (const size of ['absent', 'small', 'large']) {
      const configure = (inset?: number) => page.evaluate(options => (window as any).configureControlRhythm(options), {
        density: 'compact', rhythm: .25, size,
        pins: inset === undefined ? {} : { 'component.segmented-control.frame-inset': { value: inset, unit: 'px' } },
      });
      await configure();
      const height = (id: string) => page.locator(`#${id} [part~="${part(id)}"]`).evaluate(node => node.getBoundingClientRect().height);
      const ordinary = ids.filter(id => id !== 'segmented');
      const baseline = await Promise.all(ordinary.map(height));
      for (const inset of [0, 2, 12]) {
        await configure(inset);
        expect(await Promise.all(ordinary.map(height))).toEqual(baseline);
        const segmentedHeight = await height('segmented');
        expect(segmentedHeight).toBeGreaterThanOrEqual(baseline[0]!);
        if (inset === 12) expect(segmentedHeight).toBeGreaterThan(baseline[0]!);
        const frame = page.locator('#segmented [part~="options"]');
        await expect(frame).toHaveCSS('padding', `${inset}px`);
        const outerRadius = await frame.evaluate(node => parseFloat(getComputedStyle(node).borderTopLeftRadius));
        for (const option of await page.locator('#segmented [part~="option"]').all()) {
          const rect = await option.boundingBox();
          expect(rect!.height).toBeGreaterThanOrEqual(coarse ? 44 : 24);
          expect(rect!.width).toBeGreaterThanOrEqual(24);
          const radius = await option.evaluate(node => parseFloat(getComputedStyle(node).borderTopLeftRadius));
          expect(radius).toBeCloseTo(Math.max(0, outerRadius - inset - 1), 3);
        }
        if (size === 'absent') await expect(page.locator('#text')).not.toHaveAttribute('size');
      }
    }
  });
});

test('family refinements override shared defaults and preserve specialized controls and invalid text position', async ({ page }) => {
  await page.evaluate(options => (window as any).configureControlRhythm(options), {
    density: 'comfortable', rhythm: .25, size: 'absent',
    pins: { 'component.button.inline-padding': { value: 24, unit: 'px' }, 'component.input.inline-padding': { value: 4, unit: 'px' } },
  });
  await expect(page.locator('#button [part~="control"]')).toHaveCSS('padding-left', '24px');
  for (const id of ['text', 'select', 'number', 'date', 'search']) await expect(page.locator(`#${id} [part~="control"]`)).toHaveCSS('padding-left', '4px');
  for (const name of ['decrement', 'increment']) await expect(page.locator(`#number [part~="${name}"]`)).toHaveCSS('padding-left', '6px');
  await expect(page.locator('#color [part~="control"]')).toHaveCSS('padding-left', '6px');
  const text = page.locator('#text [part~="control"]');
  await text.fill('A stable draft');
  const content = () => text.evaluate(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return { x: rect.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft), y: rect.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop), width: rect.width, height: rect.height };
  });
  const before = await content();
  await page.locator('#text').evaluate(async (host: any) => { host.error = 'Check this value'; await host.updateComplete; });
  await expect(text).toHaveCSS('border-left-width', '2px');
  await expect(text).toHaveCSS('padding-left', '3px');
  expect(await content()).toEqual(before);
  await expect(text).toHaveValue('A stable draft');
  await page.locator('#controls').evaluate(node => (node as HTMLElement).style.setProperty('--en-control-inline-padding', '17px'));
  await expect(page.locator('#button [part~="control"]')).toHaveCSS('padding-left', '24px');
  await expect(text).toHaveCSS('padding-left', '3px');
  await expect(page.locator('#select [part~="control"]')).toHaveCSS('padding-left', '4px');
  await expect(page.locator('#number [part~="decrement"]')).toHaveCSS('padding-left', '6px');
});

test('full scoped rebases clear family pins and partial scopes retain other pins', async ({ page }) => {
  await page.evaluate(options => (window as any).configureControlRhythm(options), {
    density: 'comfortable', rhythm: .25, size: 'absent',
    pins: { 'component.button.inline-padding': { value: 24, unit: 'px' }, 'component.input.inline-padding': { value: 4, unit: 'px' }, 'component.segmented-control.frame-inset': { value: 12, unit: 'px' } },
  });
  const pinnedTextHeight = await page.locator('#text [part~="control"]').evaluate(node => node.getBoundingClientRect().height);
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme(), { selector: ':where(#text)' }) });
  await expect(page.locator('#text [part~="control"]')).toHaveCSS('padding-left', '12px');
  expect(await page.locator('#text [part~="control"]').evaluate(node => node.getBoundingClientRect().height)).toBe(pinnedTextHeight);
  await expect(page.locator('#select [part~="control"]')).toHaveCSS('padding-left', '4px');
  const partial = resolveTheme({ pins: { 'component.input.inline-padding': { value: 8, unit: 'px' } } });
  await page.addStyleTag({ content: emitThemeCSS(partial, { kind: 'partial', tokenIds: ['component.input.inline-padding'], selector: ':where(#select)' }) });
  await expect(page.locator('#select [part~="control"]')).toHaveCSS('padding-left', '8px');
  expect(await page.locator('#select [part~="control"]').evaluate(node => node.getBoundingClientRect().height)).toBe(pinnedTextHeight);
  await page.locator('#segmented').evaluate(node => (node as HTMLElement).style.setProperty('--en-segmented-control-frame-inset', '20px'));
  expect(await page.locator('#select [part~="control"]').evaluate(node => node.getBoundingClientRect().height)).toBe(pinnedTextHeight);
  expect(await page.locator('#segmented [part~="options"]').evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(pinnedTextHeight);
});
