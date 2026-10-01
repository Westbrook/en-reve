import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const scene = (page: Page) => page.locator('[data-workflow="assets"]');
const choices = (page: Page) => scene(page).getByRole('group', { name: 'Choose one asset', exact: true });
const collection = (page: Page) => choices(page).getByRole('list', { name: 'Available assets', exact: true });
const preview = (page: Page, name: string) => scene(page).getByRole('button', { name: `Preview ${name}`, exact: true });
const selection = (page: Page, name: string) => choices(page).getByRole('radio', { name, exact: true });
const failures = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; failures.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	await page.goto('/workflows/assets?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-workflows-app').evaluate((node: any) => Boolean(node.hasUpdated))).toBe(true);
});
test.afterEach(async ({ page }) => { expect(failures.get(page)).toEqual([]); });

async function switchView(page: Page, name: 'Grid' | 'List' | 'Table') {
	const control = scene(page).locator('en-segmented-control[label="View"]').getByRole('radio', { name, exact: true });
	await control.focus(); await control.press('Space');
	await expect(control).toBeChecked(); await expect(control).toBeFocused();
}

function card(page: Page, name: string) {
	return collection(page).getByRole('listitem').filter({ has: page.getByRole('radio', { name, exact: true }) });
}

// Geometry assertions exercise the rendered row rather than assuming a specific
// CSS implementation. A viewport change must not replace a focused action.
test('List uses compact media/content/action rows while Grid/List retain their keyed controls', async ({ page }, info) => {
	await page.setViewportSize({ width: 1600, height: 1000 });
	const target = preview(page, 'Campaign brief');
	await target.focus(); await expect(target).toBeFocused();
	const retained = await target.evaluateHandle(node => ({ action: node, item: node.closest('li'), card: node.closest('.en-file-card') }));
	const gridMedia = await card(page, 'Campaign brief').locator('.en-file-card__media').boundingBox();
	await switchView(page, 'List');
	await expect(collection(page)).toHaveAttribute('data-layout', 'list');
	const item = card(page, 'Campaign brief');
	const boxes = await item.evaluate(node => {
		const rect = (selector: string) => {
			const r = node.querySelector(selector)!.getBoundingClientRect();
			return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
		};
		return { media: rect('.en-file-card__media'), content: rect('.en-file-card__body'), actions: rect('.en-file-card__actions') };
	});
	expect(boxes.media.right).toBeLessThanOrEqual(boxes.content.x);
	expect(boxes.content.right).toBeLessThanOrEqual(boxes.actions.x);
	expect(boxes.actions.y).toBeLessThan(boxes.content.bottom);
	expect(boxes.media.height).toBeLessThan(gridMedia!.height);
	expect(Math.abs(boxes.media.width - boxes.media.height)).toBeLessThan(1);
	expect(await target.evaluate((node, previous) => node === previous.action && node.closest('li') === previous.item && node.closest('.en-file-card') === previous.card, retained)).toBe(true);
	await target.focus();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(target).toBeFocused();
	await page.setViewportSize({ width: 1600, height: 1000 });
	await expect(target).toBeFocused();
	await info.attach('compact-list-geometry', { body: JSON.stringify(boxes, null, 2), contentType: 'application/json' });
	await item.screenshot({ path: info.outputPath('compact-list-row.png') });
	await switchView(page, 'Grid');
	expect(await target.evaluate((node, previous) => node === previous.action && node.closest('li') === previous.item, retained)).toBe(true);
	await retained.dispose();
});

test('compact List retains metadata and usable actions at 320px in RTL', async ({ page }, info) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('rtl');
	await switchView(page, 'List');
	const item = card(page, 'Campaign brief');
	await expect(item.locator('dt')).toHaveText(['Type', 'Updated']);
	await expect(item.locator('dd')).toHaveText(['Document', '2026-09-09']);
	for (const detail of await item.locator('dt, dd').all()) await expect(detail).toBeVisible();
	await selection(page, 'Campaign brief').check();
	await preview(page, 'Campaign brief').focus();
	await preview(page, 'Campaign brief').press('Enter');
	await expect(scene(page).getByRole('heading', { name: 'Preview: Campaign brief', exact: true })).toBeFocused();
	await scene(page).getByRole('button', { name: 'Close preview', exact: true }).click();
	await expect(preview(page, 'Campaign brief')).toBeFocused();
	await expect(selection(page, 'Campaign brief')).toBeChecked();
	const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
	expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
	await item.screenshot({ path: info.outputPath('compact-list-rtl-320.png') });
});

