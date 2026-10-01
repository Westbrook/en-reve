import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

export interface ProgressBarView {
  value: number | undefined;
  max: number;
  label: string;
}

export const progressBarTemplate = (view: ProgressBarView) => html`
  <progress
    class="en-progress"
    part="track"
    max=${view.max}
    value=${ifDefined(view.value)}
    aria-label=${ifDefined(view.label || undefined)}
  ></progress>
`;
