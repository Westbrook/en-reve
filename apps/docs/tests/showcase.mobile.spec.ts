import { test, expect, type Page } from '@playwright/test';

const themes = ['default', 'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired'];
async function ready(page: Page) {
	await page.goto('/showcase');
	await expect(page.getByRole('button', { name: 'Download JSON', exact: true })).toBeEnabled();
}
async function theme(page: Page, value: string) {
	const previous = await page.locator('#showcase-theme').evaluate((host: HTMLElement & { value: string }) => host.value);
	await page.locator('#showcase-theme').getByRole('combobox').selectOption(value);
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', value);
	if (previous !== value) await expect(page.locator('.showcase-theme-status')).toContainText(value === 'default' ? 'Default theme restored' : 'Applied');
}

test('mobile theme geometry keeps compact full targets and aligned field text', async ({ page }, info) => {
	await ready(page);
	const samples = [];
	for (const value of themes) {
		await theme(page, value);
		const sample = await page.evaluate(() => {
			const rect = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
			const input = document.querySelector('en-text-field[label="Study name"]')!.shadowRoot!.querySelector('input')!;
			const textarea = document.querySelector('en-textarea[label="Quick note"]')!.shadowRoot!.querySelector('textarea')!;
			const inputStyle = getComputedStyle(input), textareaStyle = getComputedStyle(textarea);
			const stars = [...document.querySelector('en-rating')!.shadowRoot!.querySelectorAll('.en-rating-item')].map(rect);
			const checks = [...document.querySelectorAll('#showcase-readiness en-checkbox')].map(host => rect(host.shadowRoot!.querySelector('label')!));
			const date = document.querySelector('#project-date')!;
			return {
				reset: rect(document.querySelector('.showcase-card-heading en-button')!.shadowRoot!.querySelector('button')!),
				inputInset: (rect(input).height - parseFloat(inputStyle.lineHeight)) / 2,
				textareaInset: parseFloat(textareaStyle.borderTopWidth) + parseFloat(textareaStyle.paddingTop),
				stars, checks, date: rect(date), dateInput: rect(date.shadowRoot!.querySelector('input')!),
				fieldPair: rect(date.parentElement!), overflow: document.documentElement.scrollWidth - innerWidth,
			};
		});
		expect(sample.reset.height).toBeGreaterThanOrEqual(44);
		expect(sample.reset.height).toBeLessThanOrEqual(45);
		expect(Math.abs(sample.inputInset - sample.textareaInset)).toBeLessThanOrEqual(1);
		expect(new Set(sample.stars.map(star => Math.round(star.y))).size).toBe(1);
		for (const star of sample.stars) { expect(star.width).toBeGreaterThanOrEqual(44); expect(star.height).toBeGreaterThanOrEqual(44); }
		for (let i = 1; i < sample.checks.length; i++) {
			expect(sample.checks[i].y - sample.checks[i - 1].bottom).toBeLessThanOrEqual(4);
			expect(sample.checks[i].height).toBeGreaterThanOrEqual(44);
		}
		expect(sample.date.width).toBeLessThanOrEqual(sample.fieldPair.width + 1);
		expect(sample.dateInput.width).toBeLessThanOrEqual(sample.date.width + 1);
		expect(sample.overflow).toBeLessThanOrEqual(1);
		samples.push({ theme: value, ...sample });
	}
	await info.attach('mobile-theme-geometry', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
});

test('touch information, rating, resets and responsive drawer preserve usable state', async ({ page }, info) => {
	await ready(page);
	const infoButton = page.getByRole('button', { name: 'About this study', exact: true });
	await infoButton.tap();
	const popover = page.getByRole('dialog', { name: 'About this study', exact: true });
	await expect(popover).toBeVisible();
	await expect(page.locator('en-popover[for="showcase-asset-info"] p')).toBeVisible();
	await popover.getByRole('button', { name: 'Close', exact: true }).tap();
	await expect(popover).not.toBeVisible();
	const rating = page.locator('#feedback-rating');
	await rating.locator('.en-rating-item').last().tap();
	await expect(rating).toHaveJSProperty('value', 5);
	await rating.locator('.en-rating-clear').tap();
	await expect(rating).toHaveJSProperty('value', 0);
	await rating.getByRole('radio', { name: 'No rating', exact: true }).press('ArrowRight');
	await expect(rating).toHaveJSProperty('value', 1);
	const note = page.getByRole('textbox', { name: 'Quick note', exact: true });
	await note.fill('Keep this idea');
	await page.getByRole('button', { name: 'Reset Make something.', exact: true }).tap();
	await expect(note).toHaveValue('');
	const trigger = page.getByRole('button', { name: 'More export options', exact: true });
	await trigger.tap();
	const drawer = page.locator('#showcase-output-drawer');
	const surface = drawer.getByRole('dialog');
	await expect(surface).toBeVisible();
	const field = drawer.getByRole('textbox', { name: 'Handoff message', exact: true });
	await field.fill('Preserve my handoff');
	const original = await surface.elementHandle();
	for (const width of [390, 1024, 390]) {
		await page.setViewportSize({ width, height: 844 });
		await expect(surface).toHaveAttribute('data-placement', width < 768 ? 'bottom' : 'end');
		const geometry = await surface.evaluate(node => {
			const r = node.getBoundingClientRect(), s = getComputedStyle(node);
			return { x: r.x, bottom: r.bottom, right: r.right, viewport: [innerWidth, innerHeight], borders: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth] };
		});
		expect(geometry.borders).toEqual(['0px', '0px', '0px', '0px']);
		if (width < 768) { expect(geometry.x).toBeCloseTo(0, 0); expect(geometry.bottom).toBeCloseTo(geometry.viewport[1], 0); }
		else expect(geometry.right).toBeCloseTo(geometry.viewport[0], 0);
		expect(await surface.evaluate((node, original) => node === original, original)).toBe(true);
		await expect(field).toHaveValue('Preserve my handoff');
	}
	await page.screenshot({ path: info.outputPath('bottom-drawer.png') });
	await drawer.getByRole('button', { name: 'Done', exact: true }).tap();
	await expect(surface).not.toBeVisible();
	await expect(trigger).toBeFocused();
});

test('narrow portrait and enlarged RTL reflow preserve every rating choice', async ({ page }, info) => {
	await ready(page);
	await page.setViewportSize({ width: 320, height: 844 });
	for (const value of themes) {
		await theme(page, value);
		const row = await page.locator('#feedback-rating .en-rating-item').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().y));
		expect(new Set(row.map(Math.round)).size).toBe(1);
	}
	await page.locator('.showcase-theme en-select[label="Reading direction"]').getByRole('combobox').selectOption('rtl');
	await page.addStyleTag({ content: 'html { font-size:200%; }' });
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	const rating = page.locator('#feedback-rating');
	for (let i = 0; i < 5; i++) {
		const target = rating.locator('.en-rating-item').nth(i);
		await target.tap();
		await expect(rating).toHaveJSProperty('value', i + 1);
	}
	await rating.locator('.en-rating-clear').tap();
	await expect(rating).toHaveJSProperty('value', 0);
	await page.locator('#showcase-feedback').screenshot({ path: info.outputPath('rating-large-rtl.png') });
});
