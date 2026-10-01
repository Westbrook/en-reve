import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareCandidateCem} from './candidate-compare.mjs';
test('prototype-like contract names remain visible in comparison and duplicate detection',()=>{
  const before={schemaVersion:'2.1.0',modules:[]};
  const after={schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'__proto__',declarations:[{kind:'function',name:'__proto__',parameters:[]}],exports:[]}]};
  assert.ok(compareCandidateCem(before,after).semanticChanges.some(change=>change.path.includes('__proto__')));
  const changed=structuredClone(after);changed.modules[0].declarations[0].parameters.push({name:'constructor'});
  assert.ok(compareCandidateCem(after,changed).semanticChanges.length);
  changed.modules[0].declarations.push({...changed.modules[0].declarations[0]});
  assert.throws(()=>compareCandidateCem(after,changed),/duplicate/);
});
const manifest = () => ({schemaVersion:'1.0.0',modules:[{kind:'javascript-module',path:'sample.ts',declarations:[
  {kind:'class',name:'Sample',tagName:'en-sample',members:[{kind:'field',name:'value',type:{text:'string'},default:'""'}],cssStates:[{name:'open'}]},
  {kind:'function',name:'createSample',parameters:[]},
],exports:[{kind:'js',name:'Sample',declaration:{name:'Sample',module:'sample.ts'}}]}]});
test('candidate comparison separates ordering and schema while retaining exact public changes',()=>{
  const before=manifest(),after=structuredClone(before);after.schemaVersion='2.1.0';after.modules[0].source='sample.ts';after.modules[0].declarations.reverse();
  const result=compareCandidateCem(before,after);assert.deepEqual(result.semanticChanges,[]);assert.equal(result.schemaChanges.length,1);assert.equal(result.sourceProvenanceChanges.length,1);assert.equal(result.requiresReview,true);assert.ok(result.rawChanges.length);
});
test('candidate comparison exposes lost non-class declarations, CSS states, exports and changed type/default',()=>{
  for(const change of [
    value=>value.modules[0].declarations.pop(),
    value=>value.modules[0].declarations[0].cssStates.splice(0),
    value=>value.modules[0].exports.splice(0),
    value=>value.modules[0].declarations[0].members[0].type.text='unknown',
    value=>value.modules[0].declarations[0].members[0].default='"changed"',
  ]){const before=manifest(),after=structuredClone(before);change(after);assert.ok(compareCandidateCem(before,after).semanticChanges.length);}
});
test('duplicate declarations and unknown schemas reject instead of producing empty equivalent contracts',()=>{
  const duplicated=manifest();duplicated.modules[0].declarations.push({...duplicated.modules[0].declarations[0]});assert.throws(()=>compareCandidateCem(manifest(),duplicated),/duplicate/);
  const unknown=manifest();unknown.schemaVersion='99';assert.throws(()=>compareCandidateCem(manifest(),unknown),/Unsupported/);
});
