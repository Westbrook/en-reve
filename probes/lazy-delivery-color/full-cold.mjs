/** Pure validation of the unchanged necessary cold diagnostic, not new samples. */
import assert from 'node:assert/strict';
export const coldProtocol = Object.freeze({blocks: 30, orderSeed: 2026092803, bootstrapSeed: 2026092804,
  bootstrapDraws: 10000, confidence: .95, maximumAddedReadyMs: 50, cpuRate: 4, latencyMs: 150,
  downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000, viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
export const coldSourcePaths = Object.freeze([
  'probes/lazy-delivery-color/candidate.mjs', 'probes/lazy-delivery-color/baseline.mjs',
  'probes/lazy-delivery-color/README.md', 'plans/lazy-delivery/color-popup.md',
  'plans/lazy-delivery/budgets.json', 'package.json', 'package-lock.json', '.node-version',
  'apps/docs/src/api-example/main.ts', 'apps/docs/src/composable-chat-demo.definition.ts',
  'apps/docs/src/composable-chat-color-delivery.ts', 'apps/docs/src/composable-chat-color-ownership.mjs',
  'packages/elements/src/token-editor/element.ts', 'packages/elements/src/color-picker/element.ts',
  'probes/scoped-hydration/production/server.mjs', 'showcases/performance/src/lock.mjs',
  'showcases/performance/src/config.mjs', 'showcases/performance/registry/systems.json',
  'showcases/performance/profiles/profiles.json', 'tooling/testing/execution-owner.mjs',
  'tooling/testing/machine-owner.mjs', 'tooling/test-pipeline/with-toolchain.sh',
]);
function randomGenerator(seed) {let state = seed >>> 0; return () => {state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296;};}
function quantile(values, p) {const sorted = [...values].sort((a, b) => a - b), index = (sorted.length - 1) * p, lo = Math.floor(index), hi = Math.ceil(index); return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);}
const describe = values => ({n: values.length, medianMs: quantile(values, .5), p75Ms: quantile(values, .75), minimumMs: Math.min(...values), maximumMs: Math.max(...values)});
export function expectedColdSchedule() {const random = randomGenerator(coldProtocol.orderSeed); return Array.from({length: 30}, (_, index) => ({block: index + 1, order: random() < .5 ? ['reference', 'candidate'] : ['candidate', 'reference']}));}
export function coldStatistics(pairs) {
  const random = randomGenerator(coldProtocol.bootstrapSeed), draws = [];
  for (let draw = 0; draw < 10000; draw++) {
    const reference = [], candidate = [];
    for (let index = 0; index < pairs.length; index++) {const selected = pairs[Math.floor(random() * pairs.length)]; reference.push(selected.referenceMs); candidate.push(selected.candidateMs);}
    draws.push(quantile(candidate, .5) - quantile(reference, .5));
  }
  return {arms: Object.fromEntries(['reference', 'candidate'].map(arm => [arm, describe(pairs.map(pair => pair[arm + 'Ms']))])),
    primaryDifferenceOfArmMediansMs: quantile(pairs.map(pair => pair.candidateMs), .5) - quantile(pairs.map(pair => pair.referenceMs), .5),
    supportingPairedDifferences: describe(pairs.map(pair => pair.differenceMs)),
    uncertainty: {lowerMs: quantile(draws, .025), upperMs: quantile(draws, .975), confidence: .95, draws: 10000, seed: 2026092804,
      method: 'Paired-block percentile bootstrap; resample common block indices and recompute candidate median minus reference median in every draw.'}};
}
export function validateColdRecords(value, events) {
  assert.equal(value.schemaVersion, 1); assert.equal(value.kind, 'composable-chat-matched-cold-color-diagnostic');
  assert.deepEqual(value.protocol, coldProtocol, 'Necessary cold protocol changed');
  const schedule = expectedColdSchedule(); assert.deepEqual(value.schedule, schedule, 'Necessary cold seeded schedule changed');
  assert(!value.error && !value.abortRequested && !value.finalizationErrors?.length, 'Necessary cold acquisition contains a failure or abort');
  for (const field of ['sourceUnchanged', 'supportUnchanged', 'coldInputsUnchanged', 'sitesUnchanged', 'browserUnchanged']) assert.equal(value[field], true);
  assert(Array.isArray(value.attempts) && value.attempts.length === 60); assert(Array.isArray(events) && events.length === 120);
  const ordered = schedule.flatMap(job => job.order.map((arm, index) => ({block: job.block, arm, ordinal: index + 1})));
  const starts = events.filter(row => row.event === 'started'), terminals = events.filter(row => row.event === 'terminal');
  assert.equal(starts.length, 60); assert.equal(terminals.length, 60);
  for (let index = 0; index < ordered.length; index++) {
    const key = ordered[index], row = value.attempts[index];
    assert.deepEqual({block: row.block, arm: row.arm, ordinal: row.ordinal}, key, 'Duplicate, missing or reordered cold arm/block');
    assert.deepEqual({block: starts[index].block, arm: starts[index].arm, ordinal: starts[index].ordinal}, key);
    const {event, ...terminal} = terminals[index]; assert.deepEqual(terminal, row, 'Cold raw terminal differs from final result');
    assert.equal(events[index * 2].event, 'started'); assert.equal(events[index * 2 + 1].event, 'terminal');
    assert.equal(row.status, 'pass'); assert(!row.error && !row.cleanupError);
    assert.deepEqual(row.pageErrors, []); assert.deepEqual(row.failedRequests, []);
    assert.equal(row.measurement?.state, 'ready'); assert.equal(row.measurement.trusted, true);
    assert(Number.isFinite(row.measurement.durationMs) && row.measurement.durationMs >= 0, 'Invalid cold action duration');
    assert.equal(row.measurement.durationMs, row.measurement.end - row.measurement.start);
    assert.equal(row.editingVerifiedAfterMeasurement, true); assert.equal(row.cancelPreservedDraft, true);
    assert.equal(row.resourceTimingBufferFull, false);
    if (row.arm === 'candidate') {assert.equal(row.coldDelivery?.verified, true); assert.deepEqual(row.coldDelivery.assets, value.coldAssets);}
  }
  const pairs = schedule.map(job => {
    const rows = value.attempts.filter(row => row.block === job.block), referenceMs = rows.find(row => row.arm === 'reference').measurement.durationMs, candidateMs = rows.find(row => row.arm === 'candidate').measurement.durationMs;
    return {block: job.block, referenceMs, candidateMs, differenceMs: candidateMs - referenceMs};
  });
  const statistics = coldStatistics(pairs), summary = value.summary;
  assert.deepEqual(summary.pairs, pairs); for (const [key, expected] of Object.entries(statistics)) assert.deepEqual(summary[key], expected, 'Cold summary does not reproduce from raw: ' + key);
  assert.equal(summary.valid, true); assert.equal(summary.completePairs, 30); assert.equal(summary.plannedPairs, 30); assert.equal(summary.attempts, 60); assert.equal(summary.notRun, 0); assert.equal(summary.failedOrAborted, 0);
  assert(statistics.primaryDifferenceOfArmMediansMs <= 50, 'Necessary cold median gate failed');
  assert(statistics.uncertainty.upperMs <= 50, 'Necessary cold uncertainty gate remains unqualified');
  assert.equal(summary.decision, 'this cold diagnostic passes; full frozen matrix is still required before any promotion');
  return {pairs, ...statistics};
}
