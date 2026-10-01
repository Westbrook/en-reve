import { ScopedContext } from '../internal/context-consumer.js';
import { colorMessagesContext, mergeMessageOverrides } from '../messages-context.js';
import type {ColorChannel, ColorPickerMessages} from './messages.js';
import { html, type PropertyValues } from 'lit';
import type { EnColorPlane } from '../color-plane.js';
import { EnElement } from '../internal/en-element.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { colorPickerStyles } from '@en-reve/styles/color-picker.js';

import { normalizeHexColor, toHex, toHSL, fromHSL, type HSL, type RGBA } from './color.js';
import { createColorValue, parseColor, serializeColor, exportSRGB, inGamut, colorPaint, type ColorValue } from './color-value.js';
export { normalizeHexColor } from './color.js';
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/**
 * Inline sRGB and Display-P3 color controls with HEX, RGB, HSL and optional alpha editing. The containing application owns popup lifetime,
 * form submission, optional palette/recent colors and any Apply/Cancel transaction.
 * @tagname en-color-picker
 * @slot palette - Optional application-owned palette controls.
 * @slot recent - Optional application-owned recent color controls.
 * @csspart hex-description - Forwarded hex guidance only.
 * @csspart hex-error - Forwarded hex validation only.
 * @csspart channel-error - Forwarded exact channel validation messages.
 * @csspart base - Picker layout and named group.
 * @csspart summary - Preview and HEX input or accepted-value readout wrapper.
 * @csspart preview-frame - Checkerboard backing and layout wrapper around the preview.
 * @csspart preview - Decorative color preview; chosen background is dynamic.
 * @csspart value - Accepted hex readout in RGB/HSL modes.
 * @csspart hex-field - Small en-text-field host for hex editing.
 * @csspart hex - Forwarded native hex text input.
 * @csspart channels - Channel controls layout.
 * @csspart plane-control - Compound HSV plane host when plane is enabled.
 * @csspart plane - Forwarded pointer plane surface.
 * @csspart plane-thumb - Forwarded decorative plane marker.
 * @csspart plane-axes - Forwarded visible saturation/value axis description.
 * @csspart channel - Each labeled channel row.
 * @csspart slider - Forwarded native range inputs of the channel sliders.
 * @csspart channel-field - Small en-text-field host for each exact channel value.
 * @csspart channel-input - Forwarded exact numeric inputs.
 * @csspart gradient - Forwarded gradient wrappers.
 * @csspart space - Accepted color-space and CSS-value readout.
 * @csspart gamut-message - Text describing sRGB approximation and fallback.
 * @csspart validation-message - Invalid authored CSS/model feedback; accepted value is retained.
 * @csspart conversion - Explicit conversion to the sRGB approximation.
 * @csspart formats - Format and alpha control layout.
 * @csspart format - Color format select host.
 * @csspart alpha-toggle - Alpha editing switch host.
 * @csspart hue - Hue slider host.
 * @csspart saturation - Saturation slider host.
 * @csspart brightness - Forwarded brightness slider host when plane is enabled.
 * @csspart lightness - Lightness slider host.
 * @csspart alpha - Alpha slider host.
 * @csspart red - Red slider host.
 * @csspart green - Green slider host.
 * @csspart blue - Blue slider host.
 * @cssprop --en-color-picker-inline-size - Preferred width; defaults to 20rem, capped by available space.
 * @cssprop --en-color-picker-gap - Space between controls; defaults to shared field spacing.
 * @cssprop --en-color-picker-preview-size - Square preview size; defaults to 3rem.
 * @cssprop --en-color-picker-preview-radius - Preview radius; defaults to shared control radius.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<string>>} en-change - Single cancelable provisional color change; author writes are silent and supersede rollback.
 */
