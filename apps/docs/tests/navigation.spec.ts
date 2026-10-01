import { expect, test, type Page } from '@playwright/test';

test('SSR shadow navigation and keyboard bypass retain their anchors and destination through hydration', async ({ page, browserName }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	await page.goto('/', { waitUntil: 'commit' });
	await expect(page.locator('en-sticker-app')).toHaveAttribute('data-ssr', '');
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	const bypass = page.getByRole('link', { name: 'Skip to components', exact: true });
	await expect(bypass).toBeFocused();
	await expect(bypass).toBeInViewport();
	await page.keyboard.press('Enter');
	await expect(page.locator('#sheet')).toBeFocused();
	const host = page.locator('en-navigation.section-nav');
	const nav = host.getByRole('navigation', { name: 'Sticker sheet sections', exact: true });
	expect(await host.evaluate(element => !!element.shadowRoot?.querySelector('nav'))).toBe(true);
	const fieldsLink = host.getByRole('link', { name: 'Fields', exact: true });
	const original = await fieldsLink.elementHandle();
	await fieldsLink.click();
	await expect(page).toHaveURL(/#fields$/);
	await expect(page.locator('#fields')).toBeFocused();
	await expect(host).toHaveCSS('position', 'static');
	await expect(nav).toHaveCSS('position', 'static');
	release();
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	await expect(host).toHaveCSS('position', 'sticky');
	await expect(nav).toHaveCSS('position', 'static');
	expect(await fieldsLink.evaluate((link, previous) => link === previous, original)).toBe(true);
	await expect(page.locator('#fields')).toBeFocused();
	await expect.poll(async () => {
		const navigation = await host.boundingBox();
		const target = await page.locator('#fields').boundingBox();
		return Boolean(navigation && target && target.y >= navigation.y + navigation.height);
	}).toBe(true);
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('textbox', { name: 'Project name', exact: true }).first()).toBeFocused();
	expect(errors).toEqual([]);
});

test('navigation elements in the production sheet expose a current path and real destination links', async ({ page }) => {
	await page.goto('/#navigation');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	const breadcrumb = page.locator('[data-specimen="breadcrumbs"] en-breadcrumbs');
	expect(await breadcrumb.evaluate(element => !!element.shadowRoot?.querySelector('nav'))).toBe(true);
	const path = breadcrumb.getByRole('navigation', { name: 'Pattern location', exact: true });
	await expect(path.getByRole('list')).toBeVisible();
	await expect(path.getByRole('listitem')).toHaveCount(2);
	await expect(breadcrumb.locator(':scope > [aria-current="location"]')).toHaveText('Navigation patterns');
	await expect(breadcrumb.locator(':scope > a')).toHaveAttribute('href', '#sheet');
	expect(await breadcrumb.evaluate(element => element.shadowRoot!.querySelectorAll('a').length)).toBe(0);
	const relatedHost = page.locator('[data-specimen="native-navigation"] en-navigation');
	expect(await relatedHost.evaluate(element => !!element.shadowRoot?.querySelector('nav'))).toBe(true);
	const related = relatedHost.getByRole('navigation', { name: 'Explore related patterns', exact: true });
	await expect(related).toBeVisible();
	await expect(relatedHost.locator(':scope > a')).toHaveCount(3);
	expect(await relatedHost.evaluate(element => element.shadowRoot!.querySelectorAll('a').length)).toBe(0);
	await relatedHost.getByRole('link', { name: 'Fields', exact: true }).click();
	await expect(page).toHaveURL(/#fields$/);
	await expect(page.locator('#fields')).toBeFocused();
	await page.goBack();
	await expect(page).toHaveURL(/#navigation$/);
});

test('slotted navigation keeps native links, focus and consumer listeners through production hydration', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		// A hashless load separates hydration from pending native fragment focus.
		await page.goto('/', { waitUntil: 'commit' });
		const host = page.locator('en-navigation.section-nav');
		const link = host.getByRole('link', { name: 'Fields', exact: true });
		await expect(host.getByRole('navigation', { name: 'Sticker sheet sections', exact: true })).toBeVisible();
		await expect(host.locator(':scope > a')).toHaveCount(10);
		await expect(link).toBeVisible();
		const original = await host.evaluateHandle(element => {
			const anchor = element.querySelector<HTMLAnchorElement>('a[href="#fields"]')!;
			const listener = (event: Event) => event.preventDefault();
			anchor.addEventListener('click', listener);
			return { root: element.shadowRoot, anchor, listener };
		});
		expect(await host.evaluate(element => ({
			mode: element.shadowRoot!.slotAssignment,
			slots: element.shadowRoot!.querySelectorAll('slot:not([name])').length,
			internalLinks: element.shadowRoot!.querySelectorAll('a').length,
			childSlotAttributes: element.querySelectorAll(':scope > [slot]').length,
		}))).toEqual({ mode: 'named', slots: 1, internalLinks: 0, childSlotAttributes: 0 });
		await link.focus();
		release();
		await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
		await expect(link).toBeFocused();
		expect(await host.evaluate((element, before) => element.shadowRoot === before.root
			&& element.querySelector('a[href="#fields"]') === before.anchor, original)).toBe(true);
		await link.press('Enter');
		expect(new URL(page.url()).hash).toBe('');
		await original.evaluate(before => before.anchor.removeEventListener('click', before.listener));
		await link.press('Enter');
		await expect(page).toHaveURL(/#fields$/);
		await expect(page.locator('#fields')).toBeFocused();
		expect(errors).toEqual([]);
	} finally { release(); }
});

test('slotted breadcrumb links remain visible before JavaScript and retain focus through production hydration', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		// Isolate hydration from a pending initial fragment navigation. A browser
		// may focus that fragment when the blocked module finishes loading.
		await page.goto('/', { waitUntil: 'commit' });
		const host = page.locator('[data-specimen="breadcrumbs"] en-breadcrumbs');
		const link = host.getByRole('link', { name: 'Sticker sheet', exact: true });
		await expect(link).toBeVisible();
		await expect(host.getByRole('navigation', { name: 'Pattern location', exact: true })).toMatchAriaSnapshot(`
      - navigation "Pattern location":
        - list:
          - listitem:
            - link "Sticker sheet":
              - /url: "#sheet"
          - listitem: Navigation patterns
		`);
		const original = await host.evaluateHandle(element => ({
			root: element.shadowRoot,
			link: element.querySelector('a'),
			label: element.querySelector('span[aria-current]'),
			items: [...element.shadowRoot!.querySelectorAll('li')],
		}));
		expect(await host.evaluate(element => element.shadowRoot!.slotAssignment)).toBe('named');
		await link.focus();
		release();
		await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
		await expect(link).toBeFocused();
		expect(await host.evaluate((element, before) => element.shadowRoot === before.root
			&& element.querySelector('a') === before.link
			&& element.querySelector('span[aria-current]') === before.label
			&& [...element.shadowRoot!.querySelectorAll('li')].every((item, index) => item === before.items[index]), original)).toBe(true);
		await link.press('Enter');
		await expect(page).toHaveURL(/#sheet$/);
		await expect(page.locator('#sheet')).toBeFocused();
		expect(errors).toEqual([]);
	} finally { release(); }
});

