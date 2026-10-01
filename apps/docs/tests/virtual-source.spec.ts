import { expect, test, type Page } from '@playwright/test';
import expectedSource from '../src/generated/virtual-collection-source.js';
import treeSource from '../src/generated/tree-data-source.js';

const path = '/api-examples/virtual-collection.html?progress-report';
const disclosure = (page: Page) => page.locator('details.code-disclosure');
const scrollDisclosure = (page: Page) => page.locator('en-virtual-collection-demo details.scroll-demo');
const errors = new WeakMap<Page, string[]>();

test('virtual tree source is delivered below the demo in initial HTML', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('/api-examples/tree-data.html?progress-report');
		await expect(disclosure(page)).not.toHaveAttribute('open');
		await openCode(page);
		expect(await disclosure(page).locator('pre > code').textContent()).toBe(treeSource);
		expect(await disclosure(page).evaluate(node => Boolean(document.querySelector('.tree-data-demo')!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
	} finally { await context.close(); }
});

test('virtual tree source highlights and copies without changing the live tree', async ({ page }) => {
	await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
		configurable: true, value: { writeText: async (text: string) => { (window as any).__copiedExample = text; } },
	}));
	await page.goto('/api-examples/tree-data.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await openCode(page);
	const code = disclosure(page).locator('pre > code');
	expect(await code.textContent()).toBe(treeSource);
	await expect.poll(() => code.evaluate(element => [...CSS.highlights.values()].some(highlight => [...highlight].some(range => element.contains(range.startContainer))))).toBe(true);
	await disclosure(page).getByRole('button', { name: 'Copy code', exact: true }).click();
	await expect.poll(() => page.evaluate(() => (window as any).__copiedExample)).toBe(treeSource);
	await expect(page.locator('#specimen-tree-data')).toHaveJSProperty('value', '');
	await expect(page.locator('.tree-data-demo details').first()).not.toHaveAttribute('open');
});

test.beforeEach(({ page, browser }, info) => {
	const collected: string[] = [];
	errors.set(page, collected);
	page.on('pageerror', error => collected.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]); });

async function load(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(disclosure(page)).toHaveCount(1);
}

async function openCode(page: Page) {
	const summary = disclosure(page).locator('summary');
	await summary.focus();
	await summary.press('Enter');
	await expect(disclosure(page)).toHaveAttribute('open', '');
	await expect(disclosure(page).locator('pre > code')).toBeVisible();
}

test('the initial HTML supplies the maintained source in a closed native disclosure', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(path);
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		await expect(disclosure(page)).not.toHaveAttribute('open');
		const code = disclosure(page).locator('pre > code');
		expect(await code.textContent()).toBe(expectedSource);
		await expect(code).toHaveAttribute('data-language', 'lit-typescript');
		await openCode(page);
		await expect(scrollDisclosure(page)).not.toHaveAttribute('open');
		expect(await disclosure(page).evaluate(node => {
			const demo = document.querySelector('en-virtual-collection-demo')!;
			return Boolean(demo.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
		})).toBe(true);
	} finally {
		await context.close();
	}
});

test('keyboard disclosure highlights the live source and copies it without opening scroll controls', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { writeText: async (text: string) => { (window as any).__copiedExample = text; } },
		});
	});
	await load(page);
	await expect(disclosure(page)).not.toHaveAttribute('open');
	await expect(scrollDisclosure(page)).not.toHaveAttribute('open');
	await openCode(page);
	const code = disclosure(page).locator('pre > code');
	await expect.poll(() => code.evaluate(element => {
		return [...CSS.highlights.values()].some(highlight =>
			[...highlight].some(range => element.contains(range.startContainer)));
	})).toBe(true);
	expect(await code.textContent()).toBe(expectedSource);
	const copy = disclosure(page).getByRole('button', { name: 'Copy code', exact: true });
	await copy.focus();
	await copy.press('Enter');
	await expect.poll(() => page.evaluate(() => (window as any).__copiedExample)).toBe(expectedSource);
	await expect(disclosure(page).getByRole('status')).not.toBeEmpty();
	await expect(scrollDisclosure(page)).not.toHaveAttribute('open');
	const summary = disclosure(page).locator('summary');
	await summary.focus();
	await summary.press('Space');
	await expect(disclosure(page)).not.toHaveAttribute('open');
	await summary.press('Enter');
	await expect(disclosure(page)).toHaveAttribute('open', '');
	expect(await code.textContent()).toBe(expectedSource);
});

test('expanded source scrolls within its own panel at phone width', async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await load(page);
	await openCode(page);
	const pre = disclosure(page).locator('pre');
	await pre.scrollIntoViewIfNeeded();
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
	const geometry = await pre.evaluate(element => ({
		width: element.getBoundingClientRect().width,
		clientWidth: element.clientWidth,
		scrollWidth: element.scrollWidth,
		overflowX: getComputedStyle(element).overflowX,
	}));
	expect(geometry.width).toBeLessThanOrEqual(390);
	expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth);
	expect(['auto', 'scroll']).toContain(geometry.overflowX);
	await pre.evaluate(element => { element.scrollLeft = 100; });
	expect(await pre.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
	await expect(scrollDisclosure(page)).not.toHaveAttribute('open');
	await info.attach('phone-code-panel', { body: JSON.stringify(geometry), contentType: 'application/json' });
	await page.screenshot({ path: info.outputPath('virtual-source-mobile.png') });
});
