import { expect, test, type Page, type Route } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { hashValue } from '@en-reve/tokens';
import { holdThemeController } from './theme-controller-transport.js';

test('candidate metadata and token search use only accepted en-change values', async ({ page }) => {
	await page.goto('/theme-review');
	await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
	const title = page.getByRole('textbox', { name: 'Candidate title', exact: true });
	const rationale = page.getByRole('textbox', { name: 'Reason for change', exact: true });
	const search = page.getByRole('searchbox', { name: 'Find a token', exact: true });
	const token = page.getByRole('combobox', { name: 'Token', exact: true });
	const optionCount = await token.getByRole('option').count();
	await page.locator('en-theme-review-app').evaluate(element => {
		element.addEventListener('en-change', event => {
			if ((event as CustomEvent).detail.proposed.startsWith('Rejected')) event.preventDefault();
		}, { capture: true });
	});
	await title.fill('Accepted candidate');
	await rationale.fill('Accepted rationale');
	await title.fill('Rejected title');
	await rationale.fill('Rejected rationale');
	await search.fill('Rejected filter');
	await expect(token.getByRole('option')).toHaveCount(optionCount);
	const exported = await downloadCandidate(page);
	expect(exported.value.draft.candidate.title).toBe('Accepted candidate');
	expect(exported.value.draft.candidate.rationale).toBe('Accepted rationale');
	await expect(title).toHaveValue('Rejected title');
	await expect(rationale).toHaveValue('Rejected rationale');
	await search.fill('component.option-list.radius');
	await expect(token.getByRole('option', { name: 'component.option-list.radius', exact: true })).toHaveCount(1);
	await title.fill('Revised candidate');
	await rationale.fill('Revised rationale');
	const revised = await downloadCandidate(page);
	expect(revised.value.draft.candidate.title).toBe('Revised candidate');
	expect(revised.value.draft.candidate.rationale).toBe('Revised rationale');
});


const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const errors: string[] = [];
	runtimeErrors.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});

test.afterEach(async ({ page }, info) => {
	const errors = runtimeErrors.get(page) ?? [];
	if (errors.length) await info.attach('runtime-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
	expect(errors, 'Theme Review and its previews have no uncaught runtime errors').toEqual([]);
});

async function openThemeReview(page: Page) {
	await page.goto('/theme-review');
	await expect(page.getByRole('heading', { name: 'Theme Review', exact: true })).toBeVisible();
	await page.waitForFunction(() => {
		const host = document.querySelector('en-search-input[label="Find a token"]');
		return Boolean(host && customElements.get(host.localName) && (host as any).hasUpdated);
	});
	await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
	const load = page.getByRole('button', { name: 'Load previews', exact: true });
	const compact = !await load.isVisible();
	if (compact) await workspaceView(page, 'Preview');
	await load.click();
	if (compact) await workspaceView(page, 'Edit');
}

async function chooseToken(page: Page, token: string) {
	const search = page.getByRole('searchbox', { name: 'Find a token', exact: true });
	await search.fill(token);
	await expect(search).toHaveValue(token);
	const selector = page.getByRole('combobox', { name: 'Token', exact: true });
	await expect(selector.getByRole('option', { name: token, exact: true })).toHaveCount(1);
	await selector.selectOption(token);
	await expect(selector).toHaveValue(token);
}

async function workspaceView(page: Page, name: 'Edit' | 'Preview') {
	const switcher = page.locator('.review-view-switch');
	await switcher.getByText(name, { exact: true }).click();
	await expect(switcher.getByRole('radio', { name, exact: true })).toBeChecked();
}

async function downloadCandidate(page: Page) {
	const promise = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export candidate', exact: true }).click();
	const download = await promise;
	expect(download.suggestedFilename().endsWith('.json')).toBe(true);
	expect(await download.failure()).toBeNull();
	const path = await download.path();
	expect(path).not.toBeNull();
	const bytes = await readFile(path!);
	return { bytes, value: JSON.parse(bytes.toString()) as Record<string, any> };
}

async function reopenCandidate(page: Page, value: unknown, name = 'candidate.json') {
	await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles({
		name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)),
	});
}

const editor = (page: Page) => page.getByRole('form', { name: 'Token editor', exact: true });
const preview = (page: Page, kind: 'Baseline' | 'Candidate') => page.frameLocator(`iframe[title="${kind} preview"]`);
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function previewToken(page: Page, kind: 'Baseline' | 'Candidate', property: string) {
	return preview(page, kind).locator('html').evaluate((html, name) => getComputedStyle(html).getPropertyValue(name).trim(), property);
}

async function pinRadius(page: Page) {
	await chooseToken(page, 'radius.control');
	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '1rem' });
	await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
}

test('family geometry can be pinned, restored and reopened while preview drafts remain intact', async ({ page }) => {
	await openThemeReview(page);
	const row = (kind: 'Baseline' | 'Candidate') => preview(page, kind).locator('[data-specimen="family-geometry"] .geometry-scope').first();
	const field = row('Candidate').getByRole('textbox', { name: 'Project', exact: true });
	await field.fill('Geometry review draft');
	const original = await field.elementHandle();
	for (const [id, value] of [
		['component.button.inline-padding', '1.25rem'],
		['component.input.inline-padding', '0.5rem'],
		['component.segmented-control.frame-inset', '0.125rem'],
	]) {
		await chooseToken(page, id!);
		await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption({ label: 'Managed value' });
		await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: value! });
		await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
	}
	await expect(row('Candidate').getByRole('button', { name: 'Save', exact: true })).toHaveCSS('padding-left', '20px');
	await expect(field).toHaveCSS('padding-left', '8px');
	await expect(row('Candidate').locator('en-segmented-control [part="options"]')).toHaveCSS('padding', '2px');
	await expect(row('Baseline').getByRole('button', { name: 'Save', exact: true })).toHaveCSS('padding-left', '12px');
	await expect(row('Baseline').getByRole('textbox', { name: 'Project', exact: true })).toHaveCSS('padding-left', '12px');
	await expect(field).toHaveValue('Geometry review draft');
	expect(await field.evaluate((input, initial) => input === initial, original)).toBe(true);
	const candidate = await downloadCandidate(page);
	await editor(page).getByRole('button', { name: 'Restore default rule', exact: true }).click();
	await expect(row('Candidate').locator('en-segmented-control [part="options"]')).toHaveCSS('padding', '4px');
	await button(page, 'Undo').click();
	await expect(row('Candidate').locator('en-segmented-control [part="options"]')).toHaveCSS('padding', '2px');
	await button(page, 'Reset draft').click();
	await expect(row('Candidate').getByRole('button', { name: 'Save', exact: true })).toHaveCSS('padding-left', '12px');
	await reopenCandidate(page, candidate.value);
	await expect(row('Candidate').getByRole('button', { name: 'Save', exact: true })).toHaveCSS('padding-left', '20px');
	await expect(field).toHaveCSS('padding-left', '8px');
	await expect(row('Candidate').locator('en-segmented-control [part="options"]')).toHaveCSS('padding', '2px');
});

