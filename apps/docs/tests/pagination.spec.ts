import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const path = '/api-examples/pagination.html?progress-report';
const pager = (page: Page) => page.locator('#api-pagination');
async function open(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(pager(page)).toBeVisible();
}
const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser }, info) => {
	const errors: string[] = []; failures.set(page, errors); page.on('pageerror', error => errors.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(failures.get(page)).toEqual([]); });

test('initial SSR exposes bounded page navigation and hydrated direct page access', async ({ browser, baseURL, page }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const initial = await context.newPage(); await initial.goto(path);
		await expect(pager(initial).getByRole('navigation')).toBeVisible();
		await expect(pager(initial).getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
		await expect(pager(initial).getByRole('button', { name: 'Next page', exact: true })).toBeEnabled();
		await expect(pager(initial).getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
		await initial.setViewportSize({ width: 390, height: 844 });
		await expect(pager(initial).locator('.en-pagination__pages')).not.toBeVisible();
		await expect(pager(initial).getByRole('button', { name: 'Next page', exact: true })).toBeVisible();
		await expect(pager(initial).getByRole('button', { name: 'Choose a page', exact: true })).toBeVisible();
		await expect(pager(initial).locator('.en-pagination__compact-status')).toHaveText('Page 1 of 12');
	} finally { await context.close(); }
	await open(page);
	await expect(pager(page)).not.toHaveAttribute('size');
	await expect(pager(page).getByRole('button')).toHaveCount(9);
	await pager(page).getByRole('button', { name: 'Page 12', exact: true }).click();
	await expect(pager(page)).toHaveJSProperty('page', 12);
	await expect(pager(page).getByRole('button', { name: 'Page 12', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(pager(page).getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
});

test('a single cancelable change exposes tentative page and supports external authority', async ({ page }) => {
	await open(page);
	await pager(page).evaluate(element => {
		const node = element as HTMLElement & { page: number };
		(window as any).paginationChanges = [];
		node.addEventListener('en-change', event => {
			(window as any).paginationChanges.push({ page: node.page, detail: (event as CustomEvent).detail, cancelable: event.cancelable });
			event.preventDefault();
		}, { once: true });
	});
	await pager(page).getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(pager(page)).toHaveJSProperty('page', 1);
	expect(await page.evaluate(() => (window as any).paginationChanges)).toEqual([{ page: 2, detail: expect.objectContaining({ previous: 1, proposed: 2 }), cancelable: true }]);
	await expect(pager(page).getByRole('button', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
	await pager(page).evaluate(element => element.addEventListener('en-change', event => {
		event.preventDefault(); (element as HTMLElement & { page: number }).page = 7;
	}, { once: true }));
	await pager(page).getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(pager(page)).toHaveJSProperty('page', 7);
	await expect(pager(page).getByRole('button', { name: 'Page 7', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('unknown totals rely on application hasNext and localized names', async ({ page }) => {
	await open(page);
	await pager(page).evaluate(element => Object.assign(element, { pageCount: 0, page: 4, hasNext: false, label: 'Pages des études', previousLabel: 'Page précédente', nextLabel: 'Page suivante', unknownStatusLabel: 'Page {page}' }));
	await expect(pager(page).getByRole('navigation', { name: 'Pages des études' })).toBeVisible();
	await expect(pager(page).getByRole('button', { name: 'Page suivante', exact: true })).toBeDisabled();
	await expect(pager(page).getByRole('button', { name: 'Page précédente', exact: true })).toBeEnabled();
	await expect(pager(page).locator('.en-pagination__status:visible').filter({ hasText: 'Page 4' })).toBeVisible();
	await pager(page).evaluate(element => { (element as HTMLElement & { hasNext: boolean }).hasNext = true; });
	await pager(page).getByRole('button', { name: 'Page suivante', exact: true }).click();
	await expect(pager(page)).toHaveJSProperty('page', 5);
	await pager(page).evaluate(element => { (element as HTMLElement & { disabled: boolean }).disabled = true; });
	for (const button of await pager(page).getByRole('button').all()) await expect(button).toBeDisabled();
});

test('numbered-page activation and external changes preserve native keyboard focus', async ({ page, browserName }) => {
	await open(page);
	await pager(page).evaluate(element => { (element as HTMLElement & { page: number }).page = 6; });
	const button = pager(page).getByRole('button', { name: 'Page 7', exact: true });
	await button.focus(); const identity = await button.evaluateHandle(node => node);
	try {
		await button.press('Enter'); await expect(button).toBeFocused();
		await expect(pager(page)).toHaveJSProperty('page', 7);
		await pager(page).evaluate(element => { (element as HTMLElement & { page: number }).page = 1; });
		await expect(button).toBeFocused();
		expect(await button.evaluate((node, original) => node === original, identity)).toBe(true);
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(pager(page).getByRole('button', { name: 'Choose a page', exact: true })).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(pager(page).getByRole('button', { name: 'Page 12', exact: true })).toBeFocused();
	} finally { await identity.dispose(); }
});

test('phone width RTL and enlarged text retain reachable controls without overflow', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 }); await open(page);
	await page.locator('html').evaluate(node => { node.dir = 'rtl'; node.style.fontSize = '24px'; });
	await pager(page).evaluate(element => Object.assign(element, { pageCount: 10000, page: 5000 }));
	expect(await pager(page).getByRole('button').count()).toBeLessThanOrEqual(9);
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	await pager(page).getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(pager(page)).toHaveJSProperty('page', 5001);
	const scan = await new AxeBuilder({ page }).include('#api-pagination').analyze();
	expect(scan.violations).toEqual([]);
});

test('collection consumers use pagination and preserve selected record across pages', async ({ page }) => {
	await page.goto('/api-examples/virtual-collection.html?progress-report');
	const collection = page.locator('en-virtual-collection-demo');
	await collection.getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('paginated');
	const pages = collection.locator('en-pagination'); await expect(pages).toHaveCount(1);
	await collection.getByRole('checkbox', { name: 'Select Asset 00001', exact: true }).check();
	await pages.getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(collection.locator('[data-record="asset-00021"]')).toBeVisible();
	await pages.getByRole('button', { name: 'Previous page', exact: true }).click();
	await expect(collection.getByRole('checkbox', { name: 'Select Asset 00001', exact: true })).toBeChecked();
});


test('API controls edit the pagination target and reset restores the authored page', async ({ page }) => {
	await page.goto('/api-reference?component=en-pagination&progress-report');
	await expect(page.getByRole('heading', { name: 'en-pagination', exact: true })).toBeVisible();
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	const control = page.locator('.api-element-controls form[data-control="page"]');
	await control.getByRole('textbox', { name: 'page', exact: true }).fill('4');
	await control.getByRole('button', { name: 'Apply page', exact: true }).click();
	const target = page.frameLocator('.api-demo-frame').locator('#api-pagination');
	await expect(target).toHaveJSProperty('page', 4);
	await page.getByRole('button', { name: 'Reset example', exact: true }).click();
	await expect(target).toHaveJSProperty('page', 1);
});

test('inspired themes retain pagination geometry and visible keyboard focus', async ({ page }, info) => {
	await open(page);
	for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		for (const appearance of ['light', 'dark']) {
			await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(appearance);
			const next = pager(page).getByRole('button', { name: 'Next page', exact: true });
			await next.focus(); await expect(next).toBeFocused();
			const geometry = await pager(page).getByRole('button').evaluateAll(nodes => nodes.map(node => ({ height: node.getBoundingClientRect().height, outline: getComputedStyle(node).outlineStyle })));
			expect(Math.max(...geometry.map(x => x.height)) - Math.min(...geometry.map(x => x.height))).toBeLessThanOrEqual(1);
			expect(await next.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
		}
	}
	await page.setViewportSize({ width: 390, height: 844 });
	await pager(page).scrollIntoViewIfNeeded();
	await page.screenshot({ path: info.outputPath('pagination-phone.png') });
});


test('seven cell window keeps Previous, Next and status geometry stable across page boundaries', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 }); await open(page);
	await pager(page).evaluate(node => { node.style.inlineSize = '100%'; });
	const measurements = [];
	for (const current of [1, 6, 9, 10, 12]) {
		await pager(page).evaluate((node, value) => { (node as HTMLElement & { page: number }).page = value; }, current);
		await expect(pager(page)).toHaveJSProperty('page', current);
		await expect(pager(page).locator('[aria-current="page"]')).toHaveText(String(current));
		measurements.push(await pager(page).evaluate(node => {
			const root = node.shadowRoot!;
			const rect = (selector: string) => { const box = root.querySelector(selector)!.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height }; };
			return { previous: rect('[part~="previous"]'), next: rect('[part~="next"]'), status: rect('.en-pagination__wide-status'), cells: [...root.querySelector('.en-pagination__pages')!.children].filter(node => getComputedStyle(node).display !== 'none').map(node => node.getBoundingClientRect().width) };
		}));
	}
	for (const measurement of measurements) {
		expect(measurement.cells).toHaveLength(7);
		expect(Math.max(...measurement.cells) - Math.min(...measurement.cells)).toBeLessThanOrEqual(0.1);
		for (const key of ['previous', 'next'] as const) expect(measurement[key]).toEqual(measurements[0][key]);
		expect(measurement.status.y).toEqual(measurements[0].status.y);
	}
});

test('compact direct-page access validates input and uses the same cancellable change', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 }); await open(page);
	const navigation = pager(page);
	await expect(navigation.locator('.en-pagination__pages')).not.toBeVisible();
	const previousBox = await navigation.getByRole('button', { name: 'Previous page', exact: true }).boundingBox();
	const nextBox = await navigation.getByRole('button', { name: 'Next page', exact: true }).boundingBox();
	expect(previousBox!.height).toBe(nextBox!.height);
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	const input = navigation.getByRole('spinbutton', { name: 'Page number', exact: true });
	await expect(input).toBeVisible();
	for (const invalid of ['', '0', '13', '1.5']) {
		await input.fill(invalid);
		await navigation.getByRole('button', { name: 'Go to page', exact: true }).click();
		await expect(navigation).toHaveJSProperty('page', 1);
		expect(await input.evaluate(node => (node as HTMLInputElement).validity.valid)).toBe(false);
	}
	await input.fill('8'); await input.press('Enter');
	await expect(navigation).toHaveJSProperty('page', 8);
	await expect(input).not.toBeVisible();
	await expect(navigation.getByRole('button', { name: 'Choose a page', exact: true })).toBeFocused();
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	await navigation.evaluate(node => node.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	await input.fill('9'); await input.press('Enter');
	await expect(navigation).toHaveJSProperty('page', 8);
	await expect(navigation.locator('.en-pagination__compact-status')).toHaveText('Page 8 of 12');
	await page.setViewportSize({ width: 1440, height: 1000 });
	await expect(input).toBeFocused(); await expect(input).toBeVisible();
});

test('shrinking a focused numbered window retains its node without page overflow', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 }); await open(page);
	const button = pager(page).getByRole('button', { name: 'Page 3', exact: true });
	await button.focus();
	const original = await button.evaluateHandle(node => node);
	try {
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(button).toBeFocused(); await expect(button).toBeVisible();
		expect(await button.evaluate((node, identity) => node === identity, original)).toBe(true);
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
		await pager(page).getByRole('button', { name: 'Next page', exact: true }).focus();
		await expect(pager(page).locator('.en-pagination__pages')).not.toBeVisible();
	} finally { await original.dispose(); }
});


