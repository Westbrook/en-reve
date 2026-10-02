import { expect, type Page } from '@playwright/test';

/** Shared journey runs against two separately extracted sources, with their own
 * registration policy. It never substitutes a test-authored application. */
export async function runTooltipWarmup(page: Page) {
 const position = page.locator('en-tooltip-position-demo');
 const help = position.getByRole('button', { name: 'Hover or focus for help', exact: true });
 await help.focus(); await expect(position.getByRole('tooltip')).toBeVisible();
 await help.press('Escape'); await expect(position.getByRole('tooltip')).not.toBeVisible(); await expect(help).toBeFocused();
 await position.getByRole('combobox', { name: 'Inline region', exact: true }).selectOption('start');
 await expect(position.locator('en-tooltip')).toHaveAttribute('inline', 'start');
 await expect(position.getByRole('combobox', { name: 'Inline region', exact: true })).toHaveValue('start');
 const context = page.locator('en-tooltip-context-demo');
 const canvas = context.getByRole('button', { name: 'Canvas help', exact: true });
 const layer = context.getByRole('button', { name: 'Layer help', exact: true });
 await canvas.focus(); await expect(context.locator('en-tooltip[for="context-canvas"]').getByRole('tooltip')).toBeVisible();
 await canvas.press('ArrowRight'); await expect(layer).toBeFocused();
 await expect(context.locator('en-tooltip[for="context-canvas"]').getByRole('tooltip')).not.toBeVisible();
 await expect(context.locator('en-tooltip[for="context-layers"]').getByRole('tooltip')).toBeVisible();
}

