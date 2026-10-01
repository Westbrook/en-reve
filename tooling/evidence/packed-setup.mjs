import { readFile, writeFile, realpath, access, cp } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, dirname, delimiter, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { release as osRelease } from 'node:os';
import { contentInventory, inventoryDigest } from './setup.mjs';
import { immutableSetup, lookupImmutableSetup } from './immutable-setup.mjs';
import { setupEnvironment, setupEnvironmentInputs } from './setup-environment.mjs';
import { singlePackOutput } from '../test-pipeline/npm-pack.mjs';
const execute=promisify(execFile), root=resolve(import.meta.dirname,'../..');
const allNames=['elements','primitives','styles','tokens','ssr'];
async function executable(name) {
 for(const directory of (process.env.PATH??'').split(delimiter)) {
  const path=resolve(directory,process.platform==='win32'?(name==='npm'?'npm.cmd':'node.exe'):name);
  try {await access(path,constants.X_OK);return await realpath(path);}catch(error){if(!['ENOENT','EACCES'].includes(error.code))throw error;}
 }
 throw new Error(`${name} executable unavailable`);
}
/** Shares real archives for the existing ignore-scripts mode. Offline/workspaces=false consumers retain their distinct packing mode. */
export async function preparedPackages(requested,destination) {
 if(!requested.length || new Set(requested).size!==requested.length || requested.some(name=>!allNames.includes(name)))throw new Error('Unknown, empty or duplicate packed package selection');
 const npm=await executable('npm'), npmNode=await executable('node'), npmRoot=dirname(dirname(npm)), cache=resolve(root,'node_modules/.cache/packed-test-setup');
 const environment=setupEnvironment(process.env,{production:false});
 // Cache control is an orchestration option, not an npm pack input.
 delete environment.EN_SETUP_CACHE;
 async function identity() {
  const {stdout}=await execute(npm,['config','list','--json'],{cwd:root,env:environment,maxBuffer:4*1024*1024});
  const config=JSON.parse(stdout), configFiles=['userconfig','globalconfig'].flatMap(key=>typeof config[key]==='string'?[config[key]]:[]);
  const head=await execute('git',['rev-parse','HEAD'],{cwd:root}).then(value=>value.stdout.trim()).catch(error=>{if(error.code===128)return null;throw error;});
  return {files:await contentInventory(root,[...allNames.map(name=>`packages/${name}`),'package.json','package-lock.json','README.md','LICENSE','.npmrc','.npmignore','.gitignore','tooling/evidence','tooling/test-pipeline/npm-pack.mjs',npmRoot,process.execPath,npmNode,...new Set(configFiles)],undefined,true,{includeModes:true}),
   configurationDigest:inventoryDigest(config),head,osRelease:osRelease(),mode:['pack','--ignore-scripts','--json'],node:process.version,platform:process.platform,arch:process.arch,
   environment:inventoryDigest(Object.fromEntries(Object.entries(setupEnvironmentInputs(environment)).filter(([key])=>!['PWD','OLDPWD','SHLVL','_','INIT_CWD','npm_lifecycle_event','npm_lifecycle_script'].includes(key))))};
 }
 const base=await identity(), names=[...requested].sort(), inputs={...base,names}, fullInputs={...base,names:[...allNames].sort()};
 let prepared=await lookupImmutableSetup({cache,inputs:fullInputs});
 if(!prepared)prepared=await immutableSetup({cache,inputs,verifyInputs:async()=>({...await identity(),names}),produce:async directory=>{
  const archives=[];
  for(const name of requested) {
   const {stdout}=await execute(npm,['pack','--ignore-scripts','--json','--cache',resolve(cache,'npm-cache'),'--pack-destination',directory],{cwd:resolve(root,'packages',name),env:environment,maxBuffer:16*1024*1024});
   const archive=singlePackOutput(stdout,'@en-reve/'+name),bytes=await readFile(join(directory,archive.filename));
   if(archive.integrity!==`sha512-${createHash('sha512').update(bytes).digest('base64')}` || archive.shasum!==createHash('sha1').update(bytes).digest('hex'))throw new Error('npm archive integrity mismatch');
   archives.push(archive);
  }
  await writeFile(join(directory,'archives.json'),JSON.stringify(archives));
 }});
 const archives=JSON.parse(await readFile(join(prepared.directory,'archives.json'),'utf8')),result=[];
 for(const name of requested) {
  const archive=archives.find(item=>item.name==='@en-reve/'+name);if(!archive)throw new Error(`Incomplete packed setup: ${name}`);
  await cp(join(prepared.directory,archive.filename),join(destination,archive.filename),{errorOnExist:true,force:false});
  result.push({...archive,setup:{key:prepared.key,reused:prepared.reused,originatingProducer:prepared.originatingProducer}});
 }
 return result;
}
