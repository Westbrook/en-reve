import {createElementActivation} from '@en-reve/elements/activation.js';
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
const params = new URLSearchParams(location.search);
const forcedGlobal = params.has('global');
let imports = 0, constructed = 0, renders = 0;
let release: (()=>void) | undefined;
let gate: Promise<void> | undefined;
let fail = false;
class Probe extends HTMLElement {
  constructor() { super(); constructed++; }
  connectedCallback() { if (!this.firstChild) { const input = document.createElement('input'); input.setAttribute('aria-label','Optional draft'); this.append(input); } }
}
const definition = {tagName:'en-activation-probe', elementClass:Probe, dependencies:[]};
const loaders = {'en-activation-probe':async()=>{ imports++; if (gate) await gate; if(fail)throw Error('offline'); return definition; }};
const native = !forcedGlobal && elementScopeCapabilities(document).dormant;
const policy = params.get('policy') === 'group' ? 'group' : 'dormant';
const shared = createElementScope({document,registry:native?'auto':'global'});
const entries: any[] = [];
function add(count = 2, individual = false, nested = false) {
  const scope = policy==='group'&&native ? createElementScope({document}) : shared;
  const registry = native ? policy==='dormant'?null:scope.registry : customElements;
  const root = document.createElement(individual&&native?'en-activation-probe':'section', native?{customElementRegistry:registry}:undefined);
  const template = document.createElement('template'); template.innerHTML = '<en-activation-probe></en-activation-probe>'.repeat(count);
  const shadows: ShadowRoot[] = [];
  if(native&&!individual)root.innerHTML=template.innerHTML;
  if(native&&nested){const host=document.createElement('div',{customElementRegistry:registry});root.append(host);const shadow=host.attachShadow({mode:'open',customElementRegistry:registry});shadow.innerHTML='<en-activation-probe></en-activation-probe>';shadows.push(shadow);}
  document.querySelector('#islands')!.append(root);
  const before = [...root.querySelectorAll('en-activation-probe')];
  const controller=createElementActivation({scope,root,policy,loaders,tags:['en-activation-probe'],shadowRoots:shadows,template:native?undefined:template,ready:async()=>{renders++;}});
  const entry={scope,root,controller,before,shadows};entries.push(entry);return entries.length-1;
}
const state = ()=>({native,policy,imports,constructed,renders,entries:entries.map(e=>({state:e.controller.state,defined:!!e.scope.get('en-activation-probe'),nodes:e.root.querySelectorAll('en-activation-probe').length,upgraded:[...(e.root.matches('en-activation-probe')?[e.root]:[]),...e.root.querySelectorAll('en-activation-probe'),...e.shadows.flatMap((s:ShadowRoot)=>[...s.querySelectorAll('en-activation-probe')])].filter((n:any)=>n instanceof Probe).length,identity:e.before.every((n:any)=>n.isConnected)}))});
(window as any).fixture={add,state,entries,api:{createElementActivation,createElementScope,loaders},load:(i:number,retry=false)=>entries[i].controller.load({retry}),activate:(i:number,retry=false)=>entries[i].controller.activate({retry}).then(()=>({ok:true}), (e:any)=>({ok:false,name:e.name,message:e.message})),cancel:(i:number)=>entries[i].controller.cancel(),dispose:(i:number)=>entries[i].controller.dispose(),remove:(i:number)=>entries[i].root.remove(),hold:()=>{gate=new Promise<void>(r=>release=r);},release:()=>{release?.();gate=undefined;},fail:(value:boolean)=>{fail=value;},scopeCapabilities:elementScopeCapabilities(document)};
