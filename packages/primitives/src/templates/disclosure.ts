import { html } from 'lit';
import type { TemplateResult } from 'lit';
import type { FieldContent } from './field.js';

export interface DisclosureTemplateOptions {
  open: boolean;
  panelId: string;
  /** Caller supplies the semantic trigger and its aria-expanded/aria-controls relationship. */
  trigger: FieldContent;
  content: FieldContent;
}

/** Preserves the panel's DOM while closed; does not provide modal behavior or invent focus movement. */
export function disclosureTemplate({ open, panelId, trigger, content }: DisclosureTemplateOptions): TemplateResult {
  return html`<div part="disclosure">${trigger}<div part="panel" id=${panelId} ?hidden=${!open}>${content}</div></div>`;
}
