import { expect, type Page } from '@playwright/test';
export const menu = (page: Page) => page.locator('#menu');
export const palette = (page: Page) => page.locator('#palette');
export const search = (page: Page) => palette(page).getByRole('combobox');
export const menuTrigger = (page: Page) => page.locator('#menu-trigger').getByRole('button');
export const paletteTrigger = (page: Page) => page.locator('#palette-trigger').getByRole('button');
export const item = (page: Page, name: string) => menu(page).getByRole('menuitem', { name, exact: true });
export const option = (page: Page, name: string) => palette(page).getByRole('option', { name, exact: true });
export const tool = (page: Page, id: string) => page.locator(`#${id}`).getByRole('button').or(page.locator(`button#${id}`));
export const tabKey = (browserName: string, reverse = false) => `${browserName === 'webkit' ? 'Alt+' : ''}${reverse ? 'Shift+' : ''}Tab`;
export async function settle(page: Page) { await page.evaluate(() => (window as any).commandsFixture.settle()); }
export async function actions(page: Page) { return page.evaluate(() => (window as any).commandsFixture.events.filter((event: any) => event.type === 'en-action')); }
export async function openPalette(page: Page) {
  await paletteTrigger(page).click();
  await expect(palette(page).getByRole('dialog')).toBeVisible();
  await expect(search(page)).toBeFocused();
}
export {frames,placed} from '../../../../../tooling/browser/settling.js';
