import { test, expect } from '@playwright/test';

const fixture = '/packages/elements/src/internal/tests/control-rhythm-fixture.html';
for (const coarse of [false, true]) test.describe(coarse ? 'coarse control rhythm' : 'fine control rhythm', () => {
  test.use({ hasTouch: coarse, viewport: { width: 1000, height: 1000 } });
  for (const density of ['compact', 'comfortable', 'spacious']) test(`${density} keeps real single-line controls aligned`, async ({ page }, info) => {
    await page.goto(fixture);
    await page.waitForFunction(() => typeof (window as any).configureControlRhythm === 'function');
    const measurements: unknown[] = [];
    for (const rhythm of [0.25, 0.5]) {
      let mediumHeight = 0;
      for (const size of ['absent', 'small', 'medium', 'large']) await test.step(`${rhythm}rem / ${size}`, async () => {
        await page.evaluate(options => (window as any).configureControlRhythm(options), { density, rhythm, size });
        const geometry = await page.evaluate(() => {
          const samples = ['button', 'text', 'select', 'color', 'number', 'date', 'search', 'segmented'];
          const controls = samples.map(id => {
            const host = document.getElementById(id) as any;
            const part = id === 'number' ? 'stepper' : id === 'segmented' ? 'options' : 'control';
            const node = host.shadowRoot.querySelector(`[part~="${part}"]`) as HTMLElement;
            return { id, height: node.getBoundingClientRect().height, size: host.size, attribute: host.getAttribute('size') };
          });
          const root = document.getElementById('segmented')!.shadowRoot!;
          const options = [...root.querySelectorAll<HTMLElement>('[part~="option"]')].map(node => node.getBoundingClientRect());
          return { controls, rows: new Set(options.map(rect => Math.round(rect.top * 100))).size,
            optionHeights: options.map(rect => rect.height), optionWidths: options.map(rect => rect.width) };
        });
        const reference = geometry.controls.find(control => control.id === 'text')!.height;
        expect(geometry.rows).toBe(1);
        for (const control of geometry.controls) {
          expect(Math.abs(control.height - reference), `${control.id} height`).toBeLessThanOrEqual(0.1);
          expect(control.size).toBe(size === 'absent' ? 'medium' : size);
          expect(control.attribute).toBe(size === 'absent' ? null : size);
        }
        for (const height of geometry.optionHeights) expect(height).toBeGreaterThanOrEqual(coarse ? 44 : 24);
        for (const width of geometry.optionWidths) expect(width).toBeGreaterThanOrEqual(24);
        if (size === 'absent') mediumHeight = reference;
        if (size === 'medium') expect(reference).toBe(mediumHeight);
        measurements.push({ rhythm, size, geometry });
      });
    }
    await page.locator('#controls').evaluate(node => (node as HTMLElement).style.setProperty('--en-control-min-size', '80px'));
    for (const id of ['button', 'text', 'select', 'color', 'number', 'date', 'search', 'segmented']) {
      const height = await page.locator(`#${id}`).evaluate((host, id) => {
        const part = id === 'number' ? 'stepper' : id === 'segmented' ? 'options' : 'control';
        return host.shadowRoot!.querySelector(`[part~="${part}"]`)!.getBoundingClientRect().height;
      }, id);
      expect(height, `${id} shared minimum override`).toBe(80);
    }
    await page.getByLabel('Review date', { exact: true }).fill('2027-06-15');
    await expect(page.locator('#date')).toHaveJSProperty('value', '2027-06-15');
    await info.attach('rhythm-geometry', { body: JSON.stringify(measurements), contentType: 'application/json' });
  });

  test('wrapped choices grow and keep native targets, keyboard and frame activation', async ({ page }) => {
    await page.goto(fixture);
    await page.waitForFunction(() => typeof (window as any).configureControlRhythm === 'function');
    await page.evaluate(options => (window as any).configureControlRhythm(options), { density: 'comfortable', rhythm: 0.5, size: 'medium' });
    const singleHeight = await page.locator('#segmented').evaluate(host => host.shadowRoot!.querySelector('[part~="options"]')!.getBoundingClientRect().height);
    await page.locator('#segmented').evaluate(async (host: any) => {
      host.style.inlineSize = '150px';
      host.items = [{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta', disabled: true }, { value: 'gamma', label: 'Gamma' }];
      host.value = 'alpha'; await host.updateComplete;
    });
    const geometry = await page.locator('#segmented').evaluate(host => {
      const frame = host.shadowRoot!.querySelector<HTMLElement>('[part~="options"]')!;
      const rect = frame.getBoundingClientRect(), style = getComputedStyle(frame);
      const options = [...frame.querySelectorAll<HTMLElement>('[part~="option"]')].map(node => node.getBoundingClientRect());
      const last = options[options.length - 1]!;
      return { height: rect.height, rows: new Set(options.map(option => Math.round(option.top * 100))).size,
        heights: options.map(option => option.height), x: (last.left + last.right) / 2,
        y: rect.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom) / 2 };
    });
    expect(geometry.rows).toBeGreaterThan(1);
    expect(geometry.height).toBeGreaterThan(singleHeight);
    for (const height of geometry.heights) expect(height).toBeGreaterThanOrEqual(coarse ? 44 : 24);
    if (coarse) await page.touchscreen.tap(geometry.x, geometry.y); else await page.mouse.click(geometry.x, geometry.y);
    await expect(page.locator('#segmented')).toHaveJSProperty('value', 'gamma');
    const alpha = page.getByRole('radio', { name: 'Alpha', exact: true });
    await alpha.focus(); await alpha.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Gamma', exact: true })).toBeFocused();
    await expect(page.getByRole('radio', { name: 'Beta', exact: true })).toBeDisabled();
  });
});
