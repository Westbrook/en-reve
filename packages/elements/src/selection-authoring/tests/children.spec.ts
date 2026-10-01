import { test, expect, type Page } from '@playwright/test';

const fields = [
	{ id: 'format', tag: 'en-select-option', initial: 'svg', proposed: 'png', disabled: 'avif', fallback: 'fallback-svg' },
	{ id: 'appearance', tag: 'en-segmented-item', initial: 'dark', proposed: 'light', disabled: 'sepia', fallback: 'fallback-dark' },
] as const;
type Field = typeof fields[number];

async function hydrate(page: Page) {
	await page.waitForFunction(() => typeof (window as any).hydrateSelectionFixture === 'function');
	await page.evaluate(() => (window as any).hydrateSelectionFixture());
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}
async function open(page: Page, options: { hydrate?: boolean; propertyBound?: boolean } = {}) {
	await page.goto(`/fixture${options.propertyBound ? '?property-bound' : ''}`);
	if (options.hydrate !== false) await hydrate(page);
}
async function choose(page: Page, field: Field, value: string = field.proposed) {
	if (field.id === 'format') await page.locator('#format select').selectOption(value);
	else {
		const radio = page.locator(`#appearance input[type="radio"][value="${value}"]`);
		await radio.focus();
		await radio.press('Space');
	}
}
async function expectSelection(page: Page, field: Field, value: string, submitted: string | null = value) {
	await expect(page.locator(`#${field.id}`)).toHaveJSProperty('value', value);
	if (field.id === 'format') await expect(page.locator('#format select')).toHaveValue(submitted === null ? '' : value);
	else {
		const checked = page.locator('#appearance input[type="radio"]:checked');
		if (submitted === null) await expect(checked).toHaveCount(0);
		else await expect(checked).toHaveValue(value);
	}
	await expect.poll(() => page.locator('form').evaluate((form, name) => new FormData(form as HTMLFormElement).getAll(name), field.id))
		.toEqual(submitted === null ? [] : [submitted]);
}
async function recordChanges(page: Page) {
	await page.evaluate(() => {
		(window as any).changes = [];
		document.querySelector('form')!.addEventListener('en-change', event => {
			const target = event.target as any;
			(window as any).changes.push({ id: target.id, ...((event as CustomEvent).detail), value: target.value,
				form: new FormData(document.querySelector('form')!).getAll(target.name), cancelable: event.cancelable });
		});
	});
}

test('SSR renders the child choices and original rich labels without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		await page.goto('/fixture');
		await expect(page.getByRole('combobox', { name: 'Export format', exact: true })).toHaveValue('svg');
		await expect(page.locator('#format select option')).toHaveText(['PNG', 'SVG', 'AVIF']);
		await expect(page.locator('#format select option[value="avif"]')).toBeDisabled();
		await expect(page.getByRole('radio', { name: 'Dark mode', exact: true })).toBeChecked();
		await expect(page.getByRole('radio', { name: 'Light mode', exact: true })).not.toBeChecked();
		await expect(page.getByRole('radio', { name: 'Sepia mode', exact: true })).toBeDisabled();
		await expect(page.locator('#rich-dark strong')).toBeVisible();
		await expect(page.locator('#appearance input[type="radio"]')).toHaveCount(3);
		await expect(page.getByText('Fallback light', { exact: true })).toHaveCount(0);
	} finally { await context.close(); }
});

test('ordinary hydration preserves native and authored node identity without selection events', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await open(page, { hydrate: false });
	await recordChanges(page);
	await page.locator('#format select').focus();
	await page.evaluate(() => {
		(window as any).nodes = {
			select: document.querySelector('#format')!.shadowRoot!.querySelector('select'),
			radio: document.querySelector('#appearance')!.shadowRoot!.querySelector('input[value="dark"]'),
			descriptor: document.querySelector('#appearance-dark'), rich: document.querySelector('#rich-dark'),
		};
	});
	await hydrate(page);
	await expectSelection(page, fields[0], 'svg');
	await expectSelection(page, fields[1], 'dark');
	await expect(page.locator('#format select')).toBeFocused();
	expect(await page.evaluate(() => {
		const nodes = (window as any).nodes;
		return [nodes.select === document.querySelector('#format')!.shadowRoot!.querySelector('select'),
			nodes.radio === document.querySelector('#appearance')!.shadowRoot!.querySelector('input[value="dark"]'),
			nodes.descriptor === document.querySelector('#appearance-dark'), nodes.rich === document.querySelector('#rich-dark')];
	})).toEqual([true, true, true, true]);
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	expect(errors).toEqual([]);
});

test('an unselected parent does not adopt the browser first-option default or create a selection event', async ({ page }) => {
	await page.goto('/fixture?unselected');
	// This is the server's native state, before any custom-element definition.
	await expect(page.locator('#format select')).toHaveValue('');
	await expect(page.locator('#format select option[value="png"]:checked')).toHaveCount(0);
	await expect(page.locator('#format select option[hidden][disabled]')).toHaveJSProperty('selected', true);
	await recordChanges(page);
	await hydrate(page);
	for (const field of fields) {
		await expectSelection(page, field, '', null);
		await expect.poll(() => page.locator(`#${field.id}`).evaluate(host => (host as any).validity.valueMissing)).toBe(true);
	}
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
});

test('blank SSR select remains blank without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		const page = await context.newPage();
		await page.goto('/fixture?unselected');
		await expect(page.getByRole('combobox', { name: 'Export format', exact: true })).toHaveValue('');
		await expect(page.locator('#format select option[value="png"]:checked')).toHaveCount(0);
		await expect(page.locator('#format select option[hidden][disabled]')).toHaveText('');
	} finally { await context.close(); }
});