export const navigationContentGalleryScenarios: Array<{
 id: string; entry: string; elements: string[]; contract: string;
 run(page: Page): Promise<void>;
}> = [
 {
  id: 'tree-view', entry: 'treeViewExample', elements: ['tree', 'tree-item', 'checkbox', 'button'],
  contract: 'Focus/selection separation, application veto and authored child removal/recovery',
  async run(page) {
   const tree = page.locator('#specimen-tree');
   const item = (name: string) => tree.getByRole('treeitem', { name, exact: true });
   await item('Cover').focus(); await item('Cover').press('ArrowDown');
   await expect(item('Accent')).toBeFocused(); await expect(tree).toHaveJSProperty('value', 'cover');
   await item('Accent').press('Enter'); await expect(tree).toHaveJSProperty('value', 'accent');
   await expect(page.locator('[data-tree-details]')).toContainText('Accent adds');
   const lock = page.getByRole('checkbox', { name: 'Keep the current selection', exact: true });
   await lock.check(); await item('Caption').press('Enter'); await expect(tree).toHaveJSProperty('value', 'accent');
   await expect(page.locator('[data-tree-result]')).toContainText('Selection kept by the application');
   await lock.uncheck(); await item('Caption').press('Enter'); await expect(tree).toHaveJSProperty('value', 'caption');
   const edit = page.getByRole('button', { name: 'Remove or restore Caption', exact: true });
   await edit.click(); await expect(item('Caption')).toHaveCount(0); await expect(tree).toHaveJSProperty('value', 'cover');
   await expect(page.locator('[data-tree-details]')).toContainText('Cover is the main');
   await edit.click(); await expect(item('Caption')).toBeVisible();
  },
 },
 {
  id: 'pagination', entry: 'paginationExample', elements: ['stack', 'pagination', 'checkbox', 'icon'],
  contract: 'Accepted/canceled paging updates actual records and unknown totals stop at the final batch',
  async run(page) {
   const pager = page.locator('#api-pagination');
   await pager.getByRole('button', { name: 'Next page', exact: true }).click();
   await expect(pager).toHaveJSProperty('page', 2);
   await expect(page.getByRole('list', { name: 'Project studies', exact: true }).getByRole('listitem')).toHaveText(['Project study 04', 'Project study 05', 'Project study 06']);
   await page.getByRole('checkbox', { name: 'Hold current page', exact: true }).check();
   await pager.getByRole('button', { name: 'Next page', exact: true }).click();
   await expect(pager).toHaveJSProperty('page', 2); await expect(page.getByRole('status', { name: 'Project page result' })).toContainText('Page 2 retained');
   await page.getByText('Try an unknown total', { exact: true }).click();
   const unknown = page.locator('#api-pagination-unknown');
   await unknown.getByRole('button', { name: 'Next page', exact: true }).click();
   await unknown.getByRole('button', { name: 'Next page', exact: true }).click();
   await expect(unknown).toHaveJSProperty('page', 3); await expect(unknown.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
   await expect(page.getByRole('status', { name: 'Batch result' })).toContainText('no further batch');
  },
 },
 {
  id: 'tabs', entry: 'tabsExample', elements: ['tabs', 'tab', 'tab-panel', 'checkbox'],
  contract: 'Automatic keyboard activation and panel relationships retain authored field state',
  async run(page) {
   const tab = (name: string) => page.getByRole('tab', { name, exact: true });
   const field = page.getByRole('checkbox', { name: 'Preserve proportions', exact: true });
   await field.uncheck(); await tab('Design').focus(); await tab('Design').press('ArrowRight');
   await expect(tab('Layout')).toBeFocused(); await expect(tab('Layout')).toHaveAttribute('aria-selected', 'true');
   await expect(page.locator('#inspector-panel-design')).not.toBeVisible(); await expect(page.locator('#inspector-panel-layout')).toBeVisible();
   await expect(tab('Layout')).toHaveAttribute('aria-controls', 'inspector-panel-layout');
   await tab('Layout').press('End'); await expect(tab('Export')).toBeFocused();
   await tab('Export').press('Home'); await expect(tab('Design')).toBeFocused(); await expect(field).not.toBeChecked();
   await expect(page.locator('en-tabs')).toHaveJSProperty('value', 'design');
  },
 },
 {
  id: 'accordion', entry: 'accordionExample', elements: ['accordion', 'accordion-item'],
  contract: 'Independent multiple disclosures maintain expanded state and readable content',
  async run(page) {
   const button = (name: string) => page.getByRole('button', { name, exact: true });
   await button('Appearance').click(); await button('Advanced').click();
   for (const name of ['Layout', 'Appearance', 'Advanced']) await expect(button(name)).toHaveAttribute('aria-expanded', 'true');
   await button('Layout').press('Enter'); await expect(button('Layout')).toHaveAttribute('aria-expanded', 'false');
   await expect(page.getByText('Keep a predictable rhythm between related controls.', { exact: true })).not.toBeVisible();
   await expect(page.getByText('Color, border, and corner settings stay individually adjustable.', { exact: true })).toBeVisible();
   await expect.poll(() => page.locator('en-accordion').evaluate((node: HTMLElement & { value: string[] }) => [...node.value].sort())).toEqual(['advanced', 'appearance']);
  },
 },
 {
  id: 'split-view', entry: 'splitViewExample', elements: ['split-view', 'navigation', 'navigation-group', 'text-field', 'checkbox'],
  contract: 'Nested resize/collapse, focus recovery, visibility veto and responsive draft/node retention',
  async run(page) {
   const outer = page.locator('#workspace-split'), inner = page.locator('#inspector-split');
   const handle = outer.getByRole('separator', { name: 'Resize navigation', exact: true });
   const note = page.getByRole('textbox', { name: 'Review note', exact: true });
   await note.fill('Keep this copied draft'); await note.evaluate(node => node.setAttribute('data-original-node', 'true'));
   await handle.press('ArrowRight'); await expect(outer).toHaveJSProperty('value', 26);
   await handle.press('Enter'); await expect(outer).toHaveJSProperty('collapsed', 'primary');
   const restore = outer.getByRole('button', { name: 'Restore Navigation', exact: true });
   await expect(restore).toBeFocused(); await restore.press('Enter'); await expect(outer).toHaveJSProperty('collapsed', 'none');
   await expect(outer).toHaveJSProperty('value', 26);
   await inner.getByRole('separator', { name: 'Resize content and inspector', exact: true }).press('Enter');
   await expect(note).not.toBeVisible(); await inner.getByRole('button', { name: 'Restore Inspector', exact: true }).press('Enter');
   await expect(note).toHaveValue('Keep this copied draft');
   await page.setViewportSize({ width: 390, height: 844 });
   await expect(outer).toHaveJSProperty('orientation', 'vertical'); await expect(inner).toHaveJSProperty('orientation', 'vertical');
   await expect(note).toHaveAttribute('data-original-node', 'true'); await expect(note).toHaveValue('Keep this copied draft');
   await page.getByText('Review scenarios', { exact: true }).click();
   await page.getByRole('checkbox', { name: 'Prevent pane visibility changes', exact: true }).check();
   await handle.press('Enter'); await expect(outer).toHaveJSProperty('collapsed', 'none');
   await expect(page.getByRole('status')).toContainText('Visibility change canceled');
  },
 },
 {
  id: 'split-view-vertical', entry: 'verticalSplitViewExample', elements: ['split-view', 'stack', 'badge', 'textarea', 'checkbox'],
  contract: 'Vertical separator stepping/bounds and retained review draft',
  async run(page) {
   const split = page.locator('en-split-view');
   const note = page.getByRole('textbox', { name: 'Review notes', exact: true }); await note.fill('Vertical copied draft');
   const handle = page.getByRole('separator', { name: 'Resize preview pane', exact: true });
   await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
   await handle.press('ArrowDown'); await expect(split).toHaveJSProperty('value', 51);
   await handle.press('Home'); await expect(split).toHaveJSProperty('value', 20);
   await handle.press('End'); await expect(split).toHaveJSProperty('value', 80);
   await expect(note).toHaveValue('Vertical copied draft');
   expect((await split.boundingBox())!.height).toBeGreaterThan(200);
  },
 },
 {
  id: 'content-recipes', entry: 'contentRecipesExample', elements: ['stack', 'select', 'button', 'checkbox'],
  contract: 'Public native CSS, real selection/layout, matching loading geometry and local empty/error recovery',
  async run(page) {
   const list = page.getByRole('list', { name: 'Content samples', exact: true });
   await expect(list).toHaveCSS('display', 'grid');
   await page.getByRole('radio', { name: 'Campaign brief', exact: true }).check();
   await expect(page.locator('[data-content-selection]')).toContainText('Selected sample: Campaign brief');
   await page.getByRole('combobox', { name: 'Sample layout', exact: true }).selectOption('list');
   await expect(list).toHaveAttribute('data-layout', 'list');
   const before = (await list.boundingBox())!;
   const toggle = page.getByRole('checkbox', { name: 'Preview loading placeholders', exact: true });
   await toggle.check();
   const region = page.locator('[data-content-list] [data-content-loading-region]');
   await expect(region).toHaveAttribute('aria-busy', 'true'); await expect(region.locator('[data-content-ready]')).toHaveJSProperty('inert', true);
   const after = (await list.boundingBox())!; expect(after.width).toBeCloseTo(before.width, 1); expect(after.height).toBeCloseTo(before.height, 1);
   await toggle.uncheck(); await expect(region.locator('[data-content-ready]')).toHaveJSProperty('inert', false);
   await expect(page.getByRole('radio', { name: 'Campaign brief', exact: true })).toBeChecked();
   await page.getByRole('button', { name: 'Show empty state', exact: true }).click(); await expect(list).not.toBeVisible();
   await page.getByRole('button', { name: 'Restore sample catalog', exact: true }).click(); await expect(list).toBeVisible();
   await page.getByRole('button', { name: 'Create local collection', exact: true }).click();
   await expect(page.locator('[data-content-recovery-status]')).toHaveText('Review collection created');
   await page.getByRole('button', { name: 'Retry local preview', exact: true }).click();
   await expect(page.locator('[data-content-recovery-status]')).toHaveText('Preview restored');
   await page.getByRole('button', { name: 'Reset local collection', exact: true }).click();
   await expect(page.locator('[data-content-recovery-status]')).toHaveText('Start a review collection');
   await expect(page.locator('[data-content-controls]')).toHaveCSS('display', 'flex');
  },
 },
 {
  id: 'authored-table', entry: 'authoredTableExample', elements: ['table', 'button', 'icon'],
  contract: 'Public native table/radio styles, labeled sorting and stable keyed selection',
  async run(page) {
   const table = page.getByRole('table', { name: 'Project assets', exact: true });
   await expect(table).toHaveCSS('border-collapse', 'separate');
   await expect(table).toHaveCSS('border-spacing', '0px');
   const choice = page.getByRole('radio', { name: 'Choose Sparkle mark', exact: true });
   await choice.check(); await choice.evaluate(node => node.setAttribute('data-original-node', 'true'));
   await expect(page.locator('output')).toContainText('Selected Sparkle mark');
   await page.getByRole('button', { name: 'Sort Name ascending', exact: true }).click();
   await expect(table.locator('tbody tr th')).toHaveText(['Campaign brief', 'Review checklist', 'Sparkle mark']);
   await expect(table.locator('thead th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
   await page.getByRole('button', { name: 'Sort Name descending', exact: true }).click();
   await expect(table.locator('tbody tr th')).toHaveText(['Sparkle mark', 'Review checklist', 'Campaign brief']);
   await expect(choice).toBeChecked(); await expect(choice).toHaveAttribute('data-original-node', 'true');
   for (const label of await table.locator('.visually-hidden').all()) expect((await label.boundingBox())!.width).toBeLessThanOrEqual(1);
  },
 },
 {
  id: 'messages', entry: 'messagesExample', elements: ['alert'],
  contract: 'Cancelable dismissal closes only the chosen notification',
  async run(page) {
   const warning = page.locator('en-alert[variant=warning]');
   const close = warning.getByRole('button', { name: 'Dismiss notification', exact: true });
   await warning.evaluate(node => node.addEventListener('en-change', event => event.preventDefault(), { once: true }));
   await close.click(); await expect(warning).toHaveJSProperty('open', true);
   await close.click(); await expect(warning).toHaveJSProperty('open', false); await expect(close).not.toBeVisible();
   await expect(page.getByText('Changes saved to this review.', { exact: true })).toBeVisible();
  },
 },
 {
  id: 'dialog-drawer', entry: 'dialogDrawerExample', elements: ['button', 'dialog', 'drawer', 'text-field', 'textarea'],
  contract: 'for-linked native modals, retained drafts, authored Done action and Escape focus recovery',
  async run(page) {
   const opener = page.getByRole('button', { name: 'Open dialog', exact: true });
   const dialog = page.locator('en-dialog');
   await opener.click(); await expect(dialog.getByRole('dialog')).toBeVisible();
   const email = dialog.getByRole('textbox', { name: 'Email address', exact: true }); await email.fill('reader@example.test');
   await dialog.getByRole('button', { name: 'Done', exact: true }).click(); await expect(dialog.getByRole('dialog')).not.toBeVisible(); await expect(opener).toBeFocused();
   await opener.click(); await expect(email).toHaveValue('reader@example.test'); await email.press('Escape'); await expect(opener).toBeFocused();
   const drawerOpener = page.getByRole('button', { name: 'Open drawer', exact: true }); const drawer = page.locator('en-drawer');
   await drawerOpener.click(); await expect(drawer.getByRole('dialog')).toBeVisible();
   const notes = drawer.getByRole('textbox', { name: 'Notes', exact: true }); await notes.fill('Persistent drawer draft');
   await notes.press('Escape'); await expect(drawerOpener).toBeFocused();
   await drawerOpener.click(); await expect(notes).toHaveValue('Persistent drawer draft'); await notes.press('Escape');
   await expect(page.locator('.overlay-example > .specimen-row')).toHaveCSS('display', 'flex');
  },
 },
 {
  id: 'popover-tooltip', entry: 'popoverTooltipExample', elements: ['button', 'icon', 'popover', 'checkbox', 'tooltip'],
  contract: 'Popover option state survives dismissal; focused tooltip Escape preserves its trigger',
  async run(page) {
   const trigger = page.getByRole('button', { name: 'View options', exact: true }); const popup = page.locator('en-popover');
   await trigger.click(); await popup.getByRole('checkbox', { name: 'Show grid', exact: true }).uncheck();
   await popup.getByRole('checkbox', { name: 'Show outlines', exact: true }).check();
   await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
   await trigger.click(); await expect(popup.getByRole('checkbox', { name: 'Show grid', exact: true })).not.toBeChecked();
   await expect(popup.getByRole('checkbox', { name: 'Show outlines', exact: true })).toBeChecked(); await page.keyboard.press('Escape');
   const help = page.getByRole('button', { name: 'Hover or focus', exact: true });
   await help.focus(); await expect(page.getByRole('tooltip')).toBeVisible(); await help.press('Escape');
   await expect(page.getByRole('tooltip')).not.toBeVisible(); await expect(help).toBeFocused();
   await expect(page.locator('.specimen-row')).toHaveCSS('display', 'flex');
  },
 },
 {
  id: 'tooltip-warmup', entry: 'tooltipWarmupExample', elements: ['stack', 'toolbar', 'button', 'tooltip', 'select'],
  contract: 'Logical placement acceptance, context-provider focus handoff and Escape',
  run: runTooltipWarmup,
 },
];
