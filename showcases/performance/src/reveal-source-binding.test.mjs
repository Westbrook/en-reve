import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {mkdtemp,open,readdir,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {archiveBoundDiff,digestFile,verifyCanonicalDiff,sourceVerificationPolicy} from './reveal-source-binding.mjs';

// These controls are synthetic. They never invoke Git, Playwright or the runner.
const canonicalArgs=['-C','/synthetic/repo','diff','--binary','--full-index','--no-ext-diff','--no-textconv','tested','arm','--'];
async function pattern(path,length,flipAt=-1){
  const file=await open(path,'w'),hash=createHash('sha256');
  try{
    for(let offset=0;offset<length;){
      const chunk=Buffer.alloc(Math.min(32749,length-offset));
      for(let i=0;i<chunk.length;i++)chunk[i]=((offset+i)*17+31)%256;
      if(flipAt>=offset&&flipAt<offset+chunk.length)chunk[flipAt-offset]^=1;
      hash.update(chunk);
      for(let written=0;written<chunk.length;){const {bytesWritten}=await file.write(chunk,written,chunk.length-written);written+=bytesWritten;}
      offset+=chunk.length;
    }
  }finally{await file.close();}
  return {path,bytes:length,sha256:hash.digest('hex')};
}
async function fixture(t,length){
  const directory=await mkdtemp(join(tmpdir(),'reveal-binding-control-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const reviewed=await pattern(join(directory,'reviewed.diff'),length);
  return {directory,reviewed,output:join(directory,'archive','reviewed.diff')};
}
function program(length,{flipAt=-1,exitCode=0,exitDelay=0,stderr='',stayAlive=false,signal=false}={}){
  return `import {once} from 'node:events';
    for(let offset=0;offset<${length};){
      const chunk=Buffer.alloc(Math.min(65521,${length}-offset));
      for(let i=0;i<chunk.length;i++)chunk[i]=((offset+i)*17+31)%256;
      if(${flipAt}>=offset&&${flipAt}<offset+chunk.length)chunk[${flipAt}-offset]^=1;
      if(!process.stdout.write(chunk))await once(process.stdout,'drain');offset+=chunk.length;
    }
    await new Promise(resolve=>process.stdout.end(resolve));
    ${stderr?`process.stderr.write(${JSON.stringify(stderr)});`:''}
    ${stayAlive?'setInterval(()=>{},1000);':signal?"process.kill(process.pid,'SIGTERM');":`await new Promise(resolve=>setTimeout(resolve,${exitDelay}));process.exitCode=${exitCode};`}`;
}
function processGit(script){
  const state={closed:false};
  state.spawnGit=(command,args,options)=>{
    assert.equal(command,'git');assert.deepEqual(args,canonicalArgs);assert.deepEqual(options,{stdio:['ignore','pipe','pipe']});
    state.child=spawn(process.execPath,['--input-type=module','-e',script],options);
    state.child.once('close',()=>{state.closed=true;});
    return state.child;
  };
  return state;
}
const verify=(reviewed,state)=>verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'candidate',{spawnGit:state.spawnGit});
async function rejectsClosed(reviewed,state,matcher){
  await assert.rejects(verify(reviewed,state),matcher);
  assert.equal(state.closed,true,'verification must await child close');
  if(state.child?.pid)assert.throws(()=>process.kill(state.child.pid,0),error=>error.code==='ESRCH');
}
function syntheticGit(action,{ignoreTerm=false}={}){
  const state={closed:false,kills:[]};
  state.spawnGit=()=>{
    const child=new EventEmitter();state.child=child;
    child.stdout=new PassThrough();child.stderr=new PassThrough();
    const close=(code=0,signal=null)=>{
      if(state.closing)return;state.closing=true;
      setTimeout(()=>{child.stdout.end();child.stderr.end();state.closed=true;child.emit('close',code,signal);},20);
    };
    child.kill=signal=>{state.kills.push(signal);if(signal!=='SIGTERM'||!ignoreTerm)close(null,signal);return true;};
    queueMicrotask(()=>action(child,close));
    return child;
  };
  return state;
}

test('streams more than 32 MiB, preserves exact canonical arguments and archives complete bytes',async t=>{
  const {reviewed,output}=await fixture(t,40*1024*1024+137);
  const archived=await archiveBoundDiff(reviewed,output),state=processGit(program(reviewed.bytes));
  assert.deepEqual(archived,{...reviewed,path:output});
  const result=await verify(archived,state);assert.equal(result.bytes,reviewed.bytes);assert.equal(result.sha256,reviewed.sha256);assert.equal(result.verification.status,'passed');assert.equal(result.verification.timeoutMs,10000);assert.equal(result.verification.verifiedBytes,reviewed.bytes);assert.equal(result.verification.child.closeObserved,true);
  assert.equal(state.closed,true);
  assert.deepEqual(await digestFile(output),{bytes:reviewed.bytes,sha256:reviewed.sha256});
});
test('empty diff is valid only against empty canonical output',async t=>{
  const {reviewed}=await fixture(t,0);
  const result=await verify(reviewed,processGit(program(0)));assert.equal(result.bytes,0);assert.equal(result.sha256,reviewed.sha256);assert.equal(result.verification.status,'passed');
  await rejectsClosed(reviewed,processGit(program(1)),/source-equivalence delta changed/);
});
for(const [label,delta,flipAt]of [['early same-length mismatch',0,17],['late same-length mismatch',0,65536],['shorter stdout',-1,-1],['longer stdout',1,-1]]){
  test(label+' rejects and reaps a live producer',async t=>{
    const {reviewed}=await fixture(t,65537);
    await rejectsClosed(reviewed,processGit(program(reviewed.bytes+delta,{flipAt,stayAlive:true})),/source-equivalence delta changed/);
  });
}
test('matching bytes with nonzero exit or signal are never accepted',async t=>{
  const {reviewed}=await fixture(t,137);
  await rejectsClosed(reviewed,processGit(program(137,{exitCode:7,exitDelay:40,stderr:'synthetic failure'})),error=>error.code===7&&error.stderr==='synthetic failure'&&error.stack.includes('synthetic failure'));
  await rejectsClosed(reviewed,processGit(program(137,{signal:true})),error=>error.signal==='SIGTERM');
});
test('archive digest rejects substitution after its first hash even if Git matches the replacement',async t=>{
  const {reviewed,output}=await fixture(t,257),archived=await archiveBoundDiff(reviewed,output);
  await pattern(output,257,19);
  await rejectsClosed(archived,processGit(program(257,{flipAt:19})),/source-equivalence delta changed/);
});
test('bad reviewed digest does not publish an archive or remove its source, and staging is cleaned',async t=>{
  const {directory,reviewed,output}=await fixture(t,257),bad={...reviewed,sha256:'0'.repeat(64)};
  await assert.rejects(archiveBoundDiff(bad,output),/source equivalence diff changed/);
  assert.deepEqual(await readdir(join(directory,'archive')),[]);
  await assert.rejects(archiveBoundDiff(bad,reviewed.path),/source equivalence diff changed/);
  assert.deepEqual(await digestFile(reviewed.path),{bytes:257,sha256:reviewed.sha256});
  assert.deepEqual((await readdir(directory)).sort(),['archive','reviewed.diff']);
});
test('missing reviewed file never starts a child; synchronous spawn errors propagate',async t=>{
  const {reviewed,directory}=await fixture(t,0);let called=false;
  await assert.rejects(verify({...reviewed,path:join(directory,'missing')},{spawnGit:()=>{called=true;}}),error=>error.code==='ENOENT');
  assert.equal(called,false);
  await assert.rejects(verify(reviewed,{spawnGit:()=>{throw Error('synthetic spawn throw');}}),/synthetic spawn throw/);
});
for(const target of ['child','stdout','stderr']){
  test(target+' error terminates child and waits for delayed close',async t=>{
    const {reviewed}=await fixture(t,0),state=syntheticGit(child=>(target==='child'?child:child[target]).emit('error',Error('synthetic '+target+' failure')));
    await rejectsClosed(reviewed,state,new RegExp('synthetic '+target+' failure'));
    assert.deepEqual(state.kills,['SIGTERM']);
  });
}
test('reviewed read error after spawn terminates and reaps child',async t=>{
  const {reviewed,directory}=await fixture(t,0),state=syntheticGit(child=>child.stdout.write(Buffer.from('x')));
  await rejectsClosed({...reviewed,path:directory},state,error=>error.code==='EISDIR');
  assert.deepEqual(state.kills,['SIGTERM']);
});
test('stderr preserves the 32 MiB failure cap with bounded diagnostic retention',async t=>{
  const {reviewed}=await fixture(t,0),state=syntheticGit(child=>{
    for(let i=0;i<515;i++)child.stderr.write(Buffer.alloc(65536,120));
    state.stderrPendingAfterOverflow=child.stderr.readableLength;
  });
  await rejectsClosed(reviewed,state,error=>error.code==='ERR_CHILD_PROCESS_STDIO_MAXBUFFER'&&Buffer.byteLength(error.stderr)===65536&&error.stderrTruncated);
  assert.deepEqual(state.kills,['SIGTERM']);
  assert.equal(state.stderrPendingAfterOverflow,0,'stderr must keep draining after the cap is exceeded');
});
test('unresponsive child receives SIGKILL and is reaped after first termination attempt',async t=>{
  const {reviewed}=await fixture(t,0),state=syntheticGit(child=>child.emit('error',Error('synthetic failure')),{ignoreTerm:true});
  await rejectsClosed(reviewed,state,/synthetic failure/);
  assert.deepEqual(state.kills,['SIGTERM','SIGKILL']);
});
test('the original 10000 ms deadline remains active after stdout EOF until child close',async t=>{
  const {reviewed}=await fixture(t,0),state=processGit(program(0,{stayAlive:true})),started=Date.now();
  await rejectsClosed(reviewed,state,error=>error.code==='ETIMEDOUT');
  assert.ok(Date.now()-started>=9900,'deadline must retain its 10000 ms value');
});
test('qualification hashing uses raw bytes and a known SHA-256 oracle',async t=>{
  const {reviewed}=await fixture(t,0);await writeFile(reviewed.path,'abc');
  assert.deepEqual(await digestFile(reviewed.path),{bytes:3,sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'});
});

// Prospective I/O-policy controls; no performance measurement budgets change.
test('source policy defaults to 10000 and explicitly accepts the frozen 120000 allocation',()=>{
 assert.deepEqual(sourceVerificationPolicy(),{canonicalDiffTimeoutMs:10000});
 assert.deepEqual(sourceVerificationPolicy({canonicalDiffTimeoutMs:120000}),{canonicalDiffTimeoutMs:120000});
});
for(const [label,value]of [['null',null],['empty',{}],['array',[]],['string','120000'],['unknown',{canonicalDiffTimeoutMs:120000,retries:1}],['fraction',{canonicalDiffTimeoutMs:1.5}],['zero',{canonicalDiffTimeoutMs:0}],['negative',{canonicalDiffTimeoutMs:-1}],['infinite',{canonicalDiffTimeoutMs:Infinity}],['above-allocation',{canonicalDiffTimeoutMs:120001}],['timer-overflow',{canonicalDiffTimeoutMs:2147483648}]])test('source policy rejects '+label,()=>assert.throws(()=>sourceVerificationPolicy(value),/Invalid canonical/));
test('explicit finite deadline records byte progress and reaps a hanging producer',async t=>{
 const {reviewed}=await fixture(t,137),state=syntheticGit(child=>{const b=Buffer.alloc(137);for(let i=0;i<b.length;i++)b[i]=(i*17+31)%256;child.stdout.end(b);});
 await assert.rejects(verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'reference',{spawnGit:state.spawnGit,timeoutMs:250}),error=>{
  assert.equal(error.code,'ETIMEDOUT');assert.match(error.message,/250 ms/);const e=error.sourceVerification;
  assert.equal(e.timeoutMs,250);assert.equal(e.armId,'reference');assert.equal(e.from,'tested');assert.equal(e.to,'arm');assert.equal(e.expectedBytes,137);assert.equal(e.receivedBytes,137);assert.equal(e.verifiedBytes,137);assert.ok(e.elapsedMs>=240);assert.equal(e.child.closeObserved,true);assert.equal(e.child.signal,'SIGTERM');assert.equal(e.primaryFailure.code,'ETIMEDOUT');assert.deepEqual(e.cleanupErrors,[]);assert.deepEqual(e.termination.map(x=>x.signal),['SIGTERM']);return true;
 });assert.equal(state.closed,true);
});
test('explicit 120000 policy records successful full comparison without waiting for its ceiling',async t=>{
 const {reviewed}=await fixture(t,137),state=processGit(program(137));const result=await verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'candidate',{spawnGit:state.spawnGit,timeoutMs:120000});assert.equal(result.verification.timeoutMs,120000);assert.equal(result.verification.status,'passed');assert.equal(result.verification.receivedBytes,137);assert.deepEqual(result.verification.termination,[]);
});
test('timeout telemetry retains TERM escalation and awaited SIGKILL close separately',async t=>{
 const {reviewed}=await fixture(t,0),state=syntheticGit(()=>{},{ignoreTerm:true});
 await assert.rejects(verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'reference',{spawnGit:state.spawnGit,timeoutMs:20}),error=>{assert.equal(error.code,'ETIMEDOUT');assert.equal(error.sourceVerification.child.closeObserved,true);assert.equal(error.sourceVerification.child.signal,'SIGKILL');assert.deepEqual(error.sourceVerification.termination.map(x=>x.signal),['SIGTERM','SIGKILL']);return true;});assert.equal(state.closed,true);
});
test('invalid helper deadline fails before opening or spawning',async t=>{
 const {reviewed}=await fixture(t,0);let spawned=false;await assert.rejects(verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'reference',{timeoutMs:Infinity,spawnGit:()=>{spawned=true;}}),/Invalid canonical/);assert.equal(spawned,false);
});

