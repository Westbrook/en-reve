import { html, nothing } from 'lit';

export const spinnerTemplate = (label: string) => html`
  <span role=${label ? 'status' : nothing} aria-label=${label || nothing}>
    <span class="en-spinner" part="base" aria-hidden="true"></span>
  </span>
`;
