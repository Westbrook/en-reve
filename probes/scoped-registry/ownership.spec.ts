import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/probes/scoped-registry/ownership.html');
  await page.waitForFunction(() => Boolean((window as any).ownershipTest));
});

test('notify returns the owner version synchronously, including portals and cancellation', async ({page}) => {
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;
  const scope=createElementScope({document});scope.register([definitions['en-toast-region']]);
  const region=scope.createElement('en-toast-region');document.body.append(region);await region.updateComplete;
  const toast=region.notify({message:'First',duration:0});const synchronous=typeof toast.dismiss==='function';
  const registry=toast.customElementRegistry===region.customElementRegistry;
  await region.updateComplete;await toast.updateComplete;
  let events=0;toast.addEventListener('en-change',(event:Event)=>{events++;event.preventDefault();});region.dismissAll();await toast.updateComplete;
  const veto=toast.open;
  const portal=document.createElement('section');document.body.append(portal);portal.append(region);await region.updateComplete;
  const next=region.notify({message:'Portaled',duration:0});await region.updateComplete;await next.updateComplete;
  const owned=next instanceof scope.get('en-toast') && next.customElementRegistry===toast.customElementRegistry;
  const canceled=region.notify({message:'Canceled'});region.remove();await region.updateComplete;
  return {synchronous,registry,veto,events,owned,canceled:!canceled.isConnected,globalAbsent:scope.mode==='global'||!customElements.get('en-toast')};
 });
 expect(result).toEqual({synchronous:true,registry:true,veto:true,events:1,owned:true,canceled:true,globalAbsent:true});
});

test('missing synchronous dependencies fail in the owning registry, not the global registry',async({page})=>{
 const result=await page.evaluate(()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});
  scope.register([{...definitions['en-toast-region'],dependencies:[]}]);
  if(scope.mode==='scoped') customElements.define('en-toast',definitions['en-toast'].elementClass);
  const region=scope.createElement('en-toast-region');let message='';try{region.notify({message:'Fail'});}catch(error){message=String(error);}
  return message;
 });expect(result).toContain('owning registry must define en-toast');
});

test('late radio definitions preserve pre-upgrade values, one tab stop, form ownership and cancellation',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});
  scope.register([{...definitions['en-radio-group'],dependencies:[]}]);
  const form=document.createElement('form'),group=scope.createElement('en-radio-group');group.name='choice';group.label='Choice';group.value='two';
  const children=['one','two'].map(value=>{const el=scope.createElement('en-radio');el.value=value;el.textContent=value;group.append(el);return el;});
  form.append(group);document.body.append(form);await group.updateComplete;
  scope.register([definitions['en-radio']]);await Promise.all(children.map(el=>el.updateComplete));await Promise.resolve();await group.updateComplete;await Promise.all(children.map(el=>el.updateComplete));
  const selected=children.map(el=>el.checked);const stops=children.map(el=>el.shadowRoot.querySelector('input').tabIndex);
  let changes=0;group.addEventListener('en-change',(event:Event)=>{changes++;event.preventDefault();});children[0].shadowRoot.querySelector('input').click();await group.updateComplete;
  return {values:children.map(el=>el.value),selected,stops,data:new FormData(form).getAll('choice'),changes,value:group.value};
 });expect(result).toEqual({values:['one','two'],selected:[false,true],stops:[-1,0],data:['two'],changes:1,value:'two'});
});

test('late accordion definitions and object properties survive upgrade without slot mutations',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});
  const parent=scope.createElement('en-accordion');const values=['b'];parent.value=values;parent.multiple=true;
  parent.innerHTML='<en-accordion-item value="a">A</en-accordion-item><en-accordion-item value="b">B</en-accordion-item>';document.body.append(parent);
  scope.register([{...definitions['en-accordion'],dependencies:[]}]);await parent.updateComplete;
  scope.register([definitions['en-accordion-item']]);await Promise.all([...parent.children].map((el:any)=>el.updateComplete));await Promise.resolve();await parent.updateComplete;
  const open=[...parent.children].map((el:any)=>el.open);let changes=0;parent.addEventListener('en-change',(event:Event)=>{changes++;event.preventDefault();});parent.children[0].requestOpen(true);await parent.updateComplete;
  return {value:parent.value,multiple:parent.multiple,open,changes,after:parent.children[0].open};
 });expect(result).toEqual({value:['b'],multiple:true,open:[false,true],changes:1,after:false});
});

