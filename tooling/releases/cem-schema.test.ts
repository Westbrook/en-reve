import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshotCem,diffCem} from './cem-diff.ts';
const sample=(schemaVersion:string)=>({schemaVersion,modules:[{kind:'javascript-module',path:'sample.ts',declarations:[{kind:'class',name:'Sample',tagName:'en-sample',cssStates:[{name:'open'}]}],exports:[]}]});
test('CEM 2.1 CSS states remain public release facts and historical schema 1 stays readable',()=>{
  for(const version of ['1.0.0','2.1.0']){const snapshot=snapshotCem(sample(version));assert.deepEqual(snapshot.gaps,[]);assert.ok(snapshot.elements.get('en-sample')!.surfaces.has('css-state:open'));}
  const changed=sample('2.1.0');changed.modules[0]!.declarations[0]!.cssStates=[];
  const diff=diffCem(sample('2.1.0'),changed);assert.ok(diff.facts.some(f=>f.surface==='css-state'&&f.name==='open'&&f.operation==='removed'));
  assert.ok(snapshotCem(sample('99.0.0')).gaps.some(gap=>gap.includes('has not been validated')));
  const duplicate=sample('2.1.0');duplicate.modules[0]!.declarations[0]!.cssStates.push({name:'open'});assert.throws(()=>snapshotCem(duplicate),/Duplicate cssStates/);
});


test('source-authored part exclusions survive recursive release inheritance and explicit reintroduction',()=>{
  for (const schemaVersion of ['1.0.0','2.1.0']) {
    const manifest:any={schemaVersion,modules:[{path:'sample.ts',declarations:[
      {kind:'class',name:'Base',cssParts:[{name:'keep'},{name:'removed'}]},
      {kind:'class',name:'Child',tagName:'en-child',superclass:{name:'Base'},'x-en-reve-omitted-css-parts':['removed'],cssParts:[{name:'removed',inheritedFrom:{name:'Base'}}]},
      {kind:'class',name:'Leaf',tagName:'en-leaf',superclass:{name:'Child'}},
      {kind:'class',name:'Own',tagName:'en-own',superclass:{name:'Base'},'x-en-reve-omitted-css-parts':['removed'],cssParts:[{name:'removed',description:'Explicit child contract.'}]},
      {kind:'class',name:'Ordinary',tagName:'en-ordinary',superclass:{name:'Base'}},
      {kind:'class',name:'Unresolved',tagName:'en-unresolved',superclass:{name:'Missing'},'x-en-reve-omitted-css-parts':['removed']},
    ]}]};
    const snapshot=snapshotCem(manifest);
    for (const tag of ['en-child','en-leaf']) {
      assert.ok(snapshot.elements.get(tag)!.surfaces.has('css-part:keep'));
      assert.equal(snapshot.elements.get(tag)!.surfaces.has('css-part:removed'),false);
    }
    assert.equal((snapshot.elements.get('en-own')!.surfaces.get('css-part:removed')!.value as any).description,'Explicit child contract.');
    assert.ok(snapshot.elements.get('en-ordinary')!.surfaces.has('css-part:removed'));
    assert.ok(snapshot.gaps.some(gap=>gap.includes('Missing for en-unresolved')));
    const before=structuredClone(manifest);delete before.modules[0].declarations[1]['x-en-reve-omitted-css-parts'];
    assert.ok(diffCem(before,manifest).facts.some(f=>f.element==='en-child'&&f.surface==='css-part'&&f.name==='removed'&&f.operation==='removed'));
  }
});

test('malformed source-authored part exclusions fail without suppressing inherited contracts',()=>{
  for (const invalid of ['part',null,[1],[''],['with space'],['duplicate','duplicate'],['bad\u0000name']]) {
    const manifest:any=sample('2.1.0');manifest.modules[0].declarations[0]['x-en-reve-omitted-css-parts']=invalid;
    assert.throws(()=>snapshotCem(manifest),/Invalid source-authored CSS part omissions/);
    delete manifest.modules[0].declarations[0].tagName;
    manifest.modules[0].exports=[{kind:'js',name:'Sample',declaration:{name:manifest.modules[0].declarations[0].name}}];
    assert.throws(()=>snapshotCem(manifest),/Invalid source-authored CSS part omissions/);
  }
});
