import { test, expect, type Locator } from '@playwright/test';

async function expectTooltipDescription(control: Locator, text: string) {
	// Playwright's synthesized description does not read cross-root element references.
	// Inspect the actual native relationship used by the browser in all engines.
	await expect.poll(() => control.evaluate(node => (node.ariaDescribedByElements ?? [])
		.map(reference => reference.textContent?.trim() ?? '').join(' '))).toBe(text);
}

test('popup-motion: the built select and popover fade on entry and exit', async ({ page }, info) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/api-examples/popup-motion.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const row = page.locator('[data-popup-motion="motion"]');
	await row.evaluate(node => {
		const style = (node as HTMLElement).style;
		style.setProperty('--en-duration-enter', '400ms'); style.setProperty('--en-duration-exit', '400ms');
		style.setProperty('--en-ease-enter', 'linear'); style.setProperty('--en-ease-exit', 'linear');
	});
	const supported = await page.evaluate(() => CSS.supports('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto'));
	const select = row.getByRole('combobox', { name: 'Drawer edge', exact: true });
	const popover = row.locator('en-popover');
	const sample = async (type: 'select' | 'popover') => (type === 'select' ? select : popover.locator('[part~="surface"]')).evaluate(async (node, type) => {
		const frames = []; const start = performance.now();
		do {
			const style = getComputedStyle(node, type === 'select' ? '::picker(select)' : null);
			frames.push({ opacity: Number(style.opacity), display: style.display });
			await new Promise(requestAnimationFrame);
		} while (performance.now() - start < 500);
		return frames;
	}, type);
	const entries: unknown[] = [];
	const picker = await page.evaluate(() => CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'));
	for (const type of ['select', 'popover'] as const) {
		if (type === 'select' && !picker) { await select.selectOption('left'); await expect(row.locator('en-drawer')).toHaveJSProperty('placement', 'left'); continue; }
		if (type === 'select') { await select.focus(); await page.keyboard.press('Space'); }
		else await row.getByRole('button', { name: 'Popover', exact: true }).click();
		const entry = await sample(type);
		if (supported) expect(entry.some(frame => frame.opacity > 0 && frame.opacity < .9)).toBe(true);
		expect(entry.at(-1)!.opacity).toBe(1);
		await page.keyboard.press('Escape');
		const exit = await sample(type);
		if (supported) expect(exit.some(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== 'none')).toBe(true);
		expect(exit.at(-1)!.display).toBe('none');
		entries.push({ type, entry, exit });
	}
	await info.attach('built-entry-motion.json', { body: JSON.stringify({ supported, picker, entries }), contentType: 'application/json' });
});

