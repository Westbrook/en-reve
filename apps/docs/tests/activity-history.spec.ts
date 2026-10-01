import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url='/api-examples/presence-activity.html';
const demo=(page:Page)=>page.locator('[data-activity-history-demo]');
const feed=(page:Page)=>page.locator('#large-activity-history');
const viewport=(page:Page)=>feed(page).locator('[part="viewport"]');
const row=(page:Page,key:string)=>feed(page).locator(`[data-en-virtual-key="${key}"]`);
async function load(page:Page){await page.goto(url);await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await feed(page).evaluate(async(el:any)=>{await el.ownerDocument.defaultView.customElements.whenDefined(el.localName);await el.updateComplete;});await expect(feed(page)).toHaveJSProperty('mode','virtual');await expect.poll(()=>feed(page).evaluate((el:any)=>el.items.length)).toBe(160);}
async function reveal(page:Page,key:string){await feed(page).evaluate((el:any,key)=>el.scrollToKey(key,{block:'center',behavior:'instant',container:'nearest'}),key);await expect.poll(async()=>{const target=await row(page,key).boundingBox(),port=await viewport(page).boundingBox();return !!target&&!!port&&target.y<port.y+port.height&&target.y+target.height>port.y;}).toBe(true);}
async function readingAnchor(page:Page){return feed(page).evaluate((el:any)=>{const port=el.scrollElement.getBoundingClientRect();const row=Array.from(el.shadowRoot.querySelectorAll('[data-en-virtual-key]')).find((row:any)=>{const r=row.getBoundingClientRect();return r.bottom>port.top+1&&r.top<port.bottom;}) as HTMLElement;return {key:row.dataset.enVirtualKey!,top:row.getBoundingClientRect().top-port.top};});}

test('virtual history is bounded, keyed and a regular list with current group context',async({page})=>{
 await load(page);await expect.poll(()=>feed(page).getByRole('listitem').count()).toBeLessThan(20);await expect(feed(page).getByRole('listitem')).not.toHaveCount(0);await expect(feed(page).getByRole('feed')).toHaveCount(0);
 await reveal(page,'history-119');await expect(row(page,'history-119')).toHaveAttribute('aria-posinset','120');await expect(row(page,'history-119')).toHaveAttribute('aria-setsize','160');await expect(row(page,'history-119').getByRole('listitem')).toHaveCount(0);await expect(feed(page).locator('[part="group-context"]')).not.toBeEmpty();
 const snapshot=await feed(page).getByRole('list').ariaSnapshot();expect(snapshot).toContain('Activity 120');await test.info().attach('activity-virtual-scrolled',{body:snapshot,contentType:'text/plain'});
});

test('buffering and explicit prepend preserve a visible key, its DOM identity and reading offset',async({page})=>{
 await load(page);await reveal(page,'history-79');const anchor=await readingAnchor(page);await row(page,anchor.key).evaluate(el=>(window as any).historyAnchor=el);
 await feed(page).evaluate((el:any)=>{el.bufferItems([{key:'new-a',author:'Mira',text:'A buffered update',group:'New group'}]);});await expect(feed(page)).toHaveJSProperty('pendingCount',1);expect(await feed(page).evaluate((el:any)=>el.items.length)).toBe(160);expect((await readingAnchor(page)).key).toBe(anchor.key);
 await feed(page).evaluate((el:any)=>el.showUpdates());await expect(feed(page)).toHaveJSProperty('pendingCount',0);await expect.poll(async()=>Math.abs((await readingAnchor(page)).top-anchor.top)).toBeLessThan(2);expect((await readingAnchor(page)).key).toBe(anchor.key);expect(await row(page,anchor.key).evaluate(el=>el===(window as any).historyAnchor)).toBe(true);
 await feed(page).evaluate((el:any)=>{el.bufferItems([{key:'new-a',author:'Mira',text:'Revised update'}]);el.bufferItems([{key:'new-a',author:'Mira',text:'Latest update'}]);el.showUpdates();});expect(await feed(page).evaluate((el:any)=>el.items.filter((item:any)=>item.key==='new-a').length)).toBe(1);expect(await feed(page).evaluate((el:any)=>el.items[0].text)).toBe('Latest update');
});

