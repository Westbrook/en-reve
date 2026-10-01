import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { materializeMinificationFixture } from './build.mjs';

test('CLI fixture materialization replaces old chunks and preserves unrelated output siblings', async t => {
 const scratch=await mkdtemp(resolve(tmpdir(),'ssr-fixture-materialization-'));
 t.after(()=>rm(scratch,{recursive:true,force:true}));
 const source=resolve(scratch,'prepared'),output=resolve(scratch,'destination');
 async function put(root,path,text) {
  const file=resolve(root,path);
  await mkdir(resolve(file,'..'),{recursive:true});
  await writeFile(file,text);
 }
 await put(source,'client/assets/current-hash.js','current client');
 await put(source,'client/entry.js','import "./assets/current-hash.js"');
 await put(source,'server/current-hash.mjs','current server');
 await put(source,'document.html','new document');
 await put(source,'report.json','{"version":2}');
 await put(output,'client/assets/obsolete-hash.js','old client');
 await put(output,'client/stale.css','old stylesheet');
 await put(output,'server/obsolete-hash.mjs','old server');
 await put(output,'document.html','old document');
 await put(output,'report.json','{"version":1}');
 await put(output,'caller-cache/keep.txt','unrelated cache');
 await put(output,'caller-note.txt','unrelated note');
 await materializeMinificationFixture({directory:source},output);
 assert.deepEqual((await readdir(resolve(output,'client'))).sort(),['assets','entry.js']);
 assert.deepEqual(await readdir(resolve(output,'client/assets')),['current-hash.js']);
 assert.deepEqual(await readdir(resolve(output,'server')),['current-hash.mjs']);
 for(const [path,text] of [
  ['client/assets/current-hash.js','current client'],['server/current-hash.mjs','current server'],
  ['document.html','new document'],['report.json','{"version":2}'],
  ['caller-cache/keep.txt','unrelated cache'],['caller-note.txt','unrelated note'],
 ])assert.equal(await readFile(resolve(output,path),'utf8'),text,path);
 assert.equal(await readFile(resolve(source,'client/assets/current-hash.js'),'utf8'),'current client','prepared source stays intact');
});
