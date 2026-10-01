import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { context, validate, plan, lab } from '../campaigns/config.mjs';
import { createBundle, verifyBundle, restoreBundle, sourceIncluded, portablePath } from '../campaigns/transfer.mjs';
import { verifyRun } from '../campaigns/report.mjs';
const native=JSON.parse(await readFile(resolve(lab,'campaigns/native.json'))),calendar=JSON.parse(await readFile(resolve(lab,'campaigns/calendar.json')));
test('recipes provide explicit separate suites, qualification, seeded IDs and complete calendar stages',()=>{
 const steps=plan(context('portable-test',native));assert.deepEqual(steps.slice(0,3).map(s=>s.stage),['qualify-chromium','qualify-firefox','qualify-webkit']);assert.equal(new Set(steps.filter(s=>s.run).map(s=>s.run)).size,native.suites.length);
 const lh=steps.find(s=>s.stage==='native-lighthouse');assert.equal(lh.args[lh.args.indexOf('--samples')+1],'5');assert.equal(lh.args[lh.args.indexOf('--caches')+1],'cold');
 assert.deepEqual(plan(context('calendar-test',calendar)).map(s=>s.stage),['build','calibrate','qualify','primary','lighthouse-and-recovery']);assert.equal(context('calendar-test',calendar).variants[2].id,'calendar-test-split');
});
test('invalid selection, accidental options, unsafe identifiers, unsupported calendar matrix fail before work',()=>{
 for(const id of ['../escape','/absolute','', 'a'.repeat(97)])assert.throws(()=>context(id,native));
 for(const change of [{systems:['made-up']},{samples:0},{profiles:['phone']},{suites:['load','load']},{seed:0.5},{sample:1}])assert.throws(()=>validate({...native,...change}));
 assert.throws(()=>validate({...calendar,suites:['load']}));
});
test('run evidence refuses duplicate, mismatched and dateless samples; reports incomplete evidence honestly',()=>{
 const job={id:'1',system:'en-reve',block:0};const sample={...job,status:'ok',startedAt:'2026-09-24T00:00:00Z',finishedAt:'2026-09-24T00:00:01Z'};
 assert.equal(verifyRun({jobs:[job]},[]).missing,1);assert.throws(()=>verifyRun({jobs:[job]},[sample,sample]));assert.throws(()=>verifyRun({jobs:[job]},[{...sample,block:1}]));assert.throws(()=>verifyRun({jobs:[job]},[{...sample,startedAt:null}]));assert.equal(verifyRun({jobs:[job]},[{...sample,status:'failed'}]).failed,1);
});
test('source export includes isolated locks/vendor and new scripts, excludes secrets/runtime/output',()=>{
 for(const p of ['showcases/en-reve/vendor/pkg.tgz','showcases/performance/campaign.mjs','showcases/performance/package-lock.json','tooling/testing/machine-owner.mjs'])assert(sourceIncluded(p),p);
 for(const p of ['.env','showcases/en-reve/.env.local','showcases/performance/.cache/key.pem','showcases/performance/node_modules/pkg/index.js','showcases/en-reve/dist/index.js','../outside','C:/outside'])assert(!sourceIncluded(p),p);
 for(const p of ['a/../b','a\\b','/a','a//b'])assert(!portablePath(p));
});
test('verified transfer round trip relocates binary bytes and modes, refuses overwrite and corruption',async()=>{
 const dir=await mkdtemp(resolve(tmpdir(),'en-perf-transfer-'));
 try{const source=resolve(dir,'source');await mkdir(source);await writeFile(resolve(source,'fixture.bin'),Buffer.from([0,1,128,255]));const bundle=resolve(dir,'bundle');await createBundle(bundle,{sourceRoot:source,paths:['fixture.bin']});await verifyBundle(bundle);const target=resolve(dir,'fresh checkout');await restoreBundle(bundle,target);assert.deepEqual(await readFile(resolve(target,'fixture.bin')),Buffer.from([0,1,128,255]));await assert.rejects(()=>restoreBundle(bundle,target),/EEXIST/);
  const m=JSON.parse(await readFile(resolve(bundle,'manifest.json')));await writeFile(resolve(bundle,m.entries[0].object),'broken');await assert.rejects(()=>verifyBundle(bundle));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('run refuses existing campaign before mutating it',async()=>{
 const {runCampaign}=await import('../campaigns/run.mjs');const dir=await mkdtemp(resolve(tmpdir(),'en-perf-existing-'));const ctx={...context('collision-test',native),directory:dir};try{await assert.rejects(()=>runCampaign(ctx),/Existing output/);assert.deepEqual(await import('node:fs/promises').then(fs=>fs.readdir(dir)),[]);}finally{await rm(dir,{recursive:true,force:true});}
});
test('stage failure records immutable context and stops before acquisition without retrying',async()=>{
 const {runCampaign}=await import('../campaigns/run.mjs');const parent=await mkdtemp(resolve(tmpdir(),'en-perf-failure-'));const id='failure-'+Date.now();const ctx={...context(id,{...native,systems:['en-reve'],suites:['load']}),directory:resolve(parent,'campaign')};let calls=0;
 try{const inventoryPath=resolve(parent,'inventory.json');await writeFile(inventoryPath,JSON.stringify({systems:[{id:'en-reve'}]}));await assert.rejects(()=>runCampaign(ctx,{inventoryPath,executeStage:async()=>{calls++;if(calls===2)throw Error('intentional qualification failure');}}),/intentional qualification failure/);assert.equal(calls,2);const state=JSON.parse(await readFile(resolve(ctx.directory,'state.json')));assert.equal(state.status,'failed');assert.equal(state.stages[0].status,'complete');assert.equal(state.stages.length,2);assert.equal(state.stages[1].status,'failed');assert.match(state.error,/intentional/);assert.equal(JSON.parse(await readFile(resolve(ctx.directory,'campaign.json'))).id,id);
 }finally{await rm(parent,{recursive:true,force:true});}
});
test('restore rejects traversal even with a recomputed manifest checksum before creating destination',async()=>{
 const {createHash}=await import('node:crypto');const dir=await mkdtemp(resolve(tmpdir(),'en-perf-traversal-'));
 try{await writeFile(resolve(dir,'input'),'test');const bundle=resolve(dir,'bundle');await createBundle(bundle,{sourceRoot:dir,paths:['input']});const m=JSON.parse(await readFile(resolve(bundle,'manifest.json')));m.entries[0].path='../escape';const bytes=JSON.stringify(m);await writeFile(resolve(bundle,'manifest.json'),bytes);await writeFile(resolve(bundle,'manifest.sha256'),createHash('sha256').update(bytes).digest('hex'));await assert.rejects(()=>restoreBundle(bundle,resolve(dir,'target')),/Unsafe/);await assert.rejects(()=>readFile(resolve(dir,'escape')),/ENOENT/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('current-source recipe keeps frozen controls and binds every candidate suite to exact qualification',()=>{
 const recipe={...native,kind:'current',systems:['en-reve']},steps=plan(context('current-test',recipe));assert.equal(steps[0].stage,'build-current');for(const suite of native.suites){const nativeStep=steps.find(s=>s.stage==='native-'+suite),current=steps.find(s=>s.stage==='current-'+suite);assert(nativeStep&&current);assert(current.args.includes('--variant'));assert(current.args.includes('current-test-current'));assert(current.args.some(a=>a.endsWith('functional-current-test-qualification-current-test-current.json')));assert(!nativeStep.args.includes('--variant'));}
});
test('Lighthouse candidates require the exact passing Chromium receipt; no fallback for stale receipts',async()=>{
 const {resolveLighthouseVariant}=await import('../src/lighthouse.mjs');const dir=await mkdtemp(resolve(tmpdir(),'en-perf-lh-'));
 try{await mkdir(resolve(dir,'reports'));await writeFile(resolve(dir,'reports/en-reve-experiments.json'),JSON.stringify([{id:'candidate',fingerprint:'correct'}]));const receipt=resolve(dir,'receipt.json');await writeFile(receipt,JSON.stringify({passed:true,engine:'chromium',variantFingerprint:'correct'}));const options={variant:'candidate','functional-receipt':receipt};const result=await resolveLighthouseVariant(options,[{id:'en-reve'}],dir);assert.equal(result.variant.id,'candidate');assert.equal(result.variantQualificationSource.path,receipt);await assert.rejects(()=>resolveLighthouseVariant(options,[{id:'radix-react'}],dir),/require/);await writeFile(receipt,JSON.stringify({passed:true,engine:'chromium',variantFingerprint:'old'}));await assert.rejects(()=>resolveLighthouseVariant(options,[{id:'en-reve'}],dir),/exact variant/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('report reads the bundle schema and separates build sizes from sample dates',async()=>{
 const {campaignReport}=await import('../campaigns/report.mjs');const dir=await mkdtemp(resolve(tmpdir(),'en-perf-report-'));
 try{const records={'campaign.json':{id:'report-test',config:{...native,systems:['en-reve']}},'state.json':{id:'report-test',status:'failed',runs:[]},'inventory.json':{systems:[{id:'en-reve',family:'En Reve',technology:'Web Components',fingerprint:'fixture',assets:[]}]},'profiles-profiles.json':{},'bundles.json':{systems:[{id:'en-reve',totals:{js:{initialBrotli:1024,raw:4096,gzip:2048,brotli:1500}},dynamicImportEdges:[{}]}]}};for(const [name,data] of Object.entries(records))await writeFile(resolve(dir,name),JSON.stringify(data));const result=await campaignReport(dir);const table=result.tables.find(t=>t.title==='Native initial and complete payload');assert(table);assert.equal(table.rows[0][1],'1.0');assert.equal(table.rows[0][2],'4.0');assert.equal(table.rows[0].at(-1),1);assert.equal(table.rows[0][5],'—');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('suite overrides preserve explicit counts, profiles and memory checkpoints',()=>{
 const config={...native,suiteOptions:{memory:{profiles:['desktop'],samples:1,checkpoints:[0,10,50]}}};
 const step=plan(context('suite-test',config)).find(s=>s.stage==='native-memory');
 for(const [flag,value] of [['--profiles','desktop'],['--samples','1'],['--checkpoints','0,10,50']])assert.equal(step.args[step.args.indexOf(flag)+1],value);
 for(const bad of [{memory:{checkpoints:[10,0]}},{load:{checkpoints:[0]}},{memory:{samples:0}},{memory:{profiles:['unknown']}},{memory:{unknown:true}}])assert.throws(()=>validate({...native,suiteOptions:bad}));
});

test('native marker resolves to each peer while real variants remain separate',async()=>{
 const {sampleImplementation}=await import('../campaigns/report.mjs');
 assert.equal(sampleImplementation({system:'web-awesome',variant:'native'}),'web-awesome');
 assert.equal(sampleImplementation({system:'en-reve',variant:'candidate'}),'candidate');
 assert.equal(sampleImplementation({system:'en-reve'}),'en-reve');
});
test('current campaign report attributes recorded native and candidate observations to separate dated rows',async()=>{
 const {campaignReport}=await import('../campaigns/report.mjs');const parent=await mkdtemp(resolve(tmpdir(),'en-perf-cohorts-')),run='cohort-test-'+Date.now(),runDir=resolve(lab,'runs',run);await mkdir(runDir,{recursive:true});
 const sample=(id,variant,lcp)=>({id,variant,system:'en-reve',suite:'load',profile:'mobile',cache:'cold',instrument:true,block:0,status:'ok',startedAt:'2026-10-01T00:00:00Z',finishedAt:'2026-10-01T00:00:01Z',metrics:{lcp}});
 const samples=[sample('1','native',500),sample('2','candidate',400)];
 try{
  const records={'campaign.json':{id:run,config:{...native,kind:'current',systems:['en-reve']}},'state.json':{id:run,status:'complete',runs:[run]},'inventory.json':{systems:[{id:'en-reve',family:'En Reve',technology:'Web Components',assets:[]}]},'builds.json':{variants:[{id:'candidate',label:'Current source',assets:[]}]},'profiles-profiles.json':{}};
  for(const [name,data]of Object.entries(records))await writeFile(resolve(parent,name),JSON.stringify(data));await writeFile(resolve(runDir,'manifest.json'),JSON.stringify({jobs:samples}));await writeFile(resolve(runDir,'samples.jsonl'),samples.map(JSON.stringify).join('\n')+'\n');
  const report=await campaignReport(parent),table=report.tables.find(t=>t.title==='load · loading · mobile · cold · none · instrumented');assert.deepEqual(table.rows.map(r=>r[3]),[1,1]);assert.deepEqual(table.rows.map(r=>r[table.headers.indexOf('LCP ms')]),['500.0','400.0']);assert(report.tables.find(t=>t.title==='Current minus frozen control').rows.some(r=>r[8]==='-100.00'));
 }finally{await rm(parent,{recursive:true,force:true});await rm(runDir,{recursive:true,force:true});}
});

test('source receipts support restored portable sources without a Git checkout',async()=>{
 const {captureSource}=await import('../campaigns/run.mjs');const dir=await mkdtemp(resolve(tmpdir(),'en-perf-source-'));try{assert.equal((await captureSource(dir)).gitAvailable,false);}finally{await rm(dir,{recursive:true,force:true});}
});

test('calendar policies can select an immutable completed current-source campaign without changing the default frozen recipe',()=>{
 const currentCalendar={...calendar,referenceCampaign:'main-example-20261001-v1'};assert.equal(context('calendar-current-test',currentCalendar).config.referenceCampaign,currentCalendar.referenceCampaign);
 assert.throws(()=>validate({...native,referenceCampaign:'current'}));assert.throws(()=>validate({...calendar,referenceCampaign:'../escape'}));assert.equal(context('calendar-frozen-test',calendar).config.referenceCampaign,undefined);
});

 test('dated historical Lighthouse samples remain reportable without a finish timestamp',()=>{
  const job={id:'1',system:'en-reve',profile:'mobile',cache:'cold',block:0};
  const sample={...job,suite:'lighthouse',status:'ok',startedAt:'2026-10-01T12:00:00Z'};
  assert.equal(verifyRun({jobs:[job]},[sample]).successful,1);
  assert.throws(()=>verifyRun({jobs:[job]},[{...sample,startedAt:null}]),/Missing sample date/);
  assert.throws(()=>verifyRun({jobs:[job]},[{...sample,suite:'load'}]),/Missing sample date/);
 });
