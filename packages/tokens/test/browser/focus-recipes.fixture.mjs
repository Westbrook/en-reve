import { expect } from '@playwright/test';

export const control = (page, id) => page.locator(`#focus-${id} [part~="control"]`);
export const focusFrame = (page, id) => page.locator(`#focus-${id} [part~="focus-frame"]`);
export const tabKey = browserName => browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

/** Public consumer markup; all native controls come from built custom elements. */
export async function installFocusFixture(page) {
  await page.evaluate(async () => {
    const names = ['button', 'text-field', 'textarea', 'select', 'number-field', 'combobox', 'checkbox', 'tabs', 'tab', 'tab-panel', 'dialog', 'color-field', 'slider', 'command-palette'];
    await Promise.all(names.map(name => customElements.whenDefined(`en-${name}`)));
    const section = document.createElement('section');
    section.id = 'focus-recipes';
    section.setAttribute('aria-label', 'Focus recipe review');
    section.innerHTML = `<h2>Focus recipe review</h2>
      <form id="focus-form">
        <button id="focus-before-button" type="button">Before action</button>
        <en-button id="focus-button">Apply changes</en-button>
        <button id="focus-before-text" type="button">Before title</button>
        <en-text-field id="focus-text" name="title" value="Shared canvas" required>
          <span slot="label">Workspace title</span><span slot="description">Keep a recognizable name.</span>
        </en-text-field>
        <button id="focus-before-color" type="button">Before color</button>
        <en-color-field id="focus-color" name="accent" label="Accent color" value="#7352a6"></en-color-field>
        <button id="focus-before-range" type="button">Before opacity</button>
        <en-slider id="focus-range" name="opacity" label="Opacity" value="50" min="0" max="100" step="1"></en-slider>
        <button id="focus-before-textarea" type="button">Before notes</button>
        <en-textarea id="focus-textarea" label="Notes" value="A collaborative draft"></en-textarea>
        <button id="focus-before-select" type="button">Before format</button>
        <en-select id="focus-select" label="Format" value="alpha"></en-select>
        <button id="focus-before-number" type="button">Before copies</button>
        <en-number-field id="focus-number" label="Copies" value="2" min="0" max="9"></en-number-field>
        <button id="focus-before-combo" type="button">Before project</button>
        <en-combobox id="focus-combo" name="project" label="Project" value="alpha"></en-combobox>
        <button id="focus-after-combo" type="button">After project</button>
        <en-checkbox id="focus-checkbox" checked>Share this document</en-checkbox>
        <en-tabs id="focus-tabs" label="Review sections" value="design">
          <en-tab slot="tab" value="design">Design</en-tab><en-tab slot="tab" value="export">Export</en-tab>
          <en-tab-panel slot="panel" value="design">Design settings</en-tab-panel>
          <en-tab-panel slot="panel" value="export">Export settings</en-tab-panel>
        </en-tabs>
        <button id="focus-open-palette" type="button">Open focus commands</button>
        <button id="focus-open-dialog" type="button">Open focus review</button>
      </form>
      <en-dialog id="focus-dialog" label="Focus review"><p>No additional actions.</p></en-dialog>
      <en-command-palette id="focus-palette" for="focus-open-palette" label="Focus commands" search-label="Find a review command"></en-command-palette>`;
    const items = [{ value: 'alpha', label: 'Alpha project' }, { value: 'beta', label: 'Beta project' }, { value: 'gamma', label: 'Gamma project' }];
    section.querySelector('#focus-select').items = items;
    section.querySelector('#focus-combo').items = items;
    section.querySelector('#focus-palette').commands = Array.from({ length: 30 }, (_, index) => ({ action: `review.${index}`, label: `Review command ${index + 1}` }));
    const dialog = section.querySelector('#focus-dialog');
    dialog.dismissible = false;
    section.querySelector('#focus-open-dialog').addEventListener('click', () => { dialog.open = true; });
    section.querySelector('form').addEventListener('submit', event => event.preventDefault());
    document.body.append(section);
    for (let turn = 0; turn < 3; turn++) {
      await Promise.all([...section.querySelectorAll('*')].map(element => element.updateComplete));
    }
  });
  await page.addStyleTag({ content: `
    #focus-recipes { box-sizing:border-box; inline-size:min(100%,34rem); margin:2rem auto; padding:2rem; }
    #focus-form { display:grid; gap:1rem; min-inline-size:0; }
    #focus-form > button { justify-self:start; }
    #focus-form > en-button { justify-self:start; }
  ` });
  await page.locator('#focus-recipes').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
}

