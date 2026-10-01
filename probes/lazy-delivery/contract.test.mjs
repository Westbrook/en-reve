import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDefinitionLoader, createDefinitionPreparation, DefinitionLoadError} from '@en-reve/elements/lazy-loader.js';
import * as definitionLifecycle from '@en-reve/primitives/interactions/registration.js';
import {createDeliveryProfile, prepareDelivery, validateDeliveryIdentity, assertDeliveryIdentity, DeliveryError} from '@en-reve/elements/delivery.js';
import {selectDeliveryProfile} from '@en-reve/elements/delivery-profiles.js';
import {datePickerSingleDeferredProfile} from '@en-reve/elements/delivery-date-picker.js';
import {deliveryCatalog} from '@en-reve/elements/delivery-catalog.js';
import {elementLoaders} from '@en-reve/elements/lazy-manifest.js';

const definition = (tagName, dependencies = []) => ({tagName, elementClass: class {}, dependencies});
const registry = () => {const values = new Map(), calls = []; return {values, calls, get: tag => values.get(tag), define(tag, ctor) {calls.push(tag); values.set(tag, ctor);}};};
const feature = (id = 'fixture/tools/panel', tags = ['fixture-panel'], extra = {}) => ({id, version: '1', disposition: 'implemented', owner: 'application', deferredCosts: ['component-loading'], definitionTags: tags, fallback: 'The native editor stays usable.', prerequisites: [], ...extra});
const options = (loaders, extra = {}) => ({schemaVersion: 1, id: 'fixture/tools', version: '1', loaders, features: [feature()], ...extra});

test('packed discovery and selectors are serializable, immutable and inert without a DOM', () => {
  assert.equal(globalThis.document, undefined);
  assert.equal(globalThis.customElements, undefined);
  assert.equal(globalThis.litElementVersions, undefined);
  assert.equal(deliveryCatalog.schemaVersion, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(deliveryCatalog)), deliveryCatalog);
  assert.deepEqual(deliveryCatalog.components.map(row => row.tag).sort(), Object.keys(elementLoaders).sort());
  assert.equal(new Set(deliveryCatalog.components.map(row => row.tag)).size, deliveryCatalog.components.length);
  const eager = selectDeliveryProfile();
  assert.equal(eager, selectDeliveryProfile('en-reve/eager'));
  assert.equal(eager.loaders, elementLoaders);
  const fullDeferred = selectDeliveryProfile('en-reve/date-picker-single-deferred');
  assert.equal(fullDeferred, selectDeliveryProfile('en-reve/date-picker-single-deferred'));
  assert.deepEqual(Object.keys(fullDeferred.loaders).sort(), Object.keys(elementLoaders).sort());
  assert.equal(fullDeferred.loaders['en-date-picker'], datePickerSingleDeferredProfile.loaders['en-date-picker']);
  for (const tag of Object.keys(elementLoaders)) if (tag !== 'en-date-picker') assert.equal(fullDeferred.loaders[tag], elementLoaders[tag]);
  assert.deepEqual(Object.keys(datePickerSingleDeferredProfile.loaders), ['en-date-picker']);
  assert.ok(Object.isFrozen(eager));
  assert.ok(Object.isFrozen(eager.identity));
  assert.deepEqual(JSON.parse(JSON.stringify(eager.identity)), {schemaVersion: 1, id: 'en-reve/eager', version: '1'});
  assert.throws(() => validateDeliveryIdentity(eager), {stage: 'profile'});
  assert.ok(Object.isFrozen(datePickerSingleDeferredProfile.initialProperties));
  assert.deepEqual(datePickerSingleDeferredProfile.initialProperties, [{tag: 'en-date-picker', properties: {calendarLoading: 'deferred', selection: 'single'}}]);
});

