import {test, expect, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {exposedParts} from '../../../../tooling/customization/browser-parts.js';

const manifest = JSON.parse(readFileSync(new URL('../../../elements/custom-elements.json', import.meta.url), 'utf8'));
const declaration = (tag: string) => manifest.modules.flatMap((module: any) => module.declarations ?? []).find((entry: any) => entry.tagName === tag);
async function fixture(page: Page, html: string, css = '') {
  await page.goto('/packages/styles/tests/composition/fixture.html');
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  await page.locator('#fixture').evaluate((element, html) => { element.innerHTML = html; }, html);
  await page.addStyleTag({content: css});
}

for (const tag of ['en-slider', 'en-color-slider']) {
  test(`${tag}: conditional and inherited advertised Parts have rendered reach`, async ({page}) => {
    await fixture(page, `<${tag} id="subject" label="Hue" editor-label="Exact value" editable show-value description="Channel" error="Invalid channel"></${tag}>`,
      `${tag}::part(editor-label){letter-spacing:3px}${tag}::part(editor){border-top-style:dashed}`);
    const host = page.locator('#subject');
    await expect(host.locator('[part~=editor], en-text-field input').first()).toBeVisible();
    const promised = declaration(tag).cssParts.map((part: any) => part.name).sort();
    await expect.poll(() => host.evaluate(exposedParts)).toEqual(expect.arrayContaining(promised));
    await expect(host.getByRole(tag === 'en-slider' ? 'spinbutton' : 'textbox', {name: 'Hue Exact value', exact: true})).toHaveCSS('border-top-style', 'dashed');
    const label = tag === 'en-slider' ? host.locator('[part~=editor-label]') : host.locator('en-text-field [part~=label]');
    await expect(label).toHaveCSS('letter-spacing', '3px');
    await host.evaluate((element: any) => {element.editable = false;});
    await expect.poll(() => host.evaluate(exposedParts)).not.toContain('editor-label');
    await host.evaluate((element: any) => {element.editable = true;});
    await expect.poll(() => host.evaluate(exposedParts)).toContain('editor-label');
  });
}

test('replacement editor retains localized naming and detects a broken forwarding boundary', async ({page}) => {
  await fixture(page, '<en-color-slider id="subject" label="Hue" editable><span slot="editor-label">Exact value</span></en-color-slider>',
    'en-color-slider::part(editor-label){letter-spacing:3px}en-color-slider::part(error){color:rgb(180,10,80)}');
  const host = page.locator('#subject'), child = host.locator('en-text-field');
  await expect(child.getByRole('textbox')).toHaveAccessibleName('Hue Exact value');
  await host.locator('[slot=editor-label]').evaluate(element => {element.textContent = 'Valeur exacte';});
  await expect(child.getByRole('textbox')).toHaveAccessibleName('Hue Valeur exacte');
  await child.evaluate((element: any) => {element.error = 'Invalid';});
  await expect(child.locator('[part~=error]')).toHaveCSS('color', 'rgb(180, 10, 80)');
  const mapping = await child.getAttribute('exportparts');
  await child.evaluate(element => element.setAttribute('exportparts', 'control:editor,error:error'));
  await expect.poll(() => host.evaluate(exposedParts)).not.toContain('editor-label');
  await expect(child.locator('[part~=label]')).not.toHaveCSS('letter-spacing', '3px');
  await child.evaluate((element, value) => element.setAttribute('exportparts', value!), mapping);
  await expect(child.locator('[part~=label]')).toHaveCSS('letter-spacing', '3px');
});

test('picker metadata and native styles cover conditional and multiple forwarded boundaries', async ({page}) => {
  await fixture(page, '<en-color-picker id="subject" plane></en-color-picker>',
    'en-color-picker::part(brightness){margin-inline-start:9px}en-color-picker::part(channel-error){letter-spacing:2px}');
  const host = page.locator('#subject');
  expect(declaration('en-color-picker').cssParts.map((part: any) => part.name)).toContain('brightness');
  await expect(host.locator('en-color-plane')).toBeVisible();
  await expect.poll(() => host.evaluate(exposedParts)).toContain('brightness');
  await expect(host.locator('en-color-plane [part~=brightness]')).toHaveCSS('margin-inline-start', '9px');
  const field = host.locator('en-color-slider en-text-field').first();
  await expect(field).toBeVisible();
  await field.evaluate((element: any) => {element.error = 'Invalid channel';});
  await expect.poll(() => host.evaluate(exposedParts)).toContain('channel-error');
  await expect(field.locator('[part~=error]')).toHaveCSS('letter-spacing', '2px');
  await host.evaluate((element: any) => {element.plane = false;});
  await expect.poll(() => host.evaluate(exposedParts)).not.toContain('brightness');
});

test('time-field advertises input hooks that reach its native editor', async ({page}) => {
  const expected = ['--en-input-background', '--en-input-color', '--en-input-inline-padding'];
  expect(declaration('en-time-field').cssProperties.map((property: any) => property.name)).toEqual(expect.arrayContaining(expected));
  await fixture(page, '<en-time-field id="subject" label="Start" value="12:30"></en-time-field>',
    '#subject{--en-input-background:rgb(21,40,60);--en-input-color:rgb(220,230,240);--en-input-inline-padding:23px}');
  const editor = page.locator('#subject [part~=control]');
  await expect(editor).toHaveCSS('background-color', 'rgb(21, 40, 60)');
  await expect(editor).toHaveCSS('color', 'rgb(220, 230, 240)');
  await expect(editor).toHaveCSS('padding-inline-start', '23px');
});
