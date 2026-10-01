import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';
const packed=JSON.parse(readFileSync(resolve(process.env.EN_CONSUMER_CONTRACTS_OUT ?? 'artifacts/scoped-followup-consumer-contracts','packed.json'),'utf8'));
const startupFiles=new Set(packed.production.startup.entry.files.map((p:string)=>basename(p)));
import type {} from './entry.js';
import type {} from './ssr-entry.js';

async function open(page: import('@playwright/test').Page, path = '/') {
  await page.goto(path); await page.waitForFunction(() => !!window.consumer);
}
test.afterEach(async ({browser, browserName}, info) => {
  info.annotations.push({type:'tested-engine',description:`${browserName} ${browser.version()}; automated desktop, not retail Safari or physical-device review`});
});

for (const mode of ['auto','global']) test(`${mode}: selective imports register nothing, ensure owns the complete static closure`, async ({page}) => {
  const requests: string[]=[]; page.on('request', r=>requests.push(r.url()));
  await open(page, mode==='global'?'/?global':'/');
  expect(requests.filter(x=>x.endsWith('.js')).every(x=>startupFiles.has(basename(new URL(x).pathname)))).toBe(true);
  const result = await page.evaluate(async mode => {
    const c=window.consumer, scope=c.createElementScope({document,registry:mode as 'auto'|'global'});
    const loader=c.createDefinitionLoader(scope.registry,c.loaders);
    let unknown='';try{await loader.load(['en-not-allowed']);}catch(e){unknown=(e as {stage:string}).stage;}
    const outside=document.createElement('en-toast');document.body.append(outside);
    const definitions=await loader.load(['en-toast-region']);
    const before=['en-toast-region','en-toast'].map(t=>scope.get(t)===undefined && customElements.get(t)===undefined);
    await loader.ensure(['en-toast-region']);
    const region=scope.createElement('en-toast-region') as HTMLElement & {notify(value:unknown):HTMLElement};document.body.append(region);
    const toast=region.notify({message:'Ready'});
    return {unknown,before,count:definitions.length,dependency:toast instanceof scope.get('en-toast')!,mode:scope.mode,outside:outside.matches(':defined'),global:!!customElements.get('en-toast')};
  },mode);
  expect(result).toMatchObject({unknown:'lookup',before:[true,true],count:1,dependency:true});
  test.info().annotations.push({type:'registry-mode',description:result.mode});
  expect(result.global).toBe(result.mode==='global');
  expect(result.outside).toBe(result.mode==='global');
});

test('creationScope works in ordinary and shadow containers; moves retain authored-child ownership', async ({page})=>{
  await open(page);
  expect(await page.evaluate(async()=>{
    const c=window.consumer;
    const a=await c.mountCards(document.body), b=await c.mountCards(document.body,true);
    const association=a.card.customElementRegistry;
    const cloned=a.card.cloneNode(true) as HTMLElement;
    const template=document.createElement('template');template.innerHTML='<en-card></en-card>';
    const imported=b.scope.creationScope.importNode(template.content,true).firstElementChild!;
    const owner=b.root.querySelector('en-card')!;
    c.moveCard(a.card, owner); // Authored light child stays associated with A, even inside B.
    let conflict=false;
    try{b.scope.attachShadow((b.root as ShadowRoot).host,{mode:'open',customElementRegistry:new CustomElementRegistry()});}catch{conflict=true;}
    return {clone:cloned.customElementRegistry===association,imported:imported instanceof b.scope.get('en-card')!,mode:a.scope.mode,light:a.card.customElementRegistry===association,shadow:!!b.card.shadowRoot,lit:b.card instanceof b.scope.get('en-card')!,conflict};
  })).toMatchObject({clone:true,imported:true,light:true,shadow:true,lit:true,conflict:true});
});

test('automatic fallback uses the actual owner document after an unsupported native probe', async ({page})=>{
  await open(page);
  expect(await page.evaluate(()=>{
    const iframe=document.createElement('iframe');document.body.append(iframe);
    const doc=iframe.contentDocument!, realm=iframe.contentWindow as Window & typeof globalThis;
    // Exercise automatic fallback in another realm, even in engines that support native scopes.
    Object.defineProperty(realm,'CustomElementRegistry',{configurable:true,value:class {constructor(){throw Error('unsupported')}}});
    const scope=window.consumer.createElementScope({document:doc});
    class Foreign extends realm.HTMLElement {}
    scope.register([{tagName:'test-owner-only',elementClass:Foreign}]);
    const node=scope.createElement('test-owner-only');
    return {mode:scope.mode,owner:scope.registry===realm.customElements,ambient:customElements.get('test-owner-only')===undefined,created:node instanceof Foreign,document:node.ownerDocument===doc};
  })).toEqual({mode:'global',owner:true,ambient:true,created:true,document:true});
});

