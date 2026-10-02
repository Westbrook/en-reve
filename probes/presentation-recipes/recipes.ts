import {LitElement,html,css,nothing} from 'lit';
import {meterTemplate,choiceCardTemplate,buttonGroupTemplate,attachmentTemplate,appShellTemplate,navigationFlyoutTemplate,joinedFieldTemplate,localDateTimeTemplate,messageMarkerTemplate,systemMessageTemplate,codeBlockTemplate,scrollAreaTemplate,chartDetailTemplate,mediaCardTemplate} from '@en-reve/primitives/templates/patterns.js';
import {chartModel,barChart,type ChartDatum} from '@en-reve/primitives/templates/chart.js';
import {foundationStyles} from '@en-reve/styles/foundations.js';
import {typographyStyles} from '@en-reve/styles/typography.js';
import {controlStyles,formStyles} from '@en-reve/styles/controls.js';
import {buttonStyles} from '@en-reve/styles/buttons.js';
import {linkStyles} from '@en-reve/styles/links.js';
import {radioStyles} from '@en-reve/styles/radio.js';
import {patternStyles} from '@en-reve/styles/patterns.js';
import {recipeStyles} from '@en-reve/styles/recipes.js';
const portable=new URLSearchParams(location.search).get('delivery')==='css';
const source='<img src=x onerror="window.badMarkup=true">';
class ConsumerPresentation extends LitElement {
 static override styles=[...(portable?[]:[foundationStyles,typographyStyles,controlStyles,formStyles,buttonStyles,linkStyles,radioStyles,patternStyles,recipeStyles]),css`:host{display:block;min-inline-size:0;--en-color-action:#1258aa;--en-color-success:#137544;--en-color-warning:#936500;--en-color-danger:#b52237;--en-color-text:#15202b;--en-color-boundary:#777;--en-color-link:#175a96}section,main,nav,form{min-inline-size:0}main{display:grid;gap:1.5rem}h1,h2{overflow-wrap:anywhere}input{box-sizing:border-box;max-inline-size:100%}.en-choice-card{min-inline-size:0}.en-choice-card>span{min-inline-size:0;overflow-wrap:anywhere}.en-joined-field>label{min-inline-size:0}.en-scroll-area{max-block-size:10rem}.chart{min-inline-size:0}svg{display:block;max-inline-size:100%}.en-app-shell>nav{min-inline-size:0}.en-navigation-flyout>ul{box-sizing:border-box;max-inline-size:100%}`];
 private checked=false;private format='pdf';private attached=true;private saved='';private copied='';private query='Keep this draft';private quantity=35;private vertical=false;private submitted='';
 private points:readonly ChartDatum[]=[{key:'draft',label:'Draft',value:-5},{key:'review',label:'Review',value:12},{key:'invalid',label:'Invalid',value:NaN}];
 set data(value:readonly ChartDatum[]){this.points=value;this.requestUpdate();}
 private content(){const model=chartModel(this.points);return html`
 <section aria-label="Delivery choices"><h2 class="en-heading-medium">Delivery choices</h2><form @submit=${(e:Event)=>{e.preventDefault();this.submitted=JSON.stringify([...new FormData(e.currentTarget as HTMLFormElement)]);this.requestUpdate();}}>
 ${choiceCardTemplate({type:'checkbox',name:'updates',value:'yes',label:'Send updates',description:'Project notices',checked:this.checked,onChange:e=>{this.checked=(e.target as HTMLInputElement).checked;this.requestUpdate();}})}
 ${choiceCardTemplate({type:'radio',name:'format',value:'pdf',label:'PDF',checked:this.format==='pdf',onChange:()=>{this.format='pdf';this.requestUpdate();}})}${choiceCardTemplate({type:'radio',name:'format',value:'text',label:'Text',checked:this.format==='text',onChange:()=>{this.format='text';this.requestUpdate();}})}${choiceCardTemplate({type:'checkbox',name:'locked',value:'yes',label:'Locked option',disabled:true})}
 <button class="en-button" type="button" @click=${()=>{this.checked=false;this.format='pdf';this.requestUpdate();}}>Clear choices</button><button class="en-button">Submit choices</button><output aria-label="Submitted choices">${this.submitted}</output></form></section>
 <section aria-label="Uncontrolled choice">${choiceCardTemplate({type:'checkbox',name:'native',value:'yes',label:'Keep native selection'})}</section>
 <section aria-label="Document actions">${buttonGroupTemplate('Document actions',html`<button class="en-button" type="button" @click=${()=>{this.saved='Saved';this.requestUpdate();}}>Save</button><button class="en-button" type="button" @click=${()=>{this.saved='Copied';this.requestUpdate();}}>Duplicate</button><button class="en-button" type="button" disabled>Delete</button>`,{orientation:this.vertical?'vertical':'horizontal'})}<button class="en-button" type="button" @click=${()=>{this.vertical=!this.vertical;this.requestUpdate();}}>Change action orientation</button><output aria-label="Action result">${this.saved}</output></section>
 <section aria-label="Project attachment">${this.attached?attachmentTemplate({name:'Brief notes',url:'/brief.txt',detail:'Local text file',onRemove:()=>{this.attached=false;this.requestUpdate();}}):html`<p>Attachment removed</p>`}</section>
 <section aria-label="Search draft">${joinedFieldTemplate({label:'Search draft',name:'search',value:this.query,onInput:e=>{this.query=(e.target as HTMLInputElement).value;this.requestUpdate();},actions:html`<button class="en-button" type="button" @click=${()=>{this.saved=this.query;this.requestUpdate();}}>Find</button>`})}</section>
 <section aria-label="Schedule"><form>${localDateTimeTemplate({label:'Review time',name:'review',value:'2026-10-02T12:00',min:'2026-10-02T09:00',max:'2026-10-02T17:00',required:true})}</form></section>
 <section aria-label="Budget">${meterTemplate({label:'Budget used',value:this.quantity,min:0,max:100,low:20,high:80,optimum:50})}<button class="en-button" type="button" @click=${()=>{this.quantity=65;this.requestUpdate();}}>Update budget</button></section>
 ${messageMarkerTemplate('Today')}${systemMessageTemplate({label:'Build finished',announce:true,detail:html`<p>All assets prepared.</p>`})}
 <section aria-label="Source sample">${codeBlockTemplate({code:source,label:'Untrusted sample',onCopy:()=>{this.copied=source;this.requestUpdate();}})}<output aria-label="Copied source">${this.copied}</output></section>
 ${scrollAreaTemplate('Long notes',html`<ol>${Array.from({length:35},(_,i)=>html`<li>Review note ${i+1}</li>`)}</ol>`)}
 <section class="chart" aria-label="Review counts">${barChart(model)}<table class="en-recipe-table"><caption>Review counts</caption><thead><tr><th scope="col">Stage</th><th scope="col">Count</th></tr></thead><tbody>${model.data.map(d=>html`<tr><th scope="row">${d.label}</th><td data-numeric>${d.value}</td></tr>`)}</tbody></table>${model.data.length?nothing:html`<p>No chart data</p>`}${chartDetailTemplate('Review details',model.data.map(d=>({label:d.label,value:String(d.value)})))}</section>
 ${mediaCardTemplate({src:'/cover.svg',alt:'Blue cover study',caption:'Cover concept',actions:html`<a class="en-link" href="#notes">Review cover</a>`})}
 <section aria-label="Native recipes"><dl class="en-recipe-description-list"><dt>Owner</dt><dd>Alex Kim</dd></dl><figure class="en-recipe-figure"><blockquote class="en-recipe-quote">Keep the edit simple.</blockquote><figcaption>Review note</figcaption></figure><details class="en-recipe-disclosure"><summary>Extra guidance</summary><p>Native disclosure content.</p></details></section>`;}
 override render(){return html`${portable?html`<link rel="stylesheet" href="/presentation.css">`:nothing}<div class="en-foundation">${appShellTemplate({header:html`<h1 class="en-heading-large">Project delivery</h1>`,navigationLabel:'Project navigation',navigation:navigationFlyoutTemplate({label:'Library',links:[{label:'Chart data',href:'#chart-data',current:true},{label:'Notes',href:'#notes'}]}),main:this.content(),embedded:this.hasAttribute('embedded')})}</div>`;}
}
customElements.define('consumer-presentation',ConsumerPresentation);
await Promise.all([...document.querySelectorAll<ConsumerPresentation>('consumer-presentation')].map(e=>e.updateComplete));
await Promise.all([...document.querySelectorAll('consumer-presentation')].flatMap(e=>[...e.shadowRoot!.querySelectorAll('link')].map(link=>link.sheet?Promise.resolve():new Promise<void>((ok,fail)=>{link.onload=()=>ok();link.onerror=()=>fail(new Error('CSS failed'));}))));
document.body.dataset.ready='true';
