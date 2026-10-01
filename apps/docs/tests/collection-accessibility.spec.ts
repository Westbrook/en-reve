import { expect, test, type Page } from '@playwright/test';

const path = '/api-examples/virtual-collection.html?progress-report';
const demo = (page: Page) => page.locator('en-virtual-collection-demo');
const records = (page: Page) => demo(page).locator('[data-en-virtual-key], [data-record]');
const record = (page: Page, key: string) => demo(page).locator(`[data-en-virtual-key="${key}"], [data-record="${key}"]`);

async function open(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(demo(page)).toBeVisible();
}

// These inspect browser semantics and native input. They deliberately do not
// describe a DOM/ARIA assertion or Playwright snapshot as a screen-reader test.
test('windowed table metadata includes exposed header, records and summary without live scroll announcements', async ({ page }, info) => {
	await open(page);
	await demo(page).getByRole('checkbox', { name: 'Show table summary', exact: true }).check();
	const disclosure = demo(page).locator('details.scroll-demo');
	await disclosure.locator('summary').click();
	await demo(page).getByRole('textbox', { name: 'Asset key', exact: true }).fill('asset-09000');
	await demo(page).getByRole('button', { name: 'Show asset', exact: true }).click();
	await expect(record(page, 'asset-09000')).toBeInViewport();
	const table = demo(page).locator('table');
	await expect(table).toHaveAccessibleName('Windowed assets');
	await expect(table).toHaveAttribute('aria-rowcount', '10002');
	await expect(table.locator('thead tr')).toHaveAttribute('aria-rowindex', '1');
	await expect(record(page, 'asset-09000')).toHaveAttribute('aria-rowindex', '9001');
	await expect(table.locator('tfoot tr')).toHaveAttribute('aria-rowindex', '10002');
	const metadata = await table.evaluate(node => {
		const rows = [...node.querySelectorAll('tr')].filter(row => row.getAttribute('aria-hidden') !== 'true');
		return {
			indices: rows.map(row => Number(row.getAttribute('aria-rowindex'))),
			spacersHidden: [...node.querySelectorAll('[data-en-virtual-gap]')].every(row => row.getAttribute('aria-hidden') === 'true' && !row.querySelector('input,button,a[href],[tabindex]')),
			nativeCells: rows.every(row => [...row.children].every(cell => cell.localName === 'th' || cell.localName === 'td')),
			liveCollection: Boolean(node.closest('[aria-live],[role="status"],[role="alert"]')),
		};
	});
	expect(metadata.indices.every((index, position) => index >= 1 && index <= 10002 && (position === 0 || index > metadata.indices[position - 1]!))).toBe(true);
	expect(metadata.spacersHidden).toBe(true);
	expect(metadata.nativeCells).toBe(true);
	expect(metadata.liveCollection).toBe(false);
	await expect(table.locator('tbody tr[aria-selected]')).toHaveCount(0);
	await expect(table.getByRole('columnheader')).toHaveCount(3);
	await info.attach('logical-table-metadata', { body: JSON.stringify(metadata), contentType: 'application/json' });
});

for (const presentation of ['table', 'list'] as const) {
	test(`paginated ${presentation} keeps its complete page mounted through scrolling and removes print clipping`, async ({ page }, info) => {
		await open(page);
		await demo(page).getByRole('combobox', { name: 'Presentation', exact: true }).selectOption(presentation);
		const delivery = demo(page).getByRole('combobox', { name: 'Delivery', exact: true });
		await delivery.focus(); await delivery.selectOption('paginated');
		await expect(delivery).toBeFocused();
		await expect(records(page)).toHaveCount(20);
		await expect(record(page, 'asset-00021')).toHaveCount(0);
		const first = record(page, 'asset-00001');
		const identity = await first.evaluateHandle(node => node);
		const viewport = presentation === 'table'
			? demo(page).locator('en-table [part~="viewport"]')
			: demo(page).locator('[data-virtual-viewport]');
		await viewport.evaluate(node => { node.scrollTop = node.scrollHeight; });
		await expect(record(page, 'asset-00020')).toBeInViewport();
		await expect(records(page)).toHaveCount(20);
		expect(await first.evaluate((node, original) => node === original, identity)).toBe(true);
		await expect(demo(page).locator('[data-en-virtual-gap]')).toHaveCount(0);
		if (presentation === 'table') {
			await expect(demo(page).locator('table')).toHaveAccessibleName('Assets, page 1');
			await expect(demo(page).locator('table')).not.toHaveAttribute('aria-rowcount');
		} else {
			await expect(demo(page).locator('ul')).toHaveAttribute('role', 'list');
			await expect(demo(page).getByRole('list').getByRole('listitem')).toHaveCount(20);
		}
		await page.emulateMedia({ media: 'print' });
		await expect(viewport).toHaveCSS('overflow-y', 'visible');
		await expect(viewport).toHaveCSS('max-block-size', 'none');
		const printBounds = await viewport.evaluate(node => ({ client: node.clientHeight, scroll: node.scrollHeight }));
		expect(printBounds.scroll).toBeLessThanOrEqual(printBounds.client + 1);
		await expect(records(page)).toHaveCount(20);
		await info.attach('current-page-print-boundary', { body: JSON.stringify({ presentation, recordCount: 20, printBounds, scope: 'current page, not complete dataset' }), contentType: 'application/json' });
		await page.emulateMedia({ media: 'screen' });
		const next = demo(page).getByRole('button', { name: 'Next page', exact: true });
		await next.focus(); await next.press('Enter');
		await expect(next).toBeFocused();
		await expect(demo(page).getByRole('status').filter({ hasText: 'Page 2 of 500, assets 21–40.' })).toHaveCount(1);
		await expect(record(page, 'asset-00021')).toHaveCount(1);
		await expect(record(page, 'asset-00001')).toHaveCount(0);
		await expect(records(page)).toHaveCount(20);
		await identity.dispose();
	});
}

