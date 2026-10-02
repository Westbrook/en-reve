import {LitElement,html,css,nothing} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {copyQuery,validateQuery,queryOperators,type Query,type QueryField} from '@en-reve/primitives/state/query.js';
import {collectionGetKey,isCollectionKey} from '@en-reve/primitives/state/collection.js';
import {intervalLimits,normalizeInterval,moveInterval,type Interval,type IntervalLimits} from '@en-reve/primitives/state/interval.js';
import {visibleActionCount} from '@en-reve/primitives/state/overflow.js';
import {createDefinitionPreparation,createDefinitionLoader,DefinitionLoadError,registerDefinition,collectDefinitions,type ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {dispatchChange} from '@en-reve/primitives/interactions/events.js';
import {createDraftModel} from '@en-reve/primitives/state/draft.js';
import {EditingController} from '@en-reve/primitives/interactions/editing-controller.js';
import {controlStyles,formStyles} from '@en-reve/styles/controls.js';
const shared=css`:host{display:block;min-inline-size:0}form,fieldset{display:grid;gap:.5rem;min-inline-size:0}label{display:grid;gap:.25rem}button,input,select{font:inherit;box-sizing:border-box;max-inline-size:100%}input{min-inline-size:0}output{display:block}.error{color:#a00}`;
interface RecordItem{key:string;oldKey:string;title:string;score:number}
const initial:readonly RecordItem[]=[{key:' cover ',oldKey:'old-cover',title:'Cover study',score:30},{key:'draft',oldKey:'old-draft',title:'Draft review',score:70},{key:'outline',oldKey:'old-outline',title:'Cover outline',score:90}];
const fields:readonly QueryField[]=[{value:'title',label:'Title'},{value:'score',label:'Score',type:'number'}];
const initialQuery=():Query=>({match:'all',clauses:[{id:'first',field:'title',operator:'contains',value:'Cover'}]});
class ConsumerFilter extends LitElement {
 static override styles=[controlStyles,formStyles,shared];
 private accepted=initialQuery();private draft=initialQuery();private revision=0;private data=initial;private keyOf=collectionGetKey<RecordItem>({getKey:i=>i.key,key:i=>i.oldKey});error='';
 get query(){return copyQuery(this.accepted);}set query(query:Query){const error=validateQuery(query,fields);if(error)throw new TypeError(error);this.accepted=copyQuery(query);this.revision++;this.requestUpdate();}
 setItems(items:readonly RecordItem[],legacy=false){const keyOf=collectionGetKey<RecordItem>(legacy?{key:i=>i.oldKey}:{getKey:i=>i.key,key:i=>i.oldKey});const keys=items.map(keyOf);if(keys.some(k=>!isCollectionKey(k))||new Set(keys).size!==keys.length)throw new TypeError('Items require unique nonblank keys.');this.keyOf=keyOf;this.data=[...items];this.requestUpdate();}
 private edit(event:Event,index:number,name:'field'|'operator'|'value'){const value=(event.target as HTMLInputElement).value;this.draft=copyQuery(this.draft);Object.assign(this.draft.clauses[index]!,{[name]:value});}
 private apply(event:Event){event.preventDefault();this.error=validateQuery(this.draft,fields);if(!this.error)dispatchChange(this,{previous:this.accepted,proposed:copyQuery(this.draft),reason:'filter',getRevision:()=>this.revision,stage:v=>{this.accepted=v;},rollback:v=>{this.accepted=v;}});this.requestUpdate();}
 private matchesQuery(item:RecordItem){const results=this.accepted.clauses.map(c=>{const actual=c.field==='score'?item.score:item.title;switch(c.operator){case'equals':return String(actual)===c.value;case'not-equals':return String(actual)!==c.value;case'contains':return String(actual).includes(c.value);case'greater-than':return Number(actual)>Number(c.value);case'less-than':return Number(actual)<Number(c.value);}});return this.accepted.match==='all'?results.every(Boolean):results.some(Boolean);}
 override render(){return html`<form @submit=${this.apply}><fieldset><legend>Find briefs</legend><label for="match">Match</label><select id="match" @change=${(e:Event)=>{this.draft={...this.draft,match:(e.target as HTMLSelectElement).value as 'all'|'any'};}}><option value="all">All conditions</option><option value="any">Any condition</option></select>${repeat(this.draft.clauses,c=>c.id,(c,index)=>html`<fieldset><legend>Condition ${index+1}</legend><label for=${`field-${index}`}>Field</label><select id=${`field-${index}`} @change=${(e:Event)=>this.edit(e,index,'field')}>${fields.map(f=>html`<option value=${f.value} ?selected=${f.value===c.field}>${f.label}</option>`)}</select><label for=${`operator-${index}`}>Operator</label><select id=${`operator-${index}`} @change=${(e:Event)=>this.edit(e,index,'operator')}>${queryOperators.map(op=>html`<option ?selected=${op===c.operator}>${op}</option>`)}</select><label>Value<input class="en-input" value=${c.value} @input=${(e:Event)=>this.edit(e,index,'value')}></label></fieldset>`)}</fieldset><button type="button" @click=${()=>{this.draft={...this.draft,clauses:[...this.draft.clauses,{id:'clause-'+this.draft.clauses.length,field:'score',operator:'greater-than',value:'50'}]};this.requestUpdate();}}>Add condition</button><button>Apply filters</button><p class="error" role="status">${this.error}</p></form><ul aria-label="Matching briefs">${repeat(this.data.filter(i=>this.matchesQuery(i)),this.keyOf,i=>html`<li data-key=${this.keyOf(i)}><button type="button">${i.title}</button><span>Score ${i.score}</span></li>`)}</ul>`;}
}
class ConsumerRange extends LitElement {
 static override styles=[controlStyles,formStyles,shared];
 private limitsValue=intervalLimits({min:0,max:100,step:5,minGap:10});private selected:Interval=[20,60];private revision=0;
 private lower=createDraftModel('20');private upper=createDraftModel('60');
 private lowEdit=new EditingController(this,{model:this.lower,control:()=>this.renderRoot.querySelector('#low'),dispatchInput:false,onCommit:value=>this.move(0,Number(value))});
 private highEdit=new EditingController(this,{model:this.upper,control:()=>this.renderRoot.querySelector('#high'),dispatchInput:false,onCommit:value=>this.move(1,Number(value))});
 get value(){return [...this.selected] as unknown as Interval;}set value(value:Interval){this.revision++;this.stage(normalizeInterval(value,this.limitsValue));}
 configure(input:Partial<IntervalLimits>){this.limitsValue=intervalLimits(input);this.value=this.selected;}
 private stage(value:Interval){this.selected=value;this.lower.setValue(String(value[0]));this.upper.setValue(String(value[1]));this.lowEdit.sync();this.highEdit.sync();this.requestUpdate();}
 private move(index:0|1,number:number){const proposed=moveInterval(this.selected,index,number,this.limitsValue);if(proposed.every((v,i)=>v===this.selected[i])){this.stage(this.selected);return;}dispatchChange(this,{previous:this.selected,proposed,reason:'range',getRevision:()=>this.revision,stage:v=>this.stage(v),rollback:v=>this.stage(v)});}
 override render(){const l=this.limitsValue;return html`<form><fieldset><legend>Score window</legend><label>Minimum score<input id="low" name="low" class="en-range" type="range" min=${l.min} max=${l.max} step=${l.step} value="20"></label><label>Maximum score<input id="high" name="high" class="en-range" type="range" min=${l.min} max=${l.max} step=${l.step} value="60"></label><output aria-label="Score window">${this.selected.join(' – ')}</output></fieldset></form>`;}
}
const actions=['Rename','Duplicate','Download','Archive'];
class ConsumerOverflow extends LitElement {
 static override styles=[shared,css`:host{inline-size:100%;max-inline-size:45rem}.row,.measure{display:flex;gap:8px}.measure{position:fixed;inset:0 auto auto 0;inline-size:0;block-size:0;overflow:hidden;visibility:hidden;pointer-events:none}.measure>button{max-inline-size:none}.measure>details{flex:none}.row>button,.measure>button,summary{flex:none;padding:.4rem .7rem;white-space:nowrap}.row{align-items:flex-start}button[hidden],details[hidden]{display:none}details>div{display:grid;gap:8px;margin-block-start:8px}summary{cursor:pointer}details{min-inline-size:0}`];
 private count=4;private observer?:ResizeObserver;lastAction='';
 override connectedCallback(){super.connectedCallback();this.observer??=new ResizeObserver(()=>this.measure());this.observer.observe(this);}
 override disconnectedCallback(){this.observer?.disconnect();super.disconnectedCallback();}
 protected override firstUpdated(){this.measure();}
 private measure(){const probes=[...this.renderRoot.querySelectorAll<HTMLElement>('.measure>button')];if(probes.length!==4)return;const widths=probes.map(n=>n.getBoundingClientRect().width);const disclosure=this.renderRoot.querySelector<HTMLElement>('.measure summary')!.getBoundingClientRect().width;const count=visibleActionCount(widths,this.getBoundingClientRect().width,disclosure,8);if(count===this.count)return;const focused=(this.shadowRoot?.activeElement as HTMLElement)?.dataset.action;this.count=count;this.requestUpdate();void this.updateComplete.then(()=>{if(focused){const target=this.renderRoot.querySelector<HTMLButtonElement>(`.row button[data-action="${focused}"]:not([hidden])`);const details=target?.closest('details');if(details)details.open=true;target?.focus();}});}
 override render(){return html`<div class="measure" aria-hidden="true">${actions.map(a=>html`<button tabindex="-1">${a}</button>`)}<details><summary>More</summary></details></div><div class="row" role="group" aria-label="Brief actions">${actions.map((a,i)=>html`<button type="button" data-action=${a} ?hidden=${i>=this.count} @click=${()=>{this.lastAction=a;this.requestUpdate();}}>${a}</button>`)}<details ?hidden=${this.count===4}><summary>More</summary><div>${actions.map((a,i)=>html`<button type="button" data-action=${a} ?hidden=${i<this.count} @click=${()=>{this.lastAction=a;this.requestUpdate();}}>${a}</button>`)}</div></details></div><output aria-label="Last action">${this.lastAction}</output>`;}
}
customElements.define('consumer-filter',ConsumerFilter);customElements.define('consumer-range',ConsumerRange);customElements.define('consumer-overflow',ConsumerOverflow);
const metrics={loads:0,fail:false};const manifest=Object.freeze({'consumer-lazy-panel':async()=>{metrics.loads++;if(metrics.fail)throw new Error('Consumer source temporarily unavailable');return (await import('./lazy-panel.js')).definition;}});
const preparation=createDefinitionPreparation(manifest),loader=createDefinitionLoader(customElements,manifest);
const status=document.querySelector<HTMLOutputElement>('#loader-state')!;
const act=async(kind:'prepare'|'ensure'|'retry')=>{try{if(kind==='prepare')await preparation.load(['consumer-lazy-panel']);else await loader.ensure(['consumer-lazy-panel'],{retry:kind==='retry'});status.textContent=kind==='prepare'?'Prepared without registration':'Registered';}catch(e){status.textContent=e instanceof DefinitionLoadError?e.stage+': '+e.tags.join(', '):String(e);}};
document.querySelector('#prepare')!.addEventListener('click',()=>void act('prepare'));document.querySelector('#ensure')!.addEventListener('click',()=>void act('ensure'));document.querySelector('#retry')!.addEventListener('click',()=>void act('retry'));
// The integration harness exposes explicit application diagnostics, not library globals.
Object.assign(window,{consumerDiagnostics:{metrics,preparation,loader,manifest,collectDefinitions,registerDefinition,DefinitionLoadError,definition:async()=>((await import('./lazy-panel.js')).definition)}});
await Promise.all([...document.querySelectorAll<LitElement>('consumer-filter,consumer-range,consumer-overflow')].map(e=>e.updateComplete));document.body.dataset.ready='true';
export type {ElementDefinition};
