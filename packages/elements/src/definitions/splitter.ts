import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSplitter} from '../splitter.js';

/** Registration metadata only; importing this module does not define elements. */
export const splitterDefinition = {
  tagName: 'en-splitter',
  elementClass: EnSplitter,
} as const satisfies ElementDefinition;
