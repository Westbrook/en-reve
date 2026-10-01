import { isHTMLElement } from './internal/dom-kind.js';
import { isCollectionKey, type CollectionMode } from '@en-reve/primitives/state/collection.js';
import {html,nothing,type PropertyValues} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {VirtualCollection,type VirtualEntry} from '@en-reve/primitives/state/virtual-collection.js';
import {VirtualCollectionController,type ScrollToKeyOptions} from '@en-reve/primitives/interactions/virtual-collection.js';
import {beginScrollIntoView,normalizeScrollOptions} from '@en-reve/primitives/interactions/scroll-into-view.js';
import {EnElement} from './internal/en-element.js';
import {foundationStyles,blockHostStyles} from '@en-reve/styles/foundations.js';
import {collaborationStyles} from '@en-reve/styles/collaboration.js';
import {dispatchAction,dispatchChange,dispatchNotification,type ChangeDetail,type PageChangeEvent,type LoadStateDetail,type LoadStateChangeEvent,type ActionDetail,type ChangeOutcome} from '@en-reve/primitives/interactions/events.js';
/** Application-owned records in newest-first reading order; group labels are already localized. */
export interface ActivityRecord {
 readonly key:string;
 readonly author:string;
 readonly text:string;
 readonly datetime?:string;
 readonly timeLabel?:string;
 readonly label?:string;
 readonly group?:string;
}
/** Completion of one older-page request. Keys may replace earlier records without duplicates. */
export interface ActivityPage {readonly items:readonly ActivityRecord[];readonly cursor?:string;readonly hasMore:boolean;}
/** A single request lease. Late completion after cancellation/replacement/disconnection is ignored. */
export interface ActivityLoadDetail {
 readonly cursor:string;
 readonly signal:AbortSignal;
 complete(page:ActivityPage):void;
 fail(message:string):void;
}
/** Cancelable application request. Claim respondWith synchronously during dispatch. */
export interface ActivityLoadRequestEvent extends CustomEvent<ActivityLoadDetail> {
 respondWith(response:ActivityPage|PromiseLike<ActivityPage>):void;
}
export interface ActivityLoadStateDetail extends LoadStateDetail {
 readonly cursor:string;
 readonly error?:string;
}
export type ActivityLoadStateChangeEvent=LoadStateChangeEvent<ActivityLoadStateDetail>;
export type ActivityPageChangeEvent=PageChangeEvent & CustomEvent<ChangeDetail<number,'pagination'> & {
 /** @deprecated Use proposed. */ readonly page:number;
}>;
export interface ActivityFeedEventMap {
 'en-page-change':ActivityPageChangeEvent;
 'en-load-request':ActivityLoadRequestEvent;
 'en-load-state-change':ActivityLoadStateChangeEvent;
 /** @deprecated Use en-load-request. */ 'en-load':CustomEvent<ActivityLoadDetail>;
 'en-action':CustomEvent<ActionDetail<'show-updates'|'load-more'>>;
}
/**
 * Authored or keyed activity history. The application owns records, ordering and transport.
 * @tagname en-activity-feed
 * @slot - en-activity-item entries in authored reading order.
 * @slot empty - Empty-state explanation and optional recovery actions.
 * @slot loading - Loading presentation; previously loaded entries remain readable.
 * @slot header - Optional visible grouping heading/context.
 * @slot footer - Optional pagination or other application-owned controls.
 * @csspart base - Feed layout.
 * @csspart list - Named list containing authored items.
 * @csspart updates - Show-updates button host.
 * @csspart load-more - Older-activity button host.
 * @csspart empty - Empty-state container.
 * @csspart loading - Loading-state container.
 * @csspart viewport - Optional bounded virtual scrolling surface.
 * @csspart row - Keyed data record wrapper.
 * @csspart group-context - Current virtual reading group, also provided as each listitem description.
 * @csspart group-heading - Explicit date/group boundary heading.
 * @csspart pagination - Full-page reading navigation.
 * @csspart cancel-load - Cancel the active data-page request.
 * @csspart error - Failed data-page request explanation.
 * @cssprop --en-activity-viewport-size - Virtual history block size; defaults to 28rem.
 * @fires {ActivityLoadRequestEvent} en-load-request - Cancelable older-page request; synchronously claim respondWith, or use complete/fail callbacks.
 * @fires {ActivityLoadStateChangeEvent} en-load-state-change - Noncancelable loading, loaded, empty, error or canceled-to-idle status.
 * @fires {CustomEvent<ActivityLoadDetail>} en-load - Deprecated request fallback when en-load-request was not claimed or canceled.
 * @fires {ActivityPageChangeEvent} en-page-change - Cancelable tentative page proposal; previous/proposed/reason plus deprecated page alias.
 * @csspart announcement - Explicit polite status text, separate from the list.
 * @cssprop --en-activity-gap - Space between entries and feed sections.
 * @fires {CustomEvent<ActionDetail<'show-updates'|'load-more'>>} en-action - Cancelable show-updates or load-more request. Authored mode only requests; data mode reveals the buffer or starts en-load-request after acceptance. Focus is not moved.
 */
