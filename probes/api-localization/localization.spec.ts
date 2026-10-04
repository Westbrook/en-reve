import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/probes/api-localization/fixture.html');
  await page.waitForFunction(() => (window as any).ready);
});

for (const tag of ['en-token-editor', 'en-rich-text-editor']) {
  test(`${tag}: partial live translations preserve session, choices and default fallbacks`, async ({page}) => {
    await page.evaluate(async tag => {
      const editor:any=document.createElement(tag);
      editor.messages=Object.freeze({suggestions:Object.freeze({loading:'Cargando…',empty:'Sin coincidencias.',unavailable:'No disponible.',keyboardHint:'Flechas para elegir.'})});
      document.body.append(editor);await editor.updateComplete;
      while(!editor.shadowRoot.querySelector('[contenteditable=true]')) await new Promise(r=>setTimeout(r,10));
      editor.registerExtension({id:'people',trigger:'@',label:'Personas',provide:()=>new Promise(resolve=>(window as any).resolveChoices=resolve)});
      editor.focus();editor.openExtension('people');
    }, tag);
    const editor=page.locator(tag);
    await expect(editor.getByRole('status')).toHaveText('Cargando…');
    await expect(editor.getByRole('listbox')).toHaveAccessibleName('Personas');
    await page.evaluate(()=>(window as any).resolveChoices([{id:'a',label:'Alex Chen',description:'Design team',insert:[{kind:'text',text:'Alex'}]},{id:'b',label:'Alex Chen',description:'Engineering team',insert:[{kind:'text',text:'Alex E'}]},{id:'c',label:'No description'}]));
    const options=editor.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAccessibleName('Alex Chen');
    await expect(options.nth(0)).toHaveAccessibleDescription('Design team');
    await expect(options.nth(1)).toHaveAccessibleDescription('Engineering team');
    await expect(options.nth(2)).not.toHaveAttribute('aria-describedby');
    await page.evaluate(tag=>{const e:any=document.querySelector(tag);e.messages={suggestions:{keyboardHint:'Updated hint'}};},tag);
    await expect(editor.locator('.hint')).toContainText('Updated hint');
    await expect(options).toHaveCount(3);
    await editor.getByRole('textbox').press('Enter');
    await expect.poll(()=>page.evaluate(tag=>(document.querySelector(tag) as any).value,tag)).toBe('Alex');
    await page.evaluate(tag=>{const e:any=document.querySelector(tag);e.focus();e.openExtension('people');},tag);
    await expect(editor.getByRole('status')).toHaveText('Loading…');
    await page.evaluate(()=>(window as any).resolveChoices([]));
    await expect(editor.getByRole('status')).toHaveText('No matches.');
    await page.evaluate(tag=>{const e:any=document.querySelector(tag);e.messages={suggestions:{empty:''}};},tag);
    await expect(editor.getByRole('status')).toHaveText('');
    await page.evaluate(tag=>{const e:any=document.querySelector(tag);e.messages=null;},tag);
    await expect(editor.getByRole('status')).toHaveText('No matches.');
  });

  test(`${tag}: localized failed provider and custom picker instructions`,async({page})=>{
    await page.evaluate(async tag=>{
      const e:any=document.createElement(tag);e.messages={suggestions:{unavailable:'No disponible.'},instructions:{picker:'Entrar al selector.',richText:'Editar texto.'}};
      document.body.append(e);await e.updateComplete;
      while(!e.shadowRoot.querySelector('[contenteditable=true]'))await new Promise(r=>setTimeout(r,10));
      e.registerExtension({id:'failed',trigger:'/',label:'Commands',provide:async()=>{throw Error('provider');}});e.focus();e.openExtension('failed');
    },tag);
    await expect(page.locator(tag).getByRole('status')).toHaveText('No disponible.');
    await page.locator(tag).getByRole('textbox').press('Escape');
    await page.evaluate(tag=>{const e:any=document.querySelector(tag);e.registerExtension({id:'picker',trigger:'#',label:'Color',render:()=>''});e.focus();e.openExtension('picker');},tag);
    await expect(page.locator(tag).locator('.hint')).toContainText('Entrar al selector.');
  });
}

