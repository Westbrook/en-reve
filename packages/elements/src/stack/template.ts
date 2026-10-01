import { html } from 'lit';

export interface StackView {
  direction: string;
  gap: string;
  align: string;
  justify: string;
  wrap: boolean;
}

export const stackTemplate = (view: StackView) => html`
  <div
    class="en-stack"
    part="base"
    data-direction=${view.direction}
    data-gap=${view.gap}
    data-align=${view.align}
    data-justify=${view.justify}
    ?data-wrap=${view.wrap}
  ><slot></slot></div>
`;
