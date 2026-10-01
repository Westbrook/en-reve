import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnAccordionItem} from '../accordion-item.js';

/** Registration metadata only; importing this module does not define elements. */
export const accordionItemDefinition = {
  tagName: 'en-accordion-item',
  elementClass: EnAccordionItem,
} as const satisfies ElementDefinition;
