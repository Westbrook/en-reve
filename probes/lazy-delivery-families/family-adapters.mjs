import assert from 'node:assert/strict';
import {installFamilyProbe} from './browser-probe.mjs';
import {installCommandProbe} from './command-probe.mjs';
import {installPaginationProbe} from './pagination-probe.mjs';

export const routeAdapters = Object.freeze({
  media: {path: '/component-patterns.html', query: '?theme=default&appearance=light', host: '#media > en-media-viewer#viewer', protocol: 'media-design', items: 2, keyboardKey: 'Enter'},
  combobox: {path: '/workflows/selection.html', query: '', host: '#selection en-combobox', protocol: 'selection-design', items: 40, keyboardKey: 'ArrowDown'},
  command: {path: '/workflows/settings.html', query: '', host: '#settings-command-palette', protocol: 'command-palette-design', items: 4, keyboardKey: 'Enter'},
  pagination: {path: '/api-examples/pagination.html', query: '', host: '#api-pagination', protocol: 'compact-overlay-design', items: 7, keyboardKey: 'Enter'},
});
export async function installProbe(context, family, policy) {
  const install = family === 'command' ? installCommandProbe : family === 'pagination' ? installPaginationProbe : installFamilyProbe;
  assert(routeAdapters[family], 'Unknown actual-route adapter');
  await context.addInitScript(install, {family, policy});
}
export function actionTarget(page, family, action) {
  if (family === 'media') return page.locator('#media .preview-image').first();
  if (family === 'combobox') return page.locator(action === 'keyboard' ? '#selection en-combobox #control' : '#selection en-combobox [part~=trigger]');
  if (family === 'command') return page.locator('#settings-command-trigger button');
  if (family === 'pagination') return page.locator('#api-pagination').getByRole('button', {name: 'Choose a page', exact: true});
  throw new Error('Unknown action target family');
}
export function assertInitialWorkload(snapshot, family, policy) {
  assert.equal(snapshot.workload.items, routeAdapters[family].items, 'Actual workload catalog changed');
  if (family === 'command') {
    assert.equal(snapshot.routeRegistry, 'global', 'Settings route owner must remain production-global');
    assert(['unregistered', 'global'].includes(snapshot.actualRegistry), 'Command host registry ownership is unknown');
    assert.equal(snapshot.workload.catalogMatches, true, 'Exact four-command workload changed');
  } else assert.equal(snapshot.actualRegistry, 'global', 'Actual route must report production-global ownership');
  if (['media', 'combobox', 'command'].includes(family)) assert.equal(snapshot.workload.contentRendering, policy, 'Initial authored construction policy differs from arm');
  if (family === 'pagination') {assert.equal(snapshot.workload.totalHosts, 8); assert.equal(snapshot.workload.eligibleHosts, 6); assert.equal(snapshot.workload.pagers.filter(pager => pager.eligible && pager.contentRendering === 'on-demand').length, policy === 'on-demand' ? 6 : 0); assert.equal(snapshot.workload.pagers.filter(pager => !pager.eligible).length, 2);}
}
export async function beforeRepeatClose(page, family) {
  // Exercise the real chooser draft retention outside the action-to-ready clock.
  if (family === 'pagination') await page.locator('#api-pagination [part~=page-input]').fill('9');
}
