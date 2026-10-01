import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './pathways.mjs';
import { laneCommands } from '../../showcases/performance/ci/lane-plan.mjs';

/** Executable command templates; binding is explicit and never substitutes a historical sample. */
export async function specializedPathways() {
 const systems=JSON.parse(await readFile(resolve(root,'showcases/performance/registry/systems.json'),'utf8')).map(system=>system.id).join(',');
 const node=process.execPath, lab='showcases/performance/src/cli.mjs';
 const tasks=[],pathways={};
 const add=(id,command,dependencies=[],extra={})=>{tasks.push({id,command,dependencies,kind:'specialized',resource:'exclusive-browser',...extra});return id;};
 const install=add('native:install',[node,'showcases/tools/install.mjs'],[],{kind:'producer',resource:'bounded-preparation',isolation:'Original isolated npm ci --workspaces=false flags; no workspace substitution'});
 const build=add('native:build',[node,'showcases/tools/build.mjs'],[install],{kind:'producer',resource:'bounded-preparation'});
 const nativeQualification=add('native:showcase-qualification',[node,'showcases/tools/qualify.mjs','--systems',systems,'--artifacts','$RUN/native-qualification','--receipt','$SHOWCASE_RECEIPT'],[build],{managedService:{command:['python3','showcases/tools/serve.py'],origins:systems.split(',').map((_,index)=>`http://127.0.0.1:${4510+index}`),ownership:'Require fresh process ownership and all origins ready; refuse occupied ports'},preserves:['smoke','secondary','inspection','source-bound receipt'],review:'Screenshots remain available for actual human review.'});
 const prepare=add('native:prepare',[node,'showcases/performance/src/prepare.mjs','--candidate','--reason','$REASON','--receipt','$SHOWCASE_RECEIPT'],[nativeQualification],{kind:'producer',requires:['qualified built showcase inventory','fresh source-bound showcase receipt'],identitySources:['showcases/performance/registry/systems.json','showcases/performance/profiles/profiles.json']});
 const functional=add('native:functional',[node,lab,'functional','--id','$ID-functional'],[prepare]);
 // Qualify the current library before acquiring expensive panels. The original
 // lane's complete sample/profile/cache matrix and both regression anchors remain.
 const current=add('native:current-build',[node,'showcases/performance/experiments/build-current.mjs'],[functional],{kind:'producer',resource:'bounded-preparation',scope:'Dedicated current-en-reve consumer; frozen vendor archives remain untouched'});
 const currentFunctional=add('native:current-functional',[node,lab,'functional','--variant','current-en-reve','--id','$ID-current-functional'],[current]);
 for(const lane of ['qualification','sentinel','full']) {
  let preceding=lane==='qualification'?functional:currentFunctional;
  const preflight=lane==='qualification'?[]:[add(`native:${lane}:anchor-preflight`,[node,'tooling/testing/preflight-anchors.mjs',lane,'$PERF_BASELINE','$PERF_INTERACTION_BASELINE'],[],{resource:'analysis',preflight:true,requires:['reviewed compatible load and interaction anchors'],scope:'Read-only early host/harness/profile/sample checks; original post-acquisition regressions remain'})];
  pathways['native-'+lane]=[...preflight,preceding];
  for(const [index,args] of laneCommands(lane).entries()) {
   if(args[0]==='functional')continue;
   const id=`native:${lane}:${index}:${args[0]}`;
   const command=[node,lab,...args];
   if(['run','qualify'].includes(args[0]))command.push('--id',`$ID-${lane}-${index}`);
   if(args[0]==='bundles')command.push('--output',`$RUN/${lane}-bundles.json`);
   preceding=add(id,command,[preceding],{freshAcquisition:true,protocolSource:'showcases/performance/ci/lane-plan.mjs'});
   pathways['native-'+lane].push(preceding);
  }
  if(lane!=='qualification')for(const suite of ['load','interactions']) {
   const runId=`$ID-${lane}-current-${suite}`;
   preceding=add(`native:${lane}:current:${suite}`,[node,lab,'run','--suite',suite,'--systems','en-reve','--variant','current-en-reve','--functional-receipt',resolve(root,'showcases/performance/reports/functional-$ID-current-functional-current-en-reve.json'),'--profiles',lane==='sentinel'?'mobile':'desktop,mobile','--caches',suite==='interactions'||lane==='sentinel'?'cold':'cold,warm','--samples','30','--id',runId],[preceding],{freshAcquisition:true,protocolSource:'showcases/performance/ci/run-lane.mjs'});
   preceding=add(`native:${lane}:current:${suite}:check`,[node,lab,'check','--run',runId,'--baseline',suite==='load'?'$PERF_BASELINE':'$PERF_INTERACTION_BASELINE','--output',`$RUN/${lane}-current-${suite}-regression.json`],[preceding],{requires:['explicit reviewed compatible regression anchor'],protocolSource:'showcases/performance/ci/run-lane.mjs'});
   pathways['native-'+lane].push(preceding);
  }
 }
 pathways['collector-qualification']=[
  add('collector:delivery',[node,'showcases/performance/tests/lifecycle-browser.mjs'],[],{environment:{EN_LIFECYCLE_TEST_OUTPUT:'$RUN/lifecycle-delivery'}}),
  ...['fixed-wait-v1','ack-v1'].map(protocol=>add(`collector:calibrate:${protocol}`,[node,lab,'calibrate','--lifecycle',protocol,'--output',`$RUN/calibration-${protocol}.json`],[prepare],{protocol,qualificationOnly:true})),
 ];
 pathways['native-instrument-controls']=['cdp-scope','delivery','startup','en-reve-main-startup','spectrum-gen2-startup','web-awesome-dialog'].map(name=>
  add(`native:instrument:${name}`,[node,`showcases/performance/experiments/calibrate-${name}.mjs`],[prepare],{
   environment:{EN_NATIVE_EXPERIMENT_OUTPUT:'$RUN/instrument-controls'},qualificationOnly:true,
   scope:'Original synthetic/CDP control, sessions and observation windows; fresh receipt destination only. Does not replace production old/new overlap.'
  }));
 const registry=add('registry:default-campaign',[node,lab,'registry','--id','$ID-registry'],[],{freshAcquisition:true,protocolSource:'showcases/performance/src/registry-runner.mjs#registryJobs',prerequisitePolicy:'Original command owns package builds and fixture compilation before serial capture',selection:'All original registryJobs defaults; larger documented study matrices require explicit options, never inferred fewer samples'});
 const negative=add('registry:negative-controls',[node,'showcases/performance/tests/registry-browser.mjs','$REGISTRY_FIXTURE'],[registry],{requires:['fixture from the matching fresh registry campaign'],preserves:['accidental eager global registration','cross-island activation','duplicate hydrated native controls']});
 pathways['registry-performance']=[registry,negative];
 const registryBuild=add('registry:build',[process.platform==='win32'?'npm.cmd':'npm','run','build'],[],{kind:'producer',resource:'bounded-preparation'});
 const docsDiagnostic=add('docs:performance-diagnostic',[node,'probes/performance-review/measure.mjs'],[registryBuild],{managedDocs:true,needsCampaignLock:true,environment:{EN_REVE_PERF_URL:'$DOCS_ORIGIN',EN_REVE_PERF_OUTPUT:'$RUN/docs-performance',EN_REVE_PERF_LABEL:'$ID'},scope:'Original three diagnostic samples with default gated startup and real500ms observation windows; no field/budget or full-native-lane claim'});
 pathways['docs-performance']=[add('docs:performance-diagnostic-receipt',[node,'tooling/testing/verify-diagnostic.mjs','$RUN/docs-performance/$ID.json'],[docsDiagnostic],{resource:'analysis',scope:'Surface retained diagnostic sample errors and changed-build failures; no new product performance thresholds'})];
 for(const family of ['lazy','activation']) {
  const environment=family==='lazy'?{EN_LAZY_OUT:'$RUN/fixtures/lazy'}:{EN_ACTIVATION_OUT:'$RUN/fixtures/activation'};
  const prepare=add(`${family}:prepare`,[node,`probes/${family}-registry/prepare.mjs`],[registryBuild],{kind:'producer',resource:'bounded-preparation',environment});
  const qualify=add(`${family}:campaign-qualification`,[node,`probes/${family}-registry/campaign.mjs`,'--qualify'],[prepare],{environment:{...environment,[family==='lazy'?'EN_LAZY_CAMPAIGN_OUT':'EN_ACTIVATION_CAMPAIGN_OUT']:`$RUN/${family}-qualification`},freshAcquisition:true,scope:family==='lazy'?'28 timing plus four retention jobs':'Six timing plus three retention jobs'});
  const full=add(`${family}:campaign-full`,[node,`probes/${family}-registry/campaign.mjs`],[qualify],{environment:{...environment,[family==='lazy'?'EN_LAZY_CAMPAIGN_OUT':'EN_ACTIVATION_CAMPAIGN_OUT']:`$RUN/${family}-full`},freshAcquisition:true,scope:family==='lazy'?'840 timing plus 20 retention jobs':'180 timing plus 15 retention jobs'});
  pathways[`${family}-qualification`]=[qualify];pathways[`${family}-performance`]=[full];
 }

 pathways['legacy-release']=[add('compatibility:release',[node,'tooling/releases/verify.mjs'],[],{resource:'exclusive-browser',environment:{EN_RELEASE_TEST_OUTPUT_DIR:'$RUN/legacy-release'},scope:'Original direct CLI retains its own root build and original full selective release contract; optional duplicate compatibility pathway, never evidence for omitted families'})];
 const deliveryBuild=add('native:delivery-build',[node,'showcases/performance/experiments/build-en-reve.mjs'],[functional],{kind:'producer',resource:'bounded-preparation',environment:{EN_NATIVE_EXPERIMENT_OUTPUT:'$RUN/delivery-build'},scope:'All original split/edit/lazy/intent/containment and import-family variants; current qualified native source'});
 pathways['native-delivery']=[add('native:delivery-verify',[node,'showcases/performance/experiments/verify-delivery.mjs'],[deliveryBuild],{environment:{EN_NATIVE_EXPERIMENT_OUTPUT:'$RUN/delivery-correctness'},scope:'Original cold keyboard activation, all-card reveal and actual browser vendor-cache reuse across variant deployment'})];
 pathways['native-inspection']=['date-open','dom-review'].map(name=>add(`native:inspect:${name}`,[node,`showcases/performance/experiments/inspect-${name}.mjs`],[functional],{needsCampaignLock:true,environment:{EN_NATIVE_EXPERIMENT_OUTPUT:'$RUN/native-inspection'},scope:'Original diagnostic DOM/ARIA snapshots, desktop viewport, real clicks and observation waits; not timing or full correctness qualification'}));
 pathways['native-current']=[currentFunctional];
 pathways['native-dom']=[add('native:dom-review',[node,'showcases/performance/experiments/run-dom-review.mjs','$ID-dom','--systems',systems],[functional],{needsCampaignLock:true,freshAcquisition:true,scope:'Original three desktop repetitions, one narrow visit and fresh custom-date sessions; diagnostic counts, not timing'}),add('native:dom-ownership',[node,'showcases/performance/experiments/run-dom-ownership.mjs','--systems',systems,'--output','$RUN/dom-ownership.json'],[functional],{needsCampaignLock:true,freshAcquisition:true,scope:'One fresh settled initial desktop document per system; diagnostic ownership'})];
 const dateEnv={PHASE6_BASE:'$RUN/date',PHASE6_ARCHIVE:'$RUN/date',PHASE6_REPORT_OUTPUT:'$RUN/date/page',PHASE6_REPORT_ORIGIN:'$DATE_REPORT_ORIGIN'};
 const date=(name,file,args=[],dependencies=[])=>add('date:'+name,[file.endsWith('.py')?'python3':node,'probes/date-picker-performance/'+file,...args],dependencies,{environment:dateEnv,requires:['unchanged reviewed budgets.json in PHASE6_BASE','parent commit and candidate overlay resolve'],fixturePolicy:'prepare.py retains its explicit historical parent and isolated candidate overlay; never treated as a current root build'});
 const budgets=add('date:copy-reviewed-budgets',[node,'tooling/testing/date-inputs.mjs','$RUN/date'],[],{kind:'producer',resource:'bounded-preparation',preserves:['exact v1 budgets; no promotion or threshold change']});
 const parent=date('parent','prepare.py',['parent'],[budgets]),candidate=date('candidate','prepare.py',['candidate'],[parent]);
 let previous=candidate;
 pathways.date=[];
 for(const [name,file,args=[]] of [
  ['assets','assets.py'],['node','qualify-node.py'],['types','consumer-types.py'],
  ['functional','functional.mjs'],['manual-fixture','verify-manual.mjs'],['extended','extended.mjs'],['scaling','scaling.mjs'],['range','range-regression.mjs'],
  ['retry','verify-retry-integration.mjs',['$RUN/date']],['reenable','verify-reenable.mjs',['$RUN/date']],
  ['build-ssr','build-ssr.py'],['ssr','ssr/verify.mjs'],['warm-proof','warm-proof.mjs'],['snapshot','snapshot.py'],
  ['cold','campaign.mjs',['--run=final-cold','--arms=parent/eager,candidate/dom','--n=30','--retention=5']],
  ['warm','campaign.mjs',['--run=final-warm','--arms=parent/eager,candidate/dom','--configs=chromium:desktop:keyboard,chromium:constrained:keyboard','--n=30','--retention=0','--warm']],
  ['analyze','analyze.py',['final-cold','final-warm']],['budgets','check-budgets.py'],['inputs','verify-input.py'],['report','report.py'],['verify-report','verify-report.mjs'],
 ]) {previous=date(name,file,args,[previous]);pathways.date.push(previous);}
 Object.assign(tasks.find(task=>task.id==='date:manual-fixture'),{
  environment:{...dateEnv,PHASE6_REVIEW_BASE:'$RUN/date/candidate',PHASE6_REVIEW_PORT:'4240',PHASE6_REVIEW_URL:'http://127.0.0.1:4240'},
  managedService:{command:[node,'probes/date-picker-performance/manual.mjs'],origins:['http://127.0.0.1:4240'],ownership:'Require owned process readiness; refuse occupied port'},
  scope:'Original three-engine loading/failure/retry/focus/return-link fixture assertions. Does not establish actual speech/device/IME acceptance.',
 });
 tasks.find(task=>task.id==='date:report').managedReport={directory:'$RUN/date/page',fallback:'artifacts/scoped-registry-production-v1/page',originVariable:'PHASE6_REPORT_ORIGIN'};
 return {tasks,pathways,requiredInputs:{'native-sentinel':['PERF_BASELINE','PERF_INTERACTION_BASELINE'],'native-full':['PERF_BASELINE','PERF_INTERACTION_BASELINE']},manual:[{id:'date:manual',reason:'Physical device, assistive technology, speech, saved-profile autofill/history and physical IME acceptance require actual human/device evidence.'}],
  activation:'Bind templates to fresh output roots and qualified fixture identities before execution; reject unbound values. No automatic promotion or historical archive mutation.',
  completeness:'Native, current-library native, registry and date command templates; historical reproduction recipes remain independently inventoried.'};
}
