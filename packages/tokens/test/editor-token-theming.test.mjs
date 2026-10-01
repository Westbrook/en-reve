import test from 'node:test';
import assert from 'node:assert/strict';
import {createReviewDraft,reopenReviewDraft,resolveTheme,validateManagedValue} from '../dist/index.js';
import {collectThemeCSSDeclarations} from '../dist/css.js';
test('editor token geometry and paint round-trip while full themes clear overrides',()=>{
 const draft=createReviewDraft({mode:'dark'});draft.setToken('component.editor-token.radius',{value:.25,unit:'rem'});draft.setToken('component.editor-token.inline-padding','{space.2}');draft.setToken('component.editor-token.hover-background','{color.selected}');
 const reopened=reopenReviewDraft(draft.exportJSON({title:'Editor tokens'}));assert.equal(reopened.theme.sourceHash,draft.theme.sourceHash);assert.equal(collectThemeCSSDeclarations(draft.theme).get('--en-editor-token-inline-padding'),'var(--en-space-2)');
 const full=collectThemeCSSDeclarations(resolveTheme());for(const role of ['background','color','border-color','hover-background','pressed-background','radius','inline-padding','block-padding','gap','min-size'])assert.equal(full.get('--en-editor-token-'+role),'initial');
 assert.throws(()=>validateManagedValue(draft.theme,'component.editor-token.min-size',{value:1000,unit:'rem'}));
});
