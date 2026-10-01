import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, affectedTokens } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';

const px=value=>({value,unit:'px'});
const ms=value=>({value,unit:'ms'});
const halo={colorSpace:'srgb',components:[.5,.5,.5],alpha:.5};

test('focus derivation does not change checkbox, tab or decorative quote geometry',()=>{
  for (const mode of ['light','dark']) for (const density of ['compact','comfortable','spacious']) {
    const theme=resolveTheme({mode,density,pins:{'focus.width':px(4)}});
    assert.deepEqual(theme.tokens['focus.inset-offset'].value,px(-4));
    for (const id of ['size.choice-mark-stroke','size.tab-indicator','size.quote-border']) {
      assert.deepEqual(theme.tokens[id].value,px(2));
      assert.equal(affectedTokens(theme,['focus.width']).includes(id),false);
    }
    assert.equal(affectedTokens(theme,['focus.width']).includes('focus.inset-offset'),true);
  }
});

test('managed halo and accent choices retain independent pins through reopen and Restore',()=>{
  const draft=createReviewDraft();
  const choices=draft.editor('component.input.focus-halo-width').choices;
  draft.setToken('component.input.focus-halo-width',px(3));
  draft.setToken('component.input.focus-halo-color',halo);
  draft.setToken('component.input.focus-accent-width',px(2));
  draft.setToken('component.input.focus-accent-color','{palette.accent}');
  draft.setToken('duration.focus-enter',ms(200));
  draft.setToken('duration.focus-exit',ms(50));
  draft.setToken('ease.focus-enter',[0,0,0,1]);
  draft.setToken('rhythm.base',{value:.5,unit:'rem'});
  assert.deepEqual(draft.editor('component.input.focus-halo-width').choices,choices);
  const metadata={title:'Focus recipe review'};
  const json=draft.exportJSON(metadata);
  const reopened=reopenReviewDraft(json);
  assert.equal(reopened.exportJSON(metadata),json);
  assert.deepEqual(reopened.theme.tokens['component.input.focus-halo-color'].value,halo);
  reopened.restoreToken('component.input.focus-halo-width');
  assert.deepEqual(reopened.theme.tokens['component.input.focus-halo-width'].value,px(0));
  assert.deepEqual(reopened.theme.tokens['component.input.focus-accent-width'].value,px(2));
  assert.equal(reopened.options.pins['component.input.focus-accent-color'],'{palette.accent}');
});

test('managed primary contours remain opaque and nonzero while supplemental paint is optional',()=>{
  const draft=createReviewDraft();
  assert.throws(()=>draft.setToken('component.input.focus-color',halo),error=>error.code==='managed-choice');
  assert.throws(()=>draft.setToken('component.input.focus-width',px(0)),error=>error.code==='managed-choice');
  assert.throws(()=>draft.setToken('component.input.focus-halo-width',px(7)),error=>error.code==='managed-choice');
  assert.throws(()=>draft.setToken('duration.focus-enter',ms(125)),error=>error.code==='managed-choice');
  draft.setToken('component.option.focus-offset',px(-3));
  draft.setToken('component.input.focus-halo-width',px(0));
  draft.setToken('duration.focus-enter',ms(0));
  assert.deepEqual(draft.theme.tokens['component.option.focus-offset'].value,px(-3));
});

test('full child themes clear family pins while partial declarations keep independent controls',()=>{
  const parent=resolveTheme({pins:{'component.input.focus-halo-width':px(3),'component.input.focus-halo-color':halo}});
  const full=collectThemeCSSDeclarations(resolveTheme({mode:'dark'}));
  assert.equal(full.get('--en-input-focus-halo-width'),'initial');
  assert.equal(full.get('--en-input-focus-halo-color'),'initial');
  const partial=collectThemeCSSDeclarations(parent,{kind:'partial',tokenIds:['component.input.focus-halo-width']});
  assert.equal(partial.get('--en-input-focus-halo-width'),'3px');
  assert.equal(partial.has('--en-input-focus-halo-color'),false);
  assert.equal(partial.has('--en-button-focus-width'),false);
});
