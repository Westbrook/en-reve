import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnDatePicker} from './date-picker.js';
import {dialogDefinition} from './definitions/dialog.js';
import {buttonDefinition} from './definitions/button.js';
import {iconDefinition} from './definitions/icon.js';

/**
 * Single-date shell entry. Set calendar-loading="deferred" before the first update.
 * Same constructor as datePickerDefinition; the canonical eager definition is unchanged.
 * Range selection requires the eager entry. Importing either entry defines nothing.
 */
export const datePickerShellDefinition = {
  tagName: 'en-date-picker',
  elementClass: EnDatePicker,
  dependencies: [dialogDefinition, buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
