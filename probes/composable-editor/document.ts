/** Experimental model/history candidate. Not a shipped element or public package API. */
import { dispatchChange } from '../../packages/primitives/dist/interactions/events.js';
import { snapshotChatEditor, type ChatEditorData } from '../../packages/primitives/dist/interactions/chat-editor.js';
export type Run = {kind:'text';text:string} | {kind:'token';id:string;type:string;text:string;label:string;data:ChatEditorData};
export interface DocumentValue {version:1;runs:readonly Run[]}
export interface Selection {anchor:number;focus:number}
interface State {document:DocumentValue;selection:Selection}

function documentValue(runs:readonly Run[]):DocumentValue {
 const ids=new Set<string>();const normalized:Run[]=[];
 for(const run of runs){
  if(typeof run.text!=='string')throw new TypeError('Text is required');
  if(run.kind==='token'){
   if(!run.id||!run.type||!run.text||!run.label||ids.has(run.id))throw new TypeError('Tokens require distinct occurrence IDs, type, fallback and label');
   ids.add(run.id);normalized.push({...run});
  }else if(run.kind==='text'){
   if(!run.text)continue;
   const last=normalized.at(-1);if(last?.kind==='text')last.text+=run.text;else normalized.push({...run});
  }else throw new TypeError('Unknown run kind');
 }
 return snapshotChatEditor({value:'',content:{version:1,runs:normalized} as unknown as ChatEditorData}).content as unknown as DocumentValue;
}
export class EditorDocument extends EventTarget {
 private state:State;
 private authorRevision=0;
 private revisionValue=0;
 private past:State[]=[];
 private future:State[]=[];
 constructor(runs:readonly Run[]=[]){super();this.state=Object.freeze({document:documentValue(runs),selection:Object.freeze({anchor:0,focus:0})});}
 get document(){return this.state.document;}
 get value(){return this.document.runs.map(run=>run.text).join('');}
 get selection(){return this.state.selection;}
 get revision(){return this.revisionValue;}
 get canUndo(){return this.past.length>0;}
 get canRedo(){return this.future.length>0;}
 snapshot(){return snapshotChatEditor({value:this.value,content:this.document as unknown as ChatEditorData});}
 /** Authoritative reset invalidates async targets and history, even for equal content. */
 reset(runs:readonly Run[]){const document=documentValue(runs);this.authorRevision++;this.revisionValue++;this.state=Object.freeze({document,selection:Object.freeze({anchor:0,focus:0})});this.past=[];this.future=[];}
 private boundaries():number[]{
  const result=[0];let offset=0;
  const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  for(const run of this.document.runs){if(run.kind==='text')for(const part of segmenter.segment(run.text))result.push(offset+part.index+part.segment.length);else result.push(offset+run.text.length);offset+=run.text.length;}
  return result;
 }
 private snap(offset:number,side:'before'|'after'){
  if(!Number.isFinite(offset))throw new TypeError('Finite selection offset required');
  const points=this.boundaries();offset=Math.max(0,Math.min(this.value.length,offset));
  return side==='before'?[...points].reverse().find(point=>point<=offset)!:points.find(point=>point>=offset)!;
 }
 select(selection:Selection){
  const forward=selection.anchor<=selection.focus;
  const collapsed=selection.anchor===selection.focus;
  const anchor=this.snap(selection.anchor,forward?'before':'after');
  const focus=collapsed?anchor:this.snap(selection.focus,forward?'after':'before');
  this.state=Object.freeze({...this.state,selection:Object.freeze({anchor,focus})});
 }
 private slice(from:number,to:number):Run[]{
  const result:Run[]=[];let offset=0;
  for(const run of this.document.runs){const end=offset+run.text.length;if(end>from&&offset<to){if(run.kind==='token')result.push(run);else result.push({kind:'text',text:run.text.slice(Math.max(0,from-offset),Math.min(run.text.length,to-offset))});}offset=end;}
  return result;
 }
 replace(insert:readonly Run[],expectedRevision=this.revision){
  if(expectedRevision!==this.revision)return 'stale';
  const from=Math.min(this.selection.anchor,this.selection.focus),to=Math.max(this.selection.anchor,this.selection.focus);
  const content=documentValue(insert);const caret=from+content.runs.reduce((sum,run)=>sum+run.text.length,0);
  const document=documentValue([...this.slice(0,from),...content.runs,...this.slice(to,this.value.length)]);
  if(JSON.stringify(document)===JSON.stringify(this.document))return 'unchanged';
  return this.change({document,selection:Object.freeze({anchor:caret,focus:caret})},'edit');
 }
 delete(direction:'backward'|'forward'){
  const previous=this.state;
  if(this.selection.anchor===this.selection.focus){const caret=this.selection.focus;const points=this.boundaries();const index=points.indexOf(caret);this.select({anchor:caret,focus:direction==='backward'?points[Math.max(0,index-1)]:points[Math.min(points.length-1,index+1)]});}
  // History restores the caret before deletion, not the expanded deletion range.
  const target=this.state;this.state=previous;
  const from=Math.min(target.selection.anchor,target.selection.focus),to=Math.max(target.selection.anchor,target.selection.focus);
  if(from===to)return 'unchanged';
  return this.change({document:documentValue([...this.slice(0,from),...this.slice(to,this.value.length)]),selection:Object.freeze({anchor:from,focus:from})},'edit');
 }
 undo(){const target=this.past.at(-1);return target?this.change(target,'undo'):'unchanged';}
 redo(){const target=this.future.at(-1);return target?this.change(target,'redo'):'unchanged';}
 private change(proposed:State,reason:'edit'|'undo'|'redo'){
  proposed=Object.freeze(proposed);
  const previous=this.state;
  return dispatchChange(this,{previous,proposed,reason,getRevision:()=>this.authorRevision,stage:next=>{this.state=next;},rollback:old=>{this.state=old;},commit:()=>{
   this.revisionValue++;
   if(reason==='undo'){this.past.pop();this.future.push(previous);}else if(reason==='redo'){this.future.pop();this.past.push(previous);}else{this.past.push(previous);this.future=[];}
  }});
 }
}
