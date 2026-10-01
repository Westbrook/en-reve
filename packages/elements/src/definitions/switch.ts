import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSwitch} from '../switch.js';

/** Registration metadata only; importing this module does not define elements. */
export const switchDefinition = {
  tagName: 'en-switch',
  elementClass: EnSwitch,
} as const satisfies ElementDefinition;
