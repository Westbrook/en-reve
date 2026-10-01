import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t } from './internal/values.js';
import { breadcrumbLayoutStyles } from './internal/breadcrumbs.js';

/** Opt-in native HTML recipes. These classes do not turn static HTML into ARIA widgets. */
export const recipeStyles = sizedStyles(css`
  .en-recipe-table { inline-size: 100%; border-collapse: collapse; color: ${t('--en-color-text')}; font-size: ${t('--en-font-data-size')}; line-height: ${t('--en-font-data-line-height')}; }
  .en-recipe-table :where(th, td) { padding-block: ${t('--en-space-2')}; padding-inline: ${t('--en-space-3')}; border-block-end: ${t('--en-border-width')} solid ${t('--en-color-line')}; text-align: start; vertical-align: top; overflow-wrap: break-word; }
  .en-recipe-table th { font-weight: ${t('--en-font-label-strong-weight')}; }
  .en-recipe-table caption { padding-block: ${t('--en-space-3')}; text-align: start; font-weight: ${t('--en-font-label-strong-weight')}; }
  .en-recipe-table [data-numeric] { text-align: end; font-variant-numeric: tabular-nums; }
  ${breadcrumbLayoutStyles}
  .en-recipe-description-list { display: grid; gap: ${t('--en-space-1')} ${t('--en-space-4')}; margin: 0; }
  .en-recipe-description-list dt { font-weight: ${t('--en-font-label-strong-weight')}; }
  .en-recipe-description-list dd { margin: 0; margin-block-end: ${t('--en-space-3')}; overflow-wrap: break-word; }
  .en-recipe-figure { margin: 0; min-inline-size: 0; }
  .en-recipe-figure figcaption { margin-block-start: ${t('--en-space-2')}; color: ${t('--en-color-text-muted')}; font-size: ${t('--en-font-ui-size')}; line-height: ${t('--en-font-body-line-height')}; }
  .en-recipe-quote { margin-block: ${t('--en-space-4')}; margin-inline: 0; padding-inline-start: ${t('--en-space-4')}; border-inline-start: ${t('--en-size-quote-border')} solid ${t('--en-color-boundary')}; }
  .en-recipe-disclosure { border-block-end: ${t('--en-border-width')} solid ${t('--en-color-line')}; padding-block: ${t('--en-space-3')}; }
  .en-recipe-disclosure summary { cursor: pointer; font-weight: ${t('--en-font-label-strong-weight')}; }
  .en-recipe-disclosure[open] summary { margin-block-end: ${t('--en-space-3')}; }
  .en-recipe-disclosure summary:focus-visible { outline: ${t('--en-focus-width')} solid ${t('--en-color-focus')}; outline-offset: ${t('--en-focus-offset')}; }
  @media (forced-colors: active) {
    .en-recipe-table, .en-recipe-figure figcaption { color: CanvasText; }
    .en-recipe-table :where(th, td), .en-recipe-quote, .en-recipe-disclosure { border-color: CanvasText; }
    .en-recipe-disclosure summary:focus-visible { outline-color: Highlight; }
  }
`);
