import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, info) => {
  await page.goto('/fixture');
  await page.evaluate(async () => {
    await (window as any).hydrateMotionFixture();
    document.documentElement.style.setProperty('--en-ease-enter', 'linear');
    document.documentElement.style.setProperty('--en-ease-exit', 'linear');
  });
  info.annotations.push({ type: 'browser-version', description: page.context().browser()!.version() });
});

test('popover opacity fades in and out without moving its anchor or delaying focus', async ({ page }, info) => {
  const supported = await page.evaluate(() => CSS.supports('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto'));
  const host = page.locator('#popover');
  const trigger = page.locator('#popover-trigger');
  const surface = host.locator('[part~="surface"]');
  const original = await surface.elementHandle();
  await trigger.click();
  await expect(host).toHaveJSProperty('open', true);
  const measure = () => surface.evaluate(node => {
    const opacity = node.getAnimations().find(animation => (animation as CSSTransition).transitionProperty === 'opacity');
    const samples = [0, .5, 1].map(fraction => {
      if (opacity) { opacity.pause(); opacity.currentTime = Number(opacity.effect!.getTiming().duration) * fraction; }
      const css = getComputedStyle(node), box = node.getBoundingClientRect();
      return { opacity: Number(css.opacity), x: box.x, y: box.y, width: box.width, height: box.height };
    });
    return { hasOpacityTransition: Boolean(opacity), samples, focused: node.matches(':focus-within'), inert: (node as HTMLElement).inert };
  });
  const entry = await measure();
  expect(entry.focused).toBe(true); expect(entry.inert).toBe(false);
  expect(entry.hasOpacityTransition).toBe(supported);
  for (const [index, sample] of entry.samples.entries()) {
    expect(sample.opacity).toBeCloseTo(supported ? index / 2 : 1, 2);
    expect({ ...sample, opacity: 1 }).toEqual({ ...entry.samples[2], opacity: 1 });
  }
  await surface.evaluate(node => node.getAnimations().forEach(animation => animation.finish()));
  await page.keyboard.press('Escape');
  await expect(host).toHaveJSProperty('open', false);
  await expect(trigger).toBeFocused();
  const exit = await measure();
  expect(exit.inert).toBe(true); expect(exit.focused).toBe(false);
  expect(exit.hasOpacityTransition).toBe(supported);
  for (const [index, sample] of exit.samples.entries()) expect(sample.opacity).toBeCloseTo(supported ? 1 - index / 2 : 1, 2);
  await surface.evaluate(node => node.getAnimations().forEach(animation => animation.finish()));
  await expect(surface).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  expect((await measure()).hasOpacityTransition).toBe(false);
  await expect(surface).toHaveCSS('opacity', '1');
  expect(await surface.evaluate((node, original) => node === original, original)).toBe(true);
  await info.attach('popover-opacity.json', { body: JSON.stringify({ supported, entry, exit }), contentType: 'application/json' });
});

test('native select picker fades through actual paint frames and preserves selection and fallback', async ({ page }, info) => {
  const host = page.locator('#select');
  const select = host.getByRole('combobox', { name: 'Export format' });
  const original = await select.elementHandle();
  const capabilities = await page.evaluate(() => ({
    picker: CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'),
    motion: CSS.supports('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto'),
  }));
  const sample = () => select.evaluate(async node => {
    // UA-owned picker pseudo-elements are absent from getAnimations(). Sample
    // their real computed paint across frames instead of fabricating an effect.
    const frames: { opacity: number; display: string }[] = [];
    const start = performance.now();
    do {
      const css = getComputedStyle(node, '::picker(select)');
      frames.push({ opacity: Number(css.opacity), display: css.display });
      await new Promise(requestAnimationFrame);
    } while (performance.now() - start < 500);
    return frames;
  });
  const receipts: unknown[] = [];
  if (capabilities.picker) {
    await select.focus();
    await page.keyboard.press('Space');
    await expect.poll(() => select.evaluate(node => node.matches(':open'))).toBe(true);
    const entry = await sample();
    if (capabilities.motion) {
      expect(entry.some(frame => frame.opacity > 0 && frame.opacity < .9)).toBe(true);
      expect(entry[0]!.opacity).toBeLessThan(entry.at(-1)!.opacity);
    } else expect(entry.every(frame => frame.opacity === 1)).toBe(true);
    expect(entry.at(-1)!.opacity).toBe(1);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(host).toHaveJSProperty('value', 'svg');
    await expect.poll(() => select.evaluate(node => node.matches(':open'))).toBe(false);
    const exit = await sample();
    if (capabilities.motion) expect(exit.some(frame => frame.opacity > 0 && frame.opacity < 1 && frame.display !== 'none')).toBe(true);
    expect(exit.at(-1)!.display).toBe('none');
    await expect(select).toBeFocused();
    receipts.push({ entry, exit });
    // Escape dismisses without changing the accepted selection.
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    await expect(host).toHaveJSProperty('value', 'svg');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('Space');
    await expect.poll(() => select.evaluate(node => node.matches(':open'))).toBe(true);
    expect((await sample()).every(frame => frame.opacity === 1)).toBe(true);
    await page.keyboard.press('Escape');
    expect(await select.evaluate(node => getComputedStyle(node, '::picker(select)').display)).toBe('none');
  }
  await host.evaluate(node => (node as HTMLElement).style.setProperty('--en-select-appearance', 'auto'));
  // The appearance override applies to the customizable picker branch;
  // unsupported engines retain the styled native select fallback.
  await expect(select).toHaveCSS('appearance', capabilities.picker ? 'auto' : 'none');
  await select.selectOption('png');
  await expect(host).toHaveJSProperty('value', 'png');
  expect(await select.evaluate((node, original) => node === original, original)).toBe(true);
  await info.attach('select-opacity.json', { body: JSON.stringify({ capabilities, receipts }), contentType: 'application/json' });
});
