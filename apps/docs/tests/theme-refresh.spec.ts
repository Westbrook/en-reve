import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { reopenThemeReviewPair, type ResolvedTheme, type ThemeOptions } from '@en-reve/tokens';
import { emulationLimits } from './theme-proof-exceptions.js';
import { holdThemeController } from './theme-controller-transport.js';

const originals = ['vellum', 'signal', 'kinetic'] as const;
const themes = ['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired', 'radix-inspired', 'web-awesome-inspired', 'chakra-inspired', 'holotable-inspired', ...originals];
type Appearance = 'light' | 'dark';
interface Definition {
	id: string;
	label: string;
	title: string;
	rationale: string;
	reference?: { url: string; homepage?: string };
	baseOptions?: { light: ThemeOptions; dark: ThemeOptions };
}
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page, browser }, info) => {
	const messages: string[] = []; errors.set(page, messages);
	page.on('pageerror', error => messages.push(error.message));
	info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }, info) => {
	const messages = errors.get(page) ?? [];
	if (messages.length) await info.attach('runtime-errors', { body: JSON.stringify(messages), contentType: 'application/json' });
	expect(messages, 'Showcase, review and preview frames have no uncaught errors').toEqual([]);
});

const primary = (page: Page) => page.getByRole('button', { name: 'Create project', exact: true });
const field = (page: Page) => page.getByRole('textbox', { name: 'Project name', exact: true });

async function ready(page: Page, directTheme?: string) {
	await page.goto(`/showcase?progress-report${directTheme ? `&theme=${directTheme}&appearance=dark` : ''}`);
	await expect(page.getByRole('button', { name: 'Download JSON', exact: true })).toBeEnabled();
	await expect(page.locator('.showcase-card')).toHaveCount(16);
	if (directTheme) {
		await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', directTheme);
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'dark');
		await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
	}
}
async function choose(page: Page, id: string) {
	await page.locator('#showcase-theme').getByRole('combobox').selectOption(id);
	await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', id);
	await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
	await expect(page.locator('.showcase-theme-status')).toContainText('Applied');
}
async function appearance(page: Page, mode: Appearance) {
	const radio = page.locator('.showcase-theme en-segmented-control').getByRole('radio', { name: mode === 'light' ? 'Light' : 'Dark', exact: true });
	await radio.focus(); await radio.press('Space');
	await expect(page.locator('html')).toHaveAttribute('data-en-appearance', mode);
	await page.evaluate(() => document.fonts.ready);
}
async function download(page: Page, name: string, info: TestInfo, review = false) {
	const pending = page.waitForEvent('download');
	await page.getByRole('button', { name: review ? 'Export candidate' : 'Download JSON', exact: true }).click();
	const result = await pending;
	expect(await result.failure()).toBeNull();
	const path = info.outputPath(name); await result.saveAs(path);
	const bytes = await readFile(path);
	return { path, bytes, value: JSON.parse(bytes.toString()) as Record<string, any> };
}

