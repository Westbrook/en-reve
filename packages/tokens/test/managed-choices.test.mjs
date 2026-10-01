import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReviewDraft, reopenReviewDraft, resolveTheme, editorDescriptor,
  validateManagedValue, densityNames,
} from '../dist/index.js';

const rem = value => ({value, unit:'rem'});
const px = value => ({value, unit:'px'});
const managedChoice = error => error.code === 'managed-choice';
// A source fixture keeps this policy test independent of the component-token wiring change.
const buttonSource = {component:{button:{radius:{$type:'dimension', $value:'{radius.control}'}}}};

test('radius editors accept exact 6/10/18px choices without losing the existing scale or pill', () => {
  for (const mode of ['light', 'dark']) for (const density of densityNames) {
    const theme = resolveTheme({mode, density, source:buttonSource});
    const unchanged = theme.sourceHash;
    for (const id of ['radius.control', 'radius.container', 'radius.dialog', 'component.button.radius']) {
      for (const value of [0, .25, .5, .75, 1, 1.25, 1.5, 2, .375, .625, 1.125]) {
        assert.doesNotThrow(() => validateManagedValue(theme, id, rem(value)), `${id}: ${value}rem`);
      }
      assert.doesNotThrow(() => validateManagedValue(theme, id, px(9999)));
      assert.throws(() => validateManagedValue(theme, id, rem(.7)), managedChoice);
    }
    assert.equal(theme.sourceHash, unchanged);
    assert.deepEqual(theme.tokens['radius.control'].value, rem(.5));
    assert.deepEqual(theme.tokens['component.button.radius'].value, rem(.5));
    const draft = createReviewDraft({mode, density});
    const choiceDefault = draft.theme.tokens['radius.choice'].value;
    draft.setToken('radius.choice', choiceDefault);
    assert.deepEqual(draft.theme.tokens['radius.choice'].value, px(2));
  }
});

test('managed button radius retains the old generic choices for a custom code baseline', () => {
  const theme = resolveTheme({source:buttonSource, pins:{'radius.control':px(8)}});
  for (const value of [6, 8, 10, 12]) assert.doesNotThrow(() => validateManagedValue(theme, 'component.button.radius', px(value)));
  assert.doesNotThrow(() => validateManagedValue(theme, 'component.button.radius', rem(1.125)));
  assert.deepEqual(theme.tokens['radius.control'].value, px(8));
});

test('exact line-height ratios propagate through shared control metrics and reopen without coercion', () => {
  const theme = resolveTheme();
  for (const value of [1.2, 1.3, 1.4, 1.5, 1.6, 1.75, 2]) {
    assert.doesNotThrow(() => validateManagedValue(theme, 'font.ui.line-height', value));
  }
  for (const [size, line, pixels] of [[.875, 10/7, 20], [1, 11/8, 22], [1.5, 4/3, 32], [1, 1.25, 20]]) {
    const draft = createReviewDraft();
    draft.setToken('font.ui.size', rem(size));
    draft.setToken('font.ui.line-height', line);
    assert.equal(draft.theme.tokens['font.input.line-height'].value, line);
    assert.equal(draft.theme.tokens['font.label-strong.line-height'].value, line);
    assert.equal(draft.theme.tokens['font.input.size'].value.value * 16 * line, pixels);
    const reopened = reopenReviewDraft(draft.exportJSON({title:'Exact managed leading'}));
    assert.equal(reopened.options.pins['font.ui.line-height'], line);
    assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  }
  assert.throws(() => validateManagedValue(theme, 'font.ui.line-height', 1.27), managedChoice);
  assert.equal(resolveTheme().tokens['font.ui.line-height'].value, 1.5);
});

test('16px icon choice preserves the old fallback choices, anchored policy, and unscaled targets', () => {
  for (const baseline of [resolveTheme(), resolveTheme({pins:{'size.icon':px(24)}})]) {
    const original = baseline.tokens['size.icon'].value;
    for (const scale of [.75, 1, 1.25, 1.5]) {
      assert.doesNotThrow(() => validateManagedValue(baseline, 'size.icon', {value:original.value * scale, unit:original.unit}));
    }
    assert.doesNotThrow(() => validateManagedValue(baseline, 'size.icon', rem(1)));
  }
  const draft = createReviewDraft();
  const choices = draft.editor('size.icon').choices;
  const targets = ['size.target-min', 'size.target-touch'].map(id => draft.theme.tokens[id].value);
  const control = draft.theme.tokens['size.control-min'].value;
  draft.setToken('size.icon', rem(1));
  assert.deepEqual(draft.theme.tokens['size.icon-medium'].value, rem(1));
  assert.deepEqual(draft.editor('size.icon').choices, choices);
  draft.setToken('size.icon', rem(1.6875));
  const accepted = draft.theme;
  assert.throws(() => draft.setToken('size.icon', rem(2.53125)), managedChoice);
  assert.equal(draft.theme, accepted);
  assert.deepEqual(['size.target-min', 'size.target-touch'].map(id => draft.theme.tokens[id].value), targets);
  assert.deepEqual(draft.theme.tokens['size.control-min'].value, control);
  assert.deepEqual(resolveTheme().tokens['size.icon'].value, rem(1.125));
});

