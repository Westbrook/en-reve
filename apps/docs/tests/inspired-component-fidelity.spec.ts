import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { colorFromHex, emitThemeCSS, resolveTheme } from '@en-reve/tokens';
import { emulationLimits } from './theme-proof-exceptions.js';

// Literal observations from the source identities below, not values resolved
// from our theme recipes. See plans/theme-deep-review/fidelity-evidence.md for
// the precise source/adaptation boundary. Chakra and Holotable are out of scope.
const references = {
  'spectrum-inspired': { url: 'https://github.com/adobe/react-spectrum/tree/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/@react-spectrum/s2', font: 14, leading: 18, choice: 16, switch: [26, 16, 8, 10], cardRadius: 10 },
  'fluent-inspired': { url: 'https://github.com/microsoft/fluentui/tree/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components', font: 14, leading: 20, choice: 16, switch: [40, 20, 14, 14], cardRadius: 22 },
  'astryx-inspired': { url: 'https://github.com/facebook/astryx/tree/d2daa25689f6e7552df17b10194eec4ad34f7575/packages/core/src', font: 14, leading: 20, choice: 24, switch: [40, 24, 16, 20], cardRadius: 16 },
  'shadcn-inspired': { url: 'https://github.com/shadcn-ui/ui/tree/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry', font: 14, leading: 20, choice: 16, switch: [32, 20, 16, 16], cardRadius: 24 },
  'radix-inspired': { url: 'https://github.com/radix-ui/themes/tree/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src/components', font: 14, leading: 20, choice: 16, switch: [35, 20, 18, 18], cardRadius: 8 },
  'web-awesome-inspired': { url: 'https://webawesome.com/docs/themes/', font: 16, leading: 19.2, choice: 20, switch: [35, 20, 12, 12], cardRadius: 12 },
} as const;
type Theme = keyof typeof references;
type Appearance = 'light' | 'dark';
const themes = Object.keys(references) as Theme[];
const test = base.extend<{}, { exportedCSS: Record<Theme, string> }>({
  exportedCSS: [async ({ browser }, use, workerInfo) => {
    const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL, reducedMotion: 'reduce' });
    const css = {} as Record<Theme, string>;
    try {
      const page = await context.newPage();
      for (const theme of themes) {
        await page.goto(`/showcase?theme=${theme}&appearance=light&progress-report`);
        await expect(page.locator('html')).toHaveAttribute('data-en-theme', theme);
        const action = page.getByRole('button', { name: 'Download CSS', exact: true });
        await expect(action).toBeEnabled();
        const pending = page.waitForEvent('download'); await action.click();
        const download = await pending; expect(await download.failure()).toBeNull();
        const stream = await download.createReadStream();
        if (!stream) throw new Error(`${theme}: Download CSS returned no readable bytes`);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        css[theme] = Buffer.concat(chunks).toString('utf8');
        expect(css[theme]).toContain(theme); expect(css[theme]).toContain('::part(');
      }
    } finally { await context.close(); }
    await use(css);
  }, { scope: 'worker', timeout: 180_000 }],
});
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser, exportedCSS }, info) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  await info.attach('source-and-consumption', { contentType: 'application/json', body: JSON.stringify({
    consumption: 'Unmodified public Download CSS bytes applied to hydrated production API specimens and public portable native CSS exports',
    sources: Object.fromEntries(themes.map(theme => [theme, { ...references[theme], cssSHA256: createHash('sha256').update(exportedCSS[theme]).digest('hex') }])),
    limits: 'Source package/website flavors and protected target adaptations are documented in plans/theme-deep-review. Font stacks do not establish proprietary font availability. Automated checks do not establish manual assistive-technology or visual acceptance.',
  }, null, 2) });
});
test.afterEach(async ({ page }) => { expect(errors.get(page), 'No theme or component runtime errors').toEqual([]); });

const specimen = (page: Page) => page.locator('[data-specimen]');
const part = (host: Locator, name: string) => host.locator(`[part~="${name}"]`).first();
async function style(target: Locator, names: string[], pseudo?: string) {
  return target.evaluate((element, args) => {
    const value = getComputedStyle(element, args.pseudo);
    return Object.fromEntries(args.names.map(name => [name, value.getPropertyValue(name)]));
  }, { names, pseudo });
}

const actionSignature = (target: Locator) => style(target, ['font-size', 'line-height', 'font-weight', 'border-radius', 'padding-inline-start', 'background-color', 'color', 'border-top-color']);

for (const theme of themes) {
  test(`${theme}: omitted Auto, native defaults, toggle aliases and repeated full boundaries`, async ({ page, exportedCSS }, info) => {
    // This production page explicitly registers the full public catalogue. The
    // probes below author public HTML, never import a private shadow stylesheet.
    await page.goto('/component-patterns?progress-report');
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible(); await settled(page);
    await nativeStyles(page, info, ['feedback']);
    await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'middle-default', mode: 'light' }), { selector: '#middle-default', colorScheme: true }) });
    await page.evaluate(theme => {
      const fixture = document.createElement('section'); fixture.id = 'boundary-fidelity';
      const boundary = (id: string, name: string, appearance?: string) => {
        const region = document.createElement('section'); region.id = id; region.className = 'en-foundation';
        region.dataset.enTheme = name; if (appearance) region.dataset.enAppearance = appearance;
        region.innerHTML = '<en-button variant="secondary">Ordinary action</en-button><en-toggle-button>Toggle action</en-toggle-button><button class="en-button">Native default</button><button class="en-button" data-variant="primary">Native explicit</button><en-checkbox checked>Choice</en-checkbox><span class="application-container-probe">Application query</span>';
        return region;
      };
      const explicit = boundary('explicit-scope', theme, 'light');
      const middle = boundary('middle-default', 'middle-default', 'light');
      middle.append(boundary('returned-scope', theme, 'light'));
      explicit.append(middle, boundary('repeated-scope', theme, 'light'));
      const content = document.createElement('div'); content.id = 'application-content';
      content.style.setProperty('container-name', 'fidelity-content');
      content.innerHTML = '<en-button variant="secondary">Wrapped action</en-button><en-checkbox checked>Wrapped choice</en-checkbox><div id="override-inheritance"><en-alert id="override-custom">Custom boundary message.</en-alert><div id="override-native" class="en-alert"><div class="en-alert__content">Native boundary message.</div></div></div>';
      explicit.append(content);
      fixture.append(explicit, boundary('omitted-scope', theme), boundary('auto-scope', theme, 'auto'));
      const rootAction = document.createElement('en-button');
      rootAction.id = 'component-scope'; rootAction.setAttribute('variant', 'secondary');
      rootAction.dataset.enTheme = theme; rootAction.dataset.enAppearance = 'light';
      rootAction.textContent = 'Component boundary'; fixture.append(rootAction);
      const rootNative = document.createElement('button');
      rootNative.id = 'native-component-scope'; rootNative.className = 'en-button';
      rootNative.dataset.enTheme = theme; rootNative.dataset.enAppearance = 'light';
      // Native button typography intentionally inherits its foundation region;
      // its own full-theme boundary still exercises direct-subject delivery.
      rootNative.textContent = 'Native component boundary'; content.append(rootNative);
      document.body.append(fixture);
    }, theme);
    await settled(page);
    const ordinary = (id: string) => page.locator(`#${id} > en-button`).getByRole('button');
    const before = await actionSignature(ordinary('middle-default'));
    await mountExportedCSS(page, exportedCSS[theme]);
    const reference = await actionSignature(ordinary('explicit-scope'));
    expect(await actionSignature(page.locator('#component-scope').getByRole('button')), 'A custom element can own its full theme boundary').toEqual(reference);
    expect(await actionSignature(page.locator('#native-component-scope')), 'A native helper can own its full theme boundary').toEqual(await actionSignature(page.locator('#explicit-scope > button').first()));
    expect(await actionSignature(ordinary('middle-default')), 'A full B boundary is unchanged by ancestor A companions').toEqual(before);
    expect(await actionSignature(ordinary('returned-scope')), 'A → B → A restores all A companion presentation').toEqual(reference);
    expect(await actionSignature(ordinary('repeated-scope')), 'Same-name nesting reapplies the nearest A companion').toEqual(reference);
    const outer = page.locator('#explicit-scope');
    await metrics(outer.locator(':scope > en-checkbox').getByRole('checkbox'), { width: references[theme].choice });
    expect(await style(outer, ['container-type']), 'Companion delivery does not introduce layout containment').toEqual({ 'container-type': 'normal' });
    const toggle = outer.locator(':scope > en-toggle-button').getByRole('button');
    expect(await actionSignature(toggle), 'The default secondary toggle receives the ordinary secondary companion').toEqual(reference);
    expect(await actionSignature(outer.locator(':scope > button').first()), 'Omitted native variant has the primary default').toEqual(await actionSignature(outer.locator(':scope > button').last()));
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await outer.locator(':scope > en-toggle-button').evaluate(element => {
      element.addEventListener('en-change', event => event.preventDefault(), { once: true });
    });
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await outer.evaluate(element => element.setAttribute('data-en-appearance', 'dark'));
    const darkReference = await actionSignature(ordinary('explicit-scope'));
    await outer.evaluate(element => element.setAttribute('data-en-appearance', 'light'));
    // Consumers that name a full-theme container compose the reserved name.
    // The application's query must work alongside the companion's query, and
    // an unrelated named container between a theme and a Part must not stop it.
    await page.addStyleTag({ content: `
      #boundary-fidelity [data-en-theme] {
        container-name: fidelity-layout --en-theme-companion;
        --fidelity-application-ready: 1;
      }
      @container fidelity-layout style(--fidelity-application-ready: 1) {
        #boundary-fidelity .application-container-probe { text-indent: 7px; }
      }
    ` });
    const composed = await page.locator('#boundary-fidelity [data-en-theme]').evaluateAll(elements => elements.map(element => ({
      id: element.id, names: getComputedStyle(element).containerName.split(/\s+/), type: getComputedStyle(element).containerType,
    })));
    for (const container of composed) {
      expect(container.names, container.id).toEqual(['fidelity-layout', '--en-theme-companion']);
      expect(container.type, container.id).toBe('normal');
    }
    for (const id of ['explicit-scope', 'middle-default', 'returned-scope', 'repeated-scope', 'omitted-scope', 'auto-scope']) {
      await metrics(page.locator(`#${id} > .application-container-probe`), { 'text-indent': 7 });
    }
    const alertOwners = [page.locator('#override-custom'), page.locator('#override-native')];
    const alertFrames = [part(alertOwners[0], 'base'), alertOwners[1]];
    const observations: Record<string, unknown> = { defaultBefore: before, explicitLight: reference, explicitDark: darkReference, composedContainers: composed };
    for (const system of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: system });
      for (const appearance of ['light', 'dark', 'auto', undefined] as const) {
        await page.locator(`#boundary-fidelity [data-en-theme="${theme}"]`).evaluateAll((elements, mode) => {
          for (const element of elements) {
            if (mode === undefined) element.removeAttribute('data-en-appearance');
            else element.setAttribute('data-en-appearance', mode);
          }
        }, appearance);
        const effective = appearance === 'light' || appearance === 'dark' ? appearance : system;
        const expected = effective === 'light' ? reference : darkReference;
        const phase = `system ${system}, appearance ${appearance ?? 'omitted'}`;
        for (const id of ['explicit-scope', 'returned-scope', 'repeated-scope', 'omitted-scope', 'auto-scope', 'application-content']) {
          expect(await actionSignature(ordinary(id)), `${phase}: ${id} restores its nearest A presentation after container composition`).toEqual(expected);
          await metrics(page.locator(`#${id} > en-checkbox`).getByRole('checkbox'), { width: references[theme].choice });
        }
        expect(await actionSignature(page.locator('#component-scope').getByRole('button')), `${phase}: a custom host can be its own full boundary`).toEqual(expected);
        expect(await actionSignature(page.locator('#native-component-scope')), `${phase}: a native helper can be its own full boundary`).toEqual(await actionSignature(outer.locator(':scope > button').first()));
        expect(await actionSignature(ordinary('middle-default')), `${phase}: explicit light B remains isolated from A`).toEqual(before);
        const source = alertReference(theme, effective), [background, , , color = source.body] = source.palette[0];
        for (const frame of alertFrames) {
          await metrics(frame, { 'padding-top': source.block, 'padding-inline-start': source.inline, 'border-radius': source.radius, 'font-size': source.font });
          await alertPaint(frame, { 'background-color': background, color });
        }
        observations[phase] = expected;
      }
    }
    const inherited = page.locator('#override-inheritance');
    const sourcePaint = await Promise.all(alertFrames.map(alertSignature));
    await inherited.evaluate(element => {
      (element as HTMLElement).style.setProperty('--en-alert-background', '#102030');
      (element as HTMLElement).style.setProperty('--en-alert-color', '#f1e2d3');
    });
    for (const frame of alertFrames) await alertPaint(frame, { 'background-color': '#102030', color: '#f1e2d3' });
    for (const owner of alertOwners) await owner.evaluate(element => {
      (element as HTMLElement).style.setProperty('--en-alert-background', '#405060');
      (element as HTMLElement).style.setProperty('--en-alert-color', '#e1d2c3');
    });
    for (const frame of alertFrames) await alertPaint(frame, { 'background-color': '#405060', color: '#e1d2c3' });
    const publicPart = await page.addStyleTag({ content: '#override-custom::part(base) { --en-alert-background: #708090; --en-alert-color: #d1c2b3; border-radius: 3px; }' });
    await alertPaint(alertFrames[0], { 'background-color': '#708090', color: '#d1c2b3' });
    await metrics(alertFrames[0], { 'border-radius': 3 });
    await alertPaint(alertFrames[1], { 'background-color': '#405060', color: '#e1d2c3' });
    observations.publicOverridePrecedence = { inherited: '#102030', host: '#405060', part: '#708090', partRadius: 3 };
    await publicPart.evaluate(element => element.parentNode?.removeChild(element));
    for (const frame of alertFrames) await alertPaint(frame, { 'background-color': '#405060', color: '#e1d2c3' });
    for (const owner of alertOwners) await owner.evaluate(element => {
      (element as HTMLElement).style.removeProperty('--en-alert-background');
      (element as HTMLElement).style.removeProperty('--en-alert-color');
    });
    for (const frame of alertFrames) await alertPaint(frame, { 'background-color': '#102030', color: '#f1e2d3' });
    await inherited.evaluate(element => {
      (element as HTMLElement).style.removeProperty('--en-alert-background');
      (element as HTMLElement).style.removeProperty('--en-alert-color');
    });
    expect(await Promise.all(alertFrames.map(alertSignature)), 'Removing Part, host and inherited overrides restores source presentation').toEqual(sourcePaint);
    // These diagnostic sections are transparent composition regions, not
    // widgets. Paint each region's own canvas only after the isolation probes
    // so dark Auto regions and the explicit light child are legible together.
    observations.captureContext = await page.locator('#boundary-fidelity').evaluate(fixture => {
      const directComponent = fixture.querySelector('#component-scope')!;
      (fixture as HTMLElement).style.backgroundColor = getComputedStyle(directComponent).getPropertyValue('--en-color-canvas').trim();
      const regions = [...fixture.querySelectorAll<HTMLElement>('section.en-foundation')].map(region => {
        region.style.backgroundColor = getComputedStyle(region).getPropertyValue('--en-color-canvas').trim();
        return { id: region.id, appearance: region.getAttribute('data-en-appearance') ?? 'omitted', background: getComputedStyle(region).backgroundColor };
      });
      return { background: getComputedStyle(fixture).backgroundColor, regions };
    });
    await evidence(info, `${theme}-boundaries`, page.locator('#boundary-fidelity'), observations);
  });
}

test('all six exports preserve narrow RTL, enlarged text, editing and reduced motion', async ({ page, exportedCSS }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of themes) {
    await open(page, 'mixed-toolbar', theme, 'dark', exportedCSS[theme]);
    await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
    const field = specimen(page).getByRole('textbox', { name: 'Study title', exact: true });
    await field.fill('A longer translated project title');
    const apply = specimen(page).getByRole('button', { name: 'Apply preview settings', exact: true });
    await apply.focus(); await apply.press('Enter');
    await expect(specimen(page).getByRole('status')).toContainText('A longer translated project title');
    const geometry = await apply.evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight, documentOverflow: document.documentElement.scrollWidth - innerWidth }));
    expect(geometry.scroll, `${theme}: enlarged action text remains inside its target`).toBeLessThanOrEqual(geometry.client + 1);
    expect(geometry.documentOverflow, `${theme}: narrow RTL page does not overflow`).toBeLessThanOrEqual(1);
    await hold(page, apply, async () => {
      const motion = await style(apply, ['transform', 'translate', 'scale']);
      expect(motion.transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      expect(['none', '1']).toContain(motion.scale);
      expect(['none', '0px', '0px 0px']).toContain(motion.translate);
    });
    await evidence(info, `${theme}-rtl-enlarged-reduced`, specimen(page), geometry);
    if (theme === 'fluent-inspired' || theme === 'radix-inspired' || theme === 'shadcn-inspired' || theme === 'web-awesome-inspired') {
      await open(page, 'dialog-drawer', theme, 'dark', exportedCSS[theme]);
      await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
      const modal = specimen(page).locator('en-dialog');
      await modal.evaluate(element => {
        element.setAttribute('label', 'A longer translated invitation heading with several wrapping lines');
        element.setAttribute('description', 'Supporting context must remain clear when dialog text grows.');
      });
      await specimen(page).getByRole('button', { name: 'Open dialog', exact: true }).click();
      await expect(modal.getByRole('dialog')).toBeVisible();
      if (theme === 'shadcn-inspired') {
        await metrics(part(modal, 'heading'), { 'font-size': 32, 'line-height': 32 });
        // This specimen is a centered dialog; source corners remain capped at 24px.
        await metrics(part(modal, 'surface'), { padding: 48, 'border-radius': 24 });
      }
      if (theme === 'web-awesome-inspired') {
        await metrics(part(modal, 'heading'), { 'font-size': 41, 'line-height': 49.2, 'font-weight': '600' });
        await metrics(part(modal, 'surface'), { padding: 0, 'border-radius': 24 });
        await metrics(part(modal, 'body'), { padding: 48 });
        expect((await part(modal, 'surface').boundingBox())!.width, 'WA 2.5rem clearance scales with enlarged root text').toBeCloseTo(310, 1);
      }
      const closeBox = (await modal.getByRole('button', { name: 'Close', exact: true }).boundingBox())!;
      const bounds = await modal.evaluate((element, closeBox) => {
        const root = element.shadowRoot!, surface = root.querySelector('[part~="surface"]')!.getBoundingClientRect();
        // Close is a forwarded Part on a generated child; use its public button
        // role above rather than assuming a literal [part=close] DOM attribute.
        const close = { left: closeBox.x, right: closeBox.x + closeBox.width, top: closeBox.y, bottom: closeBox.y + closeBox.height };
        const heading = root.querySelector('[part~="heading"]')!;
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const lines: DOMRect[] = [];
        for (let text = walker.nextNode(); text; text = walker.nextNode()) {
          if (!text.textContent?.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(text); lines.push(...range.getClientRects());
        }
        return { width: surface.width, viewport: innerWidth, lines: lines.length,
          overlapsClose: lines.some(line => line.left < close.right && line.right > close.left && line.top < close.bottom && line.bottom > close.top) };
      }, closeBox);
      expect(bounds.width).toBeLessThanOrEqual(bounds.viewport); expect(bounds.lines).toBeGreaterThan(1); expect(bounds.overlapsClose).toBe(false);
      await evidence(info, `${theme}-rtl-enlarged-dialog`, part(modal, 'surface'), bounds);
      await page.keyboard.press('Escape'); await expect(modal.getByRole('dialog')).not.toBeVisible();
      if (theme === 'shadcn-inspired') {
        // Responsive drawer geometry is opt-in and keeps its core square corners.
        await modal.evaluate(element => element.setAttribute('presentation', 'responsive'));
        await settled(page);
        await specimen(page).getByRole('button', { name: 'Open dialog', exact: true }).click();
        await expect(modal.getByRole('dialog')).toBeVisible();
        const heading = await metrics(part(modal, 'heading'), { 'font-size': 32, 'line-height': 32 });
        const surface = await metrics(part(modal, 'surface'), { padding: 48, 'border-radius': 0 });
        await evidence(info, `${theme}-rtl-enlarged-responsive-dialog`, part(modal, 'surface'), { heading, surface });
        await page.keyboard.press('Escape'); await expect(modal.getByRole('dialog')).not.toBeVisible();
      }
    }
  }
});

test('all six exports preserve forced-color choices and keyboard focus', async ({ page, browserName, exportedCSS }, info) => {
  test.skip(Boolean(emulationLimits.forcedColors[browserName]), emulationLimits.forcedColors[browserName]);
  test.setTimeout(120_000);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  for (const theme of themes) {
    await open(page, 'checkboxes-switches', theme, 'dark', exportedCSS[theme]);
    const choice = specimen(page).getByRole('checkbox', { name: 'Include source files', exact: true });
    await choice.focus(); await expect(choice).toBeFocused();
    const measured = await style(choice, ['outline-style', 'outline-width', 'forced-color-adjust', 'background-color', 'border-top-color']);
    expect(measured['outline-style'], theme).not.toBe('none'); expect(parseFloat(measured['outline-width']), theme).toBeGreaterThanOrEqual(2);
    expect(measured['forced-color-adjust'], `${theme}: system palette remains authoritative`).toBe('auto');
    await choice.press('Space'); await expect(choice).not.toBeChecked();
    await evidence(info, `${theme}-forced-colors`, specimen(page), measured);
    await open(page, 'popover-tooltip', theme, 'dark', exportedCSS[theme]);
    await specimen(page).getByRole('button', { name: 'Hover or focus', exact: true }).focus();
    const tooltip = part(specimen(page).locator('en-tooltip'), 'surface');
    await expect(tooltip).toBeVisible(); await expectNoShadow(tooltip);
    expect((await renderedContrast(tooltip)).ratio, `${theme}: forced-color tooltip text remains readable`).toBeGreaterThanOrEqual(4.5);
    await forcedColorAlerts(page, theme, exportedCSS[theme], info);
  }
});
// The finite shadow.none token may serialize as a transparent zero-sized layer.
// Normalize only that one layer; colors with visible alpha, nonzero geometry,
// additional layers, inset shadows and unrecognized serializations still fail.
function normalizeInvisibleShadow(value: string) {
  if (value.trim() === 'none') return 'none';
  const colors = value.match(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|\btransparent\b/gi);
  if (colors?.length !== 1) return value;
  const color = colors[0];
  const lengths = value.replace(color, '').trim().split(/\s+/);
  const zero = /^[+-]?(?:0+(?:\.0*)?|\.0+)(?:px)?$/i;
  if (lengths.length < 2 || lengths.length > 4 || !lengths.every(length => zero.test(length))) return value;
  const alpha = color.toLowerCase() === 'transparent' ? '0'
    : color.match(/\/\s*([^\s)]+)\s*\)$/)?.[1]
      ?? (/^rgba?\(/i.test(color) ? color.slice(color.indexOf('(') + 1, -1).split(',')[3]?.trim() : undefined);
  return alpha !== undefined && /^[+-]?(?:0+(?:\.0*)?|\.0+)%?$/.test(alpha) ? 'none' : value;
}
async function expectNoShadow(target: Locator) {
  await expect.poll(async () => normalizeInvisibleShadow((await style(target, ['box-shadow']))['box-shadow']), 'No visible box shadow').toBe('none');
}
async function metrics(target: Locator, expected: Record<string, string | number>, pseudo?: string) {
  const measured = await style(target, Object.keys(expected), pseudo);
  for (const [name, value] of Object.entries(expected)) {
    if (typeof value === 'number') expect(parseFloat(measured[name]), name).toBeCloseTo(value, 1);
    else expect(name === 'box-shadow' && value === 'none' ? normalizeInvisibleShadow(measured[name]) : measured[name], name).toBe(value);
  }
  return measured;
}
// Native single-line text entry uses at least the font's normal line box.
// Gecko exposes that used value (20px here) even for WA's literal 16px/19.2px
// source declaration. Compare an independent input with the source declaration,
// rather than relaxing metrics or replacing the source value with a UA number.
// https://bugzilla.mozilla.org/show_bug.cgi?id=1860167#c3
async function webAwesomeInputTypography(target: Locator, font: number, leading: number) {
  const delivery = await target.evaluate((element, source) => {
    const actual = getComputedStyle(element), reference = document.createElement('input');
    reference.type = 'text';
    reference.style.cssText = 'all: initial; position: fixed; visibility: hidden; pointer-events: none;';
    reference.style.fontFamily = actual.fontFamily;
    reference.style.fontWeight = actual.fontWeight;
    reference.style.fontStyle = actual.fontStyle;
    reference.style.fontSize = `${source.font}px`;
    reference.style.lineHeight = `${source.leading}px`;
    document.body.append(reference);
    const value = parseFloat(getComputedStyle(reference).lineHeight);
    reference.parentNode?.removeChild(reference);
    return { usedLeading: value, specifiedRole: actual.getPropertyValue('--en-font-input-line-height').trim() };
  }, { font, leading });
  // controlStyles' font shorthand consumes this public unitless role. Assert
  // its source value separately: a wrong below-normal value (1 rather than
  // WA's 1.2) could otherwise share the same 20px native floor in Firefox.
  const specifiedRole = Number(delivery.specifiedRole);
  expect(specifiedRole, 'Delivered input line-height role retains the literal source ratio').toBeCloseTo(leading / font, 5);
  const measured = await metrics(target, { 'font-size': font, 'line-height': delivery.usedLeading });
  return { ...measured, sourceSpecifiedLeading: leading, deliveredInputLineHeight: specifiedRole, nativeReferenceUsedLeading: delivery.usedLeading };
}
async function settled(page: Page) {
  await page.evaluate(async () => {
    const elements = [...document.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('[data-specimen] *, #specimens *, #boundary-fidelity *, #toggle-fidelity *, #alert-fidelity *')];
    await Promise.all(elements.filter(element => element.localName.startsWith('en-')).map(element => customElements.whenDefined(element.localName)));
    await Promise.all(elements.map(element => element.updateComplete));
    await document.fonts.ready;
  });
}
/** Public consumer order: base styles first, unmodified downloaded theme last.
 * Production examples may load native recipe links from body content. */
async function mountExportedCSS(page: Page, css: string) {
  const stylesheet = await page.addStyleTag({ content: css });
  await stylesheet.evaluate(element => (document.body ?? document.head).append(element));
  expect(await stylesheet.textContent(), 'Mounting preserves every downloaded CSS byte').toBe(css);
  return stylesheet;
}
async function open(page: Page, example: string, theme: Theme, appearance: Appearance, css: string) {
  await page.goto(`/api-examples/${example}.html?progress-report`);
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
  await expect(specimen(page)).toBeVisible(); await settled(page);
  await mountExportedCSS(page, css);
  await page.locator('html').evaluate((element, attrs) => {
    element.setAttribute('data-en-theme', attrs.theme);
    element.setAttribute('data-en-appearance', attrs.appearance);
    element.setAttribute('data-example-mode', attrs.appearance);
  }, { theme, appearance });
  await page.evaluate(() => document.fonts.ready);
}
async function evidence(info: TestInfo, name: string, target: Locator, measurements: unknown) {
  const fontDisclosure = await target.evaluate(element => ({
    computedFamily: getComputedStyle(element).fontFamily,
    faces: [...document.fonts].map(font => ({ family: font.family, status: font.status })),
    limitation: 'FontFaceSet status and CSS family do not prove which installed fallback supplied each glyph.',
  }));
  await info.attach(`${name}-measurements`, { contentType: 'application/json', body: JSON.stringify({ measurements, fontDisclosure }, null, 2) });
  const path = info.outputPath(`${name}.png`); await target.screenshot({ path, animations: 'disabled' });
  await info.attach(name, { contentType: 'image/png', path });
}
const require = createRequire(import.meta.url);
async function nativeStyles(page: Page, info: TestInfo, extraFamilies: string[] = []) {
  const sources = [];
  for (const family of ['foundations', 'controls', 'surfaces', 'selection', 'patterns', ...extraFamilies]) {
    const name = `@en-reve/styles/${family}.css`, css = await readFile(require.resolve(name), 'utf8');
    await page.addStyleTag({ content: css }); sources.push({ name, sha256: createHash('sha256').update(css).digest('hex') });
  }
  await info.attach('native-package-exports', { contentType: 'application/json', body: JSON.stringify(sources, null, 2) });
}
async function hold(page: Page, target: Locator, inspect: () => Promise<void>) {
  await target.hover(); await page.mouse.down();
  try { await inspect(); } finally { await page.mouse.up(); await page.mouse.move(0, 0); }
}

