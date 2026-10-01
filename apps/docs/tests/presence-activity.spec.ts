import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url='/api-examples/presence-activity.html';
const demo=(page:Page)=>page.locator('[data-presence-activity-demo]');
const group=(page:Page)=>demo(page).locator('en-presence-group');
const feed=(page:Page)=>demo(page).locator('#activity-feed-example');
async function load(page:Page){await page.goto(url);await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await expect(group(page).getByRole('button',{name:'Show 2 more collaborators'})).toBeVisible();}
async function selectLoopTheme(page:Page,theme:string){
 const control=page.getByRole('combobox',{name:'Inspired theme',exact:true});
 // These loops select en-reve only first after load; the already-selected default emits no en-change.
 if(theme==='en-reve')expect(await control.inputValue(),'The first theme iteration starts from the initial default.').toBe('default');
 await control.selectOption(theme);
 // Full maintained titles from tooling/theme-candidates/definitions.json; option labels are shortened.
 const titles:Record<string,string>={
  'spectrum-inspired':"Spectrum 2-inspired · Light and dark",
  'fluent-inspired':"Fluent 2-inspired · Website light and dark",
  'astryx-inspired':"Astryx-inspired · Site light and dark",
  'shadcn-inspired':"shadcn/ui-inspired · Site light and dark",
  'holotable-inspired':"Holotable-inspired · Adapted light and reference dark",
 };
 await expect(page.getByRole('status',{name:'Theme result'})).toHaveText(theme==='en-reve'?'':`${titles[theme]} applied. Demo state is preserved.`);
}
test('SSR exposes every identity and history; hydration reveals a named disclosure without announcements',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const server=await context.newPage();await server.goto(url);await expect(group(server).locator('en-presence')).toHaveCount(5);for(const person of await group(server).locator('en-presence').all())await expect(person).toBeVisible();await expect(feed(server).getByRole('list')).toBeVisible();await expect(feed(server).getByRole('listitem')).toHaveCount(2);}finally{await context.close();}
 await load(page);await expect(group(page).locator('en-presence').nth(3)).not.toBeVisible();await expect(feed(page).getByRole('status')).toBeEmpty();await test.info().attach('initial-collaboration-accessibility',{body:await demo(page).ariaSnapshot(),contentType:'text/plain'});
});
test('overflow is cancellable, author writes win, and live membership/hidden changes retain nodes',async({page})=>{
 await load(page);await group(page).evaluate((el:any)=>{(window as any).originalPerson=el.children[4];el.addEventListener('en-change',(e:Event)=>e.preventDefault(),{once:true});});
 const more=group(page).getByRole('button');await more.click();await expect(group(page)).toHaveJSProperty('expanded',false);
 await group(page).evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{e.preventDefault();el.expanded=true;},{once:true}));await more.click();await expect(group(page)).toHaveJSProperty('expanded',true);await expect(group(page).locator('en-presence').last()).toBeVisible();
 await more.click();await demo(page).getByRole('button',{name:'Toggle Casey’s membership'}).click();await expect(more).toHaveAccessibleName('Show 3 more collaborators');await group(page).locator('en-presence').last().evaluate((el:any)=>el.hidden=true);await expect(more).toHaveAccessibleName('Show 2 more collaborators');
 expect(await group(page).evaluate(el=>el.children[4]===(window as any).originalPerson)).toBe(true);
 await group(page).evaluate(el=>el.insertAdjacentHTML('beforeend','<en-presence name="New collaborator" status="online"></en-presence>'));await expect(more).toHaveAccessibleName('Show 3 more collaborators');
 await group(page).evaluate(el=>el.lastElementChild!.remove());await expect(more).toHaveAccessibleName('Show 2 more collaborators');
});
test('collapsing an engaged identity recovers focus and removing the group cleans up overflow',async({page})=>{
 await load(page);await group(page).getByRole('button').click();const last=group(page).locator('en-presence').last();await last.evaluate(el=>el.setAttribute('href','/workflows/assets'));await last.getByRole('link').focus();await group(page).evaluate((el:any)=>el.expanded=false);await expect(group(page).getByRole('button')).toBeFocused();
 await group(page).evaluate(el=>{(window as any).removedGroup=el;el.remove();});expect(await page.evaluate(()=>(window as any).removedGroup.querySelectorAll('[data-en-presence-overflow]').length)).toBe(0);await demo(page).evaluate(el=>el.append((window as any).removedGroup));await expect(group(page).locator('[data-en-presence-overflow]')).toHaveCount(2);
});
test('buffered incoming updates keep keyed entries, focus and reading position until explicitly shown',async({page})=>{
 await load(page);const item=feed(page).locator('en-activity-item').first();await item.evaluate(el=>(window as any).firstEntry=el);const action=item.getByRole('button');await action.focus();const before=await action.boundingBox();
 await demo(page).locator('en-button').filter({hasText:'Simulate incoming update'}).evaluate((el:any)=>el.click());await expect(action).toBeFocused();await expect(feed(page).locator('en-activity-item')).toHaveCount(2);await expect(feed(page).getByRole('status')).toContainText('1 new update');expect((await action.boundingBox())!.y).toBeCloseTo(before!.y,0);
 const updates=feed(page).getByRole('button',{name:'Show updates (1)'});await updates.click();await expect(feed(page).locator('en-activity-item')).toHaveCount(3);await expect(feed(page).getByRole('button',{name:'Up to date'})).toBeFocused();expect(await feed(page).locator('en-activity-item').nth(1).evaluate(el=>el===(window as any).firstEntry)).toBe(true);
 const snapshot=await feed(page).getByRole('list').ariaSnapshot();await test.info().attach('revealed-activity-accessibility',{body:snapshot,contentType:'text/plain'});expect(snapshot).toContain('listitem');expect(snapshot).toContain('Sam Rivera');expect(snapshot).not.toContain('feed');
});
test('load requests can be vetoed; loading, retry, grouping and empty recovery keep existing content',async({page})=>{
 await load(page);const older=feed(page).getByRole('button',{name:'Load older activity'});await feed(page).evaluate(el=>el.addEventListener('en-action',e=>e.preventDefault(),{once:true}));await older.click();await expect(feed(page)).toHaveJSProperty('loading',false);
 await older.click();await expect(feed(page)).toHaveJSProperty('loading',true);await expect(older).toBeFocused();await expect(feed(page).getByRole('listitem')).toHaveCount(2);await demo(page).getByRole('button',{name:'Fail load',exact:true}).click();await expect(feed(page).getByRole('button',{name:'Retry older activity'})).toBeVisible();await feed(page).getByRole('button',{name:'Retry older activity'}).click();await demo(page).getByRole('button',{name:'Complete load',exact:true}).click();await expect(demo(page).getByRole('list',{name:'September 14 project activity'})).toBeVisible();
 await demo(page).getByRole('button',{name:'Toggle empty state'}).click();await expect(feed(page).getByRole('list')).not.toBeVisible();await expect(feed(page)).toContainText('No activity for this date');await demo(page).getByRole('button',{name:'Toggle empty state'}).click();await expect(feed(page).getByRole('listitem')).toHaveCount(2);
});
test('five themes in mobile RTL stay bounded and expose named controls without axe violations',async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:390,height:844});await load(page);await demo(page).evaluate(el=>el.setAttribute('dir','rtl'));await group(page).getByRole('button').click();
 for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
  await selectLoopTheme(page,theme);await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
  for(const mode of ['light','dark']){await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);const box=await demo(page).boundingBox();expect(box!.width).toBeLessThanOrEqual(390);expect(await demo(page).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await expect(group(page).getByRole('button')).toBeVisible();
   const result=await new AxeBuilder({page}).include('[data-presence-activity-demo]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
  }
 }
 await demo(page).screenshot({path:test.info().outputPath('en-presence-activity-mobile-'+test.info().project.name+'.png')});
 await page.emulateMedia({forcedColors:'active'});await expect(group(page).getByText('Available',{exact:true})).toBeVisible();
});
test('source, API surfaces, styling Parts and Chat integration are reachable',async({page})=>{
 await load(page);await expect(page.getByText('View example code',{exact:false})).toBeVisible();await page.addStyleTag({content:'en-presence::part(base){border-radius:3px} en-activity-feed::part(list){gap:23px}'});expect(await group(page).locator('en-presence').first().locator('.presence').evaluate(el=>getComputedStyle(el).borderRadius)).toBe('3px');expect(await feed(page).getByRole('list').evaluate(el=>getComputedStyle(el).gap)).toBe('23px');
 for(const component of ['en-presence','en-presence-group','en-activity-item','en-activity-feed']){await page.goto(`/api-reference.html?component=${component}`);await expect(page.locator('#api-presence-activity-guide')).toContainText('preventDefault');}
 await page.goto('/workflows/chat.html');await page.getByText('Collaborators and project activity',{exact:true}).click();await expect(demo(page).getByRole('heading',{name:'Cover study collaboration'})).toBeVisible();await expect(group(page).getByRole('button',{name:'Show 2 more collaborators'})).toBeVisible();await demo(page).getByRole('button',{name:'Simulate incoming update'}).click();await expect(feed(page).getByRole('status')).toContainText('1 new update');
});

