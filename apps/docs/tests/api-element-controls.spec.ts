import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import definitions from '../src/generated/api-element-controls.js';

const frame = (page: Page) => page.frameLocator('.api-demo-frame');
const controls = (page: Page) => page.locator('.api-element-controls');
const row = (page: Page, property: string) => controls(page).locator(`form[data-control="${property}"]`);
const text = (page: Page, property: string) => row(page, property).getByRole('textbox', { name: property, exact: true });
const apply = async (page: Page, property: string) => {
	await row(page, property).getByRole('button', { name: `Apply ${property}`, exact: true }).click();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	await expect(controls(page).locator('.api-controls-status')).toContainText(`${property} applied`);
};
async function open(page: Page, tag: string) {
	await page.goto(`/api-reference?component=${tag}`);
	await expect(page.getByRole('heading', { name: tag, exact: true })).toBeVisible();
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	await expect(controls(page).getByRole('button', { name: 'Refresh values', exact: true })).toBeEnabled();
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('boolean and code-derived enum controls change only the captured button, then Reset restores authored state', async ({ page }) => {
	await open(page, 'en-button');
	const save = frame(page).getByRole('button', { name: 'Save changes', exact: true });
	const target = frame(page).locator('#api-save-changes');
	const identity = await target.elementHandle();
	await target.evaluate(element => { (window as any).inspectorChanges = 0; element.addEventListener('en-change', () => (window as any).inspectorChanges++); });
	await row(page, 'variant').getByRole('combobox', { name: 'variant', exact: true }).selectOption({ label: 'secondary' });
	await apply(page, 'variant');
	await expect(target).toHaveJSProperty('variant', 'secondary');
	await row(page, 'loading').getByRole('checkbox', { name: 'loading', exact: true }).check();
	await apply(page, 'loading');
	await expect(save).toBeDisabled();
	await expect(frame(page).getByRole('button', { name: 'Preview', exact: true })).toBeEnabled();
	await row(page, 'size').getByRole('combobox', { name: 'size', exact: true }).selectOption({ label: 'large' });
	await apply(page, 'size');
	await expect(target).toHaveJSProperty('size', 'large');
	expect(await target.evaluate((node, original) => node === original, identity)).toBe(true);
	expect(await target.evaluate(() => (window as any).inspectorChanges)).toBe(0);
	await page.locator('en-select[label="Example density"]').getByRole('combobox').selectOption('spacious');
	await expect(target).toHaveJSProperty('size', 'large');
	expect(await target.evaluate((node, original) => node === original, identity)).toBe(true);
	const reset = page.getByRole('button', { name: 'Reset example', exact: true });
	await reset.focus(); await reset.press('Enter');
	await expect(save).toBeEnabled();
	await expect(target).toHaveJSProperty('variant', 'primary');
	await expect(target).not.toHaveAttribute('size');
	await expect(row(page, 'loading').getByRole('checkbox')).not.toBeChecked();
	await expect(row(page, 'size').getByRole('combobox')).toHaveValue(String(definitions['en-button']!.controls.find(item => item.property === 'size')!.options!.indexOf('medium')));
	await expect(page.locator('en-select[label="Example density"]').getByRole('combobox')).toHaveValue('spacious');
	await expect(reset).toBeFocused();
	expect(await target.evaluate((node, original) => node !== original && !original!.isConnected, identity)).toBe(true);
});

test('renaming the target keeps identity, author writes stay silent, and settled native changes refresh values', async ({ page }) => {
	await open(page, 'en-text-field');
	const initial = frame(page).getByRole('textbox', { name: 'Project name', exact: true });
	const identity = await initial.elementHandle();
	await initial.evaluate(input => { const host = (input.getRootNode() as ShadowRoot).host; (window as any).writes = 0; host.addEventListener('en-change', () => (window as any).writes++); });
	await text(page, 'label').fill('Campaign title'); await apply(page, 'label');
	const renamed = frame(page).getByRole('textbox', { name: 'Campaign title', exact: true });
	await expect(renamed).toBeVisible();
	await text(page, 'value').fill('Accepted from Controls'); await apply(page, 'value');
	await expect(renamed).toHaveValue('Accepted from Controls');
	expect(await renamed.evaluate((node, original) => node === original, identity)).toBe(true);
	expect(await renamed.evaluate(() => (window as any).writes)).toBe(0);
	await renamed.fill('Accepted by the user'); await renamed.press('Tab');
	await expect(row(page, 'value').locator('.api-control-current')).toHaveText('Current: "Accepted by the user"');
	await renamed.evaluate(input => {
		const cancellation = new AbortController();
		(window as any).cancelInspectorEdit = cancellation;
		(input.getRootNode() as ShadowRoot).host.addEventListener('en-change', event => event.preventDefault(), { signal: cancellation.signal });
	});
	await renamed.fill('Rejected proposal'); await renamed.press('Tab');
	// Cancellation preserves the native editing draft while rolling back accepted public state.
	await expect(renamed).toHaveValue('Rejected proposal');
	expect(await renamed.evaluate(input => ((input.getRootNode() as ShadowRoot).host as HTMLElement & { value: string }).value)).toBe('Accepted by the user');
	await expect(row(page, 'value').locator('.api-control-current')).toHaveText('Current: "Accepted by the user"');
	await renamed.evaluate(() => (window as any).cancelInspectorEdit.abort());
	await renamed.evaluate(input => ((input.getRootNode() as ShadowRoot).host as HTMLElement & { value: string }).value = 'External author write');
	await controls(page).getByRole('button', { name: 'Refresh values', exact: true }).click();
	await expect(row(page, 'value').locator('.api-control-current')).toHaveText('Current: "External author write"');
	await expect(text(page, 'value')).toHaveValue('Accepted from Controls');
	await expect(frame(page).getByRole('textbox', { name: 'Contact email', exact: true })).toHaveValue('hello@');
});

test('numeric drafts allow fractions, reject blank and incomplete input, and expose associated instructions', async ({ page }) => {
	await open(page, 'en-number-field');
	const target = frame(page).locator('en-number-field');
	await text(page, 'min').fill('1.5'); await apply(page, 'min');
	await expect(target).toHaveJSProperty('min', 1.5);
	await expect(frame(page).getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveAttribute('min', '1.5');
	await text(page, 'min').fill('-');
	await row(page, 'min').getByRole('button', { name: 'Apply min', exact: true }).click();
	await expect(text(page, 'min')).toHaveValue('-');
	await expect(row(page, 'min').getByText('Enter a finite number using a period for decimals.', { exact: true })).toBeVisible();
	await expect(target).toHaveJSProperty('min', 1.5);
	await text(page, 'min').fill(''); await text(page, 'min').press('Enter');
	await expect(target).toHaveJSProperty('min', 1.5);
	await expect(text(page, 'min')).toHaveValue('');
	await expect(text(page, 'min')).toHaveAccessibleDescription(/Finite number; use a period for decimals/);
	await text(page, 'min').fill('2.25'); await text(page, 'min').press('Enter');
	await expect(target).toHaveJSProperty('min', 2.25);
	await expect(text(page, 'min')).toBeFocused();
});

test('shared example documents keep component targets distinct and unsupported arrays stay source-only', async ({ page }) => {
	await open(page, 'en-dialog');
	await text(page, 'label').fill('Inspector dialog'); await apply(page, 'label');
	await expect(frame(page).locator('en-dialog')).toHaveJSProperty('label', 'Inspector dialog');
	await expect(frame(page).locator('en-drawer')).toHaveJSProperty('label', 'Project details');
	await page.locator('en-select[label="Component"]').getByRole('combobox').selectOption('en-drawer');
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-component-tag', 'en-drawer');
	await expect(controls(page).getByRole('button', { name: 'Refresh values', exact: true })).toBeEnabled();
	await text(page, 'label').fill('Inspector drawer'); await apply(page, 'label');
	await expect(frame(page).locator('en-drawer')).toHaveJSProperty('label', 'Inspector drawer');
	await expect(frame(page).locator('en-dialog')).toHaveJSProperty('label', 'Invite to this project');
	await open(page, 'en-combobox');
	await expect(row(page, 'items')).toHaveCount(0);
	await controls(page).locator('.api-controls-excluded > summary').click();
	await expect(controls(page).locator('.api-controls-excluded code').filter({ hasText: /^items$/ })).toBeVisible();
	await text(page, 'value').fill('studio-south'); await apply(page, 'value');
	await frame(page).getByRole('button', { name: 'Use project', exact: true }).click();
	await expect(frame(page).locator('output')).toHaveText('Submitted project: studio-south');
	await page.locator('en-select[label="Component"]').getByRole('combobox').selectOption('en-splitter');
	await expect(page.locator('.api-demo-frame')).toHaveCount(0);
	await expect(page.getByText('No authored sticker-sheet example is linked to this component yet.', { exact: true })).toBeVisible();
});

test('narrow keyboard controls preserve focus and invalid drafts across theme changes', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await open(page, 'en-number-field');
	await text(page, 'min').fill('-');
	await text(page, 'min').press('Enter');
	await expect(text(page, 'min')).toBeFocused();
	const input = await text(page, 'min').elementHandle();
	await page.locator('en-segmented-control[label="Example appearance"]').getByText('Dark', { exact: true }).click();
	await expect(text(page, 'min')).toHaveValue('-');
	expect(await text(page, 'min').evaluate((node, original) => node === original, input)).toBe(true);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
	const editorRegion = controls(page).getByRole('region', { name: 'en-number-field property editors', exact: true });
	const summary = controls(page).locator(':scope > summary');
	await summary.scrollIntoViewIfNeeded();
	await editorRegion.hover();
	const summaryPosition = await summary.boundingBox();
	await page.mouse.wheel(0, 900);
	await expect.poll(() => editorRegion.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
	expect(await summary.boundingBox()).toEqual(summaryPosition);
	await row(page, 'readOnly').getByRole('checkbox').check();
	await apply(page, 'readOnly');
	await expect(frame(page).locator('en-number-field')).toHaveJSProperty('readOnly', true);
	// Parent and isolated example have separate document heading hierarchies.
	// Keep heading-order enabled in both scans instead of flattening the iframe h1 into the parent outline.
	const parentAccessibility = await new AxeBuilder({ page }).include('en-api-reference-app').exclude('iframe').analyze();
	const exampleAccessibility = await new AxeBuilder({ page }).include(['.api-demo-frame', 'body']).analyze();
	expect(parentAccessibility.violations).toEqual([]);
	expect(exampleAccessibility.violations).toEqual([]);
	expect(await page.evaluate(() => ({ checkbox: Boolean(customElements.get('en-checkbox')), text: Boolean(customElements.get('en-text-field')), combo: Boolean(customElements.get('en-combobox')), dialog: Boolean(customElements.get('en-dialog')) }))).toEqual({ checkbox: true, text: true, combo: false, dialog: false });
});

test('every authored Controls target is unique and available after its real example hydrates', async ({ page }) => {
	test.setTimeout(240_000);
	await open(page, 'en-button');
	for (const [tag, definition] of Object.entries(definitions)) {
		await page.locator('en-select[label="Component"]').getByRole('combobox').selectOption(tag);
		await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-component-tag', tag);
		await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
		await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
		await expect(controls(page).getByRole('button', { name: 'Refresh values', exact: true }), `${tag} target resolves`).toBeEnabled();
		const target = frame(page).locator('.api-example-content').locator(definition.target!.selector);
		await expect(target, `${tag} authored selector is unique`).toHaveCount(1);
		const identity = await target.elementHandle();
		const hasSize = definition.controls.some(control => control.property === 'size');
		if (hasSize) {
			await expect(row(page, 'size'), `${tag} exposes its size editor`).toBeVisible();
			await row(page, 'size').getByRole('combobox', { name: 'size', exact: true }).selectOption({ label: 'large' });
			await apply(page, 'size');
			await expect(target).toHaveJSProperty('size', 'large');
			await expect(row(page, 'size').locator('.api-control-current')).toHaveText('Current: "large"');
		} else {
			// Authored choice descriptors have no independent visual size. Exercise
			// their real public availability property instead of skipping the target.
			expect(['en-select-option', 'en-segmented-item', 'en-progress-step'], `${tag} is an unstyled choice descriptor`).toContain(tag);
			expect(definition.controls.some(control => control.property === 'disabled' && control.kind === 'boolean')).toBe(true);
			await expect(row(page, 'disabled'), `${tag} exposes its availability editor`).toBeVisible();
			await row(page, 'disabled').getByRole('checkbox', { name: 'disabled', exact: true }).check();
			await apply(page, 'disabled');
			await expect(target).toHaveJSProperty('disabled', true);
			await expect(row(page, 'disabled').locator('.api-control-current')).toHaveText('Current: true');
		}
		expect(await target.evaluate((node, original) => node === original, identity)).toBe(true);
		await identity?.dispose();
	}
});
