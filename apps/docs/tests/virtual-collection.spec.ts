import { expect, test, type Locator, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const path = '/api-examples/virtual-collection.html?progress-report';
const demo = (page: Page) => page.locator('en-virtual-collection-demo');
const rows = (page: Page) => demo(page).locator('[data-en-virtual-key], [data-record]');
const key = (number: number) => `asset-${String(number).padStart(5, '0')}`;
const name = (number: number) => `Asset ${String(number).padStart(5, '0')}`;
const row = (page: Page, number: number) => demo(page).locator(`[data-en-virtual-key="${key(number)}"], [data-record="${key(number)}"]`);
const choice = (page: Page, number: number) => row(page, number).getByRole('checkbox', { name: `Select ${name(number)}`, exact: true });
const failures = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const errors: string[] = []; failures.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(failures.get(page)).toEqual([]); });

async function open(page: Page) {
	await page.goto(path);
	await page.waitForFunction(() => Boolean(customElements.get('en-virtual-collection-demo')));
	await demo(page).evaluate((node: HTMLElement & { updateComplete?: Promise<boolean> }) => node.updateComplete);
	await expect(demo(page)).toBeVisible();
	await expect.poll(() => rows(page).count()).toBeGreaterThan(0);
}
async function presentation(page: Page, value: 'table' | 'list') {
	await demo(page).getByRole('combobox', { name: 'Presentation', exact: true }).selectOption(value);
}
async function expandScrollDemo(page: Page) {
	const disclosure = demo(page).locator('details.scroll-demo');
	if (!await disclosure.evaluate(node => (node as HTMLDetailsElement).open)) await disclosure.locator('summary').click();
}
async function reveal(page: Page, number: number) {
	await expandScrollDemo(page);
	await demo(page).getByRole('textbox', { name: 'Asset key', exact: true }).fill(key(number));
	await demo(page).getByRole('button', { name: 'Show asset', exact: true }).click();
	await expect(row(page, number)).toBeInViewport();
}
async function viewport(page: Page): Promise<Locator> {
	const table = demo(page).locator('en-table');
	return await table.count() ? table.locator('[part~="viewport"]') : demo(page).locator('[data-virtual-viewport]');
}
// Inspect actual visible geometry instead of relying on controller internals.
async function firstVisible(page: Page) {
	const region = await viewport(page);
	const bounds = await region.evaluate(node => {
		const rect = node.getBoundingClientRect();
		const table = node.getRootNode() instanceof ShadowRoot
			? (node.getRootNode() as ShadowRoot).host.querySelector('table') : null;
		let top = rect.top;
		let bottom = rect.bottom;
		for (const section of table?.querySelectorAll('caption, thead, tfoot') ?? []) {
			if (getComputedStyle(section).position !== 'sticky') continue;
			const sectionRect = section.getBoundingClientRect();
			if (section.tagName === 'TFOOT') bottom = Math.min(bottom, sectionRect.top);
			else if (sectionRect.bottom > top && sectionRect.top < bottom) top = sectionRect.bottom;
		}
		return { top, bottom };
	});
	return rows(page).evaluateAll((nodes, box) => {
		for (const node of nodes) {
			const rect = node.getBoundingClientRect();
			if (rect.bottom > box.top + 1 && rect.top < box.bottom) {
				return { key: node.getAttribute('data-en-virtual-key')!, offset: rect.top - box.top };
			}
		}
		return null;
	}, bounds);
}
async function expectBounded(page: Page) {
	await expect.poll(() => rows(page).count()).toBeLessThan(100);
	const region = await viewport(page);
	expect(await region.evaluate(node => node.scrollHeight)).toBeGreaterThan(100_000);
}

// Acceptance is synchronous; row measurement and native scrolling settle later.
async function settledCollection(page: Page) {
	await expect.poll(() => demo(page).evaluate(async (node: any) => {
		const samples: string[] = [];
		for (let index = 0; index < 12; index++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			samples.push(JSON.stringify({ scrollTop: node.viewport.scrollTop, revision: node.model.revision.get() }));
		}
		return samples.slice(-6).every(sample => sample === samples.at(-1));
	})).toBe(true);
}

