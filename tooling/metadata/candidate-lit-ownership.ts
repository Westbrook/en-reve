import {realpathSync} from 'node:fs';
import {dirname, relative, isAbsolute, sep, resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {ts, resolveCompilerPackage} from './compiler-api.mjs';

/** Match the actual installed LitElement declaration in this Program, never its spelling. */
export function consumedLitTargets(program: any) {
  const checker = program.getTypeChecker();
  const litRoot = realpathSync(dirname(resolveCompilerPackage('lit-element').packagePath));
  const unalias = (symbol: any) => symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const targets = new Set<any>();
  for (const source of program.getSourceFiles()) {
    if (!program.isSourceFileFromExternalLibrary(source)) continue;
    const path = relative(litRoot, realpathSync(source.fileName));
    if (!path || path === '..' || path.startsWith('..' + sep) || isAbsolute(path)) continue;
    const module = checker.getSymbolAtLocation(source);
    if (!module) continue;
    const symbol = unalias(checker.getExportsOfModule(module).find((entry: any) => entry.name === 'LitElement'));
    if (!symbol) continue;
    const declarations = symbol.declarations?.filter(ts.isClassDeclaration) ?? [];
    if (declarations.length !== 1) throw new Error('Consumed LitElement has no unique class declaration');
    const declaration = declarations[0], owner = declaration.getSourceFile();
    const ownerPath = relative(litRoot, realpathSync(owner.fileName));
    if (program.getSourceFile(owner.fileName) !== owner || !program.isSourceFileFromExternalLibrary(owner) ||
        !ownerPath || ownerPath === '..' || ownerPath.startsWith('..' + sep) || isAbsolute(ownerPath)) {
      throw new Error('Consumed LitElement is not owned by the installed lit-element package');
    }
    targets.add(symbol);
  }
  if (targets.size > 1) throw new Error('Consumed LitElement resolves to multiple declarations');
  return {checker, targets, unalias};
}

export function litClassOwnership(program: any, sources: any[], selectedClasses?: readonly any[]) {
  const classSelection = selectedClasses && new Set(selectedClasses);
  if (classSelection && (classSelection.size !== selectedClasses!.length || [...classSelection].some(node => !sources.includes(node.getSourceFile()) || !node.getSourceFile().statements.includes(node)))) throw new Error('Lit class selection requires unique exact source declarations');
  const {checker, targets, unalias} = consumedLitTargets(program);
  const classes = new Map<string, Map<string, any>>(), classNameCounts = new Map<string, Map<string, number>>();
  for (const source of sources) {
    if (program.getSourceFile(source.fileName) !== source) throw new Error('Lit ownership source belongs to another Program');
    const counts = new Map<string, number>();
    function count(node: any) {
      if (ts.isClassDeclaration(node) && node.name && (!classSelection || classSelection.has(node))) counts.set(node.name.text, (counts.get(node.name.text) ?? 0) + 1);
      ts.forEachChild(node, count);
    }
    count(source);classNameCounts.set(resolve(source.fileName), counts);
    const named = new Map<string, any>();
    for (const node of source.statements) if (ts.isClassDeclaration(node) && node.name) {
      if (named.has(node.name.text)) throw new Error('Ambiguous Lit class declaration: ' + source.fileName + '#' + node.name.text);
      named.set(node.name.text, node);
    }
    classes.set(resolve(source.fileName), named);
  }
  const cache = new Map<any, boolean>();
  function derives(symbol: any, seen = new Set<any>()): boolean {
    symbol = unalias(symbol);
    if (!symbol) return false;
    if (targets.has(symbol)) return true;
    if (seen.has(symbol)) return false;
    seen.add(symbol);
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    // Resolve each declared ancestor anew; instantiated generic types can omit base information.
    return Boolean(type.isClassOrInterface?.() && checker.getBaseTypes(type).some((base: any) => derives(base.getSymbol(), seen)));
  }
  function owned(foreign: any) {
    const foreignSource = foreign.getSourceFile(), source = program.getSourceFile(foreignSource?.fileName);
    if (!source || source.text !== foreignSource.text) throw new Error('Lit detector source does not match owned Program');
    const nodes = source.statements.filter((node: any) => ts.isClassDeclaration(node) && node.name?.text === foreign.name?.text);
    if (nodes.length !== 1 || nodes[0].pos !== foreign.pos || nodes[0].end !== foreign.end) throw new Error('Lit detector has no unique owned class');
    return nodes[0];
  }
  return {
    isLitClass(foreign: any, context: any) {
      if (foreign.getSourceFile() !== context.sourceFile || resolve(context.filePath) !== resolve(context.sourceFile.fileName) || context.sourceText !== context.sourceFile.text) throw new Error('Lit detector context does not match its source');
      // Named helper classes in methods/functions are not top-level metadata declarations.
      if (foreign.parent !== context.sourceFile) return false;
      const node = owned(foreign);
      if (classSelection && !classSelection.has(node)) return false;
      if (classes.get(resolve(context.filePath))?.get(node.name.text) !== node) throw new Error('Lit detector class is not selected');
      if (!cache.has(node)) cache.set(node, derives(checker.getSymbolAtLocation(node.name)));
      if (cache.get(node) && classNameCounts.get(resolve(context.filePath))?.get(node.name.text) !== 1) throw new Error('Ambiguous Lit/native class name: ' + node.name.text);
      return cache.get(node)!;
    },
    isLitBaseClass(foreign: any) { return targets.has(unalias(checker.getSymbolAtLocation(owned(foreign).name))); },
  };
}

/** Lit owns reactive members and normalized heritage; retain every other native contract. */
export function supplementLitWithVanilla(lit: any, vanilla: any, label: string) {
  const result = structuredClone(lit);
  const namedRows = new Set(['attributes', 'slots', 'events', 'cssParts', 'cssProperties', 'cssStates']);
  const merge = (target: any, incoming: any, path: string) => {
    for (const [key, value] of Object.entries(incoming)) {
      if (value === undefined) continue;
      if (target[key] === undefined) target[key] = structuredClone(value);
      else if (!isDeepStrictEqual(target[key], value)) throw new Error('Lit/native contract conflict: ' + path + '.' + key);
    }
  };
  // This is the Lit detector's explicit framework-member policy, not a waiver
  // for arbitrary missing members. Reactive links are the only enriched facts.
  const frameworkMembers = new Set(['properties','styles','render','connectedCallback','disconnectedCallback','attributeChangedCallback','adoptedCallback','shouldUpdate','willUpdate','update','updated','firstUpdated','performUpdate','getUpdateComplete','requestUpdate','scheduleUpdate','createRenderRoot','controllers','addController','removeController','hostConnected','hostDisconnected']);
  for (const member of vanilla.members ?? []) {
    if (frameworkMembers.has(member.name)) continue;
    const matches = (result.members ?? []).filter((entry: any) => entry.name === member.name && entry.kind === member.kind && Boolean(entry.static) === Boolean(member.static));
    if (matches.length !== 1) throw new Error('Unrepresented native member: ' + label + '.' + member.name);
    const facts = Object.fromEntries(Object.entries(member).filter(([key]) => !['attribute','reflects'].includes(key)));
    merge(matches[0], facts, label + '.members[' + member.name + ']');
  }
  for (const [key, value] of Object.entries(vanilla)) {
    // Shared template contracts belong to Lit's source-aware scanner. The
    // vanilla raw-text scanner treats dynamic/fake markup as authored rows.
    if (value === undefined || ['members','superclass','slots','cssParts'].includes(key)) continue;
    if (namedRows.has(key)) {
      if (!Array.isArray(value) || (result[key] !== undefined && !Array.isArray(result[key]))) throw new Error('Invalid native contract rows: ' + label + '.' + key);
      const rows = result[key] ??= [], byName = new Map(rows.map((row: any) => [row.name, row]));
      if (byName.size !== rows.length) throw new Error('Duplicate Lit contract rows: ' + label + '.' + key);
      const nativeNames = new Set();
      for (const row of value) {
        if (typeof row.name !== 'string' || nativeNames.has(row.name)) throw new Error('Duplicate or unnamed native contract: ' + label + '.' + key);
        nativeNames.add(row.name);
        const existing = byName.get(row.name);
        if (existing) merge(existing, row, label + '.' + key + '[' + row.name + ']');
        else {const copy = structuredClone(row); rows.push(copy); byName.set(row.name, copy);}
      }
    } else merge(result, {[key]: value}, label);
  }
  return result;
}

/** A returned class is Lit-owned only through proved consuming compositions.
 * A factory used by both Lit and non-Lit roots needs occurrence-specific facet
 * extraction; this own-origin draft rejects that ambiguous framework policy.
 */
export function constructorLitOwnership(program: any, index: any, roots: any[]) {
  const {checker, targets, unalias} = consumedLitTargets(program);
  const policies = new Map<any, boolean>();
  function inspectBoundary(type: any) {
    if (!type || type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) throw new Error('Opaque external heritage cannot establish Lit ownership');
    if (type.isUnion?.()) throw new Error('Union external heritage requires occurrence-specific Lit ownership');
  }
  function derivesInstance(type: any, seen = new Set<any>()): boolean {
    if (seen.has(type)) return false;
    inspectBoundary(type); seen.add(type);
    if (type.isIntersection?.()) {
      const branches = type.types.map((part: any) => derivesInstance(part, seen));
      return branches.some(Boolean);
    }
    const symbol = unalias(type.getSymbol());
    if (targets.has(symbol)) return true;
    // Recover declared ancestry only for symbols with an actual declared type.
    // Structural TypeLiteral symbols otherwise produce the compiler's error Any.
    const declaredKinds = ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeParameter | ts.SymbolFlags.TypeAlias;
    let declared = false;
    if (symbol && !seen.has(symbol) && symbol.flags & declaredKinds) {
      seen.add(symbol);
      declared = derivesInstance(checker.getDeclaredTypeOfSymbol(symbol), seen);
    }
    const bases = type.isClassOrInterface?.() ? checker.getBaseTypes(type).map((base: any) => derivesInstance(base, seen)) : [];
    // An instance may itself be constructable through interface merging. Those
    // signatures are its public behavior, never evidence of its own ancestry.
    return Boolean(declared || bases.some(Boolean));
  }
  function derivesConstructor(type: any, seen = new Set<any>()): boolean {
    if (seen.has(type)) return false;
    inspectBoundary(type); seen.add(type);
    if (type.isIntersection?.()) {
      const branches = type.types.map((part: any) => derivesConstructor(part, seen));
      return branches.some(Boolean);
    }
    // Only constructor-position signatures supply ancestor instances. Visit all
    // branches before combining so a Lit branch cannot hide opaque alternatives.
    const instances = checker.getSignaturesOfType(type, ts.SignatureKind.Construct)
      .map((signature: any) => derivesInstance(checker.getReturnTypeOfSignature(signature)));
    return instances.some(Boolean);
  }
  for (const root of roots) {
    const steps = index.compositionFor(root);
    const terminalPolicies = steps.filter((step: any) => step.kind === 'terminal').map((step: any) => derivesConstructor(step.terminal.constructorType));
    const lit = terminalPolicies.some(Boolean);
    for (const step of steps) if (step.origin) {
      const origin = index.originFor(step.origin.node);
      if (policies.has(origin) && policies.get(origin) !== lit) throw new Error('Factory/class has mixed Lit and native consumers; occurrence-specific extraction is required');
      policies.set(origin, lit);
    }
  }
  return (origin: any) => {
    if (index.originFor(origin.node) !== origin || !policies.has(origin)) throw new Error('Lit selection requires a proved consuming origin');
    return policies.get(origin)!;
  };
}
