import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolveTheme,emitThemeCSS,colorFromHex,createReviewDraft,validateRenderedRelationships,createThemeCompanion,type RenderedRelationship} from '@en-reve/tokens';
const styles=await Promise.all(['controls','selection','navigation','surfaces','typography','feedback'].map(async name=>readFile(new URL(`../../../packages/styles/dist/${name}.css`,import.meta.url),'utf8')));
async function fixture(page:Page,pins:Record<string,unknown>={},mode:'light'|'dark'='light') {
 await page.goto('/showcase?progress-report'); await expect(page.getByRole('button',{name:'Download JSON',exact:true})).toBeEnabled();
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{document.body.innerHTML=`<main id="fixture" class="en-foundation" data-en-theme="test" data-en-appearance="light" style="padding:32px;background:var(--en-color-surface);color:var(--en-color-text)">
 <div class="buttons">${['primary','secondary','ghost','danger'].map(v=>`<en-button id="${v}" variant="${v}">${v} action</en-button>`).join('')}</div>
 <en-button id="disabled" disabled>Disabled</en-button>
 <en-button id="open-trigger" aria-expanded="true">Open trigger</en-button>
 <en-text-field id="field" label="Title" value="Keep this value"></en-text-field>
 <en-number-field id="number" label="Copies" value="2"></en-number-field>
 <en-combobox id="combo" label="Find"></en-combobox>
 <en-select id="select" label="Version"><en-select-option value="one">One</en-select-option></en-select>
 <en-date-picker id="date" label="Date"></en-date-picker>
 <en-token-editor id="editor" label="Notes"></en-token-editor>
 <en-card id="card"><h2 class="en-heading-large">Editorial heading</h2><p>Layered card</p></en-card>
 <nav class="en-section-nav"><a id="current" class="en-navigation-link" href="#current" aria-current="page">Current</a><a id="nav" class="en-navigation-link" href="#next">Next</a></nav>
 <button id="option" class="en-option" aria-selected="true">Selected option</button>
 <button id="tab" class="en-tab" aria-selected="true">Selected tab</button>
 <a id="link" class="en-link" href="#destination">Read more</a><div id="material" style="background-image:linear-gradient(45deg,red,blue)">Image-backed context</div>
 ${['info','success','warning','danger'].map(v=>`<en-badge variant="${v==='info'?'accent':v}" id="badge-${v}">${v} status</en-badge><en-toast id="toast-${v}" variant="${v}">${v} message</en-toast>`).join('')}
 <section data-en-theme="nested"><button id="nested" class="en-button" data-variant="ghost">Nested</button></section>
 </main>`;});
 const theme=resolveTheme({name:'test',mode,pins});
 await page.addStyleTag({content:styles.join('\n')+emitThemeCSS(theme)+emitThemeCSS(resolveTheme({name:'nested',mode}))});
 await page.locator('#fixture').evaluate((el,mode)=>el.setAttribute('data-en-appearance',mode),mode);
 await expect(page.locator('#primary button')).toBeVisible();return theme;
}
async function paint(target:Locator){return target.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundColor,borderColor:s.borderColor,color:s.color,shadow:s.boxShadow,radius:s.borderRadius,width:s.borderWidth,outline:s.outlineWidth,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};});}
async function hold(page:Page,target:Locator){await target.hover();await page.mouse.down();}

