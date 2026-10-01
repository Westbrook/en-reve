import {test,expect} from '@playwright/test';
import {emulationLimits} from './theme-proof-exceptions.js';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
const directions=['editorial','precision','studio'];
async function ready(page:any,direction='editorial',mode='light'){
 await page.goto('/theme-proof.html?progress-report');await expect(page.locator('#workspace')).toHaveAttribute('data-ready','true');
 await page.locator('#direction').selectOption(direction);await page.locator('#appearance').selectOption(mode);
 await expect(page.locator('#theme-status')).toContainText('Declared text-pair contrast checks pass');
}
const radius=(locator:any)=>locator.evaluate((e:Element)=>getComputedStyle(e).borderTopLeftRadius);
for(const direction of directions)for(const mode of ['light','dark']){
 for(const scenario of [
  {name:'200% equivalent reflow',width:640,height:512,textScale:1},
  {name:'400% equivalent reflow',width:320,height:256,textScale:1},
  {name:'200% text enlargement',width:1280,height:1024,textScale:2},
 ])test(`${direction} ${mode}: ${scenario.name}`,async({page},info)=>{
  await page.setViewportSize({width:1280,height:1024});await ready(page,direction,mode);
  const input=page.locator('#title-field input');
  const initialFont=await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  const initialRootFont=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
  await input.fill('Retained while resizing');
  await page.setViewportSize({width:scenario.width,height:scenario.height});
  await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,initialRootFont*scenario.textScale);
  expect(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeCloseTo(initialFont*scenario.textScale,1);
  // Viewport reduction tests layout reflow; root sizing separately tests relative text.
  // Neither deviceScaleFactor nor CSS zoom substitutes for these checks.
  for(const writing of ['ltr','rtl']){
   await page.locator('#writing').selectOption(writing);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth),writing).toBeLessThanOrEqual(scenario.width+1);
   for(const selector of ['#title-field input','#outside-button button','#stage select']){
    const control=page.locator(selector);await control.scrollIntoViewIfNeeded();
    const box=await control.boundingBox();expect(box,selector).not.toBeNull();
    expect(box!.x,selector).toBeGreaterThanOrEqual(-1);expect(box!.x+box!.width,selector).toBeLessThanOrEqual(scenario.width+1);
   }
   await expect(input).toHaveValue('Retained while resizing');
   await page.locator('#outside-input input').focus();await page.keyboard.press('Tab');
   await expect(page.locator('#outside-button button')).toBeFocused();
   expect(await page.locator('#outside-button button').evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
   const select=page.locator('#stage').getByRole('combobox');await select.selectOption('ready');await expect(select).toHaveValue('ready');
   const dateTrigger=page.locator('#nested-date').getByRole('button',{name:/^Choose nested date,/});await dateTrigger.click();
   const dialog=page.locator('#nested-date dialog');await expect(dialog).toBeVisible();
   const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(-1);expect(box!.x+box!.width).toBeLessThanOrEqual(scenario.width+1);
   await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(dateTrigger).toBeFocused();
  }
  await page.screenshot({path:info.outputPath('reflow.png'),fullPage:true});
 });
 test(`${direction} ${mode}: real components, scopes, overlays and preserved content`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page,direction,mode);
  const normal=page.locator('#outside-input input');const outsideButton=page.locator('#outside-button button');
  await expect(page.locator('#shadow-example en-button button')).toHaveCSS('background-color',await outsideButton.evaluate(e=>getComputedStyle(e).backgroundColor));
  const bodyFont=await page.locator('#workspace').evaluate(e=>getComputedStyle(e).fontFamily);
  expect(bodyFont).toContain(direction==='editorial'?'Georgia':'system-ui');
  expect(await radius(normal)).toBe(direction==='editorial'?'4px':direction==='precision'?'2px':'16px');
  expect(await radius(page.locator('#shared-input input'))).toBe('20px');expect(await radius(page.locator('#shared-button button'))).toBe('20px');
  expect(await radius(page.locator('#concept-input input'))).toBe('0px');expect(await radius(page.locator('#concept-button button'))).toBe('0px');
  expect(await radius(page.locator('#instance-button button'))).toBe('0px');expect(await radius(page.locator('#instance-input input'))).toBe(await radius(normal));
  expect(await radius(page.locator('#nested-input input'))).toBe('2px');
  const paint=async(l:any)=>l.evaluate((e:Element)=>({background:getComputedStyle(e).backgroundColor,font:getComputedStyle(e).fontFamily}));
  expect(await paint(page.locator('#buttons-input input'))).toEqual(await paint(normal));
  expect(await paint(page.locator('#inputs-button button'))).toEqual(await paint(outsideButton));
  expect((await paint(page.locator('#buttons-button button'))).background).not.toBe((await paint(outsideButton)).background);
  expect((await paint(page.locator('#inputs-input input'))).background).not.toBe((await paint(normal)).background);
  await expect(page.locator('#nested')).toHaveCSS('color-scheme',mode==='light'?'dark':'light');
  await expect(page.locator('#workspace')).toHaveCSS('color-scheme',mode);
  await expect(page.locator('#asset-table td').first()).toHaveCSS('font-family','ui-monospace, monospace');
  await expect(page.locator('#brief [part~=control]')).toHaveCSS('font-family',bodyFont);
  await expect(page.locator('#note [part~=control]')).toHaveCSS('font-family',await normal.evaluate(e=>getComputedStyle(e).fontFamily));
  await page.locator('#title-field input').fill('My changed title');
  await page.locator('#direction').selectOption(direction==='studio'?'editorial':'studio');
  await expect(page.locator('#title-field input')).toHaveValue('My changed title');
  await page.locator('#direction').selectOption(direction);
  await page.locator('#nested-date').getByRole('button',{name:/^Choose nested date,/}).click();
  const dialog=page.locator('#nested-date dialog');await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('color-scheme',mode==='light'?'dark':'light');await page.keyboard.press('Escape');
  await page.locator('#notify').click();await expect(page.getByText('Project saved. Your current theme stays with the notification.')).toBeVisible();
  await expect(page.locator('#notifications en-toast')).toHaveCSS('color-scheme',mode);
  const select=page.locator('#stage').getByRole('combobox');
  if(await page.evaluate(()=>CSS.supports('(appearance: base-select) and selector(::picker(select))'))){await select.click();await expect(page.getByRole('option',{name:'Ready to publish',exact:true})).toBeVisible();await page.keyboard.press('Escape');}
  await select.selectOption('ready');await expect(select).toHaveValue('ready');await expect(select).toHaveCSS('color-scheme',mode);
  await page.locator('#outside-input input').focus();await page.keyboard.press('Tab');await expect(outsideButton).toBeFocused();expect(await outsideButton.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.locator('#outline').getByRole('treeitem',{name:'Assets',exact:true}).click();await expect(page.locator('#outline').getByRole('treeitem',{name:'Assets',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#readonly-field input')).toHaveAttribute('readonly','');await expect(page.locator('#invalid-field input')).toHaveAttribute('aria-invalid','true');
  const paintBefore=await outsideButton.evaluate(e=>getComputedStyle(e).backgroundColor);await outsideButton.hover();await page.waitForTimeout(250);const hoverPaint=await outsideButton.evaluate(e=>getComputedStyle(e).backgroundColor);expect(hoverPaint).not.toBe(paintBefore);
  await page.mouse.down();await page.waitForTimeout(250);expect(await outsideButton.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(hoverPaint);await page.mouse.up();
  await page.locator('#empty-activity').click();await expect(page.locator('#activity p[slot=empty]')).toBeVisible();await page.locator('#empty-activity').click();
  await page.locator('#loading-activity').click();await expect(page.locator('#activity p[slot=loading]')).toBeVisible();await page.locator('#loading-activity').click();
  await page.locator('#workspace').screenshot({path:info.outputPath(`${direction}-${mode}-workspace.png`)});
  expect(errors).toEqual([]);
 });
 test(`${direction} ${mode}: narrow RTL, enlarged text and accessibility`,async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await ready(page,direction,mode);await page.locator('#writing').selectOption('rtl');
  await page.evaluate(()=>document.documentElement.style.fontSize='20px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  await page.screenshot({path:info.outputPath(`${direction}-${mode}-narrow.png`),fullPage:true});
 });
}
test('all themes, appearances, densities and sizes preserve pointer target floors',async({page})=>{
 test.setTimeout(120000);await ready(page);
 for(const direction of directions)for(const appearance of ['light','dark']){
  await page.locator('#direction').selectOption(direction);await page.locator('#appearance').selectOption(appearance);
  for(const density of ['compact','comfortable','spacious'])for(const size of ['small','medium','large','inherit']){
   await page.locator('#density').selectOption(density);await page.locator('#size').selectOption(size);
   for(const selector of ['#outside-button button','#outside-input input','#ink input[type=range]']){
    const element=page.locator(selector).first();await expect(element).toBeVisible();const rect=await element.boundingBox();expect(rect!.height,`${direction}/${appearance}/${density}/${size}/${selector}`).toBeGreaterThanOrEqual(24);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
 }
});
test('draft round-trip, rejected import and portable CSS',async({page})=>{
 await ready(page,'studio','dark');const waiting=page.waitForEvent('download');await page.locator('#export-json').click();const download=await waiting;const file=await download.path();const original=JSON.parse(await readFile(file!,'utf8'));
 await page.locator('#import-json').setInputFiles(file!);await expect(page.locator('#transfer-status')).toContainText('Draft reopened successfully');
 const waiting2=page.waitForEvent('download');await page.locator('#export-json').click();const second=await waiting2;expect(JSON.parse(await readFile((await second.path())!,'utf8'))).toEqual(original);
 await page.locator('#import-json').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await expect(page.locator('#transfer-status')).toContainText('Draft unchanged');
 const cssDownload=page.waitForEvent('download');await page.locator('#export-css').click();const css=await readFile((await (await cssDownload).path())!,'utf8');
 await page.evaluate(css=>{const style=document.createElement('style');style.textContent=css;document.head.append(style);const fixture=document.createElement('section');fixture.id='transferred';fixture.className='proof-surface';fixture.dataset.proofTheme='studio';fixture.dataset.appearance='dark';fixture.innerHTML='<en-button>Transferred action</en-button><en-card>Transferred card</en-card>';document.body.append(fixture);},css);
 await expect(page.locator('#transferred')).toHaveCSS('color-scheme','dark');expect(await radius(page.locator('#transferred en-button button'))).toBe('16px');
 await expect(page.locator('#transferred en-card [part=base]')).not.toHaveCSS('box-shadow','none');
 await page.goto('/theme-proof.html');await expect(page.locator('#progress-return')).toBeHidden();
});
test('forced colors retain focus and content',async({page,browserName})=>{
 test.skip(Boolean(emulationLimits.forcedColors[browserName]),emulationLimits.forcedColors[browserName]);
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await ready(page,'studio');
 const button=page.locator('#outside-button button');await page.locator('#outside-input input').focus();await page.keyboard.press('Tab');await expect(button).toBeFocused();
 expect(await button.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
 await expect(page.locator('#title-field input')).toBeVisible();
});

test('reduced motion retains focus and content independently of forced colors',async({page})=>{
 await page.emulateMedia({forcedColors:'none',reducedMotion:'reduce'});await ready(page,'studio');
 const button=page.locator('#outside-button button');await page.locator('#outside-input input').focus();await page.keyboard.press('Tab');await expect(button).toBeFocused();
 expect(await button.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');await expect(button).toHaveCSS('transition-duration','0s');
 await expect(page.locator('#title-field input')).toBeVisible();
});

test('touch targets and hover capability retain the interaction floor',async({browser,browserName,baseURL})=>{
 test.skip(Boolean(emulationLimits.touch[browserName]),emulationLimits.touch[browserName]);
 const context=await browser.newContext({baseURL,hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();
 await page.goto('/theme-proof.html');await expect(page.locator('#workspace')).toHaveAttribute('data-ready','true');await page.locator('#direction').selectOption('precision');await page.locator('#size').selectOption('small');
 expect(await page.evaluate(()=>matchMedia('(any-pointer: coarse)').matches)).toBe(true);
 for(const s of ['#outside-button button','#outside-input input','#ink input[type=range]']){const box=await page.locator(s).first().boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);}
 await context.close();
});
