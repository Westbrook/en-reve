import {hashValue,stableStringify} from '@en-reve/tokens';
import {evidenceReference} from './reader.mjs';
export const MAX_ASSESSMENT_BYTES=1_000_000;
const categories=['unassessed','intentional','regression'];
const requireValue=(condition,message)=>{if(!condition)throw new Error(message);};
const same=(a,b)=>stableStringify(a)===stableStringify(b);
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const seal=payload=>({...payload,integrity:hashValue(payload)});
const payload=value=>{const {integrity,...body}=value;return body;};
function checkedEntry(evidence,key,value){
 const outcome=evidence.outcomes.find(item=>item.row.key===key);
 requireValue(outcome,'Assessment case is absent from this evidence.');
 requireValue(value&&categories.includes(value.category)&&['open','resolved'].includes(value.feedback),'Unknown assessment category or feedback state.');
 requireValue(typeof value.note==='string'&&value.note.length<=4000&&timestamp(value.updatedAt),'Invalid assessment note or timestamp.');
 requireValue(value.rowDigest===hashValue(outcome.row),'Assessment row has changed.');
 // Missing or failed captures support notes, not a visual intent classification.
 requireValue(value.category==='unassessed'||(['passed','different'].includes(outcome.row.status)&&outcome.row.comparison&&!outcome.missing.length),'Unavailable visual evidence cannot be classified. Keep it unassessed with a note.');
 requireValue(value.category==='unassessed'||value.note.trim(),'Explain intentional changes and suspected regressions.');
 return {rowDigest:value.rowDigest,category:value.category,feedback:value.feedback,note:value.note,updatedAt:value.updatedAt};
}
export function createAssessment(evidence,now=new Date().toISOString()){
 requireValue(timestamp(now),'Invalid assessment timestamp.');
 return seal({schema:'en-reve/local-visual-assessment',schemaVersion:1,evidence:evidenceReference(evidence),createdAt:now,updatedAt:now,entries:{}});
}
export function validateAssessment(value,evidence){
 requireValue(value&&value.schema==='en-reve/local-visual-assessment'&&value.schemaVersion===1,'Choose an exported visual assessment.');
 requireValue(hashValue(payload(value))===value.integrity,'Assessment integrity mismatch.');
 requireValue(same(value.evidence,evidenceReference(evidence)),'Assessment belongs to another evidence bundle, candidate or build.');
 requireValue(timestamp(value.createdAt)&&timestamp(value.updatedAt)&&value.updatedAt>=value.createdAt,'Invalid assessment timestamps.');
 requireValue(value.entries&&typeof value.entries==='object'&&!Array.isArray(value.entries)&&Object.keys(value.entries).length<=evidence.outcomes.length,'Invalid assessment entry inventory.');
 const entries=Object.fromEntries(Object.entries(value.entries).map(([key,entry])=>{const checked=checkedEntry(evidence,key,entry);requireValue(checked.updatedAt>=value.createdAt&&checked.updatedAt<=value.updatedAt,'Assessment entry timestamp is outside its history.');return [key,checked];}));
 // Return detached data; the machine report is never mutated or re-sealed here.
 return seal({schema:value.schema,schemaVersion:1,evidence:evidenceReference(evidence),createdAt:value.createdAt,updatedAt:value.updatedAt,entries});
}
export function updateAssessment(value,evidence,key,change,now=new Date().toISOString()){
 const current=validateAssessment(value,evidence);requireValue(timestamp(now)&&now>=current.updatedAt,'Assessment updates require a current timestamp.');const outcome=evidence.outcomes.find(item=>item.row.key===key);
 requireValue(outcome,'Assessment case is absent from this evidence.');
 const previous=current.entries[key]??{rowDigest:hashValue(outcome.row),category:'unassessed',feedback:'open',note:'',updatedAt:now};
 requireValue(Object.keys(change).every(key=>['category','feedback','note'].includes(key)),'Only human assessment fields may change.');
 const entry=checkedEntry(evidence,key,{...previous,...change,updatedAt:now});
 return seal({...payload(current),updatedAt:now,entries:{...current.entries,[key]:entry}});
}
export function exportAssessment(value,evidence){
 const text=JSON.stringify(validateAssessment(value,evidence),null,2);
 requireValue(new TextEncoder().encode(text).length<=MAX_ASSESSMENT_BYTES,'Assessment exceeds 1 MB.');return text;
}
export function importAssessment(text,evidence){
 requireValue(typeof text==='string'&&new TextEncoder().encode(text).length<=MAX_ASSESSMENT_BYTES,'Choose one assessment file of 1 MB or smaller.');
 return validateAssessment(JSON.parse(text),evidence);
}
export function assessmentSummary(value,evidence){
 const current=validateAssessment(value,evidence),counts={unassessed:0,intentional:0,regression:0,openFeedback:0};
 for(const outcome of evidence.outcomes){const entry=current.entries[outcome.row.key];counts[entry?.category??'unassessed']++;if(entry?.feedback==='open'&&entry.note.trim())counts.openFeedback++;}
 return counts;
}
