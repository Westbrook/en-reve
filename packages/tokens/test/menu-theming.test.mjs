import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, validateManagedValue, customizationContracts, styleOverrideNames } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

// Fluent React Menu 9.25.4 MenuPopover source: minWidth138px/maxWidth300px.
// The token defaults remain opt-in, confined to ordinary command menu surfaces.
test('menu source width pins round-trip without changing shared overlay or layout geometry', () => {
  for (const mode of ['light', 'dark']) {
    const draft = createReviewDraft({ mode });
    const layout = draft.theme.tokens['layout.panel-preferred'].value;
    const ceiling = draft.theme.tokens['layout.form-max'].value;
    draft.setToken('component.menu.min-inline-size', { value: 138, unit: 'px' });
    draft.setToken('component.menu.max-inline-size', { value: 300, unit: 'px' });
    const reopened = reopenReviewDraft(draft.exportJSON({ title: 'Fluent menu geometry' }));
    assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
    assert.deepEqual(reopened.theme.tokens['layout.panel-preferred'].value, layout);
    assert.deepEqual(reopened.theme.tokens['layout.form-max'].value, ceiling);
    assert.deepEqual(reopened.options.pins['component.menu.min-inline-size'], { value: 138, unit: 'px' });
    assert.deepEqual(reopened.options.pins['component.menu.max-inline-size'], { value: 300, unit: 'px' });
    const full = collectThemeCSSDeclarations(reopened.theme);
    assert.equal(full.get('--en-menu-min-inline-size'), '138px');
    assert.equal(full.get('--en-menu-max-inline-size'), '300px');
    assert.equal(full.get('--en-overlay-max-inline-size'), 'initial');
    assert.throws(() => validateManagedValue(draft.theme, 'component.menu.min-inline-size', '{color.action}'));
    assert.throws(() => validateManagedValue(draft.theme, 'component.menu.max-inline-size', { value: 10000, unit: 'px' }));
  }
});

test('full themes reset menu width pins while partial themes preserve unrelated inputs', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({ mode });
    const full = collectThemeCSSDeclarations(theme);
    const partial = collectThemeCSSDeclarations(theme, { kind: 'partial', tokenIds: ['color.text'] });
    for (const role of ['min-inline-size', 'max-inline-size']) {
      assert.equal(full.get(`--en-menu-${role}`), 'initial');
      assert.equal(partial.has(`--en-menu-${role}`), false);
      assert.ok(styleOverrideNames.includes(`--en-menu-${role}`));
      const contract = customizationContracts(theme).find(entry => entry.cssName === `--en-menu-${role}`);
      assert.equal(contract?.kind, 'override');
      assert.equal(contract?.consumerStatus, 'connected');
      assert.equal(contract?.family, 'commands');
      assert.equal(contract?.tokenType, 'dimension');
    }
  }
});
