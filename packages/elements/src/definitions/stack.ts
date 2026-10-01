import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnStack} from '../stack.js';

/** Registration metadata only; importing this module does not define elements. */
export const stackDefinition = {
  tagName: 'en-stack',
  elementClass: EnStack,
} as const satisfies ElementDefinition;
