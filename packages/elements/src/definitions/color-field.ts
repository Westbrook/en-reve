import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnColorField} from '../color-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const colorFieldDefinition = {
  tagName: 'en-color-field',
  elementClass: EnColorField,
} as const satisfies ElementDefinition;
