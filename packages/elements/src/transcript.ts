import { html, css, type PropertyValues } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
export interface TranscriptMessage {
    readonly id: string;
    readonly author: string;
    readonly text: string;
    readonly outgoing?: boolean;
    readonly pending?: boolean;
}
/** Keyed streaming transcript. Following is opt-in, stops when a reader scrolls
 * away, and resumes only at the end or through the visible Latest action.
 * @tagname en-transcript
 * @csspart viewport - Bounded native scrolling region.
 * @csspart latest - Explicit return-to-latest control.
 */
export class EnTranscript extends EnElement {
    static override properties = { messages: { attribute: false }, label: {}, followLatest: { type: Boolean, attribute: 'follow-latest' }, latestLabel: { attribute: 'latest-label' } };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, css `.viewport{max-block-size:28rem;overflow:auto;overflow-anchor:none;border:var(--en-border-width) solid var(--en-color-boundary);border-radius:var(--en-radius-control);} .messages{display:grid;gap:var(--en-space-3);padding:var(--en-space-3);} .message{white-space:pre-wrap;} .footer{display:flex;gap:var(--en-space-3);align-items:center;margin-block-start:var(--en-space-2);}`];
    declare messages: readonly TranscriptMessage[];
    declare label: string;
    declare followLatest: boolean;
    declare latestLabel: string;
    private following = false;
    private observer?: ResizeObserver;
    private anchor?: {
        id: string;
        top: number;
    };
    private seen = 0;
    constructor() { super(); this.messages = []; this.label = 'Conversation'; this.followLatest = false; this.latestLabel = 'Latest messages'; }
    private get viewport() { return this.renderRoot?.querySelector<HTMLElement>('.viewport'); }
    private bottom() { const viewport = this.viewport; if (viewport)
        viewport.scrollTop = viewport.scrollHeight; this.seen = this.messages.length; }
    scrollToLatest() { this.following = true; this.bottom(); this.requestUpdate(); }
    private onScroll = () => { const v = this.viewport; if (!v)
        return; const atEnd = v.scrollHeight - v.scrollTop - v.clientHeight < 4; if (this.followLatest)
        this.following = atEnd;
    else if (!atEnd)
        this.following = false; if (atEnd)
        this.seen = this.messages.length; this.requestUpdate(); };
    protected override willUpdate(changed: PropertyValues) { if (changed.has('followLatest'))
        this.following = this.followLatest; const viewport = this.viewport; if (viewport && !this.following) {
        const top = viewport.getBoundingClientRect().top;
        const first = [...this.renderRoot.querySelectorAll<HTMLElement>('[data-message]')].find(el => el.getBoundingClientRect().bottom > top);
        if (first)
            this.anchor = { id: first.dataset.message!, top: first.getBoundingClientRect().top };
    } }
    protected override updated() { if (this.following)
        this.bottom();
    else if (this.anchor) {
        const el = [...this.renderRoot.querySelectorAll<HTMLElement>('[data-message]')].find(el => el.dataset.message === this.anchor!.id);
        if (el && this.viewport)
            this.viewport.scrollTop += el.getBoundingClientRect().top - this.anchor.top;
        this.anchor = undefined;
    } if (!this.observer) {
        const Observer = this.ownerDocument.defaultView?.ResizeObserver;
        if (Observer) {
            this.observer = new Observer(() => { if (this.following)
                this.bottom(); });
            const content = this.renderRoot.querySelector('.messages');
            if (content)
                this.observer.observe(content);
        }
    } }
    override disconnectedCallback() { this.observer?.disconnect(); this.observer = undefined; super.disconnectedCallback(); }
    override connectedCallback() { super.connectedCallback(); if (this.hasUpdated)
        this.requestUpdate(); }
    protected override render() { return html `<div><div class="viewport" part="viewport" tabindex="0" role="region" aria-label=${this.label} @scroll=${this.onScroll}><div class="messages" aria-live="off">${repeat(this.messages, m => m.id, m => html `<en-chat-message data-message=${m.id} author=${m.author} ?outgoing=${m.outgoing}><div class="message">${m.text}</div>${m.pending ? html `<span slot="status">Writing…</span>` : null}</en-chat-message>`)}</div></div><div class="footer"><button type="button" class="en-button" data-variant="secondary" part="latest" @click=${() => this.scrollToLatest()}>${this.latestLabel}</button><span role="status">${!this.following && this.messages.length > this.seen ? `${this.messages.length - this.seen} unread messages` : ''}</span></div></div>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-transcript': EnTranscript;
    }
}
