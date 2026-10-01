import {test,expect,type Page} from '@playwright/test';
const mount=async(page:Page,markup:string)=>{await page.goto('/packages/elements/src/patterns/tests/fixture.html');await page.waitForFunction(()=>!!customElements.get('en-query-builder'));await page.locator('#fixture').evaluate((el,html)=>el.innerHTML=html,markup);};
for(const dir of ['ltr','rtl']) for(const orientation of ['horizontal','vertical']) test(`joined toggle geometry and selection ${dir} ${orientation}`,async({page})=>{
 await mount(page,`<en-toggle-group joined dir="${dir}" orientation="${orientation}" label="Alignment"></en-toggle-group>`);
 const host=page.locator('en-toggle-group');await host.evaluate((el:any)=>el.items=[{value:'a',label:'Start'},{value:'hidden',label:'Hidden',hidden:true},{value:'b',label:'Center'},{value:'c',label:'End'}]);
 const buttons=host.getByRole('button');await expect(buttons).toHaveCount(3);
 const geometry=await buttons.evaluateAll(els=>els.map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,radii:[s.borderStartStartRadius,s.borderStartEndRadius,s.borderEndStartRadius,s.borderEndEndRadius],bw:parseFloat(s.borderInlineStartWidth)};}));
 expect(geometry[1].radii).toEqual(['0px','0px','0px','0px']);
 expect(geometry[0].radii[0]).not.toBe('0px');expect(geometry[2].radii[3]).not.toBe('0px');
 if(orientation==='horizontal')expect(Math.abs(geometry[1].x-geometry[0].x)).toBeCloseTo((dir==='rtl'?geometry[1].w:geometry[0].w)-geometry[0].bw,0);
 else expect(geometry[1].y-geometry[0].y).toBeCloseTo(geometry[0].h-geometry[0].bw,0);
 await buttons.nth(0).focus();await buttons.nth(0).press(orientation==='vertical'?'ArrowDown':dir==='rtl'?'ArrowLeft':'ArrowRight');await expect(buttons.nth(1)).toBeFocused();await buttons.nth(1).press('Space');expect(await host.evaluate((el:any)=>el.value)).toEqual(['b']);
 expect(await buttons.nth(1).evaluate(el=>getComputedStyle(el).zIndex)).toBe('3');
 await host.evaluate((el:any)=>el.joined=false);await expect.poll(()=>buttons.nth(1).evaluate(el=>getComputedStyle(el).borderStartStartRadius)).not.toBe('0px');
});
test('joined action recipe reaches custom button surfaces and ignores hidden edges',async({page})=>{
 await mount(page,'<div id="actions"></div>');await page.evaluate(async()=>{const {html,render}=await import('/node_modules/lit/index.js');const {buttonGroupTemplate}=await import('/packages/primitives/dist/templates/patterns.js');const {patternStyles}=await import('/packages/styles/dist/patterns.js');const style=document.createElement('style');style.textContent=patternStyles.cssText;document.head.append(style);render(buttonGroupTemplate('Actions',html`<en-button hidden>Hidden</en-button><en-toggle-button>Bold</en-toggle-button><en-button>Archive</en-button>`),document.querySelector('#actions')!);});
 const first=page.locator('en-toggle-button button'),last=page.locator('en-button').last().locator('button');
 expect(await first.evaluate(el=>getComputedStyle(el).borderStartStartRadius)).not.toBe('0px');expect(await first.evaluate(el=>getComputedStyle(el).borderStartEndRadius)).toBe('0px');expect(await last.evaluate(el=>getComputedStyle(el).borderStartStartRadius)).toBe('0px');
 await first.click();await expect(first).toHaveAttribute('aria-pressed','true');
 await page.locator('.en-button-group').evaluate(el=>el.setAttribute('data-orientation','vertical'));expect(await first.evaluate(el=>getComputedStyle(el).borderStartEndRadius)).not.toBe('0px');expect(await first.evaluate(el=>getComputedStyle(el).borderEndStartRadius)).toBe('0px');const a=await first.boundingBox(),b=await last.boundingBox();expect(a!.width).toBeCloseTo(b!.width,0);expect(b!.y).toBeCloseTo(a!.y+a!.height-1,0);
});
test('query selects inherit appearance and retain a single draft/apply boundary',async({page})=>{
 await mount(page,'<form><en-query-builder style="--en-control-radius:17px"></en-query-builder></form>');const host=page.locator('en-query-builder');
 await host.evaluate((el:any)=>{el.fields=[{value:'name',label:'Name'},{value:'price',label:'Price',type:'number'}];(window as any).changes=[];el.addEventListener('en-change',(e:CustomEvent)=>(window as any).changes.push(e.detail));});
 await host.getByRole('combobox',{name:'Match',exact:true}).selectOption('any');await host.getByRole('button',{name:'Add condition'}).click();await host.getByRole('combobox',{name:'Field',exact:true}).selectOption('price');await host.getByRole('combobox',{name:'Comparison',exact:true}).selectOption('greater-than');await host.getByRole('textbox',{name:'Value',exact:true}).fill('10');
 await expect(host.locator('en-select')).toHaveCount(3);expect(await page.evaluate(()=>(window as any).changes)).toEqual([]);expect(await host.evaluate((el:any)=>el.value)).toEqual({match:'all',clauses:[]});
 expect(await host.locator('en-select').first().locator('select').evaluate(el=>getComputedStyle(el).borderRadius)).toBe('17px');
 expect(await page.evaluate(()=>[...new FormData(document.querySelector('form')!).entries()])).toEqual([]);
 await host.evaluate(el=>el.addEventListener('en-change',e=>e.preventDefault(),{once:true}));await host.getByRole('button',{name:'Apply filters'}).click();expect(await host.evaluate((el:any)=>el.value.match)).toBe('all');
 await host.getByRole('button',{name:'Apply filters'}).click();expect(await host.evaluate((el:any)=>el.value.clauses[0].operator)).toBe('greater-than');
 await host.getByRole('combobox',{name:'Match',exact:true}).selectOption('all');await host.getByRole('button',{name:'Cancel edits'}).click();await expect(host.getByRole('combobox',{name:'Match',exact:true})).toHaveValue('any');
 await host.evaluate((el:any)=>el.readOnly=true);await expect(host.getByRole('combobox',{name:'Match',exact:true})).toBeDisabled();
});
for(const tag of ['en-tooltip','en-popover','en-hover-card']) test(`${tag} arrow flips, points to trigger and stays outside scrolling content`,async({page})=>{
 await page.setViewportSize({width:640,height:480});await mount(page,`<button id="trigger" style="position:fixed;left:300px;top:180px;width:80px">Details</button><${tag} arrow for="trigger" label="Details" style="--en-overlay-arrow-size:10px;--en-overlay-max-inline-size:300px;--en-overlay-max-block-size:180px"><span ${tag==='en-tooltip'?'slot="content"':''}>Supplemental content</span></${tag}>`);
 const host=page.locator(tag),arrow=host.locator('[part="arrow"]'),surface=host.locator('[part="surface"]');await host.evaluate((el:any)=>el.show());await expect(arrow).toBeVisible();await expect(arrow).toHaveAttribute('data-side','top');
 const assertAim=async()=>{const tip=await arrow.boundingBox(),target=await page.locator('#trigger').boundingBox();expect(Math.abs(tip!.x+tip!.width/2-(target!.x+target!.width/2))).toBeLessThan(2);};await assertAim();
 await page.locator('#trigger').evaluate(el=>el.style.top='430px');await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await expect(arrow).toHaveAttribute('data-side','bottom');await assertAim();await page.screenshot({path:test.info().outputPath(`${tag}-arrow-short.png`)});
 expect(await surface.evaluate(el=>getComputedStyle(el).overflow)).toBe('visible');await expect(arrow).toHaveAttribute('aria-hidden','true');expect(await arrow.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
 await host.evaluate((el:any)=>{el.arrow=false;});await expect(arrow).toHaveCount(0);await host.evaluate((el:any)=>el.arrow=true);await expect(arrow).toBeVisible();
 await host.evaluate(el=>{const span=el.querySelector('span')!;span.style.display='block';span.style.height='600px';});await expect.poll(()=>host.locator('[part="content"], [part="body"]').evaluateAll(els=>els.some(el=>el.scrollHeight>el.clientHeight))).toBe(true);await expect(arrow).toBeVisible();
 await page.screenshot({path:test.info().outputPath(`${tag}-arrow.png`)});
});
test('tooltip arrow uses side placement and follows shifted trigger in RTL',async({page})=>{
 await page.setViewportSize({width:640,height:480});await mount(page,'<button id="trigger" dir="rtl" style="position:fixed;left:300px;top:200px">Help</button><en-tooltip arrow for="trigger" inline="start" block="center"><span slot="content">Description</span></en-tooltip>');const host=page.locator('en-tooltip'),arrow=host.locator('[part="arrow"]');await host.evaluate((el:any)=>el.show());await expect(arrow).toHaveAttribute('data-side','left');await page.locator('#trigger').evaluate(el=>el.style.left='580px');await page.evaluate(()=>window.dispatchEvent(new Event('resize')));await expect(arrow).toHaveAttribute('data-side','right');
});
test('arrow theme size, shape and system colors remain customizable',async({page})=>{
 await mount(page,'<button id="trigger" style="position:fixed;top:180px;left:200px;width:100px">Help</button><en-tooltip arrow arrow-path="M0 0 Q4 0 7 6 Q8 8 9 6 Q12 0 16 0" for="trigger" style="--en-overlay-background:rgb(20,40,60);--en-overlay-border-color:rgb(80,100,120)"><span slot="content">Theme-aware arrow</span></en-tooltip>');
 const host=page.locator('en-tooltip'),arrow=host.locator('[part="arrow"]');await host.evaluate((el:any)=>el.show());await expect(arrow).toBeVisible();expect(await arrow.evaluate(el=>getComputedStyle(el).fill)).toBe('rgb(20, 40, 60)');await expect(host.locator('path')).toHaveAttribute('d','M0 0 Q4 0 7 6 Q8 8 9 6 Q12 0 16 0');
 await host.evaluate((el:any)=>el.arrowPath='M0 0 L8 8 L16 0');await expect(host.locator('path')).toHaveAttribute('d','M0 0 L8 8 L16 0');
 await host.evaluate(el=>el.style.setProperty('--en-overlay-arrow-size','14px'));await expect.poll(()=>arrow.evaluate(el=>getComputedStyle(el).height)).toBe('14px');
 await expect.poll(async()=>{const s=await host.locator('[part="surface"]').boundingBox(),t=await page.locator('#trigger').boundingBox();return s!.y-t!.y-t!.height;}).toBeCloseTo(22,0);
 await page.emulateMedia({forcedColors:'active'});expect(await arrow.evaluate(el=>getComputedStyle(el).fill)).toBe(await host.locator('[part="surface"]').evaluate(el=>getComputedStyle(el).backgroundColor));
});
