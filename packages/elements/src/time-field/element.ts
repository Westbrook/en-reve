import { html, nothing, type PropertyValues } from 'lit';
import { dispatchDraftInput } from '@en-reve/primitives/interactions/events.js';
import { FormFieldElement } from '../forms-private/form-field.js';
import { timeError, timePresentation, timeSeconds, timeString, type TimePrecision, type TimeSegment } from '../internal/time.js';

/**
 * Localized wall-time entry with canonical local values, independent of dates and timezones.
 * @tagname en-time-field
 * @slot label - Visible label; falls back to label.
 * @slot description - Supporting text; falls back to description.
 * @csspart field - Field layout.
 * @csspart label - Visible label.
 * @csspart control - Native text editor for localized time.
 * @csspart focus-frame - Shared input focus frame.
 * @csspart description - Supporting text.
 * @csspart error - Validation feedback.
 * @csspart format-hint - Example of the current localized format.
 * @cssprop --en-control-background - Shared field background.
 * @cssprop --en-control-radius - Shared field corner radius.
 * @cssprop --en-input-background - Editor fill, refining the shared control background.
 * @cssprop --en-input-color - Editor foreground, refining the shared control color.
 * @cssprop --en-input-inline-padding - Editor inline padding, refining shared control padding.
 * @fires {import('../events.js').DraftInputEvent} en-input - Raw localized draft and composition state; does not change accepted form data.
 * @fires {import('../events.js').FieldChangeEvent} en-change - Cancelable canonical time change on blur, Enter or stepping; author writes take precedence.
 */
