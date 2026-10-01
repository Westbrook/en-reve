const phase6Base=process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const results=[];
await exclusiveBrowserWork(async()=>{const server=await serve('candidate/cold',0,phase6Base);try{for(const [name,type]of Object.entries({chromium,firefox,webkit})){const browser=await type.launch();try{for(const mode of ['global','scoped']){
 const page=await browser.newPage({ignoreHTTPSErrors:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url+'/?mode='+mode);await page.waitForFunction(()=>!!window.study);
 const stats=await page.evaluate(async()=>{
  const create=registry=>registry===customElements?document.createElement('en-date-picker'):document.createElement('en-date-picker',{customElementRegistry:registry});
  const shared=[],separate=[];
  for(let i=0;i<16;i++){const p=create(study.scope.registry);p.calendarLoading='deferred';p.label='Shared '+i;p.value='2026-09-15';document.querySelector('#fields').append(p);shared.push(p);}
  if(study.mode==='scoped')for(let i=0;i<8;i++){
   const registry=new CustomElementRegistry();for(const tag of ['en-button','en-icon','en-dialog','en-date-picker'])registry.define(tag,study.scope.registry.get(tag));
   const p=create(registry);p.calendarLoading='deferred';p.label='Separate '+i;p.value='2026-09-15';document.querySelector('#fields').append(p);separate.push(p);
  }
  await Promise.all([...shared,...separate].map(p=>p.updateComplete));
  const initial=[...shared,...separate].filter(p=>p.shadowRoot.querySelector('en-calendar')).length;
  await shared[0].showPicker();shared[0].hidePicker();
  if(separate.length){await separate[0].showPicker();separate[0].hidePicker();}
  const sharedRealized=shared.filter(p=>p.shadowRoot.querySelector('en-calendar')).length,separateRealized=separate.filter(p=>p.shadowRoot.querySelector('en-calendar')).length;
  for(const p of [...shared,...separate])p.remove();return {initial,sharedRealized,separateRealized,separateCount:separate.length};
 });assert.equal(stats.initial,0);assert.equal(stats.sharedRealized,1);assert.equal(stats.separateRealized,stats.separateCount?1:0);
 // A fresh page holds the module while the host is disconnected/adopted.
 await page.close();for(const operation of ['reconnect','adopt']){const p=await browser.newPage({ignoreHTTPSErrors:true});p.on('pageerror',e=>errors.push(e.message));let release,entered=false;const gate=new Promise(r=>release=r);await p.route('**/calendar-*.js',async route=>{entered=true;await gate;await route.continue();});await p.goto(server.url+'/?mode='+mode);await p.waitForFunction(()=>!!window.study);await p.locator('#picker-trigger').getByRole('button').click();await expect.poll(()=>entered).toBe(true);
 await p.evaluate(operation=>{const el=study.picker;if(operation==='reconnect'){el.remove();document.querySelector('#fields').append(el);}else{const frame=document.createElement('iframe');document.body.append(frame);const doc=frame.contentDocument;doc.adoptNode(el);doc.body.append(el);window.adoptedDocument=doc;}},operation);release();await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>study.picker.shadowRoot.querySelector('en-dialog').open),false);assert.equal(await p.evaluate(()=>!!study.picker.shadowRoot.querySelector('en-calendar')),false);await p.close();}
 assert.deepEqual(errors,[]);results.push({name,mode,...stats,status:'pass'});
}}finally{await browser.close();}}}finally{await server.close();}});await writeFile((phase6Base+'/scaling.json'),JSON.stringify({results},null,2));
