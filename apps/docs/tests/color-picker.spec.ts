import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
const demo = '/api-examples/composable-chat.html';
async function load(page: any, path = demo) {
  await page.goto(path); await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
}
async function writeMessage(field: any, text: string) { await field.focus(); await field.press('ControlOrMeta+a'); await field.press('Backspace'); await field.pressSequentially(text); }
test('inline picker commits hex and keyboard channel changes and keeps invalid drafts', async ({ page }) => {
  await load(page, '/api-examples/color-picker.html'); const picker = page.locator('#basic-color-picker');
  const hex = picker.getByRole('textbox', { name: 'Hex color' });
  await expect(hex).toHaveValue('#336699'); await hex.fill('abc'); await hex.press('Enter');
  await expect(picker).toHaveJSProperty('value', '#aabbcc'); await expect(hex).toHaveValue('#aabbcc');
  const red = picker.getByRole('slider', { name: 'Red', exact: true }); await red.focus(); await red.press('ArrowRight');
  await expect(picker).toHaveJSProperty('value', '#abbbcc');
  await hex.fill('oops'); await hex.press('Enter'); await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await expect(picker).toHaveJSProperty('value', '#abbbcc'); await expect(hex).toHaveValue('oops');
  await expect(picker.getByText(/Use 3 or 6 hex digits/)).toBeVisible();
  await picker.evaluate((el: any) => el.disabled = true); await expect(hex).toBeDisabled(); await expect(red).toBeDisabled();
});
test('single cancelable changes roll back all controls while authoritative writes win', async ({ page }) => {
  await load(page, '/api-examples/color-picker.html'); const picker = page.locator('#basic-color-picker'); const hex = picker.getByRole('textbox');
  await picker.evaluate((el: any) => { (window as any).observed = []; el.addEventListener('en-change', (event: any) => { (window as any).observed.push([el.value, event.detail]); event.preventDefault(); }, { once: true }); });
  await hex.fill('#abcdef'); await hex.press('Enter'); await expect(picker).toHaveJSProperty('value', '#336699'); await expect(hex).toHaveValue('#336699');
  expect(await page.evaluate(() => (window as any).observed)).toEqual([['#abcdef', { previous: '#336699', proposed: '#abcdef', reason: 'hex' }]]);
  await picker.evaluate((el: any) => el.addEventListener('en-change', (event: Event) => { el.value = '#123456'; event.preventDefault(); }, { once: true }));
  await hex.fill('#ffffff'); await hex.press('Enter'); await expect(picker).toHaveJSProperty('value', '#123456'); await expect(hex).toHaveValue('#123456');
});
test('default hash opens picker directly and typeahead updates it without resizing composer', async ({ page, browserName }) => {
  await load(page); const field = page.getByRole('textbox', { name: 'Structured message' }); const composer = page.locator('en-chat-composer');
  const before = await composer.boundingBox(); await writeMessage(field, '#336699'); const dialog = page.getByRole('dialog', { name: 'Color picker', exact: true });
  await expect(dialog).toBeVisible(); await expect(dialog.locator('en-color-picker')).toHaveJSProperty('value', '#336699');
  expect(Math.abs((await composer.boundingBox())!.height - before!.height)).toBeLessThan(1);
  await expect(page.getByRole('listbox')).toHaveCount(0); await writeMessage(field, '#red'); await expect(dialog.locator('en-color-picker')).toHaveJSProperty('value', '#dc2626');
  await field.press('Enter'); await expect(dialog.getByRole('textbox', { name: 'Hex color' })).toBeFocused();
  await expect(page.locator('en-composable-chat-demo')).not.toContainText('Captured message');
  // macOS WebKit requires Option+Tab for native controls under its default keyboard preference.
  await dialog.getByRole('textbox',{name:'Hex color',exact:true}).press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab'); await expect(dialog.getByRole('combobox', { name: 'Color format', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Apply color', exact: true }).click(); await expect(dialog).not.toBeVisible();
  await expect(field.getByRole('button', { name: 'Edit color #dc2626' })).toBeVisible();
  await field.focus(); await field.press('ControlOrMeta+z'); await expect(page.locator('en-token-editor')).toHaveJSProperty('value', '#red');
});
test('cancellation preserves text and existing chips; applied edit retains occurrence identity', async ({ page }) => {
  await load(page); const field = page.getByRole('textbox', { name: 'Structured message' });
  await writeMessage(field, '#abc'); await field.press('Escape'); await expect(page.locator('en-token-editor')).toHaveJSProperty('value', '#abc');
  await expect(page.getByRole('dialog', { name: 'Color picker' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Load sample chips' }).click(); const chip = field.getByRole('button', { name: 'Edit color #5577cc' }); await chip.click();
  const dialog = page.getByRole('dialog', { name: 'Color picker' }); const hex = dialog.getByRole('textbox',{name:'Hex color',exact:true});
  await hex.fill('#123456'); await hex.press('Enter'); await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(chip).toBeFocused(); await expect(chip).toHaveAttribute('data-token', 'sample-color');
  await chip.click(); await hex.fill('#123456'); await hex.press('Enter'); await dialog.getByRole('button', { name: 'Apply color' }).click();
  await expect(field.getByRole('button', { name: 'Edit color #123456' })).toHaveAttribute('data-token', 'sample-color');
});
test('picker controls do not emit editor document changes before Apply and Escape works inside shadow controls', async ({ page }) => {
  await load(page); const field = page.getByRole('textbox', { name: 'Structured message' }); await writeMessage(field, '#');
  await page.locator('en-token-editor').evaluate(el => { (window as any).changes = 0; el.addEventListener('en-change', () => ++(window as any).changes); });
  await field.press('ArrowDown'); const hex = page.getByRole('dialog').getByRole('textbox',{name:'Hex color',exact:true}); await expect(hex).toBeFocused();
  await hex.fill('#ffffff'); await hex.press('Enter'); expect(await page.evaluate(() => (window as any).changes)).toBe(0);
  await hex.press('Escape'); await expect(field).toBeFocused(); await expect(page.locator('en-token-editor')).toHaveJSProperty('value', '#');
});
test('initial picker values and controls survive SSR hydration', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try { const page = await context.newPage(); await page.goto('/api-examples/color-picker.html'); await expect(page.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#336699'); await expect(page.locator('#basic-color-picker').getByRole('slider')).toHaveCount(3); } finally { await context.close(); }
});
test('all inspired themes fit mobile with named controls, valid accessibility and configurable Parts', async ({ page }, info) => {
  test.setTimeout(60_000);
  await load(page); await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ['spectrum', 'fluent', 'astryx', 'shadcn', 'holotable']) {
    await page.getByRole('combobox', { name: 'Inspired theme', exact: true }).selectOption(theme + '-inspired');
    await expect(page.getByRole('status', { name: 'Theme result' })).toContainText('applied');
    for (const mode of ['light', 'dark']) {
    await page.getByRole('combobox', { name: 'Appearance', exact: true }).selectOption(mode);
    await writeMessage(page.getByRole('textbox', { name: 'Structured message' }), '#336699');
    const picker = page.getByRole('dialog').locator('en-color-picker'); await expect(picker.getByRole('slider')).toHaveCount(3);
    const box = await picker.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(391);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`en-color-picker-${theme}-${mode}-${info.project.name}.png`) });
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    }
  }
});
test('Apply rejects an invalid hex draft and later accepts its correction', async ({ page }) => {
  await load(page); const field = page.getByRole('textbox', { name: 'Structured message' }); await writeMessage(field, '#');
  const dialog = page.getByRole('dialog'); const hex = dialog.getByRole('textbox',{name:'Hex color',exact:true}); await hex.fill('invalid');
  await dialog.getByRole('button', { name: 'Apply color' }).click(); await expect(dialog).toBeVisible(); await expect(hex).toBeFocused();
  await expect(field.locator('[data-token]')).toHaveCount(0); await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await hex.fill('#abc'); await dialog.getByRole('button', { name: 'Apply color' }).click();
  await expect(field.getByRole('button', { name: 'Edit color #aabbcc' })).toBeVisible();
});
test('Parts can alter preview geometry and forced colors retain named native controls', async ({ page }) => {
  await load(page, '/api-examples/color-picker.html');
  await page.addStyleTag({ content: 'en-color-picker::part(preview){border-radius:50%;inline-size:48px} en-color-picker{--en-color-picker-inline-size:18rem}' });
  const picker = page.locator('#basic-color-picker');
  expect(await picker.evaluate(el => { const node = el.shadowRoot!.querySelector('[part=preview]')!; return [getComputedStyle(node).borderRadius, node.getBoundingClientRect().width]; })).toEqual(['50%', 48]);
  await page.emulateMedia({ forcedColors: 'active' }); await picker.getByRole('slider', { name: 'Green', exact: true }).focus();
  await page.keyboard.press('End'); await expect(picker).toHaveJSProperty('value', '#33ff99');
});
test('API reference includes the picker guide, metadata and a working inline demo', async ({ page }) => {
  await page.goto('/api-reference.html?component=en-color-picker');
  await expect(page.getByRole('heading', { name: 'Inline color editing', exact: true })).toBeVisible();
  await expect(page.locator('#api-cssParts')).toContainText('preview');
  const frame = page.locator('iframe').first(); await frame.scrollIntoViewIfNeeded();
  await expect(frame.contentFrame().locator('#basic-color-picker').getByRole('textbox', { name: 'Hex color' })).toBeVisible();
});

