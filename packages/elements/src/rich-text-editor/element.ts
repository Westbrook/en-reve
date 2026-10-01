import type {TokenImportContext} from '@en-reve/primitives/interactions/editor-clipboard.js';
import { isHTMLButton } from '../internal/dom-kind.js';
import { ScopedContext } from '../internal/context-consumer.js';
import { editorMessagesContext, mergeMessageOverrides } from '../messages-context.js';
import { ContextProvider } from '../internal/context-provider.js';
import { editorExtensionContext, richEditorCommandContext } from '../editor/context.js';
import {editorMessages, type EditorMessages} from '../editor/messages.js';
import type { ChangeEvent } from '@en-reve/primitives/interactions/events.js';
import type { EditorEventMap, EditorInputEvent, EditorActionEvent } from '../editor/events.js';
export type { EditorInputEvent, EditorActionEvent } from '../editor/events.js';
import {readEditorClipboard,importClipboardRuns,writeEditorClipboard} from '@en-reve/primitives/interactions/editor-clipboard.js';
import {clipboardRuns,clipboardHTML,runsSlice,importRichClipboard,externalRichClipboard} from './clipboard.js';
import {positionEditorPopup,observeEditorPopup,editorTriggerAnchor} from '../internal/editor-popup.js';
import {html, nothing, type PropertyValues} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {descriptionTemplate} from '@en-reve/primitives/templates/description.js';
import {EnElement} from '../internal/en-element.js';
import {EditorState, TextSelection, NodeSelection, type Transaction, type Command, type SelectionBookmark} from 'prosemirror-state';
import type {DecorationSet, EditorView} from 'prosemirror-view';
import {resolveRichRange,type RichRange,type RichRangeDecoration} from './ranges.js';
export type {RichRange,RichRangeDecoration} from './ranges.js';
export interface RichRangeReplacement {readonly range:RichRange;readonly runs:readonly Run[];}
import {Fragment, type ResolvedPos} from 'prosemirror-model';
import {history, undo, redo, undoDepth, redoDepth, closeHistory} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {baseKeymap, toggleMark, setBlockType, chainCommands, exitCode, selectAll} from 'prosemirror-commands';
import {wrapInList, liftListItem, splitListItem, sinkListItem} from 'prosemirror-schema-list';
import {EditorExtensionRegistry, EditorQueryTask, EditorBookmarks, type EditorBookmark} from '@en-reve/primitives/interactions/editor-extensions.js';
import {registerChatEditor,snapshotEditorData, type ChatEditorData} from '@en-reve/primitives/interactions/chat-editor.js';
import {dispatchAction, dispatchChange, dispatchDraftInput} from '@en-reve/primitives/interactions/events.js';
import {EditorDocument, type Run} from '@en-reve/primitives/state/token-document.js';
import {sizeStyles} from '@en-reve/styles/foundations.js';
import {tokenEditorStyles} from '@en-reve/styles/token-editor.js';
import {richTextEditorStyles} from '@en-reve/styles/rich-text-editor.js';
import {richSchema, validateRichDocument, richSnapshot, richText, richHTML, richDocumentFromRuns, safeEditorLink, type RichDocument} from './document.js';
import type {EditorExtension, EditorChoice, EditorPickerSession, TokenRenderer, TokenOptions, TokenRun} from '../editor/extensions.js';
export type {RichDocument, RichNode} from './document.js';
export {richDocumentFromRuns};
export type RichEditorCommand = 'bold'|'italic'|'paragraph'|'heading'|'bullet-list'|'ordered-list'|'link'|'unlink'|'undo'|'redo';
export interface RichCommandState { readonly enabled: boolean; readonly active: boolean; readonly mixed: boolean; }
interface Session {extension: EditorExtension; query: string; from: number; to: number; revision: number; manual: boolean; token?: TokenRun; controller: AbortController; choices: readonly EditorChoice[]; active: number; loading: boolean; error: boolean; external: boolean;}
export type RichTextEditorChangeReason='input'|'extension'|'paste'|'cut'|RichEditorCommand;
export type RichTextEditorChangeEvent=ChangeEvent<RichDocument,RichTextEditorChangeReason>;
export interface RichTextEditorEventMap extends EditorEventMap {
 'en-change':RichTextEditorChangeEvent;
 'en-editor-state':CustomEvent<null>;
 /** Direct-host association protocol: cancelable, not bubbling or composed. */
 'en-toolbar-request':CustomEvent<null>;
}
/**
 * Optional block editor with application-owned reference/tool/picker extensions.
 * @cssprop --en-editor-token-pressed-scale - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-offset - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-press-duration - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-release-duration - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-shadow - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-color - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-editor-token-pressed-border-color - editor-token held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-rich-text-editor
 * @slot description - Supporting content; replaces the description attribute/property fallback.
 * @csspart description - Supporting content below the editing surface.
 * @slot label - Visible label; label supplies the accessible textbox name.
 * @csspart label - Visible editor label.
 * @csspart control - Semantic multiline editing surface.
 * @csspart range-decoration - Revision-bound passage highlight.
 * @csspart token - Atomic inline token wrapper, sharing token-editor theme hooks.
 * @csspart token-interactive - Token wrappers configured with an edit extension; disabled while unavailable.
 * @csspart token-content - Noninteractive token contents, including custom renderer output.
 * @csspart popup - Extension list/picker surface.
 * @csspart option - Extension suggestion.
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
 * @cssprop --en-editor-max-size - Maximum editor block size before scrolling.
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
 * @fires {RichTextEditorChangeEvent} en-change - Cancelable rich document transaction with previous/proposed and reason.
 * @fires {EditorInputEvent} en-input - Native draft input, including composition state.
 * @fires {EditorActionEvent} en-action - Cancelable application extension action.
 * @fires {CustomEvent<null>} en-toolbar-request - Cancelable direct-host toolbar association protocol; does not bubble or cross roots.
 * @fires {CustomEvent<null>} en-editor-state - Document/selection/availability changed; toolbar consumers reread state.
 */
