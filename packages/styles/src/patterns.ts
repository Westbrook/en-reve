import { joinedButtonStyles } from './internal/joined-buttons.js';
import { insetActionContext } from './internal/inset-action.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t } from './internal/values.js';
/** Shared compositions built from existing semantic controls and theme families. */
export const patternStyles = sizedStyles(css`
  [hidden] { display: none !important; }
  .en-choice-group { display:flex; flex-wrap:wrap; gap:${t('--en-space-2')}; }
  :host([orientation=vertical]) .en-choice-group { flex-direction:column; }
  :host([cards]) .en-choice-group { display:grid; align-items:stretch; grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr)); }
  .en-choice-card { display: flex; gap: ${t('--en-space-3')}; padding: ${t('--en-space-4')}; border: ${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; background: ${t('--en-color-surface')}; cursor: pointer; }
  .en-choice-card:has(:checked) { background: ${t('--en-color-selected')}; border-color: ${t('--en-color-action')}; }
  .en-choice-card:has(:focus-visible) { outline: ${t('--en-focus-width')} solid ${t('--en-color-focus')}; outline-offset: ${t('--en-focus-offset')}; }
  @media (hover: hover) and (forced-colors: none) {
    .en-choice-group .en-choice:hover:not(:active) > .en-checkbox:not(:disabled):not([aria-readonly=true]) { border-color: ${t('--en-color-action-hover')}; }
    .en-choice-group .en-choice:hover:not(:active) > .en-checkbox:not(:disabled):not([aria-readonly=true]):not(:checked):not(:indeterminate) { background: ${t('--en-color-surface-subtle')}; }
    .en-choice-group .en-choice:hover:not(:active) > .en-checkbox:not(:disabled):not([aria-readonly=true]):is(:checked, :indeterminate) { background: ${t('--en-color-action-hover')}; }
    .en-choice-card:hover:has(> .en-checkbox:not(:disabled):not([aria-readonly=true])) { border-color: ${t('--en-color-action-hover')}; }
    .en-choice-card:hover:not(:has(:checked, :indeterminate)):has(> .en-checkbox:not(:disabled):not([aria-readonly=true])) { background: ${t('--en-color-surface-subtle')}; }
  }
  @media (hover: hover) and (forced-colors: active) {
    .en-choice-group .en-choice:hover:not(:active) > .en-checkbox:not(:disabled):not([aria-readonly=true]),
    .en-choice-card:hover:has(> .en-checkbox:not(:disabled):not([aria-readonly=true])) { border-color: Highlight; }
  }
  .en-selection-actions { display:flex; align-items:center; flex-wrap:wrap; gap:${t('--en-space-actions')}; min-inline-size:0; }
  .en-selection-actions > slot { display:contents; }
  .en-selection-actions > [role=status] { min-inline-size:0; overflow-wrap:anywhere; }
  .en-selection-list { list-style:none; padding:0; display:grid; gap:${t('--en-space-2')}; }
  .en-selection-list .en-choice { flex:1; }
  .en-choice small, .en-choice-card small { display: block; color: ${t('--en-color-text-muted')}; }
  .en-tags { display: flex; flex-wrap: wrap; gap: ${t('--en-space-2')}; }
  .en-tag { display: inline-flex; align-items: center; gap: ${t('--en-space-1')}; border: ${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; padding-inline-start: ${t('--en-space-2')}; background: ${t('--en-color-surface-subtle')}; }
  ${insetActionContext(css`.en-tag`, css`.en-tag > .en-button`, t('--en-radius-control'), t('--en-border-width'))}
  .en-tag { gap:0; }
  .en-tag > .en-button { padding-inline:${t('--en-space-1')}; }
  .en-picker { position: relative; display: grid; gap: ${t('--en-space-2')}; }
  .en-picker-options { position: absolute; inset-inline: 0; inset-block-start: 100%; z-index: 10; background: ${t('--en-color-surface')}; max-block-size: 16rem; overflow: auto; border: ${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; padding: ${t('--en-space-1')}; }
  @media (hover: hover) {
    .en-option[aria-selected=true]:is(:disabled, [aria-disabled=true], :not(:hover):not(:active)), .en-button[aria-pressed=true]:is(:disabled, [aria-disabled=true], :not(:hover):not(:active)), .en-button[aria-pressed=mixed]:is(:disabled, [aria-disabled=true], :not(:hover):not(:active)) { background: ${t('--en-color-selected')}; color: ${t('--en-color-action-text')}; border-color: ${t('--en-color-action')}; }
  }
  @media (hover: none) {
    .en-option[aria-selected=true]:is(:disabled, [aria-disabled=true], :not(:active)), .en-button[aria-pressed=true]:is(:disabled, [aria-disabled=true], :not(:active)), .en-button[aria-pressed=mixed]:is(:disabled, [aria-disabled=true], :not(:active)) { background: ${t('--en-color-selected')}; color: ${t('--en-color-action-text')}; border-color: ${t('--en-color-action')}; }
  }
  ${joinedButtonStyles}
  .en-meter-label { display:grid; gap:${t('--en-space-2')}; }
  .en-meter { inline-size:100%; accent-color:${t('--en-color-action')}; }
  .en-attachment { display:flex; align-items:center; flex-wrap:wrap; gap:${t('--en-space-3')}; padding:${t('--en-space-3')}; border:${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius:${t('--en-radius-control')}; }
  .en-app-shell { display:grid; grid-template-columns:minmax(12rem,18rem) minmax(0,1fr); gap:${t('--en-space-6')}; }
  .en-app-shell > header { grid-column:1/-1; }
  .en-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr)); gap:${t('--en-space-4')}; }
  .en-code, .en-keycap { font-family:${t('--en-font-code-family')}; background:${t('--en-color-surface-subtle')}; border-radius:${t('--en-radius-control')}; padding:.125em .35em; }
  .en-keycap { border:${t('--en-border-width')} solid ${t('--en-color-boundary')}; }
  pre.en-code { padding:${t('--en-space-4')}; overflow:auto; }
  .en-separator { border:0; border-block-start:${t('--en-border-width')} solid ${t('--en-color-line')}; }
  .en-local-datetime { display:grid; gap:${t('--en-space-2')}; }
  .en-message-marker { display:flex; align-items:center; gap:${t('--en-space-3')}; color:${t('--en-color-text-muted')}; }
  .en-message-marker hr { flex:1; }
  .en-system-message { padding:${t('--en-space-3')}; color:${t('--en-color-text-muted')}; background:${t('--en-color-surface-subtle')}; border-radius:${t('--en-radius-control')}; }
  .en-code-block { margin:0; }
  .en-scroll-area { max-block-size:20rem; overflow:auto; scrollbar-color:auto; }
  .en-metadata { display:grid; gap:${t('--en-space-3')}; }
  .en-metadata > div { display:flex; flex-wrap:wrap; justify-content:space-between; gap:${t('--en-space-2')}; }
  .en-metadata dd { margin:0; }
  .en-media-card { margin:0; padding:${t('--en-space-3')}; display:grid; gap:${t('--en-space-3')}; border:${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius:${t('--en-radius-control')}; overflow:hidden; }
  .en-media-card img { inline-size:100%; block-size:auto; aspect-ratio:16/9; object-fit:cover; }
  .en-media-card-flush { padding:0; }
  .en-media-card-flush > :not(img) { margin-inline:${t('--en-space-3')}; }
  .en-navigation-flyout { position:relative; }
  .en-navigation-flyout > ul { position:absolute; z-index:2; inset-block-start:100%; inset-inline-start:0; min-inline-size:14rem; padding:${t('--en-space-3')}; margin:0; list-style:none; background:${t('--en-color-surface')}; border:${t('--en-border-width')} solid ${t('--en-color-boundary')}; border-radius:${t('--en-radius-control')}; }
  .en-navigation-flyout a { display:block; padding:${t('--en-space-2')}; }
  .en-joined-field { display:flex; align-items:end; gap:${t('--en-space-2')}; flex-wrap:wrap; }
  .en-joined-field > label { display:grid; gap:${t('--en-space-2')}; flex:1; }
  .en-joined-actions { display:flex; gap:${t('--en-space-1')}; }
  @media(max-width:42rem) { .en-app-shell { grid-template-columns:minmax(0,1fr); } }
  @media (forced-colors: active) { .en-choice-card:has(:checked), .en-option[aria-selected=true], .en-button[aria-pressed=true] { border-color: Highlight; } }
`);
