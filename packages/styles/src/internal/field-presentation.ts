import { css, type CSSResult } from 'lit';
import { token as t, override as o } from './values.js';

export const fieldBorderWidth = o('--en-input-border-width', t('--en-border-width'));
export const fieldInvalidWidth = o('--en-input-invalid-border-width', t('--en-border-invalid-width'));
export const fieldRadius = o('--en-input-radius', o('--en-control-radius', t('--en-radius-control')));
// Track each frame's existing paint independently of inherited optional hooks.
// The legacy perimeter-hover gate is retained, including compound descendants.
const restBorder = o('--en-input-border-color', o('--en-control-border-color', t('--en-color-boundary')));
const hoverBorder = o('--en-input-hover-border-color', restBorder);

/** Frame-only refinements. Compound controls pass their outer frame, never steppers. */
export function fieldPresentation(base: CSSResult, invalid: CSSResult): CSSResult {
  return css`
    ${base} { border-radius: ${fieldRadius}; border-width: ${fieldBorderWidth}; border-color: ${restBorder}; --_en-field-bottom-fallback: ${restBorder}; }
    @media (hover: hover) {
      ${base}:hover:where(:not(:disabled):not([aria-disabled='true']):not(:has(:disabled))) { border-color: ${hoverBorder}; --_en-field-bottom-fallback: ${hoverBorder}; }
    }
    ${invalid} { border-color: ${o('--en-input-invalid-border-color', t('--en-color-danger-text'))}; }
  `;
}

/** Call after the frame's border shorthand. The supplied selectors identify an
 * enabled primary editor with no visible error; disabled auxiliary actions do
 * not disable the frame. Initialize the private fallback from the original
 * perimeter rules on this frame, preserving existing unpinned paint. */
export function fieldBottomPaint(enabled: CSSResult): CSSResult {
  return css`
    @media (forced-colors: none) {
      ${enabled} { border-block-end-color: var(--en-input-bottom-border-color, var(--_en-field-bottom-fallback)); }
      @media (hover: hover) {
        :is(${enabled}):hover { border-block-end-color: var(--en-input-hover-bottom-border-color, var(--en-input-bottom-border-color, var(--_en-field-bottom-fallback))); }
      }
    }
  `;
}