async function renderedContrast(target: Locator) {
  return target.evaluate(element => {
    const rgba = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3 || !value.startsWith('rgb')) throw new Error(`Expected rendered sRGB paint, got ${value}`);
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const over = (fg: number[], bg: number[]) => fg.slice(0, 3).map((value, i) => value * fg[3] + bg[i] * (1 - fg[3]));
    const layers: number[][] = [];
    for (let node: Element | null = element; node;) {
      layers.push(rgba(getComputedStyle(node).backgroundColor));
      node = node.parentElement ?? (node.getRootNode() instanceof ShadowRoot ? (node.getRootNode() as ShadowRoot).host : null);
    }
    let background = [255, 255, 255];
    for (const layer of layers.reverse()) background = over(layer, background);
    const foreground = over(rgba(getComputedStyle(element).color), background);
    const luminance = (rgb: number[]) => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    const a = luminance(foreground), b = luminance(background);
    return { foreground, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
}

type RGBA = readonly [number, number, number, number];
// Independent source paint equations for Astryx's state overlay. These do not
// consume the authored candidate, exported variables or compiled companion.
function over(foreground: RGBA, background: RGBA): RGBA {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  return [0, 1, 2].map(index => (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha).concat(alpha) as unknown as RGBA;
}
function mix(foreground: RGBA, background: RGBA, fraction: number): RGBA {
  const alpha = foreground[3] * fraction + background[3] * (1 - fraction);
  return [0, 1, 2].map(index => (foreground[index] * foreground[3] * fraction + background[index] * background[3] * (1 - fraction)) / alpha).concat(alpha) as unknown as RGBA;
}
function expectPaint(actual: string, expected: RGBA) {
  const channels = actual.match(/[\d.]+/g)!.map(Number);
  const normalized = actual.startsWith('color(srgb') ? channels.map((value, index) => index < 3 ? value * 255 : value) : channels;
  const measured = [...normalized.slice(0, 3), normalized[3] ?? 1];
  expected.forEach((value, index) => expect(measured[index], `Source sRGB channel ${index}`).toBeCloseTo(value, index === 3 ? 2 : 0));
}

async function toggleStates(page: Page, theme: Theme, appearance: Appearance, css: string, info: TestInfo) {
  await page.goto('/component-patterns?progress-report');
  await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
  await mountExportedCSS(page, css);
  await page.evaluate(({ theme, appearance }) => {
    const region = document.createElement('section'); region.id = 'toggle-fidelity'; region.className = 'en-foundation';
    region.dataset.enTheme = theme; region.dataset.enAppearance = appearance;
    // The authored consumer supplies a canvas surface for alpha paint, as a
    // real themed region would. Expected contrast is measured from rendered
    // colors; no expected source value is derived from this variable.
    region.style.cssText = 'background:var(--en-color-canvas);padding:24px';
    region.innerHTML = '<en-toggle-button>Keep preview setting</en-toggle-button>';
    document.body.append(region);
  }, { theme, appearance });
  await settled(page);
  const host = page.locator('#toggle-fidelity en-toggle-button'), button = host.getByRole('button');
  const paints = ['background-color', 'color', 'border-top-color'];
  await page.mouse.move(0, 0); const unselected = await style(button, paints);
  const observations: Record<string, unknown> = { unselected };
  for (const state of ['true', 'mixed'] as const) {
    await host.evaluate((element, value) => { (element as HTMLElement & { pressed: boolean | 'mixed' }).pressed = value === 'mixed' ? value : true; }, state);
    await expect(button).toHaveAttribute('aria-pressed', state); await page.mouse.move(0, 0);
    const rest = await style(button, paints), restingContrast = await renderedContrast(button);
    expect(rest, `${theme}: persistent ${state} retains a visual selection cue`).not.toEqual(unselected);
    expect(restingContrast.ratio, `${theme}: ${state} resting text contrast`).toBeGreaterThanOrEqual(4.5);
    await button.hover(); const hover = await style(button, paints), hoverContrast = await renderedContrast(button);
    await expect(button).toHaveAttribute('aria-pressed', state);
    expect(hoverContrast.ratio, `${theme}: ${state} hover text contrast`).toBeGreaterThanOrEqual(4.5);
    await host.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
    let held: unknown;
    await hold(page, button, async () => {
      const paint = await style(button, paints), contrast = await renderedContrast(button); held = { paint, contrast };
      await expect(button).toHaveAttribute('aria-pressed', state);
      expect(contrast.ratio, `${theme}: ${state} held text contrast`).toBeGreaterThanOrEqual(4.5);
    });
    await expect(button, 'Cancellation preserves the persistent selected/mixed state').toHaveAttribute('aria-pressed', state);
    const disabled: Record<string, unknown> = {};
    for (const mode of ['native', 'aria'] as const) {
      await host.evaluate((element, mode) => {
        if (mode === 'native') (element as HTMLElement & { disabled: boolean }).disabled = true;
        else element.setAttribute('aria-disabled', 'true');
      }, mode);
      await expect(button).toBeDisabled(); await page.mouse.move(0, 0);
      const rest = await style(button, paints.concat('opacity')); disabled[mode] = rest;
      await button.hover(); expect(await style(button, paints.concat('opacity')), `${theme}: ${mode} disabled ${state} hover cannot recolor the control`).toEqual(rest);
      await hold(page, button, async () => {
        expect(await style(button, paints.concat('opacity')), `${theme}: ${mode} disabled ${state} hold cannot recolor the control`).toEqual(rest);
      });
      await expect(button).toHaveAttribute('aria-pressed', state);
      if (mode === 'aria') { await button.focus(); await expect(button).toBeFocused(); }
      await host.evaluate((element, mode) => {
        if (mode === 'native') (element as HTMLElement & { disabled: boolean }).disabled = false;
        else element.removeAttribute('aria-disabled');
      }, mode);
    }
    observations[state] = { rest, restingContrast, hover, hoverContrast, held, disabled };
  }
  await evidence(info, `${theme}-${appearance}-persistent-toggle`, page.locator('#toggle-fidelity'), observations);
}

type AlertStatus = 'info' | 'success' | 'warning' | 'danger';
function alertReference(theme: Theme, appearance: Appearance) {
  const dark = appearance === 'dark';
  // Independent observations of the pinned InlineAlert, MessageBar, Banner,
  // Rhea Alert, Radix soft Callout and WA outlined Callout. These literals do
  // not consume a recipe token or compiler output; unit adaptations are explicit.
  const profiles = {
    'spectrum-inspired': { block: 24, inline: 24, radius: 10, border: 2, font: 14, leading: 21, weight: '400', icon: 20, body: dark ? '#dbdbdb' : '#292929', palette: dark
      ? [['#111111', '#4069fd', '#5681ff'], ['#111111', '#047c4b', '#099d59'], ['#111111', '#b94900', '#e06400'], ['#111111', '#df3422', '#fc432e']]
      : [['#ffffff', '#4b75ff', '#4b75ff'], ['#ffffff', '#0ba45d', '#079355'], ['#ffffff', '#e86a00', '#d45b00'], ['#ffffff', '#f03823', '#f03823']] },
    'fluent-inspired': { block: 7, inline: 12, gap: 8, radius: 4, border: 1, font: 14, leading: 20, weight: '400', icon: 20, body: dark ? '#ffffff' : '#242424', palette: dark
      ? [['#141414', '#666666', '#adadad'], ['#052505', '#107c10', '#54b054'], ['#4a1e04', '#f7630c', '#f98845'], ['#3b0509', '#c50f1f', '#dc626d']]
      : [['#f5f5f5', '#d1d1d1', '#616161'], ['#f1faf1', '#9fd89f', '#0e700e'], ['#fff9f5', '#fdcfb4', '#bc4b09'], ['#fdf3f4', '#eeacb2', '#b10e1c']] },
    'astryx-inspired': { block: 12, inline: 16, gap: 8, radius: 16, border: 0, font: 14, leading: 20, weight: '600', icon: 20, body: dark ? '#dfe2e5' : '#15110c', palette: dark
      ? [['rgba(223,226,229,.14)', 'transparent', '#dfe2e5'], ['#0b991f3f', 'transparent', '#0d8626'], ['#e2a4003f', 'transparent', '#f2c00b'], ['#f5394f3f', 'transparent', '#f5394f']]
      : [['rgba(21,17,12,.08)', 'transparent', '#15110c'], ['#0b991f33', 'transparent', '#0d8626'], ['#e2a40033', 'transparent', '#e9af08'], ['#e3193b33', 'transparent', '#e3193b']] },
    // Rhea uses the documented sRGB conversion of its source OKLCH palette.
    // Its success/warning values intentionally keep the source default palette.
    'shadcn-inspired': { block: 12, inline: 16, gap: 10, radius: 18, border: 1, font: 14, leading: 20, weight: '400', icon: 16, body: dark ? '#fafafa' : '#0a0a0a', palette: dark
      ? [['#171717', 'rgba(255,255,255,.1)', '#fafafa'], ['#171717', 'rgba(255,255,255,.1)', '#fafafa'], ['#171717', 'rgba(255,255,255,.1)', '#fafafa'], ['#171717', 'rgba(255,255,255,.1)', '#ff6467', '#ff6467']]
      : [['#ffffff', '#e5e5e5', '#0a0a0a'], ['#ffffff', '#e5e5e5', '#0a0a0a'], ['#ffffff', '#e5e5e5', '#0a0a0a'], ['#ffffff', '#e5e5e5', '#e7000b', '#e7000b']] },
    // Radix preserves its existing size-2 box/type; only the icon line box is
    // prescribed. The fixture's authored 1em SVG remains 14px, not forced 20px.
    'radix-inspired': { block: 16, inline: 16, gap: 12, radius: 8, border: 0, font: 14, leading: 20, weight: '400', icon: 14, body: dark ? '#9eb1ff' : '#002bb7c5', palette: dark
      ? [['#2f62ff3c', 'transparent', '#9eb1ff', '#9eb1ff'], ['#22ff991e', 'transparent', '#46fea5d4', '#46fea5d4'], ['#fa820022', 'transparent', '#ffca16', '#ffca16'], ['#ff173f2d', 'transparent', '#ff9592', '#ff9592']]
      : [['#0047f112', 'transparent', '#002bb7c5', '#002bb7c5'], ['#00a43319', 'transparent', '#00713fde', '#00713fde'], ['#ffde003d', 'transparent', '#ab6400', '#ab6400'], ['#f3000d14', 'transparent', '#c40006d3', '#c40006d3']] },
    'web-awesome-inspired': { block: 16, inline: 16, gap: 0, radius: 12, border: 1, font: 16, leading: 25.6, weight: '400', icon: 20, body: dark ? '#f1f2f3' : '#1b1d26', palette: dark
      ? [['#001a4e', '#002d77', '#3e96ff'], ['#052310', '#0a3a1d', '#00ac49'], ['#331600', '#532600', '#da7e00'], ['#3e0913', '#631323', '#f3676c']]
      : [['#e8f3ff', '#d1e8ff', '#0053c0'], ['#e3f9e3', '#c2f2c1', '#036730'], ['#fef3cd', '#ffe495', '#8c4602'], ['#fff0ef', '#ffdedc', '#b30532']] },
  };
  return profiles[theme];
}

const alertSignature = (target: Locator) => style(target, ['font-size', 'line-height', 'font-weight', 'padding-top', 'padding-inline-start', 'gap', 'border-radius', 'border-top-width', 'background-color', 'color', 'border-top-color', 'box-shadow']);
function alertEntries(page: Page) {
  const custom = page.locator('#source-custom-alert'), native = page.locator('#source-native-alert');
  return [
    { name: 'custom', owner: custom, frame: part(custom, 'base'), icon: part(custom, 'icon'), content: part(custom, 'content') },
    { name: 'native', owner: native, frame: native, icon: native.locator(':scope > .en-alert__icon'), content: native.locator(':scope > .en-alert__content') },
  ];
}
async function alertPaint(target: Locator, expected: Record<string, string>) {
  // Browser conversion compares independent source alpha colors. A temporary
  // color probe resolves system colors in the tested element's color scheme.
  const measured = await target.evaluate((element, expected) => {
    const computed = getComputedStyle(element), canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!, probe = document.createElement('span');
    probe.style.cssText = `position:fixed;visibility:hidden;forced-color-adjust:none;color-scheme:${computed.colorScheme}`;
    document.body.append(probe);
    const rgba = (color: string) => { probe.style.color = color; context.clearRect(0, 0, 1, 1); context.fillStyle = getComputedStyle(probe).color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
    try { return Object.entries(expected).map(([property, source]) => ({ property, actual: computed.getPropertyValue(property), source, rendered: rgba(computed.getPropertyValue(property)), reference: rgba(source) })); }
    finally { probe.parentNode?.removeChild(probe); }
  }, expected);
  for (const paint of measured) paint.reference.forEach((channel, index) => expect(Math.abs(paint.rendered[index] - channel), `${paint.property}: source ${paint.source}, rendered ${paint.actual}, channel ${index}`).toBeLessThanOrEqual(1));
  return measured;
}

async function alertFixture(page: Page, theme: Theme, appearance: Appearance, css: string, info: TestInfo) {
  await page.goto('/component-patterns?progress-report');
  await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
  await nativeStyles(page, info, ['feedback']);
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'alert-default', mode: appearance }), { selector: '[data-en-theme="alert-default"]', colorScheme: true }) });
  await page.evaluate(({ theme, appearance }) => {
    const region = document.createElement('section'); region.id = 'alert-fidelity'; region.className = 'en-foundation';
    region.dataset.enTheme = theme; region.dataset.enAppearance = appearance; region.dataset.size = 'medium';
    region.style.cssText = 'inline-size:min(360px,100%);background:var(--en-color-canvas);display:grid;gap:12px';
    const icon = '<svg aria-hidden="true" viewBox="0 0 24 24" style="display:block;width:1em;height:1em"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>';
    const markup = (prefix: string) => `<en-alert id="${prefix}-custom-alert"><span slot="icon">${icon}</span>Source message.</en-alert><div id="${prefix}-native-alert" class="en-alert"><span class="en-alert__icon" aria-hidden="true">${icon}</span><div class="en-alert__content">Source message.</div></div>`;
    region.innerHTML = markup('source');
    // A native alert is itself a complete A boundary, not merely a descendant.
    const native = region.querySelector<HTMLElement>('#source-native-alert')!;
    native.classList.add('en-foundation'); native.dataset.enTheme = theme; native.dataset.enAppearance = appearance;
    const middle = document.createElement('section'); middle.id = 'alert-default'; middle.className = 'en-foundation';
    middle.dataset.enTheme = 'alert-default'; middle.dataset.enAppearance = appearance; middle.innerHTML = markup('isolated');
    const returned = document.createElement('section'); returned.className = 'en-foundation'; returned.dataset.enTheme = theme; returned.dataset.enAppearance = appearance; returned.innerHTML = markup('returned');
    middle.append(returned); region.append(middle); document.body.append(region);
  }, { theme, appearance });
  await settled(page);
  const isolated = [part(page.locator('#isolated-custom-alert'), 'base'), page.locator('#isolated-native-alert')];
  const before = await Promise.all(isolated.map(alertSignature));
  await mountExportedCSS(page, css);
  expect(await Promise.all(isolated.map(alertSignature)), 'A full default boundary keeps its alert presentation inside source A').toEqual(before);
  const entries = alertEntries(page);
  expect(await alertSignature(part(page.locator('#returned-custom-alert'), 'base')), 'A → default → A restores the custom alert').toEqual(await alertSignature(entries[0].frame));
  expect(await alertSignature(page.locator('#returned-native-alert')), 'A → default → A restores the native alert, including a native root-owned boundary').toEqual(await alertSignature(entries[1].frame));
  return entries;
}

async function sourceAlerts(page: Page, theme: Theme, appearance: Appearance, css: string, info: TestInfo) {
  const entries = await alertFixture(page, theme, appearance, css, info), reference = alertReference(theme, appearance);
  const observations: Record<string, unknown> = { reference, limits: 'Authored glyph artwork and slot content remain consumer-owned. Fluent rem type/icon growth and local WA size scales are documented adaptations; no source variants or alert APIs are added.' };
  for (const entry of entries) {
    observations[entry.name] = await metrics(entry.frame, { 'padding-top': reference.block, 'padding-bottom': reference.block, 'padding-inline-start': reference.inline, 'padding-inline-end': reference.inline, 'border-radius': reference.radius, 'border-top-width': reference.border, 'font-size': reference.font, 'line-height': reference.leading, 'font-weight': reference.weight, ...('gap' in reference ? { gap: reference.gap } : {}) });
    await metrics(entry.icon, { 'font-size': reference.icon });
    if (theme === 'fluent-inspired') await metrics(entry.frame, { 'min-height': 36, height: 36 });
    if (theme === 'shadcn-inspired') await metrics(entry.icon, { 'margin-top': 2, width: 16, height: 16 });
    if (theme === 'radix-inspired') await metrics(entry.icon, { height: 20 });
    if (theme === 'web-awesome-inspired') await metrics(entry.icon, { 'margin-inline-end': 20 });
  }
  if (theme === 'web-awesome-inspired') {
    // WA source sizes are 14/16/20; local UI text preserves its 16px base
    // for small (16/16/18). Source em inset/icon spacing follows actual size.
    await entries[0].owner.evaluate(element => element.setAttribute('size', 'inherit'));
    for (const [size, font] of [['small', 16], ['medium', 16], ['large', 18]] as const) {
      await page.locator('#alert-fidelity').evaluate((element, size) => element.setAttribute('data-size', size), size);
      await entries[1].owner.evaluate((element, size) => element.setAttribute('data-size', size), size);
      for (const entry of entries) {
        await metrics(entry.frame, { 'font-size': font, 'line-height': font * 1.6, 'padding-top': font, 'padding-inline-start': font });
        await metrics(entry.icon, { 'font-size': font * 1.25, 'margin-inline-end': font * 1.25 });
      }
    }
    await page.locator('#alert-fidelity').evaluate(element => element.setAttribute('data-size', 'medium'));
    await entries[1].owner.evaluate(element => element.setAttribute('data-size', 'medium'));
  }
  for (const status of [undefined, 'info', 'success', 'warning', 'danger'] as const) {
    for (const entry of entries) await entry.owner.evaluate((element, { name, status }) => {
      const attribute = name === 'custom' ? 'variant' : 'data-variant';
      if (status) element.setAttribute(attribute, status); else element.removeAttribute(attribute);
    }, { name: entry.name, status });
    await settled(page);
    const index = (['info', 'success', 'warning', 'danger'] as AlertStatus[]).indexOf(status ?? 'info');
    const [background, border, icon, color = reference.body] = reference.palette[index];
    const paints: unknown[] = [];
    for (const entry of entries) {
      paints.push(await alertPaint(entry.frame, { 'background-color': background, color, ...(reference.border ? { 'border-top-color': border } : {}) }));
      paints.push(await alertPaint(entry.icon, { color: icon }));
    }
    observations[status ?? 'omitted-info'] = paints;
  }
  for (const entry of entries) await entry.owner.evaluate((element, name) => element.setAttribute(name === 'custom' ? 'variant' : 'data-variant', 'info'), entry.name);
  await settled(page);
  for (const entry of entries) {
    const before = await alertSignature(entry.frame);
    await entry.owner.evaluate(element => {
      const style = (element as HTMLElement).style;
      style.setProperty('--en-alert-background', '#123456'); style.setProperty('--en-alert-color', '#abcdef'); style.setProperty('--en-alert-border-color', '#654321');
    });
    await alertPaint(entry.frame, { 'background-color': '#123456', color: '#abcdef', ...(reference.border ? { 'border-top-color': '#654321' } : {}) });
    if (!reference.border) expect((await style(entry.frame, ['box-shadow']))['box-shadow'], 'A borderless source plate still honors the public boundary-color hook').toContain('rgb(101, 67, 33)');
    await entry.owner.evaluate(element => { for (const name of ['background', 'color', 'border-color']) (element as HTMLElement).style.removeProperty(`--en-alert-${name}`); });
    expect(await alertSignature(entry.frame), 'Removing public paint overrides restores the source default').toEqual(before);
  }
  const custom = entries[0].owner;
  await expect(entries[0].content).toHaveAttribute('role', 'status'); await expect(entries[0].content).toHaveAttribute('aria-atomic', 'true');
  await custom.evaluate(element => element.setAttribute('announcement', 'none')); await settled(page);
  await expect(entries[0].content).not.toHaveAttribute('role'); await expect(entries[0].content).not.toHaveAttribute('aria-atomic');
  await expect(entries[1].content).not.toHaveAttribute('role');
  await custom.evaluate(element => element.setAttribute('announcement', 'polite')); await settled(page);
  await expect(entries[0].content).toHaveAttribute('role', 'status');
  for (const entry of entries) {
    await entry.owner.evaluate((element, name) => {
      if (name === 'custom') { const icon = element.querySelector('[slot="icon"]')!; icon.setAttribute('slot', 'parked-icon'); }
      else (element.querySelector('.en-alert__icon') as HTMLElement).hidden = true;
    }, entry.name);
    await expect(entry.icon).toBeHidden();
    const bounds = await entry.frame.evaluate(element => {
      const root = element.getRootNode(), content = root instanceof ShadowRoot ? root.querySelector('[part~="content"]')! : element.querySelector(':scope > .en-alert__content')!;
      const outer = element.getBoundingClientRect(), inner = content.getBoundingClientRect(), css = getComputedStyle(element);
      return { actual: inner.width, available: outer.width - parseFloat(css.borderLeftWidth) - parseFloat(css.borderRightWidth) - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) };
    });
    expect(bounds.actual, 'Omitting the optional icon leaves no phantom column or gap').toBeCloseTo(bounds.available, 0);
    await entry.owner.evaluate((element, name) => {
      if (name === 'custom') element.querySelector('[slot="parked-icon"]')!.setAttribute('slot', 'icon');
      else (element.querySelector('.en-alert__icon') as HTMLElement).hidden = false;
    }, entry.name);
    await expect(entry.icon).toBeVisible();
  }
  await custom.evaluate(element => {
    element.setAttribute('dismissible', '');
    const events: unknown[] = []; (element as HTMLElement & { alertEvents: unknown[] }).alertEvents = events;
    element.addEventListener('en-change', event => {
      const change = event as CustomEvent; events.push({ detail: change.detail, during: (element as HTMLElement & { open: boolean }).open });
      if (events.length === 1) event.preventDefault();
    });
  });
  const close = part(custom, 'close'); await close.focus(); await close.press('Enter');
  await expect(custom).toHaveJSProperty('open', true); await expect(entries[0].frame).toBeVisible(); await expect(close).toBeFocused();
  await close.press('Enter'); await expect(custom).toHaveJSProperty('open', false); await expect(entries[0].frame).toBeHidden();
  expect(await custom.evaluate(element => (element as HTMLElement & { alertEvents: unknown[] }).alertEvents)).toEqual([
    { detail: { previous: true, proposed: false, reason: 'dismiss' }, during: false },
    { detail: { previous: true, proposed: false, reason: 'dismiss' }, during: false },
  ]);
  await custom.evaluate(element => { (element as HTMLElement & { open: boolean }).open = true; element.removeAttribute('dismissible'); });
  await expect(entries[0].frame).toBeVisible();
  expect(await custom.evaluate(element => (element as HTMLElement & { alertEvents: unknown[] }).alertEvents.length), 'Authoritative open writes are silent').toBe(2);
  await page.locator('#alert-fidelity').evaluate(element => element.setAttribute('dir', 'rtl'));
  for (const entry of entries) {
    const icon = (await entry.icon.boundingBox())!, content = (await entry.content.boundingBox())!;
    if (theme === 'spectrum-inspired') expect(icon.x + icon.width, 'Spectrum keeps its status icon at logical end in RTL').toBeLessThanOrEqual(content.x + 1);
    else expect(content.x + content.width, 'Leading status icons follow RTL direction').toBeLessThanOrEqual(icon.x + 1);
  }
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  for (const entry of entries) {
    const geometry = {
      'spectrum-inspired': { 'padding-top': 24, 'padding-inline-start': 24, 'border-radius': 20 },
      'fluent-inspired': { 'padding-top': 7, 'padding-inline-start': 12, 'border-radius': 4, gap: 8 },
      'astryx-inspired': { 'padding-top': 12, 'padding-inline-start': 16, 'border-radius': 16, gap: 8 },
      'shadcn-inspired': { 'padding-top': 24, 'padding-inline-start': 32, 'border-radius': 36, gap: 20 },
      'radix-inspired': { 'padding-top': 32, 'padding-inline-start': 32, 'border-radius': 16, gap: 24 },
      'web-awesome-inspired': { 'padding-top': 32, 'padding-inline-start': 32, 'border-radius': 24, gap: 0 },
    }[theme] as Record<string, number>;
    await metrics(entry.frame, { ...geometry, 'border-top-width': theme === 'web-awesome-inspired' ? 2 : reference.border, 'font-size': reference.font * 2, 'line-height': reference.leading * 2 });
    await entry.owner.evaluate((element, name) => {
      const copy = 'A longer translated status message with several wrapping lines and one unbrokenidentifierthatmustwrapwithinthemessage.';
      if (name === 'custom') { for (const child of element.childNodes) if (child.nodeType === Node.TEXT_NODE) child.textContent = copy; }
      else element.querySelector('.en-alert__content')!.textContent = copy;
    }, entry.name);
    const growth = await entry.content.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, height: element.clientHeight, scrollHeight: element.scrollHeight, line: parseFloat(getComputedStyle(element).lineHeight) }));
    expect(growth.height, 'Enlarged status content wraps onto multiple lines').toBeGreaterThan(growth.line * 2);
    expect(growth.scrollWidth, 'Long translated words stay within the alert').toBeLessThanOrEqual(growth.width + 1);
    expect(growth.scrollHeight, 'Content height is not clipped').toBeLessThanOrEqual(growth.height + 1);
    observations[`${entry.name}-enlarged-rtl`] = growth;
  }
  await evidence(info, `${theme}-${appearance}-source-alerts`, page.locator('#alert-fidelity'), observations);
}

async function forcedColorAlerts(page: Page, theme: Theme, css: string, info: TestInfo) {
  const entries = await alertFixture(page, theme, 'dark', css, info);
  for (const entry of entries) {
    await entry.owner.evaluate(element => { const style = (element as HTMLElement).style; style.setProperty('--en-alert-background', '#123456'); style.setProperty('--en-alert-color', '#abcdef'); style.setProperty('--en-alert-border-color', '#654321'); });
    const measured = await style(entry.frame, ['border-top-style', 'border-top-width', 'box-shadow', 'forced-color-adjust']);
    expect(measured['border-top-style'], 'Forced colors retain a solid message contour').toBe('solid');
    expect(parseFloat(measured['border-top-width']), 'Borderless source plates recover the core contour in forced colors').toBeGreaterThanOrEqual(1);
    expect(measured['forced-color-adjust']).toBe('auto'); expect(normalizeInvisibleShadow(measured['box-shadow'])).toBe('none');
    await alertPaint(entry.frame, { 'background-color': 'Canvas', color: 'CanvasText', 'border-top-color': 'CanvasText' });
    await alertPaint(entry.icon, { color: 'CanvasText' });
    expect((await renderedContrast(entry.frame)).ratio, 'Forced-color alert content remains readable').toBeGreaterThanOrEqual(4.5);
  }
  await evidence(info, `${theme}-forced-color-alerts`, page.locator('#alert-fidelity'), { appearance: 'forced-colors', preservedCore: 'System paint and a solid contour remain authoritative over source palettes and public author paint overrides.' });
}

async function sourceResponsiveDialog(
  page: Page, modal: Locator, theme: 'fluent-inspired' | 'radix-inspired', appearance: Appearance, info: TestInfo,
) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Responsive source proof requires the owning config’s explicit viewport');
  const root = page.locator('html'), surface = part(modal, 'surface');
  const savedRootStyle = await root.getAttribute('style');
  const saved = await modal.evaluate(element => {
    const dialog = element as HTMLElement & { presentation: string; responsiveQuery: string };
    return { style: element.getAttribute('style'), presentationAttribute: element.getAttribute('presentation'),
      queryAttribute: element.getAttribute('responsive-query'), marker: element.getAttribute('data-responsive-overlay-proof'),
      presentation: dialog.presentation, query: dialog.responsiveQuery };
  });
  const nativeCSS = await readFile(require.resolve('@en-reve/styles/overlays.css'), 'utf8');
  const nativeSheet = await page.addStyleTag({ content: nativeCSS });
  const childCSS = emitThemeCSS(resolveTheme({ name: 'overlay-core-isolation', mode: appearance }), {
    selector: '#responsive-core-isolation', colorScheme: true,
  });
  const childSheet = await page.addStyleTag({ content: childCSS });
  const authorSheet = await page.addStyleTag({ content: '/* Public source hook overrides are inserted below. */' });
  const observations: Record<string, unknown> = {};
  const expectWidth = async (target: Locator, width: number, label: string) => {
    await expect.poll(async () => (await target.boundingBox())?.width ?? -1, label).toBeCloseTo(width, 1);
    return target.boundingBox();
  };
  const setQuery = async (query: string) => modal.evaluate(async (element, query) => {
    const dialog = element as HTMLElement & { updateComplete: Promise<boolean> };
    element.setAttribute('responsive-query', query);
    while (!(await dialog.updateComplete)) { /* Settle the public responsive update. */ }
  }, query);
  try {
    await page.setViewportSize({ width: 1000, height: 900 });
    await modal.evaluate(async element => {
      element.setAttribute('data-responsive-overlay-proof', '');
      element.setAttribute('presentation', 'responsive');
      const probe = document.createElement('p'); probe.id = 'responsive-source-measure';
      probe.textContent = 'Source maximum width measurement '.repeat(40); probe.style.whiteSpace = 'nowrap';
      element.append(probe);
      const dialog = element as HTMLElement & { updateComplete: Promise<boolean> };
      while (!(await dialog.updateComplete)) { /* Responsive mode may request a second update. */ }
    });
    observations.defaultWide = await expectWidth(surface, 600, 'Default responsive wide mode retains the source 600px maximum');
    await page.setViewportSize({ width: 390, height: 844 });
    observations.defaultCompact = await expectWidth(surface, 390, 'Default responsive compact mode fills the viewport');
    await expect(surface).toHaveCSS('border-radius', '0px');
    // The user query, rather than a companion's fixed breakpoint, owns mode.
    await page.setViewportSize({ width: 1000, height: 900 });
    await setQuery('(width < 2000px)');
    observations.forcedWideViewportCompact = await expectWidth(surface, 1000, 'An authored query can select compact mode on a wide viewport');
    await expect(surface).toHaveCSS('border-radius', '0px');
    await setQuery('(width < 1px)');
    await expectWidth(surface, 600, 'An authored false query restores the source maximum');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => {
      const box = await surface.boundingBox();
      return Boolean(box && box.width < 390 && box.x >= 0 && box.x + box.width <= 390);
    }, 'An authored false query retains centered viewport clearance on narrow screens').toBe(true);
    observations.forcedNarrowViewportWide = await surface.boundingBox();
    await page.setViewportSize({ width: 1000, height: 900 });
    await root.evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '641px'));
    observations.inheritedMaximum = await expectWidth(surface, 641, 'Inherited public maximum replaces the source fallback');
    await modal.evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '523px'));
    observations.hostMaximum = await expectWidth(surface, 523, 'Host public maximum replaces the inherited maximum');
    await setQuery('(width < 2000px)');
    await expectWidth(surface, 1000, 'Compact mode remains viewport-wide with a public maximum');
    await setQuery('(width < 1px)');
    await expectWidth(surface, 523, 'Returning to wide mode restores the host maximum');
    await modal.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'));
    await expectWidth(surface, 641, 'Removing the host override restores the inherited maximum');
    await root.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'));
    await expectWidth(surface, 600, 'Removing public maxima restores the source maximum');

    await overlayPaddingShorthands(page, [{ owner: modal, targets: [part(modal, 'header'), part(modal, 'body'), part(modal, 'footer')], zeroInsets: [surface] }]);
    const textParts = [surface, part(modal, 'body'), part(modal, 'heading')];
    const textProperties = ['font-size', 'line-height', 'font-weight'];
    const sourceText = await Promise.all(textParts.map(target => style(target, textProperties)));
    await authorSheet.evaluate(element => { element.textContent = `
      en-dialog[data-responsive-overlay-proof]::part(surface) { font-size: 19px; line-height: 1.7; font-weight: 500; }
      en-dialog[data-responsive-overlay-proof]::part(body) { font-size: 21px; line-height: 1.5; font-weight: 600; }
      en-dialog[data-responsive-overlay-proof]::part(heading) { font-size: 27px; line-height: 1.4; font-weight: 800; }
    `; });
    await metrics(surface, { 'font-size': 19, 'line-height': 32.3, 'font-weight': '500' });
    await metrics(textParts[1], { 'font-size': 21, 'line-height': 31.5, 'font-weight': '600' });
    await metrics(textParts[2], { 'font-size': 27, 'line-height': 37.8, 'font-weight': '800' });
    await authorSheet.evaluate(element => { element.textContent = ''; });
    expect(await Promise.all(textParts.map(target => style(target, textProperties))), 'Removing direct public Part typography restores source text').toEqual(sourceText);

    // Native drawer helpers keep their own core width, including independently
    // authored token input. No source dialog maximum may leak onto these helpers.
    await page.evaluate(() => {
      const drawer = document.createElement('dialog'); drawer.id = 'responsive-native-drawer'; drawer.className = 'en-drawer'; drawer.open = true;
      drawer.textContent = 'Native drawer geometry'; document.body.append(drawer);
    });
    const nativeDrawer = page.locator('#responsive-native-drawer');
    await expectWidth(nativeDrawer, 448, 'Native drawer retains the core 28rem maximum');
    await nativeDrawer.evaluate(element => (element as HTMLElement).style.setProperty('--en-layout-form-max', '347px'));
    await expectWidth(nativeDrawer, 347, 'Native drawer consumes its independently authored core maximum');
    await nativeDrawer.evaluate(element => element.setAttribute('data-placement', 'bottom'));
    await expectWidth(nativeDrawer, 1000, 'Native bottom drawer remains viewport-wide');
    await nativeDrawer.evaluate(element => element.removeAttribute('data-placement'));
    observations.nativeDrawer = await expectWidth(nativeDrawer, 347, 'Native side drawer restores its own maximum');

    // Compare the same full-theme child outside and inside the outer dialog's
    // authored default slot. The composed inheritance path crosses its surface;
    // the child must retain core geometry without any source dialog profile.
    await page.evaluate(appearance => {
      const region = document.createElement('section'); region.id = 'responsive-core-isolation'; region.className = 'en-foundation';
      region.dataset.enTheme = 'overlay-core-isolation'; region.dataset.enAppearance = appearance;
      region.innerHTML = '<en-dialog id="responsive-core-child" label="Independent child dialog"><p>Independent child content.</p></en-dialog>';
      document.body.append(region);
    }, appearance);
    const region = page.locator('#responsive-core-isolation'), child = page.locator('#responsive-core-child');
    await authorSheet.evaluate(element => { element.textContent = '#responsive-core-child::part(surface) { inline-size: 100vw; }'; });
    const childSignature = async (presentation: 'dialog' | 'responsive') => {
      await child.evaluate(async (element, presentation) => {
        const dialog = element as HTMLElement & { show(): void; updateComplete: Promise<boolean> };
        element.setAttribute('presentation', presentation); element.setAttribute('responsive-query', '(width < 1px)');
        dialog.show(); while (!(await dialog.updateComplete)) { /* Settle the public authored state. */ }
      }, presentation);
      const plate = part(child, 'surface'); await expect(plate).toBeVisible();
      const box = await expectWidth(plate, 448, `Independent ${presentation} child keeps the core 28rem maximum`);
      const signature = await style(plate, ['max-inline-size', 'padding', 'border-radius']);
      await child.evaluate(element => (element as HTMLElement & { hide(): void }).hide());
      await expect(plate).not.toBeVisible(); return { width: box!.width, ...signature };
    };
    const outside = { dialog: await childSignature('dialog'), responsive: await childSignature('responsive') };
    const regionHandle = await region.elementHandle();
    await modal.evaluate((element, region) => { if (region) element.append(region); }, regionHandle);
    await regionHandle?.dispose();
    const nested = { dialog: await childSignature('dialog'), responsive: await childSignature('responsive') };
    expect(nested, 'A child full theme cannot inherit the outer dialog source maximum').toEqual(outside);
    observations.childBoundary = { outside, nested };
    await evidence(info, `${theme}-${appearance}-responsive-source-maximum`, surface, observations);
  } finally {
    // Restore existing authored nodes, attributes/properties, CSS, and viewport.
    await page.locator('#responsive-core-isolation, #responsive-native-drawer').evaluateAll(elements => elements.forEach(element => element.remove()));
    for (const sheet of [authorSheet, childSheet, nativeSheet]) { await sheet.evaluate(element => (element as HTMLStyleElement).remove()); await sheet.dispose(); }
    await root.evaluate((element, value) => { if (value === null) element.removeAttribute('style'); else element.setAttribute('style', value); }, savedRootStyle);
    await modal.evaluate(async (element, saved) => {
      element.querySelector('#responsive-source-measure')?.remove();
      for (const [name, value] of [['style', saved.style], ['presentation', saved.presentationAttribute], ['responsive-query', saved.queryAttribute], ['data-responsive-overlay-proof', saved.marker]] as const) {
        if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
      }
      const dialog = element as HTMLElement & { presentation: string; responsiveQuery: string; updateComplete: Promise<boolean> };
      dialog.presentation = saved.presentation; dialog.responsiveQuery = saved.query;
      while (!(await dialog.updateComplete)) { /* Restore the prior public presentation. */ }
    }, saved);
    await page.setViewportSize(viewport);
  }
  return observations;
}


// --en-overlay-padding is a complete CSS padding shorthand. Source logical
// section insets and close compensation apply only when that hook is absent.
async function overlayPaddingShorthands(page: Page, deliveries: { owner: Locator; targets: Locator[]; zeroInsets?: Locator[] }[]) {
  const root = page.locator('html');
  const savedRoot = await root.evaluate(element => ({ value: element.style.getPropertyValue('--en-overlay-padding'), priority: element.style.getPropertyPriority('--en-overlay-padding') }));
  const savedOwners = await Promise.all(deliveries.map(({ owner }) => owner.evaluate(element => {
    const value = (element as HTMLElement).style;
    return { value: value.getPropertyValue('--en-overlay-padding'), priority: value.getPropertyPriority('--en-overlay-padding'), direction: element.getAttribute('dir') };
  })));
  const forms = [
    ['17px', [17, 17, 17, 17]], ['13px 21px', [13, 21, 13, 21]],
    ['11px 19px 23px', [11, 19, 23, 19]], ['13px 17px 23px 29px', [13, 17, 23, 29]],
  ] as const;
  const inspect = async (sides: readonly [number, number, number, number]) => {
    for (const { targets, zeroInsets = [] } of deliveries) {
      for (const target of targets) await metrics(target, { 'padding-top': sides[0], 'padding-right': sides[1], 'padding-bottom': sides[2], 'padding-left': sides[3] });
      for (const outer of zeroInsets) await metrics(outer, { padding: 0 });
    }
  };
  try {
    for (const direction of ['ltr', 'rtl']) {
      for (const { owner } of deliveries) await owner.evaluate((element, direction) => {
        element.setAttribute('dir', direction); (element as HTMLElement).style.removeProperty('--en-overlay-padding');
      }, direction);
      for (const [value, sides] of forms) {
        await root.evaluate((element, value) => element.style.setProperty('--en-overlay-padding', value), value);
        await inspect(sides);
      }
      await root.evaluate(element => element.style.setProperty('--en-overlay-padding', '31px'));
      for (const [value, sides] of forms) {
        for (const { owner } of deliveries) await owner.evaluate((element, value) => (element as HTMLElement).style.setProperty('--en-overlay-padding', value), value);
        await inspect(sides);
      }
    }
  } finally {
    for (let index = 0; index < deliveries.length; index++) await deliveries[index].owner.evaluate((element, saved) => {
      const value = (element as HTMLElement).style;
      if (saved.value) value.setProperty('--en-overlay-padding', saved.value, saved.priority); else value.removeProperty('--en-overlay-padding');
      if (saved.direction === null) element.removeAttribute('dir'); else element.setAttribute('dir', saved.direction);
    }, savedOwners[index]);
    await root.evaluate((element, saved) => {
      if (saved.value) element.style.setProperty('--en-overlay-padding', saved.value, saved.priority); else element.style.removeProperty('--en-overlay-padding');
    }, savedRoot);
  }
}

async function tooltipBackgroundShorthand(page: Page, deliveries: { owner: Locator; surface: Locator }[]) {
  const root = page.locator('html'), names = ['background-color', 'background-image'];
  const savedRoot = await root.evaluate(element => ({ value: element.style.getPropertyValue('--en-overlay-background'), priority: element.style.getPropertyPriority('--en-overlay-background') }));
  const savedOwners = await Promise.all(deliveries.map(({ owner }) => owner.evaluate(element => {
    const value = (element as HTMLElement).style;
    return { value: value.getPropertyValue('--en-overlay-background'), priority: value.getPropertyPriority('--en-overlay-background') };
  })));
  const before = await Promise.all(deliveries.map(({ surface }) => style(surface, names)));
  const background = 'linear-gradient(90deg, rgb(10, 20, 30), rgb(40, 50, 60)) rgb(70, 80, 90)';
  const expected = await page.evaluate(background => {
    const reference = document.createElement('div'); reference.style.background = background;
    document.body.append(reference); const value = getComputedStyle(reference);
    const result = { 'background-color': value.backgroundColor, 'background-image': value.backgroundImage }; reference.remove(); return result;
  }, background);
  expect(expected['background-image']).toContain('linear-gradient(');
  expect(expected['background-color']).toBe('rgb(70, 80, 90)');
  try {
    for (const { owner } of deliveries) await owner.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-background'));
    await root.evaluate((element, background) => element.style.setProperty('--en-overlay-background', background), background);
    for (const { surface } of deliveries) expect(await style(surface, names), 'Inherited overlay background retains its color and image layers').toEqual(expected);
    await root.evaluate(element => element.style.setProperty('--en-overlay-background', '#112233'));
    for (const { owner, surface } of deliveries) {
      await owner.evaluate((element, background) => (element as HTMLElement).style.setProperty('--en-overlay-background', background), background);
      expect(await style(surface, names), 'Local overlay background retains its complete shorthand').toEqual(expected);
    }
  } finally {
    for (let index = 0; index < deliveries.length; index++) await deliveries[index].owner.evaluate((element, saved) => {
      const value = (element as HTMLElement).style;
      if (saved.value) value.setProperty('--en-overlay-background', saved.value, saved.priority); else value.removeProperty('--en-overlay-background');
    }, savedOwners[index]);
    await root.evaluate((element, saved) => {
      if (saved.value) element.style.setProperty('--en-overlay-background', saved.value, saved.priority); else element.style.removeProperty('--en-overlay-background');
    }, savedRoot);
  }
  expect(await Promise.all(deliveries.map(({ surface }) => style(surface, names))), 'Removing shorthand overrides restores source paint').toEqual(before);
}

