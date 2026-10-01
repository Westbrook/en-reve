import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {ts} from './compiler-api.mjs';

export type ConstructorSource = {
  version: 1; module: string; fileName: string; sourceSha256: string;
  kind: number; start: number; pos: number; end: number;
};

/** An opt-in graph for explicitly selected callable-heritage roots.
 * This is not a replacement for the ordinary inheritance path or its guard.
 * All nodes/types/symbols stay in this Program. Only source descriptors travel
 * between Programs. No authored module or factory is imported or invoked.
 * The graph proves a restricted source form, not arbitrary runtime mutation.
 */
export function constructorHeritageGraph(
  program: any, sources: any[], sourcePath: (source: any) => string, roots: any[],
) {
  const checker = program.getTypeChecker(); // Initializes Program parent links.
  const selected = new Map<string, any>(), modules = new Map<string, any>();
  const descriptors = new Map<any, ConstructorSource>(), checkedSources = new Set<any>();
  const factoryBindings = new Map<any, any>(), classes = new Map<any, any>();
  const activeClasses = new Set<any>(), stableBindings = new Set<any>();
  const unalias = (symbol: any) => symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  function owned(node: any) {
    const source = node?.getSourceFile();
    if (!source || program.getSourceFile(source.fileName) !== source) throw new Error('Mixin node belongs to another compiler Program');
    return source;
  }
  function fail(node: any, message: string): never {
    const source = owned(node);
    throw new Error('[CEM_UNSUPPORTED_MIXIN] ' + source.fileName + ':' + node.getStart(source) + ': ' + message);
  }
  for (const source of sources) {
    if (!ts.isSourceFile(source) || owned(source) !== source) throw new Error('Mixin selection requires Program-owned source files');
    const file = resolve(source.fileName), module = sourcePath(source);
    if (selected.has(file) || !module || modules.has(module)) throw new Error('Duplicate or empty selected mixin module: ' + module);
    selected.set(file, source);modules.set(module, source);
  }
  function selectedSource(node: any) {
    const source = owned(node);
    if (selected.get(resolve(source.fileName)) !== source || source.isDeclarationFile) fail(node, 'Implementation must be selected source, not a declaration-only dependency');
    return source;
  }
  function checkSource(node: any) {
    const source = selectedSource(node);
    if (checkedSources.has(source)) return;
    // A resolved signature is best-effort on invalid calls. Suppressed checking
    // must not convert it into acceptance. This first subset requires strict TS.
    const options = program.getCompilerOptions();
    if (options.strict !== true || options.noCheck || ![ts.ScriptKind.TS, ts.ScriptKind.TSX].includes(source.scriptKind)) {
      fail(node, 'Graph qualification requires checked strict TypeScript source');
    }
    // Use the parser's actual directives: a standalone scanner cannot rescan
    // template tails and regular expressions in their syntactic context.
    if (source.checkJsDirective?.enabled === false || source.commentDirectives?.length) {
      fail(node, 'Type-check suppression comments need an explicit adapter');
    }
    const diagnostics = [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)]
      .filter((item: any) => item.category === ts.DiagnosticCategory.Error);
    if (diagnostics.length) fail(node, 'TypeScript diagnostics prevent graph qualification: ' + [...new Set(diagnostics.map((item: any) => item.code))].join(', '));
    checkedSources.add(source);
  }
  function descriptor(node: any): ConstructorSource {
    const prior = descriptors.get(node);if (prior) return prior;
    const source = selectedSource(node);
    const value: ConstructorSource = {version: 1, module: sourcePath(source), fileName: resolve(source.fileName),
      sourceSha256: createHash('sha256').update(source.text).digest('hex'),
      kind: node.kind, start: node.getStart(source), pos: node.pos, end: node.end};
    descriptors.set(node, value);return value;
  }
  function unwrap(input: any): any {
    owned(input);let node = input;
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
      fail(node, 'Asserted constructor expressions need a qualified contract');
    }
    return node;
  }
  function topLevelConst(node: any) {
    checkSource(node);
    if (!ts.isVariableDeclaration(node) || !node.initializer || !ts.isIdentifier(node.name) || node.type ||
        !ts.isVariableDeclarationList(node.parent) || !(node.parent.flags & ts.NodeFlags.Const) ||
        !ts.isVariableStatement(node.parent.parent) || node.parent.parent.parent !== owned(node)) {
      fail(node, 'Aliases require unannotated module-level const declarations');
    }
    return node;
  }
  // Top-level function/class declarations can be reassigned. Check writes in
  // their owning module; imports cannot assign an ES module's live bindings.
  function stableBinding(symbol: any, node: any) {
    if (stableBindings.has(symbol)) return;
    const source = selectedSource(node);
    if (!ts.isExternalModule(source)) fail(node, 'Callable graph bindings require an ES module');
    function writes(target: any): boolean {
      // A write through a cast still rebinds an identifier; casts on unrelated
      // assignment targets must not reject this otherwise stable binding.
      while (ts.isParenthesizedExpression(target) || ts.isAsExpression(target) ||
          ts.isTypeAssertionExpression(target) || ts.isNonNullExpression(target) || ts.isSatisfiesExpression(target)) target = target.expression;
      if (ts.isIdentifier(target)) return unalias(checker.getSymbolAtLocation(target)) === symbol;
      if (ts.isArrayLiteralExpression(target)) return target.elements.some((item: any) => !ts.isOmittedExpression(item) && writes(ts.isSpreadElement(item) ? item.expression : item));
      if (ts.isObjectLiteralExpression(target)) return target.properties.some((item: any) =>
        ts.isShorthandPropertyAssignment(item) ? unalias(checker.getShorthandAssignmentValueSymbol(item)) === symbol :
        ts.isPropertyAssignment(item) ? writes(item.initializer) : ts.isSpreadAssignment(item) ? writes(item.expression) : false);
      // Assignment defaults in a destructuring target.
      if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) return writes(target.left);
      return false; // Property writes do not rebind the declaration itself.
    }
    function visit(value: any) {
      if (ts.isBinaryExpression(value) && value.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
          value.operatorToken.kind <= ts.SyntaxKind.LastAssignment && writes(value.left)) fail(value, 'Constructor/factory binding is reassigned');
      if ((ts.isPrefixUnaryExpression(value) || ts.isPostfixUnaryExpression(value)) &&
          [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(value.operator) && writes(value.operand)) fail(value, 'Constructor/factory binding is updated');
      if ((ts.isForInStatement(value) || ts.isForOfStatement(value)) && !ts.isVariableDeclarationList(value.initializer) && writes(value.initializer)) fail(value, 'Constructor/factory binding is assigned by a loop');
      ts.forEachChild(value, visit);
    }
    visit(source);stableBindings.add(symbol);
  }
  function moduleSymbol(symbol: any, node: any, visiting: Set<any>): any {
    symbol = unalias(symbol);
    if (!symbol?.declarations?.length) fail(node, 'Unresolved namespace receiver');
    if (visiting.has(symbol)) fail(node, 'Circular namespace alias');
    visiting.add(symbol);
    try {
      if (symbol.declarations.length === 1 && ts.isSourceFile(symbol.declarations[0])) {
        owned(symbol.declarations[0]);return symbol;
      }
      if (symbol.declarations.length === 1 && ts.isVariableDeclaration(symbol.declarations[0])) {
        const alias = topLevelConst(symbol.declarations[0]);
        return namespaceFor(alias.initializer, visiting);
      }
      fail(node, 'Receiver must resolve to an ES module namespace');
    } finally {visiting.delete(symbol);}
  }
  function namespaceFor(input: any, visiting = new Set<any>()): any {
    const node = unwrap(input);
    if (ts.isIdentifier(node)) return moduleSymbol(checker.getSymbolAtLocation(node), node, visiting);
    if (ts.isPropertyAccessExpression(node)) return moduleSymbol(propertySymbol(node, visiting), node, visiting);
    fail(node, 'Namespace receivers cannot be calls, assertions or value-shaped objects');
  }
  function propertySymbol(node: any, visiting = new Set<any>()) {
    const module = namespaceFor(node.expression, visiting);
    const exported = checker.getExportsOfModule(module).find((item: any) => item.name === node.name.text);
    const actual = checker.getSymbolAtLocation(node);
    if (!exported || !actual || unalias(exported) !== unalias(actual)) fail(node, 'Property does not bind to the proved module export');
    return actual;
  }
  function symbolFor(input: any) {
    const node = unwrap(input);
    const symbol = unalias(ts.isIdentifier(node) ? checker.getSymbolAtLocation(node) :
      ts.isPropertyAccessExpression(node) ? propertySymbol(node) : undefined);
    if (!symbol?.declarations?.length) fail(node, 'Constructor/factory requires a uniquely bound name');
    return symbol;
  }
  const heritage = (node: any) => node.heritageClauses?.find((clause: any) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
  function factoryFor(input: any, visiting = new Set<any>()): any {
    const expression = unwrap(input), symbol = symbolFor(expression);
    const cached = factoryBindings.get(symbol);if (cached) return cached;
    if (visiting.has(symbol)) fail(expression, 'Circular factory alias');
    visiting.add(symbol);
    try {
      if (symbol.declarations.length !== 1) fail(expression, 'Overloaded/merged factories require an explicit adapter');
      const declaration = symbol.declarations[0];checkSource(declaration);
      let callable;
      if (ts.isFunctionDeclaration(declaration) && declaration.parent === owned(declaration)) callable = declaration;
      else if (ts.isVariableDeclaration(declaration)) {
        topLevelConst(declaration);const initializer = unwrap(declaration.initializer);
        if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) callable = initializer;
        else {
          const target = factoryFor(initializer, visiting);
          const binding = {factory: target.factory, aliases: [descriptor(declaration), ...target.aliases]};
          factoryBindings.set(symbol, binding);return binding;
        }
      }
      if (!callable?.body || callable.type || callable.asteriskToken ||
          (ts.getCombinedModifierFlags(callable) & ts.ModifierFlags.Async)) fail(declaration, 'Factory requires an unannotated synchronous module-level implementation');
      stableBinding(symbol, declaration);
      if (callable.parameters.length !== 1) fail(callable, 'Factory must accept exactly one constructor parameter');
      const parameter = callable.parameters[0];
      if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken || parameter.questionToken) fail(parameter, 'Constructor parameter must be a required bound identifier');
      const parameterSymbol = checker.getSymbolAtLocation(parameter.name);
      if (!parameterSymbol || !checker.getSignaturesOfType(checker.getTypeAtLocation(parameter), ts.SignatureKind.Construct).length) fail(parameter, 'Constructor parameter lacks a construct signature');
      let returned;
      if (ts.isBlock(callable.body)) {
        const statements = callable.body.statements, last = statements.at(-1);
        if (!last || !ts.isReturnStatement(last) || !last.expression) fail(callable, 'Factory must have one unconditional terminal return');
        returned = unwrap(last.expression);
        if (statements.length === 2 && ts.isClassDeclaration(statements[0]) && ts.isIdentifier(returned)) {
          const bound = unalias(checker.getSymbolAtLocation(returned));
          if (bound?.declarations?.length !== 1 || bound.declarations[0] !== statements[0]) fail(returned, 'Return must bind to the sole directly declared implementation class');
          returned = statements[0];
        } else if (statements.length !== 1) fail(callable, 'Preceding factory statements need an explicit adapter');
      } else returned = unwrap(callable.body);
      if (!ts.isClassExpression(returned) && !ts.isClassDeclaration(returned)) fail(callable, 'Factory must return its proved class implementation');
      if (ts.canHaveDecorators(returned) && ts.getDecorators(returned)?.length) fail(returned, 'Returned-class decorators need an explicit adapter');
      const base = heritage(returned)?.expression;
      if (!base || !ts.isIdentifier(unwrap(base)) || checker.getSymbolAtLocation(unwrap(base)) !== parameterSymbol) fail(returned, 'Returned class must extend the actual constructor parameter');
      if (!declaration.name || !ts.isIdentifier(declaration.name)) fail(declaration, 'Factory requires a stable declaration name');
      const factory = {symbol, declaration, callable, parameter, parameterSymbol, implementation: returned,
        reference: {name: declaration.name.text, module: sourcePath(owned(declaration))},
        source: {factory: descriptor(declaration), callable: descriptor(callable), parameter: descriptor(parameter), implementation: descriptor(returned)}};
      const binding = {factory, aliases: []};factoryBindings.set(symbol, binding);return binding;
    } finally {visiting.delete(symbol);}
  }
  function typeAt(expression: any) {
    const constructorType = checker.getTypeAtLocation(expression);
    const constructSignatures = checker.getSignaturesOfType(constructorType, ts.SignatureKind.Construct);
    if (!constructSignatures.length || constructorType.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) fail(expression, 'Expression has no checked constructor result');
    return {constructorType, constructSignatures, instanceTypes: constructSignatures.map((signature: any) => checker.getReturnTypeOfSignature(signature))};
  }
  function constructorFor(input: any, visiting = new Set<any>(), instanceType?: any): any {
    checkSource(input);const expression = unwrap(input);
    if (ts.isCallExpression(expression)) {
      if (expression.questionDotToken || expression.arguments.length !== 1 || ts.isSpreadElement(expression.arguments[0])) fail(expression, 'Mixin application needs one explicit constructor argument');
      const binding = factoryFor(expression.expression), factory = binding.factory;
      const signature = checker.getResolvedSignature(expression);
      if (!signature || signature.getDeclaration() !== factory.callable) fail(expression, 'Call does not resolve to the proved implementation');
      return {kind: 'application', factory, factoryAliases: binding.aliases, expression,
        source: descriptor(expression), argumentSource: descriptor(expression.arguments[0]),
        argument: constructorFor(expression.arguments[0], visiting), signature,
        parameterType: checker.getTypeOfSymbolAtLocation(signature.parameters[0], expression),
        ...typeAt(expression), ...(instanceType ? {instanceType} : {})};
    }
    const symbol = symbolFor(expression);
    if (visiting.has(symbol)) fail(expression, 'Circular constructor alias');
    visiting.add(symbol);
    try {
      const declarations = symbol.declarations;
      // Preserve default-library constructors with interface-only augmentation.
      if (symbol.valueDeclaration && program.isSourceFileDefaultLibrary(owned(symbol.valueDeclaration)) &&
          declarations.every((node: any) => program.isSourceFileDefaultLibrary(owned(node)) || ts.isInterfaceDeclaration(node))) {
        return {kind: 'terminal', ownership: 'platform', symbol, declaration: symbol.valueDeclaration, expression, ...typeAt(expression), ...(instanceType ? {instanceType} : {})};
      }
      const declaredClasses = declarations.filter(ts.isClassDeclaration);
      if (declaredClasses.length === 1 && declarations.every((node: any) => ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node))) {
        const declaration = declaredClasses[0], source = owned(declaration);
        if (selected.get(resolve(source.fileName)) === source) {
          if (declaration.parent !== source || !declaration.name) fail(declaration, 'Selected constructor classes must be named module-level declarations');
          stableBinding(symbol, declaration);
          return {kind: 'class-reference', symbol, declaration, expression, source: descriptor(expression),
            entry: classFor(declaration), ...typeAt(expression), ...(instanceType ? {instanceType} : {})};
        }
        if (!program.isSourceFileFromExternalLibrary(source)) fail(expression, 'Unselected local superclass cannot be treated as an opaque dependency');
        return {kind: 'terminal', ownership: 'external-library', symbol, declaration, expression, ...typeAt(expression), ...(instanceType ? {instanceType} : {})};
      }
      if (declarations.length === 1 && ts.isVariableDeclaration(declarations[0])) {
        const declaration = topLevelConst(declarations[0]);
        return {kind: 'constructor-alias', declaration, expression, source: descriptor(declaration),
          target: constructorFor(declaration.initializer, visiting, instanceType), ...typeAt(expression), ...(instanceType ? {instanceType} : {})};
      }
      fail(expression, 'Constructor has no uniquely owned class declaration');
    } finally {visiting.delete(symbol);}
  }
  function classFor(node: any): any {
    const cached = classes.get(node);if (cached) return cached;
    checkSource(node);
    if (!ts.isClassDeclaration(node) || node.parent !== owned(node) || !node.name) fail(node, 'Graph roots require named module-level class declarations');
    if (activeClasses.has(node)) fail(node, 'Circular selected class heritage');
    activeClasses.add(node);
    try {
      const base = heritage(node);
      const entry = {kind: 'class', node, source: descriptor(node),
        instanceType: checker.getTypeAtLocation(node),
        base: base ? constructorFor(base.expression, new Set(), checker.getTypeAtLocation(base)) : undefined};
      classes.set(node, entry);return entry;
    } finally {activeClasses.delete(node);}
  }
  if (!Array.isArray(roots) || new Set(roots).size !== roots.length) throw new Error('Explicit unique callable-heritage roots are required');
  for (const root of roots) classFor(root);

  /** Base-first steps preserve intermediate class overrides and every application.
   * Reference contexts retain generic instantiations; a later metadata adapter
   * must resolve each exposed facet in its consuming context, not print a shared
   * generic fragment as though it were instantiated for every caller.
   */
  function compositionFor(entry: any) {
    if (classes.get(entry?.node) !== entry) throw new Error('Composition entry belongs to another graph');
    const steps: any[] = [];
    function visitClass(current: any, contexts: any[]) {
      if (current.base) visitEdge(current.base, contexts);
      steps.push({kind: 'class', entry: current, contexts});
    }
    function visitEdge(edge: any, contexts: any[]) {
      if (edge.kind === 'constructor-alias') visitEdge(edge.target, contexts);
      else if (edge.kind === 'class-reference') visitClass(edge.entry, [...contexts, edge]);
      else if (edge.kind === 'application') {visitEdge(edge.argument, [...contexts, edge]);steps.push({kind: 'application', application: edge, contexts});}
      else if (edge.kind === 'terminal') steps.push({kind: 'terminal', terminal: edge, contexts});
      else throw new Error('Unknown constructor graph edge');
    }
    visitClass(entry, []);return steps;
  }
  return {classes, factories: new Set([...factoryBindings.values()].map(value => value.factory)), descriptor, compositionFor};
}

