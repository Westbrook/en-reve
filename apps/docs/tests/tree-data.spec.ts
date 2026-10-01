import { expect, test, type Page, type TestInfo } from '@playwright/test';

const path = '/api-examples/tree-data.html';
const tree = (page: Page) => page.locator('#test-data-tree');
const viewport = (page: Page) => tree(page).locator('[part~="viewport"]');
const row = (page: Page, key: string) => tree(page).locator(`[role="treeitem"][data-en-tree-key="${key}"]`);
const key = (index: number) => `leaf-${String(index).padStart(3, '0')}`;
const label = (index: number) => index === 299 ? 'Zebra final asset' : `Asset ${String(index).padStart(3, '0')}`;

async function fixture(page: Page, virtualize = true) {
	await page.goto(path);
	await page.waitForFunction(() => Boolean(customElements.get('en-tree')));
	await page.evaluate(virtual => {
		document.body.innerHTML = '<button id="before">Before tree</button><en-tree id="test-data-tree" label="Data outline" style="--en-tree-viewport-size: 280px"></en-tree><button id="after">After tree</button>';
		const element = document.querySelector('en-tree') as any;
		element.items = [{ value: 'folder', label: 'Folder', children: Array.from({ length: 300 }, (_, index) => ({
			value: `leaf-${String(index).padStart(3, '0')}`, label: index === 299 ? 'Zebra final asset' : `Asset ${String(index).padStart(3, '0')}`, disabled: index === 2,
		})) }, { value: 'tail', label: 'Tail' }];
		element.expanded = ['folder']; element.value = 'leaf-000'; element.virtualize = virtual;
	}, virtualize);
	await expect(row(page, 'leaf-000')).toBeVisible();
}

async function scrollTo(page: Page, value: string) {
	expect(await tree(page).evaluate((element: any, value) => element.scrollToKey(value, { block: 'center', inline: 'nearest', behavior: 'instant' }), value)).toBe(true);
	await expect(row(page, value)).toBeInViewport();
}

test('virtual viewport follows host sizing and keeps an unsized token fallback', async ({ page }) => {
	await fixture(page);
	const height = () => viewport(page).evaluate(element => element.getBoundingClientRect().height);
	await expect.poll(height).toBe(280);
	await tree(page).evaluate(element => element.style.removeProperty('--en-tree-viewport-size'));
	const fallback = await tree(page).evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize) * 24);
	await expect.poll(height).toBe(fallback);
	for (const size of [180, 600, 240]) {
		await tree(page).evaluate((element, size) => { element.style.blockSize = `${size}px`; }, size);
		await expect.poll(height).toBe(size);
		await scrollTo(page, 'leaf-250');
	}
	await tree(page).evaluate(element => element.style.setProperty('--en-tree-viewport-size', '120px'));
	await expect.poll(height).toBe(240);
	await tree(page).evaluate(element => { element.style.removeProperty('block-size'); });
	await expect.poll(height).toBe(120);
});

