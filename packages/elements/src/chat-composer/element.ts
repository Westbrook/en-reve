import { html } from 'lit';
import { OPTIONAL_SLOT_PRESENCE_ATTRIBUTE, recoverOptionalSlotPresence } from '@en-reve/primitives/interactions/optional-slot-presence.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { chatStyles } from '@en-reve/styles/chat.js';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';
import { getChatEditorAdapter, snapshotChatEditor, type ChatEditorAdapter } from '@en-reve/primitives/interactions/chat-editor.js';
type Editor=HTMLElement & {value:string;disabled?:boolean;readOnly?:boolean;reportValidity?():boolean};
/**
 * A slotted editor and explicit send action. No draft or attachment is cleared automatically.
 * @tagname en-chat-composer
 * @slot editor - One en-textarea, native textarea or explicitly registered custom editor, retaining its editing/form ownership. Forwarding is supported.
 * @slot attachments - Application-owned selected files or attachment controls.
 * @slot tools - Additional slotted buttons/toolbars; their actions remain application-owned.
 * @slot send - Optional replacement send button; reflect sending/disabled on the supplied control.
 * @slot status - Application-owned pending, failure or validation feedback.
 * @csspart base - Composer group surface.
 * @csspart editor - Slotted editor container.
 * @csspart attachments - Attachment container.
 * @csspart actions - Tools and send row.
 * @csspart send - Send action container.
 * @csspart send-control - Default shared send button control.
 * @csspart status - Delivery feedback.
 * @cssprop --en-chat-background - Composer surface.
 * @cssprop --en-chat-color - Composer text.
 * @cssprop --en-chat-border-color - Surface boundary.
 * @cssprop --en-chat-padding - Interior spacing.
 * @cssprop --en-chat-radius - Surface corners.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<'send',import('@en-reve/primitives/interactions/chat-editor.js').ChatEditorSnapshot>>} en-action - Cancelable send request. data.value and optional data.content are detached draft snapshots; acceptance does not mean delivery completed.
 */
export class EnChatComposer extends EnElement {
 static override properties={hasSend:{state:true},label:{},sendLabel:{attribute:'send-label'},sending:{type:Boolean,reflect:true},allowEmpty:{type:Boolean,attribute:'allow-empty'}};
 static override styles=[foundationStyles,blockHostStyles,chatStyles];
 /** Accessible group name; label the slotted editor separately. */
 declare label:string;
 /** Localized visible send action label. */
 declare sendLabel:string;
 /** Block repeated send requests while leaving the editor available for the next draft. */
 declare sending:boolean;
 /** Allow an empty text request, for example when the application has selected attachments. */
 declare allowEmpty:boolean;
 private declare hasSend:boolean;
 private composing=false;
 private dispatching=false;
 constructor(){super();this.label='Message composer';this.sendLabel='Send message';this.sending=false;this.allowEmpty=false;this.hasSend=false;}
 private get editor():{element:HTMLElement;adapter:ChatEditorAdapter}|undefined {
  for(const element of this.renderRoot.querySelector<HTMLSlotElement>('slot[name="editor"]')?.assignedElements({flatten:true})??[]) {
   const registered=getChatEditorAdapter(element);
   if(registered)return {element:element as HTMLElement,adapter:registered};
   if(element.localName==='en-textarea'||element.localName==='textarea') {
    const native=element as Editor;
    return {element:native,adapter:{get value(){return native.value;},get disabled(){return native.disabled;},get readOnly(){return native.readOnly;},focus:options=>native.focus(options),reportValidity:()=>native.reportValidity?.()??true,getSnapshot:()=>({value:native.value})}};
   }
  }
  return undefined;
 }
 /** Current slotted editor value. Write to that editor to change the draft. */
 get value():string{return this.editor?.adapter.value??'';}
 /** Request send after editor validation. Returns false when unavailable, composing, empty or canceled; never clears content. */
 requestSend():boolean {
  const editor=this.editor;
  if(!editor||this.sending||this.composing||this.dispatching||editor.adapter.composing||editor.adapter.disabled||editor.element.matches(':disabled')||editor.adapter.readOnly)return false;
  const registration=getChatEditorAdapter(editor.element);
  this.dispatching=true;
  try {
   if(editor.adapter.reportValidity&&!editor.adapter.reportValidity())return false;
   const data=snapshotChatEditor(editor.adapter.getSnapshot());
   if(!this.allowEmpty&&!data.value.trim())return false;
   // Validation/snapshot callbacks may replace or disable the editor.
   const current=this.editor;
   if(current?.element!==editor.element||this.sending||this.composing||current.adapter.composing||current.adapter.disabled||current.adapter.readOnly||current.element.matches(':disabled'))return false;
   if(getChatEditorAdapter(editor.element)!==registration)return false;
   return dispatchAction(this,{action:'send',data},{cancelable:true});
  } finally {this.dispatching=false;}
 }
 protected override willUpdate(){if(!this.hasUpdated){const presence=recoverOptionalSlotPresence(this,['send']);if(presence)this.hasSend=!!presence.send;}}
 protected override firstUpdated(){this.removeAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE);this.syncSend();}
 private syncSend=()=>{const slot=this.renderRoot.querySelector<HTMLSlotElement>('slot[name="send"]');this.hasSend=!!slot?.assignedNodes({flatten:true}).some(node=>node.parentNode!==slot&&(node.nodeType===1||!!node.textContent?.trim()));};
 override focus(options?:FocusOptions){this.editor?.adapter.focus(options);}
 private owns(event:Event){const editor=this.editor;return !!editor&&event.composedPath().includes(editor.element);}
 private compositionStart=(event:Event)=>{if(this.owns(event))this.composing=true;};
 private compositionEnd=(event:Event)=>{if(this.owns(event))queueMicrotask(()=>{this.composing=false;});};
 private keydown=(event:KeyboardEvent)=>{
  if(!this.owns(event)||event.defaultPrevented||event.key!=='Enter'||!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey||event.isComposing||event.keyCode===229||this.composing)return;
  event.preventDefault();this.requestSend();
 };
 override connectedCallback(){super.connectedCallback();this.addEventListener('compositionstart',this.compositionStart);this.addEventListener('compositionend',this.compositionEnd);this.addEventListener('keydown',this.keydown);}
 override disconnectedCallback(){this.composing=false;this.removeEventListener('compositionstart',this.compositionStart);this.removeEventListener('compositionend',this.compositionEnd);this.removeEventListener('keydown',this.keydown);super.disconnectedCallback();}
 protected override render(){return html`<section class="en-chat-composer" part="base" role="group" aria-label=${this.label}>
  <div class="en-chat-composer__editor" part="editor"><slot name="editor" @slotchange=${()=>{this.composing=false;}}></slot></div>
  <div part="attachments"><slot name="attachments"></slot></div>
  <div class="en-chat-actions en-chat-composer__actions" part="actions"><slot name="tools"></slot><span class="en-chat-composer__send" part="send"><slot name="send" @slotchange=${this.syncSend} @click=${()=>this.requestSend()}><en-button data-en-slot-fallback ?hidden=${this.hasSend} exportparts="control:send-control" aria-disabled=${String(this.sending)}>${this.sendLabel}</en-button></slot></span></div>
  <div part="status"><slot name="status"></slot></div>
 </section>`;}
}
declare global {interface HTMLElementTagNameMap {'en-chat-composer':EnChatComposer;}}
