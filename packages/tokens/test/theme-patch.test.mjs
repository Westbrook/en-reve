import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, createThemePatchPlan, emitThemePatchCSS, emitThemeCSS, createThemePair, emitThemePairCSS, colorFromHex } from '../dist/index.js';
const dim = value => ({value,unit:'rem'});

test('graph patch previews dependent outputs separately from evaluation inputs', () => {
  const base = resolveTheme();
  const plan = createThemePatchPlan(base,{changes:{'rhythm.base':dim(.5)}});
  assert.deepEqual(plan.theme.tokens['space.control-inline'].value,dim(1.5));
  assert.ok(plan.outputTokenIds.includes('space.control-inline-medium'));
  assert.ok(plan.evaluationTokenIds.includes('size.scale-medium'));
  assert.ok(!plan.outputTokenIds.includes('size.scale-medium'));
  assert.ok(!plan.outputTokenIds.some(id => id.startsWith('component.')));
  assert.ok(!plan.outputTokenIds.includes('color.action'));
  assert.ok(Object.isFrozen(plan.outputTokenIds));
  const css = emitThemePatchCSS(plan,base,{selector:'.roomy'});
  assert.match(css,/--en-space-control-inline-medium:/);
  assert.doesNotMatch(css,/color-scheme:|--en-button-radius:|--en-color-action:/);
});

test('inherited literal and alias pins are barriers; local explicit aliases can opt back in', () => {
  for (const pin of [dim(2),'{space.3}']) {
    const base = resolveTheme({pins:{'space.control-inline':pin,'component.button.radius':'{radius.control}'}});
    const before = JSON.stringify(base);
    const plan = createThemePatchPlan(base,{changes:{'rhythm.base':dim(.5)}});
    assert.deepEqual(plan.theme.tokens['space.control-inline'].value,base.tokens['space.control-inline'].value);
    assert.ok(!plan.outputTokenIds.includes('space.control-inline'));
    assert.ok(!plan.outputTokenIds.includes('space.control-inline-medium'));
    assert.ok(plan.preservedPinTokenIds.includes('space.control-inline'));
    assert.equal(JSON.stringify(base),before);
    const local = createThemePatchPlan(base,{changes:{'rhythm.base':dim(.5),'space.control-inline':'{space.3}'}});
    assert.deepEqual(local.theme.tokens['space.control-inline'].value,dim(1.5));
    assert.ok(local.outputTokenIds.includes('space.control-inline-medium'));
  }
});

