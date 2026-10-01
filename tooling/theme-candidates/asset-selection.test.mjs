import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateIds } from './catalogue.mjs';
import { selectAssetCandidates, assertAssetCases, assetAppearances } from './asset-selection.mjs';
const prepared = candidateIds.map(id => ({ id }));
const casesFor = candidates => candidates.flatMap(({ id }) => assetAppearances.map(appearance => ({ candidate: id, appearance, status: 'passed' })));

test('full and filtered asset selections require every appearance exactly once', () => {
  for (const filter of [undefined, candidateIds[0], candidateIds.slice(0, 3).join(',')]) {
    const selected = selectAssetCandidates(prepared, candidateIds, filter);
    const cases = casesFor(selected);
    assert.equal(cases.length, selected.length * assetAppearances.length);
    assertAssetCases(cases, selected);
    assert.throws(() => assertAssetCases(cases.slice(1), selected));
    assert.throws(() => assertAssetCases([...cases.slice(1), cases[1]], selected));
    assert.throws(() => assertAssetCases(cases.map((c,i) => i ? c : {...c,status:'failed'}), selected));
  }
});
test('invalid selections and incomplete prepared catalogues cannot appear green', () => {
  for (const filter of ['', 'missing', `${candidateIds[0]},${candidateIds[0]}`]) assert.throws(() => selectAssetCandidates(prepared,candidateIds,filter));
  assert.throws(() => selectAssetCandidates(prepared.slice(1),candidateIds,candidateIds[1]));
  assert.throws(() => assertAssetCases([], []));
});
