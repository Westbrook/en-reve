import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnActivityItem} from '../activity-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const activityItemDefinition = {
  tagName: 'en-activity-item',
  elementClass: EnActivityItem,
} as const satisfies ElementDefinition;
