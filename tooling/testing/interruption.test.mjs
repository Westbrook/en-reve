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
 assert.equal(result.code,0,log);assert.match(log,/Ran 9 tests/);
});