test('range action labels reset without altering accepted range; empty remains intentional',async({page})=>{
  const result=await page.evaluate(async()=>{
    const picker:any=document.createElement('en-date-picker');picker.selection='range';picker.rangeValue={start:'2026-09-01',end:'2026-09-03'};
    picker.setAttribute('clear-label','Borrar selección');picker.applyLabel='Aplicar';picker.cancelLabel='Cancelar';
    document.body.append(picker);await picker.updateComplete;
    const actions=()=>picker.shadowRoot.querySelector('.range-actions').textContent;
    const translated=actions();picker.removeAttribute('clear-label');await picker.updateComplete;const reset=actions();
    picker.setAttribute('clear-label','');await picker.updateComplete;const empty=picker.clearLabel;
    return {translated,reset,empty,value:picker.rangeValue};
  });
  expect(result.translated).toContain('Borrar selección');expect(result.translated).toContain('Aplicar');
  expect(result.reset).toContain('Clear range');expect(result.empty).toBe('');
  expect(result.value).toEqual({start:'2026-09-01',end:'2026-09-03'});
});

test('summary guidance respects live slot precedence and fallback removal',async({page})=>{
  await page.evaluate(async()=>{
    const summary:any=document.createElement('en-validation-summary');summary.items=[{target:'name',message:'Enter a name'}];
    summary.description='Correct the errors below.';document.body.append(summary);await summary.updateComplete;
  });
  const summary=page.locator('en-validation-summary');
  await expect(summary.getByText('Correct the errors below.')).toBeVisible();
  await summary.evaluate(el=>{const rich=document.createElement('strong');rich.slot='description';rich.textContent='Rich guidance';el.append(rich);});
  await expect(summary.getByText('Rich guidance')).toBeVisible();
  await expect(summary.getByText('Correct the errors below.')).not.toBeVisible();
  await summary.evaluate(el=>el.querySelector('[slot=description]')!.remove());
  await expect(summary.getByText('Correct the errors below.')).toBeVisible();
});

for(const plane of [false,true]) {
  test(`picker ${plane?'HSV plane':'RGB channels'}: specific numeric messages, invalid-color feedback and unchanged validity`,async({page})=>{
    await page.evaluate(async plane=>{
      const p:any=document.createElement('en-color-picker');p.id='picker';p.value='#336699';p.format='rgb';p.plane=plane;
      p.validationText='Número fuera de rango.';p.messages={invalidColor:'Color no admitido.',exactValueLabel:'Valor exacto',channels:{red:'Rojo entre 0 y 255.',hue:'Matiz entre 0 y 360.'}};
      document.body.append(p);await p.updateComplete;
    },plane);
    const picker=page.locator('#picker');
    const sliders=picker.locator('en-color-slider');
    const input=sliders.first().locator('en-text-field input');
    await expect(input).toHaveAccessibleName(plane?'Hue Valor exacto':'Red Valor exacto');
    await input.fill('999');await input.press('Enter');
    await expect(sliders.first().locator('[role=alert], [part~=error]').last()).toContainText(plane?'Matiz entre 0 y 360.':'Rojo entre 0 y 255.');
    const invalid=await picker.evaluate((p:any)=>({valid:p.checkValidity(),value:p.value}));
    expect(invalid).toEqual({valid:false,value:'#336699'});
    await picker.evaluate((p:any)=>{p.messages={channels:{red:'Updated',hue:'Updated'}};});
    await expect(sliders.first().locator('[role=alert], [part~=error]').last()).toContainText('Updated');
    expect(await picker.evaluate((p:any)=>p.checkValidity())).toBe(false);
    await input.fill('20');await input.press('Enter');
    expect(await picker.evaluate((p:any)=>p.checkValidity())).toBe(true);
    await picker.evaluate((p:any)=>{p.messages={invalidColor:'Color no admitido.'};p.value='not-a-color';});
    await expect(picker.locator('[part=validation-message]').first()).toHaveText('Color no admitido.');
    expect(await picker.evaluate((p:any)=>p.checkValidity())).toBe(false);
  });
}

