import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashValue} from '@en-reve/tokens';
import {createAssessment,updateAssessment,importAssessment,exportAssessment,assessmentSummary} from './assessment.mjs';
const now='2026-10-03T00:00:00.000Z';
const hash=letter=>'sha256:'+letter.repeat(64);
function fixture(){
 const row={key:'chromium/desktop/light/buttons/focus',status:'different',comparison:{identity:'comparison'},fixture:{id:'buttons',state:'focus'}};
 return {report:{integrity:hash('a'),candidate:{sourceHash:hash('b'),envelopeIntegrity:hash('c')},baseline:{sourceHash:hash('d'),envelopeIntegrity:hash('e')},buildFingerprint:hash('f'),run:'local-run',results:[row]},outcomes:[{row,missing:[]}]};
}
const reseal=value=>{const {integrity,...body}=value;return {...body,integrity:hashValue(body)};};
test('human assessments start unassessed and leave mechanical evidence unchanged',()=>{
 const evidence=fixture(),snapshot=JSON.stringify(evidence),initial=createAssessment(evidence,now),key=evidence.outcomes[0].row.key;
 assert.deepEqual(assessmentSummary(initial,evidence),{unassessed:1,intentional:0,regression:0,openFeedback:0});
 const next=updateAssessment(initial,evidence,key,{category:'intentional',note:'The wider corners are the requested change.',feedback:'resolved'},now);
 assert.deepEqual(assessmentSummary(next,evidence),{unassessed:0,intentional:1,regression:0,openFeedback:0});
 assert.deepEqual(initial.entries,{});assert.equal(JSON.stringify(evidence),snapshot);
 assert.deepEqual(importAssessment(exportAssessment(next,evidence),evidence),next);
});
test('notes remain actionable independently of mechanical matching',()=>{
 const evidence=fixture();evidence.outcomes[0].row.status='passed';
 const next=updateAssessment(createAssessment(evidence,now),evidence,evidence.outcomes[0].row.key,{category:'regression',note:'The expected baseline also contains the clipping defect.'},now);
 assert.equal(next.entries[evidence.outcomes[0].row.key].category,'regression');
 assert.equal(assessmentSummary(next,evidence).openFeedback,1);
 assert.throws(()=>updateAssessment(next,evidence,evidence.outcomes[0].row.key,{note:''},now),/Explain/);
});
test('exact evidence, baseline, candidate, build and row identities govern reopening',()=>{
 const evidence=fixture(),assessment=createAssessment(evidence,now);
 for(const field of ['integrity','buildFingerprint','run']){
  const changed=structuredClone(evidence);changed.report[field]='changed';
  assert.throws(()=>importAssessment(exportAssessment(assessment,evidence),changed),/another evidence/);
 }
 for(const subject of ['candidate','baseline']){
  const changed=structuredClone(evidence);changed.report[subject].sourceHash=hash('0');
  assert.throws(()=>importAssessment(exportAssessment(assessment,evidence),changed),/another evidence/);
 }
 const annotated=updateAssessment(assessment,evidence,evidence.outcomes[0].row.key,{note:'Inspect the focus ring.'},now);
 const changed=structuredClone(evidence);changed.outcomes[0].row.status='passed';
 assert.throws(()=>importAssessment(exportAssessment(annotated,evidence),changed),/row has changed/);
});
test('unavailable captures permit notes but never a visual classification',()=>{
 for(const state of ['failed','not-run','unsupported','missing']){
  const evidence=fixture();if(state==='missing')evidence.outcomes[0].missing=['actual.png'];else evidence.outcomes[0].row.status=state;
  const initial=createAssessment(evidence,now),key=evidence.outcomes[0].row.key;
  const noted=updateAssessment(initial,evidence,key,{note:'Acquire the missing state.'},now);
  assert.equal(assessmentSummary(noted,evidence).unassessed,1);
  for(const category of ['intentional','regression'])assert.throws(()=>updateAssessment(noted,evidence,key,{category},now),/Unavailable/);
 }
});
test('corruption, unknown rows, oversized notes and unknown edits reject without mutation',()=>{
 const evidence=fixture(),initial=createAssessment(evidence,now),before=JSON.stringify(initial),key=evidence.outcomes[0].row.key;
 assert.throws(()=>importAssessment(JSON.stringify({...initial,updatedAt:'changed'}),evidence),/integrity/);
 assert.throws(()=>updateAssessment(initial,evidence,'unknown',{note:'x'},now),/absent/);
 assert.throws(()=>updateAssessment(initial,evidence,key,{status:'approved'},now),/Only human/);
 assert.throws(()=>updateAssessment(initial,evidence,key,{note:'x'.repeat(4001)},now),/Invalid/);
 assert.throws(()=>importAssessment(' '.repeat(1_000_001),evidence),/1 MB/);
 const forged=reseal({...initial,entries:{[key]:{rowDigest:hashValue(evidence.outcomes[0].row),category:'approved',feedback:'resolved',note:'x',updatedAt:now}}});
 assert.throws(()=>importAssessment(JSON.stringify(forged),evidence),/Unknown/);
 assert.equal(JSON.stringify(initial),before);
});

test('timestamps are canonical and cannot move assessment history backwards',()=>{
 const evidence=fixture(),initial=createAssessment(evidence,now),key=evidence.outcomes[0].row.key;
 for(const value of ['2026-02-30T00:00:00.000Z','2026-10-03','October 3, 2026'])assert.throws(()=>createAssessment(evidence,value),/timestamp/);
 assert.throws(()=>updateAssessment(initial,evidence,key,{note:'x'},'2026-10-02T00:00:00.000Z'),/timestamp/);
});
