import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createReviewDraft, hashValue } from '@en-reve/tokens';
import { exportReviewBundle, type ReviewBuild } from '../src/theme-review/bundle.js';

test.setTimeout(90_000);
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({page, browser}, info) => {
	const errors: string[] = []; runtimeErrors.set(page, errors);
	page.on('pageerror', error => errors.push(error.message));
	info.annotations.push({type:'browser-version',description:browser.version()});
});
test.afterEach(async ({page}, info) => {
	const errors = runtimeErrors.get(page) ?? [];
	if (errors.length) await info.attach('runtime-errors',{body:JSON.stringify(errors,null,2),contentType:'application/json'});
	expect(errors,'Paired review and preview frames have no uncaught errors').toEqual([]);
});

const button = (page: Page, name: string) => page.getByRole('button',{name,exact:true});
const selector = (page: Page, name: string) => page.getByRole('combobox',{name,exact:true});
const editor = (page: Page) => page.getByRole('form',{name:'Token editor',exact:true});
const preview = (page: Page, kind: 'Baseline'|'Candidate' = 'Candidate') => page.frameLocator(`iframe[title="${kind} preview"]`);
const radius = (page: Page, kind: 'Baseline'|'Candidate' = 'Candidate') => preview(page,kind).locator('html').evaluate(html=>getComputedStyle(html).getPropertyValue('--en-radius-control').trim());

