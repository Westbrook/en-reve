import {canonicalJson, digestJson} from '../evidence/identity.ts';

export const constructorCompositionKey='x-en-constructor-composition';
export const composedConstructorFacets=['members','attributes','events','slots','cssParts','cssProperties','cssStates'] as const;
type Row=Record<string,any>;
const bad=():never=>{throw new Error('Invalid complete constructor composition contract');};
const object=(value:any):Row=>value && typeof value==='object' && !Array.isArray(value)?value:bad();
const exact=(value:any,keys:string[])=>{
  const row=object(value);if(Object.keys(row).length!==keys.length || keys.some(key=>!Object.hasOwn(row,key)))bad();return row;
};
const name=(value:any)=>typeof value==='string' && value.length>0 && !/[\u0000-\u001f\u007f]/u.test(value)?value:bad();
const modulePath=(value:any)=>{
  name(value);if(value.includes('\\') || /^[A-Za-z]:/.test(value) || value.split('/').some((part:string)=>!part || part==='.' || part==='..'))bad();return value;
};
function source(value:any) {
  const row=exact(value,['version','module','sourceSha256','kind','start','pos','end']);
  if(row.version!==1 || !/^[a-f0-9]{64}$/.test(row.sourceSha256) || !['kind','start','pos','end'].every(key=>Number.isSafeInteger(row[key])))bad();
  modulePath(row.module);if(row.kind<0 || row.pos<0 || row.start<row.pos || row.end<row.start)bad();return row;
}
function reference(value:any) {
  const row=object(value);if(Object.keys(row).some(key=>!['name','module','package'].includes(key)))bad();
  name(row.name);if(row.module!==undefined)modulePath(row.module);if(row.package!==undefined)name(row.package);return row;
}
function heritage(declaration:Row) {
  if(declaration.superclass!==undefined)reference(declaration.superclass);
  if(declaration.mixins!==undefined && !Array.isArray(declaration.mixins))bad();
  for(const entry of declaration.mixins ?? [])reference(entry);
  return {superclass:declaration.superclass ?? null,mixins:declaration.mixins ?? []};
}
function facetRows(declaration:Row,facet:string):Row[] {
  const rows=declaration[facet]===undefined?[]:declaration[facet];if(!Array.isArray(rows))bad();
  const seen=new Set<string>();
  for(const value of rows) {
    const row=object(value);
    if(typeof row.name!=='string' || (!row.name && facet!=='slots'))bad();
    if(row.privacy!==undefined && !['public','private','protected'].includes(row.privacy))bad();
    if(facet==='members' && (!['field','method'].includes(row.kind) || (row.static!==undefined && typeof row.static!=='boolean')))bad();
    const key=facet==='members'?canonicalJson([row.static===true,row.name]):row.name;
    if(seen.has(key))bad();seen.add(key);
  }
  return rows;
}

/** Structural agreement with the emitted CEM, not source authentication.
 * The producer/receipt must separately prove the source and complete extraction.
 * Unknown or partial markers reject rather than silently enabling inheritance.
 */
export function readConstructorComposition(declaration:Row,from:string):Row|undefined {
  const value=declaration[constructorCompositionKey];if(value===undefined)return undefined;
  canonicalJson(value);modulePath(from);
  const row=exact(value,['version','representation','declaration','root','steps','omissions','facets','heritageDigest']);
  if(row.version!==2 || row.representation!=='complete-authored-facets' || declaration.kind!=='class')bad();
  const identity=exact(row.declaration,['name','module']);
  if(identity.name!==declaration.name || identity.module!==from)bad();name(identity.name);
  const root=source(row.root);if(root.module!==from)bad();
  if(!Array.isArray(row.steps) || !row.steps.length)bad();
  row.steps.forEach((step:any,index:number)=>{
    object(step);
    if(step.kind==='terminal') {
      exact(step,['index','kind','terminal','contexts']);if(index!==0)bad();
      const terminal=exact(step.terminal,['ownership','reference']);reference(terminal.reference);
      if(!['platform','external-library'].includes(terminal.ownership))bad();
      if(terminal.ownership==='platform' && (terminal.reference.module!==undefined || terminal.reference.package!==undefined))bad();
      if(terminal.ownership==='external-library' && (!terminal.reference.module || !terminal.reference.package))bad();
    } else {
      if(!['class','application'].includes(step.kind))bad();
      exact(step,step.kind==='application'?['index','kind','origin','application','contexts']:['index','kind','origin','contexts']);
      source(step.origin);if(step.kind==='application')source(step.application);
    }
    if(step.index!==index || !Array.isArray(step.contexts))bad();
    for(const context of step.contexts) {
      exact(context,['kind','source']);if(!['class-reference','application'].includes(context.kind))bad();source(context.source);
    }
  });
  const last=row.steps.at(-1);
  if(last.kind!=='class' || last.contexts.length || canonicalJson(last.origin)!==canonicalJson(root))bad();
  if(!Array.isArray(row.omissions))bad();
  for(const omission of row.omissions) {
    exact(omission,['facet','names','by']);
    if(!composedConstructorFacets.includes(omission.facet) || !Number.isSafeInteger(omission.by) || omission.by<0 || omission.by>=row.steps.length || row.steps[omission.by].kind==='terminal')bad();
    if(!Array.isArray(omission.names) || !omission.names.length || new Set(omission.names).size!==omission.names.length)bad();
    for(const entry of omission.names){name(entry);if(entry.trim()!==entry)bad();}
  }
  exact(row.facets,[...composedConstructorFacets]);
  for(const facet of composedConstructorFacets)if(row.facets[facet]!==digestJson(facetRows(declaration,facet)))bad();
  if(row.heritageDigest!==digestJson(heritage(declaration)))bad();
  return row;
}

/** Encode the complete-array claim after the serializer has normalized JSON. */
export function completeConstructorComposition(declaration:Row,from:string,provenance:Row) {
  exact(provenance,['version','root','steps','omissions']);if(provenance.version!==1)bad();
  const marker={version:2,representation:'complete-authored-facets',declaration:{name:declaration.name,module:from},
    root:provenance.root,steps:provenance.steps,omissions:provenance.omissions,
    facets:Object.fromEntries(composedConstructorFacets.map(facet=>[facet,digestJson(facetRows(declaration,facet))])),heritageDigest:digestJson(heritage(declaration))};
  readConstructorComposition({...declaration,[constructorCompositionKey]:marker},from);return marker;
}
