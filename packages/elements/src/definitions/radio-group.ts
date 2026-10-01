import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnRadioGroup} from '../radio-group.js';

/** Registration metadata only; importing this module does not define elements. */
export const radioGroupDefinition = {
  tagName: 'en-radio-group',
  elementClass: EnRadioGroup,
} as const satisfies ElementDefinition;
