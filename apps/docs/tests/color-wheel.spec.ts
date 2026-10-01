import {test,expect,type Page,type Locator} from '@playwright/test';

const initial='color(display-p3 0.3 0.5 0.8 / 0.65)';
async function fixture(page:Page,value=initial) {
  await page.goto('/api-examples/color-picker.html');
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await page.evaluate(value=>{
    if (!customElements.get('en-color-wheel')) throw new Error('Wheel registration missing');
    const wheel=document.createElement('en-color-wheel') as any;
    wheel.id='wheel-test';wheel.value=value;document.body.prepend(wheel);
    (window as any).changes=[];(window as any).previews=[];
    wheel.addEventListener('en-change',(e:any)=>(window as any).changes.push(e.detail));
    wheel.addEventListener('en-input',(e:any)=>(window as any).previews.push(e.detail.value));
  },value);
  const wheel=page.locator('#wheel-test');await expect(wheel.getByRole('slider')).toBeVisible();return wheel;
}
async function point(wheel:Locator,degrees:number) {
  const b=(await wheel.getByRole('slider').boundingBox())!;
  const a=degrees*Math.PI/180,r=b.width/2-16;
  return {x:b.x+b.width/2+Math.sin(a)*r,y:b.y+b.height/2-Math.cos(a)*r};
}
async function clickHue(page:Page,wheel:Locator,hue:number) {const p=await point(wheel,hue);await page.mouse.click(p.x,p.y);}

test('standalone keyboard and exact field preserve saturation, brightness, P3 and alpha',async({page})=>{
  const wheel=await fixture(page);const ring=wheel.getByRole('slider',{name:'Hue',exact:true});
  await ring.focus();await ring.press('Home');
  await expect(ring).toHaveAttribute('aria-valuenow','0');
  let color=await wheel.evaluate((el:any)=>el.colorValue);expect(color.space).toBe('display-p3');expect(color.alpha).toBe(.65);[.8,.3,.3].forEach((v,i)=>expect(color.channels[i]).toBeCloseTo(v,10));
  await ring.press('PageUp');await ring.press('ArrowRight');await expect(ring).toHaveAttribute('aria-valuenow','11');
  await ring.press('End');await ring.press('ArrowRight');await expect(ring).toHaveAttribute('aria-valuenow','360');
  const field=wheel.getByRole('textbox',{name:'Hue',exact:true});await field.fill('120');await field.press('Enter');
  color=await wheel.evaluate((el:any)=>el.colorValue);expect(color.space).toBe('display-p3');expect(color.alpha).toBe(.65);[.3,.8,.3].forEach((v,i)=>expect(color.channels[i]).toBeCloseTo(v,10));
  await field.fill('361');await field.press('Enter');expect(await wheel.evaluate((el:any)=>el.checkValidity())).toBe(false);
  await field.press('Escape');await expect(field).toHaveValue('120');expect(await wheel.evaluate((el:any)=>el.checkValidity())).toBe(true);
  await field.fill('240.5');await field.press('Tab');await expect(ring).toHaveAttribute('aria-valuenow','240.5');
  const snapshot=await wheel.ariaSnapshot();expect(snapshot).toContain('slider "Hue"');expect(snapshot).toContain('textbox "Hue"');
});

test('a drag previews then commits once; Escape and capture cancellation roll back',async({page})=>{
  const wheel=await fixture(page);const a=await point(wheel,60),b=await point(wheel,180);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});
  await expect(wheel).toHaveJSProperty('value',initial);
  expect(await page.evaluate(()=>(window as any).changes.length)).toBe(0);
  expect(await page.evaluate(()=>(window as any).previews.length)).toBeGreaterThan(1);
  await page.mouse.up();expect(await page.evaluate(()=>(window as any).changes.length)).toBe(1);
  const accepted=await wheel.evaluate((el:any)=>el.value);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.keyboard.press('Escape');await page.mouse.up();await expect(wheel).toHaveJSProperty('value',accepted);
  const ring=wheel.getByRole('slider');await ring.evaluate(el=>el.addEventListener('pointerdown',e=>(window as any).pointer=(e as PointerEvent).pointerId,{once:true}));
  await page.mouse.down();await ring.dispatchEvent('pointercancel',{pointerId:await page.evaluate(()=>(window as any).pointer)});await page.mouse.up();
  await expect(wheel).toHaveJSProperty('value',accepted);expect(await page.evaluate(()=>(window as any).changes.length)).toBe(1);
  expect(await page.evaluate(()=>(window as any).previews.at(-1))).toBe(accepted);
});

test('veto, listener author writes and same-value writes during a gesture win',async({page})=>{
  const wheel=await fixture(page);
  await wheel.evaluate(el=>el.addEventListener('en-change',e=>e.preventDefault(),{once:true}));await clickHue(page,wheel,120);await expect(wheel).toHaveJSProperty('value',initial);
  await wheel.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{el.value='#0000ff80';e.preventDefault();},{once:true}));await clickHue(page,wheel,60);await expect(wheel).toHaveJSProperty('value','#0000ff80');
  const p=await point(wheel,180);await page.mouse.move(p.x,p.y);await page.mouse.down();await wheel.evaluate((el:any)=>{el.value=el.value;});await page.mouse.up();await expect(wheel).toHaveJSProperty('value','#0000ff80');
  await expect(wheel.getByRole('slider')).toHaveAttribute('aria-valuenow','240');
});

