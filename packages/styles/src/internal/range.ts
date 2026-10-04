import { css } from 'lit';
import { token as t } from './values.js';

const trackSize = css`var(--en-slider-track-size, var(--_en-source-slider-track-size, ${t('--en-size-range-track')}))`;
const thumbSize = css`var(--en-slider-thumb-size, var(--_en-source-slider-thumb-size, ${t('--en-size-icon')}))`;
const track = css`
  block-size: ${trackSize};
  border: 0;
  border-radius: var(--en-slider-track-radius, var(--_en-source-slider-track-radius, ${t('--en-radius-pill')}));
  background: linear-gradient(var(--_en-slider-fill-direction, to right), var(--_en-slider-fill-paint) 0%, var(--_en-slider-fill-paint) clamp(0%, var(--en-slider-value-percent, 0%), 100%), var(--_en-slider-track-paint) clamp(0%, var(--en-slider-value-percent, 0%), 100%), var(--_en-slider-track-paint) 100%);
  box-shadow: var(--_en-slider-track-shadow);
`;
const thumb = css`
  box-sizing: border-box;
  inline-size: ${thumbSize};
  block-size: ${thumbSize};
  border: var(--en-slider-thumb-border-width, var(--_en-source-slider-thumb-border-width, ${t('--en-border-width')})) solid var(--_en-slider-thumb-border);
  border-radius: var(--en-slider-thumb-radius, var(--_en-source-slider-thumb-radius, ${t('--en-radius-pill')}));
  background: var(--_en-slider-thumb-paint);
  box-shadow: var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none));
`;
const disabledThumb = css`
  opacity: var(--en-slider-disabled-thumb-opacity, var(--_en-source-slider-disabled-thumb-opacity, 1));
  background: var(--en-slider-disabled-thumb-background, var(--_en-source-slider-disabled-thumb-background, ${t('--en-color-text-muted')}));
  border-color: var(--en-slider-disabled-thumb-border-color, var(--_en-source-slider-disabled-thumb-border-color, ${t('--en-color-text-muted')}));
  box-shadow: var(--en-slider-disabled-thumb-shadow, var(--_en-source-slider-disabled-thumb-shadow, var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none))));
`;
const thumbFocus = css`outline: ${t('--en-focus-width')} solid ${t('--en-color-focus')}; outline-offset: ${t('--en-focus-offset')};`;

/** Paint native range affordances only where the relevant thumb is exposed.
 * Other engines keep the native range and its whole-control focus outline.
 */
