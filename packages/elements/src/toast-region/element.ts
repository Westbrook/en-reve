import { connectionDocument } from '../internal/element-registry.js';
import { html, type PropertyValues } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { createOwnedElement } from '../internal/create-owned-element.js';
import { ChildUpgrades } from '../internal/child-upgrades.js';
import type { EnToast } from '../toast.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { normalizeToastMax, toastWindow, toastQueuedAttribute, toastCountAttribute, presentToast, releaseToast } from '@en-reve/primitives/interactions/toast-stack.js';
import { toastStyles } from '@en-reve/styles/toast.js';
export interface ToastOptions { message:string; variant?:EnToast['variant']; duration?:number; priority?:EnToast['priority']; dismissLabel?:string; interrupt?:boolean; swipe?:boolean; }
export interface ToastHistoryEntry { readonly message:string; readonly variant:EnToast['variant']; }
/**
 * A slotted notification collection. Initial messages are readable; newly opened messages announce without moving focus.
 * @tagname en-toast-region
 * @slot - en-toast children; forwarding through slots is supported.
 * @csspart base - Named, focusable collection and scroll surface.
 * @csspart stack-summary - Localized description of waiting messages.
 * @csspart history - Optional waiting/recent disclosure.
 * @csspart history-summary - Named disclosure toggle.
 * @csspart history-list - Plain-text waiting and recent lists.
 * @csspart announcements - Persistent polite announcer.
 * @csspart urgent - Persistent assertive announcer.
 * @cssprop --en-toast-region-layer - Stacking level for fixed placement.
 * @cssprop --en-toast-region-gap - Gap between messages.
 * @cssprop --en-toast-region-width - Width of a fixed region.
 * @cssprop --en-toast-region-max-size - Maximum block size before scrolling.
 */
