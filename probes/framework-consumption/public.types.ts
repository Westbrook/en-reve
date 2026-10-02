import type {EnCheckbox} from '@en-reve/elements/checkbox.js';
import type {EnTextField} from '@en-reve/elements/text-field.js';
import type {EnTree, TreeDataItem, TreeChangeEvent} from '@en-reve/elements/tree.js';
import type {ChangeEvent} from '@en-reve/primitives/interactions/events.js';
import {createScopedRenderer} from '@en-reve/ssr/scoped.js';

declare const checkbox: EnCheckbox;
declare const field: EnTextField;
declare const tree: EnTree;
checkbox.checked = true;
field.value = 'Revised brief';
field.label = 'Project title';
const items = [{key:'project',label:'Project artwork'}] satisfies readonly TreeDataItem[];
tree.items = items;
tree.selectedKey = 'project';
checkbox.addEventListener('en-change', ((event: ChangeEvent<boolean>) => {
  const previous: boolean = event.detail.previous;
  event.preventDefault(); checkbox.checked = previous;
}) as EventListener);
tree.addEventListener('en-change', ((event: TreeChangeEvent) => {
  const selected: string = event.detail.proposed.selectedKey;
  tree.selectedKey = selected;
}) as EventListener);
void createScopedRenderer;
// @ts-expect-error Data must be structured, not an attribute-serialized string.
tree.items = '[object Object]';
// @ts-expect-error Boolean properties do not accept framework attribute strings.
checkbox.checked = 'false';
