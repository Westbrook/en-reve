import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const baseURL=process.env.EN_REVE_PREVIEW_URL ?? 'http://127.0.0.1:4180/';
const evidenceDir=process.env.EN_STICKER_TEST_OUTPUT_DIR
 ? pathToFileURL(resolve(process.env.EN_STICKER_TEST_OUTPUT_DIR) + '/')
 : new URL('./evidence/',import.meta.url);
await fs.mkdir(evidenceDir,{recursive:true});
const report=[];
for (const [name,engine] of Object.entries({chromium,firefox,webkit})) {
 const browser=await engine.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=> { const tools=new Map();globalThis.previewTools=tools;Object.defineProperty(document,'modelContext',{value:{registerTool(tool,options){tools.set(tool.name,tool);options.signal.addEventListener('abort',()=>tools.delete(tool.name));}}}); });
 try {
 await page.goto(baseURL);await page.waitForSelector('h1');
 assert.equal(await page.getByLabel('Layout rhythm',{exact:true}).inputValue(),'0.25');
 await expect(page.locator('[data-specimen=card] en-stack')).toBeVisible();
 const primary=page.locator('#actions en-button').first().getByRole('button');
 const initialColor=await primary.evaluate(el=>getComputedStyle(el).backgroundColor);
 const disabled=page.locator('#actions en-button[disabled]').getByRole('button');
 assert.notEqual(await disabled.evaluate(el=>getComputedStyle(el).backgroundColor),initialColor);
 const activeField=page.getByRole('textbox',{name:'Project name',exact:true}).first();
 const disabledField=page.getByRole('textbox',{name:'Shared workspace',exact:true});
 assert.notEqual(await activeField.evaluate(el=>getComputedStyle(el).backgroundColor),await disabledField.evaluate(el=>getComputedStyle(el).backgroundColor));
 await page.locator('en-segmented-control').getByText('Dark',{exact:true}).click();assert.notEqual(await primary.evaluate(el=>getComputedStyle(el).backgroundColor),initialColor);
 await page.getByLabel('Density',{exact:true}).selectOption('compact');
 const compact=await primary.boundingBox();
 await page.getByLabel('Density',{exact:true}).selectOption('comfortable');const comfortable=await primary.boundingBox();assert.ok(comfortable.height>=compact.height);
 await page.getByLabel('Density',{exact:true}).selectOption('spacious');assert.ok((await primary.boundingBox()).height>comfortable.height);
 await page.getByLabel('Layout rhythm',{exact:true}).selectOption('0.5');assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--en-rhythm-base').trim()),'0.5rem');
 await page.getByRole('button',{name:'Reset preview',exact:true}).click();await page.locator('en-sticker-app').evaluate(el=>el.updateComplete);assert.equal(await page.getByLabel('Layout rhythm',{exact:true}).inputValue(),'0.25');
 await page.getByRole('textbox',{name:'Project name',exact:true}).first().fill('New collection');await page.getByRole('searchbox',{name:'Find an asset',exact:true}).focus();
 assert.equal(await activeField.evaluate(el=>el.getRootNode().host.value),'New collection');
 const slider=page.getByRole('slider',{name:'Layer opacity',exact:true});await slider.focus();await slider.press('ArrowRight');assert.equal(await page.locator('.opacity-sample').evaluate(el=>getComputedStyle(el).opacity),'0.65');
 const rating=page.locator('[data-specimen=rating] en-rating');
 await expect(page.getByRole('group',{name:'How useful is this concept?',exact:true})).toBeVisible();
 await expect(rating.locator('legend')).toBeVisible();
 await expect(rating.getByText('How useful is this concept?',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Layout',exact:true}).click();await page.getByRole('tabpanel').filter({visible:true}).getByText('Spacing, alignment, and layout constraints.').waitFor();
 await page.locator('[data-specimen=accordion] en-accordion-item[label=Appearance]').getByRole('button').click();assert.equal(await page.locator('[data-specimen=accordion] en-accordion-item[label=Appearance]').evaluate(el=>el.open),true);
 await page.getByRole('button',{name:'Open dialog',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Invite to this project',exact:true});await dialog.waitFor();await page.locator('en-dialog').getByRole('textbox',{name:'Email address',exact:true}).fill('review@example.com');await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
 await page.getByRole('button',{name:'Open drawer',exact:true}).click();await page.getByRole('dialog',{name:'Project details',exact:true}).waitFor();await page.keyboard.press('Escape');
 const viewOptions=page.getByRole('button',{name:'View options',exact:true});
 await viewOptions.click();await page.getByRole('dialog',{name:'View options',exact:true}).waitFor();
 await page.locator('en-popover').getByRole('checkbox',{name:'Show outlines',exact:true}).check();
 await page.keyboard.press('Escape');await expect(viewOptions).toBeFocused();
 await page.getByRole('button',{name:'Reset Popover & tooltip',exact:true}).click();
 await viewOptions.click();await expect(page.locator('en-popover').getByRole('checkbox',{name:'Show outlines',exact:true})).not.toBeChecked();
 await page.keyboard.press('Escape');
 const helpTrigger=page.getByRole('button',{name:'Hover or focus',exact:true});
 await helpTrigger.focus();await expect(page.getByRole('tooltip',{name:'Supplementary guidance, available on focus too.',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('tooltip',{name:'Supplementary guidance, available on focus too.',exact:true})).not.toBeVisible();await expect(helpTrigger).toBeFocused();
 // Operate reset as a consumer would, including state held inside descendants.
 await page.getByRole('button',{name:'Reset Text fields',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Project name',exact:true}).first()).toHaveValue('Studio studies');
 await page.getByRole('button',{name:'Reset Continuous adjustment',exact:true}).click();
 await expect(page.getByRole('slider',{name:'Layer opacity',exact:true})).toHaveValue('64');
 assert.equal(await page.locator('.opacity-sample').evaluate(el=>getComputedStyle(el).opacity),'0.64');
 await page.getByRole('button',{name:'Reset Tabs',exact:true}).click();
 await expect(page.getByRole('tab',{name:'Design',exact:true})).toHaveAttribute('aria-selected','true');
 const warning=page.locator('[data-specimen=messages] en-alert[variant=warning]');
 await warning.getByRole('button').click();await expect(warning).toBeHidden();
 await page.getByRole('button',{name:'Reset Messages',exact:true}).click();await expect(warning).toBeVisible();
 await page.getByRole('button',{name:'Reset Dialog & drawer',exact:true}).click();
 await page.getByRole('button',{name:'Open dialog',exact:true}).click();
 await expect(page.locator('en-dialog').getByRole('textbox',{name:'Email address',exact:true})).toHaveValue('');
 await page.keyboard.press('Escape');
 // Each actual source disclosure stays escaped, keyboard reachable, and highlighted.
 const specimenCount=await page.locator('[data-specimen]').count();
 assert.equal(await page.locator('[data-specimen] details.code-disclosure > summary').count(),specimenCount);
 const sourcePanels=[];
 for (const id of ['structured-values','opacity','dialog-drawer','popover-tooltip']) {
   const article=page.locator(`[data-specimen="${id}"]`);
   const disclosure=article.locator('details.code-disclosure');
   const summary=disclosure.locator(':scope > summary');
   await expect(summary).toHaveAccessibleName(`View code for ${await article.locator('h3').innerText()}`);
   await expect(disclosure).not.toHaveAttribute('open');
   await summary.focus();await summary.press('Enter');
   await expect(disclosure).toHaveAttribute('open','');
   await expect(summary).toBeFocused();
   const code=disclosure.locator('pre > code');await expect(code).toBeVisible();
   await expect(disclosure).toHaveAttribute('data-highlighted','true');
   assert.equal(await code.locator('*').count(),0);
   assert.equal(await code.evaluate(el=>[...CSS.highlights.values()].some(highlight=>[...highlight].some(range=>el.contains(range.startContainer)))),true);
   sourcePanels.push(id);
 }
 assert.equal(await page.locator('[data-specimen="structured-values"] pre > code').evaluate(el=>[...CSS.highlights.values()].some(highlight=>[...highlight].some(range=>el.contains(range.startContainer)))),true);
 const sourceIndentation=await page.locator('[data-specimen="structured-values"] pre > code').evaluate(code=>{
   const node=code.firstChild;
   if (!(node instanceof Text)) throw new Error('Expected selectable authored source text.');
   const lineStart=node.data.indexOf('\n\t')+1;
   if (lineStart===0) throw new Error('Expected a tab-indented source line.');
   let contentStart=lineStart;
   while (node.data[contentStart]==='\t') contentStart++;
   const indentation=new Range();indentation.setStart(node,lineStart);indentation.setEnd(node,contentStart);
   const pre=code.parentElement;
   const before={tabSize:getComputedStyle(code).tabSize,width:indentation.getBoundingClientRect().width};
   const copyRange=new Range();copyRange.selectNodeContents(code);
   const selection=window.getSelection();selection.removeAllRanges();selection.addRange(copyRange);
   const copiedBefore=selection.toString();
   pre.style.setProperty('--en-docs-code-tab-size','4');
   const after={tabSize:getComputedStyle(code).tabSize,width:indentation.getBoundingClientRect().width};
   const copiedSourcePreserved=selection.toString()===copiedBefore && copiedBefore===node.data;
   pre.style.removeProperty('--en-docs-code-tab-size');selection.removeAllRanges();
   return {before,after,copiedSourcePreserved};
 });
 assert.equal(sourceIndentation.before.tabSize,'2');assert.equal(sourceIndentation.after.tabSize,'4');
 assert.ok(sourceIndentation.after.width>sourceIndentation.before.width);
 assert.equal(sourceIndentation.copiedSourcePreserved,true);
 for (const id of sourcePanels) {
   const disclosure=page.locator(`[data-specimen="${id}"] details.code-disclosure`);
   await disclosure.locator('summary').press('Space');
   await expect(disclosure).not.toHaveAttribute('open');
   await expect(disclosure.locator('pre')).toBeHidden();
 }
 const violations=[];
 for(const mode of ['light','dark']) {await page.locator('en-segmented-control').getByText(mode==='light'?'Light':'Dark',{exact:true}).click();const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();violations.push(...result.violations.map(x=>({mode,id:x.id,targets:x.nodes.map(n=>n.target)})));}
 await page.getByRole('button',{name:'Reset preview',exact:true}).click();await page.locator('en-sticker-app').evaluate(el=>el.updateComplete);
 const toolsResult=await page.evaluate(async()=>{const tools=globalThis.previewTools;const read=tools.get('read_theme_preview');const configure=tools.get('configure_theme_preview');const before=read.execute({});const applied=await configure.execute({mode:'dark',density:'spacious',rhythm:.375,direction:'rtl',accent:'#6d28d9'});let invalid=false;try{await configure.execute({rhythm:0});}catch{invalid=true;}return {names:[...tools.keys()],before,applied,after:read.execute({}),invalid,dir:document.documentElement.dir};});
 assert.equal(toolsResult.before.mode,'auto');assert.equal(toolsResult.after.mode,'dark');assert.equal(toolsResult.dir,'rtl');assert.equal(toolsResult.invalid,true);assert.equal(toolsResult.after.rhythm,.375);
 assert.equal(await page.getByLabel('Layout rhythm',{exact:true}).inputValue(),'0.375');
 const viewportChecks=[];
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1024,height:768},{width:1440,height:1000}]) {
   await page.setViewportSize(viewport);
   await page.locator('en-navigation.section-nav').getByRole('link',{name:'Feedback',exact:true}).click();
   await expect.poll(async()=>{const nav=await page.getByRole('navigation', { name: 'Sticker sheet sections', exact: true }).boundingBox();const section=await page.locator('#feedback').boundingBox();return section.y>=nav.y+nav.height-1;}).toBe(true);
   const nav=await page.getByRole('navigation', { name: 'Sticker sheet sections', exact: true }).boundingBox();assert.ok(Math.abs(nav.y)<2);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);viewportChecks.push({...viewport,overflow,navigationHeight:nav.height});assert.equal(overflow,false);
 }
 await page.getByRole('button',{name:'Reset preview',exact:true}).click();await page.locator('en-sticker-app').evaluate(el=>el.updateComplete);
 // Large specimen inventories can exceed Firefox's 32767px screenshot limit.
 // Layout/interaction checks still cover the page; capture the viewport past that limit.
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:new URL(name+'-desktop.png',evidenceDir).pathname,fullPage:await page.evaluate(()=>document.documentElement.scrollHeight<32000)});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:new URL(name+'-mobile.png',evidenceDir).pathname,fullPage:await page.evaluate(()=>document.documentElement.scrollHeight<32000)});
 // A direct hash entry must wait for measured sticky geometry, then follow only that navigation.
 await page.goto(new URL('#fields',baseURL).href);await page.waitForSelector('h1');
 const anchorClear=async()=>{const nav=await page.getByRole('navigation', { name: 'Sticker sheet sections', exact: true }).boundingBox();const section=await page.locator('#fields').boundingBox();return section.y>=nav.y+nav.height-1 && section.y<nav.y+nav.height+60;};
 await expect.poll(anchorClear).toBe(true);
 await page.setViewportSize({width:768,height:1024});await expect.poll(anchorClear).toBe(true);
 await page.setViewportSize({width:390,height:844});await expect.poll(anchorClear).toBe(true);
 // Resize leaves the automation pointer at its previous desktop coordinates.
 // Wheel within the viewport so the browser dispatches the user's cancellation event.
 await page.mouse.move(200,400);
 await page.mouse.wheel(0,700);
 await expect.poll(async()=>{const section=await page.locator('#fields').boundingBox();return section.y<0;}).toBe(true);
 await page.setViewportSize({width:400,height:844});
 await expect.poll(async()=>{const section=await page.locator('#fields').boundingBox();return section.y<0;}).toBe(true);
 assert.equal(await page.getByRole('link',{name:'Progress Report',exact:true}).count(),0);await page.goto(new URL('?progress-report',baseURL).href);await page.getByRole('link',{name:'Progress Report',exact:true}).waitFor();assert.equal(await page.getByRole('link',{name:'Progress Report',exact:true}).getAttribute('href'),'http://127.0.0.1:4177');
 assert.deepEqual(errors,[]);report.push({engine:name,status:'passed',errors,violations,specimenCount,sourcePanels,sourceIndentation,viewportChecks,toolsResult,webMCPContext:'injected API contract test; not a native host integration'});console.log(JSON.stringify(report.at(-1)));
 } catch(e) {report.push({engine:name,status:'failed',error:String(e),errors});console.log(JSON.stringify(report.at(-1)));await page.screenshot({path:new URL(name+'-failure.png',evidenceDir).pathname});}finally{await browser.close();}
}
await fs.writeFile(new URL('verification.json',evidenceDir),JSON.stringify(report,null,2));
if(report.some(r=>r.status==='failed'||r.violations?.length))process.exitCode=1;
