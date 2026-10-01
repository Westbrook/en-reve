import {render, nothing, type TemplateResult} from 'lit';

type Host = HTMLElement & {updateComplete:Promise<unknown>; scrollElement?:HTMLElement; scrollToKey?:(key:string, options:Record<string,string>)=>boolean; controller?:{scrollToKey:(key:string,options:Record<string,string>)=>boolean}; model?:{revision:{get:()=>number};anchorOffset:number;totalSize:number}; items?:Array<{key:string}>; records?:Array<{key:string}>};
type Workload = 'activity'|'document';
type Settings = {workload:Workload;template:()=>TemplateResult;selector:string;count:number;targetKey:string;startKey:string;farKey:string};
type Snapshot = Record<string,any>;
export const observationVersion='virtual-reveal-2';
export const timingPolicy=Object.freeze({frames:120,timeoutMs:8000,stableFrames:6,alignmentTolerancePx:2,idleFrames:12,maximumMountedRows:64,geometryEquality:'exact',observerOffWaitMs:1000});
const frame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const geometryFields=['offset','scrollHeight','clientHeight','targetTop','targetBottom','targetLeft','targetRight','targetHeight','viewportTop','viewportBottom','viewportLeft','viewportRight','viewportWidth','modelRevision','modelAnchorOffset','modelTotalSize','targetIdentity','itemCount'];
const same=(a:Snapshot,b:Snapshot)=>geometryFields.every(key=>a[key]===b[key])&&JSON.stringify(a.mountedKeys)===JSON.stringify(b.mountedKeys);
const aligned=(s:Snapshot)=>s.targetHeight>0&&s.targetHeight<=s.viewportBottom-s.viewportTop&&s.alignmentError!==null&&Math.abs(s.alignmentError)<timingPolicy.alignmentTolerancePx&&s.targetTop<s.viewportBottom&&s.targetBottom>s.viewportTop;
async function settleTree(parent:ParentNode){const pending:Promise<unknown>[]=[];const visit=(root:ParentNode)=>{for(const node of Array.from(root.children)){const element=node as HTMLElement&{updateComplete?:Promise<unknown>};if(element.updateComplete)pending.push(element.updateComplete);if(element.shadowRoot)visit(element.shadowRoot);visit(element);}};visit(parent);await Promise.all(pending);}

