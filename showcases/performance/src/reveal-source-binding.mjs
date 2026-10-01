import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {copyFile,mkdir,mkdtemp,open,rename,rm} from 'node:fs/promises';
import {dirname,join} from 'node:path';

const chunkBytes=64*1024,stderrLimit=32*1024*1024,diagnosticLimit=64*1024,defaultTimeoutMs=10000;

export function sourceVerificationPolicy(value){
  if(value===undefined)return {canonicalDiffTimeoutMs:defaultTimeoutMs};
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1||!Object.hasOwn(value,'canonicalDiffTimeoutMs')||!Number.isSafeInteger(value.canonicalDiffTimeoutMs)||value.canonicalDiffTimeoutMs<1||value.canonicalDiffTimeoutMs>120000)throw Error('Invalid canonical source-verification policy');
  return {canonicalDiffTimeoutMs:value.canonicalDiffTimeoutMs};
}

export async function digestFile(path){
  const hash=createHash('sha256');let bytes=0;
  for await(const chunk of createReadStream(path,{highWaterMark:chunkBytes})){hash.update(chunk);bytes+=chunk.length;}
  return {bytes,sha256:hash.digest('hex')};
}

export async function archiveBoundDiff(spec,path){
  const name='reviewed tested-to-arm source equivalence diff';
  if(!spec?.path||!/^[a-f0-9]{64}$/.test(spec.sha256??''))throw Error('Hash-bound '+name+' required');
  await mkdir(dirname(path),{recursive:true});
  const staging=await mkdtemp(join(dirname(path),'.reviewed-diff-')),temporary=join(staging,'diff');let failure;
  try{
    await copyFile(spec.path,temporary);
    const digest=await digestFile(temporary);
    if(digest.sha256!==spec.sha256)throw Error(name+' changed');
    await rename(temporary,path);
    return {path,...digest};
  }catch(error){failure=error;throw error;}
  finally{
    try{await rm(staging,{recursive:true,force:true});}catch(cleanup){throw new AggregateError([...(failure?[failure]:[]),cleanup],'Could not remove reviewed diff staging directory',{cause:failure??cleanup});}
  }
}

