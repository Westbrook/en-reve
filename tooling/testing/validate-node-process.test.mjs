import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {validateNodeEvents} from './validate-node-events.mjs';
test('actual Node multi-file, nested, skip, todo and seeded failure streams remain attributable',async()=>{
 const root=await mkdtemp(resolve(tmpdir(),'native-node-facets-'));
 const childEnvironment={...process.env};delete childEnvironment.NODE_TEST_CONTEXT;
 const reporter=fileURLToPath(new URL('./node-facet-reporter.mjs',import.meta.url));
 try{
  await writeFile(resolve(root,'a.test.mjs'),`import {test,describe} from 'node:test';test('pass',()=>{});test.skip('preserved skip',()=>{});test.todo('preserved todo');describe('suite',()=>{test('nested',()=>{});});`);
  await writeFile(resolve(root,'b.test.mjs'),`import test from 'node:test';test('another entry',()=>{});`);
  for(const fail of [false,true]){
   if(fail)await writeFile(resolve(root,'b.test.mjs'),`import test from 'node:test';test('seeded failure',()=>{throw new Error('known defect');});`);
   const output=resolve(root,fail?'failed.jsonl':'passed.jsonl');let code=0;
   try{await promisify(execFile)(process.execPath,['--test','--test-concurrency=1',`--test-reporter=${reporter}`,`--test-reporter-destination=${output}`,'a.test.mjs','b.test.mjs'],{cwd:root,env:childEnvironment});}catch(error){code=error.code;}
   const events=(await readFile(output,'utf8')).trim().split('\n').map(JSON.parse);
   const receipt=validateNodeEvents({events,sources:['a.test.mjs','b.test.mjs'],root});
   assert.equal(code,fail?1:0);assert.equal(receipt.status,fail?'failed':'passed');
   assert.equal(receipt.counts.tests,5);assert.equal(receipt.counts.suites,1);assert.equal(receipt.counts.skipped,1);assert.equal(receipt.counts.todo,1);
   assert.equal(receipt.sources.find(row=>row.source==='a.test.mjs').summary.success,true);
   assert.equal(receipt.sources.find(row=>row.source==='b.test.mjs').summary.success,!fail);
  }
  await writeFile(resolve(root,'b.test.mjs'),`import test from 'node:test';test('another entry',()=>{});`);
  const shard=resolve(root,'shard.jsonl');
  await promisify(execFile)(process.execPath,['--test','--test-concurrency=1','--test-shard=1/2',`--test-reporter=${reporter}`,`--test-reporter-destination=${shard}`,'a.test.mjs','b.test.mjs'],{cwd:root,env:childEnvironment});
  const sharded=validateNodeEvents({events:(await readFile(shard,'utf8')).trim().split('\n').map(JSON.parse),sources:['a.test.mjs','b.test.mjs'],root,allowSourceSelection:true});
  assert.equal(sharded.status,'passed');assert.equal(sharded.unexecutedSources.length,1);assert.equal(sharded.sources.length,1);
  await writeFile(resolve(root,'c.test.mjs'),`import test from 'node:test';test('caller added',()=>{});`);
  const extra=resolve(root,'extra.jsonl');
  await promisify(execFile)(process.execPath,['--test','--test-concurrency=1',`--test-reporter=${reporter}`,`--test-reporter-destination=${extra}`,'a.test.mjs','b.test.mjs','c.test.mjs'],{cwd:root,env:childEnvironment});
  const extended=validateNodeEvents({events:(await readFile(extra,'utf8')).trim().split('\n').map(JSON.parse),sources:['a.test.mjs','b.test.mjs'],root,allowSourceSelection:true});
  assert.deepEqual(extended.additionalSources,['c.test.mjs']);assert.deepEqual(extended.unexecutedSources,[]);
 }finally{await rm(root,{recursive:true,force:true});}
});
