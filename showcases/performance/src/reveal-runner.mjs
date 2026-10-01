import {chromium,firefox,webkit} from '@playwright/test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,readFile,writeFile,appendFile,cp} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import os from 'node:os';
import {root,profiles,rng,shuffle,sha,json} from './config.mjs';
import {summarizeTiming,summarizeRetention,qualificationAgreement} from './reveal-analysis.mjs';
import {startRevealFixture,verifyRevealFixture} from './reveal-fixture.mjs';
import {runRevealRetention,qualifyRevealRetention} from './reveal-retention.mjs';
import {retentionAcceptance, OBSERVED_DOCUMENT_MOTION, validateRetentionAddendum, retentionReceiptIssues} from './reveal-retention-acceptance.mjs';
import {createContentionMonitor} from './reveal-contention.mjs';
import {validateAdmission} from './reveal-admission.mjs';
import {archiveBoundDiff,verifyCanonicalDiff,digestFile,sourceVerificationPolicy} from './reveal-source-binding.mjs';
import {source} from '../../../tooling/integration-gates/runner.mjs';
import {acquireResources} from '../../../tooling/integration-gates/resources.mjs';

const execFileAsync=promisify(execFile),require=createRequire(import.meta.url),engines={chromium,firefox,webkit},repo=resolve(root,'../..');
const configurations=[{browser:'chromium',profile:'desktop'},{browser:'firefox',profile:'desktop'},{browser:'webkit',profile:'desktop'},{browser:'chromium',profile:'mobile'}];
const policyNames=['frames','timeoutMs','stableFrames','alignmentTolerancePx','idleFrames','maximumMountedRows','geometryEquality','observerOffWaitMs'];
const samePolicy=(a,b)=>policyNames.every(name=>a[name]===b[name])&&Object.keys(a).length===policyNames.length&&Object.keys(b).length===policyNames.length;
const lockPath=path=>['package-lock.json','showcases/performance/package-lock.json'].includes(path);
const harnessPath=path=>path.startsWith('showcases/performance/src/reveal-')||path.startsWith('showcases/performance/fixtures/reveal/')||['showcases/performance/src/config.mjs','showcases/performance/src/analysis.mjs','showcases/performance/src/prepare.mjs','showcases/performance/profiles/profiles.json','tooling/integration-gates/runner.mjs','tooling/integration-gates/resources.mjs'].includes(path);
function jobsFor(mode,seed){
  const random=rng(seed),cells=[],jobs=[];
  for(const workload of ['activity','document'])for(const arm of ['reference','candidate'])for(const configuration of mode==='retention'?[configurations[0]]:configurations){
    for(const observer of mode==='qualify'?['off','on']:['on'])cells.push({workload,arm,...configuration,observer,lane:mode==='retention'?'retention':'timing'});
  }
  if(mode==='qualify')for(const workload of ['activity','document'])for(const arm of ['reference','candidate'])cells.push({workload,arm,...configurations[0],observer:'retention-only',lane:'retention-qualification'});
  for(let block=0;block<(mode==='timing'?30:mode==='retention'?5:1);block++)for(const cell of shuffle(cells,random))jobs.push({...cell,block,id:String(jobs.length+1).padStart(4,'0')});
  return jobs;
}
function metricDelta(before,after){
  if(!before||!after)return {status:'unsupported',reason:'Chromium CDP diagnostic unavailable; never zero'};
  const values={};for(const name of ['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration']){const a=before.find(x=>x.name===name)?.value,b=after.find(x=>x.name===name)?.value;values[name]=Number.isFinite(a)&&Number.isFinite(b)?b-a:null;}
  return {status:Object.values(values).every(Number.isFinite)?'ok':'incomplete',values,scope:'Aggregate joint first/repeat browser sequence and final eight-frame idle check, including observer reads. No host/CDP round trip between actions.'};
}
async function sample(job,{url,policy,monitor,qualifiedBinding,acceptance}){
  const result={...job,status:'running',startedAt:new Date().toISOString(),errors:[],actionRequests:[],environmentBefore:{load:os.loadavg(),freeMemory:os.freemem()}};
  let browser,collectRequests=false,abortClose;
  const onAbort=()=>{result.errors.push({type:'contention',reason:monitor.signal.reason});if(browser)abortClose=browser.close().catch(error=>result.errors.push({type:'abort-close',message:String(error)}));};
  monitor.signal.addEventListener('abort',onAbort,{once:true});
  try{
    monitor.assertHealthy();browser=await engines[job.browser].launch({headless:true});monitor.assertHealthy();result.browserVersion=browser.version();
    if(qualifiedBinding&&result.browserVersion!==qualifiedBinding.browserVersions[job.browser])throw Error('Browser version differs from qualification');
    const profile=profiles[job.profile],context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,serviceWorkers:'block',reducedMotion:'no-preference'});
    const page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',error=>result.errors.push({type:'pageerror',message:error.message}));
    page.on('requestfailed',request=>result.errors.push({type:'requestfailed',url:request.url(),message:request.failure()?.errorText}));
    page.on('response',response=>{if(response.status()>=400)result.errors.push({type:'http',status:response.status(),url:response.url()});});
    page.on('request',request=>{if(collectRequests)result.actionRequests.push(request.url());});
    const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
    if(cdp){await cdp.send('Performance.enable');await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpuRate});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.upload});}
    const response=await page.goto(url,{waitUntil:'load'});if(!response?.ok())throw Error('Fixture navigation failed');
    await page.waitForFunction(()=>window.revealFixture?.ready||window.revealFixtureError);
    result.fixture=await page.evaluate(()=>({error:window.revealFixtureError??null,workload:window.revealFixture.workload,version:window.revealFixture.observationVersion,policy:window.revealFixture.timingPolicy,registry:window.revealFixture.registry(),prepared:window.revealFixture.snapshot()}));
    if(result.fixture.error)throw Error(result.fixture.error);
    if(result.fixture.workload!==job.workload||!samePolicy(result.fixture.policy,policy))throw Error('Workload/observation policy mismatch');
    if(result.fixture.prepared.mounted>policy.maximumMountedRows){result.invalidEligibility='mounted-row safety bound at readiness';throw Error(result.invalidEligibility);}
    const capabilityKey=[job.workload,job.browser,job.profile].join('/');
    if(qualifiedBinding&&JSON.stringify(result.fixture.registry)!==JSON.stringify(qualifiedBinding.capabilities[capabilityKey]))throw Error('Registry capability differs from qualification');
    if(result.errors.length)throw Error('Readiness errors');
    collectRequests=true;monitor.assertHealthy();
    if(job.lane.startsWith('retention')){
      result.retention=job.lane==='retention'?await runRevealRetention(page,job.workload,{cdp,checkpoints:[0,10,50,100],acceptance}):await qualifyRevealRetention(page,job.workload,{cdp,acceptance});
      result.status=result.retention.status;
      if(result.status==='ok'){const issues=retentionReceiptIssues(result.retention,acceptance,job.lane==='retention'?100:4,job.workload);result.retentionEvidence={status:issues.length?'failed':'passed',issues};if(issues.length)throw Error('Retention acceptance evidence incomplete: '+issues.join('; '));}
      if(result.retention.requiresBrowserClose)throw Error('Uncertain retention operation; close browser without further page work');
    }else{
      let before=null,metricError=null;try{if(cdp)before=(await cdp.send('Performance.getMetrics')).metrics;}catch(error){metricError=String(error);}
      const pair=await page.evaluate(observer=>window.revealFixture.measurePair(observer),job.observer==='on');
      result.pair=pair;result.actions=pair.actions;result.status=pair.status;
      try{const after=cdp?(await cdp.send('Performance.getMetrics')).metrics:null;result.layout=metricError?{status:'incomplete',reason:metricError}:metricDelta(before,after);}catch(error){result.layout={status:'incomplete',reason:String(error)};}
    }
    collectRequests=false;monitor.assertHealthy();result.resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>entry.toJSON()));
    if(result.errors.length||result.actionRequests.length)result.status='failed';
  }catch(error){result.status='failed';result.errors.push({type:'runner',message:String(error.stack??error)});}
  finally{monitor.signal.removeEventListener('abort',onAbort);try{await abortClose;await browser?.close();}catch(error){result.status='failed';result.errors.push({type:'browser-cleanup',message:String(error.stack??error)});}}
  result.finishedAt=new Date().toISOString();return result;
}
async function readBoundFile(spec,name){if(!spec?.path||!/^[a-f0-9]{64}$/.test(spec.sha256??''))throw Error('Hash-bound '+name+' required');const bytes=await readFile(spec.path);if(sha(bytes)!==spec.sha256)throw Error(name+' changed');return bytes;}
async function verifyAndRecordSource(current,verify,save){
  current.status='running';await save();let comparison;
  try{comparison=await verify();Object.assign(current,comparison.verification);await save();return comparison;}
  catch(error){
    const detail=error.sourceVerification??comparison?.verification;
    Object.assign(current,detail??{},{status:'failed',...(comparison?{receiptFailure:String(error.stack??error)}:{error:String(error.stack??error)})});
    try{await save();}catch(receiptError){const combined=new AggregateError([error,receiptError],'Source verification receipt could not be persisted',{cause:error});combined.sourceVerification=detail;throw combined;}
    if(detail)error.sourceVerification=detail;throw error;
  }
}
async function archiveFunctionalEligibility(spec,manifest,directory){
  const bytes=await readBoundFile(spec,'coordinator functional eligibility'),review=JSON.parse(bytes),artifacts=[];
  if(review.schema!==1||review.status!=='reviewed-eligible'||review.scope!=='normal-comparative-paths-only'||!review.reviewerNote||!review.candidateQualifiedProductCommit||review.arms?.length!==2)throw Error('Explicit per-study coordinator functional eligibility required');
  await writeFile(resolve(directory,'functional-eligibility.json'),bytes);artifacts.push({path:'functional-eligibility.json',sha256:sha(bytes)});
  const archive=async(bound,path,name)=>{const value=await readBoundFile(bound,name);const output=resolve(directory,path);await mkdir(dirname(output),{recursive:true});await writeFile(output,value);artifacts.push({path,sha256:sha(value)});return value;};
  const verification={schema:1,policy:manifest.sourceVerification,arms:manifest.arms.map(arm=>({armId:arm.id,status:'not-run'}))};
  const saveVerification=()=>writeFile(resolve(directory,'source-verification.json'),json(verification));
  await saveVerification();
  for(const arm of manifest.arms){
    const row=review.arms.find(item=>item.id===arm.id);
    if(!row||review.arms.filter(item=>item.id===arm.id).length!==1||JSON.stringify(row.armSource)!==JSON.stringify(arm.identity.source)||!row.sourceEquivalenceReview||!Array.isArray(row.actualOutcomes)||!row.actualOutcomes.length||!Array.isArray(row.expectedReferenceFailures)||!Array.isArray(row.capabilityExclusions)||!Array.isArray(row.rawReceipts)||!row.rawReceipts.length)throw Error('Incomplete exact-arm functional source/outcome mapping: '+arm.id);
    const tested=JSON.parse(await archive(row.testedSourceReceipt,`functional/${arm.id}-tested-source.json`,'actual tested source receipt'));
    if(tested.commit!==row.testedCommit||tested.worktreeStatus!==''||!tested.tree||!tested.sha256||!Array.isArray(tested.files))throw Error('Functional tested-source identity mismatch');
    const actualTree=(await execFileAsync('git',['-C',repo,'rev-parse',tested.commit+'^{tree}'],{timeout:10000,maxBuffer:1024*1024})).stdout.trim();
    if(tested.tree!==actualTree||(arm.id==='candidate'&&review.candidateQualifiedProductCommit!==tested.commit))throw Error('Qualified functional product/tree identity mismatch');
    const diffPath=`functional/${arm.id}-tested-to-arm.diff`,reviewed=await archiveBoundDiff(row.testedToArmDiff,resolve(directory,diffPath));
    artifacts.push({path:diffPath,sha256:reviewed.sha256});
    const current=verification.arms.find(item=>item.armId===arm.id);
    await verifyAndRecordSource(current,()=>verifyCanonicalDiff(repo,tested.commit,arm.identity.source.commit,reviewed,arm.id,{timeoutMs:manifest.sourceVerification.canonicalDiffTimeoutMs}),saveVerification);
    for(const [index,receipt]of row.rawReceipts.entries()){
      const raw=JSON.parse(await archive(receipt,`functional/${arm.id}-raw-${index}.json`,'original functional receipt'));
      if(!Array.isArray(receipt.sourcePath)||!receipt.sourcePath.length||receipt.sourcePath.some(key=>typeof key!=='string'))throw Error('Explicit raw functional receipt source path required');
      const captured=receipt.sourcePath.reduce((value,key)=>value?.[key],raw);
      if(!captured||captured.commit!==tested.commit||captured.tree!==tested.tree||captured.sha256!==tested.sha256||captured.worktreeStatus!=='')throw Error('Raw functional outcome receipt is not linked to the reviewed actual tested source');
    }
  }
  artifacts.push({path:'source-verification.json',sha256:sha(await readFile(resolve(directory,'source-verification.json')))});
  return {sha256:sha(bytes),artifacts};
}
async function validateQualificationArchive(spec,qualification,seed){
  const directory=dirname(spec.path),samples=await readFile(resolve(directory,'samples.jsonl')),finalization=await readFile(resolve(directory,'finalization.json'));
  if(sha(samples)!==qualification.samplesSha256||sha(finalization)!==qualification.finalizationSha256)throw Error('Qualification archive evidence changed or is incomplete');
  const jobs=jobsFor('qualify',seed),rows=samples.toString().trim().split('\n').map(line=>JSON.parse(line));
  if(qualification.schema!==1||qualification.jobsSha256!==sha(json(jobs))||rows.length!==jobs.length||rows.some((row,index)=>row.status!=='ok'||Object.entries(jobs[index]).some(([key,value])=>row[key]!==value)))throw Error('Qualification does not contain exactly the planned 32 off/on jobs and four lifecycle jobs');
  if(qualificationAgreement(rows).status!=='ok')throw Error('Qualification observer agreement failed');
  for(const row of rows.filter(row=>row.lane==='retention-qualification'))if(row.retention?.completedCycles!==4||JSON.stringify(row.retention.requestedCheckpoints)!==JSON.stringify([0,1,2,3,4])||Object.values(row.retention.caseCounts??{}).length!==4||Object.values(row.retention.caseCounts).some(count=>count!==1))throw Error('Qualification lifecycle case inventory is incomplete');
  for(const row of rows.filter(row=>row.lane==='retention-qualification')){const issues=retentionReceiptIssues(row.retention,qualification.binding.retentionAcceptance,4,row.workload);if(issues.length)throw Error('Archived retention acceptance evidence incomplete: '+issues.join('; '));}
  const functionalDigests=new Map();
  for(const item of qualification.functionalArtifacts??[]){const digest=await digestFile(resolve(directory,item.path));if(digest.sha256!==item.sha256)throw Error('Qualification functional evidence changed: '+item.path);functionalDigests.set(item.path,digest);}
  if(!qualification.functionalArtifacts?.some(item=>item.path==='functional-eligibility.json'&&item.sha256===qualification.binding.functionalEligibilitySha256))throw Error('Qualification functional eligibility archive missing');
  const receipts={};
  for(const name of ['source-before.json','source-after.json','protocol.md','runtime.diff','manifest.json']){const bytes=await readFile(resolve(directory,name));if(sha(bytes)!==qualification.archiveSha256?.[name])throw Error('Qualification archived receipt is missing or changed: '+name);receipts[name]=name.endsWith('.json')?JSON.parse(bytes):bytes;}
  const beforeReceipt=receipts['source-before.json'],afterReceipt=receipts['source-after.json'];
  if(beforeReceipt.sha256!==qualification.binding.harness.sha256||beforeReceipt.commit!==qualification.binding.harness.commit||beforeReceipt.worktreeStatus||afterReceipt.sha256!==beforeReceipt.sha256||afterReceipt.commit!==beforeReceipt.commit||afterReceipt.worktreeStatus||sha(receipts['protocol.md'])!==qualification.binding.protocolSha256||sha(receipts['runtime.diff'])!==qualification.binding.runtimeDiffSha256||JSON.stringify(runtimeBinding(receipts['manifest.json']))!==JSON.stringify(qualification.binding))throw Error('Qualification archive source/protocol/binding identity mismatch');
  const archivedManifest=receipts['manifest.json'];
  if(Object.hasOwn(archivedManifest,'sourceVerification')){
    const policy=sourceVerificationPolicy(archivedManifest.sourceVerification),evidence=JSON.parse(await readFile(resolve(directory,'source-verification.json')));
    const eligibility=JSON.parse(await readFile(resolve(directory,'functional-eligibility.json')));
    if(!qualification.functionalArtifacts?.some(item=>item.path==='source-verification.json')||JSON.stringify(evidence.policy)!==JSON.stringify(policy)||evidence.arms?.length!==2)throw Error('Qualification source-verification policy or evidence is missing');
    for(const arm of archivedManifest.arms){
      const row=evidence.arms.find(item=>item.armId===arm.id),tested=eligibility.arms?.find(item=>item.id===arm.id),diffPath=`functional/${arm.id}-tested-to-arm.diff`,diff=functionalDigests.get(diffPath);
      if(qualification.functionalArtifacts.filter(item=>item.path===diffPath).length!==1||!diff||diff.sha256!==tested?.testedToArmDiff?.sha256||row?.expectedSha256!==diff.sha256||row?.expectedBytes!==diff.bytes)throw Error('Qualification source-verification diff identity is incomplete: '+arm.id);
      if(!row||evidence.arms.filter(item=>item.armId===arm.id).length!==1||row.status!=='passed'||row.from!==tested?.testedCommit||row.to!==arm.identity.source.commit||row.timeoutMs!==policy.canonicalDiffTimeoutMs||!Number.isSafeInteger(row.expectedBytes)||row.expectedBytes<0||row.verifiedBytes!==row.expectedBytes||row.receivedBytes!==row.expectedBytes||!Number.isFinite(row.elapsedMs)||row.elapsedMs<0||row.elapsedMs>=policy.canonicalDiffTimeoutMs||row.child?.started!==true||row.child?.closeObserved!==true||row.child?.code!==0||row.child?.signal!==null||row.primaryFailure!==null||row.cleanupErrors?.length!==0||row.termination?.length!==0)throw Error('Qualification source-verification evidence is incomplete: '+arm.id);
    }
  }
  if(receipts['manifest.json'].admission?.policy==='active-desktop-v1'){
    const bytes=await readFile(resolve(directory,'admission.json'));
    if(sha(bytes)!==qualification.archiveSha256?.['admission.json']||sha(bytes)!==qualification.binding.admission?.sha256)throw Error('Qualification admission addendum missing or changed');
    validateAdmission(JSON.parse(bytes),sha(receipts['protocol.md']));
  }
  if(receipts['manifest.json'].retentionAcceptance?.id===OBSERVED_DOCUMENT_MOTION){
    const bytes=await readFile(resolve(directory,'retention-acceptance.json'));
    if(sha(bytes)!==qualification.archiveSha256?.['retention-acceptance.json']||sha(bytes)!==qualification.binding.retentionAcceptance.sha256)throw Error('Qualification retention acceptance addendum missing or changed');
    validateRetentionAddendum(JSON.parse(bytes),sha(receipts['protocol.md']));
  }
  const after=JSON.parse(finalization);
  if(after.sourceAfter?.unchanged!==true||after.assetsAfter?.length!==2||after.assetsAfter.some(arm=>arm.status!=='verified')||after.cleanupErrors?.length!==0||after.contention?.breach)throw Error('Qualification finalization is not valid');
}
function runtimeBinding(manifest){return {study:manifest.study,seed:manifest.seed,...(Object.hasOwn(manifest,'sourceVerification')?{sourceVerification:sourceVerificationPolicy(manifest.sourceVerification)}:{}),admission:manifest.admission,retentionAcceptance:manifest.retentionAcceptance,protocolSha256:manifest.protocolSha256,runtimeDiffSha256:manifest.runtimeDiffSha256,functionalEligibilitySha256:manifest.functionalEligibilitySha256,repositoryRoot:manifest.repositoryRoot,harness:manifest.harnessSource,arms:manifest.arms.map(arm=>({id:arm.id,identitySha256:arm.identitySha256,source:arm.identity.source})),profiles:manifest.profiles,host:manifest.host,toolchain:manifest.toolchain,policy:manifest.policy,resourcePaths:manifest.resourcePaths,preparation:manifest.arms.map(arm=>({id:arm.id,node:arm.identity.preparation.node,npm:arm.identity.preparation.npm,esbuild:arm.identity.preparation.esbuild,typescript:arm.identity.preparation.typescript,buildToolchain:arm.identity.buildToolchain,compression:arm.identity.preparation.compression}))};}
function byteComparisons(manifest){return ['activity','document'].map(workload=>{const lookup=id=>manifest.arms.find(arm=>arm.id===id).identity.cells.find(cell=>cell.workload===workload).bytes;const reference=lookup('reference'),candidate=lookup('candidate');return {workload,reference,candidate,change:Object.fromEntries(['raw','gzip','brotli'].map(key=>[key,candidate[key]-reference[key]])),direction:'Positive means more bytes; negative means fewer. Emitted totals, not measured transfer.'};});}
function campaignFailureReceipt(error,completedSamples){
  const detail=problem=>({name:problem?.name??'Error',message:String(problem?.message??problem),code:problem?.code??null,signal:problem?.signal??null});
  return {message:String(error.stack??error),completedSamples,...(error.sourceVerification?{sourceVerification:error.sourceVerification}:{}),...(error.cause?{cause:detail(error.cause)}:{}),...(error instanceof AggregateError?{errors:error.errors.map(detail)}:{})};
}
export async function runRevealCampaign(configPath,directory,mode){
  if(!['qualify','timing','retention'].includes(mode))throw Error('Expected qualify, timing or retention');
  await mkdir(directory,{recursive:false});
  const manifest={schema:1,mode,repositoryRoot:repo,startedAt:new Date().toISOString(),jobs:[],profiles,host:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,logicalCpuCount:os.cpus().length},toolchain:{node:process.version,playwright:require('@playwright/test/package.json').version},arms:[]};
  const samples=[],servers=new Map(),finalization={sourceAfter:{status:'unavailable'},assetsAfter:[],cleanupErrors:[]};let lease,monitor,summary,failure,config={},qualification=null;
  try{
    lease=await acquireResources(repo);manifest.resourcePaths=lease.paths;
    const before=await source(repo);await writeFile(resolve(directory,'source-before.json'),json(before));
    manifest.harnessSource={commit:before.commit,tree:before.tree,sha256:before.sha256,files:before.files.filter(([path])=>harnessPath(path)||lockPath(path))};
    if(before.worktreeStatus)throw Error('Runner checkout must be clean and sealed');
    const configBytes=await readFile(configPath);await writeFile(resolve(directory,'config.json'),configBytes);config=JSON.parse(configBytes);
    manifest.sourceVerification=sourceVerificationPolicy(config.sourceVerification);
    if(!['initial','confirmation'].includes(config.study)||config.seed!==(config.study==='initial'?20260924:20260925)||config.stopOnFailure!==true||!config.knownHeavyWorkInventoryPath)throw Error('Frozen study seed, stopOnFailure and current coordinator allocation inventory required');
    if(config.arms?.length!==2||['reference','candidate'].some(id=>config.arms.filter(arm=>arm.id===id).length!==1))throw Error('Exactly reference/candidate arms required');
    const protocol=await readBoundFile(config.protocol,'protocol'),runtimeDiff=await readBoundFile(config.runtimeDiff,'runtime diff');
    await writeFile(resolve(directory,'protocol.md'),protocol);await writeFile(resolve(directory,'runtime.diff'),runtimeDiff);
    manifest.retentionAcceptance=retentionAcceptance();
    if(config.retentionAcceptance!==undefined){
      const bytes=await readBoundFile(config.retentionAcceptance,'retention acceptance addendum');
      manifest.retentionAcceptance=retentionAcceptance({id:validateRetentionAddendum(JSON.parse(bytes),sha(protocol)),sha256:sha(bytes)});
      await writeFile(resolve(directory,'retention-acceptance.json'),bytes);
    }
    manifest.admission={policy:'legacy-strict'};
    if(config.admission){
      const bytes=await readBoundFile(config.admission,'active-desktop admission addendum');
      manifest.admission={...validateAdmission(JSON.parse(bytes),sha(protocol)),sha256:sha(bytes)};
      await writeFile(resolve(directory,'admission.json'),bytes);
    }
    const qualificationBytes=mode==='qualify'?null:await readBoundFile(config.qualification,'successful qualification receipt');
    qualification=qualificationBytes&&JSON.parse(qualificationBytes);
    if(qualificationBytes)await writeFile(resolve(directory,'qualification-input.json'),qualificationBytes);
    if(qualification)await validateQualificationArchive(config.qualification,qualification,config.seed);
    Object.assign(manifest,{study:config.study,seed:config.seed,configSha256:sha(configBytes),protocolSha256:sha(protocol),runtimeDiffSha256:sha(runtimeDiff),jobs:jobsFor(mode,config.seed),policy:config.expectedObservationPolicy});
    manifest.toolchain.npm=(await execFileAsync('npm',['--version'],{cwd:repo,timeout:10000,maxBuffer:1024*1024})).stdout.trim();
    for(const arm of config.arms){const identity=await verifyRevealFixture(arm.directory,arm.identitySha256);manifest.arms.push({...arm,identity});}
    const armCommit=id=>manifest.arms.find(arm=>arm.id===id).identity.source.commit;
    const actualDiff=(await execFileAsync('git',['-C',repo,'diff','--binary','--full-index','--no-ext-diff','--no-textconv',armCommit('reference'),armCommit('candidate'),'--'],{timeout:10000,maxBuffer:32*1024*1024,encoding:'buffer'})).stdout;
    await writeFile(resolve(directory,'actual-arm.diff'),actualDiff);
    if(!actualDiff.equals(runtimeDiff))throw Error('Actual clean arm source delta differs from the reviewed hash-bound diff');
    const workloadIdentity=identity=>({buildOptions:identity.buildOptions,cells:identity.cells.map(cell=>({workload:cell.workload,inputs:cell.inputs.filter(input=>input.path.startsWith('showcases/performance/fixtures/reveal/')||['apps/docs/src/presence-activity-demo.ts','apps/docs/src/document-scroll-demo.ts'].includes(input.path)),shell:cell.assets.find(asset=>asset.path==='index.html')?.sha256,tokens:cell.assets.find(asset=>asset.path==='tokens.css')?.sha256}))});
    if(JSON.stringify(workloadIdentity(manifest.arms[0].identity))!==JSON.stringify(workloadIdentity(manifest.arms[1].identity)))throw Error('Cross-arm fixture/workload identity mismatch');
    for(const arm of manifest.arms){const armSource=JSON.parse(await readFile(resolve(arm.directory,'source-before.json')));if(JSON.stringify(armSource.files.filter(([path])=>harnessPath(path)||lockPath(path)))!==JSON.stringify(before.files.filter(([path])=>harnessPath(path)||lockPath(path))))throw Error('Arm/runner adapter sources differ');}
    const prepTools=identity=>({node:identity.preparation.node,npm:identity.preparation.npm,esbuild:identity.preparation.esbuild,typescript:identity.preparation.typescript,compression:identity.preparation.compression});
    if(JSON.stringify(prepTools(manifest.arms[0].identity))!==JSON.stringify(prepTools(manifest.arms[1].identity)))throw Error('Production preparation toolchain differs between arms');
    const functional=await archiveFunctionalEligibility(config.functionalEligibility,manifest,directory);manifest.functionalEligibilitySha256=functional.sha256;manifest.functionalArtifacts=functional.artifacts;
    const binding=runtimeBinding(manifest);
    if(qualification&&(qualification.status!=='passed'||qualification.finalizationComplete!==true||JSON.stringify(qualification.binding)!==JSON.stringify(binding)))throw Error('Qualification is unsuccessful or does not bind this exact study/source/tool/profile/protocol');
    for(const arm of manifest.arms)for(const workload of ['activity','document'])servers.set(`${arm.id}/${workload}`,await startRevealFixture(arm.directory,workload));
    for(const [path]of manifest.harnessSource.files){const destination=resolve(directory,'harness',path);await mkdir(resolve(destination,'..'),{recursive:true});await cp(resolve(repo,path),destination);}
    await writeFile(resolve(directory,'manifest.json'),json(manifest));
    monitor=await createContentionMonitor({admissionPolicy:manifest.admission.policy,record:value=>appendFile(resolve(directory,'contention.jsonl'),JSON.stringify(value)+'\n'),onBreach:()=>{},getKnownHeavyWork:async()=>JSON.parse(await readFile(config.knownHeavyWorkInventoryPath,'utf8'))});
    let stopped=false;const observedVersions={},observedCapabilities={};
    for(const job of manifest.jobs){
      if(monitor.signal.aborted)stopped=true;
      if(!stopped)await appendFile(resolve(directory,'attempts.jsonl'),JSON.stringify({...job,status:'started',at:new Date().toISOString()})+'\n');
      const result=stopped?{...job,status:'not-run',reason:'Stopped after failure/contention; no replacements'}:await sample(job,{url:servers.get(`${job.arm}/${job.workload}`).url,policy:manifest.policy,monitor,qualifiedBinding:qualification,acceptance:manifest.retentionAcceptance});
      if(result.status==='ok'){
        const capabilityKey=[result.workload,result.browser,result.profile].join('/');
        if((observedVersions[result.browser]&&observedVersions[result.browser]!==result.browserVersion)||(observedCapabilities[capabilityKey]&&JSON.stringify(observedCapabilities[capabilityKey])!==JSON.stringify(result.fixture.registry))){result.status='failed';result.errors.push({type:'identity-drift',message:'Browser/capability changed within lane'});}
        observedVersions[result.browser]=result.browserVersion;observedCapabilities[capabilityKey]=result.fixture.registry;
      }
      samples.push(result);
      if(mode==='qualify'){
        const comparisons=qualificationAgreement(samples).comparisons.filter(row=>row.executed===2&&row.status!=='ok');
        if(comparisons.length){stopped=true;if(result.status==='ok'){
          result.observerAgreementFailure={jobStatusAtObservation:'ok',comparisons:structuredClone(comparisons)};
          result.status='failed';result.errors.push({type:'observer-agreement',message:'Attempted off/on pair did not establish agreement; inspect pair status and diagnostics'});
        }}
      }
      await writeFile(resolve(directory,`sample-${job.id}.json`),json(result));await appendFile(resolve(directory,'samples.jsonl'),JSON.stringify(result)+'\n');
      if(result.status!=='ok')stopped=true;console.log(`${job.id}/${manifest.jobs.length} ${job.arm} ${job.workload} ${job.browser}/${job.profile}/${job.observer}: ${result.status}`);
    }
    const browserVersions={},capabilities={};
    for(const sample of samples.filter(row=>row.status==='ok')){if(browserVersions[sample.browser]&&browserVersions[sample.browser]!==sample.browserVersion)throw Error('Browser version drift within lane');browserVersions[sample.browser]=sample.browserVersion;const key=[sample.workload,sample.browser,sample.profile].join('/');if(capabilities[key]&&JSON.stringify(capabilities[key])!==JSON.stringify(sample.fixture.registry))throw Error('Registry capability drift within lane');capabilities[key]=sample.fixture.registry;}
    const counts=Object.fromEntries(['ok','failed','unsupported','not-run'].map(status=>[status,samples.filter(row=>row.status===status).length]));
    const complete=counts.ok===manifest.jobs.length;summary={mode,counts,collectionComplete:complete,bytes:byteComparisons(manifest),browserVersions,capabilities,qualificationAgreement:mode==='qualify'?qualificationAgreement(samples):null,finalDisposition:'Coordinator review required; collection success is not a performance pass.'};
    if(summary.qualificationAgreement&&summary.qualificationAgreement.status!=='ok')summary.collectionComplete=false;
    summary.binding=binding;
  }catch(error){failure=String(error.stack??error);try{await writeFile(resolve(directory,'campaign-failed.json'),json(campaignFailureReceipt(error,samples.length)));}catch(receiptError){finalization.cleanupErrors.push({kind:'failure-receipt-write',message:String(receiptError)});}}
  finally{
    if(monitor){try{finalization.contention=await monitor.stop();}catch(error){finalization.cleanupErrors.push({kind:'contention-stop',message:String(error)});}}
    try{const after=await source(repo);await writeFile(resolve(directory,'source-after.json'),json(after));finalization.sourceAfter={status:'ok',commit:after.commit,sha256:after.sha256,unchanged:!!manifest.harnessSource&&after.sha256===manifest.harnessSource.sha256&&after.commit===manifest.harnessSource.commit&&!after.worktreeStatus};}catch(error){finalization.sourceAfter={status:'unavailable',message:String(error)};}
    for(const arm of Array.isArray(config.arms)?config.arms:[]){try{await verifyRevealFixture(arm.directory,arm.identitySha256);finalization.assetsAfter.push({arm:arm.id,status:'verified'});}catch(error){finalization.assetsAfter.push({arm:arm.id,status:'failed',message:String(error)});}}
    for(const server of servers.values()){try{await server.close();}catch(error){finalization.cleanupErrors.push({kind:'server-close',message:String(error)});}}
    try{await lease?.release();}catch(error){finalization.cleanupErrors.push({kind:'resource-release',message:String(error)});}
    try{await writeFile(resolve(directory,'finalization.json'),json(finalization));}catch(error){finalization.cleanupErrors.push({kind:'finalization-write',message:String(error)});failure??=String(error.stack??error);}
  }
  const finalizationComplete=finalization.sourceAfter.unchanged===true&&finalization.assetsAfter.length===2&&finalization.assetsAfter.every(row=>row.status==='verified')&&finalization.cleanupErrors.length===0&&!finalization.contention?.breach;
  summary??={mode,collectionComplete:false,failure,completedSamples:samples.length};summary.finalizationComplete=finalizationComplete;summary.collectionComplete=summary.collectionComplete&&finalizationComplete&&!failure;
  if(mode==='qualify'&&summary.collectionComplete){const archiveSha256={};for(const name of ['source-before.json','source-after.json','protocol.md','runtime.diff','manifest.json',...(manifest.admission?.policy==='active-desktop-v1'?['admission.json']:[]),...(manifest.retentionAcceptance?.id===OBSERVED_DOCUMENT_MOTION?['retention-acceptance.json']:[])])archiveSha256[name]=sha(await readFile(resolve(directory,name)));await writeFile(resolve(directory,'qualification.json'),json({schema:1,status:'passed',finalizationComplete:true,archiveSha256,functionalArtifacts:manifest.functionalArtifacts,binding:summary.binding,browserVersions:summary.browserVersions,capabilities:summary.capabilities,jobsSha256:sha(json(manifest.jobs)),samplesSha256:sha(await readFile(resolve(directory,'samples.jsonl'))),finalizationSha256:sha(await readFile(resolve(directory,'finalization.json'))),agreement:summary.qualificationAgreement}));}
  try{if(mode==='timing')summary.analysis=summarizeTiming(samples,{seed:config.seed,evidenceQualified:summary.collectionComplete&&!!qualification});if(mode==='retention')summary.analysis=summarizeRetention(samples,{seed:config.seed,evidenceQualified:summary.collectionComplete&&!!qualification,retentionAcceptance:manifest.retentionAcceptance});}catch(error){summary.analysisFailure=String(error.stack??error);process.exitCode=1;}
  try{await writeFile(resolve(directory,'summary.json'),json(summary));}catch(error){throw new AggregateError([failure,summary,error],'Campaign summary could not be persisted; collection is unqualified',{cause:error});}if(!summary.collectionComplete)process.exitCode=1;return summary;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [config,directory,mode]=process.argv.slice(2);if(!config||!directory)throw Error('Usage: node src/reveal-runner.mjs CONFIG OUTPUT qualify|timing|retention');console.log(json(await runRevealCampaign(resolve(config),resolve(directory),mode)));}

// Private archive controls reuse the exact runner validation and binding functions.
export {validateQualificationArchive, runtimeBinding, jobsFor, campaignFailureReceipt, verifyAndRecordSource};
