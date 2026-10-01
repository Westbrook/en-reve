import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnNavigationGroup} from '../navigation-group.js';

/** Registration metadata only; importing this module does not define elements. */
export const navigationGroupDefinition = {
  tagName: 'en-navigation-group',
  elementClass: EnNavigationGroup,
} as const satisfies ElementDefinition;
