import { expect, test, type Page } from '@playwright/test';

function recordErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	return errors;
}

async function start(page: Page, query = '?render=client') {
	await page.goto(`/fixture${query}`);
	await page.waitForFunction(() => typeof (window as any).startNavigationFixture === 'function');
	expect(await page.evaluate(() => [customElements.get('en-navigation'), customElements.get('en-breadcrumbs')])).toEqual([undefined, undefined]);
	await page.evaluate(() => (window as any).startNavigationFixture());
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

const navigationHost = (page: Page) => page.locator('en-navigation');
const nav = (page: Page) => page.getByRole('navigation', { name: 'Workspace sections', exact: true });
const breadcrumbHost = (page: Page) => page.locator('en-breadcrumbs');
const breadcrumbs = (page: Page) => page.getByRole('navigation', { name: 'Project path', exact: true });
const nextTab = (browserName: string) => browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

async function expectPlainHosts(page: Page) {
	for (const tag of ['en-navigation', 'en-breadcrumbs']) {
		const host = page.locator(tag);
		expect(await host.getAttribute('role')).toBeNull();
		expect(await host.getAttribute('tabindex')).toBeNull();
		expect(await host.getAttribute('items')).toBeNull();
	}
}

test('server-rendered shadow navigation works before any JavaScript runs', async ({ browser, browserName, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	try {
		await page.goto(`${baseURL}/fixture`);
		await expect(nav(page)).toBeVisible();
		await expect(breadcrumbs(page)).toBeVisible();
		// DOM locators remain usable with scripts disabled in Firefox; reading
		// JavaScript properties requires a main-world evaluation there.
		await expect(breadcrumbs(page).locator('ol')).toBeVisible();
		await expect(breadcrumbs(page).getByRole('list')).toHaveCount(1);
		await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(3);
		await expect(breadcrumbHost(page).getByRole('link')).toHaveCount(2);
		await expect(breadcrumbHost(page).locator('[aria-current="page"]')).toHaveText('Current document');
		await expectPlainHosts(page);
		await page.getByRole('button', { name: 'Before navigation', exact: true }).focus();
		await page.keyboard.press(nextTab(browserName));
		await expect(navigationHost(page).getByRole('link', { name: 'Overview', exact: true })).toBeFocused();
		await page.keyboard.press(nextTab(browserName));
		const details = navigationHost(page).getByRole('link', { name: 'Details', exact: true });
		await expect(details).toBeFocused();
		await details.press('Enter');
		await expect(page).toHaveURL(`${baseURL}/fixture#details`);
		await expect(page.getByRole('heading', { name: 'Details destination' })).toBeInViewport();
		// Changing the URL never invents aria-current; the application authors it.
		await expect(navigationHost(page).getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('aria-current', 'location');
		const projects = breadcrumbHost(page).getByRole('link', { name: 'Projects', exact: true });
		await projects.focus(); await projects.press('Enter');
		await expect(page).toHaveURL(`${baseURL}/fixture#overview`);
		await expect(page.getByRole('heading', { name: 'Overview destination' })).toBeInViewport();
	} finally {
		await context.close();
	}
});

test('explicit registration and authored navigation/breadcrumb children preserve ordinary tab order', async ({ page, browserName, baseURL }) => {
	const errors = recordErrors(page);
	await start(page);
	await expectPlainHosts(page);
	await expect(navigationHost(page).getByRole('link')).toHaveCount(4);
	await expect(breadcrumbs(page).getByRole('list')).toBeVisible();
	await page.getByRole('button', { name: 'Before navigation', exact: true }).focus();
	const expectedNames = ['Overview', 'Details', 'Open preview', 'Cancelled destination', 'Home', 'Projects'];
	for (const name of expectedNames) {
		await page.keyboard.press(nextTab(browserName));
		await expect(page.locator('#fixture').getByRole('link', { name, exact: true })).toBeFocused();
	}
	await page.keyboard.press(nextTab(browserName));
	await expect(page.getByRole('button', { name: 'After navigation', exact: true })).toBeFocused();
	const details = navigationHost(page).getByRole('link', { name: 'Details', exact: true });
	await details.focus();
	await details.press('Enter');
	await expect(page).toHaveURL(`${baseURL}/fixture?render=client#details`);
	await expect(page.getByRole('heading', { name: 'Details destination' })).toBeInViewport();
	expect(errors).toEqual([]);
});

test('host consumers can cancel native activation while target and rel keep new-tab behavior', async ({ page, baseURL }) => {
	const errors = recordErrors(page);
	await start(page);
	await page.locator('en-navigation').evaluate(host => {
		(window as any).navigationEvents = [];
		for (const name of ['en-change', 'en-change', 'change']) {
			host.addEventListener(name, () => (window as any).navigationEvents.push(name));
		}
		host.addEventListener('click', event => {
			const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
			if (link?.hash === '#cancelled') event.preventDefault();
		});
	});
	const cancelled = navigationHost(page).getByRole('link', { name: 'Cancelled destination' });
	await cancelled.click();
	await expect(page).toHaveURL(`${baseURL}/fixture?render=client`);
	await cancelled.focus();
	await cancelled.press('Enter');
	await expect(page).toHaveURL(`${baseURL}/fixture?render=client`);
	const preview = navigationHost(page).getByRole('link', { name: 'Open preview' });
	await expect(preview).toHaveAttribute('target', '_blank');
	await expect(preview).toHaveAttribute('rel', 'noopener');
	const popupPromise = page.waitForEvent('popup');
	await preview.click();
	const popup = await popupPromise;
	await expect(popup).toHaveURL(`${baseURL}/destination`);
	await expect(popup.getByRole('heading', { name: 'Preview destination' })).toBeVisible();
	expect(await popup.evaluate(() => window.opener === null)).toBe(true);
	await popup.close();
	await preview.evaluate(anchor => anchor.setAttribute('rel', 'noreferrer'));
	await expect(preview).toHaveAttribute('rel', 'noreferrer');
	await preview.evaluate(anchor => anchor.removeAttribute('rel'));
	await page.evaluate(() => (window as any).settleNavigationFixture());
	expect(await preview.getAttribute('rel')).toBeNull();
	expect(await page.evaluate(() => (window as any).navigationEvents)).toEqual([]);
	expect(errors).toEqual([]);
});

test('private layout Parts stay encapsulated while authored links remain in the consumer CSS scope', async ({ page }) => {
	const errors = recordErrors(page);
	await start(page);
	await page.locator('body').evaluate(body => body.classList.add('hostile'));
	await expect(page.locator('#hostile-control')).toBeHidden();
	await expect(nav(page)).toBeVisible();
	await expect(breadcrumbs(page)).toBeVisible();
	await expect(navigationHost(page).locator('#navigation-details')).toBeHidden();
	await expect(breadcrumbHost(page).locator('#breadcrumb-home')).toBeHidden();
	await page.locator('body').evaluate(body => { body.classList.remove('hostile'); body.classList.add('custom-parts'); });
	for (const link of [navigationHost(page).getByRole('link', { name: 'Details', exact: true }), breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true })]) {
		await expect(link).toBeVisible();
		await expect(link).toHaveCSS('text-decoration-line', 'overline');
		await expect(link).toHaveCSS('border-top-left-radius', '11px');
	}
	await expect(navigationHost(page).locator('[part~="base"]')).toHaveCSS('border-block-end-width', '5px');
	await expect(page.locator('en-breadcrumbs [part~="separator"]').first()).toHaveCSS('color', 'rgb(120, 40, 160)');
	await expect(page.locator('en-navigation [part~="base"]')).toHaveJSProperty('tagName', 'NAV');
	await expect(page.locator('en-breadcrumbs [part~="list"]')).toHaveJSProperty('tagName', 'OL');
	await expect(page.locator('en-breadcrumbs [part~="item"]')).toHaveCount(3);
	await expect(page.locator('en-breadcrumbs [part~="item"]').first()).toHaveCSS('padding-inline-start', '9px');
	await expect(breadcrumbHost(page).locator('#breadcrumb-current')).toHaveText('Current document');
	expect(errors).toEqual([]);
});

test('theme variables, RTL layout and the absent medium size work across both wrappers', async ({ page }) => {
	const errors = recordErrors(page);
	await start(page, '?render=client&dir=rtl');
	await expect(nav(page)).toHaveCSS('direction', 'rtl');
	await expect(breadcrumbs(page)).toHaveCSS('direction', 'rtl');
	await expect(navigationHost(page).getByRole('link')).toHaveText(['Overview', 'Details', 'Open preview', 'Cancelled destination']);
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(3);
	const home = await breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true }).boundingBox();
	const projects = await breadcrumbHost(page).getByRole('link', { name: 'Projects', exact: true }).boundingBox();
	expect(home && projects && home.x > projects.x).toBe(true);
	for (const tag of ['en-navigation', 'en-breadcrumbs']) {
		expect(await page.locator(tag).getAttribute('size')).toBeNull();
		await expect(page.locator(tag)).toHaveJSProperty('size', 'medium');
	}
	const details = navigationHost(page).getByRole('link', { name: 'Details', exact: true });
	const implicit = await details.boundingBox();
	await page.locator('en-navigation').evaluate(async host => {
		(host as any).size = 'medium';
		await (host as any).updateComplete;
	});
	const explicit = await details.boundingBox();
	expect(implicit && explicit && Math.abs(implicit.height - explicit.height) < 0.1).toBe(true);
	await page.locator('en-navigation').evaluate(host => {
		host.style.setProperty('--en-navigation-color', 'rgb(14, 91, 131)');
		host.style.setProperty('--en-navigation-gap', '17px');
	});
	await expect(details).toHaveCSS('color', 'rgb(14, 91, 131)');
	await expect(nav(page)).toHaveCSS('gap', '17px');
	await page.locator('en-breadcrumbs').evaluate(host => host.style.setProperty('--en-navigation-color', 'rgb(31, 93, 51)'));
	await expect(breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true })).toHaveCSS('color', 'rgb(31, 93, 51)');
	expect(errors).toEqual([]);
});

