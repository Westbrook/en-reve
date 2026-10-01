import { html } from 'lit';

export const comboboxContentItems = Object.freeze([
  { value: 'forest', label: 'Forest canvas' },
  { value: 'festival', label: 'Festival board', disabled: true },
  { value: 'fjord', label: 'Fjord study' },
  { value: 'sunset', label: 'Sunset study' },
]);

export function comboboxContentTemplate() {
  return html`<form id="combobox-content-form">
    <en-combobox id="content-eager" name="eager" label="Eager asset" value="forest"
      .items=${comboboxContentItems}></en-combobox>
    <en-combobox id="content-active" name="asset" label="Active asset" value="forest"
      description="Choose a catalog asset."
      .items=${comboboxContentItems}></en-combobox>
    <en-combobox id="content-unused" name="unused" label="Unused asset" value="sunset"
      .items=${comboboxContentItems}></en-combobox>
    <button type="reset">Reset assets</button>
  </form>`;
}
