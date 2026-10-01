import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateLegacyReaderTestReceipts} from './reader-test-receipts.mjs';
const names = [
 ['groups.spec.js','every measurement column sorts numerically in both directions; missing values stay last'],
 ['groups.spec.js','CSV exports the current comparison order and report remains within a mobile viewport'],
 ['results.spec.js','all columns sort in both directions using the native En Reve table'],
 ['results.spec.js','full report, evidence links, narrow viewport, and progress return'],
 ['results.spec.js','all source rows remain readable without JavaScript'],
];
function fixtures(budget=600000) {
 const specs=['chromium','firefox','webkit'].flatMap(project=>names.map(([file,title],i)=>({id:`${project}-${i}`,file,title,tests:[{projectId:project,timeout:600000,expectedStatus:'passed',status:'expected',results:[{status:'passed',retry:0,duration:100}]}]})));
 const initial={errors:[],stats:{expected:14,unexpected:1,flaky:0,skipped:0,startTime:new Date(2000).toISOString(),duration:budget+1000},suites:[{specs}]};
 const failed=specs.find(s=>s.id==='firefox-0');const focused={errors:[],stats:{expected:1,unexpected:0,flaky:0,skipped:0,startTime:new Date(4000+budget).toISOString(),duration:100},suites:[{specs:[structuredClone(failed)]}]};
 failed.tests[0].timeout=budget;failed.tests[0].status='unexpected';failed.tests[0].results=[{status:'timedOut',retry:0,duration:budget,error:{message:`Test timeout of ${budget}ms exceeded.`}}];
 return {initial,focused};
}
test('retains the complete initial timeout and accepts only the same isolated Firefox case',()=>{
 const {initial,focused}=fixtures();const result=validateLegacyReaderTestReceipts(initial,focused,1000);
 assert.equal(result.status,'complete-after-isolated-recheck');assert.equal(result.attempts,16);assert.equal(result.correction.fromMs,result.correction.toMs);assert.equal(result.initialFailure.result.status,'timedOut');
});
test('retains compatibility with the original documented budget correction',()=>{
 const {initial,focused}=fixtures(360000);assert.equal(validateLegacyReaderTestReceipts(initial,focused,1000).status,'complete-after-timeout-budget-correction');
});
test('rejects assertion failures, missing coverage, wrong case, stale builds and flaky reruns',()=>{
 for(const mutate of [
  x=>{x.initial.suites[0].specs[5].tests[0].results[0].status='failed'},
  x=>{x.initial.suites[0].specs.pop()},
  x=>{x.focused.suites[0].specs[0].tests[0].projectId='chromium'},
  x=>{x.focused.stats.startTime=new Date(1000).toISOString()},
  x=>{x.focused.stats.flaky=1},
  x=>{x.initial.suites[0].specs[5].tests[0].results[0].error.message='Assertion failed'},
 ]) {const x=fixtures();mutate(x);assert.throws(()=>validateLegacyReaderTestReceipts(x.initial,x.focused,1000));}
});

import {validateReaderTestReceipts} from './reader-test-receipts.mjs';
import {sortGroups, sortTitle, coverageDigest} from './sort-coverage.mjs';
function currentReceipt() {
 const required=[...names.slice(1),...sortGroups.map(group=>['groups.spec.js',sortTitle(group),coverageDigest(group)])];
 const specs=['chromium','firefox','webkit'].flatMap(project=>required.map(([file,title,digest],i)=>({id:`${project}-${i}`,file,title,tests:[{projectId:project,annotations:digest?[{type:'sort-coverage-sha256',description:digest}]:[],expectedStatus:'passed',status:'expected',results:[{status:'passed',retry:0}]}]})));
 return {errors:[],stats:{expected:specs.length,unexpected:0,flaky:0,skipped:0,startTime:new Date(2000).toISOString(),duration:100},suites:[{specs}]};
}
test('current protocol rejects missing, duplicated or drifted exact numeric coverage and preserves all other reader cases',()=>{
 const receipt=currentReceipt();assert.equal(validateReaderTestReceipts(receipt,null,1000).uniqueCases,30);
 for(const mutate of [r=>r.suites[0].specs.pop(),r=>r.suites[0].specs.push(r.suites[0].specs[0]),r=>r.suites[0].specs[4].tests[0].annotations[0].description='wrong',r=>r.suites[0].specs[0].tests[0].results[0].status='failed']) {
  const copy=structuredClone(receipt);mutate(copy);assert.throws(()=>validateReaderTestReceipts(copy,null,1000));
 }
 assert.throws(()=>validateReaderTestReceipts(receipt,null,3000));
});
