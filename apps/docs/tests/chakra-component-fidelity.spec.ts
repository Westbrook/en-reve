import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';
import { emulationLimits } from './theme-proof-exceptions.js';

// Expectations below are independent measurements of the selected Chakra 3.37.0
// defaults, not values read back from our recipe or resolved token output.
const reference = 'https://github.com/chakra-ui/chakra-ui/tree/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/recipes';
type Appearance = 'light' | 'dark';
const test = base.extend<{}, { chakraCSS: string }>({
  chakraCSS: [async ({ browser }, use, workerInfo) => {
    const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const setupErrors: string[] = [];
    page.on('pageerror', error => setupErrors.push(error.message));
    try {
      await page.goto('/showcase?appearance=light&progress-report');
      await expect(page.locator('en-showcase-app')).not.toHaveAttribute('data-ssr');
      await expect(page.getByRole('button', { name: 'Download JSON', exact: true })).toBeEnabled();
      const themes = page.locator('#showcase-theme');
      await themes.getByRole('combobox').selectOption('chakra-inspired');
      await expect(themes).toHaveJSProperty('value', 'chakra-inspired', { timeout: 30_000 });
      await expect(page.locator('.showcase-theme-error')).toHaveCount(0);
      await expect(page.locator('.showcase-theme-status')).toContainText('Applied Chakra');
      await expect(page.locator('html')).toHaveAttribute('data-en-theme', 'chakra-inspired');
      const action = page.getByRole('button', { name: 'Download CSS', exact: true });
      await expect(action).toBeEnabled();
      const pending = page.waitForEvent('download');
      await action.click();
      const download = await pending;
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe('chakra-inspired.css');
      const stream = await download.createReadStream();
      if (!stream) throw new Error('The public CSS download has no readable bytes.');
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      const css = Buffer.concat(chunks).toString('utf8');
      // The export documents its element boundary explicitly. Consume these
      // unchanged bytes using that same name on standalone and nested roots.
      expect(css).toContain(':where([data-en-theme="chakra-inspired"])');
      expect(css).toContain('[data-en-appearance="light"]');
      expect(css).toContain('[data-en-appearance="dark"]');
      expect(css).toContain('::part(');
      await expect(page.locator('.showcase-theme-status')).toContainText('data-en-theme="chakra-inspired"');
      expect(setupErrors, 'Public theme selection/export has no runtime errors').toEqual([]);
      await use(css);
    } catch (error) {
      const applicationErrors = await page.locator('.showcase-theme-error').allTextContents().catch(() => []);
      if (setupErrors.length || applicationErrors.length) throw new Error(`Public theme export setup failed. ${[...setupErrors, ...applicationErrors].join('; ')}`, { cause: error });
      throw error;
    } finally { await context.close(); }
  }, { scope: 'worker' }],
});

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser, chakraCSS }, info) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  info.annotations.push({ type: 'browser-version', description: browser.version() }, { type: 'reference', description: reference });
  await info.attach('theme-consumption', { contentType: 'application/json', body: JSON.stringify({
    mode: 'Public Download CSS bytes applied to hydrated production API examples with documented theme boundary attributes',
    sha256: createHash('sha256').update(chakraCSS).digest('hex'), reference,
    adaptations: 'Content and touch target floors remain; native semantics and overlay lifecycle remain En Reve.',
  }, null, 2) });
});
test.afterEach(async ({ page }) => {
  // A failed worker fixture never reaches beforeEach; retain that original error.
  if (errors.has(page)) expect(errors.get(page), 'No component or theme runtime errors').toEqual([]);
});

