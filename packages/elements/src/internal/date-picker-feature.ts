import {createDefinitionPreparation, DefinitionLoadError, type DefinitionLoadOptions, type ElementDefinition} from '@en-reve/primitives/interactions/registration.js';

let available: ElementDefinition | undefined;
/** Shared immutable capability used by public preparation and instance owners; retains no host or registry. */
export const datePickerCalendarLoaders = Object.freeze({
  'en-calendar': () => available ? Promise.resolve(available) : import('../definitions/calendar.js').then(module => module.calendarDefinition),
});
const preparation = createDefinitionPreparation(datePickerCalendarLoaders);
/** Share an eager consumer's code without retaining a registry or element. */
export function availableDatePickerCalendar(definition: ElementDefinition): void {
  available = definition;
}
/** One optional module shared across roots; registration belongs to each caller. */
export async function loadDatePickerCalendar(options: DefinitionLoadOptions = {}): Promise<readonly ElementDefinition[]> {
  if (available) return [available];
  try { return await preparation.load(['en-calendar'], options); }
  catch (error) {
    // Preserve the date picker's existing import rejection shape. Common preparation exposes its load stage.
    if (error instanceof DefinitionLoadError && error.stage === 'load') throw error.cause;
    throw error;
  }
}
