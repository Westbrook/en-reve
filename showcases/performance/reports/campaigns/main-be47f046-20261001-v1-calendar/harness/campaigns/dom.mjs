// Separate structural diagnostic: never folded into load or interaction timing samples.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {calendarContext,lab} from './config.mjs';
import {registry,sha} from '../src/config.mjs';
import {startServers} from '../src/server.mjs';
import {exclusiveBrowserWork} from '../src/lock.mjs';
import {censusInPage} from '../experiments/dom-census.mjs';
const ctx=calendarContext();assert(ctx&&ctx.config.kind==='current');
const inventory=JSON.parse(await readFile(resolve(ctx.directory,'inventory.json')));
const builds=JSON.parse(await readFile(resolve(ctx.directory,'builds.json')));
const implementations=[...inventory.systems.filter(s=>ctx.config.systems.includes(s.id)),...builds.variants.map(v=>({...v,system:'en-reve',variant:v.id}))];
const output={campaign:ctx.id,startedAt:new Date().toISOString(),method:'Separate untimed connected-DOM census; open shadow trees, document nodes and whole date field included. Detached templates, closed roots and native date-picker UI excluded. Three desktop snapshots per implementation; eager En Reve opening/closing in the same session. No cross-library semantic equivalence claimed.',collectorSha256:sha(await readFile(resolve(lab,'experiments/dom-census.mjs'))),samples:[]};
await exclusiveBrowserWork(async()=>{
 for(const impl of implementations){
  for(const asset of impl.assets)assert.equal(sha(await readFile(resolve(lab,impl.variant?'.cache/variants':'.cache/snapshots',impl.id,asset.path))),asset.sha256);
  const system=impl.system||impl.id,stop=await startServers({systems:registry.filter(s=>s.id===system),variant:impl.variant});let browser;
  try{browser=await chromium.launch();output.browser=browser.version();
   if(!output.collectorControl){const control=await browser.newPage();try{await control.setContent('<!doctype html><html><head></head><body><section class="showcase-card" id="showcase-project"><div class="pair"><div>other</div><label>Review date<input type="date"></label></div><x-control><span>light</span></x-control><template><i>disconnected</i></template><!--comment--></section></body></html>');await control.evaluate(()=>document.querySelector('x-control').attachShadow({mode:'open'}).innerHTML='<div part="base"><slot></slot></div>');const data=await control.evaluate(censusInPage,{system:'control'});assert.equal(data.total.nodes,20);assert.equal(data.date.nodes,3);assert.equal(data.total.shadowRoots,1);assert.equal(data.total.baseParts,1);assert(!data.elementsByTag.i);output.collectorControl={passed:true,data};}finally{await control.close();}}
   for(let repeat=0;repeat<3;repeat++){
   const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1500,height:1100}});
   try{await page.goto('https://127.0.0.1:'+registry.find(s=>s.id===system).port);await page.locator('.showcase-card').last().waitFor();await page.waitForTimeout(1500);
    const snapshot=async state=>output.samples.push({implementation:impl.id,system,variant:impl.variant,repeat,state,at:new Date().toISOString(),data:await page.evaluate(censusInPage,{system})});
    await snapshot('initial');
    if(system==='en-reve'){await page.locator('#project-date #picker-trigger').getByRole('button').click();await page.getByRole('grid').last().waitFor({state:'visible'});await page.waitForTimeout(700);await snapshot('opened');await page.keyboard.press('Escape');await page.waitForTimeout(700);await snapshot('closed');}
   }finally{await page.close();}
  }}finally{await browser?.close();await stop();}
 }
});
assert(output.samples.every(s=>s.data.cardCount===16),'Expected all sixteen cards');output.finishedAt=new Date().toISOString();await writeFile(resolve(ctx.directory,'dom.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
