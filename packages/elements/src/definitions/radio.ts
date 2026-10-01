import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnRadio} from '../radio.js';

/** Registration metadata only; importing this module does not define elements. */
export const radioDefinition = {
  tagName: 'en-radio',
  elementClass: EnRadio,
} as const satisfies ElementDefinition;
