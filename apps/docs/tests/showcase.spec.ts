import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { hashValue } from '@en-reve/tokens';
import { AxeBuilder } from '@axe-core/playwright';

const presets = ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired'];
async function ready(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/showcase?progress-report');
	await expect(page.getByRole('button', { name: 'Download JSON', exact: true })).toBeEnabled();
	return errors;
}
async function drop(page: Page, text: string, name = 'candidate.json') {
	const transfer = await page.evaluateHandle(({ text, name }) => {
		const transfer = new DataTransfer(); transfer.items.add(new File([text], name, { type: 'application/json' })); return transfer;
	}, { text, name });
	await page.locator('.showcase-page').dispatchEvent('drop', { dataTransfer: transfer });
	await transfer.dispose();
}
async function appearance(page: Page, name: 'Auto' | 'Light' | 'Dark') {
	const control = page.locator('.showcase-theme en-segmented-control').getByRole('radio', { name, exact: true });
	await control.focus(); await control.press('Space');
}

for (const preset of ['default', ...presets]) {
	test(`modal close actions stay square and operable in ${preset}`, async ({ page }) => {
		const errors = await ready(page);
		if (preset !== 'default') {
			await page.locator('#showcase-theme').getByRole('combobox').selectOption(preset);
			await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', preset);
		}
		for (const [id, openerName] of [
			['showcase-create-dialog', 'Create'],
			['showcase-output-drawer', 'More export options'],
			['showcase-palette', 'All commands'],
		]) {
			const opener = page.getByRole('button', { name: openerName, exact: true });
			await opener.click();
			const modal = page.locator(`#${id}`);
			const close = modal.getByRole('button', { name: 'Close', exact: true });
			await expect(close).toBeVisible();
			await expect(modal.locator('en-button.en-overlay-close en-icon[name="close"] svg')).toBeVisible();
			const box = (await close.boundingBox())!;
			expect(Math.abs(box.width - box.height)).toBeLessThan(1);
			await close.focus();
			await close.press('Enter');
			await expect(modal).toHaveJSProperty('open', false);
			await expect(opener).toBeFocused();
		}
		expect(errors).toEqual([]);
	});
}

