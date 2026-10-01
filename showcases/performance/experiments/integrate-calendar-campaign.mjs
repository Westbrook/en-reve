import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {profileSummary} from './integrate-current-campaign.mjs';
import {lab,safeId} from '../campaigns/config.mjs';
const cell=x=>String(x??'—').replaceAll('|','\\|').replaceAll('\n',' ');
const table=t=>[t.headers,t.headers.map(()=>'---'),...t.rows].map(r=>'| '+r.map(cell).join(' | ')+' |').join('\n');
const readableTitle=title=>{
 const [suite,group,profile,cache,preparation,instrument]=title.split(' · ');if(!profile)return title;
 const labels={loading:'loading',lcp:'LCP attribution',transfer:'response transfer',thread:'main-thread work',startup:'startup usability',interactions:'interaction summary',lighthouse:'Lighthouse audits'};
 return `${profile} ${cache} ${labels[group]||group.replaceAll('-',' ')}${preparation&&preparation!=='none'?' · '+preparation+' preparation':''}${instrument==='uninstrumented'?' · without observer':''}`;
};
export function integrateCalendarCampaign(markdown,{id,sourceCommit,tables,referenceCampaign,config,profiles,primaryDate='—'}){
 assert(safeId(id)&&safeId(referenceCampaign));assert(config&&Number.isInteger(config.samples));assert(/^[a-f0-9]{7,40}$/.test(sourceCommit));
 const begin='<!-- BEGIN LATEST CALENDAR -->',end='<!-- END LATEST CALENDAR -->';
 const short=sourceCommit.slice(0,8),name=value=>value.startsWith('En Reve · ')?`En Reve ${short} · ${value.slice('En Reve · '.length)}`:value;
 const selected=tables.filter(t=>!['First reference comparison','Metric availability'].includes(t.title)).map(t=>t.title==='Paired change relative to eager'&&!t.headers.includes('Run ID')?{...t,headers:[t.headers[0],'Run ID','Date (UTC)',...t.headers.slice(1)],rows:t.rows.map(r=>[r[0],id+'-primary',primaryDate,...r.slice(1)])}:t);
 const content=selected.map(t=>({ ...t,title:readableTitle(t.title),headers:t.headers.map(h=>h==='semanticMs ms'?'Result ms':h==='frameOpportunityMs ms'?'Frame opportunity ms':h),rows:t.rows.map(r=>r.map((value,i)=>t.headers[i]==='Implementation'?name(value):value))}));
 const note=`Latest calendar policies use the same **main ${short}** packages as [the current-source campaign](#latest-main-refresh), with independently dated measurements below. The original calendar results remain historical.\n\n`;
 markdown=markdown.replace(new RegExp(begin+'[\\s\\S]*?'+end+'\\n?'),'');
 markdown=markdown.replace(/^Latest calendar policies use[^\n]*\n\n/m,'');
 markdown=markdown.replace('## Calendar delivery variants\n','## Calendar delivery variants\n\n'+note+'[Open the refreshed calendar comparison](#latest-calendar-variants).\n');
 // Avoid accumulating the same navigation link on regeneration.
 markdown=markdown.replace(/(\[Open the refreshed calendar comparison\]\(#latest-calendar-variants\)\.\n)(?:\s*\1)+/g,'$1');
 const section=`## Latest calendar variants\n\nEager, deferred construction, and deferred code plus construction are built from the exact archived consumer of \`${referenceCampaign}\` (source \`${sourceCommit}\`). The eager artifact is copied byte-for-byte; deferred/split variants use the same lockfile and package tarballs. Policies are randomized within matched profile/cache/replicate blocks. Paired deltas here compare policies within this campaign only. Earlier dates and peer-library acquisitions are not paired with it.\n\n${profileSummary(profiles)} The primary load/startup/journey matrix uses n=${config.samples}, mobile first calendar use n=${config.calendarSamples}, prepared split paths n=${config.preparedSamples}, mobile Lighthouse n=${config.lighthouseSamples}, and memory n=${config.memorySamples} sessions per policy. A frame opportunity is not a paint guarantee. Missing APIs remain unavailable. Calendar-policy transforms warn that their source maps are incomplete; these tables compare emitted bytes and observed behavior, not per-source map attribution.\n\n[Complete campaign report](../showcases/performance/reports/campaigns/${id}/results.md) · [Configuration](../showcases/performance/reports/campaigns/${id}/campaign.json) · [Stage outcomes](../showcases/performance/reports/campaigns/${id}/state.json) · [Source provenance](../showcases/performance/reports/campaigns/${id}/source.json) · [Structured tables and metric availability](../showcases/performance/reports/campaigns/${id}/tables.json) · [Functional qualification](../showcases/performance/reports/campaigns/${id}/qualification.json) · [Cancellation and recovery](../showcases/performance/reports/campaigns/${id}/recovery-qualification.json)\n\n`+content.map(t=>`### Latest calendar ${t.title}\n\n${t.note}\n\n${table(t)}\n`).join('\n');
 return markdown.trimEnd()+'\n\n'+begin+'\n'+section+'\n'+end+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [id,sourceCommit]=process.argv.slice(2);assert(safeId(id));const directory=resolve(lab,'reports/campaigns',id);
 const state=JSON.parse(await readFile(resolve(directory,'state.json'))),data=JSON.parse(await readFile(resolve(directory,'tables.json'))),ctx=JSON.parse(await readFile(resolve(directory,'campaign.json')));
 assert(safeId(ctx.config.referenceCampaign));const provenance=JSON.parse(await readFile(resolve(lab,'reports/campaigns',ctx.config.referenceCampaign,'source.json')));assert.equal(provenance.commit,sourceCommit,'Calendar source label must match its referenced package build');
 assert.equal(state.status,'complete');assert(data.coverage.every(r=>r[2]==='complete'));const file=resolve(lab,'../../plans/native-showcase-performance-results.md');
 await writeFile(file,integrateCalendarCampaign(await readFile(file,'utf8'),{id,sourceCommit,tables:data.tables,referenceCampaign:ctx.config.referenceCampaign,config:ctx.config,profiles:JSON.parse(await readFile(resolve(directory,'profiles-profiles.json'))),primaryDate:data.coverage.find(r=>r[0]===ctx.primary)?.[1]||'—'}));
 console.log('Integrated dated calendar policy tables:',id);
}
