import { selectChevron } from './internal/select-chevron.js';
import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
import { optionPaint } from './internal/option-paint.js';
import { focusVisibleStylesFor, focusScrollStylesFor, focusExtent } from './internal/focus-core.js';

export const treeStyles = sizedStyles(css`
  .en-tree { display: flex; flex-direction: column; gap: ${o('--en-option-list-gap', t('--en-space-1'))}; min-inline-size: 0; isolation: isolate; }
  .en-tree > slot { display: contents; }
  .en-tree-error { color: ${t('--en-color-text')}; overflow-wrap: anywhere; }
  .en-tree-drag-preview { position: fixed; z-index: 1000; pointer-events: none; box-sizing: border-box; inline-size: 12rem; padding: ${t('--en-space-2')}; border: 1px solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; background: ${t('--en-color-surface')}; color: ${t('--en-color-text')}; box-shadow: 0 4px 12px #0003; overflow-wrap: anywhere; }
  .en-tree-drop-indicator { position: fixed; z-index: 999; pointer-events: none; block-size: 2px; transform: translateY(-50%); background: ${t('--en-color-action')}; }
  .en-tree-drop-indicator::before { content: ''; position: absolute; inset-inline-start: 0; inset-block-start: 50%; inline-size: 6px; block-size: 6px; border-radius: 50%; background: inherit; transform: translateY(-50%); }
  @media (forced-colors: active) { .en-tree-drop-indicator { background: Highlight; } }
  .en-tree-drag-preview small { display: block; color: ${t('--en-color-text-muted')}; }
  .en-tree-move:has(fieldset), .en-tree-branch-controls { margin-block-start: ${t('--en-space-3')}; }
  .en-tree-move fieldset { display: flex; flex-wrap: wrap; align-items: end; gap: ${t('--en-space-3')}; margin-block-start: ${t('--en-space-3')}; min-inline-size: 0; border: 1px solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; }
  .en-tree-move label { display: grid; gap: ${t('--en-space-1')}; flex: 1 1 10rem; min-inline-size: 0; }
  .en-tree-move select { appearance:none; grid-column:1; grid-row:2; min-inline-size: 0; max-inline-size: 100%; min-block-size: max(2.75rem, ${controlTargetSize()}); font: inherit; color: ${t('--en-color-text')}; background: ${t('--en-color-surface')}; border: 1px solid ${t('--en-color-boundary')}; border-radius: ${t('--en-radius-control')}; padding: ${t('--en-space-2')}; padding-inline-end:calc(${t('--en-space-2')} + ${t('--en-size-icon')} + ${t('--en-space-1')}); }
  .en-tree-move label:has(> select)::after { content:''; grid-column:1; grid-row:2; align-self:center; justify-self:end; margin-inline-end:${t('--en-space-2')}; inline-size:${t('--en-size-icon')}; block-size:${t('--en-size-icon')}; background:currentColor; mask:${selectChevron} center / contain no-repeat; pointer-events:none; }
  @media (any-pointer: coarse) { .en-tree-move select { min-block-size: max(2.75rem, ${controlTargetSize(true)}); } }
  .en-tree-move p:empty, .en-tree-branch-controls p:empty { margin: 0; }
  .en-tree-error[hidden] { display: none; }
  ${focusVisibleStylesFor(css`.en-tree:focus-visible`, { family: 'option', inset: true, restSelector: css`.en-tree` })}
`);

