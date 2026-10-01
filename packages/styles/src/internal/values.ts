import { css, unsafeCSS, type CSSResult } from 'lit';
import { rawTokenCSS, tokenCSS } from './token-values.js';
import type { StyleOverrideName } from '../metadata.js';

/** Static, trusted token data only. Never pass user-authored strings to unsafeCSS. */
export function rawToken(name: string): CSSResult {
  return unsafeCSS(rawTokenCSS(name));
}

/** Select a finite role, never multiply an inherited font or dimension recursively. */
export function token(name: string): CSSResult {
  return unsafeCSS(tokenCSS(name));
}

/** Leave optional properties unset so inherited consumer overrides remain effective. */
export function override(name: StyleOverrideName, fallback: CSSResult): CSSResult {
  return css`var(${unsafeCSS(name)}, ${fallback})`;
}
