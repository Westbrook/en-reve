import type { ReactiveElement } from 'lit';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';

/** Application errors invalidate; translated constraint messages only describe existing failures. */
export function applicationValidation(validation: FormValidation, error: string): FormValidation {
  return error ? { ...validation, flags: { ...validation.flags, customError: true }, message: error } : validation;
}

/** Shared presentation state for choice controls without a native editing draft. */
export class ValidationFeedback {
  private message = '';
  private shown = false;
  constructor(private readonly host: ReactiveElement, private readonly sync: () => void,
    private readonly constraintMessage: () => string) {
    host.addEventListener('invalid', event => {
      if (event.target !== host) return;
      this.shown = true;
      host.requestUpdate();
    });
  }
  get error(): string { return this.message; }
  set error(value: string) {
    const previous = this.message;
    this.message = String(value ?? '');
    this.sync();
    this.host.requestUpdate('error', previous);
  }
  get visible(): string { return this.message || (this.shown ? this.constraintMessage() : ''); }
  reset(): void { this.shown = false; this.host.requestUpdate(); }
}