// Pinned WA 3.13 Default source: dialog.styles.ts and tooltip.styles.ts.
// Literal observations are independent of our companion roles and recipe replay.
async function webAwesomeDialogGeometry(page: Page, owner: Locator, surface: Locator, header: Locator, heading: Locator, body: Locator, footer: Locator) {
  const observations = {
    surface: await metrics(surface, { padding: 0, gap: 0, 'border-top-width': 0, 'border-radius': 12 }),
    header: await metrics(header, { 'padding-inline-start': 24, 'padding-inline-end': 12, 'padding-top': 12, 'padding-bottom': 0, gap: 24 }),
    heading: await metrics(heading, { 'font-size': 20, 'line-height': 24, 'font-weight': '600' }),
    body: await metrics(body, { padding: 24, margin: 0 }),
    footer: await metrics(footer, { 'padding-top': 0, 'padding-inline-start': 24, 'padding-inline-end': 24, 'padding-bottom': 24, gap: 8 }),
  };
  const viewport = await page.evaluate(() => innerWidth);
  expect((await surface.boundingBox())!.width, 'WA default width is 31rem with 2.5rem viewport clearance').toBeCloseTo(Math.min(496, viewport - 40), 1);
  await page.locator('html').evaluate(element => {
    element.style.setProperty('--en-overlay-radius', '17px'); element.style.setProperty('--en-overlay-max-inline-size', '400px'); element.style.setProperty('--en-overlay-padding', '17px');
  });
  await metrics(surface, { 'border-radius': 17 });
  await metrics(header, { padding: 17 });
  for (const section of [body, footer]) await metrics(section, { padding: 17 });
  expect((await surface.boundingBox())!.width, 'An inherited author maximum replaces the source width').toBeCloseTo(Math.min(400, viewport - 40), 1);
  await page.locator('html').evaluate(element => {
    element.style.removeProperty('--en-overlay-radius'); element.style.removeProperty('--en-overlay-max-inline-size'); element.style.removeProperty('--en-overlay-padding');
  });
  // Authored scalar padding replaces the whole shorthand. Source header
  // compensation applies only when the public hook is absent.
  await owner.evaluate(element => {
    const value = (element as HTMLElement).style;
    value.setProperty('--en-overlay-padding', '19px'); value.setProperty('--en-overlay-radius', '23px');
    value.setProperty('--en-overlay-max-inline-size', '430px');
  });
  await metrics(surface, { padding: 0, 'border-radius': 23 });
  await metrics(header, { padding: 19 });
  for (const section of [body, footer]) await metrics(section, { padding: 19 });
  expect((await surface.boundingBox())!.width).toBeCloseTo(Math.min(430, viewport - 40), 1);
  await owner.evaluate(element => {
    for (const property of ['--en-overlay-padding', '--en-overlay-radius', '--en-overlay-max-inline-size']) (element as HTMLElement).style.removeProperty(property);
  });
  await overlayPaddingShorthands(page, [{ owner, targets: [header, body, footer], zeroInsets: [surface] }]);
  expect(await style(header, Object.keys(observations.header)), 'Absent padding override restores the compensated source header').toEqual(observations.header);
  await metrics(body, { padding: 24 }); await metrics(surface, { 'border-radius': 12 });
  return observations;
}

async function webAwesomeDialog(page: Page, modal: Locator, info: TestInfo, appearance: Appearance) {
  const surface = part(modal, 'surface');
  const observations = await webAwesomeDialogGeometry(page, modal, surface, part(modal, 'header'), part(modal, 'heading'), part(modal, 'body'), part(modal, 'footer'));
  const assignedFooter = await modal.locator(':scope > [slot="footer"]').elementHandle();
  await assignedFooter!.evaluate(element => element.remove()); await expect(part(modal, 'footer')).toBeHidden();
  await modal.evaluate((element, footer) => { if (footer) element.append(footer); }, assignedFooter);
  await expect(part(modal, 'footer')).toBeVisible(); await assignedFooter?.dispose();
  const editor = modal.getByRole('textbox', { name: 'Email address', exact: true });
  await editor.fill('preserved@example.com');
  await modal.evaluate(element => element.addEventListener('en-change', event => {
    if (!(event as CustomEvent<{ proposed: boolean }>).detail.proposed) event.preventDefault();
  }, { once: true }));
  await page.keyboard.press('Escape');
  await expect(modal.getByRole('dialog')).toBeVisible(); await expect(editor).toBeFocused(); await expect(editor).toHaveValue('preserved@example.com');
  // Keep the body scrollport and a protected close target while source spacing
  // is applied. This content is authored light DOM, not a private template edit.
  await modal.evaluate(element => {
    const tail = document.createElement('p'); tail.id = 'wa-long-modal-content'; tail.textContent = 'Long source content.'; tail.style.minHeight = '1200px'; element.append(tail);
    (element as HTMLElement).style.setProperty('--en-overlay-max-block-size', '320px');
  });
  const scroll = await part(modal, 'body').evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight, overflow: getComputedStyle(element).overflowY }));
  expect(scroll.scroll).toBeGreaterThan(scroll.client); expect(scroll.overflow).toBe('auto');
  const close = (await modal.getByRole('button', { name: 'Close', exact: true }).boundingBox())!;
  expect(close.width, 'Source styling retains the local close hit target').toBeGreaterThanOrEqual(40);
  expect(close.height).toBeGreaterThanOrEqual(40);
  await modal.evaluate(element => { element.querySelector('#wa-long-modal-content')!.remove(); (element as HTMLElement).style.removeProperty('--en-overlay-max-block-size'); });
  await evidence(info, `web-awesome-inspired-${appearance}-dialog-sections`, surface, { ...observations, scroll, close });
}

async function webAwesomeOverlayHelpers(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'popover-tooltip', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info, ['overlays', 'typography']); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const region = document.createElement('section'); region.id = 'wa-native-overlays'; region.className = 'en-foundation';
    region.innerHTML = '<dialog class="en-dialog" aria-labelledby="wa-native-dialog-title"><header class="en-overlay-header"><h2 class="en-heading-small" id="wa-native-dialog-title">Native source dialog</h2><button class="en-button en-overlay-close" type="button" aria-label="Close native dialog">×</button></header><div class="en-overlay-body">Native source body.</div><footer class="en-overlay-footer"><button class="en-button" type="button">Native footer</button></footer></dialog><div class="en-tooltip" popover="manual" id="wa-native-tooltip">Native supplementary guidance.</div>';
    element.append(region);
  });
  const nativeDialog = page.locator('#wa-native-overlays dialog');
  await nativeDialog.evaluate(element => (element as HTMLDialogElement).showModal());
  const nativeDialogMeasurements = await webAwesomeDialogGeometry(page, nativeDialog, nativeDialog, nativeDialog.locator('.en-overlay-header'), nativeDialog.locator('.en-heading-small'), nativeDialog.locator('.en-overlay-body'), nativeDialog.locator('.en-overlay-footer'));
  await evidence(info, `web-awesome-inspired-${appearance}-native-dialog`, nativeDialog, nativeDialogMeasurements);
  const nativeFooter = nativeDialog.locator('.en-overlay-footer');
  const footerAction = await nativeFooter.locator('button').elementHandle();
  await footerAction!.evaluate(element => element.remove()); await expect(nativeFooter).toBeHidden();
  await nativeFooter.evaluate((element, button) => { if (button) element.append(button); }, footerAction);
  await expect(nativeFooter).toBeVisible(); await footerAction?.dispose();
  await nativeDialog.evaluate(element => (element as HTMLDialogElement).close());
  const trigger = specimen(page).getByRole('button', { name: 'Hover or focus', exact: true });
  const tooltip = specimen(page).locator('en-tooltip'), surface = part(tooltip, 'surface'), content = part(tooltip, 'content');
  const nativeTooltip = page.locator('#wa-native-tooltip');
  const background = appearance === 'light' ? 'rgb(27, 29, 38)' : 'rgb(241, 242, 243)';
  const color = appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(16, 18, 25)';
  await trigger.focus(); await expect(surface).toBeVisible(); await expect(trigger).toBeFocused();
  await nativeTooltip.evaluate(element => (element as HTMLElement).showPopover());
  const observations: Record<string, unknown> = {};
  await page.locator('html').evaluate(element => {
    element.style.setProperty('--en-overlay-radius', '19px'); element.style.setProperty('--en-overlay-background', '#102030');
    element.style.setProperty('--en-overlay-color', '#f1e2d3'); element.style.setProperty('--en-overlay-border-color', '#506070'); element.style.setProperty('--en-overlay-padding', '13px');
  });
  for (const plate of [surface, nativeTooltip]) await metrics(plate, { 'border-radius': 19, 'background-color': 'rgb(16, 32, 48)', color: 'rgb(241, 226, 211)', 'border-top-color': 'rgb(80, 96, 112)' });
  for (const inset of [content, nativeTooltip]) await metrics(inset, { padding: 13 });
  await page.locator('html').evaluate(element => {
    for (const property of ['--en-overlay-padding', '--en-overlay-radius', '--en-overlay-background', '--en-overlay-color', '--en-overlay-border-color']) element.style.removeProperty(property);
  });
  for (const [name, plate, inset, owner] of [['custom', surface, content, tooltip], ['native', nativeTooltip, nativeTooltip, nativeTooltip]] as const) {
    observations[name] = await metrics(plate, { 'font-size': 14, 'line-height': 22.4, 'font-weight': '400', 'border-radius': 3, 'border-top-width': 1, 'border-top-style': 'solid', 'border-top-color': background, 'background-color': background, color, 'box-shadow': 'none' });
    await metrics(inset, { 'padding-top': 3.5, 'padding-bottom': 3.5, 'padding-inline-start': 7, 'padding-inline-end': 7 });
    await owner.evaluate(element => {
      const value = (element as HTMLElement).style;
      value.setProperty('--en-overlay-padding', '11px'); value.setProperty('--en-overlay-radius', '17px');
      value.setProperty('--en-overlay-background', '#102030'); value.setProperty('--en-overlay-color', '#f1e2d3'); value.setProperty('--en-overlay-border-color', '#506070');
    });
    await metrics(inset, { padding: 11 });
    await metrics(plate, { 'border-radius': 17, 'background-color': 'rgb(16, 32, 48)', color: 'rgb(241, 226, 211)', 'border-top-color': 'rgb(80, 96, 112)' });
    await owner.evaluate(element => {
      for (const property of ['--en-overlay-padding', '--en-overlay-radius', '--en-overlay-background', '--en-overlay-color', '--en-overlay-border-color']) (element as HTMLElement).style.removeProperty(property);
    });
    await metrics(plate, { 'border-radius': 3, 'background-color': background, color });
  }
  await overlayPaddingShorthands(page, [
    { owner: tooltip, targets: [content], zeroInsets: [surface] },
    { owner: nativeTooltip, targets: [nativeTooltip] },
  ]);
  await tooltipBackgroundShorthand(page, [{ owner: tooltip, surface }, { owner: nativeTooltip, surface: nativeTooltip }]);
  const authorTypography = await page.addStyleTag({ content: 'en-tooltip::part(surface), #wa-native-tooltip { font-size: 20px; line-height: 1.7; font-weight: 500; }' });
  try {
    for (const plate of [surface, nativeTooltip]) await metrics(plate, { 'font-size': 20, 'line-height': 34, 'font-weight': '500' });
    for (const inset of [content, nativeTooltip]) await metrics(inset, { 'padding-top': 5, 'padding-inline-start': 10 });
  } finally {
    await authorTypography.evaluate(element => (element as HTMLStyleElement).remove()); await authorTypography.dispose();
  }
  for (const plate of [surface, nativeTooltip]) await metrics(plate, { 'font-size': 14, 'line-height': 22.4, 'font-weight': '400' });
  // Local arrow is explicitly authored, unlike WA's default-on arrow. Insets
  // belong to the content wrapper once with either native or custom delivery.
  await tooltip.evaluate(async element => {
    const host = element as HTMLElement & { arrow: boolean; updateComplete: Promise<unknown> };
    host.arrow = true; await host.updateComplete;
  });
  await nativeTooltip.evaluate(element => {
    const text = element.textContent; element.textContent = ''; element.setAttribute('data-arrow', '');
    const wrapper = document.createElement('div'); wrapper.className = 'en-overlay-content'; wrapper.textContent = text; element.append(wrapper);
  });
  for (const plate of [surface, nativeTooltip]) await metrics(plate, { padding: 0 });
  for (const wrapper of [content, nativeTooltip.locator('.en-overlay-content')]) await metrics(wrapper, { 'padding-block-start': 3.5, 'padding-inline-start': 7 });
  await overlayPaddingShorthands(page, [
    { owner: tooltip, targets: [content], zeroInsets: [surface] },
    { owner: nativeTooltip, targets: [nativeTooltip.locator('.en-overlay-content')], zeroInsets: [nativeTooltip] },
  ]);
  await tooltipBackgroundShorthand(page, [{ owner: tooltip, surface }, { owner: nativeTooltip, surface: nativeTooltip }]);
  await tooltip.evaluate(async element => {
    const host = element as HTMLElement & { arrow: boolean; updateComplete: Promise<unknown> };
    host.arrow = false; await host.updateComplete;
  });
  await nativeTooltip.evaluate(element => { const text = element.textContent; element.textContent = text; element.removeAttribute('data-arrow'); });
  // WA rounds its small font from root/1.125, rather than multiplying a 14px
  // baseline. At 125% root, that source equation gives 18px rather than 17.5px.
  await page.locator('html').evaluate(element => { element.style.fontSize = '125%'; });
  for (const plate of [surface, nativeTooltip]) await metrics(plate, { 'font-size': 18, 'line-height': 28.8, 'border-radius': 3.75 });
  for (const inset of [content, nativeTooltip]) await metrics(inset, { 'padding-top': 4.5, 'padding-inline-start': 9 });
  await page.locator('html').evaluate(element => { element.style.removeProperty('font-size'); });
  const longText = 'Source tooltip measure wraps long supplementary text without overflowing the viewport. '.repeat(5);
  await tooltip.locator(':scope > [slot="content"]').evaluate((element, text) => { element.textContent = text; }, longText);
  await nativeTooltip.evaluate((element, text) => { element.textContent = text; }, longText);
  await page.locator('html').evaluate(element => element.style.setProperty('--en-overlay-max-inline-size', '190px'));
  for (const plate of [surface, nativeTooltip]) expect((await plate.boundingBox())!.width, 'Inherited tooltip maximum replaces the source measure').toBeCloseTo(190, 1);
  await page.locator('html').evaluate(element => element.style.removeProperty('--en-overlay-max-inline-size'));
  for (const [name, plate, owner] of [['custom', surface, tooltip], ['native', nativeTooltip, nativeTooltip]] as const) {
    const sourceMeasure = await plate.evaluate(element => {
      const reference = document.createElement('span'), actual = getComputedStyle(element);
      reference.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;display:block;width:30ch;';
      reference.style.fontFamily = actual.fontFamily; reference.style.fontSize = '14px'; reference.style.fontWeight = '400'; reference.style.fontStyle = actual.fontStyle;
      document.body.append(reference); const width = reference.getBoundingClientRect().width; reference.remove(); return width;
    });
    expect((await plate.boundingBox())!.width, `${name} source 30ch maximum`).toBeCloseTo(sourceMeasure, 1);
    await owner.evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '175px'));
    expect((await plate.boundingBox())!.width, `${name} consumer maximum replaces source measure`).toBeCloseTo(175, 1);
    await owner.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'));
    observations[`${name}SourceMeasure`] = sourceMeasure;
  }
  await nativeTooltip.evaluate(element => (element as HTMLElement).hidePopover());
  await evidence(info, `web-awesome-inspired-${appearance}-tooltip`, surface, observations);
  await page.keyboard.press('Escape'); await expect(surface).not.toBeVisible(); await expect(trigger).toBeFocused();
  // A fresh focused interval reopens help; source geometry scales in RTL at 200%.
  // Restore this shared panel fixture before subsequent source helpers run.
  const originalViewport = page.viewportSize() ?? await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const originalRoot = await page.locator('html').evaluate(element => ({
    direction: element.getAttribute('dir'), fontSize: element.style.getPropertyValue('font-size'),
    fontPriority: element.style.getPropertyPriority('font-size'),
  }));
  try {
    await specimen(page).getByRole('button', { name: 'View options', exact: true }).focus();
    await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
    await page.setViewportSize({ width: 390, height: 844 });
    await trigger.focus(); await expect(surface).toBeVisible();
    await metrics(surface, { 'font-size': 28, 'line-height': 44.8, 'border-radius': 6 });
    await metrics(content, { 'padding-top': 7, 'padding-inline-start': 14 });
    const tooltipBounds = (await surface.boundingBox())!;
    expect(tooltipBounds.x).toBeGreaterThanOrEqual(0); expect(tooltipBounds.x + tooltipBounds.width).toBeLessThanOrEqual(390);
    await evidence(info, `web-awesome-inspired-${appearance}-tooltip-rtl-enlarged`, surface, tooltipBounds);
    await page.keyboard.press('Escape'); await expect(surface).not.toBeVisible(); await expect(trigger).toBeFocused();
  } finally {
    await page.locator('html').evaluate((element, original) => {
      if (original.direction === null) element.removeAttribute('dir'); else element.setAttribute('dir', original.direction);
      if (original.fontSize) element.style.setProperty('font-size', original.fontSize, original.fontPriority);
      else element.style.removeProperty('font-size');
    }, originalRoot);
    await page.setViewportSize(originalViewport);
  }
}

async function webAwesomeTextarea(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'long-text-search', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info); await mountExportedCSS(page, css);
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'textarea-default', mode: appearance }), { colorScheme: true }) });
  await specimen(page).evaluate(element => {
    element.classList.add('en-foundation'); element.setAttribute('data-size', 'medium');
    const native = document.createElement('label'); native.id = 'native-source-textarea';
    native.textContent = 'Native source notes';
    const editor = document.createElement('textarea'); editor.className = 'en-textarea'; editor.rows = 3; native.append(editor);
    const isolated = document.createElement('section'); isolated.id = 'isolated-textarea';
    isolated.className = 'en-foundation'; isolated.dataset.enTheme = 'textarea-default';
    isolated.innerHTML = '<en-textarea label="Isolated custom notes" rows="3"></en-textarea><label>Isolated native notes<textarea class="en-textarea" rows="3"></textarea></label>';
    element.append(native, isolated);
  });
  await settled(page);
  const host = specimen(page).locator('en-textarea[label="Creative direction"]');
  const custom = host.getByRole('textbox', { name: 'Creative direction', exact: true });
  const native = page.locator('#native-source-textarea textarea');
  const typography = ['font-size', 'line-height', 'padding-top', 'padding-bottom', 'scroll-padding-block-end'];
  const observations: Record<string, unknown> = {};
  // Default source: 16px with 1.6 leading and .45em block inset.
  for (const [name, editor] of [['custom', custom], ['native', native]] as const) {
    observations[name] = await metrics(editor, { 'font-size': 16, 'line-height': 25.6, 'padding-top': 7.2, 'padding-bottom': 7.2, 'scroll-padding-block-end': 7.2 });
  }
  await specimen(page).evaluate(element => element.setAttribute('data-size', 'large'));
  await metrics(custom, { 'font-size': 16, 'line-height': 25.6 });
  await host.evaluate(element => element.setAttribute('size', 'inherit'));
  // En Reve preserves the base input font at small size (recipes.ts). These
  // local S16/M16/L18 sizes differ from WA's S14/M16/L20; .45em padding follows
  // the actual local font, including the deliberate small-text floor.
  for (const [size, font, leading, padding] of [['small', 16, 25.6, 7.2], ['medium', 16, 25.6, 7.2], ['large', 18, 28.8, 8.1]] as const) {
    await specimen(page).evaluate((element, size) => element.setAttribute('data-size', size), size);
    for (const editor of [custom, native]) await metrics(editor, { 'font-size': font, 'line-height': leading, 'padding-top': padding, 'padding-bottom': padding, 'scroll-padding-block-end': padding });
  }
  await specimen(page).evaluate(element => element.setAttribute('data-size', 'medium'));
  const consumerFont = await page.addStyleTag({ content: 'en-textarea[label="Creative direction"]::part(control), #native-source-textarea textarea { font-size: 20px; }' });
  for (const editor of [custom, native]) await metrics(editor, { 'font-size': 20, 'line-height': 32, 'padding-top': 9, 'padding-bottom': 9 });
  await consumerFont.evaluate(element => element.parentNode?.removeChild(element)); await consumerFont.dispose();
  for (const owner of [host, native]) await owner.evaluate(element => {
    const style = (element as HTMLElement).style;
    style.setProperty('--en-font-input-line-height', '1.9'); style.setProperty('--en-input-inline-padding', '23px');
  });
  for (const editor of [custom, native]) await metrics(editor, { 'font-size': 16, 'line-height': 30.4, 'padding-inline-start': 23, 'padding-inline-end': 23 });
  for (const owner of [host, native]) await owner.evaluate(element => {
    const style = (element as HTMLElement).style;
    style.removeProperty('--en-font-input-line-height'); style.removeProperty('--en-input-inline-padding');
  });
  const isolated = page.locator('#isolated-textarea');
  const isolatedEditors = [isolated.getByRole('textbox', { name: 'Isolated custom notes', exact: true }), isolated.getByRole('textbox', { name: 'Isolated native notes', exact: true })];
  await page.locator('html').evaluate(element => element.removeAttribute('data-en-theme'));
  const before = await Promise.all(isolatedEditors.map(editor => style(editor, typography)));
  await page.locator('html').evaluate(element => element.setAttribute('data-en-theme', 'web-awesome-inspired'));
  expect(await Promise.all(isolatedEditors.map(editor => style(editor, typography))), 'An outer WA textarea companion cannot restyle a complete nested theme').toEqual(before);
  observations.isolated = before;
  await page.locator('html').evaluate(element => { element.style.fontSize = '200%'; });
  const multiline = 'First source line\nSecond source line\nThird source line';
  for (const [name, editor] of [['custom', custom], ['native', native]] as const) {
    await metrics(editor, { 'font-size': 32, 'line-height': 51.2, 'padding-top': 14.4, 'padding-bottom': 14.4 });
    await editor.fill(multiline); await expect(editor).toHaveValue(multiline); await expect(editor).toBeFocused();
    const bounds = await editor.evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight, width: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(bounds.scroll, 'Three enlarged lines fit the native three-row editor').toBeLessThanOrEqual(bounds.client + 1);
    expect(bounds.scrollWidth, 'Multiline text wraps within the native editor').toBeLessThanOrEqual(bounds.width + 1);
    observations[`${name}Enlarged`] = bounds;
  }
  await evidence(info, `web-awesome-inspired-${appearance}-textarea`, specimen(page), observations);
}

// Rhea cards use min(radius-4xl, 24px), retaining the absolute cap as text grows.
async function shadcnCardRadiusCap(page: Page, card: Locator, native: Locator) {
  const surfaces = [part(card, 'base'), native], hosts = [card, native];
  const root = page.locator('html'); await metrics(root, { 'font-size': 16 });
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 24 });
  const previousFontSize = await root.evaluate(element => {
    const style = (element as HTMLElement).style;
    const previous = { value: style.getPropertyValue('font-size'), priority: style.getPropertyPriority('font-size') };
    style.setProperty('font-size', '200%'); return previous;
  });
  try {
    await metrics(root, { 'font-size': 32 });
    for (const surface of surfaces) await metrics(surface, { 'border-radius': 24 });
  } finally {
    await root.evaluate((element, previous) => {
      const style = (element as HTMLElement).style;
      if (previous.value) style.setProperty('font-size', previous.value, previous.priority);
      else style.removeProperty('font-size');
    }, previousFontSize);
  }
  // Consumer hooks remain outside the source cap, including inherited overrides.
  await root.evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-radius', '31px'));
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 31 });
  for (const host of hosts) await host.evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-radius', '37px'));
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 37 });
  for (const host of hosts) await host.evaluate(element => (element as HTMLElement).style.removeProperty('--en-surface-radius'));
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 31 });
  await root.evaluate(element => (element as HTMLElement).style.removeProperty('--en-surface-radius'));
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 24 });
}

// Pinned Rhea/Neutral: --radius=.625rem; rounded-xl=radius*1.4 and
// rounded-lg=radius. These literal observations are independent of our export.
async function shadcnTooltipKeycapRadii(page: Page, tooltip: Locator, css: string, info: TestInfo) {
  await nativeStyles(page, info, ['overlays']); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const region = document.createElement('section'); region.id = 'native-source-compact-radii'; region.className = 'en-foundation';
    region.innerHTML = '<div class="en-tooltip" role="tooltip" popover="manual">Native source tooltip</div><kbd class="en-keycap">K</kbd>';
    element.append(region);
  });
  const nativeTooltip = page.locator('#native-source-compact-radii .en-tooltip');
  const keycap = page.locator('#native-source-compact-radii kbd.en-keycap');
  const surfaces = [part(tooltip, 'surface'), nativeTooltip];
  await nativeTooltip.evaluate(element => (element as HTMLElement).showPopover());
  await expect(nativeTooltip).toBeVisible(); await expect(keycap).toBeVisible();
  const measureSourceGeometry = async (scale: 1 | 2) => {
    const tooltipBounds = [];
    for (const surface of surfaces) {
      await metrics(surface, { 'border-radius': 14 * scale, 'font-size': 12 * scale, 'line-height': 16 * scale });
      const bounds = (await surface.boundingBox())!;
      expect(bounds.height, 'Source single-line tooltip height retains room for both corners').toBeCloseTo(28 * scale, 1);
      expect(bounds.width).toBeGreaterThanOrEqual(28 * scale);
      tooltipBounds.push(bounds);
    }
    for (const content of [part(tooltip, 'content'), nativeTooltip]) await metrics(content, { 'padding-inline-start': 12 * scale, 'padding-top': 6 * scale });
    await metrics(keycap, { 'border-radius': 10 * scale, 'font-size': 12 * scale, 'line-height': 16 * scale, 'min-inline-size': 20 * scale, 'min-block-size': 20 * scale, 'padding-inline-start': 4 * scale });
    const keycapBounds = (await keycap.boundingBox())!;
    expect(keycapBounds.height, 'Source keycap box retains its full corner diameter').toBeCloseTo(20 * scale, 1);
    expect(keycapBounds.width).toBeCloseTo(20 * scale, 1);
    return { tooltipBounds, keycapBounds };
  };
  const ordinary = await measureSourceGeometry(1);
  let enlarged: Awaited<ReturnType<typeof measureSourceGeometry>> | undefined;
  const root = page.locator('html'); await metrics(root, { 'font-size': 16 });
  const previousFontSize = await root.evaluate(element => {
    const style = (element as HTMLElement).style;
    const previous = { value: style.getPropertyValue('font-size'), priority: style.getPropertyPriority('font-size') };
    style.setProperty('font-size', '200%'); return previous;
  });
  try {
    await metrics(root, { 'font-size': 32 });
    enlarged = await measureSourceGeometry(2);
  } finally {
    await root.evaluate((element, previous) => {
      const style = (element as HTMLElement).style;
      if (previous.value) style.setProperty('font-size', previous.value, previous.priority);
      else style.removeProperty('font-size');
    }, previousFontSize);
  }
  // The existing public overlay hook and ordinary native CSS stay authoritative.
  for (const host of [tooltip, nativeTooltip]) await host.evaluate(element => {
    const style = (element as HTMLElement).style; style.setProperty('--en-overlay-radius', '31px'); style.setProperty('--en-overlay-padding', '9px');
  });
  for (const surface of surfaces) await metrics(surface, { 'border-radius': 31 });
  for (const content of [part(tooltip, 'content'), nativeTooltip]) await metrics(content, { 'padding-inline-start': 9, 'padding-top': 9 });
  await keycap.evaluate(element => { (element as HTMLElement).style.borderRadius = '7px'; });
  await metrics(keycap, { 'border-radius': 7 });
  for (const host of [tooltip, nativeTooltip]) await host.evaluate(element => {
    const style = (element as HTMLElement).style; style.removeProperty('--en-overlay-radius'); style.removeProperty('--en-overlay-padding');
  });
  await keycap.evaluate(element => { (element as HTMLElement).style.removeProperty('border-radius'); });
  await measureSourceGeometry(1);
  await info.attach('shadcn-source-compact-radii', {
    contentType: 'application/json',
    body: JSON.stringify({ source: 'a87a63b2ca25143d26c8bd0903e4e9bc77b3f824', rootFontSizes: [16, 32], tooltipRadii: [14, 28], keycapRadii: [10, 20], ordinary, enlarged, restoredTooltip: await style(nativeTooltip, ['border-radius']), restoredKeycap: await style(keycap, ['border-radius']) }, null, 2),
  });
  await nativeTooltip.evaluate(element => (element as HTMLElement).hidePopover());
}

async function shadcnDialogWidth(page: Page, owner: Locator, surface: Locator, info: TestInfo, native = false) {
  // Pinned Rhea wrapper: w-full, max-w-[calc(100%-2rem)], sm:max-w-md.
  // Independent expected values exercise both sides of Tailwind's 40rem sm.
  const viewport = page.viewportSize()!;
  const widths: Record<string, number> = {};
  const presentation = await owner.evaluate(element => ({ presentation: element.getAttribute('presentation'), query: element.getAttribute('responsive-query'), drawer: element.classList.contains('en-drawer'), placement: element.getAttribute('data-placement') }));
  try {
    for (const [width, expected] of [[1440, 448], [600, 568], [640, 448], [390, 358]] as const) {
      await page.setViewportSize({ width, height: viewport.height });
      await expect(surface).toHaveCSS('width', `${expected}px`);
      const box = (await surface.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
      widths[String(width)] = box.width;
    }
    await page.setViewportSize({ width: 1440, height: viewport.height });
    // An inherited override can exceed the source maximum; a local one wins.
    await page.locator('html').evaluate(element => { element.style.setProperty('--en-overlay-max-inline-size', '544px'); });
    await expect(surface).toHaveCSS('width', '544px');
    await owner.evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '360px'); });
    await expect(surface).toHaveCSS('width', '360px');
    await owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'); });
    await expect(surface).toHaveCSS('width', '544px');
    await page.locator('html').evaluate(element => { element.style.removeProperty('--en-overlay-max-inline-size'); });
    await expect(surface).toHaveCSS('width', '448px');
    await page.setViewportSize({ width: 390, height: viewport.height });
    await owner.evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '2000px'); });
    await expect(surface).toHaveCSS('width', '358px');
    await owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'); });
    if (native) {
      await owner.evaluate(element => { element.classList.add('en-drawer'); element.setAttribute('data-placement', 'bottom'); });
      await expect(surface).toHaveCSS('width', '390px');
      await metrics(surface, { 'border-radius': 0 });
      await owner.evaluate(element => { element.classList.remove('en-drawer'); element.removeAttribute('data-placement'); });
    } else {
      await owner.evaluate(element => { element.setAttribute('presentation', 'responsive'); element.setAttribute('responsive-query', '(width < 10000px)'); });
      await expect(surface).toHaveCSS('width', '390px');
      await metrics(surface, { 'border-radius': 0 });
      await owner.evaluate(element => { element.setAttribute('presentation', 'dialog'); element.removeAttribute('responsive-query'); });
    }
    await expect(surface).toHaveCSS('width', '358px');
    await metrics(surface, { 'border-radius': 24 });
    await evidence(info, `shadcn-dialog-${native ? 'native' : 'custom'}-source-width`, surface, widths);
  } finally {
    await page.locator('html').evaluate(element => { element.style.removeProperty('--en-overlay-max-inline-size'); });
    await owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'); });
    if (native) await owner.evaluate((element, saved) => {
      element.classList.toggle('en-drawer', saved.drawer);
      if (saved.placement === null) element.removeAttribute('data-placement'); else element.setAttribute('data-placement', saved.placement);
    }, presentation);
    else await owner.evaluate((element, saved) => {
      if (saved.presentation === null) element.removeAttribute('presentation'); else element.setAttribute('presentation', saved.presentation);
      if (saved.query === null) element.removeAttribute('responsive-query'); else element.setAttribute('responsive-query', saved.query);
    }, presentation);
    await page.setViewportSize(viewport);
  }
}

async function shadcnNativeOverlays(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await nativeStyles(page, info, ['overlays', 'typography']); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const region = document.createElement('section'); region.id = 'native-source-overlays'; region.className = 'en-foundation';
    region.innerHTML = '<dialog class="en-dialog" aria-labelledby="native-dialog-heading"><header class="en-overlay-header"><h2 class="en-heading-small" id="native-dialog-heading">Native source dialog</h2></header><div class="en-overlay-body">Native modal content.</div><footer class="en-overlay-footer"></footer></dialog>';
    for (const arrow of [false, true]) {
      const popup = document.createElement('div'); popup.className = 'en-popover'; popup.setAttribute('popover', 'manual');
      popup.id = arrow ? 'native-arrow-popover' : 'native-plain-popover';
      const content = '<h2 class="en-heading-small">Native source popover</h2><div class="en-overlay-body">Native popup content.</div>';
      if (arrow) { popup.setAttribute('data-arrow', ''); popup.innerHTML = `<div class="en-overlay-content">${content}</div>`; }
      else popup.innerHTML = content;
      region.append(popup);
    }
    element.append(region);
  });
  const dialog = page.locator('#native-source-overlays dialog');
  await dialog.evaluate(element => (element as HTMLDialogElement).showModal()); await expect(dialog).toBeVisible();
  await metrics(dialog, { padding: 24, gap: 24, 'border-radius': 24, 'font-size': 14, 'line-height': 20, 'font-weight': '400' });
  await metrics(dialog.locator('.en-heading-small'), { 'font-size': 16, 'line-height': 16, 'font-weight': '500' });
  await expect(dialog.locator('.en-overlay-footer')).toBeHidden();
  await shadcnDialogWidth(page, dialog, dialog, info, true);
  // Overrides larger than the source cap must remain authoritative.
  await page.locator('html').evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-radius', '31px'); });
  await metrics(dialog, { 'border-radius': 31 });
  await page.locator('html').evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-radius'); });
  await dialog.evaluate(element => { const style = (element as HTMLElement).style; style.setProperty('--en-overlay-padding', '21px'); style.setProperty('--en-overlay-radius', '37px'); });
  await metrics(dialog, { padding: 21, 'border-radius': 37 });
  await dialog.evaluate(element => { const dialog = element as HTMLDialogElement; dialog.style.removeProperty('--en-overlay-padding'); dialog.style.removeProperty('--en-overlay-radius'); });
  await evidence(info, `shadcn-inspired-${appearance}-native-dialog`, dialog, await style(dialog, ['padding', 'gap', 'border-radius', 'font-size', 'line-height']));
  await dialog.evaluate(element => (element as HTMLDialogElement).close());
  for (const arrow of [false, true]) {
    const popup = page.locator(arrow ? '#native-arrow-popover' : '#native-plain-popover');
    await popup.evaluate(element => (element as HTMLElement).showPopover()); await expect(popup).toBeVisible();
    await metrics(popup, { padding: arrow ? 0 : 16, 'row-gap': 16, 'border-radius': 22, 'font-size': 14, 'line-height': 20, 'font-weight': '400' });
    await metrics(popup.locator('.en-heading-small'), { 'font-size': 16, 'line-height': 24, 'font-weight': '500' });
    if (arrow) await metrics(popup.locator('.en-overlay-content'), { padding: 16 });
    await popup.evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-padding', '21px'); });
    await metrics(arrow ? popup.locator('.en-overlay-content') : popup, { padding: 21 });
    if (arrow) await metrics(popup, { padding: 0 });
    await popup.evaluate(element => { const popup = element as HTMLElement; popup.style.removeProperty('--en-overlay-padding'); popup.hidePopover(); });
  }
}

