import { inputIdentity } from './input-identity.mjs';
import { validateNodeEvents } from './validate-node-events.mjs';
import { waitOwnedCommand, throwIfInterrupted, terminalReceipt } from './interruption.mjs';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { comprehensiveGraph } from './comprehensive.mjs';
import { selectTasks, root } from './pathways.mjs';
import { inventoryDigest, atomicJSON } from '../evidence/setup.mjs';
import { coverageReceipt, selectAffected } from '../evidence/graph.ts';
import { releaseAttestation } from './release-attestation.mjs';
import { startDocsServer } from '../../apps/docs/tests/static-server.mjs';
import { startOwnedVite } from './owned-vite.mjs';
import { executionRuntimeIdentity } from './runtime-identity.mjs';
import { browserReusePlan, verifyResidualSelection } from './browser-plan.mjs';
import { validateExecutedFacets } from './validate-facets.mjs';
import { testListLines } from './equivalence.mjs';

const args=process.argv.slice(2);
for(const arg of args)if(!['--plan','--skip-build','--no-browser-reuse','--continue-independent'].includes(arg)&&!arg.startsWith('--pathways='))throw new Error(`Unknown option: ${arg}`);
const requested=(args.find(arg=>arg.startsWith('--pathways='))?.slice(11)??'correctness').split(',');
const graph=await comprehensiveGraph(),selected=selectTasks(graph,requested);
const dependencyGraph={schemaVersion:1,nodes:graph.tasks.map(task=>({id:task.id,kind:task.kind==='producer'?'module':'scenario',dependencies:task.dependencies,complete:task.dependenciesComplete===true}))};
// Validate known graph edges with the existing evidence foundation. No changed-only selection is enabled.
const validation=selectAffected(dependencyGraph,[]);
const unknownEdges=validation.gaps.filter(gap=>gap.startsWith('Unknown dependency'));
if(unknownEdges.length)throw new Error(unknownEdges.join('\n'));
// Incomplete source edges forbid focused/result reuse; the full requested pathway still executes.
if(args.includes('--plan')){
 const plan=JSON.stringify({...graph,requested,continueIndependent:args.includes('--continue-independent'),browserReuse:!args.includes('--no-browser-reuse'),selected:selected.map(task=>task.id),dependencyGraphDigest:validation.graphDigest},null,2)+'\n';
 await new Promise((resolve,reject)=>process.stdout.write(plan,error=>error?reject(error):resolve()));
 process.exit(0);
}
const output=resolve(process.env.EN_EXECUTION_OUTPUT??resolve(root,'artifacts/test-execution',randomUUID()));
await mkdir(dirname(output),{recursive:true});await mkdir(output);
const baseEnv={...process.env,EN_TEST_PIPELINE_OUTPUT:resolve(output,'evidence'),EN_EXECUTION_OWN_SERVERS:'1',PROPERTY_TEST_OUTPUT_DIR:resolve(output,'properties'),SCOPE_TEST_OUTPUT_DIR:resolve(output,'scopes'),EN_PAIR_EVIDENCE:resolve(output,'paired'),EN_REVE_REGISTRATION_EVIDENCE_DIR:resolve(output,'registration'),EN_STICKER_TEST_OUTPUT_DIR:resolve(output,'sticker'),EVIDENCE_DIR:resolve(output,'portability'),EN_AUTHORING_OUTPUT:`node_modules/.cache/authoring-${inventoryDigest(output).slice(7,19)}`,EN_FRAMEWORK_INSTALL_RECEIPT:resolve(output,'framework-install.json'),EN_API_SMOKE_OUTPUT_DIR:resolve(output,'api-examples'),EN_CANDIDATES:resolve(output,'fixtures/candidates'),EN_CANDIDATE_OUTPUT:resolve(output,'candidate-import'),EN_THEME_ASSETS_OUTPUT:resolve(output,'candidate-assets')};
const receipt={schemaVersion:2,run:output,requested,scope:graph.completeness,libraryComplete:false,requestedPathwaysComplete:false,status:'running',
 dependencyGaps:validation.gaps,selectionMode:'full-requested-pathways',continueIndependent:args.includes('--continue-independent'),browserReuse:!args.includes('--no-browser-reuse'),graphDigest:inventoryDigest(graph),dependencyGraphDigest:validation.graphDigest,workers:3,startedAt:new Date().toISOString(),results:[],outcomes:{},pathways:{}};
