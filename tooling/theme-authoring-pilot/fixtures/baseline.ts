import { css, type CSSResult } from 'lit';
import { token } from '../../../packages/styles/dist/internal/values.js';
import { sizedStyles } from '../../../packages/styles/dist/internal/sizing.js';

// Same roles and shorthand as packages/styles/src/typography.ts. This extracted
// helper is also the fair, deduplicated TS comparator; it is not a library change.
export const roles = ['body', 'metadata', 'heading-small', 'heading-medium', 'heading-large'] as const;
export function typography(weight: CSSResult, size: CSSResult, leading: CSSResult, family: CSSResult) {
  return css`font: ${weight} ${size} / ${leading} ${family};`;
}
export function insetRadius(outer: CSSResult, inset: CSSResult) {
  return css`max(0px, calc(${outer} - ${inset}))`;
}
export function roleArguments(role: string) {
  return ['weight', 'size', 'line-height', 'family'].map(part => token(`--en-font-${role}-${part}`));
}
export function baselineStyles() {
  const type = roles.map(role => {
    const [weight, size, leading, family] = roleArguments(role);
    return css`.en-${cssRole(role)} { ${typography(weight, size, leading, family)} }`;
  });
  return sizedStyles(css`
    ${type.reduce((all, part) => css`${all}${part}`, css``)}
    .pilot-inner, .pilot-badge {
      border-radius: ${insetRadius(token('--en-radius-container'), token('--en-space-2'))};
    }
  `);
}
// Literal role data is controlled by this fixture, never external input.
import { unsafeCSS } from 'lit';
function cssRole(role: string) { return unsafeCSS(role); }
