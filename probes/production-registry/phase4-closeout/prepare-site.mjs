import {readFile,readdir,mkdir,writeFile,cp,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../../..'),source=resolve(process.argv[2]??'dist');
const output=resolve(root,'artifacts/scoped-registry-phase-4-closeout/integrated');
assert.equal(await stat(output).catch(()=>null),null,'Refuse to overwrite existing integration evidence; archive it before a new run');
assert((await stat(resolve(source,'workflows/settings.html'))).isFile(),'Build docs before preparing the integration site');
await mkdir(output,{recursive:true});await cp(source,resolve(output,'site'),{recursive:true});
async function inventory(dir,prefix=''){const rows=[];for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const path=resolve(dir,entry.name),name=prefix+entry.name;if(entry.isDirectory())rows.push(...await inventory(path,name+'/'));else if(entry.isFile()){const bytes=await readFile(path);rows.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}return rows;}
await writeFile(resolve(output,'receipt.json'),JSON.stringify({basis:'Explicit build prepared for Phase 4 correctness checks; not a frozen performance campaign',source,assets:await inventory(resolve(output,'site'))},null,2)+'\n');
console.log(output);
