import '../../packages/ssr/dist/install.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build } from './node_modules/esbuild/lib/main.js';
await import('@en-reve/elements/define/checkbox.js');
await import('@en-reve/elements/define/select.js');
const { renderToString } = await import('../../packages/ssr/dist/index.js');
const { fixtureTemplate } = await import('./fixture.mjs');
const root = fileURLToPath(new URL('.', import.meta.url));
const targets = ['html','react19','react18','vue3','vue2','svelte5','svelte4'];
await mkdir(join(root,'build'),{recursive:true});
const islandHtml = await renderToString(fixtureTemplate());
await build({ entryPoints:[join(root,'island-client.mjs')],bundle:true,format:'esm',target:'es2022',outfile:join(root,'build/island.js'),logLevel:'silent' });
const versions = {};
for (const name of targets) {
 const family = name.replace(/\d/g,'');
 const environment = join(root,'environments',name);
 const adapter = await import(`./adapters/${family}.mjs`);
 const {html,clientSource} = await adapter.render({environment,islandHtml});
 await build({ stdin:{ contents:clientSource,resolveDir:name==='html'?root:environment,sourcefile:'consumer.mjs'},bundle:true,format:'esm',target:'es2022',outfile:join(root,'build',`${name}.js`),define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent' });
 const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} consumption</title><style>body{font:16px system-ui;margin:2rem;max-width:50rem}button{font:inherit;margin:.25rem;padding:.5rem}en-select{display:block;margin:1rem 0}section{margin-block:1rem}output{display:block;margin-block:.5rem}</style></head><body><main id="framework-root">${html}</main><script type="module">window.hydrateFixture = async () => {const {startIsland} = await import('./island.js');await startIsland();const {start} = await import('./${name}.js');await start();await new Promise(requestAnimationFrame);document.documentElement.dataset.ready='true';}; if(!new URL(location.href).searchParams.has('defer')) await window.hydrateFixture();</script></body></html>`;
 await writeFile(join(root,'build',`${name}.html`),page);
 versions[name] = name==='html' ? 'native DOM + Lit3.3.3' : JSON.parse(await readFile(join(environment,'package.json'),'utf8')).dependencies;
}
await writeFile(join(root,'build/versions.json'),JSON.stringify(versions,null,2));
console.log('Built framework consumers:', targets.join(', '));