test('held whole-button motion, themeable popup exceptions, focus, opt-outs and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await fixture(page,{'component.button.pressed-scale':.95,'component.button.pressed-offset':{value:2,unit:'px'},'component.button.press-duration':{value:0,unit:'ms'},'component.button.release-duration':{value:0,unit:'ms'}});
 for(const id of ['primary','secondary','ghost','danger']){
  const button=page.locator(`#${id} button`);await button.hover();const before=await paint(button);await page.mouse.down();
  await expect.poll(async()=> (await paint(button)).background).not.toBe(before.background);
  expect((await paint(button)).rect.width).toBeCloseTo(before.rect.width*.95, 1);
  expect(await button.evaluate(el=>getComputedStyle(el).scale)).toBe('0.95');
  expect(await button.locator('.en-button__label').evaluate(el=>getComputedStyle(el).scale)).toBe('none');
  await page.mouse.up();
 }
 const primary=page.locator('#primary button');await primary.focus();await page.keyboard.down('Space');expect((await paint(primary)).outline).not.toBe('0px');await page.keyboard.up('Space');
 await page.emulateMedia({reducedMotion:'reduce'});await hold(page,primary);expect(await primary.evaluate(el=>getComputedStyle(el).scale)).toBe('none');await page.mouse.up();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#open-trigger button').evaluate(el=>el.setAttribute('aria-expanded','true'));
 await hold(page,page.locator('#open-trigger button'));expect(await page.locator('#open-trigger button').evaluate(el=>getComputedStyle(el).scale)).toBe('0.95');await page.mouse.up();
 await primary.evaluate(el=>el.setAttribute('aria-haspopup','menu'));await hold(page,primary);expect(await primary.evaluate(el=>getComputedStyle(el).scale)).toBe('0.95');await page.mouse.up();
 await primary.evaluate(el=>{el.style.setProperty('--en-button-popup-pressed-scale','1');el.style.setProperty('--en-button-popup-pressed-offset','0px');});await hold(page,primary);expect(await primary.evaluate(el=>getComputedStyle(el).scale)).toBe('1');expect(await primary.evaluate(el=>getComputedStyle(el).translate)).toBe('0px');await page.mouse.up();await primary.evaluate(el=>el.removeAttribute('aria-haspopup'));
 await page.locator('#secondary').evaluate(el=>el.setAttribute('data-press','none'));await hold(page,page.locator('#secondary button'));expect(await page.locator('#secondary button').evaluate(el=>getComputedStyle(el).scale)).toBe('none');await page.mouse.up();
 const disabled=page.locator('#disabled button');const before=await paint(disabled);await hold(page,disabled);expect((await paint(disabled)).background).toBe(before.background);await page.mouse.up();
});

