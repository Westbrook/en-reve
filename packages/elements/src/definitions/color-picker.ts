import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnColorPicker} from '../color-picker.js';
import {colorPlaneDefinition} from './color-plane.js';
import {buttonDefinition} from './button.js';
import {textFieldDefinition} from './text-field.js';
import {colorSliderDefinition} from './color-slider.js';
import {selectDefinition} from './select.js';
import {switchDefinition} from './switch.js';

/** Registration metadata only; importing this module does not define elements. */
export const colorPickerDefinition = {
  tagName: 'en-color-picker',
  elementClass: EnColorPicker,
  dependencies: [colorPlaneDefinition, buttonDefinition, textFieldDefinition, colorSliderDefinition, selectDefinition, switchDefinition],
} as const satisfies ElementDefinition;