for (const authoritative of [false, true]) {
	test(`blank SSR select early choice ${authoritative ? 'yields to an equal pre-upgrade value write' : 'is adopted without changing reset state'}`, async ({ page }) => {
		await page.goto('/fixture?unselected');
		await recordChanges(page);
		await page.locator('#format select').selectOption('png');
		await page.locator('#format select').evaluate(node => { (window as any).earlyBlankSelect = node; });
		if (authoritative) await page.locator('#format').evaluate(host => { (host as any).value = ''; });
		await hydrate(page);
		await expectSelection(page, fields[0], authoritative ? '' : 'png', authoritative ? null : 'png');
		expect(await page.locator('#format select').evaluate(node => node === (window as any).earlyBlankSelect)).toBe(true);
		const changes = await page.evaluate(() => (window as any).changes);
		if (authoritative) expect(changes).toEqual([]);
		else expect(changes).toMatchObject([{ id: 'format', previous: '', proposed: 'png', reason: 'hydrate' }]);
		await page.locator('form').evaluate(form => (form as HTMLFormElement).reset());
		await expectSelection(page, fields[0], '', null);
	});
}

for (const field of fields) {
	test(`${field.id}: attribute-authored hydration adopts an early native edit once and retains focus`, async ({ page }) => {
		await open(page, { hydrate: false });
		await recordChanges(page);
		await choose(page, field);
		const native = page.locator(field.id === 'format' ? '#format select' : '#appearance input[value="light"]');
		await native.focus();
		await native.evaluate(node => { (window as any).earlyControl = node; });
		await hydrate(page);
		await expectSelection(page, field, field.proposed);
		await expect(native).toBeFocused();
		expect(await native.evaluate(node => node === (window as any).earlyControl)).toBe(true);
		expect(await page.evaluate(() => (window as any).changes)).toEqual([{
			id: field.id, previous: field.initial, proposed: field.proposed, reason: 'hydrate',
			value: field.proposed, form: [field.proposed], cancelable: true,
		}]);
		await page.getByRole('button', { name: 'Reset selections', exact: true }).click();
		await expectSelection(page, field, field.initial);
	});

	test(`${field.id}: canceling early native adoption restores accepted selection and form state`, async ({ page }) => {
		await open(page, { hydrate: false });
		await recordChanges(page);
		await choose(page, field);
		await page.locator(`#${field.id}`).evaluate(host => host.addEventListener('en-change', event => event.preventDefault()));
		await hydrate(page);
		await expectSelection(page, field, field.initial);
		expect(await page.evaluate(() => (window as any).changes)).toEqual([{
			id: field.id, previous: field.initial, proposed: field.proposed, reason: 'hydrate',
			value: field.proposed, form: [field.proposed], cancelable: true,
		}]);
	});

	for (const authority of ['equal-preupgrade-write', 'different-preupgrade-write', 'parent-binding'] as const) {
		test(`${field.id}: ${authority} remains authoritative over an early native edit`, async ({ page }) => {
			await open(page, { hydrate: false, propertyBound: authority === 'parent-binding' });
			await recordChanges(page);
			await choose(page, field);
			const expected = authority === 'different-preupgrade-write' ? 'author-value' : field.initial;
			if (authority !== 'parent-binding') await page.locator(`#${field.id}`).evaluate((host, value) => { (host as any).value = value; }, expected);
			await hydrate(page);
			await expectSelection(page, field, expected, expected === 'author-value' ? null : expected);
			expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
			await expect(page.locator(`#${field.id}`)).toHaveAttribute('value', field.initial);
			await page.getByRole('button', { name: 'Reset selections', exact: true }).click();
			// Live property writes remain authoritative until native reset restores
			// the value attribute/defaultValue, rather than property-only initialization.
			await expectSelection(page, field, field.initial);
		});
	}

	test(`${field.id}: child presence overrides items and removing the final child resumes the latest array`, async ({ page }) => {
		await open(page);
		await recordChanges(page);
		await page.locator(`#${field.id}`).evaluate((host, field) => {
			(window as any).originalChoices = [...host.querySelectorAll(`:scope > ${field.tag}`)];
			(host as any).items = [{ value: 'replacement-a', label: 'Replacement A' }, { value: 'replacement-b', label: 'Replacement B' }];
		}, field);
		await expectSelection(page, field, field.initial);
		await expect(page.getByText('Replacement A', { exact: true })).toHaveCount(0);
		await page.locator(`#${field.id}`).evaluate(host => {
			for (const child of (window as any).originalChoices) child.remove();
			(host as any).value = 'replacement-b';
		});
		await expectSelection(page, field, 'replacement-b');
		if (field.id === 'format') await expect(page.locator('#format select option[part~="option"]')).toHaveText(['Replacement A', 'Replacement B']);
		else await expect(page.getByRole('radio', { name: 'Replacement B', exact: true })).toBeChecked();
		await page.locator(`#${field.id}`).evaluate(host => { host.append((window as any).originalChoices[0]); });
		await expectSelection(page, field, 'replacement-b', null);
		await expect(page.getByText('Replacement B', { exact: true })).toHaveCount(0);
		expect(await page.locator(`#${field.id}`).evaluate(host => (host as any).validity.valueMissing)).toBe(true);
		await page.locator(`#${field.id}`).evaluate((host, field) => {
			host.append(...(window as any).originalChoices.slice(1));
			(host as any).value = field.initial;
		}, field);
		await expectSelection(page, field, field.initial);
		expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	});

	test(`${field.id}: one cancelable change exposes tentative state; cancellation rolls back and equal author writes win`, async ({ page }) => {
		await open(page);
		await page.locator(`#${field.id}`).evaluate(host => {
			(window as any).attempts = [];
			(window as any).acceptByWrite = false;
			host.addEventListener('en-change', event => {
				const field = host as any;
				(window as any).attempts.push({ value: field.value, proposed: (event as CustomEvent).detail.proposed,
					form: new FormData(document.querySelector('form')!).getAll(field.name), cancelable: event.cancelable });
				event.preventDefault();
				if ((window as any).acceptByWrite) field.value = field.value;
			});
		});
		await choose(page, field);
		await expectSelection(page, field, field.initial);
		await page.evaluate(() => { (window as any).acceptByWrite = true; });
		await choose(page, field);
		await expectSelection(page, field, field.proposed);
		expect(await page.evaluate(() => (window as any).attempts)).toEqual(Array(2).fill({
			value: field.proposed, proposed: field.proposed, form: [field.proposed], cancelable: true,
		}));
		expect(await page.locator(`#${field.id}`).evaluate(host => 'controlled' in host)).toBe(false);
		await page.getByRole('button', { name: 'Reset selections', exact: true }).click();
		await expectSelection(page, field, field.initial);
		expect(await page.evaluate(() => (window as any).attempts)).toHaveLength(2);
	});

	test(`${field.id}: listener removal, disabling or renaming of a proposed child rejects an obsolete choice`, async ({ page }) => {
		await open(page);
		for (const mutation of ['remove', 'disable', 'rename'] as const) {
			await page.locator(`#${field.id}`).evaluate((host, { field, mutation }) => {
				const child = host.querySelector(`${field.tag}[value="${field.proposed}"]`)!;
				(window as any).mutatedChoice = child;
				host.addEventListener('en-change', () => {
					if (mutation === 'remove') child.remove();
					if (mutation === 'disable') (child as any).disabled = true;
					if (mutation === 'rename') (child as any).value = 'renamed-during-dispatch';
				}, { once: true });
			}, { field, mutation });
			await choose(page, field);
			await expectSelection(page, field, field.initial);
			await page.locator(`#${field.id}`).evaluate((host, field) => {
				const child = (window as any).mutatedChoice;
				child.value = field.proposed; child.disabled = false;
				if (!child.isConnected) host.prepend(child);
			}, field);
			await expect(page.locator(field.id === 'format' ? '#format select option[value="png"]' : '#appearance input[value="light"]')).toBeEnabled();
		}
	});

	test(`${field.id}: invalid descriptors do not expose stale items or claim child-owned selection`, async ({ page }) => {
		await open(page);
		await recordChanges(page);
		await page.locator(`#${field.id}`).evaluate((host, field) => {
			host.querySelectorAll(`:scope > ${field.tag}`).forEach(child => child.remove());
			const child = document.createElement(field.tag);
			child.id = 'invalid-choice'; child.textContent = 'Authored choice'; host.append(child);
		}, field);
		await expect(page.locator(`#${field.id} [part~="error"]`)).toHaveText(`${field.tag} requires an explicit ${field.id === 'appearance' ? 'nonempty ' : ''}value.`);
		await expect(page.locator(field.id === 'format' ? '#format select option' : '#appearance input[type="radio"]')).toHaveCount(0);
		await expect.poll(() => page.locator(`#${field.id}`).evaluate(host => (host as any).checkValidity())).toBe(false);
		await page.locator('#invalid-choice').evaluate((child, value) => { (child as any).value = value; }, field.initial);
		await expectSelection(page, field, field.initial);
		for (const attribute of ['selected', 'checked']) {
			await page.locator('#invalid-choice').evaluate((child, attribute) => child.setAttribute(attribute, ''), attribute);
			await expect(page.locator(`#${field.id} [part~="error"]`)).toHaveText('Selection children do not own selected or checked state; set the parent value instead.');
			await expect(page.locator(field.id === 'format' ? '#format select option' : '#appearance input[type="radio"]')).toHaveCount(0);
			await page.locator('#invalid-choice').evaluate((child, attribute) => child.removeAttribute(attribute), attribute);
			await expectSelection(page, field, field.initial);
		}
		expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	});

	test(`${field.id}: disabled or missing accepted choices are omitted without auto-selecting a replacement in either source`, async ({ page }) => {
		await open(page);
		await recordChanges(page);
		for (const source of ['children', 'items'] as const) {
			if (source === 'items') await page.locator(`#${field.id}`).evaluate((host, field) => {
				host.querySelectorAll(`:scope > ${field.tag}`).forEach(child => child.remove());
				(host as any).items = [{ value: field.initial, label: 'Initial' }, { value: field.proposed, label: 'Alternative', disabled: true }];
			}, field);
			else await page.locator(`#${field.id} ${field.tag}[value="${field.proposed}"]`).evaluate(child => { (child as any).disabled = true; });
			await page.locator(`#${field.id}`).evaluate((host, value) => { (host as any).value = value; }, field.proposed);
			// An unavailable accepted ID remains available to the application but cannot submit.
			await expect(page.locator(`#${field.id}`)).toHaveJSProperty('value', field.proposed);
			await expect.poll(() => page.locator('form').evaluate((form, name) => new FormData(form as HTMLFormElement).getAll(name), field.id)).toEqual([]);
			await expect.poll(() => page.locator(`#${field.id}`).evaluate(host => (host as any).validity.valueMissing)).toBe(true);
			await page.locator(`#${field.id}`).evaluate(host => { (host as any).value = 'missing'; });
			await expectSelection(page, field, 'missing', null);
			await page.locator(`#${field.id}`).evaluate((host, value) => { (host as any).value = value; }, field.initial);
			await expectSelection(page, field, field.initial);
		}
		expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	});
}

