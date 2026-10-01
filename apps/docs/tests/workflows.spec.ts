import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const runtimeErrors = new WeakMap<Page, string[]>();
const sso = (page: Page) => page.locator('#sso');
const settings = (page: Page) => page.locator('#settings');
const chat = (page: Page) => page.locator('#chat');
const exactOpacity = (page: Page) => settings(page).getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });

test.beforeEach(async ({ page, browser }, info) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
});
test.afterEach(async ({ page }, info) => {
  const errors = runtimeErrors.get(page) ?? [];
  if (errors.length) await info.attach('runtime-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
  expect(errors, 'No browser runtime errors during the actual workflow').toEqual([]);
});
const workflowPages = {
  sso: { path: '/workflows', legacyPath: '/workflows.html', label: 'Sign-in', title: 'SSO workflow' },
  settings: { path: '/workflows/settings', legacyPath: '/workflows/settings.html', label: 'Settings', title: 'design settings workflow' },
  chat: { path: '/workflows/chat', legacyPath: '/workflows/chat.html', label: 'Chat', title: 'chat workflow' },
} as const;
type WorkflowId = keyof typeof workflowPages;
async function assertIsolated(page: Page, id: WorkflowId) {
  await expect(page.locator('#sso, #settings, #chat')).toHaveCount(1);
  await expect(page.locator(`#${id}`)).toBeVisible();
  const navigation = page.locator('en-navigation.section-nav');
  await expect(navigation.getByRole('navigation', { name: 'Workflow sections', exact: true })).toBeVisible();
  await expect(navigation.locator(':scope > a')).toHaveCount(6);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(navigation.getByRole('link', { name: workflowPages[id].label, exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.workflow-tools')).toHaveCount(1);
  await expect(page.locator('.code-disclosure')).toHaveCount(1);
  await expect(page.getByRole('button', { name: `Reset ${workflowPages[id].title}`, exact: true })).toHaveCount(1);
  await expect(page.locator(`pre[aria-label="${workflowPages[id].title} template source"]`)).toHaveCount(1);
}
async function waitForWorkflow(page: Page, id: WorkflowId) {
  await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
  await page.waitForFunction(() => (document.querySelector('en-workflows-app') as any)?.hasUpdated);
  await expect.poll(() => page.locator('en-workflows-app').evaluate(root => {
    const dormantPalette = root.querySelector('#settings en-command-palette#settings-command-palette');
    return [...root.querySelectorAll('*')].filter(element => element.localName.includes('-')).every(element => {
      const registry = 'customElementRegistry' in element ? (element as any).customElementRegistry : element.ownerDocument.defaultView!.customElements;
      const definition = registry?.get(element.localName);
      // Settings deliberately upgrades this exact host only on command use.
      // Every other authored component must retain the eager readiness contract.
      if (element === dormantPalette) return !definition && !('updateComplete' in element);
      return Boolean(definition && element instanceof definition && (element as any).hasUpdated);
    });
  })).toBe(true);
  if (id === 'settings') {
    await expect(settings(page).locator('#settings-command-palette')).toHaveCount(1);
    await expect(settings(page).locator('#settings-command-palette').getByRole('dialog')).not.toBeVisible();
  }
  await assertIsolated(page, id);
}
async function openWorkflows(page: Page, id: WorkflowId = 'sso') {
  // Every test begins on this production entry in its own fresh context. Visiting
  // the sticker sheet first could hide an omitted selective element registration.
  await page.goto(workflowPages[id].path);
  await waitForWorkflow(page, id);
}
async function disclosure(scene: Locator, name: string) {
  const summary = scene.locator('summary').filter({ hasText: name });
  const details = summary.locator('..');
  if (await details.getAttribute('open') === null) await summary.click();
  await expect(details).toHaveAttribute('open', '');
}
async function ssoFixture(page: Page, outcome: string, timing: string) {
  await disclosure(sso(page), 'Scenario controls for sign-in');
  await sso(page).getByRole('combobox', { name: 'Sign-in outcome', exact: true }).selectOption(outcome);
  await sso(page).getByRole('combobox', { name: 'Sign-in response timing', exact: true }).selectOption(timing);
}
async function account(page: Page, workspace = 'Studio North', email = 'alex@example.test') {
  await sso(page).getByRole('textbox', { name: 'Workspace', exact: true }).fill(workspace);
  const field = sso(page).getByRole('textbox', { name: 'Work email', exact: true });
  await field.fill(email);
  await field.press('Enter');
  await expect(sso(page).getByRole('heading', { name: 'Choose your sign-in provider', exact: true })).toBeFocused();
}
async function settingsFixture(page: Page, outcome = 'success') {
  await disclosure(settings(page), 'Settings simulation controls');
  await settings(page).getByRole('combobox', { name: 'Settings save result', exact: true }).selectOption(outcome);
  await settings(page).getByRole('combobox', { name: 'Settings response delivery', exact: true }).selectOption('held');
}
async function setOpacity(page: Page, value: string) { const editor = exactOpacity(page); await editor.fill(value); await editor.press('Enter'); }
async function pressButton(scene: Locator, name: string) {
  // The optional editor demo also has a Send message button. Target this workflow's send action.
  const button = name === 'Send message' ? scene.getByTestId('chat-send').getByRole('button', { name, exact: true }) : scene.getByRole('button', { name, exact: true });
  await button.focus(); await button.press('Enter');
}
async function capture(page: Page, info: TestInfo, name: string, region?: Locator) {
  if (info.project.name !== 'chromium') return;
  const path = info.outputPath(`${name}.png`);
  if (region) await region.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path, caret: 'initial' });
  await info.attach(name, { path, contentType: 'image/png' });
}

test('SSR account drafts retain native identity and become the exact hydrated submission', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
  await page.goto('/workflows.html', { waitUntil: 'commit' });
  await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
  const workspace = sso(page).getByRole('textbox', { name: 'Workspace', exact: true });
  const email = sso(page).getByRole('textbox', { name: 'Work email', exact: true });
  await expect(workspace).toHaveValue('');
  await expect(email).toHaveValue('');
  await assertIsolated(page, 'sso');
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('0');
  await email.fill('before@example.test');
  await workspace.fill('Before modules studio');
  await workspace.evaluate(control => {
    (window as any).__workflowInitialWorkspace = control;
    (control as HTMLInputElement).setSelectionRange(2, 8, 'backward');
  });
  release();
  await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
  await page.waitForFunction(() => (document.querySelector('en-workflows-app') as any)?.hasUpdated);
  await expect(email).toHaveValue('before@example.test');
  expect(await workspace.evaluate(control => ({
    same: control === (window as any).__workflowInitialWorkspace,
    focused: (control.getRootNode() as ShadowRoot).activeElement === control,
    selection: [(control as HTMLInputElement).selectionStart, (control as HTMLInputElement).selectionEnd, (control as HTMLInputElement).selectionDirection],
  }))).toEqual({ same: true, focused: true, selection: [2, 8, 'backward'] });
  expect(await sso(page).locator('form[data-sso-form="account"]').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({ workspace: 'Before modules studio', email: 'before@example.test' });
  await email.press('Enter');
  await expect(sso(page).getByRole('heading', { name: 'Choose your sign-in provider', exact: true })).toBeFocused();
  await expect(sso(page).getByText('Before modules studio', { exact: true })).toBeVisible();
  await expect(sso(page).getByText('before@example.test', { exact: true })).toBeVisible();

});

test('SSR chat draft keeps native identity, focus and selection and submits the exact early message', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/*.js', async route => { await gate; await route.continue(); });
  await page.goto(workflowPages.chat.path, { waitUntil: 'commit' });
  await expect(page.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
  await assertIsolated(page, 'chat');
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(0);
  await composer(page).fill('A chat draft written before modules load.');
  const original = await composer(page).elementHandle();
  await composer(page).evaluate(control => (control as HTMLTextAreaElement).setSelectionRange(2, 9, 'backward'));
  release();
  await waitForWorkflow(page, 'chat');
  await expect(composer(page)).toHaveValue('A chat draft written before modules load.');
  await expect(composer(page)).toBeFocused();
  expect(await composer(page).evaluate((control, previous) => ({ same: control === previous, selection: [(control as HTMLTextAreaElement).selectionStart, (control as HTMLTextAreaElement).selectionEnd, (control as HTMLTextAreaElement).selectionDirection] }), original)).toEqual({ same: true, selection: [2, 9, 'backward'] });
  await chatFixture(page);
  await requestAdjustment(page);
  await expect(chat(page).locator('en-chat-message').filter({has: page.getByRole('article', { name: 'You message', exact: true })}).locator('p').first()).toHaveText('A chat draft written before modules load.');
});

test('SSO validates native form data, follows an error link, and retains corrected values when going Back', async ({ page }) => {
  await openWorkflows(page);
  const workspace = sso(page).getByRole('textbox', { name: 'Workspace', exact: true });
  const fieldGeometry = () => workspace.evaluate(control => {
    const style = getComputedStyle(control);
    const rect = control.getBoundingClientRect();
    return {
      width: rect.width, height: rect.height,
      inlineInset: parseFloat(style.borderInlineStartWidth) + parseFloat(style.paddingInlineStart),
      blockInset: parseFloat(style.borderBlockStartWidth) + parseFloat(style.paddingBlockStart),
    };
  });
  const validGeometry = await fieldGeometry();
  await expect(workspace).toHaveCSS('border-top-width', '1px');
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).locator('[data-sso-validation]')).toBeFocused();
  await expect(sso(page).getByRole('heading', { name: 'Check your details', exact: true })).toBeVisible();
  await sso(page).locator('a[data-field="workspace"]').click();
  await expect(workspace).toBeFocused();
  await expect(workspace).toHaveCSS('border-top-width', '2px');
  expect(await fieldGeometry()).toEqual(validGeometry);
  await workspace.fill('Studio North');
  await expect(workspace).toHaveCSS('border-top-width', '1px');
  expect(await fieldGeometry()).toEqual(validGeometry);
  const email = sso(page).getByRole('textbox', { name: 'Work email', exact: true });
  await email.fill('invalid-email');
  await email.press('Enter');
  await expect(sso(page).locator('[data-sso-validation]')).toBeFocused();
  await sso(page).locator('a[data-field="email"]').click();
  await expect(email).toBeFocused();
  expect(await email.evaluate(control => (control as HTMLInputElement).validity.typeMismatch)).toBe(true);
  // This is a native email-shaped value, but the workflow requires a dotted domain.
  await email.fill('alex@studio');
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).locator('[data-sso-validation]')).toBeFocused();
  await expect(sso(page).getByRole('heading', { name: 'Your account and workspace', exact: true })).toBeVisible();
  await expect(sso(page).getByRole('heading', { name: 'Choose your sign-in provider', exact: true })).toHaveCount(0);
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('0');
  await expect(email).toHaveValue('alex@studio');
  expect(await email.evaluate(control => ({
    patternMismatch: (control as HTMLInputElement).validity.patternMismatch,
    typeMismatch: (control as HTMLInputElement).validity.typeMismatch,
  }))).toEqual({ patternMismatch: true, typeMismatch: false });
  const guidance = await sso(page).locator('#sso-email [part~="description"]').innerText();
  expect(guidance.trim().length).toBeGreaterThan(0);
  const nativeMessage = await email.evaluate(control => (control as HTMLInputElement).validationMessage);
  await expect(email).toHaveAccessibleDescription(`${guidance.trim()} ${nativeMessage}`);
  await sso(page).locator('a[data-field="email"]').click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await email.fill('alex@example.test');
  await expect(email).toHaveAccessibleDescription(guidance.trim());
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  expect(await email.evaluate(control => (control as HTMLInputElement).validity.valid)).toBe(true);
  await email.press('Enter');
  await expect(sso(page).getByRole('heading', { name: 'Choose your sign-in provider', exact: true })).toBeFocused();
  await pressButton(sso(page), 'Back');
  await expect(sso(page).getByRole('heading', { name: 'Your account and workspace', exact: true })).toBeFocused();
  await expect(workspace).toHaveValue('Studio North');
  await expect(email).toHaveValue('alex@example.test');
});

test('SSO completes a keyboard-submitted provider choice with the captured account', async ({ page }, info) => {
  await openWorkflows(page);
  await ssoFixture(page, 'success', 'immediate');
  await account(page);
  const studio = sso(page).getByRole('radio', { name: 'Studio identity', exact: true });
  const partner = sso(page).getByRole('radio', { name: 'Partner identity', exact: true });
  await studio.focus();
  await studio.press('ArrowDown');
  await expect(partner).toBeChecked();
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toBeFocused();
  await expect(sso(page).getByText('alex@example.test', { exact: true })).toBeVisible();
  await expect(sso(page).getByText('Partner identity', { exact: true })).toBeVisible();
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('1');
  await capture(page, info, 'sso-complete', sso(page));
});

test('SSO rejected attempt recovers through Retry without losing the chosen provider', async ({ page }) => {
  await openWorkflows(page);
  await ssoFixture(page, 'reject-once', 'immediate');
  await account(page);
  await sso(page).getByRole('radio', { name: 'Partner identity', exact: true }).check();
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).locator('[role="status"]')).toHaveText('The example provider declined this attempt. Retry or choose the other provider.');
  await expect(sso(page).getByRole('radio', { name: 'Partner identity', exact: true })).toBeChecked();
  await expect(sso(page).getByText('alex@example.test', { exact: true })).toBeVisible();
  await pressButton(sso(page), 'Retry');
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toBeFocused();
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('2');
});

test('SSO Cancel invalidates a held response while retaining the account and actionable focus', async ({ page }) => {
  await openWorkflows(page);
  await ssoFixture(page, 'success', 'held');
  await account(page);
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).getByRole('button', { name: 'Cancel sign-in', exact: true })).toBeVisible();
  // A second native activation while pending does not issue another request.
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('1');
  await pressButton(sso(page), 'Cancel sign-in');
  await expect(sso(page).getByRole('button', { name: 'Continue', exact: true })).toBeFocused();
  await pressButton(sso(page), 'Back');
  await sso(page).getByRole('textbox', { name: 'Workspace', exact: true }).fill('Later local workspace');
  await pressButton(sso(page), 'Release response 1');
  await expect(sso(page).getByRole('heading', { name: 'Your account and workspace', exact: true })).toBeVisible();
  await expect(sso(page).getByRole('textbox', { name: 'Workspace', exact: true })).toHaveValue('Later local workspace');
  await expect(sso(page).getByRole('textbox', { name: 'Work email', exact: true })).toHaveValue('alex@example.test');
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toHaveCount(0);
});

test('SSO Reset protects a new account from an older held completion', async ({ page }) => {
  await openWorkflows(page);
  await ssoFixture(page, 'success', 'held');
  await account(page, 'Old workspace', 'old@example.test');
  await pressButton(sso(page), 'Continue');
  await pressButton(sso(page), 'Reset sign-in scenario');
  await expect(sso(page).getByRole('textbox', { name: 'Workspace', exact: true })).toHaveValue('');
  await ssoFixture(page, 'success', 'held');
  await account(page, 'New workspace', 'new@example.test');
  await sso(page).getByRole('radio', { name: 'Partner identity', exact: true }).check();
  await pressButton(sso(page), 'Continue');
  await pressButton(sso(page), 'Release response 1');
  await expect(sso(page).getByRole('button', { name: 'Cancel sign-in', exact: true })).toBeVisible();
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toHaveCount(0);
  await pressButton(sso(page), 'Release response 2');
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toBeFocused();
  await expect(sso(page).getByText('New workspace', { exact: true })).toBeVisible();
  await expect(sso(page).getByText('new@example.test', { exact: true })).toBeVisible();
  await expect(sso(page).getByText('Partner identity', { exact: true })).toBeVisible();
});

test('settings save a captured snapshot while later edits remain local and unsaved', async ({ page }) => {
  await openWorkflows(page, 'settings');
  await settingsFixture(page);
  await setOpacity(page, '70');
  expect(await settings(page).getByRole('form', { name: 'Creative output settings', exact: true }).evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({ opacity: '70', format: 'png', layout: 'portrait', background: 'on' });
  await pressButton(settings(page), 'Save settings');
  await settings(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
  await pressButton(settings(page), 'Deliver held response');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('70% opacity · PNG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-current]')).toHaveText('70% opacity · SVG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('Saved revision 2. Newer local changes are still unsaved.');
  await pressButton(settings(page), 'Save settings');
  await pressButton(settings(page), 'Deliver held response');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('70% opacity · SVG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-dirty]')).toHaveText('Preview matches saved settings');
  await setOpacity(page, '72');
  await pressButton(settings(page), 'Save settings');
  await settings(page).getByRole('checkbox', { name: 'Include background', exact: true }).uncheck();
  await pressButton(settings(page), 'Cancel save');
  await expect(settings(page).getByRole('button', { name: 'Save settings', exact: true })).toBeFocused();
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('Stopped waiting for this save. Your local settings are unchanged.');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('70% opacity · SVG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-current]')).toHaveText('72% opacity · SVG · Portrait · Transparent background');
  await expect(settings(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
});

test('settings failed save retains local work and Retry succeeds once', async ({ page }) => {
  await openWorkflows(page, 'settings');
  await settingsFixture(page, 'failure');
  await setOpacity(page, '71');
  await pressButton(settings(page), 'Save settings');
  await pressButton(settings(page), 'Deliver held response');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('The simulated save failed. Your local settings are intact. Retry save when ready.');
  await expect(exactOpacity(page)).toHaveValue('71');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('64% opacity · PNG · Portrait · Background included');
  await pressButton(settings(page), 'Retry save');
  await pressButton(settings(page), 'Deliver held response');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('71% opacity · PNG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('Saved revision 2.');
});

test('incoming settings keep an unfinished native entry and focus until the user chooses Keep', async ({ page }, info) => {
  await openWorkflows(page, 'settings');
  await disclosure(settings(page), 'Settings simulation controls');
  await settings(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
  await pressButton(settings(page), 'Queue collaborator update');
  const editor = exactOpacity(page);
  await editor.fill('101');
  const original = await editor.elementHandle();
  await expect(settings(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toBeVisible();
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('101');
  expect(await editor.evaluate((node, previous) => node === previous, original)).toBe(true);
  await expect(settings(page).locator('[data-settings-current]')).toHaveText('64% opacity · SVG · Portrait · Background included');
  await capture(page, info, 'settings-incoming-draft', settings(page).getByRole('region', { name: 'Incoming opacity change', exact: true }));
  await pressButton(settings(page), 'Keep my opacity');
  await expect(settings(page).getByRole('heading', { name: 'Creative output settings', exact: true })).toBeFocused();
  await expect(settings(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toHaveCount(0);
  await expect(editor).toHaveValue('101');
  await expect(settings(page).getByRole('combobox', { name: 'Output format', exact: true })).toHaveValue('svg');
  await editor.focus();
  await editor.press('Escape');
  await expect(editor).toHaveValue('64');
});

test('Use updated opacity explicitly replaces its draft while preserving unrelated choices', async ({ page }) => {
  await openWorkflows(page, 'settings');
  await disclosure(settings(page), 'Settings simulation controls');
  await settings(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
  const portrait = settings(page).getByRole('radio', { name: 'Portrait', exact: true });
  await portrait.focus();await portrait.press('ArrowRight');
  await expect(settings(page).getByRole('radio', { name: 'Landscape', exact: true })).toBeChecked();
  await settings(page).getByRole('checkbox', { name: 'Include background', exact: true }).uncheck();
  await pressButton(settings(page), 'Queue collaborator update');
  await exactOpacity(page).fill('101');
  await expect(settings(page).getByRole('region', { name: 'Incoming opacity change', exact: true })).toBeVisible();
  await pressButton(settings(page), 'Use updated opacity');
  await expect(settings(page).getByRole('heading', { name: 'Creative output settings', exact: true })).toBeFocused();
  await expect(exactOpacity(page)).toHaveValue('82');
  await expect(settings(page).locator('[data-settings-current]')).toHaveText('82% opacity · SVG · Landscape · Transparent background');
  await expect(settings(page).getByRole('checkbox', { name: 'Include background', exact: true })).not.toBeChecked();
});

test('settings reject invalid drafts, restore saved opacity, and cancel a held save on Reset', async ({ page }) => {
  await openWorkflows(page, 'settings');
  await settingsFixture(page);
  await settings(page).getByRole('combobox', { name: 'Output format', exact: true }).selectOption('svg');
  await exactOpacity(page).fill('101');
  const form = settings(page).getByRole('form', { name: 'Creative output settings', exact: true });
  const format = settings(page).getByRole('combobox', { name: 'Output format', exact: true });
  await format.focus();
  expect(await form.evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(false);
  await expect(format).toBeFocused();
  const priorStatus = await settings(page).locator('[data-settings-status]').textContent();
  await pressButton(settings(page), 'Save settings');
  await expect(exactOpacity(page)).toBeFocused();
  await expect(exactOpacity(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(exactOpacity(page)).toHaveValue('101');
  const error = settings(page).locator('en-slider [part~="error"]');
  await expect(error).toBeVisible();
  const errorNode = await error.elementHandle();
  expect(await exactOpacity(page).evaluate((control, error) => (control.getAttribute('aria-describedby') ?? '').split(' ').some(id => (control.getRootNode() as ShadowRoot).getElementById(id) === error), errorNode)).toBe(true);
  expect(await form.evaluate(form => new FormData(form as HTMLFormElement).get('opacity'))).toBe('64');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText(priorStatus ?? '');
  await expect(settings(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('64% opacity · PNG · Portrait · Background included');
  await pressButton(settings(page), 'Restore saved opacity');
  await expect(exactOpacity(page)).toHaveValue('64');
  await expect(settings(page).getByRole('combobox', { name: 'Output format', exact: true })).toHaveValue('svg');
  await setOpacity(page, '75');
  await pressButton(settings(page), 'Save settings');
  await expect(settings(page).getByRole('button', { name: 'Saving settings…', exact: true })).toBeVisible();
  await pressButton(settings(page), 'Reset settings demo');
  await expect(exactOpacity(page)).toHaveValue('64');
  await expect(settings(page).locator('[data-settings-current]')).toHaveText('64% opacity · PNG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('Settings demo reset to revision 1.');
  await expect(settings(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
});

const composer = (page: Page) => chat(page).getByRole('textbox', { name: 'Message', exact: true });
const proposedOpacity = (page: Page) => chat(page).getByRole('spinbutton', { name: 'Proposed opacity Exact value', exact: true });
async function chatFixture(page: Page, reply = 'success', timing = 'immediate') {
  await disclosure(chat(page), 'Chat simulation controls');
  await chat(page).getByRole('combobox', { name: 'Next reply', exact: true }).selectOption(reply);
  await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption(timing);
}
async function requestAdjustment(page: Page) {
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByTestId('chat-adjustment')).toBeVisible();
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
}

test('chat renders message text safely and requires a valid newly reviewed preview before applying', async ({ page }, info) => {
  await openWorkflows(page, 'chat');
  await chatFixture(page);
  const message = '<img src=x onerror="window.untrustedMessageRan=true">';
  await composer(page).fill(message);
  await composer(page).press('End');
  await composer(page).press('Enter');
  await expect(composer(page)).toHaveValue(`${message}\n`);
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(0);
  await requestAdjustment(page);
  await expect(chat(page).locator('en-chat-message').filter({has: page.getByRole('article', { name: 'You message', exact: true })}).locator('p').first()).toHaveText(message);
  await expect(chat(page).getByTestId('chat-transcript').locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).untrustedMessageRan)).toBeUndefined();
  await pressButton(chat(page), 'Review latest adjustment');
  await expect(chat(page).getByRole('heading', { name: 'Cover image adjustment', exact: true })).toBeFocused();
  await proposedOpacity(page).fill('101');
  await pressButton(chat(page), 'Preview adjustment');
  await expect(proposedOpacity(page)).toBeFocused();
  await expect(proposedOpacity(page)).toHaveAttribute('aria-invalid', 'true');
  await expect(chat(page).getByRole('button', { name: 'Apply adjustment', exact: true })).toHaveCount(0);
  await proposedOpacity(page).press('Escape');
  await expect(proposedOpacity(page)).toHaveValue('85');
  await pressButton(chat(page), 'Preview adjustment');
  await expect(chat(page).getByText('Preview: 85% opacity · based on revision 7', { exact: true })).toBeVisible();
  await proposedOpacity(page).fill('77');
  await proposedOpacity(page).press('Enter');
  await expect(chat(page).getByRole('button', { name: 'Apply adjustment', exact: true })).toHaveCount(0);
  await pressButton(chat(page), 'Preview adjustment');
  await expect(chat(page).getByText('Preview: 77% opacity · based on revision 7', { exact: true })).toBeVisible();
  const pendingCard = await chat(page).getByTestId('chat-adjustment').elementHandle();
  await composer(page).fill('Another idea while this adjustment waits for review.');
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByTestId('chat-status')).toHaveText('Reply ready. Your pending adjustment is unchanged.');
  expect(await chat(page).getByTestId('chat-adjustment').evaluate((node, previous) => node === previous, pendingCard)).toBe(true);
  await expect(proposedOpacity(page)).toHaveValue('77');
  await expect(chat(page).getByText('Preview: 77% opacity · based on revision 7', { exact: true })).toBeVisible();
  await proposedOpacity(page).fill('101');
  await pressButton(chat(page), 'Apply adjustment');
  await expect(proposedOpacity(page)).toBeFocused();
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await proposedOpacity(page).press('Escape');
  await capture(page, info, 'chat-reviewed-preview', chat(page).getByTestId('chat-adjustment'));
  await pressButton(chat(page), 'Apply adjustment');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 77% opacity · revision 8');
  await expect(chat(page).getByRole('heading', { name: 'Cover image adjustment', exact: true })).toBeFocused();
  await expect(chat(page).getByTestId('chat-status')).toHaveText('Adjustment applied. Cover image opacity is 77%.');
});

test('chat Retry sends the failed snapshot once and preserves a newer focused composer draft', async ({ page }) => {
  await openWorkflows(page, 'chat');
  await chatFixture(page, 'fail-once');
  await composer(page).fill('Please strengthen the cover image.');
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByTestId('chat-status')).toHaveText('Your message could not be sent. Retry the message below; your draft is unchanged.');
  await expect(composer(page)).toHaveValue('Please strengthen the cover image.');
  await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption('delayed');
  await pressButton(chat(page), 'Retry message');
  await composer(page).fill('A newer draft I am still editing');
  const original = await composer(page).elementHandle();
  await composer(page).evaluate(node => (node as HTMLTextAreaElement).setSelectionRange(2, 9, 'backward'));
  await expect(chat(page).getByTestId('chat-adjustment')).toBeVisible();
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(1);
  await expect(chat(page).locator('en-chat-message').filter({has: page.getByRole('article', { name: 'You message', exact: true })}).locator('p').first()).toHaveText('Please strengthen the cover image.');
  await expect(composer(page)).toHaveValue('A newer draft I am still editing');
  await expect(composer(page)).toBeFocused();
  expect(await composer(page).evaluate((node, previous) => ({ same: node === previous, start: (node as HTMLTextAreaElement).selectionStart, end: (node as HTMLTextAreaElement).selectionEnd, direction: (node as HTMLTextAreaElement).selectionDirection }), original)).toEqual({ same: true, start: 2, end: 9, direction: 'backward' });
  await pressButton(chat(page), 'Preview adjustment');
  await chat(page).getByRole('combobox', { name: 'Apply result', exact: true }).selectOption('fail-once');
  await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption('immediate');
  await pressButton(chat(page), 'Apply adjustment');
  await expect(chat(page).getByTestId('chat-status')).toHaveText('The adjustment could not be applied. Your preview is retained; retry when ready.');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await pressButton(chat(page), 'Retry adjustment');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 85% opacity · revision 8');
  await expect(composer(page)).toHaveValue('A newer draft I am still editing');
});

test('chat revalidates a held Apply against collaborator changes and preserves later editing focus', async ({ page }) => {
  await openWorkflows(page, 'chat');
  await chatFixture(page);
  await requestAdjustment(page);
  await pressButton(chat(page), 'Show source message');
  await expect(chat(page).getByRole('article', { name: 'Assistant message', exact: true }).last()).toBeFocused();
  await pressButton(chat(page), 'Review latest adjustment');
  await pressButton(chat(page), 'Preview adjustment');
  await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption('held');
  await pressButton(chat(page), 'Apply adjustment');
  await expect(chat(page).getByRole('button', { name: 'Apply adjustment', exact: true })).toBeFocused();
  await pressButton(chat(page), 'Apply adjustment');
  await expect(chat(page).getByText('1 fixture response(s) pending. Held responses are released in request order.', { exact: true })).toBeVisible();
  await pressButton(chat(page), 'Add collaborator turn');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 74% opacity · revision 8');
  await pressButton(chat(page), 'Release pending response');
  await expect(chat(page).getByTestId('chat-problem')).toHaveText('The image changed after revision 7; it is now revision 8. Refresh the preview before applying your adjustment.');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 74% opacity · revision 8');
  await pressButton(chat(page), 'Refresh preview');
  await expect(chat(page).getByText('Preview: 85% opacity · based on revision 8', { exact: true })).toBeVisible();
  await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption('delayed');
  await pressButton(chat(page), 'Apply adjustment');
  await composer(page).fill('Do not take focus from this next idea.');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 85% opacity · revision 9');
  await expect(composer(page)).toBeFocused();
  await expect(composer(page)).toHaveValue('Do not take focus from this next idea.');
});

test('chat rejects unsupported capability, action, target and value at the authored action boundary', async ({ page }) => {
  await openWorkflows(page, 'chat');
  for (const [scenario, explanation] of [
    ['invalid-capability', 'This reply does not request a supported editing capability. Nothing changed.'],
    ['invalid-action', 'This reply proposes an unsupported action. Only image opacity can be adjusted here.'],
    ['invalid-target', 'The proposed image is unavailable or is not the selected Cover image. Nothing changed.'],
    ['invalid-value', 'Image opacity must be a whole number from 0 to 100. This proposal was not applied.'],
  ]) {
    await chatFixture(page, scenario);
    await requestAdjustment(page);
    await expect(chat(page).getByTestId('chat-problem')).toHaveText(explanation);
    await expect(chat(page).getByRole('button', { name: 'Apply adjustment', exact: true })).toHaveCount(0);
    await pressButton(chat(page), 'Refresh preview');
    await expect(chat(page).getByTestId('chat-problem')).toHaveText(explanation);
    await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
    await pressButton(chat(page), 'Reset chat');
  }
});

test('chat blocks a held Apply when permission or its image target disappears and requires a refreshed preview', async ({ page }) => {
  await openWorkflows(page, 'chat');
  for (const kind of ['permission', 'target']) {
    await chatFixture(page);
    await requestAdjustment(page);
    await pressButton(chat(page), 'Preview adjustment');
    await chat(page).getByRole('combobox', { name: 'Response timing', exact: true }).selectOption('held');
    await pressButton(chat(page), 'Apply adjustment');
    await pressButton(chat(page), kind === 'permission' ? 'Revoke editing access' : 'Remove image target');
    await pressButton(chat(page), 'Release pending response');
    await expect(chat(page).getByTestId('chat-problem')).toHaveText(kind === 'permission'
      ? 'Editing access changed. You can review the proposal, but you cannot apply it now.'
      : 'The proposed image is unavailable or is not the selected Cover image. Nothing changed.');
    await expect(chat(page).getByTestId('chat-current')).toHaveText(kind === 'permission' ? 'Current: 68% opacity · revision 7' : 'Current: 68% opacity · revision 8 · image unavailable');
    await pressButton(chat(page), kind === 'permission' ? 'Restore editing access' : 'Restore image target');
    await pressButton(chat(page), 'Refresh preview');
    await pressButton(chat(page), 'Apply adjustment');
    await pressButton(chat(page), 'Release pending response');
    await expect(chat(page).getByTestId('chat-current')).toHaveText(kind === 'permission' ? 'Current: 85% opacity · revision 8' : 'Current: 85% opacity · revision 10');
    await pressButton(chat(page), 'Reset chat');
  }
});

test('chat guards repeated pending sends and Cancel or Reset invalidates queued replies without erasing later drafts', async ({ page }) => {
  await openWorkflows(page, 'chat');
  await chatFixture(page, 'success', 'held');
  await composer(page).fill('The first request');
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByTestId('chat-send').getByRole('button', { name: 'Send message', exact: true })).toBeFocused();
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(1);
  await composer(page).fill('A later draft to keep');
  await pressButton(chat(page), 'Cancel pending requests');
  await expect(composer(page)).toBeFocused();
  await expect(composer(page)).toHaveValue('A later draft to keep');
  await expect(chat(page).getByRole('button', { name: 'Release pending response', exact: true })).toBeDisabled();
  await expect(chat(page).getByTestId('chat-adjustment')).toHaveCount(0);
  await pressButton(chat(page), 'Send message');
  await expect(chat(page).getByRole('button', { name: 'Release pending response', exact: true })).toBeEnabled();
  await pressButton(chat(page), 'Reset chat');
  await expect(chat(page).getByRole('button', { name: 'Release pending response', exact: true })).toBeDisabled();
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(0);
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await expect(composer(page)).toHaveValue('Make the cover image a little stronger.\nKeep the text easy to read.');
  await composer(page).fill('New work after Reset');
  await expect(composer(page)).toHaveValue('New work after Reset');
  await expect(chat(page).getByTestId('chat-adjustment')).toHaveCount(0);
  await chatFixture(page);
  await requestAdjustment(page);
  await pressButton(chat(page), 'Preview adjustment');
  await pressButton(chat(page), 'Cancel adjustment');
  await expect(chat(page).getByRole('heading', { name: 'Cover image adjustment', exact: true })).toBeFocused();
  await expect(chat(page).getByTestId('chat-status')).toHaveText('Adjustment canceled. The image is unchanged.');
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await expect(chat(page).getByRole('button', { name: 'Apply adjustment', exact: true })).toHaveCount(0);
});

test('reconnecting each isolated page disposes pending work and creates fresh native editors with working handlers', async ({ page }) => {
  const reconnect = async () => page.locator('en-workflows-app').evaluate(app => { const parent = app.parentNode!; const next = app.nextSibling; app.remove(); parent.insertBefore(app, next); });
  await openWorkflows(page, 'sso');
  await ssoFixture(page, 'success', 'held');
  await account(page);
  await pressButton(sso(page), 'Continue');
  await reconnect();
  await assertIsolated(page, 'sso');
  await expect(sso(page).getByRole('textbox', { name: 'Workspace', exact: true })).toHaveValue('');
  await expect(sso(page).locator('[data-sso-attempts]')).toHaveText('0');
  await ssoFixture(page, 'success', 'immediate');
  await expect(sso(page).getByRole('button', { name: 'Release response 1', exact: true })).toHaveCount(0);
  await account(page, 'Reconnected studio', 'reconnected@example.test');
  await pressButton(sso(page), 'Continue');
  await expect(sso(page).getByRole('heading', { name: 'Example sign-in complete', exact: true })).toBeVisible();

  await openWorkflows(page, 'settings');
  await settingsFixture(page);
  await setOpacity(page, '73');
  await pressButton(settings(page), 'Save settings');
  await exactOpacity(page).fill('101');
  const previousEditor = await exactOpacity(page).elementHandle();
  await reconnect();
  await assertIsolated(page, 'settings');
  await expect(exactOpacity(page)).toHaveValue('64');
  expect(await exactOpacity(page).evaluate((node, previous) => node === previous, previousEditor)).toBe(false);
  expect(await exactOpacity(page).evaluate(node => (node as HTMLInputElement).validity.valid)).toBe(true);
  await settingsFixture(page);
  await expect(settings(page).getByRole('button', { name: 'Deliver held response', exact: true })).toBeDisabled();
  await setOpacity(page, '74');
  await pressButton(settings(page), 'Save settings');
  await pressButton(settings(page), 'Deliver held response');
  await expect(settings(page).locator('[data-settings-saved]')).toHaveText('74% opacity · PNG · Portrait · Background included');
  await expect(settings(page).locator('[data-settings-status]')).toHaveText('Saved revision 2.');

  await openWorkflows(page, 'chat');
  await chatFixture(page, 'success', 'held');
  await pressButton(chat(page), 'Send message');
  await composer(page).fill('An unfinished draft in the disconnected chat');
  const previousComposer = await composer(page).elementHandle();
  await reconnect();
  await assertIsolated(page, 'chat');
  await expect(composer(page)).toHaveValue('Make the cover image a little stronger.\nKeep the text easy to read.');
  expect(await composer(page).evaluate((node, previous) => node === previous, previousComposer)).toBe(false);
  await expect(chat(page).getByRole('article', { name: 'You message', exact: true })).toHaveCount(0);
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await chatFixture(page);
  await expect(chat(page).getByRole('button', { name: 'Release pending response', exact: true })).toBeDisabled();
  await requestAdjustment(page);
});

test('each direct workflow page exposes labelled controls and passes scoped accessibility checks before and after interaction', async ({ page }, info) => {
  const statusOwners: Record<WorkflowId, { selector: string; count: number; visible: boolean }[]> = {
    sso: [
      { selector: '.sso-status', count: 1, visible: true },
      { selector: 'output[data-sso-attempts]', count: 1, visible: false },
    ],
    settings: [
      { selector: '[data-outline-details]', count: 1, visible: true },
      { selector: '#settings-command-status', count: 1, visible: true },
      { selector: '[data-settings-status]', count: 1, visible: true },
      { selector: 'en-toast-region [part~="announcements"]', count: 1, visible: true },
      { selector: 'en-command-palette [part~="status"]', count: 1, visible: false },
    ],
    chat: [
      { selector: '[data-testid="chat-status"]', count: 1, visible: true },
      { selector: '.older-status', count: 1, visible: false },
      { selector: 'en-activity-feed [part~="announcement"]', count: 2, visible: false },
      { selector: 'en-composable-chat-demo [role="status"]', count: 1, visible: false },
    ],
  };
  for (const id of Object.keys(workflowPages) as WorkflowId[]) {
    await openWorkflows(page, id);
    const scene = page.locator(`#${id}`);
    // Assert authored owners and native visibility independently. WebKit role
    // queries can include closed-details descendants; native output is also a status.
    const owners = statusOwners[id];
    await expect(scene.locator('[role="status"], output')).toHaveCount(owners.reduce((total, owner) => total + owner.count, 0));
    for (const owner of owners) {
      const nodes = scene.locator(owner.selector);
      await expect(nodes).toHaveCount(owner.count);
      for (let index = 0; index < owner.count; index++) await expect(nodes.nth(index)).toHaveRole('status');
      expect(await nodes.evaluateAll((elements, visible) => elements.every(element => element.checkVisibility() === visible), owner.visible), `${id}: ${owner.selector} visibility`).toBe(true);
    }
    if (id === 'settings') {
      await expect(scene.locator('#settings-command-status')).toBeEmpty();
      await expect(scene.locator('#settings-command-status')).toHaveAttribute('aria-atomic', 'true');
    }
    await capture(page, info, `desktop-${id}`);
    for (const phase of ['initial', 'interaction']) {
      if (phase === 'interaction') {
        if (id === 'sso') {
          await pressButton(sso(page), 'Continue');
          await expect(sso(page).locator('[data-sso-validation]')).toBeFocused();
        } else if (id === 'settings') {
          await exactOpacity(page).fill('101');
          await pressButton(settings(page), 'Save settings');
          await expect(exactOpacity(page)).toBeFocused();
        } else {
          await chatFixture(page);
          await requestAdjustment(page);
          await pressButton(chat(page), 'Preview adjustment');
        }
      }
      const result = await new AxeBuilder({ page }).include(`#${id}`).include('.theme-controls').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      await info.attach(`axe-${id}-${phase}`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
      expect(result.violations).toEqual([]);
    }
  }
});

test('each direct and legacy document owns one isolated SSR workflow without JavaScript', async ({ browser }) => {
  // Inspect the real server-rendered documents with scripts disabled. No client
  // fallback, source matching or inserted fixture DOM establishes this boundary.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const serverPage = await context.newPage();
  try {
    await serverPage.goto('/');
    await expect(serverPage.getByRole('navigation', { name: 'Documentation pages', exact: true }).getByRole('link', { name: 'Workflows', exact: true })).toHaveAttribute('href', workflowPages.sso.path);
    for (const id of Object.keys(workflowPages) as WorkflowId[]) {
      // The public URL serves its own SSR document without a canonicalization
      // redirect. Existing .html bookmarks must still reach the same page.
      for (const path of [workflowPages[id].path, workflowPages[id].legacyPath]) {
        const response = await serverPage.goto(path);
        expect(response?.ok()).toBe(true);
        if (path === workflowPages[id].path) expect(response?.request().redirectedFrom()).toBeNull();
        await expect(serverPage.locator('en-workflows-app')).toHaveAttribute('data-ssr', '');
        await assertIsolated(serverPage, id);
        const serverNavigation = serverPage.locator('en-navigation.section-nav');
        for (const destination of Object.values(workflowPages)) {
          const href = await serverNavigation.getByRole('link', { name: destination.label, exact: true }).getAttribute('href');
          expect(new URL(href!, serverPage.url()).pathname).toBe(destination.path);
        }
        await expect(serverPage.getByRole('navigation', { name: 'Documentation pages', exact: true }).getByRole('link', { name: 'Workflows', exact: true })).toHaveAttribute('href', workflowPages.sso.path);
      }
    }
  } finally { await context.close(); }
});

test('native page navigation, history and legacy links preserve preview context', async ({ page }) => {
  await page.goto('/workflows.html?progress-report&review=workflow-pages');
  await waitForWorkflow(page, 'sso');
  await sso(page).getByRole('textbox', { name: 'Workspace', exact: true }).fill('Only in this sign-in document');
  const light = page.getByRole('radio', { name: 'Light', exact: true });
  await light.focus();await light.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
  await page.getByRole('combobox', { name: 'Reading direction', exact: true }).selectOption('rtl');
  await page.evaluate(() => { (window as any).__workflowDocumentMarker = true; });
  const navigation = page.locator('en-navigation.section-nav');
  const settingsLink = navigation.getByRole('link', { name: 'Settings', exact: true });
  await settingsLink.focus();await settingsLink.press('Enter');
  await expect.poll(() => new URL(page.url()).pathname).toBe(workflowPages.settings.path);
  await waitForWorkflow(page, 'settings');
  expect(await page.evaluate(() => (window as any).__workflowDocumentMarker)).toBeUndefined();
  const assertContext = async () => {
    const url = new URL(page.url());
    expect(url.searchParams.has('progress-report')).toBe(true);
    expect(url.searchParams.get('review')).toBe('workflow-pages');
    expect(url.searchParams.get('theme')).toBe('dark');
    expect(url.searchParams.get('density')).toBe('compact');
    expect(url.searchParams.get('direction')).toBe('rtl');
    await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Density', exact: true })).toHaveValue('compact');
    await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  };
  await assertContext();
  await expect(exactOpacity(page)).toHaveValue('64');
  await setOpacity(page, '72');
  const summary = settings(page).locator('.code-disclosure summary');
  await summary.focus();await summary.press('Enter');
  const source = settings(page).locator('.code-disclosure pre code');
  await expect(source).toBeVisible();
  const sourceText = await source.textContent();
  expect(sourceText?.length).toBeGreaterThan(0);
  await pressButton(settings(page), 'Reset design settings workflow');
  await expect(exactOpacity(page)).toHaveValue('64');
  await expect(source).toHaveText(sourceText ?? '');
  await assertContext();
  await navigation.getByRole('link', { name: 'Chat', exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe(workflowPages.chat.path);
  await waitForWorkflow(page, 'chat');await assertContext();
  await expect(chat(page).getByTestId('chat-current')).toHaveText('Current: 68% opacity · revision 7');
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe(workflowPages.settings.path);
  await waitForWorkflow(page, 'settings');await assertContext();
  await page.goForward();
  await expect.poll(() => new URL(page.url()).pathname).toBe(workflowPages.chat.path);
  await waitForWorkflow(page, 'chat');await assertContext();
  // Native history may restore a document through BFCache. A fresh native link
  // is the boundary at which this recipe promises fresh local fixtures.
  await navigation.getByRole('link', { name: 'Sign-in', exact: true }).click();
  await waitForWorkflow(page, 'sso');await assertContext();
  await expect(sso(page).getByRole('textbox', { name: 'Workspace', exact: true })).toHaveValue('');

  for (const [legacy, id] of [['/workflows.html', 'settings'], ['/workflows', 'chat']] as const) {
    await page.goto(`${legacy}?progress-report&review=legacy&theme=dark&density=spacious&direction=rtl#${id}`);
    await expect.poll(() => new URL(page.url()).pathname).toBe(workflowPages[id].path);
    await waitForWorkflow(page, id);
    const url = new URL(page.url());
    expect(url.searchParams.has('progress-report')).toBe(true);
    expect(url.searchParams.get('review')).toBe('legacy');
    expect(url.hash).toBe(`#${id}`);
    await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
    await expect(page.getByRole('combobox', { name: 'Density', exact: true })).toHaveValue('spacious');
    await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('rtl');
  }
  await page.goto('/workflows/settings.html?progress-report&theme=unknown&density=unknown&direction=unknown');
  await waitForWorkflow(page, 'settings');
  await expect(page.getByRole('radio', { name: 'Auto', exact: true })).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Density', exact: true })).toHaveValue('comfortable');
  await expect(page.getByRole('combobox', { name: 'Reading direction', exact: true })).toHaveValue('ltr');
  await navigation.getByRole('link', { name: 'Chat', exact: true }).click();
  await waitForWorkflow(page, 'chat');
  const normalized = new URL(page.url());
  expect(normalized.searchParams.has('progress-report')).toBe(true);
  for (const key of ['theme', 'density', 'direction']) expect(normalized.searchParams.has(key)).toBe(false);
});

test('narrow portrait and landscape RTL workflow pages remain usable without horizontal page overflow', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'This focused layout check is intentionally one engine; behavior cases run in all three.');
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await openWorkflows(page, 'sso');
    const direction = page.getByRole('combobox', { name: 'Reading direction', exact: true });
    await direction.selectOption('rtl');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    for (const id of Object.keys(workflowPages) as WorkflowId[]) {
      if (id !== 'sso') await page.locator('en-navigation.section-nav').getByRole('link', { name: workflowPages[id].label, exact: true }).click();
      await waitForWorkflow(page, id);
      await expect(direction).toHaveValue('rtl');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (viewport.width === 390) await capture(page, info, `narrow-${id}`);
      if (id === 'sso') {
        await sso(page).getByRole('textbox', { name: 'Workspace', exact: true }).fill('Narrow studio');
        await expect(sso(page).getByRole('textbox', { name: 'Workspace', exact: true })).toHaveValue('Narrow studio');
      } else if (id === 'settings') {
        await setOpacity(page, '66');
        await expect(settings(page).locator('[data-settings-current]')).toContainText('66% opacity');
      } else {
        await composer(page).fill('Review this on a small screen');
        await expect(composer(page)).toHaveValue('Review this on a small screen');
      }
    }
  }
});
