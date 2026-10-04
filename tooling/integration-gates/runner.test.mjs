import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runStages,aggregate,outcome,playwrightSummary,acquireLock,hash,filesBelow} from './runner.mjs';
import {selection,catalog,groups} from './catalog.mjs';
import {resolve} from 'node:path';
const identity=async()=>({commit:'a'.repeat(40),tree:'b'.repeat(40),sha256:'source',files:[]});
const stage=(id,code=0,deps=[])=>({id,required:true,deps,command:['node','-e',`process.exit(${code})`]});
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'en-gate-test-'));try{await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
const run=(root,stages,extra={})=>runStages({root,output:join(root,'out'),stages,identity,lockPath:join(root,'lock'),...extra});
test('pass receipt keeps exact command, source binding and log hash',()=>fixture(async root=>{const r=await run(root,[stage('ok')]);assert.equal(r.exitCode,0);assert.equal(r.stages[0].status,'passed');assert.equal(r.stages[0].logSha256,hash(''));assert.deepEqual(JSON.parse(await readFile(join(root,'out/receipt.json'))).source,await identity());}));
test('failure preserves nonzero code and dependent required stage cannot disappear',()=>fixture(async root=>{const r=await run(root,[stage('bad',23),stage('dependent',0,['bad']),stage('independent')]);assert.equal(r.exitCode,23);assert.equal(r.stages[1].status,'skipped');assert.equal(r.stages[2].status,'passed');assert.equal(r.stages[0].failure.category,'unclassified');}));
test('explicit required skip fails aggregate',()=>fixture(async root=>{const r=await run(root,[{...stage('omit'),requestedSkip:true}]);assert.equal(r.exitCode,2);assert.equal(r.stages[0].status,'skipped');}));
test('missing executable is evidenced environment failure',()=>fixture(async root=>{const r=await run(root,[{...stage('missing'),command:['en-nonexistent-gate-command']}]);assert.equal(r.stages[0].failure.category,'environment');assert.notEqual(r.exitCode,0);}));
test('all-skipped browser suite is unsupported; partial skips remain visible',()=>{const empty={cases:[{status:'skipped'}]};assert.equal(outcome({exitCode:0},empty).status,'unsupported');assert.equal(aggregate([{required:true,status:'unsupported'}]),2);const summary=playwrightSummary({suites:[{specs:[{title:'native',tests:[{projectName:'firefox',status:'skipped',annotations:[{type:'skip',description:'native registry unavailable'}],results:[]}]}]}]});assert.equal(summary.cases[0].annotations[0].description,'native registry unavailable');});
test('missing required browser JSON fails successful child command',()=>fixture(async root=>{const r=await run(root,[{...stage('browser'),config:'fixture.ts'}]);assert.equal(r.stages[0].failure.category,'harness');assert.notEqual(r.exitCode,0);}));
test('concurrent contender cannot run or remove owner lock',()=>fixture(async root=>{let resume,started;const ready=new Promise(r=>started=r),hold=new Promise(r=>resume=r);const first=run(root,[stage('hold')],{executeCommand:async(_cmd,opts)=>{started();await hold;await writeFile(opts.log,'');return {exitCode:0};}});await ready;const contender=await runStages({root,output:join(root,'other'),stages:[stage('never')],identity,lockPath:join(root,'lock')});assert.equal(contender.exitCode,75);assert.equal(contender.stages[0].status,'skipped');assert.ok(JSON.parse(await readFile(join(root,'lock/owner.json'))).id);resume();assert.equal((await first).exitCode,0);const next=await runStages({root,output:join(root,'next'),stages:[stage('now')],identity,lockPath:join(root,'lock')});assert.equal(next.exitCode,0);}));
test('source mutation prevents success',()=>fixture(async root=>{let n=0;const r=await run(root,[stage('ok')],{identity:async()=>({...await identity(),sha256:String(n++)})});assert.equal(r.sourceStability.status,'failed');assert.notEqual(r.exitCode,0);}));
test('selection includes dependencies and marks exclusions; unknown stage rejected',()=>{const stages=[stage('build'),stage('a',0,['build']),stage('b')];const selected=selection(stages,{only:['a']});assert.equal(selected[0].required,true);assert.equal(selected[2].required,false);assert.throws(()=>selection(stages,{only:['typo']}));});
test('explicit theme qualification retains complete component presentation owners',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 const selected=selection(stages,{only:['theme']});
 for(const [id,name] of [['theme-slider','slider'],['theme-rating','rating'],['theme-accordion','accordion'],['patterns','patterns']]){
 const owner=selected.find(stage=>stage.id===id);
 assert.equal(owner.required,true);
 assert.equal(owner.config,`packages/elements/src/${name}/tests/playwright.config.ts`);
 assert.deepEqual(owner.command,stages.find(stage=>stage.id===id).command);
 }
 const composition=selected.find(stage=>stage.id==='theme-docs-composition');
 assert.equal(composition.required,true);
 assert.equal(composition.config,'apps/docs/tests/theme-composition.config.ts');
 assert.deepEqual(composition.command,stages.find(stage=>stage.id==='theme-docs-composition').command);
 assert.equal(selected.find(stage=>stage.id==='capabilities').required,true);
});
test('artifact hashes and paths reproduce in two clean directories',()=>fixture(async root=>{for(const name of ['first','different-path']){await mkdir(join(root,name));await writeFile(join(root,name,'asset.js'),'export const value=1;\n');}assert.deepEqual(await filesBelow(join(root,'first'),join(root,'first')),await filesBelow(join(root,'different-path'),join(root,'different-path')));}));
test('preexisting output is refused without mutation',()=>fixture(async root=>{await mkdir(join(root,'out'));await writeFile(join(root,'out/keep'),'owned elsewhere');await assert.rejects(run(root,[stage('ok')]));assert.equal(await readFile(join(root,'out/keep'),'utf8'),'owned elsewhere');}));

