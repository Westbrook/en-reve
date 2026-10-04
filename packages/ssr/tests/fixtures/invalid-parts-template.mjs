import { html, nothing } from 'lit';

const items = Object.freeze([{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }]);

/** The same application-error and untouched required snapshots render on both sides. */
export function invalidPartsTemplate() {
  return html`${['application', 'pristine'].map(mode => {
    const application = mode === 'application';
    const error = application ? 'Server supplied error' : nothing;
    return html`<section aria-label=${`${mode} validation feedback`}>
      <en-checkbox id=${`${mode}-checkbox`} data-invalid-case required ?checked=${application} error=${error} label="Checkbox"></en-checkbox>
      <en-radio-group label="Radio group" value=${application ? 'alpha' : ''}>
        <en-radio id=${`${mode}-radio`} data-invalid-case required value="alpha" ?checked=${application} error=${error} label="Radio"></en-radio>
      </en-radio-group>
      <en-switch id=${`${mode}-switch`} data-invalid-case required ?checked=${application} error=${error} label="Switch"></en-switch>
      <en-search-input id=${`${mode}-search`} data-invalid-case required value=${application ? 'Server search' : ''} error=${error} label="Search"></en-search-input>
      <en-otp-field id=${`${mode}-otp`} data-invalid-case required value=${application ? '012345' : ''} error=${error} label="Verification code"></en-otp-field>
      <en-textarea id=${`${mode}-textarea`} data-invalid-case required value=${application ? 'Server notes' : ''} error=${error} label="Notes"></en-textarea>
      <en-number-field id=${`${mode}-number`} data-invalid-case required value=${application ? '12' : ''} error=${error} label="Quantity"></en-number-field>
      <en-combobox id=${`${mode}-combobox`} data-invalid-case required value=${application ? 'alpha' : ''} .items=${items} error=${error} label="Asset"></en-combobox>
      <en-select id=${`${mode}-select`} data-invalid-case required value=${application ? 'alpha' : ''} .items=${items} placeholder="Choose an asset" error=${error} label="Format"></en-select>
      <en-text-field id=${`${mode}-text`} data-invalid-case required value=${application ? 'Server title' : ''} error=${error} label="Title"></en-text-field>
      <en-text-field id=${`${mode}-adorned`} data-invalid-case adorned required value=${application ? 'Server budget' : ''} error=${error} label="Budget"><span slot="prefix">$</span></en-text-field>
      <en-otp-field id=${`${mode}-otp-adorned`} data-invalid-case adorned required value=${application ? '012345' : ''} error=${error} label="Adorned verification code"><span slot="prefix">Code</span></en-otp-field>
    </section>`;
  })}`;
}