test('labels and authored native children update without replacing the focused navigation anchor', async ({ page }) => {
	const errors = recordErrors(page);
	await start(page);
	const overview = navigationHost(page).getByRole('link', { name: 'Overview', exact: true });
	await overview.focus();
	await overview.evaluate(anchor => { (window as any).savedNavigationAnchor = anchor; });
	await page.locator('en-navigation').evaluate(async host => {
		(host as any).label = 'Renamed workspace sections';
		await (host as any).updateComplete;
	});
	const renamed = page.getByRole('navigation', { name: 'Renamed workspace sections', exact: true });
	await expect(renamed).toBeVisible();
	const current = navigationHost(page).getByRole('link', { name: 'Overview', exact: true });
	await expect(current).toBeFocused();
	expect(await current.evaluate(anchor => anchor === (window as any).savedNavigationAnchor)).toBe(true);
	await navigationHost(page).evaluate(host => {
		const overview = host.querySelector('#navigation-overview')!;
		overview.textContent = '<em>Literal project</em>'; overview.removeAttribute('aria-current');
		host.querySelector('#navigation-details')!.setAttribute('aria-current', 'page');
		host.querySelector('#navigation-preview')!.remove(); host.querySelector('#navigation-cancelled')!.remove();
	});
	await expect(navigationHost(page).getByRole('link')).toHaveCount(2);
	const literal = navigationHost(page).getByRole('link', { name: '<em>Literal project</em>', exact: true });
	await expect(literal).toBeFocused();
	expect(await literal.evaluate(anchor => anchor === (window as any).savedNavigationAnchor)).toBe(true);
	await expect(navigationHost(page).locator('em')).toHaveCount(0);
	await expect(navigationHost(page).locator('[aria-current="page"]')).toHaveText('Details');
	expect(await literal.getAttribute('aria-current')).toBeNull();
	await page.locator('en-breadcrumbs').evaluate(host => {
		(host as any).label = 'Renamed path';
		const link = document.createElement('a'); link.href = '#overview'; link.textContent = 'Library';
		const current = document.createElement('span'); current.textContent = '<b>Current</b>'; current.setAttribute('aria-current', 'location');
		host.replaceChildren(link, current);
	});
	await page.evaluate(() => (window as any).settleNavigationFixture());
	const path = page.getByRole('navigation', { name: 'Renamed path' });
	await expect(path.getByRole('listitem')).toHaveCount(2);
	await expect(breadcrumbHost(page).locator('[aria-current="location"]')).toHaveText('<b>Current</b>');
	await expect(breadcrumbHost(page).locator('b')).toHaveCount(0);
	await expectPlainHosts(page);
	expect(errors).toEqual([]);
});

