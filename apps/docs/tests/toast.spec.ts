import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url='/api-examples/toast.html';
const demo=(page:Page)=>page.locator('[data-toast-demo]');
const region=(page:Page)=>demo(page).locator('en-toast-region[label="Demo notifications"]');
async function load(page:Page){await page.goto(url);await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await region(page).evaluate(async(el:any)=>{await el.ownerDocument.defaultView.customElements.whenDefined(el.localName);await el.updateComplete;});await expect(demo(page).getByRole('button',{name:'Save snapshot',exact:true})).toBeVisible();}
async function loadTimed(page:Page){await page.clock.install({time:new Date('2026-09-15T08:00:00Z')});await load(page);await page.clock.pauseAt(new Date('2026-09-15T10:00:00Z'));}
test('inline CSS recipe works in initial HTML and adapts to container width and direction',async({page,browser})=>{
 const checkLayout=async(p:Page,width:string,dir:string,inline:boolean)=>{
  const example=p.locator('#toast-inline-demo');await example.evaluate((el,{width,dir})=>{el.style.inlineSize=width;el.dir=dir;},{width,dir});
  const toast=example.locator('en-toast');const content=toast.locator('[part="content"]');const action=toast.getByRole('button',{name:'Undo',exact:true});const close=toast.getByRole('button',{name:'Dismiss notification'});
  await expect(toast.getByRole('article')).toHaveCSS('display',inline?'flex':'grid');
  const [messageBox,actionBox,closeBox]=await Promise.all([content.boundingBox(),action.boundingBox(),close.boundingBox()]);
  if(inline){
   expect(Math.abs(actionBox!.y+actionBox!.height/2-(messageBox!.y+messageBox!.height/2))).toBeLessThan(2);
   if(dir==='ltr'){expect(messageBox!.x+messageBox!.width).toBeLessThanOrEqual(actionBox!.x);expect(actionBox!.x+actionBox!.width).toBeLessThanOrEqual(closeBox!.x);}
   else{expect(closeBox!.x+closeBox!.width).toBeLessThanOrEqual(actionBox!.x);expect(actionBox!.x+actionBox!.width).toBeLessThanOrEqual(messageBox!.x);}
  }else{expect(actionBox!.y).toBeGreaterThanOrEqual(messageBox!.y+messageBox!.height);}
  const bounds=(await example.boundingBox())!;expect(actionBox!.x).toBeGreaterThanOrEqual(bounds.x);expect(actionBox!.x+actionBox!.width).toBeLessThanOrEqual(bounds.x+bounds.width);
 };
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
 try{const initial=await context.newPage();await initial.goto(url);await checkLayout(initial,'40rem','ltr',true);await checkLayout(initial,'20rem','ltr',false);}finally{await context.close();}
 await load(page);
 for(const dir of ['ltr','rtl']){await checkLayout(page,'40rem',dir,true);await checkLayout(page,'20rem',dir,false);}
 await checkLayout(page,'40rem','ltr',true);await page.locator('#toast-inline-demo').screenshot({path:test.info().outputPath(`en-toast-inline-${test.info().project.name}.png`)});
 await checkLayout(page,'20rem','rtl',false);await page.locator('#toast-inline-demo').screenshot({path:test.info().outputPath(`en-toast-inline-narrow-${test.info().project.name}.png`)});
});
test('inline action retains dismissal, keyboard order and independent reset behavior',async({page})=>{
 await load(page);const example=page.locator('#toast-inline-demo');const toast=example.locator('en-toast');const undo=toast.getByRole('button',{name:'Undo',exact:true});const close=toast.getByRole('button',{name:'Dismiss notification'});
 await undo.focus();await page.keyboard.press('Tab');await expect(close).toBeFocused();await close.press('Enter');await expect(toast.getByRole('article')).not.toBeVisible();
 await example.getByRole('button',{name:'Show inline toast'}).click();await expect(undo).toBeVisible();
 await undo.focus();await undo.press('Enter');await expect(example.locator('[data-toast-inline-log]')).toHaveText('Changes undone locally.');await expect(toast.getByRole('article')).not.toBeVisible();
 await expect(example.getByRole('region',{name:'Inline action notifications'})).toBeFocused();
 await expect(region(page).locator('en-toast').first()).toHaveJSProperty('open',true);
 await page.getByRole('button',{name:'Reset example',exact:true}).click();await expect(undo).toBeVisible();await expect(example.locator('[data-toast-inline-log]')).toContainText('Changes saved.');
 await undo.focus();await page.keyboard.press('Escape');await expect(toast.getByRole('article')).not.toBeVisible();
});
test('SSR content is readable and hydration preserves it without replaying announcements',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const server=await context.newPage();await server.goto(url);await expect(region(server).locator('en-toast')).toContainText('stay until dismissed');await expect(region(server).getByRole('button',{name:'Dismiss notification'})).toBeVisible();}finally{await context.close();}
 await load(page);await expect(region(page).getByRole('status')).toBeEmpty();await expect(region(page).getByRole('alert')).toBeEmpty();
});
test('new messages announce without moving focus and controlled dismissals stage the public property',async({page})=>{
 await load(page);const add=demo(page).getByRole('button',{name:'Save snapshot',exact:true});await add.focus();await add.press('Enter');
 await expect(add).toBeFocused();await expect(region(page).getByRole('status')).toContainText('snapshot 1 saved');
 const toast=region(page).locator('en-toast').last();await toast.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{(window as any).staged=el.open;e.preventDefault();},{once:true}));
 await toast.getByRole('button',{name:'Dismiss notification'}).click();expect(await page.evaluate(()=>(window as any).staged)).toBe(false);await expect(toast).toHaveJSProperty('open',true);
 await toast.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{e.preventDefault();el.open=false;},{once:true}));await toast.getByRole('button').click();await expect(toast).toHaveJSProperty('open',false);
});
test('expiry pauses on focus and hover, while actionable messages persist',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>el.notify({message:'Timed probe',duration:1400}));const toast=region(page).locator('en-toast').last();await toast.getByRole('button').focus();await page.clock.runFor(6000);await expect(toast).toHaveJSProperty('open',true);
 await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).focus();await toast.hover();await page.clock.runFor(6000);await expect(toast).toHaveJSProperty('open',true);await page.mouse.move(1,1);await page.clock.runFor(5000);await expect(toast).toHaveJSProperty('open',false,{timeout:3000});
 await demo(page).getByRole('button',{name:'Simulate failed upload'}).click();const action=region(page).locator('en-toast').last();await action.evaluate((el:any)=>el.duration=100);await page.clock.runFor(6000);await expect(action).toHaveJSProperty('open',true);await action.getByRole('button',{name:'Retry upload'}).click();await expect(demo(page).locator('[data-toast-log]')).toContainText('succeeded');
});
test('Escape is scoped and focus recovers after dismissing an engaged toast',async({page})=>{
 await load(page);await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).click();const toasts=region(page).locator('en-toast');await toasts.first().getByRole('button').focus();await page.keyboard.press('Escape');await expect(toasts.last().getByRole('button')).toBeFocused();await page.keyboard.press('Escape');await expect(region(page).getByRole('region',{name:'Demo notifications'})).toBeFocused();
 await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).focus();await page.keyboard.press('Escape');await expect(demo(page).getByRole('button',{name:'Save snapshot',exact:true})).toBeFocused();
});
test('application-provided action buttons preserve keyboard order and own their outcomes',async({page})=>{
 await load(page);await demo(page).getByRole('button',{name:'Simulate failed upload'}).click();
 const toast=region(page).locator('en-toast').last();const retry=toast.getByRole('button',{name:'Retry upload',exact:true});const details=toast.getByRole('button',{name:'View details',exact:true});
 await expect(toast).toHaveJSProperty('messageText','Upload failed. Your file is still available.');
 await expect(region(page).getByRole('status')).toHaveText('Upload failed. Your file is still available.');
 await retry.focus();await page.keyboard.press('Tab');await expect(details).toBeFocused();
 await details.press('Enter');await expect(demo(page).locator('[data-toast-log]')).toContainText('the simulated connection was interrupted');await expect(toast).toHaveJSProperty('open',true);await expect(details).toBeFocused();
 await page.keyboard.press('Tab');await expect(toast.getByRole('button',{name:'Dismiss notification'})).toBeFocused();
 await retry.focus();await retry.press('Enter');
 await expect(demo(page).locator('[data-toast-log]')).toContainText('Upload retry succeeded locally.');
 await expect(region(page).locator('en-toast').nth(1)).toHaveJSProperty('open',false);
 await expect(region(page).locator('en-toast').last()).toHaveJSProperty('messageText','Upload completed.');
 await expect(region(page).getByRole('region',{name:'Demo notifications'})).toBeFocused();
});
test('multiple messages retain DOM order, reset clears them, and source and APIs are available',async({page})=>{
 await load(page);await demo(page).getByRole('button',{name:'Queue three updates'}).click();await expect(region(page).locator('en-toast')).toHaveCount(4);await expect(region(page).locator('en-toast')).toHaveText([/Notifications stay/,/Export 1/,/Export 2/,/Export 3/]);
 await page.getByRole('button',{name:'Reset example',exact:true}).click();await expect(region(page).locator('en-toast')).toHaveCount(1);await expect(region(page).getByRole('status')).toBeEmpty();
 await expect(page.getByText('View example code',{exact:false})).toBeVisible();
 for(const component of ['en-toast','en-toast-region']){await page.goto(`/api-reference.html?component=${component}`);await expect(page.locator('#api-toast-guide')).toContainText('preventDefault');}
});
test('narrow RTL, themes and reduced motion retain bounded visible controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);await page.emulateMedia({reducedMotion:'reduce'});await demo(page).evaluate(el=>el.setAttribute('dir','rtl'));
 await demo(page).getByRole('button',{name:'Simulate failed upload'}).click();await expect(region(page).getByRole('button',{name:'Retry upload'})).toBeVisible();
 for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
  for(const name of ['Retry upload','View details']){const action=region(page).getByRole('button',{name,exact:true});await expect(action).toBeVisible();const bounds=(await action.boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);}
 }
 const bounds=await region(page).getByRole('article').last().boundingBox();expect(bounds!.width).toBeLessThanOrEqual(390);expect(bounds!.x).toBeGreaterThanOrEqual(0);
 expect(await region(page).getByRole('article').last().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 const results=await new AxeBuilder({page}).include('[data-toast-demo]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations).toEqual([]);await demo(page).screenshot({path:test.info().outputPath('en-toast-mobile-'+test.info().project.name+'.png')});
});
test('disconnect cancels expiry and pending announcement work',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>{const toast=el.notify({message:'Disconnect probe',duration:400});(window as any).detachedToast=toast;});await expect(region(page).locator('en-toast')).toHaveCount(2);await region(page).evaluate(el=>el.remove());await page.clock.runFor(6000);expect(await page.evaluate(()=>(window as any).detachedToast.open)).toBe(true);
});
test('forwarded slotted toasts react to reopen and hidden changes',async({page})=>{
 await load(page);await page.evaluate(()=>{const wrapper=document.createElement('div');wrapper.id='forward-toast';wrapper.attachShadow({mode:'open'}).innerHTML='<en-toast-region label="Forwarded notifications"><slot></slot></en-toast-region>';wrapper.innerHTML='<en-toast>Forwarded message</en-toast>';document.body.append(wrapper);});
 const wrapper=page.locator('#forward-toast');const toast=wrapper.locator('en-toast');const announcer=wrapper.getByRole('status');await expect(toast.getByRole('button')).toBeVisible();
 await toast.evaluate((el:any)=>el.open=false);await expect(toast.getByRole('button')).not.toBeVisible();await toast.evaluate((el:any)=>el.open=true);await expect(announcer).toContainText('Forwarded message');
 await toast.evaluate(el=>el.setAttribute('hidden',''));await expect(toast.getByRole('button')).not.toBeVisible();await toast.evaluate(el=>el.removeAttribute('hidden'));await expect(toast.getByRole('button')).toBeVisible();
});
test('canceled expiry attempts once, page inactivity pauses, and urgency has its own channel',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>{const toast=el.notify({message:'Timeout veto',duration:150});toast.addEventListener('en-change',(e:Event)=>{(window as any).timeoutCount=((window as any).timeoutCount??0)+1;e.preventDefault();});});await page.clock.runFor(12000);expect(await page.evaluate(()=>(window as any).timeoutCount)).toBe(1);
 await region(page).evaluate((el:any)=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));(window as any).pausedToast=el.notify({message:'Hidden page',duration:250,priority:'assertive'});});await page.clock.runFor(6000);expect(await page.evaluate(()=>(window as any).pausedToast.open)).toBe(true);
 await page.evaluate(()=>{delete (document as any).hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(5000);await expect(region(page).locator('en-toast').last()).toHaveJSProperty('open',false);
 await region(page).evaluate((el:any)=>el.notify({message:'Urgent problem',priority:'assertive'}));await page.clock.runFor(2000);await expect(region(page).getByRole('alert')).toContainText('Urgent problem',{timeout:6000});
});
test('hidden toast pauses its remaining timeout and fixed placement stays in mobile bounds',async({page})=>{
 await page.setViewportSize({width:390,height:844});await loadTimed(page);await region(page).evaluate((el:any)=>{el.placement='block-end';const toast=el.notify({message:'Hidden timing probe',duration:500});toast.hidden=true;});const toast=region(page).locator('en-toast').last();await expect(region(page).locator('en-toast')).toHaveCount(2);await page.clock.runFor(7000);await expect(toast).toHaveJSProperty('open',true);await toast.evaluate(el=>el.removeAttribute('hidden'));const box=await region(page).boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);await page.clock.runFor(5000);await expect(toast).toHaveJSProperty('open',false);
});

