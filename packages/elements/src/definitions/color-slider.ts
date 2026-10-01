import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnColorSlider} from '../color-slider.js';
import {textFieldDefinition} from './text-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const colorSliderDefinition = {
  tagName: 'en-color-slider',
  elementClass: EnColorSlider,
  dependencies: [textFieldDefinition],
} as const satisfies ElementDefinition;
