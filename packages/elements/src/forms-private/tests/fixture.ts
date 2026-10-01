import { html, render } from 'lit';
import { EnTextField } from '../../text-field/element.js';
import { EnTextarea } from '../../textarea/element.js';
import { EnSearchInput } from '../../search-input/element.js';
import { EnDateInput } from '../../date-input/element.js';
import { EnSelect } from '../../select/element.js';
import { EnNumberField } from '../../number-field/element.js';
import { EnColorField } from '../../color-field/element.js';

for (const [name, constructor] of [
  ['en-text-field', EnTextField], ['en-textarea', EnTextarea], ['en-search-input', EnSearchInput],
  ['en-date-input', EnDateInput], ['en-select', EnSelect], ['en-number-field', EnNumberField],
  ['en-color-field', EnColorField],
] as const) customElements.define(name, constructor);

const events: Array<{ id: string; type: string; detail: unknown }> = [];
let submissions: Array<Record<string, FormDataEntryValue>> = [];
const items = [{ value: 'png', label: 'PNG image' }, { value: 'svg', label: 'SVG image' }, { value: 'pdf', label: 'PDF document', disabled: true }];

render(html`
  <h1>Native form integration</h1>
  <form id="managed-form">
    <fieldset id="fields">
      <legend>Document settings</legend>
      <en-text-field id="email" label="Contact email" description="Use your work email." name="email" type="email" required value="first@example.com"></en-text-field>
      <en-textarea id="notes" label="Project notes" name="notes" value="Initial notes"></en-textarea>
      <en-search-input id="search" label="Asset search" name="search" value="linen"></en-search-input>
      <en-date-input id="date" label="Publish date" name="date" value="2026-09-18" min="2026-09-01" max="2026-10-31"></en-date-input>
      <en-select id="format" label="Export format" name="format" value="png" .items=${items}></en-select>
      <en-number-field id="number" label="Corner radius" name="radius" value="12" min="0" max="48" step="2"></en-number-field>
      <en-color-field id="color" label="Accent color" name="accent" value="#336699"></en-color-field>
    </fieldset>
    <button type="submit">Submit settings</button><button type="reset">Reset settings</button>
  </form>
  <en-text-field id="controlled" label="Controlled text" value="accepted"></en-text-field>
  <en-text-field id="canceled" label="Canceled text" value="stable"></en-text-field>
  <en-textarea id="controlled-notes" label="Controlled notes" value="accepted notes"></en-textarea>
  <en-number-field id="controlled-number" label="Controlled radius" value="10" min="0" max="20" increment-label="Increase controlled radius" decrement-label="Decrease controlled radius"></en-number-field>
  <en-select id="controlled-select" label="Controlled format" value="png" .items=${items}></en-select>
  <en-color-field id="controlled-color" label="Controlled color" value="#334455"></en-color-field>
`, document.querySelector('#fixture')!);

// Observe the removed request event only to detect accidental dual dispatch.
for (const type of ['en-input', 'en-request-change', 'en-change']) document.addEventListener(type, event => {
  events.push({ id: (event.target as HTMLElement).id, type, detail: (event as CustomEvent).detail });
});
// Consumer policy replaces a component-level mode. Cancel synchronously.
for (const id of ['controlled', 'canceled', 'controlled-notes', 'controlled-number', 'controlled-select', 'controlled-color']) {
  document.getElementById(id)!.addEventListener('en-change', event => event.preventDefault());
}
document.querySelector('#managed-form')!.addEventListener('submit', event => {
  event.preventDefault();
  submissions.push(Object.fromEntries(new FormData(event.target as HTMLFormElement)));
});

Object.assign(window, { formFixture: { events, get submissions() { return submissions; } } });
await Promise.all(Array.from(document.querySelectorAll('en-text-field,en-textarea,en-search-input,en-date-input,en-select,en-number-field,en-color-field'), element => (element as EnTextField).updateComplete));
document.body.dataset.ready = 'true';
