import {test,expect,type Locator} from '@playwright/test';
const configure=(host:Locator,values:Record<string,unknown>)=>host.evaluate((n,v)=>(n as any).configure(v),values);
const enqueue=(host:Locator,values:Record<string,unknown>={})=>host.evaluate((n,v)=>(n as any).enqueue(v),values);
const notice=(host:Locator,id:string)=>host.locator(`consumer-notice[data-id="${id}"]`);
const dismiss=(host:Locator,id:string)=>notice(host,id).getByRole('button',{name:`Dismiss notification ${id}`});
const visible=(host:Locator)=>host.locator('consumer-notice:not([hidden])').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.id));
for(const delivery of ['lit','css'])test.describe(delivery,()=>{
 test.beforeEach(async({page})=>{await page.goto('/?delivery='+delivery);await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
 test('maximum admits three complete messages, with queued controls absent from the accessibility tree',async({page})=>{
  const h=page.locator('consumer-notification').first();for(let n=0;n<5;n++)await h.getByRole('button',{name:'Add notification',exact:true}).click();expect(await visible(h)).toEqual(['1','2','3']);await expect(h.locator('.en-toast-region__summary')).toHaveText('2 queued');await expect(h.getByRole('article')).toHaveCount(3);await expect(dismiss(h,'4')).not.toBeVisible();const snapshot=await h.getByRole('region',{name:'Notifications',exact:true}).ariaSnapshot();expect(snapshot).toContain('article "Notification 1"');expect(snapshot).not.toContain('Dismiss notification 4');
 });
 test('dismissal promotes the next arrival without changing the other messages',async({page})=>{
  const h=page.locator('consumer-notification').first();for(let n=0;n<5;n++)await enqueue(h);await dismiss(h,'2').click();expect(await visible(h)).toEqual(['1','3','4']);await dismiss(h,'1').click();expect(await visible(h)).toEqual(['3','4','5']);await expect(h.locator('.en-toast-region__summary')).toBeHidden();
 });
 test('an interrupt becomes the first DOM message and a displaced message remains queued',async({page})=>{
  const h=page.locator('consumer-notification').first();await configure(h,{max:2});for(let n=0;n<3;n++)await enqueue(h);await enqueue(h,{interrupt:true,text:'Urgent arrival'});expect(await visible(h)).toEqual(['4','1']);expect(await h.locator('consumer-notice').evaluateAll(ns=>ns.map(n=>(n as HTMLElement).dataset.id))).toEqual(['4','1','2','3']);await dismiss(h,'4').click();expect(await visible(h)).toEqual(['1','2']);
 });
 test('focused messages stay admitted during an interrupt and release the slot after focus leaves',async({page})=>{
  const h=page.locator('consumer-notification').first();await configure(h,{max:1});await enqueue(h,{action:true});await notice(h,'1').getByRole('button',{name:'Retry operation'}).focus();await enqueue(h,{interrupt:true});expect(await visible(h)).toEqual(['1']);await expect(notice(h,'1').getByRole('button',{name:'Retry operation'})).toBeFocused();await h.getByRole('button',{name:'Add notification',exact:true}).focus();await expect(notice(h,'2')).toBeVisible();expect(await visible(h)).toEqual(['2']);
 });
 test('dynamic bounds update admission and zero makes the queue unbounded',async({page})=>{
  const h=page.locator('consumer-notification').first();for(let n=0;n<4;n++)await enqueue(h);await configure(h,{max:1.8});expect(await visible(h)).toEqual(['1']);await configure(h,{max:0});expect(await visible(h)).toEqual(['1','2','3','4']);await configure(h,{max:2});expect(await visible(h)).toEqual(['1','2']);
 });
 test('dismissal is cancelable without removing the message or its action focus',async({page})=>{
  const h=page.locator('consumer-notification').first();await enqueue(h,{action:true});await configure(h,{veto:true});await dismiss(h,'1').focus();await dismiss(h,'1').press('Enter');await expect(dismiss(h,'1')).toBeFocused();expect(await visible(h)).toEqual(['1']);await expect(h.locator('summary')).toHaveText('Notification history (0)');await configure(h,{veto:false});await dismiss(h,'1').press('Enter');await expect(notice(h,'1')).toHaveCount(0);
 });
 test('Escape dismisses the focused message and recovers focus to the next control or launcher',async({page})=>{
  const h=page.locator('consumer-notification').first();await enqueue(h);await enqueue(h);await dismiss(h,'1').focus();await dismiss(h,'1').press('Escape');await expect(dismiss(h,'2')).toBeFocused();await dismiss(h,'2').press('Escape');await expect(h.getByRole('button',{name:'Add notification',exact:true})).toBeFocused();
 });
 test('queued controls do not enter native Tab order',async({page})=>{
  const h=page.locator('consumer-notification').first();await configure(h,{max:1});await enqueue(h);await enqueue(h,{action:true});await dismiss(h,'1').focus();await dismiss(h,'1').press('Tab');await expect(h.locator('summary')).toBeFocused();
 });
 test('admission announces once while non-live history remains readable and safely escaped',async({page})=>{
  const h=page.locator('consumer-notification').first();await configure(h,{max:1});await enqueue(h,{text:'<img src=x onerror=alert(1)>'});await enqueue(h,{text:'Second message'});await expect(h.getByRole('status',{name:'Notification announcements'})).toHaveText('<img src=x onerror=alert(1)>');await dismiss(h,'1').click();await expect(h.getByRole('status',{name:'Notification announcements'})).toHaveText('Second message');await h.locator('summary').click();await expect(h.locator('details li')).toHaveText('<img src=x onerror=alert(1)>');await expect(h.locator('img')).toHaveCount(0);await expect(h.locator('details')).not.toHaveAttribute('aria-live');
 });
 test('notification instances keep admission and history independent',async({page})=>{
  const h=page.locator('consumer-notification').first(),other=page.locator('consumer-notification').nth(1);await enqueue(h);await enqueue(other,{text:'Independent'});await dismiss(h,'1').click();await expect(notice(other,'1')).toBeVisible();await expect(other.locator('summary')).toHaveText('Notification history (0)');
 });
 test('timed messages have a five second minimum and queued time does not consume their budget',async({page})=>{
  await page.clock.install();const h=page.locator('consumer-notification').first();await configure(h,{max:1});await enqueue(h);await enqueue(h,{duration:1,text:'Saved'});await page.clock.runFor(9000);await dismiss(h,'1').click();await h.getByRole('button',{name:'Add notification',exact:true}).focus();await page.mouse.move(0,0);await page.clock.runFor(4900);await expect(notice(h,'2')).toBeVisible();await page.clock.runFor(200);await expect(notice(h,'2')).toHaveCount(0);
 });
 test('reading duration grows with content and actions stay persistent',async({page})=>{
  await page.clock.install();const h=page.locator('consumer-notification').first();await enqueue(h,{duration:1,text:'x'.repeat(200)});await enqueue(h,{duration:1,text:'Act now',action:true});await page.clock.runFor(13000);await expect(notice(h,'1')).toBeVisible();await page.clock.runFor(1100);await expect(notice(h,'1')).toHaveCount(0);await expect(notice(h,'2')).toBeVisible();await notice(h,'2').getByRole('button',{name:'Retry operation'}).click();await expect(h.getByRole('status',{name:'Action feedback'})).toHaveText('Retried 2');
 });
 test('focus and hover pause a budget, and leaving resumes its remaining duration',async({page})=>{
  await page.clock.install();const h=page.locator('consumer-notification').first();await enqueue(h,{duration:5000,text:'Saved'});await page.clock.runFor(2000);await dismiss(h,'1').focus();await page.clock.runFor(9000);await expect(notice(h,'1')).toBeVisible();await notice(h,'1').hover();await h.getByRole('button',{name:'Add notification',exact:true}).focus();await page.clock.runFor(9000);await expect(notice(h,'1')).toBeVisible();await page.mouse.move(0,0);await page.clock.runFor(2900);await expect(notice(h,'1')).toBeVisible();await page.clock.runFor(200);await expect(notice(h,'1')).toHaveCount(0);
 });
 test('interruption resets a displaced timer when that message becomes featured again',async({page})=>{
  await page.clock.install();const h=page.locator('consumer-notification').first();await configure(h,{max:1});await enqueue(h,{duration:5000,text:'Saved'});await page.clock.runFor(3000);await enqueue(h,{interrupt:true});await page.clock.runFor(9000);await dismiss(h,'2').click();await h.getByRole('button',{name:'Add notification',exact:true}).focus();await page.mouse.move(0,0);await page.clock.runFor(4900);await expect(notice(h,'1')).toBeVisible();await page.clock.runFor(200);await expect(notice(h,'1')).toHaveCount(0);
 });
 test('disconnect clears owned timers and reconnect starts a fresh visible budget',async({page})=>{
  await page.clock.install();const h=page.locator('consumer-notification').first();await enqueue(h,{duration:5000,text:'Saved'});await h.evaluate(n=>{(window as any).detachedNotification=n;n.remove();});await page.clock.runFor(9000);expect(await page.evaluate(()=>(window as any).detachedNotification.history.length)).toBe(0);await page.evaluate(()=>document.querySelector('main')!.prepend((window as any).detachedNotification));await page.clock.runFor(4900);await expect(notice(h,'1')).toBeVisible();await page.clock.runFor(200);await expect(notice(h,'1')).toHaveCount(0);
 });
 test('icon, message and dismissal align on the first row while actions occupy the second',async({page})=>{
  const h=page.locator('consumer-notification').first();await enqueue(h,{text:'Saved',action:true});const child=notice(h,'1');for(const selector of ['.en-toast__icon','.en-toast__content','.en-toast__close'])await expect(child.locator(selector)).toHaveCSS('grid-row-start','1');await expect(child.locator('.en-toast__actions')).toHaveCSS('grid-row-start','2');const boxes=await Promise.all(['.en-toast__icon','.en-toast__content','.en-toast__close'].map(s=>child.locator(s).boundingBox()));const centers=boxes.map(b=>b!.y+b!.height/2);expect(Math.max(...centers)-Math.min(...centers)).toBeLessThan(1);
 });
 test('variant and radius pins remain local to their notification scope',async({page})=>{
  const h=page.locator('consumer-notification').first(),other=page.locator('consumer-notification').nth(1);await h.evaluate(n=>{(n as HTMLElement).style.setProperty('--en-toast-danger-background','rgb(90, 20, 30)');(n as HTMLElement).style.setProperty('--en-toast-radius','17px');});await enqueue(h,{variant:'danger'});await enqueue(other,{variant:'danger'});await expect(notice(h,'1').locator('.en-toast')).toHaveCSS('background-color','rgb(90, 20, 30)');await expect(notice(h,'1').locator('.en-toast')).toHaveCSS('border-radius','17px');expect(await notice(other,'1').locator('.en-toast').evaluate(n=>getComputedStyle(n).borderRadius)).not.toBe('17px');
 });
 test('fixed logical placement supports all corners and centers including RTL on a narrow viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});const h=page.locator('consumer-notification').first();await enqueue(h,{text:'a'.repeat(120)});for(const placement of ['block-start-start','block-start-end','block-start-center','block-end-start','block-end-end','block-end-center']){await h.evaluate((n,p)=>n.setAttribute('placement',p),placement);await expect(h).toHaveCSS('position','fixed');const box=await h.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(390);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(844);}
  await h.evaluate(n=>{n.setAttribute('placement','block-start-start');n.setAttribute('dir','rtl');n.style.setProperty('--en-toast-region-width','200px');});const box=await h.boundingBox();expect(box!.x).toBeGreaterThan(170);expect(await notice(h,'1').locator('.en-toast__content').evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);
 });
 test('reduced motion removes toast and standalone spinner animations',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const h=page.locator('consumer-notification').first();await enqueue(h);await expect(notice(h,'1').locator('.en-toast')).toHaveCSS('animation-name','none');await expect(h.locator('consumer-loading .en-spinner')).toHaveCSS('animation-name','none');
 });
 test('feedback controls use native progress semantics and loading alternatives omit decorative skeletons',async({page})=>{
  const h=page.locator('consumer-notification').first();await expect(h.getByRole('progressbar',{name:'Upload progress'})).toHaveAttribute('value','25');await expect(h.getByRole('progressbar',{name:'Processing progress'})).toHaveAttribute('aria-valuenow','25');await h.getByRole('button',{name:'Complete progress'}).click();await expect(h.getByRole('progressbar',{name:'Upload progress'})).toHaveAttribute('value','100');await expect(h.getByRole('progressbar',{name:'Processing progress'})).toHaveAttribute('aria-valuenow','100');await expect(h.getByRole('region',{name:'Activity preview'})).toHaveAttribute('aria-busy','true');expect(await h.locator('consumer-loading').ariaSnapshot()).not.toContain('skeleton');await h.getByRole('button',{name:'Toggle loading'}).click();await expect(h.getByRole('region',{name:'Activity preview'})).toHaveAttribute('aria-busy','false');await expect(h.getByRole('status',{name:'Activity loading'})).toHaveText('Activity loaded.');
 });
 test('alert dismissal is local and native loading geometry uses scoped size pins',async({page})=>{
  const h=page.locator('consumer-notification').first(),other=page.locator('consumer-notification').nth(1);await h.getByRole('button',{name:'Dismiss connection warning'}).click();await expect(h.locator('.en-alert')).toBeHidden();await expect(other.locator('.en-alert')).toBeVisible();const circle=h.locator('consumer-loading .avatar');await expect(circle).toHaveCSS('width','40px');await expect(circle).toHaveCSS('height','40px');await expect(h.locator('consumer-loading .bar')).toHaveCSS('height','16px');await expect(h.locator('consumer-loading [data-shape=rectangle]')).toHaveCSS('height','28px');
 });
 test('forced colors retain notification borders and native progress discoverability',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});const h=page.locator('consumer-notification').first();await enqueue(h,{variant:'danger'});await expect(notice(h,'1').locator('.en-toast')).toHaveCSS('border-top-style','solid');await expect(h.locator('.en-alert')).toHaveCSS('border-top-style','solid');await expect(h.getByRole('progressbar',{name:'Upload progress'})).toBeVisible();await dismiss(h,'1').focus();await expect(dismiss(h,'1')).toBeFocused();
 });
 test('native feedback swatches size their own wrapper without constraining the surrounding shadow host',async({page})=>{
  const h=page.locator('consumer-notification').first();expect((await h.boundingBox())!.width).toBeGreaterThan(500);const sample=h.getByRole('button',{name:'Choose sample color'});const box=await sample.boundingBox();expect(box!.width).toBeCloseTo(box!.height,1);expect(box!.width).toBeGreaterThan(24);await h.locator('.en-swatch').evaluate(n=>(n as HTMLElement).style.setProperty('--en-swatch-size','96px'));await expect(sample).toHaveCSS('width','96px');await expect(sample).toHaveCSS('height','96px');await sample.click();await expect(h.getByRole('status',{name:'Action feedback'})).toHaveText('Sample chosen');
 });

});
