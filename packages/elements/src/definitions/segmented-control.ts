import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSegmentedControl} from '../segmented-control.js';
import {segmentedItemDefinition} from './segmented-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const segmentedControlDefinition = {
  tagName: 'en-segmented-control',
  elementClass: EnSegmentedControl,
  dependencies: [segmentedItemDefinition],
} as const satisfies ElementDefinition;