test('overflow disappearing while focused returns to the named group; customization and localization remain reactive',async({page})=>{
 await load(page);await group(page).getByRole('button').focus();await group(page).evaluate((el:any)=>{el.max=50;});await expect(group(page).getByRole('group',{name:'Cover study collaborators'})).toBeFocused();await group(page).evaluate((el:any)=>{el.max=.5;el.moreLabel='Afficher {count} personnes';});await expect(group(page).getByRole('button',{name:'Afficher 4 personnes'})).toBeVisible();
 await group(page).locator('en-presence').first().evaluate((el:any)=>{el.status='busy';el.statusLabel='In a review';});await expect(group(page).getByText('In a review',{exact:true})).toBeVisible();
});


test('older loading previews the final card geometry at its append position without exposing placeholder actions',async({page})=>{
 test.setTimeout(60000);
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await load(page);
  for(const theme of ['en-reve','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
   await selectLoopTheme(page,theme);
   const older=demo(page).locator('en-activity-feed[label="September 14 project activity"]');
   const count=await older.locator('en-activity-item').count();
   if(count)await older.locator('en-activity-item').first().evaluate(el=>(window as any).retainedOlder=el);
   await feed(page).getByRole('button',{name:'Load older activity'}).click();
   const placeholder=older.locator('[data-activity-placeholder]');await expect(placeholder).toBeVisible();
   await expect(placeholder).toHaveAttribute('inert','');await expect(placeholder.getByRole('button')).toHaveCount(0);await expect(older.getByRole('article')).toHaveCount(count);
   await expect(placeholder.locator('en-skeleton')).toHaveCount(5);
   const geometry=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y+window.scrollY,width:r.width,height:r.height};};
   const before=await placeholder.evaluate(geometry);
   if(width===390&&theme==='en-reve')await older.screenshot({path:test.info().outputPath('en-activity-loading-'+test.info().project.name+'.png')});
   await demo(page).getByRole('button',{name:'Complete load',exact:true}).click();await expect(placeholder).toHaveCount(0);
   const after=await older.locator('en-activity-item').last().evaluate(geometry);
   for(const metric of ['x','y','width','height'] as const)expect(after[metric],`${theme} ${width}px ${metric}`).toBeCloseTo(before[metric],0);
   if(count)expect(await older.locator('en-activity-item').first().evaluate(el=>el===(window as any).retainedOlder)).toBe(true);
  }
 }
});


