import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const exampleURL = '/api-examples/command-surfaces.html';
const tags = ['en-toolbar', 'en-menu', 'en-menu-item', 'en-command-palette'] as const;
const scene = (page: Page) => page.locator('[data-specimen="command-surfaces"]');
const settings = (page: Page) => page.locator('#settings');
const exactOpacity = (page: Page) => settings(page).getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
const frame = (page: Page) => page.frameLocator('.api-demo-frame');
const propertyRow = (page: Page, property: string) => page.locator('.api-element-controls').locator(`form[data-control="${property}"]`);
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = [];
	errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'No runtime errors during command-family consumption').toEqual([]); });

async function openExample(page: Page) {
	await page.goto(exampleURL);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(scene(page)).toBeVisible();
	await expect.poll(() => page.evaluate(names => names.every(tag => Boolean(customElements.get(tag))), tags)).toBe(true);
	await page.locator('en-api-example-app').evaluate(async app => {
		await (app as any).updateComplete;
		await Promise.all(Array.from(app.querySelectorAll('*'), child => (child as any).updateComplete));
	});
}
async function openSettings(page: Page) {
	await page.goto('/workflows/settings');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect(settings(page).locator('#settings-command-toolbar').getByRole('toolbar')).toBeVisible();
	await expect.poll(() => settings(page).locator('en-toolbar, en-menu, en-menu-item').evaluateAll(elements => elements.every(element => {
		const registry = 'customElementRegistry' in element ? (element as any).customElementRegistry : element.ownerDocument.defaultView!.customElements;
		const definition = registry?.get(element.localName);
		return Boolean(definition && element instanceof definition && (element as any).hasUpdated);
	}))).toBe(true);
	await expectDormantSettingsPalette(page);
}
async function expectDormantSettingsPalette(page: Page) {
	const palette = settings(page).locator('#settings-command-palette');
	await expect(palette).toHaveCount(1);
	expect(await palette.evaluate(element => {
		const registry = 'customElementRegistry' in element ? (element as any).customElementRegistry : element.ownerDocument.defaultView!.customElements;
		return !registry?.get(element.localName) && !('updateComplete' in element);
	})).toBe(true);
	// Code loading stays dormant while the closed SSR body is already present.
	const dialog = palette.locator('dialog');
	await expect(dialog).toHaveCount(1);
	await expect(dialog).not.toBeVisible();
	await expect(dialog).toHaveJSProperty('open', false);
	await expect(dialog).toHaveAttribute('inert', '');
	const input = palette.locator('input[role="combobox"]');
	await expect(input).toHaveCount(1);
	await expect(input).toHaveValue('');
	await expect(input).toHaveAttribute('aria-expanded', 'false');
	await expect(input).not.toHaveAttribute('aria-activedescendant');
	await expect(input).not.toBeFocused();
	await expect(palette.locator('[role="listbox"]')).toHaveCount(1);
	await expect(palette.locator('[role="option"]')).toHaveCount(4);
	await expect(palette.locator('[part~="status"]')).toHaveCount(1);
	await expect(palette.locator('[part~="status"]')).toBeEmpty();
}
async function chooseSettingsPalette(page: Page, query: string, command: string) {
	const palette = settings(page).locator('#settings-command-palette');
	const original = await palette.elementHandle();
	await settings(page).getByRole('button', { name: 'Search commands', exact: true }).click();
	await expect.poll(() => palette.evaluate((element, previous) => {
		const registry = 'customElementRegistry' in element ? (element as any).customElementRegistry : element.ownerDocument.defaultView!.customElements;
		const definition = registry?.get(element.localName);
		return Boolean(element === previous && definition && element instanceof definition && (element as any).hasUpdated);
	}, original)).toBe(true);
	await expect(palette.getByRole('dialog', { name: 'Settings commands', exact: true })).toBeVisible();
	await expect(palette.getByRole('combobox', { name: 'Find a settings command', exact: true })).toBeFocused();
	await palette.getByRole('combobox', { name: 'Find a settings command', exact: true }).fill(query);
	await palette.getByRole('option', { name: command, exact: true }).click();
}
async function applyProperty(page: Page, property: string) {
	await propertyRow(page, property).getByRole('button', { name: `Apply ${property}`, exact: true }).click();
	await expect(page.locator('.api-element-controls .api-controls-status')).toContainText(`${property} applied`);
}
async function showSimulation(page: Page) {
	const summary = settings(page).locator('summary').filter({ hasText: 'Settings simulation controls' });
	if (await summary.locator('..').getAttribute('open') === null) await summary.click();
	await settings(page).getByRole('combobox', { name: 'Settings response delivery', exact: true }).selectOption('held');
}
async function setOpacity(page: Page, value: string) {
	await exactOpacity(page).fill(value);
	await exactOpacity(page).press('Enter');
}

