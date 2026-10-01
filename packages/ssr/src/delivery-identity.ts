import {validateDeliveryIdentity, type DeliveryIdentity} from '@en-reve/elements/delivery.js';

/** Snapshot policy alongside request/island data, never retain caller-owned mutable identity. */
export function snapshotDeliveryIdentity(identity: DeliveryIdentity | undefined): DeliveryIdentity | undefined {
  if (identity === undefined) return undefined;
  validateDeliveryIdentity(identity);
  return Object.freeze({schemaVersion: identity.schemaVersion, id: identity.id, version: identity.version});
}
