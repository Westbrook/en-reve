import { test, expect } from '@playwright/test';

test('the built sticker sheet contains usable initial content with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Component sticker sheet', exact: true })).toBeVisible();
  await expect(page.locator('en-text-field[label="Project name"]').first().locator('input')).toHaveValue('Studio studies');
  await expect(page.locator('en-textarea[label="Creative direction"] textarea')).toHaveValue('Explore softer materials and a warmer palette.');
  await expect(page.getByRole('article', { name: 'Structured values', exact: true }).locator('en-select[label="Export format"] select')).toHaveValue('png');
  await expect(page.locator('en-radio[value="balanced"] input')).toBeChecked();
  await expect(page.locator('en-radio[value="small"] input')).not.toBeChecked();
  await expect(page.locator('en-segmented-control[label="Appearance"] input[value="auto"]')).toBeChecked();
  await expect(page.locator('en-segmented-control[label="Appearance"] input[value="light"]')).not.toBeChecked();
  await expect(page.locator('en-segmented-control[label="Appearance"] input[value="dark"]')).not.toBeChecked();
  await expect(page.getByRole('group', { name: 'How useful is this concept?', exact: true })).toBeVisible();
  await expect(page.locator('en-accordion-item[value="layout"] button')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('en-tab[value="design"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('en-tab-panel[value="layout"]')).toBeHidden();
  await expect(page.locator('en-sticker-app')).toHaveAttribute('data-ssr', '');
  await context.close();
});

test('full-sheet hydration preserves native draft, node identity, focus and selection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
  await page.goto('/', { waitUntil: 'commit' });
  const input = page.locator('en-text-field[label="Project name"]').first().locator('input');
  await input.fill('Typed before hydration');
  await input.evaluate(control => {
    (window as any).__originalField = control;
    (control as HTMLInputElement).setSelectionRange(3, 9);
  });
  release();
  // Finish the deferred module graph before checking hydration state.
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('en-sticker-app')).not.toHaveAttribute('data-ssr', '');
  await page.waitForFunction(() => (document.querySelector('en-sticker-app') as any)?.hasUpdated);
  await page.waitForFunction(() => [...document.querySelectorAll('en-sticker-app *')]
    .filter(element => customElements.get(element.localName))
    .every(element => (element as any).hasUpdated && !element.hasAttribute('defer-hydration')));
  await expect(input).toHaveValue('Typed before hydration');
  expect(await input.evaluate(control => ({
    identical: control === (window as any).__originalField,
    focused: control.getRootNode() instanceof ShadowRoot && (control.getRootNode() as ShadowRoot).activeElement === control,
    selection: [(control as HTMLInputElement).selectionStart, (control as HTMLInputElement).selectionEnd],
  }))).toEqual({ identical: true, focused: true, selection: [3, 9] });
  expect(errors).toEqual([]);
});

test('textarea parsing and hydration preserve draft and accepted form submission', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fixture');
  const notes = page.locator('en-textarea[name="notes"] textarea');
  await expect(notes).toHaveValue('\nFirst line\nA second line & details');
  await notes.fill('Edited before modules\nSecond line');
  await notes.evaluate(control => {
    (window as any).__originalNotes = control;
    (control as HTMLTextAreaElement).setSelectionRange(2, 7);
  });
  await page.evaluate(() => (window as any).hydrateFixture());
  await expect(notes).toHaveValue('Edited before modules\nSecond line');
  expect(await notes.evaluate(control => ({
    identical: control === (window as any).__originalNotes,
    focused: (control.getRootNode() as ShadowRoot).activeElement === control,
    selection: [(control as HTMLTextAreaElement).selectionStart, (control as HTMLTextAreaElement).selectionEnd],
  }))).toEqual({ identical: true, focused: true, selection: [2, 7] });
  expect(await page.locator('form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({
    title: 'Server project', notes: 'Edited before modules\nSecond line', 'controlled-notes': 'Accepted notes', format: 'svg', notifications: 'on',
  });
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Updated after hydration');
  expect(await page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).get('title'))).toBe('Updated after hydration');
  expect(errors).toEqual([]);
});

