import '@en-reve/elements/define/rich-text-editor.js';
import '@en-reve/elements/define/editor-toolbar.js';
import '@en-reve/elements/define/data-table.js';
import '@en-reve/elements/define/color-picker.js';
import '@en-reve/elements/define/calendar.js';
import type {EnRichTextEditor} from '@en-reve/elements/rich-text-editor.js';
import type {EnDataTable} from '@en-reve/elements/data-table.js';
import {emitThemeCSS,resolveTheme} from '@en-reve/tokens';
const appearance=document.querySelector<HTMLSelectElement>('#appearance')!;
const size=document.querySelector<HTMLSelectElement>('#size')!;
const gap=document.querySelector<HTMLInputElement>('#gap')!;
const style=document.createElement('style');document.head.append(style);
const rich=document.querySelector<EnRichTextEditor>('#rich')!;
rich.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'One coherent language'}]},{type:'paragraph',content:[{type:'text',text:'Edit this brief and try the formatting controls. Document headings follow the shared heading roles.'}]}]}};
const table=document.querySelector<EnDataTable<{id:string;name:string;status:string}>>('#surface')!;
table.columns=[{key:'name',label:'Milestone',renderCell:item=>item.name},{key:'status',label:'Status',renderCell:item=>item.status}];table.pageSize=3;table.items=Array.from({length:8},(_,i)=>({id:String(i),name:['Foundation','Composition','Review','Delivery'][i%4]+' '+(i+1),status:i<3?'Ready':'Planned'}));
appearance.value=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
function update(){style.textContent=emitThemeCSS(resolveTheme({mode:appearance.value==='dark'?'dark':'light'}),{scope:'root',colorScheme:true});for(const el of document.querySelectorAll('main en-rich-text-editor,main en-editor-toolbar,main en-data-table,main en-color-picker,main en-calendar'))el.setAttribute('size',size.value);document.querySelector<HTMLElement>('#toolbar')!.style.setProperty('--en-editor-toolbar-gap',gap.value+'px');document.querySelector('#gap-value')!.textContent=gap.value+'px';}
rich.style.setProperty('--en-input-background','var(--en-color-surface-subtle)');rich.style.setProperty('--en-field-gap','12px');
const calendar=document.querySelector<HTMLElement>('#calendar')!;calendar.style.setProperty('--en-option-selected-font-weight','800');calendar.style.setProperty('--en-option-hover-background','var(--en-color-surface-subtle)');
for(const c of [appearance,size,gap])c.addEventListener('input',update);update();
if(new URLSearchParams(location.search).has('progress-report')){document.querySelector<HTMLElement>('#progress-return')!.hidden=false;for(const a of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')){const url=new URL(a.href);url.searchParams.set('progress-report','');a.href=url.href;}}
