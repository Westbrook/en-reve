import {readFile,writeFile,mkdir,cp,readdir,stat,chmod,rename} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyReference} from '../../showcases/performance/src/registry-reference.mjs';
const base=resolve('artifacts/scoped-registry-production-v1'),target=resolve('showcases/performance/baselines/scoped-registry-production-v1'),pending=target+'.pending',sha=b=>createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--verify')){console.log(await verifyReference(target));process.exit();}
assert.equal(await stat(target).catch(()=>null),null,'Never overwrite frozen results');assert.equal(await stat(pending).catch(()=>null),null,'Unexpected pending freeze');
const manifest=JSON.parse(await readFile(resolve(base,'campaign/manifest.json'))),summary=JSON.parse(await readFile(resolve(base,'campaign/summary.json')));
assert.equal(summary.passed,500);assert.equal(summary.timing,480);assert.equal(summary.retention,20);
for(const h of manifest.harness)assert.equal(sha(await readFile(resolve('probes/production-registry',h.name))),h.sha256,'Harness drift');
assert.equal(sha(await readFile(resolve(base,'protocol.md'))),manifest.protocolSha256,'Protocol drift');
await mkdir(pending);
for(const file of ['protocol.md','build-verification.json','capture-verification.json','comparison.json','findings.json','functional-verification.json','power-before.txt','power-after.txt','thermal-before.txt','thermal-after.txt'])await cp(resolve(base,file),resolve(pending,file));
await cp(resolve(base,'campaign'),resolve(pending,'run'),{recursive:true});await cp(resolve(base,'qualification'),resolve(pending,'qualification'),{recursive:true});
await cp('probes/production-registry',resolve(pending,'harness'),{recursive:true});
await mkdir(resolve(pending,'reconstruction-diagnostics'));
for(const name of ['qualification-phase0','qualification-readiness-rejected'])await cp(resolve(base,name),resolve(pending,'reconstruction-diagnostics',name),{recursive:true});
for(const [phase,name]of [[1,'build-initial-failed.log'],[1,'build-missing-source-failed.log'],[2,'build-api-ssr-failed.log']])await cp(resolve(base,`phase-${phase}`,name),resolve(pending,'reconstruction-diagnostics',`phase-${phase}-${name}`));
await cp('showcases/performance/src',resolve(pending,'performance-support'),{recursive:true});
for(const name of ['package.json','package-lock.json'])await cp(resolve('showcases/performance',name),resolve(pending,'lab-'+name));
for(const phase of [0,1,2,3]){
 const dir=resolve(base,`phase-${phase}`),dest=resolve(pending,`phase-${phase}`),receipt=JSON.parse(await readFile(resolve(dir,'receipt.json'))),m=manifest.receipts.find(r=>r.phase===phase);
 assert.equal(receipt.assetsDigest,m.assetsDigest);assert.equal(receipt.sourceDigest,m.sourceDigest);
 for(const a of receipt.assets)assert.equal(sha(await readFile(resolve(dir,'site',a.path))),a.sha256,'Asset drift');
 await mkdir(dest);for(const file of ['receipt.json','source-final.json','source.tar.gz','site.tar.gz','build.log','metadata.json'])if(await stat(resolve(dir,file)).catch(()=>null))await cp(resolve(dir,file),resolve(dest,file));
}
const baseline={name:'scoped-registry-production-v1',status:'frozen',frozenAt:new Date().toISOString(),timing:{configurations:16,successfulSamples:480,minimumPerConfiguration:30},retention:{configurations:4,successfulRuns:20,repetitionsPerConfiguration:5,checkpoints:[0,10,50,100]},phases:[0,1,2,3],hostIdentity:manifest.host,methodology:'Reconstructed actual Vite production settings page with SSR, gzip, HTTPS/HTTP2 and global registration. Separate from registry fixtures. Build repairs and Phase 2 unrelated API SSR omission are disclosed.'};
await writeFile(resolve(pending,'baseline.json'),JSON.stringify(baseline,null,2)+'\n');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const p=resolve(dir,e.name);files.push(...(e.isDirectory()?await walk(p):[p]));}return files.sort();}
const files=[];for(const p of await walk(pending)){const b=await readFile(p);files.push({path:relative(pending,p),bytes:b.length,sha256:sha(b)});}
await writeFile(resolve(pending,'checksums.json'),JSON.stringify({algorithm:'sha256',files},null,2)+'\n');await writeFile(resolve(pending,'seal.json'),JSON.stringify({algorithm:'sha256',checksumsSha256:sha(await readFile(resolve(pending,'checksums.json')))},null,2)+'\n');
await verifyReference(pending);for(const p of await walk(pending))await chmod(p,0o444);await rename(pending,target);console.log(await verifyReference(target));
