import { test, expect } from '@playwright/test';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';
import { fileURLToPath } from 'node:url';

const fixture = `/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`;

test.beforeEach(async ({ page, browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('date shares the text-field envelope and typography across representative sizes and directions', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addStyleTag({ content: '#date, #email { display:block; inline-size:100%; min-inline-size:0; }' });
  const profiles = [
    { density: 'compact', size: 'small', direction: 'ltr', rootSize: 16 },
    { density: 'comfortable', size: null, direction: 'ltr', rootSize: 16 },
    { density: 'comfortable', size: 'medium', direction: 'rtl', rootSize: 16 },
    { density: 'spacious', size: 'large', direction: 'rtl', rootSize: 20 },
  ] as const;
  const receipt = [];
  for (const profile of profiles) {
    const style = await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ density: profile.density }), { scope: 'root' }) });
    await page.evaluate(async ({ size, direction, rootSize }) => {
      document.documentElement.dir = direction;
      document.documentElement.style.fontSize = `${rootSize}px`;
      for (const id of ['date', 'email']) {
        const host = document.getElementById(id) as HTMLElement & { updateComplete: Promise<unknown> };
        size === null ? host.removeAttribute('size') : host.setAttribute('size', size);
        await host.updateComplete;
      }
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }, profile);
    const measured = await page.evaluate(() => {
      const read = (id: string) => {
        const input = document.getElementById(id)!.shadowRoot!.querySelector<HTMLInputElement>('[part=control]')!;
        const box = input.getBoundingClientRect();
        const css = getComputedStyle(input);
        return { width: box.width, height: box.height, appearance: css.appearance,
          fontSize: css.fontSize, fontFamily: css.fontFamily, fontWeight: css.fontWeight,
          lineHeight: css.lineHeight, paddingBlockStart: css.paddingBlockStart,
          paddingBlockEnd: css.paddingBlockEnd, paddingInlineStart: css.paddingInlineStart,
          paddingInlineEnd: css.paddingInlineEnd, color: css.color, background: css.backgroundColor,
          radius: css.borderRadius, type: input.type };
      };
      return { date: read('date'), text: read('email') };
    });
    expect(measured.date.type).toBe('date');
    expect(Math.abs(measured.date.width - measured.text.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(measured.date.height - measured.text.height)).toBeLessThanOrEqual(1);
    for (const property of ['fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'color', 'background', 'radius'] as const) {
      expect(measured.date[property], `${profile.density}/${profile.size}/${property}`).toBe(measured.text[property]);
    }
    for (const property of ['paddingBlockStart', 'paddingBlockEnd', 'paddingInlineStart', 'paddingInlineEnd'] as const) {
      // Native editors can round fractional CSS lengths at different stages.
      expect(Math.abs(parseFloat(measured.date[property]) - parseFloat(measured.text[property])), property).toBeLessThanOrEqual(0.1);
    }
    const date = page.getByLabel('Publish date', { exact: true });
    await date.fill('');
    const empty = await date.boundingBox();
    expect(empty).not.toBeNull();
    expect(Math.abs(empty!.height - measured.date.height)).toBeLessThanOrEqual(1);
    await date.fill('2026-09-18');
    receipt.push({ profile, measured });
    await style.evaluate(element => element.remove());
  }
  await testInfo.attach('date-text-envelope.json', { body: JSON.stringify(receipt, null, 2), contentType: 'application/json' });
});
