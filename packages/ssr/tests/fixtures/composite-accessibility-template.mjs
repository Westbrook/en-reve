import { html } from 'lit';
export function compositeAccessibilityTemplate() {
  return html`<form id="composites">
    <en-color-slider id="color" label="Opacity" name="opacity" value="40" min="0" max="100" editable description="Color fallback."><span slot="description">Shared <strong>color guidance</strong>.</span></en-color-slider>
    <en-range-slider id="range" label="Budget" name="budget" value="[20,80]" description="Range fallback." error="Review the interval."><span slot="description">Shared range guidance.</span></en-range-slider>
    <en-date-picker id="single" label="Review date" name="date" value="2026-09-10" description="Single fallback." calendar="buddhist" error="Review the date."><span slot="description">Single date guidance.</span></en-date-picker>
    <en-date-picker id="dates" label="Review period" selection="range" start-name="start" end-name="end" .defaultRangeValue=${{start:'2026-09-10',end:'2026-09-20'}} calendar="buddhist" description="Date range fallback." error="Review the period."><span slot="description">Date range guidance.</span></en-date-picker>
    <button type="reset">Reset</button>
  </form>`;
}
