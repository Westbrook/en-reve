import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createReviewDraft} from '@en-reve/tokens';
import {exportReviewBundle} from '../src/theme-review/bundle.js';
import {inspectBuild} from '../../../tooling/offline-review/build.mjs';
import {captureReview,createBuildContext} from '../../../tooling/visual-review/capture.mjs';
import {captureTarget} from '../../../tooling/visual-review/target-capture.mjs';
import {waitForRenderedElements} from '../../../tooling/visual-review/readiness.mjs';
import {packageVisualEvidence} from '../../../tooling/visual-review/package.mjs';
import {packageVisualEvidenceParts,verifyVisualEvidenceParts} from '../../../tooling/visual-review/package-parts.mjs';

const buildDirectory=process.env.EN_GITHUB_PAGES_BUILD;
test.skip(!buildDirectory,'Requires the original separately qualified project-path build.');
test.setTimeout(300000);
test('project-path capture preserves paired responsive states and imports into its exact build',async({browser,browserName},info)=>{
 const snapshot=await inspectBuild(buildDirectory!,{allowProjectPath:true}),build=snapshot.build;
 expect(snapshot.deployment.basePath).toBe('/en-reve/');
 const light=createReviewDraft(),dark=createReviewDraft();dark.setContext({mode:'dark'});
 const pair={pair:{name:'project-capture',light,dark}};
 const baseline=exportReviewBundle(light,build,{title:'Expected project build',rationale:''},{},pair);
 light.setToken('radius.control',{value:1,unit:'rem'});dark.setToken('radius.control',{value:0.75,unit:'rem'});
 const candidate=exportReviewBundle(light,build,{title:'Project-path visual candidate',rationale:'Paired responsive capture.'},{},pair);
 const baselineFile=info.outputPath('baseline.json'),candidateFile=info.outputPath('candidate.json');await writeFile(baselineFile,baseline);await writeFile(candidateFile,candidate);
 const outputDirectory=info.outputPath('capture');
 const result=await captureReview({buildDirectory:buildDirectory!,baselineFile,candidateFile,outputDirectory,cacheDirectory:undefined,browsers:{[browserName]:browser},options:{engines:[browserName],viewports:[{id:'desktop',width:1000,height:800},{id:'mobile',width:390,height:844}],cases:[
  {id:'buttons',page:'sheet',state:'default',selector:'[data-specimen="buttons"]',actions:[]},
  {id:'buttons',page:'sheet',state:'focus',selector:'[data-specimen="buttons"]',actions:[{kind:'focus',selector:'[data-specimen="buttons"] en-button button >> nth=0'}]},
  {id:'workflow:settings',page:'settings',state:'default',selector:'.workflow-section[id="settings"]',actions:[]},
 ]}});
 expect(result.results.filter((row:any)=>!['passed','different'].includes(row.status))).toEqual([]);
 expect(result.results).toHaveLength(12);expect(result.results.some((row:any)=>row.status==='different')).toBe(true);
 for(const viewport of ['desktop','mobile'])for(const appearance of ['light','dark']){
  const rows=result.results.filter((row:any)=>row.viewport.id===viewport&&row.appearance===appearance);
  expect(rows[0].captures.actual.artifact.digest).not.toBe(rows[1].captures.actual.artifact.digest);
  for(const row of rows)expect(row.captures.actual.details.reply.buildFingerprint).toBe(build.fingerprint);
  expect(rows[2].captures.actual.details.coverage.method).toBe('scroll-tiles');
  expect(rows[2].captures.actual.details.readiness.afterActions.deferredNonpainting).toContain('en-command-palette#settings-command-palette');
 }
 const bundle=await packageVisualEvidence(outputDirectory,build);
 const {context,failures}=await createBuildContext(browser,snapshot,{width:1000,height:800},'light');
 try {
  const page=await context.newPage();const {origin,basePath}=snapshot.deployment;
  await page.goto(origin+basePath+'theme-review');await expect(page.locator('base')).toHaveAttribute('href',origin+basePath);
  await expect(page.getByLabel('Import visual evidence')).toBeEnabled();await page.getByLabel('Import visual evidence',{exact:true}).setInputFiles({name:'project-evidence.json',mimeType:'application/json',buffer:Buffer.from(bundle)});
  await expect(page.locator('.visual-evidence [role=alert]')).toHaveCount(0);await page.getByRole('button',{name:'Open captured candidate',exact:true}).click();
  await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');await expect(page.locator('.visual-results summary')).toHaveCount(12);
  await page.locator('.visual-results summary').first().click();await page.locator('.visual-images').first().scrollIntoViewIfNeeded();await expect.poll(()=>page.locator('.visual-images').first().locator('img').evaluateAll((images: Element[])=>images.length===3&&images.every(image=>(image as HTMLImageElement).naturalWidth>0))).toBe(true);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();
  const exported=JSON.parse(await readFile((await(await pending).path())!,'utf8'));expect(exported.build.fingerprint).toBe(build.fingerprint);expect(exported.visualEvidence.integrity).toBe(JSON.parse(bundle).report.integrity);
  // Force a real multi-part transfer from the same acquisition; do not recapture.
  const partsDirectory=info.outputPath('portable-parts');
  const index=await packageVisualEvidenceParts(outputDirectory,build,partsDirectory,{maxBytes:Buffer.byteLength(bundle)-1});
  expect(index.parts.length).toBeGreaterThan(1);
  const verified=await verifyVisualEvidenceParts(partsDirectory,build);expect(verified.rows).toBe(12);
  const seen=new Set<string>();
  for(const part of index.parts){
   const bytes=await readFile(partsDirectory+'/'+part.path);
   await page.getByLabel('Import visual evidence',{exact:true}).setInputFiles({name:part.path,mimeType:'application/json',buffer:bytes});
   await expect(page.locator('.visual-evidence').getByText(part.integrity,{exact:true})).toHaveCount(1);
   await expect(page.locator('.visual-evidence [role=alert]')).toHaveCount(0);
   await expect(page.locator('.visual-results summary')).toHaveCount(part.rows.length);
   await expect(page.locator('[data-evidence-applicability]')).toContainText('Captured source matches');
   const summary=page.locator('.visual-results summary').first();
   if(await summary.locator('..').getAttribute('open')===null)await summary.click();
   await expect(page.locator('.visual-images').first()).toBeVisible();
   await expect.poll(()=>page.locator('.visual-images').first().locator('img').evaluateAll((images: Element[])=>images.length===3&&images.every(image=>(image as HTMLImageElement).naturalWidth>0))).toBe(true);
   const partDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();
   const partExport=JSON.parse(await readFile((await(await partDownload).path())!,'utf8'));
   expect(partExport.visualEvidence.integrity).toBe(part.integrity);
   for(const key of part.rows){expect(seen.has(key)).toBe(false);seen.add(key);}
  }
  expect([...seen].sort()).toEqual(result.results.map((row:any)=>row.key).sort());
  expect(failures).toEqual([]);
  // The routing boundary also refuses same-origin paths outside the project.
  await page.evaluate(()=>{void fetch('/outside-project').catch(()=>undefined);void fetch('https://example.invalid/outside-origin').catch(()=>undefined);});
  await expect.poll(()=>failures.length).toBe(2);
  expect(failures).toEqual(expect.arrayContaining([expect.stringContaining('Request escaped project path'),expect.stringContaining('External request blocked')]));
 } finally {await context.close();}
});


