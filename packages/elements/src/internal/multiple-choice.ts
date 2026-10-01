import { connectionDocument } from './element-registry.js';
import { SelectionChildrenController, SELECTION_SLOT_PREFIX } from '@en-reve/primitives/interactions/selection-children.js';
import { html, nothing, type PropertyValues } from 'lit';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { repeat } from 'lit/directives/repeat.js';
import { live } from 'lit/directives/live.js';
import { EnElement } from './en-element.js';
import { DefaultState } from '../forms-private/default-state.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import { patternStyles } from '@en-reve/styles/patterns.js';
export interface ChoiceItem {
    readonly value: string;
    readonly label: string;
    readonly description?: string;
    readonly disabled?: boolean;
    readonly hidden?: boolean;
}
export function selectionValues(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))] : []; }
function parse(value: string | null): string[] { try {
    return selectionValues(JSON.parse(value ?? '[]'));
}
catch {
    return [];
} }
/** Private shared form owner; public facades choose semantics, never nested owners.
 * @slot description - Supporting content; replaces the description attribute/property fallback.
 * @csspart description - Group supporting content.
 */
export abstract class MultipleChoice extends EnElement<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>}> {
    static override properties = {
        items: { attribute: false }, value: { attribute: false, noAccessor: true },
        defaultValue: { attribute: 'value', noAccessor: true, converter: { fromAttribute: parse } }, name: {}, label: {}, description: {}, error: {},
        validationText: { attribute: 'validation-text' }, disabled: { type: Boolean, reflect: true },
        readOnly: { type: Boolean, attribute: 'readonly', reflect: true }, required: { type: Boolean },
        multiple: { type: Boolean }, allowEmpty: { type: Boolean, attribute: 'allow-empty' },
        cards: { type: Boolean, reflect: true }, orientation: { reflect: true },
    };
    static formAssociated = true;
    static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, selectionStyles, patternStyles];
    declare items: readonly ChoiceItem[];
    declare name: string;
    declare label: string;
    declare description: string;
    declare error: string;
    declare validationText: string;
    declare disabled: boolean;
    declare readOnly: boolean;
    declare required: boolean;
    declare multiple: boolean;
    declare allowEmpty: boolean;
    declare cards: boolean;
    declare orientation: 'horizontal' | 'vertical';
    protected abstract readonly choiceKind: 'toggle' | 'checkbox' | 'picker';
    protected get projectsChoiceChildren(): boolean { return false; }
    private readonly childOptions = new SelectionChildrenController(this, this.projectsChoiceChildren ? 'checkbox' : 'choice');
    protected get choiceItems(): readonly ChoiceItem[] { return this.childOptions.view.active ? this.childOptions.view.items : this.items; }
    private selected: string[] = [];
    private recoverChoiceFocus = false;
    private hydrationQuery: string | undefined;
    protected revision = 0;
    protected fieldsetDisabled = false;
    protected showError = false;
    protected query = '';
    protected expanded = false;
    protected activeValue = '';
    private readonly defaults = new DefaultState<string[]>(this, 'value', parse, JSON.stringify, value => { this.value = value; });
    protected readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
    private readonly formAdapter = this.internals ? new FormController(this, {
        internals: this.internals, value: () => {
            if (!this.name)
                return null;
            const data = new FormData();
            for (const value of this.value)
                data.append(this.name, value);
            return data;
        }, state: () => JSON.stringify(this.value), disabled: () => this.effectiveDisabled,
        onReset: () => { this.showError = false; this.query = ''; this.defaults.reset(); },
        onRestore: state => { if (typeof state === 'string')
            this.value = parse(state); },
        validate: () => ({ flags: this.validationMessage ? { customError: true } : {}, message: this.validationMessage, anchor: this.focusControl ?? undefined }),
    }) : undefined;
    constructor() {
        super();
        this.items = [];
        this.name = '';
        this.label = '';
        this.description = '';
        this.error = '';
        this.validationText = 'Choose an option.';
        this.disabled = false;
        this.readOnly = false;
        this.required = false;
        this.multiple = true;
        this.allowEmpty = true;
        this.cards = false;
        this.orientation = 'horizontal';
        this.addEventListener('focusout', event => {
            if (!event.relatedTarget || !this.contains(event.relatedTarget as Node) && !this.shadowRoot?.contains(event.relatedTarget as Node)) {
                this.expanded = false;
                this.requestUpdate();
            }
        });
    }
    /** Ordered unique keys. Values are copied; mutate by assigning a new array. */
    get value(): readonly string[] { return [...this.selected]; }
    set value(value: readonly string[]) { const previous = this.selected; this.selected = selectionValues(value); this.revision++; this.defaults.markDirty(); this.formAdapter?.sync(); this.requestUpdate('value', previous); }
    /** JSON value attribute supplies the reset default; live values never reflect. */
    get defaultValue(): readonly string[] { return this.defaults.value; }
    set defaultValue(value: readonly string[]) { this.defaults.value = selectionValues(value); }
    override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
        if (name === 'value') {
            this.defaults.attributeChanged();
            return;
        }
        super.attributeChangedCallback(name, old, value);
    }
    protected get effectiveDisabled(): boolean { return this.disabled || this.fieldsetDisabled; }
    protected get availableItems(): readonly ChoiceItem[] { return this.choiceItems.filter((item, index, items) => !item.hidden && !!item.value && items.findIndex(i => i.value === item.value) === index); }
    protected get filteredItems(): readonly ChoiceItem[] { const query = this.query.toLocaleLowerCase(); return this.availableItems.filter(item => item.label.toLocaleLowerCase().includes(query)); }
    protected get focusControl(): HTMLElement | null { return this.renderRoot?.querySelector<HTMLElement>(this.choiceKind === 'picker' ? '#query' : 'input:not(:disabled),button:not(:disabled)') ?? null; }
    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get validity(): ValidityState | undefined { return this.internals?.validity; }
    get willValidate(): boolean { return this.internals?.willValidate ?? false; }
    get validationMessage(): string {
        if (this.error)
            return this.error;
        if (this.childOptions.current().error)
            return this.childOptions.current().error;
        const keys = this.choiceItems.map(item => item.value);
        if (new Set(keys).size !== keys.length || keys.some(key => !key))
            return 'Choice values must be unique and nonempty.';
        if (!this.multiple && this.value.length > 1)
            return 'Choose at most one option.';
        if (this.required && !this.value.length)
            return this.validationText;
        if (this.value.some(value => !this.choiceItems.some(item => item.value === value)))
            return 'A selected option is unavailable.';
        return '';
    }
    checkValidity(): boolean { this.formAdapter?.sync(); return this.internals?.checkValidity?.() ?? !this.validationMessage; }
    reportValidity(): boolean { this.showError = true; this.requestUpdate(); this.formAdapter?.sync(); return this.internals?.reportValidity?.() ?? !this.validationMessage; }
    formDisabledCallback(disabled: boolean): void { this.fieldsetDisabled = disabled; this.formAdapter?.formDisabled(disabled); }
    formResetCallback(): void { this.formAdapter?.formReset(); }
    formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete'): void { this.formAdapter?.formStateRestore(state, mode); }
    private outsidePointer = (event:PointerEvent):void => {if(this.expanded && !event.composedPath().includes(this)){this.expanded=false;this.requestUpdate();}};
    override connectedCallback():void{super.connectedCallback();this.ownerDocument.addEventListener('pointerdown',this.outsidePointer,true);}
    override disconnectedCallback():void{connectionDocument(this).removeEventListener('pointerdown',this.outsidePointer,true);super.disconnectedCallback();}
    override focus(options?: FocusOptions): void { this.focusControl?.focus(options); }
    protected toggle(value: string, reason = 'select'): void {
        const item = this.choiceItems.find(item => item.value === value);
        const removingMissing = reason === 'remove' && !item && this.value.includes(value);
        if (this.effectiveDisabled || this.readOnly || (!removingMissing && (!item || item.disabled || item.hidden)))
            return;
        const previous = Object.freeze(this.value);
        const proposed = Object.freeze(previous.includes(value) ? previous.filter(v => v !== value) : this.multiple ? [...previous, value] : [value]);
        if (!proposed.length && !this.allowEmpty)
            return;
        this.defaults.markDirty();
        const stage = (value: readonly string[]) => { this.selected = [...value]; this.formAdapter?.sync(); this.requestUpdate(); };
        dispatchChange(this, { previous, proposed, reason, getRevision: () => this.revision, stage, rollback: stage,
            canCommit: () => this.isConnected && !this.effectiveDisabled && !this.readOnly && (removingMissing || (this.childOptions.current().active ? this.childOptions.current().items : this.items).some(i => i.value === value && !i.disabled && !i.hidden)),
            commit: () => { if (reason === 'remove')
                this.updateComplete.then(() => this.focus()); },
        });
    }
    protected keydown = (event: KeyboardEvent): void => {
        if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || this.effectiveDisabled)
            return;
        // Authored supporting links keep their native keyboard behavior.
        if (event.composedPath().includes(this.renderRoot.querySelector('#description')!)) return;
        const picker = this.choiceKind === 'picker';
        const items = (picker ? this.filteredItems : this.availableItems).filter(item => !item.disabled);
        const buttons = [...this.renderRoot.querySelectorAll<HTMLElement>('[data-choice]:not(:disabled)')];
        const focused = event.composedPath()[0] as HTMLElement;
        let index = items.findIndex(item => item.value === (picker ? this.activeValue : focused.dataset.choice));
        if (picker && event.key === 'Escape') {
            event.preventDefault();
            this.expanded = false;
            this.requestUpdate();
            return;
        }
        if (picker && event.key === 'Enter') {
            event.preventDefault();
            if (!this.expanded) {
                this.expanded = true;
                this.requestUpdate();
            }
            else if (items[index])
                this.toggle(items[index].value);
            return;
        }
        if (picker && event.key === 'Backspace' && !this.query && this.value.length) {
            this.toggle(this.value.at(-1)!, 'remove');
            return;
        }
        const rtl = this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl';
        const next = picker || this.orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
        const previous = picker || this.orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
        if (![next, previous, 'Home', 'End'].includes(event.key) || !items.length)
            return;
        // Checkbox collections retain ordinary Tab navigation, never radio-style arrows.
        if (this.choiceKind === 'checkbox')
            return;
        if (picker && !this.expanded && ['Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === next ? 1 : -1) + items.length) % items.length;
        this.activeValue = items[index].value;
        if (picker)
            this.expanded = true;
        else
            buttons.find(button => button.dataset.choice === this.activeValue)?.focus();
        this.requestUpdate();
    };
    protected override willUpdate(_changed: PropertyValues): void {
        if (!this.hasUpdated && this.shadowRoot) {
            const controls = [...this.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-choice]')];
            if (!this.defaults.isDirty && controls.some(input => input.checked !== input.defaultChecked)) {
                this.selected = controls.filter(input => input.checked).map(input => input.dataset.choice!);
                this.defaults.markDirty();
            }
            const query = this.shadowRoot.querySelector<HTMLInputElement>('#query');
            if (query && query.value !== query.defaultValue)
                this.hydrationQuery = query.value;
        }
        const focused = this.shadowRoot?.activeElement as HTMLElement | null;
        this.recoverChoiceFocus = !!focused?.dataset.choice && !this.availableItems.some(i => i.value === focused.dataset.choice && !i.disabled);
        if (this.effectiveDisabled || this.readOnly)
            this.expanded = false;
        const visible = this.filteredItems.filter(item => !item.disabled);
        if (!visible.some(item => item.value === this.activeValue))
            this.activeValue = visible[0]?.value ?? '';
    }
    protected override updated(): void { if (this.hydrationQuery !== undefined) {
        this.query = this.hydrationQuery;
        this.hydrationQuery = undefined;
        this.requestUpdate();
    } for(const input of this.renderRoot.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-choice]')) input.checked=this.value.includes(input.dataset.choice!); this.formAdapter?.sync(); if (this.recoverChoiceFocus) {
        this.recoverChoiceFocus = false;
        this.focus();
    }
    if(this.expanded){const list=this.renderRoot.querySelector<HTMLElement>('#choices'),active=this.renderRoot.querySelector<HTMLElement>('[data-active]');if(list&&active){const box=list.getBoundingClientRect(),row=active.getBoundingClientRect();if(row.bottom>box.bottom)list.scrollTop+=row.bottom-box.bottom;else if(row.top<box.top)list.scrollTop+=row.top-box.top;}}
    }
    protected renderChoiceLabel(item: ChoiceItem) { return html`${item.label}`; }
    private option(item: ChoiceItem, index: number) {
        const selected = this.value.includes(item.value);
        const projected = this.projectsChoiceChildren && this.childOptions.view.active ? this.childOptions.view.items.find(child => child.value === item.value) : undefined;
        if (this.choiceKind === 'checkbox')
            return html `<label class=${this.cards ? 'en-choice en-choice-card' : 'en-choice'} part="option">
      <input class="en-checkbox" data-choice=${item.value} aria-label=${item.label} aria-description=${item.description || nothing} type="checkbox" ?checked=${selected} ?disabled=${this.effectiveDisabled || item.disabled}
        aria-readonly=${String(this.readOnly)} @click=${(event: Event) => { if (this.readOnly)
                event.preventDefault(); }}
        @change=${(event: Event) => { this.toggle(item.value); (event.target as HTMLInputElement).checked = this.value.includes(item.value); }}>
      <span aria-hidden="true" part="option-content">${projected ? html`<slot name=${SELECTION_SLOT_PREFIX + projected.key}></slot>` : html`${item.label}${item.description ? html `<small>${item.description}</small>` : nothing}`}</span></label>`;
        const picker = this.choiceKind === 'picker';
        return html `<button id=${'choice-' + index} type="button" class=${picker ? 'en-option' : 'en-button'} data-variant="secondary"
      part="option" data-choice=${item.value} ?data-active=${picker && this.activeValue === item.value} role=${picker ? 'option' : nothing}
      aria-selected=${picker ? String(selected) : nothing} aria-pressed=${picker ? nothing : String(selected)}
      aria-disabled=${this.readOnly ? 'true' : nothing} ?disabled=${this.effectiveDisabled || item.disabled}
      tabindex=${picker || this.activeValue !== item.value ? -1 : 0}
      @mousedown=${(event: MouseEvent) => { if (picker)
            event.preventDefault(); }}
      @focus=${() => { this.activeValue = item.value; this.requestUpdate(); }} @click=${() => this.toggle(item.value)}>${this.renderChoiceLabel(item)}</button>`;
    }
    protected override render() {
        const picker = this.choiceKind === 'picker';
        const options = picker ? this.filteredItems : this.availableItems;
        const message = this.showError || this.error ? this.validationMessage : '';
        return html `<div class="en-field" part="field" @keydown=${this.keydown}>
      ${picker ? html `<label class="en-label" for="query">${this.label}</label>` : html `<span class="en-label" id="heading">${this.label}</span>`}
      <div class=${picker ? 'en-picker' : 'en-choice-layout'}>
      ${picker ? html `<div class="en-tags" part="tags">${repeat(this.value, value => value, value => html `<span class="en-tag">${this.choiceItems.find(item => item.value === value)?.label ?? value}<button type="button" class="en-button en-icon-button" data-variant="ghost" aria-label=${'Remove ' + (this.choiceItems.find(item => item.value === value)?.label ?? value)} ?disabled=${this.effectiveDisabled || this.readOnly || this.choiceItems.find(item => item.value === value)?.disabled} @click=${() => this.toggle(value, 'remove')}>×</button></span>`)}</div>
      <input id="query" class="en-input" role="combobox" aria-autocomplete="list" aria-controls="choices" aria-expanded=${String(this.expanded)}
        aria-required=${String(this.required)} aria-invalid=${message ? 'true' : nothing} aria-describedby="description" aria-activedescendant=${this.expanded && options.some(i => i.value === this.activeValue) ? 'choice-' + options.findIndex(i => i.value === this.activeValue) : nothing}
        .value=${live(this.query)} ?disabled=${this.effectiveDisabled} ?readonly=${this.readOnly}
        @click=${() => { this.expanded = true; this.requestUpdate(); }} @input=${(event: Event) => { this.query = (event.target as HTMLInputElement).value; this.expanded = true; this.requestUpdate(); }}>` : nothing}
      <div id="choices" class=${picker ? 'en-listbox en-picker-options' : 'en-choice-group'} part="options"
        role=${picker ? 'listbox' : 'group'} aria-describedby="description error" aria-invalid=${message?'true':nothing} aria-label=${picker ? this.label : nothing} aria-labelledby=${picker ? nothing : 'heading'}
        aria-multiselectable=${picker ? String(this.multiple) : nothing} ?hidden=${picker && !this.expanded}>
        ${repeat(options, item => item.value, (item, index) => this.option(item, index))}
      </div>
      ${picker && this.expanded && !options.length ? html `<p role="status">No matching options</p>` : nothing}
      </div>
      ${descriptionTemplate(this.description)}
      ${message ? html `<div class="en-error" id="error" role="status">${message}</div>` : nothing}
    </div>`;
    }
}
