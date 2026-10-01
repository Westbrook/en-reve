import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotCem,diffCem} from './cem-diff.ts';
import {completeConstructorComposition,constructorCompositionKey,readConstructorComposition} from '../metadata/constructor-composition-contract.ts';

const reference=(name:string,module='main.ts')=>({name,module});
const descriptor=(module:string,offset=0)=>({version:1,module,sourceSha256:'a'.repeat(64),kind:264,pos:offset,start:offset,end:offset+10});
const mark=(declaration:any,module='main.ts')=>{
 const root=descriptor(module);
 declaration[constructorCompositionKey]=completeConstructorComposition(declaration,module,{version:1,root,steps:[{index:0,kind:'class',origin:root,contexts:[]}],omissions:[]});
 return declaration;
};
const manifest=(declarations:any[],exports:any[]=[])=>({schemaVersion:'2.1.0',modules:[{path:'main.ts',declarations,exports}]});
const element=(input:any,tag='en-leaf')=>snapshotCem(input).elements.get(tag)!;
const row=(name:string,extra:any={})=>({kind:'class',name,...extra});
const field=(name:string,extra:any={})=>({kind:'field',name,type:{text:'string'},...extra});
const method=(name:string,extra:any={})=>({kind:'method',name,parameters:[],return:{type:{text:'void'}},...extra});

test('complete final facets never resurrect omitted inherited contracts across seven collections',()=>{
 const base=row('Base',{members:[field('value')],attributes:[{name:'value'}],events:[{name:'change'}],slots:[{name:''}],cssParts:[{name:'panel'}],cssProperties:[{name:'--tone'}],cssStates:[{name:'active'}]});
 const leaf=mark(row('Leaf',{tagName:'en-leaf',superclass:reference('Base')}));
 const result=element(manifest([base,leaf]));assert.deepEqual([...result.surfaces.keys()],['declaration:en-leaf']);
});

test('complete subtrees preserve independent earlier contributions under a legacy child',()=>{
 const base=row('Base',{members:[field('keep')]});
 const ancestor=row('Ancestor',{members:[field('removed')]});
 const mixed=mark(row('Mixed',{superclass:reference('Ancestor'),members:[field('mixed')]}));
 const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Base'),mixins:[reference('Mixed')]});
 const surfaces=element(manifest([base,ancestor,mixed,leaf])).surfaces;
 assert.ok(surfaces.has('property:keep'));assert.ok(surfaces.has('property:mixed'));assert.equal(surfaces.has('property:removed'),false);
});

test('legacy descendants inherit a complete base without resurrecting its legacy ancestor',()=>{
 const ancestor=row('Ancestor',{cssParts:[{name:'gone'},{name:'keep'}]});
 const base=mark(row('Base',{superclass:reference('Ancestor'),cssParts:[{name:'keep',inheritedFrom:reference('Ancestor')}]}));
 const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Base')});
 const surfaces=element(manifest([ancestor,base,leaf])).surfaces;assert.ok(surfaces.has('css-part:keep'));assert.equal(surfaces.has('css-part:gone'),false);
});

test('private and protected overrides remain masks until final public projection',()=>{
 for(const complete of [false,true]){
  const base=row('Base',{members:[field('value'),method('run')],events:[{name:'change'}],attributes:[{name:'value'}]});
  const hidden=row('Hidden',{superclass:reference('Base'),members:[field('value',{privacy:'private'}),method('run',{privacy:'protected'})],events:[{name:'change',privacy:'private'}],attributes:[{name:'value',privacy:'private'}]});
  if(complete)mark(hidden);
  const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Hidden')});
  const surfaces=element(manifest([base,hidden,leaf])).surfaces;
  for(const key of ['property:value','method:run','event:change','attribute:value'])assert.equal(surfaces.has(key),false,key);
 }
});

test('a later public contract restores a privately masked member and omitted part',()=>{
 const base=row('Base',{members:[field('value')],cssParts:[{name:'panel'}]});
 const hidden=mark(row('Hidden',{superclass:reference('Base'),members:[field('value',{privacy:'private'})]}));
 const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Hidden'),members:[field('value',{default:'restored'})],cssParts:[{name:'panel',description:'restored'}]});
 const surfaces=element(manifest([base,hidden,leaf])).surfaces;
 assert.equal((surfaces.get('property:value')!.value as any).default,'restored');assert.equal((surfaces.get('css-part:panel')!.value as any).description,'restored');
});

