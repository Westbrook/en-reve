import { test, expect, type Page } from '@playwright/test';
const route='/api-examples/split-view.html?progress-report';
const outer='#workspace-split', inner='#inspector-split';
async function start(page:Page,width=1280){
  await page.setViewportSize({width,height:960});await page.goto(route);
  await page.waitForFunction(()=>!!customElements.get('en-split-view'));
  await page.locator(outer).evaluate(async(el:any)=>{await el.updateComplete;});
}
async function state(page:Page,selector=outer){return page.locator(selector).evaluate((el:any)=>({value:el.value,collapsed:el.collapsed}));}
const handle=(page:Page,selector=outer)=>page.locator(selector).locator(':scope > .en-split-shell > [part=base] > en-splitter');

test('collapse, restore and switching panes retain authored content and bounded expanded size',async({page})=>{
  await start(page);
  const split=page.locator(outer), field=page.getByRole('textbox',{name:'Review note',exact:true});
  await field.fill('Keep this draft.');await field.evaluate(el=>(window as any).originalSplitField=el);
  await split.evaluate((el:any)=>{el.value=38;el.collapsible='both';});
  await split.getByRole('button',{name:'Collapse Navigation',exact:true}).click();
  expect(await state(page)).toEqual({value:38,collapsed:'primary'});
  await expect(page.getByRole('navigation',{name:'Workspace sections'})).toBeHidden();
  await expect(handle(page)).toBeHidden();
  await expect(field).toBeVisible();
  await split.getByRole('button',{name:'Collapse Secondary pane',exact:true}).click();
  expect(await state(page)).toEqual({value:38,collapsed:'secondary'});
  await expect(page.getByRole('navigation',{name:'Workspace sections'})).toBeVisible();
  await expect(field).toBeHidden();
  await split.evaluate((el:any)=>{el.max=32;});
  await expect.poll(()=>state(page)).toEqual({value:32,collapsed:'secondary'});
  await split.getByRole('button',{name:'Restore Secondary pane',exact:true}).click();
  expect(await state(page)).toEqual({value:32,collapsed:'none'});
  await expect(field).toHaveValue('Keep this draft.');
  expect(await field.evaluate(el=>(window as any).originalSplitField===el)).toBe(true);
});

test('separator keyboard collapse recovers focus and Tab reaches pane content after restore',async({page,browserName})=>{
  await start(page);const split=page.locator(outer), separator=handle(page);
  await separator.focus();await page.keyboard.press('Enter');
  const restore=split.getByRole('button',{name:'Restore Navigation',exact:true});
  await expect(restore).toBeFocused();await page.keyboard.press('Enter');
  await expect(split.getByRole('button',{name:'Collapse Navigation',exact:true})).toBeFocused();
  await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');
  await expect(split.getByRole('link',{name:'Overview',exact:true})).toBeFocused();
  await handle(page,inner).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Restore Inspector',exact:true})).toBeFocused();
});

test('author collapse recovers slotted focus; disabled author collapse focuses remaining pane',async({page})=>{
  await start(page);const split=page.locator(outer);
  await split.getByRole('link',{name:'Overview',exact:true}).focus();
  await split.evaluate((el:any)=>{el.collapsed='primary';});
  await expect(split.getByRole('button',{name:'Restore Navigation',exact:true})).toBeFocused();
  await split.evaluate((el:any)=>{el.collapsed='none';});
  await split.getByRole('link',{name:'Overview',exact:true}).focus();
  await split.evaluate((el:any)=>{el.disabled=true;el.collapsed='primary';});
  await expect(split.locator(':scope > .en-split-shell > [part=base] > [part=secondary]')).toBeFocused();
  expect(await split.evaluate((el:any)=>el.restore())).toBe('canceled');
  await split.evaluate((el:any)=>el.collapsed='none');await expect(handle(page)).toHaveAttribute('aria-disabled','true');
});

test('visibility cancellation defers geometry, focus and preserves numeric event contract',async({page})=>{
  await start(page);const split=page.locator(outer);await handle(page).focus();
  const observed=await split.evaluate((el:any)=>{
    let seen:any;let numeric=0;el.addEventListener('en-change',()=>numeric++);
    el.addEventListener('en-collapse',(e:CustomEvent)=>{seen={...e.detail,tentative:el.collapsed,hidden:el.shadowRoot.querySelector('[part=primary]').hidden,bubbles:e.bubbles,composed:e.composed};e.preventDefault();},{once:true});
    const result=el.collapse('primary');return {seen,result,numeric};
  });
  expect(observed).toEqual({seen:{previous:'none',proposed:'primary',reason:'programmatic',tentative:'primary',hidden:false,bubbles:true,composed:true},result:'canceled',numeric:0});
  await expect(handle(page)).toBeFocused();expect((await state(page)).collapsed).toBe('none');
  await page.keyboard.press('ArrowRight');expect((await state(page)).value).toBe(26);
});

