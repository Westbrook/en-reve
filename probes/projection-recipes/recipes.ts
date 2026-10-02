import {LitElement,html,css} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {live} from 'lit/directives/live.js';
import {BreadcrumbsProjectionController} from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import {breadcrumbsTemplate} from '@en-reve/primitives/templates/breadcrumbs.js';
import {slottedNavigationTemplate} from '@en-reve/primitives/templates/slotted-navigation.js';
import {SelectionChildrenController,SELECTION_SLOT_PREFIX} from '@en-reve/primitives/interactions/selection-children.js';
import {dispatchChange} from '@en-reve/primitives/interactions/events.js';
import {foundationStyles,blockHostStyles} from '@en-reve/styles/foundations.js';
import {navigationStyles,breadcrumbHostStyles,navigationHostStyles} from '@en-reve/styles/navigation.js';

class ConsumerPath extends LitElement {
 static override shadowRootOptions:ShadowRootInit={mode:'open',slotAssignment:'manual'};
 static override styles=[foundationStyles,blockHostStyles,navigationStyles,breadcrumbHostStyles];
 readonly projection=new BreadcrumbsProjectionController(this);
 override render(){return breadcrumbsTemplate({label:this.getAttribute('label')??'Project path',...this.projection.view});}
}
// Named mode is useful for an existing root; this fixture does not claim SSR/hydration.
class ConsumerNamedPath extends ConsumerPath {
 static override shadowRootOptions:ShadowRootInit={mode:'open'};
}
class ConsumerNavigation extends LitElement {
 static override styles=[foundationStyles,blockHostStyles,navigationStyles,navigationHostStyles];
 override render(){return slottedNavigationTemplate({label:'Project sections'});}
}
class ConsumerOutputOptions extends LitElement {
 static override styles=[foundationStyles,blockHostStyles,css`
  fieldset{min-inline-size:0}label{display:flex;gap:.5rem;align-items:center;padding:.5rem;overflow-wrap:anywhere}
  label[hidden]{display:none}input{flex:none}slot{min-inline-size:0}output{display:block}
 `];
 readonly choices=new SelectionChildrenController(this,'segmented');
 private selected='draft';
 private revision=0;
 get value(){return this.selected;}
 set value(value:string){this.selected=value;this.revision++;this.requestUpdate();}
 private choose(value:string){
  dispatchChange(this,{previous:this.selected,proposed:value,reason:'selection',getRevision:()=>this.revision,
   stage:next=>{this.selected=next;},rollback:previous=>{this.selected=previous;},
   canCommit:next=>{const current=this.choices.current();return !current.error&&current.items.some(item=>item.value===next&&!item.hidden&&!item.disabled);},
  });
  this.requestUpdate();
 }
 override render(){
  const {items,error}=this.choices.view;
  return html`<fieldset><legend>Output versions</legend><p role="status" ?hidden=${!error}>${error}</p>
   ${repeat(error?[]:items,item=>item.key,item=>html`<label ?hidden=${item.hidden}>
    <input type="radio" name="version" value=${item.value} .checked=${live(this.selected===item.value)} ?disabled=${item.disabled} @change=${()=>this.choose(item.value)}>
    <slot name=${SELECTION_SLOT_PREFIX+item.key}></slot>
   </label>`)}
   </fieldset><output aria-label="Selected version">${this.value}</output>`;
 }
}
customElements.define('consumer-path',ConsumerPath);
customElements.define('consumer-named-path',ConsumerNamedPath);
customElements.define('consumer-navigation',ConsumerNavigation);
customElements.define('consumer-output-options',ConsumerOutputOptions);
for(const link of document.querySelectorAll<HTMLAnchorElement>('[data-count-link]'))link.addEventListener('click',()=>link.dataset.clicks=String(Number(link.dataset.clicks??0)+1));
await Promise.all([...document.querySelectorAll<LitElement>('consumer-path,consumer-named-path,consumer-navigation,consumer-output-options')].map(element=>element.updateComplete));
document.body.dataset.ready='true';