test('inline page chooser preserves row geometry and returns focus on Escape', async ({ page }) => {
	await open(page);
	const navigation = pager(page);
	const previous = navigation.getByRole('button', { name: 'Previous page', exact: true });
	const next = navigation.getByRole('button', { name: 'Next page', exact: true });
	await expect(previous.locator('svg')).toBeVisible(); await expect(next.locator('svg')).toBeVisible();
	await expect(previous).toHaveAccessibleName('Previous page'); await expect(next).toHaveAccessibleName('Next page');
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 844 });
		const choose = navigation.getByRole('button', { name: 'Choose a page', exact: true });
		await choose.scrollIntoViewIfNeeded();
		const before = await navigation.locator('[part="actions"]').boundingBox();
		await choose.click();
		const input = navigation.getByRole('spinbutton', { name: 'Page number', exact: true });
		await expect(input).toBeFocused();
		await expect(navigation.getByRole('dialog', { name: 'Choose a page', exact: true })).toBeVisible();
		expect(await navigation.locator('[part="actions"]').boundingBox()).toEqual(before);
		const panel = await navigation.getByRole('dialog').boundingBox();
		expect(panel!.x).toBeGreaterThanOrEqual(0); expect(panel!.x + panel!.width).toBeLessThanOrEqual(width);
		await input.press('Escape');
		await expect(navigation.getByRole('dialog')).not.toBeVisible(); await expect(choose).toBeFocused();
	}
});

