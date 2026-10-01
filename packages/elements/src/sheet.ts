import { html, css, type PropertyValues } from 'lit';
import { EnDrawer } from './drawer/drawer.js';
import { dialogTemplate } from './dialog/template.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
/** Bottom modal sheet with discrete viewport-fraction snap points. Only the handle
 * captures dragging, so scrolling and selection in content retain native behavior.
 * @tagname en-sheet
 * @csspart handle - Keyboard and pointer resize control.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean | number>} en-change - Boolean open change or numeric snap proposal (reason snap).
 */
export class EnSheet extends EnDrawer<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean|number>}> {
    static override properties = { ...EnDrawer.properties, snapPoints: { attribute: false }, snap: { type: Number, noAccessor: true }, resizeLabel: { attribute: 'resize-label' } };
    static override styles = [...EnDrawer.styles, css `.handle{touch-action:none;inline-size:100%;cursor:ns-resize;} .sheet-actions{display:flex;gap:var(--en-space-2);margin-block:var(--en-space-2);} .en-drawer{max-block-size:95dvh;box-sizing:border-box;}`];
    declare snapPoints: readonly number[];
    declare resizeLabel: string;
    private current = .65;
    private revision = 0;
    private drag?: {
        id: number;
        y: number;
        height: number;
        revision: number;
    };
    constructor() { super(); this.placement = 'bottom'; this.snapPoints = [.35, .65, .9]; this.resizeLabel = 'Sheet height'; }
    private get points() { const values = [...new Set(this.snapPoints.filter(n => Number.isFinite(n) && n >= .15 && n <= .95))].sort((a, b) => a - b); return values.length ? values : [.65]; }
    private nearest(value: number) { return this.points.reduce((a, b) => Math.abs(a - value) <= Math.abs(b - value) ? a : b); }
    get snap() { return this.current; }
    set snap(value: number) { const previous = this.current; this.current = this.nearest(Number(value)); this.revision++; this.requestUpdate('snap', previous); }
    private apply(value = this.current) { if (this.dialog)
        this.dialog.style.blockSize = `${Math.max(.15, Math.min(.95, value)) * 100}dvh`; }
    requestSnap(value: number) { const previous = this.current, proposed = this.nearest(value); const stage = (n: number) => { this.current = n; this.requestUpdate(); }; return dispatchChange(this, { previous, proposed, reason: 'snap', getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && this.open && this.points.includes(proposed), commit: () => this.apply() }); }
    private down = (event: PointerEvent) => { if (!event.isPrimary || event.button !== 0)
        return; event.preventDefault(); (event.currentTarget as HTMLElement).focus(); this.drag = { id: event.pointerId, y: event.clientY, height: this.current, revision: this.revision }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); };
    private move = (event: PointerEvent) => { if (this.drag?.id === event.pointerId)
        this.apply(this.drag.height + (this.drag.y - event.clientY) / this.ownerDocument.documentElement.clientHeight); };
    private end = (event: PointerEvent) => { if (this.drag?.id !== event.pointerId)
        return; const drag = this.drag; this.drag = undefined; if (event.type === 'pointerup' && drag.revision === this.revision)
        this.requestSnap(drag.height + (drag.y - event.clientY) / this.ownerDocument.documentElement.clientHeight); this.apply(); };
    protected override updated(changed: PropertyValues) { super.updated(changed); this.current = this.nearest(this.current); this.apply(); }
    override disconnectedCallback() { this.drag = undefined; super.disconnectedCallback(); }
    protected override render() { const index = this.points.indexOf(this.nearest(this.current)); return dialogTemplate({ ...this.dialogView, placement: 'bottom', body: html `<button class="en-button handle" type="button" data-variant="ghost" part="handle" role="slider" aria-label=${this.resizeLabel} aria-valuemin=${this.points[0] * 100} aria-valuemax=${this.points.at(-1)! * 100} aria-valuenow=${this.current * 100} aria-valuetext=${Math.round(this.current * 100) + '% of viewport'} @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.end} @pointercancel=${this.end} @keydown=${(event: KeyboardEvent) => { const value = event.key === 'Home' ? this.points[0] : event.key === 'End' ? this.points.at(-1) : event.key === 'ArrowUp' ? this.points[index + 1] : event.key === 'ArrowDown' ? this.points[index - 1] : undefined; if (value !== undefined) {
            event.preventDefault();
            this.requestSnap(value);
        } }}>↕ ${this.resizeLabel}</button><div class="sheet-actions"><button class="en-button" type="button" data-variant="secondary" ?disabled=${index === 0} @click=${() => this.requestSnap(this.points[index - 1])}>Smaller</button><button class="en-button" type="button" data-variant="secondary" ?disabled=${index === this.points.length - 1} @click=${() => this.requestSnap(this.points[index + 1])}>Larger</button></div><slot></slot>` }); }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-sheet': EnSheet;
    }
}