test('consumer cancellation preserves pre-hydration draft, identity, selection and accepted submission state', async ({ page }) => {
  await page.goto('/fixture');
  const host = page.locator('en-textarea[name="controlled-notes"]');
  const notes = host.locator('textarea');
  await notes.fill('Unaccepted native draft');
  await notes.evaluate(control => {
    (window as any).__canceledHydrationDraft = control;
    (control as HTMLTextAreaElement).setSelectionRange(2, 8);
    const form = document.querySelector('form')!;
    (window as any).hydrationAttempts = [];
    form.addEventListener('en-change', event => {
      const target = event.target as any;
      if (target.name === 'controlled-notes') (window as any).hydrationAttempts.push({
        value: target.value, formValue: new FormData(form).get('controlled-notes'),
        canceled: event.defaultPrevented, cancelable: event.cancelable,
      });
    });
  });
  await page.evaluate(() => (window as any).hydrateFixture());
  await expect(notes).toHaveValue('Unaccepted native draft');
  expect(await notes.evaluate(control => ({
    identical: control === (window as any).__canceledHydrationDraft,
    focused: (control.getRootNode() as ShadowRoot).activeElement === control,
    selection: [(control as HTMLTextAreaElement).selectionStart, (control as HTMLTextAreaElement).selectionEnd],
  }))).toEqual({ identical: true, focused: true, selection: [2, 8] });
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  expect(await page.evaluate(() => (window as any).hydrationAttempts)).toEqual([{
    value: 'Unaccepted native draft', formValue: 'Unaccepted native draft', canceled: true, cancelable: true,
  }]);
  expect(await page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).get('controlled-notes'))).toBe('Accepted notes');
  await host.evaluate(host => { (host as any).value = 'Unaccepted native draft'; });
  expect(await page.locator('form').evaluate(form => new FormData(form as HTMLFormElement).get('controlled-notes'))).toBe('Unaccepted native draft');
  expect(await page.evaluate(() => (window as any).hydrationAttempts)).toHaveLength(1);
});

test('external popover trigger keeps its native button and focus through hydration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fixture');
  const trigger = page.getByRole('button', { name: 'Share project', exact: true });
  await trigger.focus();
  await trigger.evaluate(button => { (window as any).__originalOverlayTrigger = button; });
  await expect(page.locator('en-popover')).toHaveAttribute('for', 'ssr-share');
  await expect(page.locator('en-popover [part="surface"]')).toBeHidden();
  await page.evaluate(() => (window as any).hydrateFixture());
  expect(await trigger.evaluate(button => button === (window as any).__originalOverlayTrigger)).toBe(true);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Sharing options', exact: true })).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const input = page.getByRole('textbox', { name: 'Invite collaborator', exact: true });
  await input.fill('designer@example.com');
  await input.press('Escape');
  await expect(page.locator('en-popover [part="surface"]')).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
});

test('tooltip attaches to an already-focused external trigger during hydration', async ({ page }) => {
  await page.goto('/fixture');
  const trigger = page.getByRole('button', { name: 'Project history', exact: true });
  await trigger.focus();
  await trigger.evaluate(button => { (window as any).__originalTooltipTrigger = button; });
  await page.evaluate(() => (window as any).hydrateFixture());
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toHaveText('Browse previous revisions');
  expect(await trigger.evaluate(button => ({
    identical: button === (window as any).__originalTooltipTrigger,
    description: (button as any).ariaDescribedByElements?.[0] === document.querySelector('en-tooltip [slot="content"]'),
  }))).toEqual({ identical: true, description: true });
  await trigger.press('Escape');
  await expect(page.locator('en-tooltip [part="surface"]')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('sample button and native color field retain identity and focus through hydration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fixture');
  const swatch = page.getByRole('button', { name: 'Choose server accent', exact: true });
  const color = page.getByLabel('Server accent', { exact: true });
  await expect(swatch).toBeVisible();
  await expect(color).toBeVisible();
  await expect(color).toHaveValue('#336699');
  await expect(page.locator('#ssr-accent-swatch [part="color"]')).toHaveCSS('background-color', 'rgb(51, 102, 153)');
  await swatch.focus();
  await swatch.evaluate(button => { (window as any).__originalSwatch = button; });
  await color.evaluate(input => {
    (window as any).__originalColor = input;
    (window as any).__pickerAttempts = [];
    Object.defineProperty(input, 'showPicker', { configurable: true, value() { (window as any).__pickerAttempts.push(navigator.userActivation.isActive); } });
  });
  await page.evaluate(() => (window as any).hydrateFixture());
  expect(await swatch.evaluate(button => button === (window as any).__originalSwatch)).toBe(true);
  expect(await color.evaluate(input => input === (window as any).__originalColor)).toBe(true);
  await expect(swatch).toBeFocused();
  await swatch.press('Enter');
  expect(await page.evaluate(() => (window as any).__pickerAttempts)).toEqual([true]);
  await expect(color).toBeVisible();
  await expect(color).toHaveValue('#336699');
  expect(errors).toEqual([]);
});
