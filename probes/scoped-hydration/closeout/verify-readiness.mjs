import {chromium,firefox,webkit} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../production/server.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
const base='artifacts/scoped-registry-phase-5-closeout/production',checks=[];
await exclusiveBrowserWork(async()=>{const server=await serve('cold',0,base);try{for(const [name,type]of Object.entries({chromium,firefox,webkit})){
 const browser=await type.launch();try{const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage();
 await page.goto(server.url);await page.waitForFunction(()=>!!window.study);await page.evaluate(async()=>{await study.records[0].island.load();const original=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window);let next=-1;const held=new Map();window.requestAnimationFrame=fn=>{if(window.holdReadiness){const id=next--;held.set(id,fn);return id;}return original(fn);};window.cancelAnimationFrame=id=>id<0?held.delete(id):cancel(id);window.readinessFrames={held,flush(){const batch=[...held.values()];held.clear();for(const fn of batch)fn(performance.now());}};window.holdReadiness=true;window.firstActivation=study.records[0].island.activate();});
 await page.waitForFunction(()=>study.records[0].island.state==='hydrating'&&readinessFrames.held.size>0);assert.equal(await page.evaluate(()=>study.records[0].island.state),'hydrating');
 await page.evaluate(()=>readinessFrames.flush());await page.waitForFunction(()=>readinessFrames.held.size>0);assert.equal(await page.evaluate(()=>study.records[0].island.state),'hydrating');
 await page.evaluate(()=>readinessFrames.flush());await page.evaluate(()=>window.firstActivation);assert.equal(await page.evaluate(()=>study.records[0].island.state),'ready');
 // Once ready, reactivation resolves even with all future frame callbacks held.
 assert(await page.evaluate(async()=>{let ready=false;study.records[0].island.activate().then(()=>ready=true);await Promise.resolve();return ready;}));
 await page.evaluate(()=>{window.holdReadiness=false;readinessFrames.flush();});
 const trigger=page.getByRole('button',{name:'Search commands',exact:true});await trigger.click();await page.getByRole('dialog').waitFor({state:'visible'});assert(await page.locator('#en-command-search').first().evaluate(el=>el.matches(':focus')));await page.keyboard.press('Escape');assert(await trigger.evaluate(el=>el.matches(':focus')));
 // A second island disposed during pending readiness must never open later.
 await page.evaluate(async()=>{await study.records[1].island.load();window.holdReadiness=true;window.disposedActivation=study.records[1].island.activate().then(()=>false,e=>e.name==='AbortError');});await page.waitForFunction(()=>study.records[1].island.state==='hydrating'&&readinessFrames.held.size>0);
 await page.evaluate(()=>study.records[1].island.dispose());assert(await page.evaluate(()=>window.disposedActivation));await page.evaluate(()=>{window.holdReadiness=false;readinessFrames.flush();});assert.equal(await page.evaluate(()=>study.records[1].island.state),'disposed');assert(!(await page.evaluate(()=>study.records[1].root.querySelector('en-command-palette').open)));
 checks.push({browser:name,readinessWaits:true,reactivationDoesNotWait:true,disposeWhileFramesHeld:true,focusAndEscape:true});await context.close();
 }finally{await browser.close();}
}}finally{await server.close();}});
await writeFile('artifacts/scoped-registry-phase-5-closeout/readiness-browser.json',JSON.stringify({at:new Date().toISOString(),checks},null,2)+'\n');
