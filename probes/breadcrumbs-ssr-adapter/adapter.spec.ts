import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';

const mainHost = (page: Page) => page.locator('en-breadcrumbs-probe#path');
const landmark = (page: Page, label = 'Project path') => page.getByRole('navigation', { name: label, exact: true });
const nextTab = (browserName: string) => browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
function errorsFor(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	return errors;
}
async function hydrate(page: Page) {
	await page.waitForFunction(() => typeof (window as any).startProbe === 'function');
	await page.evaluate(() => (window as any).startProbe());
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
}
async function start(page: Page, url = '/fixture') { await page.goto(url); await hydrate(page); }
async function settle(page: Page) { await page.evaluate(() => (window as any).breadcrumbsProbe.settle()); }
async function expectPath(page: Page) {
	await expect(mainHost(page).getByRole('link')).toHaveCount(2);
	// YAML requires spaces inside this payload; TypeScript indentation uses tabs.
	await expect(landmark(page)).toMatchAriaSnapshot(`
    - navigation "Project path":
      - list:
        - listitem:
          - link "Home":
            - /url: "#home"
            - strong: Home
        - listitem:
          - link "Projects workspace":
            - /url: "#projects"
            - text: Projects
            - emphasis: workspace
        - listitem:
          - text: Document
          - emphasis: draft
	`);
}
async function saveProjection(host: Locator, key = 'path') {
	return host.evaluate((element, name) => {
		const children = [...element.children];
		const wrappers = [...element.shadowRoot!.querySelectorAll('li')];
		(window as any).savedProjections ??= {};
		(window as any).savedProjections[name] = { element, root: element.shadowRoot, children, wrappers };
		return {
			mode: element.shadowRoot!.slotAssignment,
			children: children.map(node => ({ id: node.id, tag: node.localName, slot: node.getAttribute('slot') })),
			mapped: children.every(node => node.assignedSlot?.parentElement?.localName === 'li'),
			unique: new Set(children.map(node => node.assignedSlot)).size === children.length,
			geometry: wrappers.map(node => { const box = node.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
		};
	}, key);
}
async function retainedProjection(host: Locator, key = 'path') {
	return host.evaluate((element, name) => {
		const saved = (window as any).savedProjections[name];
		const children = [...element.children];
		const wrappers = [...element.shadowRoot!.querySelectorAll('li')];
		return {
			root: element.shadowRoot === saved.root,
			children: children.length === saved.children.length && children.every((node, index) => node === saved.children[index]),
			wrappers: wrappers.length === saved.wrappers.length && wrappers.every((node, index) => node === saved.wrappers[index]),
			mapped: children.every(node => node.assignedSlot?.parentElement?.localName === 'li'),
			geometry: wrappers.map(node => { const box = node.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
		};
	}, key);
}

test('ordinary authored children receive usable named SSR mappings with JavaScript disabled', async ({ browser, browserName, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	try {
		const response = await page.goto(`${baseURL}/fixture`);
		expect(response?.headers()['x-probe-renderer']).toBe('@en-reve/ssr + createBreadcrumbsSsrAdapter');
		await expectPath(page);
		await expect(mainHost(page).locator(':scope > a')).toHaveCount(2);
		await expect(mainHost(page).locator(':scope > span')).toHaveCount(1);
		await expect(page.locator('#path-home strong')).toHaveText('Home');
		await expect(page.locator('#path-current em')).toHaveText('draft');
		expect(await mainHost(page).getAttribute('label')).toBeNull();
		await page.getByRole('button', { name: 'Before path', exact: true }).focus();
		await page.keyboard.press(nextTab(browserName));
		await expect(mainHost(page).getByRole('link', { name: 'Home', exact: true })).toBeFocused();
		await page.keyboard.press(nextTab(browserName));
		const projects = mainHost(page).getByRole('link', { name: 'Projects workspace', exact: true });
		await expect(projects).toBeFocused();
		await projects.press('Enter');
		await expect(page).toHaveURL(`${baseURL}/fixture#projects`);
		await expect(page.getByRole('heading', { name: 'Projects destination' })).toBeInViewport();
	} finally { await context.close(); }
});

for (const built of [false, true]) test(`${built ? 'minified built' : 'development'} hydration preserves nodes, private wrappers, root, focus, geometry and native listeners`, async ({ page }, testInfo) => {
	const errors = errorsFor(page);
	await page.goto(built ? '/built-fixture' : '/fixture');
	await expectPath(page);
	const before = await saveProjection(mainHost(page));
	expect(before.mode).toBe('named');
	expect(before.mapped).toBe(true);
	expect(before.unique).toBe(true);
	const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await home.evaluate(anchor => {
		(window as any).nativeClicks = 0;
		anchor.addEventListener('click', () => { (window as any).nativeClicks++; });
	});
	await hydrate(page);
	await expect(home).toBeFocused();
	await expectPath(page);
	await expect(mainHost(page)).toHaveJSProperty('label', 'Project path');
	expect(await mainHost(page).getAttribute('label')).toBeNull();
	const after = await retainedProjection(mainHost(page));
	expect(after.root && after.children && after.wrappers && after.mapped).toBe(true);
	for (let index = 0; index < before.geometry.length; index++) {
		for (let axis = 0; axis < 4; axis++) expect(Math.abs(before.geometry[index][axis] - after.geometry[index][axis])).toBeLessThan(0.1);
	}
	await home.click();
	expect(await page.evaluate(() => (window as any).nativeClicks)).toBe(1);
	expect(await page.evaluate(() => (window as any).breadcrumbsProbe.clicks)).toEqual([{ id: 'path-home', href: '#home' }]);
	if (built) {
		const report = await (await page.request.get('/built-report')).json();
		expect(report.styleBlocks).toBeGreaterThan(0);
		expect(report.outputBytes).toBeLessThanOrEqual(report.inputBytes);
		await testInfo.attach('minification', { body: JSON.stringify(report), contentType: 'application/json' });
	}
	await testInfo.attach('hydration-retention', { body: JSON.stringify({ built, before, after, aria: await landmark(page).ariaSnapshot() }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

for (const mode of ['server', 'client']) test(`${mode} supports anchored template updates, rich labels and distinct same-href native nodes`, async ({ page }, testInfo) => {
	const errors = errorsFor(page);
	await start(page, `/fixture?mode=${mode}`);
	expect(await mainHost(page).evaluate(element => element.shadowRoot!.slotAssignment)).toBe(mode === 'client' ? 'manual' : 'named');
	await expectPath(page);
	await page.locator('#path-home').evaluate(anchor => {
		(window as any).originalHome = anchor;
		(window as any).homeWrapper = anchor.assignedSlot?.parentElement;
	});
	await page.locator('#path-projects').evaluate(anchor => {
		(window as any).originalProjects = anchor;
		(window as any).projectLabel = anchor.querySelector('em');
		(window as any).originalProjectClicks = 0;
		anchor.addEventListener('click', () => { (window as any).originalProjectClicks++; });
	});
	await page.evaluate(() => (window as any).breadcrumbsProbe.update({ revision: 1, extra: true, order: ['projects', 'home', 'current'], label: 'Updated project path' }));
	const renamed = landmark(page, 'Updated project path');
	await expect(renamed).toMatchAriaSnapshot(`
    - navigation "Updated project path":
      - list:
        - listitem:
          - link "Projects updated":
            - /url: "#updated"
            - text: Projects
            - emphasis: updated
        - listitem:
          - link "Home":
            - /url: "#home"
            - strong: Home
        - listitem:
          - link "Shared library":
            - /url: "#extra"
        - listitem:
          - text: Document
          - emphasis: revised
	`);
	expect(await page.locator('#path-home').evaluate(anchor => anchor === (window as any).originalHome && anchor.assignedSlot?.parentElement === (window as any).homeWrapper)).toBe(true);
	expect(await page.locator('#path-projects').evaluate(anchor => anchor === (window as any).originalProjects && anchor.querySelector('em') === (window as any).projectLabel)).toBe(true);
	await page.locator('#path-home').evaluate(anchor => anchor.setAttribute('href', '#updated'));
	await page.locator('#path-projects').click();
	expect(await page.evaluate(() => (window as any).originalProjectClicks)).toBe(1);
	await page.locator('#path-home').click();
	expect(await page.evaluate(() => (window as any).breadcrumbsProbe.clicks.map((event: any) => event.id))).toEqual(['path-projects', 'path-home']);
	await page.evaluate(() => (window as any).breadcrumbsProbe.remove('extra'));
	await expect(renamed.getByRole('listitem')).toHaveCount(3);
	await expect(page.locator('#path-extra')).toHaveCount(0);
	await testInfo.attach('live-template-result', { body: JSON.stringify({ mode, aria: await renamed.ariaSnapshot() }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

test('consumer native cancellation, target and rel remain effective after projection', async ({ page, baseURL }) => {
	const errors = errorsFor(page);
	await start(page);
	await mainHost(page).evaluate(element => {
		element.addEventListener('click', event => {
			const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
			if (link?.id === 'path-home') event.preventDefault();
		});
	});
	const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.click();
	await expect(page).toHaveURL(`${baseURL}/fixture`);
	await home.focus();
	await home.press('Enter');
	await expect(page).toHaveURL(`${baseURL}/fixture`);
	expect(await page.evaluate(() => (window as any).breadcrumbsProbe.clicks.length)).toBe(2);
	const projects = page.locator('#path-projects');
	await projects.evaluate(anchor => { anchor.setAttribute('target', '_blank'); anchor.setAttribute('rel', 'noopener'); });
	const popupPromise = page.waitForEvent('popup');
	await projects.click();
	const popup = await popupPromise;
	try {
		await expect(popup).toHaveURL(`${baseURL}/fixture#projects`);
		expect(await popup.evaluate(() => window.opener === null)).toBe(true);
		await expect(popup.getByRole('heading', { name: 'Projects destination' })).toBeVisible();
	} finally { await popup.close(); }
	expect(errors).toEqual([]);
});

for (const caseName of ['adjacent', 'nested']) test(`${caseName} hosts retain independent SSR mappings across hydration and template updates`, async ({ page }, testInfo) => {
	const errors = errorsFor(page);
	await page.goto(`/fixture?case=${caseName}`);
	await expectPath(page);
	if (caseName === 'adjacent') {
		await expect(page.locator('en-breadcrumbs-probe')).toHaveCount(2);
		await expect(landmark(page, 'Secondary path')).toBeVisible();
		await saveProjection(page.locator('#secondary'), 'secondary');
	} else {
		expect(await mainHost(page).evaluate(element => element.getRootNode() instanceof ShadowRoot && (element.getRootNode() as ShadowRoot).host.localName === 'en-breadcrumbs-probe-frame')).toBe(true);
		await page.locator('en-breadcrumbs-probe-frame').evaluate(frame => { (window as any).savedFrameRoot = frame.shadowRoot; });
	}
	await saveProjection(mainHost(page));
	const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await hydrate(page);
	await expect(home).toBeFocused();
	const retained = await retainedProjection(mainHost(page));
	expect(retained.root && retained.children && retained.wrappers && retained.mapped).toBe(true);
	if (caseName === 'adjacent') {
		const secondary = await retainedProjection(page.locator('#secondary'), 'secondary');
		expect(secondary.root && secondary.children && secondary.wrappers && secondary.mapped).toBe(true);
		expect(await page.locator('#secondary').evaluate(element => [...element.children].every(node => node.assignedSlot?.getRootNode() === element.shadowRoot))).toBe(true);
	} else {
		expect(await page.locator('en-breadcrumbs-probe-frame').evaluate(frame => frame.shadowRoot === (window as any).savedFrameRoot)).toBe(true);
	}
	await page.evaluate(() => (window as any).breadcrumbsProbe.update({ revision: 1 }));
	await expect(mainHost(page).getByRole('link', { name: 'Projects updated', exact: true })).toBeVisible();
	await expect(home).toBeFocused();
	await testInfo.attach('independent-projections', { body: JSON.stringify({ caseName, retained, aria: await landmark(page).ariaSnapshot() }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

for (const mode of ['server', 'client']) test(`${mode} keeps an ordinary hidden crumb out of the visible path and reveals its same node and wrapper`, async ({ page, browserName }) => {
	const errors = errorsFor(page);
	await page.goto(`/fixture?mode=${mode}&hidden=1`);
	if (mode === 'client') await hydrate(page);
	const projects = page.locator('#path-projects');
	await expect(projects).toBeHidden();
	await expect(landmark(page).getByRole('listitem')).toHaveCount(2);
	await expect(landmark(page).locator('li > [aria-hidden="true"]:visible')).toHaveCount(1);
	await expect(mainHost(page).getByRole('link')).toHaveCount(1);
	await projects.evaluate(anchor => { (window as any).hiddenChild = anchor; (window as any).hiddenWrapper = anchor.assignedSlot?.parentElement; });
	if (mode === 'server') await hydrate(page);
	const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await page.evaluate(() => (window as any).breadcrumbsProbe.update({ hidden: false }));
	await expect(projects).toBeVisible();
	await expect(landmark(page).getByRole('listitem')).toHaveCount(3);
	await expect(landmark(page).locator('li > [aria-hidden="true"]:visible')).toHaveCount(2);
	expect(await projects.evaluate(anchor => anchor === (window as any).hiddenChild && anchor.assignedSlot?.parentElement === (window as any).hiddenWrapper)).toBe(true);
	await expect(home).toBeFocused();
	await page.keyboard.press(nextTab(browserName));
	await expect(projects).toBeFocused();
	await home.focus();
	await page.evaluate(() => (window as any).breadcrumbsProbe.update({ hidden: true }));
	await expect(projects).toBeHidden();
	await expect(home).toBeFocused();
	await expect(landmark(page).getByRole('listitem')).toHaveCount(2);
	await expect(landmark(page).locator('li > [aria-hidden="true"]:visible')).toHaveCount(1);
	await page.keyboard.press(nextTab(browserName));
	await expect(page.getByRole('button', { name: 'After path', exact: true })).toBeFocused();
	expect(errors).toEqual([]);
});

for (const mutation of ['remove', 'replace']) test(`named projection diagnoses external slot ${mutation} without overwriting the consumer`, async ({ page }) => {
	const errors = errorsFor(page);
	await start(page);
	const home = page.locator('#path-home');
	expect(await home.getAttribute('slot')).not.toBeNull();
	await home.evaluate((anchor, kind) => {
		if (kind === 'remove') anchor.removeAttribute('slot');
		else anchor.setAttribute('slot', 'consumer-owned-name');
	}, mutation);
	await settle(page);
	await expect(mainHost(page).getByRole('status')).toBeVisible();
	expect(await home.getAttribute('slot')).toBe(mutation === 'remove' ? null : 'consumer-owned-name');
	await settle(page);
	expect(await home.getAttribute('slot')).toBe(mutation === 'remove' ? null : 'consumer-owned-name');
	expect(errors).toEqual([]);
});

test('staged adapter output exposes the first native link before remaining children arrive', async ({ page }, testInfo) => {
	const errors = errorsFor(page);
	let released = false;
	const streamId = randomUUID();
	try {
		await page.goto(`/fixture?stream=${streamId}`, { waitUntil: 'commit' });
		const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
		await expect(home).toBeVisible();
		await expect(mainHost(page).getByRole('link')).toHaveCount(1);
		await home.focus();
		await home.evaluate(anchor => { (window as any).firstStreamedAnchor = anchor; });
		await page.request.get(`/release-stream?id=${streamId}`); released = true;
		await page.waitForLoadState('load');
		await expectPath(page);
		await hydrate(page);
		await expect(home).toBeFocused();
		expect(await home.evaluate(anchor => anchor === (window as any).firstStreamedAnchor)).toBe(true);
		await testInfo.attach('staged-delivery', { body: JSON.stringify({ partialLinks: 1, completeLinks: 2, nodeAndFocusRetained: true, adapterBuffersBeforeDelivery: true }), contentType: 'application/json' });
		expect(errors).toEqual([]);
	} finally { if (!released) await page.request.get(`/release-stream?id=${streamId}`); }
});


for (const mode of ['server', 'client']) test(`${mode} retains focused Home while other native children are inserted and reordered`, async ({ page, browserName }, testInfo) => {
	const errors = errorsFor(page);
	await start(page, `/fixture?mode=${mode}`);
	const home = mainHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await mainHost(page).evaluate(element => {
		const home = element.querySelector('#path-home')!;
		const projects = element.querySelector('#path-projects')!;
		const current = element.querySelector('#path-current')!;
		(window as any).retainedFocus = { home, wrapper: home.assignedSlot?.parentElement, clicks: 0 };
		home.addEventListener('click', () => { (window as any).retainedFocus.clicks++; });
		const inserted = document.createElement('a');
		inserted.id = 'path-inserted'; inserted.href = '#extra'; inserted.textContent = 'Inserted path';
		// Only other native nodes move. The focused anchor is neither removed
		// nor moved; the component must preserve its existing projection.
		element.insertBefore(inserted, projects);
		element.insertBefore(current, inserted);
	});
	await settle(page);
	await expect(landmark(page).getByRole('listitem')).toHaveCount(4);
	await expect(landmark(page)).toMatchAriaSnapshot(`
  - navigation "Project path":
    - list:
      - listitem:
        - link "Home":
          - /url: "#home"
          - strong: Home
      - listitem:
        - text: Document
        - emphasis: draft
      - listitem:
        - link "Inserted path":
          - /url: "#extra"
      - listitem:
        - link "Projects workspace":
          - /url: "#projects"
          - text: Projects
          - emphasis: workspace
	`);
	await expect(home).toBeFocused();
	const retained = await home.evaluate(anchor => ({
		node: anchor === (window as any).retainedFocus.home,
		wrapper: anchor.assignedSlot?.parentElement === (window as any).retainedFocus.wrapper,
	}));
	expect(retained).toEqual({ node: true, wrapper: true });
	await page.keyboard.press(nextTab(browserName));
	await expect(mainHost(page).getByRole('link', { name: 'Inserted path', exact: true })).toBeFocused();
	await home.click();
	expect(await page.evaluate(() => (window as any).retainedFocus.clicks)).toBe(1);
	await testInfo.attach('focus-during-native-mutations', { body: JSON.stringify({ mode, retained, scope: 'Focused native anchor is not itself moved.' }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});
