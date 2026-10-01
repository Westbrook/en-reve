import { pressStyles } from './internal/press.js';
import { pressRecipes } from './internal/press-recipes.js';
import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
import { focusStylesFor, focusVisibleStylesFor, focusScrollStylesFor } from './internal/focus.js';
import { breadcrumbLayoutStyles } from './internal/breadcrumbs.js';

/** Native, opt-in navigation recipes. Labels, destinations and current state belong to HTML. */
export const navigationStyles = sizedStyles(css`
  .en-section-nav, .en-breadcrumbs, .en-navigation-link, .en-breadcrumbs__label, .en-skip-link {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    font: ${t('--en-font-ui-weight')} ${t('--en-font-ui-size')} / ${t('--en-font-ui-line-height')} ${t('--en-font-ui-family')}; font-style: ${t('--en-font-ui-style')}; letter-spacing: ${t('--en-font-ui-tracking')};
    text-align: start;
    overflow-wrap: anywhere;
  }
  .en-section-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: ${o('--en-navigation-gap', t('--en-space-1'))};
    margin-block: ${t('--en-space-6')};
    padding-block: ${t('--en-space-2')};
    background: ${o('--en-navigation-background', t('--en-color-canvas'))};
    border-block-end: ${t('--en-border-width')} solid ${o('--en-navigation-border-color', t('--en-color-line'))};
  }
  /* Stay in normal flow until a controller or author supplies measured sticky geometry. */
  .en-section-nav--sticky {
    position: var(--en-navigation-position, static);
    inset-block-start: var(--en-navigation-offset, 0px);
    z-index: var(--en-navigation-z-index, 20);
  }
  .en-navigation-link {
    display: inline-flex;
    align-items: center;
    min-inline-size: ${t('--en-size-target-min')};
    min-block-size: ${t('--en-size-target-min')};
    color: ${o('--en-navigation-color', t('--en-color-text-muted'))};
    text-decoration: underline;
    text-underline-offset: ${t('--en-border-width')};
  }
  .en-navigation-link[aria-current]:not([aria-current='false']) {
    color: ${o('--en-navigation-current-color', o('--en-navigation-active-color', t('--en-color-text')))};
  }
  @media (hover: hover) { .en-navigation-link:hover {
    color: ${o('--en-navigation-hover-color', o('--en-navigation-active-color', t('--en-color-text')))};
  } }
  .en-navigation-link[aria-current]:not([aria-current='false']), .en-breadcrumbs__label[aria-current]:not([aria-current='false']) {
    font-weight: ${t('--en-font-label-strong-weight')};
  }
  .en-section-nav .en-navigation-link {
    min-block-size: ${controlTargetSize()};
    padding-block: ${t('--en-space-2')};
    padding-inline: ${t('--en-space-control-inline')};
    border-radius: ${o('--en-navigation-link-radius', t('--en-radius-pill'))};
    text-decoration: none;
  }
  .en-section-nav .en-navigation-link[aria-current]:not([aria-current='false']) {
    background: ${o('--en-navigation-current-background', o('--en-navigation-active-background', t('--en-color-surface-subtle')))};
  }
  @media (hover: hover) { .en-section-nav .en-navigation-link:hover {
    background: ${o('--en-navigation-hover-background', o('--en-navigation-active-background', t('--en-color-surface-subtle')))};
  } }
  ${breadcrumbLayoutStyles}
  .en-breadcrumbs { color: ${o('--en-navigation-color', t('--en-color-text-muted'))}; }
  .en-breadcrumbs__list { gap: ${o('--en-navigation-gap', t('--en-space-2'))}; }
  .en-breadcrumbs__item { max-inline-size: 100%; gap: ${o('--en-navigation-gap', t('--en-space-2'))}; }
  .en-breadcrumbs__label { color: ${o('--en-navigation-hover-color', o('--en-navigation-active-color', t('--en-color-text')))}; }
  .en-breadcrumbs__separator { flex: none; color: ${t('--en-color-text-muted')}; }
  .en-navigation-target {
    scroll-margin-block-start: calc(var(--en-navigation-height, 0px) + var(--en-navigation-offset, 0px) + ${t('--en-space-6')});
  }
  .en-skip-link {
    position: fixed;
    inset-block-start: ${t('--en-space-3')};
    inset-inline-start: ${t('--en-space-3')};
    z-index: calc(var(--en-navigation-z-index, 20) + 1);
    max-inline-size: calc(100% - 2 * ${t('--en-space-3')});
    min-inline-size: ${t('--en-size-target-min')};
    min-block-size: ${t('--en-size-target-min')};
    padding: ${t('--en-space-3')};
    border: ${t('--en-border-width')} solid ${t('--en-color-boundary')};
    border-radius: ${t('--en-radius-control')};
    background: ${t('--en-color-surface')};
    color: ${t('--en-color-text')};
    text-decoration: underline;
    text-underline-offset: ${t('--en-border-width')};
    transform: translateY(calc(-100% - 2 * ${t('--en-space-3')}));
    transition: none;
  }
  .en-skip-link:focus { transform: none; }
  ${pressStyles(css`:is(.en-navigation-link, summary)`, css`:is(.en-navigation-link, summary):not([aria-disabled='true']):not([data-press='none']):active`, pressRecipes.navigation)}
  ${pressStyles(css`::slotted(a[href])`, css`::slotted(a[href]:not([aria-disabled='true']):not([data-press='none']):active)`, pressRecipes.navigation)}
  ${focusStylesFor(css`:where(.en-navigation-link, .en-skip-link)`)}
  @media (any-pointer: coarse) {
    .en-navigation-link, .en-skip-link {
      min-inline-size: ${controlTargetSize(true, t('--en-size-target-min'))};
      min-block-size: ${controlTargetSize(true, t('--en-size-target-min'))};
    }
    .en-section-nav .en-navigation-link { min-block-size: ${controlTargetSize(true)}; }
  }
  @media (prefers-reduced-motion: reduce) {
    .en-skip-link { transition: none; animation: none; }
  }

  .en-navigation-link[aria-current]:not([aria-current='false']), ::slotted(a[aria-current]:not([aria-current='false'])) {
    border-inline-start: var(--en-navigation-current-indicator-width, 0px) solid var(--en-navigation-current-indicator-color, ${t('--en-color-action')});
  }
  .en-navigation-link:not([aria-disabled='true']):active, .en-section-nav .en-navigation-link:not([aria-disabled='true']):active, ::slotted(a[href]:not([aria-disabled='true']):active), summary:not([aria-disabled='true']):active {
    background: var(--en-navigation-pressed-background, ${t('--en-color-accent-subtle')});
  }
  @media (forced-colors: active) {
    .en-section-nav { background: Canvas; border-color: CanvasText; }
    .en-navigation-link { color: LinkText; }
    .en-navigation-link[aria-current]:not([aria-current='false']) { color: LinkText; }
  @media (hover: hover) { .en-navigation-link:hover { color: LinkText; } }
    .en-section-nav .en-navigation-link[aria-current]:not([aria-current='false']) { background: Highlight; color: HighlightText; }
  @media (hover: hover) { .en-section-nav .en-navigation-link:hover { background: Highlight; color: HighlightText; } }
    .en-breadcrumbs, .en-breadcrumbs__label, .en-breadcrumbs__separator { color: CanvasText; }
    .en-skip-link { background: Canvas; color: LinkText; border-color: CanvasText; }
  }
`);

