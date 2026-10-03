import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectBuild, copyBuild } from '../offline-review/build.mjs';
import { inventory, digest, verifyFiles } from '../offline-review/runtime.mjs';
import { digestJson } from '../evidence/identity.ts';
import { createRelease } from './release.ts';

export function scenarioPath(value, assets) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) throw new Error('Scenario must use a local document path');
  const url = new URL(value, 'http://review.invalid');
  if (url.origin !== 'http://review.invalid') throw new Error('Scenario must stay local');
  const name = decodeURIComponent(url.pathname).replace(/^\//, '').replace(/\/$/, '') || 'index.html';
  const file = assets.some(entry => entry.path === name) ? name : name + '.html';
  if (!file.endsWith('.html') || !assets.some(entry => entry.path === file)) throw new Error('Scenario document is unavailable: ' + value);
  return url.pathname + url.search + url.hash;
}
export async function packageVersionReview({ beforeDirectory, afterDirectory, releaseFile, scenarios, scoped, outputDirectory }) {
  const output = resolve(outputDirectory);
  for (const directory of [beforeDirectory, afterDirectory].map(path => resolve(path))) {
    if (output === directory || output.startsWith(directory + sep) || directory.startsWith(output + sep)) throw new Error('Output must be separate from both builds');
  }
  const before = await inspectBuild(resolve(beforeDirectory)), after = await inspectBuild(resolve(afterDirectory));
  const releaseBytes = await readFile(releaseFile), release = JSON.parse(releaseBytes);
  const { digest: claimed, ...record } = release;
  if (release.kind !== 'release-draft' || digestJson(record) !== claimed || release.adopted !== false || release.published !== false) throw new Error('Expected an intact, unadopted release draft');
  for (const [snapshot, artifacts] of [[before,release.baseArtifacts],[after,release.candidateArtifacts]]) {
    if (artifacts?.reviewBuild !== digest(snapshot.buildBytes)) throw new Error('Release reviewBuild artifact does not identify the exact documentation manifest');
  }
  const json = async (snapshot, path) => JSON.parse(await readFile(resolve(snapshot.buildRoot, path), 'utf8'));
  const [oldCem,newCem] = await Promise.all([json(before,'custom-elements.json'),json(after,'custom-elements.json')]);
  let types;
  if (release.cem?.typeCoverage !== 'not-supplied') {
    types={before:await json(before,'public-types.json'),after:await json(after,'public-types.json')};
    if (release.cem?.graphCoverage === 'public-contract-graph') types.graphs={before:await json(before,'public-api.json'),after:await json(after,'public-api.json')};
  }
  const rebuilt = createRelease({schemaVersion:1, packageTrain:release.packageTrain, baseVersion:release.baseVersion, baseArtifacts:release.baseArtifacts, candidateArtifacts:release.candidateArtifacts, changes:release.changes, sample:release.sample, stabilize:release.bump==='stabilize', componentHistory:Object.fromEntries(release.components.filter(c=>c.previous).map(c=>[c.name,c.previous]))},oldCem,newCem,types);
  if (rebuilt.digest !== claimed) throw new Error('Release draft does not reproduce from these build contracts');
  if (!Array.isArray(scenarios) || !scenarios.length) throw new Error('At least one explicit review scenario is required');
  const scopedSnapshots={};
  if(scoped)for(const [side,artifacts] of [['before',release.baseArtifacts],['after',release.candidateArtifacts]]){
    const directory=resolve(scoped[side]);
    if(output===directory||output.startsWith(directory+sep)||directory.startsWith(output+sep))throw new Error('Output must be separate from scoped fixtures');
    const bytes=await readFile(resolve(directory,'fixture.json')), manifest=JSON.parse(bytes);
    if(manifest.schema!=='en-reve/scoped-review-fixture'||manifest.schemaVersion!==1||manifest.entry!=='fixture.js'||!Array.isArray(manifest.scenarios)||artifacts.scopedFixture!==digest(bytes))throw new Error('Scoped fixture identity does not match release artifacts');
    await verifyFiles(directory,manifest.files,'fixture.json');
    scopedSnapshots[side]={buildRoot:directory,assets:await inventory(directory),manifest};
  }
  const ids = new Set(), owners = new Set(release.components.map(c=>c.name));
  const mapped = scenarios.map(scenario => {
    if (!scenario || !/^[a-z0-9][a-z0-9-]*$/.test(scenario.id) || ids.has(scenario.id) || typeof scenario.title !== 'string' || !scenario.title.trim() || !owners.has(scenario.component)) throw new Error('Invalid or duplicate scenario identity/owner');
    ids.add(scenario.id);
    const result={id:scenario.id,title:scenario.title,component:scenario.component,instructions:typeof scenario.instructions==='string'?scenario.instructions:''};
    for (const [side,snapshot] of [['before',before],['after',after]]) {
      if (scenario[side] === null) {
        const reason = scenario[side+'Unavailable'];
        if (typeof reason !== 'string' || !reason.trim()) throw new Error('An unavailable scenario side needs an explicit reason');
        result[side]=null;result[side+'Unavailable']=reason;
      } else result[side]=scenarioPath(scenario[side],snapshot.assets);
    }
    if(scenario.scoped===true){
      for(const side of ['before','after'])if(!scopedSnapshots[side]?.manifest.scenarios.includes(scenario.id))throw new Error('Scoped scenario requires both exact fixture bundles');
      result.scoped=true;
    }else result.scoped=false;
    return result;
  });
  for(const owner of owners) if(!mapped.some(s=>s.component===owner)) throw new Error('Map a scenario or explicit unavailable reason for ' + owner);
  await mkdir(output);
  try {
    await copyBuild(before,resolve(output,'before'));await copyBuild(after,resolve(output,'after'));
    for(const [side,snapshot] of Object.entries(scopedSnapshots))await copyBuild(snapshot,resolve(output,'scoped',side));
    const sides={before:{fingerprint:before.build.fingerprint,manifestDigest:digest(before.buildBytes)},after:{fingerprint:after.build.fingerprint,manifestDigest:digest(after.buildBytes)}};
    const review={schemaVersion:1,releaseDigest:claimed,sides,scenarios:mapped,scopedFixtures:scoped?{before:release.baseArtifacts.scopedFixture,after:release.candidateArtifacts.scopedFixture}:null,acceptance:'not-run'};
    review.digest=digestJson(review);
    await writeFile(resolve(output,'review.json'),JSON.stringify(review,null,2)+'\n');
    await writeFile(resolve(output,'release.json'),releaseBytes);
    for(const [name,source] of [['index.html','./review.html'],['review.js','./review-client.js'],['review.css','./review.css'],['tooling/releases/review-server.mjs','./review-server.mjs'],['tooling/offline-review/runtime.mjs','../offline-review/runtime.mjs']]) {
      const target=resolve(output,name);await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(new URL(source,import.meta.url)));
    }
    await writeFile(resolve(output,'serve.mjs'),`import {startVersionReview,verifyVersionReview} from './tooling/releases/review-server.mjs';\nimport {fileURLToPath} from 'node:url';\nconst root=fileURLToPath(new URL('.',import.meta.url));\nconst args=process.argv.slice(2);\nif(args.length>1 || (args.length && args[0]!=='--verify')) throw new Error('Usage: node serve.mjs [--verify]');\nif(args[0]==='--verify'){await verifyVersionReview(root);console.log('Version review integrity verified.');}\nelse {const server=await startVersionReview(root);console.log('Open '+server.url);for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close().then(()=>process.exit(0)));}\n`);
    await writeFile(resolve(output,'README.txt'),'En Reve interactive version review\n\nRequires Node 24+; no npm installation.\nRun node serve.mjs --verify, then node serve.mjs.\nOpen the printed loopback URL. Transfer this complete directory privately.\nEach build has an independent origin. Reviewers explicitly load scenarios.\nFeedback export is local and version-bound, never release approval or adoption.\nKeep feedback outside this immutable directory. Hashes detect corruption, not publisher authenticity.\n');
    const manifest={schema:'en-reve/version-review',schemaVersion:1,reviewDigest:review.digest,files:await inventory(output)};
    await writeFile(resolve(output,'version-review.json'),JSON.stringify(manifest,null,2)+'\n');
    return manifest;
  } catch(error) {await rm(output,{recursive:true,force:true});throw error;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==4)throw new Error('Usage: node tooling/releases/review-package.mjs <configuration.json> <new-output-directory>');
  const file=resolve(process.argv[2]), config=JSON.parse(await readFile(file,'utf8'));
  if(config.schemaVersion!==1)throw new Error('Unsupported configuration');
  const manifest=await packageVersionReview({beforeDirectory:resolve(dirname(file),config.beforeDirectory),afterDirectory:resolve(dirname(file),config.afterDirectory),releaseFile:resolve(dirname(file),config.releaseFile),scenarios:config.scenarios,scoped:config.scoped?{before:resolve(dirname(file),config.scoped.before),after:resolve(dirname(file),config.scoped.after)}:undefined,outputDirectory:process.argv[3]});
  console.log(JSON.stringify({output:resolve(process.argv[3]),reviewDigest:manifest.reviewDigest,files:manifest.files.length}));
}
