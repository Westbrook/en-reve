import { expect, test, type Locator, type Page } from '@playwright/test';
import type {} from './presentation-fixture.js';

const path = '/packages/elements/src/slider/tests/fixture.html';
type Kind = 'custom' | 'native';
type Slider = HTMLElement & {
  updateComplete: Promise<unknown>; value: number; min: number; max: number;
};
type IntervalSlider = HTMLElement & {
  updateComplete: Promise<unknown>; value: readonly [number, number]; description: string;
};
type Paint = {
  width: number; height: number; first: number[]; last: number[];
  whiteWidth: number; whiteHeight: number; trackHeight: number;
};
const paintHooks = `
  --en-size-range-track: 8px;
  --en-size-range-track-small: 8px;
  --en-size-range-track-medium: 8px;
  --en-size-range-track-large: 8px;
  --en-slider-track-background: rgb(36 80 208);
  --en-slider-fill-background: rgb(208 48 48);
  --en-slider-thumb-size: 16px;
  --en-slider-thumb-background: white;
  --en-slider-thumb-border-width: 0px;
  --en-slider-thumb-shadow: none;
  --en-slider-disabled-track-background: rgb(80 80 80);
  --en-slider-disabled-fill-background: rgb(32 80 32);
  --en-slider-disabled-thumb-background: rgb(187 187 187);
`;

async function mount(page: Page, kind: Kind): Promise<Locator> {
  await page.goto(path);
  await page.evaluate(async ({ kind, paintHooks }) => {
    await customElements.whenDefined('en-slider');
    document.body.style.background = 'rgb(240 230 210)';
    document.querySelector('#fixture')!.innerHTML = `<form id="form" class="en-foundation" style="${paintHooks}">`
      + (kind === 'custom'
        ? '<en-slider id="slider" name="amount" label="Amount" min="0" max="100" step="10" value="50" editable></en-slider>'
        : '<label for="native" class="en-label">Amount</label><div class="en-range-row" id="native-row">'
          + '<input id="native" class="en-range" type="range" name="amount" min="0" max="100" step="10" value="50"></div>')
      + '<button id="reset" type="reset">Reset</button></form>';
    if (kind === 'custom') await (document.querySelector('#slider') as Slider).updateComplete;
    else window.sliderPresentationFixture.connect(document.querySelector('#native') as HTMLInputElement);
  }, { kind, paintHooks });
  const input = page.getByRole('slider', { name: 'Amount', exact: true });
  await expect(input).toHaveValue('50');
  return input;
}

async function percent(input: Locator): Promise<number> {
  return input.evaluate(element => parseFloat(getComputedStyle(element).getPropertyValue('--en-slider-value-percent')));
}

async function writeCustom(page: Page, value: number): Promise<void> {
  await page.locator('#slider').evaluate(async (element, value) => {
    const slider = element as Slider;
    slider.value = value;
    await slider.updateComplete;
  }, value);
}

function expectColor(actual: number[], expected: number[]): void {
  expect(actual).toHaveLength(3);
  for (let channel = 0; channel < 3; channel++) {
    expect(Math.abs(actual[channel]! - expected[channel]!)).toBeLessThanOrEqual(2);
  }
}

// Native range pseudo-elements do not expose comparable computed styles across
// engines. Sample the actual raster with generous edge tolerances instead.
async function paint(input: Locator, vertical = false): Promise<Paint> {
  const png = (await input.screenshot({ scale: 'css' })).toString('base64');
  return input.page().evaluate(async ({ png, vertical }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixel = (x: number, y: number) => Array.from(data.slice((Math.floor(y) * width + Math.floor(x)) * 4, (Math.floor(y) * width + Math.floor(x)) * 4 + 3));
    const first = vertical ? pixel(width / 2, height / 4) : pixel(width / 4, height / 2);
    const last = vertical ? pixel(width / 2, height * .75) : pixel(width * .75, height / 2);
    const white: { x: number; y: number }[] = [];
    let trackHeight = 0;
    for (let y = 0; y < height; y++) {
      if (pixel(width / 4, y).every((v, i) => Math.abs(v - [208, 48, 48][i]!) <= 2)) trackHeight++;
      for (let x = Math.floor(width * .4); x < width * .6; x++) {
        if (pixel(x, y).every(v => v >= 253)) white.push({ x, y });
      }
    }
    return { width, height, first, last, trackHeight,
      whiteWidth: white.length ? Math.max(...white.map(p => p.x)) - Math.min(...white.map(p => p.x)) + 1 : 0,
      whiteHeight: white.length ? Math.max(...white.map(p => p.y)) - Math.min(...white.map(p => p.y)) + 1 : 0 };
  }, { png, vertical });
}

