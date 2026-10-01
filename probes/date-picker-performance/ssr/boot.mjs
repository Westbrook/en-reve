import {createHydrationIsland} from '@en-reve/ssr/client.js';
const host=document.querySelector('#date'),root=host.shadowRoot??host;
const island=createHydrationIsland({root,manifest:JSON.parse(document.querySelector('#manifest').textContent),snapshot:{},loaders:{date:()=>import('./date.mjs')}});
window.ssrStudy={root,island,activate:()=>island.activate()};
document.querySelector('#hydrate').onclick=()=>island.activate();