test('method and field replacements use one slot while static and instance slots remain separate',()=>{
 const base=row('Base',{members:[field('value'),method('run'),field('value',{static:true})]});
 const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Base'),members:[method('value'),field('run')]});
 const surfaces=element(manifest([base,leaf])).surfaces;
 assert.equal(surfaces.has('property:value'),false);assert.ok(surfaces.has('method:value'));assert.equal(surfaces.has('method:run'),false);assert.ok(surfaces.has('property:run'));assert.ok(surfaces.has('property:static value'));
});

test('ordered repeated mixin contributions retain their final winner under legacy composition',()=>{
 const first=row('First',{members:[field('value',{default:'first'})]}),second=mark(row('Second',{members:[field('value',{default:'second'})]}));
 const leaf=row('Leaf',{tagName:'en-leaf',mixins:[reference('First'),reference('Second'),reference('First')]});
 assert.equal((element(manifest([first,second,leaf])).surfaces.get('property:value')!.value as any).default,'first');
});

test('complete lineage lookup never falls back from an unresolved module to another same-name declaration',()=>{
 const leaf=mark(row('Leaf',{tagName:'en-leaf',superclass:reference('Same','nested/base.ts')}),'nested/main.ts');
 const input={schemaVersion:'2.1.0',modules:[{path:'base.ts',declarations:[row('Same',{members:[field('wrong')]})]},{path:'nested/main.ts',declarations:[leaf]}]};
 const result=snapshotCem(input);assert.equal(result.elements.get('en-leaf')!.surfaces.has('property:wrong'),false);assert.ok(result.gaps.some(gap=>gap.includes('Same')));
});

test('complete lineage still reports cycles and unresolved external bases',()=>{
 const a=mark(row('A',{tagName:'en-leaf',superclass:reference('B')})),b=mark(row('B',{superclass:reference('A')}));
 assert.ok(snapshotCem(manifest([a,b])).gaps.some(gap=>gap.includes('Inheritance cycle')));
 const external=mark(row('Leaf',{tagName:'en-leaf',superclass:{name:'External',package:'library',module:'base.js'}}));
 assert.ok(snapshotCem(manifest([external])).gaps.some(gap=>gap.includes('External')));
});

test('module or package-owned native-name lookalikes do not suppress unresolved-base gaps',()=>{
 for(const reference of [{name:'HTMLElement',package:'library',module:'base.js'},{name:'Element',module:'missing.ts'}])for(const complete of [false,true]){
  const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference});if(complete)mark(leaf);
  assert.ok(snapshotCem(manifest([leaf])).gaps.length);
 }
 assert.deepEqual(snapshotCem(manifest([mark(row('Leaf',{tagName:'en-leaf',superclass:{name:'HTMLElement'}}))])).gaps,[]);
});

test('malformed partial and descriptive markers reject even on untagged declarations',()=>{
 const good=mark(row('Leaf',{members:[field('value')]}));
 const mutations=[
  (d:any)=>{d[constructorCompositionKey].version=1;},
  (d:any)=>{delete d[constructorCompositionKey].facets.events;},
  (d:any)=>{d[constructorCompositionKey].facets.extra='sha256:'+'a'.repeat(64);},
  (d:any)=>{d[constructorCompositionKey].declaration.name='Other';},
  (d:any)=>{d[constructorCompositionKey].root.module='other.ts';},
  (d:any)=>{d[constructorCompositionKey].steps[0].index=2;},
  (d:any)=>{d[constructorCompositionKey].steps[0]=null;},
  (d:any)=>{d[constructorCompositionKey].facets.members='sha256:'+'b'.repeat(64);},
  (d:any)=>{d.members[0].type.text='number';},
  (d:any)=>{d.members=null;},
  (d:any)=>{d.superclass=reference('Unbound');},
  (d:any)=>{d.kind='mixin';},
 ];
 for(const mutate of mutations){const changed=structuredClone(good);mutate(changed);assert.throws(()=>snapshotCem(manifest([changed])),/Invalid complete constructor composition contract/);}
});

