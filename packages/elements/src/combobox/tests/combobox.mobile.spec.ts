import { expect, test } from '@playwright/test';
import { choice, control, field, formValue, nativeFrames, openMobile, positioned, surface, trigger, typeQuery } from './mobile-helpers.js';

test.beforeEach(async ({ page, browser }, info) => {
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'coverage-limit', description: 'Mobile/touch browser emulation. Text insertion does not open an OS software keyboard; no physical iPhone, Android, VoiceOver or IME result is implied.' });
	await openMobile(page);
});

test('one trusted option tap selects and one trusted arrow tap opens or closes the popup', async ({ page }, info) => {
	await trigger(page).tap();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(control(page)).toBeFocused();
	await trigger(page).tap();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
	await typeQuery(page, 'Sunset');
	expect(await formValue(page)).toEqual({ asset: 'forest' });
	await choice(page, 'Sunset study').tap();
	await expect(field(page)).toHaveJSProperty('value', 'sunset');
	await expect(control(page)).toHaveValue('Sunset study');
	await expect(control(page)).toBeFocused();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await formValue(page)).toEqual({ asset: 'sunset' });
	await trigger(page).tap();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(control(page)).toBeFocused();
	await positioned(page);
	await trigger(page).tap();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(control(page)).toBeFocused();
	await page.getByRole('button', { name: 'Save project', exact: true }).tap();
	expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([{ asset: 'sunset' }]);
	const events = await page.evaluate(() => (window as any).mobileComboboxEvents as { type: string; trusted: boolean; role?: string; part?: string; pointerType?: string }[]);
	expect(events.some(event => event.type === 'pointerdown' && event.trusted && event.pointerType === 'touch' && event.role === 'option')).toBe(true);
	expect(events.some(event => event.type === 'click' && event.trusted && event.role === 'option')).toBe(true);
	expect(events.filter(event => event.type === 'click' && event.trusted && event.part === 'trigger')).toHaveLength(4);
	await info.attach('trusted-touch-activation', { body: JSON.stringify(events), contentType: 'application/json' });
});

test('disabled and canceled taps never commit, and later permitted taps and reset keep form behavior', async ({ page }) => {
	await typeQuery(page, 'F');
	const disabled = choice(page, 'Festival board');
	await expect(disabled).toHaveAttribute('aria-disabled', 'true');
	const box = (await disabled.boundingBox())!;
	await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
	await nativeFrames(page);
	await expect(field(page)).toHaveJSProperty('value', 'forest');
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
	await field(page).evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
	await choice(page, 'Fjord study').tap();
	await nativeFrames(page);
	await expect(field(page)).toHaveJSProperty('value', 'forest');
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(control(page)).toBeFocused();
	expect(await formValue(page)).toEqual({ asset: 'forest' });
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toHaveLength(1);
	await choice(page, 'Fjord study').tap();
	await expect(field(page)).toHaveJSProperty('value', 'fjord');
	await page.getByRole('button', { name: 'Reset project', exact: true }).tap();
	await expect(control(page)).toHaveValue('Forest canvas');
	await page.locator('#asset-fields').evaluate(element => { (element as HTMLFieldSetElement).disabled = true; });
	await expect(control(page)).toBeDisabled();
	await expect(trigger(page)).toBeDisabled();
	expect(await formValue(page)).toEqual({});
	await page.locator('#asset-fields').evaluate(element => { (element as HTMLFieldSetElement).disabled = false; });
	await trigger(page).tap();
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
});

test('default coarse-pointer geometry keeps the input, arrow and options usable within the document viewport', async ({ page }, info) => {
	await typeQuery(page, 'Sunset');
	const geometry = await field(page).evaluate(element => {
		const input = element.shadowRoot!.querySelector('input')!;
		const trigger = element.shadowRoot!.querySelector('button')!;
		const option = element.shadowRoot!.querySelector('[role="option"]')!;
		const rect = (node: Element) => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }; };
		return { coarse: matchMedia('(any-pointer: coarse)').matches, font: parseFloat(getComputedStyle(input).fontSize), input: rect(input), trigger: rect(trigger), option: rect(option) };
	});
	expect(geometry.coarse).toBe(true);
	expect(geometry.font).toBeGreaterThanOrEqual(16);
	expect(geometry.input.height).toBeGreaterThanOrEqual(44);
	expect(geometry.trigger.width).toBeGreaterThanOrEqual(44);
	expect(geometry.trigger.height).toBeGreaterThanOrEqual(44);
	expect(geometry.option.height).toBeGreaterThanOrEqual(44);
	await expect(surface(page)).toBeVisible();
	expect(await page.locator('html').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
	await info.attach('emulated-coarse-target-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
});
