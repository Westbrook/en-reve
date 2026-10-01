import {createElementScope, type ElementScope, type ElementScopeCapabilities, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createDefinitionLoader, DefinitionLoadError, type DefinitionLoader, type DefinitionLoaders} from '@en-reve/elements/lazy-loader.js';
import {createElementLoader} from '@en-reve/elements/lazy.js';
import {createElementActivation, type ElementActivation, type ElementActivationOptions, type ElementActivationState} from '@en-reve/elements/activation.js';
import {createHydrationIsland, type HydrationIsland, type HydrationModule, type HydrationState} from '@en-reve/ssr/client.js';
import {createScopedRenderer, renderIslandMarkup, serializeHydrationManifest, type ScopedRenderer, type ScopedRenderModule, type HydrationManifest} from '@en-reve/ssr/scoped.js';
import {loaders} from './recipes.js';
const scope: ElementScope = createElementScope({document});
const caps: ElementScopeCapabilities = elementScopeCapabilities(document);
const loader: DefinitionLoader = createDefinitionLoader(scope.registry, loaders satisfies DefinitionLoaders);
void createElementLoader(scope.registry); void caps;
void loader.load(['en-card'], {retry: true}); void loader.ensure(['en-card']);
const options: ElementActivationOptions = {scope, loaders, root: scope.createElement('section'), policy: 'group', tags: ['en-card'], ready: (_, signal) => signal.throwIfAborted()};
const activation: ElementActivation = createElementActivation(options);
const state: ElementActivationState = activation.state; void [state, activation.error];
void activation.load(); void activation.activate({retry:true}); activation.cancel(); activation.dispose();
void scope.get('en-card'); void scope.whenDefined('en-card'); scope.upgrade(options.root); scope.initialize(options.root);
// @ts-expect-error Null is a DOM association, not an ElementScope registry option.
createElementScope({document, registry: null});
// @ts-expect-error Loader promises have no cancellation option.
loader.ensure(['en-card'], {signal: new AbortController().signal});
const module: HydrationModule & ScopedRenderModule = {version:'v1', definitions: [], template: () => '', ready: () => {}};
const manifest: HydrationManifest = {id:'island', key:'app', version:'v1', tags:['en-card']};
const island: HydrationIsland = createHydrationIsland({root: options.root, snapshot: {}, manifest, loaders:{app:async()=>module}});
const hydrationState: HydrationState = island.state; void [hydrationState, island.error, island.mode];
void island.load(); void island.activate({retry:true}); island.dispose();
// @ts-expect-error Hydration lifetime exposes dispose, not activation.cancel.
island.cancel();
const renderer: ScopedRenderer = createScopedRenderer({app:{module:new URL('./ssr-module.js', import.meta.url), version:'v1'}}, {concurrency:1,maxPending:2,timeoutMs:30000});
void renderer.render({key:'app',snapshot:{}}, {signal:new AbortController().signal}).then(result => {
  const {manifest} = renderIslandMarkup(result,'island','global'); serializeHydrationManifest(manifest);
}); renderer.dispose();
void new DefinitionLoadError('lookup', ['unknown'], new Error()).stage;