test('every browser selection records capability versions and release retains API freshness',()=>{const stages=catalog(resolve(import.meta.dirname,'../..'));for(const stage of stages.filter(s=>s.config)){const selected=selection(stages,{only:[stage.id]});assert.equal(selected.find(s=>s.id==='capabilities').required,true);assert.ok(selected.findIndex(s=>s.id==='capabilities')<selected.findIndex(s=>s.id===stage.id));}assert.ok(groups.release.includes('metadata-api'));});
test('smoke selects affected harness and CSS states; unknown paths widen',()=>{const stages=catalog(resolve(import.meta.dirname,'../..'));const select=path=>selection(stages,{changed:[path]}).filter(s=>s.required).map(s=>s.id);assert.ok(select('probes/activation-registry/server.mjs').includes('activation-library'));assert.ok(!select('probes/activation-registry/server.mjs').includes('theme-states'));assert.ok(select('packages/styles/src/controls.ts').includes('theme-states'));assert.ok(select('packages/styles/src/controls.ts').includes('geometry'));assert.ok(select('unknown').includes('hydration'));});
test('portable bundle preserves failure and verifies raw hashes while excluding temporary caches',()=>fixture(async root=>{
 const r=await run(root,[stage('bad',19)]);const {execute}=await import('./runner.mjs');
 const command=['node',resolve(import.meta.dirname,'bundle.mjs'),join(root,'out'),join(root,'bundle')];
 const result=await execute(command,{cwd:root,env:process.env,log:join(root,'export.log')});assert.equal(result.exitCode,0);
 const exported=JSON.parse(await readFile(join(root,'bundle/receipt.json')));assert.equal(exported.exitCode,19);assert.equal(exported.stages[0].status,'failed');
 assert.equal(exported.portableExport.sha256,hash(await readFile(join(root,'out/receipt.json'))));assert.equal(hash(await readFile(join(root,'bundle/bad/command.log'))),r.stages[0].logSha256);
 await writeFile(join(root,'out/bad/command.log'),'tampered');const invalid=await execute(['node',resolve(import.meta.dirname,'bundle.mjs'),join(root,'out'),join(root,'invalid')],{cwd:root,env:process.env,log:join(root,'invalid.log')});assert.notEqual(invalid.exitCode,0);
}));

test('canonical and machine locks fail closed even for stale owners',()=>fixture(async root=>{
 const {acquireResources}=await import('./resources.mjs');const paths={browser:join(root,'canonical.lock'),machine:join(root,'machine.lock')};
 await writeFile(paths.browser,JSON.stringify({id:'stale',pid:99999999}));
 await assert.rejects(acquireResources(root,{env:{},paths}),{code:'EEXIST'});
 assert.equal(JSON.parse(await readFile(paths.browser)).id,'stale');
}));
test('nested adapters validate owners and cannot release parent resources',()=>fixture(async root=>{
 const {acquireResources}=await import('./resources.mjs');const paths={browser:join(root,'canonical.lock'),machine:join(root,'machine.lock')};
 const parent=await acquireResources(root,{env:{},paths});
 try{const nested=await acquireResources(root,{env:parent.env,paths});assert.equal(nested.inherited,true);await nested.release();assert.ok(await readFile(paths.browser));
 await assert.rejects(acquireResources(root,{env:{...parent.env,EN_GATE_MACHINE_OWNER:JSON.stringify({id:'foreign',pid:process.pid})},paths}),/mismatch/);
 }finally{await parent.release();}
 const next=await acquireResources(root,{env:{},paths});await next.release();
}));
test('failed machine acquisition releases only newly owned canonical file',()=>fixture(async root=>{
 const {acquireResources}=await import('./resources.mjs');const paths={browser:join(root,'canonical.lock'),machine:join(root,'machine.lock')};
 const release=await acquireLock(paths.machine,{id:'other',pid:process.pid});
 await assert.rejects(acquireResources(root,{env:{},paths}),{code:'EEXIST'});
 await assert.rejects(readFile(paths.browser),{code:'ENOENT'});assert.equal(JSON.parse(await readFile(join(paths.machine,'owner.json'))).id,'other');await release();
}));