/** Host layout and authored links for en-navigation; excluded from native navigation.css. */
export const navigationHostStyles = css`
  :host { margin-block: ${t('--en-space-6')}; }
  .en-section-nav { margin-block: 0; }
  .en-section-nav > slot:not([hidden]) { display: contents; }
  :host([sticky]) {
    position: var(--en-navigation-position, static);
    inset-block-start: var(--en-navigation-offset, 0px);
    z-index: var(--en-navigation-z-index, 20);
  }
  ::slotted(a) {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    font: inherit;
    text-align: start;
    overflow-wrap: anywhere;
    color: ${o('--en-navigation-color', t('--en-color-text-muted'))};
  }
  ::slotted(a[href]:not([hidden])) {
    /* Preserve authored inline phrasing and spaces while centering a single line. */
    display: inline-block;
    min-inline-size: ${t('--en-size-target-min')};
    min-block-size: ${controlTargetSize()};
    padding-block: max(${t('--en-space-2')}, calc((${controlTargetSize()} - 1lh) / 2));
    padding-inline: ${t('--en-space-control-inline')};
    border-radius: ${o('--en-navigation-link-radius', t('--en-radius-pill'))};
    text-decoration: none;
  }
  ::slotted(a:not([href])), ::slotted(a[href][aria-current]:not([aria-current='false'])) {
    color: ${o('--en-navigation-current-color', o('--en-navigation-active-color', t('--en-color-text')))};
  }
  @media (hover: hover) { ::slotted(a[href]:hover) {
    color: ${o('--en-navigation-hover-color', o('--en-navigation-active-color', t('--en-color-text')))};
  } }
  ::slotted(a[href][aria-current]:not([aria-current='false'])) {
    background: ${o('--en-navigation-current-background', o('--en-navigation-active-background', t('--en-color-surface-subtle')))};
  }
  @media (hover: hover) { ::slotted(a[href]:hover) {
    background: ${o('--en-navigation-hover-background', o('--en-navigation-active-background', t('--en-color-surface-subtle')))};
  } }
  ::slotted(a[aria-current]:not([aria-current='false'])) {
    font-weight: ${t('--en-font-label-strong-weight')};
  }
  ${pressStyles(css`:is(.en-navigation-link, summary)`, css`:is(.en-navigation-link, summary):not([aria-disabled='true']):not([data-press='none']):active`, pressRecipes.navigation)}
  ${pressStyles(css`::slotted(a[href])`, css`::slotted(a[href]:not([aria-disabled='true']):not([data-press='none']):active)`, pressRecipes.navigation)}
  ${focusScrollStylesFor(css`::slotted(a[href])`)}
  ${focusVisibleStylesFor(css`::slotted(a[href]:focus-visible)`)}
  @media (any-pointer: coarse) {
    ::slotted(a[href]:not([hidden])) {
      min-inline-size: ${controlTargetSize(true, t('--en-size-target-min'))};
      min-block-size: ${controlTargetSize(true)};
      padding-block: max(${t('--en-space-2')}, calc((${controlTargetSize(true)} - 1lh) / 2));
    }
  }

  .en-navigation-link[aria-current]:not([aria-current='false']), ::slotted(a[aria-current]:not([aria-current='false'])) {
    border-inline-start: var(--en-navigation-current-indicator-width, 0px) solid var(--en-navigation-current-indicator-color, ${t('--en-color-action')});
  }
  .en-navigation-link:not([aria-disabled='true']):active, .en-section-nav .en-navigation-link:not([aria-disabled='true']):active, ::slotted(a[href]:not([aria-disabled='true']):active), summary:not([aria-disabled='true']):active {
    background: var(--en-navigation-pressed-background, ${t('--en-color-accent-subtle')});
  }
  @media (forced-colors: active) {
    ::slotted(a[href]) { color: LinkText; }
    ::slotted(a:not([href])) { color: CanvasText; }
    ::slotted(a[href][aria-current]:not([aria-current='false'])) {
      background: Highlight;
      color: HighlightText;
    }
  @media (hover: hover) { ::slotted(a[href]:hover) {
      background: Highlight;
      color: HighlightText;
    } }
  }
`;

