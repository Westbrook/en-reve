import { test, expect, type Locator, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

const open = async (page: Page) => {
  await page.goto('/composite-accessibility-fixture');
  await page.evaluate(() => (window as any).hydrateComposites());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
};
const references = (control: Locator) => control.evaluate(element => element.ariaDescribedByElements?.map(reference => ({id:reference.id, root:(reference.getRootNode() as ShadowRoot).host?.id})) ?? []);
const colorRefs = [{id:'description',root:'color'},{id:'description',root:'exact-field'}];

// Element-reference reflection is tested directly; Playwright's synthesized
// description does not follow cross-root references. This is not spoken AT QA.
test('initial DSD preserves local associations and exposes the cross-root SSR limit', async ({ browser }, info) => {
  info.annotations.push({type:'browser-version',description:browser.version()});
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  await page.goto('/composite-accessibility-fixture');
  await expect(page.locator('#color input[type=range]')).toHaveAccessibleDescription('Shared color guidance.');
  await expect(page.locator('#color en-text-field input')).toHaveAccessibleDescription('');
  for (const control of await page.locator('#range .thumb, #range input').all()) {
    await expect(control).toHaveAccessibleDescription('Shared range guidance. Review the interval.');
    await expect(control).toHaveAttribute('aria-invalid','true');
  }
  await expect(page.locator('#single input[type=date]')).toHaveAccessibleDescription(/Single date guidance\. Review the date\. Edit Gregorian date/);
  expect(await references(page.locator('#dates #picker-trigger button'))).toEqual([]);
  await expect(page.locator('#dates #picker-trigger button')).toHaveAttribute('aria-invalid','true');
  // Endpoint DOM is slotted into the dialog but remains in the picker's root.
  for (const control of await page.locator('#dates .range-fields input').all()) {
    expect(await references(control)).toEqual([{id:'range-edit-hint',root:'dates'}]);
  }
  await context.close();
});

test('color exact input references the real shared slot through all content transitions', async ({page,browserName}) => {
  await open(page);
  const host=page.locator('#color'), exact=host.locator('en-text-field input'), range=host.locator('input[type=range]');
  await expect.poll(()=>references(exact)).toEqual(colorRefs);
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : undefined;
  const nativeDescription = async () => {
    const tree = await cdp!.send('Accessibility.getFullAXTree');
    return tree.nodes.find(node => node.role?.value === 'textbox' && node.name?.value === 'Opacity Exact value')?.description?.value ?? '';
  };
  if(cdp) await expect.poll(nativeDescription).toBe('Shared color guidance.');
  await exact.focus();
  await host.evaluate(el=>{(window as any).helpEvents=[];for(const name of ['en-input','en-change'])el.addEventListener(name,e=>(window as any).helpEvents.push(e.type));});
  await exact.evaluate(el => (window as any).savedExact=el);
  for (const [action, expected] of [['text','Changed guidance.'],['hidden',''],['restore','Changed guidance.'],['empty',''],['refill','Restored slot.'],['remove','Latest fallback.']] as const) {
    await host.evaluate((element,action)=>{
      (element as any).description='Latest fallback.';
      const slot=element.querySelector<HTMLElement>('[slot=description]')!;
      if(action==='text')slot.textContent='Changed guidance.';
      if(action==='hidden')slot.hidden=true;
      if(action==='restore')slot.hidden=false;
      if(action==='empty')slot.textContent='';
      if(action==='refill')slot.textContent='Restored slot.';
      if(action==='remove')slot.remove();
    },action);
    await expect(range).toHaveAccessibleDescription(expected);
    if(cdp) await expect.poll(nativeDescription).toBe(expected);
    await expect.poll(()=>references(exact)).toEqual(colorRefs);
    await expect(exact).toBeFocused();
    expect(await exact.evaluate(el=>el===(window as any).savedExact)).toBe(true);
  }
  expect(await page.evaluate(()=>(window as any).helpEvents)).toEqual([]);
  expect(await host.evaluate(el=>(el as any).value)).toBe(40);
  await host.evaluate(el=>{(el as any).description='';});
  await expect(range).toHaveAccessibleDescription('');
  await host.evaluate(el=>el.setAttribute('description','Restored string.'));
  await expect(range).toHaveAccessibleDescription('Restored string.');
  await host.evaluate(el=>{const span=document.createElement('span');span.slot='description';span.textContent='Reassigned.';el.append(span);});
  await expect(range).toHaveAccessibleDescription('Reassigned.');
  if(cdp) await expect.poll(nativeDescription).toBe('Reassigned.');
  await cdp?.detach();
  await host.evaluate(el=>{const parent=el.parentElement!;el.remove();parent.prepend(el);});
  await expect.poll(()=>references(exact)).toEqual(colorRefs);
  await host.evaluate(el=>{(el as any).editable=false;});
  await expect(exact).toHaveCount(0);
  await host.evaluate(el=>{(el as any).editable=true;});
  await expect.poll(()=>references(exact)).toEqual(colorRefs);
});

test('color rejected drafts and synthetic composition survive guidance and error updates',async({page})=>{
  await open(page);
  const host=page.locator('#color'), exact=host.locator('en-text-field input');
  await exact.fill('wrong');
  await exact.press('Enter');
  await expect(exact).toHaveValue('wrong');
  await expect.poll(()=>references(exact)).toEqual([...colorRefs,{id:'error',root:'exact-field'}]);
  await host.evaluate(el=>{(el as any).description='Changed while invalid';el.querySelector('[slot=description]')!.remove();});
  await expect(exact).toHaveValue('wrong');
  expect(await host.evaluate(el=>(el as any).value)).toBe(40);
  await exact.press('Escape');
  await expect(exact).toHaveValue('40');
  await expect.poll(()=>references(exact)).toEqual(colorRefs);
  await exact.dispatchEvent('compositionstart');
  await exact.evaluate(el=>{(el as HTMLInputElement).value='55';el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,isComposing:true,data:'5'}));});
  await host.evaluate(el=>{(el as any).description='During composition';});
  await exact.press('Enter');
  expect(await host.evaluate(el=>(el as any).value)).toBe(40);
  await expect(exact).toHaveValue('55');
  await expect(exact).toBeFocused();
  await exact.dispatchEvent('compositionend',{data:'55'});
  await exact.press('Enter');
  await expect.poll(()=>host.evaluate(el=>(el as any).value)).toBe(55);
  expect(await page.locator('form').evaluate(el=>new FormData(el as HTMLFormElement).get('opacity'))).toBe('55');
});

