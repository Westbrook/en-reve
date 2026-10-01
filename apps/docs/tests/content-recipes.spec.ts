import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('card hydration retains supplied regions and reconciles later slot changes', async ({ page }) => {
	let release!: () => void;
	const held = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') await held;
		await route.continue();
	});
	try {
		await page.goto('/api-examples/card.html', { waitUntil: 'commit' });
		const card = page.locator('[data-specimen="card"] en-card');
		const header = card.locator('[part="header"]');
		const footer = card.locator('[part="footer"]');
		await expect(header).toBeVisible();
		await expect(footer).toBeVisible();
		const before = await card.evaluateHandle(node => ({ node, root: node.shadowRoot, footer: node.querySelector('[slot="footer"]') }));
		const open = card.getByRole('button', { name: 'Open study', exact: true });
		await open.focus();
		release();
		await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect(header).toBeVisible();
		await expect(footer).toBeVisible();
		await expect(open).toBeFocused();
		expect(await card.evaluate((node, saved) => node === saved.node && node.shadowRoot === saved.root && node.querySelector('[slot="footer"]') === saved.footer, before)).toBe(true);
		await card.evaluate(node => { node.querySelector('[slot="footer"]')!.setAttribute('slot', 'header'); });
		await expect(footer).toBeHidden();
		await expect(header).toBeVisible();
		await card.evaluate(node => { for (const child of node.querySelectorAll('[slot="header"]')) child.remove(); });
		await expect(header).toBeHidden();
		await card.evaluate(node => {
			const action = document.createElement('button'); action.slot = 'footer'; action.textContent = 'New footer action';
			action.addEventListener('click', () => { action.textContent = 'Footer action complete'; });
			node.append(action);
		});
		await expect(footer).toBeVisible();
		await card.getByRole('button', { name: 'New footer action', exact: true }).click();
		await expect(card.getByRole('button', { name: 'Footer action complete', exact: true })).toBeVisible();
		await before.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('card empty regions add no phantom rows after hydration or client creation', async ({ page }) => {
	await page.goto('/showcase');
	await expect(page.getByRole('button', { name: 'Download JSON', exact: true })).toBeEnabled();
	const cards = page.locator('.showcase-card > en-card');
	await expect(cards).toHaveCount(16);
	for (const card of await cards.all()) {
		await expect(card.locator('.en-card__header')).toBeVisible();
		await expect(card.locator('.en-card__footer')).toBeHidden();
		const gap = await card.evaluate(node => {
			const base = node.shadowRoot!.querySelector('[part="base"]')!;
			const body = node.shadowRoot!.querySelector('[part="content"]')!;
			const style = getComputedStyle(base);
			return base.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth);
		});
		expect(Math.abs(gap)).toBeLessThanOrEqual(1);
	}
	await page.evaluate(() => {
		const card = document.createElement('en-card'); card.id = 'client-created-card';
		const body = document.createElement('p'); body.textContent = 'Client card content'; card.append(body); document.body.append(card);
	});
	const client = page.locator('#client-created-card');
	await expect(client.locator('[part="header"]')).toBeHidden();
	await expect(client.locator('[part="footer"]')).toBeHidden();
	await expect(client.getByText('Client card content', { exact: true })).toBeVisible();
});

const path = '/api-examples/content-recipes.html?progress-report';
const specimen = (page: Page) => page.locator('[data-specimen="content-recipes"]');
const collection = (page: Page) => specimen(page).getByRole('list', { name: 'Content samples', exact: true });
const sample = (page: Page, name: string) => specimen(page).getByRole('radio', { name, exact: true });
async function activate(target: Locator) { await target.focus(); await target.press('Enter'); }

