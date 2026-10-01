import {test,expect,type Page} from '@playwright/test';
const demo=(page:Page)=>page.locator('document-scroll-demo');
async function ready(page:Page,element=false){await page.goto('/apps/docs/document-scroll.html'+(element?'?element':''));await expect(demo(page).getByRole('button',{name:'Record 0',exact:true})).toBeVisible();}
async function reveal(page:Page,key='row-150',behavior='instant'){await demo(page).evaluate((el:any,{key,behavior})=>el.controller.scrollToKey(key,{behavior,block:'start'}),{key,behavior});await expect.poll(()=>demo(page).locator(`[data-en-virtual-key="${key}"]`).evaluate((row:HTMLElement)=>Math.round(row.getBoundingClientRect().top))).toBe(48);}
async function anchor(page:Page){return demo(page).evaluate((el:any)=>{const rows=[...el.shadowRoot.querySelectorAll('[data-en-virtual-key]')] as HTMLElement[];const row=rows.find(r=>r.getBoundingClientRect().bottom>48)!;return {key:row.dataset.enVirtualKey!,top:row.getBoundingClientRect().top,y:scrollY};});}
test('document geometry preserves active anchor for preceding layout and changing row heights',async({page})=>{
 await ready(page);await reveal(page);const old=await anchor(page);
 // Keep total page height constant: a root ResizeObserver alone cannot detect this shift.
 await page.evaluate(()=>{(document.querySelector('#before') as HTMLElement).style.height='1080px';(document.querySelector('#after') as HTMLElement).style.height='820px';});
 await expect.poll(async()=>Math.round((await anchor(page)).y-old.y)).toBe(180);expect((await anchor(page)).key).toBe(old.key);
 await demo(page).evaluate((el:any)=>{el.large=true;});await expect.poll(()=>demo(page).locator(`[data-en-virtual-key="${old.key}"]`).evaluate((el:HTMLElement)=>Math.round(el.getBoundingClientRect().top))).toBe(Math.round(old.top));
 expect(await demo(page).locator('[data-en-virtual-key]').count()).toBeLessThan(50);
});
test('offscreen collection does not capture document scroll; entry and exit reset anchors',async({page})=>{
 await ready(page);await page.locator('#before').evaluate((el:HTMLElement)=>{el.style.height='1200px';});await page.waitForTimeout(150);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await reveal(page);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
 await page.locator('#before').evaluate((el:HTMLElement)=>{el.style.height='1400px';});await demo(page).evaluate((el:any)=>{el.large=true;});await page.waitForTimeout(150);expect(await page.evaluate(()=>scrollY)).toBe(0);
 await reveal(page);await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(150);await page.evaluate(()=>document.querySelector('#after')!.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(150);expect(await demo(page).evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThan(48);const bottom=await page.evaluate(()=>scrollY);await page.locator('#before').evaluate((el:HTMLElement)=>{el.style.height='1450px';});await page.waitForTimeout(150);expect(await page.evaluate(()=>scrollY)).toBe(bottom);
});
test('smooth reveal honors sticky insets and wheel interruption',async({page})=>{
 await ready(page);await reveal(page,'row-80','smooth');
 await demo(page).evaluate((el:any)=>el.controller.scrollToKey('row-350',{behavior:'smooth',block:'end'}));await page.waitForTimeout(60);await page.mouse.move(200,300);await page.mouse.wheel(0,160);await page.waitForTimeout(600);const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(300);expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(2);expect(y).toBeLessThan(16000);
 await demo(page).evaluate((el:any)=>el.controller.scrollToKey('row-300',{behavior:'instant',block:'end'}));await expect.poll(()=>demo(page).locator('[data-en-virtual-key="row-300"]').evaluate((el:HTMLElement)=>Math.round(innerHeight-el.getBoundingClientRect().bottom))).toBe(24);
});
test('focused row survives scrolling; removal recovers focus and teardown restores styles',async({page})=>{
 await ready(page);await reveal(page,'row-20');await demo(page).getByRole('button',{name:'Record 20',exact:true}).focus();await reveal(page,'row-200');await expect(demo(page).getByRole('button',{name:'Record 20',exact:true})).toBeFocused();
 await demo(page).evaluate((el:any)=>el.removeRecord('row-20'));await expect(demo(page).locator('ul')).toBeFocused();
 const result=await demo(page).evaluate((el:any)=>{el.controller.hostDisconnected();const viewport=document.scrollingElement as HTMLElement;viewport.style.setProperty('overflow-anchor','auto','important');el.controller.hostConnected();el.controller.hostUpdated();const owned=viewport.style.getPropertyValue('overflow-anchor');el.controller.hostDisconnected();return {owned,value:viewport.style.getPropertyValue('overflow-anchor'),priority:viewport.style.getPropertyPriority('overflow-anchor'),tabindex:el.shadowRoot.querySelector('ul').getAttribute('tabindex')};});expect(result).toEqual({owned:'none',value:'auto',priority:'important',tabindex:null});
 const revision=await demo(page).evaluate((el:any)=>el.model.revision.get());await page.evaluate(()=>{(document.scrollingElement as HTMLElement).style.setProperty('overflow-anchor','none');scrollTo(0,0);(document.querySelector('#before') as HTMLElement).style.height='1800px';});await page.waitForTimeout(180);expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await demo(page).evaluate((el:any)=>el.model.revision.get())).toBe(revision);
});
test('element scrollports retain bounded rendering, reveal and height anchoring',async({page})=>{
 await ready(page,true);await demo(page).evaluate((el:any)=>el.controller.scrollToKey('row-100',{behavior:'instant',block:'start'}));
 const row=demo(page).locator('[data-en-virtual-key="row-100"]');await expect(row).toBeAttached();await expect.poll(()=>row.evaluate((row:HTMLElement)=>Math.round(row.getBoundingClientRect().top-row.closest('.viewport')!.getBoundingClientRect().top))).toBe(48);
 const before=await demo(page).locator('.viewport').evaluate((el:HTMLElement)=>el.scrollTop);await demo(page).evaluate((el:any)=>{el.large=true;});await expect.poll(()=>row.evaluate((row:HTMLElement)=>Math.round(row.getBoundingClientRect().top-row.closest('.viewport')!.getBoundingClientRect().top))).toBe(48);expect(await demo(page).locator('.viewport').evaluate((el:HTMLElement)=>el.scrollTop)).toBeGreaterThanOrEqual(before);expect(await demo(page).locator('[data-en-virtual-key]').count()).toBeLessThan(50);
});
