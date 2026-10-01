import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type FormValue = string | File | FormData | null;
export type NativeFormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export interface FormValidation {
  flags: ValidityStateFlags;
  message?: string;
  anchor?: HTMLElement;
}
export interface FormOptions {
  internals: ElementInternals;
  control?: () => NativeFormControl | null;
  value: () => FormValue;
  state?: () => FormValue;
  disabled?: () => boolean;
  onReset: () => void;
  onRestore?: (state: FormValue, mode: 'restore' | 'autocomplete') => void;
  validate?: () => FormValidation;
}

const validityKeys = ['badInput', 'customError', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow', 'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch', 'valueMissing'] as const;

/** FACE lifecycle adapter. The host attaches internals and forwards browser form callbacks explicitly. */
export class FormController implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #options: FormOptions;
  #fieldsetDisabled = false;

  constructor(host: ReactiveControllerHost, options: FormOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  get disabled(): boolean { return this.#fieldsetDisabled || (this.#options.disabled?.() ?? false); }
  hostUpdated(): void { this.sync(); }

  sync(): void {
    const { internals } = this.#options;
    // Lit's server shim does not implement the browser's submission/validity algorithms.
    if (typeof internals.setFormValue !== 'function') return;
    const value = this.disabled ? null : this.#options.value();
    internals.setFormValue(value, this.#options.state ? this.#options.state() : value);
    const control = this.#options.control?.() ?? null;
    if (control) control.disabled = this.disabled;
    if (typeof internals.setValidity !== 'function') return;
    if (this.disabled) { internals.setValidity({}); return; }
    const validation = this.#options.validate?.();
    if (validation) {
      const invalid = Object.values(validation.flags).some(Boolean);
      if (invalid && !validation.message) throw new TypeError('Invalid form state requires a localized validation message.');
      internals.setValidity(validation.flags, invalid ? validation.message : '', validation.anchor);
    } else if (control) {
      const flags: ValidityStateFlags = {};
      for (const key of validityKeys) if (control.validity[key]) flags[key] = true;
      internals.setValidity(flags, control.validationMessage, control);
    } else {
      internals.setValidity({});
    }
  }

  formDisabled(disabled: boolean): void {
    this.#fieldsetDisabled = disabled;
    this.sync();
    this.#host.requestUpdate();
  }

  formReset(): void {
    this.#options.onReset();
    this.sync();
    this.#host.requestUpdate();
  }

  formStateRestore(state: FormValue, mode: 'restore' | 'autocomplete'): void {
    this.#options.onRestore?.(state, mode);
    this.sync();
    this.#host.requestUpdate();
  }
}
