import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createReviewDraft} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {selectImpact} from '../../../tooling/evidence/impact.mjs';
test.setTimeout(60000);
async function exportCandidate(page:Page){const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();return JSON.parse(await readFile((await (await pending).path())!,'utf8'));}
const errors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});
test.afterEach(async({page})=>{expect(errors.get(page)).toEqual([]);});
test('accepted edits expose exact source impact and open the selected case with both previews',async({page,request})=>{
 const manifest=await (await request.get('/impact.json')).json();
 await page.goto('/theme-review?progress-report');
 await expect(page.locator('.review-impact-summary')).toContainText('0 changed token values');
 await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('radius.control');
 await page.getByRole('combobox',{name:'Token',exact:true}).selectOption('radius.control');
 const editor=page.getByRole('form',{name:'Token editor',exact:true});
 await editor.getByRole('combobox',{name:'Managed value',exact:true}).selectOption({label:'1rem'});
 await editor.getByRole('button',{name:'Apply pin',exact:true}).click();
 const file=await exportCandidate(page);const expected=selectImpact(manifest,file.impact.changed);
 expect(file.impact.caseIds).toEqual(expected.caseIds);expect(file.impact.graphDigest).toBe(expected.graphDigest);
 expect(file.impact.changed).toContain('token:radius.control');expect(file.coverage.visualComparison).toBe('not-run');
 await page.locator('.review-impact summary').filter({hasText:'Review affected cases'}).click();
 await page.getByRole('button',{name:'Review buttons',exact:true}).click();
 for(const variant of ['baseline','candidate']) await expect(page.locator(`iframe[data-variant="${variant}"]`)).toHaveAttribute('src','/?theme-preview#specimen-buttons');
 await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
 await expect(page.frameLocator('iframe[data-variant="candidate"]').locator('[data-specimen="buttons"]')).toBeVisible();
 const radius=await page.frameLocator('iframe[data-variant="candidate"]').locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--en-radius-control').trim());expect(radius).toBe('1rem');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.review-impact-summary')).toContainText('0 changed token values');
 await page.getByRole('button',{name:'Redo',exact:true}).click();expect((await exportCandidate(page)).impact).toEqual(file.impact);
 await page.locator('.review-impact summary').filter({hasText:'Review affected cases'}).click();
 await page.getByRole('button',{name:'Review buttons',exact:true}).click();await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
 await page.locator('.review-impact').screenshot({path:test.info().outputPath('candidate-impact.png')});
});
test('paired import accounts for both appearances and mobile case navigation retains the draft',async({page,request})=>{
 const build=await (await request.get('/review-build.json')).json();const light=createReviewDraft(),dark=createReviewDraft();
 dark.setContext({mode:'dark'});light.setToken('component.button.radius',{value:1,unit:'rem'});dark.setToken('component.button.radius',{value:0.75,unit:'rem'});
 const file=exportReviewBundle(light,build,{title:'Impact across appearances',rationale:'Distinct values.'},{},{pair:{name:'impact-pair',light,dark}});
 await page.setViewportSize({width:390,height:844});await page.goto('/theme-review');await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
 await page.getByLabel('Reopen candidate',{exact:true}).setInputFiles({name:'candidate.json',mimeType:'application/json',buffer:Buffer.from(file)});
 await expect(page.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue('Impact across appearances');
 await page.locator('.review-view-switch').getByText('Preview',{exact:true}).click();
 await expect(page.locator('.review-impact-summary')).toContainText('across both appearances');
 const exported=await exportCandidate(page);expect(exported.impact.appearances.map((a:any)=>a.mode)).toEqual(['light','dark']);
 await page.locator('.review-impact summary').filter({hasText:'Review affected cases'}).click();
 await page.getByRole('button',{name:'Review workflow: multi step',exact:true}).click();
 await expect(page.locator('iframe[data-variant="candidate"]')).toHaveAttribute('src','/workflows/multi-step?theme-preview');
 await expect(page.locator('.review-preview-status')).toContainText('candidate cases rendered');
 expect((await exportCandidate(page)).impact).toEqual(exported.impact);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.review-impact').screenshot({path:test.info().outputPath('candidate-impact-mobile.png')});
});
test('a mismatched impact response is unavailable evidence, never an empty or passing result',async({page})=>{
 await page.route('**/impact.json',async route=>{const original=await route.fetch();const body=await original.json();body.policy='Modified';await route.fulfill({response:original,json:body});});
 await page.goto('/theme-review');await expect(page.locator('.review-impact')).toContainText('different or incomplete build');
 await expect(page.locator('.review-impact-summary')).toHaveCount(0);
 const file=await exportCandidate(page);expect(file.impact.status).toBe('unavailable');expect(file.coverage.visualComparison).toBe('not-run');
 await expect(page.getByRole('button',{name:'Load previews',exact:true})).toBeEnabled();
});

for (const response of ['partial','empty','failed'] as const) {
 test(`preview coverage exposes ${response} responses against the planned inventory`,async({page,request})=>{
  const build=await (await request.get('/review-build.json')).json();
  const planned=build.pages.find((item:{id:string})=>item.id==='sheet').caseIds as string[];
  expect(planned.length).toBeGreaterThan(1);
  // Simulate an incomplete or failed preview at its public message boundary.
  // Keep origin, source, request and build identities intact.
  await page.addInitScript(({response,missing})=>{
   if(window!==window.top)return;
   window.addEventListener('message',event=>{
    if(event.source!==document.querySelector<HTMLIFrameElement>('iframe[data-variant="candidate"]')?.contentWindow || event.data?.type!=='en-theme-preview-ready')return;
    if(response==='failed') {event.data.type='en-theme-preview-error';event.data.message='Preview fixture could not render its planned cases.';}
    else event.data.caseIds=response==='empty'?[]:event.data.caseIds.filter((id:string)=>id!==missing);
   },true);
  },{response,missing:planned[0]!});
  await page.goto('/theme-review');
  await page.getByRole('button',{name:'Load previews',exact:true}).click();
  const status=page.locator('.review-preview-status');
  if(response==='failed') {
   await expect(page.getByRole('alert')).toContainText('Preview fixture could not render');
   await expect(status).toContainText(`${planned.length} candidate cases planned`);
   await expect(status).not.toContainText('candidate cases rendered');
   expect((await exportCandidate(page)).coverage.rendered).toEqual([]);
  } else {
   const count=response==='empty'?0:planned.length-1;
   await expect(status).toContainText(`${count} of ${planned.length} candidate cases rendered`);
   const missing=page.locator('.review-preview-missing');
   await expect(missing.locator('summary')).toContainText(`${planned.length-count} planned`);
   await missing.locator('summary').click();
   await expect(missing).toContainText('This preview is incomplete');
   await expect(missing.locator('li')).toHaveCount(planned.length-count);
   await expect(missing).toContainText(planned[0]!);
   const exported=await exportCandidate(page);
   expect(exported.coverage.required.find((item:{page:string})=>item.page==='sheet').caseIds).toEqual(planned);
   expect(exported.coverage.rendered.find((item:{page:string})=>item.page==='sheet').caseIds).toHaveLength(count);
   expect(exported.coverage.browserInteraction).toBe('not-run');
  }
 });
}
