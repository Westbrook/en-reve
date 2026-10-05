import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createReviewDraft, getCustomizationContract, reopenReviewDraft, resolveTheme, styleOverrideNames, validateManagedValue } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

const roles = [
  ['bottom-border-color', 'border-color'],
  ['hover-bottom-border-color', 'hover-border-color'],
];

test('field bottom paint hooks retain inherited optional registration and ordinary authoring aliases', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({ mode });
    for (const [role, ordinary] of roles) {
      const id = `component.input.${role}`, cssName = `--en-input-${role}`;
      const contract = getCustomizationContract(theme, cssName);
      assert.equal(theme.tokens[id].cssName, cssName);
      assert.deepEqual(theme.tokens[id].dependencies, [`component.input.${ordinary}`]);
      assert.deepEqual(theme.tokens[id].value, theme.tokens[`component.input.${ordinary}`].value);
      assert.equal(contract.kind, 'override');
      assert.equal(contract.reset, 'theme');
      assert.equal(contract.inherits, true);
      assert.equal(contract.tokenType, 'color');
      assert.equal(contract.managed.supported, true);
      assert.deepEqual(contract.states, role.startsWith('hover') ? ['hover'] : []);
      assert.equal(contract.registration.syntax, '*');
      assert.equal(contract.registration.inherits, true);
      assert.equal(Object.hasOwn(contract.registration, 'initialValue'), false);
      assert.equal(contract.registration.typed.eligible, false);
      assert.equal(contract.tokenDefault.fullThemeValue, 'initial');
      assert.ok(styleOverrideNames.includes(cssName));
    }
  }
});

test('full themes reset field bottom paint while partial exports retain unselected inherited pins', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({ mode });
    const full = collectThemeCSSDeclarations(theme);
    const unrelated = collectThemeCSSDeclarations(theme, { kind: 'partial', tokenIds: ['color.text'] });
    for (const [role, ordinary] of roles) {
      const id = `component.input.${role}`, cssName = `--en-input-${role}`;
      assert.equal(full.get(cssName), 'initial');
      assert.equal(unrelated.has(cssName), false);
      assert.equal(collectThemeCSSDeclarations(theme, { kind: 'partial', tokenIds: [id] }).get(cssName), `var(--en-input-${ordinary})`);
      const cleared = collectThemeCSSDeclarations(theme, { kind: 'partial', tokenIds: [], clearOverrides: [cssName] });
      assert.deepEqual([...cleared], [[cssName, 'initial']]);
    }
    const bottomOnly = collectThemeCSSDeclarations(theme, { kind: 'partial', tokenIds: ['component.input.bottom-border-color'] });
    assert.equal(bottomOnly.has('--en-input-hover-bottom-border-color'), false);
  }
});

test('managed bottom paint pins round-trip independently and restore their original aliases', () => {
  for (const mode of ['light', 'dark']) {
    const draft = createReviewDraft({ mode });
    const ordinary = roles.map(([, role]) => draft.theme.tokens[`component.input.${role}`].value);
    draft.setToken('component.input.bottom-border-color', colorFromHex('#415267'));
    draft.setToken('component.input.hover-bottom-border-color', '{color.action-text}');
    const reopened = reopenReviewDraft(draft.exportJSON({ title: 'Independent field bottom paint' }));
    assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
    assert.deepEqual(reopened.options.pins['component.input.bottom-border-color'], colorFromHex('#415267'));
    assert.equal(reopened.options.pins['component.input.hover-bottom-border-color'], '{color.action-text}');
    const pinned = collectThemeCSSDeclarations(reopened.theme);
    assert.equal(pinned.get('--en-input-bottom-border-color'), reopened.theme.tokens['component.input.bottom-border-color'].cssExpression);
    assert.equal(pinned.get('--en-input-hover-bottom-border-color'), 'var(--en-color-action-text)');
    for (const [index, [role, original]] of roles.entries()) {
      const id = `component.input.${role}`;
      assert.deepEqual(reopened.theme.tokens[`component.input.${original}`].value, ordinary[index]);
      assert.throws(() => validateManagedValue(reopened.theme, id, '{border.width}'));
      assert.throws(() => validateManagedValue(reopened.theme, id, { ...colorFromHex('#415267'), alpha: .5 }));
      reopened.restoreToken(id);
      assert.deepEqual(reopened.theme.tokens[id].dependencies, [`component.input.${original}`]);
      assert.equal(collectThemeCSSDeclarations(reopened.theme).get(`--en-input-${role}`), 'initial');
    }
  }
});
