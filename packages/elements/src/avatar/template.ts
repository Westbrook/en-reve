import { html, nothing } from 'lit';

export interface AvatarView {
  name: string;
  src: string;
  initials: string;
  size: string;
  failed: boolean;
  onError: () => void;
}

export const avatarTemplate = (view: AvatarView) => html`
  <span
    class="en-avatar"
    part="base"
    data-size=${view.size}
    role=${view.name ? 'img' : nothing}
    aria-label=${view.name || nothing}
    aria-hidden=${view.name ? nothing : 'true'}
  >
    ${view.src && !view.failed
      ? html`<img class="en-avatar__image" part="image" src=${view.src} alt="" @error=${view.onError} />`
      : html`<span class="en-avatar__fallback" part="fallback" aria-hidden="true">${view.initials}</span>`}
  </span>
`;
