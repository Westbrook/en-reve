import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { token as t } from './internal/values.js';
import { sizedStyles } from './internal/sizing.js';

export const colorWheelStyles = sizedStyles(css`
  :host {display:block;min-inline-size:0;}
  [part=base] {display:grid;gap:var(--en-space-3,.75rem);grid-template-columns:minmax(0,1fr) auto;align-items:center;inline-size:min(100%,var(--en-color-wheel-size,14rem));}
  [part=label] {font-weight:${t('--en-font-label-strong-weight')};}
  [part=control] {min-inline-size:${controlTargetSize(false,t('--en-size-target-min'))};min-block-size:${controlTargetSize(false,t('--en-size-target-min'))};grid-column:1 / -1;grid-row:2;position:relative;inline-size:100%;aspect-ratio:1;border-radius:50%;touch-action:none;user-select:none;cursor:crosshair;direction:ltr;}
  [part=ring] {position:absolute;inset:0;border-radius:50%;mask-image:radial-gradient(circle closest-side,transparent calc(100% - var(--en-color-wheel-track-size,2rem)),#000 calc(100% - var(--en-color-wheel-track-size,2rem) + 1px));forced-color-adjust:none;}
  [part=center] {position:absolute;inset:var(--en-color-wheel-track-size,2rem);border-radius:50%;pointer-events:none;}
  .arm {position:absolute;inset:0;transform:rotate(var(--_en-wheel-angle));pointer-events:none;}
  [part=thumb] {position:absolute;left:50%;top:calc(var(--en-color-wheel-track-size,2rem) / 2);transform:translate(-50%,-50%);inline-size:var(--en-color-wheel-thumb-size,1.5rem);block-size:var(--en-color-wheel-thumb-size,1.5rem);background:var(--_en-wheel-thumb);border:2px solid white;box-shadow:0 0 0 1px #222,inset 0 0 0 1px #222;border-radius:50%;}
  [part=control]:focus-visible {outline:var(--en-focus-width,2px) solid var(--en-color-focus,Highlight);outline-offset:var(--en-focus-offset,3px);}
  [part=editor-field] {grid-column:2;grid-row:1;inline-size:5.5rem;--en-field-gap:0;}
  [part=editor-field]::part(label) {position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
  [part=error] {grid-column:1 / -1;margin:0;font-size:.875em;color:var(--en-color-text-muted);}
  :host([disabled]) [part=control] {opacity:.55;cursor:default;}
  @media(any-pointer:coarse) { [part=control] {min-inline-size:${controlTargetSize(true,t('--en-size-target-min'))};min-block-size:${controlTargetSize(true,t('--en-size-target-min'))};} }
  @media(forced-colors:active) {
    [part=ring] {background:Canvas!important;box-shadow:inset 0 0 0 2px CanvasText;forced-color-adjust:auto;}
    [part=center] {border:2px solid CanvasText;}
    [part=thumb] {background:Highlight;border-color:HighlightText;box-shadow:0 0 0 1px CanvasText;forced-color-adjust:none;}
    [part=control]:focus-visible {outline-color:Highlight;}
  }
`);