/** Canonicalize typed CSS with the browser's actual CSS parser, outside app state. */
async function canonical(page: Page, declarations: Record<string, string>) {
	return page.evaluate(declarations => {
		const probe = document.createElement('span');
		probe.style.position = 'fixed'; probe.style.visibility = 'hidden';
		for (const [property, value] of Object.entries(declarations)) probe.style.setProperty(property, value);
		document.body.append(probe);
		const result = Object.fromEntries(Object.keys(declarations).map(property => [property, getComputedStyle(probe).getPropertyValue(property)]));
		probe.remove(); return result;
	}, declarations);
}
function effective(theme: ResolvedTheme, optional: string[], fallback: string) {
	return optional.map(id => theme.tokens[id]).find(token => token && ['pin', 'literal'].includes(token.provenance)) ?? theme.tokens[fallback];
}
async function signature(page: Page) {
	// Keep the original role/CSS locators and their unique-target requirement.
	// The union resolves all targets in one browser evaluation; evaluateAll itself
	// is not strict, so classify/count each original target before reading styles.
	const targets = page.locator('.showcase-heading h1')
		.or(primary(page)).or(field(page))
		.or(page.locator('#showcase-project > en-card > [part=base]'))
		.or(page.locator('body')).or(page.locator('.wordmark'))
		.or(page.locator('.showcase-share-art')).or(page.locator('.showcase-chat-welcome en-icon'));
	return targets.evaluateAll(elements => {
		const properties: Record<string, string[]> = {
			heading: ['font-family', 'font-size', 'font-weight', 'line-height', 'font-style', 'letter-spacing'],
			button: ['font-family', 'font-weight', 'border-radius'],
			input: ['font-family', 'font-size', 'border-radius'],
			card: ['background-color', 'border-radius'],
			page: ['background-color'], wordmark: ['color'], share: ['color'], chatIcon: ['color'],
		};
		const groups: Record<string, Element[]> = Object.fromEntries(Object.keys(properties).map(name => [name, []]));
		for (const element of elements) {
			const name = element.matches('.showcase-heading h1') ? 'heading'
				: element.matches('body') ? 'page'
				: element.matches('.wordmark') ? 'wordmark'
				: element.matches('.showcase-share-art') ? 'share'
				: element.matches('.showcase-chat-welcome en-icon') ? 'chatIcon'
				: element.matches('[part=base]') && (element.getRootNode() as ShadowRoot).host?.matches('#showcase-project > en-card') ? 'card'
				: element.matches('button,[role=button],input[type=button],input[type=submit],input[type=reset]') ? 'button'
				: element.matches('input,textarea,[role=textbox]') ? 'input' : null;
			if (!name) throw new Error('Unexpected theme signature target: ' + element.outerHTML);
			groups[name].push(element);
		}
		return Object.fromEntries(Object.entries(properties).map(([name, names]) => {
			if (groups[name].length !== 1) throw new Error(`Theme signature target ${name}: expected one match, found ${groups[name].length}`);
			const computed = getComputedStyle(groups[name][0]);
			return [name, Object.fromEntries(names.map(property => [property, computed.getPropertyValue(property)]))];
		}));
	});
}
async function canonicalSignatures(page: Page, declarations: Record<string, Record<string, string>>) {
	return page.evaluate(declarations => Object.fromEntries(Object.entries(declarations).map(([name, styles]) => {
		const probe = document.createElement('span');
		probe.style.position = 'fixed'; probe.style.visibility = 'hidden';
		for (const [property, value] of Object.entries(styles)) probe.style.setProperty(property, value);
		document.body.append(probe);
		try { const computed = getComputedStyle(probe); return [name, Object.fromEntries(Object.keys(styles).map(property => [property, computed.getPropertyValue(property)]))]; }
		finally { probe.remove(); }
	})), declarations);
}
async function assertSignature(page: Page, theme: ResolvedTheme) {
	const css = (id: string) => theme.tokens[id].cssValue;
	const expected = await canonicalSignatures(page, {
		heading: { 'font-family': css('font.heading-large.family'), 'font-size': css('font.heading-large.size'), 'font-weight': css('font.heading-large.weight'), 'line-height': css('font.heading-large.line-height'), 'font-style': css('font.heading-large.style'), 'letter-spacing': css('font.heading-large.tracking') },
		button: { 'font-family': css('font.ui.family'), 'font-weight': css('font.label-strong.weight'), 'border-radius': effective(theme, ['component.button.radius', 'component.control.radius'], 'radius.control').cssValue },
		input: { 'font-family': css('font.input.family'), 'font-size': css('font.input.size'), 'border-radius': effective(theme, ['component.input.radius', 'component.control.radius'], 'radius.control').cssValue },
		card: { 'background-color': effective(theme, ['component.card.background', 'component.surface.background'], 'color.surface').cssValue, 'border-radius': effective(theme, ['component.surface.radius'], 'radius.container').cssValue },
		page: { 'background-color': css('color.canvas') },
		wordmark: { color: css('color.action-text') },
		share: { color: css('color.action-text') },
		chatIcon: { color: css('color.action-text') },
	});
	const measured = await signature(page);
	if (await page.locator('html').getAttribute('data-en-theme') === 'radix-inspired') {
		const material = await page.locator('#showcase-project > en-card > [part=base]').evaluate(element => {
			const properties = ['background', 'background-color', 'background-image', 'backdrop-filter', '-webkit-backdrop-filter', '--en-card-background', '--en-surface-background', '--en-color-surface'];
			const read = (node: Element) => {
				const css = getComputedStyle(node);
				return {tag: node.tagName, theme: node.getAttribute('data-en-theme'), appearance: node.getAttribute('data-en-appearance'), values: Object.fromEntries(properties.map(name => [name, css.getPropertyValue(name)]))};
			};
			const host = (element.getRootNode() as ShadowRoot).host;
			return {
				surface: read(element), host: read(host), boundary: read(document.documentElement),
				media: {reducedTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, forcedColors: matchMedia('(forced-colors: active)').matches},
				supports: {blur: CSS.supports('backdrop-filter', 'blur(1px)'), webkitBlur: CSS.supports('-webkit-backdrop-filter', 'blur(1px)'), opaqueFallback: CSS.supports('not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))')},
			};
		});
		const fallback = material.media.reducedTransparency || material.supports.opaqueFallback;
		const foreground = effective(theme, ['component.card.background', 'component.surface.background'], 'color.surface').cssValue;
		const blur = fallback ? 'none' : `blur(clamp(0px, ${css('theme.radix.anatomy.d64')}, 64px))`;
		const materialExpected = await canonical(page, {
			'background-color': fallback ? css('color.surface') : foreground,
			// The fallback shorthand has a color-only final layer whose image is none.
			'background-image': fallback ? `linear-gradient(${foreground}, ${foreground}), none` : 'none',
			'backdrop-filter': blur, '-webkit-backdrop-filter': blur,
		});
		await test.info().attach(`radix-material-${theme.mode}-diagnostic`, {contentType: 'application/json', body: JSON.stringify({expected: expected.card, measured: measured.card, material, fallback, materialExpected}, null, 2)});
		expect(Object.fromEntries(Object.keys(materialExpected).map(name => [name, material.surface.values[name]])), 'Radix material retains exact alpha paint or the conditionally required opaque backing and foreground layer').toEqual(materialExpected);
		if (fallback) expected.card['background-color'] = materialExpected['background-color'];
	}
	expect(measured, 'Rendered typography, field/action shape and surfaces follow the resolved authored branch').toEqual(expected);
	if (await page.locator('html').getAttribute('data-en-theme') === 'spectrum-inspired') {
		const measured = await page.evaluate(() => {
			const style = (host: string, part: string) => getComputedStyle(document.querySelector(host)!.shadowRoot!.querySelector(`[part~="${part}"]`)!);
			const badge = style('#showcase-team en-badge', 'base');
			const reset = style('#showcase-project en-button[data-en-action="reset"]', 'control');
			return {badge:[badge.fontSize,badge.lineHeight,badge.fontWeight,badge.borderRadius,badge.backgroundColor,badge.color,badge.height],reset:reset.backgroundColor,progress:style('#showcase-readiness en-progress-bar','track').height};
		});
		expect(measured.badge.slice(0,4)).toEqual(['12px','16px','500','7px']);
		const colors = await canonical(page, {'background-color':css('theme.badge.neutral-background'),color:css('theme.badge.neutral-color')});
		expect(measured.badge.slice(4,6)).toEqual([colors['background-color'],colors.color]);
		expect(measured.badge[6]).toBe('24px'); expect(measured.progress).toBe('6px');
		expect(measured.reset).toBe((await canonical(page, {'background-color':css('theme.button.secondary.rest-background')}))['background-color']);
	}
	if (await page.locator('html').getAttribute('data-en-theme') === 'web-awesome-inspired') {
		const measured = await page.evaluate(() => {
			const part = (host: string, selector: string) => document.querySelector(host)!.shadowRoot!.querySelector(selector)!;
			const style = (host: string, selector: string) => getComputedStyle(part(host, selector));
			const badge = style('#showcase-actions en-badge[variant="accent"]', '[part="base"]');
			return {
				choiceWeight: style('#showcase-actions en-switch', '[part="label-text"]').fontWeight,
				checkboxWeight: style('#showcase-readiness en-checkbox', '[part="label-text"]').fontWeight,
				badge: [badge.fontSize, badge.lineHeight, badge.fontWeight, badge.borderRadius, badge.backgroundColor, badge.color],
				progress: part('#showcase-readiness en-progress-bar', '[part="track"]').getBoundingClientRect().height,
				avatar: part('#showcase-team en-avatar', '[part="base"]').getBoundingClientRect().width,
				tabLineHeight: getComputedStyle(document.querySelector('#showcase-brief en-tab')!).lineHeight,
			};
		});
		expect(measured.choiceWeight).toBe('400');
		expect(measured.checkboxWeight).toBe('400');
		expect(measured.badge.slice(0,4)).toEqual(['12px','12px','500','3px']);
		const colors = await canonical(page, {'background-color':css('color.action'), color:css('color.on-action')});
		expect(measured.badge.slice(4)).toEqual([colors['background-color'], colors.color]);
		expect(measured.progress).toBe(16); expect(measured.avatar).toBe(48);
		expect(measured.tabLineHeight).toBe('25.6px');
		const nested = await page.evaluate(async () => {
			const boundary = document.createElement('div'); boundary.dataset.enTheme = 'nested-isolation-probe';
			const badge = document.createElement('en-badge') as HTMLElement & { updateComplete: Promise<unknown> };
			badge.setAttribute('variant', 'accent'); badge.textContent = 'Nested theme'; boundary.append(badge); document.body.append(boundary);
			try { await badge.updateComplete; const style=getComputedStyle(badge.shadowRoot!.querySelector('[part="base"]')!); return {size:style.fontSize, background:style.backgroundColor}; }
			finally { boundary.remove(); }
		});
		expect(nested.size, 'Outer badge typography must not cross an explicit descendant theme boundary').toBe('14px');
		expect(nested.background, 'Outer accent companion must not cross the descendant boundary').not.toBe(measured.badge[4]);
		const details = await page.evaluate(() => {
			const host=document.querySelector('#showcase-activity en-segmented-control')!;
			const parts=host.shadowRoot!;
			const options=parts.querySelector('[part="options"]')!;
			const first=parts.querySelector('[part~="option-start"]')!, last=parts.querySelector('[part~="option-end"]')!;
			const firstRect=first.getBoundingClientRect(), lastRect=last.getBoundingClientRect();
			const reset=document.querySelector('#showcase-activity en-button[data-en-action="reset"]')!;
			const resetStyle=getComputedStyle(reset.shadowRoot!.querySelector('[part="control"]')!);
			const action=document.querySelector('#showcase-team en-button[data-en-action="standalone"]')!;
			const actionRect=action.getBoundingClientRect(), surface=action.shadowRoot!.querySelector('[part="control"]')!.getBoundingClientRect();
			return {groupWidth:options.getBoundingClientRect().width,hostWidth:host.getBoundingClientRect().width,gap:lastRect.left-firstRect.right,firstRadius:getComputedStyle(first).borderTopLeftRadius,lastRadius:getComputedStyle(last).borderTopRightRadius,selectedBorder:getComputedStyle(parts.querySelector('[part~="option-selected"]')!).borderTopColor,resetBorder:resetStyle.borderTopColor,resetWidth:parseFloat(resetStyle.borderTopWidth),actionWidth:actionRect.width,surfaceWidth:surface.width,resetHostWidth:reset.getBoundingClientRect().width};
		});
		expect(details.groupWidth).toBeLessThan(details.hostWidth);
		expect(details.gap).toBeCloseTo(-1,0);
		expect([details.firstRadius,details.lastRadius]).toEqual(['6px','6px']);
		const detailColors=await canonical(page, {color:css('color.action'),'border-color':css('color.boundary')});
		expect(details.selectedBorder).toBe(detailColors.color); expect(details.resetBorder).toBe(detailColors['border-color']); expect(details.resetWidth).toBe(1);
		expect(details.surfaceWidth).toBeCloseTo(details.actionWidth,0); expect(details.resetHostWidth).toBeLessThan(details.actionWidth/2);
		const link=page.locator('#showcase-activity a.en-link');
		await page.mouse.move(0,0);
		expect(await link.evaluate(el=>getComputedStyle(el).textDecorationStyle)).toBe('dotted');
		expect(await link.evaluate(el=>getComputedStyle(el).color)).toBe((await canonical(page,{color:css('color.link')})).color);
		await link.hover(); expect(await link.evaluate(el=>getComputedStyle(el).textDecorationStyle)).toBe('solid'); await page.mouse.move(0,0);
	}

	return expected;
}

