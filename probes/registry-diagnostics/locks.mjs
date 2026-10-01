import {mkdir,writeFile,readFile,unlink,rmdir} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
// Same paths/protocol as integration gates and performance harness, but NEVER steal stale locks.
async function removeOwned(path,owner,directory) {
 const file=directory?join(path,'owner.json'):path;
 const current=JSON.parse(await readFile(file,'utf8'));
 if(current.id!==owner.id)throw Error('Lock ownership changed: '+path);
 await unlink(file);if(directory)await rmdir(path);
}
async function acquire(path,directory) {
 if(!isAbsolute(path))throw Error('Lock paths must be absolute and resolved before TMPDIR changes.');
 const owner={id:randomUUID(),pid:process.pid,startedAt:new Date().toISOString()};
 if(directory){await mkdir(path);try{await writeFile(join(path,'owner.json'),JSON.stringify(owner),{flag:'wx'});}catch(e){await rmdir(path);throw e;}}
 else await writeFile(path,JSON.stringify(owner),{flag:'wx'});
 return {path,owner,release:()=>removeOwned(path,owner,directory)};
}
async function inherited(request,directory) {
 if(!request||!isAbsolute(request.path)||!request.owner?.pid||!request.owner?.id)throw Error('Invalid parent lock receipt.');
 const actual=JSON.parse(await readFile(directory?join(request.path,'owner.json'):request.path,'utf8'));
 if(actual.id!==request.owner.id||actual.pid!==request.owner.pid)throw Error('Parent lock identity mismatch: '+request.path);
 process.kill(actual.pid,0); // Missing owner is failure, never a license to steal.
 return {path:request.path,owner:actual,inherited:true,release:async()=>{}};
}
export async function acquireResources({browserPath,machinePath,parent}) {
 if(parent) {
  if(parent.browser?.path!==browserPath||parent.machine?.path!==machinePath)throw Error('Parent and configured lock paths differ.');
  const browser=await inherited(parent.browser,false),machine=await inherited(parent.machine,true);
  return {browser,machine,release:async()=>{}};
 }
 const browser=await acquire(browserPath,false);
 try {const machine=await acquire(machinePath,true);return {browser,machine,release:async()=>{await machine.release();await browser.release();}};}
 catch(error){await browser.release();throw error;}
}