test('tabs coordinate separately upgraded labels and panels with stable selection',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});scope.register([{...definitions['en-tabs'],dependencies:[]}]);
  const parent=scope.createElement('en-tabs');parent.value='b';parent.label='Sections';parent.innerHTML='<en-tab slot="tab" value="a">A</en-tab><en-tab slot="tab" value="b">B</en-tab><en-tab-panel slot="panel" value="a">Alpha</en-tab-panel><en-tab-panel slot="panel" value="b">Beta</en-tab-panel>';document.body.append(parent);await parent.updateComplete;
  scope.register([definitions['en-tab']]);await Promise.all([...parent.children].map((el:any)=>el.updateComplete));await Promise.resolve();
  scope.register([definitions['en-tab-panel']]);await Promise.all([...parent.children].map((el:any)=>el.updateComplete));await Promise.resolve();await parent.updateComplete;
  const [a,b,pa,pb]=parent.children;
  return {selected:[a,b].map(el=>el.getAttribute('aria-selected')),stops:[a.tabIndex,b.tabIndex],hidden:[pa.hidden,pb.hidden],links:a.getAttribute('aria-controls')===pa.id && pb.getAttribute('aria-labelledby')===b.id && !!b.id,value:parent.value};
 });expect(result).toEqual({selected:['false','true'],stops:[-1,0],hidden:[true,false],links:true,value:'b'});
});

test('initializing null children before defining them wakes existing composite owners',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});if(scope.mode==='global')return null;
  scope.register([{...definitions['en-radio-group'],dependencies:[]}]);const parent=scope.createElement('en-radio-group');parent.value='late';
  const child=document.createElement('en-radio',{customElementRegistry:null});child.setAttribute('value','late');child.textContent='Later';parent.append(child);document.body.append(parent);await parent.updateComplete;
  const before=child.customElementRegistry===null;scope.initialize(child);await Promise.resolve();await Promise.resolve();
  scope.register([definitions['en-radio']]);await (child as any).updateComplete;await Promise.resolve();await parent.updateComplete;await (child as any).updateComplete;
  return {before,selected:(child as any).checked,tab:child.shadowRoot!.querySelector('input')!.tabIndex};
 });test.skip(result===null,'Native null association required');expect(result).toEqual({before:true,selected:true,tab:0});
});

test('definition waiters ignore disconnected and replaced children, then work after reconnect',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});scope.register([{...definitions['en-accordion'],dependencies:[]}]);
  const parent=scope.createElement('en-accordion');parent.value=['new'];parent.innerHTML='<en-accordion-item value="old">Old</en-accordion-item>';document.body.append(parent);await parent.updateComplete;
  const old=parent.firstElementChild;old.remove();parent.innerHTML='<en-accordion-item value="new">New</en-accordion-item>';parent.remove();scope.register([definitions['en-accordion-item']]);await Promise.resolve();
  const detached=!parent.isConnected;document.body.append(parent);await parent.updateComplete;await parent.firstElementChild.updateComplete;await Promise.resolve();
  return {detached,open:parent.firstElementChild.open,value:parent.value,oldDetached:!old.isConnected};
 });expect(result).toEqual({detached:true,open:true,value:['new'],oldDetached:true});
});

test('cloning preserves ownership while explicit imports select the destination scope',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,EnElement}= (window as any).ownershipTest;const a=createElementScope({document}),b=createElementScope({document});if(a.mode==='global')return null;
  class A extends EnElement{};class B extends EnElement{};a.register([{tagName:'phase2-version',elementClass:A}]);b.register([{tagName:'phase2-version',elementClass:B}]);
  const original=a.createElement('phase2-version'),clone=original.cloneNode(true);const template=document.createElement('template');template.innerHTML='<phase2-version></phase2-version>';
  const imported=b.creationScope.importNode(template.content,true).firstElementChild;const global=document.createElement('phase2-version'),container=b.createElement('div');container.append(global,original);document.body.append(container);
  return {clone:clone instanceof A,imported:imported instanceof B,moved:original instanceof A,global:global.customElementRegistry===customElements && !(global instanceof B)};
 });test.skip(result===null);expect(result).toEqual({clone:true,imported:true,moved:true,global:true});
});

