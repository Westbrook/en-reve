import { css } from 'lit';

/** Example layout is scoped to this workflow; component geometry remains library-owned. */
export const settingsStyles = css`
  .settings-workflow { container-type:inline-size; display:grid; gap:var(--en-space-5, var(--en-space-6)); min-inline-size:0; }
  .settings-workflow * { box-sizing:border-box; }
  .settings-workflow :is(h3,h4,p,figure) { margin:0; }
  .settings-workflow h3 { font:var(--en-font-heading-small-weight) var(--en-font-heading-small-size)/var(--en-font-heading-small-line-height) var(--en-font-heading-small-family); }
  .settings-workflow h4 { font:var(--en-font-label-strong-weight) var(--en-font-label-strong-size)/var(--en-font-label-strong-line-height) var(--en-font-label-strong-family); }
  .settings-intro,.settings-fields,.settings-preview-column,.settings-snapshot,.settings-incoming,.settings-scenario-section,.settings-scenario-controls { display:grid; gap:var(--en-space-3); min-inline-size:0; align-content:start; }
  .settings-review-layout,.settings-review-instructions,.settings-review-demo,.settings-scenario-guide { display:grid; min-inline-size:0; gap:var(--en-space-6); align-content:start; }
  .settings-review-jumps { display:flex; flex-wrap:wrap; gap:var(--en-space-3); }
  .settings-review-jumps a { display:inline-flex; align-items:center; min-block-size:var(--en-size-target-min); padding:var(--en-space-1); color:var(--en-color-action-text); }
  .settings-scenario-section :is(ol,ul) { margin:0; padding-inline-start:var(--en-space-5, var(--en-space-6)); }
  .settings-scenario-section li + li { margin-block-start:var(--en-space-2); }
  .settings-scenario-controls { padding-block:var(--en-space-4); border-block:var(--en-border-width) solid var(--en-color-boundary); }
  .settings-scenario-controls .settings-qa-fields { max-inline-size:40rem; }
  .settings-scenario-controls .settings-qa-fields > :only-child { grid-column:1/-1; }
  .settings-scenario-section,.settings-scenario-controls,.settings-review-demo { scroll-margin-block-start:calc(var(--en-navigation-height,0px) + var(--en-space-6)); }
  .settings-project-outline { display:grid; gap:var(--en-space-3); min-inline-size:0; padding:var(--en-space-4); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-control); }
  .settings-outline-panels { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr)); gap:var(--en-space-4); align-items:start; min-inline-size:0; }
  .settings-outline-panels > * { min-inline-size:0; }
  .settings-workbench { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:var(--en-space-6); align-items:start; }
  .settings-fields { gap:var(--en-space-5, var(--en-space-6)); }
  .settings-fields > * { min-inline-size:0; }
  #settings-output-controls::part(base) { align-items:end; }
  #settings-output-controls > en-select { flex:1 1 9rem; }
  .settings-command-area { display:grid; gap:var(--en-space-3); min-inline-size:0; }
  .settings-command-guidance,.settings-command-guidance > en-toolbar { min-inline-size:0; }
  .settings-actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-actions, var(--en-space-2)); }
  .settings-note,.settings-state { color:var(--en-color-text-muted); font-size:var(--en-font-metadata-size); line-height:var(--en-font-metadata-line-height); }
  .settings-preview { display:grid; gap:var(--en-space-3); padding:var(--en-space-4); background:var(--en-color-surface-subtle); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-container); }
  .settings-preview figcaption { display:flex; flex-wrap:wrap; justify-content:space-between; gap:var(--en-space-2); font-size:var(--en-font-metadata-size); }
  .settings-artboard { position:relative; overflow:hidden; inline-size:min(100%,18rem); aspect-ratio:4/5; margin-inline:auto; background:var(--en-color-canvas); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:max(0px,calc(var(--en-radius-container) - var(--en-space-4) - var(--en-border-width))); }
  .settings-artboard[data-layout=landscape] { aspect-ratio:8/5; }
  .settings-artboard[data-background=false] { background:repeating-conic-gradient(var(--en-color-canvas) 0% 25%,var(--en-color-surface-subtle) 0% 50%) 0/var(--en-space-6) var(--en-space-6); }
  .settings-artwork { position:absolute; inset:0; }
  .settings-orbit { position:absolute; inline-size:75%; aspect-ratio:1; inset-inline-start:-15%; inset-block-start:8%; border:var(--en-space-6) solid var(--en-color-action); border-radius:50%; }
  .settings-tile { position:absolute; inline-size:48%; aspect-ratio:1; inset-inline-end:8%; inset-block-end:14%; background:var(--en-color-accent-subtle); border:var(--en-border-width) solid var(--en-color-action); border-radius:var(--en-radius-container); transform:rotate(-12deg); }
  .settings-stripe { position:absolute; inline-size:70%; block-size:var(--en-space-6); inset-inline-start:15%; inset-block-start:48%; background:var(--en-color-text); transform:rotate(-25deg); }
  .settings-snapshot { padding:var(--en-space-3); border-inline-start:var(--en-border-width) solid var(--en-color-boundary); }
  .settings-snapshot p { font-size:var(--en-font-ui-size); overflow-wrap:anywhere; }
  .settings-incoming { border:var(--en-border-width) solid var(--en-color-action); border-radius:var(--en-radius-container); padding:var(--en-space-4); background:var(--en-color-accent-subtle); }
  .settings-status { min-block-size:2lh; color:var(--en-color-text); }
  .settings-qa,.settings-command-help { border-block-start:var(--en-border-width) solid var(--en-color-boundary); padding-block-start:var(--en-space-3); }
  .settings-qa > summary,.settings-command-help > summary { cursor:pointer; padding-block:var(--en-space-2); min-block-size:var(--en-size-target-min); }
  .settings-qa > :not(summary),.settings-command-help > :not(summary) { margin-block-start:var(--en-space-3); }
  .settings-qa-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--en-space-4); }
  .settings-checklist { padding-inline-start:var(--en-space-6); font-size:var(--en-font-metadata-size); }
  .settings-checklist li + li { margin-block-start:var(--en-space-2); }
  .settings-workflow :focus-visible { outline:var(--en-focus-width) solid var(--en-color-focus); outline-offset:var(--en-focus-offset); }
  @container (max-width:42rem) { .settings-workbench,.settings-qa-fields,.settings-scenario-guide { grid-template-columns:minmax(0,1fr); } }
  @container (min-width:64rem) { .settings-review-layout[data-guided] { grid-template-columns:minmax(16rem,.8fr) minmax(0,1.6fr); } }
  @media (any-pointer:coarse) { .settings-qa > summary,.settings-command-help > summary { min-block-size:var(--en-size-target-touch); } }
  @media (forced-colors:active) { .settings-artboard { background:Canvas; } .settings-artwork { opacity:1 !important; } }
`;
