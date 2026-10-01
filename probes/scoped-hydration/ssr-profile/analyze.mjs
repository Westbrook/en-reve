import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='artifacts/scoped-registry-phase-5-ssr-investigation';
const data=JSON.parse(await readFile(`${base}/campaign-v1/samples.json`));
const median=a=>{const s=[...a].sort((a,b)=>a-b);return(s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2;};
const quantile=(a,p)=>{const s=[...a].sort((a,b)=>a-b);return s[Math.floor((s.length-1)*p)];};
const policies=['warm','isolated-api','fresh-profiled','prewarmed-single-use'];
let seed=90122;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const arms=Object.fromEntries(policies.map(policy=>[policy,data.samples.filter(s=>s.policy===policy).sort((a,b)=>a.block-b.block)]));
for(const samples of Object.values(arms)){
 assert.equal(samples.length,30);assert.deepEqual(samples.map(s=>s.block),Array.from({length:30},(_,i)=>i));
 for(const s of samples){assert.equal(s.bytes,169496);assert.equal(s.sha256,data.output.sha256);assert(s.requestMs>0);}
}
function difference(candidate,reference){
 const a=arms[candidate].map(s=>s.requestMs),b=arms[reference].map(s=>s.requestMs),boot=[];
 for(let n=0;n<5000;n++){const indexes=Array.from({length:30},()=>Math.floor(random()*30));boot.push(median(indexes.map(i=>a[i]))-median(indexes.map(i=>b[i])));}
 return {difference:median(a)-median(b),ci95:[quantile(boot,.025),quantile(boot,.975)]};
}
const summaries=policies.map(policy=>{
 const samples=arms[policy],metrics=Object.fromEntries(Object.keys(samples[0]).filter(k=>k.endsWith('Ms')).map(k=>[k,{median:median(samples.map(s=>s[k])),min:Math.min(...samples.map(s=>s[k])),max:Math.max(...samples.map(s=>s[k]))}]));
 return {policy,n:samples.length,metrics,versusApi:difference(policy,'isolated-api')};
});
const comparison={at:new Date().toISOString(),host:data.host,method:'30 randomized serial blocks, five excluded warmup blocks. Paired bootstrap of difference in medians, 5000 draws; exploratory interval. Fresh realms have warm filesystem caches, not OS cold-boot conditions. No outlier removal.',output:data.output,summaries,qualification:data.qualification,limits:data.notes};
await writeFile(`${base}/comparison.json`,JSON.stringify(comparison,null,2)+'\n');
console.log(JSON.stringify(summaries.map(s=>({policy:s.policy,request:s.metrics.requestMs,...s.versusApi})),null,2));
