import {chromium,firefox,webkit} from '@playwright/test';import assert from 'node:assert/strict';import {join} from 'node:path';import {ownedRun,newResult,assertMissing} from './config.mjs';
const config=await ownedRun(),url=process.env.EN_DIAGNOSTICS_URL;
if(!url||new URL(url).hostname!=='127.0.0.1')throw Error('Owned localhost server URL required.');
if((await fetch(url+'/diagnostic-run.json').then(r=>r.json())).runId!==config.id)throw Error('Server run identity mismatch.');
await assertMissing(join(config.output,'review-check.json'));

const results=[];
for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
 if(!config.browsers.includes(engineName)){results.push({engineName,status:'skipped',reason:'Engine not selected'});continue;}
 let browser;try{browser=await engine.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'/?progress-report');
 const snapshot=()=>page.locator('pre').evaluate(e=>JSON.parse(e.textContent));
 await page.getByRole('button',{name:'Activate',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#island').textContent.includes('upgraded'));
 await page.getByRole('button',{name:'Refresh snapshot'}).click();assert.equal((await snapshot()).controllerState,'activating');assert.equal((await snapshot()).milestones.readiness.state,'pending');
 await page.getByRole('button',{name:'Fail readiness'}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('pre').textContent).controllerState==='error');
 await page.getByRole('button',{name:'Activate',exact:true}).click();await page.getByRole('button',{name:'Refresh snapshot'}).click();await page.getByRole('button',{name:'Cancel activation'}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('pre').textContent).controllerState==='canceled');
 await page.getByRole('button',{name:'Activate',exact:true}).click();await page.getByRole('button',{name:'Resolve readiness'}).click();await page.waitForFunction(()=>JSON.parse(document.querySelector('pre').textContent).controllerState==='ready');
 await page.getByRole('button',{name:'Dispose observer'}).click();assert.deepEqual((await snapshot()).handles,{roots:0,instances:0,scope:0,controller:0});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:join(config.output,engineName+'-fixture.png'),fullPage:true});
 results.push({engineName,version:browser.version(),status:errors.length?'failed':'passed',errors,comparison:{status:'skipped',reason:'Historical measurement comparison is not part of fresh current-source conformance.'}});
 }catch(error){results.push({engineName,status:'failed',error:{name:error.name,message:error.message,stack:error.stack}});}
 finally{if(browser)await browser.close();}
}
await newResult(join(config.output,'review-check.json'),{schemaVersion:1,kind:'current-source-interactions',runId:config.id,coverage:'Automated DOM, keyboard activation, focus and layout; no AT speech or physical-device acceptance.',results});
if(!results.some(r=>r.status==='passed')||results.some(r=>r.status==='failed'))process.exitCode=1;
console.log(results);
