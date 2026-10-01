import { selectTasks } from './pathways.mjs';

/** One serial graph execution can fulfill several original specialized pathways. */
export function specializedSelection(graph, { pathway, pathways } = {}) {
 if ((pathway === undefined) === (pathways === undefined)) throw new Error('Choose exactly one of --pathway or --pathways');
 const requested = [...new Set((pathways ?? pathway).split(',').map(name => name.trim()))];
 if (!requested.length || requested.some(name => !name || !Object.hasOwn(graph.pathways, name))) throw new Error('Unknown or empty specialized pathway selection');
 if (pathway !== undefined && requested.length !== 1) throw new Error('--pathway accepts one pathway; use --pathways for a union');
 const pathwayTasks = Object.fromEntries(requested.map(name => [name, selectTasks(graph, [name]).map(task => task.id)]));
 const ordered = selectTasks(graph, requested), preflights = ordered.filter(task => task.preflight);
 if (preflights.some(task => task.dependencies.length)) throw new Error('A specialized preflight must be independent of preparation');
 // A later requested campaign's cheap anchor checks must precede earlier
 // requested qualification/build work too; all other dependency order stays.
 const plan = [...preflights, ...ordered.filter(task => !task.preflight)];
 return { requested, plan, pathwayTasks,
  requiredInputs: [...new Set(requested.flatMap(name => graph.requiredInputs[name] ?? []))],
 };
}

/** A shared command is referenced by every selected pathway that requires it. */
export function specializedCoverage(selection, results, { failedTask, reconciliationFailed = false } = {}) {
 const outcomes = new Map();
 for (const result of results) {
  if (outcomes.has(result.task)) throw new Error('Duplicate specialized execution result: ' + result.task);
  if (!selection.plan.some(task => task.id === result.task)) throw new Error('Unexpected specialized execution result: ' + result.task);
  outcomes.set(result.task, result);
 }
 return Object.fromEntries(selection.requested.map(name => {
  const tasks = selection.pathwayTasks[name].map(id => {
   const result = outcomes.get(id);
   const status = id === failedTask ? 'failed' : !result ? 'not-run'
    : result.status === 'passed' && result.exitCode === 0 ? 'passed' : 'failed';
   return { id, status, evidence: result?.evidence ? [result.evidence] : [] };
  });
  return [name, { status: reconciliationFailed || tasks.some(task => task.status === 'failed') ? 'failed'
   : tasks.every(task => task.status === 'passed') ? 'passed' : 'incomplete', tasks }];
 }));
}
