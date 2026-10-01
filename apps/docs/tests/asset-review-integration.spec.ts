import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'Review pages and their frames have no uncaught runtime errors').toEqual([]); });

test('the API content recipe iframe owns appearance, density and reset without changing its parent or replacing active samples', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/api-reference?component=en-button&progress-report#api-content-recipes');
	await expect(page.locator('en-api-reference-app')).not.toHaveAttribute('data-ssr');
	const parentSearch = page.getByRole('searchbox', { name: 'Find a component', exact: true });
	await parentSearch.fill('button');
	const parentBefore = await page.locator('body').evaluate(body => ({
		background: getComputedStyle(body).backgroundColor,
		appearance: document.documentElement.getAttribute('data-en-appearance'),
	}));
	const iframe = page.locator('#api-content-recipes iframe.api-content-demo');
	await expect(iframe).toHaveAttribute('src', '/api-examples/content-recipes.html');
	await expect(iframe).toHaveAttribute('title', 'Layout and content recipes live example');
	await iframe.scrollIntoViewIfNeeded();
	const frame = page.frameLocator('#api-content-recipes iframe.api-content-demo');
	await expect(frame.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(frame.locator('html')).toHaveAttribute('data-example-standalone', '');
	const tools = frame.getByRole('group', { name: 'Review controls', exact: true });
	const appearance = tools.getByRole('combobox', { name: 'Appearance', exact: true });
	const density = tools.getByRole('combobox', { name: 'Density', exact: true });
	const specimen = frame.locator('[data-specimen="content-recipes"]');
	const sample = specimen.getByRole('radio', { name: 'Campaign brief', exact: true });
	const layout = specimen.getByRole('combobox', { name: 'Sample layout', exact: true });
	await sample.focus(); await sample.press('Space'); await expect(sample).toBeChecked();
	await layout.selectOption('list');
	const initial = await sample.evaluateHandle(node => ({ radio: node, item: node.closest('li'), document: node.ownerDocument }));
	const initialFrame = await iframe.elementHandle();
	await appearance.selectOption('light');
	await expect(frame.locator('html')).toHaveAttribute('data-example-mode', 'light');
	const lightBackground = await frame.locator('body').evaluate(body => getComputedStyle(body).backgroundColor);
	await appearance.selectOption('dark');
	await expect(frame.locator('html')).toHaveAttribute('data-example-mode', 'dark');
	await expect.poll(() => frame.locator('body').evaluate(body => getComputedStyle(body).backgroundColor)).not.toBe(lightBackground);
	const heights: number[] = [];
	for (const value of ['compact', 'comfortable', 'spacious']) {
		await density.selectOption(value);
		await expect(frame.locator('html')).toHaveAttribute('data-example-density', value);
		await expect(sample).toBeChecked();
		await expect(layout).toHaveValue('list');
		await expect(specimen.locator('[data-content-selection]')).toHaveText('Selected sample: Campaign brief (campaign-brief)');
		expect(await sample.evaluate((node, previous) => node === previous.radio && node.closest('li') === previous.item && node.ownerDocument === previous.document, initial)).toBe(true);
		heights.push(await layout.evaluate(node => node.getBoundingClientRect().height));
	}
	expect(heights[0]).toBeLessThan(heights[2]!);
	await expect(page.locator('body')).toHaveCSS('background-color', parentBefore.background);
	expect(await page.locator('html').getAttribute('data-en-appearance')).toBe(parentBefore.appearance);
	await expect(parentSearch).toHaveValue('button');
	await expect(page.getByRole('heading', { name: 'en-button', exact: true })).toBeVisible();
	const reset = tools.getByRole('button', { name: 'Reset example', exact: true });
	await reset.focus(); await reset.press('Enter');
	await expect(reset).toBeFocused();
	await expect(sample).not.toBeChecked(); await expect(layout).toHaveValue('grid');
	await expect(specimen.locator('[data-content-selection]')).toHaveText('No sample selected.');
	expect(await sample.evaluate((node, previous) => node !== previous.radio && node.ownerDocument === previous.document, initial)).toBe(true);
	expect(await iframe.evaluate((node, previous) => node === previous, initialFrame)).toBe(true);
	await expect(appearance).toHaveValue('dark'); await expect(density).toHaveValue('spacious');
	await expect(frame.locator('html')).toHaveAttribute('data-example-mode', 'dark');
	await expect(frame.locator('html')).toHaveAttribute('data-example-density', 'spacious');
	await expect(parentSearch).toHaveValue('button');
	await initial.dispose(); await initialFrame?.dispose();
});

