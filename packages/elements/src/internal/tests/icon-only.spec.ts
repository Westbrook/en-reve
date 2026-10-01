import { test, expect, type Page } from '@playwright/test';
import { resolveTheme, emitThemeCSS } from '../../../../tokens/dist/index.js';

const fixture = '/packages/elements/src/button/content-fixture.html';

async function mount(page: Page) {
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(async () => {
    const scope = document.createElement('en-card');
    scope.id = 'icon-scope';
    scope.setAttribute('size', 'large');
    scope.innerHTML = `<en-button id="text-reference">Add collaborator</en-button>
      <en-button id="icon-action" icon-only variant="secondary">
        <en-icon slot="prefix" name="plus" size="inherit"></en-icon>
        <span slot="label">Add collaborator</span>
      </en-button>`;
    document.body.append(scope);
    const host = document.querySelector('#icon-action') as any;
    await Promise.all([...scope.querySelectorAll('*')].map((node: any) => node.updateComplete));
    const control = host.shadowRoot.querySelector('button');
    (window as any).iconIdentity = {
      control, label: host.shadowRoot.querySelector('[part="label"]'),
      icon: host.querySelector('en-icon'),
    };
    let count = 0;
    host.addEventListener('click', () => { host.dataset.activations = String(++count); });
  });
}

async function geometry(page: Page) {
  return page.locator('#icon-action').evaluate((host: any) => {
    const control = host.shadowRoot.querySelector('button') as HTMLElement;
    const glyph = host.loading ? control.querySelector('[part="indicator"]')! : host.querySelector('en-icon');
    const rect = control.getBoundingClientRect(), glyphRect = glyph.getBoundingClientRect();
    const reference = document.querySelector('#text-reference')!.shadowRoot!.querySelector('button')!.getBoundingClientRect();
    return {
      width: rect.width, height: rect.height, reference: reference.height,
      glyphWidth: glyphRect.width, glyphHeight: glyphRect.height,
      fits: glyphRect.left >= rect.left && glyphRect.right <= rect.right && glyphRect.top >= rect.top && glyphRect.bottom <= rect.bottom,
      size: host.size, attribute: host.getAttribute('size'),
    };
  });
}

for (const coarse of [false, true]) test.describe(coarse ? 'coarse icon action' : 'fine icon action', () => {
  test.use({ hasTouch: coarse, viewport: { width: 1000, height: 1000 } });

  test('squares share text-control height across size, density and large inline pins', async ({ page }, info) => {
    await mount(page);
    const themeStyle = await page.addStyleTag({ content: ':root {}' });
    const measurements: unknown[] = [];
    for (const density of ['compact', 'comfortable', 'spacious'] as const) {
      const theme = resolveTheme({ density, pins: {
        'component.button.inline-padding': { value: 48, unit: 'px' },
        'component.button.radius': '{radius.pill}',
      } });
      await themeStyle.evaluate((node, css) => { node.textContent = css; }, emitThemeCSS(theme, { scope: 'root' }));
      let medium = 0;
      let large = 0;
      for (const size of ['absent', 'small', 'medium', 'large', 'inherit']) {
        await page.locator('#icon-scope').evaluate(async (scope, size) => {
          for (const id of ['text-reference', 'icon-action']) {
            const host = scope.querySelector(`#${id}`) as any;
            if (size === 'absent') host.removeAttribute('size'); else host.size = size;
            await host.updateComplete;
          }
        }, size);
        const measured = await geometry(page);
        expect(Math.abs(measured.width - measured.height)).toBeLessThanOrEqual(.1);
        expect(Math.abs(measured.height - measured.reference)).toBeLessThanOrEqual(.1);
        expect(measured.width).toBeGreaterThanOrEqual(coarse ? 44 : 24);
        expect(measured.height).toBeGreaterThanOrEqual(coarse ? 44 : 24);
        expect(measured.fits).toBe(true);
        expect(measured.size).toBe(size === 'absent' ? 'medium' : size);
        expect(measured.attribute).toBe(size === 'absent' ? null : size);
        if (size === 'absent') medium = measured.height;
        if (size === 'medium') expect(measured.height).toBe(medium);
        if (size === 'large') large = measured.height;
        if (size === 'inherit') expect(measured.height).toBe(large);
        measurements.push({ density, size, ...measured });
      }
    }
    await expect(page.locator('#text-reference [part="control"]')).toHaveCSS('padding-left', '48px');
    await info.attach('icon-only-geometry', { body: JSON.stringify(measurements), contentType: 'application/json' });
  });

  test('enlarged text and an oversized square icon grow without clipping', async ({ page }) => {
    await mount(page);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const enlarged = await geometry(page);
    expect(Math.abs(enlarged.width - enlarged.height)).toBeLessThanOrEqual(.1);
    expect(enlarged.fits).toBe(true);
    await page.locator('#icon-action en-icon').evaluate(node => (node as HTMLElement).style.setProperty('--en-icon-size', '120px'));
    const oversized = await geometry(page);
    expect(oversized.width).toBeGreaterThan(enlarged.width);
    expect(Math.abs(oversized.width - oversized.height)).toBeLessThanOrEqual(.1);
    expect(oversized.glyphWidth).toBe(120);
    expect(oversized.fits).toBe(true);
    await page.locator('#icon-action').evaluate(node => (node as HTMLElement).style.setProperty('--en-control-min-size', '160px'));
    const customFloor = await geometry(page);
    expect(customFloor.width).toBeGreaterThanOrEqual(160);
    expect(Math.abs(customFloor.width - customFloor.height)).toBeLessThanOrEqual(.1);
  });
});

