import {test,expect,type Page} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {packageReview} from '../../../tooling/offline-review/package.mjs';
import {createReviewDraft,hashValue} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {captureReview} from '../../../tooling/visual-review/capture.mjs';
import {packageVisualEvidence} from '../../../tooling/visual-review/package.mjs';
test.setTimeout(120000);
const buildDirectory=fileURLToPath(new URL('../../../dist',import.meta.url));
async function capture(browser:any,browserName:string,info:any,paired=false){
 const build=JSON.parse(await readFile(buildDirectory+'/review-build.json','utf8'));
 const light=createReviewDraft(),dark=createReviewDraft();dark.setContext({mode:'dark'});
 const pair=paired?{pair:{name:'reader-pair',light,dark}}:{};
 const baseline=exportReviewBundle(light,build,{title:'Expected',rationale:''},{},pair);
 light.setToken('radius.control',{value:1,unit:'rem'});if(paired)dark.setToken('radius.control',{value:0.75,unit:'rem'});
 const candidate=exportReviewBundle(light,build,{title:'Captured candidate',rationale:'Reader qualification.'},{},pair);
 const baselineFile=info.outputPath('baseline.json'),candidateFile=info.outputPath('candidate.json');await writeFile(baselineFile,baseline);await writeFile(candidateFile,candidate);
 const outputDirectory=info.outputPath('captures');const report=await captureReview({buildDirectory,baselineFile,candidateFile,outputDirectory,cacheDirectory:undefined,options:{engines:[browserName],viewports:[{id:'mobile',width:390,height:844}],cases:[{id:'buttons',page:'sheet',state:'default',selector:'[data-specimen="buttons"]',actions:[]},{id:'calendar',page:'sheet',state:'omitted',selector:'[data-specimen="calendar"]',actions:[]}],selected:['buttons:default']},browsers:{[browserName]:browser}});
 expect(report.results.filter((r:any)=>r.status==='failed')).toEqual([]);
 const bundle=await packageVisualEvidence(outputDirectory,build);
 return {candidate,bundle,report:JSON.parse(bundle).report};
}
async function importFile(page:Page,label:string,text:string){await page.getByLabel(label,{exact:true}).setInputFiles({name:'review.json',mimeType:'application/json',buffer:Buffer.from(text)});}
async function download(page:Page,name:string){const next=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();return readFile((await(await next).path())!,'utf8');}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
test('real capture import, stale draft, undo and separate portable exports retain their identities',async({page,browser,browserName},info)=>{
 const fixture=await capture(browser,browserName,info);
 await page.goto('/theme-review');await expect(page.getByLabel('Import visual evidence')).toBeEnabled();
 await importFile(page,'Import visual evidence',fixture.bundle);await expect(page.locator('[data-evidence-applicability]')).toContainText('Stale for this draft');
 await page.getByRole('button',{name:'Open captured candidate',exact:true}).click();await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
 await page.locator('.visual-results summary').first().click();await expect(page.locator('.visual-images img')).toHaveCount(3);await expect.poll(()=>page.locator('.visual-images img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).naturalWidth>0))).toBe(true);
 await expect(page.locator('.visual-results')).toContainText('not-run');
 const assessmentForm=page.locator('.visual-assessment-form').first();
 await assessmentForm.getByRole('combobox',{name:'Classification',exact:true}).selectOption('intentional');
 await assessmentForm.getByRole('button',{name:'Save assessment',exact:true}).click();
 await expect(page.locator('.visual-assessment [role=alert]')).toContainText('Explain');
 await assessmentForm.getByLabel('Rationale or follow-up',{exact:true}).fill('The larger corners are intentional.');
 await assessmentForm.getByRole('button',{name:'Save assessment',exact:true}).click();
 await expect(page.locator('[data-assessment-summary]')).toContainText('1 intentional');
 await expect(page.locator('[data-assessment-summary]')).toContainText('1 open notes');
 await assessmentForm.getByRole('combobox',{name:'Follow-up status',exact:true}).selectOption('resolved');
 await assessmentForm.getByRole('button',{name:'Save assessment',exact:true}).click();
 await expect(page.locator('[data-assessment-summary]')).toContainText('0 open notes');
 const assessment=await download(page,'Export assessment');

 const originalExport=JSON.parse(await download(page,'Export candidate'));expect(originalExport.visualEvidence.integrity).toBe(fixture.report.integrity);
 await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('radius.control');await page.getByRole('combobox',{name:'Token',exact:true}).selectOption('radius.control');
 const editor=page.getByRole('form',{name:'Token editor',exact:true});await editor.getByRole('combobox',{name:'Managed value',exact:true}).selectOption({label:'0rem'},{timeout:10000});await editor.getByRole('button',{name:'Apply pin',exact:true}).click();await expect(page.locator('[data-evidence-applicability]')).toContainText('Stale for this draft');
 await expect(assessmentForm.getByLabel('Rationale or follow-up',{exact:true})).toBeDisabled();
 await expect(page.locator('[data-assessment-stale]')).toBeVisible();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
 await expect(assessmentForm.getByLabel('Rationale or follow-up',{exact:true})).toBeEnabled();
 const portable=await download(page,'Export visual evidence');expect(JSON.parse(portable).report.integrity).toBe(fixture.report.integrity);
 await page.reload();await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();await importFile(page,'Reopen candidate',JSON.stringify(originalExport));await expect(page.locator('[data-evidence-missing]')).toContainText('artifacts are missing');
 await importFile(page,'Import visual evidence',portable);await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
 await expect(page.locator('[data-assessment-summary]')).toContainText('0 intentional');
 await importFile(page,'Import assessment',assessment);await expect(page.locator('[data-assessment-summary]')).toContainText('1 intentional');
 await page.locator('.visual-results summary').first().click();
 await assessmentForm.getByLabel('Rationale or follow-up',{exact:true}).fill('Unsaved form text.');
 await importFile(page,'Import assessment',assessment);
 await expect(assessmentForm.getByLabel('Rationale or follow-up',{exact:true})).toHaveValue('The larger corners are intentional.');

 const altered=JSON.parse(assessment);altered.updatedAt='changed';await importFile(page,'Import assessment',JSON.stringify(altered));
 await expect(page.locator('.visual-assessment [role=alert]')).toContainText('integrity');
 const different=JSON.parse(assessment);different.evidence.run='different-run';const {integrity:oldIntegrity,...differentBody}=different;different.integrity=hashValue(differentBody);
 await importFile(page,'Import assessment',JSON.stringify(different));await expect(page.locator('.visual-assessment [role=alert]')).toContainText('another evidence');
 expect(JSON.parse(await download(page,'Export assessment'))).toEqual(JSON.parse(assessment));
 await page.getByRole('button',{name:'Unload evidence',exact:true}).click();await importFile(page,'Import visual evidence',portable);
 await expect(page.locator('[data-assessment-summary]')).toContainText('1 intentional');

 const corrupt=JSON.parse(portable);corrupt.files.find((f:any)=>f.path.endsWith('.png')).base64='YWJj';await importFile(page,'Import visual evidence',JSON.stringify(corrupt));await expect(page.locator('.visual-evidence [role=alert]')).toContainText('Corrupt');await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
 await page.locator('.visual-results summary').first().click();await page.locator('.visual-evidence').screenshot({path:info.outputPath('reader.png')});
});
test('paired mobile evidence exposes missing images and rejects stale builds without replacing the draft',async({page,browser,browserName},info)=>{
 const fixture=await capture(browser,browserName,info,true),bundle=JSON.parse(fixture.bundle);bundle.files=bundle.files.filter((f:any)=>!f.path.endsWith('.png'));
 await page.setViewportSize({width:390,height:844});await page.goto('/theme-review');await expect(page.getByLabel('Import visual evidence')).toBeEnabled();await importFile(page,'Import visual evidence',JSON.stringify(bundle));
 await expect(page.locator('.visual-evidence')).toContainText('artifacts missing');await page.getByRole('button',{name:'Open captured candidate',exact:true}).click();await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
 await expect(page.locator('.visual-results summary')).toHaveCount(4);await page.locator('.visual-results summary').first().click();await expect(page.locator('.visual-images img')).toHaveCount(0);await expect(page.locator('.visual-images').first()).toContainText('Expected image missing');
 const assessmentForm=page.locator('.visual-assessment-form').first();
 await expect(assessmentForm.locator('option[value="intentional"]')).toHaveJSProperty('disabled',true);
 await expect(assessmentForm.locator('option[value="regression"]')).toHaveJSProperty('disabled',true);
 await assessmentForm.getByLabel('Rationale or follow-up',{exact:true}).fill('Restore the missing images before assessment.');
 await assessmentForm.getByRole('button',{name:'Save assessment',exact:true}).click();
 await expect(page.locator('[data-assessment-summary]')).toContainText('4 unassessed');
 await expect(page.locator('[data-assessment-summary]')).toContainText('1 open notes');

 const stale=JSON.parse(fixture.bundle);stale.report.buildFingerprint='sha256:'+'f'.repeat(64);const {integrity,...payload}=stale.report;stale.report={...payload,integrity:hashValue(payload)};await importFile(page,'Import visual evidence',JSON.stringify(stale));await expect(page.locator('.visual-evidence [role=alert]')).toContainText('different documentation build');await expect(page.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue('Captured candidate');
 const corrupt=JSON.parse(fixture.bundle);corrupt.files.find((f:any)=>f.path.endsWith('.png')).base64='YWJj';await importFile(page,'Import visual evidence',JSON.stringify(corrupt));await expect(page.locator('.visual-evidence [role=alert]')).toContainText('Corrupt');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('.visual-evidence').screenshot({path:info.outputPath('reader-mobile.png')});
});

test('visual evidence and candidate reference roundtrip without external network access',async({browser,browserName},info)=>{
 const fixture=await capture(browser,browserName,info);
 const candidateFile=info.outputPath('offline-candidate.json');await writeFile(candidateFile,fixture.candidate);
 const directory=info.outputPath('offline-package');await packageReview({buildDirectory,candidateFile,outputDirectory:directory});
 const {startOfflineReview}=await import(pathToFileURL(resolve(directory,'serve.mjs')).href);
 const server=await startOfflineReview(directory),context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const external:string[]=[],pageErrors:string[]=[];
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==server.url){external.push(url.href);return route.abort();}return route.continue();});
 try {
  const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(server.url+'/offline-review');await page.getByRole('link',{name:'Open Theme Review',exact:true}).click();
  await expect(page.getByLabel('Import visual evidence')).toBeEnabled();
  await importFile(page,'Reopen candidate',fixture.candidate);await importFile(page,'Import visual evidence',fixture.bundle);
  await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
  await page.locator('.visual-results summary').first().click();
  await expect(page.locator('.visual-images img')).toHaveCount(3);await expect.poll(()=>page.locator('.visual-images img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).naturalWidth>0))).toBe(true);
  const assessmentForm=page.locator('.visual-assessment-form').first();
  await assessmentForm.getByRole('combobox',{name:'Classification',exact:true}).selectOption('regression');
  await assessmentForm.getByLabel('Rationale or follow-up',{exact:true}).fill('The focus boundary needs another review.');
  await assessmentForm.getByRole('button',{name:'Save assessment',exact:true}).click();
  const assessment=await download(page,'Export assessment');
  const candidate=await download(page,'Export candidate'),evidence=await download(page,'Export visual evidence');
  expect(JSON.parse(candidate).visualEvidence.integrity).toBe(fixture.report.integrity);expect(JSON.parse(evidence).report.integrity).toBe(fixture.report.integrity);
  await page.reload();await expect(page.getByLabel('Reopen candidate')).toBeEnabled();await importFile(page,'Reopen candidate',candidate);
  await expect(page.locator('[data-evidence-missing]')).toContainText('artifacts are missing');
  await importFile(page,'Import visual evidence',evidence);await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
  await importFile(page,'Import assessment',assessment);await expect(page.locator('[data-assessment-summary]')).toContainText('1 suspected regressions');
  expect(JSON.parse(await download(page,'Export assessment'))).toEqual(JSON.parse(assessment));
  expect(external).toEqual([]);expect(pageErrors).toEqual([]);
 } finally {await context.close();await server.close();}
});


test('a pending assessment import cannot replace notes after the draft changes',async({page,browser,browserName},info)=>{
 const fixture=await capture(browser,browserName,info);
 await page.goto('/theme-review');await expect(page.getByLabel('Import visual evidence')).toBeEnabled();
 await importFile(page,'Import visual evidence',fixture.bundle);await page.getByRole('button',{name:'Open captured candidate',exact:true}).click();
 await page.locator('.visual-results summary').first().click();const form=page.locator('.visual-assessment-form').first();
 await form.getByLabel('Rationale or follow-up',{exact:true}).fill('Keep this existing note.');await form.getByRole('button',{name:'Save assessment',exact:true}).click();
 const original=await download(page,'Export assessment'),incoming=JSON.parse(original),key=Object.keys(incoming.entries)[0]!;
 incoming.entries[key].note='Late replacement must not be applied.';const {integrity,...body}=incoming;incoming.integrity=hashValue(body);
 await page.evaluate(()=>{
  const original=File.prototype.text;
  File.prototype.text=function(){if(this.name!=='delayed-assessment.json')return original.call(this);return new Promise<string>((resolve,reject)=>{(window as any).releaseAssessmentFile=()=>{File.prototype.text=original;original.call(this).then(resolve,reject);};});};
 });
 await page.getByLabel('Import assessment',{exact:true}).setInputFiles({name:'delayed-assessment.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 await expect(page.locator('.visual-assessment [role=status]')).toHaveText('Checking assessment…');
 await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('radius.control');await page.getByRole('combobox',{name:'Token',exact:true}).selectOption('radius.control');
 const editor=page.getByRole('form',{name:'Token editor',exact:true});await editor.getByRole('combobox',{name:'Managed value',exact:true}).selectOption({label:'0rem'});await editor.getByRole('button',{name:'Apply pin',exact:true}).click();
 await page.evaluate(()=>(window as any).releaseAssessmentFile());await expect(page.getByLabel('Import assessment',{exact:true})).toBeEnabled();
 expect(JSON.parse(await download(page,'Export assessment'))).toEqual(JSON.parse(original));
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(form.getByLabel('Rationale or follow-up',{exact:true})).toBeEnabled();
 await expect(form.getByLabel('Rationale or follow-up',{exact:true})).toHaveValue('Keep this existing note.');
});
