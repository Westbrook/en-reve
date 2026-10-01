import {readOmittedCssParts} from '../metadata/omitted-css-parts.ts';
import {readConstructorComposition,constructorCompositionKey} from '../metadata/constructor-composition-contract.ts';
import { createReferenceResolver } from '../metadata/references.ts';
import { canonicalJson, digestJson } from '../evidence/identity.ts';
import type { Json } from '../evidence/identity.ts';

type RecordValue = Record<string, unknown>;
export type ChangeLevel = 'breaking' | 'removal' | 'deprecation' | 'feature' | 'fix';
export type Surface = 'element' | 'attribute' | 'property' | 'method' | 'event' | 'slot' | 'css-property' | 'css-part' | 'css-state' | 'declaration' | 'export' | 'type';
export interface ApiFact {
  id: string;
  element: string;
  surface: Surface;
  name: string;
  operation: 'added' | 'removed' | 'changed';
  before?: Json;
  after?: Json;
  suggestedLevel: ChangeLevel | null;
  reviewRequired: boolean;
  reason: string;
}

export interface CemDiff {
  schemaVersion: 1;
  beforeSchemaVersion: string;
  afterSchemaVersion: string;
  beforeDigest: string;
  afterDigest: string;
  facts: ApiFact[];
  gaps: string[];
  /** Schema versions describe the CEM format, never a component release. */
  reviewRequired: boolean;
}

interface ElementSnapshot {
  tagName: string;
  surfaces: Map<string, { surface: Surface; name: string; value: Json }>;
}

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`Expected an object for ${label}.`);
  return value as RecordValue;
}

function list(value: unknown, label: string): RecordValue[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`Expected an array for ${label}.`);
  return value.map(item => record(item, label));
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) throw new TypeError(`Expected text for ${label}.`);
  return value;
}

function publicMember(member: RecordValue): boolean {
  return member.privacy !== 'private' && member.privacy !== 'protected';
}

function publicDeclaration(declaration: RecordValue): Json {
  const result = { ...declaration };
  // All markers were validated while indexing, including untagged exports.
  delete result[constructorCompositionKey];
  if (result.members !== undefined) {
    result.members = list(result.members, 'exported members').filter(publicMember);
  }
  for (const key of ['members', 'attributes', 'events', 'slots', 'cssProperties', 'cssParts', 'cssStates']) {
    if (result[key] !== undefined) {
      result[key] = list(result[key], key).filter(publicMember).map(item => Object.fromEntries(Object.entries(item).filter(([name]) => name !== 'inheritedFrom')))
        .sort((a, b) => `${a.kind}:${a.name}:${a.static}`.localeCompare(`${b.kind}:${b.name}:${b.static}`));
    }
  }
  return result as Json;
}

const surfaceLists: Array<[string, Surface]> = [
  ['attributes', 'attribute'], ['events', 'event'], ['slots', 'slot'],
  ['cssProperties', 'css-property'], ['cssParts', 'css-part'], ['cssStates', 'css-state'],
];
const ignoredDeclarationKeys = new Set([
  'name', 'kind', 'tagName', 'customElement', 'members', 'attributes', 'events',
  'slots', 'cssProperties', 'cssParts', 'cssStates', 'superclass', 'mixins',
  constructorCompositionKey,
]);

