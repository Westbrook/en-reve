import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { digestJson } from '../../../tooling/evidence/identity.ts';
import { AxeBuilder } from '@axe-core/playwright';

test('application-owned API search accepts only its cancelable change and retains rejected drafts', async ({ page }) => {
	await page.goto('/api-reference?component=en-combobox');
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	const host = page.locator('en-search-input');
	const input = host.getByRole('searchbox');
	const results = page.locator('.api-results');
	const originalResults = await results.textContent();
	await host.evaluate(element => {
		const reject = (event: Event) => {
			if ((event as CustomEvent).detail.proposed === 'EnNavigation') event.preventDefault();
		};
		element.addEventListener('en-change', reject, { capture: true });
	});
	await input.fill('EnNavigation');
	await expect(input).toHaveValue('EnNavigation');
	await expect(results).toHaveText(originalResults!);
	expect(await host.evaluate((element: any) => element.value)).toBe('');
	await input.fill('EnBreadcrumbs');
	await expect(results).toHaveText('1 matching component. en-combobox remains selected.');
	expect(await host.evaluate((element: any) => element.value)).toBe('EnBreadcrumbs');
	await expect(input).toBeFocused();
	await expect(page.locator('#api-events')).toContainText('single cancelable en-change');
});


const route = '/api-reference';
test('fields, editors and containers teach the same supporting-description API', async ({page}) => {
 for (const tag of ['en-text-field','en-textarea','en-token-editor','en-rich-text-editor','en-checkbox-group','en-dialog','en-validation-summary']) {
  await page.goto(`${route}?component=${tag}&progress-report`);
  await page.getByRole('navigation',{name:'Component API sections'}).getByRole('link',{name:'Supporting descriptions',exact:true}).click();
  await expect(page).toHaveURL(url=>url.hash==='#api-description-guide');
  const guide=page.locator('#api-description-guide');
  await expect(guide.getByRole('heading',{name:'Supporting descriptions',exact:true})).toBeVisible();
  await expect(guide).toContainText('slot="description"');
  for(const section of ['attributes','properties','slots','cssParts']) await expect(page.locator(`#api-${section} th code`).filter({hasText:/^description$/})).toHaveCount(1);
 }
});
test('API tables and verified import text are available before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage(); await page.goto(route);
		await expect(page.getByRole('heading', { name: 'API reference', exact: true })).toBeVisible();
		await expect(page.locator('en-api-reference-app')).toHaveAttribute('data-ssr', '');
		await expect(page.locator('[data-api-code="registration"]')).toContainText("@en-reve/elements/define/");
		await expect(page.getByRole('table').first()).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Name', exact: true }).first()).toBeVisible();
		await expect(page.getByRole('rowheader').filter({ hasText: 'size' }).first()).toBeVisible();
	} finally { await context.close(); }
});

