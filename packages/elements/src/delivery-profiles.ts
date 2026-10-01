import {DeliveryError, type DeliveryProfile} from './delivery.js';
import {createProfile} from './internal/delivery-profile.js';
import {elementLoaders} from './lazy-manifest.js';
import {datePickerSingleDeferredProfile} from './delivery-date-picker.js';
import {datePickerCalendarLoaders} from './internal/date-picker-feature.js';
import {deliveryFeatures, deliveryProfiles} from './internal/delivery-policy.js';

export type ElementDeliveryProfileId = 'en-reve/eager' | 'en-reve/date-picker-single-deferred';
const eager = createProfile({...deliveryProfiles.eager, loaders: elementLoaders, features: [deliveryFeatures.commandPaletteRoot]}, true);
const datePickerSingleDeferred = createProfile({
  ...deliveryProfiles.datePickerSingleDeferred,
  loaders: Object.freeze({...elementLoaders, ...datePickerSingleDeferredProfile.loaders}),
  features: [deliveryFeatures.datePickerCalendar, deliveryFeatures.commandPaletteRoot],
  preparations: {[deliveryFeatures.datePickerCalendar.id]: datePickerCalendarLoaders},
}, true);
/** Stable, immutable entry selection. Selection never registers or sets instance properties. */
export function selectDeliveryProfile(id: ElementDeliveryProfileId = 'en-reve/eager'): DeliveryProfile {
  if (id === 'en-reve/eager') return eager;
  if (id === 'en-reve/date-picker-single-deferred') return datePickerSingleDeferred;
  throw new DeliveryError('lookup', [id], new Error('Unknown library delivery profile.'));
}