async function open(page: Page, example: string, appearance: Appearance, css: string) {
  await page.goto(`/api-examples/${example}.html?progress-report`);
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await expect(page.locator(`[data-specimen="${example}"]`)).toBeVisible();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-specimen] *')]
    .filter(element => element.localName.startsWith('en-')).every(element => customElements.get(element.localName)));
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('[data-specimen] *')].map(element => element.updateComplete));
  });
  if (css) await installThemeCSS(page, css);
  await page.locator('html').evaluate((element, mode) => {
    element.setAttribute('data-en-theme', 'chakra-inspired');
    element.setAttribute('data-en-appearance', mode);
    element.setAttribute('data-example-mode', mode);
  }, appearance);
  await page.evaluate(() => document.fonts.ready);
  await settleTheme(page);
}
async function installThemeCSS(page: Page, css: string) {
  const sheet = await page.addStyleTag({ content: css });
  // Production specimens can load public base styles from body links. Install
  // the unchanged exported theme after those links so its recipe wins by order.
  await sheet.evaluate(element => document.body.append(element));
}
// Style-container queries may settle on the next rendering opportunity. Wait
// for browser frames, never a fixed duration; dynamic checks also poll results.
async function settleTheme(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
const specimen = (page: Page) => page.locator('[data-specimen]');
// Public Part names may recur in authored descendants (for example card avatars).
// CSS traversal encounters the host's own Part before nested component Parts.
const part = (host: Locator, name: string) => host.locator(`[part~="${name}"]`).first();
async function style(target: Locator, names: string[], pseudo?: string) {
  return target.evaluate((element, { names, pseudo }) => {
    const computed = getComputedStyle(element, pseudo);
    return Object.fromEntries(names.map(name => [name, computed.getPropertyValue(name).trim()]));
  }, { names, pseudo });
}
async function evidence(page: Page, info: TestInfo, name: string, measurements: unknown, target = specimen(page)) {
  await info.attach(`${name}-measurements`, { contentType: 'application/json', body: JSON.stringify(measurements, null, 2) });
  const path = info.outputPath(`${name}.png`);
  await target.screenshot({ path, animations: 'disabled' });
  await info.attach(name, { contentType: 'image/png', path });
}
const typeAndShape = ['font-size', 'line-height', 'font-weight', 'border-radius', 'padding-inline-start', 'padding-block-start', 'border-top-width'];
// A zero transparent shadow is the portable representation of shadow.none.
// Visible colors, nonzero offsets/blur/spread, inset, and layered shadows fail.
const noVisibleShadow = /^(?:none|rgba\(0, 0, 0, 0\) 0px 0px 0px 0px)$/;
const neutralBadgePaint = {
  light: { 'background-color': 'rgb(244, 244, 245)', color: 'rgb(39, 39, 42)' },
  dark: { 'background-color': 'rgb(24, 24, 27)', color: 'rgb(228, 228, 231)' },
};
const require = createRequire(import.meta.url);

async function nativeStyles(page: Page, info: TestInfo) {
  // These are the documented portable package exports, not extracted shadow CSS
  // or an invented docs URL. The production docs route supplies the real runtime.
  const exports = await Promise.all(['foundations', 'controls', 'feedback', 'surfaces', 'overlays', 'selection', 'patterns', 'typography', 'recipes'].map(async family => {
    const name = `@en-reve/styles/${family}.css`;
    const css = await readFile(require.resolve(name), 'utf8');
    return { name, css, sha256: createHash('sha256').update(css).digest('hex') };
  }));
  for (const { css } of exports) await page.addStyleTag({ content: css });
  await info.attach('native-style-consumption', { contentType: 'application/json', body: JSON.stringify({
    mode: 'Unmodified public portable CSS exports and semantic HTML authored inside the production content-recipes specimen',
    exports: exports.map(({ name, sha256 }) => ({ name, sha256 })),
    behavior: 'Native details and dialog lifecycle; minimal authored tab state, as required by the behavior-free native style contract',
  }, null, 2) });
}

for (const appearance of ['light', 'dark'] as const) {
  test(`${appearance}: portable native helpers retain reference geometry, paint and semantic states`, async ({ page, chakraCSS }, info) => {
    await open(page, 'content-recipes', appearance, '');
    await nativeStyles(page, info);
    await installThemeCSS(page, chakraCSS);
    await specimen(page).evaluate((element, mode) => {
      const native = document.createElement('section'); native.id = 'native-fidelity'; native.className = 'en-foundation';
      native.innerHTML = `
        <h2 class="en-heading-small">Portable native composition</h2>
        <div>${['primary', 'secondary', 'ghost', 'danger'].map(variant => `<button class="en-button" data-size="medium" data-variant="${variant}" id="native-${variant}">${variant}</button> <button class="en-button" data-size="medium" data-variant="${variant}" id="native-${variant}-disabled" disabled>${variant} unavailable</button>`).join(' ')}</div>
        <p><a class="en-link" href="#native-card">Read the native card</a> <span class="en-badge">Ready</span></p>
        <article class="en-card" id="native-card"><header class="en-card__header">Native card heading</header><div class="en-card__body">A semantic card using the public section classes.</div><footer class="en-card__footer"><button class="en-button" id="native-open-dialog">Open native dialog</button></footer></article>
        <dialog class="en-dialog" id="native-dialog" aria-labelledby="native-dialog-title"><header class="en-overlay-header"><h2 class="en-heading-small" id="native-dialog-title">Native dialog heading</h2></header><div class="en-overlay-body">The browser owns this modal's focus and dismissal.</div><footer class="en-overlay-footer"><button class="en-button" id="native-close-dialog">Close native dialog</button></footer></dialog>
        <details class="en-accordion-item"><summary class="en-accordion-trigger">Native details</summary><div class="en-accordion-panel">Native disclosure content.</div></details>
        <div class="en-tabs"><div class="en-tab-list" role="tablist" aria-label="Native views"><button class="en-tab" id="native-tab-one" role="tab" aria-selected="true" aria-controls="native-panel-one">Native overview</button><button class="en-tab" id="native-tab-two" role="tab" aria-selected="false" aria-controls="native-panel-two" tabindex="-1">Native settings</button></div><section class="en-tab-panel" id="native-panel-one" role="tabpanel" aria-labelledby="native-tab-one">Overview content</section><section class="en-tab-panel" id="native-panel-two" role="tabpanel" aria-labelledby="native-tab-two" hidden>Settings content</section></div>
        <p><progress class="en-progress" value="60" max="100" aria-label="Native completion">60%</progress> <code class="en-code">theme</code> <kbd class="en-keycap">K</kbd></p>
        <blockquote class="en-recipe-quote"><p>Make room for a clear thought.</p><footer>Reference quote</footer></blockquote>
        <div class="en-prose"><blockquote><p>Prose uses the same quiet quote treatment.</p></blockquote><ul><li>A prose list marker</li></ul></div>
        <dl class="en-recipe-description-list"><dt>Owner</dt><dd>Studio team</dd><dt>State</dt><dd>Ready for review</dd></dl>`;
      // A full theme may begin on the native helper itself, including disabled
      // controls; companions must style that boundary as well as its descendants.
      for (const target of native.querySelectorAll<HTMLElement>('#native-primary, #native-primary-disabled, #native-card, #native-tab-two')) {
        target.dataset.enTheme = 'chakra-inspired'; target.dataset.enAppearance = mode;
      }
      element.append(native);
      const dialog = native.querySelector<HTMLDialogElement>('#native-dialog')!;
      native.querySelector('#native-open-dialog')!.addEventListener('click', () => dialog.showModal());
      native.querySelector('#native-close-dialog')!.addEventListener('click', () => dialog.close());
      for (const tab of native.querySelectorAll<HTMLButtonElement>('[role="tab"]')) tab.addEventListener('click', () => {
        for (const item of native.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
          const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
          native.querySelector<HTMLElement>(`#${item.getAttribute('aria-controls')}`)!.hidden = !selected;
        }
      });
    }, appearance);
    await settleTheme(page);
    const native = page.locator('#native-fidelity');
    const measurements: Record<string, unknown> = {};
    for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
      const action = native.locator(`#native-${variant}`), disabled = native.locator(`#native-${variant}-disabled`);
      const shape = await style(action, typeAndShape);
      expect(shape).toMatchObject({ 'font-size': '14px', 'line-height': '20px', 'font-weight': '500', 'border-radius': '4px', 'padding-inline-start': '16px' });
      expect((await action.boundingBox())!.height).toBeCloseTo(40, 0);
      await expect(disabled).toBeDisabled(); await expect(disabled).toHaveCSS('opacity', '0.5');
      const paint = await style(action, ['background-color', 'color', 'border-top-color']);
      expect(await style(disabled, ['background-color', 'color', 'border-top-color']), `${variant}: disabled retains the variant paint`).toEqual(paint);
      measurements[variant] = { shape, paint };
    }
    const primary = native.locator('#native-primary');
    await primary.evaluate(element => (element as HTMLElement).style.setProperty('--en-button-inline-padding', '28px'));
    await expect(primary).toHaveCSS('padding-inline-start', '28px');
    await primary.evaluate(element => (element as HTMLElement).style.removeProperty('--en-button-inline-padding'));
    const link = native.getByRole('link', { name: 'Read the native card' });
    await expect(link).toHaveCSS('text-decoration-line', 'none');
    await link.hover(); await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await link.focus(); await expect(link).toBeFocused();
    expect(await style(native.locator('.en-badge'), typeAndShape)).toMatchObject({ 'font-size': '12px', 'line-height': '16px', 'font-weight': '500', 'border-radius': '4px', 'padding-inline-start': '6px', 'padding-block-start': '0px', 'border-top-width': '0px' });
    expect(await style(native.locator('.en-badge'), ['background-color', 'color']), 'The unset native badge variant receives the source neutral subtle palette').toEqual(neutralBadgePaint[appearance]);
    const nativeCard = native.locator('.en-card');
    const cardBase = await style(nativeCard, ['padding-top', 'padding-inline-start', 'padding-bottom', 'padding-inline-end', 'gap', 'font-size', 'line-height']);
    const cardRules = await nativeCard.evaluate(element => {
      const matches: { source: string; context: string[]; selector: string; declarations: string }[] = [];
      const visit = (rules: CSSRuleList, source: string, context: string[]) => {
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)
            && ['padding', 'padding-inline', 'padding-block', 'gap', 'font-size', 'line-height'].some(property => rule.style.getPropertyValue(property))) {
            matches.push({ source, context, selector: rule.selectorText, declarations: rule.style.cssText });
          }
          if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules, source, [...context, rule.cssText.slice(0, rule.cssText.indexOf('{')).trim()]);
        }
      };
      for (const [index, sheet] of Array.from(document.styleSheets).entries()) {
        try { visit(sheet.cssRules, sheet.href ?? `inline stylesheet ${index}`, []); } catch { /* Cross-origin sheets cannot be inspected. */ }
      }
      return matches;
    });
    measurements.card = { base: cardBase, matchedRules: cardRules };
    await info.attach(`${appearance}-native-card-cascade`, { contentType: 'application/json', body: JSON.stringify(measurements.card, null, 2) });
    // Section spacing must not be added on top of the ordinary card shell's
    // padding/gap. This also exercises a native helper that owns its full theme.
    expect(cardBase).toEqual({ 'padding-top': '0px', 'padding-inline-start': '0px', 'padding-bottom': '0px', 'padding-inline-end': '0px', gap: '0px', 'font-size': '16px', 'line-height': '24px' });
    expect(await style(native.locator('.en-card__body'), ['padding-top', 'padding-inline-start', 'padding-bottom', 'font-size', 'line-height'])).toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '24px', 'font-size': '16px', 'line-height': '24px' });
    await expect(nativeCard).toHaveCSS('box-shadow', noVisibleShadow);
    expect(await style(native.locator('.en-card__header'), ['font-size', 'line-height', 'font-weight'])).toEqual({ 'font-size': '18px', 'line-height': '28px', 'font-weight': '600' });
    const disclosure = native.locator('.en-accordion-trigger');
    await disclosure.click(); await expect(native.locator('details')).toHaveAttribute('open', '');
    expect(await style(disclosure, typeAndShape.concat('background-color'))).toMatchObject({ 'font-size': '16px', 'line-height': '24px', 'font-weight': '500', 'padding-inline-start': '0px', 'padding-block-start': '8px', 'border-radius': '4px', 'background-color': 'rgba(0, 0, 0, 0)' });
    expect(await style(native.locator('.en-accordion-panel'), ['padding-top', 'padding-inline-start', 'padding-bottom'])).toEqual({ 'padding-top': '8px', 'padding-inline-start': '0px', 'padding-bottom': '16px' });
    const tab = native.getByRole('tab', { name: 'Native settings' });
    await tab.click(); await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(native.getByRole('tabpanel', { name: 'Native settings' })).toBeVisible();
    await expect(native.locator('.en-tab-list')).toHaveCSS('gap', '0px');
    expect(await style(tab, ['padding-inline-start', 'padding-block-start', 'border-bottom-width', 'background-color'])).toEqual({ 'padding-inline-start': '16px', 'padding-block-start': '8px', 'border-bottom-width': '2px', 'background-color': 'rgba(0, 0, 0, 0)' });
    // The tab itself is a full theme boundary. Its ordinary public ancestor
    // context still determines vertical presentation across that boundary.
    await native.locator('.en-tab-list').evaluate(element => element.setAttribute('aria-orientation', 'vertical'));
    await expect.poll(() => style(tab, ['border-block-end-width', 'border-inline-end-width', 'padding-inline-start'])).toEqual({ 'border-block-end-width': '0px', 'border-inline-end-width': '2px', 'padding-inline-start': '16px' });
    expect(await style(native.locator('progress'), ['height', 'border-radius'])).toEqual({ height: '10px', 'border-radius': '2px' });
    expect(await style(native.locator('code'), ['font-size', 'line-height', 'padding-inline-start', 'min-height'])).toEqual({ 'font-size': '12px', 'line-height': '16px', 'padding-inline-start': '6px', 'min-height': '20px' });
    expect(await style(native.locator('kbd'), ['font-size', 'line-height', 'padding-inline-start', 'border-bottom-width'])).toEqual({ 'font-size': '14px', 'line-height': '20px', 'padding-inline-start': '4px', 'border-bottom-width': '2px' });
    for (const quote of [native.locator('.en-recipe-quote'), native.locator('.en-prose blockquote')]) {
      expect(await style(quote, ['padding-inline-start', 'padding-inline-end', 'border-inline-start-width', 'border-inline-start-color', 'gap'])).toEqual({ 'padding-inline-start': '20px', 'padding-inline-end': '20px', 'border-inline-start-width': '4px', 'border-inline-start-color': appearance === 'light' ? 'rgb(228, 228, 231)' : 'rgb(39, 39, 42)', gap: '8px' });
    }
    expect((await style(native.locator('li'), ['color'], '::marker')).color).toBe(appearance === 'light' ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)');
    expect(await style(native.locator('dl'), ['font-size', 'line-height', 'row-gap'])).toEqual({ 'font-size': '14px', 'line-height': '20px', 'row-gap': '4px' });
    expect(await style(native.locator('dt').first(), ['font-weight', 'color'])).toEqual({ 'font-weight': '400', color: appearance === 'light' ? 'rgb(82, 82, 91)' : 'rgb(161, 161, 170)' });
    await expect(native.locator('dd').first()).toHaveCSS('margin-bottom', '12px');
    await expect(native.locator('dd').last()).toHaveCSS('margin-bottom', '0px');
    await evidence(page, info, `${appearance}-native-helpers`, measurements, native);
    const nativeOpener = native.getByRole('button', { name: 'Open native dialog', exact: true });
    // Native Safari button clicks do not establish focus. Keyboard activation
    // gives the browser a focused invoker to restore when the dialog closes.
    await nativeOpener.focus(); await nativeOpener.press('Enter');
    const dialog = native.getByRole('dialog', { name: 'Native dialog heading' });
    await expect(dialog).toBeVisible(); expect((await dialog.boundingBox())!.width).toBeCloseTo(512, 0);
    expect(await style(dialog.locator('.en-overlay-body'), ['padding-top', 'padding-inline-start', 'padding-bottom'])).toEqual({ 'padding-top': '8px', 'padding-inline-start': '24px', 'padding-bottom': '24px' });
    await evidence(page, info, `${appearance}-native-dialog`, await style(dialog, typeAndShape), dialog);
    await dialog.getByRole('button', { name: 'Close native dialog', exact: true }).click();
    await expect(dialog).not.toBeVisible(); await expect(nativeOpener).toBeFocused();
  });

  test(`${appearance}: exported action sizes, disabled paint and native editing`, async ({ page, chakraCSS }, info) => {
    await open(page, 'button-scale', appearance, chakraCSS);
    const scales: Record<string, unknown> = {};
    for (const [label, height, padding, font] of [['Small', 36, '14px', '14px'], ['Medium', 40, '16px', '14px'], ['Large', 44, '20px', '16px']] as const) {
      const button = specimen(page).getByRole('button', { name: label, exact: true });
      const measured = await style(button, typeAndShape);
      expect(measured).toMatchObject({ 'font-size': font, 'line-height': label === 'Large' ? '24px' : '20px', 'font-weight': '500', 'border-radius': '4px', 'padding-inline-start': padding });
      expect((await button.boundingBox())!.height).toBeCloseTo(height, 0);
      scales[label] = measured;
      const host = specimen(page).locator('en-button').filter({ has: page.getByRole('button', { name: label, exact: true }) });
      await host.evaluate(element => (element as HTMLElement).style.setProperty('--en-button-inline-padding', '28px'));
      await expect(button, 'Documented local padding overrides remain authoritative at every public size').toHaveCSS('padding-inline-start', '28px');
      await host.evaluate(element => (element as HTMLElement).style.removeProperty('--en-button-inline-padding'));
    }
    await evidence(page, info, `${appearance}-action-sizes`, scales);
    await open(page, 'buttons', appearance, chakraCSS);
    const disabled = specimen(page).getByRole('button', { name: 'Unavailable', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveCSS('opacity', '0.5');
    expect(await style(disabled, ['background-color', 'color'])).toEqual(await style(specimen(page).getByRole('button', { name: 'Save changes', exact: true }), ['background-color', 'color']));
    await open(page, 'text-fields', appearance, chakraCSS);
    const host = specimen(page).locator('en-text-field').filter({ has: page.getByRole('textbox', { name: 'Project name', exact: true }) });
    const field = host.getByRole('textbox', { name: 'Project name', exact: true });
    const measured = await style(field, typeAndShape.concat('background-color'));
    expect(measured).toMatchObject({ 'font-size': '14px', 'line-height': '20px', 'border-radius': '4px', 'padding-inline-start': '12px', 'border-top-width': '1px', 'background-color': 'rgba(0, 0, 0, 0)' });
    expect(await style(part(host, 'description'), ['font-size', 'line-height', 'font-weight'])).toEqual({ 'font-size': '12px', 'line-height': '16px', 'font-weight': '400' });
    await host.evaluate(element => (element as HTMLElement).style.setProperty('--en-input-inline-padding', '22px'));
    await expect(field, 'Documented field padding remains locally customizable').toHaveCSS('padding-inline-start', '22px');
    await host.evaluate(element => (element as HTMLElement).style.removeProperty('--en-input-inline-padding'));
    await field.fill('A project edited through the real input');
    await expect(field).toHaveValue('A project edited through the real input');
    await expect(field).toBeFocused();
    await evidence(page, info, `${appearance}-fields`, measured);
    await open(page, 'long-text-search', appearance, chakraCSS);
    expect(await style(specimen(page).locator('en-textarea').getByRole('textbox'), ['padding-block-start', 'padding-inline-start'])).toEqual({ 'padding-block-start': '8px', 'padding-inline-start': '12px' });
  });

  test(`${appearance}: solid choices and enclosed segmented selection`, async ({ page, chakraCSS }, info) => {
    await open(page, 'checkboxes-switches', appearance, chakraCSS);
    const checkbox = specimen(page).getByRole('checkbox', { name: 'Include source files', exact: true });
    const switchHost = specimen(page).locator('en-switch').first();
    const toggle = switchHost.getByRole('switch');
    await expect(toggle).toBeChecked();
    expect(await style(checkbox, ['width', 'height', 'border-radius'])).toEqual({ width: '20px', height: '20px', 'border-radius': '2px' });
    expect(await style(part(switchHost, 'label'), ['gap'])).toEqual({ gap: '10px' });
    expect(await style(toggle, ['width', 'height'])).toEqual({ width: '40px', height: '20px' });
    const thumb = await style(toggle, ['background-color', 'width', 'height', 'box-shadow'], '::before');
    // Upstream 2a668458 restores teal with white colorPalette.contrast in both appearances.
    expect(thumb['background-color']).toBe('rgb(255, 255, 255)');
    expect(thumb['box-shadow']).not.toBe('none');
    await checkbox.uncheck(); await expect(checkbox).not.toBeChecked();
    await toggle.uncheck(); await expect(toggle).not.toBeChecked();
    const uncheckedThumb = await style(toggle, ['background-color'], '::before');
    expect(uncheckedThumb['background-color']).toBe('rgb(255, 255, 255)');
    await evidence(page, info, `${appearance}-choices`, { thumb, uncheckedThumb });
    await open(page, 'radio-group', appearance, chakraCSS);
    const radio = specimen(page).getByRole('radio', { name: 'Highest quality', exact: true });
    await radio.check(); await expect(radio).toBeChecked();
    const selected = await style(radio, ['background-color', 'border-top-color']);
    expect(selected['background-color']).toBe(selected['border-top-color']);
    expect((await style(radio, ['background-color'], '::before'))['background-color']).toBe('rgb(255, 255, 255)');
    await open(page, 'family-geometry', appearance, chakraCSS);
    const segments = specimen(page).locator('en-segmented-control').first();
    const frame = await style(part(segments, 'options'), ['padding-top', 'gap', 'border-top-width', 'border-radius']);
    expect(frame).toEqual({ 'padding-top': '0px', gap: '0px', 'border-top-width': '0px', 'border-radius': '4px' });
    const preview = segments.getByRole('radio', { name: 'Preview', exact: true });
    await preview.focus(); await preview.press('Space');
    await expect(segments).toHaveJSProperty('value', 'preview');
    const option = await style(part(segments, 'option-selected'), ['padding-inline-start', 'border-radius', 'box-shadow', 'background-color']);
    expect(option).toMatchObject({ 'padding-inline-start': '16px', 'border-radius': '4px', 'background-color': appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(39, 39, 42)' });
    expect(option['box-shadow']).not.toBe('none');
    await evidence(page, info, `${appearance}-segments`, { frame, option });
  });

  test(`${appearance}: sectioned card, modal and drawer retain their real lifecycle`, async ({ page, chakraCSS }, info) => {
    await open(page, 'card', appearance, chakraCSS);
    const card = specimen(page).locator('en-card');
    const content = await style(part(card, 'content'), ['padding-top', 'padding-inline-start', 'padding-bottom', 'font-size', 'line-height']);
    expect(content).toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '24px', 'font-size': '16px', 'line-height': '24px' });
    expect(await style(part(card, 'header'), ['font-size', 'line-height', 'font-weight'])).toEqual({ 'font-size': '18px', 'line-height': '28px', 'font-weight': '600' });
    await expect(part(card, 'base')).toHaveCSS('box-shadow', noVisibleShadow);
    await card.evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-padding', '32px'));
    await expect(part(card, 'content')).toHaveCSS('padding-inline-start', '32px');
    await card.evaluate(element => (element as HTMLElement).style.removeProperty('--en-surface-padding'));
    await evidence(page, info, `${appearance}-card`, { content });
    await open(page, 'dialog-drawer', appearance, chakraCSS);
    const opener = specimen(page).getByRole('button', { name: 'Open dialog', exact: true });
    await opener.focus(); await opener.press('Enter');
    const modal = specimen(page).locator('en-dialog');
    await expect(modal.getByRole('dialog')).toBeVisible();
    const heading = await style(part(modal, 'heading'), ['font-size', 'line-height', 'font-weight']);
    expect(heading).toEqual({ 'font-size': '18px', 'line-height': '28px', 'font-weight': '600' });
    expect(await style(part(modal, 'header'), ['padding-top', 'padding-inline-start', 'padding-bottom'])).toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '16px' });
    expect(await style(part(modal, 'body'), ['padding-top', 'padding-inline-start', 'padding-bottom'])).toEqual({ 'padding-top': '8px', 'padding-inline-start': '24px', 'padding-bottom': '24px' });
    expect((await part(modal, 'surface').boundingBox())!.width).toBeCloseTo(512, 0);
    await modal.evaluate(element => {
      (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '448px');
      (element as HTMLElement).style.setProperty('--en-overlay-padding', '10px');
    });
    expect((await part(modal, 'surface').boundingBox())!.width).toBeCloseTo(448, 0);
    await expect(part(modal, 'body')).toHaveCSS('padding-inline-start', '10px');
    await modal.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-padding'));
    await modal.evaluate(element => (element as HTMLElement).style.setProperty('--en-button-focus-halo-width', '30px'));
    expect(parseFloat((await style(part(modal, 'body'), ['padding-inline-start']))['padding-inline-start']), 'Section padding retains clearance for larger public focus contours').toBeGreaterThanOrEqual(30);
    await modal.evaluate(element => {
      (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size');
      (element as HTMLElement).style.removeProperty('--en-overlay-padding');
      (element as HTMLElement).style.removeProperty('--en-button-focus-halo-width');
    });
    await modal.getByRole('textbox', { name: 'Email address', exact: true }).fill('review@example.com');
    await evidence(page, info, `${appearance}-dialog`, { heading }, part(modal, 'surface'));
    await modal.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(modal.getByRole('dialog')).not.toBeVisible(); await expect(opener).toBeFocused();
    await specimen(page).getByRole('button', { name: 'Open drawer', exact: true }).click();
    const drawer = specimen(page).locator('en-drawer');
    await expect(drawer.getByRole('dialog')).toBeVisible();
    expect((await part(drawer, 'surface').boundingBox())!.width).toBeCloseTo(320, 0);
    await page.keyboard.press('Escape'); await expect(drawer.getByRole('dialog')).not.toBeVisible();
  });

  test(`${appearance}: inverse tooltip and compact popover`, async ({ page, chakraCSS }, info) => {
    await open(page, 'popover-tooltip', appearance, chakraCSS);
    await specimen(page).getByRole('button', { name: 'Hover or focus', exact: true }).focus();
    const tooltip = specimen(page).locator('en-tooltip');
    await expect(part(tooltip, 'surface')).toBeVisible();
    const measured = await style(part(tooltip, 'surface'), ['font-size', 'line-height', 'font-weight', 'background-color', 'color', 'border-top-width']);
    expect(measured).toMatchObject({ 'font-size': '12px', 'line-height': '16px', 'font-weight': '500', 'border-top-width': '0px', 'background-color': appearance === 'light' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)' });
    expect(await style(part(tooltip, 'content'), ['padding-top', 'padding-inline-start'])).toEqual({ 'padding-top': '4px', 'padding-inline-start': '10px' });
    await tooltip.evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-padding', '8px'));
    expect(await style(part(tooltip, 'content'), ['padding-top', 'padding-inline-start'])).toEqual({ 'padding-top': '8px', 'padding-inline-start': '8px' });
    await tooltip.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-padding'));
    await evidence(page, info, `${appearance}-tooltip`, measured, part(tooltip, 'surface'));
    await page.keyboard.press('Escape'); await expect(part(tooltip, 'surface')).not.toBeVisible();
    await specimen(page).getByRole('button', { name: 'View options', exact: true }).click();
    const popover = specimen(page).locator('en-popover');
    await expect(popover.getByRole('dialog')).toBeVisible();
    await expect(part(popover, 'surface')).toHaveCSS('border-top-width', '0px');
    await expect(part(popover, 'body')).toHaveCSS('padding-top', '20px');
    expect((await part(popover, 'surface').boundingBox())!.width).toBeCloseTo(320, 0);
    await popover.getByRole('checkbox', { name: 'Show outlines', exact: true }).check();
    await expect(popover.getByRole('checkbox', { name: 'Show outlines', exact: true })).toBeChecked();
    await evidence(page, info, `${appearance}-popover`, await style(part(popover, 'surface'), typeAndShape), part(popover, 'surface'));
    await popover.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(popover.getByRole('dialog')).not.toBeVisible();
  });

  test(`${appearance}: badge, avatar, semantic alerts and loading presentation`, async ({ page, chakraCSS }, info) => {
    // Identity is a sticker-sheet gallery section, not a generated API route.
    // The public card example contains an authored default badge and md avatar.
    await open(page, 'card', appearance, chakraCSS);
    const badge = part(specimen(page).locator('en-badge').filter({ hasText: 'References' }), 'base');
    const measured = await style(badge, typeAndShape.concat('min-height'));
    expect(measured).toMatchObject({ 'font-size': '12px', 'line-height': '16px', 'font-weight': '500', 'border-radius': '4px', 'padding-inline-start': '6px', 'padding-block-start': '0px', 'border-top-width': '0px', 'min-height': '20px' });
    expect(await style(badge, ['background-color', 'color']), 'The authored default badge receives the source neutral subtle palette').toEqual(neutralBadgePaint[appearance]);
    const avatar = specimen(page).locator('en-avatar');
    expect((await part(avatar, 'base').boundingBox())!.width).toBeCloseTo(40, 0);
    expect(await style(part(avatar, 'fallback'), ['font-size', 'line-height', 'text-transform'])).toEqual({ 'font-size': '16px', 'line-height': '16px', 'text-transform': 'uppercase' });
    await evidence(page, info, `${appearance}-identity`, measured);
    await open(page, 'messages', appearance, chakraCSS);
    const infoAlert = specimen(page).locator('en-alert[variant="info"]');
    // En Reve retains a transparent boundary so the documented local alert
    // border-color override remains usable; the source's default is unoutlined.
    expect(await style(part(infoAlert, 'base'), ['border-top-width', 'border-top-color'])).toEqual({ 'border-top-width': '1px', 'border-top-color': 'rgba(0, 0, 0, 0)' });
    await expect(part(infoAlert, 'content')).toHaveCSS('font-weight', '400');
    const expectedInfo = appearance === 'light'
      ? { 'background-color': 'rgb(219, 234, 254)', color: 'rgb(23, 61, 166)' }
      : { 'background-color': 'rgb(20, 32, 74)', color: 'rgb(163, 207, 255)' };
    // Semantic status colors remain distinct from the neutral default palette.
    const alertPaint = await style(part(infoAlert, 'base'), ['background-color', 'color']);
    expect(alertPaint).toEqual(expectedInfo);
    await evidence(page, info, `${appearance}-alerts`, { alertPaint });
    await open(page, 'loading', appearance, chakraCSS);
    const track = part(specimen(page).locator('en-progress-bar'), 'track');
    expect(await style(track, ['height', 'border-radius'])).toEqual({ height: '10px', 'border-radius': '2px' });
    const spinner = part(specimen(page).locator('en-spinner'), 'base');
    expect(await style(spinner, ['width', 'border-top-width', 'border-bottom-color', 'border-inline-start-color'])).toEqual({ width: '20px', 'border-top-width': '2px', 'border-bottom-color': 'rgba(0, 0, 0, 0)', 'border-inline-start-color': 'rgba(0, 0, 0, 0)' });
    const skeleton = part(specimen(page).locator('en-skeleton').last(), 'base');
    await expect(skeleton).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(skeleton).toHaveCSS('animation-duration', '1.2s');
    await expect(spinner).toHaveCSS('animation-duration', '0.5s');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(skeleton).toHaveCSS('animation-name', 'none');
    await evidence(page, info, `${appearance}-loading`, { track: await style(track, ['height', 'border-radius', 'box-shadow']) });
  });

  test(`${appearance}: line tabs and outline accordion retain selection and disclosure`, async ({ page, chakraCSS }, info) => {
    await open(page, 'tabs', appearance, chakraCSS);
    const tabs = specimen(page).locator('en-tabs');
    await expect(part(tabs, 'tab-list')).toHaveCSS('gap', '0px');
    const layout = tabs.getByRole('tab', { name: 'Layout', exact: true });
    await layout.click(); await expect(layout).toHaveAttribute('aria-selected', 'true');
    const active = part(specimen(page).locator('en-tab[aria-selected="true"]'), 'base');
    expect(await style(active, ['padding-inline-start', 'border-bottom-width', 'background-color'])).toEqual({ 'padding-inline-start': '16px', 'border-bottom-width': '2px', 'background-color': 'rgba(0, 0, 0, 0)' });
    await evidence(page, info, `${appearance}-tabs`, await style(active, typeAndShape));
    await open(page, 'accordion', appearance, chakraCSS);
    const trigger = specimen(page).getByRole('button', { name: 'Appearance', exact: true });
    const measured = await style(trigger, ['font-size', 'line-height', 'padding-inline-start', 'padding-top', 'border-radius', 'background-color']);
    expect(measured).toEqual({ 'font-size': '16px', 'line-height': '24px', 'padding-inline-start': '0px', 'padding-top': '8px', 'border-radius': '4px', 'background-color': 'rgba(0, 0, 0, 0)' });
    await trigger.click(); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const item = specimen(page).locator('en-accordion-item').filter({ has: page.getByRole('button', { name: 'Appearance', exact: true }) });
    expect(await style(part(item, 'panel'), ['padding-inline-start', 'padding-top', 'padding-bottom'])).toEqual({ 'padding-inline-start': '0px', 'padding-top': '8px', 'padding-bottom': '16px' });
    await expect(part(item, 'indicator')).toHaveCSS('transition-duration', '0s');
    await evidence(page, info, `${appearance}-accordion`, measured);
  });

  test(`${appearance}: menu and combobox surfaces retain real choices`, async ({ page, chakraCSS }, info) => {
    await open(page, 'menu-choices', appearance, chakraCSS);
    await specimen(page).getByRole('button', { name: 'Preview options', exact: true }).click();
    const menu = specimen(page).locator('#menu-choices');
    await expect(menu.getByRole('menu', { name: 'Preview options', exact: true })).toBeVisible();
    const surface = await style(part(menu, 'surface'), ['border-radius', 'border-top-width', 'padding-top']);
    // Chakra's default md menu uses space.1.5; 4px belongs to its sm recipe.
    expect(surface).toMatchObject({ 'border-radius': '4px', 'border-top-width': '0px', 'padding-top': '6px' });
    const choice = menu.getByRole('menuitemradio', { name: 'Landscape', exact: true });
    await choice.click(); await expect(choice).toHaveAttribute('aria-checked', 'true');
    await evidence(page, info, `${appearance}-menu`, surface, part(menu, 'surface'));
    await page.keyboard.press('Escape');
    await open(page, 'combobox', appearance, chakraCSS);
    const host = specimen(page).locator('en-combobox');
    const input = host.getByRole('combobox', { name: 'Project', exact: true });
    await input.fill('Studio'); await input.press('ArrowDown');
    await expect(host.getByRole('listbox')).toBeVisible();
    await expect(part(host, 'popup')).toHaveCSS('border-top-width', '0px');
    await expect(part(host, 'popup')).toHaveCSS('border-radius', '4px');
    const option = host.getByRole('option', { name: 'Studio South', exact: true });
    await option.click(); await expect(input).toHaveValue('Studio South');
    await specimen(page).getByRole('button', { name: 'Use project', exact: true }).click();
    await expect(specimen(page).getByRole('status').first()).toContainText('Submitted project: studio-south');
  });

  test(`${appearance}: calendar states and line table density`, async ({ page, chakraCSS }, info) => {
    await open(page, 'calendar', appearance, chakraCSS);
    const calendar = specimen(page).locator('#specimen-calendar');
    await expect(part(calendar, 'heading')).toHaveCSS('font-weight', '600');
    expect(await style(part(calendar, 'weekday').first(), ['font-size', 'line-height', 'padding-top', 'text-transform'])).toEqual({ 'font-size': '12px', 'line-height': '16px', 'padding-top': '8px', 'text-transform': 'uppercase' });
    const today = part(calendar, 'today');
    expect(await style(today, ['font-weight', 'text-decoration-line', 'text-decoration-thickness', 'text-underline-offset'])).toEqual({ 'font-weight': '600', 'text-decoration-line': 'underline', 'text-decoration-thickness': '2px', 'text-underline-offset': '3px' });
    const date = calendar.getByRole('button', { name: 'Monday, September 21, 2026', exact: true });
    await date.click(); await expect(calendar).toHaveJSProperty('value', '2026-09-21');
    const selected = await style(part(calendar, 'selected'), ['background-color', 'color']);
    expect(selected['background-color']).not.toBe(selected.color);
    await date.hover(); expect(await style(part(calendar, 'selected'), ['background-color', 'color'])).toEqual(selected);
    await evidence(page, info, `${appearance}-calendar`, { selected }, calendar);
    await open(page, 'data-table', appearance, chakraCSS);
    const table = specimen(page).locator('#records-table');
    // The first column is an application selection target with its own compact
    // inset. Source table density applies to an ordinary authored data cell.
    const cell = table.getByRole('cell', { name: 'Document', exact: true }).first();
    expect(await style(cell, ['padding-top', 'padding-inline-start', 'font-size', 'line-height'])).toEqual({ 'padding-top': '12px', 'padding-inline-start': '12px', 'font-size': '14px', 'line-height': '20px' });
    const selectionCell = table.getByRole('cell').filter({ has: page.getByRole('checkbox', { name: 'Select Study 0001', exact: true }) });
    await expect(selectionCell, 'The selection column keeps its documented compact inset').toHaveCSS('padding-inline-start', '4px');
    await expect(part(table, 'caption')).toHaveCSS('font-size', '12px');
    // The facade's public surface is en-table; its own base is exported as
    // table-surface. Exported aliases are not literal DOM part attributes.
    await expect(part(part(table, 'surface'), 'base')).toHaveCSS('border-radius', '0px');
    await table.getByRole('checkbox', { name: 'Select Study 0001', exact: true }).check();
    await expect(table.getByRole('checkbox', { name: 'Select Study 0001', exact: true })).toBeChecked();
    await evidence(page, info, `${appearance}-table`, await style(cell, typeAndShape), table);
  });

  test(`${appearance}: tree, color, upload and native text helper presentation`, async ({ page, chakraCSS }, info) => {
    await open(page, 'tree-view', appearance, chakraCSS);
    const tree = specimen(page).locator('#specimen-tree');
    const artwork = tree.locator('en-tree-item[value="artwork"]');
    await expect(part(artwork, 'group')).toHaveCSS('padding-inline-start', '24px');
    const accent = tree.getByRole('treeitem', { name: 'Accent', exact: true });
    await accent.focus(); await accent.press('Space');
    await expect(accent).toHaveAttribute('aria-selected', 'true');
    await expect(part(tree.locator('en-tree-item[value="accent"]'), 'option')).toHaveCSS('font-weight', '400');
    await evidence(page, info, `${appearance}-tree`, await style(part(artwork, 'group'), ['padding-inline-start']), tree);
    await open(page, 'color-picker', appearance, chakraCSS);
    const picker = specimen(page).locator('#basic-color-picker');
    const colorBox = await style(part(picker, 'base'), ['width', 'padding-top', 'border-radius']);
    expect(colorBox).toEqual({ width: '256px', 'padding-top': '16px', 'border-radius': '6px' });
    const hex = picker.getByRole('textbox', { name: 'Hex color', exact: true });
    await hex.fill('#aabbcc'); await hex.press('Enter');
    await expect(picker).toHaveJSProperty('value', '#aabbcc');
    await evidence(page, info, `${appearance}-color-picker`, colorBox, picker);
    await open(page, 'file-upload', appearance, chakraCSS);
    const upload = specimen(page).locator('#file-upload-choice');
    const dropzone = await style(part(upload, 'dropzone'), ['min-height', 'border-top-width', 'border-radius', 'flex-direction']);
    expect(dropzone).toEqual({ 'min-height': '256px', 'border-top-width': '2px', 'border-radius': '6px', 'flex-direction': 'column' });
    await upload.locator('input[type="file"]').setInputFiles({ name: 'review.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nLocal presentation fixture') });
    await expect(upload.getByRole('button', { name: 'Remove review.pdf', exact: true })).toBeVisible();
    expect(await style(part(upload, 'file'), ['padding-top', 'border-radius', 'gap'])).toEqual({ 'padding-top': '16px', 'border-radius': '4px', gap: '12px' });
    await evidence(page, info, `${appearance}-file-upload`, { dropzone }, upload);
    await upload.getByRole('button', { name: 'Remove review.pdf', exact: true }).click();
    await expect(upload.getByRole('button', { name: 'Remove review.pdf', exact: true })).toHaveCount(0);
    await page.goto(`/component-patterns?theme=chakra-inspired&appearance=${appearance}`);
    await expect(page.locator('html')).toHaveAttribute('data-en-theme', 'chakra-inspired');
    await settleTheme(page);
    const code = page.locator('code.en-code');
    expect(await style(code, ['font-size', 'line-height', 'padding-inline-start', 'min-height'])).toEqual({ 'font-size': '12px', 'line-height': '16px', 'padding-inline-start': '6px', 'min-height': '20px' });
    const keycap = page.locator('kbd.en-keycap');
    expect(await style(keycap, ['font-size', 'line-height', 'padding-inline-start', 'border-bottom-width'])).toEqual({ 'font-size': '14px', 'line-height': '20px', 'padding-inline-start': '4px', 'border-bottom-width': '2px' });
    const preview = page.getByRole('button', { name: 'Preview collaborator', exact: true });
    // Hover is a supplemental preview; focus alone intentionally does not open it.
    await preview.focus(); await preview.hover();
    const hoverCard = page.locator('en-hover-card');
    await expect(part(hoverCard, 'surface')).toBeVisible();
    await expect(preview).toBeFocused();
    await preview.press('Enter'); await expect(hoverCard.getByRole('dialog')).toBeFocused();
    expect(await style(part(hoverCard, 'surface'), ['font-size', 'line-height'])).toEqual({ 'font-size': '14px', 'line-height': '20px' });
    await expect(part(hoverCard, 'body')).toHaveCSS('padding-inline-start', '20px');
    expect((await part(hoverCard, 'surface').boundingBox())!.width).toBeLessThanOrEqual(320);
    await expect(hoverCard.getByRole('link', { name: 'View shared work', exact: true })).toBeVisible();
    await evidence(page, info, `${appearance}-hover-card`, await style(part(hoverCard, 'surface'), typeAndShape), part(hoverCard, 'surface'));
  });

  test(`${appearance}: progress steps, status and activity preserve their application behavior`, async ({ page, chakraCSS }, info) => {
    await open(page, 'multi-step', appearance, chakraCSS);
    const steps = specimen(page).locator('#brief-progress');
    const number = part(steps, 'number');
    const numberGeometry = await style(number, ['width', 'height', 'border-radius', 'border-top-width']);
    expect(numberGeometry).toEqual({ width: '40px', height: '40px', 'border-radius': '50%', 'border-top-width': '2px' });
    await expect(part(steps, 'control')).toHaveCSS('gap', '12px');
    await specimen(page).getByRole('textbox', { name: 'Project name', exact: true }).fill('Component review');
    await specimen(page).getByRole('textbox', { name: 'Work email', exact: true }).fill('review@example.com');
    await specimen(page).getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(steps).toHaveJSProperty('value', 'delivery');
    await expect(steps.getByRole('button', { name: /Review date/ })).toHaveAttribute('aria-current', 'step');
    await evidence(page, info, `${appearance}-steps`, numberGeometry, steps);
    await open(page, 'presence-activity', appearance, chakraCSS);
    const presence = specimen(page).locator('#presence-example');
    await expect(part(presence, 'status')).toHaveCSS('gap', '8px');
    const indicator = await style(part(presence, 'indicator'), ['width', 'height']);
    expect(parseFloat(indicator.width)).toBeCloseTo(8.96, 1);
    expect(parseFloat(indicator.height)).toBeCloseTo(8.96, 1);
    await specimen(page).getByRole('button', { name: 'Toggle Mira’s availability', exact: true }).click();
    await expect(part(presence, 'status')).toContainText('Away');
    // Preserve En Reve's text and shape cues instead of imitating color alone.
    await expect(part(presence, 'indicator')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    const feed = specimen(page).locator('#activity-feed-example');
    await expect(part(feed, 'list')).toHaveCSS('gap', '24px');
    const entry = feed.locator('en-activity-item').first();
    expect(await style(part(entry, 'base'), ['padding-top', 'background-color', 'border-top-color'])).toEqual({ 'padding-top': '0px', 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-color': 'rgba(0, 0, 0, 0)' });
    await expect(part(entry, 'header')).toHaveCSS('gap', '6px');
    await expect(part(entry, 'author')).toHaveCSS('font-weight', '500');
    await expect(part(entry, 'content')).toHaveCSS('font-weight', '400');
    await evidence(page, info, `${appearance}-status-activity`, { indicator }, feed);
  });
}

test('full nested theme boundaries and switching away remove companion presentation', async ({ page, chakraCSS }, info) => {
  await open(page, 'mixed-toolbar', 'light', chakraCSS);
  const nestedCSS = emitThemeCSS(resolveTheme({ name: 'nested-control', mode: 'light' }), { selector: '#nested-control', colorScheme: true });
  await page.addStyleTag({ content: nestedCSS });
  await specimen(page).evaluate(element => {
    const boundary = document.createElement('section'); boundary.id = 'nested-control'; boundary.dataset.enTheme = 'nested-control';
    for (const original of element.querySelectorAll('en-text-field, en-checkbox, en-button')) {
      const clone = original.cloneNode(true) as HTMLElement; clone.removeAttribute('id'); boundary.append(clone);
    }
    element.append(boundary);
  });
  const inner = page.locator('#nested-control');
  const native = inner.getByRole('textbox');
  await expect(native).toBeVisible();
  const before = await style(native, ['border-radius', 'font-size', 'background-color']);
  const outer = specimen(page).locator('en-toolbar').getByRole('textbox');
  expect(await style(outer, ['border-radius', 'font-size', 'background-color'])).not.toEqual(before);
  // The full nested theme resets inherited hooks and excludes ancestor Part rules.
  await page.locator('html').evaluate(element => element.setAttribute('data-en-appearance', 'dark'));
  expect(await style(native, ['border-radius', 'font-size', 'background-color'])).toEqual(before);
  await evidence(page, info, 'nested-theme-boundaries', { before });
  await page.goto('/api-examples/mixed-toolbar.html?progress-report');
  const theme = page.getByRole('combobox', { name: 'Inspired theme', exact: true });
  const field = specimen(page).getByRole('textbox', { name: 'Study title', exact: true });
  const original = await style(field, ['border-radius', 'background-color']);
  await theme.selectOption('chakra-inspired');
  await expect(page.getByRole('status', { name: 'Theme result', exact: true })).toContainText('Chakra');
  await field.fill('Preserve this edit');
  await theme.selectOption('default');
  await expect(page.getByRole('status', { name: 'Theme result', exact: true })).toContainText('Default theme restored');
  expect(await style(field, ['border-radius', 'background-color'])).toEqual(original);
  await expect(field).toHaveValue('Preserve this edit');
  await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
});

test('repeated and direct Chakra boundaries reapply companions after a full default theme', async ({ page, chakraCSS }, info) => {
  // Start with the real hydrated card example and its default presentation. The
  // public export is deliberately applied after recording the middle boundary.
  await open(page, 'card', 'light', '');
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'middle-default', mode: 'light' }), { selector: '#middle-default', colorScheme: true }) });
  await specimen(page).evaluate(async element => {
    const source = element.querySelector('en-card')!;
    const sample = (id: string) => {
      const card = source.cloneNode(true) as HTMLElement;
      card.id = id;
      // Public medium sizes expose the same reference geometry at each boundary.
      for (const button of card.querySelectorAll('en-button')) button.removeAttribute('size');
      return card;
    };
    const boundary = (id: string, theme: string) => {
      const region = document.createElement('section'); region.id = id;
      region.dataset.enTheme = theme; region.dataset.enAppearance = 'light';
      return region;
    };
    const middle = boundary('middle-default', 'middle-default');
    middle.append(sample('middle-default-card'));
    const returned = boundary('chakra-returned', 'chakra-inspired');
    returned.append(sample('chakra-returned-card')); middle.append(returned);
    const repeated = boundary('chakra-repeated', 'chakra-inspired');
    repeated.append(sample('chakra-repeated-card'));
    const directCard = sample('chakra-direct-card');
    directCard.dataset.enTheme = 'chakra-inspired'; directCard.dataset.enAppearance = 'light';
    const directButton = source.querySelector('en-button')!.cloneNode(true) as HTMLElement;
    directButton.id = 'chakra-direct-button'; directButton.removeAttribute('size');
    directButton.dataset.enTheme = 'chakra-inspired'; directButton.dataset.enAppearance = 'light';
    directButton.setAttribute('disabled', '');
    middle.append(directCard, directButton);
    element.append(middle, repeated);
    await Promise.all([...element.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(node => node.updateComplete));
  });
  const middle = page.locator('#middle-default-card');
  const signature = async (card: Locator) => ({
    base: await style(part(card, 'base'), ['padding-top', 'border-radius']),
    content: await style(part(card, 'content'), ['padding-top', 'padding-inline-start', 'padding-bottom']),
    button: await style(card.getByRole('button', { name: 'Open study', exact: true }), ['padding-inline-start', 'font-size', 'border-radius']),
  });
  const defaultBefore = await signature(middle);
  await page.addStyleTag({ content: chakraCSS });
  const observed: Record<string, unknown> = { middleBefore: defaultBefore };
  for (const id of ['chakra-returned-card', 'chakra-repeated-card', 'chakra-direct-card']) {
    const card = page.locator(`#${id}`);
    await expect.poll(async () => (await signature(card)).content, { message: `${id}: public card Parts receive the closest Chakra companion` }).toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '24px' });
    await expect.poll(async () => (await signature(card)).button, { message: `${id}: medium action presentation is restored` }).toEqual({ 'padding-inline-start': '16px', 'font-size': '14px', 'border-radius': '4px' });
    observed[id] = await signature(card);
  }
  const directButton = page.locator('#chakra-direct-button').getByRole('button');
  const directButtonNames = ['padding-inline-start', 'font-size', 'line-height', 'font-weight', 'border-radius', 'opacity'];
  await expect.poll(() => style(directButton, directButtonNames), { message: 'The component host is itself the complete theme boundary' }).toEqual({ 'padding-inline-start': '16px', 'font-size': '14px', 'line-height': '20px', 'font-weight': '500', 'border-radius': '4px', opacity: '0.5' });
  await expect(directButton).toBeDisabled();
  observed.directButton = await style(directButton, directButtonNames);
  await expect.poll(() => signature(middle), { message: 'The intervening complete default theme retains its original presentation' }).toEqual(defaultBefore);
  const defaultAfter = await signature(middle);
  expect(defaultAfter.content, 'The default card does not acquire the Chakra section padding').not.toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '24px' });
  observed.middleAfter = defaultAfter;
  // Change existing section and direct-host boundaries in place. A complete
  // default theme must remove companions, and returning to Chakra must restore
  // them without leaking through its intervening default ancestor.
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'boundary-default', mode: 'light' }), { colorScheme: true }) });
  for (const [boundaryId, cardId] of [['chakra-returned', 'chakra-returned-card'], ['chakra-direct-card', 'chakra-direct-card']]) {
    const boundary = page.locator(`#${boundaryId}`), card = page.locator(`#${cardId}`);
    await boundary.evaluate(element => element.setAttribute('data-en-theme', 'boundary-default'));
    await expect.poll(() => signature(card), { message: `${boundaryId}: replacing a full theme removes its companion` }).toEqual(defaultBefore);
    await boundary.evaluate(element => { element.setAttribute('data-en-theme', 'chakra-inspired'); element.setAttribute('data-en-appearance', 'dark'); });
    await expect.poll(async () => (await signature(card)).content).toEqual({ 'padding-top': '24px', 'padding-inline-start': '24px', 'padding-bottom': '24px' });
    const badge = part(card.locator('en-badge').filter({ hasText: 'References' }), 'base');
    await expect.poll(() => style(badge, ['background-color', 'color'])).toEqual(neutralBadgePaint.dark);
    await boundary.evaluate(element => element.setAttribute('data-en-appearance', 'auto'));
    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme });
      await expect.poll(() => style(badge, ['background-color', 'color']), { message: `${boundaryId}: auto follows ${colorScheme} media` }).toEqual(neutralBadgePaint[colorScheme]);
      await expect.poll(() => signature(middle), { message: 'An explicitly light full default ancestor stays isolated from descendant appearance changes' }).toEqual(defaultBefore);
    }
    await boundary.evaluate(element => element.setAttribute('data-en-appearance', 'light'));
    observed[`${boundaryId}-after-dynamic-cycle`] = await signature(card);
  }
  await evidence(page, info, 'repeated-theme-boundaries', observed);
});

