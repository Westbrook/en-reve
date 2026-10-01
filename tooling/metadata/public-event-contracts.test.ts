import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {digestJson} from '../evidence/identity.ts';
import {completeConstructorComposition,constructorCompositionKey} from './constructor-composition-contract.ts';
import {finalizeCustomization} from './finalize-customization.ts';
import {createPublicEventContractResolver,effectivePublicEventContracts} from './public-event-contracts.ts';
const descriptor=(module:string,start:number)=>({version:1,module,sourceSha256:'a'.repeat(64),kind:264,start,pos:start,end:start+10});
const portable=(source:any)=>({file:{kind:'selected-source',path:source.module},...source});
function fixture() {
  const root=descriptor('src/root.ts',0),origin=descriptor('src/mixin.ts',10),inner=descriptor('src/root.ts',20),outer=descriptor('src/root.ts',40);
  const event={name:'changed',type:{text:'CustomEvent<string>'},inheritedFrom:{name:'M',module:'src/mixin.ts'}};
  const declaration:any={kind:'class',name:'Leaf',events:[event],superclass:{name:'HTMLElement'},mixins:[{name:'M',module:'src/mixin.ts'},{name:'M',module:'src/mixin.ts'}]};
  const marker=completeConstructorComposition(declaration,'src/root.ts',{version:1,root,steps:[
    {index:0,kind:'terminal',terminal:{ownership:'platform',reference:{name:'HTMLElement'}},contexts:[]},
    {index:1,kind:'application',origin,application:inner,contexts:[{kind:'application',source:outer}]},
    {index:2,kind:'application',origin,application:outer,contexts:[]},
    {index:3,kind:'class',origin:root,contexts:[]},
  ],omissions:[]});declaration[constructorCompositionKey]=marker;
  const proof:any={module:'src/root.ts',declaration:'Leaf',facet:'events',key:'changed',origin:portable(origin),step:2,contexts:[],
    emittedSha256:createHash('sha256').update(JSON.stringify(event)).digest('hex'),eventContract:{type:'CustomEvent<string>',detail:'string'}};
  const contract:any={name:'changed',source:'src/root.ts',className:'Leaf',type:'CustomEvent<string>',detail:'string',
    composition:{version:1,root,compositionDigest:digestJson(marker),facetProofDigest:digestJson(proof)}};
  const receipt:any={eventContracts:[contract],constructorComposition:{version:1,route:'exact-declaration-hybrid',proofs:{portableFormat:'source-owned-constructor-proofs-v1',facets:[proof]}}};
  const resolved={modulePath:'src/root.ts',declaration};
  return {root,origin,inner,outer,event,marker,proof,contract,receipt,resolved,read:()=>createPublicEventContractResolver(receipt,()=>{throw new Error('composed event must not use ordinary name fallback');})(resolved,event)};
}

test('public effective event joins its exact root and unique surviving repeated-application facet',()=>{
  const f=fixture(),before=structuredClone(f.receipt);assert.equal(f.read(),f.contract);assert.equal(f.proof.step,2);assert.deepEqual(f.receipt,before);
});

test('public effective event rejects a binding to an earlier repeated application',()=>{
  const f=fixture();f.contract.composition.facetProofDigest=digestJson({...f.proof,step:1,contexts:[{kind:'application',source:portable(f.outer)}]});
  assert.throws(f.read,/surviving occurrence proof/);
});

test('public effective event rejects duplicate final contracts and duplicate facet proofs',()=>{
  let f=fixture();f.receipt.eventContracts.push(structuredClone(f.contract));assert.throws(f.read,/Duplicate typed event contract/);
  f=fixture();const ordinary={...f.contract};delete ordinary.composition;f.receipt.eventContracts.push(ordinary);assert.throws(f.read,/Duplicate typed event contract/);
  f=fixture();f.receipt.constructorComposition.proofs.facets.push(structuredClone(f.proof));assert.throws(f.read,/one surviving facet proof/);
});

test('public effective event never falls back to a factory or root ordinary annotation',()=>{
  for(const source of ['src/mixin.ts','src/root.ts']) {
    const f=fixture();f.receipt.eventContracts=[{name:'changed',source,className:source.includes('mixin')?'M':'Leaf',type:'CustomEvent<string>',detail:'string'}];
    assert.throws(f.read,/exact effective root contract/);
  }
});

test('public effective event rejects stale root composition event and payload evidence',()=>{
  const mutations=[
    (f:any)=>{f.contract.composition.root={...f.root,start:1};},
    (f:any)=>{f.contract.composition.compositionDigest='sha256:'+'0'.repeat(64);},
    (f:any)=>{f.proof.emittedSha256='0'.repeat(64);},
    (f:any)=>{f.contract.detail='number';},
    (f:any)=>{f.contract.type='CustomEvent<number>';},
    (f:any)=>{f.proof.origin.file.path='src/unrelated.ts';},
    (f:any)=>{f.proof.contexts=[{kind:'application',source:portable(f.outer)}];},
  ];
  for(const mutate of mutations){const f=fixture();mutate(f);assert.throws(f.read,/effective root contract|occurrence proof|selected source owner/);}
});

test('public effective event rejects missing portable packet and untyped emitted events',()=>{
  let f=fixture();delete f.receipt.constructorComposition;assert.throws(f.read,/exact effective root contract/);
  f=fixture();delete f.proof.eventContract;f.contract.composition.facetProofDigest=digestJson(f.proof);assert.throws(f.read,/surviving occurrence proof/);
  f=fixture();f.event.type.text='CustomEvent';f.resolved.declaration[constructorCompositionKey]=completeConstructorComposition(f.resolved.declaration,'src/root.ts',
    {version:1,root:f.marker.root,steps:f.marker.steps,omissions:[]});assert.throws(f.read,/Unclassified or untyped public event/);
});

