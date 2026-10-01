import { connectionDocument } from './internal/element-registry.js';
import { ScopedContext } from './internal/context-consumer.js';
import { colorMessagesContext, mergeMessageOverrides } from './messages-context.js';
import type {ColorMessages} from './color-picker/messages.js';
import { html, type PropertyValues } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EnElement } from './internal/en-element.js';
import { dispatchChange, dispatchDraftInput } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { colorWheelStyles } from '@en-reve/styles/color-wheel.js';
import { parseColor, serializeColor, createColorValue, colorPaint, type ColorValue } from './color-picker/color-value.js';
import { fromHSV, toHSV, type HSV } from './color-picker/hsv.js';
import type { EnTextField } from './text-field.js';

/**
 * Standalone hue ring. Changes hue within the accepted encoded RGB space while
 * retaining saturation, HSV value and alpha. Not a dependency of en-color-picker.
 * @tagname en-color-wheel
 * @csspart base - Named control group.
 * @csspart label - Visible hue label.
 * @csspart control - Focusable hue slider and pointer surface.
 * @csspart ring - Decorative opaque hue spectrum.
 * @csspart thumb - Hue position marker.
 * @csspart center - Noninteractive center of the ring.
 * @csspart editor-field - Small exact-value field host.
 * @csspart editor - Forwarded exact-value input.
 * @csspart editor-label - Forwarded exact-value label (visually hidden by default).
 * @csspart error - Invalid authored color and exact-value validation feedback.
 * @cssprop --en-color-wheel-size - Preferred wheel diameter, defaults to 14rem, bounded by available width.
 * @cssprop --en-color-wheel-track-size - Ring thickness, defaults to 2rem.
 * @cssprop --en-color-wheel-thumb-size - Hue marker diameter, defaults to 1.5rem.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').DraftInputDetail>} en-input - Pointer preview in detail.value; accepted value stays unchanged until release.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ChangeDetail<string>>} en-change - Cancelable hue proposal on release, key or exact-value edit.
 */