test('elements loading aliases preserve primitive identity and share import and registry requests', async () => {
  assert.equal(createDefinitionLoader, definitionLifecycle.createDefinitionLoader);
  assert.equal(createDefinitionPreparation, definitionLifecycle.createDefinitionPreparation);
  assert.equal(DefinitionLoadError, definitionLifecycle.DefinitionLoadError);
  let attempts = 0;
  const failure = Error('intentional offline');
  const panel = definition('fixture-panel');
  const loaders = Object.freeze({'fixture-panel': async () => {
    if (++attempts === 1) throw failure;
    return panel;
  }});
  const target = registry();
  const primitiveLoader = definitionLifecycle.createDefinitionLoader(target, loaders);
  const elementLoader = createDefinitionLoader(target, loaders);
  await assert.rejects(definitionLifecycle.createDefinitionPreparation(loaders).load(['fixture-panel']), error => {
    assert.ok(error instanceof DefinitionLoadError);
    assert.ok(error instanceof definitionLifecycle.DefinitionLoadError);
    assert.equal(error.stage, 'load');
    assert.equal(error.cause, failure);
    return true;
  });
  await assert.rejects(elementLoader.load(['fixture-panel']), {stage: 'load'});
  assert.equal(attempts, 1);
  const [prepared, loaded] = await Promise.all([
    createDefinitionPreparation(loaders).load(['fixture-panel'], {retry: true}),
    primitiveLoader.load(['fixture-panel']),
  ]);
  assert.equal(attempts, 2);
  assert.equal(prepared[0], panel);
  assert.equal(loaded[0], panel);
  assert.deepEqual(target.calls, []);
  const primitiveRequest = primitiveLoader.ensure(['fixture-panel']);
  const elementRequest = elementLoader.ensure(['fixture-panel']);
  assert.equal(primitiveRequest, elementRequest);
  await primitiveRequest;
  assert.equal(attempts, 2);
  assert.deepEqual(target.calls, ['fixture-panel']);
  assert.equal(target.get('fixture-panel'), panel.elementClass);
});

test('identity and profile failures preflight every request before loading', async () => {
  let imports = 0;
  const loaders = {'fixture-panel': async () => {imports++; return definition('fixture-panel');}};
  const profile = createDeliveryProfile(options(loaders));
  for (const ids of [['fixture/tools/panel', '__proto__'], ['fixture/tools/panel', 'fixture/tools/missing']]) {
    await assert.rejects(prepareDelivery(profile, ids), {stage: 'lookup'});
  }
  for (const change of [
    {id: 'en-reve/collision'}, {schemaVersion: 2}, {version: ''},
    {features: [feature(), feature()]},
    {features: [feature(), feature('fixture/tools/panel', ['fixture-panel'], {version: '2'})]},
    {features: [feature('other/tools/panel')]},
    {features: [feature('fixture/tools/panel', ['fixture-missing'])]},
    {preparations: {'fixture/tools/unused': loaders}},
  ]) assert.throws(() => createDeliveryProfile(options(loaders, change)), {stage: 'profile'});
  assert.throws(() => selectDeliveryProfile('__proto__'), {stage: 'lookup'});
  assert.throws(() => validateDeliveryIdentity({schemaVersion: 2, id: 'fixture/tools', version: '1'}));
  const identity = profile.identity;
  assert.doesNotThrow(() => assertDeliveryIdentity(identity, {...identity}));
  assert.throws(() => assertDeliveryIdentity(identity, {...identity, version: '2'}));
  assert.throws(() => assertDeliveryIdentity(identity, undefined));
  assert.throws(() => assertDeliveryIdentity(undefined, identity));
  assert.doesNotThrow(() => assertDeliveryIdentity(undefined, undefined));
  assert.equal(imports, 0);
});

