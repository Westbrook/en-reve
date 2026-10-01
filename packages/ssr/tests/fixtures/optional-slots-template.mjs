import { css, html, LitElement, nothing } from 'lit';

class OptionalSlotForwarder extends LitElement {
  static properties = { fallback: { type: Boolean } };
  static styles = css`:host { display: block; } h2, p { margin: 0; } svg { display: block; }`;
  constructor() { super(); this.fallback = false; }
  render() {
    return html`<en-card>
      <slot name="heading" slot="header">${this.fallback ? html`<h2>Fallback heading</h2>` : nothing}</slot>
      <p>Forwarded body.</p>
      <en-alert><slot name="symbol" slot="icon">${this.fallback ? html`<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="currentColor"></circle></svg>` : nothing}</slot>Forwarded status.</en-alert>
      <slot name="actions" slot="footer">${this.fallback ? html`<button type="button">Fallback action</button>` : nothing}</slot>
    </en-card>`;
  }
}

if (!customElements.get('en-optional-slot-forwarder')) customElements.define('en-optional-slot-forwarder', OptionalSlotForwarder);

const icon = id => html`<svg id=${id} slot="icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="currentColor"></circle></svg>`;

// The server route and manual client hydration import this same source template.
export function optionalSlotsTemplate() {
  return html`
    <section aria-label="API-06 slot ownership">
      <en-validation-summary id="api06-summary" description="Server fallback" .items=${[{target:'api06-target',message:'Enter a name'}]}><strong slot="description">Authored guidance</strong></en-validation-summary>
      <en-validation-summary id="api06-empty" .items=${[{target:'api06-target',message:'Enter a name'}]}></en-validation-summary>
      <input id="api06-target" aria-label="Name">
      <en-activity-item id="api06-activity" datetime="2026-09-19" time-label="Server timestamp"><time slot="metadata" datetime="2026-09-20">Authored timestamp</time>Activity</en-activity-item>
    </section>
    <section aria-label="Card optional regions">
      <en-card id="card-both">
        <h2 id="card-heading" slot="header">Complete card</h2>
        <p>Card body.</p>
        <button id="card-action" slot="footer" type="button">Keep focus</button>
      </en-card>
      <en-card id="card-bare"><p>Card body.</p></en-card>
      <en-card id="card-header"><h2 slot="header">Header only</h2><p>Card body.</p></en-card>
      <en-card id="card-footer"><p>Card body.</p><button slot="footer" type="button">Footer only</button></en-card>
      <en-card id="card-outer">
        <en-card id="card-inner">
          <h2 slot="header">Nested card</h2>
          <en-alert id="alert-nested">${icon('nested-icon')}Nested status.</en-alert>
          <en-select id="nested-select" label="Nested format" value="svg">
            <en-select-option value="png">PNG</en-select-option>
            <en-select-option value="svg">SVG</en-select-option>
          </en-select>
          <en-breadcrumbs id="nested-path" label="Nested path"><a id="nested-home" href="#home">Home</a><span aria-current="page">Current</span></en-breadcrumbs>
          <button slot="footer" type="button">Nested action</button>
        </en-card>
      </en-card>
    </section>
    <section aria-label="Alert optional icons">
      <en-alert id="alert-icon" dismissible dismiss-label="Dismiss fixture status">${icon('status-icon')}Status with icon.</en-alert>
      <en-alert id="alert-plain">Status without icon.</en-alert>
    </section>
    <section aria-label="Forwarded optional regions">
      <en-optional-slot-forwarder id="forward-empty"></en-optional-slot-forwarder>
      <en-optional-slot-forwarder id="forward-present">
        <h2 slot="heading">Forwarded heading</h2>
        <svg slot="symbol" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="currentColor"></circle></svg>
        <button slot="actions" type="button">Forwarded action</button>
      </en-optional-slot-forwarder>
      <en-optional-slot-forwarder id="forward-fallback" fallback></en-optional-slot-forwarder>
    </section>
    <section id="client-only" aria-label="Client-created surfaces"></section>`;
}

export const optionalSlotsDocumentStyles = `
  body { margin: 24px; font: 16px/1.5 sans-serif; }
  main { max-width: 720px; }
  section { display: grid; gap: 16px; margin-block-end: 16px; }
  h2, p { margin: 0; }
  svg[slot="icon"] { display: block; }
  #card-inner > en-select, #card-inner > en-breadcrumbs { margin-block-start: 12px; }
`;
