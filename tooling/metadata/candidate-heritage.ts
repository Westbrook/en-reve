import {ts} from './compiler-api.mjs';

const callableRefusals = new WeakSet<object>();
export const isCallableHeritageRefusal = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && callableRefusals.has(error);


/** Fail before detectors can turn an unsupported constructor factory into partial metadata. */
export function rejectCallableHeritage(program: any, sources: any[], sourcePath: (source: any) => string, selectedClasses?: readonly any[]) {
  const checker = program.getTypeChecker();
  if (new Set(sources).size !== sources.length || sources.some(source => program.getSourceFile(source.fileName) !== source))
    throw new Error('Heritage selection requires exact unique Program source files');
  const classes = selectedClasses ? [...selectedClasses] : sources.flatMap(source => source.statements.filter(ts.isClassDeclaration));
  if (new Set(classes).size !== classes.length || classes.some(node => !sources.some(source => source.statements.includes(node)) || !ts.isClassDeclaration(node)))
    throw new Error('Heritage selection requires exact unique top-level classes');
  for (const node of classes) {
    const source = node.getSourceFile();
    const expression = node.heritageClauses?.find((clause: any) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
    if (!expression) continue;
    const label = sourcePath(source) + '#' + (node.name?.text ?? 'default');
    const reject = () => {
      const error = new Error('[CEM_UNSUPPORTED_CALLABLE_HERITAGE] ' + label + ': superclass factories require qualified declaration and mixin ownership.');
      callableRefusals.add(error); throw error;
    };
    const visiting = new Set<any>();
    function inspect(value: any): void {
      const owner = value.getSourceFile();
      if (program.getSourceFile(owner?.fileName) !== owner) throw new Error('Superclass belongs to another compiler Program');
      while (ts.isParenthesizedExpression(value) || ts.isAsExpression(value) || ts.isTypeAssertionExpression(value) || ts.isNonNullExpression(value)) value = value.expression;
      if (ts.isCallExpression(value) || ts.isNewExpression(value)) reject();
      if (!ts.isIdentifier(value) && !ts.isPropertyAccessExpression(value)) reject();
      let symbol = checker.getSymbolAtLocation(value);
      if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      if (!symbol || visiting.has(symbol)) reject();
      visiting.add(symbol);
      try {
        const declarations = symbol.declarations ?? [];
        // DOM/platform constructors are often declared as interface + variable.
        if (symbol.valueDeclaration && program.isSourceFileDefaultLibrary(symbol.valueDeclaration.getSourceFile()) &&
            declarations.every((declaration: any) => program.isSourceFileDefaultLibrary(declaration.getSourceFile()) || ts.isInterfaceDeclaration(declaration))) return;
        const classes = declarations.filter(ts.isClassDeclaration);
        if (classes.length === 1) {
          const owner = classes[0].getSourceFile();
          if (program.getSourceFile(owner.fileName) !== owner) throw new Error('Superclass declaration belongs to another compiler Program');
          // A proven named dependency class remains opaque. Its private
          // constructor composition is not an authored factory application.
          if (program.isSourceFileFromExternalLibrary(owner)) return;
          const base = classes[0].heritageClauses?.find((clause: any) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
          if (base) inspect(base);
          return;
        }
        const variables = declarations.filter(ts.isVariableDeclaration);
        if (variables.length === 1 && variables[0].initializer) {inspect(variables[0].initializer);return;}
        reject();
      } finally {visiting.delete(symbol);}
    }
    inspect(expression);
  }
}
