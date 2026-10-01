import assert from 'node:assert/strict';
import { resolve, relative } from 'node:path';
import { realpathSync } from 'node:fs';

/** Native Node outcomes, attributed to the entry source rather than guessed from TAP titles. */
export function validateNodeEvents({events,sources,root,allowSourceSelection=false}) {
 try{root=realpathSync(root);}catch(error){if(error.code!=='ENOENT')throw error;}
 const expected=new Map(sources.map(source=>[resolve(root,source),source]));
 assert.equal(expected.size,sources.length,'Duplicate Node assertion source');
 const observed=new Map(events.filter(event=>event.type==='test:summary'&&(event.data?.entryFile||event.data?.file)).map(event=>{
  const file=resolve(root,event.data.entryFile??event.data.file);return [file,expected.get(file)??relative(root,file)];
 }));
 const selected=allowSourceSelection?observed:expected;
 const unexecutedSources=[...expected].filter(([file])=>!selected.has(file)).map(([,source])=>source);
 const additionalSources=[...selected].filter(([file])=>!expected.has(file)).map(([,source])=>source);
 const files=new Map([...selected].map(([file,source])=>[file,{source,cases:[],summary:null}])),seen=new Set();
 let summary;
 for(const event of events){
  if(!['test:pass','test:fail','test:summary'].includes(event.type))continue;
  const data=event.data;assert(data&&typeof data==='object','Malformed native Node event');
  if(event.type==='test:summary'&&!data.entryFile&&!data.file){assert(!summary,'Duplicate aggregate Node summary');summary=data;continue;}
  const entry=data.entryFile??data.file;assert(entry,'Node event has no source attribution');
  const row=files.get(resolve(root,entry));assert(row,'Unexpected Node entry source: '+entry);
  if(event.type==='test:summary'){assert(!row.summary,'Duplicate Node source summary');row.summary=data;continue;}
  assert(Number.isInteger(data.testId)&&data.testId>0,'Missing native Node case identity');
  const key=entry+':'+data.testId;assert(!seen.has(key),'Duplicate terminal Node case outcome');seen.add(key);
  assert(typeof data.name==='string'&&Number.isFinite(data.details?.duration_ms),'Incomplete Node case outcome');
  row.cases.push({id:key,name:data.name,parentId:data.parentId,nesting:data.nesting,source:data.file?relative(root,data.file):null,line:data.line,column:data.column,
   type:data.details.type,skip:data.skip??false,todo:data.todo??false,status:data.skip?'skipped':data.todo?'todo':event.type==='test:pass'?'passed':'failed',durationMs:data.details.duration_ms,error:data.details.error??null});
 }
 assert(summary&&typeof summary.success==='boolean','Missing completed aggregate Node summary');
 const keys=['tests','passed','failed','cancelled','skipped','todo','suites'];
 for(const row of files.values()){
  assert(row.summary&&typeof row.summary.success==='boolean','Missing completed Node source: '+row.source);
  for(const key of keys)assert(Number.isInteger(row.summary.counts?.[key])&&row.summary.counts[key]>=0,'Incomplete source counts: '+key);
  const cases=row.cases.filter(item=>item.type!=='suite');
  assert.equal(cases.length,row.summary.counts.tests,'Terminal case selection/count mismatch: '+row.source);
  assert.equal(row.cases.filter(item=>item.type==='suite').length,row.summary.counts.suites,'Suite selection/count mismatch');
  assert.equal(cases.filter(item=>item.status==='passed').length,row.summary.counts.passed,'Passing case count mismatch');
  assert.equal(cases.filter(item=>item.status==='skipped').length,row.summary.counts.skipped,'Skipped case count mismatch');
  assert.equal(cases.filter(item=>item.status==='todo').length,row.summary.counts.todo,'Todo case count mismatch');
  assert.equal(cases.filter(item=>item.status==='failed').length,row.summary.counts.failed+row.summary.counts.cancelled,'Failed/cancelled case count mismatch');
  if(row.summary.success)assert.equal(row.summary.counts.failed+row.summary.counts.cancelled,0,'Successful source summary hides a failure');
  row.maximumCaseMs=Math.max(0,...cases.map(item=>item.durationMs));
 }
 for(const key of keys)assert.equal([...files.values()].reduce((sum,row)=>sum+row.summary.counts[key],0),summary.counts?.[key],'Aggregate Node count mismatch: '+key);
 if(summary.success)assert([...files.values()].every(row=>row.summary.success),'Aggregate success hides a failed source');
 return {schemaVersion:1,scope:allowSourceSelection?'caller-selected-sources':'declared-sources',requestedSources:sources,unexecutedSources,additionalSources,status:summary.success?'passed':'failed',counts:summary.counts,maximumCaseMs:Math.max(0,...[...files.values()].map(row=>row.maximumCaseMs)),sources:[...files.values()]};
}
