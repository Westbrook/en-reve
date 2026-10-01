import {html} from 'lit';
import {textFieldDefinition} from '@en-reve/elements/definitions/text-field.js';
export const version='form';
export const definitions=[textFieldDefinition];
// The value attribute supplies the reset default; .value alone is current state.
export function template(snapshot){return html`<form><en-text-field label="Project" name="project" value=${snapshot.message} required></en-text-field><button type="submit">Submit project</button></form>`;}
export async function ready(root){await root.querySelector('en-text-field').updateComplete;}
