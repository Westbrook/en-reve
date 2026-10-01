import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, firefox, webkit } from '@playwright/test';
import { resolveTheme, createThemePair, emitThemeCSS, emitThemePairCSS, emitPropertyRegistrations, createThemePatchPlan, emitThemePatchCSS, colorFromHex, styleCustomizationContracts } from '../../dist/index.js';
const output = resolve(process.env.SCOPE_TEST_OUTPUT_DIR ?? 'node_modules/.cache/theme-04-scopes');
await mkdir(output,{recursive:true});
const cssFile = name => readFile(new URL(`../../../styles/dist/${name}.css`,import.meta.url),'utf8');
const styles = await cssFile('foundations') + await cssFile('buttons');
const base = resolveTheme();
const pair = createThemePair({name:'host-demo',light:resolveTheme({pins:{'radius.control':{value:3,unit:'px'}}}),dark:resolveTheme({mode:'dark',pins:{'radius.control':{value:17,unit:'px'}}})});
const roomy = createThemePatchPlan(base,{changes:{'rhythm.base':{value:.5,unit:'rem'}}});
const button = (id,size='medium') => `<button id="${id}" class="en-foundation en-button" data-size="${size}">Continue</button>`;
const results = [];
for (const [engine,type] of Object.entries({chromium,firefox,webkit})) {
  const browser = await type.launch();
  try {
    for (const registered of [false,true]) {
      const page = await browser.newPage();
      const registrations = registered ? emitPropertyRegistrations(base) : '';
      const root = registrations + emitThemeCSS(base,{target:'root'});
      const patches = emitThemeCSS(roomy.theme,{selector:'#exact',kind:'partial',tokenIds:['rhythm.base']})
        + emitThemePatchCSS(roomy,base,{selector:'#patch'});
      await page.setContent(`<style>${root}${patches}${styles}html{font-size:16px}</style>${button('outside')}<section id="exact">${button('exact-button')}</section><section id="patch">${button('patch-button')}</section>`);
      const paddings = await page.locator('button').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).paddingInlineStart));
      assert.deepEqual(paddings,['12px','12px','24px'],`${engine} rhythm ${registered}`);
      results.push({engine,registered,case:'exact-versus-dependent',paddings});
      const pinned = resolveTheme({pins:{'component.button.radius':{value:29,unit:'px'},'space.control-inline':'{space.3}'}});
      const release = createThemePatchPlan(pinned,{changes:{'rhythm.base':{value:.5,unit:'rem'}},clearOverrides:['--en-button-radius']});
      await page.setContent(`<style>${registrations}${emitThemeCSS(pinned,{target:'root'})}${emitThemePatchCSS(release,pinned,{selector:'#released'})}${styles}</style>${button('pinned','large')}<section id="released">${button('released-button','large')}</section>`);
      const radii = await page.locator('button').evaluateAll(nodes=>nodes.map(node=>({radius:getComputedStyle(node).borderRadius,padding:getComputedStyle(node).paddingInlineStart})));
      assert.deepEqual(radii,[{radius:'29px',padding:'15px'},{radius:'10px',padding:'15px'}],`${engine} release and preserve pin`);
      results.push({engine,registered,case:'clear-size-fallback-and-alias-pin',radii});
      const colorPlan = createThemePatchPlan(base,{changes:{'palette.action':colorFromHex('#9342cb')}});
      await page.setContent(`<style>${root}${emitThemePatchCSS(colorPlan,base,{selector:'#paint'})}.hover{background:var(--en-color-action-hover)}</style><span class="hover" id="old">Old</span><section id="paint"><span class="hover" id="new">New</span></section>`);
      const colors = await page.locator('.hover').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundColor));
      assert.notEqual(colors[0],colors[1]);
      results.push({engine,registered,case:'recomputed-color',colors});
      await page.close();
    }
    for (const fallback of [false,true]) for (const system of ['light','dark']) {
      const page = await browser.newPage({colorScheme:system});
      let hostCSS = emitThemePairCSS(pair,{target:'shadow-host'});
      if (fallback) hostCSS = hostCSS.split('  @supports')[0]+'}\n';
      await page.setContent(`<style>${emitPropertyRegistrations(base)}</style><div id="host"></div>`);
      await page.evaluate(({css,styles,html})=>{document.querySelector('#host').attachShadow({mode:'open'}).innerHTML=`<style>${css}${styles}</style>${html}`;},{css:hostCSS,styles,html:button('host-button')});
      for (const appearance of ['auto','light','dark']) {
        await page.locator('#host').evaluate((node,value)=>node.setAttribute('data-en-appearance',value),appearance);
        const actual = await page.locator('#host-button').evaluate(node=>({radius:getComputedStyle(node).borderRadius,scheme:getComputedStyle(node).colorScheme}));
        const dark = appearance === 'dark' || appearance === 'auto' && system === 'dark';
        assert.equal(actual.radius,dark?'17px':'3px',`${engine} ${system} ${appearance} fallback=${fallback}`);
        assert.equal(actual.scheme,appearance==='auto'?'light dark':appearance);
        results.push({engine,fallback,system,appearance,...actual});
      }
      await page.close();
    }
    // THEME-03's CSS-only state refinement can be released independently.
    if (styleCustomizationContracts.some(record=>record.cssName==='--en-button-hover-background')) {
      const page = await browser.newPage();
      const clear = createThemePatchPlan(base,{clearOverrides:['--en-button-hover-background']});
      await page.setContent(`<style>${emitPropertyRegistrations(base)}${emitThemeCSS(base,{target:'root'})}${emitThemePatchCSS(clear,base,{selector:'#clear-state'})}${styles}#parent{--en-button-background:rgb(80,40,120);--en-button-hover-background:rgb(160,40,60)}</style><section id="parent">${button('inherited-state')}<div id="clear-state">${button('cleared-state')}</div></section>`);
      await page.locator('#inherited-state').hover();
      await page.waitForTimeout(250);
      assert.equal(await page.locator('#inherited-state').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(160, 40, 60)');
      await page.locator('#cleared-state').hover();
      await page.waitForTimeout(250);
      assert.equal(await page.locator('#cleared-state').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(80, 40, 120)');
      results.push({engine,case:'theme-03-state-clear',inherited:'rgb(160, 40, 60)',cleared:'rgb(80, 40, 120)'});
      await page.close();
    }
    // Native top-layer presentation retains ancestry; real reparenting does not.
    {
      const page = await browser.newPage();
      await page.setContent(`<style>${emitThemeCSS(base,{target:'root'})}${emitThemePatchCSS(roomy,base,{selector:'#region'})}.surface{padding:var(--en-space-control-inline)}</style><section id="region"><dialog class="surface">Modal</dialog><div class="surface" popover>Popover</div></section>`);
      const read = () => page.locator('.surface').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).paddingInlineStart));
      await page.evaluate(()=>{document.querySelector('dialog').showModal();document.querySelector('[popover]').showPopover();});
      assert.deepEqual(await read(),['24px','24px']);
      const smaller = createThemePatchPlan(base,{changes:{'rhythm.base':{value:.375,unit:'rem'}}});
      await page.addStyleTag({content:emitThemePatchCSS(smaller,base,{selector:'#region'})});
      assert.deepEqual(await read(),['18px','18px']);
      await page.evaluate(()=>{const dialog=document.querySelector('dialog');dialog.close();document.body.append(dialog);dialog.showModal();});
      assert.equal(await page.locator('dialog').evaluate(node=>getComputedStyle(node).paddingInlineStart),'12px');
      results.push({engine,case:'live-native-overlays-and-real-reparent',before:'24px',updated:'18px',reparented:'12px'});
      await page.close();
    }
    // A document selector cannot select an internal shadow-tree boundary.
    {
      const page = await browser.newPage();
      const local = emitThemePatchCSS(roomy,base,{selector:'#inside'});
      await page.setContent(`<style>${emitThemeCSS(base,{target:'root'})}${local}</style><div id="shadow"></div>`);
      await page.evaluate(({styles,html})=>{document.querySelector('#shadow').attachShadow({mode:'open'}).innerHTML=`<style>${styles}</style><section id="inside">${html}</section>`;},{styles,html:button('inner-button')});
      assert.equal(await page.locator('#inner-button').evaluate(node=>getComputedStyle(node).paddingInlineStart),'12px');
      await page.locator('#shadow').evaluate((host,css)=>{const sheet=document.createElement('style');sheet.textContent=css;host.shadowRoot.append(sheet);},local);
      assert.equal(await page.locator('#inner-button').evaluate(node=>getComputedStyle(node).paddingInlineStart),'24px');
      results.push({engine,case:'internal-boundary-stylesheet-ownership',before:'12px',after:'24px'});
      await page.close();
    }
    // Partial inheritance and full resets consume the current installed registry,
    // including THEME-03 state hooks when integrated.
    const hooks = styleCustomizationContracts.filter(record=>record.reset==='theme').map(record=>record.cssName);
    const page = await browser.newPage();
    await page.setContent(`<style>${emitPropertyRegistrations(base)}${emitThemeCSS(base,{selector:'#full, #reference'})}${emitThemeCSS(base,{selector:'#partial',kind:'partial',tokenIds:[]})}#outer{${hooks.map(name=>`${name}:19px`).join(';')}}</style><div id="reference"></div><section id="outer"><div id="full"></div><div id="partial"></div></section>`);
    const reset = await page.evaluate(names=>names.map(name=>[name,getComputedStyle(document.querySelector('#full')).getPropertyValue(name).trim(),getComputedStyle(document.querySelector('#partial')).getPropertyValue(name).trim(),getComputedStyle(document.querySelector('#reference')).getPropertyValue(name).trim()]),hooks);
    for (const [name,full,partial,reference] of reset) {assert.equal(full,reference,name);assert.equal(partial,'19px',name);}
    results.push({engine,case:'registry-resets',hookCount:hooks.length});
    await page.close();
  } finally { await browser.close(); }
}
await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));
console.log(`${results.length} browser scenarios passed in Chromium, Firefox and WebKit. Evidence: ${output}`);
