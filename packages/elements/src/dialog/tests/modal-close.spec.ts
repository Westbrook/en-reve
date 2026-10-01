import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).overlaysReady);
});

for (const id of ['dialog', 'drawer', 'command-palette']) {
  test(`${id}: localized official close action is keyboard accessible, cancelable, and restores focus`, async ({ page }) => {
    const host = page.locator(`#${id}`);
    await host.evaluate((element: any) => { element.closeLabel = 'Fermer'; });
    const opener = page.locator(`#open-${id}`);
    await opener.focus();
    await opener.press('Enter');
    const surface = host.getByRole('dialog');
    await expect(surface).toBeVisible();
    const close = host.getByRole('button', { name: 'Fermer', exact: true });
    await expect(close).toHaveCount(1);
    const action = host.locator('en-button.en-overlay-close');
    await expect(action).toHaveAttribute('variant', 'ghost');
    await expect(action).toHaveAttribute('icon-only', '');
    await expect(action.locator('en-icon[name="close"] svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(action.locator('en-icon path')).toHaveAttribute('d', 'm6 6 12 12M18 6 6 18');
    await expect(action).not.toContainText('×');
    await close.focus();
    await page.evaluate(() => { (window as any).cancelOverlayChanges = true; (window as any).overlayEvents = []; });
    await close.press('Enter');
    await expect(surface).toBeVisible();
    await expect(close).toBeFocused();
    await expect(host).toHaveJSProperty('open', true);
    expect(await page.evaluate(() => (window as any).overlayEvents)).toEqual([
      expect.objectContaining({ previous: true, proposed: false, reason: 'close-button', cancelable: true, surfaceOpen: true, modal: true }),
    ]);
    await page.evaluate(() => { (window as any).cancelOverlayChanges = false; });
    await close.press('Space');
    await expect(surface).not.toBeVisible();
    await expect(opener).toBeFocused();
    await host.evaluate((element: any) => { element.dismissible = false; });
    await opener.press('Enter');
    await expect(surface).toBeVisible();
    await expect(host.locator('en-button.en-overlay-close')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(surface).toBeVisible();
  });

  test(`${id}: close action inherits each size and exposes its native control through the close part`, async ({ page }) => {
    const host = page.locator(`#${id}`);
    await page.locator(`#open-${id}`).click();
    const action = host.locator('en-button.en-overlay-close');
    const icon = action.locator('en-icon');
    const close = action.getByRole('button');
    await expect(action).toHaveAttribute('size', 'inherit');
    await expect(icon).toHaveAttribute('size', 'inherit');
    const dimensions: number[] = [];
    for (const size of ['small', 'medium', 'large']) {
      await host.evaluate((element: any, value) => { element.size = value; }, size);
      await expect(host).toHaveAttribute('size', size);
      const box = (await close.boundingBox())!;
      expect(box.width).toBeCloseTo(box.height, 0);
      dimensions.push(box.width);
      const iconBox = (await icon.boundingBox())!;
      expect(iconBox.width).toBeLessThan(box.width);
      expect(iconBox.width).toBeCloseTo(iconBox.height, 0);
    }
    expect(dimensions[0]).toBeLessThan(dimensions[1]);
    expect(dimensions[1]).toBeLessThan(dimensions[2]);
    await page.addStyleTag({ content: `#${id}::part(close) { outline: 3px solid rgb(23, 45, 67); border-radius: 11px; }` });
    await expect(close).toHaveCSS('outline-color', 'rgb(23, 45, 67)');
    await expect(close).toHaveCSS('outline-width', '3px');
    await expect(close).toHaveCSS('border-radius', '11px');
    await expect(action).not.toHaveCSS('outline-color', 'rgb(23, 45, 67)');
  });
}
