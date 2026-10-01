import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {ts} from './compiler-api.mjs';
import {constructorHeritageGraph, rebindConstructorSource} from './candidate-mixin-graph.ts';
import type {ConstructorSource} from './candidate-mixin-graph.ts';

/** Source joins shared by prospective extraction, provenance and composition.
 * No extractor/validator is installed by this module. The candidate guard stays.
 * Only exact proved class nodes can become origins; names are output labels.
 * effectiveMember is for surviving members at one root, not a substitute for
 * validation of authored factory signatures, hidden payloads or shadowed types.
 */
export function constructorOriginIndex(program: any, sources: any[], sourcePath: (source: any) => string, roots: any[]) {
  if (!Array.isArray(sources) || !Array.isArray(roots)) throw new Error('Explicit source and root arrays are required');
  sources = [...sources]; roots = [...roots];
  const checker = program.getTypeChecker();
  const graph = constructorHeritageGraph(program, sources, sourcePath, roots);
  const origins = new Map<any, any>(), factories = new Map<any, any>();
  const bindings = new WeakMap<object, any>(), byOrigin = new Map<any, object>();
  const compositions = new Map<any, readonly any[]>(), rootSet = new Set(roots);
  const copySource = (value: ConstructorSource) => Object.freeze({...value});
  function owned(node: any) {
    const source = node?.getSourceFile();
    if (!source || program.getSourceFile(source.fileName) !== source) throw new Error('Origin node belongs to another compiler Program');
    return node;
  }
  function add(node: any, kind: string, reference: any, factory?: any) {
    owned(node);
    if (origins.has(node)) throw new Error('Duplicate constructor origin');
    const origin = Object.freeze({kind, node, reference: Object.freeze({...reference}),
      source: copySource(graph.descriptor(node)),
      ...(factory ? {factory, factorySource: copySource(factory.source.factory), callableSource: copySource(factory.source.callable)} : {})});
    origins.set(node, origin);
    if (factory) factories.set(factory.declaration, origin);
  }
  for (const entry of graph.classes.values()) add(entry.node, 'class', {name: entry.node.name.text, module: sourcePath(entry.node.getSourceFile())});
  for (const factory of graph.factories) add(factory.implementation, 'mixin', factory.reference, factory);
  function originFor(node: any) {
    owned(node);const origin = origins.get(node);
    if (!origin) throw new Error('Class is not a proved constructor origin');
    return origin;
  }
  function rootEntry(root: any) {
    owned(root);
    if (!rootSet.has(root)) throw new Error('Composition requires an explicitly selected root');
    return graph.classes.get(root);
  }
  function compositionFor(root: any) {
    const entry = rootEntry(root);
    if (!compositions.has(root)) {
      const steps = graph.compositionFor(entry).map((step: any, index: number) => {
        const node = step.kind === 'class' ? step.entry.node : step.kind === 'application' ? step.application.factory.implementation : undefined;
        return Object.freeze({index, root, kind: step.kind,
          ...(node ? {origin: originFor(node)} : {terminal: step.terminal}),
          ...(step.kind === 'application' ? {application: copySource(step.application.source)} : {}),
          contexts: Object.freeze(step.contexts.map((edge: any) => Object.freeze({kind: edge.kind, source: copySource(edge.source)}))),
        });
      });
      compositions.set(root, Object.freeze(steps));
    }
    return compositions.get(root)!;
  }
  /** Bind a CEM object at extraction time, before any serialization or flattening.
   * A matching module/name alone never proves provenance. Duplicate CEM objects
   * for one origin and reused objects for another origin are both rejected.
   */
  function bindExtracted(module: string, descriptor: ConstructorSource, declaration: any) {
    const node = rebindConstructorSource(program, descriptor, sources, sourcePath), origin = originFor(node);
    if (!declaration || typeof declaration !== 'object' || Array.isArray(declaration) ||
        module !== origin.reference.module || declaration.name !== origin.reference.name || declaration.kind !== origin.kind) {
      throw new Error('Extracted declaration does not match its proved origin');
    }
    if (bindings.has(declaration) || byOrigin.has(origin)) throw new Error('Constructor origin is already bound');
    bindings.set(declaration, origin);byOrigin.set(origin, declaration);return declaration;
  }
  function originOf(declaration: any) {
    const origin = declaration && typeof declaration === 'object' ? bindings.get(declaration) : undefined;
    if (!origin || declaration.name !== origin.reference.name || declaration.kind !== origin.kind) throw new Error('Unbound or changed extracted declaration');
    return origin;
  }
  /** A module supplement can join a proved factory to its existing mixin row.
   * Ordinary functions/variables remain the caller's responsibility. This does
   * not classify export edges, aliases or type-only exports by spelling.
   */
  function joinFactory(module: string, factoryDeclaration: any, declaration: any) {
    owned(factoryDeclaration);const origin = factories.get(factoryDeclaration);
    if (!origin || module !== origin.reference.module || originOf(declaration) !== origin) throw new Error('Factory supplementation requires its exact bound mixin');
    return declaration;
  }
  /** The validator must inspect both units with its existing strict policy.
   * Returning a unit does not grant any exemption to nested/hidden named types.
   */
  function provenanceUnits(declaration: any) {
    const origin = originOf(declaration);
    return Object.freeze({implementation: origin.node, ...(origin.factory ? {callable: origin.factory.callable} : {}),
      reference: origin.reference, source: origin.source});
  }
  function memberClass(node: any): any {
    owned(node);
    if (ts.isParameter(node) && ts.isConstructorDeclaration(node.parent) && ts.isParameterPropertyDeclaration(node, node.parent)) return node.parent.parent;
    if (ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) return node.parent;
    throw new Error('Member declaration needs an explicit origin adapter');
  }
  const staticMember = (node: any) => Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Static);
  /** Resolve the composition winner and full semantic property at one root.
   * This avoids copying generic T from a shared declaration or accepting an
   * earlier repeated application as the winner merely because its AST matches.
   * Return the semantic type for the real serializer/validator, not guessed text.
   */
  function effectiveMember(root: any, name: string, isStatic = false) {
    const entry = rootEntry(root), steps = compositionFor(root);
    if (typeof name !== 'string' || !name || typeof isStatic !== 'boolean') throw new Error('A named member and static/instance side are required');
    const rootSymbol = checker.getSymbolAtLocation(root.name);
    const type = isStatic ? checker.getTypeOfSymbolAtLocation(rootSymbol, root) : entry.instanceType;
    const symbol = checker.getPropertyOfType(type, name);
    if (!symbol?.declarations?.length) throw new Error('Member has no exact source declaration: ' + name);
    const declarations = [...symbol.declarations];
    // Inferred mixin returns intersect their own constructor with the argument.
    // The checker can aggregate both declarations for one property. Prove every
    // contributor, then use composition order for metadata ownership; preserve
    // the complete semantic type and declarations for the strict consumer.
    const contributors = declarations.map(node => {
      if (staticMember(node) !== isStatic) throw new Error('Member side disagrees with its declaration: ' + name);
      const origin = originFor(memberClass(node));
      const matches = steps.filter(step => step.origin === origin);
      if (!matches.length) throw new Error('Member origin is outside this root composition');
      return Object.freeze({declaration: node, origin, step: matches.at(-1)!});
    });
    const winner = contributors.reduce((last, item) => item.step.index > last.step.index ? item : last);
    const {origin, step} = winner;
    return Object.freeze({name, static: isStatic, symbol,
      type: checker.getTypeOfSymbolAtLocation(symbol, root),
      declarations: Object.freeze(declarations), contributors: Object.freeze(contributors), origin, step,
      sources: Object.freeze(declarations.map(node => copySource(graph.descriptor(node))))});
  }
  function terminalSource(terminal: any) {
    const node = owned(terminal.declaration), source = node.getSourceFile();
    return {ownership: terminal.ownership, symbol: terminal.symbol.name, fileName: resolve(source.fileName),
      sourceSha256: createHash('sha256').update(source.text).digest('hex'),
      kind: node.kind, pos: node.pos, start: node.getStart(source), end: node.end};
  }
  function portable() {
    return {version: 1, selection: sources.map(source => copySource(graph.descriptor(source))), roots: roots.map(root => copySource(graph.descriptor(root))),
      origins: [...origins.values()].map(origin => ({kind: origin.kind, reference: {...origin.reference}, source: {...origin.source},
        ...(origin.factory ? {factorySource: {...origin.factorySource}, callableSource: {...origin.callableSource}} : {})})),
      compositions: roots.map(root => ({root: {...graph.descriptor(root)}, steps: compositionFor(root).map(step => ({index: step.index, kind: step.kind,
        ...(step.origin ? {origin: {...step.origin.source}} : {terminal: terminalSource(step.terminal)}),
        ...(step.application ? {application: {...step.application}} : {}),
        contexts: step.contexts.map((context: any) => ({kind: context.kind, source: {...context.source}})),
      }))})),
    };
  }
  return Object.freeze({originFor, compositionFor, bindExtracted, originOf, joinFactory, provenanceUnits, effectiveMember, portable});
}

/** Recompute the graph in the new Program; descriptors are not trust tokens. */
export function rebindConstructorOrigins(program: any, sources: any[], sourcePath: (source: any) => string, packet: any) {
  if (packet?.version !== 1 || !Array.isArray(packet.roots)) throw new Error('Invalid constructor origin packet');
  const roots = packet.roots.map((source: ConstructorSource) => rebindConstructorSource(program, source, sources, sourcePath));
  const index = constructorOriginIndex(program, sources, sourcePath, roots);
  // This is an internal exact-format handoff, not an arbitrary JSON API.
  if (JSON.stringify(index.portable()) !== JSON.stringify(packet)) throw new Error('Constructor origin packet does not match recomputed ownership');
  return index;
}

/** One formatting operation shared by pre-seal input capture and serialization.
 * This prints a caller-owned semantic type; it grants no facet/type admission.
 */
export function constructorSemanticTypeText(checker: any, type: any, root: any, expanded = false) {
  return checker.typeToString(type, root, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType | (expanded ? ts.TypeFormatFlags.InTypeAlias : 0));
}
