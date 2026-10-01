import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnColorPlane} from '../color-plane.js';
import {colorSliderDefinition} from './color-slider.js';

/** Registration metadata only; importing this module does not define elements. */
export const colorPlaneDefinition = {
  tagName: 'en-color-plane',
  elementClass: EnColorPlane,
  dependencies: [colorSliderDefinition],
} as const satisfies ElementDefinition;