test('server delivery exposes useful native rows and valid table structure without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	const page = await context.newPage();
	try {
		await page.goto(path);
		await expect(demo(page)).toBeVisible();
		const table = demo(page).locator('table');
		await expect(table).toBeVisible();
		await expect(rows(page)).toHaveCount(20);
		await expect(choice(page, 1)).toBeVisible();
		await expect(choice(page, 1)).toHaveAccessibleName('Select Asset 00001');
		await expect(row(page, 1).locator('en-checkbox [part=label-text]')).toBeHidden();
		await expect(row(page, 1).locator('en-checkbox input[type="checkbox"]')).toHaveCount(1);
		await expect(table).toHaveAttribute('aria-rowcount', '10001');
		expect(await table.evaluate((node: HTMLTableElement) => ({
			bodies: node.tBodies.length,
			validRows: [...node.tBodies[0]!.children].every(child => child.localName === 'tr'),
			validCells: [...node.tBodies[0]!.rows].every(tr => [...tr.children].every(cell => ['td', 'th'].includes(cell.localName))),
			headers: node.querySelectorAll('thead th[scope="col"]').length,
		}))).toMatchObject({ bodies: 1, validRows: true, validCells: true });
		await expect(table.locator('thead th[scope="col"]')).not.toHaveCount(0);
		await expect(row(page, 1)).toHaveAttribute('aria-rowindex', '2');
	} finally { await context.close(); }
});

