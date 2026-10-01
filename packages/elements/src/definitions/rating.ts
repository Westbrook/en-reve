import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnRating} from '../rating.js';

/** Registration metadata only; importing this module does not define elements. */
export const ratingDefinition = {
  tagName: 'en-rating',
  elementClass: EnRating,
} as const satisfies ElementDefinition;
