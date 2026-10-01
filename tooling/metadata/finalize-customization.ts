import {canonicalJson, digestJson} from '../evidence/identity.ts';
import {decorateCustomizationMetadata} from '../customization/cem.mjs';
import {readConstructorComposition, completeConstructorComposition, constructorCompositionKey} from './constructor-composition-contract.ts';

const customizationKey='x-en-reve-customization';
// Read descriptors rather than values: admission must not run a getter or a
// toJSON hook. Encode in ordinary JSON key order without invoking object hooks.
function jsonText(value:any,omitUndefined=false,ancestors=new Set<object>()):string {
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(typeof value!=='object'||value===null)throw new Error('Customization requires plain JSON data');
  const array=Array.isArray(value),prototype=Object.getPrototypeOf(value);
  if(prototype!==(array?Array.prototype:Object.prototype)&&!(prototype===null&&!array))
    throw new Error('Customization requires plain JSON prototypes');
  if(ancestors.has(value))throw new Error('Customization requires acyclic JSON data');
  ancestors.add(value);
  try {
    const keys=Reflect.ownKeys(value),descriptors=new Map<string,PropertyDescriptor>();
    for(const key of keys) {
      if(typeof key!=='string')throw new Error('Customization rejects symbol properties');
      const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
      if(!('value' in descriptor)||(!descriptor.enumerable&&!(array&&key==='length')))
        throw new Error('Customization rejects accessors and non-enumerable properties');
      descriptors.set(key,descriptor);
    }
    if(array) {
      const length=descriptors.get('length')!.value;
      if(descriptors.size!==length+1)throw new Error('Customization requires dense JSON arrays without extra properties');
      const elements:string[]=[];
      for(let index=0;index<length;index++) {
        const descriptor=descriptors.get(String(index));
        if(!descriptor)throw new Error('Customization requires dense JSON arrays');
        elements.push(jsonText(descriptor.value,omitUndefined,ancestors));
      }
      return '['+elements.join(',')+']';
    }
    const properties:string[]=[];
    for(const [key,descriptor] of descriptors) {
      if(omitUndefined&&descriptor.value===undefined)continue;
      properties.push(JSON.stringify(key)+':'+jsonText(descriptor.value,omitUndefined,ancestors));
    }
    return '{'+properties.join(',')+'}';
  } finally {ancestors.delete(value);}
}
const jsonCopy=(value:any)=>JSON.parse(jsonText(value));

/** Apply the trusted customization policy to a fresh JSON copy. Existing
 * composition markers must validate before enrichment. Only the established
 * CSS-property extension may change; rebind its facet digest afterwards.
 * Structural agreement is not source authentication: the producer must first
 * validate extraction and include this transition in its generation receipt.
 */
export function finalizeCustomization(manifest:any,contracts:readonly any[]) {
  const admittedManifest=jsonText(manifest),admittedContracts=jsonText(contracts);
  const markers:any[]=[];
  for(const [moduleIndex,module] of manifest.modules.entries()) for(const [declarationIndex,declaration] of (module.declarations??[]).entries()) {
    const marker=readConstructorComposition(declaration,module.path);
    if(marker)markers.push({moduleIndex,declarationIndex,marker});
  }
  const input=JSON.parse(admittedManifest),contractInput=JSON.parse(admittedContracts),output=jsonCopy(input);
  decorateCustomizationMetadata(output,contractInput);
  // Normalize the decorator's optional undefined fields to their JSON meaning.
  const decorated=JSON.parse(jsonText(output,true));
  const byName=new Map(contractInput.map((contract:any)=>[contract.cssName,contract]));
  const expected=jsonCopy(input),changes:any[]=[];
  for(const [moduleIndex,module] of input.modules.entries()) for(const [declarationIndex,declaration] of (module.declarations??[]).entries()) {
    if(!declaration.tagName)continue;
    for(const [propertyIndex,property] of (declaration.cssProperties??[]).entries()) {
      const contract:any=byName.get(property.name);if(!contract)continue;
      const value=JSON.parse(jsonText({kind:contract.kind,family:contract.family,reset:contract.reset,
        tokenId:contract.tokenId??null,managed:contract.managed,consumerStatus:contract.consumerStatus??'source-referenced'},true));
      expected.modules[moduleIndex].declarations[declarationIndex].cssProperties[propertyIndex][customizationKey]=value;
      if(canonicalJson(property[customizationKey]??null)!==canonicalJson(value))changes.push({module:module.path,declaration:declaration.name,
        property:property.name,propertyIndex,before:property[customizationKey]??null,after:value});
    }
  }
  if(canonicalJson(decorated)!==canonicalJson(expected))throw new Error('Customization changed metadata outside its declared CSS-property enrichment');
  const markerChanges=markers.map(({moduleIndex,declarationIndex,marker})=>{
    const module=decorated.modules[moduleIndex],declaration=module.declarations[declarationIndex];
    const next=completeConstructorComposition(declaration,module.path,{version:1,root:marker.root,steps:marker.steps,omissions:marker.omissions});
    declaration[constructorCompositionKey]=next;
    readConstructorComposition(declaration,module.path);
    return {module:module.path,declaration:declaration.name,before:digestJson(marker),after:digestJson(next)};
  });
  return {manifest:decorated,enrichment:{version:1,policy:'authored-css-property-customization-only',inputManifestDigest:digestJson(input),
    contractsDigest:digestJson(contractInput),manifestDigest:digestJson(decorated),changes,markerChanges}};
}