export async function keyboardFocus(page, id, browserName) {
  await page.locator(`#focus-before-${id}`).focus();
  await page.keyboard.press(tabKey(browserName));
  const target = id === 'number' ? page.locator('#focus-number [part~="decrement"]') : control(page, id);
  if (id === 'color' && browserName === 'webkit') {
    // This WebKit build skips native color inputs in sequential keyboard focus.
    // Verify native parity before using explicit focus to inspect field paint.
    const fieldFocused = await target.evaluate(node => node.matches(':focus'));
    await page.evaluate(() => {
      const probe = document.createElement('div'); probe.id = 'color-tab-baseline';
      probe.innerHTML = '<button type="button">Before native color</button><input type="color" aria-label="Native color baseline"><button type="button">After native color</button>';
      document.body.append(probe);
    });
    await page.locator('#color-tab-baseline button').first().focus();
    await page.keyboard.press(tabKey(browserName));
    expect(await page.locator('#color-tab-baseline input').evaluate(node => node.matches(':focus'))).toBe(fieldFocused);
    await page.locator('#color-tab-baseline').evaluate(node => node.remove());
    await target.focus();
  }
  await expect(target).toBeFocused();
  expect(await target.evaluate(node => node.matches(':focus-visible'))).toBe(true);
  return target;
}

export async function focusPaint(locator) {
  return locator.evaluate(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return {
      x: rect.x, y: rect.y, scrollX: window.scrollX, scrollY: window.scrollY, width: rect.width, height: rect.height,
      outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth),
      outlineOffset: parseFloat(style.outlineOffset), outlineColor: style.outlineColor,
      borderRadius: style.borderRadius, borderWidth: style.borderWidth, padding: style.padding,
      shadow: style.boxShadow, focusVisible: node.matches(':focus-visible'),
      transform: style.transform, opacity: style.opacity,
    };
  });
}

export function sameBox(before, after) {
  // Keyboard navigation may scroll the document; compare actual layout positions.
  expect(after.x + after.scrollX, 'document x remains stable').toBeCloseTo(before.x + before.scrollX, 1);
  expect(after.y + after.scrollY, 'document y remains stable').toBeCloseTo(before.y + before.scrollY, 1);
  for (const key of ['width', 'height']) expect(after[key], `${key} remains stable`).toBeCloseTo(before[key], 1);
  for (const key of ['borderRadius', 'borderWidth', 'padding']) expect(after[key], `${key} remains stable`).toBe(before[key]);
}

export function completeOutline(paint, width = 2) {
  expect(paint.outlineStyle).toBe('solid');
  expect(paint.outlineWidth).toBeGreaterThanOrEqual(width);
  expect(paint.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(paint.opacity).toBe('1');
  expect(paint.transform).toBe('none');
}

/** Measure actual clipping boundaries along the flattened ancestor chain. */
export async function expectUnclippedOutline(locator) {
  const clipped = await locator.evaluate(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    const expansion = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const bounds = { left: rect.left - expansion, right: rect.right + expansion, top: rect.top - expansion, bottom: rect.bottom + expansion };
    const parent = element => element.assignedSlot ?? element.parentElement ?? (element.getRootNode() instanceof ShadowRoot ? element.getRootNode().host : null);
    const failures = [];
    for (let ancestor = parent(node); ancestor && ancestor !== document.documentElement; ancestor = parent(ancestor)) {
      const css = getComputedStyle(ancestor), box = ancestor.getBoundingClientRect();
      if (css.display === 'contents' || !box.width || !box.height) continue;
      const clips = value => ['hidden', 'clip', 'auto', 'scroll'].includes(value);
      if (clips(css.overflowX) && (bounds.left < box.left - .5 || bounds.right > box.right + .5)) failures.push(`${ancestor.localName}:inline`);
      if (clips(css.overflowY) && (bounds.top < box.top - .5 || bounds.bottom > box.bottom + .5)) failures.push(`${ancestor.localName}:block`);
    }
    return failures;
  });
  expect(clipped, 'Full solid contour fits ancestor clipping boundaries').toEqual([]);
}

export async function accentPaint(locator) {
  return locator.evaluate(node => {
    const css = getComputedStyle(node, '::after');
    return { scale: css.transform === 'none' ? 1 : new DOMMatrixReadOnly(css.transform).a,
      width: parseFloat(css.width), height: parseFloat(css.height), accentWidth: parseFloat(css.borderBottomWidth), color: css.borderBottomColor,
      duration: css.transitionDuration, property: css.transitionProperty,
      pointerEvents: css.pointerEvents, opacity: css.opacity };
  });
}

