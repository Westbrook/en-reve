import test from 'node:test';
import assert from 'node:assert/strict';
import {runSchedule,serialOrder,schedulePlan} from './schedule.mjs';
const task=(id,kind,dependencies=[],resources)=>({id,kind,dependencies,resources});
test('ready cheap checks and types precede unrelated producers and browsers',()=>{
 const tasks=[task('docs','producer',['package']),task('browser','browser',['docs']),task('package','producer'),task('types','types',['package']),task('pure','node')];
 assert.deepEqual(serialOrder(tasks),['pure','package','types','docs','browser']);
});
test('failure blocks descendants and fail-fast does not start expensive work',async()=>{
 const seen=[];const result=await runSchedule([task('docs','producer'),task('bad','types'),task('child','node',['bad'])],async t=>{seen.push(t.id);throw Error('negative control');});
 assert.deepEqual(seen,['bad']);assert.equal(result.outcomes.child.status,'not-run');assert.equal(result.outcomes.docs.status,'not-run');assert(result.firstFailureMs>=0);
});
test('independent mode retains failure and continues eligible checks',async()=>{
 const r=await runSchedule([task('bad','node'),task('child','node',['bad']),task('ok','node')],async t=>{if(t.id==='bad')throw Error('bad');},{continueIndependent:true});
 assert.equal(r.outcomes.ok.status,'passed');assert.equal(r.outcomes.child.status,'not-run');assert.equal(r.outcomes.bad.status,'failed');
});
test('global slots and resource locks bound concurrent commands; unknown work is exclusive',async()=>{
 let active=0,peak=0;const held=new Set(),seen=[];
 const shared=lock=>({slots:1,exclusive:false,locks:[lock]});
 const tasks=[task('a','node',[],shared('port')),task('b','node',[],shared('port')),task('c','node',[],shared('other')),task('exclusive','node')];
 const r=await runSchedule(tasks,async t=>{assert(!held.has(t.resources?.locks[0]));if(t.resources)held.add(t.resources.locks[0]);else assert.equal(active,0);active++;peak=Math.max(peak,active);seen.push(t.id);await new Promise(r=>setTimeout(r,5));active--;if(t.resources)held.delete(t.resources.locks[0]);});
 assert.equal(peak,2);assert.equal(seen.length,4);assert.equal(r.outcomes.exclusive.status,'passed');
});
test('invalid budgets, missing dependencies, duplicate IDs and cycles fail before execution',()=>{
 for(const tasks of [[task('a','node',['b'])],[task('a','node'),task('a','node')],[task('a','node',['b']),task('b','node',['a'])],[task('a','node',[],{slots:4})]])assert.throws(()=>schedulePlan(tasks));
});