test('maintained manual-fixture scripts are source inputs; generated evidence and archives are excluded',async()=>{const {sourcePath}=await import('./runner.mjs');assert.equal(sourcePath('artifacts/scoped-followup-date-input-coverage/build.mjs'),true);assert.equal(sourcePath('artifacts/scoped-followup-date-input-coverage/instrument.js'),true);assert.equal(sourcePath('artifacts/scoped-followup-date-input-coverage/site/eager/assets/main.js'),false);assert.equal(sourcePath('showcases/performance/baselines/scoped-registry-phase-6-v2/source/test.mjs'),false);});
test('adapter receipt must exist, match the qualified commit, and contain every passed stage',()=>fixture(async root=>{
 const {validateReceipt}=await import('./runner.mjs');const spec={path:'adapter.json',equals:{status:'passed'},commitFields:['source.commit'],steps:{field:'steps',name:'name',status:'status',passed:'passed',required:['prepare','browser']}};
 await assert.rejects(validateReceipt(root,spec,'exact'),{code:'ENOENT'});
 const data={status:'passed',source:{commit:'exact'},steps:[{name:'prepare',status:'passed'},{name:'browser',status:'passed'}]};await writeFile(join(root,'adapter.json'),JSON.stringify(data));assert.equal((await validateReceipt(root,spec,'exact')).status,'verified');
 await assert.rejects(validateReceipt(root,spec,'different'),/qualified commit/);data.steps.pop();await writeFile(join(root,'adapter.json'),JSON.stringify(data));await assert.rejects(validateReceipt(root,spec,'exact'),/missing\/duplicate/);
 data.steps.push({name:'browser',status:'skipped'});await writeFile(join(root,'adapter.json'),JSON.stringify(data));await assert.rejects(validateReceipt(root,spec,'exact'),/did not pass/);
}));

test('owner adapters are required in exact integration and selected by their relevant changes',()=>{const stages=catalog(resolve(import.meta.dirname,'../..'));const all=selection(stages,{mode:'integration'});for(const id of ['diagnostics','consumer-contracts','date-fixtures','date-fixtures-unit'])assert.equal(all.find(s=>s.id===id).required,true);for(const [path,id]of [['probes/registry-diagnostics/qualify.mjs','diagnostics'],['probes/consumer-contracts/server.mjs','consumer-contracts'],['packages/elements/SCOPED-REGISTRIES.md','consumer-contracts'],['artifacts/scoped-followup-date-input-coverage/consolidation/run.mjs','date-fixtures']])assert.equal(selection(stages,{changed:[path]}).find(s=>s.id===id).required,true);});
test('empty or missing required evidence counts cannot pass',()=>fixture(async root=>{const {validateReceipt}=await import('./runner.mjs');const spec={path:'counts.json',positiveFields:['checks']};for(const checks of [undefined,0,-1,'5']){await writeFile(join(root,'counts.json'),JSON.stringify({checks}));await assert.rejects(validateReceipt(root,spec,'exact'),/positive count/);}await writeFile(join(root,'counts.json'),JSON.stringify({checks:5}));assert.equal((await validateReceipt(root,spec,'exact')).status,'verified');}));

test('exact commit and cleanliness are revalidated after acquiring resources',()=>fixture(async root=>{for(const [index,state]of [{commit:'different',worktreeStatus:''},{commit:'exact',worktreeStatus:' M file'}].entries()){const result=await run(root,[stage('never')],{output:join(root,'out'+index),metadata:{exactCommit:'exact'},identity:async()=>({...await identity(),...state}),executeCommand:async()=>{throw Error('must not launch');}});assert.equal(result.exitCode,1);assert.equal(result.preflight.reason,'Acquired source is not the requested clean exact commit');assert.equal(result.stages[0].status,'skipped');}}));

test('automatic workflow smoke uses escaped existing file filters; explicit and integration stay complete',()=>{const stages=catalog(resolve(import.meta.dirname,'../..'));const workflow=options=>selection(stages,options).find(s=>s.id==='workflows');const focused=workflow({changed:['apps/docs/tests/time-field.spec.ts']});assert.equal(focused.workflowSelection.kind,'focused');assert.deepEqual(focused.workflowSelection.files,['settings-scenarios.spec.ts','time-field.spec.ts','workflows.spec.ts']);for(const [i,file]of focused.workflowSelection.files.entries()){const regex=new RegExp(focused.workflowSelection.filters[i]);assert(regex.test('/checkout/apps/docs/tests/'+file));assert(!regex.test('/checkout/apps/docs/tests/'+file.replaceAll('.','X')));}for(const options of [{mode:'integration'},{only:['workflows']}]){const full=workflow(options);assert.equal(full.workflowSelection,undefined);assert.deepEqual(full.command,stages.find(s=>s.id==='workflows').command);}});
test('shared workflow changes and deleted tests widen; unowned tests cannot silently pass smoke',()=>{const stages=catalog(resolve(import.meta.dirname,'../..'));for(const path of ['apps/docs/tests/playwright.config.ts','apps/docs/tests/static-server.mjs','apps/docs/tests/workflow-readiness.ts','apps/docs/tests/selection.spec.ts'])assert.equal(selection(stages,{changed:[path]}).find(s=>s.id==='workflows').workflowSelection.kind,'full');const deleted=stages.map(s=>s.id==='workflows'?{...s,smoke:{...s.smoke,existing:s.smoke.existing.filter(n=>n!=='time-field.spec.ts')}}:s);assert.equal(selection(deleted,{changed:['apps/docs/tests/time-field.spec.ts']}).find(s=>s.id==='workflows').workflowSelection.kind,'full');assert.throws(()=>selection(stages,{changed:['apps/docs/tests/showcase.mobile.spec.ts']}),/No automatic smoke owner/);const theme=selection(stages,{changed:['apps/docs/tests/theme-proof.spec.ts']});assert.equal(theme.find(s=>s.id==='theme-docs').required,true);assert.equal(theme.find(s=>s.id==='workflows').required,false);});
test('diagnostics parent configuration reaches only its adapter, never isolated unit fixtures',()=>fixture(async root=>{const seen={};const r=await run(root,[stage('diagnostics-unit'),stage('diagnostics')],{env:{EN_DIAGNOSTICS_PARENT_LOCKS:'foreign',EN_DIAGNOSTICS_EXPECT_COMMIT:'foreign',EN_DIAGNOSTICS_OUT:'/not-owned'},executeCommand:async(_command,options)=>{seen[Object.keys(seen).length?'diagnostics':'unit']=options.env;await writeFile(options.log,'');return {exitCode:0};}});assert.equal(r.exitCode,0);assert.equal(Object.keys(seen.unit).some(k=>k.startsWith('EN_DIAGNOSTICS_')),false);assert.equal(seen.diagnostics.EN_DIAGNOSTICS_EXPECT_COMMIT,'a'.repeat(40));assert.equal(seen.diagnostics.EN_DIAGNOSTICS_OUT,join(root,'out/diagnostics/evidence'));assert.equal(seen.diagnostics.EN_DIAGNOSTICS_PARENT_LOCKS,undefined);}));


