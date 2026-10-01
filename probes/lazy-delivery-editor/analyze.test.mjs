import assert from 'node:assert/strict';
import {test} from 'node:test';
import {analyzeCampaign, arms, configurations, describe, pairedP95, parseSampleJournal, quantileBound, p95DifferenceUpper} from './analyze.mjs';

function campaign(n = 100) {
  const jobs = [], events = [];
  for (let block = 0; block < n; block++) for (const configuration of configurations) for (const arm of arms) {
    const job = {id: `${block}-${configuration.browser}-${configuration.profile}-${arm}`, arm, ...configuration, block};
    const candidate = arm === 'candidate';
    jobs.push(job);
    events.push({status: 'started', job}, {
      status: 'ok', job, requestedRegistry: 'production-global', actualRegistry: 'global', errors: [], failures: [],
      metrics: {
        startupMs: candidate ? 116 : 100, firstSelectionMs: candidate ? 50 : 40,
        focusMs: candidate ? 50 : 40, repeatSelectionMs: candidate ? 100 : 90,
        startupToolbarNodes: candidate ? 50 : 150, startupRouteNodes: candidate ? 1900 : 2000,
        entryGzipBytes: candidate ? 14096 : 10000, settledGzipBytes: candidate ? 24096 : 20000,
        entryRequests: 10, settledRequests: 12,
      },
    });
  }
  return {
    manifest: {schemaVersion: 1, kind: 'timing', qualification: false, route: '/api-examples/rich-text.html', actualRegistry: 'global', runtime: {digest: 'fixture-runtime'}, installation: {digest: 'fixture-installation'}, jobs},
    events,
    summary: {status: 'complete', qualification: false, planned: jobs.length, succeeded: jobs.length, terminal: jobs.length,
      verification: {preparationUnchanged: true, harnessUnchanged: true, runtimeUnchanged: true, runtimeAfter: {digest: 'fixture-runtime'},
        installationUnchanged: true, installationPreparedMatch: true, installationAfter: {digest: 'fixture-installation'}}},
  };
}

test('nearest-rank percentiles retain all observations and withhold p95 below 100', () => {
  assert.deepEqual(describe(Array.from({length: 100}, (_, index) => 100 - index)), {n: 100, median: 50.5, p75: 75, p95: 95, min: 1, max: 100});
  assert.equal(describe(Array.from({length: 99}, (_, index) => index)).p95, null);
  assert.deepEqual(describe([]), {n: 0, median: null, p75: null, p95: null, min: null, max: null});
});

test('absolute p95 upper bound uses rank 99 at n=100 with binomial coverage above 95%', () => {
  const bound = quantileBound(Array.from({length: 100}, (_, index) => index + 1));
  const expectedCoverage = 1 - 0.95 ** 100 - 100 * 0.05 * 0.95 ** 99;
  assert.equal(bound.rank, 99);
  assert.equal(bound.value, 99);
  assert(Math.abs(bound.achievedCoverage - expectedCoverage) < 1e-12);
  assert(bound.achievedCoverage >= 0.95);
  assert.equal(bound.neighborRank, 98);
  assert(bound.neighborCoverage < 0.9, 'Rank 98 cannot provide the advertised absolute confidence.');
});

test('binomial order-statistic bounds handle other sample sizes and absence of finite bounds', () => {
  for (const n of [200, 1000, 20000]) {
    const bound = quantileBound(Array.from({length: n}, (_, index) => index));
    assert(bound.rank >= Math.ceil(0.95 * n) && bound.rank <= n);
    assert.equal(bound.value, bound.rank - 1);
    assert(bound.achievedCoverage >= 0.95);
    assert(bound.neighborCoverage < 0.95);
  }
  const absent = quantileBound(Array(58).fill(1));
  assert.equal(absent.value, null);
  assert.equal(absent.rank, null);
  assert(absent.maximumFiniteCoverage < 0.95);
  assert.equal(quantileBound(Array(59).fill(1)).rank, 59);
  assert.equal(quantileBound([]).value, null);
});

test('authoritative paired delta uses two 97.5% component bounds and reports conservative coverage', () => {
  const blocks = Array.from({length: 100}, (_, index) => ({reference: index + 1, candidate: index + 3}));
  const bound = p95DifferenceUpper(blocks, 'candidate', 'reference');
  assert.equal(bound.leftUpper.rank, 100);
  assert.equal(bound.rightLower.rank, 90);
  assert.equal(bound.value, 12);
  assert(bound.leftUpper.achievedCoverage >= 0.975);
  assert(bound.rightLower.achievedCoverage >= 0.975);
  assert(bound.achievedCoverageLowerBound >= 0.95);
  assert.equal(bound.achievedCoverageLowerBound, bound.leftUpper.achievedCoverage + bound.rightLower.achievedCoverage - 1);
  assert.equal(p95DifferenceUpper(blocks.slice(0, 50), 'candidate', 'reference').value, null);
});

