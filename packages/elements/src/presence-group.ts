import { isHTMLElement } from './internal/dom-kind.js';
import {html,type PropertyValues} from 'lit';
import {EnElement} from './internal/en-element.js';
import {foundationStyles,blockHostStyles} from '@en-reve/styles/foundations.js';
import {collaborationStyles} from '@en-reve/styles/collaboration.js';
import {dispatchChange} from '@en-reve/primitives/interactions/events.js';
const owners=new WeakMap<Element,EnPresenceGroup>();
/**
 * Slot-first identity grouping. Before hydration every authored identity is readable.
 * @tagname en-presence-group
 * @slot - Direct en-presence children; authored hidden children do not count.
 * @csspart overflow-control - Forwarded native overflow button.
 * @csspart base - Named group.
 * @csspart members - Wrapping identity layout.
 * @csspart overflow - en-button disclosure host.
 * @cssprop --en-presence-group-gap - Space between identities and disclosure.
 * @fires {import('./events.js').PresenceGroupChangeEvent} en-change - Cancelable expanded-state change; author writes supersede rollback.
 */
export class EnPresenceGroup extends EnElement{
 static override properties={label:{},max:{type:Number},expanded:{noAccessor:true,type:Boolean,reflect:true},moreLabel:{attribute:'more-label'},lessLabel:{attribute:'less-label'},count:{state:true}};
 static override styles=[foundationStyles,blockHostStyles,collaborationStyles];
 /** Accessible group name. */ declare label:string;
 /** Number of identities initially visible; positive finite integers, default 4. */ declare max:number;
 /** Localized disclosure label; {count} is the hidden identity count. */ declare moreLabel:string;
 /** Localized collapse label. */ declare lessLabel:string;
 private declare count:number;private open=false;private revision=0;private observer?:MutationObserver;private members:HTMLElement[]=[];
 /** Expand every identity. Author writes are silent, including same-value writes. */
 get expanded(){return this.open;}set expanded(value:boolean){++this.revision;this.setExpanded(Boolean(value));}
 private setExpanded(value:boolean){const old=this.open;this.open=value;this.requestUpdate('expanded',old);}
 constructor(){super();this.label='Collaborators';this.max=4;this.moreLabel='Show {count} more collaborators';this.lessLabel='Show fewer collaborators';this.count=0;}
 private get limit(){return Number.isFinite(this.max)&&this.max>0?Math.max(1,Math.floor(this.max)):4;}
 override connectedCallback(){super.connectedCallback();this.requestUpdate();if(typeof MutationObserver!=='undefined'){this.observer=new MutationObserver(()=>this.sync());this.observer.observe(this,{childList:true,attributes:true,subtree:true,attributeFilter:['hidden']});}}
 override disconnectedCallback(){super.disconnectedCallback();this.observer?.disconnect();for(const item of this.members)if(owners.get(item)===this){item.removeAttribute('data-en-presence-overflow');owners.delete(item);}this.members=[];}
 protected override willUpdate(){
  // Recover before render hides the focused disclosure when max changes.
  if(this.count<=this.limit&&this.renderRoot?.querySelector<HTMLElement>('en-button')?.matches(':focus-within'))this.renderRoot.querySelector<HTMLElement>('[part=base]')?.focus({preventScroll:true});
 }
 protected override updated(_changes:PropertyValues){this.sync();}
 private sync(){
  if(!this.isConnected)return;
  const items=Array.from(this.children).filter((el):el is HTMLElement=>isHTMLElement(el)&&el.localName==='en-presence'&&!el.hidden);
  for(const item of this.members)if(!items.includes(item)&&owners.get(item)===this){item.removeAttribute('data-en-presence-overflow');owners.delete(item);}
  this.members=items;
  const disclosure=this.renderRoot.querySelector<HTMLElement>('en-button');
  if(items.length<=this.limit&&disclosure?.matches(':focus-within'))this.renderRoot.querySelector<HTMLElement>('[part=base]')?.focus({preventScroll:true});
  this.count=items.length;
  items.forEach((item,index)=>{owners.set(item,this);const hide=!this.expanded&&index>=this.limit;
   if(hide&&item.matches(':focus-within'))this.renderRoot.querySelector<HTMLElement>('en-button')?.focus({preventScroll:true});
   item.toggleAttribute('data-en-presence-overflow',hide);
  });
 }
 private toggle(){dispatchChange(this,{previous:this.expanded,proposed:!this.expanded,reason:'disclosure',getRevision:()=>this.revision,stage:value=>this.setExpanded(value),rollback:value=>this.setExpanded(value)});}
 protected override render(){const overflow=Math.max(0,this.count-this.limit);return html`<div part="base" tabindex="-1" role="group" aria-label=${this.label}><div class="members" part="members"><slot @slotchange=${()=>this.sync()}></slot>
  <en-button part="overflow" exportparts="control:overflow-control" variant="secondary" ?hidden=${!overflow} aria-expanded=${String(this.expanded)} @click=${()=>this.toggle()}><span slot="label"><span aria-hidden="true">${this.expanded?this.lessLabel:`+${overflow}`}</span><span class="sr-only">${this.expanded?this.lessLabel:this.moreLabel.replaceAll('{count}',String(overflow))}</span></span></en-button>
 </div></div>`;}
}
declare global{interface HTMLElementTagNameMap{'en-presence-group':EnPresenceGroup;}}
