import {chromium,firefox,webkit} from '@playwright/test';
import {mkdir,writeFile,appendFile,readFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {root,profiles,rng,shuffle,sha,json} from './config.mjs';
import {describe} from './analysis.mjs';
import {buildRegistryFixture,startRegistryFixture} from './registry-fixture.mjs';
import {runRegistryScenario,registryScenarioVersion} from '../scenarios/registry-workflows.mjs';
const engines={chromium,firefox,webkit};
function list(value,fallback,allowed,name) {
  const values=String(value??fallback).split(',');
  if(new Set(values).size!==values.length || values.some(value=>!allowed.includes(value)))throw new Error(`Invalid ${name}: ${values}`);
  return values;
}
export function registryJobs(args) {
  const selected={
    scenarios:list(args.scenarios,'activation,scaling,containment,lifecycle,ssr',['activation','scaling','containment','lifecycle','ssr'],'scenarios'),
    workflows:list(args.workflows,'settings',['settings','sso','chat'],'workflows'),
    modes:list(args.modes,'global,scoped',['global','scoped','auto'],'modes'),
    policies:list(args.policies,'shared',['shared','group','instance','element'],'policies'),
    browsers:list(args.browsers,'chromium',Object.keys(engines),'browsers'),
    profiles:list(args.profiles,'desktop',Object.keys(profiles),'profiles'),
    caches:list(args.caches,'cold',['cold','warm'],'caches'),
  };
  const counts=String(args.counts??'3').split(',').map(Number);
  const checkpoints=String(args.checkpoints??'0,10,50,100').split(',').map(Number);
  const samples=Number(args.samples??1), seed=Number(args.seed??20260920), groupSize=Number(args['group-size']??2);
  if(!Number.isInteger(samples)||samples<1||!Number.isInteger(seed)||!Number.isInteger(groupSize)||groupSize<1||groupSize>100)throw new Error('Invalid samples, seed or group size');
  if(counts.some(n=>!Number.isInteger(n)||n<1||n>100)||new Set(counts).size!==counts.length)throw new Error('Unique counts from 1–100 required');
  if(!checkpoints.length||checkpoints[0]!==0||checkpoints.some((n,i)=>!Number.isInteger(n)||n<0||n>1000||(i>0&&n<=checkpoints[i-1])))throw new Error('Checkpoints must start at 0 and increase, at most 1000');
  const light=args['root-kind']??'shadow';if(!['light','shadow'].includes(light))throw new Error('Invalid root kind');
  if(light==='light' && (counts.some(n=>n!==1)||selected.scenarios.some(s=>s==='ssr'||s==='containment')))throw new Error('Light DOM lane supports single-instance CSR scaling/lifecycle only');
  const cells=[];
  for(const scenario of selected.scenarios)for(const workflow of selected.workflows)for(const mode of selected.modes)for(const policy of selected.policies)for(const browser of selected.browsers)for(const profile of selected.profiles)for(const cache of selected.caches)for(const count of scenario==='scaling'?counts:[scenario==='containment'?3:1]) {
    if(mode==='global'&&policy!=='shared')continue; // No fictitious global registry topology.
    cells.push({scenario,workflow,mode,policy,browser,profile,cache,count,groupSize,root:light,delivery:scenario==='ssr'?'ssr':'csr'});
  }
  if(!cells.length)throw new Error('Empty benchmark matrix');
  const random=rng(seed),jobs=[];
  for(let block=0;block<samples;block++)for(const cell of shuffle(cells,random))jobs.push({...cell,block,id:String(jobs.length+1).padStart(5,'0')});
  return {jobs,seed,checkpoints,samples};
}
function installCollector() {
  const supported=PerformanceObserver.supportedEntryTypes;
  const entries={};
  for(const type of ['paint','largest-contentful-paint','layout-shift','longtask','long-animation-frame','event'])if(supported.includes(type)) {
    entries[type]=[];
    new PerformanceObserver(list=>{for(const entry of list.getEntries())entries[type].push(entry.toJSON());}).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});
  }
  window.__registryMetrics={entries,supported};
}
export async function registrySample(job,{url,checkpoints}) {
  const result={...job,status:'running',errors:[],startedAt:new Date().toISOString()};let browser, page;
  try {
    browser=await engines[job.browser].launch({headless:true});result.browserVersion=browser.version();
    const profile=profiles[job.profile];
    if(job.browser!=='chromium' && job.profile!=='desktop')return {...result,status:'unsupported',reason:'CPU/network profile requires Chromium CDP; other engines are never labeled as throttled.'};
    const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,serviceWorkers:'block'});
    if(job.scenario!=='lifecycle')await context.addInitScript(installCollector);
    page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',error=>result.errors.push(error.message));
    page.on('requestfailed',request=>result.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
    if(cdp) {
      await cdp.send('Performance.enable');await cdp.send('Network.enable');
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpuRate});
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.upload});
    }
    const params=new URLSearchParams(Object.fromEntries(['workflow','mode','policy','count','groupSize','delivery','root'].map(key=>[key,String(job[key])])));
    const target=`${url}/?${params}`;
    if(job.cache==='warm') {await page.goto(target);await page.evaluate(()=>window.registryBench.load());await page.goto(url+'/away');result.errors.length=0;}
    const response=await page.goto(target);if(!response?.ok())throw new Error('Fixture failed to load');
    await page.waitForFunction(()=>Boolean(window.registryBench));
    const memory=async()=>{
      if(!cdp)return {status:'unsupported',reason:'CDP heap/DOM counters unavailable in this engine; workload still checked.'};
      await cdp.send('HeapProfiler.collectGarbage');
      const metrics=(await cdp.send('Performance.getMetrics')).metrics;
      return {status:'ok',collection:'Post-forced-GC, separate retention lane',jsHeapUsedBytes:metrics.find(metric=>metric.name==='JSHeapUsedSize')?.value,dom:await cdp.send('Memory.getDOMCounters')};
    };
    let watchdog;
    try {result.scenarioResult=await Promise.race([
      runRegistryScenario(page,job,{scenario:job.scenario,checkpoints,memory}),
      new Promise((_,reject)=>{watchdog=setTimeout(()=>reject(new Error('Scenario exceeded five-minute safety timeout')),300000);}),
    ]);}finally{clearTimeout(watchdog);}
    result.status=result.scenarioResult.status;
    if(result.status==='ok' && result.errors.length)result.status='failed';
    result.metrics=await page.evaluate(()=>({
      entries:window.__registryMetrics?.entries??null,supported:window.__registryMetrics?.supported??[],
      navigation:performance.getEntriesByType('navigation').map(entry=>entry.toJSON()),
      resources:performance.getEntriesByType('resource').map(entry=>entry.toJSON()),
      marks:performance.getEntriesByType('mark').map(entry=>entry.toJSON()),
      measures:performance.getEntriesByType('measure').map(entry=>entry.toJSON()),
    }));
    if(job.scenario==='ssr' && result.status==='ok') {
      // Separate correctness check, excluded from the timed page and its metrics.
      const staticContext=await browser.newContext({javaScriptEnabled:false});
      try {
        const staticPage=await staticContext.newPage();await staticPage.goto(target);
        const controls=staticPage.locator('[data-island="0"]').locator('input,textarea');
        const count=await controls.count();if(!count)throw new Error('No native SSR controls with JavaScript disabled');
        result.noJavaScript={nativeControls:count,visible:await controls.first().isVisible()};
        if(!result.noJavaScript.visible)throw new Error('Initial SSR controls are hidden without JavaScript');
      }finally{await staticContext.close();}
    }
    if(cdp)result.browserMetrics=(await cdp.send('Performance.getMetrics')).metrics;
  }catch(error){result.status='failed';result.errors.push(String(error.stack??error));if(page)result.diagnostic=await page.evaluate(()=>window.registryBench?.runtime?.snapshot?.()??null).catch(()=>null);}
  finally{await browser?.close();}
  result.finishedAt=new Date().toISOString();return result;
}
export function summarizeRegistry(samples) {
  const cells=new Map();
  for(const sample of samples) {
    const key=['scenario','workflow','mode','policy','browser','profile','cache','count','root'].map(k=>sample[k]).join('/');
    if(!cells.has(key))cells.set(key,[]);cells.get(key).push(sample);
  }
  return {complete:true,total:samples.length,passed:samples.filter(s=>s.status==='ok').length,failed:samples.filter(s=>s.status==='failed').length,unsupported:samples.filter(s=>s.status==='unsupported').length,
    cells:[...cells].map(([key,values])=>({key,passed:values.filter(s=>s.status==='ok').length,failed:values.filter(s=>s.status==='failed').length,unsupported:values.filter(s=>s.status==='unsupported').length,
      activationMs:describe(values.filter(s=>s.status==='ok').flatMap(s=>{const stages=s.scenarioResult?.after?.metrics?.[0]?.stages;return stages?[stages.rendered-stages.requested]:[];})),
      requestToReadyMs:describe(values.filter(s=>s.status==='ok').flatMap(s=>s.metrics?.measures?.filter(m=>m.name==='registry:request-to-ready').map(m=>m.duration)??[])),
      moduleLoadMs:describe(values.filter(s=>s.status==='ok').flatMap(s=>s.metrics?.measures?.filter(m=>m.name==='registry:module-load').map(m=>m.duration)??[]))})),
    interpretation:'Qualification/exploratory results. Unsupported cases are not passes or zero measurements. Activation includes fixture readiness instrumentation; full async action readiness is distinct from Event Timing. No field INP or release performance claim.'};
}
export async function runRegistry(args) {
  const matrix=registryJobs(args), id=args.id??`registry-${new Date().toISOString().replace(/[:.]/g,'-')}`;
  if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('Simple unique run ID required');
  const directory=resolve(root,'runs',id);await mkdir(directory,{recursive:true});
  await writeFile(resolve(directory,'run-started.json'),json({at:new Date().toISOString(),pid:process.pid}),{flag:'wx'});
  // Refresh all packages consumed by CSR and SSR before any timed work.
  for(const name of ['tokens','styles','primitives','elements','ssr'])execFileSync('npm',['run','build','-w',`@en-reve/${name}`],{cwd:resolve(root,'../..'),stdio:'inherit'});
  const fixture=resolve(directory,'fixture'),identity=await buildRegistryFixture(fixture);
  const server=await startRegistryFixture(fixture);
  const manifest={schema:1,id,createdAt:new Date().toISOString(),scenarioVersion:registryScenarioVersion,...matrix,profiles,identity,host:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,node:process.version,load:os.loadavg()},methodology:'Serial fresh browser per sample; seeded blocks; cold fresh context or same-context asset priming. Loopback HTTP server, no remote/server latency claim. Library hosts use the production registry adapter; the fixture owns dormant workflow activation and instrumentation. SSR generation happens outside timed browser work.'};
  const samples=[];
  try {
    // Materialize and archive SSR responses before timed samples.
    const documents=[];
    for(const job of matrix.jobs) {
      const params=new URLSearchParams(Object.fromEntries(['workflow','mode','policy','count','groupSize','delivery','root'].map(key=>[key,String(job[key])])));
      if(documents.some(d=>d.query===params.toString()))continue;
      const response=await fetch(`${server.url}/?${params}`);if(!response.ok)throw new Error(await response.text());
      const text=await response.text(),hash=sha(text);await mkdir(resolve(fixture,'documents'),{recursive:true});await writeFile(resolve(fixture,'documents',hash+'.html'),text);documents.push({query:params.toString(),sha256:hash,bytes:Buffer.byteLength(text)});
    }
    manifest.documents=documents;
    for(const folder of ['src','scenarios','fixtures/registry'])await cp(resolve(root,folder),resolve(directory,'harness',folder),{recursive:true});
    manifest.harnessSha256=sha(json(await Promise.all(['src/registry-runner.mjs','src/registry-fixture.mjs','scenarios/registry-workflows.mjs'].map(async path=>[path,sha(await readFile(resolve(root,path)))]))));
    await writeFile(resolve(directory,'manifest.json'),json(manifest));
    for(const job of matrix.jobs) {
      const sample=await registrySample(job,{url:server.url,checkpoints:matrix.checkpoints});samples.push(sample);await appendFile(resolve(directory,'samples.jsonl'),JSON.stringify(sample)+'\n');
      console.log(`${job.id}/${matrix.jobs.length} ${job.scenario} ${job.workflow} ${job.mode}/${job.policy} ${job.browser}: ${sample.status}`);
      if(sample.status==='failed')console.log(sample.errors.join('\n'));
    }
    const summary=summarizeRegistry(samples);await writeFile(resolve(directory,'summary.json'),json(summary));
    await writeFile(resolve(directory,'summary.md'),`# Scoped registry workflow benchmark\n\n${summary.passed} passed; ${summary.failed} failed; ${summary.unsupported} unsupported.\n\n${summary.interpretation}\n\n| Scenario / workflow / policy / engine | Passed | Failed | Unsupported | Activation median ms | Module load median ms |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${summary.cells.map(c=>`| ${c.key} | ${c.passed} | ${c.failed} | ${c.unsupported} | ${c.activationMs.median??'—'} | ${c.moduleLoadMs.median??'—'} |`).join('\n')}\n`);
    console.log(resolve(directory,'summary.md'));if(summary.failed)process.exitCode=1;return summary;
  }finally{await server.close();}
}