function sliderReference(theme: Theme, appearance: Appearance) {
  const light = appearance === 'light';
  const rgba = (hex: string, alpha = 1): RGBA => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), alpha];
  // Source audits identify the selected palette/flavor and repeated profiles.
  // Fluent large repeats medium; Astryx and Rhea have one visual size profile.
  const profiles = {
    'spectrum-inspired': { sizes: [[4, 18], [4, 20], [4, 22]], rail: rgba(light ? 'dadada' : '393939'), fill: rgba(light ? '505050' : 'afafaf'), thumb: rgba(light ? 'ffffff' : '111111'), rims: [rgba(light ? '292929' : 'dbdbdb')] },
    'fluent-inspired': { sizes: [[2, 16], [4, 20], [4, 20]], rail: rgba(light ? '616161' : 'adadad'), fill: rgba(light ? 'a63f50' : 'fd9fb0'), thumb: rgba(light ? 'a63f50' : 'fd9fb0'), rims: [rgba(light ? 'd1d1d1' : '666666'), rgba(light ? 'ffffff' : '292929')] },
    'astryx-inspired': { sizes: [[4, 20], [4, 20], [4, 20]], rail: rgba(light ? 'ccd3db' : '5a5e66'), fill: rgba(light ? '15110c' : 'dfe2e5'), thumb: rgba(light ? '15110c' : 'dfe2e5'), rims: [] },
    'shadcn-inspired': { sizes: [[4, 16], [4, 16], [4, 16]], rail: rgba(light ? 'e5e5e5' : 'ffffff', light ? .9 : .135), fill: rgba(light ? '171717' : 'e5e5e5'), thumb: rgba('ffffff'), rims: [] },
    'radix-inspired': { sizes: [[6, 13], [8, 16], [10, 19]], rail: rgba(light ? '000033' : 'ddeaf8', (light ? 15 : 20) / 255), fill: rgba('3e63dd'), thumb: rgba('ffffff'), rims: [] },
    'web-awesome-inspired': { sizes: [[7, 19.6], [8, 22.4], [10, 28]], rail: rgba(light ? 'e4e5e9' : '2f323f'), fill: rgba('0071ec'), thumb: rgba('0071ec'), rims: [rgba(light ? 'ffffff' : '101219')] },
  };
  return profiles[theme];
}

async function webAwesomeAvatar(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'card', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info, ['feedback']); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const region = document.createElement('section'); region.id = 'native-source-avatar'; region.className = 'en-foundation';
    region.innerHTML = '<span class="en-avatar" role="img" aria-label="Native collaborator"><span class="en-avatar__fallback" aria-hidden="true">NC</span></span>';
    element.append(region);
  });
  const host = specimen(page).locator('en-avatar[name="Mira Chen"]');
  const native = page.locator('#native-source-avatar .en-avatar');
  const entries = [[host, part(host, 'base'), part(host, 'fallback')], [native, native, native.locator('.en-avatar__fallback')]] as const;
  const background = appearance === 'light' ? 'rgb(228, 229, 233)' : 'rgb(47, 50, 63)';
  const color = appearance === 'light' ? 'rgb(66, 69, 84)' : 'rgb(171, 174, 185)';
  for (const [size, diameter, font] of [['small', 42, 16.8], ['medium', 48, 19.2], ['large', 60, 24]] as const) {
    await host.evaluate(async (element, size) => { element.setAttribute('size', size); await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; }, size);
    await page.locator('#native-source-avatar').evaluate((element, size) => element.setAttribute('data-size', size), size);
    for (const [, frame, fallback] of entries) {
      await metrics(frame, { width: diameter, height: diameter, 'background-color': background, color });
      await metrics(fallback, { 'font-size': font, 'line-height': font, 'font-weight': '400', 'text-transform': 'uppercase' });
    }
  }
  for (const [owner, frame, fallback] of entries) {
    await owner.evaluate(element => { const style = (element as HTMLElement).style; style.setProperty('--en-avatar-size', '80px'); style.setProperty('--en-avatar-radius', '9px'); });
    await metrics(frame, { width: 80, height: 80, 'border-radius': 9 });
    await metrics(fallback, { 'font-size': 32, 'line-height': 32 });
    await owner.evaluate(element => { const style = (element as HTMLElement).style; style.removeProperty('--en-avatar-size'); style.removeProperty('--en-avatar-radius'); });
  }
  await host.evaluate(element => element.setAttribute('size', 'medium'));
  await page.locator('#native-source-avatar').evaluate(element => element.setAttribute('data-size', 'medium'));
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
  for (const [, frame, fallback] of entries) {
    await metrics(frame, { width: 96, height: 96 }); await metrics(fallback, { 'font-size': 38.4, 'line-height': 38.4 });
    const outer = (await frame.boundingBox())!, inner = (await fallback.boundingBox())!;
    expect(inner.x).toBeGreaterThanOrEqual(outer.x); expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width); expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height);
  }
  await expect(part(host, 'base')).toHaveAccessibleName('Mira Chen'); await expect(native).toHaveAccessibleName('Native collaborator');
  await evidence(info, `web-awesome-inspired-${appearance}-avatars`, specimen(page), { background, color, sourceDiameterFontRatio: .4, defaultDiameter: 48, defaultFont: 19.2, enlargedDiameter: 96, enlargedFont: 38.4 });
}

async function webAwesomeRating(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'rating', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const field = document.createElement('fieldset'); field.id = 'native-source-rating'; field.className = 'en-foundation';
    field.innerHTML = '<legend>Native usefulness</legend><div class="en-rating"><label class="en-rating-clear"><input class="en-rating-input en-sr-only" type="radio" name="native-source-rating" value="0">No rating</label><div class="en-rating-values">' + [1, 2, 3, 4, 5].map(value => `<label class="en-rating-item"><input class="en-rating-input en-sr-only" type="radio" name="native-source-rating" value="${value}" aria-label="${value} of 5 stars" ${value === 3 ? 'checked' : ''}><span class="en-rating-star" aria-hidden="true" ${value <= 3 ? 'data-filled' : ''}>${value <= 3 ? '★' : '☆'}</span></label>`).join('') + '</div></div>';
    // Native authors own radio state and the documented data-filled recipe.
    field.addEventListener('change', () => {
      const value = Number(field.querySelector<HTMLInputElement>('input:checked')!.value);
      field.querySelectorAll<HTMLElement>('.en-rating-star').forEach((star, index) => { star.toggleAttribute('data-filled', index < value); star.textContent = index < value ? '★' : '☆'; });
    });
    element.append(field);
  });
  const host = specimen(page).locator('en-rating'); await host.evaluate(element => { element.id = 'custom-source-rating'; });
  const native = page.locator('#native-source-rating');
  const entries = [
    { owner: host, values: part(host, 'star-options'), targets: host.locator('[part~="star-option"]'), stars: host.locator('[part~="star"]') },
    { owner: native, values: native.locator('.en-rating-values'), targets: native.locator('.en-rating-item'), stars: native.locator('.en-rating-star') },
  ];
  const filled = 'rgb(239, 157, 0)', empty = appearance === 'light' ? 'rgb(84, 88, 104)' : 'rgb(145, 148, 162)';
  for (const [size, glyph, inline, spacing, target] of [['small', 14, 17.5, 1.75, 24], ['medium', 16, 20, 2, 24], ['large', 20, 25, 2.5, 30]] as const) {
    await host.evaluate(async (element, size) => { element.setAttribute('size', size); await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; }, size);
    await native.evaluate((element, size) => element.setAttribute('data-size', size), size);
    for (const entry of entries) {
      await metrics(entry.values, { gap: spacing });
      await metrics(entry.targets.first(), { width: target, height: target, padding: spacing, 'border-top-width': 0 });
      await metrics(entry.stars.first(), { 'font-size': glyph, 'line-height': glyph, width: inline, height: glyph, color: filled });
      await metrics(entry.stars.last(), { color: empty });
    }
  }
  for (const entry of entries) {
    const fourth = entry.owner.getByRole('radio', { name: '4 of 5 stars', exact: true });
    await fourth.focus(); await fourth.press('Space'); await expect(fourth).toBeChecked();
    await metrics(entry.stars.nth(3), { color: filled });
    await hold(page, entry.targets.nth(3), async () => {
      await metrics(entry.targets.nth(3), { 'background-color': 'rgba(0, 0, 0, 0)', 'box-shadow': 'none' });
      await metrics(entry.stars.nth(3), { color: filled });
    });
    await entry.owner.evaluate(async element => { (element as HTMLElement & { disabled: boolean }).disabled = true; await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete; });
    await expect(fourth).toBeDisabled(); await metrics(entry.values, { opacity: .5 });
    for (let index = 0; index < 5; index++) await metrics(entry.stars.nth(index), { color: index < 4 ? filled : empty });
    const before = await style(entry.targets.nth(3), ['background-color', 'box-shadow', 'transform', 'translate', 'scale']);
    await hold(page, entry.targets.nth(3), async () => {
      expect(await style(entry.targets.nth(3), ['background-color', 'box-shadow', 'transform', 'translate', 'scale'])).toEqual(before);
      await metrics(entry.values, { opacity: .5 }); await metrics(entry.stars.nth(3), { color: filled });
    });
    await expect(fourth).toBeChecked();
    await entry.owner.evaluate(async element => { (element as HTMLElement & { disabled: boolean }).disabled = false; await (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete; });
  }
  await expect(host.locator('[part~="star-filled"]')).toHaveCount(4);
  const override = await page.addStyleTag({ content: '#custom-source-rating::part(star), #native-source-rating .en-rating-star { --en-color-action-text: rgb(7, 90, 120); }' });
  for (const entry of entries) await metrics(entry.stars.nth(3), { color: 'rgb(7, 90, 120)' });
  await override.evaluate(element => element.parentNode?.removeChild(element));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const entry of entries) {
    await entry.owner.evaluate(element => {
      const style = (element as HTMLElement).style;
      style.setProperty('--en-rating-pressed-background', 'rgb(20, 40, 60)');
      style.setProperty('--en-rating-pressed-scale', '.96'); style.setProperty('--en-rating-pressed-offset', '1px');
      style.setProperty('--en-rating-pressed-shadow', '0 0 0 2px rgb(9, 80, 120)');
    });
    await hold(page, entry.targets.nth(3), async () => {
      await expect(entry.targets.nth(3)).toHaveCSS('scale', '0.96');
      await metrics(entry.targets.nth(3), { translate: '0px 1px', 'background-color': 'rgb(20, 40, 60)', 'box-shadow': 'rgb(9, 80, 120) 0px 0px 0px 2px' });
    });
    await entry.owner.evaluate(element => { for (const property of ['background', 'scale', 'offset', 'shadow']) (element as HTMLElement).style.removeProperty(`--en-rating-pressed-${property}`); });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
  // Source dimensions are mapped at the ordinary root size; independent target
  // floors and the clear option still grow/wrap with the user's text settings.
  for (const entry of entries) {
    const first = (await entry.targets.first().boundingBox())!, last = (await entry.targets.last().boundingBox())!;
    expect(first.x).toBeGreaterThan(last.x);
    const geometry = await entry.values.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    await entry.owner.getByRole('radio', { name: 'No rating', exact: true }).focus();
    await page.keyboard.press('Space'); await expect(entry.owner.getByRole('radio', { name: 'No rating', exact: true })).toBeChecked();
    for (const star of await entry.stars.all()) await metrics(star, { color: empty });
  }
  await expect(host.locator('[part~="star-filled"]')).toHaveCount(0);
  await evidence(info, `web-awesome-inspired-${appearance}-ratings`, specimen(page), { filled, empty, sizes: [[14, 17.5, 1.75, 24], [16, 20, 2, 24], [20, 25, 2.5, 30]], disabledRowOpacity: .5, adaptations: 'Protected square targets; Unicode glyphs; integer radios and separate clear choice.' });
}

async function webAwesomeDisclosure(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'accordion', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info, ['recipes']); await mountExportedCSS(page, css);
  await specimen(page).evaluate(element => {
    const region = document.createElement('section'); region.id = 'native-source-details'; region.className = 'en-foundation';
    region.innerHTML = '<section class="en-accordion-item" id="native-source-disclosure"><h3><button class="en-accordion-trigger" aria-expanded="false" aria-controls="native-details-panel">Native heading disclosure</button></h3><div class="en-accordion-panel" id="native-details-panel" hidden>Authored panel text.</div></section><details class="en-recipe-disclosure" id="native-plain-details"><summary>Native plain disclosure</summary>Plain text without a content wrapper. <span id="plain-details-tail">Additional authored content.</span><details id="native-nested-details"><summary>Nested disclosure</summary><span>Nested content remains browser owned.</span></details></details>';
    const action = region.querySelector<HTMLButtonElement>('button')!, panel = region.querySelector<HTMLElement>('#native-details-panel')!;
    action.addEventListener('click', () => { panel.hidden = !panel.hidden; action.setAttribute('aria-expanded', String(!panel.hidden)); });
    element.append(region);
  });
  const host = specimen(page).locator('en-accordion-item[value="appearance"]'), native = page.locator('#native-source-disclosure');
  const recipe = page.locator('#native-plain-details');
  const entries = [
    { owner: host, frame: part(host, 'base'), action: part(host, 'control'), panel: part(host, 'panel'), mark: part(host, 'indicator'), pseudo: '::before' },
    { owner: native, frame: native, action: native.getByRole('button'), panel: native.locator('.en-accordion-panel'), mark: native.getByRole('button'), pseudo: '::after' },
    { owner: recipe, frame: recipe, action: recipe.locator(':scope > summary'), panel: null, mark: recipe.locator(':scope > summary'), pseudo: '::after' },
  ];
  const background = appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(16, 18, 25)';
  const border = appearance === 'light' ? 'rgb(228, 229, 233)' : 'rgb(47, 50, 63)';
  const color = appearance === 'light' ? 'rgb(27, 29, 38)' : 'rgb(241, 242, 243)';
  const indicator = appearance === 'light' ? 'rgb(84, 88, 104)' : 'rgb(145, 148, 162)';
  for (const entry of entries) {
    await metrics(entry.frame, { 'border-radius': 12, 'border-top-width': 1, 'border-bottom-width': 1, 'border-color': border, 'background-color': background, 'box-shadow': 'none' });
    await metrics(entry.action, { 'font-size': 16, 'line-height': 25.6, 'font-weight': '400', padding: 16, gap: 16, color, 'border-radius': 11 });
    await metrics(entry.mark, { rotate: '-45deg', color: indicator }, entry.pseudo);
    const resting = await style(entry.action, ['background-color', 'color', 'text-decoration-line']);
    await entry.action.hover(); expect(await style(entry.action, ['background-color', 'color', 'text-decoration-line'])).toEqual(resting);
    await entry.action.focus(); await entry.action.press('Enter');
    await metrics(entry.action, { 'border-end-start-radius': 0, 'border-end-end-radius': 0 });
    await metrics(entry.mark, { rotate: '45deg' }, entry.pseudo);
    if (entry.panel) { await expect(entry.panel).toBeVisible(); await metrics(entry.panel, { padding: 16 }); }
    else { await expect(recipe).toHaveAttribute('open', ''); await expect(page.locator('#plain-details-tail')).toBeVisible(); }
    await entry.owner.evaluate(element => { (element as HTMLElement).style.setProperty('--en-control-inline-padding', '23px'); });
    await metrics(entry.action, { 'padding-inline-start': 23, 'padding-inline-end': 23 });
    if (entry.panel) await metrics(entry.panel, { 'padding-inline-start': 23, 'padding-inline-end': 23 });
    else if (await page.evaluate(() => CSS.supports('selector(details::details-content)'))) await metrics(recipe, { 'padding-inline-start': 23, 'padding-inline-end': 23, 'padding-top': 16 }, '::details-content');
    else await metrics(recipe, { 'padding-inline-start': 23, 'padding-inline-end': 23 });
    await entry.owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-control-inline-padding'); });
  }
  const nested = page.locator('#native-nested-details');
  await expect(nested.locator('span')).toBeHidden(); await nested.locator('summary').click(); await expect(nested.locator('span')).toBeVisible();
  await recipe.locator(':scope > summary').click(); await expect(page.locator('#plain-details-tail')).toBeHidden(); await expect(nested).toHaveAttribute('open', '');
  await recipe.locator(':scope > summary').click(); await expect(nested.locator('span')).toBeVisible();
  for (const disabledOwner of [recipe, recipe.locator(':scope > summary')]) {
    // ARIA-disabled paints the authored native recipe; it does not manufacture
    // a native disabled mechanism or replace the browser's disclosure state.
    await disabledOwner.evaluate(element => element.setAttribute('aria-disabled', 'true'));
    await metrics(recipe, { opacity: .5 }); await metrics(recipe.locator(':scope > summary'), { opacity: 1, color });
    await disabledOwner.evaluate(element => element.removeAttribute('aria-disabled'));
  }
  for (const entry of entries.slice(0, 2)) {
    await entry.action.focus(); await entry.action.press('Enter');
    await entry.owner.evaluate(async element => { if (element.localName.startsWith('en-')) { (element as HTMLElement & { disabled: boolean }).disabled = true; await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; } else element.querySelector<HTMLButtonElement>('button')!.disabled = true; });
    await expect(entry.action).toBeDisabled(); await metrics(entry.frame, { opacity: .5 }); await metrics(entry.action, { opacity: 1, color });
    await hold(page, entry.action, async () => { await metrics(entry.frame, { opacity: .5, 'background-color': background }); await metrics(entry.action, { 'background-color': 'rgba(0, 0, 0, 0)', color }); });
    await expect(entry.action).toHaveAttribute('aria-expanded', 'false');
    await entry.owner.evaluate(async element => { if (element.localName.startsWith('en-')) { (element as HTMLElement & { disabled: boolean }).disabled = false; await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; } else element.querySelector<HTMLButtonElement>('button')!.disabled = false; });
  }
  await page.locator('html').evaluate(element => { element.setAttribute('dir', 'rtl'); element.style.fontSize = '200%'; });
  for (const entry of entries) {
    await metrics(entry.frame, { 'border-radius': 24, 'border-top-width': 2 });
    await metrics(entry.action, { 'font-size': 32, 'line-height': 51.2, padding: 32, gap: 32 });
    await metrics(entry.mark, { rotate: entry.panel ? '45deg' : '-45deg' }, entry.pseudo);
    const geometry = await entry.action.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
  }
  await evidence(info, `web-awesome-inspired-${appearance}-details`, specimen(page), { background, border, color, indicator, perItemRadius: 12, padding: 16, font: 16, leading: 25.6, enlargedPadding: 32, localChevronAdaptation: true });
}

async function webAwesomeTabs(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'tabs', 'web-awesome-inspired', appearance, css);
  await nativeStyles(page, info); await mountExportedCSS(page, css);
  // Pinned WA 3.13 tab-group uses neutral-fill-normal for its 0.125rem
  // rail, brand-fill-loud for the indicator, and space-xl on both panel edges.
  const rail = appearance === 'light' ? 'rgb(228, 229, 233)' : 'rgb(47, 50, 63)';
  const indicator = 'rgb(0, 113, 236)', localIndicator = 'rgb(17, 34, 51)';
  const selectedInk = appearance === 'light' ? 'rgb(0, 83, 192)' : 'rgb(62, 150, 255)';
  const localSelectedInk = 'rgb(102, 51, 119)';
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'wa-tabs-isolation', mode: appearance }), {
    selector: '[data-en-theme="wa-tabs-isolation"]', colorScheme: true,
  }) });
  await specimen(page).evaluate(element => {
    const native = document.createElement('section'); native.id = 'native-wa-tabs'; native.className = 'en-tabs en-foundation';
    native.innerHTML = '<div class="en-tab-list" role="tablist" aria-label="Native WA tabs"><button id="native-wa-overview" class="en-tab" role="tab" aria-selected="true" aria-controls="native-wa-overview-panel">Native overview</button><button id="native-wa-layout" class="en-tab" role="tab" aria-selected="false" aria-controls="native-wa-layout-panel">Native layout</button></div><div id="native-wa-overview-panel" class="en-tab-panel" role="tabpanel" aria-labelledby="native-wa-overview">Native overview content.</div><div id="native-wa-layout-panel" class="en-tab-panel" role="tabpanel" aria-labelledby="native-wa-layout" hidden>Native layout content.</div>';
    native.addEventListener('click', event => {
      const action = (event.target as HTMLElement).closest<HTMLButtonElement>('button[role="tab"]');
      if (!action || !native.contains(action)) return;
      for (const tab of native.querySelectorAll('[role="tab"]')) tab.setAttribute('aria-selected', String(tab === action));
      for (const panel of native.querySelectorAll<HTMLElement>('[role="tabpanel"]')) panel.hidden = panel.id !== action.getAttribute('aria-controls');
    });
    const references = document.createElement('section'); references.id = 'wa-tabs-isolation-references';
    references.innerHTML = '<en-tab-panel id="wa-isolated-custom-panel" data-en-theme="wa-tabs-isolation">Independent custom panel.</en-tab-panel><div id="wa-isolated-native-panel" class="en-tab-panel en-foundation" data-en-theme="wa-tabs-isolation">Independent native panel.</div>';
    element.append(native, references);
  });
  await settled(page);
  const tabs = specimen(page).locator('en-tabs'), native = page.locator('#native-wa-tabs');
  const customTab = tabs.getByRole('tab', { name: 'Layout', exact: true });
  const nativeTab = native.getByRole('tab', { name: 'Native layout', exact: true });
  await customTab.click(); await nativeTab.click(); await page.mouse.move(0, 0);
  const customPanel = tabs.locator('en-tab-panel[value="layout"]'), nativePanel = page.locator('#native-wa-layout-panel');
  await expect(customPanel).toBeVisible(); await expect(nativePanel).toBeVisible();
  const panelProperties = ['padding-block-start', 'padding-block-end', 'padding-inline-start', 'padding-inline-end'];
  const observations: Record<string, unknown> = {};
  for (const dir of ['ltr', 'rtl']) for (const orientation of ['horizontal', 'vertical']) {
    const vertical = orientation === 'vertical';
    await tabs.evaluate(async (element, attrs) => {
      element.setAttribute('dir', attrs.dir); element.setAttribute('orientation', attrs.orientation);
      await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    }, { dir, orientation });
    await native.evaluate((element, attrs) => {
      element.setAttribute('dir', attrs.dir); element.setAttribute('data-orientation', attrs.orientation);
      element.querySelector('[role="tablist"]')!.setAttribute('aria-orientation', attrs.orientation);
    }, { dir, orientation });
    const edge = vertical ? 'inline' : 'block', opposite = vertical ? 'block' : 'inline';
    const expectedPanel = { 'padding-block-start': vertical ? 0 : 32, 'padding-block-end': vertical ? 0 : 32,
      'padding-inline-start': vertical ? 32 : 0, 'padding-inline-end': vertical ? 32 : 0 };
    for (const entry of [
      { kind: 'custom', owner: customTab, tab: part(customTab, 'base'), list: part(tabs, 'tab-list'), panelOwner: customPanel, panel: part(customPanel, 'base'), reference: part(page.locator('#wa-isolated-custom-panel'), 'base') },
      { kind: 'native', owner: nativeTab, tab: nativeTab, list: native.getByRole('tablist'), panelOwner: nativePanel, panel: nativePanel, reference: page.locator('#wa-isolated-native-panel') },
    ]) {
      await expect(entry.owner).toHaveAttribute('aria-selected', 'true');
      const list = await metrics(entry.list, { gap: 0, [`border-${edge}-end-width`]: 2, [`border-${edge}-end-color`]: rail, [`border-${opposite}-end-width`]: 0 });
      const selected = await metrics(entry.tab, { color: selectedInk, [`border-${edge}-end-width`]: 2, [`border-${edge}-end-color`]: indicator, [`margin-${edge}-end`]: -2, [`border-${opposite}-end-width`]: 0 });
      const panel = await metrics(entry.panel, expectedPanel);
      await entry.owner.hover();
      await metrics(entry.tab, { color: selectedInk });
      await page.mouse.move(0, 0);
      if (vertical) {
        await metrics(entry.list, { [dir === 'rtl' ? 'border-left-width' : 'border-right-width']: 2 });
        await metrics(entry.tab, { [dir === 'rtl' ? 'border-left-color' : 'border-right-color']: indicator });
        await metrics(entry.panel, { 'padding-left': 32, 'padding-right': 32 });
      }
      // Source defaults must stay beneath public local customization hooks.
      await entry.owner.evaluate(element => {
        const target = element as HTMLElement;
        target.style.setProperty('--en-tab-indicator-color', 'rgb(17, 34, 51)');
        target.style.setProperty('--en-tab-selected-color', 'rgb(102, 51, 119)');
        target.style.setProperty('--en-control-inline-padding', '23px');
      });
      await metrics(entry.tab, { color: localSelectedInk, [`border-${edge}-end-color`]: localIndicator, 'padding-inline-start': 23, 'padding-inline-end': 23 });
      await entry.owner.evaluate(element => {
        const target = element as HTMLElement;
        target.style.removeProperty('--en-tab-indicator-color'); target.style.removeProperty('--en-tab-selected-color'); target.style.removeProperty('--en-control-inline-padding');
      });
      await metrics(entry.tab, { color: selectedInk, [`border-${edge}-end-color`]: indicator });
      // A full child theme on the panel defeats even the outer vertical
      // context selector. Compare with an independently placed identical theme.
      const isolated = await style(entry.reference, panelProperties);
      await entry.panelOwner.evaluate(element => { element.setAttribute('data-en-theme', 'wa-tabs-isolation'); });
      expect(await style(entry.panel, panelProperties), `${entry.kind} ${dir} ${orientation}: child theme owns panel padding`).toEqual(isolated);
      await entry.panelOwner.evaluate(element => element.removeAttribute('data-en-theme'));
      await metrics(entry.panel, expectedPanel);
      observations[`${entry.kind}-${dir}-${orientation}`] = { list, selected, panel, isolated };
    }
  }
  await evidence(info, `web-awesome-inspired-${appearance}-tabs`, specimen(page), {
    source: '@awesome.me/webawesome 3.13.0 tab-group.styles / tab-panel.styles', rail, indicator, selectedInk, observations,
    limits: 'The En Reve vertical outer layout and wrapped tab list remain adaptations; this checks public rail, indicator and panel presentation.',
  });
}


async function fluentMenuWidths(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  await open(page, 'command-surfaces', 'fluent-inspired', appearance, css);
  await nativeStyles(page, info, ['commands']); await mountExportedCSS(page, css);
  // Independent pinned React Menu 9.25.4 MenuPopover source: max-content,
  // min-width 138px, max-width 300px. The local viewport clamp is retained.
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: 1000, height: 900 });
  await specimen(page).evaluate(element => {
    const fixture = document.createElement('section'); fixture.id = 'fluent-menu-widths'; fixture.className = 'en-foundation';
    fixture.style.cssText = 'position:fixed;inset-block-start:16px;inset-inline-start:8px;inline-size:calc(100vw - 16px);z-index:1;';
    const labels = { short: 'Cut', middle: 'Manage library settings', long: 'Manage shared library permissions and review every workspace member' };
    for (const [id, label] of Object.entries(labels)) {
      const group = document.createElement('div');
      group.innerHTML = `<button id="fluent-${id}-trigger" aria-label="Open Fluent ${id} menu">Menu</button><en-menu id="fluent-${id}-menu" for="fluent-${id}-trigger" label="Fluent ${id} menu"><en-menu-item>${label}</en-menu-item></en-menu><div id="fluent-${id}-native" class="en-menu" role="menu" aria-label="Native Fluent ${id} menu"><button class="en-menu-item" role="menuitem"><span class="en-menu-item-label">${label}</span></button></div>`;
      // Portable helpers supply presentation; this native consumer explicitly
      // owns ordinary layout/visibility, without supplying private popup state.
      (group.querySelector('.en-menu') as HTMLElement).style.cssText = 'position:static;visibility:visible;';
      fixture.append(group);
    }
    const branch = document.createElement('div'); branch.id = 'fluent-menu-branch';
    branch.innerHTML = `<button id="fluent-root-trigger">Root</button><en-menu id="fluent-root-menu" for="fluent-root-trigger" label="Fluent replacement root"><en-menu-item id="fluent-child-trigger">${labels.long}</en-menu-item><en-menu id="fluent-child-menu" for="fluent-child-trigger" label="Fluent replacement child"><en-menu-item>Child command</en-menu-item></en-menu></en-menu>`;
    fixture.append(branch); element.append(fixture);
  });
  await settled(page);
  const fixture = page.locator('#fluent-menu-widths');
  const observations: Record<string, unknown> = {};
  const surface = (id: string) => part(page.locator(`#fluent-${id}-menu`), 'surface');
  const native = (id: string) => page.locator(`#fluent-${id}-native`);
  const geometry = (target: Locator) => target.evaluate(element => {
    const bounds = element.getBoundingClientRect(), viewport = window.visualViewport;
    return { x: bounds.x, y: bounds.y, right: bounds.right, width: bounds.width, client: element.clientWidth, scroll: element.scrollWidth,
      viewportLeft: viewport?.offsetLeft ?? 0, viewportRight: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? innerWidth) };
  });
  const width = async (target: Locator, expected: number, message: string) => {
    await expect(target).toBeVisible();
    await expect.poll(async () => (await geometry(target)).width, message).toBeCloseTo(expected, 1);
    return geometry(target);
  };
  const show = async (id: string) => {
    const trigger = page.locator(`#fluent-${id}-trigger`), host = page.locator(`#fluent-${id}-menu`);
    await expect(host).toHaveJSProperty('open', false); await expect(surface(id)).not.toBeVisible();
    await trigger.click(); await expect(host).toHaveJSProperty('open', true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true'); await expect(surface(id)).toBeVisible();
    await expect(host.locator(':scope > en-menu-item').first().getByRole('menuitem')).toBeFocused();
    return surface(id);
  };
  const hide = async (id: string) => {
    await page.keyboard.press('Escape'); await expect(page.locator(`#fluent-${id}-menu`)).toHaveJSProperty('open', false);
    await expect(surface(id)).not.toBeVisible(); await expect(page.locator(`#fluent-${id}-trigger`)).toBeFocused();
    await expect(page.locator(`#fluent-${id}-trigger`)).toHaveAttribute('aria-expanded', 'false');
  };
  try {
    for (const [id, expected] of [['short', 138], ['long', 300]] as const) {
      observations[`${id}-native`] = await width(native(id), expected, `Native ${id}: literal source width`);
      observations[`${id}-custom`] = await width(await show(id), expected, `Custom ${id}: literal source width`);
      await hide(id);
    }
    // A third length rejects a fixed-width implementation that merely switches
    // between the minimum and maximum cases.
    const middle = await show('middle');
    for (const [kind, target] of [['custom', middle], ['native', native('middle')]] as const) {
      const measured = await geometry(target);
      expect(measured.width, `${kind}: max-content above source minimum`).toBeGreaterThan(138);
      expect(measured.width, `${kind}: max-content below source maximum`).toBeLessThan(300);
      observations[`middle-${kind}`] = measured;
    }
    await hide('middle');
    for (const cap of [240, 110]) {
      for (const target of [page.locator('#fluent-long-menu'), native('long')]) {
        await target.evaluate((element, cap) => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', `${cap}px`), cap);
      }
      observations[`local-cap-${cap}`] = {
        native: await width(native('long'), cap, 'Native public overlay cap also bounds the source minimum'),
        custom: await width(await show('long'), cap, 'Custom public overlay cap also bounds the source minimum'),
      };
      await hide('long');
    }
    for (const target of [page.locator('#fluent-long-menu'), native('long')]) {
      await target.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'));
    }
    await fixture.evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '360px'));
    observations.inheritedCap = {
      native: await width(native('long'), 360, 'Inherited native overlay cap supersedes source maximum'),
      custom: await width(await show('long'), 360, 'Inherited custom overlay cap supersedes source maximum'),
    };
    await hide('long');
    await fixture.evaluate(element => (element as HTMLElement).style.removeProperty('--en-overlay-max-inline-size'));
    await width(native('long'), 300, 'Removing inherited override restores native source maximum');
    await width(await show('long'), 300, 'Reopening restores custom source maximum'); await hide('long');

    for (const viewportWidth of [260, 120]) {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      for (const id of ['short', 'long']) {
        const custom = await show(id);
        for (const [kind, target] of [['custom', custom], ['native', native(id)]] as const) {
          await expect.poll(async () => (await geometry(target)).right, `${kind}: right edge fits narrow visual viewport`).toBeLessThanOrEqual(viewportWidth + 1);
          const measured = await geometry(target);
          expect(measured.width, `${kind}: menu remains usable`).toBeGreaterThan(0);
          expect(measured.x, `${kind}: left edge fits visual viewport`).toBeGreaterThanOrEqual(measured.viewportLeft - 1);
          expect(measured.right, `${kind}: no horizontal viewport escape`).toBeLessThanOrEqual(measured.viewportRight + 1);
          expect(measured.width, `${kind}: viewport limit takes precedence over source ceiling`).toBeLessThan(300);
          if (viewportWidth === 120) expect(measured.width, `${kind}: viewport limit takes precedence over source minimum`).toBeLessThan(138);
          expect(measured.scroll, `${kind}: content wraps inside constrained menu`).toBeLessThanOrEqual(measured.client + 1);
          observations[`${viewportWidth}-${id}-${kind}`] = measured;
        }
        await hide(id);
      }
    }

    // At 480px, a 360px parent cannot deliver two panels. Its replacement child
    // must preserve the measured parent width, not the new normal-menu 300px cap.
    await page.setViewportSize({ width: 480, height: 900 });
    await page.locator('#fluent-menu-branch').evaluate(element => (element as HTMLElement).style.setProperty('--en-overlay-max-inline-size', '360px'));
    const root = await show('root'), parent = await width(root, 360, 'Root public override before replacement');
    const childHost = page.locator('#fluent-child-menu'), child = surface('child');
    const submenuTrigger = page.locator('#fluent-child-trigger').getByRole('menuitem');
    await submenuTrigger.click(); await expect(childHost).toHaveJSProperty('open', true);
    const back = childHost.getByRole('menuitem', { name: 'Back', exact: true }); await expect(back).toBeVisible();
    const replacement = await width(child, 360, 'Replacement retains parent geometry above normal source cap');
    expect(replacement.x, 'Replacement occupies its parent inline position').toBeCloseTo(parent.x, 1);
    expect(replacement.y, 'Replacement occupies its parent block position').toBeCloseTo(parent.y, 1);
    await metrics(child, { 'min-inline-size': 0 });
    await back.click(); await expect(childHost).toHaveJSProperty('open', false);
    await expect(submenuTrigger).toBeFocused(); await expect(page.locator('#fluent-root-menu')).toHaveJSProperty('open', true);
    await width(root, 360, 'Back restores the root without changing its width');
    observations.replacement = { parent, replacement }; await hide('root');
    await page.setViewportSize({ width: 1000, height: 900 });
    await show('long');
    await evidence(info, `fluent-inspired-${appearance}-menu-width`, surface('long'), {
      source: '@fluentui/react-menu 9.25.4 useMenuPopoverStyles.ts:13–16', minimum: 138, maximum: 300, observations,
      limits: 'Native helpers exercise authored static layout; custom elements exercise the real popup lifecycle and viewport/replacement placement. Native consumer interaction and manual assistive technology are outside this geometry check.',
    });
    await hide('long');
  } finally { await page.setViewportSize(viewport); }
}