test('custom fill follows accepted, tentative, canceled, authoritative and reset values', async ({ page }) => {
  const input = await mount(page, 'custom');
  await expect.poll(() => percent(input)).toBe(50);
  await writeCustom(page, 30);
  await expect.poll(() => percent(input)).toBe(30);
  await writeCustom(page, 50);
  const editor = page.getByRole('spinbutton');
  await editor.fill('70');
  expect(await percent(input)).toBe(50);
  await editor.press('Enter');
  await expect.poll(() => percent(input)).toBe(70);
  await writeCustom(page, 50);

  await page.locator('#slider').evaluate(element => {
    element.addEventListener('en-change', event => {
      const input = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="range"]')!;
      element.setAttribute('data-tentative', JSON.stringify({
        value: (element as Slider).value, native: input.valueAsNumber,
        percent: parseFloat(getComputedStyle(input).getPropertyValue('--en-slider-value-percent')),
      }));
      event.preventDefault();
    }, { once: true });
  });
  await input.focus(); await input.press('ArrowRight');
  await expect(page.locator('#slider')).toHaveAttribute('data-tentative', JSON.stringify({ value: 60, native: 60, percent: 60 }));
  await expect(input).toHaveValue('50');
  await expect.poll(() => percent(input)).toBe(50);

  await page.locator('#slider').evaluate(element => {
    element.addEventListener('en-change', event => {
      event.preventDefault();
      (element as Slider).value = (element as Slider).value;
    }, { once: true });
  });
  await input.press('ArrowRight');
  await expect(input).toHaveValue('60');
  await expect.poll(() => percent(input)).toBe(60);
  await page.locator('#reset').click();
  await expect(input).toHaveValue('50');
  await expect.poll(() => percent(input)).toBe(50);

  await page.locator('#slider').evaluate(async element => {
    const slider = element as Slider;
    slider.min = slider.max = 40;
    await slider.updateComplete;
  });
  await expect(input).toHaveValue('40');
  await expect.poll(() => percent(input)).toBe(0);
});

