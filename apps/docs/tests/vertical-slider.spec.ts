import { expect, test } from '@playwright/test';

test('vertical slider renders before JavaScript, hydrates in place, and supports precise adjustment and reset', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/?progress-report#choices', { waitUntil: 'commit' });
		const specimen = page.locator('[data-specimen="vertical-slider"]');
		const range = specimen.getByRole('slider', { name: 'Brush size', exact: true });
		const editor = specimen.getByRole('spinbutton', { name: 'Brush size Exact value', exact: true });
		await expect(range).toHaveAttribute('aria-orientation', 'vertical');
		await expect(range).toHaveCSS('writing-mode', 'vertical-lr');
		await expect(range).toHaveCSS('direction', 'rtl');
		await expect(range).toHaveValue('32');
		await expect(editor).toHaveValue('32');
		const identity = await range.elementHandle();
		const initial = await range.boundingBox();
		expect(initial!.height).toBeGreaterThan(initial!.width * 2);
		release();
		await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
		expect(await range.evaluate((element, original) => element === original, identity)).toBe(true);
		await range.focus();
		await range.press('ArrowUp');
		await expect(range).toHaveValue('33');
		await expect(editor).toHaveValue('33');
		await editor.fill('48');
		await editor.press('Enter');
		await expect(range).toHaveValue('48');
		await specimen.getByRole('button', { name: 'Reset Vertical adjustment' }).click();
		await expect(range).toHaveValue('32');
		await expect(editor).toHaveValue('32');
		await specimen.locator('summary').focus();
		await specimen.locator('summary').press('Enter');
		await expect(specimen.locator('details')).toHaveAttribute('data-highlighted', 'true');
		expect(errors).toEqual([]);
	} finally { release(); }
});