/** Measure opaque text against its actual composed ancestor surfaces, across shadow hosts. */
async function contrast(locator: Locator) {
	return locator.evaluate(element => {
		type Color = [number, number, number, number];
		const parse = (text: string): Color => {
			const numbers = text.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
			if (/^rgba?\(/.test(text)) return [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1];
			if (/^color\(srgb /.test(text)) return [numbers[0] * 255, numbers[1] * 255, numbers[2] * 255, numbers[3] ?? 1];
			const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
			const context = canvas.getContext('2d')!; context.fillStyle = text; context.fillRect(0, 0, 1, 1);
			const values = context.getImageData(0, 0, 1, 1).data;
			return [values[0], values[1], values[2], values[3] / 255];
		};
		const over = (top: Color, bottom: Color): Color => [0, 1, 2].map(index => top[index] * top[3] + bottom[index] * (1 - top[3])).concat(1) as Color;
		const layers: { background: string; image: string }[] = [];
		let current: Element | null = element;
		while (current) {
			const style = getComputedStyle(current); layers.push({ background: style.backgroundColor, image: style.backgroundImage });
			current = current.parentElement ?? (current.getRootNode() instanceof ShadowRoot ? (current.getRootNode() as ShadowRoot).host : null);
		}
		let background: Color = [255, 255, 255, 1];
		for (const layer of [...layers].reverse()) background = over(parse(layer.background), background);
		const text = getComputedStyle(element).color, foreground = over(parse(text), background);
		const luminance = (color: Color) => color.slice(0, 3).map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
		const first = luminance(foreground), second = luminance(background);
		return { ratio: (Math.max(first, second) + .05) / (Math.min(first, second) + .05), text, background, layers };
	});
}
async function readable(locator: Locator, label: string) {
	const result = await contrast(locator);
	expect(result.layers.every(layer => layer.image === 'none'), `${label}: this targeted contrast check has no unmeasured background image`).toBe(true);
	expect(result.ratio, `${label}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(4.45);
	return result;
}
async function keyboardFocus(page: Page, locator: Locator) {
	await page.keyboard.press('Tab'); await locator.focus();
	await expect(locator).toBeFocused();
	const focus = await locator.evaluate(element => ({ visible: element.matches(':focus-visible'), width: parseFloat(getComputedStyle(element).outlineWidth), style: getComputedStyle(element).outlineStyle }));
	expect(focus.visible).toBe(true); expect(focus.width).toBeGreaterThan(0); expect(focus.style).not.toBe('none');
	return focus;
}

for (const id of themes) {
	test(`${id}: authored pair renders, responds and survives both appearance round trips`, async ({ page }, info) => {
		await ready(page); await choose(page, id);
		await field(page).fill(`Retained ${id} draft`);
		const originalField = await field(page).elementHandle();
		const definitions = JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json', import.meta.url), 'utf8')) as Definition[];
		const definition = definitions.find(definition => definition.id === id)!;
		expect(definition, 'Every visible theme has a canonical recipe').toBeTruthy();
		if (id === 'fluent-inspired') {
			expect(definition.reference?.url, 'Fluent now names the website as its primary source').toBe('https://fluent2.microsoft.design/');
			expect(definition.label).toContain('Fluent 2');
			const selectedLabel = await page.locator('#showcase-theme').getByRole('combobox').evaluate((element: HTMLSelectElement) => element.selectedOptions[0]?.label);
			expect(selectedLabel, 'The visible selector uses the refreshed provenance label').toBe(definition.label);
		}
		if (id === 'radix-inspired') {
			expect(definition.reference?.url, 'Radix names the Themes playground as its primary source').toBe('https://www.radix-ui.com/themes/playground');
			expect(definition.reference?.homepage, 'Radix preserves the official site provenance').toBe('https://www.radix-ui.com/');
			expect(definition.label).toBe('Radix Themes-inspired');
			const selectedLabel = await page.locator('#showcase-theme').getByRole('combobox').evaluate((element: HTMLSelectElement) => element.selectedOptions[0]?.label);
			expect(selectedLabel, 'The visible selector uses the canonical Radix provenance label').toBe(definition.label);
		}
		if (id === 'chakra-inspired') {
			expect(definition.reference?.url, 'Chakra names the audited component overview as its primary source').toBe('https://chakra-ui.com/docs/components/concepts/overview');
			expect(definition.label).toBe('Chakra UI-inspired');
			const selectedLabel = await page.locator('#showcase-theme').getByRole('combobox').evaluate((element: HTMLSelectElement) => element.selectedOptions[0]?.label);
			expect(selectedLabel, 'The visible selector uses the canonical Chakra provenance label').toBe(definition.label);
		}
		const receipts: unknown[] = [];
		let last: Awaited<ReturnType<typeof download>> | undefined;
		for (const mode of ['light', 'dark'] as const) {
			await appearance(page, mode);
			last = await download(page, `${id}-${mode}.json`, info);
			expect(last.value.schemaVersion).toBe(2);
			if (id === 'fluent-inspired' || id === 'radix-inspired' || id === 'chakra-inspired') {
				expect(last.value.draft.title).toBe(definition.title);
				expect(last.value.draft.rationale).toBe(definition.rationale);
			}
			for (const branch of ['light', 'dark'] as const) expect(last.value.draft.branches[branch].baseOptions).toEqual(definition.baseOptions?.[branch] ?? {});
			const pair = reopenThemeReviewPair(JSON.stringify(last.value.draft), { baseOptions: definition.baseOptions });
			expect(pair.name).toBe(id); expect(pair.theme.sourceHash).toBe(last.value.draft.pairSourceHash);
			expect(pair[mode].theme.diagnostics).toEqual([]);
			const rendered = await assertSignature(page, pair[mode].theme);
			const states = { rest: await readable(primary(page), `${id}/${mode} primary rest`), field: await readable(field(page), `${id}/${mode} field`) } as Record<string, unknown>;
			await primary(page).hover(); states.hover = await readable(primary(page), `${id}/${mode} primary hover`);
			await page.mouse.down(); states.pressed = await readable(primary(page), `${id}/${mode} primary pressed`); await page.mouse.up();
			states.focus = await keyboardFocus(page, primary(page));
			await expect(page.getByRole('button', { name: 'Approve study', exact: true })).toBeDisabled();
			await expect(page.getByRole('checkbox', { name: 'Keep the headline editable', exact: true })).toBeChecked();

			await page.getByRole('button', { name: 'Create', exact: true }).click();
			const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
			const shadow = (await canonical(page, { 'box-shadow': pair[mode].theme.tokens['shadow.dialog'].cssValue }))['box-shadow'];
			const actualShadow = await dialog.evaluate(element => getComputedStyle(element).boxShadow);
			expect(actualShadow, 'Dialog keeps the complete authored elevation alongside its focus halo').toContain(shadow);
			await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
			await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeFocused();
			await page.getByRole('button', { name: 'Actions', exact: true }).click();
			const item = page.locator('#showcase-actions en-menu').getByRole('menuitem').first();
			await expect(item).toBeVisible(); states.option = await readable(item, `${id}/${mode} menu option`);
			await page.keyboard.press('Escape');
			await page.mouse.move(0, 0); await page.evaluate(() => window.scrollTo(0, 0));
			await page.screenshot({ path: info.outputPath(`${id}-${mode}-showcase.png`), fullPage: true });

			await page.getByRole('button', { name: 'Reset theme', exact: true }).click();
			await page.locator('#showcase-theme-file').setInputFiles(last.path);
			await expect(page.locator('#showcase-theme')).toHaveJSProperty('value', 'imported');
			await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
			await expect(field(page)).toHaveValue(`Retained ${id} draft`);
			expect(await field(page).evaluate((element, initial) => element === initial, originalField)).toBe(true);
			await appearance(page, mode); await assertSignature(page, pair[mode].theme);
			const reopened = await download(page, `${id}-${mode}-reopened.json`, info);
			expect(reopened.value.draft).toEqual(last.value.draft);
			receipts.push({ mode, sourceHash: pair[mode].theme.sourceHash, pairSourceHash: pair.theme.sourceHash, rendered, dialogShadow: actualShadow, states });
		}
		await page.goto('/theme-review');
		await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
		await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles(last!.path);
		await expect(page.getByRole('combobox', { name: 'Editing appearance', exact: true })).toHaveValue(last!.value.activeAppearance);
		await expect(page.getByRole('textbox', { name: 'Candidate title', exact: true })).toHaveValue(last!.value.draft.title);
		const reviewed = await download(page, `${id}-theme-review-reopened.json`, info, true);
		expect(reviewed.value.draft).toEqual(last!.value.draft);
		if (id === 'vellum') {
			// Exercise a real managed edit on a rich authored baseline, then prove
			// Undo preserves its custom font and layered-shadow source exactly.
			await page.getByRole('searchbox', { name: 'Find a token', exact: true }).fill('focus.width');
			await page.getByRole('combobox', { name: 'Token', exact: true }).selectOption('focus.width');
			const editor = page.getByRole('form', { name: 'Token editor', exact: true });
			await editor.getByRole('combobox', { name: 'Value source', exact: true }).selectOption('literal');
			const mode = reviewed.value.activeAppearance as Appearance;
			const nextWidth = reviewed.value.resolvedTokens[mode]['focus.width'].value.value === 4 ? 3 : 4;
			await editor.getByRole('combobox', { name: 'Managed value', exact: true }).selectOption({ label: `${nextWidth}px` });
			await editor.getByRole('button', { name: 'Apply pin', exact: true }).click();
			await expect(page.locator('.review-status')).toContainText('focus.width pinned');
			const edited = await download(page, `${id}-managed-edit.json`, info, true);
			expect(edited.value.resolvedTokens[mode]['focus.width'].value).toEqual({ value: nextWidth, unit: 'px' });
			for (const branch of ['light', 'dark'] as const) expect(edited.value.draft.branches[branch].baseOptions).toEqual(definition.baseOptions?.[branch] ?? {});
			await page.getByRole('button', { name: 'Undo', exact: true }).click();
			const undone = await download(page, `${id}-managed-edit-undone.json`, info, true);
			expect(undone.value.draft).toEqual(reviewed.value.draft);
		}
		await info.attach(`${id}-computed-signatures`, { body: JSON.stringify(receipts, null, 2), contentType: 'application/json' });
	});
}

for (const { id, label, radius } of [
	{ id: 'web-awesome-inspired', label: 'Web Awesome-inspired', radius: '0.375rem' },
	{ id: 'chakra-inspired', label: 'Chakra UI-inspired', radius: '0.25rem' },
]) test(`${id}: shared selectors and narrow RTL layouts retain the paired theme`, async ({ page }, info) => {
	const presetRequests: string[] = [];
	const capturePreset = (request: { url(): string }) => { if (/\/(?:showcase-catalogue|companion)-/.test(request.url())) presetRequests.push(request.url()); };
	page.on('request', capturePreset);
	await page.goto('/workflows/settings');
	await page.locator('.theme-controls').getByRole('radio', { name: 'Dark', exact: true }).press('Space');
	await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'dark');
	expect(presetRequests, 'Ordinary workflows do not fetch the preset catalogue or companion compiler').toEqual([]);
	page.off('request', capturePreset);
	await ready(page, id);
	await expect(page.locator('#showcase-theme').getByRole('combobox').locator(`option[value="${id}"]`)).toHaveText(label);
	await page.setViewportSize({ width: 390, height: 844 });
	for (const mode of ['light', 'dark'] as const) {
		await appearance(page, mode);
		await page.locator('html').evaluate(element => element.setAttribute('dir', 'rtl'));
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
		await expect(field(page)).toBeVisible();
		await page.screenshot({ path: info.outputPath(`${id}-${mode}-mobile-rtl.png`), fullPage: true });
	}
	await page.goto('/api-examples/tree-view');
	await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(id);
	await expect(page.getByRole('status', { name: 'Theme result' })).toContainText(label);
	await expect.poll(() => page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--en-radius-control').trim())).toBe(radius);
	await expect(page.locator('html')).toHaveAttribute('data-en-theme', id);
	expect(await page.locator('style[data-example-theme]').textContent()).toContain('--en-button-rest-background');
	await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption('default');
	await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
	await expect(page.locator('html')).not.toHaveAttribute('data-en-theme', id);
	await page.goto(`/component-patterns?theme=${id}&appearance=dark`);
	await expect(page.locator('html')).toHaveAttribute('data-en-theme', id);
	await expect(page.locator('#theme')).toHaveValue(id);
});

test('chakra-inspired: document controller follows body recipe styles without replacing native content', async ({ page }) => {
	await page.goto('/api-examples/content-recipes');
	const theme = page.getByRole('combobox', { name: 'Inspired theme', exact: true });
	const appearanceControl = page.getByRole('combobox', { name: 'Appearance', exact: true });
	const density = page.getByRole('combobox', { name: 'Density', exact: true });
	await expect(theme).toBeEnabled();
	await appearanceControl.selectOption('light');
	await expect(page.locator('html')).toHaveAttribute('data-en-appearance', 'light');
	const recipe = page.locator('body link[rel="stylesheet"][href="/styles/content.css"]');
	await expect(recipe).toHaveCount(1);
	await expect.poll(() => recipe.evaluate((element: HTMLLinkElement) => Boolean(element.sheet))).toBe(true);
	const radio = page.getByRole('radio', { name: 'Campaign brief', exact: true });
	await radio.check();
	const card = page.locator('.en-card.en-file-card').filter({ has: radio });
	const app = page.locator('en-api-example-app');
	const originals = { app: await app.elementHandle(), card: await card.elementHandle(), radio: await radio.elementHandle(), recipe: await recipe.elementHandle() };
	const geometry = () => card.evaluate(element => {
		const css = getComputedStyle(element);
		return { padding: css.paddingTop, inlinePadding: css.paddingInlineStart, gap: css.gap };
	});
	await expect.poll(async () => Number.parseFloat((await geometry()).padding)).toBeGreaterThan(0);
	const baseline = await geometry();
	expect(Number.parseFloat(baseline.gap)).toBeGreaterThan(0);
	const preserved = async () => {
		for (const key of ['app', 'card', 'radio', 'recipe'] as const) {
			const locator = { app, card, radio, recipe }[key];
			expect(await locator.evaluate((element, original) => element === original, originals[key]), `${key} retains its original node`).toBe(true);
		}
		await expect(radio).toBeChecked();
	};
	const candidate = page.locator('style[data-example-theme]');
	const candidateWins = async () => {
		await expect(candidate).toHaveCount(1);
		await expect.poll(() => geometry()).toEqual({ padding: '0px', inlinePadding: '0px', gap: '0px' });
		expect(await candidate.evaluate(element => {
			const recipe = document.querySelector('body link[rel="stylesheet"][href="/styles/content.css"]')!;
			return element.parentElement === document.body && document.body.lastElementChild === element
				&& Boolean(recipe.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
		}), 'The real document controller places its owned stylesheet after the preserved body recipe link').toBe(true);
		await preserved();
	};
	await theme.selectOption('chakra-inspired');
	await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('Chakra UI-inspired');
	await expect(page.locator('html')).toHaveAttribute('data-en-theme', 'chakra-inspired');
	await candidateWins();
	for (const [mode, value] of [['dark', 'compact'], ['light', 'comfortable']] as const) {
		await appearanceControl.selectOption(mode);
		await expect(page.locator('html')).toHaveAttribute('data-en-appearance', mode);
		const previousCSS = await candidate.textContent();
		await density.selectOption(value);
		await expect(page.locator('html')).toHaveAttribute('data-example-density', value);
		await expect.poll(async () => (await candidate.textContent()) !== previousCSS).toBe(true);
		await candidateWins();
	}
	await theme.selectOption('default');
	await expect(candidate).toHaveCount(0);
	await expect(page.locator('html')).not.toHaveAttribute('data-en-theme', 'chakra-inspired');
	await expect.poll(() => geometry()).toEqual(baseline);
	await preserved();
});

test('web-awesome-inspired: trusted companions follow paired themes into workflow previews', async ({ page }, info) => {
	// Include an existing preset so the shared preview fix cannot be mistaken
	// for a Web Awesome-only special case.
	for (const id of ['web-awesome-inspired', 'radix-inspired']) {
		await ready(page, id);
		const exported = await download(page, `${id}-preview-source.json`, info);
		const definitions = JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json', import.meta.url), 'utf8')) as Definition[];
		const pair = reopenThemeReviewPair(JSON.stringify(exported.value.draft), { baseOptions: definitions.find(item => item.id === id)!.baseOptions });
		await page.goto('/theme-review');
		await expect(page.getByRole('button', { name: 'Export candidate', exact: true })).toBeEnabled();
		await page.getByLabel('Reopen candidate', { exact: true }).setInputFiles(exported.path);
		await page.getByRole('combobox', { name: 'Preview page', exact: true }).selectOption('settings');
		await page.getByRole('button', { name: 'Load previews', exact: true }).click();
		const candidate = page.frameLocator('iframe[title="Candidate preview"]');
		const baseline = page.frameLocator('iframe[title="Baseline preview"]');
		for (const mode of ['light', 'dark'] as const) {
			await page.getByRole('combobox', { name: 'Preview appearance', exact: true }).selectOption(mode);
			await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
			await expect(candidate.locator('html')).toHaveAttribute('data-en-theme', id);
			await expect(candidate.locator('html')).toHaveAttribute('data-en-appearance', mode);
			const control = candidate.locator('en-button[variant="secondary"] button:visible').first();
			await expect(control).toBeVisible();
			const expected = (await canonical(page, { 'background-color': pair[mode].theme.tokens['theme.button.secondary.rest-background'].cssValue }))['background-color'];
			await expect.poll(() => control.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(expected);
			await expect(baseline.locator('html')).toHaveAttribute('data-en-theme', 'review-baseline');
		}
	}
});

test('fluent-inspired: website typography and tiles reflow in RTL and at 200% text', async ({ page }, info) => {
	await ready(page); await choose(page, 'fluent-inspired');
	await field(page).fill('Retained Fluent 2 website draft');
	const originalField = await field(page).elementHandle();
	const heading = page.locator('.showcase-heading h1');
	const receipts: unknown[] = [];
	const measure = () => page.evaluate(() => {
		const heading = document.querySelector<HTMLElement>('.showcase-heading h1')!;
		const poster = document.querySelector<HTMLElement>('.showcase-color-preview strong')!;
		const words: { text: string; lines: number }[] = [];
		const walker = document.createTreeWalker(poster, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
				const range = document.createRange(); range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
				const tops: number[] = [];
				for (const rect of range.getClientRects()) if (rect.width > 0 && !tops.some(top => Math.abs(top - rect.top) < 1)) tops.push(rect.top);
				words.push({ text: match[0], lines: tops.length });
			}
		}
		return {
			viewport: innerWidth, direction: document.documentElement.dir,
			poster: { size: parseFloat(getComputedStyle(poster).fontSize), lineHeight: parseFloat(getComputedStyle(poster).lineHeight), width: poster.clientWidth, scrollWidth: poster.scrollWidth, words },
			overflow: document.documentElement.scrollWidth - innerWidth,
			heading: { size: parseFloat(getComputedStyle(heading).fontSize), width: heading.clientWidth, scrollWidth: heading.scrollWidth },
			cards: [...document.querySelectorAll('.showcase-card')].map(element => {
				const rect = element.getBoundingClientRect();
				return { id: element.id, x: rect.x, right: rect.right, width: rect.width };
			}),
		};
	});
	const reflows = async (label: string) => {
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), label).toBeLessThanOrEqual(1);
		const sample = await measure();
		expect(sample.heading.scrollWidth, `${label}: heading content fits`).toBeLessThanOrEqual(sample.heading.width + 1);
		expect(sample.poster.scrollWidth, `${label}: poster text stays in its artwork tile`).toBeLessThanOrEqual(sample.poster.width + 1);
		for (const card of sample.cards) {
			expect(card.x, `${label}: ${card.id} start edge`).toBeGreaterThanOrEqual(-1);
			expect(card.right, `${label}: ${card.id} end edge`).toBeLessThanOrEqual(sample.viewport + 1);
		}
		const bounds = await field(page).boundingBox();
		expect(bounds!.x).toBeGreaterThanOrEqual(-1); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(sample.viewport + 1);
		receipts.push({ label, ...sample });
	};
	for (const mode of ['light', 'dark'] as const) {
		await page.locator('html').evaluate(element => { element.style.fontSize = ''; });
		await appearance(page, mode);
		const baseSize = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
		expect(baseSize, 'Fluent 2 keeps the website display heading before text enlargement').toBe(68);
		await page.setViewportSize({ width: 1440, height: 1000 });
		const desktop = await measure();
		expect(desktop.poster.size, 'The small poster uses the source medium heading size').toBe(32);
		expect(desktop.poster.lineHeight, 'The small poster keeps the source medium leading').toBe(40);
		expect(desktop.poster.words.map(word => word.text)).toEqual(['Color', 'outside', 'the', 'expected.']);
		for (const word of desktop.poster.words) expect(word.lines, `${mode}: the ordinary desktop poster keeps ${word.text} intact`).toBe(1);
		await reflows(`Fluent 2/${mode}/desktop-poster`);
		for (const direction of ['ltr', 'rtl']) {
			await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption(direction);
			for (const width of [390, 320]) {
				await page.setViewportSize({ width, height: 844 });
				await reflows(`Fluent 2/${mode}/${direction}/${width}`);
			}
		}
		await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
		expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize)), 'The test genuinely enlarges the authored display type').toBeCloseTo(baseSize * 2, 1);
		const enlargedPoster = await measure();
		expect(enlargedPoster.poster.size, 'The poster also respects 200% text instead of shrinking to container pixels').toBeCloseTo(desktop.poster.size * 2, 1);
		for (const width of [390, 320]) {
			await page.setViewportSize({ width, height: 844 });
			await reflows(`Fluent 2/${mode}/rtl/${width}/200%`);
		}
		await expect(field(page)).toHaveValue('Retained Fluent 2 website draft');
		expect(await field(page).evaluate((element, initial) => element === initial, originalField)).toBe(true);
		await keyboardFocus(page, field(page));
		await page.locator('#showcase-project').screenshot({ path: info.outputPath(`fluent2-${mode}-320-rtl-large-text-project.png`) });
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.screenshot({ path: info.outputPath(`fluent2-${mode}-320-rtl-large-text-heading.png`) });
	}
	await info.attach('fluent2-reflow', { body: JSON.stringify(receipts, null, 2), contentType: 'application/json' });
});

test('fluent-inspired: reduced motion preserves field focus and dialog dismissal', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'none' });
	await ready(page, 'fluent-inspired');
	for (const mode of ['light', 'dark'] as const) {
		await appearance(page, mode);
		await keyboardFocus(page, field(page));
		await expect(field(page)).toHaveCSS('transition-duration', '0s');
		await keyboardFocus(page, primary(page));
		await expect(primary(page)).toHaveCSS('transition-duration', '0s');
		const trigger = page.getByRole('button', { name: 'Create', exact: true });
		await trigger.click();
		const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
		await expect(dialog).toHaveCSS('transition-duration', '0s'); await expect(dialog).toHaveCSS('animation-name', 'none');
		await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
	}
});

test('radix-inspired: both appearances reflow in LTR, RTL and at 200% text while retaining editable content', async ({ page }, info) => {
	await ready(page); await choose(page, 'radix-inspired');
	const draft = 'Retained Radix Themes draft';
	await field(page).fill(draft);
	const originalField = await field(page).elementHandle();
	const heading = page.locator('.showcase-heading h1');
	const receipts: unknown[] = [];
	for (const mode of ['light', 'dark'] as const) {
		await page.locator('html').evaluate(element => { element.style.fontSize = ''; });
		await appearance(page, mode);
		const baseSize = await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
		for (const textScale of [100, 200]) {
			await page.locator('html').evaluate((element, scale) => { element.style.fontSize = scale === 100 ? '' : '200%'; }, textScale);
			expect(await heading.evaluate(element => parseFloat(getComputedStyle(element).fontSize)), 'The authored heading responds to actual text enlargement').toBeCloseTo(baseSize * textScale / 100, 1);
			for (const direction of ['ltr', 'rtl']) {
				await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption(direction);
				for (const width of [390, 320]) {
					await page.setViewportSize({ width, height: 844 });
					const label = `Radix/${mode}/${direction}/${width}/${textScale}%`;
					await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${label}: the page reflows`).toBeLessThanOrEqual(1);
					const measurement = await page.evaluate(() => {
						const title = document.querySelector<HTMLElement>('.showcase-heading h1')!;
						return {
							viewport: innerWidth, direction: document.documentElement.dir,
							heading: { width: title.clientWidth, scrollWidth: title.scrollWidth },
							cards: [...document.querySelectorAll('.showcase-card')].map(element => {
								const rect = element.getBoundingClientRect();
								return { id: element.id, start: rect.x, end: rect.right };
							}),
						};
					});
					expect(measurement.direction, `${label}: the requested direction is applied`).toBe(direction);
					expect(measurement.heading.scrollWidth, `${label}: heading content fits`).toBeLessThanOrEqual(measurement.heading.width + 1);
					for (const card of measurement.cards) {
						expect(card.start, `${label}: ${card.id} start edge`).toBeGreaterThanOrEqual(-1);
						expect(card.end, `${label}: ${card.id} end edge`).toBeLessThanOrEqual(width + 1);
					}
					const bounds = await field(page).boundingBox();
					expect(bounds, `${label}: the editable field remains rendered`).not.toBeNull();
					expect(bounds!.x, `${label}: field start edge`).toBeGreaterThanOrEqual(-1);
					expect(bounds!.x + bounds!.width, `${label}: field end edge`).toBeLessThanOrEqual(width + 1);
					await expect(field(page)).toHaveValue(draft);
					expect(await field(page).evaluate((element, initial) => element === initial, originalField), `${label}: resizing preserves the field node`).toBe(true);
					const focus = await keyboardFocus(page, field(page));
					receipts.push({ label, ...measurement, field: bounds, focus });
				}
			}
		}
		await page.locator('#showcase-project').screenshot({ path: info.outputPath(`radix-${mode}-320-rtl-large-text-project.png`) });
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.screenshot({ path: info.outputPath(`radix-${mode}-320-rtl-large-text-heading.png`) });
	}
	await info.attach('radix-reflow', { body: JSON.stringify(receipts, null, 2), contentType: 'application/json' });
});

