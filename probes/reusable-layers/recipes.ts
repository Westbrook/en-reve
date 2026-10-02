import {LitElement, html, css} from 'lit';
import {createDisclosureModel} from '@en-reve/primitives/state/disclosure.js';
import {createSelectionModel} from '@en-reve/primitives/state/selection.js';
import {SignalController} from '@en-reve/primitives/interactions/signal-controller.js';
import {fieldTemplate} from '@en-reve/primitives/templates/field.js';
import {descriptionTemplate} from '@en-reve/primitives/templates/description.js';
import {disclosureTemplate} from '@en-reve/primitives/templates/disclosure.js';
import {foundationStyles, blockHostStyles} from '@en-reve/styles/foundations.js';
import {controlStyles, formStyles} from '@en-reve/styles/controls.js';
import {typographyStyles} from '@en-reve/styles/typography.js';

// Application-owned semantic controls composed from the public lower layers.
// No en-* component definition or catalog is imported or registered.
export class LayerRecipe extends LitElement {
  static styles=[foundationStyles,blockHostStyles,typographyStyles,controlStyles,formStyles,css`
    :host{max-inline-size:36rem;padding:1rem}input.en-input{inline-size:100%}
    fieldset{min-inline-size:0}button{margin-block:.5rem}label{display:block}
  `];
  disclosure=createDisclosureModel();
  selection=createSelectionModel<string>(['draft'],{multiple:true});
  signals=new SignalController(this,()=>({open:this.disclosure.open.get(),selected:this.selection.selected.get()}));
  render(){
    const {open,selected}=this.signals.snapshot;
    return html`<h2 class="en-heading-medium">Review options</h2>
      ${fieldTemplate({label:html`<label for="notes">Review notes</label>`,control:html`<input class="en-input" id="notes" aria-describedby="description" value="Keep this draft">`,description:descriptionTemplate('Notes stay private until shared.')})}
      <fieldset><legend>Include documents</legend>${['draft','final'].map(key=>html`<label><input type="checkbox" .checked=${selected.includes(key)} @change=${()=>this.selection.toggle(key)}>${key==='draft'?'Draft document':'Final document'}</label>`)}</fieldset>
      <output aria-label="Included documents">${selected.join(', ')||'None'}</output>
      <button class="en-button" @click=${()=>this.selection.reset()}>Reset documents</button>
      ${disclosureTemplate({open,panelId:'details',trigger:html`<button class="en-button" aria-expanded=${String(open)} aria-controls="details" @click=${()=>this.disclosure.toggle()}>Details</button>`,content:html`<label for="detail">Detailed note</label><input class="en-input" id="detail" value="Retained details">`})}`;
  }
}
customElements.define('consumer-layer-recipe',LayerRecipe);
await Promise.all([...document.querySelectorAll<LayerRecipe>('consumer-layer-recipe')].map(element=>element.updateComplete));
document.body.dataset.ready='true';