test('cleanup AggregateError retains first failure and separate telemetry',async t=>{
 const {reviewed}=await fixture(t,0),primary=Object.assign(Error('synthetic primary'),{code:'EPRIMARY'}),state=syntheticGit(child=>child.emit('error',primary));const original=state.spawnGit;
 state.spawnGit=(...args)=>{const child=original(...args),kill=child.kill;child.kill=signal=>{kill(signal);throw Error('synthetic kill bookkeeping failure');};return child;};
 await assert.rejects(verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'reference',{spawnGit:state.spawnGit,timeoutMs:120000}),error=>{assert.ok(error instanceof AggregateError);assert.equal(error.cause,primary);assert.equal(error.errors[0],primary);assert.equal(error.sourceVerification.primaryFailure.code,'EPRIMARY');assert.equal(error.sourceVerification.cleanupErrors[0].message,'synthetic kill bookkeeping failure');assert.equal(error.sourceVerification.child.closeObserved,true);return true;});assert.equal(state.closed,true);
});

test('full verification deadline remains active through archive read after child close',async t=>{
 const {reviewed}=await fixture(t,137),state=syntheticGit((child,close)=>{const b=Buffer.alloc(137);for(let i=0;i<b.length;i++)b[i]=(i*17+31)%256;child.stdout.end(b);close();});
 const openReviewed=async(...args)=>{const handle=await open(...args);return {read:async(...readArgs)=>{await new Promise(resolve=>setTimeout(resolve,80));return handle.read(...readArgs);},close:()=>handle.close()};};
 await assert.rejects(verifyCanonicalDiff('/synthetic/repo','tested','arm',reviewed,'reference',{spawnGit:state.spawnGit,openReviewed,timeoutMs:40}),error=>{assert.equal(error.code,'ETIMEDOUT');assert.equal(error.sourceVerification.child.closeObserved,true);assert.equal(error.sourceVerification.status,'failed');assert.ok(error.sourceVerification.elapsedMs>=35);return true;});assert.equal(state.closed,true);
});
