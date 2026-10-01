import { html, nothing } from 'lit';

export interface AlertView {
  announcement?: 'none' | 'polite' | 'assertive';
  open: boolean;
  variant: string;
  dismissible: boolean;
  dismissLabel: string;
  onDismiss: () => void;
  hasIcon: boolean;
  onIconChange: (event: Event) => void;
}

export const alertTemplate = (view: AlertView) => html`
  <div class="en-alert" part="base" data-variant=${view.variant} ?hidden=${!view.open}>
    <span class="en-alert__icon" part="icon" aria-hidden="true" ?hidden=${!view.hasIcon}><slot name="icon" @slotchange=${view.onIconChange}></slot></span>
    <div class="en-alert__content" part="content" role=${view.announcement === 'none' ? nothing : view.announcement === 'assertive' ? 'alert' : 'status'} aria-atomic=${view.announcement === 'none' ? nothing : 'true'}><slot></slot></div>
    ${view.dismissible ? html`
      <button
        class="en-button en-icon-button en-alert__close"
        data-variant="ghost"
        part="close"
        type="button"
        aria-label=${view.dismissLabel}
        @click=${view.onDismiss}
      ><svg class="en-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    ` : null}
  </div>
`;
