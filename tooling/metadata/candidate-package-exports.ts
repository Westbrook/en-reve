import {readFileSync, realpathSync} from 'node:fs';
import {dirname, relative, resolve, sep} from 'node:path';
import {ts} from './compiler-api.mjs';

/** Bind a public package export separately from the terminal declaration's owner. */
export function candidatePackageExport(program: any, checker: any, source: any, name: string, terminal: any) {
  if (!program || program.getTypeChecker() !== checker || program.getSourceFile(source.fileName) !== source) {
    throw new Error('External export requires its originating compiler Program');
  }
  const unalias = (symbol: any) => symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const owned = (file: any) => file && program.getSourceFile(file.fileName) === file;
  const declarations = terminal?.declarations ?? [];
  const files = [...new Set<any>(declarations.map((node: any) => node.getSourceFile()))];
  if (files.length !== 1 || !owned(files[0]) || !program.isSourceFileFromExternalLibrary(files[0])) {
    throw new Error('External export requires one owned package declaration source: ' + name);
  }
  function owner(file: any) {
    const physical = realpathSync(file.fileName);
    for (let directory = dirname(physical);;) {
      try {
        const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
        if (typeof metadata.name !== 'string' || !metadata.name.trim()) throw new Error('External export package has no name');
        return {package: metadata.name, module: relative(directory, physical).split(sep).join('/')};
      } catch (error: any) {if (error.code !== 'ENOENT') throw error;}
      const parent = dirname(directory);
      if (parent === directory) throw new Error('External export has no package owner');
      directory = parent;
    }
  }
  const origin = {name: terminal.name, ...owner(files[0])};
  const visited = new Map<any, Set<string>>();
  function exportSymbol(module: any, exportedName: string) {
    const entry = module && checker.getExportsOfModule(module).find((item: any) => item.name === exportedName);
    if (!entry || unalias(entry) !== terminal) throw new Error('External export binding identity changed: ' + exportedName);
    return entry;
  }
  function route(specifier: any, importedName: string): any {
    const module = checker.getSymbolAtLocation(specifier);
    exportSymbol(module, importedName);
    const text = specifier.text;
    if (typeof text !== 'string') throw new Error('External export requires a literal module specifier');
    if (text.startsWith('.')) return trace(module, importedName);
    if (text.startsWith('/') || text.startsWith('#') || text.includes('\\') || text.includes(':')) throw new Error('Unsupported external export specifier: ' + text);
    const parts = text.split('/'), packageName = text.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    const subpath = parts.slice(text.startsWith('@') ? 2 : 1).join('/');
    const moduleFiles = (module.declarations ?? []).filter((node: any) => ts.isSourceFile(node));
    if (moduleFiles.length !== 1 || !owned(moduleFiles[0]) || !program.isSourceFileFromExternalLibrary(moduleFiles[0])
        || owner(moduleFiles[0]).package !== packageName) throw new Error('External export surface has ambiguous package ownership: ' + text);
    return {reference: {name: importedName, package: packageName, ...(subpath ? {module: subpath} : {})}, origin};
  }
  const aliasSymbols = new Set<any>();
  function alias(symbol: any): any {
    if (aliasSymbols.has(symbol)) throw new Error('Circular external export alias');
    aliasSymbols.add(symbol);
    if (!symbol || unalias(symbol) !== terminal || symbol.declarations?.length !== 1) throw new Error('Unqualified external export alias: ' + name);
    const declaration = symbol.declarations[0];
    if (!owned(declaration.getSourceFile())) throw new Error('Foreign external export alias');
    if (ts.isImportSpecifier(declaration)) return route(declaration.parent.parent.parent.moduleSpecifier, (declaration.propertyName ?? declaration.name).text);
    if (ts.isImportClause(declaration)) return route(declaration.parent.moduleSpecifier, 'default');
    if (ts.isExportSpecifier(declaration)) {
      const statement = declaration.parent.parent;
      if (statement.moduleSpecifier) return route(statement.moduleSpecifier, (declaration.propertyName ?? declaration.name).text);
      const local = checker.getExportSpecifierLocalTargetSymbol(declaration);
      if (!local || local === symbol) throw new Error('Unresolved local external export alias');
      return alias(local);
    }
    throw new Error('Unsupported external export alias: ' + name);
  }
  function trace(module: any, exportedName: string): any {
    const entry = exportSymbol(module, exportedName);
    const names = visited.get(module) ?? new Set<string>();
    if (names.has(exportedName)) throw new Error('Circular external export surface');
    visited.set(module, names);names.add(exportedName);
    try {
      const moduleFiles = (module.declarations ?? []).filter((node: any) => ts.isSourceFile(node));
      if (moduleFiles.length !== 1 || !owned(moduleFiles[0])) throw new Error('Unqualified external export module');
      const file = moduleFiles[0];
      if (entry.declarations?.some((node: any) => node.getSourceFile() === file)) return alias(entry);
      for (const statement of file.statements) {
        if (!ts.isExportDeclaration(statement) || statement.exportClause || !statement.moduleSpecifier || exportedName === 'default') continue;
        const targetModule = checker.getSymbolAtLocation(statement.moduleSpecifier);
        const target = targetModule && checker.getExportsOfModule(targetModule).find((item: any) => item.name === exportedName);
        if (target && unalias(target) === terminal) return route(statement.moduleSpecifier, exportedName);
      }
      throw new Error('No authored public package export surface: ' + exportedName);
    } finally {names.delete(exportedName);}
  }
  return trace(checker.getSymbolAtLocation(source), name);
}
