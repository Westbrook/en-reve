import { test, expect } from '@playwright/test';

const fixture = '/packages/elements/src/table/tests/fixture.html';
test.beforeEach(async ({ page }) => {
	await page.goto(fixture);
	await page.locator('en-table').evaluate(async (host: any) => { await host.updateComplete; });
});

test('authored table retains native caption/header semantics and button Tab stops', async ({ page, browserName }) => {
	await expect(page.getByRole('table', { name: 'Available assets' })).toBeVisible();
	await expect(page.getByRole('columnheader')).toHaveCount(2);
	await expect(page.getByRole('rowheader', { name: 'Cover' })).toBeVisible();
	await expect(page.getByRole('region', { name: 'Project assets' })).toHaveAttribute('tabindex', '-1');
	await page.getByRole('button', { name: 'Before table' }).focus();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('button', { name: 'Sort by name' })).toBeFocused();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('button', { name: 'After table' })).toBeFocused();
});

test('overflow enters the Tab sequence and browser arrow keys scroll without moving button focus', async ({ page, browserName }) => {
	await page.locator('table').evaluate((table: HTMLElement) => { table.style.minWidth = '1400px'; });
	const region = page.getByRole('region', { name: 'Project assets' });
	await expect(region).toHaveAttribute('tabindex', '0');
	await page.getByRole('button', { name: 'Before table' }).focus();
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(region).toBeFocused();
	// WebKit's native scroll animation needs a held key before keyup.
	await page.keyboard.down('ArrowRight');
	await page.waitForTimeout(200);
	await page.keyboard.up('ArrowRight');
	await expect.poll(() => region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
	await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
	await expect(page.getByRole('button', { name: 'Sort by name' })).toBeFocused();
	await page.locator('table').evaluate((table: HTMLElement) => { table.style.minWidth = ''; });
	await expect(region).toHaveAttribute('tabindex', '-1');
});

test('size modes select local typography and spacing with medium default', async ({ page }) => {
	const host = page.locator('en-table');
	const measure = () => page.locator('tbody td').evaluate(el => {
		const css = getComputedStyle(el); return { font: parseFloat(css.fontSize), block: parseFloat(css.paddingBlockStart), inline: parseFloat(css.paddingInlineStart) };
	});
	await expect(host).not.toHaveAttribute('size');
	const medium = await measure();
	await host.evaluate(el => el.setAttribute('size', 'small'));
	const small = await measure();
	await host.evaluate(el => el.setAttribute('size', 'large'));
	const large = await measure();
	for (const key of ['font', 'block', 'inline'] as const) {
		expect(small[key]).toBeLessThan(medium[key]); expect(large[key]).toBeGreaterThan(medium[key]);
	}
	await host.evaluate(el => el.setAttribute('size', 'medium'));
	expect(await measure()).toEqual(medium);
	await host.evaluate(el => el.removeAttribute('size'));
	expect(await measure()).toEqual(medium);
});

test('adding, editing and removing original rows preserves handlers and updates overflow', async ({ page }) => {
	await page.locator('table').evaluate(table => {
		const button = table.querySelector('button')!;
		button.addEventListener('click', () => { table.setAttribute('data-clicked', 'yes'); });
		const row = table.querySelector('tbody')!.insertRow();
		row.insertCell().textContent = 'New asset';
		const cell = row.insertCell(); cell.style.whiteSpace = 'nowrap'; cell.textContent = 'Wide metadata '.repeat(30);
	});
	await expect(page.getByRole('row')).toHaveCount(3);
	await expect(page.getByRole('region')).toHaveAttribute('tabindex', '0');
	await page.getByRole('button', { name: 'Sort by name' }).click();
	await expect(page.locator('table')).toHaveAttribute('data-clicked', 'yes');
	await page.locator('tbody tr').last().evaluate(el => el.remove());
	await expect(page.getByRole('region')).toHaveAttribute('tabindex', '-1');
});

test('replaced table and reconnected host regain overflow observation', async ({ page }) => {
	await page.locator('en-table').evaluate(host => {
		const old = host.querySelector('table')!;
		const replacement = old.cloneNode(true) as HTMLTableElement;
		replacement.style.minWidth = '1500px'; old.replaceWith(replacement);
		const parent = host.parentNode!; const after = host.nextSibling;
		host.remove(); parent.insertBefore(host, after);
	});
	await expect(page.getByRole('region')).toHaveAttribute('tabindex', '0');
	await page.locator('table').evaluate((table: HTMLElement) => { table.style.minWidth = ''; });
	await expect(page.getByRole('region')).toHaveAttribute('tabindex', '-1');
});

test('theme overrides stay local to opted-in native table and preserve RTL semantics', async ({ page }) => {
	await page.locator('en-table').evaluate((host: HTMLElement) => {
		host.dir = 'rtl'; host.style.setProperty('--en-table-cell-inline-padding', '22px'); host.style.setProperty('--en-table-header-background', 'rgb(1, 2, 3)');
		const outside = host.querySelector('table')!.cloneNode(true); host.after(outside);
	});
	await expect(page.locator('en-table tbody td')).toHaveCSS('padding-inline-start', '22px');
	await expect(page.locator('en-table thead th').first()).toHaveCSS('background-color', 'rgb(1, 2, 3)');
	await expect(page.locator('en-table table')).toHaveCSS('direction', 'rtl');
	await expect(page.locator('body > table tbody td')).not.toHaveCSS('padding-inline-start', '22px');
});


test('narrow RTL scroll surface contains absolutely positioned accessible labels', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 700 });
	await page.locator('en-table').evaluate((host: HTMLElement) => {
		host.dir = 'rtl';
		const table = host.querySelector('table')!;
		table.style.minWidth = '640px';
		const cell = table.querySelector('tbody td')!;
		const label = document.createElement('label');
		label.htmlFor = 'asset-picked';
		label.textContent = 'Choose Cover study';
		label.style.cssText = 'position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
		const input = document.createElement('input'); input.id = 'asset-picked'; input.type = 'checkbox';
		cell.append(label, input);
	});
	const region = page.getByRole('region');
	await expect(region).toHaveAttribute('tabindex', '0');
	await expect(page.getByRole('checkbox', { name: 'Choose Cover study' })).toHaveCount(1);
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
	await expect.poll(() => region.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(100);
});
