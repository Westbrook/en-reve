import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, getCustomizationContract, createPropertyRegistrationPlan } from '../dist/index.js';
import { collectThemeCSSDeclarations } from '../dist/css.js';
test('state refinements remain optional inherited typed hooks with full reset and partial inheritance',()=>{
 const theme=resolveTheme();const full=collectThemeCSSDeclarations(theme);const partial=collectThemeCSSDeclarations(theme,{kind:'partial',tokenIds:['color.action']});const plan=createPropertyRegistrationPlan(theme,{mode:'typed'});
 for(const state of ['rest','hover','pressed'])for(const role of ['background','color']){
  const name=`--en-button-${state}-${role}`;const c=getCustomizationContract(theme,name);
  assert.deepEqual(c.states,[state]);assert.equal(c.managed.supported,true);assert.equal(c.reset,'theme');assert.equal(c.size.behavior,'none');assert.deepEqual(c.consumers,['packages/styles/src/internal/button-rules.ts']);assert.deepEqual(c.fallback.cssNames,[`--en-button-${role}`]);
  assert.equal(full.get(name),'initial');assert.equal(partial.has(name),false);
  const registration=plan.registrations.find(r=>r.name===name);assert.equal(registration.syntax,'*');assert.equal(registration.inherits,true);assert.equal(registration.initialValue,undefined);
 }
});
