/** Candidate-bound verification; creates evidence, never publishes or approves. */
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceIdentity} from './source-identity.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--skip-build'))throw new Error('Usage: npm run test:release -- [--skip-build]');
const output=resolve(process.env.EN_RELEASE_TEST_OUTPUT_DIR??resolve(root,'node_modules/.cache/release-verification'));
await mkdir(output,{recursive:true});
const node=process.execPath,npm=process.platform==='win32'?'npm.cmd':'npm';
const env={...process.env,EN_SIZE_TEST_PORT:process.env.EN_SIZE_TEST_PORT??'47829',EN_SIZE_TEST_OUTPUT:resolve(output,'geometry'),EN_COMMANDS_TEST_PORT:process.env.EN_COMMANDS_TEST_PORT??'47830',EN_COMMANDS_TEST_OUTPUT_DIR:resolve(output,'commands')};
const sha=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const results=[];
const commandStarted=performance.now();
async function run(id,command,arguments_){
 console.log(`\nRelease verification: ${id}`);let log='';const startedAt=new Date().toISOString();const monotonicStart=performance.now();
 const child=spawn(command,arguments_,{cwd:root,env,stdio:['ignore','pipe','pipe']});
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log+=chunk;process.stdout.write(chunk);});
 const exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>resolve(code??`signal:${signal}`));});
 await writeFile(resolve(output,`${id}.log`),log);
 results.push({id,command,args:arguments_,startedAt,finishedAt:new Date().toISOString(),wallMs:performance.now()-monotonicStart,exitCode,logDigest:sha(log)});
 await writeFile(resolve(output,'verification.json'),JSON.stringify({status:exitCode===0?'running':'failed',candidate,wallMs:performance.now()-commandStarted,results},null,2)+'\n');
 if(exitCode!==0)throw new Error(`${id} failed; see ${output}/${id}.log`);
}
// Build regenerates source-bound metadata. Bind the verification only afterward.
let candidate;
if(!args.includes('--skip-build'))await run('build',npm,['run','build']);
candidate=await sourceIdentity(root);
await run('api',npm,['run','test:api']);
await run('transactions-unit',node,['--test','packages/primitives/tests/events.test.mjs','packages/primitives/tests/token-document.test.ts','probes/api-forms/metadata.test.mjs']);
await run('customization',npm,['run','check:customization']);
await run('geometry',node,['node_modules/@playwright/test/cli.js','test','--config','packages/elements/src/internal/tests/playwright.config.ts']);
await run('commands',node,['node_modules/@playwright/test/cli.js','test','--config','packages/elements/src/commands/tests/playwright.config.ts']);
const after=await sourceIdentity(root);
if(after.sourceDigest!==candidate.sourceDigest||after.head!==candidate.head)throw new Error('Candidate source changed during verification; rerun on one stable candidate.');
const artifacts=Object.fromEntries(await Promise.all(['custom-elements.json','custom-elements.json.receipt.json','public-types.json','public-api.json'].map(async name=>[name,sha(await readFile(resolve(root,'packages/elements',name)))])));
await writeFile(resolve(output,'verification.json'),JSON.stringify({status:'passed',candidate,artifacts,wallMs:performance.now()-commandStarted,results,limits:['Named browser states and installed engines; not physical-device, IME or assistive-technology acceptance.','Theme migration additionally requires npm run test:theme before package release.','This command never publishes, bumps a version or acknowledges review.']},null,2)+'\n');
console.log(`Release verification passed: ${candidate.sourceDigest}. Evidence: ${output}`);
