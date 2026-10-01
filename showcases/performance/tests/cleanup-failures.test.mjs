import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const loader=fileURLToPath(new URL('./fixtures/cleanup-failure-loader.mjs',import.meta.url));
const driver=`
 import {writeFileSync} from 'node:fs';
 import {pathToFileURL} from 'node:url';
 const describe=error=>({name:error?.name,code:error?.code,message:String(error?.message??error),...(Array.isArray(error?.errors)?{errors:error.errors.map(describe)}:{})});
 let result;
 try{
  const entry=await import(pathToFileURL(process.env.EN_NATIVE_CLEANUP_SOURCE));
  if(process.env.EN_NATIVE_CLEANUP_FUNCTIONAL==='1')await entry.functional({id:'cleanup-regression',systems:'en-reve'});
  result={status:'unexpected-success'};
 }catch(error){result={status:'rejected',error:describe(error)}}
 writeFileSync(process.env.EN_NATIVE_CLEANUP_RESULT,JSON.stringify(result));
`;
async function runFailure(t,source,{inventory,launchFail=false,stopFail=false,functional=false}={}){
 const scratch=await mkdtemp(resolve(tmpdir(),'native-cleanup-'));
 t.after(()=>rm(scratch,{recursive:true,force:true}));
 await mkdir(resolve(scratch,'.cache'));
 if(inventory!==undefined)await writeFile(resolve(scratch,'.cache/inventory.json'),inventory);
 const trace=resolve(scratch,'trace.jsonl'),result=resolve(scratch,'result.json');
 execFileSync(process.execPath,['--import',loader,'--input-type=module','--eval',driver],{
  cwd:root,encoding:'utf8',timeout:4000,env:{...process.env,
   EN_NATIVE_CLEANUP_ROOT:scratch,EN_NATIVE_CLEANUP_TRACE:trace,EN_NATIVE_CLEANUP_RESULT:result,
   EN_NATIVE_CLEANUP_SOURCE:resolve(root,source),EN_NATIVE_CLEANUP_FUNCTIONAL:functional?'1':'0',
   EN_NATIVE_CLEANUP_LAUNCH_FAIL:launchFail?'1':'0',EN_NATIVE_CLEANUP_STOP_FAIL:stopFail?'1':'0',
  },
 });
 const events=(await readFile(trace,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
 assert.equal(events.filter(row=>row.event==='server-started').length,1);
 assert.equal(events.filter(row=>row.event==='server-stop-attempt').length,1);
 const closed=events.filter(row=>row.event==='server-closed');
 assert.equal(closed.length,1,'the real owned HTTP server must finish closing');
 assert.equal(closed[0].listening,false);
 const outcome=JSON.parse(await readFile(result,'utf8'));
 assert.equal(outcome.status,'rejected');
 return {events,error:outcome.error};
}
for(const kind of ['missing','malformed'])test(`functional ${kind} inventory returns its acquired server`,async t=>{
 const {error}=await runFailure(t,'src/functional.mjs',{functional:true,...(kind==='malformed'?{inventory:'{broken JSON'}:{})});
 if(kind==='missing')assert.equal(error.code,'ENOENT');
 else assert.equal(error.name,'SyntaxError');
});
test('functional inventory and cleanup errors both survive',async t=>{
 const {error}=await runFailure(t,'src/functional.mjs',{functional:true,stopFail:true});
 assert.equal(error.name,'AggregateError');assert.equal(error.errors.length,2);
 assert.equal(error.errors[0].code,'ENOENT');assert.equal(error.errors[1].message,'server-stop-failure');
});
for(const source of ['experiments/verify-delivery.mjs','experiments/calibrate-cdp-scope.mjs','experiments/inspect-date-open.mjs']){
 test(`${source} launch failure returns its acquired server`,async t=>{
  const {events,error}=await runFailure(t,source,{launchFail:true});
  assert.equal(error.message,'browser-launch-failure');
  assert.equal(events.filter(row=>row.event==='browser-close-attempt').length,0);
 });
 test(`${source} attempts server cleanup after browser close fails and retains every error`,async t=>{
  const {events,error}=await runFailure(t,source,{stopFail:true});
  assert.equal(events.filter(row=>row.event==='browser-close-attempt').length,1);
  assert.equal(error.name,'AggregateError');
  assert.deepEqual(error.errors.map(item=>item.message),['acquisition-work-failure','browser-close-failure','server-stop-failure']);
 });
}
