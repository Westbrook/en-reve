import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors = new WeakMap<Page, string[]>();
const host = (page: Page) => page.locator('#asset');
const input = (page: Page) => host(page).getByRole('combobox', { name: 'Asset', exact: true });
const popup = (page: Page) => host(page).getByRole('listbox');
const option = (page: Page, name: string) => host(page).getByRole('option', { name, exact: true });
const nextTab = (browserName: string) => browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = [];
	errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	page.on('response', response => { if (response.status() >= 400) messages.push(`${response.status()} ${response.url()}`); });
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	await page.goto('/fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});
test.afterEach(async ({ page }, info) => {
	const messages = errors.get(page) ?? [];
	if (messages.length) await info.attach('runtime-errors', { body: JSON.stringify(messages), contentType: 'application/json' });
	expect(messages).toEqual([]);
});

async function accepted(page: Page) {
	return page.locator('#asset-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)));
}
async function settle(page: Page) { await page.evaluate(() => (window as any).comboboxFixture.settle()); }
async function filter(page: Page, query: string) {
	await input(page).fill(query);
	await expect(input(page)).toHaveValue(query);
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
}
async function selectKeyboard(page: Page, label: string) {
	await filter(page, label);
	await expect(option(page, label)).toBeVisible();
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
}

test('invalid control Part follows visible feedback while query edits and the native node survive', async ({ page }) => {
	const picker = host(page), control = input(page), original = await control.elementHandle();
	const feedback = async (visible: boolean) => {
		await expect(picker.locator('input[part~="control"]')).toHaveCount(1);
		await expect(picker.locator('[part~="control-invalid"]')).toHaveCount(visible ? 1 : 0);
		await expect(picker.locator('[part~="error"]')).toHaveCount(visible ? 1 : 0);
		if (visible) await expect(control).toHaveAttribute('aria-invalid', 'true');
		else await expect(control).not.toHaveAttribute('aria-invalid', 'true');
		expect(await control.evaluate((element, original) => element === original, original)).toBe(true);
	};
	await picker.evaluate(element => { (element as HTMLElement & { value: string }).value = ''; }); await settle(page);
	await expect(control).toHaveValue(''); await feedback(false);
	expect(await picker.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing)).toBe(true);
	await filter(page, 'For'); await control.evaluate(element => (element as HTMLInputElement).setSelectionRange(1, 2));
	for (const error of ['Application selection error', '']) {
		await picker.evaluate(async (element, error) => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = error; await field.updateComplete; }, error);
		await feedback(Boolean(error)); await expect(control).toHaveValue('For'); await expect(control).toBeFocused();
		expect(await control.evaluate(element => { const input = element as HTMLInputElement; return [input.selectionStart, input.selectionEnd]; })).toEqual([1, 2]);
		await expect(picker).toHaveJSProperty('value', '');
	}
	expect(await picker.evaluate(element => (element as HTMLElement & { reportValidity(): boolean }).reportValidity())).toBe(false);
	await feedback(true); await expect(control).toHaveValue('For'); await expect(control).toBeFocused();
	await selectKeyboard(page, 'Forest canvas'); await feedback(false);
	await expect(picker).toHaveJSProperty('value', 'forest'); await expect(control).toHaveValue('Forest canvas');
	await filter(page, 'Sun');
	expect(await picker.evaluate(element => (element as HTMLElement & { reportValidity(): boolean }).reportValidity())).toBe(false);
	await feedback(true); await expect(control).toHaveValue('Sun');
	await control.press('Escape'); await feedback(false);
	await expect(control).toHaveValue('Forest canvas'); await expect(control).toBeFocused();
	await picker.evaluate(async element => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = 'Accepted selection needs review'; await field.updateComplete; });
	await feedback(true); await expect(control).toHaveValue('Forest canvas');
	await picker.evaluate(async element => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = ''; await field.updateComplete; });
	await feedback(false); await expect(control).toBeFocused();
	await page.locator('#asset-form').evaluate(form => (form as HTMLFormElement).reset()); await settle(page);
	await feedback(false); await expect(control).toHaveValue('Forest canvas'); await expect(control).toBeFocused();
	await original?.dispose();
});