test('center clicks do nothing, seam stays continuous, disabling and disconnect cancel',async({page})=>{
  const wheel=await fixture(page,'#ff0000');const ring=wheel.getByRole('slider');await ring.click();await expect(wheel).toHaveJSProperty('value','#ff0000');
  await clickHue(page,wheel,359);expect(Number(await ring.getAttribute('aria-valuenow'))).toBeGreaterThan(358);
  await clickHue(page,wheel,1);expect(Number(await ring.getAttribute('aria-valuenow'))).toBeLessThan(2);
  const accepted=await wheel.evaluate((el:any)=>el.value),p=await point(wheel,120);
  await page.mouse.move(p.x,p.y);await page.mouse.down();await wheel.evaluate((el:any)=>el.disabled=true);await page.mouse.up();await expect(wheel).toHaveJSProperty('value',accepted);await expect(ring).toHaveAttribute('aria-disabled','true');await expect(wheel.getByRole('textbox')).toBeDisabled();
  await wheel.evaluate((el:any)=>el.disabled=false);await page.mouse.down();await wheel.evaluate(el=>{(window as any).removedWheel=el;el.remove();});await page.mouse.up();
  await page.evaluate(()=>document.body.prepend((window as any).removedWheel));await expect(wheel).toHaveJSProperty('value',accepted);
});

test('invalid authored values and achromatic hue memory preserve accepted data',async({page})=>{
  const wheel=await fixture(page,'#0000ff');await wheel.evaluate((el:any)=>el.value='#808080');
  const ring=wheel.getByRole('slider');await expect(ring).toHaveAttribute('aria-valuenow','240');await ring.focus();await ring.press('PageUp');
  await expect(wheel).toHaveJSProperty('value','#808080');await expect(ring).toHaveAttribute('aria-valuenow','250');expect(await page.evaluate(()=>(window as any).changes.length)).toBe(0);
  await wheel.evaluate((el:any)=>el.value='not-a-color');expect(await wheel.evaluate((el:any)=>el.checkValidity())).toBe(false);await expect(wheel).toHaveJSProperty('value','#808080');
  await ring.press('Home');expect(await wheel.evaluate((el:any)=>el.checkValidity())).toBe(true);
  const frozen=await wheel.evaluate((el:any)=>Object.isFrozen(el.colorValue)&&Object.isFrozen(el.colorValue.channels));expect(frozen).toBe(true);
});

test('narrow RTL and forced colors retain focus and exact hue editing; P3 fallback retains data',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{const original=CSS.supports.bind(CSS);CSS.supports=((...args:string[])=>args.some(arg=>arg.includes('display-p3'))?false:(original as any)(...args)) as typeof CSS.supports;});
  const wheel=await fixture(page);await wheel.evaluate(el=>el.dir='rtl');await clickHue(page,wheel,90);
  const hue=Number(await wheel.getByRole('slider').getAttribute('aria-valuenow'));expect(Math.abs(hue-90)).toBeLessThan(1);expect(await wheel.locator('[part=ring]').getAttribute('style')).not.toContain('display-p3');
  expect(await wheel.evaluate((el:any)=>el.colorValue.space)).toBe('display-p3');
  await page.emulateMedia({forcedColors:'active'});await wheel.getByRole('slider').focus();await wheel.getByRole('slider').press('ArrowUp');await expect(wheel.getByRole('slider')).toHaveAttribute('aria-valuenow',String(hue+1));
  expect(await wheel.getByRole('slider').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  expect((await wheel.getByRole('slider').boundingBox())!.width).toBeLessThan(390);
});

test('composition synchronizes accepted changes in both directions without feeding previews back',async({page})=>{
  await page.goto('/api-examples/color-picker.html');await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  const demo=page.locator('en-color-wheel-demo'),wheel=demo.locator('#standalone-wheel'),plane=demo.locator('#composed-plane');await wheel.scrollIntoViewIfNeeded();
  const ring=wheel.getByRole('slider');await ring.focus();await ring.press('Home');
  await expect(ring).toHaveAttribute('aria-valuenow','0');
  await expect.poll(()=>plane.evaluate((el:any)=>el.value)).toBe(await wheel.evaluate((el:any)=>el.value));
  const sat=plane.getByRole('slider',{name:'Saturation',exact:true});await sat.focus();await sat.press('ArrowLeft');
  await expect.poll(()=>wheel.evaluate((el:any)=>el.value)).toBe(await plane.evaluate((el:any)=>el.value));
  const accepted=await wheel.evaluate((el:any)=>el.value);await demo.getByRole('checkbox',{name:'Reject next change'}).check();await ring.focus();await ring.press('PageUp');await expect(wheel).toHaveJSProperty('value',accepted);await expect(plane).toHaveJSProperty('value',accepted);
  await expect(demo.locator('[data-wheel-value]')).toHaveText(accepted);
});

test('touch tap selects hue and the exact editor remains available',async({browser,baseURL})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});const page=await context.newPage();
  await page.goto(new URL('/api-examples/color-wheel.html',baseURL).href);
  const wheel=page.locator('en-color-wheel').first();await expect(wheel.getByRole('slider')).toBeVisible();await wheel.scrollIntoViewIfNeeded();const p=await point(wheel,120);await page.touchscreen.tap(p.x,p.y);
  expect(Math.abs(Number(await wheel.getByRole('slider').getAttribute('aria-valuenow'))-120)).toBeLessThan(1);await expect(wheel.getByRole('textbox')).toBeVisible();await context.close();
});
