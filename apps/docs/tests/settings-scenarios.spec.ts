import { expect, test, type Locator, type Page } from '@playwright/test';

const routes = [
	{ path: '/workflows/settings', label: 'Explore', scenario: 'explore', title: 'Design settings' },
	{ path: '/workflows/settings/commands', label: 'Commands', scenario: 'commands', title: 'Compare command entry points' },
	{ path: '/workflows/settings/validation', label: 'Validation', scenario: 'validation', title: 'Recover from invalid input' },
	{ path: '/workflows/settings/save-retry', label: 'Save and retry', scenario: 'save-retry', title: 'Recover from a failed save' },
	{ path: '/workflows/settings/pending-save', label: 'Pending save', scenario: 'pending-save', title: 'Keep editing during a pending save' },
	{ path: '/workflows/settings/incoming-update', label: 'Incoming update', scenario: 'incoming-update', title: 'Review an incoming update' },
] as const;
type Scenario = typeof routes[number]['scenario'];
const scene = (page: Page) => page.locator('#settings');
const navigation = (page: Page) => page.locator('en-navigation[label="Settings review scenarios"]');
const opacity = (page: Page) => scene(page).getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
const saved = (page: Page) => scene(page).locator('[data-settings-saved]');
const current = (page: Page) => scene(page).locator('[data-settings-current]');
const status = (page: Page) => scene(page).locator('[data-settings-status]');
const routeFor = (scenario: Scenario) => routes.find(route => route.scenario === scenario)!;
const initialSnapshot = '64% opacity · PNG · Portrait · Background included';
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = [];
	errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'No runtime errors while reviewing Settings scenarios').toEqual([]); });

async function press(scene: Locator, name: string) {
	const button = scene.getByRole('button', { name, exact: true });
	await button.focus();
	await button.press('Enter');
}
async function assertRoute(page: Page, scenario: Scenario) {
	const route = routeFor(scenario);
	await expect.poll(() => new URL(page.url()).pathname).toBe(route.path);
	await expect(scene(page)).toBeVisible();
	await expect(page.locator('[data-workflow="settings"]')).toHaveCount(1);
	await expect(page.locator('[data-workflow="settings"]')).toHaveAttribute('data-settings-scenario', scenario);
	await expect(scene(page).getByRole('heading', { name: route.title, exact: true })).toBeVisible();
	await expect(page.locator('#sso, #chat, #selection')).toHaveCount(0);
	await expect(navigation(page).getByRole('navigation', { name: 'Settings review scenarios', exact: true })).toBeVisible();
	// Start from the public host: the anchors are authored light-DOM children.
	await expect(navigation(page).locator(':scope > a')).toHaveCount(routes.length);
	await expect(navigation(page).locator('[aria-current="page"]')).toHaveCount(1);
	await expect(navigation(page).getByRole('link', { name: route.label, exact: true })).toHaveAttribute('aria-current', 'page');
	if (scenario !== 'explore') {
		await expect(scene(page).getByRole('heading', { name: 'Try this', exact: true })).toBeVisible();
		await expect(scene(page).getByRole('heading', { name: 'Expected result', exact: true })).toBeVisible();
		await expect(scene(page).getByRole('heading', { name: 'Scenario controls', exact: true })).toBeVisible();
		await expect(scene(page).locator('summary').filter({ hasText: 'Settings simulation controls' })).toHaveCount(0);
	}
}
async function ready(page: Page, scenario: Scenario) {
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-workflows-app').evaluate((element: any) => Boolean(element.hasUpdated))).toBe(true);
	await assertRoute(page, scenario);
}
async function open(page: Page, scenario: Scenario) {
	await page.goto(routeFor(scenario).path);
	await ready(page, scenario);
}
async function setOpacity(page: Page, value: string) {
	await opacity(page).fill(value);
	await opacity(page).press('Enter');
}
async function assertPreviewContext(page: Page) {
	const url = new URL(page.url());
	expect(url.searchParams.has('progress-report')).toBe(true);
	expect(url.searchParams.get('review')).toBe('settings-scenarios');
	expect(url.searchParams.get('theme')).toBe('dark');
	expect(url.searchParams.get('density')).toBe('compact');
	expect(url.searchParams.get('direction')).toBe('rtl');
	await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
	await expect(page.getByRole('combobox', { name: 'Density', exact: true })).toHaveValue('compact');
	await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
	await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
}

