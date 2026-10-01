import {chromium,firefox,webkit} from '@playwright/test';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const fixtureURL=process.env.DISMISSAL_FIXTURE_URL??'http://127.0.0.1:4211/lazy-ssr.html?mode=global&intent&hold';
const output=process.env.DISMISSAL_TRACE_OUTPUT??'artifacts/scoped-registry-phase-4-closeout/dismissal-trace.json';
const results=[];
await exclusiveBrowserWork(async()=>{
for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 const browser=await engine.launch();
 try {for(const method of ['escape','keyboard-close','pointer-close']) {
 const page=await browser.newPage();
 await page.goto(fixtureURL);
 const trigger=page.getByRole('button',{name:'Search commands',exact:true});
 await trigger.click();
 const input=page.getByRole('combobox',{name:'Find a settings command'});
 await input.waitFor(); await input.focus();
 await page.evaluate(()=>{
  window.trace=[];
  const active=()=>{let el=document.activeElement;while(el?.shadowRoot?.activeElement)el=el.shadowRoot.activeElement;return el?.id||el?.getAttribute('part')||el?.localName;};
  const log=(type,details={})=>window.trace.push({type,active:active(),...details});
  for(const method of ['setAttribute','removeAttribute']) {const original=Element.prototype[method];Element.prototype[method]=function(...args){if(this.id==='en-command-search'&&args[0].startsWith('aria-'))log(method,{attribute:args[0],value:args[1]});return original.apply(this,args);};}
  const close=HTMLDialogElement.prototype.close;HTMLDialogElement.prototype.close=function(...args){log('dialog.close:before');const result=close.apply(this,args);log('dialog.close:after');return result;};
  for(const type of ['keydown','keyup','focusin','focusout','click'])document.addEventListener(type,e=>log(type,{key:e.key,target:e.composedPath()[0]?.id||e.composedPath()[0]?.localName}),true);
 });
 if(method==='escape')await page.keyboard.press('Escape');
 else if(method==='keyboard-close'){await page.keyboard.press('Shift+Tab');await page.keyboard.press('Enter');}
 else await page.locator('en-command-palette en-button.en-overlay-close').click();
 await page.waitForTimeout(200);
 results.push({engine:name,method,trace:await page.evaluate(()=>window.trace),triggerFocused:await trigger.evaluate(el=>el.matches(':focus-within')),dialogVisible:await page.getByRole('dialog').isVisible()});
 console.log(name,method,JSON.stringify(results.at(-1)));
 await page.close();
 }}finally{await browser.close();}
}
});
await writeFile(output,JSON.stringify({fixtureURL,basis:'DOM event and mutation ordering only; does not capture screen-reader speech',results},null,2)+'\n');
if(process.env.EXPECT_CLOSE_FIRST==='1')for(const result of results){
 assert(result.triggerFocused&&!result.dialogVisible);
 const close=result.trace.findIndex(event=>event.type==='dialog.close:after');
 const aria=result.trace.findIndex(event=>event.attribute==='aria-expanded');
 assert(close>=0&&aria>close,`${result.engine} ${result.method}: ARIA changed before native close`);
 assert(result.trace.filter(event=>event.attribute).every(event=>event.active!=='en-command-search'));
}
console.log(JSON.stringify({cases:results.length,output}));