const started=performance.now();let docs,development,reader,candidate,inputDigest;
const exclude=name=>/(^|\/)(\.cache|\.vite|\.vite-temp|artifacts|results|test-results|playwright-report)(\/|$)/.test(name)||name.endsWith('.tsbuildinfo');
const captureInputs=async(includeSource=false)=>{const phase=await inputIdentity(root,output,{includeSource,exclude});receipt.identityPhases??=[];const evidence=resolve(output,'identity-phases',`${receipt.identityPhases.length+1}.json`);await atomicJSON(evidence,phase);receipt.identityPhases.push({...phase.measurement,evidence});return phase;};
const inputs=async()=>(await captureInputs()).inputs;
const expand=value=>typeof value==='string'?value.replaceAll('$RUN',output).replaceAll('$DOCS_ORIGIN',docs?.url??''):value;
async function execute(task, fulfilled=[task.id]) {
 const directory=resolve(output,'commands',`${String(receipt.results.length+1).padStart(3,'0')}-${task.id.replaceAll(/[^a-zA-Z0-9_-]/g,'_')}`);
 const producerEnv={...process.env};delete producerEnv.EN_EXECUTION_OUTPUT;delete producerEnv.EN_TEST_PIPELINE_OUTPUT;
 const env={...(task.kind==='producer'?producerEnv:baseEnv),...Object.fromEntries(Object.entries(task.environment??{}).map(([key,value])=>[key,expand(value)]))};
 if(task.id.startsWith('direct:'))env.EN_TEST_PIPELINE_OUTPUT=resolve(baseEnv.EN_TEST_PIPELINE_OUTPUT,task.id.replaceAll(/[^a-zA-Z0-9_-]/g,'_'));
 if(docs)Object.assign(env,{EN_REVE_PREVIEW_URL:docs.url+'/',EN_WORKFLOW_BASE_URL:docs.url,EN_DOCS_ORIGIN:docs.url,TOKEN_DOCS_URL:docs.url,EN_PATTERN_GALLERY_URL:docs.url,EN_API_SMOKE_BASE_URL:docs.url,EN_CANDIDATE_ORIGIN:docs.url});
 if(reader) {
  env.EN_READER_ORIGIN=reader.url;
  const configURL=pathToFileURL(resolve(root,'showcases/performance-results/playwright.config.js')).href;
  env.EN_READER_TEST_RECEIPT=resolve(baseEnv.EN_TEST_PIPELINE_OUTPUT,createHash('sha256').update(configURL).digest('hex').slice(0,12),'playwright.json');
 }
 if(task.kind==='development-browser')Object.assign(env,{EN_REVE_PREVIEW_URL:development.url+'/',EN_REVE_HIGHLIGHT_MODE:'development'});
 if(task.id==='direct:highlighting-production')env.EN_REVE_HIGHLIGHT_MODE='production';
 const command=task.command.map(expand);
 throwIfInterrupted();
 const child=spawn('python3',[resolve(root,'tooling/testing/measure.py'),'--out',directory,'--cwd',resolve(root,task.cwd??'.'),'--label',task.id,'--',...command],{cwd:root,env,stdio:'inherit'});
 const code=await waitOwnedCommand(child);
 const measured=JSON.parse(await readFile(resolve(directory,'receipt.json'),'utf8'));
 let nodeFacets;
 if(task.nodeSources){
  try{nodeFacets=validateNodeEvents({events:(await readFile(resolve(output,'node-events.jsonl'),'utf8')).trim().split('\n').map(JSON.parse),sources:task.nodeSources,root});}
  catch(error){nodeFacets={status:'invalid',error:String(error.stack??error)};}
  await atomicJSON(resolve(directory,'node-facets.json'),nodeFacets);
 }

 receipt.results.push({...measured,id:task.id,fulfilled,receipt:resolve(directory,'receipt.json'),...(nodeFacets?{nodeFacets:resolve(directory,'node-facets.json')}: {})});
 for(const id of fulfilled)receipt.outcomes[id]={status:code!==0||nodeFacets&&nodeFacets.status!=='passed'?'failed':'passed',evidence:[resolve(directory,'receipt.json'),...(nodeFacets?[resolve(directory,'node-facets.json')]:[])],originatingRun:output};
 receipt.wallMs=performance.now()-started;await atomicJSON(resolve(output,'execution.json'),receipt);
 if(nodeFacets&&nodeFacets.status!=='passed')throw new Error('Native Node facet qualification failed; retain '+directory);
 if(code!==0)throw new Error(`${task.id} failed; retain ${directory}`);
 return {directory,measured};
}
async function attempt(work,fulfilled,stage) {
 const firstResult=receipt.results.length;
 try{return await work();}
 catch(error){
  // A signal ends the invocation; it must never become an independent-test failure.
  throwIfInterrupted();
  if(!args.includes('--continue-independent'))throw error;
  receipt.failures??=[];
  const failure={stage,fulfilled,error:String(error.stack??error),originatingRun:output};
  const file=resolve(output,'failures',`${receipt.failures.length+1}.json`);
  await atomicJSON(file,failure);receipt.failures.push({...failure,evidence:file});
  for(const id of fulfilled)receipt.outcomes[id]={...receipt.outcomes[id],status:'failed',reason:String(error.message??error),originatingRun:output,
   evidence:[...new Set([...(receipt.outcomes[id]?.evidence??[]),...receipt.results.slice(firstResult).map(result=>result.receipt),file])]};
  receipt.wallMs=performance.now()-started;await atomicJSON(resolve(output,'execution.json'),receipt);
  return null;
 }
}
try {
 // An explicitly requested standalone API view must reject stale metadata before a union build can repair it.
 if(requested.includes('api')&&selected.some(task=>task.id==='metadata')) {
  const check=selected.find(task=>task.id==='check-api');
  if(check)await execute({...check,id:'preflight:standalone-api'},[]);
 }
 // Finish every selected shared producer before any consumer can observe its files.
 for(const task of selected.filter(task=>task.kind==='producer')) {
  if(args.includes('--skip-build') && (task.id.startsWith('build:') || task.id.startsWith('metadata:'))) {
   receipt.outcomes[task.id]={status:'not-run',reason:'Caller explicitly supplied existing build artifacts.',nextAction:'Run without --skip-build for clean build evidence.'};continue;
  }
  await execute(task);
 }
 for(const task of selected.filter(task=>task.kind==='barrier')) {
  const dependencies=task.dependencies.map(id=>receipt.outcomes[id]);
  receipt.outcomes[task.id]=dependencies.every(outcome=>outcome?.status==='passed')
   ? {status:'passed',evidence:[...new Set(dependencies.flatMap(outcome=>outcome.evidence))],originatingRun:output}
   : {status:'not-run',reason:'A required producer was not executed in this lane.',nextAction:'Run without --skip-build for complete build evidence.'};
 }
 if(selected.some(task=>task.kind==='development-browser'))development=await startOwnedVite({root,output:resolve(output,'development-server.log'),env:baseEnv});
 if(selected.some(task=>task.id.includes('showcases/performance-results/')||task.kind==='reader-browser'))reader=await startOwnedVite({root,output:resolve(output,'reader-server.log'),env:baseEnv,workspace:'showcases/performance-results',preview:true});
 const initialPhase=await captureInputs(true);candidate=initialPhase.source;inputDigest=inventoryDigest(initialPhase.inputs);receipt.candidate=candidate;receipt.inputDigest=inputDigest;
 // Root build produces all three required documentation routes; use one owned ephemeral server.
 if(selected.some(task=>task.kind==='built-browser'||task.config?.startsWith('apps/docs/')||task.id==='browser:probes/component-patterns/playwright.config.ts')) {
  docs=await startDocsServer({port:0});receipt.docsOrigin=docs.url;
 }
 const apiCheck=selected.find(task=>task.id==='check-api');
 if(apiCheck)await attempt(()=>execute(apiCheck),[apiCheck.id],apiCheck.id);
 for(const task of selected.filter(task=>task.id!=='check-api'&&['check','types','python'].includes(task.kind)))await attempt(()=>execute(task),[task.id],task.id);
 const units=selected.filter(task=>task.kind==='node');
 if(units.length)await attempt(()=>execute({id:'node-union',nodeSources:units.flatMap(task=>task.assertionSources),command:[process.execPath,'--test','--test-concurrency=3','--test-reporter=tap','--test-reporter-destination=stdout',
  `--test-reporter=${resolve(root,'tooling/testing/node-facet-reporter.mjs')}`,`--test-reporter-destination=${resolve(output,'node-events.jsonl')}`,...units.flatMap(task=>task.assertionSources)]},units.map(task=>task.id)),units.map(task=>task.id),'node-union');
 const browserTasks=selected.filter(task=>task.kind==='browser'),discoveries={},budgets={};
 async function discover(task, extra=[], label='discover:') {
  const result=await execute({...task,id:label+task.id,command:[...task.command,...extra,'--list',`--reporter=${resolve(root,'tooling/testing/selection-reporter.mjs')}`]},[]);
  const lines=(await readFile(resolve(result.directory,'command.log'),'utf8')).split('\n').filter(line=>line.startsWith('EN_EXECUTION_DISCOVERY '));
  if(lines.length!==1)throw new Error('Expected one resolved discovery receipt: '+task.id);
  return JSON.parse(lines[0].slice('EN_EXECUTION_DISCOVERY '.length));
 }
 // Resolve every configuration first; source-name similarities alone never remove execution.
 for(const task of browserTasks) {
  const discovered=await attempt(async()=>{
  let facets=await discover(task);
  if(!Number.isInteger(facets.workers)||facets.workers<1||!facets.selected.length)throw new Error('Invalid resolved worker budget or empty required selection: '+task.id);
  const budget=Math.min(3,facets.workers);
  if(budget!==facets.workers) {
   const bounded=await discover(task,[`--workers=${budget}`],'discover-bounded:');
   if(inventoryDigest(facets.selected)!==inventoryDigest(bounded.selected))throw new Error('Worker bound changed selected facets');
   facets=bounded;
  }
  return {facets,budget};
  },[task.id],'discover:'+task.id);
  if(discovered){discoveries[task.id]=discovered.facets;budgets[task.id]=discovered.budget;}
 }
 const runnableBrowserTasks=browserTasks.filter(task=>discoveries[task.id]);
 receipt.selections=discoveries;
 async function executeBrowser(task,discovery,command=task.command,fulfilled=[task.id]) {
  const url=pathToFileURL(resolve(root,task.config)).href;
  const evidenceDirectory=resolve(baseEnv.EN_TEST_PIPELINE_OUTPUT,createHash('sha256').update(url).digest('hex').slice(0,12));
  const facetFile=resolve(evidenceDirectory,'facets.json'),rawReport=resolve(evidenceDirectory,'playwright.json');
  let result,commandError,facetError,facets;
  try{result=await execute({...task,command},fulfilled);}catch(error){commandError=error;}
  // Keep raw reports from failing configurations too; a failed assertion cannot fulfill a pathway.
  const evidence=[];let rawStats;
  for(const file of [rawReport,facetFile]){
   try{const data=JSON.parse(await readFile(file,'utf8'));evidence.push(file);
    if(file===rawReport)rawStats=data.stats;
    else facets=validateExecutedFacets(discovery,data);
   }catch(error){facetError??=error;}
  }
  for(const id of fulfilled){receipt.outcomes[id]??={status:'failed',evidence:[],originatingRun:output};
   Object.assign(receipt.outcomes[id],{facets,rawReport:evidence.includes(rawReport)?rawReport:null,rawStats});
   receipt.outcomes[id].evidence.push(...evidence);
   if(facetError){receipt.outcomes[id].status='failed';receipt.outcomes[id].facetError=String(facetError.stack??facetError);}
  }
  await atomicJSON(resolve(output,'execution.json'),receipt);
  if(commandError)throw commandError;
  if(facetError)throw facetError;
  return {...result,facetFile,facets};
 }
 const bindings={};
 try {
  receipt.runtime=await executionRuntimeIdentity(root,runnableBrowserTasks.map(task=>({config:task.config,discovery:discoveries[task.id]})));
  for(const task of runnableBrowserTasks)bindings[task.id]={candidateDigest:candidate.sourceDigest,fixtureDigest:inputDigest,browserDigest:receipt.runtime.digest,environmentDigest:discoveries[task.id].environmentDigest};
 } catch(error) {
  receipt.runtimeIdentityGap=String(error.message);
  receipt.failures??=[];receipt.failures.push({stage:'runtime-identity',fulfilled:[],error:String(error.stack??error)});
 }
 const browserPlan=args.includes('--no-browser-reuse')?runnableBrowserTasks.map(task=>({task,mode:'execute-full',reason:'Explicit full-configuration qualification; aliases and residual substitutions disabled'})):browserReusePlan(runnableBrowserTasks,discoveries,bindings);
 receipt.browserPlan=browserPlan.map(item=>({id:item.task.id,mode:item.mode,producer:item.producer?.id??null,reason:item.reason??null}));
 async function executeBrowserItem(item) {
  const {task}=item,budget=budgets[task.id];
  if(item.mode==='execute-full') {await executeBrowser(task,discoveries[task.id],[...task.command,`--workers=${budget}`]);return;}
  // Revalidate the actual prepared inputs at the point where another pathway claims the result.
  if(inputDigest!==inventoryDigest(await inputs()))throw new Error('Candidate inputs changed before browser receipt reference');
  const producerOutcome=receipt.outcomes[item.producer.id];
  if(producerOutcome?.status!=='passed')throw new Error('A browser alias requires this invocation\'s passing producer');
  const proofFile=resolve(output,'aliases',task.id.replaceAll(/[^a-zA-Z0-9_-]/g,'_')+'.json');
  const evidence=[...producerOutcome.evidence,proofFile];
  if(item.mode==='execute-residual') {
   const listFile=proofFile+'.test-list';await mkdir(dirname(listFile),{recursive:true});
   let command,residual;
   try {
    await writeFile(listFile,testListLines(discoveries[task.id],item.proof.remaining),{flag:'wx'});
    residual=await discover(task,[`--workers=${budget}`,'--test-list',listFile],'discover-residual:');
    verifyResidualSelection(item.proof.remaining,residual);
    command=[...task.command,`--workers=${budget}`,'--test-list',listFile];
   } catch(error) {
    receipt.aliasRefusals??=[];receipt.aliasRefusals.push({id:task.id,reason:String(error.message)});
    // A filter that cannot be proven exact falls back to the original complete obligation.
    await executeBrowser(task,discoveries[task.id],[...task.command,`--workers=${budget}`]);return;
   }
   const result=await executeBrowser({...task,id:'residual:'+task.id},residual,command,[]);
   evidence.push(resolve(result.directory,'receipt.json'),result.facetFile);
  }
  await atomicJSON(proofFile,{...item.proof,originatingRun:output,producerEvidence:producerOutcome.evidence});
  receipt.outcomes[task.id]={status:'reused',reuseKind:'same-invocation-browser-reference',originatingRun:output,cacheKey:item.proof.equivalenceDigest,evidence};
  await atomicJSON(resolve(output,'execution.json'),receipt);
 }
 for(const item of browserPlan)await attempt(()=>executeBrowserItem(item),[item.task.id],item.task.id);
 // Direct reader certification follows the complete selected reader receipt, never a partial rerun.
 for(const task of selected.filter(task=>task.id!=='check-api'&&!['producer','barrier','node','browser','check','types','python','release-attestation'].includes(task.kind))){
  const failedDependencies=task.dependencies.filter(id=>receipt.outcomes[id]?.status==='failed');
  if(failedDependencies.length){
   receipt.outcomes[task.id]={status:'not-run',reason:'Required assertion prerequisites failed',dependencies:failedDependencies,nextAction:'Repair and rerun the required prerequisites, then run this certification against their fresh passing receipt.'};
   continue;
  }
  await attempt(()=>execute(task),[task.id],task.id);
 }
 const finalPhase=await captureInputs(true);
 if(inputDigest!==inventoryDigest(finalPhase.inputs))throw new Error('Candidate inputs or built fixtures changed during execution.');
 const sourceAfter=finalPhase.source;receipt.candidateAfter=sourceAfter;
 if(sourceAfter.head!==candidate.head||sourceAfter.sourceDigest!==candidate.sourceDigest)throw new Error('Candidate source changed during the comprehensive command');
 if(receipt.runtime){const after=await executionRuntimeIdentity(root,runnableBrowserTasks.map(task=>({config:task.config,discovery:discoveries[task.id]})));if(after.digest!==receipt.runtime.digest)throw new Error('Actual browser/runtime bytes changed during the comprehensive command');}
 if(selected.some(task=>task.kind==='release-attestation')) {
  const task=selected.find(task=>task.kind==='release-attestation');
  const failedDependencies=task.dependencies.filter(id=>!['passed','reused'].includes(receipt.outcomes[id]?.status)&&!(args.includes('--skip-build')&&receipt.outcomes[id]?.status==='not-run'&&(id==='build'||id==='metadata'||id.startsWith('build:')||id.startsWith('metadata:'))));
  if(failedDependencies.length)receipt.outcomes[task.id]={status:'not-run',reason:'Required release assertions did not pass',dependencies:failedDependencies,nextAction:'Run the complete required release assertions successfully before requesting attestation.'};
  else{
   receipt.release=await releaseAttestation(root,candidate);
   await atomicJSON(resolve(output,'release-attestation.json'),receipt.release);
   receipt.outcomes[task.id]={status:'passed',evidence:[resolve(output,'release-attestation.json')],originatingRun:output};
  }
 }
 const coverage=coverageReceipt(selected.map(task=>task.id),receipt.outcomes);receipt.coverage=coverage;
 const omittedBuildTasks=selected.filter(task=>receipt.outcomes[task.id]?.status==='not-run'&&(task.kind==='barrier'||task.id.startsWith('build:')||task.id.startsWith('metadata:'))).map(task=>task.id);
 receipt.buildEvidence={mode:omittedBuildTasks.length?'caller-supplied-existing-artifacts':selected.some(task=>task.id.startsWith('build:'))?'executed-producers':'not-requested',omitted:omittedBuildTasks,cleanInstallProven:false,buildProducersExecuted:selected.some(task=>task.id.startsWith('build:'))&&omittedBuildTasks.length===0&&!args.includes('--skip-build')};
 const assertions=coverageReceipt(selected.filter(task=>!omittedBuildTasks.includes(task.id)).map(task=>task.id),receipt.outcomes);receipt.assertionCoverage=assertions;
 for(const name of requested)receipt.pathways[name]=graph.pathways[name].map(id=>({id,outcome:receipt.outcomes[id]}));
 receipt.requestedPathwaysComplete=coverage.complete&&!receipt.failures?.length;receipt.status=coverage.complete?'passed':args.includes('--skip-build')&&assertions.complete?'passed-existing-build':'incomplete';
 if(receipt.failures?.length){receipt.status='failed';process.exitCode=1;}
 if(!coverage.complete&&!(args.includes('--skip-build')&&assertions.complete))process.exitCode=1;
} catch(error){
 receipt.status='failed';receipt.requestedPathwaysComplete=false;receipt.error=String(error.stack);process.exitCode=1;
 try{receipt.coverage=coverageReceipt(selected.map(task=>task.id),receipt.outcomes);}
 catch(coverageError){receipt.coverageError=String(coverageError.stack);receipt.coverage={complete:false,checks:receipt.outcomes};}
}
finally{
 for(const server of [reader,development,docs])if(server)try{await server.close();}catch(error){receipt.cleanupErrors??=[];receipt.cleanupErrors.push(String(error.stack));receipt.status='failed';receipt.requestedPathwaysComplete=false;process.exitCode=1;}
}
receipt.finishedAt=new Date().toISOString();
await terminalReceipt(receipt,async()=>{receipt.wallMs=performance.now()-started;await atomicJSON(resolve(output,'execution.json'),receipt);},{
 onCommitted:()=>console.log(`Execution ${receipt.status}: ${output}. Scope: ${receipt.scope}`),
});
