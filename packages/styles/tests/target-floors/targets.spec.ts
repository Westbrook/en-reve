import {test,expect,type Page} from '@playwright/test';
const path='/packages/styles/tests/target-floors/fixture.html';
async function fixture(page:Page,html:string,control=72,touch=56,target=24){
 await page.goto(path);await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.evaluate(({html,control,touch,target})=>{
  const fixture=document.querySelector<HTMLElement>('#fixture')!;
  fixture.style.cssText=`--en-control-min-size:${control}px;--en-size-target-touch:${touch}px;--en-size-target-min:${target}px;--en-space-control-block:0px;--en-space-control-inline:0px`;
  fixture.innerHTML=html;
 },{html,control,touch,target});
}
const native=`
<en-target-sample data-family="swatch" style="--en-swatch-size:20px"><button class="en-swatch__sample" data-block data-inline aria-label="Color"></button></en-target-sample>
<en-target-sample data-family="split"><div class="en-split-view" style="height:200px"><div class="en-split-pane">Primary</div><div class="en-split-handle" data-inline></div><div class="en-split-pane">Secondary</div></div><div class="en-split-view" data-orientation="vertical" style="height:250px"><div class="en-split-pane">Primary</div><div class="en-split-handle" data-block></div><div class="en-split-pane">Secondary</div></div></en-target-sample>
<en-target-sample data-family="wheel" style="--en-color-wheel-size:20px"><div part="base"><div part="control" data-inline data-block></div></div></en-target-sample>
<en-target-sample data-family="plane"><div part="plane" data-block data-inline style="width:20px"></div></en-target-sample>
<en-target-sample data-family="button"><button class="en-button" data-block>Action</button></en-target-sample>
<en-target-sample data-family="control"><label class="en-choice" data-block><input type="checkbox">Choice</label><input class="en-range" type="range" aria-label="Range" data-block></en-target-sample>
<en-target-sample data-family="selection"><button class="en-tab" data-block>Tab</button><button class="en-accordion-trigger" data-block>Disclosure</button><label class="en-rating-item" data-block data-inline><input type="radio">★</label></en-target-sample>
<en-target-sample data-family="menu"><button class="en-menu-item" data-block>Menu item</button><button class="en-menu-back" data-block>Back</button><button class="en-command-option" data-block>Command</button></en-target-sample>
<en-target-sample data-family="combobox"><div class="en-combobox"><input class="en-input en-combobox-input" aria-label="Query"><button class="en-combobox-trigger" data-inline>▾</button></div><div class="en-combobox-option" data-block>Option</div></en-target-sample>
<en-target-sample data-family="tree"><button class="en-tree-option" data-block><span class="en-tree-indicator" data-touch-inline>▸</span>Tree item<span class="en-tree-drag" data-block data-inline>Move</span></button><div class="en-tree-loading" data-block>Loading</div><div class="en-tree-move"><label>Destination<select aria-label="Destination" data-block><option>Folder</option></select></label></div></en-target-sample>
<en-target-sample data-family="file"><label class="en-file-drop" data-block>Upload<input class="en-file-input" type="file"></label></en-target-sample>
<en-target-sample data-family="editor"><button data-token data-block data-inline>Mention</button><div class="option" data-block>Suggestion</div></en-target-sample>
<en-target-sample data-family="navigation"><nav class="en-section-nav"><a class="en-navigation-link" href="#" data-block>Section</a></nav><details><summary data-block>Group</summary></details></en-target-sample>
<en-target-sample data-family="carousel"><div class="picker"><button class="en-button picker-button" data-block data-inline>1</button></div><div class="picker" data-bounded style="--_en-picker-count:3"><button class="en-button picker-button" data-block data-inline>1</button><button class="en-button picker-button" data-block data-inline>2</button><button class="en-button picker-button" data-block data-inline>3</button></div></en-target-sample>
<en-target-sample data-family="pagination"><div class="en-pagination__pages"><button class="en-button" data-block data-touch-inline>1</button></div></en-target-sample>`;

for(const params of [
 {name:'shared minimum wins',control:72,touch:56,target:24},
 {name:'touch floor wins',control:28,touch:64,target:24},
 {name:'ordinary target remains a floor on touch',control:28,touch:32,target:68},
])test(params.name,async({page},info)=>{
 await fixture(page,native,params.control,params.touch,params.target);
 const coarse=await page.evaluate(()=>matchMedia('(any-pointer: coarse)').matches);
 expect(coarse).toBe(!info.project.name.endsWith('mouse'));
 if(info.project.name.endsWith('mixed')){
  expect(await page.evaluate(()=>matchMedia('(pointer: fine)').matches)).toBe(true);
  expect(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)).toBe(false);
 }
 const floor=Math.max(params.control,params.target,coarse?params.touch:0);
 for(const axis of ['block','inline']){
  const targets=page.locator(`[data-${axis}]${coarse?`,[data-touch-${axis}]`:''}`);
  const results=await targets.evaluateAll((els,axis)=>els.map(el=>({label:el.outerHTML.slice(0,100),size:el.getBoundingClientRect()[axis==='block'?'height':'width']})),axis);
  for(const result of results)expect(result.size,result.label).toBeGreaterThanOrEqual(floor-.1);
 }
});

