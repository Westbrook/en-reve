import {hashValue,stableStringify} from '@en-reve/tokens';
import {validateActions} from './action-contract.mjs';

export function readEnvelope(bytes,build) {
 if(bytes.length>8_000_000)throw new Error('Candidate exceeds the review import limit.');
 const value=JSON.parse(bytes);const {integrity,...payload}=value;
 if(value.schema!=='en-reve/local-theme-review'||![1,2].includes(value.schemaVersion)||hashValue(payload)!==integrity)throw new Error('Invalid candidate envelope integrity.');
 if(stableStringify(value.build)!==stableStringify(build))throw new Error('Candidate belongs to a different build; no automatic rebase.');
 const sourceHash=value.schemaVersion===2?value.draft.pairSourceHash:value.draft.candidate.candidateSourceHash;
 if(!/^sha256:[a-f0-9]{64}$/.test(sourceHash))throw new Error('Candidate source identity is missing.');
 const appearances=value.schemaVersion===2?['light','dark']:[value.draft.candidate.theme.mode];
 if(appearances.some(mode=>!['light','dark'].includes(mode)))throw new Error('Candidate appearance is missing.');
 return {envelope:value,sourceHash,appearances,integrity};
}
export function defaultCases(build) {
 return build.pages.flatMap(page=>page.caseIds.map(id=>({id:page.id==='sheet'?id:'workflow:'+page.id,page:page.id,state:'default',selector:page.id==='sheet'?`[data-specimen="${id}"]`:`.workflow-section[id="${id}"]`,actions:[]})));
}
export function createPlan(build,baseline,candidate,options={}) {
 if(Object.keys(options).some(key=>!['engines','viewports','cases','selected','comparison','cacheDirectory','reuse'].includes(key)))throw new Error('Unknown capture option.');
 const engines=options.engines??['chromium','firefox','webkit'];
 const viewports=options.viewports??[{id:'desktop',width:1280,height:900},{id:'mobile',width:390,height:844}];
 const cases=options.cases??defaultCases(build);
 const selected=options.selected??cases.map(item=>item.id+':'+item.state);
 if(!engines.length||new Set(engines).size!==engines.length||engines.some(e=>!['chromium','firefox','webkit'].includes(e)))throw new Error('Choose distinct supported engines.');
 if(!viewports.length||new Set(viewports.map(v=>v.id)).size!==viewports.length||viewports.some(v=>!v.id||!Number.isInteger(v.width)||!Number.isInteger(v.height)||v.width<240||v.height<240||v.width>3840||v.height>3840))throw new Error('Invalid viewport matrix.');
 if(!cases.length||new Set(cases.map(c=>c.id+':'+c.state)).size!==cases.length)throw new Error('Cases must be nonempty and unique.');
 const known=defaultCases(build);
 for(const item of cases) {
  if(!known.some(c=>c.id===item.id&&c.page===item.page)||!item.state||typeof item.selector!=='string'||!item.selector||!Array.isArray(item.actions))throw new Error('Unknown or incomplete authored case.');
  validateActions(item.actions);
  validateChecks(item.checks??[]);
  if(item.capture!==undefined&&!['element','viewport'].includes(item.capture))throw new Error('Unknown capture framing.');
  if(item.unsupported!==undefined&&!(typeof item.unsupported==='string'&&item.unsupported.trim()))throw new Error('Unsupported states require an explanation.');
 }
 if(selected.some(id=>!cases.some(c=>c.id+':'+c.state===id)))throw new Error('Selected case is not in the required inventory.');
 const appearances=[...new Set([...baseline.appearances,...candidate.appearances])];
 const rows=engines.flatMap(engine=>viewports.flatMap(viewport=>appearances.flatMap(appearance=>cases.map(fixture=>({key:[engine,viewport.id,appearance,fixture.id,fixture.state].join('/'),engine,viewport,appearance,fixture,status:fixture.unsupported?'unsupported':'not-run',reason:fixture.unsupported??'Not selected or not yet captured.',selected:selected.includes(fixture.id+':'+fixture.state)})))));
 return {engines,viewports,cases,selected,rows};
}
export function comparisonSettings(input={}) {
 const value={channelThreshold:0,maxDifferentPixels:0,...input};
 if(Object.keys(value).some(k=>!['channelThreshold','maxDifferentPixels'].includes(k))||!Number.isInteger(value.channelThreshold)||value.channelThreshold<0||value.channelThreshold>255||!Number.isInteger(value.maxDifferentPixels)||value.maxDifferentPixels<0)throw new Error('Invalid pixel comparison settings.');
 return value;
}

// Differences are review evidence; execution failures must fail the automation.
export function captureExitCode(report) {
 return report.status==='failed'||report.results.some(row=>row.status==='failed')?1:0;
}

export function validateChecks(checks) {
 if (!Array.isArray(checks)) throw new Error('State checks must be an array.');
 for (const check of checks) {
  if (!check || !['visible','hidden','focused','checked','text','value','attribute','count','css','css-relationship'].includes(check.kind) || typeof check.selector !== 'string' || !check.selector.trim()) throw new Error('Unknown or incomplete state check.');
  if (['text','value','attribute','css'].includes(check.kind) && typeof check.value !== 'string') throw new Error('State check requires a string value.');
  if (check.kind === 'attribute' && (typeof check.name !== 'string' || !check.name.trim())) throw new Error('Attribute check requires a name.');
  if (['css','css-relationship'].includes(check.kind) && (typeof check.name !== 'string' || !/^(?:--)?[a-z][a-z0-9-]*$/.test(check.name))) throw new Error('CSS check requires a property name.');
  if (check.kind === 'css-relationship' && (typeof check.referenceSelector !== 'string' || !check.referenceSelector.trim() || !['equal','different','greater','less'].includes(check.relation))) throw new Error('CSS relationship check requires a reference and relation.');
  if (check.kind === 'count' && (!Number.isInteger(check.value) || check.value < 0)) throw new Error('Count check requires a nonnegative integer.');
 }
}
