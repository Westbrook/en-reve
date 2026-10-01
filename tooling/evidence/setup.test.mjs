import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentInventory, inventoryDigest, atomicJSON, immutable } from './setup.mjs';

test('setup identity includes added, edited, deleted and untracked inputs and missing output directories', async () => {
 const root = await mkdtemp(join(tmpdir(),'en-setup-'));
 try {
  await mkdir(join(root,'source')); await writeFile(join(root,'source/a'),'one');
  const digest = async () => inventoryDigest(await contentInventory(root,['source','output']));
  const first = await digest(); await writeFile(join(root,'source/new'),'untracked'); assert.notEqual(await digest(),first);
  await rm(join(root,'source/new')); assert.equal(await digest(),first);
  await writeFile(join(root,'source/a'),'two'); assert.notEqual(await digest(),first);
  await writeFile(join(root,'source/a'),'one'); await mkdir(join(root,'output')); assert.notEqual(await digest(),first);
  await atomicJSON(join(root,'output/receipt.json'), { complete:true });
  await symlink(join(root,'source/a'),join(root,'source/link'));
  const linked=await contentInventory(root,['source/link']);await writeFile(join(root,'source/a'),'changed-through-target');assert.notDeepEqual(await contentInventory(root,['source/link']),linked);
  const complete=await digest(); await writeFile(join(root,'output/receipt.json'),'corrupt'); assert.notEqual(await digest(),complete);
  await writeFile(join(root,'output/incomplete.tmp'),'interrupted'); assert.notEqual(await digest(),complete);
  const value=immutable({nested:{values:[1]}});assert.throws(()=>value.nested.values.push(2));
 } finally { await rm(root,{recursive:true,force:true}); }
});

test('optional permission identity binds pack modes without changing default canonical bytes', async()=>{
 const root=await mkdtemp(join(tmpdir(),'en-setup-mode-'));
 try {
  const file=join(root,'entry.js');await writeFile(file,'export const value=1;');await chmod(file,0o644);
  const bytes=await contentInventory(root,['entry.js']), withMode=await contentInventory(root,['entry.js'],undefined,true,{includeModes:true});
  await chmod(file,0o755);
  assert.deepEqual(await contentInventory(root,['entry.js']),bytes);
  assert.notDeepEqual(await contentInventory(root,['entry.js'],undefined,true,{includeModes:true}),withMode);
 } finally {await rm(root,{recursive:true,force:true});}
});
