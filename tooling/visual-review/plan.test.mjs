import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {readEnvelope,createPlan,defaultCases,comparisonSettings,captureExitCode} from './plan.mjs';
import {EvidenceCache} from '../evidence/cache.ts';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateActions,actionApplies} from './action-contract.mjs';
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

test('file and gesture fixtures are portable inputs without filesystem or script execution',()=>{
 const file={name:'draft.txt',mimeType:'text/plain',base64:'ZHJhZnQ='};
 validateActions([{kind:'files',selector:'input',files:[file]},{kind:'files',selector:'input',files:[]},{kind:'click',selector:'button',modifiers:['Shift']},{kind:'drag',selector:'[role="slider"]',from:{x:0.2,y:0.5},to:{x:0.8,y:0.5},end:'hold'}]);
 for(const bad of [
  {kind:'files',selector:'input',files:['/tmp/secret']},
  {kind:'files',selector:'input',files:[{...file,name:'../secret'}]},
  {kind:'files',selector:'input',files:[{...file,base64:'not base64'}]},
  {kind:'click',selector:'button',modifiers:['Shift','Shift']},
  {kind:'click',selector:'button',modifiers:['Unknown']},
  {kind:'drag',selector:'div',from:{x:NaN,y:0},to:{x:0,y:0}},
  {kind:'drag',selector:'div',from:{x:0,y:0},to:{x:2,y:0}},
  {kind:'drag',selector:'div',from:{x:0,y:0},to:{x:1,y:0},steps:0},
 ])assert.throws(()=>validateActions([bad]));
 const subject={appearances:['light']},fixture=defaultCases(build)[0];
 const a={...fixture,actions:[{kind:'files',selector:'input',files:[file]}]};
 const b={...a,actions:[{kind:'files',selector:'input',files:[{...file,base64:'bmV3'}]}]};
 assert.notEqual(hashValue(createPlan(build,subject,subject,{cases:[a]}).rows[0].fixture),hashValue(createPlan(build,subject,subject,{cases:[b]}).rows[0].fixture));
});

test('responsive actions use explicit inclusive viewport bounds, never swallowed locator failures',()=>{
 const action={kind:'click',selector:'summary',whenViewport:{maxWidth:768}};
 validateActions([action]);
 assert.equal(actionApplies(action,{width:768}),true);
 assert.equal(actionApplies(action,{width:769}),false);
 assert.equal(actionApplies({...action,whenViewport:{minWidth:400,maxWidth:768}},{width:399}),false);
 assert.throws(()=>actionApplies(action,null),/explicit authored viewport/);
 for(const bounds of [{},{width:390},{maxWidth:'768'},{maxWidth:0},{minWidth:800,maxWidth:700},[]])assert.throws(()=>validateActions([{...action,whenViewport:bounds}]),/Viewport/);
 assert.notEqual(hashValue(action),hashValue({...action,whenViewport:{maxWidth:769}}));
});
