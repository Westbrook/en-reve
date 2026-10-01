import { css, html, nothing, type PropertyValues } from 'lit';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { guard } from 'lit/directives/guard.js';
import { live } from 'lit/directives/live.js';
import { EnElement } from './internal/en-element.js';
import { DefaultState } from './forms-private/default-state.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { intervalLimits, normalizeInterval, moveInterval, type Interval } from '@en-reve/primitives/state/interval.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
function parse(value: string | null): Interval { try {
    const v = JSON.parse(value ?? '[0,100]');
    return Array.isArray(v) && v.length === 2 ? [Number(v[0]), Number(v[1])] : [0, 100];
}
catch {
    return [0, 100];
} }
/** One ordered interval with two stable, independently named slider thumbs.
 * Description and application error describe both thumbs and both exact-value inputs.
 * @tagname en-range-slider
 * @slot description - Supporting content; replaces the description attribute/property fallback.
 * @csspart description - Supporting content for both endpoints.
 * @csspart track - Stationary coordinate track.
 * @csspart lower-thumb - Lower endpoint, always first in Tab order.
 * @csspart upper-thumb - Upper endpoint, always second in Tab order.
 * @csspart editors - Native exact-value alternatives.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly [number, number]>} en-change - Tentative interval change; cancelable.
 */
