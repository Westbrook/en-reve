import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {exposedParts} from '../../tooling/customization/browser-parts.js';
const manifest=JSON.parse(readFileSync(new URL('../../packages/elements/custom-elements.json',import.meta.url),'utf8'));
const components=manifest.modules.flatMap((m:any)=>m.declarations??[]).filter((d:any)=>d.tagName);

for(const component of components) test(`${component.tagName} advertised Parts are reachable`,async({page},testInfo)=>{
 const pageErrors:string[]=[];page.on('pageerror',error=>pageErrors.push(error.message));
 await page.goto('/probes/api-contracts/fixture.html');await page.waitForFunction(()=>document.body.dataset.ready==='true');
 const observations:Record<string,string[]>={};
 const states=['default','populated','alternate','range-preview','invalid'];
 if(component.tagName==='en-date-picker')states.push('deferred');
 for(const state of states) {
  if(['en-menu','en-context-menu'].includes(component.tagName)&&state==='alternate')await page.setViewportSize({width:320,height:700});
  await page.locator('#fixture').evaluate(async(container,{tag,state,attributes:knownAttributes})=>{
   container.replaceChildren();const host=document.createElement(tag) as any;host.id='subject';
   if(state!=='default'){
    const attributes:Record<string,string>={label:'Example',description:'Description',error:'Error',heading:'Heading',title:'Title',name:'sample',value:'one','editor-label':'Exact value','show-value':'',editable:'',open:'',expanded:'',dismissible:'',clearable:'',searchable:'','show-controls':'','show-picker':'',autoplay:'','boundary-controls':'',reorderable:'',plane:'',arrow:'',for:'anchor'};
    for(const [name,value] of Object.entries(attributes))if(knownAttributes.includes(name))host.setAttribute(name,value);
    host.textContent='Content';
    const children:Record<string,string>={
     'en-accordion':'<en-accordion-item label="Item" open>Content</en-accordion-item>',
     'en-tabs':'<en-tab value="one">One</en-tab><en-tab-panel value="one">Content</en-tab-panel>',
     'en-radio-group':'<en-radio value="one" label="One"></en-radio>',
     'en-segmented-control':'<en-segmented-item value="one">One</en-segmented-item><en-segmented-item value="two" disabled>Two</en-segmented-item>',
     'en-select':'<en-select-option value="one">One</en-select-option>',
     'en-menu':'<en-menu-item value="one">One</en-menu-item>',
     'en-tooltip':'<span slot="content">Description</span>',
     'en-navigation':'<a href="#one">One</a>',
     'en-tree':'<en-tree-item value="one" label="One"><en-tree-item value="two" label="Two"></en-tree-item></en-tree-item>',
     'en-breadcrumbs':'<a href="#one">One</a><a href="#two">Two</a><span>Three</span>',
     'en-carousel':'<en-carousel-slide label="One">One</en-carousel-slide><en-carousel-slide label="Two">Two</en-carousel-slide>',
     'en-presence-group':'<en-presence label="Ada"></en-presence><en-presence label="Bob"></en-presence>',
     'en-progress-steps':'<en-progress-step value="one" label="One"></en-progress-step><en-progress-step value="two" label="Two"></en-progress-step>',
    };if(children[tag])host.innerHTML=children[tag];
    if(['en-slider','en-rating','en-number-field','en-splitter','en-split-view'].includes(tag))host.value=25;
    if(['en-toggle-group','en-checkbox-group','en-multiselect','en-selection-collection'].includes(tag)){host.items=[{value:'one',label:'One'}];host.value=['one'];}
    if(tag==='en-toggle-group')host.items=[{value:'one',label:'One',icon:'check'}];
    if(tag==='en-tag'){host.label='One';host.removable=true;}
    if(tag==='en-progress-bar'&&state==='alternate')host.shape='circle';
    // The invalid perimeter Part belongs to the public adorned composition;
    // ordinary populated states still exercise the unadorned native control.
    if(['en-text-field','en-otp-field'].includes(tag)&&state==='invalid')host.adorned=true;
    if(tag==='en-combobox'){host.items=[{value:'one',label:'One',description:'Description'},{value:'two',label:'Two',disabled:true}];host.value='one';}
    if(tag==='en-command-palette')host.commands=[{action:'one',label:'One',description:'Description',shortcut:'Ctrl+K'}];
    if(tag==='en-validation-summary')host.items=[{target:'anchor',message:'Required'}];
    if(tag==='en-data-table'){host.columns=[{key:'name',label:'Name',compare:(a:any,b:any)=>a.name.localeCompare(b.name),renderCell:(row:any)=>row.name}];host.items=[{id:'one',name:'One'}];host.selection='multiple';}
    if(tag==='en-pagination'){host.pageCount=50;host.page=5;}
    if(tag==='en-calendar'){host.value='2026-09-19';host.selection='range';host.today='2026-09-19';host.rangeValue={start:'2026-09-18',end:'2026-09-20'};}
    if(tag==='en-tree-item'){host.reorderable=true;host.innerHTML='<en-tree-item value="child" label="Child"></en-tree-item>';}
    if(tag==='en-icon')host.name='check';
    if(tag==='en-avatar')host.name='Ada Lovelace';
    if(tag==='en-file-upload')host.files=[new File(['x'],'sample.txt',{type:'text/plain'})];
    if(tag==='en-activity-feed'){host.items=[{key:'one',author:'Ada',text:'Message',group:'Today'}];host.mode=state==='alternate'?'virtual':'paginated';}
    if(tag==='en-carousel'){host.controls='always';host.navigation='thumbnails';host.boundaryControls=true;host.items=[{key:'one',label:'One',thumbnail:'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'},{key:'two',label:'Two'}];}
    if(tag==='en-progress-steps'){host.items=[{value:'one',label:'One',description:'Description'},{value:'two',label:'Two'}];host.value='one';}
    if(tag==='en-chat-message'){host.author='Ada';host.timestamp='12:00';host.status='sent';}
    if(state==='alternate'){
     if('indeterminate'in host)host.indeterminate=true;
     if('loading'in host)host.loading=true;
     if('plane'in host)host.plane=false;
     if('type'in host && tag==='en-menu-item')host.type='checkbox';
     if(tag==='en-avatar')host.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
     if(tag==='en-calendar')host.selection='single';
     if(tag==='en-carousel')host.readingMode='list';
    }
   }
   if(tag==='en-presence')host.href='#profile';
   if(tag==='en-navigation')host.collapseAt='40rem';
   if(tag==='en-toast-region')host.history=true;
   if(tag==='en-color-plane'||tag==='en-color-picker')host.alpha=true;
   if(tag==='en-color-picker'&&state==='alternate'){host.color='color(display-p3 1 0 0)';host.format='hsl';host.showHex=false;}
   if(tag==='en-date-picker'&&state!=='default'){host.value='2026-09-19';host.selection=['alternate','deferred'].includes(state)?'single':'range';host.calendar='buddhist';host.rangeValue={start:'2026-09-18',end:'2026-09-20'};}
   if(tag==='en-date-picker'&&state==='deferred')host.setAttribute('calendar-loading','deferred');
   if(tag==='en-calendar'&&state==='invalid')host.calendar='unsupported';
   if(tag==='en-calendar'&&state==='range-preview')host.rangeValue={start:'2026-09-18',end:''};
   if(tag==='en-date-picker'&&state==='range-preview')host.rangeValue={start:'2026-09-18',end:''};
   if(tag==='en-progress-steps'&&state==='invalid'){host.innerHTML='<en-progress-step value="duplicate">One</en-progress-step><en-progress-step value="duplicate">Two</en-progress-step>';host.items=undefined;}
   if(tag==='en-validation-summary'&&state==='invalid')host.innerHTML='<a href="https://example.com">Invalid external target</a>';
   if(tag==='en-tree'&&state!=='default'){host.innerHTML='';host.items=[{key:'one',label:'One',children:[{key:'two',label:'Two'}]},{key:'three',label:'Three',branch:true,lazy:true}];host.expandedKeys=['one'];host.reorderable=true;host.loadChildren=()=>state==='invalid'?Promise.reject(new Error('Unavailable')):new Promise(()=>{});}
   if(['en-token-editor','en-rich-text-editor'].includes(tag)&&state!=='default'){
    const run={kind:'token',id:'mira',type:'mention',label:'Mira',text:'@Mira',data:{id:'mira'}};
    host.document=tag==='en-token-editor'?{version:1,runs:[run]}:{version:1,type:'en-rich-text',doc:{type:'doc',content:[{type:'paragraph',content:[{type:'token',attrs:{run}}]}]}};
    host.registerToken('mention',(token:any)=>document.createTextNode(token.text),{extension:'mentions'});
    host.registerExtension({id:'mentions',trigger:'@',label:'Mentions',provide:()=>[{id:'next',label:'Next'}]});
   }
   if(tag==='en-editor-toolbar'&&state!=='default'){host.innerHTML='';const editor:any=document.createElement('en-rich-text-editor');editor.id='associated-editor';editor.value='Link text';container.append(editor);host.editor=editor;}
   if(tag==='en-menu-item'&&state!=='default'){const parent=document.createElement('en-menu');parent.id='parent';host.id='subject';parent.append(host);const submenu:any=document.createElement('en-menu');submenu.setAttribute('for','subject');submenu.innerHTML='<en-menu-item action="next">Next</en-menu-item>';parent.append(submenu);container.append(parent);}
   else if(['en-menu','en-context-menu'].includes(tag)&&state==='alternate') {const parent:any=document.createElement('en-menu');parent.setAttribute('for','anchor');parent.innerHTML='<en-menu-item id="child-trigger">Nested</en-menu-item>';host.setAttribute('for','child-trigger');parent.append(host);container.append(parent);parent.open=true;host.open=false;}
   else container.append(host);
   for(let i=0;i<5;i++){
    const settle=async(element:any):Promise<void>=>{if(element.updateComplete)await element.updateComplete;for(const child of element.shadowRoot?.children??[])await settle(child);for(const child of element.children??[])await settle(child);};await settle(host);await new Promise(requestAnimationFrame);
   }
  },{tag:component.tagName,state,attributes:(component.attributes??[]).map((a:any)=>a.name)});
  if(state==='populated'&&component.tagName==='en-combobox')await page.locator('#subject').getByRole('combobox').press('ArrowDown');
  if(state==='alternate'&&['en-menu','en-context-menu'].includes(component.tagName)){await expect(page.locator('#fixture > en-menu > en-menu-item').getByRole('menuitem')).toBeVisible();await page.locator('#subject').evaluate(async(e:any)=>{e.open=true;await e.updateComplete;});await expect(page.locator('#subject [part=back]')).toBeAttached();}
  if(state==='range-preview'&&['en-calendar','en-date-picker'].includes(component.tagName)){
   await page.locator('#subject').evaluate(async(host:any)=>{const calendar=host.localName==='en-calendar'?host:host.shadowRoot.querySelector('en-calendar');await calendar.updateComplete;calendar.shadowRoot.querySelector('[data-date="2026-09-20"]')?.dispatchEvent(new PointerEvent('pointerenter'));await calendar.updateComplete;});
  }
  if(state==='range-preview'&&component.tagName==='en-rich-text-editor'){
   const editor=page.locator('#subject');
   await expect(editor.locator('[part~=control][contenteditable=true]')).toBeVisible();
   const result=await editor.evaluate((host:any)=>{
    host.value='Review this passage';
    const range={coordinate:'text',from:0,to:6,expectedText:'Review',revision:host.revision};
    return {valid:host.validateRange(range),decorated:host.decorateRanges([{id:'parts-review',range}])};
   });
   expect(result).toEqual({valid:true,decorated:true});
   await expect(editor.locator('[part~=range-decoration]')).toHaveText('Review');
  }
  if(state!=='default'&&['en-color-picker','en-color-plane'].includes(component.tagName))await page.locator('#subject').evaluate(async(host:any)=>{const child=host.shadowRoot.querySelector('en-color-slider')??host.shadowRoot.querySelector('en-color-plane')?.shadowRoot.querySelector('en-color-slider');if(child){child.error='Invalid';await child.updateComplete;const field=child.shadowRoot.querySelector('en-text-field');if(field){field.error='Invalid';await field.updateComplete;}}});
  if(state==='populated'&&['en-token-editor','en-rich-text-editor'].includes(component.tagName)){
   await page.locator('#subject [part~=token-interactive]').click();await expect(page.locator('#subject [part=option]')).toBeVisible();
  }
  if(state==='populated'&&component.tagName==='en-editor-toolbar'){
   await page.locator('#associated-editor').evaluate((e:any)=>e.focus());
   await page.locator('#associated-editor [contenteditable]').evaluate((el:any)=>{const node=el.querySelector('p').firstChild;document.getSelection()!.setBaseAndExtent(node,0,node,node.textContent.length);});
   await page.locator('#subject').getByRole('button',{name:'Link',exact:true}).click();await expect(page.locator('#subject [part=link-editor]')).toBeVisible();
  }
  if(['range-preview','invalid'].includes(state)&&component.tagName==='en-tree'){
   await page.locator('#subject').evaluate((host:any)=>{host.expandedKeys=['one','three'];void host.loadBranch('three');});
   await expect(page.locator('#subject [part='+ (state==='invalid'?'branch-status':'branch-loading') +']')).toBeAttached();
  }
  if(state==='alternate'&&component.tagName==='en-tree'){
   const from=(await page.locator('#subject [data-tree-drag]').first().boundingBox())!;
   const to=(await page.locator('#subject [part=option]').last().boundingBox())!;
   await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height-2,{steps:8});
   await expect(page.locator('#subject [part=drag-preview]')).toBeVisible();
  }
  if(state==='range-preview'&&component.tagName==='en-rich-text-editor'){
   expect(await page.locator('#subject').evaluate(async(host:any)=>{
    host.value='Alpha beta';await host.updateComplete;
    return host.decorateRanges([{id:'review',range:{coordinate:'text',from:0,to:5,expectedText:'Alpha',revision:host.revision}}]);
   })).toBe(true);
   await expect(page.locator('#subject [part~=range-decoration]')).toHaveText('Alpha');
  }
  observations[state]=await page.locator('#subject').evaluate(exposedParts);
  if(state==='deferred'&&component.tagName==='en-date-picker'){
   const host=page.locator('#subject'),status=host.locator('[part~=calendar-status]');
   await expect(status).toHaveCount(1);
   await expect(status).toHaveAttribute('role','status');
   await expect(status).toHaveAttribute('aria-live','polite');
   await expect(status).toBeEmpty();
   await expect(host.locator('input[type=date]')).toBeEditable();
   await expect(host.locator('en-calendar')).toHaveCount(0);
   const initialStatus=await status.elementHandle();
   await host.locator('#picker-trigger').getByRole('button').click();
   await expect(host.getByRole('dialog',{name:'Choose date',exact:true})).toBeVisible();
   await expect(host.locator('en-calendar')).toHaveCount(1);
   expect(await status.evaluate((element,initial)=>element===initial,initialStatus)).toBe(true);
   await expect(status).toBeEmpty();
   observations['deferred-open']=await host.evaluate(exposedParts);
  }
  if(state==='alternate'&&component.tagName==='en-tree')await page.mouse.up();
 }
 expect(pageErrors,'Component fixture errors').toEqual([]);
 const observed=[...new Set(Object.values(observations).flat())].sort();
 const expected=(component.cssParts??[]).map((p:any)=>p.name).sort();
 await testInfo.attach('part-states',{body:JSON.stringify({tag:component.tagName,expected,observations,missing:expected.filter((p:string)=>!observed.includes(p))},null,2),contentType:'application/json'});
 expect(expected.filter((p:string)=>!observed.includes(p)),'Unreachable advertised Parts; add a meaningful state fixture or correct the contract.').toEqual([]);
});
