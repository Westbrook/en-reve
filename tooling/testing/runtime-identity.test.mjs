import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { executionRuntimeIdentity } from './runtime-identity.mjs';
import { browserProductProjects } from './browser-products.mjs';

test('runtime identity follows two isolated test owners without loading either test singleton', async () => {
 const root=await realpath(await mkdtemp(resolve(tmpdir(),'en-runtime-owners-')));
 const put=async(path,value)=>{await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,value);};
 const configurations=[];
 try {
  for(const [owner,revision] of [['root-owner','101'],['reader-owner','202']]) {
   const ownerRoot=resolve(root,owner),modules=resolve(ownerRoot,'node_modules');
   const testRoot=resolve(modules,'@playwright/test');
   const playwrightRoot=resolve(testRoot,'node_modules/playwright');
   const coreRoot=resolve(playwrightRoot,'node_modules/playwright-core');
   // Nested packages deliberately differ from owner-level decoys. Resolution
   // must follow test -> playwright -> core, not configuration -> core.
   for(const path of [testRoot,playwrightRoot,coreRoot,resolve(modules,'playwright'),resolve(modules,'playwright-core')])
    await put(resolve(path,'package.json'),JSON.stringify({name:path.split('/').at(-1),main:'index.cjs'}));
   const forbidden="throw new Error('A test singleton or hoisted decoy was loaded');\n";
   for(const path of [testRoot,playwrightRoot,resolve(modules,'playwright'),resolve(modules,'playwright-core')])
    await put(resolve(path,'index.cjs'),forbidden);
   const cache=resolve(root,'browsers');
   const engines=['chromium','firefox','webkit'];
   const api=Object.fromEntries(engines.map(engine=>[engine,resolve(cache,engine+'-'+revision,'browser')]));
   await put(resolve(coreRoot,'index.cjs'),'const paths='+JSON.stringify(api)+'; module.exports=Object.fromEntries(Object.entries(paths).map(([key,path])=>[key,{executablePath:()=>path}]));\n');
   await put(resolve(coreRoot,'browsers.json'),JSON.stringify({browsers:[...engines,'chromium-headless-shell'].map(name=>({name,revision}))}));
   for(const engine of [...engines,'chromium_headless_shell'])
    await put(resolve(cache,engine+'-'+revision,'browser'),owner+' '+engine);
   configurations.push({config:owner+'/playwright.config.mjs',discovery:{projects:engines.map(browserName=>({use:{browserName}}))}});
  }
  const initial=await executionRuntimeIdentity(root,configurations);
  for(const revision of ['101','202'])for(const engine of ['chromium','firefox','webkit','chromium_headless_shell'])
   assert(initial.files['browsers/'+engine+'-'+revision+'/browser'],engine+' '+revision+' distribution must be bound');
  const again=await executionRuntimeIdentity(root,[...configurations].reverse());
  assert.deepEqual(again,initial,'owner traversal order must not affect canonical identity');
  await put(resolve(root,'browsers/webkit-202/browser'),'changed isolated browser');
  const changed=await executionRuntimeIdentity(root,configurations);
  assert.notEqual(changed.digest,initial.digest,'isolated browser mutations must invalidate identity');
  const distribution=resolve(root,'Installed Product.app');
  const executable=resolve(distribution,'Contents/MacOS/browser');
  const library=resolve(distribution,'Contents/Frameworks/runtime.dylib');
  await put(executable,'product executable'); await put(library,'product runtime');
  const manifest=resolve(root,'products.json');
  const product={name:'product-example',product:'Example Browser',version:'154.0.1.2',
   executablePath:executable,distributionPath:distribution,headless:true};
  const configure=async(products)=>{await put(manifest,JSON.stringify({schemaVersion:1,products}));return browserProductProjects(manifest);};
  const projects=await configure([product]);
  const external=[{...configurations[0],discovery:{projects}}];
  const beforeProduct=await executionRuntimeIdentity(root,external);
  assert(beforeProduct.files['Installed Product.app/Contents/Frameworks/runtime.dylib']);
  assert(!Object.keys(beforeProduct.files).some(path=>path.startsWith('browsers/')),'Product identity must not stand in for a cached engine');
  await put(library,'updated product runtime');
  assert.notEqual((await executionRuntimeIdentity(root,external)).digest,beforeProduct.digest,'Runtime library update must invalidate the product identity');
  await assert.rejects(executionRuntimeIdentity(root,[{...external[0],discovery:{projects:[{...projects[0],use:{...projects[0].use,headless:false}}]}}]),/does not match/);
  for(const invalid of [[product,product],[{...product,headless:undefined}],[{...product,distributionPath:executable}],[{...product,executablePath:resolve(root,'browsers/chromium-101/browser')}],[]])
   await assert.rejects(configure(invalid));
  assert.deepEqual(browserProductProjects(''),[],'Ordinary runs do not add product projects');
  for(const [use,message] of [[{connectOptions:{wsEndpoint:'ws://example.invalid'}},/Remote browser/],[{channel:'chrome'},/system browser/],[{browserName:'unknown'},/Unknown browser/]])
   await assert.rejects(executionRuntimeIdentity(root,[{...configurations[0],discovery:{projects:[{use}]}}]),message);
 } finally {await rm(root,{recursive:true,force:true});}
});
