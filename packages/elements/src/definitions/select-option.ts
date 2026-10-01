import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSelectOption} from '../select-option.js';

/** Registration metadata only; importing this module does not define elements. */
export const selectOptionDefinition = {
  tagName: 'en-select-option',
  elementClass: EnSelectOption,
} as const satisfies ElementDefinition;