test('native only: shared groups upgrade together, independent groups and null shadow islands do not', async ({page})=>{
  await open(page);
  test.skip(await page.evaluate(()=>!window.consumer.elementScopeCapabilities(document).native),'Native registry association required; fallback cannot supply version isolation or connected dormancy.');
  expect(await page.evaluate(async()=>{
    const c=window.consumer, a=c.createElementScope({document}), b=c.createElementScope({document});
    const first=a.createElement('en-card'), shared=a.createElement('en-card'), independent=b.createElement('en-card');document.body.append(first,shared,independent);
    await c.createDefinitionLoader(a.registry,c.loaders).ensure(['en-card']);
    const grouped=[first,shared,independent].map(x=>x.matches(':defined'));
    // A global definition cannot fill a missing scoped entry; moving cannot rebind it.
    class GlobalOnly extends HTMLElement {} customElements.define('test-global-only',GlobalOnly);
    const missing=a.createElement('test-global-only');document.body.append(missing);
    const globalNode=document.createElement('test-global-only');first.append(globalNode);
    const island1=document.createElement('section',{customElementRegistry:null}),island2=document.createElement('section',{customElementRegistry:null});
    island1.innerHTML='<en-card></en-card><div></div>';island2.innerHTML='<en-card></en-card>';
    const nested=island1.querySelector('div')!.attachShadow({mode:'open',customElementRegistry:null});nested.innerHTML='<en-card></en-card>';
    document.body.append(island1,island2);a.initialize(island1);
    const before=[island1.querySelector('en-card')!,nested.querySelector('en-card')!,island2.querySelector('en-card')!].map(x=>x.matches(':defined'));
    a.initialize(nested);a.upgrade(nested);
    // Same tag, independent native version: no constructor collision across registries.
    class OtherCard extends HTMLElement {} b.register([{tagName:'en-card',elementClass:OtherCard}]);
    let conflict=false;try{b.register([{tagName:'test-clean',elementClass:class extends HTMLElement{}},{tagName:'en-card',elementClass:class extends HTMLElement{}}]);}catch{conflict=true;}
    return {grouped,before,nested:nested.querySelector('en-card')!.matches(':defined'),globalMissing:!missing.matches(':defined'),moved:globalNode instanceof GlobalOnly,version:independent instanceof OtherCard,conflict,preflight:!b.get('test-clean')};
  })).toEqual({grouped:[true,true,false],before:[true,false,false],nested:true,globalMissing:true,moved:true,version:true,conflict:true,preflight:true});
});

for(const mode of ['auto','global']) test(`${mode}: cancel readiness, retry keeps nodes; dispose pending work never calls ready`,async({page})=>{
  await open(page, mode==='global'?'/?global':'/');
  expect(await page.evaluate(async mode=>{
    const c=window.consumer, scope=c.createElementScope({document,registry:mode as 'auto'|'global'});
    let release!:()=>void, started!:()=>void;
    const entered=new Promise<void>(r=>started=r),gate=new Promise<void>(r=>release=r);
    const {root,activation}=c.optionalCard(scope,async(_,signal)=>{started();await gate;signal.throwIfAborted();});document.body.append(root);
    const pending=activation.activate(),same=activation.activate()===pending;
    const result=pending.then(()=>'',e=>e.name);await entered;
    await scope.whenDefined('en-card'); // resolves while application readiness remains blocked
    const readiness=activation.state;const card=root.querySelector('en-card');activation.cancel();
    const canceled=await result;release();await activation.activate();
    const retained=root.querySelector('en-card')===card;
    activation.dispose();const kept=root.isConnected;
    let laterReady=false, finish!:()=>void;
    const held=new Promise<void>(r=>finish=r);
    const other=c.createElementScope({document,registry:mode as 'auto'|'global'});
    const empty=other.mode==='scoped'?document.createElement('section',{customElementRegistry:null}):document.createElement('section');document.body.append(empty);
    const template=document.createElement('template');template.innerHTML='<en-card></en-card>';if(other.mode==='scoped')empty.innerHTML=template.innerHTML;
    const delayed=c.createElementActivation({scope:other,root:empty,policy:'dormant',tags:['en-card'],loaders:{'en-card':async()=>{await held;return c.loaders['en-card']();}},template:other.mode==='global'?template:undefined,ready:()=>{laterReady=true;}});
    const p=delayed.activate().then(()=>'',e=>e.name);delayed.dispose();const disposed=await p;finish();await held;await Promise.resolve();
    return {same,readiness,canceled,retained,kept,disposed,state:delayed.state,laterReady};
  },mode)).toEqual({same:true,readiness:'activating',canceled:'AbortError',retained:true,kept:true,disposed:'AbortError',state:'disposed',laterReady:false});
});

