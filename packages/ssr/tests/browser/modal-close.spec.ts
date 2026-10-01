import { test, expect } from '@playwright/test';

for (const id of ['dialog', 'drawer', 'command-palette']) {
  test(`${id}: SSR close retains its native control and localized accessible name after hydration`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/fixture');
    const host = page.locator(`#ssr-${id}`);
    const close = host.locator('en-button.en-overlay-close button');
    await expect(close).toHaveCount(1);
    // The server modal is inert and closed, so its control is not exposed in the accessibility tree yet.
    await expect(host.locator('en-button.en-overlay-close [slot="label"]')).toHaveText('Fermer');
    await expect(host.locator('en-icon[name="close"] svg path')).toHaveAttribute('d', 'm6 6 12 12M18 6 6 18');
    await close.evaluate(button => { (window as any).__originalModalClose = button; });
    await page.evaluate(() => (window as any).hydrateFixture());
    const opener = page.locator(`#ssr-open-${id}`);
    await opener.focus();
    await opener.press('Enter');
    await expect(host.getByRole('dialog')).toBeVisible();
    await expect(close).toHaveAccessibleName('Fermer');
    expect(await close.evaluate(button => button === (window as any).__originalModalClose)).toBe(true);
    await close.focus();
    await close.press('Enter');
    await expect(host.getByRole('dialog')).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(errors).toEqual([]);
  });
}
