import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, restoreDerived, densityNames } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';

const part = (page, id, name = 'control') => page.locator(`#${id} [part="${name}"]`);
async function measurement(locator) {
  return locator.evaluate(element => {
    const css = getComputedStyle(element); const bounds = element.getBoundingClientRect();
    return {
      width: bounds.width, height: bounds.height, font: css.fontSize, minimum: css.minBlockSize, padding: css.paddingBlockStart,
      line: parseFloat(css.lineHeight),
      blockPadding: parseFloat(css.paddingBlockStart) + parseFloat(css.paddingBlockEnd),
      blockBorder: parseFloat(css.borderBlockStartWidth) + parseFloat(css.borderBlockEndWidth),
      scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
    };
  });
}
async function record(testInfo, browser, measurements) {
  await testInfo.attach('size-density.json', { body: JSON.stringify({engine:testInfo.project.name,version:browser.version(),measurements},null,2), contentType:'application/json' });
}
test.beforeEach(async ({page,baseURL}) => {
  await stabilizePreview(page,baseURL);
  await page.goto('/');
  await page.evaluate(() => customElements.whenDefined('en-button'));
});

test('three densities preserve type while all visual sizes retain independent target floors', async ({page,browser}, testInfo) => {
  for (const density of densityNames) {
    await page.getByRole('combobox',{name:'Density',exact:true}).selectOption(density);
    const preview = page.locator('#scopes [data-specimen="theme-scopes"] .scope-sample:not([data-en-theme]) en-button [part="control"]');
    await expect(preview).toHaveCSS('min-block-size',`${{compact:38,comfortable:40,spacious:48}[density]}px`);
    await expect(preview).toHaveCSS('font-size','16px');
  }
  const themes = densityNames.map(density => resolveTheme({name:`test-${density}`,density}));
  await page.addStyleTag({content:themes.map(theme => emitThemeCSS(theme)).join('\n')});
  await page.evaluate(names => {
    for (const name of names) {
      const section = document.createElement('section'); section.dataset.enTheme = name;
      const group = document.createElement('div'); group.id = `${name}-group`; group.style.cssText = 'display:flex;gap:var(--en-space-actions);align-items:center';
      for (const size of ['small','medium','large']) {
        const button = document.createElement('en-button'); button.id = `${name}-${size}`; button.setAttribute('size',size); button.textContent = 'Action'; group.append(button);
      }
      section.append(group); document.body.append(section);
    }
  },themes.map(theme => theme.name));
  const measurements = {};
  for (const theme of themes) {
    await expect(page.locator(`#${theme.name}-group`)).toHaveCSS('gap',`${{compact:4,comfortable:6,spacious:8}[theme.density]}px`);
    for (const size of ['small','medium','large']) {
      const target = part(page,`${theme.name}-${size}`);
      await expect(target).toHaveCSS('font-size',`${{small:16,medium:16,large:18}[size]}px`);
      // Shared text/compound geometry, not merely the density baseline or target floor.
      const expectedMinimum = {
        compact: {small:36.5,medium:38,large:44},
        comfortable: {small:36.5,medium:40,large:50},
        spacious: {small:42,medium:48,large:60},
      }[theme.density][size];
      await expect(target).toHaveCSS('min-block-size',`${expectedMinimum}px`);
      await expect.poll(async () => (await measurement(target)).height).toBeCloseTo(expectedMinimum,1);
      const measured = await measurement(target); measurements[`${theme.density}-${size}`] = measured;
      expect(measured.width).toBeGreaterThanOrEqual(24);
    }
  }
  await record(testInfo,browser,measurements);
});