test('radix-inspired: reduced motion independently preserves field focus and dialog dismissal', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'none' });
	await ready(page, 'radix-inspired');
	expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
	expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(false);
	for (const mode of ['light', 'dark'] as const) {
		await appearance(page, mode);
		await keyboardFocus(page, field(page));
		await expect(field(page)).toHaveCSS('transition-duration', '0s');
		await keyboardFocus(page, primary(page));
		await expect(primary(page)).toHaveCSS('transition-duration', '0s');
		const trigger = page.getByRole('button', { name: 'Create', exact: true });
		await trigger.click();
		const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
		await expect(dialog).toHaveCSS('transition-duration', '0s'); await expect(dialog).toHaveCSS('animation-name', 'none');
		await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
	}
});

test('radix-inspired: forced colors independently preserve content and visible focus in both appearances', async ({ page, browserName }) => {
	test.skip(Boolean(emulationLimits.forcedColors[browserName]), emulationLimits.forcedColors[browserName]);
	await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' });
	await ready(page, 'radix-inspired');
	expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
	expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
	await field(page).fill('Retained forced-colors Radix draft');
	for (const mode of ['light', 'dark'] as const) {
		await appearance(page, mode);
		await expect(field(page)).toHaveValue('Retained forced-colors Radix draft');
		await keyboardFocus(page, field(page));
		await keyboardFocus(page, primary(page));
		await expect(primary(page)).toHaveCSS('box-shadow', 'none');
		const trigger = page.getByRole('button', { name: 'Create', exact: true });
		await trigger.click();
		const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
		await expect(dialog).toHaveCSS('box-shadow', 'none');
		await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
		await expect(trigger).toBeFocused();
	}
});

