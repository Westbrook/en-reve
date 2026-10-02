import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/chat-composer.js';
import '@en-reve/elements/define/color-picker.js';
import '@en-reve/elements/define/editor-trigger.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/swatch.js';
import '@en-reve/elements/define/tab.js';
import '@en-reve/elements/define/tab-panel.js';
import '@en-reve/elements/define/tabs.js';
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

export function composableChatExample(){return html\`<en-composable-chat-demo></en-composable-chat-demo>\`;}`})))()}n();export{t as default};
//# sourceMappingURL=composable-chat-source-I-a1ZnvM.js.map