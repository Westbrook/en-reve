import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
import { focusVisibleStylesFor, focusScrollStylesFor } from './internal/focus-core.js';

/** Native picker ownership with a themeable drop surface and separate file list. */
export const fileUploadStyles = sizedStyles(css`
  .en-file-drop {
    position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: ${t('--en-space-icon-label')}; min-inline-size: 0; box-sizing: border-box;
    min-block-size: ${controlTargetSize()};
    padding: ${t('--en-space-control-block')} ${o('--en-input-inline-padding', o('--en-control-inline-padding', t('--en-space-control-inline')))};
    border: ${t('--en-border-width')} dashed ${o('--en-control-border-color', t('--en-color-boundary'))};
    border-radius: ${o('--en-control-radius', t('--en-radius-control'))};
    background: ${o('--en-input-background', o('--en-control-background', t('--en-color-surface')))};
    color: ${o('--en-input-color', o('--en-control-color', t('--en-color-text')))};
    font: ${t('--en-font-input-weight')} ${t('--en-font-input-size')} / ${t('--en-font-input-line-height')} ${t('--en-font-input-family')}; font-style: ${t('--en-font-input-style')}; letter-spacing: ${t('--en-font-input-tracking')};
    overflow-wrap: anywhere;
  }
  .en-file-input { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; opacity: 0; cursor: pointer; }
  .en-file-drop[data-dragging] { border-style: solid; border-color: ${t('--en-color-action')}; background: ${t('--en-color-selected')}; }
  .en-file-drop[data-disabled] { color: ${t('--en-color-text-muted')}; background: ${t('--en-color-surface-subtle')}; }
  .en-file-drop[data-disabled] .en-file-input { cursor: default; }
  .en-file-drop[data-invalid] { border-color: ${t('--en-color-danger-text')}; }
  .en-file-hint { color: ${t('--en-color-text-muted')}; }
  .en-file-list { display: grid; gap: ${t('--en-space-1')}; margin: 0; padding: 0; list-style: none; }
  .en-file-list[hidden], .en-file-list:empty, .en-file-error:empty { display: none; }
  .en-file-item { display: flex; align-items: center; gap: ${t('--en-space-icon-label')}; min-inline-size: 0; }
  .en-file-name { flex: 1; min-inline-size: 0; overflow-wrap: anywhere; }
  .en-file-remove { flex: none; }
  ${focusVisibleStylesFor(css`.en-file-drop:has(> .en-file-input:focus-visible)`, {family:'input', restSelector:css`.en-file-drop`})}
  ${focusScrollStylesFor(css`.en-file-input`)}
  @media (any-pointer: coarse) { .en-file-drop { min-block-size: ${controlTargetSize(true)}; } }
  @media (forced-colors: active) {
    .en-file-drop { border-color: ButtonText; background: Canvas; color: CanvasText; }
    .en-file-drop[data-dragging] { border-color: Highlight; }
    .en-file-drop[data-disabled] { opacity: 1; border-color: GrayText; color: GrayText; }
  }
`);
