import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { ownServiceProcess } from './owned-process.mjs';
import { dirname } from 'node:path';

export async function startOwnedService({command,cwd,env,origins,output}) {
 await mkdir(dirname(output),{recursive:true});
 const child=spawn(command[0],command.slice(1),{cwd,env,stdio:['ignore','pipe','pipe']});
 const owned=ownServiceProcess(child,output);
 const close=options=>owned.close(options);

 try{
  await new Promise((yes,no)=>{
   const timer=setTimeout(()=>no(new Error('Owned service did not announce every origin')),60000);
   child.stdout.on('data',chunk=>{if(origins.every(origin=>owned.log.includes(origin))){clearTimeout(timer);yes();}});
   child.once('error',error=>{clearTimeout(timer);no(error);});
   owned.exited.then(result=>{clearTimeout(timer);no(new Error('Owned service exited: '+JSON.stringify(result)));});
  });
  for(const origin of origins){
   const response=await fetch(origin,{signal:AbortSignal.timeout(10000)});
   if(!response.ok||owned.finished)throw new Error('Owned service failed readiness: '+origin);
  }
  return {origins,close};
 }catch(error){await close();throw error;}
}