test('inspired toast paint survives light/dark switching with readable controls and bounded status variants',async({page})=>{
 // Ten complete themed renders plus final focus/screenshot work; individual assertions keep their normal deadlines.
 test.setTimeout(60_000);
 await page.setViewportSize({width:390,height:844});await load(page);
 await demo(page).getByRole('combobox',{name:'Visible toast limit',exact:true}).selectOption('0');
 await demo(page).getByRole('button',{name:'Show status variants',exact:true}).click();
 const measurements:unknown[]=[];
 for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);
  await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
  for(const mode of ['light','dark']) {
   await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);
   const cards=region(page).locator('en-toast');
   const values=await cards.evaluateAll(elements=>elements.map(el=>{
    const surface=el.shadowRoot!.querySelector('article')!; const s=getComputedStyle(surface);
    const close=el.shadowRoot!.querySelector('en-button')!.shadowRoot!.querySelector('button')!;
    const c=getComputedStyle(close);const rect=surface.getBoundingClientRect();
    const luminance=(color:string)=>{const channels=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>{n/=255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
    const ratio=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    return {variant:el.getAttribute('variant'),background:s.backgroundColor,color:s.color,contrast:ratio(s.color,s.backgroundColor),closeColor:c.color,left:rect.left,right:rect.right,shadow:s.boxShadow};
   }));
   for(const value of values){expect(value.contrast,`${theme}/${mode}/${value.variant}`).toBeGreaterThanOrEqual(4.5);expect(value.closeColor).toBe(value.color);expect(value.left).toBeGreaterThanOrEqual(0);expect(value.right).toBeLessThanOrEqual(390);expect(value.shadow).not.toBe('none');}
   if(theme==='astryx-inspired')expect(values[0].background).toBe(mode==='light'?'rgb(10, 19, 23)':'rgb(255, 255, 255)');
   measurements.push({theme,mode,values});
  }
 }
 await test.info().attach('toast-theme-paint.json',{body:JSON.stringify(measurements,null,2),contentType:'application/json'});
 await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption('spectrum-inspired');
 await region(page).locator('en-toast').first().getByRole('button').focus();
 await region(page).screenshot({path:test.info().outputPath('en-toast-themed-'+test.info().project.name+'.png')});
});

