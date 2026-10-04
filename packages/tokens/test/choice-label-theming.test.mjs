import test from 'node:test';
import assert from 'node:assert/strict';
import {
  colorFromHex, createPropertyRegistrationPlan, createReviewDraft,
  getCustomizationContract, reopenReviewDraft, resolveTheme,
} from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

// Deliberately independent of the registry and source-generation role lists.
const hooks = [
  ['component.choice.label-color', '--en-choice-label-color', 'rest'],
  ['component.choice.label-hover-color', '--en-choice-label-hover-color', 'hover'],
  ['component.choice.label-focus-color', '--en-choice-label-focus-color', 'focus-visible'],
  ['component.choice.label-pressed-color', '--en-choice-label-pressed-color', 'pressed'],
  ['component.choice.label-disabled-color', '--en-choice-label-disabled-color', 'disabled'],
];

test('choice label paint exposes five optional managed color hooks without typed initial values', () => {
  const theme = resolveTheme();
  const plan = createPropertyRegistrationPlan(theme, {mode: 'typed'});
  for (const [id, name, state] of hooks) {
    const token = theme.tokens[id];
    assert.ok(token, id);
    assert.equal(token.cssName, name);
    assert.equal(token.type, 'color');
    assert.deepEqual(theme.dependencies[id], ['color.text']);
    assert.deepEqual(token.value, theme.tokens['color.text'].value);
    const contract = getCustomizationContract(theme, name);
    assert.ok(contract, name);
    assert.equal(contract.tokenId, id);
    assert.equal(contract.tokenType, 'color');
    assert.equal(contract.syntax, '<color>');
    assert.equal(contract.kind, 'override');
    assert.equal(contract.reset, 'theme');
    assert.equal(contract.inherits, true);
    assert.equal(contract.managed.supported, true);
    assert.equal(contract.managed.tokenId, id);
    assert.equal(contract.consumerStatus, 'connected');
    assert.deepEqual(contract.consumers, ['packages/styles/src/internal/choice-label.ts']);
    assert.deepEqual(contract.states, [state]);
    assert.equal(contract.tokenDefault.fullThemeValue, 'initial');
    assert.equal(contract.size.behavior, 'none');
    assert.equal(contract.registration.typed.eligible, false);
    const registration = plan.registrations.find(record => record.name === name);
    assert.ok(registration, name);
    assert.equal(registration.syntax, '*');
    assert.equal(registration.inherits, true);
    assert.equal(registration.initialValue, undefined);
  }
});

test('full themes reset every choice label hook while partial themes preserve unspecified pins', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({mode});
    const full = collectThemeCSSDeclarations(theme);
    const partial = collectThemeCSSDeclarations(theme, {kind: 'partial', tokenIds: ['color.text']});
    for (const [, name] of hooks) {
      assert.equal(full.get(name), 'initial', `${mode} full ${name}`);
      assert.equal(partial.has(name), false, `${mode} partial ${name}`);
    }
    const cleared = collectThemeCSSDeclarations(theme, {
      kind: 'partial', tokenIds: [], clearOverrides: hooks.map(([, name]) => name),
    });
    assert.deepEqual([...cleared], hooks.map(([, name]) => [name, 'initial']));
  }
});

test('choice label semantic pins emit independently and survive review draft round trips', () => {
  for (const mode of ['light', 'dark']) {
    const draft = createReviewDraft({mode});
    draft.setToken('palette.accent', colorFromHex('#274869'));
    for (const [id] of hooks) draft.setToken(id, '{palette.accent}');
    const reopened = reopenReviewDraft(draft.exportJSON({title: 'Independent choice label paint'}));
    assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
    const full = collectThemeCSSDeclarations(reopened.theme);
    for (const [id, name] of hooks) {
      assert.equal(reopened.options.pins[id], '{palette.accent}');
      assert.equal(reopened.editor(id).alpha, false);
      assert.deepEqual(reopened.theme.dependencies[id], ['palette.accent']);
      assert.deepEqual(reopened.theme.tokens[id].value, colorFromHex('#274869'));
      assert.equal(full.get(name), reopened.theme.tokens[id].cssExpression);
      assert.notEqual(full.get(name), 'initial');
      const partial = collectThemeCSSDeclarations(reopened.theme, {kind: 'partial', tokenIds: [id]});
      assert.equal(partial.get(name), reopened.theme.tokens[id].cssExpression);
      for (const [otherId, otherName] of hooks) {
        if (otherId !== id) assert.equal(partial.has(otherName), false);
      }
    }
    const [firstId, firstName] = hooks[0];
    reopened.restoreToken(firstId);
    const restored = collectThemeCSSDeclarations(reopened.theme);
    assert.equal(restored.get(firstName), 'initial');
    assert.equal(reopened.canRestore(firstId), false);
    for (const [id, name] of hooks.slice(1)) {
      assert.equal(reopened.canRestore(id), true);
      assert.equal(restored.get(name), reopened.theme.tokens[id].cssExpression);
      assert.notEqual(restored.get(name), 'initial');
    }
  }
});
