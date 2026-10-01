import { test, expect } from '@playwright/test';

for (const direction of ['ltr', 'rtl']) {
  test(`overlapping handles retain focused pointer ownership in ${direction}`, async ({ page, browserName }) => {
    await page.goto('/packages/elements/src/patterns/tests/fixture.html');
    await page.waitForFunction(() => !!customElements.get('en-range-slider'));
    await page.locator('#fixture').evaluate((element, direction) => {
      element.innerHTML = `<button id="before">Before</button><en-range-slider dir="${direction}" value="[50,50]" style="width:400px"></en-range-slider>`;
    }, direction);
    const slider = page.locator('en-range-slider');
    const lower = slider.getByRole('slider', { name: 'Minimum', exact: true });
    const upper = slider.getByRole('slider', { name: 'Maximum', exact: true });
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.locator('#before').focus();
    await page.keyboard.press(tab);
    await expect(lower).toBeFocused();
    const track = await slider.locator('.track').boundingBox();
    const center = { x: track!.x + track!.width / 2, y: track!.y + track!.height / 2 };
    const sign = direction === 'rtl' ? -1 : 1;
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x - sign * track!.width / 4, center.y, { steps: 5 });
    await page.mouse.up();
    await expect(lower).toBeFocused();
    await expect(lower).toHaveAttribute('aria-valuenow', '25');
    await expect(upper).toHaveAttribute('aria-valuenow', '50');
    // Restore overlap, then switch focus through the normal, unchanged Tab order.
    await slider.evaluate((element: any) => element.value = [50, 50]);
    await page.keyboard.press(tab);
    await expect(upper).toBeFocused();
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(center.x + sign * track!.width / 4, center.y, { steps: 5 });
    await page.mouse.up();
    await expect(upper).toBeFocused();
    await expect(lower).toHaveAttribute('aria-valuenow', '50');
    await expect(upper).toHaveAttribute('aria-valuenow', '75');
  });
}