test('authoritative equal writes and cross-state writes supersede tentative transactions',async({page})=>{
  await start(page);const split=page.locator(outer);
  const results=await split.evaluate((el:any)=>{
    const values:any[]=[];
    el.addEventListener('en-collapse',(e:Event)=>{el.collapsed='none';e.preventDefault();},{once:true});values.push(el.collapse('primary'),el.collapsed);
    el.addEventListener('en-collapse',(e:Event)=>{el.value=37;e.preventDefault();},{once:true});values.push(el.collapse('primary'),el.collapsed,el.value);
    el.addEventListener('en-change',(e:Event)=>{el.collapsed='primary';e.preventDefault();},{once:true});
    el.shadowRoot.querySelector('en-splitter').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    values.push(el.collapsed,el.value);return values;
  });
  expect(results).toEqual(['superseded','none','superseded','none',37,'primary',37]);
  await expect(handle(page)).toBeHidden();
});

test('nested visibility and resize acceptance reconcile superseded stages',async({page})=>{
  await start(page);const split=page.locator(outer);
  const result=await split.evaluate((el:any)=>{
    const separator=el.shadowRoot.querySelector('en-splitter');
    el.addEventListener('en-collapse',(e:Event)=>{separator.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));e.preventDefault();},{once:true});
    const first=[el.collapse('primary'),el.value,el.collapsed];
    el.addEventListener('en-change',(e:Event)=>{el.collapse('primary');e.preventDefault();},{once:true});
    separator.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    return {first,second:[el.value,el.collapsed]};
  });
  expect(result).toEqual({first:['superseded',26,'none'],second:[26,'primary']});
});

test('pointer sizing, Home/End and RTL retain the correct expanded percentage',async({page})=>{
  await start(page);const split=page.locator(outer),separator=handle(page);
  const box=(await separator.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+65,box.y+box.height/2,{steps:5});await page.mouse.up();
  const resized=(await state(page)).value;expect(resized).toBeGreaterThan(25);expect(resized).toBeLessThanOrEqual(45);
  await split.getByRole('button',{name:'Collapse Navigation',exact:true}).click();await split.getByRole('button',{name:'Restore Navigation',exact:true}).click();expect((await state(page)).value).toBe(resized);
  await split.evaluate((el:any)=>{el.dir='rtl';});await separator.focus();await page.keyboard.press('ArrowLeft');expect((await state(page)).value).toBeCloseTo(resized+1,2);
  await page.keyboard.press('Home');expect((await state(page)).value).toBe(15);await page.keyboard.press('End');expect((await state(page)).value).toBe(45);
});

test('narrow vertical composition preserves nodes, preference and keyboard sizing across rotation',async({page},info)=>{
  await start(page);const split=page.locator(outer),title=page.getByRole('textbox',{name:'Project title',exact:true});
  await title.fill('Rotated workspace');await title.evaluate(el=>(window as any).originalTitle=el);
  await split.getByRole('button',{name:'Collapse Navigation',exact:true}).click();await page.setViewportSize({width:390,height:844});
  await expect(split).toHaveAttribute('orientation','vertical');expect((await state(page)).collapsed).toBe('primary');
  await split.getByRole('button',{name:'Restore Navigation',exact:true}).click();
  await expect(handle(page)).toHaveAttribute('aria-orientation','horizontal');await handle(page).focus();await page.keyboard.press('ArrowDown');expect((await state(page)).value).toBe(26);
  const top=await split.locator(':scope > .en-split-shell > [part=base] > [part=primary]').boundingBox();
  const bottom=await split.locator(':scope > .en-split-shell > [part=base] > [part=secondary]').boundingBox();expect(bottom!.y).toBeGreaterThan(top!.y+top!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await info.attach('narrow-workspace',{body:await split.screenshot(),contentType:'image/png'});
  await page.setViewportSize({width:1280,height:960});await expect(split).toHaveAttribute('orientation','horizontal');
  await expect(title).toHaveValue('Rotated workspace');expect(await title.evaluate(el=>(window as any).originalTitle===el)).toBe(true);
  await info.attach('wide-workspace',{body:await split.screenshot(),contentType:'image/png'});
});

test('author-collapsed SSR is consistent before and after hydration',async({browser,baseURL,page})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const initial=await context.newPage();
  try{
    await initial.goto(baseURL+route);await initial.getByText('Review scenarios',{exact:true}).click();
    const split=initial.locator('#initially-collapsed');await expect(split.getByText('Reference notes are retained.',{exact:true})).toBeHidden();
    await expect(split.getByRole('button',{name:'Restore Reference',exact:true})).toBeVisible();
    await expect(split.getByText('Authored visibility is delivered before JavaScript. Restore exposes the reference notes.',{exact:true})).toBeVisible();
  }finally{await context.close();}
  await start(page);await page.getByText('Review scenarios',{exact:true}).click();const split=page.locator('#initially-collapsed');
  expect(await state(page,'#initially-collapsed')).toEqual({value:40,collapsed:'primary'});
  await split.getByRole('button',{name:'Restore Reference',exact:true}).click();await expect(split.getByText('Reference notes are retained.',{exact:true})).toBeVisible();
  await expect(split.getByRole('button')).toHaveCount(0); // No user-collapse actions when collapsible=none.
  await expect(split.locator('[part=primary]')).toBeFocused();
});