export class EnRichTextEditor extends EnElement<RichTextEditorEventMap> {
 private readonly editorExtensionContextProvider = new ContextProvider(this, {context: editorExtensionContext, initialValue: this});
 private readonly richEditorCommandContextProvider = new ContextProvider(this, {context: richEditorCommandContext, initialValue: this});
  private readonly messageContext = new ScopedContext(this, editorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties = {label:{useDefault:true},description:{},messages:{attribute:false}, disabled:{type:Boolean,reflect:true}, readOnly:{type:Boolean,attribute:'readonly',reflect:true}, value:{noAccessor:true}, document:{attribute:false,noAccessor:true}, sessionVersion:{state:true}};
  static override styles = [sizeStyles,tokenEditorStyles, richTextEditorStyles];
 /** Partial translations; replace the object to update. Missing/nullish entries use English defaults. */
 declare messages:EditorMessages | undefined;
  /** Plain supporting text; slot=description takes precedence. @default '' */
  declare description: string;
  declare label: string; declare disabled: boolean; declare readOnly: boolean; private declare sessionVersion: number;
  private state = this.createState(validateRichDocument(richDocumentFromRuns([])));
  private view?: EditorView;
  private viewModule?: typeof import('prosemirror-view');
  private mountGeneration=0;
  private version = 0;
  private rangeDecorations: readonly RichRangeDecoration[] = [];
  private authorVersion = 0;
  private initialMarkup?: string;
  private deferred?: RichDocument;
  private unregister?: () => void;
  private stopNativeSelection?: () => void;
  private bookmarks = new EditorBookmarks<SelectionBookmark>();
  private registry = new EditorExtensionRegistry<EditorExtension>(previous => {if (previous && this.session?.extension === previous) this.close();});
  private queryTask = new EditorQueryTask();
  private renderers = new Map<string, {render:TokenRenderer;options:TokenOptions}>();
  private session?: Session;
  private dismissed = '';
  private committing = false;
  private frame = 0;
  private get popup() {return this.renderRoot.querySelector<HTMLElement>('.popup');}
  constructor() {super(); this.label='Document'; this.description=''; this.disabled=false; this.readOnly=false; this.sessionVersion=0;}
  private createState(doc: ReturnType<typeof validateRichDocument>) {
    return EditorState.create({doc, plugins:[history({depth:100}),keymap({
      'Mod-z':undo, 'Shift-Mod-z':redo, 'Mod-y':redo,
      'Mod-b':toggleMark(richSchema.marks.strong), 'Mod-i':toggleMark(richSchema.marks.em),
      Enter:splitListItem(richSchema.nodes.list_item), 'Mod-[':liftListItem(richSchema.nodes.list_item), 'Mod-]':sinkListItem(richSchema.nodes.list_item),
      'Shift-Enter':chainCommands(exitCode,(state,dispatch)=>{dispatch?.(state.tr.replaceSelectionWith(richSchema.nodes.hard_break.create()).scrollIntoView());return true;}),
    }),keymap(baseKeymap)]});
  }
  /** Detached, immutable, independently versioned block document. Author writes reset history. */
  get document(): RichDocument {return richSnapshot(this.state.doc);}
  set document(value: RichDocument) {
    const doc = validateRichDocument(value); this.authorVersion++; this.close();
    if (this.composing) {this.deferred=richSnapshot(doc); return;}
    this.state=this.createState(doc); this.version++; this.updateViewState(this.state); this.requestUpdate(); this.notify();
  }
  /** Plain-text projection. Setting explicitly replaces all formatting/tokens and history. */
  get value() {return richText(this.state.doc);}
  set value(value: string) {this.document=richDocumentFromRuns([{kind:'text',text:String(value)}]);}
  get revision() {return this.version;}
  /** Live native text, including an unfinished composition; falls back to value before mounting. */
  get draftValue(): string {return this.draftText();}
  /** Whether a native IME composition is active. */
  get composing(): boolean {return this.view?.composing ?? false;}
  get hasSelection() {return !this.state.selection.empty;}
  get selectionKey() {return this.signature();}
  get extensionOpen() {return !!this.session;}
  captureBookmark(): EditorBookmark {return this.bookmarks.capture(this.revision,this.state.selection.getBookmark());}
  restoreBookmark(bookmark: EditorBookmark): boolean {
    const selection=this.bookmarks.resolve(bookmark,this.revision);
    if (!selection || this.disabled || this.composing || !this.view) return false;
    this.view.dispatch(this.state.tr.setSelection(selection.resolve(this.state.doc))); this.focus(); return true;
  }
  /** Capture the user's current passage or caret as an explicit validated public range. */
  captureRange():RichRange|undefined {
    if(this.composing)return;
    const {from,to}=this.state.selection;
    const expectedText=this.state.doc.textBetween(from,to,'\n',node=>node.type.name==='token'?node.attrs.run.text:'\n');
    const range:RichRange=Object.freeze({coordinate:'structured',from,to,expectedText,revision:this.revision});
    return this.validateRange(range)?range:undefined;
  }
  /** Validate arbitrary text/structured offsets against this exact document revision. */
  validateRange(range:RichRange):boolean {return !!resolveRichRange(this.state.doc,this.revision,range);}
  /** Decorations do not focus the editor, change selection, or enter undo history. */
  decorateRanges(decorations:readonly RichRangeDecoration[]):boolean {
    const ids=new Set<string>();
    for(const item of decorations){if(!item.id||ids.has(item.id)||!this.validateRange(item.range))return false;ids.add(item.id);}
    this.rangeDecorations=decorations.map(item=>Object.freeze({id:item.id,range:Object.freeze({...item.range})}));
    this.view?.setProps({decorations:()=>this.decorations()});return true;
  }
  clearRangeDecorations():void {this.rangeDecorations=[];this.view?.setProps({decorations:()=>this.decorations()});}
  private decorations():DecorationSet {
    const {Decoration,DecorationSet}=this.viewModule!;
    return DecorationSet.create(this.state.doc,this.rangeDecorations.flatMap(item=>{const range=resolveRichRange(this.state.doc,this.revision,item.range);return range&&range.from<range.to?[Decoration.inline(range.from,range.to,{part:'range-decoration','data-range-id':item.id,class:'range-decoration'})]:[];}));
  }
  /** Apply accepted nonoverlapping passages in one undoable transaction; selection maps normally. */
  replaceRanges(replacements:readonly RichRangeReplacement[]):boolean {
    if(!this.editable||!replacements.length)return false;
    const resolved=replacements.map(item=>({item,range:resolveRichRange(this.state.doc,this.revision,item.range)}));
    if(resolved.some(item=>!item.range))return false;
    resolved.sort((a,b)=>a.range!.from-b.range!.from);
    if(resolved.some((item,index)=>index>0&&(item.range!.from<resolved[index-1].range!.to||item.range!.from===resolved[index-1].range!.from)))return false;
    try {
      const tr=closeHistory(this.state.tr);
      for(const {item,range} of resolved.reverse()){
        const normalized=new EditorDocument(item.runs).document.runs;
        let marks=this.state.doc.resolve(range!.from).marks();
        // Nonempty passages inherit the first selected inline node, not its left neighbor.
        if(range!.from<range!.to){let found=false;this.state.doc.nodesBetween(range!.from,range!.to,node=>{if(!found&&node.isInline){marks=node.marks;found=true;}return !found;});}
        const nodes=normalized.flatMap(run=>run.kind==='token'?[richSchema.nodes.token.create({run},null,marks)]:run.text.split('\n').flatMap((text,index)=>[...(index?[richSchema.nodes.hard_break.create()]:[]),...(text?[richSchema.text(text,marks)]:[])]));
        tr.replaceWith(range!.from,range!.to,Fragment.fromArray(nodes));
      }
      validateRichDocument(richSnapshot(tr.doc));
      const accepted=this.commit(tr.setMeta('reason','extension'));
      if(accepted)this.commit(closeHistory(this.state.tr).setMeta('addToHistory',false));
      return accepted;
    }catch{return false;}
  }
  /** Viewport selection bounds, or undefined before hydration. No live DOM Range is exposed. */
  getSelectionRect(): DOMRectReadOnly | undefined {
    if (!this.view) return;
    const {from,to}=this.state.selection, a=this.view.coordsAtPos(from), b=this.view.coordsAtPos(to);
    return new DOMRect(Math.min(a.left,b.left),a.top,Math.max(1,Math.max(a.right,b.right)-Math.min(a.left,b.left)),Math.max(a.bottom,b.bottom)-a.top);
  }
  replaceBookmark(bookmark: EditorBookmark,runs:readonly Run[]):boolean {
    const selection=this.bookmarks.resolve(bookmark,this.revision);
    if (!selection || !this.editable) return false;
    return this.replace(runs,selection.resolve(this.state.doc));
  }
  private get editable() {return !!this.view && !this.disabled && !this.readOnly && !this.composing;}
  private replace(runs:readonly Run[], selection=this.state.selection):boolean {
    if (!this.editable) return false;
    const normalized=new EditorDocument(runs).document.runs;
    const marks=this.state.storedMarks ?? selection.$from.marks();
    const nodes=normalized.flatMap(run => run.kind==='token' ? [richSchema.nodes.token.create({run},null,marks)] : run.text.split('\n').flatMap((text,i)=>[...(i?[richSchema.nodes.hard_break.create()]:[]),...(text?[richSchema.text(text,marks)]:[])]));
    const tr=closeHistory(this.state.tr).setSelection(selection).replaceWith(selection.from,selection.to,Fragment.fromArray(nodes));
    tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(selection.to))));
    return this.commit(tr.setMeta('reason','extension').scrollIntoView());
  }
  private command(name: RichEditorCommand,value?:string): Command | undefined {
    switch(name) {
      case 'bold':return toggleMark(richSchema.marks.strong);
      case 'italic':return toggleMark(richSchema.marks.em);
      case 'paragraph':return setBlockType(richSchema.nodes.paragraph);
      case 'heading':return setBlockType(richSchema.nodes.heading,{level:2});
      case 'bullet-list':case 'ordered-list': {
        const list=richSchema.nodes[name==='bullet-list'?'bullet_list':'ordered_list'];
        for(let i=this.state.selection.$from.depth;i>0;i--) if(this.state.selection.$from.node(i).type===list) return liftListItem(richSchema.nodes.list_item);
        return wrapInList(list);
      }
      case 'undo':return undo;
      case 'redo':return redo;
      case 'link':return (state,dispatch)=>{if(state.selection.empty || value!==undefined&&!safeEditorLink(value))return false;dispatch?.(closeHistory(state.tr).addMark(state.selection.from,state.selection.to,richSchema.marks.link.create({href:value?.trim()})));return true;};
      case 'unlink':return (state,dispatch)=>{if(state.selection.empty||!state.doc.rangeHasMark(state.selection.from,state.selection.to,richSchema.marks.link))return false;dispatch?.(closeHistory(state.tr).removeMark(state.selection.from,state.selection.to,richSchema.marks.link));return true;};
    }
  }
  getCommandState(name:RichEditorCommand):RichCommandState {
    let yes=0,no=0;
    const mark=richSchema.marks[name==='bold'?'strong':name==='italic'?'em':name==='link'?'link':''];
    const type=richSchema.nodes[({paragraph:'paragraph',heading:'heading','bullet-list':'bullet_list','ordered-list':'ordered_list'} as Record<string,string>)[name]];
    const {from,to,empty,$from}=this.state.selection;
    if(mark) {
      if(empty) {yes=mark.isInSet(this.state.storedMarks??$from.marks())?1:0;no=1-yes;}
      else this.state.doc.nodesBetween(from,to,node=>{if(node.isInline) {if(mark.isInSet(node.marks))yes++;else no++;}});
    } else if(type) {
      this.state.doc.nodesBetween(from,to,(node,pos)=>{if(node.isTextblock){
        let matches=node.type===type;
        if(name.endsWith('list')){const point=this.state.doc.resolve(Math.min(pos+1,this.state.doc.content.size));for(let depth=point.depth;depth>0;depth--)if(point.node(depth).type===type)matches=true;}
        if(matches)yes++;else no++;
      }});
    }
    const enabled=this.editable && (name==='undo'?undoDepth(this.state)>0:name==='redo'?redoDepth(this.state)>0:!!this.command(name)?.(this.state));
    return Object.freeze({enabled,active:yes>0&&no===0,mixed:yes>0&&no>0});
  }
  /** Execute against the current selection or an explicit opaque bookmark. */
  execute(name:RichEditorCommand,value?:string,bookmark?:EditorBookmark):boolean {
    if(!this.editable || bookmark&&!this.restoreBookmark(bookmark) || name==='link'&&(!value||!safeEditorLink(value)))return false;
    const command=this.command(name,value); if(!command)return false;
    let accepted=false;
    command(this.state,tr=>{accepted=this.commit(closeHistory(tr).setMeta('reason',name).scrollIntoView());},this.view);
    if(accepted)this.focus(); return accepted;
  }
  undo(){return this.execute('undo');}
  redo(){return this.execute('redo');}
  registerExtension(extension:EditorExtension) {
    if(!extension.provide&&!extension.render&&!extension.open)throw new TypeError('Extension requires provider or picker');
    const dispose=this.registry.register(extension);this.refreshNodeViews();return()=>{dispose();this.refreshNodeViews();};
  }
  registerToken(type:string,render:TokenRenderer,options:TokenOptions={}) {
    if(options.part&&!/^[a-z][a-z0-9-]*$/.test(options.part))throw new TypeError('Invalid token part');
    const registration={render,options:{...options}};this.renderers.set(type,registration);this.refreshNodeViews();
    return()=>{if(this.renderers.get(type)===registration){this.renderers.delete(type);this.refreshNodeViews();}};
  }
  private refreshNodeViews(){this.view?.setProps({nodeViews:this.nodeViews()});}
  openExtension(id:string,options:{tokenId?:string}={}):boolean {
    const extension=this.registry.get(id);if(!extension||!this.editable)return false;
    let token:TokenRun|undefined;let from=this.state.selection.from,to=this.state.selection.to;
    if(options.tokenId!==undefined){this.state.doc.descendants((node,pos)=>{if(node.type.name==='token'&&node.attrs.run.id===options.tokenId){token=node.attrs.run;from=pos;to=pos+node.nodeSize;}});if(!token)return false;}
    this.focus();this.start(extension,'',from,to,true,token);return true;
  }
  /** Convert a token to editable trigger/query text and open its picker as one undoable edit. */
  editToken(tokenId:string,options:{query?:string}={}):boolean {
    if(!this.editable)return false;
    let run:TokenRun|undefined,from=0;
    this.state.doc.descendants((node,pos)=>{if(node.type.name==='token'&&node.attrs.run.id===tokenId){run=node.attrs.run;from=pos;}});
    if(!run)return false;
    const id=this.renderers.get(run.type)?.options.extension,extension=id?this.registry.get(id):undefined;
    if(!extension)return false;
    const query=options.query??'';if(typeof query!=='string')throw new TypeError('Expected a query string');
    this.close();this.committing=true;
    try{
      const text=extension.trigger+query;
      if(!this.replace([{kind:'text',text}],TextSelection.create(this.state.doc,from,from+1)))return false;
      this.focus();this.start(extension,query,from,from+text.length);return true;
    }finally{this.committing=false;}
  }
  private deleteToken(run:TokenRun,from:number){
    const options=this.renderers.get(run.type)?.options;
    if(options?.deleteBehavior==='edit'&&options.extension&&this.registry.has(options.extension))this.editToken(run.id);
    else if(this.replace([],TextSelection.create(this.state.doc,from,from+1)))this.focus();
  }
  private deleteAdjacentToken(direction:'backward'|'forward'):boolean {
    if(!this.editable||!this.state.selection.empty)return false;
    const {$from}=this.state.selection,node=direction==='backward'?$from.nodeBefore:$from.nodeAfter;
    if(node?.type.name!=='token')return false;
    // Consume the deletion even when a cancelable change is vetoed; native deletion
    // must not bypass the application's decision or merely select the atomic node.
    this.deleteToken(node.attrs.run,direction==='backward'?$from.pos-node.nodeSize:$from.pos);return true;
  }
  private nodeViews() {return {token:(node:ReturnType<typeof validateRichDocument>,_view:EditorView,getPos:()=>number|undefined)=>{
    const run=node.attrs.run as TokenRun, registration=this.renderers.get(run.type);
    const interactive=!!registration?.options.extension;
    const dom=this.ownerDocument.createElement(interactive?'button':'span');if(isHTMLButton(dom)){dom.type='button';dom.disabled=this.disabled||this.readOnly||!this.registry.has(registration!.options.extension!);dom.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')event.stopPropagation();if((event.key==='Backspace'||event.key==='Delete')&&!event.isComposing&&this.editable){const pos=getPos();if(pos!==undefined){event.preventDefault();event.stopPropagation();this.deleteToken(run,pos);}}});}dom.contentEditable='false';dom.dataset.token=run.id;dom.setAttribute('part',['token',interactive?'token-interactive':'',registration?.options.part??''].filter(Boolean).join(' '));
    dom.setAttribute('aria-label',run.label);
    const content=this.ownerDocument.createElement('span');content.setAttribute('part','token-content');content.setAttribute('aria-hidden','true');
    try{content.append(registration?registration.render(run):this.ownerDocument.createTextNode(run.text));}catch{content.textContent=run.text;}dom.append(content);
    dom.addEventListener('click',()=>{const extension=registration?.options.extension;if(extension)this.openExtension(extension,{tokenId:run.id});else{const pos=getPos();if(pos!==undefined)this.view?.dispatch(this.state.tr.setSelection(NodeSelection.create(this.state.doc,pos)));}});
    return {dom,ignoreMutation:()=>true,stopEvent:(event:Event)=>interactive&&(event.type==='mousedown'||event.type==='keydown'||event.type==='click')};
  }};}
  private updateViewState(state:EditorState) {
    const view=this.view;
    if(!view)return;
    view.updateState(state);
    if(this.view===view)this.restoreNativeDirection(view);
  }
  // Read native direction independently of ProseMirror's shadow-selection
  // fallback, and accept only an owned range in the current live document.
  private nativeTextSelection(view:EditorView) {
    if(this.view!==view||!this.isConnected||view.dom.ownerDocument!==this.ownerDocument||this.state!==view.state||!this.editable||!view.hasFocus())return;
    const root=view.root;
    if(root.nodeType!==11)return;
    const native=this.ownerDocument.getSelection() as (Selection & {readonly direction?:string;getComposedRanges?:(options:{shadowRoots:ShadowRoot[]})=>StaticRange[]})|null;
    const direction=native?.direction;
    if(!native||typeof native.getComposedRanges!=='function'||(direction!=='forward'&&direction!=='backward'&&direction!=='none'))return;
    try {
      const ranges=native.getComposedRanges({shadowRoots:[root as ShadowRoot]});
      if(ranges.length!==1)return;
      const range=ranges[0];
      if(range.collapsed||!view.dom.contains(range.startContainer)||!view.dom.contains(range.endContainer))return;
      const editableEndpoint=(node:Node)=>{
        let element=node.nodeType===1?node as Element:node.parentElement;
        for(;element&&element!==view.dom;element=element.parentElement)if(element.getAttribute('contenteditable')==='false')return false;
        return element===view.dom;
      };
      if(!editableEndpoint(range.startContainer)||!editableEndpoint(range.endContainer))return;
      const from=view.posAtDOM(range.startContainer,range.startOffset,-1),to=view.posAtDOM(range.endContainer,range.endOffset,-1);
      if(from>=to||from!==view.posAtDOM(range.startContainer,range.startOffset,1)||to!==view.posAtDOM(range.endContainer,range.endOffset,1))return;
      return {native,range,direction,from,to};
    } catch {return;}
  }
  private nativeSelectionBetween(view:EditorView,anchor:ResolvedPos,head:ResolvedPos):TextSelection|null {
    // Returning null keeps the backend's bias and non-text selection handling.
    if(anchor.doc!==view.state.doc||head.doc!==view.state.doc||!anchor.parent.inlineContent||!head.parent.inlineContent)return null;
    const current=this.nativeTextSelection(view);
    if(!current||current.direction==='none'||current.from!==Math.min(anchor.pos,head.pos)||current.to!==Math.max(anchor.pos,head.pos))return null;
    if((anchor.pos>head.pos)===(current.direction==='backward'))return null;
    return new TextSelection(head,anchor);
  }
  private observeNativeSelection(view:EditorView) {
    const owner=view.dom.ownerDocument;
    const reconcile=()=>{
      const state=view.state,selection=state.selection,current=this.nativeTextSelection(view);
      if(!(selection instanceof TextSelection)||!current||current.from!==selection.from||current.to!==selection.to||current.direction===(selection.anchor>selection.head?'backward':'forward'))return;
      // Native direction-only reversals can evade the backend's range check,
      // while native focus can restore a directionless range. Reread after the
      // event, without retaining DOM endpoints; intervening model writes win.
      queueMicrotask(()=>{
        if(this.view!==view||this.ownerDocument!==owner||this.state!==state||view.state!==state)return;
        const latest=this.nativeTextSelection(view);
        if(!latest||latest.from!==selection.from||latest.to!==selection.to||latest.direction===(selection.anchor>selection.head?'backward':'forward'))return;
        if(latest.direction==='none'){this.restoreNativeDirection(view);return;}
        const backward=latest.direction==='backward';
        view.dispatch(state.tr.setSelection(TextSelection.create(state.doc,backward?latest.to:latest.from,backward?latest.from:latest.to)).setMeta('addToHistory',false));
      });
    };
    owner.addEventListener('selectionchange',reconcile);
    this.stopNativeSelection=()=>owner.removeEventListener('selectionchange',reconcile);
  }
  private restoreNativeDirection(view:EditorView) {
    const selection=view.state.selection,current=this.nativeTextSelection(view);
    if(!(selection instanceof TextSelection)||!current||current.from!==selection.from||current.to!==selection.to||typeof current.native.setBaseAndExtent!=='function')return;
    const backward=selection.anchor>selection.head,direction=backward?'backward':'forward';
    if(current.direction===direction)return;
    // View synchronization restores the authoritative model selection. Use the actual
    // matching native endpoints atomically, including opposite-direction opaque
    // bookmarks; no endpoint cache or equivalent DOM-position guess is needed.
    const {range,native}=current;
    native.setBaseAndExtent(backward?range.endContainer:range.startContainer,backward?range.endOffset:range.startOffset,backward?range.startContainer:range.endContainer,backward?range.startOffset:range.endOffset);
  }
  /** Focus the native textbox and restore editor selection; no-op before the asynchronous view mounts. */
  override focus(options?:FocusOptions): void {
    const view=this.view;
    if (!view) return;
    if (options) view.dom.focus(options);
    if(this.view!==view||!this.isConnected)return;
    view.focus();
    this.restoreNativeDirection(view);
  }
  override connectedCallback() {
    super.connectedCallback();const owner=this;
    this.unregister=registerChatEditor(this,{get value(){return owner.value;},get disabled(){return owner.disabled;},get readOnly(){return owner.readOnly;},get composing(){return owner.composing;},focus:options=>owner.focus(options),reportValidity:()=>!owner.session,getSnapshot:()=>({value:owner.value,content:owner.document as unknown as ChatEditorData})});
    if(this.hasUpdated)void this.updateComplete.then(()=>this.mount());
  }
  override disconnectedCallback(){
    this.mountGeneration++;
    const view=this.view,unregister=this.unregister,stopNativeSelection=this.stopNativeSelection;
    // Abort handlers may author a new document. They must not synchronize it
    // through the view whose connection is already being disposed.
    this.view=undefined;this.unregister=undefined;this.stopNativeSelection=undefined;
    // Finish the old Lit connection before abort/destroy callbacks can reconnect.
    try {super.disconnectedCallback();}
    finally {try {unregister?.();stopNativeSelection?.();this.close();} finally {view?.destroy();}}
  }
  protected override firstUpdated(){this.mount();}
  private async mount(retried=false):Promise<void>{
    if(this.view||!this.isConnected)return;
    const generation=++this.mountGeneration,owner=this.ownerDocument;
    const viewModule=await import('prosemirror-view');
    if(generation!==this.mountGeneration||owner!==this.ownerDocument||!this.isConnected||this.view)return;
    this.viewModule=viewModule;
    const {EditorView}=viewModule;
    const mount=this.renderRoot.querySelector<HTMLElement>('.mount')!;mount.replaceChildren();
    if(generation!==this.mountGeneration||owner!==this.ownerDocument||!this.isConnected||this.view)return;
    const view=new EditorView(mount,{state:this.state,dispatchTransaction:tr=>{this.commit(tr);},editable:()=>!this.disabled&&!this.readOnly,
      attributes:this.attributesForEditor(),nodeViews:this.nodeViews(),decorations:()=>this.decorations(),
      createSelectionBetween:(view,anchor,head)=>this.nativeSelectionBetween(view,anchor,head),
      handleKeyDown:(_view,event)=>this.keydown(event),
      handleTripleClick:(view,_pos,event)=>{
        if(this.disabled||this.composing||event.button!==0)return false;
        this.close();view.dom.focus({preventScroll:true});
        const selected=selectAll(view.state,tr=>view.dispatch(tr.setMeta('pointer',true)),view);
        // ProseMirror's readonly DOM-selection ownership check does not cross shadow roots.
        if(selected&&this.readOnly){
          this.ownerDocument.getSelection()?.setBaseAndExtent(view.dom,0,view.dom,view.dom.childNodes.length);
        }
        return selected;
      },
      handleDrop:()=>true,
      handleDOMEvents:{copy:(_view,event)=>this.copy(event as ClipboardEvent),cut:(_view,event)=>this.copy(event as ClipboardEvent),paste:(_view,event)=>this.paste(event as ClipboardEvent),beforeinput:(_view,event)=>{const input=event as InputEvent;if(input.cancelable&&!input.isComposing&&(input.inputType==='deleteContentBackward'||input.inputType==='deleteContentForward')&&this.deleteAdjacentToken(input.inputType==='deleteContentBackward'?'backward':'forward')){input.preventDefault();return true;}return false;},input:(_view,event)=>{dispatchDraftInput(this,{value:this.draftValue,isComposing:this.composing,inputType:(event as InputEvent).inputType??''});return false;},
        compositionstart:()=>{this.close();this.notify();return false;},compositionend:()=>{setTimeout(()=>{if(this.deferred){const doc=this.deferred;this.deferred=undefined;this.document=doc;}this.notify();},0);return false;},
        keydown:(_view,event)=>{if((event as KeyboardEvent).key==='Enter'&&!(event as KeyboardEvent).ctrlKey&&!(event as KeyboardEvent).metaKey)event.stopPropagation();return false;}}
    });
    if(generation!==this.mountGeneration||owner!==this.ownerDocument||view.dom.ownerDocument!==owner||!this.isConnected||this.view){view.destroy();return;}
    // One authoritative renderer write wins without publishing the stale view.
    // Repeated render-time writes must not create an unbounded mount loop.
    if(this.state!==view.state){
      view.destroy();
      if(retried)throw new Error('Token renderers must settle the editor document before mounting.');
      this.requestUpdate();await this.updateComplete;
      if(generation===this.mountGeneration&&owner===this.ownerDocument)await this.mount(true);
      return;
    }
    this.view=view;this.observeNativeSelection(view);this.notify();
  }
  private copy(event:ClipboardEvent):boolean {
    if(this.state.selection.empty||!event.clipboardData)return false;
    const slice=this.state.selection.content();
    if(!writeEditorClipboard(event.clipboardData,clipboardRuns(slice),slice.toJSON(),clipboardHTML(slice)))return false;
    event.preventDefault();
    if(event.type==='cut'&&this.editable){this.close();this.commit(closeHistory(this.state.tr).deleteSelection().setMeta('reason','cut').scrollIntoView());}
    return true;
  }
  private paste(event:ClipboardEvent):boolean {
    event.preventDefault();if(!this.editable||!event.clipboardData)return true;
    const data=event.clipboardData,structured=readEditorClipboard(data),used=new Set<string>();
    this.state.doc.descendants(node=>{if(node.type.name==='token')used.add(node.attrs.run.id);});
    const importToken=(token:TokenRun,context:TokenImportContext)=>{const handler=this.renderers.get(token.type)?.options.importToken;return handler?handler(token,context):token;};
    let slice;
    for(const run of structured?.runs??[])if(run.kind==='token')used.add(run.id);
    if(structured)try{slice=structured.rich===undefined?runsSlice(importClipboardRuns(structured.runs,type=>this.renderers.has(type),used,importToken)):importRichClipboard(structured.rich,type=>this.renderers.has(type),used,importToken);}catch{/* Invalid private data falls back to readable text. */}
    else slice=externalRichClipboard(data.getData('text/html'),this.ownerDocument);
    try{
      slice??=runsSlice([{kind:'text',text:data.getData('text/plain')}],this.state.storedMarks??this.state.selection.$from.marks());
      this.close();this.commit(closeHistory(this.state.tr).replaceSelection(slice).setMeta('reason','paste').scrollIntoView());
    }catch{/* A fallback or final document exceeding schema limits leaves history/content unchanged. */}
    return true;
  }
  private draftText():string {
    if(!this.view)return this.value;
    const tokens=new Map<string,string>();this.state.doc.descendants(node=>{if(node.type.name==='token')tokens.set(node.attrs.run.id,node.attrs.run.text);});
    const read=(node:Node):string=>{
      if(node.nodeType===3)return node.textContent??'';
      const element=node as HTMLElement;
      if(element.dataset?.token)return tokens.get(element.dataset.token)??element.textContent??'';
      if(node.nodeName==='BR')return element.classList.contains('ProseMirror-trailingBreak')?'':'\n';
      return [...node.childNodes].map((child,index)=>(index&&/^(P|DIV|H[1-3]|LI|UL|OL)$/.test(child.nodeName)?'\n':'')+read(child)).join('');
    };
    return read(this.view.dom);
  }
  private attributesForEditor(){return {class:'editor',part:'control',role:'textbox','aria-label':this.label,'aria-multiline':'true','aria-readonly':String(this.readOnly),'aria-disabled':String(this.disabled),tabindex:this.disabled?'-1':'0','aria-describedby':'description rich-hint'};}
  protected override updated(changed:PropertyValues){if(changed.has('disabled')||changed.has('readOnly')||changed.has('label')){if(this.disabled||this.readOnly)this.close();this.view?.setProps({attributes:this.attributesForEditor(),editable:()=>!this.disabled&&!this.readOnly,nodeViews:this.nodeViews()});this.notify();}}
  private commit(tr:Transaction):boolean {
    const previous=this.state;
    if(tr.docChanged&&(this.disabled||this.readOnly))return false;
    const next=previous.apply(tr);
    if(tr.docChanged){
      const proposed=richSnapshot(next.doc);
      validateRichDocument(proposed);
      const outcome=dispatchChange(this,{
        previous:richSnapshot(previous.doc),proposed,reason:tr.getMeta('reason')??'input',
        getRevision:()=>this.authorVersion,
        stage:()=>{this.state=next;},
        rollback:()=>{this.state=previous;this.updateViewState(previous);this.notify();},
        canCommit:()=>this.isConnected&&!this.disabled&&!this.readOnly,
        commit:()=>{this.version++;this.updateViewState(this.state);if(!this.committing)this.detect();this.notify();},
      });
      return outcome==='committed';
    }
    this.state=next;this.updateViewState(next);
    if(!this.committing)this.detect();this.notify();return true;
  }
  private notify(){this.dispatchEvent(new CustomEvent('en-editor-state',{bubbles:true,composed:true}));}
  private signature(){return `${this.revision}:${this.state.selection.from}:${this.state.selection.to}`;}
  private detect(){
    if(!this.editable||!this.view?.hasFocus()||this.committing)return;
    const {from,to,$from,empty}=this.state.selection;
    if(this.session?.manual&&this.session.revision===this.revision)return;
    if(!empty){this.close();return;}if(this.dismissed===this.signature())return;
    // Stop at the last atom within the current textblock; never match across a block.
    let start=$from.start(),before='';
    $from.parent.forEach((node,offset)=>{const pos=$from.start()+offset;if(pos>=from)return;if(node.isText)before+=(node.text??'').slice(0,from-pos);else{before='';start=pos+node.nodeSize;}});
    const match=this.registry.match(before);
    if(!match){this.close();return;}
    if(this.session?.extension===match.extension&&this.session.query===match.query&&this.session.revision===this.revision&&this.session.to===to)return;
    this.start(match.extension,match.query,start+match.from,to);
  }
  private start(extension:EditorExtension,query:string,from:number,to:number,manual=false,token?:TokenRun){
    this.close();const session:Session={extension,query,from,to,manual,token,revision:this.revision,controller:new AbortController(),choices:[],active:0,loading:!!extension.provide,error:false,external:!!extension.open};
    this.session=session;this.refresh();this.track(true);this.notify();
    if(extension.open){try{extension.open(this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}return;}
    if(extension.provide)this.queryTask.start(query,extension.provide,choices=>{if(this.session===session&&!session.external){session.choices=choices;session.loading=false;this.refresh();}},()=>{if(this.session===session){session.loading=false;session.error=true;this.refresh();}},session.controller);
  }
  private valid(session:Session){return this.session===session&&session.revision===this.revision&&!session.controller.signal.aborted&&this.isConnected&&this.editable;}
  private pickerSession(session:Session):EditorPickerSession {return {query:session.query,token:session.token,signal:session.controller.signal,getAnchorRect:()=>this.pickerRect(session),openPicker:open=>{if(!this.valid(session))return false;session.external=true;this.popup?.hidePopover();this.refresh();try{open(this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}return true;},commit:choice=>this.complete(session,choice),cancel:()=>{if(this.session!==session)return;this.close();this.restoreSessionFocus(session);this.dismissed=this.signature();}};}
  private restoreSessionFocus(session:Session){
    const button=session.token?[...this.view?.dom.querySelectorAll<HTMLElement>('button[data-token]')??[]].find(node=>node.dataset.token===session.token!.id):undefined;
    if(button&&!this.disabled&&!this.readOnly)button.focus();else this.focus();
  }
  private pickerRect(session:Session):DOMRectReadOnly {
    if(!this.valid(session)||!this.view)return this.getBoundingClientRect();
    const token=session.token&&[...this.view.dom.querySelectorAll<HTMLElement>('[data-token]')].find(node=>node.dataset.token===session.token!.id);
    if(token)return token.getBoundingClientRect();
    const caret=this.caretRect(session.to);
    if(session.manual)return caret;
    const point=this.view.domAtPos(session.from,1);
    let trigger=this.caretRect(session.from);
    if(point.node.nodeType===3){
      const text=point.node.textContent??'',range=this.ownerDocument.createRange();
      range.setStart(point.node,point.offset);range.setEnd(point.node,Math.min(text.length,point.offset+(text.codePointAt(point.offset)!>0xffff?2:1)));
      const rect=range.getClientRects()[0];if(rect?.height)trigger=rect;
    }
    return editorTriggerAnchor(this.view.dom,trigger,caret);
  }
  private caretRect(position:number):DOMRectReadOnly {
    const rect=this.view!.coordsAtPos(position);return new DOMRect(rect.left,rect.top,Math.max(1,rect.right-rect.left),rect.bottom-rect.top);
  }
  private complete(session:Session,choice:EditorChoice){
    if(!this.valid(session))return false;this.committing=true;
    try{
      if(choice.action&&!dispatchAction(this,{action:choice.action,data:choice.data===undefined?undefined:snapshotEditorData(choice.data)},{cancelable:true}))return false;
      if(!this.valid(session))return false;
      const selection=TextSelection.create(this.state.doc,session.from,session.to);
      const result=this.replace(choice.insert??[],selection);
      if(result){this.close();this.focus();}return result;
    }finally{this.committing=false;}
  }
  private choose(session:Session,choice:EditorChoice){if(!this.valid(session))return;if(session.extension.select){try{session.extension.select(choice,this.pickerSession(session));}catch(error){if(this.session===session)this.close();else session.controller.abort();throw error;}}else this.complete(session,choice);}
  private keydown(event:KeyboardEvent):boolean {
    if(event.isComposing||this.composing)return false;
    if(event.altKey&&event.key==='F10'){event.preventDefault();event.stopPropagation();this.dispatchEvent(new CustomEvent('en-toolbar-request',{cancelable:true}));return true;}
    const s=this.session;
    if(s){
      if(event.key==='Escape'){event.stopPropagation();this.pickerSession(s).cancel();return true;}
      if(event.key==='Tab'){if(!s.extension.render)this.close();return false;}
      if(s.extension.render&&(event.key==='Enter'||event.key==='ArrowDown')&&this.view?.hasFocus()){event.stopPropagation();(this.popup?.querySelector<HTMLElement>('[data-picker-focus],input,button,[tabindex="0"]'))?.focus();return true;}
      if(s.extension.render)return false;
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){const length=s.choices.length;if(length)s.active=(s.active+(event.key==='ArrowDown'?1:-1)+length)%length;this.refresh();return true;}
      if(event.key==='Enter'){event.stopPropagation();const choice=s.choices[s.active];if(choice)this.choose(s,choice);return true;}
    }
    if((event.key==='Enter'||event.key===' ')&&this.state.selection instanceof NodeSelection&&this.state.selection.node.type.name==='token'){const run=this.state.selection.node.attrs.run as TokenRun,extension=this.renderers.get(run.type)?.options.extension;if(extension){event.stopPropagation();return this.openExtension(extension,{tokenId:run.id});}}
    if((event.key==='Backspace'||event.key==='Delete')&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&this.deleteAdjacentToken(event.key==='Backspace'?'backward':'forward'))return true;
    return false;
  }
  private close(){this.queryTask.cancel();if(!this.session)return;this.session.controller.abort();this.session=undefined;this.track(false);if(this.popup?.matches(':popover-open'))this.popup.hidePopover();this.refresh();this.notify();}
  private refresh(){this.sessionVersion++;void this.updateComplete.then(()=>{const s=this.session,popup=this.popup;if(s&&!s.external&&this.isConnected&&popup){if(!popup.matches(':popover-open'))popup.showPopover();this.position();}if(this.view){const s=this.session;this.view.dom.setAttribute('aria-expanded',String(!!s&&!s.external));if(s&&!s.extension.render&&s.choices.length)this.view.dom.setAttribute('aria-activedescendant',`rich-choice-${s.active}`);else this.view.dom.removeAttribute('aria-activedescendant');if(s){this.view.dom.setAttribute('aria-controls','rich-popup');this.view.dom.setAttribute('aria-haspopup',s.extension.render?'dialog':'listbox');}else {this.view.dom.removeAttribute('aria-controls');this.view.dom.removeAttribute('aria-haspopup');}}});}
  private outside=(event:Event)=>{if(!this.session?.external&&!event.composedPath().includes(this))this.close();};
  private stopTracking?:()=>void;
  private track(on:boolean){
    this.stopTracking?.();this.stopTracking=undefined;if(!on){cancelAnimationFrame(this.frame);return;}
    const owner=this.ownerDocument,view=owner.defaultView;if(!view)return;
    const viewport=view.visualViewport;
    owner.addEventListener('pointerdown',this.outside,true);owner.addEventListener('focusin',this.outside,true);
    view.addEventListener('scroll',this.position,true);view.addEventListener('resize',this.position);
    viewport?.addEventListener('resize',this.position);viewport?.addEventListener('scroll',this.position);
    const resize=observeEditorPopup(this.view?.dom,this.popup,this.position);
    this.stopTracking=()=>{
      owner.removeEventListener('pointerdown',this.outside,true);owner.removeEventListener('focusin',this.outside,true);
      view.removeEventListener('scroll',this.position,true);view.removeEventListener('resize',this.position);
      viewport?.removeEventListener('resize',this.position);viewport?.removeEventListener('scroll',this.position);
      resize?.disconnect();cancelAnimationFrame(this.frame);
    };
  }
  private position=()=>{cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{const popup=this.popup,editor=this.view?.dom,s=this.session;if(popup&&editor&&s&&!s.external)positionEditorPopup(popup,editor,this.pickerRect(s),!!s.extension.render,s.token?undefined:this.caretRect(s.to));});};
  protected override render(){
    this.initialMarkup??=richHTML(this.state.doc);const s=this.session;const messages=editorMessages(this.effectiveMessages);
    return staticHtml`<span class="label" part="label"><slot name="label">${this.label}</slot></span><div class="mount"><div class="editor" part="control" role="textbox" aria-label=${this.label} aria-multiline="true" aria-readonly="true" aria-describedby="description rich-hint">${unsafeStatic(this.initialMarkup)}</div></div>${descriptionTemplate(this.description)}<span id="rich-hint" class="hint">${messages.instructions.richText} ${s&&!s.external?(s.extension.render?messages.instructions.picker:messages.suggestions.keyboardHint):''}</span><div class="popup" part="popup" id="rich-popup" popover="manual" role=${s?.extension.render?'dialog':'listbox'} aria-label=${s?.extension.label??messages.suggestions.label} @keydown=${(event:KeyboardEvent)=>{if(this.keydown(event))event.preventDefault();}}>${s?s.extension.render?s.extension.render(this.pickerSession(s)):html`${s.loading?html`<span role="status">${messages.suggestions.loading}</span>`:s.error?html`<span role="status">${messages.suggestions.unavailable}</span>`:!s.choices.length?html`<span role="status">${messages.suggestions.empty}</span>`:s.choices.map((choice,i)=>html`<div class="option" part="option" id=${`rich-choice-${i}`} role="option" aria-selected=${String(i===s.active)} aria-label=${choice.label} aria-describedby=${choice.description?`rich-choice-description-${i}`:nothing} @pointerdown=${(event:PointerEvent)=>event.preventDefault()} @click=${()=>this.choose(s,choice)}>${s.extension.renderOption?s.extension.renderOption(choice):choice.label}${choice.description?html`<span class="description" id=${`rich-choice-description-${i}`}>${choice.description}</span>`:nothing}</div>`)}`:nothing}</div>`;
  }
}
declare global {interface HTMLElementTagNameMap {'en-rich-text-editor':EnRichTextEditor;}}