test('same-origin document adoption preserves scoped factories, future imports and static styles',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});scope.register([definitions['en-toast-region']]);
  const region=scope.createElement('en-toast-region');document.body.append(region);await region.updateComplete;
  const root=region.shadowRoot;const before=getComputedStyle(region).display;
  const native=scope.mode==='scoped';
  const frame=document.createElement('iframe');document.body.append(frame);const other=frame.contentDocument!;other.body.append(region);await region.updateComplete;
  if(!native){let rejected=false;try{region.notify({message:'Requires destination definitions'});}catch{rejected=true;}return {fallback:rejected,styles:!!root.querySelector('style')||root.adoptedStyleSheets.length>0};}
  region.history=true;await region.updateComplete;const toast=region.notify({message:'Moved'});await region.updateComplete;await toast.updateComplete;
  const button=root.querySelector('en-button');await button.updateComplete;
  return {identity:region.shadowRoot===root,document:toast.ownerDocument===other,instance:toast instanceof scope.get('en-toast'),button:button instanceof scope.get('en-button'),display:frame.contentWindow!.getComputedStyle(region).display===before,styles:root.adoptedStyleSheets.length>0||!!root.querySelector('style')};
 });expect(errors).toEqual([]);expect(result).toEqual('fallback' in result ? {fallback:true,styles:true} : {identity:true,document:true,instance:true,button:true,display:true,styles:true});
});

test('unresolved definition promises do not retain removed owners',async({page,browserName})=>{
 test.skip(browserName!=='chromium','Explicit collection is a separate CDP diagnostic');
 await page.evaluate(async()=>{
  const {createElementScope,EnElement,ChildUpgrades}= (window as any).ownershipTest;const scope=createElementScope({document,registry:'global'});
  class Owner extends EnElement {upgrades=new ChildUpgrades(this,()=>{});}
  scope.register([{tagName:'phase2-retention-owner',elementClass:Owner}]);
  let owner:any=scope.createElement('phase2-retention-owner');document.body.append(owner);await owner.updateComplete;
  const child=document.createElement('phase2-never-defined');owner.append(child);owner.upgrades.watch([child]);(window as any).removedOwner=new WeakRef(owner);owner.remove();owner=null;
 });
 const session=await page.context().newCDPSession(page);await session.send('HeapProfiler.collectGarbage');await session.send('HeapProfiler.collectGarbage');
 expect(await page.evaluate(()=>!(window as any).removedOwner.deref())).toBe(true);
});

test('detached null editor targets bind after explicit initialization and release on replacement',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});if(scope.mode==='global')return null;
  scope.register([definitions['en-editor-trigger']]);
  class Editor extends HTMLElement {active=0;registerExtension(){this.active++;return()=>this.active--;}}
  const target=document.createElement('ownership-editor',{customElementRegistry:null}) as any;
  const trigger=scope.createElement('en-editor-trigger');trigger.editor=target;trigger.extension={id:'one',trigger:'@',label:'People',provide:()=>[]};document.body.append(trigger);await trigger.updateComplete;
  scope.initialize(target);await Promise.resolve();await Promise.resolve();scope.register([{tagName:'ownership-editor',elementClass:Editor}]);await Promise.resolve();await Promise.resolve();await trigger.updateComplete;
  const active=target.active;trigger.editor=undefined;await trigger.updateComplete;return {active,released:target.active,detached:!target.isConnected};
 });test.skip(result===null);expect(result).toEqual({active:1,released:0,detached:true});
});

test('repeated unresolved subscriptions share one registry promise and release owners',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,EnElement,ChildUpgrades}= (window as any).ownershipTest;const scope=createElementScope({document,registry:'global'});
  let waits=0,callbacks=0;const original=scope.registry.whenDefined.bind(scope.registry);scope.registry.whenDefined=(tag:string)=>{if(tag==='ownership-pending-child')waits++;return original(tag);};
  class Owner extends EnElement {upgrades=new ChildUpgrades(this,()=>{callbacks++;});}
  scope.register([{tagName:'ownership-repeat-owner',elementClass:Owner}]);
  for(let i=0;i<25;i++){const owner=scope.createElement('ownership-repeat-owner');document.body.append(owner);await owner.updateComplete;await Promise.resolve();const child=scope.createElement('ownership-pending-child');owner.append(child);owner.upgrades.watch([child]);owner.remove();}
  const before=callbacks;scope.register([{tagName:'ownership-pending-child',elementClass:class extends HTMLElement{}}]);await Promise.resolve();await Promise.resolve();return {waits,stale:callbacks-before};
 });expect(result).toEqual({waits:1,stale:0});
});

