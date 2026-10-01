// Publish current summaries across the reporting pages without rewriting historical acquisitions.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,json,sha} from '../src/config.mjs';
const data=JSON.parse(await readFile(resolve(root,'reports/en-reve-main/tables.json')));
assert.equal(data.status,'complete');
const table=(suffix)=>{const t=data.tables.find(t=>t.title==='En Reve main '+suffix);assert(t,suffix);return t;};
const value=(suffix,column,name='En Reve main 6d09b31c')=>{const t=table(suffix),r=t.rows.find(r=>r[0]===name);assert(r&&t.headers.includes(column),suffix+'/'+column);return r[t.headers.indexOf(column)];};
const render=t=>`### ${t.title}\n\n${t.note}\n\n| ${t.headers.join(' | ')} |\n| ${t.headers.map(()=>'---').join(' | ')} |\n${t.rows.map(r=>'| '+r.join(' | ')+' |').join('\n')}\n`;
const summaries=['mobile cold loading','mobile warm loading','production payload sizes','mobile interaction summary','connected totals with and without dates'];
const intro=`En Reve is now measured from exact local main **6d09b31c**, using fresh package builds, the original eager CSR showcase and regenerated default light tokens. The new acquisition uses frozen Fluent WC/Web Awesome controls; it does not retrofit current data into old paired comparisons or enable scoped/lazy/SSR consumer policies.\n\nMobile median LCP is **${value('mobile cold loading','LCP ms')} ms cold / ${value('mobile warm loading','LCP ms')} ms warm**. The native fixture emits **${value('production payload sizes','JS raw KiB')} KiB raw JS / ${value('production payload sizes','JS Brotli KiB')} KiB Brotli JS**. These are whole-fixture costs; the detailed tables retain HTML, CSS, actual responses, main-thread, interaction, memory and DOM metrics.\n\n[All current measurements and evidence](native-showcase-en-reve-main-results.md). [Sortable current comparison](http://127.0.0.1:4188/?progress-report#en-reve-main-comparison).\n`;
const block='<!-- BEGIN CURRENT EN REVE SUMMARY -->\n## Current En Reve main baseline\n\n'+intro+'\n'+summaries.map(s=>render(table(s))).join('\n')+'\n## Historical acquisition retained\n\nThe remaining tables and findings preserve their original build and acquisition. Their En Reve rows are historical, not the main baseline above.\n<!-- END CURRENT EN REVE SUMMARY -->\n';
const changes=[];
for(const filename of ['native-showcase-spectrum-gen2-results.md','native-showcase-web-awesome-results.md','native-showcase-dom-review.md']){
 const path=resolve(root,'../../plans',filename),before=await readFile(path,'utf8');let next=before.replace(/\n<!-- BEGIN CURRENT EN REVE SUMMARY -->[\s\S]*?<!-- END CURRENT EN REVE SUMMARY -->\n?/,'\n');next=next.replace(/^(# [^\n]+\n)/,'$1\n'+block);await writeFile(path,next);changes.push({path:filename,before:sha(before),after:sha(next)});
}
const path=resolve(root,'../../plans/native-showcase-performance-results.md');let main=await readFile(path,'utf8');
// Clearly distinguish the old second-pass prose from the current row refresh.
const historical='The findings immediately below describe the original second-pass acquisition. Refreshed En Reve rows in the grouped tables use main 6d09b31c; see the [current findings and remediation priorities](#en-reve-main-implications-and-next-investigations).';
if(!main.includes(historical))main=main.replace('- Mobile cold LCP: En Reve 622 ms;',historical+'\n\n- Mobile cold LCP: En Reve 622 ms;');
for(const [heading,label] of [['## Web Awesome comparison','Web Awesome'],['## Spectrum Gen2 comparison','Spectrum Gen2']]){const notice=`The ${label} tables below are the retained historical acquisition. For the refreshed En Reve library, use [the current main cohort](#en-reve-main-comparison); historical paired contrasts cannot be recalculated with a different En Reve build.`;if(!main.includes(notice))main=main.replace(heading+'\n',heading+'\n\n'+notice+'\n');}
const domBlock='<!-- BEGIN EN REVE CURRENT DOM -->\n'+['connected totals with and without dates','cohort custom-date lifecycle','connected base parts'].map(s=>render({...table(s),title:'Current '+s})).join('\n')+'\nThe source audit and detailed historical panel below retain their original counts and source contracts.\n<!-- END EN REVE CURRENT DOM -->\n';
main=main.replace(/\n<!-- BEGIN EN REVE CURRENT DOM -->[\s\S]*?<!-- END EN REVE CURRENT DOM -->\n?/,'\n').replace('## Connected DOM review\n','## Connected DOM review\n\n'+domBlock);
const summary='<!-- BEGIN EN REVE CURRENT OVERVIEW -->\n'+intro.replace('(native-showcase-en-reve-main-results.md)','(native-showcase-en-reve-main-results.md)')+'<!-- END EN REVE CURRENT OVERVIEW -->\n';
main=main.replace(/\n<!-- BEGIN EN REVE CURRENT OVERVIEW -->[\s\S]*?<!-- END EN REVE CURRENT OVERVIEW -->\n?/,'\n').replace(/^(# [^\n]+\n)/,'$1\n'+summary);
await writeFile(path,main);
await writeFile(resolve(root,'reports/en-reve-main/page-refresh.json'),json({at:new Date().toISOString(),currentTables:sha(JSON.stringify(data.tables)),historicalPages:changes,mainReportSha256:sha(main),scope:'Current overview and primary En Reve rows refreshed; historical comparisons retained with explicit notices.'}));
console.log('Current En Reve data linked and summarized across four reporting pages');
