import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {hydrate} from '@lit-labs/ssr-client';
import {register,fixtureTemplate} from './components.js';
import {recoverOptionalSlotPresence,OPTIONAL_SLOT_PRESENCE_ATTRIBUTE} from '@en-reve/primitives/interactions/optional-slot-presence.js';
import {beginScrollIntoView,normalizeScrollOptions,type ScrollToKeyOptions} from '@en-reve/primitives/interactions/scroll-into-view.js';
export async function start(){register();hydrate(fixtureTemplate(),document.querySelector('#cards')!);for(let i=0;i<2;i++){await Promise.all([...document.querySelectorAll<HTMLElement & {updateComplete:Promise<unknown>}>('reading-card')].map(n=>n.updateComplete));await new Promise(requestAnimationFrame);}document.documentElement.dataset.hydrated='true';}
export function recover(serialized:string|null,names=['header']){const host=document.createElement('div');if(serialized!==null)host.setAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE,serialized);return recoverOptionalSlotPresence(host,names);}
export function createScrollCase(rtl=false,slotted=false){
 const host=document.createElement('div');host.id='scroll-composition';host.style.cssText='display:block;margin-top:600px';host.dir=rtl?'rtl':'ltr';
 const root=host.attachShadow({mode:'open'});root.innerHTML=`<style>:host{display:block}#outer{width:320px;height:220px;overflow:auto;border:2px solid}#before{height:340px}#after{height:500px}#inner{width:270px;height:160px;overflow:auto;border:3px solid;scroll-padding:10px}#content{position:relative;width:800px;height:1200px}#target{position:absolute;top:720px;inset-inline-start:520px;width:100px;height:40px;scroll-margin:5px}slot{display:contents}</style><div id="outer"><div id="before"></div><div id="inner"><div id="content">${slotted?'<slot name="target"></slot>':'<button id="target">Target item</button>'}</div></div><div id="after"></div></div>`;
 if(slotted){const target=document.createElement('button');target.id='target';target.slot='target';target.textContent='Target item';target.style.cssText='position:absolute;top:720px;inset-inline-start:520px;width:100px;height:40px;scroll-margin:5px';host.append(target);}
 document.body.append(host);const target=(slotted?host:root).querySelector<HTMLElement>('#target')!,inner=root.querySelector<HTMLElement>('#inner')!,outer=root.querySelector<HTMLElement>('#outer')!;outer.scrollTop=340;
 let active:ReturnType<typeof beginScrollIntoView>|undefined;let correction:number|undefined;
 const go=(options:ScrollToKeyOptions={},insets?:{blockStart:number;blockEnd:number})=>{if(correction!==undefined)cancelAnimationFrame(correction);active=beginScrollIntoView(target,normalizeScrollOptions(options),insets?{viewport:inner,...insets}:undefined);return {targets:active.targets.map(n=>n.id||n.localName),events:active.events.map(n=>n===window?'window':(n as HTMLElement).id)};};
 const stop=()=>{if(active){const restore=active.stop();correction=requestAnimationFrame(restore);}return inner.scrollTop;};
 Object.assign(window,{scrollCase:{host,root,target,inner,outer,go,stop}});return true;
}
Object.assign(window,{helperAPI:{recover,normalizeScrollOptions,createScrollCase}});
