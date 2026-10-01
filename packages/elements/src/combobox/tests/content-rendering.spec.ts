import { expect, test, type Page } from '@playwright/test';

const host = (page: Page) => page.locator('#eager-active');
const input = (page: Page) => host(page).getByRole('combobox', { name: 'Active asset', exact: true });
const rows = (page: Page) => host(page).locator('[role="option"]');
const unusedRows = (page: Page) => page.locator('#eager-unused').locator('[role="option"]');
const changes = (page: Page) => page.evaluate(() => (window as any).eagerCombobox.changes);
const accepted = (page: Page) => page.locator('#eager-form').evaluate(form => new FormData(form as HTMLFormElement).get('eager-active'));
const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const errors: string[] = []; runtimeErrors.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
	page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	await page.goto('/fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	// Configure every fresh instance before it connects or performs its first update.
	await page.evaluate(async () => {
		const form = document.createElement('form'); form.id = 'eager-form';
		const fields = document.createElement('fieldset'); form.append(fields);
		for (const [id, label] of [['eager-reference', 'Eager asset'], ['eager-active', 'Active asset'], ['eager-unused', 'Unused asset']]) {
			const field = document.createElement('en-combobox') as any;
			field.id = id; field.name = id; field.label = label;
			field.description = 'Choose a catalog asset.';
			field.items = (window as any).comboboxFixture.options;
			field.defaultValue = 'forest'; field.value = 'forest'; field.required = true;
			fields.append(field);
		}
		const reset = document.createElement('button'); reset.type = 'reset'; reset.textContent = 'Reset eager assets';
		form.append(reset);
		document.querySelector('main')!.prepend(form);
		const active = form.querySelector('#eager-active') as any;
		const changes: unknown[] = [];
		active.addEventListener('en-change', (event: CustomEvent) => changes.push({
			detail: event.detail, value: active.value, form: new FormData(form).get('eager-active'),
			cancelable: event.cancelable,
		}));
		(window as any).eagerCombobox = { changes };
		await (window as any).comboboxFixture.settle();
	});
	info.annotations.push({ type: 'coverage', description: 'Fresh native-module consumer instances use eager rows and independent query, selection and popup state.' });
});

