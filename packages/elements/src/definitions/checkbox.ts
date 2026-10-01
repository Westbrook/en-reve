import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCheckbox} from '../checkbox.js';

/** Registration metadata only; importing this module does not define elements. */
export const checkboxDefinition = {
  tagName: 'en-checkbox',
  elementClass: EnCheckbox,
} as const satisfies ElementDefinition;
