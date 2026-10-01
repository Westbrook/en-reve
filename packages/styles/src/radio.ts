import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { radioRules } from './internal/radio-rules.js';
import { focusStylesFor } from './internal/focus-core.js';

/** Native radio styling without unrelated field, button or picker rules. */
export const radioStyles = sizedStyles(css`
  ${focusStylesFor(css`:where(.en-radio)`)}
  ${radioRules}
`);
