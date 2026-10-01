import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,stat,utimes,mkdir,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileDigests} from './file-digests.mjs';
import {contentInventory} from '../evidence/setup.mjs';
import {inputIdentity} from './input-identity.mjs';

const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
async function fixture(t){const root=await mkdtemp(resolve(tmpdir(),'en-file-digests-'));t.after(()=>rm(root,{recursive:true,force:true}));return await realpath(root);}

test('overlapping inventories retain exact canonical entries while sharing byte reads',async t=>{
 const root=await fixture(t);await mkdir(resolve(root,'packages'));await writeFile(resolve(root,'packages/input.txt'),'first');await symlink('input.txt',resolve(root,'packages/link'));
 const before=await contentInventory(root,['packages','missing'],()=>false,true,{includeModes:true});
 const reader=fileDigests({concurrency:2});
 const [one,two]=await Promise.all([0,1].map(()=>contentInventory(root,['packages','missing'],()=>false,true,{includeModes:true,digestFile:reader.digestFile})));
 assert.deepEqual(one,before);assert.deepEqual(two,before);assert.equal(reader.stats().reads,1);assert(reader.stats().hits>=3);
 assert.equal(one['packages/input.txt'].digest,digest('first'));assert.equal(one['packages/link@link'],'input.txt');assert.equal(one.missing,null);
});

test('fresh identity phases detect same-size same-mtime mutation and deletion',async t=>{
 const root=await fixture(t),path=resolve(root,'input.txt');await writeFile(path,'before');const times=await stat(path);
 const before=fileDigests();assert.equal(await before.digestFile(path),digest('before'));
 await writeFile(path,'after!');await utimes(path,times.atime,times.mtime);
 const after=fileDigests();assert.equal(await after.digestFile(path),digest('after!'));assert.notEqual(await after.digestFile(path),await before.digestFile(path));
 await rm(path);await assert.rejects(fileDigests().digestFile(path),{code:'ENOENT'});
});

test('a failed read stays failed in its phase and can recover only in a fresh phase',async t=>{
 const root=await fixture(t),path=resolve(root,'input.txt'),reader=fileDigests();
 await assert.rejects(reader.digestFile(path),{code:'ENOENT'});await writeFile(path,'repaired');
 await assert.rejects(reader.digestFile(path),{code:'ENOENT'});assert.equal(reader.stats().reads,1);assert.equal(reader.stats().hits,1);
 assert.equal(await fileDigests().digestFile(path),digest('repaired'));
});

test('content reads respect one bounded budget across concurrent consumers',async t=>{
 const root=await fixture(t),paths=Array.from({length:40},(_,i)=>resolve(root,String(i)));
 await Promise.all(paths.map((path,i)=>writeFile(path,String(i))));const reader=fileDigests({concurrency:3});
 const values=await Promise.all([...paths,...paths].map(path=>reader.digestFile(path)));
 assert.deepEqual(values,[...paths,...paths].map((_,i)=>digest(String(i%paths.length))));
 assert.equal(reader.stats().reads,40);assert.equal(reader.stats().hits,40);assert.equal(reader.stats().peak,3);
 for(const concurrency of [0,-1,1.5,25,Infinity])assert.throws(()=>fileDigests({concurrency}),/bounded/);
});

test('Finder metadata cannot invalidate fixture identity while real input mutations still do',async t=>{
 const root=await fixture(t),output=resolve(root,'execution');
 await mkdir(resolve(root,'packages'));await mkdir(resolve(output,'fixtures'),{recursive:true});
 const source=resolve(root,'packages/input.js');await writeFile(source,'before');
 const snapshot=async()=>(await inputIdentity(root,output)).inputs;
 const before=await snapshot();
 for(const path of ['packages/.DS_Store','execution/fixtures/.DS_Store'])await writeFile(resolve(root,path),'Finder view preferences');
 assert.deepEqual(await snapshot(),before);
 await writeFile(source,'after!');assert.notDeepEqual(await snapshot(),before);
 await writeFile(source,'before');await writeFile(resolve(root,'packages/.DS_Store.js'),'meaningful source');
 assert.notDeepEqual(await snapshot(),before);
});
