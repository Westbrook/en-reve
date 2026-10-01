import {assertDeliveryIdentity, type DeliveryIdentity} from '@en-reve/elements/delivery.js';
import {snapshotDeliveryIdentity} from './delivery-identity.js';
import { createElementScope, type ElementScope } from '@en-reve/elements/element-scope.js';
import { collectDefinitions, type ElementDefinition } from '@en-reve/primitives/interactions/registration.js';
import { validateHydrationManifest, type HydrationManifest } from './hydration-manifest.js';
export type { HydrationManifest } from './hydration-manifest.js';

export interface HydrationModule {
  readonly version: string;
  readonly delivery?: DeliveryIdentity;
  readonly definitions: readonly ElementDefinition[];
  template(snapshot: unknown): unknown;
  /** Await actual widget updates; hydration/definition availability alone is not readiness. */
  ready(root: Element | ShadowRoot, signal: AbortSignal): void | Promise<void>;
}
export type HydrationState = 'dormant' | 'loading' | 'hydrating' | 'ready' | 'error' | 'disposed';
export interface HydrationIsland {
  readonly state: HydrationState;
  readonly error: unknown;
  readonly mode: 'scoped' | 'global';
  /** Fetch/evaluate without hydrating, defining or connecting optional content. */
  load(options?: { retry?: boolean }): Promise<void>;
  activate(options?: { retry?: boolean }): Promise<void>;
  dispose(): void;
}
let support: Promise<typeof import('@lit-labs/ssr-client')> | undefined;
const ownedRoots = new WeakSet<Element | ShadowRoot>();
function hydrationSupport() {
  // Import this entry before application LitElement modules unless the app has
  // already installed Lit's hydration support itself.
  const global = globalThis as typeof globalThis & { litElementVersions?: string[]; litElementHydrateSupport?: unknown };
  if (global.litElementVersions?.length && !global.litElementHydrateSupport) return Promise.reject(new Error('Load hydration support before LitElement modules.'));
  // Neither import evaluates application LitElement subclasses. Fetch both
  // together so the small client re-export does not add a network round trip.
  return support ??= Promise.all([
    import('@lit-labs/ssr-client/lit-element-hydrate-support.js'),
    import('@lit-labs/ssr-client'),
  ]).then(([, client]) => client).catch(error => { support = undefined; throw error; });
}

