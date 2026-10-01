import {createProfile} from './internal/delivery-profile.js';
import {datePickerCalendarLoaders} from './internal/date-picker-feature.js';
import {datePickerCalendarFeature, datePickerSingleDeferredPolicy} from './internal/delivery-policy.js';

const datePickerShellLoaders = Object.freeze({
  'en-date-picker': () => import('./date-picker-shell.js').then(module => module.datePickerShellDefinition),
});
/** Selective single-date policy: no complete catalog or canonical manifest is imported. */
export const datePickerSingleDeferredProfile = createProfile({
  ...datePickerSingleDeferredPolicy,
  loaders: datePickerShellLoaders,
  features: [datePickerCalendarFeature],
  preparations: {[datePickerCalendarFeature.id]: datePickerCalendarLoaders},
}, true);
