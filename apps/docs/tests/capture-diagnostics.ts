import type {Browser, BrowserContext, Page, Request} from '@playwright/test';

export interface CaptureStartupFailure {
 error: string;
 elapsedMs: number;
 contextOptions: unknown;
 pendingRequests: string[];
 events: Array<{kind: string; text: string}>;
 snapshot: unknown;
}

/** Observe failed waits without changing their timeout, result, actions or DOM. */
export function observeCaptureStartup(browser: Browser, failures: CaptureStartupFailure[]): Browser {
 return new Proxy(browser, {get(target, property) {
  if(property==='newContext') return async (...args: Parameters<Browser['newContext']>) => {
   const context=await target.newContext(...args);
   return observeContext(context, args[0], failures);
  };
  const value=Reflect.get(target, property, target);
  return typeof value==='function'?value.bind(target):value;
 }});
}

function observeContext(context: BrowserContext, contextOptions: Parameters<Browser['newContext']>[0], failures: CaptureStartupFailure[]): BrowserContext {
 const events: CaptureStartupFailure['events']=[],pending=new Set<Request>();
 const record=(kind:string,text:string)=>{events.push({kind,text:text.slice(0,2000)});if(events.length>40)events.shift();};
 context.on('request',request=>pending.add(request));
 context.on('requestfinished',request=>pending.delete(request));
 context.on('requestfailed',request=>{pending.delete(request);record('requestfailed',request.url()+': '+request.failure()?.errorText);});
 context.on('page',page=>{
  page.on('pageerror',error=>record('pageerror',error.message));
  page.on('console',message=>{if(['warning','error'].includes(message.type()))record(message.type(),message.text());});
  page.on('framenavigated',frame=>record('navigation',frame.url()));
  page.on('crash',()=>record('crash',page.url()));
 });
 return new Proxy(context,{get(target,property){
  if(property==='newPage')return async()=>observePage(await target.newPage());
  const value=Reflect.get(target,property,target);
  return typeof value==='function'?value.bind(target):value;
 }});
 function observePage(page:Page):Page {
  return new Proxy(page,{get(target,property){
   if(property==='waitForFunction')return async(...args:unknown[])=>{
    const start=Date.now();
    try{return await Reflect.apply(target.waitForFunction,target,args);}
    catch(error){
     const elapsedMs=Date.now()-start;
     let timer:ReturnType<typeof setTimeout>|undefined;
     let snapshot:unknown;
     try {
      snapshot=await Promise.race([
       target.evaluate(()=>({url:location.href,readyState:document.readyState,visibility:document.visibilityState,
        reply:(window as Window&{captureReply?:unknown}).captureReply??null,
        frames:[...document.querySelectorAll('iframe')].map(frame=>{
         try{const doc=frame.contentDocument,root=doc?.querySelector('[data-en-theme-preview],en-sticker-app,en-workflows-app');
          return {url:frame.contentWindow?.location.href,readyState:doc?.readyState,
           previewRoots:doc?.querySelectorAll('[data-en-theme-preview]').length??0,
           rootTag:root?.localName,rootDefined:!!(root&&frame.contentWindow?.customElements.get(root.localName)),
           rootDeferred:root?.hasAttribute('defer-hydration')};}
         catch{return {url:frame.src,inaccessible:true};}
        })})),
       new Promise(resolve=>{timer=setTimeout(()=>resolve({unavailable:'Snapshot exceeded 1000ms diagnostic budget.'}),1000);}),
      ]);
     }catch(diagnosticError){snapshot={unavailable:String(diagnosticError)};}
     finally{if(timer)clearTimeout(timer);}
     failures.push({error:String(error),elapsedMs,contextOptions:{viewport:contextOptions?.viewport,colorScheme:contextOptions?.colorScheme,reducedMotion:contextOptions?.reducedMotion},
      pendingRequests:[...pending].slice(-40).map(request=>request.url().slice(0,2000)),events:[...events],snapshot});
     throw error;
    }
   };
   const value=Reflect.get(target,property,target);
   return typeof value==='function'?value.bind(target):value;
  }});
 }
}
