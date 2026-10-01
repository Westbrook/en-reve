import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
const cases=new Map();
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const base=resolve(process.env.PHASE6_REVIEW_BASE ?? 'artifacts/scoped-registry-phase-6/candidate');
const port=Number(process.env.PHASE6_REVIEW_PORT ?? 4234);
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);if(req.method!=='GET'){res.writeHead(405).end();return;}if(path==='/favicon.ico'){res.writeHead(204).end();return;}
if(path==='/retry-review.mjs'){res.writeHead(200,{'content-type':'text/javascript','cache-control':'no-store'}).end(await readFile(resolve('probes/date-picker-performance/retry-review.mjs')));return;}
const policy=url.searchParams.get('policy')==='dom'?'dom':'cold';
if(path==='/'){
const delay=Math.min(5000,Math.max(0,Number(url.searchParams.get('delay')??0))),fail=url.searchParams.has('fail');
const id=randomUUID();cases.set(id,{delay,fail});if(cases.size>256)cases.delete(cases.keys().next().value);
let html=(await readFile(resolve(base,policy,'site/index.html'),'utf8')).replaceAll('/assets/',`/fixture/${id}/assets/`);html=html.replace('<form id="form">',`<section aria-label="Review instructions"><p><b>Phase 6 date review — ${policy==='dom'?'eager code, deferred construction':'optional calendar chunk'}</b></p><p><a href="/?policy=dom&progress-report">Construction-only</a> · <a href="/?delay=2000&progress-report">Slow calendar (2 seconds)</a> · <a href="/?fail&progress-report">Failed calendar</a> · <a href="/?progress-report">Fresh working copy</a></p><ol><li>Open Choose date. Check loading announcement, named dialog/grid, VoiceOver cursor and DOM focus on September 15.</li><li>Navigate days/months, select a date, reopen, then use Escape and the Close calendar button. Check value and focus return.</li><li>In the slow copy, edit the native date while loading. Moving into the field prevents a late opening; activate Choose date again afterward to see your latest value. Escape or Reset date during loading should cancel the pending opening.</li><li>In the failed copy, the first calendar request fails. Check the error and native editing/form values. Retry is browser-dependent; open the fresh working copy to recover if it remains failed.</li></ol><p>Form checks display locally. This fixture does not send entered dates. Range stays eager and is outside this opt-in.</p></section><form id="form">`);
const receipt=JSON.parse(await readFile(resolve(base,policy,'receipt.json'),'utf8'));
if(receipt.calendarLabels==='column-weekday')html=html.replace('</h1>','</h1><p id="weekday-review-version"><strong>Weekday experiment: full weekday headers, date-only button names.</strong> This isolated build is for VoiceOver review. Check horizontal and vertical navigation, initial focus and month boundaries. It is not the measured library candidate.</p>');
html=html.replace('<button id="submit">','<button type="reset">Reset date</button><button id="submit">');
if(url.searchParams.has('retry-review'))html=html.replace('</body>','<p><strong>Experimental retry announcement review.</strong> See the experiment label below the heading. This fixture-only experiment is not part of the frozen performance candidate.</p><script type="module" src="/retry-review.mjs"></script></body>');
res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','set-cookie':'p6=; Max-Age=0; Path=/; SameSite=Strict'}).end(html);return;
}
const match=path.match(/^\/fixture\/([a-f0-9-]+)(\/assets\/[^/]+)$/),assetPath=match?match[2]:path,scenario=match?cases.get(match[1]):undefined;
if(!assetPath.startsWith('/assets/')||assetPath.includes('..')){res.writeHead(404).end();return;}
if(/\/calendar-/.test(assetPath)&&scenario){await new Promise(r=>setTimeout(r,scenario.delay));if(scenario.fail){scenario.fail=false;res.writeHead(503,{'cache-control':'no-store'}).end('Fixture calendar failure');return;}}
let data;for(const p of ['cold','dom','eager']){try{data=await readFile(resolve(base,p,'site','.'+assetPath));break;}catch{}}
if(!data){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':extname(path)==='.js'?'text/javascript':'text/css','cache-control':'no-store'}).end(data);
}catch(error){res.writeHead(500).end(String(error));}});server.listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}/?progress-report`));
