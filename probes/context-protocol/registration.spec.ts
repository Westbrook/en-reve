import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => { await page.goto('/probes/context-protocol/registration.html'); });

test('class, definition and catalog imports have no registration effects', async ({page}) => {
  const result = await page.evaluate(async () => {
    await import('/packages/elements/src/index.ts');
    const {colorPickerDefinition} = await import('/packages/elements/src/definitions/color-picker.ts');
    const {definitions, registerAll} = await import('/packages/elements/src/catalog.ts');
    const registeredOnImport = definitions.filter(d => customElements.get(d.tagName)).map(d => d.tagName);
    const registrations: string[] = [];
    const classes = new Map<string, CustomElementConstructor>();
    const registry = {get: (name: string) => classes.get(name), define: (name: string, ctor: CustomElementConstructor) => {classes.set(name, ctor); registrations.push(name);}};
    registerAll(registry as CustomElementRegistry);
    registerAll(registry as CustomElementRegistry);
    const canonical = definitions.find(d => d.tagName === 'en-color-picker') === colorPickerDefinition;
    const precedes = (parent: any): boolean => (parent.dependencies ?? []).every((child: any) => registrations.indexOf(child.tagName) < registrations.indexOf(parent.tagName) && precedes(child));
    const writes: string[] = [];
    const conflictRegistry = {get: (name: string) => name === 'en-color-picker' ? class extends HTMLElement {} : undefined, define: (name: string) => writes.push(name)};
    let conflict = false;
    try {registerAll(conflictRegistry as unknown as CustomElementRegistry);} catch {conflict = true;}
    return {expectedCount: definitions.length, registeredOnImport, count: registrations.length, unique: classes.size, canonical, dependencyOrder: definitions.every(precedes), conflict, writes};
  });
  expect(result.expectedCount).toBeGreaterThan(0);
  expect(result.count).toBe(result.expectedCount);
  expect(result.unique).toBe(result.expectedCount);
  expect(result).toMatchObject({registeredOnImport: [], canonical:true, dependencyOrder:true, conflict:true, writes:[]});
});

test('selective color registration defines only its transitive dependency closure', async ({page}) => {
  const result = await page.evaluate(async () => {
    await import('/packages/elements/src/define/color-picker.ts');
    const {definitions} = await import('/packages/elements/src/catalog.ts');
    const picker: any = document.createElement('en-color-picker'); picker.plane = true; document.querySelector('main')!.append(picker); await picker.updateComplete;
    return {registered: definitions.filter(d => customElements.get(d.tagName)).map(d => d.tagName).sort(), rendered: !!picker.shadowRoot?.querySelector('en-color-plane')};
  });
  expect(result).toEqual({registered:['en-button','en-color-picker','en-color-plane','en-color-slider','en-select','en-select-option','en-switch','en-text-field'],rendered:true});
});

test('authored menu children and neutral editor implementations remain explicit', async ({page}) => {
  expect(await page.evaluate(async () => {
    await import('/packages/elements/src/define/menu.ts');
    await import('/packages/elements/src/define/editor-trigger.ts');
    const before = {menu:!!customElements.get('en-menu'), item:!!customElements.get('en-menu-item'), trigger:!!customElements.get('en-editor-trigger'), token:!!customElements.get('en-token-editor'), rich:!!customElements.get('en-rich-text-editor')};
    await import('/packages/elements/src/define/menu-item.ts');
    return {before, itemAfter:!!customElements.get('en-menu-item')};
  })).toEqual({before:{menu:true,item:false,trigger:true,token:false,rich:false},itemAfter:true});
});

test('canonical definitions register in a native scoped registry without touching the document', async ({page}) => {
  const supported=await page.evaluate(()=>{try {const registry=new CustomElementRegistry();return (document.createElement('div').attachShadow({mode:'open',customElementRegistry:registry} as any) as any).customElementRegistry===registry;}catch{return false;}});
  test.skip(!supported,'Native scoped custom-element registries are unavailable in this engine.');
  expect(await page.evaluate(async () => {
    const {registerAll, definitions}=await import('/packages/elements/src/catalog.ts');
    const registry=new CustomElementRegistry(); registerAll(registry); registerAll(registry);
    const host=document.createElement('div');const root=host.attachShadow({mode:'open',customElementRegistry:registry} as any);root.innerHTML='<en-button>Scoped</en-button>';document.querySelector('main')!.append(host);
    const button:any=root.querySelector('en-button');await button.updateComplete;
    return {documentUntouched: definitions.every(d=>!customElements.get(d.tagName)), allDefined:definitions.every(d=>registry.get(d.tagName)===d.elementClass), rendered:!!button.shadowRoot?.querySelector('button')};
  })).toEqual({documentUntouched:true,allDefined:true,rendered:true});
});
