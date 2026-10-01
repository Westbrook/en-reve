import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { withExecutionOwner, recoverExecutionOwner } from './execution-owner.mjs';

test('independent gates cannot overlap; a nested original prerequisite borrows only its live owner',async()=>{
 const root=await mkdtemp(resolve(tmpdir(),'en-execution-owner-')),env={};
 try{
  await withExecutionOwner(root,async({owner,path})=>{
   await assert.rejects(()=>withExecutionOwner(root,()=>assert.fail('Second gate must not run'),{environment:{}}),/Another execution owns/);
   await assert.rejects(()=>recoverExecutionOwner(root),/active execution owner/);
   await withExecutionOwner(root,async borrowed=>{assert(borrowed.borrowed);assert.equal(borrowed.owner.token,owner.token);},{environment:env});
   assert.equal(JSON.parse(await readFile(path,'utf8')).token,owner.token,'Borrowing must not release the producer owner');
  },{environment:env});
  assert(!Object.hasOwn(env,'EN_TEST_EXECUTION_OWNER'));
  await assert.rejects(()=>access(resolve(root,'node_modules/.cache/test-execution-owner.json')),{code:'ENOENT'});
 }finally{await rm(root,{recursive:true,force:true});}
});
test('failed commands release their live owner; a dead interrupted owner is archived before recovery',async()=>{
 const root=await mkdtemp(resolve(tmpdir(),'en-execution-recovery-')),env={};
 try{
  await assert.rejects(()=>withExecutionOwner(root,()=>{throw new Error('seeded assertion defect');},{environment:env}),/seeded assertion defect/);
  await withExecutionOwner(root,()=>{}, {environment:env});
  const child=spawn(process.execPath,['-e','process.exit(0)']);
  await new Promise((yes,no)=>{child.once('error',no);child.once('exit',yes);});
  const path=resolve(root,'node_modules/.cache/test-execution-owner.json');await mkdir(resolve(root,'node_modules/.cache'),{recursive:true});
  const bytes=JSON.stringify({pid:child.pid,token:randomUUID(),interrupted:true});await writeFile(path,bytes,{flag:'wx'});
  await assert.rejects(()=>withExecutionOwner(root,()=>assert.fail('Dead-owner evidence must be retained'),{environment:env}),/is gone/);
  assert.equal(await readFile(path,'utf8'),bytes);
  const recovered=await recoverExecutionOwner(root);assert.equal(await readFile(recovered.archived,'utf8'),bytes);
  await withExecutionOwner(root,()=>{}, {environment:env});
 }finally{await rm(root,{recursive:true,force:true});}
});
