import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for(const width of [1440,390])test(`composition review remains usable at ${width}px`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width,height:1000});await page.goto('/theme-composition.html?progress-report');
 await expect(page.locator('#rich').getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await expect(page.locator('#toolbar').getByRole('toolbar')).toHaveCSS('gap','12px');
 await page.getByRole('slider',{name:'Toolbar gap',exact:true}).press('End');await expect(page.locator('#toolbar').getByRole('toolbar')).toHaveCSS('gap','24px');
 await page.getByRole('combobox',{name:'Size',exact:true}).selectOption('large');await expect(page.locator('#rich')).toHaveAttribute('size','large');
 await expect(page.locator('#surface en-table .en-table')).toHaveCSS('border-radius','20px');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeVisible();
 for(const mode of ['light','dark']){
  await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);
  const results=await new AxeBuilder({page}).analyze();expect(results.violations).toEqual([]);
  await page.screenshot({path:info.outputPath(`composition-${width}-${mode}.png`),fullPage:true});
 }
 expect(errors).toEqual([]);
 await page.goto('/theme-composition.html');await expect(page.getByRole('link',{name:'Progress Report',exact:true})).toBeHidden();
});
