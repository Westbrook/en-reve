import { css } from 'lit';

/** Scoped application layout. Component internals remain behind their public APIs. */
export const ssoStyles = css`
	.sso-workflow { display:grid; gap:var(--en-space-4); max-inline-size:var(--en-layout-article-max); min-inline-size:0; }
	.sso-workflow p { margin-block:0; }
	.sso-disclosure,.sso-review { color:var(--en-color-text-muted); font-size:var(--en-font-metadata-size); }
	.sso-steps { display:flex; flex-wrap:wrap; gap:var(--en-space-4); list-style:none; margin:0; padding:0; color:var(--en-color-text-muted); }
	.sso-steps [aria-current] { color:var(--en-color-text); font-weight:var(--en-font-label-strong-weight); }
	.sso-task { min-inline-size:0; }
	.sso-task h3 { margin-block:0 var(--en-space-3); }
	.sso-task p + .sso-form,.sso-context + .sso-form { margin-block-start:var(--en-space-5,var(--en-space-6)); }
	.sso-form { display:grid; gap:var(--en-space-4); }
	.sso-actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-3); }
	.sso-actions [hidden] { display:none; }
	.sso-context { display:grid; gap:var(--en-space-2); margin-block:var(--en-space-4); overflow-wrap:anywhere; }
	.sso-context > div { display:flex; flex-wrap:wrap; gap:var(--en-space-2) var(--en-space-4); }
	.sso-context dt { color:var(--en-color-text-muted); }
	.sso-context dd { margin:0; }
	.sso-status { min-block-size:2lh; margin-block-start:var(--en-space-4) !important; }
	.sso-status[data-state="rejected"] { color:var(--en-color-danger-text); }
	.sso-validation { border-inline-start:var(--en-focus-width) solid var(--en-color-danger-text); padding:var(--en-space-3); margin-block:var(--en-space-4); }
	.sso-validation h4 { margin:0; }
	.sso-validation ul { margin-block-end:0; padding-inline-start:var(--en-space-6); }
	.sso-validation a { color:var(--en-color-danger-text); }
	.sso-scenarios { border-block-start:var(--en-border-width) solid var(--en-color-line); padding-block-start:var(--en-space-4); }
	.sso-scenarios summary { cursor:pointer; font-weight:var(--en-font-label-strong-weight); }
	.sso-scenarios > :not(summary) { margin-block-start:var(--en-space-4); }
	.sso-fixture-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr)); gap:var(--en-space-4); }
	.sso-pending-list { display:grid; gap:var(--en-space-3); padding-inline-start:var(--en-space-5,var(--en-space-6)); }
	.sso-pending-list li { overflow-wrap:anywhere; }
	.sso-pending-list en-button { margin-inline-start:var(--en-space-2); }
`;
