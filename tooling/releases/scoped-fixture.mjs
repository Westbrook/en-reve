import { build } from '../../showcases/performance/node_modules/esbuild/lib/main.js';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { digest, inventory } from '../offline-review/runtime.mjs';

/** Bundle an authored pure public consumer from its own version's installation. */
export async function bundleScopedFixture({entry,scenarios,outputDirectory}) {
  entry=resolve(entry);const output=resolve(outputDirectory);
  if(!Array.isArray(scenarios)||!scenarios.length||scenarios.some(id=>typeof id!=='string'||!/^[a-z0-9][a-z0-9-]*$/.test(id))||new Set(scenarios).size!==scenarios.length)throw new Error('Provide unique scenario IDs');
  await mkdir(output);
  try {
    const result=await build({entryPoints:[entry],absWorkingDir:dirname(entry),outfile:resolve(output,'fixture.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',metafile:true,write:false});
    if(Object.values(result.metafile.outputs).some(value=>value.imports.length))throw new Error('Scoped fixtures must be self-contained; external module imports are unsupported');
    for(const file of result.outputFiles)await writeFile(file.path,file.contents);
    const inputs={};for(const path of Object.keys(result.metafile.inputs))inputs[path]=digest(await readFile(resolve(dirname(entry),path)));
    const manifest={schema:'en-reve/scoped-review-fixture',schemaVersion:1,entry:'fixture.js',scenarios,inputs,files:await inventory(output),contract:'Pure module exports async mount({host,registry,scenario}); returns optional cleanup function. Use the exact version public createElementScope with the supplied native registry; never use global registration or fallback.'};
    await writeFile(resolve(output,'fixture.json'),JSON.stringify(manifest,null,2)+'\n');return manifest;
  }catch(error){await rm(output,{recursive:true,force:true});throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){if(process.argv.length!==5)throw new Error('Usage: node tooling/releases/scoped-fixture.mjs <entry.js> <comma-separated-scenario-ids> <new-output-directory>');console.log(JSON.stringify(await bundleScopedFixture({entry:process.argv[2],scenarios:process.argv[3].split(','),outputDirectory:process.argv[4]})));}
