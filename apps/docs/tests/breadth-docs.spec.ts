import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openExample(page: Page, id: string) {
	await page.goto(`/api-examples/${id}.html?progress-report`);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(page.getByRole('button', { name: 'Reset example', exact: true })).toBeVisible();
}

test('menu choices update the preview, cancel changes and reset together', async ({ page }) => {
	await openExample(page, 'menu-choices');
	await page.getByRole('button', { name: 'Preview options', exact: true }).click();
	const background = page.getByRole('menuitemcheckbox', { name: 'Include background' });
	await background.click();
	await expect(background).not.toBeChecked();
	await expect(page.locator('[data-menu-result]')).toHaveText('Portrait preview; background excluded.');
	await page.getByRole('menuitemradio', { name: 'Landscape', exact: true }).click();
	await expect(page.getByRole('menuitemradio', { name: 'Portrait', exact: true })).not.toBeChecked();
	await expect(page.locator('[data-menu-result]')).toHaveText('Landscape preview; background excluded.');
	await page.keyboard.press('Escape');
	await page.getByRole('checkbox', { name: 'Hold preview settings' }).check();
	await page.getByRole('button', { name: 'Preview options', exact: true }).click();
	await background.click(); await expect(background).not.toBeChecked();
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(page.locator('[data-menu-result]')).toHaveText('Portrait preview; background included.');
	await expect(page.getByRole('checkbox', { name: 'Hold preview settings' })).not.toBeChecked();
});

test('nested menu supports keyboard entry, one-level Escape and accepted action', async ({ page }) => {
	await openExample(page, 'menu-choices');
	await page.getByRole('button', { name: 'Preview options', exact: true }).click();
	const trigger = page.getByRole('menuitem', { name: 'Export', exact: true });
	await trigger.focus(); await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('menuitem', { name: 'PNG', exact: true })).toBeFocused();
	await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await page.getByRole('menuitem', { name: 'SVG', exact: true }).click();
	await expect(page.locator('[data-menu-result]')).toHaveText('SVG export requested locally. No file is generated.');
	await expect(page.getByRole('button', { name: 'Preview options', exact: true })).toBeFocused();
});

test('content recipes retain selected controls across layout and provide direct recovery', async ({ page }) => {
	await openExample(page, 'content-recipes');
	await page.getByRole('radio', { name: 'Campaign brief', exact: true }).check();
	const selected = await page.getByRole('radio', { name: 'Campaign brief', exact: true }).evaluateHandle(node => node);
	try {
		await page.getByRole('combobox', { name: 'Sample layout' }).selectOption('list');
		expect(await page.getByRole('radio', { name: 'Campaign brief', exact: true }).evaluate((node, original) => node === original, selected)).toBe(true);
		await page.getByRole('button', { name: 'Show empty state', exact: true }).click();
		await expect(page.getByRole('radio', { name: 'Campaign brief', exact: true })).toBeHidden();
		await page.getByRole('button', { name: 'Restore sample catalog', exact: true }).click();
		await expect(page.getByRole('radio', { name: 'Campaign brief', exact: true })).toBeChecked();
		const steps = page.getByRole('list', { name: 'Ordered handoff steps' });
		await expect(steps).toHaveAttribute('start', '2');
		await expect(steps.getByRole('listitem')).toHaveCount(2);
		await expect(page.getByRole('heading', { name: 'Empty and unavailable content', exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Retry local preview', exact: true }).click();
		await expect(page.locator('.en-content-empty__title').filter({ hasText: 'Preview restored' })).toBeVisible();
		await page.getByRole('button', { name: 'Reset example', exact: true }).click();
		await expect(page.getByRole('radio', { name: 'Campaign brief', exact: true })).not.toBeChecked();
	} finally { await selected.dispose(); }
});

test('settings menu choices share application state with visible fields', async ({ page }) => {
	await page.goto('/workflows/settings/commands.html?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await page.getByRole('button', { name: 'More settings actions', exact: true }).click();
	await page.getByRole('menuitemcheckbox', { name: 'Include background' }).click();
	await expect(page.getByRole('checkbox', { name: 'Include background', exact: true })).not.toBeChecked();
	await page.getByRole('menuitem', { name: 'Preview layout', exact: true }).click();
	await page.getByRole('menuitemradio', { name: 'Landscape', exact: true }).click();
	await expect(page.locator('.settings-artboard')).toHaveAttribute('data-layout', 'landscape');
	await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Reset settings demo', exact: true }).click();
	await expect(page.locator('.settings-artboard')).toHaveAttribute('data-layout', 'portrait');
});

for (const id of ['content-recipes', 'menu-choices']) test(`${id} has usable phone layout in all inspired themes`, async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openExample(page, id);
	for (const [theme, title] of [['spectrum-inspired', 'Spectrum'], ['fluent-inspired', 'Fluent'], ['astryx-inspired', 'Astryx'], ['shadcn-inspired', 'shadcn'], ['radix-inspired', 'Radix Themes'], ['web-awesome-inspired', 'Web Awesome'], ['holotable-inspired', 'Holotable']]) {
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText(title);
		await expect(page.locator('style[data-example-theme]')).toHaveCount(1);
		await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark');
		if (id === 'menu-choices') {
			await page.getByRole('button', { name: 'Preview options', exact: true }).click();
			await expect(page.getByRole('menuitemcheckbox', { name: 'Include background' })).toBeVisible();
			await page.keyboard.press('Escape');
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	}
	const result = await new AxeBuilder({ page }).include(`[data-specimen="${id}"]`).analyze();
	expect(result.violations).toEqual([]);
	await page.screenshot({ path: info.outputPath(`${id}-phone.png`), fullPage: true });
});
