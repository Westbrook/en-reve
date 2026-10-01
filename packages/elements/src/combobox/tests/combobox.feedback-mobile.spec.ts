import {expect,test} from '@playwright/test';
import {openMobile,control,field,trigger,choice,nativeFrames,formValue} from './mobile-helpers.js';

test('touch retry after persistent no-room feedback preserves editing and accepts on a later native tap',async({page,browser},info)=>{
  info.annotations.push({type:'browser-version',description:browser.version()});
  info.annotations.push({type:'scope',description:'Trusted touch in installed mobile engine profiles with an authored CSS height ceiling; no OS keyboard or physical-device result.'});
  await openMobile(page);await control(page).scrollIntoViewIfNeeded();await control(page).tap();
  await control(page).press('ControlOrMeta+A');await page.keyboard.insertText('study');await nativeFrames(page);
  await expect(control(page)).toHaveAttribute('aria-expanded','true');
  await field(page).evaluate(host=>(host as HTMLElement).style.setProperty('--en-option-list-max-block-size','20px'));
  const status=field(page).locator('[part="space-status"]');
  await expect(status).toHaveText('Suggestions cannot be shown in the available space.');
  await trigger(page).tap();await expect(control(page)).toHaveValue('study');await expect(control(page)).toBeFocused();
  expect(await formValue(page)).toEqual({asset:'forest'});
  await field(page).evaluate(host=>(host as HTMLElement).style.removeProperty('--en-option-list-max-block-size'));
  await expect(control(page)).toHaveAttribute('aria-expanded','true');await expect(status).toBeEmpty();
  await choice(page,'Sunset study').tap();await expect(control(page)).toHaveValue('Sunset study');
  expect(await formValue(page)).toEqual({asset:'sunset'});await expect(control(page)).toBeFocused();
  expect(await status.evaluate(region=>region.getBoundingClientRect().height)).toBe(0);
});