test.afterEach(async ({ page }, info) => {
	const errors = runtimeErrors.get(page) ?? [];
	if (errors.length) await info.attach('runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
	expect(errors).toEqual([]);
});

test('eager rows coexist across independent fields with complete native shells', async ({ page }) => {
	await expect(page.locator('#eager-reference').locator('[role="option"]')).toHaveCount(4);
	await expect(rows(page)).toHaveCount(4);
	await expect(unusedRows(page)).toHaveCount(4);
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAccessibleDescription('Choose a catalog asset.');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(host(page).getByRole('button', { name: 'Show options' })).toBeVisible();
	await expect(host(page).locator('[role="listbox"]')).toHaveCount(1);
	expect(await input(page).evaluate(element => {
		const root = element.getRootNode() as ShadowRoot;
		return root.querySelector('#listbox')?.getRootNode() === root;
	})).toBe(true);
	expect(await accepted(page)).toBe('forest');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(true);
	await input(page).focus();
	await expect(input(page)).toBeFocused();
	await expect(rows(page)).toHaveCount(4);
});

for (const firstUse of ['ArrowDown', 'ArrowUp', 'typing', 'pointer'] as const) {
	test(`${firstUse} opens suggestions and preserves the editor and keyed rows on reopen`, async ({ page }) => {
		const originalInput = await input(page).elementHandle();
		if (firstUse === 'typing') await input(page).fill('Sunset');
		else if (firstUse === 'pointer') await host(page).getByRole('button', { name: 'Show options' }).click();
		else await input(page).press(firstUse);
		await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
		await expect(rows(page)).toHaveCount(firstUse === 'typing' ? 1 : 4);
		if (firstUse === 'ArrowDown' || firstUse === 'ArrowUp') {
			const active = await input(page).getAttribute('aria-activedescendant');
			expect(active).toBeTruthy();
			await expect(host(page).locator(`[id="${active}"][role="option"]`)).toBeVisible();
		}
		const sunset = host(page).getByRole('option', { name: 'Sunset study', exact: true });
		const originalRow = await sunset.elementHandle();
		await input(page).press('Escape');
		await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
		await expect(input(page)).not.toHaveAttribute('aria-activedescendant');
		await expect(input(page)).toHaveValue('Forest canvas');
		await expect(rows(page)).toHaveCount(4);
		await expect(host(page).locator('[part~="popup"]')).toHaveAttribute('inert', '');
		expect(await host(page).locator('[data-value="sunset"]').evaluate((element, original) => element === original, originalRow)).toBe(true);
		await host(page).getByRole('button', { name: 'Show options' }).click();
		await expect(sunset).toBeVisible();
		expect(await sunset.evaluate((element, original) => element === original, originalRow)).toBe(true);
		expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
		await expect(input(page)).toBeFocused();
		await expect(unusedRows(page)).toHaveCount(4);
		expect(await changes(page)).toEqual([]);
	});
}

for (const flush of [false, true]) {
	test(`an authoritative same-value close ${flush ? 'after' : 'before'} a forced opening render preserves eager rows and closes suggestions`, async ({ page }) => {
		await input(page).focus();
		await host(page).evaluate(async (element, flush) => {
			const field = element as any;
			const control = element.shadowRoot!.querySelector('input')!;
			control.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
			if (flush) field.performUpdate();
			field.value = field.value;
			await field.updateComplete;
		}, flush);
		await expect(rows(page)).toHaveCount(4);
		await expect(input(page)).toHaveValue('Forest canvas');
		await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
		await expect(input(page)).toBeFocused();
		expect(await accepted(page)).toBe('forest');
		expect(await changes(page)).toEqual([]);
		await expect(unusedRows(page)).toHaveCount(4);
	});
}

test('a reset supersedes opening before its render without accepting a query', async ({ page }) => {
	await input(page).focus();
	await host(page).evaluate(async element => {
		const field = element as any;
		const control = element.shadowRoot!.querySelector('input')!;
		control.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
		field.form.reset();
		await field.updateComplete;
	});
	await expect(rows(page)).toHaveCount(4);
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toBe('forest');
	expect(await changes(page)).toEqual([]);
});

test('an unrelated update preserves eager rows and their identity', async ({ page }) => {
	await expect(rows(page)).toHaveCount(4);
	const originalRow = await host(page).locator('[data-value="forest"]').elementHandle();
	await host(page).evaluate(element => { (element as any).description = 'Updated catalog guidance.'; });
	await expect(rows(page)).toHaveCount(4);
	expect(await host(page).locator('[data-value="forest"]').evaluate((element, original) => element === original, originalRow)).toBe(true);
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(unusedRows(page)).toHaveCount(4);
	expect(await changes(page)).toEqual([]);
});

test('an authoritative en-input write and synchronous performUpdate preserve the closed list', async ({ page }) => {
	const originalInput = await input(page).elementHandle();
	await host(page).evaluate(element => element.addEventListener('en-input', () => {
		const field = element as any;
		field.value = 'fjord';
		field.performUpdate();
	}, { once: true }));
	await input(page).fill('Sunset');
	await expect(input(page)).toHaveValue('Fjord study');
	await expect(rows(page)).toHaveCount(4);
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
	expect(await accepted(page)).toBe('fjord');
	expect(await changes(page)).toEqual([]);
});

for (const policy of ['cancel', 'accept-staged'] as const) {
	test(`${policy} selection with synchronous performUpdate preserves draft and form authority`, async ({ page }) => {
		await host(page).evaluate((element, policy) => element.addEventListener('en-change', event => {
			event.preventDefault();
			const field = element as any;
			if (policy === 'accept-staged') field.value = field.value;
			field.requestUpdate(); field.performUpdate();
		}, { once: true }), policy);
		await input(page).fill('Sunset');
		await input(page).evaluate(element => (element as HTMLInputElement).setSelectionRange(1, 4));
		await host(page).getByRole('option', { name: 'Sunset study', exact: true }).click();
		const acceptedValue = policy === 'cancel' ? 'forest' : 'sunset';
		await expect(host(page)).toHaveJSProperty('value', acceptedValue);
		expect(await accepted(page)).toBe(acceptedValue);
		await expect(input(page)).toHaveValue(policy === 'cancel' ? 'Sunset' : 'Sunset study');
		await expect(input(page)).toHaveAttribute('aria-expanded', String(policy === 'cancel'));
		await expect(input(page)).toBeFocused();
		if (policy === 'cancel') {
			expect(await input(page).evaluate(element => ({ start: (element as HTMLInputElement).selectionStart, end: (element as HTMLInputElement).selectionEnd })))
				.toEqual({ start: 1, end: 4 });
			await input(page).press('Escape');
			await expect(input(page)).toHaveValue('Forest canvas');
		}
		await expect(rows(page)).toHaveCount(4);
		expect(await changes(page)).toEqual([{
			detail: { previous: 'forest', proposed: 'sunset', reason: 'select' }, value: 'sunset', form: 'sunset', cancelable: true,
		}]);
		await expect(unusedRows(page)).toHaveCount(4);
	});
}

test('eager rows keep normal keyed catalog reconciliation while the native editor stays stable', async ({ page }) => {
	const originalInput = await input(page).elementHandle();
	await host(page).getByRole('button', { name: 'Show options' }).click();
	const originalForest = await host(page).getByRole('option', { name: 'Forest canvas', exact: true }).elementHandle();
	await input(page).press('Escape');
	await host(page).evaluate(element => {
		const field = element as any;
		field.items = [...field.items].reverse().map(item => item.value === 'forest' ? { ...item, label: 'Renamed forest' } : item);
	});
	await expect(input(page)).toHaveValue('Renamed forest');
	await expect(rows(page)).toHaveCount(4);
	expect(await host(page).locator('[data-value="forest"]').evaluate((element, original) => element === original, originalForest)).toBe(true);
	await host(page).evaluate(element => {
		const field = element as any;
		field.items = field.items.filter((item: any) => item.value !== 'forest');
	});
	await expect(rows(page)).toHaveCount(3);
	await expect(input(page)).toHaveValue('Renamed forest');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await accepted(page)).toBe('forest');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(false);
	expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
	await expect(unusedRows(page)).toHaveCount(4);
});