test('named native sort action exposes active header direction and retains keyboard focus', async ({ page }) => {
	await open(page);
	await demo(page).getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('paginated');
	const sort = demo(page).getByRole('button', { name: 'Sort name descending', exact: true });
	await sort.focus(); await sort.press('Enter');
	await expect(demo(page).getByRole('button', { name: 'Sort name ascending', exact: true })).toBeFocused();
	await expect(demo(page).locator('th[aria-sort="descending"]')).toHaveCount(1);
	await expect(records(page).first()).toHaveAttribute('data-record', 'asset-10000');
	await expect(demo(page).getByRole('status').filter({ hasText: 'Sorted by name descending.' })).toHaveCount(1);
	await demo(page).getByRole('button', { name: 'Sort name ascending', exact: true }).press('Space');
	await expect(demo(page).locator('th[aria-sort="ascending"]')).toHaveCount(1);
	await expect(records(page).first()).toHaveAttribute('data-record', 'asset-00001');
});

test('external deletion of a focused record recovers to the named collection instead of the document', async ({ page }) => {
	await open(page);
	const choice = record(page, 'asset-00001').getByRole('checkbox', { name: 'Select Asset 00001', exact: true });
	await choice.focus(); await choice.press('Space');
	await expect(choice).toBeChecked();
	// Application data may change without a preceding click on Remove selected.
	// Keep native focus on the row while exercising that same data-removal path.
	await demo(page).evaluate(async (node: HTMLElement & { removeSelected(): Promise<void> }) => { await node.removeSelected(); });
	await expect(record(page, 'asset-00001')).toHaveCount(0);
	await expect(demo(page).locator('en-table [part~="viewport"]')).toBeFocused();
	await expect(record(page, 'asset-00002')).toBeInViewport();
	await expect(demo(page).getByRole('status').filter({ hasText: 'asset-00001 was removed. Focus returned to the collection.' })).toHaveCount(1);
});

// A hidden, directly referenced plain label names the checkbox without adding
// a second readable text node. This checks the AX surface, not VoiceOver speech.
test('SSR compact selection exposes one named checkbox without separate label text', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	await page.goto(path);
	const selection = record(page, 'asset-00001').locator('en-checkbox');
	await expect.poll(() => selection.ariaSnapshot()).toBe('- checkbox "Select Asset 00001"');
	await context.close();
});

test('compact checkbox names update without duplicate text and retain native interaction', async ({ page }) => {
	await open(page);
	const selection = record(page, 'asset-00001').locator('en-checkbox');
	await expect.poll(() => selection.ariaSnapshot()).toBe('- checkbox "Select Asset 00001"');
	const control = selection.getByRole('checkbox', { name: 'Select Asset 00001', exact: true });
	const target = await selection.locator('[part=label]').boundingBox();
	expect(target!.width).toBeGreaterThanOrEqual(24);
	expect(target!.height).toBeGreaterThanOrEqual(24);
	await control.focus(); await page.keyboard.press('Space');
	await expect(control).toBeChecked(); await expect(control).toBeFocused();
	expect(await control.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
	await selection.evaluate(element => element.setAttribute('label', 'Select renamed asset'));
	await expect.poll(() => selection.ariaSnapshot()).toBe('- checkbox "Select renamed asset" [checked]');
	await selection.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	await page.keyboard.press('Space');
	await expect(selection.getByRole('checkbox')).toBeChecked();
	await expect(selection.getByRole('checkbox')).toBeFocused();
});

test('visible slotted labels retain formatting, decorative exclusions, fallback and description links', async ({ page }) => {
	await open(page);
	const selection = record(page, 'asset-00001').locator('en-checkbox');
	await selection.evaluate(element => {
		element.classList.remove('asset-selection');
		element.innerHTML = '<span slot="label">Select <strong>study</strong><span aria-hidden="true"> decorative star</span></span><span slot="description">Read <a href="#guidance">selection guidance</a>.</span>';
	});
	await expect(selection.getByRole('checkbox')).toHaveAccessibleName('Select study');
	await expect(selection.getByRole('link', { name: 'selection guidance' })).toBeVisible();
	await selection.locator('strong').click();
	await expect(selection.getByRole('checkbox')).toBeChecked();
	await selection.getByRole('link').focus(); await page.keyboard.press('Enter');
	await expect(selection.getByRole('checkbox')).toBeChecked();
	await selection.locator('[slot=label]').evaluate(element => element.remove());
	await expect(selection.getByRole('checkbox')).toHaveAccessibleName('Select Asset 00001');
});
