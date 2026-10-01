import {assertDisposalScalar, assertDisposalStimulus} from './reveal-retention-evidence.mjs';
// Prospective opt-in contract. No browser operations or performance budgets.
export const STRICT_RETENTION = 'retention-v3-strict-zero';
export const OBSERVED_DOCUMENT_MOTION = 'retention-v3-active-removal-motion-v1';
export const disposalCases = Object.freeze(['completion','supersession','trusted-interruption','active-removal']);
export const retainedDisposalRequirements = Object.freeze([
  'authored-style-and-tabindex-restoration', 'one-disconnected-host-lifetime',
  'twelve-public-model-and-owned-listener-observations', 'final-full-document-listener-inventory',
  'native-stimulus-restoration', 'instrumentation-restoration', 'unchanged-gc-schedule-and-budgets',
]);

export function retentionAcceptance(value) {
  if (value === undefined) return {id: STRICT_RETENTION};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Explicit retention acceptance descriptor required');
  const keys = Object.keys(value).sort();
  if (value.id === STRICT_RETENTION && JSON.stringify(keys) === '["id"]') return {id: STRICT_RETENTION};
  if (value.id === OBSERVED_DOCUMENT_MOTION && JSON.stringify(keys) === '["id","sha256"]' && /^[a-f0-9]{64}$/.test(value.sha256))
    return {id: OBSERVED_DOCUMENT_MOTION, sha256: value.sha256};
  throw Error('Unknown, unbound or malformed retention acceptance descriptor');
}

export function validateRetentionAddendum(value, protocolSha256) {
  const expectedKeys = ['documentCases','documentOffsetRole','empiricalScope','id','originalProtocolSha256','required','schema'];
  if (!value || JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(expectedKeys)
    || value.schema !== 1 || value.id !== OBSERVED_DOCUMENT_MOTION || value.originalProtocolSha256 !== protocolSha256
    || value.documentOffsetRole !== 'required-observation-without-causal-attribution'
    || JSON.stringify(value.documentCases) !== '["active-removal"]'
    || value.empiricalScope !== 'Only active-removal is exempt from final-zero; the other three document cases remain strict'
    || JSON.stringify(value.required) !== JSON.stringify(retainedDisposalRequirements))
    throw Error('Retention acceptance addendum differs from the reviewed prospective contract or original protocol');
  return value.id;
}

export function retentionDisposalCase(value) {
  if (!disposalCases.includes(value)) throw Error('Explicit known disposal case required');
  return value;
}

export function documentMotionDiagnostic(disposal, acceptance, disposalCase) {
  retentionDisposalCase(disposalCase);
  const policy = retentionAcceptance(acceptance);
  if (policy.id !== OBSERVED_DOCUMENT_MOTION) throw Error('Document motion diagnostic requires explicit opt-in');
  if (!Array.isArray(disposal?.frames) || disposal.frames.length !== 12) throw Error('Exactly twelve disposal observations required for document motion diagnostic');
  const revision = disposal.revisionAtRemoval;
  if (revision?.status === 'inapplicable') return {policy, disposalCase, acceptanceMode:'inapplicable', status:'inapplicable', reason:'Activity has no document-model disposal contract', observedFrames:12};
  if (revision?.status !== 'observed' || !Number.isFinite(revision.revision)) throw Error('Observed public document revision required for motion diagnostic');
  const offsets = disposal.frames.map(frame => frame.documentOffset);
  if (!offsets.every(Number.isFinite)) throw Error('Twelve finite original document offsets required for motion diagnostic');
  const finalOffset = offsets.at(-1), movementObserved = offsets.some(offset => offset !== 0);
  return {policy, disposalCase, acceptanceMode:disposalCase === 'active-removal' ? 'required-diagnostic' : 'strict-final-zero', status:'observed', observedFrames:12, expectedTarget:0, offsets, finalOffset,
    finalZero:finalOffset === 0, movementObserved,
    outcome:movementObserved ? 'nonzero-offset-observed' : 'zero-offset-observed',
    attribution:'unclassified; native observation does not identify retained library work'};
}

// One validator for live samples, qualification archives and analysis. Legacy
// strict receipts may omit this new field; opt-in receipts never may.
export function retentionReceiptIssues(receipt, expectedAcceptance, expectedCycles, expectedWorkload) {
  const issues = []; let expected, actual;
  try {expected = retentionAcceptance(expectedAcceptance); actual = retentionAcceptance(receipt?.acceptance);}
  catch (error) {return [String(error.message ?? error)];}
  if (JSON.stringify(actual) !== JSON.stringify(expected)) issues.push('Retention acceptance identity differs from the required binding');
  if (expected.id === STRICT_RETENTION) return issues;
  if (!['activity','document'].includes(receipt?.workload)) issues.push('Known workload required for disposal diagnostics');
  if (!['activity','document'].includes(expectedWorkload) || receipt?.workload !== expectedWorkload) issues.push('Retention workload differs from its enclosing sample');
  if (receipt?.failure || receipt?.cleanupFailure || receipt?.restorationFailure || receipt?.requiresBrowserClose) issues.push('Contradictory failure or uncertain cleanup evidence cannot be accepted');
  if (receipt?.status !== 'ok') issues.push('Successful helper outcome required before accepting disposal diagnostics');
  if (receipt?.completedCycles !== expectedCycles) issues.push('Completed lifecycle count differs from the required total');
  if (![4,100].includes(expectedCycles) || !Array.isArray(receipt?.cycles) || receipt.cycles.length !== expectedCycles)
    issues.push('Exactly one disposal diagnostic per required lifecycle cycle is required');
  const cycles = Array.isArray(receipt?.cycles) ? receipt.cycles : [];
  if (Object.keys(receipt?.caseCounts ?? {}).length !== 4 || disposalCases.some(kind =>
    receipt.caseCounts?.[kind] !== expectedCycles/4 || cycles.filter(cycle => cycle?.kind===kind && cycle?.status==='ok').length !== expectedCycles/4))
    issues.push('Declared disposal case counts do not match the actual fixed rotation');
  for (const [index, cycle] of cycles.entries()) {
    const disposal = cycle?.disposed?.disposal;
    if (cycle?.failure) issues.push(`Cycle ${index+1} has contradictory failure evidence`);
    if (cycle?.status !== 'ok') issues.push(`Cycle ${index+1} did not complete`);
    if (cycle?.cycle !== index+1 || cycle?.kind !== disposalCases[index%4]) issues.push(`Cycle ${index+1} identity or case rotation differs`);
    try {
      const documentRevision = assertDisposalScalar(disposal);
      assertDisposalStimulus(disposal, documentRevision);
      const computed = documentMotionDiagnostic(disposal, expected, cycle?.kind);
      if (computed.status === 'observed' && cycle.kind !== 'active-removal' && !computed.finalZero) issues.push(`Cycle ${index+1} requires strict final-zero outside active-removal`);
      if ((receipt.workload === 'document') !== (computed.status === 'observed')) issues.push(`Cycle ${index+1} motion applicability differs from workload`);
      if (JSON.stringify(cycle.documentMotion) !== JSON.stringify(computed)
        || JSON.stringify(cycle.disposed.documentMotion) !== JSON.stringify(computed)) issues.push(`Cycle ${index+1} motion diagnostic missing or inconsistent with original frames`);
    } catch (error) {issues.push(`Cycle ${index+1}: ${String(error.message ?? error)}`);}
  }
  return issues;
}
