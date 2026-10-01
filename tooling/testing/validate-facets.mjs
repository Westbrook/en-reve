import { relative } from 'node:path';
import assert from 'node:assert/strict';

/** Reconcile actual execution against its same-run discovery, including skipped cases. */
export function validateExecutedFacets(discovery,receipt) {
 assert.equal(receipt.kind,'fresh-execution');assert.equal(receipt.status,'passed');
 assert.equal(receipt.workers,discovery.workers,'Execution worker count differs from resolved discovery');
 const expected=new Map(discovery.selected.map(test=>[test.id,test]));
 assert.equal(expected.size,discovery.selected.length,'Discovery contains duplicate case identities');
 const actual=new Map(receipt.selected.map(test=>[test.id,test]));
 assert.equal(actual.size,receipt.selected.length,'Execution contains duplicate case identities');
 assert.deepEqual([...actual.keys()].sort(),[...expected.keys()].sort(),'Executed selection differs from discovery');
 for(const [id,test] of expected){
  const executed=actual.get(id);
  for(const key of ['titlePath','line','expectedStatus','retries','timeout'])assert.deepEqual(executed[key],test[key],`${id}: changed ${key}`);
  assert.equal(executed.file,relative(discovery.rootDir,test.file),`${id}: changed assertion source`);
 }
 assert.deepEqual(receipt.sourceHashes,Object.fromEntries(Object.entries(discovery.sourceHashes).map(([file,digest])=>[relative(discovery.rootDir,file),digest])),'Assertion source changed after discovery');
 assert.deepEqual(receipt.errors,[],'Execution has global errors');
 const attempts=new Map();
 for(const result of receipt.results){
  assert(expected.has(result.id),'Result for an undiscovered case: '+result.id);
  const rows=attempts.get(result.id)??[];
  assert(!rows.some(row=>row.retry===result.retry),'Duplicate attempt result: '+result.id);
  rows.push(result);attempts.set(result.id,rows);
 }
 const outcomes={selected:expected.size,passed:0,expectedFailures:0,skipped:0,flaky:0,retries:0,maximumCaseMs:0};
 for(const [id,test] of expected){
  const rows=attempts.get(id);assert(rows?.length,'Selected case has no result: '+id);
  rows.sort((a,b)=>a.retry-b.retry);
  rows.forEach((row,index)=>assert.equal(row.retry,index,'Missing retry attempt: '+id));
  assert(rows.length<=test.retries+1,'Retry budget exceeded: '+id);
  const last=rows.at(-1);
  if(last.status==='skipped')outcomes.skipped++;
  else {assert.equal(last.status,last.expectedStatus,'Unexpected final outcome: '+id);outcomes[last.status==='passed'?'passed':'expectedFailures']++;}
  if(rows.some(row=>row.status!=='skipped'&&row.status!==row.expectedStatus))outcomes.flaky++;
  outcomes.retries+=rows.length-1;
  outcomes.maximumCaseMs=Math.max(outcomes.maximumCaseMs,...rows.map(row=>row.durationMs));
 }
 return outcomes;
}
