import { expect, test, type Page, type TestInfo } from '@playwright/test';

const path = '/api-examples/virtual-collection.html?progress-report';
const demo = (page: Page) => page.locator('en-virtual-collection-demo');
const table = (page: Page) => demo(page).locator('table');
const viewport = (page: Page) => demo(page).locator('en-table [part~="viewport"]');
const key = (number: number) => `asset-${String(number).padStart(5, '0')}`;
const name = (number: number) => `Asset ${String(number).padStart(5, '0')}`;
const row = (page: Page, number: number) => table(page).locator(`[data-en-virtual-key="${key(number)}"], [data-record="${key(number)}"]`);
const choice = (page: Page, number: number) => row(page, number).getByRole('checkbox', { name: `Select ${name(number)}`, exact: true });

interface SnapshotOptions { numbers?: number[]; checked?: number[]; paginated?: boolean; summary?: boolean }

// Independent fixture expectations: never approve a snapshot captured from the page
// as its own expected result. The model supplies only the intended window indices;
// expected roles, grouping, names, cell order, descriptions and state are specified here.
function expectedTable(numbers: number[], options: SnapshotOptions): string {
	const title = options.paginated ? 'Assets, page 1' : 'Windowed assets';
	const lines = [
		`- table "${title}":`, `  - caption: ${title}`, '  - rowgroup:',
		'    - row "Select Sort Name descending Type":', '      - columnheader "Select"',
		'      - columnheader "Sort Name descending":', '        - button "Sort Name descending"',
		'      - columnheader "Type"', '  - rowgroup:',
	];
	for (const number of numbers) {
		const asset = name(number);
		const description = number % 4 === 0
			? 'A collaborative study with longer notes that wrap as the available width, theme, or text size changes. Keep the same place while reviewing these details.'
			: 'A study ready for collaborative review.';
		const type = number % 3 === 0 ? 'Document' : 'Image';
		lines.push(
			`    - row "Select ${asset} ${asset} ${description} ${type}":`,
			`      - cell "Select ${asset}":`,
			`        - checkbox "Select ${asset}"${options.checked?.includes(number) ? ' [checked]' : ''}`,
			`      - rowheader "${asset} ${description}":`,
			`        - text: ${asset}`, `        - paragraph: ${description}`, `      - cell "${type}"`,
		);
	}
	if (options.summary) {
		const summary = `${options.checked?.length ?? 0} selected across 10,000 assets${options.paginated ? ' · 20 on this page' : ''}`;
		lines.push('  - rowgroup:', `    - row "${summary}":`, `      - cell "${summary}"`);
	}
	return lines.join('\n');
}

async function modelNumbers(page: Page): Promise<number[]> {
	return demo(page).evaluate((node: HTMLElement & { tableModel: { collection: { entries: { kind: string; index?: number }[] } } }) =>
		node.tableModel.collection.entries.filter(entry => entry.kind === 'item').map(entry => entry.index! + 1));
}

async function snapshot(page: Page, info: TestInfo, stage: string, options: SnapshotOptions = {}) {
	let actual = ''; let expected = ''; let numbers: number[] = [];
	let metadata: unknown;
	// Rendering and measurement can finish on different frames. Require the same
	// intended window before/after capture, then compare the COMPLETE snapshot.
	await expect(async () => {
		numbers = options.numbers ?? await modelNumbers(page);
		expect(numbers.length).toBeGreaterThan(0);
		expect(numbers.length).toBeLessThan(100);
		expect(numbers.every((value, index) => index === 0 || value > numbers[index - 1]!)).toBe(true);
		actual = await table(page).ariaSnapshot();
		expected = expectedTable(numbers, options);
		if (!options.numbers) expect(await modelNumbers(page)).toEqual(numbers);
		expect(actual).toBe(expected);
		// ARIA snapshots do not serialize logical row indices or native table coordinates.
		const captured = await table(page).evaluate(node => ({
			rowCount: node.getAttribute('aria-rowcount'),
			rows: [...node.querySelectorAll<HTMLTableRowElement>('tr')].filter(tr => tr.getAttribute('aria-hidden') !== 'true').map(tr => ({
				index: tr.getAttribute('aria-rowindex'), nativeIndex: tr.rowIndex,
				key: tr.getAttribute('data-en-virtual-key') ?? tr.getAttribute('data-record'),
			})),
			gaps: [...node.querySelectorAll('[data-en-virtual-gap]')].map(gap => ({ hidden: gap.getAttribute('aria-hidden'), hasIndex: gap.hasAttribute('aria-rowindex') })),
		}));
		expect(captured.rowCount).toBe(options.paginated ? null : options.summary ? '10002' : '10001');
		expect(captured.rows.filter(value => value.key).map(value => Number(value.index))).toEqual(numbers.map(number => number + 1));
		expect(captured.gaps.every(gap => gap.hidden === 'true' && !gap.hasIndex)).toBe(true);
		expect(captured.rows.map(value => Number(value.index))).toEqual([1, ...numbers.map(number => number + 1), ...(options.summary ? [10002] : [])]);
		if (!options.numbers) expect(await modelNumbers(page)).toEqual(numbers);
		metadata = captured;
	}).toPass({ timeout: 8000 });
	await info.attach(`${stage}.aria.yml`, { body: actual, contentType: 'text/yaml' });
	await info.attach(`${stage}.metadata.json`, { body: JSON.stringify({ intendedRecords: numbers, metadata }, null, 2), contentType: 'application/json' });
	return actual;
}

