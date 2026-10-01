import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, emitThemeCSS, managedEditors, getCustomizationContract, createReviewDraft, reopenReviewDraft, validateManagedValue, createThemePatchPlan, emitThemePatchCSS } from '../dist/index.js';
import { authoringBaseline } from '../../../apps/docs/src/theme-authoring-baseline.ts';
const ids = ['control.radius','control.inline-padding','control.min-size','control.background','control.color','control.border-color','button.border-color','surface.radius','surface.padding','surface.background','surface.color','surface.border-color'].map(id=>`component.${id}`);
const metadata = {title:'Authoring review',rationale:'Verify portable typed authoring with optional managed hooks.'};

test('promoted hooks retain connected registry contracts and unpinned fallback behavior in every context', () => {
  for (const mode of ['light','dark']) for (const density of ['compact','comfortable','spacious']) {
    const theme = resolveTheme({mode,density}); const css = emitThemeCSS(theme); const editors = managedEditors(theme);
    for (const id of ids) {
      const token = theme.tokens[id], record = getCustomizationContract(theme,token.cssName);
      assert.equal(record.consumerStatus,'connected'); assert.equal(record.managed.supported,true);
      assert.equal(record.reset,'theme'); assert.equal(record.registration.typed.eligible,false);
      assert.equal(token.provenance,'alias'); assert.equal(record.tokenDefault.fullThemeValue,'initial');
      assert.ok(css.includes(`${token.cssName}: initial;`)); assert.equal(editors[id].cssName,token.cssName);
      assert.equal(record.registration.initialValue,undefined);
    }
  }
});

test('new managed pins export, reopen, restore and preserve unrelated partial inheritance', () => {
  const draft = createReviewDraft();
  for (const id of ids) {
    const token = draft.theme.tokens[id];
    draft.setToken(id,token.type === 'color' ? {colorSpace:'srgb',components:[.2,.3,.4]} : draft.editor(id).choices[1]);
  }
  const reopened = reopenReviewDraft(draft.exportJSON(metadata));
  assert.equal(reopened.theme.sourceHash,draft.theme.sourceHash);
  const partial = emitThemeCSS(reopened.theme,{kind:'partial',tokenIds:['component.control.radius']});
  assert.ok(partial.includes('--en-control-radius:')); assert.ok(!partial.includes('--en-surface-radius:'));
  for (const id of ids) { assert.equal(reopened.canRestore(id),true); reopened.restoreToken(id); }
  assert.equal(reopened.theme.sourceHash,resolveTheme().sourceHash);
});

test('code-authored fonts, exceptional weights and layered shadows survive managed review without expanding its menu', () => {
  const draft = createReviewDraft(authoringBaseline);
  assert.throws(()=>validateManagedValue(resolveTheme(),'shadow.overlay',authoringBaseline.pins['shadow.overlay']),{code:'managed-choice'});
  assert.throws(()=>validateManagedValue(resolveTheme(),'font.ui.weight',450),{code:'managed-choice'});
  draft.setToken('component.control.radius',{value:12,unit:'px'});
  const other = draft.editor('shadow.overlay').choices.find(value=>!Array.isArray(value));
  draft.setToken('shadow.overlay',other); draft.undo();
  const reopened = reopenReviewDraft(draft.exportJSON(metadata),{baseOptions:authoringBaseline});
  for (const id of ['font.ui.family','font.ui.weight','shadow.overlay']) assert.deepEqual(reopened.theme.tokens[id].value,authoringBaseline.pins[id]);
  assert.equal(reopened.theme.sourceHash,draft.theme.sourceHash);
  assert.equal(reopened.editor('shadow.overlay').choices.some(Array.isArray),true);
});

test('broader authoring does not weaken typed schema or finite managed validation', () => {
  assert.throws(()=>resolveTheme({pins:{'component.control.radius':'clamp(4px, 1vw, 12px)'}}),{code:'invalid-value'});
  assert.throws(()=>resolveTheme({pins:{'component.surface.background':{colorSpace:'display-p3',components:[1,0,0]}}}),{code:'invalid-value'});
  assert.throws(()=>validateManagedValue(resolveTheme(),'component.control.radius',{value:13,unit:'px'}),{code:'managed-choice'});
  assert.equal(resolveTheme({pins:{'component.control.radius':{value:13,unit:'px'}}}).tokens['component.control.radius'].cssValue,'13px');
});


test('THEME-04 patch clears promoted hooks and preserves independent pins without activating optional dependents', () => {
  const base = resolveTheme({pins:{'component.control.radius':{value:24,unit:'px'},'component.surface.padding':{value:32,unit:'px'}}});
  const plan = createThemePatchPlan(base,{changes:{'rhythm.base':{value:.5,unit:'rem'}},clearOverrides:['--en-control-radius']});
  const css = emitThemePatchCSS(plan,base,{selector:'.region'});
  assert.ok(css.includes('--en-control-radius: initial;'));
  assert.ok(!plan.outputTokenIds.includes('component.control.inline-padding'));
  assert.ok(!plan.outputTokenIds.includes('component.surface.padding'));
  assert.ok(plan.preservedPinTokenIds.includes('component.surface.padding'));
  assert.deepEqual(plan.theme.tokens['component.surface.padding'].value,{value:32,unit:'px'});
  assert.ok(!css.includes('--en-button-hover-background:'));
});
