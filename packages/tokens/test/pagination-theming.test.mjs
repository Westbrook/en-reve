import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, validateManagedValue } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

test('pagination geometry pins round-trip and stay independent of shared control geometry', () => {
  const draft = createReviewDraft({mode:'dark'});
  const originalControl = draft.theme.tokens['size.control-min'].value;
  draft.setToken('component.pagination.gap', '{space.2}');
  draft.setToken('component.pagination.status-gap', '{space.1}');
  draft.setToken('component.pagination.page-min-inline-size', {value:3,unit:'rem'});
  const reopened = reopenReviewDraft(draft.exportJSON({title:'Roomy page actions'}));
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  assert.deepEqual(reopened.theme.tokens['size.control-min'].value, originalControl);
  assert.deepEqual(reopened.options.pins['component.pagination.page-min-inline-size'], {value:3,unit:'rem'});
  assert.throws(() => validateManagedValue(draft.theme,'component.pagination.gap',{value:400,unit:'px'}));
  assert.throws(() => validateManagedValue(draft.theme,'component.pagination.page-min-inline-size','{color.action}'));
});

test('switching full themes clears pagination pins; partial overrides leave unrelated geometry alone', () => {
  for (const mode of ['light','dark']) {
    const theme = resolveTheme({mode});
    const full = collectThemeCSSDeclarations(theme);
    for (const role of ['gap','status-gap','page-min-inline-size']) assert.equal(full.get(`--en-pagination-${role}`),'initial');
    const partial = collectThemeCSSDeclarations(theme,{kind:'partial',tokenIds:['color.text']});
    assert.equal(partial.has('--en-pagination-gap'),false);
    const pinned = resolveTheme({mode,pins:{'component.pagination.gap':'{space.2}'}});
    assert.equal(collectThemeCSSDeclarations(pinned).get('--en-pagination-gap'),'var(--en-space-2)');
  }
});
