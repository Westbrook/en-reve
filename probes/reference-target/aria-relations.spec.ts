import { test, expect, type Page, type CDPSession } from '@playwright/test';

const open = async (page: Page, mode: string) => {
  await page.goto(`/probes/reference-target/aria-fixture.html?mode=${mode}`);
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  return page.evaluate(() => (window as any).ariaReferenceProbe.capabilities);
};
const axNode = async (cdp: CDPSession, name: string) => {
  const {nodes}=await cdp.send('Accessibility.getFullAXTree');
  return nodes.find(node=>!node.ignored && node.name?.value===name && ['textbox','combobox'].includes(node.role?.value));
};
const backendId = async (cdp: CDPSession, expression: string) => {
  const {result}=await cdp.send('Runtime.evaluate',{expression});
  const {node}=await cdp.send('DOM.describeNode',{objectId:result.objectId});
  await cdp.send('Runtime.releaseObject',{objectId:result.objectId!});
  return node.backendNodeId;
};
test.beforeEach(async({browser},info)=>{
  info.annotations.push({type:'browser-version',description:browser.version()});
  info.annotations.push({type:'coverage',description:'Isolated pinned native/polyfill comparison; DOM references plus Chromium AX, not actual AT or production adoption.'});
});

for (const mode of ['native','forced']) {
  test(`${mode}: nested conditional labels activate the current target once`,async({page},info)=>{
    const caps=await open(page,mode);
    test.skip(mode==='native'&&!caps.labels,'Native Reference Target is absent; fallback is tested separately.');
    const input=page.locator('#nested-field #inner #control'),alternate=page.locator('#nested-field #inner #alternate');
    await input.evaluate(node=>{node.addEventListener('focus',()=>node.setAttribute('data-focus-count',String(Number(node.getAttribute('data-focus-count')??0)+1)));});
    await page.locator('#nested-label').click();await expect(input).toBeFocused();await expect(input).toHaveAttribute('data-focus-count','1');
    if(mode==='forced') await expect.poll(()=>input.evaluate(node=>node.ariaLabelledByElements?.map(label=>label.textContent))).toEqual(['Nested account']);
    else await expect(input).toHaveAccessibleName('Nested account');
    await page.evaluate(()=>{(window as any).ariaReferenceProbe.fieldLeaf.referenceTarget='alternate';(window as any).ariaReferenceProbe.refresh();});
    await page.locator('#nested-label').click();await expect(alternate).toBeFocused();
    await page.evaluate(()=>{(window as any).ariaReferenceProbe.fieldLeaf.referenceTarget='missing';(window as any).ariaReferenceProbe.refresh();});
    await page.locator('#described').focus();await page.locator('#nested-label').click();await expect(alternate).not.toBeFocused();await expect(input).not.toBeFocused();
    await page.evaluate(()=>{const p=(window as any).ariaReferenceProbe;p.fieldLeaf.querySelector('#alternate').id='missing';p.refresh();});
    await page.locator('#nested-label').click();await expect(page.locator('#nested-field #inner #missing')).toBeFocused();
    await info.attach('capabilities.json',{body:JSON.stringify(caps),contentType:'application/json'});
  });

  test(`${mode}: descriptions track nested target replacement, absence and restoration`,async({page,browserName})=>{
    const caps=await open(page,mode);
    test.skip(mode==='native'&&(!caps.surface||browserName!=='chromium'),'Computed native cross-root description requires supported native routing and Chromium AX protocol.');
    const cdp=browserName==='chromium'?await page.context().newCDPSession(page):null;
    const input=page.locator('#described');await input.fill('retained draft');await input.press('ArrowLeft');
    await input.evaluate(node=>{(window as any).savedAriaInput=node;});
    const check=async(text:string)=>{
      if(mode==='forced') await expect.poll(()=>input.evaluate(node=>(node.ariaDescribedByElements??[]).map(node=>node.textContent).join(' '))).toBe(text);
      if(cdp) await expect.poll(async()=>(await axNode(cdp,'Account'))?.description?.value??'').toBe(text);
      await expect(input).toBeFocused();await expect(input).toHaveValue('retained draft');
      expect(await input.evaluate((node:HTMLInputElement)=>({same:node===(window as any).savedAriaInput,caret:node.selectionStart}))).toEqual({same:true,caret:13});
    };
    await check('Nested help');
    await page.evaluate(()=>{const p=(window as any).ariaReferenceProbe;p.hintLeaf.querySelector('#message').outerHTML='<span id="message">Replacement help</span>';document.querySelector('#hint')!.setAttribute('data-public-text','Replacement help');});
    await check('Replacement help');
    await page.evaluate(()=>{const p=(window as any).ariaReferenceProbe;p.hintLeaf.referenceTarget='missing';p.refresh();});await check('');
    await page.evaluate(()=>{const p=(window as any).ariaReferenceProbe;const help=document.createElement('span');help.id='missing';help.textContent='Inserted help';p.hintLeaf.append(help);document.querySelector('#hint')!.setAttribute('data-public-text','Inserted help');});await check('Inserted help');
    await page.evaluate(()=>{const p=(window as any).ariaReferenceProbe;p.hintLeaf.referenceTarget='alternate';document.querySelector('#hint')!.setAttribute('data-public-text','Alternate help');p.refresh();});await check('Alternate help');
    await cdp?.detach();
  });
}