for (const layout of ['flex', 'grid']) {
	test(`virtual viewport fits a ${layout} allocation and resizes with its container`, async ({ page }) => {
		await fixture(page);
		await tree(page).evaluate((element, layout) => {
			const container = document.createElement('section');
			container.id = 'tree-layout';
			container.style.cssText = `display:${layout};flex-direction:column;grid-template-rows:auto minmax(0,1fr);block-size:420px;inline-size:320px`;
			const heading = document.createElement('div');
			heading.textContent = 'Outline'; heading.style.cssText = 'block-size:40px;flex:none';
			element.before(container);container.append(heading, element);
			element.style.cssText = 'flex:1;min-block-size:0';
		}, layout);
		for (const size of [420, 200, 700]) {
			await page.locator('#tree-layout').evaluate((element, size) => { element.style.blockSize = `${size}px`; }, size);
			await expect.poll(() => viewport(page).evaluate(element => element.clientHeight)).toBe(size - 40);
			await expect.poll(() => page.locator('#tree-layout').evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
			await scrollTo(page, 'leaf-299');
		}
	});
}

// The fixture supplies the full logical order, labels and hierarchy. We validate
// mounted keys against that model, then compare complete semantic snapshots;
// none of these snapshots assert correctness of an OS screen-reader cursor.
async function snapshot(page: Page, info: TestInfo, stage: string) {
	let actual = ''; let metadata: any[] = [];
	await expect(async () => {
		metadata = await tree(page).getByRole('treeitem').evaluateAll(nodes => nodes.map(node => ({
			key: node.getAttribute('data-en-tree-key'), label: node.getAttribute('aria-label'),
			level: node.getAttribute('aria-level'), position: node.getAttribute('aria-posinset'), size: node.getAttribute('aria-setsize'),
			selected: node.getAttribute('aria-selected'), expanded: node.getAttribute('aria-expanded'), disabled: node.getAttribute('aria-disabled'),
		})));
		expect(metadata.length).toBeGreaterThan(0); expect(metadata.length).toBeLessThan(100);
		const indices = metadata.map(entry => entry.key === 'folder' ? -1 : entry.key === 'tail' ? 300 : Number(entry.key.slice(5)));
		expect(indices).toEqual([...new Set(indices)].sort((a, b) => a - b));
		for (const entry of metadata) {
			const root = entry.key === 'folder' || entry.key === 'tail';
			expect(entry.level).toBe(root ? '1' : '2');
			expect(entry.position).toBe(root ? entry.key === 'folder' ? '1' : '2' : String(Number(entry.key.slice(5)) + 1));
			expect(entry.size).toBe(root ? '2' : '300');
			expect(entry.selected).toBe(entry.key === 'leaf-000' ? 'true' : 'false');
			expect(entry.expanded).toBe(entry.key === 'folder' ? 'true' : null);
			expect(entry.disabled === 'true').toBe(entry.key === 'leaf-002');
			expect(entry.label).toBe(entry.key === 'folder' ? 'Folder' : entry.key === 'tail' ? 'Tail' : label(Number(entry.key.slice(5))));
		}
		actual = await tree(page).getByRole('tree', { name: 'Data outline', exact: true }).ariaSnapshot();
		const expected = ['- tree "Data outline":', ...metadata.flatMap(entry => {
			const state = `${entry.disabled === 'true' ? ' [disabled]' : ''}${entry.expanded === 'true' ? ' [expanded]' : ''} [level=${entry.level}]${entry.selected === 'true' ? ' [selected]' : ''}`;
			const indent = entry.level === '1' ? '  ' : '      ';
			return entry.key === 'folder'
				? [`${indent}- treeitem "${entry.label}"${state}:`, '    - text: Folder', '    - group:']
				: [`${indent}- treeitem "${entry.label}"${state}`];
		})].join('\n');
		expect(actual).toBe(expected);
	}).toPass({ timeout: 8000 });
	await info.attach(`${stage}.aria.yml`, { body: actual, contentType: 'text/yaml' });
	await info.attach(`${stage}.metadata.json`, { body: JSON.stringify(metadata, null, 2), contentType: 'application/json' });
}

test.beforeEach(async ({ browser }, info) => {
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'coverage-boundary', description: 'DOM-derived ARIA snapshots and native keyboard focus; not VoiceOver or other OS accessibility cursors.' });
});

test('default, manually scrolled and scrollToKey windows retain logical hierarchy and semantic order', async ({ page }, info) => {
	await fixture(page);
	await snapshot(page, info, 'default');
	await viewport(page).evaluate(element => { element.scrollTop = element.scrollHeight * 0.6; });
	await expect.poll(() => tree(page).getByRole('treeitem').evaluateAll(nodes => nodes.some(node => Number(node.getAttribute('data-en-tree-key')?.slice(5)) > 150))).toBe(true);
	await snapshot(page, info, 'manually-scrolled');
	await page.locator('#after').focus();
	await scrollTo(page, key(270));
	await expect(page.locator('#after')).toBeFocused();
	await expect(tree(page)).toHaveJSProperty('value', key(0));
	await snapshot(page, info, 'scroll-to-key');
	expect(await tree(page).evaluate((element: any) => element.scrollToKey('missing'))).toBe(false);
});

