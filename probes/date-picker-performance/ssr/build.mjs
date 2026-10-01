import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createScopedRenderer,renderIslandMarkup} from '@en-reve/ssr/scoped.js';
import {build} from 'vite';
import assert from 'node:assert/strict';
const out=process.env.REVIEW_OUT;await mkdir(out,{recursive:true});
const renderer=createScopedRenderer({date:{module:new URL('./date.mjs',import.meta.url),version:'phase6-date-v1'}});
try{const result=await renderer.render({key:'date',snapshot:{}});
for(const delivery of ['global','shadow']){const island=renderIslandMarkup(result,'date',delivery);assert(!island.html.includes('<en-calendar'));assert(island.html.includes('type="date"'));
await writeFile(`${delivery}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Date SSR</title></head><body><h1>Deferred date SSR</h1><button id="hydrate">Hydrate date field</button>${island.html}<script id="manifest" type="application/json">${JSON.stringify(island.manifest)}</script><script type="module" src="/boot.mjs"></script></body></html>`);}
await build({configFile:false,build:{target:'es2022',outDir:out,emptyOutDir:true,rollupOptions:{input:{global:resolve('global.html'),shadow:resolve('shadow.html')}}}});
}finally{renderer.dispose();}
