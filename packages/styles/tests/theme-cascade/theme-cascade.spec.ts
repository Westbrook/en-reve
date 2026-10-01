import { expect, test, type Page } from '@playwright/test';

const shared = '--en-control-background:rgb(235,235,235);--en-control-color:rgb(50,50,50);--en-control-inline-padding:28px;--en-control-radius:18px';
const input = '--en-input-background:rgb(230,220,250);--en-input-color:rgb(55,25,90);--en-input-inline-padding:12px';
const fieldTags = ['text-field','search-input','date-input','textarea','select','number-field','color-field','file-upload','combobox'];

async function mount(page: Page, tags: string[], style = shared) {
  await page.evaluate(async ({tags,style}) => {
    const region = document.createElement('section'); region.id = 'scope'; region.className = 'region'; region.style.cssText = style;
    for (const tag of tags) {
      const host = document.createElement(`en-${tag}`) as HTMLElement & { items?: unknown[]; updateComplete?: Promise<unknown> };
      host.id = tag; host.setAttribute('label', tag); host.textContent = tag;
      if (['select','segmented-control','combobox'].includes(tag)) host.items = [{value:'a',label:'One'},{value:'b',label:'Two'}];
      if (tag === 'number-field') host.setAttribute('value','1');
      if (tag === 'color-field') host.setAttribute('value','#123456');
      region.append(host);
    }
    document.querySelector('#fixture')!.append(region);
    await Promise.all([...region.children].map(host => (host as any).updateComplete));
  }, {tags,style});
}
const control = (page: Page, tag: string) => page.locator(`#${tag} [part~="control"]`).first();
const painted = (page: Page, tag: string) => page.locator(`#${tag} [part~="${tag==='number-field'?'stepper':tag==='file-upload'?'dropzone':'control'}"]`).first();
async function pin(page: Page, selector: string, style: string) {
  await page.locator(selector).evaluate((node, style) => (node as HTMLElement).style.cssText = style, style);
}
async function height(page: Page, selector: string) {
  return page.locator(selector).first().evaluate(node => node.getBoundingClientRect().height);
}

test.beforeEach(async ({page}) => {
  await page.goto('/packages/styles/tests/theme-cascade/fixture.html');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
});

test('input paint follows local family, inherited shared, then semantic defaults across real field families', async ({page}) => {
  await mount(page, fieldTags);
  for (const tag of fieldTags) {
    await pin(page, `#${tag}`, input);
    await expect(painted(page,tag),tag).toHaveCSS('background-color','rgb(230, 220, 250)');
    await expect(tag==='file-upload'?painted(page,tag):control(page,tag),tag).toHaveCSS('color','rgb(55, 25, 90)');
    await pin(page, `#${tag}`, '');
    await expect(painted(page,tag),tag).toHaveCSS('background-color','rgb(235, 235, 235)');
    await expect(tag==='file-upload'?painted(page,tag):control(page,tag),tag).toHaveCSS('color','rgb(50, 50, 50)');
  }
  await pin(page,'#scope','--en-color-surface:rgb(245,250,240);--en-color-text:rgb(20,40,25)');
  for (const tag of fieldTags) {
    await expect(painted(page,tag),tag).toHaveCSS('background-color','rgb(245, 250, 240)');
    await expect(tag==='file-upload'?painted(page,tag):control(page,tag),tag).toHaveCSS('color','rgb(20, 40, 25)');
  }
  await control(page,'text-field').fill('Edited content');
  await expect(control(page,'text-field')).toHaveValue('Edited content');
  await page.locator('#number-field [part="increment"]').click();
  await expect(control(page,'number-field')).toHaveValue('2');
});

test('native input and card recipes use the same cascade as shadow components', async ({page}) => {
  await mount(page,['text-field','card'],shared+';--en-surface-background:rgb(235,235,235)');
  await page.locator('#scope').evaluate(node => node.insertAdjacentHTML('beforeend','<input id="native" class="en-input" aria-label="Native"><div id="native-card" class="en-card">Card</div>'));
  for (const id of ['text-field','native']) await pin(page,`#${id}`,input);
  for (const id of ['card','native-card']) await pin(page,`#${id}`,'--en-card-background:rgb(230,220,250)');
  for (const selector of ['#native','#native-card','#card [part="base"]','#text-field [part="control"]']) await expect(page.locator(selector)).toHaveCSS('background-color','rgb(230, 220, 250)');
  await pin(page,'#card','');
  await expect(page.locator('#card [part="base"]')).toHaveCSS('background-color','rgb(235, 235, 235)');
  await pin(page,'#scope','--en-color-surface:rgb(245,250,240)');
  await expect(page.locator('#card [part="base"]')).toHaveCSS('background-color','rgb(245, 250, 240)');
});