test('capture readiness distinguishes closed lazy content from visible unregistered content',async({page})=>{
 await page.setContent('<main><test-hidden hidden>Deferred</test-hidden><test-empty></test-empty><test-deferred hidden defer-hydration></test-deferred><test-delayed>Waiting</test-delayed></main>');
 await page.evaluate(()=>{customElements.define('test-deferred',class extends HTMLElement {static observedAttributes=['defer-hydration'];resume=()=>{};updateComplete=new Promise<void>(resolve=>{this.resume=resolve;});attributeChangedCallback(){if(!this.hasAttribute('defer-hydration'))this.resume();}});setTimeout(()=>customElements.define('test-delayed',class extends HTMLElement{}),40);});
 const ready=await page.locator('main').evaluate(waitForRenderedElements);
 expect(ready.ready).toContain('test-delayed');expect(ready.deferredNonpainting).toEqual(['test-deferred','test-empty','test-hidden']);
 await page.locator('test-hidden').evaluate(element=>element.removeAttribute('hidden'));
 await expect(page.locator('main').evaluate(waitForRenderedElements,100)).rejects.toThrow('Custom-element readiness timed out at test-hidden');
 await page.evaluate(()=>{customElements.define('test-hidden',class extends HTMLElement{});document.querySelector('test-deferred')!.removeAttribute('defer-hydration');});
 const opened=await page.locator('main').evaluate(waitForRenderedElements);
 expect(opened.ready).toContain('test-hidden');expect(opened.ready).toContain('test-deferred');expect(opened.deferredNonpainting).toEqual(['test-empty']);
});


test('tall and wide embedded captures retain lower pixels without changing viewport',async({page})=>{
 await page.setViewportSize({width:360,height:240});
 await page.setContent('<style>html,body{margin:0;overflow:hidden}iframe{display:block;border:0;width:360px;height:240px}</style><iframe></iframe>');
 const frame=page.frames()[1]!;await frame.setContent('<style>body{margin:0}header{height:35px;position:sticky;top:0;background:yellow}aside{height:55.4px}main{margin-left:20px;width:470px;height:970px;background:linear-gradient(to bottom,red 0 300px,lime 300px 600px,blue 600px)}footer{height:80px}</style><header>Header</header><aside></aside><main></main><footer>Footer</footer>');
 const result=await captureTarget(page,frame,frame.locator('main'),{animations:'disabled',caret:'hide',scale:'css',type:'png'});
 expect(result.coverage.method).toBe('scroll-tiles');expect(result.coverage.safeViewport.top).toBe(35);expect(result.coverage.tiles).toHaveLength(10);
 expect(await frame.evaluate(()=>({width:innerWidth,height:innerHeight}))).toEqual({width:360,height:240});
 const pixels=await page.evaluate(async(base64:string)=>{const image=await createImageBitmap(new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/png'}));const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return {width:image.width,height:image.height,samples:[100,450,900].map(y=>[100,450].map(x=>[...ctx.getImageData(x,y,1,1).data]))};},result.bytes.toString('base64'));
 expect(pixels).toEqual({width:470,height:970,samples:[[[255,0,0,255],[255,0,0,255]],[[0,255,0,255],[0,255,0,255]],[[0,0,255,255],[0,0,255,255]]]});
 await frame.locator('main').evaluate(element=>{element.style.width='250px';element.style.height='220px';});
 const compact=await captureTarget(page,frame,frame.locator('main'),{animations:'disabled',caret:'hide',scale:'css',type:'png'});
 expect(compact.coverage.method).toBe('scroll-tiles');expect(compact.coverage.tiles).toHaveLength(2);expect(compact.coverage.height).toBe(220);
});