test('family refinements reach fields, card, typography and independent navigation/tab states',async({page})=>{
 const ink=colorFromHex('#582080');const hover=colorFromHex('#d6eaff');
 await fixture(page,{'component.input.radius':{value:3,unit:'px'},'component.input.border-width':{value:3,unit:'px'},'component.input.hover-border-color':ink,'component.input.invalid-border-color':colorFromHex('#aa0000'),'component.card.shadow':{color:ink,offsetX:{value:4,unit:'px'},offsetY:{value:4,unit:'px'},blur:{value:0,unit:'px'},spread:{value:0,unit:'px'}},'font.heading-large.tracking':{value:-1,unit:'px'},'font.heading-large.style':'italic','component.navigation.hover-background':hover,'component.navigation.current-background':colorFromHex('#ffddee'),'component.tab.selected-background':colorFromHex('#ffddaa')});
 for(const selector of ['#field input','#number .en-number-group','#combo input','#select select','#date input','#editor .editor']){
  const el=page.locator(selector).first();await expect(el).toBeVisible();expect((await paint(el)).radius,selector).toBe('3px');
 }
 await expect(page.locator('#field input')).toHaveValue('Keep this value');
 expect((await paint(page.locator('#card .en-card'))).shadow).toContain('4px 4px 0px');
 expect(await page.locator('#card h2').evaluate(el=>getComputedStyle(el).fontStyle)).toBe('italic');
 expect(await page.locator('#card h2').evaluate(el=>getComputedStyle(el).letterSpacing)).toBe('-1px');
 await page.locator('#nav').hover();expect((await paint(page.locator('#nav'))).background).not.toBe((await paint(page.locator('#current'))).background);
 expect((await paint(page.locator('#tab'))).background).toBe('rgb(255, 221, 170)');
 await page.setViewportSize({width:320,height:800});await page.locator('#fixture').evaluate(el=>{el.setAttribute('dir','rtl');(el as HTMLElement).style.fontSize='200%';});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('companion variant scope avoids sibling variants and nested theme boundaries',async({page})=>{
 const theme=await fixture(page);const before=await paint(page.locator('#secondary button'));const nestedBefore=await paint(page.locator('#nested'));
 const companion=createThemeCompanion(theme,{schemaVersion:1,id:'ghost',rules:[{target:'button',variant:'ghost',tokens:{'--en-button-rest-background':'color.selected'}}]});
 await page.addStyleTag({content:companion.css});
 expect((await paint(page.locator('#ghost button'))).background).not.toBe('rgba(0, 0, 0, 0)');
 expect((await paint(page.locator('#secondary button'))).background).toBe(before.background);
 expect((await paint(page.locator('#nested'))).background).toBe(nestedBefore.background);
});

test('forced colors retains held feedback and immediate focus',async({page,browserName})=>{
 test.skip(browserName==='webkit','WebKit runner does not emulate forced colors.');
 await fixture(page);await page.emulateMedia({forcedColors:'active'});const button=page.locator('#ghost button');await button.focus();await page.keyboard.down('Space');
 const held=await paint(button);expect(held.outline).not.toBe('0px');expect(held.color).not.toBe(held.background);await page.keyboard.up('Space');
});

async function relationship(target:Locator,id:string,state:string,appearance:'light'|'dark',focus=false):Promise<RenderedRelationship>{
 return target.evaluate((el,{id,state,appearance,focus})=>{
  const parse=(text:string)=>{
   const rgb=/^rgba?\(([^)]+)\)$/.exec(text),srgb=/^color\(srgb ([^)]+)\)$/.exec(text);if(!rgb&&!srgb)return null;
   const nums=(rgb?.[1]??srgb![1]).split(/[\s,/]+/).map(Number);if(nums.some(n=>!Number.isFinite(n)))return null;
   return {colorSpace:'srgb' as const,components:nums.slice(0,3).map(n=>rgb?n/255:n) as [number,number,number],alpha:nums[3]??1};
  };
  const style=getComputedStyle(el);const foreground=parse(focus?style.outlineColor:style.color);const backgrounds=[];let unknownReason:string|undefined;
  // A positive outline offset leaves the parent surface on both sides of the ring.
  const outside=focus&&(parseFloat(style.outlineOffset)>0||!state.endsWith('inner'));
  let current:Element|null=outside?(el.parentElement??(el.getRootNode() as ShadowRoot).host):el;
  if(focus&&!el.matches(':focus-visible'))unknownReason='Requested focus contour is not visibly focused.';
  while(current){const s=getComputedStyle(current);if(s.backgroundImage!=='none'||s.filter!=='none'||s.mixBlendMode!=='normal'||Number(s.opacity)!==1)unknownReason='Image, filter, blending or group opacity requires pixel/context review.';const color=parse(s.backgroundColor);if(!color){unknownReason='Unsupported computed color';break;}backgrounds.push(color);if(color.alpha===1)break;current=current.parentElement??(current.getRootNode() as ShadowRoot).host??null;}
  return {id,consumer:el.tagName.toLowerCase(),state,appearance,foreground,backgrounds,minimum:focus?3:4.5,...(unknownReason?{unknownReason}:{})};
 },{id,state,appearance,focus});
}

