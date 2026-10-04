import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
const thumbSize = css`var(--en-color-slider-thumb-size,var(--en-slider-thumb-size,1.75rem))`;
const trackSize = css`var(--en-color-slider-track-size,var(--en-slider-track-size,1.5rem))`;
const ring = css`0 0 0 1px #222,inset 0 0 0 1px #222`;
const track = css`
  block-size:${trackSize};
  border:1px solid ${t('--en-color-boundary')};
  border-radius:var(--en-color-slider-radius,var(--en-slider-track-radius,${o('--en-control-radius',t('--en-radius-control'))}));
  background-color:var(--_en-color-slider-track-underlay);
  box-shadow:var(--_en-color-slider-track-shadow);
  background-image:var(--_en-color-gradient-fallback),var(--_en-color-checker,linear-gradient(transparent,transparent));
  background-image:var(--_en-color-gradient),var(--_en-color-checker,linear-gradient(transparent,transparent));
  background-size:100% 100%,calc(var(--en-color-slider-checker-size,.5rem) * 2) calc(var(--en-color-slider-checker-size,.5rem) * 2);
  forced-color-adjust:none;
`;
const thumb = css`
  inline-size:${thumbSize};block-size:${thumbSize};
  border:var(--en-slider-thumb-border-width,2px) solid var(--_en-color-slider-thumb-border);
  border-radius:var(--en-slider-thumb-radius,50%);background:var(--_en-color-slider-thumb-paint);
  box-shadow:var(--_en-color-slider-thumb-shadow);
  opacity:var(--_en-color-slider-thumb-opacity,1);
`;
export const colorSliderStyles = sizedStyles(css`
  :host { display:block; min-inline-size:0; }
  :host([checkerboard]) { --_en-color-checker:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%); }
  :host(:dir(rtl)) .en-range { --_en-color-gradient:var(--_en-color-gradient-rtl); --_en-color-gradient-fallback:var(--_en-color-gradient-fallback-rtl); }
  .en-range-row[data-orientation='vertical'] .en-range { --_en-color-gradient:var(--_en-color-gradient-vertical); --_en-color-gradient-fallback:var(--_en-color-gradient-fallback-vertical); }
  /* Keep the specialized hollow thumb and continuous gradient authoritative.
     Meaningful inherited slider hooks remain explicit opt-in refinements. */
  .en-range {
    --_en-color-slider-thumb-paint:var(--en-slider-thumb-background,transparent);
    --_en-color-slider-thumb-border:var(--en-slider-thumb-border-color,white);
    --_en-color-slider-thumb-shadow:var(--en-slider-thumb-shadow,${ring});
    --_en-color-slider-track-underlay:var(--en-slider-track-background,transparent);
    --_en-color-slider-track-shadow:var(--en-slider-track-shadow,none);
  }
  @media(hover:hover) {
    .en-range:enabled:not([aria-disabled='true']):hover {
      --_en-color-slider-thumb-paint:var(--en-slider-hover-thumb-background,var(--en-slider-thumb-background,transparent));
      --_en-color-slider-thumb-border:var(--en-slider-hover-thumb-border-color,var(--en-slider-thumb-border-color,white));
      --_en-color-slider-thumb-shadow:var(--en-slider-thumb-hover-shadow,var(--en-slider-thumb-shadow,${ring}));
    }
  }
  .en-range:enabled:not([aria-disabled='true']):active {
    --_en-color-slider-thumb-paint:var(--en-slider-pressed-thumb-background,var(--en-slider-thumb-background,transparent));
    --_en-color-slider-thumb-border:var(--en-slider-pressed-thumb-border-color,var(--en-slider-thumb-border-color,white));
  }
  @media(hover:hover) {
    .en-range:enabled:not([aria-disabled='true']):hover:active {
      --_en-color-slider-thumb-paint:var(--en-slider-hover-pressed-thumb-background,var(--en-slider-pressed-thumb-background,var(--en-slider-thumb-background,transparent)));
    }
  }
  .en-range:enabled:not([aria-disabled='true']):focus-visible {
    --_en-color-slider-thumb-shadow:var(--en-slider-thumb-focus-shadow,var(--en-slider-thumb-shadow,${ring}));
  }
  .en-range:disabled {
    --_en-color-slider-thumb-paint:var(--en-slider-disabled-thumb-background,var(--en-slider-thumb-background,transparent));
    --_en-color-slider-thumb-border:var(--en-slider-disabled-thumb-border-color,var(--en-slider-thumb-border-color,white));
    --_en-color-slider-thumb-shadow:var(--en-slider-disabled-thumb-shadow,var(--en-slider-thumb-shadow,${ring}));
    --_en-color-slider-thumb-opacity:var(--en-slider-disabled-thumb-opacity,1);
    --_en-color-slider-track-underlay:var(--en-slider-disabled-track-background,var(--en-slider-track-background,transparent));
    --_en-color-slider-track-shadow:var(--en-slider-disabled-track-shadow,var(--en-slider-track-shadow,none));
  }
  .en-range { inline-size:100%; min-inline-size:0; min-block-size:max(${thumbSize},${controlTargetSize()}); margin-inline:1px; }
  .en-range::-webkit-slider-runnable-track { ${track} }
  .en-range::-moz-range-track { ${track} }
  .en-range::-webkit-slider-thumb,
  .en-range:enabled:not([aria-disabled='true']):hover::-webkit-slider-thumb,
  .en-range:enabled:not([aria-disabled='true']):focus-visible::-webkit-slider-thumb,
  .en-range:disabled::-webkit-slider-thumb { ${thumb} margin-block-start:calc((${trackSize} - ${thumbSize}) / 2 - 1px); }
  .en-range::-moz-range-thumb,
  .en-range:enabled:not([aria-disabled='true']):hover::-moz-range-thumb,
  .en-range:enabled:not([aria-disabled='true']):focus-visible::-moz-range-thumb,
  .en-range:disabled::-moz-range-thumb { ${thumb} }
  .en-field { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; }
  .en-range-row:not([data-orientation='vertical']) { display:contents; }
  .en-range-row:not([data-orientation='vertical']) > .en-range { grid-column:1 / -1; grid-row:2; inline-size:calc(100% - 2px); }
  .en-range-row:not([data-orientation='vertical']) > .en-range-editor { grid-column:2; grid-row:1; inline-size:5.5rem; min-inline-size:0; }
  .en-range-row:not([data-orientation='vertical']) > output { grid-column:2; grid-row:1; }
  en-text-field.en-range-editor::part(label) { position:absolute; inline-size:1px; block-size:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
  en-text-field.en-range-editor { --en-field-gap:0; }
  en-text-field.en-range-editor::part(control) { inline-size:100%; min-inline-size:0; }
  .en-range-row[data-editable] > output { display:none; }
  .en-range-error, .en-description { grid-column:1 / -1; }
  .en-range:disabled { opacity:var(--en-slider-disabled-opacity,.55); }
  @media (any-pointer:coarse) { .en-range { min-block-size:max(${controlTargetSize(true)},${thumbSize}); } }
  @media (forced-colors:active) {
    .en-range::-webkit-slider-thumb,
    .en-range:enabled:not([aria-disabled='true']):hover::-webkit-slider-thumb,
    .en-range:enabled:not([aria-disabled='true']):focus-visible::-webkit-slider-thumb,
    .en-range:disabled::-webkit-slider-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; forced-color-adjust:none; }
    .en-range::-moz-range-thumb,
    .en-range:enabled:not([aria-disabled='true']):hover::-moz-range-thumb,
    .en-range:enabled:not([aria-disabled='true']):focus-visible::-moz-range-thumb,
    .en-range:disabled::-moz-range-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; forced-color-adjust:none; }
  }
`);
