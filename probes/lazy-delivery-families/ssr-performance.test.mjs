/** Synthetic analyzer fault fixtures only; these are never production performance observations. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { digest } from '../lazy-delivery-performance/source-seal.mjs';
import { assertSSRArtifacts, parseSSRPreparation, ssrJobs, summarizeSSR } from './ssr-performance.mjs';

const gates = { maximumSSRRenderP75RegressionMs: 5, maximumSSRRenderP75RegressionPercent: 5 };
function fixture(n = 30, renderTimes = { reference: 100, candidate: 100, rollback: 100 }) {
  const jobs = ssrJobs(n);
  const rows = jobs.map(job => ({
    event: 'terminal', job, status: 'succeeded',
    metrics: { renderMs: renderTimes[job.arm], startupMs: 20, importMs: 10, workerBootMs: 5, spawnToExitMs: renderTimes[job.arm] + 25 },
  }));
  return { jobs, rows };
}
const analyze = ({ rows, jobs }, options = {}) => summarizeSSR(rows, jobs, { gates, integrityVerified: true, ...options });

test('a complete matched synthetic cohort qualifies only with integrity and promotion sampling', () => {
  const full = fixture(), result = analyze(full);
  assert.equal(result.passed, true); assert.equal(result.terminal, 90); assert.equal(result.summaries.candidate.renderMs.n, 30);
  assert.equal(result.summaries.candidate.renderMs.p95, null, 'n30 must not produce a p95 claim');
  assert.equal(analyze(full, { integrityVerified: false }).passed, false);
  assert.equal(analyze(full, { qualification: true }).passed, false, 'diagnostic acquisition cannot promote');
  assert.equal(analyze(fixture(29)).passed, false, '29 successful samples cannot promote');
});

test('missing, null, nonfinite and negative render measurements cannot become zero-cost successes', () => {
  for (const value of [undefined, null, NaN, Infinity, -1]) {
    const input = fixture(), row = input.rows.find(row => row.job.arm === 'candidate');
    if (value === undefined) delete row.metrics.renderMs; else row.metrics.renderMs = value;
    const result = analyze(input);
    assert.equal(result.passed, false); assert.equal(result.complete, false); assert(result.invalidRows.includes(row.job.id));
  }
  const input = fixture(); delete input.rows[0].metrics;
  assert.equal(analyze(input).passed, false, 'missing metrics object fails closed without throwing during summary');
});

test('missing startup metrics also prevent qualified server evidence', () => {
  const input = fixture(); delete input.rows[0].metrics.startupMs;
  const result = analyze(input); assert.equal(result.passed, false); assert(result.invalidRows.includes(input.rows[0].job.id));
});

test('a duplicated successful terminal does not replace a missing or failed cell', () => {
  const input = fixture(); input.rows.push(structuredClone(input.rows[0]));
  const result = analyze(input);
  assert.equal(result.passed, false); assert.equal(result.terminal, 91); assert(result.invalidRows.includes(input.rows[0].job.id));
});

test('every arm and block is mandatory even when remaining measurements look favorable', () => {
  for (const omitted of [row => row.job.arm === 'rollback', row => row.job.block === 29]) {
    const input = fixture(), removed = input.rows.filter(omitted).map(row => row.job.id);
    input.rows = input.rows.filter(row => !omitted(row));
    const result = analyze(input);
    assert.equal(result.passed, false); assert.equal(result.complete, false);
    assert.deepEqual([...result.missing].sort(), removed.sort());
  }
});

test('a terminal with changed block or arm identity is not matched by ID alone', () => {
  for (const key of ['block', 'arm']) {
    const input = fixture(); input.rows[0] = structuredClone(input.rows[0]);
    input.rows[0].job[key] = key === 'block' ? input.rows[0].job.block + 100 : 'different-arm';
    const result = analyze(input); assert.equal(result.passed, false); assert(result.invalidRows.includes(input.rows[0].job.id));
  }
});

test('failed, timed-out and aborted samples remain counted and prevent qualification', () => {
  for (const status of ['failed', 'timeout', 'aborted']) {
    const input = fixture(), row = input.rows.find(row => row.job.arm === 'candidate'); row.status = status; row.error = 'retained synthetic failure';
    const result = analyze(input);
    assert.equal(result.passed, false); assert.equal(result.terminal, 90); assert.equal(result.summaries.candidate.renderMs.n, 29);
    assert(result.invalidRows.includes(row.job.id)); assert.equal(input.rows.find(item => item.job.id === row.job.id).error, 'retained synthetic failure');
  }
});

test('passing point estimates cannot qualify when paired uncertainty crosses frozen ceilings', () => {
  const input = fixture();
  // Five slow blocks leave observed p75 at 100; resampling can move them across the upper quartile.
  for (const row of input.rows) if (row.job.arm === 'candidate' && row.job.block >= 25) row.metrics.renderMs = 106;
  const result = analyze(input), comparison = result.comparisons.find(item => item.id === 'candidate-reference');
  assert.equal(comparison.pointPassed, true); assert.equal(comparison.differenceMs, 0);
  assert(comparison.uncertainty.differenceMs[1] > 5); assert(comparison.uncertainty.differencePercent[1] > 5);
  assert.equal(comparison.uncertaintyPassed, false); assert.equal(result.passed, false);
});

test('absolute and relative ceilings each independently reject a regression', () => {
  for (const times of [{ reference: 1000, candidate: 1006, rollback: 1000 }, { reference: 10, candidate: 10.6, rollback: 10 }]) {
    const result = analyze(fixture(30, times)), comparison = result.comparisons.find(item => item.id === 'candidate-reference');
    assert.equal(comparison.pointPassed, false); assert.equal(result.passed, false);
  }
});

test('eager rollback regression cannot be hidden by a passing on-demand candidate', () => {
  const result = analyze(fixture(30, { reference: 100, candidate: 100, rollback: 106 }));
  assert.equal(result.comparisons.find(item => item.id === 'candidate-reference').passed, true);
  assert.equal(result.comparisons.find(item => item.id === 'rollback-reference').passed, false); assert.equal(result.passed, false);
});

function preparation(overrides = {}) {
  const value = {
    schemaVersion: 1, kind: 'en-reve-lazy-delivery-actual-docs-build', status: 'complete',
    arms: [{ id: 'reference', subject: 'reference', policy: 'eager' }, { id: 'candidate', subject: 'candidate', policy: 'on-demand' }, { id: 'rollback', subject: 'candidate', policy: 'eager' }],
    sources: { reference: { rootLockSha256: 'exact-lock' }, candidate: { rootLockSha256: 'exact-lock' } },
    ...overrides,
  };
  return JSON.stringify({ ...value, manifestSha256: digest(value) });
}

test('a corrupted, substituted, incomplete or mismatched preparation is rejected', () => {
  const bytes = preparation(), expectedSha256 = digest(bytes);
  assert.equal(parseSSRPreparation(bytes, { expectedSha256 }).status, 'complete');
  const corrupted = JSON.parse(bytes); corrupted.arms[1].policy = 'eager';
  assert.throws(() => parseSSRPreparation(JSON.stringify(corrupted)), /seal mismatch/);
  assert.throws(() => parseSSRPreparation(preparation({ extra: 'different valid build' }), { expectedSha256 }), /bytes changed/);
  assert.throws(() => parseSSRPreparation(preparation({ status: 'building' })));
  assert.throws(() => parseSSRPreparation(preparation({ arms: JSON.parse(bytes).arms.slice(0, 2) })));
  assert.throws(() => parseSSRPreparation(preparation({ sources: { reference: { rootLockSha256: 'one' }, candidate: { rootLockSha256: 'two' } } })), /dependency locks differ/);
});

test('output mutation, removal and insertion invalidate retained artifact identity', () => {
  const expected = [
    { path: 'rendered/markup.html', type: 'file', executable: false, bytes: 5, sha256: digest('first') },
    { path: 'stdout.log', type: 'file', executable: false, bytes: 0, sha256: digest('') },
  ];
  assertSSRArtifacts(expected, structuredClone(expected), 'fixture');
  const mutated = structuredClone(expected); mutated[0].sha256 = digest('other');
  for (const actual of [mutated, expected.slice(1), [...expected, { path: 'unexpected.txt', type: 'file', executable: false, bytes: 0, sha256: digest('') }]]) {
    assert.throws(() => assertSSRArtifacts(expected, actual, 'fixture'), /Retained attempt artifacts changed: fixture/);
  }
  assert.throws(() => assertSSRArtifacts(undefined, expected, 'fixture'), /inventories are required/);
});