/** Explicit one-owner bootstrap. Leaves native fallback usable while modules load. */
export function createHydrationIsland({ root: initialRoot, manifest: input, snapshot, loaders, scope: suppliedScope, template: inertTemplate }: {
  root: Element | ShadowRoot;
  manifest: HydrationManifest;
  snapshot: unknown;
  loaders: Readonly<Record<string, () => Promise<HydrationModule>>>;
  scope?: ElementScope;
  /** Inert SSR materialization into an empty scoped root or a global root containing only this template. Useful fallback stays outside. */
  template?: HTMLTemplateElement;
}): HydrationIsland {
  validateHydrationManifest(input);
  snapshot = structuredClone(snapshot);
  const manifest = { ...input, tags: [...input.tags], delivery: snapshotDeliveryIdentity(input.delivery) };
  const key = manifest.key, version = manifest.version;
  let load = Object.hasOwn(loaders, key) ? loaders[key] : undefined;
  if (!load) throw new Error(`Unknown hydration key: ${key}`);
  let root: Element | ShadowRoot | undefined = initialRoot;
  if (ownedRoots.has(root)) throw new Error('Hydration boundary already has an owner.');
  const document = root.ownerDocument, view = document.defaultView!;
  if (('host' in root ? root.host.id : root.id) !== manifest.id) throw new Error('Hydration root does not match the manifest ID.');
  const association = (node: Element | ShadowRoot): CustomElementRegistry | null => 'customElementRegistry' in node ? node.customElementRegistry : view.customElements;
  const registry = association(root);
  const scope = suppliedScope ?? createElementScope({ document, registry: registry ?? 'auto' });
  if (scope.document !== document) throw new Error('Hydration scope belongs to another document.');
  if (inertTemplate && (inertTemplate.ownerDocument !== document || (inertTemplate.parentNode !== root && !('host' in root && inertTemplate.parentNode === root.host)) || [...root.childNodes].some(node => node !== inertTemplate && (node.nodeType !== 3 || node.textContent?.trim())))) throw new Error('Template hydration requires an empty root or a root containing only its own inert template.');
  let state: HydrationState = 'dormant', error: unknown, started = false;
  let operation: Promise<void> | undefined;
  const abort = new (view as Window & typeof globalThis).AbortController();
  const check = () => { if (abort.signal.aborted || !root?.isConnected || root.ownerDocument !== document) throw new DOMException('Hydration boundary is unavailable', 'AbortError'); };
  const pending = async <T>(promise: Promise<T>): Promise<T> => {
    let cancel!: () => void;
    const canceled = new Promise<never>((_, reject) => { cancel = () => reject(new DOMException('Hydration canceled', 'AbortError')); });
    abort.signal.addEventListener('abort', cancel, { once: true });
    try { check(); return await Promise.race([promise, canceled]); }
    finally { abort.signal.removeEventListener('abort', cancel); }
  };
  const boundaries = (): (Element | ShadowRoot)[] => {
    const result: (Element | ShadowRoot)[] = [root!];
    for (let index = 0; index < result.length; index++) {
      const boundary = result[index];
      for (const node of [boundary, ...boundary.querySelectorAll('*')]) {
        if (association(node) !== null && association(node) !== scope.registry) throw new Error('Hydration cannot rebind an existing registry association.');
        if (node.nodeType === 1) {
          const element = node as Element;
          if (element.localName.includes('-') && element.matches(':defined')) throw new Error('Hydration boundary has already upgraded elements.');
          if (element.shadowRoot) result.push(element.shadowRoot);
        }
      }
    }
    return result;
  };
  let preparation: Promise<{ hydrate: typeof import('@lit-labs/ssr-client').hydrate; module: HydrationModule; definitions: readonly ElementDefinition[] }> | undefined;
  let preparationFailed = false;
  const prepare = (retry = false) => {
    if (retry && preparationFailed && !started) { preparation = undefined; preparationFailed = false; }
    return preparation ??= (async () => {
      const { hydrate } = await pending(hydrationSupport()); check();
      const module = await pending(load!()); check();
      const delivery = snapshotDeliveryIdentity(module.delivery);
      assertDeliveryIdentity(manifest.delivery, delivery);
      const definitions = collectDefinitions(module.definitions);
      if (module.version !== version || typeof module.ready !== 'function'
      || JSON.stringify(definitions.map(d => d.tagName).sort()) !== JSON.stringify([...manifest.tags].sort())) throw new Error('Hydration module does not match its manifest.');
      return { hydrate, module, definitions };
    })().catch(cause => { preparationFailed = true; throw cause; });
  };
  boundaries();
  ownedRoots.add(root);
  return {
    get state() { return state; }, get error() { return error; }, mode: scope.mode,
    async load({ retry = false } = {}) { check(); await prepare(retry); },
    activate({ retry = false } = {}) {
      if (state === 'disposed') return Promise.reject(new Error('Hydration island is disposed.'));
      if (state === 'ready') return Promise.resolve();
      if (operation) return operation;
      if (state === 'error' && (!retry || started)) return Promise.reject(error);
      state = 'loading'; error = undefined;
      operation = (async () => {
        check();
        const { hydrate, module, definitions } = await prepare(retry); check();
        for (const definition of definitions) {
          const existing = scope.get(definition.tagName);
          if (existing && existing !== definition.elementClass) throw new Error(`Conflicting hydration definition: ${definition.tagName}`);
          if (existing && scope.mode === 'scoped') throw new Error('Initial scoped hydration requires definitions to remain unregistered until every root is associated.');
        }
        let roots = boundaries();
        state = 'hydrating'; started = true;
        const deferred: Element[] = [];
        if (inertTemplate) {
          // Global definitions may already exist from another island. Hold Lit
          // connection until outer ownership is established, even in that case.
          const source = inertTemplate.content.cloneNode(true) as DocumentFragment;
          for (const element of source.querySelectorAll('*')) if (element.localName.includes('-') && !element.hasAttribute('defer-hydration')) { element.setAttribute('defer-hydration', ''); element.setAttribute('data-en-hydration-release', ''); }
          const fragment = scope.creationScope.importNode(source, true);
          const containers: ParentNode[] = [fragment];
          for (let index = 0; index < containers.length; index++) for (const host of containers[index].querySelectorAll('*')) {
            for (const child of [...host.children]) if (child.localName === 'template' && child.hasAttribute('shadowrootmode')) {
              if (child.getAttribute('shadowrootmode') !== 'open' || host.shadowRoot) throw new Error('Template hydration requires open, unclaimed declarative roots.');
              const shadow = scope.attachShadow(host);
              shadow.append((child as HTMLTemplateElement).content); child.remove(); containers.push(shadow);
            }
          }
          deferred.push(...fragment.querySelectorAll('[data-en-hydration-release]'));
          root!.replaceChildren(fragment);
          // Materialization is terminal: keep neither a duplicate inert tree nor
          // its source reference after ownership has moved to the live root.
          inertTemplate.remove(); inertTemplate = undefined;
          roots = scope.mode === 'scoped' ? [root!, ...containers.slice(1) as ShadowRoot[]] : [];
        }
        hydrate(module.template(snapshot), root!, { creationScope: scope.creationScope });
        // Empty registry association comes after outer property/event ownership.
        // Initializing a shared populated registry can upgrade immediately, so
        // callers must provide a fresh registry for this initial bootstrap API.
        for (const boundary of roots) if (scope.mode === 'scoped' || association(boundary) === null) scope.initialize(boundary);
        scope.register(definitions);
        scope.upgrade(root!);
        for (const element of deferred) { element.removeAttribute('data-en-hydration-release'); element.removeAttribute('defer-hydration'); }
        await pending(Promise.resolve(module.ready(root!, abort.signal))); check(); state = 'ready';
      })().catch(cause => { if (state !== 'disposed') { error = cause; state = 'error'; } throw cause; }).finally(() => { operation = undefined; });
      return operation;
    },
    dispose() { state = 'disposed'; abort.abort(); if (root && !started) ownedRoots.delete(root); root = undefined; load = undefined; snapshot = undefined; inertTemplate = undefined; preparation = undefined; },
  };
}
