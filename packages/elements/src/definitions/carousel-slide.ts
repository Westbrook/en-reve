import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCarouselSlide} from '../carousel-slide.js';

/** Registration metadata only; importing this module does not define elements. */
export const carouselSlideDefinition = {
  tagName: 'en-carousel-slide',
  elementClass: EnCarouselSlide,
} as const satisfies ElementDefinition;