test('late explicit fallback hydration preserves drafts and cleans up proxy relationships',async({page,browserName})=>{
  await open(page,'late');const input=page.locator('#ssr-described');await input.fill('early draft');await input.press('ArrowLeft');
  await input.evaluate(node=>{(window as any).earlyAriaInput=node;});
  await page.evaluate(()=>(window as any).ariaReferenceProbe.lateInstall());
  await expect.poll(()=>input.evaluate(node=>node.ariaDescribedByElements?.map(node=>node.textContent))).toEqual(['Pre-rendered help']);
  await expect(input).toBeFocused();await expect(input).toHaveValue('early draft');
  expect(await input.evaluate((node:HTMLInputElement)=>({same:node===(window as any).earlyAriaInput,caret:node.selectionStart}))).toEqual({same:true,caret:10});
  if(browserName==='chromium'){const cdp=await page.context().newCDPSession(page);expect((await axNode(cdp,'Pre-rendered account'))?.description?.value).toBe('Pre-rendered help');await cdp.detach();}
  await page.evaluate(()=>(window as any).ariaReferenceProbe.dispose());
  await expect(input).toHaveAttribute('aria-describedby','ssr-hint');await expect(page.locator('[data-reference-target-text]')).toHaveCount(0);
  await expect(input).toBeFocused();await expect(input).toHaveValue('early draft');
});

test('native active descendant follows target changes while focus stays in the combobox',async({page,browserName},info)=>{
  test.skip(browserName!=='chromium','Native AX target identity requires Chromium CDP.');
  const caps=await open(page,'native');test.skip(!caps.surface,'Native Reference Target unavailable.');
  const input=page.locator('#combo');await input.focus();const cdp=await page.context().newCDPSession(page);
  const check=async(id:string|null)=>{
    const expected=id?await backendId(cdp,`window.ariaReferenceProbe.optionRoot.querySelector('#${id}')`):null;
    await expect.poll(async()=>((await axNode(cdp,'Project'))?.properties?.find(p=>p.name==='activedescendant')?.value as any)?.relatedNodes?.[0]?.backendDOMNodeId??null).toBe(expected);
    await expect(input).toBeFocused();
  };
  await check('option');
  await page.evaluate(()=>(window as any).ariaReferenceProbe.optionRoot.referenceTarget='alternate');await check('alternate');
  await page.evaluate(()=>(window as any).ariaReferenceProbe.optionRoot.referenceTarget='missing');await check(null);
  await info.attach('native-ax.json',{body:JSON.stringify((await cdp.send('Accessibility.getFullAXTree')).nodes),contentType:'application/json'});await cdp.detach();
});