async function sourceSliders(page: Page, theme: Theme, appearance: Appearance, css: string, info: TestInfo) {
  const reference = sliderReference(theme, appearance), backdrop = [250, 0, 250];
  await open(page, 'opacity', theme, appearance, css);
  await nativeStyles(page, info); await mountExportedCSS(page, css);
  const host = specimen(page).locator('en-slider'), input = host.getByRole('slider');
  await host.evaluate(async element => {
    const slider = element as HTMLElement & { value: number; updateComplete: Promise<unknown> };
    slider.value = 50; slider.style.background = 'rgb(250, 0, 250)'; await slider.updateComplete;
  });
  await specimen(page).evaluate(element => {
    const native = document.createElement('label'); native.id = 'native-source-slider'; native.className = 'en-foundation';
    native.style.cssText = 'display:block;background:rgb(250,0,250)';
    // The native author supplies the documented paint state for this stationary
    // half-value fixture. Explicit synchronization has separate owning tests.
    native.innerHTML = 'Native source range<input class="en-range" type="range" min="0" max="100" value="50" style="--en-slider-value-percent:50%">';
    element.append(native);
  });
  const native = page.locator('#native-source-slider input');
  const opaque = (color: RGBA) => color.slice(0, 3).map((channel, index) => channel * color[3] + backdrop[index] * (1 - color[3]));
  const wanted = { rail: opaque(reference.rail), fill: opaque(reference.fill), thumb: [reference.thumb, ...reference.rims].map(opaque), backdrop };
  const observations: Record<string, unknown> = {};
  for (const [index, size] of ['small', 'medium', 'large'].entries()) {
    await host.evaluate(async (element, size) => { element.setAttribute('size', size); await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; }, size);
    await page.locator('#native-source-slider').evaluate((element, size) => element.setAttribute('data-size', size), size);
    const [trackSize, thumbSize] = reference.sizes[index];
    for (const [kind, control] of [['custom', input], ['native', native]] as const) {
      await control.blur(); await page.mouse.move(0, 0);
      const png = await control.screenshot({ scale: 'css', animations: 'disabled' });
      await info.attach(`${theme}-${appearance}-${size}-${kind}-slider`, { body: png, contentType: 'image/png' });
      // Native range pseudo-element computed styles differ by engine. Sample
      // rendered source paint; the diagnostic backdrop also distinguishes white
      // and dark thumb plates from a matching application canvas.
      const pixels = await page.evaluate(async ({ png, wanted, fluentThumbSize, spectrumThumb, webAwesomeThumbSize }) => {
        const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
        const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixel = (x: number, y: number) => Array.from(data.slice((Math.floor(y) * width + Math.floor(x)) * 4, (Math.floor(y) * width + Math.floor(x)) * 4 + 3));
        const matches = (pixel: number[], color: number[]) => pixel.every((value, index) => Math.abs(value - color[index]) <= 3);
        const colorError = (actual: number[], source: number[]) => Math.max(...actual.map((value, index) => Math.abs(value - source[index])));
        // Distance to a convex blend of source paints. Fractional ring edges
        // may mix center, perimeter and surface; only the two outside rows may
        // additionally mix with the diagnostic backdrop. This accepts raster
        // antialiasing without accepting arbitrary non-backdrop colors.
        const blendError = (actual: number[], colors: number[][]) => {
          const sub = (a: number[], b: number[]) => a.map((value, index) => value - b[index]);
          const dot = (a: number[], b: number[]) => a.reduce((sum, value, index) => sum + value * b[index], 0);
          const determinant = (a: number[], b: number[], c: number[]) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
          if (colors.length === 4) {
            const [a, b, c, d] = colors, ab = sub(b, a), ac = sub(c, a), ad = sub(d, a), ap = sub(actual, a);
            const denominator = determinant(ab, ac, ad);
            if (Math.abs(denominator) > 1e-6) {
              const weights = [determinant(ap, ac, ad), determinant(ab, ap, ad), determinant(ab, ac, ap)].map(value => value / denominator);
              if (weights.every(value => value >= 0) && weights.reduce((sum, value) => sum + value, 0) <= 1) return 0;
            }
          }
          let error = Infinity;
          for (let i = 0; i < colors.length; i++) for (let j = i + 1; j < colors.length; j++) {
            const a = colors[i], ab = sub(colors[j], a), ap = sub(actual, a), aa = dot(ab, ab);
            const fraction = Math.max(0, Math.min(1, dot(ap, ab) / (aa || 1)));
            error = Math.min(error, colorError(actual, a.map((value, index) => value + fraction * ab[index])));
            for (let k = j + 1; k < colors.length; k++) {
              const ac = sub(colors[k], a), bb = dot(ab, ac), cc = dot(ac, ac), dd = dot(ap, ab), ee = dot(ap, ac), denominator = aa * cc - bb * bb;
              if (Math.abs(denominator) < 1e-6) continue;
              const u = (cc * dd - bb * ee) / denominator, v = (aa * ee - bb * dd) / denominator;
              if (u >= 0 && v >= 0 && u + v <= 1) error = Math.min(error, colorError(actual, a.map((value, index) => value + u * ab[index] + v * ac[index])));
            }
          }
          return error;
        };
        let trackHeight = 0, thumbHeight = 0;
        const thumbRows: number[] = [];
        for (let y = 0; y < height; y++) {
          if (!matches(pixel(width * .75, y), wanted.backdrop)) trackHeight++;
          if (fluentThumbSize || spectrumThumb || webAwesomeThumbSize
            ? !matches(pixel(width / 2, y), wanted.backdrop)
            : wanted.thumb.some(color => matches(pixel(width / 2, y), color))) { thumbHeight++; thumbRows.push(y); }
        }
        let fluentPaint: { centerError: number; upperRimError: number; lowerRimError: number; antialiasError: number; upperPerimeterEvidence: number; lowerPerimeterEvidence: number } | undefined;
        if (fluentThumbSize) {
          const first = thumbRows[0], last = thumbRows[thumbRows.length - 1];
          // Pinned Fluent rim occupies the outer 20% of the diameter. Require
          // the exact surface color on both sides as well as the exact center;
          // matching the diameter alone cannot establish source thumb paint.
          const band = Math.ceil(fluentThumbSize * .2), rim = wanted.thumb[wanted.thumb.length - 1];
          const rimError = (start: number, direction: number) => Math.min(...Array.from({ length: band }, (_, index) => colorError(pixel(width / 2, start + index * direction), rim)));
          // Require the neutral outline to contribute on BOTH sides. A thumb
          // painted only with center + surface can otherwise satisfy the full
          // palette hull. Inspect the source outer 10% edge band, permitting
          // backdrop AA, and require evidence beyond that incomplete palette.
          const edgeBand = Math.ceil(fluentThumbSize * .1), withoutPerimeter = [wanted.thumb[0], rim, wanted.backdrop];
          const perimeterEvidence = (start: number, direction: number) => Math.max(...Array.from({ length: edgeBand }, (_, index) => blendError(pixel(width / 2, start + index * direction), withoutPerimeter)));
          fluentPaint = {
            centerError: colorError(pixel(width / 2, height / 2), wanted.thumb[0]),
            upperRimError: thumbRows.length ? rimError(first, 1) : Infinity,
            lowerRimError: thumbRows.length ? rimError(last, -1) : Infinity,
            antialiasError: thumbRows.length ? Math.max(...thumbRows.map(y => blendError(pixel(width / 2, y), y === first || y === last ? [...wanted.thumb, wanted.backdrop] : wanted.thumb))) : Infinity,
            upperPerimeterEvidence: thumbRows.length ? perimeterEvidence(first, 1) : 0,
            lowerPerimeterEvidence: thumbRows.length ? perimeterEvidence(last, -1) : 0,
          };
        }
        let spectrumPaint: { centerError: number; upperBorderError: number; lowerBorderError: number; antialiasError: number; contiguous: boolean } | undefined;
        if (spectrumThumb) {
          const first = thumbRows[0], last = thumbRows[thumbRows.length - 1], border = wanted.thumb[1];
          // Spectrum's 2px border has antialiased edges against both the plate
          // and backdrop. Exact-palette counting drops four rows from its 18px
          // small thumb. Measure the painted extent, then require the source
          // plate and both borders. Only the outside row may mix backdrop;
          // only each 2px border plus one inner AA row may mix border/plate.
          // The remaining core must be exact source plate throughout.
          const borderError = (start: number, direction: number) => Math.min(...Array.from({ length: 2 }, (_, index) => colorError(pixel(width / 2, start + index * direction), border)));
          spectrumPaint = {
            centerError: colorError(pixel(width / 2, height / 2), wanted.thumb[0]),
            upperBorderError: thumbRows.length ? borderError(first, 1) : Infinity,
            lowerBorderError: thumbRows.length ? borderError(last, -1) : Infinity,
            antialiasError: thumbRows.length ? Math.max(...thumbRows.map(y => y === first || y === last
              ? blendError(pixel(width / 2, y), [border, wanted.backdrop])
              : y - first < 3 || last - y < 3
                ? blendError(pixel(width / 2, y), wanted.thumb)
                : colorError(pixel(width / 2, y), wanted.thumb[0]))) : Infinity,
            contiguous: thumbRows.length > 0 && thumbRows.length === last - first + 1,
          };
        }
        let webAwesomePaint: { centerError: number; antialiasError: number; upperRimEvidence: number; lowerRimEvidence: number; contiguous: boolean } | undefined;
        if (webAwesomeThumbSize) {
          const first = thumbRows[0], last = thumbRows[thumbRows.length - 1];
          // Web Awesome 3.13 has a shadowless 1.4em thumb with a 0.125em
          // surface-colored border. Native range rasterization can blend every
          // border row, so measuring only exact source colors understates its
          // diameter. Count the painted span, but independently require the
          // exact center and source-palette AA. Both rims must contribute paint
          // beyond a center + backdrop blend; an all-blue disk cannot pass.
          const edgeBand = Math.ceil(webAwesomeThumbSize * .125 / 1.4);
          // Restrict mixed paint to the source border and one inner AA row;
          // every remaining core pixel must retain the exact source blue.
          const innerBand = edgeBand + 1;
          const withoutRim = [wanted.thumb[0], wanted.backdrop];
          const rimEvidence = (start: number, direction: number) => Math.max(...Array.from({ length: edgeBand }, (_, index) => blendError(pixel(width / 2, start + index * direction), withoutRim)));
          webAwesomePaint = {
            centerError: colorError(pixel(width / 2, height / 2), wanted.thumb[0]),
            antialiasError: thumbRows.length ? Math.max(...thumbRows.map(y => y === first || y === last
              ? blendError(pixel(width / 2, y), [...wanted.thumb, wanted.backdrop])
              : y - first < innerBand || last - y < innerBand
                ? blendError(pixel(width / 2, y), wanted.thumb)
                : colorError(pixel(width / 2, y), wanted.thumb[0]))) : Infinity,
            upperRimEvidence: thumbRows.length ? rimEvidence(first, 1) : 0,
            lowerRimEvidence: thumbRows.length ? rimEvidence(last, -1) : 0,
            contiguous: thumbRows.length > 0 && thumbRows.length === last - first + 1,
          };
        }
        return { width, height, fill: pixel(width / 4, height / 2), rail: pixel(width * .75, height / 2), trackHeight, thumbHeight, fluentPaint, spectrumPaint, webAwesomePaint };
      }, { png: png.toString('base64'), wanted, fluentThumbSize: theme === 'fluent-inspired' ? thumbSize : 0, spectrumThumb: theme === 'spectrum-inspired', webAwesomeThumbSize: theme === 'web-awesome-inspired' ? thumbSize : 0 });
      const label = `${theme} ${appearance} ${size} ${kind}`;
      for (const paint of ['rail', 'fill'] as const) wanted[paint].forEach((channel, index) => expect(Math.abs(pixels[paint][index] - channel), `${label} ${paint} channel ${index}`).toBeLessThanOrEqual(3));
      expect(Math.abs(pixels.trackHeight - trackSize), `${label} visible track thickness`).toBeLessThanOrEqual(1.25);
      expect(Math.abs(pixels.thumbHeight - thumbSize), `${label} visible thumb diameter excluding outer shadows`).toBeLessThanOrEqual(2);
      if (theme === 'fluent-inspired') {
        expect(pixels.fluentPaint, `${label} independent scalar thumb paint evidence`).toBeDefined();
        for (const region of ['centerError', 'upperRimError', 'lowerRimError', 'antialiasError'] as const) {
          expect(pixels.fluentPaint![region], `${label} source ${region}`).toBeLessThanOrEqual(3);
        }
        for (const edge of ['upperPerimeterEvidence', 'lowerPerimeterEvidence'] as const) {
          expect(pixels.fluentPaint![edge], `${label} source neutral ${edge}`).toBeGreaterThan(3);
        }
      }
      if (theme === 'spectrum-inspired') {
        expect(pixels.spectrumPaint, `${label} independent scalar thumb paint evidence`).toBeDefined();
        expect(pixels.spectrumPaint!.contiguous, `${label} contiguous thumb diameter`).toBe(true);
        for (const region of ['centerError', 'upperBorderError', 'lowerBorderError', 'antialiasError'] as const) {
          expect(pixels.spectrumPaint![region], `${label} source ${region}`).toBeLessThanOrEqual(3);
        }
      }
      if (theme === 'web-awesome-inspired') {
        expect(pixels.webAwesomePaint, `${label} independent scalar thumb paint evidence`).toBeDefined();
        expect(pixels.webAwesomePaint!.contiguous, `${label} contiguous thumb diameter`).toBe(true);
        for (const region of ['centerError', 'antialiasError'] as const) {
          expect(pixels.webAwesomePaint![region], `${label} source ${region}`).toBeLessThanOrEqual(3);
        }
        for (const edge of ['upperRimEvidence', 'lowerRimEvidence'] as const) {
          expect(pixels.webAwesomePaint![edge], `${label} source surface ${edge}`).toBeGreaterThan(3);
        }
      }
      expect(pixels.height, `${label} protected pointer target`).toBeGreaterThanOrEqual(24);
      observations[`${size}-${kind}`] = pixels;
    }
  }
  await page.goto('/component-patterns?progress-report');
  const interval = page.locator('#fields en-range-slider'); await expect(interval.getByRole('slider').first()).toBeVisible();
  await mountExportedCSS(page, css);
  await interval.evaluate(({ dataset }, attrs) => { dataset.enTheme = attrs.theme; dataset.enAppearance = attrs.appearance; }, { theme, appearance });
  for (const [index, size] of ['small', 'medium', 'large'].entries()) {
    await interval.evaluate(async (element, size) => { element.setAttribute('size', size); await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; }, size);
    await page.mouse.move(0, 0);
    const [trackSize, thumbSize] = reference.sizes[index];
    await metrics(part(interval, 'track'), { height: trackSize }, '::before');
    await metrics(part(interval, 'range'), { height: trackSize });
    expectPaint((await style(part(interval, 'track'), ['background-color'], '::before'))['background-color'], reference.rail);
    expectPaint((await style(part(interval, 'range'), ['background-color']))['background-color'], reference.fill);
    for (const name of ['lower-thumb', 'upper-thumb']) {
      const thumb = part(interval, name);
      await metrics(thumb, { width: thumbSize, height: thumbSize }, '::before');
      expectPaint((await style(thumb, ['background-color'], '::before'))['background-color'], reference.thumb);
      expect((await thumb.boundingBox())!.height, 'Interval pointer target stays independent of source paint').toBeGreaterThanOrEqual(44);
    }
  }
  // Keep the transparent interval's source paint intact. Its isolated dark
  // boundary needs an application canvas beneath it for a readable capture.
  const captureContext = await interval.evaluate(element => {
    const backdrop = document.createElement('div'); backdrop.id = 'source-interval-canvas';
    backdrop.style.backgroundColor = getComputedStyle(element).getPropertyValue('--en-color-canvas').trim();
    element.before(backdrop); backdrop.append(element);
    return { appearance: element.getAttribute('data-en-appearance'), background: getComputedStyle(backdrop).backgroundColor };
  });
  await evidence(info, `${theme}-${appearance}-source-interval`, interval, { reference, scalarRaster: observations, captureContext, nativePaintState: 'Explicit stationary --en-slider-value-percent:50%; synchronization is covered by the slider owning suite.' });
}