test('native Table sorting retains selection and the independent preview across view changes', async ({ page }) => {
	await selection(page, 'Campaign brief').check();
	await preview(page, 'Review checklist').click();
	const previewHeading = scene(page).getByRole('heading', { name: 'Preview: Review checklist', exact: true });
	await expect(previewHeading).toBeFocused();
	await switchView(page, 'Table');
	const table = choices(page).getByRole('table', { name: 'Available assets', exact: true });
	await expect(table).toBeVisible();
	await expect(table.getByRole('row')).toHaveCount(10);
	await expect(table.getByRole('columnheader')).toHaveCount(4);
	expect(await table.evaluate(node => ({ tag: node.localName, caption: node.querySelector('caption')?.textContent?.trim(),
		head: node.querySelectorAll('thead > tr > th[scope="col"]').length, rows: node.querySelectorAll('tbody > tr').length })))
		.toEqual({ tag: 'table', caption: 'Available assets', head: 4, rows: 9 });
	await expect(selection(page, 'Campaign brief')).toBeChecked();
	await expect(previewHeading).toBeVisible();
	const sort = table.getByRole('button', { name: /^Sort Name / });
	await expect(sort).toHaveAccessibleName('Sort Name ascending');
	await expect(table.locator('en-button').filter({ has: page.getByRole('button', { name: /^Sort Name / }) })).toContainText('Sort Name');
	await sort.focus(); await sort.press('Enter');
	await expect(sort).toHaveAccessibleName('Sort Name descending');
	await expect(table.getByRole('columnheader').filter({ has: page.getByRole('button', { name: /^Sort Name / }) })).toHaveAttribute('aria-sort', 'ascending');
	await expect(table.locator('tbody tr').first().getByRole('radio')).toHaveAccessibleName('Approval check');
	await sort.press('Space');
	await expect(sort).toHaveAccessibleName('Sort Name ascending');
	await expect(sort).toBeFocused();
	await expect(table.getByRole('columnheader').filter({ has: page.getByRole('button', { name: /^Sort Name / }) })).toHaveAttribute('aria-sort', 'descending');
	await expect(table.locator('tbody tr').first().getByRole('radio')).toHaveAccessibleName('Warning symbol');
	await expect(selection(page, 'Campaign brief')).toBeChecked();
	await expect(previewHeading).toBeVisible();
	await scene(page).getByRole('button', { name: 'Close preview', exact: true }).click();
	await expect(preview(page, 'Review checklist')).toBeFocused();
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Campaign brief · campaign-brief');
	await switchView(page, 'List');
	await expect(selection(page, 'Campaign brief')).toBeChecked();
	await expect(collection(page).getByRole('listitem').first().getByRole('radio')).toHaveAccessibleName('Warning symbol');
	await switchView(page, 'Table');
	const scan = await new AxeBuilder({ page }).include('[data-workflow="assets"]').analyze();
	expect(scan.violations).toEqual([]);
});

test('narrow RTL Table exposes a named keyboard scroll region without widening the page', async ({ page, browserName }, info) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('rtl');
	await switchView(page, 'Table');
	const region = scene(page).getByRole('region', { name: 'Assets', exact: true });
	await expect(region).toBeVisible();
	await expect(region).toHaveAttribute('tabindex', '0');
	await region.focus(); await expect(region).toBeFocused();
	const before = await region.evaluate(node => ({ x: node.scrollLeft, client: node.clientWidth, scroll: node.scrollWidth }));
	expect(before.scroll).toBeGreaterThan(before.client);
	// WebKit's native scroll region uses Option+Arrow for horizontal keyboard scrolling.
	await region.press(browserName === 'webkit' ? 'Alt+ArrowLeft' : 'ArrowLeft');
	await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeLessThan(before.x);
	await expect(region).toBeFocused();
	// The native table is slotted light DOM, outside the shadow region's DOM subtree.
	const table = choices(page).getByRole('table', { name: 'Available assets', exact: true });
	await expect(table.getByRole('columnheader')).toHaveCount(4);
	await selection(page, 'Campaign brief').check();
	await expect(selection(page, 'Campaign brief')).toBeChecked();
	const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
	expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
	await region.screenshot({ path: info.outputPath('table-rtl-scroll-320.png') });
});

// Selecting and clearing rows may change paint, but must not change inline
// baseline geometry or move later rows. This exercises both checked states.
test('Table row and cell dimensions stay stable while selection moves and clears', async ({ page }) => {
	await switchView(page, 'Table');
	const table = choices(page).getByRole('table', { name: 'Available assets', exact: true });
	const dimensions = () => table.locator('tbody tr').evaluateAll(rows => rows.map(row => ({
		height: row.getBoundingClientRect().height,
		cells: [...row.children].map(cell => ({ width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height })),
	})));
	const before = await dimensions();
	for (const name of ['Campaign brief', 'Sparkle mark', 'Usage notes']) {
		await selection(page, name).check();
		await expect(selection(page, name)).toBeChecked();
		expect(await dimensions()).toEqual(before);
	}
	await scene(page).getByRole('button', { name: 'Clear selection', exact: true }).click();
	await expect(table.getByRole('radio', { checked: true })).toHaveCount(0);
	expect(await dimensions()).toEqual(before);
});
