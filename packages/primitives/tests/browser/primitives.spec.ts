import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('ordinary typing accepts input; consumer-canceled typing keeps a draft until an explicit same-value rejection', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Draft title' });
  await input.fill('managed title');
  await expect(page.getByLabel('Accepted title')).toHaveText('managed title');
  await page.locator('en-editing-fixture').evaluate((element: any) => { element.addEventListener('en-change', (event: Event) => event.preventDefault()); });
  await input.fill('unsaved draft');
  await expect(input).toHaveValue('unsaved draft');
  await expect(page.getByLabel('Accepted title')).toHaveText('managed title');
  await page.locator('en-editing-fixture').evaluate((element: any) => element.write('managed title'));
  await expect(input).toHaveValue('managed title');
});

test('unrelated renders preserve native selection and a repeated mount does not duplicate requests', async ({ page }) => {
  const host = page.locator('en-editing-fixture');
  const input = page.getByRole('textbox', { name: 'Draft title' });
  await input.fill('selection value');
  await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(2, 7));
  await host.evaluate(async (element: any) => { element.requestUpdate(); await element.updateComplete; });
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual([2, 7]);
  await host.evaluate(async (element: any) => { element.remove(); document.body.append(element); await element.updateComplete; element.requests = 0; });
  await input.fill('after reconnect');
  expect(await host.evaluate((element: any) => element.requests)).toBe(1);
});

test('composition event sequencing preserves a native draft until a deferred authoritative write can reconcile', async ({ page }) => {
  const host = page.locator('en-editing-fixture');
  const input = page.getByRole('textbox', { name: 'Draft title' });
  await input.focus();
  // Synthetic sequencing verifies our guards; it is not evidence of a physical IME's complete behavior.
  // Playwright fill completes its own composition in Firefox, so it cannot represent an unfinished composition.
  await input.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
    element.value = '日本';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', isComposing: true, data: '日本' }));
  });
  await host.evaluate((element: any) => element.write('remote title'));
  await expect(input).toHaveValue('日本');
  await expect(page.getByLabel('Accepted title')).toHaveText('remote title');
  await input.evaluate((element) => element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: '日本' })));
  await expect(input).toHaveValue('remote title');
  expect(await host.evaluate((element: any) => element.requests)).toBe(0);
});

test('request cancellation reaches an application listener across two shadow boundaries', async ({ page }) => {
  await page.evaluate(() => document.addEventListener('en-change', (event) => event.preventDefault(), { once: true }));
  await page.getByRole('button', { name: 'Toggle state' }).click();
  await expect(page.getByLabel('Toggle value')).toHaveText('false');
  await page.getByRole('button', { name: 'Toggle state' }).click();
  await expect(page.getByLabel('Toggle value')).toHaveText('true');
});

test('disconnect during composition keeps the draft without leaving the reconnected editor stuck composing', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Draft title' });
  await input.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
    element.value = '未確定';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', isComposing: true, data: '未確定' }));
  });
  const host = page.locator('en-editing-fixture');
  await host.evaluate(async (element: any) => { element.remove(); document.body.append(element); await element.updateComplete; });
  await expect(input).toHaveValue('未確定');
  await expect(page.getByLabel('Accepted title')).toHaveText('saved');
  expect(await host.evaluate((element: any) => element.model.isComposing.get())).toBe(false);
  await input.fill('new edit');
  await expect(page.getByLabel('Accepted title')).toHaveText('new edit');
});

test('rejecting a completed composition does not suppress a later independent edit with the same text', async ({ page }) => {
  const host = page.locator('en-editing-fixture');
  const input = page.getByRole('textbox', { name: 'Draft title' });
  await host.evaluate((element: any) => { element.addEventListener('en-change', (event: Event) => event.preventDefault()); });
  await input.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
    element.value = '日本';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', isComposing: true }));
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: '日本' }));
  });
  expect(await host.evaluate((element: any) => element.requests)).toBe(1);
  await host.evaluate((element: any) => element.write('saved'));
  await input.fill('日本');
  expect(await host.evaluate((element: any) => element.requests)).toBe(2);
});