test('actual ranges keep target floors in both orientations',async({page})=>{
 await fixture(page,'<en-slider id="range" label="Value"></en-slider><en-slider id="vertical" orientation="vertical" label="Value"></en-slider><en-color-slider id="color" label="Hue"></en-color-slider><en-color-slider id="color-vertical" orientation="vertical" label="Hue"></en-color-slider>');
 for(const id of ['range','vertical','color','color-vertical']){
  const range=page.locator(`#${id} input[type=range]`);const rect=(await range.boundingBox())!;
  expect(id.includes('vertical')?rect.width:rect.height,id).toBeGreaterThanOrEqual(72);
 }

});

test('calendar keeps custom day floors without overlaps or document overflow',async({page})=>{
 await page.setViewportSize({width:320,height:800});
 await fixture(page,'<en-calendar id="single" value="2026-09-18" today="2026-09-18"></en-calendar><en-calendar id="range" selection="range" today="2026-09-18"></en-calendar>',56,64);
 const floor=await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches?64:56);
 for(const id of ['single','range']){
  const days=page.locator(`#${id} .en-calendar-day`);await expect(days).toHaveCount(42);
  const rects=await days.evaluateAll(els=>els.slice(0,7).map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right};}));
  for(const [i,r] of rects.entries()){
   expect(r.width).toBeGreaterThanOrEqual(floor-.1);expect(r.height).toBeGreaterThanOrEqual(floor-.1);
   if(i)expect(r.left).toBeGreaterThanOrEqual(rects[i-1].right-.1);
  }
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 await page.locator('#range').evaluate((el:any)=>el.rangeValue={start:'2026-09-18',end:'2026-09-21'});
 await expect(page.locator('#range [part~=range-start]')).toHaveCSS('border-top-width','2px');
});

test('authored navigation and table selection inherit the same floor',async({page})=>{
 await fixture(page,'<en-navigation><a href="#">A</a><en-navigation-group label="Group"><a href="#">B</a></en-navigation-group></en-navigation><en-breadcrumbs><a href="#">Root</a><span>Here</span></en-breadcrumbs><en-data-table id="table" selection="multiple"></en-data-table>');
 await page.locator('#table').evaluate((el:any)=>{el.columns=[{key:'name',label:'Name',renderCell:(item:any)=>item.name}];el.items=[{id:'1',name:'First'}];});
 for(const loc of [page.locator('en-navigation > a'),page.locator('en-navigation-group summary'),page.locator('en-data-table en-checkbox .en-choice').last()])expect((await loc.boundingBox())!.height).toBeGreaterThanOrEqual(72);
 if(await page.evaluate(()=>matchMedia('(any-pointer:coarse)').matches))expect((await page.locator('en-breadcrumbs a').boundingBox())!.height).toBeGreaterThanOrEqual(72);
 const label=page.locator('en-data-table en-checkbox .en-choice').last();expect((await label.boundingBox())!.width).toBeGreaterThanOrEqual(72);
});

test('narrow picker targets do not overlap and keyboard dates remain visible in both directions',async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await fixture(page,`<en-target-sample data-family="carousel"><div class="picker" data-bounded style="--_en-picker-count:7">${Array.from({length:7},(_,i)=>`<button class="en-button picker-button">${i+1}</button>`).join('')}</div></en-target-sample><en-calendar id="dates" value="2026-09-18" today="2026-09-18"></en-calendar>`,72,80);
 const rects=await page.locator('.picker-button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right};}));
 for(let i=1;i<rects.length;i++)expect(rects[i].left).toBeGreaterThanOrEqual(rects[i-1].right);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
 for(const dir of ['ltr','rtl']){
  await page.locator('#dates').evaluate((el,dir)=>el.setAttribute('dir',dir),dir);
  const day=page.locator('#dates [data-date="2026-09-13"]');await day.focus();await day.press('End');
  const state=await page.locator('#dates').evaluate(el=>{
   const root=el.shadowRoot!,surface=root.querySelector('.en-calendar')!,active=root.activeElement!;
   const bounds=surface.getBoundingClientRect(),target=active.getBoundingClientRect();
   return {left:bounds.left+surface.clientLeft,right:bounds.left+surface.clientLeft+surface.clientWidth,targetLeft:target.left,targetRight:target.right};
  });
  expect(state.targetLeft).toBeGreaterThanOrEqual(state.left-.1);expect(state.targetRight).toBeLessThanOrEqual(state.right+.1);
 }
});
