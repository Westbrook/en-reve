// Benchmark instrumentation; library hosts use the production registry adapter.
import {hydrate} from '@lit-labs/ssr-client';
import {LitElement, render, nothing, type TemplateResult} from 'lit';
import {EnElement} from '@en-reve/elements/internal/en-element.js';
import {definitions} from '@en-reve/elements/catalog.js';
import {collectDefinitions, registerDefinitions} from '@en-reve/primitives/interactions/registration.js';

const workflows = {
  settings: () => import('./workflows/settings.js'),
  chat: () => import('./workflows/chat.js'),
  sso: () => import('./workflows/sso.js'),
};
type Workflow = keyof typeof workflows;
type RegistryNode = Element & {customElementRegistry?: CustomElementRegistry | null; updateComplete?: Promise<unknown>; hasUpdated?: boolean};
type Controller = {render(): TemplateResult; dispose(): void; reset(): void};
export interface Config {workflow: Workflow; mode: 'auto'|'global'|'scoped'; policy: 'shared'|'group'|'instance'|'element'; count: number; groupSize: number; delivery: 'csr'|'ssr'; root: 'light'|'shadow';}

export function allElements(root: ParentNode): RegistryNode[] {
  const result: RegistryNode[] = [];
  const visit = (parent: ParentNode) => {
    for (const child of parent.children) {
      result.push(child as RegistryNode);
      if (child.shadowRoot) visit(child.shadowRoot);
      visit(child);
    }
  };
  visit(root); return result;
}
export function capabilities() {
  try {
    const registry = new CustomElementRegistry();
    const host = document.createElement('section', {customElementRegistry: registry});
    const root = host.attachShadow({mode: 'open', customElementRegistry: registry});
    class Probe extends HTMLElement {}
    registry.define('registry-capability-probe', Probe);
    host.innerHTML = '<registry-capability-probe></registry-capability-probe>';
    const template = document.createElement('template'); template.innerHTML = '<registry-capability-probe></registry-capability-probe>';
    const clone = document.importNode(template.content, {customElementRegistry: registry, selfOnly: false});
    return {available: host.customElementRegistry === registry && root.customElementRegistry === registry && host.firstElementChild instanceof Probe && clone.firstElementChild instanceof Probe && typeof registry.initialize === 'function', reason: null};
  } catch (error) {return {available: false, reason: String(error)};}
}