test('content recipes render real styled lists and metadata with usable native labels before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage(); const response = await page.goto(path);
		expect(response?.ok()).toBe(true);
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		await expect(specimen(page)).toHaveCount(1);
		await expect(specimen(page).getByRole('group', { name: 'Choose one sample', exact: true })).toBeVisible();
		await expect(collection(page)).toHaveCSS('display', 'grid');
		await expect(collection(page).getByRole('listitem')).toHaveCount(3);
		await expect(specimen(page).locator('[role="grid"],[role="listbox"]')).toHaveCount(0);
		const card = sample(page, 'Campaign brief').locator('xpath=ancestor::li[1]');
		await expect(card.locator('dt')).toHaveText(['Format', 'ID']);
		await expect(card.locator('dd')).toHaveText(['Text excerpt', 'campaign-brief']);
		await sample(page, 'Campaign brief').check(); await expect(sample(page, 'Campaign brief')).toBeChecked();
		await expect(specimen(page).locator('[data-content-empty]')).toBeHidden();
		expect(await collection(page).getAttribute('aria-live')).toBeNull();
	} finally { await context.close(); }
});

test('the reusable recipe example retains native selection and identity across layout, scoped paint and empty-state recovery', async ({ page }) => {
	const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-api-example-app').evaluate((element: any) => Boolean(element.hasUpdated))).toBe(true);
	await expect(collection(page).getByRole('listitem')).toHaveCount(3);
	const target = sample(page, 'Campaign brief');
	await target.focus(); await target.press('Space'); await expect(target).toBeChecked();
	await expect(specimen(page).locator('[data-content-selection]')).toHaveText('Selected sample: Campaign brief (campaign-brief)');
	const initial = await collection(page).evaluateHandle(node => ({ collection: node, cards: [...node.querySelectorAll('.en-file-card')], items: [...node.children], radios: [...node.querySelectorAll('input[type="radio"]')] }));
	const originalBody = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
	await specimen(page).locator('.content-recipes-example').evaluate(node => (node as HTMLElement).style.setProperty('--en-card-background', 'rgb(238, 242, 250)'));
	for (const card of await collection(page).locator('.en-file-card').all()) await expect(card).toHaveCSS('background-color', 'rgb(238, 242, 250)');
	await expect(target).toBeFocused(); await expect(target).toBeChecked();
	expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(originalBody);
	const boxes = async () => Promise.all((await collection(page).getByRole('listitem').all()).map(item => item.boundingBox()));
	const grid = await boxes(); expect(Math.abs(grid[0]!.y - grid[1]!.y)).toBeLessThan(1);
	const layout = specimen(page).locator('en-select[label="Sample layout"]').getByRole('combobox');
	await layout.focus(); await layout.selectOption('list'); await expect(layout).toHaveValue('list');
	await expect(collection(page)).toHaveAttribute('data-layout', 'list');
	const rows = await boxes(); expect(rows[1]!.y).toBeGreaterThanOrEqual(rows[0]!.y + rows[0]!.height);
	expect(await collection(page).evaluate((node, before) => node === before.collection
		&& [...node.children].every((item, index) => item === before.items[index])
		&& [...node.querySelectorAll('input[type="radio"]')].every((radio, index) => radio === before.radios[index])
		&& [...node.querySelectorAll('.en-file-card')].every((card, index) => card === before.cards[index]), initial)).toBe(true);
	await expect(target).toBeChecked(); await expect(layout).toBeFocused();
	const empty = specimen(page).getByRole('button', { name: 'Show empty state', exact: true });
	await activate(empty); await expect(empty).toBeFocused();
	await expect(specimen(page).locator('[data-content-list]')).toBeHidden();
	await expect(specimen(page).getByText('No matching samples', { exact: true })).toBeVisible();
	await expect(specimen(page).getByRole('radio', { name: 'Campaign brief', exact: true })).toHaveCount(0);
	await expect(specimen(page).locator('[data-content-selection]')).toHaveText('Selected sample: Campaign brief (campaign-brief)');
	const restore = specimen(page).getByRole('button', { name: 'Show samples', exact: true });
	await activate(restore); await expect(restore).toBeFocused();
	await expect(target).toBeChecked(); await expect(collection(page)).toHaveAttribute('data-layout', 'list');
	expect(await target.evaluate((node, before) => node === before.radios[0], initial)).toBe(true);
	await initial.dispose();
	await page.setViewportSize({ width: 320, height: 844 });
	const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
	expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
	expect(errors).toEqual([]);
});


