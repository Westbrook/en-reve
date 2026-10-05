import { test, expect } from '@playwright/test';

// Production delivery checks. Home Screen installation itself requires Apple hardware.
test('nested pages expose the same install identity and all icons decode', async ({ page, request }) => {
  for (const path of ['/', '/showcase.html', '/workflows/settings', '/api-examples/card.html']) {
    await page.goto(path);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
  }
  const response = await request.get('/manifest.json');
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.display).toBe('standalone');
  for (const icon of [...manifest.icons, { src: 'apple-touch-icon.png', sizes: '180x180' }]) {
    const dimensions = await page.evaluate(async src => {
      const image = new Image();
      image.src = new URL(src, new URL('/manifest.json', location.href)).href;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 820, height: 1180 }]) {
  test(`safe-area content and navigation remain usable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/conversation.html');
    // Deterministic geometry stress: emulation cannot create real hardware cutouts.
    await page.addStyleTag({ content: ':root { --docs-safe-top: 24px; --docs-safe-right: 32px; --docs-safe-bottom: 34px; --docs-safe-left: 32px; }' });
    const bounds = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return { left: body.paddingLeft, right: body.paddingRight, bottom: body.paddingBottom,
        width: document.documentElement.scrollWidth, viewport: innerWidth };
    });
    expect(bounds).toMatchObject({ left: '32px', right: '32px', bottom: '34px' });
    expect(bounds.width).toBeLessThanOrEqual(bounds.viewport + 1);
    await expect(page.locator('.conversation-header')).toBeVisible();
  });
}
