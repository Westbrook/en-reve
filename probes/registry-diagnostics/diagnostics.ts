import {elementScopeCapabilities, type ElementScope} from '../../packages/elements/src/element-scope.js';
import type {ElementActivation} from '../../packages/elements/src/activation.js';

export type Milestone = 'module' | 'registration' | 'activation' | 'readiness';
type Boundary = Element | ShadowRoot;
export interface DiagnosticInput {
  scope: ElementScope;
  requested: 'auto' | 'global' | 'explicit';
  roots: readonly Boundary[];
  /** Exact instances only; no descendant or document discovery. */
  instances?: readonly Element[];
  /** Explicit manifest keys, including dependency tags if desired. Not registry enumeration. */
  tags: readonly string[];
  controller?: ElementActivation;
}
const guidance = {
  module: 'Check the allowlisted module and network/build output. Explicit loader retry may remain cached by the browser.',
  registration: 'Check declared constructor identity and dependencies for this owner. A partial native definition cannot be rolled back.',
  activation: 'Check supplied root ownership, connection, and controller.error at the call site. Do not rebind a live tree.',
  readiness: 'Check the application ready callback and required component updateComplete promises; availability is not usable rendering.',
};

/** Development fixture only. Pull snapshots, fixed bounds, no listeners, events or telemetry. */
export function createRegistryDiagnostic(input: DiagnosticInput) {
  if (input.roots.length > 16 || (input.instances?.length ?? 0) > 64 || input.tags.length > 128)
    throw new RangeError('Diagnostic limits: 16 roots, 64 instances, 128 declared tags.');
  if (input.tags.some(tag => tag.length > 96 || !/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/.test(tag)))
    throw new TypeError('Supply bounded, explicit custom-element tag names.');
  // Do not close over input: retained methods delegate into a separate scalar/weak state.
  return observer({
    scope: new WeakRef(input.scope), controller: input.controller && new WeakRef(input.controller),
    roots: input.roots.map(root => new WeakRef(root)),
    instances: (input.instances ?? []).map(node => new WeakRef(node)),
    tags: [...new Set(input.tags)], requested: input.requested,
    actual: input.scope.mode, capability: {...elementScopeCapabilities(input.scope.document)},
  });
}
function observer(state: {
  scope?: WeakRef<ElementScope>; controller?: WeakRef<ElementActivation>;
  roots: WeakRef<Boundary>[]; instances: WeakRef<Element>[]; tags: string[];
  requested: DiagnosticInput['requested']; actual: ElementScope['mode'];
  capability: ReturnType<typeof elementScopeCapabilities>;
}) {
  let disposed = false, sequence = 0;
  const phases: Partial<Record<Milestone, {sequence: number; state: 'pending'|'fulfilled'|'failed'|'canceled'; guidance?: string}>> = {};
  const validate = (stage: Milestone) => {if (!Object.hasOwn(guidance, stage)) throw new TypeError('Unknown diagnostic milestone.');};
  const begin = (stage: Milestone) => {
    validate(stage);
    if (disposed) throw new Error('Diagnostic disposed. Run application operations directly.');
    const id = ++sequence; phases[stage] = {sequence:id,state:'pending'}; return id;
  };
  const finish = (stage: Milestone, id: number, error?: unknown, failed = false) => {
    if (disposed || phases[stage]?.sequence !== id) return;
    const canceled = failed && typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
    phases[stage] = {sequence:id,state:failed ? canceled ? 'canceled':'failed':'fulfilled',...(failed ? {guidance:guidance[stage]} : {})};
    // Never store arbitrary errors, causes, stacks, URLs, DOM or form contents.
  };
  const snapshot = () => {
    const scope = state.scope?.deref();
    const association = (node: Boundary | Element) => {
      const ownerGlobal = node.ownerDocument.defaultView?.customElements;
      const actual = 'customElementRegistry' in node ? node.customElementRegistry : ownerGlobal;
      return {association: actual === null ? 'intentional-null' : actual === undefined ? 'unavailable' : actual === scope?.registry ? 'scope' : actual === node.ownerDocument.defaultView?.customElements ? 'owner-global' : 'other-registry',
        source: 'customElementRegistry' in node ? 'native-property' : 'owner-global-fallback',
        ownerDocument: !scope ? 'unavailable' : node.ownerDocument === scope.document ? 'scope-document' : 'other-document', connected: node.isConnected};
    };
    return {
      disposed, requested:state.requested, actual:state.actual, capability:{...state.capability},
      scopeAvailable:!!scope, controllerState:state.controller?.deref()?.state ?? 'unobserved',
      roots:state.roots.map(ref => {const node=ref.deref();return node ? association(node) : {association:'collected'};}),
      declared:state.tags.map(tag => ({tag,definitionAvailable:scope ? !!scope.get(tag) : null})),
      instances:state.instances.map(ref => {
        const node=ref.deref(); if (!node) return {upgrade:'collected'};
        // Definition lookup is bounded to the explicitly declared names.
        const ctor=scope && state.tags.includes(node.localName) ? scope.get(node.localName) : undefined;
        return {...association(node),upgrade:ctor ? node instanceof ctor ? 'matches-scope-constructor' : 'not-matching-scope-constructor' : 'unknown'};
      }),
      milestones:structuredClone(phases),
      handles: {roots:state.roots.length,instances:state.instances.length,scope:Number(!!state.scope),controller:Number(!!state.controller)},
      limits:{roots:16,instances:64,tags:128,milestones:4},
    };
  };
  return {
    snapshot,
    /** Observe one explicit semantic operation; no wrapping of manifests or controller methods. */
    async observe<T>(stage: Milestone, operation: () => Promise<T>): Promise<T> {
      const id=begin(stage);
      try {const value=await operation();finish(stage,id);return value;}
      catch(error) {finish(stage,id,error,true);throw error;}
    },
    observeSync<T>(stage: Milestone, operation: () => T): T {
      const id=begin(stage);
      try {const value=operation();finish(stage,id);return value;}
      catch(error) {finish(stage,id,error,true);throw error;}
    },
    /** This disposes observation only. The application owns controller/DOM disposal. */
    dispose() {
      disposed=true;state.scope=undefined;state.controller=undefined;state.roots=[];state.instances=[];state.tags=[];
      for(const key of Object.keys(phases) as Milestone[]) delete phases[key];
    },
  };
}