test('offscreen keyboard navigation and typeahead use the full expanded model', async ({ page }) => {
	await fixture(page);
	await row(page, key(0)).focus();
	for (let index = 1; index <= 25; index++) {
		await page.keyboard.press('ArrowDown');
		await expect(row(page, key(index))).toBeFocused();
	}
	await page.keyboard.press('End'); await expect(row(page, 'tail')).toBeFocused();
	await page.keyboard.press('Home'); await expect(row(page, 'folder')).toBeFocused();
	await page.keyboard.press('z'); await expect(row(page, key(299))).toBeFocused();
	await expect(row(page, key(299))).toBeInViewport();
	await expect(tree(page)).toHaveJSProperty('value', key(0));
});

test('focused rows retain identity after scrolling away and Tab leaves the single composite stop', async ({ page, browserName }, info) => {
	await fixture(page); await scrollTo(page, key(40)); await row(page, key(40)).focus();
	const original = await row(page, key(40)).elementHandle();
	await viewport(page).evaluate(element => { element.scrollTop = element.scrollHeight * 0.85; });
	await expect.poll(() => tree(page).getByRole('treeitem').evaluateAll(nodes => nodes.some(node => Number(node.getAttribute('data-en-tree-key')?.slice(5)) > 200))).toBe(true);
	await expect(row(page, key(40))).toBeFocused();
	expect(await row(page, key(40)).evaluate((element, original) => element === original, original)).toBe(true);
	await snapshot(page, info, 'retained-focus');
	await page.keyboard.press('ArrowDown'); await expect(row(page, key(41))).toBeFocused();
	await snapshot(page, info, 'keyboard-next');
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.locator('#after')).toBeFocused();
	await page.keyboard.press(browserName === 'webkit' ? 'Shift+Alt+Tab' : 'Shift+Tab');
	await expect(row(page, key(41))).toBeFocused();
	await snapshot(page, info, 'tab-return');
});

test('cancelable selection and equal authoritative writes preserve ownership; disabled rows stay nonselectable', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate(element => element.addEventListener('en-change', event => {
		(element as any).__tentative = { value: (element as any).value, detail: (event as CustomEvent).detail };
		event.preventDefault();
	}, { once: true }));
	await row(page, key(1)).focus(); await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', key(0));
	expect(await tree(page).evaluate((element: any) => element.__tentative.value)).toBe(key(1));
	await expect(row(page, key(1))).toBeFocused();
	await tree(page).evaluate(element => element.addEventListener('en-change', event => {
		event.preventDefault(); (element as any).value = (element as any).value;
	}, { once: true }));
	await page.keyboard.press('Enter'); await expect(tree(page)).toHaveJSProperty('value', key(1));
	await page.keyboard.press('ArrowDown'); await expect(row(page, key(2))).toBeFocused();
	await page.keyboard.press('Space'); await expect(tree(page)).toHaveJSProperty('value', key(1));
});

test('collapse of an ancestor recovers focus and rejects scrolling to a hidden descendant', async ({ page }) => {
	await fixture(page); await scrollTo(page, key(190)); await row(page, key(190)).focus();
	await tree(page).evaluate((element: any) => element.expanded = []);
	await expect(row(page, 'folder')).toBeFocused();
	await expect(row(page, key(190))).toHaveCount(0);
	expect(await tree(page).evaluate((element: any) => element.scrollToKey('leaf-190'))).toBe(false);
	await page.keyboard.press('ArrowRight'); await expect(row(page, 'folder')).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowRight'); await expect(row(page, key(0))).toBeFocused();
});

