import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

/** One immutable identity collection phase only. Never retain across commands,
 * assertions, producer boundaries, final verification, or future invocations. */
export function fileDigests({concurrency=24}={}) {
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>24)throw new Error('Identity reads require a bounded1..24 budget');
 const pending=new Map(),queue=[];let active=0,reads=0,hits=0,peak=0;
 async function read(path){
  await new Promise(yes=>{if(active<concurrency){active++;peak=Math.max(peak,active);yes();}else queue.push(yes);});
  try{reads++;return 'sha256:'+createHash('sha256').update(await readFile(path)).digest('hex');}
  finally{const next=queue.shift();if(next)next();else active--;}
 }
 function digestFile(path){
  const key=resolve(path);
  if(pending.has(key)){hits++;return pending.get(key);}
  const value=read(key);pending.set(key,value);return value;
 }
 return {digestFile,stats:()=>({reads,hits,peak,paths:pending.size,scope:'one identity phase; content hashes only, no timestamp/result cache'})};
}
