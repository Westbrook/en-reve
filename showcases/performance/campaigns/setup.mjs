import { readFile, writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { lab, repo, safeId } from './config.mjs';
import { execute, node } from './execute.mjs';
// Fresh installation only. Never refresh or repack an existing reference implicitly.
export async function setup(id) {
  if(!safeId(id))throw Error('Setup requires a fresh --id');
  try {await access(resolve(lab,'.cache/inventory.json'));throw Error('An inventory already exists. Use it, or use a fresh checkout for bootstrap; no reference was changed.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const registry=JSON.parse(await readFile(resolve(lab,'registry/systems.json')));
  await mkdir(resolve(lab,'reports/setup'),{recursive:true});
  const out=resolve(lab,'reports/setup',id);await mkdir(out);
  for(const name of ['performance','tools','performance-results',...registry.map(s=>s.id)])await execute('npm',['ci','--workspaces=false','--no-audit','--no-fund'],{cwd:resolve(lab,'..',name)});
  await execute(process.execPath,[resolve(lab,'node_modules/@playwright/test/cli.js'),'install','chromium','firefox','webkit']);
  await node('../tools/build.mjs');
  const {sha,json}=await import('../src/config.mjs');
  async function files(dir){const a=[];for(const x of await readdir(dir,{withFileTypes:true})){if(['node_modules','dist','.cache','.vite','.DS_Store','.performance','artifacts'].includes(x.name))continue;const p=resolve(dir,x.name);if(x.isDirectory())a.push(...await files(p));else if(x.isFile())a.push(p);}return a.sort();}
  const projects=[];
  for(const {id:name} of registry){const paths=[...await files(resolve(lab,'..',name)),...await files(resolve(lab,'../shared')),resolve(lab,'../tools/isolation-plugin.mjs')];const hashes={};for(const p of paths)hashes[relative(resolve(lab,'..'),p)]=sha(await readFile(p));projects.push({name,sourceHashes:hashes,sourceSha256:sha(json(hashes)),outputHashes:{},checks:[]});}
  const receipt=resolve(out,'candidate-sources.json');await writeFile(receipt,json({verifiedAt:null,scope:'Source inventory only; not a functional qualification',projects}),{flag:'wx'});
  const {prepare}=await import('../src/prepare.mjs');
  await prepare({candidate:true,reason:'Fresh portable bootstrap '+id,receipt});
  await node('src/cli.mjs',['functional','--id',id+'-setup']);
  await writeFile(resolve(out,'complete.json'),json({id,at:new Date().toISOString(),status:'qualified-candidate',timingBaselinePromoted:false}),{flag:'wx'});
}
