import { LitElement } from 'lit';
import { StaticStylesController } from '@en-reve/primitives/interactions/static-styles.js';

/** Descriptor metadata is reflected so browser and SSR read the same authored contract. */
export abstract class SelectionItemElement extends LitElement {
  private readonly staticStyles = new StaticStylesController(this);
  static override properties = {
    value: { noAccessor: true, reflect: true, useDefault: true },
    disabled: { type: Boolean, noAccessor: true, reflect: true, useDefault: true },
    label: { type: String, noAccessor: true, reflect: true, useDefault: true },
  };
  #value = '';
  /** Explicit parent-owned choice identifier; changing it never selects the item. */
  get value(): string { return this.#value; }
  set value(value: string) {
    const previous = this.#value;
    this.#value = String(value ?? '');
    if (this.getAttribute('value') !== this.#value) this.setAttribute('value', this.#value);
    const options = this.getAttribute('value') !== this.#value
      ? Object.assign(Object.create((this.constructor as typeof SelectionItemElement).getPropertyOptions('value')), { hasChanged: () => true })
      : undefined;
    this.requestUpdate('value', previous, options);
  }
  #disabled = false;
  /** Exclude this choice from user selection. The parent retains value authority. @default false */
  get disabled(): boolean { return this.#disabled; }
  set disabled(value: boolean) {
    const previous = this.#disabled; this.#disabled = Boolean(value);
    if (this.hasAttribute('disabled') !== this.#disabled) this.toggleAttribute('disabled', this.#disabled);
    this.requestUpdate('disabled', previous);
  }
  #label = '';
  /** Plain label fallback when no label content is supplied. @default '' */
  get label(): string { return this.#label; }
  set label(value: string) {
    const previous = this.#label; this.#label = String(value ?? '');
    if (this.getAttribute('label') !== this.#label) this.setAttribute('label', this.#label);
    this.requestUpdate('label', previous);
  }

}
