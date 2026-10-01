import { writeExperimentReceipt } from './receipt-output.mjs';
import { chromium } from '@playwright/test';
import { startServers } from '../src/server.mjs';
import { registry, root, json } from '../src/config.mjs';
import { writeFile } from 'node:fs/promises';
const close = await startServers();
try {
 const browser = await chromium.launch();
 try {
  const rows=[];
  for(const system of registry){
   const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1500,height:1100}});
   await page.goto(`https://127.0.0.1:${system.port}`);await page.locator('.showcase-card').last().waitFor();await page.waitForTimeout(1500);
   rows.push({id:system.id,project:await page.locator('#showcase-project').evaluate(e=>e.outerHTML),aria:await page.locator('#showcase-project').ariaSnapshot()});
   await page.close();
  }
  await writeExperimentReceipt('reports/dom-review/field-inspection.json',json(rows));console.log(rows.map(r=>({id:r.id,aria:r.aria})));
 }finally {await browser.close();}
}finally {await close();}
