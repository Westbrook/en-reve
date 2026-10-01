import test from 'node:test';import assert from 'node:assert/strict';import {diagnostics,compareDiagnostics} from './semantic-types.mjs';
test('new diagnostics cannot be hidden by existing ones or duplicate counts',()=>{const existing='a.ts(1,2): error TS2322: Type mismatch';assert(compareDiagnostics([existing],[existing]).passed);assert(!compareDiagnostics([existing,existing],[existing]).passed);assert(!compareDiagnostics(['b.ts(2,1): error TS2322: New error'],[existing]).passed);assert(!compareDiagnostics([],[existing]).passed);});
test('multiline compiler diagnostics are retained and unknown output fails closed',()=>{assert.deepEqual(diagnostics('a.ts(1,1): error TS1: message\n  detail\n'),['a.ts(1,1): error TS1: message\n  detail']);assert.throws(()=>diagnostics('compiler crashed'));});

test('pinned compiler detects seeded production, test, config and consumer type errors',async()=>{
 const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join,resolve}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const directory=await mkdtemp(join(tmpdir(),'semantic-negative-'));
 try{const files=['production.ts','behavior.test.ts','playwright.config.ts','consumer.types.ts'];for(const name of files)await writeFile(join(directory,name),"export const negative: number = 'must fail';\n");
 const actual=spawnSync(process.execPath,[resolve(import.meta.dirname,'../../node_modules/typescript/bin/tsc'),'--ignoreConfig','--noEmit','--strict','--skipLibCheck',...files.map(name=>join(directory,name))],{encoding:'utf8'});assert.notEqual(actual.status,0);const rows=diagnostics(actual.stdout+actual.stderr);for(const name of files)assert(rows.some(row=>row.includes(name)&&row.includes('TS2322')));assert(!compareDiagnostics(rows,[]).passed);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('real compiler diagnostics survive checkout relocation without hiding changed module paths',async()=>{
 const {mkdtemp,writeFile,rm,realpath}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join,resolve}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const roots=[];const results=[];
 try{for(let index=0;index<2;index++){
  const directory=await realpath(await mkdtemp(join(tmpdir(),'semantic-relocation-')));roots.push(directory);
  await writeFile(join(directory,'module.ts'),'export const value = 1;\n');
  await writeFile(join(directory,'consumer.ts'),"import * as module from './module.js';new module();\n");
  const result=spawnSync(process.execPath,[resolve(import.meta.dirname,'../../node_modules/typescript/bin/tsc'),'--ignoreConfig','--strict','--noEmit','--skipLibCheck','--module','NodeNext','consumer.ts'],{cwd:directory,encoding:'utf8'});
  assert.ifError(result.error);assert.notEqual(result.status,0);const rows=diagnostics(result.stdout+result.stderr,{rootDirectory:directory+(index?'/':'')});assert.equal(rows.length,1);assert.match(rows[0],/TS2351/);assert(rows[0].includes('<root>/module'));assert(!rows[0].includes(directory));results.push(rows);
 }
 assert.deepEqual(results[0],results[1]);assert(!compareDiagnostics(results[0],results[1].map(row=>row.replace('<root>/module','<root>/different-module'))).passed);
 }finally{await Promise.all(roots.map(directory=>rm(directory,{recursive:true,force:true})));}
});
