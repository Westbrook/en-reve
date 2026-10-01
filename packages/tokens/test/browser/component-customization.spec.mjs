import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, colorFromHex } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';

const fieldKinds = ['text-field', 'textarea', 'select', 'number-field', 'color-field'];
const control = (page, region, kind) => page.locator(`#component-${region}-${kind} [part="control"]`);
const surface = (page, region, kind) => page.locator(`#component-${region}-${kind} [part~="${kind === 'card' ? 'base' : 'stepper'}"]`);

async function fixture(page) {
  await page.evaluate(async () => {
    const tags = ['text-field', 'textarea', 'select', 'number-field', 'color-field', 'button', 'checkbox', 'card'];
    await Promise.all(tags.map(tag => customElements.whenDefined(`en-${tag}`)));
    const fixture = document.createElement('section'); fixture.id = 'component-customization';
    const createRegion = (name, parent) => {
      const region = document.createElement('section'); region.id = `component-${name}`;
      for (const tag of tags) {
        const element = document.createElement(`en-${tag}`); element.id = `component-${name}-${tag}`;
        if (['button', 'checkbox', 'card'].includes(tag)) element.textContent = `${name} ${tag}`;
        else element.setAttribute('label', `${name} ${tag}`);
        if (tag === 'select') element.items = [{ value: 'first', label: 'First option' }, { value: 'second', label: 'Second option' }];
        else if (tag === 'number-field') element.setAttribute('value', '1');
        else if (tag === 'color-field') element.setAttribute('value', '#123456');
        else if (tag === 'text-field' || tag === 'textarea') element.setAttribute('value', 'A stable value');
        region.append(element);
      }
      parent.append(region);
      return region;
    };
    const root = createRegion('root', fixture);
    createRegion('child', root);
    createRegion('partial', root);
    document.body.append(fixture);
    await Promise.all([...fixture.querySelectorAll('*')].map(element => element.updateComplete));
  });
}

async function geometry(locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return { width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height,
      padding: style.padding, borderWidth: style.borderWidth };
  });
}

async function fieldPaint(page, region, background, color) {
  for (const kind of fieldKinds) {
    // The compound number editor paints its enclosing group behind a transparent input.
    const painted = kind === 'number-field' ? surface(page, region, kind) : control(page, region, kind);
    await expect(painted, `${region} ${kind} background`).toHaveCSS('background-color', background);
    await expect(control(page, region, kind), `${region} ${kind} foreground`).toHaveCSS('color', color);
  }
}

test.beforeEach(async ({ page, baseURL }) => {
  await stabilizePreview(page, baseURL);
  await page.goto('/');
  await fixture(page);
  await page.mouse.move(0, 0);
});