test('each Settings scenario is a direct SSR document with its own guide, current native link and relevant controls before JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		for (const route of routes) {
			const response = await page.goto(route.path);
			expect(response?.ok()).toBe(true);
			expect(response?.request().redirectedFrom()).toBeNull();
			await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
			await assertRoute(page, route.scenario);
			await expect(opacity(page)).toHaveValue('64');
			await expect(saved(page)).toHaveText(initialSnapshot);
			await expect(scene(page).getByRole('form', { name: 'Creative output settings', exact: true })).toBeVisible();
			for (const destination of routes) {
				const href = await navigation(page).getByRole('link', { name: destination.label, exact: true }).getAttribute('href');
				expect(new URL(href!, page.url()).pathname).toBe(destination.path);
			}
			if (route.scenario === 'commands') {
				await expect(scene(page).getByRole('checkbox', { name: 'Enable Ctrl/⌘+K command shortcut', exact: true })).toBeVisible();
			}
			if (route.scenario === 'save-retry') {
				await expect(scene(page).getByRole('combobox', { name: 'Settings save result', exact: true })).toHaveValue('failure');
			}
			if (route.scenario === 'pending-save' || route.scenario === 'incoming-update') {
				await expect(scene(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeVisible();
				await expect(scene(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
			}
			if (route.scenario === 'incoming-update') {
				await expect(scene(page).getByRole('combobox', { name: 'Settings response delivery', exact: true })).toHaveValue('delayed');
				await expect(scene(page).getByRole('button', { name: 'Queue collaborator update', exact: true })).toBeVisible();
			}
			if (route.scenario !== 'explore' && route.scenario !== 'save-retry') {
				await expect(scene(page).getByRole('combobox', { name: 'Settings save result', exact: true })).toHaveCount(0);
			}
			if (route.scenario !== 'explore' && route.scenario !== 'incoming-update') {
				await expect(scene(page).getByRole('combobox', { name: 'Settings response delivery', exact: true })).toHaveCount(0);
				await expect(scene(page).getByRole('button', { name: 'Queue collaborator update', exact: true })).toHaveCount(0);
			}
		}
	} finally { await context.close(); }
});

test('direct validation hydration preserves the early native exact-entry draft, shadow root and focus', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	let waiting = 0;
	await page.route('**/*', async route => {
		if (route.request().resourceType() === 'script') { waiting++; await gate; }
		await route.continue();
	});
	try {
		await page.goto(routeFor('validation').path, { waitUntil: 'commit' });
		await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
		await assertRoute(page, 'validation');
		await expect.poll(() => waiting).toBeGreaterThan(0);
		await opacity(page).fill('101');
		const identity = await opacity(page).evaluateHandle(input => ({ input, root: input.getRootNode() }));
		release();
		await ready(page, 'validation');
		await expect(opacity(page)).toHaveValue('101');
		await expect(opacity(page)).toBeFocused();
		expect(await opacity(page).evaluate((input, saved) => input === saved.input && input.getRootNode() === saved.root, identity)).toBe(true);
		await press(scene(page), 'Save settings');
		await expect(opacity(page)).toBeFocused();
		await expect(opacity(page)).toHaveAttribute('aria-invalid', 'true');
		await expect(saved(page)).toHaveText(initialSnapshot);
		await identity.dispose();
	} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});

test('native scenario navigation, history and refresh retain preview context while links load separate documents', async ({ page }) => {
	await page.goto('/workflows/settings?progress-report&review=settings-scenarios&theme=dark&density=compact&direction=rtl');
	await ready(page, 'explore');
	await assertPreviewContext(page);
	for (const scenario of ['commands', 'validation', 'save-retry'] as const) {
		await page.evaluate(() => { (window as any).scenarioDocumentMarker = true; });
		const route = routeFor(scenario);
		const link = navigation(page).getByRole('link', { name: route.label, exact: true });
		const href = new URL((await link.getAttribute('href'))!, page.url());
		expect(href.searchParams.get('theme')).toBe('dark');
		expect(href.searchParams.get('density')).toBe('compact');
		expect(href.searchParams.get('direction')).toBe('rtl');
		expect(href.searchParams.has('progress-report')).toBe(true);
		await link.focus(); await link.press('Enter');
		await ready(page, scenario);
		expect(await page.evaluate(() => (window as any).scenarioDocumentMarker)).toBeUndefined();
		await assertPreviewContext(page);
	}
	await page.goBack();
	await ready(page, 'validation');
	await assertPreviewContext(page);
	await page.goForward();
	await ready(page, 'save-retry');
	await assertPreviewContext(page);
	await page.reload();
	await ready(page, 'save-retry');
	await assertPreviewContext(page);
	await expect(scene(page).getByRole('combobox', { name: 'Settings save result', exact: true })).toHaveValue('failure');
});

