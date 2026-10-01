import { html } from 'lit';

export interface AccordionItemView {
  readonly open: boolean;
  readonly disabled: boolean;
  readonly label: string;
  readonly headingLevel: number;
}

/** Stateless disclosure markup; label and controls remain in the same shadow tree. */
export function accordionItemTemplate(view: AccordionItemView, toggle: () => void) {
  return html`
    <section class="en-accordion-item" part="base">
      <div part="heading" role="heading" aria-level=${view.headingLevel}>
        <button id="trigger" class="en-accordion-trigger" part="control" type="button"
          aria-expanded=${String(view.open)} aria-controls="panel" ?disabled=${view.disabled}
          @click=${toggle}>
          <slot name="label"><slot name="heading">${view.label}</slot></slot>
          <span part="indicator" aria-hidden="true">${view.open ? '−' : '+'}</span>
        </button>
      </div>
      <div id="panel" class="en-accordion-panel" part="panel" ?hidden=${!view.open}>
        <slot></slot>
      </div>
    </section>`;
}
