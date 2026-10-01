import {expect,test,type Page} from '@playwright/test';

const field=(page:Page)=>page.locator('#asset');
const input=(page:Page)=>field(page).getByRole('combobox');
const status=(page:Page)=>field(page).locator('[part="space-status"]');
const message='Suggestions cannot be shown in the available space.';
const wait=(page:Page,ms:number)=>page.waitForTimeout(ms);
async function settle(page:Page){await page.evaluate(async()=>{await (window as any).comboboxFixture.settle();for(let i=0;i<5;i++)await new Promise(requestAnimationFrame);});}
async function cap(page:Page,value:string|undefined){await field(page).evaluate((host,value)=>value? (host as HTMLElement).style.setProperty('--en-option-list-max-block-size',value):(host as HTMLElement).style.removeProperty('--en-option-list-max-block-size'),value);await settle(page);}
async function state(page:Page){return field(page).evaluate(host=>{
  const input=host.shadowRoot!.querySelector('input')!;
  const status=host.shadowRoot!.querySelector<HTMLElement>('[part="space-status"]')!;
  return {value:(host as any).value,query:input.value,form:new FormData(host.closest('form')!).get('asset'),focused:host.shadowRoot!.activeElement===input,
    describedBy:input.getAttribute('aria-describedby'),invalid:input.getAttribute('aria-invalid'),validation:input.validationMessage,
    start:input.selectionStart,end:input.selectionEnd,expanded:input.getAttribute('aria-expanded'),active:input.getAttribute('aria-activedescendant'),
    status:status.textContent,space:status.getBoundingClientRect().height,sameInput:input===(window as any).feedbackInput,
    messages:(window as any).feedbackMessages};
});}
test.beforeEach(async({page,browser},info)=>{
  info.annotations.push({type:'browser-version',description:browser.version()});
  info.annotations.push({type:'scope',description:'Actual native consumer, CSS height ceilings and explicitly synthetic viewport/composition events; no physical keyboard or screen-reader announcement claim.'});
  await page.setViewportSize({width:390,height:844});await page.goto('/fixture');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await field(page).evaluate(host=>{
    (host as HTMLElement).style.cssText='position:fixed;left:30px;top:160px;width:300px;z-index:2';
    const input=host.shadowRoot!.querySelector('input')!;
    (window as any).feedbackInput=input;(window as any).feedbackMessages=[];
    const region=host.shadowRoot!.querySelector('[part="space-status"]')!;
    new MutationObserver(()=>{const text=region.textContent?.trim();if(text)(window as any).feedbackMessages.push(text);}).observe(region,{childList:true,subtree:true,characterData:true});
    const viewport=Object.assign(new EventTarget(),{offsetLeft:0,offsetTop:0,width:390,height:844,scale:1});
    Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});(window as any).feedbackViewport=viewport;
  });
});
test.afterEach(async({page},info)=>{if(await field(page).count())await info.attach('feedback-state',{body:JSON.stringify(await state(page)),contentType:'application/json'});});

test('persistent no-room reports localized status without changing native editing or validity',async({page})=>{
  await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
  await field(page).evaluate(host=>host.setAttribute('no-room-text','Vorschläge benötigen mehr Platz.'));
  await input(page).fill('study');await input(page).press('ArrowDown');await settle(page);
  await input(page).evaluate(node=>(node as HTMLInputElement).setSelectionRange(1,4));const before=await state(page);
  await cap(page,'20px');await wait(page,200);await expect(status(page)).toBeEmpty();
  await expect(status(page)).toHaveText('Vorschläge benötigen mehr Platz.');
  await expect(status(page)).toHaveAttribute('role','status');await expect(status(page)).toHaveAttribute('aria-live','polite');
  await expect(status(page)).toHaveAttribute('aria-atomic','true');
  const current=await state(page);
  for(const key of ['value','query','form','focused','describedBy','invalid','validation','start','end','sameInput'] as const)expect(current[key]).toEqual(before[key]);
  expect(current.expanded).toBe('false');expect(current.active).toBeNull();expect(current.space).toBeGreaterThan(0);
  expect(await field(page).evaluate(host=>host.shadowRoot!.querySelector('[part="popup"]')!.contains(host.shadowRoot!.querySelector('[part="space-status"]')))).toBe(false);
  await cap(page,undefined);await expect(input(page)).toHaveAttribute('aria-expanded','true');await expect(status(page)).toBeEmpty();
  expect((await state(page)).space).toBeGreaterThan(0);
  await input(page).press('Escape');await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
});

test('transient no-fit and deliberately offscreen editors do not publish stale feedback',async({page})=>{
  await input(page).press('ArrowDown');await settle(page);
  await cap(page,'20px');await wait(page,180);await cap(page,undefined);await wait(page,900);
  await expect(status(page)).toBeEmpty();expect((await state(page)).messages).toEqual([]);
  await page.evaluate(()=>{const viewport=(window as any).feedbackViewport;viewport.offsetTop=600;viewport.height=200;viewport.dispatchEvent(new Event('scroll'));});
  await expect(input(page)).toHaveAttribute('aria-expanded','false');await wait(page,900);
  await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
  await page.evaluate(()=>{const viewport=(window as any).feedbackViewport;viewport.offsetTop=0;viewport.height=844;viewport.dispatchEvent(new Event('scroll'));});
  await expect(input(page)).toHaveAttribute('aria-expanded','true');
});

