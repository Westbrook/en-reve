import {registerDefinitions, type ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {registryInitialized} from './internal/child-upgrades.js';

/** Qualified creation path, cached per browser realm. No browser globals are read at import time. */
export interface ElementScopeCapabilities {
  readonly native: boolean;
  readonly importMode: 'options' | 'document' | 'global';
  readonly dormant: boolean;
}
const capabilities = new WeakMap<Window, ElementScopeCapabilities>();
const creationScopes = new WeakMap<Document, WeakMap<CustomElementRegistry, Document>>();
const dormantScopes = new WeakMap<Document, Document>();

function context(document: Document) {
  const view = document.defaultView;
  if (!view?.customElements) throw new Error('Element scopes require a document with a browser window. Supply the owning browser document explicitly.');
  return view;
}

function dormantImport(document: Document, node: Node): DocumentFragment {
  // Lit imports inert template fragments. Serialization preserves template markers;
  // this is deliberately not a general clone API for live/property-bearing nodes.
  if (node.nodeType !== 11) throw new Error('Dormant creation accepts only inert template fragments.');
  const template = document.createElement('template');
  template.content.append(node.cloneNode(true));
  const container = document.createElement('div', {customElementRegistry: null});
  container.innerHTML = template.innerHTML;
  const fragment = document.createDocumentFragment();
  fragment.append(...container.childNodes);
  return fragment;
}

/** Probe behavior, including ignored dictionary members, without registering global test tags. */
export function elementScopeCapabilities(document: Document): ElementScopeCapabilities {
  const view = context(document);
  const cached = capabilities.get(view);
  if (cached) return cached;
  let result: ElementScopeCapabilities = {native: false, importMode: 'global', dormant: false};
  try {
    const registry = new (view as Window & typeof globalThis).CustomElementRegistry();
    const host = document.createElement('div', {customElementRegistry: registry});
    const shadow = host.attachShadow({mode: 'open', customElementRegistry: registry});
    const tag = 'en-registry-capability';
    const Base = (view as Window & typeof globalThis).HTMLElement;
    class Probe extends Base {}
    if (host.customElementRegistry !== registry || shadow.customElementRegistry !== registry) throw new Error('Registry association unavailable');
    host.innerHTML = `<${tag}></${tag}>`;
    registry.define(tag, Probe);
    registry.upgrade(host);
    if (!(host.firstElementChild instanceof Probe)) throw new Error('Scoped upgrade unavailable');
    const template = document.createElement('template');
    template.innerHTML = `<${tag}></${tag}>`;
    let importMode: 'options' | 'document' = 'options';
    try {
      const deep = document.importNode(template.content, {customElementRegistry: registry, selfOnly: false});
      const shallow = document.importNode(template.content, {customElementRegistry: registry, selfOnly: true});
      if (!(deep.firstElementChild instanceof Probe) || shallow.childNodes.length) throw new Error('Import options ignored');
    } catch {
      const scope = document.implementation.createHTMLDocument();
      registry.initialize(scope);
      if (!(scope.importNode(template.content, true).firstElementChild instanceof Probe)) throw new Error('Scoped import unavailable');
      importMode = 'document';
    }
    let dormant = false;
    try {
      const fragment = dormantImport(document, template.content);
      const child = fragment.firstElementChild!;
      const root = document.createElement('div', {customElementRegistry: null});
      root.append(fragment);
      dormant = root.customElementRegistry === null && child.customElementRegistry === null && !(child instanceof Probe);
      registry.initialize(root);
      registry.upgrade(root);
      dormant &&= root.customElementRegistry === registry && child instanceof Probe;
    } catch { /* Eager scoping can work without the optional dormant parser. */ }
    result = {native: true, importMode, dormant};
  } catch { /* Automatic callers select the owner's global registry before construction. */ }
  result = Object.freeze(result);
  capabilities.set(view, result);
  return result;
}

/** @internal Lit's Document-shaped import bridge; never patches the owning document. */
export function registryCreationScope(document: Document, registry: CustomElementRegistry | null): Document {
  const view = context(document);
  if (registry === view.customElements) return document; // Preserve the boolean importNode overload.
  const capability = elementScopeCapabilities(document);
  if (!capability.native) throw new Error('Scoped element construction is unavailable in this document.');
  if (registry === null) {
    if (!capability.dormant) throw new Error('Dormant template construction is unavailable; initialize the root before rendering.');
    let scope = dormantScopes.get(document);
    if (!scope) {
      scope = document.implementation.createHTMLDocument();
      scope.importNode = ((node: Node, deep = false) => {
        if (!deep) throw new Error('Dormant template imports must be deep.');
        return dormantImport(document, node);
      }) as Document['importNode'];
      dormantScopes.set(document, scope);
    }
    return scope;
  }
  let byRegistry = creationScopes.get(document);
  if (!byRegistry) {byRegistry = new WeakMap(); creationScopes.set(document, byRegistry);}
  let scope = byRegistry.get(registry);
  if (!scope) {
    scope = document.implementation.createHTMLDocument();
    if (capability.importMode === 'options') {
      scope.importNode = (<T extends Node>(node: T, deep = false): T => document.importNode(node, {customElementRegistry: registry, selfOnly: !deep})) as Document['importNode'];
    } else {
      registry.initialize(scope);
    }
    byRegistry.set(registry, scope);
  }
  return scope;
}

export interface ElementScopeOptions {
  /** The browser document that owns the new tree; required for SSR-safe imports and multiple realms. */
  readonly document: Document;
  /** Auto prefers a fresh native registry; global explicitly retains global consumption. */
  readonly registry?: 'auto' | 'global' | CustomElementRegistry;
}

export interface ElementScope {
  readonly document: Document;
  readonly registry: CustomElementRegistry;
  readonly mode: 'scoped' | 'global';
  /** Pass as Lit render's creationScope option; does not change the render container's association. */
  readonly creationScope: Document;
  register(definitions: readonly ElementDefinition[]): void;
  createElement<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K];
  createElement(tag: string): HTMLElement;
  attachShadow(host: Element, options?: ShadowRootInit): ShadowRoot;
  /** Associates only null nodes, never rebinds global nodes or enters nested shadow roots. */
  initialize(root: Element | ShadowRoot): void;
  get(tag: string): CustomElementConstructor | undefined;
  whenDefined(tag: string): Promise<CustomElementConstructor>;
  upgrade(root: Node): void;
}

