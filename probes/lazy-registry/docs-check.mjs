import { evidenceDirectory } from '../../tooling/test-pipeline/evidence-output.mjs';
import {mkdir} from 'node:fs/promises';
const evidence=evidenceDirectory(import.meta.url,new URL('../../artifacts/scoped-registry-phase-3/',import.meta.url));
await mkdir(evidence,{recursive:true});
import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium,firefox,webkit} from '@playwright/test';
import {startDocsServer} from '../../apps/docs/tests/static-server.mjs';
const server=process.env.EN_DOCS_ORIGIN?null:await startDocsServer({port:0});
const origin=process.env.EN_DOCS_ORIGIN??server.url;
const results=[];try{for(const [name,type] of Object.entries({chromium,firefox,webkit})){
 const b=await type.launch();try{const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`${origin}/workflows/settings.html`);await p.waitForFunction(()=>document.querySelector('en-workflows-app')?.initializePreview);await p.evaluate(()=>document.querySelector('en-workflows-app').updateComplete);
 const defined=await p.evaluate(()=>!!customElements.get('en-command-palette'));assert.equal(defined,false,'Built docs must not register optional command search at startup');
 // Settings deliberately prepares definition bytes at route entry without registering them.
 await p.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/command-palette-')));
 const before=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));
 assert.equal(await p.evaluate(()=>!!customElements.get('en-command-palette')),false,'Load-only preparation must not register the palette');
 const trigger=p.getByRole('button',{name:'Search commands',exact:true});assert.equal(await trigger.count(),1);await trigger.press('Enter');await p.getByRole('dialog',{name:'Settings commands'}).waitFor({state:'visible'});
 const after=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));assert.ok(after.some(url=>url.includes('/command-palette-')));assert.equal(await p.evaluate(()=>!!customElements.get('en-command-palette')),true,'First use must register the prepared definition');assert.deepEqual(after.filter(url=>url.includes('/command-palette-')),before.filter(url=>url.includes('/command-palette-')),'First use must reuse the prepared definition bytes');assert.deepEqual(errors,[]);results.push({browser:name,startupPaletteDefined:defined,preparedRequests:before.filter(url=>url.includes('/command-palette-')),firstUseRegistered:true,newRequests:after.filter(url=>!before.includes(url)),errors});
 }finally{await b.close();}
}}finally{await server?.close();}
await writeFile(new URL('docs-browser.json',evidence),JSON.stringify(results,null,2)+'\n');console.log('Built docs load-only preparation and first keyboard registration: three browsers passed.');
