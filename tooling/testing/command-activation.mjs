import { posix } from 'node:path';

// Exact retained-cohort programs, verified from their explicit run IDs, report
// inventories and assertions. Their source is inventoried but never rebound to
// today's library or allowed to overwrite historical evidence.
const retainedExperiments=new Set([
 'verify-calendar-evidence.mjs','verify-en-reve-main-report.mjs',
 'verify-en-reve-main-evidence.mjs','verify-spectrum-gen2-evidence.mjs',
 'verify-web-awesome-dom.mjs','verify-web-awesome-freeze.mjs',
 'report-calendar-variants.mjs','report-en-reve-main.mjs',
 'report-spectrum-gen2.mjs','report-web-awesome.mjs','report-dom-review.mjs',
 'qualify-calendar-variants.mjs','build-calendar-variants.mjs',
 'calibrate-startup-discovery.mjs','build-en-reve-main.mjs',
 'calendar-followup.mjs','date-report-tables.mjs',
 'diagnose-spectrum-gen2-lifecycle.mjs','diagnose-spectrum-lifecycle.mjs',
 'integrate-en-reve-main.mjs','integrate-spectrum-gen2-main.mjs','integrate-web-awesome-main.mjs',
 'summarize-evidence.mjs','summarize-pass2.mjs','update-en-reve-main-pages.mjs',
]);
const calibrationExperiments=new Set([
 'calibrate-cdp-scope.mjs','calibrate-delivery.mjs','calibrate-startup.mjs',
 'calibrate-en-reve-main-startup.mjs','calibrate-spectrum-gen2-startup.mjs',
 'calibrate-web-awesome-dialog.mjs',
]);