test('replacement data retains stable identities, recovers removed focus and leaves outside focus alone', async ({ page }) => {
	await fixture(page); await row(page, key(1)).focus();
	const first = await row(page, key(0)).elementHandle();
	await tree(page).evaluate((element: any) => {
		element.items = [{ ...element.items[0], children: element.items[0].children.filter((entry: any) => entry.value !== 'leaf-001') }, element.items[1]];
	});
	await expect(row(page, key(1))).toHaveCount(0);
	await expect.poll(() => tree(page).evaluate(element => element.matches(':focus-within'))).toBe(true);
	expect(await row(page, key(0)).evaluate((element, original) => element === original, first)).toBe(true);
	await page.locator('#after').focus();
	await tree(page).evaluate((element: any) => {
		element.items = [...element.items, { value: 'added', label: 'Added later' }];
	});
	await expect(page.locator('#after')).toBeFocused();
	await scrollTo(page, 'added'); await expect(row(page, 'added')).toHaveAttribute('aria-setsize', '3');
	await expect(tree(page)).toHaveJSProperty('value', key(0));
});

test('RTL branch navigation and phone-width scrolling retain usable geometry', async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 }); await fixture(page);
	await tree(page).evaluate(element => element.setAttribute('dir', 'rtl'));
	await row(page, 'folder').focus(); await page.keyboard.press('ArrowRight');
	await expect(row(page, 'folder')).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('ArrowLeft'); await expect(row(page, 'folder')).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowLeft'); await expect(row(page, key(0))).toBeFocused();
	await scrollTo(page, key(250)); await snapshot(page, info, 'narrow-rtl');
	const bounds = await viewport(page).evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
	expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
});

test('full-render mode supports the same keys and switching virtualization preserves selection', async ({ page }) => {
	await fixture(page, false); await expect(tree(page).getByRole('treeitem')).toHaveCount(302);
	await row(page, key(240)).focus(); await page.keyboard.press('Enter');
	await tree(page).evaluate((element: any) => element.virtualize = true);
	await expect(tree(page)).toHaveJSProperty('value', key(240));
	await expect(row(page, key(240))).toBeFocused();
	await expect.poll(() => tree(page).getByRole('treeitem').count()).toBeLessThan(100);
	await tree(page).evaluate((element: any) => element.virtualize = false);
	await expect(tree(page).getByRole('treeitem')).toHaveCount(302);
	await expect(row(page, key(240))).toBeFocused();
});

test('data demo delivers bounded SSR rows and hydrates existing row identities', async ({ page }, info) => {
	let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto(path, { waitUntil: 'commit' });
		const host = page.locator('#specimen-tree-data');
		const initial = host.getByRole('treeitem');
		await expect(initial.first()).toBeVisible();
		const viewportHeight = () => host.locator('[part~="viewport"]').evaluate(element => element.getBoundingClientRect().height);
		const expectedHeight = await host.evaluate(element => element.getBoundingClientRect().height);
		await expect.poll(viewportHeight).toBe(expectedHeight);
		expect(await initial.count()).toBeGreaterThan(0); expect(await initial.count()).toBeLessThanOrEqual(20);
		const first = initial.first();
		await expect(first).toHaveAttribute('aria-level', '1');
		await expect(first).toHaveAttribute('aria-setsize', '20');
		const identity = await first.elementHandle();
		await info.attach('ssr-data-tree.aria.yml', { body: await host.getByRole('tree').ariaSnapshot(), contentType: 'text/yaml' });
		release(); await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect.poll(() => host.evaluate((element: any) => element.items?.length)).toBe(20);
		await expect.poll(viewportHeight).toBe(expectedHeight);
		expect(await first.evaluate((element, original) => element === original, identity)).toBe(true);
		await info.attach('hydrated-data-tree.aria.yml', { body: await host.getByRole('tree').ariaSnapshot(), contentType: 'text/yaml' });
	} finally { release(); }
});

async function liveDemo(page: Page) {
	await page.goto(`${path}?progress-report`);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	return page.locator('.tree-data-demo');
}

