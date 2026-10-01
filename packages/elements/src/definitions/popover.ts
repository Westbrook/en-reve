import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnPopover} from '../popover.js';

/** Registration metadata only; importing this module does not define elements. */
export const popoverDefinition = {
  tagName: 'en-popover',
  elementClass: EnPopover,
} as const satisfies ElementDefinition;
