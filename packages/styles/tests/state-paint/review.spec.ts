import { expect,test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
for(const width of [390,1440])test(`live state review at ${width}px`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:1000});
 await page.goto('/theme-states.html?progress-report');
 const before=page.locator('#before button'),after=page.locator('#after button');
 await expect(before).toBeVisible();await expect(after).toBeVisible();
 for(const appearance of ['light','dark']){
  await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(appearance);
  await page.mouse.move(0,0);
  const base=await before.evaluate(node=>getComputedStyle(node).backgroundColor);
  await expect(after).toHaveCSS('background-color',base);
  await before.hover();await expect(before).toHaveCSS('background-color',base);
  await after.hover();await expect(after).not.toHaveCSS('background-color',base);
  const hover=await after.evaluate(node=>getComputedStyle(node).backgroundColor);
  await page.mouse.down();await expect(after).not.toHaveCSS('background-color',hover);await page.mouse.up();
  await expect(page.getByRole('status')).toHaveText('Refined button activated.');
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
 }
 await page.getByRole('combobox',{name:'Variant',exact:true}).selectOption('ghost');await page.mouse.move(0,0);await expect(after).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await page.getByLabel('Disabled',{exact:true}).check();await expect(after).toBeDisabled();await expect(before).toBeDisabled();
 await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeVisible();
 const decision=page.getByRole('link',{name:'THEME-03 decision',exact:true});expect(await decision.getAttribute('href')).toContain('progress-report');expect(await decision.getAttribute('href')).toContain('#THEME-03');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByLabel('Disabled',{exact:true}).uncheck();await page.getByRole('combobox',{name:'Variant',exact:true}).selectOption('primary');await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('light');
 await page.screenshot({path:test.info().outputPath(`${info.project.name}-${width}.png`),fullPage:true});
 await page.goto('/theme-states.html');await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeHidden();
 expect(errors).toEqual([]);
});