test('three originals retain mobile RTL reflow, enlarged text and editable content', async ({ page }, info) => {
	await ready(page); await field(page).fill('Preserved during responsive review');
	for (const id of originals) {
		await page.locator('html').evaluate(element => { element.style.fontSize = ''; });
		await choose(page, id);
		for (const mode of ['light', 'dark'] as const) {
			await appearance(page, mode);
			await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption(mode === 'dark' ? 'rtl' : 'ltr');
			for (const width of [390, 320]) {
				await page.setViewportSize({ width, height: 844 });
				await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${id}/${mode}/${width}: page reflows`).toBeLessThanOrEqual(1);
				const bounds = await field(page).boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(-1); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
			}
		}
		await page.setViewportSize({ width: 390, height: 844 });
		await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
		await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${id}: 200% text reflows`).toBeLessThanOrEqual(1);
		await expect(field(page)).toHaveValue('Preserved during responsive review');
		await keyboardFocus(page, field(page));
		// This deliberately long 200% text fixture can exceed Firefox's 32767px
		// screenshot ceiling. Reflow is measured for the whole document above;
		// capture the editable card and top viewport as bounded review artifacts.
		await page.locator('#showcase-project').screenshot({ path: info.outputPath(`${id}-mobile-rtl-large-text.png`) });
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.screenshot({ path: info.outputPath(`${id}-mobile-rtl-large-text-header.png`) });
	}
});

test('three originals honor reduced motion independently of forced colors', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'none' }); await ready(page, 'kinetic');
	for (const id of originals) {
		await choose(page, id); await appearance(page, 'dark'); await keyboardFocus(page, primary(page));
		await expect(primary(page)).toHaveCSS('transition-duration', '0s');
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
		await expect(dialog).toHaveCSS('transition-duration', '0s'); await expect(dialog).toHaveCSS('animation-name', 'none');
		await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
	}
});

