import {test,expect,type Page} from '@playwright/test';
const css='color(display-p3 1 0.125 0 / 0.5)';
async function fixture(page:Page,value=css) {
  await page.goto('/api-examples/color-picker.html');
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await page.evaluate(value=>{
    const picker=document.createElement('en-color-picker') as any;
    picker.id='space-fixture';picker.value=value;picker.format='rgb';picker.alpha=true;
    document.body.append(picker);
  },value);
  return page.locator('#space-fixture');
}
test('P3 normalized channels retain space and alpha across format changes and hide/show',async({page})=>{
  const picker=await fixture(page);
  await expect(picker.getByRole('slider',{name:'Display-P3 Red',exact:true})).toHaveAttribute('max','1');
  for(const format of ['hex','hsl','rgb','hex']) {
    await picker.getByRole('combobox',{name:'Color format'}).selectOption(format);
    await expect(picker).toHaveJSProperty('value',css);
  }
  await expect(picker.getByRole('textbox',{name:'Hex color (sRGB approximation)',exact:true})).toHaveAttribute('readonly','');
  await picker.getByRole('switch',{name:'Alpha',exact:true}).click();await expect(picker).toHaveJSProperty('value',css);
  await picker.getByRole('combobox',{name:'Color format'}).selectOption('rgb');
  const green=picker.getByRole('textbox',{name:/Display-P3 Green/});await green.fill('.4');await green.press('Enter');
  await expect(picker).toHaveJSProperty('value','color(display-p3 1 0.4 0 / 0.5)');
  const red=picker.getByRole('slider',{name:'Display-P3 Red',exact:true});await red.focus();await red.press('Home');
  await expect(picker).toHaveJSProperty('value','color(display-p3 0 0.4 0 / 0.5)');
});
test('explicit conversion is one cancelable transaction and typed author writes win rollback',async({page})=>{
  const picker=await fixture(page);await picker.getByRole('combobox',{name:'Color format'}).selectOption('hsl');
  await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toBeDisabled();
  await picker.evaluate((el:any)=>{(window as any).proposals=[];el.addEventListener('en-change',(event:any)=>{(window as any).proposals.push(event.detail);event.preventDefault();},{once:true});});
  await picker.getByRole('button',{name:'Convert to sRGB approximation'}).click();await expect(picker).toHaveJSProperty('value',css);
  const proposals=await page.evaluate(()=>(window as any).proposals);expect(proposals).toHaveLength(1);expect(proposals[0].reason).toBe('color-space');
  await picker.evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>{el.colorValue={space:'display-p3',channels:[.3,.2,.1],alpha:.7};event.preventDefault();},{once:true}));
  await picker.getByRole('button',{name:'Convert to sRGB approximation'}).click();
  await expect(picker).toHaveJSProperty('value','color(display-p3 0.3 0.2 0.1 / 0.7)');
  await picker.getByRole('button',{name:'Convert to sRGB approximation'}).click();
  expect(await picker.evaluate((el:any)=>el.colorValue.space)).toBe('srgb');
  await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toBeEnabled();
});
test('invalid author and numeric drafts retain accepted color and can be corrected',async({page})=>{
  const picker=await fixture(page);
  await picker.evaluate((el:any)=>el.value='color(display-p3 2 0 0)');await expect(picker).toHaveJSProperty('value',css);
  expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(false);
  await picker.evaluate((el:any)=>el.value='color(display-p3 .2 .3 .4)');
  const red=picker.getByRole('textbox',{name:/Display-P3 Red/});await red.fill('2');await red.press('Enter');
  await expect(picker).toHaveJSProperty('value','color(display-p3 0.2 0.3 0.4)');expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(false);
  await red.fill('.5');await red.press('Enter');await expect(picker).toHaveJSProperty('value','color(display-p3 0.5 0.3 0.4)');
  expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(true);
});
test('fractional sRGB does not drift on focus, format changes or alpha edits',async({page})=>{
  const value='color(srgb 0.123456789 0.2 0.7 / 0.3456789)',picker=await fixture(page,value);
  for(const format of ['hex','rgb','hsl','hex'])await picker.getByRole('combobox',{name:'Color format'}).selectOption(format);
  const hex=picker.getByRole('textbox',{name:'Hex color',exact:true});await hex.focus();await hex.press('Tab');
  await expect(picker).toHaveJSProperty('value',value);expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(true);
  const alpha=picker.getByRole('slider',{name:'Alpha',exact:true});await alpha.focus();await alpha.press('End');
  await expect(picker).toHaveJSProperty('value','color(srgb 0.123456789 0.2 0.7)');
});
test('fallback paint preserves P3 storage and alpha checkerboards in narrow RTL and forced colors',async({page})=>{
  await page.addInitScript(()=>{
    const original=CSS.supports.bind(CSS);
    CSS.supports=((...args:string[])=>args.some(arg=>arg.includes('display-p3'))?false:(original as any)(...args)) as typeof CSS.supports;
  });
  await page.setViewportSize({width:390,height:844});
  const picker=await fixture(page);await picker.evaluate(el=>el.dir='rtl');
  await expect(picker.locator('[part=gamut-message]')).toContainText('Showing an sRGB fallback');
  const preview=await picker.locator('[part=preview]').getAttribute('style');expect(preview).toContain('rgba(');expect(preview).not.toContain('display-p3');
  const gradients=await picker.locator('en-color-slider').evaluateAll(els=>els.map(el=>el.shadowRoot!.querySelector('[part=gradient]')!.getAttribute('style')));
  expect(gradients.every(value=>value && !value.includes('display-p3'))).toBe(true);
  await expect(picker.locator('en-color-slider[checkerboard]')).toHaveCount(4);
  const box=await picker.boundingBox();expect(box!.width).toBeLessThanOrEqual(390);
  await page.emulateMedia({forcedColors:'active'});
  const green=picker.getByRole('slider',{name:'Display-P3 Green',exact:true});await green.focus();await green.press('Home');
  await expect(picker).toHaveJSProperty('value','color(display-p3 1 0 0 / 0.5)');
});
test('supported paint retains Display-P3 gradient declarations without altering values',async({page})=>{
  const picker=await fixture(page);
  const supported=await page.evaluate(()=>CSS.supports('color','color(display-p3 1 0 0)'));
  if(supported){
    await expect(picker.locator('[part=preview]')).toHaveAttribute('style',/background-color:.*;background-color:color\(display-p3/);
    const styles=await picker.locator('en-color-slider').first().evaluate(el=>el.shadowRoot!.querySelector('[part=gradient]')!.getAttribute('style'));
    expect(styles).toContain('color(display-p3');
  }
  await expect(picker).toHaveJSProperty('value',css);
});
test('initial P3 fallback and plane controls survive SSR and hydration without changing storage',async({browser,page})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  try {
    const noJS=await context.newPage();await noJS.goto('/api-examples/color-picker.html');
    const picker=noJS.locator('#wide-picker');
    await expect(picker.locator('[part=space]')).toContainText('Display-P3');
    await expect(picker.getByRole('slider',{name:'Saturation',exact:true})).toHaveValue('90');
    await expect(picker.locator('[part=gamut-message]')).toContainText('Showing an sRGB fallback');
    expect(await picker.locator('[part=preview]').getAttribute('style')).not.toContain('display-p3');
  } finally {await context.close();}
  await page.goto('/api-examples/color-picker.html');await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await expect(page.locator('#wide-picker')).toHaveJSProperty('value','color(display-p3 1 0.2 0.1 / 0.65)');
  await expect(page.locator('#wide-picker').getByRole('slider',{name:'Saturation',exact:true})).toHaveValue('90');
  if(await page.evaluate(()=>CSS.supports('color','color(display-p3 1 0 0)'))){
    await expect(page.locator('#wide-picker [part=gamut-message]')).toContainText('Display-P3 paint is supported');
    await expect(page.locator('#wide-picker [part=preview]')).toHaveAttribute('style',/background-color:color\(display-p3/);
    await expect.poll(()=>page.locator('#wide-picker en-color-slider').first().evaluate(el=>el.shadowRoot!.querySelector('[part=gradient]')!.getAttribute('style'))).toContain('color(display-p3');
  }
});
