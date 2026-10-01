import { isDOMElement } from '../internal/dom-kind.js';
import { connectionDocument } from '../internal/element-registry.js';
import { html, css, type PropertyValues } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { toastStyles } from '@en-reve/styles/toast.js';
import { toastQueuedAttribute } from '@en-reve/primitives/interactions/toast-stack.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';

/**
 * A persistent-by-default notification. A containing en-toast-region owns announcements.
 * @internalEvent en-internal-toast-focus-return
 * @tagname en-toast
 * @slot - Message content; communicate status in words, not only color.
 * @slot icon - Decorative status icon; replaces the shared default glyph.
 * @csspart icon - Leading decorative status cue.
 * @slot actions - Application-owned buttons or links. Their presence prevents timeout.
 * @csspart base - Notification surface.
 * @csspart content - Message body.
 * @csspart actions - Action layout.
 * @csspart close - Shared en-button control.
 * @cssprop --en-toast-enter-duration - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-toast-enter-ease - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-toast-exit-duration - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-toast-exit-ease - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-toast-background - Surface fill, falling back to shared surface color.
 * @cssprop --en-toast-color - Message text color.
 * @cssprop --en-toast-border-color - Notification border color.
 * @cssprop --en-toast-stack-offset - Decorative separation of waiting stack layers.
 * @cssprop --en-toast-shadow - Surface elevation.
 * @cssprop --en-toast-icon-color - Default status icon color.
 * @cssprop --en-toast-radius - Corners, falling back to panel radius.
 * @cssprop --en-toast-padding - Interior spacing, falling back to panel spacing.
 * @cssprop --en-toast-info-background - Info background; falls back to general toast paint.
 * @cssprop --en-toast-info-color - Info color; falls back to general toast paint.
 * @cssprop --en-toast-info-border-color - Info border-color; falls back to general toast paint.
 * @cssprop --en-toast-info-icon-color - Info icon-color; falls back to general toast paint.
 * @cssprop --en-toast-success-background - Success background; falls back to general toast paint.
 * @cssprop --en-toast-success-color - Success color; falls back to general toast paint.
 * @cssprop --en-toast-success-border-color - Success border-color; falls back to general toast paint.
 * @cssprop --en-toast-success-icon-color - Success icon-color; falls back to general toast paint.
 * @cssprop --en-toast-warning-background - Warning background; falls back to general toast paint.
 * @cssprop --en-toast-warning-color - Warning color; falls back to general toast paint.
 * @cssprop --en-toast-warning-border-color - Warning border-color; falls back to general toast paint.
 * @cssprop --en-toast-warning-icon-color - Warning icon-color; falls back to general toast paint.
 * @cssprop --en-toast-danger-background - Danger background; falls back to general toast paint.
 * @cssprop --en-toast-danger-color - Danger color; falls back to general toast paint.
 * @cssprop --en-toast-danger-border-color - Danger border-color; falls back to general toast paint.
 * @cssprop --en-toast-danger-icon-color - Danger icon-color; falls back to general toast paint.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean>} en-change - Tentative open=false dismissal. Reasons dismiss, escape, swipe or timeout; cancellation restores open and explicit author writes win.
 */
