import {html} from 'lit';
import {textFieldDefinition} from '@en-reve/elements/definitions/text-field.js';
import type {DeliveryIdentity} from '@en-reve/elements/delivery.js';

export const version = 'form';
export const delivery: DeliveryIdentity = {schemaVersion: 1, id: 'fixture/ssr', version: '1'};
export const definitions = [textFieldDefinition];

/** The same template is rendered by the packed worker and hydrated in the browser. */
export function template(snapshot: {message: string}) {
  return html`<form>
    <label>Native draft <input name="native" value=${snapshot.message} required></label>
    <en-text-field label="Managed draft" name="managed" value=${snapshot.message} required></en-text-field>
    <button type="submit">Submit drafts</button>
  </form>`;
}

export async function ready(root: Element | ShadowRoot) {
  await (root.querySelector('en-text-field') as HTMLElement & {updateComplete: Promise<boolean>}).updateComplete;
}