test('Save and retry begins with the promised failure, retains the edit, retries once and Reset restores its preset', async ({ page }) => {
	await open(page, 'save-retry');
	const outcome = scene(page).getByRole('combobox', { name: 'Settings save result', exact: true });
	await expect(outcome).toHaveValue('failure');
	await setOpacity(page, '71');
	await press(scene(page), 'Save settings');
	await expect(status(page)).toHaveText('The simulated save failed. Your local settings are intact. Retry save when ready.');
	await expect(opacity(page)).toHaveValue('71');
	await expect(saved(page)).toHaveText(initialSnapshot);
	await expect(outcome).toHaveValue('success');
	await press(scene(page), 'Retry save');
	await expect(saved(page)).toHaveText('71% opacity · PNG · Portrait · Background included');
	await expect(status(page)).toHaveText('Saved revision 2.');
	await expect(scene(page).locator('[data-settings-notifications] en-toast')).toContainText('Saved revision 2.');
	await expect(scene(page).locator('[data-settings-notifications]').getByRole('status')).toBeEmpty();
	await press(scene(page), 'Reset settings demo');
	await expect(outcome).toHaveValue('failure');
	await expect(opacity(page)).toHaveValue('64');
	await expect(saved(page)).toHaveText(initialSnapshot);
	await expect(status(page)).toHaveText('Settings demo reset to revision 1.');
	await setOpacity(page, '73');
	await press(scene(page), 'Save settings');
	await expect(status(page)).toHaveText('The simulated save failed. Your local settings are intact. Retry save when ready.');
	await expect(opacity(page)).toHaveValue('73');
	await expect(saved(page)).toHaveText(initialSnapshot);
});

