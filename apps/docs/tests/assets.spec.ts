import { expect, test, type Locator, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const path = '/workflows/assets?progress-report';
const scene = (page: Page) => page.locator('[data-workflow="assets"]');
const group = (page: Page) => scene(page).getByRole('group', { name: 'Choose one asset', exact: true });
const list = (page: Page) => group(page).getByRole('list', { name: 'Available assets', exact: true });
const radio = (page: Page, name: string) => group(page).getByRole('radio', { name, exact: true });
const search = (page: Page) => scene(page).getByRole('searchbox', { name: 'Find assets', exact: true });
const button = (page: Page, name: string) => scene(page).getByRole('button', { name, exact: true });
const selected = (page: Page) => scene(page).locator('[data-assets-selected]');
const receipt = (page: Page) => scene(page).locator('[data-assets-receipt]');
const status = (page: Page) => scene(page).locator('[data-assets-status]');
const viewChoice = (page: Page, name: 'Grid' | 'List') => scene(page).locator('en-segmented-control[label="View"]').getByRole('radio', { name, exact: true });
const errors = new WeakMap<Page, string[]>();
const assetNames = ['Sparkle mark', 'Direction arrow', 'Approval check', 'Search symbol', 'Information symbol', 'Warning symbol', 'Campaign brief', 'Review checklist', 'Usage notes'];

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'No runtime errors in the asset workflow').toEqual([]); });
async function activate(target: Locator) { await target.focus(); await target.press('Enter'); }
async function choose(page: Page, name: string) {
	const target = radio(page, name); await target.focus(); await target.press('Space'); await expect(target).toBeChecked();
}
async function ready(page: Page) {
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-workflows-app').evaluate((node: any) => Boolean(node.hasUpdated))).toBe(true);
	await expect(scene(page)).toHaveCount(1);
	await expect(page.getByRole('heading', { name: 'Asset browser', exact: true })).toBeVisible();
	await expect(search(page)).toBeVisible();
}
async function open(page: Page) { await page.goto(path); await ready(page); }
async function settle(page: Page) {
	await page.evaluate(async () => {
		for (let pass = 0; pass < 3; pass++) {
			await Promise.resolve();
			await Promise.all([...document.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(node => node.updateComplete));
		}
	});
}
async function switchView(page: Page, name: 'Grid' | 'List') {
	const target = viewChoice(page, name); await target.focus(); await target.press('Space');
	await expect(target).toBeChecked(); await expect(target).toBeFocused();
	await expect(list(page)).toHaveAttribute('data-layout', name.toLowerCase());
}
async function expectSummary(page: Page, name: string, id: string) { await expect(selected(page)).toHaveText(`${name} · ${id}`); }

test('card radio focus follows the circular shared radio paint across themes and native selection', async ({ page }, info) => {
	await open(page);
	const target = radio(page, 'Sparkle mark');
	const original = await target.elementHandle();
	for (const appearance of ['light', 'dark']) {
		await page.emulateMedia({ forcedColors: 'none' });
		await page.setViewportSize({ width: appearance === 'dark' ? 390 : 1440, height: 1000 });
		const theme = page.locator('.theme-controls en-segmented-control[label="Theme"]').getByRole('radio', { name: appearance === 'dark' ? 'Dark' : 'Light', exact: true });
		await theme.focus(); await theme.press('Space');
		await expect(target).toHaveCSS('color-scheme', appearance);
		for (const forcedColors of ['none', 'active'] as const) {
			await page.emulateMedia({ forcedColors });
			await target.focus(); await expect(target).toBeFocused();
			await target.scrollIntoViewIfNeeded();
			const box = (await target.boundingBox())!;
			const screenshot = info.outputPath(`radio-focus-${appearance}-${forcedColors}.png`);
			await page.screenshot({ path: screenshot, clip: { x: box.x - 12, y: box.y - 12, width: box.width + 24, height: box.height + 24 } });
			await info.attach(`radio-focus-${appearance}-${forcedColors}`, { path: screenshot, contentType: 'image/png' });
			// A radius on appearance:auto still painted the reported square outline.
			await expect(target).toHaveCSS('appearance', 'none');
			await expect(target).toHaveCSS('outline-style', 'solid');
			const shape = await target.evaluate(node => {
				const css = getComputedStyle(node), box = node.getBoundingClientRect();
				return { width: box.width, height: box.height, radius: parseFloat(css.borderTopLeftRadius), outline: parseFloat(css.outlineWidth) };
			});
			expect(shape.width).toBe(shape.height); expect(shape.radius).toBeGreaterThanOrEqual(shape.width / 2); expect(shape.outline).toBeGreaterThan(0);
		}
	}
	await page.emulateMedia({ forcedColors: 'none' });
	await target.press('Space'); await expect(target).toBeChecked();
	await target.press('ArrowDown');
	await expect(radio(page, 'Direction arrow')).toBeChecked(); await expect(radio(page, 'Direction arrow')).toBeFocused();
	for (const layout of ['List', 'Grid'] as const) {
		await switchView(page, layout);
		await expect(radio(page, 'Direction arrow')).toBeChecked();
		expect(await target.evaluate((node, original) => node === original, original)).toBe(true);
	}
});

// No-JS validates the native entry surface, not a complete no-JS application.
test('SSR provides a native named radio collection, separate Preview actions and metadata before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage(); const response = await page.goto(path);
		expect(response?.ok()).toBe(true);
		await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
		await expect(group(page)).toBeVisible(); await expect(list(page)).toHaveCount(1);
		await expect(list(page).getByRole('listitem')).toHaveCount(9);
		await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(0);
		await expect(group(page).locator('[role="grid"],[role="listbox"]')).toHaveCount(0);
		for (const name of assetNames) {
			await expect(radio(page, name)).toBeVisible();
			const preview = button(page, `Preview ${name}`); await expect(preview).toBeVisible();
			expect(await preview.evaluate(node => node.closest('label') === null)).toBe(true);
		}
		const card = radio(page, 'Campaign brief').locator('xpath=ancestor::li[1]');
		expect(await card.locator('dt').allTextContents()).toEqual(['Type', 'Updated']);
		expect(await card.locator('dd').allTextContents()).toEqual(['Document', '2026-09-09']);
		await radio(page, 'Campaign brief').check(); await expect(radio(page, 'Campaign brief')).toBeChecked();
		await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(1);
		await expect(scene(page).locator('aside')).toBeHidden();
		await expect(status(page)).toHaveAttribute('role', 'status');
		expect(await list(page).getAttribute('aria-live')).toBeNull();
	} finally { await context.close(); }
});

