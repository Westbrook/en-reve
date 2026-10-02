import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import {render} from '@lit-labs/ssr';
import {collectResult} from '@lit-labs/ssr/lib/render-result.js';
import {LitElementRenderer} from '@lit-labs/ssr/lib/lit-element-renderer.js';
import {STATIC_STYLES_ATTRIBUTE,STATIC_STYLES_VERSION} from '@en-reve/primitives/interactions/static-styles.js';
import {writeFile} from 'node:fs/promises';
const {register,fixtureTemplate}=await import('./components-server.mjs');register();
class AppRenderer extends LitElementRenderer {
 renderShadow(info){const result=super.renderShadow(info);return Array.isArray(result)&&result[0]==='<style>'?[`<style ${STATIC_STYLES_ATTRIBUTE}="${STATIC_STYLES_VERSION}">`,...result.slice(1)]:result;}
}
const markup=await collectResult(render(fixtureTemplate(),{elementRenderers:[AppRenderer]}));
await writeFile(process.argv[2],`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native helper consumers</title><style>body{font:16px system-ui;margin:16px}#cards{display:grid;gap:16px;max-width:600px}iframe{width:640px;height:300px}</style></head><body><main id="cards">${markup}</main><script type="module">window.loadHelpers=()=>import('/client.js');window.hydrateHelpers=()=>window.loadHelpers().then(m=>m.start());</script></body></html>`);