// Astryx Tokenizer composes shared inputWrapperStyles in both its ordinary and
// layer-placeholder frames (pinned source Tokenizer.tsx:952,1071). Test the
// corresponding public editing surface independently of form-associated inputs.
for (const appearance of ['light', 'dark'] as const) {
  test(`astryx-inspired ${appearance}: Tokenizer inset reaches an enabled token editor and preserves focus and editing`, async ({ page, exportedCSS }, info) => {
    await page.goto('/component-patterns?progress-report');
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
    await mountExportedCSS(page, exportedCSS['astryx-inspired']);
    await page.evaluate(async appearance => {
      // This production page explicitly registers the full public catalogue.
      await customElements.whenDefined('en-token-editor');
      const region = document.createElement('section');
      region.id = 'astryx-tokenizer-fidelity'; region.className = 'en-foundation';
      region.dataset.enTheme = 'astryx-inspired'; region.dataset.enAppearance = appearance;
      region.style.cssText = 'background:var(--en-color-canvas);padding:24px';
      const editor = document.createElement('en-token-editor');
      editor.setAttribute('label', 'Source Tokenizer field');
      // Explicit public focus hooks make halo composition independently visible.
      editor.style.cssText = '--en-input-focus-halo-width:3px;--en-input-focus-halo-color:rgba(12,80,130,.25)';
      region.append(editor); document.body.append(region);
      await (editor as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
      await document.fonts.ready;
    }, appearance);
    const host = page.locator('#astryx-tokenizer-fidelity en-token-editor');
    const control = part(host, 'control');
    await expect(control).toHaveRole('textbox');
    await expect(control).toBeEditable();
    await expect(control).toHaveAttribute('aria-disabled', 'false');
    // This control deliberately has no native validity state. A blanket :valid
    // guard would silently exclude it even after adding the finite target.
    expect(await host.evaluate(element => element.matches(':valid'))).toBe(false);
    const hover: RGBA = appearance === 'light' ? [204, 211, 219, .3] : [73, 77, 83, .3];
    const focus: RGBA = appearance === 'light' ? [21, 17, 12, .08] : [223, 226, 229, .14];
    const observations: Record<string, unknown> = {};
    async function sourceInset(color: RGBA, halo = false) {
      const boxShadow = (await style(control, ['box-shadow']))['box-shadow'];
      // Remove colors before splitting layers: rgb() may contain commas.
      // Accept browser color serialization, but assert every layer and length.
      const colors = boxShadow.match(/\b(?:rgba?|color)\([^()]*\)/g) ?? [];
      const layers = boxShadow.replace(/\b(?:rgba?|color)\([^()]*\)/g, '').split(',').map(layer => layer.trim().split(/\s+/));
      expect(colors).toHaveLength(halo ? 2 : 1);
      expect(layers).toHaveLength(halo ? 2 : 1);
      expect(layers[0]).toContain('inset');
      expect(layers[0].filter(value => value !== 'inset').map(parseFloat)).toEqual([0, 0, 0, 2]);
      expectPaint(colors[0]!, color);
      if (halo) {
        expect(layers[1]).not.toContain('inset');
        expect(layers[1].map(parseFloat)).toEqual([0, 0, 0, 3]);
        expectPaint(colors[1], [12, 80, 130, .25]);
      }
      return boxShadow;
    }
    await control.hover(); observations.hover = await sourceInset(hover);
    await control.focus(); await expect(control).toBeFocused();
    expect(await control.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    observations.focus = await sourceInset(focus, true);
    const contour = await style(control, ['outline-style', 'outline-width']);
    expect(contour['outline-style']).toBe('solid'); expect(parseFloat(contour['outline-width'])).toBeGreaterThan(0);
    // Pinned WebKit fill can return without input on this contenteditable;
    // use the established native-typing path and retain both commit assertions.
    await control.pressSequentially('Source field geometry preserves editing');
    await expect(control).toHaveText('Source field geometry preserves editing');
    await expect.poll(() => host.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe('Source field geometry preserves editing');
    await control.blur(); await page.mouse.move(0, 0);
    await host.evaluate(async element => {
      const editor = element as HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> };
      editor.disabled = true; await editor.updateComplete;
    });
    await expect(host).toHaveAttribute('disabled', '');
    await expect(control).toHaveAttribute('aria-disabled', 'true');
    await expect(control).not.toBeEditable();
    const disabledRest = (await style(control, ['box-shadow']))['box-shadow'];
    expect(disabledRest).not.toContain('inset');
    await control.hover();
    observations.disabledHover = (await style(control, ['box-shadow']))['box-shadow'];
    expect(observations.disabledHover).toBe(disabledRest);
    await host.evaluate(async element => {
      const editor = element as HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> };
      editor.disabled = false; await editor.updateComplete;
    });
    await expect(control).toBeEditable();
    observations.reenabledHover = await sourceInset(hover);
    await evidence(info, `astryx-inspired-${appearance}-tokenizer`, page.locator('#astryx-tokenizer-fidelity'), observations);
  });
}

// Independent pinned Button.tsx destructive outline and Card.tsx default inset.
for (const appearance of ['light', 'dark'] as const) {
  test(`astryx-inspired ${appearance}: destructive focus and border-inclusive card inset preserve public overrides`, async ({ page, exportedCSS }, info) => {
    await page.goto('/component-patterns?progress-report');
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
    await nativeStyles(page, info); await mountExportedCSS(page, exportedCSS['astryx-inspired']);
    await page.evaluate(async appearance => {
      await Promise.all(['en-button', 'en-card'].map(name => customElements.whenDefined(name)));
      const region = document.createElement('section');
      region.id = 'astryx-defaults-fidelity'; region.className = 'en-foundation';
      region.dataset.enTheme = 'astryx-inspired'; region.dataset.enAppearance = appearance;
      region.style.cssText = 'background:var(--en-color-canvas);padding:24px;display:grid;gap:24px';
      region.innerHTML = '<en-button variant="danger">Delete custom layer</en-button><button class="en-control en-button" data-variant="danger">Delete native layer</button><en-card>Custom source Card</en-card><section class="en-card">Native source Card</section>';
      document.body.append(region);
      await Promise.all([...region.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('en-button,en-card')].map(element => element.updateComplete));
      await document.fonts.ready;
    }, appearance);
    const region = page.locator('#astryx-defaults-fidelity');
    const buttonHosts = [region.locator('en-button'), region.locator(':scope > button.en-button')];
    const buttons = [buttonHosts[0].getByRole('button'), buttonHosts[1]];
    const cardHosts = [region.locator('en-card'), region.locator('section.en-card')];
    const cards = [part(cardHosts[0], 'base'), cardHosts[1]];
    const observations: Record<string, unknown> = {};
    const sourceFocus: RGBA = appearance === 'light' ? [227, 25, 59, 1] : [245, 57, 79, 1];
    // Establish keyboard modality before checking non-text action focus.
    await page.keyboard.press('Tab');
    for (const [index, button] of buttons.entries()) {
      await button.focus(); await expect(button).toBeFocused();
      expect(await button.evaluate(element => element.matches(':focus-visible'))).toBe(true);
      const baseline = await style(button, ['outline-color', 'outline-width', 'outline-style', 'outline-offset']);
      expectPaint(baseline['outline-color'], sourceFocus);
      expect(baseline['outline-style']).toBe('solid'); expect(parseFloat(baseline['outline-width'])).toBeGreaterThan(0);
      observations[`focus-${index}`] = baseline;
      await region.evaluate(element => (element as HTMLElement).style.setProperty('--en-button-focus-color', '#123456'));
      expectPaint((await style(button, ['outline-color']))['outline-color'], [18, 52, 86, 1]);
      await buttonHosts[index].evaluate(element => (element as HTMLElement).style.setProperty('--en-button-focus-color', '#654321'));
      expectPaint((await style(button, ['outline-color']))['outline-color'], [101, 67, 33, 1]);
      if (index === 0) {
        await button.evaluate(element => (element as HTMLElement).style.setProperty('--en-button-focus-color', '#345678'));
        expectPaint((await style(button, ['outline-color']))['outline-color'], [52, 86, 120, 1]);
        await button.evaluate(element => (element as HTMLElement).style.removeProperty('--en-button-focus-color'));
      }
      await buttonHosts[index].evaluate(element => (element as HTMLElement).style.removeProperty('--en-button-focus-color'));
      await region.evaluate(element => (element as HTMLElement).style.removeProperty('--en-button-focus-color'));
      expect(await style(button, ['outline-color', 'outline-width', 'outline-style', 'outline-offset'])).toEqual(baseline);
    }
    async function cardInset(border: number, padding: number) {
      for (const card of cards) {
        const measured = await style(card, ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left']);
        for (const side of ['top', 'right', 'bottom', 'left']) {
          expect(parseFloat(measured[`border-${side}-width`])).toBeCloseTo(border, 3);
          expect(parseFloat(measured[`padding-${side}`])).toBeCloseTo(padding, 3);
        }
      }
    }
    await cardInset(1, 15); observations.cardDefault = { border: 1, padding: 15, totalInset: 16 };
    // The public border token is also the actual core surface border source.
    await region.evaluate(element => (element as HTMLElement).style.setProperty('--en-border-width', '3px'));
    await cardInset(3, 13);
    await region.evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-padding', '9px'));
    await cardInset(3, 9);
    for (const host of cardHosts) await host.evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-padding', '11px'));
    await cardInset(3, 11);
    await cards[0].evaluate(element => (element as HTMLElement).style.setProperty('--en-surface-padding', '7px'));
    await metrics(cards[0], { 'padding-top': 7, 'padding-right': 7, 'padding-bottom': 7, 'padding-left': 7 });
    await cards[0].evaluate(element => (element as HTMLElement).style.removeProperty('--en-surface-padding'));
    for (const host of cardHosts) await host.evaluate(element => (element as HTMLElement).style.removeProperty('--en-surface-padding'));
    await region.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-border-width'); (element as HTMLElement).style.removeProperty('--en-surface-padding'); });
    await cardInset(1, 15);
    await evidence(info, `astryx-inspired-${appearance}-defaults`, region, observations);
  });
}

for (const theme of themes) for (const appearance of ['light', 'dark'] as const) {
  test(`${theme} ${appearance}: source choice, switch and field typography reaches custom and native controls`, async ({ page, exportedCSS }, info) => {
    const source = references[theme], css = exportedCSS[theme];
    await open(page, 'checkboxes-switches', theme, appearance, css);
    await nativeStyles(page, info); // Companions must follow portable base rules.
    await mountExportedCSS(page, css);
    await specimen(page).evaluate(element => {
      const native = document.createElement('section'); native.id = 'native-source-controls'; native.className = 'en-foundation';
      native.innerHTML = '<label class="en-choice"><input class="en-checkbox" type="checkbox" checked>Native checkbox</label><label class="en-choice"><input class="en-switch" type="checkbox" role="switch"><span>Native switch</span></label><label>Native field<input class="en-input en-text-input" value="Editable native value"></label>';
      element.append(native);
    });
    const checkbox = specimen(page).getByRole('checkbox', { name: 'Include source files', exact: true });
    const toggle = specimen(page).locator('en-switch').first().getByRole('switch');
    const native = page.locator('#native-source-controls');
    const observations: Record<string, unknown> = {};
    const nativeField = native.getByRole('textbox', { name: 'Native field', exact: true });
    observations.nativeField = theme === 'web-awesome-inspired'
      ? await webAwesomeInputTypography(nativeField, source.font, source.leading)
      : await metrics(nativeField, { 'font-size': source.font, 'line-height': source.leading });
    await nativeField.fill('A native helper remains editable'); await expect(nativeField).toHaveValue('A native helper remains editable');
    if (theme === 'fluent-inspired') {
      await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'native-helper-isolation', mode: 'light' }), { selector: '#native-helper-isolation', colorScheme: true }) });
      await native.evaluate(element => {
        const fields = document.createElement('section'); fields.id = 'native-fluent-text';
        fields.innerHTML = ['en-field', 'en-choice', 'en-choice-content'].map((kind, index) => `<div data-native-group="${kind}"><label class="en-label" for="native-fluent-input-${index}">${kind} label</label><input id="native-fluent-input-${index}" class="en-input" value="Input weight stays regular"><span class="en-description">Source helper text</span><span class="en-error">Source error text</span>${index === 0 ? '<span class="en-description" id="native-helper-isolation" data-en-theme="native-helper-isolation">A complete child theme owns this helper</span>' : ''}</div>`).join('');
        element.append(fields);
      });
      const fields = page.locator('#native-fluent-text'), isolated = page.locator('#native-helper-isolation');
      const isolatedBefore = await style(isolated, ['font-size', 'line-height', 'font-weight']);
      await fields.evaluate(element => { for (const group of element.querySelectorAll<HTMLElement>('[data-native-group]')) group.className = group.dataset.nativeGroup!; });
      for (const kind of ['en-field', 'en-choice', 'en-choice-content']) {
        const group = fields.locator(`[data-native-group="${kind}"]`);
        await metrics(group.locator(':scope > .en-label'), { 'font-weight': '400' });
        await metrics(group.locator(':scope > .en-input'), { 'font-size': 14, 'line-height': 20, 'font-weight': '400' });
        for (const text of [group.locator(':scope > .en-description:not([data-en-theme])'), group.locator(':scope > .en-error')]) {
          await metrics(text, { 'font-size': 12, 'line-height': 16, 'font-weight': '400' });
        }
        expect((await style(group.locator(':scope > .en-error'), ['color'])).color, 'Error retains semantic color while typography is refined').not.toBe((await style(group.locator(':scope > .en-description:not([data-en-theme])'), ['color'])).color);
      }
      expect(await style(isolated, ['font-size', 'line-height', 'font-weight']), 'An immediate helper with its own full theme keeps its typography').toEqual(isolatedBefore);
      observations.nativeFluentText = { isolatedBefore, helper: await style(fields.locator('.en-description:not([data-en-theme])').first(), ['font-size', 'line-height', 'font-weight']) };
    }
    for (const [name, choice] of [['custom', checkbox], ['native', native.getByRole('checkbox', { name: 'Native checkbox', exact: true })]] as const) {
      observations[`${name}-checkbox`] = await metrics(choice, { width: source.choice, height: source.choice });
      await choice.uncheck(); await expect(choice).not.toBeChecked(); await choice.check(); await expect(choice).toBeChecked();
      if (theme === 'fluent-inspired') {
        if (name === 'custom') await specimen(page).locator('en-checkbox').first().evaluate(element => { (element as HTMLElement & { indeterminate: boolean }).indeterminate = true; });
        else await choice.evaluate(element => { (element as HTMLInputElement).indeterminate = true; });
        observations[`${name}-mixed-mark`] = await metrics(choice, { width: 8, height: 8, 'border-radius': 2, transform: 'none' }, '::before');
      }
    }
    const originalSwitchDirections = await Promise.all([toggle, native.getByRole('switch')].map(async control => ({ control, direction: await control.getAttribute('dir') })));
    for (const [name, control] of [['custom', toggle], ['native', native.getByRole('switch')]] as const) {
      const [width, height, off, on] = source.switch;
      observations[`${name}-switch`] = await metrics(control, { width, height });
      await control.uncheck(); await expect(control).not.toBeChecked();
      observations[`${name}-thumb-off`] = await metrics(control, { width: off, height: off }, '::before');
      await control.check(); await expect(control).toBeChecked();
      observations[`${name}-thumb-on`] = await metrics(control, { width: on, height: on }, '::before');
      const edgeInsets = theme === 'spectrum-inspired' ? [4, 3] : theme === 'astryx-inspired' ? [4, 2] : theme === 'radix-inspired' ? [1, 1] : theme === 'fluent-inspired' ? [3, 3] : theme === 'shadcn-inspired' ? [2, 2] : [4, 4];
      // Compute the visible thumb's outside-edge distance, including the track
      // border. This catches the previous off-center size/inset combination.
      for (const dir of ['ltr', 'rtl']) {
        await control.evaluate((element, value) => { (element as HTMLElement).dir = value; }, dir);
        for (const checked of [false, true]) {
          await control.setChecked(checked);
          const geometry = await control.evaluate(element => {
            const frame = getComputedStyle(element), thumb = getComputedStyle(element, '::before');
            return { left: parseFloat(thumb.left) + parseFloat(frame.borderLeftWidth), top: parseFloat(thumb.top) + parseFloat(frame.borderTopWidth), width: parseFloat(thumb.width), height: parseFloat(thumb.height) };
          });
          const atLeft = checked ? dir === 'rtl' : dir === 'ltr';
          expect(geometry.top + geometry.height / 2).toBeCloseTo(height / 2, 1);
          expect(atLeft ? geometry.left : width - geometry.left - geometry.width).toBeCloseTo(edgeInsets[Number(checked)], 1);
        }
      }
    }
    if (theme === 'spectrum-inspired') {
      const checkboxHost = specimen(page).locator('en-checkbox').first(), switchHost = specimen(page).locator('en-switch').first();
      for (const [size, choiceSize, width, height, off, on] of [['small', 14, 26 * 12 / 14, 14, 6, 8], ['large', 18, 26 * 16 / 14, 18, 10, 12]] as const) {
        await checkboxHost.evaluate((element, value) => element.setAttribute('size', value), size);
        await switchHost.evaluate((element, value) => element.setAttribute('size', value), size);
        await native.evaluate((element, value) => element.setAttribute('data-size', value), size);
        // Source label weight stays regular across the existing size probes.
        for (const owner of [checkboxHost, switchHost]) await metrics(part(owner, 'label-text'), { 'font-weight': '400' });
        for (const choice of [checkbox, native.getByRole('checkbox', { name: 'Native checkbox', exact: true })]) await metrics(choice, { width: choiceSize, height: choiceSize });
        for (const control of [toggle, native.getByRole('switch')]) {
          await metrics(control, { width, height });
          await control.uncheck(); await metrics(control, { width: off, height: off }, '::before');
          await control.check(); await metrics(control, { width: on, height: on }, '::before');
        }
      }
      // The ancestor requests large; only explicitly opted-in components follow.
      await specimen(page).locator('.choice-stack').evaluate(element => { element.classList.add('en-foundation'); element.setAttribute('data-size', 'large'); });
      await checkboxHost.evaluate(element => element.setAttribute('size', 'inherit'));
      await switchHost.evaluate(element => element.setAttribute('size', 'inherit'));
      await metrics(checkbox, { width: 18 }); await metrics(toggle, { width: 26 * 16 / 14, height: 18 });
      await checkboxHost.evaluate(element => element.removeAttribute('size'));
      await metrics(checkbox, { width: 16 });
    }
    if (theme === 'shadcn-inspired') {
      const switchHost = specimen(page).locator('en-switch').first(), nativeSwitch = native.getByRole('switch');
      for (const [size, width, height, thumb] of [['small', 24, 16, 12], ['medium', 32, 20, 16], ['large', 32, 20, 16]] as const) {
        await switchHost.evaluate((element, value) => element.setAttribute('size', value), size);
        await native.evaluate((element, value) => element.setAttribute('data-size', value), size);
        for (const control of [toggle, nativeSwitch]) {
          await metrics(control, { width, height, 'border-top-width': 2 });
          for (const checked of [false, true]) {
            await control.setChecked(checked);
            await metrics(control, { width: thumb, height: thumb, 'background-color': checked
              ? appearance === 'light' ? 'rgb(250, 250, 250)' : 'rgb(23, 23, 23)'
              : appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(250, 250, 250)' }, '::before');
            if (checked) {
              const paint = await style(control, ['background-color', 'border-top-color']);
              expect(paint['border-top-color'], 'The checked source rim uses the selected track paint').toBe(paint['background-color']);
            }
          }
        }
      }
      // Local presentation hooks stay authoritative over the source recipe.
      for (const target of [switchHost, nativeSwitch]) await target.evaluate(element => {
        const style = (element as HTMLElement).style;
        style.setProperty('--en-switch-inline-size', '48px'); style.setProperty('--en-switch-block-size', '28px'); style.setProperty('--en-switch-thumb-size', '18px');
      });
      for (const control of [toggle, nativeSwitch]) {
        await metrics(control, { width: 48, height: 28 });
        for (const checked of [false, true]) { await control.setChecked(checked); await metrics(control, { width: 18, height: 18 }, '::before'); }
      }
      for (const target of [switchHost, nativeSwitch]) await target.evaluate(element => {
        const style = (element as HTMLElement).style;
        for (const property of ['--en-switch-inline-size', '--en-switch-block-size', '--en-switch-thumb-size']) style.removeProperty(property);
      });
    }
    if (theme === 'astryx-inspired') {
      const switchHost = specimen(page).locator('en-switch').first(), nativeSwitch = native.getByRole('switch');
      const tint: RGBA = appearance === 'light' ? [0, 0, 0, 1] : [255, 255, 255, 1];
      const overlay: RGBA = appearance === 'light' ? [5, 54, 89, 25 / 255] : [255, 255, 255, 25 / 255];
      const thumb: RGBA = appearance === 'light' ? [255, 255, 255, 1] : [31, 31, 34, 1];
      for (const [name, control, rowText, owner] of [
        ['custom', toggle, switchHost.getByText('Live preview', { exact: true }), switchHost],
        ['native', nativeSwitch, native.getByText('Native switch', { exact: true }), nativeSwitch],
      ] as const) {
        for (const checked of [false, true]) {
          await control.setChecked(checked); await page.mouse.move(0, 0);
          const resting: RGBA = checked ? appearance === 'light' ? [21, 17, 12, 1] : [223, 226, 229, 1]
            : appearance === 'light' ? [10, 19, 23, .2] : [102, 106, 114, 76 / 255];
          const hovered = mix(tint, resting, checked ? .15 : .05);
          expectPaint((await style(control, ['background-color']))['background-color'], resting);
          await control.hover(); const directHover = await style(control, ['background-color']);
          expectPaint(directHover['background-color'], hovered);
          await rowText.hover();
          // A labeled control can match :hover while its label is designated
          // (HTML's selector rules). Prove physical separation geometrically.
          const [rowBox, trackBox] = await Promise.all([rowText.boundingBox(), control.boundingBox()]);
          if (!rowBox || !trackBox) throw new Error('The associated text and visual switch must have visible boxes');
          const rowPoint = { x: rowBox.x + rowBox.width / 2, y: rowBox.y + rowBox.height / 2 };
          expect(rowPoint.x >= trackBox.x && rowPoint.x <= trackBox.x + trackBox.width
            && rowPoint.y >= trackBox.y && rowPoint.y <= trackBox.y + trackBox.height,
          'The associated text hover point is physically outside the visual track').toBe(false);
          await page.mouse.move(rowPoint.x, rowPoint.y);
          expect(await style(control, ['background-color']), 'The associated row and direct track receive the same source hover paint').toEqual(directHover);
          await hold(page, rowText, async () => {
            const heldTrack = (await style(control, ['background-color']))['background-color'];
            const heldThumb = (await style(control, ['background-color'], '::before'))['background-color'];
            expectPaint(heldTrack, over(overlay, hovered)); expectPaint(heldThumb, over(overlay, thumb));
            await evidence(info, `${theme}-${appearance}-${name}-${checked ? 'checked' : 'unchecked'}-row-held`, owner, { heldTrack, heldThumb, sourceExpected: { track: over(overlay, hovered), thumb: over(overlay, thumb) } });
          });
        }
        await owner.evaluate(element => { (element as HTMLElement & { disabled: boolean }).disabled = true; });
        await expect(control).toBeDisabled(); await page.mouse.move(0, 0);
        const disabledTrack = await style(control, ['background-color', 'border-top-color', 'opacity']);
        const disabledThumb = await style(control, ['background-color'], '::before');
        expect(disabledTrack.opacity).toBe('0.5');
        await rowText.hover(); expect(await style(control, ['background-color', 'border-top-color', 'opacity'])).toEqual(disabledTrack);
        await hold(page, rowText, async () => {
          expect(await style(control, ['background-color', 'border-top-color', 'opacity'])).toEqual(disabledTrack);
          expect(await style(control, ['background-color'], '::before')).toEqual(disabledThumb);
        });
        await owner.evaluate(element => { (element as HTMLElement & { disabled: boolean }).disabled = false; });
      }
    }
    // The geometry loop deliberately ends in RTL. Restore the original
    // attribute before the canonical choices picture, preserving every probe.
    for (const { control, direction } of originalSwitchDirections) await control.evaluate((element, direction) => {
      if (direction === null) element.removeAttribute('dir');
      else element.setAttribute('dir', direction);
    }, direction);
    observations.choiceCaptureDirections = await Promise.all(originalSwitchDirections.map(({ control }) => control.evaluate(element => getComputedStyle(element).direction)));
    await evidence(info, `${theme}-${appearance}-choices`, specimen(page), observations);
    await open(page, 'text-fields', theme, appearance, css);
    const host = specimen(page).locator('en-text-field').filter({ has: page.getByRole('textbox', { name: 'Project name', exact: true }) });
    const input = host.getByRole('textbox', { name: 'Project name', exact: true });
    observations.input = theme === 'web-awesome-inspired'
      ? await webAwesomeInputTypography(input, source.font, source.leading)
      : await metrics(input, { 'font-size': source.font, 'line-height': source.leading });
    await input.fill('Source typography retains native editing'); await expect(input).toHaveValue('Source typography retains native editing');
    if (theme === 'spectrum-inspired') {
      await metrics(input, { 'border-top-width': 2 });
      await metrics(specimen(page).getByRole('textbox', { name: 'Contact email', exact: true }), { 'border-top-width': 2 });
      const requiredHost = specimen(page).locator('en-text-field[label="Password"]'), required = requiredHost.locator('input');
      const neutral = appearance === 'light' ? 'rgb(19, 19, 19)' : 'rgb(242, 242, 242)';
      const danger = appearance === 'light' ? 'rgb(183, 40, 24)' : 'rgb(255, 103, 86)';
      // Native validity is already false for this pristine required field, but
      // appearance follows associated visible feedback, not :invalid alone.
      expect(await required.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
      await required.focus(); await expect(required).toBeFocused();
      await expect(requiredHost.locator('[part~="control-invalid"]')).toHaveCount(0);
      await metrics(required, { 'border-top-color': neutral });
      await requiredHost.evaluate(element => { (element as HTMLElement & { reportValidity(): boolean }).reportValidity(); });
      await expect(requiredHost.locator('[part~="control-invalid"]')).toHaveCount(1);
      await metrics(required, { 'border-top-color': danger });
      await required.fill('An accepted password');
      await expect(requiredHost.locator('[part~="control-invalid"]')).toHaveCount(0);
      await metrics(required, { 'border-top-color': neutral });
      // An authoritative application error produces the same visible state,
      // even when the native editor value satisfies its required constraint.
      await requiredHost.evaluate(element => { (element as HTMLElement & { error: string }).error = 'This password is unavailable'; });
      await expect(required).toHaveAttribute('aria-invalid', 'true');
      await expect(requiredHost.locator('[part~="control-invalid"]')).toHaveCount(1);
      await metrics(required, { 'border-top-color': danger });
      await expect(required).toHaveValue('An accepted password'); await expect(required).toBeFocused();
      await requiredHost.evaluate(element => { (element as HTMLElement & { error: string }).error = ''; });
      await expect(requiredHost.locator('[part~="control-invalid"]')).toHaveCount(0);
      await metrics(required, { 'border-top-color': neutral });
      observations.requiredFeedback = { neutral, danger, value: await required.inputValue() };
    }
    if (theme === 'fluent-inspired') {
      await metrics(part(host, 'label'), { 'font-weight': '400' });
      await metrics(part(host, 'description'), { 'font-size': 12, 'line-height': 16 });
      await input.blur(); await page.mouse.move(0, 0);
      observations.fieldRest = await metrics(input, { 'border-top-color': appearance === 'light' ? 'rgb(209, 209, 209)' : 'rgb(102, 102, 102)', 'border-bottom-color': appearance === 'light' ? 'rgb(97, 97, 97)' : 'rgb(173, 173, 173)' });
      await input.hover(); observations.fieldHover = await metrics(input, { 'border-top-color': appearance === 'light' ? 'rgb(199, 199, 199)' : 'rgb(117, 117, 117)', 'border-bottom-color': appearance === 'light' ? 'rgb(87, 87, 87)' : 'rgb(189, 189, 189)' });
    }
    if (theme === 'astryx-inspired') await metrics(part(host, 'description'), { 'font-size': 12, 'line-height': 20 });
    await evidence(info, `${theme}-${appearance}-fields`, specimen(page), observations);
    if (theme === 'spectrum-inspired') {
      await open(page, 'button-scale', theme, appearance, css);
      for (const [label, font, leading] of [['Small', 12, 16], ['Medium', 14, 18], ['Large', 16, 20]] as const) {
        await metrics(specimen(page).getByRole('button', { name: label, exact: true }), { 'font-size': font, 'line-height': leading });
      }
    }
    if (theme === 'spectrum-inspired' || theme === 'shadcn-inspired') {
      await open(page, 'radio-group', theme, appearance, css);
      const radio = specimen(page).getByRole('radio', { name: 'Highest quality', exact: true });
      await radio.check(); await expect(radio).toBeChecked();
      await metrics(radio, { width: 16, height: 16 });
      observations.radio = await metrics(radio, { width: theme === 'spectrum-inspired' ? 4 : appearance === 'light' ? 8 : 10 }, '::before');
      const selectedRadioPaint = await style(radio, ['background-color', 'border-top-color']);
      expect(selectedRadioPaint['background-color'], 'A selected source radio fills its outer ring').toBe(selectedRadioPaint['border-top-color']);
      await nativeStyles(page, info); await mountExportedCSS(page, css);
      await specimen(page).evaluate(element => {
        const label = document.createElement('label'); label.className = 'en-choice en-foundation';
        label.innerHTML = '<input class="en-radio" type="radio" name="native-source-radio" checked>Native source radio'; element.append(label);
      });
      const nativeRadio = specimen(page).getByRole('radio', { name: 'Native source radio', exact: true });
      await metrics(nativeRadio, { width: 16, height: 16 });
      observations.nativeRadio = await metrics(nativeRadio, { width: theme === 'spectrum-inspired' ? 4 : appearance === 'light' ? 8 : 10 }, '::before');
      await evidence(info, `${theme}-${appearance}-radio`, specimen(page), { radio: observations.radio, nativeRadio: observations.nativeRadio, selectedRadioPaint });
    }
    if (theme === 'astryx-inspired') {
      await open(page, 'family-geometry', theme, appearance, css);
      const segments = specimen(page).locator('en-segmented-control').first();
      await metrics(part(segments, 'options'), { 'padding-top': 2 });
      await segments.getByRole('radio', { name: 'Preview', exact: true }).focus(); await page.keyboard.press('Space');
      await expect(segments).toHaveJSProperty('value', 'preview');
      await metrics(part(segments, 'option-selected'), { 'font-weight': '600' });
      await expect.poll(async () => normalizeInvisibleShadow((await style(part(segments, 'option-selected'), ['box-shadow']))['box-shadow']), 'Selected segment retains visible elevation').not.toBe('none');
    }
    if (theme === 'web-awesome-inspired') await webAwesomeTextarea(page, appearance, css, info);
    await sourceSliders(page, theme, appearance, css, info);
    await toggleStates(page, theme, appearance, css, info);
  });

  test(`${theme} ${appearance}: source panels and selection states preserve real lifecycle`, async ({ page, exportedCSS }, info) => {
    test.setTimeout(120_000);
    const source = references[theme], css = exportedCSS[theme], observations: Record<string, unknown> = {};
    await sourceAlerts(page, theme, appearance, css, info);
    if (theme === 'web-awesome-inspired') {
      await webAwesomeAvatar(page, appearance, css, info);
      await webAwesomeRating(page, appearance, css, info);
      await webAwesomeDisclosure(page, appearance, css, info);
    }
    await open(page, 'card', theme, appearance, css);
    const card = specimen(page).locator('en-card');
    observations.card = await metrics(part(card, 'base'), { 'border-radius': source.cardRadius });
    if (['spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'radix-inspired'].includes(theme)) await expectNoShadow(part(card, 'base'));
    if (theme === 'shadcn-inspired') await metrics(part(card, 'base'), { gap: 20 });
    await evidence(info, `${theme}-${appearance}-card`, card, observations.card);
    if (theme === 'shadcn-inspired') {
      // The Rhea source uses 20px outer block padding and gap. Exercise a body-loaded
      // base recipe after the first download mount, then restore public order.
      await page.evaluate(async () => {
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/styles/content.css';
        await new Promise<void>((resolve, reject) => {
          link.addEventListener('load', () => resolve(), { once: true });
          link.addEventListener('error', () => reject(new Error('Native content stylesheet did not load')), { once: true });
          document.body.append(link);
        });
        const native = document.createElement('section'); native.id = 'native-export-card'; native.className = 'en-card en-foundation';
        native.innerHTML = '<div class="en-card__header">Native source card</div><div class="en-card__body">Body-loaded recipe styles precede the downloaded theme.</div>';
        document.querySelector('[data-specimen]')!.append(native);
      });
      await mountExportedCSS(page, css);
      observations.nativeCard = await metrics(page.locator('#native-export-card'), {
        'padding-top': 20, 'padding-bottom': 20, gap: 20, 'border-radius': 24,
      });
      await shadcnCardRadiusCap(page, card, page.locator('#native-export-card'));
    }

    if (theme === 'shadcn-inspired') {
      await open(page, 'accordion', theme, appearance, css);
      const accordion = specimen(page).locator('en-accordion'), trigger = accordion.getByRole('button', { name: 'Appearance', exact: true });
      const item = accordion.locator('en-accordion-item[value="appearance"]');
      const openBackground = appearance === 'light' ? 'rgba(245, 245, 245, 0.5)' : 'rgba(38, 38, 38, 0.5)';
      await metrics(part(accordion, 'base'), { 'border-radius': 18, 'border-top-width': 1, overflow: 'visible' });
      await metrics(trigger, { 'font-size': 14, 'line-height': 20, 'font-weight': '500', 'padding-inline-start': 16, 'padding-top': 16, gap: 24 });
      await metrics(part(item, 'indicator'), { width: 16, height: 16 });
      await trigger.focus(); await trigger.press('Space'); await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(part(item, 'panel')).toBeVisible();
      await metrics(part(item, 'base'), { 'background-color': openBackground });
      await metrics(part(item, 'panel'), { 'padding-top': 0, 'padding-inline-start': 16, 'padding-bottom': 16 });
      await nativeStyles(page, info); await mountExportedCSS(page, css);
      await specimen(page).evaluate(element => {
        const native = document.createElement('section'); native.id = 'native-source-accordion'; native.className = 'en-accordion en-foundation';
        native.innerHTML = '<details class="en-accordion-item"><summary class="en-accordion-trigger">Native details</summary><div class="en-accordion-panel">The browser owns disclosure.</div></details><section class="en-accordion-item"><h3><button class="en-accordion-trigger" aria-expanded="false" aria-controls="native-source-panel">Native heading disclosure</button></h3><div class="en-accordion-panel" id="native-source-panel" hidden>Authored heading-button disclosure.</div></section>';
        const action = native.querySelector<HTMLButtonElement>('button')!, panel = native.querySelector<HTMLElement>('#native-source-panel')!;
        action.addEventListener('click', () => { panel.hidden = !panel.hidden; action.setAttribute('aria-expanded', String(!panel.hidden)); });
        element.append(native);
      });
      const native = page.locator('#native-source-accordion');
      await metrics(native, { 'border-radius': 18, 'border-top-width': 1, overflow: 'visible' });
      for (const action of [native.locator('summary'), native.getByRole('button', { name: 'Native heading disclosure', exact: true })]) {
        await metrics(action, { 'font-size': 14, 'line-height': 20, 'font-weight': '500', 'padding-inline-start': 16, 'padding-top': 16, gap: 24 });
        await action.focus(); await action.press('Enter');
      }
      await expect(native.locator('details')).toHaveAttribute('open', '');
      await expect(native.getByRole('button', { name: 'Native heading disclosure', exact: true })).toHaveAttribute('aria-expanded', 'true');
      for (const nativeItem of [native.locator('details'), native.locator('section.en-accordion-item')]) {
        await metrics(nativeItem, { 'background-color': openBackground });
        await metrics(nativeItem.locator(':scope > .en-accordion-panel'), { 'padding-top': 0, 'padding-inline-start': 16, 'padding-bottom': 16 });
      }
      await evidence(info, `${theme}-${appearance}-accordion`, specimen(page), { openBackground, customTrigger: await style(trigger, ['font-size', 'line-height', 'gap', 'padding-top']), nativeDetails: await style(native.locator('details'), ['background-color']) });
    }
    await open(page, 'dialog-drawer', theme, appearance, css);
    const opener = specimen(page).getByRole('button', { name: 'Open dialog', exact: true }); await opener.click();
    const modal = specimen(page).locator('en-dialog'); await expect(modal.getByRole('dialog')).toBeVisible();
    if (theme === 'web-awesome-inspired') await webAwesomeDialog(page, modal, info, appearance);
    if (theme === 'fluent-inspired' || theme === 'radix-inspired') {
      observations.dialogHeading = await metrics(part(modal, 'heading'), { 'font-size': 20, 'line-height': theme === 'fluent-inspired' ? 28 : 26, 'font-weight': theme === 'fluent-inspired' ? '600' : '700' });
      await metrics(part(modal, 'body'), { 'padding-inline-start': 24, 'font-size': theme === 'fluent-inspired' ? 14 : 16, 'line-height': theme === 'fluent-inspired' ? 20 : 24, 'font-weight': '400' });
      expect((await part(modal, 'surface').boundingBox())!.width).toBeCloseTo(600, 0);
      observations.responsiveDialog = await sourceResponsiveDialog(page, modal, theme, appearance, info);
    }
    if (theme === 'shadcn-inspired') {
      observations.dialog = await metrics(part(modal, 'surface'), { padding: 24, gap: 24, 'border-radius': 24, 'font-size': 14, 'line-height': 20, 'font-weight': '400' });
      await metrics(part(modal, 'heading'), { 'font-size': 16, 'line-height': 16, 'font-weight': '500' });
      await metrics(part(modal, 'footer'), { gap: 8 });
      await modal.evaluate(async element => { const dialog = element as HTMLElement & { description: string; updateComplete: Promise<unknown> }; dialog.description = 'Property supplied source dialog guidance.'; await dialog.updateComplete; });
      await expect(modal.getByRole('dialog')).toHaveAccessibleDescription('Property supplied source dialog guidance.');
      // Existing accessible neutral adaptations remain the description palette.
      await metrics(part(modal, 'description'), { display: 'contents', color: appearance === 'light' ? 'rgb(107, 107, 107)' : 'rgb(161, 161, 161)' });
      if (await page.evaluate(() => CSS.supports('backdrop-filter', 'blur(1px)'))) await metrics(part(modal, 'surface'), { 'backdrop-filter': 'blur(8px)' }, '::backdrop');
      const footer = await modal.locator(':scope > [slot="footer"]').elementHandle();
      await footer!.evaluate(element => element.remove()); await expect(part(modal, 'footer')).toBeHidden();
      await modal.evaluate((element, footer) => { if (footer) element.append(footer); }, footer);
      await expect(part(modal, 'footer')).toBeVisible(); await footer?.dispose();
      // The inherited hook stays outside the absolute 24px source cap.
      await page.locator('html').evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-radius', '31px'); });
      await metrics(part(modal, 'surface'), { 'border-radius': 31 });
      await page.locator('html').evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-radius'); });
      await modal.evaluate(element => { const style = (element as HTMLElement).style; style.setProperty('--en-overlay-padding', '21px'); style.setProperty('--en-overlay-radius', '37px'); });
      await metrics(part(modal, 'surface'), { padding: 21, 'border-radius': 37 });
      await modal.evaluate(element => { const style = (element as HTMLElement).style; style.removeProperty('--en-overlay-padding'); style.removeProperty('--en-overlay-radius'); });
      // Preserve authored nodes while proving that short content still fills
      // the source width; intrinsic form content must not mask this assertion.
      const authored = await modal.evaluateHandle(element => ({ label: element.getAttribute('label'), children: [...element.childNodes] }));
      try {
        await modal.evaluate(element => { element.setAttribute('label', 'Short'); element.replaceChildren(document.createTextNode('Short content.')); });
        await shadcnDialogWidth(page, modal, part(modal, 'surface'), info);
      } finally {
        await modal.evaluate((element, saved) => {
          if (saved.label === null) element.removeAttribute('label'); else element.setAttribute('label', saved.label);
          element.replaceChildren(...saved.children);
        }, authored);
        await authored.dispose();
      }
    }
    await modal.getByRole('textbox', { name: 'Email address', exact: true }).fill('source@example.com');
    await evidence(info, `${theme}-${appearance}-dialog`, part(modal, 'surface'), observations);
    await modal.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(modal.getByRole('dialog')).not.toBeVisible(); await expect(opener).toBeFocused();
    if (theme === 'shadcn-inspired') await shadcnNativeOverlays(page, appearance, css, info);
    if (theme === 'web-awesome-inspired') await webAwesomeOverlayHelpers(page, appearance, css, info);
    if (['astryx-inspired', 'shadcn-inspired', 'radix-inspired'].includes(theme)) {
      await open(page, 'popover-tooltip', theme, appearance, css);
      await specimen(page).getByRole('button', { name: 'Hover or focus', exact: true }).focus();
      const tooltip = specimen(page).locator('en-tooltip'), surface = part(tooltip, 'surface'); await expect(surface).toBeVisible();
      const tooltipReference = theme === 'astryx-inspired'
        ? { radius: 16, font: 14, leading: 20, inline: 8, block: 4, background: appearance === 'light' ? 'rgb(21, 17, 12)' : 'rgb(223, 226, 229)', color: appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(31, 31, 34)' }
        : theme === 'shadcn-inspired'
          ? { radius: 14, font: 12, leading: 16, inline: 12, block: 6, background: appearance === 'light' ? 'rgb(10, 10, 10)' : 'rgb(250, 250, 250)', color: appearance === 'light' ? 'rgb(255, 255, 255)' : 'rgb(10, 10, 10)' }
          : { radius: 4, font: 14, leading: 20, inline: 8, block: 4, background: appearance === 'light' ? 'rgb(28, 32, 36)' : 'rgb(237, 238, 240)', color: appearance === 'light' ? 'rgb(252, 252, 253)' : 'rgb(17, 17, 19)' };
      observations.tooltip = await metrics(surface, { 'border-radius': tooltipReference.radius, 'font-size': tooltipReference.font, 'line-height': tooltipReference.leading, 'border-top-width': 0, 'box-shadow': 'none', 'background-color': tooltipReference.background, color: tooltipReference.color });
      await metrics(part(tooltip, 'content'), { 'padding-inline-start': tooltipReference.inline, 'padding-top': tooltipReference.block });
      if (theme === 'shadcn-inspired') await shadcnTooltipKeycapRadii(page, tooltip, css, info);
      await evidence(info, `${theme}-${appearance}-tooltip`, surface, observations.tooltip);
      await page.keyboard.press('Escape'); await expect(surface).not.toBeVisible();
      if (theme === 'shadcn-inspired') {
        await specimen(page).getByRole('button', { name: 'View options', exact: true }).click();
        const popup = specimen(page).locator('en-popover'), plate = part(popup, 'surface'); await expect(plate).toBeVisible();
        for (const arrow of [false, true]) {
          await popup.evaluate(async (element, arrow) => { const popup = element as HTMLElement & { arrow: boolean; updateComplete: Promise<unknown> }; popup.arrow = arrow; await popup.updateComplete; }, arrow);
          await metrics(plate, { padding: arrow ? 0 : 16, 'row-gap': 16, 'border-radius': 22, 'font-size': 14, 'line-height': 20, 'font-weight': '400' });
          await metrics(part(popup, 'heading'), { 'font-size': 16, 'line-height': 24, 'font-weight': '500' });
          if (arrow) await metrics(part(popup, 'content'), { padding: 16 });
          await popup.evaluate(element => { (element as HTMLElement).style.setProperty('--en-overlay-padding', '21px'); });
          await metrics(arrow ? part(popup, 'content') : plate, { padding: 21 });
          if (arrow) await metrics(plate, { padding: 0 });
          await popup.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-overlay-padding'); });
        }
        await evidence(info, `${theme}-${appearance}-popover`, plate, await style(plate, ['padding', 'row-gap', 'border-radius', 'font-size', 'line-height']));
        await page.keyboard.press('Escape'); await expect(plate).not.toBeVisible();
      }
    }
    if (['spectrum-inspired', 'shadcn-inspired', 'radix-inspired'].includes(theme)) {
      await open(page, 'tabs', theme, appearance, css);
      const tabs = specimen(page).locator('en-tabs'), layout = tabs.getByRole('tab', { name: 'Layout', exact: true });
      await layout.click(); await expect(layout).toHaveAttribute('aria-selected', 'true');
      const selected = part(specimen(page).locator('en-tab[aria-selected="true"]'), 'base');
      if (theme === 'spectrum-inspired') await metrics(selected, { 'font-weight': '400' });
      if (theme === 'shadcn-inspired') {
        await metrics(part(tabs, 'tab-list'), { padding: 3, gap: 0, 'border-radius': 18 });
        await metrics(selected, { 'border-radius': 18, 'padding-inline-start': 6, 'padding-top': 2, 'font-size': 14, 'line-height': 20, 'font-weight': '500' });
        await nativeStyles(page, info); await mountExportedCSS(page, css);
        await specimen(page).evaluate(element => {
          const native = document.createElement('div'); native.className = 'en-tabs en-foundation'; native.id = 'native-source-tabs';
          native.innerHTML = '<div class="en-tab-list" role="tablist" aria-label="Native source tabs"><button class="en-tab" role="tab" aria-selected="true">Native overview</button><button class="en-tab" role="tab" aria-selected="false">Native layout</button></div>';
          element.append(native);
          native.addEventListener('click', event => { const target = event.target as HTMLElement; if (target.getAttribute('role') === 'tab') for (const tab of native.querySelectorAll('[role="tab"]')) tab.setAttribute('aria-selected', String(tab === target)); });
        });
        const native = page.locator('#native-source-tabs');
        await native.getByRole('tab', { name: 'Native layout', exact: true }).click();
        await expect(native.getByRole('tab', { name: 'Native layout', exact: true })).toHaveAttribute('aria-selected', 'true');
        await metrics(native.getByRole('tablist'), { padding: 3, gap: 0, 'border-radius': 18 });
        await metrics(native.getByRole('tab', { name: 'Native layout', exact: true }), { 'border-radius': 18, 'padding-inline-start': 6, 'padding-top': 2, 'font-size': 14, 'line-height': 20, 'font-weight': '500' });
      }
      if (theme === 'radix-inspired') await radixDefaultTabs(page, appearance, css, info);
      if (theme === 'radix-inspired') await hold(page, selected, async () => {
        const colors = await style(selected, ['color', 'background-color']);
        expect(colors.color, 'Radix holds neutral readable text on the pale tab fill').toBe(appearance === 'light' ? 'rgb(28, 32, 36)' : 'rgb(237, 238, 240)');
        const contrast = await renderedContrast(selected);
        expect(contrast.ratio, 'Held tab text retains ordinary-text contrast after alpha compositing').toBeGreaterThanOrEqual(4.5);
        observations.heldTab = { colors, contrast };
        await evidence(info, `${theme}-${appearance}-held-tab`, selected, observations.heldTab);
      });
      await evidence(info, `${theme}-${appearance}-tabs`, specimen(page), observations);
    }
    if (theme === 'web-awesome-inspired') await webAwesomeTabs(page, appearance, css, info);
    if (theme === 'fluent-inspired') await fluentMenuWidths(page, appearance, css, info);
    if (theme === 'radix-inspired' || theme === 'astryx-inspired') {
      await open(page, 'buttons', theme, appearance, css);
      const button = specimen(page).locator(theme === 'radix-inspired' ? 'en-button[variant="secondary"]' : 'en-button[variant="danger"]').first().getByRole('button');
      await page.mouse.move(0, 0); const rest = await style(button, ['background-color', 'color']);
      await button.hover(); const hover = await style(button, ['background-color', 'color']);
      await hold(page, button, async () => {
        const pressed = await style(button, ['background-color', 'color']);
        expect(rest['background-color']).not.toBe(hover['background-color']); expect(hover['background-color']).not.toBe(pressed['background-color']);
        if (theme === 'radix-inspired') {
          const steps = appearance === 'light' ? ['rgba(0, 71, 241, 0.071)', 'rgba(0, 68, 255, 0.118)', 'rgba(0, 68, 255, 0.176)'] : ['rgba(47, 98, 255, 0.235)', 'rgba(53, 102, 255, 0.34)', 'rgba(65, 113, 253, 0.42)'];
          // Engines may serialize alpha at a different precision; compare the
          // independent 8-bit source channels numerically below.
          for (const [actual, expected] of [[rest['background-color'], steps[0]], [hover['background-color'], steps[1]], [pressed['background-color'], steps[2]]]) {
            const channels = actual.match(/[\d.]+/g)!.map(Number), wanted = expected.match(/[\d.]+/g)!.map(Number);
            wanted.forEach((value, index) => expect(channels[index]).toBeCloseTo(value, index === 3 ? 2 : 0));
          }
        } else {
          expect(rest).toEqual({ 'background-color': appearance === 'light' ? 'rgb(227, 25, 59)' : 'rgb(211, 17, 48)', color: 'rgb(255, 255, 255)' });
          expect(pressed.color).toBe('rgb(255, 255, 255)');
          expect((await renderedContrast(button)).ratio, 'Source-composed held destructive fill retains readable inverse text').toBeGreaterThanOrEqual(4.5);
        }
        observations.actionStates = { rest, hover, pressed };
        await evidence(info, `${theme}-${appearance}-held-action`, button, observations.actionStates);
      });
    }
  });
}

// Pinned S2 Tabs.tsx:188–192,243–276,350–454; emitted Tabs.css/Tabs.mjs
// resolve source paint and fixed/rem units. Moving-indicator/overflow-picker
// behavior stays an adaptation; the static profile uses public anatomy only.
for (const appearance of ['light', 'dark'] as const) {
  test(`spectrum-inspired ${appearance}: regular tabs preserve source static geometry, label states and public overrides`, async ({ page, browserName, exportedCSS }, info) => {
    await page.goto('/component-patterns?progress-report');
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
    await nativeStyles(page, info);
    await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'spectrum-tabs-neutral', mode: appearance }), { selector: '.spectrum-tabs-neutral', colorScheme: true }) });
    await page.evaluate(async appearance => {
      await Promise.all(['en-tabs', 'en-tab', 'en-tab-panel'].map(name => customElements.whenDefined(name)));
      const region = document.createElement('section'); region.id = 'spectrum-tabs-fidelity'; region.className = 'en-foundation';
      region.style.cssText = 'display:grid;gap:24px;padding:24px;background:var(--en-color-canvas)';
      region.dataset.enTheme = 'spectrum-inspired'; region.dataset.enAppearance = appearance;
      const custom = (id: string, orientation = 'horizontal') => {
        const tabs = document.createElement('en-tabs'); tabs.id = id; tabs.setAttribute('label', id); tabs.setAttribute('orientation', orientation);
        tabs.innerHTML = '<en-tab slot="tab" value="first">First</en-tab><en-tab slot="tab" value="second">Second longer label</en-tab><en-tab slot="tab" value="disabled" disabled>Unavailable</en-tab><en-tab-panel slot="panel" value="first">First panel</en-tab-panel><en-tab-panel slot="panel" value="second">Second panel</en-tab-panel>';
        return tabs;
      };
      const native = (id: string, orientation?: 'aria-orientation' | 'data-orientation') => {
        const list = document.createElement('div'); list.id = id; list.className = 'en-tab-list'; list.setAttribute('role', 'tablist'); list.setAttribute('aria-label', id);
        if (orientation) list.setAttribute(orientation, 'vertical');
        list.innerHTML = '<button type="button" class="en-tab" role="tab" aria-selected="true">First</button><button type="button" class="en-tab" role="tab" aria-selected="false">Second longer label</button><button type="button" class="en-tab" role="tab" aria-selected="false" aria-disabled="true" disabled>Unavailable</button>';
        return list;
      };
      region.append(custom('s2-custom-horizontal'), custom('s2-custom-vertical', 'vertical'), native('s2-native-horizontal'), native('s2-native-vertical', 'aria-orientation'), native('s2-native-data-vertical', 'data-orientation'));
      const middle = document.createElement('section'); middle.id = 's2-middle'; middle.className = 'spectrum-tabs-neutral en-foundation'; middle.dataset.enTheme = 'spectrum-tabs-neutral'; middle.dataset.enAppearance = appearance;
      middle.append(custom('s2-middle-custom'), native('s2-middle-native'));
      const returned = document.createElement('section'); returned.className = 'en-foundation'; returned.dataset.enTheme = 'spectrum-inspired'; returned.dataset.enAppearance = appearance;
      returned.append(custom('s2-returned-custom'), native('s2-returned-native')); middle.append(returned); region.append(middle); document.body.append(region);
      const elements = [...region.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('en-tabs, en-tab, en-tab-panel')];
      await Promise.all(elements.map(element => element.updateComplete)); await document.fonts.ready;
    }, appearance);
    const middleCustom = part(page.locator('#s2-middle-custom'), 'tab-list'), middleNative = page.locator('#s2-middle-native');
    const neutralBefore = await Promise.all([style(middleCustom, ['gap', 'border-bottom-width']), style(middleNative, ['gap', 'border-bottom-width'])]);
    await mountExportedCSS(page, exportedCSS['spectrum-inspired']);
    expect(await Promise.all([style(middleCustom, ['gap', 'border-bottom-width']), style(middleNative, ['gap', 'border-bottom-width'])]), 'A → B preserves the independent full-theme boundary').toEqual(neutralBefore);
    const rest: RGBA = appearance === 'light' ? [80, 80, 80, 1] : [175, 175, 175, 1];
    const neutral: RGBA = appearance === 'light' ? [41, 41, 41, 1] : [219, 219, 219, 1];
    const selectedInteraction: RGBA = appearance === 'light' ? [19, 19, 19, 1] : [242, 242, 242, 1];
    const disabledPaint: RGBA = appearance === 'light' ? [198, 198, 198, 1] : [68, 68, 68, 1];
    const disabledIndicator: RGBA = appearance === 'light' ? [233, 233, 233, 1] : [44, 44, 44, 1];
    const observations: Record<string, unknown> = {};
    const customHorizontal = page.locator('#s2-custom-horizontal');
    const all = [
      { id: 's2-custom-horizontal', custom: true, vertical: false }, { id: 's2-custom-vertical', custom: true, vertical: true },
      { id: 's2-native-horizontal', custom: false, vertical: false }, { id: 's2-native-vertical', custom: false, vertical: true }, { id: 's2-native-data-vertical', custom: false, vertical: true },
      { id: 's2-returned-custom', custom: true, vertical: false }, { id: 's2-returned-native', custom: false, vertical: false },
    ];
    async function marker(surface: Locator, vertical: boolean) {
      const pseudo = await style(surface, ['content', 'pointer-events', 'inline-size', 'block-size', 'border-radius', 'background-color', 'inset-inline-start', 'inset-block-end'], '::after');
      expect(pseudo.content).toBe('""'); expect(pseudo['pointer-events']).toBe('none'); expect(parseFloat(pseudo['border-radius'])).toBe(9999);
      const box = (await surface.boundingBox())!;
      expect(parseFloat(pseudo[vertical ? 'inline-size' : 'block-size'])).toBe(2);
      expect(parseFloat(pseudo[vertical ? 'block-size' : 'inline-size'])).toBeCloseTo(vertical ? box.height : box.width, 0);
      expectPaint(pseudo['background-color'], neutral);
      expect(parseFloat(pseudo[vertical ? 'inset-inline-start' : 'inset-block-end'])).toBe(vertical ? -12 : 0);
      return pseudo;
    }
    for (const entry of all) {
      const owner = page.locator(`#${entry.id}`), list = entry.custom ? part(owner, 'tab-list') : owner;
      const tabs = owner.getByRole('tab'), selected = tabs.nth(0), unselected = tabs.nth(1);
      const selectedSurface = entry.custom ? part(selected, 'base') : selected, unselectedSurface = entry.custom ? part(unselected, 'base') : unselected;
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await metrics(list, { gap: entry.vertical ? 0 : 32, 'border-block-end-width': 0, 'border-inline-end-width': 0, 'margin-inline-start': entry.vertical ? 12 : 0, 'margin-inline-end': entry.vertical ? 20 : 0 });
      for (const surface of [selectedSurface, unselectedSurface]) await metrics(surface, { 'border-block-end-width': 0, 'border-inline-end-width': 0, 'margin-block-end': 0, 'margin-inline-end': 0, 'min-block-size': 48, 'padding-inline-start': 0, 'padding-block-start': 0, 'font-weight': '400', 'background-color': 'rgba(0, 0, 0, 0)' });
      expectPaint((await style(unselectedSurface, ['color'])).color, rest); expectPaint((await style(selectedSurface, ['color'])).color, neutral);
      expect((await style(unselectedSurface, ['content'], '::after')).content).not.toBe('""');
      observations[entry.id] = await marker(selectedSurface, entry.vertical);
      if (entry.vertical && entry.custom) expect((await selectedSurface.boundingBox())!.width).toBeCloseTo((await selected.boundingBox())!.width, 0);
    }
    // EnTab owns role/tabIndex on its host; base is a nonfocusable span. Enter
    // through real Tab/Arrow keys so source focus-visible paint follows that host.
    const tabForward = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    const tabBackward = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
    for (const custom of [true, false]) {
      const owner = custom ? customHorizontal : page.locator('#s2-native-horizontal');
      const sentinelId = custom ? 's2-custom-keyboard-entry' : 's2-native-keyboard-entry';
      await owner.evaluate(async (element, id) => {
        const sentinel = document.createElement('button'); sentinel.id = id; sentinel.type = 'button'; sentinel.textContent = 'Enter tabs with the keyboard'; element.before(sentinel);
        if (element.localName === 'en-tabs') {
          const tabs = element as HTMLElement & { activation: string; updateComplete: Promise<unknown> };
          tabs.activation = 'manual'; await tabs.updateComplete;
        }
      }, sentinelId);
      const sentinel = page.locator(`#${sentinelId}`), selected = owner.getByRole('tab').nth(0), unselected = owner.getByRole('tab').nth(1);
      const keyboardPaint = async (host: Locator, color: RGBA) => {
        await expect(host).toBeFocused(); expect(await host.evaluate(element => element.matches(':focus-visible'))).toBe(true);
        const surface = custom ? part(host, 'base') : host;
        if (custom) expect(await surface.evaluate(element => element.matches(':focus, :focus-visible'))).toBe(false);
        expectPaint((await style(surface, ['color'])).color, color);
      };
      // Pointer focus is a separate source branch; move away before measuring it.
      await sentinel.click(); await selected.click(); await page.mouse.move(0, 0);
      expect(await selected.evaluate(element => element.matches(':focus-visible'))).toBe(false);
      expectPaint((await style(custom ? part(selected, 'base') : selected, ['color'])).color, neutral);
      await sentinel.focus(); await page.keyboard.press(tabForward); await keyboardPaint(selected, selectedInteraction);
      await page.keyboard.press(custom ? 'ArrowRight' : tabForward); await keyboardPaint(unselected, neutral);
      await expect(selected).toHaveAttribute('aria-selected', 'true'); await expect(unselected).toHaveAttribute('aria-selected', 'false');
      await page.keyboard.press(tabBackward); await expect(custom ? sentinel : selected).toBeFocused();
      await page.keyboard.press(tabForward); await keyboardPaint(unselected, neutral);
      if (custom) {
        await page.keyboard.press('ArrowLeft'); await keyboardPaint(selected, selectedInteraction);
        await owner.evaluate(async element => { const tabs = element as HTMLElement & { activation: string; updateComplete: Promise<unknown> }; tabs.activation = 'automatic'; await tabs.updateComplete; });
        await selected.blur();
      } else await unselected.blur();
      await sentinel.evaluate(element => element.remove()); await page.mouse.move(0, 0);
    }
    // Native authors own state changes; the hydrated element retains its ordinary
    // keyboard selection, cancellation and disabled behavior under this paint.
    const first = customHorizontal.getByRole('tab').nth(0), second = customHorizontal.getByRole('tab').nth(1);
    await first.focus(); await page.keyboard.press('ArrowRight'); await expect(second).toBeFocused(); await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(customHorizontal.getByRole('tabpanel', { name: 'Second longer label', exact: true })).toBeVisible();
    await customHorizontal.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
    await first.click(); await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(customHorizontal.getByRole('tab').nth(2)).toHaveAttribute('aria-disabled', 'true');
    await customHorizontal.evaluate(async element => { const tabs = element as HTMLElement & { value: string; updateComplete: Promise<unknown> }; tabs.value = 'first'; await tabs.updateComplete; });
    await first.blur(); await page.mouse.move(0, 0);
    for (const custom of [true, false]) {
      const owner = custom ? customHorizontal : page.locator('#s2-native-horizontal');
      for (const selected of [false, true]) {
        const host = owner.getByRole('tab').nth(selected ? 0 : 1), surface = custom ? part(host, 'base') : host;
        await host.hover(); expectPaint((await style(surface, ['color'])).color, selected ? selectedInteraction : neutral);
        if (custom) await host.evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }));
        await hold(page, host, async () => { const paint = await style(surface, ['color', 'background-color']); expectPaint(paint.color, selected ? selectedInteraction : neutral); expectPaint(paint['background-color'], [0, 0, 0, 0]); });
        // Real keyboard modality distinguishes focus-visible from pointer focus.
        await page.keyboard.press('Tab'); await host.focus(); expect(await host.evaluate(element => element.matches(':focus-visible'))).toBe(true);
        expectPaint((await style(surface, ['color'])).color, selected ? selectedInteraction : neutral);
        await host.blur(); await page.mouse.move(0, 0);
      }
      const disabled = owner.getByRole('tab').nth(2), disabledSurface = custom ? part(disabled, 'base') : disabled;
      const disabledRest = await style(disabledSurface, ['color', 'background-color']);
      expectPaint(disabledRest.color, disabledPaint);
      const disabledOpacity = await disabledSurface.evaluate(element => {
        let opacity = 1;
        for (let node: Element | null = element; node;) {
          opacity *= Number(getComputedStyle(node).opacity);
          node = (node as HTMLElement).assignedSlot ?? node.parentElement ?? (node.getRootNode() instanceof ShadowRoot ? (node.getRootNode() as ShadowRoot).host : null);
        }
        return opacity;
      });
      expect(disabledOpacity, 'Source disabled paint is not multiplied by a host or ancestor fade').toBe(1);
      observations[custom ? 'customDisabled' : 'nativeDisabled'] = { paint: disabledRest, effectiveOpacity: disabledOpacity };
      await hold(page, disabled, async () => expect(await style(disabledSurface, ['color', 'background-color'])).toEqual(disabledRest));
      const override = owner.getByRole('tab').nth(0), overrideSurface = custom ? part(override, 'base') : override;
      await override.evaluate(element => {
        const style = (element as HTMLElement).style;
        style.setProperty('--en-control-min-size', '64px'); style.setProperty('--en-control-inline-padding', '11px');
        for (const [name, value] of Object.entries({ 'background': 'rgb(201, 202, 203)', 'color': 'rgb(31, 32, 33)', 'selected-background': 'rgb(204, 205, 206)', 'selected-color': 'rgb(34, 35, 36)', 'hover-background': 'rgb(207, 208, 209)', 'hover-color': 'rgb(37, 38, 39)', 'pressed-background': 'rgb(210, 211, 212)', 'pressed-color': 'rgb(40, 41, 42)', 'indicator-color': 'rgb(43, 44, 45)' })) style.setProperty(`--en-tab-${name}`, value);
      });
      await page.mouse.move(0, 0); await metrics(overrideSurface, { 'background-color': 'rgb(204, 205, 206)', color: 'rgb(34, 35, 36)', 'min-block-size': 64, 'padding-inline-start': 11 });
      expectPaint((await style(overrideSurface, ['background-color'], '::after'))['background-color'], [43, 44, 45, 1]);
      await override.hover(); await metrics(overrideSurface, { 'background-color': 'rgb(207, 208, 209)', color: 'rgb(37, 38, 39)' });
      await page.keyboard.press('Tab'); await override.focus(); await override.hover();
      await metrics(overrideSurface, { color: 'rgb(37, 38, 39)' });
      await hold(page, override, async () => { await metrics(overrideSurface, { 'background-color': 'rgb(210, 211, 212)', color: 'rgb(40, 41, 42)' }); });
      await override.blur();
      if (custom) await owner.evaluate(async element => { const tabs = element as HTMLElement & { value: string; updateComplete: Promise<unknown> }; tabs.value = 'second'; await tabs.updateComplete; });
      else await override.evaluate(element => element.setAttribute('aria-selected', 'false'));
      await metrics(overrideSurface, { 'background-color': 'rgb(201, 202, 203)', color: 'rgb(31, 32, 33)' });
      if (custom) await owner.evaluate(async element => { const tabs = element as HTMLElement & { value: string; updateComplete: Promise<unknown> }; tabs.value = 'first'; await tabs.updateComplete; });
      else await override.evaluate(element => element.setAttribute('aria-selected', 'true'));
      await override.evaluate(async element => { const tab = element as HTMLElement & { disabled: boolean; updateComplete?: Promise<unknown> }; tab.disabled = true; await tab.updateComplete; });
      await metrics(overrideSurface, { 'background-color': 'rgb(204, 205, 206)' });
      await override.evaluate(async element => { const tab = element as HTMLElement & { disabled: boolean; updateComplete?: Promise<unknown> }; tab.disabled = false; await tab.updateComplete; });
      await override.evaluate(element => (element as HTMLElement).removeAttribute('style'));
      await override.evaluate(async element => { const tab = element as HTMLElement & { disabled: boolean; updateComplete?: Promise<unknown> }; tab.disabled = true; await tab.updateComplete; });
      expectPaint((await style(overrideSurface, ['color'])).color, disabledPaint);
      expectPaint((await style(overrideSurface, ['background-color'], '::after'))['background-color'], disabledIndicator);
      await override.evaluate(async element => { const tab = element as HTMLElement & { disabled: boolean; updateComplete?: Promise<unknown> }; tab.disabled = false; await tab.updateComplete; });
    }
    // Direction mirrors the same logical vertical marker without remapping DOM.
    await page.locator('#s2-custom-vertical, #s2-native-vertical').evaluateAll(elements => elements.forEach(element => element.setAttribute('dir', 'rtl')));
    for (const [id, custom] of [['s2-custom-vertical', true], ['s2-native-vertical', false]] as const) {
      const selected = page.locator(`#${id}`).getByRole('tab').nth(0), surface = custom ? part(selected, 'base') : selected;
      await marker(surface, true); await metrics(surface, { right: -12 }, '::after');
    }
    const priorRootSize = await page.locator('html').evaluate(element => { const style = (element as HTMLElement).style; const prior = style.fontSize; style.fontSize = '20px'; return prior; });
    for (const [id, custom] of [['s2-custom-horizontal', true], ['s2-native-horizontal', false]] as const) {
      const owner = page.locator(`#${id}`), selected = owner.getByRole('tab').nth(0), surface = custom ? part(selected, 'base') : selected;
      await metrics(custom ? part(owner, 'tab-list') : owner, { gap: 40 }); await metrics(surface, { 'min-block-size': 60 });
    }
    for (const [id, custom] of [['s2-custom-vertical', true], ['s2-native-vertical', false]] as const) {
      const owner = page.locator(`#${id}`), selected = owner.getByRole('tab').nth(0), surface = custom ? part(selected, 'base') : selected;
      await metrics(custom ? part(owner, 'tab-list') : owner, { 'margin-inline-start': 15, 'margin-inline-end': 25 });
      await metrics(surface, { 'inline-size': 2, 'inset-inline-start': -12 }, '::after');
    }
    await page.locator('html').evaluate((element, value) => { (element as HTMLElement).style.fontSize = value; }, priorRootSize);
    if (emulationLimits.forcedColors[browserName]) {
      info.annotations.push({ type: 'forced-colors-emulation-limit', description: emulationLimits.forcedColors[browserName] });
    } else {
      await page.emulateMedia({ forcedColors: 'active' });
      for (const [id, custom] of [['s2-custom-horizontal', true], ['s2-native-horizontal', false]] as const) {
        const selected = page.locator(`#${id}`).getByRole('tab').nth(0), surface = custom ? part(selected, 'base') : selected;
        expect((await style(surface, ['content'], '::after')).content).not.toBe('""');
      }
      await page.emulateMedia({ forcedColors: 'none' });
    }
    await evidence(info, `spectrum-inspired-${appearance}-static-tabs`, page.locator('#spectrum-tabs-fidelity'), observations);
  });
}