test('option-list geometry and transparent selection can be edited, reopened and restored independently', async ({ page }) => {
	await openThemeReview(page);
	await chooseToken(page, 'component.option-list.radius');
	await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption({ label: 'Managed value' });
	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '0.625rem' });
	await button(page, 'Apply pin').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-option-list-radius')).toBe('0.625rem');
	await expect.poll(() => previewToken(page, 'Baseline', '--en-option-list-radius')).toBe('');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-dialog')).toBe('1.25rem');

	await chooseToken(page, 'component.option.selected-background');
	await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption({ label: 'Managed value' });
	await editor(page).getByRole('spinbutton', { name: 'Opacity', exact: true }).fill('0');
	await button(page, 'Apply pin').click();
	const exported = await downloadCandidate(page);
	await button(page, 'Reset draft').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-option-list-radius')).toBe('');
	await reopenCandidate(page, exported.value);
	await expect.poll(() => previewToken(page, 'Candidate', '--en-option-list-radius')).toBe('0.625rem');
	await chooseToken(page, 'component.option.selected-background');
	await expect(editor(page).getByRole('spinbutton', { name: 'Opacity', exact: true })).toHaveValue('0');
	await button(page, 'Restore default rule').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-option-selected-background')).toBe('');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-option-list-radius')).toBe('0.625rem');
});

test('the server-rendered editor is accessible before modules and retains its focused native title through hydration', async ({ page }) => {
	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
	try {
		await page.goto('/theme-review', { waitUntil: 'commit' });
		await expect(page.locator('en-theme-review-app')).toHaveAttribute('data-ssr', '');
		await expect(editor(page)).toBeVisible();
		await expect(editor(page).getByRole('heading', { name: 'palette.accent', exact: true })).toBeVisible();
		await expect(editor(page).getByRole('spinbutton', { name: 'Red channel', exact: true })).toBeVisible();
		const title = page.getByRole('textbox', { name: 'Candidate title', exact: true });
		await expect(title).toHaveValue('Untitled theme');
		await title.focus();
		await title.evaluate(input => {
			(window as any).earlyThemeTitle = { input, root: input.getRootNode() };
			(input as HTMLInputElement).setSelectionRange(1, 5, 'backward');
		});
		release();
		await expect(page.locator('en-theme-review-app')).not.toHaveAttribute('data-ssr');
		await expect(button(page, 'Export candidate')).toBeEnabled();
		await expect(title).toBeFocused();
		expect(await title.evaluate(input => ({
			node: input === (window as any).earlyThemeTitle.input,
			root: input.getRootNode() === (window as any).earlyThemeTitle.root,
			selection: [(input as HTMLInputElement).selectionStart, (input as HTMLInputElement).selectionEnd, (input as HTMLInputElement).selectionDirection],
		}))).toEqual({ node: true, root: true, selection: [1, 5, 'backward'] });
		await expect(page.locator('iframe')).toHaveCount(0);
	} finally { release(); }
});

test('a managed pin changes the candidate alone and supports undo, redo, restore and reset', async ({ page }) => {
	await openThemeReview(page);
	await expect.poll(() => previewToken(page, 'Baseline', '--en-radius-control')).toBe('0.5rem');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	const specimenInput = preview(page, 'Candidate').locator('[data-specimen="text-fields"]').getByRole('textbox', { name: 'Project name', exact: true });
	await specimenInput.fill('Candidate-only working draft');
	const originalInput = await specimenInput.elementHandle();
	await pinRadius(page);
	await expect(specimenInput).toHaveValue('Candidate-only working draft');
	expect(await specimenInput.evaluate((input, original) => input === original, originalInput)).toBe(true);
	expect(await previewToken(page, 'Baseline', '--en-radius-control')).toBe('0.5rem');
	await expect(preview(page, 'Candidate').locator('[data-specimen="structured-values"]').getByRole('combobox', { name: 'Export format', exact: true })).toHaveCSS('border-top-left-radius', '16px');
	await expect(preview(page, 'Baseline').locator('[data-specimen="structured-values"]').getByRole('combobox', { name: 'Export format', exact: true })).toHaveCSS('border-top-left-radius', '8px');
	await button(page, 'Undo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	await button(page, 'Redo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await editor(page).getByRole('button', { name: 'Restore default rule', exact: true }).click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	await button(page, 'Undo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await button(page, 'Reset draft').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	expect(await previewToken(page, 'Baseline', '--en-radius-control')).toBe('0.5rem');
});

test('the same candidate reaches every separate preview page while each baseline remains unchanged', async ({ page }) => {
	await openThemeReview(page);
	await pinRadius(page);
	for (const destination of [
		{ value: 'sso', selector: '#sso', path: '/workflows' },
		{ value: 'settings', selector: '#settings', path: '/workflows/settings' },
		{ value: 'chat', selector: '#chat', path: '/workflows/chat' },
		{ value: 'selection', selector: '#selection', path: '/workflows/selection' },
		{ value: 'sheet', selector: 'en-sticker-app', path: '/' },
	]) {
		await page.getByRole('combobox', { name: 'Preview page', exact: true }).selectOption(destination.value);
		for (const kind of ['Baseline', 'Candidate'] as const) {
			await expect(preview(page, kind).locator(destination.selector)).toBeVisible();
			await expect.poll(() => preview(page, kind).locator('html').evaluate(() => location.pathname)).toBe(destination.path);
			await expect.poll(() => previewToken(page, kind, '--en-radius-control')).toBe(kind === 'Candidate' ? '1rem' : '0.5rem');
		}
	}
	await expect(page).toHaveURL(new URL('/theme-review', page.url()).href);
});

test('restoring a derived spacing rule resumes its relationship to the edited rhythm', async ({ page }) => {
	await openThemeReview(page);
	await chooseToken(page, 'space.2');
	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '1rem' });
	await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-space-2')).toBe('1rem');
	await chooseToken(page, 'rhythm.base');
	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '0.375rem' });
	await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
	// Inspect the actual spacing ruler's layout. Unregistered CSS properties may
	// preserve calc() expressions in computed serialization across engines.
	const ruler = (kind: 'Baseline' | 'Candidate', label: string) => preview(page, kind).locator('.spacing-ruler > div').filter({ hasText: label }).locator('i');
	await expect(ruler('Candidate', '4×')).toHaveCSS('inline-size', '24px');
	await expect(ruler('Candidate', '2×')).toHaveCSS('inline-size', '16px');
	await chooseToken(page, 'space.2');
	await editor(page).getByRole('button', { name: 'Restore default rule', exact: true }).click();
	await expect(ruler('Candidate', '2×')).toHaveCSS('inline-size', '12px');
	await expect(ruler('Baseline', '2×')).toHaveCSS('inline-size', '8px');
	await expect(ruler('Baseline', '4×')).toHaveCSS('inline-size', '16px');
});

