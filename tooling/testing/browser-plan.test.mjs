import test from 'node:test';
import assert from 'node:assert/strict';
import { browserReusePlan, verifyResidualSelection } from './browser-plan.mjs';
const alias={id:'a',config:'apps/docs/tests/theme-proof.config.ts'},producer={id:'p',config:'apps/docs/tests/theme-regression.config.ts'};
test('a missing or unproven producer retains the full configuration',()=>{
 assert.equal(browserReusePlan([alias],{},{}).at(0).mode,'execute-full');
 const plan=browserReusePlan([alias,producer],{},{});
 assert.deepEqual(plan.map(item=>item.task.id),['p','a']);
 assert(plan.every(item=>item.mode==='execute-full'));
});
test('residual selection cannot omit, duplicate or add a case',()=>{
 verifyResidualSelection(['two','one'],{selected:[{id:'one'},{id:'two'}]});
 for(const ids of [['one'],['one','one'],['one','two','extra']])assert.throws(()=>verifyResidualSelection(['one','two'],{selected:ids.map(id=>({id}))}),/required selected cases/);
});