test('page chooser tracks private shadow scrolling and viewport changes without replacing focus', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 }); await open(page);
	await page.evaluate(() => {
		const host = document.createElement('div'); host.id = 'private-pagination-fixture';
		host.style.cssText = 'position:fixed;top:30px;left:20px;width:350px;z-index:100';
		const root = host.attachShadow({ mode: 'open' });
		root.innerHTML = '<div id="scroll" style="height:280px;overflow:auto"><div style="height:700px;padding-top:180px;box-sizing:border-box"><en-pagination page-count="200"></en-pagination></div></div>';
		document.body.append(host); root.querySelector('#scroll')!.scrollTop = 100;
	});
	const fixture = page.locator('#private-pagination-fixture');
	const choose = fixture.getByRole('button', { name: 'Choose a page', exact: true });
	await choose.click();
	const panel = fixture.getByRole('dialog', { name: 'Choose a page', exact: true });
	const input = fixture.getByRole('spinbutton', { name: 'Page number', exact: true });
	await expect(input).toBeFocused();
	const original = await input.evaluateHandle(node => node);
	try {
		const before = await panel.boundingBox();
		await fixture.locator('#scroll').evaluate(node => { node.scrollTop += 40; });
		await expect.poll(async () => (await panel.boundingBox())!.y).toBeLessThan(before!.y - 30);
		await page.setViewportSize({ width: 390, height: 500 });
		await expect(input).toBeFocused();
		expect(await input.evaluate((node, old) => node === old, original)).toBe(true);
		await expect.poll(async () => { const box = (await panel.boundingBox())!; return box.y + box.height; }).toBeLessThanOrEqual(500);
		await input.fill('122'); await input.press('Enter');
		await expect(fixture.locator('en-pagination')).toHaveJSProperty('page', 122);
		await expect(input).not.toBeVisible(); await expect(choose).toBeFocused();
	} finally { await original.dispose(); }
});


test('changing an open chooser to unknown totals preserves an available focus location', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 }); await open(page);
	const navigation = pager(page);
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	await expect(navigation.getByRole('spinbutton', { name: 'Page number', exact: true })).toBeFocused();
	await navigation.evaluate(node => Object.assign(node, { pageCount: 0, page: 4, hasNext: true }));
	await expect(navigation.getByRole('dialog')).toHaveCount(0);
	await expect(navigation.getByRole('button', { name: 'Previous page', exact: true })).toBeFocused();
	await page.setViewportSize({ width: 700, height: 500 });
	await navigation.evaluate(node => Object.assign(node, { pageCount: 20 }));
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	await expect(navigation.getByRole('spinbutton', { name: 'Page number', exact: true })).toBeFocused();
});

test('intermediate layout keeps first current last and stable action positions', async ({ page, browserName }, info) => {
	await open(page);
	const navigation = page.locator('#api-pagination-intermediate');
	const numbers = navigation.locator('button[data-page]:visible');
	const next = navigation.getByRole('button', { name: 'Next page', exact: true });
	let baseline: { x: number; width: number } | undefined;
	for (const current of [1, 2, 6, 39, 40]) {
		await navigation.evaluate((node, value) => { (node as HTMLElement & { page: number }).page = value; }, current);
		await expect(numbers).toHaveText([...new Set([1, current, 40])].map(String));
		const box = (await next.boundingBox())!;
		baseline ??= { x: box.x, width: box.width };
		expect(box.x).toBeCloseTo(baseline.x, 1); expect(box.width).toBeCloseTo(baseline.width, 1);
	}
	await navigation.evaluate(node => { (node as HTMLElement & { page: number }).page = 6; });
	const before = await next.boundingBox();
	await navigation.getByRole('button', { name: 'Page 6', exact: true }).focus();
	await expect(numbers).toHaveText(['1', '6', '40']);
	expect(await next.boundingBox()).toEqual(before);
	const chooser = navigation.getByRole('button', { name: 'Choose a page', exact: true });
	await expect(chooser).toHaveCount(1);
	const currentBox = (await navigation.getByRole('button', { name: 'Page 6', exact: true }).boundingBox())!;
	const lastBox = (await navigation.getByRole('button', { name: 'Page 40', exact: true }).boundingBox())!;
	const chooserBox = (await chooser.boundingBox())!;
	expect(chooserBox.x).toBeGreaterThan(currentBox.x); expect(chooserBox.x).toBeLessThan(lastBox.x);
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(chooser).toBeFocused();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(navigation.getByRole('button', { name: 'Page 40', exact: true })).toBeFocused();
	await chooser.click();
	await expect(navigation.getByRole('spinbutton', { name: 'Page number', exact: true })).toBeFocused();
	await page.setViewportSize({ width: 390, height: 844 });
	await navigation.getByRole('spinbutton').press('Escape');
	await expect(navigation.locator('button:focus')).toBeVisible();
	await page.setViewportSize({ width: 1280, height: 900 });
	await next.focus();
	await navigation.screenshot({ path: info.outputPath('pagination-intermediate.png') });
});