test('catalogue rendered relationship corpus records alpha composites and unknown contexts',async({page},info)=>{
 await fixture(page);const definitions=JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json',import.meta.url),'utf8'));const all:RenderedRelationship[]=[];
 const themes=[{id:'default',inputs:null},...definitions],appearances=['light','dark'] as const;
 const variants=['primary','secondary','ghost','danger'];
 const restCases=[['field','#field input'],['link','#link'],['option-selected','#option'],...['info','success','warning','danger'].flatMap(v=>[[`badge-${v}`,`#badge-${v} .en-badge`],[`toast-${v}`,`#toast-${v} .en-toast`]])];
 const relationshipIds=[...restCases.map(([id])=>id),'field-hover','field-invalid','button-disabled','material','option-selected-hover','option-pressed',...variants.flatMap(variant=>['rest','hover','pressed','focus-outer','focus-inner'].map(state=>`${variant}/${state}`))];
 const expectedIds=themes.flatMap(theme=>appearances.flatMap(mode=>relationshipIds.map(id=>`${theme.id}/${mode}/${id}`)));
 expect(new Set(expectedIds).size).toBe(expectedIds.length);
 for(const definition of themes)for(const mode of appearances){
  const draft=createReviewDraft(definition.baseOptions?.[mode]??{mode});
  if(definition.inputs){const edits=JSON.parse(await readFile(new URL(`../../../tooling/theme-candidates/${definition.inputs[mode]}`,import.meta.url),'utf8'));for(const edit of edits){if(edit.type==='context')draft.setContext({mode:edit.mode,density:edit.density});else if(edit.type==='token')draft.setToken(edit.id,edit.value);else draft.restoreToken(edit.id);}}
  await page.addStyleTag({content:emitThemeCSS(draft.theme,{target:'element',selector:'#fixture',colorScheme:true})});
  await page.mouse.move(0,0);
  for(const [id,selector] of restCases) {
   const target=page.locator(selector);await expect(target).toBeVisible();all.push(await relationship(target,`${definition.id}/${mode}/${id}`,'rest',mode));
  }
  const input=page.locator('#field input');await input.hover();all.push(await relationship(input,`${definition.id}/${mode}/field-hover`,'hover',mode));
  await input.evaluate(el=>el.setAttribute('aria-invalid','true'));all.push(await relationship(input,`${definition.id}/${mode}/field-invalid`,'invalid',mode));await input.evaluate(el=>el.removeAttribute('aria-invalid'));
  const disabled=page.locator('#disabled button');all.push(await relationship(disabled,`${definition.id}/${mode}/button-disabled`,'disabled',mode));
  all.push(await relationship(page.locator('#material'),`${definition.id}/${mode}/material`,'rest',mode));
  const option=page.locator('#option');await option.hover();all.push(await relationship(option,`${definition.id}/${mode}/option-selected-hover`,'selected-hover',mode));await page.mouse.down();all.push(await relationship(option,`${definition.id}/${mode}/option-pressed`,'pressed',mode));await page.mouse.up();
  for(const variant of variants){
   const button=page.locator(`#${variant} button`);
   await page.mouse.move(0,0);all.push(await relationship(button,`${definition.id}/${mode}/${variant}/rest`,'rest',mode));
   await button.hover();all.push(await relationship(button,`${definition.id}/${mode}/${variant}/hover`,'hover',mode));
   await page.mouse.down();all.push(await relationship(button,`${definition.id}/${mode}/${variant}/pressed`,'pressed',mode));await page.mouse.up();
   await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');all.push(await relationship(button,`${definition.id}/${mode}/${variant}/focus-outer`,'focus-adjacent-outer',mode,true));all.push(await relationship(button,`${definition.id}/${mode}/${variant}/focus-inner`,'focus-adjacent-inner',mode,true));
  }
 }
 const results=validateRenderedRelationships(all);await info.attach('rendered-relationships',{body:JSON.stringify({samples:all,results},null,2),contentType:'application/json'});
 expect(results.map(r=>r.id).sort()).toEqual(expectedIds.sort());expect(results.filter(r=>r.status==='unknown').length).toBeGreaterThanOrEqual(themes.length*appearances.length);expect(results.some(r=>r.status==='pass')).toBe(true);
 // This test audits the retained corpus. Findings stay explicit; compiler success
 // must never be converted into a blanket accessibility claim.
 const baseline=results.filter(r=>!r.id.endsWith('button-disabled'));
 expect(baseline.filter(r=>r.status==='fail'),JSON.stringify(baseline.filter(r=>r.status==='fail'))).toEqual([]);
});

test('font delivery measures loaded and explicit fallback metrics',async({page},info)=>{
 await fixture(page);const metrics=await page.evaluate(async()=>{
  const sample='Theme systems — 0123456789 / Menu settings';const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d')!;const result=[];
  for(const family of ['Figtree','Geist','Geist Mono']){await document.fonts.load(`16px "${family}"`,sample);ctx.font=`16px "${family}", system-ui`;const loaded=ctx.measureText(sample).width;ctx.font='16px system-ui';const fallback=ctx.measureText(sample).width;result.push({family,loaded:document.fonts.check(`16px "${family}"`,sample),sample,loadedWidth:loaded,fallbackWidth:fallback,delta:loaded-fallback});}return result;
 });await info.attach('font-fallback-metrics',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});expect(metrics.every(m=>m.loaded&&m.loadedWidth>0&&m.fallbackWidth>0)).toBe(true);
});

