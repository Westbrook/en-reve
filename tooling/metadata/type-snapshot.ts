import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import {ts, compilerIdentity, type CompilerIdentity} from './compiler-api.mjs';
import { digestBytes, digestJson, canonicalJson } from '../evidence/identity.ts';

export interface TypeDeclaration {
  name: string;
  source: string;
  kind: string;
  declaration: string;
  references: string[];
}
export interface TypeSnapshot {
  schemaVersion: 1;
  packageName: string;
  generator: { version: 1 | 2; typescript: string; digest: string; compiler?: CompilerIdentity };
  entrypoints: Record<string, string>;
  exports: Record<string, string>;
  exportKinds: Record<string, 'type' | 'value'>;
  dependencies: Record<string, string>;
  declarations: Record<string, TypeDeclaration>;
  externalReferences: string[];
  gaps: string[];
}
// Declaration and dependency-query programs share the explicit TS6 API boundary.
const slash = (path: string) => path.replaceAll('\\', '/');
const sorted = <T>(map: Map<string, T>): Record<string, T> => Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b, 'en')));

/** Resolve the current package export map; this inventories exposure without narrowing it. */
function exportTarget(exports: Record<string, any>, subpath: string): string | undefined {
  let entry = exports[subpath], capture: string | undefined;
  if (entry === undefined) {
    for (const pattern of Object.keys(exports).filter(key => key.includes('*')).sort((a, b) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)) {
      const [prefix, suffix] = pattern.split('*');
      if (subpath.startsWith(prefix!) && subpath.endsWith(suffix!)) {
        capture = subpath.slice(prefix!.length, subpath.length - suffix!.length); entry = exports[pattern]; break;
      }
    }
  }
  const target = typeof entry === 'string' ? entry : entry?.types;
  return typeof target === 'string' ? capture === undefined ? target : target.replaceAll('*', capture) : undefined;
}

