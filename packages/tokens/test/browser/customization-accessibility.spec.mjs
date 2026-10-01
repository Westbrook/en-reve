import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, colorFromHex, validateManagedValue } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';

const part = (page, id, name = 'control') => page.locator(`#adapt-${id}${id === 'card' ? ' >' : ''} [part~="${name}"]`);
const longLabel = 'إعدادات مساحة العمل المشتركة وتنسيق اللوحة لجميع المتعاونين';
function theme(tinted = false) {
  const pins = {
    'font.ui.size': { value: .875, unit: 'rem' },
    'font.ui.line-height': 10 / 7,
    'size.icon': { value: 1, unit: 'rem' },
    'component.button.radius': '{radius.pill}',
    'radius.control': { value: .25, unit: 'rem' },
    'component.input.background': colorFromHex(tinted ? '#eef2fa' : '#ffffff'),
    'component.card.background': colorFromHex(tinted ? '#f5ebd4' : '#ffffff'),
  };
  const base = resolveTheme({ density: 'compact' });
  for (const [id, value] of Object.entries(pins)) validateManagedValue(base, id, value);
  return resolveTheme({ density: 'compact', pins });
}
const cssFor = candidate => emitThemeCSS(candidate, { selector: ':where(#adaptation)' });

async function fixture(page) {
  await page.evaluate(async () => {
    const tags = ['button', 'text-field', 'number-field', 'slider', 'checkbox', 'segmented-control', 'icon', 'card'];
    await Promise.all(tags.map(tag => customElements.whenDefined(`en-${tag}`)));
    const section = document.createElement('section'); section.id = 'adaptation';
    section.innerHTML = `<button id="adapt-before" type="button">Before adaptation</button>
      <form id="adapt-form"><en-card id="adapt-card"><div class="adapt-grid">
        <en-text-field id="adapt-text" name="title" label="Workspace title" required value="Shared canvas" description="Use a title collaborators recognize."></en-text-field>
        <en-number-field id="adapt-number" name="copies" label="Copies" min="0" max="100" value="17"></en-number-field>
        <en-slider id="adapt-slider" name="opacity" min="0" max="100" value="64" editable><span slot="label">Opacity</span></en-slider>
        <en-checkbox id="adapt-choice" name="shared"><span slot="label">Share with collaborators</span></en-checkbox>
        <en-segmented-control id="adapt-segmented" name="format" label="Paper format" value="a4"></en-segmented-control>
        <en-button id="adapt-action"><en-icon id="adapt-icon" slot="prefix" name="check"></en-icon><span slot="label">Apply settings</span></en-button>
      </div></en-card></form><button id="adapt-after" type="button">After adaptation</button>`;
    section.querySelector('en-segmented-control').items = [{ value: 'a4', label: 'A4' }, { value: 'a3', label: 'A3' }];
    document.body.append(section);
    await Promise.all([...section.querySelectorAll('*')].map(element => element.updateComplete));
  });
  await page.addStyleTag({ content: `html { font-size:16px; }
    #adaptation { box-sizing:border-box; inline-size:min(100%,36rem); margin:2rem auto; padding:1rem; }
    #adaptation .adapt-grid { display:grid; min-inline-size:0; gap:1rem; }
    #adaptation en-button { justify-self:start; max-inline-size:100%; }` });
}
async function metrics(locator) {
  return locator.evaluate(element => {
    const s = getComputedStyle(element); const r = element.getBoundingClientRect();
    return { width:r.width, height:r.height, font:parseFloat(s.fontSize), line:parseFloat(s.lineHeight),
      blockPadding:parseFloat(s.paddingBlockStart)+parseFloat(s.paddingBlockEnd),
      blockBorder:parseFloat(s.borderBlockStartWidth)+parseFloat(s.borderBlockEndWidth),
      scrollWidth:element.scrollWidth, clientWidth:element.clientWidth,
      scrollHeight:element.scrollHeight, clientHeight:element.clientHeight,
      color:s.color, background:s.backgroundColor, border:s.borderTopColor, radius:s.borderTopLeftRadius,
      outline:s.outlineStyle, outlineWidth:parseFloat(s.outlineWidth), outlineColor:s.outlineColor,
      focusVisible:element.matches(':focus-visible') };
  });
}
function contrast(first, second) {
  const luminance = color => {
    const values = color.match(/[\d.]+/g).map(Number);
    expect(values.length === 3 || values[3] === 1, `opaque observed color: ${color}`).toBeTruthy();
    return values.slice(0,3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((sum, v, index) => sum + v * [.2126,.7152,.0722][index], 0);
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
async function keyboardFocusField(page) {
  await page.locator('#adapt-before').focus();
  await page.keyboard.press('Tab');
  await expect(part(page,'text')).toBeFocused();
  const actual = await metrics(part(page,'text'));
  expect(actual.focusVisible).toBe(true);
  expect(actual.outline).toBe('solid');
  expect(actual.outlineWidth).toBeGreaterThanOrEqual(2);
  return actual;
}
async function record(testInfo, browser, name, measurements) {
  await testInfo.attach(name, { body:JSON.stringify({engine:testInfo.project.name,version:browser.version(),measurements},null,2),contentType:'application/json' });
}

test.beforeEach(async ({ page, baseURL }) => {
  await stabilizePreview(page,baseURL);
  await page.goto('/');
  await fixture(page);
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.mouse.move(0,0);
});

for (const tinted of [false,true]) {
  test(`managed ${tinted ? 'tinted' : 'white'} surfaces retain native error, focus and selected-state contrast`, async ({page,browser},testInfo) => {
    const originalChoice = await metrics(part(page,'choice'));
    await page.addStyleTag({content:cssFor(theme(tinted))});
    const field = part(page,'text');
    await expect(field).toHaveCSS('background-color',tinted ? 'rgb(238, 242, 250)' : 'rgb(255, 255, 255)');
    await expect(part(page,'card','base')).toHaveCSS('background-color',tinted ? 'rgb(245, 235, 212)' : 'rgb(255, 255, 255)');
    await expect(field).toHaveCSS('border-radius','4px');
    await expect(part(page,'action')).toHaveCSS('border-radius','9999px');
    await expect(part(page,'icon','base')).toHaveCSS('width','16px');
    const normal = await metrics(field), card = await metrics(part(page,'card','base'));
    expect(contrast(normal.color,normal.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(normal.border,normal.background)).toBeGreaterThanOrEqual(3);
    const focused = await keyboardFocusField(page);
    expect(contrast(focused.outlineColor,card.background)).toBeGreaterThanOrEqual(3);
    await field.fill('');
    expect(await page.locator('#adapt-text').evaluate(host => host.reportValidity())).toBe(false);
    await expect(field).toHaveAttribute('aria-invalid','true');
    const error = part(page,'text','error');
    await expect(error).toBeVisible();
    const errorText=(await error.innerText()).trim();
    expect(errorText.length).toBeGreaterThan(0);
    await expect(field).toHaveAccessibleDescription(`Use a title collaborators recognize. ${errorText}`);
    const invalid = await metrics(field), errorPaint = await metrics(error);
    expect(invalid.width).toBeCloseTo(normal.width,1);
    expect(invalid.height).toBeCloseTo(normal.height,1);
    expect(invalid.blockBorder).toBeGreaterThan(normal.blockBorder);
    expect(contrast(errorPaint.color,card.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(invalid.border,invalid.background)).toBeGreaterThanOrEqual(3);
    await field.fill('Recovered canvas');
    expect(await page.locator('#adapt-text').evaluate(host => host.checkValidity())).toBe(true);
    await expect(error).not.toBeVisible();
    await page.locator('#adapt-segmented').getByText('A3',{exact:true}).click();
    await expect(page.locator('#adapt-segmented').getByRole('radio',{name:'A3',exact:true})).toBeChecked();
    await page.mouse.move(0,0);
    const selected = await metrics(page.locator('#adapt-segmented [part~="option"][data-selected]'));
    expect(contrast(selected.color,selected.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(selected.border,selected.background)).toBeGreaterThanOrEqual(3);
    const choice = await metrics(part(page,'choice'));
    expect(choice.border).toBe(originalChoice.border);
    expect(contrast(choice.border,card.background)).toBeGreaterThanOrEqual(3);
    await record(testInfo,browser,'observed-state-pairs.json',{normal,focused,invalid,errorPaint,selected,choice,card});
    await page.locator('#adaptation').screenshot({path:testInfo.outputPath('adapted-states.png')});
  });
}

test('paint and geometry changes preserve compound input identity and an invalid exact-value draft', async ({page,browser},testInfo) => {
  const style = await page.addStyleTag({content:cssFor(theme())});
  const number = part(page,'number'), editor = part(page,'slider','editor');
  const numberNode = await number.elementHandle(), editorNode = await editor.elementHandle();
  await number.fill('17'); await number.press('ArrowUp');
  await expect(number).toHaveValue('18');
  await editor.fill('101'); await editor.press('Enter');
  await expect(editor).toHaveAttribute('aria-invalid','true');
  await expect(part(page,'slider','error')).toBeVisible();
  await expect(editor).toBeFocused();
  const before = await metrics(part(page,'number','stepper'));
  await style.evaluate((node,css) => { node.textContent=css; },cssFor(theme(true)));
  await expect(editor).toHaveValue('101'); await expect(editor).toBeFocused();
  expect(await editor.evaluate((node,original) => node === original,editorNode)).toBe(true);
  expect(await number.evaluate((node,original) => node === original,numberNode)).toBe(true);
  await expect(number).toHaveCSS('border-radius','0px');
  await expect(number).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(part(page,'number','stepper')).toHaveCSS('background-color','rgb(238, 242, 250)');
  await expect(editor).toHaveCSS('background-color','rgb(238, 242, 250)');
  const state = await page.locator('#adapt-form').evaluate(form => ({opacity:new FormData(form).get('opacity'),copies:new FormData(form).get('copies'),valid:form.checkValidity()}));
  expect(state).toEqual({opacity:'64',copies:'18',valid:false});
  await expect(editor).toBeFocused();
  const after = await metrics(part(page,'number','stepper'));
  expect(after.width).toBeCloseTo(before.width,1); expect(after.height).toBeCloseTo(before.height,1);
  await editor.fill('72'); await editor.press('Enter');
  await expect(part(page,'slider','error')).not.toBeVisible();
  expect(await page.locator('#adapt-form').evaluate(form => new FormData(form).get('opacity'))).toBe('72');
  await record(testInfo,browser,'compound-draft-preservation.json',{before,after,state});
});

test('200 percent root text with long RTL labels grows controls without clipping', async ({page,browser},testInfo) => {
  await page.setViewportSize({width:420,height:900});
  await page.addStyleTag({content:cssFor(theme(true))});
  const baseline = await metrics(part(page,'action'));
  await page.locator('#adaptation').evaluate((region,label) => {
    region.dir='rtl'; region.lang='ar';
    region.querySelector('#adapt-text').label=label;
    region.querySelector('#adapt-choice [slot="label"]').textContent=label;
    region.querySelector('#adapt-action [slot="label"]').textContent=label;
    region.querySelector('#adapt-segmented').items=[{value:'a4',label:label+' أ'},{value:'a3',label:label+' ب'}];
  },longLabel);
  await page.addStyleTag({content:'html { font-size:32px; }'});
  await expect(part(page,'text')).toHaveCSS('font-size','28px');
  await expect.poll(async () => (await metrics(part(page,'text'))).line).toBeCloseTo(40,1);
  const actual = {};
  for (const [id,name] of [['text','control'],['number','control'],['slider','editor'],['action','control']]) {
    const m = await metrics(part(page,id,name)); actual[`${id}-${name}`]=m;
    expect(m.height,`${id} contains its line/padding/border`).toBeGreaterThanOrEqual(m.line+m.blockPadding+m.blockBorder-1);
    expect(m.scrollWidth,`${id} horizontal containment`).toBeLessThanOrEqual(m.clientWidth+1);
    expect(m.scrollHeight,`${id} vertical containment`).toBeLessThanOrEqual(m.clientHeight+1);
  }
  expect(actual['action-control'].height).toBeGreaterThan(baseline.height);
  for (const label of [part(page,'text','label'),part(page,'choice','label'),...await page.locator('#adapt-segmented [part~="option-label"]').all()]) {
    const m = await metrics(label); expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth+1);
  }
  const focused = await keyboardFocusField(page);
  await record(testInfo,browser,'enlarged-rtl.json',{actual,focused});
  await page.locator('#adaptation').screenshot({path:testInfo.outputPath('enlarged-rtl-focus.png')});
});

test.describe('coarse pointer', () => {
  test.use({hasTouch:true});
  test('16px artwork retains real control targets in both axes', async ({page,browser},testInfo) => {
    expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(true);
    await page.addStyleTag({content:cssFor(theme(true))});
    await expect(part(page,'icon','base')).toHaveCSS('width','16px');
    const actual = {};
    for (const [id,name] of [['action','control'],['text','control'],['number','control'],['number','decrement'],['number','increment'],['slider','control'],['slider','editor'],['choice','label']]) {
      const m = await metrics(part(page,id,name)); actual[`${id}-${name}`]=m;
      expect(m.width,`${id}/${name} inline target`).toBeGreaterThanOrEqual(44);
      expect(m.height,`${id}/${name} block target`).toBeGreaterThanOrEqual(44);
    }
    // Existing segmented contract is 44px block/24px inline; record, do not silently upgrade it to 44×44.
    const options = await page.locator('#adapt-segmented [part~="option"]').all();
    actual.segmented=[];
    for (const option of options) {
      const m=await metrics(option); actual.segmented.push(m);
      expect(m.height).toBeGreaterThanOrEqual(44); expect(m.width).toBeGreaterThanOrEqual(24);
    }
    if(actual.segmented.some(m=>m.width<44)) testInfo.annotations.push({type:'existing-ergonomic-gap',description:'Short segmented options retain the documented 24px inline floor, not a universal 44×44 target guarantee.'});
    await part(page,'number','increment').tap(); await expect(part(page,'number')).toHaveValue('18');
    await part(page,'choice','label').tap(); await expect(part(page,'choice')).toBeChecked();
    await record(testInfo,browser,'coarse-actual-targets.json',actual);
  });
});

test('reduced motion and supported forced colors retain meaningful selected and focus states', async ({page,browser},testInfo) => {
  await page.addStyleTag({content:cssFor(theme(true))});
  await expect(part(page,'action')).toHaveCSS('transition-duration','0s');
  await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});
  if(!await page.evaluate(()=>matchMedia('(forced-colors: active)').matches)) {
    testInfo.annotations.push({type:'unsupported-emulation',description:'Forced-colors emulation is unavailable in this engine; physical platform verification remains outstanding.'});
    await record(testInfo,browser,'preferences.json',{reducedMotion:true,forcedColors:false}); return;
  }
  // Compare to the current browser's system palette, not a hard-coded palette
  // or authored-theme contrast threshold. Highlight can itself be translucent.
  const system=await page.evaluate(() => {
    const probe=document.createElement('span');
    probe.style.forcedColorAdjust='none'; document.body.append(probe);
    const colors={};
    for(const name of ['Canvas','CanvasText','ButtonText','Highlight','HighlightText']) {
      probe.style.color=name; colors[name]=getComputedStyle(probe).color;
    }
    probe.remove(); return colors;
  });
  const field=await keyboardFocusField(page), card=await metrics(part(page,'card','base'));
  expect(field.color).toBe(system.CanvasText);
  expect(field.background).toBe(system.Canvas);
  expect(field.border).toBe(system.ButtonText);
  expect(field.outlineColor).toBe(system.Highlight);
  expect(card.background).toBe(system.Canvas);
  await part(page,'choice').focus();
  await page.keyboard.press('Tab');
  const initialRadio=page.locator('#adapt-segmented').getByRole('radio',{name:'A4',exact:true});
  await expect(initialRadio).toBeFocused();
  await initialRadio.press('ArrowRight');
  const radio=page.locator('#adapt-segmented').getByRole('radio',{name:'A3',exact:true});
  await expect(radio).toBeChecked(); await expect(radio).toBeFocused();
  expect(await radio.evaluate(node=>node.matches(':focus-visible'))).toBe(true);
  const option=page.locator('#adapt-segmented [part~="option"][data-selected]');
  const selected=await metrics(option), label=await metrics(option.locator('[part~="option-label"]'));
  const frame=await metrics(part(page,'segmented','options'));
  expect(frame.background).toBe(system.Canvas);
  expect(selected.background).toBe(system.Highlight);
  expect(selected.border).toBe(system.Highlight);
  expect(label.color).toBe(system.HighlightText);
  // Preserve the narrow text-only exception that prevents a forced-color backplate.
  expect(label.background).toBe('rgba(0, 0, 0, 0)');
  expect(selected.outline).toBe('solid');
  expect(selected.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(selected.outlineColor).toBe(system.Highlight);
  // Retain alpha-aware observations for review without grading a UA/user-selected
  // palette as an authored theme. These assume the verified Canvas surface below.
  const rgba=color=>{const v=color.match(/[\d.]+/g).map(Number);return [...v.slice(0,3),v[3]??1];};
  const over=(foreground,opaqueBackground)=>{
    const f=rgba(foreground), b=rgba(opaqueBackground);
    return `rgb(${f.slice(0,3).map((v,i)=>v*f[3]+b[i]*(1-f[3])).join(', ')})`;
  };
  const compositeContrast=rgba(system.Canvas)[3]===1 ? {
    fieldText:contrast(over(field.color,field.background),field.background),
    focusAgainstCard:contrast(over(field.outlineColor,card.background),card.background),
    selectedText:contrast(over(label.color,over(selected.background,frame.background)),over(selected.background,frame.background)),
  } : null;
  testInfo.annotations.push({type:'system-palette-evidence',description:'Forced-colors smoke verifies system-role mapping, native selection and keyboard focus contours. Composite ratios are observations, not a theme-conformance result; physical preference/AT review remains outstanding.'});
  await record(testInfo,browser,'preferences.json',{reducedMotion:true,forcedColors:true,system,field,card,frame,selected,label,compositeContrast});
  await page.locator('#adaptation').screenshot({path:testInfo.outputPath('forced-colors.png')});
});
