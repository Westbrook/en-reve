// Run only after the main pass-two queue has finished; preserve every v1 sample.
import { readFile,writeFile,copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { root,json,sha } from '../src/config.mjs';
const receipt=JSON.parse(await readFile(resolve(root,'reports/pass2-execution.json')));
if(!receipt.finishedAt)throw new Error('Finish the main serial campaign queue before changing the startup probe.');
await copyFile(resolve(root,'experiments/startup-v3.mjs'),resolve(root,'scenarios/startup.mjs'));
let runner=await readFile(resolve(root,'src/runner.mjs'),'utf8');
runner=runner.replace('import { startupInteraction }', 'import { startupInteraction, installStartupProbe }');
if(!runner.includes('await context.addInitScript(installStartupProbe)'))runner=runner.replace('  const page = await context.newPage();', '  if (suite === "startup") await context.addInitScript(installStartupProbe);\n  const page = await context.newPage();');
runner=runner.replace('One trusted click at first automation-observed visible Landscape control, before load/settling wait.', 'Animation-frame geometry probe and one trusted Landscape click before load/settling; probe elapsed time and dispatch overhead recorded.');
await writeFile(resolve(root,'src/runner.mjs'),runner);
const invalidation={at:new Date().toISOString(),run:'pass2-startup-v1',replacement:'pass2-startup-v3',affectedMetrics:['startupVisible','startupInput','startupResult','startupFrame'],reason:'Host-side locator visibility wait retries with 20/50/100/100/500ms backoff in pinned Playwright. Navigation-relative early-readiness comparisons inherit a library-dependent discovery delay. V1 is retained as a superseded automation pilot, excluded from the current startup tables. Trusted click correctness and click-relative timings are not retroactively called failed.',additionalSupersededQualification:{run:'pass2-startup-qualification-v2',successful:14,failed:2,reason:'Fluent WC layout moved between first observed geometry and dispatch; input landed on a badge. V3 refreshes coordinates immediately before its one click and verifies the composed-path target. No full v2 timing cohort was collected.'},replacementMethod:'Injected animation-frame visibility/geometry probe, fresh dispatch coordinates and one verified-target trusted click; reports observed geometry, probe elapsed time and protocol dispatch delay. No exact-minimum-readiness claim.'};
await writeFile(resolve(root,'reports/pass2-startup-superseded.json'),json(invalidation));
async function command(args){const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit'});child.on('error',reject);child.on('exit',done);});if(code!==0)throw new Error('Command failed: '+args.join(' '));}
await command([resolve(root,'experiments/calibrate-cdp-scope.mjs')]);
await command([resolve(root,'experiments/calibrate-startup.mjs')]);
await command([resolve(root,'experiments/calibrate-startup-discovery.mjs')]);
await command([resolve(root,'src/cli.mjs'),'run','--suite','startup','--samples','1','--profiles','desktop,mobile','--caches','cold','--id','pass2-startup-qualification-v3']);
const startedAt=new Date().toISOString();
await command([resolve(root,'src/cli.mjs'),'run','--suite','startup','--samples','10','--profiles','desktop,mobile','--caches','cold','--id','pass2-startup-v3']);
receipt.campaigns.push({suite:'startup',samples:'10',profiles:'desktop,mobile',caches:'cold',id:'pass2-startup-v3',startedAt,finishedAt:new Date().toISOString(),exitCode:0,replaces:'pass2-startup-v1'});receipt.finishedAt=new Date().toISOString();await writeFile(resolve(root,'reports/pass2-execution.json'),json(receipt));
