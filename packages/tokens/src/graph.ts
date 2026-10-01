import type { FlatToken, Recipe, ResolvedGraph, ResolvedToken, TokenDefinition, TokenDocument, TokenType } from './types.js';
import { aliasTarget, clone, cssName, deepFreeze, isRecord, TokenError, validateValue, valueCSS } from './value.js';
import { canonicalDerivedValue } from './derived.js';

const types = new Set<TokenType>(['color','dimension','number','fontFamily','fontWeight','fontStyle','duration','cubicBezier','shadow']);
const tokenFields = new Set(['$type','$value','$description','$extensions','$deprecated']);
const groupFields = new Set(['$type','$description','$extensions']);
export function flattenTokens(document: TokenDocument): Record<string, FlatToken> {
  const flat: Record<string, FlatToken> = Object.create(null);
  function visit(group: Record<string, unknown>, prefix: string, inheritedType?: TokenType): void {
    const ownType = group.$type ?? inheritedType;
    if (ownType !== undefined && !types.has(ownType as TokenType)) throw new TokenError('unsupported-type', `${prefix || 'Root'}: unsupported type ${String(ownType)}.`, prefix);
    for (const [key,value] of Object.entries(group)) {
      if (key.startsWith('$')) { if (!groupFields.has(key)) throw new TokenError('unsupported-field', `${prefix || 'Root'}: unsupported group field ${key}.`, prefix); continue; }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || ['__proto__','constructor','prototype'].includes(key)) throw new TokenError('invalid-name', `Unsupported token/group name ${key}.`, prefix);
      const id = prefix ? `${prefix}.${key}` : key;
      if (!isRecord(value)) throw new TokenError('invalid-group', `${id}: expected a token or group object.`, id);
      if (Object.hasOwn(value, '$value')) {
        for (const field of Object.keys(value)) if (!tokenFields.has(field)) throw new TokenError('unsupported-field', `${id}: unsupported token field ${field}.`, id);
        const type = value.$type ?? ownType;
        if (type !== undefined && !types.has(type as TokenType)) throw new TokenError('unsupported-type', `${id}: unsupported type ${String(type)}.`, id);
        if (value.$description !== undefined && typeof value.$description !== 'string') throw new TokenError('invalid-metadata', `${id}: description must be a string.`, id);
        if (value.$extensions !== undefined && !isRecord(value.$extensions)) throw new TokenError('invalid-metadata', `${id}: extensions must be an object.`, id);
        if (value.$deprecated !== undefined && typeof value.$deprecated !== 'boolean' && typeof value.$deprecated !== 'string') throw new TokenError('invalid-metadata', `${id}: deprecated must be boolean or string.`, id);
        flat[id] = {...clone(value), ...(type ? {$type: type} : {}), id} as FlatToken;
      } else visit(value, id, ownType as TokenType | undefined);
    }
  }
  visit(document, '');
  const names = new Map<string,string>();
  for (const id of Object.keys(flat)) {
    const name = cssName(id);
    if (names.has(name)) throw new TokenError('css-name-collision', `${id} and ${names.get(name)} both map to ${name}.`, id);
    names.set(name,id);
  }
  return flat;
}
export function tokenDocument(flat: Readonly<Record<string, TokenDefinition>>): TokenDocument {
  const document: TokenDocument = {};
  for (const id of Object.keys(flat).sort()) {
    if (!id.split('.').every(segment => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment) && !['__proto__','constructor','prototype'].includes(segment))) throw new TokenError('invalid-name',`Unsupported token path ${id}.`,id);
    let parent = document;
    const path = id.split('.');
    for (const segment of path.slice(0,-1)) {
      if (Object.hasOwn(parent,segment) && isRecord(parent[segment]) && Object.hasOwn(parent[segment] as object,'$value')) throw new TokenError('path-collision', `${id} overlaps a token.`, id);
      parent[segment] ??= {};
      parent = parent[segment] as TokenDocument;
    }
    if (Object.hasOwn(parent,path.at(-1)!)) throw new TokenError('path-collision', `${id} overlaps a group.`, id);
    const {$type,$value,$description,$extensions,$deprecated} = flat[id];
    parent[path.at(-1)!] = { ...($type ? {$type} : {}), $value: clone($value), ...($description !== undefined ? {$description} : {}), ...($extensions ? {$extensions: clone($extensions)} : {}), ...($deprecated !== undefined ? {$deprecated} : {}) };
  }
  return document;
}
export function resolveTokens(document: TokenDocument, options: {pins?: Readonly<Record<string,unknown>>; recipes?: Readonly<Record<string,Recipe>>} = {}): ResolvedGraph {
  const flat = flattenTokens(document);
  const pins = options.pins ?? {};
  const recipes = options.recipes ?? {};
  for (const id of [...Object.keys(pins),...Object.keys(recipes)]) if (!Object.hasOwn(flat,id)) throw new TokenError('unknown-token', `${id}: no source token exists.`, id);
  const resolved: Record<string, ResolvedToken> = Object.create(null);
  const visiting: string[] = [];
  function resolve(id: string): ResolvedToken {
    if (Object.hasOwn(resolved,id)) return resolved[id];
    if (!Object.hasOwn(flat,id)) throw new TokenError('missing-reference', `Missing token ${id}, referenced by ${visiting.at(-1) ?? 'root'}.`, id);
    if (visiting.includes(id)) throw new TokenError('cycle', `Token cycle: ${[...visiting.slice(visiting.indexOf(id)),id].join(' → ')}`, id);
    visiting.push(id);
    const source = flat[id];
    const pinned = Object.hasOwn(pins,id);
    const raw = pinned ? pins[id] : source.$value;
    const alias = aliasTarget(raw);
    const recipe = !pinned ? recipes[id] : undefined;
    const potential = [...new Set([...(recipes[id]?.dependencies ?? []), ...(aliasTarget(source.$value) ? [aliasTarget(source.$value)!] : []), ...(alias ? [alias] : [])])].sort();
    const dependencies = recipe ? [...new Set(recipe.dependencies)].sort() : alias ? [alias] : [];
    let type = source.$type;
    let value: unknown;
    let provenance: ResolvedToken['provenance'];
    if (recipe) {
      for (const dependency of dependencies) resolve(dependency);
      value = recipe.evaluate(dependency => {
        if (!dependencies.includes(dependency)) throw new TokenError('undeclared-dependency', `${id}: recipe read undeclared dependency ${dependency}.`, id);
        return clone(resolve(dependency).value);
      });
      provenance = 'recipe';
    } else if (alias) {
      const target = resolve(alias);
      if (type !== undefined && type !== target.type) throw new TokenError('type-mismatch', `${id}: ${type} cannot alias ${target.type} token ${alias}.`, id);
      type ??= target.type;
      value = clone(target.value);
      provenance = pinned ? 'pin' : 'alias';
    } else { value = clone(raw); provenance = pinned ? 'pin' : 'literal'; }
    if (!type) throw new TokenError('missing-type', `${id}: a literal or recipe output requires an explicit/inherited type.`, id);
    validateValue(type,value,id);
    // Authored literals/pins stay exact; recipes publish one canonical value to
    // aliases, downstream recipes, CSS and review artifacts in every runtime.
    if (recipe) value = canonicalDerivedValue(value);
    const extension = isRecord(source.$extensions?.['en-reve']) ? source.$extensions['en-reve'] : {};
    const unit = extension.cssUnit;
    if (unit !== undefined && (type !== 'number' || !['ch','em'].includes(String(unit)))) throw new TokenError('invalid-css-adapter', `${id}: unsupported CSS unit adapter.`, id);
    const cssValue = valueCSS(type,value) + (unit ?? '');
    const reference = (dependency: string) => {
      if (!dependencies.includes(dependency)) throw new TokenError('undeclared-dependency', `${id}: CSS recipe uses undeclared dependency ${dependency}.`, id);
      return `var(${cssName(dependency)})`;
    };
    const cssExpression = recipe ? (recipe.css ? recipe.css(reference) : cssValue) : alias ? `var(${cssName(alias)})` : cssValue;
    resolved[id] = deepFreeze({id,type,value,description: source.$description ?? '',cssName: cssName(id),cssValue,cssExpression,dependencies,potentialDependencies:potential,provenance, ...(recipe ? {recipeVersion: recipe.version} : {}), ...(source.$deprecated !== undefined ? {deprecated:source.$deprecated} : {})});
    visiting.pop();
    return resolved[id];
  }
  for (const id of Object.keys(flat).sort()) resolve(id);
  const dependencies = Object.fromEntries(Object.entries(resolved).map(([id, token]) => [id, token.dependencies]));
  const potentialDependencies = Object.fromEntries(Object.entries(resolved).map(([id, token]) => [id, token.potentialDependencies]));
  return Object.freeze({tokens:Object.freeze(resolved),dependencies:Object.freeze(dependencies),potentialDependencies:Object.freeze(potentialDependencies)});
}
/** Includes changed nodes and every active (or potential) transitive consumer. */
export function affectedTokens(graph: ResolvedGraph, changed: readonly string[], options: {potential?: boolean} = {}): string[] {
  const dependencies = options.potential ? graph.potentialDependencies : graph.dependencies;
  const affected = new Set<string>();
  for (const id of changed) { if (!Object.hasOwn(graph.tokens,id)) throw new TokenError('unknown-token', `Unknown changed token ${id}.`,id); affected.add(id); }
  let grew = true;
  while (grew) { grew = false; for (const [id,inputs] of Object.entries(dependencies)) if (!affected.has(id) && inputs.some(input => affected.has(input))) { affected.add(id); grew = true; } }
  return [...affected].sort();
}
export function restoreDerived(pins: Readonly<Record<string,unknown>>, id: string): Record<string,unknown> {
  const next: Record<string,unknown> = {...clone(pins)}; delete next[id]; return next;
}