/** Own an eagerly registered ordinary subtree or shadow tree. Importing this module defines no elements. */
export function createElementScope({document, registry: requested = 'auto'}: ElementScopeOptions): ElementScope {
  const view = context(document);
  const capability = requested === 'global' ? undefined : elementScopeCapabilities(document);
  const registry = requested === 'global' ? view.customElements
    : requested === 'auto' ? capability!.native ? new (view as Window & typeof globalThis).CustomElementRegistry() : view.customElements
    : requested;
  const scoped = registry !== view.customElements;
  if (scoped) {
    if (!capability?.native) throw new Error('The explicitly requested registry cannot be used in this document.');
    // Also diagnoses foreign-realm registries before creating consumer content.
    if (document.createElement('div', {customElementRegistry: registry}).customElementRegistry !== registry) throw new Error('The requested registry association was not honored.');
  }
  const creationScope = registryCreationScope(document, registry);
  return Object.freeze({
    document, registry, mode: scoped ? 'scoped' as const : 'global' as const, creationScope,
    register: (definitions: readonly ElementDefinition[]) => registerDefinitions(registry, definitions),
    createElement: (tag: string) => scoped ? document.createElement(tag, {customElementRegistry: registry}) : document.createElement(tag),
    attachShadow(host: Element, options: ShadowRootInit = {mode: 'open'}) {
      if (host.ownerDocument !== document) throw new Error('The shadow host belongs to another document.');
      if ('customElementRegistry' in options && options.customElementRegistry !== registry) throw new Error('The requested shadow registry conflicts with this scope.');
      if (host.shadowRoot) {
        const actual = 'customElementRegistry' in host.shadowRoot ? host.shadowRoot.customElementRegistry : view.customElements;
        if (actual !== registry) throw new Error('The existing shadow root belongs to another registry; initialize a null root explicitly.');
        return host.shadowRoot;
      }
      return host.attachShadow(scoped ? {...options, customElementRegistry: registry} : options);
    },
    initialize(root: Element | ShadowRoot) {
      if (root.ownerDocument !== document) throw new Error('The root belongs to another document.');
      if (!('customElementRegistry' in root)) {
        if (!scoped) return;
        throw new Error('Registry initialization is unavailable.');
      }
      if (root.customElementRegistry !== null && root.customElementRegistry !== registry) throw new Error('Cannot rebind a root that already belongs to another registry.');
      if (typeof registry.initialize !== 'function') {
        if (root.customElementRegistry === registry) return;
        throw new Error('Registry initialization is unavailable.');
      }
      registry.initialize(root);
      // initialize() need not emit slotchange or mutate a child list. Wake owners
      // watching null-associated authored children, even before their definitions arrive.
      root.dispatchEvent(new (view as Window & typeof globalThis).Event(registryInitialized, {bubbles: true, composed: true}));
      if (!root.isConnected) document.dispatchEvent(new (view as Window & typeof globalThis).Event(registryInitialized));
    },
    get: (tag: string) => registry.get(tag),
    whenDefined: (tag: string) => registry.whenDefined(tag),
    upgrade: (root: Node) => registry.upgrade(root),
  });
}