test('max caps full messages, preserves DOM order and promotes after an accepted dismissal',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);await demo(page).getByRole('button',{name:'Queue three updates'}).click();
 const items=region(page).locator('en-toast');await expect(items).toHaveCount(4);
 await expect(items.nth(2)).toHaveAttribute('data-en-toast-stack','1');await expect(items.nth(3)).toHaveAttribute('data-en-toast-queued','');
 await expect(region(page).getByRole('button',{name:'Dismiss notification'})).toHaveCount(3);
 await expect(region(page)).toHaveJSProperty('queuedCount',1);await region(page).screenshot({path:test.info().outputPath('en-toast-stack-'+test.info().project.name+'.png')});
 await items.first().evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true}));
 await items.first().getByRole('button').click();await expect(items.nth(3)).toHaveAttribute('data-en-toast-queued','');
 await items.first().getByRole('button').click();await expect(items.nth(3)).not.toHaveAttribute('data-en-toast-queued','');
 await expect(region(page)).toHaveJSProperty('queuedCount',0);await expect(items).toHaveText([/Notifications stay/,/Export 1/,/Export 2/,/Export 3/]);
});

test('waiting timers start on admission and waiting messages do not announce early',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>{el.max=1;el.notify({message:'Waiting timed receipt',duration:500});});
 const waiting=region(page).locator('en-toast').last();await expect(waiting).toHaveAttribute('data-en-toast-queued','');
 await page.clock.runFor(7000);await expect(waiting).toHaveJSProperty('open',true);await expect(region(page).getByRole('status')).toBeEmpty();
 await region(page).locator('en-toast').first().evaluate((el:any)=>el.dismiss());
 await expect(waiting).not.toHaveAttribute('data-en-toast-queued','');await page.clock.runFor(100);await expect(region(page).getByRole('status')).toContainText('Waiting timed receipt');
 await page.clock.runFor(4800);await expect(waiting).toHaveJSProperty('open',true);await page.clock.runFor(100);
 await expect(waiting).toHaveJSProperty('open',false);
});