test('an exported candidate reopens its pinned draft and keeps review evidence explicitly pending', async ({ page }, info) => {
	await openThemeReview(page);
	await pinRadius(page);
	const title = page.getByRole('textbox', { name: 'Candidate title', exact: true });
	const rationale = page.getByRole('textbox', { name: 'Reason for change', exact: true });
	await title.fill('Rounded corner candidate');
	await rationale.fill('Review the larger control corners.');
	const exported = await downloadCandidate(page);
	expect(exported.value.schema).toBe('en-reve/local-theme-review');
	expect(exported.value.schemaVersion).toBe(1);
	expect(exported.value.status).toBe('prepared');
	expect(exported.value.coverage.browserInteraction).toBe('not-run');
	expect(exported.value.coverage.visualComparison).toBe('not-run');
	expect(exported.value.coverage.manualAccessibility).toBe('not-run');
	expect(exported.value.resolvedTokens['radius.control'].value).toEqual({ value: 1, unit: 'rem' });
	await info.attach('exported-candidate', { body: exported.bytes, contentType: 'application/json' });
	await button(page, 'Reset draft').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	await expect(title).toHaveValue('Rounded corner candidate');
	await expect(rationale).toHaveValue('Review the larger control corners.');
	await title.fill('Previous local draft');
	await rationale.fill('Keep this unfinished local rationale.');
	await reopenCandidate(page, exported.value);
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await expect(title).toHaveValue('Rounded corner candidate');
	await expect(rationale).toHaveValue('Review the larger control corners.');
	await button(page, 'Undo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	await expect(title).toHaveValue('Previous local draft');
	await expect(rationale).toHaveValue('Keep this unfinished local rationale.');
	await button(page, 'Redo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await expect(title).toHaveValue('Rounded corner candidate');
	await expect(rationale).toHaveValue('Review the larger control corners.');
	expect(await previewToken(page, 'Baseline', '--en-radius-control')).toBe('0.5rem');
	const reopened = await downloadCandidate(page);
	expect(reopened.value.draft.candidate.candidateSourceHash).toBe(exported.value.draft.candidate.candidateSourceHash);
	expect(reopened.value.resolvedTokens).toEqual(exported.value.resolvedTokens);
});

test('malformed, modified and wrong-build files leave the current draft and undo history usable', async ({ page }) => {
	await openThemeReview(page);
	await pinRadius(page);
	const exported = await downloadCandidate(page);
	await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles({
		name: 'malformed.json', mimeType: 'application/json', buffer: Buffer.from('{'),
	});
	await expect(page.getByRole('alert')).toContainText('not valid JSON');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	const modified = structuredClone(exported.value);
	modified.draft.candidate.title = 'Changed after export';
	await reopenCandidate(page, modified, 'modified.json');
	await expect(page.getByRole('alert')).toContainText('changed or is incomplete');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	const wrongBuild = structuredClone(exported.value);
	wrongBuild.build.fingerprint = `sha256:${'0'.repeat(64)}`;
	delete wrongBuild.integrity;
	wrongBuild.integrity = hashValue(wrongBuild);
	await reopenCandidate(page, wrongBuild, 'wrong-build.json');
	await expect(page.getByRole('alert')).toContainText('different documentation build');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await button(page, 'Undo').click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('0.5rem');
	expect(await previewToken(page, 'Baseline', '--en-radius-control')).toBe('0.5rem');
});

test('color and alias edits propagate while invalid numeric drafts survive export status and custom metadata is retained', async ({ page }) => {
	await openThemeReview(page);
	await page.getByRole('textbox', { name: 'Candidate title', exact: true }).fill('Accessible studio palette');
	await page.getByRole('textbox', { name: 'Reason for change', exact: true }).fill('Review clear controls and calmer motion.');
	const apply = () => editor(page).getByRole('button', { name: 'Apply pin', exact: true });
	async function color(id: string, components: number[]) {
		await chooseToken(page, id);
		await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption('literal');
		for (const [index, channel] of ['Red', 'Green', 'Blue'].entries()) {
			await editor(page).getByRole('spinbutton', { name: `${channel} channel`, exact: true }).fill(String(components[index]));
		}
		await apply().click();
		await expect(page.getByRole('status')).toContainText(`${id} pinned`);
	}
	await color('palette.accent', [128, 64, 192]);
	await expect(preview(page, 'Candidate').locator('.wordmark')).toHaveCSS('color', 'rgb(128, 64, 192)');
	await chooseToken(page, 'color.brand');
	await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption('palette.action');
	await apply().click();
	await color('palette.action', [12, 100, 180]);
	await expect(preview(page, 'Candidate').locator('.wordmark')).toHaveCSS('color', 'rgb(12, 100, 180)');
	await expect(preview(page, 'Baseline').locator('.wordmark')).toHaveCSS('color', 'rgb(36, 87, 214)');
	await chooseToken(page, 'duration.fast');
	const duration = editor(page).getByRole('spinbutton', { name: 'Duration (ms)', exact: true });
	await duration.fill('140');
	await apply().click();
	await expect.poll(() => previewToken(page, 'Candidate', '--en-duration-fast')).toBe('140ms');
	await duration.fill('145');
	await apply().click();
	await expect(editor(page).locator('[data-editor-error]')).toContainText('steps of 20');
	await expect(duration).toHaveValue('145');
	const durationNode = await duration.elementHandle();
	const withInvalidDuration = await downloadCandidate(page);
	await expect(duration).toHaveValue('145');
	expect(await duration.evaluate((input, original) => input === original, durationNode)).toBe(true);
	expect(withInvalidDuration.value.resolvedTokens['duration.fast'].value).toEqual({ value: 140, unit: 'ms' });
	expect(withInvalidDuration.value.resolvedTokens['palette.accent'].value.components).toEqual([128 / 255, 64 / 255, 192 / 255]);
	expect(withInvalidDuration.value.resolvedTokens['color.brand'].value).toEqual(withInvalidDuration.value.resolvedTokens['palette.action'].value);
	expect(withInvalidDuration.value.draft.candidate.title).toBe('Accessible studio palette');
	expect(withInvalidDuration.value.draft.candidate.rationale).toBe('Review clear controls and calmer motion.');
	await duration.fill('160');
	await apply().click();
	await chooseToken(page, 'ease.standard');
	const firstX = editor(page).getByRole('spinbutton', { name: 'First control point X', exact: true });
	const firstY = editor(page).getByRole('spinbutton', { name: 'First control point Y', exact: true });
	await firstX.fill('0.35');
	await apply().click();
	await firstY.fill('1.2');
	await apply().click();
	await expect(editor(page).locator('[data-editor-error]')).toContainText('from 0 to 1');
	const final = await downloadCandidate(page);
	await expect(firstY).toHaveValue('1.2');
	expect(final.value.resolvedTokens['ease.standard'].value).toEqual([0.35, 0, 0, 1]);
	expect(final.value.resolvedTokens['duration.fast'].value).toEqual({ value: 160, unit: 'ms' });
	expect(final.value.draft.candidate.title).toBe('Accessible studio palette');
});

test('the narrow RTL editor supports keyboard changes and has no automated accessibility violations', async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openThemeReview(page);
	await workspaceView(page, 'Preview');
	await page.getByRole('combobox', { name: 'Preview reading direction', exact: true }).selectOption('rtl');
	await expect(preview(page, 'Candidate').locator('html')).toHaveAttribute('dir', 'rtl');
	await expect(preview(page, 'Baseline').locator('html')).toHaveAttribute('dir', 'rtl');
	await workspaceView(page, 'Edit');
	// The preview control intentionally leaves the editor neutral. An RTL host
	// document is a separate browsing-environment fixture, not another theme pin.
	await page.locator('html').evaluate(html => { html.setAttribute('dir', 'rtl'); });
	await expect(editor(page)).toHaveCSS('direction', 'rtl');
	await chooseToken(page, 'radius.control');
	const choices = editor(page).getByRole('combobox', { name: 'Managed value', exact: true });
	await choices.selectOption({ label: '1rem' });
	const apply = editor(page).getByRole('button', { name: 'Apply pin', exact: true });
	await apply.focus();
	await apply.press('Enter');
	await expect(apply).toBeFocused();
	await workspaceView(page, 'Preview');
	await expect.poll(() => previewToken(page, 'Candidate', '--en-radius-control')).toBe('1rem');
	await workspaceView(page, 'Edit');
	expect(await page.locator('html').evaluate(html => html.scrollWidth <= html.clientWidth + 1)).toBe(true);
	const result = await new AxeBuilder({ page }).include('.theme-token-editor').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
	await info.attach('theme-editor-accessibility', { body: JSON.stringify({ violations: result.violations, passes: result.passes.length }), contentType: 'application/json' });
	expect(result.violations).toEqual([]);
});

async function pinManagedToken(page: Page, id: string, label: string) {
	await chooseToken(page, id);
	await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption('literal');
	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label });
	await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
}