test('scope port override is explicit, bounded and loopback-only',async()=>{
 const {scopeEndpoint}=await import('../../probes/scoped-registry/port.mjs');
 assert.deepEqual(scopeEndpoint({}),{host:'127.0.0.1',port:4198,origin:'http://127.0.0.1:4198'});
 for(const value of ['1','46198','65535'])assert.deepEqual(scopeEndpoint({EN_SCOPE_PORT:value}),{host:'127.0.0.1',port:Number(value),origin:`http://127.0.0.1:${value}`});
 for(const value of ['', '0','65536','-1','4198.0','1e4','04198',' 4198','4198 ','4198/path','http://localhost:4198',4198])assert.throws(()=>scopeEndpoint({EN_SCOPE_PORT:value}),/EN_SCOPE_PORT must be a decimal integer from 1 to 65535/);
});
test('scope config records the same explicit endpoint for browser and readiness routing',()=>fixture(async directory=>{
 const {execute}=await import('./runner.mjs');
 const root=resolve(import.meta.dirname,'../..');
 const code="import {writeFileSync} from 'node:fs';const {default:c}=await import('./probes/scoped-registry/playwright.config.ts');const servers=Array.isArray(c.webServer)?c.webServer:[c.webServer];writeFileSync(process.argv[1],JSON.stringify({baseURL:c.use.baseURL,servers:servers.map(s=>({command:s.command,url:s.url,reuse:s.reuseExistingServer})),metadata:c.metadata}));";
 for(const value of [undefined,'46198']){
  const env={...process.env};delete env.EN_SCOPE_PORT;if(value!==undefined)env.EN_SCOPE_PORT=value;
  const log=join(directory,`config-${value??'default'}.log`);
  const data=join(directory,`config-${value??'default'}.json`);
  const result=await execute([process.execPath,'--input-type=module','-e',code,data],{cwd:root,env,log});assert.equal(result.exitCode,0);
  const port=Number(value??4198),origin=`http://127.0.0.1:${port}`;
  const config=JSON.parse(await readFile(data,'utf8'));assert.equal(config.servers.length,1,'scope config must manage exactly one server');
  assert.deepEqual(config,{baseURL:origin,servers:[{command:'node probes/scoped-registry/server.mjs',url:`${origin}/probes/scoped-registry/`,reuse:false}],metadata:{scopeServer:{host:'127.0.0.1',port,origin}}});
 }
}));
test('scope server fails on an occupied explicit port without adopting or stopping its owner',async()=>{
 const {createServer}=await import('node:net');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 const owner=createServer(socket=>socket.end());await new Promise((ready,reject)=>{owner.once('error',reject);owner.listen(0,'127.0.0.1',ready);});
 try{
  const port=owner.address().port;
  await assert.rejects(promisify(execFile)(process.execPath,['probes/scoped-registry/server.mjs'],{cwd:resolve(import.meta.dirname,'../..'),env:{...process.env,EN_SCOPE_PORT:String(port)},timeout:10000}),error=>{
   assert.equal(error.code,1);assert.match(error.stderr,new RegExp(`Port ${port} is already in use`));return true;
  });
  assert.equal(owner.listening,true);assert.equal(owner.address().port,port);
 }finally{await new Promise((done,reject)=>owner.close(error=>error?reject(error):done()));}
});