// spawnGit is a focused synthetic-test seam; the runner uses the native spawn.
export async function verifyCanonicalDiff(repo,from,to,reviewed,armId,{spawnGit=spawn,openReviewed=open,timeoutMs=defaultTimeoutMs}={}){
  sourceVerificationPolicy({canonicalDiffTimeoutMs:timeoutMs});
  const startedAt=new Date().toISOString(),started=performance.now(),buffer=Buffer.allocUnsafe(chunkBytes),hash=createHash('sha256');
  let expected,receivedBytes=0,verificationElapsedMs;const termination=[];
  let child,closed,hasClosed=false,timer,killTimer,failure,outcome,bytes=0,stderrBytes=0,diagnosticBytes=0;
  const diagnostics=[],cleanupErrors=[];
  const kill=signal=>{termination.push({signal,elapsedMs:performance.now()-started});try{child.kill(signal);}catch(error){cleanupErrors.push(error);}};
  const stop=error=>{
    failure??=error;verificationElapsedMs??=performance.now()-started;
    if(!child||hasClosed)return;
    if(!killTimer){
      // Keep the original SIGTERM timeout behavior, then reap an unresponsive child.
      killTimer=setTimeout(()=>{if(!hasClosed)kill('SIGKILL');},1000);
      kill('SIGTERM');
    }
    child.stdout?.destroy();
  };
  const changed=()=>Error('Functional source-equivalence delta changed: '+armId);
  const deadlineError=()=>Object.assign(Error('Canonical git diff timed out after '+timeoutMs+' ms'),{code:'ETIMEDOUT'});
  timer=setTimeout(()=>stop(deadlineError()),timeoutMs);
  try{
    expected=await openReviewed(reviewed.path,'r');
    if(failure)throw failure;
    if(performance.now()-started>=timeoutMs)throw deadlineError();
    child=spawnGit('git',['-C',repo,'diff','--binary','--full-index','--no-ext-diff','--no-textconv',from,to,'--'],{stdio:['ignore','pipe','pipe']});
    // Resolve, rather than reject, so an early spawn/exit failure cannot be unhandled
    // while an archive read is in flight. Always wait for close before returning.
    closed=new Promise(resolve=>child.once('close',(code,signal)=>{hasClosed=true;outcome={code,signal};clearTimeout(killTimer);resolve();}));
    child.on('error',stop);
    child.stdout.on('error',stop);child.stderr.on('error',stop);
    child.stderr.on('data',chunk=>{
      stderrBytes+=chunk.length;
      const retain=Math.min(chunk.length,diagnosticLimit-diagnosticBytes);
      if(retain>0){diagnostics.push(Buffer.from(chunk.subarray(0,retain)));diagnosticBytes+=retain;}
      if(stderrBytes>stderrLimit)stop(Object.assign(Error('Canonical git diff stderr exceeded 32 MiB'),{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}));
    });
    for await(const chunk of child.stdout){
      receivedBytes+=chunk.length;
      for(let offset=0;offset<chunk.length;){
        const length=Math.min(buffer.length,chunk.length-offset);
        const {bytesRead}=await expected.read(buffer,0,length,null);
        if(bytesRead===0||!buffer.subarray(0,bytesRead).equals(chunk.subarray(offset,offset+bytesRead)))throw changed();
        hash.update(chunk.subarray(offset,offset+bytesRead));bytes+=bytesRead;offset+=bytesRead;
      }
    }
    if((await expected.read(buffer,0,1,null)).bytesRead!==0||bytes!==reviewed.bytes||hash.digest('hex')!==reviewed.sha256)throw changed();
    await closed;
    if(!failure&&(outcome.code!==0||outcome.signal))failure=Object.assign(Error('Canonical git diff failed: '+(outcome.signal??outcome.code)),outcome);
    verificationElapsedMs??=performance.now()-started;
    if(!failure&&verificationElapsedMs>=timeoutMs)stop(deadlineError());
  }catch(error){stop(error);}
  finally{
    if(child){
      if(failure)stop(failure);
      await closed;
      clearTimeout(timer);clearTimeout(killTimer);
      child.stdout?.destroy();child.stderr?.destroy();
    }
    clearTimeout(timer);
    try{await expected?.close();}catch(error){cleanupErrors.push(error);}
  }
  if(failure){
    failure.stderr=Buffer.concat(diagnostics,diagnosticBytes).toString('utf8');
    failure.stderrTruncated=stderrBytes>diagnosticBytes;
    if(failure.stderr){const suffix='\n'+failure.stderr+(failure.stderrTruncated?'\n[stderr diagnostic truncated]':'');failure.stack+=suffix;failure.message+=suffix;}
  }
  const errorIdentity=error=>({name:error.name,message:error.message,code:error.code??null,signal:error.signal??null});
  const verification={schema:1,armId,from,to,timeoutMs,startedAt,elapsedMs:verificationElapsedMs??performance.now()-started,totalElapsedMs:performance.now()-started,expectedBytes:reviewed.bytes,expectedSha256:reviewed.sha256,receivedBytes,verifiedBytes:bytes,stderrBytes,stderrTruncated:stderrBytes>diagnosticBytes,child:{started:!!child,closeObserved:hasClosed,code:outcome?.code??null,signal:outcome?.signal??null},termination,status:failure||cleanupErrors.length?'failed':'passed',primaryFailure:failure?errorIdentity(failure):null,cleanupErrors:cleanupErrors.map(errorIdentity)};
  const problem=cleanupErrors.length?new AggregateError([...(failure?[failure]:[]),...cleanupErrors],'Canonical diff cleanup failed',{cause:failure??cleanupErrors[0]}):failure;
  if(problem){problem.sourceVerification=verification;throw problem;}
  return {bytes,sha256:reviewed.sha256,verification};
}