async function pinTokenReference(page: Page, id: string, reference: string) {
	await chooseToken(page, id);
	await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption(reference);
	await editor(page).getByRole('button', { name: 'Apply pin', exact: true }).click();
}

const relatedPins = (page: Page) => page.locator('details[data-related-pins]');
const relatedPinRow = (page: Page, id: string) => relatedPins(page).getByRole('listitem').filter({
	has: page.getByRole('button', { name: `Inspect ${id}`, exact: true }),
});

async function openRelatedPins(page: Page) {
	const disclosure = relatedPins(page);
	if (!await disclosure.evaluate(details => (details as HTMLDetailsElement).open)) {
		await disclosure.locator('summary').click();
	}
	return disclosure;
}

test('related pins distinguish connected references from fixed and detached transitive consumers', async ({ page }) => {
	await openThemeReview(page);
	await pinManagedToken(page, 'space.2', '1rem');
	await pinTokenReference(page, 'space.3', 'rhythm.base');
	await pinTokenReference(page, 'space.4', 'space.2');
	await pinTokenReference(page, 'space.6', 'space.3');
	await pinManagedToken(page, 'radius.control', '1rem');
	await chooseToken(page, 'rhythm.base');
	const disclosure = await openRelatedPins(page);
	await expect(disclosure.locator('summary')).toHaveText('Related pins (4)');
	await expect(disclosure).toHaveAttribute('aria-live', 'off');
	await expect(relatedPinRow(page, 'space.2')).toContainText('Fixed value; does not currently follow rhythm.base.');
	await expect(relatedPinRow(page, 'space.3')).toContainText('Reference to rhythm.base; still follows rhythm.base.');
	await expect(relatedPinRow(page, 'space.4')).toContainText('Reference to space.2; does not currently follow rhythm.base.');
	await expect(relatedPinRow(page, 'space.6')).toContainText('Reference to space.3; still follows rhythm.base.');
	await expect(disclosure.getByRole('button', { name: 'Inspect radius.control', exact: true })).toHaveCount(0);

	await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: '0.375rem' });
	const apply = editor(page).getByRole('button', { name: 'Apply pin', exact: true });
	await apply.focus();
	await apply.press('Enter');
	await expect(apply).toBeFocused();
	await expect(disclosure).toHaveAttribute('open', '');
	const ruler = (label: string) => preview(page, 'Candidate').locator('.spacing-ruler > div').filter({ hasText: label }).locator('i');
	await expect(ruler('2×')).toHaveCSS('inline-size', '16px');
	await expect(ruler('3×')).toHaveCSS('inline-size', '6px');
	await expect(ruler('4×')).toHaveCSS('inline-size', '16px');
	await expect(ruler('6×')).toHaveCSS('inline-size', '6px');
});

test('related pin inspection preserves focus and draft, and context retains pins until explicit restore', async ({ page }) => {
	await openThemeReview(page);
	await pinManagedToken(page, 'space.2', '1rem');
	await pinTokenReference(page, 'space.3', 'rhythm.base');
	await chooseToken(page, 'rhythm.base');
	const before = await downloadCandidate(page);
	const disclosure = await openRelatedPins(page);
	const inspect = disclosure.getByRole('button', { name: 'Inspect space.2', exact: true });
	const original = await inspect.elementHandle();
	await inspect.focus();
	await inspect.press('Enter');
	await expect(page.getByRole('combobox', { name: 'Token', exact: true })).toHaveValue('space.2');
	await expect(editor(page).getByRole('heading', { name: 'space.2', exact: true })).toBeVisible();
	await expect(inspect).toBeFocused();
	expect(await inspect.evaluate((node, previous) => node === previous, original)).toBe(true);
	await expect(relatedPinRow(page, 'space.2')).toContainText('Currently selected.');
	await expect(disclosure).toHaveAttribute('open', '');
	const inspected = await downloadCandidate(page);
	expect(inspected.value.draft).toEqual(before.value.draft);

	await editor(page).getByRole('button', { name: 'Restore default rule', exact: true }).click();
	await chooseToken(page, 'rhythm.base');
	await expect(disclosure.getByRole('button', { name: 'Inspect space.2', exact: true })).toHaveCount(0);
	await button(page, 'Undo').click();
	await expect(relatedPinRow(page, 'space.2')).toContainText('Fixed value');
	await page.getByRole('combobox', { name: 'Candidate appearance', exact: true }).selectOption('dark');
	await page.getByRole('combobox', { name: 'Candidate density', exact: true }).selectOption('compact');
	await expect(page.getByText('Appearance and density changes retain your pins. Choosing another appearance does not supply a paired light/dark set for pinned values.', { exact: true })).toBeVisible();
	await expect(relatedPinRow(page, 'space.2')).toContainText('Fixed value');
	await expect(relatedPinRow(page, 'space.3')).toContainText('still follows rhythm.base.');
	const changedContext = await downloadCandidate(page);
	const source = (candidate: Record<string, any>) => JSON.parse(candidate.draft.candidate.artifacts['source.json']).options;
	expect(source(changedContext.value).pins).toEqual(source(before.value).pins);
	expect(source(changedContext.value).mode).toBe('dark');
	expect(source(changedContext.value).density).toBe('compact');
});

