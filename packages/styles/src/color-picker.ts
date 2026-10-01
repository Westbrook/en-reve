import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { token as t, override as o } from './internal/values.js';
import { sizedStyles } from './internal/sizing.js';
export const colorPickerStyles = sizedStyles(css`
  :host { min-inline-size:0; }
  [part=base] { display:grid; gap:var(--en-color-picker-gap,var(--en-field-gap,.75rem)); inline-size:var(--en-color-picker-inline-size,20rem); max-inline-size:100%; color:var(--en-color-text); }
  [part=formats] { display:flex; align-items:end; flex-wrap:wrap; gap:var(--en-space-3,.75rem); }
  [part=format] { flex:1; min-inline-size:7rem; }
  [part=alpha-toggle] { flex:none; }
  .preview-frame { display:block; flex:none; border-radius:var(--en-color-picker-preview-radius,${o('--en-control-radius',t('--en-radius-control'))}); background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.5rem) * 2) calc(var(--en-color-slider-checker-size,.5rem) * 2); }
  .summary { display:flex; align-items:center; gap:var(--en-space-3,.75rem); }
  [part=preview] { display:block; flex:none; inline-size:var(--en-color-picker-preview-size,3rem); aspect-ratio:1; border:1px solid var(--en-color-boundary,currentColor); border-radius:var(--en-color-picker-preview-radius,${o('--en-control-radius',t('--en-radius-control'))}); forced-color-adjust:none; }
  [part=hex-field] { min-inline-size:0; flex:1; }
  [part=hex-field]::part(control) { font-variant-numeric:tabular-nums; }
  .en-input { inline-size:100%; min-inline-size:0; }
  [part=hex-field]::part(description), [part=hex-field]::part(error) { margin-block-start:var(--en-space-1,.25rem); font-size:.875em; }
  [part=channels] { display:grid; gap:var(--en-space-2,.5rem); }
  [part~=channel] { display:block; min-inline-size:0; font-variant-numeric:tabular-nums; }
  .en-range { grid-column:1 / -1; inline-size:100%; min-inline-size:0; margin:0; }
  [part=error] { margin:0; font-size:.875em; color:var(--en-color-text-muted); }
  [part=error][data-invalid] { color:var(--en-color-danger-text,var(--en-color-text)); }
  [part=space], [part=gamut-message] { margin:0; font-size:.875em; overflow-wrap:anywhere; }
  [part=gamut-message] { color:var(--en-color-text-muted); }
  [part=value] { min-inline-size:0; overflow-wrap:anywhere; }
  slot { display:contents; }
  [hidden] { display:none !important; }
`);

export const colorPlaneStyles = sizedStyles(css`
  :host { min-inline-size:0; container:color-plane / inline-size; }
  [part=base], [part=channels] { display:grid; gap:var(--en-color-picker-gap,var(--en-field-gap,.75rem)); min-inline-size:0; }
  [part=plane] { position:relative; block-size:var(--en-color-plane-block-size,12rem); min-block-size:max(6rem,${controlTargetSize()}); min-inline-size:${controlTargetSize()}; touch-action:none; user-select:none; border:1px solid var(--en-color-boundary,currentColor); border-radius:var(--en-color-plane-radius,${o('--en-control-radius',t('--en-radius-control'))}); background-image:linear-gradient(to top,#000,transparent),var(--_en-plane-fallback); background-image:linear-gradient(to top,#000,transparent),var(--_en-plane-gradient); forced-color-adjust:none; cursor:crosshair; }
  [part=thumb] { position:absolute; inset-inline-start:var(--_en-plane-x); top:var(--_en-plane-y); inline-size:var(--en-color-plane-thumb-size,1.25rem); block-size:var(--en-color-plane-thumb-size,1.25rem); transform:translate(-50%,-50%); border:2px solid #fff; box-shadow:0 0 0 1px #222,inset 0 0 0 1px #222; border-radius:50%; pointer-events:none; }
  :host(:dir(rtl)) [part=plane] { transform:scaleX(-1); }
  :host(:dir(rtl)) [part=thumb] { inset-inline-start:auto; left:var(--_en-plane-x); }
  [part=axes], [part=error] { margin:0; color:var(--en-color-text-muted); font-size:.875em; }
  :host([disabled]) [part=plane] { opacity:.55; cursor:default; }
  @media(any-pointer:coarse) { [part=plane] { min-block-size:max(6rem,${controlTargetSize(true)}); min-inline-size:${controlTargetSize(true)}; } }
  @container color-plane (min-width:34rem) {
    [part=base] { grid-template-columns:minmax(0,1fr) minmax(0,1fr); grid-template-rows:auto 1fr auto; align-items:start; }
    [part=plane] { grid-column:1; grid-row:1; }
    [part=axes] { grid-column:1; grid-row:2; }
    [part=channels] { grid-column:2; grid-row:1 / 3; }
    [part=error] { grid-column:1 / -1; }
  }

  [part=thumb] { transition: scale clamp(0ms, var(--en-color-plane-thumb-release-duration, 80ms), 200ms) ${t('--en-ease-standard')}; }
  :host(:not([disabled])) [part=plane]:active [part=thumb] { scale: clamp(.9, var(--en-color-plane-thumb-pressed-scale, 1), 1.25); transition-duration: clamp(0ms, var(--en-color-plane-thumb-press-duration, 80ms), 200ms); }
  @media (prefers-reduced-motion: reduce) { [part=thumb] { scale: none !important; transition: none !important; } }
  :host([data-press=none]) [part=thumb] { scale: none !important; }
  @media (forced-colors:active) { [part=plane] { background:Canvas; border-color:CanvasText; forced-color-adjust:auto; } [part=thumb] { background:Highlight; border-color:HighlightText; box-shadow:0 0 0 1px CanvasText; } }
`);
