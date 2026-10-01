import { controlTargetSize } from './internal/target-size.js';
import { css } from 'lit';
import { token as t } from './internal/values.js';
import { controlSurfaceStyles, controlBlockSizeStyles, controlEnvelopeStyles, controlTouchBlockStyles, controlDisabledStyles } from './internal/control-shared.js';
import { focusStylesFor, focusClearance } from './internal/focus-core.js';

/** Shared button/field geometry; container layout is available before hydration. */
export const paginationStyles = css`
	:host { display:block; min-inline-size:0; container:en-pagination / inline-size; }
	.en-pagination {
		display:grid; justify-items:stretch; min-inline-size:0;
		gap:var(--en-pagination-status-gap, ${t('--en-space-1')});
	}
	.en-pagination__actions {
		display:flex; align-items:center; gap:var(--en-pagination-gap, ${t('--en-space-actions')});
		inline-size:100%; justify-content:safe var(--en-pagination-align, center);
		max-inline-size:100%; min-inline-size:0; overflow:auto; box-sizing:border-box; padding:${focusClearance};
	}
	.en-pagination__actions > .en-button { flex:none; }
	.en-pagination__pages {
		display:grid; grid-auto-flow:column; grid-auto-columns:1fr; flex:none; align-items:stretch;
		gap:var(--en-pagination-gap, ${t('--en-space-actions')}); font-variant-numeric:tabular-nums;
		font-weight:${t('--en-font-label-strong-weight')};
	}
	.en-pagination__pages > :is(.en-button, .en-pagination__gap, .en-pagination__intermediate-gap) {
		box-sizing:border-box;
		inline-size:max(var(--en-pagination-page-min-inline-size, var(--en-control-min-size, ${t('--en-size-control-min')})), ${t('--en-size-target-min')}, calc(var(--_en-pagination-digits) + 2 * ${t('--en-space-control-inline')} + 2 * ${t('--en-border-width')}));
		padding-inline:0;
	}
	.en-pagination__status {
		margin:0; font-size:${t('--en-font-data-size')}; line-height:${t('--en-font-data-line-height')};
		color:${t('--en-color-text-muted')}; font-variant-numeric:tabular-nums;
	}
	.en-pagination__intermediate-gap { display:none; place-items:center; color:${t('--en-color-text-muted')}; }
	.en-pagination__intermediate-gap[data-wide-gap] { display:grid; }
	.en-pagination__gap-trigger { display:none; inline-size:100%; padding-inline:0; }
	.en-pagination__intermediate-gap[data-gap-action] > .en-pagination__gap-trigger { display:inline-flex; }
	.en-pagination__intermediate-gap[data-gap-action] > .en-pagination__gap-decoration { display:none; }
	/* A chooser remains a visible native invoker while its popover is open or
	   focus returns to it, even if the container crosses a layout boundary. */
	.en-pagination__intermediate-gap:has(.en-pagination__gap-trigger:is(:focus, [data-jump-invoker])) { display:grid; }
	.en-pagination__intermediate-gap > .en-pagination__gap-trigger:is(:focus, [data-jump-invoker]) { display:inline-flex; }
	.en-pagination__intermediate-gap:has(.en-pagination__gap-trigger:is(:focus, [data-jump-invoker])) > .en-pagination__gap-decoration { display:none; }
	.en-pagination__previous-icon, .en-pagination__next-icon { display:flex; }
	.en-pagination svg.en-icon { display:block; inline-size:var(--en-icon-size, ${t('--en-size-icon')}); block-size:var(--en-icon-size, ${t('--en-size-icon')}); stroke-width:${t('--en-size-icon-stroke')}; }
	.en-pagination__previous-icon { rotate:90deg; }
	.en-pagination__next-icon { rotate:-90deg; }
	.en-pagination__previous-icon:dir(rtl) { rotate:-90deg; }
	.en-pagination__next-icon:dir(rtl) { rotate:90deg; }
	.en-pagination__gap { display:grid; place-items:center; color:${t('--en-color-text-muted')}; }
	.en-pagination .en-button { position:relative; }
	.en-pagination .en-button:focus-visible { z-index:1; }
	.en-pagination__compact-status { display:none; }
	.en-pagination__wide-status { text-align:var(--en-pagination-align, center); }
	.en-pagination__middle { display:flex; align-items:center; gap:var(--en-pagination-gap, ${t('--en-space-actions')}); }
	.en-pagination__direct-trigger { padding-inline:0; min-inline-size:max(var(--en-control-min-size, ${t('--en-size-control-min')}), ${t('--en-size-target-min')}); }
	.en-pagination__direct {
		position:fixed; inset:auto; left:0; top:0; margin:0; row-gap:var(--en-pagination-gap, ${t('--en-space-actions')}); box-sizing:border-box;
		inline-size:min(20rem, calc(100vw - 1rem)); max-block-size:calc(100dvh - 1rem); overflow:auto;
		padding:${t('--en-space-panel')}; border:${t('--en-border-width')} solid ${t('--en-color-boundary')};
		border-radius:${t('--en-radius-container')}; background:${t('--en-color-surface')}; color:${t('--en-color-text')};
	}
	.en-pagination__direct:popover-open:not([data-positioned]) { visibility:hidden; }
	.en-pagination__jump {
		display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, max-content); align-items:center;
		gap:var(--en-pagination-gap, ${t('--en-space-actions')});
	}
	.en-pagination__jump label { grid-column:1 / -1; }
	.en-pagination__jump input { inline-size:100%; grid-column:1 / -1; }
	${controlBlockSizeStyles(css`.en-pagination__jump input`)}
	${controlSurfaceStyles(css`.en-pagination__jump input`)}
	.en-pagination__jump input { font-variant-numeric: tabular-nums; }
	${controlEnvelopeStyles(css`.en-pagination__jump input`)}
	${controlDisabledStyles(css`.en-pagination__jump input:disabled`)}
	${focusStylesFor(css`.en-pagination__jump input`, { family: 'input' })}
	@media (any-pointer:coarse) {
		.en-pagination__pages > :is(.en-button, .en-pagination__gap, .en-pagination__intermediate-gap) { min-inline-size:${controlTargetSize(true)}; }
		${controlTouchBlockStyles(css`.en-pagination__jump input`)}
	}
	@container en-pagination (inline-size >= 44em) {
		.en-pagination__actions:has(.en-pagination__pages[data-omitted]) .en-pagination__middle:not(:has(:is(:focus, [data-jump-invoker]))) { display:none; }
	}
	@container en-pagination (inline-size < 44em) {
		/* Keep one set of numbered buttons. The five reserved cells keep the
		   endpoints stable while absent boundary/current duplicates stay absent. */
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) {
			grid-template-columns:repeat(5, 1fr); grid-auto-flow:row;
		}
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > :is(.en-button:not([data-intermediate-column]), .en-pagination__gap) { display:none; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column] { grid-row:1; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column='1'] { grid-column:1; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column='2'] { grid-column:2; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column='3'] { grid-column:3; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column='4'] { grid-column:4; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > [data-intermediate-column='5'] { grid-column:5; }
		.en-pagination__pages[data-intermediate]:not(:has([data-page]:not([data-intermediate-column]):focus)) > .en-pagination__intermediate-gap { display:grid; place-items:center; color:${t('--en-color-text-muted')}; }
	}
	@container en-pagination (28em <= inline-size < 44em) {
		.en-pagination__actions:has(.en-pagination__pages[data-intermediate]):not(:has([data-page]:not([data-intermediate-column]):focus)) .en-pagination__middle:not(:has(:is(:focus, [data-jump-invoker]))) { display:none; }
	}
	@container en-pagination (inline-size < 28em) {
		.en-pagination { justify-items:stretch; }
		.en-pagination__actions { display:grid; justify-content:normal; grid-template-columns:minmax(0, 1fr) minmax(0, max-content) minmax(0, 1fr); }
		.en-pagination__actions > .en-button { min-inline-size:0; max-inline-size:100%; align-self:stretch; overflow-wrap:anywhere; }
		.en-pagination__actions > [part~="previous"] { justify-self:start; }
		.en-pagination__actions > [part~="next"] { justify-self:end; }
		.en-pagination__pages, .en-pagination__wide-status { display:none; }
		.en-pagination__compact-status { display:block; }
		.en-pagination__middle { min-inline-size:0; }
		.en-pagination__compact-status { text-align:center; overflow-wrap:anywhere; align-self:center; max-inline-size:14ch; }
		/* A resize must not hide the keyboard's current location. Keep this one row
		   scrollable until native focus leaves the numbers, then use compact delivery. */
		.en-pagination__actions:has(.en-pagination__pages:focus-within, .en-pagination__pages [data-jump-invoker]) {
			display:flex; justify-content:safe var(--en-pagination-align, center); overflow:auto;
			padding:${focusClearance}; box-sizing:border-box;
		}
		.en-pagination__pages:is(:focus-within, :has([data-jump-invoker])) { display:grid; }
		.en-pagination__actions:has(.en-pagination__gap-trigger:is(:focus, [data-jump-invoker])) .en-pagination__middle { display:none; }
		.en-pagination__actions:has(.en-pagination__pages:focus-within, .en-pagination__pages [data-jump-invoker]) .en-pagination__compact-status { display:none; }
	.en-pagination__wide-status { text-align:var(--en-pagination-align, center); }
		.en-pagination:has(.en-pagination__pages:focus-within, .en-pagination__pages [data-jump-invoker]) .en-pagination__wide-status { display:block; }
	}
	@media (forced-colors:active) { .en-pagination [aria-current='page'] { outline:1px solid CanvasText; outline-offset:-3px; } }
`;