test('interrupt prepends ahead of the backlog without changing urgency and restarts displaced timers',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>{el.dismissAll();el.max=1;el.notify({message:'Ordinary timed message',duration:1600});});
 const timed=region(page).locator('en-toast').filter({hasText:'Ordinary timed message'});await expect(timed).not.toHaveAttribute('data-en-toast-queued','');await page.clock.runFor(4000);
 await region(page).evaluate((el:any)=>{el.notify({message:'Ordinary waiting message'});el.notify({message:'Timely message',interrupt:true});});
 const interrupt=region(page).locator('en-toast').filter({hasText:'Timely message'});await expect(interrupt).not.toHaveAttribute('data-en-toast-queued','');await expect(timed).toHaveAttribute('data-en-toast-queued','');
 await page.clock.runFor(7000);await expect(timed).toHaveJSProperty('open',true);await expect(interrupt).toHaveJSProperty('priority','polite');await expect(region(page).getByRole('alert')).toBeEmpty();
 await interrupt.evaluate((el:any)=>el.dismiss());await expect(timed).not.toHaveAttribute('data-en-toast-queued','');await page.clock.runFor(4999);await expect(timed).toHaveJSProperty('open',true);await page.clock.runFor(1);await expect(timed).toHaveJSProperty('open',false);
 await expect(region(page).locator('en-toast').filter({hasText:'Ordinary waiting message'})).not.toHaveAttribute('data-en-toast-queued','');
});