test('select child edits update private option labels, values and availability; empty text uses label fallback', async ({ page }) => {
	await open(page);
	await page.locator('#format select').focus();
	await page.locator('#format select').evaluate(node => { (window as any).nativeSelect = node; });
	await page.locator('#format-svg').evaluate(child => {
		child.setAttribute('label', 'Attribute fallback'); child.textContent = 'Scalable vector';
	});
	await expect(page.locator('#format option[value="svg"]')).toHaveText('Scalable vector');
	await page.locator('#format-svg').evaluate(child => { child.textContent = ''; });
	await expect(page.locator('#format option[value="svg"]')).toHaveText('Attribute fallback');
	await expect(page.locator('#format select')).toBeFocused();
	await page.locator('#format').evaluate(host => {
		const child = document.createElement('en-select-option') as any;
		child.id = 'format-webp'; child.value = 'webp'; child.textContent = 'WebP'; host.append(child);
	});
	await expect(page.locator('#format option[value="webp"]')).toHaveText('WebP');
	await page.locator('#format select').selectOption('webp');
	await expectSelection(page, fields[0], 'webp');
	await page.locator('#format-webp').evaluate(child => { (child as any).value = 'webp-lossless'; });
	await expect(page.locator('#format-webp')).toHaveAttribute('value', 'webp-lossless');
	await expectSelection(page, fields[0], 'webp', null);
	await page.locator('#format select').selectOption('webp-lossless');
	await expectSelection(page, fields[0], 'webp-lossless');
	await page.locator('#format-webp').evaluate(child => { (child as any).disabled = true; });
	await expect(page.locator('#format-webp')).toHaveAttribute('disabled', '');
	await expect(page.locator('#format option[value="webp-lossless"]')).toBeDisabled();
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('format'))).toEqual([]);
	await page.locator('#format-webp').evaluate(child => child.remove());
	await expectSelection(page, fields[0], 'webp-lossless', null);
	expect(await page.locator('#format select').evaluate(node => node === (window as any).nativeSelect)).toBe(true);
});

