import { css } from 'lit';
import { token as t, override as o } from './internal/values.js';
import { sizedStyles } from './internal/sizing.js';
import { focusStylesFor } from './internal/focus.js';

/** Encapsulated scroll shell. Native authored cells are styled separately in their own root. */
export const tableHostStyles = sizedStyles(css`
	:host {
		display: block;
		min-inline-size: 0;
		--_en-table-font-size: ${t('--en-font-data-size')};
		--_en-table-cell-padding-block: ${t('--en-space-rows')};
		--_en-table-cell-padding-inline: ${t('--en-space-control-inline')};
	}
	.en-table {
		min-inline-size: 0;
		border: ${t('--en-border-width')} solid ${o('--en-table-border-color', t('--en-color-line'))};
		border-radius: ${o('--en-table-radius', t('--en-radius-container'))};
		background: ${o('--en-table-background', t('--en-color-surface'))};
		color: ${o('--en-table-color', t('--en-color-text'))};
	}
	.en-table__viewport {
		position: relative;
		min-inline-size: 0;
		max-inline-size: 100%;
		overflow: auto;
		border-radius: inherit;
		scroll-padding-block-start: calc(var(--_en-table-sticky-start, 0px) + ${t('--en-focus-scroll-margin-block')});
		scroll-padding-block-end: calc(var(--_en-table-sticky-end, 0px) + ${t('--en-focus-scroll-margin-block')});
	}
	@media print {
		.en-table__viewport { overflow: visible; max-block-size: none !important; }
	}
	${focusStylesFor(css`.en-table__viewport`)}
	@media (forced-colors: active) {
		.en-table { border-color: CanvasText; background: Canvas; color: CanvasText; }
	}
`);

