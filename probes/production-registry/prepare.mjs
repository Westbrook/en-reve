import {execFileSync,spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile,cp,readdir,symlink,rm} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'artifacts/scoped-registry-production-v1');
const phases=[['61dd26b','scoped-registry-phase-0-reference-v1'],['166e532','scoped-registry-phase-1-candidate-v2'],['2dbb4ff','scoped-registry-phase-2-candidate-v1'],['2dbb4ff','scoped-registry-phase-3-candidate-v1']];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function inventory(dir,prefix=''){const rows=[];for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){if(e.name==='node_modules'||e.name==='.git'||(!prefix&&e.name==='dist'))continue;const p=resolve(dir,e.name),name=prefix+e.name;if(e.isDirectory())rows.push(...await inventory(p,name+'/'));else if(e.isFile()){const b=await readFile(p);rows.push({path:name,bytes:b.length,sha256:hash(b)});}}return rows;}
await mkdir(out,{recursive:true});
for(const phase of process.argv.slice(2).length?process.argv.slice(2).map(Number):[0,1,2,3]){
 const [ref,baseline]=phases[phase],directory=resolve(out,`phase-${phase}`),stage=resolve(directory,'source');await mkdir(stage,{recursive:true});
 const archive=execFileSync('git',['archive',ref,'apps','packages','tooling','plans','probes/framework-consumption','package.json','package-lock.json','tsconfig.base.json'],{cwd:root,maxBuffer:200*1024*1024});
 execFileSync('tar',['-x','-C',stage],{input:archive});
 const frozen=resolve(root,'showcases/performance/baselines',baseline);
 for(const name of ['elements','primitives','styles','tokens','ssr'])await cp(resolve(frozen,'workspace-build',name),resolve(stage,'packages',name,'dist'),{recursive:true});
 const overlays=[];
 const generatorPath=resolve(stage,'apps/docs/scripts/generate-api-examples.mjs');
 const generator=await readFile(generatorPath,'utf8');
 const marker="\texamples.set('focus-motion',";
 const repaired=generator.replace(marker,"\texamples.set('composable-chat', { id: 'composable-chat', title: 'Composable editor extensions' });\n"+marker);
 if(repaired===generator)throw Error('Missing expected historical generator repair anchor');
 await writeFile(generatorPath,repaired);
 overlays.push({path:'apps/docs/scripts/generate-api-examples.mjs',kind:'common clean-build repair',before:hash(generator),sha256:hash(repaired),reason:'Generate the composable-chat source module already imported by the docs example shell. Same existing workspace fix applied in all four reconstructions; library runtime unchanged.'});
 if(phase===2){
  const path='apps/docs/scripts/build-ssr.mjs',original=await readFile(resolve(stage,path),'utf8');
  const updated=original.replace('for (const page of apiExamplePages) {','for (const page of []) { // Historical Phase 2 color-control SSR cleanup fails in unrelated API examples.');
  if(updated===original)throw Error('Missing API SSR loop');await writeFile(resolve(stage,path),updated);
  overlays.push({path,kind:'unmeasured API-example SSR omission',before:hash(original),sha256:hash(updated),reason:'Phase 2 archived color controls throw during unrelated API-example SSR cleanup. Retain the exact full multi-page client build and original settings SSR pipeline; skip only unrelated API-example server rendering. No library byte changes.'});
 }
 if(phase===3)for(const path of ['apps/docs/src/workflow-pages/settings-entry.ts','apps/docs/src/workflow-pages/settings.ts','apps/docs/src/workflows/settings/index.ts','apps/docs/src/workflows/settings/template.ts','packages/elements/src/lazy.ts','packages/elements/src/lazy-loader.ts','packages/elements/src/lazy-manifest.ts','packages/elements/src/color-plane.ts','packages/elements/src/color-wheel.ts']){
  const from=resolve(root,'showcases/performance/baselines/scoped-registry-phase-3-lazy-v1/sources',path);await cp(from,resolve(stage,path));overlays.push({path,sha256:hash(await readFile(from))});
 }
 // Dependencies resolve to the pinned installation; workspace packages resolve only to this reconstruction.
 await mkdir(resolve(stage,'node_modules/@en-reve'),{recursive:true});
 const link=async(a,b)=>{try{await symlink(a,b);}catch(e){if(e.code!=='EEXIST')throw e;}};
 for(const name of await readdir(resolve(root,'node_modules')))if(name!=='@en-reve'&&!name.startsWith('.'))await link(resolve(root,'node_modules',name),resolve(stage,'node_modules',name));
 for(const name of ['elements','primitives','styles','tokens','ssr'])await link(resolve(stage,'packages',name),resolve(stage,'node_modules/@en-reve',name));
 // Reconstruct generated docs metadata against the archived dependency declarations.
 // This updates documentation only; the measured compiled library stays byte-identical.
 const metadata=[];for(const command of ['tooling/metadata/generate-elements.ts','tooling/metadata/type-snapshot.ts','tooling/metadata/public-graph.ts']){
  const result=spawnSync(process.execPath,[command],{cwd:stage,encoding:'utf8',maxBuffer:20*1024*1024});metadata.push({command,status:result.status,output:result.stdout+'\n'+result.stderr});if(result.status!==0){await writeFile(resolve(directory,'metadata.json'),JSON.stringify(metadata,null,2));throw Error(`Phase ${phase} metadata failed: ${result.stderr.slice(-2000)}`);}
 }await writeFile(resolve(directory,'metadata.json'),JSON.stringify(metadata,null,2)+'\n');
 const before=await inventory(stage);
 await writeFile(resolve(directory,'source-before.json'),JSON.stringify(before,null,2)+'\n');
 const log=spawnSync(process.execPath,['apps/docs/scripts/build-ssr.mjs'],{cwd:stage,encoding:'utf8',maxBuffer:100*1024*1024});
 await writeFile(resolve(directory,'build.log'),log.stdout+'\n'+log.stderr);
 if(log.status!==0)throw Error(`Phase ${phase} build failed: ${log.stderr.slice(-2500)}`);
 await rm(resolve(directory,'site'),{recursive:true,force:true});await cp(resolve(stage,'dist'),resolve(directory,'site'),{recursive:true});
 const assets=await inventory(resolve(directory,'site'));
 const finalSource=await inventory(stage);await writeFile(resolve(directory,'source-final.json'),JSON.stringify(finalSource,null,2)+'\n');
 let libraryFilesVerified=0;for(const name of ['elements','primitives','styles','tokens','ssr'])for(const f of await inventory(resolve(frozen,'workspace-build',name))){if(hash(await readFile(resolve(stage,'packages',name,'dist',f.path)))!==f.sha256)throw Error('Library runtime drift');libraryFilesVerified++;}
 const receipt={phase,baseCommit:execFileSync('git',['rev-parse',ref],{cwd:root,encoding:'utf8'}).trim(),libraryArchive:baseline,librarySeal:JSON.parse(await readFile(resolve(frozen,'seal.json'))),libraryFilesVerified,overlays,buildCommand:'node apps/docs/scripts/build-ssr.mjs',viteConfigSha256:hash(await readFile(resolve(stage,'apps/docs/vite.config.ts'))),dependencyLockSha256:hash(await readFile(resolve(stage,'package-lock.json'))),sourceDigest:hash(JSON.stringify(finalSource)),assets,assetsDigest:hash(JSON.stringify(assets)),note:'Historical docs sources with exact frozen compiled library modules. Phase 3 overlays frozen settings workflow and corresponding library source files for docs metadata. Common generated-example repair and fresh metadata are recorded. Actual full Vite multi-page production build and build-time SSR; no benchmark entry or measured runtime modification.'};
 await writeFile(resolve(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({phase,assets:assets.length,digest:receipt.assetsDigest}));
}