export class EnActivityFeed extends EnElement<ActivityFeedEventMap>{
 static override properties={label:{},empty:{type:Boolean},loading:{type:Boolean},pending:{type:Number},updates:{type:Boolean},hasMore:{type:Boolean,attribute:'has-more'},updatesLabel:{attribute:'updates-label'},currentLabel:{attribute:'current-label'},moreLabel:{attribute:'more-label'},emptyLabel:{attribute:'empty-label'},loadingLabel:{attribute:'loading-label'},announcement:{},items:{attribute:false,noAccessor:true},renderItem:{attribute:false},mode:{reflect:true},page:{type:Number,noAccessor:true},pageSize:{type:Number,attribute:'page-size'},cursor:{},error:{},retryLabel:{attribute:'retry-label'},cancelLabel:{attribute:'cancel-label'},previousLabel:{attribute:'previous-label'},nextLabel:{attribute:'next-label'},pageLabel:{attribute:'page-label'}};
 static override styles=[foundationStyles,blockHostStyles,collaborationStyles];
 private records:readonly ActivityRecord[]|undefined;
 private itemsRevision=0;
 /** Undefined preserves authored slots; an array opts into the keyed data API. Replace arrays for edits. */
 get items():readonly ActivityRecord[]|undefined{return this.records;}
 set items(value:readonly ActivityRecord[]|undefined){if(value!==undefined&&!Array.isArray(value))throw new TypeError('Activity items must be an array or undefined.');this.validate(value??[]);const previous=this.records;this.records=value;this.itemsRevision++;if(this.activeLoad)this.cancelLoad();this.requestUpdate('items',previous);}
 /** Optional renderer for the managed en-activity-item's body/author/avatar/metadata/attachments/actions slots. Never return another listitem wrapper. */ declare renderItem:((item:ActivityRecord,index:number)=>unknown)|undefined;
 /** all mounts every record; virtual windows measured rows; paginated mounts the current page. Legacy list/paged aliases remain accepted. */ declare mode:CollectionMode|'list'|'paged';
 private get paginated():boolean{return this.mode==='paginated'||this.mode==='paged';}
 private pageValue=1;
 private pageRevision=0;
 /** One-based full-content reading page, clamped to the available data when rendered. */
 get page():number{return this.pageValue;}
 set page(value:number){const previous=this.pageValue;this.pageValue=value;this.pageRevision++;this.requestUpdate('page',previous);}
 /** Entries per full-content reading page; positive integers, default 20. */ declare pageSize:number;
 /** Opaque application cursor sent to the next en-load-request. */ declare cursor:string;
 /** Recoverable data load error; loaded history is retained. */ declare error:string;
 /** Localized retry, cancellation and paging controls. */ declare retryLabel:string;declare cancelLabel:string;declare previousLabel:string;declare nextLabel:string;declare pageLabel:string;
 private buffered:readonly ActivityRecord[]=[];
 private activeLoad?:{controller:AbortController;accepted:boolean;started:boolean;id:number;cursor:string};
 private loadSequence=0;
 private loadStateValue:ActivityLoadStateDetail=Object.freeze({status:'idle',requestId:0,cursor:''});
 /** Latest managed request status. Author-owned loading presentation is independent. */
 get loadState():ActivityLoadStateDetail{return this.loadStateValue;}
 private reportLoad(status:LoadStateDetail['status'],request:{id:number;cursor:string},error?:string):void{
  const state=Object.freeze({status,requestId:request.id,cursor:request.cursor,...(error===undefined?{}:{error})});
  this.loadStateValue=state;dispatchNotification(this,'en-load-state-change',state);
 }
 private readonly collection=new VirtualCollection<ActivityRecord>({items:[],key:item=>item.key,estimateSize:180,initialCount:8,overscan:2});
 private readonly virtual=new VirtualCollectionController(this,this.collection,{
  viewport:()=>this.scrollElement,content:()=>this.renderRoot.querySelector('[data-history-list]'),enabled:()=>this.items!==undefined&&this.mode==='virtual',
 });
 private previousItems?:readonly ActivityRecord[];
 private focusBeforeUpdate?:HTMLElement;
 private recoveryKey?:string;
 private recoverLoadFocus=false;
 private readingAnchor?:{key:string;top:number;scroll:HTMLElement};
 private captureReadingAnchor(){
  if(this.mode==='virtual'||this.paginated||!this.ownerDocument?.defaultView)return;
  const rows=Array.from(this.renderRoot.querySelectorAll<HTMLElement>('[data-en-virtual-key]'));
  let parent:Element|null=this,scroll=this.ownerDocument.scrollingElement as HTMLElement;
  while(parent){if(isHTMLElement(parent)&&/(auto|scroll)/.test(this.ownerDocument.defaultView.getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight){scroll=parent;break;}parent=parent.parentElement??((parent.getRootNode() as ShadowRoot).host??null);}
  const bounds=scroll===this.ownerDocument.scrollingElement?{top:0,bottom:this.ownerDocument.defaultView.innerHeight}:scroll.getBoundingClientRect();
  const row=rows.find(row=>{const rect=row.getBoundingClientRect();return rect.bottom>bounds.top&&rect.top<bounds.bottom;});
  if(row)this.readingAnchor={key:row.dataset.enVirtualKey!,top:row.getBoundingClientRect().top,scroll};
 }
 private deepFocus():HTMLElement|null{let active:Element|null=this.ownerDocument?.activeElement??null;while(active?.shadowRoot?.activeElement)active=active.shadowRoot.activeElement;return active as HTMLElement|null;}
 private focusedRow(active:Element|null):HTMLElement|null{while(active){if(isHTMLElement(active)&&active.hasAttribute('data-en-virtual-key'))return active;active=active.assignedSlot??active.parentElement??((active.getRootNode() as ShadowRoot).host??null);}return null;}
 /** Accessible list name. */ declare label:string;
 /** Explicit empty state; does not inspect or delete authored content. */ declare empty:boolean;
 /** Loading indication; retains current items and blocks repeat requests. */ declare loading:boolean;
 /** Count of buffered incoming items, supplied by the app. */ declare pending:number;
 /** Keep the update button present, including its unavailable Up to date state. */ declare updates:boolean;
 /** Display the load-more request button. */ declare hasMore:boolean;
 /** Localized show-updates text; {count} becomes the pending count. */ declare updatesLabel:string;
 /** Localized no-pending-updates label. */ declare currentLabel:string;
 /** Localized load-more label. */ declare moreLabel:string;
 /** Localized empty fallback. */ declare emptyLabel:string;
 /** Localized loading fallback. */ declare loadingLabel:string;
 /** Explicit concise polite announcement; no activity body is automatically announced. */ declare announcement:string;
 constructor(){super();this.items=undefined;this.renderItem=undefined;this.mode='list';this.page=1;this.pageSize=20;this.cursor='';this.error='';this.retryLabel='Retry older activity';this.cancelLabel='Cancel loading';this.previousLabel='Newer page';this.nextLabel='Older page';this.pageLabel='Page {page} of {pages}';this.label='Activity';this.empty=false;this.loading=false;this.pending=0;this.updates=false;this.hasMore=false;this.updatesLabel='Show updates ({count})';this.currentLabel='Up to date';this.moreLabel='Load older activity';this.emptyLabel='No activity yet.';this.loadingLabel='Loading activity…';this.announcement='';}
 private get count(){return this.items!==undefined?this.buffered.length:Number.isFinite(this.pending)?Math.max(0,Math.floor(this.pending)):0;}
 private get sizeOfPage(){return Number.isFinite(this.pageSize)&&this.pageSize>=1?Math.floor(this.pageSize):20;}
 private get pageCount(){return Math.max(1,Math.ceil((this.items?.length??0)/this.sizeOfPage));}
 private get currentPage(){return Math.min(this.pageCount,Math.max(1,Math.floor(this.page)||1));}
 /** Count of keyed incoming entries waiting for explicit reveal. */ get pendingCount(){return this.count;}
 /** Internal virtual scroll surface, or null in authored/full-list/paged mode. */ get scrollElement():HTMLElement|null{return this.mode==='virtual'?this.renderRoot.querySelector('[part~="viewport"]'):null;}
 private validate(items:readonly ActivityRecord[]){const keys=new Set<string>();for(const item of items){if(!item||!isCollectionKey(item.key)||keys.has(item.key))throw new TypeError('Activity records require unique nonblank string keys.');keys.add(item.key);}}
 private merge(older:readonly ActivityRecord[],incoming:readonly ActivityRecord[]){this.validate(incoming);const positions=new Map(older.map((item,index)=>[item.key,index]));const result=[...older];for(const item of incoming){const index=positions.get(item.key);if(index===undefined){positions.set(item.key,result.length);result.push(item);}else result[index]=item;}return result;}
 protected override willUpdate(changed:PropertyValues){
  this.recoverLoadFocus=!this.loading&&!!this.renderRoot?.querySelector('[part="cancel-load"]')?.matches(':focus-within');
  if(changed.has('items'))this.captureReadingAnchor();
  const active=this.deepFocus(),row=this.focusedRow(active);
  this.focusBeforeUpdate=row&&this.renderRoot.contains(row)?active??undefined:undefined;
  this.recoveryKey=undefined;
  if(row&&this.focusBeforeUpdate){
   const key=row.dataset.enVirtualKey!;
   if(!this.items?.some(item=>item.key===key)){
    const index=this.previousItems?.findIndex(item=>item.key===key)??0;
    this.recoveryKey=this.items?.[Math.min(Math.max(0,index),Math.max(0,this.items.length-1))]?.key;
   }
   if(changed.has('mode')&&this.paginated){
    const index=this.items?.findIndex(item=>item.key===key)??-1;
    if(index>=0)this.page=Math.floor(index/this.sizeOfPage)+1;
   }
  }
  if(this.items!==this.previousItems){
   this.validate(this.items??[]);
   this.previousItems=this.items;this.collection.setItems(this.items??[]);
  }
  if((changed.has('pageSize')||changed.has('items'))&&this.page!==this.currentPage)this.page=this.currentPage;
 }
 protected override updated(){
  if(this.recoverLoadFocus){this.recoverLoadFocus=false;const active=this.deepFocus(),cancel=this.renderRoot.querySelector('[part="cancel-load"]');if(!active||active===this.ownerDocument.body||active===this.ownerDocument.documentElement||active===this||cancel?.matches(':focus-within'))this.renderRoot.querySelector<HTMLElement>(this.hasMore?'[part="load-more"]':'[part="viewport"]')?.focus({preventScroll:true});}

  const anchor=this.readingAnchor;this.readingAnchor=undefined;
  if(anchor)this.ownerDocument.defaultView?.requestAnimationFrame(()=>{if(!this.isConnected)return;const row=Array.from(this.renderRoot.querySelectorAll<HTMLElement>('[data-en-virtual-key]')).find(row=>row.dataset.enVirtualKey===anchor.key);if(row)anchor.scroll.scrollTop+=row.getBoundingClientRect().top-anchor.top;});
  const previous=this.focusBeforeUpdate;this.focusBeforeUpdate=undefined;
  if(!previous)return;
  const active=this.deepFocus();
  if(active&&active!==this.ownerDocument.body&&active!==this.ownerDocument.documentElement&&active!==this&&active!==previous)return;
  if(previous.isConnected){if(active!==previous)previous.focus({preventScroll:true});return;}
  const row=Array.from(this.renderRoot.querySelectorAll<HTMLElement>('[data-en-virtual-key]')).find(row=>row.dataset.enVirtualKey===this.recoveryKey);
  const target=row?.querySelector<HTMLElement>('en-activity-item')??this.renderRoot.querySelector<HTMLElement>('[part~="viewport"]');target?.focus({preventScroll:true});
 }
 override disconnectedCallback(){this.cancelLoad();super.disconnectedCallback();}
 /** Queue newest-first incoming records without changing reading position, mounted rows or focus. */
 bufferItems(items:readonly ActivityRecord[]):void{if(this.items===undefined)return;this.validate(items);const keys=new Set(items.map(item=>item.key));this.buffered=[...items,...this.buffered.filter(item=>!keys.has(item.key))];this.requestUpdate();}
 /** Explicitly reveal the buffer, preserving the virtual viewport's first visible key. Returns false if canceled. */
 showUpdates():boolean{
  if(this.items===undefined||!this.count||this.loading)return false;
  const revision=this.itemsRevision;
  if(!dispatchAction(this,{action:'show-updates',data:undefined},{cancelable:true})||revision!==this.itemsRevision)return false;
  const incoming=this.buffered,keys=new Set(incoming.map(item=>item.key));this.items=[...incoming,...this.items.filter(item=>!keys.has(item.key))];this.buffered=[];this.page=1;this.requestUpdate();return true;
 }
 /** Ask for older records. Returns request acceptance, not completion. Callback-only consumers must complete, fail or cancel. */
 requestOlder():boolean{
  if(this.items===undefined||this.loading||this.activeLoad||!this.hasMore)return false;
  const revision=this.itemsRevision,connected=this.isConnected;
  if(!dispatchAction(this,{action:'load-more',data:undefined},{cancelable:true})||revision!==this.itemsRevision||this.activeLoad||this.loading)return false;
  const ViewAbort=this.ownerDocument?.defaultView?.AbortController??AbortController;
  const request={controller:new ViewAbort(),accepted:false,started:false,id:++this.loadSequence,cursor:this.cursor};this.activeLoad=request;
  // Register first so idle observers see an aborted signal before application abort handlers can retry.
  request.controller.signal.addEventListener('abort',()=>{if(request.started)this.reportLoad('idle',request);},{once:true});
  const owns=()=>this.activeLoad===request&&!request.controller.signal.aborted;
  const settle=(result:ActivityPage|string)=>queueMicrotask(()=>{
   if(!owns()||!request.accepted)return;
   if(typeof result==='string'){this.activeLoad=undefined;this.loading=false;this.error=result;this.requestUpdate();this.reportLoad('error',request,result);return;}
   try{
    const items=this.merge(this.items??[],result.items);this.activeLoad=undefined;this.items=items;this.cursor=result.cursor??'';this.hasMore=result.hasMore;this.error='';this.loading=false;
    this.reportLoad(result.items.length?'loaded':'empty',request);
   }catch(error){this.activeLoad=undefined;this.loading=false;this.error=error instanceof Error?error.message:String(error);this.reportLoad('error',request,this.error);}
  });
  let claimed=false,dispatching=true;
  const detail:ActivityLoadDetail=Object.freeze({cursor:request.cursor,signal:request.controller.signal,
   complete:(page:ActivityPage)=>{if(claimed)return;claimed=true;settle(page);},
   fail:(message:string)=>{if(claimed)return;claimed=true;settle(message);},
  });
  const EventClass=this.ownerDocument?.defaultView?.CustomEvent??CustomEvent;
  const respond=(response:ActivityPage|PromiseLike<ActivityPage>):void=>{
   if(!dispatching||claimed||!owns())throw new DOMException('The response must be claimed once during request dispatch.','InvalidStateError');
   claimed=true;
   void Promise.resolve(response).then(page=>settle(page),error=>settle(error instanceof Error?error.message:String(error)));
  };
  // Use the receiving document's realm; consumers type this protocol, never inspect class identity.
  class RequestEvent extends EventClass<ActivityLoadDetail> {
   respondWith(response:ActivityPage|PromiseLike<ActivityPage>):void{respond(response);}
  }
  const event=new RequestEvent('en-load-request',{detail,bubbles:true,composed:true,cancelable:true});
  try{
   request.accepted=this.dispatchEvent(event);
   if(request.accepted&&!claimed&&owns()&&revision===this.itemsRevision&&(!connected||this.isConnected)){
    request.accepted=this.dispatchEvent(new EventClass<ActivityLoadDetail>('en-load',{detail,bubbles:true,composed:true,cancelable:true}));
   }
  }finally{dispatching=false;}
  if(!request.accepted||!owns()||revision!==this.itemsRevision||(connected&&!this.isConnected)){
   if(this.activeLoad===request)this.activeLoad=undefined;
   request.controller.abort();return false;
  }
  request.started=true;this.loading=true;this.error='';this.reportLoad('loading',request);
  return owns();
 }
 /** Abort the active request, report idle once, and retain entries/cursor. Late responses are ignored. */
 cancelLoad():void{
  const request=this.activeLoad;if(!request){this.loading=false;return;}
  this.activeLoad=undefined;this.loading=false;
  request.controller.abort();
 }
 /** Propose a loaded reading page. The page is tentative during dispatch; author writes supersede rollback. */
 goToPage(page:number):boolean{return this.requestGoToPage(page)==='committed';}
 /** Request a loaded page; unavailable means no data or a nonfinite page. Commit is semantic state, not render completion. */
 requestGoToPage(page:number):ChangeOutcome|'unavailable'{
  if(this.items===undefined||!Number.isFinite(page))return 'unavailable';
  const next=Math.min(this.pageCount,Math.max(1,Math.floor(page))),previous=this.currentPage,itemsRevision=this.itemsRevision;
  const outcome=dispatchChange(this,{previous,proposed:next,reason:'pagination',getRevision:()=>this.pageRevision,
   stage:value=>{this.pageValue=value;},rollback:value=>{this.pageValue=value;},
   canCommit:()=>itemsRevision===this.itemsRevision&&this.items!==undefined&&next<=this.pageCount,
   commit:()=>this.requestUpdate('page',previous),
  },{eventName:'en-page-change',extraDetail:{page:next}});
  return outcome;
 }
 /** Reveal a loaded key; paged mode selects its full page. Does not move focus. */
 scrollToKey(key:string,options:ScrollToKeyOptions={}):boolean{
  const normalized=normalizeScrollOptions(options);
  const index=this.items?.findIndex(item=>item.key===key)??-1;if(index<0)return false;
  if(this.mode==='virtual'){this.collection.setItems(this.items!);return this.virtual.scrollToKey(key,normalized);}
  if(this.paginated)this.page=Math.floor(index/this.sizeOfPage)+1;
  void this.updateComplete.then(()=>{const row=Array.from(this.renderRoot.querySelectorAll<HTMLElement>('[data-en-virtual-key]')).find(row=>row.dataset.enVirtualKey===key);if(row)beginScrollIntoView(row,normalized);});return true;
 }
 /** Call after offscreen theme/font/density changes that alter estimated geometry. */
 invalidateMeasurements():void{this.virtual.invalidateMeasurements();}
 private dataTemplate(){
  const items=this.items??[],start=this.paginated?(this.currentPage-1)*this.sizeOfPage:0;
  const entries:readonly VirtualEntry<ActivityRecord>[]=this.mode==='virtual'?this.collection.entries:items.slice(start,this.paginated?start+this.sizeOfPage:undefined).map((item,index)=>({kind:'item' as const,key:item.key,item,index:index+start,offset:0,size:0}));
  const visible=this.mode==='virtual'?this.collection.entries.find(entry=>entry.kind==='item'&&entry.offset+entry.size>this.collection.anchorOffset):undefined;
  const currentGroup=visible?.kind==='item'?visible.item.group:undefined;
  return html`${this.mode==='virtual'&&currentGroup?html`<div class="history-context" part="group-context" aria-hidden="true">${currentGroup}</div>`:nothing}<div class="history-viewport" part="viewport" ?data-virtual=${this.mode==='virtual'} tabindex=${this.mode==='virtual'?'0':'-1'} role="region" aria-label=${this.label}>
   <div class="history-list" part="list" role="list" aria-label=${this.label} data-history-list>
   ${repeat(entries,entry=>`${entry.kind}:${entry.key}`,entry=>entry.kind==='gap'?html`<div role="presentation" aria-hidden="true" data-en-virtual-gap style=${`block-size:${entry.size}px`}></div>`:html`<div class="history-row" part="row" role="listitem" data-en-virtual-key=${entry.key} aria-posinset=${entry.index+1} aria-setsize=${items.length} aria-description=${entry.item.group||nothing}>
    ${entry.item.group&&(entry.index===0||items[entry.index-1]?.group!==entry.item.group||entry.index===start&&this.paginated)?html`<h3 class="history-group" part="group-heading">${entry.item.group}</h3>`:nothing}
    <en-activity-item .embedded=${true} author=${entry.item.author} datetime=${entry.item.datetime??''} time-label=${entry.item.timeLabel??''} label=${entry.item.label??`${entry.item.author}: ${entry.item.text}`}>${this.renderItem?this.renderItem(entry.item,entry.index):entry.item.text}</en-activity-item>
   </div>`)}
   </div>
  </div>${this.paginated?html`<nav class="history-pagination" part="pagination" aria-label=${`${this.label} pages`}><en-button variant="secondary" aria-disabled=${String(this.currentPage===1)} @click=${()=>this.goToPage(this.currentPage-1)}>${this.previousLabel}</en-button><span>${this.pageLabel.replaceAll('{page}',String(this.currentPage)).replaceAll('{pages}',String(this.pageCount))}</span><en-button variant="secondary" aria-disabled=${String(this.currentPage===this.pageCount)} @click=${()=>this.goToPage(this.currentPage+1)}>${this.nextLabel}</en-button></nav>`:nothing}`;
 }
 private request(action:'show-updates'|'load-more'){if(this.items!==undefined){if(action==='show-updates')this.showUpdates();else this.requestOlder();return;}if(this.loading||(action==='show-updates'?!this.count:!this.hasMore))return;dispatchAction(this,{action,data:undefined},{cancelable:true});}
 protected override render(){return html`<div class="feed" part="base"><slot name="header"></slot>
  <en-button part="updates" variant="secondary" ?hidden=${!this.updates} aria-disabled=${String(this.loading||!this.count)} @click=${()=>this.request('show-updates')}>${this.count?this.updatesLabel.replaceAll('{count}',String(this.count)):this.currentLabel}</en-button>
  ${this.items!==undefined?this.dataTemplate():html`<div class="list" part="list" role="list" aria-label=${this.label} ?hidden=${this.empty}><slot></slot></div>`}
  <div part="empty" ?hidden=${!(this.items!==undefined?!this.items.length:this.empty)||this.loading}><slot name="empty">${this.emptyLabel}</slot></div>
  <div part="loading" ?hidden=${!this.loading}><slot name="loading">${this.loadingLabel}</slot></div>
  ${this.items!==undefined?html`<p class="history-error" part="error" ?hidden=${!this.error}>${this.error}</p><en-button variant="secondary" part="cancel-load" ?hidden=${!this.loading} @click=${()=>this.cancelLoad()}>${this.cancelLabel}</en-button>`:nothing}
  <p class="announcement" part="announcement" role="status" aria-atomic="true">${this.announcement||nothing}</p>
  <en-button part="load-more" variant="secondary" ?hidden=${!this.hasMore&&this.items===undefined} aria-disabled=${String(this.loading||!this.hasMore)} @click=${()=>this.request('load-more')}>${this.items!==undefined&&this.error?this.retryLabel:this.moreLabel}</en-button><slot name="footer"></slot>
 </div>`;}
}
declare global{interface HTMLElementTagNameMap{'en-activity-feed':EnActivityFeed;}}
