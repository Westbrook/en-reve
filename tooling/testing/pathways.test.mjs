import test from 'node:test';
import assert from 'node:assert/strict';
import { publicGraph, selectTasks } from './pathways.mjs';
test('named pathway union retains every obligation and executes shared prerequisites once', async()=>{
 const graph=await publicGraph();const union=selectTasks(graph,['api','release','theme']);
 assert.equal(new Set(union.map(task=>task.id)).size,union.length);
 const ids=new Set(union.map(task=>task.id));
 for(const name of ['api','release','theme']) for(const task of selectTasks(graph,[name])) assert(ids.has(task.id));
 assert.equal(union.filter(task=>task.id==='build').length,1);
 assert.equal(union.filter(task=>task.config==='probes/api-contracts/playwright.config.ts').length,1);
 assert.equal(union.filter(task=>task.id.includes('catalogue-group-')).length,3);
 assert.throws(()=>selectTasks(graph,['unknown']),/Unknown pathway/);
 assert.throws(()=>selectTasks({tasks:[{id:'a',dependencies:['a']}],pathways:{a:['a']}},['a']),/cycle/);
 assert.throws(()=>selectTasks({tasks:[],pathways:{a:['missing']}},['a']),/Unknown execution dependency/);
});
