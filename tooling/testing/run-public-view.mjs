import { inputIdentity } from './input-identity.mjs';
import { withNodeFacetReporter } from './node-command.mjs';
import { validateNodeEvents } from './validate-node-events.mjs';
import { waitOwnedCommand, throwIfInterrupted, terminalReceipt } from './interruption.mjs';
import { createRequire } from 'node:module';
import { executionRuntimeIdentity } from './runtime-identity.mjs';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { comprehensiveGraph } from './comprehensive.mjs';
import { publicViewPlan } from './public-views.mjs';
import { publicViewOutput } from './public-view-output.mjs';
import { root } from './pathways.mjs';
import { atomicJSON, inventoryDigest } from '../evidence/setup.mjs';
import { releaseAttestation } from './release-attestation.mjs';
import { startDocsServer } from '../../apps/docs/tests/static-server.mjs';
import { startOwnedVite } from './owned-vite.mjs';
import { validateExecutedFacets } from './validate-facets.mjs';

const args=process.argv.slice(2),separator=args.indexOf('--');
const own=separator<0?args:args.slice(0,separator),forwarded=separator<0?[]:args.slice(separator+1);
for(const arg of own)if(arg!=='--plan'&&arg!=='--skip-build'&&!arg.startsWith('--view='))throw new Error('Unknown public-view option: '+arg);
const id=own.find(arg=>arg.startsWith('--view='))?.slice(7);if(!id)throw new Error('A public command view is required');
const skipIndex=forwarded.indexOf('--skip-build');
const skipBuild=own.includes('--skip-build')||skipIndex>=0;
if(skipIndex>=0)forwarded.splice(skipIndex,1);
const graph=await comprehensiveGraph();
const selection=publicViewPlan(graph,id,{root,forwarded,skipBuild});
if(own.includes('--plan')){
 await new Promise((resolve,reject)=>process.stdout.write(JSON.stringify(selection,null,2)+'\n',error=>error?reject(error):resolve()));
 process.exit(0);
}
const outputPolicy=publicViewOutput(root,id),output=outputPolicy.output;
await mkdir(dirname(output),{recursive:true});
try{await mkdir(output);}catch(error){if(error.code==='EEXIST')throw new Error('A fresh evidence directory is required; retain the existing public-command receipts: '+output);throw error;}
const baseEnvironment={...process.env,...outputPolicy.environment,EN_EXECUTION_OWN_SERVERS:'1'};
const receipt={schemaVersion:2,kind:'public-command-view',view:id,pathway:selection.view.pathway,scope:selection.scope,buildEvidence:selection.buildEvidence,libraryComplete:false,run:output,status:'running',workers:3,startedAt:new Date().toISOString(),graphDigest:inventoryDigest(graph),selection,results:[],outcomes:{}};
const start=performance.now();let docs,reader,candidate;
const runtimeBindings=new Map();
const excludeInput=name=>/(^|\/)(\.cache|\.vite|\.vite-temp|artifacts|results|test-results|playwright-report)(\/|$)/.test(name)||name.endsWith('.tsbuildinfo');
const captureInputs=async(includeSource=false)=>{const phase=await inputIdentity(root,output,{includeSource,exclude:excludeInput});receipt.identityPhases??=[];const evidence=resolve(output,'identity-phases',`${receipt.identityPhases.length+1}.json`);await atomicJSON(evidence,phase);receipt.identityPhases.push({...phase.measurement,evidence});return phase;};
const fixtureInputs=async()=>(await captureInputs()).inputs;
let fixtureDigest;
const expand=value=>typeof value==='string'?value.replaceAll('$RUN',output):value;
const configOutput=task=>{
 const url=pathToFileURL(resolve(root,task.config)).href;
 const mapped=JSON.parse(outputPolicy.environment.EN_TEST_PIPELINE_CONFIG_OUTPUTS)[url];
 return mapped??resolve(outputPolicy.environment.EN_TEST_PIPELINE_OUTPUT,createHash('sha256').update(url).digest('hex').slice(0,12));
};
async function save(){
 receipt.wallMs=performance.now()-start;await atomicJSON(resolve(output,'execution.json'),receipt);
 if(id==='root#test:theme')await atomicJSON(resolve(output,'results.json'),{...receipt,build:skipBuild?'caller-supplied':'included'});
 if(id==='root#test:release')await atomicJSON(resolve(output,'verification.json'),receipt);
}
async function execute(task,{command=task.command,label=task.id,discovery=false}={}){
 const directory=resolve(output,'commands',`${String(receipt.results.length+1).padStart(3,'0')}-${label.replaceAll(/[^a-zA-Z0-9_-]/g,'_')}`);
 const env={...baseEnvironment,...Object.fromEntries(Object.entries(task.environment??{}).map(([key,value])=>[key,expand(value)]))};
 if(docs)Object.assign(env,{EN_WORKFLOW_BASE_URL:docs.url,EN_DOCS_ORIGIN:docs.url,EN_REVE_PREVIEW_URL:docs.url+'/',EN_PATTERN_GALLERY_URL:docs.url,TOKEN_DOCS_URL:docs.url});
 if(reader)env.EN_READER_ORIGIN=reader.url;
 let actual=command.map(expand);
 const callerNodeSelection=selection.scope==='caller-selected-public-command'&&task===selection.plan.at(-1);
 const nodeEvents=['node','node-group'].includes(task.kind)?resolve(directory,'node-events.jsonl'):null;
 if(nodeEvents)actual=withNodeFacetReporter(actual,{reporter:resolve(root,'tooling/testing/node-facet-reporter.mjs'),destination:nodeEvents});
 throwIfInterrupted();
 const child=spawn('python3',[resolve(root,'tooling/testing/measure.py'),'--out',directory,'--cwd',resolve(root,task.cwd??'.'),'--label',label,'--',...actual],{cwd:root,env,stdio:'inherit'});
 const code=await waitOwnedCommand(child);
 const measured=JSON.parse(await readFile(resolve(directory,'receipt.json'),'utf8'));
 let nodeFacets;
 if(nodeEvents){
  try{nodeFacets=validateNodeEvents({events:(await readFile(nodeEvents,'utf8')).trim().split('\n').map(JSON.parse),sources:task.assertionSources,root,allowSourceSelection:callerNodeSelection});}
  catch(error){nodeFacets={status:'invalid',error:String(error.stack??error)};}
  await atomicJSON(resolve(directory,'node-facets.json'),nodeFacets);
 }

 receipt.results.push({...measured,id:label,fulfilled:discovery?[]:task.fulfilled,evidence:resolve(directory,'receipt.json'),...(nodeFacets?{nodeFacets:resolve(directory,'node-facets.json')}: {})});
 if(!discovery)for(const id of task.fulfilled)receipt.outcomes[id]={status:code!==0?'failed':nodeFacets&&nodeFacets.status!=='passed'?'passed-with-facet-gap':'passed',evidence:[resolve(directory,'receipt.json'),...(nodeFacets?[resolve(directory,'node-facets.json')]:[])],originatingRun:output};
 if(nodeFacets&&callerNodeSelection)for(const id of task.fulfilled){
  const outcome=receipt.outcomes[id];outcome.scope='caller-selected-public-command';outcome.fullObligationFulfilled=false;
  const required=graph.tasks.find(item=>item.id===id)?.assertionSources??task.assertionSources;
  if(required.every(source=>nodeFacets.unexecutedSources?.includes(source))){outcome.status='not-run-caller-selection';outcome.reason='Explicit caller arguments did not execute this source; no original obligation is fulfilled.';}
 }
 await save();if(nodeFacets&&nodeFacets.status!=='passed')throw new Error('Native Node facet qualification failed; retain '+directory);if(code!==0)throw new Error('Public command failed; retain '+directory);
 return directory;
}
try{
 for(const task of selection.plan){
  throwIfInterrupted();
  if(task.kind==='producer'){
   if(fixtureDigest&&fixtureDigest!==inventoryDigest(await fixtureInputs()))throw new Error('Public-command inputs changed before the next explicit producer');
   await execute(task);
   // Some original standalone commands check types before preparing their browser fixture.
   // Keep that ordering and bind each immutable consumer phase to its actual producer.
   if(candidate){
    const previous=fixtureDigest;fixtureDigest=inventoryDigest(await fixtureInputs());
    receipt.inputPhases??=[];receipt.inputPhases.push({producer:task.id,previousDigest:previous,inputDigest:fixtureDigest,evidence:receipt.results.at(-1).evidence});
   }
   continue;
  }
  if(!candidate&&task.kind!=='producer'){const phase=await captureInputs(true);candidate=phase.source;receipt.candidate=candidate;fixtureDigest=inventoryDigest(phase.inputs);receipt.inputDigest=fixtureDigest;}
  if(task.kind==='release-attestation'){
   const attestation=await releaseAttestation(root,candidate);Object.assign(receipt,attestation);
   await atomicJSON(resolve(output,'release-attestation.json'),attestation);
   receipt.outcomes[task.id]={status:'passed',evidence:[resolve(output,'release-attestation.json')],originatingRun:output};continue;
  }
  const browserInformation=task.kind==='browser'&&task.command.some(arg=>['--list','--help','-h','--version','-V'].includes(arg));
  const needsDocs=!browserInformation&&(task.kind==='built-browser'||task.config?.startsWith('apps/docs/'));
  if(needsDocs&&!docs&&!process.env.EN_WORKFLOW_BASE_URL&&!process.env.EN_DOCS_ORIGIN&&!process.env.EN_REVE_PREVIEW_URL){docs=await startDocsServer({port:0});receipt.docsOrigin=docs.url;}
  if(!browserInformation&&task.config?.startsWith('showcases/performance-results/')&&!reader&&!process.env.EN_READER_ORIGIN){reader=await startOwnedVite({root,output:resolve(output,'reader-server.log'),env:baseEnvironment,workspace:'showcases/performance-results',preview:true});receipt.readerOrigin=reader.url;}
  if(task.kind!=='browser'){await execute(task);continue;}
  if(task.command.some(arg=>['--help','-h','--version','-V'].includes(arg))){
   await execute(task,{discovery:true});
   receipt.outcomes[task.id]={status:'informational',reason:'Caller requested CLI information; no assertion obligation is fulfilled.'};continue;
  }
  if(task.command.includes('--list')){
   await execute(task,{command:[...task.command,'--reporter=list'],discovery:true});
   receipt.outcomes[task.id]={status:'discovered',reason:'Caller requested discovery; no passing assertion receipt is inferred.'};continue;
  }
  const discovered=await execute(task,{command:[...task.command,'--list',`--reporter=${resolve(root,'tooling/testing/selection-reporter.mjs')}`],label:'discover:'+task.id,discovery:true});
  const lines=(await readFile(resolve(discovered,'command.log'),'utf8')).split('\n').filter(line=>line.startsWith('EN_EXECUTION_DISCOVERY '));
  if(lines.length!==1)throw new Error('Expected one stdout-only resolved discovery envelope');
  let resolved=JSON.parse(lines[0].slice('EN_EXECUTION_DISCOVERY '.length));
  if(!Number.isInteger(resolved.workers)||resolved.workers<1)throw new Error('Invalid resolved worker budget');
  const explicitBudget=selection.forwarded.some(arg=>arg==='--workers'||arg.startsWith('--workers='));
  const budget=explicitBudget?resolved.workers:Math.min(3,resolved.workers);
  if(budget!==resolved.workers){
   const bounded=await execute(task,{command:[...task.command,`--workers=${budget}`,'--list',`--reporter=${resolve(root,'tooling/testing/selection-reporter.mjs')}`],label:'discover-bounded:'+task.id,discovery:true});
   const envelopes=(await readFile(resolve(bounded,'command.log'),'utf8')).split('\n').filter(line=>line.startsWith('EN_EXECUTION_DISCOVERY '));
   if(envelopes.length!==1)throw new Error('Expected one bounded discovery envelope');
   const actual=JSON.parse(envelopes[0].slice('EN_EXECUTION_DISCOVERY '.length));
   if(inventoryDigest(actual.selected)!==inventoryDigest(resolved.selected))throw new Error('Worker limit changed the required public selection');
   resolved=actual;
  }
  receipt.workers=Math.max(receipt.workers,budget);
  receipt.selections??={};receipt.selections[task.id]=resolved;
  const runtimeKey=inventoryDigest({runner:createRequire(resolve(root,task.config)).resolve('@playwright/test/package.json'),projects:resolved.projects.map(project=>({browserName:project.use?.browserName??'chromium',channel:project.use?.channel??null,launchOptions:project.use?.launchOptions??null,connectOptions:project.use?.connectOptions??null,browserProduct:project.metadata?.browserProduct??null}))});
  if(!runtimeBindings.has(runtimeKey)){
   try{runtimeBindings.set(runtimeKey,{config:task.config,discovery:resolved,identity:await executionRuntimeIdentity(root,[{config:task.config,discovery:resolved}])});}
   catch(error){receipt.runtimeIdentityGaps??=[];receipt.runtimeIdentityGaps.push({id:task.id,error:String(error.message)});}
  }
  receipt.runtimeBindings=Object.fromEntries([...runtimeBindings].map(([key,value])=>[key,value.identity]));
  receipt.runtimeKeys??={};receipt.runtimeKeys[task.id]=runtimeBindings.has(runtimeKey)?runtimeKey:null;
  await execute(task,{command:[...task.command,`--workers=${budget}`]});
  // Explicit reporter overrides remain usable, but do not fabricate missing execution outcomes.
  try{
   const report=JSON.parse(await readFile(resolve(configOutput(task),'playwright.json'),'utf8'));
   const facets=JSON.parse(await readFile(resolve(configOutput(task),'facets.json'),'utf8'));
   receipt.outcomes[task.id].facets=validateExecutedFacets(resolved,facets);
   receipt.outcomes[task.id].playwrightStats=report.stats;
   receipt.outcomes[task.id].evidence.push(resolve(configOutput(task),'playwright.json'),resolve(configOutput(task),'facets.json'));
  }catch(error){if(error.code!=='ENOENT')throw error;receipt.outcomes[task.id].executionFacetGap='Caller reporter override or missing browser receipt; this cannot fulfil a comprehensive assertion obligation.';}
 }
 for(const binding of runtimeBindings.values()){const after=await executionRuntimeIdentity(root,[binding]);if(after.digest!==binding.identity.digest)throw new Error('Actual browser/runtime bytes changed during the public command');}
 const finalPhase=await captureInputs(true);
 if(fixtureDigest&&fixtureDigest!==inventoryDigest(finalPhase.inputs))throw new Error('Public-command source/build/fixture/dependency bytes changed during execution');
 receipt.finalInputDigest=fixtureDigest;
 const after=finalPhase.source;
 if(candidate&&(after.sourceDigest!==candidate.sourceDigest||after.head!==candidate.head))throw new Error('Public-command candidate source changed during execution');
 receipt.status=Object.values(receipt.outcomes).some(outcome=>outcome.status==='informational')?'informational':Object.values(receipt.outcomes).some(outcome=>outcome.status==='discovered')?'discovered':(receipt.runtimeIdentityGaps?.length||Object.values(receipt.outcomes).some(outcome=>outcome.executionFacetGap))?'passed-with-facet-gap':'passed';
}catch(error){receipt.status='failed';receipt.error=String(error.stack);process.exitCode=1;}
finally{for(const server of [reader,docs])if(server)try{await server.close();}catch(error){receipt.cleanupErrors??=[];receipt.cleanupErrors.push(String(error.stack));receipt.status='failed';process.exitCode=1;}}
receipt.finishedAt=new Date().toISOString();
await terminalReceipt(receipt,save,{onCommitted:()=>console.log(`Public command ${id}: ${receipt.status}. Retained evidence: ${output}`)});
