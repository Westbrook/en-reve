import { expect, test } from '@playwright/test';

const path = '/api-examples/calendar.html';
test.beforeEach(async ({ page }) => {
  await page.goto(path);
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
});

test('calendar switches preserve ISO selection, alternate labels and Gregorian form submission', async ({ page }) => {
  const calendar = page.locator('#specimen-calendar');
  const picker = page.locator('#specimen-date-picker');
  for (const host of [calendar, picker]) await host.evaluate((el: any) => { el.calendar = 'buddhist'; el.locale = 'th-TH-u-nu-thai'; });
  const month = calendar.locator('[part="heading"]');
  await expect(month).toContainText('๒๕๖๙');
  await expect(calendar.locator('[part="calendar-label"]')).toContainText('Buddhist');
  await expect(picker.locator('[part="calendar-summary"]')).toContainText('๒๕๖๙');
  await expect(picker.locator('input[type="date"]')).toHaveValue('2026-09-18');
  await expect(picker.locator('input[type="date"]')).toHaveAccessibleDescription(/Gregorian/);
  await picker.locator('#picker-trigger').click();
  await picker.locator('button[data-date="2026-09-21"]').click();
  await expect(picker.locator('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Submit review date', exact: true }).click();
  await expect(page.locator('[data-calendar-receipt]')).toContainText('2026-09-21');
  await picker.evaluate((el: any) => { el.calendar = 'gregory'; });
  await expect(picker.locator('input[type="date"]')).toHaveValue('2026-09-21');
  await expect(picker.locator('[part="calendar-summary"]')).toHaveCount(0);
  await picker.evaluate((el: any) => el.closest('form').reset());
  await expect(picker.locator('input[type="date"]')).toHaveValue('2026-09-18');
});

test('modern boundary excludes historic days and rejects unsupported calendar configuration', async ({ page }) => {
  const calendar = page.locator('#specimen-calendar');
  await calendar.evaluate((el: any) => { el.calendar = 'buddhist'; el.value = '1941-01-01'; el.month = '1941-01-01'; el.min = ''; el.max = ''; });
  await expect(calendar.locator('[part="heading"]')).toContainText('2484');
  await expect(calendar.locator('button[data-date^="1940"]')).toHaveCount(0);
  const first = calendar.locator('button[data-date="1941-01-01"]');
  await first.focus(); await page.keyboard.press('ArrowLeft'); await expect(first).toBeFocused();
  await expect(calendar.locator('en-button[exportparts="control:previous"]')).toHaveAttribute('aria-disabled', 'true');
  await calendar.evaluate((el: any) => { el.value = '1940-12-31'; el.month = '1941-01-15'; });
  await expect(calendar.locator('[part="configuration"]')).toContainText('1941-01-01');
  await expect.poll(() => calendar.evaluate((el: any) => el.value)).toBe('1940-12-31');
  await calendar.evaluate((el: any) => { el.calendar = 'hebrew'; });
  await expect(calendar.getByRole('grid')).toHaveCount(0);
  await expect(calendar.locator('[part="configuration"]')).toContainText('unsupported');
  await calendar.evaluate((el: any) => { el.calendar = 'buddhist'; el.month = '1940-12-31'; });
  await expect(calendar.locator('[part="configuration"]')).toContainText('1941-01-01');
  await calendar.evaluate((el: any) => { el.calendar = 'gregory'; el.month = '0001-01-01'; el.value = '0001-01-01'; });
  await expect(calendar.getByRole('grid')).toBeVisible();
  await expect(calendar.locator('button[data-date="0001-01-01"]')).toBeVisible();
});

test('missing Intl data never masquerades as Buddhist output', async ({ page }) => {
  await page.evaluate(() => {
    const original = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const result = original.call(this); return { ...result, calendar: result.calendar === 'buddhist' ? 'gregory' : result.calendar };
    };
  });
  const calendar = page.locator('#specimen-calendar');
  await calendar.evaluate((el: any) => { el.calendar = 'buddhist'; });
  await expect(calendar.getByRole('grid')).toHaveCount(0);
  await expect(calendar.locator('[part="configuration"]')).toContainText('unavailable');
});

test('alternate month and year navigation preserves leap-day rules, one tab stop and veto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const calendar = page.locator('#specimen-calendar');
  await calendar.evaluate((el: any) => { el.calendar = 'buddhist'; el.value = '2024-02-29'; el.month = '2024-02-29'; el.min = ''; el.max = ''; el.dir = 'rtl'; });
  const leap = calendar.locator('button[data-date="2024-02-29"]');
  await leap.focus(); await page.keyboard.press('Shift+PageDown');
  await expect(calendar.locator('button[data-date="2025-02-28"]')).toBeFocused();
  await expect(calendar.locator('button[data-date][tabindex="0"]')).toHaveCount(1);
  await expect.poll(() => calendar.evaluate((el: any) => el.value)).toBe('2024-02-29');
  await calendar.evaluate(el => el.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  await page.keyboard.press('Enter');
  await expect.poll(() => calendar.evaluate((el: any) => el.value)).toBe('2024-02-29');
  expect(await calendar.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