test('three originals preserve content and primary focus in forced colors', async ({ page, browserName }) => {
	test.skip(Boolean(emulationLimits.forcedColors[browserName]), emulationLimits.forcedColors[browserName]);
	await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' }); await ready(page);
	expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
	for (const id of originals) {
		await choose(page, id); await appearance(page, 'dark'); await keyboardFocus(page, primary(page));
		await expect(primary(page)).toHaveCSS('box-shadow', 'none'); await expect(field(page)).toBeVisible();
		await page.getByRole('button', { name: 'Create', exact: true }).click();
		const dialog = page.locator('#showcase-create-dialog dialog'); await expect(dialog).toBeVisible();
		await expect(dialog).toHaveCSS('box-shadow', 'none');
		await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
	}
});

test('web-awesome-inspired: joined controls preserve keyboard, hidden endpoints, RTL and focus; layout roles stay scoped', async ({ page }, info) => {
 await page.goto('/showcase?theme=web-awesome-inspired&appearance=light&progress-report');
 await expect(page.getByText('Applied Web Awesome-inspired · Light and dark. Demo edits are preserved.', {exact:true})).toBeVisible();
 const host=page.locator('#showcase-activity en-segmented-control');
 await host.getByRole('radio',{name:'This week',exact:true}).press('ArrowRight');
 await expect(host.getByRole('radio',{name:'Six months',exact:true})).toBeChecked();
 await expect(host.locator('[part~=option-selected]').getByRole('radio', {name:'Six months', exact:true})).toHaveCount(1);
 const focus=await host.locator('[part~=option-selected]').evaluate(el=>{const s=getComputedStyle(el);return {style:s.outlineStyle,width:parseFloat(s.outlineWidth),overflow:getComputedStyle(el.parentElement!).overflow}});
 expect(focus.style).not.toBe('none');expect(focus.width).toBeGreaterThan(0);expect(focus.overflow).toBe('visible');
 await host.evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
 await host.getByRole('radio',{name:'Six months',exact:true}).press('Home');
 await expect(host.getByRole('radio',{name:'Six months',exact:true})).toBeChecked();
 await page.getByRole('combobox',{name:'Reading direction',exact:true}).selectOption('rtl');
 const rtl=await host.locator('[part~=option-start]').evaluate(el=>{const s=getComputedStyle(el);return [s.borderTopRightRadius,s.borderTopLeftRadius]});expect(rtl).toEqual(['6px','0px']);
 await host.evaluate(el=>{el.querySelector('en-segmented-item')!.setAttribute('hidden','');const item=document.createElement('en-segmented-item');item.setAttribute('value','disabled');item.setAttribute('disabled','');item.textContent='Unavailable';el.append(item);});
 await expect(host.locator('[part~=option-start]').getByRole('radio', {name:'Six months', exact:true})).toHaveCount(1);
 await expect(host.locator('[part~=option-end]').getByRole('radio', {name:'Unavailable', exact:true})).toHaveCount(1);
 await expect(host.getByRole('radio',{name:'Unavailable',exact:true})).toBeDisabled();
 await host.getByRole('radio',{name:'Six months',exact:true}).press('End');await expect(host.getByRole('radio',{name:'Six months',exact:true})).toBeChecked();
 await host.locator('en-segmented-item[value="disabled"]').evaluate(el=>el.setAttribute('hidden',''));
 await expect(host.locator('[part~=option-start][part~=option-end]').getByRole('radio', {name:'Six months', exact:true})).toHaveCount(1);
 await page.emulateMedia({forcedColors:'active'});
 expect(await host.locator('[part~=option-selected]').evaluate(el=>getComputedStyle(el).borderTopStyle)).toBe('solid');
 await host.screenshot({path:info.outputPath('joined-rtl-forced-colors.png')});
 await page.emulateMedia({forcedColors:'none'});
 const nested=await page.evaluate(async()=>{
  const boundary=document.createElement('div');boundary.dataset.enTheme='nested-details';boundary.style.width='320px';
  const link=document.createElement('a');link.className='en-link';link.href='#nested';link.textContent='Nested';
  const action=document.createElement('en-button') as HTMLElement & {updateComplete:Promise<unknown>};action.dataset.enAction='standalone';action.textContent='Nested action';
  boundary.append(link,action);document.body.append(boundary);
  try{await action.updateComplete;return {underline:getComputedStyle(link).textDecorationStyle,width:action.getBoundingClientRect().width}}finally{boundary.remove()}
 });
 expect(nested.underline).toBe('solid');expect(nested.width).toBeLessThan(320);
});