test('late toolbar controls and tree items acquire their navigation semantics',async({page})=>{
 await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});
  scope.register([{...definitions['en-toolbar'],dependencies:[]},{...definitions['en-tree'],dependencies:[]}]);
  const toolbar=scope.createElement('en-toolbar');toolbar.label='Tools';toolbar.innerHTML='<en-button>First</en-button><en-button>Second</en-button>';
  const tree=scope.createElement('en-tree');tree.label='Files';tree.innerHTML='<en-tree-item value="a" label="Alpha"></en-tree-item><en-tree-item value="b" label="Beta"></en-tree-item>';
  document.body.append(toolbar,tree);await Promise.all([toolbar.updateComplete,tree.updateComplete]);scope.register([definitions['en-button'],definitions['en-tree-item']]);
 });
 const first=page.getByRole('button',{name:'First',exact:true}),second=page.getByRole('button',{name:'Second',exact:true});await expect(first).toHaveAttribute('tabindex','0');await expect(second).toHaveAttribute('tabindex','-1');await first.focus();await first.press('ArrowRight');await expect(second).toBeFocused();
 const items=page.getByRole('treeitem');await expect(items).toHaveCount(2);await expect(items.nth(0)).toHaveAttribute('aria-setsize','2');await expect(items.nth(1)).toHaveAttribute('aria-posinset','2');
});

test('cross-document disconnect removes listeners from their installation document',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});scope.register([definitions['en-toast-region']]);
  const installed=new Set<any>();const add=document.addEventListener,remove=document.removeEventListener;
  document.addEventListener=function(type:any,listener:any,options:any){if(type==='visibilitychange')installed.add(listener);return add.call(this,type,listener,options);};
  document.removeEventListener=function(type:any,listener:any,options:any){if(type==='visibilitychange')installed.delete(listener);return remove.call(this,type,listener,options);};
  try{const region=scope.createElement('en-toast-region');document.body.append(region);await region.updateComplete;const toast=region.notify({message:'Move',priority:'off'});await region.updateComplete;await toast.updateComplete;const before=installed.size;const frame=document.createElement('iframe');document.body.append(frame);frame.contentDocument!.body.append(region);await region.updateComplete;region.remove();return {before,after:installed.size};}
  finally{document.addEventListener=add;document.removeEventListener=remove;}
 });expect(result.before).toBeGreaterThanOrEqual(2);expect(result.after).toBe(0);
});

test('carousel cancels stale connection work and releases the source document listener',async({page})=>{
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}= (window as any).ownershipTest;const scope=createElementScope({document});scope.register([definitions['en-carousel']]);
  const listeners=new Set<any>();let adds=0;const add=document.addEventListener,remove=document.removeEventListener;
  document.addEventListener=function(type:any,listener:any,options:any){if(type==='visibilitychange'){adds++;listeners.add(listener);}return add.call(this,type,listener,options);};
  document.removeEventListener=function(type:any,listener:any,options:any){if(type==='visibilitychange')listeners.delete(listener);return remove.call(this,type,listener,options);};
  try{const carousel=scope.createElement('en-carousel');carousel.innerHTML='<en-carousel-slide label="One">One</en-carousel-slide>';document.body.append(carousel);carousel.remove();document.body.append(carousel);await carousel.updateComplete;await Promise.resolve();const before=listeners.size;const installed=adds;
   const frame=document.createElement('iframe');document.body.append(frame);frame.contentDocument!.body.append(carousel);await carousel.updateComplete;await Promise.resolve();carousel.remove();return {before,installed,after:listeners.size};}
  finally{document.addEventListener=add;document.removeEventListener=remove;}
 });expect(result).toEqual({before:1,installed:1,after:0});
});

