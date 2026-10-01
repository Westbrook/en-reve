import { test, expect, type Page, type Locator } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = `/@fs${fileURLToPath(new URL('./color-trigger-fixture.html', import.meta.url))}`;
const nativeControl = (page: Page) => page.getByLabel('Accent color', { exact: true });
const snapshot = (page: Page) => page.evaluate(() => (window as any).colorTriggerFixture);

async function instrumentPicker(control: Locator, mode: 'success' | 'absent' | 'throw' = 'success', key = 'main') {
  await control.evaluate((input: HTMLInputElement, { mode, key }) => {
    const calls = (window as any).colorTriggerFixture.calls;
    const record = (method: string) => calls.push({ key, method, type: input.type, value: input.value, active: navigator.userActivation.isActive });
    Object.defineProperty(input, 'showPicker', { configurable: true, value: mode === 'absent' ? undefined : () => {
      record('showPicker');
      if (mode === 'throw') throw new DOMException('Instrumented invocation failure', 'NotAllowedError');
    } });
    Object.defineProperty(input, 'click', { configurable: true, value: () => record('click') });
  }, { mode, key });
}

async function setTrigger(page: Page, id: string) {
  await page.locator('#color-field').evaluate(async (field: any, id) => { field.for = id; await field.updateComplete; }, id);
}

