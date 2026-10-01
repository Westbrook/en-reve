import { test, expect, type Page, type Locator } from '@playwright/test';

const control = (page: Page, id: string) => page.locator(`#${id}`).locator('button,input');
async function ready(page: Page, mode = 'document') {
  await page.goto(`/packages/styles/tests/focus-scroll/fixture.html?mode=${mode}`);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
}
async function clearance(target: Locator, container?: string) {
  return target.evaluate((element, selector) => {
    const rect = element.getBoundingClientRect();
    const parent = selector ? document.querySelector(selector) as HTMLElement : null;
    const frame = parent?.getBoundingClientRect();
    const top = frame ? frame.top + parent!.clientTop : 0;
    const left = frame ? frame.left + parent!.clientLeft : 0;
    return {
      top: rect.top - top, bottom: top + (parent?.clientHeight ?? innerHeight) - rect.bottom,
      left: rect.left - left, right: left + (parent?.clientWidth ?? document.documentElement.clientWidth) - rect.right,
    };
  }, container);
}
async function margins(target: Locator) {
  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    return { block: parseFloat(style.scrollMarginBlockStart), inline: parseFloat(style.scrollMarginInlineStart) };
  });
}

for (const mode of ['document', 'nested']) {
  test(`${mode}: Tab and Shift+Tab reveal real shadow controls with clearance`, async ({ page }) => {
    await ready(page, mode);
    const first = control(page, 'first');
    const middle = control(page, 'middle');
    const last = control(page, 'last');
    await first.focus();
    await page.keyboard.press('Tab');
    await expect(middle).toBeFocused();
    await expect.poll(async () => Math.min(...Object.values(await clearance(middle, mode === 'nested' ? '.scrollport' : undefined)).slice(0, 2))).toBeGreaterThanOrEqual(15);
    await page.keyboard.press('Tab');
    await expect(last).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(middle).toBeFocused();
    await expect.poll(async () => {
      const bounds = await clearance(middle, mode === 'nested' ? '.scrollport' : undefined);
      return Math.min(bounds.top, bounds.bottom);
    }).toBeGreaterThanOrEqual(15);
    await middle.fill('A keyboard-reachable value');
    await expect(middle).toHaveValue('A keyboard-reachable value');
  });
}

test('theme block clearance changes explicit scroll alignment and combines with scroll padding', async ({ page }) => {
  await ready(page, 'nested');
  const middle = control(page, 'middle');
  const scrollport = page.locator('.scrollport');
  await middle.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  expect((await clearance(middle, '.scrollport')).bottom).toBeCloseTo(16, 0);
  await scrollport.evaluate((el) => {
    (el as HTMLElement).style.setProperty('--en-focus-scroll-margin-block', '40px');
    (el as HTMLElement).style.scrollPaddingBlockEnd = '24px';
  });
  await middle.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  expect((await clearance(middle, '.scrollport')).bottom).toBeCloseTo(64, 0);
  await middle.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  expect((await clearance(middle, '.scrollport')).top).toBeCloseTo(40, 0);
});

test('inline clearance participates in horizontal keyboard and explicit scrolling', async ({ page }, testInfo) => {
  await ready(page, 'inline');
  const first = control(page, 'first');
  const middle = control(page, 'middle');
  await page.locator('.horizontal').evaluate((el) => (el as HTMLElement).style.setProperty('--en-focus-scroll-margin-inline', '32px'));
  await first.focus();
  await page.keyboard.press('Tab');
  await expect(middle).toBeFocused();
  await expect.poll(async () => {
    const bounds = await clearance(middle, '.horizontal');
    return Math.min(bounds.left, bounds.right);
  }).toBeGreaterThanOrEqual(0);
  await testInfo.attach('automatic-inline-focus-clearance', {
    body: JSON.stringify({ requested: await margins(middle), actual: await clearance(middle, '.horizontal') }),
    contentType: 'application/json',
  });
  // WebKit can reveal the input without honoring its full inline margin.
  // Explicit scrollIntoView below must still use the theme's alignment.
  await middle.evaluate((el) => el.scrollIntoView({ inline: 'end', block: 'nearest' }));
  expect(Math.abs((await clearance(middle, '.horizontal')).right - 32)).toBeLessThanOrEqual(1);
  await middle.evaluate((el) => el.scrollIntoView({ inline: 'start', block: 'nearest' }));
  expect(Math.abs((await clearance(middle, '.horizontal')).left - 32)).toBeLessThanOrEqual(1);
});

test('component override keeps enough space for its larger focus contour', async ({ page }) => {
  await ready(page, 'nested');
  const middle = control(page, 'middle');
  await page.locator('#middle').evaluate((el) => {
    const style = (el as HTMLElement).style;
    style.setProperty('--en-focus-scroll-margin-block', '2px');
    style.setProperty('--en-input-focus-width', '24px');
    style.setProperty('--en-input-focus-offset', '12px');
  });
  await middle.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  expect((await margins(middle)).block).toBe(36);
  expect((await clearance(middle, '.scrollport')).bottom).toBeCloseTo(36, 0);
});

test('preventScroll remains honored for application-owned focus changes', async ({ page }) => {
  await ready(page, 'nested');
  const middle = control(page, 'middle');
  const position = () => page.evaluate(() => ({ document: scrollY, nested: document.querySelector('.scrollport')!.scrollTop }));
  const before = await position();
  await middle.evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
  await expect(middle).toBeFocused();
  expect(await position()).toEqual(before);
  expect((await clearance(middle, '.scrollport')).bottom).toBeLessThan(0);
});

test('already visible targets and scroll limits retain native behavior', async ({ page }) => {
  await ready(page, 'nested');
  const first = control(page, 'first');
  await page.locator('.scrollport').evaluate((el) => { el.scrollTop = 56; });
  const before = await page.locator('.scrollport').evaluate((el) => el.scrollTop);
  await first.focus();
  await expect(first).toBeFocused();
  const after = await page.locator('.scrollport').evaluate((el) => el.scrollTop);
  // Engines may leave a fully visible control nearer an edge than scroll-margin.
  // The library must not introduce a script-driven scroll correction.
  expect(after).toBeLessThanOrEqual(before);
  expect((await clearance(first, '.scrollport')).top).toBeGreaterThanOrEqual(0);
  await page.locator('.scrollport-content').evaluate((el) => { (el as HTMLElement).style.paddingBlock = '0'; });
  await first.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  expect(await page.locator('.scrollport').evaluate((el) => el.scrollTop)).toBe(0);
  expect((await clearance(first, '.scrollport')).top).toBeCloseTo(0, 0);
});


test('visually hidden rating radios inherit scroll clearance and remain keyboard operable', async ({ page, browserName }) => {
  await ready(page, 'rating');
  await page.locator('#rating').evaluate((el) => (el as HTMLElement).style.setProperty('--en-focus-scroll-margin-block', '28px'));
  const selected = page.locator('#rating input[value="3"]');
  expect((await margins(selected)).block).toBe(28);
  await control(page, 'first').focus();
  // macOS WebKit's default keyboard preference skips native radio controls on Tab.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(selected).toBeFocused();
  await expect.poll(async () => {
    const bounds = await clearance(selected, '.scrollport');
    return Math.min(bounds.top, bounds.bottom);
  }).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#rating input[value="4"]')).toBeChecked();
  await selected.evaluate((el) => el.scrollIntoView({ block: 'end' }));
  expect(Math.abs((await clearance(selected, '.scrollport')).bottom - 28)).toBeLessThanOrEqual(1);
});
