import type {DefinitionLoadOptions} from '../lazy-loader.js';
import {loadDatePickerCalendar} from '../internal/date-picker-feature.js';
import {collectDefinitions, registerDefinitions, type ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import { dateRange, emptyRange, validateRange, type DateRange, type UnavailableDate } from '../internal/date-range.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { guard } from 'lit/directives/guard.js';
import { css, html, nothing, type PropertyValues } from 'lit';
import { calendarConfiguration } from '../internal/calendar-adapter.js';
import { EnDateInput } from '../date-input.js';
import type { EnCalendar } from '../calendar.js';
import type { EnDialog } from '../dialog.js';
import { parseDate, dateInRange } from '@en-reve/primitives/interactions/calendar.js';

/**
 * Native date editing with a themed single-date calendar dialog.
 * @tagname en-date-picker
 * @cssprop --en-input-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-hover-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-radius - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @csspart calendar-summary - Formatted accepted date in the display calendar.
 * @csspart edit-hint - Gregorian native-edit route explanation.
 * @csspart picker-layout - Input and calendar trigger layout.
 * @csspart trigger - Calendar trigger button control.
 * @csspart calendar - Calendar host.
 * @csspart calendar-day - Calendar day controls, forwarded from the calendar.
 * @csspart calendar-selected - Selected date control.
 * @csspart calendar-status - Polite loading and recovery message in deferred mode.
 * @csspart range-summary - Formatted accepted pair.
 * @csspart range-fields - Gregorian draft endpoint inputs.
 * @csspart range-actions - Clear, Cancel and Apply controls.
 * @csspart range-error - Range rejection message.
 * @csspart calendar-range-start - Forwarded start endpoint.
 * @csspart calendar-range-end - Forwarded end endpoint.
 * @csspart calendar-in-range - Forwarded selected interval.
 * @csspart calendar-preview - Forwarded draft interval preview.
 * @csspart calendar-range-band - Continuous interval background.
 * @csspart calendar-range-band-start - Chronological start cap.
 * @csspart calendar-range-band-end - Chronological end cap.
 * @csspart calendar-range-band-preview - Uncommitted interval background.
 * @csspart surface - Dialog surface.
 * @csspart close - Dialog dismiss button control.
 * @fires {import('../events.js').DatePickerChangeEvent} en-change - Single cancelable tentative field value; internal calendar and dialog events are encapsulated.
 */
export class EnDatePicker extends EnDateInput {
  static override properties = { ...EnDateInput.properties,
    selection: {reflect:true,noAccessor:true}, calendarLoading:{attribute:'calendar-loading',reflect:true,noAccessor:true}, loadingLabel:{attribute:'loading-label'}, loadErrorLabel:{attribute:'load-error-label'}, loadRetryErrorLabel:{attribute:'load-retry-error-label'}, rangeValue:{attribute:false,noAccessor:true}, defaultRangeValue:{attribute:false,noAccessor:true}, startName:{attribute:'start-name'}, endName:{attribute:'end-name'}, unavailableDate:{attribute:false,noAccessor:true}, applyLabel:{attribute:'apply-label',useDefault:true}, cancelLabel:{attribute:'cancel-label',useDefault:true}, clearLabel:{attribute:'clear-label',useDefault:true}, startLabel:{attribute:'start-label', useDefault:true}, endLabel:{attribute:'end-label', useDefault:true}, calendar: {}, calendarLabel: { attribute:'calendar-label' , useDefault:true}, unsupportedLabel: { attribute:'unsupported-label' , useDefault:true}, editLabel: { attribute:'edit-label' , useDefault:true}, locale: {}, today: {}, firstDayOfWeek: { type:Number, attribute:'first-day-of-week' },
    pickerLabel: { attribute:'picker-label' , useDefault:true}, closeLabel: { attribute:'close-label' , useDefault:true},
    previousLabel: { attribute:'previous-label' , useDefault:true}, nextLabel: { attribute:'next-label' , useDefault:true},
  };
  static override styles = [...EnDateInput.styles, css`
    .en-date-picker-layout { display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--en-space-2);align-items:center;min-inline-size:0; }
    .en-field-focus-frame { min-inline-size:0; }
    input::-webkit-calendar-picker-indicator { display:none; }
    en-dialog { --en-overlay-max-inline-size:26rem; }
    en-calendar { inline-size:100%; }
    .range-fields {display:grid;grid-template-columns:1fr 1fr;gap:var(--en-space-2);margin-block-end:var(--en-space-3)} .range-fields label {display:grid;gap:var(--en-space-1);min-inline-size:0} .range-fields input {inline-size:100%;min-inline-size:0;box-sizing:border-box} .range-actions {display:flex;justify-content:flex-end;gap:var(--en-space-2);margin-block-start:var(--en-space-3)}
    en-calendar::part(base) { inline-size:100%; }
    .en-picker-status { min-block-size:1.5em;margin:0; }
  `];
  #selection: 'single' | 'range' = 'single';
  get selection(): 'single' | 'range' { return this.#selection; }
  set selection(value: 'single' | 'range') {
    if (value === 'range' && this.calendarLoading === 'deferred') throw new RangeError('Deferred calendar supports single selection only.');
    const old = this.#selection; this.#selection = value; this.requestUpdate('selection', old);
  }
  #calendarLoading: 'eager' | 'deferred' = 'eager';
  /** Construction-time opt-in. Range mode requires eager calendar delivery. */
  get calendarLoading(): 'eager' | 'deferred' { return this.#calendarLoading; }
  set calendarLoading(value: 'eager' | 'deferred') {
    const next = value === 'deferred' ? 'deferred' : 'eager';
    if (next === this.#calendarLoading) return;
    if (this.hasUpdated) throw new Error('Set calendarLoading before the first update.');
    if (next === 'deferred' && this.selection === 'range') throw new RangeError('Deferred calendar supports single selection only.');
    const old = this.#calendarLoading; this.#calendarLoading = next; this.requestUpdate('calendarLoading', old);
    if (this.isConnected) {
      this.removeEventListener('keydown', this.pendingKeydown);
      if (next === 'deferred') this.addEventListener('keydown', this.pendingKeydown);
    }
  }
  /** Localized polite announcement while the optional calendar loads. */
  declare loadingLabel: string;
  /** Localized recovery message; native date editing remains available. */
  declare loadErrorLabel: string;
  /** Localized repeated-failure message. Keep {attempt} so successive retries differ. */
  declare loadRetryErrorLabel: string;
  private calendarLoadFailures = 0;
  private get calendarErrorMessage(): string {
    return this.calendarLoadFailures > 1
      ? this.loadRetryErrorLabel.replaceAll('{attempt}', String(this.calendarLoadFailures - 1))
      : this.loadErrorLabel;
  }
  private calendarMounted = false;
  private featureRegistrationError: unknown;
  private pickerStatus: 'idle' | 'loading' | 'error' = 'idle';
  private pendingOpen?: {abort: AbortController; promise: Promise<void>};
  private pickerRegistry(): CustomElementRegistry {
    const registry = this.getRenderCreationRegistry();
    if (!registry) throw new Error('Missing picker render registry.');
    return registry;
  }
  #assertCalendarConstruction(registry: CustomElementRegistry, doc: Document, definitions: readonly ElementDefinition[]): void {
    const sourceGlobal = globalThis.customElements;
    const sourceElement = globalThis.HTMLElement;
    if (!sourceGlobal || !sourceElement || registry !== doc.defaultView?.customElements || registry === sourceGlobal) return;
    let all: readonly ElementDefinition[];
    try { all = collectDefinitions(definitions); }
    catch { return; } // The registration branch owns and caches invalid definition graphs.
    const calendar = all.find(definition => definition.tagName === 'en-calendar');
    // Eager hints can supply other constructors. Restrict this policy to the
    // fixed loader's definitions that inherit this module's native element base.
    const elementClass = calendar?.elementClass;
    if (typeof elementClass !== 'function' || !sourceElement.prototype.isPrototypeOf(elementClass.prototype)) return;
    const namesByClass = new Map<CustomElementConstructor, string>();
    for (const definition of all) {
      const previousName = namesByClass.get(definition.elementClass);
      if (previousName && previousName !== definition.tagName) return;
      namesByClass.set(definition.elementClass, definition.tagName);
      const existing = registry.get(definition.tagName);
      if (existing && existing !== definition.elementClass) return;
    }
    // Conflicts above retain the existing permanent registration-error path.
    // This environment check stays retriable before registration or mounting.
    throw new Error("Deferred calendar construction is unsupported for a source-realm picker in another document's global registry. Keep its native scoped registry or create a new picker from destination-realm modules.");
  }
  /** Fetch/evaluate the optional feature, without registering or constructing it. */
  async preparePicker(options: DefinitionLoadOptions = {}): Promise<void> {
    if (this.calendarLoading !== 'deferred') return;
    await this.updateComplete;
    await loadDatePickerCalendar(options);
  }
  private cancelOpen(): void {
    this.pendingOpen?.abort.abort(); this.pendingOpen = undefined;
    if (this.pickerStatus === 'loading') { this.pickerStatus = 'idle'; this.requestUpdate(); }
  }
  override connectedCallback(): void { super.connectedCallback(); if (this.calendarLoading === 'deferred') this.addEventListener('keydown',this.pendingKeydown); }
  override disconnectedCallback(): void { this.cancelOpen(); this.removeEventListener('keydown',this.pendingKeydown); super.disconnectedCallback(); }
  override adoptedCallback(oldDocument?: Document, newDocument?: Document): void { this.cancelOpen(); super.adoptedCallback(oldDocument, newDocument); }
  override formDisabledCallback(disabled: boolean): void {
    if (disabled) this.cancelOpen();
    super.formDisabledCallback(disabled);
    // Attribute reflection can invoke this callback after render has read the
    // old effective disabled state. Refresh the nested trigger after that update.
    if (!disabled) queueMicrotask(() => this.requestUpdate());
  }
  private async openFromTrigger(): Promise<void> {
    try { await this.showPicker(); } catch { /* Accessible status and native editing provide recovery. */ }
  }
  private pendingKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.pendingOpen) { this.hidePicker(); event.preventDefault(); }
  }

  declare startName: string;
  declare endName: string;
  private unavailable:UnavailableDate|undefined;
  get unavailableDate():UnavailableDate|undefined {return this.unavailable;}
  set unavailableDate(value:UnavailableDate|undefined) {const old=this.unavailable;if(old === value)return;this.unavailable=value;this.availabilityCache?.clear();this.requestUpdate('unavailableDate',old);}
  declare applyLabel: string;
  declare cancelLabel: string;
  /** Localized range-clear action label; removing clear-label restores the English default. */
  declare clearLabel: string;
  declare startLabel: string;
  declare endLabel: string;
  private acceptedRange: DateRange = emptyRange();
  private pickerDraft: DateRange = emptyRange();
  private defaultRange: DateRange = emptyRange();
  private rangeDirty = false;
  /** Property-only reset default for range mode. Pristine ranges follow default changes. */
  get defaultRangeValue(): DateRange { return this.defaultRange; }
  set defaultRangeValue(value: DateRange) {
    const next = dateRange(value);
    if (!next) return;
    const previous = this.defaultRange;
    this.defaultRange = next;
    if (!this.rangeDirty) { this.rangeValue = next; this.rangeDirty = false; }
    this.requestUpdate('defaultRangeValue', previous);
  }
  private rangeRevision=0;
  private rangeError='';
  private availabilityCache=new Map<string,string>();
  get rangeValue():DateRange {return this.acceptedRange;}
  set rangeValue(value:DateRange) {const next=dateRange(value);if(!next)return;this.rangeDirty=true;const old=this.acceptedRange;this.acceptedRange=next;this.pickerDraft=next;++this.rangeRevision;this.rangeError='';this.syncForm();this.requestUpdate('rangeValue',old);if(this.calendarElement)this.calendarElement.rangeValue=next;}
  invalidateAvailability():void {this.availabilityCache.clear();this.calendarElement?.invalidateAvailability();this.syncForm();this.requestUpdate();}
  private validateRange(value:DateRange):string {
    const key=JSON.stringify([value,this.calendar,this.locale,this.min,this.max,this.step,this.defaultValue]);
    if(!this.availabilityCache.has(key))this.availabilityCache.set(key,validateRange(value,{...this.rangeOptions,unavailableDate:this.unavailableDate}));
    return this.availabilityCache.get(key)!;
  }
  private get rangeOptions() {return {calendar:this.calendar,locale:this.locale,min:this.min,max:this.max,step:this.step,stepBase:this.min || this.defaultValue || '1970-01-01'};}
  protected override get submissionValue():string|FormData|null {
    if(this.selection !== 'range')return super.submissionValue;
    if(!this.rangeValue.start || !this.rangeValue.end || this.validateRange(this.rangeValue))return null;
    const data=new FormData();if(this.startName)data.append(this.startName,this.rangeValue.start);if(this.endName)data.append(this.endName,this.rangeValue.end);return data;
  }
  protected override get submissionState():string {return this.selection === 'range' ? JSON.stringify(this.rangeValue) : super.submissionState;}
  override formResetCallback():void {this.cancelOpen();super.formResetCallback();if(this.selection === 'range'){this.rangeValue=this.defaultRangeValue;this.rangeDirty=false;this.hidePicker();}}
  override formStateRestoreCallback(state:string|File|FormData|null,mode:'restore'|'autocomplete'):void {
    if(this.selection !== 'range'){super.formStateRestoreCallback(state,mode);return;}
    if(typeof state === 'string')try {this.rangeValue=JSON.parse(state);}catch { /* Ignore foreign restoration data. */ }
  }
  protected override validateAcceptedValue() {
    if(this.selection !== 'range')return super.validateAcceptedValue();
    const empty=!this.rangeValue.start && !this.rangeValue.end;
    const message=this.error || (empty && !this.required ? '' : this.validateRange(this.rangeValue));
    return {anchor:this.renderRoot?.querySelector('en-button#picker-trigger')?.shadowRoot?.querySelector<HTMLButtonElement>('button') ?? undefined,flags:message ? (this.required && (!this.rangeValue.start || !this.rangeValue.end) && !this.error ? {valueMissing:true} : {customError:true}) : {},message};
  }
  private applyRange():void {
    const proposed=this.calendarElement?.draftRange;if(!proposed || this.isDisabled || this.readOnly)return;
    const error=this.validateRange(proposed);if(error){this.rangeError=error;this.requestUpdate();return;}
    this.rangeDirty=true;
    const outcome=dispatchChange(this,{previous:this.rangeValue,proposed,reason:'range',getRevision:()=>this.rangeRevision,
      stage:value=>{this.acceptedRange=value;this.pickerDraft=value;this.syncForm();this.requestUpdate();},rollback:value=>{this.acceptedRange=value;this.pickerDraft=value;this.syncForm();this.requestUpdate();},
      canCommit:value=>!this.isDisabled && !this.readOnly && !this.validateRange(value)});
    if(outcome === 'committed' || outcome === 'unchanged')this.hidePicker();else {if(this.calendarElement)this.calendarElement.rangeValue=this.rangeValue;this.rangeError='Range change canceled.';this.requestUpdate();}
  }
  private editRange(event:Event,endpoint:'start'|'end'):void {
    this.rangeDirty=true;
    const calendar=this.calendarElement;if(!calendar)return;
    const value=(event.target as HTMLInputElement).value;
    const pair={...calendar.draftRange,[endpoint]:value};
    if(endpoint === 'start' && pair.end && pair.start > pair.end)pair.end='';
    calendar.setRangeDraft(pair);this.pickerDraft=calendar.draftRange;this.rangeError='';this.requestUpdate();
  }
  /** Clear both endpoints through a cancelable atomic change. */
  clearRange():void {if(this.isDisabled || this.readOnly)return;this.rangeDirty=true;const proposed=emptyRange();dispatchChange(this,{previous:this.rangeValue,proposed,reason:'clear',getRevision:()=>this.rangeRevision,stage:value=>{this.acceptedRange=value;this.pickerDraft=value;this.syncForm();this.requestUpdate();},rollback:value=>{this.acceptedRange=value;this.pickerDraft=value;this.syncForm();this.requestUpdate();},canCommit:()=>!this.isDisabled && !this.readOnly});if(this.calendarElement)this.calendarElement.rangeValue=this.rangeValue;this.hidePicker();}
  private get rangeSummary():string {const configuration=calendarConfiguration(this.calendar,this.locale,this.rangeValue.start);if(configuration.error)return this.unsupportedLabel || configuration.error;const format=(value:string)=>{const day=parseDate(value);return day && configuration.adapter ? configuration.adapter.format(day,{year:'numeric',month:'short',day:'numeric',era:this.calendar === 'buddhist'?'short':undefined}) : '…';};return this.rangeValue.start || this.rangeValue.end ? `${format(this.rangeValue.start)} – ${format(this.rangeValue.end)}` : 'No range selected';}
  protected override willUpdate(changed:PropertyValues):void {super.willUpdate(changed);if(changed.has('unavailableDate'))this.availabilityCache.clear();if(this.isDisabled || this.readOnly)this.cancelOpen();}
  /** Display calendar: gregory (default) or modern buddhist. Native input and submitted value remain Gregorian ISO. */
  declare calendar: string;
  /** Override the calendar and era identification for translation. */
  declare calendarLabel: string;
  /** Override unsupported configuration text. */
  declare unsupportedLabel: string;
  /** Explanation of the native Gregorian edit route when using another display calendar. */
  declare editLabel: string;
  /** BCP47 locale for calendar labels; native editing uses browser preferences. */
  declare locale: string;
  /** Application-supplied ISO current date for deterministic calendar delivery. */
  declare today: string;
  /** First weekday: Sunday=0 through Saturday=6. */
  declare firstDayOfWeek: number;
  declare pickerLabel: string;
  declare closeLabel: string;
  declare previousLabel: string;
  declare nextLabel: string;
  constructor() {
    super();this.loadingLabel='Loading calendar…';this.loadErrorLabel='Calendar could not load. Try again, reload the page, or enter a date directly.';this.loadRetryErrorLabel='Calendar retry {attempt} failed. Reload the page or enter a date directly.';this.selection='single';this.startName='';this.endName='';this.applyLabel='Apply range';this.cancelLabel='Cancel';this.clearLabel='Clear range';this.startLabel='Start date';this.endLabel='End date';this.calendar='gregory';this.calendarLabel='';this.unsupportedLabel='';this.editLabel='Edit Gregorian date (ISO YYYY-MM-DD value; input layout follows your browser).';this.locale='en';this.today='';this.firstDayOfWeek=0;this.pickerLabel='Choose date';this.closeLabel='Close calendar';this.previousLabel='Previous month';this.nextLabel='Next month';
  }
  override focus(options?:FocusOptions):void {if(this.selection === 'range')this.renderRoot?.querySelector<HTMLElement>('#picker-trigger')?.focus(options);else super.focus(options);}
  private get dialog() { return this.renderRoot?.querySelector<EnDialog>('en-dialog'); }
  private get calendarElement() { return this.renderRoot?.querySelector<EnCalendar>('en-calendar'); }
  private syncCalendar(calendar: EnCalendar): void {
    calendar.value=this.value;calendar.rangeValue=this.rangeValue;this.pickerDraft=this.rangeValue;this.rangeError='';calendar.month=(this.selection === 'range' ? this.rangeValue.start : this.value) || this.today || this.min;
  }
  private async showEagerPicker(): Promise<void> {
    await this.updateComplete;
    if (this.isDisabled || this.readOnly) return;
    const dialog=this.dialog, calendar=this.calendarElement;
    if (!dialog || !calendar) return;
    this.syncCalendar(calendar);
    this.requestUpdate();dialog.show();await dialog.updateComplete;await calendar.updateComplete;
    if (dialog.open) calendar.focus();
  }
  /**
   * Load/open the calendar and focus its active date. Concurrent calls share work.
   * Canceled or disabled/readonly openings resolve without opening. Load,
   * registration, and unsupported construction-ownership errors reject and leave
   * native editing available.
   */
  showPicker(): Promise<void> {
    if (this.calendarLoading === 'eager') return this.showEagerPicker();
    if (this.pendingOpen) return this.pendingOpen.promise;
    const abort = new AbortController(), doc = this.ownerDocument;
    const focus = () => { let el: Element | null = doc.activeElement; while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement; return el; };
    const origin = focus();
    const valid = () => !abort.signal.aborted && this.isConnected && this.ownerDocument === doc && !this.isDisabled && !this.readOnly;
    const wait = <T>(work: Promise<T>) => new Promise<T>((resolve, reject) => {
      const cancel = () => reject(new DOMException('Opening canceled', 'AbortError'));
      if (abort.signal.aborted) { cancel(); return; }
      abort.signal.addEventListener('abort', cancel, {once:true});
      work.then(resolve,reject).finally(()=>abort.signal.removeEventListener('abort',cancel));
    });
    const pending = {abort, promise: undefined as unknown as Promise<void>};
    this.pendingOpen = pending;
    pending.promise = (async () => {
      try {
        await wait(this.updateComplete);
        if (!valid()) return;
        if (!this.calendarMounted) {
          const registry = this.pickerRegistry();
          if (this.featureRegistrationError) throw this.featureRegistrationError;
          const retry = this.pickerStatus === 'error';
          this.pickerStatus = 'loading'; this.requestUpdate();
          const definitions = await wait(loadDatePickerCalendar({retry}));
          if (!valid() || focus() !== origin) return;
          this.#assertCalendarConstruction(registry, doc, definitions);
          try { registerDefinitions(registry,definitions); } catch(error) {this.featureRegistrationError=error;throw error;}
          this.calendarMounted = true; this.requestUpdate(); await wait(this.updateComplete);
        }
        if (!valid() || focus() !== origin) return;
        const dialog=this.dialog, calendar=this.calendarElement;
        if (!dialog || !calendar) return;
        this.syncCalendar(calendar);
        this.calendarLoadFailures=0;this.pickerStatus='idle';this.requestUpdate();
        await wait(this.updateComplete); await wait(calendar.updateComplete);
        if (!valid() || focus() !== origin) return;
        dialog.show();await wait(dialog.updateComplete);await wait(calendar.updateComplete);
        if (valid() && dialog.open) calendar.focus();
      } catch(error) {
        if (abort.signal.aborted) return;
        ++this.calendarLoadFailures;this.pickerStatus='error';this.requestUpdate();
        throw error;
      } finally {
        if (this.pendingOpen === pending) {this.pendingOpen=undefined;if(this.pickerStatus==='loading'){this.pickerStatus='idle';this.requestUpdate();}}
      }
    })();
    return pending.promise;
  }
  /** Dismiss the calendar without changing the field. */
  hidePicker(): void { this.cancelOpen(); const calendar=this.calendarElement;if(calendar && this.selection === 'range')calendar.rangeValue=this.rangeValue;calendar?.cancelRange();this.dialog?.hide(); }
  private dialogChanged(event: CustomEvent<{proposed:boolean}>): void {
    event.stopPropagation();
    if (event.detail.proposed && this.calendarLoading === 'deferred' && !this.calendarMounted) {
      event.preventDefault(); void this.openFromTrigger(); return;
    }
    if (!event.detail.proposed) {this.calendarElement?.cancelRange();return;}
    const calendar=this.calendarElement;
    if (calendar) { this.syncCalendar(calendar); }
    this.requestUpdate();
    queueMicrotask(async () => {
      await this.dialog?.updateComplete;await calendar?.updateComplete;
      if (this.dialog?.open) calendar?.focus();
    });
  }
  private calendarTransaction = false;
  private confirm(event: CustomEvent<{action:string;data:string}>): void {
    event.stopPropagation();
    if (event.detail.action !== 'confirm' || this.isDisabled || this.readOnly) return;
    const proposed=event.detail.data;
    this.calendarTransaction=true;
    try { this.requestValue(proposed,'calendar'); } finally { this.calendarTransaction=false; }
    if (this.calendarElement) this.calendarElement.value=this.value;
    if (this.value === proposed && this.canCommitValue(proposed)) this.hidePicker();
  }
  protected override canCommitValue(value: string): boolean {
    if (this.isDisabled || this.readOnly) return false;
    if (!this.calendarTransaction) return true;
    const date=parseDate(value);
    if (this.isDisabled || this.readOnly || !date || !dateInRange(date,this.min,this.max)) return false;
    const input=this.controlNode?.cloneNode(true) as HTMLInputElement | undefined;
    if (!input) return true;
    input.min=this.min;input.max=this.max;input.step=String(this.step);input.required=this.required;input.value=value;input.setCustomValidity('');return input.validity.valid;
  }
  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if ((this.isDisabled || this.readOnly) && this.dialog?.open) this.dialog.open=false;
    const trigger = this.renderRoot.querySelector<import('../button.js').EnButton>('#picker-trigger');
    // The error target can be inserted after the nested button has updated.
    // Re-resolve through its existing cross-root description forwarding.
    trigger?.requestUpdate();
  }
  protected override get describedBy(): string { return `${super.describedBy}${this.selection !== 'range' && this.calendar !== 'gregory' ? ' calendar-edit-hint' : ''}`; }
  protected override renderControlFrame() {
    if(this.selection === 'range')return html`<div class="en-date-picker-layout" part="picker-layout"><div part="range-summary">${this.rangeSummary}</div><en-button id="picker-trigger" variant="secondary" aria-label=${`${this.querySelector?.('[slot=label]')?.textContent?.trim() || this.label || this.pickerLabel}: ${this.rangeSummary}`} aria-describedby=${this.describedBy} aria-invalid=${this.controlAriaInvalid} ?disabled=${this.isDisabled || this.readOnly} exportparts="control:trigger">${this.pickerLabel}</en-button></div>`;
    return html`<div class="en-date-picker-layout" part="picker-layout">${super.renderControlFrame()}
      <en-button size="inherit" id="picker-trigger" variant="secondary" icon-only ?disabled=${this.isDisabled || this.readOnly} exportparts="control:trigger"><en-icon slot="prefix" size="inherit" name="calendar"></en-icon><span class="en-sr-only">${this.pickerLabel}${this.value ? `, ${this.value}` : ''}</span></en-button>
    </div>${this.calendar !== 'gregory' ? html`<p part="edit-hint" id="calendar-edit-hint">${this.editLabel}</p>` : nothing}`;
  }
  protected override render() {
    const configuration=calendarConfiguration(this.calendar,this.locale,this.selection === 'range' ? this.rangeValue.start : this.value);
    const date=parseDate(this.value);
    const summary=this.selection === 'range' ? this.rangeSummary : date && configuration.adapter ? configuration.adapter.format(date,{year:'numeric',month:'long',day:'numeric',era:'short'}) : '';
    return html`${super.render()}${this.calendar !== 'gregory' ? html`<p part="calendar-summary">${this.calendarLabel || (this.calendar === 'buddhist' ? 'Buddhist calendar · BE' : this.calendar)}: ${configuration.error ? this.unsupportedLabel || configuration.error : summary || 'No date selected'}</p>` : nothing}<en-dialog for="picker-trigger" label=${this.pickerLabel} close-label=${this.closeLabel} presentation="responsive" exportparts="surface,close" @en-change=${this.dialogChanged}>
      ${this.selection === 'range' ? html`<div class="range-fields" part="range-fields"><label>${this.startLabel}<span class="en-field-focus-frame"><input class="en-input" type="date" aria-describedby=${this.rangeError ? 'range-edit-hint range-error' : 'range-edit-hint'} aria-invalid=${this.rangeError ? 'true' : nothing} aria-label=${this.startLabel} .value=${this.pickerDraft.start} min=${this.min || nothing} max=${this.max || nothing} step=${this.step} ?disabled=${this.isDisabled || this.readOnly} @change=${(event:Event)=>this.editRange(event,'start')}></span></label><label>${this.endLabel}<span class="en-field-focus-frame"><input class="en-input" type="date" aria-describedby=${this.rangeError ? 'range-edit-hint range-error' : 'range-edit-hint'} aria-invalid=${this.rangeError ? 'true' : nothing} aria-label=${this.endLabel} .value=${this.pickerDraft.end} min=${this.min || nothing} max=${this.max || nothing} step=${this.step} ?disabled=${this.isDisabled || this.readOnly} @change=${(event:Event)=>this.editRange(event,'end')}></span></label></div><p part="edit-hint" id="range-edit-hint">${this.editLabel}</p>` : nothing}
      ${this.calendarLoading === 'eager' || this.calendarMounted ? html`<en-calendar .selection=${this.selection} .rangeValue=${guard([this.rangeValue],()=>this.rangeValue)} .unavailableDate=${this.unavailableDate} .deferRangeCommit=${this.selection === 'range'} size="inherit" part="calendar" exportparts="day:calendar-day,selected:calendar-selected,range-start:calendar-range-start,range-end:calendar-range-end,in-range:calendar-in-range,preview:calendar-preview,range-band:calendar-range-band,range-band-start:calendar-range-band-start,range-band-end:calendar-range-band-end,range-band-preview:calendar-range-band-preview" .calendar=${this.calendar} .calendarLabel=${this.calendarLabel} .unsupportedLabel=${this.unsupportedLabel} .value=${this.value} .step=${this.step} .stepBase=${this.min || this.defaultValue || '1970-01-01'} .min=${this.min} .max=${this.max} .today=${this.today} .locale=${this.locale} .firstDayOfWeek=${this.firstDayOfWeek} .label=${this.pickerLabel} .previousLabel=${this.previousLabel} .nextLabel=${this.nextLabel} @en-change=${(event: Event) => event.stopPropagation()} @en-action=${(event:CustomEvent<{action:string;data:string}>)=>{if(this.selection === 'range'){event.stopPropagation();this.pickerDraft=this.calendarElement?.draftRange ?? this.rangeValue;if(this.pickerDraft.start !== this.rangeValue.start || this.pickerDraft.end !== this.rangeValue.end)this.rangeDirty=true;this.requestUpdate();}else this.confirm(event);}}></en-calendar>` : nothing}
      ${this.selection === 'range' ? html`<div role="status" part="range-error" id="range-error">${this.rangeError}</div><div class="range-actions" part="range-actions"><en-button variant="secondary" ?disabled=${this.isDisabled || this.readOnly} @click=${this.clearRange}>${this.clearLabel}</en-button><en-button variant="secondary" @click=${()=>this.hidePicker()}>${this.cancelLabel}</en-button><en-button ?disabled=${!this.pickerDraft.start || !this.pickerDraft.end || this.isDisabled || this.readOnly} @click=${this.applyRange}>${this.applyLabel}</en-button></div>` : nothing}
    </en-dialog>${this.calendarLoading === 'deferred' ? html`<p class="en-picker-status" role="status" aria-live="polite" part="calendar-status">${this.pickerStatus === 'loading' ? this.loadingLabel : this.pickerStatus === 'error' ? this.calendarErrorMessage : nothing}</p>` : nothing}`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-date-picker': EnDatePicker; } }