test('a torn JSONL record is preserved as diagnostic evidence instead of silently dropped', () => {
  const fixture = campaign(1);
  const partial = '{"status":"ok","job":';
  const events = parseSampleJournal(JSON.stringify(fixture.events[0]) + '\n' + partial + '\n');
  const result = analyzeCampaign(fixture.manifest, events, {...fixture.summary, status: 'incomplete', succeeded: 0, terminal: 0});
  assert.equal(result.qualifiedForMeasuredGates, false);
  assert.equal(result.counts.unknownStatus, 1);
  assert.equal(result.failures[0].rawLine, partial);
  assert.equal(result.failures[0].line, 2);
  assert(result.validation.issues.some(issue => issue.code === 'unterminated-start'));
});

test('bootstrap resamples paired blocks and subtracts arm p95s, not per-block differences', () => {
  const blocks = Array.from({length: 100}, (_, index) => ({reference: index < 50 ? 0 : 100, candidate: index < 50 ? 100 : 0, rollback: index < 50 ? 0 : 100}));
  const result = pairedP95(blocks);
  assert.equal(result.changes.candidateMinusReference.difference, 0);
  assert.equal(describe(blocks.map(block => block.candidate - block.reference)).p95, 100);
  assert.deepEqual(result.changes.rollbackMinusReference.approximateBootstrapCi95, [0, 0]);
  assert.equal(pairedP95(blocks.slice(1)).absolute, null);
});

test('a point p95 can pass while its authoritative upper bound crosses an absolute ceiling', () => {
  const result = pairedP95(Array.from({length: 100}, (_, index) => ({reference: 20, candidate: index < 95 ? 20 : 80, rollback: 20})));
  assert.equal(result.absolute.candidate.p95, 20);
  assert.equal(result.absolute.candidate.upper95.value, 80);
  assert.equal(result.changes.candidateMinusReference.difference, 0);
  assert.equal(result.changes.candidateMinusReference.upper95.value, 60);
  assert.equal(result.changes.candidateMinusReference.approximateBootstrapCi95[1], 60);
});

test('complete recorder journal qualifies at exact inclusive timing, byte and route bounds', () => {
  const fixture = campaign();
  const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
  assert.deepEqual(result.validation.issues, []);
  assert.equal(result.counts.started, 2100);
  assert.equal(result.counts.terminal, 2100);
  assert.equal(result.counts.cleanSuccessful, 2100);
  assert.equal(result.empiricalPass, true);
  assert.equal(result.uncertaintyQualified, true);
  assert.equal(result.qualifiedForMeasuredGates, true);
  assert.equal(result.cells.length, 7);
  assert(result.cells.every(cell => cell.matchedSuccessfulBlocks.length === 100));
  const absoluteGate = result.cells[0].gates.find(gate => gate.name === 'firstSelectionMs:candidate-p95');
  const deltaGate = result.cells[0].gates.find(gate => gate.name === 'startupMs:p95-regression');
  assert.equal(absoluteGate.confidenceBound.method, 'binomial-inverted-order-statistic');
  assert.equal(absoluteGate.confidenceBound.rank, 99);
  assert.equal(deltaGate.confidenceBound.method, 'bonferroni-binomial-order-statistic-difference');
  assert.equal(result.methodology.bootstrap.authoritative, false);
});

test('two slow observations leave empirical p95 passing but prevent confidence qualification', () => {
  const fixture = campaign();
  const candidate = fixture.events.filter(row => row.status === 'ok' && row.job.arm === 'candidate'
    && row.job.browser === 'chromium' && row.job.profile === 'desktop');
  for (const row of candidate.slice(-2)) row.metrics.firstSelectionMs = 80;
  const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
  const absoluteGate = result.cells[0].gates.find(gate => gate.name === 'firstSelectionMs:candidate-p95');
  const deltaGate = result.cells[0].gates.find(gate => gate.name === 'firstSelectionMs:p95-regression');
  assert.equal(result.validation.valid, true);
  assert.equal(result.empiricalPass, true);
  assert.equal(absoluteGate.upper95, 80);
  assert.equal(deltaGate.upper95, 40);
  assert.equal(result.uncertaintyQualified, false);
  assert.equal(result.qualifiedForMeasuredGates, false);
});

