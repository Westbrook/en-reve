import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {densityNames,resolveTheme} from '../../dist/index.js';

const defaultCSS=await readFile(new URL('../../dist/default.css',import.meta.url),'utf8');
const namedCSS=(await Promise.all(['light','dark'].flatMap(mode=>densityNames.map(density=>{
  const {name}=resolveTheme({mode,density});return readFile(new URL(`../../dist/themes/${name}.css`,import.meta.url),'utf8');
})))).join('\n');
const fallbackCSS=defaultCSS.replace(/  @supports \(color: light-dark\(white, black\)\) \{\n    [\s\S]*?\n    \}\n  \}\n/g,'');
const rules='.surface{background:var(--en-color-surface);color:var(--en-color-text);padding:16px}.control{box-sizing:border-box;font:16px/1.5 sans-serif;padding:0 12px;border:1px solid transparent;min-height:var(--en-size-control-min);background:var(--en-button-background,var(--en-color-action));color:var(--en-color-on-action)}';
const body=`<main class="surface"><button id="root-button" class="control">Default action</button>
<theme-default-probe id="shadow"><template shadowrootmode="open"><style>${rules}</style><div class="surface"><button class="control">Shadow action</button><input aria-label="Native draft" value="Accepted"></div></template></theme-default-probe>
<section id="dark" data-en-theme="dark" data-en-appearance="light" class="surface"><button class="control">Dark action</button>
<section id="compact" data-en-theme="light-compact" data-en-appearance="dark" class="surface"><button class="control">Compact light action</button></section></section>
<section id="spacious" data-en-theme="dark-spacious" class="surface"><button class="control">Spacious dark action</button></section></main>`;

async function fixture(page,{fallback=false,rootAttributes=''}={}){
  await page.route('**/__system-default',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en" ${rootAttributes}><meta charset="utf-8"><title>Generated system default CSS</title><style>${fallback?fallbackCSS:defaultCSS}\n${namedCSS}</style><style>${rules}</style>${body}</html>`}));
  await page.goto('/__system-default');
}
const fill={light:'rgb(36, 87, 214)',dark:'rgb(170, 193, 255)'};
async function evidence(testInfo,browser,page,label){
  const values=await page.locator('#root-button,#dark > button,#compact > button,#spacious > button').evaluateAll(nodes=>nodes.map(node=>{const style=getComputedStyle(node);return {id:node.id||node.textContent,color:style.color,background:style.backgroundColor,minHeight:style.minHeight,scheme:style.colorScheme};}));
  await testInfo.attach(label,{body:JSON.stringify({engine:testInfo.project.name,version:browser.version(),values},null,2),contentType:'application/json'});
}

test('generated default follows system before application JS and preserves native shadow editing',async({page,browser},testInfo)=>{
  await page.emulateMedia({colorScheme:'light'});await fixture(page);
  await expect(page.locator('html')).toHaveCSS('color-scheme','light dark');
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.light);
  const shadow=page.locator('#shadow');await expect(shadow.getByRole('button')).toHaveCSS('background-color',fill.light);
  const editor=shadow.getByRole('textbox',{name:'Native draft'});await editor.fill('Keep this native draft');
  const initial=await editor.elementHandle();await editor.evaluate(input=>input.setSelectionRange(2,7));
  await page.emulateMedia({colorScheme:'dark'});
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.dark);
  await expect(shadow.getByRole('button')).toHaveCSS('background-color',fill.dark);
  await expect(editor).toHaveValue('Keep this native draft');await expect(editor).toBeFocused();
  expect(await editor.evaluate((input,initial)=>input===initial,initial)).toBe(true);
  expect(await editor.evaluate(input=>[input.selectionStart,input.selectionEnd])).toEqual([2,7]);
  await evidence(testInfo,browser,page,'generated-auto.json');await initial.dispose();
});

test('explicit root appearance and independent named scopes preserve density and override masks',async({page,browser},testInfo)=>{
  await page.emulateMedia({colorScheme:'dark'});await fixture(page);
  await page.locator('html').evaluate(root=>{root.dataset.enAppearance='light';root.style.setProperty('--en-button-background','rgb(255, 0, 0)');});
  await expect(page.locator('html')).toHaveCSS('color-scheme','light');
  await expect(page.locator('#root-button')).toHaveCSS('background-color','rgb(255, 0, 0)');
  await expect(page.locator('#dark > button')).toHaveCSS('background-color',fill.dark);
  await expect(page.locator('#dark')).toHaveCSS('color-scheme','dark');
  await expect(page.locator('#compact > button')).toHaveCSS('background-color',fill.light);
  await expect(page.locator('#compact')).toHaveCSS('color-scheme','light');
  await expect(page.locator('#root-button')).toHaveCSS('min-height','40px');
  await expect(page.locator('#dark > button')).toHaveCSS('min-height','40px');
  await expect(page.locator('#compact > button')).toHaveCSS('min-height','32px');
  await expect(page.locator('#spacious > button')).toHaveCSS('min-height','48px');
  await page.locator('#compact > button').evaluate(button=>button.style.setProperty('--en-button-background','rgb(0, 100, 0)'));
  await page.emulateMedia({colorScheme:'light'});await page.locator('html').evaluate(root=>root.dataset.enAppearance='dark');
  await expect(page.locator('#compact > button')).toHaveCSS('background-color','rgb(0, 100, 0)');
  await expect(page.locator('#dark')).toHaveCSS('color-scheme','dark');
  await evidence(testInfo,browser,page,'named-isolation.json');
});

test('named theme on the root wins over auto and opposite appearance in the documented stylesheet order',async({page,browser},testInfo)=>{
  await page.emulateMedia({colorScheme:'dark'});
  await fixture(page,{rootAttributes:'data-en-theme="light-compact" data-en-appearance="dark"'});
  await expect(page.locator('html')).toHaveCSS('color-scheme','light');
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.light);
  await expect(page.locator('#root-button')).toHaveCSS('min-height','32px');
  await page.locator('html').evaluate(root=>{root.dataset.enTheme='dark-spacious';root.dataset.enAppearance='light';});
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveCSS('color-scheme','dark');
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.dark);
  await expect(page.locator('#root-button')).toHaveCSS('min-height','48px');
  await evidence(testInfo,browser,page,'root-named-precedence.json');
});

test('generated media fallback without light-dark enhancement keeps auto and explicit behavior',async({page,browser},testInfo)=>{
  expect(fallbackCSS).not.toContain('@supports');
  await page.emulateMedia({colorScheme:'light'});await fixture(page,{fallback:true});
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.light);
  await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.dark);
  await page.locator('html').evaluate(root=>root.dataset.enAppearance='light');
  await expect(page.locator('#root-button')).toHaveCSS('background-color',fill.light);
  await expect(page.locator('#dark > button')).toHaveCSS('background-color',fill.dark);
  await expect(page.locator('#compact > button')).toHaveCSS('background-color',fill.light);
  await evidence(testInfo,browser,page,'generated-fallback.json');
});
