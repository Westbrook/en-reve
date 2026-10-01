import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSlider} from '../slider.js';

/** Registration metadata only; importing this module does not define elements. */
export const sliderDefinition = {
  tagName: 'en-slider',
  elementClass: EnSlider,
} as const satisfies ElementDefinition;
