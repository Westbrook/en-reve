import {registerHooks} from 'node:module';
const data=source=>'data:text/javascript,'+encodeURIComponent(source);
const common=data(`
 import {appendFileSync} from 'node:fs';
 import {setTimeout} from 'node:timers/promises';
 export const trace=value=>appendFileSync(process.env.EN_FINAL_TRACE,JSON.stringify(value)+'\\n');
 let delivered=false;
 export async function checkpoint(phase){
  trace({event:phase});
  if(!delivered&&process.env.EN_FINAL_PHASE===phase){delivered=true;process.kill(process.pid,process.env.EN_FINAL_SIGNAL??'SIGTERM');await setTimeout(20);}
 }
 let captures=0;
 export async function identity(){
  captures++;
  if(captures===(process.env.EN_FINAL_MODE==='public'?1:2))await checkpoint('identity');
  return {head:'fixture-head',sourceDigest:'fixture-source'};
 }
 export const graph={tasks:process.env.EN_FINAL_PHASE==='server-close'?[{id:'showcases/performance-results/control',kind:'barrier',dependencies:[]}]:[],pathways:{correctness:[],api:[],release:[],theme:[]},completeness:'regression-fixture'};
`);
const commonImport=`import {checkpoint,trace,identity,graph} from ${JSON.stringify(common)};`;
const actualSetup=new URL('../../evidence/setup.mjs?terminal-real',import.meta.url).href;
const modules=new Map([
 ['pathways.mjs',`${commonImport} export const root=process.env.EN_FINAL_ROOT;export const selectTasks=g=>g.tasks;export const publicGraph=async()=>graph;`],
 ['comprehensive.mjs',`${commonImport} export const comprehensiveGraph=async()=>graph;`],
 ['input-identity.mjs',`${commonImport} export const inputIdentity=async()=>({source:await identity(),inputs:{stable:true},measurement:{fixture:true}});`],
 ['public-views.mjs',`export const publicViewPlan=()=>({view:{pathway:'fixture'},scope:'fixture',buildEvidence:{},plan:[]});`],
 ['public-view-output.mjs',`export const publicViewOutput=()=>({output:process.env.EN_EXECUTION_OUTPUT,environment:{EN_TEST_PIPELINE_CONFIG_OUTPUTS:'{}'}});`],
 ['setup.mjs',`${commonImport}
  import {atomicJSON as actual,inventoryDigest} from ${JSON.stringify(actualSetup)};export {inventoryDigest};
  let failed=false;
  export async function atomicJSON(path,value){
   const snapshot=structuredClone(value);
   if(path.endsWith('/execution.json')&&value.status!=='running'){
    await checkpoint('publication');
    if(process.env.EN_FINAL_PHASE==='publication-error'&&!failed){failed=true;throw Error('injected-publication-error');}
   }
   await actual(path,snapshot);trace({event:'write',path,status:snapshot.status});
  }`],
 ['graph.ts',`export const selectAffected=()=>({gaps:[],graphDigest:'fixture'});export const coverageReceipt=()=>({complete:true});`],
 ['release-attestation.mjs',`${commonImport} export const sourceIdentity=identity;export const releaseAttestation=async()=>({});`],
 ['node-command.mjs',`export const withNodeFacetReporter=command=>command;`],
 ['validate-node-events.mjs',`export const validateNodeEvents=()=>{throw Error('Unexpected Node facet validation')};`],
 ['runtime-identity.mjs',`export const executionRuntimeIdentity=async()=>({digest:'fixture'});`],
 ['browser-plan.mjs',`export const browserReusePlan=()=>[];export const verifyResidualSelection=()=>{throw Error('Unexpected browser selection')};`],
 ['validate-facets.mjs',`export const validateExecutedFacets=()=>{throw Error('Unexpected browser execution')};`],
 ['equivalence.mjs',`export const testListLines=()=>{throw Error('Unexpected test-list generation')};`],
 ['owned-vite.mjs',`${commonImport}
  import {createServer} from 'node:http';
  export async function startOwnedVite(){
   const server=createServer((req,res)=>res.end('fixture'));
   await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
   trace({event:'server-started'});
   return {url:'http://127.0.0.1:'+server.address().port,async close(){await checkpoint('server-close');await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));trace({event:'server-closed',listening:server.listening});}};
  }`],
 ['static-server.mjs',`export const startDocsServer=()=>{throw Error('Unexpected docs server')};`],
 ['owned-service.mjs',`export const startOwnedService=()=>{throw Error('Unexpected service')};`],
 ['owned-report.mjs',`export const startOwnedReport=()=>{throw Error('Unexpected report')};`],
 ['specialized.mjs',`export const specializedPathways=async()=>({manual:[]});`],
 ['specialized-selection.mjs',`export const specializedSelection=()=>({plan:[],requested:['fixture'],pathwayTasks:{fixture:[]},requiredInputs:[]});export const specializedCoverage=(selection,results,{reconciliationFailed})=>({fixture:{complete:!reconciliationFailed}});`],
 ['native-workspaces.mjs',`export const nativeWorkspaceRouting=()=>{throw Error('Unexpected native routing')};export const workspaceOwnerDisposition=()=>{throw Error('Unexpected workspace owner')};`],
 ['lock.mjs',`export const exclusiveBrowserWork=work=>work();`],
 ['machine-owner.mjs',`${commonImport} export async function withMachineOwner(work){try{return await work();}finally{await checkpoint('machine-release');trace({event:'machine-released'});}}`],
 ['execution-owner.mjs',`${commonImport} export async function withExecutionOwner(root,work){try{return await work();}finally{await checkpoint('execution-release');trace({event:'execution-released'});}}export const recoverExecutionOwner=()=>{throw Error('Unexpected recovery')};`],
].map(([name,source])=>[name,data(source)]));
registerHooks({resolve(specifier,context,next){
 if(specifier.endsWith('?terminal-real'))return next(specifier,context);
 const url=modules.get(specifier.split('/').at(-1));
 return url?{url,shortCircuit:true}:next(specifier,context);
}});
