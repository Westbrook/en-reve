import { connectionDocument } from './internal/element-registry.js';
import { ScopedContext } from './internal/context-consumer.js';
import { editorMessagesContext, mergeMessageOverrides } from './messages-context.js';
import { EditorAssociation } from './internal/editor-association.js';
import { composedContains, focusedElement } from './dialog/focus.js';
import { richEditorCommandContext, isRichEditorCommandHost, type RichEditorCommandHost } from './editor/context.js';
import {html,nothing,css,unsafeCSS,type PropertyValues} from 'lit';
import {editorMessages, type EditorMessages} from './editor/messages.js';
import {EnElement} from './internal/en-element.js';
import type {RichEditorCommand} from './rich-text-editor.js';
import type {EditorBookmark} from '@en-reve/primitives/interactions/editor-extensions.js';
import {defaultCSSValue} from '@en-reve/tokens/defaults.js';
import {foundationStyles,blockHostStyles} from '@en-reve/styles/foundations.js';
/**
 * Formatting presentation for a rich editor; commands and history belong to the editor.
 * @tagname en-editor-toolbar
 * @slot - Custom toolbar replacing defaults; compose en-toolbar and editor command/bookmark APIs.
 * @csspart base - Toolbar surface, including contextual placement.
 * @csspart toolbar - Inner en-toolbar host.
 * @csspart command - Default en-button command hosts.
 * @csspart command-icon - Decorative en-icon hosts for formatting commands.
 * @csspart link-editor - Link field and apply/cancel controls.
 * @cssprop --en-editor-toolbar-background - Opaque toolbar surface.
 * @cssprop --en-editor-toolbar-gap - Space between controls.
 */
