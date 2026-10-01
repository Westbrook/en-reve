import { expect, test, type Page } from '@playwright/test';

const path = '/packages/elements/src/slider/tests/fixture.html';
const invalidMessage = 'Use a value from 0 to 100 in steps of 5.';
type Slider = HTMLElement & {
  updateComplete: Promise<unknown>; value: number; editable: boolean;
  min: number; max: number; step: number; description: string; valueText: string;
  orientation: 'horizontal' | 'vertical'; editorLabel: string; validity: ValidityState; checkValidity(): boolean;
};
type ChangeRecord = { type: string; previous: number; proposed: number; reason: string; value: number; entries: [string, FormDataEntryValue][]; cancelable: boolean };
type FixtureWindow = Window & {
  sliderEvents: ChangeRecord[]; sliderSubmits: number; editorNode?: Element; rangeNode?: Element;
  validityAtInput?: { host: boolean; native: boolean }; requestCancellation?: AbortController;
};

async function mount(page: Page, attributes = 'editable'): Promise<void> {
  await page.goto(path);
  await page.evaluate(async attributes => {
    await customElements.whenDefined('en-slider');
    const state = window as unknown as FixtureWindow;
    state.sliderEvents = []; state.sliderSubmits = 0;
    document.querySelector('#fixture')!.innerHTML = '<form id="form"><fieldset id="fieldset">'
      + '<button id="before" type="button">Before</button>'
      + '<en-slider id="slider" name="opacity" label="Opacity" min="0" max="100" step="5" value="20" '
      + 'validation-text="Use a value from 0 to 100 in steps of 5." ' + attributes + '></en-slider>'
      + '<button id="after" type="button">After</button></fieldset>'
      + '<button id="reset" type="reset">Reset</button><button id="submit" type="submit">Submit</button></form>';
    const slider = document.querySelector('#slider') as Slider;
    slider.addEventListener('en-change', event => {
      state.sliderEvents.push({ type: event.type, ...(event as CustomEvent).detail, value: slider.value, cancelable: event.cancelable,
        entries: Array.from(new FormData(document.querySelector('#form') as HTMLFormElement)) });
    });
    document.querySelector('#form')!.addEventListener('submit', event => { event.preventDefault(); state.sliderSubmits++; });
    await slider.updateComplete;
  }, attributes);
  await expect(page.getByRole('slider', { name: 'Opacity', exact: true })).toHaveValue('20');
}

async function state(page: Page) {
  return page.evaluate(() => {
    const slider = document.querySelector('#slider') as Slider;
    const fixture = window as unknown as FixtureWindow;
    return { value: slider.value, valid: slider.validity.valid,
      entries: Array.from(new FormData(document.querySelector('#form') as HTMLFormElement)),
      changes: fixture.sliderEvents.filter(event => event.type === 'en-change'), submits: fixture.sliderSubmits };
  });
}

async function writeValue(page: Page, value?: number): Promise<void> {
  await page.locator('#slider').evaluate(async (element, value) => {
    const slider = element as Slider;
    slider.value = value ?? slider.value;
    await slider.updateComplete;
  }, value);
}

test('editing is opt-in, with two named native keyboard stops and live label slots', async ({ page, browserName }) => {
  // WebKit's macOS default uses Option-Tab to include all native controls.
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await mount(page, 'show-value value-text="20 percent"');
  const slider = page.getByRole('slider', { name: 'Opacity', exact: true });
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await page.locator('#before').focus(); await page.keyboard.press(tab); await expect(slider).toBeFocused();
  await page.keyboard.press(tab); await expect(page.locator('#after')).toBeFocused();
  await page.locator('#slider').evaluate(async element => { (element as Slider).editable = true; await (element as Slider).updateComplete; });
  const editor = page.getByRole('spinbutton', { name: 'Opacity Exact value', exact: true });
  await expect(editor).toHaveValue('20');
  await expect(slider).toHaveAttribute('aria-valuetext', '20 percent');
  expect(await editor.getAttribute('aria-valuetext')).toBeNull();
  await page.locator('#before').focus(); await page.keyboard.press(tab); await expect(slider).toBeFocused();
  await page.keyboard.press(tab); await expect(editor).toBeFocused();
  await page.keyboard.press(tab); await expect(page.locator('#after')).toBeFocused();
  await page.locator('#slider').evaluate(element => {
    element.innerHTML = '<span slot="label">Layer opacity</span><span slot="editor-label">Exact amount</span>';
  });
  await expect(page.getByRole('slider')).toHaveAccessibleName('Layer opacity');
  await expect(page.getByRole('spinbutton')).toHaveAccessibleName('Layer opacity Exact amount');
  await page.locator('#slider [slot="editor-label"]').evaluate(node => node.remove());
  await expect(page.getByRole('spinbutton')).toHaveAccessibleName('Layer opacity Exact value');
});

