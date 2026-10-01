let interrupted;
let handlersInstalled=false, terminalCommitted=false;
const terminalReceipts=[];
const children=new Set();
export function throwIfInterrupted(){if(interrupted)throw new Error(`Execution interrupted by ${interrupted}; owned children were asked to finish cleanup`);}
export function installInterruptionHandlers(){
 handlersInstalled=true;
 const handlers=new Map(['SIGINT','SIGTERM'].map(signal=>[signal,()=>{
  if(terminalCommitted)return;
  interrupted??=signal;
  for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');
 }]));
 for(const [signal,handler] of handlers)process.on(signal,handler);
 return ()=>{
  // A committed CLI outcome is immutable through process shutdown.
  if(terminalCommitted)return;
  for(const [signal,handler] of handlers)process.off(signal,handler);
  handlersInstalled=false;
 };
}
/** Wait for the receipt writer's cleanup before releasing the shared-output lease. */
export async function waitOwnedCommand(child){
 children.add(child);
 if(interrupted)child.kill('SIGTERM');
 try{
  const result=await new Promise((yes,no)=>{child.once('error',no);child.once('close',(code,signal)=>yes(code??`signal:${signal}`));});
  throwIfInterrupted();return result;
 }finally{children.delete(child);}
}

/** Publish aggregate outcomes after the invocation's server and owner cleanup. */
export async function terminalReceipt(receipt,publish,{onFailure=()=>{},onCommitted=()=>{}}={}){
 terminalReceipts.push({receipt,publish,onFailure,onCommitted});
 // Direct runner entrypoints still protect their asynchronous terminal writes.
 if(!handlersInstalled){const dispose=installInterruptionHandlers();try{await finishExecution();}finally{dispose();}}
}
export async function finishExecution(failure){
 let appliedSignal, publicationFailed=false;
 const failures=failure?[failure]:[];
 for(;;){
  const signal=interrupted;
  if(signal&&signal!==appliedSignal){
   failures.push(new Error(`Execution interrupted by ${signal} during finalization`));
   appliedSignal=signal;
  }
  if(failures.length){
   process.exitCode=1;
   for(const entry of terminalReceipts){
    const receipt=entry.receipt;
    receipt.status='failed';receipt.libraryComplete=false;
    if('requestedPathwaysComplete' in receipt)receipt.requestedPathwaysComplete=false;
    receipt.terminalErrors=failures.map(error=>String(error.stack??error));
    if(signal)receipt.interruptionSignal=signal;
    entry.onFailure();
   }
  }
  try{for(const entry of terminalReceipts)await entry.publish();}
  catch(error){
   // Retain a publication failure when a second attempt can still write evidence.
   failures.push(error);process.exitCode=1;
   if(publicationFailed)throw new AggregateError(failures,'Terminal receipt publication failed');
   publicationFailed=true;continue;
  }
  if(interrupted!==signal)continue;
  // No asynchronous work separates this decision from freezing signal handlers.
  terminalCommitted=true;
  for(const entry of terminalReceipts)entry.onCommitted();
  if(failures.length)throw new AggregateError(failures,'Execution did not complete successfully');
  return;
 }
}
