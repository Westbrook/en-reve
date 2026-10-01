import {test,expect,type Page} from '@playwright/test';
const initial='color(display-p3 1 0.2 0.1 / 0.65)';
async function fixture(page:Page,value=initial){
  await page.goto('/api-examples/color-picker.html');
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await page.evaluate(value=>{const picker=document.createElement('en-color-picker') as any;picker.id='plane-fixture';picker.value=value;picker.format='rgb';picker.plane=true;picker.alpha=true;document.body.append(picker);},value);
  const picker=page.locator('#plane-fixture');await expect(picker.getByRole('slider',{name:'Saturation',exact:true})).toBeVisible();await picker.scrollIntoViewIfNeeded();return picker;
}
test('HSV exact fields and keyboard sliders preserve P3 space and alpha with remembered achromatic hue',async({page})=>{
  const picker=await fixture(page,'color(display-p3 0 0 1 / .65)');
  await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toHaveValue('240');
  const saturation=picker.getByRole('slider',{name:'Saturation',exact:true});await saturation.focus();await saturation.press('Home');
  await expect(picker).toHaveJSProperty('value','color(display-p3 1 1 1 / 0.65)');await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toHaveValue('240');
  await saturation.press('End');await expect(picker).toHaveJSProperty('value','color(display-p3 0 0 1 / 0.65)');
  const brightness=picker.getByRole('textbox',{name:'Value Exact value',exact:true});await brightness.fill('50');await brightness.press('Enter');
  await expect(picker).toHaveJSProperty('value','color(display-p3 0 0 0.5 / 0.65)');
  await brightness.fill('101');await brightness.press('Enter');expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(false);
  await brightness.fill('100');await brightness.press('Enter');expect(await picker.evaluate((el:any)=>el.checkValidity())).toBe(true);
  const hue=picker.getByRole('slider',{name:'Hue',exact:true});await hue.focus();await hue.press('Home');await expect(picker).toHaveJSProperty('value','color(display-p3 1 0 0 / 0.65)');
});
test('pointer gesture previews continuously but commits once, Escape and pointer cancel restore the origin',async({page})=>{
  const picker=await fixture(page);const plane=picker.locator('[part=plane]');await plane.scrollIntoViewIfNeeded();
  await picker.evaluate((el:any)=>{(window as any).planeEvents=[];el.addEventListener('en-change',(event:any)=>(window as any).planeEvents.push(event.detail));});
  const box=(await plane.boundingBox())!;await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.2,{steps:4});
  await expect(picker).toHaveJSProperty('value',initial);expect(await page.evaluate(()=>(window as any).planeEvents.length)).toBe(0);
  await page.mouse.up();expect(await page.evaluate(()=>(window as any).planeEvents.length)).toBe(1);const accepted=await picker.evaluate((el:any)=>el.value);
  await page.mouse.move(box.x+box.width*.2,box.y+box.height*.8);await page.mouse.down();await page.keyboard.press('Escape');await page.mouse.up();await expect(picker).toHaveJSProperty('value',accepted);
  await plane.evaluate(el=>el.addEventListener('pointerdown',(event)=>{(window as any).activePlanePointer=(event as PointerEvent).pointerId;},{once:true}));await page.mouse.down();await plane.dispatchEvent('pointercancel',{pointerId:await page.evaluate(()=>(window as any).activePlanePointer)});await page.mouse.up();await expect(picker).toHaveJSProperty('value',accepted);expect(await page.evaluate(()=>(window as any).planeEvents.length)).toBe(1);
});
test('veto and same-value author writes supersede gestures without stale rollback',async({page})=>{
  const picker=await fixture(page);const plane=picker.locator('[part=plane]');await plane.scrollIntoViewIfNeeded();
  await picker.evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));await plane.click({position:{x:30,y:30}});await expect(picker).toHaveJSProperty('value',initial);
  await picker.evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>{el.value='#00ff00';event.preventDefault();},{once:true}));await plane.click({position:{x:50,y:60}});await expect(picker).toHaveJSProperty('value','#00ff00');
  const box=(await plane.boundingBox())!;await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await picker.evaluate((el:any)=>el.value=el.value);await page.mouse.move(box.x+80,box.y+80);await page.mouse.up();await expect(picker).toHaveJSProperty('value','#00ff00');
});
test('RTL plane maps increasing saturation toward inline end; narrow forced colors retain native equivalents',async({page})=>{
  await page.setViewportSize({width:390,height:844});const picker=await fixture(page,'#ff0000');await picker.evaluate(el=>el.dir='rtl');
  const plane=picker.locator('[part=plane]');await plane.scrollIntoViewIfNeeded();const box=(await plane.boundingBox())!;expect(box.width).toBeLessThan(390);
  await plane.click({position:{x:box.width*.75,y:box.height*.5}});const saturation=Number(await picker.getByRole('slider',{name:'Saturation',exact:true}).inputValue());expect(saturation).toBeGreaterThan(24);expect(saturation).toBeLessThan(26);
  await page.emulateMedia({forcedColors:'active'});const value=picker.getByRole('slider',{name:'Value',exact:true});await value.focus();await value.press('End');expect(await value.inputValue()).toBe('100');
  await expect(picker.getByRole('slider')).toHaveCount(4);await expect(picker.getByRole('textbox')).toHaveCount(4);
  expect(await picker.getByRole('group').first().ariaSnapshot()).toContain('slider "Saturation"');
});
test('P3 paint fallback and disabling midway keep the accepted value stable',async({page})=>{
  await page.addInitScript(()=>{const original=CSS.supports.bind(CSS);CSS.supports=((...args:string[])=>args.some(arg=>arg.includes('display-p3'))?false:(original as any)(...args)) as typeof CSS.supports;});
  const picker=await fixture(page);const plane=picker.locator('[part=plane]');await plane.scrollIntoViewIfNeeded();expect(await plane.getAttribute('style')).not.toContain('display-p3');
  const box=(await plane.boundingBox())!;await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await picker.evaluate((el:any)=>el.disabled=true);await page.mouse.up();await expect(picker).toHaveJSProperty('value',initial);await expect(picker.getByRole('slider').first()).toBeDisabled();
});