test('Theme Review keeps its registrations separate from preview pages', async ({ page }) => {
	// A direct fresh document cannot borrow registrations from the sticker sheet.
	await page.goto('/theme-review');
	await expect(page.locator('en-theme-review-app')).not.toHaveAttribute('data-ssr');
	await expect(button(page, 'Export candidate')).toBeEnabled();
	await expect(page.locator('iframe')).toHaveCount(0);
	const required = [
		'en-alert', 'en-badge', 'en-button', 'en-color-field', 'en-number-field',
		'en-search-input', 'en-segmented-control', 'en-select', 'en-text-field', 'en-textarea',
	];
	expect(await page.evaluate(tags => tags.map(tag => Boolean(customElements.get(tag))), required)).toEqual(required.map(() => true));
	const unrelated = ['en-combobox', 'en-dialog'];
	const parentRegistrations = () => page.evaluate(tags => tags.map(tag => Boolean(customElements.get(tag))), unrelated);
	expect(await parentRegistrations()).toEqual([false, false]);

	// This control is absent from initial SSR but must upgrade when an error appears.
	await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles({
		name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{'),
	});
	await expect(page.getByRole('alert')).toContainText('not valid JSON');

	const load = button(page, 'Load previews');
	if (!await load.isVisible()) await workspaceView(page, 'Preview');
	await page.getByRole('combobox', { name: 'Preview page', exact: true }).selectOption('sheet');
	await load.click();
	const candidate = preview(page, 'Candidate');
	await expect(candidate.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	expect(await candidate.locator('html').evaluate(() => Boolean(customElements.get('en-combobox')))).toBe(true);
	const specimen = candidate.locator('[data-specimen="combobox"]');
	const input = specimen.getByRole('combobox', { name: 'Project', exact: true });
	await input.scrollIntoViewIfNeeded();
	await input.fill('South');
	await input.press('ArrowDown');
	await expect(input).toHaveAttribute('aria-expanded', 'true');
	await expect(specimen.getByRole('option', { name: 'Studio South', exact: true })).toBeVisible();
	await input.press('Enter');
	await expect(input).toHaveValue('Studio South');
	await specimen.getByRole('button', { name: 'Use project', exact: true }).click();
	await expect(specimen.locator('output')).toHaveText('Submitted project: studio-south');
	expect(await parentRegistrations()).toEqual([false, false]);
	// Existing afterEach checks uncaught page/frame errors, including hydration.
});

// Append to theme-review.spec.ts to reuse its browser helpers and error checks.
// Synthetic DragEvents use real DataTransfer/File objects; this verifies the DOM
// intake contract, not an OS file-manager drag or physical-device picker.
async function dropCandidateFiles(page: Page, files: {name:string; text?:string; size?:number}[]) {
	const transfer = await page.evaluateHandle(entries => {
		const transfer = new DataTransfer();
		for (const entry of entries) transfer.items.add(new File([
			entry.size === undefined ? entry.text ?? '' : new Uint8Array(entry.size),
		], entry.name, {type:'application/json'}));
		return transfer;
	}, files);
	await page.getByRole('group', {name:'Reopen a candidate',exact:true}).dispatchEvent('drop', {dataTransfer:transfer});
	await transfer.dispose();
}

async function holdCandidateReads(page: Page) {
	await page.evaluate(() => {
		const reads = new Map<string,{release():Promise<void>;fail():Promise<void>}>();
		(window as any).__candidateFileReads = reads;
		const original = File.prototype.text;
		File.prototype.text = function () {
			if (!this.name.startsWith('held-')) return original.call(this);
			const thisFile = this;
			return new Promise<string>((resolve, reject) => {
				reads.set(this.name, {
					async release() { resolve(await original.call(thisFile)); await Promise.resolve(); },
					async fail() { reject(new Error('Earlier read failed.')); await Promise.resolve(); },
				});
			});
		};
	});
}

async function finishCandidateRead(page: Page, name: string, fail = false) {
	await expect.poll(() => page.evaluate(name => (window as any).__candidateFileReads.has(name), name)).toBe(true);
	await page.evaluate(async ({name,fail}) => {
		const reads = (window as any).__candidateFileReads;
		await reads.get(name)[fail ? 'fail' : 'release']();
		reads.delete(name);
	}, {name,fail});
}

test('a reopened candidate themes the whole review page in place while the baseline stays independent', async ({page}) => {
	await openThemeReview(page);
	await pinRadius(page);
	await page.getByRole('combobox', {name:'Candidate appearance',exact:true}).selectOption('dark');
	const exported = await downloadCandidate(page);
	await button(page,'Reset draft').click();
	await dropCandidateFiles(page,[{name:'page-theme.json',text:exported.bytes.toString()}]);
	const title = page.getByRole('textbox',{name:'Candidate title',exact:true});
	await title.fill('Keep this working title');
	const original = await title.elementHandle();
	const rootToken = () => page.locator('html').evaluate(html=>Number.parseFloat(getComputedStyle(html).getPropertyValue('--en-radius-control')));
	const originalBackground = await page.locator('body').evaluate(body=>getComputedStyle(body).backgroundColor);
	const originalDirection = await page.locator('html').getAttribute('dir');
	const appearance = page.locator('.review-page-appearance');
	await expect.poll(rootToken).toBe(0.5);
	await appearance.getByRole('radio',{name:'Default',exact:true}).focus();
	await appearance.getByRole('radio',{name:'Default',exact:true}).press('ArrowRight');
	await expect(appearance.getByRole('radio',{name:'Candidate',exact:true})).toBeChecked();
	await expect(appearance.getByRole('radio',{name:'Candidate',exact:true})).toBeFocused();
	await expect.poll(rootToken).toBe(1);
	await expect(page.locator('html')).toHaveCSS('color-scheme','dark');
	await expect(title).toHaveCSS('border-top-left-radius','16px');
	await expect.poll(()=>previewToken(page,'Baseline','--en-radius-control')).toBe('0.5rem');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('1rem');
	const candidateBackground = await preview(page,'Candidate').locator('body').evaluate(body=>getComputedStyle(body).backgroundColor);
	await expect(page.locator('body')).toHaveCSS('background-color',candidateBackground);
	expect(candidateBackground).not.toBe(originalBackground);
	const candidateBrand = await preview(page,'Candidate').locator('.wordmark').evaluate(mark=>getComputedStyle(mark).color);
	await expect(page.locator('.wordmark')).toHaveCSS('color',candidateBrand);
	await page.getByRole('combobox',{name:'Preview reading direction',exact:true}).selectOption('rtl');
	await expect(page.locator('html')).toHaveAttribute('dir','rtl');
	await expect(title).toHaveValue('Keep this working title');
	expect(await title.evaluate((input,initial)=>input===initial,original)).toBe(true);
	await editor(page).getByRole('button',{name:'Restore default rule',exact:true}).click();
	await expect.poll(rootToken).toBe(0.5);
	await button(page,'Undo').click();
	await expect.poll(rootToken).toBe(1);
	await appearance.getByText('Default',{exact:true}).click();
	await expect.poll(rootToken).toBe(0.5);
	await expect(page.locator('body')).toHaveCSS('background-color',originalBackground);
	expect(await page.locator('html').getAttribute('dir')).toBe(originalDirection);
	await expect(title).toHaveValue('Keep this working title');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('1rem');
	await appearance.getByText('Candidate',{exact:true}).click();
	await expect.poll(rootToken).toBe(1);
	await page.locator('en-theme-review-app').evaluate(host=>{
		(window as any).__detachedThemeReview={host,next:host.nextSibling,parent:host.parentNode};host.remove();
	});
	await expect.poll(rootToken).toBe(0.5);
	await page.evaluate(()=>{const {host,next,parent}=(window as any).__detachedThemeReview;parent.insertBefore(host,next);});
	await expect.poll(rootToken).toBe(1);
});

test('a dropped candidate uses the same validated undoable import as the native picker', async ({page}, info) => {
	info.annotations.push({type:'driver-scope',description:'Synthetic DragEvent with browser File and DataTransfer; OS dragging remains manual.'});
	await openThemeReview(page);
	await pinRadius(page);
	const title = page.getByRole('textbox',{name:'Candidate title',exact:true});
	await title.fill('Dropped corner review');
	const exported = await downloadCandidate(page);
	await button(page,'Reset draft').click();
	await title.fill('Before dropping');
	const url = page.url();
	await dropCandidateFiles(page,[{name:'candidate.json',text:exported.bytes.toString()}]);
	await expect(title).toHaveValue('Dropped corner review');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('1rem');
	expect(page.url()).toBe(url);
	await button(page,'Undo').click();
	await expect(title).toHaveValue('Before dropping');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('0.5rem');
	await button(page,'Redo').click();
	await expect(title).toHaveValue('Dropped corner review');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('1rem');
});

test('the drop zone retains child-transition feedback and rejects invalid intake without changing the draft', async ({page}) => {
	await openThemeReview(page);
	await pinRadius(page);
	const exported = await downloadCandidate(page);
	const zone = page.getByRole('group',{name:'Reopen a candidate',exact:true});
	await zone.scrollIntoViewIfNeeded();
	const transfer = await page.evaluateHandle(() => {const d=new DataTransfer();d.items.add(new File(['{'],'invalid.json',{type:'application/json'}));return d;});
	await zone.dispatchEvent('dragenter',{dataTransfer:transfer});
	await expect(zone).toHaveAttribute('data-drag-active');
	await zone.evaluate((zone, transfer) => {
		zone.dispatchEvent(new DragEvent('dragleave',{bubbles:true,dataTransfer:transfer,relatedTarget:zone.querySelector('input')}));
	},transfer);
	await expect(zone).toHaveAttribute('data-drag-active');
	await zone.evaluate((zone, transfer) => {
		const r=zone.getBoundingClientRect();
		zone.dispatchEvent(new DragEvent('dragleave',{bubbles:true,dataTransfer:transfer,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));
	},transfer);
	await expect(zone).toHaveAttribute('data-drag-active');
	await zone.dispatchEvent('dragleave',{dataTransfer:transfer,clientX:-5,clientY:-5});
	await expect(zone).not.toHaveAttribute('data-drag-active');
	await zone.dispatchEvent('drop',{dataTransfer:transfer});
	await transfer.dispose();
	await expect(page.getByRole('alert')).toContainText('not valid JSON');
	await dropCandidateFiles(page,[{name:'one.json',text:exported.bytes.toString()},{name:'two.json',text:exported.bytes.toString()}]);
	await expect(page.getByRole('alert')).toContainText('exactly one');
	await dropCandidateFiles(page,[{name:'large.json',size:8_000_001}]);
	await expect(page.getByRole('alert')).toContainText('8 MB or smaller');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('1rem');
	await button(page,'Undo').click();
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('0.5rem');
});

test('metadata and unfinished editor input protect the current draft from delayed file success and failure', async ({page}) => {
	await openThemeReview(page);
	await pinRadius(page);
	const exported = await downloadCandidate(page);
	await button(page,'Reset draft').click();
	await holdCandidateReads(page);
	const title = page.getByRole('textbox',{name:'Candidate title',exact:true});
	await reopenCandidate(page,exported.value,'held-title.json');
	await title.fill('Keep the title I am editing');
	await finishCandidateRead(page,'held-title.json');
	await expect(title).toHaveValue('Keep the title I am editing');
	await expect.poll(()=>previewToken(page,'Candidate','--en-radius-control')).toBe('0.5rem');

	await chooseToken(page,'duration.fast');
	const duration = editor(page).getByRole('spinbutton',{name:'Duration (ms)',exact:true});
	await reopenCandidate(page,exported.value,'held-editor.json');
	await duration.fill('145');
	const node=await duration.elementHandle();
	await finishCandidateRead(page,'held-editor.json');
	await expect(duration).toHaveValue('145');
	expect(await duration.evaluate((input,original)=>input===original,node)).toBe(true);
	await expect(title).toHaveValue('Keep the title I am editing');

	await reopenCandidate(page,exported.value,'held-error.json');
	await duration.fill('160');
	await editor(page).getByRole('button',{name:'Apply pin',exact:true}).click();
	await finishCandidateRead(page,'held-error.json',true);
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.locator('.review-status')).toContainText('duration.fast pinned');
	await expect.poll(()=>previewToken(page,'Candidate','--en-duration-fast')).toBe('160ms');
});

test('newer intake and disconnection permanently supersede earlier reads', async ({page}) => {
	await openThemeReview(page);
	const title=page.getByRole('textbox',{name:'Candidate title',exact:true});
	await title.fill('First file');
	const first=await downloadCandidate(page);
	await title.fill('Newest file');
	const next=await downloadCandidate(page);
	await holdCandidateReads(page);
	await reopenCandidate(page,first.value,'held-first.json');
	await dropCandidateFiles(page,[{name:'newest.json',text:next.bytes.toString()}]);
	await expect(page.locator('.review-status')).toContainText('Candidate reopened');
	await finishCandidateRead(page,'held-first.json');
	await expect(title).toHaveValue('Newest file');

	await reopenCandidate(page,first.value,'held-disconnect.json');
	await page.locator('en-theme-review-app').evaluate(host=>{const next=host.nextSibling;const parent=host.parentNode!;host.remove();parent.insertBefore(host,next);});
	await expect(button(page,'Export candidate')).toBeEnabled();
	await finishCandidateRead(page,'held-disconnect.json',true);
	await expect(title).toHaveValue('Newest file');
	await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a narrow page keeps the native file picker labeled and keyboard reachable', async ({page}) => {
	await page.setViewportSize({width:390,height:844});
	await openThemeReview(page);
	const exported=await downloadCandidate(page);
	const picker=page.getByLabel('Reopen candidate',{exact:true});
	await picker.focus();
	await expect(picker).toBeFocused();
	const choose=page.waitForEvent('filechooser');
	await picker.press('Space');
	const chooser=await choose;
	await chooser.setFiles({name:'candidate.json',mimeType:'application/json',buffer:exported.bytes});
	await expect(page.locator('.review-status')).toContainText('Candidate reopened');
	await expect(picker).toHaveValue('');
	await expect(page.getByRole('group',{name:'Reopen a candidate',exact:true})).not.toHaveAttribute('tabindex');
	expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});


test('focus scroll clearance can be pinned independently and exported through the managed editor', async ({ page }) => {
	await page.goto('/theme-review');
	await expect(button(page, 'Export candidate')).toBeEnabled();
	for (const [token, label] of [['focus.scroll-margin-block', '1.5rem'], ['focus.scroll-margin-inline', '0.5rem']]) {
		await chooseToken(page, token);
		await editor(page).getByRole('combobox', { name: 'Value source', exact: true }).selectOption({ label: 'Managed value' });
		await editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label });
		await button(page, 'Apply pin').click();
	}
	const candidate = await downloadCandidate(page);
	expect(JSON.parse(candidate.value.draft.candidate.artifacts['source.json']).options.pins['focus.scroll-margin-block']).toEqual({ value: 1.5, unit: 'rem' });
	expect(JSON.parse(candidate.value.draft.candidate.artifacts['source.json']).options.pins['focus.scroll-margin-inline']).toEqual({ value: 0.5, unit: 'rem' });
	await button(page, 'Reset draft').click();
	await reopenCandidate(page, candidate.value);
	await chooseToken(page, 'focus.scroll-margin-block');
	await expect(editor(page).getByRole('combobox', { name: 'Managed value', exact: true }).locator('option:checked')).toHaveText('1.5rem');
});

