import {LitElement,html,css,nothing} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {FormChildrenController,FORM_SLOT_PREFIX} from '@en-reve/primitives/interactions/form-children.js';
import {fileRejections,type FileRejection} from '@en-reve/primitives/interactions/file-selection.js';
import {dispatchChange} from '@en-reve/primitives/interactions/events.js';
import {formNavigationStyles} from '@en-reve/styles/form-navigation.js';
import {fileUploadStyles} from '@en-reve/styles/file-upload.js';
const portable=new URLSearchParams(location.search).get('delivery')==='css';
const links=()=>portable?html`<link rel="stylesheet" href="/forms.css">`:nothing;
class ConsumerSteps extends LitElement {
 static override styles=[...(portable?[]:[formNavigationStyles]),css`:host{display:block}button{font:inherit}button:focus-visible{outline:2px solid blue}.en-progress-steps[hidden]{display:none}`];
 readonly childrenModel=new FormChildrenController(this,'steps');
 private selected='details';private revision=0;
 get value(){return this.selected;}set value(value:string){this.selected=value;this.revision++;this.requestUpdate();}
 private choose(value:string){dispatchChange(this,{previous:this.value,proposed:value,reason:'step',getRevision:()=>this.revision,stage:v=>{this.selected=v;},rollback:v=>{this.selected=v;},canCommit:v=>{const view=this.childrenModel.current();return !view.error&&view.items.some(i=>i.value===v&&!i.disabled&&!i.hidden);}});this.requestUpdate();}
 override render(){const {items,error}=this.childrenModel.view;return html`${links()}<nav aria-label="Brief stages"><p role="status" ?hidden=${!error}>${error}</p><ol class="en-progress-steps" ?hidden=${!!error}>${repeat(items.filter(i=>!i.hidden),i=>i.key,(i,index)=>html`<li><button class="en-progress-step en-progress-step--static" type="button" aria-current=${this.value===i.value?'step':nothing} data-status=${i.status} ?disabled=${i.disabled} @click=${()=>this.choose(i.value)}><span aria-hidden="true" class="en-progress-step__number">${index+1}</span><span class="en-progress-step__text"><slot name=${FORM_SLOT_PREFIX+i.key}></slot><span class="en-progress-step__status">${i.status}</span></span></button></li>`)}</ol></nav>`;}
}
class ConsumerErrors extends LitElement {
 static override styles=portable?[]:[formNavigationStyles];
 readonly childrenModel=new FormChildrenController(this,'errors');
 override render(){const {items,error}=this.childrenModel.view;return html`${links()}<section class="en-validation-summary" aria-label="Problems to correct"><h2 class="en-validation-summary__title">Problems to correct</h2><p role="status" ?hidden=${!error}>${error}</p><ul class="en-validation-summary__list">${repeat(error?[]:items.filter(i=>!i.hidden),i=>i.key,i=>html`<li><slot name=${FORM_SLOT_PREFIX+i.key}></slot></li>`)}</ul></section>`;}
}
class ConsumerUpload extends LitElement {
 static override styles=[...(portable?[]:[fileUploadStyles]),css`:host{display:block}form{display:grid;gap:1rem}button{font:inherit}.en-file-item button{min-block-size:2rem}`];
 private selected:readonly File[]=[];private revision=0;rejections:readonly FileRejection[]=[];submitted:string[]=[];
 get files(){return this.selected;}set files(files:readonly File[]){this.selected=Object.freeze([...files]);this.revision++;this.rejections=[];this.requestUpdate();}
 get constraints(){return {accept:this.getAttribute('accept')??'.txt,image/*',multiple:!this.hasAttribute('single'),maxFileSize:8};}
 private accept(files:readonly File[],reason:string){
  if(this.hasAttribute('disabled'))return;
  const rejected=fileRejections(files,this.constraints);this.rejections=rejected;
  if(!rejected.length)dispatchChange(this,{previous:this.files,proposed:Object.freeze([...files]),reason,getRevision:()=>this.revision,stage:v=>{this.selected=v;},rollback:v=>{this.selected=v;},canCommit:v=>!this.hasAttribute('disabled')&&!fileRejections(v,this.constraints).length});
  this.requestUpdate();
 }
 private change(event:Event){const input=event.target as HTMLInputElement;this.accept([...input.files??[]],'picker');input.value='';}
 private drop(event:DragEvent){event.preventDefault();if(event.dataTransfer)this.accept([...event.dataTransfer.files],'drop');this.drag(false);}
 private drag(active:boolean){this.renderRoot.querySelector('.en-file-drop')?.toggleAttribute('data-dragging',active&&!this.hasAttribute('disabled'));}
 private formData(event:FormDataEvent){event.formData.delete('uploads');if(!this.hasAttribute('disabled'))for(const file of this.files)event.formData.append('uploads',file);}
 override render(){const disabled=this.hasAttribute('disabled');return html`${links()}<form @formdata=${this.formData} @reset=${()=>{this.files=[];}} @submit=${(e:SubmitEvent)=>{e.preventDefault();this.submitted=[...new FormData(e.currentTarget as HTMLFormElement).getAll('uploads')].map(f=>(f as File).name);this.requestUpdate();}}>
 <label class="en-file-drop" ?data-disabled=${disabled} ?data-invalid=${!!this.rejections.length} @dragover=${(e:DragEvent)=>{e.preventDefault();this.drag(true);}} @dragleave=${()=>this.drag(false)} @drop=${this.drop}>Choose project files<input class="en-file-input" type="file" name="uploads" accept=${this.constraints.accept} ?multiple=${this.constraints.multiple} ?disabled=${disabled} aria-describedby="hint rejection" @change=${this.change}></label>
 <p id="hint" class="en-file-hint">Text or image files; maximum 8 bytes for this fixture.</p><p id="rejection" class="en-file-error" role="status">${this.rejections.map(r=>r.file.name+': '+r.reason).join('; ')}</p>
 <ul class="en-file-list">${repeat(this.files,f=>f,f=>html`<li class="en-file-item"><span class="en-file-name">${f.name}</span><button class="en-file-remove" type="button" aria-label=${`Remove ${f.name}`} ?disabled=${disabled} @click=${()=>this.accept(this.files.filter(item=>item!==f),'remove')}>Remove</button></li>`)}</ul>
 <button type="submit">Send files</button><button type="reset">Reset files</button><output aria-label="Submitted files">${this.submitted.join(', ')}</output></form>`;}
}
customElements.define('consumer-steps',ConsumerSteps);customElements.define('consumer-errors',ConsumerErrors);customElements.define('consumer-upload',ConsumerUpload);
for(const a of document.querySelectorAll('consumer-errors a'))a.addEventListener('click',()=>a.setAttribute('data-clicks',String(Number(a.getAttribute('data-clicks')??0)+1)));
await Promise.all([...document.querySelectorAll<LitElement>('consumer-steps,consumer-errors,consumer-upload')].map(e=>e.updateComplete));
await Promise.all([...document.querySelectorAll('consumer-steps,consumer-errors,consumer-upload')].flatMap(e=>[...e.shadowRoot!.querySelectorAll('link')].map(link=>link.sheet?Promise.resolve():new Promise<void>((ok,fail)=>{link.onload=()=>ok();link.onerror=()=>fail(new Error('CSS failed'));}))));
document.body.dataset.ready='true';
