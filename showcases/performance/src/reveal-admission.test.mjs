import test from 'node:test';
import assert from 'node:assert/strict';
import { contentionDecision, createContentionMonitor } from './reveal-contention.mjs';
import { validateAdmission, originalRevealProtocolSha256 } from './reveal-admission.mjs';
const idle = { knownHeavyTaskIds: [], knownHeavyProcessIds: [], loadStreak: 0, repeatedHighCpuPids: [] };
const ambient = { ...idle, loadStreak: 3, repeatedHighCpuPids: [9876] };
const digest = originalRevealProtocolSha256;
const addendum = {
  schemaVersion: 1, policy: 'active-desktop-v1', originalProtocolSha256: digest,
  ordinaryDesktopAllowed: true, dedicatedAccountRequired: false,
  ambientCpuOrLoadInvalidatesSamples: false, declaredManagedOverlapInvalidatesCapture: true,
  missingObservationFailsClosed: true, retainValidSlowSamples: true, automaticRetries: 0,
  qualificationJobs: 36, timingJobs: 480, retentionRuns: 20,
  workloadCachePreparationPoliciesUnchanged: true, numericalBudgetsUnchanged: true,
};
test('legacy default retains the historical sustained ambient veto', () => {
  assert.equal(contentionDecision(idle).block, false);
  assert.equal(contentionDecision(ambient).block, true);
});
test('active desktop records ambient pressure without rejecting valid work', () => {
  const result = contentionDecision(ambient, 'active-desktop-v1');
  assert.equal(result.ambientPressure, true);
  assert.equal(result.managedOverlap, false);
  assert.equal(result.block, false);
});
test('declared task or present declared process blocks under either policy', () => {
  for (const policy of ['legacy-strict', 'active-desktop-v1']) {
    assert.equal(contentionDecision({ ...idle, knownHeavyTaskIds: ['other-campaign'] }, policy).block, true);
    assert.equal(contentionDecision({ ...idle, knownHeavyProcessIds: [9876] }, policy).block, true);
  }
});
test('unknown policy fails before observations or process acquisition', async () => {
  assert.throws(() => contentionDecision(idle, 'quiet-enough'), /Unknown/);
  await assert.rejects(createContentionMonitor({ admissionPolicy: 'quiet-enough' }), /Unknown/);
});
test('invalid current managed-work inventory remains fail closed for active desktop', async () => {
  const records = [], breaches = [];
  const monitor = await createContentionMonitor({ admissionPolicy: 'active-desktop-v1',
    record: value => records.push(value), onBreach: value => breaches.push(value), getKnownHeavyWork: async () => null });
  assert.equal(monitor.signal.aborted, true);
  assert.throws(() => monitor.assertHealthy(), /not healthy/);
  const state = await monitor.stop();
  assert.equal(state.breach.type, 'contention-monitor-error');
  assert.equal(records.at(-1).type, 'contention-monitor-error');
  assert.equal(breaches.length, 1);
});
test('admission binds the original protocol and rejects altered counts, budgets or filtering', () => {
  assert.throws(() => validateAdmission(addendum, 'b'.repeat(64)), /original sealed/);
  assert.deepEqual(validateAdmission(addendum, digest), { policy: 'active-desktop-v1', originalProtocolSha256: digest });
  for (const change of [{ originalProtocolSha256: 'b'.repeat(64) }, { timingJobs: 479 },
    { qualificationJobs: 35 }, { retentionRuns: 19 }, { numericalBudgetsUnchanged: false },
    { retainValidSlowSamples: false }, { automaticRetries: 1 }, { extraUnreviewedException: true }]) {
    assert.throws(() => validateAdmission({ ...addendum, ...change }, digest), /differs/);
  }
});