test('independent popup/dialog/toast profiles and composite anatomy remain connected',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await fixture(page,{'component.popup.enter-duration':{value:110,unit:'ms'},'component.dialog.enter-duration':{value:310,unit:'ms'},'component.toast.enter-duration':{value:210,unit:'ms'},'component.choice.size':{value:22,unit:'px'},'component.switch.inline-size':{value:48,unit:'px'},'component.switch.block-size':{value:28,unit:'px'},'component.switch.thumb-size':{value:18,unit:'px'}});
 await page.locator('#fixture').evaluate(el=>{el.insertAdjacentHTML('beforeend','<en-dialog id="motion-dialog" label="Motion"><en-button>Close</en-button></en-dialog><en-checkbox id="choice" label="Choice"></en-checkbox><en-switch id="switch" label="Switch"></en-switch>');const combo=document.getElementById('combo') as any;combo.items=[{value:'one',label:'One'}];});
 await page.locator('#combo .en-combobox-trigger').click();await expect(page.locator('#combo .en-combobox-popup')).toBeVisible();
 const discrete=await page.evaluate(()=>CSS.supports('transition-behavior','allow-discrete')&&CSS.supports('overlay','auto'));
 const popupDuration=await page.locator('#combo .en-combobox-popup').evaluate(el=>getComputedStyle(el).transitionDuration);
 if(discrete)expect(popupDuration).toContain('0.11s');else{expect(popupDuration).toBe('0s');info.annotations.push({type:'platform-limit',description:'Native display/overlay transitions unavailable; popup/dialog behavior remains immediate.'});}
 await page.keyboard.press('Escape');await page.locator('#motion-dialog').evaluate((el:any)=>el.show());
 if(discrete)expect(await page.locator('#motion-dialog dialog').evaluate(el=>getComputedStyle(el).getPropertyValue('--_en-surface-duration').trim())).toContain('310ms');
 else await expect(page.locator('#motion-dialog dialog')).toBeVisible();
 await page.locator('#motion-dialog').evaluate((el:any)=>el.hide());
 expect(await page.locator('#toast-info .en-toast').evaluate(el=>getComputedStyle(el).animationDuration)).toBe('0.21s');
 expect(await page.locator('#choice input').evaluate(el=>getComputedStyle(el).width)).toBe('22px');
 expect(await page.locator('#switch input').evaluate(el=>getComputedStyle(el).width)).toBe('48px');
});

test('no-hover pointer hold and touch activation retain target geometry',async({browser},info)=>{
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});const page=await context.newPage();
 try{await fixture(page);expect(await page.evaluate(()=>matchMedia('(hover: hover)').matches)).toBe(false);
 const button=page.locator('#secondary button');await button.scrollIntoViewIfNeeded();const before=await paint(button);
 await button.hover();expect((await paint(button)).background).toBe(before.background);await page.mouse.down();
 await expect.poll(async()=>(await paint(button)).background).not.toBe(before.background);expect((await paint(button)).rect).toEqual(before.rect);expect(before.rect.height).toBeGreaterThanOrEqual(44);await page.mouse.up();
 await page.locator('#fixture').evaluate(el=>{el.insertAdjacentHTML('beforeend','<button id=touch-probe>Native touch probe</button><span id=shadow-touch-probe>Minimal slotted button</span>');});
 await page.locator('#shadow-touch-probe').evaluate(el=>{el.attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>';});
 const nativeProbe=page.locator('#touch-probe');await nativeProbe.evaluate(el=>el.addEventListener('touchstart',()=>el.setAttribute('data-touched','yes')));await nativeProbe.tap();await expect(nativeProbe).toHaveAttribute('data-touched','yes');
 const probe=page.locator('#shadow-touch-probe button');
 for(const target of [probe,button])await target.evaluate(el=>{el.addEventListener('touchstart',()=>el.setAttribute('data-touched','yes'));el.addEventListener('click',()=>el.setAttribute('data-clicked','yes'));});
 await probe.tap();await button.tap();
 if(await probe.getAttribute('data-touched')==='yes')await expect(button).toHaveAttribute('data-touched','yes');else{info.annotations.push({type:'platform-limit',description:'Touch protocol did not reach a minimal slotted shadow probe; component delivery is recorded independently. Real-device shadow touch remains unqualified.'});}
 if(await probe.getAttribute('data-clicked')==='yes')await expect(button).toHaveAttribute('data-clicked','yes');
 else{info.annotations.push({type:'platform-limit',description:'Touch protocol did not synthesize click on a minimal slotted shadow probe; component delivery is recorded independently. Real-device touch activation remains unqualified.'});}
 await info.attach('touch-protocol-delivery',{body:JSON.stringify({nativeTouch:await nativeProbe.getAttribute('data-touched'),probeTouch:await probe.getAttribute('data-touched'),componentTouch:await button.getAttribute('data-touched'),probeClick:await probe.getAttribute('data-clicked'),componentClick:await button.getAttribute('data-clicked')}),contentType:'application/json'}); }finally{await context.close();}
});


