import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {readEnvelope,createPlan,defaultCases,comparisonSettings,captureExitCode} from './plan.mjs';
import {EvidenceCache} from '../evidence/cache.ts';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const source='sha256:'+'a'.repeat(64);
const build={fingerprint:source,pages:[{id:'sheet',path:'/',caseIds:['buttons']},{id:'settings-validation',path:'/workflows/settings?scenario=validation',caseIds:['settings']}]};
function envelope(){const payload={schema:'en-reve/local-theme-review',schemaVersion:1,build,draft:{candidate:{candidateSourceHash:source,theme:{mode:'light'}}}};return {...payload,integrity:hashValue(payload)};}
test('transport integrity and exact build are mandatory before semantic replay',()=>{
 const value=envelope();assert.equal(readEnvelope(JSON.stringify(value),build).sourceHash,source);
 assert.throws(()=>readEnvelope(JSON.stringify({...value,draft:{}}),build),/integrity/);
 assert.throws(()=>readEnvelope(JSON.stringify(value),{...build,fingerprint:'other'}),/different build/);
});
test('required inventory retains unselected cases and both appearances',()=>{
 const single={appearances:['light']},pair={appearances:['light','dark']};const cases=defaultCases(build);
 const plan=createPlan(build,single,pair,{engines:['chromium'],viewports:[{id:'mobile',width:390,height:844}],selected:['buttons:default']});
 assert.equal(plan.rows.length,4);assert.equal(plan.rows.filter(r=>r.selected).length,2);assert(plan.rows.every(r=>r.status==='not-run'));assert.equal(cases[1].page,'settings-validation');
 assert.throws(()=>createPlan(build,single,pair,{selected:['missing']}),/required inventory/);
 assert.throws(()=>createPlan(build,single,pair,{engines:[]}),/engines/);
 assert.throws(()=>createPlan(build,single,pair,{cases:[cases[0],cases[0]]}),/unique/);
});
test('thresholds and declared state actions reject ambiguous inputs',()=>{
 assert.deepEqual(comparisonSettings(),{channelThreshold:0,maxDifferentPixels:0});
 for(const setting of [{channelThreshold:256},{maxDifferentPixels:-1},{unknown:true}])assert.throws(()=>comparisonSettings(setting),/settings/);
 const subject={appearances:['light']};const fixture=defaultCases(build)[0];
 assert.throws(()=>createPlan(build,subject,subject,{cases:[{...fixture,actions:[{kind:'evaluate',selector:'body'}]}]}),/declarative/);
 assert.throws(()=>createPlan(build,subject,subject,{cases:[{...fixture,unsupported:''}]}),/explanation/);
});
test('artifact reads reject corruption independently of an earlier cache lookup',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'en-visual-cache-'));try{const cache=new EvidenceCache(directory);const artifact=await cache.storeArtifact('original',{label:'test',mediaType:'text/plain'});assert.equal(Buffer.from(await cache.readArtifact(artifact)).toString(),'original');await writeFile(join(directory,'blobs',artifact.digest.slice(7)),'changed');await assert.rejects(cache.readArtifact(artifact),/Corrupt/);}finally{await rm(directory,{recursive:true,force:true});}
});

import {CaptureCacheBatch} from './cache-batch.mjs';
test('interrupted batches publish nothing and repeated-image disagreement is retained as failure',async()=>{
 const writes=[];const batch=new CaptureCacheBatch({writeCompleted:async entry=>writes.push(entry)});
 const entry={identity:{kind:'rendering',digest:source},artifacts:[{mediaType:'image/png',digest:'first'}],outcome:'passed',result:{}};
 batch.stage(entry);assert.equal(writes.length,0);
 batch.stage({...entry,artifacts:[{mediaType:'image/png',digest:'different'}]});assert(batch.unstable.has(source));assert.equal(writes.length,0);
 await batch.commit();assert.equal(writes.length,2);assert.equal(writes[1].outcome,'failed');assert.match(writes[1].result.error,/different pixels/);
});

test('fatal end-of-run identity failure fails CLI even when individual captures passed',()=>{
 assert.equal(captureExitCode({status:'failed',results:[{status:'passed'}]}),1);
 assert.equal(captureExitCode({status:'incomplete',results:[{status:'failed'}]}),1);
 assert.equal(captureExitCode({status:'different',results:[{status:'different'}]}),0);
 assert.equal(captureExitCode({status:'incomplete',results:[{status:'not-run'},{status:'unsupported'}]}),0);
});

test('observable state checks and viewport framing are explicit capture inputs',()=>{
 const subject={appearances:['light']},fixture=defaultCases(build)[0];
 const cases=[{...fixture,capture:'viewport',checks:[{kind:'attribute',selector:'button',name:'aria-expanded',value:'true'}]}];
 assert.equal(createPlan(build,subject,subject,{cases}).rows[0].fixture.capture,'viewport');
 for(const bad of [{kind:'evaluate',selector:'button'},{kind:'attribute',selector:'button',value:'true'},{kind:'count',selector:'button',value:-1},{kind:'value',selector:'button',value:3}])assert.throws(()=>createPlan(build,subject,subject,{cases:[{...fixture,checks:[bad]}]}),/check/i);
 assert.throws(()=>createPlan(build,subject,subject,{cases:[{...fixture,capture:'all'}]}),/framing/);
});