// These observations use the real cross-document message transport. They never
// replace postMessage, invoke a private app method, or import browser source.
type ObservedPreviewMessage = {
	variant?: string;
	message: { type: string; requestId?: string; draftJSON?: string; direction?: string; buildFingerprint?: string; message?: string };
};

async function observePreviewMessages(page: Page) {
	await page.addInitScript(() => {
		const messages: ObservedPreviewMessage[] = [];
		(window as any).__previewTransportMessages = messages;
		window.addEventListener('message', event => {
			if (event.origin !== location.origin || !event.data || typeof event.data !== 'object'
				|| !['en-theme-preview', 'en-theme-preview-listening', 'en-theme-preview-ready', 'en-theme-preview-error'].includes(event.data.type)) return;
			const frame = [...document.querySelectorAll<HTMLIFrameElement>('iframe[data-variant]')].find(frame => frame.contentWindow === event.source);
			messages.push({ variant: frame?.dataset.variant, message: event.data });
		});
	});
}

async function incomingPreviewRequests(page: Page) {
	return preview(page, 'Candidate').locator('html').evaluate(() =>
		((window as any).__previewTransportMessages as ObservedPreviewMessage[])
			.filter(entry => entry.message.type === 'en-theme-preview').map(entry => entry.message));
}

async function candidatePreviewReplies(page: Page) {
	return page.evaluate(() => ((window as any).__previewTransportMessages as ObservedPreviewMessage[])
		.filter(entry => entry.variant === 'candidate' && ['en-theme-preview-ready', 'en-theme-preview-error'].includes(entry.message.type))
		.map(entry => entry.message));
}

