import { expect, test } from '@playwright/test';

for (const profile of [
	{ name: 'desktop', width: 1440, height: 1000, direction: 'ltr', enlarged: false },
	{ name: 'narrow RTL', width: 320, height: 800, direction: 'rtl', enlarged: false },
	{ name: 'landscape enlarged text', width: 568, height: 320, direction: 'ltr', enlarged: true },
]) {
	test(`API section links remain reachable and clear their targets in ${profile.name}`, async ({ page }) => {
		await page.setViewportSize({ width: profile.width, height: profile.height });
		await page.goto('/api-reference?component=en-text-field&progress-report#api-cssParts');
		await expect(page.getByRole('heading', { name: 'en-text-field', exact: true })).toBeVisible();
		const jumps = page.getByRole('navigation', { name: 'Component API sections', exact: true });
		await expect.poll(() => jumps.evaluate(element => getComputedStyle(element).position)).toBe('sticky');
		const target = page.locator('#api-cssParts');
		const assertClear = async () => {
			await expect.poll(async () => {
				const nav = (await jumps.boundingBox())!;
				const heading = (await target.locator('h3').boundingBox())!;
				return heading.y - (nav.y + nav.height);
			}).toBeGreaterThanOrEqual(0);
			const nav = (await jumps.boundingBox())!;
			expect(nav.y).toBeGreaterThanOrEqual(-1);
			expect(nav.y).toBeLessThanOrEqual(1);
			expect(nav.height).toBeLessThan(profile.height / 2);
		};
		await assertClear();
		await page.evaluate(profile => {
			document.documentElement.dir = profile.direction;
			if (profile.enlarged) document.documentElement.style.fontSize = '200%';
		}, profile);
		await assertClear();
		await page.mouse.wheel(0, 160);
		await expect.poll(async () => (await jumps.boundingBox())!.y).toBeLessThanOrEqual(1);
		const partsLink = jumps.getByRole('link', { name: 'CSS parts', exact: true });
		await partsLink.focus();
		await partsLink.press('Enter');
		await expect(target).toBeFocused();
		await assertClear();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

		// A new keyed article must not replay the old fragment over the focused chooser.
		const chooser = page.locator('en-select').getByRole('combobox', { name: 'Component', exact: true });
		await chooser.focus();
		await chooser.selectOption('en-slider');
		await expect(page.getByRole('heading', { name: 'en-slider', exact: true })).toBeVisible();
		await expect(chooser).toBeFocused();
		expect((await chooser.boundingBox())!.y).toBeGreaterThanOrEqual(0);
		await expect.poll(() => jumps.evaluate(element => getComputedStyle(element).position)).toBe('sticky');
		await jumps.getByRole('link', { name: 'CSS parts', exact: true }).click();
		await assertClear();
	});
}