test('reset, read-only and disabled fieldsets preserve eager rows and accepted form ownership', async ({ page }) => {
	const originalInput = await input(page).elementHandle();
	await host(page).evaluate(element => { (element as any).value = 'sunset'; });
	await expect(input(page)).toHaveValue('Sunset study');
	await page.getByRole('button', { name: 'Reset eager assets', exact: true }).click();
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(rows(page)).toHaveCount(4);
	await host(page).evaluate(element => { (element as any).readOnly = true; });
	await input(page).press('ArrowDown');
	await input(page).press('f');
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(rows(page)).toHaveCount(4);
	await expect(host(page).getByRole('button', { name: 'Show options' })).toBeDisabled();
	await page.locator('#eager-form fieldset').evaluate(element => { (element as HTMLFieldSetElement).disabled = true; });
	await expect(input(page)).toBeDisabled();
	expect(await accepted(page)).toBeNull();
	await page.locator('#eager-form fieldset').evaluate(element => { (element as HTMLFieldSetElement).disabled = false; });
	await host(page).evaluate(element => { (element as any).readOnly = false; });
	await input(page).fill('Sunset');
	await host(page).getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
	await page.getByRole('button', { name: 'Reset eager assets', exact: true }).click();
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(rows(page)).toHaveCount(4);
	expect(await accepted(page)).toBe('forest');
	expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
	await expect(unusedRows(page)).toHaveCount(4);
});

