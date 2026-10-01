import {calendarContext} from '../campaigns/config.mjs';
const campaignContext=calendarContext();
const campaignOutput=campaignContext?.directory;
import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {chromium,firefox,webkit,expect} from '@playwright/test';
import {root,registry,json} from '../src/config.mjs';import {startServers} from '../src/server.mjs';import {exclusiveBrowserWork} from '../src/lock.mjs';import {functional} from '../src/functional.mjs';import {calendarJourney} from '../scenarios/calendar.mjs';
const variants=JSON.parse(await readFile(resolve(campaignOutput || resolve(root,'reports/calendar-variants'),'builds.json'))).variants;
await exclusiveBrowserWork(async()=>{
 const receipt={builds:variants.map(v=>({id:v.id,fingerprint:v.fingerprint})),startedAt:new Date().toISOString(),checks:[],functional:[]};
 for(const v of variants){
  receipt.functional.push(await functional({variant:v.id,systems:'en-reve',...(campaignContext?{id:campaignContext.id+'-qualification'}:{})}));
  const stop=await startServers({systems:registry.filter(s=>s.id==='en-reve'),variant:v.id});
  try{for(const [engine,type]of Object.entries({chromium,firefox,webkit})){
   const browser=await type.launch();try{const page=await browser.newPage({ignoreHTTPSErrors:true});await page.goto('https://127.0.0.1:4617');await page.locator('.showcase-card').last().waitFor();
    const requests=[];page.on('request',r=>requests.push(r.url()));const data=await calendarJourney(page);receipt.checks.push({variant:v.id,engine,kind:'calendar-journey',passed:true,data,requests});
   }finally{await browser.close()}
  }}finally{await stop()}
 }
 receipt.finishedAt=new Date().toISOString();receipt.passed=receipt.functional.every(x=>x.passed)&&receipt.checks.every(x=>x.passed);await writeFile(resolve(campaignOutput || resolve(root,'reports/calendar-variants'),'qualification.json'),json(receipt));if(!receipt.passed)throw Error('Qualification failed');console.log('QUALIFIED',receipt.checks.length);
});
