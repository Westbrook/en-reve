import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnLink} from '../link.js';

/** Registration metadata only; importing this module does not define elements. */
export const linkDefinition = {
  tagName: 'en-link',
  elementClass: EnLink,
} as const satisfies ElementDefinition;