/** Opt-in authored native-table styling. Include in the same Document/ShadowRoot as en-table. */
export const tableStyles = sizedStyles(css`
	:where(en-table > table) {
		box-sizing: border-box;
		inline-size: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-family: ${t('--en-font-data-family')};
		font-weight: ${t('--en-font-data-weight')};
		font-size: var(--_en-table-font-size, ${t('--en-font-data-size')});
		line-height: ${t('--en-font-data-line-height')};
		background: ${o('--en-table-background', t('--en-color-surface'))};
		color: ${o('--en-table-color', t('--en-color-text'))};
	}
	:where(en-table > table > caption) {
		padding: ${o('--en-table-cell-block-padding', css`var(--_en-table-cell-padding-block, ${t('--en-space-rows')})`)} ${o('--en-table-cell-inline-padding', css`var(--_en-table-cell-padding-inline, ${t('--en-space-control-inline')})`)};
		text-align: start;
		font-weight: ${t('--en-font-label-strong-weight')};
	}
	:where(en-table > table > :is(thead, tbody, tfoot) > tr > :is(th, td), en-table > table > tr > :is(th, td)) {
		box-sizing: border-box;
		padding: ${o('--en-table-cell-block-padding', css`var(--_en-table-cell-padding-block, ${t('--en-space-rows')})`)} ${o('--en-table-cell-inline-padding', css`var(--_en-table-cell-padding-inline, ${t('--en-space-control-inline')})`)};
		border-block-start: ${t('--en-border-width')} solid ${o('--en-table-border-color', t('--en-color-line'))};
		text-align: start;
		vertical-align: middle;
	}
	/* The data facade marks its generated leading selection cells explicitly. */
	:where(en-table[data-en-sticky-selection] > table > :is(thead, tbody) > tr > .en-table-selection) {
		position: sticky;
		inset-inline-start: 0;
		z-index: 1;
		background: ${o('--en-table-background', t('--en-color-surface'))};
	}
	:where(en-table[data-en-sticky-selection] > table > :is(thead, tbody) > tr > .en-table-selection)::before {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline-end: 0;
		inline-size: ${t('--en-border-width')};
		background: ${o('--en-table-border-color', t('--en-color-line'))};
		pointer-events: none;
	}
	:where(en-table > table > thead > tr > th) {
		background: ${o('--en-table-header-background', t('--en-color-surface-subtle'))};
		color: ${o('--en-table-header-color', t('--en-color-text'))};
		font-weight: ${t('--en-font-label-strong-weight')};
	}
	/* Sticky row groups retain multi-row header geometry and native table semantics. */
	:where(en-table:not([sticky="none"]):not([sticky="footer"]):not([data-en-table-scroll-header]) > table > thead) {
		position: sticky;
		inset-block-start: var(--_en-table-sticky-caption-height, 0px);
		z-index: 2;
		background: ${o('--en-table-header-background', t('--en-color-surface-subtle'))};
	}
	:where(en-table:is([sticky="footer"], [sticky="both"]):not([data-en-table-scroll-footer]) > table > tfoot) {
		position: sticky;
		inset-block-end: 0;
		z-index: 2;
		background: ${o('--en-table-footer-background', o('--en-table-background', t('--en-color-surface')))};
		color: ${o('--en-table-footer-color', o('--en-table-color', t('--en-color-text')))};
	}
	/* Before measurement the caption scrolls normally, preventing SSR overlap. */
	:where(en-table[sticky-caption][data-en-sticky-caption-ready] > table > caption) {
		position: sticky;
		inset-block-start: 0;
		z-index: 3;
		background: ${o('--en-table-background', t('--en-color-surface'))};
	}
	:where(en-table > table > :is(thead, tfoot):focus-within) { z-index: 4; }
	@media print {
		:where(en-table > table > :is(thead, tfoot, caption)) { position: static !important; }
		:where(en-table[data-en-sticky-selection] > table > :is(thead, tbody) > tr > .en-table-selection) { position: static !important; }
		:where(en-table[data-en-sticky-selection] > table > :is(thead, tbody) > tr > .en-table-selection)::before,
		:where(en-table > table > tbody > tr[data-selected] > :is(th, td):first-child)::after { display: none; }
	}
	:where(en-table > table > tbody > tr > th) { font-weight: ${t('--en-font-label-strong-weight')}; }
	@media (hover: hover) {
		:where(en-table > table > tbody > tr:hover > :is(th, td)) {
			background: ${o('--en-table-row-hover-background', t('--en-color-surface-subtle'))};
		}
	}
	/* Selected paint takes precedence over hover and never changes row geometry. */
	:where(en-table > table > tbody > tr[data-selected] > :is(th, td)) {
		background: ${o('--en-table-row-selected-background', t('--en-color-selected'))};
		color: ${o('--en-table-row-selected-color', t('--en-color-text'))};
	}
	:where(en-table > table > tbody > tr[data-selected] > :is(th, td):first-child:not(.en-table-selection)) { position: relative; }
	:where(en-table > table > tbody > tr[data-selected] > :is(th, td):first-child)::after {
		content: '';
		position: absolute;
		inset-inline-start: 0;
		inset-block: 0;
		inline-size: 3px;
		background: ${o('--en-table-row-selected-indicator-color', t('--en-color-action'))};
		pointer-events: none;
	}
	:where(en-table:not([data-en-sticky-selection]) > table > tbody > tr[data-selected] > .en-table-selection:first-child) { position: relative; }
	@media (forced-colors: active) {
		:where(en-table > table), :where(en-table > table > :is(thead, tfoot, caption)), :where(en-table > table > thead > tr > th) { background: Canvas; color: CanvasText; }
		:where(en-table > table > :is(thead, tbody, tfoot) > tr > :is(th, td)) { border-color: CanvasText; }
		:where(en-table[data-en-sticky-selection] > table > tbody > tr > .en-table-selection) { background: Canvas; }
		:where(en-table[data-en-sticky-selection] > table > :is(thead, tbody) > tr > .en-table-selection)::before { background: CanvasText; }
		:where(en-table > table > tbody > tr[data-selected] > :is(th, td)) { background: Highlight; color: HighlightText; }
		:where(en-table > table > tbody > tr[data-selected] > :is(th, td):first-child)::after { background: HighlightText; }
	}
`);
