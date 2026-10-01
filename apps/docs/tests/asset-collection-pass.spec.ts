import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.locator('[data-workflow="assets"]');
const table = (page: Page) => scene(page).getByRole('table', { name: 'Available assets', exact: true });
async function openLarge(page: Page) {
	await page.goto('/workflows/assets?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await scene(page).getByText('Review a larger collection', { exact: true }).click();
	await scene(page).getByRole('combobox', { name: 'Library size', exact: true }).selectOption('large');
	await expect(scene(page).locator('[data-assets-count]')).toHaveText('1000 of 1000 assets');
	await expect(table(page)).toBeVisible();
}
async function search(page: Page, value: string) {
	const input = scene(page).getByRole('searchbox', { name: 'Find assets', exact: true });
	await input.fill(value);
}

test('large Asset Browser retains its single selection through windowing, filtering, sort and record updates', async ({ page }) => {
	await openLarge(page);
	const radio = table(page).getByRole('radio', { name: 'Sparkle mark', exact: true });
	await radio.check();
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Sparkle mark · sparkle-mark');
	const selectedRow = table(page).getByRole('row').filter({ has: page.getByRole('radio', { name: 'Sparkle mark', exact: true }) });
	const selectedHeight = (await selectedRow.boundingBox())!.height;
	await table(page).getByRole('radio', { name: 'Direction arrow', exact: true }).check();
	expect(Math.abs((await selectedRow.boundingBox())!.height - selectedHeight)).toBeLessThan(1);
	await radio.check();
	await scene(page).getByRole('button', { name: 'Update selected record', exact: true }).focus();
	await scene(page).locator('en-table').evaluate((node: any) => { node.scrollElement.scrollTop = node.scrollElement.scrollHeight / 2; });
	await expect(radio).toHaveCount(0);
	expect(await table(page).locator('tbody tr').count()).toBeLessThan(80);
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Sparkle mark · sparkle-mark');
	await scene(page).getByRole('button', { name: 'Update selected record', exact: true }).click();
	await scene(page).getByRole('combobox', { name: 'Sort assets', exact: true }).selectOption('modified-descending');
	await search(page, 'nothing matches this asset');
	await expect(scene(page).getByText('No matching assets', { exact: true })).toBeVisible();
	await expect(scene(page).getByText('Your selected asset is outside the current results. It is still selected and can be inserted.', { exact: true })).toBeVisible();
	await scene(page).getByRole('button', { name: 'Show selected', exact: true }).click();
	await expect(table(page).getByRole('radio', { name: 'Sparkle mark', exact: true })).toBeChecked();
	await expect(table(page).getByText('Updated during this review. Its stable key and selection are preserved.', { exact: true })).toBeVisible();
	await scene(page).getByRole('button', { name: 'Insert selected asset', exact: true }).click();
	await expect(scene(page).locator('[data-assets-receipt]')).toHaveText('Insertion 1: Sparkle mark · sparkle-mark');
});

test('paginated Asset Browser retains complete page semantics, single selection and recoverable updates', async ({ page }) => {
	await openLarge(page);
	await scene(page).getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('paginated');
	await expect(table(page).locator('tbody tr')).toHaveCount(20);
	await expect(table(page)).toHaveAttribute('aria-rowcount', '21');
	await scene(page).getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(scene(page).getByText('Page 2 of 50', { exact: true }).filter({ visible: true })).toBeVisible();
	const radio = table(page).getByRole('radio').first();
	const name = await radio.getAttribute('value');
	await radio.check();
	const selection = await scene(page).locator('[data-assets-selected]').textContent();
	await scene(page).getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText(selection!);
	await expect(table(page).locator(`input[value="${name}"]`)).toHaveCount(0);
	await expect(table(page).locator('tbody tr')).toHaveCount(20);
	await scene(page).getByRole('button', { name: 'Update selected record', exact: true }).click();
	await scene(page).getByRole('button', { name: 'Show selected', exact: true }).click();
	await expect(table(page).getByRole('radio')).toBeChecked();
	await expect(table(page).getByRole('columnheader').filter({ has: page.getByRole('button', { name: 'Sort Name ascending', exact: true }) })).toBeVisible();
	await scene(page).getByRole('button', { name: 'Clear filters', exact: true }).click();
	await expect(table(page).locator('tbody tr')).toHaveCount(20);
	await expect(scene(page).getByText('Page 1 of 50', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('large table stays within a narrow RTL page with stable native selection geometry', async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openLarge(page);
	await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('rtl');
	const radio = table(page).getByRole('radio', { name: 'Sparkle mark', exact: true });
	const row = table(page).getByRole('row').filter({ has: page.getByRole('radio', { name: 'Sparkle mark', exact: true }) });
	const before = await row.boundingBox();
	await radio.check();
	expect(Math.abs((await row.boundingBox())!.height - before!.height)).toBeLessThan(1);
	const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
	expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
	await scene(page).locator('en-table').screenshot({ path: info.outputPath('asset-table-mobile-rtl.png') });
});
