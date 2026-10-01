import { html } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';

export const descriptionCases = [
  ['en-text-field', '#control'], ['en-textarea', '#control'],
  ['en-rich-text-editor', '.editor'], ['en-token-editor', '.editor'],
  ['en-range-slider', '.thumb, input[type=number]'],
  ['en-checkbox-group', '#choices'], ['en-toggle-group', '#choices'],
  ['en-multiselect', '#query'], ['en-selection-collection', 'section'],
  ['en-combobox', '#control'], ['en-file-upload', 'input[type=file]'],
  ['en-time-field', '#control'], ['en-otp-field', '#control'],
  ['en-date-picker', 'input[type=date]'], ['en-color-slider', 'input[type=range]'],
];
export const descriptionOverlays = ['en-dialog', 'en-drawer', 'en-sheet', 'en-media-viewer', 'en-command-palette'];
export function descriptionContentTemplate() {
  return html`<h1>Description contract</h1>
    ${descriptionCases.map(([name]) => {
      const tag = unsafeStatic(name);
      return staticHtml`<${tag} id=${name} label=${name} description="Fallback guidance."
        .items=${[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]}>
        <span slot="description">Shared <strong>guidance</strong>. <a href="#guide">Read guide</a></span>
      </${tag}>`;
    })}
    ${descriptionOverlays.map(name => {
      const tag = unsafeStatic(name);
      return staticHtml`<${tag} id=${name} label=${name} description="Fallback guidance.">
        <span slot="description">Shared <strong>guidance</strong>. <a href="#guide">Read guide</a></span>
        <p>Dialog body.</p>
      </${tag}>`;
    })}
    <en-date-picker id="range-date" label="Date range" selection="range" description="Choose a review period."></en-date-picker>
    <en-validation-summary id="summary" description="Fallback guidance." .items=${[{target:'en-text-field',message:'Review this field.'}]}><span slot="description">Summary guidance.</span></en-validation-summary>
    <en-checkbox-group id="projected" label="Projected choices">
      <en-choice-option value="empty" label="Empty" description="Suppressed fallback"><span slot="description"></span></en-choice-option>
      <en-choice-option value="hidden" label="Hidden" description="Suppressed fallback"><span slot="description" hidden>Hidden guidance</span></en-choice-option>
      <en-choice-option value="plain" label="Plain" description="Plain guidance"></en-choice-option>
    </en-checkbox-group>
    <h2 id="guide">Guidance destination</h2>`;
}
