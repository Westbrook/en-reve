import { dateRange, emptyRange, validateRange, type DateRange, type UnavailableDate } from '../internal/date-range.js';
import { html, nothing, type PropertyValues } from 'lit';
import { calendarConfiguration } from '../internal/calendar-adapter.js';
import { EnElement } from '../internal/en-element.js';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange, dispatchAction } from '@en-reve/primitives/interactions/events.js';
import { parseDate, formatDate, dateOnStep, clampDate, dateInRange, monthInRange, weekdayLabels } from '@en-reve/primitives/interactions/calendar.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { calendarStyles } from '@en-reve/styles/calendar.js';

/**
 * A single-date calendar with Gregorian or modern Buddhist presentation; navigation changes focus without selecting.
 * @cssprop --en-calendar-pressed-scale - calendar held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-calendar-pressed-offset - calendar held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-calendar-press-duration - calendar held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-calendar-release-duration - calendar held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-calendar-pressed-shadow - calendar held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-calendar
 * @slot previous - Noninteractive previous-month icon content.
 * @slot next - Noninteractive next-month icon content.
 * @csspart base - Calendar layout.
 * @csspart header - Month navigation layout.
 * @csspart previous - Previous month action.
 * @csspart next - Next month action.
 * @csspart heading - Localized month/year and polite announcement.
 * @csspart calendar-label - Visible calendar and era identification.
 * @csspart configuration - Unsupported calendar message; no date grid is delivered.
 * @csspart grid - Calendar grid.
 * @csspart weekday - Localized weekday heading.
 * @csspart day - Date action; unavailable dates have aria-disabled.
 * @csspart selected - Selected date action.
 * @csspart range-start - Draft/accepted range start date.
 * @csspart range-end - Draft/accepted range end date.
 * @csspart in-range - Dates in the selected inclusive interval.
 * @csspart preview - Potential interval while choosing the end date.
 * @csspart range-band - Decorative continuous interval fill behind date buttons.
 * @csspart range-band-start - Band cap at the chronological start.
 * @csspart range-band-end - Band cap at the chronological end.
 * @csspart range-band-preview - Uncommitted interval band.
 * @csspart range-status - Polite endpoint, completion and rejection feedback.
 * @cssprop --en-option-background - Broad single-date paint; explicit state hooks refine it.
 * @cssprop --en-option-color - Broad single-date foreground.
 * @cssprop --en-option-font-weight - Single-date weight.
 * @cssprop --en-option-selected-font-weight - Selected single-date weight.
 * @cssprop --en-option-rest-background - Rest single-date background; range painting retains its specialized contract.
 * @cssprop --en-option-rest-color - Rest single-date color; range painting retains its specialized contract.
 * @cssprop --en-option-selected-background - Selected single-date background; range painting retains its specialized contract.
 * @cssprop --en-option-selected-color - Selected single-date color; range painting retains its specialized contract.
 * @cssprop --en-option-hover-background - Hover single-date background; range painting retains its specialized contract.
 * @cssprop --en-option-hover-color - Hover single-date color; range painting retains its specialized contract.
 * @cssprop --en-option-pressed-background - Pressed single-date background; range painting retains its specialized contract.
 * @cssprop --en-option-pressed-color - Pressed single-date color; range painting retains its specialized contract.
 * @cssprop --en-option-disabled-background - Disabled single-date background; range painting retains its specialized contract.
 * @cssprop --en-option-disabled-color - Disabled single-date color; range painting retains its specialized contract.
 * @cssprop --en-calendar-range-background - Inclusive interval fill.
 * @cssprop --en-calendar-range-endpoint-background - Optional endpoint fill override; transparent by default to share the interval band.
 * @cssprop --en-calendar-range-preview-background - Uncommitted interval preview fill.
 * @csspart today - Today date action, when supplied.
 * @cssprop --en-calendar-inline-size - Preferred calendar width, capped by the available space; defaults to 22rem.
 * @cssprop --en-calendar-day-size - Preferred square date target size, constrained by the column width; shared target minimum remains enforced.
 * @cssprop --en-calendar-hover-opacity - Hover tint strength from zero to one; default 0.10. Set zero only when supplying distinct state fills.
 * @cssprop --en-calendar-pressed-opacity - Pressed tint strength from zero to one; default 0.16.
 * @cssprop --en-calendar-gap - Calendar cell gap.
 * @cssprop --en-calendar-day-radius - Date corner radius; defaults to option radius.
 * @fires {import('../events.js').CalendarActionEvent} en-action - Noncancelable notification: confirm carries an ISO date; range-draft carries DateRange after the draft changes.
 * @fires {import('../events.js').CalendarChangeEvent} en-change - Cancelable tentative selection: date carries ISO strings; range carries DateRange endpoints.
 */
