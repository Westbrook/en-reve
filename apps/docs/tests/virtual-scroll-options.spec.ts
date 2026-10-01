import { expect, test, type Page } from '@playwright/test';

const path = '/api-examples/virtual-collection.html?progress-report';
const demo = (page: Page) => page.locator('en-virtual-collection-demo');
const row = (page: Page, number: number) => demo(page).locator(`[data-en-virtual-key="asset-${String(number).padStart(5, '0')}"]`);
const viewport = (page: Page) => demo(page).locator('[data-virtual-viewport]');
const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page, browser }, info) => {
	const collected: string[] = []; errors.set(page, collected); page.on('pageerror', error => collected.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]); });

async function openList(page: Page) {
	await page.goto(path);
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await demo(page).getByRole('combobox', { name: 'Presentation', exact: true }).selectOption('list');
	await expect(viewport(page)).toBeVisible();
	await expect(row(page, 1)).toBeVisible();
}
async function request(page: Page, number: number, options: Record<string, string> = {}) {
	return demo(page).evaluate((node: any, { number, options }) => node.controller.scrollToKey(`asset-${String(number).padStart(5, '0')}`, options), { number, options });
}
async function blockDifference(page: Page, number: number, block: 'start' | 'center' | 'end' = 'start') {
	const bounds = await viewport(page).evaluate(node => {
		const box = node.getBoundingClientRect(); const style = getComputedStyle(node);
		return { top: box.top + node.clientTop + (parseFloat(style.scrollPaddingTop) || 0), bottom: box.top + node.clientTop + node.clientHeight - (parseFloat(style.scrollPaddingBottom) || 0) };
	});
	const box = await row(page, number).boundingBox();
	if (!box) return Infinity;
	return Math.abs(block === 'start' ? box.y - bounds.top : block === 'end' ? box.y + box.height - bounds.bottom : box.y + box.height / 2 - (bounds.top + bounds.bottom) / 2);
}
async function selectedOrigin(page: Page) {
	const checkbox = row(page, 1).getByRole('checkbox', { name: 'Select Asset 00001', exact: true });
	await checkbox.focus(); await checkbox.press('Space'); await expect(checkbox).toBeChecked();
	return checkbox;
}
async function samples(page: Page, number: number, options: Record<string, string>, frames = 32) {
	return demo(page).evaluate(async (node: any, { number, options, frames }) => {
		const viewport = node.shadowRoot.querySelector('[data-virtual-viewport]');
		const positions: number[] = [viewport.scrollTop];
		const accepted = node.controller.scrollToKey(`asset-${String(number).padStart(5, '0')}`, options);
		positions.push(viewport.scrollTop);
		for (let index = 0; index < frames; index++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			positions.push(viewport.scrollTop);
		}
		return { accepted, positions };
	}, { number, options, frames });
}