test('native number editing retains a draft until Enter or blur and emits one tentative change', async ({ page }) => {
  await mount(page);
  const editor = page.getByRole('spinbutton');
  const slider = page.getByRole('slider');
  await editor.fill('35');
  await expect(slider).toHaveValue('20');
  expect((await state(page)).entries).toEqual([['opacity', '20']]);
  expect((await state(page)).changes).toEqual([]);
  await editor.press('Enter');
  await expect(editor).toHaveValue('35'); await expect(slider).toHaveValue('35');
  await expect(editor).toBeFocused();
  await editor.press('Tab');
  let current = await state(page);
  expect(current.entries).toEqual([['opacity', '35']]);
  expect(current.changes.map(event => [event.proposed, event.reason])).toEqual([[35, 'change']]);
  expect(current.changes).toHaveLength(1); expect(current.submits).toBe(0);
  await editor.fill('40'); await editor.press('Tab');
  await expect(slider).toHaveValue('40');
  current = await state(page);
  expect(current.changes.map(event => event.proposed)).toEqual([35, 40]);
  expect(current.changes).toHaveLength(2); expect(current.entries).toEqual([['opacity', '40']]);
});

test('empty, out-of-range and off-step drafts retain their text, explain errors and block submission', async ({ page, browserName }) => {
  await mount(page);
  const editor = page.getByRole('spinbutton');
  for (const [index, draft] of ['', '101', '22'].entries()) {
    await editor.fill(draft);
    await editor.press(index === 1 ? (browserName === 'webkit' ? 'Alt+Tab' : 'Tab') : 'Enter');
    await expect(editor).toHaveValue(draft);
    await expect(page.getByRole('slider')).toHaveValue('20');
    await expect(page.locator('#slider [part~="error"]')).toHaveText(invalidMessage);
    await expect(editor).toHaveAttribute('aria-invalid', 'true');
    await expect(editor).toHaveAccessibleDescription(invalidMessage);
    if (index === 1) await expect(page.locator('#after')).toBeFocused();
    const current = await state(page);
    expect(current.valid).toBe(false); expect(current.entries).toEqual([['opacity', '20']]);
    expect(current.changes).toEqual([]);
    await page.locator('#form').evaluate((form: HTMLFormElement) => form.requestSubmit());
    expect((await state(page)).submits).toBe(0);
    await editor.focus(); await editor.press('Escape');
    await expect(editor).toHaveValue('20'); await expect(editor).not.toHaveAttribute('aria-invalid', 'true');
    expect((await state(page)).valid).toBe(true);
  }
});

test('canceled numeric completions retain valid drafts and authoritative writes reconcile them silently', async ({ page }) => {
  await mount(page);
  const host = page.locator('#slider');
  const editor = page.getByRole('spinbutton');
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  await host.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  await editor.fill('35'); await editor.press('Enter'); await editor.press('Tab');
  await expect(editor).toHaveValue('35'); await expect(page.getByRole('slider')).toHaveValue('20');
  let current = await state(page);
  expect(current.valid).toBe(true); expect(current.entries).toEqual([['opacity', '20']]);
  expect(current.changes).toEqual([expect.objectContaining({ value: 35, previous: 20, proposed: 35,
    entries: [['opacity', '35']], cancelable: true })]);
  await editor.focus(); await writeValue(page);
  await expect(editor).toHaveValue('20'); await expect(editor).toBeFocused();
  await host.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  await editor.fill('40'); await editor.press('Enter'); await editor.press('Tab');
  await expect(editor).toHaveValue('40'); await expect(page.getByRole('slider')).toHaveValue('20');
  current = await state(page);
  expect(current.changes).toHaveLength(2);
  await writeValue(page, 40);
  await expect(page.getByRole('slider')).toHaveValue('40'); await expect(editor).toHaveValue('40');
  expect((await state(page)).entries).toEqual([['opacity', '40']]);
  expect((await state(page)).changes).toHaveLength(2);
});

