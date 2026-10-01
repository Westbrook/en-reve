import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,mkdtemp,readFile} from 'node:fs/promises';
import {catalog,selection} from './catalog.mjs';
import {git,runStages} from './runner.mjs';
export function parseArgs(args) {
const options={mode:'smoke',only:[]},seen=new Set();
for(let i=0;i<args.length;i++){
 const arg=args[i];if(arg==='--list'){options.list=true;continue;}
 if(!['--mode','--stage','--commit','--base','--output','--skip'].includes(arg)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Usage: node tooling/integration-gates/run.mjs [--mode smoke|integration] [--stage ID|GROUP] [--base REF] [--commit SHA] [--output NEW-DIRECTORY] [--skip ID] [--list]');
 if(!['--stage','--skip'].includes(arg)){if(seen.has(arg))throw Error(`Repeated option ${arg}`);seen.add(arg);}
 const value=args[++i];if(arg==='--stage')options.only.push(value);else if(arg==='--skip')(options.skip??=[]).push(value);else options[arg.slice(2)]=value;
}
if(!['smoke','integration'].includes(options.mode))throw Error('Unknown selection mode');
return options;
}
export async function main(args=process.argv.slice(2)) {
const options=parseArgs(args);
const root=resolve(import.meta.dirname,'../..'),head=git(root,'rev-parse','HEAD');
if(options.mode==='integration'&&options.only.length)throw Error('Integration requires its complete catalog; use smoke --stage for a partial composable check');
if(options.mode==='integration'&&!options.commit)throw Error('Integration requires --commit <exact 40-character HEAD SHA>');
if(options.commit && (!/^[0-9a-f]{40}$/.test(options.commit)||head!==options.commit))throw Error('Requested exact commit differs from HEAD');
const dirty=git(root,'status','--porcelain','--untracked-files=all');
if(options.commit&&dirty)throw Error('Exact-commit runs require a clean checkout (including untracked non-ignored files)');
const changed=options.base?git(root,'diff','--name-only',options.base,head).split('\n'):git(root,'diff','--name-only','HEAD').split('\n');
if(!options.commit){
 if(options.base)changed.push(...git(root,'diff','--name-only','HEAD').split('\n'));
 changed.push(...git(root,'ls-files','--others','--exclude-standard').split('\n'));
}
// No change provenance means conservative source selection, never an empty smoke.
if(!changed.filter(Boolean).length)changed.push('unknown');
const stages=selection(catalog(root),{...options,changed:changed.filter(Boolean)});
for(const id of options.skip??[]){const stage=stages.find(s=>s.id===id);if(!stage)throw Error(`Unknown skipped stage ${id}`);stage.requestedSkip=true;}
if(options.list){console.log(JSON.stringify({mode:options.mode,source:{commit:head,tree:git(root,'rev-parse','HEAD^{tree}'),worktreeStatus:dirty},changed:[...new Set(changed.filter(Boolean))],stages},null,2));return 0;}
const parent=join(root,'artifacts/cache/integration-gates');await mkdir(parent,{recursive:true});
const container=options.output?null:await mkdtemp(join(parent,`${options.mode}-`));
const output=options.output?resolve(options.output):join(container,'run');
const receipt=await runStages({root,output,stages,metadata:{selection:{mode:options.mode,base:options.base??null,changed,explicitStages:options.only},exactCommit:options.commit??null}});
console.log(`${receipt.status}: ${output}/receipt.json`);return receipt.exitCode;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)process.exitCode=await main();