export class EnColorPicker extends EnElement {
  private readonly messageContext = new ScopedContext(this, colorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties = {
    plane: {type:Boolean}, brightnessLabel:{attribute:'brightness-label', useDefault:true}, preview: {state:true}, format: {}, showHex: {type:Boolean,attribute:'show-hex'}, editableChannels: {type:Boolean,attribute:'editable-channels'}, alpha: {type: Boolean, reflect: true}, formatLabel: {attribute:'format-label', useDefault:true}, alphaLabel: {attribute:'alpha-label', useDefault:true}, hueLabel: {attribute:'hue-label', useDefault:true}, saturationLabel: {attribute:'saturation-label', useDefault:true}, lightnessLabel: {attribute:'lightness-label', useDefault:true},
    value: { noAccessor: true }, colorValue: {noAccessor:true,attribute:false}, label: {useDefault:true}, hexLabel: { attribute: 'hex-label' , useDefault:true},
    redLabel: { attribute: 'red-label' , useDefault:true}, greenLabel: { attribute: 'green-label' , useDefault:true}, blueLabel: { attribute: 'blue-label' , useDefault:true},
    messages: {attribute:false}, validationText: {attribute:'validation-text',useDefault:true},
    invalidMessage: { attribute: 'invalid-message' , useDefault:true}, disabled: { type: Boolean, reflect: true },
    draft: { state: true }, invalid: { state: true }, paintReady: {state:true},
  };
  static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, colorPickerStyles];
  private color = '#000000';
  private revision = 0;
  private authorError = false;
  private declare preview: string | undefined;
  private declare paintReady: boolean;
  private hexComposing = false;
  private hexBlurPending = false;
  private hsl: HSL = [0, 0, 0];
  private declare draft: string;
  private declare invalid: boolean;
  /** Accepted bounded CSS color string. Invalid writes retain the accepted value and expose validation feedback. Exact sRGB bytes retain hex output; P3 retains its space. */
  get value(): string { return this.color; }
  set value(value: string) {
    const parsed = parseColor(value);
    if (!parsed) {this.draft=String(value ?? '');this.invalid=true;this.authorError=true;this.requestUpdate();return;}
    ++this.revision; this.preview=undefined; const plane=this.renderRoot?.querySelector<EnColorPlane>('en-color-plane'); if(plane)plane.value=serializeColor(parsed); const old = this.color; this.color = serializeColor(parsed);
    this.hsl = toHSL(this.rgba, this.hsl?.[0] ?? 0);
    this.draft = this.color; this.invalid = false; this.authorError=false; this.requestUpdate('value', old);
  }
  /** Immutable typed view of value. Writes are copied, validated and share value's revision/transaction guard. */
  get colorValue(): ColorValue { return parseColor(this.color)!; }
  set colorValue(value: ColorValue) {
    const next=createColorValue(value);
    if(next)this.value=serializeColor(next);
    else {this.invalid=true;this.authorError=true;this.draft='';this.requestUpdate();}
  }
  private get rgba(): RGBA {
    const {color}=exportSRGB(this.colorValue);
    return [...color.channels.map(n=>n*255),color.alpha] as RGBA;
  }
  /** Explicit single cancelable conversion to the channel-clipped sRGB approximation. */
  convertToSRGB() { return this.change(exportSRGB(this.colorValue).value,'color-space'); }
  /** Use a two-dimensional saturation/value plane and equivalent HSV numeric sliders in place of RGB/HSL channel sliders. Format still selects the textual summary presentation. */
  declare plane: boolean;
  /** Localized HSV Value label, distinct from HSL lightness. */
  declare brightnessLabel: string;
  /** Input presentation; changing format preserves the exact accepted value and color space. Defaults to hex. */
  declare format: ColorFormat;
  /** Keep the combined HEX field visible in RGB/HSL modes. Useful for a stable summary while switching formats. */
  declare showHex: boolean;
  /** Show exact numeric channel inputs in HEX mode too, keeping channel rows consistent across formats. */
  declare editableChannels: boolean;
  /** Show alpha editing. Hiding the channel preserves existing transparency. */
  declare alpha: boolean;
  /** Localized input-format selector label. */
  declare formatLabel: string;
  /** Localized alpha switch and slider label. */
  declare alphaLabel: string;
  /** Localized hue channel label. */
  declare hueLabel: string;
  /** Localized saturation channel label. */
  declare saturationLabel: string;
  /** Localized lightness channel label. */
  declare lightnessLabel: string;
  /** Accessible name for the complete control group. */
  declare label: string;
  /** Localized visible hex field label. */
  declare hexLabel: string;
  /** Localized red channel label. */
  declare redLabel: string;
  /** Localized green channel label. */
  declare greenLabel: string;
  /** Localized blue channel label. */
  declare blueLabel: string;
  /** Localized persistent hex guidance, emphasized for invalid input. */
  declare invalidMessage: string;
  /** Partial property-only translations; replace the object to update. */
  declare messages: ColorPickerMessages | undefined;
  /** Fallback constraint text for every numeric channel; never sets invalidity. */
  declare validationText: string;
  /** Disables built-in editing; consumers must also disable authored palette controls. */
  declare disabled: boolean;
  constructor() {
    super(); this.validationText=''; this.plane=false; this.brightnessLabel='Value'; this.paintReady=false; this.format = 'hex'; this.showHex=false; this.editableChannels=false; this.alpha = false; this.formatLabel = 'Color format'; this.alphaLabel = 'Alpha'; this.hueLabel = 'Hue'; this.saturationLabel = 'Saturation'; this.lightnessLabel = 'Lightness'; this.draft = this.color; this.invalid = false; this.authorError=false; this.disabled = false;
    this.label = 'Color'; this.hexLabel = 'Hex color'; this.redLabel = 'Red'; this.greenLabel = 'Green'; this.blueLabel = 'Blue';
    this.invalidMessage = 'Use 3 or 6 hex digits; add alpha with 4 or 8.';
  }
  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed); this.paintReady=true;
  }
  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if(changed.has('plane'))this.preview=undefined;
    if (changed.has('format') && !this.invalid) this.draft = this.color;
    if (changed.has('disabled') && this.disabled) { this.draft = this.color; this.invalid = false; this.authorError=false; }
  }
  /** Focus the hex field or first channel slider. */
  override focus(options?: FocusOptions): void { this.renderRoot.querySelector<HTMLElement>('#hex, en-color-plane, en-color-slider')?.focus(options); }
  /** Whether the current hex and numeric drafts are supported; does not display feedback or change value. */
  checkValidity(): boolean { return this.disabled || (!!parseColor(this.draft) && [...this.renderRoot.querySelectorAll<HTMLElement & {checkValidity(): boolean}>('en-color-slider, en-color-plane')].every(slider => slider.checkValidity())); }
  /** Show invalid draft feedback and focus its field; returns whether the draft is supported. */
  reportValidity(): boolean {
    const valid = this.checkValidity(); this.invalid = !valid;
    if (!valid) {
      const channel = [...this.renderRoot.querySelectorAll<HTMLElement & {checkValidity(): boolean; reportValidity(): boolean}>('en-color-slider, en-color-plane')].find(slider => !slider.checkValidity());
      if (channel) channel.reportValidity(); else this.focus();
    }
    return valid;
  }
  private change(next: string, reason: string, hsl?: HSL) {
    if (this.disabled) return 'canceled';
    const outcome = dispatchChange(this, {previous: this.value, proposed: next, reason, getRevision: () => this.revision,
      stage: value => {this.color = value;}, rollback: value => {this.color = value;}, canCommit: () => !this.disabled});
    if (outcome === 'committed' || outcome === 'unchanged') this.hsl = hsl ?? toHSL(this.rgba, this.hsl[0]);
    this.draft = this.color; this.invalid = false; this.authorError=false; this.requestUpdate(); return outcome;
  }
  private acceptHex(): void {
    if (this.disabled || this.colorValue.space === 'display-p3' || this.draft===this.color) return;
    const next = normalizeHexColor(this.draft);
    if (next) this.change(next, 'hex'); else this.invalid = true;
  }
  private channel(index: number, event: CustomEvent<{proposed: number}>, hslMode: boolean): void {
    event.stopPropagation();
    const model=this.colorValue, p3=model.space==='display-p3';
    const rgba = this.rgba, hsl: HSL = [...this.hsl];
    const value = event.detail.proposed;
    if (index === 3) rgba[3] = value / 100;
    else if (hslMode) hsl[index] = value;
    else rgba[index] = value;
    const next = hslMode && index !== 3 ? fromHSL(hsl, rgba[3]) : rgba;
    const reason = index === 3 ? 'alpha' : (hslMode ? ['hue','saturation','lightness'] : ['red','green','blue'])[index];
    const p3Channels=[...model.channels] as [number,number,number];
    if(p3 && index!==3)p3Channels[index]=value;
    const srgbChannels=[...model.channels] as [number,number,number];
    if(!p3 && index!==3 && !hslMode)srgbChannels[index]=value/255;
    const proposed=p3 ? serializeColor({...model,channels:p3Channels,alpha:index===3 ? value/100 : model.alpha}) :
      hslMode && index!==3 ? serializeColor({space:'srgb',channels:next.slice(0,3).map(n=>Math.round(n)/255) as [number,number,number],alpha:model.alpha}) : serializeColor({...model,channels:srgbChannels,alpha:index===3 ? value/100 : model.alpha});
    const outcome = this.change(proposed, reason, hslMode ? hsl : undefined);
    if (outcome === 'canceled' || outcome === 'superseded') {
      event.preventDefault();
      // A canceled numeric proposal retains its editable draft in en-slider.
      // This compound control explicitly restores every channel to its accepted color.
      const accepted = this.rgba;
      (event.currentTarget as HTMLElement & {value: number}).value = index === 3 ? Math.round(accepted[3] * 100) : hslMode ? Math.round(this.hsl[index] * 10) / 10 : this.colorValue.space==='display-p3' ? this.colorValue.channels[index] : accepted[index];
    }
  }
  protected override render() {
    const messages=this.effectiveMessages;
    const hexGuidance=messages?.hexGuidance ?? this.invalidMessage;
    const model=this.colorValue, p3=model.space==='display-p3', paint=colorPaint(parseColor(this.preview ?? '') ?? model,this.paintReady && typeof CSS!=='undefined' && CSS.supports('color','color(display-p3 1 0 0)')), approximation=toHex(this.rgba);
    const rgba = this.rgba, hslMode = this.format === 'hsl', hexMode = !['rgb','hsl'].includes(this.format);
    const p3RGB=p3 && this.format==='rgb', locked=p3 && !p3RGB;
    const labels = hslMode ? [this.hueLabel,this.saturationLabel,this.lightnessLabel] : [this.redLabel,this.greenLabel,this.blueLabel].map(label=>p3RGB ? `Display-P3 ${label}` : label);
    const names = hslMode ? ['hue','saturation','lightness'] : ['red','green','blue'];
    const values = hslMode ? this.hsl.map(value => Math.round(value * 10) / 10) : p3RGB ? model.channels.map(value=>Math.round(value*1000)/1000) : rgba.slice(0,3).map(Math.round);
    if (this.alpha) { labels.push(this.alphaLabel); names.push('alpha'); values.push(Math.round(rgba[3] * 100)); }
    return html`<div part="base" role="group" aria-label=${this.label}>
      <div class="summary" part="summary"><span class="preview-frame" part="preview-frame"><span part="preview" aria-hidden="true" style=${`background-color:${paint.fallback};background-color:${paint.value}`}></span></span>
        ${hexMode || this.showHex ? html`<en-text-field id="hex" part="hex-field" exportparts="control:hex,description:hex-description,error:hex-error" size="small" spellcheck="false" autocapitalize="off" autocomplete="off"
          .label=${p3 ? `${this.hexLabel} (${messages?.approximationLabel ?? 'sRGB approximation'})` : this.hexLabel} .value=${p3 || this.draft===this.color ? approximation : this.draft} ?readonly=${p3} ?disabled=${this.disabled}
          .description=${this.invalid ? '' : p3 ? messages?.readOnlyApproximation ?? 'Read-only sRGB approximation. Convert explicitly to edit HEX or HSL.' : !this.color.startsWith('#') ? messages?.editableApproximation ?? 'HEX is an 8-bit approximation. Editing this field replaces the accepted color with that approximation.' : hexGuidance} .error=${this.invalid ? hexGuidance : ''}
          @en-input=${(event: CustomEvent<{value:string;isComposing:boolean}>) => {event.stopPropagation();this.draft=event.detail.value;this.hexComposing=event.detail.isComposing;this.invalid=false;if(!this.hexComposing&&this.hexBlurPending){this.hexBlurPending=false;queueMicrotask(()=>this.acceptHex());}}}
          @en-change=${(event:Event)=>event.stopPropagation()}
          @focusout=${()=>{if(this.hexComposing)this.hexBlurPending=true;else this.acceptHex();}}
          @keydown=${(event: KeyboardEvent) => {if (event.key === 'Enter' && !event.isComposing && !this.hexComposing) {event.preventDefault();event.stopPropagation();this.acceptHex();}}}></en-text-field>` : html`<code part="value">${this.color}</code>`}</div>
      ${this.authorError ? html`<p part="validation-message" role="status">${messages?.invalidColor ?? 'Unsupported color. Use a literal HEX, RGB, HSL, sRGB or Display-P3 color with channels and alpha in range. The accepted color is unchanged.'}</p>` : ''}
      ${p3 ? html`<p part="space">Display-P3 · <code>${this.color}</code></p><p part="gamut-message">${!inGamut(model,'srgb') ? (messages?.outOfGamut ?? 'Outside sRGB gamut. The sRGB approximation clips some channels.') : (messages?.inGamut ?? 'Fits within sRGB gamut.')} ${paint.value===paint.fallback ? (messages?.fallbackPaint ?? 'Showing an sRGB fallback; the Display-P3 value is preserved.') : (messages?.supportedPaint ?? 'Display-P3 paint is supported. Actual appearance depends on your display.')}</p>
        ${locked ? html`<en-button part="conversion" ?disabled=${this.disabled} @click=${()=>this.convertToSRGB()}>${messages?.convertLabel ?? 'Convert to sRGB approximation'}</en-button>` : ''}` : ''}
      <div part="formats"><en-select part="format" label=${this.formatLabel} .value=${hexMode ? 'hex' : this.format} .items=${[{value:'hex',label:'HEX'},{value:'rgb',label:p3 ? 'RGB (Display-P3)' : 'RGB'},{value:'hsl',label:'HSL'}]} ?disabled=${this.disabled}
        @en-change=${(event: CustomEvent<{proposed: ColorFormat}>) => {event.stopPropagation(); this.format = event.detail.proposed;}}></en-select>
        <en-switch part="alpha-toggle" .checked=${this.alpha} ?disabled=${this.disabled} @en-change=${(event: Event) => {event.stopPropagation(); this.alpha = (event.currentTarget as HTMLElement & {checked: boolean}).checked;}}>${this.alphaLabel}</en-switch></div>
      <div part="channels">${this.plane ? html`<en-color-plane part="plane-control" exportparts="plane:plane,thumb:plane-thumb,axes:plane-axes,channel:channel,hue:hue,saturation:saturation,brightness:brightness,alpha:alpha,slider:slider,channel-field:channel-field,channel-input:channel-input,gradient:gradient,channel-error:channel-error" .messages=${messages} .validationText=${this.validationText} .value=${this.color} .label=${this.label} .hueLabel=${this.hueLabel} .saturationLabel=${this.saturationLabel} .brightnessLabel=${this.brightnessLabel} .alphaLabel=${this.alphaLabel} ?alpha=${this.alpha} ?disabled=${this.disabled}
        @en-input=${(event:CustomEvent<{value:string}>)=>{this.preview=event.detail.value;}}
        @en-change=${(event:CustomEvent<{proposed:string;reason:string}>)=>{event.stopPropagation();this.preview=undefined;const outcome=this.change(event.detail.proposed,event.detail.reason);if(outcome==='canceled'||outcome==='superseded'){event.preventDefault();(event.currentTarget as EnColorPlane).value=this.color;}}}></en-color-plane>` : labels.map((label,index) => {
        const max = index === 3 ? 100 : hslMode ? index === 0 ? 360 : 100 : p3RGB ? 1 : 255;
        const stops = p3 && (p3RGB || index===3) ? (index === 3 ? [serializeColor({...model,alpha:0}),serializeColor({...model,alpha:1})] : [0,1].map(n=>{const channels=[...model.channels] as [number,number,number];channels[index]=n;return serializeColor({...model,channels});})) : index === 3 ? [toHex([...rgba.slice(0,3),0] as typeof rgba),toHex([...rgba.slice(0,3),1] as typeof rgba)] :
          Array.from({length: hslMode && index === 0 ? 7 : hslMode && index === 2 ? 3 : 2}, (_,i) => {
            if (hslMode) { const channels: HSL = [...this.hsl]; channels[index] = index === 0 ? i * 60 : index === 2 ? i * 50 : i * 100; return toHex(fromHSL(channels, rgba[3])); }
            const channels: typeof rgba = [...rgba]; channels[index] = i * 255; return toHex(channels);
          });
        return html`<en-color-slider part=${`channel ${names[index]}`} exportparts="control:slider,editor:channel-input,editor-field:channel-field,gradient:gradient,error:channel-error" size="inherit" label=${label} .validationText=${messages?.channels?.[names[index] as ColorChannel] ?? this.validationText} .editorLabel=${messages?.exactValueLabel ?? 'Exact value'}
          .min=${0} .max=${max} .step=${p3RGB && index!==3 ? .001 : hslMode && index !== 3 ? 0.1 : 1} .value=${values[index]} .stops=${stops} ?checkerboard=${index === 3 || rgba[3] < 1}
          ?editable=${this.editableChannels || !hexMode || index === 3} show-value .valueText=${index === 3 || (hslMode && index > 0) ? `${values[index]}%` : hslMode ? `${values[index]}°` : String(values[index])}
          ?disabled=${this.disabled || (locked && index!==3)} @en-change=${(event: CustomEvent<{proposed: number}>) => this.channel(index,event,hslMode)} @en-input=${(event: Event) => event.stopPropagation()}></en-color-slider>`;
      })}</div>
      <slot name="palette"></slot><slot name="recent"></slot>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'en-color-picker': EnColorPicker; } }