test('a focused toast remains visible when max shrinks or an interrupt arrives; queued controls are skipped',async({page})=>{
 await load(page);await demo(page).getByRole('button',{name:'Queue three updates'}).click();const items=region(page).locator('en-toast');const engaged=items.filter({hasText:'Export 2'});const interrupt=items.filter({hasText:'Interrupt while engaged'});
 await engaged.getByRole('button').focus();await region(page).evaluate((el:any)=>{el.max=1;el.notify({message:'Interrupt while engaged',interrupt:true});});
 await expect(engaged.getByRole('button')).toBeFocused();await expect(engaged).not.toHaveAttribute('data-en-toast-queued','');
 await expect(interrupt).toHaveAttribute('data-en-toast-queued','');await page.keyboard.press('Tab');
 await expect(interrupt).not.toHaveAttribute('data-en-toast-queued','');expect(await interrupt.evaluate(el=>el.matches(':focus-within'))).toBe(false);
 await region(page).evaluate((el:any)=>el.max=0);await expect(region(page)).toHaveJSProperty('queuedCount',0);
});

test('forwarded additions, hidden state and removal update the stack, and dismissAll clears waiting messages',async({page})=>{
 await load(page);await page.evaluate(()=>{const wrapper=document.createElement('div');wrapper.id='forward-capped';wrapper.attachShadow({mode:'open'}).innerHTML='<en-toast-region max="1"><slot></slot></en-toast-region>';wrapper.innerHTML='<en-toast>One</en-toast><en-toast>Two</en-toast>';document.body.append(wrapper);});
 const wrapper=page.locator('#forward-capped');const items=wrapper.locator('en-toast');await expect(items.last()).toHaveAttribute('data-en-toast-queued','');
 await items.first().evaluate(el=>el.setAttribute('hidden',''));await expect(items.last()).not.toHaveAttribute('data-en-toast-queued','');
 await wrapper.evaluate(el=>el.insertAdjacentHTML('beforeend','<en-toast interrupt>Three</en-toast>'));await expect(items.nth(1)).toHaveAttribute('data-en-toast-queued','');
 await items.last().evaluate(el=>el.remove());await expect(items.nth(1)).not.toHaveAttribute('data-en-toast-queued','');
 await wrapper.locator('en-toast-region').evaluate((el:any)=>el.dismissAll());await expect(items.first()).toHaveJSProperty('open',false);await expect(items.last()).toHaveJSProperty('open',false);
});


test('initial capped HTML and hydration agree on queued messages without announcing them',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 try{const server=await context.newPage();await server.goto(url);await server.getByText('Initial HTML stack comparison',{exact:true}).click();const initial=server.locator('en-toast-region[label="Initial stack comparison"]');await expect(initial.locator('[data-en-toast-queued]')).toHaveCount(2);await expect(initial.getByRole('button',{name:'Dismiss notification'})).toHaveCount(1);await expect(initial.locator('[data-en-toast-stack]')).toHaveCount(1);}finally{await context.close();}
 await load(page);await page.getByText('Initial HTML stack comparison',{exact:true}).click();const initial=page.locator('en-toast-region[label="Initial stack comparison"]');await expect(initial).toHaveJSProperty('queuedCount',2);await expect(initial.getByRole('status')).toBeEmpty();await expect(initial.locator('[data-en-toast-queued]')).toHaveCount(2);
 await initial.getByRole('button',{name:'Dismiss notification'}).click();await expect(initial).toHaveJSProperty('queuedCount',1);await expect(initial.getByRole('status')).toContainText('Second server-rendered message.');
});


