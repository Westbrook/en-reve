import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateColdRecords, expectedColdSchedule} from './full-cold.mjs';

// Independent fixed seed expansion from the historical diagnostic's declared
// 32-bit recurrence. Synthetic records are validation fixtures, never samples.
const firstArms = 'RRCRCRRCRCRRRCCCCRCRRCRRCCRRRR';
const schedule = [...firstArms].map((first, index) => ({block: index + 1,
  order: first === 'R' ? ['reference', 'candidate'] : ['candidate', 'reference']}));
const stats = (n, medianMs, p75Ms, minimumMs, maximumMs) => ({n, medianMs, p75Ms, minimumMs, maximumMs});
function fixture(delta = 10) {
  const pairs = Array.from({length: 30}, (_, index) => ({block: index + 1, referenceMs: 100, candidateMs: 100 + delta, differenceMs: delta}));
  const attempts = schedule.flatMap(job => job.order.map((arm, index) => {
    const durationMs = arm === 'reference' ? 100 : 100 + delta;
    return {block: job.block, arm, ordinal: index + 1, status: 'pass', pageErrors: [], failedRequests: [],
      measurement: {state: 'ready', trusted: true, start: 10, end: 10 + durationMs, durationMs},
      editingVerifiedAfterMeasurement: true, cancelPreservedDraft: true, resourceTimingBufferFull: false,
      ...(arm === 'candidate' ? {coldDelivery: {verified: true, assets: ['assets/optional.js']}} : {})};
  }));
  const value = {schemaVersion: 1, kind: 'composable-chat-matched-cold-color-diagnostic',
    protocol: {blocks: 30, orderSeed: 2026092803, bootstrapSeed: 2026092804, bootstrapDraws: 10000,
      confidence: .95, maximumAddedReadyMs: 50, cpuRate: 4, latencyMs: 150, downloadBitsPerSecond: 1600000,
      uploadBitsPerSecond: 750000, viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'},
    schedule: structuredClone(schedule), attempts, coldAssets: ['assets/optional.js'],
    sourceUnchanged: true, supportUnchanged: true, coldInputsUnchanged: true, sitesUnchanged: true, browserUnchanged: true,
    summary: {valid: true, completePairs: 30, plannedPairs: 30, attempts: 60, notRun: 0, failedOrAborted: 0,
      arms: {reference: stats(30, 100, 100, 100, 100), candidate: stats(30, 100 + delta, 100 + delta, 100 + delta, 100 + delta)},
      pairs, primaryDifferenceOfArmMediansMs: delta, supportingPairedDifferences: stats(30, delta, delta, delta, delta),
      uncertainty: {lowerMs: delta, upperMs: delta, confidence: .95, draws: 10000, seed: 2026092804,
        method: 'Paired-block percentile bootstrap; resample common block indices and recompute candidate median minus reference median in every draw.'},
      decision: 'this cold diagnostic passes; full frozen matrix is still required before any promotion'}};
  return {value, events: journal(value)};
}
function journal(value) {return value.attempts.flatMap(row => [{event: 'started', block: row.block, arm: row.arm, ordinal: row.ordinal}, {event: 'terminal', ...structuredClone(row)}]);}

test('the independently fixed thirty-block arm ordering and complete synthetic success validate', () => {
  assert.deepEqual(expectedColdSchedule(), schedule);
  const {value, events} = fixture(); assert.equal(validateColdRecords(value, events).primaryDifferenceOfArmMediansMs, 10);
});
test('a copied arm/block cannot conceal a missing matched observation', () => {
  const {value} = fixture(); value.attempts[59] = structuredClone(value.attempts[57]);
  assert.throws(() => validateColdRecords(value, journal(value)), /Duplicate, missing or reordered/);
});
test('missing and orphan raw records are rejected rather than ignored', () => {
  const {value, events} = fixture(); assert.throws(() => validateColdRecords(value, events.slice(1)));
  assert.throws(() => validateColdRecords(value, [...events, structuredClone(events[0])]));
});
test('a passing edited summary cannot override failing observed durations', () => {
  const {value, events} = fixture(51); value.summary.primaryDifferenceOfArmMediansMs = 49; value.summary.uncertainty.upperMs = 49;
  assert.throws(() => validateColdRecords(value, events), /does not reproduce/);
});
test('the unchanged plus fifty limit rejects fifty-one and includes exactly fifty', () => {
  const failed = fixture(51); assert.throws(() => validateColdRecords(failed.value, failed.events), /median gate failed/);
  const boundary = fixture(50); assert.equal(validateColdRecords(boundary.value, boundary.events).primaryDifferenceOfArmMediansMs, 50);
});
test('a point estimate below the limit remains unqualified when paired uncertainty crosses it', () => {
  const {value} = fixture();
  for (const row of value.attempts) if (row.arm === 'candidate') {
    row.measurement.durationMs = row.block <= 15 ? 100 : 198; row.measurement.end = 10 + row.measurement.durationMs;
  }
  value.summary.pairs = value.summary.pairs.map(pair => ({...pair, candidateMs: pair.block <= 15 ? 100 : 198, differenceMs: pair.block <= 15 ? 0 : 98}));
  value.summary.arms.candidate = stats(30, 149, 198, 100, 198);
  value.summary.primaryDifferenceOfArmMediansMs = 49; value.summary.supportingPairedDifferences = stats(30, 49, 98, 0, 98);
  value.summary.uncertainty.lowerMs = 0; value.summary.uncertainty.upperMs = 98;
  assert.throws(() => validateColdRecords(value, journal(value)), /uncertainty gate remains unqualified/);
});
test('abort or finalization errors invalidate otherwise successful rows', () => {
  for (const extra of [{abortRequested: {signal: 'SIGTERM'}}, {error: {message: 'failed'}}, {finalizationErrors: [{name: 'browser close'}]}]) {
    const {value, events} = fixture(); Object.assign(value, extra); assert.throws(() => validateColdRecords(value, events), /failure or abort/);
  }
});
test('untrusted, negative and browser-error observations are never successful gate samples', () => {
  for (const mutate of [row => {row.measurement.trusted = false;}, row => {row.measurement.durationMs = -1; row.measurement.end = 9;}, row => {row.pageErrors.push({message: 'late error'});}, row => {row.cancelPreservedDraft = false;}]) {
    const {value} = fixture(); mutate(value.attempts[0]); assert.throws(() => validateColdRecords(value, journal(value)));
  }
});
test('changed cold protocol or summary cannot reinterpret historical acquisition', () => {
  const {value, events} = fixture(); value.protocol.orderSeed++; assert.throws(() => validateColdRecords(value, events), /protocol changed/);
});
