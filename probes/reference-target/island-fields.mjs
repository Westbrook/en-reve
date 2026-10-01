import { html } from 'lit';
import { textFieldDefinition } from '@en-reve/elements/definitions/text-field.js';
import { textareaDefinition } from '@en-reve/elements/definitions/textarea.js';
export const version = 'reference-fields';
export const definitions = [textFieldDefinition, textareaDefinition];
export function template(snapshot) {
  return html`<form id="island-form"><label id="island-label" for="island-field">Island account</label><en-text-field id="island-field" name="account" label="Internal account" value=${snapshot.value}></en-text-field><label id="notes-label" for="notes">Island notes</label><en-textarea id="notes" name="notes" label="Internal notes" value="Server notes"></en-textarea></form>`;
}
export async function ready(root) { await Promise.all([...root.querySelectorAll('en-text-field,en-textarea')].map(element => element.updateComplete)); }
