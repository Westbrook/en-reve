import {html,nothing} from 'lit';
import {keyed} from 'lit/directives/keyed.js';
import {assessmentSummary,type VisualAssessment} from '../../../../tooling/visual-review/assessment.mjs';
import type {readVisualBundle,VisualReference} from '../../../../tooling/visual-review/reader.mjs';
export type VisualEvidence=Awaited<ReturnType<typeof readVisualBundle>>;
export function visualEvidenceTemplate(state:{evidence?:VisualEvidence;reference?:VisualReference;sourceHash:string;urls:Map<string,string>;error:string;message:string;busy:boolean;enabled:boolean;open:(event:Event)=>void;download:()=>void;openCandidate:()=>void;clear:()=>void;assessment?:VisualAssessment;assessmentRevision:number;assessmentBusy:boolean;assessmentError:string;assessmentMessage:string;saveAssessment:(key:string,event:Event)=>void;openAssessment:(event:Event)=>void;downloadAssessment:()=>void}){
 const evidence=state.evidence,report=evidence?.report;
 const current=report?.candidate.sourceHash===state.sourceHash;
 const linked=!state.reference||state.reference.integrity===report?.integrity;
 const counts=evidence&&state.assessment?assessmentSummary(state.assessment,evidence):undefined;
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
    <p>Reported outcome: ${report.status}. Comparison outcomes do not establish human acceptance. Captured metadata remains in the original exports even if the current title or rationale changes.</p>
    ${report.error?html`<p>${report.error}</p>`:nothing}
   </details>
   <section class="visual-assessment" aria-labelledby="visual-assessment-title">
    <h3 id="visual-assessment-title">Local assessment</h3>
    <p>Record intended changes, suspected regressions and follow-up notes separately from machine results. Export before closing this page; importing a matching file restores saved notes. These opinions do not authenticate a reviewer, approve a theme or change its baseline.</p>
    ${counts?html`<p data-assessment-summary>${counts.unassessed} unassessed · ${counts.intentional} intentional · ${counts.regression} suspected regressions · ${counts.openFeedback} open notes</p>`:nothing}
    ${!current?html`<p data-assessment-stale>Assessment editing is unavailable while this draft differs from the captured candidate. Open that candidate or Undo your edits; previous notes remain available for export.</p>`:nothing}
    <div class="review-toolbar"><label class="review-file">Import assessment<input type="file" accept=".json,application/json" ?disabled=${state.assessmentBusy||!state.enabled} @change=${state.openAssessment}></label><en-button size="small" @click=${state.downloadAssessment}>Export assessment</en-button></div>
    <p role="status" aria-live="polite">${state.assessmentBusy?'Checking assessment…':state.assessmentMessage}</p>
    ${state.assessmentError?html`<p role="alert">${state.assessmentError}</p>`:nothing}
   </section>
   ${keyed(evidence,html`<ul class="visual-results">${evidence.outcomes.map(({row,missing})=>html`<li><details>
    <summary>${row.fixture.id} · ${row.fixture.state} · ${row.engine} · ${row.viewport.id} · ${row.appearance}: ${missing.length?'artifacts missing':row.status}</summary>
    ${row.reason?html`<p>${row.reason}</p>`:nothing}
    <p>${row.viewport.width} × ${row.viewport.height} CSS pixels. ${report.environments[row.engine]?.version??'Engine did not start.'}</p>
    ${row.comparison?html`<p>${row.comparison.stats.differentPixels} of ${row.comparison.stats.totalPixels} pixels differ. ${row.comparison.reused?'Comparison reused':'Comparison executed'} from ${row.comparison.originatingRun}.</p>`:nothing}
    <div class="visual-images">${(['expected','actual','difference'] as const).map(variant=>{
     const capture=variant==='difference'?row.comparison:row.captures?.[variant];if(!capture)return nothing;
     const url=state.urls.get(capture.artifact.path),label=variant==='expected'?'Expected':variant==='actual'?'Actual':'Difference';
     return html`<figure><figcaption>${label} · ${capture.reused?'reused':'executed'} · ${capture.originatingRun}</figcaption>${url?html`<a href=${url} target="_blank" rel="noopener"><img loading="lazy" src=${url} alt=${`${label}: ${row.fixture.id}, ${row.fixture.state}, ${row.engine}, ${row.appearance}. Open full-size image.`}></a>`:html`<p>${label} image missing.</p>`}</figure>`;
    })}</div>
    ${(()=>{
     const entry=state.assessment?.entries[row.key],category=entry?.category??'unassessed',available=!missing.length&&!!row.comparison&&['passed','different'].includes(row.status);
     return keyed(state.assessmentRevision,html`<form class="visual-assessment-form" aria-label=${`Assessment: ${row.fixture.id}, ${row.fixture.state}, ${row.engine}, ${row.viewport.id}, ${row.appearance}`} @submit=${(event:Event)=>state.saveAssessment(row.key,event)}>
      <fieldset ?disabled=${!current||state.assessmentBusy}><legend>Assess this capture</legend>
       <label>Classification<select name="category"><option value="unassessed" ?selected=${category==='unassessed'}>Unassessed</option><option value="intentional" ?disabled=${!available} ?selected=${category==='intentional'}>Intentional change</option><option value="regression" ?disabled=${!available} ?selected=${category==='regression'}>Suspected regression</option></select></label>
       ${!available?html`<p>Visual classification requires complete capture images. You can still record a follow-up note.</p>`:nothing}
       <label>Rationale or follow-up<textarea name="note" rows="3" maxlength="4000" .value=${entry?.note??''}></textarea></label>
       <label>Follow-up status<select name="feedback"><option value="open" ?selected=${entry?.feedback!=='resolved'}>Open</option><option value="resolved" ?selected=${entry?.feedback==='resolved'}>Resolved</option></select></label>
       <en-button size="small" ?disabled=${!current||state.assessmentBusy} @click=${(event:Event)=>(event.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Save assessment</en-button>
      </fieldset>
      ${entry?html`<p data-assessment-saved>Saved classification: ${entry.category}; follow-up: ${entry.feedback}. <time datetime=${entry.updatedAt}>${entry.updatedAt}</time></p>`:nothing}
     </form>`);
    })()}
   </details></li>`)}</ul>`)}
  `}
 </section>`;
}
