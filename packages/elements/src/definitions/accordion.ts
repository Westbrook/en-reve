import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnAccordion} from '../accordion.js';

/** Registration metadata only; importing this module does not define elements. */
export const accordionDefinition = {
  tagName: 'en-accordion',
  elementClass: EnAccordion,
} as const satisfies ElementDefinition;