test('format switching preserves exact alpha; each channel paints its own gradient', async ({ page }) => {
  await load(page, '/api-examples/color-picker.html'); const picker=page.locator('#basic-color-picker');
  await picker.getByRole('textbox',{name:'Hex color'}).fill('#3698'); await picker.getByRole('textbox',{name:'Hex color'}).press('Enter');
  await expect(picker).toHaveJSProperty('value','#33669988');
  await picker.getByRole('switch',{name:'Alpha',exact:true}).click();
  const alpha=picker.getByRole('slider',{name:'Alpha',exact:true}); await expect(alpha).toHaveValue('53');
  for(const format of ['rgb','hsl','hex','hsl']) {await picker.getByRole('combobox',{name:'Color format'}).selectOption(format);await expect(picker).toHaveJSProperty('value','#33669988');}
  await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toHaveValue('210');
  await expect(picker.getByRole('textbox')).toHaveCount(4);
  for (const field of await picker.locator('en-color-slider en-text-field').all()) await expect(field).toHaveAttribute('size','small');
  const stops=await picker.locator('en-color-slider').evaluateAll(els=>els.map((el:any)=>({stops:el.stops,checker:el.checkerboard})));
  expect(stops[0].stops).toHaveLength(7);expect(stops[2].stops).toHaveLength(3);
  expect(stops[3]).toEqual({stops:['#33669900','#336699'],checker:true});
  await alpha.focus();await alpha.press('Home');await expect(picker).toHaveJSProperty('value','#33669900');
  await picker.getByRole('switch',{name:'Alpha',exact:true}).click();await expect(alpha).toHaveCount(0);await expect(picker).toHaveJSProperty('value','#33669900');
  await picker.getByRole('switch',{name:'Alpha',exact:true}).click();await alpha.focus();await alpha.press('End');await expect(picker).toHaveJSProperty('value','#336699');
});
test('HSL retains powerless hue and cancellation restores nested slider state',async({page})=>{
  await load(page,'/api-examples/color-picker.html');const picker=page.locator('#basic-color-picker');
  await picker.evaluate((el:any)=>{el.value='#000000';el.format='hsl';});
  const hue=picker.getByRole('textbox',{name:/Hue/}); await hue.fill('120');await hue.press('Enter');
  await expect(picker).toHaveJSProperty('value','#000000');
  const sat=picker.getByRole('textbox',{name:/Saturation/});await sat.fill('100');await sat.press('Enter');
  const light=picker.getByRole('textbox',{name:/Lightness/});await light.fill('50');await light.press('Enter');
  await expect(picker).toHaveJSProperty('value','#00ff00');
  await picker.evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true}));
  await hue.fill('240');await hue.press('Enter');await expect(picker).toHaveJSProperty('value','#00ff00');await expect(hue).toHaveValue('120');
});
test('Picker and Chips tabs preserve edits and Apply commits the chosen transparent color',async({page})=>{
  await load(page);const field=page.getByRole('textbox',{name:'Structured message'});await writeMessage(field,'#');
  const dialog=page.getByRole('dialog',{name:'Color picker',exact:true});const picker=dialog.locator('en-color-picker');
  const hex=picker.getByRole('textbox',{name:'Hex color'});await hex.fill('#ff000080');await hex.press('Enter');
  await dialog.getByRole('tab',{name:'Chips',exact:true}).click();await expect(hex).not.toBeVisible();
  await dialog.getByRole('tab',{name:'Picker',exact:true}).click();await expect(hex).toHaveValue('#ff000080');
  await dialog.getByRole('tab',{name:'Chips',exact:true}).click();await dialog.getByRole('button',{name:'Blue',exact:true}).click();
  await dialog.getByRole('tab',{name:'Picker',exact:true}).click();await expect(hex).toHaveValue('#336699');
  await hex.fill('#33669980');await hex.press('Enter');await dialog.getByRole('button',{name:'Apply color'}).click();
  await expect(field.getByRole('button',{name:'Edit color #33669980'})).toBeVisible();
});
test('standalone color slider keeps native keyboard, form and safe gradient behavior',async({page})=>{
  await load(page,'/api-examples/color-slider.html');const slider=page.locator('en-color-slider');
  const range=slider.getByRole('slider',{name:'Alpha',exact:true});await range.focus();await range.press('End');await expect(slider).toHaveJSProperty('value',100);
  await slider.evaluate((el:any)=>{const form=document.createElement('form');el.before(form);form.append(el);el.setAttribute('name','opacity');el.stops=['not-a-color','url(invalid)'];el.dir='rtl';});
  expect(await slider.evaluate((el:any)=>new FormData(el.closest('form')).get('opacity'))).toBe('100');
  expect(await slider.locator('[part=gradient]').evaluate(el=>el.getAttribute('style'))).toContain('linear-gradient(to right, #000000,#ffffff)');
  expect(await range.evaluate(el=>getComputedStyle(el).getPropertyValue('--_en-color-gradient').trim())).toBe('linear-gradient(to left, #000000,#ffffff)');
  await slider.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>e.preventDefault(),{once:true}));await range.focus();await range.press('Home');await expect(slider).toHaveJSProperty('value',100);
});
test('color slider keeps its hollow double ring through inherited slider states', async ({ page }) => {
  await load(page, '/api-examples/color-slider.html');
  const slider = page.locator('en-color-slider');
  await slider.evaluate(async (el: any) => {
    el.min = 0; el.max = 100; el.value = 50; el.stops = ['#80c0a0', '#80c0a0']; el.checkerboard = false;
    el.style.cssText += ';background:white;--en-color-slider-thumb-size:28px;--en-color-slider-track-size:24px;--en-color-focus:#ff00ff;--en-slider-fill-background:red;--en-slider-paint-duration:0ms';
    await el.updateComplete;
  });
  const range = slider.getByRole('slider', { name: 'Alpha', exact: true });
  const painted = async () => {
    const png = (await range.screenshot({ scale: 'css' })).toString('base64');
    return page.evaluate(async png => {
      const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixel = (x: number, y: number) => Array.from(data.slice((Math.floor(y) * width + Math.floor(x)) * 4, (Math.floor(y) * width + Math.floor(x)) * 4 + 3));
      const neutralDark = (p: number[]) => {
        const red = p[0]!, green = p[1]!, blue = p[2]!;
        const maximum = Math.max(...p), spread = maximum - Math.min(...p);
        // Keep the original neutral test. Firefox also blends the 1px #222
        // ring with this fixture's #80c0a0 rail: G >= B >= R and B = (R+G)/2.
        // Allow only that green fringe, with one-channel rounding tolerance.
        const sourceGreenFringe = spread >= 12 && spread <= 32
          && green + 1 >= blue && blue + 1 >= red
          && Math.abs(2 * blue - red - green) <= 2;
        return maximum < 190 && (spread < 12 || sourceGreenFringe);
      };
      const center = width / 2;
      const ringPixels = [-1, 1].map(sign => {
        let count = 0;
        for (let d = 9; d <= 16; d++) if (neutralDark(pixel(center + sign * d, height / 2))) count++;
        return count;
      });
      return { ringPixels, middle: pixel(center, height / 2), before: pixel(width / 4, height / 2), after: pixel(width * .75, height / 2) };
    }, png);
  };
  const check = async (disabled = false) => {
    const result = await painted();
    // Dark ring pixels on both sides distinguish the hollow handle from a white
    // border alone. The colored middle and equal rail samples prove no value fill.
    for (const count of result.ringPixels) expect(count).toBeGreaterThanOrEqual(2);
    const expected = disabled ? [185, 220, 203] : [128, 192, 160];
    for (const sample of [result.middle, result.before, result.after])
      sample.forEach((channel, index) => expect(Math.abs(channel - expected[index]!)).toBeLessThanOrEqual(4));
  };
  await page.mouse.move(0, 0); await check();
  await range.hover(); await check();
  await range.focus(); await range.press('ArrowRight'); await range.press('ArrowLeft'); await check();
  await slider.evaluate(async (el: any) => { el.disabled = true; await el.updateComplete; });
  await expect(range).toBeDisabled(); await check(true);
  await slider.evaluate(async (el: any) => { el.disabled = false; el.style.setProperty('--en-slider-thumb-size', '40px'); await el.updateComplete; });
  await page.mouse.move(0, 0); await range.evaluate(el => (el as HTMLInputElement).blur());
  // The specialized 28px size remains authoritative over the generic 40px hook.
  await check();
  await slider.evaluate((el: any) => el.style.setProperty('--en-slider-thumb-shadow', 'none'));
  const withoutRing = await painted();
  expect(withoutRing.ringPixels).toEqual([0, 0]);
});
test('numeric validation survives tab switching and a corrected draft applies on the first click',async({page})=>{
  await load(page);await writeMessage(page.getByRole('textbox',{name:'Structured message'}),'#');const dialog=page.getByRole('dialog');const picker=dialog.locator('en-color-picker');
  await picker.getByRole('combobox',{name:'Color format'}).selectOption('rgb');const red=picker.getByRole('textbox',{name:/Red/});await red.fill('999');
  await dialog.getByRole('tab',{name:'Chips',exact:true}).click();await dialog.getByRole('button',{name:'Apply color'}).click();
  await expect(dialog.getByRole('tab',{name:'Picker',exact:true})).toHaveAttribute('aria-selected','true');await expect(red).toBeFocused();
  await red.fill('255');await dialog.getByRole('button',{name:'Apply color'}).click();
  await expect(page.getByRole('textbox',{name:'Structured message'}).getByRole('button',{name:'Edit color #ff77cc'})).toBeVisible();
});
test('RGB and HSL alpha controls remain usable at narrow widths across inspired themes',async({page},info)=>{
  test.setTimeout(60_000);await load(page,'/api-examples/color-picker.html');await page.setViewportSize({width:390,height:844});const picker=page.locator('#basic-color-picker');
  for(const theme of ['spectrum','fluent','astryx','shadcn','holotable']) {
    await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme+'-inspired');
    await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
    for(const format of ['rgb','hsl']) {
      await picker.evaluate((el:any,format)=>{el.format=format;el.alpha=true;el.value='#33669980';},format);
      await expect(picker.getByRole('slider')).toHaveCount(4);
      const box=await picker.boundingBox();expect(box!.width).toBeLessThanOrEqual(390);
      for(const slider of await picker.locator('en-color-slider').all()) {
        const bounds=await slider.getByRole('slider').boundingBox();expect(bounds!.width).toBeGreaterThan(150);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(391);
        const number=await slider.getByRole('textbox').boundingBox();expect(number!.x+number!.width).toBeLessThanOrEqual(391);
      }
      expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
      await picker.screenshot({path:test.info().outputPath(`en-color-channels-${theme}-${format}-${info.project.name}.png`)});
    }
  }
});
test('vertical color slider points its maximum upward and retains exact input',async({page})=>{
  await load(page,'/api-examples/color-slider.html');const slider=page.locator('en-color-slider');await slider.evaluate((el:any)=>el.orientation='vertical');
  const range=slider.getByRole('slider');await expect(range).toHaveAttribute('aria-orientation','vertical');await range.focus();await range.press('End');await expect(slider).toHaveJSProperty('value',100);
  const box=await range.boundingBox();expect(box!.height).toBeGreaterThan(box!.width);
  expect(await range.evaluate(el=>getComputedStyle(el).getPropertyValue('--_en-color-gradient').trim())).toContain('to top');
});
test('small text fields validate numeric drafts, keep accepted form values and reset',async({page})=>{
  await load(page,'/api-examples/color-slider.html');const slider=page.locator('en-color-slider');const field=slider.locator('en-text-field');const input=field.getByRole('textbox');
  await expect(field).toHaveAttribute('size','small');
  await slider.evaluate((el:any)=>{el.step=.5;const form=document.createElement('form');el.before(form);form.append(el);el.setAttribute('name','alpha');});
  for(const draft of ['oops','101','-1','60.2','']) {
    await input.fill(draft);await input.press('Enter');await expect(slider).toHaveJSProperty('value',60);await expect(input).toHaveAttribute('aria-invalid','true');
    expect(await slider.evaluate((el:any)=>new FormData(el.form).get('alpha'))).toBe('60');
  }
  await input.fill('61.5');await input.press('Enter');await expect(slider).toHaveJSProperty('value',61.5);
  await slider.evaluate((el:any)=>el.form.reset());await expect(input).toHaveValue('60');
  await input.fill('999');await slider.evaluate((el:any)=>el.value=20);await expect(input).toHaveValue('20');
});
test('color slider exact field retains authored label context as label text changes',async({page})=>{
  await load(page,'/api-examples/color-slider.html');const slider=page.locator('en-color-slider');
  await slider.evaluate(el=>{el.innerHTML='<span slot="label">Opacity</span><span slot="editor-label">Percentage</span>';});
  await expect(slider.getByRole('textbox',{name:'Opacity Percentage'})).toBeVisible();
  await slider.evaluate(el=>{el.querySelector('[slot=label]')!.textContent='Transparency';});
  await expect(slider.getByRole('textbox',{name:'Transparency Percentage'})).toBeVisible();
});
test('chat color picker uses columns when roomy and stacks in reading order on phones',async({page},info)=>{
  await load(page);const field=page.getByRole('textbox',{name:'Structured message'});
  await field.scrollIntoViewIfNeeded();await writeMessage(field,'#5577cc');const dialog=page.getByRole('dialog',{name:'Color picker',exact:true});
  const picker=dialog.locator('en-color-picker');
  const summary=picker.locator('[part=summary]'), formats=picker.locator('[part=formats]'),channels=picker.locator('[part=channels]');
  const left=await summary.boundingBox(), right=await channels.boundingBox(),format=await formats.boundingBox();
  expect(right!.x).toBeGreaterThan(left!.x+left!.width);expect(Math.abs(right!.y-left!.y)).toBeLessThan(2);expect(format!.y).toBeGreaterThan(left!.y);
  const preview=await picker.locator('[part=preview]').boundingBox();expect(Math.abs(preview!.height-left!.height)).toBeLessThan(2);
  const cancel=await dialog.getByRole('button',{name:'Cancel',exact:true}).boundingBox(),apply=await dialog.getByRole('button',{name:'Apply color'}).boundingBox();expect(cancel!.x).toBeLessThan(apply!.x);
  await dialog.screenshot({path:test.info().outputPath(`en-chat-color-layout-wide-${info.project.name}.png`)});
  await page.setViewportSize({width:390,height:844});
  await expect.poll(async()=>{const a=await summary.boundingBox(),b=await channels.boundingBox();return Math.abs(a!.x-b!.x);}).toBeLessThan(2);
  const a=await summary.boundingBox(),b=await formats.boundingBox(),c=await channels.boundingBox();expect(a!.y).toBeLessThan(b!.y);expect(b!.y).toBeLessThan(c!.y);
  expect(c!.x+c!.width).toBeLessThanOrEqual(391);
  await dialog.screenshot({path:test.info().outputPath(`en-chat-color-layout-phone-${info.project.name}.png`)});
});
test('chat picker tabs cover the scrollport gutters and remain usable while scrolling',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await load(page);
  const field=page.getByRole('textbox',{name:'Structured message'});await field.scrollIntoViewIfNeeded();await writeMessage(field,'#5577cc');
  const dialog=page.getByRole('dialog',{name:'Color picker',exact:true}),tabs=dialog.getByRole('tablist',{name:'Color selection'});
  const initialOffset=(await tabs.boundingBox())!.y-(await dialog.boundingBox())!.y;
  // Exercise both ordinary scrolling and the end of the picker, where sticky
  // positioning is constrained by the tab panels' containing block.
  for(const scroll of [1,8,24,100,240,10000]){
    await dialog.evaluate((el,top)=>{el.scrollTop=top;},scroll);
    await expect.poll(()=>dialog.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await expect.poll(async()=>{const popup=await dialog.boundingBox(),bar=await tabs.boundingBox();return Math.abs(bar!.y-popup!.y-initialOffset);}).toBeLessThan(1);
    await expect.poll(async()=>{
      const popup=await dialog.boundingBox(),bar=await tabs.boundingBox();
      return {top:bar!.y<=popup!.y+2,bottom:bar!.y+bar!.height>popup!.y+35,left:bar!.x<=popup!.x+2,right:bar!.x+bar!.width>=popup!.x+popup!.width-18};
    }).toEqual({top:true,bottom:true,left:true,right:true});
  }
  expect(await tabs.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor));
  expect(parseFloat(await tabs.evaluate(el=>getComputedStyle(el).borderBlockEndWidth))).toBeGreaterThan(0);
  expect(await tabs.evaluate(el=>getComputedStyle(el).paddingBlockEnd)).toBe('0px');
  for(const tab of await dialog.locator('en-tab').all()) expect(await tab.locator('[part=base]').evaluate(el=>getComputedStyle(el).borderBlockEndWidth)).toBe('0px');
  await dialog.screenshot({path:test.info().outputPath(`en-chat-color-sticky-${info.project.name}.png`)});
  await dialog.getByRole('tab',{name:'Chips',exact:true}).click();
  await expect(dialog.getByRole('tab',{name:'Chips',exact:true})).toHaveAttribute('aria-selected','true');
  await dialog.getByRole('tab',{name:'Picker',exact:true}).click();
  await expect(dialog.getByRole('textbox',{name:'Hex color'})).toHaveValue('#5577cc');
});
test('chat color formats keep summary, channels and actions stable with editable values',async({page},info)=>{
  test.setTimeout(60_000);await load(page);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    const field=page.getByRole('textbox',{name:'Structured message'});await field.scrollIntoViewIfNeeded();await writeMessage(field,'#5577cc');
    const dialog=page.getByRole('dialog',{name:'Color picker',exact:true}),picker=dialog.locator('en-color-picker');
    const format=picker.getByRole('combobox',{name:'Color format'}),hex=picker.getByRole('textbox',{name:'Hex color'});
    const geometry=async()=>{
      const base=(await picker.boundingBox())!;
      const boxes=await Promise.all([picker.locator('[part=summary]'),picker.locator('[part=formats]'),picker.locator('[part=channels]'),...await picker.getByRole('slider').all()].map(el=>el.boundingBox()));
      const popup=(await dialog.boundingBox())!,action=(await dialog.getByRole('button',{name:'Apply color'}).boundingBox())!;
      return [base.height,...boxes.flatMap(b=>[b!.x-base.x,b!.y-base.y,b!.width,b!.height]),popup.y+popup.height-action.y-action.height];
    };
    for(const alpha of [false,true]){
      if(alpha)await picker.getByRole('switch',{name:'Alpha',exact:true}).click();
      await format.selectOption('hex');
      await expect(picker.locator('en-color-slider en-text-field')).toHaveCount(alpha?4:3);
      // Capture the baseline after nested fields and popup ResizeObserver layout settle.
      await picker.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
      const original=await geometry();
      for(const mode of ['rgb','hsl','hex']){
        await format.selectOption(mode);await expect(picker).toHaveJSProperty('format',mode);
        await expect(hex).toHaveValue('#5577cc');
        await expect.poll(async()=>Math.max(...(await geometry()).map((n,i)=>Math.abs(n-original[i])))).toBeLessThan(1);
        await expect(picker.locator('en-color-slider en-text-field')).toHaveCount(alpha?4:3);
      }
    }
    await format.selectOption('rgb');const red=picker.locator('en-color-slider').first().getByRole('textbox');await red.fill('86');await red.press('Enter');await expect(hex).toHaveValue('#5677cc');
    await format.selectOption('hsl');await hex.fill('#00ff00');await hex.press('Enter');
    await expect(picker.getByRole('slider',{name:'Hue',exact:true})).toHaveValue('120');
    await dialog.screenshot({path:test.info().outputPath(`en-chat-color-formats-${width}-${info.project.name}.png`)});
    await dialog.getByRole('button',{name:'Apply color'}).click();await expect(field.getByRole('button',{name:'Edit color #00ff00'})).toBeVisible();
  }
});
test('chat color actions stay at the bottom and remain clickable at either scroll end',async({page},info)=>{
  await load(page);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:844});
    const field=page.getByRole('textbox',{name:'Structured message'});await field.scrollIntoViewIfNeeded();await writeMessage(field,'#5577cc');
    const dialog=page.getByRole('dialog',{name:'Color picker',exact:true}),footer=dialog.locator('[part=color-actions]');
    await dialog.locator('en-color-picker').getByRole('switch',{name:'Alpha',exact:true}).click();
    for(const scroll of [0,1,100,10000,0]){
      await dialog.evaluate((el,top)=>{el.scrollTop=top;},scroll);
      await expect.poll(async()=>{
        const popup=(await dialog.boundingBox())!,bar=(await footer.boundingBox())!;
        return Math.abs(popup.y+popup.height-bar.y-bar.height);
      }).toBeLessThan(2);
      const popup=(await dialog.boundingBox())!,bar=(await footer.boundingBox())!;
      expect(bar.x).toBeLessThanOrEqual(popup.x+2);expect(bar.x+bar.width).toBeGreaterThanOrEqual(popup.x+popup.width-18);
      // Trial clicks check visibility and actual hit testing through any overlapping content.
      await footer.getByRole('button',{name:'Cancel',exact:true}).click({trial:true});
      await footer.getByRole('button',{name:'Apply color'}).click({trial:true});
    }
    expect(await footer.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor));
    await dialog.screenshot({path:test.info().outputPath(`en-chat-sticky-actions-${width}-${info.project.name}.png`)});
    await footer.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).not.toBeVisible();
    await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#5577cc');
    await field.press('Escape');await writeMessage(field,'#336699');
    await dialog.getByRole('button',{name:'Apply color'}).click();await expect(field.getByRole('button',{name:'Edit color #336699'})).toBeVisible();
  }
});