export class EnCalendar extends EnElement {
  static override properties = {
    selection: { reflect:true }, rangeValue: { attribute:false, noAccessor:true }, unavailableDate: {attribute:false,noAccessor:true}, deferRangeCommit: {type:Boolean,attribute:false},
    step: { type: Number }, stepBase: { attribute:'step-base' }, value: { noAccessor: true }, month: {}, today: {}, min: {}, max: {}, locale: {}, calendar: {}, calendarLabel: { attribute: 'calendar-label' }, unsupportedLabel: { attribute: 'unsupported-label' },
    firstDayOfWeek: { type: Number, attribute: 'first-day-of-week' },
    label: {}, previousLabel: { attribute: 'previous-label' }, nextLabel: { attribute: 'next-label' },
    disabled: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, calendarStyles];
  private readonly model = createValueModel('');
  private readonly signals = new SignalController(this, () => this.model.view.get());
  private revision = 0;
  declare selection: 'single' | 'range';
  private unavailable: UnavailableDate | undefined;
  get unavailableDate():UnavailableDate|undefined {return this.unavailable;}
  set unavailableDate(value:UnavailableDate|undefined) {const old=this.unavailable;if(old === value)return;this.unavailable=value;this.availabilityCache?.clear();this.dayAvailability?.clear();this.requestUpdate('unavailableDate',old);}
  /** Keep completed selections as drafts until an enclosing picker applies them. */
  declare deferRangeCommit: boolean;
  private acceptedRange: DateRange = emptyRange();
  private rangeDraft: DateRange = emptyRange();
  private rangeRevision = 0;
  private preview = '';
  private rangeMessage = '';
  private availabilityCache = new Map<string,string>();
  private dayAvailability = new Map<string,boolean>();
  private unavailableOn=(value:string):boolean=>{if(!this.unavailableDate)return false;if(!this.dayAvailability.has(value))this.dayAvailability.set(value,this.unavailableDate(value));return this.dayAvailability.get(value)!;};
  get rangeValue(): DateRange { return this.acceptedRange; }
  set rangeValue(value: DateRange) {
    const next=dateRange(value); if (!next) return;
    const old=this.acceptedRange; this.acceptedRange=next; this.rangeDraft=next; ++this.rangeRevision;
    this.preview=''; this.rangeMessage=''; this.requestUpdate('rangeValue',old);
  }
  get draftRange(): DateRange { return this.rangeDraft; }
  /** Set an uncommitted draft for composed range controls; accepted rangeValue stays unchanged. */
  setRangeDraft(value:DateRange):void {const next=dateRange(value);if(!next)return;this.rangeDraft=next;this.preview='';this.rangeMessage='';this.requestUpdate();}
  /** Revalidate after mutating state captured by unavailableDate. Replacing the predicate also invalidates it. */
  invalidateAvailability(): void { this.availabilityCache.clear(); this.dayAvailability.clear(); this.requestUpdate(); }
  cancelRange(): void { this.rangeDraft=this.rangeValue; this.preview=''; this.rangeMessage='Range selection canceled.'; this.requestUpdate(); dispatchAction(this,{action:'range-draft',data:this.rangeDraft}); }
  private rangeError(value: DateRange): string {
    const key=JSON.stringify([value,this.calendar,this.locale,this.min,this.max,this.step,this.stepBase]);
    if (!this.availabilityCache.has(key)) this.availabilityCache.set(key,validateRange(value,{calendar:this.calendar,locale:this.locale,min:this.min,max:this.max,step:this.step,stepBase:this.stepBase,unavailableDate:this.unavailableDate ? this.unavailableOn : undefined}));
    return this.availabilityCache.get(key)!;
  }
  private chooseRange(value:string): void {
    if (!this.rangeDraft.start || this.rangeDraft.end) {
      this.rangeDraft=Object.freeze({start:value,end:''}); this.preview=''; this.rangeMessage=`Start date ${value}. Choose an end date.`;
      this.requestUpdate(); dispatchAction(this,{action:'range-draft',data:this.rangeDraft}); return;
    }
    const next=dateRange({start:this.rangeDraft.start,end:value})!;
    const error=this.rangeError(next);
    if (error) { this.rangeMessage=error; this.requestUpdate(); return; }
    if (this.deferRangeCommit) { this.rangeDraft=next; this.rangeMessage=`Range ${next.start} to ${next.end}.`; this.preview=''; this.requestUpdate(); dispatchAction(this,{action:'range-draft',data:next}); return; }
    const outcome=dispatchChange(this,{previous:this.rangeValue,proposed:next,reason:'range',getRevision:()=>this.rangeRevision,
      stage: pair=>{this.acceptedRange=pair;this.rangeDraft=pair;this.requestUpdate();},
      rollback: pair=>{this.acceptedRange=pair;this.rangeDraft=pair;this.requestUpdate();},
      canCommit: pair=>!this.disabled && !this.rangeError(pair),
    });
    this.preview=''; this.rangeMessage=outcome === 'committed' ? `Range ${this.rangeValue.start} to ${this.rangeValue.end} selected.` : 'Range change canceled.'; this.requestUpdate();
  }
  private selected(value:string): boolean { return this.selection === 'range' ? !!this.rangeDraft.start && value >= this.rangeDraft.start && value <= (this.rangeDraft.end || this.rangeDraft.start) : value === this.value; }
  private dayParts(value:string):string {
    const range=this.selection === 'range';
    const preview=range && !!this.rangeDraft.start && !this.rangeDraft.end && !!this.preview && value >= (this.preview < this.rangeDraft.start ? this.preview : this.rangeDraft.start) && value <= (this.preview > this.rangeDraft.start ? this.preview : this.rangeDraft.start);
    return `day${this.selected(value)?' selected':''}${value === this.today?' today':''}${range && value === this.rangeDraft.start?' range-start':''}${range && value === this.rangeDraft.end?' range-end':''}${range && this.selected(value)?' in-range':''}${preview?' preview':''}`;
  }
  private rangeBand(value:string) {
    if(this.selection !== 'range' || !value || !this.rangeDraft.start)return nothing;
    const preview=!this.rangeDraft.end && !!this.preview;
    const end=this.rangeDraft.end || this.preview;
    if(!end)return nothing;
    const start=end<this.rangeDraft.start?end:this.rangeDraft.start;
    const last=end>this.rangeDraft.start?end:this.rangeDraft.start;
    if(value<start || value>last)return nothing;
    const parts=`range-band${value===start?' range-band-start':''}${value===last?' range-band-end':''}${preview?' range-band-preview':''}`;
    return html`<span part=${parts} aria-hidden="true"></span>`;
  }
  private previewDate(value:string):void { if(this.selection === 'range' && this.rangeDraft.start && !this.rangeDraft.end) {this.preview=value;this.requestUpdate();} }
  private active = '';
  private pendingFocus = false;
  /** ISO YYYY-MM-DD selection. Author writes are silent. */
  get value(): string { return this.model.value.get(); }
  set value(value: string) { ++this.revision; const old = this.value; this.model.set(String(value ?? '')); this.requestUpdate('value', old); }
  /** ISO date identifying the displayed month. Empty starts at value, today, min or January 1970. */
  declare month: string;
  /** Application-supplied ISO current date, preserving deterministic SSR and the user's timezone. */
  declare today: string;
  /** Inclusive ISO minimum date. */
  declare min: string;
  /** Allowed date increment in days, default 1. */
  declare step: number;
  /** ISO increment anchor when min is absent; defaults to 1970-01-01. */
  declare stepBase: string;
  /** Inclusive ISO maximum date. */
  declare max: string;
  /** Display calendar: gregory (default) or buddhist (ISO 1941 onward). Values remain ISO. */
  declare calendar: string;
  /** Override the visible calendar and era name, for application translation. */
  declare calendarLabel: string;
  /** Override the unsupported-configuration explanation, for application translation. */
  declare unsupportedLabel: string;
  /** BCP47 locale for month, weekday and date labels. */
  declare locale: string;
  /** First weekday: Sunday=0 through Saturday=6. */
  declare firstDayOfWeek: number;
  declare label: string;
  declare previousLabel: string;
  declare nextLabel: string;
  declare disabled: boolean;
  constructor() {
    super(); this.selection='single'; this.deferRangeCommit=false; this.step=1;this.stepBase='1970-01-01';this.month = ''; this.today = ''; this.min = ''; this.max = ''; this.locale = 'en'; this.calendar = 'gregory'; this.calendarLabel = ''; this.unsupportedLabel = '';
    this.firstDayOfWeek = 0; this.label = 'Choose date'; this.previousLabel = 'Previous month'; this.nextLabel = 'Next month'; this.disabled = false;
  }
  private get start() { return (this.selection === 'range' ? parseDate(this.rangeValue.start) : parseDate(this.value)) ?? parseDate(this.today) ?? parseDate(this.min) ?? { year: 1970, month: 1, day: 1 }; }
  private get shown() { return parseDate(this.month) ?? this.start; }
  private configurationCache?: { key: string; value: ReturnType<typeof calendarConfiguration> };
  private get configuration() {
    const selected=this.selection === 'range' ? this.rangeValue.start : this.value;
    const value = formatDate(this.shown), key = JSON.stringify([this.calendar, this.locale, value, selected]);
    if (this.configurationCache?.key !== key) {
      const selection = calendarConfiguration(this.calendar, this.locale, selected);
      this.configurationCache = { key, value: selection.error ? selection : calendarConfiguration(this.calendar, this.locale, value) };
    }
    return this.configurationCache.value;
  }
  private get weekStart() { return Number.isInteger(this.firstDayOfWeek) && this.firstDayOfWeek >= 0 && this.firstDayOfWeek <= 6 ? this.firstDayOfWeek : 0; }
  private allowed(value: string): boolean { const date = parseDate(value); return !this.disabled && !!date && !!this.configuration.adapter?.supported(date) && dateInRange(date, this.min, this.max) && dateOnStep(date,this.step,this.min || this.stepBase) && !this.unavailableOn(value); }
  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if(changed.has('unavailableDate')) this.availabilityCache.clear();
    if(changed.has('rangeValue') && this.selection === 'range' && this.rangeValue.start) {this.month=this.rangeValue.start;this.active=this.rangeValue.start;}
    if (!this.active || changed.has('value')) this.active = formatDate(clampDate(this.start, this.min, this.max) ?? this.start);
    if (changed.has('value') && (!changed.has('month') || !parseDate(this.month)) && parseDate(this.value)) this.month = this.value;
    if (changed.has('month') || changed.has('min') || changed.has('max')) {
      const active = parseDate(this.active)!;
      const shown = this.shown;
      if (active.year !== shown.year || active.month !== shown.month) this.active = formatDate({ ...shown, day: 1 });
    }
  }
  /** Focus the calendar's current day without changing selection. */
  override focus(options?: FocusOptions): void { this.renderRoot.querySelector<HTMLButtonElement>('button[data-date][tabindex="0"]')?.focus(options); }
  private move(value: string, focus = true): void {
    const date = parseDate(value); if (!date || this.disabled || !this.configuration.adapter?.supported(date)) return;
    this.active = value; this.month = value; this.pendingFocus = focus; this.requestUpdate();
  }
  private canNavigate(delta: number): boolean {
    const shown=this.shown; let next;
    try { next=this.configuration.adapter?.addMonths(shown,delta); } catch { return false; }
    if (!next) return false;
    return !this.disabled && (shown.year !== next.year || shown.month !== next.month) && monthInRange(next,this.min,this.max);
  }
  private navigate(delta: number): void { if (this.canNavigate(delta)) this.move(formatDate(this.configuration.adapter!.addMonths(this.shown,delta)),false); }
  private choose(value: string): void {
    if (!this.allowed(value)) return;
    if (this.selection === 'range') { this.chooseRange(value); return; }
    const outcome = dispatchChange(this, { previous: this.value, proposed: value, reason: 'date', getRevision: () => this.revision,
      stage: next => { this.model.set(next); this.requestUpdate(); },
      rollback: previous => { this.model.set(previous); this.requestUpdate(); },
      canCommit: next => this.allowed(next),
      commit: () => {
        const date=parseDate(value)!;
        if ((date.year !== this.shown.year || date.month !== this.shown.month) && this.shadowRoot?.activeElement) this.pendingFocus=true;
        this.active = value; this.month = value;
      },
    });
    if ((outcome === 'committed' || outcome === 'unchanged') && this.value === value && this.allowed(value)) dispatchAction(this, { action: 'confirm', data: value });
  }
  private keydown(event: KeyboardEvent): void {
    if(event.key === 'Escape' && this.selection === 'range') {event.preventDefault();event.stopPropagation();this.cancelRange();return;}
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-date]');
    if (!button || this.disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const date = parseDate(button.dataset.date!)!; let next;
    const adapter = this.configuration.adapter; if (!adapter) return;
    const rtl = this.matches(':dir(rtl)');
    try { switch (event.key) {
      case 'ArrowRight': next = adapter.addDays(date, rtl ? -1 : 1); break;
      case 'ArrowLeft': next = adapter.addDays(date, rtl ? 1 : -1); break;
      case 'ArrowUp': next = adapter.addDays(date, -7); break;
      case 'ArrowDown': next = adapter.addDays(date, 7); break;
      case 'PageUp': next = adapter.addMonths(date, event.shiftKey ? -12 : -1); break;
      case 'PageDown': next = adapter.addMonths(date, event.shiftKey ? 12 : 1); break;
      case 'Home': case 'End': {
        const weekday = new Date(`${formatDate(date)}T12:00:00Z`).getUTCDay();
        const offset = (weekday - this.weekStart + 7) % 7;
        next = adapter.addDays(date, event.key === 'Home' ? -offset : 6 - offset); break;
      }
      default: return;
    }
    } catch { event.preventDefault(); return; }
    event.preventDefault(); this.previewDate(formatDate(next)); this.move(formatDate(next));
  }
  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (this.pendingFocus) {
      this.pendingFocus = false;
      if (this.getClientRects().length) {
        this.focus({ preventScroll: true });
        // Enlarged targets can overflow the bounded calendar. Reveal keyboard
        // navigation inside that surface without scrolling the containing page.
        const surface = this.renderRoot.querySelector<HTMLElement>('.en-calendar');
        const day = this.renderRoot.querySelector<HTMLElement>('button[data-date][tabindex="0"]');
        if (surface && day) {
          const bounds = surface.getBoundingClientRect(), target = day.getBoundingClientRect();
          const left = bounds.left + surface.clientLeft, right = left + surface.clientWidth;
          const delta = target.left < left ? target.left - left : target.right > right ? target.right - right : 0;
          if (delta) surface.scrollBy({ left: delta, behavior: 'instant' });
        }
      }
    }
  }
  protected override render() {
    const shown = this.shown;
    const { adapter, error } = this.configuration;
    if (!adapter) return html`<div part="configuration" role="status">${this.unsupportedLabel || error}</div>`;
    const days = adapter.grid(shown, { firstDayOfWeek: this.weekStart, min: this.min, max: this.max });
    const entry = days.some(day => day.value === this.active) ? this.active : days.find(day => day.inMonth)?.value;
    const weekdays = weekdayLabels(this.locale, this.weekStart);
    return html`<div part="base" class="en-calendar" data-selection=${this.selection}>
      <div part="calendar-label">${this.calendarLabel || (this.calendar === 'buddhist' ? 'Buddhist calendar · BE' : 'Gregorian calendar · CE')}</div>
      <div part="header" class="en-calendar-header">
        <en-button variant="secondary" icon-only size="inherit" exportparts="control:previous"
          ?disabled=${this.disabled} aria-disabled=${String(!this.canNavigate(-1))} @click=${() => this.navigate(-1)}>
          <span slot="prefix"><slot name="previous"><en-icon name="chevron-left" size="inherit"></en-icon></slot></span>
          <span slot="label">${this.previousLabel}</span>
        </en-button>
        <div id="month" part="heading" aria-live="polite" aria-atomic="true">${adapter.format(shown, { month: 'long', year: 'numeric', era: this.calendar === 'buddhist' ? 'short' : undefined })}</div>
        <en-button variant="secondary" icon-only size="inherit" exportparts="control:next"
          ?disabled=${this.disabled} aria-disabled=${String(!this.canNavigate(1))} @click=${() => this.navigate(1)}>
          <span slot="prefix"><slot name="next"><en-icon name="chevron-right" size="inherit"></en-icon></slot></span>
          <span slot="label">${this.nextLabel}</span>
        </en-button>
      </div>
      <table role="grid" aria-label=${this.label} aria-describedby=${this.selection === 'range' ? 'month range-status' : 'month'} aria-multiselectable=${this.selection === 'range' ? 'true' : nothing} part="grid" @keydown=${this.keydown}>
        <thead><tr>${weekdays.map(day => html`<th scope="col" abbr=${day.long} part="weekday"><span class="en-calendar-weekday">${day.short}</span></th>`)}</tr></thead>
        <tbody>${Array.from({ length: 6 }, (_, week) => html`<tr>${days.slice(week * 7, week * 7 + 7).map(day => html`<td class="en-calendar-cell" aria-selected=${String(!!day.value && this.selected(day.value))}>${day.date ? this.rangeBand(day.value) : nothing}${day.date ? html`<button type="button" part=${this.dayParts(day.value)} class="en-calendar-day" data-date=${day.value} data-outside=${!day.inMonth ? '' : nothing} tabindex=${!this.disabled && day.value === entry ? 0 : -1} ?disabled=${this.disabled} aria-disabled=${String(day.disabled || !this.allowed(day.value))} aria-current=${day.value === this.today ? 'date' : nothing} aria-label=${adapter.format(day.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', era: this.calendar === 'buddhist' ? 'short' : undefined }) + (this.selection === 'range' && day.value === this.rangeDraft.start ? ', start date' : '') + (this.selection === 'range' && day.value === this.rangeDraft.end ? ', end date' : '')} @pointerenter=${() => this.previewDate(day.value)} @focus=${() => { this.previewDate(day.value); if (this.active !== day.value) { this.active = day.value; this.requestUpdate(); } }} @click=${() => this.choose(day.value)}>${adapter.format(day.date, { day: 'numeric' })}</button>` : nothing}</td>`)}</tr>`)}</tbody>
      </table>${this.selection === 'range' ? html`<div id="range-status" part="range-status" role="status" aria-atomic="true">${this.rangeMessage || (this.rangeDraft.start ? `Range ${this.rangeDraft.start}${this.rangeDraft.end ? ` to ${this.rangeDraft.end}` : ' — choose an end date'}.` : 'Choose a start date.')}</div>` : nothing}
    </div>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-calendar': EnCalendar; } }
