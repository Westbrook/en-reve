import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTree} from '../tree.js';
import {treeItemDefinition} from './tree-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const treeDefinition = {
  tagName: 'en-tree',
  elementClass: EnTree,
  dependencies: [treeItemDefinition],
} as const satisfies ElementDefinition;
