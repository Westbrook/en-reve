import { html } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';

type DateControl = HTMLElement & { value: string; updateComplete: Promise<unknown> };

/** Date-only application state; no timestamp conversion or network submission. */
class CalendarDemo extends AsyncDirective {
	private form?: HTMLFormElement;
	private locale = 'en-US';
	private calendar = 'gregory';
	private firstDay = 0;
	private reject = false;
	private status = 'Choose a date between September 14 and October 30, 2026.';
	private receipt = 'No date submitted.';
	private hourCycle = 'auto';
	private rejectTime = false;
	private timeStatus = 'No time changes yet.';
	private timeReceipt = 'No date/time fields submitted.';
	private submitTime = (event:Event) => {event.preventDefault();this.timeReceipt=JSON.stringify(Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)),null,2);this.refresh();};
	private timeChanged = (event:Event) => {if(this.rejectTime)event.preventDefault();const el=event.currentTarget as DateControl;queueMicrotask(()=>{this.timeStatus=`${event.defaultPrevented?'Declined; retained':'Accepted'} ${el.value || '(empty)'}.`;this.refresh();});};
	private rangeReceipt = 'No range submitted.';
	private initialRange = Object.freeze({start:'2026-09-16',end:'2026-09-18'});
	private unavailableDate = (value:string) => value === '2026-09-22';
	private resetKey: unknown;
	private refresh() { this.setValue(this.render(this.resetKey)); }
	private changed = (event: Event) => {
		const field = event.currentTarget as DateControl;
		if (event.composedPath()[0] !== field || !event.cancelable) return;
		const proposal = field.value;
		if (this.reject) event.preventDefault();
		queueMicrotask(() => {
			if (!this.isConnected) return;
			this.status = event.defaultPrevented
				? `Application declined ${proposal || 'clearing the date'}. Accepted value: ${field.value || 'empty'}.`
				: `Accepted ${field.value || 'an empty date'} from ${field.localName}.`;
			this.refresh();
		});
	};
	private preference = (event: Event, name: 'locale' | 'calendar' | 'firstDay' | 'reject') => {
		const control = event.currentTarget as DateControl & { checked: boolean };
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented) return;
			if (name === 'calendar') this.calendar = control.value;
			if (name === 'locale') this.locale = control.value;
			if (name === 'firstDay') this.firstDay = Number(control.value);
			if (name === 'reject') this.reject = control.checked;
			this.refresh();
		});
	};
	private submit = (event: Event) => {
		event.preventDefault();
		const date = new FormData(event.currentTarget as HTMLFormElement).get('review-date');
		this.receipt = `Submitted review-date: ${date || '(empty)'}. No data was sent.`;
		this.refresh();
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.resetKey = resetKey; this.calendar = 'gregory'; this.locale = 'en-US'; this.firstDay = 0; this.reject = false;
			this.status = 'Choose a date between September 14 and October 30, 2026.';
			this.receipt = 'No date submitted.';
		}
		return html`
			<div class="calendar-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<p style="margin:0">Compare an inline calendar with a text field and calendar dialog. Both select one absolute day in the Gregorian or modern Buddhist calendar; the submitted value stays YYYY-MM-DD in every display locale.</p>
				<div style="display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-3)">
					<en-select label="Display calendar" .value=${this.calendar} .items=${[
						{ value: 'gregory', label: 'Gregorian · CE' }, { value: 'buddhist', label: 'Modern Buddhist · BE (1941 onward)' },
					]} @en-change=${(event: Event) => this.preference(event, 'calendar')}></en-select>
					<en-select label="Display locale" .value=${this.locale} .items=${[
						{ value: 'en-US', label: 'English (United States)' }, { value: 'pt-BR', label: 'Português (Brasil)' },
						{ value: 'th-TH', label: 'ไทย (Thai)' }, { value: 'th-TH-u-nu-thai', label: 'ไทย (Thai numerals)' }, { value: 'de-DE', label: 'Deutsch' }, { value: 'ja-JP', label: '日本語' }, { value: 'ar', label: 'العربية' },
					]} @en-change=${(event: Event) => this.preference(event, 'locale')}></en-select>
					<en-select label="First day of week" .value=${String(this.firstDay)} .items=${[
						{ value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '6', label: 'Saturday' },
					]} @en-change=${(event: Event) => this.preference(event, 'firstDay')}></en-select>
				</div>
				<en-checkbox .checked=${this.reject} @en-change=${(event: Event) => this.preference(event, 'reject')}>Application declines date changes</en-checkbox>
				<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));align-items:start;gap:var(--en-space-5)">
					<section aria-labelledby="calendar-inline-title" style="min-inline-size:0">
						<h3 id="calendar-inline-title">Inline calendar</h3>
						<en-calendar id="specimen-calendar" label="Review availability" value="2026-09-18" month="2026-09-01"
							min="2026-09-14" max="2026-10-30" today="2026-09-14" .calendar=${this.calendar} .locale=${this.locale} .firstDayOfWeek=${this.firstDay}
							@en-change=${this.changed}></en-calendar>
					</section>
					<form ${ref(element => { this.form = element as HTMLFormElement | undefined; })} @submit=${this.submit} style="display:grid;gap:var(--en-space-3);min-inline-size:0">
						<h3 style="margin-block-end:0">Plan a review</h3>
						<en-date-picker id="specimen-date-picker" name="review-date" value="2026-09-18" required
							min="2026-09-14" max="2026-10-30" today="2026-09-14" .calendar=${this.calendar} .locale=${this.locale} .firstDayOfWeek=${this.firstDay}
							@en-change=${this.changed}>
							<span slot="label">Review date</span>
							<span slot="description">September 14 through October 30, 2026. Type a date or choose it from the calendar.</span>
						</en-date-picker>
						<en-button style="justify-self:start" @click=${() => this.form?.requestSubmit()}>Submit review date</en-button>
						<p data-calendar-receipt role="status" style="margin:0">${this.receipt}</p>
					</form>
				</div>
				<section id="date-range-example" aria-labelledby="date-range-title">
                    <h3 id="date-range-title">Date ranges</h3>
                    <p>Choose a start and an end, in either order. September 22 is unavailable: ranges cannot cross it. The inline calendar commits a complete pair; the dialog keeps a draft until Apply range. Display preferences above affect both without changing their ISO values.</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:var(--en-space-5);align-items:start">
                        <en-calendar id="range-calendar" selection="range" label="Project date range" .rangeValue=${guard([this.initialRange],()=>this.initialRange)} .unavailableDate=${this.unavailableDate} .calendar=${this.calendar} .locale=${this.locale} .firstDayOfWeek=${this.firstDay} today="2026-09-14" min="2026-09-14" max="2026-10-30" @en-change=${(event:Event)=>{if(this.reject)event.preventDefault();}}></en-calendar>
                        <form id="range-form" style="display:grid;gap:var(--en-space-3)" @submit=${(event:Event)=>{event.preventDefault();this.rangeReceipt=JSON.stringify(Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)));this.refresh();}}>
                            <en-date-picker id="range-picker" selection="range" label="Project period" picker-label="Choose project period" start-name="project-start" end-name="project-end" required .defaultRangeValue=${guard([this.initialRange],()=>this.initialRange)} .unavailableDate=${this.unavailableDate} .calendar=${this.calendar} .locale=${this.locale} .firstDayOfWeek=${this.firstDay} today="2026-09-14" min="2026-09-14" max="2026-10-30" @en-change=${(event:Event)=>{if(this.reject)event.preventDefault();}}></en-date-picker>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><button type="submit">Submit range</button><button type="reset">Reset range</button></div>
                            <output data-range-receipt>${this.rangeReceipt}</output>
                        </form>
                    </div>
                    <details><summary>Range code and review scenarios</summary><pre dir="ltr"><code>&lt;en-date-picker selection="range" start-name="project-start"
  end-name="project-end" required label="Project period"&gt;
&lt;/en-date-picker&gt;

picker.rangeValue = { start: '2026-09-16', end: '2026-09-18' };
picker.unavailableDate = iso =&gt; iso === '2026-09-22';
picker.addEventListener('en-change', event =&gt; {
  // event.detail.previous / proposed are immutable pairs.
  // event.preventDefault() rejects both endpoints together.
});
// After changing state captured by the predicate:
picker.invalidateAvailability();</code></pre><p>Try an earlier second date, a same-day range, a range across September 22, Cancel, Escape, application veto, and switching calendars. Submit reads real FormData locally. Reset restores the initial pair. Required ranges need both dates; incomplete or invalid pairs are omitted from submission. Arrow keys move focus without committing; Enter or Space chooses an endpoint.</p></details>
                </section>
				                <section id="time-entry-example" aria-labelledby="time-entry-title">
                    <h3 id="time-entry-title">Time entry and date composition</h3>
                    <p>Type a local time, then press Enter or leave the field to accept it. Invalid drafts stay visible; Escape restores the accepted time. Arrow Up/Down adjusts the hours, minutes, seconds or AM/PM at the caret. The locale selector above changes the display while submitted values stay HH:mm or HH:mm:ss.</p>
                    <en-select label="Time display" .value=${this.hourCycle} .items=${[{value:'auto',label:'Follow locale'},{value:'12',label:'12-hour'},{value:'24',label:'24-hour'}]} @en-change=${(event:Event)=>{const el=event.currentTarget as DateControl;queueMicrotask(()=>{this.hourCycle=el.value;this.refresh();});}}></en-select>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:var(--en-space-5);align-items:start;margin-block-start:var(--en-space-4)">
                        <form id="time-appointment-form" style="display:grid;gap:var(--en-space-3)" @submit=${this.submitTime}>
                            <h4 style="margin:0">Appointment</h4>
                            <en-date-picker name="appointment-date" label="Appointment date" value="2026-09-18" today="2026-09-14" .calendar=${this.calendar} .locale=${this.locale} required></en-date-picker>
                            <en-time-field id="specimen-time-field" name="appointment-time" value="09:30" min="09:00" max="17:00" step="900" .locale=${this.locale} .hourCycle=${this.hourCycle} required @en-change=${this.timeChanged}>
                                <span slot="label">Appointment time</span><span slot="description">09:00–17:00, in 15-minute increments.</span>
                            </en-time-field>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><en-button @click=${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Submit appointment</en-button><en-button variant="secondary" @click=${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.reset()}>Reset</en-button></div>
                        </form>
                        <form id="time-period-form" style="display:grid;gap:var(--en-space-3)" @submit=${this.submitTime}>
                            <h4 style="margin:0">Start and end times</h4>
                            <en-date-picker selection="range" label="Scheduled dates" start-name="start-date" end-name="end-date" .defaultRangeValue=${guard([this.initialRange],()=>this.initialRange)} .calendar=${this.calendar} .locale=${this.locale} today="2026-09-14" required></en-date-picker>
                            <en-time-field name="start-time" label="Start time" value="22:30" min="22:00" max="02:00" wrap step="900" .locale=${this.locale} .hourCycle=${this.hourCycle} required description="Overnight availability: 22:00 through 02:00, in 15-minute increments." @en-change=${this.timeChanged}></en-time-field>
                            <en-time-field name="end-time" label="End time" value="01:30:15" precision="second" step="15" .locale=${this.locale} .hourCycle=${this.hourCycle} required description="Includes seconds, in 15-second increments." @en-change=${this.timeChanged}></en-time-field>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><en-button @click=${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Submit date and time range</en-button><en-button variant="secondary" @click=${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.reset()}>Reset</en-button></div>
                        </form>
                    </div>
                    <en-checkbox .checked=${this.rejectTime} @en-change=${(event:Event)=>{const el=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{this.rejectTime=el.checked;this.refresh();});}}>Application declines time changes</en-checkbox>
                    <p data-time-status role="status">${this.timeStatus}</p>
                    <pre data-time-receipt aria-label="Submitted date and time fields" style="white-space:pre-wrap;overflow-wrap:anywhere">${this.timeReceipt}</pre>
                    <p>These are separate local dates and times. Your application chooses the timezone, handles daylight-saving gaps or repeated times, and validates whether the end follows the start. No data is sent.</p>
                    <details><summary>Time code and review scenarios</summary><pre dir="ltr"><code>import '@en-reve/elements/define/time-field.js';

&lt;en-time-field name="appointment-time" label="Appointment time"
  locale="en-US" hour-cycle="12" value="09:30"
  min="09:00" max="17:00" step="900" required&gt;
&lt;/en-time-field&gt;
&lt;en-time-field name="night-time" label="Overnight time"
  min="22:00" max="02:00" wrap value="23:30"&gt;
&lt;/en-time-field&gt;

field.addEventListener('en-change', event =&gt; {
  // Canonical previous/proposed strings; preventDefault() vetoes.
});
// Date and time values remain separate FormData entries.</code></pre><p>Try 9:45 AM, invalid 9:37 AM, 24:00, seconds, switching locale and 12/24-hour display, Escape, application veto, Reset, stepping each segment and stepping across midnight. Use the page direction control for RTL and a narrow viewport for mobile review. Readonly and disabled remain available through the API.</p></details>
                </section>

				<p data-calendar-status role="status" aria-atomic="true" style="margin:0">${this.status}</p>
				<details id="calendar-system-review">
					<summary>Calendar system review</summary>
					<p>Choose Modern Buddhist above, then Thai (or Thai numerals). Confirm that September 2026 displays in BE 2569 while the native field and submission remain 2026-09-18. Select another date, submit, and switch back to Gregorian: the accepted day must not change. Review Thai labels and era with a fluent reader; automated Intl checks are not linguistic acceptance.</p>
					<pre dir="ltr"><code>&lt;en-date-picker calendar="buddhist" locale="th-TH"
  value="2026-09-18" today="2026-09-14" name="review-date"&gt;
  &lt;span slot="label"&gt;Review date&lt;/span&gt;
&lt;/en-date-picker&gt;</code></pre>
				</details>
				<details>
					<summary>Keyboard and date handling</summary>
					<p>Tab enters the calendar date grid once. Arrow keys move by day or week; Home and End reach the week edges. Page Up and Page Down change months; Shift with those keys changes years. Enter or Space chooses the focused date. Dates outside the allowed interval cannot be selected. Escape closes the picker dialog and returns focus to its trigger.</p>
					<p>Display locale and reading direction are independent. Use the page’s Reading direction control to review RTL. Labels in this application remain English; supply translated application labels when integrating another language. Today is supplied explicitly so server rendering and hydration use the same date. Modern Buddhist dates use Gregorian-equivalent months with a BE year 543 greater than the ISO year. The supported interval begins at ISO 1941-01-01. Native date editing remains explicitly Gregorian; display-calendar changes preserve the selected ISO day. Range selection and local time entry are available above. Additional calendar systems remain outside the supported matrix.</p>
				</details>
			</div>
		`;
	}
}
const calendarDemo = directive(CalendarDemo);
export function calendarExample(resetKey: unknown = 0) { return html`${calendarDemo(resetKey)}`; }
