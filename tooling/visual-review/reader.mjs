import {hashValue,stableStringify} from '@en-reve/tokens';
import {readEnvelope,createPlan,comparisonSettings} from './plan.mjs';

export const MAX_VISUAL_BUNDLE_BYTES=128*1024*1024;
const digestPattern=/^sha256:[a-f0-9]{64}$/;
const same=(a,b)=>stableStringify(a)===stableStringify(b);
const requireValue=(value,message)=>{if(!value)throw new Error(message);};
export async function bytesDigest(bytes){return 'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');}
function identity(value,kind){
 requireValue(value?.schemaVersion===1&&value.kind===kind&&digestPattern.test(value.digest),'Invalid '+kind+' identity.');
 requireValue(hashValue({schemaVersion:1,kind,inputs:value.inputs})===value.digest,'Changed '+kind+' identity.');
 return value.inputs;
}
function pngSize(bytes){
 requireValue(bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v),'Invalid PNG artifact.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const width=view.getUint32(16),height=view.getUint32(20);
 requireValue(width>0&&height>0&&width*height<=32_000_000,'PNG dimensions exceed the capture limit.');
 return {width,height};
}

/** Checks transport and internal identity consistency, not producer authenticity or human approval. */
export async function verifyVisualEvidence(report,files,build){
 requireValue(report?.schema==='en-reve/candidate-visual-evidence'&&report.schemaVersion===1,'Unsupported visual evidence format.');
 const {integrity,...payload}=report;
 requireValue(hashValue(payload)===integrity,'Visual evidence manifest changed or is incomplete.');
 requireValue(report.buildFingerprint===build.fingerprint,'Visual evidence belongs to a different documentation build.');
 requireValue(['passed','different','incomplete','failed'].includes(report.status)&&report.manualAcceptance==='not-run','Unsupported evidence outcome.');
 requireValue(Array.isArray(report.artifacts)&&report.artifacts.length<=5000&&Array.isArray(report.results)&&report.results.length<=5000,'Invalid evidence inventory.');
 const artifacts=new Map(),missing=new Set(),sizes=new Map(),envelopes=new Map();
 for(const artifact of report.artifacts){
  requireValue(digestPattern.test(artifact.digest)&&['image/png','application/json'].includes(artifact.mediaType),'Unsupported evidence artifact.');
  const path='artifacts/'+artifact.digest.slice(7)+(artifact.mediaType==='image/png'?'.png':'.json');
  requireValue(path===artifact.path&&!artifacts.has(path),'Invalid or duplicate artifact path.');artifacts.set(path,artifact);
  const bytes=files.get(path);if(!bytes){missing.add(path);continue;}
  requireValue(await bytesDigest(bytes)===artifact.digest,'Corrupt evidence artifact: '+path);
  if(artifact.mediaType==='image/png')sizes.set(path,pngSize(bytes));
  else {const data=JSON.parse(new TextDecoder().decode(bytes));if(data?.schema==='en-reve/local-theme-review')envelopes.set(data.integrity,data);}
 }
 for(const path of files.keys())requireValue(artifacts.has(path),'Unlisted evidence artifact: '+path);
 const candidate=envelopes.get(report.candidate?.envelopeIntegrity),baseline=envelopes.get(report.baseline?.envelopeIntegrity);
 requireValue(candidate&&baseline,'Candidate or baseline export is missing from the evidence bundle.');
 const actual=readEnvelope(JSON.stringify(candidate),build),expected=readEnvelope(JSON.stringify(baseline),build);
 requireValue(actual.sourceHash===report.candidate.sourceHash&&expected.sourceHash===report.baseline.sourceHash,'Evidence source identity does not match its exports.');
 const scope=report.scope;
 const plan=createPlan(build,expected,actual,{cases:scope.cases,selected:scope.selected,engines:scope.engines,viewports:scope.viewports});
 requireValue(report.results.length===plan.rows.length,'Evidence is missing required result rows.');
 const settings=comparisonSettings(report.comparisonSettings);
 const artifactRef=(ref,mediaType)=>{
  requireValue(ref&&artifacts.has(ref.path)&&same(artifacts.get(ref.path),ref)&&ref.mediaType===mediaType,'Unbound artifact reference.');
 };
 const outcomes=[];
 for(let i=0;i<plan.rows.length;i++){
  const row=report.results[i],required=plan.rows[i];
  requireValue(['passed','different','failed','not-run','unsupported'].includes(row.status),'Invalid result outcome.');
  for(const name of ['key','engine','viewport','appearance','fixture'])requireValue(same(row[name],required[name]),'Result does not match declared case: '+required.key);
  if(!required.selected)requireValue(['not-run','unsupported'].includes(row.status),'Unselected case claims execution.');
  if(required.status==='unsupported')requireValue(row.status==='unsupported','Unsupported case claims execution.');
  if(['failed','not-run','unsupported'].includes(row.status))requireValue(typeof row.reason==='string'&&row.reason.length>0,'Incomplete outcomes need a reason.');
  const unavailable=[];
  for(const [variant,capture] of Object.entries(row.captures??{})){
   requireValue(['expected','actual'].includes(variant)&&typeof capture.reused==='boolean'&&typeof capture.originatingRun==='string'&&capture.originatingRun.length>0,'Missing capture provenance.');
   const input=identity(capture.identity,'rendering');const subject=variant==='actual'?actual:expected;
   requireValue(input.artifacts?.build===build.fingerprint&&input.theme===subject.sourceHash&&input.fixture===hashValue(row.fixture)&&same(input.viewport,row.viewport)&&same(input.environment,report.environments[row.engine])&&input.preferences?.colorScheme===row.appearance,'Capture identity is for a different case or candidate.');
   artifactRef(capture.artifact,'image/png');if(missing.has(capture.artifact.path))unavailable.push(capture.artifact.path);
   requireValue(capture.details?.reply?.sourceHash===subject.sourceHash&&capture.details.reply.buildFingerprint===build.fingerprint&&capture.details.reply.effectiveMode===row.appearance,'Capture lacks a matching preview receipt.');
   if(row.fixture.checks?.length)requireValue(Array.isArray(capture.details.stateChecks)&&same(capture.details.stateChecks,row.fixture.checks.map(check=>({...check,status:'passed'}))),'Capture lacks its declared state postconditions.');
   if(row.fixture.capture==='viewport'){
    requireValue(capture.details.coverage?.method==='viewport','Capture lacks its declared viewport framing.');
    const size=sizes.get(capture.artifact.path);if(size)requireValue(size.width===row.viewport.width&&size.height===row.viewport.height,'Viewport PNG dimensions do not match the case.');
   }
  }
  if(row.captureFailure){identity(row.captureFailure.identity,'rendering');artifactRef(row.captureFailure.artifact,'application/json');}
  if(row.comparison){
   const comparison=row.comparison,input=identity(comparison.identity,'comparison'),stats=comparison.stats;
   requireValue(row.captures?.expected&&row.captures?.actual,'Comparison is missing its captures.');
   requireValue(input.candidateImage===row.captures.actual.artifact.digest&&input.baselineImage===row.captures.expected.artifact.digest&&same(input.settings,settings),'Comparison does not match its images or settings.');
   requireValue(typeof comparison.reused==='boolean'&&typeof comparison.originatingRun==='string'&&comparison.originatingRun.length>0,'Missing comparison provenance.');
   artifactRef(comparison.artifact,'image/png');if(missing.has(comparison.artifact.path))unavailable.push(comparison.artifact.path);
   for(const [variant,label] of [['expected','expected'],['actual','actual']]){const size=sizes.get(row.captures[variant].artifact.path);if(size)requireValue(same(size,stats[label]),'Comparison dimensions do not match its PNG.');}
   for(const size of [stats.expected,stats.actual])requireValue(Number.isInteger(size?.width)&&Number.isInteger(size?.height)&&size.width>0&&size.height>0&&size.width*size.height<=32_000_000,'Invalid comparison dimensions.');
   const union={width:Math.max(stats.expected.width,stats.actual.width),height:Math.max(stats.expected.height,stats.actual.height)};
   requireValue(stats.totalPixels===union.width*union.height&&stats.totalPixels<=32_000_000,'Invalid comparison pixel inventory.');
   const differenceSize=sizes.get(comparison.artifact.path);if(differenceSize)requireValue(same(differenceSize,union),'Difference PNG dimensions do not match its comparison.');
   requireValue(Number.isInteger(stats.differentPixels)&&stats.differentPixels>=0&&Number.isInteger(stats.totalPixels)&&stats.totalPixels>=stats.differentPixels&&typeof stats.match==='boolean','Invalid pixel comparison statistics.');
   requireValue(stats.dimensionsMatch===same(stats.expected,stats.actual)&&stats.match===(stats.dimensionsMatch&&stats.differentPixels<=settings.maxDifferentPixels),'Inconsistent comparison outcome.');
   if(['passed','different'].includes(row.status))requireValue(row.status===(stats.match?'passed':'different'),'Result and comparison disagree.');
  }
  if(['passed','different'].includes(row.status))requireValue(row.comparison,'Completed result lacks a comparison.');
  outcomes.push({row,missing:unavailable});
 }
 if(report.status!=='failed'){
  const status=report.results.every(r=>r.status==='passed')?'passed':report.results.every(r=>['passed','different'].includes(r.status))?'different':'incomplete';
  requireValue(report.status===status,'Aggregate evidence outcome is inconsistent.');
  const review=identity(report.reviewIdentity,'review');
  requireValue(review.candidate===actual.integrity&&review.baseline===expected.integrity&&same(review.scope,scope)&&same(review.evidence,[...new Set(report.results.flatMap(r=>r.comparison?[r.comparison.identity.digest]:[]))].sort()),'Review identity does not match the evidence.');
 }
 return {report,files,missing:[...missing],outcomes,candidate,baseline};
}
export function encodeVisualBundle(report,files){
 const encoded=[];let size=0;
 for(const [path,bytes] of files){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));const base64=btoa(binary);size+=base64.length;requireValue(size<=MAX_VISUAL_BUNDLE_BYTES,'Visual bundle exceeds 128 MB.');encoded.push({path,base64});}
 const text=JSON.stringify({schema:'en-reve/visual-review-bundle',schemaVersion:1,report,files:encoded});
 requireValue(new TextEncoder().encode(text).length<=MAX_VISUAL_BUNDLE_BYTES,'Visual bundle exceeds 128 MB.');return text;
}
export async function readVisualBundle(text,build){
 requireValue(new TextEncoder().encode(text).length<=MAX_VISUAL_BUNDLE_BYTES,'Choose a visual bundle of 128 MB or smaller.');
 const value=JSON.parse(text);requireValue(value?.schema==='en-reve/visual-review-bundle'&&value.schemaVersion===1&&Array.isArray(value.files)&&value.files.length<=5000,'Choose an exported visual evidence bundle.');
 const files=new Map();
 for(const file of value.files){requireValue(typeof file.path==='string'&&!files.has(file.path)&&typeof file.base64==='string'&&file.base64.length<=48_000_000&&/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64),'Invalid or oversized bundled artifact.');const binary=atob(file.base64);files.set(file.path,Uint8Array.from(binary,c=>c.charCodeAt(0)));}
 return verifyVisualEvidence(value.report,files,build);
}
export function evidenceReference(evidence){return {schemaVersion:1,integrity:evidence.report.integrity,candidate:evidence.report.candidate,baseline:evidence.report.baseline,buildFingerprint:evidence.report.buildFingerprint,run:evidence.report.run};}
export function validateEvidenceReference(value){
 if(value===undefined)return undefined;
 requireValue(value?.schemaVersion===1&&digestPattern.test(value.integrity)&&digestPattern.test(value.buildFingerprint)&&typeof value.run==='string'&&value.run.length>0,'Invalid visual evidence reference.');
 for(const subject of [value.candidate,value.baseline])requireValue(digestPattern.test(subject?.sourceHash)&&digestPattern.test(subject?.envelopeIntegrity),'Invalid visual evidence subject.');
 return value;
}
