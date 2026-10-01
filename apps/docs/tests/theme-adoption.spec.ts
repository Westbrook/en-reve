import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createReviewDraft,emitThemeCSS,resolveTheme,validateRenderedRelationships,type RenderedRelationship} from '@en-reve/tokens';
const definitions=JSON.parse(await readFile(new URL('../../../tooling/theme-candidates/definitions.json',import.meta.url),'utf8'));
const nativeCSS=(await Promise.all(['controls','selection','navigation','surfaces'].map(n=>readFile(new URL(`../../../packages/styles/dist/${n}.css`,import.meta.url),'utf8')))).join('\n');
async function draftFor(d:any,mode:'light'|'dark'){
 const draft=createReviewDraft(d.baseOptions[mode]);for(const e of JSON.parse(await readFile(new URL(`../../../tooling/theme-candidates/${d.inputs[mode]}`,import.meta.url),'utf8'))){if(e.type==='context')draft.setContext({mode:e.mode,density:e.density});else if(e.type==='token')draft.setToken(e.id,e.value);else draft.restoreToken(e.id);}return draft;
}
async function canonical(page:Page,property:string,value:string){return page.evaluate(({property,value})=>{const el=document.createElement('span');el.style.setProperty(property,value);document.body.append(el);const out=getComputedStyle(el).getPropertyValue(property);el.remove();return out;},{property,value});}
async function paint(page:Page,selector:string,property:string){return page.locator(selector).evaluate((e,p)=>getComputedStyle(e).getPropertyValue(p),property);}
for(const d of definitions)test(`${d.id}: shipped variants, family anatomy, auto appearance and portable CSS`,async({page},info)=>{
 await page.goto(`/showcase?theme=${d.id}&appearance=light&progress-report`);
 await expect(page.locator('html')).toHaveAttribute('data-en-theme',d.id);
 await expect(page.getByRole('button',{name:'Download CSS',exact:true})).toBeEnabled();
 await page.addStyleTag({content:nativeCSS+emitThemeCSS(resolveTheme({name:'nested'}))});
 await page.evaluate(()=>{const fixture=document.createElement('section');fixture.id='adoption';fixture.style.cssText='padding:24px;background:var(--en-color-surface);color:var(--en-color-text)';fixture.innerHTML=`<div>${['primary','secondary','ghost','danger'].map(v=>`<en-button id="adopt-${v}" variant="${v}">${v} action</en-button><button id="native-${v}" class="en-button" data-variant="${v}">${v} native</button>`).join('')}</div><en-text-field id="adopt-field" label="Adoption field" value="Keep me"></en-text-field><en-checkbox id="adopt-choice" label="Choice"></en-checkbox><en-switch id="adopt-switch" label="Switch"></en-switch><en-card id="adopt-card">Card</en-card><button id="adopt-tab" class="en-tab" aria-selected="true">Selected tab</button><section data-en-theme="nested"><button id="adopt-nested" class="en-button" data-variant="secondary">Nested</button></section>`;document.body.append(fixture);});
 const relationships:RenderedRelationship[]=[];
 for(const mode of ['light','dark'] as const){
  await page.locator('.showcase-theme en-segmented-control').getByRole('radio',{name:mode==='light'?'Light':'Dark',exact:true}).press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-en-appearance',mode);
  const draft=await draftFor(d,mode);const tokens=draft.theme.tokens;
  for(const variant of ['primary','secondary','ghost','danger'])for(const prefix of ['adopt','native']){
   const selector=prefix==='adopt'?`#adopt-${variant} button`:`#native-${variant}`;const button=page.locator(selector);
   for(const state of ['rest','hover','pressed']){
    if(state==='rest')await page.mouse.move(0,0);else await button.hover();
    const before=await button.boundingBox();if(state==='pressed')await page.mouse.down();
    for(const [prop,css] of [['background','background-color'],['color','color']]){
     const expected=await canonical(page,css,tokens[`theme.button.${variant}.${state}-${prop}`].cssValue);
     await expect.poll(()=>paint(page,selector,css)).toBe(expected);
    }
    if(state==='pressed'){expect(await button.boundingBox()).toEqual(before);await page.mouse.up();}
    // Validate actual themed colors over the concrete surface used here.
    relationships.push({id:`${mode}/${prefix}/${variant}/${state}`,consumer:selector,state,appearance:mode,foreground:tokens[`theme.button.${variant}.${state}-color`].value as any,backgrounds:[tokens[`theme.button.${variant}.${state}-background`].value as any,tokens['color.surface'].value as any],minimum:4.5});
   }
  }
  expect(await paint(page,'#adopt-field input','border-radius')).toBe(await canonical(page,'border-radius',tokens['component.input.radius'].cssValue));
  await expect(page.locator('#adopt-field input')).toHaveValue('Keep me');
  expect(await paint(page,'#adopt-card .en-card','box-shadow')).toBe(await canonical(page,'box-shadow',tokens['component.card.shadow'].cssValue));
  expect(await paint(page,'#adopt-tab','background-color')).toBe(await canonical(page,'background-color',tokens['component.tab.selected-background'].cssValue));
  const nested=await paint(page,'#adopt-nested','background-color');expect(nested).toBe(await canonical(page,'background-color',resolveTheme().tokens['color.surface-subtle'].cssValue));
  // Automatic appearance must install the same companions as explicit branches.
  await page.emulateMedia({colorScheme:mode});await page.locator('html').evaluate(el=>el.setAttribute('data-en-appearance','auto'));
  expect(await paint(page,'#adopt-secondary button','background-color')).toBe(await canonical(page,'background-color',tokens['theme.button.secondary.rest-background'].cssValue));
 }
 expect(validateRenderedRelationships(relationships).filter(r=>r.status!=='pass')).toEqual([]);
 await info.attach('variant-relationships',{body:JSON.stringify(relationships,null,2),contentType:'application/json'});
 await page.emulateMedia({reducedMotion:'no-preference'});const button=page.locator('#adopt-primary button');await button.hover();await page.mouse.down();
 const scale=d.id==='astryx-inspired'?'0.98':['spectrum-inspired','kinetic'].includes(d.id)?'0.94':'1';
 await expect.poll(()=>paint(page,'#adopt-primary button','scale')).toBe(scale);await page.mouse.up();
 await page.emulateMedia({reducedMotion:'reduce'});await button.hover();await page.mouse.down();expect(await paint(page,'#adopt-primary button','scale')).toBe('none');await page.mouse.up();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSS',exact:true}).click();const file=await download;const path=info.outputPath(`${d.id}.css`);await file.saveAs(path);const css=await readFile(path,'utf8');expect(css).toContain('prefers-color-scheme: dark');expect(css).toContain(`[data-en-theme="${d.id}"]`);
 // Install the actual download in a clean native document, independent of the app.
 await page.setContent(`<style>${nativeCSS}\n${css}</style><main data-en-theme="${d.id}" data-en-appearance="auto"><button class="en-button" data-variant="secondary">Standalone</button></main>`);
 for(const mode of ['light','dark'] as const){await page.emulateMedia({colorScheme:mode});const t=(await draftFor(d,mode)).theme.tokens;expect(await paint(page,'button','background-color')).toBe(await canonical(page,'background-color',t['theme.button.secondary.rest-background'].cssValue));}
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('button').hover();await page.mouse.down();await expect.poll(()=>paint(page,'button','scale')).toBe(scale);await page.mouse.up();
 await page.locator('button').evaluate(el=>el.setAttribute('aria-haspopup','menu'));await page.locator('button').hover();await page.mouse.down();await expect.poll(()=>paint(page,'button','scale')).toBe(d.id==='shadcn-inspired'?'1':scale);await expect.poll(()=>paint(page,'button','translate')).toBe(d.id==='shadcn-inspired'?'0px':d.id==='vellum'?'0px 0.5px':d.id==='signal'?'0px 2px':'0px');await page.mouse.up();
});

test('changing and resetting presets removes variant rules without replacing controls',async({page})=>{
 await page.goto('/showcase?theme=astryx-inspired&appearance=light');await expect(page.locator('html')).toHaveAttribute('data-en-theme','astryx-inspired');
 await page.locator('#project-title input').fill('Retained edit');const handle=await page.locator('#project-title input').elementHandle();
 await page.locator('#showcase-theme').getByRole('combobox').selectOption('radix-inspired');await expect(page.locator('html')).toHaveAttribute('data-en-theme','radix-inspired');await expect(page.locator('#project-title input')).toHaveValue('Retained edit');expect(await handle!.evaluate(e=>e.isConnected)).toBe(true);
 await page.getByRole('button',{name:'Reset theme',exact:true}).click();await expect(page.locator('html')).not.toHaveAttribute('data-en-theme','radix-inspired');await expect(page.locator('#project-title input')).toHaveValue('Retained edit');
});
