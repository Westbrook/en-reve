import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTextarea} from '../textarea.js';

/** Registration metadata only; importing this module does not define elements. */
export const textareaDefinition = {
  tagName: 'en-textarea',
  elementClass: EnTextarea,
} as const satisfies ElementDefinition;
