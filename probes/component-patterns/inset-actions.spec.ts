import { test, expect, type Locator } from '@playwright/test';

async function geometry(frame: Locator, action: Locator) {
  const outer = await frame.boundingBox();
  const inner = await action.boundingBox();
  expect(outer).not.toBeNull(); expect(inner).not.toBeNull();
  const top = inner!.y - outer!.y;
  const bottom = outer!.y + outer!.height - inner!.y - inner!.height;
  expect(top).toBeGreaterThan(1);
  expect(Math.abs(top - bottom)).toBeLessThan(1);
  expect(inner!.height).toBeGreaterThanOrEqual(24);
  return { outer: outer!, inner: inner!, top };
}

for (const theme of ['default', 'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'radix-inspired', 'holotable-inspired', 'vellum', 'signal', 'kinetic']) {
  test(`${theme}: embedded actions stay inset, named and keyboard reachable`, async ({ page }) => {
    await page.goto(`/component-patterns.html?theme=${theme}&appearance=light`);
    const field = page.locator('en-text-field[adorned]');
    const help = field.getByRole('button', { name: 'Budget help', exact: true });
    for (const size of ['small', 'medium', 'large']) {
      await field.evaluate((element, size) => element.setAttribute('size', size), size);
      await geometry(field.locator('.en-adorned'), help);
      const tag = page.locator('en-multiselect .en-tag');
      await geometry(tag, tag.getByRole('button'));
      const standalone = page.locator('en-tag');
      await geometry(standalone.locator('.en-tag'), standalone.getByRole('button'));
    }
    await help.focus();
    await expect(help).toBeFocused();
    expect(await help.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
    await help.press('Enter');
    await expect(page.getByRole('status').filter({hasText:'Budget is the maximum'})).toBeVisible();
    await page.locator('en-multiselect').getByRole('button', { name: 'Remove Engineering' }).click();
    await expect(page.locator('en-multiselect .en-tag')).toHaveCount(0);
  });
}

test('derived corners follow a custom field radius and preserve touch target floors', async ({ page, browser }) => {
  await page.goto('/component-patterns.html');
  const field = page.locator('en-text-field[adorned]');
  await field.evaluate(el => (el as HTMLElement).style.setProperty('--en-input-radius', '16px'));
  const help = field.getByRole('button', { name: 'Budget help' });
  const box = await geometry(field.locator('.en-adorned'), help);
  const radius = await help.evaluate(el => parseFloat(getComputedStyle(el).borderTopRightRadius));
  expect(Math.abs(radius - (16 - box.top))).toBeLessThan(1);
  const context = await browser.newContext({ baseURL: new URL(page.url()).origin, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const mobile = await context.newPage();
  await mobile.goto('/component-patterns.html');
  for (const action of [mobile.getByRole('button', { name: 'Budget help' }), mobile.getByRole('button', { name: 'Remove Engineering' }), mobile.getByRole('button', { name: 'Remove Draft' })]) {
    const target = await action.boundingBox();
    expect(target!.height).toBeGreaterThanOrEqual(44);
    expect(target!.width).toBeGreaterThanOrEqual(44);
  }
  expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await context.close();
});
