import assert from 'node:assert/strict';
import test from 'node:test';
import {digestJson} from '../evidence/identity.ts';
import {decorateCustomizationMetadata} from '../customization/cem.mjs';
import {finalizeCustomization} from './finalize-customization.ts';
import {completeConstructorComposition, readConstructorComposition, constructorCompositionKey} from './constructor-composition-contract.ts';

const contracts=[{cssName:'--tone',kind:'color',family:'surface',reset:'initial',managed:true}];
function fixture(marked=true) {
  const declaration:any={kind:'class',name:'Leaf',tagName:'x-leaf',customElement:true,
    members:[{kind:'field',name:'value',type:{text:'string'}}],cssProperties:[{name:'--tone',description:'authored'},{name:'--other',description:'unmatched'}]};
  const root={version:1,module:'main.ts',sourceSha256:'a'.repeat(64),kind:263,start:0,pos:0,end:20};
  if(marked)declaration[constructorCompositionKey]=completeConstructorComposition(declaration,'main.ts',
    {version:1,root,steps:[{index:0,kind:'class',origin:root,contexts:[]}],omissions:[]});
  return {schemaVersion:'2.1.0',modules:[{kind:'javascript-module',path:'main.ts',declarations:[declaration],exports:[]}]};
}
function freeze(value:any):any {if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

test('customization enriches frozen composition without mutation and rebinds the exact facet',()=>{
  const input=freeze(fixture()),before=digestJson(input),old=input.modules[0].declarations[0][constructorCompositionKey];
  const result=finalizeCustomization(input,contracts),row=result.manifest.modules[0].declarations[0];
  assert.equal(digestJson(input),before);assert.notEqual(result.manifest,input);
  assert.ok(readConstructorComposition(row,'main.ts'));assert.notEqual(row[constructorCompositionKey].facets.cssProperties,old.facets.cssProperties);
  for(const key of Object.keys(old.facets).filter(key=>key!=='cssProperties'))assert.equal(row[constructorCompositionKey].facets[key],old.facets[key]);
  assert.deepEqual(row.members,input.modules[0].declarations[0].members);assert.deepEqual(row.cssProperties[1],input.modules[0].declarations[0].cssProperties[1]);
  assert.equal(result.enrichment.inputManifestDigest,before);assert.equal(result.enrichment.manifestDigest,digestJson(result.manifest));assert.equal(result.enrichment.changes.length,1);
});

test('legacy metadata gains the same extension without inventing a composition claim',()=>{
  const result=finalizeCustomization(fixture(false),contracts),row=result.manifest.modules[0].declarations[0];
  assert.equal(row[constructorCompositionKey],undefined);assert.deepEqual(result.enrichment.markerChanges,[]);
  assert.deepEqual(row.cssProperties[0]['x-en-reve-customization'],{kind:'color',family:'surface',reset:'initial',managed:true,tokenId:null,consumerStatus:'source-referenced'});
});

test('stale composition cannot be laundered through customization resealing',()=>{
  const input=fixture();input.modules[0].declarations[0].cssProperties[0].description='changed after seal';
  assert.throws(()=>finalizeCustomization(input,contracts),/Invalid complete constructor composition contract/);
});

test('unknown contracts do not create CSS hooks or enrich untagged declarations',()=>{
  const input=fixture(false);delete input.modules[0].declarations[0].tagName;
  const result=finalizeCustomization(input,[...contracts,{cssName:'--missing',managed:true}]);
  assert.deepEqual(result.manifest,input);assert.deepEqual(result.enrichment.changes,[]);
});

test('repeated identical enrichment is idempotent and reports no additional changes',()=>{
  const first=finalizeCustomization(fixture(),contracts),second=finalizeCustomization(first.manifest,contracts);
  assert.deepEqual(second.manifest,first.manifest);assert.deepEqual(second.enrichment.changes,[]);
  assert.equal(second.enrichment.markerChanges[0].before,second.enrichment.markerChanges[0].after);
});

test('customization updates its extension while preserving preexisting unrelated metadata',()=>{
  const input=fixture(false),row=input.modules[0].declarations[0];row['x-independent']={semantic:true};row.cssProperties[0]['x-en-reve-customization']={managed:false};
  const result=finalizeCustomization(input,contracts);assert.deepEqual(result.manifest.modules[0].declarations[0]['x-independent'],{semantic:true});
  assert.deepEqual(result.enrichment.changes[0].before,{managed:false});assert.deepEqual(row.cssProperties[0]['x-en-reve-customization'],{managed:false});
});

test('customization rejects a substitution hook before invoking it or resealing stale input',()=>{
  const valid=fixture(),stale=fixture();let calls=0;
  stale.modules[0].declarations[0].cssProperties[0].description='changed after seal';
  Object.defineProperty(stale,'toJSON',{value:()=>{calls++;return valid;}});
  assert.throws(()=>finalizeCustomization(stale,contracts),/non-enumerable/);
  assert.equal(calls,0);
});

test('customization admits only plain data without reading accessors or hidden contract fields',()=>{
  let calls=0;const input=fixture(false);
  Object.defineProperty(input.modules[0].declarations[0],'hidden',{enumerable:true,get(){calls++;return true;}});
  assert.throws(()=>finalizeCustomization(input,contracts),/accessors/);assert.equal(calls,0);
  const contract={...contracts[0]};Object.defineProperty(contract,'hidden',{value:true});
  assert.throws(()=>finalizeCustomization(fixture(false),[contract]),/non-enumerable/);
  const hook=fixture(false);Object.assign(hook,{toJSON(){calls++;return fixture(false);}});
  assert.throws(()=>finalizeCustomization(hook,contracts),/plain JSON data/);assert.equal(calls,0);
});

test('legacy customization retains the exact JSON byte order of the established decorator',()=>{
  const input=fixture(false),legacy=JSON.parse(JSON.stringify(input));
  legacy.modules[0].declarations[0].cssProperties[0]['x-en-reve-customization']={managed:false};
  input.modules[0].declarations[0].cssProperties[0]['x-en-reve-customization']={managed:false};
  decorateCustomizationMetadata(legacy,contracts);
  assert.equal(JSON.stringify(finalizeCustomization(input,contracts).manifest),JSON.stringify(legacy));
});
