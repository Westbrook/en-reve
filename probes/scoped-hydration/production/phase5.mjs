import {createHydrationIsland} from '@en-reve/ssr/client.js';
export {createElementScope} from '@en-reve/elements/element-scope.js';
let attempts=0;
export function create(options){return createHydrationIsland({...options,loaders:{commands:async()=>{
 attempts++;const params=new URLSearchParams(location.search);
 if(params.has('delay'))await new Promise(r=>setTimeout(r,1500));
 if(params.has('fail')&&attempts===1)throw Error('Review fixture: first module request failed.');
 return import('./island.mjs');
}}});}
