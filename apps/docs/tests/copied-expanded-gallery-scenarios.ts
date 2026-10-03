import { expect, type Page } from '@playwright/test';

/** Run against the displayed gallery source in the native packed consumer. */
export const expandedGalleryScenarios: Array<{
 id: string; entry: string; elements: string[]; contract: string; run(page: Page): Promise<void>;
}> = [
 {
  id: 'color-slider', entry: 'colorSliderExample', elements: ['color-slider'],
  contract: 'Keyboard alpha adjustment, exact editing and Escape restoration',
  async run(page) {
   const slider = page.getByRole('slider', { name: 'Alpha', exact: true });
   await slider.press('ArrowRight'); await expect(slider).toHaveValue('61');
   const field = page.locator('en-color-slider').getByRole('textbox');
   await field.fill('35'); await field.press('Enter'); await expect(slider).toHaveValue('35');
   await field.fill('80'); await field.press('Escape'); await expect(field).toHaveValue('35');
   await expect(page.locator('en-color-slider')).toHaveJSProperty('value', 35);
  },
 },
 {
  id: 'color-wheel', entry: 'colorWheelExample', elements: ['color-wheel'],
  contract: 'Hue keyboard navigation and invalid exact draft recovery',
  async run(page) {
   const hue = page.getByRole('slider', { name: 'Hue', exact: true });
   await hue.press('Home'); await hue.press('PageUp'); await hue.press('ArrowRight');
   await expect(hue).toHaveAttribute('aria-valuenow', '11');
   const field = page.getByRole('textbox', { name: 'Hue', exact: true });
   await field.fill('120'); await field.press('Enter'); await expect(hue).toHaveAttribute('aria-valuenow', '120');
   await field.fill('361'); await field.press('Enter'); await expect(field).toHaveValue('361');
   await expect(hue).toHaveAttribute('aria-valuenow', '120');
   await field.press('Escape'); await expect(field).toHaveValue('120');
  },
 },
 {
  id: 'color-plane', entry: 'colorPlaneExample', elements: ['color-plane'],
  contract: 'Equivalent scalar controls commit color and preserve rejected drafts',
  async run(page) {
   const value = page.getByRole('slider', { name: 'Value', exact: true });
   const field = page.getByRole('textbox', { name: 'Value Exact value', exact: true });
   await field.fill('50'); await field.press('Enter'); await expect(value).toHaveValue('50');
   await field.fill('101'); await field.press('Enter'); await expect(value).toHaveValue('50');
   await field.press('Escape'); await expect(field).toHaveValue('50');
   await value.press('Home'); await expect(page.locator('en-color-plane')).toHaveJSProperty('value', '#000000');
  },
 },
 {
  id: 'color-picker', entry: 'colorPickerExample', elements: ['button','checkbox','color-picker','color-plane','color-wheel','rich-text-editor','switch','token-editor'],
  contract: 'Application-owned wheel/plane synchronization, cancelable changes and baseline picker editing',
  async run(page) {
   const wheel = page.locator('#standalone-wheel'), plane = page.locator('#composed-plane');
   await wheel.getByRole('slider', { name: 'Hue', exact: true }).press('Home');
   const accepted = await wheel.evaluate(element => (element as HTMLElement & { value: string }).value);
   await expect(plane).toHaveJSProperty('value', accepted);
   await page.getByRole('checkbox', { name: 'Reject next change', exact: true }).check();
   await wheel.getByRole('slider', { name: 'Hue', exact: true }).press('PageUp');
   await expect(wheel).toHaveJSProperty('value', accepted); await expect(plane).toHaveJSProperty('value', accepted);
   await plane.getByRole('slider', { name: 'Saturation', exact: true }).press('ArrowLeft');
   const changed = await plane.evaluate(element => (element as HTMLElement & { value: string }).value);
   expect(changed).not.toBe(accepted); await expect(wheel).toHaveJSProperty('value', changed);
   const basic = page.locator('#basic-color-picker');
   const hex = basic.getByRole('textbox', { name: 'Hex color', exact: true });
   await hex.fill('#123456'); await hex.press('Enter'); await expect(basic).toHaveJSProperty('value', '#123456');
  },
 },
 {
  id: 'navigation-sidebar', entry: 'navigationSidebarExample', elements: ['button','drawer','navigation','navigation-group'],
  contract: 'Responsive drawer keeps nested navigation state and recovers focus at the destination',
  async run(page) {
   const demo = page.locator('#drawer-sidebar-example');
   await demo.getByRole('button', { name: 'Preview mobile Drawer', exact: true }).click();
   await demo.getByRole('button', { name: 'Open project navigation', exact: true }).click();
   const navigation = demo.locator('#drawer-workspace-navigation');
   await navigation.locator('en-navigation-group[label="Library"] summary').click();
   await navigation.getByRole('link', { name: 'Archive', exact: true }).click();
   await expect(demo.locator('en-drawer')).toHaveJSProperty('open', false);
   await expect(demo.locator('#drawer-archive')).toBeFocused(); await expect(page).toHaveURL(/#drawer-archive$/);
   await demo.getByRole('button', { name: 'Use viewport layout', exact: true }).click();
   await expect(navigation.locator('en-navigation-group[label="Library"]')).toHaveJSProperty('open', true);
   await expect(navigation.getByRole('link', { name: 'Archive', exact: true })).toHaveAttribute('aria-current', 'location');
  },
 },
 {
  id: 'data-table', entry: 'dataTableExample', elements: ['badge','button','checkbox','data-table','select','table'],
  contract: 'Shared authored/data selection, application veto and keyed virtual navigation',
  async run(page) {
   const table = page.locator('#records-table');
   await table.getByRole('checkbox', { name: 'Select Study 0001', exact: true }).check();
   await expect(table).toHaveJSProperty('selectedKeys', ['study-1']);
   await page.getByRole('checkbox', { name: 'Prevent selection and sorting', exact: true }).check();
   await table.getByRole('checkbox', { name: 'Select Study 0002', exact: true }).click();
   await expect(table).toHaveJSProperty('selectedKeys', ['study-1']);
   await expect(table.getByRole('checkbox', { name: 'Select Study 0002', exact: true })).not.toBeChecked();
   await page.getByText('Compare the authored helper route', { exact: true }).click();
   await expect(page.locator('en-table[label="Composed studies"]').getByRole('checkbox', { name: 'Select Study 0001', exact: true })).toBeChecked();
   await page.getByRole('checkbox', { name: 'Prevent selection and sorting', exact: true }).uncheck();
   await page.getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('windowed');
   await page.getByRole('button', { name: 'Show Study 0901', exact: true }).click();
   await expect(table.getByRole('checkbox', { name: 'Select Study 0901', exact: true })).toBeInViewport();
   await expect(table).toHaveJSProperty('selectedKeys', ['study-1']);
  },
 },
 {
  id: 'composable-chat', entry: 'composableChatExample', elements: ['button','chat-composer','color-picker','editor-trigger','select','swatch','tab','tab-panel','tabs','token-editor'],
  contract: 'Reference insertion retains typed content and canceling a color session preserves the draft',
  async run(page) {
   const editor = page.locator('en-token-editor');
   const field = page.getByRole('textbox', { name: 'Structured message', exact: true });
   await field.click(); await field.pressSequentially('Ask @Mir');
   await expect(page.getByRole('option', { name: /Mira/ })).toBeVisible();
   await field.press('ArrowDown'); await field.press('Enter');
   await expect(editor).toHaveJSProperty('value', 'Ask @Mira');
   const accepted = await editor.evaluate(element => (element as HTMLElement & { value: string }).value);
   await page.getByRole('button', { name: 'Colors', exact: true }).click();
   await expect(page.getByRole('textbox', { name: 'Hex color', exact: true })).toBeVisible();
   await page.getByRole('button', { name: 'Cancel', exact: true }).click();
   await expect(page.locator('en-color-picker')).toHaveCount(0);
   await expect(editor).toHaveJSProperty('value', accepted); await expect(field).toBeFocused();
  },
 },
];
