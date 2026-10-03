import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRelease } from './release.ts';
import { digest, inventory } from '../offline-review/runtime.mjs';
import { digestJson } from '../evidence/identity.ts';
import { packageVersionReview, scenarioPath } from './review-package.mjs';
import { startVersionReview, verifyVersionReview } from './review-server.mjs';

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'en-version-review-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const beforeDirectory=join(root,'before'),afterDirectory=join(root,'after');const cem={schemaVersion:'1.0.0',modules:[]};const manifests=[];
  for(const [side,directory] of [['before',beforeDirectory],['after',afterDirectory]]){
    await mkdir(directory);const fingerprint=digest(side);await writeFile(join(directory,'index.html'),`<html><head><meta name="en-review-build" content="${fingerprint}"></head><body>${side}</body></html>`);await writeFile(join(directory,'custom-elements.json'),JSON.stringify(cem));
    const build={schemaVersion:1,fingerprint,assets:await inventory(directory),pages:[],caseIds:[]};const bytes=JSON.stringify(build);await writeFile(join(directory,'review-build.json'),bytes);manifests.push(digest(bytes));
  }
  const release=createRelease({schemaVersion:1,sample:true,packageTrain:['@en-reve/fixture'],baseVersion:'0.1.0',baseArtifacts:{reviewBuild:manifests[0]},candidateArtifacts:{reviewBuild:manifests[1]},changes:[{id:'fixture-change',components:['$package'],level:'fix',summary:'Synthetic fixture',rationale:'Exercise review without claiming a library release',evidence:[]}]},cem,cem);
  const releaseFile=join(root,'release.json');await writeFile(releaseFile,JSON.stringify(release));
  return {beforeDirectory,afterDirectory,releaseFile,outputDirectory:join(root,'package'),scenarios:[{id:'home',title:'Fixture',component:'$package',before:'/',after:'/'}],release};
}
test('exact release/build package reproduces and cannot overwrite an existing review',async t=>{const f=await fixture(t);await packageVersionReview(f);await verifyVersionReview(f.outputDirectory);assert.deepEqual(await readFile(join(f.outputDirectory,'before/index.html')),await readFile(join(f.beforeDirectory,'index.html')));await assert.rejects(packageVersionReview(f),/EEXIST/);});
test('reject mismatched release/build contracts and tampered release records',async t=>{const f=await fixture(t);f.release.changes[0].summary='Changed';await writeFile(f.releaseFile,JSON.stringify(f.release));await assert.rejects(packageVersionReview(f),/intact/);const {digest:old,...record}=f.release;f.release.digest=digestJson(record);f.release.baseArtifacts.reviewBuild=digest('wrong');const {digest:unused,...next}=f.release;f.release.digest=digestJson(next);await writeFile(f.releaseFile,JSON.stringify(f.release));await assert.rejects(packageVersionReview(f),/exact documentation manifest/);});
test('scenario coverage and absent versions are explicit',async t=>{const f=await fixture(t);f.scenarios[0].before=null;await assert.rejects(packageVersionReview(f),/explicit reason/);f.scenarios[0].beforeUnavailable='Not introduced in this version';await packageVersionReview(f);const review=JSON.parse(await readFile(join(f.outputDirectory,'review.json')));assert.equal(review.scenarios[0].before,null);assert.equal(review.acceptance,'not-run');});
test('reject arbitrary URLs, unavailable documents, duplicate and missing component mappings',async t=>{const f=await fixture(t);assert.throws(()=>scenarioPath('https://example.com/',[]),/local/);assert.throws(()=>scenarioPath('//example.com/',[]),/local/);f.scenarios[0].after='/absent';await assert.rejects(packageVersionReview(f),/unavailable/);f.scenarios[0].after='/';f.scenarios.push({...f.scenarios[0]});await assert.rejects(packageVersionReview(f),/duplicate/);f.scenarios=[];await assert.rejects(packageVersionReview(f),/At least one/);});
test('independent loopback origins serve exact side assets and deny cross-package paths',async t=>{
  const f=await fixture(t);await packageVersionReview(f);const server=await startVersionReview(f.outputDirectory);t.after(server.close);
  assert.equal(new Set(Object.values(server.origins)).size,3);
  const a=await fetch(server.origins.before+'/'),b=await fetch(server.origins.after+'/');assert.match(await a.text(),/before/);assert.match(await b.text(),/after/);
  assert.match(a.headers.get('content-security-policy'),new RegExp(server.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal((await fetch(server.url+'/before/index.html')).status,404);assert.equal((await fetch(server.origins.before+'/after/index.html')).status,404);
  assert.deepEqual(await (await fetch(server.url+'/session.json')).json(),{before:server.origins.before,after:server.origins.after});
  await writeFile(join(f.outputDirectory,'after/index.html'),'changed');assert.equal((await fetch(server.origins.after+'/')).status,409);await assert.rejects(verifyVersionReview(f.outputDirectory),/integrity mismatch/);
});
test('scoped fixtures require exact release identities, intact bytes and matching scenario coverage',async t=>{
  const f=await fixture(t);f.scenarios[0].scoped=true;
  await assert.rejects(packageVersionReview(f),/both exact fixture bundles/);
  f.scoped={before:join(f.beforeDirectory,'..','scoped-before'),after:join(f.afterDirectory,'..','scoped-after')};
  for(const side of ['before','after']){
    const directory=f.scoped[side];await mkdir(directory);await writeFile(join(directory,'fixture.js'),'export function mount() {}');
    const manifest={schema:'en-reve/scoped-review-fixture',schemaVersion:1,entry:'fixture.js',scenarios:['home'],files:await inventory(directory)};
    const bytes=JSON.stringify(manifest);await writeFile(join(directory,'fixture.json'),bytes);
    f.release[side==='before'?'baseArtifacts':'candidateArtifacts'].scopedFixture=digest(bytes);
  }
  const {digest:previous,...record}=f.release;f.release.digest=digestJson(record);await writeFile(f.releaseFile,JSON.stringify(f.release));
  await writeFile(join(f.scoped.before,'fixture.js'),'modified');await assert.rejects(packageVersionReview(f),/integrity mismatch/);
  await writeFile(join(f.scoped.before,'fixture.js'),'export function mount() {}');
  f.scenarios[0].id='other';await assert.rejects(packageVersionReview(f),/both exact fixture bundles/);f.scenarios[0].id='home';
  await packageVersionReview(f);await verifyVersionReview(f.outputDirectory);
  assert.deepEqual(await readFile(join(f.outputDirectory,'scoped/before/fixture.js')),await readFile(join(f.scoped.before,'fixture.js')));
});
