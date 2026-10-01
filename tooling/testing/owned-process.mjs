import { writeFile } from 'node:fs/promises';

/** Own the direct child and its pipes without extending signal authority past exit. */
export function ownServiceProcess(child, output) {
 let log='', didExit=false, didClose=false, spawnError, closePromise;
 child.stdout?.on('data',chunk=>{log+=chunk;});
 child.stderr?.on('data',chunk=>{log+=chunk;});
 const exited=new Promise(resolve=>{
  child.once('exit',(code,signal)=>{didExit=true;resolve({code,signal});});
  child.once('error',error=>{spawnError=error;resolve({error:error.message});});
 });
 const closed=new Promise(resolve=>child.once('close',(code,signal)=>{didClose=true;resolve({code,signal});}));
 const waitFor=(promise,ms)=>new Promise(resolve=>{
  const timer=setTimeout(()=>resolve(false),ms);
  promise.then(()=>{clearTimeout(timer);resolve(true);});
 });
 function signalDirect(signal){
  if(!didExit&&!spawnError)child.kill(signal);
 }
 return {
  get log(){return log;},
  get finished(){return didExit||didClose||Boolean(spawnError);},
  exited,
  close({graceMs=10000,drainMs=1000}={}){
   if(closePromise)return closePromise;
   for(const value of [graceMs,drainMs])if(!Number.isFinite(value)||value<0||value>60000)throw new Error('Shutdown bounds must be between 0 and 60000ms');
   closePromise=(async()=>{
    let failure;
    try{
     signalDirect('SIGTERM');
     if(!didClose&&!await waitFor(closed,graceMs)){
      signalDirect('SIGKILL');
      if(!didClose&&!await waitFor(closed,drainMs)){
       failure=new Error('Owned service cleanup incomplete: direct child or inherited output pipes did not close within the shutdown bounds');
       failure.cleanup={directChildExited:didExit,pipesClosed:didClose,descendantOwnership:'not proven; no descendant signal sent'};
       child.stdout?.destroy();child.stderr?.destroy();child.unref();
      }
     }
    }finally{await writeFile(output,log);}
    if(failure)throw failure;
   })();
   return closePromise;
  },
 };
}
