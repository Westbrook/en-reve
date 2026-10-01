import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, colorFromHex } from '../dist/index.js';

const rem = value => ({ value, unit: 'rem' });
const translucent = {...colorFromHex('#053659'), alpha: 12 / 255};
const transparent = {...colorFromHex('#FFFFFF'), alpha: 0};
const managedChoice = error => error.code === 'managed-choice';

test('option-list paint accepts intentional alpha without opening foreground alpha controls', () => {
  const draft = createReviewDraft();
  draft.setToken('component.option.hover-background', translucent);
  draft.setToken('component.option.selected-background', transparent);
  draft.setToken('component.option-list.border-color', transparent);
  const accepted = draft.theme;
  for (const id of ['component.option.hover-color', 'component.option.selected-color', 'component.option-list.color', 'color.text', 'component.input.background']) {
    assert.equal(draft.editor(id).alpha, false);
    assert.throws(() => draft.setToken(id, translucent), managedChoice);
    assert.equal(draft.theme, accepted);
  }
  const reopened = reopenReviewDraft(draft.exportJSON({title: 'Translucent list states'}));
  assert.deepEqual(reopened.theme.tokens['component.option.hover-background'].value, translucent);
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  // The managed guard does not prohibit explicit code-level foreground customization.
  assert.deepEqual(resolveTheme({pins: {'component.option.hover-color': translucent}}).tokens['component.option.hover-color'].value, translucent);
});

test('row and popup spacing follow references while managed menus remain anchored', () => {
  const draft = createReviewDraft();
  const menu = draft.editor('component.option-list.gap').choices;
  draft.setToken('component.option-list.gap', '{space.0-5}');
  draft.setToken('component.option.inline-padding', '{space.2-5}');
  draft.setToken('component.option.block-padding', rem(.375));
  draft.setToken('rhythm.base', rem(.5));
  assert.deepEqual(draft.theme.tokens['component.option-list.gap'].value, rem(.25));
  assert.deepEqual(draft.theme.tokens['component.option.inline-padding'].value, rem(1.25));
  assert.deepEqual(draft.theme.tokens['component.option.block-padding'].value, rem(.375));
  assert.deepEqual(draft.editor('component.option-list.gap').choices, menu);
  assert.throws(() => draft.setToken('component.option-list.gap', rem(3)), managedChoice);
  draft.restoreToken('component.option.block-padding');
  assert.deepEqual(draft.theme.dependencies['component.option.block-padding'], ['space.control-block']);
  assert.deepEqual(draft.theme.tokens['component.option.block-padding'].value, rem(.75));
  const reopened = reopenReviewDraft(draft.exportJSON({title: 'Independent row spacing'}));
  assert.equal(reopened.options.pins['component.option.inline-padding'], '{space.2-5}');
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
});

test('restoring popup geometry retains a selected-state pin and leaves other families unchanged', () => {
  const draft = createReviewDraft();
  const ordinary = ['radius.dialog', 'radius.control', 'font.label-strong.weight', 'size.target-min', 'size.target-touch'];
  const initial = Object.fromEntries(ordinary.map(id => [id, draft.theme.tokens[id].value]));
  draft.setToken('component.option-list.radius', rem(.625));
  draft.setToken('component.option.radius', rem(.875));
  draft.setToken('component.option.selected-background', transparent);
  draft.setToken('component.option.font-weight', 500);
  draft.setToken('component.option.selected-font-weight', 500);
  const metadata = {title: 'Popup and selected-row independence'};
  const reopened = reopenReviewDraft(draft.exportJSON(metadata));
  reopened.restoreToken('component.option-list.radius');
  assert.equal(reopened.canRestore('component.option-list.radius'), false);
  assert.deepEqual(reopened.theme.dependencies['component.option-list.radius'], ['radius.container']);
  assert.equal(reopened.canRestore('component.option.selected-background'), true);
  assert.deepEqual(reopened.theme.tokens['component.option.selected-background'].value, transparent);
  assert.deepEqual(reopened.theme.tokens['component.option.radius'].value, rem(.875));
  assert.deepEqual(Object.fromEntries(ordinary.map(id => [id, reopened.theme.tokens[id].value])), initial);
  const onceMore = reopenReviewDraft(reopened.exportJSON(metadata));
  assert.equal(onceMore.theme.sourceHash, reopened.theme.sourceHash);
});
