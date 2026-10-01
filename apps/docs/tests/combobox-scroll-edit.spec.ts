import { expect, test, type Page, type TestInfo } from '@playwright/test';

const initialLabel = 'Studio North · Autumn campaign';
const input = (page: Page) => page.locator('#selection').getByRole('combobox', { name: 'Project', exact: true });
const host = (page: Page) => page.locator('#selection en-combobox');
const popup = (page: Page) => host(page).locator('[part~="popup"]');
const brief = (page: Page) => page.getByRole('region', { name: 'Campaign brief and project assignment', exact: true });
type ScrollOwner = 'document' | 'brief';

async function geometry(page: Page) {
	const editor = await input(page).elementHandle();
	const surface = await popup(page).elementHandle();
	const scrollport = await brief(page).elementHandle();
	if (!editor || !surface || !scrollport) throw new Error('Selection workflow is missing its public editor, popup, or brief.');
	try {
		return await page.evaluate(({ editor, surface, scrollport }) => {
			const box = (element: Element) => {
				const rect = element.getBoundingClientRect();
				return { x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
			};
			const style = getComputedStyle(surface);
			const viewport = visualViewport;
			return {
				editor: box(editor), popup: box(surface), brief: box(scrollport),
				popupStyle: { visibility: style.visibility, display: style.display, rowGap: parseFloat(style.rowGap) || 0 },
				expanded: editor.getAttribute('aria-expanded'), active: editor.getAttribute('aria-activedescendant'),
				query: (editor as HTMLInputElement).value,
				documentScroll: { x: scrollX, y: scrollY }, briefScroll: (scrollport as HTMLElement).scrollTop,
				viewport: viewport ? { width: viewport.width, height: viewport.height, offsetLeft: viewport.offsetLeft, offsetTop: viewport.offsetTop, pageLeft: viewport.pageLeft, pageTop: viewport.pageTop, scale: viewport.scale } : null,
				layoutViewport: { width: innerWidth, height: innerHeight },
			};
		}, { editor, surface, scrollport });
	} finally { await editor.dispose(); await surface.dispose(); await scrollport.dispose(); }
}

/** Exercise actual native scrolling without a second tap/refocus that could conceal the bug. */
async function scrollWithEditorFocused(page: Page, owner: ScrollOwner) {
	const editor = await input(page).elementHandle();
	const scrollport = await brief(page).elementHandle();
	if (!editor || !scrollport) throw new Error('Selection scroll targets are unavailable.');
	let movement: { owner: ScrollOwner; before: number; requestedDelta: number; target: number; range: number };
	try {
		movement = await page.evaluate(({ editor, scrollport, owner }) => {
			const target = (owner === 'document' ? document.scrollingElement : scrollport) as HTMLElement | null;
			if (!target) throw new Error('The native scrolling element is unavailable.');
			const anchor = editor.getBoundingClientRect();
			const port = scrollport.getBoundingClientRect();
			const clippingTop = Math.max(0, port.top);
			const clippingBottom = Math.min(innerHeight, port.bottom);
			const before = target.scrollTop;
			const range = target.scrollHeight - target.clientHeight;
			// Keep the editor visible, so suspension cannot make a detached popup assertion vacuous.
			const upRoom = Math.max(0, anchor.top - clippingTop - 12);
			const downRoom = Math.max(0, clippingBottom - anchor.bottom - 12);
			const forward = Math.min(48, upRoom, range - before);
			const backward = Math.min(48, downRoom, before);
			const delta = forward >= 12 ? forward : -backward;
			if (Math.abs(delta) < 12) throw new Error(`The ${owner} fixture needs at least 12px of scroll room while the editor remains visible.`);
			target.scrollBy({ top: delta, behavior: 'instant' });
			return { owner, before, requestedDelta: delta, target: before + delta, range };
		}, { editor, scrollport, owner });
	} finally { await editor.dispose(); await scrollport.dispose(); }
	await expect.poll(async () => {
		const position = owner === 'document'
			? await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)
			: await brief(page).evaluate(element => element.scrollTop);
		// Native scroll offsets can be rounded to a whole CSS pixel on a device profile.
		return Math.abs(position - movement.target);
	}).toBeLessThanOrEqual(1);
	await expect(input(page)).toBeFocused();
	return movement;
}