test('presence href is native navigation before and after hydration with reactive target and rel',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const server=await context.newPage();await server.goto(url);await expect(server.locator('#presence-actions-example').getByRole('link',{name:'Mira Chen Available'})).toHaveAttribute('href','/workflows/assets?progress-report');}finally{await context.close();}
 await load(page);const presence=demo(page).locator('#presence-actions-example en-presence');const link=presence.getByRole('link',{name:'Mira Chen Available'});
 await expect(link).toHaveAttribute('part','base link');await expect(presence.locator('slot[name="actions"]')).toHaveCount(0);await expect(group(page).getByRole('link')).toHaveCount(0);
 await presence.evaluate((el:any)=>{el.target='_blank';el.rel='noopener noreferrer';el.focus();});await expect(link).toBeFocused();await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');
 const popupPromise=page.waitForEvent('popup');await link.press('Enter');const popup=await popupPromise;await popup.waitForURL('**/workflows/assets?progress-report');await popup.close();
 await presence.evaluate((el:any)=>{el.href='';});await expect(presence.getByRole('link')).toHaveCount(0);await expect(presence.locator('.presence[part="base"]')).not.toHaveAttribute('tabindex');
 await presence.evaluate((el:any)=>{el.href='/workflows/assets?progress-report';el.target='';el.rel='';});await expect(link).not.toHaveAttribute('target');await expect(link).not.toHaveAttribute('rel');await link.focus();await link.press('Enter');await page.waitForURL('**/workflows/assets?progress-report');
});

