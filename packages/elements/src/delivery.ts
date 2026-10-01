import type {DefinitionLoaders, DefinitionLoadOptions} from './lazy-loader.js';
import {createProfile, prepareProfile, hasDeliveryIdentityValues} from './internal/delivery-profile.js';

/** Versioned JSON identity. Changing delivery behavior requires a new profile version. */
export interface DeliveryIdentity {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly version: string;
}
export type DeliveryCost = 'component-loading' | 'registration' | 'construction' | 'optional-code' | 'hydration' | 'data' | 'virtualization';
export type DeliveryDisposition = 'implemented' | 'already-conditional' | 'essential-eager' | 'not-applicable' | 'rejected-with-evidence' | 'candidate' | 'needs-design' | 'unassessed';
/** Discovery is data; an implemented definition binding is required for preparation. */
export interface DeliveryFeature {
  readonly id: string;
  readonly version: string;
  readonly disposition: DeliveryDisposition;
  readonly owner: 'element' | 'application' | 'ssr';
  readonly deferredCosts: readonly DeliveryCost[];
  readonly definitionTags: readonly string[];
  readonly fallback: string;
  readonly prerequisites: readonly string[];
}
/** Requirements that the consumer applies before the host's first render. */
export interface DeliveryInitialProperties {
  readonly tag: string;
  readonly properties: Readonly<Record<string, string | number | boolean | null>>;
}
export interface DeliveryProfile extends DeliveryIdentity {
  /** Data-only identity for SSR agreement and serialization; never pass the executable profile as an identity. */
  readonly identity: DeliveryIdentity;
  readonly loaders: DefinitionLoaders;
  readonly features: readonly DeliveryFeature[];
  readonly initialProperties: readonly DeliveryInitialProperties[];
}
export interface DeliveryProfileOptions extends DeliveryIdentity {
  readonly loaders: DefinitionLoaders;
  readonly features: readonly DeliveryFeature[];
  readonly initialProperties?: readonly DeliveryInitialProperties[];
  /** Separate explicit import allowlists, keyed by feature ID; omitted bindings use loaders. */
  readonly preparations?: Readonly<Record<string, DefinitionLoaders>>;
}
export class DeliveryError extends Error {
  readonly stage: 'profile' | 'lookup';
  readonly ids: readonly string[];
  constructor(stage: 'profile' | 'lookup', ids: readonly string[], cause: unknown) {
    super(`Element delivery ${stage} failed: ${ids.join(', ')}`, {cause});
    this.name = 'DeliveryError'; this.stage = stage; this.ids = Object.freeze([...ids]);
  }
}
/** Validate only supported, serializable delivery identity; this never imports components. */
export function validateDeliveryIdentity(identity: DeliveryIdentity): void {
  if (!identity || typeof identity !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(identity))
    || Object.getOwnPropertySymbols(identity).length || Object.values(Object.getOwnPropertyDescriptors(identity)).some(property => !('value' in property) || !property.enumerable)
    || !hasDeliveryIdentityValues(identity)
    || Object.getOwnPropertyNames(identity).length !== 3 || Object.keys(identity).some(key => !['schemaVersion', 'id', 'version'].includes(key))) {
    throw new DeliveryError('profile', [], new Error('Invalid or unsupported delivery identity.'));
  }
}
/** Both sides may omit identity for legacy eager islands; otherwise exact agreement is required. */
export function assertDeliveryIdentity(expected: DeliveryIdentity | undefined, actual: DeliveryIdentity | undefined): void {
  if (expected !== undefined) validateDeliveryIdentity(expected);
  if (actual !== undefined) validateDeliveryIdentity(actual);
  if (Boolean(expected) !== Boolean(actual) || expected && actual && (expected.schemaVersion !== actual.schemaVersion || expected.id !== actual.id || expected.version !== actual.version)) {
    throw new DeliveryError('profile', [expected?.id ?? '(absent)', actual?.id ?? '(absent)'], new Error('Delivery identities do not agree.'));
  }
}
/** Consumer-owned, immutable delivery policy. The en-reve namespace is reserved for library profiles. */
export function createDeliveryProfile(options: DeliveryProfileOptions): DeliveryProfile { return createProfile(options); }
/** Fetch/evaluate only. Registration, construction, readiness and intent remain with the owner. */
export function prepareDelivery(profile: DeliveryProfile, featureIds: readonly string[], options?: DefinitionLoadOptions): Promise<void> {
  return prepareProfile(profile, featureIds, options);
}

/** Compact serializable assessment; complete audit receipts remain in the tooling inventory. */
export interface DeliveryCatalogFeature {
  readonly id: string;
  readonly version: string;
  readonly disposition: DeliveryDisposition;
  readonly support: string;
  readonly owner: string;
  readonly deferredCosts: readonly DeliveryCost[];
  readonly trigger: string;
  readonly fallback: string;
  readonly prerequisites: readonly string[];
}
export interface DeliveryCatalogProfile extends DeliveryIdentity {
  readonly entryOverrides: Readonly<Record<string, string>>;
  readonly initialProperties: readonly DeliveryInitialProperties[];
  readonly featureIds: readonly string[];
}
export interface DeliveryCatalogComponent {
  readonly tag: string;
  readonly entry: string;
  readonly dependencies: readonly string[];
  readonly profiles: readonly string[];
  readonly features: readonly DeliveryCatalogFeature[];
}
export interface DeliveryCatalog {
  readonly schemaVersion: 1;
  readonly profiles: readonly DeliveryCatalogProfile[];
  readonly components: readonly DeliveryCatalogComponent[];
}
