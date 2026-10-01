import { readFile, writeFile, mkdir, readdir, lstat, chmod, access } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { lab, repo, safeId } from './config.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const json=x=>JSON.stringify(x,null,2)+'\n';
const sourceRoots=['showcases/','packages/','tooling/','probes/','apps/docs/'];
const excluded=new Set(['node_modules','dist','.cache','.git','.toolchains','artifacts','test-results','playwright-report','.DS_Store','.performance']);
export function portablePath(path){return typeof path==='string' && path.length>0 && !path.includes('\\') && !path.includes('\0') && !path.startsWith('/') && path.split('/').every(x=>x&&x!=='.'&&x!=='..') && !/^[a-z]:/i.test(path);}
export function sourceIncluded(path){
 if(!portablePath(path)||path.split('/').some(x=>excluded.has(x)||x.startsWith('.env')||x.endsWith('.pem')))return false;
 if(path.startsWith('showcases/performance/baselines/')||path.startsWith('showcases/performance/runs/')||path.startsWith('showcases/performance/reports/campaigns/')||path.startsWith('showcases/performance-results/public/'))return false;
 return sourceRoots.some(p=>path.startsWith(p)) || /^plans\/native-showcase[^/]*\.md$/.test(path) || ['LICENSE','AGENTS.md','README.md','package.json','package-lock.json','tsconfig.json','tsconfig.base.json','.node-version','.nvmrc','.python-version','.npmrc','.gitignore'].includes(path);
}
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isSymbolicLink())throw Error('Symlinks are not supported in a transfer: '+p);if(e.isDirectory())files.push(...await walk(p));else if(e.isFile())files.push(p);}return files.sort();}
export async function createBundle(output,{sourceRoot=repo,paths,metadata={}}={}){
 output=resolve(output);await mkdir(output);await mkdir(resolve(output,'objects'));
 const manifest={schemaVersion:1,createdAt:new Date().toISOString(),...metadata,entries:[]};
 for(const path of [...new Set(paths)].sort()){
  if(!portablePath(path))throw Error('Invalid source path');const absolute=resolve(sourceRoot,path);const stat=await lstat(absolute);if(!stat.isFile())throw Error('Only regular files are exported: '+path);
  const bytes=await readFile(absolute),hash=digest(bytes),object='objects/'+hash+'.gz';
  try{await writeFile(resolve(output,object),gzipSync(bytes),{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e;}
  manifest.entries.push({path,sha256:hash,bytes:bytes.length,mode:stat.mode&0o777,object});
 }
 const bytes=Buffer.from(json(manifest));await writeFile(resolve(output,'manifest.json'),bytes,{flag:'wx'});await writeFile(resolve(output,'manifest.sha256'),digest(bytes)+'\n',{flag:'wx'});return manifest;
}
export async function verifyBundle(directory){
 const bytes=await readFile(resolve(directory,'manifest.json'));
 if(digest(bytes)!==(await readFile(resolve(directory,'manifest.sha256'),'utf8')).trim())throw Error('Manifest checksum mismatch');
 const manifest=JSON.parse(bytes);if(manifest.schemaVersion!==1||!Array.isArray(manifest.entries))throw Error('Unknown bundle schema');
 const seen=new Set();
 for(const e of manifest.entries){
  if(!portablePath(e.path)||seen.has(e.path)||!/^[a-f0-9]{64}$/.test(e.sha256)||e.object!=='objects/'+e.sha256+'.gz'||!Number.isSafeInteger(e.bytes)||e.bytes<0||!Number.isInteger(e.mode)||e.mode<0||e.mode>0o777)throw Error('Unsafe or duplicate bundle entry');seen.add(e.path);
  if(!(await lstat(resolve(directory,e.object))).isFile())throw Error('Bundle object must be a regular file');
  const content=gunzipSync(await readFile(resolve(directory,e.object)),{maxOutputLength:Math.max(e.bytes,1)});
  if(content.length!==e.bytes||digest(content)!==e.sha256)throw Error('Object checksum mismatch: '+e.path);
 }
 return manifest;
}
export async function restoreBundle(directory,output){
 const manifest=await verifyBundle(directory);output=resolve(output);await mkdir(output);
 for(const e of manifest.entries){const target=resolve(output,e.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,gunzipSync(await readFile(resolve(directory,e.object))),{flag:'wx'});await chmod(target,e.mode);}
 await writeFile(resolve(output,'PERFORMANCE-TRANSFER.json'),json({sourceBundleSha256:(await readFile(resolve(directory,'manifest.sha256'),'utf8')).trim(),source:manifest.source,createdAt:manifest.createdAt,restoredAt:new Date().toISOString(),files:manifest.entries.length}),{flag:'wx'});return manifest;
}
export async function transfer(command,args){
 if(command==='verify'){if(!args.bundle)throw Error('Provide --bundle');const m=await verifyBundle(resolve(args.bundle));console.log('Verified',m.entries.length,'files');return;}
 if(command==='restore'){if(!args.bundle||!args.output)throw Error('Provide --bundle and fresh --output');const m=await restoreBundle(resolve(args.bundle),args.output);console.log('Restored',m.entries.length,'files into',resolve(args.output));return;}
 if(!args.output)throw Error('Provide a fresh --output directory outside the source checkout');const output=resolve(args.output);if(output===repo||output.startsWith(repo+sep))throw Error('Export outside the source checkout to avoid recursive exports');
 let paths,head=null;
 try{head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,stdio:['ignore','pipe','ignore']}).toString().trim();paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:repo,maxBuffer:32*1024*1024}).toString().split('\0').filter(sourceIncluded);}
 catch(error){if(await access(resolve(repo,'.git')).then(()=>true,()=>false))throw error;
  async function sourceFiles(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){if(excluded.has(e.name)||e.name.startsWith('.env'))continue;const p=resolve(dir,e.name),rel=relative(repo,p);if(e.isDirectory()){if(dir!==repo||['showcases','packages','tooling','probes','apps','plans'].includes(e.name))result.push(...await sourceFiles(p));}else if(sourceIncluded(rel))result.push(rel);}return result;}paths=await sourceFiles(repo);
 }
 paths.push('AGENTS.md');
 const existing=[];for(const p of paths){try{await access(resolve(repo,p));existing.push(p)}catch(e){if(e.code!=='ENOENT')throw e;}}paths=existing;
 if(args.baseline){if(!safeId(args.baseline))throw Error('Invalid baseline ID');for(const p of await walk(resolve(lab,'baselines',args.baseline)))paths.push(relative(repo,p));}
 if(args.campaign){if(!safeId(args.campaign))throw Error('Invalid campaign ID');const dir=resolve(lab,'reports/campaigns',args.campaign);const state=JSON.parse(await readFile(resolve(dir,'state.json')));for(const p of await walk(dir))paths.push(relative(repo,p));for(const id of state.runs){if(!safeId(id))throw Error('Invalid retained run ID');let files;try{files=await walk(resolve(lab,'runs',id));}catch(e){if(e.code==='ENOENT'&&state.status!=='complete')continue;throw e;}for(const p of files)paths.push(relative(repo,p));}
  // Keep exact measured bytes; rebuilding later is a new acquisition, not replay.
  const inventory=JSON.parse(await readFile(resolve(dir,'inventory.json')));const builds=await readFile(resolve(dir,'builds.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  const ctx=JSON.parse(await readFile(resolve(dir,'campaign.json')));const assets=[...(builds?.variants||[]).map(s=>({...s,variant:true})),...(ctx.config.kind==='calendar'?[]:inventory.systems.filter(s=>ctx.config.systems.includes(s.id)))];
  for(const s of assets){const base=resolve(lab,s.variant?'.cache/variants':'.cache/snapshots',s.id);for(const a of s.assets){const p=resolve(base,a.path);if(digest(await readFile(p))!==a.sha256)throw Error('Measured build changed: '+s.id+'/'+a.path);paths.push(relative(repo,p));}}
 }
 const m=await createBundle(output,{paths,metadata:{source:{head,workingTree:'Exact selected working files, including uncommitted and untracked sources; not a clean-commit claim',campaign:args.campaign||null},exclusions:'Dependencies, runtimes, certificates/private keys, generic build outputs, unrelated artifacts, timing baselines unless explicitly selected. Selected campaign raw data and exact builds are included only when requested.'}});
 // Read-only snapshot transfer needs no browser/build lease. Detect source edits
 // during capture rather than presenting a moving working tree as one snapshot.
 for(const entry of m.entries)if(digest(await readFile(resolve(repo,entry.path)))!==entry.sha256)throw Error('Source changed during export; retained bundle must not be treated as a stable snapshot: '+entry.path);
 await verifyBundle(output);console.log('Exported and verified',m.entries.length,'files to',output);
}
