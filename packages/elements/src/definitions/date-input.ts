import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnDateInput} from '../date-input.js';

/** Registration metadata only; importing this module does not define elements. */
export const dateInputDefinition = {
  tagName: 'en-date-input',
  elementClass: EnDateInput,
} as const satisfies ElementDefinition;
