import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';

test('CSS and managed geometry agree, restore contextual defaults, and preserve appearance', async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/theme-authoring.html?progress-report');
  for (const name of ['css','managed']) await expect(page.locator(`#${name}-readout`)).toHaveText('Input 12px · Button 8px');
  await page.getByLabel('Shared radius',{exact:true}).selectOption('24');
  await page.getByRole('button',{name:'Apply radius',exact:true}).click();
  for (const name of ['css','managed']) await expect(page.locator(`#${name}-readout`)).toHaveText('Input 24px · Button 8px');
  await page.getByLabel('Appearance',{exact:true}).selectOption('dark');
  await expect(page.locator('#managed-sample input')).toHaveCSS('background-color','rgb(28, 33, 39)');
  await page.getByRole('button',{name:'Restore shared radius',exact:true}).click();
  for (const name of ['css','managed']) await expect(page.locator(`#${name}-readout`)).toHaveText('Input 8px · Button 8px');
  await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Theme Review',exact:true})).toHaveAttribute('href',/progress-report/);
  await page.goto('/theme-authoring.html');
  await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeHidden();
  expect(errors).toEqual([]);
});

test('typed font and shadow survive real export/reopen, and invalid files preserve the preview', async ({page}) => {
  await page.goto('/theme-authoring.html');
  await expect(page.locator('#rich-readout')).toContainText('weight 450');
  await expect(page.locator('#rich en-card [part="base"]')).toHaveCSS('font-family',/Georgia/);
  const initialShadow = await page.locator('#rich en-card [part="base"]').evaluate(e=>getComputedStyle(e).boxShadow);
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export authoring draft',exact:true}).click();
  const downloaded=await downloadEvent;const bytes=await readFile((await downloaded.path())!);
  const draft=JSON.parse(bytes.toString());
  expect(draft.baseOptions.pins['shadow.overlay']).toHaveLength(2);
  const shadowMenu=page.getByLabel('Baseline shadow',{exact:true});
  const other=await shadowMenu.evaluate(e=>[...(e as HTMLSelectElement).options].find(o=>!o.selected)!.value);
  await shadowMenu.selectOption(other);
  await page.getByRole('button',{name:'Apply shadow',exact:true}).click();
  await expect(page.locator('#rich en-card [part="base"]')).not.toHaveCSS('box-shadow',initialShadow);
  await page.getByLabel('Reopen authoring draft',{exact:true}).setInputFiles({name:'saved.json',mimeType:'application/json',buffer:bytes});
  await expect(page.locator('#draft-status')).toContainText('Draft reopened');
  await expect(page.locator('#rich en-card [part="base"]')).toHaveCSS('box-shadow',initialShadow);
  await page.getByLabel('Reopen authoring draft',{exact:true}).setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await expect(page.locator('#draft-status')).toContainText('Draft unchanged');
  await expect(page.locator('#rich en-card [part="base"]')).toHaveCSS('box-shadow',initialShadow);
});

test('promoted pins affect real consumers and full children restore size-aware defaults', async ({page}) => {
  await page.goto('/theme-authoring.html');
  await expect(page.locator('#managed-readout')).toContainText('Input 12px');
  const parent=resolveTheme({pins:{
    'component.control.radius':{value:24,unit:'px'},'component.control.inline-padding':{value:28,unit:'px'},
    'component.control.min-size':{value:56,unit:'px'},'component.control.background':{colorSpace:'srgb',components:[1,0,0]},
    'component.control.color':{colorSpace:'srgb',components:[1,1,1]},'component.control.border-color':{colorSpace:'srgb',components:[0,0,0]},
    'component.button.border-color':{colorSpace:'srgb',components:[0,1,0]},
    'component.surface.radius':{value:12,unit:'px'},'component.surface.padding':{value:32,unit:'px'},
    'component.surface.background':{colorSpace:'srgb',components:[0,0,0]},'component.surface.color':{colorSpace:'srgb',components:[1,1,1]},
    'component.surface.border-color':{colorSpace:'srgb',components:[1,0,0]},
  }});
  await page.addStyleTag({content:emitThemeCSS(parent,{selector:'#parent'})+emitThemeCSS(resolveTheme(),{selector:'#child'})});
  await page.evaluate(async()=>{
    const region=document.createElement('section'); region.id='parent';
    region.innerHTML='<en-text-field label="Pinned field"></en-text-field><en-button>Pinned button</en-button><en-card>Pinned card</en-card><section id="child"><en-text-field label="Fresh field" size="small"></en-text-field><en-button size="small">Fresh button</en-button></section>';
    document.querySelector('main')!.append(region);
    await Promise.all([...region.querySelectorAll('en-text-field,en-button,en-card')].map(e=>(e as any).updateComplete));
  });
  const control=page.locator('#parent > en-text-field input');
  await expect(control).toHaveCSS('border-radius','24px');await expect(control).toHaveCSS('padding-left','28px');
  await expect(control).toHaveCSS('background-color','rgb(255, 0, 0)');await expect(control).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(control).toHaveCSS('border-top-color','rgb(0, 0, 0)');expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(56);
  await expect(page.locator('#parent > en-button button')).toHaveCSS('border-top-color','rgb(0, 255, 0)');
  const card=page.locator('#parent > en-card [part="base"]');
  await expect(card).toHaveCSS('border-radius','12px');await expect(card).toHaveCSS('padding-left','32px');
  await expect(card).toHaveCSS('background-color','rgb(0, 0, 0)');await expect(card).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(card).toHaveCSS('border-top-color','rgb(255, 0, 0)');
  await expect(page.locator('#child en-text-field input')).toHaveCSS('border-radius','7px');
  await expect(page.locator('#child en-button button')).toHaveCSS('border-radius','7px');
});

test('ordinary Theme Review supports new token Apply, Restore and candidate round-trip', async ({page}) => {
  await page.goto('/theme-review');
  await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
  await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('component.control.radius');
  await page.getByRole('combobox',{name:'Token',exact:true}).selectOption('component.control.radius');
  await expect(page.getByText('Authoring default (unpinned)',{exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Value source',exact:true}).selectOption('literal');
  const choices=page.getByRole('combobox',{name:'Managed value',exact:true});
  await choices.selectOption({label:'12px'});
  await page.getByRole('button',{name:'Apply pin',exact:true}).click();
  await expect(page.locator('.theme-editor-current')).toContainText('12px');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export candidate',exact:true}).click();
  const download=await pending;const bytes=await readFile((await download.path())!);
  await page.getByRole('button',{name:'Restore default rule',exact:true}).click();
  await expect(page.getByText('Authoring default (unpinned)',{exact:true})).toBeVisible();
  await page.getByLabel('Reopen candidate',{exact:true}).setInputFiles({name:'radius.json',mimeType:'application/json',buffer:bytes});
  await page.getByRole('searchbox',{name:'Find a token',exact:true}).fill('component.control.radius');
  await page.getByRole('combobox',{name:'Token',exact:true}).selectOption('component.control.radius');
  await expect(page.locator('.theme-editor-current')).toContainText('12px');
});

for (const width of [1440,390]) test(`authoring review is accessible and fits at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:1000});await page.goto('/theme-authoring.html?progress-report');
  await expect(page.locator('#managed-readout')).toContainText('Input 12px');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const scan=await new AxeBuilder({page}).analyze();expect(scan.violations).toEqual([]);
  await page.screenshot({path:info.outputPath(`authoring-${width}.png`),fullPage:true});
});
