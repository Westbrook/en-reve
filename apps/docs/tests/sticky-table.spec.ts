import { expect, test, type Page } from '@playwright/test';

const path = '/api-examples/virtual-collection.html?progress-report';
const demo = (page: Page) => page.locator('en-virtual-collection-demo');
const table = (page: Page) => demo(page).locator('en-table');
const viewport = (page: Page) => table(page).locator('[part~="viewport"]');

const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => { const collected: string[] = []; errors.set(page, collected); page.on('pageerror', error => collected.push(error.message)); });
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]); });

async function open(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(table(page)).toBeVisible();
}
async function geometry(page: Page) {
	return table(page).evaluate(host => {
		const viewport = host.shadowRoot!.querySelector('[part~="viewport"]')!;
		const box = viewport.getBoundingClientRect();
		const rectangle = (selector: string) => {
			const node = host.querySelector(selector);
			if (!node) return null;
			const rect = node.getBoundingClientRect();
			return { top: rect.top, bottom: rect.bottom, height: rect.height, position: getComputedStyle(node).position };
		};
		return { viewport: { top: box.top, bottom: box.bottom }, header: rectangle('thead')!, footer: rectangle('tfoot'), caption: rectangle('caption')!, scrollTop: viewport.scrollTop };
	});
}
async function expectHeaderVisible(page: Page) {
	await expect.poll(async () => {
		const value = await geometry(page);
		return Math.abs(value.header.top - value.viewport.top);
	}).toBeLessThan(2);
}
async function expandScrollDemo(page: Page) {
	const disclosure = demo(page).locator('details.scroll-demo');
	if (!await disclosure.evaluate(node => (node as HTMLDetailsElement).open)) await disclosure.locator('summary').click();
}
async function reveal(page: Page, number: number) {
	await expandScrollDemo(page);
	await demo(page).getByRole('textbox', { name: 'Asset key', exact: true }).fill(`asset-${String(number).padStart(5, '0')}`);
	await demo(page).getByRole('button', { name: 'Show asset', exact: true }).click();
	const row = demo(page).locator(`[data-en-virtual-key="asset-${String(number).padStart(5, '0')}"]`);
	await expect(row).toBeVisible();
	return row;
}

test('composed columns retain one native group and matching cell geometry before and after hydration', async ({ page, browser, baseURL }) => {
	const verify = async (target: Page) => {
		const native = table(target).locator('table');
		await expect(native.locator(':scope > colgroup')).toHaveCount(1);
		await expect(native.locator(':scope > colgroup > col')).toHaveCount(3);
		await expect(native.locator('colgroup colgroup')).toHaveCount(0);
		const geometry = await native.evaluate(node => {
			const cells = [...node.querySelector('[data-en-virtual-key]')!.children];
			const headings = [...node.querySelector('thead tr')!.children];
			return {
				table: node.getBoundingClientRect().width,
				cells: cells.map((cell, index) => ({ body: cell.getBoundingClientRect().width, header: headings[index]!.getBoundingClientRect().width })),
			};
		});
		// WebKit does not expose rendered geometry on col elements. Native header/
		// body cells must align and account for the whole table without a phantom column.
		for (const cell of geometry.cells) expect(Math.abs(cell.header - cell.body)).toBeLessThan(1);
		expect(Math.abs(geometry.cells.reduce((sum, cell) => sum + cell.body, 0) - geometry.table)).toBeLessThan(1);
		expect(geometry.cells[1]!.body).toBeGreaterThan(geometry.cells[0]!.body);
	};
	const ssr = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const initial = await ssr.newPage(); await initial.goto(path); await verify(initial);
	} finally { await ssr.close(); }
	await open(page); await verify(page);
});

