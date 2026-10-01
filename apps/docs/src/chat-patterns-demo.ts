import './composable-chat-demo.js';
import { html, nothing } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import type { EnTextarea } from '@en-reve/elements/textarea.js';
import type { EnFileUpload } from '@en-reve/elements/file-upload.js';
import type { EnDialog } from '@en-reve/elements/dialog.js';

type Message = {id:number;value:string;files:readonly File[];state:'sending'|'retrying'|'failed'|'sent';draftRevision:number;fileRevision:number};
/** Local transport fixture. The application owns message snapshots, previews and retry. */
class ChatPatternsDemo extends AsyncDirective {
 private root?:HTMLElement;
 private key:unknown;
 private adopted=false;
 private lifetime?:MutationObserver;
 private connect=(element:Element|undefined)=>{
  if(!element){this.releaseUnused(true);this.lifetime?.disconnect();}
  this.root=element as HTMLElement|undefined;
  if(!this.root)return;this.observeLifetime();
  if(this.adopted)return;this.adopted=true;
  const field=this.files;const registry=this.root.ownerDocument.defaultView?.customElements;
  if(field&&registry)void registry.whenDefined('en-file-upload').then(async()=>{await field.updateComplete;if(this.isConnected)this.refresh();});
 };
 private pending?:Message;
 private messages:Message[]=[];
 private status='Nothing is sent outside this page.';
 private veto=false;
 private draftRevision=0;
 private fileRevision=0;
 private preview?:File;
 private urls=new Map<File,string>();
 private brokenImages=new Set<File>();
 private get editor(){return this.root?.querySelector<EnTextarea>('en-textarea');}
 private get files(){return this.root?.querySelector<EnFileUpload>('en-file-upload');}
 private refresh(){if(this.isConnected){this.releaseUnused();this.setValue(this.render(this.key));}}
 private url(file:File){
  let value=this.urls.get(file);
  if(!value){value=URL.createObjectURL(file);this.urls.set(file,value);}
  return value;
 }
 private releaseUnused(all=false){
  const retained=new Set([...(this.files?.files??[]),...this.messages.flatMap(message=>message.files),...(this.preview?[this.preview]:[])]);
  for(const [file,url] of this.urls)if(all||!retained.has(file)){URL.revokeObjectURL(url);this.urls.delete(file);this.brokenImages.delete(file);}
 }
 private observeLifetime(){
  this.lifetime?.disconnect();const root=this.root;if(!root)return;
  // Hydrated keyed examples can be removed without notifying nested directives.
  // Bind blob resources to the actual DOM lifetime as well as Lit's callbacks.
  this.lifetime=new MutationObserver(()=>{if(!root.isConnected){this.releaseUnused(true);this.lifetime?.disconnect();}});
  this.lifetime.observe(root.ownerDocument,{childList:true,subtree:true});
 }
 protected override disconnected(){this.releaseUnused(true);this.lifetime?.disconnect();}
 protected override reconnected(){this.observeLifetime();this.refresh();}
 private image(file:File){return file.type.startsWith('image/')&&!this.brokenImages.has(file);}
 private fileType(file:File){return file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')?'PDF':file.type.startsWith('image/')?'Image':'File';}
 private fileSize(file:File){return file.size<1024?`${file.size} B`:file.size<1024*1024?`${Math.ceil(file.size/1024)} KB`:`${(file.size/1024/1024).toFixed(1)} MB`;}
 private openPreview(file:File){
  this.preview=file;this.refresh();
  // Opening the existing dialog is explicit and preserves the triggering control for focus restoration.
  queueMicrotask(()=>{if(this.isConnected)this.root?.querySelector<EnDialog>('en-dialog')?.show();});
 }
 private remove(file:File){
  const field=this.files;if(!field)return;
  field.files=field.files.filter(selected=>selected!==file);this.fileRevision++;
  field.focus({preventScroll:true});this.status=`Removed ${file.name} from the draft.`;this.refresh();
 }
 private attachments(files:readonly File[],editable=false){
  return html`<ul class="chat-demo-attachments" aria-label=${editable?'Selected attachments':'Message attachments'}>${repeat(files,file=>file,file=>html`<li class="chat-demo-attachment">
   <div class="chat-demo-media" ?data-document=${!this.image(file)}>${this.image(file)?html`<img src=${this.url(file)} alt="" @error=${()=>{this.brokenImages.add(file);this.refresh();}}>`:html`<en-icon name="file" aria-hidden="true"></en-icon><span>${this.fileType(file)}</span>`}</div>
   <div class="chat-demo-file-name">${file.name}</div><small>${this.fileType(file)} · ${this.fileSize(file)}${this.brokenImages.has(file)?' · Image preview unavailable':''}</small>
   <div class="chat-demo-file-actions"><en-button variant="secondary" @click=${()=>this.openPreview(file)}>Preview <span class="chat-demo-sr">${file.name}</span></en-button>${editable?html`<en-button variant="ghost" @click=${()=>this.remove(file)}>Remove <span class="chat-demo-sr">${file.name}</span></en-button>`:nothing}</div>
  </li>`)}</ul>`;
 }
 private send=(event:CustomEvent<{action:string;data:{value:string}}>)=>{
  if(event.detail.action!=='send')return;
  if(this.veto)event.preventDefault();
  queueMicrotask(()=>{
   if(!this.isConnected)return;
   if(event.defaultPrevented){this.status='Send request declined. Your draft and files are unchanged.';this.refresh();return;}
   if(this.pending)return;
   const message:Message={id:this.messages.length+1,value:event.detail.data.value,files:Object.freeze([...(this.files?.files??[])]),state:'sending',draftRevision:this.draftRevision,fileRevision:this.fileRevision};
   this.messages.push(message);this.pending=message;
   this.status='Sending is simulated. Complete or fail this request below; you can keep editing the next draft.';this.refresh();
  });
 };
 private retry(message:Message){
  if(this.pending||message.state!=='failed')return;
  message.state='retrying';this.pending=message;
  this.status='Retrying the original message and attachments. Your current composer is unchanged.';this.refresh();
 }
 private settle(success:boolean){
  const request=this.pending;if(!request)return;
  const retrying=request.state==='retrying';
  if(success&&retrying){const message=this.root?.querySelector<HTMLElement>(`en-chat-message[data-message-id="${request.id}"]`);if(message?.querySelector('en-button[slot=actions]')?.matches(':focus-within'))message.focus({preventScroll:true});}
  request.state=success?'sent':'failed';
  if(success){
   if(!retrying){
    if(this.editor?.value===request.value&&this.draftRevision===request.draftRevision)this.editor.value='';
    if(this.files&&this.fileRevision===request.fileRevision)this.files.files=[];
   }
   this.status=retrying?'Original message sent locally. Your current composer is unchanged.':'Message sent locally. Any newer draft or file selection is preserved.';
  }else this.status='Delivery failed. The message and its files are retained above; use its Retry button. Your composer is unchanged.';
  this.pending=undefined;this.refresh();
 }
 render(key:unknown=0){
  if(key!==this.key){this.releaseUnused(true);this.key=key;this.pending=undefined;this.messages=[];this.preview=undefined;this.veto=false;this.draftRevision=0;this.fileRevision=0;this.status='Nothing is sent outside this page.';}
  return html`<section data-chat-patterns-demo ${ref(this.connect)} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
   <style>
    [data-chat-patterns-demo] .chat-demo-attachments{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,12rem),1fr));gap:var(--en-space-3);list-style:none;padding:0;margin:0;}
    [data-chat-patterns-demo] .chat-demo-attachment{display:grid;align-content:start;gap:var(--en-space-2);min-inline-size:0;padding:var(--en-space-3);border:var(--en-border-width) solid var(--en-color-line);border-radius:var(--en-radius-container);background:var(--en-color-surface);}
    [data-chat-patterns-demo] .chat-demo-media{display:flex;align-items:center;justify-content:center;gap:var(--en-space-2);block-size:8rem;background:var(--en-color-surface-raised);border-radius:var(--en-radius-control);overflow:hidden;}
    [data-chat-patterns-demo] .chat-demo-media img{inline-size:100%;block-size:100%;object-fit:contain;}
    [data-chat-patterns-demo] .chat-demo-media[data-document]{block-size:4rem;}
    [data-chat-patterns-demo] .chat-demo-media en-icon::part(base){inline-size:2rem;block-size:2rem;}
    [data-chat-patterns-demo] .chat-demo-media en-icon{inline-size:2rem;block-size:2rem;}
    [data-chat-patterns-demo] .chat-demo-file-name{font-weight:600;overflow-wrap:anywhere;}
    [data-chat-patterns-demo] .chat-demo-file-actions{display:flex;flex-wrap:wrap;gap:var(--en-space-actions);}
    [data-chat-patterns-demo] .chat-demo-picker::part(list){display:none;}
    [data-chat-patterns-demo] .chat-demo-status{display:flex;align-items:center;flex-wrap:wrap;gap:var(--en-space-2);}
    [data-chat-patterns-demo] .chat-demo-status[data-failed]{padding:var(--en-space-3);border-inline-start:3px solid var(--en-color-danger);background:var(--en-color-surface-raised);}
    [data-chat-patterns-demo] .chat-demo-status[data-failed] en-icon{color:var(--en-color-danger);}
    [data-chat-patterns-demo] .chat-demo-preview{display:grid;gap:var(--en-space-3);min-inline-size:0;overflow-wrap:anywhere;}
    [data-chat-patterns-demo] .chat-demo-preview img{display:block;max-inline-size:100%;max-block-size:60svh;object-fit:contain;}
    [data-chat-patterns-demo] .chat-demo-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
   </style>
   <ol aria-label="Study conversation" style="display:grid;gap:var(--en-space-3);list-style:none;padding:0;margin:0">
    <li><en-chat-message id="chat-message-example" author="Mira">
     <time slot="metadata" datetime="2026-09-15T09:00:00">9:00 AM</time>
     <span>Could we make the cover image a little quieter? You can edit this suggestion before sending it.</span>
     <en-button slot="actions" variant="secondary" @click=${()=>{if(this.editor){this.editor.value='Please reduce the cover image opacity to 60%.';this.draftRevision++;this.editor.focus();}}}>Use suggestion</en-button>
    </en-chat-message></li>
    ${repeat(this.messages,message=>message.id,message=>html`<li><en-chat-message author="You" outgoing data-message-id=${message.id}>
     <span style="white-space:pre-wrap">${message.value||'Attached files'}</span>
     ${message.files.length?html`<div slot="attachments">${this.attachments(message.files)}</div>`:nothing}
     <div slot="status" class="chat-demo-status" ?data-failed=${message.state==='failed'}><en-icon name=${message.state==='failed'?'warning':message.state==='sent'?'check':'info'}></en-icon><strong>${{failed:'Not sent',sending:'Sending…',retrying:'Retrying…',sent:'Sent locally'}[message.state]}</strong>${message.state==='failed'?html`<span>Your message and attachments are preserved.</span>`:nothing}</div>
     ${message.state==='failed'||message.state==='retrying'?html`<en-button slot="actions" variant="secondary" aria-disabled=${String(!!this.pending)} @click=${()=>this.retry(message)}>Retry message</en-button>`:nothing}
    </en-chat-message></li>`)}
   </ol>
   <en-chat-composer id="chat-composer-example" .sending=${!!this.pending} .allowEmpty=${!!this.files?.files?.length} @en-action=${this.send}>
    <en-textarea slot="editor" label="Message" rows="3" description="Enter adds a new line. Send with the button or Control/Command + Enter." @en-input=${()=>{this.draftRevision++;}}></en-textarea>
    <en-file-upload class="chat-demo-picker" slot="attachments" multiple accept="image/*,.pdf" @en-change=${(event:Event)=>{queueMicrotask(()=>{if(!event.defaultPrevented){this.fileRevision++;this.refresh();}});}}>
     <span slot="label">Attachments</span><span slot="description">Optional images or PDFs. Files stay in this browser.</span>
    </en-file-upload>
    ${this.files?.files?.length?html`<div slot="attachments">${this.attachments(this.files.files,true)}</div>`:nothing}
    <span slot="status" role="status">${this.status}</span>
   </en-chat-composer>
   <en-dialog @en-change=${(event:Event)=>{const dialog=event.currentTarget as EnDialog;queueMicrotask(()=>{if(!event.defaultPrevented&&!dialog.open){this.preview=undefined;this.refresh();}});}} label=${this.preview?`Attachment preview: ${this.preview.name}`:'Attachment preview'} presentation="responsive">
    ${this.preview?html`<div class="chat-demo-preview">${this.image(this.preview)?html`<img src=${this.url(this.preview)} alt=${this.preview.name} @error=${()=>{if(this.preview)this.brokenImages.add(this.preview);this.refresh();}}>`:html`<p><en-icon name="file"></en-icon> ${this.fileType(this.preview)} attachment${this.brokenImages.has(this.preview)?' · Image preview unavailable':''}</p>`}<p>${this.preview.name} · ${this.fileSize(this.preview)}</p><a href=${this.url(this.preview)} download=${this.preview.name}>Download ${this.preview.name}</a></div>`:nothing}
   </en-dialog>
   <details open><summary>Delivery simulation</summary><div style="display:flex;flex-wrap:wrap;gap:var(--en-space-actions);padding-block:var(--en-space-3)">
    <en-button variant="secondary" ?disabled=${!this.pending} @click=${()=>this.settle(true)}>Complete send</en-button>
    <en-button variant="secondary" ?disabled=${!this.pending} @click=${()=>this.settle(false)}>Fail send</en-button>
   </div><en-checkbox .checked=${this.veto} @en-change=${(event:Event)=>{const checkbox=event.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!event.defaultPrevented)this.veto=checkbox.checked;});}}>Application declines send</en-checkbox>
   <p>Add images or PDFs to see attachment tiles, remove them before sending, or open a local preview. Failed messages stay in the conversation with their original files and Retry action. Retry leaves the current composer untouched. Complete or fail the retry with these simulation controls. No file is uploaded and no message is sent outside this browser.</p></details>
  </section>`;
 }
}
const chatPatternsDemo=directive(ChatPatternsDemo);
export function chatPatternsExample(resetKey:unknown=0){return html`${chatPatternsDemo(resetKey)}<en-composable-chat-demo></en-composable-chat-demo>`;}
