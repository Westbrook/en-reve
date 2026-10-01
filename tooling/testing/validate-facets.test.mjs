import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExecutedFacets } from './validate-facets.mjs';

const selected=[{id:'assertion-a',titlePath:['','chromium','fixture','retains input'],file:'/fixture/test.spec.ts',line:7,expectedStatus:'passed',retries:0,timeout:1000},{id:'unsupported-native',titlePath:['','firefox','fixture','native registry'],file:'/fixture/test.spec.ts',line:19,expectedStatus:'skipped',retries:0,timeout:1000}];
function evidence(){return {
 discovery:{rootDir:'/fixture',workers:3,selected:structuredClone(selected),sourceHashes:{'/fixture/test.spec.ts':'source-v1'}},
 receipt:{kind:'fresh-execution',status:'passed',workers:3,sourceHashes:{'test.spec.ts':'source-v1'},selected:selected.map(row=>({...structuredClone(row),file:'test.spec.ts'})),errors:[],results:selected.map(row=>({id:row.id,status:row.expectedStatus,expectedStatus:row.expectedStatus,retry:0,durationMs:10}))},
};}
test('actual execution retains required assertions and declared unsupported cases',()=>{
 const {discovery,receipt}=evidence();
 assert.deepEqual(validateExecutedFacets(discovery,receipt),{selected:2,passed:1,expectedFailures:0,skipped:1,flaky:0,retries:0,maximumCaseMs:10});
});
test('a passing process cannot hide omitted assertions, altered sources, global failures or retry inflation',()=>{
 for(const alter of [
  r=>r.results.splice(0,1),
  r=>r.selected.splice(0,1),
  r=>r.sourceHashes['test.spec.ts']='changed',
  r=>r.errors.push({message:'seeded beforeAll defect'}),
  r=>r.results.push({...r.results[0],retry:1}),
  r=>r.results.push({...r.results[0]}),
  r=>r.results[0].status='failed',
  r=>r.workers=8,
 ]){const {discovery,receipt}=evidence();alter(receipt);assert.throws(()=>validateExecutedFacets(discovery,receipt));}
});
