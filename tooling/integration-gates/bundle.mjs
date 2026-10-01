// Export a completed run without machine-local preparation caches. Never alter raw evidence.
import {mkdir,readFile,copyFile} from 'node:fs/promises';
import {resolve,dirname,isAbsolute,relative} from 'node:path';
import {hash,atomic} from './runner.mjs';
const [inputArg,outputArg]=process.argv.slice(2);
if(!inputArg||!outputArg)throw Error('Usage: node tooling/integration-gates/bundle.mjs <completed-run> <new-bundle-directory>');
const input=resolve(inputArg),output=resolve(outputArg),raw=await readFile(resolve(input,'receipt.json'));
const receipt=JSON.parse(raw);if(!receipt.finishedAt)throw Error('Cannot export an unfinished run');
await mkdir(output);await copyFile(resolve(input,'receipt.json'),resolve(output,'receipt.original.json'));
receipt.portableExport={originalReceipt:'receipt.original.json',sha256:hash(raw),omitted:'Owned temporary preparation/cache files remain local; their original hashes are retained in receipt.original.json. Source and builtAssets are identity inventories relative to the checkout, not bundled artifact links.'};
for(const stage of receipt.stages){
 const retained=[];
 for(const [path,digest] of stage.artifacts??[]){
  if(path.split('/').includes('tmp'))continue;
  if(isAbsolute(path)||relative(input,resolve(input,path)).startsWith('..'))throw Error(`Unsafe artifact path ${path}`);
  const bytes=await readFile(resolve(input,path));if(hash(bytes)!==digest)throw Error(`Changed artifact ${path}`);
  await mkdir(dirname(resolve(output,path)),{recursive:true});await copyFile(resolve(input,path),resolve(output,path));retained.push([path,digest]);
 }
 stage.artifacts=retained;
}
await atomic(resolve(output,'receipt.json'),receipt);
console.log(`Portable evidence: ${output}/receipt.json`);
