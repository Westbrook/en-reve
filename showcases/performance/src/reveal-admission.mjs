/** The original protocol remains immutable; a new policy requires an exact bound addendum. */
export const originalRevealProtocolSha256 = '206eb38d95b628d13dc34530c5e81096d91a1ae4bdb737ae868ef2b0da9bb465';

export function validateAdmission(addendum, protocolSha256) {
  if (protocolSha256 !== originalRevealProtocolSha256) throw new Error('Active-desktop admission requires the original sealed reveal protocol');
  const expected = {
    schemaVersion: 1,
    policy: 'active-desktop-v1',
    originalProtocolSha256: protocolSha256,
    ordinaryDesktopAllowed: true,
    dedicatedAccountRequired: false,
    ambientCpuOrLoadInvalidatesSamples: false,
    declaredManagedOverlapInvalidatesCapture: true,
    missingObservationFailsClosed: true,
    retainValidSlowSamples: true,
    automaticRetries: 0,
    qualificationJobs: 36,
    timingJobs: 480,
    retentionRuns: 20,
    workloadCachePreparationPoliciesUnchanged: true,
    numericalBudgetsUnchanged: true,
  };
  if (!addendum || Object.keys(addendum).length !== Object.keys(expected).length
    || Object.entries(expected).some(([key, value]) => addendum[key] !== value)) {
    throw new Error('Active-desktop admission addendum differs from the unchanged study contract');
  }
  return { policy: addendum.policy, originalProtocolSha256: protocolSha256 };
}
