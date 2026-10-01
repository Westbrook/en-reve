import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

test('SIGTERM retains failed measurement and ends the exact owned descendant group',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'en-measure-interruption-'));
 const script=resolve(directory,'tree.mjs'),marker=resolve(directory,'ready.json'),output=resolve(directory,'measurement');
 await writeFile(script,`import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});writeFileSync(process.argv[2],JSON.stringify({parent:process.pid,descendant:child.pid}));setInterval(()=>{},1000);`);
 const child=spawn(process.env.EN_TEST_PYTHON??'python3',[fileURLToPath(new URL('./measure.py',import.meta.url)),'--out',output,'--cwd',directory,'--label','interrupt-negative-control','--',process.execPath,script,marker],{stdio:'pipe'});
 let log='';child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 const closed=new Promise((yes,no)=>{child.once('error',no);child.once('close',(code,signal)=>yes({code,signal}));});
 let pids;
 try{
  const deadline=performance.now()+10000;
  while(performance.now()<deadline){try{pids=JSON.parse(await readFile(marker,'utf8'));break;}catch(error){if(error.code!=='ENOENT')throw error;}await delay(20);}
  assert(pids,'Owned process did not signal readiness: '+log);
  child.kill('SIGTERM');
  const result=await closed;assert.notEqual(result.code,0);
  const receipt=JSON.parse(await readFile(resolve(output,'receipt.json'),'utf8'));
  assert.equal(receipt.status,'failed',JSON.stringify({result,receipt,log}));assert.match(receipt.error,/Interrupted by signal/);
  assert.equal(receipt.interruptedProcessOwnership,'new-session process group');
  for(const pid of Object.values(pids)){
   const deadline=performance.now()+10000;let alive=true;
   while(performance.now()<deadline){try{process.kill(pid,0);}catch(error){if(error.code!=='ESRCH')throw error;alive=false;break;}await delay(20);}
   assert(!alive,`Owned PID ${pid} survived cleanup`);
  }
 }finally{
  if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await closed;}
  await rm(directory,{recursive:true,force:true});
 }
});


test('measurement retains signal authority and terminal cancellation outcomes',async()=>{
 const child=spawn(process.env.EN_TEST_PYTHON??'python3',[fileURLToPath(new URL('./measure-regression.py',import.meta.url))],{stdio:'pipe'});
 let log='';child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 const result=await new Promise((yes,no)=>{child.once('error',no);child.once('close',(code,signal)=>yes({code,signal}));});
 assert.equal(result.code,0,log);assert.match(log,/Ran 11 tests/);
});

test('native Node failure stops a real cohort and releases its long-running worker',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'en-native-failure-control-')),output=resolve(directory,'measurement'),events=resolve(directory,'events.jsonl'),marker=resolve(directory,'worker.json');
 const failing=resolve(directory,'a.test.mjs'),slow=resolve(directory,'b.test.mjs');
 await writeFile(failing,`import test from 'node:test';import {existsSync} from 'node:fs';test('seeded failure',async()=>{const until=Date.now()+10000;while(!existsSync(${JSON.stringify(marker)})&&Date.now()<until)await new Promise(r=>setTimeout(r,10));throw Error('native-negative-marker');});`);
 await writeFile(slow,`import test from 'node:test';import {writeFileSync} from 'node:fs';test('long independent case',async()=>{writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:process.pid}));await new Promise(r=>setTimeout(r,30000));});`);
 const env={...process.env};delete env.NODE_TEST_CONTEXT;
 const child=spawn(process.env.EN_TEST_PYTHON??'python3',[fileURLToPath(new URL('./measure.py',import.meta.url)),'--out',output,'--label','native-negative','--node-fail-fast-events',events,'--',process.execPath,'--test','--test-concurrency=2',`--test-reporter=${fileURLToPath(new URL('./node-facet-reporter.mjs',import.meta.url))}`,`--test-reporter-destination=${events}`,failing,slow],{env,stdio:'pipe'});
 let log='';child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);const closed=new Promise((yes,no)=>{child.once('error',no);child.once('close',yes);});
 try{assert.equal(await closed,1,log);const receipt=JSON.parse(await readFile(resolve(output,'receipt.json'),'utf8'));assert.equal(receipt.failurePhase,'native-node-failure');assert(receipt.firstFailureSeconds<15);assert(receipt.wallSeconds<25);const {pid}=JSON.parse(await readFile(marker,'utf8'));let alive=true;const until=performance.now()+10000;while(performance.now()<until){try{process.kill(pid,0);}catch(error){if(error.code!=='ESRCH')throw error;alive=false;break;}await delay(20);}assert(!alive,'Native worker survived fail-fast cleanup');}
 finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await closed;}await rm(directory,{recursive:true,force:true});}
});