test('selective native ESM use keeps query text out of form data and commits one keyboard selection', async ({ page }) => {
	expect(await host(page).evaluate(element => 'controlled' in element)).toBe(false);
	expect(await page.evaluate(() => ({
		before: (window as any).comboboxFixture.registeredBefore,
		afterImport: (window as any).comboboxFixture.registeredAfterImport,
		unrelated: Boolean(customElements.get('en-button')),
	}))).toEqual({ before: false, afterImport: false, unrelated: false });
	await expect(input(page)).toHaveValue('Forest canvas');
	await filter(page, 'Sunset');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	await expect(input(page)).toBeFocused();
	await input(page).press('ArrowDown');
	const active = await input(page).getAttribute('aria-activedescendant');
	expect(active).toBeTruthy();
	await expect(option(page, 'Sunset study')).toHaveAttribute('id', active!);
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
	await expect(input(page)).toHaveValue('Sunset study');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(input(page)).toBeFocused();
	expect(await accepted(page)).toEqual({ asset: 'sunset' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([]);
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: 'sunset' }]);
	const events = await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type !== 'en-input'));
	expect(events.map((event: any) => [event.type, event.detail.previous, event.detail.proposed, event.cancelable])).toEqual([
		['en-change', 'forest', 'sunset', true],
	]);
});

test('pointer selection honors disabled options and renders labels as text', async ({ page }) => {
	await filter(page, 'F');
	await expect(option(page, 'Festival board')).toHaveAttribute('aria-disabled', 'true');
	const disabled = await option(page, 'Festival board').boundingBox();
	expect(disabled).not.toBeNull();
	await page.mouse.click(disabled!.x + disabled!.width / 2, disabled!.y + disabled!.height / 2);
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await option(page, 'Fjord study').click();
	await expect(host(page)).toHaveJSProperty('value', 'fjord');
	await expect(input(page)).toHaveValue('Fjord study');
	await host(page).evaluate(element => {
		(element as any).items = [{ value: 'literal', label: '<em>Literal label</em>' }];
		(element as any).value = '';
	});
	await settle(page);
	await filter(page, 'Literal');
	await expect(option(page, '<em>Literal label</em>')).toBeVisible();
	await expect(host(page).locator('em')).toHaveCount(0);
	await option(page, '<em>Literal label</em>').click();
	await expect(host(page)).toHaveJSProperty('value', 'literal');
});

for (const policy of ['cancel', 'author-write', 'cancel-then-accept'] as const) test(`${policy} consumption keeps application authority during selection`, async ({ page }) => {
	await host(page).evaluate((element, policy) => {
		element.addEventListener('en-change', event => {
			if (policy !== 'author-write') event.preventDefault();
			if (policy === 'author-write') (element as any).value = 'fjord';
		});
	}, policy);
	await selectKeyboard(page, 'Sunset study');
	const attempts = await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'));
	expect(attempts).toEqual([{
		type: 'en-change', detail: { previous: 'forest', proposed: 'sunset', reason: 'select' },
		value: 'sunset', form: { asset: 'sunset' }, cancelable: true,
	}]);
	const expected = policy === 'author-write' ? 'fjord' : 'forest';
	await expect(host(page)).toHaveJSProperty('value', expected);
	expect(await accepted(page)).toEqual({ asset: expected });
	if (policy !== 'author-write') {
		await expect(input(page)).toHaveValue('Sunset study');
		await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	}
	await input(page).press('Escape');
	await expect(input(page)).toHaveValue(policy === 'author-write' ? 'Fjord study' : 'Forest canvas');
	if (policy === 'cancel-then-accept') {
		await host(page).evaluate(element => { (element as any).value = 'sunset'; });
		await expect(input(page)).toHaveValue('Sunset study');
		expect(await accepted(page)).toEqual({ asset: 'sunset' });
	}
	// Authoritative writes and Escape never synthesize additional change attempts.
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toHaveLength(1);
});

