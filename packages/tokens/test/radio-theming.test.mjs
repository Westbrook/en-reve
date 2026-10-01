import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, colorFromHex } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

const id = 'component.radio.selected-color';
const cssName = '--en-radio-selected-color';

test('radio selection pin follows its own alias, reopens exactly, and restores the ordinary action rule', () => {
  const draft = createReviewDraft({mode: 'dark'});
  draft.setToken('palette.action', colorFromHex('#115ea3'));
  draft.setToken('palette.accent', colorFromHex('#479ef5'));
  const action = draft.theme.tokens['color.action'].value;
  assert.deepEqual(draft.theme.tokens[id].value, action);
  assert.equal(draft.editor(id).alpha, false);
  draft.setToken(id, '{palette.accent}');
  draft.setToken('palette.accent', colorFromHex('#62abf5'));
  assert.deepEqual(draft.theme.dependencies[id], ['palette.accent']);
  assert.deepEqual(draft.theme.tokens[id].value, colorFromHex('#62abf5'));
  assert.deepEqual(draft.theme.tokens['color.action'].value, action);
  const reopened = reopenReviewDraft(draft.exportJSON({title: 'Independent checked radio paint'}));
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  assert.equal(reopened.options.pins[id], '{palette.accent}');
  reopened.restoreToken(id);
  assert.equal(reopened.canRestore(id), false);
  assert.deepEqual(reopened.theme.dependencies[id], ['color.action']);
  assert.deepEqual(reopened.theme.tokens[id].value, action);
  assert.equal(reopened.canRestore('palette.accent'), true);
});

test('full themes clear optional radio paint, while partial selections preserve unrelated inherited overrides', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({mode});
    assert.deepEqual(theme.tokens[id].value, theme.tokens['color.action'].value);
    assert.equal(collectThemeCSSDeclarations(theme).get(cssName), 'initial');
    assert.equal(collectThemeCSSDeclarations(theme, {kind: 'partial', tokenIds: ['color.text']}).has(cssName), false);
  }
  const pinned = resolveTheme({mode: 'dark', pins: {[id]: '{palette.accent}'}});
  assert.equal(collectThemeCSSDeclarations(pinned).get(cssName), pinned.tokens[id].cssExpression);
});