test('segmented labels retain their authored rich nodes while additions, renaming and disabled states change', async ({ page, browserName }, testInfo) => {
	await open(page);
	await page.locator('#rich-light').evaluate(node => { (window as any).richLabel = node; });
	await page.locator('#rich-light').click();
	await expectSelection(page, fields[1], 'light');
	await page.locator('#rich-light strong').evaluate(node => { node.textContent = 'Bright'; });
	await expect(page.getByRole('radio', { name: 'Bright mode', exact: true })).toBeChecked();
	await page.locator('#appearance').evaluate(host => {
		const child = document.createElement('en-segmented-item') as any;
		child.id = 'appearance-auto'; child.value = 'auto'; child.label = 'Automatic'; host.append(child);
	});
	// Playwright's name calculator omits fallback text through these nested slots.
	// The real Chromium AX tree names the wrapped radio from that rendered text.
	const addedRadio = page.locator('#appearance input[type="radio"][value="auto"]');
	await expect(addedRadio).toBeVisible();
	await expect(page.locator('#appearance-auto slot')).toHaveText('Automatic');
	if (browserName === 'chromium') {
		const session = await page.context().newCDPSession(page);
		const { nodes } = await session.send('Accessibility.getFullAXTree');
		const choice = nodes.filter(node => node.role?.value === 'radio' && node.name?.value === 'Automatic');
		expect(choice).toHaveLength(1);
		await testInfo.attach('native-fallback-name', { body: JSON.stringify(choice, null, 2), contentType: 'application/json' });
		await session.detach();
	} else testInfo.annotations.push({ type: 'coverage', description: 'Rendered fallback label and native interaction verified; real screen-reader naming remains manual. Playwright does not compute this nested-slot fallback name.' });
	await choose(page, fields[1], 'auto');
	await expectSelection(page, fields[1], 'auto');
	await page.locator('#appearance-auto').evaluate(child => { (child as any).value = 'system'; });
	await expect(page.locator('#appearance-auto')).toHaveAttribute('value', 'system');
	await expectSelection(page, fields[1], 'auto', null);
	await choose(page, fields[1], 'system');
	await page.locator('#appearance-auto').evaluate(child => { (child as any).disabled = true; });
	await expect(page.locator('#appearance input[type="radio"][value="system"]')).toBeDisabled();
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('appearance'))).toEqual([]);
	await page.locator('#appearance-auto').evaluate(child => child.remove());
	await expectSelection(page, fields[1], 'system', null);
	expect(await page.locator('#rich-light').evaluate(node => node === (window as any).richLabel)).toBe(true);
	await expect(page.locator('#rich-light strong')).toBeVisible();
});

