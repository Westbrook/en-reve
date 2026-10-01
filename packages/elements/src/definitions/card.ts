import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCard} from '../card.js';

/** Registration metadata only; importing this module does not define elements. */
export const cardDefinition = {
  tagName: 'en-card',
  elementClass: EnCard,
} as const satisfies ElementDefinition;