export class EnToast extends EnElement {
	static override properties = { open: {type:Boolean, reflect:true, noAccessor:true}, variant:{reflect:true}, duration:{type:Number}, dismissLabel:{attribute:'dismiss-label'}, announcement:{}, priority:{}, interrupt:{type:Boolean,reflect:true}, swipe:{type:Boolean,reflect:true} };
	static override styles = [foundationStyles, toastStyles, css`:host { display:contents; min-inline-size:0; } :host([hidden]),:host([data-en-toast-queued]) { display:none !important; }`];
	private shown = true;
	private revision = 0;
	private timer?: ReturnType<typeof setTimeout>;
	private visibilityObserver?: MutationObserver;
	private started = 0;
	private remaining = 0;
	private timingText = '';
	private hovered = false;
	private focused = false;
	private actionContent = false;
	/** Open state. Explicit property writes are silent; dismiss() proposes a cancelable change. */
	get open():boolean { return this.shown; }
	set open(value:boolean) { const previous=this.shown;this.shown=Boolean(value);++this.revision;this.requestUpdate('open',previous); }
	/** Visual semantic state; does not make an announcement urgent. */
	declare variant:'info'|'success'|'warning'|'danger';
	/** Requested expiry in milliseconds; positive values receive a five-second and content-reading minimum. Zero (default) persists. Actions prevent expiry. */
	declare duration:number;
	/** Localized accessible close label. */
	declare dismissLabel:string;
	/** Plain announcement text. Empty uses default-slot text, excluding actions. */
	declare announcement:string;
	/** Announcement urgency in the containing region; use assertive sparingly. */
	declare priority:'polite'|'assertive'|'off';
	/** Bypass ordinary waiting messages when the region is capped; does not change announcement urgency. */
	declare interrupt:boolean;
	/** Opt-in horizontal pointer swipe. Vertical scrolling and interactive/focused content are protected. */
	declare swipe:boolean;
	private gesture?:{id:number;x:number;y:number;dx:number;horizontal:boolean;surface:HTMLElement};
	constructor(){super();this.variant='info';this.duration=0;this.dismissLabel='Dismiss notification';this.announcement='';this.priority='polite';this.interrupt=false;this.swipe=false;}
	/** Propose dismissal through the single en-change contract. */
	dismiss(reason:'dismiss'|'escape'|'timeout'|'swipe'='dismiss'):void {
		if(!this.open)return;
		const hadFocus=this.matches(':focus-within');
		const previous=this.open;
		dispatchChange(this,{previous,proposed:false,reason,getRevision:()=>this.revision,stage:value=>{this.shown=value;},rollback:value=>{this.shown=value;}});
		this.requestUpdate('open',previous);
		if(hadFocus&&!this.open) void this.updateComplete.then(()=>{
			const root=this.getRootNode() as Document|ShadowRoot;const active=root.activeElement;
			if(active && active!==this && active!==this.ownerDocument.body)return;
			// Composed notification-region focus recovery also supports forwarded slots.
			this.dispatchEvent(new Event('en-internal-toast-focus-return',{bubbles:true,composed:true}));
		});
	}
	/** Plain message text used by the containing announcement region. */
	get messageText():string { return this.announcement.trim() || [...this.childNodes].filter(node=>!(isDOMElement(node))||!node.hasAttribute('slot')).map(node=>node.textContent??'').join(' ').replace(/\s+/g,' ').trim(); }
	/** Full uninterrupted countdown budget in milliseconds, before hover/focus pauses. Actions still prevent expiry. */
	get effectiveDuration():number {
		if(!Number.isFinite(this.duration)||this.duration<=0)return 0;
		const text=this.messageText;
		// A reading allowance, not a claim about individual reading speed or WCAG compliance.
		// The code-point allowance also covers long tokens and languages without spaces.
		const words=text?text.split(/\s+/u).length:0;
		const characters=[...text.replace(/\s/gu,'')].length;
		return Math.min(2147483647,Math.max(this.duration,5000,2000+Math.max(words*350,characters*60)));
	}
	private resetBudget(){this.pause();this.timingText=this.messageText;this.remaining=this.open?this.effectiveDuration:0;}
	override focus(options?:FocusOptions):void { this.renderRoot.querySelector<HTMLElement>('en-button')?.focus(options); }
	private pause(){if(this.timer!==undefined){clearTimeout(this.timer);this.timer=undefined;this.remaining=Math.max(0,this.remaining-(performance.now()-this.started));}}
	private resume(){
		if(!this.isConnected||!this.open||this.hidden||this.hasAttribute(toastQueuedAttribute)||this.gesture||this.hovered||this.focused||this.actionContent||this.ownerDocument.hidden||this.timer!==undefined||this.remaining<=0)return;
		this.started=performance.now();this.timer=setTimeout(()=>{this.timer=undefined;this.remaining=0;this.dismiss('timeout');},this.remaining);
	}
	private visibility=()=>{this.pause();this.resume();};
	private contentVisibility=(records:MutationRecord[])=>{
		const featuredAgain=!this.hasAttribute(toastQueuedAttribute)&&records.some(record=>record.target===this&&record.attributeName===toastQueuedAttribute&&record.oldValue!==null);
		if(featuredAgain||this.messageText!==this.timingText)this.resetBudget();
		this.visibility();
	};
	private swipeStart=(event:PointerEvent)=>{
		if(!this.swipe||!event.isPrimary||event.button!==0||this.matches(':focus-within')||event.composedPath().some(node=>isDOMElement(node)&&node.matches('button,a,input,select,textarea,en-button,[contenteditable],slot[name=actions]')))return;
		const surface=event.currentTarget as HTMLElement;this.gesture={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,horizontal:false,surface};try{surface.setPointerCapture(event.pointerId);}catch{/* Synthetic pointers need no capture. */}this.pause();
	};
	private swipeMove=(event:PointerEvent)=>{const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(!gesture.horizontal){if(Math.abs(dy)>10&&Math.abs(dy)>=Math.abs(dx)){this.swipeCancel();return;}if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.5)return;gesture.horizontal=true;try{gesture.surface.setPointerCapture(event.pointerId);}catch{/* Synthetic pointers need no capture. */}}gesture.dx=dx;gesture.surface.style.setProperty('--_en-toast-swipe-offset',`${dx}px`);event.preventDefault();};
	private swipeEnd=(event:PointerEvent)=>{const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;const dismiss=gesture.horizontal&&Math.abs(gesture.dx)>=Math.max(64,Math.min(120,gesture.surface.getBoundingClientRect().width*.25));this.swipeCancel();if(dismiss&&!this.matches(':focus-within'))this.dismiss('swipe');};
	private swipeCancel=()=>{const gesture=this.gesture;this.gesture=undefined;gesture?.surface.style.removeProperty('--_en-toast-swipe-offset');if(gesture?.surface.hasPointerCapture(gesture.id))gesture.surface.releasePointerCapture(gesture.id);this.resume();};
	private enter=(event:PointerEvent)=>{if(event.pointerType==='touch')return;this.hovered=true;this.pause();};
	private leave=()=>{this.hovered=false;this.resume();};
	private focusIn=()=>{this.focused=true;this.pause();};
	private focusOut=()=>{queueMicrotask(()=>{this.focused=this.matches(':focus-within');this.resume();});};
	private actionsChanged=()=>{const slot=this.renderRoot.querySelector<HTMLSlotElement>('slot[name="actions"]');this.actionContent=!!slot?.assignedNodes({flatten:true}).some(node=>node.nodeType===1||!!node.textContent?.trim());this.pause();this.resume();};
	override connectedCallback(){super.connectedCallback();this.visibilityObserver=new MutationObserver(this.contentVisibility);this.visibilityObserver.observe(this,{attributes:true,attributeOldValue:true,attributeFilter:['hidden',toastQueuedAttribute],childList:true,characterData:true,subtree:true});this.ownerDocument.addEventListener('visibilitychange',this.visibility);this.addEventListener('pointerenter',this.enter);this.addEventListener('pointerleave',this.leave);this.addEventListener('focusin',this.focusIn);this.addEventListener('focusout',this.focusOut);if(this.hasUpdated)void this.updateComplete.then(()=>this.resume());}
	override disconnectedCallback(){this.visibilityObserver?.disconnect();this.swipeCancel();this.pause();this.hovered=false;this.focused=false;connectionDocument(this).removeEventListener('visibilitychange',this.visibility);this.removeEventListener('pointerenter',this.enter);this.removeEventListener('pointerleave',this.leave);this.removeEventListener('focusin',this.focusIn);this.removeEventListener('focusout',this.focusOut);super.disconnectedCallback();}
	protected override updated(changed:PropertyValues){
		if(!this.open||!this.swipe)this.swipeCancel();
		if(changed.has('open')||changed.has('duration')||(changed.has('announcement')&&this.messageText!==this.timingText))this.resetBudget();
		this.actionsChanged();
	}
	protected override render(){return html`<article class="en-toast" part="base" data-variant=${this.variant} ?hidden=${!this.open} @pointerdown=${this.swipeStart} @pointermove=${this.swipeMove} @pointerup=${this.swipeEnd} @pointercancel=${this.swipeCancel} @lostpointercapture=${this.swipeCancel} @keydown=${(event:KeyboardEvent)=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();event.stopPropagation();this.dismiss('escape');}}}>
		<span class="en-toast__icon" part="icon" aria-hidden="true"><slot name="icon"><en-icon name=${this.variant==='success'?'check':this.variant==='warning'||this.variant==='danger'?'warning':'info'}></en-icon></slot></span>
		<div class="en-toast__body"><div class="en-toast__content" part="content"><slot></slot></div><div part="actions" class="en-toast__actions"><slot name="actions" @slotchange=${this.actionsChanged}></slot></div></div>
		<en-button class="en-toast__close" variant="ghost" icon-only size="inherit" exportparts="control:close" @click=${()=>this.dismiss()}><en-icon slot="prefix" name="close" aria-hidden="true"></en-icon><span slot="label">${this.dismissLabel}</span></en-button>
	</article>`;}
}
declare global { interface HTMLElementTagNameMap { 'en-toast':EnToast; } }
