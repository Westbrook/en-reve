import {test,expect,type Page} from '@playwright/test';
async function fixture(page:Page,html:string,css=''){
 await page.goto('/packages/styles/tests/composition/fixture.html');
 await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.evaluate(({html,css})=>{document.querySelector('#fixture')!.innerHTML=html;const style=document.createElement('style');style.textContent=css;document.head.append(style);},{html,css});
}
test('summary slot owns content through property/attribute writes, empty assignment and removal',async({page})=>{
 await fixture(page,'<en-validation-summary id="summary" description="Attribute guidance"><strong slot="description">Authored guidance</strong></en-validation-summary>');
 const host=page.locator('#summary');
 await host.evaluate((el:any)=>el.items=[{target:'name',message:'Enter a name'}]);
 await expect(page.getByText('Authored guidance',{exact:true})).toBeVisible();
 await expect(page.getByText('Attribute guidance',{exact:true})).not.toBeVisible();
 await host.evaluate((el:any)=>{(window as any).authored=el.firstElementChild;el.description='Property guidance';});
 await expect(page.getByText('Authored guidance',{exact:true})).toBeVisible();
 await expect(page.getByText('Property guidance',{exact:true})).not.toBeVisible();
 await host.locator('strong').evaluate(el=>el.textContent='');
 await expect(page.getByText('Property guidance',{exact:true})).not.toBeVisible();
 await host.evaluate(el=>el.setAttribute('description','Latest attribute'));
 await expect(page.getByText('Latest attribute',{exact:true})).not.toBeVisible();
 expect(await host.evaluate(el=>el.firstElementChild===(window as any).authored)).toBe(true);
 await host.locator('strong').evaluate(el=>el.remove());
 await expect(page.getByText('Latest attribute',{exact:true})).toBeVisible();
 await host.evaluate((el:any)=>el.description='Updated fallback');
 await expect(page.getByText('Updated fallback',{exact:true})).toBeVisible();
 await host.evaluate(el=>el.append((window as any).authored));
 await expect(page.getByText('Updated fallback',{exact:true})).not.toBeVisible();
 await host.evaluate((el:any)=>el.items=[]);
 await expect(host.locator('[part=base]')).toHaveCount(0);
});
test('activity metadata owns authored time while timestamp fallback returns on removal',async({page})=>{
 await fixture(page,'<en-activity-item datetime="2026-09-19" time-label="Yesterday"><time slot="metadata" datetime="2026-09-20">Today</time>Updated the brief</en-activity-item>');
 const host=page.locator('en-activity-item'),authored=host.locator(':scope > time'),fallback=host.locator('[part=time]');
 await expect(authored).toBeVisible();await expect(fallback).not.toBeVisible();
 expect(await host.evaluate(el=>el.querySelector('time')!.assignedSlot!.parentElement!.tagName)).toBe('SPAN');
 await host.evaluate((el:any)=>{el.timeLabel='Tomorrow';el.datetime='2026-09-21';});
 await expect(authored).toHaveAttribute('datetime','2026-09-20');await expect(authored).toHaveText('Today');
 await authored.evaluate(el=>el.remove());await expect(fallback).toBeVisible();await expect(fallback).toHaveText('Tomorrow');await expect(fallback).toHaveAttribute('datetime','2026-09-21');
});
test('canonical root, content and disclosure Parts style working surfaces',async({page})=>{
 await fixture(page,'<en-card>Card content</en-card><en-pagination page-count="3"></en-pagination><en-accordion-item label="Details">Body</en-accordion-item><en-navigation-group label="Group"><a href="#child">Child</a></en-navigation-group><en-toast-region label="Updates"></en-toast-region>',
  'en-card::part(content){padding:29px}en-card::part(body){padding:71px}en-pagination::part(base){border-top:7px solid red}en-accordion-item::part(control),en-navigation-group::part(control){letter-spacing:3px}en-toast-region::part(base){padding:13px}');
 await expect(page.locator('en-card [part=content]')).toHaveCSS('padding-top','29px');
 await expect(page.locator('en-pagination nav')).toHaveCSS('border-top-width','7px');
 await expect(page.locator('en-toast-region [part=base]')).toHaveCSS('padding-top','13px');
 const button=page.locator('en-accordion-item button');await expect(button).toHaveCSS('letter-spacing','3px');await button.click();await expect(button).toHaveAttribute('aria-expanded','true');
 const summary=page.locator('en-navigation-group summary');await expect(summary).toHaveCSS('letter-spacing','3px');await summary.click();await expect(page.locator('en-navigation-group details')).toHaveAttribute('open','');
 await page.locator('en-toast-region').evaluate((el:any)=>el.focus());await expect(page.locator('en-toast-region [part=base]')).toBeFocused();
});
test('progress disclosure keeps summary slot and distinct control scope',async({page})=>{
 await fixture(page,'<en-progress-steps style="width:260px"><span slot="summary">Authored progress</span></en-progress-steps>','en-progress-steps::part(disclosure-control){letter-spacing:3px}');
 const host=page.locator('en-progress-steps');await host.evaluate((el:any)=>el.items=[{value:'a',label:'First'},{value:'b',label:'Second'}]);
 const summary=host.locator('summary');await expect(summary).toHaveCSS('letter-spacing','3px');await expect(page.getByText('Authored progress')).toBeVisible();
 await summary.click();await host.getByRole('button',{name:/Second/}).click();await expect(host.locator('details')).not.toHaveAttribute('open');
 expect(await host.evaluate((el:any)=>el.value)).toBe('b');
});
test('wheel exact editor forwards native input and validation independently of host',async({page})=>{
 await fixture(page,'<en-color-wheel></en-color-wheel>','en-color-wheel::part(editor-field){margin-inline-start:9px}en-color-wheel::part(editor){border-top:5px dashed red}en-color-wheel::part(error){color:rgb(180,10,80)}');
 const field=page.locator('en-color-wheel en-text-field');await expect(field).toHaveCSS('margin-inline-start','9px');await expect(field.locator('input')).toHaveCSS('border-top-width','5px');
 await field.evaluate((el:any)=>el.error='Invalid hue');await expect(field.locator('[part=error]')).toHaveCSS('color','rgb(180, 10, 80)');
});
for(const tag of ['en-token-editor','en-rich-text-editor'])test(`${tag} renderer fallback, canonical control and stable extension wrapper`,async({page})=>{
 await fixture(page,`<${tag} id="editor"></${tag}>`,`${tag}::part(control){border-top:5px dashed red}${tag}::part(token-content){letter-spacing:2px}`);
 const host=page.locator('#editor');await expect(host.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await host.evaluate((el:any)=>{
  const run={kind:'token',id:'mira',type:'mention',label:'Mira label',text:'@Mira',data:{id:'mira'}};
  el.document=el.localName==='en-token-editor'?{version:1,runs:[run]}:{version:1,type:'en-rich-text',doc:{type:'doc',content:[{type:'paragraph',content:[{type:'token',attrs:{run}}]}]}};
 });
 await expect(host.locator('[part~=token-content]')).toHaveText('@Mira');
 await expect(host.getByRole('textbox')).toHaveAttribute('part','control');await expect(host.getByRole('textbox')).toHaveCSS('border-top-width','5px');
 await host.evaluate((el:any)=>el.registerToken('mention',()=>{throw new Error('Renderer failed');},{extension:'mentions',part:'mention'}));
 const chip=host.locator('button[part~=token-interactive]');await expect(chip).toBeDisabled();await expect(chip).toHaveAccessibleName('Mira label');await expect(chip.locator('[part=token-content]')).toHaveText('@Mira');
 await host.evaluate((el:any)=>(window as any).disposeExtension=el.registerExtension({id:'mentions',trigger:'@',label:'Mentions',provide:()=>[{id:'next',label:'Next'}]}));
 await expect(chip).toBeEnabled();await chip.click();await expect(host.getByRole('option')).toHaveText('Next');
 await host.evaluate(()=>(window as any).disposeExtension());await expect(chip).toBeDisabled();await expect(host.getByRole('option')).toHaveCount(0);
 await host.evaluate((el:any)=>el.registerExtension({id:'mentions',trigger:'@',label:'Mentions',provide:()=>[]}));await expect(chip).toBeEnabled();
 await host.evaluate((el:any)=>el.readOnly=true);await expect(chip).toBeDisabled();
});


test('palette exposes one modal surface while primary controls remain independent',async({page})=>{
 await fixture(page,'<en-command-palette label="Commands"></en-command-palette>','en-command-palette::part(surface){border-top:7px solid red}en-command-palette::part(base){border-top-width:23px}');
 const host=page.locator('en-command-palette');await host.evaluate((el:any)=>el.open=true);
 await expect(host.getByRole('dialog')).toBeVisible();await expect(host.getByRole('dialog')).toHaveCSS('border-top-width','7px');
 await expect(host.getByRole('dialog')).toHaveAttribute('part','surface');await host.getByRole('dialog').press('Escape');await expect(host.getByRole('dialog')).not.toBeVisible();
});
