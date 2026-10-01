import {createDefinitionLoader, type DefinitionLoaders, type DefinitionLoadOptions} from './lazy-loader.js';
import type {ElementScope} from './element-scope.js';

export type ElementActivationState = 'dormant' | 'loading' | 'activating' | 'ready' | 'canceled' | 'error' | 'disposed';
export interface ElementActivationOptions {
  readonly scope: ElementScope;
  readonly loaders: DefinitionLoaders;
  readonly tags: readonly string[];
  /** Application-owned element or shadow root; essential controls stay outside it. */
  readonly root: Element | ShadowRoot;
  /** Group: a dedicated registry. Dormant: null-associated nodes sharing a registry. */
  readonly policy: 'group' | 'dormant';
  /** Explicit nested shadow boundaries; initialize() does not traverse shadow roots. */
  readonly shadowRoots?: readonly ShadowRoot[];
  /** Required in global mode: trusted inert markup, with an initially empty native root. */
  readonly template?: HTMLTemplateElement;
  /** Resolve actual rendering readiness. Definition/upgrade alone is not render readiness. */
  readonly ready: (root: Element | ShadowRoot, signal: AbortSignal) => void | Promise<void>;
}
export interface ElementActivation {
  readonly state: ElementActivationState;
  readonly error: unknown;
  /** Share fetch/evaluation without registering, initializing, appending or changing state. */
  load(options?: DefinitionLoadOptions): Promise<void>;
  /** Coalesce concurrent requests; resolve only after the supplied readiness check. */
  activate(options?: DefinitionLoadOptions): Promise<void>;
  /** Cancel pending intent. Imported code and completed registration cannot be undone. */
  cancel(): void;
  /** Release owned references and cancel pending work; does not remove application DOM. */
  dispose(): void;
}

/** Explicit activation, with no observers, implicit prefetch or global DOM scanning. */
export function createElementActivation(options: ElementActivationOptions): ElementActivation {
  const {scope, policy} = options;
  const tags = Object.freeze([...options.tags]);
  const loader = createDefinitionLoader(scope.registry, options.loaders);
  let root: Element | ShadowRoot | undefined = options.root;
  let shadows: readonly ShadowRoot[] = [...(options.shadowRoots ?? [])];
  let template = options.template;
  let ready: ElementActivationOptions['ready'] | undefined = options.ready;
  let state: ElementActivationState = 'dormant', error: unknown;
  let operation: {abort: AbortController; promise: Promise<void>} | undefined;
  let initialized = false, activationStarted = false, registrationFailure: unknown;
  const abortError = () => new DOMException('Element activation canceled', 'AbortError');
  const contains = (node: Node): boolean => {
    for (let current: Node | null = node; current; current = current.parentNode ?? (current.nodeType === 11 && 'host' in current ? (current as ShadowRoot).host : null)) if (current === root) return true;
    return false;
  };
  const association = (node: Element | ShadowRoot) => 'customElementRegistry' in node ? node.customElementRegistry : scope.document.defaultView!.customElements;
  if (!tags.length) throw new Error('An activation boundary requires explicit element tags.');
  if (root.ownerDocument !== scope.document) throw new Error('Activation root belongs to another document.');
  if (scope.mode === 'global') {
    if (association(root) !== scope.registry) throw new Error('Global activation requires a global root.');
    if (!template || root.childNodes.length || (root.nodeType === 1 && (root as Element).localName.includes('-'))) throw new Error('Global activation requires an empty native root and an inert template.');
    if (shadows.length) throw new Error('Global template activation cannot initialize existing shadow roots.');
  } else {
    if (template) throw new Error('Materialize native scoped content with the appropriate creationScope before activation.');
    const expected = policy === 'dormant' ? null : scope.registry;
    for (const boundary of [root, ...shadows]) {
      if (!contains(boundary) || boundary.ownerDocument !== scope.document || association(boundary) !== expected) throw new Error('Activation boundary has incompatible registry ownership.');
      for (const child of boundary.querySelectorAll('*')) if (association(child) !== expected) throw new Error('Activation descendants must have the boundary registry association.');
    }
    if (policy === 'group' && tags.some(tag => scope.get(tag))) throw new Error('Group activation requires an unregistered dedicated registry.');
  }
  const current = (abort: AbortController) => {
    if (abort.signal.aborted || state === 'disposed' || !root?.isConnected) throw abortError();
    if (root.ownerDocument !== scope.document) throw new Error('Activation root changed documents while loading.');
  };
  const wait = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => new Promise((resolve, reject) => {
    const cancel = () => reject(abortError());
    if (signal.aborted) return cancel();
    signal.addEventListener('abort', cancel, {once: true});
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
  const cancel = () => {
    if (!operation) return;
    const pending = operation; operation = undefined;
    state = activationStarted ? 'canceled' : 'dormant';
    pending.abort.abort();
  };
  return {
    get state() { return state; },
    get error() { return error; },
    async load(loadOptions) {
      if (state === 'disposed') throw abortError();
      await loader.load(tags, loadOptions);
    },
    activate(loadOptions) {
      if (state === 'disposed') return Promise.reject(abortError());
      if (state === 'ready') return Promise.resolve();
      if (operation) return operation.promise;
      if (registrationFailure) return Promise.reject(registrationFailure);
      const abort = new (scope.document.defaultView as Window & typeof globalThis).AbortController();
      state = 'loading'; error = undefined;
      const pending = {abort, promise: undefined as unknown as Promise<void>};
      operation = pending;
      pending.promise = (async () => {
        try {
          const definitions = await wait(loader.load(tags, loadOptions), abort.signal);
          current(abort);
          if (scope.mode === 'global' && !initialized && root!.childNodes.length) throw new Error('Global activation root changed before materialization.');
          if (scope.mode === 'scoped' && !initialized) {
            const expected = policy === 'dormant' ? null : scope.registry;
            for (const boundary of [root!, ...shadows]) {
              if (!contains(boundary) || association(boundary) !== expected) throw new Error('Activation ownership changed while loading.');
              for (const child of boundary.querySelectorAll('*')) if (association(child) !== expected) throw new Error('Activation descendant ownership changed while loading.');
            }
          }
          state = 'activating'; activationStarted = true;
          // No await between the last cancellation check and the irreversible work.
          try { scope.register(definitions); } catch (cause) { registrationFailure = cause; throw cause; }
          if (!initialized) {
            if (scope.mode === 'global') {
              if (root!.childNodes.length) throw new Error('Global activation root changed before materialization.');
              root!.append(scope.document.importNode(template!.content, true));
            } else if (policy === 'dormant') {
              scope.initialize(root!);
              for (const shadow of shadows) scope.initialize(shadow);
            } else {
              scope.upgrade(root!);
              for (const shadow of shadows) scope.upgrade(shadow);
            }
            initialized = true;
          }
          current(abort);
          await wait(Promise.resolve(ready!(root!, abort.signal)), abort.signal);
          current(abort); state = 'ready';
        } catch (cause) {
          if (operation === pending) {
            error = cause; state = abort.signal.aborted || !root?.isConnected ? (activationStarted ? 'canceled' : 'dormant') : 'error';
          }
          throw cause;
        } finally { if (operation === pending) operation = undefined; }
      })();
      return pending.promise;
    },
    cancel,
    dispose() { cancel(); state = 'disposed'; root = undefined; shadows = []; template = undefined; ready = undefined; },
  };
}