test('synthetic composition preserves the editor and defers filtering, opening and acceptance', async ({ page }, info) => {
	const originalInput = await input(page).elementHandle();
	await input(page).focus();
	await input(page).evaluate(element => {
		element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true, data: '' }));
		(element as HTMLInputElement).value = 'Fjord';
		element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'Fjord', inputType: 'insertCompositionText', isComposing: true }));
	});
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(rows(page)).toHaveCount(4);
	await expect(input(page)).toHaveValue('Fjord');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(input(page)).not.toHaveAttribute('aria-activedescendant');
	expect(await accepted(page)).toBe('forest');
	expect(await changes(page)).toEqual([]);
	await input(page).evaluate(element => {
		element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: 'Fjord' }));
		element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'Fjord', inputType: 'insertFromComposition', isComposing: false }));
	});
	await expect(host(page).getByRole('option', { name: 'Fjord study', exact: true })).toBeVisible();
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'fjord');
	expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
	await expect(unusedRows(page)).toHaveCount(4);
	info.annotations.push({ type: 'coverage-limit', description: 'Synthetic composition events cover state transitions; no operating-system IME or candidate window is driven.' });
});

test('first use in a narrow RTL viewport presents options without moving native editor focus', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('html').evaluate(element => element.setAttribute('dir', 'rtl'));
	await expect(input(page)).toHaveCSS('direction', 'rtl');
	await input(page).fill('Fjord');
	await expect(host(page).getByRole('option', { name: 'Fjord study', exact: true })).toBeVisible();
	const box = await host(page).locator('[part~="popup"]').boundingBox();
	expect(box).not.toBeNull();
	expect(box!.x).toBeGreaterThanOrEqual(-1);
	expect(box!.x + box!.width).toBeLessThanOrEqual(391);
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'fjord');
	await expect(input(page)).toBeFocused();
	await expect(unusedRows(page)).toHaveCount(4);
});

for (const opened of [false, true]) {
	test(`disconnect and reconnect preserve ${opened ? 'opened' : 'unused'} instance state`, async ({ page }) => {
		const originalInput = await input(page).elementHandle();
		if (opened) {
			await host(page).getByRole('button', { name: 'Show options' }).click();
			await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
		}
		await host(page).evaluate(async element => {
			const parent = element.parentElement!;
			element.remove(); parent.append(element);
			await (element as any).updateComplete;
		});
		await expect(rows(page)).toHaveCount(4);
		await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
		expect(await input(page).evaluate((element, original) => element === original, originalInput)).toBe(true);
		await input(page).press('ArrowDown');
		await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
		await input(page).press('ArrowDown');
		await input(page).press('Enter');
		await expect(host(page)).toHaveJSProperty('value', 'fjord');
		await expect(unusedRows(page)).toHaveCount(4);
	});
}

test('disconnect before a pending opening render cancels the opening until fresh interaction', async ({ page }) => {
	await input(page).focus();
	const disconnected = await host(page).evaluate(async element => {
		const field = element as any;
		const parent = element.parentElement!;
		const control = element.shadowRoot!.querySelector('input')!;
		control.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }));
		element.remove();
		field.performUpdate(); await field.updateComplete;
		const result = { rows: element.shadowRoot!.querySelectorAll('[role="option"]').length, expanded: control.getAttribute('aria-expanded') };
		parent.append(element); await field.updateComplete;
		return result;
	});
	expect(disconnected).toEqual({ rows: 4, expanded: 'false' });
	await expect(rows(page)).toHaveCount(4);
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await input(page).press('ArrowDown');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(rows(page)).toHaveCount(4);
	await expect(unusedRows(page)).toHaveCount(4);
	expect(await changes(page)).toEqual([]);
});

