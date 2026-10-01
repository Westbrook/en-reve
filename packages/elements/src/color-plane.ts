import { connectionDocument } from './internal/element-registry.js';
import { ScopedContext } from './internal/context-consumer.js';
import { colorMessagesContext, mergeMessageOverrides } from './messages-context.js';
import type {ColorChannel, ColorMessages} from './color-picker/messages.js';
import { html, type PropertyValues } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EnElement } from './internal/en-element.js';
import { dispatchChange, dispatchDraftInput } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { colorPlaneStyles } from '@en-reve/styles/color-picker.js';
import { parseColor, serializeColor, createColorValue, colorPaint, type ColorValue } from './color-picker/color-value.js';
import { fromHSV, toHSV, type HSV } from './color-picker/hsv.js';
import type { EnColorSlider } from './color-slider.js';

/**
 * Saturation/value pointer plane with equivalent native Hue, Saturation and Value
 * sliders and small exact-value fields. HSV coordinates belong to the accepted
 * encoded RGB space, so Display-P3 editing never silently converts to sRGB.
 * @cssprop --en-color-plane-thumb-pressed-scale - Thumb-only held geometry; reduced motion retains rest geometry.
 * @cssprop --en-color-plane-thumb-press-duration - Thumb-only held geometry; reduced motion retains rest geometry.
 * @cssprop --en-color-plane-thumb-release-duration - Thumb-only held geometry; reduced motion retains rest geometry.
 * @tagname en-color-plane
 * @csspart channel-error - Forwarded exact channel validation messages.
 * @csspart base - Named control group.
 * @csspart plane - Pointer plane, intentionally absent from the accessibility tree; use equivalent sliders.
 * @csspart thumb - Plane's decorative position marker.
 * @csspart axes - Visible axis description.
 * @csspart channels - Equivalent HSV and optional alpha controls.
 * @csspart channel - Each equivalent slider host.
 * @csspart hue - Hue slider host.
 * @csspart saturation - Saturation slider host.
 * @csspart brightness - HSV Value slider host.
 * @csspart alpha - Alpha slider host.
 * @csspart slider - Forwarded native range control.
 * @csspart channel-field - Small exact-value field host.
 * @csspart channel-input - Forwarded exact-value input.
 * @csspart gradient - Forwarded slider gradient wrapper.
 * @csspart error - Invalid authored value feedback.
 * @cssprop --en-color-plane-block-size - Plane height, defaults to 12rem.
 * @cssprop --en-color-plane-radius - Plane radius, defaults to the shared control radius.
 * @cssprop --en-color-plane-thumb-size - Position marker diameter, defaults to 1.25rem.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').DraftInputDetail>} en-input - Gesture preview (value is the draft CSS color); cancel restores the accepted preview.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<string>>} en-change - One cancelable proposal per completed plane gesture or equivalent channel edit.
 */
