import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnTooltip} from '../tooltip.js';

/** Registration metadata only; importing this module does not define elements. */
export const tooltipDefinition = {
  tagName: 'en-tooltip',
  elementClass: EnTooltip,
} as const satisfies ElementDefinition;
