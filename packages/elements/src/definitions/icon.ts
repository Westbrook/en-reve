import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnIcon} from '../icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const iconDefinition = {
  tagName: 'en-icon',
  elementClass: EnIcon,
} as const satisfies ElementDefinition;