test('content loading preserves dimensions and selection, covers all states and removes busy controls from navigation', async ({ page }) => {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const root = specimen(page);
	const toggle = root.getByRole('checkbox', { name: 'Preview loading placeholders', exact: true });
	const radio = sample(page, 'Campaign brief');
	await radio.check();
	const before = await radio.evaluateHandle(node => node);
	const footprint = async () => root.locator('[data-content-loading-region]').evaluateAll(nodes => nodes.map(node => {
		const box = node.getBoundingClientRect(); return { width: box.width, height: box.height };
	}));
	const sizes = await footprint();
	await toggle.check();
	await expect(root.locator('[data-content-loading-region][aria-busy="true"]')).toHaveCount(5);
	await expect(radio).toBeHidden();
	await expect(root.locator('[data-content-ready][inert]')).toHaveCount(5);
	await toggle.focus(); await page.keyboard.press('Tab');
	await expect(root.locator('[data-content-ready]:focus-within')).toHaveCount(0);
	expect(await footprint()).toEqual(sizes);
	await expect(root.locator('[data-content-loading-status]')).toContainText('Loading preview');
	expect((await new AxeBuilder({ page }).include('[data-specimen="content-recipes"]').analyze()).violations).toEqual([]);
	for (const placeholder of await root.locator('.en-content-placeholder__skeleton').all()) await expect(placeholder).toHaveAttribute('aria-hidden', 'true');
	for (const skeleton of await root.locator('en-skeleton .en-skeleton').all()) await expect(skeleton).toHaveCSS('animation-name', 'none');
	await root.getByRole('button', { name: 'Show empty state', exact: true }).click();
	await expect(root.locator('[data-content-empty] .en-content-placeholder__skeleton').first()).toBeVisible();
	await toggle.uncheck();
	await expect(root.getByText('No matching samples', { exact: true })).toBeVisible();
	await expect(root.locator('[data-content-loading-region][aria-busy="true"]')).toHaveCount(0);
	await root.getByRole('button', { name: 'Restore sample catalog', exact: true }).click();
	await expect(radio).toBeChecked();
	expect(await radio.evaluate((node, original) => node === original, before)).toBe(true);
	await before.dispose();
	await root.getByRole('button', { name: 'Retry local preview', exact: true }).click();
	await expect(root.locator('[data-content-recovery-status]')).toHaveText('Preview restored');
	await root.getByRole('button', { name: 'Simulate unavailable preview', exact: true }).click();
	await expect(root.locator('[data-content-recovery-status]')).toHaveText('Preview could not load');
	await root.getByRole('button', { name: 'Create local collection', exact: true }).click();
	await expect(root.locator('[data-content-recovery-status]')).toHaveText('Review collection created');
	await root.getByRole('button', { name: 'Reset local collection', exact: true }).click();
	await expect(root.locator('[data-content-recovery-status]')).toHaveText('Start a review collection');
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(toggle).not.toBeChecked();
	await expect(root.locator('[data-content-ready][inert]')).toHaveCount(0);
});

test('content recipe actions align with the select control and fit a phone without label spacer rows', async ({ page }, info) => {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const controls = specimen(page).locator('[data-content-controls]');
	const select = controls.getByRole('combobox', { name: 'Sample layout' });
	const first = controls.getByRole('button', { name: 'Show empty state', exact: true });
	const second = controls.getByRole('button', { name: 'Show samples', exact: true });
	for (const [theme, title] of [['en-reve', 'en-reve'], ['spectrum-inspired', 'Spectrum'], ['fluent-inspired', 'Fluent'], ['astryx-inspired', 'Astryx'], ['shadcn-inspired', 'shadcn'], ['holotable-inspired', 'Holotable']]) {
		if (theme !== 'en-reve') {
			await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
			await expect(page.getByRole('status', { name: 'Theme result' })).toContainText(title);
			await expect(page.locator('style[data-example-theme]')).toHaveCount(1);
		}
		const boxes = await Promise.all([select, first, second].map(node => node.boundingBox()));
		const bottom = boxes[0]!.y + boxes[0]!.height;
		for (const box of boxes.slice(1)) expect(Math.abs(box!.y + box!.height - bottom)).toBeLessThanOrEqual(2);
	}
	await page.setViewportSize({ width: 320, height: 844 });
	await expect(first).toBeVisible(); await expect(second).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	const toggle = specimen(page).getByRole('checkbox', { name: 'Preview loading placeholders' });
	await toggle.check();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	await page.screenshot({ path: info.outputPath('content-loading-phone.png'), fullPage: true });
	await toggle.uncheck();
	await page.screenshot({ path: info.outputPath('content-recovery-phone.png'), fullPage: true });
});