test('nearest confines scrolling to the collection while platform-default all reveals outer ancestors', async ({ page }) => {
	await openList(page); const original = await selectedOrigin(page);
	await page.locator('#example').evaluate(node => {
		node.style.cssText = 'block-size:420px; overflow:auto; margin-block-start:700px; scroll-behavior:auto;';
		const tools = node.querySelector<HTMLElement>('.api-standalone-tools')!;
		tools.style.marginBlockEnd = '600px';
		node.scrollTop = 0; window.scrollTo(0, 0);
	});
	const outer = page.locator('#example');
	expect(await request(page, 5000, { behavior: 'instant', container: 'nearest' })).toBe(true);
	await expect.poll(() => blockDifference(page, 5000)).toBeLessThan(2);
	expect(await outer.evaluate(node => node.scrollTop)).toBe(0);
	expect(await page.evaluate(() => window.scrollY)).toBe(0);
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
	// Omit container and block deliberately: native defaults are all/start.
	expect(await request(page, 6000, { behavior: 'instant' })).toBe(true);
	await expect.poll(() => outer.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
	await expect(row(page, 6000)).toBeInViewport();
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
});

for (const direction of ['ltr', 'rtl'] as const) {
	test(`inline alignment follows logical ${direction} edges inside a horizontal scrollport`, async ({ page }, info) => {
		await openList(page);
		await demo(page).evaluate((node: any, direction) => {
			node.dir = direction;
			const style = document.createElement('style');
			style.textContent = '.list-viewport{inline-size:360px;scroll-padding-inline:20px}ul{inline-size:1100px}li[data-en-virtual-key]{inline-size:240px;margin-inline-start:420px;scroll-margin-inline:10px}';
			node.shadowRoot.append(style);
			node.controller.invalidateMeasurements();
		}, direction);
		const original = await selectedOrigin(page);
		const differences: number[] = [];
		for (const inline of ['start', 'center', 'end'] as const) {
			expect(await request(page, 500, { behavior: 'instant', block: 'center', inline, container: 'nearest' })).toBe(true);
			const difference = async () => {
				const scroll = await viewport(page).evaluate(node => { const box = node.getBoundingClientRect(); return { left: box.left + node.clientLeft + 20, right: box.left + node.clientLeft + node.clientWidth - 20 }; });
				const target = await row(page, 500).boundingBox(); if (!target) return Infinity;
				const start = direction === 'ltr' ? target.x - 10 - scroll.left : scroll.right - target.x - target.width - 10;
				const end = direction === 'ltr' ? target.x + target.width + 10 - scroll.right : scroll.left - target.x + 10;
				return Math.abs(inline === 'start' ? start : inline === 'end' ? end : target.x + target.width / 2 - (scroll.left + scroll.right) / 2);
			};
			await expect.poll(difference).toBeLessThan(2); differences.push(await difference());
			await expect(original).toBeFocused(); await expect(original).toBeChecked();
		}
		const left = await viewport(page).evaluate(node => node.scrollLeft);
		expect(await request(page, 500, { behavior: 'instant', block: 'nearest', inline: 'nearest', container: 'nearest' })).toBe(true);
		await viewport(page).evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
		expect(Math.abs(await viewport(page).evaluate(node => node.scrollLeft) - left)).toBeLessThan(2);
		// Native nearest leaves an oversized target alone when it already
		// encloses both visible inline edges; it must not choose one edge.
		await demo(page).evaluate((node: any, direction) => {
			const style = document.createElement('style');
			style.textContent = 'li[data-en-virtual-key]{inline-size:600px}';
			node.shadowRoot.append(style);
			node.shadowRoot.querySelector('[data-virtual-viewport]').scrollLeft = direction === 'ltr' ? 520 : -520;
		}, direction);
		const oversized = await row(page, 500).boundingBox(); const scrollport = await viewport(page).boundingBox();
		expect(oversized!.x).toBeLessThan(scrollport!.x);
		expect(oversized!.x + oversized!.width).toBeGreaterThan(scrollport!.x + scrollport!.width);
		const oversizedLeft = await viewport(page).evaluate(node => node.scrollLeft);
		expect(await request(page, 500, { behavior: 'instant', block: 'nearest', inline: 'nearest', container: 'nearest' })).toBe(true);
		await viewport(page).evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
		expect(Math.abs(await viewport(page).evaluate(node => node.scrollLeft) - oversizedLeft)).toBeLessThan(2);
		await info.attach('logical-inline-alignment', { body: JSON.stringify({ direction, differences, oversizedLeft }), contentType: 'application/json' });
	});
}

for (const behavior of ['smooth', 'auto'] as const) {
	test(`${behavior} produces intermediate scroll positions and retains focused selection`, async ({ page }, info) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' }); await openList(page);
		const original = await selectedOrigin(page);
		await viewport(page).evaluate((node, behavior) => { node.style.scrollBehavior = behavior === 'auto' ? 'smooth' : 'auto'; }, behavior);
		const observed = await samples(page, 500, { behavior, block: 'start', container: 'nearest' });
		expect(observed.accepted).toBe(true);
		expect(observed.positions[1]).toBe(observed.positions[0]);
		await expect.poll(() => blockDifference(page, 500)).toBeLessThan(2);
		const final = await viewport(page).evaluate(node => node.scrollTop);
		expect(observed.positions.filter(value => value > 0 && value < final - 2).length).toBeGreaterThan(1);
		expect(new Set(observed.positions.map(Math.round)).size).toBeGreaterThan(3);
		await expect(original).toBeFocused(); await expect(original).toBeChecked();
		await info.attach('native-smooth-positions', { body: JSON.stringify({ behavior, final, positions: observed.positions }), contentType: 'application/json' });
	});
}

