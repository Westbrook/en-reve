import { mkdir, readFile, writeFile, copyFile, access, cp, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {execFileSync} from 'node:child_process';
import { lab, repo, plan } from './config.mjs';
import { node } from './execute.mjs';
const json=x=>JSON.stringify(x,null,2)+'\n';
export async function captureSource(directory) {
 const source={at:new Date().toISOString(),note:'Candidate package tarballs, resolved consumer lock and built asset fingerprints retain the actual measured bytes. Controls retain their inventory fingerprints.'};
 try{await access(resolve(directory,'.git'));}catch(error){if(error.code!=='ENOENT')throw error;return {...source,gitAvailable:false,note:source.note+' This portable source has no Git checkout; consult the transfer manifest for source identity.'};}
 const git=args=>execFileSync('git',args,{cwd:directory,encoding:'utf8',maxBuffer:64*1024*1024}).trim();
 let main=null;try{main=git(['rev-parse','--verify','main']);}catch{}
 return {...source,gitAvailable:true,commit:git(['rev-parse','HEAD']),main,status:git(['status','--porcelain']),runtimePackageChanges:git(['status','--porcelain','--','packages'])};
}
export async function runCampaign(ctx, {executeStage=node, inventoryPath=resolve(lab,'.cache/inventory.json')} = {}) {
  const stages=plan(ctx);
  // Refuse every collision before creating any campaign outputs or starting builds.
  for(const p of [ctx.directory,...(ctx.config.kind==='calendar'?[ctx.primary,ctx.lighthouse]:stages.filter(s=>s.run).map(s=>s.run)).map(id=>resolve(lab,'runs',id)),...(ctx.config.kind==='calendar'?ctx.variants.map(v=>resolve(lab,'.cache/variants',v.id)):ctx.config.kind==='current'?[resolve(lab,'.cache/variants',ctx.id+'-current')]:[])]) {
    try {await access(p);throw Error('Existing output; select a new campaign ID: '+p);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  const inventory=JSON.parse(await readFile(inventoryPath));
  for(const system of ctx.config.systems)if(!inventory.systems.some(s=>s.id===system))throw Error('Missing prepared system '+system+'; follow CAMPAIGNS.md');
  await mkdir(resolve(ctx.directory,'..'),{recursive:true});await mkdir(ctx.directory);
  await mkdir(resolve(ctx.directory,'logs'));
  const source=await captureSource(repo);
  await writeFile(resolve(ctx.directory,'source.json'),json(source),{flag:'wx'});
  const configuration=resolve(ctx.directory,'campaign.json');await writeFile(configuration,json(ctx),{flag:'wx'});
  await copyFile(inventoryPath,resolve(ctx.directory,'inventory.json'));
  for(const name of ['package-lock.json','profiles/profiles.json','registry/systems.json'])await copyFile(resolve(lab,name),resolve(ctx.directory,name.replaceAll('/','-')));
  await cp(resolve(lab,'campaigns'),resolve(ctx.directory,'harness/campaigns'),{recursive:true});
  await mkdir(resolve(ctx.directory,'harness/experiments'),{recursive:true});
  for(const name of ['build-current.mjs','build-calendar-variants.mjs','qualify-calendar-variants.mjs','run-calendar-variants.mjs','calendar-followup.mjs','web-awesome-metric-groups.mjs','pass2-metrics.mjs','dom-census.mjs'])await copyFile(resolve(lab,'experiments',name),resolve(ctx.directory,'harness/experiments',name));
  await mkdir(resolve(ctx.directory,'qualifications'));
  const state={id:ctx.id,startedAt:new Date().toISOString(),status:'running',configSha256:createHash('sha256').update(json(ctx)).digest('hex'),stages:[],runs:ctx.config.kind==='calendar'?[ctx.primary,ctx.lighthouse]:stages.filter(s=>s.run).map(s=>s.run)};
  const save=()=>writeFile(resolve(ctx.directory,'state.json'),json(state));await save();
  try {
    for(const step of stages){const record={...step,startedAt:new Date().toISOString(),status:'running'};state.stages.push(record);await save();
      await executeStage(step.script,step.args,{env:{...process.env,EN_PERF_CAMPAIGN:configuration},log:resolve(ctx.directory,'logs',step.stage+'.log')});for(const file of await readdir(resolve(lab,'reports'))){if(file.startsWith('functional-'+ctx.id+'-qualification-')&&file.endsWith('.json'))await copyFile(resolve(lab,'reports',file),resolve(ctx.directory,'qualifications',file));}
      record.status='complete';record.finishedAt=new Date().toISOString();await save();}
    if(ctx.config.kind!=='calendar')await executeStage('src/cli.mjs',['bundles','--systems',ctx.config.systems.join(','),'--output',resolve(ctx.directory,'bundles.json')]);
    state.status='complete';state.finishedAt=new Date().toISOString();await save();
    const {campaignReport}=await import('./report.mjs');await campaignReport(ctx.directory);
  } catch(error){state.status='failed';state.error=error.stack;state.finishedAt=new Date().toISOString();const failed=state.stages.at(-1);if(failed?.status==='running')Object.assign(failed,{status:'failed',finishedAt:state.finishedAt,error:error.message});await save();throw error;}
}