test('segmented child labels have one Tab entry and arrow navigation follows RTL while skipping disabled choices', async ({ page }) => {
	await open(page);
	await page.locator('#between').focus();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('radio', { name: 'Dark mode', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expectSelection(page, fields[1], 'light');
	await page.keyboard.press('Tab');
	await expect(page.locator('#after')).toBeFocused();
	await page.locator('#appearance').evaluate(host => { host.dir = 'rtl'; });
	await page.locator('#between').focus();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('radio', { name: 'Light mode', exact: true })).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expectSelection(page, fields[1], 'dark');
	await page.keyboard.press('Shift+Tab');
	await expect(page.locator('#between')).toBeFocused();
});

test('native submit and reset preserve one entry per parent; the form can cancel reset', async ({ page }) => {
	await open(page);
	await choose(page, fields[0]);
	await choose(page, fields[1]);
	await page.getByRole('button', { name: 'Submit selections', exact: true }).click();
	expect(await page.evaluate(() => (window as any).selectionSubmissions)).toEqual([[['format', 'png'], ['appearance', 'light']]]);
	await page.locator('form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
	await page.getByRole('button', { name: 'Reset selections', exact: true }).click();
	await expectSelection(page, fields[0], 'png');
	await expectSelection(page, fields[1], 'light');
	await page.getByRole('button', { name: 'Reset selections', exact: true }).click();
	await expectSelection(page, fields[0], 'svg');
	await expectSelection(page, fields[1], 'dark');
});

test.describe('narrow pointer targets', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
	test('a rich label and the surrounding frame activate the nearest enabled item without redirecting disabled taps', async ({ page, browserName }, testInfo) => {
		await open(page);
		if (browserName === 'firefox') testInfo.annotations.push({ type: 'coverage', description: 'Firefox uses a trusted mouse route; Chromium and WebKit exercise touch taps. Firefox desktop touch emulation does not produce native click activation reliably through slots.' });
		const activate = async (x: number, y: number) => browserName === 'firefox' ? page.mouse.click(x, y) : page.touchscreen.tap(x, y);
		const rich = page.locator('#rich-light');
		if (browserName === 'firefox') await rich.click(); else await rich.tap();
		await expectSelection(page, fields[1], 'light');
		await page.locator('#appearance').evaluate(host => { (host as HTMLElement).style.setProperty('--en-segmented-control-frame-inset', '8px'); });
		for (const value of ['dark', 'sepia']) {
			const point = await page.locator('#appearance').evaluate((host, value) => {
				const control = host.shadowRoot!.querySelector(`input[value="${value}"]`)!;
				const label = control.closest('label')!.getBoundingClientRect();
				const frame = host.shadowRoot!.querySelector('[part~="options"]')!.getBoundingClientRect();
				return { x: label.x + label.width / 2, y: (frame.top + label.top) / 2, gap: label.top - frame.top };
			}, value);
			expect(point.gap).toBeGreaterThan(0);
			await activate(point.x, point.y);
			await expectSelection(page, fields[1], 'dark');
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	});
});

// Append to packages/elements/src/selection-authoring/tests/children.spec.ts.
// These cases use its existing test, expect, open, hydrate, fields and helpers.
test('segmented descriptor roots reject interactive or hidden semantics consistently in SSR and the live group', async ({ page, request }) => {
	await open(page);
	await recordChanges(page);
	for (const [attribute, value] of [['tabindex', '0'], ['contenteditable', 'true'], ['inert', ''], ['aria-hidden', 'true']]) {
		const response = await request.get(`/descriptor-diagnostic?attribute=${attribute}`);
		expect(response.status()).toBe(422);
		const diagnostic = await response.json();
		expect(diagnostic.name).toBe('TypeError');
		expect(diagnostic.message).toBe(attribute === 'tabindex' || attribute === 'contenteditable'
			? 'Projected choice labels must contain noninteractive content only.'
			: 'Projected choice roots must not be inert or aria-hidden; use hidden to make a choice unavailable.');
		await page.locator('#appearance-dark').evaluate((child, { attribute, value }) => child.setAttribute(attribute, value), { attribute, value });
		await expect(page.locator('#appearance [part~="error"]')).toHaveText(diagnostic.message);
		await expect(page.locator('#appearance input[type="radio"]')).toHaveCount(0);
		await expect(page.locator('#appearance')).toHaveJSProperty('value', 'dark');
		await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('appearance'))).toEqual([]);
		await page.locator('#between').focus();
		await page.keyboard.press('Tab');
		await expect(page.locator('#after')).toBeFocused();
		await page.locator('#appearance-dark').evaluate((child, attribute) => child.removeAttribute(attribute), attribute);
		await expectSelection(page, fields[1], 'dark');
		await page.locator('#between').focus();
		await page.keyboard.press('Tab');
		await expect(page.getByRole('radio', { name: 'Dark mode', exact: true })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(page.locator('#after')).toBeFocused();
	}
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
});

test('hiding or disabling a focused segmented choice recovers focus within that group without changing its accepted value or stealing outside focus', async ({ page }) => {
	await open(page);
	await recordChanges(page);
	const dark = page.getByRole('radio', { name: 'Dark mode', exact: true });
	const light = page.getByRole('radio', { name: 'Light mode', exact: true });
	for (const attribute of ['hidden', 'disabled']) {
		await dark.focus();
		await page.locator('#appearance-dark').evaluate((child, attribute) => child.setAttribute(attribute, ''), attribute);
		await expect(light).toBeFocused();
		await expect(page.locator('#appearance')).toHaveJSProperty('value', 'dark');
		await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('appearance'))).toEqual([]);
		await expect.poll(() => page.locator('#appearance').evaluate(host => (host as any).validity.valueMissing)).toBe(true);
		await expect(page.locator('#appearance input[type="radio"][tabindex="0"]')).toHaveCount(1);
		await page.keyboard.press('Tab');
		await expect(page.locator('#after')).toBeFocused();
		await page.locator('#appearance-dark').evaluate((child, attribute) => child.removeAttribute(attribute), attribute);
		await expectSelection(page, fields[1], 'dark');
		await expect(page.locator('#after')).toBeFocused();
		// A consumer may deliberately move focus before the queued catalog update.
		await dark.focus();
		await page.locator('#appearance-dark').evaluate((child, attribute) => {
			child.setAttribute(attribute, '');
			(document.querySelector('#after') as HTMLInputElement).focus();
		}, attribute);
		await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('appearance'))).toEqual([]);
		await expect(page.locator('#after')).toBeFocused();
		await page.locator('#appearance-dark').evaluate((child, attribute) => child.removeAttribute(attribute), attribute);
		await expectSelection(page, fields[1], 'dark');
		await expect(page.locator('#after')).toBeFocused();
	}
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
});