test('a same-value tentative author write supersedes cancellation without duplicate notification', async ({ page }) => {
  await mount(page);
  await page.locator('#slider').evaluate(element => element.addEventListener('en-change', event => {
    event.preventDefault();
    (element as Slider).value = (element as Slider).value;
  }));
  const editor = page.getByRole('spinbutton');
  await editor.fill('45'); await editor.press('Enter'); await editor.press('Tab');
  await expect(editor).toHaveValue('45'); await expect(page.getByRole('slider')).toHaveValue('45');
  const current = await state(page);
  expect(current.entries).toEqual([['opacity', '45']]); expect(current.changes).toHaveLength(1);
  expect(current.changes[0]).toEqual(expect.objectContaining({ value: 45, entries: [['opacity', '45']] }));
  expect(current.submits).toBe(0);
});

test('range adjustment resolves an invalid draft only when its proposed value is accepted', async ({ page }) => {
  await mount(page);
  const editor = page.getByRole('spinbutton'), slider = page.getByRole('slider');
  await editor.fill('101'); await editor.press('Enter');
  await slider.focus(); await expect(editor).toHaveValue('101');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('25'); await expect(editor).toHaveValue('25');
  expect((await state(page)).valid).toBe(true);
  await editor.fill('101'); await editor.press('Enter');
  await page.locator('#slider').evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  await slider.focus(); await slider.press('ArrowRight');
  await expect(slider).toHaveValue('25'); await expect(editor).toHaveValue('101');
  await expect(slider).toBeFocused(); await expect(editor).toHaveAttribute('aria-invalid', 'true');
  expect((await state(page)).entries).toEqual([['opacity', '25']]);
  await slider.click({ position: { x: (await slider.boundingBox())!.width * 0.8, y: (await slider.boundingBox())!.height / 2 } });
  const accepted = (await state(page)).value;
  expect(accepted).toBeGreaterThan(25); expect(accepted % 5).toBe(0);
  await expect(editor).toHaveValue(String(accepted)); expect((await state(page)).valid).toBe(true);
});

test('unrelated renders preserve the native editor and draft while authoritative changes reconcile it', async ({ page }) => {
  await mount(page);
  const host = page.locator('#slider'), editor = page.getByRole('spinbutton');
  await editor.fill('35');
  await editor.evaluate(node => { (window as unknown as FixtureWindow).editorNode = node; });
  await host.evaluate(async element => {
    const slider = element as Slider; slider.description = 'Choose export opacity.'; slider.valueText = '20 percent';
    await slider.updateComplete;
  });
  await expect(editor).toHaveValue('35'); await expect(editor).toBeFocused();
  expect(await editor.evaluate(node => node === (window as unknown as FixtureWindow).editorNode)).toBe(true);
  expect(await editor.getAttribute('aria-valuetext')).toBeNull();
  await expect(page.getByRole('slider')).toHaveAttribute('aria-valuetext', '20 percent');
  await editor.press('ControlOrMeta+A'); await editor.pressSequentially('45'); await editor.press('Enter');
  await expect(editor).toHaveValue('45'); expect((await state(page)).value).toBe(45);
  await editor.fill('5');
  await host.evaluate(async element => { (element as Slider).min = 10; await (element as Slider).updateComplete; });
  await expect(editor).toHaveValue('5'); expect((await state(page)).value).toBe(45);
  await editor.press('Enter'); await expect(editor).toHaveAttribute('aria-invalid', 'true');
  await host.evaluate(async element => { (element as Slider).max = 40; await (element as Slider).updateComplete; });
  await expect(editor).toHaveValue('40'); await expect(page.getByRole('slider')).toHaveValue('40');
  expect((await state(page)).valid).toBe(true);
});

