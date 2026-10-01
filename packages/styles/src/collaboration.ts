import { css } from 'lit';
import { focusStylesFor } from './internal/focus-core.js';
import { sizedStyles } from './internal/sizing.js';
import { token as t, override as o } from './internal/values.js';
export const collaborationStyles = sizedStyles(css`
 :host{min-inline-size:0}
 .sr-only{position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
 :host([hidden]),:host([data-en-presence-overflow]){display:none!important}
 .presence{display:flex;align-items:center;gap:${o('--en-presence-gap',t('--en-space-2'))};padding:${o('--en-presence-padding',t('--en-space-2'))};border:${t('--en-border-width')} solid ${o('--en-presence-border-color',t('--en-color-line'))};border-radius:${o('--en-presence-radius',t('--en-radius-container'))};background:${o('--en-presence-background',t('--en-color-surface'))};color:${t('--en-color-text')};min-inline-size:0}
 a.presence{text-decoration:none;position:relative}
 a.presence .name{color:${t('--en-color-link')}}
 a.presence:focus-visible{z-index:1}
 ${focusStylesFor(css`a.presence`)}
 @media (hover: hover){a.presence:hover{background:${o('--en-presence-hover-background',t('--en-color-surface-subtle'))};border-color:${o('--en-presence-hover-border-color',t('--en-color-link'))}}}
 .identity{min-inline-size:0;overflow-wrap:anywhere}.name{font-weight:${t('--en-font-label-strong-weight')}}
 .status{display:flex;align-items:center;gap:${t('--en-space-1')};font-size:.875em;color:${t('--en-color-text-muted')}}
 .dot{inline-size:.6em;block-size:.6em;border:1px solid currentColor;border-radius:50%;background:currentColor;flex:none}
 .status[data-status=online]{color:${o('--en-presence-online-color',t('--en-color-success-text'))}}
 .status[data-status=busy]{color:${o('--en-presence-busy-color',t('--en-color-danger-text'))}}
 .status[data-status=away] .dot{border-radius:2px;background:transparent}
 .status[data-status=offline] .dot{background:transparent}
 .members{display:flex;align-items:center;flex-wrap:wrap;gap:${o('--en-presence-group-gap',t('--en-space-2'))}}
 .members>slot{display:contents}.members>slot::slotted(en-presence){max-inline-size:100%}
 .feed{display:grid;gap:${o('--en-activity-gap',t('--en-space-3'))};color:${t('--en-color-text')}}
 .list{display:grid;gap:${o('--en-activity-gap',t('--en-space-3'))}}
 .list>slot{display:contents}
 .history-viewport{min-inline-size:0}
 .history-viewport[data-virtual]{overflow-anchor:none;block-size:var(--en-activity-viewport-size,28rem);overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
 .history-list{display:block;min-inline-size:0}
 .history-row{padding-block-end:${o('--en-activity-gap',t('--en-space-3'))};overflow-anchor:none;min-inline-size:0}
 .history-group{font-size:1em;margin:0;padding-block:${t('--en-space-2')};font-weight:${t('--en-font-label-strong-weight')}}
 .history-context{font-weight:${t('--en-font-label-strong-weight')}}
 .history-pagination{display:flex;flex-wrap:wrap;align-items:center;gap:${t('--en-space-2')}}
 .history-error{margin:0;color:${t('--en-color-danger-text')}}
 ${focusStylesFor(css`.history-viewport`)}
 .item{padding:${o('--en-activity-padding',t('--en-space-4'))};border:${t('--en-border-width')} solid ${o('--en-activity-border-color',t('--en-color-line'))};border-radius:${o('--en-activity-radius',t('--en-radius-container'))};background:${o('--en-activity-background',t('--en-color-surface'))};color:${t('--en-color-text')};overflow-wrap:anywhere}
 .item header{display:flex;flex-wrap:wrap;align-items:center;gap:${t('--en-space-2')}}
 .author{font-weight:${t('--en-font-label-strong-weight')}}time{color:${t('--en-color-text-muted')};font-size:.875em}
 .body{margin-block-start:${t('--en-space-2')}}
 .extra{display:contents}.extra>slot{display:contents}
 .extra>slot::slotted(*){margin-block-start:${t('--en-space-2')}}
 .announcement{margin:0;color:${t('--en-color-text-muted')};min-block-size:1.5em}
 [hidden]{display:none!important}
 @media(forced-colors:active){a.presence .name{color:LinkText}a.presence{border-color:LinkText}.presence,.item{background:Canvas;color:CanvasText;border-color:CanvasText}.status{color:CanvasText}.dot{forced-color-adjust:none;background:CanvasText;border-color:CanvasText}}
`);
