import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const workflows = [
	{ id: 'sso', label: 'Sign-in', path: '/workflows', file: '/workflows.html' },
	{ id: 'settings', label: 'Settings', path: '/workflows/settings', file: '/workflows/settings.html' },
	{ id: 'chat', label: 'Chat', path: '/workflows/chat', file: '/workflows/chat.html' },
	{ id: 'selection', label: 'Selection', path: '/workflows/selection', file: '/workflows/selection.html' },
	{ id: 'multi-step', label: 'Project brief', path: '/workflows/multi-step', file: '/workflows/multi-step.html' },
	{ id: 'assets', label: 'Assets', path: '/workflows/assets', file: '/workflows/assets.html' },
] as const;
const initialProject = 'Studio North · Autumn campaign';
const finalProject = 'Willow · Year in review';
const scene = (page: Page) => page.locator('#selection');
const project = (page: Page) => scene(page).getByRole('combobox', { name: 'Project', exact: true });
const projectHost = (page: Page) => scene(page).locator('en-combobox');
const form = (page: Page) => scene(page).getByRole('form', { name: 'Assign campaign brief', exact: true });
const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const errors: string[] = [];
	runtimeErrors.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
	page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }, info) => {
	const errors = runtimeErrors.get(page) ?? [];
	if (errors.length) await info.attach('selection-runtime-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
	expect(errors, 'No runtime errors during the built Selection workflow').toEqual([]);
});

