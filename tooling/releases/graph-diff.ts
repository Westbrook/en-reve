import {digestJson, canonicalJson} from '../evidence/identity.ts';
import {diffPublicApi} from './type-diff.ts';
import type {ApiFact} from './cem-diff.ts';

/** Graph snapshots bind registration and authored behavior to the same type/CEM evidence. */
export function diffPublicGraph(beforeCem: unknown, afterCem: unknown, before: any, after: any) {
  for (const [graph, cem] of [[before,beforeCem],[after,afterCem]]) {
    if (graph?.schemaVersion !== 1 || !Array.isArray(graph.components) || !graph.entrypoints || !graph.policy
      || graph.manifestDigest !== digestJson(cem) || graph.typeDigest !== digestJson(graph.types)) throw new Error('Public graph does not match its CEM/type evidence.');
    if (new Set(graph.components.map((c:any)=>c.tagName)).size !== graph.components.length) throw new Error('Duplicate graph component.');
  }
  const result = diffPublicApi(beforeCem, afterCem, {before:before.types, after:after.types});
  const facts: ApiFact[] = [];
  const surfaces = (graph:any) => new Map<string, any>([
    ['$package:policy',graph.policy],
    ...Object.entries(graph.entrypoints).map(([name,entry]:[string,any])=>[`$package:${name}`,{supported:entry.supported}]),
    ...graph.components.map((c:any)=>[c.tagName,{dependencies:c.dependencies,definitionImport:c.definitionImport,events:c.events.map((e:any)=>({name:e.name,behavior:e.behavior}))}]),
  ]);
  const old=surfaces(before), next=surfaces(after);
  for (const name of [...new Set([...old.keys(),...next.keys()])].sort()) {
    const a=old.get(name), b=next.get(name);if(canonicalJson(a??null)===canonicalJson(b??null))continue;
    const operation=a===undefined?'added':b===undefined?'removed':'changed';
    facts.push({id:digestJson({surface:'declaration',name,before:a??null,after:b??null}),element:name.startsWith('$package:')?'$package':name,surface:'declaration',name:'contract:'+name,operation,...(a===undefined?{}:{before:a}),...(b===undefined?{}:{after:b}),suggestedLevel:null,reviewRequired:true,reason:'Registration, supported entrypoint or event behavior contract changed; explicit compatibility classification is required.'});
  }
  return {...result,facts:[...result.facts,...facts],graphCoverage:'public-contract-graph' as const,reviewRequired:result.reviewRequired||facts.length>0};
}
