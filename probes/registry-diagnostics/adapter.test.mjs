import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,stat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {configuration,claimOutput,ownedRun} from './config.mjs';import {acquireResources} from './locks.mjs';import {qualify} from './qualify.mjs';import {startServer} from './server.mjs';
const fixture=async work=>{const dir=await mkdtemp(join(tmpdir(),'diagnostic-adapter-test-'));try{return await work(dir);}finally{await rm(dir,{recursive:true,force:true});}};
const envFor=dir=>({...process.env,EN_DIAGNOSTICS_OUT:join(dir,'out'),EN_DIAGNOSTICS_BROWSER_LOCK:join(dir,'browser.lock'),EN_DIAGNOSTICS_MACHINE_LOCK:join(dir,'machine.lock')});
const identity=async()=>({commit:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'test',trackedDirty:''});
test('configuration requires explicit output and a valid engine/port selection',()=>{
 assert.throws(()=>configuration({}));assert.throws(()=>configuration({EN_DIAGNOSTICS_OUT:'relative'}));
 for(const port of ['-1','65536','oops'])assert.throws(()=>configuration({EN_DIAGNOSTICS_OUT:'/tmp/unused',EN_DIAGNOSTICS_PORT:port}));
 for(const browsers of ['', 'chrome','chromium,chromium'])assert.throws(()=>configuration({EN_DIAGNOSTICS_OUT:'/tmp/unused',EN_DIAGNOSTICS_BROWSERS:browsers}));
 assert.equal(configuration({EN_DIAGNOSTICS_OUT:'/tmp/unused'}).port,0);
});
test('existing output and symlink collisions preserve sentinel bytes',()=>fixture(async dir=>{
 await mkdir(join(dir,'out'));await writeFile(join(dir,'out','sentinel'),'keep');
 await assert.rejects(claimOutput(configuration(envFor(dir))),{code:'EEXIST'});
 await symlink(join(dir,'out'),join(dir,'alias'));await assert.rejects(claimOutput(configuration({...envFor(dir),EN_DIAGNOSTICS_OUT:join(dir,'alias')})),{code:'EEXIST'});
 assert.equal(await readFile(join(dir,'out','sentinel'),'utf8'),'keep');
}));
test('immutable evidence rejects descendant output through symlink alias',()=>fixture(async dir=>{
 const root=join(dir,'checkout');await mkdir(join(root,'artifacts/scoped-followup-registry-diagnostics'),{recursive:true});
 await symlink(join(root,'artifacts/scoped-followup-registry-diagnostics'),join(dir,'frozen'));
 await writeFile(join(root,'artifacts/scoped-followup-registry-diagnostics/sentinel'),'immutable');
 for(const child of ['new-run','..new-run'])await assert.rejects(claimOutput(configuration({...envFor(dir),EN_DIAGNOSTICS_OUT:join(dir,'frozen',child)},root)),/immutable/);
 const outside=await claimOutput(configuration({...envFor(dir),EN_DIAGNOSTICS_OUT:join(root,'artifacts/current-run')},root));assert.equal(outside.output,join(root,'artifacts/current-run'));
 assert.equal(await readFile(join(root,'artifacts/scoped-followup-registry-diagnostics/sentinel'),'utf8'),'immutable');
}));
test('atomic output ownership allows one concurrent contender and rejects wrong tokens',()=>fixture(async dir=>{
 const config=configuration(envFor(dir));const results=await Promise.allSettled([claimOutput(config),claimOutput(config)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const run=results.find(r=>r.status==='fulfilled').value;
 await assert.rejects(ownedRun({...envFor(dir),EN_DIAGNOSTICS_RUN_ID:'wrong'}),/ownership/);
 assert.equal((await ownedRun({...envFor(dir),EN_DIAGNOSTICS_RUN_ID:run.id})).id,run.id);
}));
test('no stealing stale/live locks; failed second acquisition releases only first owner',()=>fixture(async dir=>{
 const browserPath=join(dir,'browser.lock'),machinePath=join(dir,'machine.lock');await mkdir(machinePath);await writeFile(join(machinePath,'owner.json'),'{}');
 await assert.rejects(acquireResources({browserPath,machinePath}),{code:'EEXIST'});await assert.rejects(stat(browserPath),{code:'ENOENT'});assert.equal(await readFile(join(machinePath,'owner.json'),'utf8'),'{}');
 await rm(machinePath,{recursive:true});await writeFile(browserPath,JSON.stringify({pid:99999999,id:'stale'}));
 await assert.rejects(acquireResources({browserPath,machinePath}),{code:'EEXIST'});assert.equal(JSON.parse(await readFile(browserPath)).id,'stale');
}));
test('inherited owner id+pid validated and never released by child',()=>fixture(async dir=>{
 const paths={browserPath:join(dir,'browser.lock'),machinePath:join(dir,'machine.lock')};const parent=await acquireResources(paths);
 const receipt={browser:{path:parent.browser.path,owner:parent.browser.owner},machine:{path:parent.machine.path,owner:parent.machine.owner}};
 const child=await acquireResources({...paths,parent:receipt});await child.release();assert(await stat(paths.browserPath));
 await assert.rejects(acquireResources({...paths,parent:{...receipt,machine:{...receipt.machine,owner:{...receipt.machine.owner,id:'wrong'}}}}),/identity/);
 await parent.release();await assert.rejects(stat(paths.browserPath),{code:'ENOENT'});
}));
test('resource failure creates failed preflight receipt with skipped dependent steps',()=>fixture(async dir=>{
 const env=envFor(dir);await writeFile(env.EN_DIAGNOSTICS_BROWSER_LOCK,'{"id":"other"}');
 const receipt=await qualify(env,{identity,buildCurrent:()=>{throw Error('must not build');}});
 assert.equal(receipt.exitCode,75);assert.equal(receipt.preflight.category,'resource-lock');assert(receipt.steps.every(s=>s.status==='skipped'));assert.equal(JSON.parse(await readFile(join(dir,'out/receipt.json'))).status,'failed');
 assert.equal(await readFile(env.EN_DIAGNOSTICS_BROWSER_LOCK,'utf8'),'{"id":"other"}');
}));
test('build failure retains error receipt, skips browsers and releases owned locks',()=>fixture(async dir=>{
 const env=envFor(dir);const receipt=await qualify(env,{identity,buildCurrent:async()=>{throw Error('injected build failure');}});
 assert.equal(receipt.exitCode,1);assert.equal(receipt.steps.find(s=>s.name==='build').status,'failed');assert(receipt.error.message.includes('injected build failure'));
 assert.equal(receipt.steps.find(s=>s.name==='conformance').status,'skipped');await assert.rejects(stat(env.EN_DIAGNOSTICS_MACHINE_LOCK),{code:'ENOENT'});
}));
test('missing browser result fails even when child exits zero',()=>fixture(async dir=>{
 const env=envFor(dir);const receipt=await qualify(env,{identity,buildCurrent:async()=>({disabledImportExclusion:true}),runCommand:async()=>({exitCode:0}),serve:async()=>({url:'http://127.0.0.1:1',close:async()=>{}})});
 assert.equal(receipt.exitCode,1);assert.match(receipt.error.message,/missing\/invalid/);assert.equal(receipt.steps.find(s=>s.name==='interactions').status,'skipped');
}));
test('free server ports are distinct; occupied explicit port fails without adoption',()=>fixture(async dir=>{
 await mkdir(join(dir,'site'));await writeFile(join(dir,'site/index.html'),'owned fixture');const a=await startServer({output:dir,runId:'a'}),b=await startServer({output:dir,runId:'b'});
 try{assert.notEqual(a.url,b.url);assert.deepEqual(await fetch(a.url+'/diagnostic-run.json').then(r=>r.json()),{runId:'a'});assert.equal(await fetch(b.url).then(r=>r.text()),'owned fixture');await assert.rejects(startServer({output:dir,port:Number(new URL(a.url).port),runId:'c'}),{code:'EADDRINUSE'});assert.equal((await fetch(a.url+'/diagnostic-run.json').then(r=>r.json())).runId,'a');assert.equal((await fetch(a.url+'/../receipt.json')).status,404);}finally{await a.close();await b.close();}
}));

test('current checkout can claim owned output while an absent historical boundary stays reserved',()=>fixture(async dir=>{
 const root=join(dir,'checkout');await mkdir(join(root,'artifacts'),{recursive:true});
 const run=await claimOutput(configuration(envFor(dir),root));assert.equal(run.output,join(dir,'out'));
 await assert.rejects(stat(join(root,'artifacts/scoped-followup-registry-diagnostics')),{code:'ENOENT'});
 await assert.rejects(claimOutput(configuration({...envFor(dir),EN_DIAGNOSTICS_OUT:join(root,'artifacts/scoped-followup-registry-diagnostics')},root)),/immutable/);
}));
