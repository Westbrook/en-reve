import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeToastMax,toastWindow} from '../../packages/primitives/dist/interactions/toast-stack.js';
test('limits normalize positive finite values and use zero for unbounded admission',()=>{
 for(const [input,expected] of [[3,3],[3.9,3],['2',2],[0,0],[-1,0],[NaN,0],[Infinity,0],[null,0],['invalid',0]])assert.equal(normalizeToastMax(input),expected);
});
test('ordinary admission preserves input order without mutating the source',()=>{
 const rows=Object.freeze(['a','b','c']);assert.deepEqual([...toastWindow(rows,2,()=>false)],['a','b']);assert.deepEqual(rows,['a','b','c']);
});
test('interrupt admission is distinct from original DOM ordering',()=>{
 const rows=['a','b','urgent'];assert.deepEqual([...toastWindow(rows,2,x=>x==='urgent')],['urgent','a']);assert.deepEqual(rows,['a','b','urgent']);
});
test('focused entries precede interrupts but a maximum still bounds admission',()=>{
 const rows=['a','b','urgent'];assert.deepEqual([...toastWindow(rows,1,x=>x==='urgent',x=>x==='b')],['b']);assert.deepEqual([...toastWindow(rows,1,()=>true,()=>true)],['a']);
});
test('admission deduplicates object identity rather than application ids',()=>{
 const a={id:'a'},alias={id:'a'};assert.deepEqual([...toastWindow([a,a,alias],0,()=>false)],[a,alias]);
});
test('empty and unlimited inputs need no document or custom element registry',()=>{
 assert.deepEqual([...toastWindow([],3,()=>true)],[]);assert.deepEqual([...toastWindow(['a','b'],0,()=>false)],['a','b']);assert.deepEqual([...toastWindow(['a','b'],9,()=>true)],['a','b']);
});
