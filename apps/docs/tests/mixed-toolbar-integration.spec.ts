import { expect, test } from '@playwright/test';

const route = '/api-examples/mixed-toolbar.html';
test('explicit mixed toolbar has a labelled group and visible controls in initial HTML', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(route);
		await expect(page.getByRole('group', { name: 'Study export controls' })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Study title', exact: true })).toHaveValue('Studio study');
		await expect(page.getByRole('button', { name: 'Apply preview settings' })).toBeVisible();
	} finally { await context.close(); }
});

test('isolated mixed demo applies edits and retains a usable narrow RTL layout', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(route);
	await page.waitForFunction(() => customElements.get('en-toolbar'));
	await page.locator('html').evaluate(element => element.dir = 'rtl');
	const title = page.getByRole('textbox', { name: 'Study title', exact: true });
	await title.fill('Night study');
	await title.press('Home');
	await expect(title).toBeFocused();
	await page.getByRole('combobox', { name: 'Study output format', exact: true }).selectOption('svg');
	await page.getByRole('checkbox', { name: 'Include study background' }).uncheck();
	await page.getByRole('button', { name: 'Apply preview settings' }).click();
	await expect(page.locator('[data-study-result]')).toContainText('Night study: SVG, without background');
	const bounds = await page.locator('#specimen-mixed-toolbar').evaluate(element => ({ width: element.getBoundingClientRect().width, scroll: element.scrollWidth }));
	expect(bounds.scroll).toBeLessThanOrEqual(Math.ceil(bounds.width) + 1);
});

test('Settings restores the saved output pair while preserving other preview edits', async ({ page }) => {
	await page.goto('/workflows/settings');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	const group = page.locator('#settings-output-controls');
	await expect(group.getByRole('group', { name: 'Output controls' })).toBeVisible();
	await group.getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
	await group.getByRole('checkbox', { name: 'Include background', exact: true }).uncheck();
	const opacity = page.getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
	await opacity.fill('42');
	await opacity.press('Enter');
	await group.getByRole('button', { name: 'Restore saved output' }).click();
	await expect(group.getByRole('combobox', { name: 'Output format', exact: true })).toHaveValue('png');
	await expect(group.getByRole('checkbox', { name: 'Include background', exact: true })).toBeChecked();
	await expect(opacity).toHaveValue('42');
	await expect(page.locator('#settings-command-toolbar').getByRole('toolbar', { name: 'Settings actions', exact: true })).toBeVisible();
});

for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
	test(`${theme} keeps mixed controls operable at narrow RTL widths`, async ({ page }, info) => {
		await page.goto(route);
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator('html').evaluate(element => element.dir = 'rtl');
		for (const appearance of ['light', 'dark']) {
			await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance);
			const title = page.getByRole('textbox', { name: 'Study title', exact: true });
			await title.fill(`${appearance} study`);
			await page.getByRole('button', { name: 'Apply preview settings' }).click();
			await expect(page.locator('[data-study-result]')).toContainText(`${appearance} study: PNG`);
			await title.focus();
			await expect(title).toBeFocused();
			const bounds = await page.locator('#specimen-mixed-toolbar').evaluate(element => ({ width: element.getBoundingClientRect().width, scroll: element.scrollWidth }));
			expect(bounds.scroll).toBeLessThanOrEqual(Math.ceil(bounds.width) + 1);
		}
		if (info.project.name === 'webkit') await page.locator('.mixed-toolbar-demo').screenshot({ path: info.outputPath(`${theme}-mixed.png`) });
	});
}
