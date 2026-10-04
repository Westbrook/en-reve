import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createReviewDraft } from '@en-reve/tokens';
import { collectThemeCSSDeclarations } from '../../../packages/tokens/dist/css.js';
import AxeBuilder from '@axe-core/playwright';

const path = '/api-examples/authored-table.html?progress-report';

test('API inspector exposes table label and size in the isolated live demo', async ({ page }) => {
	await page.goto('/api-reference?component=en-table&progress-report');
	await expect(page.getByRole('heading', { name: 'en-table', exact: true })).toBeVisible();
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	const label = page.locator('.api-element-controls form[data-control="label"]');
	await label.getByRole('textbox', { name: 'label', exact: true }).fill('Design assets');
	await label.getByRole('button', { name: 'Apply label', exact: true }).click();
	const frame = page.frameLocator('.api-demo-frame');
	await expect(frame.getByRole('region', { name: 'Design assets', exact: true })).toBeVisible();
	await expect(frame.getByRole('table', { name: 'Project assets', exact: true })).toBeVisible();
	const size = page.locator('.api-element-controls form[data-control="size"]');
	await size.getByRole('combobox', { name: 'size', exact: true }).selectOption({ label: 'large' });
	await size.getByRole('button', { name: 'Apply size', exact: true }).click();
	await expect(frame.locator('#specimen-table')).toHaveAttribute('size', 'large');
});

