import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { immutableSetup, lookupImmutableSetup } from './immutable-setup.mjs';

// Each isolated fixture chooses its own cache policy. The parent correctness
// lane may disable real setup reuse; that must not disable cache-behavior tests.
let inheritedCachePolicy;
beforeEach(() => {
 inheritedCachePolicy = process.env.EN_SETUP_CACHE;
 delete process.env.EN_SETUP_CACHE;
});
afterEach(() => {
 if (inheritedCachePolicy === undefined) delete process.env.EN_SETUP_CACHE;
 else process.env.EN_SETUP_CACHE = inheritedCachePolicy;
});

test('concurrent consumers get one immutable producer; corruption creates a new generation', async () => {
 const cache=await mkdtemp(join(tmpdir(),'en-immutable-'));let calls=0;
 try {
  const options={cache,inputs:{source:'one'},produce:async directory=>{calls++;await writeFile(join(directory,'value'),'bytes');}};
  const results=await Promise.all([immutableSetup(options),immutableSetup(options),immutableSetup(options)]);
  assert.equal(calls,1);assert.equal(new Set(results.map(result=>result.directory)).size,1);
  assert.equal(results.filter(result=>result.reused).length,2);
  await writeFile(join(results[0].directory,'value'),'corrupt');
  const fresh=await immutableSetup(options);assert.equal(fresh.reused,false);assert.notEqual(fresh.directory,results[0].directory);
  assert.equal(await readFile(join(fresh.directory,'value'),'utf8'),'bytes');assert.equal(calls,2);
  await immutableSetup({...options,inputs:{source:'changed'}});assert.equal(calls,3);
  const pointer=(await readdir(cache)).find(name=>name===`${fresh.key}.json`);await writeFile(join(cache,pointer),'interrupted');
  assert.equal((await immutableSetup(options)).reused,false);
 } finally {await rm(cache,{recursive:true,force:true});}
});
test('failed and changing-input preparation never publishes a usable entry and failures remain recorded',async()=>{
 const cache=await mkdtemp(join(tmpdir(),'en-immutable-'));
 try {
  await assert.rejects(immutableSetup({cache,inputs:{source:1},produce:async directory=>{await writeFile(join(directory,'partial'),'partial');throw new Error('seeded failure')}}),/seeded failure/);
  assert((await readdir(cache)).some(name=>name.includes('-failure-')));
  await assert.rejects(immutableSetup({cache,inputs:{source:1},verifyInputs:async()=>({source:2}),produce:async()=>{}}),/inputs changed/);
  assert.equal((await readdir(cache)).filter(name=>/^[a-f0-9]+\.json$/.test(name)).length,0);
 } finally {await rm(cache,{recursive:true,force:true});}
});

test('lookup rejects tampered producer provenance, incomplete entries and unpublished generations', async()=>{
 const cache=await mkdtemp(join(tmpdir(),'en-immutable-provenance-'));
 try {
  const inputs={source:'stable'};
  assert.equal(await lookupImmutableSetup({cache,inputs}),null);
  const prepared=await immutableSetup({cache,inputs,produce:async directory=>writeFile(join(directory,'value'),'complete')});
  const pointer=join(cache,`${prepared.key}.json`),receipt=JSON.parse(await readFile(pointer,'utf8'));
  await writeFile(pointer,JSON.stringify({...receipt,originatingProducer:'invented'}));
  assert.equal(await lookupImmutableSetup({cache,inputs}),null);
  await writeFile(pointer,'{partial');assert.equal(await lookupImmutableSetup({cache,inputs}),null);
  await rm(pointer);assert.equal(await lookupImmutableSetup({cache,inputs}),null);
 } finally {await rm(cache,{recursive:true,force:true});}
});

test('a correctly checksummed pointer cannot escape its owning cache', async()=>{
 const { inventoryDigest } = await import('./setup.mjs');
 const root=await mkdtemp(join(tmpdir(),'en-immutable-escape-'));
 const cache=join(root,'cache'),outside=join(root,'outside');
 try {
  const inputs={source:'stable'};
  const prepared=await immutableSetup({cache,inputs,produce:async directory=>writeFile(join(directory,'value'),'complete')});
  const pointer=join(cache,`${prepared.key}.json`),receipt=JSON.parse(await readFile(pointer,'utf8'));
  const {integrity,...payload}=receipt;
  payload.directory=outside;
  await writeFile(pointer,JSON.stringify({...payload,integrity:inventoryDigest(payload)}));
  assert.equal(await lookupImmutableSetup({cache,inputs}),null);
 } finally {await rm(root,{recursive:true,force:true});}
});

test('the explicit uncached lane neither consumes nor publishes a reusable pointer', async()=>{
 const cache=await mkdtemp(join(tmpdir(),'en-immutable-cold-')),before=process.env.EN_SETUP_CACHE;
 process.env.EN_SETUP_CACHE='off';let calls=0;
 try {
  const options={cache,inputs:{source:'stable'},produce:async directory=>{calls++;await writeFile(join(directory,'value'),'complete');}};
  const a=await immutableSetup(options),b=await immutableSetup(options);
  assert.equal(calls,2);assert.equal(a.reused,false);assert.equal(b.reused,false);assert.notEqual(a.directory,b.directory);
  assert.equal((await readdir(cache)).filter(name=>/^[a-f0-9]+\.json$/.test(name)).length,0);
 } finally {if(before===undefined)delete process.env.EN_SETUP_CACHE;else process.env.EN_SETUP_CACHE=before;await rm(cache,{recursive:true,force:true});}
});


test('a checksummed but incomplete provenance envelope is not a reusable result',async()=>{
 const { inventoryDigest }=await import('./setup.mjs');
 const cache=await mkdtemp(join(tmpdir(),'en-immutable-incomplete-'));
 try {
  const inputs={source:'stable'},prepared=await immutableSetup({cache,inputs,produce:async directory=>writeFile(join(directory,'value'),'complete')});
  const pointer=join(cache,`${prepared.key}.json`),original=JSON.parse(await readFile(pointer,'utf8'));
  for(const field of ['originatingProducer','outputs']) {
   const {integrity,...payload}=original;delete payload[field];
   await writeFile(pointer,JSON.stringify({...payload,integrity:inventoryDigest(payload)}));
   assert.equal(await lookupImmutableSetup({cache,inputs}),null);
  }
 } finally {await rm(cache,{recursive:true,force:true});}
});
