import type {TokenImportContext} from '@en-reve/primitives/interactions/editor-clipboard.js';
import { isHTMLButton } from '../internal/dom-kind.js';
import { connectionDocument } from '../internal/element-registry.js';
import { ScopedContext } from '../internal/context-consumer.js';
import { editorMessagesContext, mergeMessageOverrides } from '../messages-context.js';
import { ContextProvider } from '../internal/context-provider.js';
import { editorExtensionContext } from '../editor/context.js';
import {editorMessages, type EditorMessages} from '../editor/messages.js';
import type { ChangeEvent } from '@en-reve/primitives/interactions/events.js';
import type { EditorEventMap, EditorInputEvent, EditorActionEvent } from '../editor/events.js';
export type { EditorInputEvent, EditorActionEvent } from '../editor/events.js';
import {readEditorClipboard,importClipboardRuns,sliceClipboardRuns,writeEditorClipboard} from '@en-reve/primitives/interactions/editor-clipboard.js';
import {positionEditorPopup,observeEditorPopup,editorTriggerAnchor} from '../internal/editor-popup.js';
import {EditorExtensionRegistry,EditorQueryTask,EditorBookmarks,type EditorBookmark} from '@en-reve/primitives/interactions/editor-extensions.js';
import {html,nothing,type PropertyValues} from 'lit';
import {html as staticHtml,unsafeStatic} from 'lit/static-html.js';
import {descriptionTemplate} from '@en-reve/primitives/templates/description.js';
import {EnElement} from '../internal/en-element.js';
import {EditorDocument,type Run,type DocumentValue,type Selection} from '@en-reve/primitives/state/token-document.js';
import {registerChatEditor,snapshotEditorData,type ChatEditorAdapter} from '@en-reve/primitives/interactions/chat-editor.js';
import {dispatchAction,dispatchDraftInput} from '@en-reve/primitives/interactions/events.js';
import {sizeStyles} from '@en-reve/styles/foundations.js';
import {tokenEditorStyles} from '@en-reve/styles/token-editor.js';
import type {EditorExtension,EditorChoice,EditorPickerSession,TokenRenderer,TokenRun,TokenOptions} from './extensions.js';
export type {EditorExtension,EditorChoice,EditorPickerSession,TokenRenderer,TokenRun,TokenOptions} from './extensions.js';
export type {Run,DocumentValue,Selection};
interface Session {external:boolean;token?:TokenRun;manual:boolean;extension:EditorExtension;query:string;from:number;to:number;revision:number;controller:AbortController;choices:readonly EditorChoice[];active:number;loading:boolean;error:boolean}
export type TokenEditorChangeReason='edit'|'undo'|'redo';
export type TokenEditorChangeEvent=ChangeEvent<DocumentValue,TokenEditorChangeReason>;
export interface TokenEditorEventMap extends EditorEventMap {
 'en-change':TokenEditorChangeEvent;
}
/**
 * Optional multiline text and atomic-token editor. No triggers or token types are installed by default.
 * @cssprop --en-editor-token-pressed-scale - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-offset - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-press-duration - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-release-duration - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-shadow - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-color - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-border-color - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-token-editor
 * @slot description - Supporting content; replaces the description attribute/property fallback.
 * @csspart description - Supporting content below the editing surface.
 * @slot label - Visible label; label supplies the textbox accessible name.
 * @csspart label - Visible editor label.
 * @csspart control - Multiline editing surface.
 * @csspart token - All atomic inline token wrappers.
 * @csspart token-interactive - Token wrappers configured with an edit extension; disabled while unavailable.
 * @csspart token-content - Noninteractive token contents, including custom renderer output.
 * @csspart popup - Extension popup surface.
 * @csspart option - Default suggestion option.
 * @cssprop --en-input-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-hover-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-radius - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-background - Editing surface paint; refines shared control background.
 * @cssprop --en-input-color - Editing foreground; refines shared control color.
 * @cssprop --en-input-inline-padding - Editing inset; refines shared control inline padding.
 * @cssprop --en-field-gap - Space between label and editor.
 * @cssprop --en-option-list-max-block-size - Suggestion list ceiling, further constrained by available viewport space.
 * @cssprop --en-option-list-gap - Space between standard suggestion rows.
 * @cssprop --en-option-list-padding - Suggestion inset, with focus clearance.
 * @cssprop --en-option-list-radius - Suggestion surface radius.
 * @cssprop --en-option-list-color - Suggestion foreground, falling back through overlay color.
 * @cssprop --en-option-block-padding - Standard suggestion row block padding.
 * @cssprop --en-option-inline-padding - Standard suggestion row inline padding.
 * @cssprop --en-option-radius - Standard suggestion row radius, otherwise concentric with its list.
 * @cssprop --en-editor-max-size - Maximum editing surface block size.
 * @cssprop --en-editor-token-radius - Inline token contour.
 * @cssprop --en-editor-token-background - Inline token background.
 * @cssprop --en-editor-token-color - Inline token foreground.
 * @cssprop --en-editor-token-border-color - Token boundary color.
 * @cssprop --en-editor-token-hover-background - Hover-capable token action background.
 * @cssprop --en-editor-token-pressed-background - Pressed token action background.
 * @cssprop --en-editor-token-inline-padding - Inline token padding.
 * @cssprop --en-editor-token-block-padding - Block token padding.
 * @cssprop --en-editor-token-gap - Space between adjacent tokens.
 * @cssprop --en-editor-token-min-size - Minimum token size; interactive target floors still apply.
 * @fires {TokenEditorChangeEvent} en-change - One cancelable document commit; previous/proposed are versioned documents.
 * @fires {EditorInputEvent} en-input - Native draft input, including composition state.
 * @fires {EditorActionEvent} en-action - Application-defined extension command with data; never executes transport itself.
 */
