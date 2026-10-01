import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, densityNames } from '../dist/index.js';

const roles = {
  'component.button.inline-padding': 'space.control-inline',
  'component.input.inline-padding': 'space.control-inline',
  'component.segmented-control.frame-inset': 'space.1',
};
const rem = value => ({ value, unit: 'rem' });

test('family dimensions follow existing defaults in every appearance and density', () => {
  for (const mode of ['light', 'dark']) for (const density of densityNames) {
    const theme = resolveTheme({ mode, density });
    for (const [id, fallback] of Object.entries(roles)) {
      assert.deepEqual(theme.tokens[id].value, theme.tokens[fallback].value);
      assert.deepEqual(theme.dependencies[id], [fallback]);
    }
    assert.deepEqual(theme.tokens['size.target-min'].value, { value: 24, unit: 'px' });
    assert.deepEqual(theme.tokens['size.target-touch'].value, rem(2.75));
  }
});

test('managed family choices remain anchored while pins, rhythm, Restore and Undo compose', () => {
  const draft = createReviewDraft();
  const menus = Object.fromEntries(Object.keys(roles).map(id => [id, draft.editor(id).choices]));
  assert.equal(menus['component.button.inline-padding'].length, 9);
  assert.equal(menus['component.segmented-control.frame-inset'].length, 5);
  draft.setToken('component.button.inline-padding', '{space.5}');
  draft.setToken('component.input.inline-padding', rem(.5));
  draft.setToken('component.segmented-control.frame-inset', '{space.0-5}');
  draft.setToken('rhythm.base', rem(.5));
  assert.deepEqual(draft.theme.tokens['component.button.inline-padding'].value, rem(2.5));
  assert.deepEqual(draft.theme.tokens['component.input.inline-padding'].value, rem(.5));
  assert.deepEqual(draft.theme.tokens['component.segmented-control.frame-inset'].value, rem(.25));
  assert.deepEqual(draft.theme.tokens['space.2-5'].value, rem(1.25));
  for (const id of Object.keys(roles)) assert.deepEqual(draft.editor(id).choices, menus[id]);
  const before = draft.theme;
  assert.throws(() => draft.setToken('component.segmented-control.frame-inset', rem(.75)), error => error.code === 'managed-choice');
  assert.equal(draft.theme, before);
  draft.restoreToken('component.input.inline-padding');
  assert.deepEqual(draft.theme.tokens['component.input.inline-padding'].value, rem(1.5));
  assert.equal(draft.undo(), true);
  assert.deepEqual(draft.theme.tokens['component.input.inline-padding'].value, rem(.5));
});

test('family pins reopen strictly, retain alias dependencies and restore their source defaults', () => {
  const draft = createReviewDraft();
  for (const [id, alias] of Object.entries(roles)) draft.setToken(id, `{${alias}}`);
  const metadata = { title: 'Family geometry review' };
  const json = draft.exportJSON(metadata);
  const reopened = reopenReviewDraft(json);
  assert.equal(reopened.exportJSON(metadata), json);
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  for (const [id, alias] of Object.entries(roles)) {
    assert.equal(reopened.options.pins[id], `{${alias}}`);
    reopened.restoreToken(id);
    assert.equal(Object.hasOwn(reopened.options.pins, id), false);
    assert.deepEqual(reopened.theme.dependencies[id], [alias]);
  }
});

test('half-step input padding expresses a 10px field beside 12px actions at the default rhythm', () => {
  const draft = createReviewDraft();
  draft.setContext({ density: 'compact' });
  draft.setToken('space.control-inline', '{space.3}');
  draft.setToken('component.input.inline-padding', '{space.2-5}');
  assert.deepEqual(draft.theme.tokens['component.input.inline-padding'].value, rem(.625));
  assert.deepEqual(draft.theme.tokens['space.control-inline'].value, rem(.75));
  const reopened = reopenReviewDraft(draft.exportJSON({ title: 'Input padding distinction' }));
  reopened.setToken('rhythm.base', rem(.5));
  assert.deepEqual(reopened.theme.tokens['component.input.inline-padding'].value, rem(1.25));
  assert.deepEqual(reopened.theme.tokens['space.control-inline'].value, rem(1.5));
});