async function open(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(demo(page)).toBeVisible();
}
async function reveal(page: Page, number: number) {
	const disclosure = demo(page).locator('details.scroll-demo');
	if (!await disclosure.evaluate(node => (node as HTMLDetailsElement).open)) await disclosure.locator('summary').click();
	await demo(page).getByRole('textbox', { name: 'Asset key', exact: true }).fill(key(number));
	const button = demo(page).getByRole('button', { name: 'Show asset', exact: true });
	await button.focus(); await button.press('Enter');
	await expect(row(page, number)).toBeInViewport();
	await expect(button).toBeFocused();
}

test.beforeEach(async ({ browser }, info) => {
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'coverage-boundary', description: 'Playwright DOM-derived ARIA tree and native keyboard focus; not OS accessibility objects or VoiceOver reading cursor.' });
});

test('default SSR and hydrated table have complete expected ARIA trees', async ({ page, browser, baseURL }, info) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const initial = await context.newPage(); await initial.goto(path);
		await snapshot(initial, info, 'default-ssr', { numbers: Array.from({ length: 20 }, (_, index) => index + 1) });
	} finally { await context.close(); }
	await open(page);
	await snapshot(page, info, 'default-hydrated');
	expect((await modelNumbers(page))[0]).toBe(1);
});

for (const narrow of [false, true]) {
	test(`manual scrolling and checkbox round-trip keep expected ARIA trees (${narrow ? 'phone width' : 'desktop'})`, async ({ page }, info) => {
		if (narrow) await page.setViewportSize({ width: 390, height: 844 });
		await open(page);
		await viewport(page).evaluate(node => { node.scrollTop = 3600; });
		await expect.poll(async () => (await modelNumbers(page))[0]!).toBeGreaterThan(10);
		await snapshot(page, info, 'manually-scrolled');
		const numbers = await modelNumbers(page); const selected = numbers[Math.floor(numbers.length / 2)]!;
		await choice(page, selected).focus();
		const baseline = await snapshot(page, info, 'before-selection');
		await choice(page, selected).press('Space'); await expect(choice(page, selected)).toBeChecked();
		await snapshot(page, info, 'selected', { checked: [selected] });
		await choice(page, selected).press('Space'); await expect(choice(page, selected)).not.toBeChecked();
		expect(await snapshot(page, info, 'deselected')).toBe(baseline);
		for (const direction of [-1, 1]) {
			for (let step = 1; step <= 5; step++) {
				const top = await viewport(page).evaluate(node => node.scrollTop);
				const before = await modelNumbers(page);
				await viewport(page).evaluate((node, delta) => { node.scrollTop += delta; }, direction * 240);
				await expect.poll(() => viewport(page).evaluate(node => node.scrollTop)).not.toBe(top);
				await expect.poll(() => modelNumbers(page)).not.toEqual(before);
				await snapshot(page, info, `${direction < 0 ? 'backward' : 'forward'}-${step}`);
				await expect(choice(page, selected)).toBeFocused();
			}
		}
	});
}

test('scrollToKey exposes the requested rows and preserves action focus with sticky summary', async ({ page }, info) => {
	await open(page);
	await demo(page).getByRole('checkbox', { name: 'Show table summary', exact: true }).check();
	for (const number of [9000, 45, 10000, 1]) {
		await reveal(page, number);
		await snapshot(page, info, `scroll-to-${number}`, { summary: true });
		expect(await modelNumbers(page)).toContain(number);
		await expect(choice(page, number)).not.toBeChecked();
	}
});

test('Tab and Shift+Tab preserve semantic order around a retained offscreen checkbox', async ({ page, browserName }, info) => {
	const next = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
	const previous = browserName === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab';
	info.annotations.push({ type: 'native-keyboard-navigation', description: `${next} / ${previous}; WebKit uses the macOS option to include all controls.` });
	await open(page); await reveal(page, 3000);
	await choice(page, 3000).focus(); await choice(page, 3000).press('Space');
	const identity = await choice(page, 3000).evaluateHandle(node => node);
	try {
		await snapshot(page, info, 'tab-origin', { checked: [3000] });
		await viewport(page).evaluate(node => { node.scrollTop = node.scrollHeight * 0.85; });
		await expect.poll(async () => Math.max(...await modelNumbers(page))).toBeGreaterThan(7000);
		await expect(choice(page, 3000)).toBeFocused();
		expect(await choice(page, 3000).evaluate((node, original) => node === original, identity)).toBe(true);
		await snapshot(page, info, 'offscreen-retained-focus', { checked: [3000] });
		for (const [command, number] of [[next, 3001], [next, 3002], [previous, 3001], [previous, 3000]] as const) {
			await page.keyboard.press(command);
			await expect(choice(page, number)).toBeFocused();
			await expect(choice(page, number)).toBeInViewport();
			await snapshot(page, info, `focus-${number}-${command}`, { checked: [3000] });
		}
	} finally { await identity.dispose(); }
});

test('paginated comparison keeps the complete ARIA tree stable through scrolling', async ({ page }, info) => {
	await open(page);
	await demo(page).getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('paginated');
	const options = { numbers: Array.from({ length: 20 }, (_, index) => index + 1), paginated: true };
	const initial = await snapshot(page, info, 'paginated-default', options);
	await viewport(page).evaluate(node => { node.scrollTop = node.scrollHeight; });
	await expect(row(page, 20)).toBeInViewport();
	expect(await snapshot(page, info, 'paginated-scrolled', options)).toBe(initial);
});