test('identity values reject equally through public validation and profile creation before loading', () => {
  let imports = 0, coercions = 0;
  const loaders = {'fixture-panel': async () => {imports++; return definition('fixture-panel');}};
  const base = {schemaVersion: 1, id: 'fixture/tools', version: '1'};
  const executable = {toString() {coercions++; return 'fixture/tools';}};
  const checkFailure = error => {
    assert.equal(error.constructor, DeliveryError);
    assert.equal(error.name, 'DeliveryError');
    assert.equal(error.stage, 'profile');
    assert.deepEqual(error.ids, []);
    assert.ok(Object.isFrozen(error.ids));
    assert.equal(error.message, 'Element delivery profile failed: ');
    assert.equal(error.cause.constructor, Error);
    assert.equal(error.cause.message, 'Invalid or unsupported delivery identity.');
    return true;
  };
  for (const change of [
    {schemaVersion: 2}, {schemaVersion: '1'}, {schemaVersion: undefined},
    {id: ''}, {id: 'fixture'}, {id: 'Fixture/tools'}, {id: 'fixture//tools'},
    {id: 1}, {id: executable}, {id: Symbol('invalid')},
    {version: ''}, {version: 'bad value'}, {version: '/1'}, {version: 1},
    {version: executable}, {version: undefined},
  ]) {
    assert.throws(() => validateDeliveryIdentity({...base, ...change}), checkFailure);
    assert.throws(() => createDeliveryProfile(options(loaders, change)), checkFailure);
  }
  for (const change of [{}, {id: 'fixture/tools/panel', version: 'v1_2-3.4'}]) {
    const identity = {...base, ...change};
    assert.doesNotThrow(() => validateDeliveryIdentity(identity));
    const profile = createDeliveryProfile(options(loaders, change));
    assert.deepEqual(profile.identity, identity);
    assert.ok(Object.isFrozen(profile.identity));
    assert.throws(() => {profile.identity.version = 'mutated';}, TypeError);
  }
  assert.equal(imports, 0);
  assert.equal(coercions, 0);
});

test('identity factoring retains public shape checks and profile record rejection without getters', () => {
  const identity = {schemaVersion: 1, id: 'fixture/tools', version: '1'};
  const profile = options({}, {features: []});
  let reads = 0;
  const accessor = source => Object.defineProperty({...source}, 'id', {enumerable: true, get() {reads++; return 'fixture/tools';}});
  const symbol = source => Object.assign({...source}, {[Symbol('hidden')]: true});
  const inherited = source => Object.assign(Object.create({inherited: true}), source);
  for (const transform of [accessor, symbol, inherited]) {
    assert.throws(() => validateDeliveryIdentity(transform(identity)), error => {
      assert.equal(error.constructor, DeliveryError);
      assert.equal(error.cause.message, 'Invalid or unsupported delivery identity.');
      return true;
    });
    assert.throws(() => createDeliveryProfile(transform(profile)), error => {
      assert.equal(error.constructor, DeliveryError);
      assert.equal(error.cause.message, 'Delivery profile must be a plain data object.');
      return true;
    });
  }
  assert.doesNotThrow(() => validateDeliveryIdentity(Object.assign(Object.create(null), identity)));
  assert.deepEqual(createDeliveryProfile(Object.assign(Object.create(null), profile)).identity, identity);
  assert.equal(reads, 0);
});

test('public identity validation preserves value read order and short-circuiting', () => {
  const base = {schemaVersion: 1, id: 'fixture/tools', version: '1'};
  for (const [change, expected] of [
    [{schemaVersion: 2}, ['schemaVersion']],
    [{id: 1}, ['schemaVersion', 'id']],
    [{id: 'invalid'}, ['schemaVersion', 'id', 'id']],
    [{version: 1}, ['schemaVersion', 'id', 'id', 'version']],
    [{version: 'invalid value'}, ['schemaVersion', 'id', 'id', 'version', 'version']],
    [{}, ['schemaVersion', 'id', 'id', 'version', 'version']],
  ]) {
    const reads = [], value = new Proxy({...base, ...change}, {
      get(target, key, receiver) {reads.push(key); return Reflect.get(target, key, receiver);},
    });
    if (Object.keys(change).length) assert.throws(() => validateDeliveryIdentity(value), {stage: 'profile'});
    else assert.doesNotThrow(() => validateDeliveryIdentity(value));
    assert.deepEqual(reads, expected);
  }
  const failure = Error('identity proxy read');
  const value = new Proxy(base, {get(target, key, receiver) {
    if (key === 'id') throw failure;
    return Reflect.get(target, key, receiver);
  }});
  assert.throws(() => validateDeliveryIdentity(value), error => error === failure);
});