test('native controls, localized status, explicit eager rollback and report return link',async({page})=>{
  await open(page,'/?global&progress-report');
  await expect(page.locator('#mode')).toHaveText('Owner-document global registry');
  const input=page.getByRole('textbox',{name:'Essential draft'});await input.fill('My edit');
  await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Optional details ready.');
  await expect(input).toHaveValue('My edit');
  // Synthetic lifetime check only; not evidence of actual browser BFCache restoration.
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Optional details ready.');
  await expect(page.getByRole('button',{name:'Load optional details'})).toBeFocused();
  await expect(page.locator('#report')).toHaveAttribute('href','http://127.0.0.1:4177');
  await page.getByRole('link',{name:'Use eager delivery on reload'}).click();
  await expect(page.getByRole('status')).toHaveText('Optional details ready.');
  expect(new URL(page.url()).searchParams.has('progress-report')).toBe(true);
  await page.goto('/');await expect(page.locator('#report')).toHaveCount(0);
});

for(const delivery of ['shadow','global']) test(`${delivery}: packed SSR preserves dirty native input identity, selection and reset default`, async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/ssr-${delivery}.html`);await page.waitForFunction(()=>!!window.hydration);
  const input=page.getByRole('textbox',{name:'Project',exact:true});await input.fill('Edited before hydration');
  await input.evaluate((node:HTMLInputElement)=>{node.setSelectionRange(2,7);(window as any).originalInput=node;});
  expect(await page.evaluate(()=>{try{window.hydration.duplicate();return false;}catch{return true;}})).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  await page.evaluate(()=>window.hydration.island.load());
  expect(await page.evaluate(()=>window.hydration.options.root.querySelector('en-text-field')!.matches(':defined'))).toBe(false);
  await page.evaluate(()=>window.hydration.island.activate());
  await expect(input).toHaveValue('Edited before hydration');await expect(input).toBeFocused();
  expect(await input.evaluate((node:HTMLInputElement)=>({same:node===(window as any).originalInput,selection:[node.selectionStart,node.selectionEnd],default:node.defaultValue}))).toEqual({same:true,selection:[2,7],default:'Initial'});
  expect(await page.evaluate(()=>new FormData(window.hydration.options.root.querySelector('form')!).get('project'))).toBe('Edited before hydration');
  await page.evaluate(()=>window.hydration.options.root.querySelector('form')!.reset());await expect(input).toHaveValue('Initial');
  expect(errors).toEqual([]);
});

test('server native input is usable without JavaScript',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});try{const page=await context.newPage();await page.goto('http://127.0.0.1:4257/ssr-shadow.html');const input=page.getByRole('textbox',{name:'Project',exact:true});await expect(input).toHaveValue('Initial');await input.fill('No JS edit');await expect(input).toHaveValue('No JS edit');}finally{await context.close();}
});


test('delayed real optional chunk: Escape cancels intent and keeps essential draft',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
  await page.route('**/chunks/card-*.js',async route=>{await gate;await route.continue();});
  await open(page,'/?global');const input=page.getByRole('textbox',{name:'Essential draft'});
  await input.fill('Keep through cancellation');
  await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Loading optional details.');
  await page.keyboard.press('Escape');await expect(page.getByRole('status')).toHaveText('Optional details canceled.');
  release();await input.focus();
  await expect(input).toHaveValue('Keep through cancellation');
  await expect(page.locator('#optional en-card')).toHaveCount(0);
  // A subsequent explicit intent may reuse completed code; it must still materialize once.
  await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Optional details ready.');
  await expect(page.locator('#optional en-card')).toHaveCount(1);
});

test('failed production chunk leaves native editing and error status available',async({page})=>{
  await page.route('**/chunks/card-*.js',route=>route.abort());
  await open(page,'/?global');const input=page.getByRole('textbox',{name:'Essential draft'});
  await input.fill('Survives failure');await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Optional details unavailable. Retry or use eager delivery.');
  await expect(input).toHaveValue('Survives failure');await input.fill('Still editable');
  await expect(input).toHaveValue('Still editable');
  await expect(page.locator('#optional en-card')).toHaveCount(0);
  // No browser-cache recovery promise: retry may fail again at the same module URL.
  await page.getByRole('button',{name:'Load optional details'}).press('Enter');
  await expect(page.getByRole('status')).toHaveText('Optional details unavailable. Retry or use eager delivery.');
});