test('family padding and radius refine shared geometry; invalid and combobox geometry use the effective padding', async ({page}) => {
  await mount(page,['text-field','button','combobox','file-upload']);
  for (const tag of ['text-field','combobox','file-upload']) await pin(page,`#${tag}`,input);
  await pin(page,'#button','--en-button-inline-padding:16px;--en-button-radius:6px');
  await expect(control(page,'button')).toHaveCSS('padding-left','16px');
  await expect(control(page,'button')).toHaveCSS('border-radius','6px');
  for (const tag of ['text-field','combobox','file-upload']) await expect(tag==='file-upload'?painted(page,tag):control(page,tag)).toHaveCSS('padding-left','12px');
  const combo = control(page,'combobox');
  const reserved = await combo.evaluate(node => {
    const s = getComputedStyle(node); return parseFloat(s.paddingRight)-parseFloat(s.paddingLeft);
  });
  await pin(page,'#combobox','--en-input-inline-padding:20px');
  await expect(combo).toHaveCSS('padding-left','20px');
  expect(await combo.evaluate(node=>{const s=getComputedStyle(node);return parseFloat(s.paddingRight)-parseFloat(s.paddingLeft);})).toBe(reserved);
  const text = control(page,'text-field');
  const edge = await text.evaluate(node=>{const s=getComputedStyle(node);return parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth);});
  await text.evaluate(node=>node.setAttribute('aria-invalid','true'));
  expect(await text.evaluate(node=>{const s=getComputedStyle(node);return parseFloat(s.paddingLeft)+parseFloat(s.borderLeftWidth);})).toBe(edge);
  await pin(page,'#button','');
  await expect(control(page,'button')).toHaveCSS('padding-left','28px');
  await expect(control(page,'button')).toHaveCSS('border-radius','18px');
  await expect(text).toHaveCSS('border-radius','18px');
});

test('Parts refine inherited family values; locally authored broad values remain defaults', async ({page}) => {
  await mount(page,['text-field'],shared+';'+input);
  await pin(page,'#text-field','--en-control-background:rgb(240,200,200)');
  await expect(control(page,'text-field')).toHaveCSS('background-color','rgb(230, 220, 250)');
  await page.addStyleTag({content:'#text-field::part(control) { --en-input-background:rgb(210,240,220); --en-input-inline-padding:19px; }'});
  await expect(control(page,'text-field')).toHaveCSS('background-color','rgb(210, 240, 220)');
  await expect(control(page,'text-field')).toHaveCSS('padding-left','19px');
});