test('select-chevron: shared icon sizing preserves native selection and appearance fallback', async ({ page }, info) => {
	await page.goto('/api-examples/focus-motion.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const row = page.locator('[data-focus-sample="defaults"]');
	const host = row.locator('en-select');
	const select = host.getByRole('combobox', { name: 'Export format', exact: true });
	const chevron = row.locator('en-combobox [part="trigger"] svg');
	const enhanced = await page.evaluate(() => CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'));
	const iconStyle = () => select.evaluate(node => {
		const style = getComputedStyle(node, '::picker-icon');
		return { width: style.inlineSize, height: style.blockSize, color: style.color, background: style.backgroundColor, mask: style.maskImage, adjust: style.forcedColorAdjust };
	});
	await expect(select).toHaveCSS('appearance', enhanced ? 'base-select' : 'none');
	await select.focus();
	await expect(select).toBeFocused();
	if (enhanced) {
		await page.keyboard.press('Space');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
	} else {
		// OS picker menus are outside the DOM in the native fallback.
		await select.selectOption('svg');
	}
	await expect(select).toHaveValue('svg');
	await expect(host).toHaveJSProperty('value', 'svg');
	if (enhanced) {
		for (const direction of ['ltr', 'rtl']) {
			await row.evaluate((node, dir) => node.setAttribute('dir', dir), direction);
			for (const size of ['small', 'medium', 'large']) {
				await row.evaluate((node, size) => {
					for (const control of node.querySelectorAll('en-select, en-combobox')) control.setAttribute('size', size);
				}, size);
				const expected = await chevron.evaluate(node => ({ width: getComputedStyle(node).inlineSize, height: getComputedStyle(node).blockSize }));
				expect(await iconStyle()).toMatchObject(expected);
				expect((await iconStyle()).mask).not.toBe('none');
			}
		}
		// The caret belongs to the native control and opens the same picker.
		const bounds = (await select.boundingBox())!;
		await select.click({ position: { x: 18, y: bounds.height / 2 } });
		await expect(select.locator('option[value="png"]')).toBeVisible();
		await select.locator('option[value="png"]').click();
		await expect(host).toHaveJSProperty('value', 'png');
		const customStyle = await page.addStyleTag({ content: 'en-select::part(control)::picker-icon { color: rgb(99, 44, 144); }' });
		expect(await iconStyle()).toMatchObject({ color: 'rgb(99, 44, 144)', background: 'rgb(99, 44, 144)' });
		await page.emulateMedia({ forcedColors: 'active' });
		// Remove the consumer override before checking library system-color paint.
		await customStyle.evaluate(node => node.remove());
		const systemColors = await page.evaluate(() => {
			const probe = document.createElement('span'); document.body.append(probe);
			probe.style.color = 'ButtonText'; const enabled = getComputedStyle(probe).color;
			probe.style.color = 'GrayText'; const disabled = getComputedStyle(probe).color;
			probe.remove(); return { enabled, disabled };
		});
		expect(await iconStyle()).toMatchObject({ color: systemColors.enabled, background: systemColors.enabled });
		if (await page.evaluate(() => CSS.supports('forced-color-adjust', 'none'))) expect((await iconStyle()).adjust).toBe('none');
		await host.evaluate(node => node.setAttribute('disabled', ''));
		await expect(select).toBeDisabled();
		expect(await iconStyle()).toMatchObject({ color: systemColors.disabled, background: systemColors.disabled });
		await host.evaluate(node => node.removeAttribute('disabled'));
		await page.emulateMedia({ forcedColors: 'none' });
	}
	await row.evaluate(node => {
		node.setAttribute('dir', 'ltr');
		for (const control of node.querySelectorAll('en-select, en-combobox')) control.removeAttribute('size');
	});
	const comparison = info.outputPath('select-and-combobox.png');
	await row.screenshot({ path: comparison });
	await info.attach('select-and-combobox', { path: comparison, contentType: 'image/png' });
	await host.evaluate(node => (node as HTMLElement).style.setProperty('--en-select-appearance', 'auto'));
	// Fallback engines already use the OS picker with the library's closed-control decoration.
	await expect(select).toHaveCSS('appearance', enhanced ? 'auto' : 'none');
	await select.selectOption('svg');
	await expect(host).toHaveJSProperty('value', 'svg');
	const fallback = info.outputPath('select-platform-appearance.png');
	await row.screenshot({ path: fallback });
	await info.attach('select-platform-appearance', { path: fallback, contentType: 'image/png' });
	await info.attach('browser-capabilities', { body: JSON.stringify({ enhanced, version: page.context().browser()?.version() }), contentType: 'application/json' });
});

test('popup-motion: drawer edge controls preserve drafts and tooltip focus can be dismissed', async ({ page }, info) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/api-examples/popup-motion.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const row = page.getByRole('group', { name: 'Scoped motion recipe', exact: true });
	const drawer = row.locator('en-drawer');
	const open = row.getByRole('button', { name: 'Drawer', exact: true });
	const edge = row.getByRole('combobox', { name: 'Drawer edge', exact: true });
	const notes = drawer.getByRole('textbox', { name: 'Notes', exact: true });
	for (const placement of ['left', 'right', 'top', 'bottom']) {
		await edge.selectOption(placement);
		await expect(drawer).toHaveJSProperty('placement', placement);
		await open.focus(); await open.press('Enter');
		await expect(drawer.getByRole('dialog')).toBeVisible();
		if (placement === 'left') await notes.fill('Preserve this drawer draft across all four edges.');
		await expect(notes).toHaveValue('Preserve this drawer draft across all four edges.');
		await expect.poll(() => drawer.getByRole('dialog').evaluate((node, side) => {
			const box = node.getBoundingClientRect();
			return Math.abs(side === 'left' ? box.left : side === 'right' ? innerWidth - box.right : side === 'top' ? box.top : innerHeight - box.bottom);
		}, placement)).toBeLessThan(1);
		await page.keyboard.press('Escape');
		await expect(drawer).toHaveJSProperty('open', false);
		await expect(open).toBeFocused();
	}
	const palette = row.locator('en-command-palette');
	const paletteTrigger = row.getByRole('button', { name: 'Command palette', exact: true });
	await paletteTrigger.focus(); await paletteTrigger.press('Enter');
	await expect(palette.getByRole('dialog')).toBeVisible();
	const search = palette.getByRole('combobox');
	await expect(search).toBeFocused();
	await search.fill('Finish');
	await expect(palette.getByRole('option', { name: 'Finish motion preview', exact: true })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(palette).toHaveJSProperty('open', false);
	await expect(paletteTrigger).toBeFocused();
	const trigger = row.getByRole('button', { name: 'Tooltip', exact: true });
	await trigger.focus();
	await expect(row.locator('en-tooltip')).toHaveJSProperty('open', true);
	await expect(row.getByRole('tooltip')).toBeVisible();
	await expect(trigger).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(row.locator('en-tooltip')).toHaveJSProperty('open', false);
	await expect(trigger).toBeFocused();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(edge).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await row.screenshot({ path: info.outputPath('popup-review-mobile.png') });
});

for (const id of ['child-authored-choices', 'focus-motion']) {
	test(`${id}: isolated review preserves edits through themes and resets only its specimen`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(error.message));
		await page.goto(`/api-examples/${id}.html?progress-report`);
		await expect(page.locator('html')).toHaveAttribute('data-example-standalone', '');
		const tools = page.getByRole('group', { name: 'Review controls', exact: true });
		await expect(tools).toBeVisible();
		const field = id === 'child-authored-choices' ? page.locator('#authored-format select')
			: page.locator('[data-focus-sample="defaults"] en-text-field input');
		const original = await field.inputValue();
		const next = id === 'child-authored-choices' ? 'svg' : 'Keep this exact draft';
		if (id === 'child-authored-choices') await field.selectOption(next); else await field.fill(next);
		const node = await field.elementHandle();
		await tools.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark');
		await tools.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'dark');
		await expect(page.locator('html')).toHaveAttribute('data-example-density', 'compact');
		await expect(field).toHaveValue(next);
		expect(await field.evaluate((current, before) => current === before, node)).toBe(true);
		const reset = tools.getByRole('button', { name: 'Reset example', exact: true });
		await reset.focus(); await reset.press('Enter');
		await expect(field).toHaveValue(original);
		await expect(reset).toBeFocused();
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'dark');
		await expect(page.locator('html')).toHaveAttribute('data-example-density', 'compact');
		expect(await field.evaluate((current, before) => current === before, node)).toBe(false);
		await tools.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('auto');
		await page.emulateMedia({ colorScheme: 'dark' });
		await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark');
		await page.setViewportSize({ width: 390, height: 844 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		// An ordinary iframe keeps the bridge's controls and does not expose a second toolbar.
		await page.evaluate(id => {
			const frame = document.createElement('iframe'); frame.id = 'embedded-review';
			frame.src = `/api-examples/${id}.html`; frame.title = 'Embedded review'; document.body.append(frame);
		}, id);
		const embedded = page.frameLocator('#embedded-review');
		await expect(embedded.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
		await expect(embedded.getByRole('group', { name: 'Review controls', exact: true })).not.toBeVisible();
		await expect(embedded.locator('html')).not.toHaveAttribute('data-example-standalone');
		expect(errors).toEqual([]);
	});
}

test('child-authored-choices: add and remove actual descriptors without replacing current values, edits or surviving nodes', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', error => errors.push(error.message));
	await page.goto('/api-examples/child-authored-choices.html?progress-report');
	await expect(page.locator('html')).toHaveAttribute('data-example-standalone', '');
	const scene = page.locator('[data-specimen="child-authored-choices"]');
	const form = scene.getByRole('form', { name: 'Child-authored export choices', exact: true });
	const format = scene.locator('#authored-format');
	const select = format.getByRole('combobox', { name: 'Authored export format', exact: true });
	const layout = scene.locator('#authored-layout');
	const receipt = scene.locator('[data-choice-receipt]');
	const catalogStatus = scene.locator('[data-choice-catalog-status]');
	const add = scene.getByRole('button', { name: 'Add PDF and Square', exact: true });
	const remove = scene.getByRole('button', { name: 'Remove PDF and Square', exact: true });
	const submit = scene.getByRole('button', { name: 'Use these choices', exact: true });
	const values = () => form.evaluate(form => {
		const data = new FormData(form as HTMLFormElement);
		return { format: data.get('exportFormat'), layout: data.get('canvasLayout') };
	});

	await scene.getByRole('textbox', { name: 'SVG option label', exact: true }).fill('Vector export');
	await scene.getByRole('textbox', { name: 'Landscape item label', exact: true }).fill('Wide');
	await scene.getByRole('textbox', { name: 'Landscape item label', exact: true }).press('Tab');
	await expect(select.locator('option[value="svg"]')).toHaveText('Vector export');
	const landscape = layout.getByRole('radio', { name: 'Wide · Wide canvas', exact: true });
	await expect(landscape).toBeVisible();
	await scene.getByRole('button', { name: 'Disable SVG and Landscape', exact: true }).click();
	await expect(landscape).toBeDisabled();
	await expect(select.locator('option[value="svg"]')).toBeDisabled();
	const selectIdentity = await select.elementHandle();
	const labelIdentity = await scene.locator('#authored-landscape-item strong').elementHandle();

	await add.focus(); await add.press('Enter');
	await expect(select.locator('option[value="pdf"]')).toHaveText('PDF · Document');
	const square = layout.getByRole('radio', { name: 'Square', exact: true });
	await expect(square).toBeVisible();
	await expect(catalogStatus).toHaveText('PDF and Square are available.');
	await expect(add).toBeFocused();
	await add.press('Enter');
	await expect(format.locator(':scope > en-select-option')).toHaveCount(3);
	await expect(layout.locator(':scope > en-segmented-item')).toHaveCount(3);
	await expect(format).toHaveJSProperty('value', 'png');
	await expect(layout).toHaveJSProperty('value', 'portrait');
	await select.selectOption('pdf');
	await layout.locator('en-segmented-item[data-added-choice="square"]').click();
	await expect(square).toBeChecked();
	await submit.click();
	await expect(receipt).toHaveText('Submitted format: pdf; layout: square.');

	await remove.focus(); await remove.press('Enter');
	await expect(format.locator(':scope > en-select-option')).toHaveCount(2);
	await expect(layout.locator(':scope > en-segmented-item')).toHaveCount(2);
	await expect(select.locator('option[value="pdf"]')).toHaveCount(0);
	await expect(square).toHaveCount(0);
	await expect(catalogStatus).toHaveText('PDF and Square removed.');
	await expect(remove).toBeFocused();
	await expect(format).toHaveJSProperty('value', 'pdf');
	await expect(layout).toHaveJSProperty('value', 'square');
	await expect.poll(values).toEqual({ format: null, layout: null });
	await submit.click();
	await expect(receipt).toHaveText('Submitted format: pdf; layout: square.');
	await expect(select).toHaveAttribute('aria-invalid', 'true');
	await expect(select.locator('option[value="svg"]')).toHaveText('Vector export');
	await expect(landscape).toBeDisabled();
	expect(await select.evaluate((current, before) => current === before, selectIdentity)).toBe(true);
	expect(await scene.locator('#authored-landscape-item strong').evaluate((current, before) => current === before, labelIdentity)).toBe(true);

	await add.click();
	await expect(select).toHaveValue('pdf');
	await expect(square).toBeChecked();
	await expect.poll(values).toEqual({ format: 'pdf', layout: 'square' });
	await expect(landscape).toBeDisabled();
	await expect(select.locator('option[value="svg"]')).toBeDisabled();
	await expect(scene.getByRole('textbox', { name: 'SVG option label', exact: true })).toHaveValue('Vector export');
	await expect(scene.getByRole('textbox', { name: 'Landscape item label', exact: true })).toHaveValue('Wide');

	const reset = page.getByRole('group', { name: 'Review controls', exact: true }).getByRole('button', { name: 'Reset example', exact: true });
	await reset.focus(); await reset.press('Enter');
	await expect(reset).toBeFocused();
	await expect(format.locator(':scope > en-select-option')).toHaveCount(2);
	await expect(layout.locator(':scope > en-segmented-item')).toHaveCount(2);
	await expect(select).toHaveValue('png');
	await expect(layout).toHaveJSProperty('value', 'portrait');
	await expect(select.locator('option[value="svg"]')).toHaveText('SVG · Vector image');
	await expect(select.locator('option[value="svg"]')).toBeEnabled();
	await expect(layout.getByRole('radio', { name: 'Landscape · Wide canvas', exact: true })).toBeEnabled();
	await expect(receipt).toHaveText('No choices submitted yet.');
	await expect(catalogStatus).toHaveText('');
	await selectIdentity?.dispose(); await labelIdentity?.dispose();
	expect(errors).toEqual([]);
});