async function previewPresentation(page: Page) {
	return preview(page, 'Candidate').locator('html').evaluate(html => ({
		name: html.getAttribute('data-en-theme'), appearance: html.getAttribute('data-en-appearance'), direction: html.getAttribute('dir'),
		colorScheme: html.style.getPropertyValue('color-scheme'), priority: html.style.getPropertyPriority('color-scheme'),
		preview: document.querySelector('en-workflows-app')!.getAttribute('data-en-theme-preview'),
		styles: [...document.querySelectorAll('style[data-en-theme-review], style[data-en-theme-review-controls]')].map(style => ({
			marker: style.hasAttribute('data-en-theme-review') ? 'theme' : 'controls', css: style.textContent,
		})),
		controls: [...document.querySelectorAll<HTMLElement>('.theme-controls, .site-header a[hidden]')].map(control => ({
			hidden: control.hidden, inert: control.inert,
		})),
	}));
}

async function holdCandidateController(page: Page) {
	return holdThemeController(page, { matchesFrame: async frame => {
		if (frame.parentFrame() !== page.mainFrame()) return false;
		const owner = await frame.frameElement();
		try { return await owner.getAttribute('data-variant') === 'candidate'; }
		finally { await owner.dispose(); }
	} });
}

/** Preserve both public previews while letting the candidate request the optional entry first. */
async function holdBaselinePreviewDocument(page: Page) {
	const selectedPage = await page.getByRole('combobox', { name: 'Preview page', exact: true }).inputValue();
	expect(selectedPage).toBe('settings');
	const manifestResponse = await page.request.get('/review-build.json');
	let documentURL: string;
	try {
		expect(manifestResponse.ok()).toBe(true);
		const manifest = await manifestResponse.json() as { schemaVersion: number; fingerprint: string; pages: { id: string; path: string }[] };
		expect(manifest.schemaVersion).toBe(1);
		await expect(page.locator('meta[name="en-review-build"]')).toHaveAttribute('content', manifest.fingerprint);
		const selected = manifest.pages.filter(item => item.id === selectedPage);
		expect(selected).toHaveLength(1);
		const url = new URL(selected[0]!.path, page.url());
		expect(url.origin).toBe(new URL(page.url()).origin);
		// The maintained Theme Review template appends this flag to each page path.
		url.search = '?theme-preview';
		documentURL = url.href;
	} finally { await manifestResponse.dispose(); }

	let release!: () => void;
	const gate = new Promise<void>(resolve => { release = resolve; });
	const pending = new Set<Promise<void>>();
	const failures: unknown[] = [];
	let captured = 0;
	let returned = 0;
	const healthy = () => {
		if (failures.length) throw new AggregateError(failures, 'Baseline preview document interception failed.');
	};
	const intercept = async (route: Route) => {
		const request = route.request();
		const frame = request.frame();
		if (!request.isNavigationRequest() || request.resourceType() !== 'document' || frame.parentFrame() !== page.mainFrame()) {
			await route.continue(); return;
		}
		const owner = await frame.frameElement();
		let baseline: boolean;
		try { baseline = await owner.getAttribute('data-variant') === 'baseline'; }
		finally { await owner.dispose(); }
		if (!baseline) { await route.continue(); return; }
		const response = await route.fetch();
		try {
			captured++;
			await gate;
			await route.fulfill({ response });
			returned++;
		} finally { await response.dispose(); }
	};
	const handler = (route: Route) => {
		const operation = intercept(route).catch(async error => {
			failures.push(error);
			await route.abort('failed').catch(() => {});
		}).finally(() => { pending.delete(operation); });
		pending.add(operation);
		return operation;
	};
	let cleanup: Promise<void> | undefined;
	const dispose = () => cleanup ??= (async () => {
		release();
		try { await page.unroute(documentURL, handler); } catch (error) { failures.push(error); }
		try {
			await expect.poll(() => pending.size, { message: 'All baseline document interceptions finished' }).toBe(0);
		} catch (error) { failures.push(error); }
		healthy();
	})();
	try { await page.route(documentURL, handler); }
	catch (error) {
		try { await dispose(); } catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Baseline route setup and cleanup failed.'); }
		throw error;
	}
	return {
		release,
		async waitForCaptured() {
			await expect.poll(() => { healthy(); return captured; }, { message: 'The baseline preview HTML response is held' }).toBe(1);
		},
		async waitForReturned() {
			await expect.poll(() => { healthy(); return returned; }, { message: 'The original baseline preview HTML response was returned' }).toBe(1);
		},
		cleanup: dispose,
	};
}

