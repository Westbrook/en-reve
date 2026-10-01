import {validateDeliveryIdentity, type DeliveryIdentity} from '@en-reve/elements/delivery.js';

/** Data only: keys resolve through application-owned allowlists, never through URLs from HTML. */
export interface HydrationManifest {
  readonly id: string;
  readonly key: string;
  readonly version: string;
  readonly tags: readonly string[];
  /** Must match the server and client module; absent preserves the legacy eager contract. */
  readonly delivery?: DeliveryIdentity;
}
export function validateHydrationManifest(manifest: HydrationManifest): void {
  if (manifest.delivery !== undefined) validateDeliveryIdentity(manifest.delivery);
  if (!/^[A-Za-z][\w:.-]*$/.test(manifest.id) || !manifest.key || !manifest.version || !manifest.tags.length
    || new Set(manifest.tags).size !== manifest.tags.length || manifest.tags.some(tag => !/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(tag))) {
    throw new Error('Invalid hydration manifest.');
  }
}
/** Safe JSON for an application/json script body, including user-derived identifiers. */
export function serializeHydrationManifest(manifest: HydrationManifest): string {
  validateHydrationManifest(manifest);
  return JSON.stringify(manifest).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}
