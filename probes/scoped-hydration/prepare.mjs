import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from '../../showcases/performance/node_modules/esbuild/lib/main.js';
import {createScopedRenderer,renderIslandMarkup} from '../../packages/ssr/dist/scoped.js';
const out=resolve(process.env.EN_SCOPED_HYDRATION_OUT ?? 'artifacts/scoped-registry-phase-5/site');await mkdir(out,{recursive:true});
const renderer=createScopedRenderer({form:{module:new URL('../../packages/ssr/tests/scoped-fixtures/form.mjs',import.meta.url),version:'form'},one:{module:new URL('../../packages/ssr/tests/scoped-fixtures/one.mjs',import.meta.url),version:'one'},two:{module:new URL('../../packages/ssr/tests/scoped-fixtures/two.mjs',import.meta.url),version:'two'}});
try{const first=await renderer.render({key:'one',snapshot:{message:'Initial'}}),second=await renderer.render({key:'two',snapshot:{message:'Second'}});
const secondSame=await renderer.render({key:'one',snapshot:{message:'Second'}});
for(const delivery of ['shadow','global','template'])for(const dual of [false,true]){
 const islands=[renderIslandMarkup(first,'first',delivery),...(dual?[renderIslandMarkup(delivery==='template'?secondSame:second,'second',delivery)]:[])];
 await writeFile(resolve(out,`${delivery}${dual?'-dual':''}.html`),`<!doctype html><html lang="en"><meta charset="UTF-8"><title>Scoped hydration review</title><h1>Scoped hydration</h1><p>Native form fields remain usable before enhancement.</p><form id="fallback"><label>Essential draft <input name="essential" required autocomplete="name" value="Keep this"></label><button>Native save</button></form>${islands.map(i=>i.html).join('')}<script type="application/json" id="manifests">${JSON.stringify(islands.map(i=>i.manifest))}</script><script type="module" src="./boot.js"></script></html>`);
}
const form=await renderer.render({key:'form',snapshot:{message:'Initial'}});
for(const delivery of ['shadow','global']){const island=renderIslandMarkup(form,'first',delivery);await writeFile(resolve(out,`form-${delivery}.html`),`<!doctype html><html lang="en"><meta charset="UTF-8"><title>Managed field hydration</title>${island.html}<script type="application/json" id="manifests">${JSON.stringify([island.manifest])}</script><script type="module" src="./boot.js"></script></html>`);}
await build({entryPoints:[resolve('probes/scoped-hydration/boot.mjs')],outdir:out,bundle:true,splitting:true,platform:'browser',format:'esm',target:'es2022',metafile:true}).then(r=>writeFile(resolve(out,'metafile.json'),JSON.stringify(r.metafile,null,2)));
}finally{renderer.dispose();}