test('fallback does not claim error or active-descendant forwarding',async({page,browserName},info)=>{
  await open(page,'forced');const input=page.locator('#combo');await input.focus();
  expect(await input.evaluate(node=>node.ariaActiveDescendantElement?.id)).toBe('option-host');
  expect(await page.locator('#described').evaluate(node=>node.ariaErrorMessageElements?.map(node=>node.id))).toEqual(['error']);
  if(browserName==='chromium'){
    const cdp=await page.context().newCDPSession(page);const host=await backendId(cdp,"document.querySelector('#option-host')");
    expect(((await axNode(cdp,'Project'))?.properties?.find(p=>p.name==='activedescendant')?.value as any)?.relatedNodes?.[0]?.backendDOMNodeId).toBe(host);
    await info.attach('unsupported-ax.json',{body:JSON.stringify((await cdp.send('Accessibility.getFullAXTree')).nodes),contentType:'application/json'});await cdp.detach();
  }
  info.annotations.push({type:'unsupported-relationship',description:'The frozen adapter only approximates explicit plain-text names/descriptions. Error and active-descendant references still point to the host, not the intended private semantic target.'});
});

test('native error reference must reach the same semantic error as the same-tree baseline',async({page,browserName},info)=>{
  test.skip(browserName!=='chromium','Native AX error target identity requires Chromium CDP.');
  await open(page,'native');const cdp=await page.context().newCDPSession(page);
  const related=async(name:string)=>((await axNode(cdp,name))?.properties?.find(p=>p.name==='errormessage')?.value as any)?.relatedNodes?.[0]?.backendDOMNodeId??null;
  await page.locator('#native-described').focus();
  expect(await related('Native account')).toBe(await backendId(cdp,"document.querySelector('#native-error')"));
  await page.locator('#described').focus();
  const target=await backendId(cdp,"document.querySelector('#error').shadowRoot.querySelector('#message')");
  await info.attach('native-error-gap.json',{body:JSON.stringify({expectedTarget:target,actualTarget:await related('Account'),nodes:(await cdp.send('Accessibility.getFullAXTree')).nodes},null,2),contentType:'application/json'});
  test.fail(true,'Chromium 153 exposes basic Reference Target but omits this cross-root error relation from AX; same-tree error baseline works. No native error-forwarding support claimed.');
  try{await expect.poll(()=>related('Account')).toBe(target);}finally{await cdp.detach();}
});

for (const mode of ['native','forced']) {
  test(`${mode}: identical IDs in separate enclosing roots keep independent label ownership`,async({page})=>{
    const caps=await open(page,mode);test.skip(mode==='native'&&!caps.labels,'Native label routing absent.');
    await page.evaluate(()=>{
      for(const key of ['a','b']){
        const container=document.createElement('div');container.id='scope-'+key;document.body.append(container);
        const root=container.attachShadow({mode:'open'});
        root.innerHTML=`<label for="nested-field">Account ${key}</label><probe-label id="nested-field" data-reference-target="control"></probe-label>`;
        const field=root.querySelector('probe-label')!;
        const target=field.attachShadow({mode:'open',referenceTarget:'control'} as ShadowRootInit);
        target.innerHTML='<input id="control">';
      }
      (window as any).ariaReferenceProbe.refresh();
    });
    for(const key of ['a','b']){
      const scope=page.locator('#scope-'+key),input=scope.locator('input');
      await scope.locator('label').click();await expect(input).toBeFocused();
      if(mode==='native')await expect(input).toHaveAccessibleName('Account '+key);
      else await expect.poll(()=>input.evaluate(node=>node.ariaLabelledByElements?.map(node=>node.textContent))).toEqual(['Account '+key]);
    }
    await page.locator('#scope-a').evaluate(node=>node.remove());
    await page.locator('#scope-b label').click();await expect(page.locator('#scope-b input')).toBeFocused();
    if(mode==='forced')await expect.poll(()=>page.locator('#scope-b input').evaluate(node=>node.ariaLabelledByElements?.map(node=>node.textContent))).toEqual(['Account b']);
  });
}
