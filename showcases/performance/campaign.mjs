#!/usr/bin/env node
// This entry point uses only Node built-ins until an installed lab is needed.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { lab,repo,context,plan } from './campaigns/config.mjs';
import { withMachineOwner } from '../../tooling/testing/machine-owner.mjs';
import { withExecutionOwner } from '../../tooling/testing/execution-owner.mjs';
const [command,...tokens]=process.argv.slice(2),args={};
for(let i=0;i<tokens.length;i+=2){if(!tokens[i].startsWith('--')||!tokens[i+1]||tokens[i+1].startsWith('--'))throw Error('Options require values');const key=tokens[i].slice(2);if(args[key])throw Error('Duplicate option '+key);args[key]=tokens[i+1];}
const allowed={plan:['config','id'],run:['config','id'],setup:['id'],report:['id'],export:['output','campaign','baseline'],restore:['bundle','output'],verify:['bundle'],doctor:[],certificate:[]};
if(command in allowed && Object.keys(args).some(k=>!allowed[command].includes(k)))throw Error('Unknown option');
const owned=work=>withMachineOwner(()=>withExecutionOwner(repo,work));
switch(command){
 case 'plan':case 'run':{
  if(!args.config||!args.id)throw Error('Provide --config and --id');const ctx=context(args.id,JSON.parse(await readFile(resolve(args.config),'utf8')));
  if(command==='plan')console.log(JSON.stringify({campaign:ctx,stages:plan(ctx)},null,2));
  else await owned(async()=>{const {runCampaign}=await import('./campaigns/run.mjs');await runCampaign(ctx)});break;
 }
 case 'setup':await owned(async()=>{const {setup}=await import('./campaigns/setup.mjs');await setup(args.id)});break;
 case 'report':{const {safeId}=await import('./campaigns/config.mjs');if(!safeId(args.id))throw Error('Provide --id');const {campaignReport}=await import('./campaigns/report.mjs');await campaignReport(resolve(lab,'reports/campaigns',args.id));break;}
 case 'export':case 'restore':case 'verify':{const {transfer}=await import('./campaigns/transfer.mjs');await transfer(command,args);break;}
 case 'certificate':await owned(async()=>{const {certificate}=await import('./campaigns/certificate.mjs');await certificate()});break;
 case 'doctor':{const {doctor}=await import('./campaigns/doctor.mjs');const result=await doctor();console.log(JSON.stringify(result,null,2));if(!result.ready)process.exitCode=1;break;}
 default:console.log('Portable performance campaigns\n  plan|run --config showcases/performance/campaigns/native.json --id UNIQUE\n  setup --id UNIQUE (fresh checkout only; installs, builds, qualifies)\n  doctor | certificate\n  report --id UNIQUE\n  export --output NEW_DIRECTORY [--campaign UNIQUE]\n  verify --bundle DIRECTORY\n  restore --bundle DIRECTORY --output NEW_DIRECTORY\nSee showcases/performance/CAMPAIGNS.md');if(command)process.exitCode=1;
}
