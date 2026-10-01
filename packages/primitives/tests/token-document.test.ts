import test from 'node:test';
import assert from 'node:assert/strict';
import {EditorDocument,type Run} from '../dist/state/token-document.js';
const token=(id='one'):Run=>({kind:'token',id,type:'app/reference',text:'@Mira',label:'Mira, reference',data:{entityId:'person-1'}});
test('insertion, immutable structured snapshots and unknown type identity',()=>{
 const model=new EditorDocument([{kind:'text',text:'Hi '}]);model.select({anchor:3,focus:3});const item=token();assert.equal(model.replace([item]),'committed');const snapshot=model.snapshot();(item as any).data.entityId='other';assert.equal(model.value,'Hi @Mira');assert.equal((model.document.runs[1] as any).data.entityId,'person-1');model.reset([{kind:'text',text:'next'}]);assert.equal(snapshot.value,'Hi @Mira');assert(Object.isFrozen(snapshot.content));
});
test('tokens and graphemes cannot be split by selection or deletion',()=>{
 const model=new EditorDocument([{kind:'text',text:'👩🏽‍💻é'},token()]);const caret=model.value.length;model.select({anchor:caret,focus:caret});model.delete('backward');assert.equal(model.value,'👩🏽‍💻é');model.delete('backward');assert.equal(model.value,'👩🏽‍💻');model.delete('backward');assert.equal(model.value,'');model.undo();assert.equal(model.value,'👩🏽‍💻');
});
test('backward ranges preserve direction and expand atomic boundaries',()=>{
 const model=new EditorDocument([{kind:'text',text:'a'},token(),{kind:'text',text:'z'}]);model.select({anchor:4,focus:2});assert.deepEqual(model.selection,{anchor:6,focus:1});model.replace([{kind:'text',text:'b'}]);assert.equal(model.value,'abz');model.undo();assert.deepEqual(model.selection,{anchor:6,focus:1});
});
test('canceling edit or undo restores model, selection and history',()=>{
 const model=new EditorDocument();model.replace([token()]);const selection=model.selection;const stop=(e:Event)=>e.preventDefault();model.addEventListener('en-change',stop);assert.equal(model.undo(),'canceled');assert.equal(model.value,'@Mira');assert.deepEqual(model.selection,selection);assert.equal(model.canUndo,true);assert.equal(model.canRedo,false);model.removeEventListener('en-change',stop);model.undo();assert.equal(model.value,'');model.redo();assert.equal(model.value,'@Mira');
});
test('new author writes supersede canceled transactions and stale async targets',()=>{
 const model=new EditorDocument();const revision=model.revision;model.addEventListener('en-change',e=>{model.reset([{kind:'text',text:'author'}]);e.preventDefault();},{once:true});assert.equal(model.replace([token()]),'superseded');assert.equal(model.value,'author');assert.equal(model.canUndo,false);assert.equal(model.replace([token()],revision),'stale');
});
test('accepted nested transactions win and retain meaningful history',()=>{
 const model=new EditorDocument();model.addEventListener('en-change',()=>{model.replace([{kind:'text',text:'nested'}]);},{once:true});assert.equal(model.replace([{kind:'text',text:'outer'}]),'superseded');assert.equal(model.value,'outernested');model.undo();assert.equal(model.value,'outer');
});
test('duplicate token IDs and invalid token data are rejected without mutation',()=>{
 const model=new EditorDocument();assert.throws(()=>model.replace([token(),token()]));assert.equal(model.value,'');assert.throws(()=>model.replace([{...token(),data:{number:NaN}} as Run]));assert.equal(model.revision,0);
});
test('editing after undo discards only the redo branch',()=>{
 const model=new EditorDocument();model.replace([{kind:'text',text:'a'}]);model.replace([{kind:'text',text:'b'}]);model.undo();model.replace([{kind:'text',text:'c'}]);assert.equal(model.value,'ac');assert.equal(model.canRedo,false);model.undo();assert.equal(model.value,'a');
});

test('history retains the most recent hundred edits',()=>{
 const model=new EditorDocument();for(let i=0;i<105;i++)model.replace([{kind:'text',text:'x'}]);
 for(let i=0;i<100;i++)assert.equal(model.undo(),'committed');
 assert.equal(model.value,'xxxxx');assert.equal(model.undo(),'unchanged');
 for(let i=0;i<100;i++)assert.equal(model.redo(),'committed');assert.equal(model.value.length,105);
});
