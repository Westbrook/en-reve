import {createElementScope} from '../../packages/elements/dist/element-scope.js';
import {createHydrationIsland} from '../../packages/ssr/dist/client.js';
const params=new URLSearchParams(location.search),manifests=JSON.parse(document.querySelector('#manifests').textContent);
let release,attempts=0;const gate=new Promise(resolve=>release=resolve);
const first=async()=>{attempts++;if(params.has('hold'))await gate;if(params.has('fail')&&attempts===1)throw Error('Intentional chunk failure');return import('../../packages/ssr/tests/scoped-fixtures/one.mjs');};
const loaders={form:async()=>{attempts++;if(params.has('hold'))await gate;return import('../../packages/ssr/tests/scoped-fixtures/form.mjs');},one:first,two:()=>import('../../packages/ssr/tests/scoped-fixtures/two.mjs')};
const scopes=manifests.map(()=>(params.has('scoped-template')||params.has('light-template'))?createElementScope({document}):undefined);
if(params.has('light-template'))for(const [i,m]of manifests.entries()){const prior=document.getElementById(m.id),host=scopes[i].createElement('section');host.id=m.id;host.innerHTML=prior.innerHTML;prior.replaceWith(host);}
const templates=manifests.map(m=>document.getElementById(m.id).querySelector(':scope > template[data-en-island-template]')??undefined);
const roots=manifests.map((m,i)=>{const host=document.getElementById(m.id);return scopes[i]?.mode==='scoped'&&!params.has('light-template')?scopes[i].attachShadow(host):host.shadowRoot??host;});
const snapshots=manifests.map((_,i)=>({message:i?'Second':'Initial'}));
window.fixture={roots,snapshots,islands:manifests.map((manifest,i)=>createHydrationIsland({root:roots[i],manifest,snapshot:snapshots[i],loaders,scope:scopes[i],template:templates[i]})),release,get attempts(){return attempts;}};