test('focused entries and their sequential neighbors stay mounted when the window scrolls away',async({page})=>{
 await load(page);await reveal(page,'history-40');const button=row(page,'history-40').getByRole('button');await button.focus();await row(page,'history-40').evaluate(el=>(window as any).retainedHistory=el);await reveal(page,'history-119');await expect(button).toBeFocused();expect(await row(page,'history-40').evaluate(el=>el===(window as any).retainedHistory)).toBe(true);await page.keyboard.press('Tab');await expect(row(page,'history-41').getByRole('button')).toBeFocused();
 await test.info().attach('activity-focused-offscreen',{body:await feed(page).getByRole('list').ariaSnapshot(),contentType:'text/plain'});
});

test('paged reading mounts every page entry with stable order and does not window during scroll',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>{el.mode='paged';el.page=3;});await expect(feed(page).getByRole('listitem')).toHaveCount(20);await expect(row(page,'history-40')).toBeVisible();await expect(row(page,'history-59')).toBeVisible();await expect(feed(page).locator('[data-en-virtual-gap]')).toHaveCount(0);await expect(feed(page).getByRole('navigation')).toContainText('Page 3 of 8');
 const keys=await feed(page).locator('[data-en-virtual-key]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-en-virtual-key')));await row(page,'history-59').scrollIntoViewIfNeeded();expect(await feed(page).locator('[data-en-virtual-key]').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-en-virtual-key')))).toEqual(keys);
 const older=feed(page).getByRole('button',{name:'Older page',exact:true});await older.click();await expect(older).toBeFocused();await expect(row(page,'history-60')).toBeVisible();await expect(feed(page).getByRole('listitem')).toHaveCount(20);
 await feed(page).evaluate((el:any)=>el.scrollToKey('history-5',{block:'nearest'}));await expect(feed(page).getByRole('navigation')).toContainText('Page 1 of 8');await expect(row(page,'history-5')).toBeVisible();
 await test.info().attach('activity-paged-complete',{body:await feed(page).getByRole('list').ariaSnapshot(),contentType:'text/plain'});
});

test('cancelable requests, aborted stale results, retry and keyed append preserve loaded records',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>{(window as any).loads=[];el.addEventListener('en-load',(event:any)=>(window as any).loads.push(event.detail));});
 await feed(page).getByRole('button',{name:'Load older activity',exact:true}).click();await expect(feed(page)).toHaveJSProperty('loading',true);await expect(feed(page).getByRole('button',{name:'Cancel loading'})).toBeVisible();await feed(page).getByRole('button',{name:'Cancel loading'}).click();await expect(feed(page)).toHaveJSProperty('loading',false);await expect(feed(page).getByRole('button',{name:'Load older activity',exact:true})).toBeFocused();expect(await page.evaluate(()=>(window as any).loads[0].signal.aborted)).toBe(true);
 await page.evaluate(()=>(window as any).loads[0].complete({items:[{key:'stale',author:'Old',text:'Stale result'}],hasMore:false}));expect(await feed(page).evaluate((el:any)=>el.items.length)).toBe(160);
 await feed(page).getByRole('button',{name:'Load older activity',exact:true}).click();await demo(page).getByRole('button',{name:'Fail older page'}).click();await expect(feed(page).getByRole('button',{name:'Retry older activity'})).toBeVisible();await expect(feed(page)).toHaveJSProperty('loading',false);await expect(feed(page).getByRole('status')).toHaveCount(1);expect(await feed(page).evaluate((el:any)=>el.items.length)).toBe(160);
 await feed(page).getByRole('button',{name:'Retry older activity'}).click();await demo(page).getByRole('button',{name:'Complete older page'}).click();await expect.poll(()=>feed(page).evaluate((el:any)=>el.items.length)).toBe(200);await expect(feed(page)).toHaveJSProperty('cursor','200');await demo(page).getByRole('button',{name:'Buffer new activity'}).click();await expect(feed(page)).toHaveJSProperty('pendingCount',1);expect(await feed(page).evaluate((el:any)=>el.items.length)).toBe(200);await reveal(page,'history-199');await expect(row(page,'history-199')).toHaveAttribute('aria-posinset','200');
});

