import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorClipboardType,readEditorClipboard,writeEditorClipboard,importClipboardRuns,sliceClipboardRuns,boundedClipboardJSON} from '../dist/interactions/editor-clipboard.js';
const token={kind:'token',id:'ref-1',type:'reference',text:'@Cover',label:'Cover',data:{key:17}};
const read=value=>readEditorClipboard({getData:type=>type===editorClipboardType?value:''});
test('clipboard round trip validates versioned detached token data and preserves text fallback',()=>{
 const data=new Map();assert.equal(writeEditorClipboard({setData:(key,value)=>data.set(key,value)},[{kind:'text',text:'See '},token]),true);
 assert.equal(data.get('text/plain'),'See @Cover');const result=read(data.get(editorClipboardType));assert.equal(result.version,1);assert.deepEqual(result.runs,[{kind:'text',text:'See '},token]);assert.ok(Object.isFrozen(result.runs));
 const pasted=importClipboardRuns(result.runs,type=>type==='reference');assert.notEqual(pasted[1].id,token.id);assert.deepEqual(pasted[1].data,token.data);assert.notEqual(importClipboardRuns(result.runs,()=>true)[1].id,pasted[1].id);
 assert.deepEqual(importClipboardRuns([token],()=>false),[{kind:'text',text:'@Cover'}]);
});
test('partial clipboard text slicing respects atomic tokens',()=>{assert.deepEqual(sliceClipboardRuns([{kind:'text',text:'Hello '},token,{kind:'text',text:' friend'}],3,15),[{kind:'text',text:'lo '},token,{kind:'text',text:' fr'}]);});
test('clipboard rejects unsupported versions, invalid token schemas, duplicate IDs and excessive depth/size',()=>{
 const wrap=runs=>JSON.stringify({type:'en-editor-clipboard',version:1,runs});
 for(const invalid of ['{bad','{}',JSON.stringify({type:'en-editor-clipboard',version:2,runs:[]}),wrap([token,token]),wrap([{...token,label:1}]),wrap([{...token,data:undefined}]),wrap([{kind:'text',text:1}]),wrap([{kind:'text',text:'x'.repeat(1_000_001)}])])assert.equal(read(invalid),undefined);
 assert.throws(()=>boundedClipboardJSON('['.repeat(42)+'0'+']'.repeat(42)));
});
test('unsupported custom MIME keeps plain text while failure writing plain text rejects ownership',()=>{
 const data=new Map();assert.equal(writeEditorClipboard({setData:(key,value)=>{if(key!== 'text/plain')throw Error('Not supported');data.set(key,value);}},[token]),true);assert.equal(data.get('text/plain'),'@Cover');
 assert.equal(writeEditorClipboard({setData:()=>{throw Error('unavailable');}},[token]),false);
});

test('fresh IDs exclude every source, destination and transformed ID at a fixed clock',()=>{
 const old=Date.now;Date.now=()=>1000;
 try{const sources=Array.from({length:30},(_,i)=>({...token,id:`paste-rs-${i+1}`}));const used=new Set(['paste-rs-31']);const imported=importClipboardRuns(sources,()=>true,used,run=>({...run,id:'paste-rs-32'}));
 assert.equal(new Set(imported.map(r=>r.id)).size,30);for(const run of imported)assert.ok(!new Set([...sources.map(s=>s.id),...used,'paste-rs-32']).has(run.id));}finally{Date.now=old;}
});
test('original occurrences and shared paste scope allow repeated-reference reconciliation',()=>{
 const scopes=new WeakMap(),contexts=[];let count=0;
 const hook=(run,context)=>{contexts.push(context);let references=scopes.get(context.scope);if(!references)scopes.set(context.scope,references=new Map());if(!references.has(run.data.key))references.set(run.data.key,++count);return {...run,data:{key:references.get(run.data.key)}};};
 const source=[token,{...token,id:'second'}];const result=importClipboardRuns(source,()=>true,new Set(),hook);
 assert.deepEqual(contexts.map(c=>c.sourceId),['ref-1','second']);assert.equal(contexts[0].scope,contexts[1].scope);assert.ok(Object.isFrozen(contexts[0].sourceTokens[0].data));assert.equal(result[0].data.key,result[1].data.key);
 importClipboardRuns(source,()=>true,new Set(),hook);assert.notEqual(contexts[0].scope,contexts[2].scope);assert.equal(count,2);
 assert.deepEqual(importClipboardRuns([token],()=>true,new Set(),()=>undefined),[{kind:'text',text:'@Cover'}]);
});
test('hook errors and invalid transformed results abort structured import',()=>{
 for(const hook of [()=>{throw Error('hook');},()=>null,()=>({kind:'text',text:'wrong'}),r=>({...r,label:9}),r=>({...r,data:()=>{}})])assert.throws(()=>importClipboardRuns([token],()=>true,new Set(),hook));
 assert.deepEqual(importClipboardRuns([token],type=>type==='reference',new Set(),r=>({...r,type:'unregistered'})),[{kind:'text',text:'@Cover'}]);
});