test('native fill synchronizes only through explicit initialization, input, reset and author calls', async ({ page }) => {
  const input = await mount(page, 'native');
  expect(await percent(input)).toBe(50);
  await input.focus(); await input.press('ArrowRight');
  await expect(input).toHaveValue('60');
  expect(await percent(input)).toBe(60);
  await input.evaluate((element: HTMLInputElement) => { element.value = '30'; });
  expect(await percent(input)).toBe(60);
  await input.evaluate((element: HTMLInputElement) => window.sliderPresentationFixture.sync(element));
  expect(await percent(input)).toBe(30);
  await page.locator('#form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
  await page.locator('#reset').click();
  await expect(input).toHaveValue('30');
  expect(await percent(input)).toBe(30);
  await page.locator('#reset').click();
  await expect(input).toHaveValue('50');
  await expect.poll(() => percent(input)).toBe(50);
  await input.evaluate((element: HTMLInputElement) => {
    element.min = element.max = '20';
    window.sliderPresentationFixture.sync(element);
  });
  await expect(input).toHaveValue('20');
  expect(await percent(input)).toBe(0);
  await input.evaluate((element: HTMLInputElement) => {
    element.removeAttribute('min'); element.removeAttribute('max');
    element.value = '30';
    window.sliderPresentationFixture.sync(element);
  });
  expect(await percent(input)).toBe(30);
});

for (const kind of ['custom', 'native'] as const) {
  test(`${kind} range paints a 16px white thumb over an 8px track without shrinking its target`, async ({ page }) => {
    const input = await mount(page, kind);
    const pixels = await paint(input);
    expect(pixels.height).toBeGreaterThanOrEqual(24);
    expect(pixels.whiteWidth).toBeGreaterThanOrEqual(14);
    expect(pixels.whiteWidth).toBeLessThanOrEqual(17);
    expect(pixels.whiteHeight).toBeGreaterThanOrEqual(14);
    expect(pixels.whiteHeight).toBeLessThanOrEqual(17);
    expect(pixels.trackHeight).toBeGreaterThanOrEqual(7);
    expect(pixels.trackHeight).toBeLessThanOrEqual(9);
    expectColor(pixels.first, [208, 48, 48]);
    expectColor(pixels.last, [36, 80, 208]);
    if (kind === 'custom') {
      await page.locator('#slider').evaluate(async element => {
        element.setAttribute('disabled', ''); await (element as Slider).updateComplete;
      });
    } else await input.evaluate((element: HTMLInputElement) => { element.disabled = true; });
    await expect(input).toBeDisabled();
    const disabled = await paint(input);
    expectColor(disabled.first, [32, 80, 32]);
    expectColor(disabled.last, [80, 80, 80]);
  });

  test(`${kind} painted fill follows horizontal RTL and keeps vertical minimum at the bottom`, async ({ page }) => {
    const input = await mount(page, kind);
    for (const vertical of [false, true]) for (const direction of ['ltr', 'rtl']) {
      await page.evaluate(async ({ kind, vertical, direction }) => {
        document.querySelector('#form')!.setAttribute('dir', direction);
        if (kind === 'custom') {
          const slider = document.querySelector('#slider') as Slider;
          slider.setAttribute('orientation', vertical ? 'vertical' : 'horizontal');
          await slider.updateComplete;
        } else {
          document.querySelector('#native-row')!.setAttribute('data-orientation', vertical ? 'vertical' : 'horizontal');
          document.querySelector('#native')!.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
        }
      }, { kind, vertical, direction });
      const pixels = await paint(input, vertical);
      const lowAtEnd = vertical || direction === 'rtl';
      expectColor(pixels.first, lowAtEnd ? [36, 80, 208] : [208, 48, 48]);
      expectColor(pixels.last, lowAtEnd ? [208, 48, 48] : [36, 80, 208]);
      if (vertical) {
        expect(pixels.width).toBeGreaterThanOrEqual(24);
        await input.focus(); await input.press('Home');
        await expect(input).toHaveValue('0');
        await expect.poll(() => percent(input)).toBe(0);
        await input.press('End');
        await expect(input).toHaveValue('100');
        await expect.poll(() => percent(input)).toBe(100);
        if (kind === 'custom') await writeCustom(page, 50);
        else await input.evaluate((element: HTMLInputElement) => {
          element.value = '50'; window.sliderPresentationFixture.sync(element);
        });
      }
    }
  });
}

test('interval range exposes selected paint while preserving targets, drafts, cancellation and RTL endpoints', async ({ page }) => {
  await page.goto(path);
  await page.evaluate(async paintHooks => {
    await customElements.whenDefined('en-range-slider');
    document.querySelector('#fixture')!.innerHTML = `<form id="form" class="en-foundation" style="${paintHooks}">`
      + '<en-range-slider id="interval" name="budget" label="Budget" min="0" max="100" step="10" value="[20,80]"></en-range-slider></form>';
    await (document.querySelector('#interval') as IntervalSlider).updateComplete;
  }, paintHooks);
  const host = page.locator('#interval');
  const track = host.locator('[part="track"]');
  const range = host.locator('[part="range"]');
  const lower = host.getByRole('slider', { name: 'Minimum', exact: true });
  const upper = host.getByRole('slider', { name: 'Maximum', exact: true });
  const editor = host.getByRole('spinbutton', { name: 'Minimum', exact: true });
  await expect(range).toHaveAttribute('aria-hidden', 'true');
  const geometry = await host.evaluate(element => {
    const track = element.shadowRoot!.querySelector('[part="track"]')!;
    const range = element.shadowRoot!.querySelector('[part="range"]')!;
    const thumb = element.shadowRoot!.querySelector('[part="lower-thumb"]')!;
    const frame = track.getBoundingClientRect(), fill = range.getBoundingClientRect();
    const target = thumb.getBoundingClientRect(), paint = getComputedStyle(thumb, '::before');
    return { frame: frame.height, fill: fill.width / frame.width, fillStart: (fill.left - frame.left) / frame.width,
      targetWidth: target.width, targetHeight: target.height,
      thumbWidth: parseFloat(paint.width), thumbHeight: parseFloat(paint.height),
      thumbBackground: paint.backgroundColor, fillHeight: fill.height };
  });
  expect(geometry.frame).toBeCloseTo(44, 1);
  expect(geometry.fill).toBeCloseTo(.6, 3);
  expect(geometry.fillStart).toBeCloseTo(.2, 3);
  expect(geometry.targetWidth).toBeGreaterThanOrEqual(44);
  expect(geometry.targetHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.thumbWidth).toBeCloseTo(16, 1);
  expect(geometry.thumbHeight).toBeCloseTo(16, 1);
  expect(geometry.thumbBackground).toBe('rgb(255, 255, 255)');
  expect(geometry.fillHeight).toBeCloseTo(8, 1);

  await editor.fill('35');
  await host.evaluate(async element => {
    element.style.setProperty('--en-slider-thumb-size', '20px');
    (element as IntervalSlider).description = 'Styling preserves an unfinished exact-value draft.';
    await (element as IntervalSlider).updateComplete;
  });
  await expect(editor).toHaveValue('35');
  await expect(editor).toBeFocused();
  await expect(lower).toHaveAttribute('aria-valuenow', '20');
  expect(await lower.evaluate(element => parseFloat(getComputedStyle(element, '::before').width))).toBe(20);
  await host.evaluate(element => element.style.setProperty('--en-slider-thumb-size', '16px'));
  // Reconcile the unfinished draft before transferring focus for keyboard work.
  await editor.fill('20');
  await host.evaluate(element => element.addEventListener('en-change', event => {
    element.setAttribute('data-tentative', JSON.stringify({
      value: (element as IntervalSlider).value,
      entries: Array.from(new FormData(document.querySelector('#form') as HTMLFormElement)),
    }));
    event.preventDefault();
  }, { once: true }));
  await lower.focus(); await lower.press('ArrowRight');
  await expect(host).toHaveAttribute('data-tentative', JSON.stringify({ value: [30, 80], entries: [['budget', '30'], ['budget', '80']] }));
  await expect(lower).toHaveAttribute('aria-valuenow', '20');
  await expect(upper).toHaveAttribute('aria-valuenow', '80');
  await expect.poll(async () => (await range.boundingBox())!.width / (await track.boundingBox())!.width).toBeCloseTo(.6, 3);
  await host.evaluate(element => { element.setAttribute('dir', 'rtl'); });
  await lower.press('ArrowLeft');
  await expect(lower).toHaveAttribute('aria-valuenow', '30');
  await lower.press('Home');
  await expect(lower).toHaveAttribute('aria-valuenow', '0');
  await upper.focus(); await upper.press('End');
  await expect(upper).toHaveAttribute('aria-valuenow', '100');
  const bounds = (await track.boundingBox())!;
  const lowerBounds = (await lower.boundingBox())!, upperBounds = (await upper.boundingBox())!;
  expect(lowerBounds.x + lowerBounds.width / 2).toBeCloseTo(bounds.x + bounds.width, 0);
  expect(upperBounds.x + upperBounds.width / 2).toBeCloseTo(bounds.x, 0);
  expect((await range.boundingBox())!.width).toBeCloseTo(bounds.width, 0);
  expect(await page.locator('#form').evaluate((form: HTMLFormElement) => Array.from(new FormData(form)))).toEqual([['budget', '0'], ['budget', '100']]);
});
