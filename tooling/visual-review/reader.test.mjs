import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {renderingIdentity,comparisonIdentity,reviewIdentity,digestBytes} from '../evidence/identity.ts';
import {verifyVisualEvidence,encodeVisualBundle,readVisualBundle,evidenceReference,validateEvidenceReference} from './reader.mjs';
const source='sha256:'+'a'.repeat(64),old='sha256:'+'b'.repeat(64);
const seal=value=>{const {integrity,...body}=value;return {...body,integrity:hashValue(body)};};
function fixture(){
 const build={schemaVersion:1,fingerprint:source,pages:[{id:'sheet',path:'/',caseIds:['buttons']}],caseIds:['buttons'],assets:[]};
 const envelope=(sourceHash,title)=>seal({schema:'en-reve/local-theme-review',schemaVersion:1,build,draft:{candidate:{candidateSourceHash:sourceHash,theme:{mode:'light'},title}}});
 const candidate=envelope(source,'Actual'),baseline=envelope(old,'Expected'),files=new Map(),artifacts=[];
 const artifact=(bytes,mediaType,label)=>{const digest=digestBytes(bytes),path='artifacts/'+digest.slice(7)+(mediaType==='image/png'?'.png':'.json');const ref={digest,path,mediaType,label};files.set(path,new Uint8Array(bytes));artifacts.push(ref);return ref;};
 artifact(Buffer.from(JSON.stringify(candidate)),'application/json','Candidate');artifact(Buffer.from(JSON.stringify(baseline)),'application/json','Baseline');
 const image=artifact(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1sAAAAASUVORK5CYII=','base64'),'image/png','Synthetic one-pixel fixture');
 const view={id:'desktop',width:1000,height:800},environment={engine:'chromium',version:'synthetic'};
 const testCase={id:'buttons',page:'sheet',state:'default',selector:'[data-specimen=buttons]',actions:[]};
 const scope={cases:[testCase,{...testCase,state:'omitted'}],selected:['buttons:default'],engines:['chromium'],viewports:[view],policy:'test inventory'};
 const capture=theme=>({identity:renderingIdentity({artifacts:{build:source},fixture:hashValue(testCase),testCode:source,resolvedDependencies:{},theme,assets:{},environment,locale:'en-US',direction:'ltr',preferences:{colorScheme:'light'},viewport:view,readiness:{},capture:{}}),artifact:image,reused:false,originatingRun:'fixture',details:{reply:{sourceHash:theme,buildFingerprint:source,effectiveMode:'light'}}});
 const settings={channelThreshold:0,maxDifferentPixels:0};
 const comparison={identity:comparisonIdentity({candidateImage:image.digest,baselineImage:image.digest,implementation:source,settings}),artifact:image,reused:true,originatingRun:'earlier-fixture',stats:{expected:{width:1,height:1},actual:{width:1,height:1},differentPixels:0,totalPixels:1,dimensionsMatch:true,match:true}};
 const results=[{key:'chromium/desktop/light/buttons/default',engine:'chromium',viewport:view,appearance:'light',fixture:testCase,status:'passed',captures:{expected:capture(old),actual:capture(source)},comparison},{key:'chromium/desktop/light/buttons/omitted',engine:'chromium',viewport:view,appearance:'light',fixture:scope.cases[1],status:'not-run',reason:'Not selected.'}];
 const report=seal({schema:'en-reve/candidate-visual-evidence',schemaVersion:1,run:'fixture',createdAt:'2026-10-03',status:'incomplete',buildFingerprint:source,candidate:{sourceHash:source,envelopeIntegrity:candidate.integrity},baseline:{sourceHash:old,envelopeIntegrity:baseline.integrity},scope,environments:{chromium:environment},results,artifacts,comparisonSettings:settings,manualAcceptance:'not-run',reviewIdentity:reviewIdentity({candidate:candidate.integrity,baseline:baseline.integrity,scope,evidence:[comparison.identity.digest]})});
 return {report,files,build,image};
}
test('portable round trip preserves outcomes and reused provenance without claiming approval',async()=>{
 const x=fixture(),loaded=await readVisualBundle(encodeVisualBundle(x.report,x.files),x.build);
 assert.equal(loaded.outcomes[0].row.comparison.reused,true);assert.equal(loaded.outcomes[1].row.status,'not-run');assert.equal(loaded.missing.length,0);assert.equal(loaded.report.manualAcceptance,'not-run');assert.equal(validateEvidenceReference(evidenceReference(loaded)).integrity,x.report.integrity);
});
test('changed bytes, absent original export and other builds cannot become applicable evidence',async()=>{
 const x=fixture(),files=new Map(x.files);files.set(x.image.path,new Uint8Array([1,2,3]));await assert.rejects(verifyVisualEvidence(x.report,files,x.build),/Corrupt/);
 const missing=new Map(x.files);missing.delete(x.report.artifacts[0].path);await assert.rejects(verifyVisualEvidence(x.report,missing,x.build),/export is missing/);
 await assert.rejects(verifyVisualEvidence(x.report,x.files,{...x.build,fingerprint:old}),/different documentation build/);
 const changed=structuredClone(x.report);changed.results[0].status='different';await assert.rejects(verifyVisualEvidence(changed,x.files,x.build),/manifest changed/);
});
test('missing images stay explicitly unavailable while original case outcomes are retained',async()=>{
 const x=fixture();x.files.delete(x.image.path);const loaded=await verifyVisualEvidence(x.report,x.files,x.build);
 assert.deepEqual(loaded.missing,[x.image.path]);assert(loaded.outcomes[0].missing.length>0);assert.equal(loaded.outcomes[0].row.status,'passed');assert.equal(loaded.outcomes[1].row.status,'not-run');
});
test('self-rehashed records still must bind rows, settings and identities consistently',async()=>{
 for(const mutate of [r=>r.results.reverse(),r=>r.results.pop(),r=>r.results[0].comparison.identity.inputs.candidateImage=old,r=>r.comparisonSettings.channelThreshold=4,r=>r.results[0].captures.actual.details.reply.sourceHash=old,r=>r.results[0].comparison.stats.match=false,r=>r.manualAcceptance='passed']){
  const x=fixture(),r=structuredClone(x.report);mutate(r);await assert.rejects(verifyVisualEvidence(seal(r),x.files,x.build));
 }
});
test('arbitrary paths, duplicate files and executable formats are rejected',async()=>{
 const x=fixture(),r=structuredClone(x.report);r.artifacts[0].path='https://example.invalid/x';await assert.rejects(verifyVisualEvidence(seal(r),x.files,x.build),/path/);
 const bundle=JSON.parse(encodeVisualBundle(x.report,x.files));bundle.files.push(bundle.files[0]);await assert.rejects(readVisualBundle(JSON.stringify(bundle),x.build),/Invalid/);
 const evil=structuredClone(x.report);evil.artifacts[2].mediaType='image/svg+xml';await assert.rejects(verifyVisualEvidence(seal(evil),x.files,x.build),/Unsupported/);
});