/** Declaration-only emit happens in memory, so runtime bodies and stale dist files cannot define the local API. */
export async function generateTypeSnapshot(packageRoot: string): Promise<TypeSnapshot> {
  packageRoot = resolve(packageRoot);
  const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const configFile = join(packageRoot, 'tsconfig.json');
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot);
  const options = { ...parsed.options, composite: false, incremental: false, declaration: true, emitDeclarationOnly: true, declarationMap: false, noEmit: false };
  const program = ts.createProgram(parsed.fileNames, options);
  const diagnostics = [...parsed.errors, ...program.getOptionsDiagnostics(), ...program.getSyntacticDiagnostics(), ...program.getDeclarationDiagnostics()];
  if (diagnostics.length) throw new Error(ts.formatDiagnostics(diagnostics, { getCanonicalFileName: (f: string) => f, getCurrentDirectory: () => packageRoot, getNewLine: () => '\n' }));
  const emitted = new Map<string, string>();
  const outputs = new Map<string, string>();
  const result = program.emit(undefined, (file, text, _bom, _error, sources) => {
    if (file.endsWith('.d.ts') && sources?.length === 1) {
      emitted.set(resolve(sources[0].fileName), text);
      outputs.set(resolve(file), resolve(sources[0].fileName));
    }
  });
  if (result.emitSkipped || result.diagnostics.length) throw new Error('Type snapshot declaration emit failed.');
  const host = ts.createCompilerHost(options);
  const originalRead = host.readFile;
  host.readFile = (file: string) => emitted.get(resolve(file)) ?? originalRead(file);
  host.getSourceFile = (file: string, languageVersion: any) => {
    const text = host.readFile(file);
    return text === undefined ? undefined : ts.createSourceFile(file, text, languageVersion, true);
  };
  const declarationsProgram = ts.createProgram([...emitted.keys()], options, host);
  const checker = declarationsProgram.getTypeChecker();
  // The pinned TS6 runtime exposes this transitive type-only alias query, but its
  // public declarations omit it. Keep the boundary narrow and fail if it changes.
  const aliasChecker = checker as typeof checker & {
    getTypeOnlyAliasDeclaration(symbol: Parameters<typeof checker.getAliasedSymbol>[0]): unknown;
  };
  if (typeof aliasChecker.getTypeOnlyAliasDeclaration !== 'function') throw new Error('Type snapshot requires the pinned TS6 type-only alias query.');
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: true });
  const entries = new Map<string, string>();
  const exports = new Map<string, string>();
  const exportKinds = new Map<string, 'type' | 'value'>();
  const declarations = new Map<string, TypeDeclaration>();
  const external = new Set<string>();
  const gaps = new Set<string>();
  // Enumerate every current wildcard match, including nested staging paths. No implicit public allowlist.
  for (const [output, source] of outputs) {
    const outputPath = './' + slash(relative(packageRoot, output));
    const candidates = new Set<string>();
    for (const [key, value] of Object.entries(pkg.exports ?? {}) as Array<[string, any]>) {
      const target = typeof value === 'string' ? value : value?.types;
      if (typeof target !== 'string') continue;
      if (!key.includes('*')) { if (target === outputPath) candidates.add(key); continue; }
      const [prefix, suffix] = target.split('*');
      if (suffix !== undefined && outputPath.startsWith(prefix!) && outputPath.endsWith(suffix)) candidates.add(key.replaceAll('*', outputPath.slice(prefix!.length, outputPath.length - suffix.length)));
    }
    for (const subpath of candidates) if (exportTarget(pkg.exports, subpath) === outputPath) entries.set(pkg.name + (subpath === '.' ? '' : subpath.slice(1)), source);
  }
  if (!entries.size) throw new Error('No source-backed TypeScript package entrypoints found.');
  for (const [key, value] of Object.entries(pkg.exports ?? {}) as Array<[string, any]>) {
    const target = typeof value === 'string' ? value : value?.types;
    if (typeof target === 'string' && !key.includes('*') && /\.d\.[cm]?ts$/u.test(target) && !outputs.has(resolve(packageRoot, target))) gaps.add(`Unresolved typed package entry ${key}: ${target}`);
  }
  function unalias(symbol: any): any { return symbol?.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol; }
  function topDeclaration(node: any): any {
    while (node?.parent && !ts.isSourceFile(node.parent)) node = node.parent;
    return node;
  }
  function recordSymbol(input: any): string | undefined {
    const symbol = unalias(input);
    if (!symbol?.declarations?.length) return undefined;
    const roots = [...new Set(symbol.declarations.map(topDeclaration))] as any[];
    const source = roots[0].getSourceFile();
    if (!emitted.has(resolve(source.fileName))) {
      const file = slash(source.fileName);
      const marker = file.lastIndexOf('/node_modules/');
      const id = `external:${marker >= 0 ? file.slice(marker + 14) : slash(relative(packageRoot, file))}#${symbol.name}`;
      external.add(id); return id;
    }
    // Member/type-parameter identifiers are references to their enclosing declaration, not new exports.
    const root = roots[0];
    const name = root.name?.text ?? (ts.isVariableStatement(root) ? symbol.name : undefined);
    if (!name || ts.isImportDeclaration(root) || ts.isExportDeclaration(root)) return undefined;
    const sourcePath = slash(relative(packageRoot, source.fileName));
    const id = `${sourcePath}#${name}`;
    if (declarations.has(id)) return id;
    const publicNodes = roots.map(node => {
      if (ts.isClassDeclaration(node)) return ts.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses,
        node.members.filter((member: any) => !ts.isPrivateIdentifier(member.name ?? {}) && !member.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.PrivateKeyword)));
      if (ts.isVariableStatement(node)) return ts.factory.updateVariableStatement(node, node.modifiers,
        ts.factory.updateVariableDeclarationList(node.declarationList, node.declarationList.declarations.filter((d: any) => d.name.getText() === symbol.name)));
      return node;
    });
    const entry: TypeDeclaration = { name, source: sourcePath, kind: ts.SyntaxKind[root.kind], declaration: publicNodes.map(node => printer.printNode(ts.EmitHint.Unspecified, node, source).trim()).join('\n'), references: [] };
    declarations.set(id, entry); // Cycles are graph edges, never recursive expansion.
    const refs = new Set<string>();
    function visit(node: any) {
      if (ts.isIdentifier(node) && (!node.parent || !('name' in node.parent) || node !== node.parent.name)) {
        const ref = recordSymbol(checker.getSymbolAtLocation(node));
        if (ref && ref !== id) refs.add(ref);
      }
      ts.forEachChild(node, visit);
    }
    publicNodes.forEach(visit);
    entry.references = [...refs].sort();
    return id;
  }
  for (const [entrypoint, source] of [...entries].sort()) {
    const file = declarationsProgram.getSourceFile(source);
    const module = file && checker.getSymbolAtLocation(file);
    if (!module) { gaps.add(`Unresolved module ${slash(relative(packageRoot, source))}`); continue; }
    for (const symbol of checker.getExportsOfModule(module)) {
      const key = `${entrypoint}#${symbol.name}`;
      const target = recordSymbol(symbol);
      if (target) {
        exports.set(key, target);
        exportKinds.set(key, !(unalias(symbol).flags & ts.SymbolFlags.Value) || aliasChecker.getTypeOnlyAliasDeclaration(symbol) ? 'type' : 'value');
      } else gaps.add(`Unresolved export ${key}`);
    }
  }
  // Missing imports/exports must never become an apparently successful 'any' contract.
  for (const diagnostic of declarationsProgram.getSemanticDiagnostics()) {
    if ([2305, 2307, 2304, 2459, 2694, 2834, 2835].includes(diagnostic.code)) {
      const file = diagnostic.file ? slash(relative(packageRoot, diagnostic.file.fileName)) : 'package';
      gaps.add(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  }
  return { schemaVersion: 1, packageName: pkg.name,
    generator: { version: 2, typescript: ts.version, compiler: compilerIdentity(), digest: digestBytes(await readFile(new URL(import.meta.url))) },
    entrypoints: sorted(new Map([...entries].map(([key, source]) => [key, slash(relative(packageRoot, source))]))),
    exports: sorted(exports), exportKinds: sorted(exportKinds), dependencies: { ...pkg.dependencies, ...pkg.peerDependencies }, declarations: sorted(declarations), externalReferences: [...external].sort(), gaps: [...gaps].sort() };
}

export async function writeTypeSnapshot(packageRoot: string) {
  const snapshot = await generateTypeSnapshot(packageRoot);
  if (snapshot.gaps.length) throw new Error(`Type snapshot has unresolved contracts:\n${snapshot.gaps.join('\n')}`);
  const file = join(packageRoot, 'public-types.json');
  const text = JSON.stringify(snapshot, null, 2) + '\n';
  if (await readFile(file, 'utf8').catch(() => null) !== text) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    await writeFile(temporary, text); await rename(temporary, file);
  }
  return snapshot;
}

/** Regenerate in memory: catches source, exports, compiler and extraction-policy changes. */
export async function verifyTypeSnapshot(packageRoot: string) {
  const retained = JSON.parse(await readFile(join(packageRoot, 'public-types.json'), 'utf8'));
  const current = await generateTypeSnapshot(packageRoot);
  if (current.gaps.length || canonicalJson(retained) !== canonicalJson(current)) throw new Error('Stale or incomplete public-types.json. Run npm run metadata:types.');
  return { snapshot: current, digest: digestJson(current) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve('packages/elements');
  (process.argv.includes('--check') ? verifyTypeSnapshot(root) : writeTypeSnapshot(root)).then(() => console.log('Public TypeScript snapshot verified.')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