test('the reserved companion container name composes with consumer queries and shorthand', async ({ page, chakraCSS }, info) => {
  await open(page, 'card', 'light', chakraCSS);
  await specimen(page).evaluate(element => {
    const card = element.querySelector('en-card')!;
    const boundary = document.createElement('section'); boundary.id = 'consumer-query-boundary';
    boundary.dataset.enTheme = 'chakra-inspired'; boundary.dataset.enAppearance = 'light';
    card.replaceWith(boundary); boundary.append(card);
    const probe = document.createElement('span'); probe.id = 'consumer-query-probe'; probe.textContent = 'Consumer query composition'; boundary.append(probe);
  });
  const boundary = page.locator('#consumer-query-boundary'), card = boundary.locator('en-card'), probe = page.locator('#consumer-query-probe');
  await expect(boundary).toHaveCSS('container-name', '--en-theme-companion');
  await expect(boundary, 'Themes do not introduce size containment').toHaveCSS('container-type', 'normal');
  await expect(page.locator('html')).toHaveCSS('container-type', 'normal');
  await boundary.evaluate(element => {
    const style = (element as HTMLElement).style;
    style.containerName = 'consumer-layout --en-theme-companion';
    style.setProperty('--consumer-mode', 'ready');
  });
  // Ordinary consumer CSS preserves the reserved name when adding its own name.
  await page.addStyleTag({ content: '@container consumer-layout style(--consumer-mode: ready) { #consumer-query-probe { --consumer-style-result: matched; } } @container consumer-layout (min-width: 1px) { #consumer-query-probe { --consumer-size-result: matched; } }' });
  await expect.poll(() => style(probe, ['--consumer-style-result'])).toEqual({ '--consumer-style-result': 'matched' });
  await expect(boundary).toHaveCSS('container-type', 'normal');
  await expect.poll(() => style(part(card, 'content'), ['padding-top', 'font-size', 'line-height'])).toEqual({ 'padding-top': '24px', 'font-size': '16px', 'line-height': '24px' });
  await boundary.evaluate(element => { (element as HTMLElement).style.container = 'consumer-layout --en-theme-companion / inline-size'; });
  await expect(boundary).toHaveCSS('container-name', 'consumer-layout --en-theme-companion');
  await expect(boundary).toHaveCSS('container-type', 'inline-size');
  await expect.poll(() => style(probe, ['--consumer-style-result', '--consumer-size-result'])).toEqual({ '--consumer-style-result': 'matched', '--consumer-size-result': 'matched' });
  await expect.poll(() => style(part(card, 'content'), ['padding-top', 'font-size', 'line-height'])).toEqual({ 'padding-top': '24px', 'font-size': '16px', 'line-height': '24px' });
  await evidence(page, info, 'consumer-container-composition', { boundary: await style(boundary, ['container-name', 'container-type']), queries: await style(probe, ['--consumer-style-result', '--consumer-size-result']) }, boundary);
});

