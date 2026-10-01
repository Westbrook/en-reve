import { css } from 'lit';
import { token as t } from './internal/values.js';
import { focusVisibleStylesFor } from './internal/focus.js';

export const formNavigationStyles = css`
  .en-progress-steps { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: var(--en-progress-steps-gap, ${t('--en-space-actions')}); }
  .en-progress-steps > li { flex: 1 1 10rem; min-inline-size: 0; }
  .en-progress-disclosure { display: none; }
  .en-progress-summary { display: flex; inline-size: 100%; justify-content: space-between; text-align: start; white-space: normal; }
  .en-progress-summary::-webkit-details-marker { display: none; }
  .en-progress-summary::marker { content: ''; }
  .en-progress-summary svg { flex: none; }
  .en-progress-disclosure[open] .en-progress-summary svg { rotate: 180deg; }
  /* A sibling list keeps wide content outside native closed-details accessibility suppression. */
  @container en-steps (max-width: 30rem) {
    .en-progress-disclosure:not([open]) + .en-progress-steps { display: none; }
    .en-progress-disclosure { display: block; }
    .en-progress-steps { flex-direction: column; margin-block-start: var(--en-progress-steps-gap, ${t('--en-space-actions')}); }
    .en-progress-steps > li { flex-basis: auto; }
  }
  .en-progress-step { inline-size: 100%; justify-content: flex-start; text-align: start; white-space: normal; gap: ${t('--en-space-2')}; }
  .en-progress-step__number { font-variant-numeric: tabular-nums; flex: none; }
  .en-progress-step__text { display: grid; gap: ${t('--en-space-1')}; }
  .en-progress-step__status { font-size: ${t('--en-font-ui-size')}; font-weight: ${t('--en-font-ui-weight')}; }
  .en-progress-step[aria-current='step'] { border-color: ${t('--en-color-action')}; }
  .en-progress-step--static { display: flex; align-items: center; padding: ${t('--en-space-2')}; border: ${t('--en-border-width')} solid ${t('--en-color-line')}; border-radius: ${t('--en-radius-control')}; }
  .en-progress-step[data-status='error'] { border-color: ${t('--en-color-danger-text')}; }
  .en-validation-summary { padding: var(--en-validation-summary-padding, ${t('--en-space-panel')}); border: ${t('--en-border-invalid-width')} solid ${t('--en-color-danger-text')}; border-radius: var(--en-validation-summary-radius, ${t('--en-radius-container')}); background: ${t('--en-color-surface')}; color: ${t('--en-color-text')}; }
  .en-validation-summary__title { margin: 0; font: inherit; font-weight: ${t('--en-font-label-strong-weight')}; }
  .en-validation-summary__list { margin-block: ${t('--en-space-2')} 0; padding-inline-start: ${t('--en-space-5')}; }
  .en-validation-summary__list li + li { margin-block-start: ${t('--en-space-2')}; }
  .en-validation-summary ::slotted(a), .en-validation-summary a { color: inherit; text-underline-offset: .15em; }
  @media (hover: hover) { .en-validation-summary ::slotted(a:hover), .en-validation-summary a:hover { text-decoration-thickness: 2px; } }
  ${focusVisibleStylesFor(css`.en-validation-summary:focus, .en-validation-summary a:focus-visible, .en-validation-summary ::slotted(a:focus-visible)`)}
  @media (forced-colors: active) {
    .en-validation-summary, .en-progress-step[data-status='error'] { border-color: CanvasText; }
    .en-progress-step[aria-current='step'] { border-color: Highlight; }
  }
`;
