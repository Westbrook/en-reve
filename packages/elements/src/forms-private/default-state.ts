import type { ReactiveElement } from 'lit';

/** Private native-style dirty flag. Defaults remain in markup; live writes never reflect. */
export class DefaultState<T> {
  private dirty = false;
  private applying = false;
  private reflecting = false;

  constructor(
    private readonly host: ReactiveElement,
    private readonly attribute: string,
    private readonly read: (attribute: string | null) => T,
    private readonly serialize: (value: T) => string | null,
    private readonly write: (value: T) => void,
  ) {}

  get value(): T { return this.read(this.host.getAttribute(this.attribute)); }
  set value(value: T) {
    const attribute = this.serialize(value);
    this.reflecting = true;
    try {
      if (attribute === null) this.host.removeAttribute(this.attribute);
      else this.host.setAttribute(this.attribute, attribute);
    } finally { this.reflecting = false; }
    // Lit SSR's attribute-to-property adapter does not run browser callbacks.
    this.attributeChanged();
  }

  get isDirty(): boolean { return this.dirty; }

  markDirty(): void { if (!this.applying) this.dirty = true; }

  attributeChanged(): void {
    if (this.reflecting) return;
    if (!this.dirty) this.apply();
    this.host.requestUpdate();
  }

  reset(): void {
    this.dirty = false;
    this.apply();
  }

  /** Constraint normalization and initialization must not turn pristine state into an edit. */
  apply(value: T = this.value): void {
    const applying = this.applying;
    this.applying = true;
    try { this.write(value); } finally { this.applying = applying; }
  }
}