test('identity validation and public SSR serialization reject hidden data and hidden toJSON without evaluation', async () => {
  const {serializeHydrationManifest} = await import('@en-reve/ssr/scoped.js');
  const identity = {schemaVersion: 1, id: 'fixture/tools', version: '1'};
  let executed = 0;
  const hiddenJSON = Object.defineProperty({...identity}, 'toJSON', {value() {executed++; return {...identity, version: '2'};}});
  const hiddenData = Object.defineProperty({...identity}, 'hidden', {value: 'unserialized'});
  const hiddenVersion = Object.defineProperty({...identity}, 'version', {value: '1', enumerable: false});
  for (const delivery of [hiddenJSON, hiddenData, hiddenVersion]) {
    assert.throws(() => validateDeliveryIdentity(delivery), {stage: 'profile'});
    assert.throws(() => serializeHydrationManifest({id: 'tools', key: 'tools', version: '1', tags: ['fixture-panel'], delivery}), {stage: 'profile'});
  }
  assert.equal(executed, 0);
  const serialized = serializeHydrationManifest({id: 'tools', key: 'tools', version: '1', tags: ['fixture-panel'], delivery: identity});
  assert.deepEqual(JSON.parse(serialized).delivery, identity);
});

test('hidden loader keys reject the full profile before any mixed feature preparation can import', () => {
  let imports = 0;
  const good = async () => {imports++; return definition('fixture-panel');};
  for (const hidden of [async () => {imports++; return definition('fixture-hidden');}, null]) {
    const loaders = Object.freeze(Object.defineProperty({'fixture-panel': good}, 'fixture-hidden', {value: hidden}));
    assert.throws(() => createDeliveryProfile(options(loaders, {features: [feature('fixture/tools/panel', ['fixture-panel', 'fixture-hidden'])]})), {stage: 'profile'});
    assert.throws(() => createDeliveryProfile(options({'fixture-panel': good}, {
      features: [feature(), feature('fixture/tools/hidden', ['fixture-hidden'])],
      preparations: {'fixture/tools/hidden': loaders},
    })), {stage: 'profile'});
  }
  assert.equal(imports, 0);
});

test('descriptors snapshot nested state and reject executable initial properties', () => {
  const loaders = {'fixture-panel': async () => definition('fixture-panel')};
  const input = options(loaders, {initialProperties: [{tag: 'fixture-panel', properties: {open: false}}]});
  const profile = createDeliveryProfile(input);
  input.features[0].definitionTags.push('fixture-other');
  input.initialProperties[0].properties.open = true;
  assert.deepEqual(profile.features[0].definitionTags, ['fixture-panel']);
  assert.equal(profile.initialProperties[0].properties.open, false);
  assert.ok(Object.isFrozen(profile.features[0].definitionTags));
  assert.ok(Object.isFrozen(profile.initialProperties[0].properties));
  assert.throws(() => createDeliveryProfile(options(loaders, {initialProperties: [{tag: 'fixture-panel', properties: {nested: {open: true}}}]})), {stage: 'profile'});
  let accessed = 0;
  const properties = Object.defineProperty({}, 'open', {enumerable: true, get() {accessed++; return true;}});
  assert.throws(() => createDeliveryProfile(options(loaders, {initialProperties: [{tag: 'fixture-panel', properties}]})), {stage: 'profile'});
  assert.equal(accessed, 0);
  let executed = 0;
  const iterator = [feature()]; iterator[Symbol.iterator] = function* () {executed++; yield feature();};
  const mapped = [feature()]; mapped.map = () => {executed++; return [feature()];};
  const sparse = new Array(1);
  const accessor = []; Object.defineProperty(accessor, 0, {get() {executed++; return feature();}, enumerable: true});
  class CustomFeatures extends Array {}
  for (const features of [iterator, mapped, sparse, accessor, new CustomFeatures(feature())]) {
    assert.throws(() => createDeliveryProfile(options(loaders, {features})), {stage: 'profile'});
  }
  assert.equal(executed, 0);
});

