import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

export interface LinkView {
  href: string | undefined;
  target: string | undefined;
  rel: string;
  download: string | undefined;
}

export const linkTemplate = (view: LinkView) => html`
  <a
    class="en-link"
    part="control"
    href=${ifDefined(view.href)}
    target=${ifDefined(view.target)}
    rel=${ifDefined(view.rel || (view.target === '_blank' ? 'noopener' : undefined))}
    download=${ifDefined(view.download)}
  ><slot name="prefix"></slot><slot></slot><slot name="suffix"></slot></a>
`;