export const rangeStyles = css`
  .en-range {
    --_en-slider-track-paint: var(--en-slider-track-background, var(--_en-source-slider-track-background, ${t('--en-color-boundary')}));
    /* Unpinned native sliders retain the original unfilled track. */
    --_en-slider-fill-paint: var(--en-slider-fill-background, var(--_en-source-slider-fill-background, var(--_en-slider-track-paint)));
    --_en-slider-thumb-paint: var(--en-slider-thumb-background, var(--_en-source-slider-thumb-background, ${t('--en-color-action')}));
    --_en-slider-track-shadow: var(--en-slider-track-shadow, var(--_en-source-slider-track-shadow, none));
    --_en-slider-thumb-border: var(--en-slider-thumb-border-color, var(--_en-source-slider-thumb-border-color, ${t('--en-color-action')}));
    --_en-slider-fill-direction: to right;
  }
  .en-range:dir(rtl) { --_en-slider-fill-direction: to left; }
  .en-range-row[data-orientation='vertical'] > .en-range { --_en-slider-fill-direction: to top; }
  @media (hover: hover) {
    .en-range:enabled:not([aria-disabled='true']):hover {
      --_en-slider-thumb-border: var(--en-slider-hover-thumb-border-color, var(--_en-source-slider-hover-thumb-border-color, var(--en-slider-thumb-border-color, var(--_en-source-slider-thumb-border-color, ${t('--en-color-action')}))));
      --_en-slider-thumb-paint: var(--en-slider-hover-thumb-background, var(--_en-source-slider-hover-thumb-background, var(--en-slider-thumb-background, var(--_en-source-slider-thumb-background, ${t('--en-color-action')}))));
      --_en-slider-fill-paint: var(--en-slider-hover-fill-background, var(--_en-source-slider-hover-fill-background, var(--en-slider-fill-background, var(--_en-source-slider-fill-background, var(--_en-slider-track-paint)))));
    }
  }
  .en-range:enabled:not([aria-disabled='true']):active {
    --_en-slider-thumb-border: var(--en-slider-pressed-thumb-border-color, var(--_en-source-slider-pressed-thumb-border-color, var(--en-slider-thumb-border-color, var(--_en-source-slider-thumb-border-color, ${t('--en-color-action')}))));
    --_en-slider-thumb-paint: var(--en-slider-pressed-thumb-background, var(--_en-source-slider-pressed-thumb-background, var(--en-slider-thumb-background, var(--_en-source-slider-thumb-background, ${t('--en-color-action')}))));
    --_en-slider-fill-paint: var(--en-slider-pressed-fill-background, var(--_en-source-slider-pressed-fill-background, var(--en-slider-fill-background, var(--_en-source-slider-fill-background, var(--_en-slider-track-paint)))));
  }
  @media (hover: hover) {
    .en-range:enabled:not([aria-disabled='true']):hover:active {
      --_en-slider-thumb-paint: var(--en-slider-hover-pressed-thumb-background, var(--_en-source-slider-hover-pressed-thumb-background, var(--en-slider-pressed-thumb-background, var(--_en-source-slider-pressed-thumb-background, var(--en-slider-thumb-background, var(--_en-source-slider-thumb-background, ${t('--en-color-action')}))))));
      --_en-slider-fill-paint: var(--en-slider-hover-pressed-fill-background, var(--_en-source-slider-hover-pressed-fill-background, var(--en-slider-pressed-fill-background, var(--_en-source-slider-pressed-fill-background, var(--en-slider-fill-background, var(--_en-source-slider-fill-background, var(--_en-slider-track-paint)))))));
    }
  }
  .en-range:disabled {
    opacity: var(--en-slider-disabled-opacity, var(--_en-source-slider-disabled-opacity, 1));
    --_en-slider-track-shadow: var(--en-slider-disabled-track-shadow, var(--_en-source-slider-disabled-track-shadow, var(--en-slider-track-shadow, var(--_en-source-slider-track-shadow, none))));
    --_en-slider-track-paint: var(--en-slider-disabled-track-background, var(--_en-source-slider-disabled-track-background, var(--en-slider-track-background, var(--_en-source-slider-track-background, ${t('--en-color-boundary')}))));
    --_en-slider-disabled-fill-paint: var(--en-slider-disabled-fill-background, var(--_en-source-slider-disabled-fill-background, var(--en-slider-fill-background, var(--_en-source-slider-fill-background, var(--_en-slider-track-paint)))));
    --_en-slider-fill-paint: color-mix(in srgb, var(--_en-slider-disabled-fill-paint) calc(100% * clamp(0, var(--en-slider-disabled-fill-opacity, var(--_en-source-slider-disabled-fill-opacity, 1)), 1)), var(--_en-slider-track-paint));
  }
  @supports selector(input::-webkit-slider-thumb) {
    .en-range { appearance: none; background: none; cursor: pointer; }
    .en-range::-webkit-slider-runnable-track { ${track} }
    .en-range::-webkit-slider-thumb { appearance: none; ${thumb} margin-block-start: calc((${trackSize} - ${thumbSize}) / 2); }
    /* Exposed native thumbs own focus. A global halo must not reintroduce a
       rectangular range-host ring; native unsupported fallbacks keep that route. */
    .en-range, .en-range:focus-visible { box-shadow: none; }
    .en-range:focus-visible { outline: none; }
    .en-range:focus-visible::-webkit-slider-thumb { ${thumbFocus} }
    @media (hover: hover) { .en-range:enabled:not([aria-disabled='true']):hover::-webkit-slider-thumb { box-shadow: var(--en-slider-thumb-hover-shadow, var(--_en-source-slider-thumb-hover-shadow, var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none)))); } }
    .en-range:enabled:not([aria-disabled='true']):focus-visible::-webkit-slider-thumb { box-shadow: var(--en-slider-thumb-focus-shadow, var(--_en-source-slider-thumb-focus-shadow, var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none)))); }
    .en-range:disabled::-webkit-slider-thumb { ${disabledThumb} }
    @media (forced-colors: active) {
      .en-range::-webkit-slider-runnable-track { background: ButtonText; box-shadow: none; }
      .en-range::-webkit-slider-thumb { background: Highlight; border-color: Highlight; box-shadow: none; }
      .en-range:disabled::-webkit-slider-thumb { background: GrayText; border-color: GrayText; box-shadow: none; }
      .en-range:focus-visible::-webkit-slider-thumb { outline-color: CanvasText; }
      .en-range:enabled:not([aria-disabled='true']):is(:hover, :focus-visible)::-webkit-slider-thumb { box-shadow: none; }
    }
  }
  @supports selector(input::-moz-range-thumb) {
    .en-range { appearance: none; background: none; cursor: pointer; }
    .en-range::-moz-range-track { ${track} }
    .en-range::-moz-range-progress { background: transparent; border: 0; }
    .en-range::-moz-range-thumb { ${thumb} }
    /* Exposed native thumbs own focus. A global halo must not reintroduce a
       rectangular range-host ring; native unsupported fallbacks keep that route. */
    .en-range, .en-range:focus-visible { box-shadow: none; }
    .en-range:focus-visible { outline: none; }
    .en-range:focus-visible::-moz-range-thumb { ${thumbFocus} }
    @media (hover: hover) { .en-range:enabled:not([aria-disabled='true']):hover::-moz-range-thumb { box-shadow: var(--en-slider-thumb-hover-shadow, var(--_en-source-slider-thumb-hover-shadow, var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none)))); } }
    .en-range:enabled:not([aria-disabled='true']):focus-visible::-moz-range-thumb { box-shadow: var(--en-slider-thumb-focus-shadow, var(--_en-source-slider-thumb-focus-shadow, var(--en-slider-thumb-shadow, var(--_en-source-slider-thumb-shadow, none)))); }
    .en-range:disabled::-moz-range-thumb { ${disabledThumb} }
    @media (forced-colors: active) {
      .en-range::-moz-range-track { background: ButtonText; box-shadow: none; }
      .en-range::-moz-range-thumb { background: Highlight; border-color: Highlight; box-shadow: none; }
      .en-range:disabled::-moz-range-thumb { background: GrayText; border-color: GrayText; box-shadow: none; }
      .en-range:focus-visible::-moz-range-thumb { outline-color: CanvasText; }
      .en-range:enabled:not([aria-disabled='true']):is(:hover, :focus-visible)::-moz-range-thumb { box-shadow: none; }
    }
  }
  .en-range:disabled { cursor: default; }
   .en-range::-webkit-slider-thumb { transition: background-color var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, border-color var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, box-shadow var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, scale clamp(0ms, var(--en-slider-thumb-release-duration, 80ms), 200ms) ${t('--en-ease-standard')}; }
   .en-range:not(:disabled):active::-webkit-slider-thumb { scale: clamp(.9, var(--en-slider-thumb-pressed-scale, 1), 1.25); transition-duration: var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), clamp(0ms, var(--en-slider-thumb-press-duration, 80ms), 200ms); }
  @media (prefers-reduced-motion: reduce) {  .en-range::-webkit-slider-thumb { scale: none !important; transition: none !important; } }
  :host([data-press=none])  .en-range::-webkit-slider-thumb { scale: none !important; }

   .en-range::-moz-range-thumb { transition: background-color var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, border-color var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, box-shadow var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)) ${t('--en-ease-standard')}, scale clamp(0ms, var(--en-slider-thumb-release-duration, 80ms), 200ms) ${t('--en-ease-standard')}; }
   .en-range:not(:disabled):active::-moz-range-thumb { scale: clamp(.9, var(--en-slider-thumb-pressed-scale, 1), 1.25); transition-duration: var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), var(--en-slider-paint-duration, var(--_en-source-slider-paint-duration, 0ms)), clamp(0ms, var(--en-slider-thumb-press-duration, 80ms), 200ms); }
  @media (prefers-reduced-motion: reduce) {  .en-range::-moz-range-thumb { scale: none !important; transition: none !important; } }
  :host([data-press=none])  .en-range::-moz-range-thumb { scale: none !important; }

`;
