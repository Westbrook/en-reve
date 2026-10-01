import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSearchInput} from '../search-input.js';

/** Registration metadata only; importing this module does not define elements. */
export const searchInputDefinition = {
  tagName: 'en-search-input',
  elementClass: EnSearchInput,
} as const satisfies ElementDefinition;
