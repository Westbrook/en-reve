import { css, unsafeCSS } from 'lit';
import { contentStyles } from '@en-reve/styles/content.js';
import { tableStyles } from '@en-reve/styles/table.js';
import { radioStyles } from '@en-reve/styles/radio.js';
import { defaultCSSValue } from '@en-reve/tokens/defaults.js';

// Container queries cannot read custom properties; compile their thresholds from
// the same trusted layout defaults used by the other reference workflows.
const pairedFiltersWidth = unsafeCSS(defaultCSSValue('--en-layout-panel-preferred'));
const fullFiltersWidth = unsafeCSS(defaultCSSValue('--en-layout-form-max'));

export const assetsStyles = css`
	${contentStyles}
	${radioStyles}
	${tableStyles}
	.assets-workflow { display:grid; gap:var(--en-space-5, var(--en-space-6)); min-inline-size:0; container:en-assets / inline-size; }
	.assets-workflow * { box-sizing:border-box; }
	.assets-workflow :is(h3,p) { margin:0; }
	.assets-workflow h3 { font:var(--en-font-heading-small-weight) var(--en-font-heading-small-size)/var(--en-font-heading-small-line-height) var(--en-font-heading-small-family); }
	.assets-guide,.assets-selection,.assets-preview,.assets-receipt { display:grid; gap:var(--en-space-3); min-inline-size:0; }
	.assets-preview[hidden] { display:none; }
	.assets-filters { display:grid; grid-template-columns:minmax(0,1fr); column-gap:var(--en-space-4); row-gap:0; }
	/* Share intrinsic label/control/description tracks within each visual row.
	   Empty descriptions collapse instead of mirroring the label's height. */
	.assets-filters > * { display:grid; grid-row:span 3; grid-template-rows:subgrid; row-gap:0; min-inline-size:0; margin-block-start:var(--en-space-4); }
	.assets-filters > :first-child { margin-block-start:0; }
	.assets-filters > :is(en-search-input,en-select,en-segmented-control)::part(field) { display:contents; }
	.assets-filters > :is(en-search-input,en-select,en-segmented-control)::part(label) { grid-row:1; align-self:end; margin:0; padding-block-end:var(--en-field-gap,var(--en-space-label-control)); }
	.assets-filters > :is(en-search-input,en-select)::part(focus-frame),
	.assets-filters > en-segmented-control::part(options),
	.assets-filters > en-button::part(control) { grid-row:2; align-self:center; margin-block:0; }
	.assets-filters > :is(en-search-input,en-select,en-segmented-control)::part(description) { grid-row:3; align-self:start; margin:0; }
	.assets-filters > en-button { justify-self:start; }
	@container en-assets (inline-size >= ${pairedFiltersWidth}) {
		.assets-filters { grid-template-columns:minmax(0,1fr) minmax(0,max-content); }
		.assets-filters > :is(en-search-input,en-button) { grid-column:1 / -1; }
	}
	@container en-assets (inline-size >= calc(2 * ${fullFiltersWidth})) {
		.assets-filters { grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,max-content) minmax(0,max-content); }
		.assets-filters > :is(en-search-input,en-select,en-segmented-control,en-button) { grid-column:auto; margin-block-start:0; }
	}
	.assets-results-heading,.assets-actions { display:flex; gap:var(--en-space-3); align-items:center; flex-wrap:wrap; }
	.assets-results-heading { justify-content:space-between; }
	.assets-results-heading > en-select { margin-inline-start:auto; min-inline-size:0; max-inline-size:100%; }
	.assets-large-review { border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-container); padding:var(--en-space-3); }
	.assets-large-review > summary { cursor:pointer; padding-block:var(--en-space-2); }
	.assets-review-controls { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr)); gap:var(--en-space-3); align-items:end; margin-block:var(--en-space-3); }
	.assets-review-controls en-button { justify-self:start; }
	.assets-table-large::part(viewport) { block-size:26rem; max-block-size:65dvh; overflow:auto; overflow-anchor:none; }
	.assets-table { min-inline-size:var(--en-layout-article-max,var(--en-layout-form-max)); table-layout:fixed; inline-size:100%; }
	.assets-table > tbody > tr[data-selected] > :is(th,td) { background:var(--en-color-action-subtle,var(--en-color-surface-subtle)); }
	.assets-table > tbody > tr > th { min-inline-size:var(--en-layout-panel-preferred); }
	.assets-table .assets-note { font-weight:var(--en-font-body-weight); }
	.assets-table time { white-space:nowrap; }
	.assets-choices { border:0; margin:0; padding:0; min-inline-size:0; }
	.assets-choice { display:flex; align-items:center; gap:var(--en-space-2); min-block-size:var(--en-size-target-min); cursor:pointer; overflow-wrap:anywhere; }
	.assets-card-symbol { display:grid; place-items:center; min-inline-size:0; inline-size:100%; color:inherit; }
	.assets-card-symbol > en-icon { --en-icon-size:calc(2 * var(--en-size-icon)); }
	.assets-card-symbol > .assets-text-symbol { font-size:calc(2 * var(--en-size-icon)); }
	.assets-text-symbol { font:var(--en-font-heading-small-weight) var(--en-font-heading-small-size)/1 var(--en-font-heading-small-family); }
	.assets-preview { padding:var(--en-space-panel); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-container); background:var(--en-color-surface); }
	.assets-preview > en-button { justify-self:start; }
	.assets-preview-content { padding-block:var(--en-space-4); }
	.assets-excerpt { max-inline-size:65ch; white-space:pre-wrap; }
	.assets-selection,.assets-receipt { padding-block-start:var(--en-space-4); border-block-start:var(--en-border-width) solid var(--en-color-boundary); }
	.assets-note { color:var(--en-color-text-muted); font-size:var(--en-font-metadata-size); line-height:var(--en-font-metadata-line-height); }
	.assets-status { min-block-size:1lh; }
	.assets-qa { border-block-start:var(--en-border-width) solid var(--en-color-boundary); padding-block-start:var(--en-space-3); }
	.assets-qa summary { cursor:pointer; padding-block:var(--en-space-2); min-block-size:var(--en-size-target-min); }
	.assets-qa ol { padding-inline-start:var(--en-space-6); }
	.assets-qa li + li { margin-block-start:var(--en-space-3); }
	.assets-workflow :focus-visible:not(.en-radio) { outline:var(--en-focus-width) solid var(--en-color-focus); outline-offset:var(--en-focus-offset); }
	@media (any-pointer:coarse) { .assets-choice,.assets-qa summary { min-block-size:var(--en-size-target-touch); } }
`;