test('tooltip-warmup: isolated demo shares pointer delay only within its authored toolbar', async ({ page }) => {
	await page.goto('/api-examples/tooltip-warmup.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const canvas = page.getByRole('button', { name: 'Canvas guidance', exact: true });
	const selection = page.getByRole('button', { name: 'Selection guidance', exact: true });
	const exported = page.getByRole('button', { name: 'Export guidance', exact: true });
	const canvasHelp = page.locator('#canvas-guidance-tooltip');
	const selectionHelp = page.locator('en-tooltip[for="selection-guidance-trigger"]');
	const exportHelp = page.locator('en-tooltip[for="export-guidance-trigger"]');
	// A larger public delay distinguishes a shared warm open from a second cold open.
	await page.locator('en-tooltip').evaluateAll(nodes => nodes.forEach(node => { (node as any).showDelay = 1200; (node as any).hideDelay = 5000; }));
	await canvas.hover();
	await expect(canvasHelp).toHaveJSProperty('open', false);
	await expect(canvasHelp.getByRole('tooltip')).toBeVisible({ timeout: 2500 });
	await selection.hover();
	await expect(selectionHelp.getByRole('tooltip')).toBeVisible({ timeout: 700 });
	await expect(canvasHelp).toHaveJSProperty('open', false, { timeout: 700 });
	await expect(canvasHelp.getByRole('tooltip')).not.toBeVisible({ timeout: 700 });
	// Leave the intentionally long-lived tooltip before aiming at the button it overlaps.
	await page.mouse.move(0, 0);
	await expect(selectionHelp).toHaveJSProperty('open', false);
	await exported.hover();
	await expect(exportHelp).toHaveJSProperty('open', false);
	await expect(exportHelp.getByRole('tooltip')).toBeVisible({ timeout: 2500 });
	await page.keyboard.press('Escape');
	await expect(exportHelp).toHaveJSProperty('open', false);
});

test('tooltip-warmup: contextual demo shares timing and reset creates a cold scope', async ({ page }) => {
	await page.goto('/api-examples/tooltip-warmup.html?progress-report');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	const scene = page.locator('en-tooltip-context-demo');
	const canvas = scene.getByRole('button', {name: 'Canvas help', exact: true});
	const layers = scene.getByRole('button', {name: 'Layer help', exact: true});
	const canvasHelp = scene.locator('en-tooltip[for="context-canvas"]');
	const layerHelp = scene.locator('en-tooltip[for="context-layers"]');
	const delay = () => scene.locator('en-tooltip').evaluateAll(nodes => nodes.forEach(node => {
		(node as HTMLElement & {showDelay: number; hideDelay: number}).showDelay = 1200;
		(node as HTMLElement & {hideDelay: number}).hideDelay = 5000;
	}));
	await delay();
	await canvas.hover();
	await expect(canvasHelp).toHaveJSProperty('open', false);
	await expect(canvasHelp.getByRole('tooltip')).toBeVisible({timeout: 2500});
	await layers.hover();
	await expect(layerHelp.getByRole('tooltip')).toBeVisible({timeout: 700});
	await expect(canvasHelp).toHaveJSProperty('open', false, {timeout: 700});
	await page.keyboard.press('Escape');
	await expect(layerHelp).toHaveJSProperty('open', false);
	await page.getByRole('group', {name: 'Review controls', exact: true}).getByRole('button', {name: 'Reset example', exact: true}).click();
	await delay();
	await layers.hover();
	await expect(layerHelp).toHaveJSProperty('open', false);
	await expect(layerHelp.getByRole('tooltip')).toBeVisible({timeout: 2500});
	await expectTooltipDescription(layers, 'Inspect a layer’s properties.');
	const source = page.locator('.api-example-source');
	await source.locator('summary').click();
	await expect(source.locator('code')).toContainText("from '@en-reve/elements/context.js'");
	await expect(source.locator('code')).toContainText('new ContextProvider(this, {context: tooltipWarmupContext, initialValue: createTooltipWarmupGroup()})');
	await expect(source.locator('code')).toContainText('export function acceptValueChange');
});

test('tooltip-warmup: sticker sheet keyboard navigation and reset preserve external trigger descriptions', async ({ page }) => {
	await page.goto('/?progress-report#specimen-tooltip-warmup');
	await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');
	const specimen = page.locator('[data-specimen="tooltip-warmup"]');
	const canvas = specimen.getByRole('button', { name: 'Canvas guidance', exact: true });
	const selection = specimen.getByRole('button', { name: 'Selection guidance', exact: true });
	await canvas.focus();
	await expect(specimen.locator('#canvas-guidance-tooltip').getByRole('tooltip')).toBeVisible();
	await expectTooltipDescription(canvas, 'Use the canvas to explore spacing before committing to a layout.');
	await page.keyboard.press('ArrowRight');
	await expect(selection).toBeFocused();
	await expectTooltipDescription(selection, 'Select a layer to inspect its individual properties.');
	await expect(specimen.locator('en-tooltip[for="selection-guidance-trigger"]').getByRole('tooltip')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(specimen.locator('en-tooltip[for="selection-guidance-trigger"]')).toHaveJSProperty('open', false);
	await page.getByRole('button', { name: 'Reset Shared tooltip warm-up', exact: true }).click();
	await canvas.focus();
	await expect(specimen.locator('#canvas-guidance-tooltip').getByRole('tooltip')).toBeVisible();
});

test('tooltip-warmup: API controls target the shared example and settings toolbar retains its actions', async ({ page }) => {
	await page.goto('/api-reference?component=en-tooltip&progress-report');
	await page.locator('.api-demo-frame').scrollIntoViewIfNeeded();
	await expect(page.locator('.api-demo-frame')).toHaveAttribute('data-example-ready', 'true');
	const demo = page.frameLocator('.api-demo-frame');
	await expect(demo.getByRole('toolbar', { name: 'Editing guidance', exact: true })).toBeVisible();
	const delay = page.locator('.api-element-controls form[data-control="showDelay"]');
	await expect(delay).toBeVisible();
	await expect(page.locator('.api-element-controls form[data-control="warmupGroup"]')).toHaveCount(0);
	await page.goto('/workflows/settings/commands?progress-report');
	await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
	const toolbar = page.locator('#settings-command-toolbar');
	const save = toolbar.getByRole('button', { name: 'Save settings', exact: true });
	const restore = toolbar.getByRole('button', { name: 'Restore saved opacity', exact: true });
	await save.focus();
	await expectTooltipDescription(save, 'Save the current preview settings in this local simulation.');
	await page.keyboard.press('ArrowRight');
	await expect(restore).toBeFocused();
	await expectTooltipDescription(restore, 'Restore saved opacity while keeping your other local changes.');
	await page.keyboard.press('Escape');
	const opacity = page.getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
	const savedOpacity = await opacity.inputValue();
	await opacity.fill(savedOpacity === '72' ? '60' : '72');
	await opacity.press('Enter');
	await restore.click();
	await expect(opacity).toHaveValue(savedOpacity);
});