test('full child themes clear pins while partial themes retain unspecified shared defaults', async ({page}) => {
  await mount(page,['text-field','card'],shared+';'+input+';--en-card-background:rgb(230,220,250)');
  await page.evaluate(()=>{
    const {emitThemeCSS,resolveTheme}=window as any;
    const sheet=document.createElement('style');sheet.id='theme';
    sheet.textContent=emitThemeCSS(resolveTheme(),{selector:':where(#text-field,#card)'});
    document.head.append(sheet);
  });
  await expect(control(page,'text-field')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('#card [part="base"]')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await page.evaluate(()=>{
    const {emitThemeCSS,resolveTheme}=window as any;
    document.querySelector('#theme')!.textContent=emitThemeCSS(resolveTheme({pins:{'component.input.inline-padding':{value:1.25,unit:'rem'}}}),{kind:'partial',tokenIds:['component.input.inline-padding'],selector:':where(#text-field)'});
  });
  await expect(control(page,'text-field')).toHaveCSS('background-color','rgb(230, 220, 250)');
  await expect(control(page,'text-field')).toHaveCSS('padding-left','20px');
});

for (const size of ['small','medium','large']) test(`segmented inset stays local; explicit group minimum aligns controls (${size})`, async ({page})=>{
  await mount(page,['text-field','button','segmented-control'],'');
  await page.locator('#scope > *').evaluateAll((nodes,size)=>nodes.forEach(node=>node.setAttribute('size',size)),size);
  const selectors=['#text-field [part="control"]','#button [part="control"]','#segmented-control [part="options"]'];
  const before=await Promise.all(selectors.map(s=>height(page,s)));
  expect(Math.max(...before)-Math.min(...before)).toBeLessThanOrEqual(1);
  await pin(page,'#scope','--en-segmented-control-frame-inset:16px');
  const after=await Promise.all(selectors.map(s=>height(page,s)));
  expect(after.slice(0,2)).toEqual(before.slice(0,2));
  expect(after[2]).toBeGreaterThan(before[2]);
  expect(await height(page,'#segmented-control [part~="option"]')).toBeGreaterThanOrEqual(24);
  await pin(page,'#scope','--en-segmented-control-frame-inset:16px;--en-control-min-size:96px');
  const aligned=await Promise.all(selectors.map(s=>height(page,s)));
  expect(Math.max(...aligned)-Math.min(...aligned)).toBeLessThanOrEqual(1);
  expect(aligned[0]).toBe(96);
  await pin(page,'#button','--en-button-radius:7px;--en-button-inline-padding:13px');
  await expect(control(page,'button')).toHaveCSS('border-radius','7px');
  await expect(control(page,'button')).toHaveCSS('padding-left','13px');
});

test('coarse pointer targets survive a large segmented inset without inflating other families',async({browser})=>{
  const context=await browser.newContext({hasTouch:true});const page=await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4479/packages/styles/tests/theme-cascade/fixture.html');
    await expect(page.locator('body')).toHaveAttribute('data-ready','true');
    await mount(page,['text-field','button','segmented-control'],'');
    const before=await height(page,'#button [part="control"]');
    await pin(page,'#scope','--en-segmented-control-frame-inset:24px');
    expect(await height(page,'#button [part="control"]')).toBe(before);
    expect(before).toBeGreaterThanOrEqual(44);
    expect(await height(page,'#segmented-control [part~="option"]')).toBeGreaterThanOrEqual(44);
  } finally {await context.close();}
});

test('action paint, disabled state and icon geometry retain their distinct semantics',async({page})=>{
  await mount(page,['button','text-field'],'');
  const button=control(page,'button');
  const initial=await button.evaluate(node=>getComputedStyle(node).backgroundColor);
  await pin(page,'#scope',shared+';'+input);
  await expect(button).toHaveCSS('background-color',initial);
  await page.locator('#button').evaluate(node=>node.setAttribute('icon-only',''));
  const width=await button.evaluate(node=>node.getBoundingClientRect().width);
  await pin(page,'#button','--en-button-inline-padding:80px');
  expect(await button.evaluate(node=>node.getBoundingClientRect().width)).toBe(width);
  await page.locator('#text-field').evaluate(node=>node.setAttribute('disabled',''));
  await expect(control(page,'text-field')).toBeDisabled();
  await expect(control(page,'text-field')).not.toHaveCSS('background-color','rgb(230, 220, 250)');
  await pin(page,'#button','--en-button-background:rgb(120,30,80)');
  await expect(button).toHaveCSS('background-color','rgb(120, 30, 80)');
  await page.emulateMedia({forcedColors:'active'});
  if(await page.evaluate(()=>matchMedia('(forced-colors:active)').matches)) await expect(button).not.toHaveCSS('background-color','rgb(120, 30, 80)');
});

test('option-list refinements still beat shared overlay defaults',async({page})=>{
  await page.locator('#fixture').evaluate(node=>node.innerHTML='<div id="list" class="en-combobox-popup" style="--en-overlay-background:rgb(235,235,235);--en-option-list-background:rgb(230,220,250);--en-overlay-radius:18px;--en-option-list-radius:6px">Options</div>');
  await expect(page.locator('#list')).toHaveCSS('background-color','rgb(230, 220, 250)');
  await expect(page.locator('#list')).toHaveCSS('border-radius','6px');
});
