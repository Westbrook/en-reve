import {expect} from '@playwright/test';
// Connected document + open shadow roots. Count the date field separately;
// detached nodes and inaccessible browser-native picker internals are excluded.
export async function calendarDOM(page){return page.evaluate(()=>{
 function count(root){let nodes=0,elements=0;function walk(n){nodes++;if(n.nodeType===1)elements++;if(n.shadowRoot)walk(n.shadowRoot);for(const c of n.childNodes)walk(c)}walk(root);return {nodes,elements}}
 const total=count(document),date=count(document.querySelector('#project-date'));return {total,date,withoutDate:{nodes:total.nodes-date.nodes,elements:total.elements-date.elements}};
});}
export async function calendarJourney(page,{preparation='none',cycles=0}={}){
 const field=page.locator('#project-date');await expect(field).toBeVisible();
 const before=await calendarDOM(page);
 const input=field.locator('input[type=date]');
 // Native editing remains available before any optional calendar activation.
 await input.fill('2026-09-18');await input.press('Tab');await expect(field).toHaveJSProperty('value','2026-09-18');
 const prepare=await field.evaluate(async(el,mode)=>{
  const start=performance.now();if(mode==='none')return null;
  const promise=el.preparePicker();window.__calendarPreparation={start,finish:null};promise.then(()=>window.__calendarPreparation.finish=performance.now());
  if(mode==='ready')await promise;return {start,finish:window.__calendarPreparation.finish};
 },preparation);
 const trigger=field.locator('#picker-trigger').getByRole('button');
 const open=async(name)=>{
  await trigger.focus();
  await field.evaluate((el,name)=>{
   window.__calendarTiming={name};const result=window.__calendarTiming;
   const start=(event)=>{if(!event.isTrusted||event.key!=='Enter')return;el.removeEventListener('keydown',start,true);result.input=performance.now();
    const poll=()=>{let active=document.activeElement;while(active?.shadowRoot?.activeElement)active=active.shadowRoot.activeElement;const calendar=el.shadowRoot.querySelector('en-calendar');
     const nativeDialog=el.shadowRoot.querySelector('en-dialog')?.shadowRoot?.querySelector('dialog');
     if(calendar?.shadowRoot?.contains(active)&&active?.matches('button')&&nativeDialog?.open){result.focus=performance.now();requestAnimationFrame(()=>{result.frame=performance.now();result.preparation=window.__calendarPreparation??null;});}else requestAnimationFrame(poll);
    };poll();};el.addEventListener('keydown',start,true);
  },name);
  await trigger.press('Enter');await page.waitForFunction(()=>Number.isFinite(window.__calendarTiming?.frame));
  return page.evaluate(()=>{const x=window.__calendarTiming;return {...x,inputToFocus:x.focus-x.input,inputToFrame:x.frame-x.input,prepareToFocus:x.preparation?x.focus-x.preparation.start:null}});
 };
 const first=await open('first');const opened=await calendarDOM(page);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 await expect(field).toHaveJSProperty('value','2026-09-19');await expect(field.locator('dialog')).not.toBeVisible();
 const selected=await calendarDOM(page);
 const repeat=await open('repeat');await page.keyboard.press('Escape');await expect(field.locator('dialog')).not.toBeVisible();
 const closed=await calendarDOM(page);
 for(let i=0;i<cycles;i++){await open('cycle');await page.keyboard.press('Escape');await expect(field.locator('dialog')).not.toBeVisible();}
 await page.locator('#project-title').getByRole('textbox').fill('Calendar benchmark');
 await page.locator('#showcase-project').getByRole('button',{name:'Create project',exact:true}).click();
 await expect(page.locator('#showcase-project')).toContainText('Calendar benchmark created locally. Review: 2026-09-19.');
 return {preparation,prepare,first,repeat,before,opened,selected,closed,afterCycles:cycles?await calendarDOM(page):null,cycles,nativeEdit:true,keyboardSelection:true,projectSubmission:true};
}
