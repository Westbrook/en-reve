import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReviewDraft, reopenReviewDraft, resolveTheme, densityNames,
  affectedTokens, validateManagedValue,
} from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

const block = 'focus.scroll-margin-block';
const inline = 'focus.scroll-margin-inline';
const rem = value => ({value, unit: 'rem'});

test('focus scroll margins follow rhythm in every mode and density without changing focus paint or control geometry', () => {
  for (const mode of ['light', 'dark']) for (const density of densityNames) {
    const baseline = resolveTheme({mode, density});
    const expanded = resolveTheme({mode, density, pins: {'rhythm.base': rem(.5)}});
    for (const id of [block, inline]) {
      assert.deepEqual(baseline.tokens[id].value, rem(1));
      assert.deepEqual(expanded.tokens[id].value, rem(2));
      assert.deepEqual(expanded.dependencies[id], ['space.4']);
      assert.ok(affectedTokens(expanded, ['rhythm.base']).includes(id));
    }
    for (const id of ['focus.width', 'focus.offset', 'focus.halo-width', 'size.control-min', 'size.target-min']) {
      assert.deepEqual(expanded.tokens[id].value, baseline.tokens[id].value);
    }
  }
});

test('managed independent axis pins reopen exactly and restoration rejoins the spacing graph', () => {
  const draft = createReviewDraft();
  draft.setToken(block, rem(.75));
  draft.setToken(inline, '{space.2}');
  draft.setToken('rhythm.base', rem(.5));
  assert.deepEqual(draft.theme.tokens[block].value, rem(.75));
  assert.deepEqual(draft.theme.tokens[inline].value, rem(1));
  const reopened = reopenReviewDraft(draft.exportJSON({title: 'Focus scrolling clearance'}));
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  assert.deepEqual(reopened.options.pins[block], rem(.75));
  assert.equal(reopened.options.pins[inline], '{space.2}');
  reopened.restoreToken(block);
  assert.deepEqual(reopened.theme.tokens[block].value, rem(2));
  assert.deepEqual(reopened.theme.tokens[inline].value, rem(1));
  assert.equal(reopened.canRestore(inline), true);
});

test('managed scroll spacing stays bounded while code-level pins remain available', () => {
  const theme = resolveTheme();
  for (const id of [block, inline]) {
    for (const value of [0, .25, .5, .75, 1, 1.5, 2]) {
      assert.doesNotThrow(() => validateManagedValue(theme, id, rem(value)));
    }
    assert.doesNotThrow(() => validateManagedValue(theme, id, '{space.6}'));
    for (const value of [-1, .7, 3]) {
      assert.throws(() => validateManagedValue(theme, id, rem(value)), error => error.code === 'managed-choice');
    }
  }
  const codeTheme = resolveTheme({pins: {[block]: rem(.7), [inline]: rem(3)}});
  assert.deepEqual(codeTheme.tokens[block].value, rem(.7));
  assert.deepEqual(codeTheme.tokens[inline].value, rem(3));
});

test('full themes reset both scroll axes and partial themes preserve the unselected axis', () => {
  const theme = resolveTheme({pins: {[block]: rem(.75)}});
  const full = collectThemeCSSDeclarations(theme);
  assert.equal(full.get('--en-focus-scroll-margin-block'), '0.75rem');
  assert.equal(full.get('--en-focus-scroll-margin-inline'), 'var(--en-space-4)');
  const partial = collectThemeCSSDeclarations(theme, {kind: 'partial', tokenIds: [block]});
  assert.equal(partial.get('--en-focus-scroll-margin-block'), '0.75rem');
  assert.equal(partial.has('--en-focus-scroll-margin-inline'), false);
});
