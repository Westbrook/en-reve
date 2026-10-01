import { html, nothing } from 'lit';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { collaborationStyles } from '@en-reve/styles/collaboration.js';
/**
 * Application-owned identity and availability, with visible status text.
 * @tagname en-presence
 * @slot avatar - Decorative identity image; this slot is hidden from accessibility APIs.
 * @slot name - Visible identity, replacing name.
 * @slot status - Localized visible status, replacing statusLabel.
 * @csspart base - Identity surface; a native anchor when href is nonempty.
 * @csspart link - Native navigation anchor (only when href is set).
 * @csspart avatar - Decorative avatar container.
 * @csspart name - Visible name.
 * @csspart status - Visible availability label.
 * @csspart indicator - Decorative status marker.
 * @cssprop --en-presence-background - Identity surface fill.
 * @cssprop --en-presence-hover-background - Linked identity hover fill.
 * @cssprop --en-presence-hover-border-color - Linked identity hover boundary.
 * @cssprop --en-presence-border-color - Identity surface boundary.
 * @cssprop --en-presence-radius - Identity corners.
 * @cssprop --en-presence-padding - Identity interior spacing.
 * @cssprop --en-presence-gap - Avatar/text gap.
 * @cssprop --en-presence-online-color - Available status paint; text also identifies status.
 * @cssprop --en-presence-busy-color - Busy status paint; text also identifies status.
 */
export class EnPresence extends EnElement{
 static override properties={href:{},target:{},rel:{},name:{},src:{},initials:{},status:{},statusLabel:{attribute:'status-label'}};
 static override styles=[foundationStyles,inlineHostStyles,collaborationStyles];
 /** Navigation destination. Empty leaves the identity informational. */ declare href:string;
 /** Native link browsing-context target. */ declare target:string;
 /** Native link relationship tokens. */ declare rel:string;
 /** Identity text; also used to generate decorative initials. */ declare name:string;
 /** Optional avatar image URL. */ declare src:string;
 /** Optional localized initials. */ declare initials:string;
 /** Application-supplied online, away, busy or offline status. Unknown values render offline. */ declare status:string;
 /** Localized status text override. Empty uses English status names. */ declare statusLabel:string;
 constructor(){super();this.href='';this.target='';this.rel='';this.name='';this.src='';this.initials='';this.status='offline';this.statusLabel='';}
 /** Focus the native link, when present. Informational identities do not gain a Tab stop. */
 override focus(options?:FocusOptions){const link=this.renderRoot.querySelector<HTMLAnchorElement>('a');if(link)link.focus(options);else super.focus(options);}
 protected override render(){const status=['online','away','busy'].includes(this.status)?this.status:'offline';const content=html`
  <span part="avatar" aria-hidden="true"><slot name="avatar"><en-avatar size="small" .name=${this.name} .src=${this.src} .initials=${this.initials}></en-avatar></slot></span>
  <div class="identity"><div class="name" part="name"><slot name="name">${this.name||nothing}</slot></div><div class="status" part="status" data-status=${status}><span class="dot" part="indicator" aria-hidden="true"></span><slot name="status">${this.statusLabel||(({online:'Available',away:'Away',busy:'Busy',offline:'Offline'} as Record<string,string>)[status])}</slot></div></div>
  `;return this.href?.trim()?html`<a class="presence" part="base link" href=${this.href} target=${this.target||nothing} rel=${this.rel||nothing}>${content}</a>`:html`<div class="presence" part="base">${content}</div>`;}
}
declare global{interface HTMLElementTagNameMap{'en-presence':EnPresence;}}