test('provenance-only source changes do not create API facts but preserve distinct manifest digests',()=>{
 const before=manifest([mark(row('Leaf',{tagName:'en-leaf',members:[field('value')]}))],[{kind:'js',name:'Leaf',declaration:reference('Leaf')}]);
 const after=structuredClone(before),marker=after.modules[0].declarations[0][constructorCompositionKey];
 marker.root.sourceSha256='b'.repeat(64);marker.root.pos=10;marker.root.start=11;marker.root.end=21;marker.steps[0].origin=structuredClone(marker.root);
 const result=diffCem(before,after);assert.deepEqual(result.facts,[]);assert.deepEqual(result.gaps,[]);assert.notEqual(result.beforeDigest,result.afterDigest);
});

test('semantic generic constraints and unrelated extension metadata remain release facts',()=>{
 const before=manifest([mark(row('Leaf',{tagName:'en-leaf','x-en-type-parameters':[{name:'T',constraint:{text:'string'}}],'x-application-contract':{source:'old'}}))],[{kind:'js',name:'Leaf',declaration:reference('Leaf')}]);
 const after=structuredClone(before),leaf=after.modules[0].declarations[0];leaf['x-en-type-parameters'][0].constraint.text='number';leaf['x-application-contract'].source='new';
 const result=diffCem(before,after);assert.ok(result.facts.some(fact=>fact.surface==='declaration'));assert.ok(result.facts.some(fact=>fact.surface==='export'));
});

test('complete arrays remain authoritative when historical CSS omission metadata is also present',()=>{
 const leaf=mark(row('Leaf',{tagName:'en-leaf','x-en-reve-omitted-css-parts':['panel'],cssParts:[{name:'panel',inheritedFrom:reference('Restored')}]}));
 assert.ok(element(manifest([leaf])).surfaces.has('css-part:panel'));
});

test('complete marker binds ordered heritage and duplicate facet slots reject at production',()=>{
 const leaf=mark(row('Leaf',{mixins:[reference('First'),reference('Second')]}));leaf.mixins.reverse();assert.throws(()=>readConstructorComposition(leaf,'main.ts'),/Invalid complete constructor/);
 assert.throws(()=>mark(row('Leaf',{members:[field('value'),method('value')]})),/Invalid complete constructor/);
 assert.throws(()=>mark(row('Leaf',{slots:[{name:''},{name:''}]})),/Invalid complete constructor/);
});

test('legacy mixin omissions propagate across sibling subtrees and later own rows restore them',()=>{
 for(const schemaVersion of ['1.0.0','2.1.0'])for(const nested of [false,true]){
  const base=row('Base',{cssParts:[{name:'panel'},{name:'keep'}]});
  const hide=row('Hide',{'x-en-reve-omitted-css-parts':['panel'],cssParts:[{name:'panel',inheritedFrom:reference('Base')}]});
  const wrapper=row('Wrapper',{mixins:[reference('Hide')]});
  const leaf=row('Leaf',{tagName:'en-leaf',superclass:reference('Base'),mixins:[reference(nested?'Wrapper':'Hide')]});
  const input={...manifest([base,hide,wrapper,leaf]),schemaVersion};
  const surfaces=element(input).surfaces;
  assert.equal(surfaces.has('css-part:panel'),false);assert.ok(surfaces.has('css-part:keep'));
  leaf.cssParts=[{name:'panel',description:'restored'}];
  assert.equal((element(input).surfaces.get('css-part:panel')!.value as any).description,'restored');
 }
});

test('public non-element classes audit missing and cyclic lineage without registering elements',()=>{
 const exported=[{kind:'js',name:'Leaf',declaration:reference('Leaf')}];
 const missing=mark(row('Leaf',{superclass:reference('Missing')}));
 const gap=snapshotCem(manifest([missing],exported));
 assert.equal(gap.elements.size,0);assert.ok(gap.gaps.some(item=>item.includes('Missing')));
 const leaf=mark(row('Leaf',{superclass:reference('Base')})),base=mark(row('Base',{superclass:reference('Leaf')}));
 const cycle=snapshotCem(manifest([leaf,base],exported));
 assert.equal(cycle.elements.size,0);assert.ok(cycle.gaps.some(item=>item.includes('Inheritance cycle')));
});
