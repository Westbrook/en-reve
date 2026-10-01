import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const frameElement = (page: Page) => page.locator('.api-demo-frame');
const demo = (page: Page) => page.frameLocator('.api-demo-frame');
const chooser = (page: Page) => page.locator('en-select[label="Component"]').getByRole('combobox', { name: 'Component', exact: true });
const density = (page: Page) => page.locator('en-select[label="Example density"]').getByRole('combobox', { name: 'Example density', exact: true });
const reset = (page: Page) => page.getByRole('button', { name: 'Reset example', exact: true });
const errors = new WeakMap<Page, string[]>();
async function activateReset(page: Page) {
	// WebKit deliberately does not focus buttons on pointer clicks. Establish
	// native keyboard focus before checking that a reset preserves it.
	await reset(page).focus();
	await page.keyboard.press('Enter');
}

async function ready(page: Page, id: string, title: string) {
	await expect(frameElement(page)).toHaveAttribute('data-example-id', id);
	await expect(frameElement(page)).toHaveAttribute('title', `${title} live example`);
	await frameElement(page).scrollIntoViewIfNeeded();
	await expect(frameElement(page)).toHaveAttribute('data-example-ready', 'true');
	await expect(demo(page).locator(`[data-specimen="${id}"]`)).toBeVisible();
	await expect(demo(page).locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(demo(page).locator('en-api-example-app')).toHaveAttribute('data-example-ready', 'true');
}
async function open(page: Page, component: string, id: string, title: string) {
	await page.goto(`/api-reference?component=${component}`);
	await expect(page.getByRole('heading', { name: component, exact: true })).toBeVisible();
	await ready(page, id, title);
}
async function parentPresentation(page: Page) {
	return chooser(page).evaluate(element => ({
		background: getComputedStyle(document.body).backgroundColor,
		color: getComputedStyle(document.body).color,
		chooserHeight: element.getBoundingClientRect().height,
	}));
}

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('accordion appearance and all three densities retain the live document and interaction state until Reset', async ({ page }) => {
	await open(page, 'en-accordion', 'accordion', 'Accordion');
	const appearance = demo(page).getByRole('button', { name: 'Appearance', exact: true });
	const layout = demo(page).getByRole('button', { name: 'Layout', exact: true });
	await appearance.click();
	await expect(appearance).toHaveAttribute('aria-expanded', 'true');
	await expect(layout).toHaveAttribute('aria-expanded', 'true');
	await expect(demo(page).getByText('Color, border, and corner settings stay individually adjustable.', { exact: true })).toBeVisible();
	const parentBefore = await parentPresentation(page);
	const light = await appearance.evaluate(element => getComputedStyle(element).backgroundColor);
	await frameElement(page).evaluate(element => {
		const frame = element as HTMLIFrameElement;
		(window as any).savedExample = { frame, document: frame.contentDocument, specimen: frame.contentDocument!.querySelector('en-accordion') };
	});
	await page.locator('en-segmented-control[label="Example appearance"]').getByText('Dark', { exact: true }).click();
	await expect.poll(() => appearance.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(light);
	const heights: Record<string, number> = {};
	for (const value of ['compact', 'comfortable', 'spacious']) {
		await density(page).selectOption(value);
		await expect(density(page)).toHaveValue(value);
		// Token application is asynchronous across the iframe message boundary.
		await expect.poll(async () => demo(page).locator('html').getAttribute('data-example-density')).toBe(value);
		heights[value] = await appearance.evaluate(element => element.getBoundingClientRect().height);
		await expect(appearance).toHaveAttribute('aria-expanded', 'true');
		await expect(layout).toHaveAttribute('aria-expanded', 'true');
		expect(await frameElement(page).evaluate(element => {
			const saved = (window as any).savedExample;
			const frame = element as HTMLIFrameElement;
			return frame === saved.frame && frame.contentDocument === saved.document && frame.contentDocument!.querySelector('en-accordion') === saved.specimen;
		})).toBe(true);
	}
	expect(heights.compact).toBeLessThan(heights.comfortable);
	expect(heights.comfortable).toBeLessThan(heights.spacious);
	expect(await parentPresentation(page)).toEqual(parentBefore);
	await activateReset(page);
	await expect.poll(() => frameElement(page).evaluate(element => {
		const frame = element as HTMLIFrameElement;
		const saved = (window as any).savedExample;
		return {
			frameRetained: frame === saved.frame,
			documentRetained: frame.contentDocument === saved.document,
			specimenReplaced: frame.contentDocument!.querySelector('en-accordion') !== saved.specimen,
			previousSpecimenDisconnected: !saved.specimen.isConnected,
		};
	})).toEqual({ frameRetained: true, documentRetained: true, specimenReplaced: true, previousSpecimenDisconnected: true });
	await ready(page, 'accordion', 'Accordion');
	await expect(demo(page).getByRole('button', { name: 'Appearance', exact: true })).toHaveAttribute('aria-expanded', 'false');
	await expect(demo(page).getByRole('button', { name: 'Layout', exact: true })).toHaveAttribute('aria-expanded', 'true');
	await expect(density(page)).toHaveValue('spacious');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-mode', 'dark');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-density', 'spacious');
	await expect(reset(page)).toBeFocused();
});

test('component selection replaces only its exact example and registrations stay inside the matching frame', async ({ page, request }) => {
	await open(page, 'en-accordion', 'accordion', 'Accordion');
	expect(await page.evaluate(() => ['en-accordion', 'en-accordion-item', 'en-dialog', 'en-drawer', 'en-combobox'].every(tag => customElements.get(tag) === undefined))).toBe(true);
	expect(await page.evaluate(() => ['en-text-field', 'en-checkbox'].every(tag => customElements.get(tag) !== undefined))).toBe(true); // Only the scalar-editor definitions were added to the parent.
	expect(await demo(page).locator('html').evaluate(() => ({
		accordion: Boolean(customElements.get('en-accordion')), item: Boolean(customElements.get('en-accordion-item')),
		dialog: Boolean(customElements.get('en-dialog')), text: Boolean(customElements.get('en-text-field')), combobox: Boolean(customElements.get('en-combobox')),
	}))).toEqual({ accordion: true, item: true, dialog: false, text: false, combobox: false });
	await chooser(page).selectOption('en-text-field');
	await ready(page, 'text-fields', 'Text fields');
	await expect(frameElement(page)).toHaveAttribute('src', '/api-examples/text-fields.html');
	await expect(demo(page).getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('Studio studies');
	await expect(demo(page).locator('en-accordion')).toHaveCount(0);
	expect(await demo(page).locator('html').evaluate(() => ({
		text: Boolean(customElements.get('en-text-field')), accordion: Boolean(customElements.get('en-accordion')), dialog: Boolean(customElements.get('en-dialog')),
	}))).toEqual({ text: true, accordion: false, dialog: false });
	await chooser(page).selectOption('en-accordion');
	await ready(page, 'accordion', 'Accordion');
	await expect(demo(page).getByRole('button', { name: 'Appearance', exact: true })).toHaveAttribute('aria-expanded', 'false');
	const unavailable = await request.get('/api-examples/this-example-does-not-exist.html');
	expect(unavailable.status()).toBe(404);
	await expect(frameElement(page)).toHaveAttribute('data-example-id', 'accordion');
	expect(await page.evaluate(() => customElements.get('en-accordion') === undefined && customElements.get('en-text-field') !== undefined && customElements.get('en-checkbox') !== undefined)).toBe(true);
});

test('standalone example URLs contain the requested native SSR content before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('/api-examples/accordion.html');
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		await expect(page.locator('[data-specimen="accordion"]')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Layout', exact: true })).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByRole('button', { name: 'Appearance', exact: true })).toHaveAttribute('aria-expanded', 'false');
		await expect(page.getByText('Keep a predictable rhythm between related controls.', { exact: true })).toBeVisible();
		await expect(page.locator('en-text-field')).toHaveCount(0);
		await page.goto('/api-examples/text-fields.html');
		await expect(page.locator('[data-specimen="text-fields"]')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('Studio studies');
		await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
		await expect(page.locator('en-accordion')).toHaveCount(0);
	} finally { await context.close(); }
});

test('delayed example hydration preserves an edited native input, shadow root, focus and selection', async ({ page }) => {
	let release!: () => void;
	const held = new Promise<void>(resolve => { release = resolve; });
	let waiting = 0;
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') { waiting++; await held; }
		await route.continue();
	});
	try {
		await page.goto('/api-examples/text-fields.html', { waitUntil: 'commit' });
		const project = page.getByRole('textbox', { name: 'Project name', exact: true });
		await expect(project).toHaveValue('Studio studies');
		await expect.poll(() => waiting).toBeGreaterThan(0);
		await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
		await project.fill('Unfinished campaign');
		await project.evaluate(element => {
			const input = element as HTMLInputElement;
			input.setSelectionRange(2, 10);
			(window as any).savedNativeField = { input, root: input.getRootNode(), host: input.closest('en-text-field') ?? (input.getRootNode() as ShadowRoot).host };
		});
		release();
		await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect.poll(() => page.evaluate(() => Boolean(customElements.get('en-text-field')))).toBe(true);
		await expect(project).toHaveValue('Unfinished campaign');
		await expect(project).toBeFocused();
		expect(await project.evaluate(element => {
			const saved = (window as any).savedNativeField; const input = element as HTMLInputElement;
			return { input: input === saved.input, root: input.getRootNode() === saved.root,
				host: (input.getRootNode() as ShadowRoot).host === saved.host, selection: [input.selectionStart, input.selectionEnd] };
		})).toEqual({ input: true, root: true, host: true, selection: [2, 10] });
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('dialog modality stays inside the example while parent controls remain usable', async ({ page }) => {
	await open(page, 'en-dialog', 'dialog-drawer', 'Dialog & drawer');
	const opener = demo(page).getByRole('button', { name: 'Open dialog', exact: true });
	await opener.focus();
	await opener.press('Enter');
	const dialogHost = demo(page).locator('en-dialog');
	const dialog = dialogHost.getByRole('dialog', { name: 'Invite to this project', exact: true });
	await expect(dialog).toBeVisible();
	const email = dialogHost.getByRole('textbox', { name: 'Email address', exact: true });
	await email.fill('reviewer@example.com');
	const search = page.locator('en-search-input').getByRole('searchbox', { name: 'Find a component', exact: true });
	await search.fill('EnDialog');
	await expect(search).toBeFocused();
	await expect(dialog).toBeVisible();
	await density(page).selectOption('compact');
	await expect(dialog).toBeVisible();
	await expect(email).toHaveValue('reviewer@example.com');
	expect(await page.evaluate(() => document.querySelector('dialog[open]') === null && !document.querySelector('main')!.inert)).toBe(true);
	await frameElement(page).scrollIntoViewIfNeeded();
	await dialogHost.getByRole('button', { name: 'Done', exact: true }).click();
	await expect(dialog).not.toBeVisible();
	await expect(demo(page).getByRole('button', { name: 'Open dialog', exact: true })).toBeFocused();
});

test('the narrow example controls and iframe disclosure remain keyboard accessible without document overflow', async ({ page, browserName }, info) => {
	const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
	await page.setViewportSize({ width: 320, height: 900 });
	await open(page, 'en-accordion', 'accordion', 'Accordion');
	const appearance = page.locator('en-segmented-control[label="Example appearance"]');
	await appearance.getByRole('radio', { name: 'Light', exact: true }).focus();
	await page.keyboard.press('ArrowRight');
	await expect(appearance.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
	await page.keyboard.press(tab);
	await expect(density(page)).toBeFocused();
	await page.keyboard.press(tab);
	await expect(reset(page)).toBeFocused();
	await page.keyboard.press(tab);
	const elementControls = page.locator('.api-element-controls');
	await expect(elementControls.locator(':scope > summary')).toBeFocused();
	await page.keyboard.press('Space');
	await expect(elementControls).not.toHaveAttribute('open');
	await page.keyboard.press(tab);
	const layout = demo(page).getByRole('button', { name: 'Layout', exact: true });
	const enteredFrameBody = await frameElement(page).evaluate(element => {
		const frame = element as HTMLIFrameElement;
		return document.activeElement === frame && frame.contentDocument?.activeElement === frame.contentDocument?.body;
	});
	// Firefox may expose the browsing-context entry as a separate native tab stop.
	// Advance only from that observed body entry, never force focus into the demo.
	if (enteredFrameBody) await page.keyboard.press(tab);
	await expect(layout).toBeFocused();
	await page.keyboard.press('Space');
	await expect(layout).toHaveAttribute('aria-expanded', 'false');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	expect(await demo(page).locator('html').evaluate(element => element.scrollWidth <= innerWidth + 1)).toBe(true);
	const result = await new AxeBuilder({ page })
		.include('en-segmented-control[label="Example appearance"]')
		.include('en-select[label="Example density"]')
		.include(['.api-demo-frame', '[data-specimen="accordion"]'])
		.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
	await info.attach('inline-example-accessibility', { body: JSON.stringify(result), contentType: 'application/json' });
	expect(result.violations).toEqual([]);
});


test('Reset recovers the selected case after a native link navigates the iframe to another example', async ({ page }) => {
	await open(page, 'en-text-field', 'text-fields', 'Text fields');
	await page.locator('en-segmented-control[label="Example appearance"]').getByText('Dark', { exact: true }).click();
	await density(page).selectOption('spacious');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-mode', 'dark');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-density', 'spacious');
	const parentURL = page.url();
	const link = demo(page).getByRole('link', { name: 'Review this field', exact: true });
	// An author may replace the specimen link's destination. Exercise real native
	// navigation rather than replacing the iframe document through the test driver.
	await link.evaluate(element => (element as HTMLAnchorElement).href = '/api-examples/accordion.html');
	await link.click();
	await expect(demo(page).locator('[data-specimen="accordion"]')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'en-text-field', exact: true })).toBeVisible();
	expect(page.url()).toBe(parentURL);
	await activateReset(page);
	await ready(page, 'text-fields', 'Text fields');
	await expect(demo(page).getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue('Studio studies');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-mode', 'dark');
	await expect(demo(page).locator('html')).toHaveAttribute('data-example-density', 'spacious');
	await expect(reset(page)).toBeFocused();
});


test('default Auto follows system appearance without replacing drafts, and stays independent of parent and explicit choices', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await open(page, 'en-text-field', 'text-fields', 'Text fields');
	const choices = page.locator('en-segmented-control[label="Example appearance"]');
	const childRoot = demo(page).locator('html');
	await expect(choices.getByRole('radio', { name: 'Auto', exact: true })).toBeChecked();
	await expect(childRoot).toHaveAttribute('data-example-mode', 'auto');
	await expect(childRoot).toHaveAttribute('data-en-appearance', 'auto');
	await expect(childRoot).toHaveCSS('color-scheme', 'light dark');
	await expect(frameElement(page)).toHaveCSS('color-scheme', 'light dark');
	await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark');
	const field = demo(page).getByRole('textbox', { name: 'Project name', exact: true });
	const body = demo(page).locator('body');
	const darkBody = await body.evaluate(element => getComputedStyle(element).backgroundColor);
	const darkField = await field.evaluate(element => getComputedStyle(element).backgroundColor);
	await page.getByText('View authored example source', { exact: true }).click();
	const source = page.locator('pre[data-api-code="example"]');
	const darkSource = await source.evaluate(element => getComputedStyle(element).backgroundColor);
	await field.fill('Keep this Auto draft');
	await field.evaluate(element => (element as HTMLInputElement).setSelectionRange(2, 8));
	const identity = await field.evaluateHandle(input => ({ input, root: input.getRootNode(), document: input.ownerDocument }));
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => body.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(darkBody);
	await expect.poll(() => field.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(darkField);
	await expect.poll(() => source.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(darkSource);
	const lightBody = await body.evaluate(element => getComputedStyle(element).backgroundColor);
	await expect(field).toBeFocused();
	await expect(field).toHaveValue('Keep this Auto draft');
	expect(await field.evaluate((input, saved) => input === saved.input && input.getRootNode() === saved.root && input.ownerDocument === saved.document, identity)).toBe(true);
	expect(await field.evaluate(input => [(input as HTMLInputElement).selectionStart, (input as HTMLInputElement).selectionEnd])).toEqual([2, 8]);
	await expect(childRoot).toHaveAttribute('data-example-mode', 'auto');
	// A forced parent is a separate boundary; it must not turn Auto into Dark.
	await page.locator('html').evaluate(element => (element as HTMLElement).style.setProperty('color-scheme', 'dark'));
	await expect(source).toHaveCSS('background-color', darkSource);
	await expect(body).toHaveCSS('background-color', lightBody);
	await choices.getByText('Dark', { exact: true }).click();
	await expect(childRoot).toHaveAttribute('data-en-appearance', 'dark');
	await expect(childRoot).toHaveCSS('color-scheme', 'dark');
	await expect(body).toHaveCSS('background-color', darkBody);
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.emulateMedia({ colorScheme: 'light' });
	await expect(body).toHaveCSS('background-color', darkBody);
	await expect(choices.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
	await choices.getByText('Auto', { exact: true }).click();
	await expect(childRoot).toHaveAttribute('data-en-appearance', 'auto');
	await expect(body).toHaveCSS('background-color', lightBody);
	await expect(field).toHaveValue('Keep this Auto draft');
	expect(await field.evaluate((input, saved) => input === saved.input && input.ownerDocument === saved.document, identity)).toBe(true);
	await identity.dispose();
});

test('standalone Auto SSR examples use both system branches before JavaScript', async ({ browser, baseURL }) => {
	const paints: Record<string, { body: string; input: string }> = {};
	for (const colorScheme of ['light', 'dark'] as const) {
		const context = await browser.newContext({ baseURL, javaScriptEnabled: false, colorScheme });
		try {
			const page = await context.newPage();
			await page.goto('/api-examples/text-fields.html');
			await expect(page.locator('en-api-example-app')).toHaveAttribute('data-ssr', '');
			await expect(page.locator('html')).toHaveAttribute('data-example-mode', 'auto');
			await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'auto');
			await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark');
			const input = page.getByRole('textbox', { name: 'Project name', exact: true });
			await expect(input).toHaveValue('Studio studies');
			paints[colorScheme] = {
				body: await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor),
				input: await input.evaluate(element => getComputedStyle(element).backgroundColor),
			};
		} finally { await context.close(); }
	}
	expect(paints.light.body).not.toBe(paints.dark.body);
	expect(paints.light.input).not.toBe(paints.dark.input);
});
