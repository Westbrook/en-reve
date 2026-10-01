import {createDefinitionPreparation, type DefinitionLoaders, type DefinitionLoadOptions} from '../lazy-loader.js';
import {DeliveryError, type DeliveryIdentity, type DeliveryFeature, type DeliveryProfile, type DeliveryProfileOptions, type DeliveryInitialProperties} from '../delivery.js';

interface ManifestSnapshot { readonly names: readonly string[]; readonly loaders: DefinitionLoaders; }
// Each caller-owned manifest has one immutable identity. No DOM, registry or string-keyed global catalog is retained.
const manifests = new WeakMap<DefinitionLoaders, ManifestSnapshot>();
interface Binding { readonly loaders: DefinitionLoaders; readonly tags: readonly string[]; }
const profiles = new WeakMap<DeliveryProfile, ReadonlyMap<string, Binding>>();
const tagPattern = /^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/;
const costs = new Set(['component-loading', 'registration', 'construction', 'optional-code', 'hydration', 'data', 'virtualization']);
const dispositions = new Set(['implemented', 'already-conditional', 'essential-eager', 'not-applicable', 'rejected-with-evidence', 'candidate', 'needs-design', 'unassessed']);
const failure = (message: string): never => { throw new DeliveryError('profile', [], new Error(message)); };
function record(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    || Object.getOwnPropertySymbols(value).length || Object.values(Object.getOwnPropertyDescriptors(value)).some(property => !('value' in property) || !property.enumerable)) failure(`${label} must be a plain data object.`);
}
function dataArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || Object.getOwnPropertySymbols(value).length) return false;
  const properties = Object.getOwnPropertyDescriptors(value);
  return Object.keys(properties).length === value.length + 1
    && Object.entries(properties).every(([key, property]) => 'value' in property && (key === 'length' || /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < value.length));
}
function strings(value: unknown, label: string): readonly string[] {
  if (!dataArray(value) || value.some(item => typeof item !== 'string' || !item) || new Set(value).size !== value.length) failure(`${label} must contain unique strings.`);
  return Object.freeze([...value as string[]]);
}
function snapshotLoaders(input: DefinitionLoaders): DefinitionLoaders {
  record(input, 'Definition loaders');
  const names = Object.keys(input).sort();
  if (names.some(tag => !tagPattern.test(tag) || typeof input[tag] !== 'function')) failure('Definition loaders require valid element tags and functions.');
  const existing = manifests.get(input);
  if (existing) {
    if (names.length !== existing.names.length || names.some((tag, index) => tag !== existing.names[index] || input[tag] !== existing.loaders[tag])) failure('A captured definition manifest was mutated; supply a new manifest.');
    return existing.loaders;
  }
  const loaders = Object.isFrozen(input) ? input : Object.freeze({...input});
  manifests.set(input, {names: Object.freeze(names), loaders});
  return loaders;
}
function featureSnapshot(input: DeliveryFeature, namespace: string): DeliveryFeature {
  record(input, 'Delivery feature');
  const {id, version, disposition, owner, fallback} = input;
  if (typeof id !== 'string' || !id.startsWith(`${namespace}/`) || !/^[a-z][a-z0-9.-]*(?:\/[a-z][a-z0-9._-]*)+$/.test(id)
    || typeof version !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(version)
    || !dispositions.has(disposition) || !['element', 'application', 'ssr'].includes(owner) || typeof fallback !== 'string' || !fallback) failure('Invalid delivery feature identity or ownership.');
  const deferredCosts = strings(input.deferredCosts, 'Deferred costs');
  const definitionTags = strings(input.definitionTags, 'Definition tags');
  const prerequisites = strings(input.prerequisites, 'Prerequisites');
  if (deferredCosts.some(cost => !costs.has(cost)) || definitionTags.some(tag => !tagPattern.test(tag))) failure('Invalid deferred cost or definition tag.');
  return Object.freeze({id, version, disposition, owner, fallback, deferredCosts, definitionTags, prerequisites}) as DeliveryFeature;
}
function propertySnapshot(input: DeliveryInitialProperties, loaders: DefinitionLoaders): DeliveryInitialProperties {
  record(input, 'Initial properties'); record(input.properties, 'Initial property values');
  if (typeof input.tag !== 'string' || !Object.hasOwn(loaders, input.tag)) failure('Initial properties require an allowlisted element tag.');
  const properties: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input.properties)) {
    if (!/^[A-Za-z_$][\w$]*$/.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)
      || !(value === null || ['string', 'boolean'].includes(typeof value) || typeof value === 'number' && Number.isFinite(value))) failure('Initial properties must contain JSON scalar values.');
    properties[key] = value;
  }
  return Object.freeze({tag: input.tag, properties: Object.freeze(properties)});
}
/** Internal value check: arbitrary callers still require the public data-shape validation. */
export function hasDeliveryIdentityValues(identity: DeliveryIdentity): boolean {
  return identity.schemaVersion === 1
    && typeof identity.id === 'string' && /^[a-z][a-z0-9.-]*(?:\/[a-z][a-z0-9._-]*)+$/.test(identity.id)
    && typeof identity.version === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(identity.version);
}
/** Library-only construction; supported consumers use createDeliveryProfile from delivery.js. */
export function createProfile(options: DeliveryProfileOptions, library = false): DeliveryProfile {
  record(options, 'Delivery profile');
  const identity = {schemaVersion: options.schemaVersion, id: options.id, version: options.version};
  if (!hasDeliveryIdentityValues(identity)) failure('Invalid or unsupported delivery identity.');
  if (!library && options.id.startsWith('en-reve/')) failure('The en-reve delivery namespace is reserved.');
  const namespace = options.id.split('/')[0]!;
  const loaders = snapshotLoaders(options.loaders);
  if (!dataArray(options.features)) failure('Delivery features must be an array.');
  const features = Object.freeze(options.features.map(feature => featureSnapshot(feature, namespace)));
  if (new Set(features.map(feature => feature.id)).size !== features.length) failure('Duplicate delivery feature ID.');
  const initial = options.initialProperties ?? [];
  if (!dataArray(initial)) failure('Initial properties must be an array.');
  const initialProperties = Object.freeze(initial.map(item => propertySnapshot(item, loaders)));
  if (new Set(initialProperties.map(item => item.tag)).size !== initialProperties.length) failure('Duplicate initial property tag.');
  const preparations = options.preparations ?? {};
  record(preparations, 'Feature preparations');
  if (Object.keys(preparations).some(id => !features.some(feature => feature.id === id))) failure('Unknown feature preparation binding.');
  const bindings = new Map<string, Binding>();
  for (const feature of features) {
    const manifest = Object.hasOwn(preparations, feature.id) ? snapshotLoaders(preparations[feature.id]!) : loaders;
    if (feature.definitionTags.some(tag => !Object.hasOwn(manifest, tag))) failure(`Feature ${feature.id} has a missing definition loader.`);
    if (Object.hasOwn(preparations, feature.id) && (feature.disposition !== 'implemented' || !feature.definitionTags.length)) failure('Preparation binding requires an implemented definition feature.');
    bindings.set(feature.id, {loaders: manifest, tags: feature.definitionTags});
  }
  const profile = Object.freeze({...identity, identity: Object.freeze(identity), loaders, features, initialProperties});
  profiles.set(profile, bindings);
  return profile;
}
export async function prepareProfile(profile: DeliveryProfile, featureIds: readonly string[], options?: DefinitionLoadOptions): Promise<void> {
  const bindings = profiles.get(profile);
  if (!bindings) throw new DeliveryError('profile', [], new Error('Use an explicit delivery profile factory or built-in selector.'));
  if (!dataArray(featureIds) || featureIds.some(id => typeof id !== 'string')) throw new DeliveryError('lookup', [], new Error('Feature requests require explicit IDs.'));
  const selected = [...new Set<string>(featureIds as readonly string[])].map(id => {
    const feature = profile.features.find(item => item.id === id), binding = bindings.get(id);
    if (!feature || !binding || feature.disposition !== 'implemented' || !binding.tags.length
      || !feature.deferredCosts.some(cost => cost === 'component-loading' || cost === 'optional-code')) {
      throw new DeliveryError('lookup', [id], new Error('Feature has no supported code preparation binding.'));
    }
    return binding;
  });
  // Resolve the complete request before starting any imports; coalesce tags sharing one manifest.
  const requests = new Map<DefinitionLoaders, Set<string>>();
  for (const binding of selected) {
    let tags = requests.get(binding.loaders); if (!tags) requests.set(binding.loaders, tags = new Set());
    for (const tag of binding.tags) tags.add(tag);
  }
  await Promise.all([...requests].map(([loaders, tags]) => createDefinitionPreparation(loaders).load([...tags], options)));
}
