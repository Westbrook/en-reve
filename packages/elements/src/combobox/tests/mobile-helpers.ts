import { expect, type Page } from '@playwright/test';

export const field = (page: Page) => page.locator('#asset');
export const control = (page: Page) => field(page).getByRole('combobox', { name: 'Asset', exact: true });
export const trigger = (page: Page) => field(page).getByRole('button', { name: 'Show options', exact: true });
export const surface = (page: Page) => field(page).locator('[part~="popup"]');
export const choice = (page: Page, name: string) => field(page).getByRole('option', { name, exact: true });

export async function openMobile(page: Page) {
	await page.goto('/fixture');
	await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
	await field(page).evaluate(element => {
		(window as any).mobileComboboxEvents = [];
		for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'click']) {
			element.shadowRoot!.addEventListener(type, event => {
				const target = event.target as HTMLElement;
				(window as any).mobileComboboxEvents.push({
					type, trusted: event.isTrusted, pointerType: (event as PointerEvent).pointerType,
					role: target.closest('[role]')?.getAttribute('role'),
					part: target.closest('[part]')?.getAttribute('part'),
				});
			}, { passive: true });
		}
	});
}

export async function typeQuery(page: Page, value: string) {
	await control(page).tap();
	await control(page).press('ControlOrMeta+A');
	await page.keyboard.insertText(value);
	await expect(control(page)).toHaveValue(value);
	await expect(control(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(surface(page)).toBeVisible();
	await positioned(page);
}

export async function positioned(page: Page) {
	await expect.poll(() => field(page).evaluate(element => {
		const anchor = element.shadowRoot!.querySelector('[role="combobox"]')!.getBoundingClientRect();
		const popup = element.shadowRoot!.querySelector('[part~="popup"]')!.getBoundingClientRect();
		const viewport = visualViewport!;
		const gap = Math.min(Math.abs(popup.top - anchor.bottom), Math.abs(anchor.top - popup.bottom));
		return popup.width > 0 && gap <= 16
			&& popup.left >= viewport.offsetLeft - 1 && popup.right <= viewport.offsetLeft + viewport.width + 1
			&& popup.top >= viewport.offsetTop - 1 && popup.bottom <= viewport.offsetTop + viewport.height + 1;
	})).toBe(true);
}

export async function formValue(page: Page) {
	return page.locator('#asset-form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)));
}

import {frames} from '../../../../../tooling/browser/settling.js';
export async function nativeFrames(page:Page,count=4){await frames(page,count);}
