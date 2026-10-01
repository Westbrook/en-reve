import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewDraft, reopenReviewDraft, resolveTheme, affectedTokens } from '../dist/index.js';
const ms=value=>({value,unit:'ms'}),px=value=>({value,unit:'px'});
test('surface motion is opt-in and does not change focus, geometry or color derivation',()=>{
  const baseline=resolveTheme();
  for(const id of ['duration.enter','duration.exit']) assert.deepEqual(baseline.tokens[id].value,ms(0));
  assert.deepEqual(baseline.tokens['motion.surface-offset'].value,px(0));
  assert.equal(baseline.tokens['motion.surface-scale'].value,1);
  const changed=resolveTheme({pins:{'duration.enter':ms(150),'duration.exit':ms(100),'motion.surface-offset':px(4),'motion.surface-scale':.98}});
  for(const id of ['size.control-min','focus.width','duration.focus-enter','color.text']) assert.deepEqual(changed.tokens[id].value,baseline.tokens[id].value);
  assert.equal(affectedTokens(changed,['duration.enter']).includes('duration.focus-enter'),false);
});
test('managed surface recipes roundtrip independently with finite rails and Restore',()=>{
  const draft=createReviewDraft();
  draft.setToken('duration.enter',ms(150));draft.setToken('duration.exit',ms(100));
  draft.setToken('ease.enter',[.2,0,0,1]);draft.setToken('motion.surface-offset',px(4));draft.setToken('motion.surface-scale',.95);
  const json=draft.exportJSON({title:'Surface motion'}),reopened=reopenReviewDraft(json);
  assert.equal(reopened.exportJSON({title:'Surface motion'}),json);
  assert.throws(()=>draft.setToken('duration.enter',ms(155)));
  assert.throws(()=>draft.setToken('duration.exit',ms(510)));
  assert.throws(()=>draft.setToken('motion.surface-offset',px(40)));
  assert.throws(()=>draft.setToken('motion.surface-scale',.5));
  reopened.restoreToken('duration.enter');assert.deepEqual(reopened.theme.tokens['duration.enter'].value,ms(0));
  assert.deepEqual(reopened.theme.tokens['duration.exit'].value,ms(100));
});
