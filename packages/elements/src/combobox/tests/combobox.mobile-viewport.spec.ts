import { expect, test, type Page } from '@playwright/test';

const host = (page: Page) => page.locator('#asset');
const input = (page: Page) => host(page).getByRole('combobox', { name: 'Asset', exact: true });
const trigger = (page: Page) => host(page).getByRole('button', { name: 'Show options', exact: true });

async function frames(page: Page, count = 6) {
	await page.evaluate(async count => { for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame); }, count);
}
async function viewport(page: Page, values: Record<string, number>, event: 'resize' | 'scroll' = 'resize') {
	await page.evaluate(({ values, event }) => {
		Object.assign((window as any).mobileViewport, values);
		(window as any).mobileViewport.dispatchEvent(new Event(event));
	}, { values, event });
	await frames(page);
}
async function state(page: Page) { return page.evaluate(() => (window as any).mobileViewportState()); }
async function shiftedClientOrigin(page: Page) {
	await host(page).evaluate(element => {
		const root = element.shadowRoot;
		const nativeRect = (window as any).mobileNativeRect as typeof Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function() {
			const rect = nativeRect.call(this);
			if (this.getRootNode() !== root) return rect;
			const viewport = (window as any).mobileViewport;
			// Every same-shadow box uses the modeled convention, including option rows.
			return new DOMRect(rect.x - viewport.offsetLeft, rect.y - viewport.offsetTop, rect.width, rect.height);
		};
	});
}

function expectUsable(state: any) {
	expect(state).toMatchObject({ expanded: 'true', visibility: 'visible', focused: true, sameInput: true, samePopup: true });
	expect(state.popup.width).toBeGreaterThan(0);
	expect(state.popup.height).toBeGreaterThan(40);
	expect(state.overlap).toBe(false);
	expect(state.popup.left).toBeGreaterThanOrEqual(state.viewport.offsetLeft - 1);
	expect(state.popup.right).toBeLessThanOrEqual(state.viewport.offsetLeft + state.viewport.width + 1);
	expect(state.popup.top).toBeGreaterThanOrEqual(state.viewport.offsetTop - 1);
	expect(state.popup.bottom).toBeLessThanOrEqual(state.viewport.offsetTop + state.viewport.height + 1);
}

test.beforeEach(async ({ page, browser }, info) => {
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'scope', description: 'Mobile browser-engine emulation with explicitly modeled visual viewport events and coordinate conventions; trusted taps use native layout. No OS keyboard or physical iPhone result is implied.' });
	await page.goto('/fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	await host(page).evaluate(element => {
		const host = element as HTMLElement;
		host.style.cssText = 'position:fixed;top:50px;left:20px;width:330px;max-width:calc(100vw - 40px);z-index:2';
		const viewport = Object.assign(new EventTarget(), { offsetLeft: 0, offsetTop: 0, width: innerWidth, height: innerHeight, scale: 1 });
		Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
		(window as any).mobileViewport = viewport;
		const nativeRect = Element.prototype.getBoundingClientRect;
		(window as any).mobileNativeRect = nativeRect;
		const input = host.shadowRoot!.querySelector<HTMLInputElement>('input')!;
		const popup = host.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
		(window as any).mobileSavedInput = input;
		(window as any).mobileSavedPopup = popup;
		(window as any).mobileViewportState = () => {
			const currentInput = host.shadowRoot!.querySelector<HTMLInputElement>('input')!;
			const currentPopup = host.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
			const a = nativeRect.call(currentInput), b = nativeRect.call(currentPopup);
			return {
				anchor: a.toJSON(), popup: b.toJSON(), viewport: { offsetLeft: viewport.offsetLeft, offsetTop: viewport.offsetTop, width: viewport.width, height: viewport.height, scale: viewport.scale },
				visibility: getComputedStyle(currentPopup).visibility, expanded: currentInput.getAttribute('aria-expanded'),
				query: currentInput.value, value: (host as any).value, form: new FormData(host.closest('form')!).get('asset'),
				active: currentInput.getAttribute('aria-activedescendant'), open: currentPopup.matches(':popover-open'),
				overlap: b.top < a.bottom && b.bottom > a.top && b.left < a.right && b.right > a.left,
				focused: host.shadowRoot!.activeElement === currentInput,
				sameInput: currentInput === input, samePopup: currentPopup === popup,
			};
		};
	});
});