test('live demo toggles full rendering and inserts/removes data while keeping selected keys', async ({ page }) => {
	const demo = await liveDemo(page); const host = demo.locator('#specimen-tree-data');
	const toggle = demo.getByRole('switch', { name: 'Virtualize expanded items', exact: true });
	await toggle.uncheck(); await expect(host.getByRole('treeitem')).toHaveCount(1020);
	await demo.getByRole('button', { name: 'Insert child', exact: true }).click();
	await expect(host.getByRole('treeitem')).toHaveCount(1021);
	await host.getByRole('treeitem', { name: 'New local asset', exact: true }).click();
	await expect(host).toHaveJSProperty('value', 'asset-added');
	await toggle.check(); await expect.poll(() => host.getByRole('treeitem').count()).toBeLessThan(100);
	await expect(host).toHaveJSProperty('value', 'asset-added');
	await demo.getByRole('button', { name: 'Remove inserted child', exact: true }).click();
	await expect(host.getByRole('treeitem', { name: 'New local asset', exact: true })).toHaveCount(0);
	await expect(host).toHaveJSProperty('value', '');
	await expect(demo.locator('[data-tree-data-status]')).toContainText('Removed asset-added');
});

test('live demo reports collapsed scroll targets and reveals keyed items after expanding', async ({ page }) => {
	const demo = await liveDemo(page); const host = demo.locator('#specimen-tree-data');
	await demo.getByRole('button', { name: 'Collapse all collections', exact: true }).click();
	await demo.locator('summary').filter({ hasText: 'Scroll to an item' }).click();
	await demo.getByRole('textbox', { name: 'Item key', exact: true }).fill('asset-10-025');
	const jump = demo.getByRole('button', { name: 'Scroll to item', exact: true });
	await jump.click(); await expect(demo.locator('[data-tree-data-status]')).toContainText('Cannot reveal asset-10-025');
	await demo.getByRole('button', { name: 'Expand all collections', exact: true }).click();
	await jump.focus(); await jump.press('Enter');
	await expect(demo.locator('[data-tree-data-status]')).toContainText('Scrolled to asset-10-025');
	await expect(host.getByRole('treeitem', { name: 'Asset 10 · 025', exact: true })).toBeInViewport();
	await expect(jump).toBeFocused(); await expect(host).toHaveJSProperty('value', '');
});

test('live demo keeps selection and nested hierarchy across inspired themes and narrow RTL', async ({ page }, info) => {
	const demo = await liveDemo(page); const host = demo.locator('#specimen-tree-data');
	await host.getByRole('treeitem', { name: 'Asset 01 · 001', exact: true }).click();
	await expect(host).toHaveJSProperty('value', 'asset-01-001');
	if (info.project.name === 'chromium') await demo.screenshot({ path: info.outputPath('data-tree-desktop.png') });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('html').evaluate(element => element.dir = 'rtl');
	for (const theme of ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'holotable-inspired']) {
		await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme);
		await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
		await expect(host).toHaveJSProperty('value', 'asset-01-001');
		await host.getByRole('treeitem', { name: 'Collection 01', exact: true }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(host.getByRole('treeitem', { name: 'Collection 01', exact: true })).toHaveAttribute('aria-expanded', 'false');
		await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
		await expect(host.getByRole('treeitem', { name: 'Asset 01 · 001', exact: true })).toBeFocused();
		const bounds = await host.locator('[part~="viewport"]').evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
		expect(bounds.scroll).toBeLessThanOrEqual(bounds.width + 1);
	}
	if (info.project.name === 'chromium') await demo.screenshot({ path: info.outputPath('data-tree-mobile-rtl.png') });
});

