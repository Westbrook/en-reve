import {test,expect,type Page} from '@playwright/test';
const path='/packages/styles/tests/composition/fixture.html';
async function fixture(page:Page,html:string,css=''){
 await page.goto(path);await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.evaluate(({html,css})=>{document.querySelector('#fixture')!.innerHTML=html;const s=document.createElement('style');s.textContent=css;document.head.append(s);},{html,css});
}
test('toolbar hook controls inner layout and validation uses danger role',async({page})=>{
 await fixture(page,'<en-editor-toolbar id="toolbar" style="--en-editor-toolbar-gap:12px;--en-color-danger-text:rgb(170,20,30)"></en-editor-toolbar>');
 await expect(page.locator('en-toolbar').locator('.en-toolbar')).toHaveCSS('gap','12px');
 await page.locator('#toolbar').evaluate((el:any)=>{el.linkEditing=true;el.error='Invalid link';});
 await expect(page.getByRole('alert')).toHaveCSS('color','rgb(170, 20, 30)');
});
for(const tag of ['en-token-editor','en-rich-text-editor']){
 test(`${tag} shared field hooks, Parts, disabled and absolute sizes`,async({page})=>{
  await fixture(page,`<div class="en-foundation" data-size="large"><${tag} id="editor" label="Draft" style="--en-input-background:rgb(21,40,60);--en-control-background:rgb(10,20,30);--en-input-color:rgb(220,230,240);--en-input-inline-padding:23px;--en-field-gap:17px"></${tag}></div>`,`${tag}::part(label){letter-spacing:3px}${tag}::part(control){border-style:dashed}`);
  const host=page.locator('#editor'), control=host.locator('[part~=control]');
  await expect(control).toHaveCSS('background-color','rgb(21, 40, 60)');await expect(control).toHaveCSS('padding-inline-start','23px');await expect(control).toHaveCSS('color','rgb(220, 230, 240)');await expect(control).toHaveCSS('border-top-style','dashed');
  await expect(host.locator('[part=label]')).toHaveCSS('margin-block-end','17px');await expect(host.locator('[part=label]')).toHaveCSS('letter-spacing','3px');
  const medium=await control.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius));
  await host.evaluate(async(el:any)=>{el.size='small';await el.updateComplete;});const small=await control.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius));
  await host.evaluate(async(el:any)=>{el.size='inherit';await el.updateComplete;});const large=await control.evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(small).toBeLessThan(medium);expect(large).toBeGreaterThan(medium);
  await host.evaluate((el:any)=>el.disabled=true);await expect(control).toHaveAttribute('contenteditable','false');await expect(control).not.toHaveCSS('background-color','rgb(21, 40, 60)');
 });
 test(`${tag} actual suggestions adopt list geometry, foreground and keyboard choice`,async({page})=>{
  await fixture(page,`<${tag} id="editor" label="Draft" style="--en-option-list-max-block-size:120px;--en-option-list-gap:9px;--en-option-block-padding:13px;--en-overlay-color:rgb(110,20,130)"></${tag}>`);
  await page.locator('#editor').evaluate(async(el:any)=>{await el.updateComplete;el.registerExtension({id:'test',trigger:'@',label:'Choices',provide:()=>Array.from({length:8},(_,i)=>({id:String(i),label:'Choice '+i,insert:[{kind:'text',text:'RESULT'+i}]}))});el.focus();});
  await page.getByRole('textbox').pressSequentially('@');const opts=page.getByRole('option');await expect(opts).toHaveCount(8);
  await expect(opts.nth(1)).toHaveCSS('padding-block-start','13px');await expect(opts.nth(1)).toHaveCSS('margin-block-start','9px');await expect(opts.nth(1)).toHaveCSS('color','rgb(110, 20, 130)');
  expect((await page.getByRole('listbox').boundingBox())!.height).toBeLessThanOrEqual(121);
  await page.getByRole('textbox').press('ArrowDown');await page.getByRole('textbox').press('Enter');await expect(page.getByRole('textbox')).toContainText('RESULT1');
 });
}
test('data facade forwards paint and pagination controls while preserving host Parts',async({page})=>{
 await fixture(page,'<en-data-table id="table" mode="paginated"></en-data-table>',`en-data-table::part(table-surface){border-radius:20px;border-style:dashed}en-data-table::part(surface){margin-top:7px}en-data-table::part(pagination-next){border-radius:19px}`);
 await page.locator('#table').evaluate((el:any)=>{el.columns=[{key:'name',label:'Name',renderCell:(item:any)=>item.name}];el.items=Array.from({length:30},(_,i)=>({id:String(i),name:'Row '+i}));el.pageSize=5;});
 await expect(page.locator('en-table').locator('[part=base]')).toHaveCSS('border-radius','20px');await expect(page.locator('en-table')).toHaveCSS('margin-top','7px');
 await expect(page.locator('en-pagination').locator('[part~=next]')).toHaveCSS('border-radius','19px');
 await page.locator('en-pagination').locator('[part~=next]').click();await expect(page.locator('en-pagination').locator('[part~=page][aria-current=page]')).toContainText('2');
});
test('presence native control is separately reachable',async({page})=>{
 await fixture(page,'<en-presence-group limit="1"><en-presence name="A"></en-presence><en-presence name="B"></en-presence></en-presence-group>','en-presence-group::part(overflow-control){border-radius:19px}');
 await expect(page.locator('en-presence-group en-button').locator('[part=control]')).toHaveCSS('border-radius','19px');
});
for(const plane of [false,true])test(`color picker ${plane?'plane':'channels'} forwards validation through every boundary`,async({page})=>{
 await fixture(page,`<en-color-picker id="picker" format="rgb" ${plane?'plane':''}></en-color-picker>`,`en-color-picker::part(channel-error){color:rgb(180,10,80)}`);
 const field=page.locator('en-color-slider').first().locator('en-text-field');await field.evaluate((el:any)=>el.error='Invalid channel');
 await expect(field.locator('[part~=error]')).toHaveCSS('color','rgb(180, 10, 80)');
});
test('hex guidance and validation expose separate canonical Parts',async({page})=>{
 await fixture(page,'<en-color-picker></en-color-picker>','en-color-picker::part(error){letter-spacing:17px}en-color-picker::part(hex-description){color:rgb(20,80,100)}en-color-picker::part(hex-error){color:rgb(180,10,80)}');
 const field=page.locator('en-color-picker en-text-field').first();await field.evaluate((el:any)=>{el.description='Guidance';el.error='Invalid';});
 await expect(field.locator('[part=description]')).toHaveCSS('color','rgb(20, 80, 100)');await expect(field.locator('[part=error]')).toHaveCSS('color','rgb(180, 10, 80)');await expect(field.locator('[part=error]')).not.toHaveCSS('letter-spacing','17px');
 await expect(field).toHaveAttribute('exportparts','control:hex,description:hex-description,error:hex-error');
});
test('data, document heading and strong-label typography follows named roles',async({page})=>{
 await fixture(page,'<en-data-table id="table"></en-data-table><en-rich-text-editor id="rich" label="Rich"></en-rich-text-editor><en-color-wheel label="Hue"></en-color-wheel>', '#fixture{--en-font-data-family:monospace;--en-font-data-weight:300;--en-font-heading-large-family:monospace;--en-font-label-strong-weight:800}');
 await page.locator('#rich').evaluate((el:any)=>el.document={version:1,type:'en-rich-text',doc:{type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Heading'}]}]}});
 await expect(page.locator('#table table')).toHaveCSS('font-family','monospace');await expect(page.locator('#table table')).toHaveCSS('font-weight','300');
 await expect(page.locator('#rich h1')).toHaveCSS('font-family','monospace');await expect(page.locator('en-color-wheel').locator('#hue-label')).toHaveCSS('font-weight','800');
});
test('color contours consume selected size and preserve component-over-shared radius',async({page})=>{
 await fixture(page,'<en-color-picker id="small" size="small"></en-color-picker><en-color-picker id="large" size="large"></en-color-picker><en-color-plane id="plane"></en-color-plane>');
 const radius=async(id:string)=>page.locator(id).locator('[part=preview]').evaluate(el=>parseFloat(getComputedStyle(el).borderTopLeftRadius));
 expect(await radius('#small')).toBeLessThan(await radius('#large'));
 await page.locator('#large').evaluate(el=>el.setAttribute('style','--en-control-radius:17px;--en-color-picker-preview-radius:11px'));await expect(page.locator('#large').locator('[part=preview]')).toHaveCSS('border-radius','11px');
 await page.locator('#plane').evaluate(el=>el.setAttribute('style','--en-control-radius:17px'));await expect(page.locator('#plane').locator('[part=plane]')).toHaveCSS('border-radius','17px');
});
test('calendar single-date state precedence is shared and range endpoints remain specialized',async({page})=>{
 await fixture(page,'<en-calendar id="single" value="2026-09-18" today="2026-09-18"></en-calendar><en-calendar id="range" selection="range" value="2026-09-18" today="2026-09-18"></en-calendar>','#fixture{--en-option-background:rgb(10,30,50);--en-option-selected-background:rgb(20,60,90);--en-option-hover-background:rgb(40,80,120);--en-option-pressed-background:rgb(60,100,140);--en-option-disabled-color:rgb(150,30,30);--en-option-selected-font-weight:800;--en-calendar-hover-opacity:0;--en-calendar-pressed-opacity:0}');
 const selected=page.locator('#single [part~=selected]');await expect(selected).toHaveCSS('background-color','rgb(20, 60, 90)');await expect(selected).toHaveCSS('font-weight','800');await selected.hover();await expect(selected).toHaveCSS('background-color','rgb(40, 80, 120)');await page.mouse.down();await expect(selected).toHaveCSS('background-color','rgb(60, 100, 140)');await page.mouse.up();
 await selected.evaluate(el=>el.setAttribute('aria-disabled','true'));await expect(selected).toHaveCSS('color','rgb(150, 30, 30)');
 await page.locator('#range').evaluate((el:any)=>el.rangeValue={start:'2026-09-18',end:'2026-09-21'});await expect(page.locator('#range [part~=range-start]')).toHaveCSS('border-top-width','2px');await expect(page.locator('#range [part~=range-start]')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
});
for(const registered of [false,true])test(`full/partial boundaries reach nested repairs${registered?' with compatible registrations':''}`,async({page})=>{
 await fixture(page,'<section id="parent"><section id="full"><en-editor-toolbar></en-editor-toolbar></section><section id="partial"><en-editor-toolbar></en-editor-toolbar></section></section>','#parent{--en-editor-toolbar-gap:25px}');
 await page.evaluate(registered=>{const w=window as any,s=document.createElement('style'),t=w.resolveTheme();s.textContent=(registered?w.emitPropertyRegistrations(t):'')+w.emitThemeCSS(t,{selector:'#full'})+w.emitThemeCSS(t,{selector:'#partial',kind:'partial',tokenIds:['color.text']});document.head.append(s);},registered);
 await expect(page.locator('#partial en-toolbar .en-toolbar')).toHaveCSS('gap','25px');await expect(page.locator('#full en-toolbar .en-toolbar')).not.toHaveCSS('gap','25px');
});
test('forced-colors calendar and editor focus remain visible',async({page})=>{
 await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await fixture(page,'<en-calendar value="2026-09-18" today="2026-09-18"></en-calendar><en-token-editor label="Draft"></en-token-editor>');
 const selected=page.locator('en-calendar [part~=selected]');await selected.focus();await expect(selected).not.toHaveCSS('outline-style','none');await expect(selected).toHaveCSS('background-image','none');
 await page.getByRole('textbox').focus();await expect(page.getByRole('textbox')).not.toHaveCSS('outline-style','none');
});
test('coarse color controls honor the public touch floor in both orientations',async({browser})=>{
 const context=await browser.newContext({hasTouch:true});const page=await context.newPage();await fixture(page,'<en-color-slider id="horizontal"></en-color-slider><en-color-slider id="vertical" orientation="vertical"></en-color-slider>','#fixture{--en-size-target-touch:64px;--en-control-min-size:60px}');
 const horizontal=page.locator('#horizontal input[type=range]'),vertical=page.locator('#vertical input[type=range]');expect((await horizontal.boundingBox())!.height).toBeGreaterThanOrEqual(64);expect((await vertical.boundingBox())!.width).toBeGreaterThanOrEqual(64);await context.close();
});

test('native calendar recipe follows single-date option paint',async({page})=>{
 await fixture(page,'<div class="en-foundation en-calendar"><table><tbody><tr><td aria-selected="true"><button class="en-calendar-day">18</button></td></tr></tbody></table></div>','#fixture{--en-option-selected-background:rgb(20,60,90);--en-option-hover-background:rgb(40,80,120)}');
 const day=page.getByRole('button',{name:'18',exact:true});await expect(day).toHaveCSS('background-color','rgb(20, 60, 90)');await day.hover();await expect(day).toHaveCSS('background-color','rgb(40, 80, 120)');
});
