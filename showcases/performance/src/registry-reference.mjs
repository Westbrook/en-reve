import {mkdir,readFile,writeFile,cp,readdir,stat,rename,chmod} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {root,json} from './config.mjs';
import {describe} from './analysis.mjs';
import {registryJobs} from './registry-runner.mjs';

const keys=['scenario','workflow','mode','policy','browser','profile','cache','count','groupSize','root','delivery'];
export const referenceKey=row=>keys.map(key=>String(row[key])).join('/');
const digest=data=>createHash('sha256').update(data).digest('hex');
function requireValue(condition,message){if(!condition)throw new Error(message);}
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const duration=(row,name)=>row.metrics?.measures?.find(entry=>entry.name===name)?.duration;
export function timingMetrics(row){
 const stages=row.scenarioResult?.after?.metrics?.[0]?.stages;
 const action=row.scenarioResult?.action;
 return {
  activationMs:stages?stages.rendered-stages.requested:null,
  requestToReadyMs:duration(row,'registry:request-to-ready')??null,
  moduleLoadMs:duration(row,'registry:module-load')??null,
  cohortReadinessUpperBoundMs:row.scenarioResult?.cohortReadinessUpperBoundMs??null,
  workflowActionUpperBoundMs:action? action.semanticCompletedUpperBound-action.input:null,
 };
}
export function validateReferenceLane(manifest,samples,{kind,minimum}){
 requireValue(['timing','retention'].includes(kind),'Unknown reference lane kind');
 requireValue(Number.isInteger(minimum)&&minimum>=(kind==='timing'?30:5),'Insufficient reference minimum');
 requireValue(Array.isArray(manifest.jobs)&&manifest.jobs.length>0,'Missing planned jobs');
 const expected=new Map(manifest.jobs.map(job=>[job.id,job]));
 requireValue(expected.size===manifest.jobs.length,'Duplicate planned job ID');
 requireValue(samples.length===expected.size,'Incomplete campaign: sample count differs from planned jobs');
 const seen=new Set(),cells=new Map(),versions=new Map();
 for(const row of samples){
  requireValue(expected.has(row.id)&&!seen.has(row.id),'Missing, unplanned or duplicate sample ID');seen.add(row.id);
  const job=expected.get(row.id);
  requireValue(referenceKey(row)===referenceKey(job)&&row.block===job.block,'Sample differs from its planned configuration/block');
  requireValue(row.status==='ok'&&!(row.errors?.length),'Failed or unsupported sample cannot be frozen');
  requireValue(typeof row.browserVersion==='string'&&row.browserVersion.length>0,'Missing browser identity');
  requireValue(!versions.has(row.browser)||versions.get(row.browser)===row.browserVersion,'Browser version changed during lane');versions.set(row.browser,row.browserVersion);
  const key=referenceKey(row);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(row);
  if(kind==='timing'){
   requireValue(row.scenario!=='lifecycle','Retention cannot enter timing distributions');
   const values=timingMetrics(row);
   for(const name of ['activationMs','moduleLoadMs','workflowActionUpperBoundMs'])requireValue(finite(values[name])&&values[name]>=0,'Missing/invalid timing metric: '+name);
   if(row.scenario==='activation')requireValue(finite(values.requestToReadyMs)&&values.requestToReadyMs>=0,'Missing full activation metric');
   if(row.scenario==='scaling')requireValue(finite(values.cohortReadinessUpperBoundMs)&&values.cohortReadinessUpperBoundMs>=0,'Missing cohort readiness metric');
  }else{
   requireValue(row.scenario==='lifecycle','Timing sample in retention lane');
   const points=row.scenarioResult?.samples??[];
   requireValue(JSON.stringify(points.map(point=>point.cycle))===JSON.stringify(manifest.checkpoints),'Missing retention checkpoint');
   for(const point of points){
    requireValue(point.memory?.status==='ok'&&finite(point.memory.jsHeapUsedBytes),'Missing successful retention measurement');
    requireValue(point.state.rows.length===0&&point.state.counters.updatesAfterDispose===0,'Retention left live instances/stale updates');
    for(const name of ['documents','nodes','jsEventListeners'])requireValue(finite(point.memory.dom?.[name]),'Missing DOM retention metric');
   }
  }
 }
 for(const rows of cells.values()){
  requireValue(rows.length>=minimum,'Configuration below required successful sample minimum');
  requireValue(new Set(rows.map(row=>row.block)).size===rows.length,'Duplicate block within configuration');
 }
 return {configurations:cells.size,samples:samples.length,browserVersions:Object.fromEntries(versions),cells:[...cells].map(([key,rows])=>({key,n:rows.length,...(kind==='timing'?{
  metrics:Object.fromEntries(Object.keys(timingMetrics(rows[0])).map(name=>[name,describe(rows.map(row=>timingMetrics(row)[name]))])),
 }: {
  checkpoints:manifest.checkpoints.map((cycle,index)=>({cycle,...Object.fromEntries(['jsHeapUsedBytes','documents','nodes','jsEventListeners'].map(name=>[name,describe(rows.map(row=>{const memory=row.scenarioResult.samples[index].memory;return name==='jsHeapUsedBytes'?memory[name]:memory.dom[name];}))]))})),
  heapGrowth10To100Bytes:describe(rows.map(row=>row.scenarioResult.samples.find(p=>p.cycle===100).memory.jsHeapUsedBytes-row.scenarioResult.samples.find(p=>p.cycle===10).memory.jsHeapUsedBytes)),
 })}))};
}
async function files(directory){
 const result=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=resolve(directory,entry.name);
  requireValue(!entry.isSymbolicLink(),'Cannot freeze symbolic links: '+path);
  if(entry.isDirectory())result.push(...await files(path));else if(entry.isFile())result.push(path);
 }
 return result.sort();
}
export async function verifyReference(directory){
 const manifest=JSON.parse(await readFile(resolve(directory,'checksums.json'),'utf8'));
 const seal=JSON.parse(await readFile(resolve(directory,'seal.json'),'utf8'));
 requireValue(digest(await readFile(resolve(directory,'checksums.json')))===seal.checksumsSha256,'Checksum manifest seal mismatch');
 const actual=(await files(directory)).map(path=>relative(directory,path)).filter(path=>!['checksums.json','seal.json'].includes(path));
 requireValue(JSON.stringify(actual.sort())===JSON.stringify(manifest.files.map(row=>row.path).sort()),'Frozen file inventory differs');
 for(const row of manifest.files){
  const path=resolve(directory,row.path);requireValue(path.startsWith(resolve(directory)+'/'),'Unsafe checksum path');
  const bytes=await readFile(path);requireValue(bytes.length===row.bytes&&digest(bytes)===row.sha256,'Frozen content changed: '+row.path);
 }
 const baseline=JSON.parse(await readFile(resolve(directory,'baseline.json'),'utf8'));
 requireValue(baseline.status==='frozen','Baseline is not frozen');
 return {status:'verified',name:baseline.name,files:manifest.files.length,checksumsSha256:seal.checksumsSha256,timing:baseline.timing,retention:baseline.retention};
}
export async function freezeReference(planPath){
 const plan=JSON.parse(await readFile(planPath,'utf8'));
 requireValue(/^[a-zA-Z0-9_-]+$/.test(plan.name),'Invalid baseline name');
 const target=resolve(root,'baselines',plan.name),staging=target+'.pending';
 requireValue(!(await stat(target).catch(()=>null)),'Baseline already exists; never overwrite a reference');
 await mkdir(staging); // Refuse to reuse an incomplete freeze.
 const summaries=[],sourceIdentities=new Set(),harnessIdentities=new Set(),hostIdentities=new Set(),profileIdentities=new Set(),browserVersions={};
 for(const lane of plan.lanes){
  const run=resolve(root,'runs',lane.args.id);requireValue(run.startsWith(resolve(root,'runs')+'/'),'Invalid run path');
  const manifest=JSON.parse(await readFile(resolve(run,'manifest.json'),'utf8'));
  requireValue(JSON.stringify(manifest.jobs)===JSON.stringify(registryJobs(lane.args).jobs),'Run schedule differs from the approved campaign plan');
  const samples=(await readFile(resolve(run,'samples.jsonl'),'utf8')).trim().split('\n').map(line=>JSON.parse(line));
  const expectedSamples=lane.kind==='timing'?plan.timingMinimum:plan.retentionRepetitions;
  requireValue(samples.length===lane.samples,'Lane differs from campaign sample target');
  const verified=validateReferenceLane(manifest,samples,{kind:lane.kind,minimum:expectedSamples});
  requireValue(verified.configurations===lane.configurations,'Lane differs from campaign configuration target');
  requireValue(manifest.seed===lane.args.seed,'Lane seed differs from saved campaign');
  sourceIdentities.add(digest(json(manifest.identity.sources)));harnessIdentities.add(manifest.harnessSha256);
  hostIdentities.add(json(Object.fromEntries(['platform','release','cpu','node'].map(key=>[key,manifest.host[key]]))));profileIdentities.add(digest(json(manifest.profiles)));
  for(const [engine,version] of Object.entries(verified.browserVersions)){
   requireValue(!browserVersions[engine]||browserVersions[engine]===version,'Browser version differs across campaign');browserVersions[engine]=version;
  }
  summaries.push({name:lane.name,kind:lane.kind,runId:lane.args.id,...verified,host:manifest.host,profiles:manifest.profiles,fixtureFingerprint:manifest.identity.fingerprint,harnessSha256:manifest.harnessSha256});
  await cp(run,resolve(staging,'runs',lane.args.id),{recursive:true});
 }
 requireValue(sourceIdentities.size===1&&harnessIdentities.size===1,'Measured source/harness drift across lanes');
 requireValue(hostIdentities.size===1&&profileIdentities.size===1,'Host or profile identity drift across lanes');
 const sum=(kind,key)=>summaries.filter(l=>l.kind===kind).reduce((n,l)=>n+l[key],0);
 const baseline={schema:1,name:plan.name,status:'frozen',frozenAt:new Date().toISOString(),scope:plan.scope,environment:plan.environment,timing:{configurations:sum('timing','configurations'),successfulSamples:sum('timing','samples'),minimumPerConfiguration:plan.timingMinimum},retention:{configurations:sum('retention','configurations'),successfulRuns:sum('retention','samples'),repetitionsPerConfiguration:plan.retentionRepetitions,checkpoints:[0,10,50,100]},browserVersions,hostIdentity:JSON.parse([...hostIdentities][0]),profileIdentity:[...profileIdentities][0],sourceIdentity:[...sourceIdentities][0],harnessIdentity:[...harnessIdentities][0],lanes:summaries,comparison:'Compare matching full configuration keys and browser/OS/CPU/Node/profile/harness identities. Keep the fixed phase-zero anchor; changes to instrumentation require an overlap study. This instrumented workstation baseline does not establish field or uninstrumented performance.',freeze:'Exclusive destination; complete run/source/HTML/asset receipts; checksummed file inventory; read-only data files. Integrity is verified by the external seal digest, not by filesystem permissions alone.'};
 await writeFile(resolve(staging,'baseline.json'),json(baseline));
 await mkdir(resolve(staging,'freeze-tools'));
 await cp(fileURLToPath(import.meta.url),resolve(staging,'freeze-tools/registry-reference.mjs'));
 await cp(resolve(root,'tests/registry-reference.test.mjs'),resolve(staging,'freeze-tools/registry-reference.test.mjs'));
 await cp(resolve(dirname(planPath)),resolve(staging,'campaign'),{recursive:true,filter:source=>!source.endsWith('/freeze-verification.json')});
 // Node SSR resolves external workspace packages: retain their built outputs and
 // dependency locks alongside the exact archived server HTML and browser bytes.
 const repo=resolve(root,'../..');
 for(const name of ['tokens','styles','primitives','elements','ssr'])await cp(resolve(repo,'packages',name,'dist'),resolve(staging,'workspace-build',name),{recursive:true});
 for(const [name,path] of [['workspace-package-lock.json',resolve(repo,'package-lock.json')],['lab-package-lock.json',resolve(root,'package-lock.json')],['workspace-package.json',resolve(repo,'package.json')],['lab-package.json',resolve(root,'package.json')]])await cp(path,resolve(staging,name));
 const checksums={algorithm:'sha256',files:[]};
 for(const path of await files(staging)){const bytes=await readFile(path);checksums.files.push({path:relative(staging,path),bytes:bytes.length,sha256:digest(bytes)});}
 await writeFile(resolve(staging,'checksums.json'),json(checksums));
 await writeFile(resolve(staging,'seal.json'),json({algorithm:'sha256',checksumsSha256:digest(await readFile(resolve(staging,'checksums.json')))}));
 await verifyReference(staging);
 for(const path of await files(staging))await chmod(path,0o444);
 await rename(staging,target);
 return verifyReference(target);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,path]=process.argv.slice(2);
 if(command==='freeze')console.log(json(await freezeReference(resolve(path))));
 else if(command==='verify')console.log(json(await verifyReference(resolve(path))));
 else throw new Error('Usage: registry-reference.mjs freeze campaign-plan.json | verify baseline-directory');
}
