import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {describe,pairedDifference} from '../../showcases/performance/src/analysis.mjs';
const base='artifacts/scoped-registry-production-v1',read=async p=>JSON.parse(await readFile(`${base}/${p}`));
const manifest=await read('campaign/manifest.json'),summary=await read('campaign/summary.json');
const rows=(await readFile(`${base}/campaign/samples.jsonl`,'utf8')).trim().split('\n').map(JSON.parse);
const key=r=>[r.kind,r.phase,r.browser,r.profile,r.block].join('/');
assert.equal(summary.passed,500);assert.equal(rows.length,500);assert.deepEqual(rows.map(key),manifest.jobs.map(key));assert.equal(new Set(rows.map(key)).size,500);assert.ok(rows.every(r=>r.status==='ok'&&!r.errors.length&&!r.failures.length));
const timing=[],retention=[];
const pairs=[[3,2],[3,1],[3,0],[2,1],[2,0],[1,0]];
for(const [browser,profile] of [['chromium','desktop'],['webkit','desktop'],['firefox','desktop'],['chromium','constrained']]){
 const groups=[0,1,2,3].map(phase=>rows.filter(r=>r.kind==='timing'&&r.phase===phase&&r.browser===browser&&r.profile===profile));groups.forEach(g=>assert.equal(g.length,30));
 for(const metric of Object.keys(groups[0][0].metrics)){
  const phases=groups.map(g=>describe(g.map(r=>r.metrics[metric]))),changes={};
  for(const [later,earlier]of pairs){const delta=pairedDifference(groups[later].map(r=>({block:r.block,value:r.metrics[metric]})),groups[earlier].map(r=>({block:r.block,value:r.metrics[metric]})));changes[`${later}-${earlier}`]={...delta,percent:phases[earlier].median?delta.difference/phases[earlier].median*100:null};}
  timing.push({browser,profile,metric,unit:metric.endsWith('Ms')?'ms':metric.endsWith('Requests')?'count':'bytes',phases,changes});
 }
}
const groups=[0,1,2,3].map(phase=>rows.filter(r=>r.kind==='retention'&&r.phase===phase));groups.forEach(g=>{assert.equal(g.length,5);g.forEach(r=>{assert.deepEqual(r.checkpoints.map(c=>c.cycle),[0,10,50,100]);assert.ok(r.checkpoints.every(c=>c.apps===1));});});
for(const cycle of [0,10,50,100,'10–100'])for(const metric of ['heapBytes','nodes','jsEventListeners','documents']){
 const extract=(r,c)=>{const p=r.checkpoints.find(p=>p.cycle===c);return metric==='heapBytes'?p.heapBytes:p.dom[metric];};
 const value=r=>cycle==='10–100'?extract(r,100)-extract(r,10):extract(r,cycle);
 const phases=groups.map(g=>describe(g.map(value))),changes={};
 for(const [later,earlier]of pairs){const difference=phases[later].median-phases[earlier].median;changes[`${later}-${earlier}`]={difference,percent:phases[earlier].median?difference/phases[earlier].median*100:null,ci95:null};}
 retention.push({browser:'chromium',profile:'desktop',cycle,metric,unit:metric==='heapBytes'?'bytes':'count',phases,changes});
}
const comparison={createdAt:new Date().toISOString(),methodology:'Actual full Vite production docs with build-time SSR and gzip HTTPS/HTTP2. All phases use global registration. Serial randomized complete blocks, 30 samples/configuration and five separate retention runs/phase. Timings include readiness frame opportunities, not INP. Paired-block percentile bootstrap, 2,000 resamples, seed 42, exploratory without multiple-comparison adjustment. Historical docs metadata/build repairs are disclosed in build receipts. Local workstation and emulated throttling, not field data.',summary,host:manifest.host,browsers:Object.fromEntries(rows.map(r=>[r.browser,r.browserVersion])),timing,retention};
await writeFile(`${base}/comparison.json`,JSON.stringify(comparison,null,2)+'\n');
console.log(JSON.stringify({timingRows:timing.length,retentionRows:retention.length,constrained:timing.filter(r=>r.profile==='constrained').map(r=>({metric:r.metric,phases:r.phases.map(p=>p.median),change:r.changes['3-2']})),retentionGrowth:retention.filter(r=>r.cycle==='10–100')},null,2));
