import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCarousel} from '../carousel.js';
import {tooltipDefinition} from './tooltip.js';
import {carouselSlideDefinition} from './carousel-slide.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const carouselDefinition = {
  tagName: 'en-carousel',
  elementClass: EnCarousel,
  dependencies: [tooltipDefinition, carouselSlideDefinition, buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