test('reset, disabled fieldsets and required validation operate on accepted values', async ({ page }) => {
	await selectKeyboard(page, 'Sunset study');
	await page.getByRole('button', { name: 'Reset project', exact: true }).click();
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveValue('Forest canvas');
	await page.locator('#asset-fields').evaluate(fieldset => { (fieldset as HTMLFieldSetElement).disabled = true; });
	await expect(input(page)).toBeDisabled();
	expect(await accepted(page)).toEqual({});
	await page.locator('#asset-fields').evaluate(fieldset => { (fieldset as HTMLFieldSetElement).disabled = false; });
	await expect(input(page)).toBeEnabled();
	await host(page).evaluate(element => { (element as any).value = ''; });
	await filter(page, 'Not an existing asset');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(false);
	expect(await host(page).evaluate(element => (element as any).validity.valueMissing)).toBe(true);
	expect(await accepted(page)).toEqual({ asset: '' });
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	await expect(input(page)).toBeFocused();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([]);
	await selectKeyboard(page, 'Sunset study');
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: 'sunset' }]);
});

test('replacement items update labels and invalidate a removed active option without replacing the editor', async ({ page }) => {
	const original = await input(page).elementHandle();
	await filter(page, 'Fjord');
	await input(page).press('ArrowDown');
	const previousActive = await input(page).getAttribute('aria-activedescendant');
	await host(page).evaluate(element => {
		(element as any).items = [{ value: 'forest', label: 'Renamed forest' }, { value: 'mountain', label: 'Mountain canvas' }];
	});
	await settle(page);
	await expect(option(page, 'Fjord study')).toHaveCount(0);
	expect(await input(page).getAttribute('aria-activedescendant')).not.toBe(previousActive);
	await input(page).press('Escape');
	await expect(input(page)).toHaveValue('Renamed forest');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await input(page).evaluate((element, previous) => element === previous, original)).toBe(true);
	await selectKeyboard(page, 'Mountain canvas');
	await expect(host(page)).toHaveJSProperty('value', 'mountain');
});

test('Escape and Tab abandon the query, retain selection and preserve ordinary focus order', async ({ page, browserName }) => {
	await page.getByRole('button', { name: 'Before picker', exact: true }).focus();
	await page.keyboard.press(nextTab(browserName));
	await expect(input(page)).toBeFocused();
	await filter(page, 'Sunset');
	await input(page).press('ArrowDown');
	await input(page).press('Escape');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toBeFocused();
	await filter(page, 'Fjord');
	await input(page).press('ArrowDown');
	await page.keyboard.press(nextTab(browserName));
	await expect(page.getByRole('button', { name: 'After picker', exact: true })).toBeFocused();
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
});

test('read-only fields and unavailable accepted items preserve their identity while reporting appropriate validity', async ({ page }) => {
	await host(page).evaluate(element => { (element as any).readOnly = true; });
	await expect(input(page)).toHaveAttribute('readonly', '');
	await input(page).focus();
	await input(page).press('ArrowDown');
	await input(page).press('f');
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	await host(page).evaluate(element => { (element as any).readOnly = false; (element as any).items = []; });
	await settle(page);
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveValue('Forest canvas');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(false);
	await host(page).evaluate(element => {
		(element as any).items = [{ value: 'forest', label: 'Forest canvas', disabled: true }];
	});
	await settle(page);
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(false);
	await host(page).evaluate(element => { (element as any).items = (window as any).comboboxFixture.options; });
	await settle(page);
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(true);
	await expect(input(page)).toHaveValue('Forest canvas');
});

test('application-owned loading and failure status do not select results or invalidate a still-valid accepted item', async ({ page }) => {
	await input(page).focus();
	await input(page).press('ArrowDown');
	await host(page).evaluate(element => {
		(element as any).loadingText = 'Loading shared assets';
		(element as any).loading = true;
	});
	await expect(host(page).locator('[part="status"]')).toContainText('Loading shared assets');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(true);
	await host(page).evaluate(element => {
		(element as any).loading = false;
		(element as any).loadError = 'Shared assets could not be loaded. Retry in the application.';
	});
	await expect(host(page).locator('[part="status"]')).toContainText('Shared assets could not be loaded');
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(true);
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([]);
	await host(page).evaluate(element => { (element as any).loadError = ''; });
	await selectKeyboard(page, 'Sunset study');
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
});

