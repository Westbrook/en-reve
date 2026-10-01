import '@en-reve/elements/define/chat-composer.js';
import {registerChatEditor,type ChatEditorAdapter} from '@en-reve/elements/chat-composer.js';
// This small native-history candidate intentionally remains outside package exports.
class ProbeEditor extends HTMLElement {
 readonly editable:HTMLDivElement;
 composing=false;disabled=false;readOnly=false;valid=true;
 private dispose?:()=>void;
 private tokens=new Map<string,{id:string;type:string;text:string;label:string;data:{entityId:string}}>();
 private sequence=0;
 readonly adapter:ChatEditorAdapter={
  get value(){return (this as any).owner.value;},
  get disabled(){return (this as any).owner.disabled;},
  get readOnly(){return (this as any).owner.readOnly;},
  get composing(){return (this as any).owner.composing;},
  focus:options=>this.editable.focus(options),reportValidity:()=>this.valid,getSnapshot:()=>this.snapshot(),
 };
 constructor(){
  super();Object.assign(this.adapter,{owner:this});
  const root=this.attachShadow({mode:'open'});
  root.innerHTML='<style>[role=textbox]{min-height:6rem;border:1px solid;padding:.5rem;white-space:pre-wrap;overflow-wrap:anywhere}[data-token]{background:#dbeafe;color:#172554;border-radius:.25rem;padding-inline:.15rem}</style><div role="textbox" aria-label="Structured draft" aria-multiline="true" contenteditable="true"></div>';
  this.editable=root.querySelector('div')!;
  this.editable.addEventListener('compositionstart',()=>{this.composing=true;});
  this.editable.addEventListener('compositionend',()=>{this.composing=false;});
 }
 connectedCallback(){this.dispose=registerChatEditor(this,this.adapter);}
 disconnectedCallback(){this.dispose?.();}
 get value(){return this.editable.textContent?.replaceAll('\u200b','')??'';}
 snapshot(){
  const runs:any[]=[];
  const walk=(node:Node)=>{
   if(node instanceof HTMLElement&&node.dataset.token){const token=this.tokens.get(node.dataset.token);if(token){runs.push({kind:'token',...token});return;}}
   if(node.nodeType===Node.TEXT_NODE){const text=node.textContent?.replaceAll('\u200b','');if(text)runs.push({kind:'text',text});return;}
   if(node instanceof HTMLBRElement){runs.push({kind:'text',text:'\n'});return;}
   node.childNodes.forEach(walk);
  };this.editable.childNodes.forEach(walk);
  return {value:this.value,content:{version:1,runs}};
 }
 end(){this.editable.focus();const range=document.createRange();range.selectNodeContents(this.editable);range.collapse(false);const selection=document.getSelection()!;selection.setBaseAndExtent(range.startContainer,range.startOffset,range.endContainer,range.endOffset);}
 insert(){
  this.end();const id='reference-'+(++this.sequence);this.tokens.set(id,{id,type:'app/reference',text:'@Mira',label:'Mira, reference',data:{entityId:'person-1'}});
  const applied=document.execCommand('insertHTML',false,`<span data-token="${id}" contenteditable="false">@Mira</span> `);
  for(const token of this.editable.querySelectorAll<HTMLElement>('[data-token]'))token.contentEditable='false';
  return applied;
 }
}
customElements.define('probe-editor',ProbeEditor);
const composer=document.querySelector('en-chat-composer')!;const editor=document.querySelector('probe-editor') as ProbeEditor;
const sends:any[]=[];
composer.addEventListener('en-action',(event:any)=>{if(event.detail.action==='send'){sends.push(event.detail.data);document.querySelector('#snapshot')!.textContent=JSON.stringify(event.detail.data,null,2);}});
document.querySelector('#insert')!.addEventListener('click',()=>editor.insert());
document.querySelector('#undo')!.addEventListener('click',()=>{editor.editable.focus();document.execCommand('undo');});
document.querySelector('#redo')!.addEventListener('click',()=>{editor.editable.focus();document.execCommand('redo');});
Object.assign(window,{probe:{composer,editor,sends,registerChatEditor}});