test('qualification receipts, absent cells, duplicate terminals and aborted attempts never qualify', () => {
  for (const mutation of [
    fixture => {fixture.manifest.qualification = true; fixture.summary.qualification = true;},
    fixture => {fixture.manifest.jobs = fixture.manifest.jobs.filter(job => job.browser !== 'webkit');},
    fixture => {fixture.events.push(fixture.events[1]);},
    fixture => {fixture.events.unshift({status: 'unknown', job: fixture.manifest.jobs[0]});},
    fixture => {fixture.events.pop(); fixture.summary.terminal--; fixture.summary.succeeded--;},
    fixture => {fixture.summary.verification.preparationUnchanged = false;},
    fixture => {fixture.summary.verification.runtimeAfter.digest = 'different-runtime';},
    fixture => {fixture.summary.verification.installationPreparedMatch = false;},
    fixture => {fixture.summary.verification.installationAfter.digest = 'different-installation';},
    fixture => {fixture.events[1] = {...fixture.events[1], status: 'aborted', signal: 'SIGINT'}; fixture.summary.succeeded--; fixture.summary.status = 'aborted';},
  ]) {
    const fixture = campaign();mutation(fixture);
    const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
    assert.equal(result.qualifiedForMeasuredGates, false);
    assert.equal(result.uncertaintyQualified, null);
    assert(result.validation.issues.length > 0);
  }
  const fixture = campaign(1);
  fixture.events[1] = {...fixture.events[1], status: 'aborted', signal: 'SIGINT'};
  const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
  assert.equal(result.failures[0].signal, 'SIGINT');
  assert.equal(result.counts.aborted, 1);
});

test('one missed node reduction gate fails even though a percentile could hide that block', () => {
  const fixture = campaign();
  const target = fixture.events.find(row => row.status === 'ok' && row.job.arm === 'candidate');
  target.metrics.startupRouteNodes = 1901;
  const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
  assert.equal(result.validation.valid, true);
  assert.equal(result.cells[0].absolute.candidate.startupRouteNodes.p95, 1900);
  const gate = result.cells[0].gates.find(gate => gate.name === 'routeReductionPercent');
  assert.deepEqual(gate.failedBlocks, [{block: 0, value: 4.95}]);
  assert.equal(result.empiricalPass, false);
  assert.equal(result.qualifiedForMeasuredGates, false);
});

test('fewer than 100 complete samples remain diagnostic', () => {
  const short = campaign(99);
  const result = analyzeCampaign(short.manifest, short.events, short.summary);
  assert.equal(result.qualifiedForMeasuredGates, false);
  assert(result.validation.issues.some(issue => issue.code === 'insufficient-matched-blocks'));
  assert.equal(result.cells[0].absolute.reference.startupMs.p95, null);
});

for (const [name, block] of [['noncoercible object', {toString: null}], ['numeric-looking string', '0']]) {
  test(`malformed ${name} block is excluded before sorting or matching`, () => {
    const fixture = campaign(2);
    fixture.manifest.jobs[0].block = block;
    const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
    assert.equal(result.qualifiedForMeasuredGates, false);
    assert(result.validation.issues.some(issue => issue.code === 'job-configuration'));
    assert.deepEqual(result.cells[0].matchedSuccessfulBlocks, [1]);
    assert.equal(result.cells[0].absolute.reference.startupMs.n, 1);
  });
}

test('malformed identities, metrics and error records stay diagnostic and cannot inflate clean counts', () => {
  const fixture = campaign(1);
  fixture.events[1].errors = {length: 0};
  fixture.events[3].error = 0;
  fixture.events[5].metrics.startupToolbarNodes = {toString: null};
  fixture.events[7].job = {...fixture.events[7].job, browser: {toString: null}};
  const result = analyzeCampaign(fixture.manifest, fixture.events, fixture.summary);
  assert.equal(result.qualifiedForMeasuredGates, false);
  assert.equal(result.counts.cleanSuccessful, fixture.summary.succeeded - 4);
  assert(result.validation.issues.some(issue => issue.code === 'invalid-metric'));
  assert(result.validation.issues.some(issue => issue.code === 'unexpected-sample'));
  assert.equal(result.cells[0].absolute.reference.startupMs.n, 0);
  assert.equal(result.cells[0].absolute.candidate.startupMs.n, 0);
  assert.equal(result.cells[0].absolute.rollback.startupMs.n, 0);
  assert.equal(result.failures.find(row => row.error === 0)?.error, 0);
});
