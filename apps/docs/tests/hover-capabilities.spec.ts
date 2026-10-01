import { expect, test, type Page } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { navigationHostStyles, breadcrumbHostStyles } from '../../../packages/styles/dist/navigation.js';
const styleRoot=new URL('../../../packages/styles/dist/',import.meta.url);
async function styles() {
 const files=(await readdir(styleRoot)).filter(name=>name.endsWith('.css'));
 return (await Promise.all(files.map(name=>readFile(new URL(name,styleRoot),'utf8')))).join('\n')+navigationHostStyles.cssText+breadcrumbHostStyles.cssText;
}
async function fixture(page:Page) {
 await page.setContent(`<!doctype html><style>${await styles()}</style><style>body{margin:30px} #fixtures{width:300px} #fixtures>div{margin:12px 0}button{transition:none!important;appearance:none}button:not(.en-button){border-color:transparent}</style><main id="fixtures">
 <div><button tabindex="0" id="action" class="en-button">Action</button></div>
 <div><button tabindex="0" id="tab" class="en-tab">Tab</button></div>
 <div><button tabindex="0" id="accordion" class="en-accordion-trigger">Accordion</button></div>
 <div class="en-section-nav"><a id="link" class="en-navigation-link" href="#a">Link</a><a id="current" class="en-navigation-link" aria-current="page" href="#b">Current</a></div>
 <div><button tabindex="0" id="option" class="en-option">Option</button><button tabindex="0" id="candidate" class="en-option" data-active>Keyboard candidate</button></div>
 <div><button tabindex="0" id="combo" class="en-combobox-option" aria-selected="false">Combobox option</button></div>
 <div><button tabindex="0" id="menu" class="en-menu-item">Menu item</button></div>
 <div class="en-tree-item"><button tabindex="0" id="tree" class="en-tree-option">Tree item</button></div>
 <div><table><tbody><tr><td aria-selected="false"><button tabindex="0" id="date" class="en-calendar-day">20</button></td></tr></tbody></table></div>
 <div class="en-button-group"><button id="pressed" class="en-button" aria-pressed="true">Pressed</button><button id="joined-next" class="en-button">Next</button></div>
 </main>`);
 expect(await page.evaluate(() => document.compatMode)).toBe('CSS1Compat');
}
const paint=(page:Page,id:string)=>page.locator('#'+id).evaluate(el=>{const s=getComputedStyle(el);return [s.backgroundColor,s.backgroundImage,s.color,s.borderTopColor];});

test('all exported and documentation hover selectors are capability-gated',async({page})=>{
 await page.setContent(`<style>${await styles()}\n${await readFile(new URL('../src/site.css',import.meta.url),'utf8')}</style>`);
 const result=await page.evaluate(()=>{
  const ungated:string[]=[];let count=0;
  function walk(rules:CSSRuleList,gated=false) {for(const r of Array.from(rules)) {
   const rule=r as CSSStyleRule & CSSGroupingRule;
   const next=gated || (r instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(r.conditionText));
   if(rule.selectorText?.includes(':hover')) {count++;if(!next)ungated.push(rule.selectorText);}
   if(rule.cssRules)walk(rule.cssRules,next);
  }}
  for(const sheet of Array.from(document.styleSheets))walk(sheet.cssRules);
  return {ungated,count};
 });
 expect(result.count).toBeGreaterThan(30);expect(result.ungated).toEqual([]);
});
for(const touch of [false,true]) test(`${touch?'touch-primary':'mouse-primary'} feedback keeps hover separate from persistent states`,async({browser})=>{
 const context=await browser.newContext({hasTouch:touch,viewport:{width:900,height:1100},reducedMotion:'reduce'});
 try {const page=await context.newPage();await fixture(page);expect(await page.evaluate(()=>matchMedia('(hover: hover)').matches)).toBe(!touch);
  for(const id of ['action','tab','accordion','link','option','combo','menu','tree','date']) {
   await page.mouse.move(0,0);const before=await paint(page,id);await page.locator('#'+id).hover();const after=await paint(page,id);
   if(touch)expect(after,id).toEqual(before);else expect(after,id).not.toEqual(before);
  }
  await page.mouse.move(0,0);
  expect(await paint(page,'current')).not.toEqual(await paint(page,'link'));
  expect(await paint(page,'candidate')).not.toEqual(await paint(page,'option'));
  await page.keyboard.press('Tab');await page.locator('#tab').focus();await expect(page.locator('#tab')).toBeFocused();
  expect(await page.locator('#tab').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.locator('#date').hover();await page.mouse.down();expect((await paint(page,'date'))[1]).toContain('0.16');await page.mouse.up();
 }finally{await context.close();}
});

test('Chromium touch gestures do not leave decorative hover paint',async({browser,browserName})=>{
 test.skip(browserName!=='chromium','Low-level CDP touch injection is Chromium-only.');
 const context=await browser.newContext({hasTouch:true,viewport:{width:900,height:1100}});
 try {const page=await context.newPage();await fixture(page);const cdp=await context.newCDPSession(page);await page.evaluate(()=>{(window as any).touchTargets=[];document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')(window as any).touchTargets.push((e.target as HTMLElement).id);},true);});
  for(const id of ['action','tab','accordion','link','option','combo','menu','tree','date']) {
   const control=page.locator('#'+id);await control.scrollIntoViewIfNeeded();const before=await paint(page,id);const b=(await control.boundingBox())!;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await control.evaluate((el:HTMLElement)=>el.blur());
   expect(await paint(page,id),id).toEqual(before);
  }
  expect(await page.evaluate(()=>(window as any).touchTargets)).toEqual(['action','tab','accordion','link','option','combo','menu','tree','date']);
 }finally{await context.close();}
});


for (const touch of [false, true]) test(`${touch ? 'touch-primary' : 'mouse-primary'} joined selection paint and stacking respect hover capability`, async ({ browser }) => {
 const context = await browser.newContext({ hasTouch: touch, viewport: { width: 900, height: 1100 }, reducedMotion: 'reduce' });
 try {
  const page = await context.newPage(); await fixture(page);
  expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(!touch);
  const selected = page.locator('#pressed');
  await page.mouse.move(0, 0);
  const baseline = await paint(page, 'pressed');
  expect(baseline).not.toEqual(await paint(page, 'joined-next'));
  await expect(selected).toHaveCSS('z-index', '1');
  await selected.hover();
  if (touch) expect(await paint(page, 'pressed')).toEqual(baseline);
  else expect(await paint(page, 'pressed')).not.toEqual(baseline);
  await expect(selected).toHaveCSS('z-index', touch ? '1' : '2');
  await selected.focus(); await expect(selected).toHaveCSS('z-index', '3');
  await page.mouse.move(0, 0); await selected.evaluate((element: HTMLElement) => element.blur());
  expect(await paint(page, 'pressed')).toEqual(baseline);
  await expect(selected).toHaveCSS('z-index', '1');
 } finally { await context.close(); }
});
