import {ts} from '../../../tooling/metadata/compiler-api.mjs';

// Specimen parsing shares the explicit JavaScript API with metadata and literal
// transforms; the native build compiler never enters browser bundles.
/** Remove unused import bindings without rewriting authored template bodies. */
export function usedImports(source, fileName) {
  const options = { noResolve: true, noLib: true, target: ts.ScriptTarget.ESNext };
  const root = ts.createSourceFile(fileName, source, options.target, true);
  const host = ts.createCompilerHost(options);
  host.getSourceFile = name => name === fileName ? root : undefined;
  const checker = ts.createProgram([fileName], options, host).getTypeChecker();
  const references = new Set();
  function visit(node) {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isIdentifier(node)) {
      const symbol = ts.isShorthandPropertyAssignment(node.parent)
        ? checker.getShorthandAssignmentValueSymbol(node.parent)
        : ts.isExportSpecifier(node.parent)
          ? checker.getExportSpecifierLocalTargetSymbol(node.parent)
          : checker.getSymbolAtLocation(node);
      if (symbol) references.add(symbol);
    }
    ts.forEachChild(node, visit);
  }
  visit(root);
  const isUsed = name => references.has(checker.getSymbolAtLocation(name));
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const edits = [];
  for (const node of root.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause) continue;
    const clause = node.importClause;
    const name = clause.name && isUsed(clause.name) ? clause.name : undefined;
    let bindings = clause.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      const elements = bindings.elements.filter(element => isUsed(element.name));
      if (elements.length !== bindings.elements.length) {
        bindings = elements.length ? ts.factory.updateNamedImports(bindings, elements) : undefined;
      }
    } else if (bindings && !isUsed(bindings.name)) bindings = undefined;
    if (name === clause.name && bindings === clause.namedBindings) continue;
    const updated = name || bindings
      ? ts.factory.updateImportDeclaration(node, node.modifiers,
        ts.factory.updateImportClause(clause, clause.isTypeOnly, name, bindings), node.moduleSpecifier, node.attributes)
      : undefined;
    edits.push({ start: node.getStart(root), end: node.end, text: updated ? printer.printNode(ts.EmitHint.Unspecified, updated, root) : '' });
  }
  for (const edit of edits.reverse()) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  // Removed imports can leave blank lines between the remaining declarations.
  // Keep consecutive imports together and one blank line before implementation;
  // comments and authored template bodies keep their original spacing.
  const filtered = ts.createSourceFile(fileName, source, options.target, true);
  for (let index = filtered.statements.length - 1; index > 0; index--) {
    const previous = filtered.statements[index - 1];
    const current = filtered.statements[index];
    if (!ts.isImportDeclaration(previous)) continue;
    const start = previous.end;
    const end = current.getStart(filtered);
    if (!source.slice(start, end).trim()) source = source.slice(0, start)
      + (ts.isImportDeclaration(current) ? '\n' : '\n\n') + source.slice(end);
  }
  return source.trim();
}

/** Inline explicitly supplied application helpers, retaining their TypeScript. */
export function inlineSpecimenModules(source, modules) {
  const emitted = new Set();
  const bindings = new Map();
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  function inline(text, fileName) {
    const root = ts.createSourceFile(fileName, text, ts.ScriptTarget.ESNext, true);
    const dependencies = [];
    const edits = [];
    for (const node of root.statements) {
      if (!ts.isImportDeclaration(node)) continue;
      const specifier = node.moduleSpecifier.text;
      if (Object.hasOwn(modules, specifier)) {
        if (!emitted.has(specifier)) {
          emitted.add(specifier);
          dependencies.push(inline(modules[specifier], specifier));
        }
        edits.push({ start: node.getStart(root), end: node.end, text: '' });
        continue;
      }
      const clause = node.importClause;
      if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
      const elements = clause.namedBindings.elements.filter(element => {
        const name = element.name.text;
        const identity = `${specifier}:${element.propertyName?.text ?? name}:${clause.isTypeOnly || element.isTypeOnly}`;
        if (bindings.has(name)) {
          if (bindings.get(name) !== identity) throw new Error(`Conflicting specimen import: ${name}`);
          return false;
        }
        bindings.set(name, identity);
        return true;
      });
      if (elements.length === clause.namedBindings.elements.length) continue;
      const updated = elements.length || clause.name ? ts.factory.updateImportDeclaration(node, node.modifiers,
        ts.factory.updateImportClause(clause, clause.isTypeOnly, clause.name,
          elements.length ? ts.factory.updateNamedImports(clause.namedBindings, elements) : undefined), node.moduleSpecifier, node.attributes) : undefined;
      edits.push({ start: node.getStart(root), end: node.end, text: updated ? printer.printNode(ts.EmitHint.Unspecified, updated, root) : '' });
    }
    for (const edit of edits.reverse()) text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
    return [...dependencies, text.trim()].join('\n\n');
  }
  return inline(source, 'specimen.ts');
}