for (const cancel of [false, true]) {
	test(`replacing items during selection invalidates the removed proposal (${cancel ? 'canceled' : 'uncanceled'})`, async ({ page }) => {
		await fixture(page);
		await tree(page).evaluate((element: any, cancel) => element.addEventListener('en-change', (event: Event) => {
			element.__tentative = element.value;
			element.items = [{ ...element.items[0], children: element.items[0].children.filter((item: any) => item.value !== 'leaf-001') }, element.items[1]];
			if (cancel) event.preventDefault();
		}, { once: true }), cancel);
		await row(page, key(1)).focus(); await page.keyboard.press('Enter');
		expect(await tree(page).evaluate((element: any) => element.__tentative)).toBe(key(1));
		await expect(tree(page)).toHaveJSProperty('value', key(0));
		await expect(row(page, key(1))).toHaveCount(0);
		await expect(row(page, key(0))).toHaveAttribute('aria-selected', 'true');
		await expect(tree(page).locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(1);
	});
}

test('an explicit equal value write still owns selection after replacement data invalidates the proposed key', async ({ page }) => {
	await fixture(page);
	await tree(page).evaluate((element: any) => element.addEventListener('en-change', (event: Event) => {
		element.items = [{ ...element.items[0], children: element.items[0].children.filter((item: any) => item.value !== 'leaf-001') }, element.items[1]];
		element.value = element.value;
		event.preventDefault();
	}, { once: true }));
	await row(page, key(1)).focus(); await page.keyboard.press('Enter');
	await expect(tree(page)).toHaveJSProperty('value', key(1));
	await expect(row(page, key(1))).toHaveCount(0);
	await expect(row(page, key(0))).toHaveAttribute('aria-selected', 'false');
	await expect(tree(page).locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(0);
	await tree(page).evaluate((element: any) => {
		const children = [...element.items[0].children];
		children.splice(1, 0, { value: 'leaf-001', label: 'Asset 001' });
		element.items = [{ ...element.items[0], children }, element.items[1]];
	});
	await expect(row(page, key(1))).toHaveAttribute('aria-selected', 'true');
	await expect(tree(page)).toHaveJSProperty('value', key(1));
});

test('switching data to authored slots and back releases the old data focus window', async ({ page }) => {
	await fixture(page); await scrollTo(page, key(40)); await row(page, key(40)).focus();
	await page.locator('#after').focus();
	await tree(page).evaluate((element: any) => {
		element.__savedItems = element.items;
		element.items = undefined;
		element.innerHTML = '<en-tree-item value="slot-one" label="Authored first"></en-tree-item><en-tree-item value="slot-two" label="Authored second"></en-tree-item>';
	});
	await expect(page.locator('#after')).toBeFocused();
	await expect(tree(page).locator('[data-en-tree-key]')).toHaveCount(0);
	await expect(tree(page).getByRole('treeitem')).toHaveCount(2);
	await tree(page).evaluate((element: any) => element.focus());
	await expect(tree(page).getByRole('treeitem', { name: 'Authored first', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(tree(page).getByRole('treeitem', { name: 'Authored second', exact: true })).toBeFocused();
	await page.locator('#after').focus();
	await tree(page).evaluate((element: any) => {
		element.replaceChildren(); element.items = element.__savedItems;
	});
	await expect(page.locator('#after')).toBeFocused();
	await expect(tree(page).getByRole('treeitem', { name: 'Authored second', exact: true })).toHaveCount(0);
	await tree(page).evaluate((element: any) => element.focus());
	await expect(row(page, key(0))).toBeFocused();
	await expect(row(page, key(40))).toHaveCount(0);
	await expect(tree(page)).toHaveJSProperty('value', key(0));
});

test('virtual multiple selection ranges include unmounted rows, survive collapse and expose stable selected semantics', async ({ page }, info) => {
  await fixture(page);
  await tree(page).evaluate((host: any) => { host.multiple = true; host.values = ['leaf-000','future']; });
  const first = tree(page).getByRole('treeitem',{name:label(0),exact:true});
  await first.focus(); await page.keyboard.press('Space'); await page.keyboard.press('Shift+End');
  await expect.poll(() => tree(page).evaluate((host:any) => host.values.length)).toBe(300); // 299 enabled leaves + tail; the old unknown selection is replaced
  await expect(tree(page).getByRole('treeitem',{name:'Tail',exact:true})).toBeFocused();
  expect(await tree(page).getByRole('treeitem').count()).toBeLessThan(100);
  await expect.poll(() => tree(page).evaluate((host:any) => host.values.includes('leaf-002'))).toBe(false);
  await info.attach('multiple-scrolled', {body:await tree(page).ariaSnapshot(),contentType:'text/yaml'});
  await tree(page).evaluate((host:any) => { host.expanded = []; });
  await expect.poll(() => tree(page).evaluate((host:any) => host.values.length)).toBe(300);
  await page.keyboard.press('Control+a');
  await expect.poll(() => tree(page).evaluate((host:any) => host.values.includes('folder'))).toBe(true);
  await page.keyboard.press('Control+a');
  await expect.poll(() => tree(page).evaluate((host:any) => host.values.length)).toBe(299);
});

test('authored multiple demo retains selected semantics and node identity through hydration', async ({ page }, info) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
  try {
    await page.goto(path,{waitUntil:'commit'});
    const host=page.locator('#specimen-tree-multi');
    const cover=host.getByRole('treeitem',{name:'Cover',exact:true});
    await expect(host.getByRole('tree')).toHaveAttribute('aria-multiselectable','true');
    await expect(cover).toHaveAttribute('aria-selected','true');
    const original=await cover.elementHandle();
    await info.attach('multiple-before-hydration',{body:await host.ariaSnapshot(),contentType:'text/yaml'});
    release();
    await expect.poll(() => host.evaluate((node:any)=>node.values)).toEqual(['cover']);
    expect(await cover.evaluate((node,original)=>node===original,original)).toBe(true);
    await cover.focus(); await page.keyboard.press('Shift+ArrowDown');
    await expect(host).toHaveJSProperty('values',['cover','poster']);
    await info.attach('multiple-after-hydration',{body:await host.ariaSnapshot(),contentType:'text/yaml'});
  } finally { release(); }
});

test('Shift-click ranges span unmounted rows and shrink after scrolling back', async ({ page }) => {
  await fixture(page);
  await tree(page).evaluate((host: any) => { host.multiple = true; host.values = ['leaf-000']; });
  await scrollTo(page, 'leaf-250');
  await row(page, 'leaf-250').click({ modifiers: ['Shift'] });
  await expect(tree(page)).toHaveJSProperty('values', Array.from({ length: 251 }, (_, i) => key(i)).filter(value => value !== 'leaf-002'));
  await scrollTo(page, 'leaf-005');
  await row(page, 'leaf-005').click({ modifiers: ['Shift'] });
  await expect(tree(page)).toHaveJSProperty('values', ['leaf-000','leaf-001','leaf-003','leaf-004','leaf-005']);
  expect(await tree(page).getByRole('treeitem').count()).toBeLessThan(100);
});

for (const layout of ['flex', 'grid']) {
	test(`virtual viewport fits a ${layout} allocation during a synchronous shrink and reveal request`, async ({ page }) => {
		await fixture(page);
		await tree(page).evaluate((element, layout) => {
			const container = document.createElement('section');
			container.id = 'tree-layout';
			container.style.cssText = `display:${layout};flex-direction:column;grid-template-rows:auto minmax(0,1fr);block-size:420px;inline-size:320px`;
			const heading = document.createElement('div');
			heading.textContent = 'Outline'; heading.style.cssText = 'block-size:40px;flex:none';
			element.before(container);container.append(heading, element);
			element.style.cssText = 'flex:1;min-block-size:0';
		}, layout);
		await page.locator('#tree-layout').evaluate(element => { element.style.blockSize = '420px'; });
		await expect.poll(() => viewport(page).evaluate(element => element.clientHeight)).toBe(380);
		await expect.poll(() => page.locator('#tree-layout').evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
		await scrollTo(page, 'leaf-299');

		const accepted = await tree(page).evaluate((element: any) => {
			const container = document.querySelector<HTMLElement>('#tree-layout')!;
			container.style.blockSize = '200px';
			return element.scrollToKey('leaf-299', { block: 'center', inline: 'nearest', behavior: 'instant' });
		});
		expect(accepted).toBe(true);
		await expect.poll(() => viewport(page).evaluate(element => element.clientHeight)).toBe(160);
		await expect.poll(() => page.locator('#tree-layout').evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
		await expect(row(page, 'leaf-299')).toBeInViewport();

		await page.locator('#tree-layout').evaluate(element => { element.style.blockSize = '700px'; });
		await expect.poll(() => viewport(page).evaluate(element => element.clientHeight)).toBe(660);
		await expect.poll(() => page.locator('#tree-layout').evaluate(element => element.scrollHeight - element.clientHeight)).toBe(0);
		await scrollTo(page, 'leaf-299');
	});
}