test('icon slots retain native button names, updates, activation and RTL defaults', async ({ page, browserName }) => {
	await open(page);
	const navigation = pager(page);
	const next = navigation.getByRole('button', { name: 'Next page', exact: true });
	await expect(next.locator('svg')).toBeVisible();
	await navigation.evaluate(node => {
		const icon = document.createElement('en-icon'); icon.slot = 'next'; icon.setAttribute('name', 'arrow-right'); icon.setAttribute('aria-hidden', 'true'); node.append(icon);
	});
	await expect(next.locator('slot[name="next"]')).toHaveCount(1);
	await expect(navigation.locator('en-icon[slot="next"] svg')).toBeVisible();
	await expect(next).toHaveAccessibleName('Next page');
	await next.focus(); await next.press('Enter');
	await expect(navigation).toHaveJSProperty('page', 2);
	await expect(next).toBeFocused();
	await navigation.evaluate(node => { node.querySelector('[slot="next"]')!.remove(); });
	await expect(next.locator('svg')).toBeVisible();
	const direction = () => next.locator('svg').evaluate(node => ({ rotate: getComputedStyle(node).rotate, transform: getComputedStyle(node).transform, parentRotate: getComputedStyle(node.parentElement!).rotate, parentTransform: getComputedStyle(node.parentElement!).transform }));
	const ltr = await direction();
	await navigation.evaluate(node => { node.dir = 'rtl'; });
	expect(await direction()).not.toEqual(ltr);
	await expect(next).toHaveAccessibleName('Next page');
	await navigation.evaluate(node => { node.setAttribute('next-label', 'Page suivante'); });
	await expect(navigation.locator('[part~=next]')).toHaveAccessibleName('Page suivante');
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(navigation.locator('[part~=next]')).not.toBeFocused();
});

test('server rendered intermediate pagination and slotted icons work before hydration', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage(); await page.goto(path);
		const navigation = page.locator('#api-pagination-intermediate');
		await expect(navigation.locator('button[data-page]:visible')).toHaveText(['1', '6', '40']);
		await page.getByText('Customize the navigation icons or text', { exact: true }).click();
		const slotted = page.locator('#api-pagination-slotted');
		await expect(slotted.locator('en-icon[slot="previous"] svg')).toBeVisible();
		await expect(slotted.getByRole('button', { name: 'Previous page', exact: true })).toBeEnabled();
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(navigation.locator('.en-pagination__pages')).not.toBeVisible();
		await expect(navigation.getByRole('button', { name: 'Choose a page', exact: true })).toBeVisible();
	} finally { await context.close(); }
});

for (const width of [390, 700, 1440]) test(`page chooser closes accepted actions and Cancel at ${width}px`, async ({ page }) => {
	await page.setViewportSize({ width, height: 1000 }); await open(page);
	const navigation = pager(page);
	const choose = navigation.locator('button[popovertarget]:visible').first();
	const input = navigation.getByRole('spinbutton', { name: 'Page number', exact: true });
	const panel = navigation.getByRole('dialog');
	for (const target of ['8', '8', '12', '1']) {
		await choose.click();
		const invoker = navigation.locator('[data-jump-invoker]');
		const openedBy = await invoker.elementHandle();
		await expect(input).toBeFocused(); await input.fill(target);
		await navigation.getByRole('button', { name: 'Go to page', exact: true }).click();
		await expect(navigation).toHaveJSProperty('page', Number(target));
		await expect(panel).not.toBeVisible();
		await expect.poll(() => openedBy!.evaluate(node => node.matches(':focus'))).toBe(true);
		await openedBy!.dispose();
	}
	await choose.click(); await input.fill('5');
	await navigation.evaluate(node => { (node as HTMLElement & { cancelLabel: string }).cancelLabel = 'Dismiss chooser'; });
	await navigation.getByRole('button', { name: 'Dismiss chooser', exact: true }).click();
	await expect(panel).not.toBeVisible(); await expect(choose).toBeFocused();
	await expect(navigation).toHaveJSProperty('page', 1);
});


