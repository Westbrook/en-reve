import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EditorExtensionRegistry,EditorQueryTask,EditorBookmarks} from '../dist/interactions/editor-extensions.js';
test('replacement disposers cannot remove a newer provider; matching validates boundaries and ranges',()=>{
 const removed=[];const registry=new EditorExtensionRegistry(previous=>removed.push(previous));
 const a={id:'references',trigger:'@'},b={...a};const remove=registry.register(a);registry.register(b);remove();assert.equal(registry.get(a.id),b);
 assert.equal(registry.match('mail@example.com'),undefined);assert.equal(registry.match('hello @Al').query,'Al');assert.equal(registry.match('@Al x'),undefined);
 registry.register({id:'invalid',trigger:'#',match:()=>({from:-1,query:''})});assert.equal(registry.match('#'),undefined);
});
test('provider work is aborted on replacement and ignores late results and rejection',async()=>{
 const task=new EditorQueryTask(),results=[];let resolve,reject;
 const first=task.start('old',()=>new Promise(r=>resolve=r),x=>results.push(x),()=>results.push('error'));
 await Promise.resolve();task.start('new',()=>Promise.resolve('new'),x=>results.push(x),()=>{});assert.equal(first.signal.aborted,true);resolve('old');await new Promise(r=>setTimeout(r));assert.deepEqual(results,['new']);
 task.start('bad',()=>new Promise((_,r)=>reject=r),()=>{},()=>results.push('error'));await Promise.resolve();task.cancel();reject(Error());await new Promise(r=>setTimeout(r));assert.deepEqual(results,['new']);
});
test('bookmarks reject forged, cross-editor and stale selections',()=>{
 const first=new EditorBookmarks(),second=new EditorBookmarks();const selection={anchor:1,focus:4};const bookmark=first.capture(3,selection);
 assert.equal(first.resolve(bookmark,3),selection);assert.equal(first.resolve(bookmark,4),undefined);assert.equal(second.resolve(bookmark,3),undefined);assert.equal(first.resolve({revision:3},3),undefined);assert.ok(Object.isFrozen(bookmark));
});

test('registering the same provider object twice still gives independent disposal leases',()=>{const r=new EditorExtensionRegistry();const e={id:'same',trigger:'@'};const first=r.register(e);const second=r.register(e);first();assert.equal(r.get('same'),e);second();assert.equal(r.get('same'),undefined);});

test('known multiword commands admit only exact prefixes and reject paths, escapes and unknown names',async()=>{
 const {createEditorCommandMatcher}=await import('../dist/interactions/editor-extensions.js');
 const match=createEditorCommandMatcher(['insert table','inspect','help']);
 for(const query of ['','i','ins','insert ','insert t','insert table','HELP'])assert.deepEqual(match('Draft /'+query),{from:6,query});
 for(const input of ['\\/help','https://help','/tmp/help','./help','~/help','a/help','/unknown','/insert toast','/help more','/insert\ntable','/insert\ttable'])assert.equal(match(input),undefined,input);
 const mutable=['hello'];const stable=createEditorCommandMatcher(mutable);mutable.push('other');assert.equal(stable('/other'),undefined);
 assert.throws(()=>createEditorCommandMatcher([' bad']));assert.throws(()=>createEditorCommandMatcher(['ok'],''));
});