test.beforeEach(async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  info.annotations.push({ type: 'picker-evidence', description: 'Trusted trigger activation with instrumented native invocation boundary. Does not verify OS picker opening, selection, close or cancel.' });
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('trusted pointer and keyboard activation invoke once, follow native focus and prevent submit', async ({ page }) => {
  const control = nativeControl(page);
  await expect(control).toBeVisible();
  await expect(control).toHaveAccessibleDescription('Choose a six-digit sRGB color.');
  await instrumentPicker(control);
  // Successful invocation must follow ordinary native button focus behavior.
  const baseline = page.getByRole('button', { name: 'Native focus baseline', exact: true });
  await baseline.focus();
  await baseline.click();
  const nativePointerFocus = await baseline.evaluate(button => button.matches(':focus'));
  const trigger = page.getByRole('button', { name: 'Choose accent with native button', exact: true });
  for (const action of ['pointer', 'Enter', 'Space']) {
    await trigger.focus();
    if (action === 'pointer') await trigger.click(); else await trigger.press(action);
    if (action === 'pointer') expect(await trigger.evaluate(button => button.matches(':focus'))).toBe(nativePointerFocus);
    else await expect(trigger).toBeFocused();
  }
  const state = await snapshot(page);
  expect(state.calls).toEqual(Array.from({ length: 3 }, () => ({ key: 'main', method: 'showPicker', type: 'color', value: '#336699', active: true })));
  expect(state.submissions).toEqual([]);
  expect(state.events.filter((event: any) => event.id === 'color-field')).toEqual([]);
  await expect(control).toHaveValue('#336699');
  expect(await control.evaluate((input: HTMLInputElement) => Object.hasOwn(input, 'showPicker'))).toBe(true);
  await expect(trigger).not.toHaveAttribute('aria-expanded');
  await expect(page.locator('#color-field')).not.toHaveAttribute('open');
});

for (const [id, name] of [
  ['component-trigger', 'Choose accent with component button'],
  ['swatch-trigger', 'Choose accent color'],
]) {
  test(`${id}: reusable external sample/control invokes the color field without changing its value`, async ({ page }) => {
    await instrumentPicker(nativeControl(page));
    await setTrigger(page, id);
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(trigger).toBeFocused();
    const state = await snapshot(page);
    expect(state.calls).toEqual([{ key: 'main', method: 'showPicker', type: 'color', value: '#336699', active: true }]);
    expect(state.submissions).toEqual([]);
    expect(state.events.filter((event: any) => event.id === 'color-field')).toEqual([]);
    await expect(page.locator('#color-field')).toHaveJSProperty('value', '#336699');
  });
}

test('canceling swatch action or the original native click prevents picker invocation', async ({ page }) => {
  await instrumentPicker(nativeControl(page));
  await setTrigger(page, 'swatch-trigger');
  await page.locator('#swatch-trigger').evaluate(host => host.addEventListener('en-action', event => event.preventDefault()));
  await page.getByRole('button', { name: 'Choose accent color', exact: true }).click();
  expect((await snapshot(page)).calls).toEqual([]);
  await setTrigger(page, 'native-trigger');
  await page.locator('#native-trigger').evaluate(button => button.addEventListener('click', event => event.preventDefault(), { capture: true }));
  await page.getByRole('button', { name: 'Choose accent with native button', exact: true }).click();
  const state = await snapshot(page);
  expect(state.calls).toEqual([]);
  expect(state.submissions).toEqual([]);
});

for (const mode of ['absent', 'throw'] as const) {
  test(`${mode} showPicker uses one instrumented native-click fallback and leaves the native field reachable`, async ({ page }) => {
    const control = nativeControl(page);
    await instrumentPicker(control, mode);
    await page.getByRole('button', { name: 'Choose accent with native button', exact: true }).click();
    await expect(control).toBeVisible();
    await expect(control).toBeFocused();
    expect((await snapshot(page)).calls.map((call: any) => call.method)).toEqual(mode === 'absent' ? ['click'] : ['showPicker', 'click']);
    await expect(page.locator('#color-field')).toHaveJSProperty('value', '#336699');
  });
}

test('disabled field, disabled fieldset and aria-disabled trigger block external invocation', async ({ page }) => {
  await instrumentPicker(nativeControl(page));
  const trigger = page.getByRole('button', { name: 'Choose accent with native button', exact: true });
  await page.locator('#color-field').evaluate(async (field: any) => { field.disabled = true; await field.updateComplete; });
  await trigger.click();
  await expect(nativeControl(page)).toBeDisabled();
  expect((await snapshot(page)).calls).toEqual([]);
  await page.locator('#color-field').evaluate(async (field: any) => { field.disabled = false; await field.updateComplete; });
  await page.locator('#color-group').evaluate((group: HTMLFieldSetElement) => { group.disabled = true; });
  await expect(nativeControl(page)).toBeDisabled();
  await trigger.click();
  expect((await snapshot(page)).calls).toEqual([]);
  await page.locator('#color-group').evaluate((group: HTMLFieldSetElement) => { group.disabled = false; });
  await expect(nativeControl(page)).toBeEnabled();
  await trigger.evaluate(button => button.setAttribute('aria-disabled', 'true'));
  await trigger.focus();
  await trigger.press('Enter');
  expect((await snapshot(page)).calls).toEqual([]);
  expect((await snapshot(page)).submissions).toEqual([]);
});


test('disabled native and component triggers remain inert, including a loading component', async ({ page }) => {
  await instrumentPicker(nativeControl(page));
  const native = page.locator('#native-trigger');
  await native.evaluate((button: HTMLButtonElement) => { button.disabled = true; button.click(); });
  expect((await snapshot(page)).calls).toEqual([]);
  for (const id of ['component-trigger', 'swatch-trigger']) {
    await setTrigger(page, id);
    await page.locator(`#${id}`).evaluate(async (host: any) => {
      host.disabled = true; await host.updateComplete;
      host.shadowRoot.querySelector('button').click();
    });
    await expect(page.locator(`#${id}`).getByRole('button')).toBeDisabled();
    expect((await snapshot(page)).calls).toEqual([]);
  }
  await setTrigger(page, 'component-trigger');
  await page.locator('#component-trigger').evaluate(async (host: any) => {
    host.disabled = false; host.loading = true; await host.updateComplete;
    host.shadowRoot.querySelector('button').click();
  });
  expect((await snapshot(page)).calls).toEqual([]);
  expect((await snapshot(page)).submissions).toEqual([]);
});

test('public showPicker delegates to its native input without emitting accepted-color events', async ({ page }) => {
  const control = nativeControl(page);
  await instrumentPicker(control);
  await page.locator('#color-field').evaluate((field: any) => field.showPicker());
  const state = await snapshot(page);
  expect(state.calls.map((call: any) => [call.method, call.type, call.value])).toEqual([['showPicker', 'color', '#336699']]);
  expect(state.events).toEqual([]);
  await expect(control).toHaveValue('#336699');
});

test('for rebinding, replacement, disconnect and reconnect leave one current trigger listener', async ({ page }) => {
  await instrumentPicker(nativeControl(page));
  await setTrigger(page, 'swatch-trigger');
  await page.getByRole('button', { name: 'Choose accent with native button', exact: true }).click();
  expect((await snapshot(page)).calls).toEqual([]);
  await page.getByRole('button', { name: 'Choose accent color', exact: true }).click();
  expect((await snapshot(page)).calls).toHaveLength(1);
  await setTrigger(page, 'native-trigger');
  await page.locator('#native-trigger').evaluate(button => {
    const replacement = document.createElement('button'); replacement.type = 'button'; replacement.id = button.id; replacement.textContent = 'Replacement color trigger';
    button.replaceWith(replacement);
  });
  const replacement = page.getByRole('button', { name: 'Replacement color trigger' });
  await replacement.click();
  expect((await snapshot(page)).calls).toHaveLength(2);
  await page.locator('#color-field').evaluate(field => { (window as any).detachedColorField = field; field.remove(); });
  await replacement.click();
  expect((await snapshot(page)).calls).toHaveLength(2);
  await page.evaluate(async () => {
    const field = (window as any).detachedColorField;
    document.getElementById('color-group')!.append(field);
    await field.updateComplete;
  });
  await replacement.click();
  expect((await snapshot(page)).calls).toHaveLength(3);
});

test('same-root lookup never binds a document match from inside a shadow root', async ({ page }) => {
  await page.locator('#color-shadow').evaluate(async host => {
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<en-color-field id="scoped-field" for="native-trigger" label="Scoped accent" value="#112233"></en-color-field>';
    await (root.getElementById('scoped-field') as any).updateComplete;
  });
  await instrumentPicker(nativeControl(page));
  const scoped = page.getByLabel('Scoped accent', { exact: true });
  await instrumentPicker(scoped, 'success', 'scoped');
  await page.getByRole('button', { name: 'Choose accent with native button', exact: true }).click();
  expect((await snapshot(page)).calls.map((call: any) => call.key)).toEqual(['main']);
  await page.locator('#color-shadow').evaluate(host => {
    const trigger = document.createElement('button'); trigger.type = 'button'; trigger.id = 'native-trigger'; trigger.textContent = 'Scoped color trigger';
    host.shadowRoot!.prepend(trigger);
  });
  await page.getByRole('button', { name: 'Scoped color trigger', exact: true }).click();
  expect((await snapshot(page)).calls.map((call: any) => call.key)).toEqual(['main', 'scoped']);
});

test('DOM color edits submit one accepted value while a consumer-bound swatch follows accepted color', async ({ page }, info) => {
  info.annotations.push({ type: 'color-selection-evidence', description: 'Playwright fill drives the DOM input adapter; no native OS color chooser selection is exercised.' });
  const control = nativeControl(page);
  const sample = page.locator('#swatch-trigger').locator('[part="color"]');
  await expect(sample).toHaveCSS('background-color', 'rgb(51, 102, 153)');
  await control.fill('#aa5577');
  await expect(page.locator('#color-field')).toHaveJSProperty('value', '#aa5577');
  await expect(sample).toHaveCSS('background-color', 'rgb(170, 85, 119)');
  await page.getByRole('button', { name: 'Submit accent', exact: true }).click();
  expect((await snapshot(page)).submissions).toEqual([[['accent', '#aa5577']]]);
  await page.getByRole('button', { name: 'Reset accent', exact: true }).click();
  await expect(control).toHaveValue('#336699');
  await expect(sample).toHaveCSS('background-color', 'rgb(51, 102, 153)');
  await page.locator('#color-field').evaluate(field => field.addEventListener('en-change', event => event.preventDefault()));
  await control.fill('#abcdef');
  await expect(control).toHaveValue('#abcdef');
  await expect(page.locator('#color-field')).toHaveJSProperty('value', '#336699');
  await expect(sample).toHaveCSS('background-color', 'rgb(51, 102, 153)');
  await page.getByRole('button', { name: 'Submit accent', exact: true }).click();
  expect((await snapshot(page)).submissions.at(-1)).toEqual([['accent', '#336699']]);
  await page.evaluate(() => (window as any).acceptAccent('#7055AA'));
  await expect(control).toHaveValue('#7055aa');
  await expect(sample).toHaveCSS('background-color', 'rgb(112, 85, 170)');
});
