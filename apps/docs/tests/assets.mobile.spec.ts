import { expect, test, type Page } from '@playwright/test';

const scene = (page: Page) => page.locator('[data-workflow="assets"]');
const group = (page: Page) => scene(page).getByRole('group', { name: 'Choose one asset', exact: true });
const list = (page: Page) => group(page).getByRole('list', { name: 'Available assets', exact: true });
const radio = (page: Page, name: string) => group(page).getByRole('radio', { name, exact: true });
const search = (page: Page) => scene(page).getByRole('searchbox', { name: 'Find assets', exact: true });
const button = (page: Page, name: string) => scene(page).getByRole('button', { name, exact: true });
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'scope', description: 'Trusted taps with emulated touch/viewport. Text is inserted through Playwright; no OS keyboard or physical-device certification.' });
	await page.goto('/workflows/assets?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-workflows-app').evaluate((node: any) => Boolean(node.hasUpdated))).toBe(true);
	await expect(search(page)).toBeVisible();
	expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(true);
	// Desktop WebKit can report zero here while its touch driver is active.
	info.annotations.push({ type: 'reported-max-touch-points', description: String(await page.evaluate(() => navigator.maxTouchPoints)) });
});
test.afterEach(async ({ page }, info) => {
	expect(errors.get(page), 'No uncaught runtime errors in the touch journey').toEqual([]);
	const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, contentWidth: document.documentElement.scrollWidth, height: innerHeight }));
	expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.width + 1);
	await info.attach('emulated-viewport', { body: JSON.stringify(geometry), contentType: 'application/json' });
});

async function tapAsset(page: Page, name: string) {
	// Tap the native label's visible area, not a scripted checked/value write.
	const label = radio(page, name).locator('xpath=parent::label');
	const bounds = await label.boundingBox();
	expect(bounds).not.toBeNull();
	expect(bounds!.height).toBeGreaterThanOrEqual(44);
	const touches = await label.evaluateHandle(node => {
		const observed: { trusted: boolean; contacts: number }[] = [];
		node.addEventListener('touchstart', event => {
			observed.push({ trusted: event.isTrusted, contacts: (event as TouchEvent).touches.length });
		}, { once: true, passive: true });
		return observed;
	});
	try {
		await label.tap(); await expect(radio(page, name)).toBeChecked();
		expect(await touches.jsonValue(), 'The native asset label receives a trusted single-contact touch').toEqual([{ trusted: true, contacts: 1 }]);
	} finally { await touches.dispose(); }
}
async function find(page: Page, query: string) {
	await search(page).tap(); await search(page).fill(query);
	await expect(search(page)).toBeFocused(); await expect(search(page)).toHaveValue(query);
}
async function view(page: Page, name: 'Grid' | 'List') {
	const control = scene(page).locator('en-segmented-control[label="View"]');
	await control.getByText(name, { exact: true }).tap();
	await expect(control.getByRole('radio', { name, exact: true })).toBeChecked();
	await expect(list(page)).toHaveAttribute('data-layout', name.toLowerCase());
}

test('tap selection, layout, Preview and local insertion work on phone and tablet viewports', async ({ page }) => {
	await find(page, 'Campaign brief');
	await expect(list(page).getByRole('listitem')).toHaveCount(1);
	await tapAsset(page, 'Campaign brief');
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Campaign brief · campaign-brief');
	const original = await radio(page, 'Campaign brief').evaluateHandle(node => ({ radio: node, item: node.closest('li'), card: node.closest('.en-file-card') }));
	for (const layout of ['List', 'Grid'] as const) {
		await view(page, layout);
		await expect(radio(page, 'Campaign brief')).toBeChecked();
		expect(await radio(page, 'Campaign brief').evaluate((node, initial) => node === initial.radio && node.closest('li') === initial.item && node.closest('.en-file-card') === initial.card, original)).toBe(true);
	}
	const opener = button(page, 'Preview Campaign brief');
	await opener.tap();
	await expect(scene(page).getByRole('heading', { name: 'Preview: Campaign brief', exact: true })).toBeFocused();
	await expect(scene(page).locator('aside')).toBeVisible();
	await expect(scene(page).locator('aside')).toHaveAccessibleName('Preview: Campaign brief');
	await button(page, 'Close preview').tap();
	await expect(opener).toBeFocused(); await expect(scene(page).locator('aside')).toBeHidden();
	await button(page, 'Insert selected asset').tap();
	await expect(scene(page).locator('[data-assets-receipt]')).toHaveText('Insertion 1: Campaign brief · campaign-brief');
	await expect(scene(page).locator('[data-assets-status]')).toHaveText('Campaign brief inserted locally. Insertion 1.');
	await expect(radio(page, 'Campaign brief')).toBeChecked();
	await page.getByRole('button', { name: 'Reset asset browser workflow', exact: true }).tap();
	await expect(search(page)).toHaveValue('');
	await expect(list(page).getByRole('listitem')).toHaveCount(9);
	await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(0);
	await expect(scene(page).locator('[data-assets-receipt]')).toHaveText('No asset inserted.');
	await original.dispose();
});

test('touch filtering can hide the selected card and recover it without losing its identity value or Preview focus destination', async ({ page }) => {
	await tapAsset(page, 'Sparkle mark');
	await button(page, 'Preview Sparkle mark').tap();
	await expect(scene(page).getByRole('heading', { name: 'Preview: Sparkle mark', exact: true })).toBeFocused();
	await find(page, 'no matching asset');
	await expect(group(page).getByRole('radio')).toHaveCount(0);
	await expect(scene(page).getByText('No matching assets', { exact: true })).toBeVisible();
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Sparkle mark · sparkle-mark');
	await expect(scene(page).getByText('Your selected asset is outside the current results. It is still selected and can be inserted.', { exact: true })).toBeVisible();
	await expect(search(page)).toBeFocused();
	await button(page, 'Close preview').tap();
	await expect(scene(page).getByRole('heading', { name: 'Assets', exact: true })).toBeFocused();
	await expect(scene(page).locator('aside')).toBeHidden();
	await button(page, 'Show selected').tap();
	await expect(search(page)).toHaveValue('Sparkle mark');
	await expect(list(page).getByRole('listitem')).toHaveCount(1);
	await expect(radio(page, 'Sparkle mark')).toBeChecked();
	await button(page, 'Clear filters').tap();
	await expect(list(page).getByRole('listitem')).toHaveCount(9);
	await expect(radio(page, 'Sparkle mark')).toBeChecked();
	await button(page, 'Clear selection').tap();
	await expect(group(page).getByRole('radio', { checked: true })).toHaveCount(0);
	await expect(scene(page).locator('[data-assets-selected]')).toHaveText('Choose an asset to insert.');
	await button(page, 'Insert selected asset').tap();
	await expect(scene(page).locator('[data-assets-status]')).toHaveText('Choose an asset before inserting.');
	await expect(scene(page).locator('[data-assets-receipt]')).toHaveText('No asset inserted.');
});
