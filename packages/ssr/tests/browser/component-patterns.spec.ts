import {test,expect} from '@playwright/test';
test('new patterns hydrate without replacing controls or discarding native edits',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/patterns-fixture');
 const alpha=page.getByRole('checkbox',{name:'Alpha',exact:true}).first(),beta=page.getByRole('checkbox',{name:'Beta',exact:true});await expect(alpha).toBeChecked();await beta.check();await beta.evaluate(el=>(window as any).originalChoice=el);
 await expect(alpha).toHaveAccessibleDescription('First team');await page.locator('#rich-alpha').evaluate(el=>(window as any).originalRichLabel=el);await expect(page.locator('#rich-alpha')).toBeVisible();
 const query=page.getByRole('combobox',{name:'People'});await query.fill('Be');const lower=page.getByRole('spinbutton',{name:'Minimum',exact:true});await lower.fill('30');
 await page.evaluate(()=>(window as any).hydratePatterns());await expect(page.locator('html')).toHaveAttribute('data-patterns-hydrated','true');await expect(beta).toBeChecked();await expect(query).toHaveValue('Be');await expect(lower).toHaveValue('30');expect(await beta.evaluate(el=>el===(window as any).originalChoice)).toBe(true);
 expect(await page.locator('#rich-alpha').evaluate(el=>el===(window as any).originalRichLabel)).toBe(true);await expect(alpha).toHaveAccessibleDescription('First team');
 expect(await page.locator('form').evaluate(form=>[...new FormData(form as HTMLFormElement)])).toEqual([['teams','a'],['teams','b'],['people','a'],['price','30'],['price','80']]);
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(beta).not.toBeChecked();await expect(lower).toHaveValue('20');await page.locator('#rich-alpha').click();await expect(alpha).not.toBeChecked();expect(errors).toEqual([]);
});
