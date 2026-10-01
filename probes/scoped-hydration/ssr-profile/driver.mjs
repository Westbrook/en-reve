// Run from a prepared study directory with the exact extracted Phase 5 packages.
import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import os from 'node:os';
const now = () => performance.timeOrigin + performance.now();
const output = process.argv.find(a => a.startsWith('--out='))?.slice(6);
const qualifyOnly = process.argv.includes('--qualify');
const {snapshot} = JSON.parse(await readFile(new URL('./rendered.json', import.meta.url)));
const moduleUrl = new URL('./island.mjs', import.meta.url);
const {createScopedRenderer} = await import('@en-reve/ssr/scoped.js');
const renderer = createScopedRenderer({commands:{module:moduleUrl,version:'1'}},{concurrency:1});
await import('@en-reve/ssr/install.js');
const {registerDefinitions} = await import('@en-reve/primitives/interactions/registration.js');
const {renderToString} = await import('@en-reve/ssr');
const app = await import('./island.mjs');
registerDefinitions(customElements, app.definitions);
const hash = value => createHash('sha256').update(value).digest('hex');
const expected = await renderToString(app.template(snapshot));
function check(html) {
  assert.equal(hash(html), hash(expected), 'HTML must match warm rendering byte for byte');
  return {bytes:Buffer.byteLength(html),sha256:hash(html)};
}
async function profiled(prewarm, request=snapshot, module=moduleUrl, version='1') {
  const createdAt = now();
  // Match the public API's explicit submission-time snapshot in addition to worker cloning.
  const initialSnapshot = prewarm ? undefined : structuredClone(request);
  const worker = new Worker(new URL('./worker.mjs',import.meta.url), {workerData:{module:module.href,version,prewarm,snapshot:initialSnapshot}});
  let finish, reject, ready, rejectReady, completed = false, requestAt = createdAt, readyAt;
  const resultPromise = new Promise((yes,no)=>{finish=yes;reject=no;});
  const readyPromise = new Promise((yes,no)=>{ready=yes;rejectReady=no;});
  // Attach rejection handlers immediately; both promises can reject before readiness.
  void resultPromise.catch(()=>{}); void readyPromise.catch(()=>{});
  const fail = error => {reject(error);rejectReady(error);};
  worker.on('error',fail);
  worker.on('exit',code=>{if(!completed)fail(Error(`Worker exited before result: ${code}`));});
  worker.on('message', message=>{
    if(message.type==='error')return fail(Error(message.error));
    if(message.type==='ready'){readyAt=now();ready(message);}
    if(message.type==='result'){completed=true;finish({...message,returnedAt:now()});}
  });
  const timeout = setTimeout(()=>fail(Error('Worker timeout')),30_000);
  try {
    if(prewarm){await readyPromise;requestAt=now();worker.postMessage({snapshot:structuredClone(request)});}
    const result = await resultPromise, shutdownAt = now();
    await worker.terminate();
    const stoppedAt = now();
    const metrics = {
      requestMs:result.returnedAt-requestAt,
      preparationMs:prewarm ? readyAt-createdAt : 0,
      creationToResultMs:result.returnedAt-createdAt,
      shutdownMs:stoppedAt-shutdownAt,
      creationToStoppedMs:stoppedAt-createdAt,
      startupToEntryMs:result.enteredAt-createdAt,
      ...result.stages,
      requestTransferMs:prewarm ? result.receivedAt-requestAt : 0,
      resultTransferMs:result.returnedAt-result.sentAt,
    };
    // Unattributed inter-stage bookkeeping, validation, event dispatch and measurement gaps.
    metrics.otherMs=metrics.creationToResultMs-metrics.startupToEntryMs-
      Object.values(result.stages).reduce((a,b)=>a+b,0)-metrics.requestTransferMs-metrics.resultTransferMs;
    return {html:result.html,metrics,threadId:worker.threadId};
  } finally { clearTimeout(timeout);await worker.terminate(); }
}
const qualification=[];
// All prototype renders use new realms. Conflicting same-tag definitions must stay separate.
for(const prewarm of [false,true])for(const [name,version] of [['one','one'],['two','two'],['one','one']]){
 const marker=`${prewarm}-${name}-${qualification.length}`;
 const {html}=await profiled(prewarm,{message:marker},new URL(`./${name}.mjs`,import.meta.url),version);
 assert(html.includes(`Version ${version}:`));assert(html.includes(marker));
 assert(!html.includes(`Version ${version==='one'?'two':'one'}:`));
 qualification.push({prewarm,version,passed:true});
}
// Module counter proves a different snapshot gets a fresh module realm for each request.
for(const prewarm of [false,true])for(const message of ['First request','Second request']){
 const {html}=await profiled(prewarm,{message},new URL('./stateful.mjs',import.meta.url),'stateful');
 const text=html.replace(/<!--[\s\S]*?-->/g,'');
 assert(text.includes('Invocation 1'));assert(!text.includes('Invocation 2'));assert(text.includes(message));
 qualification.push({prewarm,message,requestLocalState:true,passed:true});
}
assert.equal(customElements.get('test-scoped-message'),undefined,'Workers must not mutate parent registry');
for(const prewarm of [false,true])check((await profiled(prewarm)).html);
const samples=[],warmups=[];
const policies=['warm','isolated-api','fresh-profiled','prewarmed-single-use'];
async function sample(policy,block){
 const start=now();let html,metrics;
 if(policy==='warm'){html=await renderToString(app.template(snapshot));metrics={requestMs:now()-start};}
 else if(policy==='isolated-api'){html=(await renderer.render({key:'commands',snapshot})).html;metrics={requestMs:now()-start};}
 else {const result=await profiled(policy==='prewarmed-single-use');html=result.html;metrics=result.metrics;}
 return {policy,block,...metrics,...check(html)};
}
let seed=20260922;
const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const shuffled=()=>{const a=[...policies];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
try {
 if(!qualifyOnly){
   for(let block=-5;block<30;block++){
     for(const policy of shuffled())(block<0?warmups:samples).push(await sample(policy,block));
     if(block>=0 && (block+1)%5===0)console.log(`${block+1}/30 blocks complete`);
   }
 }
 await writeFile(output,JSON.stringify({at:new Date().toISOString(),seed:20260922,host:{node:process.version,platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model},qualification,warmups,samples,output:{bytes:Buffer.byteLength(expected),sha256:hash(expected)},notes:['Server-only diagnostic; no HTTP or browser timing.','Frozen Phase 5 extracted packages and identical 50-command template.','Five warmup blocks, then 30 randomized blocks; all samples retained.','Prewarming loads modules and registers definitions before request, but never renders a template before its one request.','Preparation excluded from prewarmed requestMs; creation-to-result and shutdown also reported.','Stage times are sequential import attribution: transitive/shared imports accrue to the first importing stage.','Instrumented prototype is not the public API: no production queue, cancellation or replenishment pool.','Public API control keeps its existing shutdown/slot semantics. Profiled workers fully terminate before another sample starts.']},null,2)+'\n');
} finally { renderer.dispose(); }
