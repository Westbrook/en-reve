import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {verifyVisualEvidence,encodeVisualBundle,readVisualBundle,evidenceReference,validateEvidenceReference} from './reader.mjs';
import {fixture} from './test-fixture.mjs';
const old='sha256:'+'b'.repeat(64);
const seal=value=>{const {integrity,...body}=value;return {...body,integrity:hashValue(body)};};
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

test('declared state postconditions cannot disappear or claim failed checks on completed captures',async()=>{
 const checks=[{kind:'attribute',selector:'button',name:'aria-expanded',value:'true'}];
 const x=fixture(checks);await verifyVisualEvidence(x.report,x.files,x.build);
 for(const replacement of [undefined,[],[{...checks[0],status:'failed'}],[{...checks[0],selector:'other',status:'passed'}]]){
  const r=structuredClone(x.report);if(replacement===undefined)delete r.results[0].captures.actual.details.stateChecks;else r.results[0].captures.actual.details.stateChecks=replacement;
  await assert.rejects(verifyVisualEvidence(seal(r),x.files,x.build),/postconditions/);
 }
});
