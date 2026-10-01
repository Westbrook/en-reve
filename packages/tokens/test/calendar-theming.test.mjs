import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, validateManagedValue } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';
test('calendar interaction defaults and managed pins survive theme export and reopening',()=>{
 for(const mode of ['light','dark']) {
  const theme=resolveTheme({mode});const css=collectThemeCSSDeclarations(theme);
  assert.equal(css.get('--en-calendar-hover-opacity'),'0.1');assert.equal(css.get('--en-calendar-pressed-opacity'),'0.16');
  const draft=createReviewDraft({mode});draft.setToken('calendar.hover-opacity',0);draft.setToken('calendar.pressed-opacity',0.20);
  const reopened=reopenReviewDraft(draft.exportJSON({title:'Calendar feedback'}));assert.equal(reopened.options.pins['calendar.hover-opacity'],0);assert.equal(reopened.options.pins['calendar.pressed-opacity'],0.20);
  assert.throws(()=>validateManagedValue(theme,'calendar.hover-opacity',2));assert.throws(()=>validateManagedValue(theme,'calendar.pressed-opacity',-0.1));
 }
});