export function installRevealFixture(settings:Settings){
  const outlet=document.querySelector<HTMLElement>('#fixture')!;
  let wrapper:HTMLElement|undefined,host:Host|undefined;
  const identities=new WeakMap<Node,number>();let nextIdentity=0;
  const identity=(node:Node|null)=>{if(!node)return null;let id=identities.get(node);if(!id){id=++nextIdentity;identities.set(node,id);}return id;};
  const active=()=>{let element=document.activeElement;while(element?.shadowRoot?.activeElement)element=element.shadowRoot.activeElement;return element as HTMLInputElement|null;};
  const interaction=()=>{const element=active(),selection=window.getSelection();return {focus:identity(element),selection:selection?{anchor:identity(selection.anchorNode),anchorOffset:selection.anchorOffset,focus:identity(selection.focusNode),focusOffset:selection.focusOffset,rangeCount:selection.rangeCount}:null,inputSelection:element&&('selectionStart'in element)?{start:element.selectionStart,end:element.selectionEnd,direction:element.selectionDirection}:null};};
  const records=()=>host?.items??host?.records??[];
  const viewport=()=>settings.workload==='activity'?host?.scrollElement:document.scrollingElement as HTMLElement;
  const invalid=(s:Snapshot)=>!s.connected||s.liveHosts!==1?'host ownership':s.itemCount!==settings.count||!s.targetExists?'record identity/count':s.mounted>timingPolicy.maximumMountedRows?'mounted-row safety bound':s.targetHeight!==null&&s.targetHeight>s.viewportBottom-s.viewportTop?'tall target needs reviewed alignment rule':null;
  const initialEligibility=(s:Snapshot)=>invalid(s)??(s.offset!==0||records()[0]?.key!==settings.startKey||!s.mountedKeys.includes(settings.startKey)?'initial reading position changed':aligned(s)?'initial target is already aligned':null);
  const unchangedInteraction=(a:Snapshot,b:Snapshot)=>JSON.stringify(a.interaction)===JSON.stringify(b.interaction);
  const fixture={
    ready:false,workload:settings.workload,targetKey:settings.targetKey,startKey:settings.startKey,farKey:settings.farKey,observationVersion,timingPolicy,
    publicHost:()=>host,publicViewport:()=>viewport(),publicContent:()=>host?.shadowRoot?.querySelector(settings.workload==='activity'?'[data-history-list]':'ul'),publicRecords:records,
    async mount():Promise<Snapshot>{
      await fixture.dispose();wrapper=document.createElement('section');outlet.append(wrapper);render(settings.template(),wrapper);
      for(let pass=0;pass<3;pass++){await settleTree(wrapper);await frame();}
      host=wrapper.querySelector<Host>(settings.selector)!;if(!host)throw Error('Missing workload host');
      await host.updateComplete;await document.fonts.ready;
      if(records().length!==settings.count)throw Error('Unexpected record count');
      if(settings.workload==='activity'){if(!host.scrollElement)throw Error('Missing public activity scrollElement');host.scrollElement.scrollTop=0;host.scrollElement.scrollIntoView({behavior:'instant',block:'center'});}else window.scrollTo({top:0,behavior:'instant'});
      for(let index=0;index<12;index++)await frame();
      const prepared=fixture.snapshot(),reason=initialEligibility(prepared);if(reason)throw Error(reason);fixture.ready=true;return prepared;
    },
    request(key=fixture.targetKey,behavior='instant'):boolean{
      if(!host?.isConnected)throw Error('Reveal requires a connected fixture');
      return settings.workload==='activity'?host.scrollToKey!(key,{behavior,block:'center',container:'nearest'}):host.controller!.scrollToKey(key,{behavior,block:'start'});
    },
    registry(){
      let constructorAvailable=false;try{new CustomElementRegistry();constructorAvailable=true;}catch{}
      const root=host?.shadowRoot as (ShadowRoot&{customElementRegistry?:CustomElementRegistry|null})|undefined;
      const nativeAssociation=!!host&&'customElementRegistry'in host;
      const actual=root&&'customElementRegistry'in root?root.customElementRegistry:undefined;
      const hostRegistry=(host as Host&{customElementRegistry?:CustomElementRegistry|null}|undefined)?.customElementRegistry;
      const label=(value:CustomElementRegistry|null|undefined)=>value===null?'unassociated':value===undefined?'global fallback':value===customElements?'native global owner':'scoped owner';
      return {host:settings.workload==='activity'?label(hostRegistry):'inapplicable',shadow:settings.workload==='activity'?label(actual):'inapplicable',requested:settings.workload==='activity'?'global delivery; automatic document owner':'not applicable to native rows',constructorAvailable,nativeAssociation,actual:settings.workload==='document'?'native-row fixture; no registry policy dimension':actual===null?'unassociated':actual===undefined?'global fallback':actual===customElements?'native global owner':'scoped owner'};
    },
    snapshot(key=fixture.targetKey):Snapshot{
      const current=host,port=viewport();
      if(!current?.isConnected||!port)return {now:performance.now(),connected:false,liveHosts:outlet.querySelectorAll(settings.selector).length,offset:0,scrollHeight:0,clientHeight:0,targetTop:null,targetBottom:null,targetLeft:null,targetRight:null,targetHeight:null,viewportTop:0,viewportBottom:0,viewportLeft:0,viewportRight:0,viewportWidth:0,alignmentError:null,mounted:0,mountedKeys:[],modelRevision:null,modelAnchorOffset:null,modelTotalSize:null,modelRevisionStatus:settings.workload==='document'?'disconnected':'inapplicable',targetIdentity:null,targetKey:null,targetExists:false,itemCount:0,interaction:interaction()};
      const rows=Array.from(current.shadowRoot!.querySelectorAll<HTMLElement>('[data-en-virtual-key]'));
      const target=rows.find(row=>row.dataset.enVirtualKey===key),rect=target?.getBoundingClientRect();
      const box=settings.workload==='activity'?port.getBoundingClientRect():null;
      const top=box?box.top+port.clientTop:48,bottom=box?box.top+port.clientTop+port.clientHeight:document.documentElement.clientHeight-24;
      const left=box?box.left+port.clientLeft:0,width=box?port.clientWidth:document.documentElement.clientWidth;
      const alignmentError=rect?(settings.workload==='activity'?(rect.top+rect.bottom-top-bottom)/2:rect.top-top):null;
      const data=records();
      return {now:performance.now(),connected:true,liveHosts:outlet.querySelectorAll(settings.selector).length,offset:port.scrollTop,scrollHeight:port.scrollHeight,clientHeight:settings.workload==='activity'?port.clientHeight:document.documentElement.clientHeight,targetTop:rect?.top??null,targetBottom:rect?.bottom??null,targetLeft:rect?.left??null,targetRight:rect?.right??null,targetHeight:rect?.height??null,viewportTop:top,viewportBottom:bottom,viewportLeft:left,viewportRight:left+width,viewportWidth:width,alignmentError,mounted:rows.length,mountedKeys:rows.map(row=>row.dataset.enVirtualKey!),modelRevision:settings.workload==='document'?current.model!.revision.get():null,modelAnchorOffset:settings.workload==='document'?current.model!.anchorOffset:null,modelTotalSize:settings.workload==='document'?current.model!.totalSize:null,modelRevisionStatus:settings.workload==='document'?'public':'inapplicable: activity exposes no public model revision',targetIdentity:identity(target??null),targetKey:target?.dataset.enVirtualKey??null,targetExists:data.some(item=>item.key===key),itemCount:data.length,interaction:interaction()};
    },
    async frames(count:number,key=fixture.targetKey):Promise<Snapshot[]>{
      if(!Number.isInteger(count)||count<1||count>240)throw Error('Bounded frame count required');
      return new Promise((resolve,reject)=>{const values:Snapshot[]=[];let raf=0;const timer=setTimeout(()=>{cancelAnimationFrame(raf);reject(Object.assign(Error('Bounded frame observation timed out'),{samples:values}));},timingPolicy.timeoutMs);const observe=()=>{values.push(fixture.snapshot(key));if(values.length===count){clearTimeout(timer);resolve(values);}else raf=requestAnimationFrame(observe);};raf=requestAnimationFrame(observe);});
    },
    async measureAction(before=fixture.snapshot()){
      const requestedAt=performance.now();let accepted:boolean;
      try{accepted=fixture.request();}catch(error){return {status:'failed',accepted:null,requestedAt,before,samples:[],final:null,firstAlignedMs:null,stableSixFramesMs:null,error:String(error)};}
      const samples:Snapshot[]=[];let timer:ReturnType<typeof setTimeout>|undefined,raf=0,timedOut=false,first:Snapshot|undefined,stable:Snapshot|undefined,stableIndex:number|undefined,stableFirst:Snapshot|undefined,observationError:string|undefined;
      await new Promise<void>(resolve=>{
        const done=()=>{clearTimeout(timer);cancelAnimationFrame(raf);resolve();};
        const observe=(callbackTimestamp:number)=>{try{
          const callbackEntry=performance.now(),sample={...fixture.snapshot(),callbackTimestamp,callbackEntry,frameIndex:samples.length};sample.snapshotComplete=performance.now();sample.now=sample.snapshotComplete;samples.push(sample);
          if(sample.now-requestedAt>=timingPolicy.timeoutMs){timedOut=true;done();return;}
          if(!first&&aligned(sample))first=sample;
          if(!stable&&samples.length>=timingPolicy.stableFrames&&samples.slice(-timingPolicy.stableFrames).every(value=>aligned(value)&&same(value,sample))){stable=sample;stableIndex=samples.length-1;stableFirst=samples[samples.length-timingPolicy.stableFrames];}
          if((stableIndex!==undefined&&samples.length===stableIndex+1+timingPolicy.idleFrames)||samples.length===timingPolicy.frames)done();else raf=requestAnimationFrame(observe);
        }catch(error){observationError=String(error);done();}};
        const remaining=timingPolicy.timeoutMs-(performance.now()-requestedAt);
        if(remaining<=0){timedOut=true;done();return;}
        timer=setTimeout(()=>{timedOut=true;done();},remaining);raf=requestAnimationFrame(observe);
      });
      const final=samples.at(-1),idle=stableIndex===undefined?[]:samples.slice(stableIndex+1);
      const idleStable=!!stable&&idle.length===timingPolicy.idleFrames&&idle.every(sample=>aligned(sample)&&same(sample,stable!));
      const invalidEligibility=[before,...samples].map(invalid).find(Boolean)??null;
      const interactionUnchanged=samples.every(sample=>unchangedInteraction(before,sample));
      const rowIdentityStable=!!stable&&idle.every(sample=>sample.targetIdentity===stable!.targetIdentity&&sample.targetKey===fixture.targetKey);
      return {status:accepted&&!observationError&&!timedOut&&first&&stable&&idleStable&&!invalidEligibility&&interactionUnchanged&&rowIdentityStable?'ok':'failed',accepted,requestedAt,error:observationError??null,firstAlignedMs:first?first.now-requestedAt:null,stableSixFramesMs:stable?stable.now-requestedAt:null,stableWindowFirstAt:stableFirst?.now??null,stableWindowFirstFrame:stableFirst?.frameIndex??null,requestToFirstCallbackMs:samples[0]?samples[0].callbackEntry-requestedAt:null,timedOut,observationBudgetExhausted:samples.length===timingPolicy.frames&&!idleStable,before,samples,final,invalidEligibility,interactionUnchanged,rowIdentityStable,mountedMaximum:Math.max(before.mounted,...samples.map(sample=>sample.mounted)),mountedFinal:final?.mounted??null,idleStable,idleMovementPx:idle.length&&stable?Math.max(stable.offset,...idle.map(sample=>sample.offset))-Math.min(stable.offset,...idle.map(sample=>sample.offset)):null,observationVersion,policy:timingPolicy};
    },
    async finalIdle(){
      const samples=await fixture.frames(8),last=samples.at(-1)!;
      const valid=samples.every(sample=>!invalid(sample))&&samples.slice(-4).every(sample=>same(sample,last)&&sample.mountedKeys.includes(fixture.targetKey)&&sample.offset>=0&&sample.offset<=sample.scrollHeight-sample.clientHeight+1&&aligned(sample));
      return {status:valid?'ok':'failed',samples,comparison:'Eight frames, exact final-four keys/public-revision/geometry, positive target height/intersection and valid scroll extent; existing functional suite remains separately mandatory.'};
    },
    async measurePair(observer=true){
      const actions=[];let previous:Snapshot|undefined=fixture.snapshot();const initialError=initialEligibility(previous);if(initialError)return {status:'failed',observer,actions,initialError,prepared:previous};
      for(const endpoint of ['initial','repeat']){try{
        if(observer){const action=await fixture.measureAction(previous);actions.push({endpoint,...action});if(action.status!=='ok')return {status:'failed',observer,actions};previous=action.final??undefined;}
        else{
          const before=previous??fixture.snapshot(),accepted=fixture.request();
          // No geometry reads or host round trips while this operation is active.
          await wait(timingPolicy.observerOffWaitMs);
          const final=fixture.snapshot();
          const ok=accepted&&!invalid(before)&&!invalid(final)&&aligned(final)&&unchangedInteraction(before,final)&&final.targetKey===fixture.targetKey;
          actions.push({endpoint,status:ok?'ok':'failed',accepted,before,final,controlWaitMs:timingPolicy.observerOffWaitMs,measurement:'observer-off correctness control; never a timing sample'});
          if(!ok)return {status:'failed',observer,actions};previous=final;
        }
        }catch(error){actions.push({endpoint,status:'failed',error:String(error)});return {status:'failed',observer,actions};}
        // The next request follows in this browser promise chain, with no
        // intentional delay or host/CDP round trip after the preceding tail.
      }
      try{const finalIdle=await fixture.finalIdle();return {status:finalIdle.status,observer,actions,finalIdle};}catch(error){return {status:'failed',observer,actions,finalIdle:{status:'failed',error:String(error),samples:(error as {samples?:Snapshot[]}).samples??[]}};}
    },
    async dispose(hooks?:{beforeRemove?:()=>void;afterRemove?:()=>void}):Promise<void>{
      fixture.ready=false;
      try{hooks?.beforeRemove?.();if(wrapper){render(nothing,wrapper);wrapper.remove();}hooks?.afterRemove?.();}
      finally{host=undefined;wrapper=undefined;}
      await frame();await frame();
    },
  };
  (window as any).revealFixture=fixture;
  void fixture.mount().catch(error=>{(window as any).revealFixtureError=String(error.stack??error);throw error;});
}