test('receipt includes the served root distribution and package assets with path-independent hashes',()=>fixture(async root=>{
 const inventories=[];
 for(const name of ['checkout-a','different-checkout-b']){
  const checkout=join(root,name);await mkdir(checkout);
  const inputs=[['dist/assets/app.js','export const page=1;\n'],['packages/styles/dist/index.js','export const style=1;\n'],['apps/docs/dist/legacy.js','export const legacy=1;\n']];
  for(const [path,content]of inputs){await mkdir(join(checkout,path,'..'),{recursive:true});await writeFile(join(checkout,path),content);}
  const receipt=await run(checkout,[stage('ok')]);assert.equal(receipt.exitCode,0);
  assert.equal(receipt.builtAssets.length,inputs.length);
  for(const [path,content]of inputs)assert.deepEqual(receipt.builtAssets.find(([p])=>p===path),[path,hash(content)]);
  inventories.push(receipt.builtAssets);
 }
 assert.deepEqual(inventories[0],inventories[1]);
}));

test('virtualization owns all four Node regressions and the complete built browser probe',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 const unit=stages.find(s=>s.id==='virtual-collection-unit'),browser=stages.find(s=>s.id==='document-scroll');
 assert.deepEqual(unit.command,['node','--test','packages/primitives/tests/virtual-collection.test.mjs','packages/primitives/tests/virtual-rendering.test.mjs','packages/primitives/tests/collection-contract.test.mjs','packages/primitives/tests/table.test.mjs']);
 assert.deepEqual(unit.deps,['build']);
 assert.equal(browser.config,'probes/document-scroll/playwright.config.ts');
 assert.deepEqual(browser.deps,['capabilities','virtual-collection-unit']);
 assert.deepEqual(browser.command,['node','node_modules/@playwright/test/cli.js','test','--config','tooling/integration-gates/playwright.config.ts']);
 assert.deepEqual(groups.virtualization,['virtual-collection-unit','document-scroll']);
 const selected=selection(stages,{only:['virtualization']});
 assert.deepEqual(selected.filter(s=>s.required).map(s=>s.id),['build','capabilities','virtual-collection-unit','document-scroll']);
 for(const id of groups.virtualization)assert.equal(selection(stages,{mode:'integration'}).find(s=>s.id===id).required,true);
 assert.ok(stages.indexOf(unit)<stages.indexOf(browser));
});
test('virtualization smoke adds coverage without dropping existing workflow or conservative gates',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 const required=path=>selection(stages,{changed:[path]}).filter(s=>s.required).map(s=>s.id);
 for(const path of ['probes/document-scroll/reveal-settling.spec.ts','probes/document-scroll/playwright.config.ts','probes/rich-ranges/server.mjs','packages/primitives/src/interactions/virtual-collection.ts','packages/primitives/src/interactions/scroll-into-view.ts','packages/primitives/src/state/virtual-collection.ts','packages/primitives/src/templates/virtual-collection.ts','packages/primitives/src/state/table.ts','packages/primitives/tests/virtual-collection.test.mjs','packages/primitives/tests/virtual-rendering.test.mjs','packages/primitives/tests/collection-contract.test.mjs','packages/primitives/tests/table.test.mjs','unknown']){
  const ids=required(path);for(const id of [...groups.virtualization,'metadata-api','hydration','workflows'])assert.ok(ids.includes(id),path+' retains '+id);
 }
 for(const path of ['apps/docs/document-scroll.html','apps/docs/src/document-scroll-demo.ts']){
  const ids=required(path);for(const id of [...groups.virtualization,'workflows'])assert.ok(ids.includes(id));
 }
 for(const path of ['apps/docs/src/unrelated.ts','plans/review.md'])for(const id of groups.virtualization)assert.ok(!required(path).includes(id));
});
test('document-scroll gate forces built packages and records its owned overridable endpoint and cache',()=>fixture(async root=>{
 for(const [index,port]of [undefined,'46199'].entries()){
  const seen=[],output=join(root,'out-'+index);
  const stages=[stage('virtual-collection-unit'),{...stage('document-scroll'),config:'probes/document-scroll/playwright.config.ts'},stage('later')];
  const env={EN_CAPABILITY_BUILT:'',EN_CAPABILITY_PORT:'1',EN_CAPABILITY_CACHE:'/foreign/cache',EN_WORKFLOW_BASE_URL:'http://foreign',EN_GATE_DOCUMENT_SCROLL_PORT:port};
  const result=await run(root,stages,{output,env,executeCommand:async(_command,options)=>{
   seen.push(options.env);await writeFile(options.log,'');
   if(options.env.EN_GATE_CONFIG)await writeFile(join(options.env.EN_GATE_STAGE_OUTPUT,'playwright.json'),JSON.stringify({suites:[{specs:[{title:'owned regression',tests:['chromium-1280','chromium-390','firefox-1280','firefox-390','webkit-1280','webkit-390'].map(projectName=>({projectName,status:'expected',results:[{status:'passed'}]}))}]}]}));
   return {exitCode:0};
  }});
  assert.equal(result.exitCode,0);const actual=port??'47831',directory=join(output,'document-scroll');
  assert.equal(seen[1].EN_CAPABILITY_BUILT,'1');assert.equal(seen[1].EN_CAPABILITY_PORT,actual);
  assert.equal(seen[1].EN_CAPABILITY_CACHE,join(directory,'tmp/vite'));
  assert.equal(seen[1].EN_GATE_STAGE_OUTPUT,directory);assert.equal(seen[1].EN_WORKFLOW_BASE_URL,undefined);
  for(const other of [seen[0],seen[2]])for(const key of ['EN_CAPABILITY_BUILT','EN_CAPABILITY_PORT','EN_CAPABILITY_CACHE'])assert.equal(other[key],undefined);
  assert.deepEqual(result.stages[1].configuration.documentScroll,{builtPackages:true,host:'127.0.0.1',port:Number(actual),origin:'http://127.0.0.1:'+actual,cacheDir:join(directory,'tmp/vite')});
  assert.deepEqual(result.stages[1].browser.cases.map(c=>c.project),['chromium-1280','chromium-390','firefox-1280','firefox-390','webkit-1280','webkit-390']);
 }
}));
test('invalid document-scroll caller ports fail before launching its command',()=>fixture(async root=>{
 for(const [index,port]of ['', '0','65536','-1','47831.0','1e4','047831',' 47831','47831 ','http://localhost:47831',47831].entries()){
  let launched=false;const result=await run(root,[{...stage('document-scroll'),config:'probes/document-scroll/playwright.config.ts'}],{output:join(root,'invalid-'+index),env:{EN_GATE_DOCUMENT_SCROLL_PORT:port},executeCommand:async()=>{launched=true;return {exitCode:0};}});
  assert.equal(launched,false);assert.equal(result.exitCode,1);assert.equal(result.stages[0].status,'skipped');
  assert.match(result.orchestrationError.message,/EN_GATE_DOCUMENT_SCROLL_PORT must be a decimal integer from 1 to 65535/);
 }
}));
test('generic browser wrapper preserves document-scroll projects and owns JSON/traces without server reuse',()=>fixture(async directory=>{
 const {execute}=await import('./runner.mjs');const root=resolve(import.meta.dirname,'../..');
 const data=join(directory,'config.json'),log=join(directory,'config.log');
 const code="import {writeFileSync} from 'node:fs';const {default:c}=await import('./tooling/integration-gates/playwright.config.ts');writeFileSync(process.argv[1],JSON.stringify({testDir:c.testDir,testMatch:c.testMatch,workers:c.workers,timeout:c.timeout,retries:c.retries,projects:c.projects,reporter:c.reporter,outputDir:c.outputDir,baseURL:c.use.baseURL,server:c.webServer}));";
 const result=await execute([process.execPath,'--input-type=module','-e',code,data],{cwd:root,env:{...process.env,EN_GATE_CONFIG:join(root,'probes/document-scroll/playwright.config.ts'),EN_GATE_STAGE_OUTPUT:directory,EN_CAPABILITY_BUILT:'1',EN_CAPABILITY_PORT:'46199',EN_CAPABILITY_CACHE:join(directory,'tmp/vite')},log});
 assert.equal(result.exitCode,0);const config=JSON.parse(await readFile(data,'utf8'));
 assert.equal(config.testDir,join(root,'probes/document-scroll'));assert.equal(config.testMatch,'*.spec.ts');
 assert.equal(config.workers,1);assert.equal(config.timeout,30000);assert.equal(config.retries,0);
 assert.deepEqual(config.projects,['chromium','firefox','webkit'].flatMap(browserName=>[{width:1280,height:800},{width:390,height:844}].map(viewport=>({name:browserName+'-'+viewport.width,use:{browserName,viewport}}))));
 assert.deepEqual(config.reporter,[['list'],['json',{outputFile:join(directory,'playwright.json')}]]);
 assert.equal(config.outputDir,join(directory,'traces'));assert.equal(config.baseURL,'http://127.0.0.1:46199');
 assert.equal(config.server.length,1);assert.equal(config.server[0].command,'node probes/rich-ranges/server.mjs');
 assert.equal(config.server[0].url,'http://127.0.0.1:46199/apps/docs/document-scroll.html');assert.equal(config.server[0].cwd,root);assert.equal(config.server[0].reuseExistingServer,false);
}));