/** Samples a real CSS transition; no fabricated keyframes or wall-clock sleeps. */
export async function sampleAccentTransition(frame) {
  return frame.evaluate(node => {
    // Force the native transition to exist before seeking its documented timeline.
    getComputedStyle(node, '::after').transform;
    const animations = node.getAnimations({ subtree: true }).filter(animation =>
      animation instanceof CSSTransition && animation.transitionProperty === 'transform');
    if (animations.length !== 1) throw new Error(`Expected one supplemental transform transition, found ${animations.length}.`);
    const animation = animations[0];
    animation.pause();
    const duration = Number(animation.effect.getComputedTiming().duration);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('The focus transition has no positive duration.');
    const at = time => {
      animation.currentTime = time;
      const css = getComputedStyle(node, '::after');
      return { time, scale: css.transform === 'none' ? 1 : new DOMMatrixReadOnly(css.transform).a,
        height: parseFloat(css.height), accentWidth: parseFloat(css.borderBottomWidth), color: css.borderBottomColor };
    };
    const zero = at(0), middle = at(duration / 2), end = at(duration);
    animation.finish();
    return { duration, zero, middle, end };
  });
}

export async function armImmediateFocusCapture(locator) {
  await locator.evaluate(node => {
    node.__focusRecipeImmediate = undefined;
    node.addEventListener('focus', () => {
      const css = getComputedStyle(node);
      node.__focusRecipeImmediate = { outlineStyle: css.outlineStyle, outlineWidth: parseFloat(css.outlineWidth),
        outlineColor: css.outlineColor, focusVisible: node.matches(':focus-visible'),
        properties: node.getAnimations().filter(animation => animation instanceof CSSTransition).map(animation => animation.transitionProperty) };
    }, { once: true });
  });
}

export async function freezeNextTransition(locator, property, pseudoElement = '') {
  await locator.evaluate((node, expected) => {
    getComputedStyle(node, expected.pseudoElement || null).getPropertyValue(expected.property);
    node.__focusRecipeFrozen = false;
    const pause = event => {
      if (event.target !== node || event.propertyName !== expected.property || event.pseudoElement !== expected.pseudoElement) return;
      const animation = node.getAnimations({ subtree: true }).find(value => value instanceof CSSTransition && value.transitionProperty === expected.property);
      if (!animation) throw new Error('Native transitionrun had no corresponding animation.');
      animation.pause(); animation.currentTime = 0;
      node.__focusRecipeFrozen = true;
      node.removeEventListener('transitionrun', pause);
    };
    node.addEventListener('transitionrun', pause);
  }, { property, pseudoElement });
}
export const freezeNextAccentTransition = frame => freezeNextTransition(frame, 'transform', '::after');

export async function waitForFrozenAccent(frame) {
  await expect.poll(() => frame.evaluate(node => node.__focusRecipeFrozen)).toBe(true);
}

/** Parse the rendered first shadow layer, independently of CSS source syntax. */
export async function sampleHaloTransition(locator) {
  return locator.evaluate(node => {
    getComputedStyle(node).boxShadow;
    const animations = node.getAnimations().filter(animation => animation instanceof CSSTransition && animation.transitionProperty === 'box-shadow');
    if (animations.length !== 1) throw new Error(`Expected one supplemental halo transition, found ${animations.length}.`);
    const animation = animations[0]; animation.pause();
    const duration = Number(animation.effect.getComputedTiming().duration);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('The halo transition has no positive duration.');
    const at = time => {
      animation.currentTime = time;
      const css = getComputedStyle(node), shadow = css.boxShadow;
      let depth = 0, end = shadow.length;
      for (let i = 0; i < shadow.length; i++) {
        if (shadow[i] === '(') depth++;
        if (shadow[i] === ')') depth--;
        if (shadow[i] === ',' && depth === 0) { end = i; break; }
      }
      const lengths = shadow.slice(0, end).split(' ').filter(value => value.endsWith('px')).map(parseFloat);
      if (lengths.length !== 4) throw new Error(`Expected four computed shadow lengths, got ${shadow}.`);
      return { time, shadow, spread: lengths[3], outlineStyle: css.outlineStyle, outlineWidth: parseFloat(css.outlineWidth), outlineColor: css.outlineColor };
    };
    const zero = at(0), middle = at(duration / 2), end = at(duration);
    animation.finish();
    return { duration, zero, middle, end };
  });
}