test('component tokens paint real fields and cards while preserving action and compound geometry', async ({ page }, testInfo) => {
  await fieldPaint(page, 'root', 'rgb(255, 255, 255)', 'rgb(27, 31, 36)');
  await expect(surface(page, 'root', 'card')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const action = control(page, 'root', 'button');
  await expect(action).toHaveCSS('border-radius', '8px');
  const actionFill = await action.evaluate(element => getComputedStyle(element).backgroundColor);
  const checkbox = control(page, 'root', 'checkbox');
  const choiceFill = await checkbox.evaluate(element => getComputedStyle(element).backgroundColor);
  const before = await Promise.all(fieldKinds.map(kind => geometry(control(page, 'root', kind))));
  await control(page, 'root', 'text-field').fill('An edited draft');

  const pinned = resolveTheme({ pins: {
    'component.input.background': colorFromHex('#eef2fa'),
    'component.input.color': colorFromHex('#17304a'),
    'component.card.background': colorFromHex('#f5ebd4'),
    'component.button.radius': { value: .875, unit: 'rem' },
  } });
  await page.addStyleTag({ content: emitThemeCSS(pinned, { scope: 'root' }) });
  await fieldPaint(page, 'root', 'rgb(238, 242, 250)', 'rgb(23, 48, 74)');
  await expect(surface(page, 'root', 'card')).toHaveCSS('background-color', 'rgb(245, 235, 212)');
  await expect(action).toHaveCSS('background-color', actionFill);
  await expect(checkbox).toHaveCSS('background-color', choiceFill);
  await expect(action).toHaveCSS('border-radius', '14px');
  await expect(control(page, 'root', 'text-field')).toHaveCSS('border-radius', '8px');
  await expect(control(page, 'root', 'number-field')).toHaveCSS('border-radius', '0px');
  await expect(control(page, 'root', 'number-field')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(control(page, 'root', 'text-field')).toHaveValue('An edited draft');
  const after = await Promise.all(fieldKinds.map(kind => geometry(control(page, 'root', kind))));
  expect(after).toEqual(before);
  await page.locator('#component-root-number-field [part="increment"]').click();
  await expect(control(page, 'root', 'number-field')).toHaveValue('2');
  await testInfo.attach('field-component-customization', { body: JSON.stringify({ before, after, sourceHash: pinned.sourceHash }), contentType: 'application/json' });
});

test('full child themes reset component tokens and partial or direct overrides keep their defined precedence', async ({ page }) => {
  const parent = resolveTheme({ pins: {
    'component.input.background': colorFromHex('#eef2fa'),
    'component.input.color': colorFromHex('#17304a'),
    'component.card.background': colorFromHex('#f5ebd4'),
    'component.button.radius': { value: .875, unit: 'rem' },
  } });
  const child = resolveTheme();
  const partial = resolveTheme({ pins: { 'component.input.background': colorFromHex('#fbeef4') } });
  await page.addStyleTag({ content: emitThemeCSS(parent, { scope: 'root' })
    + emitThemeCSS(child, { selector: ':where(#component-child)' })
    + emitThemeCSS(partial, { kind: 'partial', tokenIds: ['component.input.background'], selector: ':where(#component-partial)' }) });
  await fieldPaint(page, 'root', 'rgb(238, 242, 250)', 'rgb(23, 48, 74)');
  await fieldPaint(page, 'child', 'rgb(255, 255, 255)', 'rgb(27, 31, 36)');
  await fieldPaint(page, 'partial', 'rgb(251, 238, 244)', 'rgb(23, 48, 74)');
  await expect(surface(page, 'child', 'card')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(surface(page, 'partial', 'card')).toHaveCSS('background-color', 'rgb(245, 235, 212)');
  await expect(control(page, 'child', 'button')).toHaveCSS('border-radius', '8px');
  await expect(control(page, 'partial', 'button')).toHaveCSS('border-radius', '14px');

  await page.locator('#component-child').evaluate(region => {
    region.style.setProperty('--en-input-background', 'rgb(222, 235, 225)');
    region.style.setProperty('--en-input-color', 'rgb(30, 45, 35)');
    region.style.setProperty('--en-card-background', 'rgb(225, 230, 245)');
    region.style.setProperty('--en-button-radius', '20px');
  });
  await fieldPaint(page, 'child', 'rgb(222, 235, 225)', 'rgb(30, 45, 35)');
  await expect(control(page, 'child', 'button')).toHaveCSS('border-radius', '20px');
  await expect(surface(page, 'child', 'card')).toHaveCSS('background-color', 'rgb(225, 230, 245)');
  for (const kind of fieldKinds) {
    await page.locator(`#component-child-${kind}`).evaluate(host => {
      host.style.setProperty('--en-input-background', 'rgb(224, 214, 240)');
      host.style.setProperty('--en-input-color', 'rgb(42, 20, 70)');
      host.style.setProperty('--en-control-background', 'rgb(245, 232, 220)');
      host.style.setProperty('--en-control-color', 'rgb(65, 35, 20)');
    });
  }
  await fieldPaint(page, 'child', 'rgb(224, 214, 240)', 'rgb(42, 20, 70)');
  await page.locator('#component-child-card').evaluate(host => {
    host.style.setProperty('--en-card-background', 'rgb(224, 214, 240)');
    host.style.setProperty('--en-surface-background', 'rgb(245, 232, 220)');
  });
  await expect(surface(page, 'child', 'card')).toHaveCSS('background-color', 'rgb(224, 214, 240)');
  for (const kind of fieldKinds) {
    await page.locator(`#component-child-${kind}`).evaluate(host => {
      host.style.removeProperty('--en-control-background');
      host.style.removeProperty('--en-control-color');
    });
  }
  await fieldPaint(page, 'child', 'rgb(224, 214, 240)', 'rgb(42, 20, 70)');
  await page.locator('#component-child-card').evaluate(host => host.style.removeProperty('--en-surface-background'));
  await expect(surface(page, 'child', 'card')).toHaveCSS('background-color', 'rgb(224, 214, 240)');
});