/** Structured CEM extraction, including local base classes and definition exports. */
export function snapshotCem(input: unknown) {
  canonicalJson(input);
  const manifest = record(input, 'CEM');
  const schemaVersion = text(manifest.schemaVersion, 'CEM schemaVersion');
  if (!Array.isArray(manifest.modules)) throw new TypeError('A CEM requires a modules array.');
  const modules = list(manifest.modules, 'modules');
  const declarations = new Map<string, { declaration: RecordValue; modulePath: string }>();
  const composed=new Set<RecordValue>();
  const elements = new Map<string, ElementSnapshot>();
  const exports = new Map<string, Json>();
  const gaps: string[] = [];
  if (!['1.0.0', '2.1.0'].includes(schemaVersion)) gaps.push(`CEM schema ${schemaVersion} has not been validated by this diff adapter.`);
  const modulePaths = new Set<string>();
  for (const module of modules) {
    const modulePath = text(module.path, 'module path');
    if (modulePaths.has(modulePath)) throw new Error(`Duplicate CEM module: ${modulePath}`);
    modulePaths.add(modulePath);
    for (const declaration of list(module.declarations, 'declarations')) {
      readOmittedCssParts(declaration);
      if(readConstructorComposition(declaration,modulePath))composed.add(declaration);
      const key = `${modulePath}#${text(declaration.name, 'declaration name')}`;
      if (declarations.has(key)) throw new Error(`Duplicate CEM declaration: ${key}`);
      declarations.set(key, { declaration, modulePath });
    }
  }

  const resolve = createReferenceResolver(manifest);

  function makeElement(tagName: string, declaration: RecordValue, modulePath: string): ElementSnapshot {
    const surfaces: ElementSnapshot['surfaces'] = new Map();
    // Null is an explicit legacy omission, retained through subtree merges so
    // a later mixin can remove an earlier sibling's part. Missing complete
    // facets carry no such action against independent sibling contributions.
    type State=Map<string,{surface:Surface;name:string;value:RecordValue}|null>;
    const active = new Set<RecordValue>();
    function add(surface: Surface, name: string, value: RecordValue) {
      // An analyzer's provenance describes a member's source, not its public semantics.
      const clean = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'inheritedFrom')) as Json;
      surfaces.set(`${surface}:${name}`, { surface, name, value: clean });
    }
    function collect(current: RecordValue, currentModule: string):State {
      const state:State=new Map();
      if (active.has(current)) { gaps.push(`Inheritance cycle for ${tagName}`); return state; }
      active.add(current);
      const complete=composed.has(current);
      const references = [current.superclass, ...list(current.mixins, 'mixins')].filter(Boolean);
      for (const reference of references) {
        const ref=record(reference,'base reference');
        // A complete producer uses canonical module/declaration identities.
        // Keep the historical resolver only for legacy CEM representations.
        const base = complete ? (!ref.package && typeof ref.module==='string' ? declarations.get(`${ref.module}#${ref.name}`) : undefined) : resolve(reference, currentModule);
        if (base) {
          const inherited=collect(base.declaration,base.modulePath);
          // Audit every ancestor for gaps/cycles even when its facets are already
          // composed into this node. Never clear a caller's sibling contributions.
          if(!complete)for(const [key,value]of inherited)state.set(key,value);
        }
        else {
          // Native platform inheritance is not part of a package's authored API.
          if (ref.module!==undefined || ref.package!==undefined || !['HTMLElement', 'Element', 'Object'].includes(String(ref.name))) {
            gaps.push(`External or unresolved base ${ref.name} for ${tagName}; supply flattened/dependency metadata and review inherited effects.`);
          }
        }
      }
      const omittedParts = new Set(readOmittedCssParts(current));
      if (!complete) for (const name of omittedParts) state.set('css-part:' + name,null);
      const memberNames=new Set<string>();
      for (const member of list(current.members, 'members')) {
        if (member.kind !== 'method' && member.kind !== 'field') {
          gaps.push(`Unclassified member kind ${member.kind} on ${tagName}`);
        }
        const name = text(member.name, 'member name');
        const key='member:'+canonicalJson([member.static===true,name]);
        if(memberNames.has(key))throw new Error(`Duplicate member slot ${name} on ${tagName}`);memberNames.add(key);
        state.set(key,{surface:member.kind==='method'?'method':'property',name:member.static===true?`static ${name}`:name,value:member});
      }
      for (const [key, surface] of surfaceLists) {
        const names = new Set<string>();
        for (const item of list(current[key], key)) {
          const name = surface === 'slot' && item.name === '' ? '' : text(item.name, `${key} name`);
          if (names.has(name)) throw new Error(`Duplicate ${key} ${name} on ${tagName}`);
          names.add(name);
          // An explicit child declaration can restore a part; a flattened inherited
          // row cannot override that child's source-authored exclusion.
          if (!complete && surface === 'css-part' && omittedParts.has(name) && item.inheritedFrom !== undefined) continue;
          state.set(surface+':'+name,{surface,name,value:item});
        }
      }
      active.delete(current);
      return state;
    }
    for(const entry of collect(declaration,modulePath).values())if(entry && publicMember(entry.value))add(entry.surface,entry.name,entry.value);
    const details = Object.fromEntries(Object.entries(declaration).filter(([key]) => !ignoredDeclarationKeys.has(key)));
    add('declaration', tagName, details);
    return { tagName, surfaces };
  }

  function register(tagName: string, declaration: RecordValue, modulePath: string) {
    const snapshot = makeElement(tagName, declaration, modulePath);
    const previous = elements.get(tagName);
    if (previous && canonicalJson([...previous.surfaces]) !== canonicalJson([...snapshot.surfaces])) {
      throw new Error(`Conflicting CEM definitions for ${tagName}`);
    }
    elements.set(tagName, snapshot);
  }
  for (const { declaration, modulePath } of declarations.values()) {
    if (declaration.tagName) register(text(declaration.tagName, 'tagName'), declaration, modulePath);
  }
  for (const module of modules) {
    const modulePath = module.path as string;
    for (const entry of list(module.exports, 'exports')) {
      const name = text(entry.name, 'export name');
      if (entry.kind === 'custom-element-definition') {
        const declaration = resolve(entry.declaration, modulePath);
        if (declaration) register(name, declaration.declaration, declaration.modulePath);
        else gaps.push(`Unresolved definition export ${name} in ${modulePath}`);
      } else {
        const key = `${modulePath}#${name}`;
        if (exports.has(key)) throw new Error(`Duplicate CEM export: ${key}`);
        const target = resolve(entry.declaration, modulePath);
        if (!target && !(entry.declaration as RecordValue)?.package) gaps.push(`Unresolved local export ${name} in ${modulePath}; supply supplemental type evidence or repair the reference.`);
        // Exported classes/functions may be public primitives even without an element tag.
        if(target && !target.declaration.tagName && ['class','mixin'].includes(String(target.declaration.kind))) {
          // Audit public non-element lineage without registering an element surface.
          makeElement(name,target.declaration,target.modulePath);
        }
        exports.set(key, { export: entry, ...(target ? { declaration: publicDeclaration(target.declaration) } : {}) } as Json);
      }
    }
  }
  return { schemaVersion, elements, exports, gaps: [...new Set(gaps)].sort() };
}

