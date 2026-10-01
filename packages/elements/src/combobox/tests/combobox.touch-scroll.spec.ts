import { expect, test } from '@playwright/test';
import { control, field, formValue, nativeFrames, openMobile, positioned, surface, trigger } from './mobile-helpers.js';

test('trusted Chromium touch panning and a canceled gesture do not accept an option', async ({ page, context, browser }, info) => {
	info.annotations.push({ type: 'browser-version', description: browser.version() });
	info.annotations.push({ type: 'coverage-limit', description: 'Chromium CDP touch input drives the engine gesture recognizer. This does not test physical Android hardware; WebKit has no equivalent maintained Playwright touch-swipe driver here.' });
	await openMobile(page);
	await field(page).evaluate(element => {
		(element as any).items = [{ value: 'forest', label: 'Forest canvas' }, ...Array.from({ length: 60 }, (_, index) => ({ value: `item-${index}`, label: `Review item ${index + 1}` }))];
		(element as any).value = 'forest';
	});
	await page.evaluate(() => (window as any).comboboxFixture.settle());
	await trigger(page).tap();
	await positioned(page);
	const panel = surface(page);
	const box = (await panel.boundingBox())!;
	expect(box.height).toBeGreaterThan(80);
	const session = await context.newCDPSession(page);
	try {
		const x = box.x + box.width / 2;
		const start = box.y + box.height - 24;
		const travel = Math.min(140, box.height - 48);
		await page.evaluate(() => { (window as any).mobileComboboxEvents = []; });
		await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start, id: 1 }] });
		for (let step = 1; step <= 6; step++) {
			await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start - travel * step / 6, id: 1 }] });
			await nativeFrames(page, 2);
		}
		await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(20);
		await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
		await expect(field(page)).toHaveJSProperty('value', 'forest');
		expect(await formValue(page)).toEqual({ asset: 'forest' });
		const scrolled = await page.evaluate(() => (window as any).mobileComboboxEvents as { type: string; trusted: boolean; pointerType?: string }[]);
		expect(scrolled.some(event => event.type === 'touchmove' && event.trusted)).toBe(true);
		expect(scrolled.some(event => event.type === 'pointercancel' && event.trusted && event.pointerType === 'touch')).toBe(true);
		expect(scrolled.filter(event => event.type === 'click')).toEqual([]);
		expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toEqual([]);
		await nativeFrames(page, 8);
		const currentBox = (await panel.boundingBox())!;
		await page.evaluate(() => { (window as any).mobileComboboxEvents = []; });
		await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: currentBox.x + currentBox.width / 2, y: currentBox.y + currentBox.height / 2, id: 2 }] });
		await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
		await nativeFrames(page);
		const canceled = await page.evaluate(() => (window as any).mobileComboboxEvents as { type: string; trusted: boolean }[]);
		expect(canceled.some(event => event.type === 'pointercancel' && event.trusted)).toBe(true);
		expect(canceled.filter(event => event.type === 'click')).toEqual([]);
		await expect(field(page)).toHaveJSProperty('value', 'forest');
		expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change'))).toEqual([]);
		await info.attach('trusted-chromium-touch-scroll-and-cancel', { body: JSON.stringify({ scrolled, canceled, scrollTop: await panel.evaluate(element => element.scrollTop) }), contentType: 'application/json' });
	} finally { await session.detach(); }
});