test('an optional select submits its empty placeholder while required mode blocks submission until a real option is chosen', async ({ page }) => {
	await open(page);
	await page.locator('#format').evaluate(async host => {
		(host as any).required = false;
		(host as any).placeholder = 'Choose format';
		await (host as any).updateComplete;
	});
	await page.locator('#format select').selectOption('');
	await expectSelection(page, fields[0], '');
	await expect.poll(() => page.locator('#format').evaluate(host => (host as any).checkValidity())).toBe(true);
	await page.getByRole('button', { name: 'Submit selections', exact: true }).click();
	expect(await page.evaluate(() => (window as any).selectionSubmissions)).toEqual([[['format', ''], ['appearance', 'dark']]]);
	await page.locator('#format').evaluate(async host => {
		(host as any).required = true;
		await (host as any).updateComplete;
	});
	await expectSelection(page, fields[0], '');
	await expect.poll(() => page.locator('#format').evaluate(host => (host as any).validity.valueMissing)).toBe(true);
	await page.getByRole('button', { name: 'Submit selections', exact: true }).click();
	await expect(page.locator('#format select')).toBeFocused();
	expect(await page.evaluate(() => (window as any).selectionSubmissions)).toHaveLength(1);
	await page.locator('#format select').selectOption('png');
	await expectSelection(page, fields[0], 'png');
	await expect.poll(() => page.locator('#format').evaluate(host => (host as any).checkValidity())).toBe(true);
	await page.getByRole('button', { name: 'Submit selections', exact: true }).click();
	expect(await page.evaluate(() => (window as any).selectionSubmissions)).toEqual([
		[['format', ''], ['appearance', 'dark']], [['format', 'png'], ['appearance', 'dark']],
	]);
});

test('pasting edited segmented outerHTML after hydration creates an independent projected choice', async ({ page }) => {
	await open(page);
	await recordChanges(page);
	await page.locator('#appearance').evaluate(host => {
		const original = host.querySelector('#appearance-dark')!;
		(window as any).pasteOriginal = {
			descriptor: original, rich: original.querySelector('#rich-dark'),
			radio: host.shadowRoot!.querySelector('input[value="dark"]'),
		};
		const template = document.createElement('template');
		template.innerHTML = original.outerHTML;
		const copy = template.content.firstElementChild!;
		copy.id = 'appearance-contrast'; copy.setAttribute('value', 'contrast');
		copy.querySelector('#rich-dark')!.id = 'rich-contrast';
		copy.querySelector('strong')!.textContent = 'High contrast';
		// Keep the copied runtime slot: consumers should not clean private metadata.
		(window as any).pasteRetainedSlot = copy.getAttribute('slot') !== null && copy.getAttribute('slot') === original.getAttribute('slot');
		host.insertAdjacentHTML('beforeend', template.innerHTML);
	});
	expect(await page.evaluate(() => (window as any).pasteRetainedSlot)).toBe(true);
	await expect(page.getByRole('radio', { name: 'High contrast mode', exact: true })).toHaveCount(1);
	await expect(page.locator('#rich-contrast strong')).toBeVisible();
	await expect(page.locator('#appearance input[type="radio"]')).toHaveCount(4);
	await expectSelection(page, fields[1], 'dark');
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	await page.locator('#rich-contrast').click();
	await expectSelection(page, fields[1], 'contrast');
	expect(await page.evaluate(() => (window as any).changes)).toHaveLength(1);
	await page.locator('#appearance-contrast').evaluate(child => {
		(window as any).pastedChoice = child;
		(window as any).pastedRich = child.querySelector('#rich-contrast');
		child.remove();
	});
	await expect(page.getByRole('radio', { name: 'High contrast mode', exact: true })).toHaveCount(0);
	await expectSelection(page, fields[1], 'contrast', null);
	await page.locator('#appearance').evaluate(host => { host.append((window as any).pastedChoice); });
	await expectSelection(page, fields[1], 'contrast');
	await expect(page.locator('#rich-contrast')).toBeVisible();
	expect(await page.locator('#appearance').evaluate(host => {
		const original = (window as any).pasteOriginal;
		return [host.querySelector('#appearance-dark') === original.descriptor,
			host.querySelector('#rich-dark') === original.rich,
			host.shadowRoot!.querySelector('input[value="dark"]') === original.radio,
			host.querySelector('#rich-contrast') === (window as any).pastedRich];
	})).toEqual([true, true, true, true]);
	expect(await page.evaluate(() => (window as any).changes)).toHaveLength(1);
	await page.locator('#rich-dark').click();
	await expectSelection(page, fields[1], 'dark');
	expect(await page.evaluate(() => (window as any).changes.map((change: any) => change.proposed))).toEqual(['contrast', 'dark']);
});

test('a cloned segmented label gets its own choice and same-turn reordering preserves native and rich-node identity', async ({ page }) => {
	await open(page);
	await recordChanges(page);
	await page.locator('#appearance').evaluate(host => {
		const original = host.querySelector('#appearance-light')!;
		const copy = original.cloneNode(true) as HTMLElement;
		copy.id = 'appearance-soft'; copy.setAttribute('value', 'soft');
		copy.querySelector('#rich-light')!.id = 'rich-soft';
		copy.querySelector('strong')!.textContent = 'Soft';
		(window as any).cloneOriginal = { descriptor: original, rich: original.querySelector('#rich-light'),
			radio: host.shadowRoot!.querySelector('input[value="light"]') };
		(window as any).clonedRich = copy.querySelector('#rich-soft');
		(window as any).cloneRetainedSlot = copy.getAttribute('slot') !== null && copy.getAttribute('slot') === original.getAttribute('slot');
		host.append(copy);
	});
	expect(await page.evaluate(() => (window as any).cloneRetainedSlot)).toBe(true);
	const soft = page.getByRole('radio', { name: 'Soft mode', exact: true });
	await expect(soft).toHaveCount(1);
	await expect(page.locator('#rich-soft')).toBeVisible();
	await expectSelection(page, fields[1], 'dark');
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	await soft.focus();
	await soft.press('Space');
	await expectSelection(page, fields[1], 'soft');
	await soft.evaluate(node => { (window as any).clonedRadio = node; });
	await page.locator('#appearance').evaluate(host => {
		const copy = host.querySelector('#appearance-soft')!;
		copy.remove();
		host.insertBefore(copy, host.querySelector('#appearance-dark'));
	});
	await expect.poll(() => page.locator('#appearance input[type="radio"]').evaluateAll(radios => radios.map(radio => (radio as HTMLInputElement).value)))
		.toEqual(['light', 'soft', 'dark', 'sepia']);
	await expectSelection(page, fields[1], 'soft');
	expect(await page.locator('#appearance').evaluate(host => {
		const original = (window as any).cloneOriginal;
		return [host.querySelector('#appearance-light') === original.descriptor, host.querySelector('#rich-light') === original.rich,
			host.shadowRoot!.querySelector('input[value="light"]') === original.radio,
			host.shadowRoot!.querySelector('input[value="soft"]') === (window as any).clonedRadio,
			host.querySelector('#rich-soft') === (window as any).clonedRich];
	})).toEqual([true, true, true, true, true]);
	await expect(page.locator('#rich-soft')).toBeVisible();
	expect(await page.evaluate(() => (window as any).changes.map((change: any) => change.proposed))).toEqual(['soft']);
});

