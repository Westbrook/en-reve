import {LitElement,html,css,nothing} from 'lit';
import {StaticStylesController} from '@en-reve/primitives/interactions/static-styles.js';
import {OPTIONAL_SLOT_PRESENCE_ATTRIBUTE,recoverOptionalSlotPresence} from '@en-reve/primitives/interactions/optional-slot-presence.js';
export class ReadingCard extends LitElement {
 static override properties={headerPresent:{state:true},extra:{type:Boolean}};
 static override styles=css`:host{display:block}section{padding:16px;border:2px solid rgb(20,40,60);background:rgb(240,245,250);color:rgb(20,40,60)}header{padding-block-end:12px}input{font:inherit;border:2px solid rgb(20,40,60);padding:8px}[hidden]{display:none}`;
 declare headerPresent:boolean;declare extra:boolean;
 constructor(){super();this.headerPresent=true;this.extra=false;new StaticStylesController(this);}
 protected override willUpdate(){if(!this.hasUpdated){const state=recoverOptionalSlotPresence(this,['header']);if(state)this.headerPresent=state.header!;}}
 private sync(){const slot=this.renderRoot.querySelector<HTMLSlotElement>('slot');if(slot)this.headerPresent=slot.assignedNodes({flatten:true}).some(n=>n.nodeType===1||!!n.textContent?.trim());}
 protected override firstUpdated(){this.removeAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE);this.sync();}
 protected override render(){return html`<section part="base"><header ?hidden=${!this.headerPresent}><slot name="header" @slotchange=${()=>this.sync()}></slot></header><label>Reading note<input value="Server note"></label>${this.extra?html`<style>section{border-top:7px solid rgb(90,30,60)}</style>`:nothing}</section>`;}
}
export function register(){customElements.define('reading-card',ReadingCard);}
export function fixtureTemplate(){return html`<reading-card id="present" data-en-optional-slots=${JSON.stringify({version:1,slots:{header:true}})}><strong slot="header">Project reading</strong></reading-card><reading-card id="repeated" data-en-optional-slots=${JSON.stringify({version:1,slots:{header:true}})}><strong slot="header">Other reading</strong></reading-card><reading-card id="empty" data-en-optional-slots=${JSON.stringify({version:1,slots:{header:false}})}></reading-card><reading-card id="extra" extra data-en-optional-slots=${JSON.stringify({version:1,slots:{header:false}})}></reading-card>`;}
