import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test('select fallback preserves native selection with a themed closed control and inert chevron', async ({ page }, info) => {
  await page.goto(`/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`);
  await page.locator('body[data-ready=true]').waitFor();
  const host = page.locator('#format');
  const control = host.getByRole('combobox');
  const enhanced = await page.evaluate(() => CSS.supports('(appearance: base-select) and selector(::picker(select))'));
  const samples = [];
  for (const direction of ['ltr', 'rtl']) {
    await host.evaluate((node, direction) => { node.setAttribute('dir', direction); }, direction);
    const sample = await control.evaluate((node: HTMLSelectElement) => {
      const style = getComputedStyle(node), arrow = getComputedStyle(node.parentElement!, '::before');
      const r = node.getBoundingClientRect();
      return { appearance: style.appearance, height: r.height, arrow: arrow.content, mask: arrow.maskImage,
        pointer: arrow.pointerEvents, inlineStart: style.paddingInlineStart, inlineEnd: style.paddingInlineEnd };
    });
    expect(sample.appearance).toBe(enhanced ? 'base-select' : 'none');
    if (!enhanced) {
      expect(sample.arrow).toBe('\"\"');
      expect(sample.mask).not.toBe('none');
      expect(sample.pointer).toBe('none');
      expect(parseFloat(sample.inlineEnd)).toBeGreaterThan(parseFloat(sample.inlineStart));
    }
    await control.selectOption('svg');
    await expect(host).toHaveJSProperty('value', 'svg');
    await control.selectOption('png');
    await expect(host).toHaveJSProperty('value', 'png');
    samples.push({ direction, ...sample });
  }
  await page.emulateMedia({ forcedColors: 'active' });
  await control.focus();
  expect(await control.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth))).toBeGreaterThan(0);
  await host.evaluate(async (node: HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> }) => { node.disabled = true; await node.updateComplete; });
  await expect(control).toBeDisabled();
  if (!enhanced) expect(await control.evaluate(node => getComputedStyle(node.parentElement!, '::before').color)).toBe(await page.evaluate(() => {
    const probe = document.createElement('span'); probe.style.color = 'GrayText'; document.body.append(probe);
    const color = getComputedStyle(probe).color; probe.remove(); return color;
  }));
  await info.attach('native-select-fallback', { body: JSON.stringify({ enhanced, samples }, null, 2), contentType: 'application/json' });
});

test('platform select keyboard behavior matches an unwrapped native select', async ({ page }, testInfo) => {
  const url = `/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`;
  const outcomes = [];
  for (const target of ['component', 'native']) for (const keys of [['ArrowDown'], ['ArrowDown', 'Enter'], ['Space', 'ArrowDown', 'Enter'], ['Alt+ArrowDown', 'ArrowDown', 'Enter'], ['s', 'Tab']]) {
    await page.goto(url);
    await page.locator('body[data-ready=true]').waitFor();
    await page.evaluate(() => {
      (document.querySelector('#format') as HTMLElement).style.setProperty('--en-select-appearance', 'auto');
      const label = document.createElement('label');
      label.textContent = 'Native parity';
      const select = document.createElement('select');
      select.id = 'native-parity';
      for (const [value, text] of [['png', 'PNG image'], ['svg', 'SVG image'], ['pdf', 'PDF document']]) {
        const option = document.createElement('option'); option.value = value; option.textContent = text; option.disabled = value === 'pdf'; select.append(option);
      }
      label.append(select); document.querySelector('#fixture')!.append(label);
    });
    const control = target === 'native' ? page.getByLabel('Native parity') : page.getByRole('combobox', { name: 'Export format', exact: true });
    await control.focus();
    const steps = [];
    for (const key of keys) {
      await page.keyboard.press(key);
      steps.push({ key, value: await control.inputValue(), focus: await page.evaluate(() => document.activeElement?.localName) });
    }
    outcomes.push({ target, keys, steps });
  }
  for (let index = 0; index < 5; index++) {
    expect(outcomes[index].steps.map(step => step.value)).toEqual(outcomes[index + 5].steps.map(step => step.value));
  }
  await testInfo.attach('native-select-keyboard', { body: JSON.stringify(outcomes, null, 2), contentType: 'application/json' });
});
