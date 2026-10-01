import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {browserFailureCommand} from './failure-policy.mjs';

test('native browser policy preserves expected failures, stops unexpected failures, and retains explicit diagnostics',async()=>{
 const directory=await realpath(await mkdtemp(join(tmpdir(),'en-browser-failure-policy-')));
 const api=pathToFileURL(resolve(import.meta.dirname,'../../node_modules/@playwright/test/index.mjs')).href;
 const cli=resolve(import.meta.dirname,'../../node_modules/@playwright/test/cli.js');
 const marker=join(directory,'last-case-ran');
 try {
  await writeFile(join(directory,'policy.spec.mjs'),`import {test,expect} from ${JSON.stringify(api)};import {writeFileSync} from 'node:fs';
   test('expected negative control',()=>{test.fail();expect(1).toBe(2);});
   test('unexpected negative control',()=>{expect(1).toBe(2);});
   test('independent later assertion',()=>{writeFileSync(${JSON.stringify(marker)},'ran');expect(1).toBe(1);});`);
  const config=join(directory,'playwright.config.mjs');
  await writeFile(config,`import {defineConfig} from ${JSON.stringify(api)};export default defineConfig({testDir:${JSON.stringify(directory)},workers:1,maxFailures:0,forbidOnly:true,timeout:10000,outputDir:${JSON.stringify(join(directory,'artifacts'))}});`);
  const command=[process.execPath,cli,'test','--config',config];
  const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
  for(const failFast of [true,false]){
   const report=join(directory,failFast?'fast.json':'diagnostic.json');
   const actual=spawnSync(process.execPath,browserFailureCommand(command,{failFast}).slice(1).concat('--reporter=json'),{cwd:directory,env:{...environment,PLAYWRIGHT_JSON_OUTPUT_NAME:report},encoding:'utf8',timeout:25000});
   assert.ifError(actual.error);assert.equal(actual.status,1,actual.stdout+actual.stderr);
   const result=JSON.parse(await readFile(report,'utf8'));
   const tests=[];const visit=suite=>{for(const spec of suite.specs??[])tests.push(...spec.tests);for(const child of suite.suites??[])visit(child);};visit(result);
   assert.equal(tests.length,3,'Failure policy must not remove discovered assertions');
   assert.equal(result.config.maxFailures,failFast?1:0);
   assert.deepEqual(tests.map(item=>item.status),['expected','unexpected',failFast?'skipped':'expected']);
   assert.equal(result.stats.unexpected,1,'Incomplete coverage never becomes a pass');
   if(failFast)await assert.rejects(access(marker),{code:'ENOENT'});else assert.equal(await readFile(marker,'utf8'),'ran');
  }
  assert(!command.some(argument=>argument.startsWith('--max-failures')),'Caller command is unchanged');
 }finally{await rm(directory,{recursive:true,force:true});}
});