test('default sticky header stays visible after real scroll events while caption scrolls away', async ({ page }) => {
	await open(page);
	await viewport(page).evaluate(node => { node.scrollTop = 4000; });
	await expectHeaderVisible(page);
	const value = await geometry(page);
	expect(value.caption.bottom).toBeLessThan(value.viewport.top);
	await expect(demo(page).locator('[data-en-virtual-key]').first()).not.toHaveAttribute('data-en-virtual-key', 'asset-00001');
	await table(page).evaluate(node => node.setAttribute('sticky', 'none'));
	await expect.poll(async () => (await geometry(page)).header.bottom).toBeLessThan(value.viewport.top);
});

test('optional caption and footer stay visible and revealed rows clear both edges', async ({ page }) => {
	await open(page);
	await demo(page).getByRole('combobox', { name: 'Sticky table sections', exact: true }).selectOption('both');
	await demo(page).getByRole('checkbox', { name: 'Keep caption visible', exact: true }).check();
	await demo(page).getByRole('checkbox', { name: 'Show table summary', exact: true }).check();
	for (const number of [5000, 10000, 1]) {
		const row = await reveal(page, number);
		await expect.poll(async () => {
			const value = await geometry(page); const box = await row.boundingBox();
			return !!box && box.y >= value.header.bottom - 2 && box.y + box.height <= value.footer!.top + 2;
		}).toBe(true);
		const value = await geometry(page);
		expect(Math.abs(value.caption.top - value.viewport.top)).toBeLessThan(2);
		expect(Math.abs(value.header.top - value.caption.bottom)).toBeLessThan(2);
		expect(Math.abs(value.footer!.bottom - value.viewport.bottom)).toBeLessThan(2);
	}
});

test('native multirow header sticks as one section and keyboard focus clears header and footer', async ({ page }) => {
	await page.goto('/api-examples/authored-table.html');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const host = page.locator('#specimen-table');
	await host.evaluate(node => {
		node.setAttribute('sticky', 'both');
		const native = node.querySelector('table')!;
		const group = native.tHead!.insertRow(0);
		const cell = document.createElement('th'); cell.colSpan = 4; cell.scope = 'colgroup'; cell.textContent = 'Asset metadata'; group.append(cell);
		native.tBodies[0]!.replaceChildren();
		for (let index = 0; index < 30; index++) {
			const row = native.tBodies[0]!.insertRow();
			for (let column = 0; column < 4; column++) {
				const cell = row.insertCell();
				if (column === 0) { const button = document.createElement('button'); button.textContent = `Row ${index + 1}`; button.tabIndex = 0; cell.append(button); }
				else cell.textContent = 'Description';
			}
		}
		const footer = native.createTFoot().insertRow().insertCell(); footer.colSpan = 4; footer.textContent = '30 assets';
		(node.shadowRoot!.querySelector('[part~="viewport"]') as HTMLElement).style.maxHeight = '320px';
	});
	const region = host.locator('[part~="viewport"]');
	await region.evaluate(node => { node.scrollTop = 500; });
	await expect.poll(() => host.evaluate(node => {
		const head = node.querySelector('thead')!.getBoundingClientRect();
		const region = node.shadowRoot!.querySelector('[part~="viewport"]')!.getBoundingClientRect();
		return Math.abs(head.top - region.top);
	})).toBeLessThan(2);
	const headerRows = await host.locator('thead tr').evaluateAll(rows => rows.map(row => { const box = row.getBoundingClientRect(); return { top: box.top, bottom: box.bottom }; }));
	expect(headerRows[1]!.top).toBeGreaterThanOrEqual(headerRows[0]!.bottom - 1);
	const button = host.getByRole('button', { name: 'Row 20', exact: true });
	await button.focus(); await button.press('Tab');
	await expect(host.getByRole('button', { name: 'Row 21', exact: true })).toBeFocused();
	await expect.poll(() => host.evaluate(node => {
		const head = node.querySelector('thead')!.getBoundingClientRect();
		const foot = node.querySelector('tfoot')!.getBoundingClientRect();
		const focused = node.querySelector('button:focus')!.getBoundingClientRect();
		return focused.top >= head.bottom - 1 && focused.bottom <= foot.top + 1;
	})).toBe(true);
});