async function openPage(page: Page) {
	await page.goto('/theme-review');
	await expect(button(page,'Export candidate')).toBeEnabled();
}
async function importFile(page: Page, value: unknown, name = 'paired-review.json') {
	await page.getByLabel('Reopen candidate',{exact:true}).setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
}
async function importedPair(page: Page) {
	const response = await page.request.get('/review-build.json');
	expect(response.ok()).toBe(true);
	const build = await response.json() as ReviewBuild;
	// These are deliberately authored branches, not an inversion of a light file.
	// Both retain the current app's {} authoritative base and independent edit logs.
	const light = createReviewDraft(); const dark = createReviewDraft();
	dark.setContext({mode:'dark'});
	light.setToken('radius.control',{value:1,unit:'rem'});
	dark.setToken('radius.control',{value:0.75,unit:'rem'});
	light.setToken('component.button.radius',{value:1.125,unit:'rem'});
	const text = exportReviewBundle(light,build,{title:'Paired browser review',rationale:'Independent authored appearance rules.'},{},{pair:{name:'browser-review-pair',light,dark}});
	const value = JSON.parse(text);
	await importFile(page,value);
	await expect(selector(page,'Editing appearance')).toHaveValue('light');
	await expect(page.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue('Paired browser review');
	return value;
}
async function loadPreviews(page: Page) {
	await button(page,'Load previews').click();
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
}
async function chooseRadius(page: Page, value: string) {
	await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('radius.control');
	await selector(page,'Token').selectOption('radius.control');
	await editor(page).getByRole('combobox',{name:'Managed value',exact:true}).selectOption({label:value});
	await editor(page).getByRole('button',{name:'Apply pin',exact:true}).click();
	await expect(page.locator('.review-status')).toContainText('radius.control pinned');
}
async function download(page: Page) {
	const pending = page.waitForEvent('download'); await button(page,'Export candidate').click();
	const item = await pending; expect(await item.failure()).toBeNull();
	const path = await item.path(); expect(path).not.toBeNull();
	return JSON.parse(await readFile(path!,'utf8')) as Record<string,any>;
}
async function setPreview(page: Page, appearance: 'editing'|'auto'|'light'|'dark') {
	await selector(page,'Preview appearance').selectOption(appearance);
	await expect(selector(page,'Preview appearance')).toHaveValue(appearance);
	const boundary = appearance === 'editing' ? await selector(page,'Editing appearance').inputValue() : appearance;
	await expect(preview(page).locator('html')).toHaveAttribute('data-en-appearance',boundary);
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
}
async function setPageAppearance(page: Page, name: 'Default'|'Candidate') {
	const group = page.locator('.review-page-appearance');
	await group.getByText(name,{exact:true}).click();
	await expect(group.getByRole('radio',{name,exact:true})).toBeChecked();
}

// All observations use rendered controls, downloads and native DOM. No app model
// or private workspace is called from the browser.
test('paired edits, coordinated density and reset remain independently recoverable', async ({page}) => {
	await openPage(page); await importedPair(page); await loadPreviews(page);
	await setPreview(page,'editing');
	await expect.poll(()=>radius(page)).toBe('1rem');
	await expect.poll(()=>radius(page,'Baseline')).toBe('0.5rem');
	await chooseRadius(page,'1.25rem');
	await expect.poll(()=>radius(page)).toBe('1.25rem');
	await selector(page,'Editing appearance').selectOption('dark');
	await expect.poll(()=>radius(page)).toBe('0.75rem');
	await chooseRadius(page,'1.5rem');
	await expect.poll(()=>radius(page)).toBe('1.5rem');
	await button(page,'Undo').click();
	await expect(selector(page,'Editing appearance')).toHaveValue('dark');
	await expect.poll(()=>radius(page)).toBe('0.75rem');
	await button(page,'Undo').click();
	await expect(selector(page,'Editing appearance')).toHaveValue('light');
	await expect.poll(()=>radius(page)).toBe('1rem');
	await button(page,'Redo').click(); await expect.poll(()=>radius(page)).toBe('1.25rem');
	await button(page,'Redo').click(); await expect.poll(()=>radius(page)).toBe('1.5rem');

	await selector(page,'Candidate density').selectOption('spacious');
	const spacious = await download(page);
	expect(spacious.schemaVersion).toBe(2);
	expect(spacious.activeAppearance).toBe('dark');
	for (const mode of ['light','dark']) expect(spacious.draft.branches[mode].candidate.theme.density).toBe('spacious');
	await button(page,'Undo').click();
	await expect(selector(page,'Candidate density')).toHaveValue('comfortable');
	await button(page,'Redo').click();
	await expect(selector(page,'Candidate density')).toHaveValue('spacious');
	await button(page,'Reset both appearances').click();
	await expect(selector(page,'Candidate density')).toHaveValue('comfortable');
	await expect.poll(()=>radius(page)).toBe('0.5rem');
	await selector(page,'Editing appearance').selectOption('light');
	await expect.poll(()=>radius(page)).toBe('0.5rem');
	await button(page,'Undo').click();
	await expect(selector(page,'Candidate density')).toHaveValue('spacious');
	await expect.poll(()=>radius(page)).toBe('1.5rem');

	await importFile(page,spacious,'reopened-pair.json');
	await expect(selector(page,'Preview appearance')).toHaveValue('auto');
	await setPreview(page,'editing');
	await expect(selector(page,'Editing appearance')).toHaveValue('dark');
	await expect.poll(()=>radius(page)).toBe('1.5rem');
	const reopened = await download(page);
	expect(reopened.draft).toEqual(spacious.draft);
	await selector(page,'Editing appearance').selectOption('light');
	await expect.poll(()=>radius(page)).toBe('1.25rem');
});

test('paired preview appearance and page styling preserve native state and record both modes', async ({page}) => {
	await page.emulateMedia({colorScheme:'light'});
	await openPage(page); await importedPair(page); await loadPreviews(page);
	const input = preview(page).locator('[data-specimen="text-fields"]').getByRole('textbox',{name:'Project name',exact:true});
	await input.fill('Keep this native draft');
	const identity = await input.evaluateHandle(input=>({input,root:input.getRootNode(),document:input.ownerDocument}));
	const parentTitle = page.getByRole('textbox',{name:'Candidate title',exact:true});
	const titleIdentity = await parentTitle.elementHandle();
	const originalBody = await page.locator('body').evaluate(body=>getComputedStyle(body).backgroundColor);
	const originalScheme = await page.locator('html').evaluate(html=>(html as HTMLElement).style.getPropertyValue('color-scheme'));
	const originalAppearance = await page.locator('html').getAttribute('data-en-appearance');

	await setPreview(page,'dark');
	await expect(selector(page,'Editing appearance')).toHaveValue('light');
	await expect(preview(page).locator('html')).toHaveAttribute('data-en-appearance','dark');
	await expect.poll(()=>radius(page)).toBe('0.75rem');
	await expect.poll(()=>preview(page).locator('html').evaluate(html=>getComputedStyle(html).getPropertyValue('--en-button-radius').trim())).toBe('');
	const darkBackground = await preview(page).locator('body').evaluate(body=>getComputedStyle(body).backgroundColor);
	await setPageAppearance(page,'Candidate');
	await expect(page.locator('html')).toHaveCSS('color-scheme','dark');
	await expect(page.locator('body')).toHaveCSS('background-color',darkBackground);
	await setPreview(page,'light');
	await expect.poll(()=>radius(page)).toBe('1rem');
	await expect(page.locator('html')).toHaveCSS('color-scheme','light');
	await expect.poll(()=>preview(page).locator('html').evaluate(html=>getComputedStyle(html).getPropertyValue('--en-button-radius').trim())).toBe('1.125rem');
	await setPageAppearance(page,'Default');
	await expect(page.locator('body')).toHaveCSS('background-color',originalBody);
	await expect.poll(()=>page.locator('html').evaluate(html=>(html as HTMLElement).style.getPropertyValue('color-scheme'))).toBe(originalScheme);
	expect(await page.locator('html').getAttribute('data-en-appearance')).toBe(originalAppearance);

	await setPreview(page,'auto');
	await setPageAppearance(page,'Candidate');
	await selector(page,'Preview appearance').focus();
	await page.emulateMedia({colorScheme:'dark'});
	await expect.poll(()=>radius(page)).toBe('0.75rem');
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
	await expect(selector(page,'Preview appearance')).toBeFocused();
	await expect(page.locator('[data-review-auto-mode]')).toHaveText('Auto currently uses Dark.');
	await expect(preview(page).locator('html')).toHaveAttribute('data-en-appearance','auto');
	await page.emulateMedia({colorScheme:'light'});
	await expect.poll(()=>radius(page)).toBe('1rem');
	await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
	await expect(page.locator('[data-review-auto-mode]')).toHaveText('Auto currently uses Light.');
	await expect(input).toHaveValue('Keep this native draft');
	expect(await input.evaluate((input, initial)=>input===initial.input && input.getRootNode()===initial.root && input.ownerDocument===initial.document,identity)).toBe(true);
	expect(await parentTitle.evaluate((input, initial)=>input===initial,titleIdentity)).toBe(true);
	const exported = await download(page);
	const rendered = exported.coverage.rendered.filter((receipt:any)=>receipt.page==='sheet');
	expect(new Set(rendered.map((receipt:any)=>receipt.effectiveMode))).toEqual(new Set(['light','dark']));
	for (const receipt of rendered) {
		expect(receipt.sourceHash).toBe(exported.draft.pairSourceHash);
		expect(receipt.buildFingerprint).toBe(exported.build.fingerprint);
		expect(receipt.caseIds.length).toBeGreaterThan(0);
	}
	expect(exported.coverage.browserInteraction).toBe('not-run');
	expect(exported.coverage.manualAccessibility).toBe('not-run');
	await identity.dispose();
});

test('a narrow paired review rejects altered branch artifacts and can undo reopening', async ({page}) => {
	await page.setViewportSize({width:390,height:844});
	await openPage(page);
	await page.getByRole('textbox',{name:'Candidate title',exact:true}).fill('Before the pair');
	const imported = await importedPair(page);
	await expect(page.getByText('Light and Dark have separate rules and pins.',{exact:false})).toBeVisible();
	await expect(selector(page,'Editing appearance')).toBeVisible();
	await selector(page,'Editing appearance').selectOption('dark');
	const originalSelector = await selector(page,'Editing appearance').elementHandle();
	const broken = structuredClone(imported);
	broken.draft.branches.dark.candidate.artifacts['theme.css'] += '\n/* altered */';
	const {integrity: _integrity,...payload} = broken; broken.integrity=hashValue(payload);
	await importFile(page,broken,'altered-dark.json');
	await expect(page.getByRole('alert')).toContainText('do not match');
	await expect(selector(page,'Editing appearance')).toHaveValue('dark');
	expect(await selector(page,'Editing appearance').evaluate((input,initial)=>input===initial,originalSelector)).toBe(true);
	await button(page,'Undo').click();
	await expect(page.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue('Before the pair');
	await expect(selector(page,'Preview appearance')).toHaveCount(0);
	await button(page,'Redo').click();
	await expect(selector(page,'Editing appearance')).toHaveValue('dark');
	await expect(button(page,'Reset both appearances')).toBeVisible();
	expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
	const accessibility = await new AxeBuilder({page}).include('en-theme-review-app').analyze();
	expect(accessibility.violations).toEqual([]);
});


test('a reopened pair starts Auto independently of its editing branch and retains preview input through system changes', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await openPage(page); await importedPair(page); await loadPreviews(page);
	await expect(selector(page, 'Preview appearance')).toHaveValue('auto');
	await expect(selector(page, 'Editing appearance')).toHaveValue('light');
	await expect(preview(page).locator('html')).toHaveAttribute('data-en-appearance', 'auto');
	await expect(preview(page).locator('html')).toHaveCSS('color-scheme', 'light dark');
	await expect(page.locator('[data-review-auto-mode]')).toHaveText('Auto currently uses Dark.');
	await expect.poll(() => radius(page)).toBe('0.75rem');
	const field = preview(page).locator('[data-specimen="text-fields"]').getByRole('textbox', { name: 'Project name', exact: true });
	await field.fill('Preview independently');
	const identity = await field.evaluateHandle(input => ({ input, root: input.getRootNode(), document: input.ownerDocument }));
	await selector(page, 'Editing appearance').selectOption('dark');
	await expect(selector(page, 'Preview appearance')).toHaveValue('auto');
	await field.focus();
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => radius(page)).toBe('1rem');
	await expect(page.locator('[data-review-auto-mode]')).toHaveText('Auto currently uses Light.');
	await expect(selector(page, 'Editing appearance')).toHaveValue('dark');
	await expect(field).toHaveValue('Preview independently');
	await expect(field).toBeFocused();
	expect(await field.evaluate((input, saved) => input === saved.input && input.getRootNode() === saved.root && input.ownerDocument === saved.document, identity)).toBe(true);
	await expect(preview(page).locator('en-sticker-app')).toHaveAttribute('data-syntax-theme', 'github');
	await page.emulateMedia({ colorScheme: 'dark' });
	await expect.poll(() => radius(page)).toBe('0.75rem');
	await expect(preview(page).locator('en-sticker-app')).toHaveAttribute('data-syntax-theme', 'night-owl');
	await expect(selector(page, 'Preview appearance')).toHaveValue('auto');
	await identity.dispose();
});

