import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{await page.goto('/recipes.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');});

test('field and description templates preserve the native editor through slot changes',async({page})=>{
  const host=page.locator('#custom'),input=host.getByRole('textbox',{name:'Review notes',exact:true});
  await expect(input).toHaveAccessibleDescription('Notes stay private until shared.');await input.fill('Draft remains');await input.evaluate(el=>{(window as any).retainedInput=el;(el as HTMLInputElement).setSelectionRange(2,6);});
  await host.evaluate(el=>{const span=document.createElement('span');span.slot='description';span.textContent='Application-authored help';el.append(span);});
  await expect(input).toHaveAccessibleDescription('Application-authored help');await expect(input).toBeFocused();await expect(input).toHaveValue('Draft remains');
  await host.evaluate(el=>el.querySelector('[slot=description]')!.remove());await expect(input).toHaveAccessibleDescription('Notes stay private until shared.');
  expect(await input.evaluate(el=>({same:el===(window as any).retainedInput,selection:[(el as HTMLInputElement).selectionStart,(el as HTMLInputElement).selectionEnd]}))).toEqual({same:true,selection:[2,6]});
});

test('disclosure model and pure template retain hidden content and native drafts',async({page})=>{
  const host=page.locator('#custom'),button=host.getByRole('button',{name:'Details',exact:true}),detail=host.getByRole('textbox',{name:'Detailed note',exact:true});
  await expect(button).toHaveAttribute('aria-expanded','false');await expect(detail).toBeHidden();await button.focus();await button.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');
  await detail.fill('Keep on closing');await detail.evaluate(el=>(window as any).retainedDetail=el);await button.focus();await button.press('Enter');await expect(detail).toBeHidden();await button.press('Enter');await expect(detail).toHaveValue('Keep on closing');
  expect(await detail.evaluate(el=>el===(window as any).retainedDetail)).toBe(true);await expect(button).toBeFocused();
});

test('selection updates and reset preserve unrelated native editing and remain instance-local',async({page})=>{
  const host=page.locator('#custom'),other=page.locator('#default'),notes=host.getByRole('textbox',{name:'Review notes',exact:true});await notes.fill('In progress');
  await host.getByRole('checkbox',{name:'Final document',exact:true}).check();await expect(host.getByLabel('Included documents')).toHaveText('draft, final');await expect(other.getByLabel('Included documents')).toHaveText('draft');await expect(notes).toHaveValue('In progress');
  await host.getByRole('checkbox',{name:'Draft document',exact:true}).uncheck();await expect(host.getByLabel('Included documents')).toHaveText('final');
  await host.getByRole('button',{name:'Reset documents',exact:true}).click();await expect(host.getByLabel('Included documents')).toHaveText('draft');await expect(notes).toHaveValue('In progress');
});

test('public Lit style families honor scoped overrides and readable narrow RTL layout',async({page})=>{
  const custom=page.locator('#custom'),ordinary=page.locator('#default');
  await expect(custom.getByRole('textbox',{name:'Review notes',exact:true})).toHaveCSS('background-color','rgb(230, 240, 250)');
  await expect(ordinary.getByRole('textbox',{name:'Review notes',exact:true})).not.toHaveCSS('background-color','rgb(230, 240, 250)');
  await expect(custom.getByRole('heading',{name:'Review options',exact:true})).toHaveCSS('font-family','monospace');
  await page.setViewportSize({width:320,height:800});await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(custom.getByRole('textbox',{name:'Review notes',exact:true})).toBeVisible();
});
