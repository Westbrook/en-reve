import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {configuration,claimOutput,atomicJSON} from './config.mjs';
import {acquireResources} from './locks.mjs';
import {startServer} from './server.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
export async function sourceIdentity(root) {
 const paths=git(root,'ls-files','-z','packages','probes/registry-diagnostics','package.json','package-lock.json','tsconfig.base.json').split('\0').filter(Boolean);
 const files=[];for(const path of paths)files.push([path,hash(await readFile(join(root,path)))]);
 return {commit:git(root,'rev-parse','HEAD'),tree:git(root,'rev-parse','HEAD^{tree}'),trackedDirty:git(root,'status','--porcelain','--untracked-files=no'),fingerprint:hash(JSON.stringify(files)),files};
}
export async function execute(command,{root,env,log}) {
 const child=spawn(command[0],command.slice(1),{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk;});
 const result=await new Promise(done=>{child.once('error',error=>done({exitCode:1,error:{name:error.name,code:error.code,message:error.message}}));child.once('close',(exitCode,signal)=>done({exitCode:exitCode??1,signal}));});
 await writeFile(log,output,{flag:'wx'});return {...result,logSha256:hash(output)};
}
export async function qualify(env=process.env,{runCommand=execute,buildCurrent,serve=startServer,identity=sourceIdentity}={}) {
 const config=await claimOutput(configuration(env)); // Refuse collisions before locks, build or writes into existing data.
 const root=config.root;const receipt={schemaVersion:1,kind:'registry-diagnostics-current-source',runId:config.id,startedAt:new Date().toISOString(),output:config.output,configuration:{requestedPort:config.port,browsers:config.browsers,expectedCommit:config.expectedCommit},status:'running',steps:[],limitations:['Development-only source-bundled fixture; no packed-public-consumer or production promotion claim.','No timing or retention campaign in this gate; historical evidence is verified separately.','Automated DOM/focus coverage is not assistive-technology or physical-device review.']};
 const save=()=>atomicJSON(join(config.output,'receipt.json'),receipt);
 let resources,server;
 try {
  const common=git(root,'rev-parse','--path-format=absolute','--git-common-dir');
  const browserPath=env.EN_DIAGNOSTICS_BROWSER_LOCK??join(dirname(common),'showcases/performance/.cache/browser-run.lock');
  const machinePath=env.EN_DIAGNOSTICS_MACHINE_LOCK??join(tmpdir(),'en-reve-integration-machine.lock');
  // Resolve these before child TMPDIR overrides. Parents must pass canonical absolute paths.
  receipt.locks={browserPath,machinePath,inherited:!!env.EN_DIAGNOSTICS_PARENT_LOCKS};
  await mkdir(dirname(browserPath),{recursive:true});
  try {resources=await acquireResources({browserPath,machinePath,parent:env.EN_DIAGNOSTICS_PARENT_LOCKS?JSON.parse(env.EN_DIAGNOSTICS_PARENT_LOCKS):undefined});}
  catch(error){receipt.preflight={status:'failed',category:'resource-lock',code:error.code,message:error.message};receipt.exitCode=75;throw error;}
  receipt.source=await identity(root);
  if(config.expectedCommit&&receipt.source.commit!==config.expectedCommit)throw Error('Current HEAD does not match EN_DIAGNOSTICS_EXPECT_COMMIT.');
  if(receipt.source.trackedDirty)throw Error('Current-source qualification requires clean tracked source. Commit or isolate changes first.');
  await mkdir(join(config.output,'tmp'));const childEnv={...env,EN_DIAGNOSTICS_OUT:config.output,EN_DIAGNOSTICS_RUN_ID:config.id,TMPDIR:join(config.output,'tmp'),TMP:join(config.output,'tmp'),TEMP:join(config.output,'tmp')};
  const step=async(name,work)=>{const s={name,status:'running',startedAt:new Date().toISOString()};receipt.steps.push(s);await save();try{Object.assign(s,await work());s.status='passed';}catch(error){s.status='failed';s.error={name:error.name,message:error.message,stack:error.stack};throw error;}finally{s.finishedAt=new Date().toISOString();await save();}};
  await step('build',async()=>{const build=buildCurrent??(await import('./build.mjs')).buildFixture;const proof=await build(config);receipt.build=proof;return {disabledImportExclusion:proof.disabledImportExclusion};});
  await step('types',async()=>{const result=await runCommand([process.execPath,join(root,'node_modules/typescript/bin/tsc'),'--ignoreConfig','--noEmit','--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--skipLibCheck','probes/registry-diagnostics/diagnostics.ts','probes/registry-diagnostics/ui.ts'],{root,env:childEnv,log:join(config.output,'types.log')});receipt.commands??=[];receipt.commands.push({stage:'types',...result,log:'types.log'});if(result.exitCode!==0)throw Error('Types failed; inspect types.log');return result;});
  await step('server',async()=>{server=await serve({output:config.output,port:config.port,runId:config.id});childEnv.EN_DIAGNOSTICS_URL=server.url;receipt.server={url:server.url,owned:true};return {url:server.url};});
  for(const [name,file] of [['conformance','check.mjs'],['interactions','review-check.mjs']]) {
   await step(name,async()=>{
    const result=await runCommand([process.execPath,join(root,'probes/registry-diagnostics',file)],{root,env:childEnv,log:join(config.output,name+'.log')});
    receipt.commands??=[];receipt.commands.push({stage:name,...result,log:name+'.log'});
    const outputFile=name==='conformance'?'conformance.json':'review-check.json';
    try{receipt[name]=JSON.parse(await readFile(join(config.output,outputFile),'utf8'));}catch(error){throw Error(`${outputFile} missing/invalid after exit ${result.exitCode}: ${error.message}`);}
    const report=receipt[name];if(report.runId!==config.id)throw Error('Browser result ownership mismatch');
    for(const engine of config.browsers){const row=report.results.find(r=>(r.name??r.engineName)===engine);if(!row||row.status!=='passed')throw Error(`${name}: ${engine} did not pass; inspect ${outputFile}`);}
    if(result.exitCode!==0)throw Error(`${name} exited ${result.exitCode}; inspect retained log`);
    return result;
   });
  }
  receipt.after=await identity(root);if(receipt.source.fingerprint!==receipt.after.fingerprint||receipt.source.commit!==receipt.after.commit)throw Error('Source changed during qualification.');
  receipt.coverage={completeEngineMatrix:config.browsers.length===3,passed:receipt.conformance.results.reduce((n,r)=>n+(r.cases??[]).filter(c=>c.status==='passed').length,0),skipped:receipt.conformance.results.flatMap(r=>(r.cases??[]).filter(c=>c.status==='skipped').map(c=>({engine:r.name,...c}))),capabilities:receipt.conformance.results.filter(r=>r.capability).map(r=>({engine:r.name,...r.capability}))};
  receipt.exitCode=0;
 }catch(error){receipt.error={name:error.name,message:error.message,stack:error.stack};receipt.exitCode??=1;}
 finally {
  for(const name of ['build','types','server','conformance','interactions'])if(!receipt.steps.some(s=>s.name===name))receipt.steps.push({name,status:'skipped',reason:'Prior prerequisite did not complete.'});
  try{if(server)await server.close();}catch(error){receipt.cleanupError=error.message;receipt.exitCode=1;}
  try{if(resources)await resources.release();}catch(error){receipt.lockReleaseError=error.message;receipt.exitCode=1;}
  receipt.status=receipt.exitCode===0?'passed':'failed';receipt.finishedAt=new Date().toISOString();await save();
 }
 return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const receipt=await qualify();console.log(JSON.stringify({status:receipt.status,exitCode:receipt.exitCode,receipt:join(receipt.output,'receipt.json')}));process.exitCode=receipt.exitCode;}
 catch(error){console.error(JSON.stringify({status:'failed',category:'output-or-configuration',code:error.code,message:error.message,receipt:null}));process.exitCode=error.code==='EEXIST'?73:64;}
}