async function openHeldSettingsPreview(page: Page) {
	await page.goto('/theme-review');
	await expect(button(page, 'Export candidate')).toBeEnabled();
	await page.getByRole('combobox', { name: 'Preview page', exact: true }).selectOption('settings');
	const hold = await holdCandidateController(page);
	let baseline: Awaited<ReturnType<typeof holdBaselinePreviewDocument>> | undefined;
	let opening: Promise<void>[] = [];
	try {
		baseline = await holdBaselinePreviewDocument(page);
		const baselineHold = baseline;
		// Observe click errors immediately while allowing navigation auto-wait to
		// finish after the ordered response release; neither wait depends on click.
		opening = [
			button(page, 'Load previews').click(),
			(async () => {
				await baselineHold.waitForCaptured();
				await hold.waitForCaptured();
				baselineHold.release();
				await baselineHold.waitForReturned();
			})(),
		];
		await Promise.all(opening);
		await expect(preview(page, 'Candidate').locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
		await expect(preview(page, 'Candidate').locator('style[data-en-theme-review]')).toHaveCount(0);
		await baseline.cleanup();
		return hold;
	} catch (error) {
		// Release both gates before either drain, and attempt both cleanups even
		// if one fails. Drain both setup tasks too, preserving secondary errors.
		hold.release(); baseline?.release();
		const results = await Promise.allSettled([hold.cleanup(), ...(baseline ? [baseline.cleanup()] : []), ...opening]);
		const errors = [...new Set(results.flatMap(result => result.status === 'rejected' && result.reason !== error ? [result.reason] : []))];
		if (errors.length) throw new AggregateError([error, ...errors], 'Preview setup and transport cleanup failed.');
		throw error;
	}
}

test('the preview bridge rejects invalid requests and applies only the newest request after delayed controller delivery', async ({ page }) => {
	await observePreviewMessages(page);
	const hold = await openHeldSettingsPreview(page);
	try {
		const first = (await incomingPreviewRequests(page)).at(-1)!;
		expect(first.requestId).toBeTruthy();
		const invalid = [
			{ ...first, requestId: 'invalid-build-during-controller-delivery', buildFingerprint: `sha256:${'0'.repeat(64)}` },
			{ ...first, requestId: 'invalid-draft-during-controller-delivery', draftJSON: '{' },
		];
		for (const message of invalid) {
			// Send from the actual same-origin parent, exercising the bridge's
			// documented trust checks after source/origin validation succeeds.
			await page.evaluate(message => {
				document.querySelector<HTMLIFrameElement>('iframe[data-variant="candidate"]')!.contentWindow!.postMessage(message, location.origin);
			}, message);
			await expect.poll(async () => (await candidatePreviewReplies(page)).some(reply =>
				reply.type === 'en-theme-preview-error' && reply.requestId === message.requestId)).toBe(true);
		}
		expect((await candidatePreviewReplies(page)).find(reply => reply.requestId === invalid[0]!.requestId)?.message).toContain('build does not match');
		await expect(preview(page, 'Candidate').locator('style[data-en-theme-review]')).toHaveCount(0);
		await page.getByRole('combobox', { name: 'Preview reading direction', exact: true }).selectOption('rtl');
		await expect.poll(async () => (await incomingPreviewRequests(page)).at(-1)?.direction).toBe('rtl');
		const newest = (await incomingPreviewRequests(page)).at(-1)!;
		expect(newest.requestId).not.toBe(first.requestId);
		hold.release();
		await hold.waitForReturned();
		await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
		await expect(preview(page, 'Candidate').locator('html')).toHaveAttribute('dir', 'rtl');
		await expect(preview(page, 'Candidate').locator('style[data-en-theme-review]')).toHaveCount(1);
		// The newest ready receipt follows completion of the shared import.
		// Inspect all replies to catch an older transient application/acknowledgment.
		expect((await candidatePreviewReplies(page)).filter(reply => reply.type === 'en-theme-preview-ready').map(reply => reply.requestId)).toEqual([newest.requestId]);
		const lastGood = await previewPresentation(page);
		const rejected = { ...newest, requestId: 'wrong-build-after-ready', buildFingerprint: `sha256:${'0'.repeat(64)}` };
		await page.evaluate(message => {
			document.querySelector<HTMLIFrameElement>('iframe[data-variant="candidate"]')!.contentWindow!.postMessage(message, location.origin);
		}, rejected);
		await expect.poll(async () => (await candidatePreviewReplies(page)).some(reply =>
			reply.type === 'en-theme-preview-error' && reply.requestId === rejected.requestId && reply.message?.includes('build does not match'))).toBe(true);
		expect(await previewPresentation(page), 'A rejected request preserves the last applied CSS, owned attributes and hidden/inert controls').toEqual(lastGood);
		expect((await candidatePreviewReplies(page)).filter(reply => reply.type === 'en-theme-preview-ready').map(reply => reply.requestId)).toEqual([newest.requestId]);
		await expect(page.getByRole('alert')).toHaveCount(0);
	} finally { await hold.cleanup(); }
});

test('detached preview adoption during controller delivery invalidates its request and restores ownership after reconnect', async ({ page }) => {
	await observePreviewMessages(page);
	const hold = await openHeldSettingsPreview(page);
	const html = preview(page, 'Candidate').locator('html');
	const host = preview(page, 'Candidate').locator('en-workflows-app');
	try {
		const first = (await incomingPreviewRequests(page)).at(-1)!;
		expect(await host.evaluate(host => {
			(window as any).__detachedPreviewHost = { host, parent: host.parentNode!, next: host.nextSibling };
			const detached = document.implementation.createHTMLDocument('Detached preview adoption');
			const adopted = detached.adoptNode(host);
			// Do not connect this app to an inert document: its appearance owner
			// requires a browsing window. Native adoption still disposes the bridge.
			return { sameNode: adopted === host, differentDocument: host.ownerDocument !== document, connected: host.isConnected };
		})).toEqual({ sameNode: true, differentDocument: true, connected: false });
		await expect(preview(page, 'Candidate').locator('style[data-en-theme-review], style[data-en-theme-review-controls]')).toHaveCount(0);
		expect(await html.evaluate(() => {
			const { host, parent, next } = (window as any).__detachedPreviewHost;
			parent.insertBefore(host, next);
			return host === document.querySelector('en-workflows-app') && host.ownerDocument === document;
		})).toBe(true);
		// A public control supplies a new request after the root's normal Lit
		// disconnect/reconnect callbacks have replaced its bridge attachment.
		await page.getByRole('combobox', { name: 'Preview reading direction', exact: true }).selectOption('rtl');
		await expect.poll(async () => (await incomingPreviewRequests(page)).at(-1)?.direction).toBe('rtl');
		const newest = (await incomingPreviewRequests(page)).at(-1)!;
		expect(newest.requestId).not.toBe(first.requestId);
		const original = await html.evaluate(html => ({
			direction: html.getAttribute('dir'), appearance: html.getAttribute('data-en-appearance'), name: html.getAttribute('data-en-theme'),
			colorScheme: html.style.getPropertyValue('color-scheme'), priority: html.style.getPropertyPriority('color-scheme'),
		}));
		hold.release();
		await hold.waitForReturned();
		await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
		await expect(html).toHaveAttribute('dir', 'rtl');
		await expect(host).toHaveAttribute('data-en-theme-preview', '');
		expect((await candidatePreviewReplies(page)).filter(reply => reply.type === 'en-theme-preview-ready').map(reply => reply.requestId)).toEqual([newest.requestId]);
		await host.evaluate(host => host.remove());
		await expect(preview(page, 'Candidate').locator('style[data-en-theme-review], style[data-en-theme-review-controls]')).toHaveCount(0);
		expect(await html.evaluate(html => ({
			direction: html.getAttribute('dir'), appearance: html.getAttribute('data-en-appearance'), name: html.getAttribute('data-en-theme'),
			colorScheme: html.style.getPropertyValue('color-scheme'), priority: html.style.getPropertyPriority('color-scheme'),
		}))).toEqual(original);
		await expect(page.getByRole('alert')).toHaveCount(0);
	} finally { await hold.cleanup(); }
});