// Batching must retain the strict locator failure signal, including role targets
// outside the showcase subtree and CSS targets with duplicate matches.
test('theme signatures reject ambiguous CSS and accessible-role targets', async ({ page }) => {
	await ready(page);
	await signature(page);
	for (const kind of ['wordmark', 'button'] as const) {
		await page.evaluate(kind => {
			const duplicate = kind === 'wordmark'
				? document.querySelector('.wordmark')!.cloneNode(true) as HTMLElement
				: document.createElement('button');
			if (kind === 'button') duplicate.textContent = 'Create project';
			duplicate.dataset.signatureNegativeControl = 'true';
			document.body.append(duplicate);
		}, kind);
		try { await expect(signature(page)).rejects.toThrow(); }
		finally { await page.locator('[data-signature-negative-control]').evaluateAll(elements => elements.forEach(element => element.remove())); }
		await signature(page);
	}
});

const apiThemeSelector = (page: Page) => page.getByRole('combobox', { name: 'Inspired theme', exact: true });
const apiThemeResult = (page: Page) => page.getByRole('status', { name: 'Theme result', exact: true });
const apiNativeSample = (page: Page) => page.locator('[data-specimen="content-recipes"]').getByRole('radio', { name: 'Campaign brief', exact: true });
async function openThemeAPI(page: Page) {
	await page.goto('/api-examples/content-recipes');
	await expect(page.locator('html')).toHaveAttribute('data-example-standalone', '');
	await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
	await expect(apiThemeSelector(page)).toHaveValue('default');
	await expect(apiThemeResult(page)).toHaveText('');
}
async function detachThemeAPI(page: Page) {
	return page.locator('en-api-example-app').evaluateHandle(node => {
		const anchor = document.createComment('api-theme-reconnect'); node.before(anchor);
		const saved = { node, anchor }; node.remove(); return saved;
	});
}
async function apiThemeHistory(page: Page) {
	return page.evaluateHandle(() => {
		const html = document.documentElement;
		const status = document.querySelector('[role="status"][aria-label="Theme result"]')!;
		const themes: (string | null)[] = [], feedback: (string | null)[] = [];
		const themeObserver = new MutationObserver(records => {
			// Old values retain an intermediate write even when several writes share
			// one observer callback and the final value already belongs to the winner.
			themes.push(...records.map(record => record.oldValue), html.getAttribute('data-en-theme'));
		});
		const statusObserver = new MutationObserver(records => {
			for (const record of records) {
				if (record.type === 'characterData') feedback.push(record.oldValue);
				else for (const node of [...record.addedNodes, ...record.removedNodes]) feedback.push(node.textContent);
			}
			feedback.push(status.textContent);
		});
		themeObserver.observe(html, { attributes: true, attributeFilter: ['data-en-theme'], attributeOldValue: true });
		statusObserver.observe(status, { childList: true, characterData: true, characterDataOldValue: true, subtree: true });
		return { themes, feedback, themeObserver, statusObserver };
	});
}

