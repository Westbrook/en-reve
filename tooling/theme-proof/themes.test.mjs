import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme,createReviewDraft,reopenReviewDraft,createThemePatchPlan} from '@en-reve/tokens';
import {themeOptions,directions} from '../../apps/docs/src/theme-proof/themes.ts';
for(const direction of directions)for(const mode of ['light','dark'])test(`${direction} ${mode}: compiler, transferable roles and radius dependency behavior`,()=>{
 for(const density of ['compact','comfortable','spacious']){
  const options=themeOptions(direction,mode,density);const theme=resolveTheme(options);
  assert.deepEqual(theme.diagnostics,[]);
  const draft=createReviewDraft(options);const restored=reopenReviewDraft(draft.exportJSON({title:direction,rationale:'Transfer proof'}),{baseOptions:options});
  assert.equal(restored.theme.sourceHash,draft.theme.sourceHash);
  assert.deepEqual(restored.theme.pins,draft.theme.pins);
  const patch=createThemePatchPlan(theme,{changes:{'radius.control':{value:0,unit:'px'}}});
  assert.ok(patch.outputTokenIds.includes('radius.control-small'));
  assert.ok(!patch.outputTokenIds.includes('color.action'));
  assert.equal(patch.theme.tokens['radius.control-large'].value.value,0);
  assert.equal(patch.theme.tokens['font.body.family'].cssValue,theme.tokens['font.body.family'].cssValue);
  assert.deepEqual(theme.tokens['size.target-min'].value,{value:24,unit:'px'});
 }
});
test('visual directions differ beyond color in type, geometry, rhythm, material and state',()=>{
 const themes=directions.map(d=>resolveTheme(themeOptions(d)));
 for(const id of ['radius.control','rhythm.base','font.heading-large.weight','font.heading-large.size','component.option.selected-font-weight'])assert.equal(new Set(themes.map(t=>t.tokens[id].cssValue)).size,3,id);
 assert.notEqual(themes[0].tokens['font.body.family'].cssValue,themes[2].tokens['font.body.family'].cssValue);
 assert.notEqual(themes[0].tokens['shadow.overlay'].cssValue,themes[2].tokens['shadow.overlay'].cssValue);
});