/** Native disclosure chrome shared by sidebar navigation and its authored groups. */
export const navigationDisclosureStyles = css`
  :host([layout='sidebar']), :host(en-navigation-group) { margin: 0; }
  :host([layout='sidebar']) .en-section-nav {
    display: grid;
    align-items: stretch;
    gap: ${o('--en-navigation-gap', t('--en-space-1'))};
    border: 0;
    padding: 0;
    background: transparent;
  }
  :host([layout='sidebar']) ::slotted(a[href]), :host(en-navigation-group) ::slotted(a[href]) {
    display: block;
    inline-size: 100%;
    border-radius: ${o('--en-navigation-link-radius', t('--en-radius-control'))};
  }
  details, .group-content { min-inline-size: 0; }
  /* Explicit display rules otherwise override closed-details content in WebKit. */
  details:not([open]) > :not(summary) { display: none !important; }
  summary {
    box-sizing: border-box;
    cursor: pointer;
    overflow-wrap: anywhere;
    min-block-size: ${controlTargetSize()};
    padding: ${t('--en-space-2')} ${t('--en-space-control-inline')};
    border-radius: ${o('--en-navigation-link-radius', t('--en-radius-control'))};
    color: ${o('--en-navigation-color', t('--en-color-text-muted'))};
    font-weight: ${t('--en-font-label-strong-weight')};
  }
  summary[hidden] { display: none; }
  .group-content {
    display: grid;
    gap: ${o('--en-navigation-gap', t('--en-space-1'))};
    margin-inline-start: ${o('--en-navigation-indent', t('--en-space-4'))};
    border-inline-start: ${t('--en-border-width')} solid ${o('--en-navigation-border-color', t('--en-color-line'))};
    padding-inline-start: ${t('--en-space-1')};
  }
  .group-content > slot { display: contents; }
  @media (hover: hover) {
    summary:hover {
      color: ${o('--en-navigation-hover-color', o('--en-navigation-active-color', t('--en-color-text')))};
      background: ${o('--en-navigation-hover-background', o('--en-navigation-active-background', t('--en-color-surface-subtle')))};
    }
  }
  ${pressStyles(css`:is(.en-navigation-link, summary)`, css`:is(.en-navigation-link, summary):not([aria-disabled='true']):not([data-press='none']):active`, pressRecipes.navigation)}
  ${pressStyles(css`::slotted(a[href])`, css`::slotted(a[href]:not([aria-disabled='true']):not([data-press='none']):active)`, pressRecipes.navigation)}
  ${focusScrollStylesFor(css`summary`)}
  ${focusVisibleStylesFor(css`summary:focus-visible`)}
  @media (any-pointer: coarse) { summary { min-block-size: ${controlTargetSize(true)}; } }
  @media (forced-colors: active) { summary { color: ButtonText; } .group-content { border-color: CanvasText; } }
`;

