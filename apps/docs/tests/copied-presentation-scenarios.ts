import { expect, type Page } from '@playwright/test';

/** Presentation is part of a copied example's contract: a mounted element alone
 * does not prove the authored geometry, theme boundary or focus recipe survived.
 */
export const presentationGalleryScenarios: Array<{
 id: string; entry: string; elements: string[]; contract: string;
 run(page: Page): Promise<void>;
}> = [
 {
  id: 'swatches', entry: 'swatchesExample', elements: ['swatch'],
  contract: 'Standalone swatch geometry and native keyboard copy, with explicit permission-dependent feedback',
  async run(page) {
   const sample = page.getByRole('group', { name: 'Action color', exact: true });
   await expect(sample).toHaveCSS('display', 'grid');
   const reference = sample.locator('code'); await expect(reference).toHaveText('var(--en-color-action)');
   const button = page.getByRole('button', { name: 'Copy Action color CSS reference', exact: true });
   const chromium = page.context().browser()?.browserType().name() === 'chromium';
   if (chromium) await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
   await button.focus(); await button.press('Enter');
   await expect(sample).toHaveAttribute('data-copy-state', /^(success|failure)$/);
   if (chromium) {
    await expect(sample).toHaveAttribute('data-copy-state', 'success');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('var(--en-color-action)');
   }
   const copied = await sample.getAttribute('data-copy-state') === 'success';
   await expect(sample.getByRole('status')).toHaveText(copied ? 'CSS reference copied.' : 'Could not copy. Select and copy the CSS reference.');
   await expect(button).toBeFocused(); await expect(reference).toHaveCSS('user-select', 'text');
  },
 },
 {
  id: 'rhythm', entry: 'rhythmExample', elements: [],
  contract: 'Painted spacing bars scale monotonically; inset radius and padding survive copying',
  async run(page) {
   const bars = await page.locator('.spacing-ruler i').evaluateAll(nodes => nodes.map(node => {
    const css = getComputedStyle(node), rect = node.getBoundingClientRect();
    return { display: css.display, width: rect.width, height: rect.height, background: css.backgroundColor };
   }));
   expect(bars).toHaveLength(6);
   for (let index = 0; index < bars.length; index++) {
    const bar = bars[index]!; expect(bar.display).toBe('block'); expect(bar.height).toBeGreaterThan(0);
    expect(bar.background).not.toBe('rgba(0, 0, 0, 0)');
    if (index) expect(bar.width).toBeGreaterThan(bars[index - 1]!.width);
   }
   const geometry = await page.locator('.radius-outer').evaluate(outer => {
    const a = getComputedStyle(outer), b = getComputedStyle(outer.querySelector('.radius-inner')!);
    return { outer: parseFloat(a.borderTopLeftRadius), inner: parseFloat(b.borderTopLeftRadius), padding: parseFloat(a.paddingTop) };
   });
   expect(geometry.padding).toBeGreaterThan(0); expect(geometry.inner).toBe(Math.max(0, geometry.outer - geometry.padding));
   await page.setViewportSize({ width: 360, height: 800 });
   expect(await page.locator('.spacing-ruler').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  },
 },
 {
  id: 'identity', entry: 'identityExample', elements: ['avatar', 'badge', 'icon'],
  contract: 'Distinct avatar geometry, initials and accessible painted icons without docs layout',
  async run(page) {
   await expect(page.locator('en-avatar [part~="fallback"]')).toHaveText(['AL', 'MC', 'RS']);
   const frames = await page.locator('en-avatar [part~="base"]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
   expect(frames).toHaveLength(3); expect(frames[0]!).toBeLessThan(frames[1]!); expect(frames[1]!).toBeLessThan(frames[2]!);
   await expect(page.locator('.specimen-row').first()).toHaveCSS('display', 'flex');
   await expect(page.locator('.icon-row')).toHaveCSS('display', 'flex');
   for (const name of ['plus', 'check', 'close', 'search', 'arrow-right', 'chevron-down', 'info', 'warning', 'sparkles']) {
    await expect(page.getByRole('img', { name, exact: true })).toBeVisible();
    expect(await page.locator(`en-icon[name="${name}"] svg`).evaluate(svg => svg.children.length)).toBeGreaterThan(0);
   }
   await page.setViewportSize({ width: 320, height: 800 });
   expect(await page.locator('.icon-row').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  },
 },
 {
  id: 'loading', entry: 'loadingExample', elements: ['progress-bar', 'spinner', 'skeleton'],
  contract: 'Native determinate progress, task label and decorative two-column placeholder geometry',
  async run(page) {
   const progress = page.getByRole('progressbar', { name: 'Export progress', exact: true });
   await expect(progress).toHaveAttribute('value', '64'); await expect(progress).toHaveAttribute('max', '100');
   await expect(page.locator('.loading-row')).toHaveCSS('display', 'grid');
   const circle = page.locator('.loading-row > en-skeleton [part~="base"]');
   const bounds = await circle.boundingBox(); expect(bounds!.width).toBeGreaterThan(0); expect(bounds!.width).toBe(bounds!.height);
   const shapes = page.locator('en-skeleton [part~="base"]'); await expect(shapes).toHaveCount(3);
   for (const shape of await shapes.all()) await expect(shape).toHaveAttribute('aria-hidden', 'true');
   const columns = await page.locator('.loading-row').evaluate(node => {
    const first = node.children[0]!.getBoundingClientRect(), second = node.children[1]!.getBoundingClientRect();
    return { right: first.right, next: second.left, width: second.width };
   });
   expect(columns.next).toBeGreaterThan(columns.right); expect(columns.width).toBeGreaterThan(bounds!.width);
  },
 },
 {
  id: 'theme-scopes', entry: 'themeScopesExample', elements: ['card', 'button'],
  contract: 'Copied full child theme follows inverse appearance without leaking into page scope; responsive layout',
  async run(page) {
   const scopes = page.locator('.scope-sample');
   const paints = () => scopes.evaluateAll(nodes => nodes.map(node => ({ color: getComputedStyle(node).backgroundColor, scheme: getComputedStyle(node).colorScheme })));
   await page.emulateMedia({ colorScheme: 'light' });
   const light = await paints(); expect(light[0]!.color).not.toBe(light[1]!.color); expect(light[1]!.scheme).toBe('dark');
   await page.emulateMedia({ colorScheme: 'dark' });
   await expect.poll(async () => (await paints())[1]!.scheme).toBe('light');
   const dark = await paints(); expect(dark[1]!.color).not.toBe(light[1]!.color);
   await page.evaluate(() => document.documentElement.dataset.enAppearance = 'light');
   await expect.poll(async () => (await paints())[1]!.scheme).toBe('dark');
   await page.evaluate(() => document.documentElement.dataset.enAppearance = 'dark');
   await expect.poll(async () => (await paints())[1]!.scheme).toBe('light');
   await page.setViewportSize({ width: 360, height: 800 });
   const first = (await scopes.nth(0).boundingBox())!, second = (await scopes.nth(1).boundingBox())!;
   expect(second.y).toBeGreaterThanOrEqual(first.y + first.height); expect(second.width).toBeLessThanOrEqual(344);
  },
 },
 {
  id: 'local-override', entry: 'localOverrideExample', elements: ['button'],
  contract: 'A local square-corner override remains local and native keyboard activation works',
  async run(page) {
   const button = page.getByRole('button', { name: 'Local customization', exact: true });
   await expect(button).toHaveCSS('border-top-left-radius', '0px');
   const parent = await page.locator('#sample').evaluate(node => getComputedStyle(node).getPropertyValue('--en-control-radius').trim());
   expect(parent).not.toBe('0px');
   await button.evaluate(node => node.addEventListener('click', () => node.setAttribute('data-activated', 'true')));
   await button.focus(); await button.press('Enter'); await expect(button).toHaveAttribute('data-activated', 'true');
  },
 },
 {
  id: 'family-geometry', entry: 'familyGeometryExample', elements: ['button', 'text-field', 'select', 'number-field', 'segmented-control'],
  contract: 'Scoped family padding changes real controls while preserving independent field state',
  async run(page) {
   const rows = page.locator('.geometry-scope');
   const padding = async (selector: string) => page.locator(selector).evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).paddingInlineStart)));
   const buttons = await padding('.geometry-scope en-button [part~="control"]');
   expect(buttons[1]!).toBeGreaterThan(buttons[0]!);
   const inputs = await padding('.geometry-scope en-text-field input');
   expect(inputs[1]!).toBeLessThan(inputs[0]!);
   await rows.nth(1).getByRole('textbox', { name: 'Project', exact: true }).fill('Scoped draft');
   await rows.nth(1).getByRole('combobox', { name: 'Units', exact: true }).selectOption('rem');
   await expect(rows.nth(0).getByRole('textbox', { name: 'Project', exact: true })).toHaveValue('Studio studies');
   await expect(rows.nth(0).getByRole('combobox', { name: 'Units', exact: true })).toHaveValue('px');
   await expect(page.locator('.geometry-controls').first()).toHaveCSS('display', 'flex');
   await page.setViewportSize({ width: 360, height: 800 });
   for (const row of await rows.all()) expect(await row.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  },
 },
 {
  id: 'focus-motion', entry: 'focusMotionExample', elements: ['button', 'text-field', 'select', 'number-field', 'combobox'],
  contract: 'Keyboard focus paint, immediate reduced-motion recipe and independent draft/action state',
  async run(page) {
   await page.emulateMedia({ reducedMotion: 'reduce' });
   const group = page.getByRole('group', { name: 'Scoped input focus recipe', exact: true });
   const button = group.getByRole('button', { name: 'Preview study', exact: true });
   await button.focus(); await button.press('Enter'); await expect(group.locator('[data-focus-action-status]')).toHaveText('Preview button activated.');
   await button.press('Tab'); const input = group.getByRole('textbox', { name: 'Project title', exact: true });
   await expect(input).toBeFocused(); await input.fill('Focused draft');
   const paint = await input.evaluate(node => {
    const css = getComputedStyle(node); return { outline: parseFloat(css.outlineWidth), style: css.outlineStyle, focus: node.matches(':focus-visible') };
   });
   const accent = await group.locator('en-text-field [part~="focus-frame"]').evaluate(node => {
    const css = getComputedStyle(node, '::after'); return { width: css.borderBottomWidth, duration: css.transitionDuration, transform: css.transform };
   });
   expect(accent).toEqual({ width: '2px', duration: '0s', transform: 'matrix(1, 0, 0, 1, 0, 0)' });
   expect(paint.focus).toBe(true); expect(paint.outline).toBeGreaterThan(0); expect(paint.style).not.toBe('none');
   await expect(group.locator('.focus-motion-controls')).toHaveCSS('display', 'flex');
   await expect(page.getByRole('group', { name: 'Shared defaults', exact: true }).getByRole('textbox', { name: 'Project title', exact: true })).toHaveValue('Studio studies');
   await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(input).toHaveValue('Focused draft'); await expect(input).toBeFocused();
  },
 },
 {
  id: 'popup-motion', entry: 'popupMotionExample', elements: ['stack', 'button', 'icon', 'select', 'combobox', 'text-field', 'textarea', 'dialog', 'drawer', 'tooltip', 'popover', 'checkbox', 'menu', 'menu-item', 'command-palette'],
  contract: 'Immediate/motion scopes preserve drafts across Escape/reopen and apply authored Drawer placement',
  async run(page) {
   for (const name of ['Immediate', 'Scoped motion recipe']) {
    const group = page.getByRole('group', { name, exact: true });
    const trigger = group.getByRole('button', { name: 'Dialog', exact: true });
    await trigger.click(); const dialogHost = group.locator('en-dialog'); const dialog = dialogHost.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const binding = await dialog.evaluate(node => {
     const root = node.getRootNode() as ShadowRoot; const id = node.getAttribute('aria-labelledby');
     return { id, title: id ? root.getElementById(id)?.textContent?.trim() : null };
    });
    expect(binding).toEqual({ id: 'en-overlay-heading', title: `${name}: project details` });
    if (page.context().browser()?.browserType().name() === 'chromium') {
     const cdp = await page.context().newCDPSession(page);
     try {
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      expect(nodes.filter(node => !node.ignored && node.role?.value === 'dialog').map(node => node.name?.value)).toContain(`${name}: project details`);
     } finally { await cdp.detach(); }
    }
    await dialogHost.getByRole('textbox', { name: 'Project name', exact: true }).fill(`${name} draft`);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
    await trigger.click(); await expect(dialogHost.getByRole('textbox', { name: 'Project name', exact: true })).toHaveValue(`${name} draft`);
    await page.keyboard.press('Escape');
    await group.getByRole('combobox', { name: 'Drawer edge', exact: true }).selectOption('left');
    await expect(group.locator('en-drawer')).toHaveAttribute('placement', 'left');
    const drawerTrigger = group.getByRole('button', { name: 'Drawer', exact: true }); await drawerTrigger.click();
    const drawerHost = group.locator('en-drawer'); const drawer = drawerHost.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await drawerHost.getByRole('textbox', { name: 'Notes', exact: true }).fill(`${name} notes`);
    await page.keyboard.press('Escape'); await expect(drawer).not.toBeVisible(); await expect(drawerTrigger).toBeFocused();
    await drawerTrigger.click(); await expect(drawerHost.getByRole('textbox', { name: 'Notes', exact: true })).toHaveValue(`${name} notes`);
    await page.keyboard.press('Escape');
   }
   await expect(page.locator('.scope-grid')).toHaveCSS('display', 'grid');
  },
 },
];
