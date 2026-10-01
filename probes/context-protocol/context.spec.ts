import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.goto('/probes/context-protocol/fixture.html'); await page.waitForFunction(() => (window as any).ready); });

test('late editor definition binds once; explicit targets outrank context', async ({ page }) => {
  await page.evaluate(async () => {
    const a=(window as any).api;
    document.querySelector('main')!.innerHTML='<test-scope><test-editor id="contextual"></test-editor><en-editor-toolbar for="late"></en-editor-toolbar><late-editor id="late"></late-editor><en-editor-trigger for="late"></en-editor-trigger></test-scope>';
    const scope=document.querySelector('test-scope')!;
    new a.ContextProvider(scope,{context:a.richEditorCommandContext,initialValue:document.querySelector('#contextual')});
    const trigger:any=document.querySelector('en-editor-trigger');trigger.extension={id:'one',trigger:'@',label:'People',provide:()=>[]};
    await (document.querySelector('en-editor-toolbar') as any).updateComplete;
  });
  await expect(page.locator('en-editor-toolbar en-button').first()).toHaveAttribute('disabled','');
  await page.evaluate(()=>customElements.define('late-editor',class extends (window as any).api.CommandHost{}));
  await expect(page.locator('en-editor-toolbar en-button').first()).not.toHaveAttribute('disabled','');
  await page.locator('en-editor-toolbar en-button').first().click();
  expect(await page.evaluate(()=>({calls:(document.querySelector('#late') as any).calls,active:(document.querySelector('#late') as any).active}))).toEqual({calls:['bold'],active:1});
  await page.evaluate(()=>{(document.querySelector('en-editor-toolbar') as any).for='missing';(document.querySelector('en-editor-trigger') as any).for='missing';});
  await expect(page.locator('en-editor-toolbar en-button').first()).toHaveAttribute('disabled','');
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('#late') as any).active)).toBe(0);
});

test('late provider replay crosses shadow roots and responds to replacement', async ({ page }) => {
  await page.evaluate(async()=>{
    const a=(window as any).api;
    const scope=document.createElement('test-scope');const bridge=document.createElement('div');bridge.attachShadow({mode:'open'}).innerHTML='<en-editor-toolbar></en-editor-toolbar><en-editor-trigger></en-editor-trigger>';scope.append(bridge);document.querySelector('main')!.append(scope);
    const editor:any=document.createElement('test-editor');scope.append(editor);
    (window as any).state={scope,bridge,editor};
    (bridge.shadowRoot!.querySelector('en-editor-trigger') as any).extension={id:'one',trigger:'@',label:'People',provide:()=>[]};
    await (bridge.shadowRoot!.querySelector('en-editor-toolbar') as any).updateComplete;
    (window as any).state.provider=new a.ProtocolProvider(scope,{context:a.richEditorCommandContext,initialValue:editor});
    (window as any).state.extensions=new a.ContextProvider(scope,{context:a.editorExtensionContext,initialValue:editor});
  });
  await expect(page.locator('en-editor-toolbar en-button').first()).not.toHaveAttribute('disabled','');
  await expect.poll(()=>page.evaluate(()=>(window as any).state.editor.active)).toBe(1);
  await page.evaluate(()=>{const s=(window as any).state; s.next=document.createElement('test-editor');s.scope.append(s.next);s.provider.setValue(s.next);s.extensions.setValue(s.next);});
  await page.locator('en-editor-toolbar en-button').first().click();
  expect(await page.evaluate(()=>{const s=(window as any).state;return [s.editor.active,s.next.active,s.next.calls]})).toEqual([0,1,['bold']]);
  await page.evaluate(()=>{const s=(window as any).state;s.bridge.remove();});
  expect(await page.evaluate(()=>(window as any).state.next.active)).toBe(0);
});

test('reparented consumer clears its old provider and stale callbacks', async ({ page }) => {
  const result=await page.evaluate(async()=>{
    const a=(window as any).api;const key=a.createContext('test-lifecycle');let saved:any;let releases=0;
    class Consumer extends a.LitElement {context=new a.ScopedContext(this,key);}
    customElements.define('test-consumer',Consumer);
    const first=document.createElement('test-scope');const second=document.createElement('test-scope');document.querySelector('main')!.append(first,second);
    first.addEventListener('context-request',(event:any)=>{if(event.context!==key)return;event.stopImmediatePropagation();saved=event.callback;event.callback('first',()=>releases++);});
    const consumer:any=document.createElement('test-consumer');first.append(consumer);await consumer.updateComplete;
    const before=consumer.context.value;second.append(consumer);saved('stale',()=>releases++);await consumer.updateComplete;
    return {before,after:consumer.context.value??null,releases};
  });
  expect(result).toEqual({before:'first',after:null,releases:2});
});

