import { html } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { chatStyles } from '@en-reve/styles/chat.js';
/**
 * Slotted message presentation; the application owns transcript order and announcements.
 * @tagname en-chat-message
 * @slot - Message body, including authored rich content and quotations.
 * @slot author - Author display; falls back to author.
 * @slot avatar - Optional decorative or labeled avatar.
 * @slot metadata - Authored time and other message context.
 * @slot attachments - Application-owned attachment content.
 * @slot actions - Contextual buttons/menus with application handlers.
 * @slot status - Application-owned delivery or error feedback.
 * @csspart base - Article surface.
 * @csspart header - Author and metadata layout.
 * @csspart content - Message body.
 * @csspart attachments - Attachment container.
 * @csspart actions - Contextual action layout.
 * @csspart status - Delivery feedback.
 * @cssprop --en-chat-background - Message and composer surface.
 * @cssprop --en-chat-color - Message and composer text.
 * @cssprop --en-chat-border-color - Surface boundary.
 * @cssprop --en-chat-outgoing-background - Outgoing message surface.
 * @cssprop --en-chat-padding - Interior spacing.
 * @cssprop --en-chat-radius - Surface corners.
 */
export class EnChatMessage extends EnElement {
 static override properties={author:{},label:{},outgoing:{type:Boolean,reflect:true}};
 static override styles=[foundationStyles,blockHostStyles,chatStyles];
 /** Visible fallback author name; localize for the application. */
 declare author:string;
 /** Accessible article name. Empty uses author. */
 declare label:string;
 /** Use the outgoing message surface; does not reorder or announce content. */
 declare outgoing:boolean;
 constructor(){super();this.author='Participant';this.label='';this.outgoing=false;}
 /** Focus this message's named article only when explicitly requested by the application. */
 override focus(options?:FocusOptions){const article=this.renderRoot.querySelector<HTMLElement>('article');if(article){article.tabIndex=-1;article.focus(options);}}
 protected override render(){return html`<article class="en-chat-message" part="base" aria-label=${this.label||this.author}>
  <header class="en-chat-message__header" part="header"><slot name="avatar"></slot><span class="en-chat-message__author"><slot name="author">${this.author}</slot></span><span class="en-chat-message__metadata"><slot name="metadata"></slot></span></header>
  <div class="en-chat-message__content" part="content"><slot></slot></div>
  <div part="attachments"><slot name="attachments"></slot></div><div class="en-chat-actions" part="actions"><slot name="actions"></slot></div><div part="status"><slot name="status"></slot></div>
 </article>`;}
}
declare global {interface HTMLElementTagNameMap {'en-chat-message':EnChatMessage;}}