test('filtering retains selection and search focus; choosing exposes the actual native-slot API', async ({ page }) => {
	const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
	await page.goto(`${route}?component=en-combobox&progress-report`);
	const host = page.locator('en-api-reference-app');
	await expect(host).not.toHaveAttribute('data-ssr');
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	const search = page.locator('en-search-input').getByRole('searchbox');
	const searchNode = await search.elementHandle();
	await search.fill('EnNavigation');
	await expect(search).toBeFocused();
	expect(await search.evaluate((node, original) => node === original, searchNode)).toBe(true);
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	await expect(page.locator('.api-results')).toHaveText('2 matching components. en-combobox remains selected.');
	const chooser = page.locator('en-select').getByRole('combobox', { name: 'Component', exact: true });
	await expect(chooser.locator('option[value="en-navigation"]')).toHaveCount(1);
	await expect(chooser.locator('option[value="en-navigation-group"]')).toHaveCount(1);
	await chooser.selectOption('en-navigation');
	await expect(page.getByRole('heading', { name: 'en-navigation', exact: true })).toBeVisible();
	await expect(page).toHaveURL(/component=en-navigation/);
	await expect(page.locator('#api-properties th code').filter({ hasText: /^items$/ })).toHaveCount(0);
	await expect(page.locator('#api-properties th code').filter({ hasText: /^size$/ })).toHaveCount(1);
	await expect(page.locator('#api-slots th code').filter({ hasText: /^\(default slot\)$/ })).toHaveCount(1);
	await expect(page.locator('#api-cssParts th code').filter({ hasText: /^base$/ })).toHaveCount(1);
	await expect(page.locator('[data-api-code="registration"]')).toHaveText("import '@en-reve/elements/define/navigation.js';");
	await expect(page.locator('[data-api-code="class"]')).toHaveText("import { EnNavigation } from '@en-reve/elements/navigation.js';");
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('src', '/api-examples/navigation-sidebar.html');
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('title', 'Nested navigation and responsive sidebar live example');
	await search.fill('nothing-matches-this-component');
	await expect(page.locator('.api-results')).toHaveText('0 matching components. en-navigation remains selected.');
	await expect(page.getByRole('heading', { name: 'en-navigation', exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Progress Report', exact: true })).toBeVisible();
	expect(await page.evaluate(() => customElements.get('en-combobox') === undefined && customElements.get('en-navigation') === undefined)).toBe(true);
	expect(errors).toEqual([]);
});

test('machine-readable downloads retain the exact manifest digest and documented event types', async ({ page }) => {
	await page.goto(`${route}?component=en-combobox`);
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	await expect(page.locator('#api-methods th code').filter({ hasText: /^(render|formResetCallback|connectedCallback)$/ })).toHaveCount(0);
	await expect(page.locator('#api-properties th code').filter({ hasText: /^(model|query|formAssociated|#projection)$/ })).toHaveCount(0);
	for (const [name, type] of [['en-input', 'DraftInputEvent'], ['en-change', 'FieldChangeEvent']]) {
		const row = page.locator('#api-events tr').filter({ has: page.locator('th > code').filter({ hasText: new RegExp(`^${name}$`) }) });
		await expect(row).toContainText(type);
		await expect(row.locator('.api-gap')).toHaveCount(0);
	}
	await page.getByText('Metadata source and limits', { exact: true }).click();
	const [manifestDownload] = await Promise.all([
		page.waitForEvent('download'), page.getByRole('link', { name: 'Download Custom Elements Manifest', exact: true }).click(),
	]);
	const [receiptDownload] = await Promise.all([
		page.waitForEvent('download'), page.getByRole('link', { name: 'Download source receipt', exact: true }).click(),
	]);
	const manifest = JSON.parse(await readFile((await manifestDownload.path())!, 'utf8'));
	const receipt = JSON.parse(await readFile((await receiptDownload.path())!, 'utf8'));
	expect(manifest.schemaVersion).toBeTruthy();
	const elements = manifest.modules.flatMap((module: { declarations?: any[] }) => module.declarations ?? []).filter((declaration: any) => declaration.customElement);
	for (const element of elements) {
		expect((element.members ?? []).map((member: any) => member.name)).not.toContain('controlled');
		expect((element.attributes ?? []).map((attribute: any) => attribute.name)).not.toContain('controlled');
		expect((element.events ?? []).map((event: any) => event.name)).not.toContain('en-request-change');
	}
	expect(elements.length).toBeGreaterThan(30);
	expect(digestJson(manifest)).toBe(receipt.manifestDigest);
	await expect(page.locator('p').filter({ hasText: 'Verified manifest digest:' }).locator('.api-digest')).toHaveText(receipt.manifestDigest);
});

test('authored source highlights lazily and remains selectable after hydration', async ({ page }) => {
	await page.goto(`${route}?component=en-combobox`);
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	const source = page.locator('[data-api-code="example"] code');
	const authored = await source.textContent();
	expect(authored).toContain('.items=');
	expect(authored).toContain('en-change');
	await expect(source).not.toBeVisible();
	await page.getByText('View authored example source', { exact: true }).click();
	await expect(source).toBeVisible();
	await expect.poll(async () => source.evaluate(node => {
		if (!('highlights' in CSS)) return -1;
		let ranges = 0;
		for (const highlight of (CSS as unknown as { highlights: Map<string, Iterable<Range>> }).highlights.values()) {
			for (const range of highlight) if (node.contains(range.startContainer)) ranges++;
		}
		return ranges;
	})).toBeGreaterThan(0);
	expect(await source.textContent()).toBe(authored);
	expect(await source.evaluate(node => node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE)).toBe(true);
});

test('reference tables keep native semantics and contain long API tokens at narrow width', async ({ page }, info) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await page.goto(`${route}?component=en-combobox`);
	await expect(page.getByRole('heading', { name: 'en-combobox', exact: true })).toBeVisible();
	await expect(page.getByRole('table', { name: 'en-combobox properties', exact: true })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	const tableFacts = await page.locator('.api-table-scroll').evaluateAll(regions => regions.map(region => {
		const element = region as HTMLElement; const table = element.querySelector('table')!;
		return { overflow: element.scrollWidth > element.clientWidth + 1, tabIndex: element.tabIndex,
			display: getComputedStyle(table).display, captions: table.querySelectorAll('caption').length,
			columnHeaders: table.querySelectorAll('thead th[scope="col"]').length, rowHeaders: table.querySelectorAll('tbody th[scope="row"]').length };
	}));
	for (const fact of tableFacts) {
		expect(fact.display).toBe('table'); expect(fact.captions).toBe(1);
		expect(fact.columnHeaders).toBeGreaterThanOrEqual(2); expect(fact.rowHeaders).toBeGreaterThan(0);
		expect(fact.tabIndex).toBe(fact.overflow ? 0 : -1);
	}
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	// The embedded document has its own heading hierarchy and separate axe coverage.
	const accessibility = await new AxeBuilder({ page }).include('en-api-reference-app')
		.exclude('.api-demo-frame').exclude('.api-content-demo').analyze();
	await info.attach('reference-accessibility', { body: JSON.stringify(accessibility), contentType: 'application/json' });
	expect(accessibility.violations).toEqual([]);
	await page.screenshot({ path: info.outputPath('reference-narrow.png') });
});

test('pagination guidance links its public surfaces to interactive responsive examples', async ({ page }) => {
	await page.goto('/api-reference?component=en-pagination&progress-report');
	await expect(page.getByRole('heading', { name: 'en-pagination', exact: true })).toBeVisible();
	const jumps = page.getByRole('navigation', { name: 'Component API sections' });
	await jumps.getByRole('link', { name: 'Layout and consumption', exact: true }).click();
	await expect(page).toHaveURL(url => url.hash === '#api-pagination-guide');
	const guidance = page.getByRole('region', { name: 'Pagination layout and consumption' });
	await expect(guidance.getByRole('heading', { name: 'Three container layouts' })).toBeVisible();
	await expect(guidance.getByRole('link', { name: 'Compare all pagination layouts in the isolated example' }))
		.toHaveAttribute('href', '/api-examples/pagination.html?progress-report');
	await guidance.getByRole('link', { name: 'CSS Parts reference', exact: true }).click();
	const parts = page.getByRole('table', { name: 'en-pagination css parts', exact: true });
	for (const name of ['base', 'actions', 'pages', 'middle', 'previous', 'next', 'direct-summary', 'compact-status', 'expanded-status', 'cancel']) {
		await expect(parts.getByRole('rowheader', { name, exact: true })).toBeVisible();
	}
	await jumps.getByRole('link', { name: 'Layout and consumption', exact: true }).click();
	await guidance.getByRole('link', { name: 'Theme token reference', exact: true }).click();
	await expect(page.getByRole('rowheader', { name: '--en-pagination-align', exact: true })).toBeVisible();

	const frameHost = page.locator('.api-demo-frame');
	await frameHost.scrollIntoViewIfNeeded();
	await expect(frameHost).toHaveAttribute('data-example-ready', 'true');
	const example = page.frameLocator('.api-demo-frame');
	const intermediate = example.locator('#api-pagination-intermediate');
	const mobile = example.locator('#api-pagination-mobile');
	await expect(intermediate.getByRole('button', { name: 'Page 6', exact: true })).toBeVisible();
	await expect(mobile.locator('[part~="pages"]')).not.toBeVisible();
	await mobile.getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(mobile.locator('[part~="compact-status"]')).toHaveText('Page 7 of 40');
	await expect(intermediate.getByRole('button', { name: 'Page 6', exact: true })).toHaveAttribute('aria-current', 'page');
	await example.getByText('Customize alignment and button distribution', { exact: true }).click();
	const startAligned = example.locator('en-pagination.pagination-start');
	await expect(startAligned).toBeVisible();
	expect(await startAligned.evaluate(element => getComputedStyle(element).getPropertyValue('--en-pagination-align').trim())).toBe('start');
	await example.getByText('Try an unknown total', { exact: true }).click();
	const unknown = example.locator('#api-pagination-unknown');
	await unknown.getByRole('button', { name: 'Next page', exact: true }).click();
	await expect(example.getByRole('status', { name: 'Batch result' })).toHaveText('Batch 2 loaded. Another batch is available.');
});

test('toolbar reference keeps its command demo and links explicit mixed keyboard delivery', async ({ page }) => {
	await page.goto('/api-reference?component=en-toolbar&progress-report');
	await expect(page.getByRole('heading', { name: 'en-toolbar', exact: true })).toBeVisible();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('src', '/api-examples/command-surfaces.html');
	await page.getByRole('navigation', { name: 'Component API sections' })
		.getByRole('link', { name: 'Keyboard ownership', exact: true }).click();
	await expect(page).toHaveURL(url => url.hash === '#api-toolbar-guide');
	const guidance = page.getByRole('region', { name: 'Toolbar keyboard ownership' });
	await guidance.getByRole('link', { name: 'Keyboard navigation attributes', exact: true }).click();
	await expect(page.getByRole('table', { name: 'en-toolbar attributes', exact: true })
		.getByRole('rowheader', { name: 'keyboard-navigation' })).toBeVisible();
	await page.getByRole('navigation', { name: 'Component API sections' })
		.getByRole('link', { name: 'Keyboard ownership', exact: true }).click();
	await guidance.getByRole('link', { name: 'Try the mixed-control toolbar', exact: true }).click();
	await expect(page).toHaveURL(url => url.pathname === '/api-examples/mixed-toolbar' && url.searchParams.has('progress-report'));
	await expect(page.locator('en-toolbar[keyboard-navigation="tab"]').first()).toBeVisible();
});