test('message defaults merge local fields and update nested providers', async ({ page }) => {
  await page.evaluate(()=>{
    const a=(window as any).api;
    document.querySelector('main')!.innerHTML='<test-scope><en-editor-toolbar></en-editor-toolbar><test-scope id="inner"><en-editor-toolbar id="nested"></en-editor-toolbar></test-scope><en-color-picker></en-color-picker></test-scope>';
    const outer=document.querySelector('test-scope')!;
    const provider=new a.ContextProvider(outer,{context:a.editorMessagesContext,initialValue:{commands:{bold:'Gras',italic:'Italique'}}});
    (window as any).messagesProvider=provider;
    (outer.querySelector('en-editor-toolbar') as any).messages={commands:{bold:'Local'}};
    new a.ContextProvider(document.querySelector('#inner'),{context:a.editorMessagesContext,initialValue:{commands:{bold:'Innen'}}});
    new a.ContextProvider(outer,{context:a.colorMessagesContext,initialValue:{hexGuidance:'Couleur incorrecte'}});
  });
  await expect(page.locator('en-editor-toolbar').first().getByText('Local',{exact:true})).toBeVisible();
  await expect(page.locator('en-editor-toolbar').first().getByText('Italique',{exact:true})).toBeVisible();
  await expect(page.locator('#nested').getByText('Innen',{exact:true})).toBeVisible();
  await page.evaluate(()=>(window as any).messagesProvider.setValue({commands:{bold:'Changed',italic:'Changed italic'}}));
  await expect(page.locator('en-editor-toolbar').first().getByText('Local',{exact:true})).toBeVisible();
  await expect(page.locator('en-editor-toolbar').first().getByText('Changed italic',{exact:true})).toBeVisible();
  await expect(page.locator('#nested').getByText('Innen',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>(document.querySelector('en-color-picker') as any).shadowRoot.querySelector('#hex').error)).toBe('');
});

test('carousel presentation follows admitted membership and clears on removal', async ({ page }) => {
  await page.evaluate(()=>{document.querySelector('main')!.innerHTML='<en-carousel position-label="First {current}/{total}"><en-carousel-slide id="move" label="A">One</en-carousel-slide><en-carousel-slide label="B">Two</en-carousel-slide><div><en-carousel-slide id="unowned">Not admitted</en-carousel-slide></div></en-carousel><en-carousel id="second" position-label="Second {current}/{total}"><en-carousel-slide>Other</en-carousel-slide></en-carousel>';});
  await expect(page.locator('#move [role="group"]')).toHaveAttribute('aria-label','A, First 1/2');
  await expect(page.locator('#unowned [role="group"]')).not.toHaveAttribute('aria-label',/First/);
  await page.evaluate(()=>document.querySelector('#second')!.append(document.querySelector('#move')!));
  await expect(page.locator('#move [role="group"]')).toHaveAttribute('aria-label','A, Second 2/2');
  await page.evaluate(()=>document.querySelector('main')!.append(document.querySelector('#move')!));
  await expect(page.locator('#move [role="group"]')).toHaveAttribute('aria-label','A');
  await expect(page.locator('#move [role="group"]')).not.toHaveAttribute('inert');
});

test('actual rich editor supplies command and extension capabilities', async ({ page }) => {
  await page.evaluate(()=>{
    document.querySelector('main')!.innerHTML='<en-rich-text-editor><en-editor-trigger></en-editor-trigger></en-rich-text-editor>';
    const trigger:any=document.querySelector('en-editor-trigger'); trigger.extension={id:'person',trigger:'@',label:'People',provide:()=>[]};
    const editor:any=document.querySelector('en-rich-text-editor');
    const a=(window as any).api;const child=document.createElement('span');editor.append(child);
    (window as any).commandResult=new Promise(resolve=>child.dispatchEvent(new (class extends Event{context=a.richEditorCommandContext;callback=resolve; constructor(){super('context-request',{bubbles:true,composed:true})}})()));
  });
  expect(await page.evaluate(async()=>await (window as any).commandResult===document.querySelector('en-rich-text-editor'))).toBe(true);
});

