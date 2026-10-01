import {readFileSync} from 'node:fs';
import {dirname, relative, resolve, sep} from 'node:path';
import {ts} from './compiler-api.mjs';

export type CandidateSuperclass = {name: string; module?: string; package?: string};

/** Resolve the declaration, keeping external package ownership separate from local names. */
export function candidateSuperclass(expression: any, program: any, selected: Map<string, any>, sourcePath: (source: any) => string): CandidateSuperclass {
  // Binding initializes parent links for Program-created AST nodes.
  const checker = program.getTypeChecker();
  const expressionSource = expression.getSourceFile();
  if (!expressionSource || program.getSourceFile(expressionSource.fileName) !== expressionSource) throw new Error('Superclass expression belongs to a different compiler Program');
  let symbol = checker.getSymbolAtLocation(expression);
  if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const declaration = symbol?.declarations?.[0];
  if (!declaration?.name || !ts.isIdentifier(declaration.name)) throw new Error('Unresolved superclass declaration: ' + expression.getText());
  const source = declaration.getSourceFile(), file = resolve(source.fileName), name = declaration.name.text;
  if (selected.has(file)) return {name, module: sourcePath(source)};
  if (program.isSourceFileDefaultLibrary(source)) return {name};
  // Resolve ownership from the actual declaration rather than the authored alias.
  // This also handles workspace package links without leaking checkout paths.
  for (let directory = dirname(file);;) {
    try {
      const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
      if (typeof metadata.name !== 'string' || !metadata.name) throw new Error('Superclass package has no name: ' + directory);
      return {name, package: metadata.name, module: relative(directory, file).split(sep).join('/')};
    } catch (error: any) {if (error.code !== 'ENOENT') throw error;}
    const parent = dirname(directory);
    if (parent === directory) throw new Error('Unselected superclass has no package owner: ' + file);
    directory = parent;
  }
}

const collections = ['members', 'attributes', 'cssProperties', 'cssParts', 'cssStates', 'slots', 'events'] as const;