test('explicit inherited size rebases inside a full child theme while absent size remains medium', async ({page,browser},testInfo) => {
  const theme = resolveTheme({name:'test-size-rebase',density:'spacious',pins:{'rhythm.base':{value:.5,unit:'rem'}}});
  await page.addStyleTag({content:emitThemeCSS(theme)});
  await page.evaluate(() => {
    const stack = document.createElement('en-stack'); stack.id = 'size-parent'; stack.setAttribute('size','small');
    const card = document.createElement('en-card'); card.id = 'size-inherited-card'; card.setAttribute('size','inherit');
    const button = document.createElement('en-button'); button.id = 'size-inherited-button'; button.setAttribute('size','inherit'); button.textContent = 'Inherited size'; card.append(button); stack.append(card);
    const nestedTheme = document.createElement('section'); nestedTheme.dataset.enTheme = 'test-size-rebase';
    const nestedCard = document.createElement('en-card'); nestedCard.id = 'size-rebased-card'; nestedCard.setAttribute('size','inherit');
    const nestedButton = document.createElement('en-button'); nestedButton.id = 'size-rebased-button'; nestedButton.setAttribute('size','inherit'); nestedButton.textContent = 'Rebased'; nestedCard.append(nestedButton);
    const explicit = document.createElement('en-button'); explicit.id = 'size-explicit-medium'; explicit.setAttribute('size','medium'); explicit.textContent = 'Explicit medium'; nestedCard.append(explicit);
    const automatic = document.createElement('en-button'); automatic.id = 'size-default-medium'; automatic.textContent = 'Default medium'; nestedCard.append(automatic);
    nestedTheme.append(nestedCard); stack.append(nestedTheme); document.body.append(stack);
  });
  await expect(part(page,'size-inherited-button')).toHaveCSS('font-size','16px');
  await expect(part(page,'size-rebased-button')).toHaveCSS('font-size','16px');
  await expect(part(page,'size-explicit-medium')).toHaveCSS('font-size','16px');
  await expect(part(page,'size-default-medium')).toHaveCSS('font-size','16px');
  await expect(page.locator('#size-default-medium')).not.toHaveAttribute('size');
  await expect(part(page,'size-inherited-button')).toHaveCSS('padding-block-start','5.25px');
  await expect(part(page,'size-rebased-button')).toHaveCSS('padding-block-start','10.5px');
  await expect(part(page,'size-default-medium')).toHaveCSS('padding-block-start','12px');
  await expect(part(page,'size-inherited-card','base')).toHaveCSS('padding-block-start','21px');
  await expect(part(page,'size-rebased-card','base')).toHaveCSS('padding-block-start','56px');
  await record(testInfo,browser,{
    inherited:await measurement(part(page,'size-inherited-card','base')),
    rebased:await measurement(part(page,'size-rebased-card','base')),
    explicit:await measurement(part(page,'size-explicit-medium')),
    default:await measurement(part(page,'size-default-medium')),
  });
});

test('family output pins and direct component overrides survive coordinated size changes', async ({page,browser},testInfo) => {
  const pins = {'size.scale-large':1.5,'size.avatar-large':{value:3.25,unit:'rem'},'size.control-medium':{value:3,unit:'rem'}};
  const css = await page.addStyleTag({content:emitThemeCSS(resolveTheme({name:'test-family-size',pins}))});
  await page.evaluate(() => {
    const region = document.createElement('section'); region.dataset.enTheme = 'test-family-size';
    const avatar = document.createElement('en-avatar'); avatar.id = 'size-avatar'; avatar.setAttribute('size','large'); avatar.setAttribute('name','Review author');
    const spinner = document.createElement('en-spinner'); spinner.id = 'size-spinner'; spinner.setAttribute('size','large');
    const button = document.createElement('en-button'); button.id = 'size-pinned-medium'; button.setAttribute('size','medium'); button.textContent = 'Pinned medium';
    const local = document.createElement('en-button'); local.id = 'size-local-override'; local.setAttribute('size','large'); local.style.setProperty('--en-control-min-size','64px'); local.textContent = 'Local override';
    region.append(avatar,spinner,button,local); document.body.append(region);
  });
  await expect(part(page,'size-avatar','base')).toHaveCSS('inline-size','52px');
  await expect(part(page,'size-spinner','base')).toHaveCSS('inline-size','30px');
  await expect(part(page,'size-pinned-medium')).toHaveCSS('min-block-size','48px');
  await expect(part(page,'size-local-override')).toHaveCSS('min-block-size','64px');
  await css.evaluate((element,text) => {element.textContent=text;},emitThemeCSS(resolveTheme({name:'test-family-size',pins:restoreDerived(pins,'size.avatar-large')})));
  await expect(part(page,'size-avatar','base')).toHaveCSS('inline-size','60px');
  await expect(part(page,'size-local-override')).toHaveCSS('min-block-size','64px');
  await record(testInfo,browser,{avatar:await measurement(part(page,'size-avatar','base')),spinner:await measurement(part(page,'size-spinner','base')),local:await measurement(part(page,'size-local-override'))});
});

test('a very small code-authored visual scale does not multiply the interactive target floor', async ({page,browser},testInfo) => {
  const theme = resolveTheme({name:'test-size-floor',density:'compact',pins:{'size.scale-small':.125}});
  await page.addStyleTag({content:emitThemeCSS(theme)});
  await page.evaluate(() => {
    const section=document.createElement('section'); section.dataset.enTheme='test-size-floor';
    const button=document.createElement('en-button'); button.id='size-floor-button'; button.setAttribute('size','small'); button.textContent='X';
    section.append(button); document.body.append(section);
  });
  await expect(part(page,'size-floor-button')).toHaveCSS('min-block-size','36px');
  const actual = await measurement(part(page,'size-floor-button'));
  expect(actual.height).toBeGreaterThanOrEqual(24); expect(actual.width).toBeGreaterThanOrEqual(24);
  expect(actual.height).toBeGreaterThanOrEqual(actual.line + actual.blockPadding + actual.blockBorder);
  expect(actual.scrollHeight).toBeLessThanOrEqual(actual.clientHeight + 1);
  await record(testInfo,browser,actual);
});
