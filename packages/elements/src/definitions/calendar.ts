import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCalendar} from '../calendar.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const calendarDefinition = {
  tagName: 'en-calendar',
  elementClass: EnCalendar,
  dependencies: [buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
