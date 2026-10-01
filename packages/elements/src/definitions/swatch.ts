import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSwatch} from '../swatch.js';

/** Registration metadata only; importing this module does not define elements. */
export const swatchDefinition = {
  tagName: 'en-swatch',
  elementClass: EnSwatch,
} as const satisfies ElementDefinition;
