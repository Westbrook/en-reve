import test from 'node:test';
import assert from 'node:assert/strict';
import { specializedSelection, specializedCoverage } from './specialized-selection.mjs';

const graph = {
 tasks: [
  { id: 'install', dependencies: [] }, { id: 'build', dependencies: ['install'] },
  { id: 'functional', dependencies: ['build'] },
  { id: 'capture', dependencies: ['functional'] }, { id: 'delivery', dependencies: ['functional'] },
 ],
 pathways: { capture: ['capture'], delivery: ['delivery'] },
 requiredInputs: { capture: ['REVIEWED_ANCHOR'], delivery: ['REVIEWED_ANCHOR', 'FIXTURE'] },
};
test('a specialized union prepares shared dependencies exactly once in dependency order', () => {
 const selection = specializedSelection(graph, { pathways: 'capture,delivery,capture' });
 assert.deepEqual(selection.requested, ['capture', 'delivery']);
 assert.deepEqual(selection.plan.map(task => task.id), ['install', 'build', 'functional', 'capture', 'delivery']);
 assert.deepEqual(selection.requiredInputs, ['REVIEWED_ANCHOR', 'FIXTURE']);
 assert.deepEqual(selection.pathwayTasks.delivery, ['install', 'build', 'functional', 'delivery']);
});
test('single-pathway selection retains exactly its original dependency closure', () => {
 const selection = specializedSelection(graph, { pathway: 'delivery' });
 assert.deepEqual(selection.plan.map(task => task.id), ['install', 'build', 'functional', 'delivery']);
 assert.deepEqual(selection.requested, ['delivery']);
});
test('independent campaign preflights run before any shared preparation regardless of caller order', () => {
 const fixture = { ...graph, tasks: [...graph.tasks, { id: 'anchor', dependencies: [], preflight: true }], pathways: { ...graph.pathways, anchored: ['anchor', 'capture'] } };
 const selection = specializedSelection(fixture, { pathways: 'delivery,anchored' });
 assert.deepEqual(selection.plan.map(task => task.id), ['anchor', 'install', 'build', 'functional', 'delivery', 'capture']);
 assert.throws(() => specializedSelection({ ...fixture, tasks: fixture.tasks.map(task => task.id === 'anchor' ? { ...task, dependencies: ['build'] } : task) }, { pathway: 'anchored' }), /independent of preparation/);
});
test('ambiguous, empty, unknown and inherited pathway names fail closed', () => {
 for (const options of [{}, { pathway: 'capture', pathways: 'delivery' }, { pathway: 'capture,delivery' }, { pathways: '' }, { pathways: 'capture,' }, { pathway: '__proto__' }, { pathways: 'missing' }]) {
  assert.throws(() => specializedSelection(graph, options));
 }
});
const result = task => ({ task, status: 'passed', exitCode: 0, evidence: '/fresh/' + task + '/receipt.json' });
test('one real producer receipt fulfills both required pathways without duplicate results', () => {
 const selection = specializedSelection(graph, { pathways: 'capture,delivery' });
 const coverage = specializedCoverage(selection, selection.plan.map(task => result(task.id)));
 assert.equal(coverage.capture.status, 'passed'); assert.equal(coverage.delivery.status, 'passed');
 assert.deepEqual(coverage.capture.tasks[0].evidence, coverage.delivery.tasks[0].evidence);
 assert.equal(coverage.capture.tasks.length, 4); assert.equal(coverage.delivery.tasks.length, 4);
});
test('failures, absent commands, and cleanup failure cannot fulfill a pathway', () => {
 const selection = specializedSelection(graph, { pathways: 'capture,delivery' });
 const results = ['install', 'build', 'functional', 'capture'].map(result);
 const partial = specializedCoverage(selection, results);
 assert.equal(partial.capture.status, 'passed'); assert.equal(partial.delivery.status, 'incomplete');
 const failed = specializedCoverage(selection, [...results, result('delivery')], { failedTask: 'delivery' });
 assert.equal(failed.capture.status, 'passed'); assert.equal(failed.delivery.status, 'failed');
 assert.equal(failed.delivery.tasks.at(-1).status, 'failed');
 const unsuccessful = specializedCoverage(selection, [{ ...result('install'), exitCode: 1 }]);
 assert.equal(unsuccessful.capture.status, 'failed'); assert.equal(unsuccessful.delivery.status, 'failed');
 const reconciled = specializedCoverage(selection, selection.plan.map(task => result(task.id)), { reconciliationFailed: true });
 assert.equal(reconciled.capture.status, 'failed'); assert.equal(reconciled.delivery.status, 'failed');
});
test('duplicate and unrelated command receipts cannot masquerade as complete coverage', () => {
 const selection = specializedSelection(graph, { pathways: 'capture,delivery' });
 assert.throws(() => specializedCoverage(selection, [result('install'), result('install')]), /Duplicate/);
 assert.throws(() => specializedCoverage(selection, [result('unrelated')]), /Unexpected/);
});