test('redundant retries do not postpone or repeatedly publish the same message',async({page})=>{
  await input(page).fill('study');await input(page).press('ArrowDown');await settle(page);await cap(page,'20px');
  for(let count=0;count<4;count++){await wait(page,180);await field(page).getByRole('button',{name:'Show options',exact:true}).click();}
  await expect(status(page)).toHaveText(message);
  await input(page).press('ArrowUp');await input(page).press('Enter');await wait(page,850);
  expect(await state(page)).toMatchObject({value:'forest',form:'forest',query:'study',focused:true,sameInput:true,expanded:'false',active:null,messages:[message]});
  expect(await page.evaluate(()=>(window as any).comboboxFixture.submissions)).toEqual([]);
  expect(await page.evaluate(()=>(window as any).comboboxFixture.events.filter((event:any)=>event.type==='en-change'))).toEqual([]);
});

test('composition defers a new message, then starts a fresh quiet period without accepting the query',async({page})=>{
  await input(page).press('ArrowDown');await settle(page);await cap(page,'20px');
  await input(page).evaluate(node=>{
    node.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,composed:true,data:''}));
    (node as HTMLInputElement).value='Fjord';node.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,data:'Fjord',inputType:'insertCompositionText',isComposing:true}));
  });
  await wait(page,900);await expect(status(page)).toBeEmpty();await expect(input(page)).toHaveValue('Fjord');
  await input(page).evaluate(node=>node.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,composed:true,data:'Fjord'})));
  await wait(page,180);await expect(status(page)).toBeEmpty();await expect(status(page)).toHaveText(message);
  expect(await state(page)).toMatchObject({value:'forest',form:'forest',query:'Fjord',focused:true,sameInput:true});
});

test('exit, disable and disconnect cancel timers and clear the session footprint',async({page})=>{
  await input(page).press('ArrowDown');await settle(page);await cap(page,'20px');await input(page).press('Escape');
  await wait(page,850);await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
  await input(page).press('ArrowDown');await expect(status(page)).toHaveText(message);
  await field(page).evaluate(host=>{(host as any).disabled=true;});await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
  await field(page).evaluate(host=>{(host as any).disabled=false;});await input(page).press('ArrowDown');await expect(status(page)).toHaveText(message);
  await field(page).evaluate(host=>{(host as any).readOnly=true;});await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);
  await field(page).evaluate(host=>{(host as any).readOnly=false;});await input(page).press('ArrowDown');await expect(status(page)).toHaveText(message);
  await input(page).press('Escape');await input(page).press('ArrowDown');await settle(page);
  const detached=await field(page).elementHandle();await field(page).evaluate(host=>host.remove());await wait(page,850);
  expect(await detached!.evaluate(host=>host.shadowRoot!.querySelector('[part="space-status"]')!.textContent)).toBe('');
  await page.locator('#asset-fields').evaluate((parent,host)=>parent.append(host!),detached);
  await expect(input(page)).toHaveAttribute('aria-expanded','false');await expect(status(page)).toBeEmpty();expect((await state(page)).space).toBe(0);await detached!.dispose();
});

test('feedback in a vertically centered container settles instead of oscillating as space recovers',async({page})=>{
  await field(page).evaluate(host=>{(host as HTMLElement).style.top='50%';(host as HTMLElement).style.transform='translateY(-50%)';});
  await input(page).press('ArrowDown');await settle(page);
  await field(page).evaluate(host=>{
    const anchor=host.shadowRoot!.querySelector('input')!.getBoundingClientRect();
    const popup=host.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
    const style=getComputedStyle(popup),row=popup.querySelector('[role="option"]')!.getBoundingClientRect().height;
    const chrome=[style.paddingTop,style.paddingBottom,style.borderTopWidth,style.borderBottomWidth].reduce((sum,value)=>sum+(parseFloat(value)||0),0);
    const gap=parseFloat(style.rowGap)||0,viewport=(window as any).feedbackViewport;
    Object.assign(viewport,{offsetTop:anchor.top-16,height:anchor.height+16+row+chrome-4+gap});viewport.dispatchEvent(new Event('resize'));
    (window as any).feedbackScroll=[scrollX,scrollY];
  });
  await expect(input(page)).toHaveAttribute('aria-expanded','false');
  await expect.poll(async()=>(await state(page)).messages.length).toBe(1);
  await expect(input(page)).toHaveAttribute('aria-expanded','true');await expect(status(page)).toBeEmpty();
  expect((await state(page)).space).toBeGreaterThan(0);
  const positions=await input(page).evaluate(async node=>{const tops=[];for(let i=0;i<15;i++){await new Promise(requestAnimationFrame);tops.push(node.getBoundingClientRect().top);}return tops;});
  expect(Math.max(...positions)-Math.min(...positions)).toBeLessThan(.5);
  await wait(page,900);expect((await state(page)).messages).toEqual([message]);await expect(input(page)).toBeFocused();
  expect(await page.evaluate(()=>[scrollX,scrollY])).toEqual(await page.evaluate(()=>(window as any).feedbackScroll));
});
