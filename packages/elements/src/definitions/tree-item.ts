import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTreeItem} from '../tree-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const treeItemDefinition = {
  tagName: 'en-tree-item',
  elementClass: EnTreeItem,
} as const satisfies ElementDefinition;