test('narrow RTL and enlarged text preserve companion content and keyboard editing', async ({ page, chakraCSS }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'mixed-toolbar', 'dark', chakraCSS);
  await page.locator('html').evaluate(element => { (element as HTMLHtmlElement).dir = 'rtl'; element.style.fontSize = '200%'; });
  const field = specimen(page).getByRole('textbox', { name: 'Study title', exact: true });
  await field.fill('Longer translated project title');
  const apply = specimen(page).getByRole('button', { name: 'Apply preview settings', exact: true });
  await apply.focus(); await apply.press('Enter');
  await expect(specimen(page).getByRole('status')).toContainText('Longer translated project title');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const geometry = await apply.evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
  await evidence(page, info, 'narrow-rtl-enlarged', geometry);
  await open(page, 'dialog-drawer', 'dark', chakraCSS);
  await page.locator('html').evaluate(element => { (element as HTMLHtmlElement).dir = 'rtl'; element.style.fontSize = '200%'; });
  const modal = specimen(page).locator('en-dialog');
  await modal.evaluate(element => {
    element.setAttribute('label', 'A longer translated invitation heading with several wrapping lines');
    element.setAttribute('description', 'This description should remain inside the section spacing when the text is enlarged.');
  });
  await specimen(page).getByRole('button', { name: 'Open dialog', exact: true }).click();
  await expect(modal.getByRole('dialog')).toBeVisible();
  // The public close Part is an exported alias from en-button, not a literal
  // Part attribute in the dialog shadow root. Measure its real accessible control.
  const closeGeometry = await modal.getByRole('button', { name: 'Close', exact: true }).evaluate(element => {
    const { left, right, top, bottom } = element.getBoundingClientRect();
    return { left, right, top, bottom };
  });
  const modalGeometry = await modal.evaluate((element, close) => {
    const root = element.shadowRoot!;
    const surface = root.querySelector('[part~="surface"]')!.getBoundingClientRect();
    const textRects = (partName: string) => {
      const target = root.querySelector(`[part~="${partName}"]`)!;
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const rectangles: { left: number; right: number; top: number; bottom: number }[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rectangle of range.getClientRects()) if (rectangle.width && rectangle.height) rectangles.push({ left: rectangle.left, right: rectangle.right, top: rectangle.top, bottom: rectangle.bottom });
      }
      return rectangles;
    };
    const title = textRects('heading'), description = textRects('description');
    return {
      titleLines: title.length, descriptionLines: description.length,
      titleOverlapsClose: title.some(rect => rect.left < close.right && rect.right > close.left && rect.top < close.bottom && rect.bottom > close.top),
      descriptionInsets: description.map(rect => Math.min(rect.left - surface.left, surface.right - rect.right)),
      width: surface.width, viewport: innerWidth,
    };
  }, closeGeometry);
  expect(modalGeometry.titleLines).toBeGreaterThan(1);
  expect(modalGeometry.descriptionLines).toBeGreaterThan(0);
  expect(modalGeometry.titleOverlapsClose).toBe(false);
  expect(Math.min(...modalGeometry.descriptionInsets)).toBeGreaterThanOrEqual(24);
  expect(modalGeometry.width).toBeLessThanOrEqual(modalGeometry.viewport);
  await evidence(page, info, 'narrow-rtl-enlarged-dialog', modalGeometry, part(modal, 'surface'));
});

