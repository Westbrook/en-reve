import {test,expect} from '@playwright/test';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.env.EN_GITHUB_PAGES_BUILD;
const origin='https://westbrook.github.io';
const prefix='/en-reve/';
const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.md':'text/plain'};
test.skip(!root,'Requires a separately built EN_GITHUB_PAGES_BUILD.');
test.beforeEach(async({context,page},info)=>{
 const failures:string[]=[];
 page.on('pageerror',error=>failures.push(error.message));
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin||!url.pathname.startsWith(prefix)){
   failures.push('Request escaped project: '+url.href);await route.abort();return;
  }
  let relative=decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
  let file=resolve(root!,relative);
  if(!file.startsWith(resolve(root!)+'/')){failures.push('Unsafe path: '+url.href);await route.abort();return;}
  if(!await stat(file).then(s=>s.isFile()).catch(()=>false))file += '.html';
  try {await route.fulfill({status:200,contentType:types[extname(file)]??'application/octet-stream',body:await readFile(file)});}
  catch {failures.push('Missing asset: '+url.href);await route.fulfill({status:404,body:'Not found'});}
 });
 (info as any).deploymentFailures=failures;
});
test.afterEach(async({},info)=>{expect((info as any).deploymentFailures).toEqual([]);});
test('project base preserves hydrated navigation, nested controls and fragment links',async({page})=>{
 await page.goto(origin+prefix+'guides.html?progress-report');
 await expect(page.locator('base')).toHaveAttribute('href',origin+prefix);
 await expect(page.getByRole('heading',{level:1})).toHaveText('A shared language for creative applications');
 await page.getByRole('link',{name:'Skip to handbook'}).focus();await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/en-reve\/guides\.html(?:\?[^#]*)?#main$/);
 const internal=page.locator('a[data-preserve-report]').first();expect(await internal.getAttribute('href')).toContain(prefix);
 await internal.click();await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr');expect(new URL(page.url()).pathname.startsWith(prefix)).toBeTruthy();
 await page.goto(origin+prefix+'api-examples/calendar.html');
 await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
 const calendar=page.locator('#specimen-calendar');
 await calendar.locator('button[data-date="2026-09-20"]').click();await expect(calendar).toHaveJSProperty('value','2026-09-20');
 await page.goto(origin+prefix+'api-examples/rich-text.html');
 await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
 const editor=page.locator('#rich-brief');await editor.evaluate((el:any)=>{el.value='';el.focus();});
 const input=editor.getByRole('textbox');await input.pressSequentially('/rev');
 await expect(editor.getByRole('option',{name:'Review tool',exact:true})).toBeVisible();await input.press('Enter');
 await expect(editor).toHaveJSProperty('value','/review');
 // A freshly authored fragment retains this document and its query under <base>.
 await page.evaluate(()=>{const a=document.createElement('a');a.href='#deployment-target';a.textContent='Local section';a.id='deployment-link';const target=document.createElement('h2');target.id='deployment-target';target.textContent='Local section target';document.body.append(a,target);});
 await page.locator('#deployment-link').click();await expect(page).toHaveURL(/\/en-reve\/api-examples\/rich-text\.html#deployment-target$/);
 await page.screenshot({path:test.info().outputPath('github-project-route.png')});
});
test('review manifest, handbook artifacts and preview frames bind to the subpath build',async({page})=>{
 const manifest=JSON.parse(await readFile(resolve(root!,'review-build.json'),'utf8'));
 expect(manifest.deployment).toEqual({basePath:prefix,baseURL:origin+prefix});
 for(const asset of manifest.assets){
  const bytes=await readFile(resolve(root!,asset.path));expect('sha256:'+createHash('sha256').update(bytes).digest('hex'),asset.path).toBe(asset.sha256);
  if(asset.path.endsWith('.html')){const html=bytes.toString();expect(html.match(/<base\s/g)).toHaveLength(1);expect(html).toContain('<base href="'+origin+prefix+'">');}
 }
 const index=JSON.parse(await readFile(resolve(root!,'guides/contract-index.json'),'utf8'));
 for(const item of [...index.artifacts,...index.skills]){expect(item.href.startsWith(prefix)).toBeTruthy();const bytes=await readFile(resolve(root!,item.href.slice(prefix.length)));expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256);}
 await page.goto(origin+prefix+'theme-review.html');
 await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
 await page.getByRole('combobox',{name:'Preview page',exact:true}).selectOption('sso');
 await page.getByRole('button',{name:'Load previews',exact:true}).click();
 for(const variant of ['baseline','candidate']){
  const frame=page.locator('iframe[data-variant="'+variant+'"]');await expect(frame).toHaveAttribute('src',prefix+'workflows?theme-preview');
  await expect(frame.contentFrame().locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
 }
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();
 const file=await (await downloaded).path();const candidate=JSON.parse(await readFile(file!,'utf8'));
 expect(candidate.build.fingerprint).toBe(manifest.fingerprint);expect(candidate.build.pages.every((p:any)=>p.path.startsWith(prefix))).toBeTruthy();
 expect(candidate.impact.status).not.toBe('unavailable');expect(candidate.impact.changed).toEqual([]);
 await expect(page.locator('.review-impact-summary')).toContainText('0 changed token values');
});
