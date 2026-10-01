import { waitOwnedCommand, throwIfInterrupted, terminalReceipt } from './interruption.mjs';
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { exclusiveBrowserWork } from '../../showcases/performance/src/lock.mjs';
import { specializedPathways } from './specialized.mjs';
import { root } from './pathways.mjs';
import { specializedSelection, specializedCoverage } from './specialized-selection.mjs';
import { atomicJSON, inventoryDigest } from '../evidence/setup.mjs';
import { sourceIdentity } from './release-attestation.mjs';
import { startOwnedService } from './owned-service.mjs';
import { startDocsServer } from '../../apps/docs/tests/static-server.mjs';
import { startOwnedReport } from './owned-report.mjs';
import { withExecutionOwner } from './execution-owner.mjs';
import { nativeWorkspaceRouting, workspaceOwnerDisposition } from './native-workspaces.mjs';

const args=process.argv.slice(2);
for(const arg of args)if(arg!=='--plan'&&!['--pathway=','--pathways=','--output=','--id=','--reason=','--native-workspaces='].some(prefix=>arg.startsWith(prefix)))throw new Error('Unknown specialized option: '+arg);
const option=name=>args.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3);
for(const name of ['pathway','pathways','output','id','reason','native-workspaces'])if(args.filter(arg=>arg.startsWith(`--${name}=`)).length>1)throw new Error('Repeated specialized option: '+name);
if(option('native-workspaces')==='')throw new Error('Native workspace contract path must not be empty');
const id=option('id')??`execution-${Date.now()}-${randomUUID()}`;
if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id))throw new Error('Run ID must be one safe path component');
const graph=await specializedPathways();
let selection=specializedSelection(graph,{pathway:option('pathway'),pathways:option('pathways')});
const workspaceContract=option('native-workspaces')?JSON.parse(await readFile(resolve(root,option('native-workspaces')),'utf8')):null;
const routing=workspaceContract?nativeWorkspaceRouting(workspaceContract,selection,{controllerRoot:root,id}):null;
if(routing)selection=routing.selection;
const {plan,requested,pathwayTasks,requiredInputs}=selection,pathway=requested.length===1?requested[0]:null;
if(args.includes('--plan')){
 await new Promise((resolve,reject)=>process.stdout.write(JSON.stringify({pathway,pathways:requested,plan,pathwayTasks,requiredInputs,manual:graph.manual,libraryComplete:false},null,2)+'\n',error=>error?reject(error):resolve()));
 process.exit(0);
}
for(const name of requiredInputs){
 if(!process.env[name])throw new Error(`${name} must identify a reviewed compatible anchor before this regression lane starts`);
 const path=resolve(root,process.env[name]);if(!(await stat(path)).isFile())throw new Error(`${name} is not a baseline file`);
 JSON.parse(await readFile(path,'utf8')); // The original check command retains semantic compatibility checks.
}
const output=resolve(root,option('output')??`artifacts/test-execution/${id}`);
const reason=option('reason')??'Fresh local execution of the preserved specialized qualification protocol';
const variables={RUN:output,ID:id,REASON:reason,SHOWCASE_RECEIPT:resolve(output,'showcase-receipt.json'),REGISTRY_FIXTURE:resolve(root,'showcases/performance/runs',id+'-registry','fixture'),PERF_BASELINE:process.env.PERF_BASELINE?resolve(root,process.env.PERF_BASELINE):'',PERF_INTERACTION_BASELINE:process.env.PERF_INTERACTION_BASELINE?resolve(root,process.env.PERF_INTERACTION_BASELINE):'',DATE_REPORT_ORIGIN:'',DOCS_ORIGIN:''};
const bind=value=>value.replace(/\$([A-Z][A-Z_]*)/g,(_,key)=>{
 if(!variables[key])throw new Error('Unbound command input: '+key);return variables[key];
});
await mkdir(dirname(output),{recursive:true});await mkdir(output); // Fresh receipts only.
const start=performance.now();
const receipt={schemaVersion:1,pathway,pathways:requested,id,output,status:'running',startedAt:new Date().toISOString(),planDigest:inventoryDigest(plan),plan,libraryComplete:false,freshAcquisition:true,completedResultReuse:false,results:[],manual:graph.manual};
const errorDetails=(error,depth=0)=>({name:error?.name,message:String(error?.message??error),stack:error?.stack,...(depth<4&&Array.isArray(error?.errors)?{errors:error.errors.map(item=>errorDetails(item,depth+1))}:{})});
if(routing){receipt.workspaceContract={path:resolve(root,option('native-workspaces')),digest:inventoryDigest(workspaceContract)};receipt.workspaceEvidence=routing.evidence;receipt.workspaceOwners=[];}
const persist=async()=>{receipt.pathwayResults=specializedCoverage(selection,receipt.results,{failedTask:receipt.failedTask,reconciliationFailed:receipt.reconciliationFailed});receipt.wallMs=performance.now()-start;await atomicJSON(resolve(output,'execution.json'),receipt);};
let report,docs,activeTask;
try{
 receipt.sourceBefore=routing?{scope:'Finite selected source bindings verified immediately after the explicit staging producer',bindings:workspaceContract.sourceFiles}:await sourceIdentity(root);await persist();
 for(const task of plan){
  activeTask=task.id;
  throwIfInterrupted();
  if(task.managedReport){
   const directory=bind(task.managedReport.directory);await mkdir(directory,{recursive:true});
   report=await startOwnedReport({directory,fallback:resolve(root,task.managedReport.fallback)});
   variables.DATE_REPORT_ORIGIN=report.url;receipt.reportOrigin=report.url;
  }
  if(task.managedDocs){docs=await startDocsServer({port:0});variables.DOCS_ORIGIN=docs.url;}
  const env={...process.env};
  for(const [key,value] of Object.entries(task.environment??{})){
   // The report's owned port is needed only when rendering its fresh receipt.
   if(value==='$DATE_REPORT_ORIGIN'&&!variables.DATE_REPORT_ORIGIN)continue;
   env[key]=bind(value);
  }
  const cwd=task.cwd??root;
  const work=async owner=>{
   let service;
   if(owner)receipt.workspaceOwners.push({task:task.id,workspace:cwd,...owner,returned:false});
   try{
   await routing?.before(task);
   if(task.managedService)service=await startOwnedService({...task.managedService,cwd,env,output:resolve(output,task.id.replaceAll(':','-')+'-server.log')});
   const command=task.command.map(bind),directory=resolve(output,'commands',String(receipt.results.length+1).padStart(3,'0')+'-'+task.id.replaceAll(':','-'));
   const acquire=async()=>{
   throwIfInterrupted();
 const child=spawn('python3',[resolve(root,'tooling/testing/measure.py'),'--out',directory,'--cwd',cwd,'--label',task.id,'--',...command],{cwd,env,stdio:'inherit'});
   return waitOwnedCommand(child);
   };
   const code=task.needsCampaignLock?(routing?await exclusiveBrowserWork(acquire,{environment:env,workspaceRoot:cwd,browserPath:env.EN_GATE_BROWSER_LOCK??resolve(cwd,'showcases/performance/.cache/browser-run.lock')}):await exclusiveBrowserWork(acquire)):await acquire();
   const measured=JSON.parse(await readFile(resolve(directory,'receipt.json'),'utf8'));
   receipt.results.push({task:task.id,...measured,evidence:resolve(directory,'receipt.json'),fulfilledPathways:requested.filter(name=>pathwayTasks[name].includes(task.id))});await persist();
   if(code!==0)throw new Error(`Specialized task failed: ${task.id}; original failure retained in ${directory}`);
   }finally{await service?.close();if(task.managedDocs){await docs.close();docs=undefined;}}
   await routing?.after(task);
  };
  if(routing){
   // Check before the owner helper or a producer creates any mutable path.
   await routing.verifyWritableOutputs(task);
   // The outer controller checkout token must never be borrowed in another workspace.
   if(task.workspaceRole!=='stage')delete env.EN_TEST_EXECUTION_OWNER;
   let failure;
   try{await withExecutionOwner(cwd,work,{environment:env,invocation:task.command});}catch(error){failure=error;}
   try{
    const owner=receipt.workspaceOwners.at(-1);
    if(owner?.task===task.id)Object.assign(owner,await workspaceOwnerDisposition(owner));
    await persist();
   }catch(error){if(failure)throw new AggregateError([failure,error],'Task/cleanup failed and disposition reporting also failed');throw error;}
   if(failure)throw failure;
  }else await work();
  activeTask=undefined;
 }
 receipt.sourceAfter=routing?(await routing.finish()).sourceAfter:await sourceIdentity(root);
 // These protocols intentionally produce source-bound snapshots and metadata.
 // Record both source states; individual original verifiers enforce their own identities.
 receipt.status='passed';receipt.limitations=['Command-level outcomes retain original verifier receipts; no cross-protocol sample pooling.','Manual acceptance remains separate.','This selected pathway is not a full-library verification.'];
}catch(error){receipt.status='failed';receipt.error=String(error.stack??error);receipt.errorDetails=errorDetails(error);if(activeTask)receipt.failedTask=activeTask;else receipt.reconciliationFailed=true;process.exitCode=1;}
finally{
 for(const server of [docs,report])try{await server?.close();}catch(error){receipt.cleanupErrors??=[];receipt.cleanupErrors.push(String(error.stack??error));receipt.status='failed';receipt.reconciliationFailed=true;process.exitCode=1;}
 receipt.finishedAt=new Date().toISOString();await terminalReceipt(receipt,persist,{onFailure:()=>{receipt.reconciliationFailed=true;}});
}
