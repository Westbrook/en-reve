import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
class PanelStatus extends HTMLElement{connectedCallback(){if(!this.textContent)this.textContent='Details ready';}}
class LazyPanel extends HTMLElement{
 connectedCallback(){if(this.dataset.ready)return;this.dataset.ready='true';const status=document.createElement('consumer-panel-status');status.setAttribute('role','status');this.append(status);this.dataset.childRegistered=String(!!customElements.get('consumer-panel-status'));}
}
export const definition:ElementDefinition={tagName:'consumer-lazy-panel',elementClass:LazyPanel,dependencies:[{tagName:'consumer-panel-status',elementClass:PanelStatus}]};
