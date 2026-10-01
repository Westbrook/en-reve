import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const directory=fileURLToPath(new URL('.',import.meta.url));
const loader=fileURLToPath(new URL('./fixtures/terminal-finalization-loader.mjs',import.meta.url));
const driver=`
 import {pathToFileURL} from 'node:url';
 import {setTimeout} from 'node:timers/promises';
 const mode=process.env.EN_FINAL_MODE;
 const source=process.env.EN_FINAL_SOURCE;
 const args=mode==='public'?['--view=root#test:theme']:mode==='specialized'?['--pathway=fixture','--output='+process.env.EN_EXECUTION_OUTPUT]:[];
 process.argv=[process.execPath,source,...(process.env.EN_FINAL_DIRECT==='1'?[]:[mode]),...args];
 await import(pathToFileURL(source));
 if(process.env.EN_FINAL_PHASE==='after-commit'){process.kill(process.pid,'SIGTERM');await setTimeout(20);}
`;
async function run(t,mode,phase,{direct=false}={}){
 const root=await mkdtemp(resolve(tmpdir(),'terminal-finalization-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const output=resolve(root,'evidence'),traceFile=resolve(root,'trace.jsonl');
 const source=resolve(directory,direct?'run-'+(mode==='public'?'public-view':mode)+'.mjs':'invoke.mjs');
 const actual=spawnSync(process.execPath,['--import',loader,'--input-type=module','--eval',driver],{encoding:'utf8',timeout:4000,env:{...process.env,EN_FINAL_ROOT:root,EN_FINAL_MODE:mode,EN_FINAL_PHASE:phase,EN_FINAL_SOURCE:source,EN_FINAL_TRACE:traceFile,EN_EXECUTION_OUTPUT:output,EN_FINAL_DIRECT:direct?'1':'0',EN_FINAL_SIGNAL:phase==='identity'?'SIGINT':'SIGTERM'}});
 assert.equal(actual.error,undefined,actual.error?.stack);assert.equal(actual.signal,null,actual.stderr);
 const receipt=JSON.parse(await readFile(resolve(output,'execution.json'),'utf8'));
 const events=(await readFile(traceFile,'utf8')).trim().split('\n').map(JSON.parse);
 if(mode==='public')assert.deepEqual(JSON.parse(await readFile(resolve(output,'results.json'),'utf8')),{...receipt,build:'included'});
 if(!direct){
  const release=events.findIndex(row=>row.event==='machine-released');assert.ok(release>=0);
  const executionRelease=events.findIndex(row=>row.event==='execution-released');
  assert.ok(executionRelease>=0);assert.ok(executionRelease<release);
  for(const event of ['execution-released','machine-released'])assert.equal(events.filter(row=>row.event===event).length,1);
  const aggregatePaths=new Set(['execution.json','results.json','verification.json'].map(name=>resolve(output,name)));
  const aggregateWrites=events.map((row,index)=>({...row,index})).filter(row=>row.event==='write'&&aggregatePaths.has(row.path));
  assert.ok(aggregateWrites.some(row=>row.path===resolve(output,'execution.json')));
  assert.ok(aggregateWrites.every(row=>typeof row.status==='string'&&(row.status==='running'||row.index>release)),
   'no aggregate terminal receipt before both owner releases: '+JSON.stringify(aggregateWrites));
 }
 return {actual,receipt,events};
}
for(const mode of ['public','comprehensive','specialized']){
 for(const phase of ['identity','publication','execution-release','machine-release'])test(`${mode} retains cancellation during ${phase}`,async t=>{
  const {actual,receipt}=await run(t,mode,phase);assert.equal(actual.status,1,actual.stderr);assert.equal(receipt.status,'failed');assert.equal(receipt.interruptionSignal,phase==='identity'?'SIGINT':'SIGTERM');assert.ok(receipt.terminalErrors.some(error=>error.includes('interrupted')));assert.equal(receipt.libraryComplete,false);
  if(mode==='comprehensive')assert.equal(receipt.requestedPathwaysComplete,false);
  if(mode==='specialized')assert.equal(receipt.pathwayResults.fixture.complete,false);
 });
 for(const phase of ['normal','after-commit'])test(`${mode} ${phase} preserves committed pass and zero exit`,async t=>{
  const {actual,receipt}=await run(t,mode,phase);assert.equal(actual.status,0,actual.stderr);assert.equal(receipt.status,'passed');assert.equal(receipt.interruptionSignal,undefined);
 });
 test(`${mode} terminal publication failure is retained with nonzero exit`,async t=>{
  const {actual,receipt}=await run(t,mode,'publication-error');assert.equal(actual.status,1);assert.equal(receipt.status,'failed');assert.ok(receipt.terminalErrors.some(error=>error.includes('injected-publication-error')));
 });
 test(`direct ${mode} protects terminal publication`,async t=>{
  const {actual,receipt}=await run(t,mode,'publication',{direct:true});assert.equal(actual.status,1);assert.equal(receipt.status,'failed');assert.equal(receipt.interruptionSignal,'SIGTERM');
 });
}
test('comprehensive cancellation during actual HTTP server close preserves cleanup and failure',async t=>{
 const {actual,receipt,events}=await run(t,'comprehensive','server-close');assert.equal(actual.status,1,actual.stderr);assert.equal(receipt.status,'failed');assert.deepEqual(events.filter(row=>row.event==='server-closed'),[{event:'server-closed',listening:false}]);
});
test('retired legacy executor rejects execution before acquiring resources',()=>{
 const actual=spawnSync(process.execPath,[resolve(directory,'run.mjs')],{encoding:'utf8',timeout:4000});assert.equal(actual.error,undefined);assert.equal(actual.status,1);assert.match(actual.stderr,/legacy execution runner is retired/);assert.match(actual.stderr,/invoke\.mjs comprehensive/);
});