/** Rebind exact portable coordinates in a coherent, explicitly selected Program. */
export function rebindConstructorSource(
  program: any, descriptor: ConstructorSource, sources: any[], sourcePath: (source: any) => string,
) {
  program.getTypeChecker();
  if (!descriptor || descriptor.version !== 1 || typeof descriptor.fileName !== 'string' ||
      descriptor.fileName !== resolve(descriptor.fileName) || !/^[a-f0-9]{64}$/.test(descriptor.sourceSha256) ||
      !['kind', 'start', 'pos', 'end'].every(key => Number.isSafeInteger((descriptor as any)[key]))) throw new Error('Invalid mixin source descriptor');
  const source = program.getSourceFile(descriptor.fileName);
  if (!source || resolve(source.fileName) !== descriptor.fileName ||
      createHash('sha256').update(source.text).digest('hex') !== descriptor.sourceSha256) throw new Error('Mixin descriptor source bytes changed');
  const matches = sources.filter(item => {
    if (!ts.isSourceFile(item) || program.getSourceFile(item.fileName) !== item) throw new Error('Mixin selection belongs to another compiler Program');
    return item === source;
  });
  if (matches.length !== 1 || sourcePath(source) !== descriptor.module || descriptor.pos < 0 ||
      descriptor.pos > descriptor.start || descriptor.start > descriptor.end || descriptor.end > source.end) throw new Error('Mixin descriptor is outside selected source');
  const found: any[] = [];
  function visit(node: any) {
    if (node.kind === descriptor.kind && node.pos === descriptor.pos && node.end === descriptor.end && node.getStart(source) === descriptor.start) found.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (found.length !== 1 || found[0].getSourceFile() !== source) throw new Error('Mixin descriptor has no unique source node');
  return found[0];
}