test('compile-time color recipes are recalculated, without resetting unrelated hooks', () => {
  const base = resolveTheme({pins:{'color.action-pressed':colorFromHex('#123456')}});
  const plan = createThemePatchPlan(base,{changes:{'palette.action':colorFromHex('#9342cb')}});
  assert.notEqual(plan.theme.tokens['color.action-hover'].cssValue,base.tokens['color.action-hover'].cssValue);
  assert.ok(plan.outputTokenIds.includes('color.on-action'));
  assert.ok(!plan.outputTokenIds.includes('color.action-pressed'));
  assert.ok(!plan.outputTokenIds.includes('color.brand'));
  assert.match(emitThemePatchCSS(plan,base),new RegExp('--en-color-action-hover: '+plan.theme.tokens['color.action-hover'].cssValue.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('clear releases both explicit and source-authored optional pins', () => {
  for (const base of [resolveTheme({pins:{'component.button.radius':dim(2)}}),resolveTheme({source:{component:{button:{radius:{$type:'dimension',$value:dim(2)}}}}})]) {
    const plan = createThemePatchPlan(base,{clearOverrides:['--en-button-radius','--en-input-background']});
    assert.equal(plan.theme.tokens['component.button.radius'].provenance,'alias');
    assert.match(emitThemePatchCSS(plan,base),/--en-button-radius: initial;/);
    assert.match(emitThemePatchCSS(plan,base),/--en-input-background: initial;/);
    assert.ok(!plan.outputTokenIds.includes('component.button.radius'));
  }
});

test('exact partials retain their old selection behavior and clearing is opt-in', () => {
  const theme = resolveTheme();
  const partial = emitThemeCSS(theme,{kind:'partial',tokenIds:['rhythm.base']});
  assert.doesNotMatch(partial,/--en-space-/);
  assert.match(emitThemeCSS(theme,{kind:'partial',tokenIds:['component.button.radius']}),/--en-button-radius: var\(/);
  assert.match(emitThemeCSS(theme,{kind:'partial',tokenIds:[],clearOverrides:['--en-button-radius']}),/--en-button-radius: initial;/);
});

test('patch validation rejects stale bases, unknown IDs, invalid values and conflicting or nonoptional clears', () => {
  const base = resolveTheme(); const plan = createThemePatchPlan(base,{changes:{'rhythm.base':dim(.5)}});
  assert.throws(()=>emitThemePatchCSS(plan,resolveTheme({density:'compact'})),{code:'stale-base'});
  assert.throws(()=>createThemePatchPlan(base,{changes:{'made.up':1}}),{code:'unknown-token'});
  assert.throws(()=>createThemePatchPlan(base,{changes:{'rhythm.base':dim(-1)}}));
  for (const name of ['--en-color-action','--en-popover-available-height','--unknown-hook']) {
    assert.throws(()=>createThemePatchPlan(base,{clearOverrides:[name]}),{code:'invalid-clear'});
    assert.throws(()=>emitThemeCSS(base,{kind:'partial',tokenIds:[],clearOverrides:[name]}),{code:'invalid-clear'});
  }
  assert.throws(()=>createThemePatchPlan(base,{changes:{'component.button.radius':dim(1)},clearOverrides:['--en-button-radius']}),{code:'conflicting-clear'});
  assert.throws(()=>emitThemeCSS(base,{kind:'partial',tokenIds:['component.button.radius'],clearOverrides:['--en-button-radius']}),{code:'conflicting-clear'});
  assert.throws(()=>emitThemeCSS(base,{clearOverrides:['--en-button-radius']}),{code:'full-clear'});
});

test('host target and legacy bare :host produce host-aware branches; custom slots are explicit', () => {
  const pair = createThemePair({name:'host',light:resolveTheme(),dark:resolveTheme({mode:'dark'})});
  const css = emitThemePairCSS(pair,{target:'shadow-host'});
  assert.equal(css,emitThemePairCSS(pair,{selector:':host'}));
  assert.match(css,/:where\(:host\(\[data-en-appearance="dark"\]\)\)/);
  assert.throws(()=>emitThemePairCSS(pair,{target:'shadow-host',selector:'.panel'}),{code:'conflicting-target'});
  assert.throws(()=>emitThemeCSS(pair.light,{target:'root',scope:'root'}),{code:'conflicting-target'});
  const slots = emitThemePairCSS(pair,{selector:':host(.panel)',appearanceSelectors:{auto:':host(.panel:not([data-mode]))',light:':host(.panel[data-mode="day"])',dark:':host(.panel[data-mode="night"])'}});
  assert.match(slots,/:host\(\.panel\[data-mode="night"\]\)/);
  assert.throws(()=>emitThemePairCSS(pair,{appearanceSelectors:{auto:'',light:'.a',dark:'.b'}}),{code:'invalid-selector'});
});

test('clearing a hook referenced by a custom graph requires explicit dependency migration', () => {
  const base = resolveTheme({source:{custom:{$type:'dimension',$value:'{component.button.radius}'}}});
  assert.throws(()=>createThemePatchPlan(base,{clearOverrides:['--en-button-radius']}),{code:'clear-dependent'});
  const repaired = createThemePatchPlan(base,{changes:{custom:'{radius.control}'},clearOverrides:['--en-button-radius']});
  assert.ok(repaired.outputTokenIds.includes('custom'));
  assert.match(emitThemeCSS(resolveTheme(),{kind:'partial',tokenIds:[],clearOverrides:['--en-button-radius','--en-button-radius']}),/--en-button-radius: initial;/);
});
