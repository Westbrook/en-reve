import {calendarContext} from '../campaigns/config.mjs';
const campaignContext=calendarContext();
const campaignOutput=campaignContext?.directory;
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,appendFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';import os from 'node:os';import {build} from 'esbuild';
import {root,registry,profiles,json,sha,rng,shuffle} from '../src/config.mjs';
import {sample,labIdentity} from '../src/runner.mjs';import {startServers} from '../src/server.mjs';import {exclusiveBrowserWork} from '../src/lock.mjs';
const id=process.argv[2]||'calendar-variants-v1',pilot=process.argv.includes('--pilot');
const builds=JSON.parse(await readFile(resolve(campaignOutput || resolve(root,'reports/calendar-variants'),'builds.json')));
const qualification=JSON.parse(await readFile(resolve(campaignOutput || resolve(root,'reports/calendar-variants'),'qualification.json')));assert(qualification.passed);
const variants=builds.variants;if(campaignContext){for(const v of variants)assert(qualification.builds?.some(b=>b.id===v.id&&b.fingerprint===v.fingerprint),'Qualification does not match exact build');}for(const v of variants){for(const a of v.assets)assert.equal(sha(await readFile(resolve(root,'.cache/variants',v.id,a.path))),a.sha256);}
const dir=resolve(root,'runs',id);await mkdir(dir,{recursive:!campaignContext});
const random=rng(campaignContext?.config.seed ?? 20260924),jobs=[];let index=0;
// Interleave policies within every profile/cache/block. A fresh browser per sample.
const lanes=pilot?[{suite:'calendar',profile:'mobile',cache:'cold',n:1}]:[
 ...(campaignContext?.config.profiles || ['desktop','mobile']).flatMap(profile=>(campaignContext?.config.caches || ['cold','warm']).map(cache=>({suite:'load',profile,cache,n:campaignContext?.config.samples ?? 10}))),
 ...(campaignContext?.config.profiles || ['desktop','mobile']).flatMap(profile=>['startup','interactions'].map(suite=>({suite,profile,cache:'cold',n:campaignContext?.config.samples ?? 10}))),
 ...(campaignContext?.config.profiles || ['desktop','mobile']).map(profile=>({suite:'calendar',profile,cache:'cold',n:profile==='mobile'?(campaignContext?.config.calendarSamples ?? 30):(campaignContext?.config.samples ?? 10)})),
 {suite:'calendar',profile:'mobile',cache:'cold',n:campaignContext?.config.preparedSamples ?? 10,preparation:'ready',only:campaignContext?.variants.find(v=>v.policy==='calendar-split').id || 'calendar-split'},
 {suite:'calendar',profile:'mobile',cache:'cold',n:campaignContext?.config.preparedSamples ?? 10,preparation:'pending',only:campaignContext?.variants.find(v=>v.policy==='calendar-split').id || 'calendar-split'},
 {suite:'memory',profile:'desktop',cache:'cold',n:campaignContext?.config.memorySamples ?? 1},
];
for(const lane of lanes)for(let block=0;block<lane.n;block++)for(const v of shuffle(variants.filter(v=>!lane.only||v.id===lane.only),random))jobs.push({...lane,system:'en-reve',variant:v.id,block,id:String(++index).padStart(5,'0'),instrument:lane.suite!=='memory'});
const manifest={campaign:campaignContext,id,createdAt:new Date().toISOString(),jobs,variants,qualification,profiles,host:{cpu:os.cpus()[0].model,platform:os.platform(),release:os.release()},harnessSha256:await labIdentity(),methodology:campaignContext ? 'Serial fresh Chromium processes; policies randomized within matched profile/cache/replicate blocks. Exact counts are in jobs/config. Calendar Enter to observed focus; rAF is a frame opportunity, not proof of paint. Prepared work reported separately. Exploratory workstation evidence.' : 'Interleaved within profile/cache/block; fresh Chromium process per sample. Same frozen main packages and 16 cards. Primary load/early input/settled journeys remain separate. Calendar keyboard timings start at trusted Enter, end at observed focused date and next animation-frame opportunity (not a paint guarantee); includes no speculative preparation unless named. Desktop n10, mobile unprepared calendar n30, prepared n10 exploratory. Memory is one session per policy, 0/10 calendar cycles plus standard journey checkpoints; no forced GC. No peer-library rerun in this policy experiment.'};
await writeFile(resolve(dir,'manifest.json'),json(manifest),{flag:'wx'});
await build({entryPoints:[resolve(root,'src/collector.js')],outfile:resolve(dir,'collector.js'),bundle:true,format:'iife',platform:'browser',minify:true});
for(const folder of ['src','scenarios','profiles','registry'])await cp(resolve(root,folder),resolve(dir,'harness',folder),{recursive:true});
await cp(resolve(root,'experiments/run-calendar-variants.mjs'),resolve(dir,'run-calendar-variants.mjs'));
await exclusiveBrowserWork(async()=>{
 for(const job of jobs){const stop=await startServers({systems:registry.filter(s=>s.id==='en-reve'),variant:job.variant,isolated:job.suite==='memory'});
  try{const options={suite:job.suite,variant:job.variant,calendarWorkload:job.suite==='calendar'||job.suite==='memory',preparation:job.preparation||'none',checkpoints:'0',calendarCycles:job.suite==='memory'?8:0};const result=await sample(job,options,dir);await appendFile(resolve(dir,'samples.jsonl'),JSON.stringify(result)+'\n');console.log(job.id+'/'+jobs.length,job.suite,job.variant,job.profile,job.cache,result.status,result.calendar?.first.inputToFocus??result.metrics?.lcp??'',result.errors?.[0]?.message??'');
   if(pilot&&result.status!=='ok')throw Error('Pilot failed; retained evidence');
  }finally{await stop()}
 }
 const samples=(await readFile(resolve(dir,'samples.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);await writeFile(resolve(dir,'completion.json'),json({finishedAt:new Date().toISOString(),planned:jobs.length,recorded:samples.length,successful:samples.filter(s=>s.status==='ok').length,failed:samples.filter(s=>s.status!=='ok').length}));
});

if(campaignContext){const completion=JSON.parse(await readFile(resolve(dir,'completion.json')));assert.equal(completion.failed,0,'Failed samples retained; use a new campaign ID after investigating');}
