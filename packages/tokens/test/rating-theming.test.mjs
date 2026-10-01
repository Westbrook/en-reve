import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createReviewDraft, reopenReviewDraft, resolveTheme, validateManagedValue } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';
import { styleOverrideNames } from '../dist/overrides.js';

const id = 'component.rating.star-radius';
const cssName = '--en-rating-star-radius';

test('rating radius accepts managed square, rounded and circular shapes while rejecting unmanaged dimensions', () => {
  const theme = resolveTheme();
  assert.equal(theme.tokens[id].cssName, cssName);
  assert.equal(styleOverrideNames.includes(cssName), true);
  for (const value of [{value:0,unit:'rem'}, {value:.375,unit:'rem'}, {value:9999,unit:'px'}, '{radius.pill}', '{radius.control}']) {
    assert.doesNotThrow(() => validateManagedValue(theme, id, value));
  }
  for (const value of [{value:-1,unit:'rem'}, {value:321,unit:'px'}, '{color.action}']) {
    assert.throws(() => validateManagedValue(theme, id, value));
  }
});

test('rating radius pin round-trips with its alias and restores the shared radius without altering other geometry', () => {
  const draft = createReviewDraft({mode:'dark'});
  const control = draft.theme.tokens['radius.control'].value;
  const button = draft.theme.tokens['component.button.radius'].value;
  draft.setToken(id, '{radius.pill}');
  assert.deepEqual(draft.theme.dependencies[id], ['radius.pill']);
  assert.deepEqual(draft.theme.tokens[id].value, {value:9999,unit:'px'});
  assert.deepEqual(draft.theme.tokens['radius.control'].value, control);
  assert.deepEqual(draft.theme.tokens['component.button.radius'].value, button);
  const reopened = reopenReviewDraft(draft.exportJSON({title:'Circular star targets'}));
  assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
  assert.equal(reopened.options.pins[id], '{radius.pill}');
  reopened.restoreToken(id);
  assert.equal(reopened.canRestore(id), false);
  assert.deepEqual(reopened.theme.dependencies[id], ['radius.control']);
  assert.deepEqual(reopened.theme.tokens[id].value, control);
});

test('full rating themes clear inherited optional shapes and partial exports preserve unrelated pins', () => {
  for (const mode of ['light','dark']) {
    const theme = resolveTheme({mode});
    assert.deepEqual(theme.tokens[id].value, theme.tokens['radius.control'].value);
    assert.equal(collectThemeCSSDeclarations(theme).get(cssName), 'initial');
    assert.equal(collectThemeCSSDeclarations(theme, {kind:'partial',tokenIds:['color.text']}).has(cssName), false);
    assert.equal(collectThemeCSSDeclarations(theme, {kind:'partial',tokenIds:[id]}).get(cssName), 'var(--en-radius-control)');
    const pinned = resolveTheme({mode,pins:{[id]:'{radius.pill}'}});
    assert.equal(collectThemeCSSDeclarations(pinned).get(cssName), 'var(--en-radius-pill)');
    assert.equal(collectThemeCSSDeclarations(pinned, {kind:'partial',tokenIds:[id]}).get(cssName), 'var(--en-radius-pill)');
  }
});

test('Astryx and shadcn inspired appearances request circular rating targets through the managed token API', async () => {
  for (const family of ['astryx','shadcn']) for (const mode of ['light','dark']) {
    const edits = JSON.parse(await readFile(new URL(`../../../tooling/theme-candidates/inspired/${family}.${mode}.json`, import.meta.url), 'utf8'));
    const draft = createReviewDraft({mode});
    for (const edit of edits) if (edit.type === 'token') draft.setToken(edit.id, edit.value);
    assert.equal(draft.options.pins[id], '{radius.pill}');
    assert.deepEqual(draft.theme.tokens[id].value, {value:9999,unit:'px'});
  }
});