test('pasted and cloned select descriptors preserve the native picker and original option while their entries follow insertion and removal', async ({ page }) => {
	await open(page);
	await recordChanges(page);
	await page.locator('#format').evaluate(host => {
		(window as any).selectOriginal = { picker: host.shadowRoot!.querySelector('select'),
			option: host.shadowRoot!.querySelector('option[value="svg"]'), descriptor: host.querySelector('#format-svg') };
	});
	for (const [method, value, label] of [['paste', 'webp', 'WebP'], ['clone', 'jpeg', 'JPEG']]) {
		await page.locator('#format').evaluate((host, { method, value, label }) => {
			const original = host.querySelector('#format-svg')!;
			if (method === 'paste') {
				const template = document.createElement('template'); template.innerHTML = original.outerHTML;
				const copy = template.content.firstElementChild!;
				copy.id = `format-${value}`; copy.setAttribute('value', value); copy.textContent = label;
				host.insertAdjacentHTML('beforeend', template.innerHTML);
			} else {
				const copy = original.cloneNode(true) as HTMLElement;
				copy.id = `format-${value}`; copy.setAttribute('value', value); copy.textContent = label; host.append(copy);
			}
		}, { method, value, label });
		await expect(page.locator(`#format select option[value="${value}"]`)).toHaveText(label);
		await expect(page.locator(`#format select option[value="${value}"]`)).toHaveCount(1);
		expect(await page.evaluate(() => (window as any).changes)).toHaveLength(method === 'paste' ? 0 : 1);
		await page.locator('#format select').selectOption({ label });
		await expectSelection(page, fields[0], value);
		await page.locator(`#format-${value}`).evaluate(child => { (window as any).removedFormat = child; child.remove(); });
		await expect(page.locator(`#format select option[value="${value}"]`)).toHaveCount(0);
		await expectSelection(page, fields[0], value, null);
		await page.locator('#format').evaluate(host => { host.append((window as any).removedFormat); });
		await expectSelection(page, fields[0], value);
		expect(await page.locator('#format').evaluate(host => {
			const original = (window as any).selectOriginal;
			return [host.shadowRoot!.querySelector('select') === original.picker,
				host.shadowRoot!.querySelector('option[value="svg"]') === original.option,
				host.querySelector('#format-svg') === original.descriptor];
		})).toEqual([true, true, true]);
		expect(await page.evaluate(() => (window as any).changes)).toHaveLength(method === 'paste' ? 1 : 2);
	}
	await expect(page.locator('#format select option')).toHaveText(['PNG', 'SVG', 'AVIF', 'WebP', 'JPEG']);
	expect(await page.evaluate(() => (window as any).changes.map((change: any) => change.proposed))).toEqual(['webp', 'jpeg']);
});

