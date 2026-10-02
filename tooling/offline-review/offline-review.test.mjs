import { request } from 'node:http';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashValue } from '@en-reve/tokens';
import { packageReview } from './package.mjs';
import { digest, startOfflineReview, verifyPackage } from './runtime.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'en-offline-control-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const buildDirectory = join(root, 'build'), candidateFile = join(root, 'candidate.json'), outputDirectory = join(root, 'package');
  await mkdir(buildDirectory);
  const fingerprint = digest('synthetic build, not browser evidence');
  const html = `<html><head><meta name="en-review-build" content="${fingerprint}"></head><body>Fixture</body></html>`;
  const assets = ['index.html','theme-review.html'].map(path => ({path,sha256:digest(html)}));
  for (const {path} of assets) await writeFile(join(buildDirectory,path),html);
  const build = {schemaVersion:1,fingerprint,assets,pages:[],caseIds:[]};
  await writeFile(join(buildDirectory,'review-build.json'),JSON.stringify(build));
  const candidate = {schema:'en-reve/local-theme-review',schemaVersion:1,build,draft:{synthetic:true}};
  const writeCandidate = async () => writeFile(candidateFile,JSON.stringify({...candidate,integrity:hashValue(candidate)}));
  await writeCandidate();
  return { root, buildDirectory,candidateFile,outputDirectory,build,candidate,writeCandidate };
}
test('exact bytes survive packaging; independent runner and explicit acceptance limits',async t=>{
  const f=await fixture(t);const result=await packageReview(f);
  assert.equal(result.buildFingerprint,f.build.fingerprint);
  assert.equal(result.acceptance.manualAccessibility,'not-run');
  assert.deepEqual(await readFile(join(f.outputDirectory,'candidate.json')),await readFile(f.candidateFile));
  assert.deepEqual(await readFile(join(f.outputDirectory,'site/theme-review.html')),await readFile(join(f.buildDirectory,'theme-review.html')));
  await verifyPackage(f.outputDirectory);
  await assert.rejects(packageReview(f),/EEXIST/);
  await verifyPackage(f.outputDirectory);
});
test('reject changed assets, missing files and extra build files',async t=>{
  const f=await fixture(t);await writeFile(join(f.buildDirectory,'extra.js'),'extra');
  await assert.rejects(packageReview(f),/Build integrity/);await rm(join(f.buildDirectory,'extra.js'));
  await writeFile(join(f.buildDirectory,'theme-review.html'),'changed');
  await assert.rejects(packageReview(f),/Build integrity/);await rm(join(f.buildDirectory,'theme-review.html'));
  await assert.rejects(packageReview(f),/missing assets/);
});
test('reject candidate tampering and mismatched builds; supports pair envelope',async t=>{
  const f=await fixture(t);const bytes=JSON.parse(await readFile(f.candidateFile));bytes.draft={changed:true};
  await writeFile(f.candidateFile,JSON.stringify(bytes));await assert.rejects(packageReview(f),/envelope integrity/);
  f.candidate.build={...f.build,fingerprint:digest('another')};await f.writeCandidate();await assert.rejects(packageReview(f),/different build/);
  f.candidate.build=f.build;f.candidate.schemaVersion=2;await f.writeCandidate();await packageReview(f);
});
test('reject path traversal, duplicates and symlinks',async t=>{
  const f=await fixture(t);await symlink(f.candidateFile,join(f.buildDirectory,'link'));
  await assert.rejects(packageReview(f),/Symlinks/);await rm(join(f.buildDirectory,'link'));
  const file=join(f.buildDirectory,'review-build.json');const original=[...f.build.assets];
  f.build.assets.push({...original[0]});await writeFile(file,JSON.stringify(f.build));await assert.rejects(packageReview(f),/Duplicate/);
  f.build.assets=[{path:'../escape',sha256:digest('bad')}];await writeFile(file,JSON.stringify(f.build));await assert.rejects(packageReview(f),/Unsafe/);
});
test('startup verification rejects changed, missing and added package files',async t=>{
  const f=await fixture(t);await packageReview(f);await writeFile(join(f.outputDirectory,'extra'),'unexpected');
  await assert.rejects(verifyPackage(f.outputDirectory),/integrity mismatch/);await rm(join(f.outputDirectory,'extra'));
  await rm(join(f.outputDirectory,'candidate.json'));await assert.rejects(verifyPackage(f.outputDirectory),/Missing/);
});
test('loopback server has bounded routes, methods, Host and per-request integrity',async t=>{
  const f=await fixture(t);await packageReview(f);const server=await startOfflineReview(f.outputDirectory);t.after(server.close);
  const response=await fetch(server.url+'/theme-review');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/);
  assert.equal((await fetch(server.url+'/offline-review')).status,200);
  assert.equal((await fetch(server.url+'/offline-candidate.json')).headers.get('content-disposition'),'attachment; filename="candidate.json"');
  assert.equal((await fetch(server.url+'/theme-review',{method:'HEAD'})).status,200);
  assert.equal((await fetch(server.url+'/theme-review',{method:'POST'})).status,405);
  assert.equal(await new Promise((done,reject)=>{const req=request(server.url+'/theme-review',{headers:{Host:'example.org'}},response=>{response.resume();done(response.statusCode);});req.on('error',reject);req.end();}),403);
  assert.equal((await fetch(server.url+'/serve.mjs')).status,404);
  assert.equal((await fetch(server.url+'/%2e%2e%2fREADME.txt')).status,409);
  await writeFile(join(f.outputDirectory,'site/theme-review.html'),'changed');assert.equal((await fetch(server.url+'/theme-review')).status,409);
});
