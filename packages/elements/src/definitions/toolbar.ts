import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnToolbar} from '../toolbar.js';

/** Registration metadata only; importing this module does not define elements. */
export const toolbarDefinition = {
  tagName: 'en-toolbar',
  elementClass: EnToolbar,
} as const satisfies ElementDefinition;
