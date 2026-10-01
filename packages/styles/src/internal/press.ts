import { css, type CSSResult } from 'lit';
import { token as t } from './values.js';

export interface PressMotion {
  readonly scale: CSSResult;
  readonly offset: CSSResult;
  readonly press: CSSResult;
  readonly release: CSSResult;
}
export interface PressRecipe extends PressMotion { readonly paint: CSSResult; readonly shadow: CSSResult; }
export const pressTransitions = css`scale var(--_en-press-duration, 0ms) ${t('--en-ease-standard')}, translate var(--_en-press-duration, 0ms) ${t('--en-ease-standard')}`;
/** Callers pass one complete selector and an enabled-only held selector.
 * Native :active owns the lifetime; no selection or ARIA state is manufactured. */
export function pressMotion(surface: CSSResult, held: CSSResult, recipe: PressMotion): CSSResult {
  return css`
    ${surface} { --_en-press-duration: clamp(0ms, ${recipe.release}, 200ms); }
    ${held} { scale: clamp(.9, ${recipe.scale}, 1); translate: 0 clamp(-2px, ${recipe.offset}, 2px); --_en-press-duration: clamp(0ms, ${recipe.press}, 200ms); }
    :host([data-press='none']) ${surface} { scale: none !important; translate: none !important; }
    @media (prefers-reduced-motion: reduce) { ${surface} { scale: none !important; translate: none !important; transition: none !important; } }
  `;
}
export function pressStyles(surface: CSSResult, held: CSSResult, recipe: PressRecipe): CSSResult {
  return css`
    ${surface} { --_en-press-shadow: 0 0 0 0 transparent; box-shadow: var(--_en-press-shadow); transition: ${pressTransitions}; }
    ${held} { ${recipe.paint} --_en-press-shadow: ${recipe.shadow}; }
    ${pressMotion(surface, held, recipe)}
    @media (forced-colors: active) { ${held} { background-color: Highlight; color: HighlightText; box-shadow: none; } }
  `;
}