test('inline mobile example stays compact beside larger examples and operates independently', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 }); await open(page);
	const mobile = page.locator('#api-pagination-mobile');
	await expect(mobile.locator('.en-pagination__pages')).not.toBeVisible();
	await expect(mobile.locator('.en-pagination__compact-status')).toHaveText('Page 6 of 40');
	await expect(page.locator('#api-pagination-intermediate').getByRole('button', { name: 'Page 6', exact: true })).toBeVisible();
	await mobile.getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(mobile).toHaveJSProperty('page', 7);
	await mobile.getByRole('button', { name: 'Choose a page', exact: true }).click();
	await mobile.getByRole('spinbutton', { name: 'Page number', exact: true }).fill('25');
	await mobile.getByRole('button', { name: 'Go to page', exact: true }).click();
	await expect(mobile).toHaveJSProperty('page', 25);
	await expect(mobile.getByRole('dialog')).not.toBeVisible();
	await expect(pager(page)).toHaveJSProperty('page', 1);
	await expect(page.locator('#api-pagination-intermediate')).toHaveJSProperty('page', 6);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(mobile).toBeVisible();
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('wide and intermediate layouts share one inline chooser side and preserve its focus on resize', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 }); await open(page);
	const navigation = pager(page);
	await navigation.evaluate(node => { (node as HTMLElement & { pageCount: number }).pageCount = 40; });
	for (const width of ['60em', '36em']) {
		await navigation.evaluate((node, size) => { node.style.inlineSize = size; }, width);
		for (const current of [1, 6, 36, 37, 39, 40]) {
			await navigation.evaluate((node, value) => { (node as HTMLElement & { page: number }).page = value; }, current);
			const chooser = navigation.getByRole('button', { name: 'Choose a page', exact: true });
			await expect(chooser).toHaveCount(1);
			await expect(chooser.locator('..')).toHaveAttribute('data-intermediate-column', current >= 37 ? '2' : '4');
			await expect(navigation.locator('.en-pagination__direct-trigger')).not.toBeVisible();
			await chooser.click();
			await expect(navigation.getByRole('spinbutton')).toBeFocused();
			await navigation.getByRole('button', { name: 'Cancel', exact: true }).click();
			await expect(chooser).toBeFocused();
			await chooser.blur();
		}
	}
	await navigation.evaluate(node => { node.style.inlineSize = '60em'; (node as HTMLElement & { page: number }).page = 6; });
	const chooser = navigation.getByRole('button', { name: 'Choose a page', exact: true });
	await chooser.click(); const original = await navigation.locator('[data-jump-invoker]').elementHandle();
	await navigation.evaluate(node => { node.style.inlineSize = '36em'; });
	await expect(navigation.getByRole('spinbutton')).toBeFocused();
	await navigation.getByRole('spinbutton').press('Escape');
	await expect.poll(() => original!.evaluate(node => node.matches(':focus'))).toBe(true);
	await original!.dispose();
});

test('distribution parts and alignment token support consumer layouts without private selectors', async ({ page }) => {
	await open(page);
	await page.getByText('Customize alignment and button distribution', { exact: true }).click();
	const start = page.locator('en-pagination.pagination-start');
	const spread = page.locator('en-pagination.pagination-distributed');
	for (const [target, align] of [[start, 'start'], [pager(page), 'center']] as const) {
		const boxes = await target.evaluate(node => {
			const box = (part: string) => { const r = node.shadowRoot!.querySelector(`[part~="${part}"]`)!.getBoundingClientRect(); return { x:r.x, right:r.right, width:r.width }; };
			return { host:node.getBoundingClientRect().width, actions:box('actions'), previous:box('previous'), next:box('next') };
		});
		expect(boxes.actions.width).toBeCloseTo(boxes.host, 1);
		if (align === 'start') expect(boxes.previous.x - boxes.actions.x).toBeLessThan(10);
		else expect((boxes.previous.x + boxes.next.right)/2).toBeCloseTo((boxes.actions.x + boxes.actions.right)/2, 1);
	}
	const edges = await spread.evaluate(node => {
		const root = node.shadowRoot!;const row = root.querySelector('[part~="actions"]')!.getBoundingClientRect();const previous = root.querySelector('[part~="previous"]')!.getBoundingClientRect();const next=root.querySelector('[part~="next"]')!.getBoundingClientRect();
		return { start:previous.left-row.left, end:row.right-next.right };
	});
	expect(edges.start).toBeLessThan(10);expect(edges.end).toBeLessThan(10);
	await spread.getByRole('button', { name:'Next page', exact:true }).click();await expect(spread).toHaveJSProperty('page',7);
});

test('compact themed controls retain natural arrow sizes and handle long slotted text in RTL', async ({ page }) => {
	await open(page);
	const mobile=page.locator('#api-pagination-mobile');
	for (const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
		await page.getByRole('combobox', { name:'Inspired theme', exact:true }).selectOption(theme);
		await expect(page.getByRole('status', {name:'Theme result'})).toContainText('applied');
		const widths=await mobile.evaluate(node=>{const root=node.shadowRoot!;return { host:node.getBoundingClientRect().width, previous:root.querySelector('[part~="previous"]')!.getBoundingClientRect().width, next:root.querySelector('[part~="next"]')!.getBoundingClientRect().width };});
		expect(widths.previous).toBeLessThan(widths.host/4);expect(widths.next).toBeCloseTo(widths.previous,1);
	}
	await page.setViewportSize({width:390,height:844});
	await mobile.evaluate(node=>{
		node.dir='rtl';node.style.fontSize='200%';
		const el=node as HTMLElement & {previousLabel:string;nextLabel:string;statusLabel:string};el.previousLabel='Vorherige Ergebnisse';el.nextLabel='Weiter';el.statusLabel='Ergebnisseite {page} von {pages}';
		const previous=document.createElement('span');previous.slot='previous';previous.textContent=el.previousLabel;
		const next=document.createElement('span');next.slot='next';next.textContent=el.nextLabel;
		node.append(previous,next);
	});
	await expect(mobile.getByRole('button',{name:'Vorherige Ergebnisse'})).toBeVisible();
	await expect.poll(()=>mobile.evaluate(node=>{const row=node.shadowRoot!.querySelector('[part~="actions"]')!;return row.scrollWidth-row.clientWidth;})).toBeLessThanOrEqual(1);
	await mobile.getByRole('button',{name:'Weiter',exact:true}).click();await expect(mobile).toHaveJSProperty('page',7);
	await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
});