test('loading fields match populated geometry through themes, layouts and narrow RTL', async ({ page }, info) => {
	// Six themes × two widths × two layouts, including font readiness and paired screenshots.
	test.setTimeout(60_000);
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const root = specimen(page);
	const toggle = root.getByRole('checkbox', { name: 'Preview loading placeholders', exact: true });
	const layout = root.getByRole('combobox', { name: 'Sample layout', exact: true });
	const equalGeometry = (actual: {x: number; y: number; width: number; height: number}[], expected: {x: number; y: number; width: number; height: number}[]) => {
		expect(actual).toHaveLength(expected.length);
		for (const [index, box] of actual.entries()) for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box[key] - expected[index][key])).toBeLessThanOrEqual(0.01);
	};
	const boxes = () => root.locator('.en-content-placeholder:visible, .en-file-card:visible, .en-file-card__media:visible').evaluateAll(nodes => nodes.map(node => {
		const box = node.getBoundingClientRect(); return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
	}));
	for (const theme of ['en-reve', 'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
		const themeSelect = page.getByRole('combobox', { name: 'Inspired theme', exact: true });
		await themeSelect.selectOption(theme);
		const titles: Record<string, string> = { 'spectrum-inspired': 'Spectrum 2-inspired', 'fluent-inspired': 'Fluent 2-inspired', 'astryx-inspired': 'Astryx-inspired', 'shadcn-inspired': 'shadcn/ui-inspired', 'holotable-inspired': 'Holotable-inspired' };
		if (theme === 'en-reve') await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		else await expect(page.getByRole('status', { name: 'Theme result' })).toHaveText(new RegExp(`^${titles[theme]}.*applied`));
		// Compare one settled font/theme presentation; loading fonts can otherwise
		// change both populated and placeholder geometry between measurements.
		await page.evaluate(async () => { await document.fonts.ready; });
		for (const width of [1280, 320]) {
			await page.setViewportSize({ width, height: 844 });
			await root.evaluate((node, width) => { (node as HTMLElement).dir = width === 320 ? 'rtl' : 'ltr'; }, width);
			for (const value of ['grid', 'list']) {
				await layout.selectOption(value);
				// Focus outside the composition first; native focus scrolling should not affect the comparison.
				await toggle.focus();
				const before = await boxes();
				if (theme === 'en-reve' && value === 'grid') await root.screenshot({ path: info.outputPath(`matched-content-${width}.png`) });
				await toggle.check();
				const after = await boxes();
				equalGeometry(after, before);
				const geometry = await root.locator('.en-content-placeholder:visible').evaluateAll(nodes => nodes.map(node => {
					const media = node.parentElement?.classList.contains('en-file-card__media') ? node.parentElement : null;
					const target = (media ?? node).getBoundingClientRect();
					const skeleton = node.querySelector('en-skeleton')!;
					const box = skeleton.getBoundingClientRect();
					const border = media ? parseFloat(getComputedStyle(media).borderTopWidth) : 0;
					return { dx: Math.abs(box.x - target.x - border), dy: Math.abs(box.y - target.y - border), dw: Math.abs(box.width - target.width + 2 * border), dh: Math.abs(box.height - target.height + 2 * border), lineHeight: getComputedStyle(skeleton).lineHeight, fieldLineHeight: getComputedStyle(node).lineHeight, mask: getComputedStyle(skeleton).maskImage, text: node.getAttribute('data-shape') === 'text' };
				}));
				expect(geometry.length).toBeGreaterThan(25);
				for (const item of geometry) {
					for (const error of [item.dx, item.dy, item.dw, item.dh]) expect(error).toBeLessThanOrEqual(1);
					if (item.text) { expect(item.mask).not.toBe('none'); expect(item.lineHeight).toBe(item.fieldLineHeight); }
				}
				if (theme === 'en-reve' && value === 'grid') await root.screenshot({ path: info.outputPath(`matched-loading-${width}.png`) });
				await toggle.uncheck();
				equalGeometry(await boxes(), before);
			}
		}
	}
});
