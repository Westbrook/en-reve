export interface ElementDefinition {
  readonly tagName: string;
  readonly elementClass: CustomElementConstructor;
  readonly dependencies?: readonly ElementDefinition[];
}

export type ElementRegistry = Pick<CustomElementRegistry, 'get' | 'define'>;

/** Resolve the dependency closure without registering anything or reading a global registry. */
export function collectDefinitions(definitions: readonly ElementDefinition[]): readonly ElementDefinition[] {
  const known = new Map<string, ElementDefinition>();
  const dependencies = new Map<string, Set<string>>();
  const result: ElementDefinition[] = [];
  const visited = new Set<ElementDefinition>();
  const visit = (definition: ElementDefinition): void => {
    const existing = known.get(definition.tagName);
    if (existing && existing.elementClass !== definition.elementClass) throw new Error(`Conflicting constructors for ${definition.tagName}.`);
    known.set(definition.tagName, definition);
    if (visited.has(definition)) return;
    visited.add(definition);
    const children = dependencies.get(definition.tagName) ?? new Set<string>();
    dependencies.set(definition.tagName, children);
    for (const dependency of definition.dependencies ?? []) {
      children.add(dependency.tagName);
      visit(dependency);
    }
  };
  for (const definition of definitions) visit(definition);
  const emitted = new Set<string>();
  const visiting = new Set<string>();
  const order = (tagName: string): void => {
    if (emitted.has(tagName) || visiting.has(tagName)) return;
    visiting.add(tagName);
    for (const dependency of dependencies.get(tagName) ?? []) order(dependency);
    visiting.delete(tagName);
    emitted.add(tagName);
    result.push(known.get(tagName)!);
  };
  for (const tagName of known.keys()) order(tagName);
  return Object.freeze(result);
}

/** Preflight identity conflicts, then define dependency-first. Browser validation errors are not rolled back. */
export function registerDefinitions(registry: ElementRegistry, definitions: readonly ElementDefinition[]): void {
  const all = collectDefinitions(definitions);
  const namesByClass = new Map<CustomElementConstructor, string>();
  for (const definition of all) {
    const previousName = namesByClass.get(definition.elementClass);
    if (previousName && previousName !== definition.tagName) throw new Error(`One constructor cannot define both ${previousName} and ${definition.tagName}.`);
    namesByClass.set(definition.elementClass, definition.tagName);
    const existing = registry.get(definition.tagName);
    if (existing && existing !== definition.elementClass) throw new Error(`A different version of ${definition.tagName} is already registered.`);
  }
  for (const definition of all) {
    if (!registry.get(definition.tagName)) registry.define(definition.tagName, definition.elementClass);
  }
}

export function registerDefinition(registry: ElementRegistry, definition: ElementDefinition): void {
  registerDefinitions(registry, [definition]);
}

/** Explicit allowlist of side-effect-free definition imports. */
export type DefinitionLoaders = Readonly<Record<string, () => Promise<ElementDefinition>>>;
export type DefinitionLoadStage = 'lookup' | 'load' | 'registration';
export class DefinitionLoadError extends Error {
  readonly stage: DefinitionLoadStage;
  readonly tags: readonly string[];
  constructor(stage: DefinitionLoadStage, tags: readonly string[], cause: unknown) {
    super(`Element definition ${stage} failed: ${tags.join(', ')}`, {cause});
    this.name = 'DefinitionLoadError';
    this.stage = stage;
    this.tags = Object.freeze([...tags]);
  }
}
export interface DefinitionLoadOptions {
  /** Retry a rejected module loader. Some browsers cache network failures as well as evaluation failures; retry cannot force a new fetch. */
  retry?: boolean;
}
export interface DefinitionPreparation {
  /** Fetch and evaluate complete definition closures without registering them. */
  load(tags: readonly string[], options?: DefinitionLoadOptions): Promise<readonly ElementDefinition[]>;
}
export interface DefinitionLoader extends DefinitionPreparation {
  /** Register dependency-first after every import succeeds and all conflicts are checked. This is not render readiness. */
  ensure(tags: readonly string[], options?: DefinitionLoadOptions): Promise<void>;
}
interface ImportEntry { promise: Promise<ElementDefinition>; failed: boolean; }
// The manifest owns shared code, never a registry or DOM tree. Registry work is weakly keyed.
const imports = new WeakMap<DefinitionLoaders, Map<string, ImportEntry>>();
const registrations = new WeakMap<ElementRegistry, WeakMap<DefinitionLoaders, Map<string, Promise<void>>>>();

function canonicalTags(loaders: DefinitionLoaders, tags: readonly string[]): string[] {
    const names = [...new Set(tags)].sort();
    for (const tag of names) if (!Object.hasOwn(loaders, tag) || typeof loaders[tag] !== 'function') {
      throw new DefinitionLoadError('lookup', names, new Error(`Unknown element tag: ${tag}`));
    }
    return names;
}

/** Fetch/evaluate without owning a registry. Reuse the manifest to share imports across all callers. */
export function createDefinitionPreparation(loaders: DefinitionLoaders): DefinitionPreparation {
  let modules = imports.get(loaders);
  if (!modules) imports.set(loaders, modules = new Map());
  const load = async (tags: readonly string[], options: DefinitionLoadOptions = {}): Promise<readonly ElementDefinition[]> => {
    const names = canonicalTags(loaders, tags); // Validate the entire request before any module can run.
    return Promise.all(names.map(tag => {
      let entry = modules!.get(tag);
      if (!entry || (options.retry && entry.failed)) {
        const next: ImportEntry = {failed: false, promise: undefined!};
        next.promise = Promise.resolve().then(() => loaders[tag]!()).then(definition => {
          if (definition.tagName !== tag) throw new Error(`Loader for ${tag} returned ${definition.tagName}`);
          return definition;
        }).catch(cause => {
          next.failed = true;
          throw new DefinitionLoadError('load', [tag], cause);
        });
        modules!.set(tag, entry = next);
      }
      return entry.promise;
    }));
  };
  return {load};
}

/** Create a registry-targeted loader. Reuse a manifest object to share imports across scopes. */
export function createDefinitionLoader(registry: ElementRegistry, loaders: DefinitionLoaders): DefinitionLoader {
  const {load} = createDefinitionPreparation(loaders);
  let manifests = registrations.get(registry);
  if (!manifests) registrations.set(registry, manifests = new WeakMap());
  let requests = manifests.get(loaders);
  if (!requests) manifests.set(loaders, requests = new Map());
  return {
    load,
    ensure(tags, options) {
      let names: string[];
      try { names = canonicalTags(loaders, tags); } catch (error) { return Promise.reject(error); }
      const key = JSON.stringify(names);
      const existing = requests!.get(key);
      if (existing) return existing;
      const request = load(names, options).then(definitions => {
        try { registerDefinitions(registry, definitions); }
        catch (cause) { throw new DefinitionLoadError('registration', names, cause); }
      }).catch(error => {
        // A load failure is explicitly retryable. Native registration failure is permanent for this request.
        if (!(error instanceof DefinitionLoadError) || error.stage !== 'registration') requests!.delete(key);
        throw error;
      });
      requests!.set(key, request);
      return request;
    },
  };
}
