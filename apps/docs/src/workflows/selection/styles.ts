import { css } from 'lit';

/** Only the application composition is styled here; all control surfaces remain library-owned. */
export const selectionStyles = css`
	.selection-workflow { display:grid; gap:var(--en-space-5, var(--en-space-6)); min-inline-size:0; }
	.selection-workflow * { box-sizing:border-box; }
	.selection-workflow :is(h3,h4,p,dl,dd) { margin:0; }
	.selection-workflow h3 { font:var(--en-font-heading-small-weight) var(--en-font-heading-small-size)/var(--en-font-heading-small-line-height) var(--en-font-heading-small-family); }
	.selection-workflow :is(h4,dt) { font:var(--en-font-label-strong-weight) var(--en-font-label-strong-size)/var(--en-font-label-strong-line-height) var(--en-font-label-strong-family); }
	.selection-intro,.selection-form,.selection-fields,.selection-receipt { display:grid; gap:var(--en-space-3); min-inline-size:0; }
	.selection-scrollport { block-size:min(32rem,65svh); min-block-size:18rem; overflow:auto; scrollbar-gutter:stable; padding:var(--en-space-4); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-container); background:var(--en-color-canvas); }
	.selection-form { gap:var(--en-space-6); }
	.selection-brief { display:grid; gap:var(--en-space-6); align-content:space-between; min-block-size:24rem; max-inline-size:65ch; }
	.selection-brief :is(header,div) { display:grid; gap:var(--en-space-2); }
	.selection-brief-facts { display:grid; gap:var(--en-space-3); }
	.selection-fields { padding-block-start:var(--en-space-4); border-block-start:var(--en-border-width) solid var(--en-color-boundary); }
	.selection-fields > * { min-inline-size:0; }
	.selection-actions { display:flex; flex-wrap:wrap; gap:var(--en-space-actions, var(--en-space-2)); }
	.selection-receipt { padding-inline-start:var(--en-space-4); border-inline-start:var(--en-border-width) solid var(--en-color-boundary); }
	.selection-receipt p { overflow-wrap:anywhere; }
	.selection-note { color:var(--en-color-text-muted); font-size:var(--en-font-metadata-size); line-height:var(--en-font-metadata-line-height); }
	.selection-status { min-block-size:1lh; }
	.selection-qa { border-block-start:var(--en-border-width) solid var(--en-color-boundary); padding-block-start:var(--en-space-3); }
	.selection-qa > summary { cursor:pointer; padding-block:var(--en-space-2); min-block-size:var(--en-size-target-min); }
	.selection-qa > :not(summary) { margin-block-start:var(--en-space-3); }
	.selection-qa ol { padding-inline-start:var(--en-space-6); }
	.selection-qa li + li { margin-block-start:var(--en-space-3); }
	.selection-workflow :focus-visible { outline:var(--en-focus-width) solid var(--en-color-focus); outline-offset:var(--en-focus-offset); }
	@media (any-pointer:coarse) { .selection-qa > summary { min-block-size:var(--en-size-target-touch); } }
`;
