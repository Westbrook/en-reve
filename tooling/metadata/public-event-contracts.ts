import {createHash} from 'node:crypto';
import {canonicalJson,digestJson} from '../evidence/identity.ts';
import {readConstructorComposition} from './constructor-composition-contract.ts';

const key=(source:string,className:string,name:string)=>canonicalJson([source,className,name]);
const same=(a:any,b:any)=>canonicalJson(a)===canonicalJson(b);
const nonempty=(value:any)=>typeof value==='string'&&value.trim().length>0;
const emittedDigest=(value:any)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function publicSource(value:any) {
  if(!value||value.file?.kind!=='selected-source'||value.file.path!==value.module)throw new Error('Effective event proof has no selected source owner');
  const {file,...source}=value;return source;
}

/** Join already source-verified receipts to emitted events. This authenticates
 * agreement among those inputs; fresh source verification remains mandatory.
 * Composed roots require a unique final facet proof, never a name-only fallback.
 */
export function createPublicEventContractResolver(receipt:any,resolveReference:(reference:any,from:string)=>any) {
  const ordinary=new Map<string,any>(),effective=new Map<string,any>(),seen=new Set<string>();
  const contracts=receipt.eventContracts??[];
  if(!Array.isArray(contracts))throw new Error('Event contracts must be an array');
  for(const contract of contracts) {
    canonicalJson(contract);
    if(!contract||![contract.source,contract.className,contract.name,contract.type,contract.detail].every(nonempty))
      throw new Error('Event contract must retain its source, class, name and typed payload');
    const entries=contract.composition===undefined?ordinary:effective,k=key(contract.source,contract.className,contract.name);
    if(seen.has(k))throw new Error('Duplicate typed event contract: '+k);seen.add(k);entries.set(k,contract);
  }
  return (resolved:any,event:any)=>{
    const declaration=resolved.declaration,module=resolved.modulePath,marker=readConstructorComposition(declaration,module);
    if(!event.type?.text||event.type.text==='CustomEvent')throw new Error('Unclassified or untyped public event: '+declaration.name+'.'+event.name);
    if(!marker) {
      const origin=event.inheritedFrom?resolveReference(event.inheritedFrom,module):resolved;
      const contract=(origin&&ordinary.get(key(origin.modulePath,origin.declaration.name,event.name)))??ordinary.get(key(module,declaration.name,event.name));
      if(!contract)throw new Error('Unclassified or untyped public event: '+declaration.name+'.'+event.name);
      return contract;
    }
    const contract=effective.get(key(module,declaration.name,event.name)),binding=contract?.composition;
    const packet=receipt.constructorComposition;
    if(!binding||binding.version!==1||packet?.version!==1||packet.route!=='exact-declaration-hybrid'||packet.proofs?.portableFormat!=='source-owned-constructor-proofs-v1'||
      !Array.isArray(packet.proofs.facets)||!same(binding.root,marker.root)||binding.compositionDigest!==digestJson(marker))
      throw new Error('Composed public event requires its exact effective root contract');
    const matches=packet.proofs.facets.filter((proof:any)=>proof.module===module&&proof.declaration===declaration.name&&proof.facet==='events'&&proof.key===event.name);
    if(matches.length!==1)throw new Error('Effective event requires one surviving facet proof');
    const proof=matches[0],step=marker.steps[proof.step];
    if(!step||step.kind==='terminal'||!Number.isSafeInteger(proof.step)||!Array.isArray(proof.contexts)||
      !same(publicSource(proof.origin),step.origin)||!same(proof.contexts.map((context:any)=>({kind:context.kind,source:publicSource(context.source)})),step.contexts)||
      proof.emittedSha256!==emittedDigest(event)||binding.facetProofDigest!==digestJson(proof)||
      proof.eventContract?.type!==contract.type||proof.eventContract?.detail!==contract.detail||contract.type!==event.type.text)
      throw new Error('Effective event contract disagrees with its surviving occurrence proof');
    return contract;
  };
}

/** Derive the exact final contract rows from freshly validated serializer
 * proofs. The agreement resolver below checks the complete root/facet binding;
 * callers must still perform fresh source extraction before using this packet.
 */
export function effectivePublicEventContracts(manifest:any,receipt:any) {
  const roots:any[]=[],contracts:any[]=[],rows:any[]=[];
  for(const module of manifest.modules??[])for(const declaration of module.declarations??[]) {
    const marker=readConstructorComposition(declaration,module.path);if(!marker)continue;
    roots.push({source:module.path,className:declaration.name,public:declaration.customElement===true||nonempty(declaration.tagName)});
    for(const event of declaration.events??[]) {
      if(['private','protected'].includes(event.privacy))continue;
      const proofs=receipt.constructorComposition?.proofs?.facets;
      const matches=Array.isArray(proofs)?proofs.filter((proof:any)=>proof.module===module.path&&proof.declaration===declaration.name&&proof.facet==='events'&&proof.key===event.name):[];
      if(matches.length!==1||!nonempty(matches[0].eventContract?.type)||!nonempty(matches[0].eventContract?.detail))
        throw new Error('Composed event has no unique validated typed payload proof');
      const proof=matches[0];
      contracts.push({source:module.path,className:declaration.name,name:event.name,type:proof.eventContract.type,detail:proof.eventContract.detail,
        composition:{version:1,root:marker.root,compositionDigest:digestJson(marker),facetProofDigest:digestJson(proof)}});
      rows.push({resolved:{modulePath:module.path,declaration},event});
    }
  }
  const resolve=createPublicEventContractResolver({...receipt,eventContracts:contracts},()=>undefined);
  for(const {resolved,event}of rows)resolve(resolved,event);
  return {roots,contracts};
}