test('cancellation and authoritative same-value writes win over interaction proposals',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>{el.bufferItems([{key:'queued',author:'Mira',text:'Queued'}]);el.addEventListener('en-action',()=>{el.items=el.items;},{once:true});el.showUpdates();});await expect(feed(page)).toHaveJSProperty('pendingCount',1);expect(await feed(page).evaluate((el:any)=>el.items[0].key)).toBe('history-0');
 await feed(page).evaluate((el:any)=>{el.mode='paged';el.addEventListener('en-page-change',()=>{el.page=el.page;},{once:true});el.goToPage(2);});await expect(feed(page)).toHaveJSProperty('page',2);
 await feed(page).evaluate((el:any)=>{el.addEventListener('en-load',(event:Event)=>event.preventDefault(),{once:true});el.requestOlder();});await expect(feed(page)).toHaveJSProperty('loading',false);
 await feed(page).evaluate((el:any)=>{el.addEventListener('en-load',()=>el.cancelLoad(),{once:true});el.requestOlder();});await expect(feed(page)).toHaveJSProperty('loading',false);
 await feed(page).evaluate((el:any)=>{el.addEventListener('en-load',()=>el.remove(),{once:true});el.requestOlder();(window as any).removedActivity=el;});expect(await page.evaluate(()=>(window as any).removedActivity.loading)).toBe(false);
});

test('external replacement aborts pending requests and invalid duplicate keys fail atomically',async({page})=>{
 await load(page);const result=await feed(page).evaluate((el:any)=>{const before=el.items;try{el.items=[before[0],before[0]];}catch{}return el.items===before;});expect(result).toBe(true);
 await feed(page).evaluate((el:any)=>{el.addEventListener('en-load',(event:any)=>(window as any).oldRequest=event.detail,{once:true});el.requestOlder();el.items=[{key:'replacement',author:'New',text:'Replacement history'}];});await expect(feed(page)).toHaveJSProperty('loading',false);expect(await page.evaluate(()=>(window as any).oldRequest.signal.aborted)).toBe(true);await page.evaluate(()=>(window as any).oldRequest.complete({items:[{key:'wrong',author:'Old',text:'Wrong'}],hasMore:false}));expect(await feed(page).evaluate((el:any)=>el.items.map((item:any)=>item.key))).toEqual(['replacement']);
});

test('focused removal and mode/page transitions recover focus within the history',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>{el.mode='paged';el.page=3;});await row(page,'history-45').getByRole('button').focus();await feed(page).evaluate((el:any)=>el.items=el.items.filter((item:any)=>item.key!=='history-45'));await expect(row(page,'history-46').getByRole('article')).toBeFocused();
 await row(page,'history-46').getByRole('button').focus();await feed(page).evaluate((el:any)=>el.goToPage(1));await expect(viewport(page)).toBeFocused();
 await feed(page).evaluate((el:any)=>el.mode='virtual');await reveal(page,'history-119');await row(page,'history-119').getByRole('button').focus();await feed(page).evaluate((el:any)=>el.mode='paged');await expect(row(page,'history-119').getByRole('button')).toBeFocused();await expect(feed(page).getByRole('listitem')).toHaveCount(20);
});

test('data empty mode preserves the authored API when items is removed',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>el.items=[]);await expect(feed(page).getByRole('listitem')).toHaveCount(0);await expect(feed(page).getByText('No activity has been loaded.')).toBeVisible();
 await feed(page).evaluate((el:any)=>{el.items=undefined;el.insertAdjacentHTML('beforeend','<en-activity-item author="Authored">Authored history remains supported.</en-activity-item>');});await expect(feed(page).getByRole('listitem')).toHaveCount(1);await expect(feed(page)).toContainText('Authored history remains supported.');
});

