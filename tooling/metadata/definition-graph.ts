import {readFile, readdir} from 'node:fs/promises';
import {dirname, join, relative, resolve, sep} from 'node:path';
import {ts} from './compiler-api.mjs';

export interface SourceDefinition {
  tagName: string;
  className: string;
  source: string;
  classSource?: string;
  dependencies: SourceDefinition[];
}

/** Read literal registration metadata without executing component or registration code. */
export async function readDefinitionGraph(packageRoot: string): Promise<SourceDefinition[]> {
  const root = resolve(packageRoot, 'src');
  const modules = new Map<string, any>();
  const resolving = new Set<string>();
  const resolved = new Map<string, SourceDefinition>();
  const unwrap = (node: any): any => node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) ? unwrap(node.expression) : node;
  async function load(file: string) {
    if (modules.has(file)) return modules.get(file);
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    if (source.parseDiagnostics.length) throw new Error(`Invalid definition TypeScript: ${file}`);
    const bindings = new Map<string, any>();
    const imports = new Map<string, {file: string; name: string}>();
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) bindings.set(declaration.name.text, declaration.initializer);
      }
      if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
        for (const item of statement.importClause.namedBindings.elements) imports.set(item.name.text, {
          file: statement.moduleSpecifier.text, name: (item.propertyName ?? item.name).text,
        });
      }
    }
    const module = {bindings, imports}; modules.set(file, module); return module;
  }
  async function definition(expression: any, file: string): Promise<SourceDefinition> {
    const node = unwrap(expression);
    const module = await load(file);
    if (node && ts.isIdentifier(node)) {
      const key = `${file}#${node.text}`;
      if (resolving.has(key)) throw new Error(`Cyclic component definition: ${key}`);
      const cached = resolved.get(key); if (cached) return cached;
      resolving.add(key);
      let result: SourceDefinition;
      if (module.bindings.has(node.text)) result = await definition(module.bindings.get(node.text), file);
      else {
        const imported = module.imports.get(node.text);
        if (!imported?.file.startsWith('.') || !imported.file.endsWith('.js')) throw new Error(`Definition must be a local named import: ${key}`);
        const target = resolve(dirname(file), imported.file.replace(/\.js$/, '.ts'));
        const location = relative(root, target);
        if (location === '..' || location.startsWith(`..${sep}`)) throw new Error('Definition import escapes component sources.');
        const targetModule = await load(target);
        if (!targetModule.bindings.has(imported.name)) throw new Error(`Missing definition ${imported.name} in ${target}`);
        result = await definition(ts.factory.createIdentifier(imported.name), target);
      }
      resolving.delete(key); resolved.set(key, result); return result;
    }
    if (!node || !ts.isObjectLiteralExpression(node)) throw new Error(`Definition must be a literal object or named reference: ${file}`);
    const properties = new Map<string, any>();
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !['tagName', 'elementClass', 'dependencies'].includes(property.name.text) || properties.has(property.name.text)) throw new Error(`Unsupported definition property: ${file}`);
      properties.set(property.name.text, unwrap(property.initializer));
    }
    const tag = properties.get('tagName'), constructor = properties.get('elementClass'), dependencies = properties.get('dependencies');
    if (!tag || !ts.isStringLiteral(tag) || !constructor || !ts.isIdentifier(constructor)) throw new Error('A definition requires literal tagName and an elementClass identifier.');
    if (dependencies && !ts.isArrayLiteralExpression(dependencies)) throw new Error('Definition dependencies must be an explicit array.');
    const classImport = module.imports.get(constructor.text);
    const classSource = classImport?.file.startsWith('.') ? relative(resolve(packageRoot), resolve(dirname(file), classImport.file.replace(/\.js$/, '.ts'))).split(sep).join('/') : undefined;
    const children: SourceDefinition[] = [];
    if (dependencies) for (const child of dependencies.elements) children.push(await definition(child, file));
    return {tagName: tag.text, className: module.imports.get(constructor.text)?.name ?? constructor.text,
      source: relative(resolve(packageRoot), file).split(sep).join('/'), classSource,
      dependencies: children};
  }
  const file = join(root, 'catalog.ts');
  const catalog = await load(file);
  const array = unwrap(catalog.bindings.get('definitions'));
  if (!array || !ts.isArrayLiteralExpression(array) || !array.elements.length) throw new Error('Catalog definitions must be a nonempty explicit array.');
  // Sequential traversal distinguishes cycles from shared dependency references.
  const definitions: SourceDefinition[] = [];
  for (const element of array.elements) definitions.push(await definition(element, file));
  if (new Set(definitions.map(item => item.tagName)).size !== definitions.length) throw new Error('Duplicate intended catalog tag.');
  return definitions;
}

/** Every public define entry must register its one canonical graph root. */
export async function verifyDefinitionEntries(packageRoot: string) {
  const graph = await readDefinitionGraph(packageRoot);
  const definitions = new Map(graph.map(item => [item.tagName, item]));
  const visited = new Set<SourceDefinition>();
  function visit(item: SourceDefinition) {
    if (visited.has(item)) return;
    visited.add(item);
    if (definitions.get(item.tagName) !== item) throw new Error(`Noncanonical dependency: ${item.tagName}`);
    for (const child of item.dependencies) visit(child);
  }
  for (const item of graph) visit(item);
  const entries = (await readdir(join(packageRoot, 'src/define'))).filter(file => file.endsWith('.ts')).sort();
  const expected = graph.map(item => `${item.tagName.slice(3)}.ts`).sort();
  const modules = (await readdir(join(packageRoot, 'src/definitions'))).filter(file => file.endsWith('.ts')).sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected) || JSON.stringify(modules) !== JSON.stringify(expected)) throw new Error('Catalog, definition modules and define entries must cover the same tags.');
  for (const file of entries) {
    const name = file.slice(0, -3).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()) + 'Definition';
    const source = ts.createSourceFile(file, await readFile(join(packageRoot, 'src/define', file), 'utf8'), ts.ScriptTarget.Latest, true);
    const imports = new Map<string, {name: string; module: string}>();
    const calls: any[] = [];
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
        for (const binding of statement.importClause.namedBindings.elements) imports.set(binding.name.text, {
          name: (binding.propertyName ?? binding.name).text, module: statement.moduleSpecifier.text,
        });
      } else if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)) calls.push(statement.expression);
      else throw new Error(`Unexpected define-entry statement: ${file}`);
    }
    const call = calls[0];
    const helper = call && ts.isIdentifier(call.expression) ? imports.get(call.expression.text) : undefined;
    const [registry, reference] = call?.arguments ?? [];
    const imported = reference && ts.isIdentifier(reference) ? imports.get(reference.text) : undefined;
    if (source.parseDiagnostics.length || calls.length !== 1 || imports.size !== 2 || call.arguments.length !== 2
      || helper?.name !== 'registerDefinition' || helper.module !== '@en-reve/primitives/interactions/registration.js'
      || !registry || !ts.isIdentifier(registry) || registry.text !== 'customElements'
      || imported?.name !== name || imported.module !== `../definitions/${file.replace(/\.ts$/, '.js')}`) {
      throw new Error(`Define entry must delegate to its canonical definition: ${file}`);
    }
  }
  return graph;
}