test('hydration retains the server table and keyed first row before windowing', async ({ page }) => {
	let release!: () => void;
	const held = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') await held;
		await route.continue();
	});
	try {
		await page.goto(path, { waitUntil: 'commit' });
		await expect(choice(page, 1)).toBeVisible();
		const saved = await row(page, 1).evaluateHandle(node => ({ row: node, table: node.closest('table'), checkbox: node.querySelector('en-checkbox'), input: node.querySelector('en-checkbox')?.shadowRoot?.querySelector('input') }));
		release();
		await page.waitForFunction(() => Boolean(customElements.get('en-virtual-collection-demo')));
		await demo(page).evaluate((node: HTMLElement & { updateComplete?: Promise<boolean> }) => node.updateComplete);
		await expect.poll(() => row(page, 1).evaluate((node, previous) => node === previous.row && node.closest('table') === previous.table && node.querySelector('en-checkbox') === previous.checkbox && node.querySelector('en-checkbox')?.shadowRoot?.querySelector('input') === previous.input, saved)).toBe(true);
		await expectBounded(page);
		await saved.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

for (const view of ['table', 'list'] as const) {
	test(`${view} windows ten thousand records and restores keyed selection after distant scrolling`, async ({ page }, info) => {
		await open(page); await presentation(page, view);
		const checkboxHost = row(page, 1).locator('en-checkbox');
		// Cancel the single public change before the demo consumes it. Both the
		// tentative component property and native control must roll back.
		await checkboxHost.evaluate(node => node.addEventListener('en-change', event => {
			node.setAttribute('data-proposed-checked', String((node as HTMLElement & { checked: boolean }).checked));
			event.preventDefault();
		}, { capture: true, once: true }));
		await choice(page, 1).focus(); await choice(page, 1).press('Space');
		await expect(checkboxHost).toHaveAttribute('data-proposed-checked', 'true');
		await expect(checkboxHost).toHaveJSProperty('checked', false);
		await expect(choice(page, 1)).not.toBeChecked();
		await expect(choice(page, 1)).toBeFocused();
		await expect(demo(page).locator('[data-selection-status]')).toHaveText('0 selected · 10,000 records');
		await choice(page, 1).check();
		await reveal(page, 8000);
		await expectBounded(page);
		await expect(row(page, 1)).toHaveCount(0);
		await choice(page, 8000).check();
		const region = await viewport(page);
		// Native scroll events must update the range, not just the Show asset helper.
		await region.evaluate(node => { node.scrollTop = node.scrollHeight - node.clientHeight; });
		await expect(row(page, 10000)).toBeVisible();
		await expectBounded(page);
		await reveal(page, 1); await expect(choice(page, 1)).toBeChecked();
		await reveal(page, 8000); await expect(choice(page, 8000)).toBeChecked();
		if (view === 'table') {
			await expect(row(page, 8000)).toHaveAttribute('aria-rowindex', '8001');
			await expect(demo(page).locator('table')).toHaveAttribute('aria-rowcount', '10001');
		} else {
			await expect(row(page, 8000)).toHaveAttribute('aria-posinset', '8000');
			await expect(row(page, 8000)).toHaveAttribute('aria-setsize', '10000');
		}
		if (view === 'table') await demo(page).screenshot({ path: info.outputPath('virtual-table-desktop.png') });
		await info.attach('mounted-collection', { body: JSON.stringify({ view, count: await rows(page).count() }), contentType: 'application/json' });
	});
}

test('sort and prepend preserve keyed selection and the visible scroll anchor', async ({ page }) => {
	await open(page); await reveal(page, 5000); await choice(page, 5000).check();
	// Move focus out of the row so the anchor is the viewport, not a pinned control.
	await demo(page).getByRole('button', { name: 'Prepend asset', exact: true }).focus();
	const before = await firstVisible(page); expect(before).not.toBeNull();
	await demo(page).getByRole('button', { name: 'Prepend asset', exact: true }).press('Enter');
	await expect(demo(page).locator('table')).toHaveAttribute('aria-rowcount', '10002');
	await expect.poll(async () => (await firstVisible(page))?.key).toBe(before!.key);
	await expect.poll(async () => Math.abs((await firstVisible(page))!.offset - before!.offset)).toBeLessThan(3);
	await expect(choice(page, 5000)).toBeChecked();
	const sort = demo(page).getByRole('button', { name: 'Sort name descending', exact: true });
	await sort.focus(); await sort.press('Enter');
	await expect(demo(page).getByRole('button', { name: 'Sort name ascending', exact: true })).toBeFocused();
	await reveal(page, 5000); await expect(choice(page, 5000)).toBeChecked();
	await demo(page).getByRole('button', { name: 'Sort name ascending', exact: true }).click();
	await reveal(page, 5000); await expect(choice(page, 5000)).toBeChecked();
	await expectBounded(page);
});

test('focused row stays mounted while the ordinary window moves, then releases on blur', async ({ page }) => {
	await open(page);
	const control = choice(page, 1); await control.focus();
	const saved = await control.evaluateHandle(node => node);
	const region = await viewport(page);
	await region.evaluate(node => { node.scrollTop = node.scrollHeight / 2; });
	await expect.poll(async () => Number((await rows(page).last().getAttribute('data-en-virtual-key'))?.slice(6))).toBeGreaterThan(4000);
	await expect(control).toBeFocused();
	expect(await control.evaluate((node, previous) => node === previous, saved)).toBe(true);
	await expectBounded(page);
	await expandScrollDemo(page);
	await demo(page).getByRole('button', { name: 'Show asset', exact: true }).focus();
	await expect(row(page, 1)).toHaveCount(0);
	await saved.dispose();
});

test('density changes remeasure variable-height table rows without losing the viewport anchor', async ({ page }) => {
	await open(page); await reveal(page, 5000);
	// scrollToKey returns acceptance, not completion. Measure a settled view:
	// native movement and the following variable-height reconciliation are
	// separate from the presentation-change behavior under test.
	await settledCollection(page);
	const before = await firstVisible(page); expect(before).not.toBeNull();
	const target = demo(page).locator(`[data-en-virtual-key="${before!.key}"]`);
	const initialHeight = (await target.boundingBox())!.height;
	await demo(page).evaluate(node => node.style.setProperty('--en-table-cell-block-padding', '24px'));
	await expect.poll(async () => (await target.boundingBox())!.height).toBeGreaterThan(initialHeight + 10);
	await expect.poll(async () => (await firstVisible(page))?.key).toBe(before!.key);
	await expect.poll(async () => Math.abs((await firstVisible(page))!.offset - before!.offset)).toBeLessThan(3);
	await demo(page).evaluate(node => { node.style.colorScheme = 'dark'; node.style.removeProperty('--en-table-cell-block-padding'); });
	await expect.poll(async () => (await firstVisible(page))?.key).toBe(before!.key);
	await expectBounded(page);
});

test('paginated reading exposes the complete page with native keyboard selection and page navigation', async ({ page }) => {
	await open(page);
	await demo(page).getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('paginated');
	await expect(choice(page, 1)).toBeVisible();
	const count = await rows(page).count(); expect(count).toBeGreaterThanOrEqual(20); expect(count).toBeLessThanOrEqual(100);
	await choice(page, 1).focus(); await choice(page, 1).press('Space'); await expect(choice(page, 1)).toBeChecked();
	const next = demo(page).getByRole('button', { name: 'Next page', exact: true });
	await next.focus(); await next.press('Enter');
	await expect(row(page, count + 1)).toBeVisible();
	await expect(next).toBeFocused();
	await demo(page).getByRole('button', { name: 'Previous page', exact: true }).click();
	await expect(choice(page, 1)).toBeChecked();
	const scan = await new AxeBuilder({ page }).include('en-virtual-collection-demo').analyze();
	await test.info().attach('collection-axe-findings', { body: JSON.stringify(scan.violations, null, 2), contentType: 'application/json' });
	// Deliberate contextual labels: each compact selection checkbox has a
	// visible Select column and native row header, with a hidden naming source.
	// Keep axe's best-practice finding visible and restrict it to these inputs.
	expect(scan.violations.filter(finding => finding.id !== 'label-title-only')).toEqual([]);
	const contextual = scan.violations.find(finding => finding.id === 'label-title-only');
	if (contextual) {
		expect(contextual.nodes).toHaveLength(await rows(page).locator('en-checkbox.asset-selection').count());
		await expect(demo(page).locator('thead th').first()).toHaveText('Select');
		for (const node of contextual.nodes) {
			const input = page.locator(node.target.flat().join(' '));
			const context = await input.evaluate(element => {
				const host = (element.getRootNode() as ShadowRoot).host;
				const header = host.closest('tr')?.querySelector('th[scope=row]');
				return { compact: host.matches('en-checkbox.asset-selection'), name: [...header?.childNodes ?? []].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('').trim(), visible: !!header && header.getBoundingClientRect().height > 0 };
			});
			expect(context.compact && context.visible && !!context.name).toBe(true);
			await expect(input).toHaveAccessibleName(`Select ${context.name}`);
		}
	}
});

test('narrow RTL keeps the virtual table inside its scroll region and list content readable', async ({ page }, info) => {
	await page.setViewportSize({ width: 320, height: 900 }); await open(page);
	await demo(page).evaluate(node => node.setAttribute('dir', 'rtl'));
	await reveal(page, 9000);
	const region = await viewport(page); await region.focus(); await expect(region).toBeFocused();
	const box = await region.boundingBox(); expect(box!.width).toBeLessThanOrEqual(320);
	await presentation(page, 'list'); await reveal(page, 9000);
	await expect(choice(page, 9000)).toBeVisible();
	const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
	expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
	await expect(demo(page).locator('pre[aria-label="Current scrollToKey call"]')).toHaveCSS('direction', 'ltr');
	await demo(page).screenshot({ path: info.outputPath('virtual-list-rtl-320.png') });
});

test('near-bottom resizing keeps the final records reachable and mounted rows settle while idle', async ({ page }, info) => {
	await open(page); await reveal(page, 10000);
	await expect(row(page, 10000)).toBeVisible();
	await page.setViewportSize({ width: 800, height: 700 });
	await expect(row(page, 10000)).toBeVisible();
	await expectBounded(page);
	const region = await viewport(page);
	await expect.poll(() => region.evaluate(node => node.scrollTop <= node.scrollHeight - node.clientHeight + 1)).toBe(true);
	// Sampling rendered keys across frames catches continuous idle range churn
	// without turning this interaction test into a synthetic benchmark.
	const samples = await demo(page).evaluate(async (node: any) => {
		const result: { keys: string[]; revision: number }[] = [];
		for (let index = 0; index < 8; index++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			result.push({
				keys: [...node.shadowRoot.querySelectorAll('[data-en-virtual-key]')].map((row: any) => row.getAttribute('data-en-virtual-key')),
				revision: node.model.revision.get(),
			});
		}
		return result;
	});
	for (const sample of samples.slice(-4)) expect(sample).toEqual(samples.at(-1));
	await info.attach('idle-mounted-window', { body: JSON.stringify({ maximumMounted: Math.max(...samples.map(sample => sample.keys.length)), samples }), contentType: 'application/json' });
});

test('removing a selected record updates total count and leaves the surrounding collection usable', async ({ page }) => {
	await open(page); await reveal(page, 5000); await choice(page, 5000).check();
	const remove = demo(page).getByRole('button', { name: 'Remove selected', exact: true });
	await remove.focus(); await remove.press('Enter');
	await expect(demo(page).locator('table')).toHaveAttribute('aria-rowcount', '10000');
	await expect(row(page, 5000)).toHaveCount(0);
	await expect(demo(page).locator('[data-selection-status]')).toHaveText('0 selected · 9,999 records');
	await reveal(page, 5001);
	await expect(row(page, 5001)).toHaveAttribute('aria-rowindex', '5001');
	await choice(page, 5001).focus(); await choice(page, 5001).press('Space');
	await expect(choice(page, 5001)).toBeChecked();
	await expectBounded(page);
});

// This audits the DOM conditions around the reported VoiceOver traversal reversal.
// Browser automation cannot exercise VoiceOver's separate reading cursor.
test('checkbox toggles and backward window traversal preserve row identity and logical order', async ({ page }, info) => {
	await open(page);
	const region = await viewport(page);
	await region.evaluate(node => { node.scrollTop = 3600; });
	await expect.poll(async () => Number((await firstVisible(page))?.key.slice(6))).toBeGreaterThan(20);
	// Native scroll establishes the window; its exact key depends on the
	// consumer's width and theme, not a fixed pixel-to-row assumption.
	const number = Number((await firstVisible(page))!.key.slice(6)) + 1;
	await expect(row(page, number)).toBeAttached();
	const control = choice(page, number); await control.focus();
	// Let scrolling and measured row sizes settle before isolating checkbox updates.
	// scrollToKey intentionally retains temporary reveal pins, so use native scrolling here.
	await region.evaluate(node => new Promise<void>((resolve, reject) => {
		let last = ''; let stable = 0; let frames = 0;
		const check = () => {
			const signature = `${node.scrollTop}:${node.scrollHeight}:${node.clientHeight}`;
			stable = signature === last ? stable + 1 : 0; last = signature;
			if (stable >= 4) resolve();
			else if (++frames > 120) reject(new Error('Table geometry did not settle before selection audit'));
			else requestAnimationFrame(check);
		};
		requestAnimationFrame(check);
	}));
	const saved = await row(page, number).evaluateHandle(node => ({ row: node, input: node.querySelector('en-checkbox')?.shadowRoot?.querySelector('input') }));
	const audit = await demo(page).evaluateHandle(node => {
		const body = node.shadowRoot!.querySelector('tbody')!;
		const table = body.closest('table')!;
		const snapshots: { indices: number[]; keys: string[]; nativeIndices: number[]; cellCounts: number[]; count: string | null }[] = [];
		const focusEvents: string[] = [];
		const sample = () => {
			const records = [...body.querySelectorAll<HTMLTableRowElement>('tr[data-en-virtual-key]')];
			snapshots.push({
				indices: records.map(row => Number(row.getAttribute('aria-rowindex'))),
				keys: records.map(row => row.getAttribute('data-en-virtual-key')!),
				nativeIndices: records.map(row => row.rowIndex),
				cellCounts: records.map(row => row.cells.length),
				count: table.getAttribute('aria-rowcount'),
			});
		};
		const onFocus = (event: Event) => {
			const row = event.composedPath().find(target => target instanceof Element && target.hasAttribute('data-en-virtual-key')) as Element | undefined;
			focusEvents.push(row?.getAttribute('data-en-virtual-key') ?? 'outside');
		};
		const observer = new MutationObserver(sample);
		observer.observe(body, { childList: true });
		body.addEventListener('focusin', onFocus);
		sample();
		return { snapshots, focusEvents, stop: () => { observer.disconnect(); body.removeEventListener('focusin', onFocus); } };
	});
	try {
		await control.press('Space'); await expect(control).toBeChecked();
		await control.press('Space'); await expect(control).not.toBeChecked();
		// Selection must not detach, move or replace any tbody rows.
		expect(await audit.evaluate(value => value.snapshots.length)).toBe(1);
		for (const direction of [-1, 1]) {
			for (let step = 0; step < 12; step++) {
				const previous = await firstVisible(page);
				await region.evaluate((node, delta) => { node.scrollTop += delta; }, direction * 150);
				await expect.poll(async () => (await firstVisible(page))?.key).not.toBe(previous?.key);
				await expect(control).toBeFocused();
				expect(await row(page, number).evaluate((node, original) => node === original.row && node.querySelector('en-checkbox')?.shadowRoot?.querySelector('input') === original.input, saved)).toBe(true);
			}
		}
		const result = await audit.evaluate(value => ({ snapshots: value.snapshots, focusEvents: value.focusEvents }));
		expect(result.focusEvents).toEqual([]);
		expect(result.snapshots.length).toBeGreaterThan(12);
		for (const snapshot of result.snapshots) {
			expect(snapshot.count).toBe('10001');
			expect(new Set(snapshot.keys).size).toBe(snapshot.keys.length);
			expect(snapshot.indices).toEqual(snapshot.keys.map(value => Number(value.slice('asset-'.length)) + 1));
			expect(snapshot.indices.every((value, index, values) => index === 0 || value > values[index - 1]!)).toBe(true);
			expect(snapshot.cellCounts.every(count => count === 3)).toBe(true);
		}
	} finally {
		await info.attach('window-traversal-final-audit', { body: JSON.stringify(await audit.evaluate(value => ({ snapshots: value.snapshots, focusEvents: value.focusEvents })), null, 2), contentType: 'application/json' });
		await audit.evaluate(value => value.stop()); await audit.dispose(); await saved.dispose();
	}
});

test('an application reorder preserves the exact focused control for its stable record key', async ({ page }) => {
	await open(page); await reveal(page, 5000);
	const control = choice(page, 5000); await control.focus();
	const saved = await control.evaluateHandle(node => node);
	// Simulate an application data update that does not move focus to a sort button.
	await demo(page).evaluate(async (node: any) => { await node.sort(); await node.updateComplete; });
	await expect(control).toBeFocused();
	expect(await control.evaluate((node, previous) => node === previous, saved)).toBe(true);
	await control.press('Space'); await expect(control).toBeChecked();
	await expectBounded(page);
	await saved.dispose();
});

async function visibleViewportBounds(page: Page) {
	return (await viewport(page)).evaluate(node => {
		const bounds = node.getBoundingClientRect();
		const root = node.getRootNode();
		const insets = root instanceof ShadowRoot
			? (root.host as HTMLElement & { scrollInsets?: { blockStart: number; blockEnd: number } }).scrollInsets
			: undefined;
		const style = getComputedStyle(node);
		return {
			top: bounds.top + node.clientTop + Math.max(insets?.blockStart ?? 0, parseFloat(style.scrollPaddingTop) || 0),
			bottom: bounds.top + node.clientTop + node.clientHeight - Math.max(insets?.blockEnd ?? 0, parseFloat(style.scrollPaddingBottom) || 0),
		};
	});
}

for (const view of ['table', 'list'] as const) {
	test(`${view} native Tab continues beside a retained offscreen focused record`, async ({ page, browserName }, info) => {
		// WebKit on macOS follows Safari's native preference: Option+Tab
		// includes checkbox controls when full keyboard navigation is off.
		const next = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
		const previous = browserName === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab';
		info.annotations.push({ type: 'native-keyboard-navigation', description: `${next} / ${previous}` });
		await open(page); await presentation(page, view); await reveal(page, 3000);
		const original = choice(page, 3000); await original.focus(); await original.press('Space');
		await expect(original).toBeChecked();
		const saved = await original.evaluateHandle(node => node);
		expect(await original.evaluate(node => node.localName === 'input' && (node.getRootNode() as ShadowRoot).host.localName === 'en-checkbox')).toBe(true);
		// Consumer blur handlers can render before the browser completes the
		// corresponding focus step; that must not remove the pending target.
		await original.evaluate(node => node.addEventListener('blur', () => {
			let root = node.getRootNode();
			while (root instanceof ShadowRoot) {
				if (root.host.localName === 'en-virtual-collection-demo') {
					(root.host as HTMLElement & { requestUpdate(): void }).requestUpdate();
					break;
				}
				root = root.host.getRootNode();
			}
		}, { once: true }));
		const region = await viewport(page);
		await region.evaluate(node => { node.scrollTop = node.scrollHeight * 0.85; });
		await expect.poll(async () => Number((await firstVisible(page))?.key.slice(6))).toBeGreaterThan(7000);
		await expect(original).toBeFocused();
		expect(await original.evaluate((node, previous) => node === previous, saved)).toBe(true);
		await expectBounded(page);
		// Use the actual sequential-focus algorithm. Calling locator.focus() on
		// the expected next record would conceal gaps in the mounted Tab order.
		await page.keyboard.press(next);
		await expect(choice(page, 3001)).toBeFocused();
		await expect.poll(async () => {
			const bounds = await visibleViewportBounds(page);
			const control = await choice(page, 3001).boundingBox();
			return Boolean(control && control.y >= bounds.top - 1 && control.y + control.height <= bounds.bottom + 1);
		}).toBe(true);
		await page.keyboard.press(previous); await expect(original).toBeFocused();
		for (const number of [3001, 3002, 3003]) {
			await page.keyboard.press(next); await expect(choice(page, number)).toBeFocused();
		}
		// A wheel gesture moves the scrollport without moving keyboard focus.
		const rect = await region.boundingBox();
		const screen = page.viewportSize()!;
		const left = Math.max(0, rect!.x); const right = Math.min(screen.width, rect!.x + rect!.width);
		const top = Math.max(0, rect!.y); const bottom = Math.min(screen.height, rect!.y + rect!.height);
		expect(bottom - top).toBeGreaterThan(0);
		await page.mouse.move((left + right) / 2, (top + bottom) / 2);
		if (browserName === 'firefox') {
			// The synthetic wheel is not delivered consistently by this Firefox
			// harness; setting native scrollTop still leaves keyboard focus intact.
			await region.evaluate(node => { node.scrollTop = 0; });
		} else await page.mouse.wheel(0, -1_000_000);
		await expect.poll(async () => Number((await firstVisible(page))?.key.slice(6))).toBeLessThan(1000);
		await expect(choice(page, 3003)).toBeFocused();
		await page.keyboard.press(previous); await expect(choice(page, 3002)).toBeFocused();
		await page.keyboard.press(next); await expect(choice(page, 3003)).toBeFocused();
		await page.keyboard.press(next); await expect(choice(page, 3004)).toBeFocused();
		// Row 3000 may now leave both overscan and the focused neighborhood.
		// Reveal it again to verify selection survives unmounting, while the
		// current native focus remains on row 3004.
		expect(await demo(page).evaluate((node: any) => node.controller.scrollToKey('asset-03000', { behavior: 'instant', container: 'nearest' }))).toBe(true);
		await expect(original).toBeChecked();
		await expect(choice(page, 3004)).toBeFocused();
		await expectBounded(page); await saved.dispose();
	});

	test(`${view} public scrollToKey aligns records without changing focus or selection`, async ({ page }, info) => {
		await open(page); await presentation(page, view); await reveal(page, 3000);
		const original = choice(page, 3000); await original.focus(); await original.press('Space');
		const saved = await original.evaluateHandle(node => node);
		const region = await viewport(page);
		const measurements: { align: string; difference: number }[] = [];
		for (const align of ['start', 'center', 'end'] as const) {
			expect(await demo(page).evaluate((node: any, align) => node.controller.scrollToKey('asset-07000', { block: align, container: 'nearest' }), align)).toBe(true);
			await expect(row(page, 7000)).toBeVisible();
			const difference = async () => {
				const bounds = await visibleViewportBounds(page);
				const target = await row(page, 7000).boundingBox();
				return Math.abs(align === 'start' ? target!.y - bounds.top
					: align === 'end' ? target!.y + target!.height - bounds.bottom
						: target!.y + target!.height / 2 - (bounds.top + bounds.bottom) / 2);
			};
			await expect.poll(difference).toBeLessThan(2);
			measurements.push({ align, difference: await difference() });
			await expect(original).toBeFocused(); await expect(original).toBeChecked();
			expect(await original.evaluate((node, previous) => node === previous, saved)).toBe(true);
		}
		await settledCollection(page);
		const before = await region.evaluate(node => node.scrollTop);
		expect(await demo(page).evaluate((node: any) => node.controller.scrollToKey('asset-07000', { block: 'nearest', container: 'nearest' }))).toBe(true);
		// Let the controller process the accepted request before reading the result.
		await region.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
		expect(Math.abs(await region.evaluate(node => node.scrollTop) - before)).toBeLessThan(2);
		expect(await demo(page).evaluate((node: any) => node.controller.scrollToKey('missing-record'))).toBe(false);
		await expect(original).toBeFocused(); await expect(original).toBeChecked();
		expect(await region.evaluate(node => node.scrollTop)).toBe(before);
		await info.attach('scrollToKey-alignment', { body: JSON.stringify({ view, measurements }), contentType: 'application/json' });
		await expectBounded(page); await saved.dispose();
	});
}