test('disconnecting and reinserting instances preserves their native content and property updates', async ({ page, baseURL }) => {
	const errors = recordErrors(page);
	await start(page);
	await page.locator('en-navigation').evaluate(host => {
		(window as any).savedNavigationHost = host;
		(window as any).savedReconnectAnchor = host.querySelector('a');
		host.remove();
	});
	await expect(page.locator('en-navigation')).toHaveCount(0);
	await page.locator('#fixture').evaluate(root => root.prepend((window as any).savedNavigationHost));
	await expect(nav(page)).toBeVisible();
	expect(await navigationHost(page).getByRole('link', { name: 'Overview', exact: true }).evaluate(anchor => anchor === (window as any).savedReconnectAnchor)).toBe(true);
	await page.locator('en-navigation').evaluate(async host => {
		(host as any).sticky = true;
		const link = document.createElement('a'); link.href = '#details'; link.textContent = 'Reconnected details';
		host.replaceChildren(link);
		await (host as any).updateComplete;
	});
	await expect(page.locator('en-navigation')).toHaveAttribute('sticky', '');
	const details = navigationHost(page).getByRole('link', { name: 'Reconnected details' });
	await details.click();
	await expect(page).toHaveURL(`${baseURL}/fixture?render=client#details`);
	await page.locator('en-breadcrumbs').evaluate(host => {
		const parent = host.parentElement!;
		host.remove();
		parent.append(host);
		const link = document.createElement('a'); link.href = '#overview'; link.textContent = 'Reconnected path';
		const current = document.createElement('span'); current.textContent = 'Here'; current.setAttribute('aria-current', 'page');
		host.replaceChildren(link, current);
	});
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(breadcrumbHost(page).getByRole('link', { name: 'Reconnected path' })).toBeVisible();
	await expect(breadcrumbHost(page).locator('[aria-current="page"]')).toHaveText('Here');
	expect(errors).toEqual([]);
});