test('coarse pointer preserves choice targets and selection', async ({ browser, browserName, baseURL, chakraCSS }, info) => {
  test.skip(Boolean(emulationLimits.touch[browserName]), emulationLimits.touch[browserName]);
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage(); await open(page, 'family-geometry', 'light', chakraCSS);
    expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(true);
    const segments = specimen(page).locator('en-segmented-control').first();
    const target = part(segments, 'option').first();
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await segments.getByText('Preview', { exact: true }).tap();
    await expect(segments).toHaveJSProperty('value', 'preview');
    await evidence(page, info, 'coarse-segmented-targets', await target.boundingBox());
  } finally { await context.close(); }
});

test('forced colors retain system paint and visible keyboard focus', async ({ page, browserName, chakraCSS }, info) => {
  test.skip(Boolean(emulationLimits.forcedColors[browserName]), emulationLimits.forcedColors[browserName]);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await open(page, 'checkboxes-switches', 'dark', chakraCSS);
  const selected = specimen(page).getByRole('checkbox', { name: 'Include source files', exact: true });
  await selected.focus(); await expect(selected).toBeFocused();
  const measured = await style(selected, ['outline-style', 'outline-width', 'forced-color-adjust', 'background-color', 'border-top-color']);
  expect(measured['outline-style']).not.toBe('none');
  expect(parseFloat(measured['outline-width'])).toBeGreaterThanOrEqual(2);
  await selected.uncheck(); await expect(selected).not.toBeChecked();
  await evidence(page, info, 'forced-color-choices', measured);
  await open(page, 'popover-tooltip', 'dark', chakraCSS);
  await specimen(page).getByRole('button', { name: 'Hover or focus', exact: true }).focus();
  const tooltip = part(specimen(page).locator('en-tooltip'), 'surface');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('box-shadow', 'none');
  expect((await style(tooltip, ['color', 'background-color'])).color).not.toBe((await style(tooltip, ['color', 'background-color']))['background-color']);
});
