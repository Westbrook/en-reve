import { html, nothing, noChange, isServer, type TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';
/** Native measured quantity; thresholds retain HTML meter semantics. */
export function meterTemplate(options: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    low?: number;
    high?: number;
    optimum?: number;
}): TemplateResult {
    return html `<label class="en-meter-label">${options.label}<meter class="en-meter" value=${options.value} min=${options.min ?? 0} max=${options.max ?? 100} low=${options.low ?? nothing} high=${options.high ?? nothing} optimum=${options.optimum ?? nothing}>${options.value}</meter></label>`;
}
/** A named native choice tile; action links belong outside this label.
 * An explicit checked value owns live selection; omission leaves it native. */
export function choiceCardTemplate(options: {
    type: 'checkbox' | 'radio';
    name: string;
    value: string;
    label: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (event: Event) => void;
}): TemplateResult {
    return html `<label class="en-choice-card"><input class=${options.type === 'radio' ? 'en-radio' : 'en-checkbox'} type=${options.type} name=${options.name} value=${options.value} ?checked=${options.checked}
    .checked=${isServer || options.checked === undefined ? noChange : live(options.checked)} ?disabled=${options.disabled} @change=${options.onChange}><span>${options.label}${options.description ? html `<small>${options.description}</small>` : nothing}</span></label>`;
}
/** Joined actions retain individual native button semantics and focus targets. */
export function buttonGroupTemplate(label: string, actions: TemplateResult, options: { joined?: boolean; orientation?: 'horizontal' | 'vertical' } = {}): TemplateResult { return html `<div class="en-button-group" data-joined=${String(options.joined ?? true)} data-orientation=${options.orientation ?? 'horizontal'} role="group" aria-label=${label}>${actions}</div>`; }
/** Download and optional removal are separate actions, never nested links. */
export function attachmentTemplate(options: {
    name: string;
    url: string;
    detail?: string;
    removeLabel?: string;
    onRemove?: () => void;
}): TemplateResult {
    return html `<div class="en-attachment"><a class="en-link" href=${options.url} download>${options.name}</a>${options.detail ? html `<small>${options.detail}</small>` : nothing}${options.onRemove ? html `<button class="en-button" type="button" data-variant="ghost" @click=${options.onRemove}>${options.removeLabel ?? 'Remove attachment'}</button>` : nothing}</div>`;
}
/** Responsive native landmarks; callers supply unique accessible names and content. */
export function appShellTemplate(options: {
    navigation: TemplateResult;
    main: TemplateResult;
    header?: TemplateResult;
    navigationLabel: string;
    embedded?: boolean;
}): TemplateResult {
    return html `<div class="en-app-shell">${options.header ? html `<header>${options.header}</header>` : nothing}<nav aria-label=${options.navigationLabel}>${options.navigation}</nav>${options.embedded?html`<section>${options.main}</section>`:html`<main>${options.main}</main>`}</div>`;
}
/** Native website disclosure; normal links and Tab order, with Escape restoration. */
export function navigationFlyoutTemplate(options: {
    label: string;
    links: readonly {
        label: string;
        href: string;
        current?: boolean;
    }[];
}): TemplateResult { return html `<details class="en-navigation-flyout" @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape') {
    const details = event.currentTarget as HTMLDetailsElement;
    details.open = false;
    details.querySelector('summary')?.focus();
    event.preventDefault();
} }}><summary class="en-button" data-variant="ghost">${options.label}</summary><ul>${options.links.map(link => html `<li><a class="en-link" href=${link.href} aria-current=${link.current ? 'page' : nothing}>${link.label}</a></li>`)}</ul></details>`; }
/** The label names only the native field; adjacent actions keep their own names. */
export function joinedFieldTemplate(options: {
    label: string;
    name: string;
    value: string;
    actions: TemplateResult;
    onInput?: (event: Event) => void;
}): TemplateResult { return html `<div class="en-joined-field"><label>${options.label}<input class="en-input" name=${options.name} .value=${options.value} @input=${options.onInput}></label><div class="en-joined-actions">${options.actions}</div></div>`; }
/** One timezone-free local date/time value. Native constraints validate the pair;
 * interpreting it as a zoned time or instant is an application decision. */
export function localDateTimeTemplate(options:{label:string;name:string;value?:string;min?:string;max?:string;required?:boolean;onChange?:(event:Event)=>void}):TemplateResult{return html`<label class="en-local-datetime">${options.label}<input class="en-input" type="datetime-local" name=${options.name} value=${options.value??''} min=${options.min??nothing} max=${options.max??nothing} ?required=${options.required} @change=${options.onChange}></label>`;}
/** Labeled visual division; avoids inventing a custom ARIA marker role. */
export function messageMarkerTemplate(label:string):TemplateResult{return html`<div class="en-message-marker"><hr class="en-separator"><span>${label}</span><hr class="en-separator"></div>`;}
/** Tool/system status is authored text with optional native disclosure. Execution
 * and untrusted markup rendering remain outside this presentation recipe. */
export function systemMessageTemplate(options:{label:string;detail?:TemplateResult;announce?:boolean}):TemplateResult{return html`<aside class="en-system-message" role=${options.announce?'status':nothing}>${options.detail?html`<details><summary>${options.label}</summary>${options.detail}</details>`:options.label}</aside>`;}
/** Code is escaped by Lit. Clipboard permission/transport belongs to onCopy. */
export function codeBlockTemplate(options:{code:string;label:string;copyLabel?:string;onCopy?:()=>void}):TemplateResult{return html`<figure class="en-code-block"><figcaption>${options.label}</figcaption><pre class="en-code"><code>${options.code}</code></pre>${options.onCopy?html`<button class="en-button" data-variant="secondary" type="button" @click=${options.onCopy}>${options.copyLabel??'Copy code'}</button>`:nothing}</figure>`;}
/** Native scrolling retains platform scrollbars and keyboard behavior. */
export function scrollAreaTemplate(label:string,content:TemplateResult):TemplateResult{return html`<div class="en-scroll-area" role="region" aria-label=${label} tabindex="0">${content}</div>`;}
/** Shared chart detail presentation; use inside an existing popover/hover-card
 * when supplemental, retaining the complete chart table as the data alternative. */
export function chartDetailTemplate(label:string,rows:readonly {label:string;value:string}[]):TemplateResult{return html`<section aria-label=${label}><h3>${label}</h3><dl class="en-metadata">${rows.map(row=>html`<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`)}</dl></section>`;}
/** Native image and metadata composition; links/actions belong after the caption. */
export function mediaCardTemplate(options:{src:string;alt:string;caption:string;actions?:TemplateResult;flush?:boolean}):TemplateResult{return html`<figure class=${options.flush?'en-media-card en-media-card-flush':'en-media-card'}><img src=${options.src} alt=${options.alt}><figcaption>${options.caption}</figcaption>${options.actions??nothing}</figure>`;}