test('known-total specimens render their chooser eagerly while unknown totals omit it', async ({ page }) => {
	await open(page);
	await expect(page.locator('en-pagination .en-pagination__jump')).toHaveCount(7);
	await expect(page.locator('#api-pagination-unknown [popover]')).toHaveCount(0);
});

for (const activation of ['click', 'Enter', 'Space', 'native'] as const) {
	test(`eager chooser has a complete first presentation through ${activation}`, async ({ page }) => {
		await open(page);
		const navigation = pager(page);
		const choose = navigation.getByRole('button', { name: 'Choose a page', exact: true });
		const panel = navigation.locator('[popover]');
		const original = await panel.elementHandle();
		await expect(navigation.locator('input')).toHaveCount(1);
		await panel.evaluate(element => {
			(window as any).paginationOpening = { before: 0, presented: [] };
			element.addEventListener('beforetoggle', event => {
				if ((event as ToggleEvent).newState === 'open') (window as any).paginationOpening.before++;
			});
			element.addEventListener('toggle', event => {
				if ((event as ToggleEvent).newState === 'open') (window as any).paginationOpening.presented.push({
					body: Boolean(element.querySelector('.en-pagination__jump')),
					input: Boolean(element.querySelector('input')),
					visibility: getComputedStyle(element).visibility,
					focused: element.getRootNode() instanceof ShadowRoot && (element.getRootNode() as ShadowRoot).activeElement === element.querySelector('input'),
				});
			});
		});
		try {
			if (activation === 'click') await choose.click();
			else if (activation === 'native') {
				expect(await panel.evaluate(element => {
					(element as HTMLElement).showPopover();
					return { open: element.matches(':popover-open'), input: Boolean(element.querySelector('input')) };
				})).toEqual({ open: true, input: true });
			} else { await choose.focus(); await choose.press(activation); }
			const input = navigation.getByRole('spinbutton', { name: 'Page number', exact: true });
			await expect(input).toBeVisible(); await expect(input).toBeFocused();
			expect(await panel.evaluate((element, old) => element === old, original)).toBe(true);
			await expect.poll(() => page.evaluate(() => (window as any).paginationOpening)).toEqual({
				before: 1, presented: [{ body: true, input: true, visibility: 'visible', focused: true }],
			});
			const inputIdentity = await input.elementHandle();
			try {
				await input.fill('9'); await input.press('Escape');
				await expect(panel).not.toBeVisible();
				await expect(navigation.locator('input[part~="page-input"]')).toHaveValue('9');
				await choose.click(); await expect(input).toBeFocused();
				expect(await input.evaluate((element, old) => element === old, inputIdentity)).toBe(true);
				await expect(input).toHaveValue('9');
			} finally { await inputIdentity?.dispose(); }
		} finally { await original?.dispose(); }
	});
}

for (const stage of ['render', 'updated'] as const) {
	test(`native opening reentered from ${stage} preserves the eager body without replay`, async ({ page }) => {
		await open(page);
		const result = await page.evaluate(async where => {
			const Base = customElements.get('en-pagination') as any;
			class ReentrantPagination extends Base {
				armed = false;
				renders = 0;
				opened = 0;
				nativeReturnedOpen = false;
				openNative() {
					if (!this.armed) return;
					this.armed = false; this.opened++;
					const panel = this.shadowRoot.querySelector('[popover]');
					panel.showPopover();
					this.nativeReturnedOpen = panel.matches(':popover-open');
				}
				render() {
					this.renders++;
					const result = super.render();
					if (where === 'render') this.openNative();
					return result;
				}
				updated(changes: unknown) { super.updated(changes); if (where === 'updated') this.openNative(); }
			}
			customElements.define(`en-pagination-reentrant-${where}`, ReentrantPagination as unknown as CustomElementConstructor);
			const host = new ReentrantPagination();
			host.id = 'reentrant-pagination'; host.pageCount = 12;
			document.body.append(host); await host.updateComplete;
			const panel = host.shadowRoot.querySelector('[popover]');
			const before = host.renders;
			host.armed = true; host.requestUpdate(); host.performUpdate();
			return { nativeCalls: host.opened, nativeReturnedOpen: host.nativeReturnedOpen,
				renders: host.renders - before, samePanel: panel === host.shadowRoot.querySelector('[popover]'),
				bodyAtUpdateReturn: Boolean(panel.querySelector('input')) };
		}, stage);
		expect(result).toEqual({ nativeCalls: 1, nativeReturnedOpen: true, renders: 1, samePanel: true, bodyAtUpdateReturn: true });
		await expect(page.locator('#reentrant-pagination').getByRole('spinbutton')).toBeVisible();
		await expect(page.locator('#reentrant-pagination').getByRole('spinbutton')).toBeFocused();
	});
}

test('native validity and authoritative transactions preserve drafts and input identity', async ({ page }) => {
	await open(page);
	const navigation = pager(page);
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	const input = navigation.getByRole('spinbutton', { name: 'Page number', exact: true });
	const identity = await input.elementHandle();
	await navigation.evaluate(element => {
		(window as any).lazyPaginationChanges = 0;
		element.addEventListener('en-change', () => { (window as any).lazyPaginationChanges++; });
	});
	try {
		for (const invalid of ['', '0', '13', '2.5']) {
			await input.fill(invalid); await input.press('Enter');
			await expect(input).toBeVisible();
			await expect(navigation).toHaveJSProperty('page', 1);
		}
		expect(await page.evaluate(() => (window as any).lazyPaginationChanges)).toBe(0);
		await navigation.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
		await input.fill('9'); await input.press('Enter');
		await expect(navigation).toHaveJSProperty('page', 1); await expect(input).toHaveValue('9');
		await expect(input).toBeVisible();
		await navigation.evaluate(element => element.addEventListener('en-change', event => {
			event.preventDefault(); (element as any).page = 7;
		}, { once: true }));
		await input.press('Enter');
		await expect(navigation).toHaveJSProperty('page', 7); await expect(input).toHaveValue('7');
		await expect(input).toBeVisible();
		expect(await input.evaluate((element, old) => element === old, identity)).toBe(true);
	} finally { await identity?.dispose(); }
});