async function hydrated(page: Page) {
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	await expect.poll(() => page.locator('en-workflows-app').evaluate(root => [...root.querySelectorAll('*')]
		.filter(element => element.localName.includes('-'))
		.every(element => {
			const definition = customElements.get(element.localName);
			// Settings deliberately loads optional command code without registering it
			// until Search commands is activated; eager fields must still hydrate.
			if (!definition) return element.localName === 'en-command-palette'
				&& element.id === 'settings-command-palette'
				&& Boolean(root.querySelector('[data-workflow="settings"]')?.contains(element));
			return element instanceof definition && Boolean((element as HTMLElement & { hasUpdated?: boolean }).hasUpdated);
		}))).toBe(true);
}
async function submittedId(page: Page) {
	return form(page).evaluate(element => new FormData(element as HTMLFormElement).get('project'));
}
async function assertAccepted(page: Page, id: string, label: string) {
	expect(await projectHost(page).evaluate(element => (element as HTMLElement & { value: string }).value)).toBe(id);
	await expect(scene(page).locator('[data-selection-accepted]')).toHaveText(`${label} · ${id}`);
	expect(await submittedId(page)).toBe(id);
}
async function assertPage(page: Page, entry: typeof workflows[number]) {
	await expect(page.locator('.workflow-section')).toHaveCount(1);
	await expect(page.locator(`#${entry.id}.workflow-section`)).toBeVisible();
	const navigation = page.locator('en-navigation.section-nav');
	await expect(navigation.getByRole('navigation', { name: 'Workflow sections', exact: true })).toBeVisible();
	await expect(navigation.getByRole('link')).toHaveCount(workflows.length);
	await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
	await expect(navigation.getByRole('link', { name: entry.label, exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(page.locator('.workflow-tools')).toHaveCount(1);
	await expect(page.locator('.code-disclosure')).toHaveCount(1);
}
async function choose(page: Page, label: string) {
	await project(page).scrollIntoViewIfNeeded();
	await project(page).fill(label);
	await expect(project(page)).toHaveAttribute('aria-expanded', 'true');
	const option = scene(page).getByRole('option', { name: label, exact: true });
	await expect(option).toBeVisible();
	await project(page).press('ArrowDown');
	const activeId = await option.getAttribute('id');
	expect(activeId).not.toBeNull();
	await expect(project(page)).toHaveAttribute('aria-activedescendant', activeId!);
	await project(page).press('Enter');
	await expect(project(page)).toHaveValue(label);
	await expect(project(page)).toHaveAttribute('aria-expanded', 'false');
}

test('Selection SSR keeps the native input, early query and selection range through hydration without accepting the query', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		// Hashless initial navigation isolates hydration from native fragment focusing.
		await page.goto('/workflows/selection', { waitUntil: 'commit' });
		await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
		await assertPage(page, workflows[3]);
		const input = project(page);
		await expect(input).toHaveValue(initialProject);
		await expect(input).toHaveAccessibleDescription('Type to filter, then choose a project. Typing alone does not change the assignment.');
		const original = await input.elementHandle();
		await input.fill('Studio');
		await input.evaluate(node => (node as HTMLInputElement).setSelectionRange(1, 4, 'backward'));
		release();
		await hydrated(page);
		await expect(input).toHaveValue('Studio');
		await expect(input).toBeFocused();
		expect(await input.evaluate((node, before) => ({
			same: node === before,
			start: (node as HTMLInputElement).selectionStart,
			end: (node as HTMLInputElement).selectionEnd,
			direction: (node as HTMLInputElement).selectionDirection,
		}), original)).toEqual({ same: true, start: 1, end: 4, direction: 'backward' });
		await expect(input).toHaveAttribute('aria-expanded', 'false');
		await assertAccepted(page, 'project-01', initialProject);
		await expect(scene(page).locator('[data-selection-submission]')).toHaveText('No assignment submitted.');
		await input.press('Escape');
		await expect(input).toHaveValue(initialProject);
		await original?.dispose();
	} finally { release(); }
});

test('Selection submits an explicitly chosen ID, rejects unavailable or unfinished queries, and resets the form receipt', async ({ page }) => {
	await page.goto('/workflows/selection');
	await hydrated(page);
	const input = project(page);
	await input.scrollIntoViewIfNeeded();
	await scene(page).getByRole('button', { name: 'Show options', exact: true }).click();
	await expect(scene(page).getByRole('option')).toHaveCount(40);
	await expect(scene(page).getByRole('option', { disabled: true })).toHaveCount(3);
	// A real option click from the end of the unfiltered catalog exercises the scrollable list.
	await scene(page).getByRole('option', { name: finalProject, exact: true }).click();
	await expect(input).toHaveValue(finalProject);
	await assertAccepted(page, 'project-40', finalProject);
	await scene(page).getByRole('button', { name: 'Assign brief', exact: true }).click();
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText(`Submission 1: ${finalProject} · project=project-40`);
	await expect(scene(page).locator('[data-selection-status]')).toHaveText(`Assignment 1 recorded locally for ${finalProject}.`);

	await input.fill('Archive');
	const unavailable = scene(page).getByRole('option', { name: 'Studio East · Archive (unavailable)', exact: true });
	await expect(unavailable).toBeDisabled();
	await unavailable.scrollIntoViewIfNeeded();
	const unavailableBox = await unavailable.boundingBox();
	expect(unavailableBox).not.toBeNull();
	// A pointer hit checks disabled behavior without invoking a private component method.
	await page.mouse.click(unavailableBox!.x + unavailableBox!.width / 2, unavailableBox!.y + unavailableBox!.height / 2);
	await input.press('ArrowDown');
	await input.press('Enter');
	await assertAccepted(page, 'project-40', finalProject);
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText(`Submission 1: ${finalProject} · project=project-40`);
	await input.press('Escape');
	await expect(input).toHaveValue(finalProject);

	await input.fill('no matching project 999');
	await expect(scene(page).getByText('No matching options.', { exact: true })).toBeVisible();
	await input.press('Enter');
	await assertAccepted(page, 'project-40', finalProject);
	// Native submission while the editor still owns an unresolved query must fail validation.
	await form(page).evaluate(element => (element as HTMLFormElement).requestSubmit());
	expect(await form(page).evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(false);
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText(`Submission 1: ${finalProject} · project=project-40`);
	await input.press('Escape');
	await expect(input).toHaveValue(finalProject);
	expect(await form(page).evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(true);

	await choose(page, 'Atlas · Website refresh');
	await assertAccepted(page, 'project-10', 'Atlas · Website refresh');
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText(`Submission 1: ${finalProject} · project=project-40`);
	await scene(page).getByRole('button', { name: 'Assign brief', exact: true }).click();
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText('Submission 2: Atlas · Website refresh · project=project-10');
	await input.fill('unfinished reset query');
	await page.getByRole('button', { name: 'Reset project selection workflow', exact: true }).click();
	await expect(input).toHaveValue(initialProject);
	await assertAccepted(page, 'project-01', initialProject);
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText('No assignment submitted.');
	await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('Selection supports keyboard scrolling and real project selection in narrow RTL layouts with scoped accessibility checks', async ({ page }, info) => {
	for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
		await page.setViewportSize(viewport);
		await page.goto('/workflows/selection?direction=rtl&density=spacious');
		await hydrated(page);
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
		await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
		const scrollport = scene(page).getByRole('region', { name: 'Campaign brief and project assignment', exact: true });
		const beforeScroll = await scrollport.evaluate(element => ({ position: element.scrollTop, range: element.scrollHeight - element.clientHeight }));
		expect(beforeScroll.range).toBeGreaterThan(0);
		await scrollport.focus();
		await expect(scrollport).toBeFocused();
		await scrollport.press('PageDown');
		await expect.poll(() => scrollport.evaluate(element => element.scrollTop)).toBeGreaterThan(beforeScroll.position);
		expect(await scrollport.evaluate(element => {
			const style = getComputedStyle(element);
			return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
		})).toBe(true);
		const input = project(page);
		await input.scrollIntoViewIfNeeded();
		await input.fill('Lumen');
		await expect(input).toHaveAttribute('aria-expanded', 'true');
		const list = scene(page).getByRole('listbox');
		await expect(list).toBeVisible();
		await input.press('ArrowDown');
		await expect.poll(async () => Boolean(await input.getAttribute('aria-activedescendant'))).toBe(true);
		// The public popup part is the bounded scroll surface; list content may exceed it.
		const listBounds = await projectHost(page).locator('[part~="popup"]').boundingBox();
		const inputBounds = await input.boundingBox();
		expect(listBounds).not.toBeNull();
		expect(inputBounds).not.toBeNull();
		const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }));
		expect(geometry.overflow).toBe(false);
		expect(listBounds!.x).toBeGreaterThanOrEqual(-1);
		expect(listBounds!.x + listBounds!.width).toBeLessThanOrEqual(geometry.width + 1);
		expect(listBounds!.y).toBeGreaterThanOrEqual(-1);
		expect(listBounds!.y + listBounds!.height).toBeLessThanOrEqual(geometry.height + 1);
		expect(listBounds!.y + listBounds!.height <= inputBounds!.y + 1 || listBounds!.y >= inputBounds!.y + inputBounds!.height - 1).toBe(true);
		await expect(input).toBeFocused();
		const result = await new AxeBuilder({ page }).include('#selection').include('.theme-controls')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
		await info.attach(`selection-rtl-${viewport.width}-axe`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
		expect(result.violations).toEqual([]);
		await info.attach(`selection-rtl-${viewport.width}`, { body: await page.screenshot(), contentType: 'image/png' });
		await input.press('Escape');
		await expect(input).toHaveValue(initialProject);
		await choose(page, 'Lumen · Accessibility guide');
		await scene(page).getByRole('button', { name: 'Assign brief', exact: true }).click();
		await expect(scene(page).locator('[data-selection-submission]')).toHaveText('Submission 1: Lumen · Accessibility guide · project=project-31');
	}
});

test('all six workflow documents remain separately addressable and native navigation preserves preview and unrelated query values', async ({ page, browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const serverPage = await context.newPage();
	try {
		for (const entry of workflows) {
			for (const path of [entry.path, entry.file]) {
				const response = await serverPage.goto(path);
				expect(response?.ok()).toBe(true);
				await expect(serverPage.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
				await assertPage(serverPage, entry);
				for (const destination of workflows) {
					const link = serverPage.locator('en-navigation.section-nav')
						.getByRole('link', { name: destination.label, exact: true });
					expect(new URL((await link.getAttribute('href'))!, serverPage.url()).pathname).toBe(destination.path);
				}
			}
		}
	} finally { await context.close(); }

	await page.goto('/workflows/selection?progress-report&review=selection-navigation&theme=dark&density=compact&direction=rtl');
	await hydrated(page);
	await choose(page, finalProject);
	await scene(page).getByRole('button', { name: 'Assign brief', exact: true }).click();
	const assertContext = async () => {
		const url = new URL(page.url());
		expect(url.searchParams.has('progress-report')).toBe(true);
		expect(url.searchParams.get('review')).toBe('selection-navigation');
		expect(url.searchParams.get('theme')).toBe('dark');
		expect(url.searchParams.get('density')).toBe('compact');
		expect(url.searchParams.get('direction')).toBe('rtl');
		await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
		await expect(page.getByRole('combobox', { name: 'Density', exact: true })).toHaveValue('compact');
		await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
	};
	for (const destination of [...workflows, workflows[3]]) {
		await page.evaluate(() => { (window as Window & { selectionDocumentMarker?: boolean }).selectionDocumentMarker = true; });
		const link = page.locator('en-navigation.section-nav').getByRole('link', { name: destination.label, exact: true });
		await link.focus();
		await link.press('Enter');
		await expect.poll(() => new URL(page.url()).pathname).toBe(destination.path);
		await hydrated(page);
		await assertPage(page, destination);
		await assertContext();
		expect(await page.evaluate(() => (window as Window & { selectionDocumentMarker?: boolean }).selectionDocumentMarker)).toBeUndefined();
	}
	// The final native link created a fresh Selection document, not a hidden retained workflow.
	await expect(project(page)).toHaveValue(initialProject);
	await expect(scene(page).locator('[data-selection-submission]')).toHaveText('No assignment submitted.');
});