test('range error appears and clears on all four controls without replacing drafts',async({page})=>{
  await open(page);
  const host=page.locator('#range'), controls=host.locator('.thumb,input'), input=host.locator('input').first();
  expect(await host.evaluate(el=>(el as any).checkValidity())).toBe(false);
  await input.fill('35');
  await input.evaluate(el=>(window as any).savedRange=el);
  await host.evaluate(el=>{(el as any).error='';(el as any).description='New range fallback';});
  for(const control of await controls.all()) {
    await expect(control).toHaveAccessibleDescription('Shared range guidance.');
    await expect(control).not.toHaveAttribute('aria-invalid','true');
  }
  expect(await host.evaluate(el=>(el as any).checkValidity())).toBe(true);
  await expect(input).toHaveValue('35');
  await expect(input).toBeFocused();
  expect(await input.evaluate(el=>el===(window as any).savedRange)).toBe(true);
  await host.evaluate(el=>{(el as any).error='Changed error';el.querySelector('[slot=description]')!.remove();});
  for(const control of await controls.all())await expect(control).toHaveAccessibleDescription('New range fallback Changed error');
  await input.press('Tab');
  expect(await host.evaluate(el=>(el as any).value)).toEqual([35,80]);
  await host.evaluate(el=>{(el as any).error='';});
  await host.locator('.thumb').first().press('ArrowRight');
  expect(await host.evaluate(el=>(el as any).value)).toEqual([36,80]);
  expect(await page.locator('form').evaluate(el=>new FormData(el as HTMLFormElement).getAll('budget'))).toEqual(['36','80']);
});