test('document-scroll server rejects an occupied caller port without adopting or stopping its owner',()=>fixture(async directory=>{
 const {createServer}=await import('node:net');const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');
 const owner=createServer(socket=>socket.end());await new Promise((ready,reject)=>{owner.once('error',reject);owner.listen(0,'127.0.0.1',ready);});
 try{
  const port=owner.address().port;
  await assert.rejects(promisify(execFile)(process.execPath,['probes/rich-ranges/server.mjs'],{cwd:resolve(import.meta.dirname,'../..'),env:{...process.env,EN_CAPABILITY_BUILT:'1',EN_CAPABILITY_PORT:String(port),EN_CAPABILITY_CACHE:join(directory,'vite')},timeout:10000}),error=>{
   assert.equal(error.code,1);assert.match(error.stderr,new RegExp(`Port ${port} is already in use`));return true;
  });
  assert.equal(owner.listening,true);assert.equal(owner.address().port,port);
 }finally{await new Promise((done,reject)=>owner.close(error=>error?reject(error):done()));}
}));


test('CLI preserves composable stage and skip requests and refuses conflicting singleton options',async()=>{
 const {parseArgs}=await import('./run.mjs');
 assert.deepEqual(parseArgs(['--base','HEAD~1','--stage','theme','--stage','registry','--skip','theme-states','--list']),{mode:'smoke',only:['theme','registry'],base:'HEAD~1',skip:['theme-states'],list:true});
 for(const args of [['--mode','smoke','--mode','integration'],['--commit','a'.repeat(40),'--commit','b'.repeat(40)],['--base'],['--stage','--list'],['--unknown','value']])assert.throws(()=>parseArgs(args));
});
test('modern Runtime child borrows the gate execution owner and cannot release it',()=>fixture(async root=>{
 const {withExecutionOwner}=await import('../testing/execution-owner.mjs');let seen=false;
 const result=await run(root,[stage('nested')],{executeCommand:async(_command,options)=>{
  const path=join(root,'node_modules/.cache/test-execution-owner.json'),parent=JSON.parse(await readFile(path,'utf8'));
  assert.equal(options.env.EN_TEST_EXECUTION_OWNER,parent.token);
  await withExecutionOwner(root,async ownership=>{seen=true;assert.equal(ownership.borrowed,true);assert.deepEqual(ownership.owner,parent);},{environment:{...options.env}});
  assert.deepEqual(JSON.parse(await readFile(path,'utf8')),parent);await writeFile(options.log,'');return {exitCode:0};
 }});
 assert.equal(result.exitCode,0);assert.equal(seen,true);assert.equal(result.resourceRelease.status,'passed');await assert.rejects(readFile(join(root,'node_modules/.cache/test-execution-owner.json')),{code:'ENOENT'});
}));
test('foreign Runtime execution owner fails preflight without launching or releasing its lease',()=>fixture(async root=>{
 const {withExecutionOwner}=await import('../testing/execution-owner.mjs');
 await withExecutionOwner(root,async ownership=>{
  const result=await run(root,[stage('never')],{env:{EN_TEST_EXECUTION_OWNER:'foreign'},executeCommand:async()=>{throw Error('must not launch');}});
  assert.equal(result.exitCode,75);assert.equal(result.stages[0].status,'skipped');assert.equal(result.preflight.category,'environment');assert.equal(JSON.parse(await readFile(ownership.path,'utf8')).token,ownership.owner.token);
 },{environment:{}});
}));
test('changed resource ownership remains retained and makes the terminal receipt fail',()=>fixture(async root=>{
 const result=await run(root,[stage('passes')],{executeCommand:async(_command,options)=>{await writeFile(join(root,'lock/owner.json'),JSON.stringify({id:'changed',pid:process.pid}));await writeFile(options.log,'');return {exitCode:0};}});
 assert.equal(result.stages[0].status,'passed');assert.equal(result.status,'failed');assert.notEqual(result.exitCode,0);assert.equal(result.resourceRelease.status,'failed');assert.equal(JSON.parse(await readFile(join(root,'out/receipt.json'))).status,'failed');assert.equal(JSON.parse(await readFile(join(root,'lock/owner.json'))).id,'changed');
}));
test('current packed providers and public children receive stage-owned output paths',()=>fixture(async root=>{
 const observed=[];const result=await run(root,[stage('scope-prepare'),stage('hydration-prepare')],{env:{EN_EXECUTION_OUTPUT:'/foreign/public',EN_TEST_PIPELINE_OUTPUT:'/foreign/config',EN_TEST_PIPELINE_CONFIG_OUTPUTS:'{"foreign":"/foreign/path"}'},executeCommand:async(_command,options)=>{observed.push(options.env);await writeFile(options.log,'');return {exitCode:0};}});
 assert.equal(result.exitCode,0);
 for(const [index,env]of observed.entries()){
  const id=index?'hydration-prepare':'scope-prepare';assert.equal(env.EN_SCOPED_REGISTRY_OUT,join(root,'out/scope-prepare/site'));assert.equal(env.EN_SCOPED_HYDRATION_OUT,join(root,'out/hydration-prepare/site'));assert.equal(env.EN_EXECUTION_OUTPUT,join(root,'out',id,'public'));assert.equal(env.EN_TEST_PIPELINE_OUTPUT,join(root,'out',id,'configurations'));assert.equal(env.EN_TEST_PIPELINE_CONFIG_OUTPUTS,undefined);
 }
 assert.notEqual(observed[0].TMPDIR,observed[1].TMPDIR);assert.notEqual(observed[0].EN_EXECUTION_OUTPUT,observed[1].EN_EXECUTION_OUTPUT);
}));