test('instant bypasses CSS smooth behavior without a sequence of intermediate positions', async ({ page }, info) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' }); await openList(page);
	const original = await selectedOrigin(page);
	await viewport(page).evaluate(node => { node.style.scrollBehavior = 'smooth'; });
	const observed = await samples(page, 500, { behavior: 'instant', block: 'start', container: 'nearest' }, 16);
	await expect.poll(() => blockDifference(page, 500)).toBeLessThan(2);
	const final = await viewport(page).evaluate(node => node.scrollTop);
	expect(final).toBeGreaterThan(10_000);
	expect(observed.positions.filter(value => value > final * 0.1 && value < final * 0.9)).toEqual([]);
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
	await info.attach('native-instant-positions', { body: JSON.stringify({ final, positions: observed.positions }), contentType: 'application/json' });
});

test('keyboard interruption stops an animated reveal and a newer request supersedes it', async ({ page }, info) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' }); await openList(page);
	const original = await selectedOrigin(page);
	await demo(page).evaluate((node: any) => {
		node.interruptionSample = () => {
			const viewport = node.shadowRoot.querySelector('[data-virtual-viewport]');
			const box = viewport.getBoundingClientRect();
			const row = [...node.shadowRoot.querySelectorAll('[data-en-virtual-key]')].find((row: any) => {
				const bounds = row.getBoundingClientRect(); return bounds.bottom > box.top + 1 && bounds.top < box.bottom;
			}) as HTMLElement | undefined;
			if (row) return { scrollTop: viewport.scrollTop, key: row.getAttribute('data-en-virtual-key'), offset: row.getBoundingClientRect().top - box.top, source: 'mounted' };
			// At an input boundary the compositor may be ahead of the range's
			// next scroll event. Record the public geometry's logical anchor too;
			// the next painted window must honor that same record and inset.
			const content = node.shadowRoot.querySelector('ul');
			const position = box.top + viewport.clientTop - content.getBoundingClientRect().top;
			let first = 0; let last = node.model.count - 1;
			while (first < last) {
				const middle = Math.ceil((first + last) / 2);
				if (node.model.offsetOf(middle) <= position) first = middle; else last = middle - 1;
			}
			return { scrollTop: viewport.scrollTop, key: node.model.keyAt(first), offset: node.model.offsetOf(first) - position + viewport.clientTop, source: 'geometry' };
		};
		// Capture at the trusted input boundary, before the controller's reveal
		// listener. A later automation read can observe a queued compositor frame.
		node.ownerDocument.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'Escape') node.interruptedAtInput = node.interruptionSample();
		}, { capture: true, once: true });
	});
	// Keep the full distant jump: every animation frame should have a mounted
	// visible window, including the trusted interruption boundary.
	const observed = await samples(page, 9000, { behavior: 'smooth', container: 'nearest' }, 5);
	expect(observed.accepted).toBe(true);
	// The trusted input capture distinguishes an already mounted row from a
	// logical anchor awaiting range publication; both must retain their inset.
	await page.keyboard.press('Escape');
	const interruptedFrames = await demo(page).evaluate(async (node: any) => {
		const frames = [node.interruptedAtInput, node.interruptionSample()];
		for (let index = 0; index < 12; index++) { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); frames.push(node.interruptionSample()); }
		return frames as { scrollTop: number; key: string | undefined; offset: number | null }[];
	});
	await info.attach('interrupted-visible-anchor', { body: JSON.stringify(interruptedFrames), contentType: 'application/json' });
	// Deferred row measurements may translate scrollTop; the user's visible
	// record and pixel position must settle back to the interrupted location.
	expect(interruptedFrames[0]!.key).toBeTruthy();
	for (const frame of interruptedFrames.slice(-6)) {
		expect(frame.key).toBe(interruptedFrames[0]!.key);
		expect(Math.abs(frame.offset! - interruptedFrames[0]!.offset!)).toBeLessThan(2);
	}
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
	expect(await request(page, 8000, { behavior: 'smooth', container: 'nearest' })).toBe(true);
	expect(await request(page, 200, { behavior: 'instant', block: 'center', container: 'nearest' })).toBe(true);
	await expect.poll(() => blockDifference(page, 200, 'center')).toBeLessThan(2);
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
	await samples(page, 9000, { behavior: 'smooth', container: 'nearest' }, 5);
	// A distinct trusted scroll key takes ownership after interruption. An
	// application scroll following that input must not be pulled back by a
	// deferred correction belonging to the earlier reveal.
	await page.keyboard.press('Escape');
	await page.keyboard.press('ArrowDown');
	await viewport(page).evaluate(node => node.scrollTo({ top: 0, behavior: 'instant' }));
	await viewport(page).evaluate(() => new Promise<void>(resolve => { let frames = 0; const tick = () => ++frames < 12 ? requestAnimationFrame(tick) : resolve(); requestAnimationFrame(tick); }));
	expect(await viewport(page).evaluate(node => node.scrollTop)).toBeLessThan(await viewport(page).evaluate(node => node.clientHeight));
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
	// Reproduce the compositor/main-thread gap deterministically: change the
	// native offset and interrupt in the same task, before its scroll event
	// can publish a replacement range. This must use the geometry fallback.
	await samples(page, 9000, { behavior: 'smooth', container: 'nearest' }, 5);
	const beforePublication = await demo(page).evaluate(async (node: any) => {
		const viewport = node.shadowRoot.querySelector('[data-virtual-viewport]');
		viewport.scrollTo({ top: viewport.scrollTop > 350_000 ? 100_000 : 600_000, behavior: 'instant' });
		const before = node.interruptionSample();
		node.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		const frames = [];
		for (let index = 0; index < 20; index++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			await node.updateComplete;
			frames.push(node.interruptionSample());
		}
		return { before, frames };
	});
	await info.attach('interrupted-before-range-publication', { body: JSON.stringify(beforePublication), contentType: 'application/json' });
	expect(beforePublication.before.source).toBe('geometry');
	for (const frame of beforePublication.frames.slice(-6)) {
		expect(frame.source).toBe('mounted');
		expect(frame.key).toBe(beforePublication.before.key);
		expect(Math.abs(frame.offset - beforePublication.before.offset)).toBeLessThan(2);
	}
	await expect(original).toBeFocused(); await expect(original).toBeChecked();
});