test('authored table is styled and retains native relationships before hydration', async ({ page }) => {
	let release!: () => void;
	const held = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') await held;
		await route.continue();
	});
	try {
		await page.goto(path, { waitUntil: 'commit' });
		const table = page.getByRole('table', { name: 'Project assets', exact: true });
		await expect(table).toBeVisible();
		await expect(table.getByRole('columnheader')).toHaveCount(4);
		await expect(table.getByRole('rowheader')).toHaveCount(3);
		const before = await table.evaluateHandle(node => ({ table: node, row: node.querySelector('tbody tr'), root: node.parentElement!.shadowRoot }));
		const padding = await table.locator('tbody td').first().evaluate(node => getComputedStyle(node).paddingInlineStart);
		expect(parseFloat(padding)).toBeGreaterThan(0);
		const choice = table.getByRole('radio').first();
		await choice.focus();
		release();
		await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect(choice).toBeFocused();
		expect(await table.evaluate((node, saved) => node === saved.table && node.querySelector('tbody tr') === saved.row && node.parentElement!.shadowRoot === saved.root, before)).toBe(true);
		await expect(table.locator('tbody td').first()).toHaveCSS('padding-inline-start', padding);
		await before.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('table demo sorts keyed native rows, keeps one selection and resets', async ({ page }) => {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const table = page.getByRole('table', { name: 'Project assets', exact: true });
	const first = table.getByRole('radio', { name: 'Choose Campaign brief', exact: true });
	await first.check();
	const saved = await first.evaluateHandle(node => ({ choice: node, row: node.closest('tr') }));
	const sort = table.getByRole('button', { name: /^Sort Name / });
	await expect(sort).toHaveAccessibleName('Sort Name ascending');
	await expect(table.locator('en-button').filter({ has: page.getByRole('button', { name: /^Sort Name / }) })).toContainText('Sort Name');
	await sort.focus(); await sort.press('Enter');
	await expect(sort).toHaveAccessibleName('Sort Name descending');
	await expect(table.locator('thead [aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
	await sort.press('Space');
	await expect(sort).toHaveAccessibleName('Sort Name ascending');
	await expect(table.locator('thead [aria-sort]')).toHaveAttribute('aria-sort', 'descending');
	await expect(table.getByRole('rowheader')).toHaveText(['Sparkle mark', 'Review checklist', 'Campaign brief']);
	await expect(sort).toBeFocused();
	await expect(first).toBeChecked();
	const next = table.getByRole('radio', { name: 'Choose Sparkle mark', exact: true });
	await next.check(); await expect(first).not.toBeChecked();
	await expect(table.getByRole('radio', { checked: true })).toHaveCount(1);
	await table.getByRole('button', { name: 'Sort Updated ascending', exact: true }).click();
	await expect(next).toBeChecked();
	expect(await first.evaluate((node, before) => node === before.choice && node.closest('tr') === before.row, saved)).toBe(true);
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(table.getByRole('radio', { checked: true })).toHaveCount(0);
	await expect(table.locator('thead [aria-sort]')).toHaveCount(0);
	await expect(table.getByRole('rowheader')).toHaveText(['Campaign brief', 'Sparkle mark', 'Review checklist']);
	expect((await new AxeBuilder({ page }).include('[data-specimen="authored-table"]').analyze()).violations).toEqual([]);
	await saved.dispose();
});

test('table accepts all inspired theme palettes and local sizing without changing authored rows', async ({ page }) => {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const host = page.locator('#specimen-table');
	const table = host.locator('table');
	const cell = table.locator('tbody td').first();
	const choice = table.getByRole('radio').first();
	await choice.check();
	const saved = await table.evaluateHandle(node => node);
	const definitions = JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json', import.meta.url), 'utf8'));
	for (const family of ['spectrum', 'fluent', 'astryx', 'shadcn', 'radix', 'web-awesome', 'holotable']) {
		for (const mode of ['light', 'dark'] as const) {
			const edits = JSON.parse(await readFile(new URL(`../../../tooling/theme-candidates/inspired/${family}.${mode}.json`, import.meta.url), 'utf8'));
			const definition = definitions.find((item: { inputs: Record<string, string> }) => item.inputs[mode] === `inspired/${family}.${mode}.json`);
			expect(definition, `${family}/${mode} has its authoritative base`).toBeDefined();
			const draft = createReviewDraft(definition.baseOptions[mode]);
			for (const edit of edits) {
				if (edit.type === 'token') draft.setToken(edit.id, edit.value);
				else if (edit.type === 'context') draft.setContext({ ...(edit.mode ? { mode: edit.mode } : {}), ...(edit.density ? { density: edit.density } : {}) });
			}
			await page.locator('html').evaluate((node, values) => {
				for (const [name, value] of values) node.style.setProperty(name, value);
			}, [...collectThemeCSSDeclarations(draft.theme)]);
			await expect(choice).toBeChecked();
			// Settle the new palette's font layout before measuring selection geometry.
			await table.evaluate(async node => {
				node.getBoundingClientRect();
				await node.ownerDocument.fonts.ready;
			});
			const heights = () => table.locator('tbody tr').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().height));
			const beforeSelection = await heights();
			await table.getByRole('radio').nth(1).check();
			expect(await heights()).toEqual(beforeSelection);
			await choice.check();
			expect(await heights()).toEqual(beforeSelection);
			const colors = await table.evaluate(node => ({ actual: getComputedStyle(node).color, token: getComputedStyle(node).getPropertyValue('--en-color-text').trim() }));
			expect(colors.actual).not.toBe(''); expect(colors.token).not.toBe('');
			expect(await table.evaluate((node, before) => node === before, saved)).toBe(true);
		}
	}
	await host.evaluate(node => node.setAttribute('size', 'small'));
	const small = await cell.evaluate(node => parseFloat(getComputedStyle(node).paddingInlineStart));
	await host.evaluate(node => node.setAttribute('size', 'large'));
	await expect.poll(() => cell.evaluate(node => parseFloat(getComputedStyle(node).paddingInlineStart))).toBeGreaterThan(small);
	await host.evaluate(node => { node.removeAttribute('size'); node.style.setProperty('--en-table-cell-inline-padding', '23px'); });
	await expect(cell).toHaveCSS('padding-inline-start', '23px');
	await saved.dispose();
});

// An inline-grid radio's checked dot must not change its synthesized baseline
// and thereby alter the native table cell's line box.
test('authored inline radio selection never changes row or cell dimensions', async ({ page }) => {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const table = page.getByRole('table', { name: 'Project assets', exact: true });
	const dimensions = () => table.locator('tbody tr').evaluateAll(rows => rows.map(row => ({
		height: row.getBoundingClientRect().height,
		cells: [...row.children].map(cell => ({ width: cell.getBoundingClientRect().width, height: cell.getBoundingClientRect().height })),
	})));
	const before = await dimensions();
	for (const name of ['Choose Campaign brief', 'Choose Sparkle mark', 'Choose Review checklist']) {
		const radio = table.getByRole('radio', { name, exact: true });
		await radio.focus(); await radio.press('Space');
		await expect(radio).toBeChecked();
		expect(await dimensions()).toEqual(before);
	}
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(table.getByRole('radio', { checked: true })).toHaveCount(0);
	expect(await dimensions()).toEqual(before);
});
