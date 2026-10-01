import { expect, test, type Page } from '@playwright/test';

const host = (page: Page) => page.locator('#asset');
const input = (page: Page) => host(page).getByRole('combobox', { name: 'Asset', exact: true });
const target = (page: Page) => host(page).getByRole('option', { name: 'Sunset study', exact: true });

test.beforeEach(async ({ page }) => {
	await page.goto('/fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

async function prepareQuery(page: Page, text: string) {
	await input(page).fill(text);
	await input(page).press('ArrowDown');
	await expect(target(page)).toBeVisible();
	await input(page).evaluate(element => (element as HTMLInputElement).setSelectionRange(2, 7));
}

async function expectRetainedQuery(page: Page, text: string) {
	await expect(host(page)).toHaveJSProperty('value', 'forest');
	await expect(input(page)).toHaveValue(text);
	await expect(input(page)).toBeFocused();
	await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
	expect(await input(page).evaluate(element => {
		const field = element as HTMLInputElement;
		return { start: field.selectionStart, end: field.selectionEnd };
	})).toEqual({ start: 2, end: 7 });
	expect(await page.locator('#asset-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement))))
		.toEqual({ asset: 'forest' });
}

for (const mutation of ['remove', 'rename-and-disable'] as const) {
	test(`catalog ${mutation} preserves an exact-label query and caret when selection is rejected`, async ({ page }) => {
		await host(page).evaluate((element, mutation) => {
			element.addEventListener('en-change', event => {
				(window as any).catalogAttempt = event;
				const field = element as any;
				const proposed = (event as CustomEvent).detail.proposed;
				field.items = mutation === 'remove'
					? field.items.filter((item: any) => item.value !== proposed)
					: field.items.map((item: any) => item.value === proposed ? { ...item, label: 'Unavailable sunset', disabled: true } : item);
			}, { once: true });
		}, mutation);
		await prepareQuery(page, 'Sunset study');
		await target(page).click();
		await expectRetainedQuery(page, 'Sunset study');
		expect(await page.evaluate(() => (window as any).catalogAttempt.defaultPrevented)).toBe(true);
		await input(page).press('Escape');
		await expect(input(page)).toHaveValue('Forest canvas');
	});
}

test('catalog rejection also preserves an initially clean accepted-label editor', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', event => {
			const field = element as any;
			field.items = field.items.filter((item: any) => item.value !== (event as CustomEvent).detail.proposed);
		}, { once: true });
	});
	await prepareQuery(page, 'Forest canvas');
	await target(page).click();
	await expectRetainedQuery(page, 'Forest canvas');
});

test('an authoritative staged-value write permits subsequent catalog label reconciliation', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', event => {
			event.preventDefault();
			const field = element as any;
			field.value = field.value;
			field.items = field.items.map((item: any) => item.value === field.value ? { ...item, label: 'Renamed sunset' } : item);
		}, { once: true });
	});
	await prepareQuery(page, 'Sunset study');
	await target(page).click();
	await expect(host(page)).toHaveJSProperty('value', 'sunset');
	await expect(input(page)).toHaveValue('Renamed sunset');
	await expect(input(page)).toHaveAttribute('aria-expanded', 'false');
	expect(await page.locator('#asset-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement))))
		.toEqual({ asset: 'sunset' });
});

test('a nested same-ID selection cannot discard the outer canceled query', async ({ page }) => {
	await host(page).evaluate(element => {
		element.addEventListener('en-change', event => {
			const proposed = (event as CustomEvent).detail.proposed;
			const option = [...element.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')]
				.find(option => option.dataset.value === proposed);
			option!.click();
			event.preventDefault();
		}, { once: true });
	});
	await prepareQuery(page, 'Sunset study');
	await target(page).click();
	await expectRetainedQuery(page, 'Sunset study');
	expect(await page.evaluate(() => (window as any).comboboxFixture.events.filter((event: any) => event.type === 'en-change')))
		.toHaveLength(1);
});
