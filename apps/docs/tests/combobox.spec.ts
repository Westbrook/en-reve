import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('SSR combobox preserves its native input, focus and early query without changing the accepted project', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/', { waitUntil: 'commit' });
		const host = page.locator('[data-specimen="combobox"] en-combobox');
		const input = host.getByRole('combobox', { name: 'Project', exact: true });
		await expect(input).toHaveValue('Studio North');
		await expect(input).toHaveAttribute('aria-expanded', 'false');
		await expect(input).toHaveAccessibleDescription('Type to filter, then choose a project. Escape or leaving the field restores your current selection.');
		const original = await input.elementHandle();
		await input.fill('Studio');
		await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 4, 'backward'));
		release();
		await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
		await expect(input).toHaveValue('Studio');
		await expect(input).toBeFocused();
		expect(await input.evaluate((node, before) => ({ same: node === before, start: (node as HTMLInputElement).selectionStart, end: (node as HTMLInputElement).selectionEnd, direction: (node as HTMLInputElement).selectionDirection }), original)).toEqual({ same: true, start: 1, end: 4, direction: 'backward' });
		expect(await host.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe('studio-north');
		await expect(input).toHaveAttribute('aria-expanded', 'false');
		await input.press('Escape');
		await expect(input).toHaveValue('Studio North');
		await host.evaluate(element => {
			(element as HTMLElement & { label: string }).label = 'Fallback project';
			element.querySelector('[slot="label"]')!.remove();
		});
		await expect(host.getByRole('combobox', { name: 'Fallback project', exact: true })).toHaveValue('Studio North');
		expect(errors).toEqual([]);
	} finally { release(); }
});

test('the project specimen selects and submits an ID, exposes states and resets', async ({ page }) => {
	await page.goto('/?progress-report#fields');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	const specimen = page.locator('[data-specimen="combobox"]');
	const input = specimen.getByRole('combobox', { name: 'Project', exact: true });
	await input.scrollIntoViewIfNeeded();
	await input.fill('South');
	await input.press('ArrowDown');
	// Enter can accept only a presented option, after asynchronous popup placement.
	await expect(input).toHaveAttribute('aria-expanded', 'true');
	await expect(specimen.getByRole('option', { name: 'Studio South', exact: true })).toBeVisible();
	await input.press('Enter');
	await expect(input).toHaveValue('Studio South');
	await specimen.getByRole('button', { name: 'Use project', exact: true }).click();
	await expect(specimen.locator('output')).toHaveText('Submitted project: studio-south');
	await input.fill('zzzz');
	await expect(specimen.getByText('No matching options.', { exact: true })).toBeVisible();
	await input.press('Escape');
	await expect(input).toHaveValue('Studio South');
	await specimen.getByText('Try suggestion states', { exact: true }).click();
	const scenario = specimen.getByRole('combobox', { name: 'Suggestion state', exact: true });
	await scenario.selectOption('loading');
	await input.click();
	await input.press('ArrowDown');
	await expect(specimen.getByText('Loading options.', { exact: true })).toBeVisible();
	await scenario.selectOption('failed');
	await input.click();
	await input.press('ArrowDown');
	await expect(specimen.getByText('Projects could not be loaded. Use Retry to try again.', { exact: true })).toBeVisible();
	await specimen.getByRole('button', { name: 'Retry', exact: true }).click();
	await expect(input).toBeFocused();
	await expect(scenario).toHaveValue('ready');
	await specimen.getByRole('button', { name: 'Reset Find a project', exact: true }).click();
	await expect(input).toHaveValue('Studio North');
	await expect(specimen.locator('output')).toHaveText('No project submitted yet.');
});

test('the combobox inherits field geometry and remains usable in a narrow RTL sheet', async ({ page }) => {
	await page.goto('/?progress-report#fields');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	const specimen = page.locator('[data-specimen="combobox"]');
	const input = specimen.getByRole('combobox', { name: 'Project', exact: true });
	const field = page.locator('[data-specimen="text-fields"] en-text-field').first().locator('input');
	for (const rhythm of ['0.25', '0.5']) {
		await page.getByRole('combobox', { name: 'Layout rhythm', exact: true }).selectOption(rhythm);
		const boxes = await Promise.all([input.boundingBox(), field.boundingBox()]);
		expect(Math.abs(boxes[0]!.height - boxes[1]!.height)).toBeLessThan(1);
	}
	await page.getByRole('combobox', { name: 'Direction', exact: true }).selectOption('rtl');
	await page.setViewportSize({ width: 390, height: 844 });
	await input.scrollIntoViewIfNeeded();
	await input.fill('Studio');
	await input.press('ArrowDown');
	const popup = specimen.locator('[part="popup"]');
	await expect(popup).toBeVisible();
	const bounds = await popup.boundingBox();
	const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
		expect(viewport.overflow).toBe(false);
		expect(bounds!.x).toBeGreaterThanOrEqual(0);
		expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
		expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
	await expect(input).toBeFocused();
	const result = await new AxeBuilder({ page }).include('[data-specimen="combobox"]').analyze();
	expect(result.violations).toEqual([]);
});