test('hydration adopts an early native radio selection without replacing its card, focus or listener', async ({ page }) => {
	let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
	let scripts = 0;
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') { scripts++; await gate; }
		await route.continue();
	});
	try {
		await page.goto(path, { waitUntil: 'commit' });
		await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
		await expect.poll(() => scripts).toBeGreaterThan(0);
		const target = radio(page, 'Campaign brief');
		await target.focus(); await target.press('Space'); await expect(target).toBeChecked(); await expect(target).toBeFocused();
		const retained = await target.evaluateHandle(node => {
			const initial = { radio: node, item: node.closest('li'), card: node.closest('.en-file-card'), root: node.getRootNode(), changes: 0 };
			node.addEventListener('change', () => { initial.changes++; }); return initial;
		});
		release(); await ready(page);
		await expect(target).toBeChecked(); await expect(target).toBeFocused();
		await expectSummary(page, 'Campaign brief', 'campaign-brief');
		expect(await target.evaluate((node, original) => ({ radio: node === original.radio, item: node.closest('li') === original.item,
			card: node.closest('.en-file-card') === original.card, root: node.getRootNode() === original.root }), retained))
			.toEqual({ radio: true, item: true, card: true, root: true });
		await choose(page, 'Review checklist'); await choose(page, 'Campaign brief');
		expect(await retained.evaluate(initial => initial.changes)).toBe(1);
		await activate(button(page, 'Insert selected asset'));
		await expect(receipt(page)).toHaveText('Insertion 1: Campaign brief · campaign-brief');
		await retained.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('find and native keyboard selection survive Grid/List changes with the same keyed cards and controls', async ({ page, browserName }) => {
	await open(page);
	await scene(page).getByRole('combobox', { name: 'Asset type', exact: true }).selectOption('document');
	await expect(list(page).getByRole('listitem')).toHaveCount(3);
	await search(page).fill('review');
	await expect(radio(page, 'Campaign brief')).toBeVisible(); await expect(radio(page, 'Review checklist')).toBeVisible();
	await choose(page, 'Campaign brief'); await radio(page, 'Campaign brief').press('ArrowDown');
	await expect(radio(page, 'Review checklist')).toBeChecked(); await expect(radio(page, 'Review checklist')).toBeFocused();
	await expectSummary(page, 'Review checklist', 'review-checklist');
	// The next stop is a separate Preview button, not a second radio-group entry.
	await radio(page, 'Review checklist').press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(button(page, 'Preview Review checklist')).toBeFocused();
	const identities = await list(page).evaluateHandle(node => ({ list: node, items: [...node.children], radios: [...node.querySelectorAll('input[type="radio"]')] }));
	for (const layout of ['List', 'Grid'] as const) {
		await switchView(page, layout);
		await expect(radio(page, 'Review checklist')).toBeChecked();
		await expectSummary(page, 'Review checklist', 'review-checklist');
		expect(await list(page).evaluate((node, original) => node === original.list
			&& [...node.children].every((item, index) => item === original.items[index])
			&& [...node.querySelectorAll('input[type="radio"]')].every((input, index) => input === original.radios[index]), identities)).toBe(true);
	}
	await identities.dispose();
});

test('hidden selection remains explicit, zero matches preserve the search caret, and recovery never selects another asset', async ({ page }) => {
	await open(page); await choose(page, 'Campaign brief');
	await search(page).fill('no matching asset');
	await expect(search(page)).toBeFocused(); await expect(search(page)).toHaveValue('no matching asset');
	expect(await search(page).evaluate(node => [(node as HTMLInputElement).selectionStart, (node as HTMLInputElement).selectionEnd])).toEqual([17, 17]);
	await expect(group(page).getByRole('radio')).toHaveCount(0);
	await expect(scene(page).getByText('No matching assets', { exact: true })).toBeVisible();
	await expectSummary(page, 'Campaign brief', 'campaign-brief');
	await expect(scene(page).getByText('Your selected asset is outside the current results. It is still selected and can be inserted.', { exact: true })).toBeVisible();
	await expect(status(page)).toHaveText('');
	await activate(button(page, 'Show selected'));
	await expect(button(page, 'Show selected')).toBeFocused();
	await expect(search(page)).toHaveValue('Campaign brief');
	await expect(radio(page, 'Campaign brief')).toBeChecked(); await expect(list(page).getByRole('listitem')).toHaveCount(1);
	await activate(button(page, 'Clear selection'));
	await expect(button(page, 'Clear selection')).toBeFocused(); await expect(radio(page, 'Campaign brief')).not.toBeChecked();
	await expect(selected(page)).toHaveText('Choose an asset to insert.');
	await activate(button(page, 'Insert selected asset'));
	await expect(status(page)).toHaveText('Choose an asset before inserting.'); await expect(receipt(page)).toHaveText('No asset inserted.');
	await activate(button(page, 'Clear filters'));
	await expect(list(page).getByRole('listitem')).toHaveCount(9);
	await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(0);
});

test('Preview has explicit focus, stays independent of selection, and closes to its surviving opener or collection heading', async ({ page }) => {
	await open(page); await choose(page, 'Review checklist');
	const preview = button(page, 'Preview Campaign brief');
	await activate(preview);
	const heading = scene(page).getByRole('heading', { name: 'Preview: Campaign brief', exact: true });
	await expect(heading).toBeFocused(); await expect(scene(page).locator('aside')).toBeVisible();
	await expect(scene(page).locator('aside')).toHaveAccessibleName('Preview: Campaign brief');
	await expect(scene(page).locator('aside').getByText('Create a small set of launch materials. Keep headings editable, describe image choices, and include a narrow-screen layout. Share a first study with the project team.', { exact: true })).toBeVisible();
	await choose(page, 'Sparkle mark'); await expect(heading).toHaveText('Preview: Campaign brief');
	await expectSummary(page, 'Sparkle mark', 'sparkle-mark');
	await activate(button(page, 'Close preview')); await expect(preview).toBeFocused();
	await expect(scene(page).locator('aside')).toBeHidden();
	await preview.click(); await expect(heading).toBeFocused();
	await search(page).fill('sparkle'); await expect(search(page)).toBeFocused();
	await expect(preview).toHaveCount(0); await expect(heading).toBeVisible();
	await activate(button(page, 'Close preview'));
	await expect(scene(page).getByRole('heading', { name: 'Assets', exact: true })).toBeFocused();
	await expect(scene(page).locator('aside')).toBeHidden();
	await expectSummary(page, 'Sparkle mark', 'sparkle-mark');
});

test('Insert captures one asset, rejects duplicates while browsing continues, and Reset invalidates late completion', async ({ page }) => {
	await page.clock.install({ time: new Date('2030-01-01T10:00:00Z') });
	await open(page); await page.clock.pauseAt(new Date('2030-01-01T12:00:00Z'));
	try {
		await choose(page, 'Campaign brief');
		const insert = button(page, 'Insert selected asset');
		await activate(insert); await settle(page);
		await expect(insert).toBeFocused(); await expect(insert).toBeEnabled();
		await expect(scene(page).locator('[data-assets-pending]')).toHaveText('Inserting Campaign brief. You can continue browsing.');
		await insert.press('Enter'); await settle(page);
		await expect(status(page)).toHaveText('Already inserting Campaign brief.');
		await choose(page, 'Sparkle mark'); await expectSummary(page, 'Sparkle mark', 'sparkle-mark');
		await page.clock.runFor(800); await settle(page);
		await expect(receipt(page)).toHaveText('Insertion 1: Campaign brief · campaign-brief');
		await expect(status(page)).toHaveText('Campaign brief inserted locally. Insertion 1.');
		await expect(radio(page, 'Sparkle mark')).toBeFocused(); await expect(radio(page, 'Sparkle mark')).toBeChecked();
		await activate(insert); await page.clock.runFor(800); await settle(page);
		await expect(receipt(page)).toHaveText('Insertion 2: Sparkle mark · sparkle-mark');
		await activate(insert); await settle(page);
		const reset = page.getByRole('button', { name: 'Reset asset browser workflow', exact: true });
		await activate(reset); await settle(page); await page.clock.runFor(1000); await settle(page);
		await expect(reset).toBeFocused();
		await expect(receipt(page)).toHaveText('No asset inserted.');
		await expect(selected(page)).toHaveText('Choose an asset to insert.');
		await expect(search(page)).toHaveValue(''); await expect(list(page).getByRole('listitem')).toHaveCount(9);
		await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(0);
		await expect(scene(page).locator('[data-assets-pending]')).toHaveCount(0);
		await expect(status(page)).toHaveText('Asset browser reset. Filters, selection, preview and the insertion receipt are clear.');
	} finally { await page.clock.resume(); }
});

test('narrow enlarged RTL results remain selectable in both layouts with readable metadata and no horizontal overflow', async ({ page }, info) => {
	await page.setViewportSize({ width: 320, height: 900 }); await open(page);
	await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('rtl');
	await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
	await page.addStyleTag({ content: `html { font-size:32px; } .assets-workflow { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } .assets-workflow p { margin-block-end:2em!important; }` });
	await choose(page, 'Campaign brief');
	const measured = [];
	for (const layout of ['List', 'Grid'] as const) {
		await switchView(page, layout); await expect(radio(page, 'Campaign brief')).toBeChecked();
		const card = radio(page, 'Campaign brief').locator('xpath=ancestor::li[1]');
		const label = card.locator('label');
		const bounds = await label.evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
			client: node.clientWidth, scroll: node.scrollWidth }));
		expect(bounds.width).toBeGreaterThanOrEqual(24); expect(bounds.height).toBeGreaterThanOrEqual(24); expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
		await expect(card.locator('dt')).toHaveCount(2); await expect(card.locator('dd')).toHaveCount(2);
		await activate(button(page, 'Preview Campaign brief'));
		await expect(scene(page).getByRole('heading', { name: 'Preview: Campaign brief', exact: true })).toBeFocused();
		await activate(button(page, 'Close preview'));
		await expect(button(page, 'Preview Campaign brief')).toBeFocused();
		const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
		expect(overflow.document).toBeLessThanOrEqual(overflow.viewport + 1); measured.push({ layout, bounds, overflow });
	}
	const accessibility = await new AxeBuilder({ page }).include('[data-workflow="assets"]').analyze();
	expect(accessibility.violations).toEqual([]);
	await info.attach('asset-adaptation', { body: JSON.stringify(measured), contentType: 'application/json' });
});