test('the collapsed scrollToKey demo follows the collection and retains editable options', async ({ page }, info) => {
	await openList(page);
	const disclosure = demo(page).locator('details.scroll-demo');
	const summary = disclosure.locator('summary');
	await expect(disclosure).not.toHaveAttribute('open');
	await expect(summary).toHaveText('scrollToKey()');
	expect(await demo(page).evaluate(node => {
		const list = node.shadowRoot!.querySelector('[data-virtual-viewport]')!;
		const details = node.shadowRoot!.querySelector('details.scroll-demo')!;
		return Boolean(list.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING)
			&& details.getBoundingClientRect().top >= list.getBoundingClientRect().bottom;
	})).toBe(true);
	// WebKit retains descendant layout boxes inside closed details; native
	// checkVisibility reflects the actual paint state across shadow roots.
	expect(await disclosure.locator('en-text-field input').evaluate(node => node.checkVisibility())).toBe(false);
	await summary.focus(); await page.keyboard.press('Enter');
	await expect(disclosure).toHaveAttribute('open', '');
	const section = demo(page).getByRole('region', { name: 'scrollToKey()', exact: true });
	await expect(section).toBeVisible();
	await expect(section.getByRole('textbox', { name: 'Asset key', exact: true })).toHaveValue('asset-09000');
	for (const name of ['Scroll behavior', 'Block alignment', 'Inline alignment', 'Scroll containers']) {
		await expect(demo(page).getByRole('combobox', { name, exact: true })).toBeVisible();
	}
	await demo(page).getByRole('combobox', { name: 'Scroll behavior', exact: true }).selectOption('instant');
	await demo(page).getByRole('combobox', { name: 'Block alignment', exact: true }).selectOption('center');
	await demo(page).getByRole('combobox', { name: 'Inline alignment', exact: true }).selectOption('end');
	await demo(page).getByRole('combobox', { name: 'Scroll containers', exact: true }).selectOption('nearest');
	await demo(page).getByRole('textbox', { name: 'Asset key', exact: true }).fill('asset-05000');
	await summary.focus(); await page.keyboard.press('Space');
	await expect(disclosure).not.toHaveAttribute('open');
	expect(await disclosure.locator('[role=region]').evaluate(node => node.checkVisibility())).toBe(false);
	await page.keyboard.press('Enter');
	await expect(disclosure).toHaveAttribute('open', '');
	await expect(section.getByRole('textbox', { name: 'Asset key', exact: true })).toHaveValue('asset-05000');
	for (const [name, value] of [['Scroll behavior', 'instant'], ['Block alignment', 'center'], ['Inline alignment', 'end'], ['Scroll containers', 'nearest']]) {
		await expect(section.getByRole('combobox', { name, exact: true })).toHaveValue(value!);
	}
	await demo(page).getByRole('button', { name: 'Show asset', exact: true }).click();
	await expect(section.getByRole('status', { name: 'Scroll result', exact: true })).toHaveText('Returned true. Reveal requested; focus and selection are unchanged.');
	const preview = section.locator('pre[aria-label="Current scrollToKey call"]');
	await expect(preview).toHaveText('controller.scrollToKey("asset-05000", {\n\tbehavior: "instant",\n\tblock: "center",\n\tinline: "end",\n\tcontainer: "nearest",\n});');
	await expect.poll(() => blockDifference(page, 5000, 'center')).toBeLessThan(2);
	await section.getByRole('textbox', { name: 'Asset key', exact: true }).fill('asset-not-found');
	await section.getByRole('textbox', { name: 'Asset key', exact: true }).blur();
	const before = await viewport(page).evaluate(node => ({ top: node.scrollTop, left: node.scrollLeft }));
	await section.getByRole('button', { name: 'Show asset', exact: true }).click();
	await expect(section.getByRole('status', { name: 'Scroll result', exact: true })).toHaveText('Returned false. That key is not in this collection; the scroll position is unchanged.');
	await expect(preview).toContainText('controller.scrollToKey("asset-not-found", {');
	await viewport(page).evaluate(() => new Promise<void>(resolve => { let frames = 0; const tick = () => ++frames < 8 ? requestAnimationFrame(tick) : resolve(); requestAnimationFrame(tick); }));
	expect(await viewport(page).evaluate(node => ({ top: node.scrollTop, left: node.scrollLeft }))).toEqual(before);
	await demo(page).screenshot({ path: info.outputPath('scroll-options-desktop.png') });
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(demo(page).getByRole('combobox', { name: 'Scroll containers', exact: true })).toBeVisible();
	await demo(page).screenshot({ path: info.outputPath('scroll-options-mobile.png') });
	await summary.click();
	await expect(disclosure).not.toHaveAttribute('open');
	await demo(page).screenshot({ path: info.outputPath('scroll-options-mobile-collapsed.png') });
});

