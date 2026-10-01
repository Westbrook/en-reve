import assert from 'node:assert/strict';

const note = 'Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.';
const md = (headers, rows) => [headers, headers.map((_, i) => i < 2 ? '---' : '---:'), ...rows].map(r => `| ${r.join(' | ')} |`).join('\n');

/** Update existing groups, preserving historical values and unrelated prose. Idempotent. */
export function integrateWebAwesomeMain(markdown, historical, current) {
  const receipts = [];
  const aliases = {'Production payload sizes':'production payload sizes','Chunk structure':'emitted chunk structure','Repeated mobile Lighthouse audits':'repeated mobile Lighthouse audits','Historical connected DOM diagnostics':'diagnostic coverage','Historical exercised code coverage':'exercised code coverage','Historical rendering trace through LCP':'trace through diagnostic LCP'};
  for (const old of historical.tables) {
    const title = aliases[old.title] ?? old.title.replace('startup click','startup usability').replace('action details','individual actions');
    const next = current.tables.find(t => t.title.toLowerCase() === `Web Awesome ${title}`.toLowerCase());
    if (!next || old.headers[0] !== 'Implementation') continue;
    // Diagnostic tables gained sample counts. Retain the original metric columns;
    // provenance links to the detailed table with successful/failed sample counts.
    const columns = old.headers.map(h=>next.headers.indexOf(h));
    if (columns.some(i=>i<0)) continue;
    const added = next.rows.filter(r=>r[0]==='Web Awesome').map(r=>columns.map(i=>r[i]));
    assert(added.length, `No Web Awesome rows for ${old.title}`);
    const headers=[old.headers[0],'Acquisition',...old.headers.slice(1)];
    const rows=[...old.rows.map(r=>[r[0],`Historical ${old.source}`,...r.slice(1)]),...added.map(r=>[r[0],next.source,...r.slice(1)])];
    const heading=`### ${old.title}\n`;
    const start=markdown.indexOf(heading);assert(start>=0,`Missing main section ${old.title}`);
    const end=markdown.indexOf('\n#',start+heading.length);const section=markdown.slice(start,end<0?markdown.length:end);
    assert(/\n\|[^\n]+\|\n/.test(section),`Missing table ${old.title}`);
    let replacement=section.replace(/(?:\|[^\n]*\|\n?)+/,md(headers,rows)+'\n');
    const disclosure=`\n${note}\n`;
    if(!replacement.includes(note))replacement=replacement.replace(heading,heading+disclosure);
    markdown=markdown.slice(0,start)+replacement+markdown.slice(end<0?markdown.length:end);
    receipts.push({title:old.title,historicalSource:old.source,webAwesomeSource:next.source,historicalRows:old.rows.length,addedRows:added.length,headers,rows});
  }
  const referenceStart=markdown.indexOf('## First reference comparison\n');
  const referenceEnd=markdown.indexOf('\n## ',referenceStart+4);
  let reference=markdown.slice(referenceStart,referenceEnd).replace('All numbers below use the frozen default native CSR implementation', 'The original eight reference rows use the frozen default native CSR implementation');
  const referenceTable=reference.match(/(?:\|[^\n]*\|\n?)+/)[0];
  const parsed=referenceTable.trim().split('\n').map(l=>l.split('|').slice(1,-1).map(v=>v.trim()));
  let refHeaders=parsed[0], refRows=parsed.slice(2).filter(r=>r[0]!=='Web Awesome');
  if(refHeaders[1]==='Acquisition') { refHeaders=[refHeaders[0],...refHeaders.slice(3)]; refRows=refRows.map(r=>[r[0],...r.slice(3)]); }
  const payload=current.tables.find(t=>t.title==='Web Awesome production payload sizes');
  const loading=current.tables.find(t=>t.title==='Web Awesome mobile cold loading');
  const value=(t,h)=>t.rows.find(r=>r[0]==='Web Awesome')[t.headers.indexOf(h)];
  const wa=['Web Awesome',loading.source,value(loading,'Successful n'),value(payload,'Initial JS Brotli KiB'),value(payload,'JS Brotli KiB'),value(payload,'CSS Brotli KiB'),value(loading,'LCP ms'),value(loading,'LCP p75 ms')];
  reference=reference.replace(referenceTable,md([refHeaders[0],'Acquisition','Successful n',...refHeaders.slice(1)],[...refRows.map(r=>[r[0],'Historical reference (30 blocks)','30',...r.slice(1)]),wa])+'\n');
  const refNote='The original eight rows below retain the 30-block first reference. Web Awesome is added from its later 10-sample cold-mobile load acquisition with the same requested CPU/network profile; it is not part of those original randomized blocks. The frozen payload inventories supply its file sizes. Use the current three-system cohort for paired differences.';
  if(!reference.includes(refNote))reference=reference.replace('## First reference comparison\n','## First reference comparison\n\n'+refNote+'\n');
  markdown=markdown.slice(0,referenceStart)+reference+markdown.slice(referenceEnd);
  // The old three-column structural excerpt obscured most peers and could not
  // sort implementations. Reuse the verified nine-system post-journey census.
  const dom=receipts.find(t=>t.title==='Historical connected DOM diagnostics');assert(dom);
  const start=markdown.indexOf('## Rendering and interaction evidence\n'),end=markdown.indexOf('\n## ',start+4);
  let section=markdown.slice(start,end);
  section=section.replace(/(?:\|[^\n]*\|\n?)+/,md(dom.headers,dom.rows)+'\n');
  const intro=`\nThe connected-structure table below now includes all nine implementations. ${note} For sortable timing evidence across the same panel, see [interaction responsiveness](#interaction-responsiveness), [main-thread work](#main-thread-work-and-load-blocking), and [supporting diagnostics](#supporting-diagnostics).\n`;
  if(!section.includes('The connected-structure table below now includes'))section=section.replace('## Rendering and interaction evidence\n','## Rendering and interaction evidence\n'+intro);
  markdown=markdown.slice(0,start)+section+markdown.slice(end);
  return {markdown,receipts};
}