async function webAwesomeToastRailPixels(page: Page, frame: Locator, direction: 'ltr' | 'rtl', expected: { rail: readonly number[]; plate: readonly number[]; endPlate?: readonly number[]; border: readonly number[] }, info: TestInfo, name: string) {
  const png = await frame.screenshot({ scale: 'css', animations: 'disabled' });
  await info.attach(name, { body: png, contentType: 'image/png' });
  const measured = await page.evaluate(async ({ png, direction }) => {
    const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixel = (x: number) => Array.from(data.slice((Math.floor(height / 2) * width + x) * 4, (Math.floor(height / 2) * width + x) * 4 + 4));
    const edge = (leading: boolean) => Array.from({ length: 9 }, (_, inset) => pixel((direction === 'ltr') === leading ? inset : width - 1 - inset));
    return { width, height, leading: edge(true), trailing: edge(false) };
  }, { png: png.toString('base64'), direction });
  const color = (actual: number[], wanted: readonly number[], label: string) => {
    wanted.forEach((channel, index) => expect(Math.abs(actual[index] - channel), `${name}: ${label}, channel ${index}`).toBeLessThanOrEqual(2));
    expect(actual[3], `${name}: ${label} remains opaque`).toBe(255);
  };
  // Pinned WA 3.13 uses a distinct 4px flex child INSIDE its 1px border.
  // Raster edges distinguish that geometry from a thick border, tiled paint,
  // a full-width fill, or a rail that fails to follow inherited direction.
  color(measured.leading[0], expected.border, 'leading border');
  color(measured.trailing[0], expected.border, 'trailing border');
  for (let inset = 1; inset <= 8; inset++) {
    color(measured.leading[inset], inset <= 4 ? expected.rail : expected.plate, `leading inset ${inset}`);
    color(measured.trailing[inset], expected.endPlate ?? expected.plate, `trailing inset ${inset}`);
  }
  return measured;
}

for (const appearance of ['light', 'dark'] as const) {
  test(`web-awesome-inspired: ${appearance} source toast rail, logical inset and public overrides`, async ({ page, browserName, exportedCSS }, info) => {
    // WA 3.13.0 toast-item.styles.ts: --accent-width:4px, separate accent flex
    // child, medium padding16, icon1.25em, content gap16 and border1. Default palette loud fills remain
    // Blue50/Green50/Yellow50/Red50 in BOTH appearances. Local info maps to
    // source brand; source neutral default and timer APIs remain adaptations.
    // These literals come from installed WA source, never our compiled recipe.
    const source = {
      rail: { info: [0, 113, 236], success: [0, 136, 60], warning: [180, 95, 4], danger: [220, 49, 70] },
      plate: appearance === 'light' ? [255, 255, 255] : [27, 29, 38],
      border: appearance === 'light' ? [228, 229, 233] : [47, 50, 63],
    } as const;
    await page.goto('/component-patterns?progress-report');
    // This production page explicitly calls registerAll(). The fixture below
    // authors the public elements and portable native helper composition.
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
    await nativeStyles(page, info, ['toast', 'feedback']);
    await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'wa-toast-default', mode: appearance }), { selector: '[data-en-theme="wa-toast-default"]', colorScheme: true }) });
    await page.evaluate(async appearance => {
      const fixture = document.createElement('section'); fixture.id = 'wa-toast-fidelity'; fixture.className = 'en-foundation';
      fixture.dataset.enTheme = 'web-awesome-inspired'; fixture.dataset.enAppearance = appearance;
      // Integer horizontal geometry makes one CSS-pixel border/rail raster
      // samples portable across device scales; content remains unconstrained.
      fixture.style.cssText = 'position:fixed;inset:16px auto auto 16px;inline-size:360px;z-index:10000;display:grid;gap:16px;background:var(--en-color-canvas)';
      const glyph = '<svg class="en-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>';
      const pair = (prefix: string) => `<en-toast id="${prefix}-custom-toast" open>Source notification.</en-toast><article id="${prefix}-native-toast" class="en-toast" data-variant="info"><span class="en-toast__icon" aria-hidden="true">${glyph}</span><div class="en-toast__body"><div class="en-toast__content">Source notification.</div></div><button class="en-button en-toast__close" data-variant="ghost" type="button" aria-label="Native dismiss notification">×</button></article>`;
      const hooks = document.createElement('div'); hooks.id = 'wa-toast-hooks'; hooks.className = 'en-foundation'; hooks.style.cssText = 'display:grid;gap:16px'; hooks.innerHTML = pair('source-wa');
      const iconless = document.createElement('article'); iconless.id = 'wa-iconless-native-toast'; iconless.className = 'en-toast'; iconless.dataset.variant = 'info';
      // The source rail occupies four pixels before medium16 content padding,
      // including native compositions that omit the optional icon entirely.
      iconless.style.cssText = '--en-toast-padding:16px;--en-border-width:1px;--en-space-3:12px';
      iconless.innerHTML = '<div class="en-toast__body"><div class="en-toast__content">Authored iconless notification.</div><div class="en-toast__actions"><button class="en-button" type="button">Undo</button></div></div><button class="en-button en-toast__close" data-variant="ghost" type="button" aria-label="Iconless dismiss notification">×</button>';
      hooks.append(iconless);
      const middle = document.createElement('section'); middle.id = 'wa-toast-default'; middle.className = 'en-foundation';
      middle.dataset.enTheme = 'wa-toast-default'; middle.dataset.enAppearance = appearance; middle.style.cssText = 'display:grid;gap:16px'; middle.innerHTML = pair('isolated-wa');
      const returned = document.createElement('section'); returned.id = 'wa-toast-returned'; returned.className = 'en-foundation';
      returned.dataset.enTheme = 'web-awesome-inspired'; returned.dataset.enAppearance = appearance; returned.style.cssText = 'display:grid;gap:16px'; returned.innerHTML = pair('returned-wa');
      middle.append(returned); fixture.append(hooks, middle); document.body.append(fixture);
      const elements = [...fixture.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('en-toast')];
      await Promise.all(elements.map(element => customElements.whenDefined(element.localName)));
      await Promise.all(elements.map(element => element.updateComplete)); await document.fonts.ready;
    }, appearance);
    const custom = page.locator('#source-wa-custom-toast'), native = page.locator('#source-wa-native-toast');
    const entries = [
      { name: 'custom', owner: custom, frame: part(custom, 'base'), icon: part(custom, 'icon'), glyph: part(part(custom, 'icon').locator('en-icon'), 'base'), content: part(custom, 'content') },
      { name: 'native', owner: native, frame: native, icon: native.locator(':scope > .en-toast__icon'), glyph: native.locator(':scope > .en-toast__icon > svg.en-icon'), content: native.locator(':scope > .en-toast__body > .en-toast__content') },
    ];
    const closeGlyph = part(custom.locator('en-button').locator('en-icon'), 'base');
    const closeGlyphBefore = await style(closeGlyph, ['font-size', 'width', 'height']);
    const isolated = [part(page.locator('#isolated-wa-custom-toast'), 'base'), page.locator('#isolated-wa-native-toast')];
    const isolatedIcons = [part(page.locator('#isolated-wa-custom-toast'), 'icon'), page.locator('#isolated-wa-native-toast > .en-toast__icon')];
    const isolatedGlyphs = [part(isolatedIcons[0].locator('en-icon'), 'base'), isolatedIcons[1].locator(':scope > svg.en-icon')];
    const isolatedSignature = () => Promise.all(isolated.map(async (frame, index) => ({ surface: await style(frame, ['background-image', 'grid-template-columns', 'column-gap']), icon: await style(isolatedIcons[index], ['margin-inline-start']), glyph: await style(isolatedGlyphs[index], ['width', 'height']) })));
    const isolatedBefore = await isolatedSignature();
    const iconless = page.locator('#wa-iconless-native-toast');
    const iconlessInsets = (direction: 'ltr' | 'rtl') => iconless.evaluate((element, direction) => {
      const frame = element.getBoundingClientRect();
      const inset = (selector: string) => {
        const child = element.querySelector(selector)!.getBoundingClientRect();
        return direction === 'ltr' ? child.left - frame.left : frame.right - child.right;
      };
      return { content: inset('.en-toast__content'), actions: inset('.en-toast__actions'), overflow: element.scrollWidth - element.clientWidth };
    }, direction);
    await mountExportedCSS(page, exportedCSS['web-awesome-inspired']);
    expect(await isolatedSignature(), 'A complete default boundary blocks ancestor toast paint and geometry').toEqual(isolatedBefore);
    expect(await style(closeGlyph, ['font-size', 'width', 'height']), 'Status glyph defaults remain on its Part and do not resize the sibling close glyph').toEqual(closeGlyphBefore);
    await metrics(closeGlyph, { 'font-size': 16, width: 18, height: 18 });
    const iconlessObservations: Record<string, unknown> = {};
    for (const direction of ['ltr', 'rtl'] as const) {
      await iconless.evaluate((element, direction) => element.setAttribute('dir', direction), direction);
      const insets = await iconlessInsets(direction);
      expect(insets.content, 'Iconless native content follows source border1 + rail4 + medium padding16').toBeCloseTo(21, 1);
      expect(insets.actions, 'Application-owned native actions align to their message content').toBeCloseTo(21, 1);
      expect(insets.overflow).toBeLessThanOrEqual(1);
      iconlessObservations[direction] = insets;
      await iconless.evaluate(element => (element as HTMLElement).style.setProperty('--en-toast-padding', '10px 12px 14px 18px'));
      await metrics(iconless, { 'padding-top': 10, 'padding-right': 12, 'padding-bottom': 14, 'padding-left': 18 });
      const overridden = await iconlessInsets(direction), expected = direction === 'ltr' ? 23 : 17;
      expect(overridden.content, 'Iconless content preserves physical four-value padding in either direction').toBeCloseTo(expected, 1);
      expect(overridden.actions).toBeCloseTo(expected, 1); expect(overridden.overflow).toBeLessThanOrEqual(1);
      iconlessObservations[`${direction}-padding-override`] = overridden;
      await iconless.evaluate(element => (element as HTMLElement).style.setProperty('--en-toast-padding', '16px'));
    }
    await iconless.evaluate(element => element.removeAttribute('dir'));
    for (const [index, returned] of [part(page.locator('#returned-wa-custom-toast'), 'base'), page.locator('#returned-wa-native-toast')].entries()) {
      expect(await style(returned, ['background-image', 'background-size']), 'A → default → A restores the toast rail').toEqual(await style(entries[index].frame, ['background-image', 'background-size']));
    }
    const observations: Record<string, unknown> = {
      source, isolatedBefore, iconless: iconlessObservations, closeGlyphBefore,
      sourceIdentity: {
        package: '@awesome.me/webawesome', version: '3.13.0', theme: 'Default', palette: 'Default',
        files: [
          { path: 'dist/chunks/chunk.6AMLOZPA.js', sha256: 'b98bbf12eb67724235bfa6583234ff6adb40164d9f70bceef29e83b2c7c5c05d' },
          { path: 'dist/styles/themes/default.css', sha256: 'e19fff39b8c90f37d39e76535313e6da23f02cf2ca3b0e67407e17022fa6da50' },
          { path: 'dist/styles/color/palettes/default.css', sha256: '7fd5825d4872d2085ecce86776d3d5383c606882d5667f6f3105f04b15ccd69e' },
        ],
      },
    };
    const setVariant = async (variant: keyof typeof source.rail) => {
      await custom.evaluate(async (element, variant) => { element.setAttribute('variant', variant); await (element as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete; }, variant);
      await native.evaluate((element, variant) => element.setAttribute('data-variant', variant), variant);
    };
    const iconInset = async (entry: typeof entries[number], direction: 'ltr' | 'rtl', expected: number) => {
      const frame = (await entry.frame.boundingBox())!, icon = (await entry.icon.boundingBox())!;
      const inset = direction === 'ltr' ? icon.x - frame.x : frame.x + frame.width - icon.x - icon.width;
      expect(inset, `${entry.name}: rail reserves four pixels before the icon without rewriting padding`).toBeCloseTo(expected, 1);
      return inset;
    };
    for (const direction of ['ltr', 'rtl'] as const) {
      await page.locator('#wa-toast-fidelity').evaluate((element, direction) => element.setAttribute('dir', direction), direction);
      for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
        await setVariant(variant);
        for (const entry of entries) {
          await metrics(entry.frame, { 'border-inline-start-width': 1, 'border-inline-end-width': 1, 'padding-top': 16, 'padding-bottom': 16, 'padding-inline-start': 16, 'padding-inline-end': 16, 'column-gap': 16 });
          await metrics(entry.glyph, { width: 20, height: 20 });
          const inset = await iconInset(entry, direction, 21);
          const frame = (await entry.frame.boundingBox())!, content = (await entry.content.boundingBox())!;
          const contentInset = direction === 'ltr' ? content.x - frame.x : frame.x + frame.width - content.x - content.width;
          expect(contentInset, `${entry.name}: source message follows border1 + padding16 + rail4 + glyph20 + gap16`).toBeCloseTo(57, 1);
          observations[`${direction}-${variant}-${entry.name}`] = { inset, contentInset, pixels: await webAwesomeToastRailPixels(page, entry.frame, direction, { rail: source.rail[variant], plate: source.plate, border: source.border }, info, `wa-toast-${appearance}-${direction}-${variant}-${entry.name}`) };
        }
      }
    }
    await setVariant('info');
    const hooks = page.locator('#wa-toast-hooks');
    await hooks.evaluate(element => {
      const owner = element as HTMLElement;
      // Consume public typography at a real foundation. Merely applying a
      // raw parent font-size cannot cross EnIcon's own existing foundation.
      for (const suffix of ['', '-small', '-medium', '-large']) owner.style.setProperty(`--en-font-ui-size${suffix}`, '24px');
    });
    for (const entry of entries) {
      await metrics(entry.frame, { 'font-size': 24, 'column-gap': 16 });
      await metrics(entry.glyph, { 'font-size': 24, width: 30, height: 30 });
    }
    await metrics(part(custom, 'icon').locator('en-icon'), { 'font-size': 24 });
    await metrics(closeGlyph, { 'font-size': 24, width: 18, height: 18 });
    await hooks.evaluate(element => {
      const owner = element as HTMLElement;
      for (const suffix of ['', '-small', '-medium', '-large']) owner.style.removeProperty(`--en-font-ui-size${suffix}`);
      owner.style.setProperty('--en-icon-size', '26px');
    });
    for (const entry of entries) await metrics(entry.glyph, { width: 26, height: 26 });
    await hooks.evaluate(element => (element as HTMLElement).style.removeProperty('--en-icon-size'));
    for (const entry of entries) {
      await metrics(entry.frame, { 'font-size': 16 });
      await metrics(entry.glyph, { width: 20, height: 20 });
    }
    expect(await style(closeGlyph, ['font-size', 'width', 'height']), 'Restoring public typography and icon overrides restores the unchanged close canvas').toEqual(closeGlyphBefore);
    observations.glyphs = { sourceScale: 1.25, baseFont: 16, baseCanvas: 20, contentGap: 16, publicFont: 24, enlargedCanvas: 30, publicIconSize: 26, closeCanvas: 18, limitation: 'Raw parent font-size does not override the existing child EnIcon foundation; public semantic font properties were exercised.' };
    await hooks.evaluate(element => {
      (element as HTMLElement).style.setProperty('--en-toast-info-background', 'linear-gradient(to right, #102030 0% 50%, #405060 50% 100%)');
    });
    for (const direction of ['ltr', 'rtl'] as const) {
      await page.locator('#wa-toast-fidelity').evaluate((element, direction) => element.setAttribute('dir', direction), direction);
      for (const entry of entries) {
        // The public hook accepts paint, including gradients. Two distinct
        // plate colors prove the consumer gradient survives behind the rail.
        await webAwesomeToastRailPixels(page, entry.frame, direction, {
          rail: source.rail.info, border: source.border,
          plate: direction === 'ltr' ? [16, 32, 48] : [64, 80, 96],
          endPlate: direction === 'ltr' ? [64, 80, 96] : [16, 32, 48],
        }, info, `wa-toast-${appearance}-${direction}-${entry.name}-gradient-hook`);
      }
    }
    await hooks.evaluate(element => {
      const owner = element as HTMLElement;
      // Existing specific status hooks take precedence over the generic hook.
      owner.style.setProperty('--en-toast-info-background', '#102030');
      owner.style.setProperty('--en-toast-padding', '10px 12px 14px 18px');
    });
    for (const direction of ['ltr', 'rtl'] as const) {
      await page.locator('#wa-toast-fidelity').evaluate((element, direction) => element.setAttribute('dir', direction), direction);
      for (const entry of entries) {
        await metrics(entry.frame, { 'padding-top': 10, 'padding-right': 12, 'padding-bottom': 14, 'padding-left': 18 });
        await alertPaint(entry.frame, { 'background-color': '#102030' });
        await iconInset(entry, direction, direction === 'ltr' ? 23 : 17);
        await webAwesomeToastRailPixels(page, entry.frame, direction, { rail: source.rail.info, plate: [16, 32, 48], border: source.border }, info, `wa-toast-${appearance}-${direction}-${entry.name}-inherited-hooks`);
      }
    }
    await hooks.evaluate(element => {
      const owner = element as HTMLElement;
      owner.style.setProperty('--en-toast-info-background', 'initial');
      owner.style.setProperty('--en-toast-background', '#405060');
    });
    for (const entry of entries) await alertPaint(entry.frame, { 'background-color': '#405060' });
    await page.locator('#wa-toast-fidelity').evaluate(element => element.setAttribute('dir', 'ltr'));
    const partOverride = await page.addStyleTag({ content: '#source-wa-custom-toast::part(base) { --en-toast-info-background: #708090; --en-toast-padding: 8px 10px; }' });
    await alertPaint(entries[0].frame, { 'background-color': '#708090' });
    await metrics(entries[0].frame, { 'padding-top': 8, 'padding-bottom': 8, 'padding-left': 10, 'padding-right': 10 });
    await iconInset(entries[0], 'ltr', 15);
    await alertPaint(entries[1].frame, { 'background-color': '#405060' });
    await partOverride.evaluate(element => (element as HTMLStyleElement).remove());
    await hooks.evaluate(element => {
      const owner = element as HTMLElement;
      for (const name of ['--en-toast-info-background', '--en-toast-background', '--en-toast-padding']) owner.style.removeProperty(name);
    });
    for (const entry of entries) {
      await metrics(entry.frame, { 'padding-inline-start': 16, 'padding-inline-end': 16 });
      await webAwesomeToastRailPixels(page, entry.frame, 'ltr', { rail: source.rail.info, plate: source.plate, border: source.border }, info, `wa-toast-${appearance}-${entry.name}-restored`);
    }
    const inlineRecipe = await page.addStyleTag({ content: `
      #source-wa-custom-toast[open]::part(base), #source-wa-native-toast:not([hidden]) { display:flex; }
      #source-wa-custom-toast::part(content), #source-wa-native-toast > .en-toast__body > .en-toast__content { flex:1 1 0; }
    ` });
    const inlineGeometry = async (entry: typeof entries[number], direction: 'ltr' | 'rtl') => {
      const frame = (await entry.frame.boundingBox())!, icon = (await entry.icon.boundingBox())!, close = (await entry.owner.getByRole('button').boundingBox())!;
      const overflow = await entry.frame.evaluate(element => element.scrollWidth - element.clientWidth);
      return {
        icon: direction === 'ltr' ? icon.x - frame.x : frame.x + frame.width - icon.x - icon.width,
        close: direction === 'ltr' ? frame.x + frame.width - close.x - close.width : close.x - frame.x,
        closeWidth: close.width, closeHeight: close.height, overflow,
      };
    };
    for (const direction of ['ltr', 'rtl'] as const) {
      await page.locator('#wa-toast-fidelity').evaluate((element, direction) => element.setAttribute('dir', direction), direction);
      // A public icon Part/native helper override supplies the same flex
      // composition without rail spacing; source close geometry is not assumed.
      const unspaced = await page.addStyleTag({ content: '#source-wa-custom-toast::part(icon), #source-wa-native-toast > .en-toast__icon { margin-inline-start:0; }' });
      const before = await Promise.all(entries.map(entry => inlineGeometry(entry, direction)));
      await unspaced.evaluate(element => (element as HTMLStyleElement).remove());
      for (const [index, entry] of entries.entries()) {
        await expect(entry.frame).toHaveCSS('display', 'flex');
        const after = await inlineGeometry(entry, direction);
        expect(after.icon - before[index].icon, `${entry.name}: public inline-flex composition retains the four-pixel inset`).toBeCloseTo(4, 1);
        expect(after.icon).toBeCloseTo(21, 1);
        expect(after.close, `${entry.name}: adding the rail inset preserves the inline close position`).toBeCloseTo(before[index].close, 1);
        expect(after.closeWidth).toBeGreaterThanOrEqual(24); expect(after.closeHeight).toBeGreaterThanOrEqual(24);
        expect(after.overflow, `${entry.name}: inline composition stays inside the frame`).toBeLessThanOrEqual(1);
        observations[`inline-${direction}-${entry.name}`] = { before: before[index], after };
      }
    }
    await inlineRecipe.evaluate(element => (element as HTMLStyleElement).remove());
    await page.locator('#wa-toast-fidelity').evaluate(element => element.setAttribute('dir', 'ltr'));
    // The existing supported engine matrix records WebKit's platform limit;
    // it does not skip any ordinary rail or interaction checks above/below.
    if (emulationLimits.forcedColors[browserName]) {
      info.annotations.push({ type: 'platform-limit', description: emulationLimits.forcedColors[browserName] });
    } else {
      await page.emulateMedia({ forcedColors: 'active' });
      for (const entry of entries) {
        await expect(entry.frame).toHaveCSS('background-image', 'none');
        await alertPaint(entry.frame, { 'background-color': 'Canvas', color: 'CanvasText', 'border-inline-start-color': 'CanvasText' });
        await metrics(entry.frame, { 'padding-inline-start': 16 });
        await iconInset(entry, 'ltr', 17);
      }
      await custom.getByRole('button', { name: 'Dismiss notification', exact: true }).focus();
      await expect(custom.getByRole('button', { name: 'Dismiss notification', exact: true })).toBeFocused();
      await page.emulateMedia({ forcedColors: 'none' });
    }
    const close = custom.getByRole('button', { name: 'Dismiss notification', exact: true });
    const closeBox = (await close.boundingBox())!;
    expect(closeBox.width).toBeGreaterThanOrEqual(24); expect(closeBox.height).toBeGreaterThanOrEqual(24);
    await custom.evaluate(element => element.addEventListener('en-change', event => {
      element.setAttribute('data-staged-open', String((element as HTMLElement & { open: boolean }).open)); event.preventDefault();
    }, { once: true }));
    await close.click(); await expect(custom).toHaveAttribute('data-staged-open', 'false'); await expect(custom).toHaveJSProperty('open', true);
    await close.click(); await expect(custom).toHaveJSProperty('open', false); await expect(entries[0].frame).not.toBeVisible();
    observations.publicOverrides = { inheritedSpecificBackground: '#102030', inheritedGradient: ['#102030', '#405060'], inheritedPadding: '10px 12px 14px 18px', genericAfterStatusReset: '#405060', partBackground: '#708090', partPadding: '8px 10px', restored: true };
    observations.interaction = { canceledDismissal: true, acceptedDismissal: true, minimumCloseTarget: 24, forcedColors: emulationLimits.forcedColors[browserName] ?? 'verified' };
    await evidence(info, `web-awesome-inspired-${appearance}-toast-rail`, page.locator('#wa-toast-fidelity'), observations);
  });
}

