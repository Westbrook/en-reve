import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSegmentedItem} from '../segmented-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const segmentedItemDefinition = {
  tagName: 'en-segmented-item',
  elementClass: EnSegmentedItem,
} as const satisfies ElementDefinition;