test('date single input and range trigger keep distinct guidance and current errors',async({page})=>{
  await open(page);
  const single=page.locator('#single'), input=single.locator('input[type=date]'), host=page.locator('#dates'), trigger=host.locator('#picker-trigger button');
  await expect(input).toHaveAccessibleDescription(/Single date guidance\. Review the date\. Edit Gregorian date/);
  await expect.poll(()=>references(single.locator('#picker-trigger button'))).toEqual([]);
  await expect.poll(()=>references(trigger)).toEqual([{id:'description',root:'dates'},{id:'error',root:'dates'}]);
  await expect(trigger).toHaveAttribute('aria-invalid','true');
  await host.evaluate(el=>{(el as any).error='';});
  await expect.poll(()=>references(trigger)).toEqual([{id:'description',root:'dates'}]);
  await expect(trigger).not.toHaveAttribute('aria-invalid','true');
  await host.evaluate(el=>{(el as any).error='Restored error';});
  await expect.poll(()=>references(trigger)).toEqual([{id:'description',root:'dates'},{id:'error',root:'dates'}]);
  await single.evaluate(el=>{(el as any).error='';});
  await expect(input).toHaveAccessibleDescription(/Single date guidance\. Edit Gregorian date/);
  await input.fill('2026-09-12');
  await input.press('Tab');
  expect(await single.evaluate(el=>(el as any).value)).toBe('2026-09-12');
});

test('date range endpoints retain instructions and draft errors without repeating outer field help',async({page})=>{
  await open(page);
  const host=page.locator('#dates');
  await host.locator('#picker-trigger button').focus();
  await host.evaluate(async el=>{(el as any).error='';await (el as any).showPicker();});
  const endpoints=host.locator('.range-fields input');
  for(const input of await endpoints.all())await expect(input).toHaveAccessibleDescription(/^Edit Gregorian date/);
  await endpoints.first().fill('2026-09-11');
  await endpoints.first().press('Tab');
  await host.evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
  await host.getByRole('button',{name:'Apply range',exact:true}).click();
  for(const input of await endpoints.all()) {
    await expect(input).toHaveAccessibleDescription(/Edit Gregorian date.*Range change canceled\./);
    await expect(input).toHaveAttribute('aria-invalid','true');
  }
  await endpoints.first().focus();
  await host.evaluate(el=>{(el as any).description='Changed outer guidance';(el as any).editLabel='Use your browser date format.';});
  await expect(endpoints.first()).toBeFocused();
  await expect(endpoints.first()).toHaveAccessibleDescription('Use your browser date format. Range change canceled.');
  await endpoints.first().fill('2026-09-13');
  await endpoints.first().press('Tab');
  for(const input of await endpoints.all()) {
    await expect(input).toHaveAccessibleDescription('Use your browser date format.');
    await expect(input).not.toHaveAttribute('aria-invalid','true');
  }
  await host.getByRole('button',{name:'Apply range',exact:true}).click();
  await expect.poll(()=>host.evaluate(el=>(el as any).rangeValue)).toEqual({start:'2026-09-13',end:'2026-09-20'});
  await expect(host.locator('#picker-trigger button')).toBeFocused();
  expect(await page.locator('form').evaluate(el=>Object.fromEntries(new FormData(el as HTMLFormElement)))).toMatchObject({start:'2026-09-13',end:'2026-09-20'});
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect.poll(()=>host.evaluate(el=>(el as any).rangeValue)).toEqual({start:'2026-09-10',end:'2026-09-20'});
});