test('mobile RTL and themed data history remains bounded with meaningful accessible names',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);await demo(page).evaluate(el=>el.setAttribute('dir','rtl'));
 for(const theme of ['en-reve','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);await reveal(page,'history-40');expect(await demo(page).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await expect(row(page,'history-40').getByRole('button')).toHaveAccessibleName('Review update history-40');}
 const result=await new AxeBuilder({page}).include('[data-activity-history-demo]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);await demo(page).screenshot({path:test.info().outputPath(`en-activity-history-${test.info().project.name}.png`)});
});

test('settling while Cancel is focused recovers focus to the exhausted viewport',async({page})=>{
 await load(page);await feed(page).evaluate((el:any)=>{el.addEventListener('en-load',(event:any)=>(window as any).settleRequest=event.detail,{once:true});el.requestOlder();});await feed(page).getByRole('button',{name:'Cancel loading'}).focus();await page.evaluate(()=>(window as any).settleRequest.complete({items:[],hasMore:false}));await expect(feed(page)).toHaveJSProperty('loading',false);await expect(viewport(page)).toBeFocused();await expect(feed(page).getByRole('button',{name:'Load older activity',exact:true})).toBeDisabled();
});

for (const externalScroll of [false, true]) {
 test(externalScroll
  ? 'an external instant scroll keeps ownership while a generated-row reveal settles'
  : 'an instant tail reveal stays visible after generated overscan rows render', async ({page}, info) => {
  await load(page);
  await feed(page).getByRole('button',{name:'Load older activity',exact:true}).click();
  await demo(page).getByRole('button',{name:'Complete older page'}).click();
  await expect.poll(()=>feed(page).evaluate((el:any)=>el.items.length)).toBe(200);
  await demo(page).getByRole('button',{name:'Buffer new activity'}).click();
  await expect(feed(page)).toHaveJSProperty('pendingCount',1);
  const observed=await feed(page).evaluate(async(el:any,externalScroll)=>{
   const port=el.scrollElement as HTMLElement;
   const samples:{top:number;targetVisible:boolean;firstVisible:boolean;mounted:number}[]=[];
   let interrupted=false;
   const accepted=el.scrollToKey('history-199',{block:'center',behavior:'instant',container:'nearest'});
   // Observe subsequent paints, including the generated children's own Lit
   // updates: one transient overlap must not stand in for a completed reveal.
   for(let frame=0;frame<24;frame++){
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    await el.updateComplete;
    await Promise.all(Array.from(el.shadowRoot.querySelectorAll('en-activity-item'),(child:any)=>child.updateComplete));
    if(externalScroll&&!interrupted&&port.scrollTop>port.clientHeight){
     port.scrollTo({top:0,behavior:'instant'});
     interrupted=true;
    }
    const bounds=port.getBoundingClientRect();
    const visible=(key:string)=>{
     const target=el.shadowRoot.querySelector(`[data-en-virtual-key="${key}"]`) as HTMLElement|null;
     if(!target)return false;
     const rect=target.getBoundingClientRect();
     return rect.top<bounds.bottom&&rect.bottom>bounds.top;
    };
    samples.push({top:port.scrollTop,targetVisible:visible('history-199'),firstVisible:visible('history-0'),mounted:el.shadowRoot.querySelectorAll('[data-en-virtual-key]').length});
   }
   return {accepted,interrupted,samples};
  },externalScroll);
  await info.attach('activity-tail-reveal-frames',{body:JSON.stringify(observed,null,2),contentType:'application/json'});
  expect(observed.accepted).toBe(true);
  expect(observed.interrupted).toBe(externalScroll);
  for(const sample of observed.samples.slice(-8)){
   expect(sample.mounted).toBeLessThan(20);
   if(externalScroll){
    expect(sample.top).toBeLessThan(1);
    expect(sample.firstVisible).toBe(true);
    expect(sample.targetVisible).toBe(false);
   }else{
    expect(sample.targetVisible).toBe(true);
   }
  }
  expect(await feed(page).evaluate((el:any)=>el.items.length)).toBe(200);
  await expect(feed(page)).toHaveJSProperty('pendingCount',1);
  if(!externalScroll)await expect(row(page,'history-199')).toHaveAttribute('aria-posinset','200');
 });
}