test('shared source manifests preserve import identity through fresh profile wrappers and registry owners', async () => {
  let imports = 0;
  const child = definition('fixture-child'), parent = definition('fixture-panel', [child]);
  const loaders = {'fixture-panel': async () => {imports++; return parent;}};
  const first = createDeliveryProfile(options(loaders)), second = createDeliveryProfile(options(loaders));
  assert.equal(first.loaders, second.loaders);
  const a = registry(), b = registry();
  await Promise.all([prepareDelivery(first, ['fixture/tools/panel']), prepareDelivery(second, ['fixture/tools/panel']), createDefinitionPreparation(first.loaders).load(['fixture-panel'])]);
  assert.equal(imports, 1);
  assert.deepEqual(a.calls, []);
  await Promise.all([createDefinitionLoader(a, first.loaders).ensure(['fixture-panel']), createDefinitionLoader(b, second.loaders).ensure(['fixture-panel'])]);
  assert.equal(imports, 1);
  assert.deepEqual(a.calls, ['fixture-child', 'fixture-panel']);
  assert.deepEqual(b.calls, a.calls);
  assert.equal(a.get('fixture-panel'), b.get('fixture-panel'));
  loaders['fixture-other'] = async () => definition('fixture-other');
  assert.throws(() => createDeliveryProfile(options(loaders)), {stage: 'profile'});
});

test('per-feature preparation remains load-only and explicit retry does not register', async () => {
  let attempts = 0;
  const optional = definition('fixture-optional');
  const featureLoaders = {'fixture-optional': async () => {if (++attempts === 1) throw Error('intentional offline'); return optional;}};
  const profile = createDeliveryProfile(options({'fixture-panel': async () => definition('fixture-panel')}, {
    features: [feature('fixture/tools/optional', ['fixture-optional'])],
    preparations: {'fixture/tools/optional': featureLoaders},
  }));
  await assert.rejects(prepareDelivery(profile, ['fixture/tools/optional']), {stage: 'load'});
  await assert.rejects(prepareDelivery(profile, ['fixture/tools/optional']), {stage: 'load'});
  assert.equal(attempts, 1);
  await prepareDelivery(profile, ['fixture/tools/optional'], {retry: true});
  assert.equal(attempts, 2);
  assert.equal(globalThis.customElements, undefined);
  const unsupported = createDeliveryProfile(options({}, {features: [feature('fixture/tools/native', [], {disposition: 'not-applicable', deferredCosts: []})]}));
  await assert.rejects(prepareDelivery(unsupported, ['fixture/tools/native']), {stage: 'lookup'});
});

test('prepared definitions still preflight registry collisions and preserve irreversible failures', async () => {
  const a = definition('fixture-a'), b = definition('fixture-b');
  const loaders = Object.freeze({'fixture-a': async () => a, 'fixture-b': async () => b});
  await createDefinitionPreparation(loaders).load(['fixture-a', 'fixture-b']);
  const conflict = registry(); conflict.values.set('fixture-b', class {});
  await assert.rejects(createDefinitionLoader(conflict, loaders).ensure(['fixture-a', 'fixture-b']), {stage: 'registration'});
  assert.deepEqual(conflict.calls, []);
  let calls = 0;
  const broken = {get: () => undefined, define() {if (++calls === 2) throw Error('native rejection');}};
  const loader = createDefinitionLoader(broken, loaders);
  await assert.rejects(loader.ensure(['fixture-a', 'fixture-b']), {stage: 'registration'});
  await assert.rejects(loader.ensure(['fixture-a', 'fixture-b'], {retry: true}), {stage: 'registration'});
  assert.equal(calls, 2);
});

test('independent profile versions can target separate registries but cannot replace a registered constructor', async () => {
  const firstDefinition = definition('fixture-panel'), secondDefinition = definition('fixture-panel');
  const first = createDeliveryProfile(options({'fixture-panel': async () => firstDefinition}));
  const second = createDeliveryProfile(options({'fixture-panel': async () => secondDefinition}, {version: '2'}));
  const a = registry(), b = registry();
  await createDefinitionLoader(a, first.loaders).ensure(['fixture-panel']);
  await createDefinitionLoader(b, second.loaders).ensure(['fixture-panel']);
  assert.notEqual(a.get('fixture-panel'), b.get('fixture-panel'));
  await assert.rejects(createDefinitionLoader(a, second.loaders).ensure(['fixture-panel']), {stage: 'registration'});
  assert.equal(a.get('fixture-panel'), firstDefinition.elementClass);
  assert.deepEqual(a.calls, ['fixture-panel']);
});
