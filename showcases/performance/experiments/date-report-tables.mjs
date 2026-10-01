import {readFile,writeFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';import {root,json} from '../src/config.mjs';
import {pathToFileURL} from 'node:url';
export async function dateReportTables({check=false}={}) {
const dates=new Map();
for(const id of await readdir(resolve(root,'runs'))){
 let data;
 try{data=(await readFile(resolve(root,'runs',id,'samples.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)}
 catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;try{data=JSON.parse(await readFile(resolve(root,'runs',id,'snapshots.json')))}catch(e){if(!['ENOENT','ENOTDIR'].includes(e.code))throw e;continue;}}
 const ds=(Array.isArray(data)?data:[]).map(s=>(s.startedAt??s.at)?.slice(0,10)).filter(Boolean).sort();
 if(ds.length)dates.set(id,ds[0]===ds.at(-1)?ds[0]:ds[0]+' – '+ds.at(-1));
}
const find=text=>[...dates.keys()].filter(id=>text.includes(id)||(text==='Historical reference (30 blocks)'&&id==='mobile-cold-reference-v1')).sort((a,b)=>b.length-a.length);
const pages=['native-showcase-performance-results.md','native-showcase-en-reve-main-results.md','native-showcase-web-awesome-results.md','native-showcase-spectrum-gen2-results.md','native-showcase-dom-review.md'];const receipt=[];
for(const name of pages){const path=resolve(root,'../../plans',name);let src=await readFile(path,'utf8');const original=src;const lines=src.split('\n');let changed=0;
 for(let i=0;i<lines.length;i++){if(!lines[i].startsWith('|')||!/^\|[\s:|-]+$/.test(lines[i+1]??''))continue;
  const cells=s=>s.split('|').slice(1,-1).map(s=>s.trim());const h=cells(lines[i]);const existingDate=h.indexOf('Date (UTC)');
  let index=h.findIndex(x=>/^(Acquisition(?: ID)?|Run ID)$/.test(x));
  if(index<0 && h[0]==='Implementation') {
    let k=i-1;while(k>=0&&!/^#{1,3} /.test(lines[k])&&!lines[k].startsWith('|'))k--;
    const note=lines.slice(k+1,i).join(' '),match=note.match(/Cohort:\s*\*\*([^*]+)\*\*/i);const id=match?.[1];
    if(id&&dates.has(id)) {h.splice(1,0,'Run ID');lines[i]='| '+h.join(' | ')+' |';const sep=cells(lines[i+1]);sep.splice(1,0,'---');lines[i+1]='| '+sep.join(' | ')+' |';for(let j=i+2;lines[j]?.startsWith('|');j++){const row=cells(lines[j]);row.splice(1,0,id);lines[j]='| '+row.join(' | ')+' |';}index=1;}
  }
  if(index<0)continue;
  h[index]='Run ID';if(existingDate<0)h.splice(index+1,0,'Date (UTC)');lines[i]='| '+h.join(' | ')+' |';const sep=cells(lines[i+1]);if(existingDate<0)sep.splice(index+1,0,'---');lines[i+1]='| '+sep.join(' | ')+' |';
  let j=i+2;for(;lines[j]?.startsWith('|');j++){const row=cells(lines[j]),ids=find(row[index]);const ds=[...new Set(ids.map(id=>dates.get(id)))];const value=ds.join('; ')||'—';if(existingDate<0)row.splice(index+1,0,value);else if(ds.length)row[existingDate]=value;lines[j]='| '+row.join(' | ')+' |';}changed++;i=j-1;
 }
 src=lines.join('\n');const note='**Reading measurement dates:** “Run ID” (previously “Acquisition”) identifies one recorded benchmark run, so its raw evidence can be traced. “Date (UTC)” is when its samples were measured—not when this report was rebuilt. A date range means sampling crossed UTC days; a dash means no timestamp could be recovered. Older peer rows retain their original dates.\n\n';
 if(changed&&!src.includes('**Reading measurement dates:**')){const end=src.indexOf('\n');src=src.slice(0,end+1)+'\n'+note+src.slice(end+1);}
 if(check){if(src!==original)throw new Error(`Historical report dates are stale: ${name}; regenerate and review them explicitly.`);}else if(changed)await writeFile(path,src);receipt.push({page:name,updatedTables:changed});
}
if(!check)await writeFile(resolve(root,'reports/calendar-variants/date-columns.json'),json({at:new Date().toISOString(),dates:Object.fromEntries(dates),pages:receipt}));console.log(receipt);

return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await dateReportTables({check:process.argv.includes('--check')});