test('synthetic composition transitions defer selection until composition ends', async ({ page }, info) => {
	await input(page).focus();
	await input(page).evaluate(element => {
		element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true, data: '' }));
		(element as HTMLInputElement).value = 'Fjord';
		element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'Fjord', inputType: 'insertCompositionText', isComposing: true }));
	});
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toEqual([]);
	await input(page).evaluate(element => {
		element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: 'Fjord' }));
		element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, data: 'Fjord', inputType: 'insertFromComposition', isComposing: false }));
	});
	await expect(option(page, 'Fjord study')).toBeVisible();
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(host(page)).toHaveJSProperty('value', 'fjord');
	info.annotations.push({ type: 'coverage-limit', description: 'Synthetic DOM composition events exercise component state transitions; no operating-system IME candidate window or actual composing keyboard is driven.' });
});

test('slotted labels and descriptions name the native editor and the label Part supports a visually hidden name', async ({ page }, info) => {
	const slotted = page.locator('#slotted');
	const control = slotted.getByRole('combobox', { name: 'Review asset', exact: true });
	await expect(control).toHaveAccessibleDescription('Use a shared asset.');
	await slotted.locator('[slot="label"]').click();
	await expect(control).toBeFocused();
	await slotted.locator('[slot="label"]').evaluate(label => { label.textContent = 'Renamed review asset'; });
	await slotted.locator('[slot="description"]').evaluate(description => { description.textContent = 'Choose from the reviewed collection.'; });
	await expect(control).toHaveCount(0);
	const renamed = slotted.getByRole('combobox', { name: 'Renamed review asset', exact: true });
	await expect(renamed).toHaveAccessibleDescription('Choose from the reviewed collection.');
	const hidden = page.locator('#hidden-label');
	await expect(hidden.getByRole('combobox', { name: 'Private asset', exact: true })).toBeVisible();
	const labelBox = await hidden.locator('[part~="label"]').boundingBox();
	expect(labelBox?.width).toBeLessThanOrEqual(1);
	expect(labelBox?.height).toBeLessThanOrEqual(1);
	for (const field of [slotted, hidden]) {
		expect(await field.getAttribute('role')).toBeNull();
		expect(await field.getAttribute('tabindex')).toBeNull();
	}
	await filter(page, 'Sunset');
	await input(page).press('ArrowDown');
	const result = await new AxeBuilder({ page }).include('#asset-form').include('[aria-label="Field naming examples"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
	await info.attach('combobox-accessibility', { body: JSON.stringify({ violations: result.violations, passes: result.passes.length }), contentType: 'application/json' });
	expect(result.violations).toEqual([]);
});

test('the popup escapes clipping and follows its control when the scroll container moves', async ({ page }) => {
	const geometryHost = page.locator('#geometry');
	const geometry = geometryHost.getByRole('combobox', { name: 'Pinned asset', exact: true });
	await geometry.scrollIntoViewIfNeeded();
	await geometry.fill('Sunset');
	const list = geometryHost.getByRole('listbox');
	const surface = geometryHost.locator('[part~="popup"]');
	await expect(list).toBeVisible();
	expect(await list.evaluate(element => Boolean(element.closest('[popover]')?.matches(':popover-open')))).toBe(true);
	const checkAlignment = async () => {
		const inputBox = await geometry.boundingBox();
		const popupBox = await surface.boundingBox();
		expect(inputBox && popupBox).toBeTruthy();
		const verticalGap = Math.min(Math.abs(popupBox!.y - (inputBox!.y + inputBox!.height)), Math.abs(inputBox!.y - (popupBox!.y + popupBox!.height)));
		expect(verticalGap).toBeLessThanOrEqual(16);
		expect(popupBox!.x).toBeGreaterThanOrEqual(-1);
		expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
	};
	await checkAlignment();
	const initial = await geometry.boundingBox();
	await page.locator('#scroll-region').evaluate(region => { region.scrollTop += 24; });
	await expect.poll(async () => (await geometry.boundingBox())!.y).toBeLessThan(initial!.y);
	await expect.poll(async () => {
		const inputBox = (await geometry.boundingBox())!;
		const popupBox = (await surface.boundingBox())!;
		return Math.min(Math.abs(popupBox.y - (inputBox.y + inputBox.height)), Math.abs(inputBox.y - (popupBox.y + popupBox.height)));
	}).toBeLessThanOrEqual(16);
	await checkAlignment();
	await geometryHost.getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(geometryHost).toHaveJSProperty('value', 'sunset');
});

test('pointer activation inside an application-owned closed shadow root is not mistaken for an outside click', async ({ page }) => {
	await page.evaluate(async () => {
		const mount = document.createElement('div'); mount.id = 'closed-mount';
		document.querySelector('main')!.prepend(mount);
		const root = mount.attachShadow({ mode: 'closed' });
		const field = document.createElement('en-combobox') as HTMLElement & { value: string; items: unknown[]; updateComplete: Promise<boolean> };
		field.setAttribute('label', 'Closed-root asset'); field.value = 'forest';
		field.items = (window as any).comboboxFixture.options;
		root.append(field); await field.updateComplete;
		(window as any).comboboxFixture.closed = { root, field };
		field.focus();
	});
	expect(await page.locator('#closed-mount').evaluate(element => element.shadowRoot)).toBeNull();
	await page.keyboard.press('ControlOrMeta+A');
	await page.keyboard.insertText('Sunset');
	await expect.poll(() => page.evaluate(() => {
		const { field } = (window as any).comboboxFixture.closed;
		return field.shadowRoot.querySelector('[role="combobox"]').getAttribute('aria-expanded');
	})).toBe('true');
	// The fixture owns this closed root. Keep an element handle so Playwright
	// waits for actual visibility and stable placement before sending a pointer.
	const target = await page.evaluateHandle(() => {
		const { field } = (window as any).comboboxFixture.closed;
		return [...field.shadowRoot.querySelectorAll('[role="option"]')].find((node: any) => node.textContent.trim() === 'Sunset study') as HTMLElement;
	});
	await target.asElement()!.click();
	await target.dispose();
	await expect.poll(() => page.evaluate(() => (window as any).comboboxFixture.closed.field.value)).toBe('sunset');
	expect(await page.evaluate(() => {
		const { root, field } = (window as any).comboboxFixture.closed;
		const input = field.shadowRoot.querySelector('[role="combobox"]');
		return { focused: root.activeElement === field && field.shadowRoot.activeElement === input, expanded: input.getAttribute('aria-expanded') };
	})).toEqual({ focused: true, expanded: 'false' });
	await page.keyboard.press('ArrowDown');
	// The popup covers the heading; activate the known empty outer page gutter.
	await page.mouse.click(2, 2);
	await expect.poll(() => page.evaluate(() => (window as any).comboboxFixture.closed.field.shadowRoot.querySelector('[role="combobox"]').getAttribute('aria-expanded'))).toBe('false');
});

test('narrow RTL selection keeps popup geometry within the viewport and keyboard focus on the editor', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.locator('html').evaluate(element => element.setAttribute('dir', 'rtl'));
	await expect(input(page)).toHaveCSS('direction', 'rtl');
	await filter(page, 'Sunset');
	const box = await popup(page).boundingBox();
	expect(box).not.toBeNull();
	expect(box!.x).toBeGreaterThanOrEqual(-1);
	expect(box!.x + box!.width).toBeLessThanOrEqual(391);
	await input(page).press('ArrowDown');
	await input(page).press('Enter');
	await expect(input(page)).toBeFocused();
	await expect(input(page)).toHaveValue('Sunset study');
	expect(await page.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
});
// Append after the existing combobox.spec.ts helpers and cases.

test('a consumer can move focus after pointer selection without the component taking it back', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', () => document.querySelector<HTMLButtonElement>('#after')!.focus(), { once: true });
	});
	await filter(page, 'Sunset');
	await option(page, 'Sunset study').click();
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
	await expect(page.getByRole('button', { name: 'After picker', exact: true })).toBeFocused();
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toEqual({ asset: 'sunset' });
});

