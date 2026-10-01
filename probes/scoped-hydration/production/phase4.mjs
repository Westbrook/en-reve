// Application-owned eager recipe built exclusively from sealed Phase 4 exports.
// Synthetic defer holds global Lit connection until outer hydration owns its parts.
import {createElementScope} from '@en-reve/elements/element-scope.js';
export {createElementScope};
const prepared=import('@lit-labs/ssr-client/lit-element-hydrate-support.js').then(async()=>{
 const [{hydrate},module]=await Promise.all([import('@lit-labs/ssr-client'),import('./island.mjs')]);return {hydrate,module};
});
export function create({root,template,snapshot,scope}){
 let promise;
 return {load:()=>prepared,dispose(){},activate(){return promise??=(async()=>{
  const {hydrate,module}=await prepared;
  const source=template.content.cloneNode(true);
  for(const el of source.querySelectorAll('*'))if(el.localName.includes('-')&&!el.hasAttribute('defer-hydration')){el.setAttribute('defer-hydration','');el.setAttribute('data-en-hydration-release','');}
  const fragment=scope.creationScope.importNode(source,true),containers=[fragment];
  for(let i=0;i<containers.length;i++)for(const host of containers[i].querySelectorAll('*'))for(const child of [...host.children])if(child.localName==='template'&&child.hasAttribute('shadowrootmode')){const shadow=scope.attachShadow(host);shadow.append(child.content);child.remove();containers.push(shadow);}
  const release=[...fragment.querySelectorAll('[data-en-hydration-release]')];root.replaceChildren(fragment);template.remove();template=undefined;
  hydrate(module.template(snapshot),root,{creationScope:scope.creationScope});
  if(scope.mode==='scoped')for(const boundary of [root,...containers.slice(1)])scope.initialize(boundary);
  scope.register(module.definitions);scope.upgrade(root);
  for(const el of release){el.removeAttribute('data-en-hydration-release');el.removeAttribute('defer-hydration');}
  await module.ready(root);
 })();}};
}