test('command example SSR exposes authored toolbar buttons while menu and palette remain closed without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(exampleURL);
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		await expect(scene(page)).toBeVisible();
		const toolbar = page.locator('#specimen-toolbar');
		await expect(toolbar.getByRole('toolbar')).toBeVisible();
		await expect(toolbar.getByRole('button', { name: 'Portrait', exact: true })).toBeVisible();
		await expect(toolbar.getByRole('button', { name: 'Landscape', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'More layout actions', exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Search layout commands', exact: true })).toBeVisible();
		await expect(page.locator('#specimen-menu').getByRole('menu')).not.toBeVisible();
		await expect(page.locator('#specimen-command-palette').getByRole('dialog')).not.toBeVisible();
		await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Portrait.');
	} finally { await context.close(); }
});

test('delayed command hydration retains the same authored toolbar, native button, shadow root and keyboard focus', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	let waiting = 0;
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') { waiting++; await gate; }
		await route.continue();
	});
	try {
		await page.goto(exampleURL, { waitUntil: 'commit' });
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		const toolbar = page.locator('#specimen-toolbar');
		const portrait = toolbar.getByRole('button', { name: 'Portrait', exact: true });
		await expect(portrait).toBeVisible();
		await expect.poll(() => waiting).toBeGreaterThan(0);
		await portrait.focus();
		const identity = await portrait.evaluateHandle(button => ({
			button, root: button.getRootNode(), toolbar: document.getElementById('specimen-toolbar'),
		}));
		release();
		await expect.poll(() => page.evaluate(names => names.every(tag => Boolean(customElements.get(tag))), tags)).toBe(true);
		await page.locator('en-api-example-app').evaluate(async app => {
			await (app as any).updateComplete;
			await Promise.all(Array.from(app.querySelectorAll('*'), child => (child as any).updateComplete));
		});
		await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect(portrait).toBeFocused();
		expect(await portrait.evaluate((button, saved) => ({
			button: button === saved.button, root: button.getRootNode() === saved.root,
			toolbar: document.getElementById('specimen-toolbar') === saved.toolbar,
		}), identity)).toEqual({ button: true, root: true, toolbar: true });
		await portrait.press('ArrowRight');
		const landscape = toolbar.getByRole('button', { name: 'Landscape', exact: true });
		await expect(landscape).toBeFocused();
		await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Portrait.');
		await landscape.press('Enter');
		await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Landscape.');
		await identity.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

const targets = [
	{ tag: 'en-toolbar', id: 'specimen-toolbar', property: 'orientation' },
	{ tag: 'en-menu', id: 'specimen-menu', property: 'open' },
	{ tag: 'en-menu-item', id: 'specimen-menu-item', property: 'disabled' },
	{ tag: 'en-command-palette', id: 'specimen-command-palette', property: 'open' },
] as const;
for (const target of targets) {
	test(`API ${target.tag} binds its exact authored target and edits public ${target.property} inside the isolated document`, async ({ page }) => {
		await page.goto(`/api-reference?component=${target.tag}`);
		await expect(page.getByRole('heading', { name: target.tag, exact: true })).toBeVisible();
		const iframe = page.locator('.api-demo-frame');
		await expect(iframe).toHaveAttribute('data-example-id', 'command-surfaces');
		await expect(iframe).toHaveAttribute('data-component-tag', target.tag);
		await iframe.scrollIntoViewIfNeeded();
		await expect(iframe).toHaveAttribute('data-example-ready', 'true');
		await expect(page.locator('.api-element-controls').getByRole('button', { name: 'Refresh values', exact: true })).toBeEnabled();
		const host = frame(page).locator(`#${target.id}`);
		await expect(host).toHaveCount(1);
		const original = await host.elementHandle();
		if (target.property === 'orientation') {
			await propertyRow(page, target.property).getByRole('combobox', { name: target.property, exact: true }).selectOption({ label: 'vertical' });
		} else {
			await propertyRow(page, target.property).getByRole('checkbox', { name: target.property, exact: true }).check();
		}
		await applyProperty(page, target.property);
		await expect(host).toHaveJSProperty(target.property, target.property === 'orientation' ? 'vertical' : true);
		expect(await host.evaluate((element, saved) => element === saved, original)).toBe(true);
		if (target.tag === 'en-toolbar') await expect(host.getByRole('toolbar')).toHaveAttribute('aria-orientation', 'vertical');
		if (target.tag === 'en-menu') await expect(host.getByRole('menu')).toBeVisible();
		if (target.tag === 'en-menu-item') {
			await frame(page).getByRole('button', { name: 'More layout actions', exact: true }).click();
			await expect(host.getByRole('menuitem', { name: 'Portrait', exact: true })).toHaveAttribute('aria-disabled', 'true');
			await expect(frame(page).locator('#specimen-menu').getByRole('menuitem', { name: 'Landscape', exact: true })).not.toHaveAttribute('aria-disabled', 'true');
		}
		if (target.tag === 'en-command-palette') {
			const dialog = host.getByRole('dialog', { name: 'Study commands', exact: true });
			await expect(dialog).toBeVisible();
			expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
			await expect(propertyRow(page, 'commands')).toHaveCount(0);
		}
		expect(await page.evaluate(names => names.every(tag => customElements.get(tag) === undefined), tags)).toBe(true);
		expect(await frame(page).locator('html').evaluate((_html, names) => names.every(tag => Boolean(customElements.get(tag))), tags)).toBe(true);
	});
}

test('authored action menu executes one command and advertises unavailable actions without turning them into choices', async ({ page }) => {
	await openExample(page);
	await scene(page).evaluate(element => {
		(window as any).studyActions = [];
		element.addEventListener('en-action', event => (window as any).studyActions.push((event as CustomEvent).detail.action));
	});
	const trigger = scene(page).getByRole('button', { name: 'More layout actions', exact: true });
	await trigger.focus(); await trigger.press('Enter');
	const menu = page.locator('#specimen-menu');
	await expect(menu.getByRole('menu')).toBeVisible();
	await expect(menu.getByRole('menuitem', { name: 'Publish study', exact: true })).toHaveAttribute('aria-disabled', 'true');
	await expect(menu.getByRole('option')).toHaveCount(0);
	await expect(menu.getByRole('radio')).toHaveCount(0);
	await menu.getByRole('menuitem', { name: 'Landscape', exact: true }).click();
	await expect(menu).toHaveJSProperty('open', false);
	await expect(menu.getByRole('menu')).not.toBeVisible();
	await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Landscape.');
	await expect(page.locator('[data-command-preview]')).toHaveAttribute('data-layout', 'landscape');
	expect(await scene(page).evaluate(() => (window as any).studyActions)).toEqual(['study.landscape']);
	await expect(trigger).toBeFocused();
});

test('authored palette has true modal search semantics, preserves an empty query result and executes only an explicit choice', async ({ page }) => {
	await openExample(page);
	const palette = page.locator('#specimen-command-palette');
	const trigger = scene(page).getByRole('button', { name: 'Search layout commands', exact: true });
	await trigger.focus(); await trigger.press('Enter');
	const dialog = palette.getByRole('dialog', { name: 'Study commands', exact: true });
	const search = palette.getByRole('combobox', { name: 'Find a layout command', exact: true });
	await expect(dialog).toBeVisible();
	expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
	await expect(search).toBeFocused();
	await expect(palette.getByRole('menu')).toHaveCount(0);
	await search.fill('not-a-layout');
	await expect(search).toHaveValue('not-a-layout');
	await expect(palette.getByText('No matching layout commands.', { exact: true })).toBeVisible();
	await expect(palette.getByRole('option')).toHaveCount(0);
	await search.press('Enter');
	await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Portrait.');
	await expect(dialog).toBeVisible();
	await search.fill('landscape');
	await expect(palette.getByRole('option', { name: 'Landscape', exact: true })).toBeVisible();
	await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Portrait.');
	await palette.getByRole('option', { name: 'Landscape', exact: true }).click();
	await expect(dialog).not.toBeVisible();
	await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Landscape.');
	await expect(trigger).toBeFocused();
});

test('Settings toolbar, menu and palette restore the same scoped value without overwriting other settings', async ({ page }) => {
	await openSettings(page);
	await settings(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
	for (const surface of ['toolbar', 'menu', 'palette']) {
		await setOpacity(page, '72');
		await expect(settings(page).locator('[data-settings-current]')).toHaveText('72% opacity · SVG · Portrait · Background included');
		if (surface === 'toolbar') {
			await settings(page).locator('#settings-command-toolbar').getByRole('button', { name: 'Restore saved opacity', exact: true }).click();
		} else if (surface === 'menu') {
			await settings(page).getByRole('button', { name: 'More settings actions', exact: true }).click();
			await settings(page).locator('#settings-command-menu').getByRole('menuitem', { name: 'Restore saved opacity', exact: true }).click();
		} else await chooseSettingsPalette(page, 'restore', 'Restore saved opacity');
		await expect(exactOpacity(page)).toHaveValue('64');
		await expect(settings(page).locator('[data-settings-current]')).toHaveText('64% opacity · SVG · Portrait · Background included');
		await expect(settings(page).locator('[data-settings-saved]')).toHaveText('64% opacity · PNG · Portrait · Background included');
		await expect(settings(page).locator('#settings-command-menu')).toHaveJSProperty('open', false);
		if (surface === 'palette') await expect(settings(page).locator('#settings-command-palette')).toHaveJSProperty('open', false);
		else await expectDormantSettingsPalette(page);
	}
});

test('Settings palette Save closes before validation focuses the existing invalid exact editor and never queues a save', async ({ page }) => {
	await openSettings(page);
	await showSimulation(page);
	await exactOpacity(page).fill('101');
	await chooseSettingsPalette(page, 'save', 'Save settings');
	await expect(settings(page).locator('#settings-command-palette')).toHaveJSProperty('open', false);
	await expect(exactOpacity(page)).toBeFocused();
	await expect(exactOpacity(page)).toHaveValue('101');
	await expect(exactOpacity(page)).toHaveAttribute('aria-invalid', 'true');
	await expect(settings(page).locator('[data-settings-saved]')).toHaveText('64% opacity · PNG · Portrait · Background included');
	await expect(settings(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
	expect(await settings(page).getByRole('form', { name: 'Creative output settings', exact: true }).evaluate(form => new FormData(form as HTMLFormElement).get('opacity'))).toBe('64');
	await expect(settings(page).getByRole('button', { name: 'Search commands', exact: true })).not.toBeFocused();
});

for (const veto of ['action', 'close'] as const) {
	test(`Settings preserves its draft and does not execute when a late ancestor vetoes command ${veto}`, async ({ page }) => {
		await openSettings(page);
		await setOpacity(page, '72');
		await settings(page).evaluate((element, veto) => {
			const cancellation = new AbortController();
			(window as any).commandVeto = cancellation;
			const palette = element.querySelector('#settings-command-palette');
			element.ownerDocument.addEventListener(veto === 'action' ? 'en-action' : 'en-change', event => {
				if (event.target !== palette) return;
				if (veto === 'action' || (event as CustomEvent).detail.proposed === false) event.preventDefault();
			}, { signal: cancellation.signal });
		}, veto);
		await chooseSettingsPalette(page, 'restore', 'Restore saved opacity');
		const palette = settings(page).locator('#settings-command-palette');
		await expect(palette).toHaveJSProperty('open', true);
		await expect(palette.getByRole('dialog', { name: 'Settings commands', exact: true })).toBeVisible();
		await expect(exactOpacity(page)).toHaveValue('72');
		await expect(settings(page).locator('[data-settings-current]')).toHaveText('72% opacity · PNG · Portrait · Background included');
		await page.evaluate(() => (window as any).commandVeto.abort());
		await palette.getByRole('option', { name: 'Restore saved opacity', exact: true }).click();
		await expect(palette).toHaveJSProperty('open', false);
		await expect(exactOpacity(page)).toHaveValue('64');
	});
}

test.describe('narrow command documentation', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
	test('visible openers and modal search remain usable without horizontal document overflow', async ({ page, browserName }, info) => {
		// This Firefox driver's emulated tap emits pointerdown/up on a slotted
		// button without a compatibility click. Preserve narrow pointer coverage;
		// Chromium/WebKit execute trusted taps. Do not invent pointerup activation.
		const activate = (control: Locator) => browserName === 'firefox' ? control.click() : control.tap();
		info.annotations.push({ type: 'interaction-scope', description: browserName === 'firefox'
			? 'Narrow Firefox mouse interaction; emulated slotted-button tap does not generate click. Not touch acceptance.'
			: 'Trusted tap with desktop-engine touch emulation; not physical-device acceptance.' });
		await openExample(page);
		const menuTrigger = scene(page).getByRole('button', { name: 'More layout actions', exact: true });
		await activate(menuTrigger);
		await activate(page.locator('#specimen-menu').getByRole('menuitem', { name: 'Landscape', exact: true }));
		await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Landscape.');
		await activate(scene(page).getByRole('button', { name: 'Search layout commands', exact: true }));
		const palette = page.locator('#specimen-command-palette');
		const dialog = palette.getByRole('dialog', { name: 'Study commands', exact: true });
		const search = palette.getByRole('combobox', { name: 'Find a layout command', exact: true });
		await search.fill('portrait');
		await expect(search).toBeFocused();
		const bounds = (await dialog.boundingBox())!;
		expect(bounds.x).toBeGreaterThanOrEqual(-1);
		expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
		const result = await new AxeBuilder({ page }).include('#specimen-command-palette').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
		await info.attach('command-palette-accessibility', { body: JSON.stringify(result), contentType: 'application/json' });
		expect(result.violations).toEqual([]);
		await activate(palette.getByRole('option', { name: 'Portrait', exact: true }));
		await expect(dialog).not.toBeVisible();
		await expect(page.locator('[data-command-result]')).toHaveText('Preview layout: Portrait.');
	});
});

async function mountMixedToolbar(page: Page, mode: 'auto' | 'tab' = 'tab') {
	await openExample(page);
	await page.evaluate(async keyboard => {
		const fixture = document.createElement('section');
		fixture.id = 'mixed-toolbar-test';
		fixture.innerHTML = `<button type="button" id="mixed-before">Before mixed group</button>
			<en-toolbar label="Mixed editing" keyboard-navigation="${keyboard}">
				<en-button id="mixed-save">Save mixed settings</en-button>
				<label>Layer query <input id="mixed-query" value="Landscape"></label>
				<label>Layer kind <select id="mixed-kind"><option>Image</option><option>Text</option></select></label>
				<label>Layer count <input id="mixed-count" type="number" value="2"></label>
				<button type="button" disabled>Unavailable mixed action</button>
				<button type="button" id="mixed-apply">Apply mixed settings</button>
			</en-toolbar><button type="button" id="mixed-after">After mixed group</button>`;
		document.body.append(fixture);
		await Promise.all(Array.from(fixture.querySelectorAll('*'), child => (child as any).updateComplete));
	}, mode);
	return page.locator('#mixed-toolbar-test');
}

for (const mode of ['auto', 'tab'] as const) {
	test(`mixed toolbar ${mode} preserves ordinary Tab order, selection keys and native editing`, async ({ page, browserName }) => {
		const fixture = await mountMixedToolbar(page, mode);
		const group = fixture.getByRole('group', { name: 'Mixed editing', exact: true });
		await expect(group).toBeVisible();
		await expect(fixture.getByRole('toolbar')).toHaveCount(0);
		await fixture.getByRole('button', { name: 'Before mixed group' }).focus();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(fixture.getByRole('button', { name: 'Save mixed settings' })).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		const query = fixture.getByRole('textbox', { name: 'Layer query' });
		await expect(query).toBeFocused();
		await query.fill('Landscape');
		await query.press('ArrowLeft');
		expect(await query.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(8);
		await query.press('Shift+ArrowLeft');
		expect(await query.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd])).toEqual([7, 8]);
		// Home/End are platform-specific editing commands on macOS. Assert the
		// group does not prevent them, rather than imposing Windows caret rules.
		await query.evaluate(input => {
			(window as any).mixedEndpointKeys = [];
			input.addEventListener('keydown', event => { if (event.key === 'Home' || event.key === 'End') (window as any).mixedEndpointKeys.push([event.key, event.defaultPrevented]); });
		});
		await query.press('Home');
		await expect(query).toBeFocused();
		await query.press('End');
		await expect(query).toBeFocused();
		expect(await page.evaluate(() => (window as any).mixedEndpointKeys)).toEqual([['Home', false], ['End', false]]);
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(fixture.getByRole('combobox', { name: 'Layer kind' })).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		const count = fixture.getByRole('spinbutton', { name: 'Layer count' });
		await expect(count).toBeFocused();
		await count.press('ArrowUp');
		await expect(count).toHaveValue('3');
		await expect(count).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(fixture.getByRole('button', { name: 'Apply mixed settings' })).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		await expect(fixture.getByRole('button', { name: 'After mixed group' })).toBeFocused();
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
		await expect(fixture.getByRole('button', { name: 'Apply mixed settings' })).toBeFocused();
	});
}

test('explicit mixed toolbar keeps vertical and RTL editing native without changing its control nodes', async ({ page, browserName }) => {
	const fixture = await mountMixedToolbar(page);
	const toolbar = fixture.locator('en-toolbar');
	const query = fixture.getByRole('textbox', { name: 'Layer query' });
	const node = await query.elementHandle();
	await query.focus();
	await toolbar.evaluate(async element => {
		element.setAttribute('orientation', 'vertical');
		element.setAttribute('dir', 'rtl');
		await (element as any).updateComplete;
	});
	await expect(query).toBeFocused();
	expect(await query.evaluate((input, original) => input === original, node)).toBe(true);
	await expect(toolbar.getByRole('group')).not.toHaveAttribute('aria-orientation');
	await expect(toolbar.getByRole('group')).toHaveAttribute('data-orientation', 'vertical');
	const count = fixture.getByRole('spinbutton', { name: 'Layer count' });
	await count.focus();
	await count.press('ArrowDown');
	await expect(count).toHaveValue('1');
	await expect(count).toBeFocused();
	await count.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(fixture.getByRole('button', { name: 'Apply mixed settings' })).toBeFocused();
});

test('automatic toolbar releases and restores roving ownership as authored interactive content changes', async ({ page, browserName }) => {
	await openExample(page);
	await page.evaluate(async () => {
		const toolbar = document.createElement('en-toolbar');
		toolbar.id = 'dynamic-toolbar-test';
		toolbar.setAttribute('label', 'Dynamic editing');
		toolbar.innerHTML = '<button type="button">First dynamic action</button><en-button>Second dynamic action</en-button><button type="button" tabindex="-1">Third dynamic action</button>';
		document.body.append(toolbar);
		await (toolbar as any).updateComplete;
	});
	const toolbar = page.locator('#dynamic-toolbar-test');
	const first = toolbar.getByRole('button', { name: 'First dynamic action' });
	const second = toolbar.getByRole('button', { name: 'Second dynamic action' });
	const third = toolbar.getByRole('button', { name: 'Third dynamic action' });
	await first.focus();
	await first.press('ArrowRight');
	await expect(second).toBeFocused();
	await toolbar.evaluate(element => element.insertAdjacentHTML('beforeend', '<label id="dynamic-field">Dynamic query <input value="Edit me"></label>'));
	await expect(toolbar.getByRole('group', { name: 'Dynamic editing' })).toBeVisible();
	await expect(second).toBeFocused();
	await expect(first).not.toHaveAttribute('tabindex');
	await expect(third).toHaveAttribute('tabindex', '-1');
	await second.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(toolbar.getByRole('textbox', { name: 'Dynamic query' })).toBeFocused();
	await second.focus();
	await toolbar.locator('#dynamic-field').evaluate(element => element.remove());
	await expect(toolbar.getByRole('toolbar')).toBeVisible();
	await expect(second).toBeFocused();
	await second.press('ArrowRight');
	await expect(third).toBeFocused();
	await toolbar.evaluate(element => element.setAttribute('keyboard-navigation', 'tab'));
	await expect(toolbar.getByRole('group')).toBeVisible();
	await expect(third).toBeFocused();
	await expect(third).toHaveAttribute('tabindex', '-1');
});

test('automatic toolbar conservatively leaves unknown private controls and nested interactive wrappers in native order', async ({ page, browserName }) => {
	await openExample(page);
	await page.evaluate(async () => {
		customElements.define('test-private-toolbar-control', class extends HTMLElement {
			constructor() { super(); this.attachShadow({ mode: 'open' }).innerHTML = '<label>Private query <input></label>'; }
		});
		const toolbar = document.createElement('en-toolbar');
		toolbar.id = 'private-toolbar-test';
		toolbar.setAttribute('label', 'Private editing');
		toolbar.innerHTML = '<en-button>Before private query</en-button><test-private-toolbar-control></test-private-toolbar-control><span><button type="button">Wrapped action</button></span>';
		document.body.append(toolbar);
		await (toolbar as any).updateComplete;
	});
	const toolbar = page.locator('#private-toolbar-test');
	await expect(toolbar.getByRole('group', { name: 'Private editing' })).toBeVisible();
	await toolbar.getByRole('button', { name: 'Before private query' }).focus();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(toolbar.getByRole('textbox', { name: 'Private query' })).toBeFocused();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(toolbar.getByRole('button', { name: 'Wrapped action' })).toBeFocused();
});