test('standalone plane and wheel keep invalidity independent from translated text',async({page})=>{
  await page.evaluate(async()=>{
    for(const tag of ['en-color-plane','en-color-wheel']) {
      const e:any=document.createElement(tag);e.value='invalid';e.messages={invalidColor:''};document.body.append(e);await e.updateComplete;
    }
  });
  for(const tag of ['en-color-plane','en-color-wheel']) {
    expect(await page.locator(tag).evaluate((e:any)=>e.checkValidity())).toBe(false);
    await page.locator(tag).evaluate((e:any)=>{e.messages={invalidColor:'Color no admitido.'};});
    await expect(page.locator(tag).locator('p[part=error]')).toHaveText('Color no admitido.');
  }
  const wheel=page.locator('en-color-wheel');
  await wheel.evaluate((e:any)=>{e.value='#ff0000';e.validationText='Matiz entre 0 y 360.';});
  const input=wheel.locator('en-text-field input');await input.fill('361');await input.press('Enter');
  expect(await wheel.evaluate((e:any)=>e.checkValidity())).toBe(false);
  await expect(wheel.locator('en-text-field')).toContainText('Matiz entre 0 y 360.');
  await wheel.evaluate((e:any)=>e.validationText='');
  expect(await wheel.evaluate((e:any)=>e.checkValidity())).toBe(false);
  await expect(wheel.locator('en-text-field')).toContainText('Enter a hue from 0 to 360 degrees.');
});

test('default toolbar translates controls and an already-visible link error; custom slot wins',async({page})=>{
  await page.evaluate(async()=>{
    const e:any=document.createElement('en-rich-text-editor');e.value='hello';document.body.append(e);await e.updateComplete;
    while(!e.shadowRoot.querySelector('[contenteditable=true]'))await new Promise(r=>setTimeout(r,10));
    const t:any=document.createElement('en-editor-toolbar');t.editor=e;t.messages={commands:{bold:'Negrita',link:'Enlace'},link:{label:'Dirección',applyLabel:'Aplicar',cancelLabel:'Cancelar',invalid:'Enlace no válido.'}};
    document.body.append(t);await t.updateComplete;e.focus();
  });
  const editor=page.locator('en-rich-text-editor');
  const textbox=editor.getByRole('textbox');
  // Select-all is an editor command on every platform; Home/End have native platform semantics.
  await textbox.focus();await expect(textbox).toBeFocused();
  await textbox.press('ControlOrMeta+a');
  await expect(editor).toHaveJSProperty('hasSelection',true);
  await expect.poll(()=>editor.evaluate((e:any)=>e.captureRange()?.expectedText)).toBe('hello');
  const selected=await editor.evaluate((e:any)=>e.captureRange());
  const toolbar=page.locator('en-editor-toolbar');
  await expect(toolbar.getByRole('button',{name:'Negrita',exact:true})).toBeVisible();
  await expect(toolbar.getByRole('button',{name:'Italic',exact:true})).toBeVisible();
  await expect(toolbar.getByRole('button',{name:'Enlace',exact:true})).toBeEnabled();
  await toolbar.getByRole('button',{name:'Enlace',exact:true}).click();
  await toolbar.getByRole('textbox',{name:'Dirección'}).fill('javascript:alert(1)');
  await toolbar.getByRole('button',{name:'Aplicar',exact:true}).click();
  await expect(toolbar.getByRole('alert')).toHaveText('Enlace no válido.');
  await toolbar.evaluate((t:any)=>t.messages={link:{invalid:'Updated error'}});
  await expect(toolbar.getByRole('alert')).toHaveText('Updated error');
  expect(await editor.evaluate((e:any)=>e.captureRange())).toEqual(selected);
  await toolbar.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(textbox).toBeFocused();
  expect(await editor.evaluate((e:any)=>e.captureRange())).toEqual(selected);
  await expect(editor).toHaveJSProperty('value','hello');
  await toolbar.evaluate(t=>{const b=document.createElement('button');b.textContent='Custom formatting';t.append(b);});
  await expect(toolbar.getByRole('button',{name:'Custom formatting'})).toBeVisible();
  await expect(toolbar.getByRole('button',{name:'Bold',exact:true})).not.toBeVisible();
});

test('pagination default removal and authored badge ownership remain intact',async({page})=>{
  const result=await page.evaluate(async()=>{
    const p:any=document.createElement('en-pagination');p.totalItems=100;p.setAttribute('status-label','Página {page} de {pages}');document.body.append(p);await p.updateComplete;
    p.removeAttribute('status-label');await p.updateComplete;
    const badge=document.createElement('en-badge');badge.innerHTML='<span slot="prefix" aria-hidden="true">★</span>Featured';document.body.append(badge);
    return {status:p.statusLabel,text:p.shadowRoot.textContent};
  });
  expect(result.status).toBe('Page {page} of {pages}');expect(result.text).not.toContain('null');
  await expect(page.locator('en-badge')).toMatchAriaSnapshot('- text: Featured');
});
