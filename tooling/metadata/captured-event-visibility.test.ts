import {checkCapturedFactoryAnnotationScope,capturedFactoryAnnotationSemantics} from './captured-annotation-scope.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {checkCapturedEventVisibility,assertCapturedEventVisibility} from './captured-event-visibility.ts';
import {ts} from './compiler-api.mjs';
import {createCapturedCompilerProgram} from './captured-compiler-program.ts';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {factory,fixture as rawFixture,event,valid} from './captured-factory-event-fixtures.ts';

const semanticPrecondition=(program:any)=>assert.deepEqual(program.getSemanticDiagnostics().map((diagnostic:any)=>({code:diagnostic.code,text:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')})),[]);
const fixture=(code:string,run:(f:any)=>unknown)=>rawFixture(code,f=>{semanticPrecondition(f.program);return run(f);});

test('event visibility checks original generic and instantiated public detail identities',async()=>fixture(factory(event,valid),f=>{
 const own=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag,f.leaf,2);
 assert.equal(own.receipt.scope,'factory-own-visibility');assert.equal(result.receipt.scope,'factory-occurrence-visibility');
 assert.ok(result.receipt.references.some((entry:any)=>entry.name==='Base'));
 assert.equal(assertCapturedEventVisibility(result,f.program,f.callable,f.owner,f.tag,f.leaf,2),true);
 assert.throws(()=>assertCapturedEventVisibility(own,f.program,f.callable,f.owner,f.tag,f.leaf,2),/Unknown captured event visibility/);
}));

test('event visibility rejects hidden primitive aliases before checker erasure',async()=>fixture(factory('CustomEvent<Hidden>',valid,'type Hidden=string;'),f=>{
 assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/unexported type or value: Hidden/);
}));

test('event visibility traverses exported detail members to hidden authored aliases',async()=>{
 const code=factory('CustomEvent<Detail>',valid).replace('export type Constructor','type Hidden=string;export interface Detail {value:Hidden};export type Constructor');
 await fixture(code,f=>assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/unexported type or value: Hidden/));
});

test('event visibility retains factory value parameter authority without calling it a module export',async()=>fixture(factory('CustomEvent<{constructor:typeof Parent}>',valid),f=>{
 const own=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag);assert.ok(own.receipt.references.some((entry:any)=>entry.name==='Parent'));assert.equal(own.assertOriginal(),true);
}));

test('event visibility rejects erased explicit hidden occurrence arguments and declaration defaults',async()=>{
 const explicit=factory('CustomEvent<U>',valid).replace('export function M<T extends Constructor>','type Hidden=string;export function M<T extends Constructor,U>').replace('M(Base)','M<typeof Base,Hidden>(Base)');
 await fixture(explicit,f=>assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag,f.leaf,2),/unexported type or value: Hidden/));
 const defaults=factory('CustomEvent<U>',valid).replace('export function M<T extends Constructor>','type Hidden=string;export function M<T extends Constructor,U=Hidden>');
 await fixture(defaults,f=>assert.throws(()=>checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag),/unexported type or value: Hidden/));
});

test('event visibility rejects copied proofs and detects original annotation mutation',async()=>fixture(factory(event,valid),f=>{
 const result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag);assert.throws(()=>assertCapturedEventVisibility({...result},f.program,f.callable,f.owner,f.tag),/Unknown captured/);
 f.tag.tagName.escapedText='changed';assert.throws(result.assertOriginal,/changed/);
}));



test('event visibility unwraps only the exact private compiler probe alias while retaining original target references',async()=>fixture(factory(event,valid),f=>{
 const annotation=checkCapturedFactoryAnnotationScope(f.program,f.callable,f.owner,f.tag),semantic=capturedFactoryAnnotationSemantics(annotation,f.program,f.callable,f.owner,f.tag),alias=semantic.probe.typeNode.parent;
 assert.ok(ts.isTypeAliasDeclaration(alias));assert.equal(semantic.type.aliasSymbol===semantic.checker.getSymbolAtLocation(alias.name),true,'precondition: compiler attaches the private alias to the deferred event reference');
 assert.throws(()=>semantic.probe.mapOriginalSymbols([semantic.type.aliasSymbol]),/exact original overlay node/,'synthetic declarations must remain unmappable');
 const result=checkCapturedEventVisibility(f.program,f.callable,f.owner,f.tag);assert.ok(result.receipt.references.some((entry:any)=>entry.name==='CustomEvent'));assert.ok(result.receipt.references.some((entry:any)=>entry.name==='T'));assert.equal(result.receipt.references.some((entry:any)=>entry.name.startsWith('__cem_probe_')),false);
}));
