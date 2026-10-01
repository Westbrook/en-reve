import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { focusStylesFor } from './internal/focus-core.js';
import { linkAppearanceStyles, linkDisabledStyles, linkForcedColorStyles } from './internal/link-rules.js';
import { controlForcedDisabledStyles } from './internal/control-shared.js';

/** Native navigation leaf, retaining the aggregate's zero-specificity focus scope. */
export const linkStyles = sizedStyles(css`
  ${linkAppearanceStyles}
  ${linkDisabledStyles}
  ${focusStylesFor(css`:where(.en-link)`)}
  @media (forced-colors: active) {
    ${linkForcedColorStyles}
    ${controlForcedDisabledStyles(css`.en-link[aria-disabled='true']`)}
  }
`);