export class EnColorWheel extends EnElement {
  private readonly messageContext = new ScopedContext(this, colorMessagesContext);
 private get effectiveMessages() { return mergeMessageOverrides(this.messageContext.value, this.messages); }
 static override properties = {
    messages: {attribute:false}, validationText: {attribute:"validation-text",useDefault:true},
    value: {noAccessor:true}, colorValue: {attribute:false,noAccessor:true},
    disabled: {type:Boolean,reflect:true}, label: {useDefault:true}, hueLabel: {attribute:'hue-label', useDefault:true},
    draft: {state:true}, invalid: {state:true}, revealError: {state:true}, paintReady: {state:true},
  };
  static override styles = [foundationStyles,blockHostStyles,colorWheelStyles];
  private accepted = '#ff0000';
  private hsv: HSV = [0,100,100];
  private revision = 0;
  private gesture?: {id:number;target:HTMLElement;hsv:HSV;revision:number};
  private declare draft: string | undefined;
  private declare invalid: boolean;
  private declare revealError: boolean;
  private declare paintReady: boolean;
  private composing = false;
  private blurAfterComposition = false;
  /** Accepted literal CSS color; authoritative writes supersede a gesture, including equal-value writes. */
  get value() { return this.accepted; }
  set value(value:string) {
    const parsed = parseColor(value);
    if (!parsed) { this.cancelGesture(); this.invalid=true; return; }
    this.release(); ++this.revision;
    const previous=this.accepted;
    this.accepted=serializeColor(parsed); this.hsv=toHSV(parsed,this.hsv);
    this.invalid=false; this.resetDraft(); this.requestUpdate('value',previous);
    // Equal color writes can still replace an in-progress hue preview.
    this.requestUpdate();
  }
  /** Immutable typed view of the same color. Hue edits never convert its space. */
  get colorValue():ColorValue { return parseColor(this.accepted)!; }
  set colorValue(value:ColorValue) { const parsed=createColorValue(value); if(parsed)this.value=serializeColor(parsed);else {this.cancelGesture();this.invalid=true;} }
  /** Disable pointer, keyboard and exact input. */
  declare disabled:boolean;
  /** Accessible name for the group. */
  declare label:string;
  /** Visible and accessible hue label, also used for the exact input. */
  declare hueLabel:string;
  /** Invalid authored-color translation; replace the object to update. */
  declare messages:Pick<ColorMessages, 'invalidColor'> | undefined;
  /** Localized exact-hue constraint text; never sets invalidity. Empty uses the default. */
  declare validationText:string;
  constructor() {
    super(); this.validationText=''; this.disabled=false; this.label='Color wheel'; this.hueLabel='Hue';
    this.invalid=false; this.revealError=false; this.paintReady=false;
  }
  protected override firstUpdated(changes:PropertyValues) {super.firstUpdated(changes);this.paintReady=true;}
  protected override willUpdate(changes:PropertyValues) {super.willUpdate(changes);if(changes.has('disabled')&&this.disabled){this.cancelGesture();this.resetDraft();}}
  override disconnectedCallback() {this.cancelGesture();this.composing=false;this.blurAfterComposition=false;super.disconnectedCallback();}
  override focus(options?:FocusOptions) {this.renderRoot?.querySelector<HTMLElement>('[part=control]')?.focus(options);}
  private get displayed() {return this.gesture ? fromHSV(this.colorValue,this.hsv) : this.colorValue;}
  private get exactError() {
    if(this.draft===undefined)return '';
    const value=Number(this.draft);
    return !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(this.draft.trim()) || !Number.isFinite(value) || value<0 || value>360 ? this.validationText || 'Enter a hue from 0 to 360 degrees.' : '';
  }
  /** Validate the authored color and exact hue draft. */
  checkValidity() {return this.disabled || !this.invalid && !this.exactError;}
  /** Reveal invalid input and focus its editor. */
  reportValidity() {
    this.revealError=true;
    if(!this.checkValidity()) (this.renderRoot?.querySelector<EnTextField>('en-text-field'))?.focus();
    return this.checkValidity();
  }
  private resetDraft() {this.draft=undefined;this.revealError=false;this.composing=false;this.blurAfterComposition=false;}
  private release() {
    const gesture=this.gesture; this.gesture=undefined;
    if(gesture)connectionDocument(this).removeEventListener('keydown',this.escape,true);
    if(gesture?.target.hasPointerCapture?.(gesture.id))gesture.target.releasePointerCapture(gesture.id);
  }
  private preview(inputType='colorWheel') {dispatchDraftInput(this,{value:serializeColor(this.displayed),isComposing:false,inputType});}
  private cancelGesture() {
    const gesture=this.gesture;if(!gesture)return;
    this.release();if(gesture.revision===this.revision)this.hsv=gesture.hsv;
    this.requestUpdate();this.preview('colorWheelCancel');
  }
  private escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&this.gesture){event.preventDefault();event.stopPropagation();this.cancelGesture();}};
  private cancelPointer(event:PointerEvent) {if(event.pointerId===this.gesture?.id)this.cancelGesture();}
  private point(event:PointerEvent) {
    const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;
    const box=gesture.target.getBoundingClientRect(),x=event.clientX-box.x-box.width/2,y=event.clientY-box.y-box.height/2;
    if(!box.width||!box.height||Math.hypot(x,y)<1)return;
    const hue=(Math.atan2(x,-y)*180/Math.PI+360)%360;
    this.hsv=[Math.round(hue*10)/10,this.hsv[1],this.hsv[2]];
    this.requestUpdate();this.preview();
  }
  private down(event:PointerEvent) {
    if(this.disabled||this.gesture||!event.isPrimary||event.button!==0)return;
    const target=event.currentTarget as HTMLElement,box=target.getBoundingClientRect();
    const inner=target.querySelector<HTMLElement>('[part=center]')!.getBoundingClientRect();
    const x=event.clientX-(box.x+box.width/2),y=event.clientY-(box.y+box.height/2);
    if((x*x+y*y)>box.width*box.width/4 || (inner.width>0 && x*x+y*y<inner.width*inner.width/4))return;
    event.preventDefault();target.focus({preventScroll:true});this.resetDraft();
    this.gesture={id:event.pointerId,target,hsv:[...this.hsv],revision:this.revision};
    target.setPointerCapture(event.pointerId);this.ownerDocument.addEventListener('keydown',this.escape,true);this.point(event);
  }
  private up(event:PointerEvent) {
    const gesture=this.gesture;if(!gesture||event.pointerId!==gesture.id)return;
    this.point(event);if(this.gesture!==gesture)return;
    const hue=this.hsv[0];this.release();this.hsv=gesture.hsv;this.propose(hue);this.preview('colorWheelCommit');
  }
  private propose(hue:number) {
    if(this.disabled)return;
    const previousHSV=this.hsv,nextHSV:HSV=[hue,this.hsv[1],this.hsv[2]],next=serializeColor(fromHSV(this.colorValue,nextHSV));
    const outcome=dispatchChange(this,{previous:this.value,proposed:next,reason:'hue',getRevision:()=>this.revision,
      stage:value=>{this.accepted=value;this.hsv=nextHSV;},rollback:value=>{this.accepted=value;this.hsv=previousHSV;},canCommit:()=>!this.disabled});
    if(outcome==='committed'||outcome==='unchanged'){this.hsv=nextHSV;this.invalid=false;}
    this.resetDraft();this.requestUpdate();
  }
  private key(event:KeyboardEvent) {
    if(this.disabled||event.altKey||event.ctrlKey||event.metaKey||event.isComposing)return;
    const delta=event.key==='ArrowRight'||event.key==='ArrowUp'?1:event.key==='ArrowLeft'||event.key==='ArrowDown'?-1:event.key==='PageUp'?10:event.key==='PageDown'?-10:0;
    if(!delta&&event.key!=='Home'&&event.key!=='End')return;
    event.preventDefault();event.stopPropagation();this.cancelGesture();
    this.propose(event.key==='Home'?0:event.key==='End'?360:Math.min(360,Math.max(0,this.hsv[0]+delta)));
  }
  private acceptExact() {
    if(this.disabled||this.composing)return;
    this.revealError=true;if(this.exactError)return;
    this.propose(Number(this.draft??this.hsv[0]));
  }
  protected override render() {
    const model=this.displayed,hue=this.hsv[0],shown=Math.round(hue*10)/10;
    const supportsP3=this.paintReady&&typeof CSS!=='undefined'&&CSS.supports('color','color(display-p3 1 0 0)');
    const p3=model.space==='display-p3'&&supportsP3&&CSS.supports('background-image','conic-gradient(in display-p3, red, blue)');
    const stops=Array.from({length:7},(_,i)=>colorPaint(fromHSV({...model,alpha:1},[i*60,100,100]),supportsP3));
    const paint=colorPaint(fromHSV({...model,alpha:1},[hue,100,100]),supportsP3);
    return html`<div part="base" role="group" aria-label=${this.label}>
      <span part="label" id="hue-label">${this.hueLabel}</span>
      <div part="control" role="slider" tabindex=${this.disabled?-1:0} aria-labelledby="hue-label" aria-valuemin="0" aria-valuemax="360" aria-valuenow=${shown} aria-valuetext=${`${shown}°`} aria-disabled=${String(this.disabled)}
        style=${styleMap({'--_en-wheel-angle':`${hue}deg`,'--_en-wheel-thumb':paint.value})}
        @keydown=${this.key} @pointerdown=${this.down} @pointermove=${this.point} @pointerup=${this.up} @pointercancel=${this.cancelPointer} @lostpointercapture=${this.cancelPointer}>
        <span part="ring" aria-hidden="true" style=${styleMap({'background-image':`conic-gradient(${p3?'in display-p3, ':''}${stops.map(paint=>p3?paint.value:paint.fallback).join(',')})`})}></span>
        <span part="center" aria-hidden="true"></span><span class="arm" aria-hidden="true"><span part="thumb"></span></span>
      </div>
      <en-text-field part="editor-field" exportparts="control:editor,label:editor-label,error:error" size="small" inputmode="decimal" .label=${this.hueLabel} .value=${this.draft??String(shown)} ?disabled=${this.disabled} .error=${this.revealError?this.exactError:''}
        @en-change=${(event:Event)=>event.stopPropagation()}
        @en-input=${(event:CustomEvent<{value:string;isComposing:boolean}>)=>{event.stopPropagation();this.draft=event.detail.value;this.composing=event.detail.isComposing;this.revealError=false;if(!this.composing&&this.blurAfterComposition){this.blurAfterComposition=false;queueMicrotask(()=>this.acceptExact());}}}
        @focusout=${()=>{if(this.composing)this.blurAfterComposition=true;else this.acceptExact();}}
        @keydown=${(event:KeyboardEvent)=>{if(event.isComposing||this.composing||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='Enter'){event.preventDefault();event.stopPropagation();this.acceptExact();}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.resetDraft();}}}></en-text-field>
      ${this.invalid?html`<p part="error" role="status">${this.effectiveMessages?.invalidColor ?? 'Unsupported color. The accepted color is unchanged.'}</p>`:''}
    </div>`;
  }
}
declare global {interface HTMLElementTagNameMap {'en-color-wheel':EnColorWheel;}}