test('same-turn transfer between segmented parents preserves the receiving projection when its observer is queued first', async ({ page }) => {
	await open(page);
	await recordChanges(page);
	await page.locator('form').evaluate(form => {
		const receiver = document.createElement('en-segmented-control') as any;
		receiver.id = 'receiver'; receiver.setAttribute('name', 'receiver'); receiver.setAttribute('value', 'receiver-default');
		receiver.items = [{ value: 'receiver-default', label: 'Receiver default' }];
		const receiverLabel = document.createElement('span'); receiverLabel.slot = 'label'; receiverLabel.textContent = 'Receiver choices'; receiver.append(receiverLabel);
		form.append(receiver);
		const donor = document.createElement('en-segmented-control') as any;
		donor.id = 'donor'; donor.setAttribute('name', 'donor'); donor.setAttribute('value', 'donor-stay');
		const donorLabel = document.createElement('span'); donorLabel.slot = 'label'; donorLabel.textContent = 'Donor choices'; donor.append(donorLabel);
		const moving = document.createElement('en-segmented-item'); moving.id = 'moving-choice'; moving.setAttribute('value', 'moving');
		const rich = document.createElement('strong'); rich.id = 'moving-rich'; rich.textContent = 'Moving item'; moving.append(rich);
		const stay = document.createElement('en-segmented-item'); stay.setAttribute('value', 'donor-stay'); stay.textContent = 'Donor stay';
		donor.append(moving, stay); form.append(donor);
		(window as any).movingNodes = { child: moving, rich };
	});
	await expect(page.locator('#receiver').getByRole('radio', { name: 'Receiver default', exact: true })).toBeChecked();
	await expect(page.locator('#donor').getByRole('radio', { name: 'Donor stay', exact: true })).toBeChecked();
	await expect(page.locator('#donor').getByRole('radio', { name: 'Moving item', exact: true })).toBeVisible();
	await page.locator('#donor').evaluate(host => { (window as any).donorStayRadio = host.shadowRoot!.querySelector('input[value="donor-stay"]'); });
	await page.evaluate(() => {
		const receiver = document.querySelector('#receiver')!;
		const moving = document.querySelector('#moving-choice')!;
		(window as any).oldMovingSlot = moving.getAttribute('slot');
		// Queue the receiver before donor removal in this one synchronous task.
		receiver.querySelector('[slot="label"]')!.textContent = 'Receiver choices updated';
		receiver.append(moving);
	});
	await expect(page.locator('#receiver').getByRole('radio', { name: 'Moving item', exact: true })).toHaveCount(1);
	await expect(page.locator('#moving-rich')).toBeVisible();
	await expect(page.locator('#donor').getByRole('radio', { name: 'Moving item', exact: true })).toHaveCount(0);
	await expect(page.locator('#receiver')).toHaveJSProperty('value', 'receiver-default');
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('receiver'))).toEqual([]);
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('donor'))).toEqual(['donor-stay']);
	// Both fresh groups allocate the same first local projection key. Its ownership,
	// rather than equality of the attribute string, must govern donor cleanup.
	expect(await page.locator('#moving-choice').evaluate(child => child.getAttribute('slot') !== null && child.getAttribute('slot') === (window as any).oldMovingSlot)).toBe(true);
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	await page.locator('#moving-rich').click();
	await expect(page.locator('#receiver')).toHaveJSProperty('value', 'moving');
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('receiver'))).toEqual(['moving']);
	await page.evaluate(() => {
		const donor = document.querySelector('#donor')!;
		donor.querySelector('[slot="label"]')!.textContent = 'Donor choices updated';
		donor.prepend(document.querySelector('#moving-choice')!);
	});
	await expect(page.locator('#donor').getByRole('radio', { name: 'Moving item', exact: true })).toHaveCount(1);
	await expect(page.locator('#moving-rich')).toBeVisible();
	await expect(page.locator('#receiver').getByRole('radio', { name: 'Receiver default', exact: true })).toHaveCount(1);
	await expect(page.locator('#receiver')).toHaveJSProperty('value', 'moving');
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('receiver'))).toEqual([]);
	expect(await page.evaluate(() => {
		const nodes = (window as any).movingNodes;
		return [document.querySelector('#moving-choice') === nodes.child, document.querySelector('#moving-rich') === nodes.rich,
			document.querySelector('#donor')!.shadowRoot!.querySelector('input[value="donor-stay"]') === (window as any).donorStayRadio];
	})).toEqual([true, true, true]);
	expect(await page.evaluate(() => (window as any).changes)).toHaveLength(1);
	await page.locator('#moving-rich').click();
	await expect(page.locator('#donor')).toHaveJSProperty('value', 'moving');
	await expect.poll(() => page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).getAll('donor'))).toEqual(['moving']);
	expect(await page.evaluate(() => (window as any).changes.map((change: any) => [change.id, change.proposed]))).toEqual([['receiver', 'moving'], ['donor', 'moving']]);
});

test('a prepended pasted SSR item cannot take the original descriptor projection or native radio identity during hydration', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await open(page, { hydrate: false });
	await recordChanges(page);
	await page.locator('#appearance input[value="dark"]').focus();
	await page.locator('#appearance').evaluate(host => {
		const original = host.querySelector('#appearance-dark')!;
		const template = document.createElement('template');
		template.innerHTML = original.outerHTML;
		const pasted = template.content.firstElementChild!;
		pasted.id = 'appearance-other'; pasted.setAttribute('value', 'other');
		pasted.querySelector('#rich-dark')!.id = 'rich-other';
		pasted.querySelector('strong')!.textContent = 'Other';
		(window as any).prehydratePaste = {
			original, rich: original.querySelector('#rich-dark'), slot: original.getAttribute('slot'),
			radio: host.shadowRoot!.querySelector('input[value="dark"]'),
			pasted, pastedRich: pasted.querySelector('#rich-other'),
		};
		// The copy precedes the original and deliberately retains the same SSR key.
		host.prepend(pasted);
	});
	expect(await page.locator('#appearance-other').evaluate(child => {
		const saved = (window as any).prehydratePaste;
		return saved.slot !== null && child.getAttribute('slot') === saved.slot;
	})).toBe(true);
	await hydrate(page);
	await expect(page.locator('#appearance input[type="radio"]')).toHaveCount(4);
	await expect(page.locator('#appearance [part~="error"]')).toHaveCount(0);
	await expect(page.getByRole('radio', { name: 'Other mode', exact: true })).toHaveCount(1);
	await expect(page.getByRole('radio', { name: 'Dark mode', exact: true })).toBeFocused();
	await expectSelection(page, fields[1], 'dark');
	expect(await page.locator('#appearance').evaluate(host => {
		const saved = (window as any).prehydratePaste;
		return [host.querySelector('#appearance-dark') === saved.original,
			host.querySelector('#rich-dark') === saved.rich,
			host.shadowRoot!.querySelector('input[value="dark"]') === saved.radio,
			saved.original.getAttribute('slot') === saved.slot,
			host.querySelector('#appearance-other') === saved.pasted,
			host.querySelector('#rich-other') === saved.pastedRich,
			saved.pasted.getAttribute('slot') !== saved.slot];
	})).toEqual([true, true, true, true, true, true, true]);
	expect(await page.evaluate(() => (window as any).changes)).toEqual([]);
	await page.locator('#rich-other').click();
	await expectSelection(page, fields[1], 'other');
	await page.locator('#appearance-other').evaluate(child => child.remove());
	await expect(page.locator('#appearance input[type="radio"]')).toHaveCount(3);
	await expectSelection(page, fields[1], 'other', null);
	await page.locator('#rich-dark').click();
	await expectSelection(page, fields[1], 'dark');
	expect(await page.evaluate(() => (window as any).changes.map((change: any) => change.proposed))).toEqual(['other', 'dark']);
	expect(errors).toEqual([]);
});