test('Theme Review loads the assets case in two isolated frames and keeps candidate selection through token and direction changes', async ({ page }) => {
	await page.goto('/theme-review?progress-report');
	await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
	const pageChoice = page.getByRole('combobox', { name: 'Preview page', exact: true });
	await pageChoice.selectOption('assets'); await expect(pageChoice).toHaveValue('assets');
	await page.getByRole('button', { name: 'Load previews', exact: true }).click();
	const baseline = page.frameLocator('iframe[title="Baseline preview"]');
	const candidate = page.frameLocator('iframe[title="Candidate preview"]');
	for (const frame of [baseline, candidate]) {
		await expect(frame.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
		await expect(frame.locator('[data-workflow]')).toHaveCount(1);
		await expect(frame.locator('[data-workflow="assets"]')).toBeVisible();
		await expect(frame.getByRole('list', { name: 'Available assets', exact: true }).getByRole('listitem')).toHaveCount(9);
	}
	await expect(page.locator('iframe[title="Candidate preview"]')).toHaveAttribute('src', '/workflows/assets?theme-preview');
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
	const selected = candidate.getByRole('radio', { name: 'Campaign brief', exact: true });
	await selected.focus(); await selected.press('Space'); await expect(selected).toBeChecked();
	await expect(candidate.locator('[data-assets-selected]')).toHaveText('Campaign brief · campaign-brief');
	const original = await selected.evaluateHandle(node => ({ radio: node, item: node.closest('li'), document: node.ownerDocument }));
	const baselineRadius = await baseline.locator('html').evaluate(node => getComputedStyle(node).getPropertyValue('--en-radius-control').trim());
	const parentDirection = await page.locator('html').getAttribute('dir');
	await page.getByRole('searchbox', { name: 'Find a token', exact: true }).fill('radius.control');
	await page.getByRole('combobox', { name: 'Token', exact: true }).selectOption('radius.control');
	const editor = page.getByRole('form', { name: 'Token editor', exact: true });
	await editor.getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '1rem' });
	await editor.getByRole('button', { name: 'Apply pin', exact: true }).click();
	await expect.poll(() => candidate.locator('html').evaluate(node => getComputedStyle(node).getPropertyValue('--en-radius-control').trim())).toBe('1rem');
	await page.getByRole('combobox', { name: 'Preview reading direction', exact: true }).selectOption('rtl');
	await expect(candidate.locator('html')).toHaveAttribute('dir', 'rtl');
	await expect(baseline.locator('html')).toHaveAttribute('dir', 'rtl');
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
	await expect(selected).toBeChecked();
	expect(await selected.evaluate((node, previous) => node === previous.radio && node.closest('li') === previous.item && node.ownerDocument === previous.document, original)).toBe(true);
	await expect(baseline.getByRole('group', { name: 'Choose one asset', exact: true }).getByRole('radio', { checked: true })).toHaveCount(0);
	await expect(baseline.locator('[data-assets-selected]')).toHaveText('Choose an asset to insert.');
	expect(await baseline.locator('html').evaluate(node => getComputedStyle(node).getPropertyValue('--en-radius-control').trim())).toBe(baselineRadius);
	expect(await page.locator('html').getAttribute('dir')).toBe(parentDirection);
	await candidate.getByRole('button', { name: 'Insert selected asset', exact: true }).click();
	await expect(candidate.locator('[data-assets-receipt]')).toHaveText('Insertion 1: Campaign brief · campaign-brief');
	await expect(baseline.locator('[data-assets-receipt]')).toHaveText('No asset inserted.');
	await original.dispose();
});
