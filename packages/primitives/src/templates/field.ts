import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';

export type FieldContent = TemplateResult | string | number | null | undefined | typeof nothing;

export interface FieldTemplateOptions {
  /** Supply a real associated label or a named slot; the layout itself invents no association. */
  label?: FieldContent;
  control: FieldContent;
  description?: FieldContent;
  error?: FieldContent;
  invalid?: boolean;
}

/** Pure field layout. Callers own label/description IDs and the semantic control. */
export function fieldTemplate({ label, control, description, error, invalid = false }: FieldTemplateOptions): TemplateResult {
  return html`<div part="field" data-invalid=${invalid ? '' : nothing}>
    ${label == null ? nothing : html`<div part="label">${label}</div>`}
    <div part="control">${control}</div>
    ${description == null ? nothing : html`<div part="description">${description}</div>`}
    ${invalid && error != null ? html`<div part="error">${error}</div>` : nothing}
  </div>`;
}
