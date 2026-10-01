import { open, readFile, mkdir, unlink, link } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const variable='EN_TEST_EXECUTION_OWNER';
const validOwner=owner=>Number.isInteger(owner?.pid)&&owner.pid>0&&typeof owner.token==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner.token);
function alive(pid){try{process.kill(pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}}
/** A coordination lease, not an authentication mechanism. Unknown owners fail closed. */
export async function withExecutionOwner(root,work,{environment=process.env,invocation=process.argv}={}) {
 const path=resolve(root,'node_modules/.cache/test-execution-owner.json');await mkdir(dirname(path),{recursive:true});
 let handle;
 try{handle=await open(path,'wx');}
 catch(error){
  if(error.code!=='EEXIST')throw error;
  const owner=JSON.parse(await readFile(path,'utf8'));
  if(!validOwner(owner))throw new Error('Invalid retained execution owner; inspect '+path);
  if(owner.token===environment[variable]&&alive(owner.pid))return work({borrowed:true,owner,path});
  throw new Error(alive(owner.pid)?`Another execution owns shared build outputs (PID ${owner.pid}); serialize public gates.`:`Execution owner PID ${owner.pid} is gone. Retain the failed run and recover this exact owner before starting a new lane: ${path}`);
 }
 const owner={schemaVersion:1,token:randomUUID(),pid:process.pid,startedAt:new Date().toISOString(),invocation};
 const previous=environment[variable];let failure;
 try{
  await handle.writeFile(JSON.stringify(owner)+'\n');await handle.close();handle=undefined;
  environment[variable]=owner.token;
  return await work({borrowed:false,owner,path});
 }catch(error){failure=error;throw error;}finally{
  try{
  if(previous===undefined)delete environment[variable];else environment[variable]=previous;
  await handle?.close();
  const current=JSON.parse(await readFile(path,'utf8'));
  if(current.token!==owner.token||current.pid!==process.pid)throw new Error('Execution ownership changed; refusing to remove another owner');
  await unlink(path);
  }catch(cleanupError){if(failure)throw new AggregateError([failure,cleanupError],'Execution failed and ownership cleanup also failed');throw cleanupError;}
 }
}

/** Recovery only archives a dead owner; the separate exclusive recovery file prevents competing recoveries. */
export async function recoverExecutionOwner(root) {
 const path=resolve(root,'node_modules/.cache/test-execution-owner.json'),recovery=path+'.recovery';
 const handle=await open(recovery,'wx');
 try{
  await handle.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString(),operation:'recover-dead-execution-owner'})+'\n');
  const owner=JSON.parse(await readFile(path,'utf8'));
  if(!validOwner(owner))throw new Error('Malformed owner requires explicit inspection');
  if(alive(owner.pid))throw new Error('Cannot recover an active execution owner');
  const archived=resolve(dirname(path),'execution-owner-history',`${owner.token}.json`);
  await mkdir(dirname(archived),{recursive:true});
  // Only this recovery process may move the dead owner's file; normal acquisition
  // cannot create a new owner until this pathname has been vacated.
  await link(path,archived);await unlink(path);return {owner,archived};
 }finally{await handle.close();await unlink(recovery);}
}
