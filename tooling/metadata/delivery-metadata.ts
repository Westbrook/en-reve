import {readFile} from 'node:fs/promises';
import {basename, resolve} from 'node:path';
import type {SourceDefinition} from './definition-graph.ts';
import {deliveryPolicy} from './delivery-policy.ts';

const dispositions = new Set(['implemented', 'already-conditional', 'essential-eager', 'not-applicable', 'rejected-with-evidence', 'candidate', 'needs-design', 'unassessed']);
const costs = new Set(['component-loading', 'registration', 'construction', 'optional-code', 'hydration', 'data', 'virtualization']);
function fail(message: string): never { throw new Error(`Delivery metadata: ${message}`); }
function uniqueStrings(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item) || new Set(value).size !== value.length) fail(`${label} must be unique nonempty strings.`);
}
/** Join the exhaustive authored assessment with the strict canonical graph, without executing elements. */
export async function deliveryMetadataOutputs(definitions: readonly SourceDefinition[]): Promise<Record<string, string>> {
  const inventory = JSON.parse(await readFile(resolve(import.meta.dirname, 'delivery-inventory.json'), 'utf8'));
  if (inventory.schemaVersion !== 1 || !Array.isArray(inventory.components)) fail('Unsupported inventory schema.');
  const tags = definitions.map(definition => definition.tagName).sort();
  const inventoryTags = inventory.components.map((component: any) => component.tag).sort();
  if (JSON.stringify(tags) !== JSON.stringify(inventoryTags)) fail('Inventory must cover the exact canonical tag set once.');
  const ids = new Set<string>();
  for (const component of inventory.components) {
    const definition = definitions.find(item => item.tagName === component.tag)!;
    if (JSON.stringify(component.canonicalDependencies) !== JSON.stringify(definition.dependencies.map(child => child.tagName))) fail(`Stale canonical dependencies for ${component.tag}.`);
    if (!Array.isArray(component.features) || !component.features.length) fail(`Missing feature assessment for ${component.tag}.`);
    for (const feature of component.features) {
      if (typeof feature.id !== 'string' || !feature.id.startsWith(`en-reve/${component.tag}/`) || ids.has(feature.id) || !Number.isSafeInteger(feature.version) || feature.version < 1) fail(`Invalid or duplicate feature identity: ${feature.id}`);
      ids.add(feature.id);
      if (!dispositions.has(feature.disposition) || !['support', 'owner', 'trigger', 'fallback'].every(key => typeof feature[key] === 'string' && feature[key])) fail(`Incomplete discovery feature: ${feature.id}`);
      uniqueStrings(feature.deferredCosts, `${feature.id} costs`); uniqueStrings(feature.prerequisites, `${feature.id} prerequisites`);
      if (feature.deferredCosts.some((cost: string) => !costs.has(cost))) fail(`Unclassified deferred cost: ${feature.id}`);
    }
  }
  for (const profile of deliveryPolicy.profiles) {
    for (const tag of Object.keys(profile.entryOverrides)) if (!tags.includes(tag)) fail(`Unknown profile tag: ${tag}`);
    for (const id of profile.featureIds) if (!ids.has(id)) fail(`Profile feature missing from inventory: ${id}`);
  }
  for (const feature of deliveryPolicy.features) {
    if (!ids.has(feature.id)) fail(`Preparation feature missing from inventory: ${feature.id}`);
    const assessment = inventory.components.flatMap((component: any) => component.features).find((item: any) => item.id === feature.id);
    if (assessment.disposition !== 'implemented' || assessment.support !== 'supported' || String(assessment.version) !== feature.version
      || JSON.stringify([...assessment.deferredCosts].sort()) !== JSON.stringify([...feature.deferredCosts].sort())) fail(`Preparation policy disagrees with inventory: ${feature.id}`);
    for (const tag of feature.definitionTags) if (!tags.includes(tag)) fail(`Preparation uses unknown definition: ${tag}`);
  }
  const profileData = deliveryPolicy.profiles.map(profile => ({schemaVersion: deliveryPolicy.schemaVersion, ...profile}));
  const catalog = {
    schemaVersion: deliveryPolicy.schemaVersion,
    profiles: profileData,
    components: definitions.map(definition => {
      const component = inventory.components.find((item: any) => item.tag === definition.tagName);
      return {tag: definition.tagName, entry: `@en-reve/elements/definitions/${basename(definition.source, '.ts')}.js`, dependencies: definition.dependencies.map(child => child.tagName), profiles: profileData.map(profile => profile.id),
        features: component.features.map(({id, version, disposition, support, owner, deferredCosts, trigger, fallback, prerequisites}: any) => ({id, version: String(version), disposition, support, owner, deferredCosts, trigger, fallback, prerequisites}))};
    }),
  };
  const simpleProfile = (profile: typeof deliveryPolicy.profiles[number]) => ({schemaVersion: deliveryPolicy.schemaVersion, id: profile.id, version: profile.version, initialProperties: profile.initialProperties});
  const profiles = {eager: simpleProfile(deliveryPolicy.profiles[0]), datePickerSingleDeferred: simpleProfile(deliveryPolicy.profiles[1])};
  const features = {datePickerCalendar: deliveryPolicy.features[0], commandPaletteRoot: deliveryPolicy.features[1]};
  const banner = '// Generated by tooling/metadata/lazy-manifest.ts. Edit the delivery policy/inventory, not this file.\n';
  // Each generated record is inert owned data. Separate pure initializers let a
  // selective profile omit unrelated records without weakening runtime validation.
  const record = (name: string, type: string, value: unknown) =>
    `export const ${name}: ${type} = /* @__PURE__ */ freezeDeliveryData(${JSON.stringify(value, null, 2)});\n`;
  const policySource = `${banner}import type {DeliveryFeature, DeliveryIdentity, DeliveryInitialProperties} from '../delivery.js';\nimport {freezeDeliveryData} from './delivery-data.js';\nexport interface ProfilePolicy extends DeliveryIdentity { readonly initialProperties: readonly DeliveryInitialProperties[]; }\n`
    + record('eagerProfilePolicy', 'ProfilePolicy', profiles.eager)
    + record('datePickerSingleDeferredPolicy', 'ProfilePolicy', profiles.datePickerSingleDeferred)
    + record('datePickerCalendarFeature', 'DeliveryFeature', features.datePickerCalendar)
    + record('commandPaletteRootFeature', 'DeliveryFeature', features.commandPaletteRoot)
    + 'export const deliveryProfiles: { readonly eager: ProfilePolicy; readonly datePickerSingleDeferred: ProfilePolicy } = /* @__PURE__ */ freezeDeliveryData({eager: eagerProfilePolicy, datePickerSingleDeferred: datePickerSingleDeferredPolicy});\n'
    + 'export const deliveryFeatures: { readonly datePickerCalendar: DeliveryFeature; readonly commandPaletteRoot: DeliveryFeature } = /* @__PURE__ */ freezeDeliveryData({datePickerCalendar: datePickerCalendarFeature, commandPaletteRoot: commandPaletteRootFeature});\n';
  return {
    'src/delivery-catalog.ts': `${banner}import type {DeliveryCatalog} from './delivery.js';\nimport {freezeDeliveryData} from './internal/delivery-data.js';\n\n/** Inert discovery only; assessment does not imply a preparation or activation capability. */\nexport const deliveryCatalog: DeliveryCatalog = freezeDeliveryData<DeliveryCatalog>(${JSON.stringify(catalog, null, 2)});\n`,
    'src/internal/delivery-policy.ts': policySource,
  };
}