test('API example theme ownership retains current controls and native state through default and reconnect', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await openThemeAPI(page);
	const html = page.locator('html');
	const originalName = await html.getAttribute('data-en-theme');
	const originalScheme = await html.evaluate(node => ({ value: (node as HTMLElement).style.getPropertyValue('color-scheme'), priority: (node as HTMLElement).style.getPropertyPriority('color-scheme') }));
	const sample = apiNativeSample(page);
	await sample.focus(); await sample.press('Space'); await expect(sample).toBeChecked();
	const identity = await sample.elementHandle();
	let detached: Awaited<ReturnType<typeof detachThemeAPI>> | undefined;
	try {
		await apiThemeSelector(page).selectOption('web-awesome-inspired');
		await expect(apiThemeResult(page)).toHaveText('Web Awesome-inspired · Light and dark applied. Demo state is preserved.');
		await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('dark');
		await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
		await expect(html).toHaveAttribute('data-en-appearance', 'dark');
		await expect(html).toHaveAttribute('data-example-mode', 'dark');
		await expect(html).toHaveAttribute('data-example-density', 'compact');
		await expect(html).toHaveCSS('color-scheme', 'dark');
		// The preset's authored control minimum survives density changes.
		// Unoverridden row spacing still follows density; resolve its calc() through CSS.
		await expect.poll(() => html.evaluate(node => getComputedStyle(node).getPropertyValue('--en-size-control-min').trim())).toBe('2.6875rem');
		await expect.poll(() => canonical(page, { width: 'var(--en-space-rows)' })).toEqual(await canonical(page, { width: '0.5rem' }));

		await apiThemeSelector(page).selectOption('default');
		await expect(apiThemeResult(page)).toHaveText('Default theme restored. Demo state is preserved.');
		await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		expect(await html.getAttribute('data-en-theme')).toBe(originalName);
		await expect(html).toHaveAttribute('data-en-appearance', 'dark');
		await expect(html).toHaveAttribute('data-example-density', 'compact');
		await expect(html).toHaveCSS('color-scheme', 'dark');
		expect(await html.evaluate(node => ({ value: (node as HTMLElement).style.getPropertyValue('color-scheme'), priority: (node as HTMLElement).style.getPropertyPriority('color-scheme') }))).toEqual(originalScheme);

		await apiThemeSelector(page).selectOption('web-awesome-inspired');
		await expect(apiThemeResult(page)).toHaveText('Web Awesome-inspired · Light and dark applied. Demo state is preserved.');
		detached = await detachThemeAPI(page);
		await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		expect(await html.getAttribute('data-en-theme')).toBe(originalName);
		await expect(html).toHaveAttribute('data-en-appearance', 'dark');
		await expect(html).toHaveAttribute('data-example-density', 'compact');
		await detached.evaluate(saved => saved.anchor.replaceWith(saved.node));
		await expect(html).toHaveAttribute('data-en-theme', 'web-awesome-inspired');
		await expect(page.locator('style[data-example-theme]')).toHaveCount(1);
		await expect(html).toHaveCSS('color-scheme', 'dark');
		await expect.poll(() => html.evaluate(node => getComputedStyle(node).getPropertyValue('--en-size-control-min').trim())).toBe('2.6875rem');
		await expect.poll(() => canonical(page, { width: 'var(--en-space-rows)' })).toEqual(await canonical(page, { width: '0.5rem' }));
		await expect(sample).toBeChecked();
		expect(await sample.evaluate((node, original) => node === original, identity)).toBe(true);

		await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('spacious');
		await expect.poll(() => html.evaluate(node => getComputedStyle(node).getPropertyValue('--en-size-control-min').trim())).toBe('2.6875rem');
		await expect.poll(() => canonical(page, { width: 'var(--en-space-rows)' })).toEqual(await canonical(page, { width: '1rem' }));
		await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption('auto');
		await expect(html).toHaveAttribute('data-en-appearance', 'auto');
		await expect(html).toHaveCSS('color-scheme', 'light dark');
		const lightCanvas = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
		await page.emulateMedia({ colorScheme: 'dark' });
		await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).not.toBe(lightCanvas);
		await expect(sample).toBeChecked();
		expect(await sample.evaluate((node, original) => node === original, identity)).toBe(true);
	} finally { await detached?.dispose(); await identity?.dispose(); }
});

test('a delayed API theme controller cannot revive a selection superseded by Default and a newer theme', async ({ page }) => {
	await openThemeAPI(page);
	const history = await apiThemeHistory(page);
	const hold = await holdThemeController(page);
	try {
		await apiThemeSelector(page).selectOption('web-awesome-inspired');
		await hold.waitForCaptured();
		await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		await expect(apiThemeResult(page)).toHaveText('');
		await apiThemeSelector(page).selectOption('default');
		await expect(apiThemeResult(page)).toHaveText('Default theme restored. Demo state is preserved.');
		await apiThemeSelector(page).selectOption('radix-inspired');
		hold.release(); await hold.waitForReturned();
		await expect(apiThemeResult(page)).toHaveText('Radix Themes-inspired · Light and dark applied. Demo state is preserved.');
		await expect(page.locator('html')).toHaveAttribute('data-en-theme', 'radix-inspired');
		await expect(page.locator('style[data-example-theme]')).toHaveCount(1);
		const observed = await history.evaluate(({ themes, feedback }) => ({ themes, feedback }));
		expect(observed.themes, 'The canceled selection never briefly owns the document').not.toContain('web-awesome-inspired');
		expect(observed.feedback.filter(value => value?.includes('Web Awesome-inspired · Light and dark applied.')), 'The canceled selection never announces success').toEqual([]);
		expect(observed.feedback).toContain('Default theme restored. Demo state is preserved.');
	} finally {
		try { await hold.cleanup(); } finally {
			await history.evaluate(({ themeObserver, statusObserver }) => { themeObserver.disconnect(); statusObserver.disconnect(); });
			await history.dispose();
		}
	}
});

test('disconnecting during the API theme import discards the old completion and reconnects one presentation owner', async ({ page }) => {
	await openThemeAPI(page);
	const sample = apiNativeSample(page);
	await sample.focus(); await sample.press('Space'); await expect(sample).toBeChecked();
	const identity = await sample.elementHandle();
	const originalName = await page.locator('html').getAttribute('data-en-theme');
	const history = await apiThemeHistory(page);
	const hold = await holdThemeController(page);
	let detached: Awaited<ReturnType<typeof detachThemeAPI>> | undefined;
	try {
		await apiThemeSelector(page).selectOption('web-awesome-inspired');
		await hold.waitForCaptured();
		detached = await detachThemeAPI(page);
		await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		expect(await page.locator('html').getAttribute('data-en-theme')).toBe(originalName);
		await detached.evaluate(saved => saved.anchor.replaceWith(saved.node));
		hold.release(); await hold.waitForReturned();
		// Reconnection paints the retained workspace. Its observable presentation
		// drains the shared module wait; the pre-disconnect request cannot report success.
		await expect(page.locator('html')).toHaveAttribute('data-en-theme', 'web-awesome-inspired');
		await expect(page.locator('style[data-example-theme]')).toHaveCount(1);
		await expect(apiThemeResult(page)).toHaveText('');
		const feedback = await history.evaluate(({ feedback }) => feedback);
		expect(feedback.filter(value => value?.includes('applied.')), 'No obsolete completion publishes success after disconnect').toEqual([]);
		await expect(sample).toBeChecked();
		expect(await sample.evaluate((node, original) => node === original, identity)).toBe(true);
		await apiThemeSelector(page).selectOption('default');
		await expect(apiThemeResult(page)).toHaveText('Default theme restored. Demo state is preserved.');
		await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
		expect(await page.locator('html').getAttribute('data-en-theme')).toBe(originalName);
	} finally {
		try { await hold.cleanup(); } finally {
			await history.evaluate(({ themeObserver, statusObserver }) => { themeObserver.disconnect(); statusObserver.disconnect(); });
			await history.dispose(); await detached?.dispose(); await identity?.dispose();
		}
	}
});
