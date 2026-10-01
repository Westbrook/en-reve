import { html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from './internal/en-element.js';
import type { EnMenu } from './menu.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
export interface MenubarItem {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
    readonly items: readonly {
        readonly value: string;
        readonly label: string;
        readonly disabled?: boolean;
    }[];
}
/** Application command menus; use native links/disclosures for website navigation.
 * @tagname en-menubar
 * @fires {import('./events.js').CommandActionEvent} en-action - Original menu-item action intent bubbles unchanged.
 */
export class EnMenubar extends EnElement<{'en-action':import('./events.js').CommandActionEvent}> {
    static override properties = { items: { attribute: false }, label: {} };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, css `[role=menubar]{display:flex;flex-wrap:wrap;gap:var(--en-space-1);}`];
    declare items: readonly MenubarItem[];
    declare label: string;
    private active = '';
    constructor() { super(); this.items = []; this.label = 'Application'; }
    private menus() { return [...this.renderRoot.querySelectorAll<EnMenu>('en-menu')]; }
    private buttons() { return [...this.renderRoot.querySelectorAll<HTMLButtonElement>('[role=menubar] > button:not(:disabled)')]; }
    private switchTo(button: HTMLButtonElement, open: boolean) { const current = this.menus().find(m => m.open); if (current && current.for !== button.id) {
        current.hide('layout');
        if (current.open)
            return;
    } this.active = button.dataset.key!; button.focus(); this.requestUpdate(); if (open)
        this.menus().find(m => m.for === button.id)?.show('trigger'); }
    private key = (event: KeyboardEvent) => {
        if (event.altKey || event.metaKey || event.ctrlKey || event.isComposing)
            return;
        const buttons = this.buttons(), target = event.composedPath()[0] as HTMLElement;
        const current = this.menus().find(m => m.open), button = buttons.find(b => b === target) || buttons.find(b => b.id === current?.for);
        if (!button)
            return;
        const rtl = getComputedStyle(this).direction === 'rtl';
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            // Home/End belong to an open vertical menu, never its menubar.
            if (current && ['Home', 'End'].includes(event.key))
                return;
            event.preventDefault();
            event.stopPropagation();
            const index = buttons.indexOf(button), delta = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') ? 1 : -1;
            this.switchTo(buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length], !!current);
        }
        else if (target === button && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            this.switchTo(button, true);
        }
    };
    protected override render() { const available = this.items.filter(i => !i.disabled); if (!available.some(i => i.value === this.active))
        this.active = available[0]?.value ?? ''; return html `<div @keydown=${this.key}><div role="menubar" aria-label=${this.label}>${repeat(this.items, i => i.value, (item, index) => html `<button id=${'menu-trigger-' + index} class="en-button" data-variant="ghost" type="button" role="menuitem" data-key=${item.value} tabindex=${item.value === this.active ? 0 : -1} ?disabled=${item.disabled} @focus=${() => { this.active = item.value; this.requestUpdate(); }} @pointerenter=${(event: PointerEvent) => { if (event.pointerType !== 'touch' && this.menus().some(m => m.open))
        this.switchTo(event.currentTarget as HTMLButtonElement, true); }}>${item.label}</button>`)}</div>${repeat(this.items, i => i.value, (item, index) => html `<en-menu for=${'menu-trigger-' + index} label=${item.label}>${repeat(item.items, i => i.value, i => html `<en-menu-item action=${i.value} ?disabled=${i.disabled}>${i.label}</en-menu-item>`)}</en-menu>`)}</div>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-menubar': EnMenubar;
    }
}
