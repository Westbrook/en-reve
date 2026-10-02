import {LitElement,html,css,nothing} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {normalizeToastMax,toastWindow} from '@en-reve/primitives/interactions/toast-stack.js';
import {toastStyles} from '@en-reve/styles/toast.js';
import {feedbackStyles,swatchNativeStyles} from '@en-reve/styles/feedback.js';
import {activityStyles} from '@en-reve/styles/activity.js';
import {foundationStyles} from '@en-reve/styles/foundations.js';
import {buttonStyles} from '@en-reve/styles/buttons.js';
const portable=new URL(location.href).searchParams.get('delivery')==='css';
type Notice={id:string,text:string,interrupt:boolean,duration:number,action:boolean,variant:'info'|'success'|'warning'|'danger'};
type Budget={remaining:number,started:number,timer?:ReturnType<typeof setTimeout>};

class ConsumerNotice extends LitElement{
 static override properties={notice:{attribute:false}};
 static override styles=[...(portable?[]:[foundationStyles,buttonStyles,toastStyles]),css`:host{display:block;min-inline-size:0}:host([hidden]){display:none}.en-toast__actions:not(:empty){margin-block-start:12px}.en-toast__close{inline-size:2.75rem;min-inline-size:2.75rem;padding:0}.en-toast__icon{inline-size:1.5em;justify-content:center}`];
 declare notice:Notice;
 protected override render(){const n=this.notice;if(!n)return nothing;return html`${portable?html`<link rel="stylesheet" href="/notification.css">`:nothing}<article class="en-toast en-foundation" data-variant=${n.variant} aria-label=${`Notification ${n.id}`} @keydown=${(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();this.dismiss('escape');}}}>
 <span class="en-toast__icon" aria-hidden="true">${n.variant==='danger'?'!':n.variant==='success'?'✓':'ⓘ'}</span><div class="en-toast__body"><div class="en-toast__content">${n.text}</div>${n.action?html`<div class="en-toast__actions"><button class="en-button" @click=${()=>this.dispatchEvent(new CustomEvent('notice-action',{detail:n.id,bubbles:true,composed:true}))}>Retry operation</button></div>`:nothing}</div><button class="en-button en-toast__close" aria-label=${`Dismiss notification ${n.id}`} @click=${()=>this.dismiss('dismiss')}>×</button></article>`;}
 private dismiss(reason:string){this.dispatchEvent(new CustomEvent('notice-dismiss',{detail:{id:this.notice.id,reason},bubbles:true,composed:true}));}
}
class ConsumerLoading extends LitElement{
 static override properties={loading:{type:Boolean}};
 static override styles=[...(portable?[]:[foundationStyles,activityStyles]),css`:host{display:block}.preview{display:grid;grid-template-columns:40px 1fr;gap:12px;min-block-size:72px}.avatar{--en-skeleton-size:40px}.lines{display:grid;gap:8px}.bar{--en-skeleton-size:16px}.en-skeleton[data-shape=rectangle]{--en-skeleton-size:28px}.ready{margin:0;min-block-size:72px}`];
 declare loading:boolean;
 constructor(){super();this.loading=true;}
 protected override render(){return html`${portable?html`<link rel="stylesheet" href="/activity.css">`:nothing}<section class="en-foundation" aria-label="Activity preview" aria-busy=${String(this.loading)}>${this.loading?html`<div class="preview" aria-hidden="true"><span class="en-skeleton avatar" data-shape="circle"></span><div class="lines"><span class="en-skeleton bar"></span><span class="en-skeleton" data-shape="rectangle"></span></div></div>`:html`<p class="ready">Alex finished the draft.</p>`}</section><p role="status" aria-label="Activity loading">${this.loading?html`<span class="en-spinner" aria-hidden="true"></span> Loading activity…`:'Activity loaded.'}</p>`;}
}
class ConsumerNotification extends LitElement{
 static override styles=[...(portable?[]:[foundationStyles,buttonStyles,toastStyles,feedbackStyles,swatchNativeStyles]),css`:host{display:block;min-inline-size:0}.en-foundation{min-inline-size:0}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-block:8px}.feedback{display:grid;gap:12px;margin-block:16px}.en-alert[hidden]{display:none}.en-toast-region{min-inline-size:0}consumer-notice[hidden]{display:none}.en-badge{justify-self:start}:host([placement]) .controls,:host([placement]) .feedback{display:none}`];
 items:readonly Notice[]=[];history:Notice[]=[];max=3;veto=false;announcement='';actionResult='';alertOpen=true;progress=25;
 private sequence=0;private featured=new Set<string>();private hovered=new Set<string>();private budgets=new Map<string,Budget>();private announced=new Set<string>();
 private child(id:string){return [...this.renderRoot.querySelectorAll<ConsumerNotice>('consumer-notice')].find(node=>node.notice.id===id);}
 private focused(id:string){return !!this.child(id)?.shadowRoot?.activeElement;}
 private paused(id:string){return this.focused(id)||this.hovered.has(id)||document.hidden;}
 private budget(n:Notice){if(!Number.isFinite(n.duration)||n.duration<=0||n.action)return 0;const text=n.text.trim();return Math.min(2147483647,Math.max(5000,n.duration,2000+Math.max(text.split(/\s+/u).filter(Boolean).length*350,Array.from(text).length*60)));}
 enqueue(options:Partial<Omit<Notice,'id'>>={}){const notice:Notice={id:String(++this.sequence),text:options.text??`Update ${this.sequence}`,interrupt:options.interrupt??false,duration:options.duration??0,action:options.action??false,variant:options.variant??'info'};this.items=notice.interrupt?[notice,...this.items]:[...this.items,notice];this.requestUpdate();return notice.id;}
 async configure(options:{max?:number,veto?:boolean}){if(options.max!==undefined)this.max=normalizeToastMax(options.max);if(options.veto!==undefined)this.veto=options.veto;this.requestUpdate();await this.updateComplete;}
 async dismiss(id:string,reason='dismiss'){
  const notice=this.items.find(n=>n.id===id);if(!notice)return false;const focused=this.focused(id);const event=new CustomEvent('before-notice-dismiss',{detail:{notice,reason},cancelable:true,bubbles:true,composed:true});if(this.veto)event.preventDefault();this.dispatchEvent(event);
  if(event.defaultPrevented){const budget=this.budgets.get(id);if(budget){clearTimeout(budget.timer);this.budgets.delete(id);}this.requestUpdate();return false;}
  this.items=this.items.filter(n=>n.id!==id);this.history=[...this.history,notice];this.requestUpdate();await this.updateComplete;
  if(focused){const next=this.items.find(n=>this.featured.has(n.id));if(next)this.child(next.id)?.shadowRoot?.querySelector<HTMLButtonElement>('button')?.focus();else this.renderRoot.querySelector<HTMLButtonElement>('[data-launch]')?.focus();}return true;
 }
 private refresh=()=>this.requestUpdate();
 override connectedCallback(){super.connectedCallback();document.addEventListener('visibilitychange',this.refresh);this.requestUpdate();}
 override disconnectedCallback(){document.removeEventListener('visibilitychange',this.refresh);for(const b of this.budgets.values())clearTimeout(b.timer);this.budgets.clear();super.disconnectedCallback();}
 protected override updated(){
  const messages:string[]=[];
  for(const [id,b] of this.budgets)if(!this.featured.has(id)||!this.items.some(n=>n.id===id)){clearTimeout(b.timer);this.budgets.delete(id);}
  for(const n of this.items){if(!this.featured.has(n.id))continue;if(!this.announced.has(n.id)){this.announced.add(n.id);messages.push(n.text);}
   const duration=this.budget(n);if(!duration)continue;let b=this.budgets.get(n.id);if(!b){b={remaining:duration,started:0};this.budgets.set(n.id,b);}
   if(this.paused(n.id)){if(b.timer!==undefined){clearTimeout(b.timer);b.remaining=Math.max(0,b.remaining-(performance.now()-b.started));b.timer=undefined;}}else if(b.timer===undefined){b.started=performance.now();b.timer=setTimeout(()=>{b!.timer=undefined;b!.remaining=0;void this.dismiss(n.id,'timeout');},b.remaining);}
  }
  if(messages.length){this.announcement=messages.join(' ');this.requestUpdate();}
 }
 protected override render(){const window=toastWindow(this.items,this.max,n=>n.interrupt,n=>this.focused(n.id));this.featured=new Set([...window].map(n=>n.id));return html`${portable?html`<link rel="stylesheet" href="/notification.css">`:nothing}<div class="en-foundation">
 <div class="controls"><button class="en-button" data-launch @click=${()=>this.enqueue()}>Add notification</button><button class="en-button" @click=${()=>this.enqueue({text:'Urgent arrival',interrupt:true})}>Add interrupt</button><button class="en-button" @click=${()=>this.enqueue({text:'Saved',duration:5000,variant:'success'})}>Add timed notification</button><button class="en-button" @click=${()=>this.enqueue({text:'Upload failed',duration:5000,action:true,variant:'danger'})}>Add actionable notification</button></div>
 <section class="en-toast-region" aria-label="Notifications" tabindex="-1" @focusin=${this.refresh} @focusout=${()=>queueMicrotask(this.refresh)} @notice-dismiss=${(e:CustomEvent<{id:string,reason:string}>)=>this.dismiss(e.detail.id,e.detail.reason)} @notice-action=${(e:CustomEvent<string>)=>{this.actionResult=`Retried ${e.detail}`;this.requestUpdate();}}>
 ${repeat(this.items,n=>n.id,n=>html`<consumer-notice .notice=${n} data-id=${n.id} ?hidden=${!window.has(n)} @pointerenter=${()=>{this.hovered.add(n.id);this.requestUpdate();}} @pointerleave=${()=>{this.hovered.delete(n.id);this.requestUpdate();}}></consumer-notice>`)}
 <p class="en-toast-region__summary" ?hidden=${this.items.length===window.size}>${this.items.length-window.size} queued</p></section><p class="en-toast__sr" role="status" aria-label="Notification announcements">${this.announcement}</p>
 <details class="en-toast-region__history"><summary>Notification history (${this.history.length})</summary><ol>${this.history.map(n=>html`<li>${n.text}</li>`)}</ol></details><p role="status" aria-label="Action feedback">${this.actionResult}</p>
 <section class="feedback" aria-label="Project status"><div class="en-alert" data-variant="warning" ?hidden=${!this.alertOpen}><span class="en-alert__icon" aria-hidden="true">!</span><div class="en-alert__content"><strong>Connection interrupted</strong><p>Your draft is saved locally.</p></div><button class="en-button en-alert__close" aria-label="Dismiss connection warning" @click=${()=>{this.alertOpen=false;this.requestUpdate();}}>×</button></div><span class="en-badge" data-variant="success"><span class="en-badge__label">Saved locally</span></span><label>Upload progress <progress class="en-progress" max="100" value=${this.progress}></progress></label><div class="en-progress-track" role="progressbar" aria-label="Processing progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${this.progress}><span class="en-progress-fill" style=${`--en-progress-value:${this.progress}%`}></span></div><button class="en-button" @click=${()=>{this.progress=100;this.requestUpdate();}}>Complete progress</button><span class="en-swatch"><button type="button" class="en-swatch__sample" aria-label="Choose sample color" @click=${()=>{this.actionResult='Sample chosen';this.requestUpdate();}}><span class="en-swatch__color" aria-hidden="true" style="background-color:rgb(80,100,180)"></span></button></span><consumer-loading></consumer-loading><button class="en-button" @click=${()=>{const child=this.renderRoot.querySelector<ConsumerLoading>('consumer-loading')!;child.loading=!child.loading;}}>Toggle loading</button></section></div>`;}
}
customElements.define('consumer-notice',ConsumerNotice);customElements.define('consumer-loading',ConsumerLoading);customElements.define('consumer-notification',ConsumerNotification);
await Promise.all([...document.querySelectorAll<ConsumerNotification>('consumer-notification')].map(host=>host.updateComplete));
if(portable)await Promise.all([...document.querySelectorAll<ConsumerNotification>('consumer-notification')].map(host=>new Promise<void>(resolve=>{const link=host.shadowRoot!.querySelector('link')!;if(link.sheet)resolve();else link.addEventListener('load',()=>resolve(),{once:true});})));
document.body.dataset.ready='true';
