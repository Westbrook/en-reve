import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/chat-composer.js';
import '@en-reve/elements/define/chat-message.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/color-picker.js';
import '@en-reve/elements/define/dialog.js';
import '@en-reve/elements/define/editor-trigger.js';
import '@en-reve/elements/define/file-upload.js';
import '@en-reve/elements/define/icon.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/swatch.js';
import '@en-reve/elements/define/tab.js';
import '@en-reve/elements/define/tab-panel.js';
import '@en-reve/elements/define/tabs.js';
import '@en-reve/elements/define/textarea.js';
import '@en-reve/elements/define/token-editor.js';
import { html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { parseColor, serializeColor, colorPaint, type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EditorExtension, EditorPickerSession } from '@en-reve/elements/editor-extensions.js';
import type { TokenRun } from '@en-reve/elements/token-editor.js';

export const colorTokenStyles = css\`
  en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){
    background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.25rem) * 2) calc(var(--en-color-slider-checker-size,.25rem) * 2);
  }
  en-token-editor::part(color-swatch-paint),en-rich-text-editor::part(color-swatch-paint){display:block;inline-size:100%;block-size:100%;border-radius:inherit}
\`;
export const wideColor = 'color(display-p3 1 0.2 0.1 / 0.65)';
/** This application validates color payloads; the shared editor stays domain-independent. */
export function colorTokenRenderer(token: TokenRun): Node {
  const raw = (token.data as {color?: unknown} | undefined)?.color;
  const value = typeof raw === 'string' ? parseColor(raw) : undefined;
  if (!value) return document.createTextNode(token.text);
  const swatch = document.createElement('span');
  const paint = colorPaint(value, CSS.supports('color', 'color(display-p3 1 0 0)'));
  const fill = document.createElement('span');
  fill.part.add('color-swatch-paint');
  fill.style.backgroundColor = paint.fallback;
  fill.style.backgroundColor = paint.value;
  swatch.append(fill);
  swatch.part.add('color-swatch'); swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}
export function commitColorToken(session: EditorPickerSession, raw: string): boolean {
  const parsed = parseColor(raw); if (!parsed) return false;
  const color = serializeColor(parsed);
  return session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id ?? crypto.randomUUID(),type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]});
}
/** One application-owned picker session used unchanged by the rich and token editors. */
export const wideColorExtension: EditorExtension = {
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => {
    const existing = (session.token?.data as {color?: unknown} | undefined)?.color;
    const parsed = parseColor(session.query) ?? (typeof existing === 'string' ? parseColor(existing) : undefined) ?? parseColor(wideColor)!;
    return html\`\${keyed(session.signal, html\`<div part="color-session">
      <en-color-picker part="color-picker" exportparts="base:color-base,summary:color-summary,formats:color-formats,channels:color-channels,preview:color-preview,preview-frame:color-preview-frame,space:color-space,gamut-message:color-gamut,conversion:color-conversion,plane:color-plane,plane-thumb:color-plane-thumb,plane-axes:color-plane-axes" label="Editor color" format="rgb" show-hex editable-channels alpha plane data-picker-focus .value=\${serializeColor(parsed)} @en-change=\${(event: Event) => event.stopPropagation()}></en-color-picker>
      <div part="color-actions"><en-button variant="secondary" @click=\${() => session.cancel()}>Cancel</en-button><en-button @click=\${(event: Event) => {
        const picker = (event.currentTarget as HTMLElement).closest('[part="color-session"]')!.querySelector<EnColorPicker>('en-color-picker')!;
        if (picker.reportValidity()) commitColorToken(session, picker.value);
      }}>Apply color</en-button></div>
    </div>\`)}\`;
  },
};

import { LitElement } from 'lit';
import type {EnTokenEditor,DocumentValue} from '@en-reve/elements/token-editor.js';
import type { EditorChoice } from '@en-reve/elements/editor-extensions.js';
import { normalizeHexColor } from '@en-reve/elements/color-picker.js';
import type {ChatEditorSnapshot} from '@en-reve/elements/chat-composer.js';
/** All domain concepts are defined in this application fixture, outside the editor. */
export class ComposableChatDemo extends LitElement {
 static override properties={status:{state:true},sent:{state:true},colorMode:{state:true}};
 static override styles=[colorTokenStyles, css\`
 en-token-editor::part(color-session){
  --color-session-padding:var(--en-space-4,1rem);
  --color-popup-padding:var(--en-option-list-padding,var(--en-overlay-padding,var(--en-space-2,.5rem)));
  display:grid;gap:var(--en-space-4,1rem);padding:var(--color-session-padding);container:chat-color / inline-size
 }
 en-token-editor::part(color-tab-list){
  position:sticky;inset-block-start:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-end:var(--en-border-width,1px) solid var(--en-color-line);
  margin-block-start:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding:var(--color-session-padding) calc(var(--color-session-padding) + var(--color-popup-padding));
  padding-block-start:var(--en-space-2,.5rem);
  padding-block-end:0;
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @media(forced-colors:active){en-token-editor::part(color-tab-list),en-token-editor::part(color-actions){background:Canvas}}
 en-token-editor::part(color-tab){border-block-end:0}
 en-token-editor::part(chat-color-picker){--en-color-picker-inline-size:100%}
 en-token-editor::part(chat-color-base){grid-template-areas:"summary" "formats" "channels"}
 en-token-editor::part(chat-color-summary){grid-area:summary;align-items:stretch}
 en-token-editor::part(chat-color-formats){grid-area:formats}
 en-token-editor::part(chat-color-channels){grid-area:channels;align-content:start}
 en-token-editor::part(chat-color-preview-frame){position:relative;align-self:stretch;inline-size:var(--en-color-picker-preview-size,3rem);min-block-size:3rem}
 en-token-editor::part(chat-color-preview){position:absolute;inset:0;inline-size:100%;block-size:100%;aspect-ratio:auto;min-block-size:3rem}
 en-token-editor::part(color-actions){
  display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--en-space-2,.5rem);
  position:sticky;inset-block-end:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-start:var(--en-border-width,1px) solid var(--en-color-line);
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-block-end:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding-block:var(--en-space-2,.5rem);
  padding-inline:calc(var(--color-session-padding) + var(--color-popup-padding));
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @container chat-color (min-width:40rem){
  en-token-editor::part(chat-color-base){grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr;grid-template-areas:"summary channels" "formats channels";column-gap:var(--en-space-4,1rem);row-gap:var(--en-space-3,.75rem);align-items:start}
  en-token-editor::part(chat-color-formats){align-self:start}
 }
:host{display:block;margin-block-start:2rem;min-inline-size:0}section{display:grid;gap:var(--en-space-3,.75rem)}.tools{display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.875em}h2,p{margin:0}en-token-editor::part(color-swatch),en-token-editor::part(color-option-swatch){display:inline-block;vertical-align:middle;inline-size:1.1em;block-size:1.1em;border:1px solid currentColor;border-radius:.15em}en-token-editor::part(color-swatch){display:block}en-token-editor::part(color-option-swatch){margin-inline-end:.5em}.message{padding:var(--en-space-3,.75rem);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem)}\`];
 private declare status:string;private declare sent:ChatEditorSnapshot|undefined;private sequence=0;
 private declare colorMode:'picker'|'native'|'typeahead';
 private recentColors:string[]=[];
 private disposers:(()=>void)[]=[];
 private get editor(){return this.renderRoot.querySelector<EnTokenEditor>('en-token-editor');}
 private references:EditorExtension={id:'references',trigger:'@',label:'References',provide:async({query,signal})=>{
  await new Promise(resolve=>setTimeout(resolve,120));if(signal.aborted)return [];
  return [{id:'mira',label:'Mira',description:'Design collaborator'},{id:'cover',label:'Cover study',description:'Project reference'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`reference-\${++this.sequence}\`,type:'demo/reference',text:\`@\${item.label}\`,label:\`\${item.label}, reference\`,data:{referenceId:item.id}}]}));
 }};
 private tools:EditorExtension={id:'tools',trigger:'/',label:'Tools',provide:({query})=>[{id:'summarize',label:'Summarize',description:'Insert the summary tool'},{id:'outline',label:'Outline',description:'Insert the outline tool'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`tool-\${++this.sequence}\`,type:'demo/tool',text:\`/\${item.label}\`,label:\`\${item.label}, tool\`,data:{toolId:item.id}}]}))};
 private nativeColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',match:before=>/(^|\\s)#$/.test(before)?{from:before.length-1,query:''}:undefined,open:session=>this.openColorPicker(session)};
 private get colors(){return this.colorMode==='native'?this.nativeColors:this.colorMode==='typeahead'?this.typeaheadColors:this.customColors;}
 private customColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',render:session=>{
  const choices=this.colorChoices(session.query).filter(choice=>(choice.data as {color?:string})?.color);
  const exact=choices.find(choice=>choice.label.toLowerCase()===session.query.toLowerCase());
  const color=normalizeHexColor(session.query)??(exact?.data as {color?:string}|undefined)?.color??String((session.token?.data as {color?:string}|undefined)?.color??'#5577cc');
  const pickerFrom=(event:Event)=>(event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector<EnColorPicker>('en-color-picker')!;
  return html\`\${keyed(session.signal,html\`<div data-color-session part="color-session">
    <en-tabs label="Color selection" value="picker" exportparts="tab-list:color-tab-list" @en-change=\${(event:Event)=>event.stopPropagation()}>
      <en-tab slot="tab" value="picker" exportparts="base:color-tab">Picker</en-tab><en-tab slot="tab" value="chips" exportparts="base:color-tab">Chips</en-tab>
      <en-tab-panel slot="panel" value="picker"><en-color-picker part="chat-color-picker" exportparts="base:chat-color-base,summary:chat-color-summary,formats:chat-color-formats,channels:chat-color-channels,preview:chat-color-preview,preview-frame:chat-color-preview-frame" data-picker-focus label="Message color" show-hex editable-channels .value=\${color} .alpha=\${(parseColor(color)?.alpha??1)!==1} @en-change=\${(event:Event)=>event.stopPropagation()}></en-color-picker></en-tab-panel>
      <en-tab-panel slot="panel" value="chips" hidden>
        <div role="group" aria-label="Matching palette and recent colors" style="display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)">
          \${choices.map(choice=>html\`<en-swatch color=\${String((choice.data as {color:string}).color)} label=\${choice.label} @click=\${(event:Event)=>{
            const picker=pickerFrom(event);picker.value=String((choice.data as {color:string}).color);
            (event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector('[data-color-choice]')!.textContent=\`\${choice.label} selected. Apply color to insert it.\`;
          }}></en-swatch>\`)}
        </div><p data-color-choice role="status">\${choices.length?'Choose a color, then Apply.':'No matching chips. Try a different name or use the Picker tab.'}</p>
      </en-tab-panel>
    </en-tabs>
    <div part="color-actions">
      <en-button variant="secondary" @click=\${()=>session.cancel()}>Cancel</en-button>
      <en-button @click=\${async(event:Event)=>{const picker=pickerFrom(event);if(!picker.checkValidity()){
        const tabs=picker.closest('en-tabs') as HTMLElement&{value:string;updateComplete:Promise<unknown>};tabs.value='picker';await tabs.updateComplete;picker.reportValidity();return;
      }this.commitColor(session,picker.value);}}>Apply color</en-button>
    </div>
  </div>\`)}\`;
 }};
 private typeaheadColors:EditorExtension={
  id:'colors',trigger:'#',label:'Colors',
  provide:({query})=>this.colorChoices(query),
  renderOption:choice=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   return html\`<span>\${color?html\`<span part="color-option-swatch" aria-hidden="true" style=\${\`background-color:\${color}\`}></span>\`:''}\${choice.label}</span>\`;
  },
  select:(choice,session)=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   if(color)this.commitColor(session,color);
   else session.openPicker(picker=>this.openColorPicker(picker));
  },
 };
 private colorChoices(query:string):EditorChoice[]{
  const text=query.toLowerCase();const choices:EditorChoice[]=[];
  const hex=normalizeHexColor(text);
  if(hex)choices.push({id:hex,label:\`Use \${hex}\`,description:'Custom color',data:{color:hex}});
  for(const color of this.recentColors.filter(color=>!text||color.includes(text)))if(color!==hex)choices.push({id:'recent-'+color,label:\`Recent \${color}\`,data:{color}});
  for(const [name,color] of [['Blue','#336699'],['Sky blue','#38bdf8'],['Red','#dc2626'],['Green','#16a34a'],['Violet','#8b5cf6'],['Amber','#f59e0b'],['P3 coral',wideColor]]){
   if((!text||name.toLowerCase().includes(text)||color.includes(text))&&color!==hex&&!choices.some(c=>(c.data as {color?:string})?.color===color))choices.push({id:color,label:name,description:color,data:{color}});
  }
  choices.push({id:'native-picker',label:'Choose another color…',description:'Open the native color picker'});
  return choices;
 }
 private commitColor(session:EditorPickerSession,color:string){
  const parsed=parseColor(color);if(!parsed)return;color=serializeColor(parsed);
  if(session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id??\`color-\${++this.sequence}\`,type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]}))this.recentColors=[color,...this.recentColors.filter(value=>value!==color)].slice(0,5);
 }
 private openColorPicker(session:EditorPickerSession){
  const input=this.renderRoot.querySelector<HTMLInputElement>('[data-native-color]')!;
  const anchor=session.getAnchorRect();
  Object.assign(input.style,{left:\`\${anchor.left}px\`,top:\`\${anchor.top}px\`,width:\`\${Math.max(1,anchor.width)}px\`,height:\`\${Math.max(1,anchor.height)}px\`});
  const initial=String((session.token?.data as {color?:string}|undefined)?.color??this.colorChoices(session.query).find(choice=>choice.description==='Custom color')?.id??'#5577cc');
  if(!normalizeHexColor(initial)){session.cancel();this.status='Use the inline picker to edit this color without losing its color space or precision.';return;}
  input.value=initial.slice(0,7);
  const commit=()=>this.commitColor(session,input.value+(initial.length===9?initial.slice(7):''));
  input.addEventListener('change',commit,{signal:session.signal});
  input.addEventListener('cancel',()=>session.cancel(),{signal:session.signal});
  // Kept in the triggering input/click call stack for browser user activation.
  // Some native choosers do not emit cancel. A new page interaction ends that session.
  this.ownerDocument.addEventListener('pointerdown',event=>{if(!event.composedPath().includes(input))session.cancel();},{capture:true,signal:session.signal});
  this.ownerDocument.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();session.cancel();}},{capture:true,signal:session.signal});
  try{if(typeof input.showPicker==='function'){input.showPicker();return;}}catch{/* Fall back to native input activation. */}
  input.click();
 }
 constructor(){super();this.colorMode='picker';this.status='Try @ for references, / for tools, or # for colors. Nothing is sent outside this page.';}
 override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.installRenderers();}
 protected override firstUpdated(){this.installRenderers();}
 private installRenderers(){
  const editor=this.editor!;
  for(const [type,extension,part] of [['demo/reference','references','reference-token'],['demo/tool','tools','tool-token']])this.disposers.push(editor.registerToken(type,token=>document.createTextNode(token.text),{extension,part,deleteBehavior:'edit'}));
  this.disposers.push(editor.registerToken('demo/color',colorTokenRenderer,{extension:'colors',part:'color-token',deleteBehavior:'edit'}));
 }
 override disconnectedCallback(){this.disposers.forEach(dispose=>dispose());this.disposers=[];super.disconnectedCallback();}
 private loadSamples(){this.editor!.document={version:1,runs:[{kind:'text',text:'Ask '},{kind:'token',id:'sample-reference',type:'demo/reference',text:'@Mira',label:'Edit Mira reference',data:{referenceId:'mira'}},{kind:'text',text:' to use '},{kind:'token',id:'sample-tool',type:'demo/tool',text:'/Summarize',label:'Edit Summarize tool',data:{toolId:'summarize'}},{kind:'text',text:' with '},{kind:'token',id:'sample-color',type:'demo/color',text:'#5577cc',label:'Edit color #5577cc',data:{color:'#5577cc'}},{kind:'text',text:'.'}]};}
 private action=(event:CustomEvent)=>{if(event.detail.action==='send'){this.sent=event.detail.data;this.status='Message captured locally. Use Restore draft to recover its original text and token data.';}};
 protected override render(){return html\`<section aria-labelledby="advanced-title"><h2 id="advanced-title">Composable editor extensions</h2><p>The editor contains no built-in reference, tool or color concepts. This example supplies them using three declarative extension elements.</p><en-select label="Color entry" .value=\${this.colorMode} .items=\${[{value:'picker',label:'Inline color picker'},{value:'native',label:'Native picker first'},{value:'typeahead',label:'Typeahead first'}]} @en-change=\${(event:Event)=>{this.colorMode=(event.currentTarget as HTMLElement&{value:'picker'|'native'|'typeahead'}).value;}}></en-select><p>\${this.colorMode==='picker'?'Type # to open the color controls directly. Use Picker for HEX/RGB/HSL and alpha, or Chips for palette/recent choices. Keep typing a hex value or palette name to update the picker; Enter or Down Arrow moves into its controls. Apply inserts a chip; Cancel keeps your text.':this.colorMode==='native'?'Type # to open the native picker immediately.':'Type #blu for named colors or #336699 for a hex color; use Arrow keys and Enter. Empty # includes recent colors. Choose another color opens the native picker.'}</p><input data-native-color type="color" tabindex="-1" aria-hidden="true" style="position:fixed;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none"><en-chat-composer @en-action=\${this.action}><en-token-editor slot="editor" id="structured-draft" label="Structured message"></en-token-editor><div slot="tools" class="tools"><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('references')}>References</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('tools')}>Tools</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('colors')}>Colors</en-button></div></en-chat-composer><en-editor-trigger for="structured-draft" .extension=\${this.references}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.tools}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.colors}></en-editor-trigger><div class="tools"><en-button variant="secondary" @click=\${()=>this.loadSamples()}>Load sample chips</en-button><en-button variant="secondary" @click=\${()=>this.editor?.undo()}>Undo edit</en-button><en-button variant="secondary" @click=\${()=>this.editor?.redo()}>Redo edit</en-button><en-button variant="secondary" ?disabled=\${!this.sent} @click=\${()=>{if(this.sent?.content)this.editor!.document=this.sent.content as unknown as DocumentValue;}}>Restore draft</en-button></div><p>Chip editing: click a chip to choose a replacement. Backspace immediately after a chip (or Delete immediately before it) restores its trigger and opens the picker. Type to refine @ or / (and # in typeahead mode); Escape leaves the editable trigger. Undo restores the chip. Selecting a text range still deletes that range normally.</p><p role="status">\${this.status}</p>\${this.sent?html\`<div class="message"><strong>Captured message</strong><p>\${this.sent.value}</p><details><summary>Structured snapshot</summary><pre>\${JSON.stringify(this.sent.content,null,2)}</pre></details></div>\`:''}<details><summary>Extension composition API</summary><pre>\${\`<en-chat-composer>
  <en-token-editor id="draft" slot="editor" label="Message"></en-token-editor>
</en-chat-composer>
<en-editor-trigger for="draft"></en-editor-trigger>

trigger.extension = {
  id: 'references', trigger: '@', label: 'References',
  provide: async ({query, signal}) => findReferences(query, signal),
};
// Or register imperatively; dispose when this integration disconnects:
const dispose = editor.registerExtension(extension);
// Compose a reusable picker; the application owns Apply and Cancel:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => html\\\`
    <en-color-picker .value=\\\${colorFromQuery(session.query)}></en-color-picker>
    <button @click=\\\${() => commitChosenColor(session)}>Apply color</button>
    <button @click=\\\${() => session.cancel()}>Cancel</button>
  \\\`,
});
// colorFromQuery and commitChosenColor are application helpers.
// Native pickers can still open synchronously, preserving user activation:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  open: session => openNativeColorPicker(session),
});
// Or install a typeahead-first color extension instead:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Colors',
  provide: ({query}) => findColors(query),
  renderOption: choice => renderColorOption(choice),
  select: (choice, session) => {
    if (choice.id === 'native-picker') {
      session.openPicker(openNativeColorPicker);
    } else {
      session.commit(choice); // The choice supplies insertion runs.
    }
  },
});
// renderOption returns noninteractive contents; choice.label names the option.
// The editor retains Arrow/Enter handling and option selection.
// The application owns the native input and commits on change.
// session.token contains the existing occurrence when editing.
// Use session.signal to clean up listeners and session.cancel()
// when dismissed. Alternatively supply render(session) for an
// inline custom picker in the editor's popup.
editor.registerToken('demo/color', renderColorSwatch, {
  extension: 'colors', part: 'color-token', deleteBehavior: 'edit',
});
// Atomic deletion remains the default without deleteBehavior.
editor.editToken('reference-1', {query: 'Mi'});
// Converts that occurrence to @Mi and opens its reference picker.
// ::part(token) styles all chips; ::part(color-token) styles color wrappers.
// Renderer-created descendants can expose their own parts:
// swatch.setAttribute('part', 'color-swatch');
// swatch.style.backgroundColor = validatedColor;
// en-token-editor::part(color-swatch) { border-radius: 50%; }
// Keep size, border and layout in CSS; only the chosen color is inline.
// Or open an existing occurrence from application UI:
editor.openExtension('colors', {tokenId: 'color-1'});\`}</pre></details></section>\`;}
}

if (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);

import { nothing } from 'lit';
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
 private fileSize(file:File){return file.size<1024?\`\${file.size} B\`:file.size<1024*1024?\`\${Math.ceil(file.size/1024)} KB\`:\`\${(file.size/1024/1024).toFixed(1)} MB\`;}
 private openPreview(file:File){
  this.preview=file;this.refresh();
  // Opening the existing dialog is explicit and preserves the triggering control for focus restoration.
  queueMicrotask(()=>{if(this.isConnected)this.root?.querySelector<EnDialog>('en-dialog')?.show();});
 }
 private remove(file:File){
  const field=this.files;if(!field)return;
  field.files=field.files.filter(selected=>selected!==file);this.fileRevision++;
  field.focus({preventScroll:true});this.status=\`Removed \${file.name} from the draft.\`;this.refresh();
 }
 private attachments(files:readonly File[],editable=false){
  return html\`<ul class="chat-demo-attachments" aria-label=\${editable?'Selected attachments':'Message attachments'}>\${repeat(files,file=>file,file=>html\`<li class="chat-demo-attachment">
   <div class="chat-demo-media" ?data-document=\${!this.image(file)}>\${this.image(file)?html\`<img src=\${this.url(file)} alt="" @error=\${()=>{this.brokenImages.add(file);this.refresh();}}>\`:html\`<en-icon name="file" aria-hidden="true"></en-icon><span>\${this.fileType(file)}</span>\`}</div>
   <div class="chat-demo-file-name">\${file.name}</div><small>\${this.fileType(file)} · \${this.fileSize(file)}\${this.brokenImages.has(file)?' · Image preview unavailable':''}</small>
   <div class="chat-demo-file-actions"><en-button variant="secondary" @click=\${()=>this.openPreview(file)}>Preview <span class="chat-demo-sr">\${file.name}</span></en-button>\${editable?html\`<en-button variant="ghost" @click=\${()=>this.remove(file)}>Remove <span class="chat-demo-sr">\${file.name}</span></en-button>\`:nothing}</div>
  </li>\`)}</ul>\`;
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
  if(success&&retrying){const message=this.root?.querySelector<HTMLElement>(\`en-chat-message[data-message-id="\${request.id}"]\`);if(message?.querySelector('en-button[slot=actions]')?.matches(':focus-within'))message.focus({preventScroll:true});}
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
  return html\`<section data-chat-patterns-demo \${ref(this.connect)} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
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
     <en-button slot="actions" variant="secondary" @click=\${()=>{if(this.editor){this.editor.value='Please reduce the cover image opacity to 60%.';this.draftRevision++;this.editor.focus();}}}>Use suggestion</en-button>
    </en-chat-message></li>
    \${repeat(this.messages,message=>message.id,message=>html\`<li><en-chat-message author="You" outgoing data-message-id=\${message.id}>
     <span style="white-space:pre-wrap">\${message.value||'Attached files'}</span>
     \${message.files.length?html\`<div slot="attachments">\${this.attachments(message.files)}</div>\`:nothing}
     <div slot="status" class="chat-demo-status" ?data-failed=\${message.state==='failed'}><en-icon name=\${message.state==='failed'?'warning':message.state==='sent'?'check':'info'}></en-icon><strong>\${{failed:'Not sent',sending:'Sending…',retrying:'Retrying…',sent:'Sent locally'}[message.state]}</strong>\${message.state==='failed'?html\`<span>Your message and attachments are preserved.</span>\`:nothing}</div>
     \${message.state==='failed'||message.state==='retrying'?html\`<en-button slot="actions" variant="secondary" aria-disabled=\${String(!!this.pending)} @click=\${()=>this.retry(message)}>Retry message</en-button>\`:nothing}
    </en-chat-message></li>\`)}
   </ol>
   <en-chat-composer id="chat-composer-example" .sending=\${!!this.pending} .allowEmpty=\${!!this.files?.files?.length} @en-action=\${this.send}>
    <en-textarea slot="editor" label="Message" rows="3" description="Enter adds a new line. Send with the button or Control/Command + Enter." @en-input=\${()=>{this.draftRevision++;}}></en-textarea>
    <en-file-upload class="chat-demo-picker" slot="attachments" multiple accept="image/*,.pdf" @en-change=\${(event:Event)=>{queueMicrotask(()=>{if(!event.defaultPrevented){this.fileRevision++;this.refresh();}});}}>
     <span slot="label">Attachments</span><span slot="description">Optional images or PDFs. Files stay in this browser.</span>
    </en-file-upload>
    \${this.files?.files?.length?html\`<div slot="attachments">\${this.attachments(this.files.files,true)}</div>\`:nothing}
    <span slot="status" role="status">\${this.status}</span>
   </en-chat-composer>
   <en-dialog @en-change=\${(event:Event)=>{const dialog=event.currentTarget as EnDialog;queueMicrotask(()=>{if(!event.defaultPrevented&&!dialog.open){this.preview=undefined;this.refresh();}});}} label=\${this.preview?\`Attachment preview: \${this.preview.name}\`:'Attachment preview'} presentation="responsive">
    \${this.preview?html\`<div class="chat-demo-preview">\${this.image(this.preview)?html\`<img src=\${this.url(this.preview)} alt=\${this.preview.name} @error=\${()=>{if(this.preview)this.brokenImages.add(this.preview);this.refresh();}}>\`:html\`<p><en-icon name="file"></en-icon> \${this.fileType(this.preview)} attachment\${this.brokenImages.has(this.preview)?' · Image preview unavailable':''}</p>\`}<p>\${this.preview.name} · \${this.fileSize(this.preview)}</p><a href=\${this.url(this.preview)} download=\${this.preview.name}>Download \${this.preview.name}</a></div>\`:nothing}
   </en-dialog>
   <details open><summary>Delivery simulation</summary><div style="display:flex;flex-wrap:wrap;gap:var(--en-space-actions);padding-block:var(--en-space-3)">
    <en-button variant="secondary" ?disabled=\${!this.pending} @click=\${()=>this.settle(true)}>Complete send</en-button>
    <en-button variant="secondary" ?disabled=\${!this.pending} @click=\${()=>this.settle(false)}>Fail send</en-button>
   </div><en-checkbox .checked=\${this.veto} @en-change=\${(event:Event)=>{const checkbox=event.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!event.defaultPrevented)this.veto=checkbox.checked;});}}>Application declines send</en-checkbox>
   <p>Add images or PDFs to see attachment tiles, remove them before sending, or open a local preview. Failed messages stay in the conversation with their original files and Retry action. Retry leaves the current composer untouched. Complete or fail the retry with these simulation controls. No file is uploaded and no message is sent outside this browser.</p></details>
  </section>\`;
 }
}
const chatPatternsDemo=directive(ChatPatternsDemo);
export function chatPatternsExample(resetKey:unknown=0){return html\`\${chatPatternsDemo(resetKey)}<en-composable-chat-demo></en-composable-chat-demo>\`;}`})))()}n();export{t as default};
//# sourceMappingURL=chat-patterns-source-CdJCceqy.js.map