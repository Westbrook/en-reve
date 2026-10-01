import {build,version as esbuildVersion} from 'esbuild';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {root,sha,json} from './config.mjs';
import {assetManifest} from './prepare.mjs';
import {source,filesBelow} from '../../../tooling/integration-gates/runner.mjs';
import {acquireResources} from '../../../tooling/integration-gates/resources.mjs';

const repo=resolve(root,'../..'),execFileAsync=promisify(execFile),require=createRequire(import.meta.url);
const workloads=['activity','document'];
const packageNames=['tokens','styles','primitives','elements'];
const packageAssetsFrom=receipt=>receipt.builtAssets.filter(([path])=>packageNames.some(name=>path.startsWith(`packages/${name}/dist/`))).sort(([a],[b])=>a.localeCompare(b));
const failureDetails=error=>({message:String(error?.message??error),stack:String(error?.stack??''),code:error?.code??null});
async function packageInventory() {
  const actual=[];
  for(const name of packageNames) {
    const files=await filesBelow(repo,resolve(repo,'packages',name,'dist'));
    if(!files.length)throw Error('Missing built package '+name);
    actual.push(...files);
  }
  return actual.sort(([a],[b])=>a.localeCompare(b));
}
function verifyDistInput(path,digest,expected) {
  if(/^packages\/[^/]+\/dist\//.test(path)&&expected.get(path)!==`sha256:${digest}`)throw Error('Archived package input does not match normal build receipt: '+path);
}
const buildOptions={bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,sourcemap:true,metafile:true};
const html=workload=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Virtual reveal qualification · ${workload}</title><link rel="stylesheet" href="/tokens.css"><style>body{margin:0;font:16px system-ui;color:#252525;background:#fafafa}main{max-width:60rem;margin:auto;padding:1rem}header{position:fixed;inset:0 0 auto;height:48px;background:#eee;z-index:1}footer{position:fixed;inset:auto 0 0;height:24px;background:#eee;z-index:1}#before{height:900px}#after{height:1000px}</style>${workload==='document'?'<header>Document collection · 48px</header>':''}<main id="fixture"></main>${workload==='document'?'<footer>Sticky footer · 24px</footer>':''}<script type="module" src="/bootstrap.js"></script></html>`;

async function validateBuildReceipt(receipt,current,{receiptBytes,freshnessReview,directory}) {
  if(receipt.schemaVersion!==1||!receipt.source?.files||!receipt.after?.files||!Array.isArray(receipt.builtAssets))throw Error('Expected full integration-gate source/build receipt');
  const buildStage=receipt.stages?.find(stage=>stage.id==='build');
  const frozenStage=receipt.stages?.find(stage=>stage.id==='frozen');
  if(JSON.stringify(buildStage?.command)!==JSON.stringify(['npm','run','build'])||buildStage.status!=='passed'||buildStage.exitCode!==0||frozenStage?.status!=='passed'||frozenStage.exitCode!==0)throw Error('Normal build and frozen verification must have passed');
  if(receipt.source.worktreeStatus||receipt.after.sha256!==current.sha256)throw Error('Current clean sealed source is not the exact post-build source');
  let generatedClosure=null;
  if(receipt.exitCode!==0) {
    if(receipt.exitCode!==1||receipt.sourceStability?.status!=='failed'||receipt.stages.some(stage=>stage.required&&stage.status!=='passed')||!freshnessReview)throw Error('Non-green raw build needs an explicit reviewed generated-freshness disposition');
    const bytes=await readFile(freshnessReview),review=JSON.parse(bytes);
    const beforeFiles=new Map(receipt.source.files),afterFiles=new Map(receipt.after.files);
    const changes=[...new Set([...beforeFiles.keys(),...afterFiles.keys()])].sort().filter(path=>beforeFiles.get(path)!==afterFiles.get(path)).map(path=>({path,before:beforeFiles.get(path)??null,after:afterFiles.get(path)??null}));
    const allowed=new Set(['tooling/customization/evidence/coverage.json','tooling/customization/evidence/coverage.md']);
    if(!changes.length||changes.some(change=>!allowed.has(change.path))||review.schema!==1||review.disposition!=='reviewed-generated-freshness-only'||review.receiptSha256!==sha(receiptBytes)||review.sealedCommit!==current.commit||review.sourceAfterSha256!==current.sha256||JSON.stringify(review.changes)!==JSON.stringify(changes)||!review.reviewerNote)throw Error('Freshness disposition does not exactly cover the preserved generated-only source delta');
    const diff=await readFile(review.originalDiffPath);
    if(sha(diff)!==review.originalDiffSha256)throw Error('Original generated freshness diff hash mismatch');
    await writeFile(resolve(directory,'freshness-review.json'),bytes);
    await writeFile(resolve(directory,'original-generated-freshness.diff'),diff);
    generatedClosure={reviewSha256:sha(bytes),originalDiffSha256:sha(diff),changes};
  }
  const packageInputs=files=>files.filter(([path])=>path.startsWith('packages/'));
  if(JSON.stringify(packageInputs(receipt.source.files))!==JSON.stringify(packageInputs(current.files)))throw Error('Package source inputs changed during/after build; review and rebuild required');
  const expected=packageAssetsFrom(receipt),actual=await packageInventory();
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Current package outputs do not match normal build receipt');
  return {sourceCommit:receipt.source.commit,sealedCommit:current.commit,sourceAfterSha256:receipt.after.sha256,rawAggregateExitCode:receipt.exitCode,generatedClosure,buildExitCode:buildStage.exitCode,frozenExitCode:frozenStage.exitCode,packageSourceInputsUnchanged:true,packageAssetsVerified:actual.length,
    scope:'The raw aggregate result is retained. A clean commit after sealing generated documentation drift is allowed only when its full source hash exactly matches the build-after receipt and package source inputs did not change. This is package freshness evidence, not a claim that the original aggregate passed.'};
}

function buildToolVersions(receipt,preparation) {
  const versions={node:receipt.runtime?.node,npm:receipt.runtime?.npm,esbuild:receipt.packages?.esbuild,typescript:receipt.packages?.typescript};
  for(const [tool,version]of Object.entries(versions))if(typeof version!=='string'||!version||version==='unavailable'||version!==preparation[tool])throw Error('Normal build receipt has missing or mismatched actual tool version: '+tool);
  return versions;
}

/** Narrow production adapter. Package builds are owned by the gate, not hidden here. */
export async function prepareRevealFixture(directory,{exactCommit,buildReceipt,freshnessReview}) {
  if(!exactCommit||!buildReceipt)throw Error('Exact clean source commit and preceding normal build receipt required');
  await mkdir(directory,{recursive:false});
  const preparation={repositoryRoot:repo,node:process.version,esbuild:esbuildVersion,typescript:require('typescript/package.json').version,compression:{gzip:{level:9},brotli:{quality:11}}};
  const started={at:new Date().toISOString(),exactCommit,buildReceipt,preparation};
  const cells=[],errors=[];
  let lease,before,after,receipt,receiptBytes,buildValidation,packageAssetsAfter,buildToolchain;
  const finalization={schema:1,checks:{},cleanup:{status:'not-acquired'}};
  try {
    await writeFile(resolve(directory,'preparation-started.json'),json(started),{flag:'wx'});
    lease=await acquireResources(repo);
    before=await source(repo);
    await writeFile(resolve(directory,'source-before.json'),json(before));
    if(before.commit!==exactCommit||before.worktreeStatus)throw Error('Expected clean exact source commit');
    preparation.npm=(await execFileAsync('npm',['--version'],{cwd:repo,timeout:10000,maxBuffer:1024*1024})).stdout.trim();
    await writeFile(resolve(directory,'preparation-toolchain.json'),json(preparation));
    receiptBytes=await readFile(buildReceipt);
    await writeFile(resolve(directory,'upstream-build-receipt.json'),receiptBytes);
    receipt=JSON.parse(receiptBytes);
    buildValidation=await validateBuildReceipt(receipt,before,{receiptBytes,freshnessReview,directory});
    buildToolchain=buildToolVersions(receipt,preparation);
    const expectedDist=new Map(receipt.builtAssets);
    for(const workload of workloads) {
      const client=resolve(directory,workload), inputs=[];
      await mkdir(client);
      const output=await build({...buildOptions,absWorkingDir:repo,entryPoints:{bootstrap:resolve(root,'fixtures/reveal',workload+'.ts')},outdir:client});
      const metafileBytes=json(output.metafile),metafilePath=workload+'-metafile.json';
      await writeFile(resolve(directory,metafilePath),metafileBytes);
      for(const path of Object.keys(output.metafile.inputs).sort()) {
        const absolute=resolve(repo,path), bytes=await readFile(absolute);
        const local=relative(repo,absolute);
        if(local.startsWith('..'))throw Error('Bundle input outside repository: '+path);
        const digest=sha(bytes);verifyDistInput(local,digest,expectedDist);
        inputs.push({path:local,sha256:digest});
        const target=resolve(directory,'sources',local);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);
      }
      if(!inputs.some(input=>input.path==='packages/primitives/dist/interactions/virtual-collection.js'))throw Error('Runtime under qualification is absent from production graph');
      const tokens=await readFile(resolve(repo,'packages/tokens/dist/default.css'));
      verifyDistInput('packages/tokens/dist/default.css',sha(tokens),expectedDist);
      await writeFile(resolve(client,'tokens.css'),tokens);
      await writeFile(resolve(client,'index.html'),html(workload));
      const assets=await assetManifest(client);
      const production=assets.filter(asset=>!asset.diagnostic);
      cells.push({workload,inputs,assets,metafile:{path:metafilePath,sha256:sha(metafileBytes)},bytes:Object.fromEntries(['raw','gzip','brotli'].map(key=>[key,production.reduce((sum,asset)=>sum+asset[key],0)]))});
    }
  }catch(error){errors.push({stage:'preparation',...failureDetails(error)});}
  finally {
    // Ignored dist files are not covered by source(). Preserve independent after
    // inventories even when validation, bundling, or a preceding write failed.
    try {
      try {
        after=await source(repo);await writeFile(resolve(directory,'source-after.json'),json(after));
        finalization.checks.source={status:'observed',path:'source-after.json',sha256:sha(json(after))};
        if(!before)finalization.checks.source.comparison={status:'unavailable',reason:'No source-before receipt was obtained'};
        else if(before.sha256!==after.sha256||before.commit!==after.commit||after.worktreeStatus)throw Error('Source changed or is unclean after preparation');
        else finalization.checks.source.comparison={status:'passed'};
      }catch(error){finalization.checks.source={...finalization.checks.source,status:after?'failed':'unavailable',error:failureDetails(error)};errors.push({stage:'source-after',...failureDetails(error)});}
      try {
        packageAssetsAfter=await packageInventory();await writeFile(resolve(directory,'package-assets-after.json'),json(packageAssetsAfter));
        finalization.checks.packageAssets={status:'observed',path:'package-assets-after.json',sha256:sha(json(packageAssetsAfter))};
        if(!Array.isArray(receipt?.builtAssets))finalization.checks.packageAssets.comparison={status:'unavailable',reason:'No usable normal-build asset inventory was obtained'};
        else if(JSON.stringify(packageAssetsAfter)!==JSON.stringify(packageAssetsFrom(receipt)))throw Error('Package outputs changed during preparation or differ from normal build receipt');
        else finalization.checks.packageAssets.comparison={status:'passed'};
      }catch(error){finalization.checks.packageAssets={...finalization.checks.packageAssets,status:packageAssetsAfter?'failed':'unavailable',error:failureDetails(error)};errors.push({stage:'package-assets-after',...failureDetails(error)});}
      const servedAssetsAfter=[];
      for(const workload of workloads) {
        try {
          const assets=await assetManifest(resolve(directory,workload)),expected=cells.find(cell=>cell.workload===workload);
          const row={workload,status:'observed',assets,comparison:expected?{status:JSON.stringify(assets)===JSON.stringify(expected.assets)?'passed':'failed'}:{status:'unavailable',reason:'Workload preparation did not complete'}};
          servedAssetsAfter.push(row);
          if(row.comparison.status==='failed')errors.push({stage:'served-assets-after',message:'Served assets changed during preparation: '+workload});
        }catch(error){servedAssetsAfter.push({workload,status:'unavailable',error:failureDetails(error)});errors.push({stage:'served-assets-after',workload,...failureDetails(error)});}
      }
      try {const bytes=json(servedAssetsAfter);await writeFile(resolve(directory,'served-assets-after.json'),bytes);finalization.checks.servedAssets={status:'observed',path:'served-assets-after.json',sha256:sha(bytes)};}
      catch(error){finalization.checks.servedAssets={status:'unavailable',error:failureDetails(error)};errors.push({stage:'served-assets-after-write',...failureDetails(error)});}
    }finally {
      if(lease){try{await lease.release();finalization.cleanup={status:'passed'};}catch(error){finalization.cleanup={status:'failed',error:failureDetails(error)};errors.push({stage:'lease-cleanup',...failureDetails(error)});}}
    }
  }
  finalization.finishedAt=new Date().toISOString();finalization.status=errors.length?'failed':'passed';
  const finalizationBytes=json(finalization);
  try {
    await writeFile(resolve(directory,'preparation-finalization.json'),finalizationBytes);
    if(errors.length)throw Error('Preparation failed; inspect preserved preparation and finalization evidence');
    const identity={schema:1,preparation,preparationToolchainSha256:sha(json(preparation)),finalizationSha256:sha(finalizationBytes),packageAssetsAfterSha256:sha(json(packageAssetsAfter)),sourceReceiptSha256:sha(json(before)),sourceAfterReceiptSha256:sha(json(after)),source:{commit:before.commit,tree:before.tree,sha256:before.sha256},buildReceiptSha256:sha(receiptBytes),buildToolchain,buildValidation,buildOptions,cells,
      method:'Production esbuild of current built public package exports and unchanged authored docs factories. Package freshness requires the upstream normal-build receipt; this adapter never substitutes source for stale dist. Emitted bytes exclude sourcemaps and are not network transfer measurements.'};
    identity.fingerprint=sha(json(identity));
    await writeFile(resolve(directory,'identity.json'),json(identity),{flag:'wx'});
    return identity;
  }catch(error){
    const failure={message:String(error.stack??error),errors,finalization};
    try{await writeFile(resolve(directory,'preparation-failed.json'),json(failure));}
    catch(receiptError){throw new AggregateError([error,...errors,finalization,receiptError],'Preparation failed and its failure receipt could not be written; original evidence is preserved in this error',{cause:error});}
    throw error;
  }
}
export async function verifyRevealFixture(directory,expectedIdentitySha256) {
  const bytes=await readFile(resolve(directory,'identity.json'));
  if(sha(bytes)!==expectedIdentitySha256)throw Error('Fixture identity hash mismatch');
  const identity=JSON.parse(bytes);
  if(sha(await readFile(resolve(directory,'preparation-toolchain.json')))!==identity.preparationToolchainSha256)throw Error('Archived preparation toolchain changed');
  if(sha(await readFile(resolve(directory,'preparation-finalization.json')))!==identity.finalizationSha256||sha(await readFile(resolve(directory,'package-assets-after.json')))!==identity.packageAssetsAfterSha256)throw Error('Archived preparation finalization changed');
  const finalization=JSON.parse(await readFile(resolve(directory,'preparation-finalization.json')));
  if(finalization.status!=='passed'||finalization.cleanup.status!=='passed')throw Error('Preparation finalization did not pass');
  if(sha(await readFile(resolve(directory,'served-assets-after.json')))!==finalization.checks.servedAssets.sha256)throw Error('Archived served-assets-after receipt changed');
  if(sha(await readFile(resolve(directory,'upstream-build-receipt.json')))!==identity.buildReceiptSha256)throw Error('Archived build receipt changed');
  const receiptBytes=await readFile(resolve(directory,'upstream-build-receipt.json')),receipt=JSON.parse(receiptBytes),expectedDist=new Map(receipt.builtAssets);
  if(JSON.stringify(buildToolVersions(receipt,identity.preparation))!==JSON.stringify(identity.buildToolchain))throw Error('Archived normal-build toolchain changed');
  if(sha(await readFile(resolve(directory,'source-before.json')))!==identity.sourceReceiptSha256||sha(await readFile(resolve(directory,'source-after.json')))!==identity.sourceAfterReceiptSha256)throw Error('Archived source receipt changed');
  if(identity.buildValidation.generatedClosure){const closure=identity.buildValidation.generatedClosure;if(sha(await readFile(resolve(directory,'freshness-review.json')))!==closure.reviewSha256||sha(await readFile(resolve(directory,'original-generated-freshness.diff')))!==closure.originalDiffSha256)throw Error('Archived generated-freshness disposition changed');}
  for(const cell of identity.cells) {
    if(sha(await readFile(resolve(directory,cell.metafile.path)))!==cell.metafile.sha256)throw Error('Archived esbuild metafile changed: '+cell.workload);
    if(JSON.stringify(await assetManifest(resolve(directory,cell.workload)))!==JSON.stringify(cell.assets))throw Error('Frozen assets changed: '+cell.workload);
    for(const item of cell.inputs){const digest=sha(await readFile(resolve(directory,'sources',item.path)));if(digest!==item.sha256)throw Error('Archived bundle input changed: '+item.path);verifyDistInput(item.path,digest,expectedDist);}
    verifyDistInput('packages/tokens/dist/default.css',sha(await readFile(resolve(directory,cell.workload,'tokens.css'))),expectedDist);
  }
  return identity;
}
export async function startRevealFixture(directory,workload) {
  if(!workloads.includes(workload))throw Error('Invalid reveal workload');
  const client=resolve(directory,workload);
  const identity=JSON.parse(await readFile(resolve(directory,'identity.json')));
  const allowed=new Set(identity.cells.find(cell=>cell.workload===workload).assets.map(asset=>'/'+asset.path));
  const server=createServer(async(request,response)=>{
    try {
      const path=new URL(request.url,'http://127.0.0.1').pathname;
      const target=path==='/'?'/index.html':path;
      if(!allowed.has(target)){response.writeHead(404);response.end();return;}
      const bytes=await readFile(resolve(client,'.'+target));
      response.setHeader('Content-Type',target.endsWith('.html')?'text/html':target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'application/json');
      response.setHeader('Cache-Control','no-store');response.end(bytes);
    }catch(error){response.writeHead(500);response.end(String(error));}
  });
  await new Promise((resolve,reject)=>{const failed=error=>reject(error);server.once('error',failed);server.listen(0,'127.0.0.1',()=>{server.off('error',failed);resolve();});});
  return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [directory,exactCommit,buildReceipt,freshnessReview]=process.argv.slice(2);
  if(!directory)throw Error('Usage: node src/reveal-fixture.mjs OUTPUT EXACT_COMMIT NORMAL_BUILD_RECEIPT [REVIEWED_FRESHNESS_DISPOSITION]');
  const identity=await prepareRevealFixture(resolve(directory),{exactCommit,buildReceipt:resolve(buildReceipt),freshnessReview:freshnessReview?resolve(freshnessReview):undefined});
  console.log(json({directory,source:identity.source,identitySha256:sha(await readFile(resolve(directory,'identity.json')))}));
}
