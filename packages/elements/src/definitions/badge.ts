import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnBadge} from '../badge.js';

/** Registration metadata only; importing this module does not define elements. */
export const badgeDefinition = {
  tagName: 'en-badge',
  elementClass: EnBadge,
} as const satisfies ElementDefinition;
