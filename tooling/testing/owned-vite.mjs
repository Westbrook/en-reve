import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { ownServiceProcess } from './owned-process.mjs';
import { resolve, dirname } from 'node:path';

/** A fresh strict-port Vite process must announce readiness; never borrow an existing service. */
export async function startOwnedVite({root,output,env=process.env,workspace='apps/docs',preview=false}) {
 await mkdir(dirname(output),{recursive:true});
 const reservation=createServer();await new Promise((yes,no)=>{reservation.once('error',no);reservation.listen(0,'127.0.0.1',yes);});
 const port=reservation.address().port;await new Promise(yes=>reservation.close(yes));
 const url=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,[resolve(root,preview?`${workspace}/node_modules/vite/bin/vite.js`:'node_modules/vite/bin/vite.js'),...(preview?['preview']:[]),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:resolve(root,workspace),env,stdio:['ignore','pipe','pipe']});
 const owned=ownServiceProcess(child,output);
 const close=options=>owned.close(options);
 try {
  await new Promise((yes,no)=>{
   const timeout=setTimeout(()=>no(new Error('Owned development server did not announce readiness')),60000);
   const inspect=chunk=>{const plain=owned.log.replace(/\x1b\[[0-9;]*m/g,'');if(plain.includes(url)){clearTimeout(timeout);yes();}};
   child.stdout.on('data',inspect);
   child.once('error',error=>{clearTimeout(timeout);no(error);});
   owned.exited.then(result=>{clearTimeout(timeout);no(new Error(`Owned Vite exited: ${JSON.stringify(result)}\n${owned.log}`));});
  });
  const response=await fetch(url+'/',{signal:AbortSignal.timeout(10000)});if(!response.ok||owned.finished)throw new Error('Owned development fixture is unavailable');
 } catch(error){await close();throw error;}
 return {url,close};
}
