import { expect, test } from '@playwright/test';

for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
	test(`${theme} preserves table selection geometry across appearance and density`, async ({ page }, info) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(error.message));
		await page.goto('/api-examples/virtual-collection.html?progress-report');
		const demo = page.locator('en-virtual-collection-demo');
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		const row = demo.locator('[data-en-virtual-key="asset-00001"]');
		const choice = row.getByRole('checkbox', { name: 'Select Asset 00001', exact: true });
		for (const appearance of ['light', 'dark']) {
			await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance);
			await expect(page.locator('html')).toHaveAttribute('data-en-appearance', appearance);
			await choice.uncheck();
			const before = await row.boundingBox();
			await choice.focus(); await choice.press('Space');
			await expect(choice).toBeChecked(); await expect(choice).toBeFocused();
			const after = await row.boundingBox();
			expect(Math.abs(after!.height - before!.height)).toBeLessThan(1);
			await expect(demo.locator('table')).toHaveAttribute('aria-rowcount', '10001');
		}
		await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
		await expect(choice).toBeChecked();
		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator('html').evaluate(node => node.dir = 'rtl');
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
		await demo.locator('en-table').scrollIntoViewIfNeeded();
		await expect(choice).toBeChecked();
		if (info.project.name === 'webkit') await page.screenshot({ path: info.outputPath(`${theme}-phone.png`) });
		expect(errors).toEqual([]);
	});
}
