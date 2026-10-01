import {resolve, relative, sep, isAbsolute} from 'node:path';
import {ts} from './compiler-api.mjs';
import {relativeImportTypes} from './type-text.ts';
import {candidatePackageExport} from './candidate-package-exports.ts';

/** Retain modules, callable/variable declarations and barrel edges that the class detector omits. */
export function completeCandidateModules(manifest: any, sourceRoot: string, sources: any[], checker: any, program?: any, constructorBindings?: any) {
  if (program && (program.getTypeChecker() !== checker || sources.some(source => program.getSourceFile(source.fileName) !== source))) {
    throw new Error('Export supplementation requires its originating compiler Program and source nodes.');
  }
  if (constructorBindings) {
    constructorBindings.assertProgram(program, sources);
    for (const module of manifest.modules) for (const declaration of module.declarations ?? []) {
      if (['class', 'mixin'].includes(declaration.kind)) constructorBindings.assertDeclaration(module.path, declaration);
    }
  }
  const pathFor = (file: string) => relative(sourceRoot, resolve(file)).split(sep).join('/');
  const selected = new Set(sources.map(source => pathFor(source.fileName)));
  // Validate unsupported exports before mutating any upstream module or replacing its JS exports.
  // Anonymous defaults have no stable authored declaration name in this adapter yet.
  for (const source of sources) for (const node of source.statements) {
    if (ts.isFunctionDeclaration(node) && !node.name && (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Default)) {
      throw new Error(`[CEM_UNSUPPORTED_ANONYMOUS_DEFAULT_FUNCTION] ${pathFor(source.fileName)}: anonymous default functions require a qualified metadata adapter.`);
    }
  }
  const modules = new Map<string, any>();
  for (const module of manifest.modules) {
    if (!selected.has(module.path) || modules.has(module.path)) throw new Error('Unexpected or duplicate generated module: ' + module.path);
    modules.set(module.path, module);
  }
  const supplemented: Array<{module: string; name: string; kind: string}> = [];
  const externalExports: any[] = [];
  const edgeKey = (module: string, name: string, reference: any) => JSON.stringify([module, name, reference?.package ?? null, reference?.module ?? null, reference?.name ?? null]);
  const typeOnlyBindings = new Set<string>();
  const typeOnlyExports: Array<{module: string; name: string; target: string}> = [];
  const exported = (node: any) => Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export);
  const documentation = (node: any) => {
    const symbol = node.name && checker.getSymbolAtLocation(node.name);
    return symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : '';
  };
  const typeText = (node: any) => node.type?.getText() ?? relativeImportTypes(
    checker.typeToString(checker.getTypeAtLocation(node), node, ts.TypeFormatFlags.NoTruncation), node.getSourceFile().fileName, ts,
  );
  const terminalSymbol = (symbol: any) => symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const moduleExports = new Map<any, Map<string, any>>();
  const exportBindings = new Map<any, Map<string, object>>();
  const exportsFor = (symbol: any) => {
    if (!moduleExports.has(symbol)) moduleExports.set(symbol, new Map(checker.getExportsOfModule(symbol).map((entry: any) => [entry.name, entry])));
    return moduleExports.get(symbol)!;
  };
  const moduleAt = (specifier: any) => {
    const symbol = checker.getSymbolAtLocation(specifier);
    if (!symbol) throw new Error('Unresolved export module: ' + specifier.getText());
    return symbol;
  };
  // Class symbols have both type and value flags even behind `export type`.
  // Follow each binding, not just its terminal declaration. Star exports can
  // reuse that terminal symbol, so their module/name path must also be inspected.
  function hasValueExport(moduleSymbol: any, name: string, visiting: Set<object>): boolean {
    const symbol = exportsFor(moduleSymbol).get(name);
    if (!symbol) throw new Error('Unresolved export binding: ' + moduleSymbol.name + '#' + name);
    let bindings = exportBindings.get(moduleSymbol);
    if (!bindings) exportBindings.set(moduleSymbol, bindings = new Map());
    if (!bindings.has(name)) bindings.set(name, {});
    const binding = bindings.get(name)!;
    if (visiting.has(binding)) return false;
    visiting.add(binding);
    try {
      const sources = (moduleSymbol.declarations ?? []).filter((node: any) => ts.isSourceFile(node));
      if (sources.length !== 1) throw new Error('Export module requires an explicit adapter: ' + moduleSymbol.name);
      const source = sources[0];
      // An explicit binding wins over star exports with the same name.
      if (symbol.declarations?.some((node: any) => node.getSourceFile() === source)) return hasValueSymbol(symbol, visiting);
      if (name === 'default') throw new Error('Unresolved default export binding: ' + source.fileName);
      let matched = false;
      for (const statement of source.statements) {
        if (!ts.isExportDeclaration(statement) || statement.exportClause || !statement.moduleSpecifier) continue;
        const targetModule = moduleAt(statement.moduleSpecifier), target = exportsFor(targetModule).get(name);
        if (!target || terminalSymbol(target) !== terminalSymbol(symbol)) continue;
        matched = true;
        if (!statement.isTypeOnly && hasValueExport(targetModule, name, visiting)) return true;
      }
      if (!matched) throw new Error('Unclassified export binding: ' + source.fileName + '#' + name);
      return false;
    } finally { visiting.delete(binding); }
  }
  function hasValueSymbol(symbol: any, visiting: Set<object>): boolean {
    if (!(symbol.flags & ts.SymbolFlags.Alias)) return Boolean(symbol.flags & ts.SymbolFlags.Value);
    if (visiting.has(symbol)) return false;
    visiting.add(symbol);
    try {
      const declarations = symbol.declarations ?? [];
      if (declarations.length !== 1) throw new Error('Unqualified alias declarations: ' + symbol.name);
      const declaration = declarations[0];
      if (ts.isExportSpecifier(declaration)) {
        const statement = declaration.parent.parent;
        if (declaration.isTypeOnly || statement.isTypeOnly) return false;
        if (statement.moduleSpecifier) return hasValueExport(moduleAt(statement.moduleSpecifier), (declaration.propertyName ?? declaration.name).text, visiting);
      } else if (ts.isImportSpecifier(declaration)) {
        const clause = declaration.parent.parent;
        if (declaration.isTypeOnly || clause.isTypeOnly) return false;
        return hasValueExport(moduleAt(clause.parent.moduleSpecifier), (declaration.propertyName ?? declaration.name).text, visiting);
      } else if (ts.isImportClause(declaration)) {
        if (declaration.isTypeOnly) return false;
        return hasValueExport(moduleAt(declaration.parent.moduleSpecifier), 'default', visiting);
      } else if (ts.isImportEqualsDeclaration(declaration) && declaration.isTypeOnly) return false;
      const immediate = checker.getImmediateAliasedSymbol(symbol);
      if (!immediate) throw new Error('Unresolved immediate export alias: ' + symbol.name);
      return hasValueSymbol(immediate, visiting);
    } finally { visiting.delete(symbol); }
  }
  for (const source of sources) {
    const path = pathFor(source.fileName);
    const module = modules.get(path) ?? {kind: 'javascript-module', path, declarations: [], exports: []};
    modules.set(path, module);
    // The upstream temp-config-relative `source` is provenance, never a new module identity.
    module.source = path;
    const declarations = new Map<string, any>((module.declarations ?? []).map((value: any) => [value.name, value]));
    if (declarations.size !== (module.declarations ?? []).length) throw new Error('Duplicate declarations in ' + path);
    const add = (value: any) => {
      if (declarations.has(value.name)) throw new Error('Candidate declaration collision: ' + path + '#' + value.name);
      declarations.set(value.name, value); supplemented.push({module: path, name: value.name, kind: value.kind});
    };
    for (const node of source.statements) {
      if (ts.isClassDeclaration(node) && node.name && !declarations.has(node.name.text)) {
        throw new Error('Generator omitted source class: ' + path + '#' + node.name.text);
      }
      const callable = (name: string, implementation: any, documented: any) => {
        if (implementation.getSourceFile() !== source) throw new Error('Callable initializer belongs to a different source: ' + name);
        const mixin = constructorBindings?.factoryDeclaration(documented);
        if (mixin) {
          if (declarations.get(name) !== mixin) throw new Error('Bound mixin declaration was replaced before export supplementation: ' + path + '#' + name);
          constructorBindings.joinFactory(path, documented, mixin);
          return;
        }
        const description = documentation(documented);
        const signature = checker.getSignatureFromDeclaration(implementation);
        if (!signature) throw new Error('Cannot resolve function return type: ' + path + '#' + name);
        const returnType = implementation.type?.getText(source) ?? relativeImportTypes(
          checker.typeToString(checker.getReturnTypeOfSignature(signature), implementation, ts.TypeFormatFlags.NoTruncation), source.fileName, ts,
        );
        add({kind: 'function', name, parameters: implementation.parameters.map((parameter: any) => ({
          name: parameter.name.getText(source), type: {text: typeText(parameter)},
          ...(parameter.questionToken ? {optional: true} : {}), ...(parameter.dotDotDotToken ? {rest: true} : {}),
          ...(parameter.initializer ? {default: parameter.initializer.getText(source)} : {}),
        })), return: {type: {text: returnType}}, ...(description ? {description} : {})});
      };
      if (ts.isFunctionDeclaration(node) && node.name && exported(node) && node.body) callable(node.name.text, node, node);
      if (ts.isVariableStatement(node) && exported(node)) for (const variable of node.declarationList.declarations) {
        if (!ts.isIdentifier(variable.name)) throw new Error('Unqualified destructured export in ' + path);
        if (!variable.type && variable.initializer && (ts.isArrowFunction(variable.initializer) || ts.isFunctionExpression(variable.initializer))) {
          callable(variable.name.text, variable.initializer, variable);continue;
        }
        const description = documentation(variable);
        add({kind: 'variable', name: variable.name.text, type: {text: typeText(variable)},
          ...(variable.initializer ? {default: variable.initializer.getText(source)} : {}), ...(description ? {description} : {})});
      }
    }
    module.declarations = [...declarations.values()].sort((a, b) => a.name.localeCompare(b.name, 'en'));
    const sourceSymbol = checker.getSymbolAtLocation(source);
    const explicitNames = new Set(sourceSymbol ? [...exportsFor(sourceSymbol).values()]
      .filter((symbol: any) => symbol.declarations?.some((node: any) => node.getSourceFile() === source))
      .map((symbol: any) => symbol.name) : []);
    const exports = new Map<string, any>();
    const addExport = (name: string, declaration: any) => {
      if (exports.has(name)) throw new Error('Duplicate source export ' + path + '#' + name);
      exports.set(name, {kind: 'js', name, declaration});
    };
    const targetReference = (symbol: any, explicitTypeOnly = false, exportName = symbol.name) => {
      const resolved = terminalSymbol(symbol);
      const target = resolved.declarations?.[0];
      if (!target) throw new Error('Unresolved exported symbol ' + path + '#' + symbol.name);
      const targetPath = pathFor(target.getSourceFile().fileName);
      let reference: any;
      if (selected.has(targetPath)) {
        reference = {name: resolved.name, module: targetPath};
      } else if (program?.isSourceFileFromExternalLibrary(target.getSourceFile()) || targetPath === '..' || targetPath.startsWith('../') || isAbsolute(targetPath)) {
        const binding = candidatePackageExport(program, checker, source, exportName, resolved);
        reference = binding.reference;
        externalExports.push({module: path, name: exportName, declaration: reference, origin: binding.origin});
      } else {
        throw new Error('Unselected candidate export target: ' + path + '#' + symbol.name);
      }
      if (explicitTypeOnly || !hasValueSymbol(symbol, new Set())) {
        typeOnlyExports.push({module: path, name: exportName, target: (reference.package ? reference.package + ':' : '') + (reference.module ?? '') + '#' + reference.name});
        typeOnlyBindings.add(edgeKey(path, exportName, reference));
      }
      return reference;
    };
    for (const statement of source.statements) {
      if ((ts.isClassDeclaration(statement) || (ts.isFunctionDeclaration(statement) && statement.body)) && statement.name && exported(statement)) {
        addExport(ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Default ? 'default' : statement.name.text, {name: statement.name.text, module: path});
      } else if (ts.isVariableStatement(statement) && exported(statement)) {
        for (const variable of statement.declarationList.declarations) addExport(variable.name.getText(source), {name: variable.name.getText(source), module: path});
      } else if (ts.isExportDeclaration(statement)) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const entry of statement.exportClause.elements) {
            const symbol = checker.getSymbolAtLocation(entry.name);
            if (!symbol) throw new Error('Unresolved named export ' + path + '#' + entry.name.text);
            const target = targetReference(symbol, statement.isTypeOnly || entry.isTypeOnly, entry.name.text);
            addExport(entry.name.text, target);
          }
        } else if (!statement.exportClause && statement.moduleSpecifier) {
          const target = checker.getSymbolAtLocation(statement.moduleSpecifier);
          if (!target) throw new Error('Unresolved star export in ' + path);
          for (const symbol of checker.getExportsOfModule(target)) if (symbol.name !== 'default' && !explicitNames.has(symbol.name)) {
            addExport(symbol.name, targetReference(symbol, statement.isTypeOnly || !hasValueExport(target, symbol.name, new Set())));
          }
        } else throw new Error('Unqualified namespace export in ' + path);
      }
    }
    const definitions = (module.exports ?? []).filter((entry: any) => entry.kind === 'custom-element-definition');
    module.exports = [...exports.values(), ...definitions].sort((a, b) => `${a.kind}:${a.name}`.localeCompare(`${b.kind}:${b.name}`, 'en'));
  }
  manifest.modules = [...modules.values()].sort((a, b) => a.path.localeCompare(b.path, 'en'));
  if (manifest.modules.length !== selected.size) throw new Error('Candidate module membership mismatch');
  // Upstream validates before supplementation. Validate all resulting export edges again.
  const external = new Set(externalExports.map(item => edgeKey(item.module, item.name, item.declaration)));
  for (const module of manifest.modules) {
    const names = new Set<string>();
    for (const entry of module.exports) {
      const key = `${entry.kind}:${entry.name}`;
      if (names.has(key)) throw new Error('Duplicate final export: ' + module.path + '#' + key);
      names.add(key);
      const reference = entry.declaration, target = reference?.package ? undefined : modules.get(reference?.module);
      const declaration = target?.declarations.find((item: any) => item.name === reference?.name);
      if (!declaration && !(entry.kind === 'js' && (typeOnlyBindings.has(edgeKey(module.path, entry.name, reference)) || external.has(edgeKey(module.path, entry.name, reference))))) {
        throw new Error('Unresolved candidate export target: ' + module.path + '#' + entry.name);
      }
      if (entry.kind === 'custom-element-definition' && (declaration?.kind !== 'class' || declaration.tagName !== entry.name)) {
        throw new Error('Custom element export disagrees with its class: ' + module.path + '#' + entry.name);
      }
    }
  }
  return {supplemented, typeOnlyExports, externalExports, finalExportTargets: 'checked; type-only and owned public package edges recorded separately'};
}
