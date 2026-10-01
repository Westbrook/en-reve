import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateReferenceLane,verifyReference} from '../src/registry-reference.mjs';
const base={scenario:'activation',workflow:'settings',mode:'global',policy:'shared',browser:'chromium',profile:'desktop',cache:'cold',count:1,groupSize:2,root:'shadow',delivery:'csr'};
function timing(){
 const jobs=Array.from({length:30},(_,block)=>({...base,block,id:String(block)}));
 const samples=jobs.map(job=>({...job,status:'ok',errors:[],browserVersion:'1',scenarioResult:{after:{metrics:[{stages:{requested:1,rendered:11}}]},action:{input:1,semanticCompletedUpperBound:21}},metrics:{measures:[{name:'registry:module-load',duration:5},{name:'registry:request-to-ready',duration:20}]}}));
 return {manifest:{jobs},samples};
}
test('reference requires full schedule, unique blocks and 30 successful samples per timing cell',()=>{
 const {manifest,samples}=timing();assert.equal(validateReferenceLane(manifest,samples,{kind:'timing',minimum:30}).samples,30);
 assert.throws(()=>validateReferenceLane(manifest,samples.slice(1),{kind:'timing',minimum:30}),/Incomplete/);
 for(const status of ['failed','unsupported'])assert.throws(()=>validateReferenceLane(manifest,samples.map((r,i)=>i? r:{...r,status}),{kind:'timing',minimum:30}),/cannot be frozen/);
 assert.throws(()=>validateReferenceLane(manifest,[...samples.slice(1),samples[1]],{kind:'timing',minimum:30}),/duplicate sample ID/);
 assert.throws(()=>validateReferenceLane(manifest,samples.map((r,i)=>i?r:{...r,browserVersion:'2'}),{kind:'timing',minimum:30}),/version changed/);
});
test('missing timing evidence cannot pass through sample counts alone',()=>{
 const {manifest,samples}=timing();delete samples[0].scenarioResult.after;
 assert.throws(()=>validateReferenceLane(manifest,samples,{kind:'timing',minimum:30}),/invalid timing/);
});
test('retention requires repeated complete checkpoints and successful GC memory measurements',()=>{
 const checkpoints=[0,10,50,100];const jobs=Array.from({length:5},(_,block)=>({...base,scenario:'lifecycle',block,id:String(block)}));
 const samples=jobs.map(job=>({...job,status:'ok',browserVersion:'1',scenarioResult:{samples:checkpoints.map(cycle=>({cycle,state:{rows:[],counters:{updatesAfterDispose:0}},memory:{status:'ok',jsHeapUsedBytes:1000+cycle,dom:{documents:1,nodes:20,jsEventListeners:3}}}))}}));
 const manifest={jobs,checkpoints};assert.equal(validateReferenceLane(manifest,samples,{kind:'retention',minimum:5}).samples,5);
 samples[0].scenarioResult.samples[1].memory.status='unsupported';
 assert.throws(()=>validateReferenceLane(manifest,samples,{kind:'retention',minimum:5}),/retention measurement/);
});
test('frozen integrity check detects modified content and extra files',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'registry-freeze-'));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 try{
  const body=JSON.stringify({status:'frozen',name:'test'});await writeFile(join(directory,'baseline.json'),body);
  const checksums=JSON.stringify({files:[{path:'baseline.json',bytes:Buffer.byteLength(body),sha256:sha(body)}]});
  await writeFile(join(directory,'checksums.json'),checksums);await writeFile(join(directory,'seal.json'),JSON.stringify({checksumsSha256:sha(checksums)}));
  assert.equal((await verifyReference(directory)).status,'verified');
  await writeFile(join(directory,'unexpected'),'extra');await assert.rejects(()=>verifyReference(directory),/inventory differs/);await rm(join(directory,'unexpected'));
  await writeFile(join(directory,'baseline.json'),body+' ');await assert.rejects(()=>verifyReference(directory),/content changed/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