test('showcase is visible in server HTML before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage(); await page.goto('/showcase');
	await expect(page.getByRole('heading', { name: 'Made of en-reve.', exact: true })).toBeVisible();
	await expect(page.locator('.showcase-card')).toHaveCount(16);
	await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toBeVisible();
	await expect(page.locator('#showcase-team').getByRole('heading', { name: 'Better, together.', exact: true })).toBeVisible();
	await expect(page.locator('#scope-gaps').getByText('QR-code display and generation', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Progress Report', exact: true })).toHaveCount(0);
	await context.close();
});

test('project validation, independent reset, icon actions, menus and palette work', async ({ page }) => {
	const errors = await ready(page);
	await page.getByRole('button', { name: 'Create project', exact: true }).click();
	await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toBeFocused();
	await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Summer studio');
	await page.getByRole('button', { name: 'Create project', exact: true }).click();
	await expect(page.locator('#showcase-project [role="status"]')).toContainText('Summer studio created locally');
	await page.getByRole('button', { name: 'Reset canvas', exact: true }).click();
	await expect(page.locator('#showcase-actions en-button[icon-only]').filter({ hasText: 'Reset canvas' }).locator('en-icon')).toBeVisible();
	await page.getByRole('button', { name: 'Actions', exact: true }).click();
	await page.getByRole('menuitem', { name: 'Landscape canvas', exact: true }).click();
	await expect(page.locator('#showcase-actions .showcase-status')).toHaveText('Canvas: landscape.');
	await page.getByRole('button', { name: 'All commands', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Studio commands', exact: true })).toBeVisible();
	await page.locator('#showcase-palette').getByRole('combobox').fill('portrait');
	await page.locator('#showcase-palette').getByRole('combobox').press('Enter');
	await expect(page.locator('#showcase-actions .showcase-status')).toHaveText('Canvas: portrait.');
	const reset = page.getByRole('button', { name: 'Reset Set your next milestone', exact: true });
	await reset.focus(); await reset.press('Space');
	await expect(reset).toBeFocused();
	await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('');
	await expect(page.locator('#showcase-actions .showcase-status')).toHaveText('Canvas: portrait.');
	expect(errors).toEqual([]);
});

test('Actions menu Tab exit reaches All commands in the same card', async ({ page, browserName }) => {
	const errors = await ready(page);
	const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
	const reverseTab = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
	const actions = page.getByRole('button', { name: 'Actions', exact: true });
	const commands = page.getByRole('button', { name: 'All commands', exact: true });
	await actions.focus();
	await actions.press(tab);
	await expect(commands).toBeFocused();
	await actions.focus();
	await actions.press('ArrowDown');
	const menu = page.locator('#showcase-actions en-menu');
	await expect(menu.getByRole('menuitem').first()).toBeFocused();
	await page.keyboard.press(tab);
	await expect(commands).toBeFocused();
	await expect(menu).toHaveJSProperty('open', false);
	await commands.press(reverseTab);
	await expect(actions).toBeFocused();
	await actions.press('ArrowDown');
	await expect(menu.getByRole('menuitem').first()).toBeFocused();
	await page.keyboard.press(reverseTab);
	await expect(actions).toBeFocused();
	await expect(menu).toHaveJSProperty('open', false);
	await actions.press('ArrowDown');
	await expect(menu.getByRole('menuitem').first()).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(actions).toBeFocused();
	await actions.press(tab);
	await expect(commands).toBeFocused();
	await commands.press('Enter');
	await expect(page.getByRole('dialog', { name: 'Studio commands', exact: true })).toBeVisible();
	expect(errors).toEqual([]);
});

test('settings, approval focus and disclosures use their public APIs', async ({ page }) => {
	const errors = await ready(page);
	const scale = page.locator('#showcase-output en-number-field').getByRole('spinbutton');
	await scale.fill('200'); await scale.press('Tab');
	await expect(page.locator('#showcase-output .showcase-summary-pair')).toContainText('200%');
	const slider = page.locator('#showcase-output en-slider').getByRole('slider');
	await slider.focus(); await slider.press('ArrowRight');
	await expect(page.locator('#showcase-output .showcase-summary-pair')).toContainText('83%');
	await page.getByRole('button', { name: 'What makes a useful review?', exact: true }).click();
	await expect(page.getByText('Try one task, note where you hesitate, and share the result with your team.', { exact: true })).toBeVisible();
	for (const name of ['Keyboard review complete', 'Alternative text checked']) {
		const checkbox = page.getByRole('checkbox', { name, exact: true }); await checkbox.focus(); await checkbox.press('Space');
	}
	await page.getByRole('button', { name: 'Approve study', exact: true }).click();
	await page.getByRole('button', { name: 'Confirm approval', exact: true }).click();
	await expect(page.locator('#showcase-readiness en-badge')).toHaveText('Approved');
	await expect(page.locator('#showcase-heading-readiness')).toBeFocused();
	await page.getByRole('button', { name: 'More export options', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Export options', exact: true })).toBeVisible();
	await page.getByRole('textbox', { name: 'Handoff message', exact: true }).fill('Keep the layers editable.');
	await page.getByRole('button', { name: 'Done', exact: true }).click();
	await page.getByRole('button', { name: 'More export options', exact: true }).click();
	await expect(page.getByRole('textbox', { name: 'Handoff message', exact: true })).toHaveValue('Keep the layers editable.');
	expect(errors).toEqual([]);
});

test('team, chat and feedback produce local results and reset independently', async ({ page }) => {
	await ready(page);
	const people = page.locator('#team-person').getByRole('combobox');
	await people.fill('Ada');
	await page.locator('#team-person').getByRole('option', { name: 'Ada Lovelace', exact: true }).click();
	await page.getByRole('button', { name: 'Add to demo team', exact: true }).click();
	await expect(page.locator('.showcase-people')).toContainText('Ada Lovelace');
	await page.getByRole('textbox', { name: 'Message', exact: true }).fill('A softer direction for the launch.');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(page.getByRole('list', { name: 'Sample conversation' })).toContainText('A softer direction for the launch.');
	await page.getByRole('textbox', { name: 'Review note', exact: true }).fill('Keep the quiet spaces.');
	await page.getByRole('button', { name: 'Add review', exact: true }).click();
	await expect(page.locator('#showcase-feedback [role="status"]')).toContainText('Keep the quiet spaces.');
	await page.getByRole('button', { name: 'Reset A thought to get you started', exact: true }).click();
	await expect(page.getByRole('list', { name: 'Sample conversation' })).toHaveCount(0);
	await expect(page.locator('.showcase-people')).toContainText('Ada Lovelace');
	await expect(page.locator('#showcase-feedback [role="status"]')).toContainText('Keep the quiet spaces.');
});

test('all five preset downloads and file drops preserve live controls and theme modes', async ({ page }, info) => {
	test.setTimeout(90_000);
	const errors = await ready(page);
	const title = page.getByRole('textbox', { name: 'Project name', exact: true });
	await title.fill('Keep my unfinished project');
	await page.locator('#project-title').evaluate(element => { (window as any).showcaseKeptField = element; });
	const colors = new Set<string>();
	for (const id of presets) {
		await page.locator('#showcase-theme').getByRole('combobox').selectOption(id);
		await expect(page.locator('.showcase-theme-status')).toContainText('Applied');
		await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', id);
		await appearance(page, 'Dark');
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'dark');
		colors.add(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
		await appearance(page, 'Light');
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'light');
		const downloadPromise = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
		const download = await downloadPromise;
		const file = info.outputPath(`${id}.json`); await download.saveAs(file);
		const json = await readFile(file, 'utf8');
		await page.getByRole('button', { name: 'Reset theme', exact: true }).click();
		await page.getByRole('button', { name: 'Preview study', exact: true }).click();
		await drop(page, json);
		await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'imported');
		await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
		await expect(page.getByRole('dialog', { name: 'Shape & space', exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Back to the studio', exact: true }).click();
		await expect(title).toHaveValue('Keep my unfinished project');
		expect(await page.locator('#project-title').evaluate(element => element === (window as any).showcaseKeptField)).toBe(true);
		await appearance(page, 'Auto');
		await expect.poll(() => page.evaluate(() => document.documentElement.style.colorScheme)).toBe('light dark');
	}
	expect(colors.size).toBeGreaterThan(2);
	await drop(page, '{', 'broken.json');
	await expect(page.locator('.showcase-theme-error')).toContainText('not valid JSON');
	await expect(title).toHaveValue('Keep my unfinished project');
	await page.getByRole('button', { name: 'Reset theme', exact: true }).click();
	await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
	await expect(title).toHaveValue('Keep my unfinished project');
	expect(errors).toEqual([]);
});

test('file picker, stale build rejection and system appearance are isolated from draft state', async ({ page }) => {
	await ready(page);
	await page.getByRole('textbox', { name: 'Quick note', exact: true }).fill('Unfinished note');
	await page.locator('#showcase-theme').getByRole('combobox').selectOption('holotable-inspired');
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'holotable-inspired');
	const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
	const download = await downloadPromise; const text = await readFile((await download.path())!, 'utf8');
	await page.locator('input[type=file]').setInputFiles({ name: 'holotable.json', mimeType: 'application/json', buffer: Buffer.from(text) });
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'imported');
	await appearance(page, 'Auto'); await page.emulateMedia({ colorScheme: 'dark' });
	const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(dark);
	const { integrity, ...stale } = JSON.parse(text); stale.build.fingerprint = 'sha256:' + '0'.repeat(64);
	// Intact old-build input must not inherit this checkpoint's review identity.
	await drop(page, JSON.stringify({ ...stale, integrity: hashValue(stale) }), 'old-build.json');
	await expect(page.locator('.showcase-theme-error')).toContainText('different documentation build');
	await expect(page.getByRole('textbox', { name: 'Quick note', exact: true })).toHaveValue('Unfinished note');
});

test('phone, tablet, RTL and enlarged text keep the complete page within the viewport', async ({ page }, info) => {
	await ready(page);
	await page.locator('#showcase-theme').getByRole('combobox').selectOption('shadcn-inspired');
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'shadcn-inspired');
	await appearance(page, 'Dark');
	for (const width of [390, 768, 1920]) {
		await page.setViewportSize({ width, height: 1000 });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
		await page.screenshot({ path: info.outputPath(`showcase-${width}.png`), fullPage: width === 1920 });
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('.showcase-theme en-select[label="Reading direction"]').getByRole('combobox').selectOption('rtl');
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	await expect(page.getByRole('button', { name: 'Create project', exact: true })).toBeVisible();
});

test('composed page retains accessible names, semantics and contrast in light and dark', async ({ page }, info) => {
	await ready(page);
	for (const mode of ['Light', 'Dark'] as const) {
		await appearance(page, mode);
		const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
		await info.attach(`showcase-${mode}-accessibility`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
		expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
	}
});


for (const preset of ['default', ...presets]) {
	test(`theme JSON chooser matches adjacent button geometry in ${preset}`, async ({ page }, info) => {
		await ready(page);
		if (preset !== 'default') {
			await page.locator('#showcase-theme').getByRole('combobox').selectOption(preset);
			await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', preset);
		}
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 1000 });
			for (const mode of ['Light', 'Dark'] as const) {
				await appearance(page, mode);
				const choose = page.getByRole('button', { name: 'Choose theme JSON', exact: true });
				const download = page.getByRole('button', { name: 'Download JSON', exact: true });
				const reset = page.getByRole('button', { name: 'Reset theme', exact: true });
				for (const adjacent of [download, reset]) {
					const a = (await choose.boundingBox())!;
					const b = (await adjacent.boundingBox())!;
					expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(1);
					expect(a.height).toBeGreaterThanOrEqual(24);
					if (width === 1440) expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
				}
				await expect(choose).toHaveCSS('border-top-style', 'dashed');
				if (info.project.name === 'chromium' && mode === 'Dark') {
					await info.attach(`${preset}-${width}`, { body: await page.locator('.showcase-theme').screenshot(), contentType: 'image/png' });
				}
			}
		}
	});
}

test('theme JSON chooser opens the native picker with pointer and keyboard without an extra Tab stop', async ({ page, browserName }) => {
	await ready(page);
	const choose = page.getByRole('button', { name: 'Choose theme JSON', exact: true });
	const download = page.getByRole('button', { name: 'Download JSON', exact: true });
	for (const activation of ['pointer', 'Enter', 'Space']) {
		await choose.focus();
		const pending = page.waitForEvent('filechooser');
		if (activation === 'pointer') await choose.click();
		else await choose.press(activation);
		const picker = await pending;
		expect(picker.isMultiple()).toBe(false);
		await picker.setFiles([]);
	}
	await choose.focus();
	await choose.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(download).toBeFocused();
});


test('Holotable tabs keep keyboard focus raised above adjacent content', async ({ page }, info) => {
	await ready(page);
	await page.locator('#showcase-theme').getByRole('combobox').selectOption('holotable-inspired');
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'holotable-inspired');
	const tabs = page.locator('en-tabs[label="Creative brief"]');
	const idea = tabs.getByRole('tab', { name: 'The idea', exact: true });
	const delivery = tabs.getByRole('tab', { name: 'Delivery', exact: true });
	for (const mode of ['Light', 'Dark'] as const) {
		await appearance(page, mode);
		await idea.focus();
		await expect(idea).toBeFocused();
		await expect(idea).toHaveCSS('z-index', '1');
		await expect(tabs.getByRole('tablist')).toHaveCSS('z-index', '1');
		await info.attach(`holotable-tabs-${mode}`, { body: await tabs.screenshot(), contentType: 'image/png' });
		await idea.press('ArrowRight');
		await expect(delivery).toBeFocused();
		await expect(delivery).toHaveAttribute('aria-selected', 'true');
		await expect(delivery).toHaveCSS('z-index', '1');
		await expect(idea).toHaveCSS('z-index', 'auto');
	}
});


for (const preset of ['astryx-inspired', 'shadcn-inspired']) {
	test(`rating stars are circular and independently customizable in ${preset}`, async ({ page }, info) => {
		await ready(page);
		await page.locator('#showcase-theme').getByRole('combobox').selectOption(preset);
		await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', preset);
		const rating = page.locator('#feedback-rating');
		const stars = rating.locator('[part~="star-option"]');
		const clear = rating.locator('[part~="clear-option"]');
		for (const mode of ['Light', 'Dark'] as const) {
			await appearance(page, mode);
			await expect(stars).toHaveCount(5);
			for (const star of await stars.all()) {
				const box = (await star.boundingBox())!;
				expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
				await expect(star).toHaveCSS('border-top-left-radius', '9999px');
			}
			const originalClearRadius = await clear.evaluate(node => getComputedStyle(node).borderTopLeftRadius);
			await stars.nth(2).getByRole('radio').focus();
			await info.attach(`${preset}-${mode}-circular-stars`, { body: await rating.screenshot(), contentType: 'image/png' });
			await rating.evaluate(node => (node as HTMLElement).style.setProperty('--en-rating-star-radius', '0px'));
			await expect(stars.first()).toHaveCSS('border-top-left-radius', '0px');
			await expect(clear).toHaveCSS('border-top-left-radius', originalClearRadius);
			await rating.evaluate(node => (node as HTMLElement).style.removeProperty('--en-rating-star-radius'));
		}
		await page.goto('/api-reference?component=en-rating&progress-report');
		await expect(page.locator('#api-cssParts')).toContainText('star-option');
		await expect(page.locator('#api-cssProperties')).toContainText('--en-rating-star-radius');
	});
}
