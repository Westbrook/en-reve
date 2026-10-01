import {webkit} from '@playwright/test';
import {serve} from '../phase4-followup/server.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
export async function nativeRetryProbe(browser,serverURL,optional){
 const entry=await readFile('artifacts/scoped-registry-phase-4-closeout/integrated/site/assets/settings-entry-CZt8pP2-.js','utf8');
 const deps=JSON.parse('['+entry.match(/m\.f=\[([^\]]+)\]/)[1]+']');
 const context=await browser.newContext({ignoreHTTPSErrors:true});let requests=0;
 try{const page=await context.newPage();
  await page.route('**/native-retry.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Native import retry diagnostic</title><script type="module" crossorigin src="/assets/native-caller.js"></script>'}));
  await page.route('**/assets/native-caller.js',r=>r.fulfill({contentType:'text/javascript',body:`import {n as init,t as preload} from './preload-helper-CqL-Pw2c.js'; init(); export const load = () => preload(() => import(\`${'./'+optional.split('/').pop()}\`).then(m => m.commandPaletteDefinition), ${JSON.stringify(deps)}); window.nativeCaller={load}; window.nativeFirst=load().then(()=>({ok:true}),e=>({ok:false,message:e.message}));`}));
  await page.route('**'+optional,async r=>{requests++;if(requests===1){await new Promise(resolve=>setTimeout(resolve,100));await r.abort('failed');}else await r.continue();});
  await page.goto(serverURL+'/native-retry.html');
  await page.waitForFunction(()=>!!window.nativeFirst);
  const first=await page.evaluate(()=>window.nativeFirst);
  const attempts=[];
  for(let i=0;i<3;i++)attempts.push({result:await page.evaluate(async()=>{try{await window.nativeCaller.load();return {ok:true};}catch(e){return {ok:false,message:e.message};}}),requests});
  const differentCaller=await page.evaluate(async url=>{try{await import(url);return {ok:true};}catch(e){return {ok:false,message:e.message};}},serverURL+optional);
  return {basis:'Exact production Vite preload helper and dependency list, native import, no definition loader or workflow controller',first,attempts,differentCaller,requests};
 }finally{await context.close();}
}
if(process.argv[1]===new URL(import.meta.url).pathname)await exclusiveBrowserWork(async()=>{
 const server=await serve('../scoped-registry-phase-4-closeout/integrated'),browser=await webkit.launch();try{const result=await nativeRetryProbe(browser,server.url,'/assets/command-palette-BelSjPta.js');await writeFile('artifacts/scoped-registry-phase-4-closeout/native-webkit-retry.json',JSON.stringify(result,null,2)+'\n');console.log(result);}finally{await browser.close();await server.close();}
});
