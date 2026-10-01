import { expect, test, type Locator, type Page } from '@playwright/test';

const hydrate = async (page: Page): Promise<void> => {
	await page.evaluate(() => (window as any).hydrateStyleFixture());
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
};
const paint = (control: Locator) => control.evaluate(node => {
	const style = getComputedStyle(node);
	return Object.fromEntries(['color', 'background-color', 'font-size', 'padding-inline-start', 'padding-block-start', 'border-radius', 'border-top-width', 'min-block-size']
		.map(name => [name, style.getPropertyValue(name)]));
});
const styleState = (host: Locator) => host.evaluate(element => ({
	marked: element.shadowRoot!.querySelectorAll('style[data-en-static-styles]').length,
	sheets: element.shadowRoot!.adoptedStyleSheets?.length ?? 0,
}));

test('SSR styles paint native controls and rich labels with JavaScript disabled', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4461/fixture');
	await expect(page.getByRole('textbox', { name: 'Project title' })).toHaveValue('Server title');
	await expect(page.getByRole('button', { name: 'Save title' })).toBeVisible();
	await expect(page.locator('#layout-choice input[value="grid"]')).toBeChecked();
	await expect(page.getByRole('link', { name: 'Project content' })).toBeVisible();
	for (const id of ['field-a', 'button-a', 'native-nav', 'grid-label']) {
		const state = await styleState(page.locator(`#${id}`));
		expect(state.marked).toBe(1);
		expect(state.sheets).toBe(0);
	}
	expect(await page.locator('#button-a button').evaluate(node => parseFloat(getComputedStyle(node).minBlockSize))).toBeGreaterThan(0);
	await context.close();
});

test('successful hydration adopts static styles without replacing edited native controls or changing paint', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/fixture');
	const input = page.locator('#field-a input');
	await input.fill('Typed before adoption');
	await input.evaluate(node => {
		(window as any).originalField = node;
		(window as any).originalRoot = node.getRootNode();
		(node as HTMLInputElement).setSelectionRange(2, 8);
	});
	const before = await paint(input);
	await hydrate(page);
	await expect(input).toHaveValue('Typed before adoption');
	expect(await input.evaluate(node => ({
		native: node === (window as any).originalField,
		root: node.getRootNode() === (window as any).originalRoot,
		focused: (node.getRootNode() as ShadowRoot).activeElement === node,
		selection: [(node as HTMLInputElement).selectionStart, (node as HTMLInputElement).selectionEnd],
	}))).toEqual({ native: true, root: true, focused: true, selection: [2, 8] });
	expect(await paint(input)).toEqual(before);
	expect(await page.locator('#style-form').evaluate(form => new FormData(form as HTMLFormElement).get('title'))).toBe('Typed before adoption');
	for (const id of ['field-a', 'field-b', 'button-a', 'button-b', 'native-nav', 'grid-label', 'list-label']) {
		const state = await styleState(page.locator(`#${id}`));
		expect(state.marked).toBe(0);
		expect(state.sheets).toBeGreaterThan(0);
	}
	expect(errors).toEqual([]);
});

test('repeated SSR instances and a fresh CSR instance share the same cached sheets', async ({ page }) => {
	await page.goto('/fixture');
	await hydrate(page);
	expect(await page.evaluate(async () => {
		const first = document.querySelector('#button-a')!.shadowRoot!;
		const second = document.querySelector('#button-b')!.shadowRoot!;
		const field = document.querySelector('#field-a')!.shadowRoot!;
		const fresh = document.createElement('en-button') as any;
		fresh.textContent = 'Fresh control';
		document.querySelector('#fresh-elements')!.append(fresh);
		await fresh.updateComplete;
		const same = (left: readonly CSSStyleSheet[], right: readonly CSSStyleSheet[]) => left.length > 0 && left.length === right.length && left.every((sheet, index) => sheet === right[index]);
		return { repeated: same(first.adoptedStyleSheets, second.adoptedStyleSheets),
			fresh: same(first.adoptedStyleSheets, fresh.shadowRoot.adoptedStyleSheets),
			sharedFoundation: first.adoptedStyleSheets.some(sheet => field.adoptedStyleSheets.includes(sheet)) };
	})).toEqual({ repeated: true, fresh: true, sharedFoundation: true });
});

