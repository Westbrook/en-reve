import { setupEnvironment } from '../../../../tooling/evidence/setup-environment.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { contentInventory, inventoryDigest } from '../../../../tooling/evidence/setup.mjs';
import { prepareMinificationSource } from './source.mjs';
const root=resolve(import.meta.dirname,'../../../..');
export async function prepareMinificationFixture() {
 const started=performance.now();
 await prepareMinificationSource();
 const cache=resolve(root,'node_modules/.cache/ssr-minification-preparation');
 await mkdir(cache,{recursive:true});
 const directory=resolve(cache,'fresh-'+randomUUID());
 await mkdir(directory); // Atomic fresh ownership, with the original mkdir/umask permissions.
 // Measured complete-input verification costs as much as this small producer.
 // Acquire once per owned server and share its fresh output across all engines.
 // A prior or partial generation is never a candidate for reuse.
 await promisify(execFile)(process.execPath,[resolve(import.meta.dirname,'produce.mjs')],{cwd:root,env:{...setupEnvironment(),EN_SSR_MINIFIER_FIXTURE_DIR:directory},maxBuffer:16*1024*1024});
 const outputs=await contentInventory(directory,['.'],undefined,false);
 const prepared={directory,reused:false,policy:'fresh-per-server',outputsDigest:inventoryDigest(outputs),originatingProducer:new Date().toISOString()};
 console.error(JSON.stringify({stage:'ssr-minification-preparation',...prepared,wallMs:performance.now()-started}));
 return prepared;
}
export async function materializeMinificationFixture(prepared, output) {
 await mkdir(output,{recursive:true});
 // Match Vite's emptyOutDir behavior for the two owned build outputs.
 // Other files beside these outputs may belong to the caller.
 for(const name of ['client','server'])await rm(resolve(output,name),{recursive:true,force:true});
 await cp(prepared.directory,output,{recursive:true});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='--source-only')await prepareMinificationSource();
 else {
  if(args.length)throw new Error('Only --source-only is supported');
  const prepared=await prepareMinificationFixture();
  // Preserve the documented direct-CLI destination. Servers use their owned generation.
  const output=resolve(process.env.EN_SSR_MINIFIER_FIXTURE_DIR??resolve(root,'node_modules/.cache/en-reve-minifier-fixture'));
  await materializeMinificationFixture(prepared,output);
  console.log(JSON.stringify(prepared));
 }
}