async function attachedPopup(page: Page) {
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(popup(page)).toBeVisible();
	await expect.poll(async () => {
		const measured = await geometry(page);
		const anchor = measured.editor;
		const surface = measured.popup;
		const epsilon = 1.5;
		const above = surface.bottom <= anchor.top + epsilon;
		const below = surface.top >= anchor.bottom - epsilon;
		const gap = above ? anchor.top - surface.bottom : below ? surface.top - anchor.bottom : Infinity;
		return measured.expanded === 'true' && measured.popupStyle.visibility === 'visible'
			&& surface.width > 0 && surface.height > 0 && (above || below)
			&& gap >= -epsilon && Math.abs(gap - measured.popupStyle.rowGap) <= epsilon
			&& Math.abs(surface.left - anchor.left) <= epsilon
			&& Math.abs(surface.width - anchor.width) <= epsilon;
	}, { message: 'The visible popup must adjoin the editor, with its authored gap and no overlap.' }).toBe(true);
}

async function capture(page: Page, info: TestInfo, stage: string) {
	await info.attach(`${stage}-geometry`, { body: JSON.stringify(await geometry(page), null, 2), contentType: 'application/json' });
	await info.attach(stage, { body: await page.screenshot(), contentType: 'image/png' });
}

for (const owner of ['document', 'brief'] as const) {
	test(`Selection: focus, ${owner} scroll, then iPhone Delete keeps results attached and still submits the selected project`, async ({ page, browser }, info) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(error.message));
		page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
		info.annotations.push({ type: 'emulation-limit', description: 'Touch/mobile viewport emulation with native DOM scrollBy and Backspace. No software keyboard, touch swipe, rubber-band scrolling, physical iOS 18.7.7, or manual AT is emulated.' });
		await page.goto('/workflows/selection');
		await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
		await expect.poll(() => host(page).evaluate(element => Boolean((element as HTMLElement & { hasUpdated?: boolean }).hasUpdated))).toBe(true);
		await info.attach('environment', { body: JSON.stringify({
			profile: info.project.name, engine: browser.browserType().name(), engineVersion: browser.version(),
			buildFingerprint: await page.evaluate(() => document.querySelector<HTMLMetaElement>('meta[name="en-review-build"]')?.content ?? null),
			reportedDevice: 'iPhone 12 Pro, iOS 18.7.7', softwareKeyboardEmulated: false,
			scrollMethod: 'native DOM scrollBy; no synthetic scroll event or touch-swipe claim',
			userAgent: await page.evaluate(() => navigator.userAgent),
		}, null, 2), contentType: 'application/json' });
		const editor = input(page);
		await editor.scrollIntoViewIfNeeded();
		await editor.tap();
		await expect(editor).toBeFocused();
		await expect(editor).toHaveValue(initialLabel);
		const original = await editor.elementHandle();
		// A deterministic native caret position; Backspace performs the real edit below.
		await editor.evaluate(element => {
			const control = element as HTMLInputElement;
			control.setSelectionRange(control.value.length, control.value.length);
		});
		try {
			await capture(page, info, 'focused-before-scroll');
			const firstMovement = await scrollWithEditorFocused(page, owner);
			await info.attach('first-scroll', { body: JSON.stringify(firstMovement, null, 2), contentType: 'application/json' });
			await capture(page, info, 'scrolled-before-delete');
			// Do not use locator.press/fill/tap here: refocusing could scroll the anchor back into place.
			await page.keyboard.press('Backspace');
			await expect(editor).toHaveValue(initialLabel.slice(0, -1));
			await expect(editor).toBeFocused();
			expect(await editor.evaluate((element, before) => element === before, original)).toBe(true);
			await attachedPopup(page);
			await capture(page, info, 'after-first-delete');

			// Repeat while results are already visible, covering both initial placement and repositioning.
			const secondMovement = await scrollWithEditorFocused(page, owner);
			await info.attach('second-scroll', { body: JSON.stringify(secondMovement, null, 2), contentType: 'application/json' });
			await page.keyboard.press('Backspace');
			await expect(editor).toHaveValue(initialLabel.slice(0, -2));
			await attachedPopup(page);
			await capture(page, info, 'after-second-delete');
			expect(await host(page).evaluate(element => (element as HTMLElement & { value: string }).value)).toBe('project-01');
			const form = page.getByRole('form', { name: 'Assign campaign brief', exact: true });
			expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('project'))).toBe('project-01');
			await expect(page.locator('[data-selection-submission]')).toHaveText('No assignment submitted.');

			await editor.fill('Willow');
			await attachedPopup(page);
			await page.getByRole('option', { name: 'Willow · Year in review', exact: true }).tap();
			await expect(editor).toHaveValue('Willow · Year in review');
			await expect(editor).toHaveAttribute('aria-expanded', 'false');
			expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('project'))).toBe('project-40');
			await page.getByRole('button', { name: 'Assign brief', exact: true }).tap();
			await expect(page.locator('[data-selection-submission]')).toHaveText('Submission 1: Willow · Year in review · project=project-40');
			expect(errors, 'No runtime errors during the scroll/edit/submit path').toEqual([]);
		} finally {
			await capture(page, info, 'final-state');
			await original?.dispose();
		}
	});
}
