import * as api from './api.js';
Object.assign(window,{diagnosticAPI:api});
const scope=api.createElementScope({document});
const root=scope.mode==='scoped'?document.createElement('section',{customElementRegistry:null}):scope.createElement('section');
document.querySelector('#island')!.append(root);
class Demo extends HTMLElement {connectedCallback(){this.textContent='Fixture component upgraded';}}
const loaders=Object.freeze({'diagnostic-demo':async()=>({tagName:'diagnostic-demo',elementClass:Demo})});
const loader=api.createDefinitionLoader(scope.registry,loaders);
const template=document.createElement('template');template.innerHTML='<diagnostic-demo></diagnostic-demo>';
if(scope.mode==='scoped')root.innerHTML=template.innerHTML;
let resolveReady: (()=>void)|undefined, rejectReady: (()=>void)|undefined;
const activation=api.createElementActivation({scope,root,loaders,tags:Object.keys(loaders),policy:'dormant',template:scope.mode==='global'?template:undefined,
  ready:(_root,signal)=>diagnostic.observe('readiness',async()=>{
    await new Promise<void>((resolve,reject)=>{resolveReady=resolve;rejectReady=()=>reject(new Error('Fixture readiness failure'));signal.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError')),{once:true});});
    signal.throwIfAborted();
  }),
});
const diagnostic=api.createRegistryDiagnostic({scope,requested:'auto',roots:[root],tags:Object.keys(loaders),controller:activation});
const output=document.querySelector('pre')!;
const show=()=>{output.textContent=JSON.stringify(diagnostic.snapshot(),null,2);};
const run=async(stage:'module'|'registration'|'activation',operation:()=>Promise<unknown>)=>{
 const pending=diagnostic.observe(stage,operation);show();try{await pending;}catch{/* Scalar failure/guidance appears in the snapshot. */}finally{show();}
};
document.querySelector('#load')!.addEventListener('click',()=>void run('module',()=>loader.load(['diagnostic-demo'])));
document.querySelector('#define')!.addEventListener('click',()=>void run('registration',()=>loader.ensure(['diagnostic-demo'])));
document.querySelector('#activate')!.addEventListener('click',()=>void run('activation',()=>activation.activate()));
document.querySelector('#resolve')!.addEventListener('click',()=>{resolveReady?.();});
document.querySelector('#fail')!.addEventListener('click',()=>{rejectReady?.();});
document.querySelector('#cancel')!.addEventListener('click',()=>{activation.cancel();show();});
document.querySelector('#snapshot')!.addEventListener('click',show);
document.querySelector('#dispose')!.addEventListener('click',()=>{activation.dispose();diagnostic.dispose();resolveReady=rejectReady=undefined;show();for(const b of document.querySelectorAll<HTMLButtonElement>('button'))b.disabled=true;});
if(new URL(location.href).searchParams.has('progress-report')){
 document.querySelector<HTMLAnchorElement>('#report')!.hidden=false;
 document.querySelector<HTMLAnchorElement>('#comparison')!.search='?progress-report';
}
show();