test('popup placement follows a scrollport inside nested application shadow roots', async ({ page }) => {
	await page.evaluate(async () => {
		const mount = document.createElement('div'); mount.id = 'shadow-scroll-mount';
		document.querySelector('main')!.prepend(mount);
		const outer = mount.attachShadow({ mode: 'open' });
		const innerHost = document.createElement('div'); outer.append(innerHost);
		const inner = innerHost.attachShadow({ mode: 'open' });
		inner.innerHTML = `<style>
			#shadow-scrollport { block-size: 200px; overflow: auto; border: 2px solid; padding-inline: 12px; }
			.spacer { block-size: 120px; }
		</style><div id="shadow-scrollport"><div class="spacer"></div><en-combobox id="shadow-asset" label="Shadow scroll asset" value="forest"></en-combobox><div class="spacer"></div></div>`;
		const field = inner.querySelector('#shadow-asset') as HTMLElement & { items: unknown[]; updateComplete: Promise<boolean> };
		field.items = (window as any).comboboxFixture.options;
		await field.updateComplete;
		inner.querySelector('#shadow-scrollport')!.scrollTop = 60;
	});
	const field = page.locator('#shadow-asset');
	const control = field.getByRole('combobox', { name: 'Shadow scroll asset', exact: true });
	await control.fill('Sunset');
	const surface = field.locator('[part~="popup"]');
	await expect(surface).toBeVisible();
	const distance = async () => {
		const anchor = (await control.boundingBox())!;
		const popup = (await surface.boundingBox())!;
		return Math.min(Math.abs(popup.y - anchor.y - anchor.height), Math.abs(anchor.y - popup.y - popup.height));
	};
	await expect.poll(distance).toBeLessThanOrEqual(16);
	const beforeAnchor = (await control.boundingBox())!;
	const beforePopup = (await surface.boundingBox())!;
	await page.locator('#shadow-scrollport').evaluate(port => { port.scrollTop += 28; });
	await expect.poll(async () => (await control.boundingBox())!.y).toBeLessThan(beforeAnchor.y - 20);
	await expect.poll(async () => (await surface.boundingBox())!.y).toBeLessThan(beforePopup.y - 20);
	await expect.poll(distance).toBeLessThanOrEqual(16);
	await field.getByRole('option', { name: 'Sunset study', exact: true }).click();
	await expect(field).toHaveJSProperty('value', 'sunset');
});

