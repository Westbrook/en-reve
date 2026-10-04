import { html, type PropertyValues } from 'lit';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import type { EnTextField } from './text-field.js';
import { normalizeNumberBounds, normalizeRangeValue } from './slider/number.js';
import { styleMap } from 'lit/directives/style-map.js';
import { EnSlider } from './slider.js';
import { parseColor, colorPaint } from './color-picker/color-value.js';
import { colorSliderStyles } from '@en-reve/styles/color-slider.js';

/**
 * A native range handle over an application-supplied color gradient. Inherits the
 * numeric value, form and cancelable change API of en-slider; the exact-value editor is a small en-text-field with decimal input and range/step validation.
 * Visible description content describes both the range and exact-value input.
 * The nested input association requires hydration and ariaDescribedByElements support.
 * @cssprop --en-slider-track-size - Fallback gradient thickness only when color-slider-track-size is unset.
 * @cssprop --en-slider-thumb-size - Fallback hollow handle diameter only when color-slider-thumb-size is unset.
 * @cssprop --en-slider-track-radius - Fallback gradient corner radius after color-slider-radius.
 * @cssprop --en-slider-track-background - Optional underlay behind transparent gradient/checker paint; never a value segment.
 * @cssprop --en-slider-disabled-track-background - Disabled gradient underlay; never a value segment.
 * @cssprop --en-slider-value-percent - Inherited numeric presentation state; color stops still paint the entire channel gradient.
 * @cssprop --en-slider-fill-background - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @cssprop --en-slider-hover-fill-background - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @cssprop --en-slider-pressed-fill-background - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @cssprop --en-slider-hover-pressed-fill-background - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @cssprop --en-slider-disabled-fill-background - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @cssprop --en-slider-disabled-fill-opacity - Inapplicable to the color channel: stops define a continuous gradient, with no selected value segment.
 * @tagname en-color-slider
 * @csspart error - Application error and forwarded exact-value validation message.
 * @csspart editor-field - Small exact-value en-text-field host.
 * @csspart editor - Forwarded native text input.
 * @csspart editor-label - Forwarded exact-value editor label, combining the setting name and editor-label qualifier when editable.
 * @csspart gradient - Wrapper supplying gradient paint to the native track.
 * @cssprop --en-color-slider-track-size - Gradient track thickness; precedes slider-track-size, then 1.5rem.
 * @cssprop --en-color-slider-thumb-size - Handle diameter; precedes slider-thumb-size, then 1.75rem.
 * @cssprop --en-color-slider-radius - Track corners; precedes slider-track-radius, then the shared control radius.
 * @cssprop --en-color-slider-checker-size - Checker tile size; defaults to .5rem.
 * @cssprop --en-color-slider-checker-light - Light checker paint; defaults to white.
 * @cssprop --en-color-slider-checker-dark - Dark checker paint; defaults to #b8b8b8.
 */
export class EnColorSlider extends EnSlider {
  static override properties = {...EnSlider.properties, stops: {attribute: false}, checkerboard: {type: Boolean, reflect: true}, exactDraft: {state:true}, revealError: {state:true}, paintReady: {state:true}};
  static override styles = [...EnSlider.styles, colorSliderStyles];
  /** Two to 64 evenly spaced bounded literal CSS colors (hex, RGB, HSL, sRGB or Display-P3), from minimum to maximum. Invalid lists use black-to-white. */
  declare stops: readonly string[];
  /** Paint checker tiles behind the gradient to reveal transparency. */
  declare checkerboard: boolean;
  constructor() { super(); this.paintReady=false; this.stops = ['#000000', '#ffffff']; this.checkerboard = false; }
  private declare paintReady: boolean;
  protected override firstUpdated(changed: PropertyValues) {super.firstUpdated(changed);this.paintReady=true;}
  private declare exactDraft: string | undefined;
  private declare revealError: boolean;
  private labelObserver?: MutationObserver;
  private exactDescriptionObserver?: MutationObserver;
  private observedExactRoot?: ShadowRoot;

