import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { startOwnedReport } from './owned-report.mjs';

test('fresh report takes precedence, historical assets remain read-only and external symlinks are refused',async()=>{
 const root=await mkdtemp(resolve(tmpdir(),'en-owned-report-')),directory=resolve(root,'fresh'),fallback=resolve(root,'history');let server;
 try{
  await mkdir(directory);await mkdir(fallback);
  await writeFile(resolve(fallback,'page.html'),'historical');await writeFile(resolve(fallback,'shared.js'),'historical-asset');
  await writeFile(resolve(directory,'page.html'),'fresh');await writeFile(resolve(root,'outside'),'not-served');await symlink(resolve(root,'outside'),resolve(directory,'escape'));
  server=await startOwnedReport({directory,fallback});
  assert.equal(await (await fetch(server.url+'/page.html')).text(),'fresh');
  assert.equal(await (await fetch(server.url+'/shared.js')).text(),'historical-asset');
  assert.equal((await fetch(server.url+'/escape')).status,403);
  assert.equal((await fetch(server.url+'/page.html',{method:'POST',body:'changed'})).status,405);
  assert.equal(await readFile(resolve(fallback,'page.html'),'utf8'),'historical');
 }finally{await server?.close();await rm(root,{recursive:true,force:true});}
});
