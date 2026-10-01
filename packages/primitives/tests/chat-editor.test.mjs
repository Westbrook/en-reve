import test from 'node:test';
import assert from 'node:assert/strict';
import {registerChatEditor,getChatEditorAdapter,snapshotChatEditor,snapshotEditorData} from '../dist/interactions/chat-editor.js';
test('explicit registration and old disposal never remove a newer adapter',()=>{
 const element={};const one={value:'one'},two={value:'two'};assert.equal(getChatEditorAdapter(element),undefined);const removeOne=registerChatEditor(element,one);const removeTwo=registerChatEditor(element,two);removeOne();assert.equal(getChatEditorAdapter(element),two);removeTwo();assert.equal(getChatEditorAdapter(element),undefined);
});
test('snapshots detach nested data and freeze every container',()=>{
 const content={version:1,tokens:[{id:'one',data:{color:'#123456'}}]};const data=snapshotChatEditor({value:'#123456',content});content.tokens[0].data.color='changed';assert.equal(data.content.tokens[0].data.color,'#123456');assert(Object.isFrozen(data.content.tokens[0].data));assert.throws(()=>{data.content.tokens.push({});});assert.deepEqual(snapshotChatEditor({value:'plain'}),{value:'plain'});
});
test('invalid snapshot values, cycles, getters and executable/live objects are rejected',()=>{
 const cycle={};cycle.self=cycle;
 for(const content of [cycle,{a:NaN},{a:undefined},{a:()=>{}},new Date(),{get a(){throw new Error('getter ran');}},[undefined]])assert.throws(()=>snapshotChatEditor({value:'draft',content}),TypeError);
 assert.throws(()=>snapshotChatEditor({value:3}),TypeError);
});
test('repeated noncyclic references are copied and special keys stay data',()=>{
 const a={id:'one'};const content=JSON.parse('{"__proto__":{"safe":true}}');content.items=[a,a];const data=snapshotChatEditor({value:'',content});assert.equal(Object.getPrototypeOf(data.content),Object.prototype);assert.equal(data.content.__proto__.safe,true);assert.deepEqual(data.content.items,[a,a]);
});

test('action data snapshots preserve JSON primitives and reject invalid nested payloads',()=>{
 for(const value of [null,true,false,0,12.5,'text']) assert.equal(snapshotEditorData(value),value);
 const input={nested:[{id:'original'}]};const result=snapshotEditorData(input);
 input.nested[0].id='changed';assert.equal(result.nested[0].id,'original');
 assert(Object.isFrozen(result.nested[0]));assert.notEqual(result.nested,input.nested);
 const cycle=[];cycle.push(cycle);
 for(const invalid of [undefined,Infinity,cycle,{bad:undefined},{get bad(){throw new Error('getter executed');}}]) assert.throws(()=>snapshotEditorData(invalid),TypeError);
});
