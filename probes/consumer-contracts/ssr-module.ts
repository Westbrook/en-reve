import {html} from 'lit';
import {textFieldDefinition} from '@en-reve/elements/definitions/text-field.js';
import type {HydrationModule} from '@en-reve/ssr/client.js';
import type {EnTextField} from '@en-reve/elements/text-field.js';
export const version = 'consumer-v1';
export const definitions = [textFieldDefinition];
export function template(snapshot: unknown) {
  const {message} = snapshot as {message: string};
  return html`<form><en-text-field label="Project" name="project" value=${message} required></en-text-field><button type="submit">Save project</button></form>`;
}
export async function ready(root: Element | ShadowRoot, signal: AbortSignal) {
  await (root.querySelector('en-text-field') as EnTextField).updateComplete;
  signal.throwIfAborted();
}
const contract: HydrationModule = {version, definitions, template, ready};
void contract;
