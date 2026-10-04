import { css, html, nothing } from 'lit';
import { EnTextField } from './text-field/element.js';
/** One real input for an OTP, retaining paste, autofill, selection and leading zeros.
 * @tagname en-otp-field
 * @csspart control - Native single-value OTP input; visual cells are CSS decoration.
 */
export class EnOtpField extends EnTextField {
    static override properties = { ...EnTextField.properties, length: { type: Number } };
    static override styles = [...EnTextField.styles, css `
    .otp { font-family:monospace; letter-spacing:.65em; font-variant-numeric:tabular-nums; inline-size:min(100%,calc(var(--_en-otp-length) * 1.65em + 2em)); }
  `];
    /** Expected digit count, bounded to 1–12. */
    declare length: number;
    constructor() { super(); this.length = 6; this.autocomplete = 'one-time-code'; this.inputMode = 'numeric'; }
    protected override renderControl() { const length = Math.min(12, Math.max(1, Math.floor(this.length) || 6)); return html `<input id="control" class="en-input en-text-input otp" part=${this.visibleError ? 'control control-invalid' : 'control'} style=${`--_en-otp-length:${length}`} type="text" name=${this.name} value=${this.defaultControlValue} autocomplete="one-time-code" inputmode="numeric" pattern=${`[0-9]{${length}}`} minlength=${length} maxlength=${length} placeholder=${this.placeholder || nothing} ?disabled=${this.isDisabled} ?readonly=${this.readOnly} ?required=${this.required} aria-describedby=${this.describedBy} aria-invalid=${this.controlAriaInvalid}>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-otp-field': EnOtpField;
    }
}
