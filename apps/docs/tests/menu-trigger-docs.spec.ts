import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('authored menu buttons retain decorative carets and exact accessible names', async ({ page }) => {
	const cases = [
		['/api-examples/menu-choices.html', 'menu-choices-trigger', 'Preview options'],
		['/api-examples/command-surfaces.html', 'specimen-menu-trigger', 'More layout actions'],
		['/api-examples/popup-motion.html', 'motion-motion-menu', 'Menu'],
		['/workflows/settings/commands.html', 'settings-menu-trigger', 'More settings actions'],
		['/showcase.html', 'showcase-menu-trigger', 'Actions'],
	];
	for (const [url, id, label] of cases) {
		await page.goto(url);
		const host = page.locator(`#${id}`);
		const button = host.getByRole('button', { name: label, exact: true });
		await expect(button).toBeVisible();
		await expect(button).toHaveAttribute('aria-haspopup', 'menu');
		const icon = host.locator('en-icon[slot="suffix"][name="chevron-down"]');
		await expect(icon).toHaveCount(1);
		await expect(icon.locator('svg')).toBeVisible();
		await expect(icon.locator('svg')).toHaveAttribute('aria-hidden', 'true');
		await expect(icon).toHaveAttribute('size', 'inherit');
	}
});

test('menu sections expose separators around the radio set without adding keyboard stops', async ({ page }) => {
	await page.goto('/api-examples/menu-choices.html');
	const trigger = page.getByRole('button', { name: 'Preview options', exact: true });
	await trigger.click();
	const menu = page.locator('#menu-choices');
	await expect(menu.getByRole('separator')).toHaveCount(2);
	await expect(menu).toMatchAriaSnapshot(`
		- menu "Preview options":
		  - menuitemcheckbox "Include background" [checked]
		  - separator
		  - menuitemradio "Portrait" [checked]
		  - menuitemradio "Landscape"
		  - separator
		  - menuitem "Export"
	`);
	await expect(page.getByRole('menuitemcheckbox', { name: 'Include background' })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('menuitemradio', { name: 'Portrait', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('menuitemradio', { name: 'Landscape', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('menuitem', { name: 'Export', exact: true })).toBeFocused();
	const result = await new AxeBuilder({ page }).include('#menu-choices').analyze();
	expect(result.violations).toEqual([]);
	for (const separator of await menu.getByRole('separator').all()) {
		const geometry = await separator.evaluate(node => ({ width: node.getBoundingClientRect().width }));
		expect(geometry.width).toBeGreaterThan(100);
	}
});

test('the menu caret exists in the initial server-rendered button with scripting off', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		await page.goto('/api-examples/menu-choices.html');
		const trigger = page.locator('#menu-choices-trigger');
		await expect(trigger.getByRole('button', { name: 'Preview options', exact: true })).toBeVisible();
		await expect(trigger.locator('en-icon[slot="suffix"] svg')).toBeVisible();
		await expect(trigger.locator('en-icon[slot="suffix"] svg')).toHaveAttribute('aria-hidden', 'true');
	} finally { await context.close(); }
});

test('cached page navigation keeps popup semantics on the existing hydrated native button', async ({ page }) => {
	for (let visit = 0; visit < 3; visit++) {
		await page.goto('/api-examples/menu-choices.html');
		await expect(page.locator('#menu-choices-trigger button')).toHaveAttribute('aria-haspopup', 'menu');
		await page.goto('/api-examples/command-surfaces.html');
		const host = page.locator('#specimen-menu-trigger');
		const button = host.getByRole('button', { name: 'More layout actions', exact: true });
		await expect(button).toBeVisible();
		const original = await button.evaluateHandle(node => node);
		try {
			await expect(button).toHaveAttribute('aria-haspopup', 'menu');
			await expect(button).toHaveAttribute('aria-expanded', 'false');
			await button.click();
			await expect(button).toHaveAttribute('aria-expanded', 'true');
			await expect(page.getByRole('menuitem', { name: 'Portrait', exact: true })).toBeFocused();
			await page.keyboard.press('Escape');
			await expect(button).toHaveAttribute('aria-expanded', 'false');
			await expect(button).toBeFocused();
			expect(await button.evaluate((node, before) => node === before, original)).toBe(true);
		} finally { await original.dispose(); }
	}
});