test('fieldset disability omits one entry and application-owned reset uses native form cancellation', async ({ page }) => {
  await mount(page);
  const editor = page.getByRole('spinbutton'), slider = page.getByRole('slider');
  await editor.fill('35');
  await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = true; });
  await expect(editor).toBeDisabled(); await expect(slider).toBeDisabled();
  expect((await state(page)).entries).toEqual([]); expect((await state(page)).valid).toBe(true);
  await expect(editor).toHaveValue('35');
  await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = false; });
  await expect(editor).toBeEnabled(); await editor.press('Enter'); await expect(slider).toHaveValue('35');
  await page.locator('#reset').click();
  await expect(editor).toHaveValue('20'); await expect(slider).toHaveValue('20');
  await writeValue(page, 30);
  await page.locator('#slider').evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
  await editor.fill('40'); await editor.press('Enter'); await expect(editor).toHaveValue('40');
  await page.locator('#form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
  await page.locator('#reset').click();
  await expect(editor).toHaveValue('40'); await expect(slider).toHaveValue('30');
  expect((await state(page)).entries).toEqual([['opacity', '30']]);
  await page.locator('#form').evaluate(form => form.addEventListener('reset', event => {
    event.preventDefault(); (form.querySelector('#slider') as Slider).value = 30;
  }, { once: true }));
  await page.locator('#reset').click();
  await expect(editor).toHaveValue('30'); await expect(slider).toHaveValue('30');
});

test('en-input listeners observe current draft validity and cannot submit stale accepted data as a valid form', async ({ page }) => {
  await mount(page);
  await page.locator('#slider').evaluate(element => element.addEventListener('en-input', event => {
    if ((event as CustomEvent).detail.value !== '') return;
    const native = element.shadowRoot!.querySelector('[part="editor"]') as HTMLInputElement;
    (window as unknown as FixtureWindow).validityAtInput = { host: (element as Slider).validity.valid, native: native.validity.valid };
    (document.querySelector('#form') as HTMLFormElement).requestSubmit();
  }));
  await page.getByRole('spinbutton').fill('');
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).validityAtInput)).toEqual({ host: false, native: false });
  const current = await state(page);
  expect(current.submits).toBe(0); expect(current.entries).toEqual([['opacity', '20']]); expect(current.changes).toEqual([]);
});

test('simulated composition defers an authoritative editor replacement until composition ends', async ({ page }) => {
  // Lifecycle coverage only: this does not claim physical IME or dictation support.
  await mount(page);
  const editor = page.getByRole('spinbutton');
  await editor.focus();
  await editor.evaluate((input: HTMLInputElement) => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { data: '', bubbles: true }));
    input.value = '35';
    input.dispatchEvent(new InputEvent('input', {
      data: '35', inputType: 'insertCompositionText', isComposing: true, bubbles: true, composed: true,
    }));
  });
  await writeValue(page, 40);
  await expect(editor).toHaveValue('35'); await expect(page.getByRole('slider')).toHaveValue('40');
  expect((await state(page)).entries).toEqual([['opacity', '40']]);
  await editor.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
  expect((await state(page)).changes).toEqual([]);
  await editor.dispatchEvent('compositionend', { data: '35' });
  await expect(editor).toHaveValue('40'); await expect(editor).toBeFocused();
  expect((await state(page)).changes).toEqual([]);
});

test('invalid drafts survive fieldset re-enable and a single pointer Reset completes after blur', async ({ page }) => {
  await mount(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const editor = page.getByRole('spinbutton');
  await editor.fill('101');
  await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = true; });
  await expect(editor).toBeDisabled();
  expect((await state(page)).valid).toBe(true);
  await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = false; });
  await expect(editor).toBeEnabled();
  await expect(editor).toHaveValue('101');
  expect((await state(page)).valid).toBe(false);
  expect(errors).toEqual([]);
  await editor.press('Escape');
  await writeValue(page, 40);
  await editor.fill('101');
  await page.locator('#reset').click();
  await expect(editor).toHaveValue('20');
  expect((await state(page)).entries).toEqual([['opacity', '20']]);
  expect((await state(page)).valid).toBe(true);
});

