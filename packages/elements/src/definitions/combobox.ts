import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCombobox} from '../combobox.js';

/** Registration metadata only; importing this module does not define elements. */
export const comboboxDefinition = {
  tagName: 'en-combobox',
  elementClass: EnCombobox,
} as const satisfies ElementDefinition;
