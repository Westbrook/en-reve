import { test, expect } from '@playwright/test';

test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
});
async function ready(page) { await page.goto('/'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true'); }

test('signal snapshot is synchronous; disconnected reaction is disposed and reconnect subscribes once', async ({ page }) => {
  await ready(page);
  const output = page.getByLabel('Lifecycle count');
  await expect(output).toHaveText('3');
  expect(await page.evaluate(() => window.probe.syncSnapshot)).toEqual({ count: 7, doubled: 14 });
  await page.evaluate(async () => {
    const { lifecycle } = window.probe;
    lifecycle.model.count.set(4);
    lifecycle.remove(); // Also cancels an already queued reaction callback.
    await Promise.resolve(); await Promise.resolve();
    lifecycle.model.count.set(9);
  });
  expect(await page.evaluate(() => window.probe.lifecycle.callbacks)).toBe(0);
  await page.evaluate(() => window.probe.lifecycleSection.append(window.probe.lifecycle));
  await expect(output).toHaveText('9');
  await page.evaluate(() => window.probe.lifecycle.model.count.set(10));
  await expect(output).toHaveText('10');
  expect(await page.evaluate(() => window.probe.lifecycle.callbacks)).toBe(1);
});

test('slotted native form control retains name, description, validation, submission and reset', async ({ page }) => {
  await ready(page);
  const input = page.getByRole('textbox', { name: 'Email address', exact: true });
  await expect(input).toHaveAccessibleDescription('Use your work email');
  await page.getByText('Email address', { exact: true }).click();
  await expect(input).toBeFocused();
  await page.getByRole('button', { name: 'Submit native' }).click();
  await expect(input).toBeFocused();
  await expect(page.locator('#native-result')).toBeEmpty();
  await input.fill('team@example.com');
  await page.getByRole('button', { name: 'Submit native' }).click();
  expect(JSON.parse(await page.locator('#native-result').innerText())).toEqual({ email: 'team@example.com' });
  await page.getByRole('button', { name: 'Reset native' }).click();
  await expect(input).toHaveValue('');
});

test('FACE form association does not transfer an external label to inner native input', async ({ page }, info) => {
  await ready(page);
  const input = page.getByRole('textbox', { name: 'Internal account', exact: true });
  await expect(input).toHaveAccessibleName('Internal account');
  const associations = await page.locator('en-probe-face').evaluate((host: any) => ({
    labels: Array.from(host.internals.labels).map((label: any) => label.textContent),
    form: host.internals.form.id,
    innerForm: host.shadowRoot.querySelector('input').form?.id ?? null,
  }));
  expect(associations).toEqual({ labels: ['External account'], form: 'face-form', innerForm: null });
  await page.locator('#external-face-label').click();
  const labelFocusedInput = await input.evaluate(node => node.matches(':focus'));
  info.annotations.push({ type: 'external-label-activation', description: JSON.stringify({ labelFocusedInput }) });
  await input.fill('creator');
  await page.getByRole('button', { name: 'Submit face' }).click();
  expect(JSON.parse(await page.locator('#face-result').innerText())).toEqual({ account: 'creator' });
  await page.getByRole('button', { name: 'Reset face' }).click();
  await expect(input).toHaveValue('');
});

test('native scoped registries keep identical tags and nested Lit render trees independent', async ({ page }, info) => {
  await ready(page);
  const capability = await page.evaluate(() => window.probe.scoped);
  info.annotations.push({ type: 'scoped-capability', description: JSON.stringify(capability) });
  test.skip(!capability.available, `Native scoped path unavailable at ${capability.stage}: ${capability.error}`);
  expect(capability.supported, capability.error).toBe(true);
  expect(capability.old).toEqual({ branch: true, leaf: true, scopedRoot: true, creationScope: true });
  expect(capability.new).toEqual({ branch: true, leaf: true, scopedRoot: true, creationScope: true });
  await page.getByRole('button', { name: 'old nested action' }).click();
  await expect(page.locator('[data-version="old"] en-probe-leaf')).toHaveAttribute('clicked', 'old');
  await expect(page.locator('[data-version="new"] en-probe-leaf')).not.toHaveAttribute('clicked');
  await page.getByRole('button', { name: 'new nested action' }).click();
  await expect(page.locator('[data-version="new"] en-probe-leaf')).toHaveAttribute('clicked', 'new');
  expect(await page.evaluate(() => customElements.get('en-probe-branch') === undefined && customElements.get('en-probe-leaf') === undefined)).toBe(true);
});

test('controlled text keeps native draft, selection and node through unrelated updates', async ({ page }) => {
  await ready(page);
  const input = page.getByRole('textbox', { name: 'Controlled draft' });
  await input.fill('draft');
  await input.press('ArrowLeft');
  await page.locator('en-probe-draft').evaluate((host: any) => { host.savedInput = host.shadowRoot.querySelector('input'); host.requestUpdate(); return host.updateComplete; });
  await expect(input).toHaveValue('draft');
  await expect(input).toBeFocused();
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(4);
  expect(await page.locator('en-probe-draft').evaluate((host: any) => host.savedInput === host.shadowRoot.querySelector('input'))).toBe(true);
  await expect(page.getByLabel('Accepted value')).toHaveText('start');
  const events = await page.locator('en-probe-draft').evaluate((host: any) => host.notifications);
  expect(events.at(-1)).toEqual({ draft: 'draft', composing: false, trusted: true });
  await page.locator('en-probe-draft').evaluate((host: any) => host.accept('start'));
  await expect(input).toHaveValue('start'); // Same accepted value is an explicit rejection of a different draft.
});

test('synthetic composition guard defers external replacement; does not claim real IME coverage', async ({ page }, info) => {
  await ready(page);
  info.annotations.push({ type: 'coverage-limit', description: 'Synthetic composition lifecycle only. Real OS IME, dictation and composition keyboard interactions remain manual coverage.' });
  const input = page.getByRole('textbox', { name: 'Controlled draft' });
  await input.focus();
  await input.fill('composition draft');
  await input.dispatchEvent('compositionstart', { data: '' });
  await page.locator('en-probe-draft').evaluate((host: any) => { host.accept('remote'); host.requestUpdate(); return host.updateComplete; });
  await expect(input).toHaveValue('composition draft');
  await expect(input).toBeFocused();
  await input.dispatchEvent('compositionend', { data: 'composition draft' });
  await expect(input).toHaveValue('remote');
  await expect(page.getByLabel('Accepted value')).toHaveText('remote');
});

test('ordinary SSR renders request-local snapshots and hydrates existing nodes, draft and events', async ({ page, context }) => {
  await page.goto('/ssr?count=7&label=First');
  const output = page.getByLabel('Count');
  await expect(page.getByRole('heading', { name: 'First' })).toBeVisible();
  await expect(output).toHaveText('7');
  expect(await page.evaluate(() => customElements.get('en-probe-ssr') === undefined)).toBe(true);
  const other = await context.newPage();
  await other.goto('/ssr?count=23&label=Second');
  await expect(other.getByLabel('Count')).toHaveText('23');
  await expect(output).toHaveText('7');
  const draft = page.getByRole('textbox', { name: 'Draft' });
  await draft.fill('edited before hydration');
  await draft.press('ArrowLeft');
  const selectionBefore = await draft.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]);
  await page.evaluate(async () => {
    window.savedInput = document.querySelector('en-probe-ssr').shadowRoot.querySelector('input');
    await window.hydrateProbe();
  });
  await expect(page.locator('body')).toHaveAttribute('data-hydrated', 'true');
  await expect(draft).toHaveValue('edited before hydration');
  await expect(draft).toBeFocused();
  expect(await draft.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd])).toEqual(selectionBefore);
  expect(await page.evaluate(() => window.savedInput === document.querySelector('en-probe-ssr').shadowRoot.querySelector('input'))).toBe(true);
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(output).toHaveText('8');
  await expect(other.getByLabel('Count')).toHaveText('23');
});