test('duration has a five-second floor, content allowance and persistent escape hatch',async({page})=>{
 await loadTimed(page);
 const values=await page.evaluate(()=>{
  const el=document.createElement('en-toast');el.textContent='Saved.';
  const budget=(duration:number)=>{el.duration=duration;return el.effectiveDuration;};
  const short=budget(1),longer=budget(12000),persistent=budget(0),invalid=[budget(-1),budget(NaN),budget(Infinity)];
  el.duration=1;el.textContent=Array(20).fill('word').join(' ');const words=el.effectiveDuration;
  el.textContent='字'.repeat(100);const unspaced=el.effectiveDuration;
  el.innerHTML='Saved.<span slot="actions">'+'word '.repeat(100)+'</span>';const excluded=el.effectiveDuration;
  el.announcement='word '.repeat(30);const announcement=el.effectiveDuration;
  return {short,longer,persistent,invalid,words,unspaced,excluded,announcement};
 });
 expect(values).toEqual({short:5000,longer:12000,persistent:0,invalid:[0,0,0],words:9000,unspaced:8000,excluded:5000,announcement:12500});
 await region(page).evaluate((el:any)=>{el.max=0;el.notify({message:Array(20).fill('word').join(' '),duration:1});});
 const toast=region(page).locator('en-toast').last();await page.clock.runFor(8999);await expect(toast).toHaveJSProperty('open',true);await page.clock.runFor(1);await expect(toast).toHaveJSProperty('open',false);
});

test('message edits get a fresh reading budget; focus pauses retain elapsed time',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>el.notify({message:'Saved.',duration:1}));const toast=region(page).locator('en-toast').last();
 await page.clock.runFor(4000);await toast.evaluate(el=>el.textContent=Array(20).fill('word').join(' '));await expect(toast).toHaveJSProperty('effectiveDuration',9000);
 await page.clock.runFor(5000);await toast.getByRole('button').focus();await page.clock.runFor(10000);await expect(toast).toHaveJSProperty('open',true);
 await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).focus();await page.clock.runFor(3999);await expect(toast).toHaveJSProperty('open',true);await page.clock.runFor(1);await expect(toast).toHaveJSProperty('open',false);
});

test('each re-admission resets the full budget, including limit changes and focus while returning',async({page})=>{
 await loadTimed(page);await region(page).evaluate((el:any)=>{el.max=2;el.notify({message:'Saved.',duration:1});});const toast=region(page).locator('en-toast').last();
 for(let cycle=0;cycle<2;cycle++){
  await page.clock.runFor(4000);await region(page).evaluate((el:any)=>el.max=1);await expect(toast).toHaveAttribute('data-en-toast-queued','');await page.clock.runFor(10000);
  await region(page).evaluate((el:any)=>el.max=2);await expect(toast).not.toHaveAttribute('data-en-toast-queued','');await expect(toast).toHaveJSProperty('open',true);
 }
 await toast.getByRole('button').focus();await page.clock.runFor(10000);await expect(toast).toHaveJSProperty('open',true);
 await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).focus();await page.clock.runFor(4999);await expect(toast).toHaveJSProperty('open',true);await page.clock.runFor(1);await expect(toast).toHaveJSProperty('open',false);
});

test('message icons and close controls align across themes, wrapping and action rows',async({page})=>{
 test.setTimeout(90000);await load(page);
 await region(page).evaluate((el:any)=>{
  el.dismissAll();el.max=0;
  el.notify({message:'Changes saved.'});
  el.notify({message:'Your project preview is ready. The updated layout includes the project title, selected palette and latest changes. You can return to this information in the activity history whenever you need to review the details.'});
  const action=el.notify({message:'Upload failed. Your file is still available.',variant:'danger'});
  const button=document.createElement('en-button');button.slot='actions';button.textContent='Retry upload';action.append(button);
 });
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const theme of ['','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
   if(theme)await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);
   else await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption('default');
   for(const mode of ['light','dark']){
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);
    const geometry=await region(page).locator('en-toast').evaluateAll(elements=>elements.filter((el:any)=>el.open).map(el=>{
     const root=el.shadowRoot!;const surface=root.querySelector('article')!;const content=root.querySelector('[part="content"]')!;
     const icon=root.querySelector('.en-toast__icon')!;const close=root.querySelector('en-button')!.shadowRoot!.querySelector('button')!;
     const bounds=(node:Element)=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width,center:(r.top+r.bottom)/2};};
     const s=getComputedStyle(surface);const action=el.querySelector('[slot="actions"]');
     return {surface:bounds(surface),content:bounds(content),icon:bounds(icon),close:bounds(close),action:action?bounds(action):null,padding:parseFloat(s.paddingTop)+parseFloat(s.paddingBottom),border:parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth)};
    }));
    expect(geometry).toHaveLength(3);
    for(const g of geometry){
     const context=`${width}/${theme||'default'}/${mode}`;
     expect(Math.abs(g.icon.center-g.content.center),context).toBeLessThan(1);
     expect(Math.abs(g.close.center-g.content.center),context).toBeLessThan(1);
     expect(Math.abs(g.close.width-g.close.height),context).toBeLessThan(1);
     if(g.action)expect(g.action.top,context).toBeGreaterThanOrEqual(Math.max(g.content.bottom,g.close.bottom));
     else expect(Math.abs(g.surface.height-g.padding-g.border-Math.max(g.content.height,g.icon.height,g.close.height)),context).toBeLessThan(1);
    }
   }
   if(['spectrum-inspired','fluent-inspired','holotable-inspired'].includes(theme))await region(page).screenshot({path:test.info().outputPath(`en-toast-alignment-${test.info().project.name}-${theme}-${width}.png`)});
  }
 }
});


