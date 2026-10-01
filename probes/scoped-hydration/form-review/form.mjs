import {html} from 'lit';
import {textFieldDefinition} from '@en-reve/elements/definitions/text-field.js';
export const version = 'phase5-form-review-v1';
export const definitions = [textFieldDefinition];
export function template() {
  return html`<style>
    :host {display:block} form {display:grid;gap:1rem}
    en-text-field {display:block} button {font:inherit;padding:.65rem 1rem;justify-self:start}
  </style><form id="managed-form" autocomplete="on" action="/blocked-submit" method="post">
    <en-text-field label="Full name" name="name" autocomplete="section-managed name" value=""></en-text-field>
    <en-text-field label="Email" name="email" type="email" autocomplete="section-managed email" value=""></en-text-field>
    <en-text-field label="Street address" name="street" autocomplete="section-managed address-line1" value=""></en-text-field>
    <en-text-field label="City" name="city" autocomplete="section-managed address-level2" value=""></en-text-field>
    <en-text-field label="Postal code" name="postal" autocomplete="section-managed postal-code" value=""></en-text-field>
    <button type="submit">Check managed form values</button>
  </form>`;
}
export async function ready(root) {
  await Promise.all([...root.querySelectorAll('en-text-field')].map(field => field.updateComplete));
}