export class EnEditorToolbar extends EnElement {
  private readonly messageContext = new ScopedContext(this, editorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties={for:{reflect:true},editor:{attribute:false},mode:{reflect:true},placement:{reflect:true},label:{useDefault:true},messages:{attribute:false},commands:{attribute:false},visible:{state:true},linkEditing:{state:true},error:{state:true},stateVersion:{state:true}};
  static override styles=[foundationStyles,blockHostStyles,css`
    :host{display:block;min-inline-size:0;}
    :host([mode=contextual]){display:contents;}
    .base{box-sizing:border-box;background:var(--en-editor-toolbar-background,var(--en-color-surface));color:var(--en-color-text);padding:var(--en-space-2);border:var(--en-border-width,1px) solid var(--en-color-line);border-radius:var(--en-radius-control);}
    .base[popover]{position:fixed;margin:0;inset:auto;max-inline-size:calc(100vw - 16px);max-block-size:50dvh;overflow:auto;box-shadow:var(--en-shadow-overlay,0 4px 16px #0003);}
    en-toolbar::part(base){flex-wrap:wrap;gap:var(--en-editor-toolbar-gap,var(--en-space-1));}
    .link-editor{display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-2);padding-block-start:var(--en-space-2);}
    en-text-field{flex:1;min-inline-size:min(12rem,100%);}.error{color:var(--en-color-danger-text,${unsafeCSS(defaultCSSValue('--en-color-danger-text')!)});}
    @media(forced-colors:active){.base{background:Canvas;color:CanvasText;border-color:CanvasText;}}
  `];
  /** Same-tree rich editor ID. */ declare for:string;
  /** Explicit cross-root association. */ declare editor:RichEditorCommandHost|undefined;
  /** persistent (default) or contextual selection surface. */ declare mode:'persistent'|'contextual';
  /** auto docks on narrow/touch viewports; floating or docked overrides policy. */ declare placement:'auto'|'floating'|'docked';
  /** Accessible toolbar name. */ declare label:string;
  /** Partial translations for default commands and link UI; replace the object to update. */ declare messages:EditorMessages | undefined;
  /** Ordered command subset; custom slot contents can replace it entirely. */ declare commands:readonly RichEditorCommand[];
  private declare visible:boolean;private declare linkEditing:boolean;private declare error:string;private declare stateVersion:number;
  private bound?:RichEditorCommandHost;private bookmark?:EditorBookmark;
  private dismissed='';private linkSelection='';private frame=0;private focusConnection=0;
  private localFocusRoot?:ShadowRoot;private focusEvent?:Event;
  constructor(){super();this.for='';this.mode='persistent';this.placement='auto';this.label='Formatting';this.commands=['bold','italic','heading','paragraph','bullet-list','ordered-list','link','unlink','undo','redo'];this.visible=false;this.linkEditing=false;this.error='';this.stateVersion=0;}
  private get base(){return this.renderRoot.querySelector<HTMLElement>('.base');}
  override connectedCallback(){super.connectedCallback();this.ownerDocument.addEventListener('focusin',this.focusChanged,true);const root=this.focusRoot;if(root?.nodeType===11){this.localFocusRoot=root as ShadowRoot;this.localFocusRoot.addEventListener('focusin',this.focusChanged,true);}this.ownerDocument.addEventListener('pointerdown',this.outside,true);this.bind();}
  override disconnectedCallback(){this.focusConnection++;this.focusEvent=undefined;this.localFocusRoot?.removeEventListener('focusin',this.focusChanged,true);this.localFocusRoot=undefined;this.unbind();connectionDocument(this).removeEventListener('focusin',this.focusChanged,true);connectionDocument(this).removeEventListener('pointerdown',this.outside,true);this.track(false);super.disconnectedCallback();}
  protected override updated(changed:PropertyValues){this.bind();if(changed.has('visible')||changed.has('mode')){if(this.mode==='contextual'&&this.visible){if(this.base&&!this.base.matches(':popover-open'))this.base.showPopover();this.track(true);this.position();}else{if(this.base?.matches(':popover-open'))this.base.hidePopover();this.track(false);}}if(changed.has('placement'))this.position();}
  private unbind(){this.bound?.removeEventListener('en-editor-state',this.changed);this.bound?.removeEventListener('en-toolbar-request',this.focusRequested);this.bound=undefined;}
  private readonly association = new EditorAssociation(this, richEditorCommandContext, isRichEditorCommandHost, target => {this.unbind();this.dismissContext();this.bound=target;target?.addEventListener('en-editor-state',this.changed);target?.addEventListener('en-toolbar-request',this.focusRequested);this.changed();this.requestUpdate();});
  private bind(){this.association.refresh();}
  private focusChanged=(event:Event)=>{
    // One event may reach both the document and the containing shadow root.
    if(this.focusEvent===event)return;this.focusEvent=event;const connection=this.focusConnection;
    queueMicrotask(()=>{if(this.focusEvent===event)this.focusEvent=undefined;if(!this.isConnected||this.focusConnection!==connection)return;if(this.mode==='contextual'&&!this.containsFocus()&&!this.editorHasFocus()){this.dismissContext();}else this.changed();});
  };
  private resetLink(){this.linkEditing=false;this.linkSelection='';this.error='';}
  private dismissContext(){this.dismissed=this.bound?.selectionKey??'';this.visible=false;this.resetLink();this.bookmark=undefined;}
  private outside=(event:PointerEvent)=>{
    if(this.mode!=='contextual'||!this.visible)return;
    const path=event.composedPath();if(path.includes(this))return;
    // Clicking back into the editor abandons a pending link; normal selection gestures still work.
    if(this.linkEditing||!this.bound||!path.includes(this.bound))this.dismissContext();
  };
  private get focusRoot():Document|ShadowRoot|undefined {const root=this.getRootNode();return root.nodeType===9||root.nodeType===11&&'host' in root?root as Document|ShadowRoot:undefined;}
  private containsFocus(){if(!this.isConnected)return false;const root=this.focusRoot;return !!root&&composedContains(this,focusedElement(root));}
  private editorHasFocus(){return !!this.bound?.matches(':focus-within');}
  private changed=()=>{
    const editor=this.bound;if(!editor)return;this.stateVersion++;
    // A selection-only transaction can refresh the bookmark. Author/document writes invalidate an open link editor.
    if(this.linkEditing&&(this.bookmark?.revision!==editor.revision||this.mode==='contextual'&&this.linkSelection!==editor.selectionKey))this.resetLink();
    if(!this.linkEditing)this.bookmark=editor.captureBookmark();
    if(this.mode==='contextual')this.visible=editor.hasSelection&&!editor.disabled&&!editor.readOnly&&!editor.composing&&!editor.extensionOpen&&this.dismissed!==editor.selectionKey&&(this.editorHasFocus()||this.containsFocus());
    if(this.mode==='contextual'&&!this.visible)this.resetLink();
    if(this.visible)this.position();
  };
  private focusRequested=(event:Event)=>{if(event.defaultPrevented||this.mode==='contextual'&&!this.visible)return;event.preventDefault();this.focus({focusVisible:true});};
  /** Focus the first available control after rendering, preserving native focus options. */
  override focus(options?: FocusOptions): void {
    const document=this.ownerDocument,origin=focusedElement(document),root=this.focusRoot,rootOrigin=root?focusedElement(root):null,connection=this.focusConnection;
    const available=()=>this.isConnected&&this.focusConnection===connection&&this.ownerDocument===document&&focusedElement(document)===origin&&(!root||this.focusRoot===root&&focusedElement(root)===rootOrigin)&&(this.mode!=='contextual'||this.visible);
    const authored=()=>this.querySelector<HTMLElement>('en-button:not([disabled]),button:not(:disabled),[tabindex="0"]');
    void (async()=>{
      // Initial association can schedule a follow-up render for command state.
      while(!await this.updateComplete){if(!available())return;}
      if(!available())return;
      const first=authored()??this.renderRoot.querySelector<HTMLElement>('en-button:not([disabled])');
      first?.focus(options);
    })();
  }
  private run=(command:RichEditorCommand)=>{
    if(command==='link'){this.linkEditing=true;this.linkSelection=this.bound?.selectionKey??'';this.error='';void this.updateComplete.then(()=>this.renderRoot.querySelector<HTMLElement>('en-text-field')?.focus());return;}
    if(this.bookmark)this.bound?.execute(command,undefined,this.bookmark);
  };
  private cancel=()=>{this.linkEditing=false;this.error='';if(this.mode==='contextual'){this.dismissed=this.bound?.selectionKey??'';this.visible=false;}if(this.bookmark)this.bound?.restoreBookmark(this.bookmark);};
  private keydown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.cancel();}};
  private apply=()=>{const field=this.renderRoot.querySelector<HTMLElement & {value:string}>('en-text-field');if(this.bookmark&&this.bound?.execute('link',field?.value,this.bookmark)){this.linkEditing=false;this.error='';}else this.error='invalid-link';};
  private track(on:boolean){const view=this.ownerDocument.defaultView;if(!view)return;const method=on?'addEventListener':'removeEventListener';view[method]('scroll',this.position,true);view[method]('resize',this.position);view.visualViewport?.[method]('resize',this.position);view.visualViewport?.[method]('scroll',this.position);if(!on)cancelAnimationFrame(this.frame);}
  private position=()=>{if(this.mode!=='contextual'||!this.visible)return;cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>{
    const base=this.base,editor=this.bound,rect=editor?.getSelectionRect();if(!base||!editor||!rect)return;
    const view=this.ownerDocument.defaultView!,vv=view.visualViewport,left=vv?.offsetLeft??0,top=vv?.offsetTop??0,width=vv?.width??view.innerWidth,height=vv?.height??view.innerHeight;
    const docked=this.placement==='docked'||this.placement==='auto'&&(width<600||view.matchMedia('(pointer:coarse)').matches);
    const bounds=editor.getBoundingClientRect();base.dataset.placement=docked?'docked':'floating';
    base.style.width=docked?`${Math.min(width-16,bounds.width)}px`:'';
    base.style.left=`${Math.max(left+8,Math.min(docked?bounds.left:rect.left,left+width-base.offsetWidth-8))}px`;
    base.style.visibility=rect.bottom<top||rect.top>top+height?'hidden':'';
    const preferred=docked?(bounds.bottom+base.offsetHeight+16<=top+height?bounds.bottom+8:bounds.top-base.offsetHeight-8>=top?bounds.top-base.offsetHeight-8:rect.top>top+height/2?top+8:top+height-base.offsetHeight-8):rect.top-base.offsetHeight-8;
    base.style.top=`${Math.max(top+8,Math.min(preferred<top+8&&!docked?rect.bottom+8:preferred,top+height-base.offsetHeight-8))}px`;
  });};
  protected override render(){
    const messages=editorMessages(this.effectiveMessages);const labels=messages.commands;
    // Keep generated controls mounted; authored slot content owns its presentation.
    return html`<div class="base" part="base" popover=${this.mode==='contextual'?'manual':nothing} @keydown=${this.keydown}>
      <slot><en-toolbar part="toolbar" label=${this.label}>${this.commands.map(command=>{const state=this.bound?.getCommandState(command);return html`<en-button part="command" size="small" variant="secondary" .disabled=${!state?.enabled} aria-pressed=${['undo','redo','link','unlink'].includes(command)?nothing:state?.mixed?'mixed':String(!!state?.active)} @click=${()=>this.run(command)}><en-icon part="command-icon" slot="prefix" name=${command} size="inherit"></en-icon>${labels[command]}</en-button>`;})}</en-toolbar></slot>
      ${this.linkEditing?html`<div class="link-editor" part="link-editor"><en-text-field size="small" label=${messages.link.label} placeholder=${messages.link.placeholder} @keydown=${(event:KeyboardEvent)=>{if(event.key==='Enter'){event.preventDefault();this.apply();}}}></en-text-field><en-button size="small" @click=${this.apply}>${messages.link.applyLabel}</en-button><en-button size="small" variant="secondary" @click=${this.cancel}>${messages.link.cancelLabel}</en-button></div>${this.error?html`<p class="error" role="alert">${messages.link.invalid}</p>`:nothing}`:nothing}
    </div>`;
  }
}
declare global {interface HTMLElementTagNameMap {'en-editor-toolbar':EnEditorToolbar;}}
