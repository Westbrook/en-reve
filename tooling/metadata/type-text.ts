import { dirname, isAbsolute, relative, sep } from 'node:path';

/** Keep checker-inferred import types meaningful when the source tree moves. */
export function relativeImportTypes(text: string, sourceFile: string, ts: any): string {
  const prefix = 'type MetadataType = ';
  const parsed = ts.createSourceFile('metadata-type.ts', prefix + text, ts.ScriptTarget.Latest, true);
  const replacements: Array<{ start: number; end: number; text: string }> = [];
  const visit = (node: any) => {
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      const literal = node.argument.literal;
      // Dependency exports belong to the checker; do not guess package aliases or
      // turn node_modules identities into checkout-layout-relative imports.
      if (isAbsolute(literal.text) && !literal.text.split(/[\\/]/).includes('node_modules')) {
        const path = relative(dirname(sourceFile), literal.text).split(sep).join('/');
        // A cross-volume path cannot be expressed as a relative module specifier.
        if (!isAbsolute(path)) replacements.push({
          start: literal.getStart(parsed) - prefix.length,
          end: literal.end - prefix.length,
          text: JSON.stringify(path.startsWith('./') || path.startsWith('../') ? path : `./${path}`),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, replacement.start) + replacement.text + text.slice(replacement.end);
  }
  return text;
}