// Spectrum 2 1.7.1, pinned by references above: Checkbox.tsx 155–185,
// Switch.tsx 142–170, RadioGroup.tsx 293–307 and spectrum-theme.ts 241–249.
// These literals describe the default neutral flavor. Hover, keyboard focus and
// press all advance baseColor by one stop; visible invalidity uses negative.
// Our checkbox's matching filled border paints the same source box, and our
// radio uses a filled plate plus a 4px aperture for the source's thick ring.
const spectrumChoicePaint = {
  light: { surface: 'rgb(255, 255, 255)', neutral: 'rgb(41, 41, 41)', interactive: 'rgb(19, 19, 19)', invalid: 'rgb(215, 50, 32)', invalidInteractive: 'rgb(183, 40, 24)', disabled: 'rgb(198, 198, 198)' },
  dark: { surface: 'rgb(17, 17, 17)', neutral: 'rgb(219, 219, 219)', interactive: 'rgb(242, 242, 242)', invalid: 'rgb(252, 67, 46)', invalidInteractive: 'rgb(255, 103, 86)', disabled: 'rgb(68, 68, 68)' },
} as const;
type SpectrumChoiceKind = 'checkbox' | 'switch' | 'radio';
type SpectrumChoiceState = { checked: boolean; mixed?: boolean; invalid?: boolean; disabled?: boolean };
type SpectrumChoiceProbe = { kind: SpectrumChoiceKind; owner: Locator; control: Locator; label: Locator; labelText: Locator; text: Locator; sentinel: Locator; fieldset: Locator };

function spectrumChoiceProbe(region: Locator, kind: SpectrumChoiceKind, delivery: 'custom' | 'native'): SpectrumChoiceProbe {
  const fieldset = region.locator(`:scope > [data-choice="${kind}-${delivery}"]`), owner = fieldset.locator('[data-choice-owner]');
  return { kind, owner, fieldset, control: delivery === 'custom' ? part(owner, 'control') : owner,
    label: delivery === 'custom' ? part(owner, 'label') : fieldset.locator('label'),
    labelText: delivery === 'custom' ? part(owner, 'label-text') : fieldset.locator('.en-label'),
    text: fieldset.locator('[data-choice-text]'), sentinel: fieldset.locator('[data-choice-sentinel]') };
}
async function spectrumChoiceState(probe: SpectrumChoiceProbe, state: SpectrumChoiceState) {
  await probe.owner.evaluate(async (element, next) => {
    const owner = element as HTMLElement & { checked: boolean; indeterminate: boolean; disabled: boolean; error: string; updateComplete?: Promise<unknown> };
    owner.checked = next.checked; owner.disabled = Boolean(next.disabled);
    if (owner instanceof HTMLInputElement || owner.localName === 'en-checkbox') owner.indeterminate = Boolean(next.mixed);
    if (owner instanceof HTMLInputElement) {
      if (next.invalid) owner.setAttribute('aria-invalid', 'true'); else owner.removeAttribute('aria-invalid');
    } else owner.error = next.invalid ? 'This choice is unavailable' : '';
    await owner.updateComplete;
  }, state);
  await expect(probe.control).toHaveJSProperty('checked', state.checked);
  await expect(probe.control).toHaveJSProperty('indeterminate', Boolean(state.mixed));
  if (state.invalid) await expect(probe.control).toHaveAttribute('aria-invalid', 'true');
}
// Source disabled choices change colors without fading the glyph. Opacity on
// a label, custom host or other composed ancestor would leave computed colors
// unchanged while rendering a different result, so inspect the complete chain.
async function spectrumChoiceOpacity(probe: SpectrumChoiceProbe) {
  const opacity = await probe.control.evaluate(element => {
    const chain: { node: string; opacity: number }[] = [];
    for (let node: Element | null = element; node;) {
      chain.push({ node: node.localName, opacity: Number(getComputedStyle(node).opacity) });
      const root = node.getRootNode();
      node = (node as HTMLElement).assignedSlot ?? node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    }
    const effective = chain.reduce((product, entry) => product * entry.opacity, 1);
    return { chain, effective, markEffective: effective * Number(getComputedStyle(element, '::before').opacity) };
  });
  expect(opacity.effective, `Disabled source glyph remains fully opaque through ${JSON.stringify(opacity.chain)}`).toBe(1);
  expect(opacity.markEffective, 'Disabled check, aperture or switch thumb retains full composed opacity').toBe(1);
}
// Core focus composes an outer zero-width halo with the pressed shadow, so
// engines may serialize two invisible layers instead of `none`. Accept only
// those zero-geometry outer layers: any inset, offset, blur or spread fails.
async function spectrumChoiceNoShadow(control: Locator, pseudo?: string) {
  const value = (await style(control, ['box-shadow'], pseudo))['box-shadow'].trim();
  if (value === 'none') return;
  const layers = value.replace(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|\btransparent\b/gi, 'COLOR').split(',');
  expect(layers.length, `Only the core's invisible focus/press layers are allowed: ${value}`).toBeLessThanOrEqual(pseudo ? 1 : 2);
  for (const layer of layers) {
    expect(layer.match(/COLOR/g)?.length, `Each shadow layer has one parsed color: ${value}`).toBe(1);
    const geometry = layer.replace('COLOR', '').trim().split(/\s+/);
    expect(geometry.length, value).toBeGreaterThanOrEqual(2);
    expect(geometry.length, value).toBeLessThanOrEqual(4);
    expect(geometry.every(length => /^[+-]?(?:0+(?:\.0*)?|\.0+)(?:px)?$/i.test(length)),
      `Source choices have no visible shadow geometry: ${value}`).toBe(true);
  }
}
async function spectrumChoiceExpected(probe: SpectrumChoiceProbe, appearance: Appearance, state: SpectrumChoiceState, interactive = false, borderOverride?: string) {
  const source = spectrumChoicePaint[appearance], selected = state.checked || Boolean(state.mixed);
  const ink = state.disabled ? source.disabled : state.invalid && probe.kind !== 'switch'
    ? interactive ? source.invalidInteractive : source.invalid : interactive ? source.interactive : source.neutral;
  await metrics(probe.control, {
    'background-color': selected ? ink : source.surface,
    'border-top-color': borderOverride ?? (probe.kind === 'switch' && selected ? 'rgba(0, 0, 0, 0)' : ink),
  });
  if (probe.kind === 'switch') await metrics(probe.control, { 'background-color': selected ? source.surface : ink }, '::before');
  else if (selected && probe.kind === 'checkbox') await metrics(probe.control, { 'border-bottom-color': source.surface }, '::before');
  else if (selected) await metrics(probe.control, { 'background-color': source.surface, width: 4, height: 4 }, '::before');
  // Source wrapper text stays neutral during invalidity; only the glyph is red.
  await metrics(probe.labelText, { color: state.disabled ? source.disabled : interactive ? source.interactive : source.neutral, opacity: '1', 'font-weight': '400' });
  await spectrumChoiceNoShadow(probe.control);
  if (probe.kind === 'switch') await spectrumChoiceNoShadow(probe.control, '::before');
  if (state.disabled) await spectrumChoiceOpacity(probe);
}
async function spectrumChoiceKeyboard(page: Page, probe: SpectrumChoiceProbe, browserName: string) {
  // Match the documented WebKit native traversal convention used by showcase.spec.ts.
  await page.mouse.move(0, 0); await probe.sentinel.focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(probe.control).toBeFocused();
  expect(await probe.control.evaluate(element => element.matches(':focus-visible')), 'Real keyboard navigation selects the focus-visible state').toBe(true);
}

// Exercise public state hooks, direct Parts and exact partial-theme output.
async function spectrumChoiceLabelOverrides(page: Page, probe: SpectrumChoiceProbe, appearance: Appearance, delivery: 'custom' | 'native', browserName: string) {
  const hooks = {
    rest: { name: '--en-choice-label-color', hex: '#315273', rgb: 'rgb(49, 82, 115)' },
    hover: { name: '--en-choice-label-hover-color', hex: '#507132', rgb: 'rgb(80, 113, 50)' },
    focus: { name: '--en-choice-label-focus-color', hex: '#734f92', rgb: 'rgb(115, 79, 146)' },
    pressed: { name: '--en-choice-label-pressed-color', hex: '#90603d', rgb: 'rgb(144, 96, 61)' },
    disabled: { name: '--en-choice-label-disabled-color', hex: '#506172', rgb: 'rgb(80, 97, 114)' },
  } as const;
  type Phase = keyof typeof hooks;
  const phases = Object.keys(hooks) as Phase[], names = phases.map(phase => hooks[phase].name);
  const source = spectrumChoicePaint[appearance];
  const partialScope = delivery === 'custom' ? probe.owner : probe.label;
  const marker = 'data-spectrum-choice-label-override', markerValue = `${appearance}-${probe.kind}-${delivery}`;
  const previousMarker = await partialScope.getAttribute(marker);
  const previousHooks = await probe.fieldset.evaluate((element, names) => names.map(name => ({
    name, value: (element as HTMLElement).style.getPropertyValue(name), priority: (element as HTMLElement).style.getPropertyPriority(name),
  })), names);
  const previousFieldsetDisabled = await probe.fieldset.evaluate(element => (element as HTMLFieldSetElement).disabled);
  const previousOwner = await probe.owner.evaluate(element => {
    const owner = element as HTMLElement & { checked: boolean; indeterminate: boolean; disabled: boolean; error?: string };
    return { checked: owner.checked, mixed: Boolean(owner.indeterminate), disabled: owner.disabled, error: owner.error,
      ariaDisabled: owner.getAttribute('aria-disabled'), ariaInvalid: owner.getAttribute('aria-invalid') };
  });
  const authoredSheets: Awaited<ReturnType<Page['addStyleTag']>>[] = [];
  const pins = async (values: Record<string, string>) => {
    // The input and native label text are siblings. Put inherited pins on their
    // common fieldset, never solely on the input.
    await probe.fieldset.evaluate((element, args) => {
      const scope = element as HTMLElement;
      for (const name of args.names) scope.style.removeProperty(name);
      for (const [name, value] of Object.entries(args.values)) scope.style.setProperty(name, value);
    }, { names, values });
  };
  const observe = async (phase: Phase, color: string) => {
    // Invalidity intentionally remains present: it changes the source glyph,
    // while these hooks independently own the associated label's neutral ink.
    await spectrumChoiceState(probe, { checked: true, invalid: true, disabled: phase === 'disabled' });
    await probe.control.blur(); await page.mouse.move(0, 0);
    if (phase === 'focus') {
      await spectrumChoiceKeyboard(page, probe, browserName); await probe.text.hover();
      await metrics(probe.labelText, { color });
    } else if (phase === 'pressed') {
      await spectrumChoiceKeyboard(page, probe, browserName);
      await hold(page, probe.text, async () => { await metrics(probe.labelText, { color }); });
    } else if (phase === 'disabled') {
      await expect(probe.control).toBeDisabled(); await probe.text.hover();
      await metrics(probe.labelText, { color });
      await hold(page, probe.text, async () => { await metrics(probe.labelText, { color }); });
    } else {
      if (phase === 'hover') await probe.text.hover();
      await metrics(probe.labelText, { color });
    }
  };
  try {
    await probe.fieldset.evaluate(element => { (element as HTMLFieldSetElement).disabled = false; });
    await probe.owner.evaluate(element => element.removeAttribute('aria-disabled'));
    await partialScope.evaluate((element, args) => element.setAttribute(args.marker, args.value), { marker, value: markerValue });
    // One hook at a time proves each public name is consumed by its own state.
    // State-specific pins also leave the resting label at its source color.
    for (const phase of phases) {
      await pins({ [hooks[phase].name]: hooks[phase].hex });
      if (phase !== 'rest') await observe('rest', source.neutral);
      await observe(phase, hooks[phase].rgb);
      await pins({});
      await observe(phase, phase === 'disabled' ? source.disabled : phase === 'rest' ? source.neutral : source.interactive);
    }
    // All five inherited values differ, so this verifies rendered preservation
    // rather than merely inspecting custom-property declarations. The emitted
    // partial sits below those inline ancestor pins; no inline declaration on
    // the partial scope can mask whether the selected token was emitted.
    await pins(Object.fromEntries(phases.map(phase => [hooks[phase].name, hooks[phase].hex])));
    const selector = `[${marker}="${markerValue}"]`;
    const partial = resolveTheme({ name: 'spectrum-choice-label-partial', mode: appearance,
      pins: { 'component.choice.label-hover-color': colorFromHex('#274869') } });
    const partialSheet = await page.addStyleTag({ content: emitThemeCSS(partial, {
      kind: 'partial', tokenIds: ['component.choice.label-hover-color'], selector,
    }) });
    authoredSheets.push(partialSheet);
    for (const phase of phases) await observe(phase, phase === 'hover' ? 'rgb(39, 72, 105)' : hooks[phase].rgb);
    if (delivery === 'custom') {
      // Direct author styling of the documented text Part wins over semantic
      // hooks, including pressed and disabled declarations in the component.
      const partSheet = await page.addStyleTag({ content: `${selector}::part(label-text) { color: #986f35; }` });
      authoredSheets.push(partSheet);
      await observe('pressed', 'rgb(152, 111, 53)');
      await observe('disabled', 'rgb(152, 111, 53)');
      await partSheet.evaluate(element => element.parentNode?.removeChild(element));
      await observe('pressed', hooks.pressed.rgb);
    }
    await partialSheet.evaluate(element => element.parentNode?.removeChild(element));
    await observe('hover', hooks.hover.rgb);
    await pins({}); await observe('rest', source.neutral);
  } finally {
    for (const stylesheet of authoredSheets.reverse()) await stylesheet.evaluate(element => element.parentNode?.removeChild(element));
    await partialScope.evaluate((element, args) => {
      if (args.value === null) element.removeAttribute(args.marker); else element.setAttribute(args.marker, args.value);
    }, { marker, value: previousMarker });
    await probe.fieldset.evaluate((element, previous) => {
      const fieldset = element as HTMLFieldSetElement;
      for (const hook of previous.hooks) {
        if (hook.value) fieldset.style.setProperty(hook.name, hook.value, hook.priority); else fieldset.style.removeProperty(hook.name);
      }
      fieldset.disabled = previous.disabled;
    }, { hooks: previousHooks, disabled: previousFieldsetDisabled });
    await probe.owner.evaluate(async (element, previous) => {
      const owner = element as HTMLElement & { checked: boolean; indeterminate: boolean; disabled: boolean; error?: string; updateComplete?: Promise<unknown> };
      owner.checked = previous.checked; owner.indeterminate = previous.mixed; owner.disabled = previous.disabled;
      if (previous.error !== undefined) owner.error = previous.error;
      for (const [name, value] of Object.entries({ 'aria-disabled': previous.ariaDisabled, 'aria-invalid': previous.ariaInvalid })) {
        if (value === null) owner.removeAttribute(name); else owner.setAttribute(name, value);
      }
      await owner.updateComplete;
    }, previousOwner);
    await probe.control.blur(); await page.mouse.move(0, 0);
  }
}

for (const appearance of ['light', 'dark'] as const) {
  test(`spectrum-inspired ${appearance}: default choice paint follows source interaction and disabled precedence`, async ({ page, browserName, exportedCSS }, info) => {
    test.setTimeout(120_000);
    // This page registers the public catalogue. Each probe authors only public
    // elements, Parts and portable native classes, including group-label hover.
    await page.goto('/component-patterns?progress-report');
    await expect(page.locator('en-toggle-button').first().getByRole('button')).toBeVisible();
    await nativeStyles(page, info);
    await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'spectrum-choice-child', mode: appearance }), { selector: '[data-en-theme="spectrum-choice-child"]', colorScheme: true }) });
    await page.evaluate(async appearance => {
      const kinds = ['checkbox', 'switch', 'radio'];
      await Promise.all([...kinds.map(kind => `en-${kind}`), 'en-radio-group'].map(name => customElements.whenDefined(name)));
      const fixture = document.createElement('section'); fixture.id = 'spectrum-choice-fidelity';
      fixture.style.cssText = 'padding:24px;display:grid;gap:24px;max-inline-size:800px';
      const region = (id: string, theme: string) => {
        const section = document.createElement('section'); section.id = id; section.className = 'en-foundation';
        section.dataset.enTheme = theme; section.dataset.enAppearance = appearance;
        section.innerHTML = kinds.flatMap(kind => ['custom', 'native'].map(delivery => {
          const label = `${id} ${kind} ${delivery}`;
          const owner = delivery === 'custom' ? `<en-${kind} data-choice-owner><span data-choice-text>${label}</span></en-${kind}>`
            : `<div class="en-choice-group"><label class="en-choice"><input data-choice-owner class="en-${kind}" type="${kind === 'radio' ? 'radio' : 'checkbox'}" ${kind === 'switch' ? 'role="switch"' : ''} name="${id}-${kind}"><span class="en-label" data-choice-text>${label}</span></label></div>`;
          return `<fieldset data-choice="${kind}-${delivery}" style="border:0;padding:0;margin:0"><button type="button" data-choice-sentinel>Focus ${label}</button>${owner}</fieldset>`;
        })).join('');
        return section;
      };
      const source = region('spectrum-choice-source', 'spectrum-inspired');
      source.insertAdjacentHTML('beforeend', '<en-radio-group data-label-radio-group label="Label state group" value="first"><en-radio value="first">First grouped choice</en-radio><en-radio value="second">Second grouped choice</en-radio></en-radio-group>');
      source.append(region('spectrum-choice-nested', 'spectrum-choice-child'));
      fixture.append(source, region('spectrum-choice-reference', 'spectrum-choice-child'));
      document.body.append(fixture);
      await Promise.all([...fixture.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('[data-choice-owner]')].map(owner => owner.updateComplete));
    }, appearance);
    await mountExportedCSS(page, exportedCSS['spectrum-inspired']);
    const region = page.locator('#spectrum-choice-source');
    for (const kind of ['checkbox', 'switch', 'radio'] as const) for (const delivery of ['custom', 'native'] as const) {
      const probe = spectrumChoiceProbe(region, kind, delivery);
      await test.step(`${kind} ${delivery}: source state transitions`, async () => {
        const selections = kind === 'checkbox' ? [false, true, 'mixed'] as const : [false, true] as const;
        for (const selection of selections) for (const invalid of kind === 'switch' ? [false] : [false, true]) {
          const state = { checked: selection === true, mixed: selection === 'mixed', invalid };
          await probe.control.blur(); await page.mouse.move(0, 0); await spectrumChoiceState(probe, state);
          await spectrumChoiceExpected(probe, appearance, state);
          await probe.control.hover(); await spectrumChoiceExpected(probe, appearance, state, true);
          await probe.text.hover(); await spectrumChoiceExpected(probe, appearance, state, true);
          const [labelBox, controlBox] = await Promise.all([probe.text.boundingBox(), probe.control.boundingBox()]);
          if (!labelBox || !controlBox) throw new Error('The associated label text and visual choice need visible boxes');
          expect(labelBox.x + labelBox.width / 2 > controlBox.x + controlBox.width,
            'Label hover and press exercise a point outside the visual control').toBe(true);
          await hold(page, probe.text, async () => { await spectrumChoiceExpected(probe, appearance, state, true); });
          // Pointer release may toggle or clear mixed state. Restore the public
          // value before independently entering the keyboard-focus state.
          await spectrumChoiceState(probe, state); await spectrumChoiceKeyboard(page, probe, browserName);
          await spectrumChoiceExpected(probe, appearance, state, true);
          const focus = await style(probe.control, ['outline-style', 'outline-width']);
          expect(focus['outline-style'], 'Keyboard focus retains its visible contour').not.toBe('none');
          expect(parseFloat(focus['outline-width'])).toBeGreaterThan(0);
        }
        // Clicking establishes pointer modality; focus() also covers engines
        // that do not focus checkbox/radio controls automatically on a click.
        const mouseState = { checked: true, invalid: kind !== 'switch' };
        await probe.control.blur(); await probe.control.click(); await probe.control.focus();
        await page.mouse.move(0, 0); await spectrumChoiceState(probe, mouseState);
        await expect(probe.control).toBeFocused();
        expect(await probe.control.evaluate(element => element.matches(':focus-visible')),
          'Ordinary pointer focus does not select keyboard label or glyph paint').toBe(false);
        await spectrumChoiceExpected(probe, appearance, mouseState);
        const labelBox = await probe.label.boundingBox();
        expect(labelBox?.height, 'The small source glyph retains a protected label target').toBeGreaterThanOrEqual(24);
        await metrics(probe.control, { width: kind === 'switch' ? 26 : 16, height: 16 });
        if (kind === 'checkbox') {
          // The source refinement is declared on the host/native choice; a
          // local public typography override at that same boundary must win.
          const labelScope = delivery === 'custom' ? probe.owner : probe.label;
          await labelScope.evaluate(element => { (element as HTMLElement).style.setProperty('--en-font-label-strong-weight', '700'); });
          try { await metrics(probe.labelText, { 'font-weight': '700' }); }
          finally { await labelScope.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-font-label-strong-weight'); }); }
          await metrics(probe.labelText, { 'font-weight': '400' });
        }

        // A local documented hook wins the pressed rim while source paint
        // continues to own the plate/track. Exercise the invalid branch too.
        const selected = { checked: true, invalid: kind !== 'switch' };
        await probe.control.blur(); await spectrumChoiceState(probe, selected);
        await probe.owner.evaluate((element, kind) => { (element as HTMLElement).style.setProperty(`--en-${kind}-pressed-border-color`, '#315273'); }, kind);
        await hold(page, probe.text, async () => { await spectrumChoiceExpected(probe, appearance, selected, true, 'rgb(49, 82, 115)'); });
        await probe.owner.evaluate((element, kind) => { (element as HTMLElement).style.removeProperty(`--en-${kind}-pressed-border-color`); }, kind);
        if (kind === 'checkbox') {
          await spectrumChoiceState(probe, selected);
          await probe.owner.evaluate(element => { (element as HTMLElement).style.setProperty('--en-checkbox-pressed-shadow', 'inset 0 0 0 2px #315273'); });
          await hold(page, probe.text, async () => {
            expect((await style(probe.control, ['box-shadow']))['box-shadow'], 'A documented local shadow override wins the source default')
              .toContain('rgb(49, 82, 115) 0px 0px 0px 2px inset');
          });
          await probe.owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-checkbox-pressed-shadow'); });
        }
        if (kind === 'radio') {
          await spectrumChoiceState(probe, selected);
          await probe.owner.evaluate(element => { (element as HTMLElement).style.setProperty('--en-radio-selected-color', '#274869'); });
          const selectedOverride = async () => {
            await metrics(probe.control, { 'background-color': 'rgb(39, 72, 105)', 'border-top-color': 'rgb(39, 72, 105)' });
            await metrics(probe.control, { 'background-color': spectrumChoicePaint[appearance].surface }, '::before');
          };
          await probe.text.hover(); await selectedOverride();
          await hold(page, probe.text, selectedOverride);
          await probe.owner.evaluate(element => { (element as HTMLElement).style.removeProperty('--en-radio-selected-color'); });
        }

        // Disabled wins over visible application error, selection and pointer
        // interaction. Native disabled fieldsets must also disable the custom
        // FACE control even though its own disabled property remains false.
        for (const checked of [false, true]) {
          const state = { checked, invalid: kind !== 'switch', disabled: true };
          await spectrumChoiceState(probe, state); await expect(probe.control).toBeDisabled();
          await page.mouse.move(0, 0); await spectrumChoiceExpected(probe, appearance, state);
          await probe.text.hover(); await spectrumChoiceExpected(probe, appearance, state, true);
          await hold(page, probe.text, async () => { await spectrumChoiceExpected(probe, appearance, state, true); });
        }
        const disabledMixed = { checked: false, mixed: kind === 'checkbox', invalid: kind !== 'switch', disabled: true };
        if (kind === 'checkbox') {
          await spectrumChoiceState(probe, disabledMixed);
          await spectrumChoiceExpected(probe, appearance, disabledMixed);
        }
        const fieldsetState = { checked: true, invalid: kind !== 'switch' };
        await spectrumChoiceState(probe, fieldsetState);
        await probe.fieldset.evaluate(element => { (element as HTMLFieldSetElement).disabled = true; });
        await expect(probe.control).toBeDisabled(); await expect(probe.owner).toHaveJSProperty('disabled', false);
        await hold(page, probe.text, async () => { await spectrumChoiceExpected(probe, appearance, { ...fieldsetState, disabled: true }, true); });
        await probe.fieldset.evaluate(element => { (element as HTMLFieldSetElement).disabled = false; });
        await expect(probe.control).toBeEnabled(); await probe.control.blur(); await page.mouse.move(0, 0);
        await spectrumChoiceExpected(probe, appearance, fieldsetState);
        // ARIA disabled also owns presentation when the native input remains
        // enabled. In particular, the native group-hover recipe must not leak.
        await probe.owner.evaluate(element => element.setAttribute('aria-disabled', 'true'));
        expect(await probe.control.evaluate(element => element.matches(':disabled'))).toBe(false);
        await probe.text.hover();
        await spectrumChoiceExpected(probe, appearance, { ...fieldsetState, disabled: true }, true);
        await hold(page, probe.text, async () => { await spectrumChoiceExpected(probe, appearance, { ...fieldsetState, disabled: true }, true); });
        await probe.owner.evaluate(element => element.removeAttribute('aria-disabled'));
        await spectrumChoiceState(probe, fieldsetState); await probe.control.blur(); await page.mouse.move(0, 0);
        await spectrumChoiceExpected(probe, appearance, fieldsetState);
        if (kind === 'checkbox') await spectrumChoiceLabelOverrides(page, probe, appearance, delivery, browserName);
      });
    }

    // Group-disabled radios keep their own property false while their actual
    // inputs own disabled state; label paint must follow those inputs too.
    const group = page.locator('#spectrum-choice-source > en-radio-group');
    await group.evaluate(async element => {
      const owner = element as HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> };
      owner.disabled = true; await owner.updateComplete;
    });
    for (const radio of await group.locator('en-radio').all()) {
      await expect(radio).toHaveJSProperty('disabled', false);
      await expect(part(radio, 'control')).toBeDisabled();
      await part(radio, 'label-text').hover();
      await hold(page, part(radio, 'label-text'), async () => {
        await metrics(part(radio, 'label-text'), { color: spectrumChoicePaint[appearance].disabled, opacity: '1' });
      });
    }
    await group.evaluate(async element => {
      const owner = element as HTMLElement & { disabled: boolean; updateComplete: Promise<unknown> };
      owner.disabled = false; await owner.updateComplete;
    });
    await page.mouse.move(0, 0);
    for (const radio of await group.locator('en-radio').all()) {
      await expect(part(radio, 'control')).toBeEnabled();
      await metrics(part(radio, 'label-text'), { color: spectrumChoicePaint[appearance].neutral });
    }

    // A complete child theme remains independent of ancestor Spectrum paint in
    // the very interaction states above, for native and custom controls alike.
    const signature = async (probe: SpectrumChoiceProbe) => ({
      label: await style(probe.labelText, ['color', 'font-weight']),
      control: await style(probe.control, ['background-color', 'border-top-color']),
      mark: await style(probe.control, ['background-color', 'border-bottom-color'], '::before'),
    });
    for (const kind of ['checkbox', 'switch', 'radio'] as const) for (const delivery of ['custom', 'native'] as const) {
      const nested = spectrumChoiceProbe(page.locator('#spectrum-choice-nested'), kind, delivery);
      const reference = spectrumChoiceProbe(page.locator('#spectrum-choice-reference'), kind, delivery);
      const state = { checked: true, invalid: kind !== 'switch' };
      for (const probe of [nested, reference]) await spectrumChoiceState(probe, state);
      await page.mouse.move(0, 0);
      expect(await signature(nested), `${kind} ${delivery}: a child full theme owns resting paint`).toEqual(await signature(reference));
      for (const phase of ['hover', 'focus', 'held', 'disabled'] as const) {
        const paints: Awaited<ReturnType<typeof signature>>[] = [];
        for (const probe of [nested, reference]) {
          await probe.control.blur(); await page.mouse.move(0, 0); await spectrumChoiceState(probe, { ...state, disabled: phase === 'disabled' });
          if (phase === 'disabled') { await expect(probe.control).toBeDisabled(); paints.push(await signature(probe)); }
          else if (phase === 'hover') { await probe.text.hover(); paints.push(await signature(probe)); }
          else if (phase === 'focus') { await spectrumChoiceKeyboard(page, probe, browserName); paints.push(await signature(probe)); }
          else await hold(page, probe.text, async () => { paints.push(await signature(probe)); });
        }
        expect(paints[0], `${kind} ${delivery}: a child full theme owns ${phase} paint`).toEqual(paints[1]);
      }
    }
    await evidence(info, `spectrum-${appearance}-choice-states`, page.locator('#spectrum-choice-fidelity'), {
      source: references['spectrum-inspired'].url, literals: { ...spectrumChoicePaint[appearance], labelWeight: 400 },
      coverage: 'Native and custom checkbox (unchecked, checked, mixed), radio and switch; rest, direct/label hover, keyboard focus-visible, label press, local pressed border and selected-radio hooks, invalid and disabled precedence, disabled fieldset, ARIA disabled presentation, exact composed glyph/mark opacity, absence of visible default shadows and a local pressed-shadow override, source label states including mouse/keyboard focus distinction and group disabling, regular source label weight, local typography overrides, five public label hooks, Part precedence, partial-pin preservation, child full-theme label paint and typography isolation.',
      adaptations: 'Matching filled checkbox border; filled radio plate with a 4px surface aperture; protected associated label target. Existing six-theme forced-colors tests remain complementary evidence.',
    });
  });
}


async function radixDefaultTabs(page: Page, appearance: Appearance, css: string, info: TestInfo) {
  // Independent Themes 3.3.0 BaseTabList default size 2: no list gap, 40px
  // visual minimum, 14/20px labels and -.01em tracking on selected labels.
  const tabs = specimen(page).locator('en-tabs');
  const customSelected = tabs.locator('en-tab[aria-selected="true"]'), customRest = tabs.locator('en-tab[aria-selected="false"]').first();
  await metrics(part(tabs, 'tab-list'), { gap: 0 });
  for (const host of [customSelected, customRest]) await metrics(part(host, 'base'), {
    height: 40, 'min-block-size': 40, 'font-size': 14, 'line-height': 20, 'padding-inline-start': 16, 'padding-top': 8,
  });
  await metrics(part(customSelected, 'base'), { 'letter-spacing': -.14 });
  expect(['normal', '0px']).toContain((await style(part(customRest, 'base'), ['letter-spacing']))['letter-spacing']);
  await nativeStyles(page, info); await mountExportedCSS(page, css);
  await specimen(page).evaluate((element, mode) => {
    const region = document.createElement('section'); region.id = 'radix-default-tabs'; region.className = 'en-foundation';
    region.innerHTML = `<div class="en-tab-list" role="tablist" aria-label="Native Radix default tabs" data-en-theme="radix-inspired" data-en-appearance="${mode}"><button class="en-tab" role="tab" aria-selected="true">Native design</button><button class="en-tab" role="tab" aria-selected="false">Native layout</button></div><div data-en-theme="local-tab-boundary" style="--en-space-1:7px;--en-control-min-size:33px"><div class="en-tab-list" role="tablist" aria-label="Independent nested tabs"><button class="en-tab" role="tab" aria-selected="true">Nested design</button></div></div>`;
    region.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.getAttribute('role') === 'tab') for (const tab of target.parentElement!.querySelectorAll('[role="tab"]')) tab.setAttribute('aria-selected', String(tab === target));
    });
    element.append(region);
  }, appearance);
  const native = page.locator('#radix-default-tabs'), nativeList = native.getByRole('tablist', { name: 'Native Radix default tabs', exact: true });
  const nativeDesign = nativeList.getByRole('tab', { name: 'Native design', exact: true }), nativeLayout = nativeList.getByRole('tab', { name: 'Native layout', exact: true });
  await metrics(nativeList, { gap: 0 });
  for (const tab of [nativeDesign, nativeLayout]) await metrics(tab, { height: 40, 'min-block-size': 40, 'font-size': 14, 'line-height': 20 });
  await metrics(nativeDesign, { 'letter-spacing': -.14 });
  await nativeLayout.click(); await expect(nativeLayout).toHaveAttribute('aria-selected', 'true');
  await metrics(nativeLayout, { 'letter-spacing': -.14 });
  expect(['normal', '0px']).toContain((await style(nativeDesign, ['letter-spacing']))['letter-spacing']);
  await metrics(native.getByRole('tablist', { name: 'Independent nested tabs', exact: true }), { gap: 7 });
  await metrics(native.getByRole('tab', { name: 'Nested design', exact: true }), { 'min-block-size': 33 });

  // Inherited and local documented hooks remain authoritative in both routes.
  await specimen(page).evaluate(element => (element as HTMLElement).style.setProperty('--en-control-min-size', '52px'));
  // The native list owns a full-theme boundary: its hook must originate there,
  // then inherit into the tab instead of crossing the intentional full reset.
  await nativeList.evaluate(element => (element as HTMLElement).style.setProperty('--en-control-min-size', '52px'));
  await metrics(part(customSelected, 'base'), { height: 52, 'min-block-size': 52 });
  await metrics(nativeLayout, { height: 52, 'min-block-size': 52 });
  await customSelected.evaluate(element => (element as HTMLElement).style.setProperty('--en-control-min-size', '56px'));
  await nativeLayout.evaluate(element => (element as HTMLElement).style.setProperty('--en-control-min-size', '56px'));
  await metrics(part(customSelected, 'base'), { height: 56 }); await metrics(nativeLayout, { height: 56 });
  await customSelected.evaluate(element => (element as HTMLElement).style.removeProperty('--en-control-min-size'));
  await nativeLayout.evaluate(element => (element as HTMLElement).style.removeProperty('--en-control-min-size'));
  await specimen(page).evaluate(element => (element as HTMLElement).style.removeProperty('--en-control-min-size'));
  await nativeList.evaluate(element => (element as HTMLElement).style.removeProperty('--en-control-min-size'));

  // Logical minimum/gap and selected tracking stay the same in RTL.
  await tabs.evaluate(element => element.setAttribute('dir', 'rtl')); await nativeList.evaluate(element => element.setAttribute('dir', 'rtl'));
  await metrics(part(tabs, 'tab-list'), { gap: 0 }); await metrics(nativeList, { gap: 0 });
  await metrics(part(customSelected, 'base'), { height: 40, 'letter-spacing': -.14 });
  await metrics(nativeLayout, { height: 40, 'letter-spacing': -.14 });
  await tabs.evaluate(element => element.removeAttribute('dir')); await nativeList.evaluate(element => element.removeAttribute('dir'));

  await tabs.evaluate(element => element.classList.add('radix-font-probe'));
  const fontProbe = await page.addStyleTag({ content: '.radix-font-probe en-tab::part(base), #radix-default-tabs > .en-tab-list > .en-tab { font-size: 20px; line-height: 24px; }' });
  await metrics(part(customSelected, 'base'), { height: 42, 'letter-spacing': -.2 });
  await metrics(nativeLayout, { height: 42, 'letter-spacing': -.2 });
  const trackingProbe = await page.addStyleTag({ content: '.radix-font-probe en-tab::part(base), #radix-default-tabs > .en-tab-list > .en-tab { letter-spacing: .03em; }' });
  await metrics(part(customSelected, 'base'), { 'letter-spacing': .6 }); await metrics(nativeLayout, { 'letter-spacing': .6 });
  await trackingProbe.evaluate(element => (element as HTMLStyleElement).remove()); await fontProbe.evaluate(element => (element as HTMLStyleElement).remove());
  await tabs.evaluate(element => element.classList.remove('radix-font-probe'));
  await evidence(info, `radix-inspired-${appearance}-default-tabs`, tabs, {
    source: { gap: 0, defaultSize: 2, minimum: 40, font: 14, leading: 20, selectedTrackingEm: -.01 },
    selected: await style(part(customSelected, 'base'), ['height', 'min-block-size', 'letter-spacing']),
    nativeSelected: await style(nativeLayout, ['height', 'min-block-size', 'letter-spacing']),
  });
}