test('the default review page follows the system while a single candidate and baseline retain authored mode and density', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await openPage(page);
	await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark');
	const parentDark = await page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor);
	await expect(selector(page, 'Candidate appearance')).toHaveValue('light');
	await expect(selector(page, 'Preview appearance')).toHaveCount(0);
	await loadPreviews(page);
	for (const kind of ['Baseline', 'Candidate'] as const) await expect(preview(page, kind).locator('html')).toHaveCSS('color-scheme', 'light');
	const field = (kind: 'Baseline'|'Candidate') => preview(page, kind).locator('[data-specimen="text-fields"]').getByRole('textbox', { name: 'Project name', exact: true });
	const comfortableHeight = await field('Candidate').evaluate(element => element.getBoundingClientRect().height);
	await selector(page, 'Candidate appearance').selectOption('dark');
	await selector(page, 'Candidate density').selectOption('spacious');
	for (const kind of ['Baseline', 'Candidate'] as const) await expect(preview(page, kind).locator('html')).toHaveCSS('color-scheme', 'dark');
	await expect.poll(() => field('Candidate').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(comfortableHeight);
	await expect.poll(async () => Math.abs(await field('Candidate').evaluate(element => element.getBoundingClientRect().height) - await field('Baseline').evaluate(element => element.getBoundingClientRect().height))).toBeLessThan(0.1);
	const candidateDark = await preview(page).locator('body').evaluate(body => getComputedStyle(body).backgroundColor);
	await field('Candidate').fill('Single authored appearance');
	const identity = await field('Candidate').elementHandle();
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor)).not.toBe(parentDark);
	await expect(preview(page).locator('body')).toHaveCSS('background-color', candidateDark);
	for (const kind of ['Baseline', 'Candidate'] as const) await expect(preview(page, kind).locator('html')).toHaveCSS('color-scheme', 'dark');
	await expect(field('Candidate')).toHaveValue('Single authored appearance');
	await expect(field('Candidate')).toBeFocused();
	expect(await field('Candidate').evaluate((input, saved) => input === saved, identity)).toBe(true);
	await expect(selector(page, 'Candidate appearance')).toHaveValue('dark');
	await expect(selector(page, 'Candidate density')).toHaveValue('spacious');
});
