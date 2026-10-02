import { test, expect } from '@playwright/test';

test('native SSR lists preserve ordered numbering, metadata and optional omissions without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	await page.goto('fixture');
	const list = page.getByRole('list', { name: 'Handoff steps' });
	await expect(page.locator('ol[aria-label="Handoff steps"]')).toHaveCount(1);
	await expect(list).toHaveAttribute('start', '5');
	await expect(list).toHaveAttribute('reversed', '');
	await expect(list.getByRole('listitem')).toHaveCount(3);
	await expect(list.getByRole('listitem').first()).toHaveCSS('display', 'list-item');
	await expect(list).toHaveCSS('list-style-type', 'decimal');
	await expect(page.locator('ul[aria-label="Project files"]')).toHaveCount(1);
	await expect(page.locator('#assets dt')).toHaveText(['Format', 'Size', 'Rev.']);
	await expect(page.locator('#assets dd')).toHaveText(['PDF document', '2.4 MB', '0']);
	await expect(page.locator('.en-file-card__availability')).toHaveCount(0);
	await expect(page.locator('#minimal .en-file-card__media')).toHaveCount(0);
	await expect(page.getByText('No preview available', { exact: true })).toBeVisible();
	await expect(page.locator('[aria-live], [role="alert"], [role="listbox"], [aria-selected]')).toHaveCount(0);
	await context.close();
});

test('hydration retains server nodes and geometry; updates preserve focus, optional content and key identity', async ({ page }) => {
	await page.goto('fixture?defer');
	await page.waitForFunction(() => !!(window as any).contentFixture);
	const before = await page.locator('#assets').boundingBox();
	await page.evaluate(() => {
		(window as any).original = document.querySelector('#assets .en-content-collection__item');
		(window as any).originalButton = document.querySelector('[data-key="approve"]');
		(window as any).contentFixture.hydrate();
	});
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	const after = await page.locator('#assets').boundingBox();
	expect(after).toEqual(before);
	const focused = page.getByRole('button', { name: 'Approve content', exact: true });
	await focused.focus();
	await page.evaluate(() => (window as any).contentFixture.update({ layout: 'grid', availability: 'Temporarily unavailable' }));
	await expect(focused).toBeFocused();
	expect(await page.evaluate(() => (window as any).original === document.querySelector('#assets .en-content-collection__item') && (window as any).originalButton === document.querySelector('[data-key="approve"]'))).toBe(true);
	await expect(page.getByText('Temporarily unavailable', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Check availability' })).toBeEnabled();
	await page.evaluate(() => (window as any).contentFixture.update({ availability: '', media: true }));
	await expect(page.locator('.en-file-card__availability')).toHaveCount(0);
	await expect(page.getByRole('img', { name: 'Page preview' })).toBeVisible();
	await expect(page.getByText('No preview available', { exact: true })).toHaveCount(0);
	await page.evaluate(() => (window as any).contentFixture.update({ media: false }));
	await expect(page.getByText('No preview available', { exact: true })).toBeVisible();
});

test('native keyboard actions and download remain consumer-owned; no-results recovery restores collection', async ({ page, browserName }) => {
	await page.goto('fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	await page.getByRole('button', { name: 'Review draft', exact: true }).focus();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('button', { name: 'Approve content', exact: true })).toBeFocused();
	await page.getByRole('checkbox', { name: 'Select project draft' }).check();
	const card = page.locator('#assets .en-file-card');
	const selectedHeight = (await card.boundingBox())!.height;
	await page.getByRole('checkbox', { name: 'Select project draft' }).uncheck();
	expect((await card.boundingBox())!.height).toBe(selectedHeight);
	await page.getByRole('button', { name: 'Check availability' }).click();
	await expect(page.getByText('Available offline', { exact: true })).toBeVisible();
	const download = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Download project draft' }).click();
	expect((await download).suggestedFilename()).toBe('draft.txt');
	await page.getByRole('button', { name: 'Find missing file' }).click();
	await expect(page.getByRole('heading', { name: 'No matching files' })).toBeVisible();
	await expect(page.getByRole('list', { name: 'Project files' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Clear filters' }).click();
	await expect(page.getByRole('list', { name: 'Project files' })).toBeVisible();
	await expect(page.locator('#empty .en-content-empty')).toHaveAttribute('data-kind', 'empty');
	await expect(page.locator('#unavailable .en-content-empty')).toHaveAttribute('data-kind', 'unavailable');
});

test('long localized names, availability and metadata reflow at 320px enlarged RTL without clipping', async ({ page }, info) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto('fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	await page.evaluate(() => {
		document.documentElement.dir = 'rtl';
		document.documentElement.style.fontSize = '24px';
		(window as any).contentFixture.update({ availability: 'Temporarily unavailable — your file is preserved.' });
	});
	for (const layout of ['list', 'grid']) {
		await page.evaluate(layout => (window as any).contentFixture.update({ layout }), layout);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
		await expect(page.locator('#assets .en-file-card__name')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Download project draft' })).toBeVisible();
		await expect(page.locator('#ordered li').first()).toHaveCSS('display', 'list-item');
	}
	await page.screenshot({ path: info.outputPath('content-phone-rtl.png'), fullPage: true });
});


test('retained fields have decorative server placeholders and hydrate without changing authored nodes or geometry', async ({ page }) => {
	await page.goto('fixture?defer&loading');
	await page.waitForFunction(() => !!(window as any).contentFixture);
	const region = page.locator('#retained');
	await expect(region).toHaveAttribute('aria-busy', 'true');
	await expect(region.getByRole('button')).toHaveCount(0);
	const read = () => region.locator('.en-content-placeholder').evaluateAll(nodes => nodes.map(node => {
		const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
	}));
	const before = await read();
	const originals = await region.evaluateHandle(node => [node, ...node.querySelectorAll('.en-content-placeholder__content, input, button')]);
	await page.evaluate(() => (window as any).contentFixture.hydrate());
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	expect(await read()).toEqual(before);
	await page.getByRole('button', { name: 'Toggle retained loading' }).click();
	await expect(region).toHaveAttribute('aria-busy', 'false');
	await expect(region.getByRole('button', { name: 'Open retained file' })).toBeVisible();
	await region.getByRole('checkbox', { name: 'Select retained file' }).check();
	await page.getByRole('button', { name: 'Toggle retained loading' }).click();
	await expect(region.getByRole('checkbox')).toHaveCount(0);
	await page.getByRole('button', { name: 'Toggle retained loading' }).click();
	await expect(region.getByRole('checkbox', { name: 'Select retained file' })).toBeChecked();
	expect(await region.evaluate((node, saved) => [node, ...node.querySelectorAll('.en-content-placeholder__content, input, button')].every((item, i) => item === saved[i]), originals)).toBe(true);
	await originals.dispose();
});

test('server-authored loading is already in place without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	await page.goto('fixture?loading');
	const region = page.locator('#retained');
	await expect(region).toHaveAttribute('aria-busy', 'true');
	await expect(region.getByRole('button')).toHaveCount(0);
	expect(await region.locator('en-skeleton').count()).toBeGreaterThan(0);
	for (const skeleton of await region.locator('en-skeleton').all()) {
		await expect(skeleton).toBeVisible();
		await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
	}
	await expect(region.locator('.en-file-card')).toBeVisible();
	await context.close();
});
