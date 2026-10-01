import {withExecutionOwner} from '../testing/execution-owner.mjs';
import {spawn,execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile,readdir,rm,rename} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {tmpdir,hostname,loadavg,cpus} from 'node:os';
export const hash=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
export const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
export {atomic,acquireLock} from './resources.mjs';
import {atomic,acquireLock,acquireResources} from './resources.mjs';
export async function filesBelow(root, directory) {
 const entries=[];
 async function visit(dir){for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:1)){
  const path=join(dir,e.name);if(e.isDirectory())await visit(path);else if(e.isFile())entries.push([relative(root,path).split('\\').join('/'),hash(await readFile(path))]);
 }}
 try {await visit(directory);}catch(e){if(e.code!=='ENOENT')throw e;}
 return entries;
}
export const sourcePath=path=>path && (!/^(artifacts\/|showcases\/performance\/baselines\/)/.test(path) || /^artifacts\/scoped-followup-date-input-coverage\/(?:consolidation\/)?[^/]+\.(mjs|js|css|html|md)$/.test(path));
export async function source(root) {
 const paths=git(root,'ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(sourcePath).sort();
 const files=[];for(const p of paths){try{files.push([p,hash(await readFile(resolve(root,p)))]);}catch(e){if(e.code!=='ENOENT')throw e;files.push([p,null]);}}
 return {worktreeStatus:git(root,'status','--porcelain','--untracked-files=all'),commit:git(root,'rev-parse','HEAD'),tree:git(root,'rev-parse','HEAD^{tree}'),sha256:hash(JSON.stringify(files)),files};
}
export async function execute(command,{cwd,env,log}) {
 const child=spawn(command[0]==='node'?process.execPath:command[0],command.slice(1),{cwd,env,stdio:['ignore','pipe','pipe']});
 let output='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk;});
 const result=await new Promise(resolve=>{child.once('error',error=>resolve({exitCode:null,signal:null,error:{code:error.code,message:error.message}}));child.once('close',(exitCode,signal)=>resolve({exitCode,signal}));});
 await writeFile(log,output);return {...result,logSha256:hash(output)};
}
export function playwrightSummary(report) {
 const cases=[];
 function visit(suite){for(const spec of suite.specs??[])for(const test of spec.tests??[])cases.push({title:spec.title,project:test.projectName,status:test.status,annotations:test.annotations??[],results:(test.results??[]).map(r=>({status:r.status,error:r.error?.message}))});for(const s of suite.suites??[])visit(s);}
 visit(report);return {stats:report.stats,cases};
}
export function outcome(result, browser) {
 if(result.error)return {status:'failed',failure:{category:result.error.code==='ENOENT'?'environment':'unclassified',evidence:result.error.message}};
 if(result.exitCode!==0)return {status:'failed',failure:{category:'unclassified',evidence:result.signal?`terminated by ${result.signal}`:`command exited ${result.exitCode}; inspect retained log before classifying product/harness/environment/transient`}};
 if(browser && (!browser.cases.length || browser.cases.every(t=>t.status==='skipped')))return {status:'unsupported',reason:'No browser case executed; a required stage cannot pass with zero executed cases'};
 if(browser?.cases.some(t=>['unexpected','flaky'].includes(t.status)))return {status:'failed',failure:{category:'unclassified',evidence:'Browser report contains unexpected or flaky results'}};
 return {status:'passed'};
}
const field=(value,path)=>path.split('.').reduce((object,key)=>object?.[key],value);
export async function validateReceipt(directory,spec,commit){
 const bytes=await readFile(join(directory,spec.path)),data=JSON.parse(bytes);
 for(const [path,expected]of Object.entries(spec.equals??{}))if(field(data,path)!==expected)throw Error(`${spec.path}: ${path} must equal ${JSON.stringify(expected)}`);
 for(const path of spec.commitFields??[])if(field(data,path)!==commit)throw Error(`${spec.path}: ${path} is not the qualified commit`);
 for(const path of spec.positiveFields??[])if(!Number.isInteger(field(data,path))||field(data,path)<=0)throw Error(`${spec.path}: ${path} must be a positive count`);
 if(spec.steps){const rule=spec.steps,steps=field(data,rule.field);if(!Array.isArray(steps)||!steps.length)throw Error(`${spec.path}: missing required stages`);
  if(rule.count!==undefined&&steps.length!==rule.count)throw Error(`${spec.path}: required stage count mismatch`);
  for(const name of rule.required??[])if(steps.filter(s=>s[rule.name]===name).length!==1)throw Error(`${spec.path}: missing/duplicate stage ${name}`);
  if(steps.some(s=>s[rule.status]!==rule.passed))throw Error(`${spec.path}: required child stage did not pass`);
 }
 return {path:spec.path,sha256:hash(bytes),status:'verified'};
}
export function aggregate(stages) {
 const failure=stages.find(s=>s.required&&s.status==='failed');
 if(failure)return Number.isInteger(failure.exitCode)&&failure.exitCode>0?failure.exitCode:1;
 return stages.some(s=>s.required&&s.status!=='passed')?2:0;
}
export async function runStages({root,output,stages,metadata={},env={},executeCommand=execute,lockPath,identity=source}) {
 await mkdir(output,{recursive:false});
 const id=randomUUID(),receipt={schemaVersion:1,id,startedAt:new Date().toISOString(),...metadata,
  runtime:{node:process.version,platform:process.platform,arch:process.arch},
  contention:{host:hostname(),logicalCpus:cpus().length,loadAtStart:loadavg(),policy:'serial host lock; not a timing campaign',lockAcquired:false},
  stages:stages.map(s=>({...s,status:s.required?'pending':'skipped',reason:s.required?undefined:s.selectionReason})),
  limitations:['Automated DOM/focus checks are not assistive-technology, physical-device or real IME review.','No performance improvement claim. Historical workloads, cache and preparation policies remain separate.']};
 const save=()=>atomic(join(output,'receipt.json'),receipt);
 let unlock,resourceEnv={};
 try {
  try {if(lockPath)unlock=await acquireLock(lockPath,{id,pid:process.pid,startedAt:receipt.startedAt});else {const resources=await acquireResources(root,{env:{...process.env,...env}});unlock=resources.release;resourceEnv=resources.env;receipt.contention.resources={paths:resources.paths,inherited:resources.inherited};}receipt.contention.lockAcquired=true;}
  catch(error){receipt.preflight={status:'failed',category:'environment',reason:'Resource lock unavailable; no tests started',detail:error.message,code:error.code};receipt.exitCode=75;return receipt;}
  const ownedEnvironment={...process.env,...env,...resourceEnv};
  let enteredExecution=false;
  const executeStages=async()=>{
  enteredExecution=true;
  receipt.source=await identity(root);
  if(metadata.exactCommit&&(receipt.source.commit!==metadata.exactCommit||receipt.source.worktreeStatus!=='')){receipt.preflight={status:'failed',category:'harness',reason:'Acquired source is not the requested clean exact commit'};receipt.exitCode=1;return receipt;}
  try {receipt.runtime.npm=execFileSync('npm',['--version'],{encoding:'utf8'}).trim();}catch{receipt.runtime.npm='unavailable';}
  for(const p of ['package.json','package-lock.json','showcases/performance/package-lock.json']){try{receipt[p.replaceAll('/','_')+'Sha256']=hash(await readFile(join(root,p)));}catch{}}
  const packagePaths=['package.json','node_modules/@playwright/test/package.json','node_modules/typescript/package.json','node_modules/vite/package.json','showcases/performance/node_modules/esbuild/package.json',...['tokens','styles','primitives','elements','ssr'].map(n=>`packages/${n}/package.json`)];
  receipt.packages={};for(const path of packagePaths){try{const p=JSON.parse(await readFile(join(root,path),'utf8'));receipt.packages[p.name]=p.version;}catch{}}
  for(const stage of receipt.stages) {
   if(!stage.required)continue;
   if(stage.requestedSkip){stage.status='skipped';stage.reason='Explicit operator skip; remains required';await save();continue;}
   if(stage.deps.some(id=>receipt.stages.find(s=>s.id===id)?.status!=='passed')){stage.status='skipped';stage.reason='Required dependency did not pass';await save();continue;}
   const directory=join(output,stage.id);await mkdir(directory);await mkdir(join(directory,'tmp'));
   const runEnv={...ownedEnvironment,EN_EXECUTION_OUTPUT:join(directory,'public'),EN_TEST_PIPELINE_OUTPUT:join(directory,'configurations'),TMPDIR:join(directory,'tmp'),TMP:join(directory,'tmp'),TEMP:join(directory,'tmp'),
    EN_CONSUMER_CONTRACTS_OUT:join(output,'consumer-prepare','evidence'),DATE_INPUT_RUN:join(directory,'evidence'),
    EN_SCOPE_OUT:join(output,'scope-prepare','site'),EN_SCOPED_REGISTRY_OUT:join(output,'scope-prepare','site'),EN_LAZY_OUT:join(output,'lazy-prepare','site'),EN_LAZY_DELIVERY_OUT:join(output,'lazy-delivery-prepare','site'),EN_LAZY_DELIVERY_EDITOR_OUT:join(output,'lazy-delivery-editor-prepare','site'),EN_LAZY_DELIVERY_PAGINATION_OUT:join(output,'lazy-delivery-pagination-prepare','site'),
    EN_ACTIVATION_OUT:join(output,'activation-prepare','site'),EN_ACTIVATION_LIBRARY_OUT:join(output,'activation-library-prepare','site'),EN_HYDRATION_OUT:join(output,'hydration-prepare','site'),EN_SCOPED_HYDRATION_OUT:join(output,'hydration-prepare','site'),
    PROPERTY_TEST_OUTPUT_DIR:directory,SCOPE_TEST_OUTPUT_DIR:directory,EN_GATE_STAGE_OUTPUT:directory,
    EN_GATE_CONFIG:stage.config??'',EN_WORKFLOW_TEST_OUTPUT_DIR:directory,EN_WORKFLOW_TEST_PORT:'4596',EN_SSR_TEST_PORT:'4292',
    EN_SIZE_TEST_OUTPUT:directory,EN_SIZE_TEST_PORT:'47829',EN_COMMANDS_TEST_PORT:'47830',EN_COMMANDS_TEST_OUTPUT_DIR:directory};
   delete runEnv.EN_TEST_PIPELINE_CONFIG_OUTPUTS;
   // Adapter configuration belongs only to its actual stage, never unit fixtures.
   for(const key of Object.keys(runEnv))if(key.startsWith('EN_DIAGNOSTICS_'))delete runEnv[key];
   if(stage.id==='diagnostics'){
    for(const suffix of ['MACHINE_LOCK','BROWSER_LOCK'])if(resourceEnv[`EN_GATE_${suffix}`])runEnv[`EN_DIAGNOSTICS_${suffix}`]=resourceEnv[`EN_GATE_${suffix}`];
    runEnv.EN_DIAGNOSTICS_OUT=join(directory,'evidence');runEnv.EN_DIAGNOSTICS_PORT='0';runEnv.EN_DIAGNOSTICS_BROWSERS='chromium,firefox,webkit';runEnv.EN_DIAGNOSTICS_EXPECT_COMMIT=receipt.source.commit;
    if(resourceEnv.EN_GATE_MACHINE_OWNER)runEnv.EN_DIAGNOSTICS_PARENT_LOCKS=JSON.stringify({browser:{path:resourceEnv.EN_GATE_BROWSER_LOCK,owner:JSON.parse(resourceEnv.EN_GATE_BROWSER_OWNER)},machine:{path:resourceEnv.EN_GATE_MACHINE_LOCK,owner:JSON.parse(resourceEnv.EN_GATE_MACHINE_OWNER)}});
   }
   // Only this probe receives the integration caller's built-package/cache/port context.
   for(const key of ['EN_CAPABILITY_BUILT','EN_CAPABILITY_PORT','EN_CAPABILITY_CACHE'])delete runEnv[key];
   if(stage.id==='document-scroll'){
    const port=runEnv.EN_GATE_DOCUMENT_SCROLL_PORT??'47831';
    if(typeof port!=='string'||! /^[1-9][0-9]*$/.test(port)||Number(port)>65535)throw Error('EN_GATE_DOCUMENT_SCROLL_PORT must be a decimal integer from 1 to 65535');
    runEnv.EN_CAPABILITY_BUILT='1';runEnv.EN_CAPABILITY_PORT=port;runEnv.EN_CAPABILITY_CACHE=join(directory,'tmp/vite');
   }
   // Never allow external-server shortcuts to test an unrelated checkout.
   for(const key of ['EN_WORKFLOW_BASE_URL','EN_DOCS_ORIGIN','EN_PATTERN_GALLERY_URL','EN_COMMANDS_TEST_BASE_URL','EN_COMMANDS_MOBILE_BASE_URL','EN_COMBOBOX_MOBILE_BASE_URL','EN_POPUP_MOTION_BASE_URL'])delete runEnv[key];
   stage.configuration={config:stage.config??null,workers:'maximum 3, retaining lower owning limits',retries:stage.config?0:null,resourcePolicy:'host-serialized fixed ports; owned per-run outputs'};
   if(stage.id==='document-scroll')stage.configuration.documentScroll={builtPackages:runEnv.EN_CAPABILITY_BUILT==='1',host:'127.0.0.1',port:Number(runEnv.EN_CAPABILITY_PORT),origin:`http://127.0.0.1:${runEnv.EN_CAPABILITY_PORT}`,cacheDir:runEnv.EN_CAPABILITY_CACHE};
   stage.status='running';stage.startedAt=new Date().toISOString();stage.log=`${stage.id}/command.log`;await save();
   const result=await executeCommand(stage.command,{cwd:root,env:runEnv,log:join(output,stage.log)});Object.assign(stage,result);
   if(stage.config){try{stage.browser=playwrightSummary(JSON.parse(await readFile(join(directory,'playwright.json'),'utf8')));}
    catch(error){if(result.exitCode===0){stage.status='failed';stage.failure={category:'harness',evidence:`Missing/invalid required Playwright report: ${error.message}`};}}}
   if(stage.receipts){stage.receiptValidation=[];for(const spec of stage.receipts){try{stage.receiptValidation.push(await validateReceipt(directory,spec,receipt.source.commit));}catch(error){stage.receiptValidation.push({path:spec.path,status:'failed',error:error.message});if(result.exitCode===0){stage.status='failed';stage.failure={category:'harness',evidence:error.message};}}}}
   if(stage.status!=='failed')Object.assign(stage,outcome(result,stage.browser));
   stage.finishedAt=new Date().toISOString();stage.artifacts=await filesBelow(output,directory);
   await save();
  }
  receipt.after=await identity(root);
  if(receipt.source.commit!==receipt.after.commit||receipt.source.sha256!==receipt.after.sha256){receipt.sourceStability={status:'failed',category:'harness',reason:'Source or generated metadata changed during run; review diff and rerun exact committed source'};}
  receipt.builtAssets=[];for(const dir of ['dist','packages/tokens/dist','packages/styles/dist','packages/primitives/dist','packages/elements/dist','packages/ssr/dist','apps/docs/dist'])receipt.builtAssets.push(...await filesBelow(root,join(root,dir)));
  receipt.exitCode=aggregate(receipt.stages)||(receipt.sourceStability?1:0);
  };
  // Isolated controls and public invocations use the same shared-output protocol.
  try {
   await withExecutionOwner(root,async ownership=>{receipt.executionOwnership=ownership;await executeStages();},{environment:ownedEnvironment});
  } catch(error){
   if(enteredExecution)throw error;
   receipt.preflight={status:'failed',category:'environment',reason:'Shared execution ownership unavailable; no tests started',detail:error.message};receipt.exitCode=75;
  }
 } catch(error){
  receipt.orchestrationError={category:'harness',message:error.stack};
  const failedChild=receipt.stages.find(stage=>stage.required&&stage.status==='failed'&&Number.isInteger(stage.exitCode)&&stage.exitCode>0);
  receipt.exitCode=failedChild?.exitCode??(Number.isInteger(receipt.exitCode)&&receipt.exitCode>0?receipt.exitCode:1);
 }
 finally {
  receipt.finishedAt=new Date().toISOString();receipt.contention.loadAtEnd=loadavg();
  for(const s of receipt.stages)if(s.status==='pending'||s.status==='running'){s.status='skipped';s.reason='Orchestration did not complete this required stage';}
  if(unlock){try{await unlock();receipt.resourceRelease={status:'passed'};}catch(error){receipt.resourceRelease={status:'failed',error:String(error)};receipt.exitCode=receipt.exitCode||1;}}
  receipt.status=receipt.exitCode===0?'passed':'failed';await save();
 }
 return receipt;
}
