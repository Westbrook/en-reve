import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createHydrationIsland, type HydrationIsland, type HydrationManifest, type HydrationModule} from '@en-reve/ssr/client.js';

const params = new URLSearchParams(location.search);
const manifest: HydrationManifest = JSON.parse(document.querySelector('#ssr-manifest')!.textContent!);
const receivedManifest = structuredClone(manifest);
const streamed = /^\/stream-ssr-(global|shadow)\.html$/.test(location.pathname);
const expectedDelivery = {schemaVersion: 1, id: 'fixture/ssr', version: '1'};
const host = document.getElementById(manifest.id)!;
const inert = host.querySelector<HTMLTemplateElement>(':scope > template[data-en-island-template]') ?? undefined;
const deliveryMode = document.body.dataset.deliveryMode!;
const scope = createElementScope({document, registry: deliveryMode === 'global' ? 'global' : 'auto'});
const root = inert && scope.mode === 'scoped' ? scope.attachShadow(host) : host.shadowRoot ?? host;
const counters = {loads: 0, template: 0, ready: 0, initialize: 0, register: 0, upgrade: 0};
const instrumentedScope = {
  ...scope,
  initialize(boundary: Element | ShadowRoot) { counters.initialize++; scope.initialize(boundary); },
  register(definitions: Parameters<typeof scope.register>[0]) { counters.register++; scope.register(definitions); },
  upgrade(boundary: Node) { counters.upgrade++; scope.upgrade(boundary); },
};
let release!: () => void;
const gate = new Promise<void>(resolve => { release = resolve; });
let loaded: HydrationModule | undefined;

function alteredIdentity(kind: string | undefined) {
  if (kind === 'missing') return undefined;
  return {...expectedDelivery,
    ...(kind === 'id' ? {id: 'fixture/other'} : {}),
    ...(kind === 'version' ? {version: '2'} : {}),
    ...(kind === 'schema' ? {schemaVersion: 2} : {}),
  } as HydrationModule['delivery'];
}

const [side, mismatch] = (params.get('mismatch') ?? '').split('-');
// Streamed manifest variants arrive in the actual delayed HTTP response. The
// ordinary fixture retains its existing client-side mutation controls.
if (side === 'manifest' && !streamed) {
  if (mismatch === 'missing') delete (manifest as {delivery?: unknown}).delivery;
  else (manifest as {delivery?: unknown}).delivery = alteredIdentity(mismatch);
}

const fixture = {
  root, host, scope, manifest, receivedManifest, expectedDelivery, counters, release,
  deliverySource: streamed ? 'incremental-http-fixture' : 'buffered-html',
  nativeScopes: elementScopeCapabilities(document).native,
  island: undefined as HydrationIsland | undefined,
  creationError: undefined as string | undefined,
  snapshot: {message: 'Initial'},
  moduleDelivery: () => loaded?.delivery,
  mutateModuleIdentity() {
    Object.assign(loaded!.delivery!, {schemaVersion: 2, id: 'fixture/mutated', version: '2'});
  },
};

try {
  fixture.island = createHydrationIsland({
    root, manifest, snapshot: fixture.snapshot, scope: instrumentedScope, template: inert,
    loaders: {form: async () => {
      counters.loads++;
      if (params.has('hold')) await gate;
      // The client installs Lit hydration support before calling this loader.
      const module = await import('./ssr-module.ts');
      loaded = {
        ...module,
        delivery: side === 'module' ? alteredIdentity(mismatch) : {...module.delivery},
        template(snapshot: unknown) { counters.template++; return module.template(snapshot as {message: string}); },
        ready(boundary: Element | ShadowRoot) { counters.ready++; return module.ready(boundary); },
      };
      return loaded;
    }},
  });
  if (params.get('mutation') === 'manifest') {
    Object.assign(manifest.delivery!, {schemaVersion: 2, id: 'fixture/mutated', version: '2'});
    fixture.snapshot.message = 'Mutation after construction';
  }
} catch (error) {
  fixture.creationError = String(error);
}

(window as typeof window & {ssrFixture: typeof fixture}).ssrFixture = fixture;
