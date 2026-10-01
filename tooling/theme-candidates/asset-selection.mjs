import assert from 'node:assert/strict';

export const assetAppearances = ['light', 'dark'];

/** An explicit subset never relaxes the integrity check on the prepared catalogue. */
export function selectAssetCandidates(prepared, catalogue, filter) {
  assert.deepEqual(prepared.map(candidate => candidate.id), catalogue, 'Verify all canonical prepared pairs.');
  const ids = filter === undefined ? catalogue : filter.split(',').map(id => id.trim());
  assert.ok(ids.length && ids.every(Boolean), 'Select at least one candidate.');
  assert.equal(new Set(ids).size, ids.length, 'Candidate selection must not contain duplicates.');
  assert.ok(ids.every(id => catalogue.includes(id)), 'Unknown candidate selection.');
  return prepared.filter(candidate => ids.includes(candidate.id));
}

export function assertAssetCases(cases, candidates) {
  const expected = candidates.flatMap(candidate => assetAppearances.map(appearance => `${candidate.id}:${appearance}`));
  assert.ok(expected.length > 0, 'An empty selection is not a passing verification.');
  assert.deepEqual(cases.map(item => `${item.candidate}:${item.appearance}`).sort(), expected.sort(), 'Every selected theme/appearance must execute exactly once.');
  assert.ok(cases.every(item => item.status === 'passed'), 'Every selected theme/appearance journey must pass.');
}