export class EnTokenEditor extends EnElement<TokenEditorEventMap> {
 private readonly editorExtensionContextProvider = new ContextProvider(this, {context: editorExtensionContext, initialValue: this});
 private readonly messageContext = new ScopedContext(this, editorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties={label:{useDefault:true},description:{},messages:{attribute:false},disabled:{type:Boolean,reflect:true},readOnly:{type:Boolean,attribute:'readonly',reflect:true},value:{noAccessor:true},document:{attribute:false,noAccessor:true},sessionVersion:{state:true}};
 static override styles=[sizeStyles,tokenEditorStyles];
 /** Partial translations; replace the object to update. Missing/nullish entries use English defaults. */
 declare messages:EditorMessages | undefined;
 /** Plain supporting text; slot=description takes precedence. @default '' */
 declare description:string;
 declare label:string;declare disabled:boolean;declare readOnly:boolean;private declare sessionVersion:number;
 private model=new EditorDocument();
 private initialMarkup?:string;
 private registrations=new EditorExtensionRegistry<EditorExtension>(previous=>{if(previous&&this.session?.extension===previous)this.close();});
 private queryTask=new EditorQueryTask();
 private bookmarks=new EditorBookmarks<Selection>();
 private renderers=new Map<string,{render:TokenRenderer;options:TokenOptions}>();
 private tokenNodes=new WeakMap<Node,TokenRun>();
 private dispose?:()=>void;
 private compositionActive=false;private deferred?:readonly Run[];
 private popupResize?:{disconnect():void};
 private session?:Session;private dismissed='';private frame=0;private committing=false;
 private get input(){return this.renderRoot?.querySelector<HTMLElement>('.editor');}
 private get popup(){return this.renderRoot?.querySelector<HTMLElement>('.popup');}
 constructor(){super();this.label='Message';this.description='';this.disabled=false;this.readOnly=false;this.sessionVersion=0;
  this.model.addEventListener('en-change',(event:Event)=>{
   const detail=(event as ChangeEvent<{document:DocumentValue;selection:Selection},TokenEditorChangeReason>).detail, connected=this.isConnected;
   const accepted=this.dispatchEvent(new CustomEvent('en-change',{bubbles:true,composed:true,cancelable:true,detail:Object.freeze({previous:detail.previous.document,proposed:detail.proposed.document,reason:detail.reason})}));
   // The model still owns rollback/history and authoritative or nested precedence.
   // Detached initialization remains supported; losing a live connection cancels.
   if(!accepted||this.disabled||this.readOnly||(connected&&!this.isConnected))event.preventDefault();
  });
 }
 /** Plain-text projection of document, excluding unaccepted native drafts. Setting resets structured content and history. */
 get value():string{return this.model.value;}
 /** Live native text, including an unfinished composition; falls back to value before rendering. */
 get draftValue():string{return this.input?this.readDOM().runs.map(run=>run.text).join(''):this.value;}
 /** Whether a native IME composition is active. */
 get composing():boolean{return this.compositionActive;}
 set value(value:string){this.document={version:1,runs:[{kind:'text',text:String(value)}]};}
 /** Versioned, immutable document; tokens preserve arbitrary JSON-compatible application data. */
 get document(){return this.model.document;}
 set document(value:DocumentValue){if(value?.version!==1||!Array.isArray(value.runs))throw new TypeError('Expected a version 1 token document');this.close();if(this.composing){this.deferred=new EditorDocument(value.runs).document.runs;return;}this.model.reset(value.runs);if(this.hasUpdated)this.paint(false);this.requestUpdate();}
 get revision(){return this.model.revision;}
 /** Replace a logical selection as one cancelable undoable edit; stale revisions are rejected. */
 replaceSelection(runs:readonly Run[],selection?:Selection,revision=this.revision):boolean {
  if(this.disabled||this.readOnly||this.composing||revision!==this.revision)return false;
  this.model.select(selection??this.selection??this.model.selection);
  const result=this.model.replace(runs,revision);this.paint(true);return result==='committed';
 }
 undo(){if(this.disabled||this.readOnly||this.composing)return false;this.close();const result=this.model.undo();this.paint(true);return result==='committed';}
 redo(){if(this.disabled||this.readOnly||this.composing)return false;this.close();const result=this.model.redo();this.paint(true);return result==='committed';}
 /** Add a type renderer; optional extension makes the atomic wrapper an accessible edit button. */
 registerToken(type:string,renderer:TokenRenderer,options:TokenOptions={}){
  if(options.part&&!/^[a-z][a-z0-9-]*$/.test(options.part))throw new TypeError('Token part must be a lowercase CSS identifier');
  const registration={render:renderer,options:{...options}};this.renderers.set(type,registration);
  if(this.hasUpdated&&!this.composing)this.paint(false);
  return()=>{if(this.renderers.get(type)===registration){this.renderers.delete(type);if(!this.composing)this.paint(false);}};
 }
 /** Register an optional trigger. Removing it aborts outstanding provider work. */
 registerExtension(extension:EditorExtension){if(!extension.provide&&!extension.render&&!extension.open)throw new TypeError('Extension requires provider or picker');const dispose=this.registrations.register(extension);this.syncTokenControls();return()=>{dispose();this.syncTokenControls();};}
 /** Capture an opaque selection for external controls. Invalid after document changes. */
 captureBookmark():EditorBookmark {return this.bookmarks.capture(this.revision,this.selection??this.model.selection);}
 restoreBookmark(bookmark:EditorBookmark):boolean {const selection=this.bookmarks.resolve(bookmark,this.revision);if(!selection||this.disabled||this.composing)return false;this.model.select(selection);this.focus();this.place(selection);return true;}
 replaceBookmark(bookmark:EditorBookmark,runs:readonly Run[]):boolean {const selection=this.bookmarks.resolve(bookmark,this.revision);return !!selection&&this.replaceSelection(runs,selection,bookmark.revision);}

 /** Open from a toolbar, or edit an existing occurrence with tokenId. Restore editor focus/selection. */
 openExtension(id:string,options:{tokenId?:string}={}){
  const extension=this.registrations.get(id);
  if(!extension||this.disabled||this.readOnly||this.composing)return false;
  let token:TokenRun|undefined;
  if(options.tokenId!==undefined){
   let offset=0;
   for(const run of this.document.runs){if(run.kind==='token'&&run.id===options.tokenId){token=run;this.model.select({anchor:offset,focus:offset+run.text.length});break;}offset+=run.text.length;}
   if(!token)return false;
  }else this.model.select(this.selection??this.model.selection);
  const selection=this.model.selection;
  this.focus();
  this.place(selection);
  this.start(extension,'',Math.min(selection.anchor,selection.focus),Math.max(selection.anchor,selection.focus),true,token);
  return true;
 }
 /** Focus the native textbox; no-op before its first render. */
 override focus(options?:FocusOptions):void{this.input?.focus(options);}
 override connectedCallback(){super.connectedCallback();const owner=this;const adapter:ChatEditorAdapter={get value(){return owner.value;},get disabled(){return owner.disabled;},get readOnly(){return owner.readOnly;},get composing(){return owner.composing;},focus:options=>owner.focus(options),reportValidity:()=>!owner.session,getSnapshot:()=>owner.model.snapshot()};this.dispose=registerChatEditor(this,adapter);}
 override disconnectedCallback(){this.dispose?.();this.close();connectionDocument(this).removeEventListener('selectionchange',this.selectionChanged);super.disconnectedCallback();}
 protected override firstUpdated(){
  const input=this.input!;
  for(const span of input.querySelectorAll<HTMLElement>('[data-initial-token]')){const token=this.document.runs.find(run=>run.kind==='token'&&run.id===span.dataset.initialToken);if(token?.kind==='token')this.tokenNodes.set(span,token);}
  const native=this.readDOM().runs;
  if(native.map(run=>run.text).join('')!==this.value)this.model.reset(native);
  this.paint(false);
 }
 protected override updated(changed:PropertyValues){if(changed.has('disabled')||changed.has('readOnly')){if(this.disabled||this.readOnly)this.close();this.syncTokenControls();}}
 private selectionChanged=()=>{if((this.renderRoot as ShadowRoot).activeElement===this.input&&!this.composing&&!this.committing){this.captureSelection();this.detect();}};
 private focusIn=()=>{this.ownerDocument.addEventListener('selectionchange',this.selectionChanged);if(!this.selection)this.place(this.model.selection);};
 private focusOut=()=>{queueMicrotask(()=>{if(!(this.renderRoot as ShadowRoot).activeElement)connectionDocument(this).removeEventListener('selectionchange',this.selectionChanged);});};
 private logicalText(node:Node):string {if(node===this.input)return [...node.childNodes].map(n=>this.logicalText(n)).join('');const token=this.tokenNodes.get(node);if(token)return token.text;if(node.nodeType===3)return (node.textContent??'').replaceAll('\u200b','');if(node.nodeName==='BR')return '\n';return [...node.childNodes].map(n=>this.logicalText(n)).join('');}
 private readDOM(){const runs:Run[]=[];const walk=(node:Node)=>{const token=this.tokenNodes.get(node);if(token){runs.push(token);return;}if(node.nodeType===3){runs.push({kind:'text',text:(node.textContent??'').replaceAll('\u200b','')});return;}if(node.nodeName==='BR'){runs.push({kind:'text',text:'\n'});return;}const block=['DIV','P'].includes(node.nodeName);if(block&&runs.length&& !runs.at(-1)!.text.endsWith('\n'))runs.push({kind:'text',text:'\n'});node.childNodes.forEach(walk);};this.input?.childNodes.forEach(walk);return {runs};}
 private point(node:Node,offset:number):number|undefined {const root=this.input;if(!root||!root.contains(node)&&root!==node)return;let count=0;let found=false;const walk=(current:Node)=>{if(found)return;if(current===node){count+=current.nodeType===3?current.textContent!.slice(0,offset).replaceAll('\u200b','').length:[...current.childNodes].slice(0,offset).reduce((n,child)=>n+this.logicalText(child).length,0);found=true;return;}const token=this.tokenNodes.get(current);if(token&&current.contains(node)){count+=offset?token.text.length:0;found=true;return;}if(current.nodeType===3||token||current.nodeName==='BR')count+=this.logicalText(current).length;else current.childNodes.forEach(walk);};walk(root);return found?count:undefined;}
 get selection():Selection|undefined {
  const docSelection=this.ownerDocument.getSelection();if(!docSelection)return;
  const root=this.renderRoot as ShadowRoot;const local=(root as ShadowRoot&{getSelection?():globalThis.Selection}).getSelection?.();const selection=local??docSelection;
  let anchor=this.point(selection.anchorNode!,selection.anchorOffset),focus=this.point(selection.focusNode!,selection.focusOffset);
  if(anchor===undefined||focus===undefined){const ranges=(docSelection as globalThis.Selection&{getComposedRanges?(options:{shadowRoots:ShadowRoot[]}):StaticRange[]}).getComposedRanges?.({shadowRoots:[root]});const range=ranges?.[0];if(range){anchor=this.point(range.startContainer,range.startOffset);focus=this.point(range.endContainer,range.endOffset);}}
  return anchor===undefined||focus===undefined?undefined:{anchor,focus};
 }
 private captureSelection(){const selection=this.selection;if(selection)this.model.select(selection);}
 private place(selection:Selection){const root=this.input;if(!root)return;const locate=(offset:number):[Node,number]=>{let total=0;for(const node of root.childNodes){const length=this.logicalText(node).length;if(node.nodeType===3&&offset<=total+length){const target=Math.max(0,offset-total);let raw=0,count=0;while(raw<(node.textContent?.length??0)&&count<target){if(node.textContent![raw]!=='\u200b')count++;raw++;}return [node,raw]};if(offset<=total&&node.parentNode)return [root,[...root.childNodes].indexOf(node)];total+=length;}return [root,root.childNodes.length];};const [a,ao]=locate(selection.anchor),[f,fo]=locate(selection.focus);this.ownerDocument.getSelection()?.setBaseAndExtent(a,ao,f,fo);}
 private syncTokenControls(){
  this.input?.querySelectorAll<HTMLButtonElement>('button[data-token]').forEach(button=>{
   const token=this.tokenNodes.get(button);const id=token&&this.renderers.get(token.type)?.options.extension;const extension=id?this.registrations.get(id):undefined;
   button.disabled=this.disabled||this.readOnly||!extension;
   button.setAttribute('aria-haspopup',extension?.provide&&!extension.render&&!extension.open?'listbox':'dialog');
  });
 }
 private paint(focus:boolean){
  const root=this.input;if(!root)return;
  const active=(this.renderRoot as ShadowRoot).activeElement===root;const fragment=this.ownerDocument.createDocumentFragment();
  for(const run of this.document.runs){
   if(run.kind==='text'){fragment.append(this.ownerDocument.createTextNode(run.text));continue;}
   // Firefox needs an editable caret stop before a leading or adjacent atom.
   if(fragment.lastChild?.nodeType!==3)fragment.append(this.ownerDocument.createTextNode('\u200b'));
   const registration=this.renderers.get(run.type);const interactive=!!registration?.options.extension;
   const wrapper=this.ownerDocument.createElement(interactive?'button':'span');
   if(isHTMLButton(wrapper)){wrapper.type='button';wrapper.tabIndex=0;}
   wrapper.contentEditable='false';wrapper.setAttribute('part',['token',interactive?'token-interactive':'',registration?.options.part??''].filter(Boolean).join(' '));wrapper.dataset.token=run.id;wrapper.setAttribute('aria-label',run.label);
   const content=this.ownerDocument.createElement('span');content.setAttribute('part','token-content');
   try{content.append(registration?registration.render(run):this.ownerDocument.createTextNode(run.text));}catch{content.textContent=run.text;}
   wrapper.append(content);this.tokenNodes.set(wrapper,run);fragment.append(wrapper);
  }
  if(fragment.lastChild?.nodeType===3)fragment.lastChild.textContent+='\u200b';else fragment.append(this.ownerDocument.createTextNode('\u200b'));
  root.replaceChildren(fragment);this.syncTokenControls();if(focus)root.focus();if(focus||active)this.place(this.model.selection);
 }
 /** Convert a token to editable trigger/query text and open its picker as one undoable edit. */
 editToken(tokenId:string,options:{query?:string}={}):boolean {
  if(this.disabled||this.readOnly||this.composing)return false;
  let from=0;
  for(const run of this.document.runs){
   if(run.kind==='token'&&run.id===tokenId){
    const id=this.renderers.get(run.type)?.options.extension;const extension=id?this.registrations.get(id):undefined;if(!extension)return false;
    const query=options.query??'';if(typeof query!=='string')throw new TypeError('Expected a query string');
    this.close();const text=extension.trigger+query;
    if(!this.replaceSelection([{kind:'text',text}],{anchor:from,focus:from+run.text.length}))return false;
    this.start(extension,query,from,from+text.length);return true;
   }
   from+=run.text.length;
  }
  return false;
 }
 private adjacentToken(direction:'backward'|'forward'){
  const selection=this.model.selection;if(selection.anchor!==selection.focus)return;
  let offset=0;for(const run of this.document.runs){const end=offset+run.text.length;if(run.kind==='token'&&(direction==='backward'?end===selection.focus:offset===selection.focus))return run;offset=end;}
 }
 private beforeInput=(event:InputEvent)=>{
  if(this.disabled||this.readOnly){if(event.cancelable)event.preventDefault();return;}
  if(this.composing||event.isComposing)return;
  this.captureSelection();
  if(!event.cancelable)return;
  if(event.inputType.startsWith('format')){event.preventDefault();return;}
  if(event.inputType==='historyUndo'||event.inputType==='historyRedo'){event.preventDefault();event.inputType==='historyUndo'?this.undo():this.redo();}
  else if(event.inputType==='insertParagraph'||event.inputType==='insertLineBreak'){event.preventDefault();this.replaceSelection([{kind:'text',text:'\n'}]);this.close();}
  else if(event.inputType==='deleteContentBackward'||event.inputType==='deleteContentForward') {event.preventDefault();const direction=event.inputType==='deleteContentBackward'?'backward':'forward';const token=this.adjacentToken(direction);if(token&&this.renderers.get(token.type)?.options.deleteBehavior==='edit'&&this.renderers.get(token.type)?.options.extension&&this.registrations.has(this.renderers.get(token.type)!.options.extension!)){this.editToken(token.id);return;}this.model.delete(direction);this.paint(true);this.detect();}
 };
 private nativeInput=(event:InputEvent)=>{dispatchDraftInput(this,{value:this.draftValue,isComposing:this.composing,inputType:event.inputType??''});if(this.composing)return;this.acceptNative();};
 private acceptNative(){const selection=this.selection??this.model.selection;const result=this.model.apply(this.readDOM().runs,selection);if(result!=='committed'&&result!=='unchanged')this.paint(true);this.detect();}
 private compositionStart=()=>{this.captureSelection();this.compositionActive=true;this.close();};
 private compositionEnd=()=>{this.compositionActive=false;if(this.deferred){const runs=this.deferred;this.deferred=undefined;this.model.reset(runs);this.paint(true);}else this.acceptNative();};
 private paste=(event:ClipboardEvent)=>{event.preventDefault();if(this.disabled||this.readOnly||this.composing||!event.clipboardData)return;const data=event.clipboardData,structured=readEditorClipboard(data);
  const used=new Set(this.document.runs.flatMap(run=>run.kind==='token'?[run.id]:[]));
  const importToken=(token:TokenRun,context:TokenImportContext)=>{const handler=this.renderers.get(token.type)?.options.importToken;return handler?handler(token,context):token;};
  let runs:readonly Run[]=[{kind:'text',text:data.getData('text/plain')}];
  if(structured)try{runs=importClipboardRuns(structured.runs,type=>this.renderers.has(type),used,importToken);}catch{/* Entire paste falls back to readable text. */}
  this.replaceSelection(runs);this.close();};
 private drop=(event:DragEvent)=>{event.preventDefault();if(this.disabled||this.readOnly||this.composing)return;const text=event.dataTransfer?.getData('text/plain');if(text)this.replaceSelection([{kind:'text',text}]);};
 private copy=(event:ClipboardEvent)=>{const raw=this.selection;if(!raw||!event.clipboardData)return;this.model.select(raw);const selection=this.model.selection;if(selection.anchor===selection.focus)return;
  const runs=sliceClipboardRuns(this.document.runs,Math.min(selection.anchor,selection.focus),Math.max(selection.anchor,selection.focus));
  if(!writeEditorClipboard(event.clipboardData,runs))return;event.preventDefault();if(event.type==='cut'&&!this.disabled&&!this.readOnly&&!this.composing)this.replaceSelection([]);};
 private keydown=(event:KeyboardEvent)=>{
  if(event.isComposing||this.composing)return;
  // Preserve native button activation without bubbling Enter to composer send.
  if((event.key==='Enter'||event.key===' ')&&event.composedPath().some(node=>this.tokenNodes.has(node as Node))){event.stopPropagation();return;}
  if(!this.popup?.contains((this.renderRoot as ShadowRoot).activeElement)&&(event.ctrlKey||event.metaKey)&&!event.altKey&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?this.redo():this.undo();return;}
  const token=event.composedPath().map(node=>this.tokenNodes.get(node as Node)).find(Boolean);
  if(token&&(event.key==='Backspace'||event.key==='Delete')){
   event.preventDefault();event.stopPropagation();
   if(this.renderers.get(token.type)?.options.deleteBehavior==='edit')this.editToken(token.id);
   else{let from=0;for(const run of this.document.runs){if(run.kind==='token'&&run.id===token.id){this.replaceSelection([],{anchor:from,focus:from+run.text.length});break;}from+=run.text.length;}}
   return;
  }
  const session=this.session;if(!session)return;
  if(session.external&&event.key!=='Escape'){this.close();return;}
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.cancelSession(session);return;}
  if(event.key==='Tab'){if(!session.extension.render||(this.renderRoot as ShadowRoot).activeElement===this.input)this.close();return;}
  if(session.extension.render&&(event.key==='ArrowDown'||event.key==='Enter')&&(this.renderRoot as ShadowRoot).activeElement===this.input){event.preventDefault();event.stopPropagation();(this.popup?.querySelector<HTMLElement>('[data-picker-focus]') ?? this.popup?.querySelector<HTMLElement>('input,button,[tabindex="0"]'))?.focus();return;}
  if(session.extension.render)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const n=session.choices.length;if(n)session.active=(session.active+(event.key==='ArrowDown'?1:-1)+n)%n;this.refresh();}
  else if(event.key==='Enter'){event.preventDefault();event.stopPropagation();const choice=session.choices[session.active];if(choice)this.selectChoice(session,choice);}
 };
 private outsideFocus=(event:Event)=>{if(!this.session?.external&&!event.composedPath().includes(this))this.close();};
 private outsidePointer=(event:Event)=>{if(!this.session?.external&&!event.composedPath().includes(this))this.close();};
 private signature(){const selection=this.selection;return `${this.revision}:${selection?.anchor}:${selection?.focus}`;}
 private detect(){if(this.committing||this.disabled||this.readOnly||this.composing||(this.renderRoot as ShadowRoot).activeElement!==this.input)return;const selection=this.selection;if(!selection){this.close();return;}if(this.session?.manual&&this.session.revision===this.revision&&Math.min(selection.anchor,selection.focus)===this.session.from&&Math.max(selection.anchor,selection.focus)===this.session.to)return;if(selection.anchor!==selection.focus){this.close();return;}if(this.dismissed===this.signature())return;let textStart=0,offset=0;for(const run of this.document.runs){const end=offset+run.text.length;if(run.kind==='token'&&offset<selection.focus){if(end>selection.focus){this.close();return;}textStart=end;}offset=end;}const before=this.value.slice(textStart,selection.focus);const match=this.registrations.match(before);if(match){const {extension,query,from}=match;if(this.session?.extension===extension&&this.session.query===query&&this.session.revision===this.revision&&this.session.to===selection.focus)return;this.start(extension,query,textStart+from,selection.focus);return;}this.close();}
 private start(extension:EditorExtension,query:string,from:number,to:number,manual=false,token?:TokenRun){this.close();const session:Session={external:!!extension.open,token,manual,extension,query,from,to,revision:this.revision,controller:new AbortController(),choices:[],active:0,loading:!!extension.provide,error:false};this.session=session;this.refresh();this.trackPosition(true);
  if(extension.open){try{extension.open(this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}return;}
  if(extension.provide)this.queryTask.start(query,extension.provide,choices=>{if(this.session!==session||session.external)return;session.choices=choices;session.loading=false;this.refresh();},()=>{if(this.session===session){session.loading=false;session.error=true;this.refresh();}},session.controller);
 }
 private valid(session:Session){return this.session===session&&session.revision===this.revision&&!session.controller.signal.aborted&&this.isConnected&&!this.disabled&&!this.readOnly&&!this.composing;}
 private selectChoice(session:Session,choice:EditorChoice){
  if(!this.valid(session))return;
  if(session.extension.select){try{session.extension.select(choice,this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}}else this.complete(session,choice);
 }
 private openPicker(session:Session,open:(picker:EditorPickerSession)=>void):boolean {
  if(!this.valid(session))return false;
  session.external=true;session.choices=[];
  if(this.popup?.matches(':popover-open'))this.popup.hidePopover();
  this.refresh();
  try{open(this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}
  return true;
 }
 private complete(session:Session,choice:EditorChoice){if(!this.valid(session))return false;this.committing=true;try{if(choice.action&&!dispatchAction(this,{action:choice.action,data:choice.data===undefined?undefined:snapshotEditorData(choice.data)},{cancelable:true}))return false;if(!this.valid(session))return false;const accepted=this.replaceSelection(choice.insert??[],{anchor:session.from,focus:session.to},session.revision);if(accepted||session.from===session.to&&!choice.insert?.length){this.close();this.restoreSessionFocus(session);return true;}return false;}finally{this.committing=false;}}
 private tokenClick=(event:MouseEvent)=>{
  if(this.session?.external)this.close();
  for(const node of event.composedPath()){const token=this.tokenNodes.get(node as Node);if(token){const extension=this.renderers.get(token.type)?.options.extension;if(extension){event.stopPropagation();this.openExtension(extension,{tokenId:token.id});}return;}}
 };
 private pickerSession(session:Session):EditorPickerSession{return {query:session.query,token:session.token,getAnchorRect:()=>this.pickerAnchorRect(session),openPicker:open=>this.openPicker(session,open),signal:session.controller.signal,commit:choice=>this.complete(session,choice),cancel:()=>this.cancelSession(session)};}
 private pickerAnchorRect(session:Session):DOMRectReadOnly {
  const input=this.input;
  const token=session.token&&[...input?.querySelectorAll<HTMLElement>('[data-token]')??[]].find(node=>this.tokenNodes.get(node)?.id===session.token!.id);
  if(token)return token.getBoundingClientRect();
  const caret=this.textRect(session.to);
  return input&&!session.manual?editorTriggerAnchor(input,this.textRect(session.from,true),caret):caret;
 }
 private textRect(offset:number,glyph=false):DOMRectReadOnly {
  const input=this.input;
  // Resolve saved logical offsets even while focus is inside the picker.
  let remaining=offset;
  for(const node of input?.childNodes??[]){
   const length=this.logicalText(node).length;
   if(node.nodeType===3&&(remaining<length||!glyph&&remaining===length)){
    const text=node.textContent??'';let raw=0,count=0;
    while(raw<text.length&&count<remaining){if(text[raw]!=='\u200b')count++;raw++;}
    const range=this.ownerDocument.createRange();
    if(glyph){while(text[raw]==='\u200b')raw++;range.setStart(node,raw);range.setEnd(node,Math.min(text.length,raw+(text.codePointAt(raw)!>0xffff?2:1)));const rect=range.getClientRects()[0];if(rect?.height)return rect;}
    range.setStart(node,raw);range.collapse(true);
    const rect=range.getBoundingClientRect();if(rect.height)return rect;
    // Engines may return a zero rectangle for a collapsed range. Measure the
    // adjacent glyph without inserting a marker or altering the live selection.
    if(text.length){const start=raw?raw-1:0;range.setStart(node,start);range.setEnd(node,Math.min(text.length,start+1));const glyph=range.getBoundingClientRect();if(glyph.height){const rtl=this.ownerDocument.defaultView?.getComputedStyle(input!).direction==='rtl';return new DOMRect(raw?(rtl?glyph.left:glyph.right):(rtl?glyph.right:glyph.left),glyph.top,0,glyph.height);}}
   }
   remaining-=length;
  }
  return (input??this).getBoundingClientRect();
 }
 private restoreSessionFocus(session:Session){
  const button=session.token?[...this.input?.querySelectorAll<HTMLElement>('button[data-token]')??[]].find(node=>node.dataset.token===session.token!.id):undefined;
  if(button&&!this.disabled&&!this.readOnly)button.focus();else this.focus();
 }
 private cancelSession(session:Session){
  if(this.session!==session)return;
  this.close();this.restoreSessionFocus(session);
  // WebKit can clear the editor selection on button pointerdown. Record the
  // restored caret so its queued selectionchange cannot reopen the canceled picker.
  this.dismissed=this.signature();
 }
 private close(){this.queryTask.cancel();if(!this.session)return;this.session.controller.abort();this.session=undefined;this.trackPosition(false);if(this.popup?.matches(':popover-open'))this.popup.hidePopover();this.refresh();}
 private refresh(){this.sessionVersion++;void this.updateComplete.then(()=>{if(this.session&&!this.session.external&&this.isConnected&&this.popup){if(!this.popup.matches(':popover-open')){this.popup.showPopover();this.popup.scrollTop=0;}this.position();}});}
 private position=()=>{cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{const popup=this.popup,input=this.input,s=this.session;if(popup&&input&&s&&!s.external)positionEditorPopup(popup,input,this.pickerAnchorRect(s),!!s.extension.render,s.token?undefined:this.textRect(s.to));});};
 private trackPosition(on:boolean){const view=this.ownerDocument.defaultView;if(!view)return;const method=on?'addEventListener':'removeEventListener';this.ownerDocument[method]('pointerdown',this.outsidePointer,true);this.ownerDocument[method]('focusin',this.outsideFocus,true);view[method]('scroll',this.position,true);view[method]('resize',this.position);view.visualViewport?.[method]('resize',this.position);view.visualViewport?.[method]('scroll',this.position);this.popupResize?.disconnect();this.popupResize=on?observeEditorPopup(this.input,this.popup,this.position):undefined;if(!on)cancelAnimationFrame(this.frame);}
 protected override render(){
  if(this.initialMarkup===undefined){const escape=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');this.initialMarkup=this.document.runs.map(run=>run.kind==='text'?escape(run.text):`<span contenteditable="false" part="token" data-initial-token="${escape(run.id)}" aria-label="${escape(run.label)}"><span part="token-content">${escape(run.text)}</span></span>`).join('');}
  const messages=editorMessages(this.effectiveMessages);const s=this.session;const picker:EditorPickerSession|undefined=s?this.pickerSession(s):undefined;return staticHtml`<span class="label" part="label"><slot name="label">${this.label}</slot></span><div class="editor" part="control" role="textbox" aria-label=${this.label} aria-multiline="true" aria-describedby=${s&&!s.external?'description editor-hint':'description'} aria-disabled=${String(this.disabled)} aria-readonly=${String(this.readOnly)} aria-controls=${s&&!s.external?'editor-popup':nothing} aria-haspopup=${s?(s.extension.render||s.external?'dialog':'listbox'):nothing} aria-activedescendant=${s&&!s.extension.render&&s.choices.length?`choice-${s.active}`:nothing} contenteditable=${this.disabled||this.readOnly?'false':'true'} tabindex=${this.disabled?'-1':'0'} @click=${this.tokenClick} @focus=${this.focusIn} @focusout=${this.focusOut} @beforeinput=${this.beforeInput} @input=${this.nativeInput} @compositionstart=${this.compositionStart} @compositionend=${this.compositionEnd} @paste=${this.paste} @drop=${this.drop} @copy=${this.copy} @cut=${this.copy} @keydown=${this.keydown}>${unsafeStatic(this.initialMarkup)}</div>${descriptionTemplate(this.description)}<div class="hint" id="editor-hint">${s?s.external?nothing:s.extension.render?messages.instructions.picker:messages.suggestions.keyboardHint:nothing}</div><div class="popup" part="popup" id="editor-popup" popover="manual" role=${s?.extension.render?'dialog':'listbox'} aria-label=${s?.extension.label??messages.suggestions.label} @keydown=${this.keydown} @focusout=${this.focusOut}>${s?s.extension.render?s.extension.render(picker!):html`${s.loading?html`<span role="status">${messages.suggestions.loading}</span>`:s.error?html`<span role="status">${messages.suggestions.unavailable}</span>`:!s.choices.length?html`<span role="status">${messages.suggestions.empty}</span>`:s.choices.map((choice,index)=>html`<div class="option" part="option" id=${`choice-${index}`} role="option" aria-label=${choice.label} aria-describedby=${choice.description?`choice-description-${index}`:nothing} aria-selected=${String(index===s.active)} @pointerdown=${(event:PointerEvent)=>event.preventDefault()} @click=${()=>this.selectChoice(s,choice)}>${s.extension.renderOption?s.extension.renderOption(choice):choice.label}${choice.description?html`<span class="description" id=${`choice-description-${index}`}>${choice.description}</span>`:nothing}</div>`)}`:nothing}</div>`;}
}
declare global {interface HTMLElementTagNameMap {'en-token-editor':EnTokenEditor;}}