test('owning registry is used for explicit targets and stale definitions cannot rebind', async ({ page }) => {
  await page.evaluate(async()=>{
    const a=(window as any).api; const registry={get:()=>undefined,upgrade:()=>{},whenDefined:()=>new Promise(resolve=>(window as any).defineScoped=resolve)};
    const editor:any=document.createElement('scoped-editor');editor.id='scoped';Object.defineProperty(editor,'customElementRegistry',{value:registry});
    const toolbar:any=document.createElement('en-editor-toolbar');toolbar.editor=editor;
    document.querySelector('main')!.append(editor,toolbar);await toolbar.updateComplete;
    (window as any).scoped={editor,toolbar};
  });
  expect(await page.evaluate(()=>typeof (window as any).defineScoped)).toBe('function');
  await page.evaluate(()=>{const s=(window as any).scoped; const a=(window as any).api;const implementation=new a.CommandHost();
    for(const key of Object.keys(implementation)) s.editor[key]=implementation[key];
    for(const key of Object.getOwnPropertyNames(a.CommandHost.prototype)) if(key!=='constructor')s.editor[key]=a.CommandHost.prototype[key];
    (window as any).defineScoped();
  });
  await expect(page.locator('en-editor-toolbar en-button').first()).not.toHaveAttribute('disabled','');
  await page.evaluate(()=>{const s=(window as any).scoped;s.toolbar.editor={};});
  await expect(page.locator('en-editor-toolbar en-button').first()).toHaveAttribute('disabled','');
});

test('null owning registry does not fall back to the document registry', async ({ page }) => {
  const result=await page.evaluate(async()=>{
    const target=document.createElement('uninitialized-editor');Object.defineProperty(target,'customElementRegistry',{value:null});
    const toolbar:any=document.createElement('en-editor-toolbar');toolbar.editor=target;document.querySelector('main')!.append(target,toolbar);
    await toolbar.updateComplete;return !toolbar.shadowRoot.querySelector('en-button:not([disabled])');
  });
  expect(result).toBe(true);
});

test('editor-trigger definition has no token-editor registration side effect', async ({ page }) => {
  await page.goto('/probes/context-protocol/neutral.html');
  await page.waitForFunction(()=>(window as any).ready);
  expect(await page.evaluate(()=>!!customElements.get('en-editor-trigger')&&!customElements.get('en-token-editor'))).toBe(true);
});

test('native scoped registry upgrades the associated editor when supported', async ({ page }) => {
  const supported=await page.evaluate(()=>{
    try { const registry=new CustomElementRegistry();const root=document.createElement('div').attachShadow({mode:'open',customElementRegistry:registry} as any);return (root as any).customElementRegistry===registry; }catch{return false;}
  });
  test.skip(!supported,'Browser does not implement native scoped custom-element registries. Registry selection is covered by the portable seam test.');
  await page.evaluate(()=>{
    const a=(window as any).api;const registry=new CustomElementRegistry();registry.define('en-editor-trigger',class extends a.EnEditorTrigger{});
    const wrapper=document.createElement('div');const root=wrapper.attachShadow({mode:'open',customElementRegistry:registry} as any);
    root.innerHTML='<scoped-native-editor id="editor"></scoped-native-editor><en-editor-trigger for="editor"></en-editor-trigger>';
    document.querySelector('main')!.append(wrapper);
    (root.querySelector('en-editor-trigger') as any).extension={id:'one',trigger:'@',label:'People',provide:()=>[]};
    (window as any).nativeScope={registry,root};
  });
  await page.evaluate(()=>{const a=(window as any).api;(window as any).nativeScope.registry.define('scoped-native-editor',class extends a.CommandHost{});});
  await expect.poll(()=>page.evaluate(()=>(window as any).nativeScope.root.querySelector('#editor').active)).toBe(1);
});

test('changed explicit target invalidates a pending definition', async ({ page }) => {
  await page.evaluate(async()=>{
    const a=(window as any).api;
    document.querySelector('main')!.innerHTML='<en-editor-trigger for="old"></en-editor-trigger><pending-editor id="old"></pending-editor><test-editor id="next"></test-editor>';
    const trigger:any=document.querySelector('en-editor-trigger');trigger.extension={id:'one',trigger:'@',label:'People',provide:()=>[]};await trigger.updateComplete;
    trigger.for='next';customElements.define('pending-editor',class extends a.CommandHost{});
  });
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('#next') as any).active)).toBe(1);
  expect(await page.evaluate(()=>(document.querySelector('#old') as any).registrations)).toBe(0);
});

