import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {lab,safeId} from '../campaigns/config.mjs';
const md=(headers,rows)=>[headers,headers.map(()=>'---'),...rows].map(row=>'| '+row.map(v=>String(v??'—').replaceAll('|','\\|')).join(' | ')+' |').join('\n')+'\n';
const pattern=/(?:^\|[^\n]*\|\n?)+/m;
const parse=text=>text.trim().split('\n').map(line=>line.split('|').slice(1,-1).map(v=>v.trim()));
const maps={};
for(const profile of ['mobile','desktop']){
 for(const cache of ['cold','warm'])for(const [title,group] of [['loading','loading'],['response transfer','transfer'],['main-thread work','thread']])maps[`${profile} ${cache} ${title}`]=['load',group,profile,cache];
 maps[`${profile} cold LCP attribution`]=['load','lcp',profile,'cold'];
 maps[`${profile} startup click`]=['startup','startup',profile,'cold'];
 maps[`${profile} interaction summary`]=['interactions','interactions',profile,'cold'];
 maps[`${profile} cumulative interaction transfer`]=['interactions','transfer',profile,'cold'];
}
maps['Repeated mobile Lighthouse audits']=['lighthouse','lighthouse','mobile','cold'];
export function profileSummary(profiles){
 if(!profiles)return 'Requested profiles are retained in the linked campaign evidence.';
 const rate=value=>value<0?'unlimited':(value*8/1000000).toFixed(2)+' Mbps';
 return Object.entries(profiles).map(([name,p])=>`${name}: ${p.viewport.width} × ${p.viewport.height}, CPU ${p.cpuRate}×, latency ${p.latency} ms, download ${rate(p.download)}, upload ${rate(p.upload)}.`).join(' ');
}
/** Add a dated cohort to shared tables. Historical rows and their source dates are retained. */
export function integrateCurrentCampaign(markdown,{id,label,tables,builds,date,sourceCommit,profiles,interpretation=''}){
 assert(safeId(id));assert(label&&date&&sourceCommit);
 const belongs=value=>value===id||value?.startsWith(id+'-');
 const find=([suite,group,profile,cache])=>tables.find(t=>t.title===`${suite} · ${group} · ${profile} · ${cache} · none · instrumented`);
 const names=name=>name==='En Reve · Current source'?label:name==='En Reve · Web Components'?`En Reve frozen 6d09b31c · ${date}`:`${name} · ${date}`;
 const decorated=t=>({...t,rows:t.rows.filter(r=>!t.headers.includes('Successful n')||Number(r[t.headers.indexOf('Successful n')])>0).map(r=>r.map((v,i)=>i===0?names(v):v))});
 const additions=[];
 const boundary=markdown.indexOf('<!-- BEGIN WEB AWESOME -->');assert(boundary>0,'Expected report boundary');
 let prefix=markdown.slice(0,boundary),suffix=markdown.slice(boundary);
 prefix=prefix.replace(/(^### ([^\n]+)\n)([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gm,(all,heading,title,rest)=>{
  if(!maps[title]&&!['Production payload sizes','Memory after 0 cycles','Memory after 10 cycles','Memory after 50 cycles'].includes(title))return all;const source=maps[title]?find(maps[title]):tables.find(t=>t.title===title);if(!source)return all;
  const match=rest.match(pattern);assert(match,title);const [headers,,...old]=parse(match[0]);
  const columns=headers.map(h=>source.headers.indexOf(h));assert(columns.every(i=>i>=0),'Missing headers: '+title);
  const added=decorated(source).rows.map(r=>columns.map(i=>r[i]));assert(added.some(r=>r[0]===label),'No current result: '+title);
  const keep=old.filter(r=>!belongs(r[headers.indexOf('Run ID')]));
  additions.push({title,rows:added.length});return heading+rest.replace(match[0],md(headers,[...keep,...added]));
 });
 // The overview uses exact candidate asset sizes, not native bundle totals.
 const load=decorated(find(['load','loading','mobile','cold']));
 const payload=tables.find(t=>t.title==='Production payload sizes');
 prefix=prefix.replace(/(## First reference comparison\n)([\s\S]*?)(?=\n## )/,(all,heading,rest)=>{
  const match=rest.match(pattern),[headers,,...old]=parse(match[0]);
  const rows=load.rows.map(r=>{
   const originalName=Object.entries(Object.fromEntries(payload.rows.map(x=>[names(x[0]),x]))).find(([n])=>n===r[0])?.[1];assert(originalName);
   const value=h=>r[load.headers.indexOf(h)],size=h=>originalName[payload.headers.indexOf(h)];
   const cells={'Implementation':r[0],'Run ID':value('Run ID'),'Date (UTC)':value('Date (UTC)'),'Successful n':value('Successful n'),'Initial JS Brotli KiB':size('Initial JS Brotli KiB'),'All JS Brotli KiB':size('JS Brotli KiB'),'External CSS Brotli KiB':size('CSS Brotli KiB'),'Median LCP ms':value('LCP ms'),'Lab p75 LCP ms':value('LCP p75 ms')};
   return headers.map(h=>{assert(h in cells);return cells[h]});
  });return heading+rest.replace(match[0],md(headers,[...old.filter(r=>!belongs(r[headers.indexOf('Run ID')])),...rows]));
 });
 const dom=tables.find(t=>t.title.startsWith('diagnostic · Connected DOM and styles · desktop'));
 if(dom){const aliases={'Connected nodes':'connectedNodes','Connected elements':'connectedElements','Open shadow roots':'openShadowRoots','Style elements':'styleElements','Stylesheet adoptions':'stylesheetAdoptions','Unique adopted sheets':'uniqueAdoptedStylesheets'};
  for(const heading of ['### Historical connected DOM diagnostics','## Rendering and interaction evidence']){
   const start=prefix.indexOf(heading+'\n');assert(start>=0);const before=prefix.slice(0,start),tail=prefix.slice(start),match=tail.match(pattern);assert(match);const [headers,,...old]=parse(match[0]);
   const added=decorated(dom).rows.map(r=>headers.map(h=>{const i=dom.headers.indexOf(aliases[h]||h);assert(i>=0,h);return r[i]}));prefix=before+tail.replace(match[0],md(headers,[...old.filter(r=>!belongs(r[headers.indexOf('Run ID')])),...added]));
  }
 }
 const note=`**Latest measured source:** ${label}, local main \`${sourceCommit}\`, acquired ${date}. The new rows are additive: previous En Reve and peer observations retain their dates. Frozen controls and the new candidate ran as separate sequential cohorts, so differences are descriptive, not paired causal estimates. [Latest campaign details](#latest-main-refresh) include coverage and source provenance. Earlier statements using “current” refer to their dated acquisitions.\n\n`;
 prefix=prefix.replace(/^\*\*Latest measured source:\*\*[^\n]*\n\n/m,'').replace(/^(# [^\n]+)\n+/,'$1\n\n'+note);
 const olderGaps='These gap estimates and remediation hypotheses retain their original acquisitions. Consult [latest current-minus-frozen results](#latest-current-minus-frozen-control) and the newly dated shared tables before treating an earlier gap as a current regression.\n\n';
 if(!prefix.includes(olderGaps))prefix=prefix.replace('## Comparing gaps and choosing remediation\n','## Comparing gaps and choosing remediation\n\n'+olderGaps);
 const section='## Latest main refresh\n\n'+note+`[Reproducible campaign report](../showcases/performance/reports/campaigns/${id}/results.md) · [Configuration](../showcases/performance/reports/campaigns/${id}/campaign.json) · [Stage outcomes](../showcases/performance/reports/campaigns/${id}/state.json) · [Source provenance](../showcases/performance/reports/campaigns/${id}/source.json) · [Structured tables and metric availability](../showcases/performance/reports/campaigns/${id}/tables.json) · [Connected DOM census](../showcases/performance/reports/campaigns/${id}/dom.json)\n\n${profileSummary(profiles)} Timing is exploratory workstation evidence. Memory checkpoint sample counts and API availability are recorded, with no forced GC; missing API readings are not zero. Lighthouse TBT and observer blocking excess use different windows. This refresh measures the existing eager/global/client-rendered showcase; calendar policies are reported separately, with their own measurement dates.\n\n`+tables.filter(t=>['Current minus frozen control','Acquisition coverage','Chunk structure','Connected DOM with and without dates','Initial non-date node composition','Memory and retention','Back-forward cache observations'].includes(t.title)||t.title.startsWith('interactions · ')&&!t.title.includes(' · interactions · ')).map(t=>`### Latest ${t.title}\n\n${t.note}\n\n`+md(t.headers,t.rows.map(r=>r.map((v,i)=>i===0&&t.headers[0]==='Implementation'?names(v):v)))).join('\n');
 const authoredFindings=interpretation.trim()?`\n### Latest main findings and follow-up\n\n${interpretation.trim()}\n`:'';
 const begin='<!-- BEGIN LATEST MAIN -->',end='<!-- END LATEST MAIN -->';
 suffix=suffix.replace(new RegExp(begin+'[\\s\\S]*?'+end+'\\n?'),'');
 return {markdown:prefix+suffix.trimEnd()+'\n\n'+begin+'\n'+section+authoredFindings+'\n'+end+'\n',additions};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [id,label,sourceCommit]=process.argv.slice(2);assert(safeId(id),'campaign ID required');const dir=resolve(lab,'reports/campaigns',id);
 const data=JSON.parse(await readFile(resolve(dir,'tables.json'))),state=JSON.parse(await readFile(resolve(dir,'state.json')));assert.equal(state.status,'complete');assert(data.coverage.every(r=>r[2]==='complete'),'Refuse incomplete measurements');
 const provenance=JSON.parse(await readFile(resolve(dir,'source.json')));assert.equal(provenance.commit,sourceCommit,'Report source label must match the acquired Git commit');
 const date=[...new Set(data.coverage.map(r=>r[1]))].join('; '),file=resolve(lab,'../../plans/native-showcase-performance-results.md');
 const result=integrateCurrentCampaign(await readFile(file,'utf8'),{id,label,sourceCommit,date,tables:data.tables,profiles:JSON.parse(await readFile(resolve(dir,'profiles-profiles.json'))),interpretation:await readFile(resolve(dir,'interpretation.md'),'utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error;})});await writeFile(file,result.markdown);await writeFile(resolve(dir,'integration.json'),JSON.stringify({at:new Date().toISOString(),...result,markdown:undefined},null,2)+'\n');console.log(result.additions);
}
