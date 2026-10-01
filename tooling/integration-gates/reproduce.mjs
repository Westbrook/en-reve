import {execFileSync} from 'node:child_process';
import {withExecutionOwner} from '../testing/execution-owner.mjs';
import {acquireResources} from './resources.mjs';
import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {git,hash,atomic,execute,source,filesBelow} from './runner.mjs';
const root=resolve(import.meta.dirname,'../..'),args=process.argv.slice(2);
if(!/^[0-9a-f]{40}$/.test(args[0]??''))throw Error('Usage: node tooling/integration-gates/reproduce.mjs <exact commit> [new output directory]');
const commit=args[0];git(root,'cat-file','-e',`${commit}^{commit}`);
const parent=join(root,'artifacts/cache/integration-reproduction');await mkdir(parent,{recursive:true});
const output=args[1]?resolve(args[1]):join(await mkdtemp(join(parent,'run-')),'evidence');await mkdir(output);
const receipt={schemaVersion:1,commit,tree:git(root,'rev-parse',`${commit}^{tree}`),runtime:{node:process.version,platform:process.platform,arch:process.arch},exitCode:1,status:'running',paths:[],limits:'Fresh local sparse checkouts; npm ci uses the lockfile. No metadata normalization, sorting or rewriting after generation.'};
const generated=['packages/elements/custom-elements.json','packages/elements/custom-elements.json.receipt.json','packages/elements/public-api.json','packages/elements/public-types.json','packages/elements/src/lazy-manifest.ts','tooling/customization/evidence/coverage.json','tooling/customization/evidence/coverage.md'];
let unlock;
try {
 const resources=await acquireResources(root);unlock=resources.release;
 const environment={...process.env,...resources.env};
 await withExecutionOwner(root,async ownership=>{
 receipt.executionOwnership=ownership;
 receipt.runtime.npm=execFileSync('npm',['--version'],{encoding:'utf8',env:environment}).trim();
 for(const name of ['clean-a','different-checkout-b']) {
  const directory=join(output,name);await mkdir(directory);const checkout=join(directory,'source');
  // Git's sparse checkout retains real commit/tree identity without copying frozen binary evidence.
  const commands=[['git','init','--quiet',checkout],['git','-C',checkout,'sparse-checkout','set','--no-cone','/*','!/artifacts/','!/showcases/'],['git','-C',checkout,'checkout','--detach',commit],['npm','ci','--ignore-scripts','--no-audit','--no-fund',...(process.env.EN_GATE_OFFLINE==='1'?['--offline']:[])],...['tokens','styles','primitives','elements'].map(n=>['npm','run','build','-w',`@en-reve/${n}`]),['npm','run','metadata'],['npm','run','metadata']];
  const record={path:name,commands:[],generations:[]};receipt.paths.push(record);
  for(const [index,command] of commands.entries()) {
   const log=`${name}/${index}.log`,cwd=index<3?root:checkout;
   const result=await execute(command,{cwd,env:environment,log:join(output,log)});
   record.commands.push({command:command.map(v=>v===root?'<source-repository>':v===checkout?`${name}/source`:v),...result,log});
   if(result.exitCode!==0){receipt.exitCode=Number.isInteger(result.exitCode)&&result.exitCode>0?result.exitCode:1;receipt.failure={category:result.error?.code==='ENOENT'?'environment':'unclassified',command:record.commands.at(-1),evidence:'Retained command result; inspect its log before classifying product, harness, environment or transient cause.'};throw Error(`${log}: command failed ${result.exitCode}`);}
   if(index===0)await writeFile(join(checkout,'.git/objects/info/alternates'),git(root,'rev-parse','--path-format=absolute','--git-path','objects')+'\n');
   if(index===2)record.source=await source(checkout);
   if(index===3){record.packages={};for(const file of ['package.json','node_modules/@playwright/test/package.json','node_modules/typescript/package.json','node_modules/vite/package.json']){const pkg=JSON.parse(await readFile(join(checkout,file),'utf8'));record.packages[pkg.name]=pkg.version;}record.packageLockSha256=hash(await readFile(join(checkout,'package-lock.json')));}
   if(index>=commands.length-2){const hashes={};for(const file of generated)hashes[file]=hash(await readFile(join(checkout,file)));record.generations.push(hashes);}
  }
  record.after=await source(checkout);record.builtAssets=[];for(const name of ['tokens','styles','primitives','elements'])record.builtAssets.push(...await filesBelow(checkout,join(checkout,'packages',name,'dist')));
  record.remotes=git(checkout,'remote','-v');if(record.remotes)throw Error('Reproduction checkout unexpectedly has a remote');
  record.cleanAfter=git(checkout,'status','--porcelain','--untracked-files=all')==='';
  if(!record.cleanAfter)throw Error(`${name}: generated metadata differs from exact source commit; inspect checkout diff`);
  if(JSON.stringify(record.generations[0])!==JSON.stringify(record.generations[1]))throw Error(`${name}: repeated generation drift`);
 }
 if(JSON.stringify(receipt.paths[0].generations[0])!==JSON.stringify(receipt.paths[1].generations[0]))throw Error('Metadata differs across clean checkout paths');
 receipt.status='passed';receipt.exitCode=0;
 // Keep hashes and untouched logs; only remove checkouts that this invocation created.
 for(const record of receipt.paths)await rm(join(output,record.path,'source'),{recursive:true});
 },{environment});
} catch(error){receipt.status='failed';receipt.error=String(error);receipt.exitCode=receipt.exitCode||1;}
finally{if(unlock){try{await unlock();receipt.resourceRelease={status:'passed'};}catch(error){receipt.resourceRelease={status:'failed',error:String(error)};receipt.status='failed';receipt.exitCode=receipt.exitCode||1;}}receipt.finishedAt=new Date().toISOString();await atomic(join(output,'receipt.json'),receipt);}
process.exitCode=receipt.exitCode;
console.log(`${receipt.status}: ${output}/receipt.json`);