test('eager chooser survives disabled state, unknown totals, removal and adoption', async ({ page }) => {
	await open(page);
	const navigation = pager(page);
	await navigation.evaluate(element => { (element as any).disabled = true; });
	await expect(navigation.getByRole('button', { name: 'Choose a page', exact: true })).toBeDisabled();
	await expect(navigation.locator('input')).toHaveCount(1);
	await navigation.evaluate(element => { Object.assign(element, { disabled: false, pageCount: 0 }); });
	await expect(navigation.locator('[popover]')).toHaveCount(0);
	await navigation.evaluate(element => { (element as any).pageCount = 12; });
	await expect(navigation.locator('[popover]')).toHaveCount(1);
	await expect(navigation.locator('input')).toHaveCount(1);
	await navigation.getByRole('button', { name: 'Choose a page', exact: true }).click();
	const input = navigation.getByRole('spinbutton');
	await input.fill('8'); await input.press('Escape');
	const retainedInput = navigation.locator('input[part~="page-input"]');
	const identity = await retainedInput.elementHandle();
	try {
		await navigation.evaluate(async element => {
			const parent = element.parentNode!, next = element.nextSibling;
			element.remove(); parent.insertBefore(element, next); await (element as any).updateComplete;
		});
		await expect(retainedInput).toHaveValue('8');
		expect(await retainedInput.evaluate((element, old) => element === old, identity)).toBe(true);
		await page.evaluate(async () => {
			const frame = document.createElement('iframe'); frame.id = 'pagination-adoption';
			frame.style.cssText = 'width:800px;height:300px'; document.body.append(frame);
			const host = document.querySelector('#api-pagination')!;
			frame.contentDocument!.body.append(frame.contentDocument!.adoptNode(host));
			await (host as any).updateComplete;
		});
		const adopted = page.frameLocator('#pagination-adoption').locator('#api-pagination');
		await adopted.getByRole('button', { name: 'Choose a page', exact: true }).click();
		await expect(adopted.getByRole('spinbutton')).toBeFocused();
		await expect(adopted.getByRole('spinbutton')).toHaveValue('8');
		expect(await page.evaluate(old => {
			const frame = document.querySelector<HTMLIFrameElement>('#pagination-adoption')!;
			return frame.contentDocument!.querySelector('#api-pagination')!.shadowRoot!.querySelector('input') === old;
		}, identity)).toBe(true);
	} finally { await identity?.dispose(); }
});

for (const transition of ['disabled', 'unknown'] as const) {
	test(`pending ${transition} author update is not flushed inside native opening`, async ({ page }) => {
		await open(page);
		const result = await pager(page).evaluate(async (element, state) => {
			const host = element as any;
			const panel = host.shadowRoot.querySelector('[popover]') as HTMLElement;
			if (state === 'disabled') host.disabled = true;
			else host.pageCount = 0;
			let exception: string | null = null;
			try { panel.showPopover(); } catch (error) { exception = (error as Error).name; }
			const bodyBeforeUpdate = Boolean(panel.querySelector('input'));
			await host.updateComplete;
			return { exception, bodyBeforeUpdate, bodyAfterUpdate: Boolean(host.shadowRoot.querySelector('input')),
				open: panel.matches(':popover-open'), connected: panel.isConnected };
		}, transition);
		expect(result).toEqual({ exception: null, bodyBeforeUpdate: true, bodyAfterUpdate: transition === 'disabled',
			open: false, connected: transition === 'disabled' });
	});
}

test('settled disabled native opening keeps disabled controls and closes on later updates', async ({ page }) => {
	await open(page);
	const result = await page.evaluate(async () => {
		const host = document.createElement('en-pagination') as any;
		host.id = 'disabled-native'; host.pageCount = 12; host.disabled = true;
		document.body.append(host); await host.updateComplete;
		const panel = host.shadowRoot.querySelector('[popover]') as HTMLElement;
		const input = panel.querySelector('input')!;
		panel.showPopover();
		return { open: panel.matches(':popover-open'), sameInput: input === panel.querySelector('input'), disabled: input.disabled };
	});
	expect(result).toEqual({ open: true, sameInput: true, disabled: true });
	const host = page.locator('#disabled-native');
	await expect(host.getByRole('dialog')).toBeVisible();
	await expect(host.getByRole('spinbutton')).toBeDisabled();
	await host.evaluate(element => { (element as any).pageNumberLabel = 'Current page number'; });
	await expect(host.getByRole('dialog')).not.toBeVisible();
});

async function createEditingPager(page: Page) {
	await open(page);
	await page.evaluate(async () => {
		const host = document.createElement('en-pagination') as any;
		host.id = 'editing-pagination'; host.pageCount = 12; host.page = 3;
		host.style.inlineSize = '280px';
		(window as any).paginationEditingEvents = { changes: [], inputs: [] };
		host.addEventListener('en-change', (event: CustomEvent) => (window as any).paginationEditingEvents.changes.push(event.detail));
		host.addEventListener('en-input', (event: CustomEvent) => (window as any).paginationEditingEvents.inputs.push(event.detail));
		document.body.append(host); await host.updateComplete;
	});
	return page.locator('#editing-pagination');
}