test('scalar additions do not open arbitrary compound editors or lower target policy', () => {
  const draft = createReviewDraft();
  const shadow = structuredClone(draft.theme.tokens['shadow.overlay'].value);
  shadow.offsetX = px(1);
  const accepted = draft.theme;
  assert.throws(() => draft.setToken('shadow.overlay', [shadow, shadow]), managedChoice);
  assert.throws(() => draft.setToken('font.ui.family', ['Unregistered font', 'sans-serif']), managedChoice);
  assert.throws(() => draft.setToken('size.target-min', px(16)), managedChoice);
  assert.throws(() => draft.setToken('size.target-touch', rem(1)), managedChoice);
  assert.equal(draft.theme, accepted);
  assert.deepEqual(editorDescriptor(draft.theme, 'size.target-min').choices, [24, 28, 32, 40, 44, 48].map(px));
  assert.deepEqual(editorDescriptor(draft.theme, 'size.target-touch').choices, [2.75, 3, 3.5, 4].map(rem));
  // Code-level compound data remains valid; only managed authoring stays bounded.
  assert.deepEqual(resolveTheme({pins:{'shadow.overlay':[shadow, shadow]}}).tokens['shadow.overlay'].value, [shadow, shadow]);
});


test('managed panel spacing follows a five-step alias, can be fixed, and restores the default rule across reopen', () => {
  const draft = createReviewDraft();
  const metadata = {title:'Panel rhythm review'};
  assert.ok(draft.editor('space.panel').aliasTargets.includes('space.5'));
  draft.setToken('space.panel', '{space.5}');
  assert.deepEqual(draft.theme.tokens['space.panel'].value, rem(1.25));
  assert.deepEqual(draft.theme.dependencies['space.panel'], ['space.5']);
  draft.setToken('rhythm.base', rem(.375));
  assert.deepEqual(draft.theme.tokens['space.panel'].value, rem(1.875));

  const aliasReopened = reopenReviewDraft(draft.exportJSON(metadata));
  assert.equal(aliasReopened.options.pins['space.panel'], '{space.5}');
  assert.equal(aliasReopened.theme.sourceHash, draft.theme.sourceHash);
  assert.deepEqual(aliasReopened.theme.dependencies['space.panel'], ['space.5']);
  aliasReopened.setToken('space.panel', rem(1));
  aliasReopened.setToken('rhythm.base', rem(.5));
  assert.deepEqual(aliasReopened.theme.tokens['space.5'].value, rem(2.5));
  assert.deepEqual(aliasReopened.theme.tokens['space.panel'].value, rem(1));
  assert.deepEqual(aliasReopened.theme.dependencies['space.panel'], []);
  assert.equal(aliasReopened.canRestore('space.panel'), true);

  // Restore resumes the comfortable source default (space.6), not the prior custom alias.
  aliasReopened.restoreToken('space.panel');
  assert.equal(aliasReopened.canRestore('space.panel'), false);
  assert.deepEqual(aliasReopened.theme.dependencies['space.panel'], ['space.6']);
  assert.deepEqual(aliasReopened.theme.tokens['space.panel'].value, rem(3));
  aliasReopened.setToken('rhythm.base', rem(.25));
  assert.deepEqual(aliasReopened.theme.tokens['space.panel'].value, rem(1.5));
  const restoredReopened = reopenReviewDraft(aliasReopened.exportJSON(metadata));
  assert.equal(restoredReopened.theme.sourceHash, aliasReopened.theme.sourceHash);
  assert.equal(Object.hasOwn(restoredReopened.options.pins, 'space.panel'), false);
  assert.deepEqual(restoredReopened.theme.dependencies['space.panel'], ['space.6']);
  assert.deepEqual(restoredReopened.theme.tokens['space.panel'].value, rem(1.5));
});