/** Assemble complete consumer modules before selecting their required imports. */
export function specimenSources(authoredSource, tokenCopySource, virtualDemoSource, fileUploadDemoSource, treeDataDemoSource, calendarDemoSource, multiStepDemoSource, toastDemoSource, chatDemoSource, composableDemoSource, presenceDemoSource, carouselDemoSource, richDemoSource, localSources = {}) {
  if (composableDemoSource && Object.keys(localSources).length) localSources = { ...localSources,
    './composable-chat-demo.js': composableDemoSource + "\nif (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);",
  };
  const startMarker = '// example-start:';
  // This registration belongs only to the color-picker composition, not every example.
  const header = authoredSource.slice(0, authoredSource.indexOf(startMarker)).replace("import './color-spaces-demo.js';", '').trim();
  const sources = {};
  let cursor = 0;
  while ((cursor = authoredSource.indexOf(startMarker, cursor)) !== -1) {
    const start = authoredSource.indexOf('\n', cursor);
    const id = authoredSource.slice(cursor + startMarker.length, start).trim();
    const endMarker = `// example-end:${id}`;
    const end = authoredSource.indexOf(endMarker, start);
    if (start < 0 || end < 0 || Object.hasOwn(sources, id)) throw new Error(`Invalid authored specimen: ${id}`);
    let source = header + '\n' + authoredSource.slice(start + 1, end).trim();
    if (id === 'swatches') {
      source = source.replace("import { copyTokenReference } from './token-copy.js';\n", '')
        + '\n\n// Application-owned copy helper (maintained in token-copy.ts).\n' + tokenCopySource.trim();
    }
    if (id === 'virtual-collection' && virtualDemoSource) {
      source = virtualDemoSource.trim()
        + "\n\nif (!customElements.get('en-virtual-collection-demo')) customElements.define('en-virtual-collection-demo', VirtualCollectionDemo);"
        + '\n\n// Documentation-owned review application; the controller, state and templates above are public library primitives.\n'
        + authoredSource.slice(start + 1, end).trim();
    }
    if (id === 'file-upload' && fileUploadDemoSource) source = fileUploadDemoSource.trim();
    if (id === 'tree-data' && treeDataDemoSource) source = treeDataDemoSource.trim();
    if (id === 'multi-step' && multiStepDemoSource) source = multiStepDemoSource.trim();
    if (id === 'composable-chat' && composableDemoSource) {
      source = composableDemoSource.trim()
        + "\n\nif (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);"
        + '\n\n' + authoredSource.slice(start + 1, end).trim();
    }
    if (id === 'chat-patterns' && chatDemoSource) source = chatDemoSource.trim();
    if (id === 'rich-text' && richDemoSource) source = richDemoSource.trim();
    if (id === 'carousel' && carouselDemoSource) source = carouselDemoSource.trim();
    if (id === 'presence-activity' && presenceDemoSource) source = presenceDemoSource.trim();
    if (id === 'toast' && toastDemoSource) source = toastDemoSource.trim();
    if (id === 'calendar' && calendarDemoSource) source = calendarDemoSource.trim();
    if (id === 'color-picker') source = "import './color-spaces-demo.js';\n" + source;
    sources[id] = usedImports(inlineSpecimenModules(usedImports(source, `${id}.ts`), localSources), `${id}.ts`);
    cursor = end + endMarker.length;
  }
  return sources;
}