test('hydration retains the native controls and pre-hydration interval edit', async({page})=>{
  await page.goto('/composite-accessibility-fixture');
  const range=page.locator('#range input').first(), exact=page.locator('#color en-text-field input');
  await page.locator('form').evaluate(form=>{
    (window as any).originalControls=[...form.querySelectorAll('en-color-slider,en-range-slider,en-date-picker')].flatMap(host=>{
      const root=host.shadowRoot!;
      return [...root.querySelectorAll('input,.thumb'),root.querySelector('en-text-field')?.shadowRoot?.querySelector('input'),root.querySelector('#picker-trigger')?.shadowRoot?.querySelector('button')].filter(Boolean);
    });
  });
  await range.fill('31');
  await page.evaluate(()=>(window as any).hydrateComposites());
  await expect(range).toHaveValue('31');
  await expect(range).toBeFocused();
  expect(await page.evaluate(()=>(window as any).originalControls.every((el:Element)=>el.isConnected))).toBe(true);
  await expect.poll(()=>references(exact)).toEqual(colorRefs);
  await page.locator('#range').evaluate(el=>{(el as any).value=[31,80];});
  await range.fill('33');
  await page.locator('#range').evaluate(el=>{(el as any).value=[31,80];});
  await expect(range).toHaveValue('31');
});

test('range and date slot transitions preserve focused native targets and error independence',async({page})=>{
  await open(page);
  for(const id of ['range','single','dates']) {
    const host=page.locator('#'+id);
    await host.evaluate(el=>{(el as any).error='';(el as any).calendar='gregory';});
    const control=id==='range'?host.locator('.thumb').first():id==='single'?host.locator('input[type=date]'):host.locator('#picker-trigger button');
    await control.focus();
    for(const action of ['empty','fill','hidden','show','remove','restore']) {
      const expected=action==='fill'||action==='show'||action==='restore'?'Restored authored help.':action==='remove'?'Updated fallback.':'';
      await host.evaluate((el,action)=>{
        (el as any).description='Updated fallback.';
        let slot=el.querySelector<HTMLElement>('[slot=description]');
        if(action==='restore'){slot=document.createElement('span');slot.slot='description';el.append(slot);}
        if(action==='fill'||action==='restore')slot!.textContent='Restored authored help.';
        if(action==='empty')slot!.textContent='';
        if(action==='hidden')slot!.hidden=true;
        if(action==='show')slot!.hidden=false;
        if(action==='remove')slot!.remove();
      },action);
      await expect(control).toBeFocused();
      if(id==='dates') {
        await expect.poll(()=>references(control)).toEqual([{id:'description',root:'dates'}]);
        await expect(host.locator('#picker-trigger')).toHaveAccessibleDescription(expected);
      } else await expect(control).toHaveAccessibleDescription(expected);
    }
  }
});

test('required date errors reach the focused input or range trigger and clear after correction', async({page})=>{
  await open(page);
  for(const id of ['single','dates']) {
    const host=page.locator('#'+id);
    await host.evaluate(async el=>{
      const field=el as any;field.error='';field.required=true;field.validationText='Select a date.';
      if(field.selection==='range')field.rangeValue={start:'',end:''};else field.value='';
      await field.updateComplete;field.reportValidity();
    });
    const control=id==='single'?host.locator('input[type=date]'):host.locator('#picker-trigger button');
    await expect(control).toHaveAttribute('aria-invalid','true');
    await expect.poll(()=>references(control)).toContainEqual({id:'error',root:id});
    await host.evaluate(el=>{
      const field=el as any;
      if(field.selection==='range')field.rangeValue={start:'2026-09-10',end:'2026-09-20'};else field.value='2026-09-10';
    });
    await expect(control).not.toHaveAttribute('aria-invalid','true');
    await expect.poll(()=>references(control)).not.toContainEqual({id:'error',root:id});
  }
});
