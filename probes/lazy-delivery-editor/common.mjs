import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {expect} from '@playwright/test';
import {digest,digestFile,verifySource,inventory} from '../lazy-delivery-performance/source-seal.mjs';
import {inside,uniqueBindings,validateArms,validateArmReceipt,verifyAssetTree,entryBytes,budgetPaths,supportPaths} from '../lazy-delivery-families/performance-common.mjs';
import {assertSourceSubjects,routeSubjects,policyOverlay} from '../lazy-delivery-families/route-build-contract.mjs';
import {colorPolicyRevision} from '../lazy-delivery-color/color-policy-controls.mjs';
export const route='/api-examples/rich-text.html';
export const root=resolve(import.meta.dirname,'../..');
export const arg=(name,fallback)=>process.argv.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
export function randomizer(seed=20260928){let state=seed>>>0;return items=>{const result=[...items];for(let i=result.length-1;i>0;i--){state=(1664525*state+1013904223)>>>0;const j=Math.floor(state/4294967296*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};}
export const requiredHarnessPaths=[
 'probes/lazy-delivery-editor/timing.mjs','probes/lazy-delivery-editor/retention.mjs','probes/lazy-delivery-editor/analyze.mjs','probes/lazy-delivery-editor/common.mjs',
 'probes/lazy-delivery-families/performance-common.mjs','probes/lazy-delivery-families/route-build-contract.mjs',...supportPaths,
];
/** All calls, including preflight and failed-run verification, belong inside the acquisition lease. */
export async function loadPreparation(prepared,{allowColorControls=false}={}){
 assert.equal(typeof allowColorControls,'boolean','Color control permission must be explicit');
 assert(!process.env.NODE_OPTIONS&&!process.env.NODE_PATH&&!process.env.ESBUILD_BINARY_PATH,'Unset runtime/bundler overrides before exact-source acquisition');
 const path=resolve(prepared,'manifest.json'),bytes=await readFile(path),preparation=JSON.parse(bytes),{manifestSha256,...payload}=preparation;
 assert.equal(preparation.schemaVersion,1);assert.equal(preparation.kind,'en-reve-lazy-delivery-actual-docs-build');
 assert.equal(preparation.status,'complete','Only a complete frozen actual-docs preparation may run');assert.equal(digest(payload),manifestSha256,'Preparation manifest digest mismatch');
 assert.equal(preparation.build?.colorControls?.enabled,allowColorControls,'Separate color construction controls require the explicit control-only input path');
 assert.equal(preparation.build.colorControls.revision,allowColorControls?colorPolicyRevision:null,'Color construction control revision mismatch');
 const arms=preparation.arms;validateArms(arms);for(const arm of arms)assert(arm.routeSubjects?.includes('editor'),'Every arm must contain the actual editor route');
 const binding=uniqueBindings(preparation.harness?.files,'Prepared acquisition harness');assert.equal(digest(preparation.harness.files),preparation.harness.sha256,'Harness binding digest mismatch');
 const harnessDirectories=['probes/lazy-delivery-editor','probes/lazy-delivery-families','probes/lazy-delivery-color'],harnessTrees=new Map();
 for(const directory of harnessDirectories){const tree=await inventory(resolve(root,directory));harnessTrees.set(directory,tree);for(const file of tree)assert(binding.has(directory+'/'+file.path),'Missing complete harness binding '+directory+'/'+file.path);}
 for(const path of requiredHarnessPaths)assert(binding.has(path),'Missing prepared harness binding '+path);
 const budgets=uniqueBindings(preparation.budgets?.files??preparation.budgets,'Frozen budgets');assert.deepEqual([...budgets.keys()].sort(),[...budgetPaths].sort(),'Frozen budget set differs');
 for(const item of budgets.values())assert.equal(binding.get(item.path)?.sha256,item.sha256,'Budget not bound to acquisition harness '+item.path);
 const readReceipt=async(path,expected,label)=>{assert(/^[a-f0-9]{64}$/.test(expected),label+': missing receipt hash');const bytes=await readFile(inside(prepared,path));assert.equal(digest(bytes),expected,label+': receipt changed');return JSON.parse(bytes);};
 const receipts=new Map();for(const arm of arms)receipts.set(arm.id,await readReceipt(arm.receipt,arm.receiptSha256,arm.id));
 const verify=async()=>{
  assert.equal(digest(await readFile(path)),digest(bytes),'Preparation manifest changed');
  const sources={};
  for(const role of ['reference','candidate']){
   const declared=preparation.sources?.[role];assert(declared?.snapshot&&declared.sourceSha256&&declared.sealSha256,'Missing '+role+' source identity');
   const source=await verifySource(declared.snapshot,{reference:true});sources[role]=source;
   assert.equal(source.seal.sourceSha256,declared.sourceSha256,role+' source seal mismatch');assert.equal(source.seal.sealSha256,declared.sealSha256,role+' seal receipt mismatch');
   assert.equal(source.seal.git.dirty,false,'Acquisition requires clean exact source subjects');assert.deepEqual(declared.git,source.seal.git,role+' Git provenance mismatch');assert.equal(digest(declared.files),source.seal.sourceSha256,role+' declared source inventory mismatch');
   for(const key of ['rootLockSha256','performanceLockSha256'])assert.equal(declared[key],source.seal[key],role+' lock provenance mismatch');
  }
  assertSourceSubjects(sources);
  const candidateFiles=uniqueBindings(sources.candidate.seal.files,'Candidate source');
  for(const item of binding.values()){assert.equal(candidateFiles.get(item.path)?.sha256,item.sha256,'Harness not bound to candidate source '+item.path);assert.equal(await digestFile(inside(root,item.path)),item.sha256,'Executing harness differs from prepared candidate '+item.path);}
  for(const [directory,tree] of harnessTrees)assert.equal(digest(await inventory(resolve(root,directory))),digest(tree),'Harness file set changed '+directory);
  const packageReceipts=new Map(),actualReceipts=new Map();
  for(const arm of arms){
   const receipt=await readReceipt(arm.receipt,arm.receiptSha256,arm.id),source=sources[arm.subject].seal;actualReceipts.set(arm.id,receipt);validateArmReceipt(arm,receipt,source);
   await verifyAssetTree(inside(prepared,arm.root+'/site'),receipt.assets,arm.id);entryBytes(receipt,receipt.routes?.[route]?.entry,arm.id+'/editor');
   assert.equal(receipt.routes[route].subject,'editor');assert.equal(receipt.routes[route].workload,'contextual-richtext-toolbar');
   const packages=await readReceipt(receipt.packagesReceipt,receipt.packagesReceiptSha256,arm.id+' packages');assert.equal(packages.subject,arm.subject);assert.equal(packages.sourceSha256,source.sourceSha256);assert.equal(packages.sealSha256,source.sealSha256);
   const projected=packages.packages.map(({name,version,path,sha256,integrity})=>({name,version,path,sha256,integrity}));assert.deepEqual(receipt.packages,projected,'Arm archive projection mismatch');assert.deepEqual(projected.map(item=>item.name).sort(),['tokens','styles','primitives','elements','ssr'].map(name=>'@en-reve/'+name).sort(),'Exact five production archives required');
   for(const archive of packages.packages)assert.equal(digest(archive.files),archive.filesSha256,'Packed archive file inventory changed');
   if(packageReceipts.has(arm.subject))assert.equal(packageReceipts.get(arm.subject),receipt.packagesReceiptSha256,'Same-subject arms use different packages');
   else{packageReceipts.set(arm.subject,receipt.packagesReceiptSha256);for(const item of projected){const archive=await readFile(inside(prepared,item.path));assert.equal(digest(archive),item.sha256,'Packed archive changed');assert.equal('sha512-'+createHash('sha512').update(archive).digest('base64'),item.integrity,'Packed archive integrity changed');}}
   const overlays=await readReceipt(arm.root+'/'+receipt.overlays,receipt.overlaysSha256,arm.id+' overlays');assert(Array.isArray(overlays),'Missing explicit source overlay list');
   const sourceFiles=uniqueBindings(source.files,'Arm source');
   for(const overlay of overlays){
    assert.equal(sourceFiles.get(overlay.path)?.sha256,overlay.originalSha256,'Overlay original differs from sealed source');
    assert.equal(await digestFile(inside(prepared,arm.root+'/overlays/original/'+overlay.path)),overlay.originalSha256,'Overlay original bytes changed');assert.equal(await digestFile(inside(prepared,arm.root+'/overlays/executed/'+overlay.path)),overlay.executedSha256,'Overlay executed bytes changed');
   }
   const editorOverlays=overlays.filter(item=>item.kind==='authored-construction-policy'&&item.routeSubject==='editor');assert.equal(editorOverlays.length,1,'Exactly one editor policy overlay required');
   const editorOverlay=editorOverlays[0],descriptor=routeSubjects.find(item=>item.id==='editor');assert.equal(editorOverlay.path,descriptor.source);assert.equal(editorOverlay.policy,arm.policy);
   const original=await readFile(inside(prepared,arm.root+'/overlays/original/'+editorOverlay.path),'utf8'),applied=policyOverlay(original,descriptor,arm.policy,{reference:arm.id==='reference'});assert.equal(digest(applied.source),editorOverlay.executedSha256,'Editor policy overlay does not reproduce declared source');
   for(const kind of ['client','server']){const graph=receipt.graphs?.[kind];assert(graph?.path&&graph.sha256,'Missing '+kind+' module graph');await readReceipt(arm.root+'/'+graph.path,graph.sha256,arm.id+' '+kind+' graph');assert(Array.isArray(receipt.packedGraph?.[kind])&&receipt.packedGraph[kind].length,'Missing packed module graph');}
  }
  assert.deepEqual(actualReceipts.get('candidate').packages,actualReceipts.get('rollback').packages,'Candidate/rollback production archives differ');assert.deepEqual(actualReceipts.get('candidate').packedGraph,actualReceipts.get('rollback').packedGraph,'Candidate/rollback packed module graphs differ');
  assert.equal(preparation.rollback?.identicalProductionArchives,true);assert.equal(preparation.rollback?.identicalPackedModuleGraphs,true);assert.deepEqual(preparation.rollback?.candidates,['candidate','rollback']);
 };
 const verifyInstallation=async installation=>{
  assert(installation?.digest&&installation.packages?.length,'Missing executing acquisition package identity');assert.equal(process.version,preparation.runtime?.node?.version,'Node version differs from preparation');assert.equal(await digestFile(process.execPath),preparation.runtime?.node?.sha256,'Node bytes differ from preparation');
  assert.equal(installation.lockSha256,preparation.sources.candidate.rootLockSha256,'Acquisition lock differs from candidate source');
  const candidate=receipts.get('candidate'),driver=await readReceipt(candidate.ssr?.runtimeReceipt,candidate.ssr?.runtimeReceiptSha256,'Prepared acquisition runtime');assert.equal(driver.exactLockSha256,installation.lockSha256,'Fresh prepared driver lock mismatch');assert.equal(digest(driver.files),driver.sha256,'Fresh prepared runtime inventory mismatch');uniqueBindings(driver.files,'Fresh prepared runtime');
  for(const pkg of installation.packages){assert(pkg.path.startsWith('node_modules/'),'Driver package path must belong to installation');const prefix=pkg.path.slice('node_modules/'.length)+'/',files=driver.files.filter(file=>file.path.startsWith(prefix)).map(file=>({...file,path:file.path.slice(prefix.length)}));assert.equal(digest(files),pkg.sha256,'Executing driver bytes differ from fresh exact-lock prepared installation: '+pkg.name);}
 };
 await verify();
 return {preparation,arms,verify,verifyInstallation,receiptFor:arm=>receipts.get(typeof arm==='string'?arm:arm.id),identity:{path:prepared,sha256:digest(bytes),sources:preparation.sources,harness:preparation.harness,arms:arms.map(arm=>({...arm,receiptIdentity:receipts.get(arm.id)}))}};
}
export async function settle(page){await page.evaluate(async()=>{
 for(let pass=0;pass<10;pass++){
  const roots=[document],pending=[];while(roots.length){for(const element of roots.pop().querySelectorAll('*')){if(element.updateComplete)pending.push(element.updateComplete);if(element.shadowRoot)roots.push(element.shadowRoot);}}
  if((await Promise.all(pending)).every(value=>value!==false))break;
  if(pass===9)throw new Error('Lit descendants did not settle');
 }
 await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
});}
export async function waitUntilReady(page){
 await expect(page.locator('#rich-brief').getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-example-standalone')&&document.querySelector('#selection-toolbar')?.hasUpdated);
 await settle(page);
}
export async function selectText(page,text='Alpha beta',backwards=false){
 const editor=page.locator('#rich-brief'),textbox=editor.getByRole('textbox');
 await editor.evaluate((element,value)=>{element.value=value;element.focus();},text);await expect(editor).toHaveJSProperty('value',text);await textbox.scrollIntoViewIfNeeded();
 await textbox.evaluate((element,backward)=>{const node=element.querySelector('p')?.firstChild;if(!node)throw new Error('Missing real editor text');const length=node.textContent.length;document.getSelection().setBaseAndExtent(node,backward?length:0,node,backward?0:length);},backwards);
 await expect(editor).toHaveJSProperty('hasSelection',true);await expect(page.locator('#selection-toolbar .base')).toBeVisible();await settle(page);
}
export async function census(page){return page.evaluate(()=>{
 const count=root=>{let nodes=0;const visit=node=>{nodes++;for(const child of node.childNodes)visit(child);if(node.shadowRoot)visit(node.shadowRoot);};if(root)visit(root);return nodes;};
 const toolbar=document.querySelector('#selection-toolbar'),generated=toolbar?.shadowRoot?.querySelector('en-toolbar');
 return {routeNodes:count(document),toolbarNodes:count(toolbar),generatedNodes:count(generated),generatedPresent:!!generated,contentRendering:toolbar?.contentRendering??'baseline-eager'};
});}
export function routeEntry(receipt){
 const row=receipt.routes?.[route]??receipt.routes?.[route.slice(1)];
 assert(row?.entry&&Array.isArray(row.entry.assets),'Frozen docs receipt must provide actual route entry closure');
 const map=new Map(receipt.assets.map(asset=>[asset.path,asset]));
 const paths=[...new Set(row.entry.assets.map(asset=>typeof asset==='string'?asset:asset.path))];
 const gzipBytes=paths.reduce((sum,path)=>{const asset=map.get(path);assert(asset&&Number.isFinite(asset.gzipBytes),`Missing entry gzip receipt ${path}`);return sum+asset.gzipBytes;},0);
 return {assets:paths,gzipBytes,requests:paths.length};
}
export function observedScripts(resources,receipt,origin){
 const paths=[...new Set(resources.filter(resource=>new URL(resource.name).pathname.endsWith('.js')).map(resource=>{const url=new URL(resource.name);assert.equal(url.origin,origin,'Unexpected external executable resource');return decodeURIComponent(url.pathname.slice(1));}))];
 const map=new Map(receipt.assets.map(asset=>[asset.path,asset]));
 return {assets:paths,gzipBytes:paths.reduce((sum,path)=>{const asset=map.get(path);assert(asset&&Number.isFinite(asset.gzipBytes),`Missing observed JS gzip receipt ${path}`);return sum+asset.gzipBytes;},0),requests:paths.length,resources};
}