test('linked presence uses theme hover and focus without changing geometry',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);const presence=demo(page).locator('#presence-actions-example en-presence');const link=presence.getByRole('link');
 for(const theme of ['en-reve','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
  await selectLoopTheme(page,theme);await link.scrollIntoViewIfNeeded();await page.mouse.move(0,0);const before=await link.boundingBox();const paint=await link.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderColor}));
  await link.hover();const hover=await link.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderColor}));expect(hover).not.toEqual(paint);expect(await link.boundingBox()).toEqual(before);
  await page.keyboard.press('Tab');await link.focus();await expect(link).toBeFocused();expect(await link.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThan(0);
  if(theme==='en-reve')await presence.screenshot({path:test.info().outputPath('en-presence-href-'+test.info().project.name+'.png')});
 }
 await presence.evaluate(el=>(el as HTMLElement).style.setProperty('--en-presence-hover-background','rgb(12, 34, 56)'));await link.hover();expect(await link.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(12, 34, 56)');
});

test('touch presence does not retain decorative hover paint',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});try{const page=await context.newPage();await load(page);const link=demo(page).locator('#presence-actions-example').getByRole('link');const paint=()=>link.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderColor}));
 expect(await page.evaluate(()=>matchMedia('(hover: hover)').matches)).toBe(false);const before=await paint();await link.hover();expect(await paint()).toEqual(before);
 }finally{await context.close();}
});

test('older activity keeps one contextual loading status mounted through completion, failure and reset',async({page})=>{
 await load(page);const destination=demo(page).getByRole('group',{name:'Older project activity',exact:true});const status=destination.locator('.older-status');await expect(status).toBeEmpty();await status.evaluate(el=>(window as any).olderLiveRegion=el);
 const sameStatus=async()=>expect(await status.evaluate(el=>el===(window as any).olderLiveRegion)).toBe(true);
 const more=feed(page).getByRole('button',{name:'Load older activity'});await more.click();await expect(more).toBeFocused();await expect(status).toHaveText('Loading one older update.');await sameStatus();
 await expect(demo(page).getByRole('status').filter({hasText:'Loading one older update.'})).toHaveCount(1);await expect(destination.getByRole('article')).toHaveCount(0);await expect(destination.getByRole('button')).toHaveCount(0);
 await test.info().attach('older-loading-accessibility',{body:await destination.ariaSnapshot(),contentType:'text/plain'});
 const complete=demo(page).getByRole('button',{name:'Complete load',exact:true});await complete.click();await expect(complete).toBeFocused();await expect(status).toHaveText('Loaded one older update.');await sameStatus();await expect(destination.getByRole('article')).toHaveCount(1);
 await expect(demo(page).getByRole('status').filter({hasText:'Loaded one older update.'})).toHaveCount(1);
 await more.click();const fail=demo(page).getByRole('button',{name:'Fail load',exact:true});await fail.click();await expect(fail).toBeFocused();await expect(status).toContainText('Older activity could not be loaded.');await sameStatus();await expect(destination.getByRole('article')).toHaveCount(1);
 await feed(page).getByRole('button',{name:'Retry older activity'}).click();await expect(status).toHaveText('Loading one older update.');await demo(page).getByRole('button',{name:'Toggle empty state'}).click();await expect(status).toBeEmpty();await sameStatus();await expect(destination.locator('[data-activity-placeholder]')).toHaveCount(0);await expect(feed(page)).toHaveJSProperty('loading',false);
});