/** Default inheritance semantics, resolved and memoized by declaration identity. */
export function candidateInheritancePatch(manifest: any) {
  type Entry = {module: string; declaration: any};
  const entries: Entry[] = [], byModule = new Map<string, Map<string, Entry>>();
  for (const module of manifest.modules) {
    const declarations = new Map<string, Entry>();
    for (const declaration of module.declarations) {
      if (declarations.has(declaration.name)) throw new Error('Duplicate inheritance declaration: ' + module.path + '#' + declaration.name);
      const entry = {module: module.path, declaration};
      declarations.set(declaration.name, entry);entries.push(entry);
    }
    for (const path of new Set([module.path, module.source].filter(Boolean))) {
      if (byModule.has(path)) throw new Error('Duplicate inheritance module: ' + path);
      byModule.set(path, declarations);
    }
  }
  const baseFor = (entry: Entry): Entry | undefined => {
    const reference = entry.declaration.superclass;
    if (!reference || reference.package) return undefined;
    const declarations = byModule.get(reference.module ?? entry.module);
    const target = declarations?.get(reference.name);
    if (reference.module && declarations && !target) throw new Error('Unresolved inheritance declaration: ' + reference.module + '#' + reference.name);
    // An unmatched qualified reference is opaque; never fall back to a global name.
    return target;
  };
  const cache = new Map<Entry, Map<string, any[]>>();
  function inherit(entry: Entry, key: string, visiting: Set<Entry>): any[] {
    const cached = cache.get(entry)?.get(key);
    if (cached) return cached;
    if (visiting.has(entry)) throw new Error('Circular superclass reference: ' + [...visiting, entry].map(item => item.module + '#' + item.declaration.name).join(' -> '));
    visiting.add(entry);
    try {
      const own = entry.declaration[key] ?? [], base = baseFor(entry);
      const inherited = base ? inherit(base, key, visiting) : [];
      const ownNames = new Set(own.map((item: any) => item.name));
      const omitted = new Set((entry.declaration.omitInherited?.[key] ?? []).filter((name: any) => typeof name === 'string').map((name: string) => name.trim()).filter(Boolean));
      // A discovered child facet can retain the parent's documented contract.
      // Copy only absent documentation, never its type, default or ownership.
      const documentedOwn = own.map((item: any) => {
        if (omitted.has(item.name)) return item;
        const previous = inherited.find(value => value.name === item.name &&
          (key !== 'members' || (value.kind === item.kind && Boolean(value.static) === Boolean(item.static))));
        if (!previous) return item;
        const result = {...item};
        if (key === 'attributes' && item.inheritedFrom && typeof item.fieldName === 'string' &&
            item.fieldName === previous.fieldName) {
          const ownField = (entry.declaration.members ?? []).find((member: any) => member.kind === 'field' && member.name === item.fieldName && !member.static);
          const baseField = (base!.declaration.members ?? []).find((member: any) => member.kind === 'field' && member.name === item.fieldName && !member.static);
          const fieldOrigin = (member: any, owner: Entry): Entry | undefined => {
            if (!member) return undefined;
            const origin = member.inheritedFrom;
            if (!origin) return owner;
            if (origin.package) return undefined;
            return byModule.get(origin.module ?? owner.module)?.get(origin.name);
          };
          const ownOrigin = fieldOrigin(ownField, entry), baseOrigin = fieldOrigin(baseField, base!);
          // Resolve absolute/source and public module paths to the same declaration.
          // Never equate unknown/external origins, own child fields, or authored @attr.
          if (ownOrigin && ownOrigin === baseOrigin) {
            if (previous.type !== undefined) result.type = previous.type;
            if (previous.parsedType === undefined) delete result.parsedType;
            else result.parsedType = previous.parsedType;
            result.inheritedFrom = previous.inheritedFrom ?? {name:base!.declaration.name,module:base!.module};
          }
        }
        for (const field of ['description', 'summary', 'deprecated']) {
          if (result[field] === undefined && previous[field] !== undefined) result[field] = previous[field];
        }
        return result;
      });
      const merged = [...inherited.filter(item => !ownNames.has(item.name) && !omitted.has(item.name)).map(item => ({
        ...item, inheritedFrom: item.inheritedFrom ?? {name: base!.declaration.name, module: base!.module},
      })), ...documentedOwn];
      if (!cache.has(entry)) cache.set(entry, new Map());
      cache.get(entry)!.set(key, merged);
      return merged;
    } finally {visiting.delete(entry);}
  }
  const replaceByDeclaration: Record<string, any> = {};
  for (const entry of entries) {
    if (!entry.declaration.superclass) continue;
    const replacement: Record<string, any> = {};
    for (const key of collections) {
      const current = entry.declaration[key] ?? [], merged = inherit(entry, key, new Set());
      if (JSON.stringify(current) !== JSON.stringify(merged)) replacement[key] = merged;
    }
    if (Object.keys(replacement).length) replaceByDeclaration[entry.module + '#' + entry.declaration.name] = replacement;
  }
  return {replaceByDeclaration};
}

/** Upstream CEM serialization omits superclass.package; restore only bound references. */
export function restoreExternalSuperclasses(manifest: any, references: Map<string, CandidateSuperclass>) {
  const restored = new Set<string>();
  for (const module of manifest.modules) for (const declaration of module.declarations) {
    const key = module.path + '#' + declaration.name, reference = references.get(key);
    if (!reference) continue;
    if (declaration.superclass?.name !== reference.name || declaration.superclass?.module !== reference.module) throw new Error('Serialized superclass identity changed: ' + key);
    declaration.superclass = {...reference};restored.add(key);
  }
  if (restored.size !== references.size) throw new Error('External superclass declaration missing from serialized CEM');
}