// Exact newly accepted study entry points. Unknown new programs remain unresolved.
const deliveryStudies=new Map([
 ['probes/lazy-delivery-color/prepare-inputs.mjs','probes/lazy-delivery-color/inputs-protocol.md'],
 ['probes/lazy-delivery-editor/analyze.mjs','plans/lazy-delivery/editor.md'],
 ['probes/lazy-delivery-families/report-performance.py','probes/lazy-delivery-families/performance-protocol.md'],
 ...['analyze.py','app/report.mjs','campaign.mjs','prepare.mjs','report.py','verify-report.mjs'].map(name=>['probes/lazy-delivery-performance/'+name,'probes/lazy-delivery-performance/README.md']),
 ['probes/lazy-delivery-reports/report-wave.py','probes/lazy-delivery-reports/README.md'],
]);
const performanceCampaigns=new Set([
 'showcases/performance/campaign.mjs',
 'showcases/performance/campaigns/report.mjs',
 'showcases/performance/experiments/integrate-current-campaign.mjs',
 'showcases/performance/experiments/integrate-calendar-campaign.mjs',
]);
/** Classify a command's subject before constructing any invocation. Historical recipes are never current-library prerequisites. */
export function activationFor(path) {
 if(performanceCampaigns.has(path))return {tier:'performance-campaign',execution:'Explicit documented command and arguments; planning, acquisition, report integration and transfer remain separate operations',fixture:'Selected recipe and fresh campaign ID for acquisition; exact retained campaign/raw identities for reporting; fresh destinations for transfer',protocol:'showcases/performance/CAMPAIGNS.md',requiredInputs:['Exact command-specific configuration, IDs, source and evidence identities','Owning isolated installation and leases for setup/acquisition','Functional qualification, explicit budget and stopping rule before new measurements'],currentLibrary:false};
 if(path==='probes/lazy-delivery-families/prepare-performance.mjs')return {tier:'historical-reproduction',execution:'Fresh preparation is explicitly retired and throws; preserve its parser/control tests and original sealed inputs',fixture:'Original rejected family cohorts; no fresh acquisition',protocol:'probes/lazy-delivery-families/performance-protocol.md',currentLibrary:false};
 if(deliveryStudies.has(path))return {tier:'lazy-delivery-study',execution:'Separate explicit protocol invocation; never an ordinary correctness prerequisite',fixture:'Exact sealed reference/candidate or analyzer-bound raw receipts; fresh disjoint output; retain original matrix, failure and stopping rules',protocol:deliveryStudies.get(path),requiredInputs:['Exact protocol-specific source/prepared/raw identities','Fresh output and applicable ownership leases','Functional qualification before new timing or retention'],currentLibrary:false};
 if(path.startsWith('probes/performance-review/'))return {tier:'docs-diagnostics',execution:'Built docs origin; fresh diagnostic output; three original samples and real observation windows',fixture:'Current docs distribution; diagnostic observations rather than a product budget',currentLibrary:true};
 if(path==='tooling/theme-candidates/verify-focus.mjs')return {tier:'assertion-helper',execution:'Imported by tooling/theme-candidates/verify.mjs; executing this module alone registers no tests',currentLibrary:true};
 if(/^showcases\/performance\/experiments\/run-dom-(?:review|ownership)\.mjs$/.test(path))return {tier:'native-diagnostics',execution:'Fresh explicit run ID or output; qualified native snapshots; serial browser ownership',fixture:'Three desktop repetitions plus narrow and date sessions for census; separate initial ownership census',currentLibrary:false};
 if(/^probes\/(?:production-registry|scoped-hydration\/(?:production|closeout|ssr-profile))\//.test(path))return {tier:'historical-reproduction',execution:'explicit isolated reproduction',fixture:'Sealed phase-specific packages and cohort; preserve original receipts',currentLibrary:false};
 if(/^probes\/scoped-hydration\/(?:form-review|manual-followup)\//.test(path))return {tier:'manual-acceptance',execution:'documented device or human review',fixture:'Prepared controls plus actual device/AT/IME evidence',currentLibrary:false};
 if(path==='probes/date-picker-performance/freeze.py')return {tier:'manual-acceptance',execution:'Explicit immutable archive operation after original complete cells, budgets, old-seal checks and actual manual-review acceptance',fixture:'Requires authentic manual-review.json; cannot be generated from automated fixture checks',currentLibrary:false};
 if(/^probes\/date-picker-performance\/verify-(?:retry|weekday)-review\.mjs$/.test(path))return {tier:'historical-reproduction',execution:'Original isolated experimental review fixtures and outputs, as documented under Preserved investigations',fixture:'Rejected/intermediate retry-announcement and weekday-label variants; not the measured date candidate',currentLibrary:false};
 if(path.startsWith('probes/date-picker-performance/'))return {tier:'date-study',execution:'fresh explicit PHASE6_BASE and documented parent/candidate overlay',fixture:'Parent packed cohort and candidate overlay with original budgets and sample counts',currentLibrary:false};
 if(/^showcases\/performance\/experiments\/(?:startup-v[23]|pass2-metrics|web-awesome-metric-groups)\.mjs$/.test(path))return {tier:'historical-helper',execution:'Imported functions only; executing this module alone does not acquire observations or assert cases',fixture:'Original historical recipes and their existing Node test owners',currentLibrary:false};
 if(path.startsWith('showcases/performance/experiments/')&&retainedExperiments.has(posix.basename(path)))return {tier:'historical-reproduction',execution:'Explicit isolated reproduction with retained cohort inputs; default writes target historical report files',fixture:'Original fixed run IDs, prior inventories, variant builds and/or archived harness; never substitute current samples',currentLibrary:false};
 if(path.startsWith('showcases/performance/experiments/')&&calibrationExperiments.has(posix.basename(path)))return {tier:'instrument-calibration',execution:'Serial original control after fresh-output binding; defaults write named historical report files',fixture:'Actual current collector/startup/CDP behavior, original synthetic work and failure controls; native lab origins when required',currentLibrary:false};
 if(/^showcases\/performance\/experiments\/(?:run|finish|resume|archive)-/.test(path))return {tier:'historical-recipe',execution:'explicit isolated reproduction only',fixture:'Hardcoded retained campaign IDs and sealed source snapshots',currentLibrary:false};
 if(path.startsWith('showcases/performance/experiments/'))return {tier:'specialized-native',execution:'review exact CLI and fresh variant/output binding',fixture:'Named native variant, qualification and snapshot identity',currentLibrary:false};
 if(path.startsWith('tooling/theme-authoring-pilot/')&&!/verify\.mjs$/.test(path))return {tier:'external-pilot',execution:'requires original separately supplied audited engine',fixture:'REVE_CSS_FUNCTIONS_SOURCE and original compiler',currentLibrary:false};
 if(path.startsWith('showcases/performance/'))return {tier:'native-lab',execution:'serial qualified snapshots and fresh run IDs',fixture:'Registry systems, real browsers, full selected sample/cache/profile protocol',currentLibrary:false};
 if(path.startsWith('showcases/')&&!path.startsWith('showcases/performance-results/'))return {tier:'isolated-showcase',execution:'isolated package install/build plus native qualification',fixture:'Actual locked native packages; no workspace source substitution',currentLibrary:false};
 return {tier:'current-library-correctness',execution:'explicit graph command or standalone documented invocation',fixture:'Verified current source/build/consumer bytes',currentLibrary:true};
}
export function packageLifecycle(manifest,scripts) {
 const cwd=posix.dirname(manifest);
 return Object.entries(scripts).map(([script,command])=>({
  id:`${manifest}#${script}`,manifest,cwd,script,command,invocation:['npm','run',script],
  prerequisites:scripts[`pre${script}`]?[`${manifest}#pre${script}`]:[],
  postconditions:scripts[`post${script}`]?[`${manifest}#post${script}`]:[],
  activation:activationFor(manifest),status:'inventoried',
  dependencyPolicy:'Lifecycle edges are exact. Shell-command prerequisite edges require the explicit execution graph; no changed-only or completed-result reuse.',
 }));
}