for (const opened of [false, true]) test(`adoption preserves ${opened ? 'opened' : 'unused'} instance rows and uses the destination document for interaction`, async ({ page }) => {
	if (opened) {
		await host(page).getByRole('button', { name: 'Show options' }).click();
		await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	}
	await page.evaluate(async () => {
		const field = document.querySelector('#eager-active') as any;
		const originalInput = field.shadowRoot.querySelector('input');
		const originalRow = field.shadowRoot.querySelector('[data-value="sunset"]');
		const frame = document.createElement('iframe'); frame.id = 'eager-destination';
		frame.style.cssText = 'width: 650px; height: 450px; border: 0';
		const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), { once: true }));
		frame.srcdoc = '<!doctype html><html lang="en"><head><title>Adopted picker</title></head><body><button id="outside" type="button">Outside adopted picker</button></body></html>';
		document.querySelector('main')!.prepend(frame); await loaded;
		frame.contentDocument!.body.append(frame.contentDocument!.adoptNode(field));
		await field.updateComplete;
		(window as any).eagerCombobox.adopted = { field, originalInput, originalRow };
	});
	const adopted = page.frameLocator('#eager-destination').locator('#eager-active');
	const control = adopted.getByRole('combobox', { name: 'Active asset', exact: true });
	await expect(adopted.locator('[role="option"]')).toHaveCount(4);
	await expect(control).toHaveAttribute('aria-expanded', 'false');
	await adopted.getByRole('button', { name: 'Show options' }).click();
	await expect(adopted.getByRole('option', { name: 'Sunset study', exact: true })).toBeVisible();
	await page.evaluate(() => {
		const adopted = (window as any).eagerCombobox.adopted;
		adopted.originalRow ??= adopted.field.shadowRoot.querySelector('[data-value="sunset"]');
	});
	await adopted.getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(adopted).toHaveJSProperty('value', 'sunset');
	await expect(control).toBeFocused();
	await control.press('ArrowDown');
	await expect(control).toHaveAttribute('aria-expanded', 'true');
	await page.frameLocator('#eager-destination').getByRole('button', { name: 'Outside adopted picker', exact: true }).click();
	await expect(control).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => {
		const { field, originalInput, originalRow } = (window as any).eagerCombobox.adopted;
		return {
			input: field.shadowRoot.querySelector('input') === originalInput,
			row: field.shadowRoot.querySelector('[data-value="sunset"]') === originalRow,
			document: field.ownerDocument === document.querySelector<HTMLIFrameElement>('#eager-destination')!.contentDocument,
		};
	})).toEqual({ input: true, row: true, document: true });
	await expect(unusedRows(page)).toHaveCount(4);
});

for (const layout of ['ordinary', 'shadow', 'nested'] as const) test(`${layout} shared scope keeps query and accepted state local in native and automatic global modes`, async ({ page, browserName }, info) => {
	const ownership = await page.evaluate(async layout => {
		const Global = customElements.get('en-combobox')!;
		const scopePath = '/packages/elements/dist/element-scope.js';
		const definitionPath = '/packages/elements/dist/definitions/combobox.js';
		const { createElementScope, elementScopeCapabilities } = await import(scopePath);
		const { comboboxDefinition } = await import(definitionPath);
		const scope = createElementScope({ document }); scope.register([comboboxDefinition]);
		const mount = scope.createElement('div'); mount.id = 'eager-scope';
		let root = layout === 'ordinary' ? mount : scope.attachShadow(mount);
		if (layout === 'nested') {
			const inner = scope.createElement('div'); root.append(inner);
			root = scope.attachShadow(inner);
		}
		const fields = [['scoped-active', 'Scoped asset'], ['scoped-unused', 'Scoped unused']].map(([id, label]) => {
			const field = scope.createElement('en-combobox');
			field.id = id; field.label = label;
			field.items = (window as any).comboboxFixture.options; field.value = 'forest';
			root.append(field); return field;
		});
		document.querySelector('main')!.prepend(mount);
		await Promise.all(fields.map(field => field.updateComplete));
		return {
			mode: scope.mode, native: elementScopeCapabilities(document).native,
			owner: scope.mode === 'scoped' ? scope.registry !== customElements : scope.registry === customElements,
			fields: fields.every(field => field instanceof comboboxDefinition.elementClass && field.ownerDocument === document &&
				(scope.mode === 'global' || (field.customElementRegistry === scope.registry && field.shadowRoot.customElementRegistry === scope.registry))),
			globalUnchanged: customElements.get('en-combobox') === Global,
		};
	}, layout);
	expect(ownership).toEqual({ mode: browserName === 'firefox' ? 'global' : 'scoped', native: browserName !== 'firefox', owner: true, fields: true, globalUnchanged: true });
	const scoped = page.locator('#scoped-active');
	await expect(scoped.locator('[role="option"]')).toHaveCount(4);
	await scoped.getByRole('button', { name: 'Show options' }).click();
	await scoped.getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(scoped).toHaveJSProperty('value', 'sunset');
	await expect(scoped.getByRole('combobox', { name: 'Scoped asset', exact: true })).toBeFocused();
	await expect(page.locator('#scoped-unused').locator('[role="option"]')).toHaveCount(4);
	await expect(rows(page)).toHaveCount(4);
	await expect(unusedRows(page)).toHaveCount(4);
	info.annotations.push({ type: 'registry-mode', description: `${layout}: ${ownership.mode}; actual engine capability, without a registry polyfill or manual upgrade.` });
});