test('each notify interruption leads the entire list with matching visual and keyboard order',async({page})=>{
 await load(page);await region(page).evaluate((el:any)=>{el.dismissAll();el.max=3;for(let i=1;i<=4;i++)el.notify({message:`Ordinary ${i}`});});
 const items=region(page).locator('en-toast').filter({hasText:/^(Ordinary|Interrupt)/});
 const focused=items.filter({hasText:'Ordinary 1'});await focused.getByRole('button').focus();
 await region(page).evaluate((el:any)=>el.notify({message:'Interrupt one',interrupt:true}));
 await expect(focused.getByRole('button')).toBeFocused();await expect.poll(()=>items.evaluateAll(nodes=>nodes.map((el:any)=>el.messageText))).toEqual(['Interrupt one','Ordinary 1','Ordinary 2','Ordinary 3','Ordinary 4']);
 await region(page).evaluate((el:any)=>el.notify({message:'Interrupt two',interrupt:true}));
 await expect.poll(()=>items.evaluateAll(nodes=>nodes.map((el:any)=>el.messageText))).toEqual(['Interrupt two','Interrupt one','Ordinary 1','Ordinary 2','Ordinary 3','Ordinary 4']);
 const visible=region(page).locator('en-toast:not([data-en-toast-queued])').filter({hasText:/^(Ordinary|Interrupt)/});
 await expect.poll(()=>visible.evaluateAll(nodes=>nodes.map((el:any)=>el.messageText))).toEqual(['Interrupt two','Interrupt one','Ordinary 1']);await expect(focused.getByRole('button')).toBeFocused();
 const tops=await visible.evaluateAll(nodes=>nodes.map(el=>el.shadowRoot!.querySelector('article')!.getBoundingClientRect().top));expect(tops[0]).toBeLessThan(tops[1]);expect(tops[1]).toBeLessThan(tops[2]);
 await visible.first().getByRole('button').focus();await page.keyboard.press('Tab');await expect(visible.nth(1).getByRole('button')).toBeFocused();await page.keyboard.press('Tab');await expect(focused.getByRole('button')).toBeFocused();
 await region(page).evaluate((el:any)=>{el.max=0;el.notify({message:'Interrupt unlimited',interrupt:true});});
 await expect(items.first()).toHaveJSProperty('messageText','Interrupt unlimited');await expect(items.first()).not.toHaveAttribute('data-en-toast-queued','');await expect(focused.getByRole('button')).toBeFocused();
});

test('info artwork keeps its i in initial HTML, hydration and client-rendered multipart icons',async({page,browser})=>{
 const initialIcon=(p:Page)=>region(p).locator('en-toast .en-toast__icon en-icon').first();
 const context=await browser.newContext({javaScriptEnabled:false});
 try {const initial=await context.newPage();await initial.goto(url);await expect(initialIcon(initial).locator('svg > circle')).toHaveCount(1);await expect(initialIcon(initial).locator('svg > path')).toHaveCount(1);}finally{await context.close();}
 await load(page);await expect(initialIcon(page).locator('svg > circle')).toHaveCount(1);await expect(initialIcon(page).locator('svg > path')).toHaveCount(1);
 await initialIcon(page).screenshot({path:test.info().outputPath(`en-info-icon-${test.info().project.name}.png`)});
 await region(page).evaluate(el=>{for(const name of ['info','search']){const icon=document.createElement('en-icon');icon.name=name as 'info'|'search';icon.id=`client-${name}`;el.after(icon);}});
 for(const name of ['info','search']){const icon=page.locator(`#client-${name}`);await expect(icon.locator('svg > circle')).toHaveCount(1);await expect(icon.locator('svg > path')).toHaveCount(1);}
});

