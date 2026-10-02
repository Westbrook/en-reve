import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { packageReview } from '../../../tooling/offline-review/package.mjs';


test('candidate package reopens and compares with external network blocked', async ({ page, browser }, info) => {
  test.setTimeout(90000);
  await page.goto('/theme-review');
  const title = page.getByRole('textbox', {name:'Candidate title',exact:true});
  await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
  await title.fill('Disconnected candidate');
  const search=page.getByRole('searchbox',{name:'Find a token',exact:true});
  await search.fill('radius.control');
  const selector=page.getByRole('combobox',{name:'Token',exact:true});
  // A real accepted token change, not just a metadata-only export.
  await selector.selectOption('radius.control');
  const form=page.getByRole('form',{name:'Token editor',exact:true});
  await form.getByRole('combobox',{name:'Managed value',exact:true}).selectOption({label:'1rem'});
  await page.getByRole('button',{name:'Apply pin',exact:true}).click();
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export candidate',exact:true}).click();
  const download=await pending;const bytes=await readFile((await download.path())!);
  await mkdir(info.outputPath('source'),{recursive:true});const candidate=info.outputPath('source/candidate.json');await writeFile(candidate,bytes);
  const directory=info.outputPath('portable');
  await packageReview({buildDirectory:fileURLToPath(new URL('../../../dist',import.meta.url)),candidateFile:candidate,outputDirectory:directory});
  const {startOfflineReview}=await import(pathToFileURL(resolve(directory,'serve.mjs')).href);
  const server=await startOfflineReview(directory);
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const external:string[]=[], errors:string[]=[];
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==server.url){external.push(url.href);return route.abort();}
    return route.continue();
  });
  try {
    const offline=await context.newPage();offline.on('pageerror',error=>errors.push(error.message));
    await offline.goto(server.url+'/offline-review');
    await expect(offline.getByRole('heading',{name:'Offline theme review',exact:true})).toBeVisible();
    await offline.getByRole('link',{name:'Open Theme Review',exact:true}).click();
    await expect(offline.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
    await offline.getByLabel('Reopen candidate',{exact:true}).setInputFiles(resolve(directory,'candidate.json'));
    await expect(offline.getByRole('textbox',{name:'Candidate title',exact:true})).toHaveValue('Disconnected candidate');
    await offline.getByRole('combobox',{name:'Preview page',exact:true}).selectOption('settings');
    await offline.getByRole('button',{name:'Load previews',exact:true}).click();
    for(const kind of ['Baseline','Candidate']){
      await expect(offline.frameLocator(`iframe[title="${kind} preview"]`).locator('en-workflows-app')).toBeVisible();
    }
    const candidateFrame=offline.frameLocator('iframe[title="Candidate preview"]');
    await expect.poll(()=>candidateFrame.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--en-radius-control').trim())).toBe('1rem');
    const baseline=await offline.frameLocator('iframe[title="Baseline preview"]').locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--en-radius-control').trim());
    expect(baseline).not.toBe('1rem');
    const again=offline.waitForEvent('download');await offline.getByRole('button',{name:'Export candidate',exact:true}).click();
    const reopened=JSON.parse((await readFile((await (await again).path())!)).toString());expect(reopened.draft.candidate.title).toBe('Disconnected candidate');
    await offline.screenshot({path:info.outputPath('offline-review.png'),fullPage:false});
    expect(errors).toEqual([]);expect(external).toEqual([]);
  } finally {await context.close();await server.close();}
});
