import { html, render } from 'lit';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/card.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/rich-text-editor.js';
import '@en-reve/elements/define/editor-toolbar.js';
import '@en-reve/elements/define/token-editor.js';
import '@en-reve/elements/define/data-table.js';
import '@en-reve/elements/define/date-picker.js';
import '@en-reve/elements/define/color-picker.js';
import '@en-reve/elements/define/tree.js';
import '@en-reve/elements/define/carousel.js';
import '@en-reve/elements/define/activity-feed.js';
import '@en-reve/elements/define/activity-item.js';
import '@en-reve/elements/define/toast-region.js';
import { resolveTheme, emitThemeCSS, createThemePatchPlan, emitThemePatchCSS, createReviewDraft, reopenReviewDraft } from '@en-reve/tokens';
import type { ThemeMode, ThemeDensity, ThemeReviewDraft } from '@en-reve/tokens';
import { themeOptions, themeStylesheet, titles, partStyles } from './theme-proof/themes.js';
import type { Direction } from './theme-proof/themes.js';
const get = <T extends HTMLElement=HTMLElement>(id:string) => document.getElementById(id)! as T;
const select=(id:string)=>get<HTMLSelectElement>(id);
const rows=[{id:'brief',name:'Project brief',status:'Ready',size:'12 KB'},{id:'cover',name:'Cover studies',status:'Review',size:'240 KB'},{id:'notes',name:'Research notes — accessibility and localization',status:'Draft',size:'36 KB'}];
const columns=[{key:'name',label:'Asset',renderCell:(item:typeof rows[number])=>item.name},{key:'status',label:'Status',renderCell:(item:typeof rows[number])=>item.status},{key:'size',label:'Size',renderCell:(item:typeof rows[number])=>item.size}];
const documentValue={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Make room for the unexpected.'}]},{type:'paragraph',content:[{type:'text',text:'A shared workspace for ideas, careful decisions, and the details that turn a study into something useful. Edit this text; switching themes preserves your work.'}]}]}};
const sample=(prefix:string)=>html`<en-text-field id=${prefix+'-input'} label="Working title" value="Field notes"></en-text-field><en-button id=${prefix+'-button'}>Save draft</en-button>`;
render(html`
<header class="workspace-head"><div><p class="caption">FIELD NOTES / DESIGN STUDY 08</p><h2>A space for good work.</h2><p>One project. A different point of view.</p></div><en-button id="notify">Save project</en-button></header>
<div class="workspace-grid"><div class="stack">
<en-card><h3 slot="header">Project brief</h3><div class="card-body"><en-editor-toolbar for="brief" label="Format project brief"></en-editor-toolbar><en-rich-text-editor id="brief" label="Project brief document" .document=${documentValue}></en-rich-text-editor><en-token-editor id="note" label="Quick note" value="Plan the next review"></en-token-editor></div></en-card>
<en-card><h3 slot="header">Assets</h3><en-data-table id="asset-table" label="Project assets" .items=${rows} .columns=${columns} page-size="2"></en-data-table></en-card>
<en-card><h3 slot="header">Cover studies</h3><en-carousel id="covers" label="Cover studies" navigation="dots"><en-carousel-slide label="Observation"><div class="slide"><h3>01 / Observation</h3><p class="long">Collect the small details. A deliberately long caption tests wrapping without changing the composition.</p></div></en-carousel-slide><en-carousel-slide label="Exploration"><div class="slide"><h3>02 / Exploration</h3><p>Let the material suggest the next step.</p></div></en-carousel-slide></en-carousel></en-card>
<div class="row"><en-button id="empty-activity" variant="secondary">Toggle empty activity</en-button><en-button id="loading-activity" variant="secondary">Toggle loading activity</en-button></div><en-activity-feed id="activity" label="Project activity"><h3 slot="header">Recent activity</h3><en-activity-item author="Mira Chen" label="Brief updated" datetime="2026-09-18T12:00:00Z" time-label="12:00 UTC">Updated the project brief.</en-activity-item><p slot="empty">No activity yet.</p><p slot="loading">Loading activity…</p></en-activity-feed>
</div><aside class="stack" aria-label="Project inspector"><en-card><h3 slot="header">Inspector</h3><div class="card-body"><en-text-field id="title-field" label="Project title" value="Field notes"></en-text-field><en-select id="stage" label="Stage" value="review" .items=${[{value:'draft',label:'Draft'},{value:'review',label:'In review'},{value:'ready',label:'Ready to publish'}]}></en-select><en-date-picker id="review-date" label="Review date" picker-label="Choose review date" value="2026-09-18" today="2026-09-18"></en-date-picker><en-color-picker id="ink" label="Project ink" value="#476040"></en-color-picker><label>Native priority <select class="native-note" aria-label="Native priority"><option>Normal</option><option>High</option></select></label></div></en-card>
<en-card><h3 slot="header">Project outline</h3><en-tree id="outline" label="Project outline" value="brief" .expanded=${['project']}><en-tree-item value="project" label="Field notes"><en-tree-item slot="children" value="brief" label="Brief"></en-tree-item><en-tree-item slot="children" value="assets" label="Assets"></en-tree-item></en-tree-item></en-tree></en-card>
<en-card><h3 slot="header">Interaction states</h3><div class="card-body"><div class="row"><en-button id="state-rest">Ready</en-button><en-button disabled>Unavailable</en-button><en-button loading>Saving</en-button></div><en-text-field id="readonly-field" label="Reference" readonly value="FN-08"></en-text-field><en-text-field id="invalid-field" label="Required approval" required error="Choose a reviewer before publishing."></en-text-field></div></en-card></aside></div>
<section aria-labelledby="scope-heading"><h3 id="scope-heading">Change one scope at a time</h3><p>Compare each region with the unchanged sibling. The nested theme replaces inherited pins and owns its opposite appearance.</p><div class="scope-grid">
<div id="outside" class="scope-cell"><h3>Unchanged sibling</h3>${sample('outside')}</div>
<div id="buttons-only" class="scope-cell"><h3>Buttons only</h3>${sample('buttons')}</div>
<div id="inputs-only" class="scope-cell"><h3>Inputs only</h3>${sample('inputs')}</div>
<div id="shared" class="scope-cell"><h3>Both families</h3>${sample('shared')}</div>
<div id="concept" class="scope-cell"><h3>Radius concept</h3>${sample('concept')}</div>
<div id="instance" class="scope-cell"><h3>One instance</h3>${sample('instance')}</div>
<div id="nested" class="scope-cell nested proof-surface"><h3>Full nested Precision theme</h3><div class="row">${sample('nested')}<en-date-picker id="nested-date" label="Nested date" picker-label="Choose nested date" value="2026-09-18" today="2026-09-18"></en-date-picker></div></div>
</div><div id="shadow-example"></div></section>
<en-toast-region id="notifications" label="Project notifications" placement="inline"></en-toast-region>`,get('workspace'));
const baseStyle=document.createElement('style');baseStyle.textContent=themeStylesheet();document.head.append(baseStyle);
const style=document.createElement('style');document.head.append(style);
const shadow=get('shadow-example').attachShadow({mode:'open'});
shadow.innerHTML='<style></style><section aria-label="Shadow host theme"><p>Theme installed inside an application-owned shadow root</p><en-button>Shadow action</en-button></section>';
let draft:ThemeReviewDraft;
function current(){return themeOptions(select('direction').value as Direction,select('appearance').value as ThemeMode,(select('density').value||undefined) as ThemeDensity|undefined);}
function update(reset=true){
 if(reset)draft=createReviewDraft(current());
 const theme=draft.theme;
 get('workspace').dataset.proofTheme=select('direction').value;get('workspace').dataset.appearance=theme.mode;
 get('workspace').dir=select('writing').value;
 const partial=(selector:string,changes:Record<string,unknown>)=>emitThemePatchCSS(createThemePatchPlan(theme,{changes}),theme,{selector});
 const nested=resolveTheme(themeOptions('precision',theme.mode==='light'?'dark':'light'));
 style.textContent=emitThemeCSS(theme,{selector:'#workspace',colorScheme:true})
 +partial('#buttons-only',{'component.button.background':'{color.text}','component.button.color':'{color.surface}'})
 +partial('#inputs-only',{'component.input.background':'{color.selected}'})
 +partial('#shared',{'component.control.radius':{value:20,unit:'px'}})
 +partial('#concept',{'radius.control':{value:0,unit:'px'}})
 +emitThemeCSS(nested,{selector:'#nested',colorScheme:true})+partStyles;
 shadow.querySelector('style')!.textContent=emitThemeCSS(theme,{target:'shadow-host',selector:':host',colorScheme:true})+'section{padding:var(--en-space-4);border:1px solid var(--en-color-boundary);font-family:var(--en-font-ui-family);color:var(--en-color-text)}';
 for(const el of get('workspace').querySelectorAll<HTMLElement>('*'))if(el.localName.startsWith('en-'))el.setAttribute('size',select('size').value);
 shadow.querySelector('en-button')!.setAttribute('size',select('size').value);
 get('theme-status').textContent=`${titles[select('direction').value as Direction]} · ${theme.mode} · ${theme.density}. ${theme.diagnostics.length ? theme.diagnostics.length+' token contrast diagnostics: inspect before acceptance.' : 'Declared text-pair contrast checks pass; rendered accessibility still needs review.'}`;
 get('scope-code').textContent=`// Full boundary: resets optional hooks and owns native appearance.
emitThemeCSS(resolveTheme(themeOptions('${select('direction').value}', '${theme.mode}')), {selector: '.workspace', colorScheme: true});

// Graph-aware partial: recomputes radius descendants, retains other values.
const patch = createThemePatchPlan(base, {changes: {'radius.control': {value: 0, unit: 'px'}}});
emitThemePatchCSS(patch, base, {selector: '.inspector'});

// Input paint is a supported family hook; input radius is not.
.inspector { --en-input-background: var(--en-color-selected); }

// Instance escape hatch:
en-button.special::part(control) { border-radius: 0; }`;
 get('workspace').dataset.ready='true';
}
for(const id of ['direction','appearance','density'])select(id).addEventListener('change',()=>update());
for(const id of ['size','writing'])select(id).addEventListener('change',()=>update(false));
for(const state of ['empty','loading'])get(`${state}-activity`).addEventListener('click',()=>{const feed=get('activity') as HTMLElement & {empty:boolean;loading:boolean};feed[state as 'empty'|'loading']=!feed[state as 'empty'|'loading'];});
get('notify').addEventListener('click',()=>{(get('notifications') as HTMLElement & {notify:(options:unknown)=>unknown}).notify({message:'Project saved. Your current theme stays with the notification.',variant:'success',duration:0});});
function download(name:string,value:string,type:string){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
get('export-css').addEventListener('click',()=>{download('three-theme-proof.css',themeStylesheet(),'text/css');get('transfer-status').textContent='Six baseline variants exported with the shared public Part treatment.';});
get('export-json').addEventListener('click',()=>{download(`${draft.theme.name}-review.json`,draft.exportJSON({title:titles[select('direction').value as Direction],rationale:'Three-theme expressive range proof'}),'application/json');get('transfer-status').textContent='Selected typed draft exported. The separate Part treatment is included in the CSS download.';});
get<HTMLInputElement>('import-json').addEventListener('change',async event=>{const input=event.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file)return;try{if(file.size>8*1024*1024)throw new Error('Draft exceeds 8 MB.');const next=reopenReviewDraft(await file.text(),{baseOptions:current()});draft=next;select('appearance').value=draft.theme.mode;update(false);get('transfer-status').textContent='Draft reopened successfully. Current content and selected typed values are preserved.';}catch(error){get('transfer-status').textContent=`Draft unchanged. ${error instanceof Error?error.message:'Invalid draft.'}`;}input.value='';});
if(new URL(location.href).searchParams.has('progress-report')){get('progress-return').hidden=false;for(const a of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')){const u=new URL(a.href);u.searchParams.set('progress-report','');a.href=u.href;}}
update();