test('mode/loading retain native nodes, full name, popup semantics and ordinary keyboard activation', async ({ page }) => {
  await mount(page);
  const host = page.locator('#icon-action');
  const action = host.getByRole('button', { name: 'Add collaborator', exact: true });
  await host.evaluate(async (node: any) => { node.setAttribute('aria-haspopup', 'dialog'); node.setAttribute('aria-expanded', 'false'); await node.updateComplete; });
  await expect(action).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(action).toHaveAttribute('aria-expanded', 'false');
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(host).toHaveAttribute('data-activations', '1');
  await page.keyboard.press('Space');
  await expect(host).toHaveAttribute('data-activations', '2');
  const beforeBusy = await geometry(page);
  await host.evaluate(async (node: any) => { node.loading = true; await node.updateComplete; });
  await expect(action).toBeDisabled();
  await expect(action).toHaveAccessibleName('Add collaborator');
  await expect(action).toHaveAttribute('aria-busy', 'true');
  await expect(host.locator('en-icon svg')).toBeHidden();
  await expect(action.locator('[part="indicator"]')).toBeVisible();
  const busy = await geometry(page);
  expect(busy.width).toBe(beforeBusy.width);
  expect(busy.height).toBe(beforeBusy.height);
  expect(busy.fits).toBe(true);
  await action.evaluate((node: HTMLButtonElement) => node.click());
  await expect(host).toHaveAttribute('data-activations', '2');
  await host.evaluate(async (node: any) => { node.loading = false; node.iconOnly = false; await node.updateComplete; });
  await expect(host).not.toHaveAttribute('icon-only');
  await expect(action).toBeEnabled();
  await expect(host.locator('en-icon svg')).toBeVisible();
  const identity = await host.evaluate((node: any) => {
    const before = (window as any).iconIdentity;
    return { control: node.shadowRoot.querySelector('button') === before.control,
      label: node.shadowRoot.querySelector('[part="label"]') === before.label,
      icon: node.querySelector('en-icon') === before.icon,
      labelPosition: getComputedStyle(before.label).position };
  });
  expect(identity).toEqual({ control: true, label: true, icon: true, labelPosition: 'static' });
  await host.evaluate(async (node: any) => {
    node.querySelector('[slot="label"]').remove();
    node.append('Add layer');
    node.iconOnly = true;
    node.disabled = true;
    await node.updateComplete;
  });
  const fallback = host.getByRole('button', { name: 'Add layer', exact: true });
  await expect(fallback).toBeDisabled();
  await fallback.evaluate((node: HTMLButtonElement) => node.click());
  await expect(host).toHaveAttribute('data-activations', '2');
});
