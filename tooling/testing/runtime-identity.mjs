import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, basename, resolve } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { release } from 'node:os';
import { contentInventory, inventoryDigest } from '../evidence/setup.mjs';

/** Hash actual local browser distributions once per run, including WebKit libraries and Chromium's headless shell. */
export async function executionRuntimeIdentity(root, configurations) {
 const installations=new Map(),externalExecutables=new Set();
 for(const {config,discovery} of configurations) {
  const require=createRequire(resolve(root,config));
  // Resolve through the test owner's dependencies without loading its singleton.
  // Isolated installations may carry different playwright/core versions; a core
  // resolved directly from the configuration could select a hoisted decoy.
  const testRequire=createRequire(require.resolve('@playwright/test'));
  const playwrightRequire=createRequire(testRequire.resolve('playwright'));
  const entry=playwrightRequire.resolve('playwright-core');
  const loaded=await import(pathToFileURL(entry));
  const runner=loaded.default??loaded;
  const coreRoot=dirname(playwrightRequire.resolve('playwright-core/package.json'));
  const manifest=JSON.parse(await readFile(resolve(coreRoot,'browsers.json'),'utf8'));
  for(const project of discovery.projects) {
   const use=project.use??{};
   if(use.connectOptions)throw new Error('Remote browser binary identity requires an explicit external attestation: '+config);
   if(use.channel)throw new Error('Installed system browser channels require an explicit executable identity: '+config);
   if(use.launchOptions?.executablePath)externalExecutables.add(resolve(root,use.launchOptions.executablePath));
   const browser=runner[use.browserName??'chromium'];
   if(!browser)throw new Error('Unknown browser engine: '+config);
   let directory=dirname(browser.executablePath());
   while(dirname(directory)!==directory&&!/^(chromium|firefox|webkit)(?:_[a-z_]+)?-\d+$/.test(basename(directory)))directory=dirname(directory);
   if(dirname(directory)===directory)throw new Error('Cannot bind browser executable to its installed distribution: '+config);
   const cache=dirname(directory);
   // Manifest names/revisions bind supported alternatives; include matching installed distributions.
   for(const entry of await readdir(cache,{withFileTypes:true}))if(entry.isDirectory()&&manifest.browsers.some(browser=>{
    const prefix=browser.name.replaceAll('-','_')+'-';
    return entry.name.startsWith(prefix)&&[browser.revision,...Object.values(browser.revisionOverrides??{})].some(revision=>entry.name===prefix+revision);
   }))installations.set(resolve(cache,entry.name),true);
   installations.set(directory,true);
  }
 }
 const files=await contentInventory(root,[process.execPath,...installations.keys(),...externalExecutables],undefined,true,{includeModes:true});
 return {node:process.version,platform:process.platform,arch:process.arch,osRelease:release(),files,digest:inventoryDigest(files),policy:'Locally resolved browser installations and executable bytes; no inference from package version alone.'};
}
