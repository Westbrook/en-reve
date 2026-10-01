import { html } from 'lit';

export const skeletonTemplate = (shape: string) => html`
  <span class="en-skeleton" part="base" data-shape=${shape} aria-hidden="true"></span>
`;