test('roving focus skips disabled items, respects RTL and leaves native editing arrow keys alone', async ({ page }) => {
  const first = page.getByRole('button', { name: 'First', exact: true });
  const last = page.getByRole('button', { name: 'Last', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(last).toBeFocused();
  await page.locator('en-roving-fixture').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  const edit = page.getByRole('textbox', { name: 'Nested edit' });
  await edit.fill('edit');
  await page.keyboard.press('ArrowLeft');
  await expect(edit).toBeFocused();
});

test('form helper submits once, mirrors native validity, honors disabled fieldsets and resets accepted data', async ({ page }) => {
  const email = page.getByRole('textbox', { name: 'Email', exact: true });
  await email.fill('reader@example.com');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByLabel('Submitted data')).toHaveText('{"email":"reader@example.com"}');
  await email.fill('invalid address');
  expect(await page.locator('form').evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(email).toHaveValue('hello@example.com');
  await page.locator('fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await expect(email).toBeDisabled();
  expect(await page.locator('form').evaluate((element: HTMLFormElement) => [...new FormData(element)])).toEqual([]);
  await page.locator('fieldset').evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await expect(email).toBeEnabled();
});

for (const authoritative of ['saved', 'NORMALIZED']) {
  test(`an en-input author write (${authoritative}) is retained without a stale en-change`, async ({ page }) => {
    const host = page.locator('en-editing-fixture');
    const input = page.getByRole('textbox', { name: 'Draft title' });
    await host.evaluate((element: any, next) => {
      element.observedChanges = 0;
      element.originalInput = element.shadowRoot.querySelector('input');
      element.addEventListener('en-change', () => element.observedChanges++);
      element.addEventListener('en-input', () => element.write(next), { once: true });
    }, authoritative);
    await input.fill('discard this draft');
    await expect(input).toHaveValue(authoritative);
    await expect(page.getByLabel('Accepted title')).toHaveText(authoritative);
    await expect(input).toBeFocused();
    expect(await host.evaluate((element: any) => ({
      requests: element.requests, changes: element.observedChanges,
      sameNode: element.originalInput === element.shadowRoot.querySelector('input'),
    }))).toEqual({ requests: 0, changes: 0, sameNode: true });

    // The guard protects only the superseded transaction, not future edits.
    await input.fill('next independent edit');
    await expect(page.getByLabel('Accepted title')).toHaveText('next independent edit');
    expect(await host.evaluate((element: any) => [element.requests, element.observedChanges])).toEqual([1, 1]);
  });

  test(`a composition-end en-input author write (${authoritative}) does not replay composed text`, async ({ page }) => {
    const host = page.locator('en-editing-fixture');
    const input = page.getByRole('textbox', { name: 'Draft title' });
    await host.evaluate((element: any, next) => {
      element.observedChanges = 0;
      element.originalInput = element.shadowRoot.querySelector('input');
      element.addEventListener('en-change', () => element.observedChanges++);
      const onInput = (event: CustomEvent) => {
        if (event.detail.isComposing || event.detail.inputType !== 'insertCompositionText') return;
        element.removeEventListener('en-input', onInput);
        element.write(next);
      };
      element.addEventListener('en-input', onInput);
    }, authoritative);
    await input.focus();
    // Synthetic composition sequencing verifies the controller boundary, not a physical IME.
    await input.evaluate((element: HTMLInputElement) => {
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, composed: true }));
      element.value = '日本';
      element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertCompositionText', isComposing: true }));
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, composed: true, data: '日本' }));
    });
    await expect(input).toHaveValue(authoritative);
    await expect(page.getByLabel('Accepted title')).toHaveText(authoritative);
    await expect(input).toBeFocused();
    expect(await host.evaluate((element: any) => ({
      requests: element.requests, changes: element.observedChanges,
      composing: element.model.isComposing.get(),
      sameNode: element.originalInput === element.shadowRoot.querySelector('input'),
    }))).toEqual({ requests: 0, changes: 0, composing: false, sameNode: true });
    await input.fill('later edit');
    await expect(page.getByLabel('Accepted title')).toHaveText('later edit');
    expect(await host.evaluate((element: any) => [element.requests, element.observedChanges])).toEqual([1, 1]);
  });
}
