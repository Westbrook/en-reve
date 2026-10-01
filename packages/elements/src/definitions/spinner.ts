import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSpinner} from '../spinner.js';

/** Registration metadata only; importing this module does not define elements. */
export const spinnerDefinition = {
  tagName: 'en-spinner',
  elementClass: EnSpinner,
} as const satisfies ElementDefinition;
