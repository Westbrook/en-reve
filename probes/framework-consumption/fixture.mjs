import { html } from 'lit';
export const fixtureTemplate = () => html`
 <section aria-label="Server-rendered library controls">
  <en-checkbox id="island-checkbox">Preserve proportions</en-checkbox>
  <en-select id="island-select" label="Export format" value="svg">
   <en-select-option value="svg">SVG</en-select-option>
   <en-select-option value="png">PNG</en-select-option>
  </en-select>
  <output id="island-state">false</output>
 </section>`;