test('fractional layout coordinates settle without a hidden popup or continuing style writes', async ({ page }) => {
	await host(page).evaluate(element => {
		(element as HTMLElement).style.top = '50.15625px';
		(element as HTMLElement).style.left = '33.46875px';
		(element as HTMLElement).style.width = '300.0625px';
		(element as any).items = [{ value: 'forest', label: 'Forest canvas' }];
	});
	await trigger(page).tap();
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await frames(page);
	const stability = await host(page).evaluate(async element => {
		const popup = element.shadowRoot!.querySelector('[part="popup"]')!;
		let writes = 0;
		const observer = new MutationObserver(records => { writes += records.length; });
		observer.observe(popup, { attributes: true, attributeFilter: ['style'] });
		const samples = [];
		for (let index = 0; index < 20; index++) {
			await new Promise(requestAnimationFrame);
			samples.push((window as any).mobileViewportState());
		}
		observer.disconnect();
		return { writes, samples };
	});
	expect(stability.writes).toBe(0);
	for (const sample of stability.samples) expectUsable(sample);
});

test('each presented resize frame stays beside the editor while the available height shrinks', async ({ page }, info) => {
	await host(page).evaluate(element => {
		(element as any).items = Array.from({ length: 60 }, (_, i) => ({ value: i === 0 ? 'forest' : `item-${i}`, label: i === 0 ? 'Forest canvas' : `Review item ${i}` }));
	});
	await trigger(page).tap();
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await frames(page);
	const before = await state(page); expectUsable(before);
	const records = await page.evaluate(async () => {
		const current = (window as any).mobileViewportState();
		const viewport = (window as any).mobileViewport;
		// Preserve below placement but leave less room than the previously laid-out popup.
		viewport.height = current.anchor.bottom + Math.ceil(current.anchor.top + 15);
		viewport.dispatchEvent(new Event('resize'));
		const records = [];
		for (let i = 0; i < 8; i++) {
			await new Promise(requestAnimationFrame);
			records.push({ frame: i, ...(window as any).mobileViewportState() });
		}
		return records;
	});
	await info.attach('resize-frames', { body: JSON.stringify(records), contentType: 'application/json' });
	for (const record of records) {
		if (record.visibility === 'visible') expect(record.overlap, `presented frame ${record.frame} covers the editor`).toBe(false);
		expect(record).toMatchObject({ value: 'forest', form: 'forest', focused: true, sameInput: true, samePopup: true });
	}
	expectUsable(records.at(-1));
});

for (const convention of ['layout-client-origin', 'shifted-client-origin'] as const) {
	test(`keyboard-sized viewport resize, pan and hide preserve placement with ${convention}`, async ({ page }, info) => {
		await host(page).evaluate(element => {
			(element as HTMLElement).style.top = '210px';
			(element as HTMLElement).style.left = '50px';
			(element as HTMLElement).style.width = '280px';
		});
		if (convention === 'shifted-client-origin') await shiftedClientOrigin(page);
		await input(page).tap();
		await input(page).press('ControlOrMeta+A');
		await page.keyboard.insertText('study');
		await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
		await frames(page);
		const width = await page.evaluate(() => innerWidth);
		const stages = [];
		await viewport(page, { offsetLeft: 30, offsetTop: 160, width: width / 1.25, height: 300, scale: 1.25 });
		stages.push(await state(page)); expectUsable(stages.at(-1));
		await viewport(page, { offsetLeft: 45, offsetTop: 185 }, 'scroll');
		stages.push(await state(page)); expectUsable(stages.at(-1));
		await viewport(page, { offsetLeft: 0, offsetTop: 0, width, height: await page.evaluate(() => innerHeight), scale: 1 });
		stages.push(await state(page)); expectUsable(stages.at(-1));
		for (const stage of stages) expect(stage).toMatchObject({ query: 'study', value: 'forest', form: 'forest' });
		await info.attach('viewport-coordinate-sequence', { body: JSON.stringify({ convention, stages }), contentType: 'application/json' });
		// Hit testing stays native; the fixture changes only reported geometry.
		await host(page).getByRole('option', { name: 'Sunset study', exact: true }).tap();
		await expect(input(page)).toHaveValue('Sunset study');
		expect(await state(page)).toMatchObject({ value: 'sunset', form: 'sunset', expanded: 'false' });
	});
}