test('a consumer changing bounds and restoring prior value cannot accept an obsolete tentative value', async ({ page }) => {
  await mount(page);
  await page.locator('#slider').evaluate(element => element.addEventListener('en-change', event => {
    const slider = element as Slider;
    slider.max = 30;
    slider.value = (event as CustomEvent).detail.previous;
    event.preventDefault();
  }, { once: true }));
  const editor = page.getByRole('spinbutton');
  await editor.fill('35'); await editor.press('Enter');
  await expect(editor).toHaveValue('20');
  await expect(page.getByRole('slider')).toHaveValue('20');
  expect((await state(page)).changes).toHaveLength(1);
  expect((await state(page)).valid).toBe(true);
});

test('exact entry and native arrow stepping retain small fractional steps', async ({ page }) => {
  await mount(page);
  await page.locator('#slider').evaluate(async element => {
    const slider = element as Slider;
    slider.min = 0; slider.max = 1e-13; slider.step = 1e-15; slider.value = 2e-15;
    await slider.updateComplete;
  });
  const editor = page.getByRole('spinbutton');
  await editor.fill('0.000000000000003'); await editor.press('Enter');
  expect((await state(page)).value).toBe(3e-15);
  expect(await editor.evaluate((input: HTMLInputElement) => input.valueAsNumber)).toBe(3e-15);
  await page.getByRole('slider').focus(); await page.getByRole('slider').press('ArrowRight');
  expect((await state(page)).value).toBe(4e-15);
  expect(await editor.evaluate((input: HTMLInputElement) => input.valueAsNumber)).toBe(4e-15);
});

test.describe('touch interaction', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 720 } });
  test('native touch adjustment and exact entry share one value without horizontal clipping', async ({ page }) => {
    await mount(page);
    const slider = page.getByRole('slider'), editor = page.getByRole('spinbutton');
    const box = (await slider.boundingBox())!;
    await slider.tap({ position: { x: box.width * 0.8, y: box.height / 2 } });
    const accepted = (await state(page)).value;
    expect(accepted).toBeGreaterThan(20); await expect(editor).toHaveValue(String(accepted));
    await editor.tap(); await editor.fill('45'); await editor.press('Enter');
    await expect(slider).toHaveValue('45'); expect((await state(page)).entries).toEqual([['opacity', '45']]);
    const bounds = await page.locator('#slider').evaluate(host => ({ client: host.clientWidth, scroll: host.scrollWidth }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
  });
});


