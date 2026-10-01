import { html, css, LitElement } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EnTokenEditor } from '@en-reve/elements/token-editor.js';
import type { EnRichTextEditor } from '@en-reve/elements/rich-text-editor.js';
import { wideColor, wideColorExtension, colorTokenStyles, colorTokenRenderer } from './editor-color-extension.js';

export class ColorSpacesDemo extends LitElement {
  static override properties = { current: { state: true }, veto: { state: true }, plane: { state: true } };
  static override styles = [colorTokenStyles, css`
    :host{display:block;min-inline-size:0}section{display:grid;gap:var(--en-space-3,.75rem);min-inline-size:0}
    h2,h3,p{margin:0}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2,.5rem)}
    .workspace,.picker-panel,.editor-panel{display:grid;gap:var(--en-space-3,.75rem);min-inline-size:0}
    .receipt{font-size:.875em;overflow-wrap:anywhere}
    code,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-size:.875em}
    en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){display:block;inline-size:1.2em;block-size:1.2em;border:1px solid currentColor;border-radius:.15em}
    :is(en-token-editor,en-rich-text-editor)::part(color-session){
      --color-session-padding:var(--en-space-4,1rem);
      --color-popup-padding:var(--en-option-list-padding,var(--en-overlay-padding,var(--en-space-2,.5rem)));
      display:grid;gap:var(--en-space-4,1rem);padding:var(--color-session-padding);container:editor-color / inline-size
    }
    :is(en-token-editor,en-rich-text-editor)::part(color-picker){--en-color-picker-inline-size:100%}
    :is(en-token-editor,en-rich-text-editor)::part(color-base){grid-template-areas:"summary" "formats" "conversion" "channels"}
    :is(en-token-editor,en-rich-text-editor)::part(color-summary){grid-area:summary;align-items:stretch}
    :is(en-token-editor,en-rich-text-editor)::part(color-formats){grid-area:formats}
    :is(en-token-editor,en-rich-text-editor)::part(color-channels){grid-area:channels;align-content:start}
    :is(en-token-editor,en-rich-text-editor)::part(color-conversion){grid-area:conversion;justify-self:start}
    :is(en-token-editor,en-rich-text-editor)::part(color-space),:is(en-token-editor,en-rich-text-editor)::part(color-gamut){display:none}
    :is(en-token-editor,en-rich-text-editor)::part(color-preview-frame){position:relative;align-self:stretch;inline-size:var(--en-color-picker-preview-size,3rem);min-block-size:3rem}
    :is(en-token-editor,en-rich-text-editor)::part(color-preview){position:absolute;inset:0;inline-size:100%;block-size:100%;aspect-ratio:auto;min-block-size:3rem}
    :is(en-token-editor,en-rich-text-editor)::part(color-actions){
      display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem);justify-content:end;
      position:sticky;inset-block-end:calc(-1 * var(--color-popup-padding));z-index:2;
      margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
      margin-block-end:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
      padding:var(--en-space-2,.5rem) calc(var(--color-session-padding) + var(--color-popup-padding));
      border-block-start:var(--en-border-width,1px) solid var(--en-color-line);
      background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)))
    }
    @media(forced-colors:active){:is(en-token-editor,en-rich-text-editor)::part(color-actions){background:Canvas}}
    @container editor-color (min-width:40rem){
      :is(en-token-editor,en-rich-text-editor)::part(color-base){grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;grid-template-areas:"summary formats" "channels channels" "conversion conversion";align-items:start;column-gap:var(--en-space-4,1rem)}
    }
  `];
  private declare current: string;
  private declare veto: boolean;
  private declare plane: boolean;
  private disposers: (()=>void)[] = [];
  private installation = 0;
  constructor(){super();this.current=wideColor;this.veto=false;this.plane=true;}
  private get picker(){return this.renderRoot.querySelector<EnColorPicker>('#wide-picker')!;}
  private editors(){return [...this.renderRoot.querySelectorAll<EnTokenEditor|EnRichTextEditor>('en-token-editor,en-rich-text-editor')];}
  protected override firstUpdated(){this.install();}
  override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.install();}
  override disconnectedCallback(){this.installation++;this.disposers.forEach(dispose=>dispose());this.disposers=[];super.disconnectedCallback();}
  private async install(){const revision=++this.installation;await Promise.all(['en-token-editor','en-rich-text-editor'].map(tag=>customElements.whenDefined(tag)));if(!this.isConnected||revision!==this.installation)return;for(const editor of this.editors())this.disposers.push(editor.registerExtension(wideColorExtension),editor.registerToken('demo/color',colorTokenRenderer,{extension:'colors',part:'color-token',deleteBehavior:'edit'}));}
  private load(value:string){this.picker.value=value;this.current=this.picker.value;}
  protected override render(){
    return html`<section id="wide-color-example" aria-label="Wide-gamut color foundation">
      <h2>Color picker and editor tokens</h2>
      <p>Drag within the saturation/value plane, or use the equivalent sliders and small numeric fields. Hue uses the active color space. Escape cancels a drag; releasing commits it.</p>
      <div class="workspace"><div class="picker-panel">
      <div class="actions"><en-switch .checked=${this.plane} @en-change=${(event:CustomEvent)=>{this.plane=event.detail.proposed;}}>Use color plane</en-switch><en-button variant="secondary" @click=${()=>this.load(wideColor)}>Load Display-P3 sample</en-button><en-button variant="secondary" @click=${()=>this.load('#33669980')}>Load sRGB sample</en-button><label><input type="checkbox" .checked=${this.veto} @change=${(event:Event)=>{this.veto=(event.target as HTMLInputElement).checked;}}> Reject next color change</label></div>
      <en-color-picker id="wide-picker" label="Wide-gamut accent" format="rgb" alpha ?plane=${this.plane} .value=${guard([],()=>wideColor)} @en-change=${(event:CustomEvent)=>{
        if(event.target!==event.currentTarget)return;
        if(this.veto){event.preventDefault();this.veto=false;}
        queueMicrotask(()=>{this.current=this.picker.value;});
      }}></en-color-picker>
      <p class="receipt">Accepted value: <output data-color-receipt>${this.current}</output></p>
      </div><div class="editor-panel">
      <h3>Try it in an editor</h3><p>Type # or use Insert color. Apply inserts one token; Cancel preserves the original draft. Copy between editors, reopen the chip and use Undo to check that its CSS value and alpha survive.</p>
      <div class="actions"><en-button variant="secondary" @click=${()=>this.editors()[0]?.openExtension('colors')}>Insert color in token editor</en-button><en-button variant="secondary" @click=${()=>this.editors()[1]?.openExtension('colors')}>Insert color in rich editor</en-button></div>
      <en-token-editor id="color-token-editor" label="Color token editor"></en-token-editor>
      <en-rich-text-editor id="color-rich-editor" label="Color rich editor"></en-rich-text-editor>
      </div></div>
      <details><summary>Color-space and editor source</summary><pre><code>${`import { parseColor, serializeColor, convertColor, inGamut, exportSRGB } from '@en-reve/elements/color-picker.js';
picker.value = 'color(display-p3 1 0.2 0.1 / 0.65)';
picker.plane = true; // HSV plane + equivalent Hue/Saturation/Value controls.
// en-input previews a drag; en-change commits once, cancelably, on release.
// Escape or pointer cancellation restores the accepted color.
const color = picker.colorValue; // Same accepted state as value.
const converted = convertColor(color, 'srgb'); // Extended coordinates; no clipping.
const fits = inGamut(converted);
const output = exportSRGB(color); // Explicit clipping; output.clipped reports loss.
// Merely changing picker.format never converts the accepted value.
// Application-owned editor extension, shared by both backends:
editor.registerExtension({ id: 'colors', trigger: '#', label: 'Color picker',
  render: session => renderPickerWithApplyAndCancel(session),
});
// Apply uses session.commit({insert:[{kind:'token', type:'demo/color',
//   id: existingId, text: picker.value, data: {color: picker.value}}]});
// Cancel uses session.cancel(); preserve existingId when editing.
// Parse domain payloads before rendering; unrecognized colors stay readable text.`}</code></pre></details>
    </section><en-color-wheel-demo></en-color-wheel-demo>`;
  }
}
if(!customElements.get('en-color-spaces-demo'))customElements.define('en-color-spaces-demo',ColorSpacesDemo);

/** App-owned composition: controls exchange accepted colors, never draft writes. */
class ColorWheelDemo extends LitElement {
  static override properties={color:{state:true},preview:{state:true},veto:{state:true}};
  static override styles=css`
    :host{display:block;margin-block-start:2rem;min-inline-size:0}
    section{display:grid;gap:var(--en-space-4,1rem)}h2,p{margin:0}
    .controls{display:grid;gap:2rem;align-items:start;min-inline-size:0}
    .sample{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
    .swatch{inline-size:3rem;block-size:3rem;border:1px solid var(--en-color-boundary);border-radius:var(--en-radius-control,.25rem);background:repeating-conic-gradient(#fff 0% 25%,#b8b8b8 0% 50%) 0 0 / 1rem 1rem;overflow:hidden}
    .swatch span{display:block;inline-size:100%;block-size:100%}
    code,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-size:.875em}
    @media(min-width:48rem){.controls{grid-template-columns:minmax(12rem,16rem) minmax(0,1fr)}}
  `;
  private declare color:string;
  private declare preview:string;
  private declare veto:boolean;
  constructor(){super();this.color='color(display-p3 0.3 0.5 0.8 / 0.65)';this.preview=this.color;this.veto=false;}
  private change(event:CustomEvent){
    if(this.veto){event.preventDefault();this.veto=false;}
    const source=event.currentTarget as HTMLElement & {value:string};
    queueMicrotask(()=>{this.color=source.value;this.preview=this.color;});
  }
  protected override render(){return html`<section id="color-wheel-example" aria-label="Standalone color wheel composition">
    <h2>Compose a hue wheel and color plane</h2>
    <p>The wheel edits hue only. The plane edits saturation and brightness; both preserve the accepted color space and alpha. Try Arrow keys (1°), Page Up/Down (10°), Home/End, or the exact Hue field. Escape cancels a drag.</p>
    <div class="sample"><en-button variant="secondary" @click=${()=>{this.color='#5577cc80';this.preview=this.color;}}>Load sRGB color</en-button><en-button variant="secondary" @click=${()=>{this.color='color(display-p3 0.3 0.5 0.8 / 0.65)';this.preview=this.color;}}>Load P3 color</en-button><en-checkbox .checked=${this.veto} @en-change=${(e:CustomEvent)=>{this.veto=e.detail.proposed;}}>Reject next change</en-checkbox></div>
    <div class="controls">
      <en-color-wheel id="standalone-wheel" label="Accent hue wheel" .value=${this.color} @en-input=${(e:CustomEvent)=>{this.preview=e.detail.value;}} @en-change=${this.change}></en-color-wheel>
      <en-color-plane id="composed-plane" label="Accent saturation and brightness" alpha .value=${this.color} @en-input=${(e:CustomEvent)=>{this.preview=e.detail.value;}} @en-change=${this.change}></en-color-plane>
    </div>
    <div class="sample"><span class="swatch" aria-hidden="true"><span style=${`background:${this.preview}`}></span></span><p>Accepted color: <output data-wheel-value>${this.color}</output></p></div>
    <details><summary>Wheel and plane source</summary><pre><code>${`import '@en-reve/elements/define/color-wheel.js';
import '@en-reve/elements/define/color-plane.js';
const controls = [wheel, plane];
for (const source of controls) {
  source.value = 'color(display-p3 0.3 0.5 0.8 / 0.65)';
  source.addEventListener('en-input', event => preview(event.detail.value));
  source.addEventListener('en-change', event => {
    // Call event.preventDefault() here if the application rejects this color.
    queueMicrotask(() => {
      // Read the settled state: another listener may veto or replace the proposal.
      for (const target of controls) if (target !== source) target.value = source.value;
      preview(source.value);
    });
  });
}
// The picker default is unchanged; import and compose the wheel only when needed.
// CSS: en-color-wheel { --en-color-wheel-size: 14rem; }
// ::part(control), ::part(ring), ::part(thumb), ::part(editor-field), ::part(editor), ::part(editor-label), ::part(error)`}</code></pre></details>
  </section>`;}
}
if(!customElements.get('en-color-wheel-demo'))customElements.define('en-color-wheel-demo',ColorWheelDemo);
