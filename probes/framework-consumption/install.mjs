import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundedMap } from '../../tooling/testing/bounded.mjs';
import { atomicJSON } from '../../tooling/evidence/setup.mjs';
const root = fileURLToPath(new URL('.', import.meta.url));
const workers=Number(process.env.EN_TEST_WORKERS??3),results=[],started=performance.now();
async function install(name) {
 const cwd=name?resolve(root,'environments',name):root;
 const args=[existsSync(resolve(cwd,'package-lock.json'))?'ci':'install','--ignore-scripts','--no-audit','--no-fund','--workspaces=false'];
 const start=performance.now();
 const exitCode=await new Promise((resolve,reject)=>{
  const child=spawn('npm',args,{cwd,stdio:'inherit'});child.once('error',reject);child.once('exit',(code,signal)=>resolve(code??`signal:${signal}`));
 });
 results.push({name:name||'matrix-builder',cwd,command:['npm',...args],wallMs:performance.now()-start,exitCode});
 if(exitCode!==0)throw new Error(`Install ${name}: ${exitCode}`);
}
let status='failed';
try {
 // The shared builder is a prerequisite, then each framework owns a distinct lock and node_modules.
 await install('');await boundedMap(['react19','react18','vue3','vue2','svelte5','svelte4'],workers,install);status='passed';
} finally {
 await atomicJSON(resolve(process.env.EN_FRAMEWORK_INSTALL_RECEIPT??resolve(root,'node_modules/.cache/install-receipt.json')),{schemaVersion:1,status,workers,wallMs:performance.now()-started,results});
}
