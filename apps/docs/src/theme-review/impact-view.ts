import {html,nothing} from 'lit';
import type {candidateImpact,ImpactManifest} from './impact.js';
export function impactTemplate({selection,manifest,error,openCase,href}:{selection?:ReturnType<typeof candidateImpact>;manifest?:ImpactManifest;error:string;openCase:(id:string)=>void;href:(path:string)=>string}) {
 return html`<section class="review-impact" aria-labelledby="impact-title">
  <h3 id="impact-title">Affected patterns</h3>
  ${!selection ? html`<p role="status">${error || 'Loading the build’s source-impact map…'}</p><p>Impact is unavailable until the matching map is verified. Review the complete sheet.</p>` : html`
   <p class="review-impact-summary">${selection.changed.length} changed token values · ${selection.components.length} potentially affected components · ${selection.caseIds.length} potentially affected cases${selection.appearances.length===2?' across both appearances':''}.</p>
   <p class="review-help">Potential source dependencies help focus review. Shared code can select extra cases; this is not a computed-cascade or visual result. Keep the complete sheet in scope.</p>
   ${selection.mode==='expanded' ? html`<p role="status">Selection expanded to all known cases because dependency coverage is incomplete.</p>` : nothing}
   ${selection.caseIds.length ? html`<details class="review-details"><summary>Review affected cases (${selection.caseIds.length})</summary><ul class="review-impact-cases">${selection.caseIds.map(id=>html`<li><en-button size="small" variant="ghost" @click=${()=>openCase(id)}>Review ${id.replace(/^workflow:/,'workflow: ').replaceAll('-',' ')}</en-button></li>`)}</ul></details>` : html`<p>No resolved token values differ from this draft’s recorded base.</p>`}
   <details class="review-details"><summary>Source-impact evidence</summary>
    <p>Candidate <code>${selection.candidate}</code></p><p>Base set <code>${selection.baseline}</code></p><p>Source map <code>${selection.impactDigest}</code></p>
    <p>${manifest?.policy}</p>
    ${selection.components.length ? html`<ul>${selection.components.map(tag=>html`<li><a href=${href('/api-reference?component='+encodeURIComponent(tag))}>${tag}</a><ul>${(selection.reasons['component:'+tag]??[]).map(reason=>html`<li>${reason}</li>`)}</ul></li>`)}</ul>` : nothing}
    ${selection.gaps.length ? html`<h4>Coverage gaps</h4><ul>${selection.gaps.map(gap=>html`<li>${gap}</li>`)}</ul>` : nothing}
   </details>`}
  <p><a href=${href('/')}>Open the complete sticker sheet</a></p>
  <p class="review-help">Visual comparison: not run. Rendering a preview or selecting affected cases does not supply expected, actual or difference captures.</p>
 </section>`;
}
