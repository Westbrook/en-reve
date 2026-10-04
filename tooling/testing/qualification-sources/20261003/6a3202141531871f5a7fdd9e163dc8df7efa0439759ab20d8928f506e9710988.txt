import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
const track = css`
  block-size:var(--en-color-slider-track-size,1.5rem);
  border:1px solid ${t('--en-color-boundary')};
  border-radius:var(--en-color-slider-radius,${o('--en-control-radius',t('--en-radius-control'))});
  background-image:var(--_en-color-gradient-fallback),var(--_en-color-checker,linear-gradient(transparent,transparent));
  background-image:var(--_en-color-gradient),var(--_en-color-checker,linear-gradient(transparent,transparent));
  background-size:100% 100%,calc(var(--en-color-slider-checker-size,.5rem) * 2) calc(var(--en-color-slider-checker-size,.5rem) * 2);
  forced-color-adjust:none;
`;
const thumb = css`
  inline-size:var(--en-color-slider-thumb-size,1.75rem);block-size:var(--en-color-slider-thumb-size,1.75rem);
  border:2px solid white;border-radius:50%;background:transparent;box-shadow:0 0 0 1px #222,inset 0 0 0 1px #222;
`;
export const colorSliderStyles = sizedStyles(css`
  :host { display:block; min-inline-size:0; }
  :host([checkerboard]) { --_en-color-checker:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%); }
  :host(:dir(rtl)) .en-range { --_en-color-gradient:var(--_en-color-gradient-rtl); --_en-color-gradient-fallback:var(--_en-color-gradient-fallback-rtl); }
  .en-range-row[data-orientation='vertical'] .en-range { --_en-color-gradient:var(--_en-color-gradient-vertical); --_en-color-gradient-fallback:var(--_en-color-gradient-fallback-vertical); }
  .en-range { inline-size:100%; min-inline-size:0; min-block-size:max(var(--en-color-slider-thumb-size,1.75rem),${controlTargetSize()}); margin-inline:1px; }
  .en-range::-webkit-slider-runnable-track { ${track} }
  .en-range::-moz-range-track { ${track} }
  .en-range::-webkit-slider-thumb { ${thumb} margin-block-start:calc((var(--en-color-slider-track-size,1.5rem) - var(--en-color-slider-thumb-size,1.75rem)) / 2 - 1px); }
  .en-range::-moz-range-thumb { ${thumb} }
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
  .en-range:disabled { opacity:.55; }
  @media (any-pointer:coarse) { .en-range { min-block-size:max(${controlTargetSize(true)},var(--en-color-slider-thumb-size,1.75rem)); } }
  @media (forced-colors:active) {
    .en-range::-webkit-slider-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; forced-color-adjust:none; }
    .en-range::-moz-range-thumb { background:Canvas; border-color:CanvasText; box-shadow:none; forced-color-adjust:none; }
  }
`);
