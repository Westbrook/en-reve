import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import assert from 'node:assert/strict';
const base=resolve('artifacts/scoped-registry-phase-5/production'),run=process.argv[2]??'campaign-v1';
const samples=(await readFile(resolve(base,run,'samples.jsonl'),'utf8')).trim().split('\n').map(JSON.parse),manifest=JSON.parse(await readFile(resolve(base,run,'manifest.json'))),summary=JSON.parse(await readFile(resolve(base,run,'summary.json')));
assert.equal(summary.failed,0);assert.equal(summary.timing,540);assert.equal(summary.retention,15);
const policies=['eager','prepared','cold'],median=a=>{a=[...a].sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null;};
const stats=a=>({n:a.length,median:median(a),min:a.length?Math.min(...a):null,max:a.length?Math.max(...a):null});
let seed=42;function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
function change(a,b,paired=true,interval=true){const am=median(a),bm=median(b),difference=am===null||bm===null?null:bm-am;let ci95=null;if(interval&&a.length&&b.length){const draws=[];for(let i=0;i<2000;i++){const indexes=Array.from({length:a.length},()=>Math.floor(random()*a.length)),as=indexes.map(x=>a[x]),bs=paired?indexes.map(x=>b[x]):Array.from({length:b.length},()=>b[Math.floor(random()*b.length)]);draws.push(median(bs)-median(as));}draws.sort((a,b)=>a-b);ci95=[draws[50],draws[1949]];}return {difference,percent:am?difference/am*100:null,ci95};}
function row(fields,values,interval=true){return {...fields,arms:values.map(stats),changes:{'prepared-eager':change(values[0],values[1],true,interval),'cold-eager':change(values[0],values[2],true,interval),'cold-prepared':change(values[1],values[2],true,interval)}};}
const timing=[];const keys=[...new Set(samples.filter(s=>s.kind==='timing').map(s=>[s.browser,s.profile,s.input].join('|')))];
for(const key of keys){const [browser,profile,input]=key.split('|'),groups=policies.map(policy=>samples.filter(s=>s.kind==='timing'&&s.policy===policy&&s.browser===browser&&s.profile===profile&&s.input===input).sort((a,b)=>a.block-b.block));for(const group of groups)assert.equal(group.length,30);
 for(const metric of Object.keys(groups[0][0].metrics)){const values=groups.map(g=>g.map(s=>s.metrics[metric]));if(values.every(v=>v.every(x=>x===null)))continue;const indexes=values[0].map((_,i)=>i).filter(i=>values.every(v=>Number.isFinite(v[i])));if(!indexes.length)continue;
 timing.push(row({browser,profile,input,metric,unit:/Bytes$/.test(metric)?'bytes':/Ms$/.test(metric)?'ms':metric==='cls'?'score':'count',pairedSamples:indexes.length},values.map(v=>indexes.map(i=>v[i]))));
 }}
const retention=[];for(const cycle of [0,10,50,100,'10–100'])for(const metric of ['heapBytes','nodes','jsEventListeners','documents','liveNodes','inertNodes']){
 const value=c=>metric==='heapBytes'?c.heapBytes:metric in c.dom?c.dom[metric]:c.snapshot[metric];
 const values=policies.map(policy=>samples.filter(s=>s.kind==='retention'&&s.policy===policy).sort((a,b)=>a.block-b.block).map(s=>typeof cycle==='number'?value(s.checkpoints.find(c=>c.cycle===cycle)):value(s.checkpoints.find(c=>c.cycle===100))-value(s.checkpoints.find(c=>c.cycle===10))));for(const v of values)assert.equal(v.length,5);
 retention.push(row({browser:'chromium',profile:'desktop',input:'lifecycle',cycle,metric,unit:metric==='heapBytes'?'bytes':'count'},values,false));
}
const server=await Promise.all(['phase4','phase5'].map(async phase=>{const data=JSON.parse(await readFile(resolve(base,phase+'-server-cost.json')));assert.equal(data.samples.length,30);return data;}));
const costs=server.map(s=>s.samples.map(x=>x.durationMs));
const result={at:new Date().toISOString(),summary,host:manifest.host,browsers:Object.fromEntries(samples.map(s=>[s.browser,s.browserVersion])),methodology:'Matched packed SSR workload, 30 randomized blocks per cell. Exploratory paired median bootstrap, 2,000 resamples, seed 42; no multiplicity correction or outlier removal. Five independent retention runs per policy; no retention confidence intervals. Server costs are serial unpaired samples and report unpaired bootstrap intervals.',policies,timing,retention,server:{arms:costs.map(stats),change:change(costs[0],costs[1],false),htmlBytes:server.map(s=>stats(s.samples.map(x=>x.bytes)))}};
await writeFile(resolve(base,'comparison.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({rows:timing.length,retentionRows:retention.length,server:result.server}));
