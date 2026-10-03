import {html,nothing} from 'lit';
import type {readVisualBundle,VisualReference} from '../../../../tooling/visual-review/reader.mjs';
export type VisualEvidence=Awaited<ReturnType<typeof readVisualBundle>>;
export function visualEvidenceTemplate(state:{evidence?:VisualEvidence;reference?:VisualReference;sourceHash:string;urls:Map<string,string>;error:string;message:string;busy:boolean;enabled:boolean;open:(event:Event)=>void;download:()=>void;openCandidate:()=>void;clear:()=>void}){
 const evidence=state.evidence,report=evidence?.report;
 const current=report?.candidate.sourceHash===state.sourceHash;
 const linked=!state.reference||state.reference.integrity===report?.integrity;
 return html`<section class="visual-evidence" aria-labelledby="visual-evidence-title">
  <h2 id="visual-evidence-title">Visual evidence</h2>
  <p>Import a visual evidence bundle from the capture workflow. Its expected images use an explicitly chosen baseline, which may differ from the live preview baseline above. Imports stay on this device.</p>
  <label class="review-file">Import visual evidence<input type="file" accept=".json,application/json" ?disabled=${!state.enabled} @change=${state.open}></label>
  <p class="review-help">Choose one portable evidence JSON file, up to 128 MB. Keep the candidate and evidence files with their matching documentation build for offline review.</p>
  <p role="status" aria-live="polite" aria-atomic="true">${state.busy?'Checking evidence integrity…':state.message}</p>
  ${state.error?html`<p role="alert">${state.error}</p>`:nothing}
  ${state.reference&&evidence&&!linked?html`<p data-evidence-missing>This candidate references another evidence bundle. Its artifacts are missing here; the loaded bundle is retained separately.</p>`:nothing}
  ${!evidence||!report?html`<p data-evidence-missing>${state.reference?'This candidate has an evidence reference, but its artifacts are missing. Import the matching visual bundle.':'No visual comparison evidence loaded. This is not a passing result.'}</p>`:html`
   <p data-evidence-applicability>${current?'Captured source matches this draft.':'Stale for this draft: captured source differs. Prior evidence is retained.'} ${report.status==='failed'?'The producer reported a run-level failure; individual captures do not establish a passing run.':''}</p>
   <p>${evidence.missing.length?`${evidence.missing.length} artifacts missing. Affected rows are unavailable.`:'All listed artifact hashes verified.'} Integrity checks detect changed files and inconsistent identities; they do not authenticate the producer, repeat the tests, or grant design approval.</p>
   <div class="review-toolbar"><en-button size="small" @click=${state.download}>Export visual evidence</en-button><en-button size="small" @click=${state.openCandidate}>Open captured candidate</en-button><en-button size="small" variant="ghost" @click=${state.clear}>Unload evidence</en-button></div>
   <details class="review-details"><summary>Evidence provenance</summary>
    <dl><dt>Run</dt><dd>${report.run}</dd><dt>Captured candidate</dt><dd><code>${report.candidate.sourceHash}</code></dd><dt>Expected baseline</dt><dd><code>${report.baseline.sourceHash}</code></dd><dt>Build</dt><dd><code>${report.buildFingerprint}</code></dd><dt>Manifest</dt><dd><code>${report.integrity}</code></dd><dt>Comparison tolerance</dt><dd>${report.comparisonSettings.channelThreshold} per channel; ${report.comparisonSettings.maxDifferentPixels} different pixels</dd></dl>
    <p>Reported outcome: ${report.status}. Human acceptance: not performed. Captured metadata remains in the original exports even if the current title or rationale changes.</p>
    ${report.error?html`<p>${report.error}</p>`:nothing}
   </details>
   <ul class="visual-results">${evidence.outcomes.map(({row,missing})=>html`<li><details>
    <summary>${row.fixture.id} · ${row.fixture.state} · ${row.engine} · ${row.viewport.id} · ${row.appearance}: ${missing.length?'artifacts missing':row.status}</summary>
    ${row.reason?html`<p>${row.reason}</p>`:nothing}
    <p>${row.viewport.width} × ${row.viewport.height} CSS pixels. ${report.environments[row.engine]?.version??'Engine did not start.'}</p>
    ${row.comparison?html`<p>${row.comparison.stats.differentPixels} of ${row.comparison.stats.totalPixels} pixels differ. ${row.comparison.reused?'Comparison reused':'Comparison executed'} from ${row.comparison.originatingRun}.</p>`:nothing}
    <div class="visual-images">${(['expected','actual','difference'] as const).map(variant=>{
     const capture=variant==='difference'?row.comparison:row.captures?.[variant];if(!capture)return nothing;
     const url=state.urls.get(capture.artifact.path),label=variant==='expected'?'Expected':variant==='actual'?'Actual':'Difference';
     return html`<figure><figcaption>${label} · ${capture.reused?'reused':'executed'} · ${capture.originatingRun}</figcaption>${url?html`<a href=${url} target="_blank" rel="noopener"><img loading="lazy" src=${url} alt=${`${label}: ${row.fixture.id}, ${row.fixture.state}, ${row.engine}, ${row.appearance}. Open full-size image.`}></a>`:html`<p>${label} image missing.</p>`}</figure>`;
    })}</div>
   </details></li>`)}</ul>
  `}
 </section>`;
}