test('execution-owner cleanup failure preserves an already recorded positive child exit',()=>fixture(async root=>{
 const ownerPath=join(root,'node_modules/.cache/test-execution-owner.json');
 const result=await run(root,[stage('product-failed',17)],{executeCommand:async(_command,options)=>{
  const owner=JSON.parse(await readFile(ownerPath,'utf8'));await writeFile(ownerPath,JSON.stringify({...owner,token:'changed-owner'}));await writeFile(options.log,'retained child failure');return {exitCode:17};
 }});
 assert.equal(result.stages[0].status,'failed');assert.equal(result.stages[0].exitCode,17);assert.equal(result.exitCode,17);assert.equal(result.status,'failed');assert.match(result.orchestrationError.message,/Execution ownership changed/);assert.equal(JSON.parse(await readFile(ownerPath,'utf8')).token,'changed-owner');assert.equal(JSON.parse(await readFile(join(root,'out/receipt.json'),'utf8')).exitCode,17);
}));

test('canonical Node sources execute once and references retain their native coverage receipt',()=>fixture(async root=>{
 await writeFile(join(root,'one.test.mjs'),"import test from 'node:test';test('real assertion',()=>{});\n");
 const make=id=>({...stage(id),kind:'node',nodeSources:['one.test.mjs'],referenceableSources:['one.test.mjs'],command:['node','--test','one.test.mjs']});
 const receipt=await run(root,[make('first'),make('second')]);assert.equal(receipt.exitCode,0,JSON.stringify(receipt));assert.equal(receipt.stages[0].nodeFacets.status,'passed');assert.equal(receipt.stages[1].references.length,1);assert.deepEqual(receipt.stages[1].executedSources,[]);assert.equal(receipt.stages[1].references[0].stage,'first');assert.equal(receipt.nodeReferencePolicy.sourceStable,true);
}));
test('integration fail-fast blocks expensive independent preparation after cheap negative',()=>fixture(async root=>{
 const receipt=await run(root,[{...stage('build'),kind:'producer'},{...stage('types',17),kind:'types'}],{metadata:{failFast:true}});assert.equal(receipt.exitCode,17);assert.equal(receipt.stages[0].status,'skipped');assert.equal(receipt.stages[1].status,'failed');assert(receipt.schedule.firstFailureMs>=0);
}));

