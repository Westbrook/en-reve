import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnDatePicker} from '../date-picker.js';
import {calendarDefinition} from './calendar.js';
import {dialogDefinition} from './dialog.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';
import {availableDatePickerCalendar} from '../internal/date-picker-feature.js';

/** Registration metadata only; importing this module does not define elements. */
export const datePickerDefinition = {
  tagName: 'en-date-picker',
  elementClass: EnDatePicker,
  dependencies: [calendarDefinition, dialogDefinition, buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;

// Eager consumers already carry this code; optional opening needs no import wrapper.
availableDatePickerCalendar(calendarDefinition);