test('default discrete families visibly respond while held and disabled tabs do not',async({page},info)=>{
 await fixture(page);await page.locator('#fixture').evaluate(el=>el.insertAdjacentHTML('beforeend',`<button id="press-segment" class="en-segmented-item">Segment</button><button id="press-accordion" class="en-accordion-trigger">Expand</button><button id="press-rating" class="en-rating-item">Star</button><en-tab id="disabled-tab" disabled>Disabled tab</en-tab>`));
 for(const selector of ['#number .en-number-step','#combo .en-combobox-trigger','#option','#tab','#nav','#current','#press-segment','#press-accordion','#press-rating']){
  const target=page.locator(selector).first();await target.hover();const before=await paint(target);await page.mouse.down();
  await info.attach(selector.replace(/[^a-z]+/g,'-'),{body:JSON.stringify({before,held:await paint(target),active:await target.evaluate(el=>el.matches(':active'))}),contentType:'application/json'});
  await expect.poll(async()=>{const held=await paint(target);return held.background!==before.background||held.shadow!==before.shadow||held.borderColor!==before.borderColor;},selector).toBe(true);
  const held=await paint(target);expect(held.background!==before.background||held.shadow!==before.shadow||held.borderColor!==before.borderColor,selector).toBe(true);expect(held.rect).toEqual(before.rect);await target.evaluate(el=>el.addEventListener('click',e=>e.preventDefault(),{once:true}));await page.mouse.up();
 }
 const option=page.locator('#option');await page.mouse.move(0,0);await option.evaluate(el=>{el.removeAttribute('aria-selected');el.setAttribute('data-active','');});expect((await paint(option)).background).toBe(await page.locator('#fixture').evaluate(el=>getComputedStyle(el).getPropertyValue('--en-color-surface-subtle').trim()).then(value=>page.evaluate(value=>{const probe=document.createElement('span');probe.style.background=value;document.body.append(probe);const color=getComputedStyle(probe).backgroundColor;probe.remove();return color;},value)));
 const disabled=page.locator('#disabled-tab .en-tab');await disabled.hover();const before=await paint(disabled);await page.mouse.down();expect((await paint(disabled)).background).toBe(before.background);await page.mouse.up();
 const link=page.locator('#link');await link.hover();const thickness=await link.evaluate(el=>getComputedStyle(el).textDecorationThickness);await page.mouse.down();expect(await link.evaluate(el=>getComputedStyle(el).textDecorationThickness)).not.toBe(thickness);await page.mouse.up();
});

for(const kind of ['checkbox','radio','switch'])test(`default ${kind} held feedback preserves its native target`,async({page})=>{
 await fixture(page);await page.locator('#fixture').evaluate((el,kind)=>el.insertAdjacentHTML('afterbegin',`<en-${kind} id="held-choice" label="Choice"></en-${kind}>`),kind);
 const target=page.locator('#held-choice input');await target.hover();const before=await paint(target);await page.mouse.down();
 await expect.poll(async()=>{const held=await paint(target);return held.background!==before.background||held.borderColor!==before.borderColor||held.shadow!==before.shadow;}).toBe(true);
 expect((await paint(target)).rect).toEqual(before.rect);await page.mouse.up();
});