test('ordinary public events preserve declaring scope precedence and exact root fallback',()=>{
  const base={modulePath:'src/base.ts',declaration:{kind:'class',name:'Base'}},child={modulePath:'src/child.ts',declaration:{kind:'class',name:'Child'}};
  const inherited={name:'changed',type:{text:'CustomEvent<string>'},inheritedFrom:{name:'Base',module:'src/base.ts'}};
  const first={name:'changed',source:'src/base.ts',className:'Base',type:'CustomEvent<string>',detail:'string'};
  const second={name:'changed',source:'src/child.ts',className:'Child',type:'CustomEvent<number>',detail:'number'};
  let read=createPublicEventContractResolver({eventContracts:[first,second]},()=>base);assert.equal(read(child,inherited),first);
  read=createPublicEventContractResolver({eventContracts:[second]},()=>base);assert.equal(read(child,inherited),second);
});

test('ordinary public event contracts reject ambiguity and missing typed payloads',()=>{
  const row={name:'changed',source:'src/base.ts',className:'Base',type:'CustomEvent<string>',detail:'string'};
  assert.throws(()=>createPublicEventContractResolver({eventContracts:[row,{...row,detail:'number'}]},()=>undefined),/Duplicate typed event contract/);
  assert.throws(()=>createPublicEventContractResolver({eventContracts:[{...row,detail:''}]},()=>undefined),/typed payload/);
});


test('effective table derives its final contract from the unique surviving proof and validates agreement',()=>{
 const f=fixture(),manifest={modules:[{path:'src/root.ts',declarations:[f.resolved.declaration]}]};
 const table=effectivePublicEventContracts(manifest,f.receipt);
 assert.deepEqual(table.roots,[{source:'src/root.ts',className:'Leaf',public:false}]);assert.deepEqual(table.contracts,[f.contract]);
 f.proof.eventContract.detail='number';
 // A fresh producer must authenticate the proof; this helper only establishes
 // agreement and faithfully retains its changed detail in the derived table.
 assert.equal(effectivePublicEventContracts(manifest,f.receipt).contracts[0].detail,'number');
 f.proof.eventContract.type='CustomEvent<number>';assert.throws(()=>effectivePublicEventContracts(manifest,f.receipt),/occurrence proof/);
});

test('effective table retains zero-event roots and excludes private events without ordinary fallback',()=>{
 const f=fixture();f.resolved.declaration.events=[];
 f.resolved.declaration[constructorCompositionKey]=completeConstructorComposition(f.resolved.declaration,'src/root.ts',
  {version:1,root:f.marker.root,steps:f.marker.steps,omissions:[]});
 const result=effectivePublicEventContracts({modules:[{path:'src/root.ts',declarations:[f.resolved.declaration]}]},f.receipt);
 assert.equal(result.roots.length,1);assert.deepEqual(result.contracts,[]);
 const privateFixture=fixture();(privateFixture.event as any).privacy='private';
 privateFixture.resolved.declaration[constructorCompositionKey]=completeConstructorComposition(privateFixture.resolved.declaration,'src/root.ts',
  {version:1,root:privateFixture.marker.root,steps:privateFixture.marker.steps,omissions:[]});
 assert.deepEqual(effectivePublicEventContracts({modules:[{path:'src/root.ts',declarations:[privateFixture.resolved.declaration]}]},privateFixture.receipt).contracts,[]);
});

test('effective table refuses missing payload proof and duplicate final proof rows',()=>{
 const f=fixture(),manifest={modules:[{path:'src/root.ts',declarations:[f.resolved.declaration]}]};
 delete f.proof.eventContract;assert.throws(()=>effectivePublicEventContracts(manifest,f.receipt),/unique validated typed payload/);
 const g=fixture();g.receipt.constructorComposition.proofs.facets.push(structuredClone(g.proof));
 assert.throws(()=>effectivePublicEventContracts({modules:[{path:'src/root.ts',declarations:[g.resolved.declaration]}]},g.receipt),/unique validated typed payload/);
});


test('effective event contracts bind the final customization-enriched composition marker',()=>{
 const f=fixture();f.resolved.declaration.tagName='x-leaf';f.resolved.declaration.customElement=true;
 f.resolved.declaration.cssProperties=[{name:'--control-color'}];
 f.resolved.declaration[constructorCompositionKey]=completeConstructorComposition(f.resolved.declaration,'src/root.ts',
  {version:1,root:f.marker.root,steps:f.marker.steps,omissions:[]});
 const raw={modules:[{path:'src/root.ts',declarations:[f.resolved.declaration]}]};
 const before=effectivePublicEventContracts(raw,f.receipt);
 const finalized=finalizeCustomization(raw,[{cssName:'--control-color',kind:'value',family:'control',reset:'initial',managed:true}]);
 const table=effectivePublicEventContracts(finalized.manifest,f.receipt),declaration=finalized.manifest.modules[0].declarations[0];
 assert.equal(finalized.enrichment.changes.length,1);assert.notEqual(table.contracts[0].composition.compositionDigest,before.contracts[0].composition.compositionDigest);
 const resolve=createPublicEventContractResolver({...f.receipt,eventContracts:table.contracts},()=>undefined);
 assert.equal(resolve({modulePath:'src/root.ts',declaration},declaration.events[0]),table.contracts[0]);
 const stale=createPublicEventContractResolver({...f.receipt,eventContracts:before.contracts},()=>undefined);
 assert.throws(()=>stale({modulePath:'src/root.ts',declaration},declaration.events[0]),/effective root contract/);
});