test('Pending save starts held, preserves later edits on Cancel and Reset cancels the next held request while retaining the scenario', async ({ page }) => {
	await open(page, 'pending-save');
	const deliver = scene(page).getByRole('button', { name: 'Deliver held response', exact: true });
	await setOpacity(page, '70');
	await press(scene(page), 'Save settings');
	await expect(deliver).toBeEnabled();
	await expect(saved(page)).toHaveText(initialSnapshot);
	await scene(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
	await press(scene(page), 'Cancel save');
	await expect(deliver).toBeDisabled();
	await expect(current(page)).toHaveText('70% opacity · SVG · Portrait · Background included');
	await expect(saved(page)).toHaveText(initialSnapshot);
	await expect(status(page)).toHaveText('Stopped waiting for this save. Your local settings are unchanged.');
	await press(scene(page), 'Save settings');
	await expect(deliver).toBeEnabled();
	await press(scene(page), 'Reset settings demo');
	await expect(deliver).toBeDisabled();
	await expect(current(page)).toHaveText(initialSnapshot);
	await expect(saved(page)).toHaveText(initialSnapshot);
	await assertRoute(page, 'pending-save');
	// The reset restores the route's held-delivery preset rather than Explore's delay.
	await setOpacity(page, '74');
	await press(scene(page), 'Save settings');
	await expect(deliver).toBeEnabled();
	await expect(saved(page)).toHaveText(initialSnapshot);
	await press(scene(page), 'Deliver held response');
	await expect(saved(page)).toHaveText('74% opacity · PNG · Portrait · Background included');
	await expect(status(page)).toHaveText('Saved revision 2.');
});

test('Incoming update exposes delivery controls and lets reviewers keep a draft or use only the incoming opacity', async ({ page }) => {
	await open(page, 'incoming-update');
	await scene(page).getByRole('combobox', { name: 'Settings response delivery', exact: true }).selectOption('held');
	await scene(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
	await press(scene(page), 'Queue collaborator update');
	await opacity(page).fill('101');
	const identity = await opacity(page).elementHandle();
	await press(scene(page), 'Deliver held response');
	await expect(scene(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toBeVisible();
	await expect(opacity(page)).toHaveValue('101');
	expect(await opacity(page).evaluate((input, original) => input === original, identity)).toBe(true);
	await press(scene(page), 'Keep my opacity');
	await expect(scene(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toHaveCount(0);
	await expect(opacity(page)).toHaveValue('101');
	await expect(scene(page).getByRole('combobox', { name: 'Output format', exact: true })).toHaveValue('svg');
	await press(scene(page), 'Queue collaborator update');
	await press(scene(page), 'Deliver held response');
	await expect(scene(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toBeVisible();
	await press(scene(page), 'Use updated opacity');
	await expect(opacity(page)).toHaveValue('82');
	await expect(current(page)).toHaveText('82% opacity · SVG · Portrait · Background included');
	await expect(scene(page).getByRole('heading', { name: 'Creative output settings', exact: true })).toBeFocused();
	await press(scene(page), 'Reset settings demo');
	await expect(scene(page).getByRole('combobox', { name: 'Settings response delivery', exact: true })).toHaveValue('delayed');
	await expect(current(page)).toHaveText(initialSnapshot);
	await expect(scene(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
});

test('Validation follows its palette Save journey, focuses the real field error and saves the correction before Reset', async ({ page }) => {
	await open(page, 'validation');
	await opacity(page).fill('101');
	await press(scene(page), 'Search commands');
	const palette = scene(page).locator('#settings-command-palette');
	await palette.getByRole('combobox', { name: 'Find a settings command', exact: true }).fill('save');
	await palette.getByRole('option', { name: 'Save settings', exact: true }).click();
	await expect(palette).toHaveJSProperty('open', false);
	await expect(opacity(page)).toBeFocused();
	await expect(opacity(page)).toHaveAttribute('aria-invalid', 'true');
	await expect(opacity(page)).toHaveValue('101');
	const error = scene(page).locator('en-slider [part~="error"]');
	await expect(error).toBeVisible();
	const errorNode = await error.elementHandle();
	expect(await opacity(page).evaluate((input, error) => (input.getAttribute('aria-describedby') ?? '').split(' ').some(id => (input.getRootNode() as ShadowRoot).getElementById(id) === error), errorNode)).toBe(true);
	expect(await scene(page).getByRole('form', { name: 'Creative output settings', exact: true }).evaluate(form => new FormData(form as HTMLFormElement).get('opacity'))).toBe('64');
	await expect(saved(page)).toHaveText(initialSnapshot);
	await expect(scene(page).getByRole('button', { name: 'Saving settings…', exact: true })).toHaveCount(0);
	await setOpacity(page, '72');
	await press(scene(page), 'Save settings');
	await expect(saved(page)).toHaveText('72% opacity · PNG · Portrait · Background included');
	await expect(status(page)).toHaveText('Saved revision 2.');
	await press(scene(page), 'Reset settings demo');
	await expect(opacity(page)).toHaveValue('64');
	await expect(opacity(page)).not.toHaveAttribute('aria-invalid', 'true');
	await expect(saved(page)).toHaveText(initialSnapshot);
	await assertRoute(page, 'validation');
});

test('narrow RTL scenario links retain native keyboard navigation and reading direction across pages', async ({ page, browserName }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/workflows/settings/commands?direction=rtl&progress-report');
	await ready(page, 'commands');
	await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
	const commands = navigation(page).getByRole('link', { name: 'Commands', exact: true });
	const validation = navigation(page).getByRole('link', { name: 'Validation', exact: true });
	await commands.focus();
	await commands.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(validation).toBeFocused();
	await validation.press('Enter');
	await ready(page, 'validation');
	await expect(page.locator('.workflow-navigation')).toHaveCSS('position', 'sticky');
	await expect.poll(async () => {
		const wrapper = await page.locator('.workflow-navigation').boundingBox();
		const target = await scene(page).boundingBox();
		return Boolean(wrapper && target && target.y >= wrapper.y + wrapper.height - 1 && target.y < wrapper.y + wrapper.height + 100);
	}).toBe(true);
	await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
	await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
	expect(new URL(page.url()).searchParams.has('progress-report')).toBe(true);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	await navigation(page).getByRole('link', { name: 'Pending save', exact: true }).focus();
	await page.keyboard.press('Enter');
	await ready(page, 'pending-save');
	await expect(scene(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