test('a forced native probe failure uses the destination global registry for an unused picker', async ({ page }, info) => {
	await page.evaluate(async () => {
		const frame = document.createElement('iframe'); frame.id = 'eager-fallback-destination';
		frame.style.cssText = 'width: 650px; height: 450px; border: 0';
		const loaded = new Promise<void>(resolve => frame.addEventListener('load', () => resolve(), { once: true }));
		frame.src = '/fixture'; document.querySelector('main')!.prepend(frame); await loaded;
	});
	const destination = page.frameLocator('#eager-fallback-destination');
	await expect(destination.locator('body')).toHaveAttribute('data-ready', 'true');
	const ownership = await page.evaluate(async () => {
		const frame = document.querySelector<HTMLIFrameElement>('#eager-fallback-destination')!;
		const doc = frame.contentDocument!;
		const realm = frame.contentWindow as Window & typeof globalThis;
		const path = '/packages/elements/dist/element-scope.js';
		const { createElementScope } = await import(path);
		const descriptor = Object.getOwnPropertyDescriptor(realm, 'CustomElementRegistry');
		let scope: any;
		try {
			Object.defineProperty(realm, 'CustomElementRegistry', { configurable: true, value: class { constructor() { throw new Error('Unsupported native registry probe'); } } });
			scope = createElementScope({ document: doc });
		} finally {
			if (descriptor) Object.defineProperty(realm, 'CustomElementRegistry', descriptor);
			else delete (realm as any).CustomElementRegistry;
		}
		const Destination = realm.customElements.get('en-combobox')!;
		scope.register([{ tagName: 'en-combobox', elementClass: Destination }]);
		const field = scope.createElement('en-combobox');
		field.id = 'fallback-active'; field.label = 'Destination asset';
		field.items = (window as any).comboboxFixture.options; field.value = 'forest';
		doc.querySelector('main')!.replaceChildren(field);
		await field.updateComplete;
		return {
			mode: scope.mode, owner: scope.registry === realm.customElements, ambient: scope.registry === customElements,
			created: field instanceof Destination, document: field.ownerDocument === doc,
			localClass: Destination !== customElements.get('en-combobox'),
		};
	});
	expect(ownership).toEqual({ mode: 'global', owner: true, ambient: false, created: true, document: true, localClass: true });
	const field = destination.locator('#fallback-active');
	const control = field.getByRole('combobox', { name: 'Destination asset', exact: true });
	await expect(field.locator('[role="option"]')).toHaveCount(4);
	await expect(control).toHaveValue('Forest canvas');
	await control.fill('Sunset');
	await field.getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(field).toHaveJSProperty('value', 'sunset');
	await expect(control).toBeFocused();
	await expect(field.locator('[role="option"]')).toHaveCount(4);
	await expect(rows(page)).toHaveCount(4);
	await expect(unusedRows(page)).toHaveCount(4);
	info.annotations.push({ type: 'registry-mode', description: 'Forced native probe failure in a fresh destination realm; destination-global fallback is distinct from the actual Firefox capability case.' });
});