test.describe('vertical orientation', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`native vertical keyboard, naming and exact entry work in ${direction}`, async ({ page, browserName }) => {
      await mount(page, 'orientation="vertical" editable description="Choose the layer opacity."');
      await page.locator('#slider').evaluate((element, direction) => {
        element.dir = direction;
        element.innerHTML = '<span slot="label">Layer opacity</span>';
      }, direction);
      const slider = page.getByRole('slider', { name: 'Layer opacity', exact: true });
      const editor = page.getByRole('spinbutton', { name: 'Layer opacity Exact value', exact: true });
      await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
      await expect(slider).toHaveAccessibleDescription('Choose the layer opacity.');
      expect(await editor.evaluate(node => getComputedStyle(node).direction)).toBe(direction);
      await page.locator('#before').focus();
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(slider).toBeFocused();
      await slider.press('ArrowUp'); await expect(slider).toHaveValue('25');
      await slider.press('ArrowDown'); await expect(slider).toHaveValue('20');
      await slider.press('Home'); await expect(slider).toHaveValue('0');
      await slider.press('End'); await expect(slider).toHaveValue('100');
      await slider.press('ArrowUp'); await expect(slider).toHaveValue('100');
      await expect(editor).toHaveValue('100');
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(editor).toBeFocused();
      await editor.fill('45'); await editor.press('Enter');
      await expect(slider).toHaveValue('45');
      expect((await state(page)).entries).toEqual([['opacity', '45']]);
      expect((await state(page)).submits).toBe(0);
    });

    test(`vertical pointer proposals, cancellation, disability and reset work in ${direction}`, async ({ page }) => {
      await mount(page, 'orientation="vertical" editable show-value');
      await page.locator('#slider').evaluate((element, direction) => { element.dir = direction; }, direction);
      const slider = page.getByRole('slider'), editor = page.getByRole('spinbutton');
      const box = (await slider.boundingBox())!;
      expect(box.height).toBeGreaterThan(box.width * 2);
      await slider.click({ position: { x: box.width / 2, y: box.height * 0.1 } });
      const upper = (await state(page)).value;
      expect(upper).toBeGreaterThan(50); expect(upper % 5).toBe(0);
      await expect(editor).toHaveValue(String(upper));
      await expect(page.locator('#slider [part="output"]')).toHaveText(String(upper));
      await slider.click({ position: { x: box.width / 2, y: box.height * 0.9 } });
      const lower = (await state(page)).value;
      expect(lower).toBeLessThan(50); expect(lower % 5).toBe(0);
      const beforeCancellation = await state(page);
      await page.locator('#slider').evaluate(element => {
        // A native gesture can propose more than once; reject each proposal until the consumer releases control.
        const cancellation = new AbortController();
        (window as unknown as FixtureWindow).requestCancellation = cancellation;
        element.addEventListener('en-change', event => event.preventDefault(), { signal: cancellation.signal });
      });
      await slider.click({ position: { x: box.width / 2, y: box.height * 0.1 } });
      await expect(slider).toHaveValue(String(lower)); await expect(editor).toHaveValue(String(lower));
      const canceled = await state(page);
      expect(canceled.changes.length).toBeGreaterThan(beforeCancellation.changes.length);
      expect(canceled.entries).toEqual([['opacity', String(lower)]]);
      await page.evaluate(() => (window as unknown as FixtureWindow).requestCancellation!.abort());
      await slider.click({ position: { x: box.width / 2, y: box.height * 0.1 } });
      await expect(slider).toHaveValue(String(upper)); await expect(editor).toHaveValue(String(upper));
      expect((await state(page)).entries).toEqual([['opacity', String(upper)]]);
      await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = true; });
      await expect(slider).toBeDisabled(); await expect(editor).toBeDisabled();
      expect((await state(page)).entries).toEqual([]);
      await page.locator('#fieldset').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = false; });
      await expect(slider).toBeEnabled(); await expect(editor).toBeEnabled();
      await page.locator('#reset').click();
      await expect(slider).toHaveValue('20'); await expect(editor).toHaveValue('20');
      await expect(page.locator('#slider [part="output"]')).toHaveText('20');
      expect((await state(page)).entries).toEqual([['opacity', '20']]);
    });
  }

  test('orientation changes preserve native nodes, focused drafts and the default horizontal layout', async ({ page }) => {
    await mount(page);
    const host = page.locator('#slider'), slider = page.getByRole('slider'), editor = page.getByRole('spinbutton');
    await expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    const horizontal = (await slider.boundingBox())!;
    expect(horizontal.width).toBeGreaterThan(horizontal.height);
    await slider.evaluate(node => { (window as unknown as FixtureWindow).rangeNode = node; });
    await editor.evaluate(node => { (window as unknown as FixtureWindow).editorNode = node; });
    await editor.fill('35');
    for (const orientation of ['vertical', 'horizontal', 'vertical'] as const) {
      await host.evaluate(async (element, orientation) => {
        const slider = element as Slider; slider.orientation = orientation; await slider.updateComplete;
      }, orientation);
      await expect(slider).toHaveAttribute('aria-orientation', orientation);
      await expect(editor).toBeFocused(); await expect(editor).toHaveValue('35');
      await expect(slider).toHaveValue('20');
      expect(await slider.evaluate(node => node === (window as unknown as FixtureWindow).rangeNode)).toBe(true);
      expect(await editor.evaluate(node => node === (window as unknown as FixtureWindow).editorNode)).toBe(true);
      expect((await state(page)).changes).toEqual([]);
    }
    await editor.press('Enter'); await expect(slider).toHaveValue('35');
    await slider.focus();
    await host.evaluate(async element => { (element as Slider).orientation = 'horizontal'; await (element as Slider).updateComplete; });
    await expect(slider).toBeFocused();
    await slider.press('ArrowRight'); await expect(slider).toHaveValue('40');
    await host.evaluate(async element => { element.setAttribute('orientation', 'vertical'); await (element as Slider).updateComplete; });
    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    await host.evaluate(async element => { element.removeAttribute('orientation'); await (element as Slider).updateComplete; });
    await expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    const removed = (await slider.boundingBox())!;
    expect(removed.width).toBeGreaterThan(removed.height);
    await host.evaluate(async element => { element.setAttribute('orientation', 'unsupported'); await (element as Slider).updateComplete; });
    await expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    const unsupported = (await slider.boundingBox())!;
    expect(unsupported.width).toBeGreaterThan(unsupported.height);
    await expect(slider).toHaveValue('40');
    expect(await slider.evaluate(node => node === (window as unknown as FixtureWindow).rangeNode)).toBe(true);
  });

  test('vertical length is customizable, medium is implicit, and editor and output fit below the range', async ({ page }) => {
    await mount(page, 'orientation="vertical" editable show-value');
    const host = page.locator('#slider'), slider = page.getByRole('slider'), editor = page.getByRole('spinbutton');
    const implicit = (await slider.boundingBox())!;
    await host.evaluate(element => element.setAttribute('size', 'medium'));
    await expect.poll(async () => {
      const box = (await slider.boundingBox())!;
      return { width: Math.round(box.width), height: Math.round(box.height) };
    }).toEqual({ width: Math.round(implicit.width), height: Math.round(implicit.height) });
    await host.evaluate(element => { element.style.setProperty('--en-slider-length', '18rem'); });
    await expect.poll(async () => (await slider.boundingBox())!.height).toBeGreaterThan(implicit.height + 50);
    for (const size of ['small', 'medium', 'large']) {
      await host.evaluate((element, size) => element.setAttribute('size', size), size);
      const rangeBox = (await slider.boundingBox())!, editorBox = (await editor.boundingBox())!;
      const outputBox = (await page.locator('#slider [part="output"]').boundingBox())!;
      expect(editorBox.y).toBeGreaterThanOrEqual(rangeBox.y + rangeBox.height);
      expect(outputBox.y).toBeGreaterThanOrEqual(editorBox.y + editorBox.height);
      expect(Math.abs(editorBox.x + editorBox.width / 2 - (rangeBox.x + rangeBox.width / 2))).toBeLessThanOrEqual(1);
      expect(editorBox.width).toBeGreaterThan(editorBox.height);
    }
    await slider.focus(); await slider.press('ArrowUp'); await expect(slider).toBeFocused();
    expect(await slider.evaluate(node => node.matches(':focus-visible'))).toBe(true);
    const clipping = await host.evaluate(element => {
      const field = element.shadowRoot!.querySelector('[part="field"]')!;
      const row = element.shadowRoot!.querySelector('[part="row"]')!;
      return [element, field, row].map(node => ({ x: getComputedStyle(node).overflowX, y: getComputedStyle(node).overflowY }));
    });
    expect(clipping.every(style => style.x === 'visible' && style.y === 'visible')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});

test.describe('vertical touch interaction', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 720 } });
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`touch maps top to higher values and exact entry remains usable in ${direction}`, async ({ page }) => {
      await mount(page, 'orientation="vertical" editable');
      await page.locator('#slider').evaluate((element, direction) => { element.dir = direction; }, direction);
      const slider = page.getByRole('slider'), editor = page.getByRole('spinbutton');
      const box = (await slider.boundingBox())!;
      await slider.tap({ position: { x: box.width / 2, y: box.height * 0.15 } });
      const upper = (await state(page)).value;
      expect(upper).toBeGreaterThan(50);
      await slider.tap({ position: { x: box.width / 2, y: box.height * 0.85 } });
      const lower = (await state(page)).value;
      expect(lower).toBeLessThan(50); await expect(editor).toHaveValue(String(lower));
      await editor.tap(); await editor.fill('45'); await editor.press('Enter');
      await expect(slider).toHaveValue('45'); expect((await state(page)).entries).toEqual([['opacity', '45']]);
      const bounds = await page.locator('#slider').evaluate(host => ({ client: host.clientWidth, scroll: host.scrollWidth }));
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.client + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});
