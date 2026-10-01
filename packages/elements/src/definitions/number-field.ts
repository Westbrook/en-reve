import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnNumberField} from '../number-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const numberFieldDefinition = {
  tagName: 'en-number-field',
  elementClass: EnNumberField,
} as const satisfies ElementDefinition;