test('the no-Popover fallback remains usable inline and the trigger stays the height of the input', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: undefined });
		Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value: undefined });
	});
	await page.reload();
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	const trigger = host(page).getByRole('button', { name: 'Show options', exact: true });
	const initialControl = (await input(page).boundingBox())!;
	const initialTrigger = (await trigger.boundingBox())!;
	await filter(page, 'F');
	const surface = host(page).locator('[part~="popup"]');
	await expect(surface).toBeVisible();
	expect(await surface.getAttribute('popover')).toBeNull();
	await expect(surface).toHaveCSS('position', 'static');
	const expandedControl = (await input(page).boundingBox())!;
	const expandedTrigger = (await trigger.boundingBox())!;
	const expandedPopup = (await surface.boundingBox())!;
	expect(Math.abs(expandedTrigger.height - initialTrigger.height)).toBeLessThan(1);
	expect(Math.abs(expandedTrigger.height - expandedControl.height)).toBeLessThanOrEqual(2);
	expect(expandedTrigger.height).toBeLessThan(expandedPopup.height);
	expect(Math.abs(expandedControl.height - initialControl.height)).toBeLessThan(1);
	expect(expandedPopup.y).toBeGreaterThanOrEqual(expandedControl.y + expandedControl.height - 1);
	await option(page, 'Fjord study').click();
	await expect(host(page)).toHaveJSProperty('value', 'fjord');
	await expect(input(page)).toHaveValue('Fjord study');
	await expect(surface).toBeHidden();
	await trigger.click();
	await expect(surface).toBeVisible();
	await input(page).press('Escape');
	await expect(surface).toBeHidden();
});

test('an author write restores the previous selection and silently reconciles the label', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', () => {
			(element as HTMLElement & { value: string }).value = 'forest';
		}, { once: true });
	});
	await filter(page, 'Sunset');
	await option(page, 'Sunset study').click();
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toHaveLength(1);
});