test('global adoption uses destination definitions for synchronous notify and late history templates', async ({page}) => {
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 // Load the fixture again in the receiving realm so its constructors genuinely
 // belong to that document instead of registering source-realm classes there.
 await page.evaluate(()=>{
  const frame=document.createElement('iframe');frame.id='global-adoption-destination';
  frame.src='/probes/scoped-registry/ownership.html';document.body.append(frame);
 });
 await page.waitForFunction(()=>Boolean(((document.querySelector('#global-adoption-destination') as HTMLIFrameElement)?.contentWindow as any)?.ownershipTest));
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}=(window as any).ownershipTest;
  const source=createElementScope({document,registry:'global'});source.register([definitions['en-toast-region']]);
  const frame=document.querySelector('#global-adoption-destination') as HTMLIFrameElement;
  const other=frame.contentDocument!;const destinationFixture=(frame.contentWindow as any).ownershipTest;
  const destination=destinationFixture.createElementScope({document:other,registry:'global'});
  destination.register([destinationFixture.definitions['en-toast-region']]);
  const sourceToast=source.get('en-toast'),destinationToast=destination.get('en-toast');
  const sourceButton=source.get('en-button'),destinationButton=destination.get('en-button');
  const region=source.createElement('en-toast-region');document.body.append(region);await region.updateComplete;
  const root=region.shadowRoot!;const beforeHistory=root.querySelectorAll('en-button').length;
  other.body.append(other.adoptNode(region));await region.updateComplete;
  const toast=region.notify({message:'Destination notification',duration:0,priority:'off'});
  // Capture these before awaiting anything: notify must return the already
  // constructed destination element synchronously, even for an adopted owner.
  const synchronous={
   api:typeof toast.dismiss==='function',
   constructor:toast.constructor===destinationToast,
   destinationInstance:toast instanceof destinationToast,
   sourceInstance:toast instanceof sourceToast,
   document:toast.ownerDocument===other,
  };
  await region.updateComplete;await toast.updateComplete;
  // This template was absent in the source. It exercises creationScope on a
  // fresh Lit clone, separately from the imperative notify factory above.
  region.history=true;await region.updateComplete;
  const button=root.querySelector('en-button');
  if(!button)throw new Error('Adopted history did not construct its en-button dependency.');
  await button.updateComplete;
  return {
   distinctConstructors:sourceToast!==destinationToast&&sourceButton!==destinationButton,
   beforeHistory,
   preservedOwner:region instanceof source.get('en-toast-region')&&region.shadowRoot===root,
   ownerDocument:region.ownerDocument===other,
   synchronous,
   inserted:toast.parentElement===region&&toast.isConnected,
   button:{
    constructor:button.constructor===destinationButton,
    destinationInstance:button instanceof destinationButton,
    sourceInstance:button instanceof sourceButton,
    document:button.ownerDocument===other,
   },
  };
 });
 expect(errors).toEqual([]);
 expect(result).toEqual({
  distinctConstructors:true,beforeHistory:0,preservedOwner:true,ownerDocument:true,
  synchronous:{api:true,constructor:true,destinationInstance:true,sourceInstance:false,document:true},
  inserted:true,
  button:{constructor:true,destinationInstance:true,sourceInstance:false,document:true},
 });
});

test('global adoption rejects a missing destination toast without inserting an inert or source element', async ({page}) => {
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const result=await page.evaluate(async()=>{
  const {createElementScope,definitions}=(window as any).ownershipTest;
  const source=createElementScope({document,registry:'global'});source.register([definitions['en-toast-region']]);
  const region=source.createElement('en-toast-region');document.body.append(region);await region.updateComplete;
  // The blank same-origin document deliberately has no definitions. A source
  // definition must never rescue this destination-owned synchronous factory.
  const frame=document.createElement('iframe');
  const loaded=new Promise<void>(resolve=>frame.addEventListener('load',()=>resolve(),{once:true}));
  frame.src='about:blank';document.body.append(frame);await loaded;
  const other=frame.contentDocument!;other.body.append(other.adoptNode(region));await region.updateComplete;
  const before=region.childElementCount;let returned=false,errorName='',message='';
  try{region.notify({message:'Missing destination toast',duration:0,priority:'off'});returned=true;}
  catch(error){errorName=(error as Error).name;message=(error as Error).message;}
  await Promise.resolve();await region.updateComplete;
  return {
   sourceRegistered:typeof source.get('en-toast')==='function',
   destinationMissing:frame.contentWindow!.customElements.get('en-toast')===undefined,
   ownerDocument:region.ownerDocument===other,
   returned,errorName,message,before,after:region.childElementCount,
   toasts:region.querySelectorAll('en-toast').length,
  };
 });
 expect(errors).toEqual([]);
 expect(result).toEqual({
  sourceRegistered:true,destinationMissing:true,ownerDocument:true,returned:false,
  errorName:'Error',message:'The owning registry must define en-toast before synchronous creation.',
  before:0,after:0,toasts:0,
 });
});
