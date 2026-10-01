import { html, css, type PropertyValues } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnDialog } from './dialog/dialog.js';
import { dialogTemplate } from './dialog/template.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import type { CarouselItem } from './carousel.js';
export interface ViewerMedia {
    readonly key: string;
    readonly src: string;
    readonly alt: string;
    readonly caption?: string;
    readonly thumbnail?: string;
}
/** Modal image gallery composed with the library carousel. Bounded zoom/pan have
 * native range/button alternatives; browser page zoom remains available.
 * @tagname en-media-viewer
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean | string>} en-change - Boolean modal state or stable active media key (reason media).
 */
export class EnMediaViewer extends EnDialog<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean|string>}> {
    static override properties = { ...EnDialog.properties, items: { attribute: false }, activeKey: { attribute: 'active-key', noAccessor: true } };
    static override styles = [...EnDialog.styles, css `.frame{block-size:22rem;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--en-color-surface-subtle);} img{max-inline-size:100%;max-block-size:100%;object-fit:contain;user-select:none;} .tools{display:flex;gap:var(--en-space-2);flex-wrap:wrap;align-items:center;} label{display:flex;gap:var(--en-space-2);align-items:center;} .en-dialog{inline-size:min(95vw,64rem);}`];
    declare items: readonly ViewerMedia[];
    private key = '';
    private revision = 0;
    private zoom = 1;
    private x = 0;
    private y = 0;
    private gesture?: {
        id: number;
        x: number;
        y: number;
        startX: number;
        startY: number;
    };
    constructor() { super(); this.items = []; this.label = 'Media viewer'; }
    get activeKey() { return this.key || this.items[0]?.key || ''; }
    set activeKey(value: string) { const previous = this.key; this.key = value; this.revision++; this.resetView(); this.requestUpdate('activeKey', previous); }
    private resetView() { this.zoom = 1; this.x = 0; this.y = 0; this.gesture = undefined; this.requestUpdate(); }
    private select(key: string) { const previous = this.activeKey, stage = (v: string) => { this.key = v; this.requestUpdate(); }; return dispatchChange(this, { previous, proposed: key, reason: 'media', getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && this.items.some(i => i.key === key), commit: () => this.resetView() }); }
    private pan(dx: number, dy: number) { const frame = this.renderRoot.querySelector<HTMLElement>('[data-current=true]'); const image = frame?.querySelector('img'); const rect = frame?.getBoundingClientRect(); if (!rect || !image)
        return; const ratio = image.naturalWidth && image.naturalHeight ? Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight) : 1; const maxX = Math.max(0, (image.naturalWidth * ratio * this.zoom - rect.width) / 2), maxY = Math.max(0, (image.naturalHeight * ratio * this.zoom - rect.height) / 2); this.x = Math.max(-maxX, Math.min(maxX, this.x + dx)); this.y = Math.max(-maxY, Math.min(maxY, this.y + dy)); this.requestUpdate(); }
    private down = (event: PointerEvent) => { if (this.zoom <= 1 || event.button !== 0 || !event.isPrimary)
        return; event.preventDefault(); this.gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: this.x, startY: this.y }; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); };
    private move = (event: PointerEvent) => { const gesture = this.gesture; if (gesture?.id !== event.pointerId)
        return; this.x = gesture.startX; this.y = gesture.startY; this.pan(event.clientX - gesture.x, event.clientY - gesture.y); };
    private end = (event: PointerEvent) => { if (this.gesture?.id !== event.pointerId)
        return; if (event.type === 'pointercancel') {
        this.x = this.gesture.startX;
        this.y = this.gesture.startY;
        this.requestUpdate();
    } this.gesture = undefined; };
    protected override willUpdate(changed: PropertyValues) { super.willUpdate(changed); if (changed.has('items') && !this.items.some(i => i.key === this.activeKey)) {
        this.key = this.items[0]?.key ?? '';
        this.resetView();
    } }
    override disconnectedCallback() { this.gesture = undefined; super.disconnectedCallback(); }
    private image = (item: CarouselItem) => { const media = this.items.find(i => i.key === item.key)!; const active = media.key === this.activeKey; return html `<figure><div class="frame" data-current=${String(active)} style=${`touch-action:${active && this.zoom > 1 ? 'none' : 'auto'};`} @pointerdown=${this.down} @pointermove=${this.move} @pointerup=${this.end} @pointercancel=${this.end}><img src=${media.src} alt=${media.alt} draggable="false" style=${active ? `transform:translate(${this.x}px,${this.y}px) scale(${this.zoom});` : ''}></div><figcaption>${media.caption ?? media.alt}</figcaption></figure>`; };
    protected override render() { const item = this.items.find(i => i.key === this.activeKey); return dialogTemplate({ ...this.dialogView, body: html `${item ? html `<en-carousel label="Images" navigation="thumbnails" controls="always" .index=${Math.max(0, this.items.findIndex(i => i.key === this.activeKey))} @en-change=${(event: CustomEvent) => { if ((event.target as Element)?.localName !== 'en-carousel')
            return; event.stopPropagation(); const next = this.items[event.detail.proposed]; if (!next || !['committed', 'unchanged'].includes(this.select(next.key)))
            event.preventDefault(); }}>${repeat(this.items, i => i.key, i => html `<en-carousel-slide label=${i.caption ?? i.alt} thumbnail=${i.thumbnail ?? i.src}>${this.image({ key: i.key, label: i.alt })}</en-carousel-slide>`)}</en-carousel><div class="tools" role="group" aria-label="Image view"><label>Zoom<input type="range" min="1" max="4" step=".25" .value=${String(this.zoom)} @input=${(event: Event) => { this.zoom = Number((event.target as HTMLInputElement).value); this.pan(0, 0); this.requestUpdate(); }}></label><output>${Math.round(this.zoom * 100)}%</output><button class="en-button" data-variant="secondary" type="button" @click=${() => this.resetView()}>Fit image</button>${[['Left', 40, 0], ['Right', -40, 0], ['Up', 0, 40], ['Down', 0, -40]].map(([name, x, y]) => html `<button class="en-button" data-variant="ghost" type="button" ?disabled=${this.zoom === 1} @click=${() => this.pan(Number(x), Number(y))}>${name}</button>`)}<a class="en-link" href=${item.src} target="_blank" rel="noopener">Open original image</a></div>` : html `<p>No media available.</p>`}` }); }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-media-viewer': EnMediaViewer;
    }
}