test('an authored empty option clears an optional field and required validation recovers after a new selection', async ({ page }) => {
	await host(page).evaluate(element => {
		(element as any).required = false;
		(element as any).items = [{ value: '', label: 'No asset' }, ...(window as any).comboboxFixture.options];
	});
	await selectKeyboard(page, 'No asset');
	await expect(host(page)).toHaveJSProperty('value', '');
	await expect(input(page)).toHaveValue('No asset');
	expect(await accepted(page)).toEqual({ asset: '' });
	expect(await host(page).evaluate(element => (element as any).checkValidity())).toBe(true);
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: '' }]);
	await host(page).evaluate(element => { (element as any).required = true; });
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	await expect(input(page)).toBeFocused();
	expect(await host(page).evaluate(element => (element as any).validity.valueMissing)).toBe(true);
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: '' }]);
	await selectKeyboard(page, 'Sunset study');
	await page.getByRole('button', { name: 'Save project', exact: true }).click();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: '' }, { asset: 'sunset' }]);
});
// Append after the existing combobox.spec.ts helpers and cases.

test('viewport constraints reveal the active last option without undoing later manual popup scrolling', async ({ page }, info) => {
	await page.setViewportSize({ width: 440, height: 620 });
	await host(page).evaluate(element => {
		(element as any).items = Array.from({ length: 60 }, (_, index) => ({
			value: `item-${index}`, label: `Review item ${String(index + 1).padStart(2, '0')}`,
		}));
		(element as any).value = 'item-0';
	});
	await settle(page);
	await host(page).getByRole('button', { name: 'Show options', exact: true }).click();
	await input(page).press('ArrowUp');
	const surface = host(page).locator('[part~="popup"]');
	const last = option(page, 'Review item 60');
	await expect(surface).toBeVisible();
	const lastId = await last.getAttribute('id');
	expect(lastId).toBeTruthy();
	await expect(input(page)).toHaveAttribute('aria-activedescendant', lastId!);
	const snapshot = () => surface.evaluate(element => {
		const root = element.getRootNode() as ShadowRoot;
		const control = root.querySelector('[role="combobox"]')!;
		const active = root.getElementById(control.getAttribute('aria-activedescendant') ?? '');
		const popup = element.getBoundingClientRect();
		const row = active?.getBoundingClientRect();
		const top = popup.top + element.clientTop;
		const bottom = top + element.clientHeight;
		return {
			height: popup.height, top: popup.top, width: popup.width,
			scrollTop: element.scrollTop, scrollable: element.scrollHeight > element.clientHeight + 40,
			activeVisible: Boolean(row && row.top >= Math.max(0, top) - 1 && row.bottom <= Math.min(innerHeight, bottom) + 1),
			activeTop: row?.top, activeBottom: row?.bottom,
		};
	});
	await expect.poll(async () => (await snapshot()).activeVisible).toBe(true);
	const initial = await snapshot();
	expect(initial.scrollable).toBe(true);
	await page.setViewportSize({ width: 440, height: 320 });
	await expect.poll(async () => (await snapshot()).height).toBeLessThan(initial.height - 20);
	await expect.poll(async () => (await snapshot()).activeVisible).toBe(true);
	await expect(input(page)).toHaveAttribute('aria-activedescendant', lastId!);
	await expect(input(page)).toBeFocused();
	const constrained = await snapshot();
	expect(constrained.scrollTop).toBeGreaterThan(40);
	// A modest real wheel gesture leaves the active row offscreen. Firefox caps
	// giant wheel deltas in native scrollports, so reaching scrollTop 0 in one
	// gesture is not a component guarantee.
	await surface.hover();
	await page.mouse.wheel(0, -120);
	await expect.poll(async () => (await snapshot()).scrollTop).toBeLessThan(constrained.scrollTop - 40);
	// Observe the next rendering turns: a queued position/resize observer must
	// not reveal the unchanged active option after the user scrolls away from it.
	const settled = await surface.evaluate(async element => {
		const samples = [];
		for (let frame = 0; frame < 8; frame++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			samples.push(element.scrollTop);
		}
		return samples;
	});
	const manualPosition = settled.at(-1)!;
	expect(manualPosition).toBeLessThan(constrained.scrollTop - 40);
	expect(settled.every(position => Math.abs(position - manualPosition) < 1)).toBe(true);
	const manual = await snapshot();
	expect(manual.activeVisible).toBe(false);
	expect(Math.abs(manual.height - constrained.height)).toBeLessThan(1);
	expect(Math.abs(manual.top - constrained.top)).toBeLessThan(1);
	expect(Math.abs(manual.width - constrained.width)).toBeLessThan(1);
	await expect(input(page)).toHaveAttribute('aria-activedescendant', lastId!);
	await expect(host(page)).toHaveJSProperty('value', 'item-0');
	await info.attach('constrained-active-option-and-manual-scroll', {
		body: JSON.stringify({ initial, constrained, manual, settled }), contentType: 'application/json',
	});
});

