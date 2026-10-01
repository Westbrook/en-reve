import { writeExperimentReceipt } from './receipt-output.mjs';
import { chromium } from '@playwright/test';import {startServers} from '../src/server.mjs';import {registry,root,json} from '../src/config.mjs';import{writeFile}from'node:fs/promises';
const systems=registry.filter(s=>['en-reve','astryx-react','spectrum-react'].includes(s.id)); const rows=[];
const close=await startServers({systems});
let browser, failure; let failed=false;
try{browser=await chromium.launch();for(const system of systems){const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1500,height:1100}});await page.goto(`https://127.0.0.1:${system.port}`);await page.waitForTimeout(1500);await page.evaluate(()=>window.__bodyBefore=new Set(document.body.children));await page.locator('#showcase-project').getByRole('button',{name:system.id==='en-reve'?/^Choose date/:system.id==='astryx-react'?'Open calendar':'Calendar Review date',exact:system.id!=='en-reve'}).click();await page.waitForTimeout(700);rows.push({id:system.id,aria:await page.locator('body').ariaSnapshot(),added:await page.evaluate(()=>[...document.body.children].filter(e=>!window.__bodyBefore.has(e)).map(e=>e.outerHTML)),calendar:system.id==='en-reve'?await page.locator('en-date-picker').evaluate(e=>e.shadowRoot.innerHTML):null});await page.close();}await writeExperimentReceipt('reports/dom-review/date-open-inspection.json',json(rows)); console.log(rows.map(r=>({id:r.id,added:r.added.map(x=>x.slice(0,180))})));} catch (error) {
  failed = true;
  failure = error;
  throw error;
} finally {
  const cleanupErrors = [];
  for (const release of [() => browser?.close(), () => close()]) {
    try { await release(); } catch (error) { cleanupErrors.push(error); }
  }
  if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, "Date inspection resource cleanup failed");
}