test(`eager chooser owns canceled drafts through forced renders and silent author writes`, async ({ page }) => {
	const host = await createEditingPager(page);
	const choose = host.getByRole('button', { name: 'Choose a page', exact: true });
	await choose.click();
	const input = host.locator('input');
	await input.fill('9');
	await host.evaluate(element => element.addEventListener('en-change', event => {
		event.preventDefault(); (element as any).performUpdate();
		(window as any).paginationTentativeDraft = { page: (element as any).page, value: element.shadowRoot!.querySelector('input')!.value };
	}, { once: true }));
	await input.press('Enter');
	expect(await page.evaluate(() => (window as any).paginationTentativeDraft)).toEqual({ page: 9, value: '9' });
	await expect(host).toHaveJSProperty('page', 3); await expect(input).toHaveValue('9');
	await host.evaluate(element => { (element as any).label = 'Updated pages'; (element as any).pageCount = 12; });
	await expect(input).toHaveValue('9');
	await host.evaluate(element => { (element as any).page = 3; (element as any).performUpdate(); });
	await expect(input).toHaveValue('3');
	expect(await page.evaluate(() => (window as any).paginationEditingEvents)).toEqual({ changes: [expect.objectContaining({ previous: 3, proposed: 9 })], inputs: [] });
	await input.fill('09'); await input.press('Enter');
	await expect(host).toHaveJSProperty('page', 9); await expect(input).toHaveValue('9');
	await choose.click(); await input.fill('09'); await input.press('Enter');
	await expect(input).toHaveValue('09');
	expect(await page.evaluate(() => (window as any).paginationEditingEvents.changes.length)).toBe(2);
	await choose.click();
	await host.evaluate(element => element.addEventListener('en-change', event => {
		event.preventDefault(); (element as any).page = 5; (element as any).performUpdate();
	}, { once: true }));
	await input.fill('7'); await input.press('Enter');
	await expect(host).toHaveJSProperty('page', 5); await expect(input).toHaveValue('5');
	await expect(input).toBeVisible();
	expect(await page.evaluate(() => (window as any).paginationEditingEvents.inputs)).toEqual([]);
});

test(`eager chooser preserves pristine composition and finishes orphaned drafts without acceptance`, async ({ page }) => {
	const host = await createEditingPager(page);
	const choose = host.getByRole('button', { name: 'Choose a page', exact: true });
	await choose.click();
	const input = host.locator('input');
	expect(await host.evaluate(element => {
		const field = element.shadowRoot!.querySelector('input')!;
		field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		(element as any).page = 5; (element as any).performUpdate();
		const enter = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
		field.dispatchEvent(enter);
		return { page: (element as any).page, value: field.value, prevented: enter.defaultPrevented };
	})).toEqual({ page: 5, value: '3', prevented: false });
	await input.evaluate(field => {
		(field as HTMLInputElement).value = '7';
		field.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText' }));
		field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
	});
	await expect(input).toHaveValue('5'); await expect(host).toHaveJSProperty('page', 5);
	expect(await page.evaluate(() => (window as any).paginationEditingEvents)).toEqual({ changes: [], inputs: [] });
	await input.evaluate(field => {
		field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		(field as HTMLInputElement).value = '8';
		field.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText' }));
		field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
	});
	await expect(host).toHaveJSProperty('page', 5); await expect(input).toHaveValue('8');
	await input.press('Enter'); await expect(host).toHaveJSProperty('page', 8);
	await choose.click();
	await host.evaluate(async element => {
		const field = element.shadowRoot!.querySelector('input')!;
		field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		field.value = '11'; field.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
		const parent = element.parentNode!, next = element.nextSibling;
		element.remove(); parent.insertBefore(element, next); await (element as any).updateComplete;
	});
	await expect(input).toHaveValue('11'); await expect(host).toHaveJSProperty('page', 8);
	expect(await page.evaluate(() => (window as any).paginationEditingEvents)).toEqual({ changes: [expect.objectContaining({ previous: 5, proposed: 8 })], inputs: [] });
});

test(`eager chooser reconciles property batches and recreates unknown-total input from accepted page`, async ({ page }) => {
	const host = await createEditingPager(page);
	const choose = host.getByRole('button', { name: 'Choose a page', exact: true });
	await choose.click();
	const input = host.locator('input');
	for (const order of ['page-first', 'count-first']) {
		await host.evaluate(async (element, order) => {
			Object.assign(element, { pageCount: 12, page: 3 }); await (element as any).updateComplete;
			if (order === 'page-first') Object.assign(element, { page: 9, pageCount: 6 });
			else Object.assign(element, { pageCount: 6, page: 9 });
		}, order);
		await expect(host).toHaveJSProperty('page', 6); await expect(input).toHaveValue('6');
	}
	await input.fill('5');
	await host.evaluate(element => {
		(element as any).pageCount = 0; (element as any).hasNext = true;
		element.addEventListener('en-change', event => {
			(element as any).performUpdate(); event.preventDefault();
		}, { once: true });
		(element.shadowRoot!.querySelector('[part~=previous]') as HTMLButtonElement).click();
	});
	await expect(input).toHaveCount(0);
	await host.evaluate(element => { (element as any).pageCount = 12; });
	await choose.click();
	await expect(input).toHaveValue('6'); await expect(input).toBeFocused();
	expect(await page.evaluate(() => (window as any).paginationEditingEvents)).toEqual({ changes: [expect.objectContaining({ previous: 6, proposed: 5 })], inputs: [] });
});
