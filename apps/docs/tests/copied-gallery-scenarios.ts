import { expect, type Page } from '@playwright/test';
import { navigationContentGalleryScenarios } from './copied-navigation-content-scenarios.js';
import { presentationGalleryScenarios } from './copied-presentation-scenarios.js';
import { copiedAPIScenarios } from './copied-api-scenarios.js';

/** Actual gallery copies, with the consumer's explicit public registrations.
 * These named journeys supplement, rather than replace, the owning matrices.
 */
export const copiedGalleryScenarios: Array<{
	id: string; entry: string; elements: string[]; contract: string;
	run(page: Page): Promise<void>;
}> = [
	{
		id: 'buttons', entry: 'buttonsExample', elements: ['button'],
		contract: 'Native keyboard activation and disabled/loading controls',
		async run(page) {
			const save = page.getByRole('button', { name: 'Save changes', exact: true });
			await save.evaluate(button => button.addEventListener('click', () => button.setAttribute('data-activated', 'true')));
			await save.focus(); await save.press('Enter');
			await expect(save).toHaveAttribute('data-activated', 'true');
			await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled();
			await expect(page.getByRole('button', { name: 'Saving', exact: true })).toBeDisabled();
			await save.press('Tab');
			await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeFocused();
		},
	},
	{
		id: 'button-scale', entry: 'buttonScaleExample', elements: ['button', 'icon', 'link'],
		contract: 'Delivered size progression, icon-only accessible label and native link navigation',
		async run(page) {
			const sizes = await Promise.all(['Small', 'Medium', 'Large'].map(name => page.getByRole('button', { name, exact: true }).boundingBox()));
			expect(sizes[0]!.height).toBeLessThan(sizes[1]!.height); expect(sizes[1]!.height).toBeLessThan(sizes[2]!.height);
			await page.getByRole('button', { name: 'Add collaborator', exact: true }).focus();
			await expect(page.getByRole('button', { name: 'Add collaborator', exact: true })).toBeFocused();
			await page.getByRole('link', { name: 'Explore form controls', exact: true }).press('Enter');
			await expect(page).toHaveURL(/#fields$/);
		},
	},
	{
		id: 'mixed-toolbar', entry: 'mixedToolbarExample', elements: ['toolbar', 'text-field', 'select', 'select-option', 'checkbox', 'button'],
		contract: 'Native editing keys and authored application output from mixed controls',
		async run(page) {
			const title = page.getByRole('textbox', { name: 'Study title', exact: true });
			await title.fill('Night study'); await title.press('Home'); await expect(title).toBeFocused();
			await page.getByRole('combobox', { name: 'Study output format', exact: true }).selectOption('svg');
			await page.getByRole('checkbox', { name: 'Include study background', exact: true }).uncheck();
			await page.getByRole('button', { name: 'Apply preview settings', exact: true }).click();
			await expect(page.locator('[data-study-result]')).toContainText('Night study: SVG, without background');
		},
	},
	{
		id: 'menu-choices', entry: 'menuChoicesExample', elements: ['stack', 'button', 'icon', 'checkbox', 'menu', 'menu-item'],
		contract: 'Checkable/radio preview, application veto and nested export action',
		async run(page) {
			const trigger = page.getByRole('button', { name: 'Preview options', exact: true });
			await trigger.click();
			await page.getByRole('menuitemcheckbox', { name: 'Include background', exact: true }).click();
			await page.getByRole('menuitemradio', { name: 'Landscape', exact: true }).click();
			await expect(page.locator('[data-menu-result]')).toHaveText('Landscape preview; background excluded.');
			await page.keyboard.press('Escape');
			await page.getByRole('checkbox', { name: 'Hold preview settings', exact: true }).check();
			await trigger.click();
			await page.getByRole('menuitemradio', { name: 'Portrait', exact: true }).click();
			await expect(page.getByRole('menuitemradio', { name: 'Landscape', exact: true })).toHaveAttribute('aria-checked', 'true');
			await page.getByRole('menuitem', { name: 'Export', exact: true }).click();
			await page.getByRole('menuitem', { name: 'SVG', exact: true }).click();
			await expect(page.locator('[data-menu-result]')).toContainText('SVG export requested locally');
		},
	},
	{
		id: 'text-fields', entry: 'textFieldsExample', elements: ['text-field'],
		contract: 'External/slotted labels, native editing, password masking and error association',
		async run(page) {
			const host = page.locator('#example-project-code'); const input = host.locator('input');
			await page.locator('label[for="example-project-code"]').click(); await expect(input).toBeFocused();
			// Playwright's matcher misses outward IDL label references in the fallback.
            // Check real references in every engine and Chromium native AX separately.
            await expect.poll(() => input.evaluate((input: HTMLInputElement) => Array.from(input.ariaLabelledByElements ?? input.labels ?? [], label => label.textContent?.trim()))).toEqual(['Workspace', 'Project code']);
            if (page.context().browser()?.browserType().name() === 'chromium') {
                const session = await page.context().newCDPSession(page);
                try {
                    const { nodes } = await session.send('Accessibility.getFullAXTree');
                    expect(nodes.filter(node => !node.ignored && node.role?.value === 'textbox').map(node => node.name?.value)).toContain('Workspace Project code');
                } finally { await session.detach(); }
            }
			await input.fill('UPDATED'); await expect(host).toHaveJSProperty('value', 'UPDATED');
			const name = page.getByRole('textbox', { name: 'Project name', exact: true });
			await name.fill('Copied project'); await expect(name).toHaveAccessibleDescription(/collaborators.*Review this field/);
			const password = page.getByLabel('Password', { exact: true }); await password.fill('sample-only');
			await expect(password).toHaveAttribute('type', 'password');
			await expect(page.getByRole('textbox', { name: 'Contact email', exact: true })).toHaveAttribute('aria-invalid', 'true');
		},
	},
	{
		id: 'long-text-search', entry: 'longTextSearchExample', elements: ['textarea', 'search-input'],
		contract: 'Multiline draft editing and independent native search value',
		async run(page) {
			const draft = page.getByRole('textbox', { name: 'Creative direction', exact: true });
			await draft.fill('First line\nSecond line'); await expect(page.locator('en-textarea')).toHaveJSProperty('value', 'First line\nSecond line');
			const search = page.getByRole('searchbox', { name: 'Find an asset', exact: true });
			await search.fill('cover'); await expect(page.locator('en-search-input')).toHaveJSProperty('value', 'cover');
			await search.fill(''); await expect(page.locator('en-search-input')).toHaveJSProperty('value', '');
			await expect(draft).toHaveValue('First line\nSecond line');
		},
	},
	{
		id: 'structured-values', entry: 'structuredValuesExample', elements: ['select', 'date-input'],
		contract: 'Data-authored selection and canonical native date acceptance',
		async run(page) {
			await page.getByRole('combobox', { name: 'Export format', exact: true }).selectOption('svg');
			await expect(page.locator('en-select')).toHaveJSProperty('value', 'svg');
			const input = page.locator('en-date-input input'); await input.fill('2026-10-02'); await input.press('Tab');
			await expect(page.locator('en-date-input')).toHaveJSProperty('value', '2026-10-02');
		},
	},
	{
		id: 'precision', entry: 'precisionExample', elements: ['number-field', 'text-field'],
		contract: 'Number draft acceptance, keyboard stepping and disabled field',
		async run(page) {
			const number = page.getByRole('spinbutton', { name: 'Corner radius', exact: true });
			await number.fill('20'); await number.press('Enter'); await number.press('ArrowUp');
			await expect(number).toHaveValue('21');
			await expect(page.getByRole('textbox', { name: 'Shared workspace', exact: true })).toBeDisabled();
		},
	},
	{
		id: 'color-field', entry: 'colorFieldExample', elements: ['color-field', 'swatch'],
		contract: 'Accepted native color updates the authored swatch/output; veto preserves them',
		async run(page) {
			const host = page.locator('en-color-field'); const input = host.locator('input[type=color]');
			await input.fill('#336699'); await input.dispatchEvent('change');
			await expect(host).toHaveJSProperty('value', '#336699');
			await expect(page.locator('output')).toHaveText('#336699');
			await expect(page.locator('en-swatch')).toHaveJSProperty('color', '#336699');
			await host.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
			await input.evaluate((element: HTMLInputElement) => { element.value = '#ff0000'; element.dispatchEvent(new Event('change', { bubbles: true })); });
			await expect(host).toHaveJSProperty('value', '#336699'); await expect(page.locator('output')).toHaveText('#336699');
		},
	},
	{
		id: 'child-authored-choices', entry: 'childAuthoredChoicesExample', elements: ['select', 'select-option', 'segmented-control', 'segmented-item', 'button', 'text-field'],
		contract: 'Authored dynamic choices submit native FormData with preserved value identity',
		async run(page) {
			await page.getByRole('button', { name: 'Add PDF and Square', exact: true }).click();
			await page.getByRole('combobox', { name: 'Authored export format', exact: true }).selectOption('pdf');
			await page.locator('en-segmented-item[data-added-choice="square"]').click();
            await expect(page.getByRole('radio', { name: 'Square', exact: true })).toBeChecked();
			await page.getByRole('button', { name: 'Use these choices', exact: true }).click();
			await expect(page.locator('[data-choice-receipt]')).toHaveText('Submitted format: pdf; layout: square.');
			await page.getByRole('button', { name: 'Remove PDF and Square', exact: true }).click();
			await expect(page.getByRole('radio', { name: 'Square', exact: true })).toHaveCount(0);
			await expect(page.locator('#authored-format')).toHaveJSProperty('value', 'pdf');
		},
	},
	{
		id: 'checkboxes-switches', entry: 'checkboxesSwitchesExample', elements: ['checkbox', 'switch'],
		contract: 'External label activation, canceled toggle and independent switch keyboard editing',
		async run(page) {
			const input = page.locator('#example-include-drafts input');
			await page.locator('label[for="example-include-drafts"]').click(); await expect(input).toBeChecked(); await expect(input).toBeFocused();
			await page.locator('#example-include-drafts').evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
			await page.locator('label[for="example-include-drafts"]').click(); await expect(input).toBeChecked();
			const live = page.getByRole('switch', { name: 'Live preview', exact: true });
			await live.press('Space'); await expect(live).not.toBeChecked();
			await expect(page.getByRole('checkbox', { name: 'Locked by workspace', exact: true })).toBeDisabled();
		},
	},
	{
		id: 'radio-group', entry: 'radioGroupExample', elements: ['radio-group', 'radio'],
		contract: 'Radio selection and transactional cancellation preserve the selected peer',
		async run(page) {
			const group = page.locator('en-radio-group');
			await page.getByRole('radio', { name: 'Highest quality', exact: true }).check(); await expect(group).toHaveJSProperty('value', 'best');
			await group.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
			await page.getByRole('radio', { name: 'Smaller file', exact: true }).click();
			await expect(page.getByRole('radio', { name: 'Highest quality', exact: true })).toBeChecked();
			await expect(group).toHaveJSProperty('value', 'best');
		},
	},
	{
		id: 'opacity', entry: 'opacityExample', elements: ['slider'],
		contract: 'Exact-value commit updates the authored preview and Escape restores a draft',
		async run(page) {
			const edit = page.getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
			await edit.fill('42'); await edit.press('Enter');
			await expect(page.locator('.opacity-sample')).toHaveCSS('opacity', '0.42');
			await edit.fill('80'); await edit.press('Escape'); await expect(edit).toHaveValue('42');
			await expect(page.getByRole('slider', { name: 'Layer opacity', exact: true })).toHaveValue('42');
		},
	},
	{
		id: 'vertical-slider', entry: 'verticalSliderExample', elements: ['slider'],
		contract: 'Vertical native range semantics, ArrowUp and exact-value synchronization',
		async run(page) {
			const range = page.getByRole('slider', { name: 'Brush size', exact: true });
			await expect(range).toHaveAttribute('aria-orientation', 'vertical'); await expect(range).toHaveCSS('writing-mode', 'vertical-lr');
			await range.press('ArrowUp'); await expect(range).toHaveValue('33');
			const edit = page.getByRole('spinbutton', { name: 'Brush size Exact value', exact: true });
			await expect(edit).toHaveValue('33'); await edit.fill('48'); await edit.press('Enter'); await expect(range).toHaveValue('48');
		},
	},
	{
		id: 'rating', entry: 'ratingExample', elements: ['rating'],
		contract: 'Accessible native radio score and explicit clearing',
		async run(page) {
			await page.getByRole('radio', { name: '3 of 5 stars', exact: true }).press('ArrowRight');
            await expect(page.getByRole('radio', { name: '4 of 5 stars', exact: true })).toBeChecked();
			await expect(page.locator('en-rating')).toHaveJSProperty('value', 4);
			await page.locator('en-rating [part~="clear-option"]').click();
            await expect(page.getByRole('radio', { name: 'No rating', exact: true })).toBeChecked();
			await expect(page.locator('en-rating')).toHaveJSProperty('value', 0);
		},
	},
	{
		id: 'file-upload', entry: 'fileUploadExample', elements: ['file-upload', 'button', 'progress-bar'],
		contract: 'Selected files survive transfer failure/retry, enter the receipt and reset',
		async run(page) {
			const host = page.locator('#file-upload-choice'); const input = host.locator('input[type=file]');
			await input.setInputFiles({ name: 'study.png', mimeType: 'image/png', buffer: Buffer.from('local fixture') });
			await page.getByRole('button', { name: 'Start simulated transfer', exact: true }).click(); await expect(input).toBeDisabled();
			await page.getByRole('button', { name: 'Fail transfer', exact: true }).click();
			await page.getByRole('button', { name: 'Retry transfer', exact: true }).click();
			await page.getByRole('button', { name: 'Complete transfer', exact: true }).click();
			await expect(page.locator('[data-upload-receipt]')).toContainText('study.png');
			await page.getByRole('button', { name: 'Reset files', exact: true }).click();
			expect(await host.evaluate(element => (element as HTMLElement & { files: File[] }).files.length)).toBe(0);
		},
	},
];

// Reuse the owning journey on the separately extracted gallery copy. Complete
// API modules carry a registration prelude; gallery consumers supply it explicitly.
for (const [id, elements] of Object.entries({
	calendar: ['button', 'calendar', 'checkbox', 'date-picker', 'select', 'time-field'],
	carousel: ['button', 'carousel', 'carousel-slide'],
	'multi-step': ['alert', 'button', 'checkbox', 'date-picker', 'progress-step', 'progress-steps', 'text-field', 'validation-summary'],
	'rich-text': ['button', 'chat-composer', 'editor-toolbar', 'editor-trigger', 'rich-text-editor', 'select', 'select-option', 'token-editor'],
	'virtual-collection': ['button', 'checkbox', 'pagination', 'select', 'table', 'text-field', 'icon'],
})) {
	const scenario = copiedAPIScenarios.find(item => item.id === `api-${id}`)!;
	copiedGalleryScenarios.push({ ...scenario, id, elements });
}

copiedGalleryScenarios.push(...presentationGalleryScenarios);

copiedGalleryScenarios.push(...navigationContentGalleryScenarios);

// Keep inventory exhaustive; compilation alone never qualifies new examples.
export const pendingGalleryExamples: string[] = ['color-picker', 'color-plane', 'color-slider', 'color-wheel', 'navigation-sidebar', 'tree-data', 'composable-chat', 'chat-patterns', 'data-table', 'presence-activity', 'toast'];
