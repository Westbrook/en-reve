import { LitElement, html, render } from 'lit';
import { reaction } from 'signal-utils/subtle/reaction';
import { createModel } from './model.mjs';
const root = document.querySelector('#probes')!;
const fixture = (id: string) => { const section = document.createElement('section'); section.id = id; root.append(section); return section; };

// Intentionally a probe, not a production adapter or public API.
class Lifecycle extends LitElement {
  model = createModel(3);
  callbacks = 0;
  renders = 0;
  stop?: () => void;
  connectedCallback() { super.connectedCallback(); this.stop = reaction(() => this.model.view.get(), () => { this.callbacks++; this.requestUpdate(); }); this.requestUpdate(); }
  disconnectedCallback() { super.disconnectedCallback(); this.stop?.(); }
  render() { this.renders++; return html`<output aria-label="Lifecycle count">${this.model.view.get().count}</output>`; }
}
customElements.define('en-probe-lifecycle', Lifecycle);
const lifecycle = document.createElement('en-probe-lifecycle') as Lifecycle;
const lifecycleSection = fixture('lifecycle'); lifecycleSection.append(lifecycle);

class Field extends LitElement { render() { return html`<div part="field"><slot name="label"></slot><slot></slot><slot name="description"></slot></div>`; } }
customElements.define('en-probe-field', Field);
render(html`<form id="native-form"><en-probe-field><label slot="label" for="native-email">Email address</label><input id="native-email" name="email" type="email" required aria-describedby="native-hint"><p id="native-hint" slot="description">Use your work email</p></en-probe-field><button>Submit native</button><button type="reset">Reset native</button></form><output id="native-result"></output>`, fixture('native'));
document.querySelector('#native-form')!.addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#native-result')!.textContent = JSON.stringify(Object.fromEntries(new FormData(event.target as HTMLFormElement))); });

class Face extends LitElement {
  static formAssociated = true;
  internals = this.attachInternals();
  // Internal semantic owner is deliberately named in the same shadow tree.
  render() { return html`<label for="face-input">Internal account</label><input id="face-input" @input=${this.onInput}>`; }
  onInput(event: Event) { this.internals.setFormValue((event.target as HTMLInputElement).value); }
  formResetCallback() { (this.shadowRoot!.querySelector('input') as HTMLInputElement).value = ''; this.internals.setFormValue(''); }
  focus(options?: FocusOptions) { this.shadowRoot!.querySelector('input')!.focus(options); }
}
customElements.define('en-probe-face', Face);
render(html`<form id="face-form"><label id="external-face-label" for="face">External account</label><en-probe-face id="face" name="account"></en-probe-face><button>Submit face</button><button type="reset">Reset face</button></form><output id="face-result"></output>`, fixture('face-section'));
document.querySelector('#face-form')!.addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#face-result')!.textContent = JSON.stringify(Object.fromEntries(new FormData(event.target as HTMLFormElement))); });

class Draft extends LitElement {
  accepted = 'start';
  composing = false;
  queued: string | undefined;
  notifications: Array<{ draft: string; composing: boolean; trusted: boolean }> = [];
  render() { return html`<label>Controlled draft<input .value=${this.accepted} @input=${this.input} @compositionstart=${() => { this.composing = true; }} @compositionend=${this.end}></label><output aria-label="Accepted value">${this.accepted}</output>`; }
  input(event: InputEvent) { this.notifications.push({ draft: (event.target as HTMLInputElement).value, composing: this.composing || event.isComposing, trusted: event.isTrusted }); }
  end() { this.composing = false; if (this.queued !== undefined) { const value = this.queued; this.queued = undefined; this.accept(value); } }
  accept(value: string) {
    if (this.composing) { this.queued = value; return; }
    this.accepted = value;
    // Intentional explicit same-value rejection path. Unrelated renders must never do this.
    const input = this.shadowRoot!.querySelector('input')!;
    if (input.value !== value) input.value = value;
    this.requestUpdate();
  }
}
customElements.define('en-probe-draft', Draft);
fixture('draft').append(document.createElement('en-probe-draft'));

async function scoped() {
  const region = fixture('scoped');
  const report: Record<string, unknown> = { supported: false, stage: 'construct-registry' };
  try {
    for (const version of ['old', 'new']) {
      const registry = new CustomElementRegistry();
      report.stage = 'initialize-document';
      const creationScope = document.implementation.createHTMLDocument();
      registry.initialize(creationScope);
      report.available = true;
      class Leaf extends LitElement {
        constructor() { super(); this.renderOptions.creationScope = creationScope; }
        createRenderRoot() { return this.attachShadow({ mode: 'open', customElementRegistry: registry }); }
        render() { return html`<button @click=${() => this.setAttribute('clicked', version)}>${version} nested action</button>`; }
      }
      class Branch extends LitElement {
        constructor() { super(); this.renderOptions.creationScope = creationScope; }
        createRenderRoot() { return this.attachShadow({ mode: 'open', customElementRegistry: registry }); }
        render() { return html`<p>${version} branch</p><en-probe-leaf></en-probe-leaf>`; }
      }
      registry.define('en-probe-leaf', Leaf);
      registry.define('en-probe-branch', Branch);
      report.stage = 'render-nested-lit';
      const host = document.createElement('div'); host.dataset.version = version;
      region.append(host);
      const shadow = host.attachShadow({ mode: 'open', customElementRegistry: registry });
      render(html`<en-probe-branch></en-probe-branch>`, shadow, { creationScope });
      const branch = shadow.querySelector('en-probe-branch') as Branch;
      await branch.updateComplete;
      const leaf = branch.shadowRoot?.querySelector('en-probe-leaf') as Leaf;
      await leaf?.updateComplete;
      if (!(branch instanceof Branch) || !(leaf instanceof Leaf)) throw new Error(`Wrong construction context for ${version}`);
      report[version] = { branch: true, leaf: true, scopedRoot: shadow.customElementRegistry === registry, creationScope: branch.renderOptions.creationScope === creationScope };
    }
    report.supported = true;
    report.stage = 'complete';
  } catch (error) { report.error = String(error); }
  return report;
}
(window as any).probe = { lifecycle, lifecycleSection, syncSnapshot: createModel(7).view.get(), scoped: await scoped() };
document.body.dataset.ready = 'true';