test('history discloses waiting messages without replay and retains only a bounded plain-text recent list',async({page})=>{
 await load(page);const surface=region(page);await surface.evaluate((el:any)=>{el.max=1;el.historyLimit=2;el.notify({message:'Waiting one'});el.notify({message:'Waiting two'});});
 await expect(surface).toHaveJSProperty('queuedCount',2);
 await surface.locator('summary').click();const history=surface.locator('[part="history"]');await expect(history).toContainText('Waiting (2)');await expect(history).toContainText('Waiting one');await expect(surface.getByRole('status')).toBeEmpty();
 await surface.locator('en-toast').first().getByRole('button').click();await expect(history).toContainText('Recently closed (1)');
 await surface.evaluate((el:any)=>el.dismissAll());await expect(history).toContainText('Recently closed (2)');
 expect(await surface.evaluate((el:any)=>el.historyItems.map((item:any)=>item.message))).toEqual(['Waiting two','Waiting one']);
 await expect(history.locator('en-toast')).toHaveCount(0);await expect(history.getByRole('button',{name:'Dismiss notification'})).toHaveCount(0);
 const clear=history.getByRole('button',{name:'Clear recent history'});await clear.focus();await clear.press('Enter');await expect(clear).toBeFocused();await expect(history).toContainText('Recently closed (0)');
 await surface.evaluate((el:any)=>{el.notify({message:'Still active'});el.clearHistory();});await expect(surface.locator('en-toast').last()).toHaveJSProperty('open',true);
});

test('history does not capture canceled dismissals and disabling history clears retained data',async({page})=>{
 await load(page);const surface=region(page);const toast=surface.locator('en-toast').first();await toast.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>e.preventDefault(),{once:true}));
 await toast.getByRole('button').click();await expect(surface).toHaveJSProperty('historyItems',[]);await toast.getByRole('button').click();await expect.poll(()=>surface.evaluate((el:any)=>el.historyItems.length)).toBe(1);
 await surface.evaluate((el:any)=>el.history=false);await expect(surface.locator('summary')).toHaveCount(0);await expect(surface).toHaveJSProperty('historyItems',[]);
});

test('optional swipe requires horizontal intent, honors cancellation and protects focused content',async({page})=>{
 await load(page);const toast=region(page).locator('en-toast').first();const body=toast.getByRole('article');
 const gesture=async(dx:number,dy:number,cancel=false)=>{await body.dispatchEvent('pointerdown',{pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:40,clientY:100});await body.dispatchEvent('pointermove',{pointerId:7,pointerType:'touch',isPrimary:true,clientX:40+dx,clientY:100+dy});await body.dispatchEvent(cancel?'pointercancel':'pointerup',{pointerId:7,pointerType:'touch',isPrimary:true,clientX:40+dx,clientY:100+dy});};
 await gesture(20,90);await expect(toast).toHaveJSProperty('open',true);await gesture(20,0);await expect(toast).toHaveJSProperty('open',true);await gesture(150,0,true);await expect(toast).toHaveJSProperty('open',true);
 await toast.getByRole('button').focus();await gesture(150,0);await expect(toast).toHaveJSProperty('open',true);await demo(page).getByRole('button',{name:'Save snapshot',exact:true}).focus();
 await toast.evaluate((el:any)=>el.addEventListener('en-change',(e:any)=>{(window as any).swipeReason=e.detail.reason;e.preventDefault();},{once:true}));await gesture(150,0);await expect(toast).toHaveJSProperty('open',true);expect(await page.evaluate(()=>(window as any).swipeReason)).toBe('swipe');
 await toast.evaluate((el:any)=>el.swipe=false);await gesture(150,0);await expect(toast).toHaveJSProperty('open',true);await toast.evaluate((el:any)=>el.swipe=true);await gesture(-150,0);await expect(toast).toHaveJSProperty('open',false);
});

test('all logical placement variants fit narrow RTL and LTR windows without changing message order',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);const surface=region(page);await surface.evaluate((el:any)=>{el.notify({message:'Second toast'});el.notify({message:'Third toast'});});
 for(const dir of ['ltr','rtl'])for(const block of ['start','end'])for(const inline of ['start','center','end']){
  await surface.evaluate((el:any,{dir,placement})=>{el.dir=dir;el.placement=placement;},{dir,placement:`block-${block}-${inline}`});
  const box=(await surface.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(391);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(845);
  await expect(surface.locator('en-toast')).toHaveText([/Notifications stay/,/Second toast/,/Third toast/]);
 }
 await surface.evaluate((el:any)=>{el.dir='rtl';el.style.setProperty('--en-toast-region-width','200px');el.placement='block-start-start';});let box=(await surface.boundingBox())!;expect(box.x).toBeGreaterThan(150);
 await surface.evaluate((el:any)=>el.placement='block-start-end');box=(await surface.boundingBox())!;expect(box.x).toBeLessThan(30);
 await surface.evaluate((el:any)=>el.placement='block-end-center');box=(await surface.boundingBox())!;expect(Math.abs(box.x+box.width/2-195)).toBeLessThan(2);
});