/** Direct light-DOM breadcrumb content; intentionally excluded from navigation.css. */
export const breadcrumbHostStyles = css`
  ::slotted(a), ::slotted(span) {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    font: inherit;
    text-align: start;
    overflow-wrap: anywhere;
  }
  ::slotted(a[href]:not([hidden])) {
    /* Keep authored phrasing in an inline formatting context, including its spaces. */
    display: inline-block;
    min-inline-size: ${t('--en-size-target-min')};
    min-block-size: ${t('--en-size-target-min')};
    padding-block: max(0px, calc((${t('--en-size-target-min')} - 1lh) / 2));
    color: ${o('--en-navigation-color', t('--en-color-text-muted'))};
    text-decoration: underline;
    text-underline-offset: ${t('--en-border-width')};
  }
  ::slotted(span), ::slotted(a:not([href])), ::slotted(a[href][aria-current]:not([aria-current='false'])) {
    color: ${o('--en-navigation-current-color', o('--en-navigation-active-color', t('--en-color-text')))};
  }
  @media (hover: hover) { ::slotted(a[href]:hover) {
    color: ${o('--en-navigation-hover-color', o('--en-navigation-active-color', t('--en-color-text')))};
  } }
  ::slotted(a[aria-current]:not([aria-current='false'])),
  ::slotted(span[aria-current]:not([aria-current='false'])) {
    font-weight: ${t('--en-font-label-strong-weight')};
  }
  ::slotted([hidden]:not([hidden='until-found' i])),
  .en-breadcrumbs__item[hidden], .en-breadcrumbs__diagnostic[hidden] {
    display: none !important;
  }
  ${focusScrollStylesFor(css`::slotted(a[href])`)}
  ${focusVisibleStylesFor(css`::slotted(a[href]:focus-visible)`)}
  @media (any-pointer: coarse) {
    ::slotted(a[href]:not([hidden])) {
      min-inline-size: ${controlTargetSize(true, t('--en-size-target-min'))};
      min-block-size: ${controlTargetSize(true, t('--en-size-target-min'))};
      padding-block: max(0px, calc((${controlTargetSize(true, t('--en-size-target-min'))} - 1lh) / 2));
    }
  }
  @media (forced-colors: active) {
    ::slotted(a[href]), ::slotted(a[href][aria-current]:not([aria-current='false'])) { color: LinkText; }
  @media (hover: hover) { ::slotted(a[href]:hover) { color: LinkText; } }
    ::slotted(span), ::slotted(a:not([href])) { color: CanvasText; }
  }
`;