test('filter surfaces share a centerline while labels and descriptions wrap, retaining native names and keyboard behavior', async ({ page }, info) => {
	await open(page);
	const filters = scene(page).locator('.assets-filters');
	const view = filters.locator('en-segmented-control');
	await expect(view).toMatchAriaSnapshot(`
		- group "View":
		  - text: View
		  - radio "Grid" [checked]
		  - text: Grid
		  - radio "List"
		  - text: List
		  - radio "Table"
		  - text: Table
	`);
	const editor = search(page);
	await editor.fill('Campaign');
	const original = await editor.elementHandle();
	// Slot content exercises real consumer markup and text wrapping rather than
	// assumed label heights. Both native labeling and description must survive.
	await filters.locator('en-select').evaluate(async (element: any) => {
		for (const [slot, text] of [
			['label', 'Asset type with a longer label that needs several lines'],
			['description', 'Choose which kinds of assets should appear in these search results. Supporting text can also wrap.'],
		]) {
			const content = document.createElement('span'); content.slot = slot; content.textContent = text; element.append(content);
		}
		await element.updateComplete;
	});
	await expect(filters.locator('en-select').getByRole('combobox')).toHaveAccessibleName('Asset type with a longer label that needs several lines');
	await expect(filters.locator('en-select').getByRole('combobox')).toHaveAccessibleDescription('Choose which kinds of assets should appear in these search results. Supporting text can also wrap.');
	const measurements: unknown[] = [];
	for (const direction of ['ltr', 'rtl']) {
		await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption(direction);
		for (const density of ['compact', 'comfortable', 'spacious']) {
			await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption(density);
			for (const width of [1500, 850, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				const boxes = await filters.evaluate(row => [...row.children].map(host => {
					const surface = host.shadowRoot!.querySelector(host.localName === 'en-segmented-control' ? '[part="options"]' : '[part~="control"]')!;
					const box = surface.getBoundingClientRect(), outer = host.getBoundingClientRect();
					const visibleContent = [surface, ...host.shadowRoot!.querySelectorAll('[part~="label"],[part~="description"]')]
						.map(node => node.getBoundingClientRect()).filter(rect => rect.height > 0);
					return { name: host.localName, row: outer.top, center: box.top + box.height / 2, height: box.height,
						bottom: outer.bottom, contentBottom: Math.max(...visibleContent.map(rect => rect.bottom)) };
				}));
				for (const box of boxes) for (const peer of boxes.filter(other => Math.abs(other.row - box.row) < 1)) {
					expect(Math.abs(box.center - peer.center), `${width}px ${density} ${direction}: ${box.name}/${peer.name}`).toBeLessThan(1);
				}
				// A visual row ends with its actual content. Shared alignment must not
				// leave a mirrored label-height spacer beneath an empty description.
				for (const box of boxes) {
					const peers = boxes.filter(other => Math.abs(other.row - box.row) < 1);
					expect(Math.max(...peers.map(peer => peer.bottom)) - Math.max(...peers.map(peer => peer.contentBottom)),
						`${width}px ${density} ${direction}: no empty trailing row space`).toBeLessThan(1);
				}
				if (width === 1500) expect(Math.max(...boxes.map(box => box.row)) - Math.min(...boxes.map(box => box.row))).toBeLessThan(1);
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
				await expect(editor).toHaveValue('Campaign');
				expect(await editor.evaluate((node, previous) => node === previous, original)).toBe(true);
				measurements.push({ width, density, direction, boxes });
			}
		}
	}
	await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('ltr');
	await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('comfortable');
	await page.setViewportSize({ width: 1500, height: 1000 });
	await view.getByRole('radio', { name: 'Grid', exact: true }).focus();
	await view.getByRole('radio', { name: 'Grid', exact: true }).press('ArrowRight');
	await expect(view.getByRole('radio', { name: 'List', exact: true })).toBeChecked();
	await expect(list(page)).toHaveAttribute('data-layout', 'list');
	await view.evaluate(async (element: any) => { element.disabled = true; await element.updateComplete; });
	await expect(view.getByRole('radio', { name: 'List', exact: true })).toBeDisabled();
	await expect(view.getByRole('radio', { name: 'Grid', exact: true })).toBeDisabled();
	await view.evaluate(async (element: any) => { element.disabled = false; await element.updateComplete; });
	await button(page, 'Clear filters').click(); await expect(editor).toHaveValue('');
	await expect(list(page).getByRole('listitem')).toHaveCount(9);
	await info.attach('filter-control-centers', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
	await filters.screenshot({ path: info.outputPath('filters-long-content.png') });
	await filters.locator('en-select').evaluate(element => element.replaceChildren());
	await filters.screenshot({ path: info.outputPath('filters-default.png') });
	await original?.dispose();
});
