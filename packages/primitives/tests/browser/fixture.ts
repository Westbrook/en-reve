import { LitElement, html } from 'lit';
import { createDraftModel } from '../../dist/state/draft.js';
import { createValueModel } from '../../dist/state/value.js';
import { SignalController } from '../../dist/interactions/signal-controller.js';
import { EditingController } from '../../dist/interactions/editing-controller.js';
import { FormController } from '../../dist/interactions/form-controller.js';
import { RovingFocusController } from '../../dist/interactions/roving-focus.js';
import { dispatchChange } from '../../dist/interactions/events.js';

class EditingFixture extends LitElement {
  model = createDraftModel('saved');
  authorRevision = 0;
  requests = 0;
  signals = new SignalController(this, () => this.model.view.get());
  editing = new EditingController(this, {
    model: this.model,
    control: () => this.shadowRoot?.querySelector('input') ?? null,
    onCommit: (value, reason) => {
      this.requests++;
      dispatchChange(this, {
        previous: this.model.value.get(), proposed: value, reason,
        getRevision: () => this.authorRevision,
        stage: next => { this.model.stageValue(next); },
        rollback: previous => { this.model.stageValue(previous); },
        commit: next => { this.model.setValue(next); this.editing.sync(); this.requestUpdate(); },
      });
    },
  });
  write(value: string) { this.authorRevision++; this.model.setValue(value); this.editing.sync(); this.requestUpdate(); }
  render() { return html`<label>Draft title<input></label><output aria-label="Accepted title">${this.model.value.get()}</output>`; }
}
customElements.define('en-editing-fixture', EditingFixture);

class RovingFixture extends LitElement {
  controller = new RovingFocusController(this, { items: () => [...this.shadowRoot?.querySelectorAll<HTMLElement>('[data-item]') ?? []] });
  render() { return html`<div role="toolbar" aria-label="Tools"><button data-item>First</button><button data-item disabled>Unavailable</button><button data-item>Last</button><div data-item><label>Nested edit<input></label></div></div>`; }
}
customElements.define('en-roving-fixture', RovingFixture);

class EventFixture extends LitElement {
  model = createValueModel(false);
  signals = new SignalController(this, () => this.model.view.get());
  render() { return html`<button @click=${() => dispatchChange(this, { previous: this.model.value.get(), proposed: !this.model.value.get(), reason: 'toggle', getRevision: () => 0, stage: next => { this.model.set(next); }, rollback: previous => { this.model.set(previous); } })}>Toggle state</button><output aria-label="Toggle value">${String(this.model.value.get())}</output>`; }
}
customElements.define('en-event-fixture', EventFixture);
class EventBoundary extends LitElement { render() { return html`<en-event-fixture></en-event-fixture>`; } }
customElements.define('en-event-boundary', EventBoundary);

class FormFixture extends LitElement {
  static formAssociated = true;
  internals = this.attachInternals();
  model = createDraftModel('hello@example.com');
  signals = new SignalController(this, () => this.model.view.get());
  editing = new EditingController(this, {
    model: this.model,
    control: () => this.shadowRoot?.querySelector('input') ?? null,
    onCommit: (value) => { this.model.setValue(value); this.formController.sync(); },
  });
  formController = new FormController(this, {
    internals: this.internals,
    control: () => this.shadowRoot?.querySelector('input') ?? null,
    value: () => this.model.value.get(),
    onReset: () => { this.model.reset(); this.editing.sync(); },
    onRestore: (value) => { if (typeof value === 'string') { this.model.setValue(value); this.editing.sync(); } },
  });
  formDisabledCallback(value: boolean) { this.formController.formDisabled(value); }
  formResetCallback() { this.formController.formReset(); }
  formStateRestoreCallback(value: string, mode: 'restore' | 'autocomplete') { this.formController.formStateRestore(value, mode); }
  render() { return html`<label>Email<input type="email" required></label>`; }
}
customElements.define('en-form-fixture', FormFixture);

document.querySelector('form')!.addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#submitted')!.textContent = JSON.stringify(Object.fromEntries(new FormData(event.target as HTMLFormElement)));
});
await Promise.all([...document.querySelectorAll<LitElement>('en-editing-fixture,en-roving-fixture,en-event-boundary,en-form-fixture')].map((element) => element.updateComplete));
document.body.dataset.ready = 'true';