/** Hierarchy is structural; only the row paints selection and the focus contour. */
export const treeItemStyles = sizedStyles(css`
  :host { min-inline-size: 0; }
  :host(:focus-within) { position: relative; z-index: 1; }
  :host([hidden]), :host([inert]), :host([aria-hidden='true' i]) { display: none; }
  .en-tree-item { min-inline-size: 0; outline: none; }
  .en-tree-option {
    position: relative; display: flex; align-items: center;
    gap: ${t('--en-space-icon-label')}; box-sizing: border-box;
    min-inline-size: ${t('--en-size-target-min')};
    min-block-size: ${controlTargetSize()};
    inline-size: 100%; max-inline-size: 100%;
    padding-block: ${o('--en-option-block-padding', t('--en-space-control-block'))};
    padding-inline: ${o('--en-option-inline-padding', t('--en-space-control-inline'))};
    border-radius: ${o('--en-option-radius', t('--en-radius-control'))};
    font: inherit; text-align: start; overflow-wrap: anywhere; cursor: pointer;
    -webkit-user-select: none; user-select: none;
  }
  ${optionPaint({
    base: css`.en-tree-option`,
    selected: css`:is(.en-tree-item[aria-selected='true'], .en-tree-item[aria-selected='true'] > .en-tree-row) > .en-tree-option`,
    hover: css`:is(.en-tree-item:not([aria-disabled='true']), .en-tree-item:not([aria-disabled='true']) > .en-tree-row) > .en-tree-option:hover`,
    pressed: css`:is(.en-tree-item:not([aria-disabled='true']), .en-tree-item:not([aria-disabled='true']) > .en-tree-row) > .en-tree-option:active`,
    disabled: css`:is(.en-tree-item[aria-disabled='true'], .en-tree-item[aria-disabled='true'] > .en-tree-row) > .en-tree-option`,
    restBackground: css`transparent`, restColor: t('--en-color-text'),
    selectedColor: t('--en-color-action-text'), hoverBackground: t('--en-color-surface-subtle'),
  })}
  :is(.en-tree-item[aria-disabled='true'], .en-tree-item[aria-disabled='true'] > .en-tree-row) > .en-tree-option { cursor: default; }
  .en-tree-option[data-reorderable] { cursor: grab; }
  .en-tree-option[data-tree-dragging], .en-tree-option[data-tree-dragging] .en-tree-drag { cursor: grabbing; }
  .en-tree-option[data-tree-dragging] { opacity: .65; }
  .en-tree-drag { display: inline-flex; align-items: center; justify-content: center; min-inline-size: max(2.75rem, ${controlTargetSize()}); min-block-size: max(2.75rem, ${controlTargetSize()}); touch-action: none; cursor: grab; }
  .en-tree-option[data-tree-drop='inside'] { outline: 2px solid currentColor; outline-offset: -2px; }
  .en-tree-branch-status { font-size: .875em; color: ${t('--en-color-text-muted')}; }
  .en-tree-label { flex: 1 1 auto; min-inline-size: 0; }
  .en-tree-option > slot { display: contents; }
  .en-tree-indicator {
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
    inline-size: ${t('--en-size-target-min')}; block-size: ${t('--en-size-target-min')};
    margin-block: calc(0px - ${o('--en-option-block-padding', t('--en-space-control-block'))});
  }
  .en-tree-indicator svg { inline-size: ${t('--en-size-icon')}; block-size: ${t('--en-size-icon')}; }
  .en-tree-indicator[hidden] { visibility: hidden; }
  :host(:dir(rtl)) .en-tree-indicator svg { transform: rotate(180deg); }
  :is(.en-tree-item[aria-expanded='true'], .en-tree-item[aria-expanded='true'] > .en-tree-row) > .en-tree-option .en-tree-indicator svg { transform: rotate(90deg); }
  .en-tree-group { display: flex; flex-direction: column; gap: ${o('--en-option-list-gap', t('--en-space-1'))}; padding-inline-start: ${t('--en-space-4')}; margin-block-start: ${o('--en-option-list-gap', t('--en-space-1'))}; min-inline-size: 0; }
  .en-tree-group > slot { display: contents; }
  .en-tree-group[hidden] { display: none; }
  ${focusScrollStylesFor(css`.en-tree-item`, { family: 'option', inset: true })}
  ${focusVisibleStylesFor(css`:is(.en-tree-item:focus-visible, .en-tree-item:focus-visible > .en-tree-row) > .en-tree-option`, { family: 'option', inset: true, restSelector: css`.en-tree-option` })}
  .en-tree-group { scroll-margin-inline: ${focusExtent({ family: 'option', inset: true })}; }
  @media (any-pointer: coarse) {
    .en-tree-option { min-block-size: ${controlTargetSize(true)}; }
    .en-tree-drag { min-inline-size: max(2.75rem, ${controlTargetSize(true)}); min-block-size: max(2.75rem, ${controlTargetSize(true)}); }
    .en-tree-indicator { inline-size: ${controlTargetSize(true, t('--en-size-target-min'))}; block-size: ${controlTargetSize(true, t('--en-size-target-min'))}; }
  }
  @media (forced-colors: active) {
    .en-tree-option { background: Canvas; color: CanvasText; }
    :is(.en-tree-item[aria-selected='true'], .en-tree-item[aria-selected='true'] > .en-tree-row) > .en-tree-option { background: Highlight; color: HighlightText; }
    :is(.en-tree-item[aria-disabled='true'], .en-tree-item[aria-disabled='true'] > .en-tree-row) > .en-tree-option { color: GrayText; }
    :is(.en-tree-item[aria-selected='true']:focus-visible, .en-tree-item[aria-selected='true']:focus-visible > .en-tree-row) > .en-tree-option { outline-color: HighlightText; }
  }
`);


/** Data rows include their spacing in measured geometry; groups add no block extent. */
export const treeDataStyles = css`
  :host([virtualize]) { display: flex; flex-direction: column; min-block-size: 0; }
  .en-tree-data-viewport { min-inline-size: 0; }
  /* A definite host allocation wins; the basis supplies the unsized fallback. */
  .en-tree-data-viewport[data-virtualize] { flex: 1 1 var(--en-tree-viewport-size, 24rem); min-block-size: 0; overflow: auto; overflow-anchor: none; }
  .en-tree-data, .en-tree-data .en-tree-group { display: block; gap: 0; margin-block: 0; }
  .en-tree-data .en-tree-group[hidden] { display: none; }
  .en-tree-data .en-tree-item { position: relative; }
  .en-tree-data .en-tree-item:focus { z-index: 1; }
  .en-tree-data .en-tree-option { margin: 0; }
  .en-tree-loading {
    display: flex; align-items: center; gap: ${t('--en-space-icon-label')}; box-sizing: border-box;
    margin-inline-start: ${t('--en-space-4')};
    padding-block: ${o('--en-option-block-padding', t('--en-space-control-block'))};
    padding-inline: ${o('--en-option-inline-padding', t('--en-space-control-inline'))};
    min-block-size: ${controlTargetSize()};
    color: ${t('--en-color-text-muted')};
  }
  @media (any-pointer: coarse) {
    .en-tree-loading { min-block-size: ${controlTargetSize(true)}; }
  }
  .en-tree-data [data-en-virtual-gap] { margin: 0; padding: 0; border: 0; pointer-events: none; }
`;
