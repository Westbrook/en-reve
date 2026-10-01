import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnNavigation} from '../navigation.js';

/** Registration metadata only; importing this module does not define elements. */
export const navigationDefinition = {
  tagName: 'en-navigation',
  elementClass: EnNavigation,
} as const satisfies ElementDefinition;