test('provider immediately stops a fulfilled request and interoperates with Lit consumers', async ({ page }) => {
  expect(await page.evaluate(async()=>{
    const a=(window as any).api;const key=a.createContext('test-provider-stop');const scope=document.createElement('test-scope');let extraCalls=0;
    new a.ProtocolProvider(scope,{context:key,initialValue:'provided'});
    scope.addEventListener('context-request',()=>extraCalls++);
    class Consumer extends a.LitElement {consumer=new a.ContextConsumer(this,{context:key,subscribe:true});}
    customElements.define('test-lit-consumer',Consumer);const child:any=document.createElement('test-lit-consumer');scope.append(child);document.querySelector('main')!.append(scope);await child.updateComplete;
    return {value:child.consumer.value,extraCalls};
  })).toEqual({value:'provided',extraCalls:0});
});

test('tree hydration retains the server drag handle and disabling reorder removes it', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/context-tree');await page.waitForFunction(()=>typeof (window as any).hydrateFixture==='function');
  await expect(page.locator('[part="drag-handle"]')).toHaveCount(1);
  await expect(page.locator('[aria-keyshortcuts="Alt+M"]')).toHaveCount(2);
  await page.evaluate(()=>{(window as any).serverHandle=document.querySelector('en-tree-item')!.shadowRoot!.querySelector('[part="drag-handle"]');});
  await page.evaluate(()=>(window as any).hydrateFixture());
  expect(await page.evaluate(()=>(window as any).serverHandle===document.querySelector('en-tree-item')!.shadowRoot!.querySelector('[part="drag-handle"]'))).toBe(true);
  await page.evaluate(()=>{(document.querySelector('en-tree') as any).reorderable=false;});
  await expect(page.locator('[part="drag-handle"]')).toHaveCount(0);
  await expect(page.locator('[aria-keyshortcuts="Alt+M"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('color messages inherit while local picker fields retain precedence', async ({ page }) => {
  await page.evaluate(()=>{
    const a=(window as any).api;const scope=document.createElement('test-scope');scope.innerHTML='<en-color-picker></en-color-picker>';document.querySelector('main')!.append(scope);
    const picker:any=scope.querySelector('en-color-picker');picker.value='color(display-p3 1 0 0)';
    (window as any).colorProvider=new a.ProtocolProvider(scope,{context:a.colorMessagesContext,initialValue:{approximationLabel:'Approximation FR',readOnlyApproximation:'Lecture seule'}});
  });
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('en-color-picker') as any).shadowRoot.querySelector('#hex')?.label)).toContain('Approximation FR');
  await page.evaluate(()=>{(document.querySelector('en-color-picker') as any).messages={approximationLabel:'Local'};(window as any).colorProvider.setValue({approximationLabel:'Updated',readOnlyApproximation:'Updated guidance'});});
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('en-color-picker') as any).shadowRoot.querySelector('#hex')?.label)).toContain('Local');
  await expect.poll(()=>page.evaluate(()=>(document.querySelector('en-color-picker') as any).shadowRoot.querySelector('#hex')?.description)).toBe('Updated guidance');
});

test('late slide presentation callbacks cannot revive a removed service', async ({ page }) => {
  await page.evaluate(()=>{
    const a=(window as any).api;const scope=document.createElement('test-scope');scope.innerHTML='<en-carousel-slide label="Sample"></en-carousel-slide>';
    new a.ProtocolProvider(scope,{context:a.carouselContext,initialValue:{subscribe:(_slide:any,receive:any)=>{(window as any).lateSlide=receive;receive({position:'1/2',description:'slide',visible:false});return()=>{};}}});
    document.querySelector('main')!.append(scope);
  });
  await expect(page.locator('en-carousel-slide [role="group"]')).toHaveAttribute('inert','');
  await page.evaluate(()=>{const slide=document.querySelector('en-carousel-slide')!;document.querySelector('main')!.append(slide);(window as any).lateSlide({position:'stale',description:'stale',visible:false});});
  await expect(page.locator('en-carousel-slide [role="group"]')).toHaveAttribute('aria-label','Sample');
  await expect(page.locator('en-carousel-slide [role="group"]')).not.toHaveAttribute('inert');
});