test('hydration retains the exact server anchors, focus, names and authored current state', async ({ page, browserName, baseURL }, testInfo) => {
	const errors = recordErrors(page);
	await page.goto('/fixture');
	await page.waitForFunction(() => typeof (window as any).startNavigationFixture === 'function');
	expect(await page.evaluate(() => customElements.get('en-navigation'))).toBeUndefined();
	await expect(nav(page)).toBeVisible();
	await navigationHost(page).getByRole('link', { name: 'Details', exact: true }).click();
	await expect(page).toHaveURL(`${baseURL}/fixture#details`);
	const overview = navigationHost(page).getByRole('link', { name: 'Overview', exact: true });
	await overview.focus();
	const before = await navigationHost(page).evaluate(host => {
		const slot = host.shadowRoot!.querySelector('slot')!;
		const nodes = [...host.children];
		(window as any).serverNavigationSlot = slot;
		(window as any).serverNavigationClicks = 0;
		host.querySelector('#navigation-overview')!.addEventListener('click', event => {
			(window as any).serverNavigationClicks++; event.preventDefault();
		});
		return {
			mode: host.shadowRoot!.slotAssignment,
			defaultSlot: slot.name === '',
			mapped: nodes.every(node => node.assignedSlot === slot && !node.hasAttribute('slot')),
			geometry: nodes.map(node => { const box = node.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
		};
	});
	expect(before.mode).toBe('named');
	expect(before.defaultSlot && before.mapped).toBe(true);
	expect(await navigationHost(page).getAttribute('label')).toBeNull();
	await page.evaluate(() => {
		(window as any).serverNodes = [...document.querySelectorAll('en-navigation, en-breadcrumbs')].map(host => ({
			host, root: host.shadowRoot, anchors: [...host.querySelectorAll(':scope > a')],
		}));
	});
	await page.evaluate(() => (window as any).startNavigationFixture());
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expect(overview).toBeFocused();
	await expect(navigationHost(page).getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('aria-current', 'location');
	await expect(breadcrumbHost(page).locator('[aria-current="page"]')).toHaveText('Current document');
	const retained = await page.evaluate(() => (window as any).serverNodes.map((record: any) => ({
		tag: record.host.localName,
		root: record.root === record.host.shadowRoot,
		anchors: record.anchors.every((anchor: Element, index: number) => anchor === record.host.querySelectorAll(':scope > a')[index]),
		hydrated: record.host.hasUpdated,
		deferred: record.host.hasAttribute('defer-hydration'),
	})));
	expect(retained).toEqual([
		{ tag: 'en-navigation', root: true, anchors: true, hydrated: true, deferred: false },
		{ tag: 'en-breadcrumbs', root: true, anchors: true, hydrated: true, deferred: false },
	]);
	await expectPlainHosts(page);
	await expect(navigationHost(page)).toHaveJSProperty('label', 'Workspace sections');
	const after = await navigationHost(page).evaluate(host => ({
		mode: host.shadowRoot!.slotAssignment,
		slot: host.shadowRoot!.querySelector('slot') === (window as any).serverNavigationSlot,
		mapped: [...host.children].every(node => node.assignedSlot === (window as any).serverNavigationSlot && !node.hasAttribute('slot')),
		itemsAPI: 'items' in host,
		geometry: [...host.children].map(node => { const box = node.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
	}));
	expect(after.mode).toBe('named');
	expect(after.slot && after.mapped).toBe(true);
	expect(after.itemsAPI).toBe(false);
	for (let index = 0; index < before.geometry.length; index++) {
		for (let axis = 0; axis < 4; axis++) expect(Math.abs(before.geometry[index][axis] - after.geometry[index][axis])).toBeLessThan(0.1);
	}
	await overview.press('Enter');
	expect(await page.evaluate(() => (window as any).serverNavigationClicks)).toBe(1);
	await expect(page).toHaveURL(`${baseURL}/fixture#details`);
	await page.keyboard.press(nextTab(browserName));
	await expect(navigationHost(page).getByRole('link', { name: 'Details', exact: true })).toBeFocused();
	await testInfo.attach('retained-native-navigation', { body: JSON.stringify({ retained, before, after }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

for (const mode of ['server', 'client']) test(`${mode} navigation native hidden and child updates preserve default-slot identity and the unmoved focused anchor`, async ({ page, browserName }) => {
	const errors = recordErrors(page);
	await page.goto(`/fixture?render=${mode}&navigation-hidden=1`);
	if (mode === 'client') await page.evaluate(() => (window as any).startNavigationFixture());
	const details = navigationHost(page).locator('#navigation-details');
	await expect(details).toBeHidden();
	await expect(navigationHost(page).getByRole('link')).toHaveCount(3);
	await details.evaluate(anchor => {
		(window as any).hiddenNavigation = { anchor, slot: anchor.assignedSlot };
	});
	if (mode === 'server') await page.evaluate(() => (window as any).startNavigationFixture());
	expect(await navigationHost(page).evaluate(host => host.shadowRoot!.slotAssignment)).toBe('named');
	const overview = navigationHost(page).getByRole('link', { name: 'Overview', exact: true });
	await overview.focus();
	await overview.evaluate(anchor => { (window as any).unmovedNavigationAnchor = anchor; });
	await details.evaluate(anchor => { (anchor as HTMLElement).hidden = false; });
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(details).toBeVisible();
	await expect(navigationHost(page).getByRole('link')).toHaveCount(4);
	expect(await details.evaluate(anchor => anchor === (window as any).hiddenNavigation.anchor && anchor.assignedSlot === (window as any).hiddenNavigation.slot)).toBe(true);
	await expect(overview).toBeFocused();
	await page.keyboard.press(nextTab(browserName));
	await expect(details).toBeFocused();
	await overview.focus();
	await navigationHost(page).evaluate(host => {
		(host.querySelector('#navigation-details') as HTMLElement).hidden = true;
		const preview = host.querySelector('#navigation-preview')!;
		const cancelled = host.querySelector('#navigation-cancelled')!;
		const added = document.createElement('a'); added.id = 'navigation-added'; added.href = '#details';
		const strong = document.createElement('strong'); strong.textContent = 'Added section'; added.append(strong);
		host.insertBefore(added, preview);
		host.insertBefore(cancelled, preview);
		const label = document.createElement('a'); label.id = 'navigation-label'; label.textContent = 'Read-only label';
		host.append(label);
	});
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(overview).toBeFocused();
	expect(await overview.evaluate(anchor => anchor === (window as any).unmovedNavigationAnchor)).toBe(true);
	await expect(navigationHost(page).getByRole('link')).toHaveText(['Overview', 'Added section', 'Cancelled destination', 'Open preview']);
	await expect(navigationHost(page).getByRole('link', { name: 'Read-only label' })).toHaveCount(0);
	await expect(navigationHost(page).locator('#navigation-label')).toBeVisible();
	await expect(overview).toHaveAttribute('aria-current', 'location');
	await page.keyboard.press(nextTab(browserName));
	await expect(navigationHost(page).getByRole('link', { name: 'Added section', exact: true })).toBeFocused();
	await page.keyboard.press(nextTab(browserName));
	await expect(navigationHost(page).getByRole('link', { name: 'Cancelled destination', exact: true })).toBeFocused();
	await overview.focus();
	await navigationHost(page).evaluate(host => {
		host.querySelector('#navigation-added')!.remove(); host.querySelector('#navigation-label')!.remove();
	});
	await expect(navigationHost(page).getByRole('link')).toHaveCount(3);
	await expect(overview).toBeFocused();
	expect(errors).toEqual([]);
});


test('public breadcrumb SSR automatically maps authored nodes and retains their focus, wrappers and listeners through hydration', async ({ page }, testInfo) => {
	const errors = recordErrors(page);
	await page.goto('/fixture');
	const home = breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true });
	await expect(home).toBeVisible();
	await home.focus();
	const before = await breadcrumbHost(page).evaluate(host => {
		const nodes = [...host.children];
		const wrappers = nodes.map(node => node.assignedSlot?.parentElement);
		(window as any).publicBreadcrumbSSR = { root: host.shadowRoot, nodes, wrappers, clicks: 0 };
		const anchor = host.querySelector('#breadcrumb-home')!;
		anchor.addEventListener('click', event => { (window as any).publicBreadcrumbSSR.clicks++; event.preventDefault(); });
		return {
			mode: host.shadowRoot!.slotAssignment,
			mapped: nodes.every(node => node.assignedSlot?.parentElement?.localName === 'li'),
			unique: new Set(nodes.map(node => node.assignedSlot)).size === nodes.length,
			geometry: wrappers.map(node => { const box = node!.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
		};
	});
	expect(before.mode).toBe('named');
	expect(before.mapped && before.unique).toBe(true);
	expect(await breadcrumbHost(page).getAttribute('label')).toBeNull();
	await page.evaluate(() => (window as any).startNavigationFixture());
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expect(home).toBeFocused();
	await expect(breadcrumbHost(page)).toHaveJSProperty('label', 'Project path');
	const after = await breadcrumbHost(page).evaluate(host => {
		const saved = (window as any).publicBreadcrumbSSR;
		const nodes = [...host.children];
		return {
			root: host.shadowRoot === saved.root,
			nodes: nodes.length === saved.nodes.length && nodes.every((node, index) => node === saved.nodes[index]),
			wrappers: nodes.every((node, index) => node.assignedSlot?.parentElement === saved.wrappers[index]),
			geometry: nodes.map(node => { const box = node.assignedSlot!.parentElement!.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }),
		};
	});
	expect(after.root && after.nodes && after.wrappers).toBe(true);
	for (let index = 0; index < before.geometry.length; index++) {
		for (let axis = 0; axis < 4; axis++) expect(Math.abs(before.geometry[index][axis] - after.geometry[index][axis])).toBeLessThan(0.1);
	}
	await home.press('Enter');
	expect(await page.evaluate(() => (window as any).publicBreadcrumbSSR.clicks)).toBe(1);
	await expect(page).toHaveURL(new URL('/fixture', page.url()).href);
	await testInfo.attach('public-breadcrumb-hydration', { body: JSON.stringify({ before, after, aria: await breadcrumbs(page).ariaSnapshot() }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

for (const mode of ['server', 'client']) test(`${mode} native breadcrumb changes retain the unmoved focused anchor and respect authored non-link semantics`, async ({ page, browserName, baseURL }) => {
	const errors = recordErrors(page);
	await start(page, `?render=${mode}`);
	expect(await breadcrumbHost(page).evaluate(host => host.shadowRoot!.slotAssignment)).toBe(mode === 'client' ? 'manual' : 'named');
	expect(await breadcrumbHost(page).evaluate(host => 'items' in host)).toBe(false);
	const home = breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await breadcrumbHost(page).evaluate(host => {
		const home = host.querySelector('#breadcrumb-home')!;
		const projects = host.querySelector('#breadcrumb-projects')!;
		const current = host.querySelector('#breadcrumb-current')!;
		(window as any).publicNativeFocus = { home, wrapper: home.assignedSlot?.parentElement };
		const link = document.createElement('a'); link.id = 'breadcrumb-added'; link.href = '#details';
		const em = document.createElement('em'); em.textContent = 'Added detail'; link.append(em);
		host.insertBefore(link, projects);
		host.insertBefore(current, link);
		// An href-less authored anchor remains native non-link content.
		const label = document.createElement('a'); label.id = 'breadcrumb-label'; label.textContent = 'Read-only label';
		host.append(label);
	});
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(5);
	await expect(breadcrumbHost(page).getByRole('link')).toHaveCount(3);
	await expect(breadcrumbHost(page).getByRole('link', { name: 'Read-only label' })).toHaveCount(0);
	await expect(home).toBeFocused();
	expect(await home.evaluate(anchor => anchor === (window as any).publicNativeFocus.home && anchor.assignedSlot?.parentElement === (window as any).publicNativeFocus.wrapper)).toBe(true);
	await expect(breadcrumbs(page)).toMatchAriaSnapshot(`
  - navigation "Project path":
    - list:
      - listitem:
        - link "Home":
          - /url: /fixture?from=home
          - strong: Home
      - listitem: Current document
      - listitem:
        - link "Added detail":
          - /url: "#details"
          - emphasis: Added detail
      - listitem:
        - link "Projects":
          - /url: "#overview"
      - listitem: Read-only label
	`);
	await page.keyboard.press(nextTab(browserName));
	const added = breadcrumbHost(page).getByRole('link', { name: 'Added detail', exact: true });
	await expect(added).toBeFocused();
	await added.press('Enter');
	await expect(page).toHaveURL(`${baseURL}/fixture?render=${mode}#details`);
	await expect(page.getByRole('heading', { name: 'Details destination' })).toBeInViewport();
	await breadcrumbHost(page).evaluate(host => host.querySelector('#breadcrumb-label')!.remove());
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(4);
	expect(errors).toEqual([]);
});

for (const mode of ['server', 'client']) test(`${mode} public breadcrumb hidden projection reveals the same native child and wrapper without stealing focus`, async ({ page, browserName }) => {
	const errors = recordErrors(page);
	await page.goto(`/fixture?render=${mode}&hidden=1`);
	if (mode === 'client') await page.evaluate(() => (window as any).startNavigationFixture());
	const projects = page.locator('#breadcrumb-projects');
	await expect(projects).toBeHidden();
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(2);
	await expect(breadcrumbs(page).locator('li > [aria-hidden="true"]:visible')).toHaveCount(1);
	await projects.evaluate(anchor => { (window as any).publicHiddenBreadcrumb = { anchor, wrapper: anchor.assignedSlot?.parentElement }; });
	if (mode === 'server') await page.evaluate(() => (window as any).startNavigationFixture());
	const home = breadcrumbHost(page).getByRole('link', { name: 'Home', exact: true });
	await home.focus();
	await projects.evaluate(anchor => { (anchor as HTMLElement).hidden = false; });
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(projects).toBeVisible();
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(3);
	await expect(breadcrumbs(page).locator('li > [aria-hidden="true"]:visible')).toHaveCount(2);
	expect(await projects.evaluate(anchor => anchor === (window as any).publicHiddenBreadcrumb.anchor && anchor.assignedSlot?.parentElement === (window as any).publicHiddenBreadcrumb.wrapper)).toBe(true);
	await expect(home).toBeFocused();
	await page.keyboard.press(nextTab(browserName));
	await expect(projects).toBeFocused();
	await home.focus();
	await projects.evaluate(anchor => { (anchor as HTMLElement).hidden = true; });
	await page.evaluate(() => (window as any).settleNavigationFixture());
	await expect(home).toBeFocused();
	await expect(breadcrumbs(page).getByRole('listitem')).toHaveCount(2);
	await page.keyboard.press(nextTab(browserName));
	await expect(page.getByRole('button', { name: 'After navigation', exact: true })).toBeFocused();
	expect(errors).toEqual([]);
});


for (const tag of ['en-breadcrumbs', 'en-navigation']) test(`authored rich ${tag} labels retain visible word spacing and wrap within their native anchor`, async ({ page }, testInfo) => {
	const errors = recordErrors(page);
	await start(page);
	await page.locator(tag).evaluate(host => {
		const anchor = document.createElement('a'); anchor.id = 'breadcrumb-rich'; anchor.href = '#details';
		anchor.style.inlineSize = '500px';
		const emphasis = document.createElement('em'); emphasis.textContent = 'workspace concepts and shared references';
		anchor.append(document.createTextNode('Projects '), emphasis);
		host.append(anchor);
		(window as any).richBreadcrumbNodes = { anchor, text: anchor.firstChild, emphasis };
	});
	await page.evaluate(() => (window as any).settleNavigationFixture());
	const anchor = page.locator('#breadcrumb-rich');
	await expect(anchor).toBeVisible();
	await expect(anchor).toHaveAccessibleName('Projects workspace concepts and shared references');
	const normal = await anchor.evaluate(element => {
		const project = document.createRange(); project.setStart(element.firstChild!, 0); project.setEnd(element.firstChild!, 8);
		const workspace = document.createRange(); workspace.setStart(element.querySelector('em')!.firstChild!, 0); workspace.setEnd(element.querySelector('em')!.firstChild!, 9);
		const first = project.getBoundingClientRect(); const second = workspace.getBoundingClientRect();
		return { gap: second.left - first.right, projectTop: first.top, workspaceTop: second.top, height: element.getBoundingClientRect().height };
	});
	// A flex formatting context would trim the anonymous item's trailing space.
	// Measure the actual glyph boxes, rather than assuming a display keyword.
	expect(normal.gap).toBeGreaterThan(1);
	expect(Math.abs(normal.projectTop - normal.workspaceTop)).toBeLessThan(3);
	await anchor.evaluate(element => { element.style.inlineSize = '145px'; });
	const narrow = await anchor.evaluate(element => {
		const range = document.createRange(); range.selectNodeContents(element.querySelector('em')!);
		const lines = [...range.getClientRects()].filter(rect => rect.width > 0);
		const box = element.getBoundingClientRect();
		const saved = (window as any).richBreadcrumbNodes;
		return {
			height: box.height,
			lineTops: [...new Set(lines.map(rect => Math.round(rect.top)))],
			within: lines.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1),
			noOverflow: element.scrollWidth <= element.clientWidth + 1,
			nodesRetained: element === saved.anchor && element.firstChild === saved.text && element.querySelector('em') === saved.emphasis,
		};
	});
	expect(narrow.lineTops.length).toBeGreaterThan(1);
	expect(narrow.height).toBeGreaterThan(normal.height);
	expect(narrow.within && narrow.noOverflow && narrow.nodesRetained).toBe(true);
	await testInfo.attach('rich-native-label-layout', { body: JSON.stringify({ tag, normal, narrow }), contentType: 'application/json' });
	expect(errors).toEqual([]);
});