export class EnColorPlane extends EnElement {
  private readonly messageContext = new ScopedContext(this, colorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties={messages:{attribute:false},validationText:{attribute:"validation-text",useDefault:true},value:{noAccessor:true},colorValue:{attribute:false,noAccessor:true},alpha:{type:Boolean},disabled:{type:Boolean,reflect:true},label:{useDefault:true},hueLabel:{attribute:'hue-label', useDefault:true},saturationLabel:{attribute:'saturation-label', useDefault:true},brightnessLabel:{attribute:'brightness-label', useDefault:true},alphaLabel:{attribute:'alpha-label', useDefault:true},paintReady:{state:true},invalid:{state:true}};
  static override styles=[foundationStyles,blockHostStyles,colorPlaneStyles];
  private accepted='#000000';
  private revision=0;
  private hsv: HSV=[0,0,0];
  private gesture?: {id:number;target:HTMLElement;value:string;hsv:HSV;revision:number};
  private declare paintReady:boolean;
  private declare invalid:boolean;
  /** Accepted literal CSS color. Author writes cancel active gestures without en-change; invalid writes retain accepted color and emit an en-input reset preview when interrupting a gesture. */
  get value() {return this.accepted;}
  set value(value:string) {const parsed=parseColor(value);if(!parsed){this.cancelGesture();this.invalid=true;return;}this.release();++this.revision;const previous=this.accepted;this.accepted=serializeColor(parsed);this.hsv=toHSV(parsed,this.hsv);this.invalid=false;this.requestUpdate('value',previous);}
  /** Typed immutable view of the same accepted color. */
  get colorValue():ColorValue {return parseColor(this.accepted)!;}
  set colorValue(value:ColorValue) {const parsed=createColorValue(value);if(parsed)this.value=serializeColor(parsed);else {this.cancelGesture();this.invalid=true;}}
  /** Expose alpha editing without removing stored transparency when hidden. */
  declare alpha:boolean;
  /** Partial invalid-color and per-channel translations; replace the object to update. */
  declare messages:ColorMessages | undefined;
  /** Fallback constraint text for every numeric channel; never sets invalidity. */
  declare validationText:string;
  /** Disable pointer and equivalent channel controls. */
  declare disabled:boolean;
  /** Accessible name for the complete group. */
  declare label:string;
  /** Localized hue label. */
  declare hueLabel:string;
  /** Localized saturation label. */
  declare saturationLabel:string;
  /** Localized HSV value label, distinct from HSL lightness. */
  declare brightnessLabel:string;
  /** Localized alpha label. */
  declare alphaLabel:string;
  constructor(){super();this.validationText="";this.alpha=false;this.disabled=false;this.label='Color plane';this.hueLabel='Hue';this.saturationLabel='Saturation';this.brightnessLabel='Value';this.alphaLabel='Alpha';this.paintReady=false;this.invalid=false;}
  protected override firstUpdated(changes:PropertyValues){super.firstUpdated(changes);this.paintReady=true;}
  protected override willUpdate(changes:PropertyValues){super.willUpdate(changes);if(changes.has('disabled')&&this.disabled)this.cancelGesture();}
  override disconnectedCallback(){this.cancelGesture();super.disconnectedCallback();}
  override focus(options?:FocusOptions){this.renderRoot.querySelector<EnColorSlider>('en-color-slider')?.focus(options);}
  /** Validate authored color and exact numeric drafts. */
  checkValidity(){return this.disabled || !this.invalid && [...this.renderRoot.querySelectorAll<EnColorSlider>('en-color-slider')].every(slider=>slider.checkValidity());}
  /** Reveal and focus the first invalid numeric draft. */
  reportValidity(){if(this.disabled)return true;const invalid=[...this.renderRoot.querySelectorAll<EnColorSlider>('en-color-slider')].find(slider=>!slider.checkValidity());if(invalid)return invalid.reportValidity();return !this.invalid;}
  private get displayed(){return this.gesture ? fromHSV(this.colorValue,this.hsv) : this.colorValue;}
  private release(){const gesture=this.gesture;this.gesture=undefined;if(gesture)connectionDocument(this).removeEventListener('keydown',this.escape,true);if(gesture?.target.hasPointerCapture?.(gesture.id))gesture.target.releasePointerCapture(gesture.id);}
  private emitPreview(value:string,inputType='colorPlane'){dispatchDraftInput(this,{value,isComposing:false,inputType});}
  private escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&this.gesture){event.preventDefault();event.stopPropagation();this.cancelGesture();}};
  private cancelGesture(){const gesture=this.gesture;if(!gesture)return;this.release();if(gesture.revision===this.revision)this.hsv=gesture.hsv;this.requestUpdate();this.emitPreview(this.value,'colorPlaneCancel');}
  private cancelPointer(event:PointerEvent){if(event.pointerId===this.gesture?.id)this.cancelGesture();}
  private point(event:PointerEvent){const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;const box=gesture.target.getBoundingClientRect();if(!box.width||!box.height)return;const rtl=getComputedStyle(this).direction==='rtl';let saturation=Math.min(1,Math.max(0,(event.clientX-box.left)/box.width));if(rtl)saturation=1-saturation;this.hsv=[this.hsv[0],saturation*100,(1-Math.min(1,Math.max(0,(event.clientY-box.top)/box.height)))*100];this.requestUpdate();this.emitPreview(serializeColor(this.displayed));}
  private down(event:PointerEvent){if(this.disabled||this.gesture||!event.isPrimary||event.button!==0)return;event.preventDefault();const target=event.currentTarget as HTMLElement;this.gesture={id:event.pointerId,target,value:this.value,hsv:[...this.hsv],revision:this.revision};target.setPointerCapture(event.pointerId);this.ownerDocument.addEventListener('keydown',this.escape,true);this.point(event);}
  private up(event:PointerEvent){const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;this.point(event);if(this.gesture!==gesture)return;const hsv=this.hsv,next=serializeColor(this.displayed);this.release();this.hsv=gesture.hsv;this.propose(next,'plane',hsv);this.emitPreview(this.value,'colorPlaneCommit');}
  private propose(next:string,reason:string,hsv?:HSV){if(this.disabled)return 'canceled';const previousHSV=this.hsv;const outcome=dispatchChange(this,{previous:this.value,proposed:next,reason,getRevision:()=>this.revision,stage:value=>{this.accepted=value;},rollback:value=>{this.accepted=value;this.hsv=previousHSV;},canCommit:()=>!this.disabled});if(outcome==='committed'||outcome==='unchanged'){this.hsv=hsv??toHSV(this.colorValue,this.hsv);this.invalid=false;}this.requestUpdate();return outcome;}
  private channel(index:number,event:CustomEvent<{proposed:number}>){event.stopPropagation();this.cancelGesture();const next=[...this.hsv] as [number,number,number];if(index<3)next[index]=event.detail.proposed;const model=index===3 ? {...this.colorValue,alpha:event.detail.proposed/100} : fromHSV(this.colorValue,next);const outcome=this.propose(serializeColor(model),['hue','saturation','brightness','alpha'][index],next);if(outcome==='canceled'||outcome==='superseded'){event.preventDefault();(event.currentTarget as EnColorSlider).value=index===3 ? this.colorValue.alpha*100 : this.hsv[index];}}
  protected override render(){
    const model=this.displayed,hsv=this.hsv,supportsP3=this.paintReady&&typeof CSS!=='undefined'&&CSS.supports('color','color(display-p3 1 0 0)'),hue=fromHSV({...model,alpha:1},[hsv[0],100,100]),paint=colorPaint(hue,supportsP3),p3=model.space==='display-p3'&&supportsP3&&CSS.supports('background-image','linear-gradient(to right in display-p3, white, red)');
    const gradient=`linear-gradient(to right${p3 ? ' in display-p3' : ' in srgb'}, ${p3 ? 'color(display-p3 1 1 1)' : '#fff'}, ${p3 ? paint.value : paint.fallback})`;
    const labels=[this.hueLabel,this.saturationLabel,this.brightnessLabel],names=['hue','saturation','brightness'];if(this.alpha){labels.push(this.alphaLabel);names.push('alpha');}
    return html`<div part="base" role="group" aria-label=${this.label}>
      <div part="plane" aria-hidden="true" style=${styleMap({'--_en-plane-gradient':gradient,'--_en-plane-fallback':`linear-gradient(to right,#fff,${paint.fallback})`,'--_en-plane-hue':paint.value,'--_en-plane-x':`${hsv[1]}%`,'--_en-plane-y':`${100-hsv[2]}%`})} @pointerdown=${this.down} @pointermove=${this.point} @pointerup=${this.up} @pointercancel=${this.cancelPointer} @lostpointercapture=${this.cancelPointer}><span part="thumb"></span></div>
      <p part="axes">${this.saturationLabel}: 0–100% · ${this.brightnessLabel}: 100–0%${model.space==='display-p3' ? ' · Display-P3' : ''}</p>
      <div part="channels">${labels.map((label,index)=>{const value=index===3 ? model.alpha*100 : hsv[index],max=index===0 ? 360 : 100;const stops=Array.from({length:index===0 ? 7 : 2},(_,i)=>{if(index===3)return serializeColor({...model,alpha:i});const coordinate=(index===0 ? [hsv[0],100,100] : [...hsv]) as [number,number,number];coordinate[index]=index===0 ? i*60 : i*100;return serializeColor(fromHSV(model,coordinate));});return html`<en-color-slider part=${`channel ${names[index]}`} exportparts="control:slider,editor:channel-input,editor-field:channel-field,gradient:gradient,error:channel-error" size="inherit" .label=${label} .validationText=${this.effectiveMessages?.channels?.[names[index] as ColorChannel] ?? this.validationText} .editorLabel=${this.effectiveMessages?.exactValueLabel ?? 'Exact value'} .min=${0} .max=${max} .step=${.1} .value=${Math.round(value*10)/10} .stops=${stops} .valueText=${`${Math.round(value*10)/10}${index===0 ? '°' : '%'}`} editable show-value ?checkerboard=${model.alpha<1||index===3} ?disabled=${this.disabled} @en-change=${(event:CustomEvent<{proposed:number}>)=>this.channel(index,event)} @en-input=${(event:Event)=>event.stopPropagation()}></en-color-slider>`;})}</div>
      ${this.invalid ? html`<p part="error" role="status">${this.effectiveMessages?.invalidColor ?? 'Unsupported color. The accepted color is unchanged.'}</p>` : ''}
    </div>`;
  }
}
declare global {interface HTMLElementTagNameMap {'en-color-plane':EnColorPlane;}}
