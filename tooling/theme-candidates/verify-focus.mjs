import assert from 'node:assert/strict';
import { positionFramedTarget } from './capture.mjs';

/** Runs within the existing real-file-import loop; emits no substitute theme CSS.
 * Detailed normal-motion timing belongs to focus-recipes.spec.mjs. This verifier
 * already runs reduced motion, so imported candidates must settle immediately.
 */
export async function verifyCandidateFocus({ page, iframe, frame, item, expect, resolvedTokens }) {
  const specimen = frame.locator('[data-specimen="text-fields"]');
  const input = specimen.locator('en-text-field[label="Contact email"] [part~="control"]');
  const focusFrame = specimen.locator('en-text-field[label="Contact email"] [part~="focus-frame"]');
  const precedingLink = specimen.getByRole('link', { name: 'Review this field', exact: true });
  await positionFramedTarget(page, iframe, input);
  await expect(focusFrame).toHaveCount(1);
  const original = await input.elementHandle();
  const read = () => input.evaluate(node => {
    const css = getComputedStyle(node), box = node.getBoundingClientRect();
    return { width: box.width, height: box.height, value: node.value, radius: css.borderRadius,
      outlineStyle: css.outlineStyle, outlineWidth: parseFloat(css.outlineWidth), outlineColor: css.outlineColor,
      shadow: css.boxShadow, focusVisible: node.matches(':focus-visible') };
  });
  const before = await read();
  await precedingLink.focus();
  await page.keyboard.press(item.engine === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(input).toBeFocused();
  const focused = await read();
  assert.equal(focused.focusVisible, true);
  assert.equal(focused.outlineStyle, 'solid');
  assert.ok(focused.outlineWidth >= 2, 'The actual imported candidate keeps the complete primary contour.');
  assert.notEqual(focused.outlineColor, 'rgba(0, 0, 0, 0)');
  assert.equal(focused.value, before.value);
  assert.equal(focused.width, before.width); assert.equal(focused.height, before.height); assert.equal(focused.radius, before.radius);
  assert.equal(await input.evaluate((node, initial) => node === initial, original), true);
  const accent = await focusFrame.evaluate(node => {
    const css = getComputedStyle(node, '::after');
    return { width: parseFloat(css.borderBottomWidth), color: css.borderBottomColor,
      scale: css.transform === 'none' ? 1 : new DOMMatrixReadOnly(css.transform).a,
      duration: css.transitionDuration,
      runningTransitions: node.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSTransition && animation.transitionProperty === 'transform').length };
  });
  const expectedAccent = resolvedTokens['component.input.focus-accent-width'];
  assert.equal(expectedAccent.type, 'dimension');
  assert.equal(expectedAccent.value.unit, 'px', 'The maintained candidate accent widths use CSS pixels.');
  assert.equal(accent.width, expectedAccent.value.value, 'The imported branch must paint its exported accent width.');
  assert.equal(accent.scale, 1); assert.equal(accent.runningTransitions, 0);
  if (item.candidate === 'shadcn-inspired') {
    const expectedShadow = await input.evaluate(node => {
      const color = getComputedStyle(node).getPropertyValue('--en-input-focus-halo-color');
      const probe = document.createElement('span'); probe.style.boxShadow = `0 0 0 3px ${color}, 0 0 0 0 transparent`;
      document.body.append(probe); const shadow = getComputedStyle(probe).boxShadow; probe.remove(); return shadow;
    });
    assert.equal(focused.shadow, expectedShadow, 'The imported Shadcn pair supplies its real 3px supplemental halo.');
  }
  item.focusRecipe = { before, focused, accent, expectedAccent, nativeIdentityPreserved: true,
    scope: 'Actual imported candidate, current branch, keyboard focus, full immediate contour and reduced-motion settled accent. Physical AT and pixel contrast are separate checks.' };
  await precedingLink.focus();
  assert.equal(await focusFrame.evaluate(node => {
    const value = getComputedStyle(node, '::after').transform;
    return value === 'none' ? 1 : new DOMMatrixReadOnly(value).a;
  }), 0);
  await original.dispose();
}
