import {readFile,writeFile,readdir,rm,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {verifyReference} from '../../showcases/performance/src/registry-reference.mjs';
const base=resolve('artifacts/scoped-registry-production-v1'),sha=b=>createHash('sha256').update(b).digest('hex');
async function walk(dir,prefix=''){const files=[];for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){if(['node_modules','.git'].includes(e.name)||(!prefix&&e.name==='dist'))continue;const p=resolve(dir,e.name),name=prefix+e.name;if(e.isDirectory())files.push(...await walk(p,name+'/'));else if(e.isFile()){const b=await readFile(p);files.push({path:name,bytes:b.length,sha256:sha(b)});}}return files;}
const receipts=[],oldSeals=[];
for(const phase of [0,1,2,3]){
 const dir=resolve(base,`phase-${phase}`),stage=resolve(dir,'source'),receipt=JSON.parse(await readFile(resolve(dir,'receipt.json')));
 await rm(resolve(dir,'site'),{recursive:true,force:true});await cp(resolve(stage,'dist'),resolve(dir,'site'),{recursive:true});
 receipt.assets=await walk(resolve(dir,'site'));receipt.assetsDigest=sha(JSON.stringify(receipt.assets));
 const frozen=resolve('showcases/performance/baselines',receipt.libraryArchive);oldSeals.push(await verifyReference(frozen));
 let verified=0;for(const name of ['elements','primitives','styles','tokens','ssr'])for(const f of await walk(resolve(frozen,'workspace-build',name))){assert.equal(sha(await readFile(resolve(stage,'packages',name,'dist',f.path))),f.sha256,`Phase ${phase} library drift ${name}/${f.path}`);verified++;}
 const source=await walk(stage);await writeFile(resolve(dir,'source-final.json'),JSON.stringify(source,null,2)+'\n');
 receipt.sourceDigest=sha(JSON.stringify(source));receipt.libraryFilesVerified=verified;receipt.note='Historical docs sources and exact frozen compiled library modules; same common generated-example build repair and regenerated metadata. Phase 3 overlays frozen workflow and relevant library sources on Phase 2. Actual full Vite multi-page production build with build-time SSR; no benchmark entrypoint or app instrumentation injected.';
 await writeFile(resolve(dir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');receipts.push(receipt);
 execFileSync('tar',['-czf',resolve(dir,'source.tar.gz'),'--exclude=./node_modules','--exclude=*/node_modules','--exclude=./dist','-C',stage,'.']);
 execFileSync('tar',['-czf',resolve(dir,'site.tar.gz'),'-C',resolve(dir,'site'),'.']);
 console.log(JSON.stringify({phase,libraryFilesVerified:verified,sourceFiles:source.length,assets:receipt.assets.length}));
}
assert.equal(new Set(receipts.map(r=>r.viteConfigSha256)).size,1,'Different Vite configuration');
assert.equal(new Set(receipts.map(r=>r.dependencyLockSha256)).size,1,'Different pinned dependencies');
assert.equal(receipts[0].dependencyLockSha256,sha(await readFile('package-lock.json')),'Installed root lock differs');
await writeFile(resolve(base,'build-verification.json'),JSON.stringify({at:new Date().toISOString(),phases:receipts.map(r=>({phase:r.phase,sourceDigest:r.sourceDigest,assetsDigest:r.assetsDigest,libraryFilesVerified:r.libraryFilesVerified,overlays:r.overlays})),identicalViteConfig:true,identicalDependencyLocks:true,vite:JSON.parse(await readFile('node_modules/vite/package.json')).version,oldSeals,limitations:['Historical clean builds needed identical generated-example repair and regenerated metadata.','Production settings uses global customElements in every phase.','Local compressed HTTPS/HTTP2 delivery; not CDN, physical-device or field performance.']},null,2)+'\n');