test('a trusted trigger retry while suspended retains the draft and resumes when space returns', async ({ page }) => {
	await input(page).tap();
	await input(page).press('ControlOrMeta+A');
	await page.keyboard.insertText('study');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await frames(page);
	const initial = await state(page);
	await viewport(page, { offsetTop: initial.anchor.top - 10, height: initial.anchor.height + 20 });
	expect(await state(page)).toMatchObject({ expanded: 'false', visibility: 'hidden', query: 'study', value: 'forest', active: null });
	await trigger(page).tap();
	await frames(page);
	expect(await state(page)).toMatchObject({ expanded: 'false', query: 'study', value: 'forest', form: 'forest', focused: true, sameInput: true, samePopup: true });
	await viewport(page, { offsetTop: 0, height: await page.evaluate(() => innerHeight) });
	const restored = await state(page); expectUsable(restored);
	expect(restored).toMatchObject({ query: 'study', value: 'forest', form: 'forest' });
	// An explicit exit still wins over retained open intent.
	await input(page).press('Escape');
	await viewport(page, { offsetTop: 15 }, 'scroll');
	expect(await state(page)).toMatchObject({ expanded: 'false', open: false, query: 'Forest canvas', value: 'forest' });
});


test('native page scroll followed by Delete keeps the draft and suggestions beside the same editor', async ({ page }, info) => {
	await host(page).evaluate(element => {
		(element as HTMLElement).style.cssText = 'display:block;width:280px;max-width:100%';
		(element.closest('form') as HTMLElement).style.marginBlockStart = '500px';
		document.body.style.minHeight = '3000px';
	});
	await shiftedClientOrigin(page);
	await input(page).tap();
	await input(page).press('ControlOrMeta+A');
	await page.keyboard.insertText('studyx');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await frames(page);
	const scroll = await page.evaluate(() => {
		const before = scrollY;
		const current = (window as any).mobileViewportState();
		// Native page layout/scroll events, deliberately without claiming a physical swipe.
		window.scrollBy(0, current.anchor.top - 200);
		return { before, after: scrollY };
	});
	expect(scroll.after).toBeGreaterThan(0);
	expect(scroll.after).not.toBe(scroll.before);
	await viewport(page, { offsetTop: 120, height: 250 }, 'scroll');
	await expect(input(page)).toBeFocused();
	// The iPhone Delete key is backward deletion; Playwright names it Backspace.
	await page.keyboard.press('Backspace');
	await frames(page);
	const edited = await state(page);
	await info.attach('page-scroll-delete', { body: JSON.stringify({ scroll, edited }), contentType: 'application/json' });
	expect(edited).toMatchObject({ query: 'study', value: 'forest', form: 'forest', focused: true, sameInput: true, samePopup: true });
	expectUsable(edited);
	await host(page).getByRole('option', { name: 'Fjord study', exact: true }).tap();
	await expect(input(page)).toHaveValue('Fjord study');
	expect(await state(page)).toMatchObject({ value: 'fjord', form: 'fjord', expanded: 'false' });
});
