import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workloadManifest, maintainedFiles } from './workload.mjs';
import { comprehensiveGraph } from './comprehensive.mjs';
import { specializedPathways } from './specialized.mjs';
import { publicViews } from './public-views.mjs';
import { activationFor } from './command-activation.mjs';
import { root } from './pathways.mjs';
import { inventoryDigest } from '../evidence/setup.mjs';

/** Inventory text is evidence of activation, never executable shell input. */
async function documentedCommands(files){
 const recipes=[];
 for(const path of files.filter(path=>/\/(README|protocol)\.md$/.test(path))){
  const lines=(await readFile(resolve(root,path),'utf8')).split('\n');
  let fence=false;
  for(const [index,line] of lines.entries()){
   if(/^```/.test(line)){fence=!fence;continue;}
   if((fence||line.includes('`'))&&/\b(?:node|python3?|npm|npx|playwright|tsc)\s/.test(line))recipes.push({source:path,line:index+1,text:line,activation:activationFor(path),executionPolicy:'Reference only; bind the original documented inputs and fresh evidence before execution. Never evaluate extracted shell text.'});
  }
 }
 return recipes;
}
export async function executionManifest(){
 const inventory=await workloadManifest(),correctness=await comprehensiveGraph(),specialized=await specializedPathways();
 const tasks=[...correctness.tasks,...specialized.tasks],ids=tasks.map(task=>task.id);
 if(new Set(ids).size!==ids.length)throw new Error('Duplicate task identity across pathway families');
 const pathways={...correctness.pathways,...specialized.pathways};
 const sourceOwners=new Map();
 for(const task of tasks)for(const file of [...(task.assertionSources??[]),...(task.config?[task.config]:[]),...(task.command??[]).filter(arg=>typeof arg==='string'&&/^(?:apps|packages|tooling|probes|showcases)\/.+\.(?:[cm]?[jt]s|py)$/.test(arg))]){
  const owners=sourceOwners.get(file)??new Set();owners.add(task.id);sourceOwners.set(file,owners);
 }
 const delegated={
  'tooling/testing/measure.py':tasks.map(task=>task.id),
  'showcases/performance/experiments/receipt-output.mjs':tasks.filter(task=>task.environment?.EN_NATIVE_EXPERIMENT_OUTPUT).map(task=>task.id),
  'tooling/theme-candidates/verify-focus.mjs':['direct:candidate-import'],
  'tooling/theme-candidates/prepare.mjs':['prepare:candidates'],
  'apps/docs/scripts/prepare-docs.mjs':['build:docs'],
  'apps/docs/scripts/prepare-docs-producer.mjs':['build:docs'],
  'showcases/performance/experiments/dom-census.mjs':['native:dom-review','native:dom-ownership'],
  'showcases/performance/experiments/dom-ownership.mjs':['native:dom-ownership'],
  ...Object.fromEntries(['smoke','secondary','inspect','record-verification'].map(name=>[`showcases/tools/${name}.mjs`,['native:showcase-qualification',...(['smoke','secondary'].includes(name)?['native:functional']:[])]])),
  ...Object.entries({report:['run','qualify','report'],functional:['functional'],calibrate:['calibrate'],bundles:['bundles'],runner:['run','qualify'],lighthouse:['run'],regression:['check'], 'registry-runner':['registry']}).reduce((result,[name,commands])=>({...result,[`showcases/performance/src/${name}.mjs`]:tasks.filter(task=>task.command?.[1]==='showcases/performance/src/cli.mjs'&&commands.includes(task.command[2])).map(task=>task.id)}),{}),
 };
 const custom=inventory.custom.map(item=>{
  const owners=[...(sourceOwners.get(item.path)??[]),...(delegated[item.path]??[])];
  return {...item,owners:[...new Set(owners)],status:owners.length?'bound-command-or-imported-obligation':['historical-reproduction','historical-recipe','historical-helper'].includes(item.activation.tier)?'explicit-historical-reproduction':item.activation.tier==='manual-acceptance'?'manual-fixture-and-human-acceptance':'unresolved-explicit-command',reason:owners.length?'Original source remains selected by the identified task; imported helpers are not extra independent runs.':item.reason};
 });
 const unresolved=custom.filter(item=>item.status==='unresolved-explicit-command');
 const result={...inventory,schemaVersion:2,complete:false,graph:{tasks,pathways,manual:specialized.manual,requiredInputs:specialized.requiredInputs},publicViews:publicViews(correctness),custom,documentedCommands:await documentedCommands(await maintainedFiles()),unresolved,
  completenessPolicy:'The manifest inventories ordinary, specialized, manual and historical families. A selected correctness pass never implies complete-library or historical/manual acceptance. Unresolved activation/dependency edges remain visible; changed-only selection and completed-result reuse remain disabled.',
  tierOrder:['deterministic preparation','current-library correctness','current native qualification','serial diagnostic/instrument qualification','serial full campaigns and regression checks','separate actual manual acceptance'],
  nativeRegressionProtocolSources:['showcases/performance/ci/lane-plan.mjs','showcases/performance/ci/run-lane.mjs'],
 };
 return {...result,digest:inventoryDigest(result)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await executionManifest(),null,2));
