import {createDefinitionLoader, createDefinitionPreparation, type DefinitionLoaders} from '@en-reve/elements/lazy-loader.js';
import {createDeliveryProfile, prepareDelivery, validateDeliveryIdentity, assertDeliveryIdentity, type DeliveryIdentity, type DeliveryProfile} from '@en-reve/elements/delivery.js';
import {selectDeliveryProfile} from '@en-reve/elements/delivery-profiles.js';
import {datePickerSingleDeferredProfile} from '@en-reve/elements/delivery-date-picker.js';
import {deliveryCatalog} from '@en-reve/elements/delivery-catalog.js';
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {type HydrationManifest, type HydrationModule} from '@en-reve/ssr/client.js';
import {type ScopedRenderEntry, type ScopedRenderModule, type ScopedRenderResult} from '@en-reve/ssr/scoped.js';

const identity: DeliveryIdentity = {schemaVersion: 1, id: 'consumer/commands', version: '1'};
const loaders: DefinitionLoaders = {'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js').then(module => module.commandPaletteDefinition)};
const custom = createDeliveryProfile({...identity, loaders, features: [{id: 'consumer/commands/root', version: '1', owner: 'application', disposition: 'implemented', deferredCosts: ['component-loading', 'registration', 'construction'], definitionTags: ['en-command-palette'], prerequisites: ['Application owns the empty root'], fallback: 'Native commands remain usable'}]});
const full: DeliveryProfile = selectDeliveryProfile();
const explicit = selectDeliveryProfile('en-reve/date-picker-single-deferred');
const selective: DeliveryProfile = datePickerSingleDeferredProfile;
const scope = createElementScope({document});
void createDefinitionPreparation(loaders).load(['en-command-palette']);
void createDefinitionLoader(scope.registry, custom.loaders).ensure(['en-command-palette']);
void prepareDelivery(explicit, ['en-reve/en-date-picker/calendar'], {retry: true});
void prepareDelivery(selective, ['en-reve/en-date-picker/calendar']);
validateDeliveryIdentity(identity);
assertDeliveryIdentity(identity, identity);
assertDeliveryIdentity(selective.identity, explicit.identity);
void full.initialProperties;
void deliveryCatalog.schemaVersion;
const manifest: HydrationManifest = {id: 'commands', key: 'commands', version: '1', tags: ['en-command-palette'], delivery: custom.identity};
const hydration: HydrationModule = {version: '1', delivery: identity, definitions: [], template: () => '', ready: () => undefined};
const server: ScopedRenderModule = hydration;
const entry: ScopedRenderEntry = {module: new URL('file:///fixture.mjs'), version: '1', delivery: identity};
const result: ScopedRenderResult = {html: '', key: 'commands', version: '1', tags: ['en-command-palette'], delivery: identity};
void [manifest, server, entry, result];
// @ts-expect-error Only generated profile IDs are selectable.
selectDeliveryProfile('consumer/not-allowlisted');
// @ts-expect-error Delivery metadata has a literal schema version.
const unsupported: DeliveryIdentity = {schemaVersion: 2, id: 'consumer/commands', version: '1'};
void unsupported;
// @ts-expect-error Profile requirements cannot be mutated after selection.
selective.initialProperties.push({tag: 'en-date-picker', properties: {calendarLoading: 'eager'}});
// @ts-expect-error The loader still requires an explicit target registry.
createDefinitionLoader(loaders);
