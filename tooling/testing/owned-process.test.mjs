import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { ownServiceProcess } from './owned-process.mjs';
import { startOwnedService } from './owned-service.mjs';
import { startOwnedVite } from './owned-vite.mjs';

async function fixture(t){
 const directory=await mkdtemp(join(tmpdir(),'en-owned-process-'));
 t.after(()=>rm(directory,{recursive:true,force:true}));return directory;
}

test('inherited pipes after direct exit produce a bounded failed cleanup and retained log',async t=>{
 const directory=await fixture(t), marker=join(directory,'descendant-finished');
 const code=`const {spawn}=require('node:child_process');spawn(process.execPath,['-e',${JSON.stringify(`setTimeout(()=>require('node:fs').writeFileSync(${JSON.stringify(marker)},'done'),400);`)}],{stdio:['ignore',1,2]}).unref();console.log('direct child terminal');`;
 const child=spawn(process.execPath,['-e',code],{stdio:['ignore','pipe','pipe']});
 const owned=ownServiceProcess(child,join(directory,'service.log'));
 await owned.exited;
 let signals=0;child.kill=()=>{signals++;throw new Error('Cannot signal a reaped child');};
 const start=performance.now(), closing=owned.close({graceMs:20,drainMs:20});
 assert.equal(owned.close(),closing);
 await assert.rejects(closing,error=>error.cleanup?.directChildExited===true&&error.cleanup.pipesClosed===false);
 assert(performance.now()-start<2000);assert.equal(signals,0);
 assert.match(await readFile(join(directory,'service.log'),'utf8'),/direct child terminal/);
 // The intentionally unowned descendant exits itself; no PID-based cleanup.
 const deadline=performance.now()+3000;
 while(true){try{await readFile(marker);break;}catch(error){if(error.code!=='ENOENT')throw error;if(performance.now()>deadline)throw error;await delay(20);}}
});

test('a live TERM-resistant direct child is killed and its pipes close',async t=>{
 const directory=await fixture(t);
 const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','pipe']});
 const owned=ownServiceProcess(child,join(directory,'service.log'));
 await new Promise(resolve=>child.stdout.once('data',resolve));
 await owned.close({graceMs:20,drainMs:1000});
 assert.equal(child.signalCode,'SIGKILL');assert.match(await readFile(join(directory,'service.log'),'utf8'),/ready/);
});

test('spawn failure closes without waiting for an exit event or losing its log',async t=>{
 const directory=await fixture(t);
 const child=spawn(join(directory,'does-not-exist'),[],{stdio:['ignore','pipe','pipe']});
 const owned=ownServiceProcess(child,join(directory,'service.log'));
 assert.match((await owned.exited).error,/ENOENT/);
 await owned.close({graceMs:20,drainMs:100});
 assert.equal(await readFile(join(directory,'service.log'),'utf8'),'');
});

const serverCode=`import {createServer} from 'node:http';const args=process.argv;const port=Number(args[args.indexOf('--port')+1]);createServer((req,res)=>res.end('ready')).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));`;
test('owned service and Vite wrappers announce readiness, fetch and retain shutdown logs',async t=>{
 const root=await fixture(t);
 const reservation=createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const script=join(root,'server.mjs');await writeFile(script,serverCode);
 const service=await startOwnedService({command:[process.execPath,script,'--port',String(port)],cwd:root,env:process.env,origins:[`http://127.0.0.1:${port}`],output:join(root,'service.log')});
 await service.close({graceMs:1000,drainMs:1000});
 assert.match(await readFile(join(root,'service.log'),'utf8'),/http:\/\/127.0.0.1/);
 await mkdir(join(root,'node_modules/vite/bin'),{recursive:true});await mkdir(join(root,'apps/docs'),{recursive:true});
 await writeFile(join(root,'package.json'),'{"type":"module"}');await writeFile(join(root,'node_modules/vite/package.json'),'{"type":"module"}');await writeFile(join(root,'node_modules/vite/bin/vite.js'),serverCode);
 const vite=await startOwnedVite({root,output:join(root,'vite.log')});await vite.close({graceMs:1000,drainMs:1000});
 assert((await readFile(join(root,'vite.log'),'utf8')).includes(vite.url));
});