export class EnTimeField extends FormFieldElement {
  static override properties = {...FormFieldElement.properties,
    locale:{},hourCycle:{attribute:'hour-cycle'},precision:{},step:{type:Number},min:{},max:{},wrap:{type:Boolean,reflect:true},
    readOnly:{type:Boolean,attribute:'readonly',reflect:true},autocomplete:{},formatLabel:{attribute:'format-label'},invalidLabel:{attribute:'invalid-label'},configurationLabel:{attribute:'configuration-label'},
  };
  /** Explicit locale, shared by SSR and client. */
  declare locale:string;
  /** auto follows locale; 12 or 24 selects a display cycle without changing the value. */
  declare hourCycle:'auto'|'12'|'24';
  declare precision:TimePrecision;
  /** Positive whole seconds; minute precision requires a multiple of 60. */
  declare step:number;
  declare min:string;
  declare max:string;
  /** Permit min > max as an interval across midnight. */
  declare wrap:boolean;
  declare readOnly:boolean;
  declare autocomplete:string;
  declare formatLabel:string;
  declare invalidLabel:string;
  declare configurationLabel:string;
  private dirty=false;
  private draft='';
  private draftError='';
  private composing=false;
  private seenRevision=-1;
  private initialized=false;
  private editPresentation:ReturnType<typeof timePresentation>|undefined;
  protected override willUpdate(changed:PropertyValues){super.willUpdate(changed);if(!this.initialized && this.seenRevision === -1)this.seenRevision=this.valueRevision;}
  constructor(){super();this.locale='en-US';this.hourCycle='auto';this.precision='minute';this.step=60;this.min='';this.max='';this.wrap=false;this.readOnly=false;this.autocomplete='';this.formatLabel='Example';this.invalidLabel='Enter a valid time in the displayed format.';this.configurationLabel='Time format is unavailable. Check locale and hour-cycle.';}
  private get presentation(){try{return timePresentation(this.locale,this.hourCycle,this.precision);}catch{return undefined;}}
  private get options(){return {precision:this.precision,step:this.step,min:this.min,max:this.max,wrap:this.wrap,required:this.required};}
  private acceptedError(value=this.value){return this.error || (!this.presentation ? this.configurationLabel : timeError(value,this.options));}
  protected override get visibleError(){return this.error || this.draftError || super.visibleError;}
  protected override get describedBy(){return `${super.describedBy} format-hint`;}
  protected override get submissionValue(){return this.dirty || this.acceptedError() ? null : this.value;}
  protected override validateAcceptedValue(){
    const constraint=this.draftError || (this.dirty ? this.invalidLabel : this.acceptedError());
    const message=this.error || (constraint ? this.validationText || constraint : '');
    return {flags:message ? (this.required && !this.value && !this.dirty && !this.error ? {valueMissing:true} : {customError:true}) : {},message,anchor:this.controlNode ?? undefined};
  }
  protected override canCommitValue(value:string){return !this.isDisabled && !this.readOnly && !this.acceptedError(value);}
  protected override reconcile(){
    if(this.seenRevision !== this.valueRevision){this.seenRevision=this.valueRevision;this.dirty=false;this.draftError='';}
    if(this.dirty || this.composing)return;
    this.draft=this.presentation?.format(this.value) ?? this.value;
    if(this.initialized && this.controlNode && this.controlNode.value !== this.draft)this.controlNode.value=this.draft;
  }
  protected override updated(changed:PropertyValues){
    // Adopt edits made in the server-rendered input before hydration, unless an author write won.
    if(!this.initialized && this.controlNode){this.initialized=true;const control=this.controlNode as HTMLInputElement;if(control.value !== control.defaultValue && this.seenRevision === this.valueRevision){this.valueDefaults.markDirty();this.draft=control.value;this.dirty=true;this.editPresentation=this.presentation;}}
    super.updated(changed);
  }
  /** Discard uncommitted text and restore the accepted time. */
  cancelEdit():void {this.dirty=false;this.draftError='';this.editPresentation=undefined;this.composing=false;this.reconcile();this.syncForm();this.requestUpdate();}
  /** Commit a valid draft; invalid text stays visible and is never rounded. */
  commit():void {
    if(!this.dirty || this.composing || this.isDisabled || this.readOnly)return;
    const proposed=(this.editPresentation ?? this.presentation)?.parse(this.draft);
    const message=proposed === undefined ? this.invalidLabel : this.acceptedError(proposed);
    if(message){this.draftError=message;this.syncForm();this.requestUpdate();return;}
    this.dirty=false;this.draftError='';this.requestValue(proposed!,'change');this.reconcile();this.syncForm();this.requestUpdate();
  }
  /** Advance by one configured step, without crossing a bound or rounding invalid text. */
  stepUp():void {this.move(1);}
  /** Retreat by one configured step. */
  stepDown():void {this.move(-1);}
  private move(direction:1|-1, segment?:TimeSegment){
    const revision=this.valueRevision;
    if(this.isDisabled || this.readOnly || this.composing)return;
    let from=this.value;
    if(this.dirty){
      const parsed=(this.editPresentation ?? this.presentation)?.parse(this.draft);
      if(parsed === undefined || this.acceptedError(parsed)){this.commit();return;}
      from=parsed;
    }
    if(this.error || !this.presentation || timeError(from,{...this.options,required:false}))return;
    const current=timeSeconds(from);
    const unit=segment === 'hour'?3600:segment === 'minute'?60:1;
    const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
    // Whole selected units preserve smaller fields while remaining on the configured step grid.
    const amount=segment?unit/gcd(unit,this.step)*this.step:this.step;
    let seconds=current === undefined ? timeSeconds(this.min) ?? 0
      : segment === 'dayPeriod' ? (current+43200)%86400 : current+direction*amount;
    if(this.wrap)seconds=(seconds%86400+86400)%86400;
    if(seconds<0 || seconds>=86400)return;
    const proposed=timeString(seconds,this.precision);if(this.acceptedError(proposed))return;
    this.dirty=false;this.draftError='';
    this.requestValue(proposed,direction===1?'increment':'decrement');this.reconcile();this.syncForm();this.requestUpdate();
    const input=this.controlNode as HTMLInputElement|null;
    if(segment && revision === this.valueRevision && input && this.shadowRoot?.activeElement === input){
      const range=this.presentation?.segments(input.value).find(part=>part.type === segment);
      if(range)input.setSelectionRange(range.start,range.end);
    }
  }
  private input(event:InputEvent){
    if(this.isDisabled || this.readOnly)return;
    if(!this.dirty)this.editPresentation=this.presentation;
    this.draft=(event.currentTarget as HTMLInputElement).value;this.dirty=true;this.draftError='';
    dispatchDraftInput(this,{value:this.draft,isComposing:this.composing || event.isComposing,inputType:event.inputType || ''});
    this.syncForm();this.requestUpdate();
  }
  private keydown(event:KeyboardEvent){
    if(event.isComposing || this.composing)return;
    if(event.key==='Escape'){event.preventDefault();this.cancelEdit();}
    if(event.key==='Enter'){event.preventDefault();this.commit();}
    if((event.key==='ArrowUp' || event.key==='ArrowDown') && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey){event.preventDefault();
      const input=event.currentTarget as HTMLInputElement;
      const parts=(this.dirty?this.editPresentation:this.presentation)?.segments(input.value) ?? [];
      const caret=input.selectionStart ?? 0;
      // A separator belongs to its preceding segment; a multi-segment selection uses its leading edge.
      const part=parts.find(part=>caret>=part.start && caret<part.end) ?? [...parts].reverse().find(part=>part.end<=caret) ?? parts[0];
      this.move(event.key==='ArrowUp'?1:-1,part?.type ?? 'hour');}
  }
  protected override renderControl(){return html`<input id="control" class="en-input en-time-input" part="control" type="text" dir="auto" lang=${this.locale}
    value=${this.presentation?.format(this.defaultControlValue) ?? this.defaultControlValue} placeholder=${this.placeholder || nothing} autocomplete=${this.autocomplete || nothing}
    ?disabled=${this.isDisabled} ?readonly=${this.readOnly} ?required=${this.required} aria-describedby=${this.describedBy} aria-invalid=${this.controlAriaInvalid}
    @input=${this.input} @change=${()=>this.commit()} @blur=${()=>this.commit()} @keydown=${this.keydown}
    @compositionstart=${()=>{this.composing=true;}} @compositionend=${()=>{this.composing=false;if(!this.dirty)this.reconcile();}}>`;}
  protected override render(){return html`${super.render()}<div id="format-hint" part="format-hint" class="en-description">${this.presentation ? `${this.formatLabel}: ${this.presentation.format(this.precision === 'second'?'13:30:15':'13:30')}` : this.configurationLabel}</div>`;}
}

declare global { interface HTMLElementTagNameMap { 'en-time-field': EnTimeField; } }
