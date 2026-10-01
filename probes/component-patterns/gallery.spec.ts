import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const themes = ['default', 'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'radix-inspired', 'holotable-inspired', 'vellum', 'signal', 'kinetic'];
for (const theme of themes) for (const mode of ['light', 'dark']) {
  test(`${theme} ${mode}: themed pattern gallery`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/component-patterns.html?theme=${theme}&appearance=${mode}`);
    await expect(page.locator('html')).toHaveAttribute('data-en-theme', theme === 'default' ? 'patterns' : theme);
    await expect(page.getByRole('heading', { name: 'More ways to compose.' })).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Bold', exact: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // Theme adoption and hover both transition paint. Measure actual final states,
    // not an arbitrary intermediate frame in a running background transition.
    for (const state of ['hover', 'rest']) {
      if (state === 'rest') await page.mouse.move(1, 1);
      await toggle.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))));
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })), state).toEqual([]);
    }
    expect(errors).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`${theme}-${mode}-mobile.png`), fullPage: true });
    const formatting = page.getByRole('region', { name: 'Text formatting controls', exact: true });
    await formatting.focus();
    for (const name of ['Bold', 'Italic', 'Underline']) {
      await page.keyboard.press('Tab');
      const action = page.getByRole('button', { name, exact: true });
      await expect(action).toBeFocused();
      const bounds = await action.boundingBox();
      const region = await formatting.boundingBox();
      expect(bounds).not.toBeNull();
      expect(region).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(region!.x);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(region!.x + region!.width);
    }
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Underline', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test('theme changes retain state and Developer UI return links are opt-in', async ({ page }) => {
  await page.goto('/component-patterns.html?progress-report');
  await page.getByRole('textbox', { name: 'Budget', exact: true }).fill('2500');
  await page.getByRole('textbox', { name: 'Budget', exact: true }).press('Tab');
  await page.getByRole('combobox', { name: 'Theme', exact: true }).selectOption('kinetic');
  await expect(page.getByRole('textbox', { name: 'Budget', exact: true })).toHaveValue('2500');
  await expect(page.locator('#progress-return')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Showcase', exact: true })).toHaveAttribute('href', /progress-report/);
  await page.goto('/component-patterns.html');
  await expect(page.locator('#progress-return')).toBeHidden();
});