  // Like en-button, use element references: an ID in the outer root cannot be
  // resolved by the nested native input. Keep the real slot target, not a text
  // copy, so assignment, hidden content and subsequent edits stay authoritative.
  private syncExactDescription = () => {
    const root = this.exactField?.shadowRoot;
    const control = root?.querySelector<HTMLInputElement>('#control');
    if (!control || !('ariaDescribedByElements' in control)) return;
    const references = [this.renderRoot.querySelector('#description'), root?.querySelector('#description'), root?.querySelector('#error')]
      .filter((element): element is Element => Boolean(element));
    const previous = control.ariaDescribedByElements;
    if (previous?.length !== references.length || references.some((element, i) => previous[i] !== element)) {
      control.ariaDescribedByElements = references;
    }
  };
  protected override updated(changes: PropertyValues) {
    super.updated(changes);
    const field = this.exactField;
    void field?.updateComplete.then(() => {
      if (!this.isConnected || field !== this.exactField) return;
      const root = field.shadowRoot;
      if (root && root !== this.observedExactRoot) {
        this.exactDescriptionObserver?.disconnect();
        this.observedExactRoot = root;
        this.exactDescriptionObserver = new MutationObserver(this.syncExactDescription);
        // The field can change its own validation independently of its parent.
        this.exactDescriptionObserver.observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:['aria-describedby']});
      }
      this.syncExactDescription();
    });
    if (!field) {
      this.exactDescriptionObserver?.disconnect();
      this.observedExactRoot = undefined;
    }
  }
  override connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
    if (typeof MutationObserver !== 'undefined') {
      this.labelObserver = new MutationObserver(() => this.requestUpdate());
      this.labelObserver.observe(this,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['slot']});
    }
  }
  private get exactLabel() {
    const nodes = Array.from(this.childNodes ?? []);
    const text = (slot: string) => nodes.filter(node => node.nodeType === 1 ? ((node as Element).getAttribute('slot') ?? '') === slot : slot === '').map(node => node.textContent ?? '').join(' ').trim();
    return `${text('label') || text('') || this.label} ${text('editor-label') || this.editorLabel}`.trim();
  }
  private composing = false;
  private blurAfterComposition = false;
  override disconnectedCallback() { super.disconnectedCallback(); this.labelObserver?.disconnect(); this.labelObserver=undefined; this.exactDescriptionObserver?.disconnect(); this.observedExactRoot=undefined; this.composing=false; this.blurAfterComposition=false; }
  private get exactField() { return this.renderRoot?.querySelector<EnTextField>('#exact-field'); }
  protected override onValueWrite() {
    super.onValueWrite(); this.exactDraft = String(this.value); this.revealError = false;
    if (this.exactField) this.exactField.value = this.exactDraft;
  }
  protected override willUpdate(changes: PropertyValues) {
    super.willUpdate(changes);
    if ((changes.has('editable') && !this.editable) || (changes.has('disabled') && this.disabled)) this.onValueWrite();
  }
  protected override validateForm(): FormValidation {
    if (!this.editable) return {flags:{}};
    const text = this.exactDraft ?? String(this.value), value = Number(text);
    const bounds = normalizeNumberBounds(this.min,this.max,this.step);
    const missing = !text.trim();
    const bad = !missing && (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text.trim()) || !Number.isFinite(value));
    const under = !missing && !bad && value < bounds.min, over = !missing && !bad && value > bounds.max;
    const mismatch = !missing && !bad && !under && !over && Math.abs(normalizeRangeValue(value,bounds)-value) > Math.max(1,Math.abs(value))*1e-10;
    const message = missing ? 'Enter a value.' : bad ? 'Enter a number.' : under || over ? `Enter a value from ${bounds.min} to ${bounds.max}.` : mismatch ? `Use increments of ${bounds.step} from ${bounds.min}.` : '';
    return {flags:{valueMissing:missing,badInput:bad,rangeUnderflow:under,rangeOverflow:over,stepMismatch:mismatch},message:message ? this.validationText || message : '',anchor:this.exactField ?? undefined};
  }
  override reportValidity() {
    this.revealError = true;
    const valid = super.reportValidity();
    if (!valid) { if (this.exactField) this.exactField.focus(); else this.focus(); }
    this.requestUpdate();
    return valid;
  }
  private acceptExact() {
    if (this.effectiveDisabled || this.composing) return;
    this.revealError = true;
    if (Object.values(this.validateForm().flags).some(Boolean)) return;
    const value = Number(this.exactDraft ?? this.value);
    if (value === this.value) this.onValueWrite(); else this.propose(value,'change');
  }
  protected override renderExactEditor() {
    const message = this.validateForm().message || '';
    return html`<en-text-field id="exact-field" class="en-range-editor" part="editor-field" exportparts="control:editor,label:editor-label,error:error"
      size="small" inputmode="decimal" .label=${this.exactLabel} .value=${this.exactDraft ?? String(this.value)}
      ?disabled=${this.effectiveDisabled} .error=${this.revealError ? message : ''}
      @en-change=${(event:Event)=>event.stopPropagation()}
      @en-input=${(event:CustomEvent<{value:string;isComposing:boolean}>)=>{
        this.exactDraft=event.detail.value;this.composing=event.detail.isComposing;this.revealError=false;
        this.formController?.sync();
        if (!this.composing && this.blurAfterComposition) {this.blurAfterComposition=false;queueMicrotask(()=>this.acceptExact());}
      }}
      @focusout=${()=>{if(this.composing)this.blurAfterComposition=true;else this.acceptExact();}}
      @keydown=${(event:KeyboardEvent)=>{
        if(event.isComposing || this.composing || event.altKey || event.ctrlKey || event.metaKey)return;
        if(event.key==='Enter'){event.preventDefault();event.stopPropagation();this.acceptExact();}
        else if(event.key==='Escape'){event.preventDefault();this.onValueWrite();}
      }}></en-text-field>`;
  }
  protected override render() {
    const colors = Array.isArray(this.stops) && this.stops.length >= 2 && this.stops.length <= 64 ? this.stops.map(parseColor) : [];
    const safe = colors.length && colors.every(Boolean) ? colors.map(color=>colorPaint(color!,this.paintReady && typeof CSS!=='undefined' && CSS.supports('color','color(display-p3 1 0 0)'))) : [colorPaint(parseColor('#000')!),colorPaint(parseColor('#fff')!)];
    return html`<div part="gradient" style=${styleMap({'--_en-color-gradient-fallback': `linear-gradient(to right, ${safe.map(c=>c.fallback).join(',')})`, '--_en-color-gradient-fallback-rtl': `linear-gradient(to left, ${safe.map(c=>c.fallback).join(',')})`, '--_en-color-gradient-fallback-vertical': `linear-gradient(to top, ${safe.map(c=>c.fallback).join(',')})`, '--_en-color-gradient': `linear-gradient(to right, ${safe.map(c=>c.value).join(',')})`, '--_en-color-gradient-rtl': `linear-gradient(to left, ${safe.map(c=>c.value).join(',')})`, '--_en-color-gradient-vertical': `linear-gradient(to top, ${safe.map(c=>c.value).join(',')})`})}>${super.render()}</div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'en-color-slider': EnColorSlider; } }
