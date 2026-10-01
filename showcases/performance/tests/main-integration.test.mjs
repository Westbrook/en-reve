import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {integrateWebAwesomeMain} from '../experiments/integrate-web-awesome-main.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const old=read('./fixtures/historical-results-before-web-awesome.md');
const historical=JSON.parse(read('../reports/pass2-tables.json')), current=JSON.parse(read('../reports/web-awesome/tables.json'));
test('main groups preserve historical cells, add only matching Web Awesome metrics, and integrate idempotently',()=>{
 const first=integrateWebAwesomeMain(old,historical,current), second=integrateWebAwesomeMain(first.markdown,historical,current);
 assert.equal(second.markdown,first.markdown);assert(first.receipts.length>=31);
 for(const r of first.receipts){
  const source=historical.tables.find(t=>t.title===r.title);
  assert.deepEqual(r.rows.slice(0,r.historicalRows).map(row=>[row[0],...row.slice(2)]),source.rows);
  assert(r.rows.slice(r.historicalRows).every(row=>row[0]==='Web Awesome'));
  const sourceNew=current.tables.find(t=>t.source===r.webAwesomeSource&&t.rows.some(row=>row[0]==='Web Awesome')&&source.headers.every(h=>t.headers.includes(h))&&t.rows.filter(row=>row[0]==='Web Awesome').map(row=>source.headers.map(h=>row[t.headers.indexOf(h)])).every((row,i)=>JSON.stringify(row)===JSON.stringify([r.rows[r.historicalRows+i][0],...r.rows[r.historicalRows+i].slice(2)])));
  assert(sourceNew,`Exact measured cells for ${r.title}`);
 }
 assert.match(first.markdown,/\| Web Awesome \| web-awesome-load-v1 \| 10 \| 86.4 \| 86.4 \| 4.9 \| 604.0 \| 611.0 \|/);
 const rendering=first.markdown.split('## Rendering and interaction evidence')[1].split('\n## ')[0];
 assert.match(rendering,/Web Awesome/);assert.match(rendering,/Implementation \| Acquisition/);
 // Do not create historical paired differences against a system absent then.
 assert.doesNotMatch(first.markdown.split('### Cold mobile load LCP gaps against peers')[1].split('\n### ')[0],/Web Awesome/);
});
