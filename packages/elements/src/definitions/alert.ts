import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnAlert} from '../alert.js';

/** Registration metadata only; importing this module does not define elements. */
export const alertDefinition = {
  tagName: 'en-alert',
  elementClass: EnAlert,
} as const satisfies ElementDefinition;
