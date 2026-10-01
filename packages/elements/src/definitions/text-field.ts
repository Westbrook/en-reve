import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTextField} from '../text-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const textFieldDefinition = {
  tagName: 'en-text-field',
  elementClass: EnTextField,
} as const satisfies ElementDefinition;
