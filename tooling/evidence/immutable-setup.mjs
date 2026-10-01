import { mkdir, open, readFile, rm, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { contentInventory, inventoryDigest, atomicJSON } from './setup.mjs';

/** Validates immutable setup outputs only; never accepts a cached test outcome. */
export async function lookupImmutableSetup({cache, inputs}) {
 if(process.env.EN_SETUP_CACHE==='off')return null;
 const key=inventoryDigest(inputs).slice(7), pointer=resolve(cache,`${key}.json`);
 try {
  const receipt=JSON.parse(await readFile(pointer,'utf8'));
  const {integrity,...payload}=receipt;
  if(receipt.schemaVersion!==2 || receipt.key!==key || typeof receipt.directory!=='string' ||
     typeof receipt.originatingProducer!=='string' || !Number.isFinite(Date.parse(receipt.originatingProducer)) ||
     !receipt.outputs || typeof receipt.outputs!=='object' || Array.isArray(receipt.outputs) || !Object.keys(receipt.outputs).length ||
     integrity!==inventoryDigest(payload))return null;
  const directory=resolve(receipt.directory), cacheRoot=resolve(cache);
  if(directory!==receipt.directory || !directory.startsWith(cacheRoot+sep))return null;
  if(!(await realpath(directory)).startsWith((await realpath(cacheRoot))+sep))return null;
  if(inventoryDigest(await contentInventory(directory,['.'],undefined,false))!==inventoryDigest(receipt.outputs))return null;
  return {directory,reused:true,originatingProducer:receipt.originatingProducer,key};
 } catch(error) {if(error.code && error.code!=='ENOENT')throw error;return null;}
}

/** Caches deterministic preparation only, never test outcomes or performance observations. */
export async function immutableSetup({ cache, inputs, produce, verifyInputs = async () => inputs, timeoutMs = 60000 }) {
 const key=inventoryDigest(inputs).slice(7), pointer=resolve(cache,`${key}.json`), lockPath=resolve(cache,`${key}.lock`);
 await mkdir(cache,{recursive:true});const start=performance.now();
 while(true) {
  const hit=await lookupImmutableSetup({cache,inputs});if(hit)return hit;
  let lock;
  try {lock=await open(lockPath,'wx');}
  catch(error) {
   if(error.code!=='EEXIST')throw error;
   if(performance.now()-start>timeoutMs)throw new Error(`Setup producer did not complete: ${lockPath}`);
   await delay(50);continue;
  }
  try {
   await lock.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));
   const completed=await lookupImmutableSetup({cache,inputs});if(completed)return completed;
   const directory=resolve(cache,`${key}-${randomUUID()}`);await mkdir(directory);
   await produce(directory);
   if(inventoryDigest(await verifyInputs())!==inventoryDigest(inputs))throw new Error('Preparation inputs changed; artifact not published.');
   const outputs=await contentInventory(directory,['.'],undefined,false), originatingProducer=new Date().toISOString();
   const payload={schemaVersion:2,key,directory,outputs,originatingProducer};
   if(process.env.EN_SETUP_CACHE!=='off')await atomicJSON(pointer,{...payload,integrity:inventoryDigest(payload)});
   return {directory,reused:false,originatingProducer,key};
  } catch(error) {await atomicJSON(resolve(cache,`${key}-failure-${randomUUID()}.json`),{error:String(error.stack),at:new Date().toISOString()});throw error;}
  finally {await lock.close();await rm(lockPath,{force:true});}
 }
}
