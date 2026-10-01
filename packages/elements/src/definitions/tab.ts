import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTab} from '../tab.js';

/** Registration metadata only; importing this module does not define elements. */
export const tabDefinition = {
  tagName: 'en-tab',
  elementClass: EnTab,
} as const satisfies ElementDefinition;