test('consumer adopted sheets, public Parts and native slotted styles retain ownership and order', async ({ page }) => {
	await page.goto('/fixture');
	await page.locator('#button-b').evaluate(host => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync('.en-button { background: rgb(11, 41, 71); }');
		host.shadowRoot!.adoptedStyleSheets = [sheet];
		(window as any).consumerSheet = sheet;
		(window as any).ownedLink = document.querySelector('#owned-link');
		(window as any).richLabel = document.querySelector('#rich-label');
	});
	// Let the existing background transition settle before comparing hydration.
	await expect(page.locator('#button-b button')).toHaveCSS('background-color', 'rgb(11, 41, 71)');
	const before = await paint(page.locator('#button-b button'));
	await hydrate(page);
	expect(await paint(page.locator('#button-b button'))).toEqual(before);
	expect(await page.locator('#button-b').evaluate(host => {
		const sheets = host.shadowRoot!.adoptedStyleSheets;
		return sheets.length > 1 && sheets.at(-1) === (window as any).consumerSheet && sheets.filter(sheet => sheet === (window as any).consumerSheet).length === 1;
	})).toBe(true);
	await expect(page.locator('#button-a button')).toHaveCSS('outline-width', '3px');
	await expect(page.locator('#owned-link')).toHaveCSS('letter-spacing', '3px');
	expect(await page.evaluate(() => document.querySelector('#owned-link') === (window as any).ownedLink && document.querySelector('#rich-label') === (window as any).richLabel)).toBe(true);
});

test('extra template style and stylesheet link retain SSR styles and their original cascade', async ({ page }) => {
	await page.goto('/fixture');
	await expect(page.locator('#style-probe button')).toHaveCSS('border-top-width', '7px');
	await expect(page.locator('#link-probe button')).toHaveCSS('border-bottom-width', '9px');
	await page.evaluate(() => {
		(window as any).consumerStyle = document.querySelector('#style-probe')!.shadowRoot!.querySelector('style[data-consumer-style]');
		(window as any).consumerLink = document.querySelector('#link-probe')!.shadowRoot!.querySelector('link');
	});
	await hydrate(page);
	await expect(page.locator('#style-probe button')).toHaveCSS('border-top-width', '7px');
	await expect(page.locator('#link-probe button')).toHaveCSS('border-bottom-width', '9px');
	for (const id of ['style-probe', 'link-probe']) expect(await styleState(page.locator(`#${id}`))).toEqual({ marked: 1, sheets: 0 });
	expect(await page.evaluate(() => document.querySelector('#style-probe')!.shadowRoot!.querySelector('style[data-consumer-style]') === (window as any).consumerStyle
		&& document.querySelector('#link-probe')!.shadowRoot!.querySelector('link') === (window as any).consumerLink)).toBe(true);
});

test('missing or unknown ownership markers keep the native SSR fallback', async ({ page }) => {
	await page.goto('/fixture');
	await page.evaluate(() => {
		document.querySelector('#button-a')!.shadowRoot!.querySelector('style[data-en-static-styles]')!.removeAttribute('data-en-static-styles');
		document.querySelector('#button-b')!.shadowRoot!.querySelector('style[data-en-static-styles]')!.setAttribute('data-en-static-styles', 'future-version');
	});
	const first = await paint(page.locator('#button-a button'));
	const second = await paint(page.locator('#button-b button'));
	await hydrate(page);
	for (const id of ['button-a', 'button-b']) expect(await page.locator(`#${id}`).evaluate(host => ({ styles: host.shadowRoot!.querySelectorAll('style').length, sheets: host.shadowRoot!.adoptedStyleSheets.length }))).toEqual({ styles: 1, sheets: 0 });
	expect(await paint(page.locator('#button-a button'))).toEqual(first);
	expect(await paint(page.locator('#button-b button'))).toEqual(second);
});

test('unsupported adopted stylesheets retain fallback CSS while ordinary hydration still works', async ({ page }) => {
	await page.addInitScript(() => {
		Reflect.deleteProperty(Document.prototype, 'adoptedStyleSheets');
		Reflect.deleteProperty(ShadowRoot.prototype, 'adoptedStyleSheets');
	});
	await page.goto('/fixture');
	expect(await page.evaluate(() => 'adoptedStyleSheets' in ShadowRoot.prototype)).toBe(false);
	const before = await paint(page.locator('#field-a input'));
	await hydrate(page);
	expect(await paint(page.locator('#field-a input'))).toEqual(before);
	expect(await styleState(page.locator('#field-a'))).toEqual({ marked: 1, sheets: 0 });
	await page.getByRole('textbox', { name: 'Project title' }).fill('Fallback still edits');
	expect(await page.locator('#style-form').evaluate(form => new FormData(form as HTMLFormElement).get('title'))).toBe('Fallback still edits');
});

