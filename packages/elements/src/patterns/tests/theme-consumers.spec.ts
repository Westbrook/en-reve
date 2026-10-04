import { test, expect } from '@playwright/test';
import { patternStyles } from '@en-reve/styles/patterns.js';

test('code and keycap recipes use their local theme code font', async ({ page }) => {
  await page.goto('/packages/elements/src/patterns/tests/fixture.html');
  await page.addStyleTag({ content: patternStyles.cssText });
  await page.locator('#fixture').evaluate(element => {
    element.innerHTML = `<section id="outer" style="--en-font-code-family: Georgia">
      <code class="en-code">outer code</code><kbd class="en-keycap">outer key</kbd>
      <section id="inner" style="--en-font-code-family: monospace">
        <code class="en-code">inner code</code><kbd class="en-keycap">inner key</kbd>
      </section>
    </section>`;
  });
  for (const kind of ['code', 'kbd']) {
    await expect(page.locator(`#outer > ${kind}`)).toHaveCSS('font-family', 'Georgia');
    await expect(page.locator(`#inner > ${kind}`)).toHaveCSS('font-family', 'monospace');
  }
  await page.locator('#outer').evaluate(element => element.style.setProperty('--en-font-code-family', 'serif'));
  for (const kind of ['code', 'kbd']) {
    await expect(page.locator(`#outer > ${kind}`)).toHaveCSS('font-family', 'serif');
    await expect(page.locator(`#inner > ${kind}`)).toHaveCSS('font-family', 'monospace');
  }
});

for (const direction of ['ltr', 'rtl']) {
  test(`interval track follows theme size while targets and values stay stable in ${direction}`, async ({ page }) => {
    await page.goto('/packages/elements/src/patterns/tests/fixture.html');
    await page.waitForFunction(() => !!customElements.get('en-range-slider'));
    await page.locator('#fixture').evaluate((element, direction) => {
      element.innerHTML = `<en-range-slider dir="${direction}" value="[20,80]" style="width:400px"></en-range-slider>`;
    }, direction);
    const slider = page.locator('en-range-slider');
    const lower = slider.getByRole('slider', { name: 'Minimum', exact: true });
    const upper = slider.getByRole('slider', { name: 'Maximum', exact: true });
    await expect(lower).toHaveAttribute('aria-valuenow', '20');
    const initialLower = await lower.boundingBox();
    const initialUpper = await upper.boundingBox();
    const initialTrack = await slider.locator('.track').boundingBox();
    for (const [size, thickness] of [['small', 4], ['medium', 8], ['large', 12]] as const) {
      await slider.evaluate((element, { size, thickness }) => {
        element.style.setProperty(`--en-size-range-track-${size}`, `${thickness}px`);
        element.setAttribute('size', size);
      }, { size, thickness });
      await expect.poll(() => slider.locator('.track').evaluate(element => getComputedStyle(element, '::before').height)).toBe(`${thickness}px`);
      await expect(slider.locator('.fill')).toHaveCSS('height', `${thickness}px`);
      const track = await slider.locator('.track').boundingBox();
      const fill = await slider.locator('.fill').boundingBox();
      expect(track?.height).toBe(initialTrack?.height);
      expect(fill!.y + fill!.height / 2).toBeCloseTo(track!.y + track!.height / 2, 5);
      const lowerBox = await lower.boundingBox();
      const upperBox = await upper.boundingBox();
      expect(lowerBox?.width).toBe(initialLower?.width);
      expect(lowerBox?.height).toBe(initialLower?.height);
      expect(upperBox?.width).toBe(initialUpper?.width);
      expect(upperBox?.height).toBe(initialUpper?.height);
      await expect(lower).toHaveAttribute('aria-valuenow', '20');
      await expect(upper).toHaveAttribute('aria-valuenow', '80');
    }
    await lower.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
    await expect(lower).toHaveAttribute('aria-valuenow', '21');
    await expect(upper).toHaveAttribute('aria-valuenow', '80');
  });
}
