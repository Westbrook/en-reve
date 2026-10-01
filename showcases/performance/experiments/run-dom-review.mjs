import { chromium } from '@playwright/test';
import { readFile,writeFile,mkdir,access } from 'node:fs/promises';
import { resolve } from 'node:path';
import os from 'node:os';
import { startServers } from '../src/server.mjs';
import { registry,root,json,sha,options,selectSystems } from '../src/config.mjs';
import { files } from '../src/prepare.mjs';
import { journey } from '../scenarios/journey.mjs';
import { censusInPage } from './dom-census.mjs';
const args=options(['run',...process.argv.slice(3)]);
const systems=selectSystems(args.systems);
const runId=process.argv[2];if(!runId||!/^[a-z0-9-]+$/.test(runId))throw Error('Supply a new immutable run ID');
const directory=resolve(root,'runs',runId);try{await access(directory);throw Error('Run already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(directory,{recursive:true});
const manifest={id:runId,systems:systems.map(s=>s.id),createdAt:new Date().toISOString(),scope:'Connected DOM diagnostic, no timing or heap ranking',protocol:{desktop:{width:1500,height:1100},narrow:{width:390,height:844},deviceScaleFactor:1,isMobile:false,hasTouch:false,cpuThrottle:1,networkThrottle:'none',desktopRepetitions:3,narrowRepetitions:1,settleMs:1500,postActionSettleMs:700,scenario:'Existing native journey, repeats=2; separate fresh custom-date opening/closing sessions',dateBoundary:'Whole field/host including label, controls, and custom popup. Popup-only body additions attributed explicitly. Closed roots, UA internals and disconnected template contents excluded.'},host:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model,node:process.version},sources:{},artifacts:{}};
for(const p of ['experiments/dom-census.mjs','experiments/run-dom-review.mjs','scenarios/journey.mjs'])manifest.sources[p]=sha(await readFile(resolve(root,p)));
for(const s of systems){const dir=resolve(root,'.cache/snapshots',s.id);const all=await files(dir);manifest.artifacts[s.id]=Object.fromEntries(await Promise.all(all.map(async f=>[f.slice(dir.length+1),sha(await readFile(f))])));}
await writeFile(resolve(directory,'manifest.json'),json(manifest));
const rows=[];const close=await startServers({systems});const browser=await chromium.launch();manifest.browser=browser.version();
async function settle(page,ms=1500){await page.waitForTimeout(ms);await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.querySelectorAll('*')].filter(e=>e.updateComplete).map(e=>e.updateComplete));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function snapshot(page,system,session,stage,profile,repeat){const data=await page.evaluate(censusInPage,{system});if(data.cardCount!==16)throw Error('Expected 16 cards');const row={system,session,stage,profile,repeat,at:new Date().toISOString(),status:'passed',...data}; rows.push(row);await writeFile(resolve(directory,'snapshots.json'),json(rows));console.log(system,session,stage,'nodes='+data.total.nodes,'date='+data.date.nodes);}
async function visit(s,profile,repeat,session){const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:manifest.protocol[profile],deviceScaleFactor:1});page.setDefaultTimeout(10000);try{await page.goto(`https://127.0.0.1:${s.port}`);await page.locator('.showcase-card').last().waitFor();await settle(page);await snapshot(page,s.id,session,'initial',profile,repeat);
if(session==='journey'){await journey(page,s.id,{measure:false});await settle(page,700);await snapshot(page,s.id,session,'after-journey',profile,repeat);}
if(session==='date'){
 await page.evaluate(()=>window.__domReviewBodyBefore=new Set(document.body.children));
 await page.locator('#showcase-project').getByRole('button',{name:s.id==='en-reve'?/^Choose date/:s.id==='astryx-react'?'Open calendar':'Calendar Review date',exact:s.id!=='en-reve'}).click();
 await settle(page,700);
 const popup=await page.evaluate(()=>{const added=[...document.body.children].filter(e=>!window.__domReviewBodyBefore.has(e));window.__domReviewDatePortals=added;return added.map(e=>({tag:e.localName,role:e.getAttribute('role'),testid:e.dataset.testid,focusStart:e.hasAttribute('data-focus-scope-start'),focusEnd:e.hasAttribute('data-focus-scope-end'),hasDialog:!!e.querySelector('[role=dialog]')}));});
 if(s.id==='spectrum-react'&&!popup.some(e=>e.hasDialog))throw Error('Missing Spectrum calendar portal');
 if(s.id!=='spectrum-react'&&popup.length)throw Error('Unexpected date portal, inspect before attribution');
 await page.getByRole('grid').last().waitFor({state:'visible'});
 await snapshot(page,s.id,session,'date-open',profile,repeat);rows.at(-1).portalEvidence=popup;
 await page.keyboard.press('Escape');await settle(page,700);
 if(await page.getByRole('grid').last().isVisible())throw Error('Calendar remained visible after Escape');
 await snapshot(page,s.id,session,'date-closed',profile,repeat);
}
}catch(error){rows.push({system:s.id,session,profile,repeat,status:'failed',error:error.message});await writeFile(resolve(directory,'snapshots.json'),json(rows));console.error('FAILED',s.id,error.message);}finally{await page.close();}}
try{
 // Collector control: exact node-type and boundary arithmetic with a shadow and slotted light child.
 const control=await browser.newPage();await control.setContent('<!doctype html><html><head></head><body><section class="showcase-card" id="showcase-project"><div class="pair"><div>other</div><label>Review date<input type="date"></label></div><x-control><span>light</span></x-control><template><i>disconnected</i></template><!--comment--></section></body></html>');await control.evaluate(()=>document.querySelector('x-control').attachShadow({mode:'open'}).innerHTML='<div part="base"><slot></slot></div>');const calibration=await control.evaluate(censusInPage,{system:'control'});if(calibration.total.nodes!==20||calibration.date.nodes!==3||calibration.total.shadowRoots!==1||calibration.total.baseParts!==1||calibration.elementsByTag.i)throw Error('Collector calibration failed');await writeFile(resolve(directory,'collector-control.json'),json(calibration));await control.close();
 for(let rep=1;rep<=3;rep++)for(const s of systems)await visit(s,'desktop',rep,'journey');
 for(let rep=1;rep<=3;rep++)for(const s of systems.filter(s=>['en-reve','astryx-react','spectrum-react'].includes(s.id)))await visit(s,'desktop',rep,'date');
 for(const s of systems)await visit(s,'narrow',1,'initial-only');
 manifest.completedAt=new Date().toISOString();manifest.successfulSnapshots=rows.filter(r=>r.status==='passed').length;manifest.failures=rows.filter(r=>r.status==='failed').length;await writeFile(resolve(directory,'manifest.json'),json(manifest));await writeFile(resolve(directory,'snapshots.json'),json(rows));
}finally{await browser.close();await close();}
console.log(json({directory,snapshots:manifest.successfulSnapshots,failures:manifest.failures}));
