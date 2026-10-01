import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTimeField} from '../time-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const timeFieldDefinition = {
  tagName: 'en-time-field',
  elementClass: EnTimeField,
} as const satisfies ElementDefinition;
