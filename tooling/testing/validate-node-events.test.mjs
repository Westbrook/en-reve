import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNodeEvents} from './validate-node-events.mjs';
const counts={tests:1,passed:1,failed:0,cancelled:0,skipped:0,todo:0,suites:0};
const events=[{type:'test:pass',data:{entryFile:'/fixture/a.test.mjs',file:'/fixture/helper.mjs',testId:1,parentId:0,nesting:0,name:'assertion',details:{type:'test',duration_ms:3}}},{type:'test:summary',data:{file:'/fixture/a.test.mjs',entryFile:'/fixture/a.test.mjs',success:true,counts}},{type:'test:summary',data:{success:true,counts}}];
const validate=value=>validateNodeEvents({events:value,sources:['a.test.mjs'],root:'/fixture'});
test('native case attribution retains imported assertion location and exact entry selection',()=>{
 const receipt=validate(events);assert.equal(receipt.status,'passed');assert.equal(receipt.sources[0].cases[0].source,'helper.mjs');assert.equal(receipt.maximumCaseMs,3);
});
test('passing process cannot hide omitted, duplicated, extra-source or truncated native outcomes',()=>{
 assert.throws(()=>validate(events.slice(1)),/mismatch/);
 assert.throws(()=>validate([events[0],...events]),/Duplicate terminal/);
 assert.throws(()=>validate(events.slice(0,-1)),/aggregate/);
 const extra=structuredClone(events);extra[0].data.entryFile='/fixture/extra.test.mjs';assert.throws(()=>validate(extra),/Unexpected/);
 const summary=structuredClone(events);summary.at(-1).data.counts={...counts,passed:2};assert.throws(()=>validate(summary),/Aggregate/);
});

test('explicit public source selection records omissions and additions without claiming original obligations',()=>{
 const selected=validateNodeEvents({events,sources:['omitted.test.mjs'],root:'/fixture',allowSourceSelection:true});
 assert.deepEqual(selected.unexecutedSources,['omitted.test.mjs']);assert.deepEqual(selected.additionalSources,['a.test.mjs']);
 assert.equal(selected.scope,'caller-selected-sources');assert.equal(selected.status,'passed');
});