async function settleFrames(page: Page) {
	await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
}

async function settleScroll(page: Page) {
	await page.evaluate(() => new Promise<void>(resolve => {
		let previous = scrollY;
		let stable = 0;
		const sample = () => {
			stable = Math.abs(scrollY - previous) < 0.5 ? stable + 1 : 0;
			previous = scrollY;
			if (stable >= 4) resolve();
			else requestAnimationFrame(sample);
		};
		requestAnimationFrame(sample);
	}));
}

async function fieldsAligned(page: Page) {
	await expect.poll(async () => {
		const navigation = await page.locator('en-navigation.section-nav').boundingBox();
		const target = await page.locator('#fields').boundingBox();
		return Boolean(navigation && target && target.y >= navigation.y + navigation.height - 1 && target.y < navigation.y + navigation.height + 100);
	}).toBe(true);
}

test('shadow links rearm a same-hash destination and preserve canceled or modified native activation', async ({ page, context }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/#fields');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	const host = page.locator('en-navigation.section-nav');
	const fields = host.getByRole('link', { name: 'Fields', exact: true });
	await fieldsAligned(page);
	await page.mouse.move(300, 700);
	await page.mouse.wheel(0, 480);
	await expect.poll(async () => (await page.locator('#fields').boundingBox())!.y).toBeLessThan(0);
	await fields.click();
	await expect(page).toHaveURL(/#fields$/);
	await expect(page.locator('#fields')).toBeFocused();
	await fieldsAligned(page);
	// A repeated hash does not emit hashchange: continued alignment on wrapping
	// must come from the anchor found in this shadow link's composed click path.
	await page.setViewportSize({ width: 390, height: 1000 });
	await fieldsAligned(page);
	await page.setViewportSize({ width: 1440, height: 1000 });
	await fieldsAligned(page);

	await page.mouse.move(300, 700);
	await page.mouse.wheel(0, 480);
	await expect.poll(async () => (await page.locator('#fields').boundingBox())!.y).toBeLessThan(0);
	await settleScroll(page);
	// Isolate canceled navigation from the browser's legitimate focus scrolling.
	await fields.evaluate((link: HTMLElement) => link.focus({ preventScroll: true }));
	const before = { url: page.url(), scroll: await page.evaluate(() => scrollY) };
	await host.evaluate(element => {
		document.addEventListener('click', event => {
			if (event.composedPath().includes(element)) event.preventDefault();
		}, { once: true });
	});
	await fields.press('Enter');
	await settleFrames(page);
	expect(page.url()).toBe(before.url);
	expect(Math.abs(await page.evaluate(() => scrollY) - before.scroll)).toBeLessThan(2);

	const choices = host.getByRole('link', { name: 'Selection', exact: true });
	const popupPromise = context.waitForEvent('page');
	await choices.click({ modifiers: ['ControlOrMeta'] });
	const popup = await popupPromise;
	await popup.waitForURL(/#choices$/);
	await popup.close();
	await page.bringToFront();
	await settleFrames(page);
	expect(page.url()).toBe(before.url);
	// Native focus restoration may scroll slightly after switching tabs. The
	// canceled hash destination must remain above the viewport, not rearmed.
	expect((await page.locator('#fields').boundingBox())!.y).toBeLessThan(0);
	expect(errors).toEqual([]);
});
