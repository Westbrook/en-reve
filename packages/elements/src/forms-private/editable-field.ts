import { EditingController } from '@en-reve/primitives/interactions/editing-controller.js';
import { FormFieldElement } from './form-field.js';

/** Private native-editing adapter shared by text, multiline, date and numeric fields. */
export abstract class EditableFieldElement extends FormFieldElement {
  static properties = {
    ...FormFieldElement.properties,
    readOnly: { type: Boolean, attribute: 'readonly', reflect: true },
    autocomplete: { type: String },
    inputMode: { type: String, attribute: 'inputmode' },
  };

  /** Preserve focus and text selection while preventing edits. */
  declare readOnly: boolean;
  /** Native autocomplete purpose, such as email or current-password. */
  declare autocomplete: string;
  declare inputMode: string;

  protected readonly editing = new EditingController(this, {
    model: this.model,
    control: () => this.controlNode as HTMLInputElement | HTMLTextAreaElement | null,
    onCommit: (value, reason) => {
      if (!this.readOnly) this.requestValue(value, reason);
    },
  });

  constructor() {
    super();
    this.readOnly = false;
    this.autocomplete = '';
    this.inputMode = '';
  }

  protected override canCommitValue(value: string): boolean {
    return !this.readOnly && super.canCommitValue(value);
  }

  protected reconcile(): void { this.editing?.sync(); }

  /** Select editable text using native selection behavior where the input type supports it. */
  select(): void { (this.controlNode as HTMLInputElement | HTMLTextAreaElement | null)?.select(); }
}