function withoutDocs(value: Json): Json {
  if (Array.isArray(value)) return value.map(withoutDocs);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['description', 'summary'].includes(key))
    .map(([key, child]) => [key, withoutDocs(child)]));
}

function newDeprecation(before: Json, after: Json): boolean {
  return !!after && typeof after === 'object' && !Array.isArray(after) && !!after.deprecated &&
    (!before || typeof before !== 'object' || Array.isArray(before) || !before.deprecated);
}

function fact(element: string, surface: Surface, name: string, before: Json | undefined, after: Json | undefined): ApiFact {
  const operation = before === undefined ? 'added' : after === undefined ? 'removed' : 'changed';
  let suggestedLevel: ChangeLevel | null = operation === 'removed' ? 'removal' : operation === 'added' ? 'feature' : null;
  let reviewRequired = operation === 'changed';
  let reason = operation === 'removed' ? 'A described public contract was removed.' : operation === 'added'
    ? 'A described public contract was added; requiredness and usage still need human review.'
    : 'Changed type, default, semantic or extension metadata requires a compatibility decision.';
  if (operation === 'added' && after && typeof after === 'object' && !Array.isArray(after) && after.required === true) {
    suggestedLevel = null;
    reviewRequired = true;
    reason = 'Adding a required contract may break existing usage.';
  }
  if (operation === 'changed' && before !== undefined && after !== undefined) {
    if (canonicalJson(withoutDocs(before)) === canonicalJson(withoutDocs(after))) {
      suggestedLevel = 'fix';
      reviewRequired = false;
      reason = 'Only human-readable description/summary metadata changed.';
    } else if (newDeprecation(before, after)) {
      suggestedLevel = 'deprecation';
      // A deprecation can accompany other breaking changes; do not assume it is the entire diff.
      reviewRequired = true;
      reason = 'New deprecation metadata; review any accompanying public changes.';
    }
  }
  return {
    id: digestJson({ element, surface, name, operation, before: before ?? null, after: after ?? null }),
    element, surface, name, operation,
    ...(before !== undefined ? { before } : {}), ...(after !== undefined ? { after } : {}),
    suggestedLevel, reviewRequired, reason,
  };
}

export function diffCem(before: unknown, after: unknown): CemDiff {
  const oldSnapshot = snapshotCem(before);
  const newSnapshot = snapshotCem(after);
  const facts: ApiFact[] = [];
  for (const tagName of [...new Set([...oldSnapshot.elements.keys(), ...newSnapshot.elements.keys()])].sort()) {
    const oldElement = oldSnapshot.elements.get(tagName);
    const newElement = newSnapshot.elements.get(tagName);
    if (!oldElement || !newElement) {
      const serialize = (element: ElementSnapshot): Json => ({
        tagName, surfaces: [...element.surfaces.values()].sort((a, b) => `${a.surface}:${a.name}`.localeCompare(`${b.surface}:${b.name}`)),
      });
      facts.push(fact(tagName, 'element', tagName, oldElement ? serialize(oldElement) : undefined, newElement ? serialize(newElement) : undefined));
      continue;
    }
    for (const key of [...new Set([...oldElement.surfaces.keys(), ...newElement.surfaces.keys()])].sort()) {
      const oldSurface = oldElement.surfaces.get(key);
      const newSurface = newElement.surfaces.get(key);
      if (canonicalJson(oldSurface?.value ?? null) === canonicalJson(newSurface?.value ?? null)) continue;
      const surface = newSurface ?? oldSurface!;
      facts.push(fact(tagName, surface.surface, surface.name, oldSurface?.value, newSurface?.value));
    }
  }
  for (const name of [...new Set([...oldSnapshot.exports.keys(), ...newSnapshot.exports.keys()])].sort()) {
    const oldValue = oldSnapshot.exports.get(name);
    const newValue = newSnapshot.exports.get(name);
    if (canonicalJson(oldValue ?? null) !== canonicalJson(newValue ?? null)) {
      facts.push(fact('$package', 'export', name, oldValue, newValue));
    }
  }
  const gaps = [...new Set([...oldSnapshot.gaps, ...newSnapshot.gaps])];
  return {
    schemaVersion: 1,
    beforeSchemaVersion: oldSnapshot.schemaVersion,
    afterSchemaVersion: newSnapshot.schemaVersion,
    beforeDigest: digestJson(before), afterDigest: digestJson(after), facts, gaps,
    reviewRequired: gaps.length > 0 || facts.some(item => item.reviewRequired),
  };
}
