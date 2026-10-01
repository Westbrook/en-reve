import { pressStyles } from './internal/press.js';
import { pressRecipes } from './internal/press-recipes.js';
import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { optionPaint } from './internal/option-paint.js';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
import { focusVisibleStylesFor, focusScrollStylesFor } from './internal/focus-core.js';
export const calendarStyles = sizedStyles(css`
  :host { min-inline-size: 0; }
  .en-calendar { --_en-calendar-target:${controlTargetSize(false, t('--en-size-target-min'))}; overflow-x:auto; inline-size: var(--en-calendar-inline-size, 22rem); max-inline-size: 100%; color: ${t('--en-color-text')}; }
  .en-calendar-header { display:flex; align-items:center; justify-content:space-between; gap:${t('--en-space-2')}; margin-block-end:${t('--en-space-2')}; }
  [part=heading] { text-align:center; font-weight:${t('--en-font-label-strong-weight')}; }
  :host(:dir(rtl)) [slot=prefix] { transform:rotate(180deg); }
  table { border-collapse:separate; border-spacing:0 var(--en-calendar-gap, 2px); table-layout:fixed; inline-size:100%; min-inline-size:calc(7 * (var(--_en-calendar-target) + var(--en-calendar-gap, 2px))); }
  th { font-size:.875em; font-weight:500; color:${t('--en-color-text-muted')}; }
  th, td { text-align:center; padding-inline:0; }
  th:first-child, td:first-child { text-align:start; }
  th:last-child, td:last-child { text-align:end; }
  td { padding-block:0; position:relative; --_en-calendar-day-width:max(var(--_en-calendar-target), min(calc(100% - var(--en-calendar-gap, 2px)), max(var(--en-calendar-day-size, 2.5rem), var(--_en-calendar-target)))); }
  [part~=range-band] { position:absolute; inset:0; pointer-events:none; background:var(--en-calendar-range-background, ${t('--en-color-selected')}); }
  [part~=range-band-preview] { background:var(--en-calendar-range-preview-background, color-mix(in srgb,currentColor 10%,transparent)); }
  [part~=range-band-start] { inset-inline-start:calc((100% - var(--_en-calendar-day-width)) / 2); border-start-start-radius:var(--en-calendar-day-radius,var(--en-radius-control)); border-end-start-radius:var(--en-calendar-day-radius,var(--en-radius-control)); }
  [part~=range-band-end] { inset-inline-end:calc((100% - var(--_en-calendar-day-width)) / 2); border-start-end-radius:var(--en-calendar-day-radius,var(--en-radius-control)); border-end-end-radius:var(--en-calendar-day-radius,var(--en-radius-control)); }
  td:first-child [part~=range-band-start] { inset-inline-start:0; }
  td:last-child [part~=range-band-end] { inset-inline-end:0; }
  td:last-child [part~=range-band-start] { inset-inline-start:calc(100% - var(--_en-calendar-day-width)); }
  td:first-child [part~=range-band-end] { inset-inline-end:calc(100% - var(--_en-calendar-day-width)); }

  .en-calendar-weekday, .en-calendar-day { display:inline-flex; align-items:center; justify-content:center; vertical-align:middle; inline-size:min(calc(100% - var(--en-calendar-gap, 2px)), max(var(--en-calendar-day-size, 2.5rem), var(--_en-calendar-target))); min-inline-size:var(--_en-calendar-target); }
  .en-calendar-day { position:relative; font:inherit; font-variant-numeric:tabular-nums; color:${o('--en-option-rest-color', o('--en-option-color', css`inherit`))}; aspect-ratio:1; padding:0; border:1px solid transparent; border-radius:var(--en-calendar-day-radius, ${o('--en-option-radius', t('--en-radius-control'))}); background-color:${o('--en-option-rest-background', o('--en-option-background', css`transparent`))}; --_en-calendar-tint:none; background-image:var(--_en-calendar-tint); cursor:pointer; box-sizing:border-box; }
  .en-calendar-day[data-outside] { color:${t('--en-color-text-muted')}; }
  @media (hover: hover) { .en-calendar-day:hover:not([aria-disabled=true]):not(:disabled) { --_en-calendar-tint:linear-gradient(color-mix(in srgb, currentColor calc(clamp(0, ${t('--en-calendar-hover-opacity')}, 1) * 100%), transparent), color-mix(in srgb, currentColor calc(clamp(0, ${t('--en-calendar-hover-opacity')}, 1) * 100%), transparent)); } }
  @media (hover: hover) { td:not([aria-selected=true]) .en-calendar-day:hover:not([aria-disabled=true]):not(:disabled) { background-color:${o('--en-option-hover-background', o('--en-option-rest-background', o('--en-option-background', css`transparent`)))}; color:var(--en-option-hover-color, var(--en-option-color, inherit)); } }
  td[aria-selected=true] .en-calendar-day { background-color:${o('--en-option-selected-background', t('--en-color-selected'))}; color:${o('--en-option-selected-color', t('--en-color-action-text'))}; }
  td .en-calendar-day[part~=in-range] { background-color:transparent; color:${o('--en-option-selected-color', t('--en-color-action-text'))}; }
  td .en-calendar-day[part~=range-start], td .en-calendar-day[part~=range-end] { background-color:var(--en-calendar-range-endpoint-background, transparent); color:${o('--en-option-selected-color', t('--en-color-action-text'))}; border:2px solid var(--en-option-selected-color,var(--en-color-action-text)); border-radius:var(--en-calendar-day-radius,var(--en-radius-control)); }
  td .en-calendar-day[part~=preview]:not([part~=range-start]):not([part~=range-end]) { background-color:transparent; }
  [part=range-status] { min-block-size:2.5em; font-size:.875em; margin-block-start:var(--en-space-2); }
  ${pressStyles(css`.en-calendar-day`, css`.en-calendar:not([data-selection=range]) .en-calendar-day:not(:disabled):not([aria-disabled='true']):not([data-press='none']):active`, pressRecipes['calendar'])}
  @media (forced-colors:active) { [part~=range-band] { background:Highlight; opacity:.25; forced-color-adjust:none; } td .en-calendar-day[part~=in-range] { border:1px solid Highlight; } td .en-calendar-day[part~=preview]:not([part~=range-start]):not([part~=range-end]) { border:1px dashed Highlight; } td .en-calendar-day[part~=range-start], td .en-calendar-day[part~=range-end] { border:2px solid Highlight; } }
  .en-calendar-day:focus { z-index:1; }
  .en-calendar-day:active:not([aria-disabled=true]):not(:disabled) { --_en-calendar-tint:linear-gradient(color-mix(in srgb, currentColor calc(clamp(0, ${t('--en-calendar-pressed-opacity')}, 1) * 100%), transparent), color-mix(in srgb, currentColor calc(clamp(0, ${t('--en-calendar-pressed-opacity')}, 1) * 100%), transparent)); }
  .en-calendar-day[aria-current=date] { border-color:currentColor; }
  .en-calendar-day[aria-disabled=true], .en-calendar-day:disabled { opacity:.45; cursor:default; }
  ${optionPaint({
    motion: false, base:css`.en-calendar:not([data-selection=range]) .en-calendar-day`,
    selected:css`.en-calendar:not([data-selection=range]) td[aria-selected=true] .en-calendar-day`,
    hover:css`.en-calendar:not([data-selection=range]) .en-calendar-day:hover:not([aria-disabled=true]):not(:disabled)`,
    pressed:css`.en-calendar:not([data-selection=range]) .en-calendar-day:active:not([aria-disabled=true]):not(:disabled)`,
    disabled:css`.en-calendar:not([data-selection=range]) .en-calendar-day:is([aria-disabled=true],:disabled)`,
    restBackground:css`transparent`,restColor:css`var(--_en-calendar-rest-color,inherit)`,
    selectedColor:t('--en-color-action-text'),hoverBackground:css`var(--_en-option-selected-background,transparent)`,
  })}
  .en-calendar:not([data-selection=range]) .en-calendar-day { --_en-calendar-rest-color:inherit; background-image:var(--_en-calendar-tint); }
  .en-calendar:not([data-selection=range]) .en-calendar-day[data-outside] { --_en-calendar-rest-color:${t('--en-color-text-muted')}; }
  ${focusVisibleStylesFor(css`.en-calendar-day:focus-visible`, { family:'option', inset:true, restSelector:css`.en-calendar-day` })}
  ${focusScrollStylesFor(css`.en-calendar-day`, { family:'option', inset:true })}
  @media (any-pointer:coarse) { .en-calendar { --_en-calendar-target:${controlTargetSize(true, t('--en-size-target-min'))}; } }
  @media (forced-colors:active) { .en-calendar-day { background-image:none; } @media (hover: hover) { .en-calendar-day:hover:not([aria-disabled=true]):not(:disabled) { border-color:Highlight; } } td[aria-selected=true] .en-calendar-day { background:Highlight; color:HighlightText; } td[aria-selected=true] .en-calendar-day:is([part~=range-start], [part~=range-end], [part~=in-range]) { background:transparent; color:CanvasText; forced-color-adjust:none; } .en-calendar-day[aria-disabled=true] { color:GrayText; opacity:1; } }
  @media (forced-colors:active) {
    .en-calendar:not([data-selection=range]) .en-calendar-day { background:Canvas; color:CanvasText; }
    .en-calendar:not([data-selection=range]) td[aria-selected=true] .en-calendar-day { background:Highlight; color:HighlightText; }
    .en-calendar:not([data-selection=range]) .en-calendar-day:is([aria-disabled=true],:disabled) { background:Canvas; color:GrayText; opacity:1; }
  }
`);
