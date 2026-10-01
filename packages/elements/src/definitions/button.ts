import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnButton} from '../button.js';

/** Registration metadata only; importing this module does not define elements. */
export const buttonDefinition = {
  tagName: 'en-button',
  elementClass: EnButton,
} as const satisfies ElementDefinition;