export class EnRangeSlider extends EnElement<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<Interval>}> {
    static formAssociated = true;
    static override properties = { value: { attribute: false, noAccessor: true }, defaultValue: { attribute: 'value', noAccessor: true, converter: { fromAttribute: parse } }, min: { type: Number }, max: { type: Number }, step: { type: Number }, minGap: { type: Number, attribute: 'min-gap' }, name: {}, label: {}, description: {}, lowerLabel: { attribute: 'lower-label' }, upperLabel: { attribute: 'upper-label' }, disabled: { type: Boolean, reflect: true }, readOnly: { type: Boolean, attribute: 'readonly' }, error: {} };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, css `
    .track { position:relative; isolation:isolate; margin-inline:1rem; block-size:2.75rem; touch-action:none; }
    .track::before { content:''; position:absolute; inset-inline:0; inset-block-start:calc(50% - 2px); block-size:4px; background:var(--en-color-boundary); border-radius:var(--en-radius-pill); }
    .fill { position:absolute; inset-block-start:calc(50% - 2px); block-size:4px; background:var(--en-color-action); pointer-events:none; }
    .thumb { position:absolute; inset-block-start:50%; transform:translate(-50%,-50%); inline-size:2.75rem; block-size:2.75rem; padding:0; border:0; border-radius:50%; background:transparent; color:var(--en-color-action); cursor:grab; touch-action:none; }
    :host(:dir(rtl)) .thumb { transform:translate(50%,-50%); }
    .thumb::before { content:''; position:absolute; inset:calc((100% - var(--en-size-icon))/2); background:var(--en-color-action); border:var(--en-border-width) solid currentColor; border-radius:50%; }
    /* The focused endpoint owns pointer hits where thumb targets overlap.
       Keep DOM/Tab order stable and contain the raised thumb within its track. */
    .thumb:focus { z-index:1; }
    .thumb:focus-visible { outline:var(--en-focus-width) solid var(--en-color-focus); outline-offset:var(--en-focus-offset); }
    .thumb:not(:disabled):active::before { scale:clamp(.9,var(--en-slider-thumb-pressed-scale,1),1.25); }
    .thumb:disabled { opacity:.5; cursor:default; }
    .editors { display:flex; flex-wrap:wrap; gap:var(--en-space-3); }
    .editors label { display:grid; gap:var(--en-space-1); min-inline-size:0; flex:1; }
    .editors input { inline-size:100%; min-inline-size:4rem; }
    @media(prefers-reduced-motion:reduce) { .thumb:active::before { scale:none; } }
    @media(forced-colors:active) { .track::before { background:CanvasText; } .thumb::before { background:Highlight; } }
  `];
    declare min: number;
    declare max: number;
    declare step: number;
    declare minGap: number;
    declare name: string;
    declare label: string;
    /** Plain supporting text; slot=description takes precedence. @default '' */
    declare description: string;
    declare lowerLabel: string;
    declare upperLabel: string;
    declare disabled: boolean;
    declare readOnly: boolean;
    declare error: string;
    private interval: Interval = [0, 100];
    private revision = 0;
    private fieldsetDisabled = false;
    private gesture?: {
        id: number;
        thumb: 0 | 1;
        original: Interval;
        revision: number;
    };
    private readonly defaults = new DefaultState<Interval>(this, 'value', parse, JSON.stringify, value => { this.value = value; });
    private readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
    private readonly adapter = this.internals ? new FormController(this, { internals: this.internals, value: () => { if (!this.name)
            return null; const data = new FormData(); for (const n of this.value)
            data.append(this.name, String(n)); return data; }, state: () => JSON.stringify(this.value), disabled: () => this.effectiveDisabled, onReset: () => this.defaults.reset(), onRestore: state => { if (typeof state === 'string')
            this.value = parse(state); }, validate: () => ({ flags: this.error ? { customError: true } : {}, message: this.error, anchor: this.renderRoot?.querySelector<HTMLElement>('.thumb') ?? undefined }) }) : undefined;
    constructor() { super(); this.min = 0; this.max = 100; this.step = 1; this.minGap = 0; this.name = ''; this.label = 'Range'; this.description = ''; this.lowerLabel = 'Minimum'; this.upperLabel = 'Maximum'; this.disabled = false; this.readOnly = false; this.error = ''; }
    private get limits() { return intervalLimits(this); }
    private get effectiveDisabled() { return this.disabled || this.fieldsetDisabled; }
    get value(): Interval { return [...this.interval]; }
    set value(value: Interval) { const previous = this.interval; this.interval = normalizeInterval(value, this.limits); this.revision++; this.defaults.markDirty(); this.adapter?.sync(); this.requestUpdate('value', previous); }
    get defaultValue(): Interval { return this.defaults.value; }
    set defaultValue(value: Interval) { this.defaults.value = value; }
    override attributeChangedCallback(name: string, old: string | null, value: string | null) { if (name === 'value') {
        this.defaults.attributeChanged();
        return;
    } super.attributeChangedCallback(name, old, value); }
    formDisabledCallback(disabled: boolean) { this.fieldsetDisabled = disabled; this.adapter?.formDisabled(disabled); }
    formResetCallback() { this.adapter?.formReset(); }
    formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete') { this.adapter?.formStateRestore(state, mode); }
    get form() { return this.internals?.form ?? null; }
    get validity() { return this.internals?.validity; }
    get validationMessage() { return this.internals?.validationMessage ?? this.error; }
    checkValidity() { this.adapter?.sync(); return this.internals?.checkValidity?.() ?? !this.error; }
    reportValidity() { this.adapter?.sync(); return this.internals?.reportValidity?.() ?? !this.error; }
    override focus(options?: FocusOptions) { this.renderRoot.querySelector<HTMLElement>('.thumb')?.focus(options); }
    private propose(value: Interval, reason: string) { if (this.effectiveDisabled || this.readOnly || value.every((v, i) => v === this.interval[i]))
        return; const previous = this.value; this.defaults.markDirty(); const stage = (v: Interval) => { this.interval = [...v]; this.adapter?.sync(); this.requestUpdate(); }; dispatchChange(this, { previous, proposed: value, reason, getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && !this.effectiveDisabled && !this.readOnly && normalizeInterval(value, this.limits).every((v, i) => v === value[i]) }); }
    private move(thumb: 0 | 1, value: number, reason: string) { this.propose(moveInterval(this.value, thumb, value, this.limits), reason); }
    private key(event: KeyboardEvent, thumb: 0 | 1) { if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
        return; const { min, max, step, minGap } = this.limits; const rtl = this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl'; const delta = event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') ? step : event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') ? -step : event.key === 'PageUp' ? step * 10 : event.key === 'PageDown' ? -step * 10 : 0; const proposed = event.key === 'Home' ? (thumb === 0 ? min : this.value[0] + minGap) : event.key === 'End' ? (thumb === 0 ? this.value[1] - minGap : max) : delta ? this.value[thumb] + delta : undefined; if (proposed !== undefined) {
        event.preventDefault();
        this.move(thumb, proposed, 'keyboard');
    } }
    private pointerValue(event: PointerEvent) { const track = this.renderRoot.querySelector('.track')!.getBoundingClientRect(); const ratio = Math.max(0, Math.min(1, (event.clientX - track.left) / track.width)); const rtl = this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl'; return this.limits.min + (rtl ? 1 - ratio : ratio) * (this.limits.max - this.limits.min); }
    private down = (event: PointerEvent) => { if (!event.isPrimary || event.button !== 0 || this.effectiveDisabled || this.readOnly)
        return; const target = event.target as HTMLElement; const value = this.pointerValue(event); const thumb: 0 | 1 = target.dataset.thumb === '1' ? 1 : target.dataset.thumb === '0' ? 0 : Math.abs(value - this.value[0]) <= Math.abs(value - this.value[1]) ? 0 : 1; event.preventDefault(); this.gesture = { id: event.pointerId, thumb, original: this.value, revision: this.revision }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); this.renderRoot.querySelector<HTMLElement>(`[data-thumb="${thumb}"]`)?.focus(); this.move(thumb, value, 'pointer'); };
    private drag = (event: PointerEvent) => { if (this.gesture?.id === event.pointerId)
        this.move(this.gesture.thumb, this.pointerValue(event), 'pointer'); };
    private end = (event: PointerEvent) => { if (this.gesture?.id !== event.pointerId)
        return; const previous = this.gesture.original, revision = this.gesture.revision; this.gesture = undefined; if (event.type === 'pointercancel' && revision === this.revision)
        this.propose(previous, 'cancel'); };
    override disconnectedCallback() { this.gesture = undefined; super.disconnectedCallback(); }
    protected override willUpdate(_changes: PropertyValues) { if (!this.hasUpdated && !this.defaults.isDirty && this.shadowRoot) {
        const inputs = [...this.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="number"]')];
        if (inputs.length === 2 && inputs.some(input => input.value !== input.defaultValue)) {
            this.interval = [inputs[0].valueAsNumber, inputs[1].valueAsNumber];
            this.defaults.markDirty();
        }
    } this.interval = normalizeInterval(this.interval, this.limits); }
    // Help/error-only renders must not overwrite an uncommitted native draft.
    // Values, authoritative writes and interaction constraints still reconcile it.
    protected override render() { const { min, max, minGap, step } = this.limits; return html `<div class="en-field" role="group" aria-label=${this.label}><span class="en-label">${this.label}</span><div class="track" part="track" @pointerdown=${this.down} @pointermove=${this.drag} @pointerup=${this.end} @pointercancel=${this.end}><span class="fill" aria-hidden="true" style=${`inset-inline-start:${max===min?0:(this.value[0]-min)/(max-min)*100}%;inline-size:${max===min?0:(this.value[1]-this.value[0])/(max-min)*100}%;`}></span>${([0, 1] as const).map(thumb => { const ratio = max === min ? 0 : (this.value[thumb] - min) / (max - min); return html `<button class="thumb" type="button" role="slider" part=${thumb ? 'upper-thumb' : 'lower-thumb'} data-thumb=${thumb} style=${`inset-inline-start:${ratio * 100}%;`} aria-label=${thumb ? this.upperLabel : this.lowerLabel} aria-valuemin=${thumb ? this.value[0] + minGap : min} aria-valuemax=${thumb ? max : this.value[1] - minGap} aria-describedby=${this.error ? 'description error' : 'description'} aria-invalid=${this.error ? 'true' : nothing} aria-valuenow=${this.value[thumb]} aria-readonly=${String(this.readOnly)} ?disabled=${this.effectiveDisabled} @keydown=${(event: KeyboardEvent) => this.key(event, thumb)}></button>`; })}</div><div class="editors" part="editors">${([0, 1] as const).map(thumb => html `<label>${thumb ? this.upperLabel : this.lowerLabel}<input class="en-input" type="number" aria-describedby=${this.error ? 'description error' : 'description'} aria-invalid=${this.error ? 'true' : nothing} min=${thumb ? this.value[0] + minGap : min} max=${thumb ? max : this.value[1] - minGap} step=${step} .value=${guard([this.value[thumb], this.revision, min, max, minGap, step, this.readOnly, this.effectiveDisabled], () => live(String(this.value[thumb])))} ?disabled=${this.effectiveDisabled} ?readonly=${this.readOnly} @change=${(event: Event) => { const input = event.target as HTMLInputElement; this.move(thumb, input.valueAsNumber, 'editor'); input.value = String(this.value[thumb]); }}></label>`)}</div>${descriptionTemplate(this.description)}${this.error ? html `<div class="en-error" id="error">${this.error}</div>` : null}</div>`; }
}
export type { Interval } from '@en-reve/primitives/state/interval.js';
declare global {
    interface HTMLElementTagNameMap {
        'en-range-slider': EnRangeSlider;
    }
}
