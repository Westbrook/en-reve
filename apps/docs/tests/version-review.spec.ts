import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdir, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRelease } from '../../../tooling/releases/release.ts';
import { digest } from '../../../tooling/offline-review/runtime.mjs';
import { bundleScopedFixture } from '../../../tooling/releases/scoped-fixture.mjs';
import { packageVersionReview } from '../../../tooling/releases/review-package.mjs';

test('version review isolates real docs, preserves responsive state and round-trips bound feedback',async({browser},info)=>{
  test.setTimeout(90000);
  const afterDirectory=fileURLToPath(new URL('../../../dist',import.meta.url));
  // Supply an original retained build for a real version pair. With no historical
  // input, this is explicitly a same-build isolation fixture, not change evidence.
  const beforeDirectory=process.env.EN_VERSION_REVIEW_BEFORE_BUILD??afterDirectory;
  const json=async(root:string,name:string)=>JSON.parse(await readFile(resolve(root,name),'utf8'));
  const source=info.outputPath('source');await mkdir(source,{recursive:true});
  await symlink(fileURLToPath(new URL('../../../node_modules',import.meta.url)),resolve(source,'node_modules'),'dir');
  const scoped={before:info.outputPath('scoped-before'),after:info.outputPath('scoped-after')};
  for(const side of ['before','after'] as const){
    const entry=resolve(source,side+'.js');
    await writeFile(entry,`import {createElementScope} from '@en-reve/elements/element-scope.js';
import {buttonDefinition} from '@en-reve/elements/definitions/button.js';
export async function mount({host,registry}){const scope=createElementScope({document:host.ownerDocument,registry});scope.register([buttonDefinition]);const root=scope.attachShadow(host);const button=scope.createElement('en-button');button.textContent='${side} action';const output=document.createElement('output');output.textContent='0';let count=0;button.addEventListener('click',()=>output.textContent=String(++count));root.append(button,output);await button.updateComplete;return ()=>root.replaceChildren();}`);
    await bundleScopedFixture({entry,scenarios:['theme'],outputDirectory:scoped[side]});
  }
  const beforeCem=await json(beforeDirectory,'custom-elements.json'),afterCem=await json(afterDirectory,'custom-elements.json');
  const release=createRelease({schemaVersion:1,sample:true,packageTrain:['@en-reve/docs'],baseVersion:'0.1.0',baseArtifacts:{scopedFixture:digest(await readFile(resolve(scoped.before,'fixture.json'))),reviewBuild:digest(await readFile(resolve(beforeDirectory,'review-build.json')))},candidateArtifacts:{scopedFixture:digest(await readFile(resolve(scoped.after,'fixture.json'))),reviewBuild:digest(await readFile(resolve(afterDirectory,'review-build.json')))},changes:[{id:'review-delivery',components:['$package'],level:'fix',summary:'Review documentation delivery',rationale:'A reproducible paired viewer fixture, not a package release.',evidence:[]}]},beforeCem,afterCem,{before:await json(beforeDirectory,'public-types.json'),after:await json(afterDirectory,'public-types.json'),graphs:{before:await json(beforeDirectory,'public-api.json'),after:await json(afterDirectory,'public-api.json')}});
  const releaseFile=resolve(source,'release.json');await writeFile(releaseFile,JSON.stringify(release));
  const outputDirectory=info.outputPath('review');await packageVersionReview({beforeDirectory,afterDirectory,releaseFile,outputDirectory,scoped,scenarios:[{id:'theme',scoped:true,title:'Theme editor',component:'$package',before:'/theme-review',after:'/theme-review',instructions:'Edit the title in one side and compare the other.'},{id:'introduced',title:'New guide section',component:'$package',before:null,beforeUnavailable:'Section introduced by this documentation change.',after:'/guides.html#version-review'}]});
  const {startVersionReview}=await import(pathToFileURL(resolve(outputDirectory,'tooling/releases/review-server.mjs')).href);const server=await startVersionReview(outputDirectory);
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});const external:string[]=[],errors:string[]=[];
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(!Object.values(server.origins).includes(url.origin)){external.push(url.href);return route.abort();}return route.continue();});
  try{
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(server.url);
    await expect(page.getByText('Sample comparison —',{exact:false})).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);
    const supports=await page.evaluate(()=>{try{const registry=new CustomElementRegistry();return document.createElement('div').attachShadow({mode:'open',customElementRegistry:registry} as ShadowRootInit).customElementRegistry===registry;}catch{return false;}});
    await page.getByRole('button',{name:'Load scoped components'}).click();
    if(supports){
      await expect(page.locator('#scoped-status')).toContainText('independent native registries');
      await page.locator('#scoped-before').getByRole('button',{name:'before action',exact:true}).click();await expect(page.locator('#scoped-before output')).toHaveText('1');await expect(page.locator('#scoped-after output')).toHaveText('0');
      expect(await page.evaluate(()=>customElements.get('en-button')===undefined)).toBe(true);
      const isolation=await page.evaluate(()=>{const a=document.querySelector('#scoped-before>div')!.shadowRoot!,b=document.querySelector('#scoped-after>div')!.shadowRoot!;return a.customElementRegistry!==b.customElementRegistry&&a.querySelector('en-button')!.constructor!==b.querySelector('en-button')!.constructor;});expect(isolation).toBe(true);
      info.annotations.push({type:'scoped-registry',description:'native same-tag independent version bundles passed'});
    }else{await expect(page.locator('#scoped-status')).toContainText('unsupported');await expect(page.locator('#scoped-before en-button')).toHaveCount(0);info.annotations.push({type:'scoped-registry',description:'unsupported engine; explicit not-run, no global fallback'});}
    await page.getByRole('button',{name:'Load selected scenario'}).click();
    const before=page.frameLocator('iframe[title="Before version preview"]'),after=page.frameLocator('iframe[title="After version preview"]');
    for(const frame of [before,after])await expect(frame.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
    await before.getByRole('textbox',{name:'Candidate title',exact:true}).fill('Independent before');await expect(after.getByRole('textbox',{name:'Candidate title',exact:true})).not.toHaveValue('Independent before');
    await before.locator('html').evaluate(()=>localStorage.setItem('version-review-isolation','before'));
    expect(await after.locator('html').evaluate(()=>localStorage.getItem('version-review-isolation'))).toBeNull();
    await page.getByRole('combobox',{name:'Observation',exact:true}).selectOption('issue-observed');await page.getByLabel('Scenario notes').fill('A version-bound review note');
    await page.getByLabel('Review environment').fill('Automated browser fixture');
    await page.getByRole('combobox',{name:'Scenario',exact:true}).selectOption('introduced');await expect(page.getByText('Unavailable: Section introduced by this documentation change.')).toBeVisible();
    await page.getByRole('button',{name:'Load selected scenario'}).click();await expect(page.locator('iframe')).toHaveCount(1);
    await page.getByRole('combobox',{name:'Scenario',exact:true}).selectOption('theme');await expect(page.getByLabel('Scenario notes')).toHaveValue('A version-bound review note');
    await page.getByRole('button',{name:'Load selected scenario'}).click();await expect(before.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
    await page.setViewportSize({width:390,height:844});await page.getByRole('radio',{name:'After',exact:true}).check();await expect(page.locator('#before-panel')).toBeHidden();await expect(page.locator('#after-panel')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath('version-review-mobile.png'),fullPage:false});
    const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export feedback'}).click();const bytes=await readFile((await(await downloading).path())!);const feedback=JSON.parse(bytes.toString());expect(feedback.adopted).toBe(false);expect(feedback.observations[0].notes).toBe('A version-bound review note');
    await page.getByLabel('Scenario notes').fill('Changed');await page.getByLabel('Reopen feedback').setInputFiles({name:'feedback.json',mimeType:'application/json',buffer:bytes});await expect(page.getByLabel('Scenario notes')).toHaveValue('A version-bound review note');
    feedback.reviewDigest='wrong';await page.getByLabel('Reopen feedback').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(feedback))});await expect(page.getByRole('alert')).toContainText('exact review');await expect(page.getByLabel('Scenario notes')).toHaveValue('A version-bound review note');
    await page.setViewportSize({width:1440,height:1000});await page.getByRole('radio',{name:'Side by side'}).check();await page.screenshot({path:info.outputPath('version-review-desktop.png'),fullPage:false});
    expect(external).toEqual([]);expect(errors).toEqual([]);
  }finally{await context.close();await server.close();}
});
