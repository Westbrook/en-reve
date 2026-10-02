import assert from 'node:assert/strict';
import {mkdir,realpath} from 'node:fs/promises';
import {join} from 'node:path';

// Shared actual-Firefox transport; callers own output, processes and execution leases.
export async function firefox({bundle,output,metadata,child,until,stop}){
 assert.equal(metadata(bundle).CFBundleIdentifier,'org.mozilla.firefox','Expected an official Firefox application');
 const executable=await realpath(join(bundle,'Contents/MacOS/firefox'));
 assert(executable.startsWith(bundle+'/'),'Firefox executable must stay inside its distribution');
 const profile=join(output,'firefox-profile');await mkdir(profile);
 const browser=child(executable,['--headless','--no-remote','--profile',profile,'--remote-debugging-port','0'],'firefox');
 const endpoint=await until(()=>browser.log().match(/WebDriver BiDi listening on (ws:\/\/127\.0\.0\.1:\d+)/)?.[1],'Firefox BiDi');
 const ws=new WebSocket(endpoint+'/session');await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});
 let id=0;const pending=new Map();
 ws.addEventListener('message',({data})=>{const message=JSON.parse(data);const item=pending.get(message.id);if(item){pending.delete(message.id);clearTimeout(item.timer);message.type==='error'?item.reject(Error(JSON.stringify(message))):item.resolve(message.result);}});
 ws.addEventListener('close',()=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('BiDi connection closed'));}pending.clear();});
 function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id;const timer=setTimeout(()=>{pending.delete(key);reject(Error('BiDi timed out: '+method));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});}
 const session=await send('session.new',{capabilities:{alwaysMatch:{browserName:'firefox'}}});
 const {context}=await send('browsingContext.create',{type:'tab'});
 return {capabilities:session.capabilities,headless:true,
  navigate:url=>send('browsingContext.navigate',{context,url,wait:'complete'}),
  evaluate:async expression=>{const result=await send('script.evaluate',{expression:`(async()=>JSON.stringify(await (${expression})))()`,target:{context},awaitPromise:true});if(result.type!=='success')throw Error(JSON.stringify(result));return result.result.value===undefined?undefined:JSON.parse(result.result.value);},
  locateAccessible:async(role,name,startExpression)=>{
   // BiDi locators traverse the supplied DOM root, not every shadow tree.
   const params={context,locator:{type:'accessibility',value:{role,name}}};
   if(startExpression){
    const node=await send('script.evaluate',{expression:startExpression,target:{context},awaitPromise:false,serializationOptions:{maxDomDepth:0}});
    assert.equal(node.type,'success');assert(node.result.sharedId,'Expected a remote start node');
    params.startNodes=[{sharedId:node.result.sharedId}];
   }
   return (await send('browsingContext.locateNodes',params)).nodes;
  },
  actions:actions=>send('input.performActions',{context,actions}),
  addPreload:source=>send('script.addPreloadScript',{functionDeclaration:source,contexts:[context]}),
  setViewport:viewport=>send('browsingContext.setViewport',{context,viewport}),
  call:async(node,source)=>{
   const result=await send('script.callFunction',{functionDeclaration:`async element=>JSON.stringify(await (${source})(element))`,target:{context},awaitPromise:true,arguments:[{sharedId:node.sharedId}]});
   if(result.type!=='success')throw Error(JSON.stringify(result));
   return result.result.value===undefined?undefined:JSON.parse(result.result.value);
  },
  locateAcrossRoots:async(role,name,rootExpression='document')=>{
   const expression=`(()=>{const roots=[${rootExpression}];for(let i=0;i<roots.length;i++)for(const el of [roots[i],...roots[i].querySelectorAll('*')])if(el.shadowRoot)roots.push(el.shadowRoot);return roots;})()`;
   const result=await send('script.evaluate',{expression,target:{context},awaitPromise:false,serializationOptions:{maxDomDepth:0}});
   assert.equal(result.type,'success');assert.equal(result.result.type,'array');
   const startNodes=result.result.value.map(node=>({sharedId:node.sharedId}));assert(startNodes.every(node=>node.sharedId));
   const found=await send('browsingContext.locateNodes',{context,locator:{type:'accessibility',value:{role,name}},startNodes});
   return [...new Map(found.nodes.map(node=>[node.sharedId,node])).values()];
  },
  close:async()=>{try{await send('session.end');}finally{ws.close();await stop(browser);}},
 };
}
