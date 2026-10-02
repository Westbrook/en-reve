import { html } from 'lit';
import { textFieldDefinition } from '@en-reve/elements/definitions/text-field.js';
import { textareaDefinition } from '@en-reve/elements/definitions/textarea.js';
import {checkboxDefinition} from '@en-reve/elements/definitions/checkbox.js';
import {switchDefinition} from '@en-reve/elements/definitions/switch.js';
import {radioDefinition} from '@en-reve/elements/definitions/radio.js';
export const version = 'reference-fields';
export const definitions = [textFieldDefinition, textareaDefinition, checkboxDefinition, switchDefinition, radioDefinition];
export function template(snapshot) {
  return html`<form id="island-form"><label id="island-label" for="island-field">Island account</label><en-text-field id="island-field" name="account" label="Internal account" value=${snapshot.value}></en-text-field><label id="notes-label" for="notes">Island notes</label><en-textarea id="notes" name="notes" label="Internal notes" value="Server notes"></en-textarea><label id="choice-label" for="island-choice">Island choice</label><en-checkbox id="island-choice" name="choice" value="yes" label="Internal choice"></en-checkbox><label id="switch-label" for="island-switch">Island switch</label><en-switch id="island-switch" name="switch" value="yes" label="Internal switch"></en-switch><label id="radio-label" for="island-radio">Island radio</label><en-radio id="island-radio" name="radio" value="yes" label="Internal radio"></en-radio></form>`;
}
export async function ready(root) { await Promise.all([...root.querySelectorAll('en-text-field,en-textarea,en-checkbox,en-switch,en-radio')].map(element => element.updateComplete)); }
