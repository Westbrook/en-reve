import {ts} from './compiler-api.mjs';
import {rejectCallableHeritage, isCallableHeritageRefusal} from './candidate-heritage.ts';
import {constructorOriginIndex} from './candidate-mixin-origins.ts';

/** Choose a source-bound routing cohort without imposing the experimental
 * serializer's grammar on unrelated ordinary declarations. Selection alone
 * does not qualify extraction, serialization, events or public metadata.
 * All selected sources remain present for module/export/provenance checks.
 */
export function constructorCohort(program: any, sources: readonly any[], sourcePath: (source: any) => string) {
  const selected = [...sources];
  if (new Set(selected).size !== selected.length || selected.some(source => program.getSourceFile(source.fileName) !== source))
    throw new Error('Constructor cohort requires exact unique Program source files');
  program.getTypeChecker();
  const classes = selected.flatMap(source => source.statements.filter(ts.isClassDeclaration));
  const roots: any[] = [], ordinary: any[] = [];
  for (const node of classes) {
    try {
      rejectCallableHeritage(program, selected, sourcePath, [node]);
      ordinary.push(node);
    } catch (error: any) {
      // The ordinary guard also refuses ambiguous/unknown constructor forms.
      // They must pass the exact graph proof below, never become accepted just
      // because they were routed away from the ordinary path.
      if (!isCallableHeritageRefusal(error)) throw error;
      roots.push(node);
    }
  }
  const index = roots.length ? constructorOriginIndex(program, selected, sourcePath, roots) : undefined;
  const support = new Set<any>(), factories = new Set<any>();
  for (const root of roots) for (const step of index!.compositionFor(root)) {
    if (step.origin?.kind === 'class') support.add(step.origin.node);
    if (step.origin?.kind === 'mixin') factories.add(step.origin.factory.declaration);
  }
  return Object.freeze({program, sources: Object.freeze(selected), roots: Object.freeze(roots),
    ordinary: Object.freeze(ordinary), support: Object.freeze([...support]), factories: Object.freeze([...factories]),
    index, qualified: false,
    scope: 'source routing only; ordinary declarations retain their producer and callable roots require full composition qualification'});
}
