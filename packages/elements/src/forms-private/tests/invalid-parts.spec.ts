import { test, expect, type Locator } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = `/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`;
const cases = [
  { tag: 'en-text-field', value: 'Accepted text', draft: 'A preserved editing draft' },
  { tag: 'en-search-input', value: 'accepted', draft: 'preserved query' },
  { tag: 'en-otp-field', value: '012345', draft: '987654' },
  { tag: 'en-textarea', value: 'Accepted notes', draft: 'Preserved draft\nSecond line' },
  { tag: 'en-number-field', value: '12', draft: '14', frame: 'stepper' },
  { tag: 'en-select', value: 'valid' },
  { tag: 'en-text-field', value: 'Accepted amount', draft: 'Preserved amount', adorned: true, frame: 'focus-frame' },
  { tag: 'en-otp-field', value: '012345', draft: '987654', adorned: true, frame: 'focus-frame' },
] as const;
const nativeControl = (host: Locator) => host.locator('input[part~="control"], textarea[part~="control"], select[part~="control"]');

async function feedback(host: Locator, visible: boolean, frame?: string) {
  // The permanent Part remains additive, so existing public customization and
  // the native editor locator survive every validation transition.
  await expect(nativeControl(host)).toHaveCount(1);
  await expect(host.locator('[part~="control-invalid"]')).toHaveCount(visible ? 1 : 0);
  if (visible) await expect(nativeControl(host)).toHaveAttribute('aria-invalid', 'true');
  else await expect(nativeControl(host)).not.toHaveAttribute('aria-invalid', 'true');
  if (frame) {
    await expect(host.locator(`[part~="${frame}"]`)).toHaveCount(1);
    await expect(host.locator(`[part~="${frame}-invalid"]`)).toHaveCount(visible ? 1 : 0);
  }
  await expect(host.locator('[part~="error"]')).toHaveCount(visible ? 1 : 0);
}

for (const entry of cases) {
  const frame = 'frame' in entry ? entry.frame : undefined;
  const adorned = 'adorned' in entry;
  test(`${entry.tag}${adorned ? ' adorned' : ''}: invalid Parts follow visible feedback and preserve the native editor`, async ({ page, browser }, info) => {
    info.annotations.push({ type: 'browser-version', description: browser.version() });
    await page.goto(fixture); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(async ({ tag, adorned }) => {
      const form = document.createElement('form'); form.id = 'invalid-parts-form';
      const host = document.createElement(tag) as HTMLElement & {
        label: string; required: boolean; value: string; placeholder: string;
        items: Array<{ value: string; label: string }>; adorned: boolean; updateComplete: Promise<unknown>;
      };
      host.id = 'invalid-parts-field'; host.label = 'Validation lifecycle'; host.required = true; host.value = '';
      host.setAttribute('name', 'lifecycle');
      if (tag === 'en-select') { host.placeholder = 'Choose a value'; host.items = [{ value: 'valid', label: 'Accepted selection' }]; }
      if (adorned) { host.adorned = true; const prefix = document.createElement('span'); prefix.slot = 'prefix'; prefix.textContent = '$'; host.append(prefix); }
      form.append(host); document.body.append(form); await host.updateComplete;
    }, { tag: entry.tag, adorned });
    const host = page.locator('#invalid-parts-field'), control = nativeControl(host);
    await expect(control).toBeVisible(); await feedback(host, false, frame);
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing)).toBe(true);
    const original = await control.elementHandle();
    await control.focus(); await expect(control).toBeFocused();

    await host.evaluate(async element => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = 'Application feedback'; await field.updateComplete; });
    await feedback(host, true, frame); await expect(host.locator('[part~="error"]')).toHaveText('Application feedback');
    await expect(control).toBeFocused();
    await host.evaluate(async element => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = ''; await field.updateComplete; });
    await feedback(host, false, frame);
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing), 'Clearing application feedback does not erase the pristine required constraint').toBe(true);

    expect(await host.evaluate(element => (element as HTMLElement & { reportValidity(): boolean }).reportValidity())).toBe(false);
    await feedback(host, true, frame); await expect(control).toBeFocused();
    if (entry.tag === 'en-select') await control.selectOption(entry.value);
    else await control.fill(entry.value);
    await feedback(host, false, frame); await expect(control).toHaveValue(entry.value);

    // Canceled text edits retain their native draft while the accepted value
    // remains valid. Error changes must not compete with EditingController.
    const draft = 'draft' in entry ? entry.draft : entry.value;
    if ('draft' in entry) {
      // One multiline fill can produce several native edit proposals. Keep the
      // cancellation policy active for the complete action, then remove it.
      const cancellation = await host.evaluateHandle(element => {
        const controller = new AbortController();
        element.addEventListener('en-change', event => event.preventDefault(), { signal: controller.signal });
        return controller;
      });
      try {
        await control.fill(draft); await expect(host).toHaveJSProperty('value', entry.value);
      } finally {
        await cancellation.evaluate(controller => controller.abort());
        await cancellation.dispose();
      }
    }
    await control.focus();
    const textSelection = entry.tag !== 'en-select' && entry.tag !== 'en-number-field';
    if (textSelection) await control.evaluate(element => (element as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(1, 4));
    const selection = textSelection ? await control.evaluate(element => { const input = element as HTMLInputElement | HTMLTextAreaElement; return [input.selectionStart, input.selectionEnd]; }) : null;
    for (const error of ['Application feedback during editing', '']) {
      await host.evaluate(async (element, message) => { const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; field.error = message; await field.updateComplete; }, error);
      await feedback(host, Boolean(error), frame); await expect(control).toHaveValue(draft); await expect(control).toBeFocused();
      expect(await control.evaluate((element, original) => element === original, original)).toBe(true);
      if (textSelection) expect(await control.evaluate(element => { const input = element as HTMLInputElement | HTMLTextAreaElement; return [input.selectionStart, input.selectionEnd]; })).toEqual(selection);
    }

    await page.locator('#invalid-parts-form').evaluate(form => (form as HTMLFormElement).reset());
    await feedback(host, false, frame); await expect(control).toHaveValue(''); await expect(control).toBeFocused();
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing)).toBe(true);
    expect(await control.evaluate((element, original) => element === original, original)).toBe(true);
    await original?.dispose();
  });
}