test('searching preserves normal field geometry until validation explicitly exposes an error', async ({ page }) => {
	await selectKeyboard(page, 'Sunset study');
	const paint = () => input(page).evaluate(element => {
		const css = getComputedStyle(element), box = element.getBoundingClientRect();
		return { color: css.borderTopColor, width: parseFloat(css.borderTopWidth), height: box.height,
			start: parseFloat(css.borderInlineStartWidth) + parseFloat(css.paddingInlineStart),
			end: parseFloat(css.borderInlineEndWidth) + parseFloat(css.paddingInlineEnd) };
	});
	const normal = await paint();
	await filter(page, 'F');
	await expect(input(page)).not.toHaveAttribute('aria-invalid', 'true');
	expect(await host(page).evaluate(element => (element as any).validity.valid)).toBe(false);
	expect(await paint()).toEqual(normal);
	await host(page).evaluate(element => (element as any).reportValidity());
	await expect(input(page)).toHaveAttribute('aria-invalid', 'true');
	await expect(host(page).locator('[part~="error"]')).toHaveText('Choose an option from the list.');
	const invalid = await paint();
	expect(invalid.width).toBeGreaterThan(normal.width);
	expect(invalid.color).not.toBe(normal.color);
	expect(invalid.height).toBe(normal.height);
	expect(invalid.start).toBe(normal.start);
	expect(invalid.end).toBe(normal.end);
	await input(page).press('Escape');
	await expect(input(page)).toHaveValue('Sunset study');
	await expect(input(page)).not.toHaveAttribute('aria-invalid', 'true');
	expect(await paint()).toEqual(normal);
	expect(await host(page).evaluate(element => (element as any).validity.valid)).toBe(true);
});

test('assigning the staged combobox value during cancellation accepts it without a second event', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', event => {
			event.preventDefault();
			(element as any).value = (element as any).value;
		}, { once: true });
	});
	await filter(page, 'Sunset');
	await option(page, 'Sunset study').click();
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
	await expect(input(page)).toHaveValue('Sunset study');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toEqual({ asset: 'sunset' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toHaveLength(1);
});

for (const replacement of ['remove', 'disable'] as const) test(`catalog ${replacement} during a tentative selection restores the accepted ID and keeps the filter`, async ({ page }) => {
	await host(page).evaluate((element, replacement) => {
		element.addEventListener('en-change', event => {
			(window as any).selectionAttempt = event;
			const proposed = (event as CustomEvent).detail.proposed;
			const options = (window as any).comboboxFixture.options;
			(element as any).items = replacement === 'remove'
				? options.filter((item: any) => item.value !== proposed)
				: options.map((item: any) => item.value === proposed ? { ...item, disabled: true } : item);
		}, { once: true });
	}, replacement);
	await filter(page, 'Sunset');
	await option(page, 'Sunset study').click();
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveValue('Sunset');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	expect(await page.evaluate(() => (window as any).selectionAttempt.defaultPrevented)).toBe(true);
	await input(page).press('Escape');
	await expect(input(page)).toHaveValue('Forest canvas');
});

test('selecting the accepted item clears a filter without emitting a change', async ({ page }) => {
	await filter(page, 'For');
	await option(page, 'Forest canvas').click();
	await expect(input(page)).toHaveValue('Forest canvas');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await accepted(page)).toEqual({ asset: 'forest' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toEqual([]);
});
