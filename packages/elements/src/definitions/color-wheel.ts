import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnColorWheel} from '../color-wheel.js';
import {textFieldDefinition} from './text-field.js';

/** Registration metadata only; importing this module does not define elements. */
export const colorWheelDefinition = {
  tagName: 'en-color-wheel',
  elementClass: EnColorWheel,
  dependencies: [textFieldDefinition],
} as const satisfies ElementDefinition;