test('localization and forced colors retain discoverable named controls and exported parts',async({page})=>{
  await start(page);await page.emulateMedia({forcedColors:'active'});
  const split=page.locator(outer);await split.getByRole('button',{name:'Collapse Navigation',exact:true}).focus();
  await expect(split.getByRole('button',{name:'Collapse Navigation',exact:true})).toBeFocused();
  await split.evaluate((el:any)=>{el.primaryLabel='Navigation et collections';el.collapseLabel='Masquer {pane}';el.restoreLabel='Afficher {pane}';});
  await split.getByRole('button',{name:'Masquer Navigation et collections',exact:true}).click();
  await expect(split.getByRole('button',{name:'Afficher Navigation et collections',exact:true})).toBeVisible();
  await expect(split.locator('[part=primary-action]').first()).toHaveAttribute('exportparts','control:primary-toggle');
});

test('API property controls target the authored split view and documentation explains separate state',async({page})=>{
  await page.goto('/api-reference?component=en-split-view&progress-report');
  const frame=page.locator('.api-demo-frame');await frame.scrollIntoViewIfNeeded();
  await expect(frame).toHaveAttribute('data-example-ready','true');
  await expect(page.locator('.api-element-controls').getByRole('button',{name:'Refresh values',exact:true})).toBeEnabled();
  const row=page.locator('.api-element-controls form[data-control="value"]');
  await row.getByRole('textbox',{name:'value',exact:true}).fill('38');
  await row.getByRole('button',{name:'Apply value',exact:true}).click();
  await expect(page.frameLocator('.api-demo-frame').locator(outer)).toHaveJSProperty('value',38);
  await expect(page.locator('#api-split-view-guide')).toContainText('en-collapse');
});

test('inspired themes preserve collapse controls and layout without resetting content',async({page})=>{
  await start(page,390);const split=page.locator(outer);
  const themes=page.locator('en-select[label="Inspired theme"]').getByRole('combobox');
  for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']){
    await themes.selectOption(theme);
    await expect(page.getByRole('status',{name:'Theme result'})).not.toHaveText('');
    await split.getByRole('button',{name:'Collapse Navigation',exact:true}).click();
    await expect(split.getByRole('button',{name:'Restore Navigation',exact:true})).toBeVisible();
    await split.getByRole('button',{name:'Restore Navigation',exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});

test('existing vertical split without collapse controls retains its extent and resize keys',async({page})=>{
  await page.goto('/api-examples/split-view-vertical.html');
  const split=page.locator('en-split-view');await split.evaluate(async(el:any)=>{await el.updateComplete;});
  await expect(split.locator('[part=controls]')).toBeHidden();
  const separator=split.getByRole('separator');await separator.focus();await page.keyboard.press('ArrowDown');
  await expect(split).toHaveJSProperty('value',51);
  const root=(await split.boundingBox())!,a=(await split.locator('[part=primary]').boundingBox())!,b=(await split.locator('[part=secondary]').boundingBox())!;
  expect(a.height).toBeGreaterThan(40);expect(b.height).toBeGreaterThan(40);expect(b.y+b.height).toBeLessThanOrEqual(root.y+root.height+1);
});
