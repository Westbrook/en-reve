import { expect, test, type Locator } from '@playwright/test';

async function cardGeometry(card: Locator) {
	return card.evaluate(node => {
		const base = node.shadowRoot!.querySelector<HTMLElement>('.en-card')!;
		const body = node.shadowRoot!.querySelector<HTMLElement>('.en-card__body')!;
		const css = getComputedStyle(base);
		return {
			padding: parseFloat(css.paddingBottom),
			extraGap: base.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom
				- parseFloat(css.paddingBottom) - parseFloat(css.borderBottomWidth),
		};
	});
}

test('Showcase has its page styling and no empty card rows before JavaScript or stylesheet requests', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.route('**/*', route => route.request().resourceType() === 'stylesheet' ? route.abort() : route.continue());
		await page.goto('/showcase');
		await expect(page.locator('en-showcase-app')).toHaveAttribute('data-ssr', '');
		await expect(page.locator('head link[rel~="stylesheet"]')).toHaveCount(0);
		const cards = page.locator('.showcase-card > en-card');
		await expect(cards).toHaveCount(16);
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 900 });
			for (const card of await cards.all()) {
				await expect(card.locator('.en-card__header')).toBeVisible();
				await expect(card.locator('.en-card__footer')).toBeHidden();
				const geometry = await cardGeometry(card);
				expect(geometry.padding).toBeGreaterThan(0);
				expect(Math.abs(geometry.extraGap)).toBeLessThanOrEqual(1);
			}
			expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
		}
	} finally { await context.close(); }
});

test('the isolated card keeps authored layout and tokens when external stylesheets are unavailable', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.route('**/*', route => route.request().resourceType() === 'stylesheet' ? route.abort() : route.continue());
		await page.goto('/api-examples/card.html');
		await expect(page.locator('head link[rel~="stylesheet"]')).toHaveCount(0);
		const card = page.locator('[data-specimen="card"] en-card');
		await expect(card.locator('[part="header"]')).toBeVisible();
		await expect(card.locator('[part="footer"]')).toBeVisible();
		await expect(card.locator('[slot="footer"]')).toHaveCSS('display', 'flex');
		await expect(card.locator('.en-metadata')).toHaveCSS('margin-top', '0px');
		expect((await cardGeometry(card)).padding).toBeGreaterThan(0);
		await card.getByRole('button', { name: 'Open study', exact: true }).focus();
		await expect(card.getByRole('button', { name: 'Open study', exact: true })).toBeFocused();
	} finally { await context.close(); }
});


test('focus scroll clearance arrives in SSR and survives stylesheet adoption', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/showcase', { waitUntil: 'commit' });
		const control = page.locator('en-button').getByRole('button').first();
		await expect(control).toBeVisible();
		await expect(control).toHaveCSS('scroll-margin-block-start', '16px');
		await expect(control).toHaveCSS('scroll-margin-inline-start', '16px');
		await control.evaluate(node => { (window as any).initialScrollControl = node; });
		release();
		await expect(page.locator('en-showcase-app')).not.toHaveAttribute('data-ssr');
		await expect(control).toHaveCSS('scroll-margin-block-start', '16px');
		expect(await control.evaluate(node => node === (window as any).initialScrollControl)).toBe(true);
	} finally { release(); }
});
