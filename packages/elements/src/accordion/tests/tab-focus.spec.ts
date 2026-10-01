import { test, expect, type Locator, type Page } from '@playwright/test';

/** Sample the actual painted outline, including the sides overlapping later tabs
 * and the following panel. Reading computed z-index alone cannot catch clipping. */
async function expectUncoveredOutline(page: Page, tab: Locator, name: string) {
  const bounds = await tab.boundingBox();
  if (!bounds) throw new Error('Focused tab has no bounds.');
  const distance = await tab.evaluate(element => {
    const style = getComputedStyle(element);
    return parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth) / 2;
  });
  const points = [
    { side: 'top', x: bounds.x + bounds.width / 2, y: bounds.y - distance },
    { side: 'right', x: bounds.x + bounds.width + distance, y: bounds.y + bounds.height / 2 },
    { side: 'bottom', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + distance },
    { side: 'left', x: bounds.x - distance, y: bounds.y + bounds.height / 2 },
  ];
  const screenshot = await page.screenshot({ scale: 'css' });
  await test.info().attach(name, { body: screenshot, contentType: 'image/png' });
  const samples = await page.evaluate(async ({ png, points }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return points.map(point => ({
      side: point.side,
      rgba: [...context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data],
    }));
  }, { png: screenshot.toString('base64'), points });
  for (const sample of samples) expect(sample.rgba, `${name}: ${sample.side} focus outline is unobscured`).toEqual([255, 0, 255, 255]);
}

for (const contour of ['holotable', 'wide']) {
  for (const layout of ['horizontal', 'vertical', 'wrapped']) {
    for (const dir of ['ltr', 'rtl']) {
      test(`${contour} ${layout} ${dir}: keyboard focus paints over later tabs and panels`, async ({ page }) => {
        await page.goto(`/packages/elements/src/accordion/tests/tab-focus.fixture.html?layout=${layout}&dir=${dir}&contour=${contour}`);
        await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
        const first = page.getByRole('tab', { name: 'One', exact: true });
        const second = page.getByRole('tab', { name: 'Two', exact: true });
        await page.getByRole('button', { name: 'Before tabs' }).focus();
        await page.keyboard.press('Tab');
        await expect(first).toBeFocused();
        await expectUncoveredOutline(page, first, 'first-tab-keyboard-focus');
        await page.keyboard.press(layout === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
        await expect(second).toBeFocused();
        await expect(second).toHaveAttribute('aria-selected', 'true');
        await expectUncoveredOutline(page, second, 'second-tab-arrow-focus');
        await page.keyboard.press('Home');
        await expect(first).toBeFocused();
        await expectUncoveredOutline(page, first, 'returned-first-tab-focus');
      });
    }
  }
}
