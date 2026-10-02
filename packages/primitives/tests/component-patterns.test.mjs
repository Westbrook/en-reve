import test from 'node:test';
import assert from 'node:assert/strict';
import {intervalLimits,normalizeInterval,moveInterval} from '../dist/state/interval.js';
import {visibleActionCount} from '../dist/state/overflow.js';
import {validateQuery,copyQuery} from '../dist/state/query.js';
import {chartModel} from '../dist/templates/chart.js';
test('intervals stay on a step grid with a realizable gap and stable endpoint order',()=>{
 for(const min of [-5,0,1.5])for(const step of [.1,1,3])for(const gap of [0,.25,4,100]){
  const limits=intervalLimits({min,max:10,step,minGap:gap});
  for(const raw of [[9,2],[-100,100],[NaN,Infinity],[5,5]]){
   const pair=normalizeInterval(raw,limits);
   for(const thumb of [0,1])for(const proposed of [-100,0,5,100]){
    const next=moveInterval(pair,thumb,proposed,limits);
    assert.ok(next[0]>=min-1e-8&&next[1]<=limits.max+1e-8);assert.ok(next[1]-next[0]>=limits.minGap-1e-8);
    for(const n of next)assert.ok(Math.abs((n-min)/step-Math.round((n-min)/step))<1e-8);
   }
  }
 }
});
test('overflow reserves only required disclosure width and handles an empty strip',()=>{assert.equal(visibleActionCount([80,80,80],260,100,10),3);assert.equal(visibleActionCount([80,80,80],250,100,10),1);assert.equal(visibleActionCount([80],20,100,10),0);assert.equal(visibleActionCount([],0,100),0);});
test('query copies detach clauses; validators reject unsupported fields and numeric values',()=>{const query={match:'all',clauses:[{id:'a',field:'effort',operator:'greater-than',value:'4'}]};const fields=[{value:'effort',label:'Effort',type:'number'}];assert.equal(validateQuery(query,fields),'');const copy=copyQuery(query);copy.clauses[0].value='no';assert.equal(query.clauses[0].value,'4');assert.match(validateQuery(copy,fields),/number/);assert.match(validateQuery({...query,clauses:[...query.clauses,...query.clauses]},fields),/unique/);});
test('chart domains include zero and ignore nonfinite samples',()=>{const model=chartModel([{key:'a',label:'A',value:-5},{key:'b',label:'B',value:12},{key:'c',label:'C',value:NaN}]);assert.equal(model.min,-5);assert.equal(model.max,12);assert.equal(model.data.length,2);assert.equal(chartModel([]).max,1);});

// Native input property serialization must retain the same initial snapshot as CSR.
test('choice card SSR serializes explicit checked state and leaves omission native',async()=>{
 const {render}=await import('@lit-labs/ssr');
 const {choiceCardTemplate}=await import('../dist/templates/patterns.js');
 const {parse}=await import('parse5');
 for(const type of ['checkbox','radio'])for(const checked of [true,false,undefined]){
  const document=parse([...render(choiceCardTemplate({type,name:'choice',value:'yes',label:'Choose',checked}))].join(''));
  const find=node=>node.tagName==='input'?node:(node.childNodes??[]).map(find).find(Boolean);
  const input=find(document);
  assert.equal(input.attrs.some(attr=>attr.name==='checked'),checked===true);
 }
});