export class EnToastRegion extends EnElement {
	static override properties={label:{},placement:{reflect:true},max:{type:Number,reflect:true,noAccessor:true},stackLabel:{attribute:'stack-label'},history:{type:Boolean},historyLimit:{type:Number,attribute:'history-limit'},historyLabel:{attribute:'history-label'},waitingLabel:{attribute:'waiting-label'},recentLabel:{attribute:'recent-label'},clearHistoryLabel:{attribute:'clear-history-label'}};
	static override styles=[foundationStyles,blockHostStyles,toastStyles];
	/** Accessible region name, localized by the consumer. */
	declare label:string;
	/** Inline by default; fixed positions use logical edges and safe areas. */
	declare placement:'inline'|'block-start'|'block-end'|'block-start-start'|'block-start-center'|'block-start-end'|'block-end-start'|'block-end-center'|'block-end-end';
	/** Opt-in plain-text waiting and recently closed notification history. */
	declare history:boolean;
	/** Retain at most this many recent snapshots in memory (default 20, maximum 1000); zero disables retention. */
	declare historyLimit:number;
	declare historyLabel:string;
	declare waitingLabel:string;
	declare recentLabel:string;
	declare clearHistoryLabel:string;
	private recent:ToastHistoryEntry[]=[];
	private historyOpen=new WeakMap<EnToast,boolean>();
	private waitingMessages:string[]=[];
	/** Immutable snapshots, newest dismissal first. Authored message elements remain application-owned. */
	get historyItems():readonly ToastHistoryEntry[]{return this.recent.map(item=>({...item}));}
	/** Clear retained snapshots without dismissing active/waiting messages or replaying announcements. */
	clearHistory():void {this.recent=[];this.requestUpdate();}
	private get retention(){return Number.isFinite(this.historyLimit)?Math.max(0,Math.min(1000,Math.floor(this.historyLimit))):20;}
	private limit=0;
	/** Maximum full toasts; zero, absent or invalid means unlimited. Positive fractions round down. */
	get max():number{return this.limit;}
	set max(value:number){const previous=this.limit;this.limit=normalizeToastMax(value);this.requestUpdate('max',previous);}
	/** Localized description of the collapsed waiting stack. */
	declare stackLabel:string;
	private waiting?:number;
	/** Number of open, non-hidden messages currently waiting for a visible slot. */
	get queuedCount():number{return this.waiting??Number(this.getAttribute(toastCountAttribute)??0);}
	private managed=new Set<EnToast>();
	private announced=new Set<EnToast>();
	private pending=new Set<EnToast>();
	private additions=new Set<EnToast>();
	private known=new Map<EnToast,boolean>();
	private observer?:MutationObserver;
	private ready=false;
	private readonly upgrades=new ChildUpgrades(this,()=>this.sync());
	private epoch=0;
	private queue:{toast:EnToast;text:string;priority:string}[]=[];
	private timer?:ReturnType<typeof setTimeout>;
	private polite='';private urgent='';
	constructor(){super();this.label='Notifications';this.placement='inline';this.stackLabel='Additional notifications are waiting.';this.history=false;this.historyLimit=20;this.historyLabel='Notification history';this.waitingLabel='Waiting';this.recentLabel='Recently closed';this.clearHistoryLabel='Clear recent history';}
	private get toasts():EnToast[]{const slot=this.renderRoot?.querySelector<HTMLSlotElement>('slot');const children=slot?.assignedElements({flatten:true})??[];this.upgrades.watch(children);return children.filter((el):el is EnToast=>el.localName==='en-toast'&&el.matches(':defined')&&typeof (el as EnToast).dismiss==='function');}
	/** Add a plain-text message: prepend interruptions, append ordinary notifications. For rich content/actions, slot an authored en-toast instead. Returns the element immediately; insertion waits for the initial render. Pending additions participate in dismissAll; disconnect cancels insertion. */
	notify(options:ToastOptions):EnToast {
		const epoch=this.epoch;const toast=createOwnedElement(this,'en-toast');toast.textContent=options.message;toast.variant=options.variant??'info';toast.duration=options.duration??0;toast.priority=options.priority??'polite';toast.interrupt=options.interrupt??false;toast.swipe=options.swipe??false;if(options.dismissLabel)toast.dismissLabel=options.dismissLabel;
		this.additions.add(toast);
		// Establish the initial empty live regions before adding text or children.
		void this.updateComplete.then(()=>{this.additions.delete(toast);if(this.isConnected&&epoch===this.epoch){if(toast.interrupt)this.prepend(toast);else this.append(toast);this.sync();}});
		return toast;
	}
	/** Propose dismissal of each open notification, including waiting and not-yet-inserted messages; each may independently veto. */
	dismissAll():void {for(const toast of new Set([...this.toasts,...this.additions]))if(toast.open)toast.dismiss();}
	override focus(options?:FocusOptions):void {this.renderRoot.querySelector<HTMLElement>('[part="base"]')?.focus(options);}
	private sync=()=>{
		const toasts=this.toasts;
		if(this.observer){this.observer.disconnect();for(const target of [this,...toasts])this.observer.observe(target,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','interrupt']});}
		for(const toast of this.managed)if(!toasts.includes(toast)){releaseToast(toast,this);this.known.delete(toast);this.announced.delete(toast);this.pending.delete(toast);}
		this.managed=new Set(toasts);
		const active=toasts.filter(toast=>toast.open!==false&&!toast.hidden);
		const visible=toastWindow(active,this.max,toast=>toast.interrupt,toast=>toast.matches(':focus-within'));
		const waiting=active.length-visible.size;const last=active.filter(toast=>visible.has(toast)).at(-1);
		for(const toast of toasts){
			const open=active.includes(toast);
			if(this.history&&this.historyOpen.get(toast)&&toast.open===false&&this.retention){this.recent=[{message:toast.messageText,variant:toast.variant},...this.recent].slice(0,this.retention);this.requestUpdate();}
			this.historyOpen.set(toast,toast.open!==false);
			const displayed=open&&visible.has(toast);
			presentToast(toast,this,open&&!displayed,toast===last?waiting:0);
			if(!open||!this.known.get(toast))this.announced.delete(toast);
			if(!this.ready&&displayed)this.announced.add(toast);
			if(this.ready&&displayed&&!this.announced.has(toast)&&!this.pending.has(toast)&&toast.priority!=='off'){
				this.pending.add(toast);this.queue.push({toast,text:toast.messageText,priority:toast.priority});
			}
			this.known.set(toast,open);
		}
		const messages=active.filter(toast=>!visible.has(toast)).map(toast=>toast.messageText);
		if(JSON.stringify(messages)!==JSON.stringify(this.waitingMessages)){this.waitingMessages=messages;this.requestUpdate();}
		if(waiting!==this.waiting){this.waiting=waiting;this.requestUpdate();}
		this.pump();
	};
	private displayable(toast:EnToast){return this.toasts.includes(toast)&&toast.isConnected&&toast.open&&!toast.hidden&&!toast.hasAttribute(toastQueuedAttribute);}
	private pump(){
		if(this.timer!==undefined||!this.isConnected||this.ownerDocument.hidden)return;
		const next=this.queue.shift();if(!next)return;
		if(!this.displayable(next.toast)||!next.text){this.pending.delete(next.toast);this.pump();return;}
		this.polite='';this.urgent='';this.requestUpdate();
		this.timer=setTimeout(()=>{this.timer=undefined;this.pending.delete(next.toast);if(!this.isConnected)return;if(this.displayable(next.toast)){this.announced.add(next.toast);if(next.priority==='assertive')this.urgent=next.text;else this.polite=next.text;this.requestUpdate();}this.timer=setTimeout(()=>{this.timer=undefined;this.pump();},1800);},80);
	}
	private changed=()=>{queueMicrotask(()=>{if(this.isConnected)this.sync();});};
	private viewport=()=>{const viewport=this.ownerDocument.defaultView?.visualViewport;const window=this.ownerDocument.defaultView;this.style.setProperty('--_en-toast-keyboard-inset',`${viewport&&window?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0}px`);};
	private visibility=()=>{if(!this.ownerDocument.hidden)this.pump();};
	private recover=(event:Event)=>{event.stopPropagation();const toast=event.composedPath().find(node=>(node as Element).localName==='en-toast') as EnToast|undefined;this.sync();const list=this.toasts;const index=toast?list.indexOf(toast):-1;const next=list.slice(index+1).find(item=>item.open&&!item.hidden&&!item.hasAttribute(toastQueuedAttribute))??list.find(item=>item.open&&!item.hidden&&!item.hasAttribute(toastQueuedAttribute));if(next)next.focus({preventScroll:true});else this.focus({preventScroll:true});};
	override connectedCallback(){super.connectedCallback();this.addEventListener('en-change',this.changed);this.addEventListener('focusout',this.changed);this.addEventListener('en-internal-toast-focus-return',this.recover);this.ownerDocument.addEventListener('visibilitychange',this.visibility);this.ownerDocument.defaultView?.visualViewport?.addEventListener('resize',this.viewport);this.ownerDocument.defaultView?.visualViewport?.addEventListener('scroll',this.viewport);this.viewport();if(this.hasUpdated){this.observe();this.ready=true;}}
	private observe(){this.observer?.disconnect();this.observer=new MutationObserver(this.sync);this.observer.observe(this,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','interrupt']});this.sync();}
	protected override updated(changed:PropertyValues){if(changed.has('max')||changed.has('history'))this.sync();if(changed.has('historyLimit')||changed.has('history')){this.recent=this.history?this.recent.slice(0,this.retention):[];this.requestUpdate();}}
	protected override firstUpdated(){this.sync();this.ready=true;this.observe();}
	override disconnectedCallback(){++this.epoch;this.additions.clear();this.observer?.disconnect();if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;this.queue=[];this.known.clear();this.pending.clear();this.announced.clear();for(const toast of this.managed)releaseToast(toast,this);this.managed.clear();this.waiting=undefined;this.ready=false;this.removeEventListener('en-change',this.changed);this.removeEventListener('focusout',this.changed);this.removeEventListener('en-internal-toast-focus-return',this.recover);connectionDocument(this).removeEventListener('visibilitychange',this.visibility);connectionDocument(this).defaultView?.visualViewport?.removeEventListener('resize',this.viewport);connectionDocument(this).defaultView?.visualViewport?.removeEventListener('scroll',this.viewport);super.disconnectedCallback();}
	protected override render(){return html`<section class="en-toast-region" part="base" role="region" aria-label=${this.label} tabindex="-1"><slot @slotchange=${this.sync}></slot><span class="en-toast-region__summary" part="stack-summary" ?hidden=${!this.queuedCount}>${this.stackLabel}</span>${this.history?html`<details class="en-toast-region__history" part="history"><summary part="history-summary">${this.historyLabel}</summary>${this.waitingMessages.length?html`<h3>${this.waitingLabel} (${this.waitingMessages.length})</h3><ol part="history-list">${this.waitingMessages.map(message=>html`<li>${message}</li>`)}</ol>`:null}<h3>${this.recentLabel} (${this.recent.length})</h3><ol part="history-list">${this.recent.map(item=>html`<li>${item.message}</li>`)}</ol><en-button variant="secondary" @click=${()=>this.clearHistory()}>${this.clearHistoryLabel}</en-button></details>`:null}</section><div class="en-toast__sr" part="announcements" role="status" aria-atomic="true">${this.polite}</div><div class="en-toast__sr" part="urgent" role="alert" aria-atomic="true">${this.urgent}</div>`;}
}
declare global { interface HTMLElementTagNameMap { 'en-toast-region':EnToastRegion; } }