export async function prepare(config: Config) {
  const capability = capabilities();
  if (config.mode === 'scoped' && !capability.available) return {unsupported: true as const, capability};
  const scoped = config.mode !== 'global' && capability.available;
  const module = await workflows[config.workflow]();
  performance.mark('registry:workflow-module-ready');
  const fixtureDefinitions = [...definitions, ...('extraDefinitions' in module ? module.extraDefinitions : [])];
  const preexisting = fixtureDefinitions.filter(definition => customElements.get(definition.tagName));
  if (preexisting.length) throw new Error('Workflow import registered global elements before activation: ' + preexisting.map(definition => definition.tagName).join(', '));
  const counters = {registries: 0, definitions: 0, constructed: 0, connected: 0, disconnected: 0, disposed: 0, updatesAfterDispose: 0};
  const countsByTag: Record<string, number> = {};
  const registryIds = new WeakMap<CustomElementRegistry, number>();
  const registryClasses = new WeakSet<CustomElementRegistry>();
  const creations = new WeakMap<CustomElementRegistry, Document>();
  const unassignedDocument = document.implementation.createHTMLDocument();
  // Fixture-only Lit creationScope: a plain inert Document import loses explicit
  // null association on insertion. Parse the template into an explicitly null
  // element instead, preserving Lit markers before it binds properties/events.
  unassignedDocument.importNode = (<T extends Node>(node: T): T => {
    const template = document.createElement('template');
    template.content.append(node.cloneNode(true));
    const container = document.createElement('div', {customElementRegistry: null});
    container.innerHTML = template.innerHTML;
    const fragment = document.createDocumentFragment();
    fragment.append(...container.childNodes);
    return fragment as unknown as T;
  }) as Document['importNode'];
  const creationScope = (registry: CustomElementRegistry|null) => {
    if (!registry) return unassignedDocument;
    // A real initialized Document satisfies Lit's public creationScope type.
    // It is the pre-existing repository probe's native alternative to import options.
    let scope = creations.get(registry);
    if (!scope) {scope = document.implementation.createHTMLDocument(); registry.initialize(scope); creations.set(registry, scope);}
    return scope;
  };
  const registryFor = (element: Element) => {
    const registry = (element as RegistryNode).customElementRegistry;
    if (registry === null) throw new Error('An unassociated host attempted to render');
    return registry ?? customElements;
  };
  function makeRegistry() {
    if (!scoped) return customElements;
    const registry = new CustomElementRegistry(); registryIds.set(registry, ++counters.registries); return registry;
  }
  const mapped = new Map<CustomElementConstructor, CustomElementConstructor>();
  for (const definition of fixtureDefinitions) {
    const Base = definition.elementClass as typeof LitElement;
    const productionAdapter = Base.prototype instanceof EnElement;
    class Observed extends Base {
      private benchmarkRegistry?: CustomElementRegistry;
      protected getRenderRegistry() {return this.shadowRoot ? undefined : this.benchmarkRegistry;}
      override attachShadow(options: ShadowRootInit) {
        return super.attachShadow(scoped && !productionAdapter ? {...options, customElementRegistry: this.benchmarkRegistry ?? registryFor(this)} : options);
      }
      constructor() {super(); counters.constructed++; countsByTag[definition.tagName] = (countsByTag[definition.tagName] ?? 0) + 1;}
      override connectedCallback() {counters.connected++; super.connectedCallback();}
      override disconnectedCallback() {counters.disconnected++; super.disconnectedCallback();}
      protected override createRenderRoot() {
        if (scoped) {
          let registry = this.shadowRoot?.customElementRegistry ?? registryFor(this);
          if (!this.shadowRoot && config.policy === 'element') {registry = makeRegistry(); register(registry);}
          this.benchmarkRegistry = registry;
          if (!productionAdapter) this.renderOptions.creationScope = creationScope(registry);
        }
        return super.createRenderRoot();
      }
    }
    mapped.set(definition.elementClass, Observed);
  }
  const adapted = collectDefinitions(fixtureDefinitions).map(definition => ({tagName: definition.tagName, elementClass: mapped.get(definition.elementClass)!}));
  // Complete catalog is intentionally eager in this baseline fixture. No chunk-saving claim.
  function register(registry: CustomElementRegistry) {
    if (registryClasses.has(registry)) return;
    const label = `registry:define:${registryIds.get(registry) ?? 'global'}`;
    performance.mark(label + ':start'); registerDefinitions(registry, adapted); performance.mark(label + ':end');
    performance.measure(label, label + ':start', label + ':end');
    counters.definitions += adapted.length; registryClasses.add(registry);
  }
  const shared = config.policy === 'shared' || config.policy === 'element' ? makeRegistry() : customElements;
  const groups = new Map<number, CustomElementRegistry>();
  const instances = new Map<number, {host: HTMLElement; root: HTMLElement; boundary: HTMLElement|ShadowRoot; registry: CustomElementRegistry; controller: Controller; options: {creationScope?: Document}; disposed: boolean; active: boolean;}>();
  const target = document.querySelector<HTMLElement>('#workflows')!;
  const metrics: Array<{id: number; stages: Record<string, number>;}> = [];
  let nextId = 0;
  let generation = 0;
  function mount() {
    const id = nextId++;
    let registry = shared;
    if (scoped && config.policy === 'instance') registry = makeRegistry();
    if (scoped && config.policy === 'group') {
      const key = Math.floor(id / config.groupSize);
      registry = groups.get(key) ?? makeRegistry(); groups.set(key, registry);
    }
    // SSR instances already exist and are parsed before the benchmark module arrives.
    const prior = target.querySelector<HTMLElement>(`[data-island="${id}"]`);
    const host = prior ?? document.createElement('section', scoped ? {customElementRegistry: null} : undefined);
    host.dataset.island = String(id);
    const boundary = config.root === 'shadow'
      ? host.shadowRoot ?? host.attachShadow({mode: 'open', ...(scoped ? {customElementRegistry: null} : {})})
      : host;
    const root = [...boundary.children].find(element => element.hasAttribute('data-render')) as HTMLElement ?? document.createElement('div', scoped ? {customElementRegistry: null} : undefined);
    root.dataset.render = '';
    if (!root.parentNode) {const style = document.createElement('style');style.textContent = module.styles.cssText;boundary.append(style, root);}
    let row: ReturnType<typeof instances.get>;
    const update = () => {
      if (row?.disposed) {counters.updatesAfterDispose++; return;}
      if (row?.active) render(row.controller.render(), root, row.options);
    };
    const controller = module.create({requestUpdate: update});
    row = {host, root, boundary, registry, controller, options: scoped ? {creationScope: creationScope(null)} : {}, disposed: false, active: false}; instances.set(id, row);
    if (!prior) {
      // In native mode we intentionally create null-associated, connected light descendants.
      // In fallback mode nothing custom is connected before activation.
      if (scoped) render(controller.render(), root, row.options);
      else {const fallback = document.createElement('p'); fallback.dataset.fallback = ''; fallback.textContent = `${config.workflow} workflow waiting to activate`; root.append(fallback);}
      target.append(host);
    }
    return id;
  }
  async function ready(root: ParentNode) {
    for (let pass = 0; pass < 40; pass++) {
      const elements = allElements(root).filter(element => element.localName.startsWith('en-'));
      let timeout: ReturnType<typeof setTimeout>;
      try {await Promise.race([Promise.all(elements.map(element => element.updateComplete)),new Promise((_,reject) => {timeout=setTimeout(() => reject(new Error('Element updateComplete timed out')),10000);})]);}
      finally {clearTimeout(timeout!);}
      const current = allElements(root).filter(element => element.localName.startsWith('en-'));
      if (current.length === elements.length && current.every(element => element.hasUpdated)) return;
    }
    throw new Error('Workflow failed to reach rendered readiness: ' + allElements(root).filter(element => element.localName.startsWith('en-') && !element.hasUpdated).map(element => element.localName + ':' + (element.customElementRegistry === null ? 'null' : element.customElementRegistry === customElements ? 'global' : 'scoped')).join(', '));
  }
  async function activate(id: number) {
    const row = instances.get(id); if (!row || row.disposed) throw new Error('Unknown/disposed island');
    if (row.active) {await ready(row.root); return;}
    const ticket = generation;
    const stages: Record<string, number> = {};
    const mark = (stage: string) => {stages[stage] = performance.now();performance.mark(`registry:island:${id}:${stage}`);};
    mark('requested'); register(row.registry); mark('definitions-ready');
    if (scoped) {
      // initialize() does not enter shadow trees. Associate every existing SSR root
      // while definitions are ready; hydration support was installed before classes loaded.
      row.registry.initialize(row.boundary);
      for (const element of allElements(row.root)) if (element.shadowRoot?.customElementRegistry === null) row.registry.initialize(element.shadowRoot);
    }
    mark('associated');
    if (row.disposed || ticket !== generation) throw new Error('Activation canceled');
    row.active = true; if (scoped) row.options.creationScope = creationScope(row.registry);
    if (config.delivery === 'ssr' && row.host.hasAttribute('data-ssr')) {
      hydrate(row.controller.render(), row.root, row.options);
      row.host.removeAttribute('data-ssr');
    } else {
      row.root.querySelector('[data-fallback]')?.remove();
      render(row.controller.render(), row.root, row.options);
    }
    await ready(row.root); mark('rendered');
    if (row.disposed || ticket !== generation) throw new Error('Activation canceled');
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); mark('frame-opportunity');
    performance.measure(`registry:island:${id}:activation`, `registry:island:${id}:requested`, `registry:island:${id}:rendered`);
    metrics.push({id, stages});
  }
  function dispose(id: number) {
    const row = instances.get(id); if (!row) return;
    row.disposed = true; row.controller.dispose(); render(nothing, row.root); row.host.remove(); instances.delete(id); counters.disposed++;
    // Per-group ownership is released once its last workflow leaves; shared registry
    // intentionally stays warm. Native classes/modules cannot be unregistered/unloaded.
    for (const [key, registry] of groups) if (![...instances.values()].some(item => item.registry === registry)) groups.delete(key);
  }
  function snapshot() {
    const rows = [...instances].map(([id, row]) => {
      const elements = allElements(row.root), custom = elements.filter(element => element.localName.startsWith('en-'));
      return {id, active: row.active, registryId: registryIds.get(row.registry) ?? 'global', elements: elements.length, customHosts: custom.length, upgraded: custom.filter(element => Boolean(element.hasUpdated)).length};
    });
    return {scoped, capability, config, counters: {...counters}, countsByTag: {...countsByTag}, rows, metrics: metrics.map(value => ({...value, stages: {...value.stages}})), pendingGroups: groups.size};
  }
  for (let i = 0; i < config.count; i++) mount();
  return {unsupported: false as const, capability, mount, activate, dispose, snapshot, resetMeasurements() {metrics.length = 0; performance.clearMarks();performance.clearMeasures();}, disposeAll() {generation++; for (const id of [...instances.keys()]) dispose(id);}};
}
