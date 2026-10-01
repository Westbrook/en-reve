import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnRangeSlider} from '../range-slider.js';
export const rangeSliderDefinition = { tagName: 'en-range-slider', elementClass: EnRangeSlider } as const satisfies ElementDefinition;