test('unknown Node dependencies execute again instead of inheriting a passing reference',()=>fixture(async root=>{await writeFile(join(root,'unknown.test.mjs'),"import test from 'node:test';test('unknown closure',()=>{});\n");const make=id=>({...stage(id),kind:'node',nodeSources:['unknown.test.mjs'],command:['node','--test','unknown.test.mjs']});const receipt=await run(root,[make('first'),make('second')]);assert.equal(receipt.exitCode,0,JSON.stringify(receipt));assert.deepEqual(receipt.stages[1].executedSources,['unknown.test.mjs']);assert.deepEqual(receipt.stages[1].references,[]);}));

test('delivery source changes retain every affected assertion owner and complete workflow selection',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 for(const path of ['packages/elements/src/lazy-loader.ts','packages/ssr/src/hydration-manifest.ts','packages/elements/src/editor-toolbar.ts','packages/elements/src/media-viewer.ts','packages/elements/src/combobox/element.ts','packages/elements/src/command-palette/element.ts','packages/elements/src/pagination/element.ts','apps/docs/src/workflows/selection/template.ts','apps/docs/src/composable-chat-color-delivery.ts','apps/docs/src/composable-chat-color-ownership.mjs','apps/docs/scripts/api-example-ownership.mjs','apps/docs/scripts/authored-specimen-sources.mjs','apps/docs/scripts/generate-api-examples.mjs','apps/docs/tests/api-reference-generator.test.mjs']){
  const selected=selection(stages,{changed:[path]});
  for(const id of groups.delivery)assert.equal(selected.find(stage=>stage.id===id)?.required,true,path+' retains '+id);
  assert.equal(selected.find(stage=>stage.id==='workflows').workflowSelection.kind,'full',path);
 }
 for(const id of groups.delivery)assert.equal(selection(stages,{mode:'integration'}).find(stage=>stage.id===id)?.required,true,id);
});
test('delivery unit closure includes both color specimen generator owners',()=>{
 const stage=catalog(resolve(import.meta.dirname,'../..')).find(stage=>stage.id==='delivery-unit');
 for(const path of ['apps/docs/tests/api-reference-generator.test.mjs','apps/docs/tests/specimen-source-assembly.test.mjs'])assert.equal(stage.command.includes(path),true,path);
});
test('delivery SSR and gallery stages retain their real preparation and assertion receipts',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 const ssr=selection(stages,{only:['ssr-browser']});
 assert.equal(ssr.find(stage=>stage.id==='ssr-browser-prepare').required,true);
 assert.equal(ssr.find(stage=>stage.id==='ssr-browser').config,'packages/ssr/playwright.config.ts');
 const gallery=stages.find(stage=>stage.id==='delivery-gallery');
 assert.deepEqual(gallery.deps,['build']);
 assert.equal(gallery.receipts[0].equals['assertionCoverage.complete'],true);
 assert.deepEqual(gallery.receipts[0].commitFields,['candidate.head','candidateAfter.head']);
});


test('interim metadata permits pending delivery work while closeout explicitly requires final inventory',()=>{
 const stages=catalog(resolve(import.meta.dirname,'../..'));
 const interim=selection(stages,{only:['metadata']});
 assert.equal(interim.find(stage=>stage.id==='metadata-delivery').required,true);
 assert.equal(interim.find(stage=>stage.id==='delivery-closeout').required,false);
 const closeout=selection(stages,{only:['delivery-closeout']});
 assert.equal(closeout.find(stage=>stage.id==='metadata-delivery').required,true);
 assert.equal(closeout.find(stage=>stage.id==='tooling').required,true);
 assert.deepEqual(closeout.find(stage=>stage.id==='delivery-closeout').command,['npm','run','check:delivery:final']);
});
