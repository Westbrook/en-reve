import { LitElement, html } from 'lit';
import { reaction } from 'signal-utils/subtle/reaction';
import { createModel } from './model.mjs';
export class ProbeSSR extends LitElement {
  static properties = { initial: { type: Number }, label: {} };
  constructor() { super(); this.initial = 0; this.label = ''; this.model = createModel(); }
  willUpdate(changes) { if (changes.has('initial')) this.model.count.set(this.initial); }
  connectedCallback() {
    super.connectedCallback();
    this.stop = reaction(() => this.model.view.get(), () => this.requestUpdate());
  }
  disconnectedCallback() { super.disconnectedCallback(); this.stop?.(); }
  render() {
    const view = this.model.view.get();
    return html`<h2>${this.label}</h2><output aria-label="Count">${view.count}</output><button @click=${() => this.model.count.set(view.count + 1)}>Increment</button><label>Draft<input value="server"></label>`;
  }
}
customElements.define('en-probe-ssr', ProbeSSR);
export const requestTemplate = (snapshot) => html`<en-probe-ssr .initial=${snapshot.count} .label=${snapshot.label}></en-probe-ssr>`;
