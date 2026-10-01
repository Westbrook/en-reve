import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSelect} from '../select.js';
import {selectOptionDefinition} from './select-option.js';

/** Registration metadata only; importing this module does not define elements. */
export const selectDefinition = {
  tagName: 'en-select',
  elementClass: EnSelect,
  dependencies: [selectOptionDefinition],
} as const satisfies ElementDefinition;
