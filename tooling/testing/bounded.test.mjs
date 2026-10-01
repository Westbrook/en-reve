import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedMap } from './bounded.mjs';
test('bounded scheduling respects total process budget and returns input order',async()=>{
 let active=0,peak=0;
 const result=await boundedMap([1,2,3,4,5],3,async value=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));active--;return value*2;});
 assert.equal(peak,3);assert.equal(active,0);assert.deepEqual(result,[2,4,6,8,10]);
});
test('failure stops new scheduling and joins all already-owned work',async()=>{
 const called=[],finished=[];
 await assert.rejects(boundedMap([0,1,2,3,4],2,async value=>{called.push(value);if(value===0)throw new Error('seeded');await new Promise(resolve=>setImmediate(resolve));finished.push(value);}),/seeded/);
 assert.deepEqual(called,[0,1]);assert.deepEqual(finished,[1]);
 await assert.rejects(boundedMap([1],4,async()=>{}),/budget/);
});