test('short scrollports preserve body space without changing requested sticky preferences', async ({ page }) => {
	await open(page);
	await demo(page).getByRole('combobox', { name: 'Sticky table sections', exact: true }).selectOption('both');
	await demo(page).getByRole('checkbox', { name: 'Keep caption visible', exact: true }).check();
	await demo(page).getByRole('checkbox', { name: 'Show table summary', exact: true }).check();
	await viewport(page).evaluate(node => { (node as HTMLElement).style.maxHeight = '140px'; });
	await expect(table(page)).toHaveAttribute('sticky', 'both');
	await expect(table(page)).toHaveAttribute('sticky-caption', '');
	await expect.poll(() => table(page).evaluate((node: any) => {
		const region = node.shadowRoot.querySelector('[part~="viewport"]');
		return node.scrollInsets.blockStart + node.scrollInsets.blockEnd <= region.clientHeight / 2 + 1;
	})).toBe(true);
	await reveal(page, 7000);
	await expect(demo(page).getByRole('checkbox', { name: 'Select Asset 07000', exact: true })).toBeVisible();
});

test('server-rendered table keeps the header visible without JavaScript and prints without sticky sections', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	try {
		await page.goto(path);
		await expect(table(page)).toBeVisible();
		await viewport(page).evaluate(node => { node.scrollTop = 400; });
		await expectHeaderVisible(page);
		await page.emulateMedia({ media: 'print' });
		await expect(table(page).locator('thead')).not.toHaveCSS('position', 'sticky');
	} finally { await context.close(); }
});

for (const device of [
	{ name: 'phone portrait', width: 390, height: 844 },
	{ name: 'phone landscape', width: 844, height: 390 },
	{ name: 'tablet portrait', width: 768, height: 1024 },
	{ name: 'tablet landscape', width: 1024, height: 768 },
]) {
	test(`touch ${device.name} keeps sticky sections and controls usable`, async ({ browser, browserName, baseURL }, info) => {
		test.skip(browserName === 'firefox', 'Mobile viewport emulation is supported by Chromium and WebKit.');
		const context = await browser.newContext({ baseURL, viewport: { width: device.width, height: device.height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
		const page = await context.newPage();
		const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
		info.annotations.push({ type: 'device-coverage', description: `${browserName} touch emulation; not physical iOS/Android or virtual-keyboard coverage.` });
		try {
			await open(page);
			await viewport(page).scrollIntoViewIfNeeded();
			if (browserName === 'chromium') {
				const bounds = (await viewport(page).boundingBox())!;
				const client = await context.newCDPSession(page);
				await client.send('Input.synthesizeScrollGesture', { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(Math.min(bounds.y + bounds.height / 2, device.height - 40)), yDistance: -240, gestureSourceType: 'touch', speed: 500 });
				await client.detach();
				await expect.poll(async () => (await geometry(page)).scrollTop).toBeGreaterThan(100);
			} else {
				// WebKit has no Playwright native swipe API: test engine scroll delivery and touch activation separately.
				await viewport(page).evaluate(node => { node.scrollTop = 600; });
			}
			await expectHeaderVisible(page);
			const target = await reveal(page, 8000);
			const checkbox = target.getByRole('checkbox'); await checkbox.tap(); await expect(checkbox).toBeChecked();
			await expectHeaderVisible(page);
			await page.screenshot({ path: info.outputPath(`sticky-${device.name.replaceAll(' ', '-')}.png`), fullPage: true });
			// Rotating preserves the selected record and its row within the visible body.
			await page.setViewportSize({ width: device.height, height: device.width });
			await expect(checkbox).toBeChecked();
			await expectHeaderVisible(page);
			await expect.poll(async () => {
				const value = await geometry(page); const box = await target.boundingBox();
				return !!box && box.y + box.height > value.header.bottom && box.y < value.viewport.bottom;
			}).toBe(true);
			const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
			expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
			await page.screenshot({ path: info.outputPath(`sticky-${device.name.replaceAll(' ', '-')}-rotated.png`), fullPage: true });
			expect(errors).toEqual([]);
		} finally { await context.close(); }
	});
}