test('presentation invalidation queued with a reveal preserves its prepared destination', async ({ page }) => {
	await openList(page);
	const original = await selectedOrigin(page);
	expect(await demo(page).evaluate((node: any) => {
		const accepted = node.controller.scrollToKey('asset-05000', { behavior: 'instant', block: 'center', container: 'nearest' });
		// A theme or resize observer can deliver this after the application has
		// requested a reveal, but before its destination has rendered/measured.
		node.controller.invalidateMeasurements();
		return accepted;
	})).toBe(true);
	await expect.poll(() => blockDifference(page, 5000, 'center')).toBeLessThan(2);
	await expect(original).toBeFocused();
	await expect(original).toBeChecked();
});

test('a later programmatic scroll owns the viewport while an accepted reveal is preparing', async ({ page }, info) => {
	await openList(page);
	const original = await selectedOrigin(page);
	await expect.poll(() => viewport(page).evaluate(node => node.scrollTop)).toBe(0);
	const observed = await demo(page).evaluate(async (node: any) => {
		const viewport = node.shadowRoot.querySelector('[data-virtual-viewport]') as HTMLElement;
		const before = viewport.scrollTop;
		// Stay within the already measured initial window while requesting a
		// distant destination. No await separates the request from this write.
		const externalTop = 40;
		const scrolled = new Promise<void>(resolve => viewport.addEventListener('scroll', () => resolve(), { once: true }));
		const accepted = node.controller.scrollToKey('asset-05000', { behavior: 'instant', block: 'center', container: 'nearest' });
		const afterRequest = viewport.scrollTop;
		viewport.scrollTop = externalTop;
		const afterWrite = viewport.scrollTop;
		await scrolled;
		const positions: number[] = [];
		for (let index = 0; index < 24; index++) {
			await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
			await node.updateComplete;
			positions.push(viewport.scrollTop);
		}
		return { accepted, before, afterRequest, externalTop, afterWrite, positions };
	});
	expect(observed.accepted).toBe(true);
	expect(observed.afterRequest).toBe(observed.before);
	expect(observed.afterWrite - observed.before).toBeGreaterThan(1);
	expect(observed.afterWrite).toBe(observed.externalTop);
	for (const position of observed.positions) expect(Math.abs(position - observed.externalTop)).toBeLessThan(2);
	await expect(row(page, 5000)).not.toBeInViewport();
	await expect(original).toBeFocused();
	await expect(original).toBeChecked();
	await info.attach('prepare-programmatic-interruption', { body: JSON.stringify(observed), contentType: 'application/json' });
});