test('updates and same-document reconnect keep sheet identities without duplication', async ({ page }) => {
	await page.goto('/fixture');
	await hydrate(page);
	expect(await page.locator('#button-b').evaluate(async element => {
		const host = element as any;
		const root = host.shadowRoot;
		const control = root.querySelector('button');
		const sheets = [...root.adoptedStyleSheets];
		host.loading = true; await host.updateComplete;
		host.loading = false; await host.updateComplete;
		const parent = host.parentNode;
		host.remove(); parent.append(host); await host.updateComplete;
		return { sameRoot: host.shadowRoot === root, sameControl: root.querySelector('button') === control,
			sameSheets: root.adoptedStyleSheets.length === sheets.length && sheets.every((sheet, index) => sheet === root.adoptedStyleSheets[index]),
			styles: root.querySelectorAll('style').length };
	})).toEqual({ sameRoot: true, sameControl: true, sameSheets: true, styles: 0 });
});

test('cross-document reconnect retains native nodes and restores paint if sheets cannot be adopted', async ({ page }) => {
	await page.goto('/fixture');
	await hydrate(page);
	const before = await paint(page.locator('#button-b button'));
	const result = await page.evaluate(async () => {
		const iframe = document.createElement('iframe');
		iframe.title = 'Another document';
		document.body.append(iframe);
		const target = iframe.contentDocument!;
		for (const style of document.head.querySelectorAll('style')) target.head.append(style.cloneNode(true));
		target.documentElement.dataset.enAppearance = 'light';
		const host = document.querySelector('#button-b') as any;
		const root = host.shadowRoot;
		const control = root.querySelector('button');
		target.body.append(host);
		await host.updateComplete;
		const style = target.defaultView!.getComputedStyle(control);
		return { sameRoot: host.shadowRoot === root, sameControl: root.querySelector('button') === control,
			owner: host.ownerDocument === target,
			paint: Object.fromEntries(['color', 'background-color', 'font-size', 'padding-inline-start', 'padding-block-start', 'border-radius', 'border-top-width', 'min-block-size'].map(name => [name, style.getPropertyValue(name)])) };
	});
	expect(result).toEqual({ sameRoot: true, sameControl: true, owner: true, paint: before });
});


test('a firstUpdated consumer style keeps SSR fallback and its equal-specificity cascade', async ({ page }) => {
	await page.goto('/fixture');
	const host = page.locator('#first-updated-probe');
	await expect(host.locator('button')).toHaveCSS('border-left-width', '2px');
	await hydrate(page);
	await expect(host.locator('button')).toHaveCSS('border-left-width', '11px');
	expect(await styleState(host)).toEqual({ marked: 1, sheets: 0 });
	const result = await host.evaluate(async element => {
		const component = element as any;
		const root = component.shadowRoot;
		const consumer = root.querySelector('style[data-first-updated-style]');
		component.loading = true;
		await component.updateComplete;
		component.loading = false;
		await component.updateComplete;
		return { sameStyle: root.querySelector('style[data-first-updated-style]') === consumer,
			consumerCount: root.querySelectorAll('style[data-first-updated-style]').length,
			fallbackCount: root.querySelectorAll('style[data-en-static-styles]').length,
			sheetCount: root.adoptedStyleSheets.length };
	});
	expect(result).toEqual({ sameStyle: true, consumerCount: 1, fallbackCount: 1, sheetCount: 0 });
	await expect(host.locator('button')).toHaveCSS('border-left-width', '11px');
});

test('rejected stylesheet adoption retains original SSR paint and an editable hydrated control', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/fixture');
	const host = page.locator('#field-b');
	const input = host.locator('input');
	await host.evaluate(element => {
		const root = element.shadowRoot!;
		const before = [...root.adoptedStyleSheets];
		(window as any).styleRejectionAttempts = 0;
		(window as any).rejectedStyleRoot = root;
		(window as any).rejectedStyleControl = root.querySelector('input');
		Object.defineProperty(root, 'adoptedStyleSheets', {
			configurable: true,
			get: () => before,
			set: () => {
				++(window as any).styleRejectionAttempts;
				throw new DOMException('Fixture rejects sheet adoption', 'NotAllowedError');
			},
		});
	});
	const before = await paint(input);
	await hydrate(page);
	expect(await page.evaluate(() => (window as any).styleRejectionAttempts)).toBeGreaterThan(0);
	expect(await styleState(host)).toEqual({ marked: 1, sheets: 0 });
	expect(await paint(input)).toEqual(before);
	expect(await input.evaluate(node => node === (window as any).rejectedStyleControl && node.getRootNode() === (window as any).rejectedStyleRoot)).toBe(true);
	await input.fill('Still editable after rejection');
	expect(await page.locator('#style-form').evaluate(form => new FormData(form as HTMLFormElement).get('owner'))).toBe('Still editable after rejection');
	await host.evaluate(async element => {
		Reflect.deleteProperty(element.shadowRoot!, 'adoptedStyleSheets');
		(element as any).requestUpdate();
		await (element as any).updateComplete;
	});
	// A retained fallback is stable; later updates do not retry the failed conversion.
	expect(await styleState(host)).toEqual({ marked: 1, sheets: 0 });
	expect(errors).toEqual([]);
});
